'use strict';
(function(){
  const MATERIAL_AI='ai-correction-material-beta-api';
  let homePending=false;
  let replacementSuccessPending=false;

  const originalStudentSubmitFile=studentSubmitFile;
  const originalStudentUploadSuccess=studentUploadSuccess;

  function isReplacementState(state){
    return !!state&&(state.replacement_requested===true||!!state.replacement_submission_id);
  }

  studentSubmitFile=async function(roundId,file,retried=false){
    const before=await studentSubmissionState(roundId).catch(()=>null);
    const replacement=isReplacementState(before);
    const result=await originalStudentSubmitFile(roundId,file,retried);
    if(!replacement)return result;

    const after=await studentSubmissionState(roundId).catch(()=>null);
    if(!after||isReplacementState(after)){
      throw Error('A nova imagem não foi salva. Tente novamente. A imagem anterior foi mantida.');
    }
    replacementSuccessPending=true;
    return {...result,replacement:true};
  };

  studentUploadSuccess=function(message='Redação enviada para correção.'){
    if(replacementSuccessPending){
      replacementSuccessPending=false;
      return originalStudentUploadSuccess('Nova imagem salva e enviada ao professor.');
    }
    return originalStudentUploadSuccess(message);
  };

  function openReplacementPage(roundId,backRoute){
    if(!roundId||S?.profile?.role!=='student')return;
    if(typeof chooseStudentFile!=='function'){
      toast('O envio por imagem não está disponível neste momento.');
      return;
    }
    const route=backRoute||'student-proposals';
    $('view').innerHTML=header('Refazer imagem','Envie uma nova foto completa e legível da redação.')+`<section class="spv" data-replacement-page="${esc(roundId)}"><article class="spv-panel"><div class="safe-note"><b>Antes de enviar</b><br>Use boa iluminação e foco, mostre todas as linhas e evite cortes, sombras e reflexos.</div><div class="spv-actions" style="margin-top:16px"><button type="button" class="btn primary spv-primary" data-v2-camera="${esc(roundId)}">Tirar nova foto</button><button type="button" class="btn soft-btn" data-v2-file="${esc(roundId)}">Selecionar novo arquivo</button><button type="button" class="btn ghost" data-replacement-back>Voltar</button></div></article></section>`;
    $('view').onclick=event=>{
      const back=event.target.closest('[data-replacement-back]');
      if(back)navigate(route);
    };
  }

  // Captura no window para executar antes dos listeners antigos do fluxo de aluno.
  window.addEventListener('click',event=>{
    if(S?.profile?.role!=='student')return;
    const home=event.target?.closest?.('[data-resend-round]');
    if(home){
      event.preventDefault();event.stopImmediatePropagation();
      openReplacementPage(home.dataset.resendRound,S.route==='student-home'?'student-home':'student-essays');
      return;
    }
    const proposal=event.target?.closest?.('[data-spv-send]');
    if(!proposal||!/refazer envio/i.test(String(proposal.textContent||'')))return;
    event.preventDefault();event.stopImmediatePropagation();
    openReplacementPage(proposal.dataset.spvSend,'student-proposals');
  },true);

  async function replacementRequests(roundIds){
    if(!roundIds.length)return [];
    const session=await ensure();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),12000);
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
      banner.className='sh-section';
      banner.dataset.replacementHomeNote='1';
      banner.style.borderColor='#e7c9c4';
      banner.style.background='#fffafa';
      banner.innerHTML=`<div class="sh-section-head" style="margin-bottom:8px"><h2>Nova imagem necessária</h2></div><p style="margin:0 0 12px">Seu professor solicitou uma nova foto de uma redação para continuar a correção.</p><button type="button" class="btn primary" data-resend-round="${esc(request.round_id)}">Refazer envio</button>`;
      view.querySelector('.student-home-v2')?.prepend(banner);
    }finally{homePending=false}
  }

  const view=$('view');
  if(view){
    new MutationObserver(()=>{
      if(S.route!=='student-home')delete view.dataset.replacementChecked;
      else if(!homePending)setTimeout(patchHome,60);
    }).observe(view,{subtree:true,childList:true});
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(patchHome,100),{once:true});
})();
