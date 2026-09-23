'use strict';
(function(){
 function ensureProposalV2Style(){
  if(document.getElementById('teacherProposalV2Style'))return;
  const style=document.createElement('style');
  style.id='teacherProposalV2Style';
  style.textContent=`
  .proposal-v2{max-width:1060px;display:grid;gap:18px}
  .proposal-v2-toolbar{display:flex;align-items:end;gap:12px;flex-wrap:wrap}
  .proposal-v2-toolbar .field{flex:1 1 220px}.proposal-v2-toolbar .field:last-child{flex:0 1 180px}
  .proposal-v2-editor{display:grid;gap:20px}.proposal-v2-section{border:1px solid var(--line,#e5dfdc);border-radius:16px;padding:20px;background:#fff;display:grid;gap:16px}
  .proposal-v2-section>header h2{margin:0;font-size:18px}.proposal-v2-section>header p{margin:5px 0 0;color:var(--muted,#667085);font-size:13px;line-height:1.5}
  .proposal-v2-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.proposal-v2-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.proposal-v2-actions.end{justify-content:flex-end}
  .proposal-v2-motivator{border:1px solid var(--line,#e5dfdc);border-radius:14px;padding:16px;display:grid;gap:12px;background:#fff}.proposal-v2-motivator legend{font-weight:750;padding:0 5px}
  .proposal-v2-motivator textarea{min-height:150px}.proposal-v2-note{font-size:13px;color:var(--muted,#667085);line-height:1.5}
  .proposal-v2-targets{display:grid;gap:12px}.proposal-v2-target-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.proposal-v2-target-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px}
  .proposal-v2-target-list .demo-check{padding:8px 10px;border:1px solid var(--line,#e5dfdc);border-radius:10px;background:#fff}
  .proposal-v2-summary{margin:0;font-size:13px;color:var(--muted,#667085)}
  .proposal-v2-footer{position:sticky;bottom:0;padding:14px 0 2px;background:linear-gradient(to top,#fff 72%,transparent);z-index:3;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}
  .proposal-v2-list{display:grid;gap:10px}.proposal-v2-list .list-item{border:1px solid var(--line,#e5dfdc);border-radius:14px;background:#fff;padding:16px}
  .proposal-v2-success{width:min(440px,calc(100% - 32px));border:1px solid var(--line,#ddd);border-radius:18px;padding:24px;background:#fff}.proposal-v2-success::backdrop{background:rgba(0,0,0,.4)}.proposal-v2-success h2{margin:0 0 10px}.proposal-v2-success p{line-height:1.55}.proposal-v2-success .item-actions{justify-content:flex-end}
  @media(max-width:760px){.proposal-v2-grid,.proposal-v2-target-list{grid-template-columns:1fr}.proposal-v2-section{padding:16px}.proposal-v2-footer .btn{flex:1 1 150px}}
  `;
  document.head.appendChild(style);
 }

 function proposalNotice(title,message){
  return new Promise(resolve=>{
   const dialog=document.createElement('dialog');
   dialog.className='proposal-v2-success';
   dialog.innerHTML=`<h2>${esc(title)}</h2><p>${esc(message)}</p><div class="item-actions"><button class="btn primary" type="button">OK</button></div>`;
   document.body.appendChild(dialog);
   const finish=()=>{dialog.close();dialog.remove();resolve()};
   dialog.querySelector('button').onclick=finish;
   dialog.oncancel=e=>{e.preventDefault();finish()};
   dialog.showModal();
   dialog.querySelector('button').focus();
  });
 }

 async function renderDemoProposalsV2(navigation){
  ensureProposalV2Style();
  const data=await edge(API.proposal,{action:'bootstrap'});
  const institutions=(data.organizations||[]).map(o=>({...o,classes:data.classes_by_org?.[o.id]||[]}));
  const details=await Promise.all((data.recent||[]).map(async r=>{
   try{const d=await edge(API.proposal,{action:'get',round_id:r.id});return {...r,...d.proposal,_motivators:d.motivators||[],targets:(d.targets||[]).map(t=>t.class_id).filter(Boolean)}}
   catch{return {...r,_motivators:[],targets:[]}}
  }));
  let proposals=details.map(r=>({...r,axis:r.thematic_axis,command:r.proposal_command,commandHtml:r.proposal_html,organizationId:r.project?.organization_id||r.organization_id,status:r.status==='closed'?'Oculta':r.is_visible_to_students?'Publicada':'Rascunho'}));
  if(!navigationCurrent(navigation))return;

  $('view').innerHTML=header('Propostas','Crie, publique e amplie o alcance das propostas.',`<button class="btn primary" id="proposalNew">Nova proposta</button>`)+`<section class="proposal-v2"><div id="proposalWorkspace"></div><div id="proposalListArea"><div class="proposal-v2-toolbar"><label class="field"><small>Buscar</small><input id="proposalSearch" type="search" placeholder="Tema ou número"></label><label class="field"><small>Exibir</small><select id="proposalFilter"><option value="all">Todas</option><option value="published">Publicadas</option><option value="draft">Rascunhos</option><option value="hidden">Ocultas</option></select></label></div><div id="proposalV2List" class="proposal-v2-list"></div></div></section>`;

  let editing=null,writing=false,generationId=null,publicationId=null;
  const workspace=$('proposalWorkspace'),listArea=$('proposalListArea'),newButton=$('proposalNew');
  const cleanHtml=proposalHtml;

  const setMode=mode=>{
   const editingMode=mode==='editor';
   workspace.hidden=!editingMode;
   listArea.hidden=editingMode;
   newButton.hidden=editingMode;
  };

  const filtered=()=>{
   const q=($('proposalSearch')?.value||'').trim().toLocaleLowerCase('pt-BR');
   const f=$('proposalFilter')?.value||'all';
   return proposals.filter(r=>(!q||`${r.number||''} ${r.theme||''}`.toLocaleLowerCase('pt-BR').includes(q))&&(f==='all'||f==='published'&&r.status==='Publicada'||f==='draft'&&r.status==='Rascunho'||f==='hidden'&&r.status==='Oculta'));
  };
  const draw=()=>{
   $('proposalV2List').innerHTML=filtered().map(r=>`<article class="list-item" data-proposal-id="${esc(r.id)}"><div class="item-top"><div><div class="item-title">R${esc(r.number??'—')} · ${esc(r.theme||'Sem tema')}</div><div class="item-meta">${esc(r.status)} · ${(r.targets||[]).length} turma(s) · ${(r._motivators||[]).filter(m=>m.body).length} texto(s) motivador(es)</div></div><span class="pill ${r.status==='Publicada'?'ok':'warn'}">${esc(r.status)}</span></div><div class="item-actions"><button class="btn soft-btn" data-edit="${esc(r.id)}">Editar</button><button class="btn soft-btn" data-hide="${esc(r.id)}">${r.status==='Oculta'?'Reexibir':'Ocultar'}</button><button class="btn ghost danger" data-delete="${esc(r.id)}">Excluir</button></div></article>`).join('')||'<div class="empty">Nenhuma proposta encontrada.</div>';
  };
  $('proposalSearch').oninput=draw;$('proposalFilter').onchange=draw;

  const showList=()=>{editing=null;workspace.innerHTML='';setMode('list');draw()};

  const openEditor=(record=null)=>{
   editing=record?.id||null;
   setMode('editor');
   const original=record||{};
   const originalOrg=original.organizationId||institutions[0]?.id||'';
   const originalTargets=new Set(original.targets||[]);
   const initialMot=(original._motivators?.length?original._motivators:[{body:'',title:'',source_label:'',source_url:''}]).map(m=>({...m}));
   const allAvailable=institutions.flatMap(o=>o.classes||[]).length;
   const allowAll=!editing&&institutions.length>1;

   workspace.innerHTML=`<div class="proposal-v2-editor"><div class="proposal-v2-actions"><button class="btn ghost" id="proposalBack" type="button">Voltar às propostas</button></div><form id="proposalV2Form"><section class="proposal-v2-section"><header><h2>1. Tema e orientação</h2><p>Defina o recorte e a instrução que o aluno receberá.</p></header><div class="proposal-v2-grid"><label class="field"><strong>Tema</strong><input id="pvTheme" required maxlength="250" value="${esc(original.theme||'')}"></label><label class="field">Eixo temático<select id="pvAxis" required><option value="">Selecione um eixo</option>${['Educação','Tecnologia','Meio ambiente','Saúde','Cultura','Cidadania e direitos humanos','Trabalho e economia'].map(x=>`<option ${x===(original.axis||original.thematic_axis)?'selected':''}>${x}</option>`).join('')}</select></label></div><div class="proposal-v2-actions"><button type="button" class="btn soft-btn" id="pvGenerate">Criação Inteligente</button><span class="muted" id="pvCredits">1 crédito por proposta concluída. Consultando saldo…</span></div><div id="pvCreditNotice" class="safe-note" role="alert" hidden><p id="pvCreditMessage"></p><div id="pvCreditRecharge"></div></div><div><label id="pvCommandLabel"><strong>Comando da proposta</strong></label><div class="demo-editor"><div class="item-actions" id="pvFormat" role="toolbar" aria-label="Formatação do texto"><button type="button" class="btn soft-btn" data-format="bold"><strong>Negrito</strong></button><button type="button" class="btn soft-btn" data-format="italic"><em>Itálico</em></button><button type="button" class="btn soft-btn" data-format="insertUnorderedList">Lista</button><button type="button" class="btn soft-btn" data-format="undo">Desfazer</button></div><div id="pvCommand" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="pvCommandLabel" data-placeholder="Escreva a orientação ao aluno..."></div></div></div><label class="field"><strong>Entenda o tema</strong><textarea id="pvUnderstand" placeholder="Delimite a problemática, o contexto e os limites do tema.">${esc(original.understand_prompt||'')}</textarea></label></section><section class="proposal-v2-section"><header><h2>2. Textos motivadores</h2><p>A fonte/autoria deve ser informada. O link é opcional.</p></header><div id="pvMotivators"></div><div><button type="button" class="btn soft-btn" id="pvAddMotivator">Adicionar texto motivador</button></div></section><section class="proposal-v2-section"><header><h2>3. Destinatários</h2><p>${editing?'Você pode incluir ou retirar turmas desta instituição sem recriar a proposta.':'Escolha uma instituição e suas turmas, ou publique em todas as suas instituições.'}</p></header>${allowAll?`<label class="demo-check"><input type="checkbox" id="pvAll"> Todas as minhas instituições <span class="muted">(${institutions.length} instituições · ${allAvailable} turmas disponíveis)</span></label>`:''}<div id="pvScope" class="proposal-v2-targets"><label class="field"><strong>Instituição</strong><select id="pvOrg" ${editing?'disabled':''}><option value="">Selecione uma instituição</option>${institutions.map(o=>`<option value="${esc(o.id)}" ${o.id===originalOrg?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label><div id="pvClassBox"></div></div><p id="pvSummary" class="proposal-v2-summary" role="status"></p></section><div class="proposal-v2-footer"><button class="btn ghost" id="pvCancel" type="button">Cancelar</button>${editing&&original.status==='Publicada'?'<button class="btn primary" id="pvSavePublished" type="button">Salvar alterações</button>':'<button class="btn soft-btn" id="pvDraft" type="button">Salvar rascunho</button><button class="btn primary" id="pvPublish" type="submit">Publicar</button>'}</div></form></div>`;

   const editor=$('pvCommand');editor.innerHTML=cleanHtml(original.commandHtml||esc(original.command||''));
   let selection=null,motRows=initialMot;
   const remember=()=>{const sel=window.getSelection();if(sel.rangeCount&&editor.contains(sel.anchorNode)&&editor.contains(sel.focusNode))selection=sel.getRangeAt(0).cloneRange()};
   editor.onkeyup=remember;editor.onmouseup=remember;editor.oninput=remember;editor.onblur=remember;
   editor.onpaste=e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));remember()};editor.ondrop=e=>e.preventDefault();
   $('pvFormat').onmousedown=e=>{if(e.target.closest('button'))e.preventDefault()};
   $('pvFormat').onclick=e=>{const b=e.target.closest('[data-format]');if(!b)return;editor.focus();if(selection&&editor.contains(selection.commonAncestorContainer)){const sel=window.getSelection();sel.removeAllRanges();sel.addRange(selection)}document.execCommand(b.dataset.format,false,null);remember()};

   const renderMotivators=()=>{$('pvMotivators').innerHTML=motRows.map((m,i)=>`<fieldset class="proposal-v2-motivator" data-motivator-row><legend>Texto motivador ${i+1}</legend><label class="field">Título <span class="muted">(opcional)</span><input data-mot="title" value="${esc(m.title||'')}"></label><label class="field">Texto<textarea data-mot="body">${esc(m.body||'')}</textarea></label><div class="proposal-v2-grid"><label class="field">Fonte / autoria<input data-mot="source_label" value="${esc(m.source_label||'')}" placeholder="Ex.: Adaptado de Nexo Jornal"></label><label class="field">Link da fonte <span class="muted">(opcional)</span><input type="url" data-mot="source_url" value="${esc(m.source_url||'')}" placeholder="https://..."></label></div>${motRows.length>1?`<div><button type="button" class="btn ghost danger" data-remove-mot="${i}">Remover texto</button></div>`:''}</fieldset>`).join('')};
   const readMotivators=()=>[...$('pvMotivators').querySelectorAll('[data-motivator-row]')].map((row,i)=>({...motRows[i],...Object.fromEntries([...row.querySelectorAll('[data-mot]')].map(el=>[el.dataset.mot,el.value.trim()]))}));
   renderMotivators();
   $('pvAddMotivator').onclick=()=>{motRows=[...readMotivators(),{body:'',title:'',source_label:'',source_url:''}];renderMotivators()};
   $('pvMotivators').onclick=e=>{const b=e.target.closest('[data-remove-mot]');if(!b)return;motRows=readMotivators().filter((_,i)=>i!==Number(b.dataset.removeMot));renderMotivators()};

   const targets=()=>[...document.querySelectorAll('#pvClassBox input[name="target"]')];
   const selectedTargets=()=>$('pvAll')?.checked?institutions.flatMap(o=>(o.classes||[]).map(c=>c.id)):targets().filter(x=>x.checked).map(x=>x.value);
   const summarize=()=>{const count=selectedTargets().length;$('pvSummary').textContent=$('pvAll')?.checked?`A proposta será aplicada às ${institutions.length} instituições, em ${count} turma(s) disponíveis.`:`${count} turma(s) selecionada(s).`};
   const fillClasses=()=>{const org=institutions.find(o=>o.id===$('pvOrg').value);$('pvClassBox').innerHTML=org?`<div class="proposal-v2-target-head"><strong>Turmas desta instituição</strong><div class="proposal-v2-actions"><button class="btn ghost" id="pvSelectAllClasses" type="button">Selecionar todas</button><button class="btn ghost" id="pvClearClasses" type="button">Limpar</button></div></div><div class="proposal-v2-target-list">${org.classes.map(c=>`<label class="demo-check"><input type="checkbox" name="target" value="${esc(c.id)}" ${originalTargets.has(c.id)?'checked':''}> ${esc(c.name)}</label>`).join('')||'<p>Nenhuma turma disponível.</p>'}</div>`:'<p class="proposal-v2-note">Selecione uma instituição para ver as turmas.</p>';targets().forEach(x=>x.onchange=summarize);if($('pvSelectAllClasses'))$('pvSelectAllClasses').onclick=()=>{targets().forEach(x=>x.checked=true);summarize()};if($('pvClearClasses'))$('pvClearClasses').onclick=()=>{targets().forEach(x=>x.checked=false);summarize()};summarize()};
   fillClasses();
   $('pvOrg').onchange=()=>{originalTargets.clear();fillClasses()};
   if($('pvAll'))$('pvAll').onchange=()=>{$('pvScope').hidden=$('pvAll').checked;summarize()};

   const refreshCredits=async()=>{try{const c=await edge(API.proposal,{action:'credits'});if(navigationCurrent(navigation)&&$('pvCredits'))$('pvCredits').textContent=`1 crédito por proposta concluída. Saldo: ${c.balance} crédito(s).`}catch{if($('pvCredits'))$('pvCredits').textContent='1 crédito por proposta concluída. Saldo indisponível.'}};
   refreshCredits();
   $('pvAxis').onchange=()=>{generationId=null};
   $('pvGenerate').onclick=async()=>{
    const button=$('pvGenerate'),axis=$('pvAxis').value;if(button.disabled)return;if(!axis)return toast('Selecione o eixo temático.');
    $('pvCreditNotice').hidden=true;button.disabled=true;let unlock=()=>{};
    try{
     if(!await appConfirm('Usar 1 crédito para criar tema e textos motivadores com pesquisa de fontes? O conteúdo atual será substituído. Em caso de falha, o crédito será devolvido.'))return;
     if(!navigationCurrent(navigation))return;unlock=generationScreen('Sua proposta está sendo gerada…');
     const key='versao-proposal-request:'+S.session.user.id+':'+axis;try{generationId=generationId||localStorage.getItem(key)}catch{}generationId=generationId||crypto.randomUUID();try{localStorage.setItem(key,generationId)}catch{}
     const result=await edge(API.proposal,{action:'generate',thematic_axis:axis,request_id:generationId});if(!navigationCurrent(navigation))return;
     $('pvTheme').value=result.proposal.theme;editor.textContent=result.proposal.proposal_command;$('pvUnderstand').value=result.proposal.understand_prompt||'';motRows=result.proposal.motivators||[];renderMotivators();try{localStorage.removeItem(key)}catch{}generationId=null;selection=null;toast('Proposta criada. Revise antes de publicar.');
    }catch(error){if(error.code==='INSUFFICIENT_CREDITS'){$('pvCreditMessage').textContent=error.message;$('pvCreditNotice').hidden=false;$('pvCreditNotice').scrollIntoView({block:'center',behavior:'smooth'})}if(error.refunded){generationId=null}toast(error.message)}finally{unlock();button.disabled=false;refreshCredits()}
   };

   const save=async publish=>{
    if(writing)return;
    const form=$('proposalV2Form');if(!form.reportValidity())return;
    if(!editor.innerText.trim()){toast('Preencha o comando da proposta.');editor.focus();return}
    const motivators=readMotivators().filter(m=>m.body);if(!motivators.length){toast('Inclua ao menos um texto motivador.');return}
    if(publish&&motivators.some(m=>!m.source_label)){toast('Informe a fonte/autoria de cada texto motivador. O link é opcional.');return}
    const selected=[...new Set(selectedTargets())];if(publish&&!selected.length){$('pvSummary').textContent='Selecione pelo menos uma turma ou marque todas as instituições.';return}
    const allInstitutions=!!$('pvAll')?.checked;
    if(publish&&!await appConfirm(allInstitutions?`Publicar esta proposta em ${institutions.length} instituições e ${selected.length} turmas?`:`Publicar esta proposta para ${selected.length} turma(s)?`))return;
    if(!navigationCurrent(navigation))return;
    const payload={theme:$('pvTheme').value.trim(),thematic_axis:$('pvAxis').value,proposal_command:editor.innerText.trim(),proposal_html:cleanHtml(editor.innerHTML),publish,organization_id:$('pvOrg').value,due_date:original.due_date||null,understand_prompt:$('pvUnderstand').value.trim(),class_ids:selected,motivators};
    if(!payload.theme||!payload.proposal_command)return;
    writing=true;const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
    try{
     if(allInstitutions){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({actor:S.session.user.id,payload})));const hex=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,32);publicationId=[hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');const result=await edge(API.proposal,{...payload,action:'save_all',request_id:publicationId});if(result.skipped_organizations?.length)toast('Sem turmas disponíveis: '+result.skipped_organizations.join(', '));}
     else await edge(API.proposal,{...payload,action:'save',round_id:editing||undefined});
     if(!navigationCurrent(navigation))return;
     await renderDemoProposalsV2(navigation);
     if(navigationCurrent(navigation)){setTimeout(()=>proposalNotice(publish?'Proposta publicada':'Proposta salva',publish?'A proposta foi salva e disponibilizada para as turmas selecionadas.':'O rascunho foi salvo com sucesso.'),0)}
    }catch(error){toast(error.message||'Não foi possível salvar a proposta.')}finally{writing=false;buttons.forEach(b=>b.disabled=false)}
   };

   $('proposalBack').onclick=showList;$('pvCancel').onclick=showList;
   if($('pvDraft'))$('pvDraft').onclick=()=>save(false);
   if($('pvSavePublished'))$('pvSavePublished').onclick=()=>save(true);
   $('proposalV2Form').onsubmit=e=>{e.preventDefault();save(true)};
   $('pvTheme').focus({preventScroll:true});
  };

  newButton.onclick=()=>openEditor(null);
  $('proposalV2List').onclick=async e=>{
   const b=e.target.closest('button');if(!b)return;const id=b.dataset.edit||b.dataset.hide||b.dataset.delete,r=proposals.find(x=>x.id===id);if(!r)return;
   if(b.dataset.edit){openEditor(r);return}
   if(b.dataset.delete&&!await appConfirm('Excluir esta proposta? Propostas com redações vinculadas não podem ser excluídas.'))return;
   b.disabled=true;
   try{await edge(API.proposal,b.dataset.hide?{action:'update_status',round_id:id,status:r.status==='Oculta'?'published':'closed'}:{action:'delete',round_id:id});await renderDemoProposalsV2(navigation)}catch(error){toast(error.message)}finally{b.disabled=false}
  };

  draw();setMode('list');
  const home=S.homeProposal;S.homeProposal=null;
  if(home?.intent==='create'){openEditor(null);return}
  if(home?.ids){proposals=proposals.filter(x=>home.ids.includes(x.id));draw()}
  if(home?.target){const r=proposals.find(x=>x.id===home.target);if(r)openEditor(r)}
 }

 window.renderDemoProposals=renderDemoProposalsV2;
})();
