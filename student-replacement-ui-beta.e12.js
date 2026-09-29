'use strict';
(function(){
  const replacementRounds=new Set();
  const submissionToRound=new Map();
  const previousStudentSubmitJson=studentSubmitJson;
  const originalStudentProposals=typeof renderStudentProposals==='function'?renderStudentProposals:null;
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
    if(!ids.length)return [];
    const data=await studentSubmitJson({action:'states',round_ids:ids});
    return data?.states||[];
  }

  function patchProposalUI(){
    if(S?.profile?.role!=='student')return;
    for(const roundId of replacementRounds){
      const escaped=CSS.escape(roundId);
      const card=document.querySelector(`[data-spv-open="${escaped}"]`);
      if(card){
        const status=card.querySelector('.spv-status');
        if(status&&status.textContent!=='Refazer imagem')status.textContent='Refazer imagem';
        const text=card.querySelector('.spv-card-main>p');
        if(text&&text.textContent!=='Seu professor solicitou uma nova imagem da redação.')text.textContent='Seu professor solicitou uma nova imagem da redação.';
      }
      document.querySelectorAll(`[data-spv-send="${escaped}"]`).forEach(button=>{
        if(button.textContent!=='Refazer imagem')button.textContent='Refazer imagem';
        const panel=button.closest('.spv-panel');
        if(!panel)return;
        const status=panel.querySelector('.spv-status');
        if(status&&status.textContent!=='Refazer imagem')status.textContent='Refazer imagem';
        const situation=panel.querySelector('.spv-info-grid .spv-info:last-child span');
        const message='Seu professor solicitou uma nova imagem. Refaça a foto para continuar a correção.';
        if(situation&&situation.textContent!==message)situation.textContent=message;
      });
      const camera=document.querySelector(`[data-v2-camera="${escaped}"]`);
      if(camera){
        const label=camera.querySelector('span');
        if(label&&label.textContent!=='Tirar nova foto')label.textContent='Tirar nova foto';
        const paste=document.querySelector(`[data-v2-paste="${escaped}"]`);
        if(paste&&paste.style.display!=='none')paste.style.display='none';
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
      if(pill&&pill.textContent!=='Nova imagem necessária'){
        pill.textContent='Nova imagem necessária';pill.classList.remove('ok');pill.classList.add('warn');
      }
      const generic=[...card.querySelectorAll('.safe-note')].find(x=>/Nota, competências e devolutiva/i.test(x.textContent||''));
      if(generic&&!/Nova imagem necessária/i.test(generic.textContent||''))generic.innerHTML='<b>Nova imagem necessária.</b><br>Seu professor solicitou uma nova foto desta redação para continuar a correção.';
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
      banner=document.createElement('div');banner.className='safe-note';banner.dataset.replacementHomeNote='1';banner.style.margin='0 0 16px';
      const home=view.querySelector('.student-home-v2');
      if(home)home.prepend(banner);else view.prepend(banner);
    }
    if(!banner.dataset.ready){
      banner.dataset.ready='1';
      banner.innerHTML='<b>Ação necessária: refaça a imagem da redação.</b><br>Seu professor solicitou uma nova foto para que a correção possa continuar.<div style="margin-top:10px"><button type="button" class="btn primary" data-resend-round="'+esc(roundId)+'">Tirar nova foto</button></div>';
    }
  }

  function patchCurrentRoute(){
    if(S.route==='student-proposals')patchProposalUI();
    if(S.route==='student-essays')patchEssayCards();
    if(S.route==='student-home')patchHome();
  }

  function refreshAndPatch(){
    refreshReplacementStates().then(()=>patchCurrentRoute()).catch(error=>console.warn('replacement states',error));
  }

  function openReplacement(roundId){
    if(!replacementRounds.has(String(roundId))){toast('A solicitação de nova imagem não está mais ativa.');return;}
    if(typeof chooseStudentFile!=='function'){toast('Não foi possível abrir a câmera. Atualize a página e tente novamente.');return;}
    chooseStudentFile(String(roundId),true);
  }

  document.addEventListener('click',event=>{
    const resend=event.target?.closest?.('[data-resend-round]');
    if(resend){
      event.preventDefault();event.stopImmediatePropagation();
      openReplacement(resend.dataset.resendRound);return;
    }
    const send=event.target?.closest?.('[data-spv-send]');
    if(send&&replacementRounds.has(String(send.dataset.spvSend))){
      event.preventDefault();event.stopImmediatePropagation();
      openReplacement(send.dataset.spvSend);return;
    }
    if(event.target?.closest?.('[data-spv-open],[data-spv-summary],[data-spv-full]'))setTimeout(patchProposalUI,0);
  },true);

  if(originalStudentProposals){
    renderStudentProposals=async function(navigation){
      await originalStudentProposals(navigation);
      if(S.route==='student-proposals'&&S.profile?.role==='student'){
        patchProposalUI();
        refreshAndPatch();
      }
    };
  }

  if(originalStudentEssays){
    renderStudentEssays=async function(navigation){
      await originalStudentEssays(navigation);
      if(S.route==='student-essays'&&S.profile?.role==='student')refreshAndPatch();
    };
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const baseHome=typeof window.renderStudentHome==='function'?window.renderStudentHome:null;
    if(baseHome){
      window.renderStudentHome=async function(navigation){
        await baseHome(navigation);
        if(S.route==='student-home'&&S.profile?.role==='student')refreshAndPatch();
      };
    }
    setTimeout(()=>{if(S?.profile?.role==='student')refreshAndPatch();},1200);
  },{once:true});
})();
