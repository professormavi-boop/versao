'use strict';
window.teacherLiveHomeCard=()=>`<section class="tl-home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h4l2-3h4l2 3h4v15H4z"/><circle cx="12" cy="13" r="4"/></svg><h2>Ao Vivo</h2><p>Uma redação, uma boa devolutiva. Sem cadastrar escola ou turma.</p><button class="btn primary" data-home-live>Começar uma correção</button></section>`;
window.renderTeacherLive=async function(navigation){
 const studentMode=S.profile.role==='student';
 if(!['teacher','student'].includes(S.profile.role))throw Error('Esta área não está disponível para o seu perfil.');
 const api=body=>edge('teacher-organization-api',body);
 const available=await api({action:'live_status'});if(!navigationCurrent(navigation))return;
 let step=1,essay=null,file=null,text='',name='',school='',theme='',origin='provided',confirmed=false,job=null,busy=false,pollTimer=null;
 let draftId=crypto.randomUUID(),activity=null,activityEnabled=false,activityName='',activityDraftId=crypto.randomUUID();
 let reviewEditing=false;
 const requests={theme:null,correction:null};
 const schoolCatalog=[];
 if(available.enabled){const sources=await Promise.allSettled([studentMode?Promise.resolve({organizations:[]}):api({action:'organizations'}),api({action:'live_history'})]);for(const item of sources){if(item.status==='fulfilled'){schoolCatalog.push(...(item.value.organizations||[]).map(x=>x.name),...(item.value.essays||[]).map(x=>x.school_label));}}}
 if(!navigationCurrent(navigation))return;
 const current=()=>navigationCurrent(navigation);
 const status=message=>{if(current()&&$('tlStatus'))$('tlStatus').textContent=message;};
 async function act(button,fn){if(busy)return;busy=true;if(button)button.disabled=true;status('Aguarde…');try{await fn();}catch(error){status(error.message||'Não foi possível continuar.');}finally{busy=false;if(button?.isConnected)button.disabled=false;}}
 function shell(content){clearTimeout(pollTimer);if(!current())return;$('view').innerHTML=header('Ao Vivo','Da redação à devolutiva, no seu ritmo.')+`<section class="teacher-live"><div class="tl-actions"><button class="btn ghost" id="tlNew">Nova redação</button><button class="btn ghost" id="tlHistory">Histórico ao vivo</button>${studentMode?'<button class="btn ghost" id="tlCredits">Meus créditos</button>':'<button class="btn ghost" id="tlActivities">Minhas atividades</button>'}</div>${content}<p id="tlStatus" class="tl-status" role="status" aria-live="polite"></p></section>`;$('tlNew').onclick=()=>{if(busy)return;navigate(studentMode?'student-live':'teacher-live');};$('tlHistory').onclick=e=>act(e.target,history);if($('tlCredits'))$('tlCredits').onclick=()=>navigate('student-credits');if($('tlActivities'))$('tlActivities').onclick=e=>act(e.target,()=>activities());}
 const steps=()=>`<div class="tl-steps">${['Redação','Tema','Correção'].map((label,i)=>`<span ${step===i+1?'aria-current="step"':''}>${i+1}. ${label}</span>`).join('')}</div>`;
 function saveFields(){activityName=$('tlActivityName')?.value??activityName;name=$('tlName')?.value??name;school=$('tlSchool')?.value??school;if(window.SchoolNames)school=SchoolNames.match(school,schoolCatalog).label;text=$('tlText')?.value??text;theme=$('tlTheme')?.value??theme;}
 function nextEssay(selected){
  if(studentMode||busy)return;
  activity=selected;activityEnabled=true;activityName=selected.name;activityDraftId=selected.id;
  draftId=crypto.randomUUID();essay=null;file=null;text='';name='';school='';job=null;
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
 async function activities(offset=0){
  const data=await api({action:'live_activities',offset});if(!current())return;
  shell(`<section class="tl-card"><h2>Minhas atividades</h2><p>Um tema confirmado para várias redações. Cada correção mantém sua nota ENEM.</p>${data.activities.map(a=>`<article class="tl-card"><h3>${esc(a.name||'Atividade sem nome')}</h3><p>${esc(a.theme)}</p><p>${esc(fmtDate(a.created_at))}</p><button class="btn" data-activity="${esc(a.id)}">Ver redações</button></article>`).join('')||'<p>Nenhuma atividade criada.</p>'}<div class="tl-actions">${offset?'<button class="btn" id="tlPreviousActivity">Anterior</button>':''}${data.activities.length===20?'<button class="btn" id="tlNextActivity">Próxima</button>':''}</div></section>`);
  document.querySelectorAll('[data-activity]').forEach(b=>b.onclick=()=>act(b,()=>history(0,data.activities.find(a=>a.id===b.dataset.activity))));
  if($('tlPreviousActivity'))$('tlPreviousActivity').onclick=e=>act(e.target,()=>activities(Math.max(0,offset-20)));
  if($('tlNextActivity'))$('tlNextActivity').onclick=e=>act(e.target,()=>activities(offset+20));
 }
 async function create(){
  if(essay)return;
  const id=draftId;
  if(file){
   const form=new FormData();form.set('action','live_upload');form.set('essay_id',id);form.set('file',file);form.set('student_label',name);form.set('school_label',school);
   const response=await request(BASE+'/functions/v1/teacher-organization-api',{method:'POST',headers:authHeaders(S.session.access_token,false),body:form});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Não foi possível enviar.');essay=data.essay;
  }else essay=(await api({action:'live_create',essay_id:id,input_text:text,student_label:name,school_label:school})).essay;
 }
 function render(){
  if(!available.enabled){shell('<div class="tl-card"><h2>Estamos preparando o Ao Vivo</h2><p>Esta ferramenta ainda não está disponível para novas correções.</p></div>');return;}
  if(step===1){
   shell(steps()+`<section class="tl-card"><h2>Como vamos começar?</h2>${!studentMode?(activity?`<div class="tl-note"><b>${esc(activity.name||'Atividade sem nome')}</b><p>${esc(activity.theme)}</p><span>O tema será reaproveitado. Nova redação, nova identificação.</span></div>`:`<label><input type="checkbox" id="tlActivityEnabled" ${activityEnabled?'checked':''}> Usar o mesmo tema em várias redações</label>${activityEnabled?`<label class="field">Nome da atividade (opcional)<input id="tlActivityName" maxlength="160" value="${esc(activityName)}"></label>`:''}`):''}<p>Fotografe, envie um arquivo ou cole o texto.</p><div class="tl-actions"><button id="tlCamera" class="btn primary">Fotografar</button><button id="tlChoose" class="btn">Enviar arquivo</button><button id="tlPaste" class="btn">Colar texto</button></div><input id="tlPhoto" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden><input id="tlFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,.docx" hidden><p class="tl-file">${file?esc(file.name):'JPG, PNG, WEBP, PDF ou DOCX · até 15 MB'}</p>${file?'':`<label class="field">Redação<textarea id="tlText" maxlength="20000">${esc(text)}</textarea></label>`}<label class="field">${studentMode?'Seu nome (opcional)':'Nome do aluno (opcional)'}<input id="tlName" maxlength="160" value="${esc(name)}"></label><label class="field">Escola (opcional)<input id="tlSchool" maxlength="160" value="${esc(school)}"></label><div id="tlSchoolSuggestions" aria-live="polite"></div><p>Esses campos não criam cadastros.</p><button id="tlNext" class="btn primary">Continuar →</button></section>`);
   if($('tlActivityEnabled'))$('tlActivityEnabled').onchange=e=>{saveFields();activityEnabled=e.target.checked;render();};
   $('tlSchool').oninput=()=>{const host=$('tlSchoolSuggestions');host.replaceChildren();const matches=window.SchoolNames?.match($('tlSchool').value,schoolCatalog);for(const name of matches?.suggestions||[]){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent='Usar '+name+'?';b.onclick=()=>{$('tlSchool').value=name;school=name;host.replaceChildren();};host.append(b);}};
   $('tlSchool').onblur=()=>{const match=window.SchoolNames?.match($('tlSchool').value,schoolCatalog);if(match?.exact)$('tlSchool').value=match.exact;};
   $('tlCamera').onclick=()=>$('tlPhoto').click();$('tlChoose').onclick=()=>$('tlFile').click();$('tlPaste').onclick=()=>{saveFields();file=null;render();};
   for(const id of ['tlPhoto','tlFile'])$(id).onchange=e=>{saveFields();const picked=e.target.files[0];if(!picked)return;if(picked.size>15728640){status('Use um arquivo de até 15 MB.');return;}file=picked;render();};
   $('tlNext').onclick=e=>act(e.target,async()=>{saveFields();if(!file&&text.trim().length<80)throw Error('Envie um arquivo ou cole pelo menos 80 caracteres.');await create();if(activity){const linked=await api({action:'live_activity',essay_id:essay.id,activity_id:activity.id,confirmed:true});essay=linked.essay;theme=activity.theme;origin=activity.theme_origin;confirmed=true;}step=2;render();});
  }else if(step===2){
   shell(steps()+`<section class="tl-card"><h2>Qual é o tema?</h2>${activity?`<p class="tl-note">Tema confirmado da atividade ${esc(activity.name||'sem nome')}. Para usar outro tema, comece uma nova redação fora desta atividade.</p>`:''}<div class="tl-actions" ${activity?'hidden':''}><button class="btn" id="tlKnown">Tenho o tema</button><button class="btn" id="tlInfer">Verificar tema com inteligência</button></div><p class="tl-note">${origin==='inferred'?'Sem a proposta original, a C2 considera o recorte confirmado. Isso não comprova ausência de fuga ao tema.':'Informe o tema ou enunciado original que orientará a correção.'}</p><label class="field">Tema e recorte<textarea id="tlTheme" maxlength="4000" ${activity?'readonly':''}>${esc(theme)}</textarea></label><label class="tl-confirm"><input type="checkbox" id="tlConfirmed" ${confirmed?'checked':''}> Conferi o tema e o recorte.</label><div class="tl-actions"><button class="btn" id="tlReplace">Trocar foto, arquivo ou texto</button><button class="btn primary" id="tlNext">Revisar e continuar →</button></div></section>`);
   $('tlReplace').onclick=replaceInput;
   $('tlTheme').oninput=()=>{confirmed=false;$('tlConfirmed').checked=false;};$('tlConfirmed').onchange=e=>confirmed=e.target.checked;
   $('tlKnown').onclick=()=>{saveFields();origin='provided';confirmed=false;render();};
   $('tlInfer').onclick=e=>act(e.target,async()=>{saveFields();await startAnalysis(true);});
   $('tlNext').onclick=e=>act(e.target,async()=>{saveFields();if(!confirmed||theme.trim().length<10)throw Error('Informe o tema e confirme o recorte.');if(!studentMode&&activityEnabled){const linked=await api({action:'live_activity',essay_id:essay.id,activity_id:activity?.id||activityDraftId,name:activityName,theme,theme_origin:origin,confirmed:true});essay=linked.essay;activity=linked.activity;theme=activity.theme;origin=activity.theme_origin;}else essay=(await api({action:'live_theme',essay_id:essay.id,theme,theme_origin:origin,student_label:name,school_label:school,confirmed:true})).essay;step=3;render();});
  }else{
   shell(steps()+`<section class="tl-card"><h2>Pronto para uma boa devolutiva</h2>${[...(activity?[['Atividade',activity.name||'Sem nome']]:[]),['Aluno',name||'Sem identificação'],['Escola',school||'Não informada'],['Redação',file?.name||essay?.file_name||'Texto salvo'],['Tema',theme]].map(([label,value])=>`<div class="tl-summary"><span>${label}</span><b>${esc(value)}</b></div>`).join('')}<p class="tl-note">Esta correção usa <b>1 crédito</b>. Se a análise falhar, o crédito será devolvido. ${studentMode?'Você receberá uma estimativa da IA, sem revisão de professor.':'Você poderá revisar antes de compartilhar.'}</p><label class="tl-confirm"><input type="checkbox" id="tlCredit"> Confirmo o uso de 1 crédito.</label><div class="tl-actions"><button class="btn" id="tlReplace">Trocar foto, arquivo ou texto</button><button class="btn" id="tlBack">← Ajustar tema</button><button class="btn primary" id="tlStart">Iniciar correção</button></div></section>`);
   $('tlReplace').onclick=replaceInput;
   $('tlBack').onclick=()=>{step=2;render();};$('tlStart').onclick=e=>act(e.target,async()=>{if(!$('tlCredit').checked)throw Error('Confirme o uso de 1 crédito.');await startAnalysis(false);});
  }
 }
 function loading(themeOnly){
  shell(`<section class="tl-card cx-process" id="tlProcessing" aria-busy="true" role="status"><div class="tl-loading-ring" aria-hidden="true"></div><h2>${themeOnly?'Verificando o tema':'Analisando sua redação'}…</h2><p>${themeOnly?'A Inteligência VERSÃO está lendo sua redação e identificando o tema.':'A Inteligência VERSÃO está preparando sua devolutiva.'}</p><p class="tl-note">Aguarde. O resultado aparecerá automaticamente. Você também pode retomar pelo histórico.</p></section>`);
 }
 async function startAnalysis(themeOnly){
  const purpose=themeOnly?'theme':'correction';loading(themeOnly);
  try{job=(await api({action:'live_start',essay_id:essay.id,purpose,request_id:(requests[purpose]||=crypto.randomUUID()),...(!themeOnly?{credit_confirmed:true}:{})})).job;await watch(themeOnly);}
  catch(error){render();throw error;}
 }
 async function watch(themeOnly){
  if(!current())return;
  if(job.status==='processing'){
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
 function result(){
  if(studentMode){studentResult();return;}
  const value=job.review||job.result,editing=!job.review||reviewEditing;
  const feedback=value.overall_feedback||value.next_step||'';
  shell(`<section class="tl-card tl-review-result"><header class="tl-result-header"><h2>${editing?'Revise a devolutiva':'Revisão salva'}</h2>${!editing?'<p class="tl-saved" role="status">Sua revisão foi salva. A devolutiva está pronta para compartilhar.</p>':''}<h3>Nota ENEM: ${Number(value.total_score)} / 1000</h3><p>${esc(job.theme)}</p></header>${job.theme_origin==='inferred'?'<p class="tl-note">C2 por recorte inferido e confirmado, sem aferição da proposta original.</p>':''}
  <section class="tl-result-section"><h3>Notas por competência</h3>${['C1','C2','C3','C4','C5'].map(c=>editing?`<label class="field">${c}<input class="tl-score" id="tl${c}" type="number" min="0" max="200" step="40" value="${Number(value.competencies[c].score)}"><span>${esc(value.competencies[c].diagnostic)}</span></label>`:`<details class="tl-competency"><summary>${c}<strong>${Number(value.competencies[c].score)} / 200</strong></summary><p>${esc(value.competencies[c].diagnostic)}</p></details>`).join('')}</section>
  <section class="tl-result-section"><h3>Devolutiva</h3><p><b>Ponto forte</b><br>${esc(value.main_strength)}</p><p><b>Prioridade de melhoria</b><br>${esc(value.improvement_priority)}</p>${editing?`<label class="field">Próximo passo<textarea id="tlFeedback" maxlength="4000">${esc(feedback)}</textarea></label>`:`<p><b>Próximo passo</b><br>${esc(feedback)}</p>`}</section>
  <details class="tl-result-section"><summary>Texto da redação e evidências</summary><p class="tl-result">${esc(value.transcription)}</p><div class="tl-result">${esc(JSON.stringify({desvios:value.c1_deviations,intervencao:value.c5_check,repertorios:value.repertoire_checks,revisao:value.review_requirements},null,2))}</div></details>
  ${editing?`<label class="tl-confirm"><input type="checkbox" id="tlReview"> Conferi as notas e evidências da devolutiva.</label><div class="tl-result-actions"><button class="btn primary" id="tlSave" disabled>${job.review?'Salvar alterações':'Salvar revisão'}</button>${job.review?'<button class="btn" id="tlCancelReview">Cancelar edição</button>':''}</div>`:`<div class="tl-result-actions"><button class="btn primary" id="tlShare">Compartilhar devolutiva</button>${activity?'<button class="btn" id="tlNextEssay">Corrigir próxima redação</button>':''}</div><details class="tl-secondary-actions"><summary>Outras opções</summary><div class="tl-result-actions"><button class="btn" id="tlEditReview">Editar revisão</button><button class="btn" id="tlManageShares">Gerenciar links compartilhados</button><button class="btn" id="tlRedo">Refazer correção · 1 crédito</button></div></details>`}<div id="tlSharePanel"></div></section>`);
  if($('tlNextEssay'))$('tlNextEssay').onclick=()=>nextEssay(activity);
  if($('tlEditReview'))$('tlEditReview').onclick=()=>{reviewEditing=true;result();};
  if($('tlCancelReview'))$('tlCancelReview').onclick=()=>{reviewEditing=false;result();};
  if(editing){
   const changed=()=>!job.review||['C1','C2','C3','C4','C5'].some(c=>Number($('tl'+c).value)!==Number(value.competencies[c].score))||$('tlFeedback').value!==feedback;
   const updateSave=()=>{$('tlSave').disabled=!changed()||!$('tlReview').checked;};
   $('tlReview').onchange=updateSave;
   for(const id of ['tlC1','tlC2','tlC3','tlC4','tlC5','tlFeedback'])$(id).oninput=()=>{$('tlReview').checked=false;updateSave();};
   $('tlSave').onclick=e=>act(e.target,async()=>{if(!changed())return;if(!$('tlReview').checked)throw Error('Confirme a revisão.');const scores=Object.fromEntries(['C1','C2','C3','C4','C5'].map(c=>[c,Number($('tl'+c).value)]));job=(await api({action:'live_review',essay_id:essay.id,job_id:job.id,scores,overall_feedback:$('tlFeedback').value,review_confirmed:true})).job;reviewEditing=false;result();status('Revisão salva.');});
  }
  if($('tlShare'))$('tlShare').onclick=e=>act(e.target,share);
  if($('tlRedo'))$('tlRedo').onclick=()=>{requests.correction=null;step=3;render();};
  if($('tlManageShares'))$('tlManageShares').onclick=e=>act(e.target,async()=>{const data=await api({action:'live_shares',essay_id:essay.id,job_id:job.id});if(!current())return;const host=$('tlSharePanel');host.replaceChildren();for(const item of data.shares){const row=document.createElement('p');row.textContent='Link criado em '+fmtDate(item.created_at)+' · '+(item.revoked_at?'Revogado':'Válido até '+fmtDate(item.expires_at));if(!item.revoked_at){const b=document.createElement('button');b.className='btn';b.textContent='Revogar';b.onclick=()=>act(b,async()=>{await api({action:'live_revoke',essay_id:essay.id,job_id:job.id,share_id:item.id});row.textContent='Link revogado.';});row.append(b);}host.append(row);}if(!data.shares.length)host.textContent='Nenhum link criado.';});
 }
 function studentResult(){
  const value=job.result;
  shell(`<section class="tl-card"><h2>Sua devolutiva</h2><p class="tl-note">Estimativa por IA · sem revisão de professor. Esta não é uma nota oficial do ENEM.</p><h3>${esc(job.theme)}</h3>${job.theme_origin==='inferred'?'<p class="tl-note">C2 por recorte inferido e confirmado, sem aferição da proposta original.</p>':''}<h2>${Number(value.total_score)} / 1000</h2>${['C1','C2','C3','C4','C5'].map(c=>`<h3>${c} · ${Number(value.competencies[c].score)}</h3><p>${esc(value.competencies[c].diagnostic)}</p>`).join('')}<h3>Ponto forte</h3><p>${esc(value.main_strength)}</p><h3>Prioridade de melhoria</h3><p>${esc(value.improvement_priority)}</p><h3>Próximo passo</h3><p>${esc(value.next_step)}</p>${value.needs_manual_review?'<p class="tl-note">A análise encontrou pontos que precisam de conferência. Leia as observações antes de usar as notas como referência.</p>':''}<details><summary>Texto e observações da análise</summary><p class="tl-result">${esc(value.transcription)}</p><p class="tl-result">${esc((value.review_requirements||[]).join('\n'))}</p><div class="tl-result">${esc(JSON.stringify({desvios:value.c1_deviations,intervencao:value.c5_check,repertorios:value.repertoire_checks},null,2))}</div></details><div class="tl-actions"><button class="btn primary" id="tlShare">Compartilhar devolutiva</button><button class="btn" id="tlStudentLinks">Gerenciar links</button><button class="btn" id="tlRedo">Refazer correção · 1 crédito</button></div><div id="tlSharePanel"></div></section>`);
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
  const data=await api({action:'live_history',offset,...(group?{activity_id:group.id}:{})});if(!current())return;
  shell(`<section class="tl-card"><h2>${group?esc(group.name||'Atividade sem nome'):'Histórico ao vivo'}</h2>${group?`<p>${esc(group.theme)}</p><button class="btn primary" id="tlGroupNext">Corrigir próxima redação desta atividade</button>`:''}${data.essays.length?data.essays.map(e=>`<p><button class="btn" data-essay="${esc(e.id)}">${esc(e.student_label||'Sem identificação')} · ${esc(e.theme||'Rascunho')} · ${esc(fmtDate(e.created_at))}</button></p>`).join(''):'<p>Nenhuma redação nesta página.</p>'}<div class="tl-actions">${offset?'<button class="btn" id="tlPreviousPage">Anterior</button>':''}${data.essays.length===20?'<button class="btn" id="tlNextPage">Próxima</button>':''}</div></section>`);
  if($('tlGroupNext'))$('tlGroupNext').onclick=()=>nextEssay(group);
  if($('tlPreviousPage'))$('tlPreviousPage').onclick=e=>act(e.target,()=>history(Math.max(0,offset-20),group));
  if($('tlNextPage'))$('tlNextPage').onclick=e=>act(e.target,()=>history(offset+20,group));
  document.querySelectorAll('[data-essay]').forEach(b=>b.onclick=()=>act(b,async()=>{
   const data=await api({action:'live_get',essay_id:b.dataset.essay});essay=data.essay;file=null;requests.theme=null;requests.correction=null;name=essay.student_label;school=essay.school_label;theme=essay.theme;origin=essay.theme_origin;confirmed=!!essay.theme_confirmed_at;activity=null;activityEnabled=false;activityName='';if(!studentMode&&essay.activity_id){const rows=await api({action:'live_activities',activity_id:essay.activity_id});activity=rows.activities[0]||null;activityEnabled=!!activity;activityName=activity?.name||'';}text=essay.input_text||'';
   if(!data.jobs.length){step=2;render();return;}
   shell(`<section class="tl-card"><h2>Versões desta redação</h2>${data.jobs.map(j=>`<p><button class="btn" data-job="${esc(j.id)}">${j.purpose==='theme'?'Sugestão de tema':'Correção'} · ${esc(({processing:'Em análise',completed:j.review?'Revisada':'Concluída',failed:'Falhou'})[j.status]||j.status)} · ${esc(fmtDate(j.created_at))}</button></p>`).join('')}</section>`);
   document.querySelectorAll('[data-job]').forEach(button=>button.onclick=()=>{job=data.jobs.find(j=>j.id===button.dataset.job);watch(job.purpose==='theme').catch(error=>status(error.message));});
  }));
 }

 render();
};

window.renderStudentLive=window.renderTeacherLive;
