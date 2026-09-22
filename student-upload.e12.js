'use strict';

// Fluxo do aluno: foto, PDF/imagem ou texto colado.
// Arquivos usam URL assinada e vão direto ao Storage sem atravessar a Edge Function.
const STUDENT_UPLOAD_ACCEPTED='JPG, PNG, WEBP ou PDF';
const STUDENT_UPLOAD_ACCEPT='image/jpeg,image/png,image/webp,application/pdf';
const STUDENT_DIRECT_API='student-upload-direct-api';

function studentUploadKind(file){
  const name=(file?.name||'').toLowerCase(),type=String(file?.type||'').toLowerCase();
  if(type==='application/pdf'||name.endsWith('.pdf'))return 'pdf';
  if(type==='image/jpeg'||name.endsWith('.jpg')||name.endsWith('.jpeg'))return 'image';
  if(type==='image/png'||name.endsWith('.png'))return 'image';
  if(type==='image/webp'||name.endsWith('.webp'))return 'image';
  return 'other';
}
function studentCanonicalMime(file){
  const name=(file?.name||'').toLowerCase(),type=String(file?.type||'').toLowerCase();
  if(type==='application/pdf'||name.endsWith('.pdf'))return 'application/pdf';
  if(type==='image/jpeg'||name.endsWith('.jpg')||name.endsWith('.jpeg'))return 'image/jpeg';
  if(type==='image/png'||name.endsWith('.png'))return 'image/png';
  if(type==='image/webp'||name.endsWith('.webp'))return 'image/webp';
  return type;
}
function studentUploadError(message){
  const text=String(message||'Não foi possível enviar a redação.');
  if(typeof actionAlert==='function')actionAlert(text,'Atenção');
  else if(typeof window.actionAlert==='function')window.actionAlert(text,'Atenção');
  else toast(text);
}

async function studentJsonRequest(slug,body,retried=false){
  const session=await ensure();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
  try{
    const response=await fetch(`${BASE}/functions/v1/${slug}`,{
      method:'POST',
      headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify(body),signal:controller.signal
    });
    if(response.status===401&&!retried){
      const refreshed=await refreshSession(S.session);
      if(refreshed){S.session=refreshed;return studentJsonRequest(slug,body,true)}
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.error)throw Error(data.error||`Falha no servidor (${response.status}).`);
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw Error('O servidor demorou a responder. Tente novamente.');
    if(error instanceof TypeError)throw Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.');
    throw error;
  }finally{clearTimeout(timer)}
}

async function studentPasteRequest(roundId,text){
  return studentJsonRequest(API.studentSub,{action:'paste',round_id:roundId,text});
}

function studentSignedStorageUpload(signedUrl,file){
  return new Promise((resolve,reject)=>{
    const form=new FormData();
    form.append('cacheControl','3600');
    form.append('',file,file.name||'redacao');
    const xhr=new XMLHttpRequest();
    let settled=false;
    const done=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);fn(value)};
    const timer=setTimeout(()=>{
      try{xhr.abort()}catch{}
      done(reject,Error('O envio demorou demais. Tente novamente.'));
    },120000);
    xhr.open('PUT',signedUrl,true);
    // A URL assinada já contém a autorização. Não adicionar Authorization/apikey evita preflight desnecessário no navegador móvel.
    xhr.onload=()=>{
      if(xhr.status>=200&&xhr.status<300){done(resolve,true);return}
      let message='';
      try{const data=JSON.parse(xhr.responseText||'{}');message=data?.message||data?.error||''}catch{message=xhr.responseText||''}
      done(reject,Error(message||`O armazenamento recusou o arquivo (${xhr.status}).`));
    };
    xhr.onerror=()=>done(reject,Error('A conexão caiu durante o envio do arquivo. Tente novamente.'));
    xhr.onabort=()=>done(reject,Error('O envio foi interrompido. Tente novamente.'));
    try{xhr.send(form)}catch(error){done(reject,error instanceof Error?error:Error('Não foi possível iniciar o envio.'))}
  });
}

async function studentDirectUpload(roundId,sourceFile){
  const file=typeof optimizeEssayUploadFile==='function'?await optimizeEssayUploadFile(sourceFile):sourceFile;
  const mime=studentCanonicalMime(file),size=file.size;
  const prepared=await studentJsonRequest(STUDENT_DIRECT_API,{action:'prepare',round_id:roundId,file_name:file.name||'redacao',mime_type:mime,file_size:size});
  let uploadError=null;
  try{await studentSignedStorageUpload(prepared.signed_url,file)}catch(error){uploadError=error}
  const commit={action:'commit',round_id:roundId,path:prepared.path,mime_type:mime,file_size:size,file_name:file.name||'redacao'};
  if(uploadError){
    // Se o navegador perder apenas a resposta, o servidor ainda consegue reconhecer o arquivo que já chegou.
    try{return await studentJsonRequest(STUDENT_DIRECT_API,commit)}catch{throw uploadError}
  }
  try{return await studentJsonRequest(STUDENT_DIRECT_API,commit)}
  catch(first){
    await new Promise(resolve=>setTimeout(resolve,700));
    try{return await studentJsonRequest(STUDENT_DIRECT_API,commit)}
    catch(second){
      const state=await edge(API.studentSub,{action:'state',round_id:roundId}).catch(()=>null);
      if(state?.submission&&state?.file&&state.submission.status==='awaiting_approval')return {ok:true,submission:state.submission,file:state.file};
      throw second||first;
    }
  }
}

async function renderStudentSendPageV2(){
  if(S?.profile?.role!=='student')return;
  invalidateNavigation();S.route='student-send';
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
      const state=stateMap.get(r.id),sub=state?.submission,hasFile=!!state?.file,editable=state?.editable===true;
      const status=sub?.status==='approved'?'Aprovada':sub&&hasFile?'Enviada':sub?'Envio incompleto':'Disponível';
      const cls=sub?.status==='approved'?'ok':sub&&!hasFile?'warn':sub?'warn':'crimson';
      const disabled=editable?'':'disabled';
      const photoLabel=sub?'Refazer foto':'Tirar foto',fileLabel=sub?'Substituir arquivo':'Selecionar arquivo';
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

async function openStudentCameraV2(roundId){
  if(!roundId||S?.profile?.role!=='student')return;
  const input=document.createElement('input');
  input.type='file';input.accept='image/jpeg,image/png,image/webp';input.setAttribute('capture','environment');input.hidden=true;
  document.body.appendChild(input);
  const cleanup=()=>input.remove();
  input.onchange=async()=>{
    const file=input.files?.[0];
    if(!file){cleanup();return}
    if(studentUploadKind(file)!=='image'||file.size>15*1024*1024){cleanup();studentUploadError('Use uma foto JPG, PNG ou WEBP de até 15 MB.');return}
    let warnings=[];
    try{warnings=await inspectEssayPhoto(file)}catch(error){cleanup();studentUploadError(error.message||'Não foi possível verificar a foto.');return}
    const objectUrl=URL.createObjectURL(file),dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';
    dialog.innerHTML=`<h2>Conferir foto</h2><img src="${objectUrl}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:52vh;margin:0 auto 12px;object-fit:contain"><p role="status">${esc(warnings.length?warnings.join(' '):'Confira se todas as linhas estão legíveis, sem cortes, sombras ou reflexos.')}</p>${warnings.length?'':`<label class="photo-confirm"><input type="checkbox" data-student-photo-ok> Conferi a foto e todas as linhas estão legíveis.</label>`}<div class="item-actions"><button type="button" class="btn soft-btn" data-student-retake>Refazer foto</button>${warnings.length?'':'<button type="button" class="btn primary" data-student-photo-send disabled>Enviar para correção</button>'}</div>`;
    document.body.appendChild(dialog);
    const finish=()=>{URL.revokeObjectURL(objectUrl);try{dialog.close()}catch{}dialog.remove();cleanup()};
    dialog.oncancel=e=>{e.preventDefault();finish()};
    dialog.querySelector('[data-student-retake]').onclick=()=>{finish();setTimeout(()=>openStudentCameraV2(roundId),0)};
    const check=dialog.querySelector('[data-student-photo-ok]'),send=dialog.querySelector('[data-student-photo-send]');
    if(check&&send){
      check.onchange=()=>send.disabled=!check.checked;
      send.onclick=async()=>{
        if(send.disabled)return;send.disabled=true;check.disabled=true;send.textContent='Enviando...';
        try{await studentDirectUpload(roundId,file);S.cache={};S.student=null;finish();await navigate('student-essays');toast('Redação enviada para correção.');}
        catch(error){send.disabled=false;check.disabled=false;send.textContent='Tentar enviar novamente';studentUploadError(error.message||'Falha no envio.');}
      };
    }
    dialog.showModal();
  };
  input.click();
}
window.openStudentCamera=openStudentCameraV2;

async function openStudentFileV2(roundId){
  if(!roundId||S?.profile?.role!=='student')return;
  const input=document.createElement('input');input.type='file';input.accept=STUDENT_UPLOAD_ACCEPT;input.hidden=true;document.body.appendChild(input);
  const cleanup=()=>input.remove();
  input.onchange=async()=>{
    const file=input.files?.[0];
    if(!file){cleanup();return}
    const kind=studentUploadKind(file);
    if(kind==='other'||file.size>15*1024*1024){cleanup();studentUploadError(`Arquivos aceitos: ${STUDENT_UPLOAD_ACCEPTED}. Máximo de 15 MB.`);return}
    let warnings=[];
    if(kind==='image'){try{warnings=await inspectEssayPhoto(file)}catch(error){cleanup();studentUploadError(error.message||'Não foi possível verificar a imagem.');return}}
    let objectUrl='',preview='';
    if(kind==='pdf')preview=`<div class="safe-note"><b>PDF selecionado:</b> ${esc(file.name)}<br>Confira se a redação está completa e legível.</div>`;
    else{objectUrl=URL.createObjectURL(file);preview=`<img src="${objectUrl}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:52vh;margin:0 auto 12px;object-fit:contain">`}
    const dialog=document.createElement('dialog');dialog.className='app-confirm student-photo-confirm';
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
        if(send.disabled)return;send.disabled=true;check.disabled=true;send.textContent='Enviando...';
        try{await studentDirectUpload(roundId,file);S.cache={};S.student=null;finish();await navigate('student-essays');toast('Redação enviada para correção.');}
        catch(error){send.disabled=false;check.disabled=false;send.textContent='Tentar enviar novamente';studentUploadError(error.message||'Falha no envio. O arquivo continua selecionado; tente novamente.');}
      };
    }
    dialog.showModal();
  };
  input.click();
}
window.openStudentFile=openStudentFileV2;

function openStudentPaste(roundId){
  if(!roundId||S?.profile?.role!=='student')return;
  const dialog=document.createElement('dialog');dialog.className='app-confirm student-photo-confirm';
  dialog.innerHTML=`<h2>Colar redação</h2><p>Copie somente o texto da redação no Word ou Google Docs e cole abaixo.</p><textarea data-student-paste-text rows="14" maxlength="20000" placeholder="Cole aqui o texto completo da redação..." style="width:100%;min-height:280px;resize:vertical"></textarea><p class="muted" data-student-paste-count>0 caracteres</p><div class="safe-note">O VERSÃO transforma o texto em um arquivo padronizado para a correção. Não é necessário enviar o documento do Word.</div><div class="item-actions"><button type="button" class="btn soft-btn" data-student-paste-cancel>Cancelar</button><button type="button" class="btn primary" data-student-paste-send disabled>Enviar para correção</button></div>`;
  document.body.appendChild(dialog);
  const textarea=dialog.querySelector('[data-student-paste-text]'),count=dialog.querySelector('[data-student-paste-count]'),send=dialog.querySelector('[data-student-paste-send]');
  const close=()=>{try{dialog.close()}catch{}dialog.remove()};
  dialog.oncancel=e=>{e.preventDefault();close()};dialog.querySelector('[data-student-paste-cancel]').onclick=close;
  textarea.oninput=()=>{const n=textarea.value.trim().length;count.textContent=`${n} caracteres`;send.disabled=n<80};
  send.onclick=async()=>{
    if(send.disabled)return;const text=textarea.value.trim();send.disabled=true;textarea.disabled=true;send.textContent='Enviando...';
    try{await studentPasteRequest(roundId,text);S.cache={};S.student=null;close();await navigate('student-essays');toast('Redação colada e enviada para correção.');}
    catch(error){textarea.disabled=false;send.disabled=false;send.textContent='Tentar enviar novamente';studentUploadError(error.message||'Não foi possível enviar o texto.');}
  };
  dialog.showModal();textarea.focus();
}

document.addEventListener('click',event=>{
  if(S?.profile?.role!=='student')return;
  const paste=event.target?.closest?.('[data-student-paste]');
  if(!paste||paste.disabled)return;
  const roundId=paste.getAttribute('data-student-paste');if(!roundId)return;
  event.preventDefault();event.stopImmediatePropagation();openStudentPaste(roundId);
},true);

// Corrige a classificação global dos avisos: falha de conexão nunca pode aparecer como “Ação concluída”.
if(typeof window.actionAlert==='function'){
  window.toast=function(message){
    const text=String(message||'');
    const isError=/não foi possível|falh|erro|inválid|expirad|incorret|bloquead|insuficiente|conexão caiu|interrompid|recusou|tente novamente|indisponível/i.test(text);
    window.actionAlert(text,isError?'Atenção':'Ação concluída');
  };
}
