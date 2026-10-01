'use strict';
async function renderTeacherProfile(navigation){
 if(S.profile?.role!=='teacher')throw Error('Esta área é exclusiva do professor.');
 if(!navigationCurrent(navigation))return;
 const userId=S.profile.id;
 $('view').innerHTML=header('Alterar nome','Escolha como seu nome aparece na plataforma.')+`<section class="box teacher-profile"><div class="box-body"><form id="teacherNameForm"><label class="field" for="teacherDisplayName"><strong>Nome da conta</strong><input id="teacherDisplayName" name="full_name" autocomplete="name" minlength="2" maxlength="160" value="${esc(S.profile.full_name||'')}" required></label><p class="muted">Seu e-mail e sua forma de entrar continuam os mesmos.</p><p id="teacherNameStatus" role="status" aria-live="polite"></p><button class="btn primary" type="submit">Salvar nome</button></form></div></section>`;
 const form=$('teacherNameForm'),input=$('teacherDisplayName'),status=$('teacherNameStatus'),button=form.querySelector('button');let busy=false;
 form.onsubmit=async event=>{
  event.preventDefault();if(busy||!navigationCurrent(navigation)||S.profile?.id!==userId)return;
  const name=input.value.trim().replace(/\s+/g,' ');
  if(name.length<2||name.length>160||/[\u0000-\u001f\u007f<>]/.test(name)){status.textContent='Informe um nome entre 2 e 160 caracteres, sem marcações.';return;}
  busy=true;button.disabled=true;input.disabled=true;status.textContent='Salvando nome...';
  try{
   const result=await edge('teacher-organization-api',{action:'update_name',full_name:name});
   if(!result.ok||result.profile?.id!==userId||typeof result.profile.full_name!=='string')throw Error('O servidor não confirmou a alteração.');
   if(S.profile?.id!==userId)return;
   S.profile.full_name=result.profile.full_name;S.cache={};buildNav();
   if(navigationCurrent(navigation)){input.value=result.profile.full_name;status.textContent='Nome alterado com sucesso.';}
  }catch(error){if(navigationCurrent(navigation))status.textContent=error.message||'Não foi possível salvar o nome.';}
  finally{busy=false;button.disabled=false;input.disabled=false;}
 };
}
async function renderTeacherPassword(navigation){
 if(S.profile?.role!=='teacher')throw Error('Esta área é exclusiva do professor.');
 if(!navigationCurrent(navigation))return;
 const userId=S.profile.id;
 $('view').innerHTML=header('Alterar senha','Defina uma nova senha para acessar sua conta.')+`<section class="box"><div class="box-body"><form id="teacherPasswordForm"><label class="field"><small>Nova senha</small><input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><label class="field"><small>Confirmar nova senha</small><input name="confirmation" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><p class="muted">Use de 8 a 128 caracteres. Ao salvar, a senha anterior deixará de funcionar.</p><p id="teacherPasswordStatus" role="status" aria-live="polite"></p><button class="btn primary" type="submit">Salvar nova senha</button></form></div></section>`;
 const form=$('teacherPasswordForm'),password=form.elements.password,confirmation=form.elements.confirmation,status=$('teacherPasswordStatus'),button=form.querySelector('button');
 let busy=false;
 form.onsubmit=async event=>{
  event.preventDefault();
  if(busy||!navigationCurrent(navigation)||S.profile?.id!==userId||S.profile?.role!=='teacher')return;
  if(password.value.length<8||password.value.length>128){status.textContent='Use de 8 a 128 caracteres.';return;}
  if(password.value!==confirmation.value){status.textContent='As senhas não coincidem.';confirmation.focus();return;}
  busy=true;button.disabled=true;password.disabled=true;confirmation.disabled=true;status.textContent='Alterando senha...';
  try{
   const session=await ensure();
   if(session.user?.id!==userId||!navigationCurrent(navigation))throw Error('Sua sessão mudou. Entre novamente.');
   const result=await accountRequest('user',{password:password.value},session.access_token);
   if(result.id!==userId)throw Error('O servidor não confirmou a alteração.');
   if(navigationCurrent(navigation))status.textContent='Senha alterada com sucesso. Use a nova senha no próximo acesso.';
  }catch(error){if(navigationCurrent(navigation))status.textContent=error.message||'Não foi possível alterar a senha. Tente novamente.';}
  finally{password.value='';confirmation.value='';busy=false;button.disabled=false;password.disabled=false;confirmation.disabled=false;}
 };
}
async function renderHome(navigation){const [q,p]=await Promise.all([teacherQueue(),teacherProposals()]);const pending=q.filter(x=>!x.score&&x.page_count>0).length,validation=q.filter(x=>x.score&&!x.score.is_approved).length;if(!navigationCurrent(navigation))return;$('view').innerHTML=header('Início','Veja o que precisa da sua atenção.')+`<section class="home-compact-pending" aria-label="Pendências">${pending?`<button class="home-task" data-home-status="uncorrected"><span>${pending} ${pending===1?'redação aguardando':'redações aguardando'} correção</span><span class="home-task-link">Abrir</span></button>`:''}${validation?`<button class="home-task" data-home-status="validation"><span>${validation} ${validation===1?'correção aguardando':'correções aguardando'} validação</span><span class="home-task-link">Abrir</span></button>`:''}${!pending&&!validation?'<p class="home-current">Nenhuma correção pendente.</p>':''}</section><section class="grid cols2" style="margin-top:12px"><article class="box"><div class="box-head"><h2>Fila recente</h2><p>Últimas redações disponíveis para correção.</p></div><div class="box-body list">${q.slice(0,5).map(x=>{const [s,c]=statusLabel(x);return `<div class="list-item"><div class="item-top"><div><div class="item-title">${esc(x.student_name)}</div><div class="item-meta">${esc(x.class_name)} · R${esc(x.round_number??'—')} · ${esc(x.theme||'Proposta')}</div></div><span class="pill ${c}">${s}</span></div></div>`}).join('')||'<div class="empty">Nenhuma redação na fila.</div>'}</div></article><article class="box"><div class="box-head"><h2>Propostas recentes</h2><p>Visão consolidada das propostas.</p></div><div class="box-body list">${(p.recent||[]).slice(0,5).map(r=>`<div class="list-item"><div class="item-top"><div><div class="item-title">R${esc(r.number??'—')} · ${esc(r.theme)}</div><div class="item-meta">${r.target_count||0} destinatário(s) · ${r.motivator_count||0} texto(s) motivador(es)</div></div><span class="pill ${r.is_visible_to_students?'ok':'warn'}">${r.is_visible_to_students?'Publicada':'Rascunho'}</span></div></div>`).join('')||'<div class="empty">Nenhuma proposta recente.</div>'}</div></article></section>`;$('view').onclick=e=>{const button=e.target.closest('[data-home-status]');if(button){S.homeCorrection={filter:button.dataset.homeStatus};navigate('correction');}};}

async function renderProposals(navigation){
 if(typeof BETA_PROPOSALS!=="undefined"&&BETA_PROPOSALS)return renderDemoProposals(navigation);
 const d=S.cache.proposalStage||(S.cache.proposalStage=structuredClone(await teacherProposals(true)));
 d.recent=d.recent||[];d.recent.forEach(r=>r._hidden=r.status==='closed');
 if(!navigationCurrent(navigation))return;$('view').innerHTML=header('Propostas','Crie e organize suas propostas.',`<button class="btn primary" id="newProposal">Nova proposta</button>`)+`<div class="safe-note">As alterações são salvas no banco. Publique para disponibilizar a proposta aos alunos.</div><div id="proposalEditor"></div><div class="toolbar edit-filters"><label>Buscar proposta<input id="propSearch" type="search" placeholder="Tema ou número"></label><label>Exibir<select id="propFilter"><option value="all">Todas</option><option value="visible">Publicadas</option><option value="draft">Rascunhos</option><option value="hidden">Ocultas</option></select></label></div><div class="box"><div class="box-head"><h2>Propostas</h2><p id="propCount"></p></div><div class="box-body list" id="proposalList"></div></div>`;
 renderProposalList(d);
 $('newProposal').onclick=()=>proposalEditor(null,d);
 $('propSearch').oninput=()=>renderProposalList(d);$('propFilter').onchange=()=>renderProposalList(d);
 $('proposalList').onclick=async e=>{
 const b=e.target.closest('[data-prop-action]');if(!b||b.disabled)return;const r=d.recent.find(x=>String(x.id)===b.dataset.id);if(!r)return;
 const action=b.dataset.propAction;if(action==='edit')return proposalEditor(r,d);
 if(action==='delete'&&!await appConfirm('Excluir esta proposta do banco? Propostas com redações vinculadas não podem ser excluídas.'))return;
 b.disabled=true;
 try{
  if(action==='toggle'){const result=await edge(API.proposal,{action:'update_status',round_id:r.id,status:r._hidden?'published':'closed'});Object.assign(r,result.proposal);r._hidden=r.status==='closed';}
  else if(action==='delete'){await edge(API.proposal,{action:'delete',round_id:r.id});d.recent=d.recent.filter(x=>x!==r);if(d._editorId===r.id){d._editorToken=null;$('proposalEditor').innerHTML='';}}
  if($('proposalList')?.isConnected)renderProposalList(d);S.cache.directory=null;S.student=null;toast('Proposta atualizada no banco.');
 }catch(error){toast(error.message||'Não foi possível alterar a proposta.')}
 finally{b.disabled=false}
 };
}
function renderProposalList(d){
 const box=$('proposalList');if(!box)return;const search=($('propSearch')?.value||'').toLocaleLowerCase('pt-BR'),filter=$('propFilter')?.value||'all';
 const rows=d.recent.filter(r=>(!search||`${r.number||''} ${r.theme||''}`.toLocaleLowerCase('pt-BR').includes(search))&&(filter==='all'||filter==='hidden'&&r._hidden||filter==='visible'&&!r._hidden&&r.is_visible_to_students||filter==='draft'&&!r._hidden&&!r.is_visible_to_students));
 $('propCount').textContent=`${rows.length} de ${d.recent.length} proposta(s)`;
 box.innerHTML=rows.map(r=>`<div class="list-item"><div class="item-top"><div><div class="item-title">R${esc(r.number??'—')} · ${esc(r.theme)}</div><div class="item-meta">${fmtDate(r.due_date)} · ${r.target_count||0} turma(s) · ${r.motivator_count||0} motivador(es)</div></div><span class="pill ${r._hidden?'warn':r.is_visible_to_students?'ok':'warn'}">${r._hidden?'Oculta':r.is_visible_to_students?'Publicada':'Rascunho'}</span></div><div class="item-actions"><button class="btn soft-btn" data-prop-action="edit" data-id="${esc(r.id)}">Editar</button><button class="btn soft-btn" data-prop-action="toggle" data-id="${esc(r.id)}">${r._hidden?'Reexibir':'Ocultar'}</button><button class="btn ghost danger" data-prop-action="delete" data-id="${esc(r.id)}">Excluir</button></div></div>`).join('')||'<div class="empty">Nenhuma proposta para estes filtros.</div>';
}
async function proposalEditor(r,d){
 const ed=$('proposalEditor');if(!ed)return;const token={};d._editorToken=token;d._editorId=r?.id||null;
 ed.innerHTML='<div class="card">Abrindo editor…</div>';ed.scrollIntoView({behavior:'smooth',block:'start'});
 let detail=null;
 if(r&&!r._loaded&&!r._edited&&!String(r.id).startsWith('local-')){
  try{detail=await edge(API.proposal,{action:'get',round_id:r.id});}
  catch(e){if(d._editorToken!==token||!ed.isConnected)return;ed.innerHTML=`<div class="card"><p>${esc(e.message||'Não foi possível carregar os detalhes da proposta.')}</p><button class="btn soft-btn" id="retryProp">Tentar novamente</button><button class="btn ghost" id="closeProp">Fechar</button></div>`;$('retryProp').onclick=()=>proposalEditor(r,d);$('closeProp').onclick=()=>{d._editorToken=null;ed.innerHTML=''};return;}
 }
 if(d._editorToken!==token||!ed.isConnected)return;
 const p={...(r||{}),...(detail?.proposal||{})},mot=detail?.motivators||p._motivators||[],targets=detail?.targets||p._targets||[],orgs=d.organizations||[],project=one(p.project)||one(p.projects),initialOrg=project?.organization_id||p.organization_id||orgs[0]?.id||'';
 if(r&&detail)Object.assign(r,p,{_motivators:structuredClone(mot),_targets:structuredClone(targets),_loaded:true});
 const selected=new Set(targets.map(t=>t.class_id).filter(Boolean));
 const classChecks=orgId=>{const a=d.classes_by_org?.[orgId]||[];return a.map(c=>`<label class="check-row"><input type="checkbox" value="${esc(c.id)}" ${selected.has(c.id)?'checked':''}><span>${esc(c.name)}</span></label>`).join('')||'<p>Nenhuma turma disponível nesta instituição.</p>'};
 ed.innerHTML=`<div class="box local-editor"><div class="box-head editor-head"><h2>${r?'Editar proposta':'Nova proposta'}</h2><button id="closeProp" class="btn ghost">Fechar</button></div><div class="box-body"><div class="grid cols2"><label class="field"><small>Instituição</small><select id="peOrg">${orgs.map(o=>`<option value="${esc(o.id)}" ${o.id===initialOrg?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label><label class="field"><small>Prazo (opcional)</small><input id="peDue" type="date" value="${esc(String(p.due_date||'').slice(0,10))}"></label></div><label class="field"><small>Tema</small><input id="peTheme" value="${esc(p.theme||'')}"></label><label class="field"><small>Eixo temático</small><input id="peAxis" value="${esc(p.thematic_axis||'')}" placeholder="Ex.: Educação, Saúde, Tecnologia"></label><label class="field"><small>Comando</small><textarea id="peCommand">${esc(p.proposal_command||'')}</textarea></label><label class="field"><small>Entenda o que o tema está pedindo</small><textarea id="peUnderstand">${esc(p.understand_prompt||'')}</textarea></label><div class="field"><small>Textos motivadores</small><div id="peMotList">${(mot.length?mot:[{body:''}]).map((m,i)=>`<label class="field"><small>Texto ${i+1}</small><textarea data-motivator>${esc(m.body||'')}</textarea></label>`).join('')}</div><button class="btn soft-btn" id="addMot">Adicionar texto</button></div><div class="field"><small>Turmas destinatárias</small><div class="item-actions"><button class="btn ghost" id="selectPropClasses">Selecionar todas</button><button class="btn ghost" id="clearPropClasses">Limpar seleção</button></div><div id="peClasses" class="check-grid">${classChecks(initialOrg)}</div></div><div id="propStatus" class="form-status" role="status" aria-live="polite"></div><div class="item-actions editor-footer"><button id="saveProp" class="btn primary">Salvar alterações</button><button id="draftProp" class="btn soft-btn">Salvar como rascunho</button><button id="publishProp" class="btn soft-btn">Publicar para alunos</button></div></div></div>`;
 $('closeProp').onclick=()=>{d._editorToken=null;ed.innerHTML=''};
 $('peOrg').onchange=()=>{selected.clear();$('peClasses').innerHTML=classChecks($('peOrg').value)};
 $('selectPropClasses').onclick=()=>ed.querySelectorAll('#peClasses input').forEach(x=>x.checked=true);
 $('clearPropClasses').onclick=()=>ed.querySelectorAll('#peClasses input').forEach(x=>x.checked=false);
 $('addMot').onclick=()=>{const label=document.createElement('label');label.className='field';label.innerHTML=`<small>Texto ${ed.querySelectorAll('[data-motivator]').length+1}</small><textarea data-motivator></textarea>`;$('peMotList').append(label);label.querySelector('textarea').focus()};
 let saving=false;const apply=async publish=>{
  if(saving)return;
  const status=$('propStatus'),theme=$('peTheme').value.trim(),command=$('peCommand').value.trim(),orgId=$('peOrg').value,values=[...ed.querySelectorAll('[data-motivator]')].map(x=>x.value.trim()),classIds=[...ed.querySelectorAll('#peClasses input:checked')].map(x=>x.value);
  const fail=text=>{status.textContent=text;status.scrollIntoView({block:'nearest'})};
  if(!orgId||!theme||!command)return fail('Preencha instituição, tema e comando.');
  if(!values.some(Boolean))return fail('Inclua ao menos um texto motivador.');
  if(publish&&!classIds.length)return fail('Selecione pelo menos uma turma para publicar.');
  const motivators=values.map((body,i)=>({...mot[i],body})).filter(x=>x.body);
  saving=true;const buttons=['saveProp','draftProp','publishProp'].map($);buttons.forEach(b=>b.disabled=true);
  try{
   const result=await edge(API.proposal,{action:'save',round_id:r?.id,organization_id:orgId,theme,thematic_axis:$('peAxis').value.trim(),proposal_command:command,understand_prompt:$('peUnderstand').value.trim(),due_date:$('peDue').value||null,class_ids:classIds,motivators,publish});
   if(!result.ok||!result.proposal?.id)throw Error('O servidor não confirmou a proposta.');
   if(!r){r={id:result.proposal.id};d.recent.unshift(r);d._editorId=r.id;}
   Object.assign(r,result.proposal,{proposal_command:command,thematic_axis:$('peAxis').value.trim(),organization_id:orgId,project:{organization_id:orgId},target_count:classIds.length,motivator_count:motivators.length,_hidden:false,_loaded:false,_edited:false});
   S.cache.directory=null;S.student=null;
   if(d._editorToken===token&&ed.isConnected){renderProposalList(d);status.textContent='Proposta salva no banco.';}
   toast(publish?'Proposta publicada para os alunos.':'Proposta salva.');
  }catch(error){fail(error.message||'Não foi possível salvar a proposta.')}
  finally{saving=false;buttons.forEach(b=>b.disabled=false)}
 };
 $('saveProp').onclick=()=>apply(!!r?.is_visible_to_students);$('draftProp').onclick=()=>apply(false);$('publishProp').onclick=()=>apply(true);$('peTheme').focus({preventScroll:true});
}

async function loadDirectory(){if(S.cache.directory)return S.cache.directory;if(BETA_PROPOSALS&&S.profile.role==='teacher'){S.cache.directory=await edge(API.live,{action:'directory'});return S.cache.directory;}const [students,enr,classes,orgs,rounds]=await Promise.all([rest('students?is_active=eq.true&select=id,full_name,organization_id&order=full_name'),rest('enrollments?is_active=eq.true&select=student_id,class_id'),rest('classes?is_active=eq.true&select=id,name'),rest('organizations?select=id,name&order=name'),rest('rounds?is_visible_to_students=eq.true&status=neq.planned&select=id,number,theme,project_id,projects(organization_id)&order=number')]);S.cache.directory={students,enr,classes,orgs,rounds};return S.cache.directory}
async function renderLive(navigation){const d=await loadDirectory();if(!navigationCurrent(navigation))return;if(!d.classes.length||!d.students.length||!d.rounds.length){$('view').innerHTML=header('Receber redações','Receba uma redação pela câmera ou galeria.')+`<div class="box"><div class="box-body"><h2>Prepare a turma para receber redações</h2><p>${!d.classes.length?'Cadastre uma instituição e uma turma.':!d.students.length?'Importe os alunos da sua turma.':'Publique uma proposta para a turma.'}</p><button class="btn primary" id="liveSetup">${!d.classes.length||!d.students.length?'Organizar turma e alunos':'Abrir propostas'}</button></div></div>`;$('liveSetup').onclick=()=>navigate(!d.classes.length||!d.students.length?'teacher-organization':'proposals');return;}$('view').innerHTML=header('Receber redações','Captura consolidada com regra definitiva de uma página.')+`<section class="capture"><div class="box"><div class="box-head"><h2>Identificação da redação</h2><p>Instituição → turma → aluno → proposta.</p></div><div class="box-body upload-box"><label class="field"><small>Instituição</small><select id="lvOrg"></select></label><label class="field"><small>Turma</small><select id="lvClass"></select></label><label class="field"><small>Aluno</small><select id="lvStudent"></select></label><label class="field"><small>Proposta</small><select id="lvRound"></select></label><div class="drop"><b>Uma página por redação</b><p class="muted">Use câmera ou escolha uma imagem JPG, PNG ou WEBP.</p><p class="safe-note">${PHOTO_GUIDANCE}</p><div class="item-actions"><button id="lvCameraBtn" type="button" class="btn primary">Abrir câmera</button><button id="lvGalleryBtn" type="button" class="btn soft-btn">Enviar da galeria</button></div><input id="lvCamera" class="hidden" type="file" accept="image/*" capture="environment" aria-label="Fotografar redação"><input id="lvFile" class="hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher imagem da galeria"></div><div id="lvFeedback" role="status" aria-live="polite"></div><button id="lvSend" class="btn primary" disabled>Enviar para a fila</button><div class="safe-note">Selecione instituição, turma, aluno e proposta. Depois, fotografe ou escolha uma imagem e toque em Enviar para a fila. A correção com IA será iniciada separadamente, na área Correção.</div></div></div><div class="box"><div class="box-head"><h2>Prévia</h2><p>A redação deve ocupar exatamente uma página.</p></div><div class="box-body"><div class="preview" id="lvPreview"><div class="preview-placeholder">Selecione uma imagem para visualizar.</div></div></div></div></section>`;liveFill(d);$('lvOrg').onchange=()=>liveFill(d,'org');$('lvClass').onchange=()=>liveFill(d,'class');$('lvCameraBtn').onclick=()=>$('lvCamera').click();$('lvGalleryBtn').onclick=()=>$('lvFile').click();let selectedLiveFile=null,photoSequence=0;
const selectLiveFile=async e=>{
 const f=e.target.files?.[0];if(!f)return;const sequence=++photoSequence;
 selectedLiveFile=null;$('lvSend').disabled=true;
 if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>15*1024*1024){e.target.value='';$('lvFeedback').textContent='Use apenas uma imagem JPG, PNG ou WEBP de até 15 MB.';return}
 const u=URL.createObjectURL(f);$('lvPreview').innerHTML=`<img src="${u}" alt="Prévia da redação">`;
 const img=$('lvPreview').querySelector('img');img.onload=img.onerror=()=>URL.revokeObjectURL(u);
 $('lvFeedback').textContent='Verificando a imagem...';e.target.value='';
 try{const warnings=await inspectEssayPhoto(f);if(sequence!==photoSequence||!navigationCurrent(navigation))return;
  $('lvFeedback').textContent=warnings.length?warnings.join(' ')+' Você pode refazer a foto ou enviar esta imagem.':'Verificação inicial concluída. Amplie a prévia e confira a escrita; a análise automática não garante legibilidade.';
  selectedLiveFile=f;$('lvSend').disabled=false;
 }catch(error){if(sequence===photoSequence&&navigationCurrent(navigation))$('lvFeedback').textContent=error.message;}
};$('lvFile').onchange=selectLiveFile;$('lvCamera').onchange=selectLiveFile;$('lvSend').onclick=async()=>{
 const button=$('lvSend'),studentId=$('lvStudent').value,roundId=$('lvRound').value,file=selectedLiveFile;
 if(button.disabled)return;
 if(!studentId||!roundId||!file)return toast('Selecione aluno, proposta e imagem.');
 const controls=['lvOrg','lvClass','lvStudent','lvRound','lvCameraBtn','lvGalleryBtn'].map($);
 controls.forEach(x=>x.disabled=true);button.disabled=true;button.textContent='Enviando...';
 try{
  const started=await edge(API.live,{action:'start',student_id:studentId,round_id:roundId});
  if(!started.submission?.id)throw Error('O servidor não confirmou a redação.');
  await uploadEssay(API.live,{action:'upload',submission_id:started.submission.id,page_number:1},file);
  await edge(API.live,{action:'finalize',submission_id:started.submission.id});
  selectedLiveFile=null;S.cache={};if(!navigationCurrent(navigation))return;$('lvFeedback').textContent='Redação enviada. Abra o menu Correção para revisar e iniciar a correção manual ou com IA.';toast('Redação enviada para a fila.');
 }catch(e){const message=(e.message||'').includes('captura bloqueada')?'Envio não realizado: já existe uma redação deste aluno nesta proposta com a correção iniciada. Abra Correção para continuar a redação existente. Para enviar uma nova redação, selecione outra proposta. A imagem selecionada foi mantida.':(e.message||'Não foi possível enviar. Confira a conexão e tente novamente. A imagem selecionada foi mantida.');if(navigationCurrent(navigation))$('lvFeedback').textContent=message;}
 finally{controls.forEach(x=>x.disabled=false);button.disabled=!selectedLiveFile;button.textContent='Enviar para a fila'}
}}
