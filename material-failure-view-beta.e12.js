'use strict';
(function(){
  const MATERIAL_AI='ai-correction-material-beta-api';
  const rowFor=id=>(S.cache.correctionRows||[]).find(x=>x.submission_id===id)||{};
  const failed=row=>['failed','cancelled'].includes(row?._channels?.ai?.status??row?.job_status);

  async function callMaterial(body,retried=false){
    const session=await ensure();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(`${BASE}/functions/v1/${MATERIAL_AI}`,{
        method:'POST',signal:controller.signal,
        headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      if(response.status===401&&!retried){
        const refreshed=await refreshSession(S.session);
        if(refreshed){S.session=refreshed;return callMaterial(body,true)}
      }
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.error)throw Error(typeof data.error==='string'?data.error:'Não foi possível consultar a tentativa.');
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw Error('A consulta demorou demais. Tente novamente.');
      throw error;
    }finally{clearTimeout(timer)}
  }

  function shell(id){
    const row=rowFor(id);
    $('view').innerHTML=`<section class="cx-flow"><button class="btn ghost cx-back" id="mfBack">← Voltar para correções</button><div class="cx-panel"><div class="cx-name">${esc(row.student_name||'Redação')}</div><div class="cx-theme">${esc(row.theme||'')}</div><div id="slot-${esc(id)}"><div id="mfBox" class="box"><div class="box-body"><div class="cx-process"><div class="cx-ring"></div><h2>Carregando tentativa</h2><p>Consultando o estado da correção.</p></div></div></div></div></div></section>`;
    $('mfBack').onclick=()=>navigate('correction');
    return $('mfBox');
  }

  function showEssay(id){
    const box=$('mfBox');if(!box)return;
    let viewer=$('mfEssay');
    if(!viewer){viewer=document.createElement('div');viewer.id='mfEssay';viewer.style.marginTop='16px';box.after(viewer);}
    openEssay(id,viewer);
  }

  function showManual(id){
    const row=rowFor(id);
    $('view').innerHTML=`<section class="cx-flow"><button class="btn ghost cx-back" id="mfManualBack">← Voltar</button><div class="cx-panel"><div class="cx-name">${esc(row.student_name||'Redação')}</div><div class="cx-theme">${esc(row.theme||'')}</div><div id="slot-${esc(id)}"></div></div></section>`;
    $('mfManualBack').onclick=()=>openFailed(id);
    manualCorrection(id);
  }

  function render(id,job){
    const box=$('mfBox');if(!box)return;
    const result=job?.result||{};
    const received=!!result.new_image_received_at;
    const requested=result.request_new_image===true&&!received;
    const message=job?.error_message||'A imagem enviada não permite uma correção segura.';
    const title=received?'Nova imagem recebida':requested?'Aguardando nova imagem':'Nova imagem necessária';
    const description=received?'O aluno substituiu a imagem. A redação está pronta para uma nova correção.':requested?'O aluno já foi avisado para refazer a imagem.':'Solicite ao aluno uma nova imagem para continuar.';
    const primary=received?'<button class="btn primary" data-mf-retry>Corrigir nova imagem com IA</button>':requested?'':'<button class="btn primary" data-mf-request>Solicitar nova imagem ao aluno</button>';
    box.innerHTML=`<div class="box-body"><div class="cx-result"><h2>${esc(title)}</h2><p>${esc(description)}</p><div class="cx-info err">${esc(message)}</div><div class="cx-info"><b>Crédito consumido.</b> A tentativa foi processada, mas o material não permitiu uma leitura segura.${received?' A nova tentativa usará 1 crédito.':''}</div><div class="cx-actions">${primary}<button class="btn soft-btn" data-mf-manual>Corrigir manualmente</button><button class="btn ghost" data-mf-view>Ver redação</button></div></div></div>`;
    box.querySelector('[data-mf-view]').onclick=()=>showEssay(id);
    box.querySelector('[data-mf-manual]').onclick=()=>showManual(id);
    const request=box.querySelector('[data-mf-request]');
    if(request)request.onclick=async()=>{
      request.disabled=true;request.textContent='Solicitando...';
      try{await callMaterial({action:'request_new_image',submission_id:id,job_id:job.id});S.cache.queue=null;await load(id);toast('Solicitação enviada ao aluno.');}
      catch(error){request.disabled=false;request.textContent='Solicitar nova imagem ao aluno';toast(error.message||'Não foi possível solicitar a nova imagem.');}
    };
    const retry=box.querySelector('[data-mf-retry]');
    if(retry)retry.onclick=async()=>{
      retry.disabled=true;
      try{await aiCorrection(id,{retry:true});}
      catch(error){retry.disabled=false;toast(error.message||'Não foi possível iniciar a nova correção.');}
    };
  }

  async function load(id){
    const box=$('mfBox');if(!box)return;
    try{
      const data=await callMaterial({action:'get',submission_id:id});
      if(!data?.job)throw Error('A tentativa não foi encontrada.');
      render(id,data.job);
    }catch(error){
      box.innerHTML=`<div class="box-body"><h2>Não foi possível carregar</h2><p>${esc(error.message||'Falha ao consultar a tentativa.')}</p><div class="cx-actions"><button class="btn primary" data-mf-load>Tentar novamente</button><button class="btn ghost" data-mf-back>Voltar para correções</button></div></div>`;
      box.querySelector('[data-mf-load]').onclick=()=>load(id);
      box.querySelector('[data-mf-back]').onclick=()=>navigate('correction');
    }
  }

  function openFailed(id){shell(id);load(id);}

  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('[data-cx-ai]');
    if(!button)return;
    if(!failed(rowFor(button.dataset.cxAi)))return;
    event.preventDefault();event.stopImmediatePropagation();
    openFailed(button.dataset.cxAi);
  },true);
})();
