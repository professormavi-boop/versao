'use strict';
(function(){
  const replacementRounds=new Map();
  const submissionToRound=new Map();
  const previousStudentSubmitJson=studentSubmitJson;

  function rememberStates(data){
    const states=data?.states||(data?.round_id?[data]:[]);
    for(const state of states){
      if(!state?.round_id)continue;
      const roundId=String(state.round_id);
      if(state.replacement_requested===true){
        replacementRounds.set(roundId,state);
        const submissionId=state.replacement_submission_id||state.submission?.id;
        if(submissionId)submissionToRound.set(String(submissionId),roundId);
      }else{
        replacementRounds.delete(roundId);
      }
    }
    schedulePatch();
    return data;
  }

  studentSubmitJson=async function(body,retried=false){
    const data=await previousStudentSubmitJson(body,retried);
    const action=String(body?.action||'');
    if(action==='states'||action==='state')rememberStates(data);
    return data;
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
    for(const [roundId] of replacementRounds){
      const escaped=CSS.escape(roundId);
      const card=document.querySelector(`[data-spv-open="${escaped}"]`);
      if(card){
        const status=card.querySelector('.spv-status');
        if(status&&status.textContent!=='Refazer imagem')status.textContent='Refazer imagem';
        const text=card.querySelector('.spv-card-main>p');
        if(text&&text.textContent!=='Seu professor solicitou uma nova imagem da redação.')text.textContent='Seu professor solicitou uma nova imagem da redação.';
      }
      document.querySelectorAll(`[data-spv-send="${escaped}"]`).forEach(button=>{
        if(button.textContent!=='Refazer envio')button.textContent='Refazer envio';
        const panel=button.closest('.spv-panel');
        if(!panel)return;
        const status=panel.querySelector('.spv-status');
        if(status&&status.textContent!=='Refazer imagem')status.textContent='Refazer imagem';
        const items=panel.querySelectorAll('.spv-info');
        const situation=items.length?items[items.length-1].querySelector('span:last-child'):null;
        if(situation&&situation.textContent!=='Seu professor solicitou uma nova imagem. Refaça a foto para continuar a correção.')situation.textContent='Seu professor solicitou uma nova imagem. Refaça a foto para continuar a correção.';
        if(!panel.querySelector('[data-replacement-note]')){
          const note=document.createElement('div');
          note.className='safe-note';
          note.dataset.replacementNote='1';
          note.innerHTML='<b>Nova imagem necessária.</b> Tire uma nova foto com boa iluminação e foco, sem cortar nenhuma linha.';
          button.closest('.spv-actions')?.before(note);
        }
      });
      const camera=document.querySelector(`[data-v2-camera="${escaped}"]`);
      if(camera){
        const label=camera.querySelector('span');
        if(label&&label.textContent!=='Tirar nova foto')label.textContent='Tirar nova foto';
        const file=document.querySelector(`[data-v2-file="${escaped}"] span`);
        if(file&&file.textContent!=='Selecionar nova imagem')file.textContent='Selecionar nova imagem';
        const paste=document.querySelector(`[data-v2-paste="${escaped}"]`);
        if(paste&&paste.style.display!=='none')paste.style.display='none';
        const grid=camera.closest('.spv-send-grid');
        if(grid&&!grid.parentElement.querySelector('[data-replacement-camera-note]')){
          const note=document.createElement('div');
          note.className='safe-note';
          note.dataset.replacementCameraNote='1';
          note.innerHTML='<b>Refaça a imagem.</b> Garanta boa iluminação, foco e todas as linhas visíveis. Use flash apenas se necessário e evite reflexos.';
          grid.before(note);
        }
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
        pill.textContent='Nova imagem necessária';
        pill.classList.remove('ok');pill.classList.add('warn');
      }
      const generic=[...card.querySelectorAll('.safe-note')].find(x=>/Nota, competências e devolutiva/i.test(x.textContent||''));
      if(generic&&!generic.dataset.replacementPatched){generic.dataset.replacementPatched='1';generic.innerHTML='<b>Nova imagem necessária.</b><br>Seu professor solicitou uma nova foto desta redação para continuar a correção.';}
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
    const roundId=[...replacementRounds.keys()][0];
    let banner=view.querySelector('[data-replacement-home-note]');
    if(!banner){
      banner=document.createElement('div');
      banner.className='safe-note';
      banner.dataset.replacementHomeNote='1';
      banner.style.margin='0 0 16px';
      const host=view.querySelector('.student-home-v2');
      if(host)host.prepend(banner);else view.prepend(banner);
    }
    if(banner.dataset.replacementReady!=='1'){banner.dataset.replacementReady='1';banner.innerHTML='<b>Ação necessária: refaça a imagem da redação.</b><br>Seu professor solicitou uma nova foto para que a correção possa continuar.<div style="margin-top:10px"><button type="button" class="btn primary" data-resend-round="'+esc(roundId)+'">Refazer envio</button></div>';}
  }

  function patchAll(){patchProposalUI();patchEssayCards();patchHome();}

  async function openReplacement(roundId){
    await navigate('student-proposals');
    const escaped=CSS.escape(String(roundId));
    const card=document.querySelector(`[data-spv-open="${escaped}"]`);
    if(!card){toast('Não foi possível localizar a proposta.');return;}
    card.click();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const button=document.querySelector(`[data-spv-send="${escaped}"]`);
    if(!button){toast('Não foi possível abrir o reenvio.');return;}
    button.click();
  }

  document.addEventListener('click',event=>{
    const button=event.target?.closest?.('[data-resend-round]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    openReplacement(button.dataset.resendRound).catch(error=>toast(error.message||'Não foi possível abrir o reenvio.'));
  },true);

  let patchQueued=false;
  function schedulePatch(){
    if(patchQueued)return;
    patchQueued=true;
    queueMicrotask(()=>{patchQueued=false;patchAll();});
  }
  new MutationObserver(schedulePatch).observe(document.documentElement,{subtree:true,childList:true});

  function refreshInBackground(navigation,route){
    Promise.resolve().then(refreshReplacementStates).then(()=>{
      if(S.route!==route||!navigationCurrent(navigation))return;
      patchAll();
    }).catch(error=>console.warn('replacement states',error));
  }

  function installRenderHooks(){
    const baseHome=typeof renderStudentHome==='function'?renderStudentHome:null;
    if(baseHome&&!baseHome.__replacementWrapped){
      const wrapped=async function(navigation){
        await baseHome(navigation);
        if(S.route==='student-home'&&S.profile?.role==='student')refreshInBackground(navigation,'student-home');
      };
      wrapped.__replacementWrapped=true;
      renderStudentHome=wrapped;
    }
    const baseEssays=typeof renderStudentEssays==='function'?renderStudentEssays:null;
    if(baseEssays&&!baseEssays.__replacementWrapped){
      const wrapped=async function(navigation){
        await baseEssays(navigation);
        if(S.route==='student-essays'&&S.profile?.role==='student')refreshInBackground(navigation,'student-essays');
      };
      wrapped.__replacementWrapped=true;
      renderStudentEssays=wrapped;
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRenderHooks,{once:true});
  else installRenderHooks();
})();
