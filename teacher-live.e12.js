'use strict';
window.teacherLiveHomeCard=()=>`<section class="tl-home student-live-offer"><span class="student-live-eyebrow">Ao Vivo · Da redação à devolutiva</span><h2>Mais clareza para orientar a próxima versão.</h2><p>Envie a redação, confira a análise e compartilhe uma devolutiva que ajuda o aluno a dar o próximo passo.</p><ul class="student-live-benefits"><li>Análise das 5 competências do ENEM</li><li>Pontos fortes e orientações para a revisão</li><li>Seu olhar de professor antes de compartilhar</li></ul><div class="student-live-offer-actions"><button class="btn primary" data-home-live>Quero corrigir uma redação</button></div><small>1 crédito por correção. Comece com uma foto, um arquivo ou texto, sem cadastrar escola ou turma.</small></section>`;
window.liveCompetenciesHtml=value=>['C1','C2','C3','C4','C5'].map(c=>`<article class="tl-competency-card"><h3>${c}<strong>${Number(value.competencies[c].score)} / 200</strong></h3><p>${esc(value.competencies[c].diagnostic)}</p></article>`).join('');
// Apresentação compartilhada de evidências: nunca exibir objetos/JSON ao usuário.
window.liveEvidenceHtml=function(value){
 const plain=v=>typeof v==='string'?v.trim():'';
 const field=(label,v)=>plain(v)?`<div class="tl-evidence-field"><strong>${label}</strong><p>${esc(plain(v))}</p></div>`:'';
 const list=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];
 const deviations=list(value.c1_deviations);
 const parts=[`<section class="tl-evidence"><h3>Desvios e sugestões</h3>${deviations.length?deviations.map((d,i)=>`<article class="tl-evidence-card"><h4>Ocorrência ${i+1}</h4>${field('Trecho original',d.original)}${field('Sugestão de escrita',d.correction)}${field('Explicação',d.rule)}${field('Localização no texto',d.location)}${field('Contexto',d.evidence)}</article>`).join(''):`<p class="tl-muted">${Array.isArray(value.c1_deviations)?'Nenhum desvio foi apontado nesta análise.':'Os desvios não estão disponíveis nesta análise.'}</p>`}</section>`];
 const intervention=value.c5_check;
 parts.push(`<section class="tl-evidence"><h3>Proposta de intervenção · C5</h3>${intervention&&typeof intervention==='object'?`<div class="tl-evidence-card">${[['agent','Agente'],['action','Ação'],['means','Meio ou modo'],['purpose','Finalidade'],['detail','Detalhamento'],['human_rights','Respeito aos direitos humanos'],['argument_alignment','Relação com a argumentação']].map(([key,label])=>field(label,plain(intervention[key])||'Não informado nesta análise.')).join('')}</div>`:'<p class="tl-muted">A análise da intervenção não está disponível.</p>'}</section>`);
 const references=list(value.repertoire_checks);
 if(references.length)parts.push(`<section class="tl-evidence"><h3>Conferência dos repertórios</h3>${references.map(r=>`<article class="tl-evidence-card">${field('Referência',r.reference)}${field('Verificação',({'confirmada':'Referência confirmada','contradita':'Informação divergente da fonte','não confirmada':'Referência não confirmada'})[r.classification]||'Confira esta referência')}${field('Análise',r.analysis)}</article>`).join('')}</section>`);
 const notes=Array.isArray(value.review_requirements)?value.review_requirements.filter(v=>plain(v)):[];
 if(notes.length)parts.push(`<section class="tl-evidence"><h3>Pontos para conferir</h3><ul>${notes.map(v=>`<li>${esc(v)}</li>`).join('')}</ul></section>`);
 return parts.join('');
};
// Índices sempre se referem à análise original, inclusive após descartar ocorrências.
window.liveDeviationReviews=job=>{
 const decisions=job.review?.review_audit?.decisions||[];
 return (job.result.c1_deviations||[]).map((d,index)=>{
  const saved=decisions.find(x=>x.index===index);
  return {index,decision:saved?.decision==='discarded'?'discarded':'confirmed',correction:saved?.correction??d.correction??'',rule:saved?.rule??d.rule??'',reason:saved?.reason??''};
 });
};
window.liveDeviationEditorHtml=job=>{
 const reviews=window.liveDeviationReviews(job);
 return `<section class="tl-result-section" id="tlDeviationEditor"><h3>Revisar desvios</h3><p>Os apontamentos são mantidos por padrão. Edite a sugestão e a regra ou ignore o apontamento. Ignorados não aparecem na devolutiva. A nota de C1 pode ser ajustada acima.</p>${reviews.map(d=>{const original=job.result.c1_deviations[d.index];return `<article class="tl-evidence-card" data-live-deviation="${d.index}"><h4>Ocorrência ${d.index+1}</h4><p><b>Trecho original:</b> ${esc(original.original)}</p><p>${esc(original.location||'')}</p><blockquote>${esc(original.evidence||'')}</blockquote><label class="field">Sugestão de escrita<textarea data-live-correction="${d.index}">${esc(d.correction)}</textarea></label><label class="field">Regra aplicada no contexto<textarea data-live-rule="${d.index}">${esc(d.rule)}</textarea></label><label class="tl-confirm"><input type="checkbox" data-live-discard="${d.index}" ${d.decision==='discarded'?'checked':''}> Ignorar este apontamento</label><p class="tl-muted">Para restaurar, desmarque ignorar.</p></article>`;}).join('')||'<p>Nenhum desvio apontado nesta análise.</p>'}<label class="field">Observação da revisão (opcional)<textarea id="tlReviewNote" maxlength="4000">${esc(job.review?.review_audit?.note||'')}</textarea></label></section>`;
};
window.renderTeacherLive=async function(navigation,preset=null){
 const studentMode=S.profile.role==='student';
 if(!['teacher','student'].includes(S.profile.role))throw Error('Esta área não está disponível para o seu perfil.');
 const api=body=>edge('teacher-organization-api',body);
 const available=await api({action:'live_status'});if(!navigationCurrent(navigation))return;
 let step=1,essay=null,file=null,text='',name='',school='',theme='',origin='provided',confirmed=false,job=null,busy=false,pollTimer=null,elapsedTimer=null,analysisStartedAt=null;
 let draftId=crypto.randomUUID(),activity=null,activityEnabled=false,activityName='',activityDraftId=crypto.randomUUID();
 let reviewEditing=false,activeMenu='tlNew',activitySearch='',historySearch='',activityOffset=0,detailBack=null,detailVersions=null;
 let correctionScope='complete',transcription=null,writingContext={},useWritingContext=true;
 if(preset){correctionScope=studentMode?'complete':window.WritingStages.scope(preset.stage);text=String(preset.text||'');theme=String(preset.theme||'');writingContext=studentMode?{}:preset.context||{};}
 const requests={theme:null,correction:null};
 const schoolCatalog=[];
 if(available.enabled){const sources=await Promise.allSettled([studentMode?Promise.resolve({organizations:[]}):api({action:'organizations'}),api({action:'live_history'})]);for(const item of sources){if(item.status==='fulfilled'){schoolCatalog.push(...(item.value.organizations||[]).map(x=>x.name),...(item.value.essays||[]).map(x=>x.school_label));}}}
 if(!navigationCurrent(navigation))return;
 const current=()=>navigationCurrent(navigation);
 const status=message=>{if(current()){if($('tlStatus'))$('tlStatus').textContent=message;if($('tlManageStatus'))$('tlManageStatus').textContent=message;}};
 async function act(button,fn){if(busy)return;busy=true;if(button)button.disabled=true;status('Aguarde…');try{await fn();}catch(error){status(error.message||'Não foi possível continuar.');}finally{busy=false;if(button?.isConnected)button.disabled=false;}}
 function shell(content){const menuRoute=activeMenu==='tlActivities'?'teacher-live-activities':activeMenu==='tlHistory'?(studentMode?'student-live-history':'teacher-live-history'):(studentMode?'student-live':'teacher-live');if(typeof setActive==='function'){setActive(menuRoute);document.querySelector('#nav [data-route="'+menuRoute+'"]')?.closest('details')?.setAttribute('open','');}clearTimeout(pollTimer);clearInterval(elapsedTimer);elapsedTimer=null;if(!current())return;$('view').innerHTML=header(studentMode?'Corrigir':'Ao Vivo','Da redação à devolutiva, no seu ritmo.')+`<section class="teacher-live"><div class="tl-actions tl-nav"><button class="btn ghost" id="tlNew">${studentMode?'Enviar':'Nova redação'}</button><button class="btn ghost" id="tlHistory">Histórico</button>${studentMode?'<button class="btn ghost" id="tlCredits">Créditos</button>':'<button class="btn ghost" id="tlActivities">Atividades</button>'}</div>${detailBack?'<div class="tl-actions"><button class="btn ghost" id="tlListBack">Voltar à lista</button>'+(detailVersions?'<button class="btn ghost" id="tlVersions">Versões anteriores</button>':'')+'</div>':''}${content}<p id="tlStatus" class="tl-status" role="status" aria-live="polite"></p></section>`;document.querySelectorAll('.tl-nav button').forEach(b=>{if(b.id===activeMenu)b.setAttribute('aria-current','page');});if($('tlListBack'))$('tlListBack').onclick=e=>act(e.target,detailBack);if($('tlVersions'))$('tlVersions').onclick=e=>act(e.target,detailVersions);$('tlNew').onclick=()=>{if(busy)return;navigate(studentMode?'student-live':'teacher-live');};$('tlHistory').onclick=e=>act(e.target,()=>{historySearch='';return history();});if($('tlCredits'))$('tlCredits').onclick=()=>navigate('student-credits');if($('tlActivities'))$('tlActivities').onclick=e=>act(e.target,()=>activities());}
 const steps=()=>`<div class="tl-steps">${['Redação','Tema','Correção'].map((label,i)=>`<span ${step===i+1?'aria-current="step"':''}>${i+1}. ${label}</span>`).join('')}</div>`;
 function saveFields(){activityName=$('tlActivityName')?.value??activityName;name=$('tlName')?.value??name;school=$('tlSchool')?.value??school;if(window.SchoolNames)school=SchoolNames.match(school,schoolCatalog).label;text=$('tlText')?.value??text;theme=$('tlTheme')?.value??theme;}
 function nextEssay(selected){
  if(studentMode||busy||selected.deleted_at)return;
  activeMenu='tlNew';activity=selected;activityEnabled=true;activityName=selected.name;activityDraftId=selected.id;
  draftId=crypto.randomUUID();essay=null;file=null;text='';name='';school='';job=null;correctionScope='complete';
  requests.theme=null;requests.correction=null;theme=selected.theme;origin=selected.theme_origin;confirmed=true;step=1;render();
 }
 function replaceInput(){
  if(busy||job?.status==='processing')return;
  saveFields();clearTimeout(pollTimer);
  draftId=crypto.randomUUID();essay=null;file=null;job=null;
  requests.theme=null;requests.correction=null;
  if(!activity){if(origin==='inferred')theme='';confirmed=false;}
  step=1;render();status('Envie outra foto ou arquivo, ou edite o texto. A tentativa anterior permanece no histórico.');
 }
 function listSearchHtml(value,label){return `<form id="tlListSearch" class="tl-search"><label class="field">${label}<input id="tlSearchInput" type="search" maxlength="100" value="${esc(value)}" placeholder="Digite para buscar"></label><button class="btn" type="submit">Buscar</button>${value?'<button class="btn ghost" type="button" id="tlSearchClear">Limpar</button>':''}</form>`;}
 function bindListSearch(run){$('tlListSearch').onsubmit=e=>{e.preventDefault();act($('tlListSearch').querySelector('[type="submit"]'),()=>run($('tlSearchInput').value.trim()));};if($('tlSearchClear'))$('tlSearchClear').onclick=e=>act(e.target,()=>run(''));}
 function summaryHtml(e){const state=e.summary?.state;const label={draft:'Rascunho',ready:'Pronta para corrigir',processing:'Em análise',failed:'Não concluída',review:studentMode?'Concluída':'Aguardando revisão',reviewed:'Revisada'}[state]||(!e.theme?'Rascunho':'Situação indisponível');const score=e.summary?.score;return `${e.correction_scope&&e.correction_scope!=='complete'?`<p class="tl-muted">${esc(window.WritingStages?.stages[e.correction_scope]?.label||'Etapa')} · Sem nota ENEM</p>`:''}<span class="tl-badge">${label}</span>${typeof score==='number'?`<p class="tl-muted"><b>${score} / 1000</b>${state==='review'?' · Nota estimada':''}</p>`:''}`;}
 function summaryAction(e){return ({draft:'Continuar',ready:'Corrigir',processing:'Acompanhar',failed:'Ver tentativa',review:studentMode?'Ver devolutiva':'Revisar',reviewed:'Ver devolutiva'})[e.summary?.state]||'Abrir redação';}
 function managementButtons(item,kind){return available.management?`<button class="btn tl-text-button" data-edit-${kind}="${esc(item.id)}">${kind==='essay'?'Editar identificação':'Editar'}</button><button class="btn tl-text-button tl-danger" data-delete-${kind}="${esc(item.id)}">Excluir</button>`:'';}
 function bindManagement(items,kind,refresh){
  for(const operation of ['edit','delete'])document.querySelectorAll(`[data-${operation}-${kind}]`).forEach(button=>button.onclick=()=>{
   if(busy)return;const item=items.find(x=>x.id===button.getAttribute(`data-${operation}-${kind}`));if(!item)return;
   const panel=$('tlManagePanel');const removing=operation==='delete';
   panel.innerHTML=`<section class="tl-editor" aria-labelledby="tlEditorTitle"><h3 id="tlEditorTitle">${removing?'Excluir': 'Editar'} ${kind==='activity'?'atividade':removing?'redação':'identificação'}</h3><p class="tl-item-name">${esc(kind==='activity'?(item.name||'Atividade sem nome'):(item.student_label||'Sem identificação'))}</p>${removing?`<p>${kind==='activity'?'A atividade sairá da lista. As redações continuarão disponíveis no histórico.':'A redação sairá do histórico e seus links de compartilhamento serão desativados. Créditos utilizados não serão devolvidos.'}</p>`:kind==='activity'?`<label class="field">Nome da atividade <span class="tl-muted">Opcional</span><input id="tlEditName" maxlength="160" value="${esc(item.name)}"></label><p class="tl-muted">O tema das correções já realizadas será preservado.</p>`:`<label class="field">Nome do aluno <span class="tl-muted">Opcional</span><input id="tlEditName" maxlength="160" value="${esc(item.student_label)}"></label><label class="field">Escola <span class="tl-muted">Opcional</span><input id="tlEditSchool" maxlength="160" value="${esc(item.school_label)}"></label><p class="tl-muted">As notas e o texto da redação serão preservados. Links já compartilhados mantêm a identificação original.</p>`}<div class="tl-actions"><button class="btn ${removing?'tl-danger':'primary'}" id="tlManageSave">${removing?'Excluir '+(kind==='activity'?'atividade':'redação'):'Salvar alterações'}</button><button class="btn" id="tlManageCancel">Cancelar</button></div><p id="tlManageStatus" class="tl-status" role="status" aria-live="polite"></p></section>`;
   panel.scrollIntoView?.({behavior:'smooth',block:'center'});($('tlEditName')||$('tlManageCancel')).focus();
   $('tlManageCancel').onclick=()=>{if(busy)return;panel.innerHTML='';button.focus();};
   $('tlManageSave').onclick=e=>act(e.target,async()=>{
    let label=$('tlEditSchool')?.value||'';if(window.SchoolNames)label=SchoolNames.match(label,schoolCatalog).label;
    await api({action:'live_manage',kind,id:item.id,operation,...(!removing?{name:$('tlEditName').value,school:label}:{})});
    await refresh();status(removing?'Item excluído da lista.':'Alterações salvas.');
   });
  });
 }
 async function activities(offset=0){
  const data=await api({action:'live_activities',offset,search:activitySearch,include_summary:true});if(!current())return;activeMenu='tlActivities';activityOffset=offset;detailBack=null;detailVersions=null;
  shell(`<section class="tl-card tl-list"><div class="tl-list-heading"><h2>Atividades</h2><p>Reutilize o tema e acompanhe as redações de cada atividade.</p></div>${listSearchHtml(activitySearch,'Buscar atividade ou tema')}<div id="tlManagePanel"></div>${data.activities.length?`<table class="tl-table"><thead><tr><th scope="col">Atividade e tema</th><th scope="col">Data</th><th scope="col">Ações</th></tr></thead><tbody>${data.activities.map(a=>`<tr><td><strong class="tl-item-name">${esc(a.name||'Atividade sem nome')}</strong><p class="tl-item-theme">${esc(a.theme)}</p>${Number.isInteger(a.essay_count)?`<p class="tl-muted">${a.essay_count} redação(ões) · ${a.pending_review_count} para revisar</p>`:''}</td><td class="tl-date" data-label="Criada em">${esc(fmtDate(a.created_at))}</td><td><div class="tl-row-actions"><button class="btn" data-activity="${esc(a.id)}">Ver redações</button>${managementButtons(a,'activity')}</div></td></tr>`).join('')}</tbody></table>`:`<p class="tl-empty">${activitySearch?'Nenhuma atividade encontrada para esta busca.':'Suas atividades aparecerão aqui quando você salvar a primeira.'}</p>`}<div class="tl-actions">${offset?'<button class="btn" id="tlPreviousActivity">Anterior</button>':''}${(data.has_more??data.activities.length===20)?'<button class="btn" id="tlNextActivity">Próxima</button>':''}</div></section>`);
  bindListSearch(value=>{activitySearch=value;return activities(0);});
  document.querySelectorAll('[data-activity]').forEach(b=>b.onclick=()=>act(b,()=>{historySearch='';return history(0,data.activities.find(a=>a.id===b.dataset.activity));}));
  bindManagement(data.activities,'activity',()=>activities(offset));
  if($('tlPreviousActivity'))$('tlPreviousActivity').onclick=e=>act(e.target,()=>activities(Math.max(0,offset-20)));
  if($('tlNextActivity'))$('tlNextActivity').onclick=e=>act(e.target,()=>activities(offset+20));
 }
 function assertStudentScope(){
  if(studentMode&&(correctionScope!=='complete'||(essay?.correction_scope&&essay.correction_scope!=='complete')))throw Error('A correção por etapas está disponível apenas para o professor. Envie uma redação completa em Corrigir.');
 }
 async function create(){
  assertStudentScope();
  window.WritingStagesUI?.assertReady(correctionScope,available.partial_correction===true);
  if(essay)return;
  const id=draftId;
  if(file){
   const form=new FormData();form.set('action','live_upload');form.set('essay_id',id);form.set('file',file);form.set('correction_scope',correctionScope);form.set('student_label',name);form.set('school_label',school);
   const response=await request(BASE+'/functions/v1/teacher-organization-api',{method:'POST',headers:authHeaders(S.session.access_token,false),body:form});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível enviar.');essay=data.essay;
  }else essay=(await api({action:'live_create',essay_id:id,input_text:text,correction_scope:correctionScope,writing_context:useWritingContext?Object.fromEntries(Object.entries(writingContext).filter(([k])=>k!==correctionScope)):{},student_label:name,school_label:school})).essay;
 }
 async function continueAfterInput(){
  if(activity){const linked=await api({action:'live_activity',essay_id:essay.id,activity_id:activity.id,confirmed:true});essay=linked.essay;theme=activity.theme;origin=activity.theme_origin;confirmed=true;}
  step=2;render();
 }
 async function readTranscription(){
  status('Lendo o trecho com IA… Aguarde.');
  transcription=await api({action:'live_transcribe',essay_id:essay.id});
  if(!current())return;
  if(transcription.confirmed){text=transcription.text;essay.input_text=text;await continueAfterInput();return;}
  step='transcription';render();
 }
 function updateTextScope(){
  const label=correctionScope==='complete'?'Redação completa':window.WritingStages.stages[correctionScope].label;
  if($('tlTextLabel'))$('tlTextLabel').textContent=label;
  for(const id of ['tlCamera','tlChoose'])if($(id))$(id).disabled=correctionScope!=='complete'&&available.partial_input!=='text-or-file';
  if($('tlText'))$('tlText').maxLength=correctionScope==='complete'?20000:16000;
  $('tlInputHint').textContent=correctionScope==='complete'?'Fotografe, envie um arquivo ou cole a redação completa.':'Fotografe, envie um arquivo ou cole apenas o trecho de '+label.toLocaleLowerCase('pt-BR')+' que deseja corrigir.';
 }
 function render(){
  if(!available.enabled){shell(`<div class="tl-card"><h2>${studentMode?'Correção indisponível':'Estamos preparando o Ao Vivo'}</h2><p>Esta ferramenta ainda não está disponível para novas correções.</p></div>`);return;}
  if(step==='transcription'){
   shell(`<section class="tl-card"><h2>Confira o trecho lido</h2><p>Confirme que este é o trecho de ${esc(window.WritingStages.stages[correctionScope].label.toLocaleLowerCase('pt-BR'))} que deseja corrigir. Ajuste palavras ilegíveis antes de continuar.</p><p>${esc(transcription.note)}</p><label class="field">Texto extraído<textarea id="tlTranscribedText" maxlength="16000">${esc(transcription.text)}</textarea></label><label class="tl-confirm"><input type="checkbox" id="tlTranscriptionConfirmed"> Conferi o trecho e a leitura.</label><div class="tl-actions"><button class="btn primary" id="tlConfirmText">Confirmar e continuar</button><button class="btn" id="tlReplace">Trocar foto, arquivo ou texto</button></div></section>`);
   $('tlReplace').onclick=replaceInput;
   $('tlTranscribedText').oninput=()=>{$('tlTranscriptionConfirmed').checked=false;};
   $('tlConfirmText').onclick=e=>act(e.target,async()=>{if(!$('tlTranscriptionConfirmed').checked)throw Error('Confira o trecho antes de continuar.');text=$('tlTranscribedText').value;essay=(await api({action:'live_confirm_text',essay_id:essay.id,input_text:text,confirmed:true})).essay;await continueAfterInput();});
  }else if(step===1){
   shell(steps()+`<section class="tl-card"><h2>${studentMode?'Como vamos começar?':'Uma redação, um próximo passo mais claro.'}</h2>${studentMode?'':'<p>Receba a análise por competência, revise com seu olhar de professor e compartilhe as orientações com o aluno.</p>'}${!studentMode?(activity?`<div class="tl-note"><b>${esc(activity.name||'Atividade sem nome')}</b><p>${esc(activity.theme)}</p><span>O tema será reaproveitado. Nova redação, nova identificação.</span></div>`:`<label><input type="checkbox" id="tlActivityEnabled" ${activityEnabled?'checked':''}> Usar o mesmo tema em várias redações</label>${activityEnabled?`<label class="field">Nome da atividade (opcional)<input id="tlActivityName" maxlength="160" value="${esc(activityName)}"></label>`:''}`):''}${!studentMode&&available.writing_editor?`<div class="tl-actions"><button class="btn" id="tlWritingEditor">Construir redação por etapas</button>${available.writing_guided?.is_enabled?`<button class="btn" id="tlWritingClassroom">${studentMode?'Atividades da turma':'Construção em aula'}</button>`:''}</div>`:''}<div id="tlWritingScope"></div>${Object.keys(writingContext).length?`<label><input type="checkbox" id="tlUseWritingContext" ${useWritingContext?'checked':''}> Considerar as outras etapas já escritas como contexto</label>`:''}<p id="tlInputHint"></p><div class="tl-actions"><button id="tlCamera" class="btn primary">Fotografar</button><button id="tlChoose" class="btn">Enviar arquivo</button><button id="tlPaste" class="btn">Colar texto</button></div><input id="tlPhoto" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden><input id="tlFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.docx" hidden><p class="tl-file">${file?esc(file.name):'JPG, PNG, WEBP, PDF ou DOCX · até 15 MB'}</p>${file?'':`<label class="field"><span id="tlTextLabel">Redação completa</span><textarea id="tlText" aria-describedby="tlInputHint" maxlength="20000">${esc(text)}</textarea></label>`}<label class="field">${studentMode?'Seu nome (opcional)':'Nome do aluno (opcional)'}<input id="tlName" maxlength="160" value="${esc(name)}"></label><label class="field">Escola (opcional)<input id="tlSchool" maxlength="160" value="${esc(school)}"></label><div id="tlSchoolSuggestions" aria-live="polite"></div><p>Esses campos não criam cadastros.</p><button id="tlNext" class="btn primary">Continuar →</button></section>`);
   if(!studentMode)window.WritingStagesUI?.mount($('tlWritingScope'),{value:correctionScope,enabled:available.partial_correction===true,onChange:value=>{saveFields();if(essay&&correctionScope!==value){essay=null;draftId=crypto.randomUUID();requests.theme=null;requests.correction=null;}correctionScope=value;updateTextScope();}});
   updateTextScope();
   if($('tlUseWritingContext'))$('tlUseWritingContext').onchange=()=>{useWritingContext=$('tlUseWritingContext').checked;};
   if($('tlWritingEditor'))$('tlWritingEditor').onclick=()=>{if(busy)return;window.renderWritingEditor(navigation);};
   if($('tlWritingClassroom'))$('tlWritingClassroom').onclick=()=>{if(busy)return;window.renderWritingClassroom(navigation);};
   if($('tlActivityEnabled'))$('tlActivityEnabled').onchange=e=>{saveFields();activityEnabled=e.target.checked;render();};
   $('tlSchool').oninput=()=>{const host=$('tlSchoolSuggestions');host.replaceChildren();const matches=window.SchoolNames?.match($('tlSchool').value,schoolCatalog);for(const name of matches?.suggestions||[]){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent='Usar '+name+'?';b.onclick=()=>{$('tlSchool').value=name;school=name;host.replaceChildren();};host.append(b);}};
   $('tlSchool').onblur=()=>{const match=window.SchoolNames?.match($('tlSchool').value,schoolCatalog);if(match?.exact)$('tlSchool').value=match.exact;};
   $('tlCamera').onclick=()=>$('tlPhoto').click();$('tlChoose').onclick=()=>$('tlFile').click();$('tlPaste').onclick=()=>{saveFields();file=null;render();};
   for(const id of ['tlPhoto','tlFile'])$(id).onchange=e=>{saveFields();const picked=e.target.files[0];if(!picked)return;if(picked.size>15728640){status('Use um arquivo de até 15 MB.');return;}file=picked;render();};
   $('tlNext').onclick=e=>act(e.target,async()=>{saveFields();if(!file&&text.trim().length<80)throw Error('Envie um arquivo ou cole pelo menos 80 caracteres.');await create();if(correctionScope!=='complete'&&!essay.input_text){await readTranscription();return;}await continueAfterInput();});
  }else if(step===2){
   shell(steps()+`<section class="tl-card"><h2>Qual é o tema?</h2>${activity?`<p class="tl-note">Tema confirmado da atividade ${esc(activity.name||'sem nome')}. Para usar outro tema, comece uma nova redação fora desta atividade.</p>`:''}<div class="tl-actions" ${activity?'hidden':''}><button class="btn" id="tlKnown">Tenho o tema</button><button class="btn" id="tlInfer">Verificar tema com inteligência</button></div><p class="tl-note">${origin==='inferred'?'O tema foi sugerido com base no texto. Confira o recorte: a sugestão não comprova qual era a proposta original.':'Informe o tema ou enunciado original que orientará a correção.'}</p><label class="field">Tema e recorte<textarea id="tlTheme" maxlength="${correctionScope==='complete'?4000:1000}" ${activity?'readonly':''}>${esc(theme)}</textarea></label><label class="tl-confirm"><input type="checkbox" id="tlConfirmed" ${confirmed?'checked':''}> Conferi o tema e o recorte.</label><div class="tl-actions"><button class="btn" id="tlReplace">Trocar foto, arquivo ou texto</button><button class="btn primary" id="tlNext">Revisar e continuar →</button></div></section>`);
   $('tlReplace').onclick=replaceInput;
   $('tlTheme').oninput=()=>{confirmed=false;$('tlConfirmed').checked=false;};$('tlConfirmed').onchange=e=>confirmed=e.target.checked;
   $('tlKnown').onclick=()=>{saveFields();origin='provided';confirmed=false;render();};
   $('tlInfer').onclick=e=>act(e.target,async()=>{saveFields();await startAnalysis(true);});
   $('tlNext').onclick=e=>act(e.target,async()=>{saveFields();if(!confirmed||theme.trim().length<10)throw Error('Informe o tema e confirme o recorte.');if(!studentMode&&activityEnabled){const linked=await api({action:'live_activity',essay_id:essay.id,activity_id:activity?.id||activityDraftId,name:activityName,theme,theme_origin:origin,confirmed:true});essay=linked.essay;activity=linked.activity;theme=activity.theme;origin=activity.theme_origin;}else essay=(await api({action:'live_theme',essay_id:essay.id,theme,theme_origin:origin,student_label:name,school_label:school,confirmed:true})).essay;step=3;render();});
  }else{
   shell(steps()+`<section class="tl-card"><h2>Pronto para uma boa devolutiva</h2>${[...(activity?[['Atividade',activity.name||'Sem nome']]:[]),['Aluno',name||'Sem identificação'],['Escola',school||'Não informada'],[correctionScope==='complete'?'Redação completa':window.WritingStages.stages[correctionScope].label,file?.name||essay?.file_name||'Texto salvo'],['Tema',theme]].map(([label,value])=>`<div class="tl-summary"><span>${label}</span><b>${esc(value)}</b></div>`).join('')}<p class="tl-note">Esta correção usa <b>1 crédito</b>. Se a análise falhar, o crédito será devolvido. ${studentMode?'Você receberá uma estimativa da IA, sem revisão de professor.':'Você poderá revisar antes de compartilhar.'}</p><label class="tl-confirm"><input type="checkbox" id="tlCredit"> Confirmo o uso de 1 crédito.</label><div class="tl-actions"><button class="btn" id="tlReplace">Trocar foto, arquivo ou texto</button><button class="btn" id="tlBack">← Ajustar tema</button><button class="btn primary" id="tlStart">Iniciar correção</button></div></section>`);
   $('tlReplace').onclick=replaceInput;
   $('tlBack').onclick=()=>{step=2;render();};$('tlStart').onclick=e=>act(e.target,async()=>{if(!$('tlCredit').checked)throw Error('Confirme o uso de 1 crédito.');await startAnalysis(false);});
  }
 }
 function processingSteps(phase,themeOnly=false){
  return `<ol class="tl-processing-steps" aria-label="Andamento da análise">${['Recebida','Analisando',themeOnly?'Tema identificado':'Devolutiva pronta'].map((label,i)=>`<li class="${i<phase?'is-done':i===phase?'is-current':''}" ${i===phase?'aria-current="step"':''}><span aria-hidden="true">${i<phase?'✓':i+1}</span><b>${label}</b></li>`).join('')}</ol>`;
 }
 function loading(themeOnly){
  const received=job?.status==='processing';
  if(analysisStartedAt===null)analysisStartedAt=Date.now();
  shell(`<section class="tl-card tl-processing" id="tlProcessing" aria-busy="true"><div class="tl-loading-ring" aria-hidden="true"></div><h2>${themeOnly?'Verificando o tema':received?'Analisando sua redação':'Preparando a análise'}…</h2><p>${themeOnly?'A Inteligência VERSÃO está lendo sua redação e identificando o tema.':'A Inteligência VERSÃO está preparando sua devolutiva.'}</p>${processingSteps(received?1:0,themeOnly)}<p class="tl-elapsed">Tempo decorrido <strong id="tlElapsed" role="timer" aria-live="off">00:00</strong></p><p id="tlLongWait" class="tl-muted" hidden>A análise está levando mais tempo. Continuamos consultando o resultado; não é necessário enviar novamente.</p><p class="tl-note">O resultado aparecerá automaticamente. Você também pode retomar pelo histórico.</p></section>`);
  const tick=()=>{if(!current()||!$('tlElapsed')){clearInterval(elapsedTimer);elapsedTimer=null;return;}const seconds=Math.max(0,Math.floor((Date.now()-analysisStartedAt)/1000));$('tlElapsed').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');$('tlLongWait').hidden=seconds<240;};
  tick();elapsedTimer=setInterval(tick,1000);
 }
 async function startAnalysis(themeOnly){
  assertStudentScope();
  window.WritingStagesUI?.assertReady(correctionScope,available.partial_correction===true);
  const purpose=themeOnly?'theme':'correction';analysisStartedAt=Date.now();job=null;loading(themeOnly);
  try{job=(await api({action:'live_start',essay_id:essay.id,purpose,request_id:(requests[purpose]||=crypto.randomUUID()),...(!themeOnly?{credit_confirmed:true}:{})})).job;await watch(themeOnly);}
  catch(error){render();throw error;}
 }
 async function watch(themeOnly){
  if(!current())return;
  if(job.status==='processing'){
   const serverStarted=Date.parse(job.created_at||'');if(Number.isFinite(serverStarted))analysisStartedAt=Math.min(analysisStartedAt??serverStarted,serverStarted);
   loading(themeOnly);
   pollTimer=setTimeout(async()=>{
    if(!current()||!$('tlProcessing'))return;
    try{const data=await api({action:'live_get',essay_id:essay.id});const updated=data.jobs.find(j=>j.id===job.id);if(!updated)throw Error('Não foi possível consultar o andamento.');job=updated;await watch(themeOnly);}
    catch(error){if(current()&&$('tlProcessing')){await watch(themeOnly);status('Reconectando à análise. O andamento será atualizado automaticamente.');}}
   },4000);
   return;
  }
  if(job.status==='failed'){shell(`<section class="tl-card"><h2>A análise não foi concluída</h2><p>${esc(job.error_message)}</p><button class="btn primary" id="tlReplace">Trocar foto, arquivo ou texto</button><button class="btn" id="tlRetry">Tentar novamente com o mesmo conteúdo</button></section>`);$('tlReplace').onclick=replaceInput;$('tlRetry').onclick=()=>{requests[themeOnly?'theme':'correction']=null;step=themeOnly?2:3;render();};return;}
  if(themeOnly){theme=job.result.theme;origin='inferred';confirmed=false;step=2;render();return;}
  result();
 }
 function partialResult(){
  const value=job.review||job.result,editing=!studentMode&&(!job.review||reviewEditing);
  shell(window.WritingStagesUI.feedbackHtml(value)+`<section class="tl-card"><p>${studentMode?'Análise por IA · sem revisão de professor.':job.review?'Devolutiva revisada pelo professor.':'Confira a devolutiva antes de compartilhar.'}</p>${editing?`${window.WritingStagesUI.reviewEditorHtml(value)}<label class="tl-confirm"><input type="checkbox" id="tlPartialConfirmed"> Conferi a devolutiva.</label><button class="btn primary" id="tlPartialSave">Salvar revisão</button>${job.review?'<button class="btn" id="tlPartialCancel">Cancelar</button>':''}`:`<button class="btn primary" id="tlShare">Compartilhar devolutiva</button>${studentMode?'':'<button class="btn" id="tlPartialEdit">Editar revisão</button>'}`}${studentMode?'':'<button class="btn" id="tlPartialRedo">Refazer correção · 1 crédito</button>'}<div id="tlSharePanel"></div></section>`);
  if($('tlPartialSave'))$('tlPartialSave').onclick=e=>act(e.target,async()=>{
   if(!$('tlPartialConfirmed').checked)throw Error('Confirme a revisão antes de salvar.');
   const review=window.WritingStagesUI.readReview(document,value);
   job=(await api({action:'live_review',essay_id:essay.id,job_id:job.id,review_confirmed:true,partial_review:review})).job;reviewEditing=false;result();
  });
  if($('tlPartialEdit'))$('tlPartialEdit').onclick=()=>{reviewEditing=true;result();};
  if($('tlPartialCancel'))$('tlPartialCancel').onclick=()=>{reviewEditing=false;result();};
  if($('tlShare'))$('tlShare').onclick=e=>act(e.target,share);
  if($('tlPartialRedo'))$('tlPartialRedo').onclick=()=>{requests.correction=null;step=3;render();};
 }
 function result(){
  if(window.WritingStagesUI?.isPartial(job?.result)){partialResult();return;}
  if(studentMode){studentResult();return;}
  const value=job.review||job.result,editing=!job.review||reviewEditing;
  const feedback=value.next_step||value.overall_feedback||'';
  const initialReviews=window.liveDeviationReviews(job),initialNote=job.review?.review_audit?.note||'';
  shell(`${processingSteps(3)}<section class="tl-card tl-review-result"><header class="tl-result-header"><span class="student-live-eyebrow">${studentMode?'Correção · Devolutiva':'Ao Vivo · Devolutiva'}</span><h2>${editing?'Uma devolutiva para orientar a próxima versão':'Sua devolutiva está pronta'}</h2><p>${editing?'Confira as notas e as orientações antes de salvar sua revisão.':'Consulte ou compartilhe com o aluno.'}</p>${!editing?'<p class="tl-saved" role="status">Sua revisão foi salva. A devolutiva está pronta para compartilhar.</p>':''}<div class="tl-total-score"><strong>${Number(value.total_score)}</strong><span>/ 1000 · ${job.review?'Nota revisada':'Estimativa por IA'}</span></div><p>${esc(job.theme)}</p></header>${job.theme_origin==='inferred'?'<p class="tl-note">C2 por recorte inferido e confirmado, sem aferição da proposta original.</p>':''}
  <section class="tl-result-section"><h3>Notas por competência</h3>${['C1','C2','C3','C4','C5'].map(c=>editing?`<label class="field">${c}<input class="tl-score" id="tl${c}" type="number" min="0" max="200" step="40" value="${Number(value.competencies[c].score)}"><span>${esc(value.competencies[c].diagnostic)}</span></label>`:`<article class="tl-competency-card"><h3>${c}<strong>${Number(value.competencies[c].score)} / 200</strong></h3><p>${esc(value.competencies[c].diagnostic)}</p></article>`).join('')}</section>
  <section class="tl-result-section"><h3>Devolutiva</h3><p><b>Ponto forte</b><br>${esc(value.main_strength)}</p><p><b>Prioridade de melhoria</b><br>${esc(value.improvement_priority)}</p>${editing?`<label class="field">Próximo passo<textarea id="tlFeedback" maxlength="4000">${esc(feedback)}</textarea></label>`:`<p><b>Próximo passo</b><br>${esc(feedback)}</p>`}</section>
  <details class="tl-result-section"><summary>Texto da redação e evidências</summary><p class="tl-result">${esc(value.transcription)}</p>${window.liveEvidenceHtml(value)}</details>
  ${window.enemAnalysisHeader?.(job)||''}
  ${editing?window.liveDeviationEditorHtml(job)+window.enemReviewFields(job.result,job.review?.review_audit):''}
  ${editing?`<label class="tl-confirm"><input type="checkbox" id="tlReview"> Conferi as notas e evidências da devolutiva.</label><div class="tl-result-actions"><button class="btn primary" id="tlSave" disabled>${job.review?'Salvar alterações':'Salvar revisão'}</button>${job.review?'<button class="btn" id="tlCancelReview">Cancelar edição</button>':''}</div>`:`<div class="tl-result-actions"><button class="btn primary" id="tlShare">Compartilhar devolutiva</button>${activity&&!activity.deleted_at?'<button class="btn" id="tlNextEssay">Corrigir próxima redação</button>':''}</div><details class="tl-secondary-actions"><summary>Outras opções</summary><div class="tl-result-actions"><button class="btn" id="tlEditReview">Editar revisão</button><button class="btn" id="tlManageShares">Gerenciar links compartilhados</button><button class="btn" id="tlRedo">Refazer correção · 1 crédito</button></div></details>`}<div id="tlSharePanel"></div></section>`);
  if($('tlNextEssay'))$('tlNextEssay').onclick=()=>nextEssay(activity);
  if($('tlEditReview'))$('tlEditReview').onclick=()=>{reviewEditing=true;result();};
  if($('tlCancelReview'))$('tlCancelReview').onclick=()=>{window.enemReviewClear?.(job);reviewEditing=false;result();};
  if(editing){
   window.enemReviewBind?.($('view'),job);
   const readReviews=()=>initialReviews.map(d=>({...d,decision:document.querySelector(`[data-live-discard="${d.index}"]`).checked?'discarded':'confirmed',correction:document.querySelector(`[data-live-correction="${d.index}"]`).value.trim(),rule:document.querySelector(`[data-live-rule="${d.index}"]`).value.trim()}));
   const changed=()=>JSON.stringify(readReviews())!==JSON.stringify(initialReviews)||$('tlReviewNote').value!==initialNote||!job.review||['C1','C2','C3','C4','C5'].some(c=>Number($('tl'+c).value)!==Number(value.competencies[c].score))||$('tlFeedback').value!==feedback||Array.from(document.querySelectorAll('[data-enem-review] textarea')).some(x=>x.value!==x.defaultValue);
   const updateSave=()=>{$('tlSave').disabled=!changed()||!$('tlReview').checked;};
   $('tlReview').onchange=updateSave;
   for(const input of document.querySelectorAll('.tl-score,#tlFeedback,#tlDeviationEditor textarea,#tlDeviationEditor input,[data-enem-review] textarea'))input.oninput=()=>{$('tlReview').checked=false;updateSave();};
   $('tlSave').onclick=e=>act(e.target,async()=>{if(!changed())return;if(!$('tlReview').checked)throw Error('Confirme a revisão.');const deviation_reviews=readReviews();const incomplete=deviation_reviews.find(d=>d.decision==='confirmed'&&(!d.correction||!d.rule));if(incomplete){document.querySelector(`[data-live-${incomplete.correction?'rule':'correction'}="${incomplete.index}"]`).focus();throw Error('Complete a sugestão e a regra dos apontamentos mantidos.');}const scores=Object.fromEntries(['C1','C2','C3','C4','C5'].map(c=>[c,Number($('tl'+c).value)]));const reviewBody={scores,overall_feedback:$('tlFeedback').value,deviation_reviews,review_note:$('tlReviewNote').value,review_confirmed:true,...window.enemReviewBody($('view'),job.result,scores)};window.EnemReview.reviewedEvidence(job.result,reviewBody);job=(await api({action:'live_review',essay_id:essay.id,job_id:job.id,...reviewBody})).job;window.enemReviewClear?.(job);reviewEditing=false;result();status('Revisão salva.');});
  }
  if($('tlShare'))$('tlShare').onclick=e=>act(e.target,share);
  if($('tlRedo'))$('tlRedo').onclick=()=>{requests.correction=null;step=3;render();};
  if($('tlManageShares'))$('tlManageShares').onclick=e=>act(e.target,async()=>{const data=await api({action:'live_shares',essay_id:essay.id,job_id:job.id});if(!current())return;const host=$('tlSharePanel');host.replaceChildren();for(const item of data.shares){const row=document.createElement('p');row.textContent='Link criado em '+fmtDate(item.created_at)+' · '+(item.revoked_at?'Revogado':'Válido até '+fmtDate(item.expires_at));if(!item.revoked_at){const b=document.createElement('button');b.className='btn';b.textContent='Revogar';b.onclick=()=>act(b,async()=>{await api({action:'live_revoke',essay_id:essay.id,job_id:job.id,share_id:item.id});row.textContent='Link revogado.';});row.append(b);}host.append(row);}if(!data.shares.length)host.textContent='Nenhum link criado.';});
 }
 function studentResult(){
  const value=job.result;
  shell(`${processingSteps(3)}<section class="tl-card"><h2>Sua devolutiva</h2><p class="tl-note">Estimativa por IA · sem revisão de professor. Esta não é uma nota oficial do ENEM.</p><h3>${esc(job.theme)}</h3>${job.theme_origin==='inferred'?'<p class="tl-note">C2 por recorte inferido e confirmado, sem aferição da proposta original.</p>':''}<div class="tl-total-score"><strong>${Number(value.total_score)}</strong><span>/ 1000 · Estimativa por IA</span></div>${window.liveCompetenciesHtml(value)}<h3>Ponto forte</h3><p>${esc(value.main_strength)}</p><h3>Prioridade de melhoria</h3><p>${esc(value.improvement_priority)}</p><h3>Próximo passo</h3><p>${esc(value.next_step)}</p>${value.needs_manual_review?'<p class="tl-note">A análise encontrou pontos que precisam de conferência. Leia as observações antes de usar as notas como referência.</p>':''}<details><summary>Texto e observações da análise</summary><p class="tl-result">${esc(value.transcription)}</p>${window.liveEvidenceHtml(value)}</details><div class="tl-actions"><button class="btn primary" id="tlShare">Compartilhar devolutiva</button><button class="btn" id="tlStudentLinks">Gerenciar links</button><button class="btn" id="tlRedo">Refazer correção · 1 crédito</button></div><div id="tlSharePanel"></div></section>`);
  $('tlShare').onclick=e=>act(e.target,share);
  if($('tlRedo'))$('tlRedo').onclick=()=>{requests.correction=null;step=3;render();};
  $('tlStudentLinks').onclick=e=>act(e.target,async()=>{const data=await api({action:'live_shares',essay_id:essay.id,job_id:job.id});if(!current())return;const host=$('tlSharePanel');host.replaceChildren();for(const item of data.shares){const p=document.createElement('p');p.textContent='Criado em '+fmtDate(item.created_at)+' · '+(item.revoked_at?'Revogado':'Expira em '+fmtDate(item.expires_at));if(!item.revoked_at){const button=document.createElement('button');button.className='btn';button.textContent='Revogar';button.onclick=()=>act(button,async()=>{await api({action:'live_revoke',essay_id:essay.id,job_id:job.id,share_id:item.id});p.textContent='Link revogado.';});p.append(button);}host.append(p);}if(!data.shares.length)host.textContent='Nenhum link criado.';});
 }
 async function share(){
  const data=await api({action:'live_share',essay_id:essay.id,job_id:job.id});if(!current())return;
  const link=location.origin+'/devolutiva.html#'+data.token,message='Confira sua devolutiva no VERSÃO: '+link;
  $('tlSharePanel').innerHTML=`<p class="tl-note">Qualquer pessoa com este link pode ler a devolutiva. Válido até ${esc(fmtDate(data.expires_at))}.</p><label class="field">Link<input id="tlLink" readonly value="${esc(link)}"></label><div class="tl-actions"><a class="btn" href="https://wa.me/?text=${encodeURIComponent(message)}" target="_blank" rel="noopener noreferrer">WhatsApp</a><button class="btn" id="tlCopy">Copiar link</button>${navigator.share?'<button class="btn" id="tlNative">Outras opções</button>':''}<button class="btn" id="tlRevoke">Revogar este link</button></div>`;
  $('tlCopy').onclick=async()=>{try{await navigator.clipboard.writeText(link);status('Link copiado.');}catch{$('tlLink').select();status('Selecione e copie o link.');}};
  if($('tlNative'))$('tlNative').onclick=()=>navigator.share({title:'Devolutiva VERSÃO',text:'Confira sua devolutiva.',url:link}).catch(()=>{});
  $('tlRevoke').onclick=e=>act(e.target,async()=>{await api({action:'live_revoke',essay_id:essay.id,job_id:job.id,share_id:data.id});$('tlSharePanel').textContent='Link revogado.';});
 }
 async function history(offset=0,group=null){
  const data=await api({action:'live_history',offset,search:historySearch,include_summary:true,...(group?{activity_id:group.id}:{})});if(!current())return;activeMenu=group?'tlActivities':'tlHistory';detailBack=null;detailVersions=null;
  shell(`<section class="tl-card tl-list"><div class="tl-list-heading"><h2>${group?esc(group.name||'Atividade sem nome'):'Histórico'}</h2>${group?`<p>${esc(group.theme)}</p><div class="tl-actions"><button class="btn ghost" id="tlActivitiesBack">Voltar às atividades</button><button class="btn primary" id="tlGroupNext">Nova redação nesta atividade</button></div>`:'<p>Consulte suas redações e continue de onde parou.</p>'}</div>${listSearchHtml(historySearch,studentMode?'Buscar tema':'Buscar aluno, escola ou tema')}<div id="tlManagePanel"></div>${data.essays.length?`<table class="tl-table"><thead><tr><th scope="col">Aluno e tema</th><th scope="col">Data</th><th scope="col">Ações</th></tr></thead><tbody>${data.essays.map(e=>`<tr><td><strong class="tl-item-name">${esc(e.student_label||'Sem identificação')}</strong>${e.school_label?`<span class="tl-item-school">${esc(e.school_label)}</span>`:''}<p class="tl-item-theme">${esc(e.theme||'Tema ainda não definido')}</p>${summaryHtml(e)}</td><td class="tl-date" data-label="Enviada em">${esc(fmtDate(e.created_at))}</td><td><div class="tl-row-actions"><button class="btn" data-essay="${esc(e.id)}">${summaryAction(e)}</button>${managementButtons(e,'essay')}</div></td></tr>`).join('')}</tbody></table>`:`<p class="tl-empty">${historySearch?'Nenhuma redação encontrada para esta busca.':'Nenhuma redação nesta página.'}</p>`}<div class="tl-actions">${offset?'<button class="btn" id="tlPreviousPage">Anterior</button>':''}${(data.has_more??data.essays.length===20)?'<button class="btn" id="tlNextPage">Próxima</button>':''}</div></section>`);
  bindListSearch(value=>{historySearch=value;return history(0,group);});
  if($('tlActivitiesBack'))$('tlActivitiesBack').onclick=e=>act(e.target,()=>activities(activityOffset));
  bindManagement(data.essays,'essay',()=>history(offset,group));
  if($('tlGroupNext'))$('tlGroupNext').onclick=()=>nextEssay(group);
  if($('tlPreviousPage'))$('tlPreviousPage').onclick=e=>act(e.target,()=>history(Math.max(0,offset-20),group));
  if($('tlNextPage'))$('tlNextPage').onclick=e=>act(e.target,()=>history(offset+20,group));
  document.querySelectorAll('[data-essay]').forEach(b=>b.onclick=()=>act(b,async()=>{
   const data=await api({action:'live_get',essay_id:b.dataset.essay});essay=data.essay;correctionScope=essay.correction_scope||'complete';reviewEditing=false;file=null;requests.theme=null;requests.correction=null;name=essay.student_label;school=essay.school_label;theme=essay.theme;origin=essay.theme_origin;confirmed=!!essay.theme_confirmed_at;activity=null;activityEnabled=false;activityName='';if(!studentMode&&essay.activity_id){const rows=await api({action:'live_activities',activity_id:essay.activity_id});activity=rows.activities[0]||null;activityEnabled=!!activity;activityName=activity?.name||'';}text=essay.input_text||'';
   if(studentMode&&correctionScope!=='complete'&&!data.jobs.some(j=>j.purpose==='correction'&&j.status==='completed')){shell('<section class="tl-card"><p>A correção por etapas está disponível apenas para o professor. Envie sua redação completa em Corrigir.</p><button class="btn" id="tlCompleteNew">Nova correção</button></section>');$('tlCompleteNew').onclick=()=>navigate('student-live');return;}
   if(!studentMode&&correctionScope!=='complete'&&!essay.input_text){await readTranscription();return;}
   detailBack=()=>history(offset,group);
   const versions=()=>{detailVersions=null;
   shell(`<section class="tl-card tl-list"><div class="tl-list-heading"><h2>Versões desta redação</h2><p>${esc(essay.student_label||'Sem identificação')}</p></div><div class="tl-version-list">${data.jobs.map(j=>`<article class="tl-version"><div><strong>${j.purpose==='theme'?'Verificação de tema':j.correction_scope&&j.correction_scope!=='complete'?esc(window.WritingStages?.stages[j.correction_scope]?.label||'Correção por etapa'):'Correção ENEM'}</strong><p class="tl-muted">${esc(fmtDate(j.created_at))}</p><span class="tl-badge">${esc(({processing:'Em análise',completed:j.review?'Revisada':'Concluída',failed:'Não concluída'})[j.status]||j.status)}</span></div><button class="btn" data-job="${esc(j.id)}">Ver ${j.purpose==='theme'?'tema':'correção'}</button></article>`).join('')}</div></section>`);
   document.querySelectorAll('[data-job]').forEach(button=>button.onclick=()=>{job=data.jobs.find(j=>j.id===button.dataset.job);detailVersions=versions;analysisStartedAt=null;watch(job.purpose==='theme').catch(error=>status(error.message));});
   };
   detailVersions=data.jobs.length?versions:null;
   job=data.jobs.find(j=>j.purpose==='correction');
   if(job){analysisStartedAt=null;await watch(false);}else{step=2;render();}
  }));
 }

 if(available.enabled&&navigation?.route==='teacher-live-activities')await activities();
 else if(available.enabled&&['teacher-live-history','student-live-history'].includes(navigation?.route))await history();
 else render();
};

window.renderStudentLive=window.renderTeacherLive;
