'use strict';
(function(){
  const RETRY_API='ai-correction-material-beta-api';
  const replacementRounds=new Set();
  const submissionToRound=new Map();
  const originalStudentSubmitJson=studentSubmitJson;
  const originalStudentHome=typeof renderStudentHome==='function'?renderStudentHome:null;
  const originalStudentEssays=typeof renderStudentEssays==='function'?renderStudentEssays:null;

  function rememberState(state){
    if(!state?.round_id)return;
    const roundId=String(state.round_id);
    if(state.replacement_requested===true){
      replacementRounds.add(roundId);
      state.editable=true;
      const submissionId=state.replacement_submission_id||state.submission?.id;
      if(submissionId)submissionToRound.set(String(submissionId),roundId);
    }else{
      replacementRounds.delete(roundId);
    }
  }

  studentSubmitJson=async function(body,retried=false){
    const data=await originalStudentSubmitJson(body,retried);
    const states=data?.states||(data?.round_id?[data]:[]);
    states.forEach(rememberState);
    schedulePatch();
    return data;
  };

  async function refreshReplacementStates(){
    try{
      const proposals=await studentProposals(true);
      const ids=(proposals.proposals||[]).map(x=>x.id);
      if(!ids.length)return [];
      const data=await studentSubmitJson({action:'states',round_ids:ids});
      return data?.states||[];
    }catch(error){
      console.warn('replacement states',error);
      return [];
    }
  }

  function patchProposalUI(){
    if(S?.profile?.role!=='student')return;
    for(const roundId of replacementRounds){
      const escaped=CSS.escape(roundId);
      const card=document.querySelector(`[data-spv-open="${escaped}"]`);
      if(card){
        const status=card.querySelector('.spv-status');
        if(status)status.textContent='Refazer imagem';
        const text=card.querySelector('.spv-card-main>p');
        if(text)text.textContent='Seu professor solicitou uma nova imagem da redação.';
      }
      document.querySelectorAll(`[data-spv-send="${escaped}"]`).forEach(button=>{
        button.textContent='Refazer envio';
        const panel=button.closest('.spv-panel');
        if(panel){
          const status=panel.querySelector('.spv-status');
          if(status)status.textContent='Refazer imagem';
          const info=panel.querySelector('.spv-info-grid .spv-info:last-child span');
          if(info)info.textContent='Seu professor solicitou uma nova imagem. Refaça a foto para continuar a correção.';
        }
      });
      const camera=document.querySelector(`[data-v2-camera="${escaped}"]`);
      if(camera){
        const label=camera.querySelector('span');
        if(label)label.textContent='Tirar nova foto';
        const paste=document.querySelector(`[data-v2-paste="${escaped}"]`);
        if(paste)paste.style.display='none';
        const grid=camera.closest('.spv-send-grid');
        if(grid&&!grid.parentElement.querySelector('[data-replacement-camera-note]')){
          const note=document.createElement('div');
          note.className='safe-note';
          note.dataset.replacementCameraNote='1';
          note.innerHTML='<b>Nova imagem necessária.</b> Tire uma nova foto com boa iluminação e foco, sem cortar nenhuma linha. Use flash apenas se necessário e evite reflexos.';
          grid.before(note);
        }
      }
    }
  }

  function patchEssayCards(){
    document.querySelectorAll('[data-own-view]').forEach(button=>{
      const submissionId=String(button.dataset.ownView||'');
      const roundId=submissionToRound.get(submissionId);
      if(!roundId||!replacementRounds.has(roundId))return;
      const card=button.closest('.student-submission');
      if(!card)return;
      const pill=card.querySelector('.pill');
      if(pill){pill.textContent='Nova imagem necessária';pill.classList.remove('ok');pill.classList.add('warn');}
      const generic=[...card.querySelectorAll('.safe-note')].find(x=>/Nota, competências e devolutiva/i.test(x.textContent||''));
      if(generic)generic.innerHTML='<b>Nova imagem necessária.</b><br>Seu professor solicitou que você refaça a foto desta redação para continuar a correção.';
      let actions=card.querySelector('.item-actions');
      if(!actions){actions=document.createElement('div');actions.className='item-actions';card.appendChild(actions);}
      if(!actions.querySelector(`[data-resend-round="${CSS.escape(roundId)}"]`)){
        const resend=document.createElement('button');
        resend.type='button';resend.className='btn primary';resend.dataset.resendRound=roundId;resend.textContent='Refazer imagem';
        actions.prepend(resend);
      }
    });
  }

  function homeAlert(roundId){
    let banner=$('view')?.querySelector('[data-material-home-note],[data-replacement-home-note]');
    if(!banner){
      banner=document.createElement('div');
      banner.className='safe-note';banner.dataset.replacementHomeNote='1';banner.style.marginBottom='16px';
      const head=$('view')?.querySelector('.page-head');if(head)head.after(banner);else $('view')?.prepend(banner);
    }
    banner.innerHTML='<b>Ação necessária: refaça a imagem da redação.</b><br>Seu professor solicitou uma nova foto para que a correção possa continuar.<div style="margin-top:10px"><button type="button" class="btn primary" data-resend-round="'+esc(roundId)+'">Refazer envio</button></div>';
  }

  async function openReplacement(roundId){
    await navigate('student-proposals');
    for(let i=0;i<30;i++){
      const card=document.querySelector(`[data-spv-open="${CSS.escape(roundId)}"]`);
      if(card){card.click();break}
      await new Promise(r=>setTimeout(r,50));
    }
    for(let i=0;i<30;i++){
      const button=document.querySelector(`[data-spv-send="${CSS.escape(roundId)}"]`);
      if(button){button.click();return}
      await new Promise(r=>setTimeout(r,50));
    }
    toast('Abra a proposta e toque em “Refazer envio”.');
  }

  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('[data-resend-round]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    openReplacement(button.dataset.resendRound);
  },true);

  let patchQueued=false;
  function schedulePatch(){
    if(patchQueued)return;
    patchQueued=true;
    queueMicrotask(()=>{patchQueued=false;patchProposalUI();patchEssayCards();});
  }
  new MutationObserver(schedulePatch).observe(document.documentElement,{subtree:true,childList:true});

  if(originalStudentHome){
    renderStudentHome=async function(navigation){
      await originalStudentHome(navigation);
      if(S.route!=='student-home'||S.profile?.role!=='student')return;
      const states=await refreshReplacementStates();
      if(!navigationCurrent(navigation)||S.route!=='student-home')return;
      const pending=states.find(x=>x.replacement_requested===true);
      if(pending)homeAlert(String(pending.round_id));
      schedulePatch();
    };
  }

  if(originalStudentEssays){
    renderStudentEssays=async function(navigation){
      await originalStudentEssays(navigation);
      if(S.route!=='student-essays'||S.profile?.role!=='student')return;
      await refreshReplacementStates();
      if(!navigationCurrent(navigation)||S.route!=='student-essays')return;
      patchEssayCards();
    };
  }

  schedulePatch();
})();
