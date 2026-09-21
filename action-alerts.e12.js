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
