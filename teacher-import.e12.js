'use strict';
async function renderTeacherImport(navigation){
 if(S.profile?.role!=='teacher')throw Error('Esta área é destinada ao professor.');
 const current=()=>navigationCurrent(navigation);
 const result=await catalogCall('organizations');if(!current())return;
 const schools=result.organizations.filter(x=>x.is_active!==false).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 const draft={step:1,school:null,group:null,classes:[],text:'',rows:[],candidates:[],choices:[],busy:false,loading:false,fileLoading:false,screenVersion:0,loadVersion:0};
 const hint=S.catalogSelection;S.catalogSelection=null;S.organizationIntent=null;
 const names=()=>`${draft.school?.name||''} · ${draft.group?.name||''}`;
 const sorted=rows=>[...rows].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base',numeric:true}));
 const message=text=>{if(current()&&$('importStatus'))$('importStatus').textContent=text;};
 function shell(){
  draft.screenVersion++;
  $('view').innerHTML=header('Importar alunos','Prepare a turma em três passos. Você confere tudo antes de importar.')+`<section class="teacher-org-page org-redesign"><ol class="item-actions" aria-label="Etapas da importação" style="padding:0;list-style:none">${['Escola e turma','Enviar lista','Conferir e importar'].map((label,i)=>`<li class="pill ${draft.step===i+1?'ok':''}" ${draft.step===i+1?'aria-current="step"':''}>${i+1}. ${label}</li>`).join('')}</ol><div id="importStage" class="box box-body"></div><p id="importStatus" role="status" aria-live="polite"></p></section>`;
 }
 async function run(action,progress='Salvando...'){
  if(draft.busy)return;draft.busy=true;
  const stage=$('importStage');stage?.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=true);message(progress);
  try{await action();}catch(e){message(e.message||'Não foi possível concluir. Tente novamente.');}
  finally{draft.busy=false;if(current())$('importStage')?.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=false);}
 }
 async function selectSchool(id){
  const version=++draft.loadVersion;draft.school=schools.find(s=>s.id===id)||null;draft.group=null;draft.classes=[];draft.loading=true;
  drawDestination();if(!draft.school)return;
  message('Carregando turmas...');
  try{const data=await catalogCall('base',{organization_id:id});if(!current()||version!==draft.loadVersion)return;draft.loading=false;draft.classes=sorted(data.classes.filter(x=>x.is_active!==false));drawDestination();message('');}
  catch(e){if(current()&&version===draft.loadVersion){draft.loading=false;drawDestination();message(e.message);}}
 }
 function drawDestination(){
  if(!current())return;draft.step=1;shell();
  $('importStage').innerHTML=`<h2>Onde os alunos vão estudar?</h2><h3>Escola</h3><p>Escolha uma escola ou cadastre uma nova aqui.</p><div class="org-class-grid">${schools.map(s=>`<button type="button" class="org-class-card" data-import-school="${esc(s.id)}" aria-pressed="${s.id===draft.school?.id}"><strong>${esc(s.name)}</strong>${s.id===draft.school?.id?'<span>Selecionada</span>':''}</button>`).join('')||'<p>Você ainda não tem escolas. Comece pelo nome abaixo.</p>'}</div><details ${schools.length?'':'open'} class="org-create-panel"><summary>Criar escola</summary><form id="importCreateSchool" class="org-inline"><label class="field"><small>Nome da escola</small><input id="importSchoolName" required minlength="2" maxlength="160" placeholder="Ex.: Colégio Central"></label><button class="btn primary">Criar escola</button></form></details>${draft.school?`<h3>Turma de ${esc(draft.school.name)}</h3><div class="org-class-grid">${draft.classes.map(c=>`<button type="button" class="org-class-card" data-import-class="${esc(c.id)}" aria-pressed="${c.id===draft.group?.id}"><strong>${esc(c.name)}</strong><span>${esc(c.year)}${c.id===draft.group?.id?' · Selecionada':''}</span></button>`).join('')||'<p>Selecione uma turma quando carregar ou crie uma nova abaixo.</p>'}</div><details class="org-create-panel" ${draft.classes.length?'':'open'}><summary>Criar turma</summary><form id="importCreateClass" class="org-inline"><label class="field"><small>Nome da turma</small><input id="importClassName" required minlength="1" maxlength="80" placeholder="Ex.: 3º A"></label><label class="field org-year"><small>Ano letivo</small><input id="importClassYear" type="number" required min="2000" max="2100" value="${new Date().getFullYear()}"></label><button class="btn primary">Criar turma</button></form></details>`:''}<p class="safe-note">${draft.group?'Destino selecionado: '+esc(names()):'Escolha escola e turma para continuar.'}</p><button type="button" class="btn primary" id="importNext">Continuar para a lista</button>`;
  $('importStage').querySelectorAll('[data-import-school]').forEach(b=>b.onclick=()=>{if(!draft.busy)return selectSchool(b.dataset.importSchool);});
  $('importStage').querySelectorAll('[data-import-class]').forEach(b=>b.onclick=()=>{draft.group=draft.classes.find(c=>c.id===b.dataset.importClass);drawDestination();});
  $('importCreateSchool').onsubmit=e=>{e.preventDefault();const name=$('importSchoolName').value.trim();if(name.length<2)return;return run(async()=>{const r=await organizationCall('create_organization',{name});if(!current())return;schools.push({id:r.organization_id,name,is_active:true});schools.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));await selectSchool(r.organization_id);message('Escola criada. Agora escolha ou crie a turma.');S.cache={};});};
  if(draft.loading)$('importCreateClass')?.querySelectorAll('input,button').forEach(el=>el.disabled=true);
  if($('importCreateClass'))$('importCreateClass').onsubmit=e=>{e.preventDefault();if(draft.loading)return;const name=$('importClassName').value.trim(),year=Number($('importClassYear').value),oid=draft.school.id;if(!name||!Number.isInteger(year)||year<2000||year>2100){message('Informe o nome e um ano letivo entre 2000 e 2100.');return;}return run(async()=>{const r=await organizationCall('create_class',{organization_id:oid,name,year});if(!current())return;draft.group={id:r.class_id,name,year,is_active:true};draft.classes=sorted([...draft.classes,draft.group]);drawDestination();message('Turma criada. Continue para enviar a lista.');S.cache={};});};
  $('importNext').onclick=()=>{if(!draft.school||!draft.group){message('Selecione ou crie uma escola e uma turma.');return;}drawInput();};
 }
 function drawInput(){
  if(!current())return;draft.step=2;shell();
  $('importStage').innerHTML=`<h2>Envie a lista de alunos</h2><p class="safe-note">Destino: <strong>${esc(names())}</strong></p><label class="field"><small>Cole do Excel ou escreva um nome por linha</small><textarea id="importText" rows="9" placeholder="Nome&#9;E-mail&#10;Ana Costa&#9;ana@exemplo.com&#10;Bruno Lima">${esc(draft.text)}</textarea></label><p>O e-mail é opcional. Aceitamos colunas Nome e E-mail, nomes em linhas separadas ou o e-mail na linha abaixo do nome.</p><label class="field"><small>Ou envie uma lista CSV</small><input type="file" id="importFile" accept=".csv,text/csv"></label><p class="muted">Planilha Excel: copie as células e cole acima ou salve como CSV UTF-8. Até 500 alunos e 250 KB por lote. A lista só será gravada após sua confirmação.</p><div class="item-actions"><button type="button" class="btn ghost" id="importBack">Voltar ao destino</button><button type="button" class="btn primary" id="importReview">Conferir lista</button></div>`;
  $('importText').oninput=()=>{draft.text=$('importText').value;};
  $('importBack').onclick=()=>{draft.text=$('importText').value;drawDestination();};
  let fileVersion=0;const screenVersion=draft.screenVersion;
  $('importFile').onchange=async()=>{const file=$('importFile').files[0],version=++fileVersion;if(!file)return;if(!/\.csv$/i.test(file.name)){message('Envie um CSV ou copie e cole as células da planilha.');return;}if(file.size>250000){message('Divida a lista em arquivos de até 250 KB.');return;}draft.fileLoading=true;$('importReview').disabled=true;try{const text=await file.text();if(!current()||draft.screenVersion!==screenVersion||version!==fileVersion)return;draft.text=text;$('importText').value=text;message('Lista carregada. Clique em Conferir lista.');}catch{if(draft.screenVersion===screenVersion)message('Não foi possível ler o arquivo. Tente colar a lista.');}finally{if(version===fileVersion)draft.fileLoading=false;if(current()&&draft.screenVersion===screenVersion)$('importReview').disabled=false;}};
  $('importReview').onclick=()=>{if(draft.fileLoading)return;draft.text=$('importText').value;return run(async()=>{const rows=parseRoster(draft.text);const data=await organizationCall('review',{organization_id:draft.school.id,class_id:draft.group.id,rows});if(!current())return;draft.rows=rows;draft.candidates=data.candidates;draft.choices=rows.map((row,i)=>conflict(row,i)?'':'new');drawReview();message('Nada foi importado ainda. Confira e confirme abaixo.');},'Conferindo a lista...');};
 }
 function repeated(row,i){return draft.rows.slice(0,i).some(x=>x.name.toLowerCase()===row.name.toLowerCase()||row.email&&x.email===row.email);}
 function conflict(row,i){return rosterMatches(row,draft.candidates).length>0||repeated(row,i);}
 function drawReview(){
  if(!current())return;draft.step=3;shell();
  $('importStage').innerHTML=`<h2>Confira antes de importar</h2><p class="safe-note">Destino: <strong>${esc(names())}</strong></p><p>${draft.rows.length} alunos reconhecidos. ${draft.rows.filter(conflict).length} linhas precisam de atenção por possível duplicidade. Nomes iguais podem ser pessoas diferentes.</p><div class="org-review">${draft.rows.map((row,i)=>{const matches=rosterMatches(row,draft.candidates);return `<div class="org-review-row"><div><b>${esc(row.name)}</b><small>${esc(row.email||'Sem e-mail')}${repeated(row,i)?' · Repetido nesta lista':''}</small></div><fieldset class="org-roster-choices"><legend>Ação para ${esc(row.name)}</legend><label><input type="radio" name="import-choice-${i}" data-import-choice="${i}" value="new" ${draft.choices[i]==='new'?'checked':''}>${conflict(row,i)?'Cadastrar outra pessoa com este nome':'Cadastrar aluno'}</label>${matches.map(s=>`<label><input type="radio" name="import-choice-${i}" data-import-choice="${i}" value="${esc(s.id)}">Usar cadastro: ${esc(s.full_name)}${s.enrolled?' · já nesta turma':''}</label>`).join('')}<label><input type="radio" name="import-choice-${i}" data-import-choice="${i}" value="skip">Ignorar linha</label></fieldset></div>`;}).join('')}</div><div class="item-actions"><button type="button" class="btn ghost" id="importEdit">Voltar e corrigir lista</button><button type="button" class="btn primary" id="importCommit">Confirmar importação</button></div>`;
  $('importEdit').onclick=drawInput;
  $('importStage').querySelectorAll('[data-import-choice]').forEach(input=>input.onchange=()=>{draft.choices[Number(input.dataset.importChoice)]=input.value;});
  $('importCommit').onclick=()=>{
   if(draft.choices.some(c=>!c)){message('Escolha o que fazer com cada possível duplicidade antes de confirmar.');return;}
   const rows=draft.rows.map((row,i)=>{const choice=draft.choices[i];return{...row,choice:['new','skip'].includes(choice)?choice:'existing',student_id:['new','skip'].includes(choice)?undefined:choice,homonym:choice==='new'&&!!conflict(row,i)};});
   if(rows.every(row=>row.choice==='skip')){message('Todas as linhas estão marcadas para ignorar. Selecione ao menos um aluno.');return;}
   return run(async()=>{const saved=await organizationCall('import',{organization_id:draft.school.id,class_id:draft.group.id,rows});if(!current())return;S.cache={};S.student=null;drawDone(saved,rows);});
  };
 }
 function drawDone(saved,rows){
  shell();$('importStage').innerHTML=`<h2>Turma pronta para começar</h2><p><strong>${Number(saved.processed)||0} registros processados</strong> em ${esc(names())}. ${rows.filter(r=>r.choice==='skip').length} linhas ignoradas.</p><p id="importClassCode" class="safe-note">Carregando código da turma...</p><p>Cada aluno entra com o código da turma e seu PIN individual.</p><div class="item-actions"><button type="button" class="btn primary" id="importStudents">Ver alunos e PINs</button><button type="button" class="btn ghost" id="importAnother">Importar outra lista</button></div>`;
  $('importStudents').onclick=()=>{S.catalogSelection={organization_id:draft.school.id,class_id:draft.group.id};navigate('teacher-students');};
  $('importAnother').onclick=()=>{draft.text='';draft.rows=[];draft.choices=[];drawDestination();};
  edge('student-pin-api',{action:'list',class_id:draft.group.id}).then(r=>{if(current()&&$('importClassCode'))$('importClassCode').textContent='Código da turma: '+r.code;}).catch(()=>{if(current()&&$('importClassCode'))$('importClassCode').textContent='A lista foi importada. Consulte o código em Alunos.';});
 }
 drawDestination();
 if(hint?.organization_id&&schools.some(s=>s.id===hint.organization_id)){await selectSchool(hint.organization_id);if(!current())return;draft.group=draft.classes.find(c=>c.id===hint.class_id)||null;drawDestination();}
}
