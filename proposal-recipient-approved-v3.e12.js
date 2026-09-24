'use strict';
(function(){
 const ROOT_ID='proposalRecipientApprovedV3';
 const STYLE_ID='proposalRecipientApprovedV3Style';
 const state={bootstrap:null,bootstrapPromise:null,editingId:null,timer:null,customSaving:false};

 function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;
  s.textContent=`
   .proposal-recipient-approved-section{border-color:#ead9d6!important}
   .proposal-recipient-approved-section #pvScope{border:0!important;padding:0!important;background:transparent!important}
   .proposal-recipient-approved-section #pvScope>.field{display:none!important}
   .proposal-recipient-approved-section>label:has(#pvAll),.proposal-recipient-approved-section .proposal-v3-mode-note,.proposal-recipient-approved-section #proposalAllRecipientsV3{display:none!important}
   .proposal-recipient-approved-section #pvSummary{display:none!important}
   .proposal-recipient-approved-active .proposal-v2-footer{display:none!important}
   .recipient-approved-tabs{display:flex;border-bottom:1px solid #eee6e3;margin:0 0 10px}
   .recipient-approved-tab{flex:1;border:0;background:transparent;padding:10px 12px 12px;font:inherit;font-weight:750;color:#667085;border-bottom:2px solid transparent}
   .recipient-approved-tab.active{color:#8f1519;border-bottom-color:#a90813}
   .recipient-approved-root{display:grid;gap:10px}
   .recipient-approved-all,.recipient-approved-org{border:1px solid #e7dfdc;border-radius:14px;background:#fff;overflow:hidden}
   .recipient-approved-all{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;padding:14px 15px;background:#fff8f7;border-color:#e3aaa5;cursor:pointer;color:#8d171b}
   .recipient-approved-all strong{font-size:14px}.recipient-approved-all span{font-size:12px;color:#7d6d6b;text-align:right}
   .recipient-approved-org-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;padding:14px 15px;cursor:pointer}
   .recipient-approved-org-title{display:grid;gap:2px;min-width:0}.recipient-approved-org-title strong{font-size:15px;color:#202936}.recipient-approved-org-title span{font-size:12px;color:#7a7f89}
   .recipient-approved-check{appearance:none;width:21px;height:21px;border:2px solid #a8adb5;border-radius:6px;background:#fff;display:grid;place-items:center;margin:0;cursor:pointer}
   .recipient-approved-check:checked{border-color:#a90813;background:#a90813}.recipient-approved-check:checked:after{content:'✓';color:#fff;font-size:13px;font-weight:900}
   .recipient-approved-class-check:checked{border-color:#2f75db;background:#2f75db}
   .recipient-approved-toggle{border:0;background:transparent;width:34px;height:34px;border-radius:8px;font-size:18px;cursor:pointer;color:#4a5565}
   .recipient-approved-org-body{border-top:1px solid #eee8e5;padding:4px 15px 10px 47px;display:grid}
   .recipient-approved-org[data-collapsed='1'] .recipient-approved-org-body{display:none}.recipient-approved-org[data-collapsed='1'] .recipient-approved-toggle{transform:rotate(180deg)}
   .recipient-approved-class{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;min-height:46px;border-bottom:1px solid #f2edeb;cursor:pointer;color:#303846}.recipient-approved-class:last-child{border-bottom:0}
   .recipient-approved-class>span:first-of-type{font-weight:650}.recipient-approved-class-count{font-size:12px;color:#7a7f89;white-space:nowrap}
   .recipient-approved-bottom{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin-top:12px;padding-top:13px;border-top:1px solid #eee6e3}
   .recipient-approved-selected{display:grid;gap:2px;color:#667085;font-size:12px}.recipient-approved-selected strong{font-size:16px;color:#202936}
   .recipient-approved-bottom .btn{min-width:180px;min-height:46px}
   @media(max-width:760px){
    .recipient-approved-all{grid-template-columns:auto 1fr;padding:13px}.recipient-approved-all span{grid-column:2;text-align:left;margin-top:-3px}
    .recipient-approved-org-head{padding:13px}.recipient-approved-org-body{padding:4px 13px 10px 44px}.recipient-approved-bottom{grid-template-columns:1fr}.recipient-approved-bottom .btn{width:100%;min-width:0}
   }
  `;document.head.appendChild(s);
 }
 async function bootstrap(){
  if(state.bootstrap)return state.bootstrap;
  if(state.bootstrapPromise)return state.bootstrapPromise;
  state.bootstrapPromise=edge(API.proposal,{action:'bootstrap'}).then(d=>(state.bootstrap=d,d)).finally(()=>{state.bootstrapPromise=null});
  return state.bootstrapPromise;
 }
 function allClasses(data){return (data?.organizations||[]).flatMap(o=>(data.classes_by_org?.[o.id]||[]).map(c=>({...c,organization_id:o.id,organization_name:o.name})))}
 function mapClasses(data){return new Map(allClasses(data).map(c=>[String(c.id),c]))}
 function selectedIds(){return [...document.querySelectorAll(`#${ROOT_ID} input[name="target"]:checked`)].map(x=>x.value)}
 function countText(classes){const students=classes.reduce((n,c)=>n+(Number(c.student_count)||0),0);return students?`${classes.length} turma${classes.length===1?'':'s'} · ${students} aluno${students===1?'':'s'}`:`${classes.length} turma${classes.length===1?'':'s'}`}
 async function selectedInitial(){
  if(state.editingId){try{const d=await edge(API.proposal,{action:'get',round_id:state.editingId});return new Set((d?.targets||[]).map(t=>String(t.class_id)).filter(Boolean))}catch{}}
  return new Set([...document.querySelectorAll('#pvClassBox input[name="target"]:checked')].map(x=>String(x.value)));
 }
 function sync(data){
  const ids=selectedIds(),set=new Set(ids),all=allClasses(data),map=mapClasses(data);
  const allBox=document.querySelector(`#${ROOT_ID} [data-all-check]`);if(allBox){allBox.checked=all.length>0&&ids.length===all.length;allBox.indeterminate=ids.length>0&&ids.length<all.length}
  document.querySelectorAll(`#${ROOT_ID} [data-org]`).forEach(card=>{const classes=data.classes_by_org?.[card.dataset.org]||[],checked=classes.filter(c=>set.has(String(c.id))).length,box=card.querySelector('[data-org-check]');if(box){box.checked=classes.length>0&&checked===classes.length;box.indeterminate=checked>0&&checked<classes.length}});
  const hiddenAll=document.getElementById('pvAll');if(hiddenAll)hiddenAll.checked=all.length>0&&ids.length===all.length;
  const orgSelect=document.getElementById('pvOrg');if(orgSelect&&!orgSelect.disabled){const first=ids.map(id=>map.get(String(id))?.organization_id).find(Boolean);if(first)orgSelect.value=first}
  const orgs=new Set(ids.map(id=>map.get(String(id))?.organization_id).filter(Boolean));
  const students=ids.reduce((n,id)=>n+(Number(map.get(String(id))?.student_count)||0),0);
  const selected=document.querySelector(`#${ROOT_ID} .recipient-approved-selected strong`);if(selected)selected.textContent=students?`${ids.length} turma${ids.length===1?'':'s'} · ${students} aluno${students===1?'':'s'}`:`${ids.length} turma${ids.length===1?'':'s'} selecionada${ids.length===1?'':'s'}`;
  const cont=document.querySelector(`#${ROOT_ID} [data-continue]`);if(cont)cont.disabled=ids.length===0;
  const dest=document.querySelector('#proposalPreviewV3 .proposal-v3-dest');if(dest)dest.innerHTML=`<b>Destinatários:</b> ${ids.length} turma(s) em ${orgs.size} instituição(ões)`;
 }
 async function render(){
  const form=document.getElementById('proposalV2Form'),scope=document.getElementById('pvScope'),box=document.getElementById('pvClassBox');
  if(!form||!scope||!box||document.getElementById(ROOT_ID))return;
  injectStyle();const data=await bootstrap();if(!form.isConnected)return;
  const selected=await selectedInitial();if(!form.isConnected)return;
  const section=scope.closest('.proposal-v2-section');section?.classList.add('proposal-recipient-approved-section');form.classList.add('proposal-recipient-approved-active');
  const p=section?.querySelector('header p');if(p)p.textContent='Selecione as instituições e as turmas que receberão esta proposta.';
  document.getElementById('pvAll')?.closest('label')?.setAttribute('hidden','');document.getElementById('pvOrg')?.closest('label')?.setAttribute('hidden','');
  const orgs=data.organizations||[],all=allClasses(data);
  box.innerHTML=`<div id="${ROOT_ID}" class="recipient-approved-root"><div class="recipient-approved-tabs"><button type="button" class="recipient-approved-tab active">Por instituição</button><button type="button" class="recipient-approved-tab" disabled>Por turma</button></div><label class="recipient-approved-all"><input type="checkbox" class="recipient-approved-check" data-all-check><strong>Selecionar todas as instituições e turmas</strong><span>${esc(countText(all))}</span></label>${orgs.map((org,index)=>{const classes=data.classes_by_org?.[org.id]||[];return `<section class="recipient-approved-org" data-org="${esc(org.id)}" data-collapsed="${index<2?'0':'1'}"><div class="recipient-approved-org-head"><input type="checkbox" class="recipient-approved-check" data-org-check aria-label="Selecionar ${esc(org.name)}"><div class="recipient-approved-org-title"><strong>${esc(org.name)}</strong><span>${esc(countText(classes))}</span></div><button type="button" class="recipient-approved-toggle" data-toggle-org aria-label="Expandir ou recolher">⌃</button></div><div class="recipient-approved-org-body">${classes.map(c=>`<label class="recipient-approved-class"><input type="checkbox" class="recipient-approved-check recipient-approved-class-check" name="target" value="${esc(c.id)}" ${selected.has(String(c.id))?'checked':''}><span>${esc(c.name)}</span><span class="recipient-approved-class-count">${Number(c.student_count)?`${Number(c.student_count)} aluno${Number(c.student_count)===1?'':'s'}`:''}</span></label>`).join('')||'<div class="muted" style="padding:10px 0">Nenhuma turma disponível.</div>'}</div></section>`}).join('')}<div class="recipient-approved-bottom"><div class="recipient-approved-selected"><span>Selecionadas:</span><strong>0 turmas selecionadas</strong></div><button type="button" class="btn primary" data-continue>Continuar →</button></div></div>`;
  const root=document.getElementById(ROOT_ID);
  root.addEventListener('click',e=>{const toggle=e.target.closest('[data-toggle-org]');if(toggle){const card=toggle.closest('[data-org]');card.dataset.collapsed=card.dataset.collapsed==='1'?'0':'1';return}const head=e.target.closest('.recipient-approved-org-head');if(head&&!e.target.matches('input,button')){const card=head.closest('[data-org]');card.dataset.collapsed=card.dataset.collapsed==='1'?'0':'1';return}if(e.target.closest('[data-continue]'))document.getElementById('pvPublish')?.click()});
  root.addEventListener('change',e=>{if(e.target.matches('[data-org-check]')){const card=e.target.closest('[data-org]');card.querySelectorAll('input[name="target"]').forEach(x=>x.checked=e.target.checked)}if(e.target.matches('[data-all-check]'))root.querySelectorAll('input[name="target"]').forEach(x=>x.checked=e.target.checked);sync(data)});
  sync(data);
 }
 function readMotivators(){return [...document.querySelectorAll('#pvMotivators [data-motivator-row]')].map(row=>({title:row.querySelector('[data-mot="title"]')?.value.trim()||'',body:row.querySelector('[data-mot="body"]')?.value.trim()||'',source_label:row.querySelector('[data-mot="source_label"]')?.value.trim()||'',source_url:row.querySelector('[data-mot="source_url"]')?.value.trim()||''})).filter(m=>m.body)}
 async function exactTargets(roundId,classIds){const session=await ensure();const response=await fetch(`${BASE}/rest/v1/rpc/set_canonical_proposal_class_targets_exact`,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({p_round:roundId,p_class_ids:classIds})});const d=await response.json().catch(()=>({}));if(!response.ok)throw Error(d.message||d.error||'Não foi possível atualizar os destinatários.');return d}
 async function needsCustomSave(){const root=document.getElementById(ROOT_ID);if(!root)return false;const data=await bootstrap(),map=mapClasses(data),ids=selectedIds(),orgs=new Set(ids.map(id=>map.get(String(id))?.organization_id).filter(Boolean));return ids.length>0&&ids.length<allClasses(data).length&&orgs.size>1}
 async function customSave(publish){
  if(state.customSaving)return;state.customSaving=true;
  try{
   const form=document.getElementById('proposalV2Form'),editor=document.getElementById('pvCommand');if(!form?.reportValidity())return;
   const ids=selectedIds();if(!ids.length){window.actionAlert?.('Selecione pelo menos uma turma.','Atenção');return}
   const motivators=readMotivators();if(!editor?.innerText.trim()){window.actionAlert?.('Preencha o comando da proposta.','Atenção');return}if(!motivators.length){window.actionAlert?.('Inclua ao menos um texto motivador.','Atenção');return}if(publish&&motivators.some(m=>!m.source_label)){window.actionAlert?.('Informe a fonte/autoria de cada texto motivador.','Atenção');return}
   if(publish&&!(await appConfirm(`Publicar esta proposta para ${ids.length} turma(s) selecionada(s)?`)))return;
   const data=await bootstrap(),map=mapClasses(data),first=map.get(String(ids[0]))?.organization_id||document.getElementById('pvOrg')?.value,anchorIds=ids.filter(id=>map.get(String(id))?.organization_id===first);
   let dueDate=null;if(state.editingId){try{dueDate=(await edge(API.proposal,{action:'get',round_id:state.editingId}))?.proposal?.due_date||null}catch{}}
   const html=typeof proposalHtml==='function'?proposalHtml(editor.innerHTML):editor.innerHTML;
   const payload={action:'save',round_id:state.editingId||undefined,theme:document.getElementById('pvTheme')?.value.trim()||'',thematic_axis:document.getElementById('pvAxis')?.value||'',proposal_command:editor.innerText.trim(),proposal_html:html,publish,organization_id:first,due_date:dueDate,understand_prompt:document.getElementById('pvUnderstand')?.value.trim()||'',class_ids:anchorIds,motivators};
   const result=await edge(API.proposal,payload),roundId=String(state.editingId||result?.proposal?.id||result?.round_id||'');if(!roundId)throw Error('A proposta foi salva, mas não foi possível confirmar os destinatários.');await exactTargets(roundId,ids);window.actionAlert?.(publish?'A proposta foi publicada para as turmas selecionadas.':'O rascunho foi salvo com os destinatários selecionados.',publish?'Proposta publicada':'Proposta salva');setTimeout(()=>navigate('proposals'),0);
  }catch(error){window.actionAlert?.(error.message||'Não foi possível salvar a proposta.','Atenção')}finally{state.customSaving=false}
 }
 document.addEventListener('click',async e=>{const edit=e.target.closest?.('[data-edit]');if(edit)state.editingId=edit.dataset.edit||null;if(e.target.closest?.('#proposalNew'))state.editingId=null;if(e.target.closest?.('#pvDraft')&&await needsCustomSave()){e.preventDefault();e.stopImmediatePropagation();customSave(false)}if(e.target.closest?.('#pvSavePublished')&&await needsCustomSave()){e.preventDefault();e.stopImmediatePropagation();customSave(true)}},true);
 document.addEventListener('submit',async e=>{if(e.target?.id!=='proposalV2Form'||state.customSaving)return;if(await needsCustomSave()){e.preventDefault();e.stopImmediatePropagation();customSave(true)}},true);
 function schedule(){clearTimeout(state.timer);state.timer=setTimeout(()=>render().catch(err=>console.error('[VERSÃO] Destinatários aprovados:',err)),60)}
 const view=document.getElementById('view');if(view)new MutationObserver(schedule).observe(view,{subtree:true,childList:true});document.addEventListener('DOMContentLoaded',schedule,{once:true});injectStyle();schedule();
})();