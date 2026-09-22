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
      const label=sub?'Refazer foto':'Abrir câmera';
      const status=sub?.status==='approved'?'Aprovada':sub?'Enviada':'Disponível';
      const cls=sub?.status==='approved'?'ok':sub?'warn':'crimson';
      return `<article class="student-card"><div class="item-top"><div><div class="item-title">R${esc(r.number??'—')} · ${esc(r.theme)}</div>${r.due_date?`<div class="item-meta">Prazo: ${fmtDate(r.due_date)}</div>`:''}</div><span class="pill ${cls}">${status}</span></div><p class="muted">${esc(r.proposal_command||'')}</p><button class="btn primary full" data-student-camera="${esc(r.id)}" ${editable?'':'disabled'}>${editable?label:(sub?.status==='approved'?'Correção concluída':'Envio indisponível')}</button></article>`;
    }).join('');
    view.innerHTML=header('Enviar redação','Escolha a proposta e fotografe sua redação.')+`<div class="list" id="studentSendList">${cards||'<div class="empty">Nenhuma proposta disponível para envio.</div>'}</div>`;
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
          send.disabled=false;check.disabled=false;send.textContent='Enviar para correção';toast(error.message||'Falha no envio.');
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
  const camera=event.target?.closest?.('[data-student-camera],[data-student-prop]');
  if(camera&&!camera.disabled){
    const roundId=camera.getAttribute('data-student-camera')||camera.getAttribute('data-student-prop');
    if(roundId){event.preventDefault();event.stopImmediatePropagation();openStudentCamera(roundId)}
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
