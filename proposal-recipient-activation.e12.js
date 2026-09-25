'use strict';
(function(){
 const ROOT_ID='proposalRecipientCardsV2';
 let timer=null,editingId=null,bootPromise=null;

 function apiCall(body){
  if(typeof edge!=='function'||!API?.proposal)throw Error('API de propostas indisponível.');
  return edge(API.proposal,body);
 }
 function bootstrap(){
  if(!bootPromise)bootPromise=apiCall({action:'bootstrap'}).catch(error=>{bootPromise=null;throw error});
  return bootPromise;
 }
 function allClasses(data){
  return (data?.organizations||[]).flatMap(org=>(data.classes_by_org?.[org.id]||[]).map(c=>({...c,organization_id:org.id,organization_name:org.name})));
 }
 function countText(classes){
  const students=classes.reduce((sum,c)=>sum+(Number(c.student_count)||0),0);
  const classesText=`${classes.length} turma${classes.length===1?'':'s'}`;
  return students?`${classesText} · ${students} aluno${students===1?'':'s'}`:classesText;
 }
 async function initialSelected(){
  if(editingId){
   try{
    const details=await apiCall({action:'get',round_id:editingId});
    return new Set((details?.targets||[]).map(t=>String(t.class_id)).filter(Boolean));
   }catch{}
  }
  return new Set([...document.querySelectorAll('#pvClassBox input[name="target"]:checked')].map(x=>String(x.value)));
 }
 function selectedIds(root){return [...root.querySelectorAll('input[name="target"]:checked')].map(x=>String(x.value))}
 function sync(root,data){
  const ids=selectedIds(root),set=new Set(ids),all=allClasses(data),map=new Map(all.map(c=>[String(c.id),c]));
  root.querySelectorAll('[data-org]').forEach(card=>{
   const classes=data.classes_by_org?.[card.dataset.org]||[];
   const checked=classes.filter(c=>set.has(String(c.id))).length;
   const box=card.querySelector('[data-org-check]');
   if(box){box.checked=classes.length>0&&checked===classes.length;box.indeterminate=checked>0&&checked<classes.length}
  });
  const allBox=root.querySelector('[data-all-check]');
  if(allBox){allBox.checked=all.length>0&&ids.length===all.length;allBox.indeterminate=ids.length>0&&ids.length<all.length}
  const students=ids.reduce((sum,id)=>sum+(Number(map.get(id)?.student_count)||0),0);
  const selected=root.querySelector('.proposal-recipient-selected-v2 strong');
  if(selected)selected.textContent=students?`${ids.length} turma${ids.length===1?'':'s'} · ${students} aluno${students===1?'':'s'}`:`${ids.length} turma${ids.length===1?'':'s'} selecionada${ids.length===1?'':'s'}`;
  const allCount=root.querySelector('[data-all-count]');if(allCount)allCount.textContent=countText(all);
  const cont=root.querySelector('[data-continue]');if(cont)cont.disabled=ids.length===0;
  const oldAll=document.getElementById('pvAll');if(oldAll)oldAll.checked=false;
  const orgSelect=document.getElementById('pvOrg');
  if(orgSelect&&!orgSelect.disabled&&ids.length){const first=map.get(ids[0])?.organization_id;if(first)orgSelect.value=String(first)}
 }
 async function render(){
  const form=document.getElementById('proposalV2Form'),scope=document.getElementById('pvScope'),classBox=document.getElementById('pvClassBox');
  if(!form||!scope||!classBox)return;
  if(document.getElementById(ROOT_ID))return;
  const data=await bootstrap();
  if(!form.isConnected||!classBox.isConnected)return;
  const selected=await initialSelected();
  if(!form.isConnected||!classBox.isConnected)return;

  const section=scope.closest('.proposal-v2-section');
  section?.classList.add('proposal-recipient-v2-section');
  form.classList.add('proposal-recipient-v2-active');
  classBox.dataset.cardsV2='1';
  const p=section?.querySelector(':scope > header p');
  if(p)p.textContent='Selecione as instituições e as turmas que receberão esta proposta.';
  const oldAll=document.getElementById('pvAll')?.closest('label');if(oldAll)oldAll.hidden=true;
  const orgLabel=document.getElementById('pvOrg')?.closest('label');if(orgLabel)orgLabel.hidden=true;
  const modeNote=section?.querySelector('.proposal-v3-mode-note');if(modeNote)modeNote.hidden=true;
  const legacySummary=document.getElementById('proposalAllRecipientsV3');if(legacySummary)legacySummary.hidden=true;

  const orgs=data?.organizations||[];
  classBox.innerHTML=`<div id="${ROOT_ID}" class="proposal-recipient-cards-v2">${orgs.map((org,index)=>{
   const classes=data.classes_by_org?.[org.id]||[];
   return `<section class="proposal-recipient-org-v2" data-org="${esc(org.id)}" data-collapsed="${index<2?'0':'1'}"><div class="proposal-recipient-org-head-v2"><input class="proposal-recipient-check-v2" type="checkbox" data-org-check aria-label="Selecionar ${esc(org.name)}"><div class="proposal-recipient-org-title-v2"><strong>${esc(org.name)}</strong><span>${esc(countText(classes))}</span></div><button type="button" class="proposal-recipient-toggle-v2" data-toggle-org aria-label="Expandir ou recolher instituição">⌃</button></div><div class="proposal-recipient-org-body-v2">${classes.map(c=>`<label class="proposal-recipient-class-v2"><input class="proposal-recipient-check-v2 proposal-recipient-class-check-v2" type="checkbox" name="target" value="${esc(c.id)}" ${selected.has(String(c.id))?'checked':''}><span>${esc(c.name)}</span><span class="proposal-recipient-class-count-v2">${Number(c.student_count)?`${Number(c.student_count)} aluno${Number(c.student_count)===1?'':'s'}`:''}</span></label>`).join('')||'<div class="muted" style="padding:12px 0">Nenhuma turma disponível.</div>'}</div></section>`;
  }).join('')}<label class="proposal-recipient-all-v2"><input class="proposal-recipient-check-v2" type="checkbox" data-all-check><strong>Selecionar todas</strong><span data-all-count></span></label><div class="proposal-recipient-bottom-v2"><div class="proposal-recipient-selected-v2"><span>Selecionadas:</span><strong>0 turmas selecionadas</strong></div><button type="button" class="btn primary" data-continue>Continuar →</button></div></div>`;

  const root=document.getElementById(ROOT_ID);if(!root)return;
  root.addEventListener('click',event=>{
   const toggle=event.target.closest('[data-toggle-org]');
   if(toggle){const card=toggle.closest('[data-org]');card.dataset.collapsed=card.dataset.collapsed==='1'?'0':'1';return}
   const head=event.target.closest('.proposal-recipient-org-head-v2');
   if(head&&!event.target.matches('input,button')){const card=head.closest('[data-org]');card.dataset.collapsed=card.dataset.collapsed==='1'?'0':'1';return}
   if(event.target.closest('[data-continue]')){document.getElementById('pvPublish')?.click()}
  });
  root.addEventListener('change',event=>{
   if(event.target.matches('[data-org-check]'))event.target.closest('[data-org]')?.querySelectorAll('input[name="target"]').forEach(box=>box.checked=event.target.checked);
   if(event.target.matches('[data-all-check]'))root.querySelectorAll('input[name="target"]').forEach(box=>box.checked=event.target.checked);
   sync(root,data);
  });
  sync(root,data);
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>render().catch(()=>{}),50)}
 document.addEventListener('click',event=>{
  const edit=event.target.closest?.('[data-edit]');if(edit?.dataset.edit)editingId=edit.dataset.edit;
  if(event.target.closest?.('#proposalNew,#proposalUiCreate,#proposalBack,#pvCancel,[data-route="proposals"]'))editingId=null;
  schedule();
 },true);
 const view=document.getElementById('view');if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
 document.addEventListener('DOMContentLoaded',schedule,{once:true});schedule();
})();