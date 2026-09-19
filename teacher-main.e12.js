'use strict';
async function renderHome(navigation){const [q,p]=await Promise.all([teacherQueue(),teacherProposals()]);const pending=q.filter(x=>!x.score&&x.page_count>0).length,validation=q.filter(x=>x.score&&!x.score.is_approved).length;if(!navigationCurrent(navigation))return;$('view').innerHTML=header('Início','Veja o que precisa da sua atenção.')+`<section class="home-compact-pending" aria-label="Pendências">${pending?`<button class="home-task" data-home-status="uncorrected"><span>${pending} ${pending===1?'redação aguardando':'redações aguardando'} correção</span><span class="home-task-link">Abrir</span></button>`:''}${validation?`<button class="home-task" data-home-status="validation"><span>${validation} ${validation===1?'correção aguardando':'correções aguardando'} validação</span><span class="home-task-link">Abrir</span></button>`:''}${!pending&&!validation?'<p class="home-current">Nenhuma correção pendente.</p>':''}</section><section class="grid cols2" style="margin-top:12px"><article class="box"><div class="box-head"><h2>Fila recente</h2><p>Últimas redações disponíveis para correção.</p></div><div class="box-body list">${q.slice(0,5).map(x=>{const [s,c]=statusLabel(x);return `<div class="list-item"><div class="item-top"><div><div class="item-title">${esc(x.student_name)}</div><div class="item-meta">${esc(x.class_name)} · R${esc(x.round_number??'—')} · ${esc(x.theme||'Proposta')}</div></div><span class="pill ${c}">${s}</span></div></div>`}).join('')||'<div class="empty">Nenhuma redação na fila.</div>'}</div></article><article class="box"><div class="box-head"><h2>Propostas recentes</h2><p>Visão consolidada das propostas.</p></div><div class="box-body list">${(p.recent||[]).slice(0,5).map(r=>`<div class="list-item"><div class="item-top"><div><div class="item-title">R${esc(r.number??'—')} · ${esc(r.theme)}</div><div class="item-meta">${r.target_count||0} destinatário(s) · ${r.motivator_count||0} texto(s) motivador(es)</div></div><span class="pill ${r.is_visible_to_students?'ok':'warn'}">${r.is_visible_to_students?'Publicada':'Rascunho'}</span></div></div>`).join('')||'<div class="empty">Nenhuma proposta recente.</div>'}</div></article></section>`;$('view').onclick=e=>{const button=e.target.closest('[data-home-status]');if(button){S.homeCorrection={filter:button.dataset.homeStatus};navigate('correction');}};}

async function renderTeacherAccount(navigation){
 const data=await edge(API.credit,{action:'packages'});if(!navigationCurrent(navigation))return;
 const balance=Number(data.balance||0),lowCredit=balance<=200;
 const money=value=>Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
 $('view').innerHTML=header('Conta e créditos','Seu saldo, seus dados e mais tempo para ensinar.')+`<div class="credit-page">
 <section class="credit-summary" aria-label="Resumo da conta">
 <div class="credit-balance"><span>Créditos disponíveis</span><strong>${balance}</strong><p>1 crédito por correção ou proposta com IA</p></div>
 <div class="credit-person"><strong>${esc(S.profile.full_name||'Professor')}</strong><p>${esc(S.profile.email||'')}</p><span class="credit-gift">Seu início na Versão inclui ${Number(data.freemium||30)} créditos gratuitos.</span></div>
 </section>
 ${lowCredit?`<p class="credit-notice" role="status">${balance===0?'Seu saldo acabou. Escolha um pacote para continuar corrigindo.':`Você tem ${balance} créditos disponíveis. Quando precisar, adicione mais créditos abaixo.`}</p>`:''}
 <section class="credit-shop" aria-labelledby="creditShopTitle"><div class="credit-shop-heading"><h2 id="creditShopTitle">Mais correções, no seu ritmo</h2><p>Escolha o pacote que acompanha sua rotina.</p></div>
 <div class="credit-packages">${(data.packages||[]).map(p=>`<article class="credit-package"><h3>${Number(p.credits)} <span>créditos</span></h3><p class="credit-price"><span>R$</span> ${money(p.amount_cents/100)}</p><p class="credit-unit">R$ ${money(p.amount_cents/100/p.credits)} por crédito</p><button class="credit-buy" data-buy-credit="${esc(p.code)}">Comprar créditos<span class="sr-only"> · ${Number(p.credits)} créditos</span></button></article>`).join('')}</div>
 <p class="credit-footnote">Pagamento pelo Mercado Pago · Pix ou cartão</p>
 <p class="credit-footnote">Se a correção ou a criação da proposta falhar, o crédito é devolvido.</p></section></div>`;
 $('view').onclick=async e=>{const button=e.target.closest('[data-buy-credit]');if(!button||button.disabled)return;button.disabled=true;const old=button.textContent;button.textContent='Abrindo pagamento…';try{const result=await edge(API.credit,{action:'checkout',package_code:button.dataset.buyCredit});if(!/^https:\/\//.test(result.checkout_url||''))throw Error('O servidor não retornou um checkout seguro.');location.assign(result.checkout_url)}catch(error){toast(error.message||'Não foi possível abrir o pagamento.');button.disabled=false;button.textContent=old}};
}

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
async function renderLive(navigation){const d=await loadDirectory();if(!navigationCurrent(navigation))return;if(!d.classes.length||!d.students.length||!d.rounds.length){$('view').innerHTML=header('Ao Vivo','Receba uma redação pela câmera ou galeria.')+`<div class="box"><div class="box-body"><h2>Prepare a turma para receber redações</h2><p>${!d.classes.length?'Cadastre uma instituição e uma turma.':!d.students.length?'Importe os alunos da sua turma.':'Publique uma proposta para a turma.'}</p><button class="btn primary" id="liveSetup">${!d.classes.length||!d.students.length?'Organizar turma e alunos':'Abrir propostas'}</button></div></div>`;$('liveSetup').onclick=()=>navigate(!d.classes.length||!d.students.length?'teacher-organization':'proposals');return;}$('view').innerHTML=header('Ao vivo','Captura consolidada com regra definitiva de uma página.')+`<section class="capture"><div class="box"><div class="box-head"><h2>Identificação da redação</h2><p>Instituição → turma → aluno → proposta.</p></div><div class="box-body upload-box"><label class="field"><small>Instituição</small><select id="lvOrg"></select></label><label class="field"><small>Turma</small><select id="lvClass"></select></label><label class="field"><small>Aluno</small><select id="lvStudent"></select></label><label class="field"><small>Proposta</small><select id="lvRound"></select></label><div class="drop"><b>Uma página por redação</b><p class="muted">Use câmera ou escolha uma imagem JPG, PNG ou WEBP.</p><div class="item-actions"><button id="lvCameraBtn" type="button" class="btn primary">Abrir câmera</button><button id="lvGalleryBtn" type="button" class="btn soft-btn">Enviar da galeria</button></div><input id="lvCamera" class="hidden" type="file" accept="image/*" capture="environment" aria-label="Fotografar redação"><input id="lvFile" class="hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher imagem da galeria"></div><div id="lvFeedback" role="status" aria-live="polite"></div><button id="lvSend" class="btn primary" disabled>Enviar para a fila</button><div class="safe-note">Selecione instituição, turma, aluno e proposta. Depois, fotografe ou escolha uma imagem e toque em Enviar para a fila. A correção com IA será iniciada separadamente, na área Correção.</div></div></div><div class="box"><div class="box-head"><h2>Prévia</h2><p>A redação deve ocupar exatamente uma página.</p></div><div class="box-body"><div class="preview" id="lvPreview"><div class="preview-placeholder">Selecione uma imagem para visualizar.</div></div></div></div></section>`;liveFill(d);$('lvOrg').onchange=()=>liveFill(d,'org');$('lvClass').onchange=()=>liveFill(d,'class');$('lvCameraBtn').onclick=()=>$('lvCamera').click();$('lvGalleryBtn').onclick=()=>$('lvFile').click();let selectedLiveFile=null;const selectLiveFile=e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>15*1024*1024){$('lvPreview').innerHTML='<div class="preview-placeholder">Selecione uma imagem válida.</div>';selectedLiveFile=null;$('lvSend').disabled=true;e.target.value='';toast('Use apenas uma imagem JPG, PNG ou WEBP de até 15 MB.');return}selectedLiveFile=f;const u=URL.createObjectURL(f);$('lvPreview').innerHTML=`<img src="${u}" alt="Prévia da redação">`;$('lvPreview').querySelector('img').onload=()=>URL.revokeObjectURL(u);$('lvSend').disabled=false;e.target.value=''};$('lvFile').onchange=selectLiveFile;$('lvCamera').onchange=selectLiveFile;$('lvSend').onclick=async()=>{
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
function liveFill(d,change){const classBy=new Map(d.classes.map(x=>[x.id,x])),orgSel=$('lvOrg'),clsSel=$('lvClass'),stSel=$('lvStudent'),rdSel=$('lvRound');if(!orgSel.options.length)orgSel.innerHTML='<option value="">Selecione</option>'+d.orgs.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join('');const oid=orgSel.value,studentIds=new Set(d.students.filter(s=>s.organization_id===oid).map(s=>s.id)),classIds=new Set(d.enr.filter(e=>studentIds.has(e.student_id)).map(e=>e.class_id));const keepC=change==='org'?'':clsSel.value;clsSel.innerHTML='<option value="">Selecione</option>'+d.classes.filter(c=>classIds.has(c.id)).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');if([...clsSel.options].some(o=>o.value===keepC))clsSel.value=keepC;const cid=clsSel.value,ids=cid?new Set(d.enr.filter(e=>e.class_id===cid).map(e=>e.student_id)):studentIds;stSel.innerHTML='<option value="">Selecione</option>'+d.students.filter(s=>ids.has(s.id)).map(s=>`<option value="${s.id}">${esc(s.full_name)}</option>`).join('');rdSel.innerHTML='<option value="">Selecione</option>'+d.rounds.filter(r=>one(r.projects)?.organization_id===oid).map(r=>`<option value="${r.id}">R${esc(r.number??'—')} · ${esc(r.theme)}</option>`).join('')}

async function renderDemoProposals(navigation){
 const data=await edge(API.proposal,{action:'bootstrap'});
 const demoInstitutions=(data.organizations||[]).map(o=>({...o,classes:data.classes_by_org[o.id]||[]}));
 const rows=await Promise.all((data.recent||[]).map(async r=>{const d=await edge(API.proposal,{action:'get',round_id:r.id});return {...r,...d.proposal,_motivators:d.motivators||[],targets:(d.targets||[]).map(t=>t.class_id).filter(Boolean)}}));
 let demoProposals=rows.map(r=>({...r,axis:r.thematic_axis,command:r.proposal_command,commandHtml:r.proposal_html,organizationId:r.project?.organization_id,status:r.status==='closed'?'Oculta':r.is_visible_to_students?'Publicada':'Rascunho'}));
 if(!navigationCurrent(navigation))return;
 $('view').innerHTML=header('Propostas','Crie e publique propostas para suas instituições.')+`<div class="safe-note">Ambiente de teste conectado à base atual. Salvar e publicar gravam dados reais.</div><div class="item-actions"><button class="btn soft-btn" id="proposalCreateTab">Criar proposta</button><button class="btn ghost" id="proposalListTab">Propostas criadas</button></div><section class="box" id="proposalCreation"><div class="box-body"><form id="demoProposalForm"><label class="field"><strong>Tema</strong><input id="demoTheme" required maxlength="250"></label><label class="field">Eixo temático<select id="demoAxis" required><option value="">Selecione um eixo</option>${['Educação','Tecnologia','Meio ambiente','Saúde','Cultura','Cidadania e direitos humanos','Trabalho e economia'].map(x=>`<option>${x}</option>`).join('')}</select></label><div class="item-actions"><button type="button" class="btn soft-btn" id="demoGenerate">Criação Inteligente</button><span class="muted" id="proposalCredits">1 crédito por proposta concluída. Consultando saldo…</span></div><div id="proposalCreditNotice" class="safe-note" role="alert" hidden><p id="proposalCreditMessage"></p><div id="proposalCreditRecharge"></div></div><div><label id="demoTextLabel">Comando da proposta</label><div class="demo-editor"><div class="item-actions" id="demoFormat" role="toolbar" aria-label="Formatação do texto"><button type="button" class="btn soft-btn" data-format="bold"><strong>Negrito</strong></button><button type="button" class="btn soft-btn" data-format="italic"><em>Itálico</em></button><button type="button" class="btn soft-btn" data-format="insertUnorderedList">Lista</button><button type="button" class="btn soft-btn" data-format="undo">Desfazer</button></div><div id="demoCommand" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="demoTextLabel" data-placeholder="Escreva a orientação ao aluno..."></div></div></div><label class="field">Entenda o tema<textarea id="demoUnderstand" placeholder="Delimite a problemática, o contexto e os limites do tema."></textarea></label><div class="field"><strong>Textos motivadores</strong><p class="muted">Inclua textos complementares e suas fontes. Eles serão enviados junto com o tema para a correção.</p><div id="demoMotivators"></div><button type="button" class="btn soft-btn" id="demoAddMotivator">Adicionar texto motivador</button></div><label class="demo-check"><input type="checkbox" id="demoAll"> Todas as instituições</label><div id="demoScope"><label class="field">Instituição<select id="demoOrg"><option value="">Selecione uma instituição</option>${demoInstitutions.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></label><fieldset id="demoClassGroup" hidden><legend>Turmas</legend><div id="demoTargets"></div></fieldset></div><p id="demoSummary" role="status"></p><div class="item-actions"><button type="button" class="btn soft-btn" id="demoDraft">Salvar rascunho</button><button class="btn primary" type="submit">Publicar</button></div></form></div></section><div id="demoList" class="list" hidden></div>`;
 let editing=null,writing=false,generationId=null,publicationId=null;

 const creation=$('proposalCreation'),list=$('demoList');
 const showCreation=()=>{creation.hidden=false;list.hidden=true};
 $('proposalCreateTab').onclick=()=>{if(editing){renderDemoProposals(navigation);return}showCreation()};
 $('proposalListTab').onclick=()=>{creation.hidden=true;list.hidden=false};
 let motivationRows=[];
 const setMotivators=rows=>{motivationRows=rows.map(m=>({...m}));$('demoMotivators').innerHTML=rows.map((m,i)=>`<fieldset data-motivator-row><legend>Texto motivador ${i+1}</legend><label class="field">Título<input data-mot="title" value="${esc(m.title||'')}"></label><label class="field">Texto<textarea data-mot="body">${esc(m.body||'')}</textarea></label><label class="field">Fonte / autoria<input data-mot="source_label" value="${esc(m.source_label||'')}" placeholder="Adaptado de: publicação, autor"></label><label class="field">Link da fonte<input type="url" data-mot="source_url" value="${esc(m.source_url||'')}"></label><button type="button" class="btn ghost" data-remove-mot="${i}">Remover texto</button></fieldset>`).join('')};
 const readMotivators=()=>[...$('demoMotivators').querySelectorAll('[data-motivator-row]')].map((row,i)=>({...motivationRows[i],...Object.fromEntries([...row.querySelectorAll('[data-mot]')].map(el=>[el.dataset.mot,el.value.trim()]))}));
 $('demoAddMotivator').onclick=()=>setMotivators([...readMotivators(),{body:''}]);
 $('demoMotivators').onclick=e=>{const b=e.target.closest('[data-remove-mot]');if(b)setMotivators(readMotivators().filter((_,i)=>i!==Number(b.dataset.removeMot)))};
 setMotivators([{body:''}]);
 const refreshCredits=async()=>{try{const c=await edge(API.proposal,{action:'credits'});if(navigationCurrent(navigation))$('proposalCredits').textContent=`1 crédito por proposta concluída. Saldo: ${c.balance} crédito(s). Fontes pesquisadas na web; revise antes de publicar.`}catch{if(navigationCurrent(navigation))$('proposalCredits').textContent='1 crédito por proposta concluída. Não foi possível consultar o saldo.'}};
 refreshCredits();
 $('demoAxis').onchange=()=>{generationId=null};
 const cleanHtml=proposalHtml;
 const editor=$('demoCommand');
 let selection=null;
 const remember=()=>{const sel=window.getSelection();if(sel.rangeCount&&editor.contains(sel.anchorNode)&&editor.contains(sel.focusNode))selection=sel.getRangeAt(0).cloneRange()};
 editor.onkeyup=remember;editor.onmouseup=remember;editor.oninput=remember;editor.onblur=remember;
 editor.onpaste=e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));remember()};
 editor.ondrop=e=>e.preventDefault();
 $('demoFormat').onmousedown=e=>{if(e.target.closest('button'))e.preventDefault()};
 $('demoFormat').onclick=e=>{const b=e.target.closest('[data-format]');if(!b)return;editor.focus();if(selection&&editor.contains(selection.commonAncestorContainer)){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(selection)}document.execCommand(b.dataset.format,false,null);remember();};
 const preview=()=>{};
 $('demoGenerate').onclick=async()=>{
  const button=$('demoGenerate'),axis=$('demoAxis').value;if(button.disabled)return;
  if(!axis)return toast('Selecione o eixo temático.');
  $('proposalCreditNotice').hidden=true;
  button.disabled=true;let unlock=()=>{};
  try{
   if(!await appConfirm('Usar 1 crédito para criar tema e textos motivadores com pesquisa de fontes? O conteúdo atual será substituído. Em caso de falha, o crédito será devolvido.'))return;
   if(!navigationCurrent(navigation))return;
   unlock=generationScreen('Sua proposta está sendo gerada…');
   const key='versao-proposal-request:'+S.session.user.id+':'+axis;
   try{generationId=generationId||localStorage.getItem(key)}catch{}
   generationId=generationId||crypto.randomUUID();
   try{localStorage.setItem(key,generationId)}catch{}
   const result=await edge(API.proposal,{action:'generate',thematic_axis:axis,request_id:generationId});
   if(!navigationCurrent(navigation))return;
   $('demoTheme').value=result.proposal.theme;editor.textContent=result.proposal.proposal_command;$('demoUnderstand').value=result.proposal.understand_prompt||'';setMotivators(result.proposal.motivators||[]);try{localStorage.removeItem('versao-proposal-request:'+S.session.user.id+':'+axis)}catch{}generationId=null;selection=null;toast('Proposta criada. Revise antes de publicar.');
  }catch(error){if(error.code==='INSUFFICIENT_CREDITS'){$('proposalCreditMessage').textContent=error.message;$('proposalCreditNotice').hidden=false;$('proposalCreditNotice').scrollIntoView({block:'center',behavior:'smooth'});}
   if(error.refunded){try{localStorage.removeItem('versao-proposal-request:'+S.session.user.id+':'+axis)}catch{}generationId=null;}toast(error.message)}finally{unlock();button.disabled=false;refreshCredits()}
 };
 preview();
 const targets=()=>[...document.querySelectorAll('#demoTargets input')];
 const selectedTargets=()=>$('demoAll').checked?demoInstitutions.flatMap(o=>o.classes.map(c=>c.id)):targets().filter(x=>x.checked).map(x=>x.value);
 const summarize=()=>{$('demoSummary').textContent=$('demoAll').checked?'A proposta será disponibilizada para todas as instituições, incluindo todas as suas turmas.':selectedTargets().length+' turma(s) selecionada(s)';};
 const fillClasses=()=>{const org=demoInstitutions.find(o=>o.id===$('demoOrg').value);$('demoClassGroup').hidden=!org;$('demoTargets').innerHTML=org?org.classes.map((c,i)=>`<label class="demo-check"><input type="checkbox" name="target" value="${c.id}"> ${esc(c.name)}</label>`).join(''):'';targets().forEach(x=>x.onchange=summarize);summarize()};
 $('demoAll').onchange=()=>{$('demoScope').hidden=$('demoAll').checked;summarize()};
 $('demoOrg').onchange=fillClasses;
 const draw=()=>{$('demoList').innerHTML=demoProposals.map(r=>`<article class="list-item"><b>${esc(r.theme)}</b><p class="muted">Eixo: ${esc(r.axis||'Não informado')}</p><div class="demo-text-preview">${cleanHtml(r.commandHtml||esc(r.command))}</div><p>${esc(r.status)} · ${r.targets.length} turma(s)</p><div class="item-actions"><button class="btn soft-btn" data-edit="${r.id}">Editar</button><button class="btn soft-btn" data-hide="${r.id}">${r.status==='Oculta'?'Reexibir':'Ocultar'}</button><button class="btn ghost" data-delete="${r.id}">Excluir</button></div></article>`).join('')||'<div class="empty">Nenhuma proposta criada.</div>'};
 const save=async publish=>{
  if(writing)return;
  if(!$('demoProposalForm').reportValidity())return;
  if(!editor.innerText.trim()){toast('Preencha o texto da proposta.');editor.focus();return;}
  const motivators=readMotivators().filter(m=>m.body);if(!motivators.length){toast('Inclua ao menos um texto motivador.');return}if(publish&&motivators.some(m=>!m.source_label||!/^https?:\/\//i.test(m.source_url))){toast('Informe a fonte e o link de cada texto motivador.');return}
  const selected=selectedTargets();
  if(publish&&!selected.length){$('demoSummary').textContent='Selecione pelo menos uma turma ou marque todas as instituições.';return}
  if(publish&&!await appConfirm('Publicar para '+selected.length+' turmas? A proposta ficará disponível aos alunos.'))return;
  if(!navigationCurrent(navigation))return;
  const r={id:editing||crypto.randomUUID(),theme:$('demoTheme').value.trim(),command:editor.innerText.trim(),commandHtml:cleanHtml(editor.innerHTML),axis:$('demoAxis').value,targets:[...new Set(selected)],allInstitutions:$('demoAll').checked,organizationId:$('demoOrg').value,status:publish?'Publicada':'Rascunho'};
  if(!r.theme||!r.command)return;
  writing=true;const buttons=[...$('demoProposalForm').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  try{
   const existing=demoProposals.find(x=>x.id===editing);
   const payload={theme:r.theme,thematic_axis:r.axis,proposal_command:r.command,proposal_html:r.commandHtml,publish,organization_id:r.organizationId,due_date:existing?.due_date||null,understand_prompt:$('demoUnderstand').value.trim(),class_ids:r.targets,motivators};
   if(r.allInstitutions){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({actor:S.session.user.id,payload})));const hex=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,32);publicationId=[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');const result=await edge(API.proposal,{...payload,action:'save_all',request_id:publicationId});if(result.skipped_organizations?.length)toast('Sem turmas ativas: '+result.skipped_organizations.join(', '));}
   else await edge(API.proposal,{...payload,action:'save',round_id:editing||undefined});
   if(navigationCurrent(navigation)){await renderDemoProposals(navigation);if(navigationCurrent(navigation)){$('proposalListTab').click();const notice=document.createElement('div');notice.className='safe-note';notice.setAttribute('role','status');notice.textContent=publish?'Proposta publicada com sucesso. Ela está na lista abaixo.':'Rascunho salvo com sucesso. Ele está na lista abaixo.';$('demoList').prepend(notice);}}
  }catch(error){toast(error.message)}finally{writing=false;buttons.forEach(b=>b.disabled=false)}

 };
 $('demoProposalForm').onsubmit=e=>{e.preventDefault();save(true)};$('demoDraft').onclick=()=>save(false);
 $('demoList').onclick=async e=>{
  const b=e.target.closest('button');if(!b)return;
  const id=b.dataset.edit||b.dataset.hide||b.dataset.delete,r=demoProposals.find(x=>x.id===id);if(!r)return;
  if(b.dataset.edit){showCreation();editing=id;$('demoUnderstand').value=r.understand_prompt||'';setMotivators(r._motivators||[]);$('demoAll').disabled=true;$('demoOrg').disabled=true;$('demoTheme').value=r.theme;editor.innerHTML=cleanHtml(r.commandHtml||esc(r.command));selection=null;$('demoAxis').value=r.axis||'';preview();$('demoAll').checked=!!r.allInstitutions;$('demoScope').hidden=!!r.allInstitutions;$('demoOrg').value=r.organizationId||'';fillClasses();targets().forEach(x=>x.checked=r.targets.includes(x.value));summarize();$('demoTheme').focus();return}
  if(b.dataset.delete&&!await appConfirm('Excluir esta proposta? Registros com redações não podem ser excluídos.'))return;
  b.disabled=true;
  try{
   await edge(API.proposal,b.dataset.hide?{action:'update_status',round_id:id,status:r.status==='Oculta'?'published':'closed'}:{action:'delete',round_id:id});
   if(navigationCurrent(navigation))await renderDemoProposals(navigation);
  }catch(error){toast(error.message)}finally{b.disabled=false}

 };$('demoAll').disabled=S.profile.role!=='super_admin';summarize();draw();
 const home=S.homeProposal;S.homeProposal=null;
 if(home&&home.intent!=='create'){
  $('proposalListTab').click();
  if(home.ids){for(const article of $('demoList').querySelectorAll('article'))article.hidden=!home.ids.includes(article.querySelector('[data-edit]')?.dataset.edit);}
  if(home.target){const button=$('demoList').querySelector('[data-edit="'+home.target+'"]');if(button)button.click();}
 }

}

