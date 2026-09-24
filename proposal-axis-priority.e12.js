'use strict';
(function(){
 const STYLE_ID='proposalAxisPriorityStyle';
 let timer=null;
 function style(){
  if(document.getElementById(STYLE_ID))return;
  const el=document.createElement('style');
  el.id=STYLE_ID;
  el.textContent=`
   .proposal-axis-stack{grid-template-columns:1fr!important;gap:12px!important}
   .proposal-axis-priority{order:-1;border:1px solid #e3a7a1;background:#fff8f7;border-radius:14px;padding:14px 16px;color:#7f1717;font-weight:800}
   .proposal-axis-priority select{margin-top:8px;background:#fff;border-color:#dca09a!important;font-weight:700;color:#202936}
   .proposal-axis-kicker{display:block;margin-top:4px;color:#9d0b18;font-size:12px;font-weight:800;letter-spacing:.01em}
   .proposal-axis-helper{display:block;margin-top:7px;color:#756765;font-size:12px;font-weight:600;line-height:1.4}
   .proposal-theme-after-axis{order:0}
   @media(max-width:760px){.proposal-axis-priority{padding:13px 14px}.proposal-axis-priority select{min-height:46px}}
  `;
  document.head.appendChild(el);
 }
 function apply(){
  style();
  const axis=document.getElementById('pvAxis'),theme=document.getElementById('pvTheme');
  if(!axis||!theme)return;
  const axisLabel=axis.closest('label'),themeLabel=theme.closest('label'),grid=axis.closest('.proposal-v2-grid');
  if(!axisLabel||!themeLabel||!grid)return;
  grid.classList.add('proposal-axis-stack');
  axisLabel.classList.add('proposal-axis-priority');
  themeLabel.classList.add('proposal-theme-after-axis');
  if(grid.firstElementChild!==axisLabel)grid.insertBefore(axisLabel,themeLabel);
  if(!axisLabel.querySelector('.proposal-axis-kicker')){
   const kicker=document.createElement('span');
   kicker.className='proposal-axis-kicker';
   kicker.textContent='Base para a criação com IA';
   axisLabel.insertBefore(kicker,axis);
  }
  if(!axisLabel.querySelector('.proposal-axis-helper')){
   const helper=document.createElement('span');
   helper.className='proposal-axis-helper';
   helper.textContent='Escolha o eixo antes de gerar a proposta com IA.';
   axis.insertAdjacentElement('afterend',helper);
  }
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(apply,50)}
 const view=document.getElementById('view');
 if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true});
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 schedule();
})();
