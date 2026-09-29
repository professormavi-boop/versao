'use strict';
(function(){
  function closeDialog(dialog){
    try{dialog.close()}catch{}
    dialog.remove();
  }

  function openReplacementChoice(roundId){
    if(!roundId||S?.profile?.role!=='student')return;
    if(typeof chooseStudentFile!=='function'){
      toast('O envio por imagem não está disponível neste momento.');
      return;
    }
    document.querySelectorAll('dialog[data-replacement-choice]').forEach(dialog=>closeDialog(dialog));
    const dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';
    dialog.dataset.replacementChoice='1';
    dialog.innerHTML=`<h2>Refazer imagem</h2><p>Envie uma nova imagem completa e legível da redação.</p><div class="safe-note"><b>Antes de enviar:</b> use boa iluminação e foco, mostre todas as linhas e evite cortes, sombras e reflexos.</div><div class="item-actions"><button type="button" class="btn primary" data-replacement-camera>Tirar nova foto</button><button type="button" class="btn soft-btn" data-replacement-file>Selecionar arquivo</button><button type="button" class="btn ghost" data-replacement-cancel>Cancelar</button></div>`;
    document.body.appendChild(dialog);
    dialog.oncancel=event=>{event.preventDefault();closeDialog(dialog)};
    dialog.querySelector('[data-replacement-cancel]').onclick=()=>closeDialog(dialog);
    dialog.querySelector('[data-replacement-camera]').onclick=()=>{
      closeDialog(dialog);
      chooseStudentFile(String(roundId),true);
    };
    dialog.querySelector('[data-replacement-file]').onclick=()=>{
      closeDialog(dialog);
      chooseStudentFile(String(roundId),false);
    };
    dialog.showModal();
  }

  document.addEventListener('click',event=>{
    if(S?.profile?.role!=='student')return;
    const home=event.target?.closest?.('[data-resend-round]');
    if(home){
      event.preventDefault();event.stopImmediatePropagation();
      openReplacementChoice(home.dataset.resendRound);
      return;
    }
    const proposal=event.target?.closest?.('[data-spv-send]');
    if(!proposal||!/refazer envio/i.test(String(proposal.textContent||'')))return;
    event.preventDefault();event.stopImmediatePropagation();
    openReplacementChoice(proposal.dataset.spvSend);
  },true);
})();
