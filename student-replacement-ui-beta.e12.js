'use strict';
(function(){
  const replacementRounds=new Set();
  const submissionToRound=new Map();
  const previousStudentSubmitJson=studentSubmitJson;
  const originalStudentProposals=typeof renderStudentProposals==='function'?renderStudentProposals:null;
  const originalStudentEssays=typeof renderStudentEssays==='function'?renderStudentEssays:null;

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
      }else{
        replacementRounds.delete(roundId);
      }
    }
    return data;
  }

  studentSubmitJson=async function(body,retried=false){
    const data=await previousStudentSubmitJson(body,retried);
    return absorbStates(data);
  };

  async function refreshReplacementStates(){
    const proposals=await studentProposals(true);
    const ids=(proposals.proposals||[]).map(x=>x.id);
    if(!ids.length)return [];
    const data=await studentSubmitJson({action:'states',round_ids:ids});
    return data?.states||[];
  }

  function patchProposalUI(){
    if(S?.profile?.role!=='student'||S.route!=='student-proposals')return;
    for(const roundId of replacementRounds){
      const escaped=CSS.escape(roundId);
      const card=document.querySelector(`[data-spv-open="${escaped}"]`);
      if(card){
        const status=card.querySelector('.spv-status');if(status)status.textContent='Refazer imagem';
        const text=card.querySelector('.spv-card-main>p');if(text)text.textContent='Seu professor solicitou uma nova imagem da redação.';
      }
      document.querySelectorAll(`[data-spv-send="${escaped}"]`).forEach(button=>{
        button.textContent='Refazer envio';
        const panel=button.closest('.spv-panel');
        if(!panel)return;
        const status=panel.querySelector('.spv-status');if(status)status.textContent='Refazer imagem';
        const situation=panel.querySelector('.spv-info-grid .spv-info:last-child span');
        if(situation)situation.textContent='Seu professor solicitou uma nova imagem. Refaça a foto ou selecione um novo arquivo para continuar a correção.';
      });
      const camera=document.querySelector(`[data-v2-camera="${escaped}"]`);
      const file=document.querySelector(`[data-v2-file="${escaped}"]`);
      const paste=document.querySelector(`[data-v2-paste="${escaped}"]`);
      if(camera){const label=camera.querySelector('span');if(label)label.textContent='Tirar nova foto';}
      if(file){const label=file.querySelector('span');if(label)label.textContent='Selecionar novo arquivo';}
      if(paste)paste.style.display='none';
      const grid=camera?.closest('.spv-send-grid');
      if(grid&&!grid.parentElement.querySelector('[data-replacement-guidance]')){
        const note=document.createElement('div');
        note.className='safe-note';note.dataset.replacementGuidance='1';note.style.margin='14px 0 0';
        note.innerHTML='<b>Nova imagem necessária.</b><br>Tire uma foto com boa iluminação e foco, mostrando todas as linhas. Evite cortes, sombras e reflexos.';
        grid.after(note);
      }
    }
  }

  function patchEssayCards(){
    if(S?.profile?.role!=='student'||S.route!=='student-essays')return;
    document.querySelectorAll('[data-own-view]').forEach(button=>{
      const submissionId=String(button.dataset.ownView||'');
      const roundId=submissionToRound.get(submissionId);
      if(!roundId||!replacementRounds.has(roundId))return;
      const card=button.closest('.student-submission');if(!card)return;
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
    let banner=view.querySelector('[data-replacement-home-note]');
    if(!banner){
      banner=document.createElement('section');
      banner.className='sh-section';banner.dataset.replacementHomeNote='1';banner.style.borderColor='#e7c9c4';banner.style.background='#fffafa';
      const home=view.querySelector('.student-home-v2');
      if(home)home.prepend(banner);else view.prepend(banner);
    }
    banner.innerHTML='<div class="sh-section-head" style="margin-bottom:8px"><h2>Nova imagem necessária</h2></div><p style="margin:0 0 12px">Seu professor solicitou uma nova foto de uma redação para continuar a correção.</p><button type="button" class="btn primary" data-resend-round="'+esc(roundId)+'">Refazer envio</button>';
  }

  async function openReplacementFlow(roundId){
    const id=String(roundId||'');
    if(!replacementRounds.has(id)){
      try{await refreshReplacementStates()}catch{}
    }
    if(!replacementRounds.has(id)){toast('A solicitação de nova imagem não está mais ativa.');return;}
    await navigate('student-proposals');
    if(S.route!=='student-proposals')return;
    const escaped=CSS.escape(id);
    const card=document.querySelector(`[data-spv-open="${escaped}"]`);
    if(!card){toast('Não foi possível localizar a proposta.');return;}
    card.click();patchProposalUI();
    const send=document.querySelector(`[data-spv-send="${escaped}"]`);
    if(!send){toast('Não foi possível abrir o reenvio.');return;}
    send.click();
    setTimeout(patchProposalUI,0);
  }

  document.addEventListener('click',event=>{
    const resend=event.target?.closest?.('[data-resend-round]');
    if(resend){
      event.preventDefault();event.stopImmediatePropagation();
      openReplacementFlow(resend.dataset.resendRound);return;
    }
    if(event.target?.closest?.('[data-spv-open],[data-spv-summary],[data-spv-full],[data-spv-send]'))setTimeout(patchProposalUI,0);
  },true);

  if(originalStudentProposals){
    renderStudentProposals=async function(navigation){
      await originalStudentProposals(navigation);
      if(S.route==='student-proposals'&&S.profile?.role==='student')patchProposalUI();
    };
  }

  if(originalStudentEssays){
    renderStudentEssays=async function(navigation){
      await originalStudentEssays(navigation);
      if(S.route!=='student-essays'||S.profile?.role!=='student')return;
      refreshReplacementStates().then(()=>{if(S.route==='student-essays')patchEssayCards()}).catch(()=>{});
    };
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const baseHome=typeof window.renderStudentHome==='function'?window.renderStudentHome:null;
    if(baseHome){
      window.renderStudentHome=async function(navigation){
        await baseHome(navigation);
        if(S.route!=='student-home'||S.profile?.role!=='student')return;
        refreshReplacementStates().then(()=>{if(S.route==='student-home')patchHome()}).catch(()=>{});
      };
    }
    if(S?.profile?.role==='student'&&S.route==='student-home'){
      refreshReplacementStates().then(()=>{if(S.route==='student-home')patchHome()}).catch(()=>{});
    }
  },{once:true});
})();
