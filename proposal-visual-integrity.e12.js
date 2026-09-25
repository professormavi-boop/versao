'use strict';
(function(){
 const STYLE_ID='proposalVisualIntegrityStyle';
 let timer=null;

 function ensureStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
   /* VERSÃO — Propostas usa a mesma paleta e linguagem visual do restante do app */
   .proposal-v2{max-width:980px;margin:0 auto;gap:18px!important}
   .proposal-v2-editor{gap:16px!important}
   .proposal-v2-section{border:1px solid var(--line)!important;border-radius:18px!important;background:#fff!important;box-shadow:0 6px 22px rgba(70,25,25,.035)!important}
   .proposal-v2-section>header h2{color:var(--ink)!important;font-size:18px!important}
   .proposal-v2-section>header p{color:var(--muted)!important}

   /* Abas no mesmo padrão aprovado */
   .proposal-approved-tabs{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px!important;padding:6px!important;margin:0 0 18px!important;border:1px solid var(--line)!important;border-radius:16px!important;background:#fffafa!important;overflow:visible!important}
   .proposal-approved-tab{border:0!important;border-radius:11px!important;padding:13px 14px!important;margin:0!important;background:transparent!important;color:var(--crimson)!important;font-weight:900!important;text-align:center!important;min-height:48px!important}
   .proposal-approved-tab.active{background:var(--crimson)!important;color:#fff!important;box-shadow:0 7px 18px rgba(139,28,28,.16)!important}

   /* Selects: mesmos 46px, borda, raio e cor do VERSÃO */
   #proposalV2Form select,#proposalFilter{height:46px!important;min-height:46px!important;width:100%!important;margin-top:6px!important;padding:0 42px 0 12px!important;border:1px solid #D8D1CF!important;border-radius:12px!important;background-color:#fff!important;color:var(--ink)!important;font-weight:600!important;box-shadow:none!important;outline:none!important;appearance:auto!important}
   #proposalV2Form select:focus,#proposalFilter:focus{border-color:var(--crimson)!important;box-shadow:0 0 0 3px rgba(139,28,28,.08)!important}
   #proposalV2Form select:disabled{background:#F7F5F4!important;color:var(--muted)!important}
   .versao-select-option[aria-selected="true"]{background:var(--soft)!important;color:var(--crimson)!important}
   .versao-select-option:hover,.versao-select-option:focus-visible{background:#FFF7F6!important}

   /* Eixo continua prioritário, mas integrado à identidade visual */
   .proposal-axis-priority{order:-1!important;border:1px solid #D9C5C2!important;background:var(--soft)!important;border-radius:14px!important;padding:14px 16px!important;color:var(--ink)!important;font-weight:800!important}
   .proposal-axis-priority select{border-color:#D8D1CF!important;background:#fff!important;color:var(--ink)!important}
   .proposal-axis-kicker{color:var(--crimson)!important;font-size:12px!important;font-weight:900!important;text-transform:none!important}
   .proposal-axis-helper{color:var(--muted)!important;font-weight:600!important}

   /* Hero de criação inteligente */
   .proposal-ai-sell{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;align-items:center;border:1px solid #D9C5C2;border-radius:18px;background:linear-gradient(145deg,#FFF9F8 0%,var(--soft) 100%);padding:18px 20px;box-shadow:0 8px 26px rgba(139,28,28,.055);margin-bottom:2px}
   .proposal-ai-sell-icon{width:54px;height:54px;border-radius:15px;background:#fff;border:1px solid #E5D9D7;color:var(--crimson);display:grid;place-items:center;font-size:25px;font-weight:900;flex:0 0 auto}
   .proposal-ai-sell-copy{min-width:0}.proposal-ai-sell-copy strong{display:block;color:var(--ink);font-size:18px;line-height:1.25;margin-bottom:4px}.proposal-ai-sell-copy p{margin:0;color:var(--muted);font-size:13.5px;line-height:1.45}
   .proposal-ai-sell-action{display:grid;gap:7px;justify-items:end;min-width:180px}
   .proposal-ai-sell #pvGenerate{min-height:48px!important;padding:0 20px!important;border:0!important;border-radius:12px!important;background:var(--crimson)!important;color:#fff!important;font-weight:900!important;box-shadow:0 8px 18px rgba(139,28,28,.18)!important;white-space:nowrap}
   .proposal-ai-sell #pvGenerate:hover{background:var(--crimson2)!important}
   .proposal-ai-sell #pvGenerate:disabled{opacity:.58!important}
   .proposal-ai-sell #pvCredits{font-size:11.5px!important;color:#76514F!important;text-align:right;line-height:1.35;max-width:230px}
   .proposal-ai-sell #pvCreditNotice{grid-column:1/-1;margin:0!important}
   .proposal-ai-kicker{display:inline-flex;align-items:center;gap:6px;color:var(--crimson);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}

   /* Formulário mais coerente com o restante do app */
   #proposalV2Form .field strong,#proposalV2Form label>strong{color:var(--ink)!important}
   #proposalV2Form input,#proposalV2Form textarea{border-color:#D8D1CF!important;border-radius:12px!important}
   #proposalV2Form input:focus,#proposalV2Form textarea:focus,#pvCommand:focus{border-color:var(--crimson)!important;box-shadow:0 0 0 3px rgba(139,28,28,.08)!important;outline:none!important}
   #pvFormat .btn{border-color:#E5D9D7!important;background:#FFF9F8!important;color:var(--crimson)!important}
   .proposal-v2-footer .primary,.proposal-v3-preview-actions .primary{background:var(--crimson)!important;color:#fff!important}

   /* Vermelho único em toda a área de Propostas */
   .proposal-v3-all{color:var(--crimson)!important;border-color:#D9C5C2!important;background:var(--soft)!important}
   .proposal-v3-all input,#pvClassBox input{accent-color:var(--crimson)!important}
   .proposal-v3-org>summary:before{background:var(--crimson)!important}
   #pvSummary,.proposal-v3-understand b,.proposal-v3-chip{color:var(--crimson)!important}
   .proposal-v3-chip{background:var(--soft)!important}
   .proposal-ai-loader-brand{color:var(--crimson)!important}
   .proposal-ai-loader-ring{background:conic-gradient(var(--crimson) 0 24%,#EAD9D7 24% 100%)!important}
   .proposal-ai-loader-ring:after{color:var(--crimson)!important}
   .proposal-ai-loader-progress span{background:var(--crimson)!important}

   /* Cards de propostas criadas */
   .proposal-v2-list .proposal-approved-card{border-color:var(--line)!important;border-radius:18px!important;box-shadow:0 6px 22px rgba(70,25,25,.035)!important}
   .proposal-v2-list .proposal-approved-card .item-actions .btn{border-color:#E5D9D7!important;background:#FFF9F8!important;color:var(--crimson)!important}
   .proposal-v2-list .proposal-approved-card .pill.ok{background:#E9F6ED!important;color:var(--ok)!important}

   @media(max-width:760px){
    .proposal-v2{max-width:none}.proposal-approved-tabs{border-radius:14px!important}.proposal-approved-tab{min-height:46px!important;padding:11px 8px!important;font-size:14px!important}
    .proposal-ai-sell{grid-template-columns:auto minmax(0,1fr);padding:16px;gap:12px;border-radius:16px}.proposal-ai-sell-icon{width:48px;height:48px;border-radius:13px}.proposal-ai-sell-copy strong{font-size:17px}.proposal-ai-sell-copy p{font-size:13px}.proposal-ai-sell-action{grid-column:1/-1;width:100%;justify-items:stretch;min-width:0}.proposal-ai-sell #pvGenerate{width:100%!important}.proposal-ai-sell #pvCredits{text-align:left;max-width:none}
   }
  `;
  document.head.appendChild(style);
 }

 function enhanceAI(){
  const form=document.getElementById('proposalV2Form');
  const generate=document.getElementById('pvGenerate');
  const credits=document.getElementById('pvCredits');
  const notice=document.getElementById('pvCreditNotice');
  const axis=document.getElementById('pvAxis');
  if(!form||!generate||!credits||!axis||form.querySelector('.proposal-ai-sell'))return;
  const section=axis.closest('.proposal-v2-section');
  const grid=axis.closest('.proposal-v2-grid');
  if(!section||!grid)return;
  const hero=document.createElement('div');
  hero.className='proposal-ai-sell';
  hero.innerHTML=`<div class="proposal-ai-sell-icon" aria-hidden="true">✦</div><div class="proposal-ai-sell-copy"><span class="proposal-ai-kicker">Inteligência VERSÃO</span><strong>Crie sua proposta com IA</strong><p>Escolha o eixo temático e deixe o VERSÃO estruturar tema, comando e textos motivadores para você revisar.</p></div><div class="proposal-ai-sell-action"></div>`;
  const action=hero.querySelector('.proposal-ai-sell-action');
  generate.textContent='Criar com IA';
  action.append(generate,credits);
  if(notice)hero.appendChild(notice);
  section.insertBefore(hero,grid);
  const oldActions=[...section.querySelectorAll('.proposal-v2-actions')].find(row=>row.children.length===0||(!row.querySelector('button')&&!row.querySelector('span')));
  if(oldActions)oldActions.remove();
 }

 function enhanceSectionHeading(){
  const axis=document.getElementById('pvAxis');
  const section=axis?.closest('.proposal-v2-section');
  const heading=section?.querySelector(':scope > header h2');
  const text=section?.querySelector(':scope > header p');
  if(heading&&heading.textContent.includes('Tema e orientação'))heading.textContent='1. Criação da proposta';
  if(text)text.textContent='Comece pelo eixo temático. Depois, crie com IA ou preencha manualmente.';
 }

 function apply(){ensureStyle();enhanceAI();enhanceSectionHeading()}
 function schedule(){clearTimeout(timer);timer=setTimeout(apply,40)}
 const view=document.getElementById('view');
 if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true});
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 schedule();
})();
