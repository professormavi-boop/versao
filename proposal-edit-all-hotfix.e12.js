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
   const count=scope.querySelectorAll('input[name="target"]:checked').length;
   summary.textContent=`${count} turma(s) selecionada(s).`;
  }
 }

 function ensureOldFlow(){
  const all=document.getElementById('demoAll');
  if(!all)return;
  if(all.disabled)all.disabled=false;
  const label=all.closest('label');
  if(label&&/Todas as instituições/i.test(label.textContent||'')){
   for(const node of label.childNodes){
    if(node.nodeType===Node.TEXT_NODE&&/Todas as instituições/i.test(node.textContent||''))node.textContent=' Todas as minhas instituições';
   }
  }
 }

 function ensureV2EditingAll(){
  if(!editingRoundId)return;
  const scope=document.getElementById('pvScope');
  const org=document.getElementById('pvOrg');
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
  if(event.target.closest('#proposalNew,#proposalCreateTab,#proposalBack,#pvCancel,[data-route="proposals"]'))editingRoundId=null;
  setTimeout(apply,0);
 },true);

 const view=document.getElementById('view');
 if(view)new MutationObserver(apply).observe(view,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled']});
 document.addEventListener('DOMContentLoaded',apply,{once:true});
 apply();
})();
