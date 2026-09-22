'use strict';

let activeActionAlert=null;

function actionAlert(message,title='Ação concluída'){
  const text=String(message||'').trim()||'Ação concluída.';
  if(activeActionAlert?.isConnected){
    const heading=activeActionAlert.querySelector('h2');
    const paragraph=activeActionAlert.querySelector('p');
    if(heading)heading.textContent=title;
    if(paragraph)paragraph.textContent=text;
    if(!activeActionAlert.open)activeActionAlert.showModal();
    return;
  }
  const previous=document.activeElement;
  const dialog=document.createElement('dialog');
  dialog.className='app-confirm action-alert';
  dialog.innerHTML='<h2></h2><p></p><div class="item-actions"><button class="btn primary" data-ok>OK</button></div>';
  dialog.querySelector('h2').textContent=title;
  dialog.querySelector('p').textContent=text;
  document.body.appendChild(dialog);
  activeActionAlert=dialog;
  const close=()=>{
    if(activeActionAlert===dialog)activeActionAlert=null;
    try{dialog.close()}catch{}
    dialog.remove();
    try{previous?.focus?.()}catch{}
  };
  dialog.querySelector('[data-ok]').onclick=close;
  dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
  dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
  dialog.showModal();
  dialog.querySelector('[data-ok]')?.focus();
}

// Padrão VERSÃO: mensagens de ação deixam de usar o aviso pequeno no rodapé.
window.actionAlert=actionAlert;
window.toast=function(message){
  const text=String(message||'');
  const title=/não foi possível|falh|erro|inválid|expirad|incorret|bloquead|insuficiente/i.test(text)?'Atenção':'Ação concluída';
  actionAlert(text,title);
};

// Upload mais resiliente no mobile: reduz imagens grandes e repete uma vez somente em falha de rede/sessão.
const baseUploadEssay=uploadEssay;
async function optimizeEssayUploadFile(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<=4*1024*1024)return file;
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Não foi possível preparar a imagem para envio.'));img.src=url;});
    const maxSide=3000,scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
    if(scale===1)return file;
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext('2d');
    if(!ctx)return file;
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.9));
    if(!blob||blob.size>=file.size)return file;
    const name=(file.name||'redacao').replace(/\.[^.]+$/,'')+'.jpg';
    return new File([blob],name,{type:'image/jpeg',lastModified:file.lastModified||Date.now()});
  }finally{URL.revokeObjectURL(url)}
}
uploadEssay=async function(slug,fields,file){
  const prepared=await optimizeEssayUploadFile(file);
  let lastError=null;
  for(let attempt=0;attempt<2;attempt++){
    try{return await baseUploadEssay(slug,fields,prepared)}
    catch(error){
      lastError=error;
      const message=String(error?.message||error||'');
      if(attempt===0&&/sessão inválida|sessão expirada|não autenticado/i.test(message)&&S?.session?.refresh_token){
        try{
          const refreshed=await refreshSession(S.session);
          if(refreshed){S.session=refreshed;continue}
        }catch{}
      }
      if(attempt===0&&/não foi possível conectar ao servidor|conexão demorou|failed to fetch|networkerror|load failed/i.test(message)){
        await new Promise(resolve=>setTimeout(resolve,900));
        continue;
      }
      throw error;
    }
  }
  throw lastError||Error('Não foi possível enviar o arquivo.');
};

// Toda Correção Inteligente que consome crédito pede confirmação no padrão grande do sistema.
const aiActionAuthorized=new WeakSet();
document.addEventListener('click',async event=>{
  const button=event.target?.closest?.('[data-ai-redo],[data-ai]');
  if(!button||button.disabled||aiActionAuthorized.has(button))return;
  const label=(button.textContent||'').trim();
  const isRedo=/refazer/i.test(label)||button.hasAttribute('data-ai-redo');
  event.preventDefault();
  event.stopImmediatePropagation();
  const message=isRedo
    ?'Refazer a Correção Inteligente? Uma nova análise consome 1 crédito. A correção já publicada continuará disponível até você validar a nova versão.'
    :'Iniciar a Correção Inteligente? Esta análise consome 1 crédito. Em caso de falha, o crédito é devolvido.';
  const confirmed=await appConfirm(message);
  if(!confirmed)return;
  aiActionAuthorized.add(button);
  try{button.click()}finally{aiActionAuthorized.delete(button)}
},true);

// Listas de alunos do professor ficam sempre em ordem alfabética pt-BR.
const studentNameCollator=new Intl.Collator('pt-BR',{sensitivity:'base',numeric:true});
function sortTeacherStudentLists(root=document){
  root.querySelectorAll?.('.org-students').forEach(list=>{
    const rows=[...list.children].filter(row=>row.matches('li[data-student-search]'));
    if(rows.length<2)return;
    const ordered=[...rows].sort((a,b)=>studentNameCollator.compare(
      (a.querySelector('b')?.textContent||'').trim(),
      (b.querySelector('b')?.textContent||'').trim()
    ));
    if(rows.every((row,index)=>row===ordered[index]))return;
    ordered.forEach(row=>list.appendChild(row));
  });
}
const studentListObserver=new MutationObserver(()=>sortTeacherStudentLists());

function installStudentSendMenu(){
  if(S?.profile?.role!=='student')return;
  const nav=document.getElementById('nav');
  if(!nav||nav.querySelector('[data-student-send-menu]'))return;
  const button=document.createElement('button');
  button.type='button';
  button.setAttribute('data-student-send-menu','');
  button.innerHTML='<span class="dot"></span>Enviar redação';
  const proposals=nav.querySelector('[data-route="student-proposals"]');
  if(proposals)proposals.after(button);else nav.prepend(button);
}

const originalBuildNav=window.buildNav;
if(typeof originalBuildNav==='function'){
  window.buildNav=function(){
    originalBuildNav();
    installStudentSendMenu();
  };
}

function studentSendSetActive(){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.hasAttribute('data-student-send-menu')));
}

const STUDENT_ACCEPTED_FILES='JPG, PNG, WEBP, PDF ou Word (.DOCX)';
const STUDENT_ACCEPT_ATTR='image/jpeg,image/png,image/webp,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
function studentFileKind(file){
  if(file?.type===DOCX_MIME||/\.docx$/i.test(file?.name||''))return 'docx';
  if(file?.type==='application/pdf')return 'pdf';
  if(['image/jpeg','image/png','image/webp'].includes(file?.type))return 'image';
  return 'other';
}

async function renderStudentSendPage(){
  if(S?.profile?.role!=='student')return;
  invalidateNavigation();
  S.route='student-send';
  studentSendSetActive();
  closeDrawer();
  const view=document.getElementById('view');
  view.innerHTML='<div class="empty">Carregando propostas...</div>';
  try{
    const p=await studentProposals(true);
    const ids=(p.proposals||[]).map(x=>x.id);
    const states=ids.length?(await edge(API.studentSub,{action:'states',round_ids:ids})).states||[]:[];
    const sm=new Map(states.map(s=>[s.round_id,s]));
    if(S.route!=='student-send')return;
    const cards=(p.proposals||[]).map(r=>{
      const st=sm.get(r.id),sub=st?.submission,editable=st?.editable===true;
      const photoLabel=sub?'Refazer foto':'Tirar foto';
      const fileLabel=sub?'Substituir arquivo':'Selecionar arquivo';
      const status=sub?.status==='approved'?'Aprovada':sub?'Enviada':'Disponível';
      const cls=sub?.status==='approved'?'ok':sub?'warn':'crimson';
      return `<article class="student-card"><div class="item-top"><div><div class="item-title">R${esc(r.number??'—')} · ${esc(r.theme)}</div>${r.due_date?`<div class="item-meta">Prazo: ${fmtDate(r.due_date)}</div>`:''}</div><span class="pill ${cls}">${status}</span></div><p class="muted">${esc(r.proposal_command||'')}</p><div class="item-actions"><button class="btn primary" data-student-camera="${esc(r.id)}" ${editable?'':'disabled'}>${editable?photoLabel:(sub?.status==='approved'?'Correção concluída':'Envio indisponível')}</button><button class="btn soft-btn" data-student-file="${esc(r.id)}" ${editable?'':'disabled'}>${editable?fileLabel:'Selecionar arquivo'}</button></div>${editable?`<div class="safe-note"><b>Arquivos aceitos:</b> ${STUDENT_ACCEPTED_FILES}. Uma página, até 15 MB. Arquivos Word são convertidos automaticamente para PDF antes da correção.</div>`:''}</article>`;
    }).join('');
    view.innerHTML=header('Enviar redação',`Escolha a proposta. Arquivos aceitos: ${STUDENT_ACCEPTED_FILES}.`)+`<div class="list" id="studentSendList">${cards||'<div class="empty">Nenhuma proposta disponível para envio.</div>'}</div>`;
  }catch(error){
    if(S.route==='student-send')view.innerHTML=header('Enviar redação','Não foi possível carregar suas propostas.')+`<div class="card"><p>${esc(error.message||error)}</p><button class="btn primary" data-student-send-menu>Tentar novamente</button></div>`;
  }
}

function closeStudentPhotoDialog(dialog){
  try{dialog.close()}catch{}
  dialog.remove();
}

async function openStudentCamera(roundId){
  if(!roundId||S?.profile?.role!=='student')return;
  const input=document.createElement('input');
  input.type='file';
  input.accept='image/jpeg,image/png,image/webp';
  input.setAttribute('capture','environment');
  input.hidden=true;
  document.body.appendChild(input);
  const cleanup=()=>input.remove();
  input.onchange=async()=>{
    const file=input.files?.[0];
    if(!file){cleanup();return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024){cleanup();toast('Use uma foto JPG, PNG ou WEBP de até 15 MB.');return;}
    let warnings=[];
    try{warnings=await inspectEssayPhoto(file)}catch(error){cleanup();toast(error.message||'Não foi possível verificar a foto.');return;}
    const url=URL.createObjectURL(file);
    const dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';
    dialog.innerHTML=`<h2>Conferir foto</h2><img src="${url}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:52vh;margin:0 auto 12px;object-fit:contain"><p role="status">${esc(warnings.length?warnings.join(' '):'Confira se todas as linhas estão legíveis, sem cortes, sombras ou reflexos.')}</p>${warnings.length?'':`<label class="photo-confirm"><input type="checkbox" data-student-photo-ok> Conferi a foto e todas as linhas estão legíveis.</label>`}<div class="item-actions"><button type="button" class="btn soft-btn" data-student-retake>Refazer foto</button>${warnings.length?'':'<button type="button" class="btn primary" data-student-photo-send disabled>Enviar para correção</button>'}</div>`;
    document.body.appendChild(dialog);
    const finish=()=>{URL.revokeObjectURL(url);closeStudentPhotoDialog(dialog);cleanup()};
    dialog.oncancel=e=>{e.preventDefault();finish()};
    dialog.querySelector('[data-student-retake]').onclick=()=>{finish();setTimeout(()=>openStudentCamera(roundId),0)};
    const check=dialog.querySelector('[data-student-photo-ok]'),send=dialog.querySelector('[data-student-photo-send]');
    if(check&&send){
      check.onchange=()=>send.disabled=!check.checked;
      send.onclick=async()=>{
        if(send.disabled)return;
        send.disabled=true;check.disabled=true;send.textContent='Enviando...';
        try{
          await uploadEssay(API.studentSub,{action:'upload',round_id:roundId},file);
          await edge(API.studentSub,{action:'finalize',round_id:roundId});
          S.cache={};S.student=null;
          finish();
          await navigate('student-essays');
          toast('Redação enviada para correção.');
        }catch(error){
          send.disabled=false;check.disabled=false;send.textContent='Tentar enviar novamente';toast(error.message||'Falha no envio.');
        }
      };
    }
    dialog.showModal();
  };
  input.click();
}

async function openStudentFile(roundId){
  if(!roundId||S?.profile?.role!=='student')return;
  const input=document.createElement('input');
  input.type='file';
  input.accept=STUDENT_ACCEPT_ATTR;
  input.hidden=true;
  document.body.appendChild(input);
  const cleanup=()=>input.remove();
  input.onchange=async()=>{
    const file=input.files?.[0];
    if(!file){cleanup();return;}
    const kind=studentFileKind(file);
    if(kind==='other'||file.size>15*1024*1024){
      cleanup();
      toast(`Arquivos aceitos: ${STUDENT_ACCEPTED_FILES}. Máximo de 15 MB.`);
      return;
    }
    let warnings=[];
    if(kind==='image'){
      try{warnings=await inspectEssayPhoto(file)}catch(error){cleanup();toast(error.message||'Não foi possível verificar a imagem.');return;}
    }
    let preview='',objectUrl='';
    if(kind==='pdf'){
      preview=`<div class="safe-note"><b>PDF selecionado:</b> ${esc(file.name)}<br>O PDF deve ter exatamente uma página.</div>`;
    }else if(kind==='docx'){
      preview=`<div class="safe-note"><b>Word selecionado:</b> ${esc(file.name)}<br>O VERSÃO converterá o texto do .DOCX para PDF antes da correção. O documento deve conter somente a redação.</div>`;
    }else{
      objectUrl=URL.createObjectURL(file);
      preview=`<img src="${objectUrl}" alt="Prévia da redação" style="display:block;max-width:100%;max-height:52vh;margin:0 auto 12px;object-fit:contain">`;
    }
    const dialog=document.createElement('dialog');
    dialog.className='app-confirm student-photo-confirm';
    const statusText=warnings.length?warnings.join(' '):kind==='pdf'?'Confira se o PDF tem uma única página e está legível.':kind==='docx'?'Confira se este arquivo Word contém apenas a redação que deseja enviar.':'Confira se todas as linhas estão legíveis, sem cortes, sombras ou reflexos.';
    dialog.innerHTML=`<h2>Conferir arquivo</h2><p class="muted"><b>Arquivos aceitos:</b> ${STUDENT_ACCEPTED_FILES}</p>${preview}<p role="status">${esc(statusText)}</p>${warnings.length?'':`<label class="photo-confirm"><input type="checkbox" data-student-file-ok> Conferi o arquivo e a redação está completa.</label>`}<div class="item-actions"><button type="button" class="btn soft-btn" data-student-file-change>Escolher outro arquivo</button>${warnings.length?'':'<button type="button" class="btn primary" data-student-file-send disabled>Enviar para correção</button>'}</div>`;
    document.body.appendChild(dialog);
    const finish=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);closeStudentPhotoDialog(dialog);cleanup()};
    dialog.oncancel=e=>{e.preventDefault();finish()};
    dialog.querySelector('[data-student-file-change]').onclick=()=>{finish();setTimeout(()=>openStudentFile(roundId),0)};
    const check=dialog.querySelector('[data-student-file-ok]'),send=dialog.querySelector('[data-student-file-send]');
    if(check&&send){
      check.onchange=()=>send.disabled=!check.checked;
      send.onclick=async()=>{
        if(send.disabled)return;
        send.disabled=true;check.disabled=true;send.textContent='Enviando...';
        try{
          const uploaded=await uploadEssay(API.studentSub,{action:'upload',round_id:roundId},file);
          await edge(API.studentSub,{action:'finalize',round_id:roundId});
          S.cache={};S.student=null;
          finish();
          await navigate('student-essays');
          toast(uploaded?.converted_from==='docx'?'Word convertido e redação enviada para correção.':'Redação enviada para correção.');
        }catch(error){
          send.disabled=false;check.disabled=false;send.textContent='Tentar enviar novamente';
          toast(error.message||'Falha no envio. O arquivo continua selecionado; tente novamente.');
        }
      };
    }
    dialog.showModal();
  };
  input.click();
}

document.addEventListener('click',event=>{
  if(S?.profile?.role!=='student')return;
  const shortcut=event.target?.closest?.('[data-student-send-menu],#studentSendShortcut');
  if(shortcut){
    event.preventDefault();event.stopImmediatePropagation();renderStudentSendPage();return;
  }
  const camera=event.target?.closest?.('[data-student-camera]');
  if(camera&&!camera.disabled){
    const roundId=camera.getAttribute('data-student-camera');
    if(roundId){event.preventDefault();event.stopImmediatePropagation();openStudentCamera(roundId);return;}
  }
  const file=event.target?.closest?.('[data-student-file],[data-student-prop]');
  if(file&&!file.disabled){
    const roundId=file.getAttribute('data-student-file')||file.getAttribute('data-student-prop');
    if(roundId){event.preventDefault();event.stopImmediatePropagation();openStudentFile(roundId);}
  }
},true);

document.addEventListener('DOMContentLoaded',()=>{
  sortTeacherStudentLists();
  studentListObserver.observe(document.body,{childList:true,subtree:true});
  installStudentSendMenu();

  const classCode=document.getElementById('classCode');
  if(classCode){
    classCode.maxLength=40;
    classCode.pattern='(?:[A-Fa-f0-9]{12}|[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-[0-9]{2}-[0-9]{3})';
    classCode.placeholder='Ex.: 3b-26-417';
    classCode.autocapitalize='none';
    classCode.spellcheck=false;
  }
},{once:true});
