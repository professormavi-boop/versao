'use strict';
(function(){
  const replacementRounds=new Map();
  const submissionToRound=new Map();
  const previousStudentSubmitJson=studentSubmitJson;
  const previousStudentSubmitFile=studentSubmitFile;

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

  async function strictReplacementUpload(roundId,file,retried=false){
    const mime=studentUploadMime(file);
    if(!mime)throw Error(`Formato não permitido. Use ${STUDENT_UPLOAD_ACCEPTED}.`);
    if(!file.size)throw Error('O arquivo está vazio.');
    if(file.size>STUDENT_UPLOAD_MAX)throw Error('O arquivo excede 15 MB.');
    const session=await ensure();
    const query=new URLSearchParams({mode:'file',round_id:String(roundId),name:file.name||'redacao'});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),120000);
    try{
      const response=await fetch(`${BASE}/functions/v1/${STUDENT_SUBMIT_API}?${query.toString()}`,{
        method:'POST',
        headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':mime},
        body:file,
        signal:controller.signal
      });
      if(response.status===401&&!retried){
        const refreshed=await refreshSession(S.session);
        if(refreshed){S.session=refreshed;return strictReplacementUpload(roundId,file,true)}
      }
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.error)throw Error(data.error||`Falha no reenvio (${response.status}).`);
      if(data.replacement!==true)throw Error('O novo arquivo foi recebido, mas a substituição não foi confirmada. Tente novamente.');
      replacementRounds.delete(String(roundId));
      return data;
    }catch(error){
      if(error?.name==='AbortError')throw Error('O envio demorou demais. Verifique sua conexão e tente novamente.');
      if(error instanceof TypeError)throw Error('A conexão caiu durante o envio. Tente novamente.');
      throw error;
    }finally{clearTimeout(timer)}
  }

  studentSubmitFile=async function(roundId,file,retried=false){
    if(replacementRounds.has(String(roundId)))return strictReplacementUpload(roundId,file,retried);
    return previousStudentSubmitFile(roundId,file,retried);
  };

  async function refreshReplacementStates(){
    const proposals=await studentProposals(true);
    const ids=(proposals.proposals||[]).map(x=>x.id);
    if(!ids.length)return [];
    const data=await studentSubmitJson({action:'states',round_ids:ids});
    return data?.states||[];
  }

  function directButtons(roundId){
    return `<div class="item-actions" data-replacement-direct-actions>
      <button type="button" class="btn primary" data-resend-camera="${esc(roundId)}">Tirar nova foto</button>
      <button type="button" class="btn soft-btn" data-resend-file="${esc(roundId)}">Escolher arquivo</button>
    </div>`;
  }

  function patchProposalUI(){
    if(S?.profile?.role!=='student')return;
    for(const [roundId] of replacementRounds){
      const escaped=CSS.escape(roundId);
      const card=document.querySelector(`[data-spv-open="${escaped}"]`);
      if(card){
        const status=card.querySelector('.spv-status');
        if(status)status.textContent='Refazer imagem';
        const text=card.querySelector('.spv-card-main>p');
        if(text)text.textContent='Seu professor solicitou uma nova imagem da redação.';
      }
      document.querySelectorAll(`[data-spv-send="${escaped}"]`).forEach(button=>{
        button.textContent='Refazer imagem';
        const panel=button.closest('.spv-panel');
        if(!panel)return;
        const status=panel.querySelector('.spv-status');
        if(status)status.textContent='Refazer imagem';
        const items=panel.querySelectorAll('.spv-info');
        const situation=items.length?items[items.length-1].querySelector('span:last-child'):null;
        if(situation)situation.textContent='Seu professor solicitou uma nova imagem. Refaça a foto para continuar a correção.';
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
        if(label)label.textContent='Tirar nova foto';
        const file=document.querySelector(`[data-v2-file="${escaped}"] span`);
        if(file)file.textContent='Escolher arquivo';
        const paste=document.querySelector(`[data-v2-paste="${escaped}"]`);
        if(paste)paste.style.display='none';
        const grid=camera.closest('.spv-send-grid');
        if(grid){
          grid.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';
          if(!grid.parentElement.querySelector('[data-replacement-camera-note]')){
            const note=document.createElement('div');
            note.className='safe-note';
            note.dataset.replacementCameraNote='1';
            note.innerHTML='<b>Refaça a imagem.</b> Garanta boa iluminação, foco e todas as linhas visíveis. Evite cortes, sombras e reflexos.';
            grid.before(note);
          }
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
      if(pill){pill.textContent='Nova imagem necessária';pill.classList.remove('ok');pill.classList.add('warn');}
      const generic=[...card.querySelectorAll('.safe-note')].find(x=>/Nota, competências e devolutiva/i.test(x.textContent||''));
      if(generic&&!generic.dataset.replacementPatched){
        generic.dataset.replacementPatched='1';
        generic.innerHTML='<b>Nova imagem necessária.</b><br>Seu professor solicitou uma nova foto desta redação para continuar a correção.';
      }
      let actions=card.querySelector('[data-replacement-direct-actions]');
      if(!actions){
        const host=card.querySelector('.item-actions')||card;
        const wrap=document.createElement('div');
        wrap.innerHTML=directButtons(roundId);
        actions=wrap.firstElementChild;
        host.prepend(actions);
      }
    });
  }

  function patchHome(){
    if(S?.profile?.role!=='student'||S.route!=='student-home'||!replacementRounds.size)return;
    const view=$('view');if(!view)return;
    const roundId=[...replacementRounds.keys()][0];
    let banner=view.querySelector('[data-replacement-home-note]');
    if(!banner){
      banner=document.createElement('section');
      banner.className='sh-section';
      banner.dataset.replacementHomeNote='1';
      banner.style.margin='0 0 16px';
      const host=view.querySelector('.student-home-v2');
      if(host)host.prepend(banner);else view.prepend(banner);
    }
    banner.innerHTML=`<h2 style="margin:0 0 8px">Nova imagem necessária</h2>
      <p style="margin:0 0 14px">Seu professor solicitou uma nova foto da redação para continuar a correção.</p>
      ${directButtons(roundId)}`;
  }

  function patchAll(){patchProposalUI();patchEssayCards();patchHome();}

  document.addEventListener('click',event=>{
    if(S?.profile?.role!=='student')return;
    const camera=event.target?.closest?.('[data-resend-camera]');
    if(camera){
      event.preventDefault();event.stopImmediatePropagation();
      chooseStudentFile(camera.dataset.resendCamera,true);
      return;
    }
    const file=event.target?.closest?.('[data-resend-file]');
    if(file){
      event.preventDefault();event.stopImmediatePropagation();
      chooseStudentFile(file.dataset.resendFile,false);
    }
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
    if(baseHome&&!baseHome.__replacementFlowWrapped){
      const wrapped=async function(navigation){
        await baseHome(navigation);
        if(S.route==='student-home'&&S.profile?.role==='student')refreshInBackground(navigation,'student-home');
      };
      wrapped.__replacementFlowWrapped=true;
      renderStudentHome=wrapped;
    }
    const baseEssays=typeof renderStudentEssays==='function'?renderStudentEssays:null;
    if(baseEssays&&!baseEssays.__replacementFlowWrapped){
      const wrapped=async function(navigation){
        await baseEssays(navigation);
        if(S.route==='student-essays'&&S.profile?.role==='student')refreshInBackground(navigation,'student-essays');
      };
      wrapped.__replacementFlowWrapped=true;
      renderStudentEssays=wrapped;
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRenderHooks,{once:true});
  else installRenderHooks();
})();
