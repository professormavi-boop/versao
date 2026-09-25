'use strict';
const organizationRequestIds=new Map();
function organizationCall(action,fields={}){
 const body={action,...fields};
 if(['create_organization','create_class','import'].includes(action)){
  const key=JSON.stringify([S.session.user.id,body]);
  if(!organizationRequestIds.has(key))organizationRequestIds.set(key,crypto.randomUUID());
  body.request_id=organizationRequestIds.get(key);
 }
 return edge('teacher-organization-api',body);
}
function parseRoster(text){
 text=String(text).replace(/^\uFEFF/,'');
 if(!text.trim())throw Error('Cole os nomes ou selecione um CSV.');
 const first=text.split(/\r?\n/)[0];
 const delimiter=first.includes(';')?';':first.includes('\t')?'\t':',';
 const table=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){
   if(quoted&&text[i+1]==='"'){cell+='"';i++;}
   else if(quoted)quoted=false;
   else if(!cell)quoted=true;
   else throw Error('CSV inválido: confira as aspas.');
  }else if(!quoted&&(c===delimiter||c==='\n'||c==='\r')){
   row.push(cell);cell='';
   if(c!==delimiter){if(row.some(v=>v.trim()))table.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}
  }else cell+=c;
 }
 if(quoted)throw Error('CSV inválido: há aspas sem fechamento.');
 row.push(cell);if(row.some(v=>v.trim()))table.push(row);
 const head=table[0].map(v=>v.trim().toLowerCase());
 const nameIndex=head.findIndex(v=>['nome','nome completo','full_name','name','aluno'].includes(v));
 const emailIndex=head.findIndex(v=>['email','e-mail'].includes(v));
 const hasHeader=nameIndex>=0;
 if(hasHeader)table.shift();
 const rows=[],singleColumn=emailIndex<0&&table.every(r=>r.length===1);
 const validEmail=value=>/^\S+@\S+\.\S+$/.test(value)&&value.length<=254;
 table.forEach((r,i)=>{
  if(!hasHeader&&r.length>2)throw Error(`Linha ${i+1}: use nome e, opcionalmente, e-mail.`);
  const name=(r[hasHeader?nameIndex:0]||'').trim().replace(/\s+/g,' '),email=(r[hasHeader?emailIndex:1]||'').trim().toLowerCase();
  if(name.includes('@')){
   const previous=rows[rows.length-1];
   if(!singleColumn||!validEmail(name)||!previous||previous.email)throw Error(`Linha ${i+1}: informe o nome antes do e-mail e apenas um e-mail por aluno.`);
   previous.email=name.toLowerCase();return;
  }
  if(name.length<2||name.length>160||email&&!validEmail(email))throw Error(`Confira nome e e-mail na linha ${i+1}.`);
  rows.push({name,email});
 });
 if(!rows.length||rows.length>500)throw Error('Envie de 1 a 500 alunos por lote. Você pode enviar quantos lotes precisar.');
 return rows;
}
function rosterMatches(row,candidates){return candidates.filter(s=>s.full_name.trim().replace(/\s+/g,' ').toLowerCase()===row.name.toLowerCase()||row.email&&s.email?.toLowerCase()===row.email);}
async function renderTeacherOrganization(navigation){
 if(S.profile.role!=='teacher')throw Error('Esta área é destinada ao professor.');
 const homeIntent=S.organizationIntent,importIntent=['import','student'].includes(homeIntent),homeStudentName=S.homeStudentName;S.organizationIntent=null;S.homeStudentName=null;
 const data=await catalogCall('organizations');if(!navigationCurrent(navigation))return;
 $('view').innerHTML=header('Minhas instituições','Organize suas turmas e alunos em um só lugar.')+`<section class="teacher-org-page org-redesign"><section id="orgDirectory"><div class="org-directory-toolbar"><label class="field"><small>Buscar instituição</small><input id="orgSearch" type="search" placeholder="Nome da escola ou curso"></label><button type="button" class="btn primary" id="orgNew">Nova instituição</button></div><div class="org-directory-meta"><span id="orgCount"></span><label><input id="orgShowHidden" type="checkbox"> Mostrar ocultas</label></div><div id="orgCards" class="org-card-grid"></div><p id="orgEmpty" class="safe-note" hidden></p></section><details class="box org-create-panel" id="orgCreatePanel"><summary>Cadastrar instituição</summary><div class="box-body"><form id="orgCreate" class="org-inline"><label class="field"><small>Nome da instituição</small><input id="orgName" required minlength="2" maxlength="160" placeholder="Nome da escola ou curso"></label><button class="btn primary">Criar instituição</button></form></div></details><div id="catalogEditor"></div><div id="orgStatus" role="status" aria-live="polite"></div><div id="orgWorkspace"></div></section>`;
 let busy=false,selectionVersion=0,currentClasses=[],currentStudents=[],selectedOrgId='',selectedClassId='';
 const savedSelection=S.catalogSelection;S.catalogSelection=null;
 const current=()=>navigationCurrent(navigation)&&!!$('orgWorkspace');
 const dataOrganizationActive=id=>data.organizations.find(o=>o.id===id)?.is_active!==false;
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 function lockNavigation(locked){document.querySelectorAll('.org-redesign [data-org-open],.org-redesign [data-class-open],.org-redesign #orgBack').forEach(b=>b.disabled=locked);}
 function renderCards(){
  const term=normalize($('orgSearch').value.trim()),showHidden=$('orgShowHidden').checked;
  const rows=data.organizations.filter(o=>(showHidden||o.is_active!==false)&&normalize(o.name).includes(term));
  $('orgCount').textContent=rows.length===1?'1 instituição':`${rows.length} instituições`;
  $('orgCards').innerHTML=rows.map(o=>`<button type="button" class="org-institution-card" data-org-open="${esc(o.id)}"><span class="org-card-top"><span class="org-monogram" aria-hidden="true">${esc(o.name.trim().slice(0,1).toUpperCase())}</span><span class="pill ${o.is_active===false?'warn':'ok'}">${o.is_active===false?'Oculta':'Ativa'}</span></span><strong>${esc(o.name)}</strong><span class="org-card-link">Ver turmas <span aria-hidden="true">→</span></span></button>`).join('');
  $('orgEmpty').hidden=rows.length>0;$('orgEmpty').textContent=data.organizations.length?'Nenhuma instituição encontrada. Ajuste a busca ou mostre as ocultas.':'Suas instituições aparecerão aqui. Cadastre a primeira para organizar as turmas.';
  lockNavigation(busy);
 }
 function renderClasses(){
  const focusedClass=document.activeElement?.dataset?.classOpen;
  $('orgClasses').innerHTML=currentClasses.map(c=>`<button type="button" class="org-class-card" data-class-open="${esc(c.id)}" aria-pressed="${c.id===selectedClassId}"><strong>${esc(c.name)}</strong><span>${esc(c.year)} · ${Number(c.student_count)||0} alunos${c.is_active===false?' · Oculta':''}</span></button>`).join('')||'<p class="safe-note">Esta instituição ainda não tem turmas. Use Nova turma para começar.</p>';
  lockNavigation(busy);if(focusedClass){const focus=Array.from($('orgClasses').querySelectorAll('[data-class-open]')).find(b=>b.dataset.classOpen===focusedClass);focus?.focus({preventScroll:true});}
 }
 function openCreate(){ $('orgCreatePanel').hidden=false;$('orgCreatePanel').open=true;$('orgName').focus(); }
 $('orgNew').onclick=openCreate;
 $('orgSearch').oninput=renderCards;$('orgShowHidden').onchange=renderCards;
 $('orgCards').onclick=async e=>{const button=e.target.closest('[data-org-open]');if(!button||busy)return;selectedOrgId=button.dataset.orgOpen;await loadOrganization();if(current())$('orgBack')?.focus({preventScroll:true});};
 async function operation(button,fn){
  if(busy)return;busy=true;button.disabled=true;lockNavigation(true);$('orgStatus').textContent='Salvando...';
  try{await fn();S.cache={};S.student=null;}
  catch(e){if(current())$('orgStatus').textContent=e.message;}
  finally{busy=false;if(current()){lockNavigation(false);button.disabled=false;}}
 }
 $('orgCreate').onsubmit=e=>{
  e.preventDefault();const name=$('orgName').value.trim();
  return operation(e.submitter||$('orgCreate').querySelector('button'),async()=>{
   const result=await organizationCall('create_organization',{name});if(!current())return;
   data.organizations.push({id:result.organization_id,name,is_active:true});
   selectedOrgId=result.organization_id;$('orgName').value='';$('orgCreatePanel').open=false;renderCards();
   await loadOrganization();if(current())$('orgStatus').textContent='Instituição criada.';
  });
 };
 async function loadOrganization(){
  const version=++selectionVersion,oid=selectedOrgId,root=$('orgWorkspace');root.before($('catalogEditor'));$('catalogEditor').innerHTML='';root.innerHTML='';selectedClassId='';currentStudents=[];currentClasses=[];if(!oid)return;$('orgDirectory').hidden=true;$('orgCreatePanel').hidden=true;
  root.innerHTML='<button type="button" class="btn ghost" id="orgBack">← Todas as instituições</button><p role="status">Carregando turmas...</p>';
  const back=()=>{if(busy)return;selectionVersion++;classVersion++;selectedOrgId='';selectedClassId='';root.before($('catalogEditor'));$('catalogEditor').innerHTML='';root.innerHTML='';$('orgDirectory').hidden=false;$('orgCreatePanel').hidden=false;$('orgStatus').textContent='';renderCards();$('orgSearch').focus({preventScroll:true});};
  $('orgBack').onclick=back;
  try{
   const base=await catalogCall('base',{organization_id:oid});if(!current()||version!==selectionVersion)return;currentClasses=base.classes;
   const selectedOrg=data.organizations.find(o=>o.id===oid);
   root.innerHTML=`<button type="button" class="btn ghost" id="orgBack">← Todas as instituições</button><div class="org-context-head"><h2>${esc(selectedOrg?.name||'Instituição')}</h2>${catalogButtons('organization',oid,selectedOrg?.is_active!==false)}</div>${selectedOrg?.is_active===false?'<p class="safe-note">Instituição oculta. O acesso dos alunos está bloqueado até a reativação.</p>':''}<div class="box"><div class="box-head"><h2>Turmas</h2></div><div class="box-body"><details class="org-create-panel" id="orgClassCreatePanel"><summary>Nova turma</summary><form id="orgClassCreate" class="org-inline"><label class="field"><small>Nome da turma</small><input id="orgClassName" required maxlength="80" placeholder="Ex.: 1º A — Ensino Médio"></label><label class="field org-year"><small>Ano letivo</small><input id="orgClassYear" required type="number" min="2000" max="2100" value="${new Date().getFullYear()}"></label><button class="btn primary">Criar turma</button></form></details><div id="orgClasses" class="org-class-grid" aria-label="Turmas"></div><div id="orgRoster"></div></div></div>`;
   $('orgClassCreatePanel').before($('orgClasses'));renderClasses();$('orgBack').onclick=back;if(homeIntent==='class')$('orgClassCreatePanel').open=true;
   $('orgClassCreate').onsubmit=e=>{e.preventDefault();return operation(e.submitter||$('orgClassCreate').querySelector('button'),async()=>{
    const r=await organizationCall('create_class',{organization_id:oid,name:$('orgClassName').value.trim(),year:Number($('orgClassYear').value)});if(!current())return;
    await loadOrganization();if(!current())return;selectedClassId=r.class_id;await loadClass();$('orgStatus').textContent='Turma criada.';
   });};
   $('orgClasses').onclick=e=>{const button=e.target.closest('[data-class-open]');if(!button||busy)return;selectedClassId=button.dataset.classOpen;renderClasses();loadClass();};
   if(selectedOrg?.is_active===false)$('orgClassCreate').querySelectorAll('input,button').forEach(x=>x.disabled=true);
   if(!savedSelection?.class_id&&base.classes.length===1){selectedClassId=base.classes[0].id;await loadClass();}
  }catch(e){if(current()&&version===selectionVersion){root.innerHTML='<button type="button" class="btn ghost" id="orgBack">← Todas as instituições</button><p role="alert"></p>';root.querySelector('p').textContent=e.message;$('orgBack').onclick=back;}}
 }
 let classVersion=0;
 async function loadClass(){
  const version=++classVersion,oid=selectedOrgId,cid=selectedClassId,root=$('orgRoster');$('orgWorkspace').before($('catalogEditor'));$('catalogEditor').innerHTML='';root.innerHTML='';if(!cid)return;renderClasses();root.innerHTML='<p role="status">Carregando alunos...</p>';
  const same=()=>current()&&version===classVersion&&selectedOrgId===oid&&selectedClassId===cid;
  try{
   const data=await catalogCall('students',{organization_id:oid,class_id:cid});if(!same())return;currentStudents=data.students;
   const classActive=currentClasses.find(c=>c.id===cid)?.is_active!==false,orgActive=dataOrganizationActive(oid);
   const selectedClass=currentClasses.find(c=>c.id===cid);if(selectedClass)selectedClass.student_count=data.students.length;renderClasses();
   root.innerHTML=`<div class="org-context-head"><h3>${esc(currentClasses.find(c=>c.id===cid)?.name||'Turma')}</h3>${catalogButtons('class',cid,classActive)}</div>${classActive?'':'<p class="safe-note">Turma oculta. Reative para receber novos envios.</p>'}<div id="classAccess" class="safe-note">Carregando acessos da turma...</div><h3>Alunos da turma (${data.students.length})</h3><label class="field"><small>Buscar aluno por nome ou e-mail</small><input type="search" id="orgStudentSearch" placeholder="Digite para filtrar"></label><p id="orgStudentEmpty" class="muted" hidden>Nenhum aluno encontrado.</p><ul class="org-students">${data.students.map(s=>`<li data-student-search="${esc([s.full_name,s.email].join(' '))}"><div><b>${esc(s.full_name)}</b>${s.is_active===false?' <span class="pill warn">Oculto</span>':''}</div><div class="item-actions">${catalogButtons('student',s.id,s.is_active!==false)} <button type="button" class="btn soft-btn" data-pin-student="${esc(s.id)}">Gerar / redefinir PIN</button></div>${s.email?` <small>${esc(s.email)}</small>`:''}</li>`).join('')||'<li>Nenhum aluno cadastrado.</li>'}</ul><details class="org-create-panel" id="orgRosterCreatePanel"><summary>Adicionar ou importar alunos</summary><h3 id="rosterHeading">Importar alunos</h3><p>1. Enviar &nbsp; 2. Conferir &nbsp; 3. Concluir</p><div id="rosterInput"><label class="field"><small>Cole um nome por linha. Se houver e-mail, coloque-o na linha logo abaixo do nome.</small><textarea id="rosterText" rows="6" placeholder="Ana Costa&#10;ana@exemplo.com&#10;Bruno Lima"></textarea></label><label class="field"><small>Ou envie um CSV UTF-8 com as colunas nome e email</small><input id="rosterFile" type="file" accept=".csv,text/csv"></label><p class="muted">Até 500 alunos por envio, sem limite de lotes. Revise os dados antes de salvar.</p><button class="btn primary" id="rosterReview">Conferir alunos</button></div><div id="rosterStatus" role="status"></div><div id="rosterReviewBody"></div></details>`;
   $('orgStudentSearch').oninput=()=>{const term=$('orgStudentSearch').value.trim().toLocaleLowerCase('pt-BR');let count=0;for(const row of root.querySelectorAll('[data-student-search]')){row.hidden=!row.dataset.studentSearch.toLocaleLowerCase('pt-BR').includes(term);if(!row.hidden)count++;}$('orgStudentEmpty').hidden=count>0;};
   if(importIntent)$('orgRosterCreatePanel').open=true;
   if(!orgActive||!classActive){$('classAccess').textContent='Acesso por PIN indisponível enquanto a instituição ou turma estiver oculta.';$('rosterInput').querySelectorAll('input,textarea,button').forEach(x=>x.disabled=true);root.querySelectorAll('[data-pin-student]').forEach(x=>x.disabled=true);}
   else edge('student-pin-api',{action:'list',class_id:cid}).then(access=>{
    if(!same())return;
    $('classAccess').textContent='Acesso: '+location.origin+'/?acesso=aluno — Código da turma: '+access.code+'. Cada aluno usa seu PIN individual.';
    root.querySelectorAll('[data-pin-student]').forEach(button=>{
      const hasPin=access.students.find(x=>x.id===button.dataset.pinStudent)?.has_pin;
      button.textContent=hasPin?'Redefinir PIN':'Gerar PIN';
      if(data.students.find(x=>x.id===button.dataset.pinStudent)?.is_active===false){button.disabled=true;return;}
      button.onclick=async()=>{
        if(hasPin&&!await appConfirm('Gerar outro PIN? O PIN anterior deixará de permitir novos acessos. O histórico será preservado.'))return;
        button.disabled=true;
        try{
          const result=await edge('student-pin-api',{action:'issue',class_id:cid,student_id:button.dataset.pinStudent});if(!same())return;
          const dialog=document.createElement('dialog');dialog.className='app-confirm';
          dialog.innerHTML='<h2>Acesso do aluno</h2><p></p><p>Guarde e entregue individualmente. O PIN só é exibido agora.</p><button class="btn primary">Concluir</button>';
          dialog.querySelector('p').textContent=data.students.find(x=>x.id===result.student_id)?.full_name+' — Turma: '+result.code+' — PIN: '+result.pin;
          const close=()=>{dialog.close();dialog.remove();loadClass();};dialog.querySelector('button').onclick=close;dialog.oncancel=e=>{e.preventDefault();close();};document.body.append(dialog);dialog.showModal();
        }catch(e){if(same())$('rosterStatus').textContent=e.message;}finally{button.disabled=false;}
      };
    });
   }).catch(e=>{if(same())$('classAccess').textContent=e.message;});
   $('rosterFile').onchange=async()=>{
    const f=$('rosterFile').files[0];if(!f)return;
    if(f.size>250000){$('rosterStatus').textContent='Divida o CSV em arquivos de até 250 KB.';return;}
    const text=await f.text();if(same()){$('rosterText').value=text;$('rosterStatus').textContent='Arquivo carregado. Confira os alunos.';}
   };
   if(homeIntent==='student'){$('rosterHeading').textContent='Novo aluno';$('rosterFile').closest('label').hidden=true;$('rosterText').value=homeStudentName||'';$('rosterInput').previousElementSibling.textContent='Informe o nome do aluno e confira antes de concluir.';}
   if(importIntent){$('rosterText').scrollIntoView({behavior:'smooth',block:'center'});$('rosterText').focus({preventScroll:true});}
   $('rosterReview').onclick=async()=>{
    const btn=$('rosterReview');btn.disabled=true;
    try{
     const rows=parseRoster($('rosterText').value),r=await organizationCall('review',{organization_id:oid,class_id:cid,rows});if(!same())return;
     $('rosterInput').hidden=true;
     $('rosterReviewBody').innerHTML=`<h3>Confira ${rows.length} linhas</h3><p>Nomes iguais podem ser pessoas diferentes. Escolha um cadastro existente, ignore a linha ou confirme um novo aluno.</p><div class="org-review">${rows.map((row,i)=>{
      const matches=rosterMatches(row,r.candidates),repeated=rows.slice(0,i).some(x=>x.name.toLowerCase()===row.name.toLowerCase()||row.email&&x.email===row.email),conflict=matches.length||repeated;
      return `<div class="org-review-row"><div><b>${esc(row.name)}</b><small>${esc(row.email||'Sem e-mail')}${repeated?' · Repetido neste envio':''}</small></div><fieldset class="org-roster-choices"><legend>Ação para ${esc(row.name)}</legend><label><input type="radio" name="roster-choice-${i}" data-roster-choice="${i}" value="new" ${conflict?'':'checked'}> ${conflict?'Cadastrar outra pessoa com este nome':'Cadastrar novo aluno'}</label>${matches.map(s=>`<label><input type="radio" name="roster-choice-${i}" data-roster-choice="${i}" value="${esc(s.id)}"> Usar cadastro: ${esc(s.full_name)} · ${esc(s.email||s.id.slice(0,8))}${s.enrolled?' · já nesta turma':''}</label>`).join('')}<label><input type="radio" name="roster-choice-${i}" data-roster-choice="${i}" value="skip"> Ignorar esta linha</label></fieldset></div>`;
     }).join('')}</div><div class="org-inline"><button class="btn ghost" id="rosterBack">Voltar</button><button class="btn primary" id="rosterCommit">Concluir importação</button></div>`;
     $('rosterStatus').textContent='Nada foi gravado ainda.';
     $('rosterBack').onclick=()=>{$('rosterInput').hidden=false;$('rosterReviewBody').innerHTML='';$('rosterStatus').textContent='';};
     $('rosterCommit').onclick=()=>{
      const selected=rows.map((row,i)=>{const v=(root.querySelector(`[data-roster-choice="${i}"]:checked`)?.value||'');return {...row,choice:v==='new'||v==='skip'?v:v?'existing':'',student_id:v!=='new'&&v!=='skip'?v:undefined,homonym:v==='new'&&(rosterMatches(row,r.candidates).length>0||rows.slice(0,i).some(x=>x.name.toLowerCase()===row.name.toLowerCase()))};});
      if(selected.some(x=>!x.choice)){$('rosterStatus').textContent='Escolha uma ação para todas as linhas.';return;}
      $('rosterBack').disabled=true;
      return operation($('rosterCommit'),async()=>{
       try{const saved=await organizationCall('import',{organization_id:oid,class_id:cid,rows:selected});if(!same())return;await loadClass();if(current())$('orgStatus').textContent=`Importação concluída: ${saved.processed} linhas processadas.`;}
       finally{if(same()&&$('rosterBack'))$('rosterBack').disabled=false;}
      });
     };
    }catch(e){if(same())$('rosterStatus').textContent=e.message;}finally{if(same())btn.disabled=false;}
   };
  }catch(e){if(same())root.textContent=e.message;}
 }
 $('orgWorkspace').onclick=async e=>{
  const button=e.target.closest('[data-catalog-action]');if(!button||busy)return;
  const {catalogAction:action,catalogKind:kind,catalogId:id}=button.dataset;
  const row=kind==='organization'?data.organizations.find(x=>x.id===id):kind==='class'?currentClasses.find(x=>x.id===id):currentStudents.find(x=>x.id===id);if(!row)return;
  const oid=selectedOrgId,cid=selectedClassId;
  const fields={kind,organization_id:oid,...(kind==='class'?{class_id:id}:kind==='student'?{student_id:id}:{})};
  const refresh=async()=>{if(!current())return;organizationRequestIds.clear();S.catalogSelection={organization_id:oid,class_id:cid};await renderTeacherOrganization(navigation);};
  if(action==='edit'){
   const editor=$('catalogEditor');button.closest('.org-actions').after(editor);editor.innerHTML=`<form id="catalogEditForm" class="box box-body"><h3>Editar ${kind==='organization'?'instituição':kind==='class'?'turma':'aluno'}</h3><label class="field"><small>Nome</small><input id="catalogName" required minlength="2" maxlength="${kind==='class'?80:160}" value="${esc(row.full_name||row.name)}"></label>${kind==='student'?`<label class="field"><small>E-mail (opcional)</small><input id="catalogEmail" type="email" maxlength="254" value="${esc(row.email||'')}" ${row.has_account?'disabled':''}></label>${row.has_account?'<p class="muted">O e-mail de um acesso vinculado é preservado. O nome pode ser editado.</p>':''}<label><input id="catalogHomonym" type="checkbox"> Se houver outro aluno com o mesmo nome, confirmo que são pessoas diferentes.</label>`:''}<div class="item-actions"><button class="btn primary">Salvar alterações</button><button class="btn ghost" type="button" id="catalogCancel">Cancelar</button></div><div id="catalogEditStatus" role="status"></div></form>`;
   $('catalogCancel').onclick=()=>{editor.innerHTML='';};editor.scrollIntoView({behavior:'smooth',block:'center'});$('catalogName').focus({preventScroll:true});
   $('catalogEditForm').onsubmit=async event=>{
    event.preventDefault();if(busy)return;
    const name=$('catalogName').value.trim(),email=kind==='student'?$('catalogEmail').value.trim():undefined;
    const confirmedHomonym=kind==='student'&&$('catalogHomonym').checked;
    const homonym=kind==='student'&&currentStudents.some(x=>x.id!==id&&x.full_name.toLowerCase()===name.toLowerCase());
    if(homonym&&!confirmedHomonym&&!await appConfirm('Já existe outro aluno com esse nome. Confirma que são pessoas diferentes?'))return;
    await operation(event.submitter||$('catalogEditForm').querySelector('button'),async()=>{await catalogCall('update',{...fields,name,email,homonym:homonym||confirmedHomonym});await refresh();if(current())$('orgStatus').textContent='Alterações salvas.';});
   };return;
  }
  const label=row.full_name||row.name,nextActive=row.is_active===false;
  if(action==='delete'&&!await appConfirm('Excluir “'+label+'”'+(kind==='student'?' de todas as suas turmas':'')+'? Esta ação é definitiva. '+(kind==='student'?'Se não houver redações, o cadastro e o acesso por PIN serão removidos.':'Cadastros com vínculos ou histórico não serão excluídos.')))return;
  if(action==='visibility'&&row.is_active!==false&&!await appConfirm('Ocultar “'+label+'”? O histórico será mantido e o acesso correspondente dos alunos ficará indisponível até a reativação.'))return;
  if(!current())return;
  await operation(button,async()=>{await catalogCall(action,{...fields,...(action==='visibility'?{is_active:nextActive}:{})});await refresh();if(current())$('orgStatus').textContent=action==='delete'?'Cadastro excluído.':nextActive?'Cadastro reativado.':'Cadastro ocultado. Você pode reativá-lo aqui.';});
 };
 renderCards();
 if(savedSelection?.organization_id&&data.organizations.some(x=>x.id===savedSelection.organization_id)||homeIntent&&homeIntent!=='institution'&&data.organizations.length===1){selectedOrgId=savedSelection?.organization_id||data.organizations[0].id;await loadOrganization();if(savedSelection?.class_id&&currentClasses.some(x=>x.id===savedSelection.class_id)){selectedClassId=savedSelection.class_id;await loadClass();}}
 if(current()){if(homeIntent==='institution')openCreate();else if(homeIntent==='class'&&$('orgClassName')){$('orgClassCreatePanel').open=true;$('orgClassName').focus();}}


}

function catalogCall(action,fields={}){
 const body={action,...fields};if(['update','visibility','delete'].includes(action))body.request_id=crypto.randomUUID();
 return edge('teacher-catalog-api',body);
}
function catalogButtons(kind,id,active){const label=kind==='organization'?'instituição':kind==='class'?'turma':'aluno';return `<details class="org-actions"><summary aria-label="Ações da ${label}">Ações</summary><div class="org-action-buttons"><button type="button" class="btn soft-btn" data-catalog-kind="${kind}" data-catalog-id="${esc(id)}" data-catalog-action="edit">Editar ${label}</button><button type="button" class="btn soft-btn" data-catalog-kind="${kind}" data-catalog-id="${esc(id)}" data-catalog-action="visibility">${active?'Ocultar':'Reativar'}</button><button type="button" class="btn ghost" data-catalog-kind="${kind}" data-catalog-id="${esc(id)}" data-catalog-action="delete">Excluir</button></div></details>`;}
