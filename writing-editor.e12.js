'use strict';
window.renderWritingEditor=async function(navigation,options={}){
 const W=window.WritingStages,keys=Object.keys(W.stages),host=$('view');
 const api=body=>edge('teacher-organization-api',body);
 let closed=false,token=0,timer=null,active='introduction',draft=null,saving=null,dirty=false,blocked=false,details={guidance:[],comments:[],revisions:[]},guideRequest=null,guideBusy=false;
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
 function collect(){if(!draft||!$('weTheme'))return;draft.theme=$('weTheme').value;draft.content.mode=$('weMode').value;if($('weText')){draft.content.stages[active].text=$('weText').value;draft.content.stages[active].plan=$('wePlan').value;}}
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
 function frame(content){host.innerHTML=header('Construção guiada','Planeje, escreva e revise por etapas.')+`<section class="teacher-live"><section class="tl-card">${content}<p id="weStatus" class="tl-status" role="status" aria-live="polite"></p></section></section>`;}
 async function leave(fn){try{collect();await persist();closed=true;clearTimeout(timer);await fn();}catch(e){status(e.message);}}
 async function list(){
  const stamp=++token;frame('<h2>Suas construções</h2><p>Carregando rascunhos…</p>');
  try{const data=await api({action:'live_writing_list'});if(!current()||stamp!==token)return;
   frame(`<h2>Suas construções</h2><p>Planejar e salvar não consome créditos.</p><div class="tl-actions"><button class="btn primary" id="weNew">Nova construção</button>${capabilities?.writing_guided?.is_enabled?'<button class="btn" id="weClassroom">'+(S.profile.role==='teacher'?'Construção em aula':'Atividades da turma')+'</button>':''}<button class="btn" id="weBackLive">Voltar ao Ao Vivo</button></div>${data.drafts.length?data.drafts.map(d=>`<article class="tl-evidence-card"><h3>${esc(d.theme||'Tema ainda não definido')}</h3><p>${esc(fmtDate(d.updated_at))}</p><button class="btn" data-writing-draft="${esc(d.id)}">Continuar</button></article>`).join(''):'<p>Seus rascunhos aparecerão aqui.</p>'}`);
   $('weNew').onclick=()=>open(null);if($('weClassroom'))$('weClassroom').onclick=()=>window.renderWritingClassroom(navigation);$('weBackLive').onclick=()=>leave(()=>renderTeacherLive(navigation));
   host.querySelectorAll('[data-writing-draft]').forEach(b=>b.onclick=()=>open(b.dataset.writingDraft));
  }catch(e){status(e.message);}
 }
 async function open(id){
  const stamp=++token;
  try{const data=id?await api({action:'live_writing_get',id}):{draft:empty()};const loaded=data.draft;details={guidance:data.guidance||[],comments:data.comments||[],revisions:data.revisions||[],activity:data.activity||null};if(!current()||stamp!==token)return;draft=loaded;dirty=false;blocked=false;active='introduction';render();}catch(e){status(e.message);}
 }
 function render(){
  const unlocked=!details.activity||(details.activity.is_active&&details.activity.stages.includes(active));
  const part=draft.content.stages[active],cause=draft.content.mode==='cause-effect';
  let hint=hints[active];if(cause&&active==='development1')hint='Desenvolva a causa: explique como ela contribui para o problema, apresente repertório pertinente e analise essa relação.';
  if(cause&&active==='development2')hint='Desenvolva a consequência: explique como o efeito aparece, quem é afetado e o que o repertório ajuda a compreender.';
  frame(`<div class="tl-actions"><button class="btn" id="weList">Meus rascunhos</button><button class="btn" id="weBackLive">Voltar ao Ao Vivo</button></div><label class="field">Tema<textarea id="weTheme" maxlength="1000" ${details.activity?'readonly':''}>${esc(draft.theme)}</textarea></label><label class="field">Organização<select id="weMode"><option value="free" ${cause?'':'selected'}>Livre</option><option value="cause-effect" ${cause?'selected':''}>Causa e consequência</option></select></label><p>A estrutura é um apoio: adapte ao seu argumento. As orientações e o planejamento não entram no texto final.</p><div class="tl-actions">${keys.map(k=>`<button class="btn ${k===active?'primary':''}" data-writing-stage="${k}" ${k===active?'aria-current="step"':''}>${esc(W.stages[k].label)}</button>`).join('')}</div><h2>${esc(W.stages[active].label)}</h2><p>${esc(hint)}</p><label class="field">Planejamento (opcional)<textarea id="wePlan" ${unlocked?'':'disabled'} maxlength="4000" placeholder="Registre suas ideias e as fontes que pretende verificar.">${esc(part.plan)}</textarea></label><label class="field">Seu parágrafo<textarea id="weText" ${unlocked?'':'disabled'} maxlength="16000" placeholder="Escreva com suas próprias palavras.">${esc(part.text)}</textarea></label><div class="tl-actions"><button class="btn" id="weSave">Salvar agora</button><button class="btn" id="wePreview">Ver redação completa</button><button class="btn primary" id="weCorrectStage" ${unlocked?'':'disabled'}>Levar etapa para correção · 1 crédito</button></div>`);
  const support=document.createElement('section');support.className='tl-evidence-card';support.innerHTML=`${!unlocked?'<p>Esta etapa ainda não está liberada para escrita.</p>':''}${tutorEnabled&&unlocked?'<h3>Preciso de uma orientação</h3><p>A IA faz perguntas e propõe uma tarefa. O parágrafo é seu.</p><label class="field">Sua dúvida (opcional)<textarea id="weQuestion" maxlength="2000"></textarea></label><button class="btn" id="weGuide">Pedir orientação</button>':''}<div id="weGuidance"></div><button class="btn" id="weHistory">Orientações e versões anteriores</button><div id="weHistoryPanel"></div>`;host.querySelector('.tl-card').append(support);
  if($('weGuide'))$('weGuide').onclick=guide;
  $('weHistory').onclick=history;
  status(dirty?'Alterações pendentes…':draft.version?'Salvo na sua conta.':'O rascunho será salvo quando você começar a escrever.');
  for(const id of ['weTheme','wePlan','weText'])$(id).oninput=changed;
  $('weMode').onchange=()=>{changed();render();};
  host.querySelectorAll('[data-writing-stage]').forEach(b=>b.onclick=()=>{collect();active=b.dataset.writingStage;render();});
  $('weSave').onclick=()=>{collect();persist().catch(()=>{});};
  $('weList').onclick=async()=>{try{collect();await persist();draft=null;await list();}catch(e){status(e.message);}};
  $('weBackLive').onclick=()=>leave(()=>renderTeacherLive(navigation));
  $('wePreview').onclick=()=>{collect();preview();};
  $('weCorrectStage').onclick=()=>handoff(active);
 }
 function showGuide(g){if(!$('weGuidance'))return;const r=g.result;$('weGuidance').innerHTML=r?`<h4>${esc(r.objective)}</h4>${r.evidence?`<p>Seu trecho: ${esc(r.evidence)}</p>`:''}${r.questions.map(q=>`<p>${esc(q)}</p>`).join('')}<p><b>Próximo passo:</b> ${esc(r.task)}</p><p>${esc(r.context_note)}</p><small>Orientação da versão ${Number(g.draft_version)}. Se você mudou o texto, reavalie esta orientação.</small>`:`<p>${esc(g.error_message||'Preparando orientação…')}</p>`;}
 async function guide(){
  if(guideBusy)return;guideBusy=true;const stage=active;
  const button=$('weGuide');button.disabled=true;
  try{collect();await persist();if(!draft.theme.trim())throw Error('Informe o tema antes de pedir orientação.');
   const question=$('weQuestion').value.trim()||'Preciso de uma orientação.';
   const signature=JSON.stringify([draft.id,draft.version,stage,question]);
   if(!guideRequest||guideRequest.signature!==signature)guideRequest={signature,request_id:crypto.randomUUID()};
   status('Preparando uma orientação para o seu texto…');$('weGuidance').innerHTML='<div class="tl-loading-ring" aria-hidden="true"></div><p role="status">Lendo seu texto e preparando uma orientação…</p>';
   const payload={action:'writing_guidance',id:draft.id,version:draft.version,stage,question,request_id:guideRequest.request_id};
   let data=await api(payload);for(let attempt=0;data.guidance.status==='processing'&&current()&&attempt<95;attempt++){await new Promise(resolve=>setTimeout(resolve,2000));if(!current())return;data=await api(payload);}
   if(!current())return;if(active===stage)showGuide(data.guidance);status(data.guidance.status==='completed'?'Orientação salva com esta versão.':data.guidance.error_message||'A orientação está em processamento. Consulte o histórico.');
  }catch(e){if($('weGuidance'))$('weGuidance').textContent='Sua escrita foi preservada. Você pode tentar novamente.';status(e.message);}finally{guideBusy=false;if(button.isConnected)button.disabled=false;}
 }
 async function history(){
  try{collect();await persist();const data=await api({action:'writing_detail',id:draft.id});if(!current()||!$('weHistoryPanel'))return;
   details={...details,...data};$('weHistoryPanel').innerHTML=`<h3>Orientações anteriores</h3>${data.guidance.filter(g=>g.stage===active).map(g=>`<article class="tl-evidence-card"><b>Versão ${Number(g.draft_version)}</b><p>${esc(g.question)}</p>${g.result?`<p>${esc(g.result.objective)}</p>${g.result.questions.map(q=>`<p>${esc(q)}</p>`).join('')}<p>${esc(g.result.task)}</p>`:`<p>${esc(g.error_message||'Em processamento')}</p>`}</article>`).join('')||'<p>Ainda não há orientação nesta etapa.</p>'}<h3>Professor</h3>${data.comments.filter(c=>c.stage===active).map(c=>`<p>${esc(c.comment)} · versão ${Number(c.draft_version)}</p>`).join('')||'<p>Sem comentário.</p>'}<h3>Compare sua reescrita</h3><div class="tl-actions">${data.revisions.map(r=>`<button class="btn" data-we-version="${Number(r.version)}">Versão ${Number(r.version)}</button>`).join('')}</div><div id="weComparison"></div>`;
   host.querySelectorAll('[data-we-version]').forEach(b=>b.onclick=async()=>{try{const revision=(await api({action:'writing_revision',id:draft.id,version:Number(b.dataset.weVersion)})).revision;if(current()&&$('weComparison'))$('weComparison').innerHTML=`<h4>Antes · versão ${Number(revision.version)}</h4><p class="tl-result">${esc(revision.content.stages[active].text)}</p><h4>Agora</h4><p class="tl-result">${esc(draft.content.stages[active].text)}</p>`;}catch(e){status(e.message);}});
  }catch(e){status(e.message);}
 }
 function preview(){
  frame(`<h2>Prévia da redação</h2><h3>${esc(draft.theme||'Tema ainda não definido')}</h3>${keys.map(k=>`<p class="tl-result">${esc(draft.content.stages[k].text||'')}</p>`).join('')}<div class="tl-actions"><button class="btn" id="weEdit">Voltar à escrita</button><button class="btn primary" id="weCorrectAll">Levar redação para correção · 1 crédito</button></div><p>O crédito será confirmado na tela de correção.</p>`);
  $('weEdit').onclick=render;$('weCorrectAll').onclick=()=>handoff('complete');
 }
 async function handoff(stage){
  collect();const text=stage==='complete'?keys.map(k=>draft.content.stages[k].text).filter(Boolean).join('\n\n'):draft.content.stages[stage].text;
  if(text.trim().length<80){status('Escreva pelo menos 80 caracteres antes de corrigir.');return;}
  if(text.length>(stage==='complete'?20000:16000)){status('Reduza o texto ao limite da correção antes de continuar.');return;}
  await leave(()=>renderTeacherLive(navigation,{stage,text,theme:draft.theme,context:stage==='complete'?{}:Object.fromEntries(keys.filter(k=>k!==stage&&draft.content.stages[k].text.trim()).map(k=>[k,draft.content.stages[k].text]))}));
 }
 if(options.draftId)await open(options.draftId);else await list();
};
