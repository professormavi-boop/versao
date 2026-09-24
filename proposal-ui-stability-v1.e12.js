'use strict';
(function(){
 const STYLE_ID='proposalUiStabilityV1Style';
 function ensureStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;
  s.textContent=`
   .versao-toast-lite{position:fixed;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9999;max-width:min(520px,calc(100vw - 28px));background:#202936;color:#fff;border-radius:14px;padding:12px 16px;box-shadow:0 12px 34px rgba(16,24,40,.22);font-size:14px;line-height:1.45;pointer-events:none;opacity:0;animation:versaoToastIn .18s ease forwards}
   .versao-toast-lite.error{background:#8f1519}
   @keyframes versaoToastIn{to{opacity:1;transform:translate(-50%,-4px)}}
  `;document.head.appendChild(s);
 }
 function liteToast(message){
  ensureStyle();document.querySelector('.versao-toast-lite')?.remove();
  const text=String(message||'').trim();if(!text)return;
  const el=document.createElement('div');el.className='versao-toast-lite';
  if(/não foi possível|falh|erro|inválid|expirad|incorret|bloquead|insuficiente|conexão|interrompid|recusou|tente novamente|indisponível/i.test(text))el.classList.add('error');
  el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),3600);
 }
 window.toast=liteToast;
 function cleanProposalTitles(root=document){
  root.querySelectorAll?.('.proposal-v2-list .item-title').forEach(el=>{
   const t=el.textContent||'';const clean=t.replace(/^R(?:\d+|—)\s*·\s*/,'');if(clean!==t)el.textContent=clean;
  });
 }
 function convertBlockingSuccess(root=document){
  root.querySelectorAll?.('dialog.proposal-v2-success').forEach(dialog=>{
   const msg=dialog.querySelector('p')?.textContent?.trim()||dialog.querySelector('h2')?.textContent?.trim()||'Proposta atualizada.';
   try{if(dialog.open)dialog.close()}catch{}
   dialog.remove();liteToast(msg);
  });
 }
 function apply(){cleanProposalTitles();convertBlockingSuccess()}
 const observer=new MutationObserver(()=>apply());
 document.addEventListener('DOMContentLoaded',()=>{ensureStyle();apply();observer.observe(document.body,{subtree:true,childList:true})},{once:true});
 ensureStyle();if(document.body){apply();observer.observe(document.body,{subtree:true,childList:true})}
})();
