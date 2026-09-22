'use strict';

// Fluxo de envio do aluno: foto, arquivo leve ou texto colado.
// Word deixa de ser arquivo aceito; o aluno copia o texto e cola no VERSÃO.
const STUDENT_UPLOAD_ACCEPTED='JPG, PNG, WEBP ou PDF';
const STUDENT_UPLOAD_ACCEPT='image/jpeg,image/png,image/webp,application/pdf';

function studentUploadKind(file){
  const name=(file?.name||'').toLowerCase(),type=String(file?.type||'').toLowerCase();
  if(type==='application/pdf'||name.endsWith('.pdf'))return 'pdf';
  if(type==='image/jpeg'||name.endsWith('.jpg')||name.endsWith('.jpeg'))return 'image';
  if(type==='image/png'||name.endsWith('.png'))return 'image';
  if(type==='image/webp'||name.endsWith('.webp'))return 'image';
  return 'other';
}

function studentAmbiguousNetworkError(error){
  const message=String(error?.message||error||'').toLowerCase();
  return /não foi possível conectar|conexão demorou|envio demorou|failed to fetch|networkerror|network request failed/.test(message);
}

const studentUploadWait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function studentUploadState(roundId){
  return edge(API.studentSub,{action:'state',round_id:roundId});
}

function studentUploadCommitted(before,after){
  const beforePath=before?.file?.storage_path||null,afterPath=after?.file?.storage_path||null;
  const fileChanged=!!afterPath&&afterPath!==beforePath;
  const statusChanged=after?.submission?.status==='awaiting_approval'&&before?.submission?.status!=='awaiting_approval';
  return fileChanged||statusChanged;
}

async function studentRecoverFileSubmission(roundId,before,phase){
  for(const delay of [350,900,1600]){
    await studentUploadWait(delay);
    let state;
    try{state=await studentUploadState(roundId)}catch{continue}
    if(!state?.submission||!state?.file)continue;
    const committed=phase==='finalize'||studentUploadCommitted(before,state);
    if(!committed)continue;
    if(state.submission.status==='awaiting_approval'||state.submission.status==='approved')return state;
    if(state.editable===true){
      try{
        await edge(API.studentSub,{action:'finalize',round_id:roundId});
        return await studentUploadState(roundId).catch(()=>state);
      }catch(error){
        if(!studentAmbiguousNetworkError(error))throw error;
      }
    }
  }
  return null;
}

async function studentPasteRequest(roundId,text,retried=false){
  let session=await ensure();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
  try{
    const response=await fetch(`${BASE}/functions/v1/${API.studentSub}`,{
      method:'POST',
      headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify({action:'paste',round_id:roundId,text}),
      signal:controller.signal
    });
    if(response.status===401&&!retried){
      const refreshed=await refreshSession(S.session);
      if(refreshed){S.session=refreshed;return studentPasteRequest(roundId,text,true)}
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.error)throw Error(data.error||'Não foi possível enviar o texto.');
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw Error('O envio demorou a responder. Tente novamente.');
    if(error instanceof TypeError)throw Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.');
    throw error;
  }finally{clearTimeout(timer)}
}

async function renderStudentSendPageV2(){
  if(S?.profile?.role!=='student')return;
  invalidateNavigation();
  S.route='student-send';
  if(typeof studentSendSetActive==='function')studentSendSetActive();
  closeDrawer();
  const view=document.getElementById('view');
  view.innerHTML='<div class="empty">Carregando propostas...</div>';
  try{
    const proposals=await studentProposals(true);
    const ids=(proposals.proposals||[]).map(x=>x.id);
    const states=ids.length?(await edge(API.studentSub,{action:'states',round_ids:ids})).states||[]:[];
    const stateMap=new Map(states.map(s=>[s.round_id,s]));
    if(S.route!=='student-send')return;
    const cards=(proposals.proposals||[]).map(r=>{
      const state=stateMap.get(r.id),sub=state?.submission,editable=state?.editable===true;
      const status=sub?.status==='approved'?'Aprovada':sub?'Enviada':'Disponível';
      const cls=sub?.status==='approved'?'ok':sub?'warn':'crimson';
      const disabled=editable?'':'disabled';
      const photoLabel=sub?'Refazer foto':'Tirar foto';
      const fileLabel=sub?'Substituir arquivo':'Selecionar arquivo';
      return `<article class="student-card">
        <div class="item-top"><div><div class="item-title">R${esc(r.number??'—')} · ${esc(r.theme)}</div>${r.due_date?`<div class="item-meta">Prazo: ${fmtDate(r.due_date)}</div>`:''}</div><span class="pill ${cls}">${status}</span></div>
        <p class="muted">${esc(r.proposal_command||'')}</p>
        <div class="item-actions">
          <button class="btn primary" data-student-camera="${esc(r.id)}" ${disabled}>${editable?photoLabel:(sub?.status==='approved'?'Correção concluída':'Envio indisponível')}</button>
          <button class="btn soft-btn" data-student-file="${esc(r.id)}" ${disabled}>${fileLabel}</button>
          <button class="btn soft-btn" data-student-paste="${esc(r.id)}" ${disabled}>Colar redação</button>
        </div>
        ${editable?`<div class="safe-note"><b>Arquivos aceitos:</b> ${STUDENT_UPLOAD_ACCEPTED}, até 15 MB. <b>Word:</b> copie a redação e use “Colar redação”.</div>`:''}
      </article>`;
    }).join('');
    view.innerHTML=header('Enviar redação','Envie por foto, arquivo ou cole o texto diretamente do Word.')+`<div class="list" id="studentSendList">${cards||'<div class="empty">Nenhuma proposta disponível para envio.</div>'}</div>`;
  }catch(error){
    if(S.route==='student-send')view.innerHTML=header('Enviar redação','Não foi possível carregar suas propostas.')+`<div class="card"><p>${esc(error.message||error)}</p><button class="btn primary" data-student-send-menu>Tentar novamente</button></div>`;
  }
}
window.renderStudentSendPage=renderStudentSendPageV2;

async function openStudentFileV2(roundId){
  if(!roundId||S?.profile?.role!=='student')return;
  const input=document.createElement('input');
  input.type='file';input.accept=STUDENT_UPLOAD_ACCEPT;input.hidden=true;
  document.body.appendChild(input);
  const cleanup=()=>input.remove();
  input.onchange=async()=>{
    const file=input.files?.[0];
    if(!file){cleanup();return}
    const kind=studentUploadKind(file);
    if(kind==='other'||file.size>15*1024*1024){cleanup();toast(`Arquivos aceitos: ${STUDENT_UPLOAD_ACCEPTED}. Máximo de 15 MB.`);return}
    let warnings=[];
    if(kind==='image'){
      try{warnings=await inspectEssayPhoto(file)}catch(error){cleanup();toast(error.message||'Não foi possível verificar a imagem.');return}
    }
    let objectUrl='',preview='';
    if(kind==='pdf')preview=`<div class="safe-note"><b>PDF selecionado:</b> ${esc(file.name)}<br>Confira se a redação está completa e legível.</div>`;
    else{objectUrl=URL.createObjectURL(file);preview=`<img src="${objectUrl}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:52vh;margin:0 auto 12px;object-fit:contain">`}
    const dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';
    const status=warnings.length?warnings.join(' '):kind==='pdf'?'Confira se o PDF contém a redação completa.':'Confira se todas as linhas estão legíveis, sem cortes, sombras ou reflexos.';
    dialog.innerHTML=`<h2>Conferir arquivo</h2><p class="muted"><b>Arquivos aceitos:</b> ${STUDENT_UPLOAD_ACCEPTED}</p>${preview}<p role="status">${esc(status)}</p>${warnings.length?'':`<label class="photo-confirm"><input type="checkbox" data-student-file-ok> Conferi o arquivo e a redação está completa e legível.</label>`}<div class="item-actions"><button type="button" class="btn soft-btn" data-student-file-change>Escolher outro arquivo</button>${warnings.length?'':'<button type="button" class="btn primary" data-student-file-send disabled>Enviar para correção</button>'}</div>`;
    document.body.appendChild(dialog);
    const finish=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);try{dialog.close()}catch{}dialog.remove();cleanup()};
    dialog.oncancel=e=>{e.preventDefault();finish()};
    dialog.querySelector('[data-student-file-change]').onclick=()=>{finish();setTimeout(()=>openStudentFileV2(roundId),0)};
    const check=dialog.querySelector('[data-student-file-ok]'),send=dialog.querySelector('[data-student-file-send]');
    if(check&&send){
      check.onchange=()=>send.disabled=!check.checked;
      send.onclick=async()=>{
        if(send.disabled)return;
        send.disabled=true;check.disabled=true;send.textContent='Enviando...';
        let before,phase='baseline';
        try{
          before=await studentUploadState(roundId);
          phase='upload';
          await uploadEssay(API.studentSub,{action:'upload',round_id:roundId},file);
          phase='finalize';
          await edge(API.studentSub,{action:'finalize',round_id:roundId});
          S.cache={};S.student=null;finish();await navigate('student-essays');toast('Redação enviada para correção.');
        }catch(error){
          let recovered=null;
          if(phase!=='baseline'&&studentAmbiguousNetworkError(error)){
            try{recovered=await studentRecoverFileSubmission(roundId,before,phase)}catch(recoveryError){error=recoveryError}
          }
          if(recovered){
            S.cache={};S.student=null;finish();await navigate('student-essays');toast('Redação enviada para correção.');return;
          }
          send.disabled=false;check.disabled=false;send.textContent='Tentar enviar novamente';
          const fallback=phase==='baseline'?'Não foi possível confirmar o estado atual. Verifique sua conexão e tente novamente.':'Falha no envio. O arquivo continua selecionado; tente novamente.';
          toast(error?.message||fallback);
        }
      };
    }
    dialog.showModal();
  };
  input.click();
}
window.openStudentFile=openStudentFileV2;

function openStudentPaste(roundId){
  if(!roundId||S?.profile?.role!=='student')return;
  const dialog=document.createElement('dialog');
  dialog.className='app-confirm student-photo-confirm';
  dialog.innerHTML=`<h2>Colar redação</h2>
    <p>Copie somente o texto da redação no Word ou Google Docs e cole abaixo.</p>
    <textarea data-student-paste-text rows="14" maxlength="20000" placeholder="Cole aqui o texto completo da redação..." style="width:100%;min-height:280px;resize:vertical"></textarea>
    <p class="muted" data-student-paste-count>0 caracteres</p>
    <div class="safe-note">O VERSÃO transforma o texto em um arquivo padronizado para a correção. Não é necessário enviar o documento do Word.</div>
    <div class="item-actions"><button type="button" class="btn soft-btn" data-student-paste-cancel>Cancelar</button><button type="button" class="btn primary" data-student-paste-send disabled>Enviar para correção</button></div>`;
  document.body.appendChild(dialog);
  const textarea=dialog.querySelector('[data-student-paste-text]'),count=dialog.querySelector('[data-student-paste-count]'),send=dialog.querySelector('[data-student-paste-send]');
  const close=()=>{try{dialog.close()}catch{}dialog.remove()};
  dialog.oncancel=e=>{e.preventDefault();close()};
  dialog.querySelector('[data-student-paste-cancel]').onclick=close;
  textarea.oninput=()=>{const n=textarea.value.trim().length;count.textContent=`${n} caracteres`;send.disabled=n<80};
  send.onclick=async()=>{
    if(send.disabled)return;
    const text=textarea.value.trim();
    send.disabled=true;textarea.disabled=true;send.textContent='Enviando...';
    try{
      await studentPasteRequest(roundId,text);
      S.cache={};S.student=null;close();await navigate('student-essays');toast('Redação colada e enviada para correção.');
    }catch(error){
      textarea.disabled=false;send.disabled=false;send.textContent='Tentar enviar novamente';toast(error.message||'Não foi possível enviar o texto.');
    }
  };
  dialog.showModal();textarea.focus();
}

document.addEventListener('click',event=>{
  if(S?.profile?.role!=='student')return;
  const paste=event.target?.closest?.('[data-student-paste]');
  if(!paste||paste.disabled)return;
  const roundId=paste.getAttribute('data-student-paste');
  if(!roundId)return;
  event.preventDefault();event.stopImmediatePropagation();openStudentPaste(roundId);
},true);