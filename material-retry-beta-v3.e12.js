'use strict';
(function(){
  const MATERIAL_AI='ai-correction-material-beta-api';
  const originalEdge=edge;
  const originalAiShowJob=aiShowJob;
  const originalStudentSubmitJson=studentSubmitJson;
  const originalStudentSubmitFile=studentSubmitFile;
  const replacementRounds=new Map();

  API.ai=MATERIAL_AI;

  async function betaEdge(slug,body={},retried=false){
    const session=await ensure();
    const response=await fetch(`${BASE}/functions/v1/${slug}`,{
      method:'POST',
      headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    if(response.status===401&&!retried){
      const refreshed=await refreshSession(S.session);
      if(refreshed){S.session=refreshed;return betaEdge(slug,body,true)}
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.error){
      const error=Error(typeof data.error==='string'?data.error:'Falha na operação.');
      error.code=data.code;error.refunded=data.refunded===true;error.job=data.job||null;
      throw error;
    }
    return data;
  }

  edge=async function(slug,body={},retried=false){
    if(slug===MATERIAL_AI)return betaEdge(slug,body,retried);
    return originalEdge(slug,body,retried);
  };

  function correctionRow(id){return (S.cache.correctionRows||[]).find(x=>x.submission_id===id)||{}}
  function isFailedRow(row){const status=row?._channels?.ai?.status??row?.job_status;return ['failed','cancelled'].includes(status)}
  function flowShell(id,body){
    const row=correctionRow(id);
    $('view').innerHTML=`<section class="cx-flow"><button class="btn ghost cx-back" id="materialBack">← Voltar para correções</button><div class="cx-panel"><div class="cx-name">${esc(row.student_name||'Redação')}</div><div class="cx-theme">${esc(row.theme||'')}</div>${body}</div></section>`;
    $('materialBack').onclick=()=>navigate('correction');
  }
  function openOriginal(id){
    flowShell(id,`<h2 class="cx-title">Redação</h2><div id="materialEssay-${esc(id)}"></div>`);
    openEssay(id,$('materialEssay-'+id));
  }
  function openManual(id){
    flowShell(id,`<h2 class="cx-title">Correção manual</h2><p class="cx-sub">Edite a correção e publique quando estiver pronta.</p><div class="cx-manual"><div id="slot-${esc(id)}"></div></div>`);
    manualCorrection(id);
    $('view').onclick=async event=>{
      const save=event.target.closest('[data-save-manual]');if(save)return saveManual(save.dataset.saveManual,false);
      const publish=event.target.closest('[data-publish-manual]');if(publish)return saveManual(publish.dataset.publishManual,true);
    };
    $('materialBack').onclick=()=>navigate('correction');
  }
  function openFailed(id){
    flowShell(id,`<div id="slot-${esc(id)}"><div class="box"><div class="box-body"><div class="cx-process"><div class="cx-ring"></div><h2>Verificando tentativa</h2><p>Carregando o motivo da falha.</p></div></div></div></div>`);
    aiCorrection(id,{readOnly:true});
  }
  async function confirmNewAttempt(id){
    let balance=null;
    try{const data=await edge(API.credit,{action:'packages'}),value=Number(data.balance);if(Number.isFinite(value))balance=value}catch{}
    const ok=typeof appConfirm==='function'
      ?await appConfirm(`Confirmar nova correção com IA? Esta nova tentativa usa 1 crédito.${balance===null?'':` Saldo disponível: ${balance} crédito${balance===1?'':'s'}.`}`)
      :confirm('Confirmar nova correção com IA? Esta nova tentativa usa 1 crédito.');
    if(!ok)return;
    flowShell(id,`<div id="slot-${esc(id)}"><div class="split"><div class="essay-pane"></div><div class="box"><div class="box-body"><div class="cx-process"><div class="cx-ring"></div><h2>Analisando nova imagem</h2><p>A Inteligência VERSÃO está preparando uma nova correção.</p></div></div></div></div></div>`);
    await aiCorrection(id,{retry:true});
  }

  function renderMaterialFailure(ctx,job){
    if(!ctx?.box||!ctx.box.isConnected)return;
    try{aiPending(ctx.key,false)}catch{}
    try{aiQueueStatus(ctx.id,'failed')}catch{}
    const result=job?.result||{};
    const received=!!result.new_image_received_at;
    const requested=result.request_new_image===true&&!received;
    const message=job?.error_message||'A imagem enviada não permite uma correção segura.';
    let title='Nova imagem necessária',description='A imagem enviada não permite uma correção segura.';
    let primary='';
    if(received){
      title='Nova imagem recebida';
      description='O aluno substituiu a imagem. A redação está pronta para uma nova tentativa de correção.';
      primary='<button class="btn primary" data-material-retry>Corrigir nova imagem com IA</button>';
    }else if(requested){
      title='Aguardando nova imagem';
      description='O aluno já foi avisado para substituir a imagem desta redação.';
    }else{
      primary='<button class="btn primary" data-material-request>Solicitar nova imagem ao aluno</button>';
    }
    ctx.box.innerHTML=`<div class="box-body"><div class="cx-result"><h2>${esc(title)}</h2><p>${esc(description)}</p><div class="cx-info err">${esc(message)}</div><div class="cx-info"><b>Crédito consumido.</b> Esta tentativa foi processada, mas o material enviado não permitiu uma leitura segura.${received?' Uma nova tentativa com IA usa 1 crédito.':''}</div><div class="cx-actions">${primary}<button class="btn soft-btn" data-material-manual>Corrigir manualmente</button><button class="btn ghost" data-material-view>Ver redação</button></div></div></div>`;
    const request=ctx.box.querySelector('[data-material-request]');
    if(request)request.onclick=async()=>{
      request.disabled=true;request.textContent='Solicitando...';
      try{
        await edge(MATERIAL_AI,{action:'request_new_image',submission_id:ctx.id,job_id:job.id});
        S.cache.queue=null;
        const current=await edge(MATERIAL_AI,{action:'get',submission_id:ctx.id});
        renderMaterialFailure(ctx,current.job||job);
        toast('Solicitação enviada ao aluno.');
      }catch(error){request.disabled=false;request.textContent='Solicitar nova imagem ao aluno';toast(error.message||'Não foi possível solicitar a nova imagem.');}
    };
    const retry=ctx.box.querySelector('[data-material-retry]');if(retry)retry.onclick=()=>confirmNewAttempt(ctx.id);
    ctx.box.querySelector('[data-material-manual]').onclick=()=>openManual(ctx.id);
    ctx.box.querySelector('[data-material-view]').onclick=()=>openOriginal(ctx.id);
  }

  aiShowJob=async function(ctx,job){
    if(job?.status==='failed'&&job?.result?.failure_kind==='user_input'){
      renderMaterialFailure(ctx,job);return true;
    }
    return originalAiShowJob(ctx,job);
  };

  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('[data-cx-ai]');
    if(!button)return;
    const row=correctionRow(button.dataset.cxAi);
    if(isFailedRow(row)){
      event.preventDefault();event.stopImmediatePropagation();openFailed(button.dataset.cxAi);
    }
  },true);

  function patchTeacherButtons(){
    if(!['teacher','super_admin'].includes(S?.profile?.role)||S.route!=='correction')return;
    document.querySelectorAll('[data-cx-ai]').forEach(button=>{
      const row=correctionRow(button.dataset.cxAi);
      if(isFailedRow(row)&&button.textContent!=='Ver falha')button.textContent='Ver falha';
    });
  }
  new MutationObserver(()=>patchTeacherButtons()).observe(document.documentElement,{subtree:true,childList:true});

  function mergeReplacementStates(data,ids){
    const idSet=new Set(ids.map(String));
    for(const id of idSet)replacementRounds.delete(id);
    return edge(MATERIAL_AI,{action:'student_replacement_states',round_ids:[...idSet]}).then(extra=>{
      for(const req of extra.requests||[])replacementRounds.set(String(req.round_id),req);
      const states=data?.states||(data?.round_id?[data]:[]);
      for(const state of states){
        const req=replacementRounds.get(String(state.round_id));
        if(req){
          state.replacement_requested=true;
          state.replacement_message=req.message;
          state.replacement_submission_id=req.submission_id;
          state.editable=true;
        }
      }
      return data;
    }).catch(()=>data);
  }

  studentSubmitJson=async function(body,retried=false){
    const action=String(body?.action||'');
    const roundId=String(body?.round_id||'');
    if(action==='paste'&&replacementRounds.has(roundId))throw Error('Envie uma nova foto ou arquivo da redação. O texto colado não substitui a imagem solicitada.');
    const data=await originalStudentSubmitJson(body,retried);
    if(action==='states')return mergeReplacementStates(data,Array.isArray(body.round_ids)?body.round_ids:[]);
    if(action==='state')return mergeReplacementStates(data,[body.round_id]);
    return data;
  };

  studentSubmitFile=async function(roundId,file,retried=false){
    const data=await originalStudentSubmitFile(roundId,file,retried);
    const submissionId=data?.submission?.id;
    if(submissionId&&replacementRounds.has(String(roundId))){
      try{
        await edge(MATERIAL_AI,{action:'student_mark_replaced',submission_id:submissionId});
        replacementRounds.delete(String(roundId));
      }catch(error){console.warn('material replacement marker',error)}
    }
    return data;
  };
})();
