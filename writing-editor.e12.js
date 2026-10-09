'use strict';
window.renderWritingEditor=async function(navigation,options={}){
 const proposal=options.proposal||S.writingProposal;delete S.writingProposal;
 const H=window.WritingSupport;
 const W=window.WritingStages,keys=Object.keys(W.stages),host=$('view');
 const api=body=>edge('teacher-organization-api',body);
 let closed=false,token=0,timer=null,active='introduction',draft=null,saving=null,dirty=false,blocked=false,details={guidance:[],comments:[],revisions:[]},guideRequest=null,guideBusy=false,helpTab='objective',tutorAction='analyse';
 let themesPromise=null,historyRequest=0,availableThemes=null,sendBusy=false;const guidanceByStage=new Map();
 let capabilities=null;try{capabilities=await edge('teacher-organization-api',{action:'live_status'});}catch{}
 const tutorEnabled=capabilities?.writing_guided?.is_enabled===true;
 const current=()=>!closed&&navigationCurrent(navigation);
 const hints={
  introduction:'Apresente um contexto pertinente, delimite o problema e planeje a posição que defenderá.',
  development1:'Defina o primeiro argumento. Explique como ele atua, escolha uma referência e analise sua relação com o tema.',
  development2:'Acrescente um segundo argumento. Explique o que ele acrescenta à discussão e relacione o repertório ao raciocínio.',
  conclusion:'Retome o problema e planeje uma intervenção: agente, ação, meio ou modo, finalidade e detalhamento. Uma segunda medida é opcional.'
 };
 const empty=()=>({id:crypto.randomUUID(),version:0,theme:'',content:{mode:'free',stages:Object.fromEntries(keys.map(k=>[k,{plan:'',text:''}]))}});
 const status=(message)=>{if(current()&&$('weStatus'))$('weStatus').textContent=message;};
 function collect(){if(!draft||!$('weTheme'))return;draft.theme=$('weTheme').value;draft.content.command=$('weCommand')?.value||'';if($('weText')){draft.content.stages[active].text=$('weText').value;const fields={...H.decode(draft.content.stages[active].plan).fields,...Object.fromEntries(H.stages[active].fields.map(([k])=>[k,$('wePlan_'+k).value]))};draft.content.stages[active].plan=H.encode(fields,$('wePlan').value);}}
 async function persist(){
  clearTimeout(timer);if(blocked)throw Error('Há conflito de versões. Copie o texto antes de recarregar.');
  if(saving)return saving;
  if(!dirty||!draft)return;
  const thisDraft=draft;
  saving=(async()=>{
   while(dirty&&draft===thisDraft){
    const snapshot=JSON.parse(JSON.stringify(thisDraft));dirty=false;status('Salvando…');
    try{const result=await api({action:'live_writing_save',id:snapshot.id,version:snapshot.version,theme:snapshot.theme,content:snapshot.content});thisDraft.version=result.draft.version;status(dirty?'Alterações pendentes…':'Salvo na sua conta.');}
    catch(error){dirty=true;if(/outra aba|versão/i.test(error.message||''))blocked=true;status('Não foi salvo: '+(error.message||'tente novamente.'));throw error;}
   }
  })();
  try{await saving;}finally{saving=null;}
 }
 function changed(){guideRequest=null;collect();dirty=true;status(active==='introduction'?'Alterações pendentes… Se a tese mudou, revise os desenvolvimentos e a conclusão.':'Alterações pendentes…');clearTimeout(timer);timer=setTimeout(()=>persist().catch(()=>{}),700);}
 function frame(content){host.innerHTML=header(S.profile.role==='student'?'Escrita guiada':'Construção guiada','Planeje, escreva e revise por etapas.')+`<section class="teacher-live we-page"><section class="tl-card">${content}<p id="weStatus" class="tl-status" role="status" aria-live="polite"></p></section></section>`;}
 async function leave(fn){try{collect();await persist();closed=true;clearTimeout(timer);await fn();}catch(e){status(e.message);}}
 async function list(){
  const stamp=++token;frame('<h2>Rascunhos</h2><p>Carregando rascunhos…</p>');
  try{const data=await api({action:'live_writing_list'});if(!current()||stamp!==token)return;
   frame(`<h2>Rascunhos</h2><p>Planejar e salvar não consome créditos.</p><div class="tl-actions"><button class="btn primary" id="weNew">Começar</button>${S.profile.role==='teacher'&&capabilities?.writing_guided?.is_enabled?'<button class="btn" id="weClassroom">'+(S.profile.role==='teacher'?'Construção em aula':'Atividades da turma')+'</button>':''}<button class="btn" id="weBackLive">${S.profile.role==='student'?'Corrigir':'Voltar ao Ao Vivo'}</button></div>${data.drafts.length?data.drafts.map(d=>`<article class="tl-evidence-card"><h3>${esc(d.theme||'Tema ainda não definido')}</h3><p>${esc(fmtDate(d.updated_at))}</p><button class="btn" data-writing-draft="${esc(d.id)}">Continuar</button></article>`).join(''):'<p>Seus rascunhos aparecerão aqui.</p>'}`);
   $('weNew').onclick=()=>open(null);if($('weClassroom'))$('weClassroom').onclick=()=>window.renderWritingClassroom(navigation);$('weBackLive').onclick=()=>leave(()=>navigate(S.profile.role==='student'?'student-live':'teacher-live'));
   host.querySelectorAll('[data-writing-draft]').forEach(b=>b.onclick=()=>open(b.dataset.writingDraft));
  }catch(e){status(e.message);}
 }
 async function open(id){
  const stamp=++token;
  try{const data=id?await api({action:'live_writing_get',id}):{draft:empty()};const loaded=data.draft;details={guidance:data.guidance||[],comments:data.comments||[],revisions:data.revisions||[],activity:data.activity||null};if(!current()||stamp!==token)return;draft=loaded;guidanceByStage.clear();dirty=false;blocked=false;active='introduction';render();}catch(e){status(e.message);}
 }
 function help(){
  const lesson=H.stages[active];
  const panes={objective:`<h3>Objetivo</h3><p>${esc(lesson.objective)}</p><p>${esc(lesson.structure)}</p><h4>Evite</h4><p>${esc(lesson.mistake)}</p>`,questions:`<h3>Perguntas para pensar</h3>${lesson.questions.map(q=>`<p>${esc(q)}</p>`).join('')}<p>Registre suas ideias no planejamento. Não é necessário responder a todas.</p>`,repertoire:'<h3>Repertório</h3><p>Defina primeiro o que você quer provar. Depois, faça a referência trabalhar:</p><ol><li><b>Referência:</b> qual obra, conceito, pesquisa ou fato você conhece?</li><li><b>Ideia extraída:</b> o que a fonte realmente permite afirmar?</li><li><b>Relação:</b> como essa ideia se liga ao tema?</li><li><b>Função:</b> o que ela ajuda a provar no argumento?</li></ol><p>Se retirar a referência, qual explicação se perde? Se nada mudar, ela pode estar apenas decorativa.</p><p>Não é necessário usar uma citação literal. Não invente dados nem frases atribuídas a autores.</p>'+ (tutorEnabled?'<button class="btn" id="weFindSources">Buscar fontes</button>':'<p>A busca com IA será liberada após a ativação do tutor.</p>'),review:`<h3>Revisão</h3>${lesson.review.map(q=>`<p>${esc(q)}</p>`).join('')}<p>Releia seu trecho e escolha um ponto para melhorar. Você pode continuar escrevendo livremente.</p>`};
  $('weHelpPanel').innerHTML=panes[helpTab];
  host.querySelectorAll('[data-we-help]').forEach(b=>{const selected=b.dataset.weHelp===helpTab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  if($('weFindSources'))$('weFindSources').onclick=()=>{tutorAction='repertoire';guide();};
 }
 function render(){
  historyRequest++;
  const unlocked=!details.activity||(details.activity.is_active&&details.activity.stages.includes(active));
  const part=draft.content.stages[active],plan=H.decode(part.plan),lesson=H.stages[active];
  const hint=hints[active];
  frame(`<div class="tl-actions"><button class="btn" id="weList">Rascunhos</button><button class="btn" id="weBackLive">${S.profile.role==='student'?'Corrigir':'Voltar ao Ao Vivo'}</button></div><div class="we-top we-theme-card"><div>${S.profile.role==='student'&&!details.activity?'<label class="field we-theme-select" for="weThemeSelect">Tema<select id="weThemeSelect" disabled><option value="">Carregando temas…</option></select></label><p id="weThemeSelectStatus" class="muted" role="status"></p>':''}<label class="field" id="weThemeField" ${S.profile.role==='student'&&!details.activity?'hidden':''}>${S.profile.role==='student'&&!details.activity?'Tema livre':'Tema'}<textarea id="weTheme" maxlength="1000" ${details.activity?'readonly':''}>${esc(draft.theme)}</textarea></label></div><div class="tl-actions"><button class="btn" id="weUnderstand">Entender o tema</button></div></div><details><summary>Comando do tema (opcional)</summary><label class="field">O que a proposta pede?<textarea id="weCommand" maxlength="4000" placeholder="Cole o comando para que o tutor considere o que foi solicitado.">${esc(draft.content.command||'')}</textarea></label></details><nav class="we-stage-tabs" aria-label="Etapas da escrita">${keys.map(k=>`<button class="btn" data-writing-stage="${k}" ${k===active?'aria-current="step"':''}>${esc(W.stages[k].label)}</button>`).join('')}</nav><div class="we-columns"><div><section class="tl-card"><h2>${esc(W.stages[active].label)}</h2><p>${esc(hint)}</p>${!unlocked?'<p>Esta etapa ainda não está liberada para escrita.</p>':''}<label class="field">Seu parágrafo<textarea id="weText" ${unlocked?'':'disabled'} maxlength="16000" placeholder="Escreva com suas palavras…">${esc(part.text)}</textarea></label><div class="tl-actions"><button class="btn" id="weSave">Salvar</button><button class="btn" id="wePreview">Ver redação</button>${S.profile.role==='teacher'?`<button class="btn" id="weCorrectStage" ${unlocked?'':'disabled'}>Corrigir etapa · 1 crédito</button>`:''}</div></section><section class="tl-card"><h2>Planejamento</h2><p>Registre ideias curtas antes de escrever. Os campos são opcionais e ficam fora da redação.</p>${tutorEnabled&&unlocked?'<button class="btn" id="wePlanHelp">Ajude-me a planejar</button>':''}<div class="we-plan-fields">${lesson.fields.map(([k,l])=>`<label class="field">${esc(l)}<textarea id="wePlan_${k}" rows="2" maxlength="400" ${unlocked?'':'disabled'} placeholder="${esc(lesson.prompts?.[k]||'Registre sua ideia.')}">${esc(plan.fields[k]||'')}</textarea></label>`).join('')}</div>${Object.keys(plan.fields).some(k=>!lesson.fields.some(([known])=>known===k))?`<details><summary>Planejamento anterior</summary>${Object.entries(plan.fields).filter(([k])=>!lesson.fields.some(([known])=>known===k)).map(([k,v])=>`<p><b>${esc(k)}:</b> ${esc(v)}</p>`).join('')}</details>`:''}<details ${plan.notes?'open':''}><summary>Anotações</summary><label class="field">Ideias e fontes<textarea id="wePlan" ${unlocked?'':'disabled'} maxlength="1200">${esc(plan.notes)}</textarea></label></details></section></div></div><section class="tl-card we-tutor" id="weTutorPanel" aria-labelledby="weTutorHeading"><h2 id="weTutorHeading">Tutor</h2><p>Entenda a etapa, organize suas ideias e peça ajuda para revisar seu texto.</p><div class="we-help-tabs" role="tablist" aria-label="Apoio à escrita">${[['objective','Objetivo'],['questions','Perguntas'],['repertoire','Repertório'],['review','Revisão']].map(([k,l])=>`<button class="btn" role="tab" id="weHelp_${k}" data-we-help="${k}" aria-controls="weHelpPanel">${l}</button>`).join('')}</div><div id="weHelpPanel" role="tabpanel" tabindex="0" aria-labelledby="weHelp_${helpTab}"></div><div class="we-tutor-request">${tutorEnabled&&unlocked?`<div class="we-tutor-actions">${[['theme','O que o tema pede?'],['ideas','Como começar este trecho?'],['repertoire','Que repertório posso usar?'],['analyse','Como melhorar este trecho?'],['plan','Como melhorar meu planejamento?']].map(([k,l])=>`<button class="btn" data-we-tutor="${k}" aria-pressed="${k===tutorAction}">${l}</button>`).join('')}</div><p>Escolha uma pergunta acima. O tutor ajuda você a construir o próprio texto.</p><button class="btn primary we-full-button" id="weGuide">Pedir orientação</button>`:'<p>'+(!unlocked?'A orientação desta etapa será liberada com a atividade.':'A tutoria com IA aguarda ativação. Os apoios acima já podem ser consultados.')+'</p>'}<p class="muted">Sem cobrança durante os testes.</p></div><section class="we-ai-panel" id="weAiPanel" aria-labelledby="weAiHeading"><h3 id="weAiHeading" tabindex="-1">Orientação do tutor</h3><div id="weGuidance" aria-live="polite"><p>A orientação aparecerá aqui. As sugestões ficam separadas do seu texto; você decide como usá-las.</p></div></section><details class="we-history"><summary>Histórico</summary><div class="we-history-options"><button class="btn we-history-option" id="weHistory" aria-expanded="false" aria-controls="weHistoryPanel"><b>Orientações anteriores</b><span>Releia as sugestões que o tutor já deu para esta etapa.</span></button><button class="btn we-history-option" id="weVersions" aria-expanded="false" aria-controls="weHistoryPanel"><b>Comparar versões</b><span>Veja o que mudou entre o texto salvo antes e a sua escrita atual.</span></button></div><div id="weHistoryPanel"></div></details></section>`);
  help();
  host.querySelectorAll('[data-we-help]').forEach(b=>{b.onclick=()=>{helpTab=b.dataset.weHelp;$('weHelpPanel').setAttribute('aria-labelledby',b.id);help();};b.onkeydown=e=>{const tabs=[...host.querySelectorAll('[data-we-help]')],i=tabs.indexOf(b);const next=e.key==='ArrowRight'?tabs[(i+1)%tabs.length]:e.key==='ArrowLeft'?tabs[(i+tabs.length-1)%tabs.length]:e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):null;if(next){e.preventDefault();next.click();next.focus();}};});
  host.querySelectorAll('[data-we-tutor]').forEach(b=>b.onclick=()=>{tutorAction=b.dataset.weTutor;host.querySelectorAll('[data-we-tutor]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));guide();});
  if($('weThemeSelect'))loadThemes();
  const previous=guidanceByStage.get(active)||details.guidance?.filter(g=>g.stage===active).at(-1);if(previous)showGuide(previous);
  $('weUnderstand').onclick=()=>{if(tutorEnabled&&unlocked){tutorAction='theme';guide();}else{helpTab='questions';help();$('weHelpPanel').focus();status('Identifique o assunto, o recorte e o tipo de texto pedido. As perguntas ajudam a delimitar sua posição.');}};
  if($('weGuide'))$('weGuide').onclick=guide;
  if($('wePlanHelp'))$('wePlanHelp').onclick=()=>{tutorAction='plan';host.querySelectorAll('[data-we-tutor]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.weTutor==='plan')));guide();};
  $('weHistory').onclick=()=>history('guidance');$('weVersions').onclick=()=>history('versions');
  status(dirty?'Alterações pendentes…':draft.version?'Salvo na sua conta.':'O rascunho será salvo quando você começar a escrever.');
  for(const id of ['weTheme','weCommand','wePlan','weText',...lesson.fields.map(([k])=>'wePlan_'+k)])$(id).oninput=changed;
  host.querySelectorAll('[data-writing-stage]').forEach(b=>b.onclick=()=>{collect();active=b.dataset.writingStage;render();});
  $('weSave').onclick=async()=>{const button=$('weSave');button.disabled=true;try{collect();await persist();if(current())window.actionAlert('Seu rascunho foi salvo na sua conta.','Rascunho salvo');}catch(error){if(current())window.actionAlert('Não foi possível salvar. '+(error.message||'Tente novamente.'),'Não foi salvo');}finally{if(button.isConnected)button.disabled=false;}};
  $('weList').onclick=async()=>{try{collect();await persist();draft=null;await list();}catch(e){status(e.message);}};
  $('weBackLive').onclick=()=>leave(()=>navigate(S.profile.role==='student'?'student-live':'teacher-live'));
  $('wePreview').onclick=()=>{collect();preview();};
  if($('weCorrectStage'))$('weCorrectStage').onclick=()=>handoff(active);
 }
 function sourceLinks(r){return (r.sources||[]).filter(x=>/^https:\/\//i.test(x.url||'')).map(x=>`<p class="we-source"><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a></p>`).join('');}
 function showGuide(g){if(!$('weGuidance'))return;const r=g.result;$('weGuidance').innerHTML=r?`<h3>${esc(r.objective)}</h3>${r.evidence?`<p class="we-evidence-label">Trecho citado do seu texto</p><blockquote class="we-evidence">${esc(r.evidence)}</blockquote>`:''}${r.questions.map(q=>`<p>${esc(q)}</p>`).join('')}<p><b>Próximo passo:</b> ${esc(r.task)}</p><p>${esc(r.context_note)}</p>${sourceLinks(r)}<small>Orientação da versão ${Number(g.draft_version)}. Se você mudou o texto, reavalie esta orientação.</small>`:`<p>${esc(g.error_message||'Preparando orientação…')}</p>`;}
 function focusGuidance(){
  $('weAiHeading')?.focus({preventScroll:true});
  $('weAiPanel')?.scrollIntoView?.({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }
 async function loadThemes(){
  const select=$('weThemeSelect'),sourceDraft=draft;if(!select)return;
  try{
   if(!themesPromise)themesPromise=studentProposals(true);
   const result=await themesPromise;if(!current()||draft!==sourceDraft||$('weThemeSelect')!==select)return;
   const proposals=Array.isArray(result.proposals)?result.proposals:[];availableThemes=proposals;
   select.innerHTML='<option value="">'+'Tema livre'+'</option>'+proposals.map(p=>`<option value="${esc(p.id)}">${esc(p.theme||'Tema não informado')}${p.thematic_axis?' · '+esc(p.thematic_axis):''}</option>`).join('');
   select.disabled=!proposals.length;const matches=proposals.filter(p=>p.theme===draft.theme);const selected=draft.content.proposal_id?proposals.find(p=>String(p.id)===draft.content.proposal_id):(draft.content.proposal_mode!=='free'&&matches.length===1?matches[0]:null);if(selected&&!draft.content.proposal_id){draft.content.proposal_id=String(selected.id);dirty=true;}if(selected)select.value=String(selected.id);$('weThemeField').hidden=!!selected;
   select.onchange=()=>{const proposal=proposals.find(p=>String(p.id)===select.value);if(!proposal){delete draft.content.proposal_id;draft.content.proposal_mode='free';changed();$('weThemeField').hidden=false;$('weTheme').focus();return;}draft.content.proposal_id=String(proposal.id);delete draft.content.proposal_mode;$('weThemeField').hidden=true;$('weTheme').value=String(proposal.theme||'').slice(0,1000);$('weCommand').value=String(proposal.proposal_command||proposal.understand_prompt||'').slice(0,4000);changed();};
  }catch(error){themesPromise=null;if(current()&&draft===sourceDraft&&$('weThemeSelect')===select){select.innerHTML='<option value="">Tema livre</option>';$('weThemeField').hidden=false;$('weThemeSelectStatus').innerHTML='Não foi possível carregar os temas. <button class="btn" type="button" id="weThemeRetry">Tentar novamente</button>';$('weThemeRetry').onclick=()=>{$('weThemeSelectStatus').textContent='';loadThemes();};}}
 }
 async function guide(){
  focusGuidance();if(guideBusy||!draft)return;guideBusy=true;const stage=active,sourceDraft=draft;
  const button=$('weGuide');if(button)button.disabled=true;const studentQuestion='',intent=tutorAction;
  try{collect();await persist();if(draft!==sourceDraft||!current())return;if(!draft.theme.trim())throw Error('Informe o tema antes de pedir orientação.');
   const question=H.question(intent,stage,studentQuestion).slice(0,1900);
   const signature=JSON.stringify([draft.id,draft.version,stage,intent,question]);
   if(!guideRequest||guideRequest.signature!==signature)guideRequest={signature,request_id:crypto.randomUUID()};
   status('Preparando uma orientação para o seu texto…');$('weGuidance').innerHTML='<div class="tl-loading-ring" aria-hidden="true"></div><p role="status">Lendo seu texto e preparando uma orientação…</p>';
   const payload={action:'writing_guidance',id:draft.id,version:draft.version,stage,intent,question,request_id:guideRequest.request_id};
   let data=await api(payload);for(let attempt=0;data.guidance.status==='processing'&&current()&&attempt<95;attempt++){await new Promise(resolve=>setTimeout(resolve,2000));if(!current())return;data=await api(payload);}
   if(!current()||draft!==sourceDraft)return;if(data.guidance.status==='failed')guideRequest=null;guidanceByStage.set(stage,data.guidance);if(active===stage)showGuide(data.guidance);status(data.guidance.status==='completed'?'Orientação salva para a versão '+Number(data.guidance.draft_version)+'.':data.guidance.error_message||'A orientação está em processamento. Consulte o histórico.');
  }catch(e){if($('weGuidance'))$('weGuidance').textContent=(e.message||'Não foi possível obter a orientação.')+' Sua escrita foi preservada. Você pode tentar novamente.';status(e.message);}finally{guideBusy=false;if(button?.isConnected)button.disabled=false;}
 }
 async function history(mode='guidance'){
  const stage=active,sourceDraft=draft,request=++historyRequest;
  $('weHistory').setAttribute('aria-expanded',String(mode==='guidance'));$('weVersions').setAttribute('aria-expanded',String(mode==='versions'));
  $('weHistoryPanel').textContent='Carregando…';
  try{collect();await persist();const data=await api({action:'writing_detail',id:draft.id});if(!current()||draft!==sourceDraft||active!==stage||request!==historyRequest||!$('weHistoryPanel'))return;
   details={...details,...data};$('weHistoryPanel').innerHTML=mode==='guidance'?`<h3>Orientações anteriores do tutor</h3>${data.guidance.filter(g=>g.stage===active).map(g=>`<article class="tl-evidence-card"><b>Versão ${Number(g.draft_version)}</b><p>${esc(g.question)}</p>${g.result?`<p>${esc(g.result.objective)}</p>${g.result.questions.map(q=>`<p>${esc(q)}</p>`).join('')}<p>${esc(g.result.task)}</p>${sourceLinks(g.result)}`:`<p>${esc(g.error_message||'Em processamento')}</p>`}</article>`).join('')||'<p>Ainda não há orientação nesta etapa.</p>'}<h3>Professor</h3>${data.comments.filter(c=>c.stage===active).map(c=>`<p>${esc(c.comment)} · versão ${Number(c.draft_version)}</p>`).join('')||'<p>Sem comentário.</p>'}`:`<h3>Comparar versões</h3><div class="tl-actions">${data.revisions.map(r=>`<button class="btn" data-we-version="${Number(r.version)}">Versão ${Number(r.version)}</button>`).join('')}</div>${data.revisions.length?'':'<p>Ainda não há versões anteriores salvas para comparar.</p>'}<div id="weComparison"></div>`;
   host.querySelectorAll('[data-we-version]').forEach(b=>b.onclick=async()=>{try{const revision=(await api({action:'writing_revision',id:draft.id,version:Number(b.dataset.weVersion)})).revision;if(current()&&draft===sourceDraft&&active===stage&&request===historyRequest&&$('weComparison'))$('weComparison').innerHTML=`<h4>Antes · versão ${Number(revision.version)}</h4><p class="tl-result">${esc(revision.content.stages[active].text)}</p><h4>Agora</h4><p class="tl-result">${esc(draft.content.stages[active].text)}</p>`;}catch(e){status(e.message);}});
  }catch(e){status(e.message);}
 }
 function institutional(){return S.profile.role==='student'&&!!draft.content.proposal_id;}
 function preview(){
  frame(`<h2>Prévia da redação</h2><h3>${esc(draft.theme||'Tema ainda não definido')}</h3>${keys.map(k=>`<p class="tl-result">${esc(draft.content.stages[k].text||'')}</p>`).join('')}<div class="tl-actions"><button class="btn" id="weEdit">Voltar à escrita</button><button class="btn primary" id="weCorrectAll">${institutional()?'Enviar ao professor':'Levar redação para correção · 1 crédito'}</button></div><p>${institutional()?'Sua redação será enviada para a correção do professor responsável pelo tema.':'O crédito será confirmado na tela de correção.'}</p>`);
  $('weEdit').onclick=render;$('weCorrectAll').onclick=()=>handoff('complete').catch(e=>status(e.message));
 }
 async function handoff(stage){
  if(S.profile.role!=='teacher')stage='complete';
  collect();const text=stage==='complete'?keys.map(k=>draft.content.stages[k].text).filter(Boolean).join('\n\n'):draft.content.stages[stage].text;
  if(text.trim().length<80){status('Escreva pelo menos 80 caracteres antes de corrigir.');return;}
  if(text.length>(stage==='complete'?20000:16000)){status('Reduza o texto ao limite da correção antes de continuar.');return;}
  if(S.profile.role==='student'&&draft.content.proposal_mode!=='free'&&!draft.content.proposal_id&&availableThemes?.filter(p=>p.theme===draft.theme).length>1){status('Há mais de uma proposta com este título. Volte à escrita e escolha o tema no seletor antes de enviar.');return;}
  if(institutional()){
   if(sendBusy)return;
   sendBusy=true;const button=$('weCorrectAll');if(button)button.disabled=true;
   try{
    const proposals=availableThemes||(await studentProposals(true)).proposals||[];
    const target=proposals.find(p=>String(p.id)===draft.content.proposal_id);
    if(!target)throw Error('Este tema não está disponível para envio. Volte à escrita e selecione um tema válido.');
    if(target.theme!==draft.theme)throw Error('O tema foi alterado. Volte à escrita e selecione novamente o tema da instituição.');
    if(target.handwritten_only)throw Error('Este tema exige redação manuscrita. Use o envio de foto ou arquivo na tela Temas. Seu rascunho foi preservado.');
    await persist();
    await studentSubmitJson({action:'paste',round_id:String(target.id),text});
    S.cache={};S.student=null;closed=true;clearTimeout(timer);await navigate('student-essays');
   }finally{sendBusy=false;if(button?.isConnected)button.disabled=false;}
   return;
  }
  await leave(()=>renderTeacherLive(navigation,{stage,text,theme:draft.theme,context:stage==='complete'?{}:Object.fromEntries(keys.filter(k=>k!==stage&&draft.content.stages[k].text.trim()).map(k=>[k,draft.content.stages[k].text]))}));
 }
 if(options.draftId)await open(options.draftId);else if(proposal){await open(null);if(current()&&draft){if(proposal.id)draft.content.proposal_id=String(proposal.id);draft.theme=String(proposal.theme||'').slice(0,1000);draft.content.command=String(proposal.command||'').slice(0,4000);dirty=true;render();status('Tema escolhido. Seu rascunho será salvo ao continuar.');}}else await list();
};
