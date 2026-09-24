'use strict';
(function(){
 const STYLE_ID='proposalAxisPriorityStyle';
 let timer=null,bootstrapPromise=null;
 const detailCache=new Map();
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

   .proposal-approved-tabs{display:flex;align-items:center;gap:24px;border-bottom:1px solid #eee3e0;margin:0 0 14px;padding:0 2px}
   .proposal-approved-tab{appearance:none;border:0;background:transparent;padding:10px 2px 12px;color:#667085;font:inherit;font-weight:750;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
   .proposal-approved-tab.active{color:#8f1519;border-bottom-color:#a90813}
   .proposal-approved-list-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:2px 0 4px}
   .proposal-approved-count{margin:0;color:#667085;font-size:13px}
   #proposalListArea .proposal-v2-toolbar{display:grid!important;grid-template-columns:minmax(0,1fr) 190px!important;gap:10px!important;align-items:end!important;margin-bottom:4px}
   #proposalListArea .proposal-v2-toolbar .field{margin:0!important;min-width:0!important;max-width:none!important;flex:none!important}
   #proposalListArea .proposal-v2-toolbar small{display:none!important}
   #proposalSearch{min-height:44px!important}
   #proposalFilter{min-height:44px!important}
   .proposal-v2-list{gap:12px!important}
   .proposal-v2-list .list-item.proposal-approved-card{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:'main status' 'actions actions'!important;gap:10px 14px!important;padding:16px 18px!important;border:1px solid #e7dfdc!important;border-radius:15px!important;background:#fff!important;box-shadow:0 3px 12px rgba(32,41,54,.035)!important}
   .proposal-approved-main{grid-area:main;min-width:0;display:grid;gap:7px}
   .proposal-v2-list .proposal-approved-card .item-top{display:contents!important}
   .proposal-v2-list .proposal-approved-card .item-top>div{grid-area:main;min-width:0}
   .proposal-v2-list .proposal-approved-card .item-title{font-size:16px!important;line-height:1.35!important;font-weight:800!important;color:#172033!important;margin:0!important}
   .proposal-approved-chips{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:6px}
   .proposal-approved-chip{display:inline-flex;align-items:center;min-height:25px;padding:4px 9px;border-radius:999px;background:#f2f6fb;color:#355b87;font-size:11px;font-weight:750;line-height:1.2}
   .proposal-approved-command{margin:1px 0 0;color:#667085;font-size:12.5px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:760px}
   .proposal-v2-list .proposal-approved-card .item-meta{display:flex!important;align-items:center;gap:8px;flex-wrap:wrap;color:#667085!important;font-size:12px!important;margin-top:7px!important}
   .proposal-v2-list .proposal-approved-card .pill{grid-area:status;align-self:start;justify-self:end;white-space:nowrap!important;font-size:11px!important;padding:5px 9px!important;border-radius:999px!important}
   .proposal-v2-list .proposal-approved-card .item-actions{grid-area:actions;display:flex!important;justify-content:flex-end!important;gap:8px!important;padding-top:3px!important;border-top:1px solid #f4efed!important;margin-top:2px!important}
   .proposal-v2-list .proposal-approved-card .item-actions .btn{min-height:36px!important;padding:7px 12px!important;font-size:12px!important;min-width:88px!important}
   .proposal-v2-list .proposal-approved-card .item-actions .danger{border-color:#efb0aa!important;color:#b42318!important}
   @media(max-width:760px){
    .proposal-axis-priority{padding:13px 14px}.proposal-axis-priority select{min-height:46px}
    .proposal-approved-tabs{gap:18px;overflow-x:auto}
    #proposalListArea .proposal-v2-toolbar{grid-template-columns:1fr!important}
    .proposal-v2-list .list-item.proposal-approved-card{grid-template-columns:1fr auto!important;padding:14px!important}
    .proposal-v2-list .proposal-approved-card .item-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}
    .proposal-v2-list .proposal-approved-card .item-actions .btn{min-width:0!important;padding:8px 6px!important}
    .proposal-approved-command{-webkit-line-clamp:2}
   }
   @media(max-width:430px){
    .proposal-v2-list .proposal-approved-card .item-actions{grid-template-columns:1fr!important}
   }
  `;
  document.head.appendChild(el);
 }
 function applyAxis(){
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
   helper.textContent='Escolha o eixo antes de definir ou gerar o tema.';
   axis.insertAdjacentElement('afterend',helper);
  }
 }
 function getBootstrap(){
  if(bootstrapPromise)return bootstrapPromise;
  if(typeof window.edge!=='function'||!window.API?.proposal)return Promise.resolve(null);
  bootstrapPromise=window.edge(window.API.proposal,{action:'bootstrap'}).catch(()=>null);
  return bootstrapPromise;
 }
 function getDetail(id){
  if(detailCache.has(id))return detailCache.get(id);
  const promise=(typeof window.edge==='function'&&window.API?.proposal)
   ?window.edge(window.API.proposal,{action:'get',round_id:id}).catch(()=>null)
   :Promise.resolve(null);
  detailCache.set(id,promise);return promise;
 }
 function cleanTitle(text){return String(text||'').replace(/^R(?:\d+|—)\s*·\s*/,'').trim()||'Sem tema'}
 function addTabs(area){
  if(area.querySelector('.proposal-approved-tabs'))return;
  const tabs=document.createElement('nav');tabs.className='proposal-approved-tabs';tabs.setAttribute('aria-label','Navegação de propostas');
  const create=document.createElement('button');create.type='button';create.className='proposal-approved-tab';create.textContent='Criar proposta';
  create.onclick=()=>document.getElementById('proposalNew')?.click();
  const created=document.createElement('button');created.type='button';created.className='proposal-approved-tab active';created.textContent='Propostas criadas';created.setAttribute('aria-current','page');
  tabs.append(create,created);area.prepend(tabs);
 }
 async function enrichCard(card){
  const id=card.dataset.proposalId;if(!id||card.dataset.approvedEnriched==='1')return;
  card.dataset.approvedEnriched='1';card.classList.add('proposal-approved-card');
  const top=card.querySelector('.item-top'),main=top?.querySelector(':scope > div'),title=card.querySelector('.item-title'),meta=card.querySelector('.item-meta');
  if(title)title.textContent=cleanTitle(title.textContent);
  if(main)main.classList.add('proposal-approved-main');
  let chips=main?.querySelector('.proposal-approved-chips');
  if(main&&!chips){chips=document.createElement('div');chips.className='proposal-approved-chips';title?.insertAdjacentElement('afterend',chips)}
  const [detail,boot]=await Promise.all([getDetail(id),getBootstrap()]);
  if(!card.isConnected)return;
  const proposal=detail?.proposal||{};
  const axis=proposal.thematic_axis||proposal.axis||'';
  if(axis&&chips&&!chips.querySelector('[data-axis-chip]')){
   const chip=document.createElement('span');chip.className='proposal-approved-chip';chip.dataset.axisChip='1';chip.textContent=axis;chips.appendChild(chip);
  }
  const targets=(detail?.targets||[]).map(t=>t.class_id).filter(Boolean);
  const classToOrg=new Map();
  Object.entries(boot?.classes_by_org||{}).forEach(([orgId,classes])=>(classes||[]).forEach(c=>classToOrg.set(String(c.id),orgId)));
  const orgCount=new Set(targets.map(x=>classToOrg.get(String(x))).filter(Boolean)).size;
  if(chips&&orgCount&&!chips.querySelector('[data-org-chip]')){
   const chip=document.createElement('span');chip.className='proposal-approved-chip';chip.dataset.orgChip='1';chip.textContent=`${orgCount} instituição${orgCount===1?'':'ões'}`;chips.appendChild(chip);
  }
  const command=String(proposal.proposal_command||'').replace(/\s+/g,' ').trim();
  if(main&&command&&!main.querySelector('.proposal-approved-command')){
   const preview=document.createElement('p');preview.className='proposal-approved-command';preview.textContent=command;chips?.insertAdjacentElement('afterend',preview);
  }
  if(meta){
   const motCount=(detail?.motivators||[]).filter(m=>m.body).length;
   const bits=[];
   if(targets.length)bits.push(`${targets.length} turma${targets.length===1?'':'s'}`);
   if(motCount)bits.push(`${motCount} texto${motCount===1?'':'s'} motivador${motCount===1?'':'es'}`);
   if(bits.length)meta.textContent=bits.join(' · ');
  }
 }
 function applyList(){
  const area=document.getElementById('proposalListArea'),list=document.getElementById('proposalV2List');
  if(!area||!list)return;
  addTabs(area);
  const search=document.getElementById('proposalSearch');if(search)search.placeholder='Buscar por título, tema ou palavra-chave...';
  const filter=document.getElementById('proposalFilter');if(filter){
   const labels={all:'Todos os status',published:'Publicadas',draft:'Rascunhos',hidden:'Ocultas'};
   [...filter.options].forEach(o=>{if(labels[o.value])o.textContent=labels[o.value]});
  }
  let head=area.querySelector('.proposal-approved-list-head');
  if(!head){head=document.createElement('div');head.className='proposal-approved-list-head';const p=document.createElement('p');p.className='proposal-approved-count';head.appendChild(p);const toolbar=area.querySelector('.proposal-v2-toolbar');toolbar?.insertAdjacentElement('afterend',head)}
  const cards=[...list.querySelectorAll('.list-item[data-proposal-id]')];
  const count=head?.querySelector('.proposal-approved-count');if(count)count.textContent=`${cards.length} proposta${cards.length===1?'':'s'} encontrada${cards.length===1?'':'s'}`;
  cards.forEach(enrichCard);
 }
 function apply(){style();applyAxis();applyList()}
 function schedule(){clearTimeout(timer);timer=setTimeout(apply,60)}
 const view=document.getElementById('view');
 if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 document.addEventListener('input',e=>{if(e.target?.id==='proposalSearch')setTimeout(applyList,0)},true);
 document.addEventListener('change',e=>{if(e.target?.id==='proposalFilter')setTimeout(applyList,0)},true);
 schedule();
})();
