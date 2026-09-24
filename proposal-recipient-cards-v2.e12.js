'use strict';
(function(){
 const STYLE_ID='proposalRecipientCardsV2Style';
 const ROOT_ID='proposalRecipientCardsV2';
 const state={bootstrap:null,bootstrapPromise:null,editingId:null,baseEdge:null,wrapped:false,timer:null};

 function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;
  s.textContent=`
   .proposal-recipient-v2-section{border-color:#ead9d6!important}
   .proposal-recipient-v2-section #pvScope{border:0!important;padding:0!important;background:transparent!important}
   .proposal-recipient-v2-section #pvScope>.field{display:none!important}
   .proposal-recipient-v2-section>label:has(#pvAll){display:none!important}
   .proposal-recipient-v2-section .proposal-v3-mode-note{display:none!important}
   .proposal-recipient-v2-section #proposalAllRecipientsV3{display:none!important}
   .proposal-recipient-cards-v2{display:grid;gap:12px;margin-top:4px}
   .proposal-recipient-org-v2{border:1px solid #e7dfdc;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 2px 8px rgba(16,24,40,.025)}
   .proposal-recipient-org-head-v2{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;padding:15px 16px;cursor:pointer}
   .proposal-recipient-org-head-v2:hover{background:#fffbfa}
   .proposal-recipient-org-title-v2{display:grid;gap:3px;min-width:0}
   .proposal-recipient-org-title-v2 strong{font-size:16px;line-height:1.3;color:#202936;overflow-wrap:anywhere}
   .proposal-recipient-org-title-v2 span{font-size:12px;color:#7a7f89}
   .proposal-recipient-check-v2{appearance:none;width:22px;height:22px;border:2px solid #a8adb5;border-radius:6px;background:#fff;display:grid;place-items:center;margin:0;cursor:pointer;flex:0 0 auto}
   .proposal-recipient-check-v2:checked{border-color:#a90813;background:#a90813}
   .proposal-recipient-check-v2:checked:after{content:'✓';color:#fff;font-weight:900;font-size:14px;line-height:1}
   .proposal-recipient-class-check-v2:checked{border-color:#2f75db;background:#2f75db}
   .proposal-recipient-toggle-v2{border:0;background:transparent;width:36px;height:36px;border-radius:9px;font-size:20px;line-height:1;color:#4a5565;cursor:pointer;display:grid;place-items:center}
   .proposal-recipient-toggle-v2:hover{background:#f5f2f1}
   .proposal-recipient-org-body-v2{border-top:1px solid #eee8e5;padding:5px 16px 12px 52px;display:grid}
   .proposal-recipient-org-v2[data-collapsed='1'] .proposal-recipient-org-body-v2{display:none}
   .proposal-recipient-org-v2[data-collapsed='1'] .proposal-recipient-toggle-v2{transform:rotate(180deg)}
   .proposal-recipient-class-v2{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;min-height:48px;border-bottom:1px solid #f2edeb;color:#303846;cursor:pointer}
   .proposal-recipient-class-v2:last-child{border-bottom:0}
   .proposal-recipient-class-v2>span:first-of-type{font-weight:650}
   .proposal-recipient-class-count-v2{font-size:12px;color:#7a7f89;white-space:nowrap}
   .proposal-recipient-all-v2{margin-top:4px;border:1.5px dashed #e2aaa7;border-radius:14px;background:#fff8f7;min-height:62px;padding:12px 16px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:11px;cursor:pointer;color:#8c171b}
   .proposal-recipient-all-v2 strong{font-size:15px}.proposal-recipient-all-v2 span{font-size:13px;font-weight:700;text-align:right}
   .proposal-recipient-bottom-v2{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid #eee6e3}
   .proposal-recipient-bottom-v2 .proposal-recipient-selected-v2{display:grid;gap:2px;color:#626a76;font-size:12px}
   .proposal-recipient-bottom-v2 .proposal-recipient-selected-v2 strong{font-size:17px;color:#202936}
   .proposal-recipient-bottom-v2 .btn{min-width:180px;min-height:48px}
   .proposal-recipient-v2-active .proposal-v2-footer{display:none!important}
   .proposal-recipient-v2-section #pvSummary{display:none!important}
   @media(max-width:760px){
    .proposal-recipient-org-head-v2{padding:14px 13px;gap:10px}.proposal-recipient-org-body-v2{padding:4px 13px 10px 45px}
    .proposal-recipient-org-title-v2 strong{font-size:15px}.proposal-recipient-class-v2{min-height:46px}
    .proposal-recipient-all-v2{grid-template-columns:auto 1fr;padding:12px 13px}.proposal-recipient-all-v2 span{grid-column:2;text-align:left;margin-top:-4px}
    .proposal-recipient-bottom-v2{grid-template-columns:1fr}.proposal-recipient-bottom-v2 .btn{width:100%;min-width:0}
   }
  `;document.head.appendChild(s);
 }

 async function bootstrap(){
  if(state.bootstrap)return state.bootstrap;
  if(state.bootstrapPromise)return state.bootstrapPromise;
  state.bootstrapPromise=(async()=>{try{state.bootstrap=await state.baseEdge(API.proposal,{action:'bootstrap'});return state.bootstrap}finally{state.bootstrapPromise=null}})();
  return state.bootstrapPromise;
 }
 function allClasses(data){return (data?.organizations||[]).flatMap(o=>(data.classes_by_org?.[o.id]||[]).map(c=>({...c,organization_id:o.id,organization_name:o.name})))}
 function checkedIds(){return [...document.querySelectorAll(`#${ROOT_ID} input[name="target"]:checked`)].map(x=>x.value)}
 function classMap(data){return new Map(allClasses(data).map(c=>[c.id,c]))}
 function selectedOrgIds(data){const map=classMap(data);return new Set(checkedIds().map(id=>map.get(id)?.organization_id).filter(Boolean))}
 function countText(classes){const students=classes.reduce((n,c)=>n+(Number(c.student_count)||0),0);return students?`${classes.length} turma${classes.length===1?'':'s'} · ${students} aluno${students===1?'':'s'}`:`${classes.length} turma${classes.length===1?'':'s'}`}

 async function exactTargets(roundId,classIds){
  const session=await ensure();
  const response=await fetch(`${BASE}/rest/v1/rpc/set_canonical_proposal_class_targets_exact`,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_round:roundId,p_class_ids:classIds})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.message||data.error||'Não foi possível atualizar os destinatários.');
  return data;
 }

 function installEdgeWrapper(){
  if(state.wrapped||typeof window.edge!=='function')return;
  state.wrapped=true;state.baseEdge=window.edge;
  window.edge=async function(slug,body={},retried=false){
   if(slug===API.proposal&&body?.action==='save'&&document.getElementById(ROOT_ID)){
    const data=await bootstrap();
    const map=classMap(data),selected=[...new Set(checkedIds())],orgs=new Set(selected.map(id=>map.get(id)?.organization_id).filter(Boolean));
    if(orgs.size>1){
     const orgSelect=document.getElementById('pvOrg');
     let anchor=String(body.organization_id||orgSelect?.value||'');
     if(!anchor||!orgs.has(anchor)){anchor=[...orgs][0]||anchor;if(orgSelect&&!orgSelect.disabled)orgSelect.value=anchor}
     let anchorIds=selected.filter(id=>map.get(id)?.organization_id===anchor);
     if(body.publish&&anchorIds.length===0){const fallback=(data.classes_by_org?.[anchor]||[])[0]?.id;if(fallback)anchorIds=[fallback]}
     const result=await state.baseEdge(slug,{...body,organization_id:anchor,class_ids:anchorIds},retried);
     const roundId=String(body.round_id||result?.proposal?.id||result?.round_id||'');
     if(!roundId)throw Error('A proposta foi salva, mas não foi possível confirmar os destinatários.');
     const targets=await exactTargets(roundId,selected);
     return {...result,target_count:targets?.target_count??selected.length,organization_count:targets?.organization_count??orgs.size,canonical:true};
    }
   }
   return state.baseEdge(slug,body,retried);
  };
 }

 async function selectedForEditor(data){
  if(state.editingId){
   try{const d=await state.baseEdge(API.proposal,{action:'get',round_id:state.editingId});return new Set((d?.targets||[]).map(t=>t.class_id).filter(Boolean))}catch{}
  }
  return new Set([...document.querySelectorAll('#pvClassBox input[name="target"]:checked')].map(x=>x.value));
 }

 function sync(data){
  const all=allClasses(data),ids=checkedIds(),idSet=new Set(ids),map=classMap(data),orgIds=selectedOrgIds(data);
  const hiddenAll=document.getElementById('pvAll');if(hiddenAll)hiddenAll.checked=false;
  const orgSelect=document.getElementById('pvOrg');
  if(orgSelect&&!orgSelect.disabled){const first=ids.map(id=>map.get(id)?.organization_id).find(Boolean);if(first)orgSelect.value=first}
  document.querySelectorAll(`#${ROOT_ID} [data-org]`).forEach(card=>{
   const oid=card.dataset.org,classes=data.classes_by_org?.[oid]||[],checked=classes.filter(c=>idSet.has(c.id)).length,box=card.querySelector('[data-org-check]');
   if(box){box.checked=classes.length>0&&checked===classes.length;box.indeterminate=checked>0&&checked<classes.length}
  });
  const allBox=document.querySelector(`#${ROOT_ID} [data-all-check]`);if(allBox){allBox.checked=all.length>0&&ids.length===all.length;allBox.indeterminate=ids.length>0&&ids.length<all.length}
  const totalStudents=ids.reduce((n,id)=>n+(Number(map.get(id)?.student_count)||0),0);
  const selectedNode=document.querySelector(`#${ROOT_ID} .proposal-recipient-selected-v2 strong`);if(selectedNode)selectedNode.textContent=totalStudents?`${ids.length} turma${ids.length===1?'':'s'} · ${totalStudents} aluno${totalStudents===1?'':'s'}`:`${ids.length} turma${ids.length===1?'':'s'} selecionada${ids.length===1?'':'s'}`;
  const allCount=document.querySelector(`#${ROOT_ID} [data-all-count]`);if(allCount)allCount.textContent=countText(all);
  const continueBtn=document.querySelector(`#${ROOT_ID} [data-continue]`);if(continueBtn)continueBtn.disabled=ids.length===0;
  const previewDest=document.querySelector('#proposalPreviewV3 .proposal-v3-dest');if(previewDest)previewDest.innerHTML=`<b>Destinatários:</b> ${ids.length} turma(s) em ${orgIds.size} instituição(ões)`;
 }

 async function render(){
  const form=document.getElementById('proposalV2Form'),scope=document.getElementById('pvScope'),classBox=document.getElementById('pvClassBox');
  if(!form||!scope||!classBox||classBox.dataset.cardsV2==='1')return;
  injectStyle();installEdgeWrapper();
  const data=await bootstrap();if(!form.isConnected||!scope.isConnected)return;
  const selected=await selectedForEditor(data);if(!form.isConnected)return;
  classBox.dataset.cardsV2='1';
  const section=scope.closest('.proposal-v2-section');section?.classList.add('proposal-recipient-v2-section');form.classList.add('proposal-recipient-v2-active');
  const head=section?.querySelector('header');if(head){const p=head.querySelector('p');if(p)p.textContent='Selecione as instituições e as turmas que receberão esta proposta.'}
  const oldAll=document.getElementById('pvAll')?.closest('label');if(oldAll)oldAll.hidden=true;
  const orgLabel=document.getElementById('pvOrg')?.closest('label');if(orgLabel)orgLabel.hidden=true;
  const orgs=data.organizations||[];
  classBox.innerHTML=`<div id="${ROOT_ID}" class="proposal-recipient-cards-v2">${orgs.map((org,index)=>{
   const classes=data.classes_by_org?.[org.id]||[];
   return `<section class="proposal-recipient-org-v2" data-org="${esc(org.id)}" data-collapsed="${index<2?'0':'1'}"><div class="proposal-recipient-org-head-v2"><input class="proposal-recipient-check-v2" type="checkbox" data-org-check aria-label="Selecionar ${esc(org.name)}"><div class="proposal-recipient-org-title-v2"><strong>${esc(org.name)}</strong><span>${esc(countText(classes))}</span></div><button type="button" class="proposal-recipient-toggle-v2" data-toggle-org aria-label="Expandir ou recolher instituição">⌃</button></div><div class="proposal-recipient-org-body-v2">${classes.map(c=>`<label class="proposal-recipient-class-v2"><input class="proposal-recipient-check-v2 proposal-recipient-class-check-v2" type="checkbox" name="target" value="${esc(c.id)}" ${selected.has(c.id)?'checked':''}><span>${esc(c.name)}</span><span class="proposal-recipient-class-count-v2">${Number(c.student_count)?`${Number(c.student_count)} aluno${Number(c.student_count)===1?'':'s'}`:''}</span></label>`).join('')||'<div class="muted" style="padding:12px 0">Nenhuma turma disponível.</div>'}</div></section>`;
  }).join('')}<label class="proposal-recipient-all-v2"><input class="proposal-recipient-check-v2" type="checkbox" data-all-check><strong>Selecionar todas</strong><span data-all-count></span></label><div class="proposal-recipient-bottom-v2"><div class="proposal-recipient-selected-v2"><span>Selecionadas:</span><strong>0 turmas selecionadas</strong></div><button type="button" class="btn primary" data-continue>Continuar →</button></div></div>`;
  const root=document.getElementById(ROOT_ID);
  root.addEventListener('click',e=>{
   const toggle=e.target.closest('[data-toggle-org]');if(toggle){const card=toggle.closest('[data-org]');card.dataset.collapsed=card.dataset.collapsed==='1'?'0':'1';return}
   const headNode=e.target.closest('.proposal-recipient-org-head-v2');if(headNode&&!e.target.matches('input,button')){const card=headNode.closest('[data-org]');card.dataset.collapsed=card.dataset.collapsed==='1'?'0':'1';return}
   const cont=e.target.closest('[data-continue]');if(cont){document.getElementById('pvPublish')?.click();return}
  });
  root.addEventListener('change',e=>{
   if(e.target.matches('[data-org-check]')){const card=e.target.closest('[data-org]');card.querySelectorAll('input[name="target"]').forEach(x=>x.checked=e.target.checked)}
   if(e.target.matches('[data-all-check]'))root.querySelectorAll('input[name="target"]').forEach(x=>x.checked=e.target.checked);
   sync(data);
  });
  sync(data);
 }

 function schedule(){clearTimeout(state.timer);state.timer=setTimeout(()=>{render().catch(()=>{})},70)}
 document.addEventListener('click',e=>{const edit=e.target.closest?.('[data-edit]');if(edit)state.editingId=edit.dataset.edit||null;if(e.target.closest?.('#proposalNew'))state.editingId=null},true);
 const view=document.getElementById('view');if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true});
 document.addEventListener('DOMContentLoaded',()=>{installEdgeWrapper();schedule()},{once:true});injectStyle();installEdgeWrapper();schedule();
})();
