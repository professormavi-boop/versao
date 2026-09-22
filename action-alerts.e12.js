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

window.actionAlert=actionAlert;
window.toast=function(message){
  const text=String(message||'');
  const isError=/não foi possível|falh|erro|inválid|expirad|incorret|bloquead|insuficiente|conexão|interrompid|recusou|tente novamente|indisponível/i.test(text);
  actionAlert(text,isError?'Atenção':'Ação concluída');
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

document.addEventListener('DOMContentLoaded',()=>{
  sortTeacherStudentLists();
  studentListObserver.observe(document.body,{childList:true,subtree:true});

  const classCode=document.getElementById('classCode');
  if(classCode){
    classCode.maxLength=40;
    classCode.pattern='(?:[A-Fa-f0-9]{12}|[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-[0-9]{2}-[0-9]{3})';
    classCode.placeholder='Ex.: 3b-26-417';
    classCode.autocapitalize='none';
    classCode.spellcheck=false;
  }
},{once:true});
