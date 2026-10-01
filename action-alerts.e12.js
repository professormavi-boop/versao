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

// Regra global de interface: o VERSÃO nunca usa alert/confirm/prompt nativos do navegador.
// alert é convertido para o componente visual do sistema. confirm/prompt são bloqueados por
// serem APIs síncronas; fluxos de confirmação devem usar appConfirm ou controles inline.
window.alert=function(message){
  actionAlert(message,'Atenção');
};
window.confirm=function(message){
  console.error('[VERSÃO] confirm() nativo bloqueado. Use appConfirm().',message);
  return false;
};
window.prompt=function(message){
  console.error('[VERSÃO] prompt() nativo bloqueado. Use um campo/formulário do sistema.',message);
  return null;
};
window.__VERSAO_UI_RULES__=Object.freeze({nativeDialogs:false,confirmation:'appConfirm',messages:'actionAlert/toast'});

// Navegação do professor: mantém as rotas homologadas e apenas agrupa a organização escolar.
const teacherSchoolRoutes=new Set(['teacher-organization','teacher-classes','teacher-students','teacher-import']);
const baseBuildNav=typeof buildNav==='function'?buildNav:null;
const baseSetActive=typeof setActive==='function'?setActive:null;
if(baseBuildNav){
  buildNav=function(){
    baseBuildNav();
    if(S?.profile?.role!=='teacher')return;
    const nav=document.getElementById('nav');
    if(!nav||nav.querySelector('.teacher-nav-group'))return;
    const items=[
      [nav.querySelector('button[data-route="teacher-organization"]'),'Gerenciar escolas'],
      [nav.querySelector('button[data-route="teacher-classes"]'),'Turmas'],
      [nav.querySelector('button[data-route="teacher-students"]'),'Alunos'],
      [nav.querySelector('button[data-route="teacher-import"]'),'Importar alunos']
    ];
    if(items.some(([button])=>!button))return;
    if(!document.getElementById('teacherNavStyles')){
      const style=document.createElement('style');
      style.id='teacherNavStyles';
      style.textContent='.nav .teacher-nav-group>summary{display:flex;align-items:center;gap:10px;border-radius:12px;color:#4E4B4D;list-style:none}.nav .teacher-nav-group>summary::-webkit-details-marker{display:none}.nav .teacher-nav-group>summary:hover{background:#FAF5F4}.nav .teacher-nav-group>button{padding-left:30px!important}';
      document.head.appendChild(style);
    }
    const group=document.createElement('details');
    group.className='admin-nav-group teacher-nav-group';
    group.open=teacherSchoolRoutes.has(S.route);
    const summary=document.createElement('summary');
    summary.innerHTML='<span class="dot"></span><span>Escolas</span>';
    group.appendChild(summary);
    const firstButton=items[0][0];
    firstButton.before(group);
    for(const [button,label] of items){
      if(['teacher-classes','teacher-students'].includes(button.dataset.route)){button.remove();continue;}
      button.textContent=label;
      group.appendChild(button);
    }
  };
}
if(baseSetActive){
  setActive=function(route){
    baseSetActive(route);
    const group=document.querySelector('.teacher-nav-group');
    if(group&&teacherSchoolRoutes.has(route))group.open=true;
  };
}

// Compatibilidade temporária com rotas antigas ainda referenciadas pelo bootstrap/core.
// A gestão atual passa por renderPlatformPage; estas aliases evitam bloquear o login
// enquanto as referências legadas são removidas em uma limpeza posterior.
async function renderManagement(navigation){
  if(typeof renderPlatformPage==='function')return renderPlatformPage(navigation);
  throw Error('Gestão da plataforma indisponível.');
}
async function renderAdminAccounts(navigation){
  if(typeof renderPlatformPage==='function')return renderPlatformPage(navigation);
  throw Error('Gestão da plataforma indisponível.');
}

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

document.addEventListener('DOMContentLoaded',()=>{

  const classCode=document.getElementById('classCode');
  if(classCode){
    classCode.maxLength=40;
    classCode.pattern='(?:[A-Fa-f0-9]{12}|[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*-[0-9]{2}-[0-9]{3})';
    classCode.placeholder='Ex.: 3b-26-417';
    classCode.autocapitalize='none';
    classCode.spellcheck=false;
  }
},{once:true});
