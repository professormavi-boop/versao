'use strict';
window.renderWritingClassroom=async function(navigation){
 const host=$('view'),teacher=S.profile.role==='teacher',W=window.WritingStages;
 const current=()=>navigationCurrent(navigation),api=body=>edge('teacher-organization-api',body);
 let busy=false,activity=null,catalog=[];
 const frame=html=>{if(current())host.innerHTML=header(teacher?'Construção em aula':'Atividades de construção','Planejamento, escrita e reescrita por etapas.')+`<section class="teacher-live"><section class="tl-card">${html}<p id="wcStatus" role="status"></p></section></section>`;};
 const status=s=>{if(current()&&$('wcStatus'))$('wcStatus').textContent=s;};
 async function act(fn){if(busy)return;busy=true;try{await fn();}catch(e){status(e.message);}finally{busy=false;}}
 async function list(){
  frame('<p>Carregando atividades…</p>');
  const data=await api({action:'writing_activities'});if(!current())return;
  frame(`<div class="tl-actions"><button class="btn" id="wcPersonal">Meus rascunhos</button>${teacher?'<button class="btn primary" id="wcNew">Nova atividade</button>':''}</div>${data.activities.length?data.activities.map(a=>`<article class="tl-evidence-card"><h2>${esc(a.name)}</h2><p>${esc(a.theme)}</p><p>${a.is_active?'Aberta':'Encerrada'} · ${a.stages.map(k=>esc(W.stages[k]?.label||k)).join(' · ')}</p><button class="btn" data-wc-open="${esc(a.id)}">${teacher?'Acompanhar':'Começar ou continuar'}</button>${teacher?`<button class="btn" data-wc-edit="${esc(a.id)}">Editar etapas</button>`:''}</article>`).join(''):'<p>Nenhuma atividade disponível para sua turma.</p>'}`);
  $('wcPersonal').onclick=()=>window.renderWritingEditor(navigation);
  if($('wcNew'))$('wcNew').onclick=()=>act(()=>edit(null));
  host.querySelectorAll('[data-wc-open]').forEach(b=>b.onclick=()=>act(()=>teacher?open(b.dataset.wcOpen):join(b.dataset.wcOpen)));
  host.querySelectorAll('[data-wc-edit]').forEach(b=>b.onclick=()=>act(()=>edit(b.dataset.wcEdit)));
 }
 async function join(id){const data=await api({action:'writing_join',id});if(current())window.renderWritingEditor(navigation,{draftId:data.draft.id});}
 async function edit(id){
  const data=await api({action:'writing_catalog'});catalog=data.classes;
  activity=id?(await api({action:'writing_activity_get',id})).activity:{id:crypto.randomUUID(),name:'',theme:'',class_id:catalog[0]?.id||'',stages:Object.keys(W.stages),version:0,is_active:true};
  if(!current())return;
  frame(`<h2>${id?'Editar atividade':'Nova atividade'}</h2><label class="field">Nome<input id="wcName" maxlength="160" value="${esc(activity.name)}"></label><label class="field">Escola e turma<select id="wcClass" ${id?'disabled':''}>${catalog.map(c=>`<option value="${esc(c.id)}" ${c.id===activity.class_id?'selected':''}>${esc(c.organization+' · '+c.name)}</option>`).join('')}</select></label><label class="field">Tema<textarea id="wcTheme" maxlength="1000">${esc(activity.theme)}</textarea></label><h3>Etapas liberadas</h3>${Object.entries(W.stages).map(([k,v])=>`<label class="field"><span><input type="checkbox" data-wc-stage="${k}" ${activity.stages.includes(k)?'checked':''}> ${esc(v.label)}</span></label>`).join('')}<label class="field"><span><input id="wcActive" type="checkbox" ${activity.is_active?'checked':''}> Atividade aberta para escrita</span></label><div class="tl-actions"><button class="btn primary" id="wcSave">Salvar atividade</button><button class="btn" id="wcBack">Voltar</button></div>`);
  $('wcBack').onclick=()=>act(list);
  $('wcSave').onclick=()=>act(async()=>{
   const payload={...activity,action:'writing_activity_save',name:$('wcName').value.trim(),theme:$('wcTheme').value.trim(),class_id:$('wcClass').value,is_active:$('wcActive').checked,stages:[...host.querySelectorAll('[data-wc-stage]:checked')].map(x=>x.dataset.wcStage)};
   if(payload.name.length<2||payload.theme.length<10||!payload.class_id||!payload.stages.length)throw Error('Informe nome, tema, turma e ao menos uma etapa.');
   $('wcSave').disabled=true;status('Salvando…');try{await api(payload);await list();}finally{if($('wcSave'))$('wcSave').disabled=false;}
  });
 }
 async function open(id){
  const data=await api({action:'writing_activity_get',id});if(!current())return;
  activity=data.activity;
  frame(`<h2>${esc(activity.name)}</h2><p>${esc(activity.theme)}</p><div class="tl-actions"><button class="btn" id="wcBack">Atividades</button><button class="btn" id="wcRefresh">Atualizar produções</button></div>${data.students.map(s=>`<article class="tl-evidence-card"><h3>${esc(s.name)}</h3><p>${s.stage?esc(W.stages[s.stage].label):'Ainda não iniciou'} · ${s.updated_at?esc(fmtDate(s.updated_at)):'Sem produção'}</p>${s.draft_id?`<button class="btn" data-wc-draft="${esc(s.draft_id)}">Abrir produção</button>`:''}</article>`).join('')||'<p>Nenhum aluno ativo nesta turma.</p>'}`);
  $('wcBack').onclick=()=>act(list);$('wcRefresh').onclick=()=>act(()=>open(id));
  host.querySelectorAll('[data-wc-draft]').forEach(b=>b.onclick=()=>act(()=>detail(b.dataset.wcDraft)));
 }
 async function detail(id){
  const data=await api({action:'writing_detail',id});if(!current())return;
  const d=data.draft;
  frame(`<h2>Produção · versão ${Number(d.version)}</h2><p>${esc(d.theme)}</p>${Object.entries(W.stages).map(([k,v])=>`<article class="tl-evidence-card"><h3>${esc(v.label)}</h3><p>Planejamento: ${esc(d.content.stages[k].plan||'Ainda não registrado')}</p><p class="tl-result">${esc(d.content.stages[k].text||'Ainda não escrito')}</p></article>`).join('')}<h3>Orientações e reescritas</h3>${data.guidance.map(g=>`<article class="tl-evidence-card"><b>${esc(W.stages[g.stage].label)} · versão ${Number(g.draft_version)}</b><p>Pergunta: ${esc(g.question)}</p>${g.result?`<p>${esc(g.result.objective)}</p>${g.result.questions.map(q=>`<p>${esc(q)}</p>`).join('')}<p>${esc(g.result.task)}</p>`:`<p>${esc(g.error_message||'Em processamento')}</p>`}</article>`).join('')||'<p>Sem orientação solicitada.</p>'}<h3>Versões salvas</h3><div class="tl-actions">${data.revisions.map(r=>`<button class="btn" data-wc-version="${Number(r.version)}">Versão ${Number(r.version)}</button>`).join('')}</div><div id="wcRevision"></div><h3>Comentário do professor</h3><label class="field">Etapa<select id="wcCommentStage">${Object.entries(W.stages).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select></label><textarea id="wcComment" maxlength="4000" aria-label="Comentário"></textarea><div class="tl-actions"><button class="btn primary" id="wcCommentSave">Enviar orientação ao aluno</button><button class="btn" id="wcBack">Voltar à turma</button></div>${data.comments.map(c=>`<p>${esc(c.comment)} · versão ${Number(c.draft_version)}</p>`).join('')}`);
  $('wcBack').onclick=()=>act(()=>open(activity.id));
  let receipt=crypto.randomUUID();$('wcCommentSave').onclick=()=>act(async()=>{const comment=$('wcComment').value.trim();if(!comment)throw Error('Escreva uma orientação.');await api({action:'writing_comment',id,version:d.version,stage:$('wcCommentStage').value,comment,request_id:receipt});await detail(id);});
  host.querySelectorAll('[data-wc-version]').forEach(b=>b.onclick=()=>act(async()=>{const x=(await api({action:'writing_revision',id,version:Number(b.dataset.wcVersion)})).revision;if(current()&&$('wcRevision'))$('wcRevision').innerHTML=Object.entries(W.stages).map(([k,v])=>`<h4>${esc(v.label)}</h4><p class="tl-result">${esc(x.content.stages[k].text)}</p>`).join('');}));
 }
 await act(list);
};
