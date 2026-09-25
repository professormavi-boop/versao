'use strict';
(function(){
 const STYLE_ID='proposalRedesignV3Style';
 const PREVIEW_ID='proposalPreviewV3';
 const ALL_SUMMARY_ID='proposalAllRecipientsV3';
 const state={bootstrap:null,bootstrapPromise:null,previewBypass:false,loaderInstalled:false,timer:null};

 function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
   .proposal-v2-list{gap:14px!important}
   .proposal-v2-list .list-item{grid-template-columns:minmax(0,1fr)!important;gap:12px!important;padding:18px!important;border-radius:16px!important}
   .proposal-v2-list .item-title{font-size:17px!important;line-height:1.35!important}
   .proposal-v2-list .proposal-card-preview{max-height:150px;overflow:hidden}
   .proposal-v2-list .proposal-card-bottom{padding-top:12px!important}
   .proposal-v2-list .item-actions{gap:8px!important}
   .proposal-v2-list .item-actions .btn{min-height:40px!important}

   .proposal-v3-recipient-section{border-color:#ead9d6!important}
   .proposal-v3-all{display:flex!important;align-items:center;gap:10px;border:1px solid #e3a7a1!important;background:#fff8f7!important;border-radius:14px!important;padding:14px 16px!important;font-weight:800;color:#8f1519;cursor:pointer}
   .proposal-v3-all input{width:20px!important;height:20px!important;accent-color:#a90813}
   .proposal-v3-all .muted{margin-left:auto;font-weight:600;color:#7a6d6b!important}
   .proposal-v3-mode-note{margin:2px 0 0;color:#667085;font-size:13px;line-height:1.45}
   #pvScope{border:1px solid #ece2df;border-radius:14px;padding:14px;background:#fff;display:grid;gap:12px}
   #pvScope>.field{margin:0}
   #pvClassBox .proposal-v2-target-head{padding:2px 0 8px}
   #pvClassBox .proposal-v2-target-list{gap:8px!important}
   #pvClassBox .demo-check{border:1px solid #e9e1de!important;border-radius:11px!important;padding:11px 12px!important;min-height:44px;background:#fff!important}
   #pvClassBox .demo-check:has(input:checked){border-color:#e1a39d!important;background:#fff8f7!important}
   #pvSelectAllClasses,#pvClearClasses{font-size:12px!important;min-height:36px!important}
   #pvSummary{font-weight:700;color:#7f1717!important}
   .proposal-v3-all-summary{display:grid;gap:10px;margin-top:10px}
   .proposal-v3-org{border:1px solid #e9e1de;border-radius:13px;background:#fff;overflow:hidden}
   .proposal-v3-org>summary{list-style:none;cursor:pointer;padding:13px 14px;display:flex;align-items:center;gap:10px;font-weight:800;color:#202936}
   .proposal-v3-org>summary::-webkit-details-marker{display:none}
   .proposal-v3-org>summary:before{content:'✓';width:22px;height:22px;border-radius:6px;background:#a90813;color:#fff;display:grid;place-items:center;font-size:13px;flex:0 0 auto}
   .proposal-v3-org>summary span{margin-left:auto;color:#667085;font-size:12px;font-weight:600}
   .proposal-v3-org-classes{border-top:1px solid #f0e9e6;padding:8px 14px 12px;display:grid;gap:7px}
   .proposal-v3-class{display:flex;align-items:center;gap:9px;padding:7px 2px;color:#475467;font-size:13px}
   .proposal-v3-class:before{content:'✓';width:18px;height:18px;border-radius:5px;background:#2f75db;color:#fff;display:grid;place-items:center;font-size:11px;flex:0 0 auto}

   .proposal-v3-preview{display:grid;gap:16px;max-width:900px;margin:0 auto}
   .proposal-v3-preview-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
   .proposal-v3-preview-head h2{font-size:26px;margin:0}.proposal-v3-preview-head p{margin:5px 0 0;color:#667085}
   .proposal-v3-preview-card{border:1px solid #eadfdb;border-radius:18px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(16,24,40,.04);display:grid;gap:16px}
   .proposal-v3-preview-theme{font-size:21px;font-weight:850;line-height:1.3;color:#111827}
   .proposal-v3-chiprow{display:flex;gap:8px;flex-wrap:wrap}.proposal-v3-chip{border-radius:999px;background:#f7e8e6;color:#8d171b;padding:6px 10px;font-size:12px;font-weight:750}
   .proposal-v3-understand{border:1px solid #f0d4d0;background:#fff7f6;border-radius:14px;padding:16px;line-height:1.55;color:#475467;white-space:pre-wrap}
   .proposal-v3-understand b{display:block;color:#8d171b;margin-bottom:7px}
   .proposal-v3-mot-list{display:grid;gap:8px}.proposal-v3-mot{border:1px solid #e6e0dd;border-radius:11px;padding:12px 14px;background:#fff;display:grid;gap:3px}
   .proposal-v3-mot b{color:#202936}.proposal-v3-mot span{color:#667085;font-size:12px}
   .proposal-v3-dest{background:#f7f8fa;border-radius:12px;padding:13px 14px;color:#475467;font-size:13px}
   .proposal-v3-preview-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:10px;position:sticky;bottom:0;background:linear-gradient(to top,#fff 78%,rgba(255,255,255,.75));padding:14px 0 2px}
   .proposal-v3-preview-actions .btn{min-height:48px!important}
   .proposal-v3-preview-back{grid-column:1/-1;justify-self:start}

   .proposal-ai-loader-v3{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;border-radius:0!important;padding:0!important;background:radial-gradient(circle at 88% 5%,rgba(184,27,42,.10),transparent 28%),radial-gradient(circle at 8% 92%,rgba(184,27,42,.08),transparent 30%),#fffafa!important;display:grid!important;place-items:center!important;color:#172033}
   .proposal-ai-loader-v3::backdrop{background:#fffafa}
   .proposal-ai-loader-card{width:min(540px,calc(100vw - 34px));background:#fff;border:1px solid #f0e4e1;border-radius:24px;padding:38px 34px;box-shadow:0 22px 70px rgba(113,25,31,.10);text-align:center;display:grid;gap:20px;justify-items:center}
   .proposal-ai-loader-brand{font-weight:900;font-size:34px;letter-spacing:.02em;color:#9d0b18}
   .proposal-ai-loader-ring{width:112px;height:112px;border-radius:50%;background:conic-gradient(#a90813 0 24%,#f1dadd 24% 100%);display:grid;place-items:center;animation:proposalRing 1.25s linear infinite}
   .proposal-ai-loader-ring:after{content:'✦';width:78px;height:78px;border-radius:50%;background:#fff;color:#a90813;display:grid;place-items:center;font-size:30px;animation:proposalCounterRing 1.25s linear infinite}
   .proposal-ai-loader-card h2{margin:2px 0 0;font-size:28px;line-height:1.2}.proposal-ai-loader-card p{margin:0;color:#667085;font-size:16px;line-height:1.5}
   .proposal-ai-loader-progress{height:10px;width:100%;border-radius:999px;background:#eceef1;overflow:hidden}
   .proposal-ai-loader-progress span{display:block;height:100%;width:38%;border-radius:inherit;background:#a90813;animation:proposalProgress 2.1s ease-in-out infinite alternate}
   .proposal-ai-loader-note{font-size:13px!important;color:#7b8492!important}
   @keyframes proposalRing{to{transform:rotate(360deg)}}@keyframes proposalCounterRing{to{transform:rotate(-360deg)}}
   @keyframes proposalProgress{from{transform:translateX(-22%)}to{transform:translateX(170%)}}

   @media(max-width:760px){
    .proposal-v2-list .proposal-card-preview{max-height:120px}
    .proposal-v3-all{padding:13px}.proposal-v3-all .muted{display:none}
    #pvScope{padding:12px}
    .proposal-v3-preview{gap:12px}.proposal-v3-preview-head h2{font-size:23px}.proposal-v3-preview-card{padding:15px;border-radius:16px}.proposal-v3-preview-theme{font-size:18px}
    .proposal-v3-preview-actions{grid-template-columns:1fr}.proposal-v3-preview-back{grid-column:auto;justify-self:stretch}
    .proposal-ai-loader-card{padding:30px 22px;border-radius:22px}.proposal-ai-loader-brand{font-size:30px}.proposal-ai-loader-card h2{font-size:24px}.proposal-ai-loader-card p{font-size:15px}
   }
  `;
  document.head.appendChild(style);
 }

 async function bootstrap(){
  if(state.bootstrap)return state.bootstrap;
  if(state.bootstrapPromise)return state.bootstrapPromise;
  state.bootstrapPromise=(async()=>{
   try{state.bootstrap=await window.edge(window.API.proposal,{action:'bootstrap'});return state.bootstrap}
   finally{state.bootstrapPromise=null}
  })();
  return state.bootstrapPromise;
 }

 function selectedCurrentClasses(){return [...document.querySelectorAll('#pvClassBox input[name="target"]:checked')].map(x=>x.value)}
 function totalClasses(data){return Object.values(data?.classes_by_org||{}).reduce((n,items)=>n+(items?.length||0),0)}
 function currentOrgName(){const select=document.getElementById('pvOrg');return select?.selectedOptions?.[0]?.textContent?.trim()||'Instituição selecionada'}

 async function renderAllRecipientsSummary(){
  const all=document.getElementById('pvAll'),scope=document.getElementById('pvScope');
  document.getElementById(ALL_SUMMARY_ID)?.remove();
  if(!all?.checked||!scope)return;
  try{
   const data=await bootstrap();
   if(!all.checked||!scope.isConnected)return;
   const wrap=document.createElement('div');wrap.id=ALL_SUMMARY_ID;wrap.className='proposal-v3-all-summary';
   const orgs=data?.organizations||[];
   wrap.innerHTML=orgs.map((org,index)=>{
    const classes=data?.classes_by_org?.[org.id]||[];
    return `<details class="proposal-v3-org" ${index<2?'open':''}><summary>${esc(org.name)}<span>${classes.length} turma${classes.length===1?'':'s'}</span></summary><div class="proposal-v3-org-classes">${classes.map(c=>`<div class="proposal-v3-class">${esc(c.name)}</div>`).join('')||'<div class="muted">Nenhuma turma disponível.</div>'}</div></details>`;
   }).join('');
   scope.insertAdjacentElement('afterend',wrap);
  }catch{}
 }

 function enhanceRecipients(){
  const form=document.getElementById('proposalV2Form'),scope=document.getElementById('pvScope');if(!form||!scope)return;
  const section=scope.closest('.proposal-v2-section');section?.classList.add('proposal-v3-recipient-section');
  const all=document.getElementById('pvAll');
  if(all){
   const label=all.closest('label');
   if(label&&!label.classList.contains('proposal-v3-all')){
    label.classList.add('proposal-v3-all');
    for(const node of [...label.childNodes]){
     if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim())node.textContent=' Selecionar todas as instituições e turmas ';
    }
   }
   if(!all.dataset.v3Bound){
    all.dataset.v3Bound='1';
    all.addEventListener('change',()=>{setTimeout(()=>{renderAllRecipientsSummary();updateRecipientSummary()},0)});
   }
  }
  const selectAll=document.getElementById('pvSelectAllClasses');
  if(selectAll)selectAll.textContent='Selecionar todas desta instituição';
  const clear=document.getElementById('pvClearClasses');if(clear)clear.textContent='Limpar desta instituição';
  let note=section?.querySelector('.proposal-v3-mode-note');
  if(section&&!note){note=document.createElement('p');note.className='proposal-v3-mode-note';note.textContent='Escolha uma instituição específica ou marque “Selecionar todas” para publicar em todas as suas instituições e turmas.';const head=section.querySelector('header');head?.after(note)}
  updateRecipientSummary();renderAllRecipientsSummary();
 }

 async function updateRecipientSummary(){
  const summary=document.getElementById('pvSummary');if(!summary)return;
  const all=document.getElementById('pvAll');
  if(all?.checked){
   try{const data=await bootstrap();if(all.checked&&summary.isConnected)summary.textContent=`Selecionadas: ${totalClasses(data)} turma(s) em ${(data?.organizations||[]).length} instituição(ões).`}
   catch{summary.textContent='Todas as instituições e turmas disponíveis serão selecionadas.'}
   return;
  }
  const count=selectedCurrentClasses().length;summary.textContent=`Selecionadas: ${count} turma(s) em ${currentOrgName()}.`;
 }

 function previewData(){
  const theme=document.getElementById('pvTheme')?.value.trim()||'';
  const axis=document.getElementById('pvAxis')?.value.trim()||'';
  const command=document.getElementById('pvCommand')?.innerText.trim()||'';
  const understand=document.getElementById('pvUnderstand')?.value.trim()||'';
  const motivators=[...document.querySelectorAll('#pvMotivators [data-motivator-row]')].map((row,i)=>({
   title:row.querySelector('[data-mot="title"]')?.value.trim()||`Texto motivador ${i+1}`,
   body:row.querySelector('[data-mot="body"]')?.value.trim()||'',
   source:row.querySelector('[data-mot="source_label"]')?.value.trim()||''
  })).filter(m=>m.body);
  return {theme,axis,command,understand,motivators};
 }

 function validateBeforePreview(){
  const form=document.getElementById('proposalV2Form');if(!form||!form.reportValidity())return false;
  const data=previewData();
  if(!data.command){toast('Preencha o comando da proposta.');document.getElementById('pvCommand')?.focus();return false}
  if(!data.motivators.length){toast('Inclua ao menos um texto motivador.');return false}
  if(data.motivators.some(m=>!m.source)){toast('Informe a fonte/autoria de cada texto motivador. O link é opcional.');return false}
  const all=document.getElementById('pvAll');if(!all?.checked&&!selectedCurrentClasses().length){toast('Selecione pelo menos uma turma ou marque todas as instituições.');return false}
  return true;
 }

 async function destinationText(){
  const all=document.getElementById('pvAll');
  if(all?.checked){try{const data=await bootstrap();return `${totalClasses(data)} turma(s) em ${(data?.organizations||[]).length} instituição(ões)`}catch{return 'Todas as instituições e turmas disponíveis'}}
  return `${selectedCurrentClasses().length} turma(s) · ${currentOrgName()}`;
 }

 async function showPreview(){
  const form=document.getElementById('proposalV2Form'),workspace=document.getElementById('proposalWorkspace');if(!form||!workspace)return;
  document.getElementById(PREVIEW_ID)?.remove();
  const data=previewData(),dest=await destinationText();
  const preview=document.createElement('section');preview.id=PREVIEW_ID;preview.className='proposal-v3-preview';
  preview.innerHTML=`<div class="proposal-v3-preview-head"><div><h2>Prévia da proposta</h2><p>Revise como o conteúdo será apresentado antes de publicar.</p></div></div><article class="proposal-v3-preview-card"><div class="proposal-v3-preview-theme">${esc(data.theme||'Sem tema')}</div><div class="proposal-v3-chiprow">${data.axis?`<span class="proposal-v3-chip">${esc(data.axis)}</span>`:''}<span class="proposal-v3-chip">${esc(dest)}</span></div><div><strong>Comando da proposta</strong><p style="white-space:pre-wrap;line-height:1.55;color:#475467">${esc(data.command)}</p></div>${data.understand?`<div class="proposal-v3-understand"><b>O que o tema está pedindo</b>${esc(data.understand)}</div>`:''}<div><strong>Textos motivadores</strong><div class="proposal-v3-mot-list">${data.motivators.map((m,i)=>`<div class="proposal-v3-mot"><b>${esc(m.title||`Texto motivador ${i+1}`)}</b><span>${esc(m.source||'Fonte informada')}</span></div>`).join('')}</div></div><div class="proposal-v3-dest"><b>Destinatários:</b> ${esc(dest)}</div></article><div class="proposal-v3-preview-actions"><button type="button" class="btn ghost proposal-v3-preview-back" id="proposalV3Back">← Voltar e editar</button>${document.getElementById('pvDraft')?'<button type="button" class="btn soft-btn" id="proposalV3Draft">Salvar como rascunho</button>':''}<button type="button" class="btn primary" id="proposalV3Publish">Publicar proposta</button></div>`;
  form.hidden=true;workspace.appendChild(preview);preview.scrollIntoView({behavior:'smooth',block:'start'});
  document.getElementById('proposalV3Back').onclick=()=>restoreForm();
  const draft=document.getElementById('proposalV3Draft');if(draft)draft.onclick=()=>{restoreForm();setTimeout(()=>document.getElementById('pvDraft')?.click(),0)};
  document.getElementById('proposalV3Publish').onclick=()=>{restoreForm();state.previewBypass=true;setTimeout(()=>document.getElementById('pvPublish')?.click(),0)};
 }

 function restoreForm(){const form=document.getElementById('proposalV2Form');if(form)form.hidden=false;document.getElementById(PREVIEW_ID)?.remove()}

 function installLoader(){
  if(state.loaderInstalled||typeof window.generationScreen!=='function')return;
  state.loaderInstalled=true;const base=window.generationScreen;
  window.generationScreen=function(message){
   const text=String(message||'');if(!/proposta/i.test(text))return base(message);
   const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='proposal-ai-loader-v3';dialog.setAttribute('aria-label','Criando proposta com IA');dialog.setAttribute('aria-busy','true');
   dialog.innerHTML=`<section class="proposal-ai-loader-card"><div class="proposal-ai-loader-brand">VERSÃO</div><div class="proposal-ai-loader-ring" aria-hidden="true"></div><h2>Criando proposta com IA...</h2><p role="status" aria-live="polite">Organizando tema, comando e textos motivadores.</p><div class="proposal-ai-loader-progress" aria-hidden="true"><span></span></div><p class="proposal-ai-loader-note">Isso pode levar alguns instantes.</p></section>`;
   dialog.oncancel=e=>e.preventDefault();document.body.appendChild(dialog);dialog.showModal();
   let closed=false;return ()=>{if(closed)return;closed=true;try{dialog.close()}catch{}dialog.remove();if(previous?.isConnected)try{previous.focus()}catch{}};
  };
 }

 function enhanceList(){
  const list=document.getElementById('proposalV2List');if(!list)return;
  const visible=[...list.querySelectorAll('.list-item[data-proposal-id]')].filter(x=>!x.hidden);
  const area=document.getElementById('proposalListArea');if(!area)return;
  let counter=area.querySelector('.proposal-v3-list-counter');
  if(!counter){counter=document.createElement('p');counter.className='proposal-v3-list-counter muted';const toolbar=area.querySelector('.proposal-v2-toolbar');toolbar?.insertAdjacentElement('afterend',counter)}
  if(counter)counter.textContent=`${visible.length} proposta${visible.length===1?'':'s'} encontrada${visible.length===1?'':'s'}.`;
 }

 function schedule(){clearTimeout(state.timer);state.timer=setTimeout(apply,80)}
 function apply(){injectStyle();installLoader();enhanceRecipients();enhanceList()}

 document.addEventListener('click',event=>{
  const publish=event.target.closest?.('#pvPublish');
  if(publish){
   if(state.previewBypass){state.previewBypass=false;return}
   event.preventDefault();event.stopImmediatePropagation();
   if(validateBeforePreview())showPreview();return;
  }
  if(event.target.closest?.('#pvSelectAllClasses,#pvClearClasses'))setTimeout(updateRecipientSummary,0);
 },true);
 document.addEventListener('change',event=>{
  if(event.target?.matches?.('#pvOrg,#pvClassBox input[name="target"],#pvAll'))setTimeout(()=>{updateRecipientSummary();renderAllRecipientsSummary()},0);
 },true);
 const view=document.getElementById('view');if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 document.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
})();
