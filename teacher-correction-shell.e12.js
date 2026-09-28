'use strict';
async function renderCorrection(navigation){const q=[];if(!navigationCurrent(navigation))return;S.cache.correctionRows=q;$('view').innerHTML=header('Correções','')+`<p id="coPending"></p><details class="correction-filters"><summary>Filtros</summary><section class="filters"><label class="filter"><small>Instituição</small><select id="coOrg"><option value="">Todas</option>${[...new Map(q.map(x=>[x.orgId,x.orgName])).entries()].filter(x=>x[0]).map(([id,n])=>`<option value="${id}">${esc(n)}</option>`).join('')}</select></label><label class="filter"><small>Turma</small><select id="coClass"><option value="">Todas</option></select></label><label class="filter"><small>Proposta</small><select id="coRound"><option value="">Todas</option></select></label><label class="filter"><small>Status</small><select id="coStatus"><option value="">Todos</option><option value="uncorrected">Aguardando correção</option><option value="processing">Em análise</option><option value="validation">Pronta para revisar</option><option value="approved">Concluída</option></select></label></section></details><div id="coActive" class="item-actions"></div><div class="toolbar"><span id="coCount" class="muted"></span><input id="coSearch" placeholder="Pesquisar aluno..." style="height:40px;border:1px solid #D8D1CF;border-radius:10px;padding:0 12px"></div><div id="coList" class="list"></div><button id="coMore" class="btn soft-btn" hidden>Carregar mais 10</button>`;const home=S.homeCorrection;S.homeCorrection=null;S.cache.correctionPage={offset:0,hasMore:true,version:0,navigation};
const reset=()=>correctionLoadPage(true,navigation);
['coOrg','coClass','coRound','coStatus'].forEach(id=>$(id).onchange=reset);
let searchTimer;$('coSearch').oninput=()=>{clearTimeout(searchTimer);++S.cache.correctionPage.version;$('coMore').disabled=true;searchTimer=setTimeout(reset,300)};
$('coList').onclick=correctionClick;$('coMore').onclick=()=>correctionLoadPage(false,navigation);
if(home?.filter)$('coStatus').value=home.filter;
await correctionLoadPage(true,navigation,home?.target);
}
async function correctionLoadPage(reset,navigation,target){
 const state=S.cache.correctionPage;navigation=navigation||state?.navigation;if(!navigationCurrent(navigation))return;if(!state||(!reset&&state.busy))return;
 const version=++state.version;state.busy=true;if(reset){state.offset=0;S.cache.correctionRows=[];$('coList').innerHTML='<div class="empty">Carregando redações...</div>'}
 const more=$('coMore');if(reset)more.hidden=true;more.disabled=true;more.textContent='Carregar mais 10';
 try{
  const data=await edge(API.live,{action:'queue_page',offset:state.offset,facets:!state.facets,org:$('coOrg').value,class_id:$('coClass').value,round:$('coRound').value,status:$('coStatus').value,search:$('coSearch').value,target:target||''});
  if(!navigationCurrent(navigation)||state!==S.cache.correctionPage||version!==state.version)return;
  if(data.facets){state.facets=data.facets;for(const [id,rows,label] of [['coOrg',data.facets.orgs,x=>x.name],['coClass',data.facets.classes,x=>x.name],['coRound',data.facets.rounds,x=>x.theme]]){const value=$(id).value;$(id).innerHTML='<option value="">Todas</option>'+(rows||[]).map(x=>`<option value="${esc(x.id)}">${esc(label(x))}</option>`).join('');$(id).value=value}}
  const existing=new Map((S.cache.correctionRows||[]).map(x=>[x.submission_id,x]));for(const x of data.items||[])existing.set(x.submission_id,{...x,orgId:x.organization_id||'',orgName:x.organization_name||'Sem instituição'});S.cache.correctionRows=[...existing.values()];state.offset=data.next_offset;state.hasMore=data.has_more;const openCards=reset?[]:[...$('coList').querySelectorAll('[data-sub]')];correctionRender();for(const card of openCards){const fresh=[...$('coList').children].find(x=>x.dataset.sub===card.dataset.sub);if(fresh)fresh.replaceWith(card)}more.hidden=!state.hasMore;
  if(target){const b=$('coList').querySelector('[data-open="'+target+'"]');if(b)b.click()}
 }catch(error){if(navigationCurrent(navigation)&&version===state.version){toast(error.message);if(reset)$('coList').innerHTML='<div class="empty">Não foi possível carregar a fila. Tente novamente.</div>';more.hidden=false;more.textContent='Tentar novamente';}}
 finally{if(navigationCurrent(navigation)&&version===state.version){state.busy=false;more.disabled=false;}}
}

function correctionDeps(){}
function correctionState(row){
 if(row.job_status==='processing')return 'processing';
 if(row.job_status==='completed')return 'validation';
 if(row.score?.is_approved)return 'approved';
 return 'uncorrected';
}
function correctionRender(){
 const q=S.cache.correctionRows||[],oid=$('coOrg').value,cid=$('coClass').value,rid=$('coRound').value,sts=$('coStatus').value,search=$('coSearch').value.trim().toLowerCase();
 const a=q.filter(x=>(!oid||x.orgId===oid)&&(!cid||x.class_id===cid)&&(!rid||x.round_id===rid)&&(!sts||(sts==='pending'?correctionState(x)!=='approved':correctionState(x)===sts))&&(!search||x.student_name.toLowerCase().includes(search)));
 $('coPending').textContent='Redações carregadas em grupos de 10.';
 $('coCount').textContent=a.length+' redação(ões) carregada(s)';
 $('coActive').innerHTML=['coOrg','coClass','coRound','coStatus'].filter(id=>$(id).value).map(id=>`<button class="btn soft-btn" data-clear-filter="${id}">${esc($(id).selectedOptions[0].textContent)} ×</button>`).join('');
 $('coActive').onclick=e=>{const b=e.target.closest('[data-clear-filter]');if(!b)return;$(b.dataset.clearFilter).value='';correctionLoadPage(true)};
 const labels={uncorrected:'Aguardando correção',processing:'Em análise',validation:'Pronta para revisar',approved:'Concluída'};
 $('coList').innerHTML=a.length?a.map(x=>{const state=correctionState(x);return `<article class="list-item" data-sub="${esc(x.submission_id)}"><div class="item-top"><div><div class="item-title">${esc(x.student_name)}</div><div class="item-meta">${esc(x.theme)}</div><div class="item-meta">${esc(x.class_name)} · ${esc(x.orgName)}</div></div><span class="pill">${labels[state]}</span></div><div class="item-actions"><button class="btn primary" data-menu="${esc(x.submission_id)}">${state==='validation'?'Revisar correção':state==='processing'?'Acompanhar correção':'Corrigir redação'}</button><button class="btn soft-btn" data-open="${esc(x.submission_id)}">Visualizar</button></div><div id="slot-${esc(x.submission_id)}"></div></article>`}).join(''):'<div class="empty">Nenhuma redação encontrada.</div>';
}
async function correctionChoice(id){
 const row=(S.cache.correctionRows||[]).find(x=>x.submission_id===id);
 if(['processing','validation'].includes(correctionState(row||{})))return aiCorrection(id,{readOnly:true});
 const slot=$('slot-'+id);if(!slot)return;
 slot.innerHTML=`<div class="split"><div id="choiceEssay-${esc(id)}" class="essay-pane"></div><div class="box"><div class="box-head"><h2>Como deseja corrigir?</h2></div><div class="box-body"><h3>Correção Inteligente</h3><p>A VERSÃO analisa a redação e prepara uma correção para você revisar.</p><p>Consome 1 crédito. A correção atual continuará disponível até a nova análise ser concluída.</p><button class="btn primary" data-ai="${esc(id)}">${row?.score?.is_approved?'Refazer Correção Inteligente':'Iniciar Correção Inteligente'}</button><hr><h3>Correção Manual</h3><p>Você realiza diretamente a avaliação e o feedback.</p><button class="btn soft-btn" data-manual="${esc(id)}">Iniciar Correção Manual</button></div></div></div>`;
 await openEssay(id,$('choiceEssay-'+id));
}
async function correctionClick(e){
 let b=e.target.closest('[data-open]');if(b)return openEssay(b.dataset.open,$('slot-'+b.dataset.open));
 b=e.target.closest('[data-menu]');if(b)return correctionChoice(b.dataset.menu);
 b=e.target.closest('[data-manual]');if(b)return manualCorrection(b.dataset.manual);
 b=e.target.closest('[data-ai]');if(b){if(b.disabled)return;b.disabled=true;try{const current=await aiRead({action:'get',submission_id:b.dataset.ai}),job=current?.job;return await aiCorrection(b.dataset.ai,['completed','approved'].includes(job?.status)?{redo:true,previousJob:job.id}:{retry:true});}catch(error){toast(error.message)}finally{b.disabled=false}return;}
 b=e.target.closest('[data-save-manual]');if(b)return saveManual(b.dataset.saveManual,false);
 b=e.target.closest('[data-publish-manual]');if(b)return saveManual(b.dataset.publishManual,true);
}
