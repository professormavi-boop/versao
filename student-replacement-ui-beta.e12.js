'use strict';
(function(){
  const replacementRounds=new Set();
  const submissionToRound=new Map();
  const previousStudentSubmitJson=studentSubmitJson;
  const originalStudentHome=typeof renderStudentHome==='function'?renderStudentHome:null;
  const originalStudentEssays=typeof renderStudentEssays==='function'?renderStudentEssays:null;

  function clearRequested(body={}){
    const action=String(body.action||'');
    if(action==='states'&&Array.isArray(body.round_ids))body.round_ids.forEach(id=>replacementRounds.delete(String(id)));
    if(action==='state'&&body.round_id)replacementRounds.delete(String(body.round_id));
  }

  function absorbStates(data){
    const states=data?.states||(data?.round_id?[data]:[]);
    for(const state of states){
      if(!state?.round_id)continue;
      const roundId=String(state.round_id);
      if(state.replacement_requested===true){
        replacementRounds.add(roundId);
        state.editable=true;
        const submissionId=state.replacement_submission_id||state.submission?.id;
        if(submissionId)submissionToRound.set(String(submissionId),roundId);
      }
    }
    schedulePatch();
    return data;
  }

  studentSubmitJson=async function(body,retried=false){
    clearRequested(body);
    const data=await previousStudentSubmitJson(body,retried);
    return absorbStates(data);
  };

  async function refreshReplacementStates(){
    const proposals=await studentProposals(true);
    const ids=(proposals.proposals||[]).map(x=>x.id);
    if(!ids.length)return;
    await studentSubmitJson({action:'states',round_ids:ids});
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
        if(!panel)return;
        const status=panel.querySelector('.spv-status');
        if(status)status.textContent='Refazer imagem';
        const situation=panel.querySelector('.spv-info-grid .spv-info:last-child span');
        if(situation)situation.textContent='Seu professor solicitou uma nova imagem. Refaça a foto para continuar a correção.';
      });
      const camera=document.querySelector(`[data-v2-camera="${escaped}"]`);
      if(camera){
        const label=camera.querySelector('span');
        if(label)label.textContent='Tirar nova foto';
        const paste=document.querySelector(`[data-v2-paste="${escaped}"]`);
        if(paste)paste.style.display='none';
      }
    }
  }

  function patchEssayCards(){
    if(S?.profile?.role!=='student'||S.route!=='student-essays')return;
    document.querySelectorAll('[data-own-view]').forEach(button=>{
      const submissionId=String(button.dataset.ownView||'');
      const roundId=submissionToRound.get(submissionId);
      if(!roundId||!replacementRounds.has(roundId))return;
      const card=button.closest('.student-submission');
      if(!card)return;
      const pill=card.querySelector('.pill');
      if(pill){pill.textContent='Nova imagem necessária';pill.classList.remove('ok');pill.classList.add('warn');}
      const generic=[...card.querySelectorAll('.safe-note')].find(x=>/Nota, competências e devolutiva/i.test(x.textContent||''));
      if(generic)generic.innerHTML='<b>Nova imagem necessária.</b><br>Seu professor solicitou uma nova foto desta redação para continuar a correção.';
      let actions=card.querySelector('.item-actions');
      if(!actions){actions=document.createElement('div');actions.className='item-actions';card.appendChild(actions);}
      if(!actions.querySelector('[data-resend-round]')){
        const resend=document.createElement('button');
        resend.type='button';resend.className='btn primary';resend.dataset.resendRound=roundId;resend.textContent='Refazer imagem';
        actions.prepend(resend);
      }
    });
  }

  function patchHome(){
    if(S?.profile?.role!=='student'||S.route!=='student-home'||!replacementRounds.size)return;
    const view=$('view');if(!view)return;
    const roundId=[...replacementRounds][0];
    let banner=view.querySelector('[data-material-home-note],[data-replacement-home-note]');
    if(!banner){
      banner=document.createElement('div');banner.className='safe-note';banner.dataset.replacementHomeNote='1';banner.style.marginBottom='16px';
      const head=view.querySelector('.page-head');if(head)head.after(banner);else view.prepend(banner);
    }
    banner.innerHTML='<b>Ação necessária: refaça a imagem da redação.</b><br>Seu professor solicitou uma nova foto para que a correção possa continuar.<div style="margin-top:10px"><button type="button" class="btn primary" data-resend-round="'+esc(roundId)+'">Refazer envio</button></div>';
  }

  function patchAll(){patchProposalUI();patchEssayCards();patchHome();}

  async function openReplacement(roundId){
    await navigate('student-proposals');
    const escaped=CSS.escape(roundId);
    const card=document.querySelector(`[data-spv-open="${escaped}"]`);
    if(!card){toast('Não foi possível abrir a proposta. Tente novamente.');return;}
    card.click();
    await new Promise(r=>setTimeout(r,0));
    const button=document.querySelector(`[data-spv-send="${escaped}"]`);
    if(!button){toast('Não foi possível abrir o reenvio. Tente novamente.');return;}
    button.click();
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
    queueMicrotask(()=>{patchQueued=false;patchAll();});
  }
  new MutationObserver(schedulePatch).observe(document.documentElement,{subtree:true,childList:true});

  function refreshInBackground(){
    refreshReplacementStates().then(patchAll).catch(error=>console.warn('replacement states',error));
  }

  if(originalStudentHome){
    renderStudentHome=async function(navigation){
      await originalStudentHome(navigation);
      if(S.route==='student-home'&&S.profile?.role==='student')refreshInBackground();
    };
  }

  if(originalStudentEssays){
    renderStudentEssays=async function(navigation){
      await originalStudentEssays(navigation);
      if(S.route==='student-essays'&&S.profile?.role==='student')refreshInBackground();
    };
  }

  schedulePatch();
})();
