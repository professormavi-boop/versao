'use strict';

// VERSÃO — transporte do envio do aluno.
// A interface de propostas pertence exclusivamente a student-proposals-v2.e12.js.
const STUDENT_SUBMIT_API='student-submit-v2-api';
const STUDENT_UPLOAD_ACCEPT='image/jpeg,image/png,image/webp,application/pdf';
const STUDENT_UPLOAD_ACCEPTED='JPG, PNG, WEBP ou PDF';
const STUDENT_UPLOAD_MAX=15*1024*1024;

function studentUploadError(message){
  const text=String(message||'Não foi possível enviar a redação.');
  if(typeof window.actionAlert==='function')window.actionAlert(text,'Atenção');
  else toast(text);
}
function studentUploadSuccess(message='Redação enviada para correção.'){
  if(typeof window.actionAlert==='function')window.actionAlert(message,'Ação concluída');
  else toast(message);
}
function studentUploadMime(file){
  const name=(file?.name||'').toLowerCase(),type=String(file?.type||'').toLowerCase();
  if(type==='application/pdf'||name.endsWith('.pdf'))return 'application/pdf';
  if(type==='image/jpeg'||name.endsWith('.jpg')||name.endsWith('.jpeg'))return 'image/jpeg';
  if(type==='image/png'||name.endsWith('.png'))return 'image/png';
  if(type==='image/webp'||name.endsWith('.webp'))return 'image/webp';
  return '';
}
function studentUploadSizeLabel(size){
  if(size<1024)return `${size} B`;
  if(size<1024*1024)return `${Math.round(size/1024)} KB`;
  return `${(size/(1024*1024)).toFixed(1)} MB`;
}

async function studentSubmitJson(body,retried=false){
  const session=await ensure();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
  try{
    const response=await fetch(`${BASE}/functions/v1/${STUDENT_SUBMIT_API}`,{
      method:'POST',
      headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify(body),signal:controller.signal
    });
    if(response.status===401&&!retried){
      const refreshed=await refreshSession(S.session);
      if(refreshed){S.session=refreshed;return studentSubmitJson(body,true)}
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.error)throw Error(data.error||`Falha no envio (${response.status}).`);
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw Error('O servidor demorou a responder. Tente novamente.');
    if(error instanceof TypeError)throw Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    throw error;
  }finally{clearTimeout(timer)}
}
async function studentSubmissionState(roundId){return studentSubmitJson({action:'state',round_id:roundId})}

async function studentSubmitFile(roundId,file,retried=false){
  const mime=studentUploadMime(file);
  if(!mime)throw Error(`Formato não permitido. Use ${STUDENT_UPLOAD_ACCEPTED}.`);
  if(!file.size)throw Error('O arquivo está vazio.');
  if(file.size>STUDENT_UPLOAD_MAX)throw Error('O arquivo excede 15 MB.');
  const session=await ensure();
  const query=new URLSearchParams({mode:'file',round_id:roundId,name:file.name||'redacao'});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),120000);
  try{
    const response=await fetch(`${BASE}/functions/v1/${STUDENT_SUBMIT_API}?${query.toString()}`,{
      method:'POST',
      headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':mime},
      body:file,signal:controller.signal
    });
    if(response.status===401&&!retried){
      const refreshed=await refreshSession(S.session);
      if(refreshed){S.session=refreshed;return studentSubmitFile(roundId,file,true)}
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.error)throw Error(data.error||`Falha no envio (${response.status}).`);
    return data;
  }catch(error){
    try{
      const state=await studentSubmissionState(roundId);
      if(state?.submission?.status==='awaiting_approval'&&state?.file)return {ok:true,reconciled:true,submission:state.submission,file:state.file};
    }catch{}
    if(error?.name==='AbortError')throw Error('O envio demorou demais. Verifique sua conexão e tente novamente.');
    if(error instanceof TypeError)throw Error('A conexão caiu durante o envio. Tente novamente.');
    throw error;
  }finally{clearTimeout(timer)}
}

function chooseStudentFile(roundId,camera=false){
  if(!roundId||S?.profile?.role!=='student')return;
  const input=document.createElement('input');
  input.type='file';input.hidden=true;input.accept=camera?'image/jpeg,image/png,image/webp':STUDENT_UPLOAD_ACCEPT;
  if(camera)input.setAttribute('capture','environment');
  document.body.appendChild(input);
  const cleanup=()=>input.remove();
  input.onchange=()=>{
    const file=input.files?.[0];
    if(!file){cleanup();return}
    const mime=studentUploadMime(file);
    if(!mime||file.size>STUDENT_UPLOAD_MAX){cleanup();studentUploadError(`Arquivos aceitos: ${STUDENT_UPLOAD_ACCEPTED}. Máximo de 15 MB.`);return}
    showStudentFileConfirm(roundId,file,cleanup,camera);
  };
  input.click();
}
function showStudentFileConfirm(roundId,file,cleanup,camera){
  const mime=studentUploadMime(file),dialog=document.createElement('dialog');
  dialog.className='app-confirm student-photo-confirm';
  let objectUrl='';
  const preview=mime.startsWith('image/')
    ?(()=>{objectUrl=URL.createObjectURL(file);return `<img src="${objectUrl}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:45vh;margin:0 auto 12px;object-fit:contain">`})()
    :`<div class="safe-note"><b>PDF selecionado:</b> ${esc(file.name)}</div>`;
  dialog.innerHTML=`<h2>Conferir ${camera?'foto':'arquivo'}</h2>${preview}<p><b>${esc(file.name||'Redação')}</b><br>${studentUploadSizeLabel(file.size)}</p><label class="photo-confirm"><input type="checkbox" data-v2-confirm> Conferi e a redação está completa e legível.</label><div class="item-actions"><button type="button" class="btn soft-btn" data-v2-change>Escolher outro</button><button type="button" class="btn primary" data-v2-send disabled>Enviar para correção</button></div>`;
  document.body.appendChild(dialog);
  const finish=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);try{dialog.close()}catch{}dialog.remove();cleanup()};
  dialog.oncancel=event=>{event.preventDefault();finish()};
  dialog.querySelector('[data-v2-change]').onclick=()=>{finish();setTimeout(()=>chooseStudentFile(roundId,camera),0)};
  const check=dialog.querySelector('[data-v2-confirm]'),send=dialog.querySelector('[data-v2-send]');
  check.onchange=()=>send.disabled=!check.checked;
  send.onclick=async()=>{
    if(send.disabled)return;
    send.disabled=true;check.disabled=true;send.textContent='Enviando...';
    try{
      await studentSubmitFile(roundId,file);
      S.cache={};S.student=null;finish();await navigate('student-essays');studentUploadSuccess();
    }catch(error){
      send.disabled=false;check.disabled=false;send.textContent='Tentar novamente';studentUploadError(error.message||'Falha no envio.');
    }
  };
  dialog.showModal();
}

function openStudentPasteV2(roundId){
  if(!roundId||S?.profile?.role!=='student')return;
  const dialog=document.createElement('dialog');dialog.className='app-confirm student-photo-confirm';
  dialog.innerHTML=`<h2>Colar redação</h2><p>Copie somente o texto da redação no Word ou Google Docs e cole abaixo.</p><textarea data-v2-paste-text rows="14" maxlength="20000" placeholder="Cole aqui o texto completo da redação..." style="width:100%;min-height:280px;resize:vertical"></textarea><p class="muted" data-v2-paste-count>0 caracteres</p><div class="safe-note">O VERSÃO transforma o texto em um PDF padronizado. Não é necessário enviar o arquivo do Word.</div><div class="item-actions"><button type="button" class="btn soft-btn" data-v2-paste-cancel>Cancelar</button><button type="button" class="btn primary" data-v2-paste-send disabled>Enviar para correção</button></div>`;
  document.body.appendChild(dialog);
  const textarea=dialog.querySelector('[data-v2-paste-text]'),count=dialog.querySelector('[data-v2-paste-count]'),send=dialog.querySelector('[data-v2-paste-send]');
  const close=()=>{try{dialog.close()}catch{}dialog.remove()};
  dialog.oncancel=event=>{event.preventDefault();close()};
  dialog.querySelector('[data-v2-paste-cancel]').onclick=close;
  textarea.oninput=()=>{const length=textarea.value.trim().length;count.textContent=`${length} caracteres`;send.disabled=length<80};
  send.onclick=async()=>{
    if(send.disabled)return;
    const text=textarea.value.trim();send.disabled=true;textarea.disabled=true;send.textContent='Enviando...';
    try{
      await studentSubmitJson({action:'paste',round_id:roundId,text});
      S.cache={};S.student=null;close();await navigate('student-essays');studentUploadSuccess('Redação colada e enviada para correção.');
    }catch(error){
      textarea.disabled=false;send.disabled=false;send.textContent='Tentar enviar novamente';studentUploadError(error.message||'Não foi possível enviar o texto.');
    }
  };
  dialog.showModal();textarea.focus();
}

document.addEventListener('click',event=>{
  if(S?.profile?.role!=='student')return;
  const camera=event.target?.closest?.('[data-v2-camera]');
  if(camera&&!camera.disabled){event.preventDefault();event.stopImmediatePropagation();chooseStudentFile(camera.getAttribute('data-v2-camera'),true);return}
  const file=event.target?.closest?.('[data-v2-file]');
  if(file&&!file.disabled){event.preventDefault();event.stopImmediatePropagation();chooseStudentFile(file.getAttribute('data-v2-file'),false);return}
  const paste=event.target?.closest?.('[data-v2-paste]');
  if(paste&&!paste.disabled){event.preventDefault();event.stopImmediatePropagation();openStudentPasteV2(paste.getAttribute('data-v2-paste'));}
},true);
