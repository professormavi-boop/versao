'use strict';
(function(){
  const MATERIAL_AI='ai-correction-material-beta-api';
  const MAX_FILE=typeof STUDENT_UPLOAD_MAX==='number'?STUDENT_UPLOAD_MAX:15*1024*1024;
  let homePending=false;

  function mimeOf(file){
    if(typeof studentUploadMime==='function')return studentUploadMime(file);
    const name=String(file?.name||'').toLowerCase(),type=String(file?.type||'').toLowerCase();
    if(type==='image/jpeg'||/\.jpe?g$/.test(name))return'image/jpeg';
    if(type==='image/png'||name.endsWith('.png'))return'image/png';
    if(type==='image/webp'||name.endsWith('.webp'))return'image/webp';
    if(type==='application/pdf'||name.endsWith('.pdf'))return'application/pdf';
    return'';
  }

  async function uploadReplacement(roundId,file,retried=false){
    const mime=mimeOf(file);
    if(!mime)throw Error('Formato não permitido. Use JPG, PNG, WEBP ou PDF.');
    if(!file?.size)throw Error('O arquivo está vazio.');
    if(file.size>MAX_FILE)throw Error('O arquivo excede 15 MB.');
    const session=await ensure();
    const query=new URLSearchParams({mode:'file',round_id:String(roundId),name:file.name||'redacao'});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),120000);
    try{
      const response=await fetch(`${BASE}/functions/v1/student-submit-v2-api?${query.toString()}`,{
        method:'POST',signal:controller.signal,
        headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':mime},
        body:file
      });
      if(response.status===401&&!retried){
        const refreshed=await refreshSession(S.session);
        if(refreshed){S.session=refreshed;return uploadReplacement(roundId,file,true)}
      }
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.error)throw Error(data.error||`Falha no envio (${response.status}).`);
      if(data.replacement!==true)throw Error('A nova imagem não foi reconhecida como reenvio. A imagem anterior foi mantida.');
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw Error('O envio demorou demais. Verifique sua conexão e tente novamente.');
      if(error instanceof TypeError)throw Error('A conexão caiu durante o envio. Tente novamente.');
      throw error;
    }finally{clearTimeout(timer)}
  }

  function openReplacementPage(roundId,backRoute='student-proposals'){
    if(!roundId||S?.profile?.role!=='student')return;
    $('view').innerHTML=header('Refazer imagem','Escolha como deseja enviar a nova imagem da redação.')+`<section class="spv"><article class="spv-panel"><div class="safe-note"><b>Nova imagem necessária.</b><br>Use boa iluminação e foco, mostre todas as linhas e evite cortes, sombras e reflexos.</div><div class="spv-actions" style="margin-top:16px"><button type="button" class="btn primary spv-primary" data-replacement-camera="${esc(roundId)}">Tirar nova foto</button><button type="button" class="btn soft-btn" data-replacement-file="${esc(roundId)}">Selecionar arquivo</button><button type="button" class="btn ghost" data-replacement-back="${esc(backRoute)}">Voltar</button></div></article></section>`;
  }

  function chooseReplacementFile(roundId,camera,backRoute='student-proposals'){
    const input=document.createElement('input');
    input.type='file';input.hidden=true;
    input.accept=camera?'image/jpeg,image/png,image/webp':'image/jpeg,image/png,image/webp,application/pdf';
    if(camera)input.setAttribute('capture','environment');
    document.body.appendChild(input);
    const cleanup=()=>input.remove();
    input.onchange=()=>{
      const file=input.files?.[0];
      if(!file){cleanup();return}
      const mime=mimeOf(file);
      if(!mime||file.size>MAX_FILE){cleanup();studentUploadError('Use JPG, PNG, WEBP ou PDF de até 15 MB.');return}
      cleanup();
      renderReplacementPreview(roundId,file,camera,backRoute);
    };
    input.click();
  }

  function renderReplacementSuccess(){
    $('view').innerHTML=header('Nova imagem enviada','O reenvio foi concluído com sucesso.')+`<section class="spv"><article class="spv-panel"><div class="safe-note" style="background:#f3fbf5;border-color:#cfe7d5"><b>Nova imagem salva com sucesso.</b><br>O professor já pode continuar a correção desta mesma redação.</div><div class="spv-actions" style="margin-top:16px"><button type="button" class="btn primary spv-primary" data-replacement-success-home>Voltar ao início</button><button type="button" class="btn soft-btn" data-replacement-success-essays>Minhas redações</button></div></article></section>`;
    $('view').onclick=event=>{
      if(event.target.closest('[data-replacement-success-home]')){navigate('student-home');return}
      if(event.target.closest('[data-replacement-success-essays]'))navigate('student-essays');
    };
  }

  function renderReplacementPreview(roundId,file,camera,backRoute){
    const mime=mimeOf(file),objectUrl=mime.startsWith('image/')?URL.createObjectURL(file):'';
    const preview=objectUrl
      ?`<img src="${objectUrl}" alt="Prévia da nova imagem" style="display:block;max-width:100%;max-height:58vh;margin:0 auto 16px;object-fit:contain;border-radius:14px">`
      :`<div class="safe-note"><b>Arquivo selecionado:</b><br>${esc(file.name||'Redação')}</div>`;
    const size=typeof studentUploadSizeLabel==='function'?studentUploadSizeLabel(file.size):`${Math.round(file.size/1024)} KB`;
    $('view').innerHTML=header('Conferir nova imagem','Confira se a redação está completa e legível antes de enviar.')+`<section class="spv"><article class="spv-panel">${preview}<p style="margin:0 0 14px"><b>${esc(file.name||'Redação')}</b><br><span class="muted">${esc(size)}</span></p><div class="safe-note" data-replacement-error style="display:none"></div><div class="spv-actions"><button type="button" class="btn primary spv-primary" data-replacement-send>Enviar nova imagem</button><button type="button" class="btn soft-btn" data-replacement-change>${camera?'Tirar outra foto':'Escolher outro arquivo'}</button><button type="button" class="btn ghost" data-replacement-cancel>Cancelar</button></div></article></section>`;
    const revoke=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl)};
    $('view').onclick=async event=>{
      const change=event.target.closest('[data-replacement-change]');
      if(change){revoke();chooseReplacementFile(roundId,camera,backRoute);return}
      const cancel=event.target.closest('[data-replacement-cancel]');
      if(cancel){revoke();openReplacementPage(roundId,backRoute);return}
      const send=event.target.closest('[data-replacement-send]');
      if(!send)return;
      const errorBox=$('view').querySelector('[data-replacement-error]');
      send.disabled=true;send.textContent='Enviando...';
      if(errorBox){errorBox.style.display='none';errorBox.textContent=''}
      try{
        await uploadReplacement(roundId,file);
        S.cache={};S.student=null;revoke();
        renderReplacementSuccess();
      }catch(error){
        send.disabled=false;send.textContent='Enviar nova imagem';
        if(errorBox){errorBox.style.display='block';errorBox.textContent=error.message||'Não foi possível salvar a nova imagem.'}
        else studentUploadError(error.message||'Não foi possível salvar a nova imagem.');
      }
    };
  }

  window.addEventListener('click',event=>{
    if(S?.profile?.role!=='student')return;
    const resend=event.target?.closest?.('[data-resend-round]');
    if(resend){
      event.preventDefault();event.stopImmediatePropagation();
      openReplacementPage(resend.dataset.resendRound,S.route==='student-home'?'student-home':'student-essays');
      return;
    }
    const proposal=event.target?.closest?.('[data-spv-send]');
    if(proposal&&/refazer envio|refazer imagem/i.test(String(proposal.textContent||''))){
      event.preventDefault();event.stopImmediatePropagation();
      openReplacementPage(proposal.dataset.spvSend,'student-proposals');
      return;
    }
    const camera=event.target?.closest?.('[data-replacement-camera]');
    if(camera){
      event.preventDefault();event.stopImmediatePropagation();
      chooseReplacementFile(camera.dataset.replacementCamera,true,'student-proposals');
      return;
    }
    const file=event.target?.closest?.('[data-replacement-file]');
    if(file){
      event.preventDefault();event.stopImmediatePropagation();
      chooseReplacementFile(file.dataset.replacementFile,false,'student-proposals');
      return;
    }
    const back=event.target?.closest?.('[data-replacement-back]');
    if(back){event.preventDefault();event.stopImmediatePropagation();navigate(back.dataset.replacementBack||'student-proposals')}
  },true);

  async function replacementRequests(roundIds){
    if(!roundIds.length)return [];
    const session=await ensure();
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(`${BASE}/functions/v1/${MATERIAL_AI}`,{
        method:'POST',signal:controller.signal,
        headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
        body:JSON.stringify({action:'student_replacement_states',round_ids:roundIds})
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.error)return [];
      return Array.isArray(data.requests)?data.requests:[];
    }catch{return []}
    finally{clearTimeout(timer)}
  }

  async function patchHome(){
    const view=$('view');
    if(!view||S?.profile?.role!=='student'||S.route!=='student-home'||!view.querySelector('.student-home-v2'))return;
    if(view.dataset.replacementChecked==='1'||homePending)return;
    homePending=true;
    try{
      const proposals=await studentProposals(true);
      const ids=(proposals.proposals||[]).map(item=>item.id).filter(Boolean);
      const requests=await replacementRequests(ids);
      if(S.route!=='student-home'||!view.querySelector('.student-home-v2'))return;
      view.dataset.replacementChecked='1';
      if(!requests.length||view.querySelector('[data-replacement-home-note]'))return;
      const request=requests[0];
      const banner=document.createElement('section');
      banner.className='sh-section';banner.dataset.replacementHomeNote='1';
      banner.style.borderColor='#e7c9c4';banner.style.background='#fffafa';
      banner.innerHTML=`<div class="sh-section-head" style="margin-bottom:8px"><h2>Nova imagem necessária</h2></div><p style="margin:0 0 12px">Seu professor solicitou uma nova foto para continuar a correção.</p><button type="button" class="btn primary" data-resend-round="${esc(request.round_id)}">Refazer imagem</button>`;
      view.querySelector('.student-home-v2')?.prepend(banner);
    }finally{homePending=false}
  }

  const view=$('view');
  if(view)new MutationObserver(()=>{
    if(S.route!=='student-home')delete view.dataset.replacementChecked;
    else if(!homePending)setTimeout(patchHome,60);
  }).observe(view,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',()=>setTimeout(patchHome,100),{once:true});
})();
