'use strict';
(function(){
  const MATERIAL_AI='ai-correction-material-beta-api';
  let homePending=false;

  function closeDialog(dialog){
    try{dialog.close()}catch{}
    dialog.remove();
  }

  function openReplacementPicker(roundId){
    if(!roundId||S?.profile?.role!=='student')return;
    document.querySelector('[data-direct-replacement-dialog]')?.remove();
    const dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';
    dialog.dataset.directReplacementDialog='1';
    dialog.innerHTML=`<h2>Refazer imagem</h2><p>Seu professor solicitou uma nova imagem desta redação.</p><div class="safe-note"><b>Antes de enviar:</b><br>Use boa iluminação e foco, mostre todas as linhas e evite cortes, sombras e reflexos.</div><div class="item-actions"><button type="button" class="btn primary" data-direct-camera>Tirar nova foto</button><button type="button" class="btn soft-btn" data-direct-file>Selecionar novo arquivo</button><button type="button" class="btn ghost" data-direct-cancel>Cancelar</button></div>`;
    document.body.appendChild(dialog);
    dialog.oncancel=event=>{event.preventDefault();closeDialog(dialog)};
    dialog.querySelector('[data-direct-cancel]').onclick=()=>closeDialog(dialog);
    dialog.querySelector('[data-direct-camera]').onclick=()=>{
      closeDialog(dialog);
      chooseStudentFile(roundId,true);
    };
    dialog.querySelector('[data-direct-file]').onclick=()=>{
      closeDialog(dialog);
      chooseStudentFile(roundId,false);
    };
    dialog.showModal();
  }

  document.addEventListener('click',event=>{
    if(S?.profile?.role!=='student')return;
    const direct=event.target?.closest?.('[data-direct-replacement]');
    if(direct){
      event.preventDefault();event.stopImmediatePropagation();
      openReplacementPicker(direct.dataset.directReplacement);return;
    }
    const send=event.target?.closest?.('[data-spv-send]');
    if(!send||!/refazer envio/i.test(String(send.textContent||'')))return;
    event.preventDefault();event.stopImmediatePropagation();
    openReplacementPicker(send.dataset.spvSend);
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
    if(view.dataset.directReplacementChecked==='1'||homePending)return;
    homePending=true;
    try{
      const proposals=await studentProposals(true);
      const ids=(proposals.proposals||[]).map(x=>x.id).filter(Boolean);
      const requests=await replacementRequests(ids);
      if(S.route!=='student-home'||!view.querySelector('.student-home-v2'))return;
      view.dataset.directReplacementChecked='1';
      if(!requests.length)return;
      const req=requests[0];
      if(view.querySelector('[data-replacement-home-note],[data-direct-replacement-home]'))return;
      const banner=document.createElement('section');
      banner.className='sh-section';
      banner.dataset.directReplacementHome='1';
      banner.style.borderColor='#e7c9c4';
      banner.style.background='#fffafa';
      banner.innerHTML=`<div class="sh-section-head" style="margin-bottom:8px"><h2>Nova imagem necessária</h2></div><p style="margin:0 0 12px">Seu professor solicitou uma nova foto de uma redação para continuar a correção.</p><button type="button" class="btn primary" data-direct-replacement="${esc(req.round_id)}">Refazer envio</button>`;
      view.querySelector('.student-home-v2')?.prepend(banner);
    }finally{homePending=false}
  }

  const view=$('view');
  if(view){
    new MutationObserver(()=>{
      if(S.route!=='student-home')delete view.dataset.directReplacementChecked;
      else if(!homePending)setTimeout(patchHome,40);
    }).observe(view,{subtree:true,childList:true});
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(patchHome,80),{once:true});
})();
