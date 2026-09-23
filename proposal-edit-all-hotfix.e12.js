'use strict';
(function(){
 let editingRoundId=null;
 const originalEdge=window.edge;
 if(typeof originalEdge==='function'){
  window.edge=async function(slug,body={},retried=false){
   if(slug==='proposal-beta-api'&&body?.action==='save_all'&&editingRoundId){
    return originalEdge('proposal-expand-all-api',{...body,round_id:editingRoundId},retried);
   }
   return originalEdge(slug,body,retried);
  };
 }
 function updateSummary(all,scope){
  const summary=document.getElementById('pvSummary')||document.getElementById('demoSummary');
  if(!summary)return;
  if(all.checked){
   const options=[...document.querySelectorAll('#pvOrg option[value],#demoOrg option[value]')].filter(o=>o.value);
   summary.textContent=`A proposta será aplicada a todas as suas instituições (${options.length}).`;
  }else if(scope){
   summary.textContent=`${scope.querySelectorAll('input[name="target"]:checked').length} turma(s) selecionada(s).`;
  }
 }
 function ensureOldFlow(){
  const all=document.getElementById('demoAll');
  if(!all)return;
  all.disabled=false;
  const label=all.closest('label');
  if(label&&/Todas as instituições/i.test(label.textContent||'')){
   for(const node of label.childNodes){
    if(node.nodeType===Node.TEXT_NODE&&/Todas as instituições/i.test(node.textContent||''))node.textContent=' Todas as minhas instituições';
   }
  }
 }
 function ensureV2EditingAll(){
  if(!editingRoundId)return;
  const scope=document.getElementById('pvScope'),org=document.getElementById('pvOrg');
  if(!scope||!org||document.getElementById('pvAll'))return;
  const institutions=[...org.options].filter(o=>o.value);
  if(institutions.length<2)return;
  const label=document.createElement('label');
  label.className='demo-check proposal-edit-all';
  label.innerHTML=`<input type="checkbox" id="pvAll"> <strong>Todas as minhas instituições</strong> <span class="muted">(${institutions.length} instituições)</span>`;
  scope.parentNode.insertBefore(label,scope);
  const all=label.querySelector('#pvAll');
  all.onchange=()=>{scope.hidden=all.checked;updateSummary(all,scope)};
 }
 function apply(){ensureOldFlow();ensureV2EditingAll()}
 document.addEventListener('click',event=>{
  const edit=event.target.closest('[data-edit]');
  if(edit?.dataset.edit){editingRoundId=edit.dataset.edit;setTimeout(apply,0);return}
  if(event.target.closest('#proposalNew,#proposalUiCreate,#proposalUiCreated,#proposalBack,#pvCancel,[data-route="proposals"]'))editingRoundId=null;
  setTimeout(apply,0);
 },true);
 const view=document.getElementById('view');
 if(view)new MutationObserver(apply).observe(view,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled']});
 document.addEventListener('DOMContentLoaded',apply,{once:true});
 apply();
})();
'use strict';
(function(){
 const STYLE_ID='teacherProposalRedesignStyle';
 const ENHANCED='proposalUiEnhanced';
 let scheduled=false;
 let cardRequestToken=0;
 function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
   .proposal-v2{max-width:1180px!important;gap:18px!important}
   #proposalNew{display:none!important}
   .proposal-ui-tabs{display:grid;grid-template-columns:minmax(150px,210px) minmax(170px,230px);gap:8px;align-items:center;border-bottom:1px solid var(--line,#e8e2df);margin:0 0 18px;padding:0}
   .proposal-ui-tab{appearance:none;border:1px solid #ead6d2;background:#fff;color:#7f1717;border-radius:12px 12px 0 0;padding:13px 18px;font:inherit;font-weight:750;cursor:pointer;min-height:46px;transition:.18s ease}
   .proposal-ui-tab:hover{background:#fff8f7;border-color:#dca9a2}
   .proposal-ui-tab.active{background:#9f1118;color:#fff;border-color:#9f1118;box-shadow:0 5px 16px rgba(139,28,28,.13)}
   .proposal-ui-tab:focus-visible,.proposal-ai-card button:focus-visible{outline:3px solid rgba(159,17,24,.2);outline-offset:2px}
   .proposal-ai-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;border:1px solid #e7aaa4;background:linear-gradient(115deg,#fff7f6 0%,#fffafa 65%,#fbe9e7 100%);border-radius:18px;padding:22px;margin:0 0 18px;box-shadow:0 8px 24px rgba(87,32,32,.05)}
   .proposal-ai-main{display:grid;grid-template-columns:58px minmax(0,1fr);gap:16px;align-items:start}
   .proposal-ai-icon{width:58px;height:58px;border-radius:16px;background:#f9dfdc;display:grid;place-items:center;color:#a51319;font-size:28px;font-weight:800}
   .proposal-ai-copy h2{margin:0 0 6px;font-size:20px;line-height:1.2;color:#8d1418}
   .proposal-ai-copy p{margin:0;color:var(--muted,#667085);font-size:14px;line-height:1.5;max-width:700px}
   .proposal-ai-benefits{display:flex;gap:14px;flex-wrap:wrap;margin-top:14px;color:#475467;font-size:13px}
   .proposal-ai-benefits span{display:inline-flex;align-items:center;gap:7px}
   .proposal-ai-benefits span:before{content:'✓';width:20px;height:20px;border-radius:50%;background:#f5d9d6;color:#98131a;display:grid;place-items:center;font-weight:900;font-size:11px}
   .proposal-ai-action{display:grid;justify-items:stretch;gap:8px;min-width:245px;padding-left:18px;border-left:1px solid #eccbc7}
   .proposal-ai-action #pvGenerate{background:#a90813!important;color:#fff!important;border-color:#a90813!important;font-weight:800!important;min-height:48px!important;padding:0 22px!important;border-radius:12px!important;font-size:15px!important;box-shadow:0 7px 18px rgba(169,8,19,.16)}
   .proposal-ai-action #pvGenerate:hover{filter:brightness(.95)}
   .proposal-ai-action #pvCredits{font-size:12px;line-height:1.45;text-align:center;color:#5f6673!important}
   .proposal-ai-note{font-size:11px;color:#7b8492;text-align:center;margin:0}
   .proposal-v2-toolbar{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(180px,280px)!important;gap:12px!important;align-items:end!important;margin:0 0 4px}
   .proposal-v2-toolbar .field{margin:0!important;max-width:none!important}
   .proposal-v2-toolbar small{font-weight:700;color:#475467;display:block;margin:0 0 6px}
   .proposal-v2-toolbar input,.proposal-v2-toolbar select{min-height:48px;border-radius:12px!important;background:#fff!important}
   .proposal-v2-list{gap:16px!important}
   .proposal-v2-list .list-item{border:1px solid #eadfdb!important;border-radius:18px!important;padding:22px!important;box-shadow:0 8px 26px rgba(16,24,40,.045);display:grid;gap:15px;background:#fff!important}
   .proposal-v2-list .item-top{align-items:flex-start!important;gap:16px}
   .proposal-v2-list .item-title{font-size:18px!important;line-height:1.35!important;font-weight:800!important;color:#101828!important;margin-bottom:4px}
   .proposal-v2-list .item-meta{font-size:13px!important;color:#667085!important}
   .proposal-card-preview{background:#fffafa;border:1px solid #eedbd8;border-radius:14px;padding:16px 18px;color:#475467;line-height:1.58;font-size:14px;display:grid;gap:8px}
   .proposal-card-preview p{margin:0}
   .proposal-card-preview .proposal-card-theme{font-weight:800;color:#172033}
   .proposal-card-bottom{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border-top:1px solid #f0e9e6;padding-top:14px}
   .proposal-card-status{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:#667085}
   .proposal-card-status .status-dot{width:9px;height:9px;border-radius:50%;background:#17a05e;box-shadow:0 0 0 5px rgba(23,160,94,.1)}
   .proposal-card-status .status-label{font-weight:800;color:#147946}
   .proposal-card-status[data-status="Rascunho"] .status-dot{background:#d99000;box-shadow:0 0 0 5px rgba(217,144,0,.1)}
   .proposal-card-status[data-status="Rascunho"] .status-label{color:#9a6800}
   .proposal-card-status[data-status="Oculta"] .status-dot{background:#7c8798;box-shadow:0 0 0 5px rgba(124,135,152,.1)}
   .proposal-card-status[data-status="Oculta"] .status-label{color:#596273}
   .proposal-v2-list .item-actions{display:flex!important;gap:8px!important;flex-wrap:wrap!important;justify-content:flex-end!important}
   .proposal-v2-list .item-actions .btn{min-height:42px;border-radius:11px!important;padding:0 16px!important;border:1px solid #eccdca!important;background:#fff9f8!important;color:#9b1419!important;font-weight:750!important}
   .proposal-v2-list .pill{display:none!important}
   .proposal-v2-section{border-color:#e9e1de!important;box-shadow:0 7px 24px rgba(16,24,40,.035)}
   .proposal-v2-target-list .demo-check,.proposal-edit-all{cursor:pointer;min-height:44px;display:flex;align-items:center;gap:8px}
   .proposal-v2-target-list input,#pvAll{width:18px;height:18px;accent-color:#a90813;cursor:pointer}
   @media(max-width:760px){
    .proposal-v2{gap:14px!important}
    .proposal-ui-tabs{grid-template-columns:1fr 1fr;margin-bottom:14px}
    .proposal-ui-tab{padding:12px 8px;border-radius:12px;font-size:14px}
    .proposal-ai-card{grid-template-columns:1fr;gap:16px;padding:16px;border-radius:16px}
    .proposal-ai-main{grid-template-columns:46px 1fr;gap:12px}
    .proposal-ai-icon{width:46px;height:46px;border-radius:13px;font-size:22px}
    .proposal-ai-copy h2{font-size:18px}
    .proposal-ai-copy p{font-size:13px}
    .proposal-ai-benefits{display:none}
    .proposal-ai-action{min-width:0;padding:14px 0 0;border-left:0;border-top:1px solid #eccbc7}
    .proposal-ai-action #pvGenerate{width:100%}
    .proposal-v2-toolbar{grid-template-columns:1fr!important}
    .proposal-v2-list .list-item{padding:16px!important;border-radius:16px!important;gap:12px}
    .proposal-v2-list .item-title{font-size:17px!important}
    .proposal-card-preview{padding:14px;font-size:13px;max-height:190px;overflow:hidden;position:relative}
    .proposal-card-preview:after{content:'';position:absolute;left:0;right:0;bottom:0;height:42px;background:linear-gradient(transparent,#fffafa)}
    .proposal-card-bottom{display:grid;grid-template-columns:1fr;gap:12px}
    .proposal-v2-list .item-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%}
    .proposal-v2-list .item-actions .btn{padding:0 8px!important;min-width:0;font-size:13px}
   }
   @media(max-width:390px){.proposal-ui-tab{font-size:13px}.proposal-v2-list .item-actions{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);
 }
 function proposalRoot(){return document.querySelector('.proposal-v2')}
 function ensureTabs(){
  const root=proposalRoot();
  if(!root)return;
  let tabs=document.getElementById('proposalUiTabs');
  if(!tabs){
   tabs=document.createElement('div');
   tabs.id='proposalUiTabs';
   tabs.className='proposal-ui-tabs';
   tabs.innerHTML='<button type="button" class="proposal-ui-tab" id="proposalUiCreate">Criar proposta</button><button type="button" class="proposal-ui-tab" id="proposalUiCreated">Propostas criadas</button>';
   root.parentNode.insertBefore(tabs,root);
   document.getElementById('proposalUiCreate').onclick=()=>{if(!document.getElementById('proposalWorkspace')?.hidden)return;document.getElementById('proposalNew')?.click();setTimeout(schedule,0)};
   document.getElementById('proposalUiCreated').onclick=()=>{if(document.getElementById('proposalListArea')?.hidden){(document.getElementById('proposalBack')||document.getElementById('pvCancel'))?.click();setTimeout(schedule,0)}};
  }
  const listVisible=!document.getElementById('proposalListArea')?.hidden;
  document.getElementById('proposalUiCreate')?.classList.toggle('active',!listVisible);
  document.getElementById('proposalUiCreated')?.classList.toggle('active',listVisible);
 }
 function improveHeading(){
  const root=proposalRoot();if(!root)return;
  const h=[...document.querySelectorAll('#view h1,#view h2')].find(x=>(x.textContent||'').trim()==='Propostas');
  if(!h)return;const next=h.nextElementSibling;if(next&&next.tagName==='P')next.textContent='Crie e publique propostas para suas instituições.';
 }
 function ensureAiCard(){
  const form=document.getElementById('proposalV2Form'),button=document.getElementById('pvGenerate'),credits=document.getElementById('pvCredits');
  if(!form||!button||!credits||document.getElementById('proposalAiCard'))return;
  const card=document.createElement('section');
  card.id='proposalAiCard';card.className='proposal-ai-card';
  card.innerHTML='<div class="proposal-ai-main"><div class="proposal-ai-icon" aria-hidden="true">✦</div><div class="proposal-ai-copy"><h2>Criar com Inteligência</h2><p>Transforme uma ideia em uma proposta completa com o apoio da Inteligência VERSÃO. O conteúdo continua editável antes da publicação.</p><div class="proposal-ai-benefits"><span>Texto estruturado</span><span>Fontes pesquisadas</span><span>Mais agilidade para publicar</span></div></div></div><div class="proposal-ai-action"><div id="proposalAiButtonSlot"></div><div id="proposalAiCreditsSlot"></div><p class="proposal-ai-note">Revise o conteúdo gerado antes de publicar.</p></div>';
  form.insertBefore(card,form.firstElementChild);card.querySelector('#proposalAiButtonSlot').appendChild(button);card.querySelector('#proposalAiCreditsSlot').appendChild(credits);button.textContent='Criar com IA';
 }
 function parseCardMeta(item){
  const text=item.querySelector('.item-meta')?.textContent||'';const status=(item.querySelector('.pill')?.textContent||(/Publicada|Rascunho|Oculta/.exec(text)||[])[0]||'').trim();const count=(/(\d+)\s*turma/.exec(text)||[])[1]||'0';return {status:status||'Rascunho',count};
 }
 async function enrichCard(item,token){
  if(item.dataset[ENHANCED]==='loading'||item.dataset[ENHANCED]==='done')return;const id=item.dataset.proposalId;if(!id)return;item.dataset[ENHANCED]='loading';const meta=parseCardMeta(item);
  try{
   let details=null;if(typeof window.edge==='function'&&window.API?.proposal)details=await window.edge(window.API.proposal,{action:'get',round_id:id});
   if(token!==cardRequestToken||!item.isConnected)return;const proposal=details?.proposal||{};const title=item.querySelector('.item-title');if(title){const current=title.textContent||'';title.textContent=proposal.theme||current.replace(/^R[^·]+·\s*/,'')}
   const metaNode=item.querySelector('.item-meta');if(metaNode)metaNode.textContent=`Eixo: ${proposal.thematic_axis||'Não informado'}`;
   if(!item.querySelector('.proposal-card-preview')){const preview=document.createElement('div');preview.className='proposal-card-preview';const command=(proposal.proposal_command||'').trim();if(command){const p=document.createElement('p');p.textContent=command;preview.appendChild(p)}if(proposal.theme){const theme=document.createElement('p');theme.className='proposal-card-theme';theme.textContent=`“${proposal.theme}”`;preview.appendChild(theme)}if(preview.childNodes.length)item.querySelector('.item-top')?.after(preview)}
   const actions=item.querySelector('.item-actions');if(actions&&!item.querySelector('.proposal-card-bottom')){const bottom=document.createElement('div');bottom.className='proposal-card-bottom';const status=document.createElement('div');status.className='proposal-card-status';status.dataset.status=meta.status;status.innerHTML='<span class="status-dot" aria-hidden="true"></span><span class="status-label"></span><span>·</span><span class="class-count"></span>';status.querySelector('.status-label').textContent=meta.status;status.querySelector('.class-count').textContent=`${meta.count} turma${meta.count==='1'?'':'s'}`;actions.parentNode.insertBefore(bottom,actions);bottom.append(status,actions)}
   item.dataset[ENHANCED]='done';
  }catch(e){item.dataset[ENHANCED]='error'}
 }
 function improveToolbar(){const search=document.getElementById('proposalSearch');if(search)search.placeholder='Buscar por tema ou palavra-chave...';const filter=document.getElementById('proposalFilter');if(filter&&filter.options[0])filter.options[0].textContent='Todos os status'}
 function enhanceCards(){const list=document.getElementById('proposalV2List');if(!list)return;const token=++cardRequestToken;[...list.querySelectorAll('.list-item[data-proposal-id]')].forEach(item=>enrichCard(item,token))}
 function apply(){scheduled=false;if(!proposalRoot())return;injectStyle();improveHeading();ensureTabs();ensureAiCard();improveToolbar();enhanceCards()}
 function schedule(){if(scheduled)return;scheduled=true;setTimeout(apply,0)}
 injectStyle();
 document.addEventListener('click',event=>{if(event.target.closest('#proposalNew,#proposalBack,#pvCancel,#proposalUiCreate,#proposalUiCreated,[data-edit],[data-hide],[data-delete]'))schedule()},true);
 const view=document.getElementById('view');if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 document.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
})();
