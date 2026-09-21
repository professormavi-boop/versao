'use strict';
async function openEssay(id,slot){slot.innerHTML='<div class="viewer"><div class="empty">Carregando redação...</div></div>';try{const d=await edge(API.live,{action:'list',submission_id:id}),f=(d.files||[]).sort((a,b)=>a.page_number-b.page_number)[0];slot.innerHTML=f?`<div class="viewer"><div class="viewer-head"><b>Redação · 1 página</b></div>${String(f.mime_type).startsWith('image')?`<img src="${esc(f.signed_url)}" alt="Redação">`:'<div class="empty">Arquivo legado não-imagem.</div>'}</div>`:'<div class="empty">Nenhuma captura encontrada.</div>'}catch(e){slot.innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
const CV=[0,40,80,120,160,200],CC=[['C1','Norma padrão'],['C2','Compreensão do tema'],['C3','Argumentação'],['C4','Coesão'],['C5','Intervenção']];
function manualKey(id){return'e12-manual-'+S.session.user.id+'-'+id}function blankManual(){return{scores:Object.fromEntries(CC.map(([c])=>[c,160])),just:Object.fromEntries(CC.map(([c])=>[c,''])),dev:'',prio:'',feed:'',auth:'',obs:''}}
async function manualCorrection(id){const slot=$('slot-'+id),row=(S.cache.correctionRows||[]).find(x=>x.submission_id===id);let d;try{d=JSON.parse(localStorage.getItem(manualKey(id))||'null')}catch{}if(!d){d=blankManual();try{const o=(await edge(API.official,{action:'get',submission_id:id})).official;if(o){CC.forEach(([c])=>{if(CV.includes(Number(o.competencies?.[c])))d.scores[c]=Number(o.competencies[c]);d.just[c]=o.competency_justifications?.[c]||''});d.dev=o.detailed_analysis?.deviations_rules||'';d.prio=o.improvement_priority||'';d.feed=o.feedback||'';d.auth=o.authorship_validation||'';d.obs=o.observations||''}}catch{}}slot.innerHTML=`<div class="split" style="margin-top:12px"><div class="essay-pane" id="manualEssay-${id}"></div><div class="box"><div class="box-head"><h2>Correção manual</h2><p>${esc(row?.student_name||'Aluno')} · revise antes de publicar</p></div><div class="box-body"><div class="score-total" id="total-${id}">0</div><div class="comp-grid">${CC.map(([c,l])=>`<div class="comp-card"><div class="comp-card-top"><div><b>${c}</b><div class="muted">${l}</div></div><select data-ms="${c}">${CV.map(v=>`<option value="${v}" ${Number(d.scores[c])===v?'selected':''}>${v}</option>`).join('')}</select></div><textarea data-mj="${c}" placeholder="Diagnóstico / justificativa">${esc(d.just[c]||'')}</textarea></div>`).join('')}</div><div class="form-section"><h4>Desvios encontrados</h4><textarea data-dev style="width:100%;min-height:100px">${esc(d.dev)}</textarea></div><div class="form-section"><h4>Prioridade de melhoria</h4><textarea data-prio style="width:100%;min-height:80px">${esc(d.prio)}</textarea></div><div class="form-section"><h4>Devolutiva ao aluno</h4><textarea data-feed style="width:100%;min-height:100px">${esc(d.feed)}</textarea></div><div class="form-section"><h4>Autoria e observações</h4><textarea data-auth placeholder="Validação de autoria" style="width:100%;min-height:70px">${esc(d.auth)}</textarea><textarea data-obs placeholder="Observações internas" style="width:100%;min-height:70px;margin-top:8px">${esc(d.obs)}</textarea></div><div class="item-actions"><button class="btn soft-btn" data-save-manual="${id}">Salvar rascunho</button><button class="btn primary" data-publish-manual="${id}">Aprovar e publicar</button></div><div class="safe-note">Aprovar grava a nota oficial e disponibiliza a devolutiva ao aluno.</div></div></div></div>`;slot.querySelectorAll('[data-ms]').forEach(s=>s.onchange=()=>manualTotal(id));manualTotal(id);openEssay(id,$('manualEssay-'+id))}
function manualData(id){const slot=$('slot-'+id),d=blankManual();CC.forEach(([c])=>{d.scores[c]=Number(slot.querySelector(`[data-ms="${c}"]`)?.value||0);d.just[c]=slot.querySelector(`[data-mj="${c}"]`)?.value.trim()||''});d.dev=slot.querySelector('[data-dev]')?.value.trim()||'';d.prio=slot.querySelector('[data-prio]')?.value.trim()||'';d.feed=slot.querySelector('[data-feed]')?.value.trim()||'';d.auth=slot.querySelector('[data-auth]')?.value.trim()||'';d.obs=slot.querySelector('[data-obs]')?.value.trim()||'';return d}function manualTotal(id){const d=manualData(id),t=Object.values(d.scores).reduce((a,b)=>a+Number(b),0);$('total-'+id).textContent=t+' / 1000'}const officialPending=new Set();
async function saveManual(id,publish){
  if(officialPending.has(id))return;
  const d=manualData(id);
  if(publish){
    for(const[c]of CC){if(!CV.includes(d.scores[c]))return toast('Nota inválida em '+c);if(!d.just[c])return toast('Preencha a justificativa de '+c+'.')}
    if(!d.dev)return toast('Liste os desvios encontrados.');
    if(!d.prio)return toast('Defina a prioridade de melhoria.');
    if(!d.feed)return toast('Preencha a devolutiva ao aluno.');
  }
  d.saved_at=new Date().toISOString();
  try{localStorage.setItem(manualKey(id),JSON.stringify(d))}catch{if(!publish)return toast('Não foi possível salvar o rascunho neste navegador.')}
  if(!publish)return toast('Rascunho salvo neste navegador.');
  const button=$('slot-'+id)?.querySelector('[data-publish-manual]');
  officialPending.add(id);if(button){button.disabled=true;button.textContent='Publicando...'}
  try{
    const result=await edge(API.official,{action:'approve',submission_id:id,scores:d.scores,competency_justifications:d.just,improvement_priority:d.prio,feedback:d.feed,authorship_validation:d.auth,observations:d.obs,detailed_analysis:{deviations_rules:d.dev},correction_origin:'manual'});
    if(!result.approved||!result.score?.id)throw Error('O servidor não confirmou a aprovação.');
    S.cache={};toast('Nota '+result.score.total_score+' aprovada e publicada para o aluno.');
  }catch(e){toast(e.message||'Não foi possível publicar. O rascunho foi preservado.')}
  finally{officialPending.delete(id);if(button){button.disabled=false;button.textContent='Aprovar e publicar'}}
}

function renderAiResult(id,job,official,usage,row){
  const slot=$('slot-'+id),box=slot?.querySelector('.box');if(!box)return;
  const r={...(job?.result||{})};if(official){r.total_score=official.total_score;r.overall_feedback=official.feedback;r.improvement_priority=official.improvement_priority;r.detailed_analysis=official.detailed_analysis||{};r.c5_check=r.detailed_analysis.c5_check;r.c1_deviations=r.detailed_analysis.c1_deviations||[];r.competencies=Object.fromEntries(CC.map(([c])=>[c,{...(r.competencies?.[c]||{}),score:official.competencies?.[c],diagnostic:official.competency_justifications?.[c],improvement:official.detailed_analysis?.competency_improvements?.[c]||r.competencies?.[c]?.improvement}]));}const codes=['C1','C2','C3','C4','C5'],compData={};
  for(const c of codes){
    const rc=r.competencies?.[c]||{},offScore=official?.competencies?.[c];
    compData[c]={score:Number.isFinite(Number(rc.score))?Number(rc.score):(Number.isFinite(Number(offScore))?Number(offScore):null),diagnostic:String(rc.diagnostic||official?.competency_justifications?.[c]||rc.justification||'').trim(),strength:String(rc.strength||'').trim(),improvement:String(rc.improvement||'').trim()};
  }
  const total=Number.isFinite(Number(r.total_score))?Number(r.total_score):(Number.isFinite(Number(official?.total_score))?Number(official.total_score):null);
  const c1=Array.isArray(r.c1_deviations)?r.c1_deviations:Array.isArray(r.detailed_analysis?.c1_deviations)?r.detailed_analysis.c1_deviations:Array.isArray(r.detailed_analysis?.deviations_structured)?r.detailed_analysis.deviations_structured:Array.isArray(r.deviations)?r.deviations:[];
  const rawDev=String(r.detailed_analysis?.deviations_rules||official?.detailed_analysis?.deviations_rules||'').trim(),alerts=Array.isArray(r.alerts)?r.alerts.filter(Boolean):[];
  const jobStatus=job?.status||'official',model=job?.model||official?.protocol||'VERSÃO',reading=r.reading_quality?String(r.reading_quality):'',theme=r.theme_adherence?String(r.theme_adherence):'',copy=r.motivating_text_copy?String(r.motivating_text_copy):'';
  const statusText={completed:'Preliminar concluída',approved:'Correção oficial',processing:'Em processamento',queued:'Na fila',failed:'Falhou',cancelled:'Cancelada',official:'Oficial',historical:'Correção anterior'}[jobStatus]||'Estado não identificado';
  const cost=usage&&Number.isFinite(Number(usage.estimated_cost_usd))?Number(usage.estimated_cost_usd):null;
  box.innerHTML=`<div class="box-head editor-head"><div><h2>Correção Inteligente VERSÃO</h2><p>${esc(row?.student_name||'Aluno')} · análise da redação</p></div><span class="pill ${jobStatus==='approved'?'ok':jobStatus==='completed'?'warn':''}">${esc(statusText)}</span></div>
  <div class="box-body ai-report">
    <div class="score-total" data-ai-total>${total??'—'} / 1000</div>
    <div class="grid cols2"><div class="card metric"><small>Qualidade da leitura</small><b class="metric-text">${esc(reportPortuguese(reading)||'—')}</b></div><div class="card metric"><small>Aderência ao tema</small><b class="metric-text">${esc(reportPortuguese(theme)||'—')}</b></div></div>
    <div class="ai-section"><h4>Competências</h4><div class="ai-competencies">${codes.map(c=>{const d=compData[c];return `<div class="ai-comp"><div class="ai-comp-head"><b>${c}</b><span>${d.score??'—'}</span></div>${d.diagnostic?`<p><strong>Diagnóstico:</strong> ${esc(d.diagnostic)}</p>`:''}${d.strength?`<p><strong>Ponto forte:</strong> ${esc(d.strength)}</p>`:''}${d.improvement?`<p><strong>Como melhorar:</strong> ${esc(d.improvement)}</p>`:''}</div>`}).join('')}</div></div>
    ${r.needs_manual_review?`<div class="safe-note"><b>Revisão de leitura necessária.</b> ${esc(r.manual_review_reason||'Há trechos cuja leitura precisa ser conferida na foto.')}</div>`:''}
    ${alerts.length?`<div class="ai-section"><h4>Alertas</h4><div class="ai-alert-list">${alerts.map(a=>`<div class="ai-alert">${esc(a)}</div>`).join('')}</div></div>`:''}
    <div class="grid cols2"><div class="ai-section"><h4>Estrutura da introdução</h4><p>${esc(r.introduction_structure||official?.detailed_analysis?.thesis_d1_d2||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Produtividade do repertório</h4><p>${esc(r.repertoire_productivity||official?.detailed_analysis?.repertoire||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Alinhamento da intervenção</h4><p>${esc(r.intervention_alignment||official?.detailed_analysis?.c5_link||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Prioridade de melhoria</h4><p>${esc(official?.improvement_priority||r.improvement_priority||compData.C2.improvement||'Sem prioridade registrada.')}</p></div></div>
    <div class="ai-section"><h4>Devolutiva</h4><p>${esc(official?.feedback||r.overall_feedback||'Nenhuma devolutiva disponível.')}</p></div>
    <div class="ai-section"><h4>C1 · desvios</h4><p class="muted">Padrão definitivo: trecho original → correção → regra → categoria.</p><div class="c1-table">${c1.length?c1.map(x=>`<div class="c1-row"><div><b>Original</b><br>${esc(x.original||x.excerpt||x.trecho||'—')}</div><div><b>Correção</b><br>${esc(x.correction||x.corrected||x.correcao||'—')}</div><div><b>Regra</b><br>${esc(x.rule||x.regra||'—')}</div><div><b>Categoria</b><br>${esc(reportPortuguese(x.category||x.categoria||'—'))}</div></div>`).join(''):(rawDev?`<div class="ai-raw-deviations">${esc(rawDev)}</div>`:'<div class="empty">Esta correção não possui desvios C1 estruturados.</div>')}</div></div>
    ${r.repertoire_checks?.length?`<div class="ai-section"><h4>Verificação de repertórios</h4>${r.repertoire_checks.map(x=>`<p><strong>${esc(x.reference)}</strong> · ${esc(x.classification)}<br>${esc(x.analysis)} ${/^https:\/\//i.test(x.source_url||'')?`<a href="${esc(x.source_url)}" target="_blank" rel="noopener noreferrer">Consultar fonte</a>`:''}</p>`).join('')}</div>`:''}
    <div class="ai-section"><h4>C5 — Os cinco elementos da proposta de intervenção</h4><p>Confira o que foi identificado na redação em cada elemento. Eles devem estar relacionados ao problema discutido.</p>${[['action','1. Ação — O que será feito?','A medida proposta para enfrentar o problema.'],['agent','2. Agente — Quem fará?','Quem será responsável por executar a ação.'],['means','3. Meio/modo — Como será feito?','O recurso, instrumento ou procedimento usado para realizar a ação.'],['purpose','4. Finalidade/efeito — Para quê?','O objetivo ou resultado que a ação pretende alcançar.'],['detail','5. Detalhamento — Que informação torna a proposta mais específica?','Uma explicação, exemplo ou especificação de um dos elementos anteriores.']].map(([key,label,help])=>`<div class="ai-section"><p><strong>${label}</strong><br><small>${help}</small></p><p>${esc(r.c5_check?.[key]||'Não há análise registrada para este elemento nesta correção.')}</p></div>`).join('')}<h4>Verificações adicionais</h4><p><strong>Respeito aos direitos humanos:</strong> ${esc(r.c5_check?.human_rights||'Não registrado.')}</p><p><strong>Relação com os argumentos:</strong> ${esc(r.c5_check?.argument_alignment||'Não registrado.')}</p></div>
    ${r.paragraph_balance?`<div class="ai-section"><h4>Equilíbrio dos parágrafos</h4><p>${esc(r.paragraph_balance)}</p></div>`:''}
    ${r.syntax_assessment?`<div class="ai-section"><h4>Estrutura sintática</h4><p>${esc(r.syntax_assessment)}</p></div>`:''}
    ${r.reading_notes?`<div class="safe-note"><b>Leituras incertas e sugestões — não são desvios confirmados</b><p>${esc(r.reading_notes)}</p></div>`:''}
    ${r.review_requirements?.length?`<div class="safe-note"><b>Conferências necessárias</b><ul>${r.review_requirements.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
    ${r.transcription?`<details class="ai-section"><summary>Conferir transcrição</summary><p style="white-space:pre-wrap">${esc(r.transcription)}</p></details>`:''}
    ${copy?`<div class="ai-section"><h4>Cópia dos textos motivadores</h4><p>${esc(reportPortuguese(copy,'copy'))}</p></div>`:''}
    ${jobStatus==='completed'?`<div class="form-section"><details data-ai-edit><summary>Editar correção por IA</summary><p>Revise as notas e os textos antes de publicar. A edição não inicia outra correção.</p><div class="comp-grid">${codes.map(c=>`<label class="field"><small>${c} · ${CC.find(x=>x[0]===c)[1]}</small><select data-ai-score="${c}">${CV.map(v=>`<option value="${v}" ${v===compData[c].score?'selected':''}>${v}</option>`).join('')}</select><textarea data-ai-just="${c}" aria-label="Justificativa ${c}">${esc(compData[c].diagnostic)}</textarea><small>Próximo passo</small><textarea data-ai-next="${c}">${esc(compData[c].improvement)}</textarea></label>`).join('')}</div><label class="field"><small>Devolutiva ao aluno</small><textarea data-ai-feedback>${esc(r.overall_feedback||'')}</textarea></label><label class="field"><small>Anotações complementares do professor (não substituem a conferência das ocorrências)</small><textarea data-ai-deviations>${esc(r.detailed_analysis?.teacher_notes||'')}</textarea></label></details><label>Prioridade de melhoria<textarea data-ai-priority style="width:100%;min-height:80px">${esc(r.improvement_priority||'')}</textarea></label><p>Revise o resultado acima. Ao aprovar, a nota e a devolutiva serão disponibilizadas ao aluno.</p>${r.quality_version==='enem-evidence-2026-09-20'?`<div class="form-section"><h4>Conferir desvios no manuscrito</h4><p>A nota de C1 não é calculada por desconto por erro. Confira a leitura, a regra e a estrutura sintática.</p>${c1.map((d,i)=>`<div class="ai-section"><p><strong>${esc(d.original)}</strong> → ${esc(d.correction)}</p><p>${esc(d.rule)} · ${esc(d.location)}</p><blockquote>${esc(d.evidence)}</blockquote><label class="field"><small>Forma adequada</small><input data-deviation-correction="${i}" value="${esc(d.correction)}"></label><label class="field"><small>Regra aplicada no contexto</small><textarea data-deviation-rule="${i}">${esc(d.rule)}</textarea></label><label class="field"><small>Decisão para esta ocorrência</small><select data-deviation-review="${i}"><option value="">Conferir no manuscrito</option value="confirmed">Confirmo o desvio e a regra</option><option value="discarded">Descartar apontamento</option></select></label><label class="field"><small>Motivo, se descartado</small><input data-deviation-reason="${i}" placeholder="Leitura incorreta, variante aceita, sugestão de estilo..."></label></div>`).join('')||'<p>Nenhum desvio confirmado proposto. Confira a transcrição e o diagnóstico de C1.</p>'}<label class="field"><small>Registro da conferência e resolução das dúvidas</small><textarea data-review-note placeholder="Registre o que conferiu e os ajustes necessários nas notas e justificativas."></textarea></label><label><input type="checkbox" data-review-confirmed> Conferi o manuscrito, as ocorrências, as fontes e a coerência das notas. Resolvi as dúvidas indicadas.</label></div><button class="btn primary" data-approve-ai>Validar e publicar</button>`:'<div class="safe-note">Análise anterior ao controle de evidências. Use Correção manual para conferir e publicar sem nova cobrança, ou solicite uma nova análise.</div>'}<p data-approve-status role="status"></p></div>`:''}
    ${['completed','approved'].includes(jobStatus)?'<div class="item-actions"><button class="btn soft-btn" data-ai-redo>Refazer correção inteligente</button></div><p class="safe-note">Uma nova análise consome mais 1 crédito. A nota publicada, se houver, permanece até você aprovar a nova versão.</p>':''}
    <div class="safe-note"><b>Correção Inteligente com IA.</b> Novas leituras só são iniciadas por clique explícito em “Correção Inteligente”. A nota continua preliminar até revisão/aprovação do professor.</div>
  </div>`;
  box.querySelectorAll('[data-ai-score]').forEach(el=>el.onchange=()=>{box.querySelector('[data-ai-total]').textContent=codes.reduce((n,c)=>n+Number(box.querySelector(`[data-ai-score="${c}"]`).value),0)+' / 1000';});
  const redo=box.querySelector('[data-ai-redo]');
  if(redo)redo.onclick=async()=>{
    if(redo.disabled)return;redo.disabled=true;
    try{if(await appConfirm('Refazer a correção inteligente? Será consumido mais 1 crédito. A nova análise precisará da sua revisão e aprovação. Edições ainda não publicadas nesta tela não serão usadas na nova análise.')){if(box.isConnected)await aiCorrection(id,{redo:true,previousJob:job.id});}}
    finally{if(box.isConnected)redo.disabled=false}
  };
  const approve=box.querySelector('[data-approve-ai]');
  if(approve)approve.onclick=async()=>{
    if(approve.disabled)return;
    const priority=box.querySelector('[data-ai-priority]').value.trim(),status=box.querySelector('[data-approve-status]');
    if(!priority){status.textContent='Preencha a prioridade de melhoria antes de aprovar.';return}
    approve.disabled=true;
    try{
      if(!await appConfirm('Aprovar esta correção e publicar a nota e a devolutiva para o aluno?'))return;
      if(!box.isConnected)return;
      status.textContent='Publicando correção...';
      const edits=aiReviewData(box,r);
      if(!box.querySelector('[data-review-confirmed]')?.checked)throw Error('Confirme a conferência antes de publicar.');
      edits.review_confirmed=true;edits.review_note=box.querySelector('[data-review-note]').value.trim();
      edits.deviation_reviews=(r.c1_deviations||[]).map((d,i)=>({index:i,decision:box.querySelector(`[data-deviation-review="${i}"]`).value,reason:box.querySelector(`[data-deviation-reason="${i}"]`).value.trim(),correction:box.querySelector(`[data-deviation-correction="${i}"]`).value.trim(),rule:box.querySelector(`[data-deviation-rule="${i}"]`).value.trim()}));
      if(edits.review_note.length<12||edits.deviation_reviews.some(d=>!d.decision||(d.decision==='discarded'&&d.reason.length<8)))throw Error('Confira todas as ocorrências e registre a revisão.');
      const result=await edge(API.ai,{action:'approve',submission_id:id,job_id:job.id,improvement_priority:priority,...edits});
      if(!result.approved||!result.score?.id)throw Error('O servidor não confirmou a aprovação.');
      S.cache={};status.textContent='Correção aprovada e publicada para o aluno.';approve.textContent='Correção aprovada';approve.dataset.done='true';box.querySelectorAll('select,textarea').forEach(el=>el.disabled=true);
    }catch(error){status.textContent=error.message||'Não foi possível aprovar. Tente novamente.'}
    finally{approve.disabled=approve.dataset.done==='true'}
  };
}
// A request can continue on the server after navigation or a transport timeout.
// Keep its lock separate from the panel that observes it; never retry correct automatically.
const aiInFlight=new Map(),aiUncertain=new Set();
const AI_POLL_MS=2000,AI_WATCH_MS=620000,AI_READ_MS=15000;
function aiKey(id){return 'e12-ai-pending-'+S.session.user.id+'-'+id}
function aiPending(key,value){
  if(value===undefined){try{return aiUncertain.has(key)||localStorage.getItem(key)==='1'}catch{return aiUncertain.has(key)}}
  if(value)aiUncertain.add(key);else aiUncertain.delete(key);
  try{if(value)localStorage.setItem(key,'1');else localStorage.removeItem(key)}catch{}
}
async function aiRead(body){
  let timer;
  try{return await Promise.race([edge(API.ai,body),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Não foi possível consultar o andamento agora.')),AI_READ_MS)})])}
  finally{clearTimeout(timer)}
}
function aiPanelCurrent(ctx){
  return !ctx.stopped&&S.session?.user?.id===ctx.user&&navigationVersion===ctx.navigation&&
    $('slot-'+ctx.id)===ctx.slot&&ctx.slot.isConnected&&ctx.slot.querySelector('.box')===ctx.box;
}
function aiNotice(ctx,message,retry=false,waiting=false){
  if(!aiPanelCurrent(ctx))return;
  ctx.unlock?.update?.(message);
  const action=waiting?'':retry?'<button class="btn primary" data-ai-retry>Refazer correção inteligente</button>':'<button class="btn primary" data-ai-check>Acompanhar correção</button>';
  const history=ctx.history?'<button class="btn soft-btn" data-ai-history>Ver correção anterior</button>':'';
  const note=waiting?'Aguarde. O resultado abrirá automaticamente para sua revisão.':retry?'Uma nova correção consome 1 crédito e exige sua confirmação.':'Esta ação recupera a análise existente, sem consumir outro crédito.';
  ctx.box.innerHTML=`<div class="box-head"><h2>Correção inteligente</h2></div><div class="box-body"><div class="empty" role="status">${esc(message)}</div>${action||history?`<div class="item-actions">${action}${history}</div>`:''}<p class="safe-note">${note}</p></div>`;
  const historyButton=ctx.box.querySelector('[data-ai-history]');if(historyButton)historyButton.onclick=()=>aiPrevious(ctx);
  const check=ctx.box.querySelector('[data-ai-check]');
  if(check)check.onclick=()=>aiCorrection(ctx.id,{readOnly:true});
  const retryButton=ctx.box.querySelector('[data-ai-retry]');
  if(retryButton)retryButton.onclick=async()=>{retryButton.disabled=true;try{if(await appConfirm('Refazer a correção inteligente? Será consumido 1 crédito. A nova análise ficará disponível para sua revisão antes de publicar.'))await aiCorrection(ctx.id,{retry:true});}finally{retryButton.disabled=false}};
}
function aiPrevious(ctx){
 if(!ctx.history||!aiPanelCurrent(ctx))return;
 ctx.unlock();
 renderAiResult(ctx.id,{...ctx.history,status:'historical'},null,null,ctx.row);
 const header=ctx.box.querySelector('h2');if(header)header.textContent='Correção anterior — somente leitura';
 const back=document.createElement('button');back.className='btn primary';back.textContent='Voltar à correção atual';back.onclick=()=>aiCorrection(ctx.id,{readOnly:true});ctx.box.appendChild(back);
 ctx.stopped=true;
}
async function aiShowJob(ctx,job){
  if(!aiPanelCurrent(ctx))return true;
  if(ctx.previousJob===job?.id){
    if(!ctx.operation?.settled)return false;
    if(ctx.operation?.error){aiNotice(ctx,'Não foi possível confirmar a nova correção: '+ctx.operation.error+' Clique em Acompanhar correção para verificar se a análise foi iniciada.');return true}
  }
  if(['completed','approved'].includes(job?.status)){
    aiPending(ctx.key,false);
    if(!job.result?.competencies){aiNotice(ctx,'A execução terminou, mas o resultado recebido está incompleto. Consulte novamente.');return true}
    let official=null;if(job.status==='approved'){try{official=(await edge(API.official,{action:'get',submission_id:ctx.id})).official;if(!official)throw Error('missing');}catch{aiNotice(ctx,'Não foi possível carregar a versão oficial. Consulte novamente.');return true}}const usage=null;
    if(!aiPanelCurrent(ctx))return true;
    // Never mix an older official grade into the current preliminary result.
    renderAiResult(ctx.id,job,official,usage,ctx.row);
    S.cache.queue=null;
    S.cache.correctionRows=(S.cache.correctionRows||[]).map(x=>x.submission_id===ctx.id?{...x,job_status:job.status,status:job.status==='completed'?'awaiting_approval':x.status}:x);
    return true;
  }
  if(['failed','cancelled'].includes(job?.status)){
    if(ctx.operation?.promise&&!ctx.operation.settled)return false;
    aiPending(ctx.key,false);
    aiNotice(ctx,job.status==='failed'?'A correção falhou. '+(job.error_message||'O servidor não informou o motivo.'):'A execução foi cancelada.',true);
    return true;
  }
  return false;
}
async function aiWatch(ctx,initialJob){
  let job=initialJob,failures=0;
  const deadline=Date.now()+AI_WATCH_MS;
  while(aiPanelCurrent(ctx)&&Date.now()<deadline){
    const running=ctx.operation||aiInFlight.get(ctx.key);
    if(running?.job&&!['processing','queued'].includes(running.job.status))job=running.job;
    if(await aiShowJob(ctx,job))return;
    const seconds=Math.floor((Date.now()-(deadline-AI_WATCH_MS))/1000),elapsed=seconds>=60?`${Math.floor(seconds/60)} min ${seconds%60} s`:`${seconds} s`;
    aiNotice(ctx,failures?'Reconectando à correção em andamento. Nenhum crédito adicional será consumido.':`Analisando a redação. Isso pode levar alguns minutos. Tempo de acompanhamento: ${elapsed}.`,false,true);
    await new Promise(resolve=>setTimeout(resolve,AI_POLL_MS));
    if(!aiPanelCurrent(ctx))return;
    try{
      const current=await aiRead({action:'get',submission_id:ctx.id});job=current?.job||null;ctx.history=current?.previous_job||ctx.history;
      if(ctx.history)ctx.unlock.action?.('Ver correção anterior',()=>aiPrevious(ctx));
      failures=0;
    }catch{
      if(++failures>=3){aiNotice(ctx,'Não foi possível confirmar o resultado. O servidor pode continuar processando. Clique em Acompanhar correção para recuperar o resultado, sem nova cobrança.');return}
    }
  }
  aiNotice(ctx,'A análise demorou mais que o esperado. Clique em Acompanhar correção para verificar o resultado. Nenhuma nova correção será iniciada.');
}
async function aiCorrection(id,options={}){
  const slot=$('slot-'+id);if(!slot)return;
  const key=aiKey(id),row=(S.cache.correctionRows||[]).find(x=>x.submission_id===id);
  const previous=aiInFlight.get(key);
  if(previous?.starting)return;
  // Reserve before the first await, including status/get, to block double clicks.
  const reservation=previous||{starting:true};
  if(!previous)aiInFlight.set(key,reservation);
  slot.innerHTML=`<div class="split" style="margin-top:12px"><div class="essay-pane" id="aiEssay-${esc(id)}"></div><div class="box"><div class="box-head"><h2>Correção Inteligente VERSÃO</h2></div><div class="box-body"><div class="empty">Consultando a correção...</div></div></div></div>`;
  const ctx={id,key,row,previousJob:options.redo?options.previousJob:null,slot,box:slot.querySelector('.box'),user:S.session.user.id,navigation:navigationVersion,operation:reservation};
  openEssay(id,$('aiEssay-'+id));
  const unlock=generationScreen('Correção inteligente em andamento');ctx.unlock=unlock;
  try{
    const initial=await aiRead({action:'get',submission_id:id});let job=initial?.job||null;ctx.history=initial?.previous_job||null;
    if(ctx.history)unlock.action?.('Ver correção anterior',()=>aiPrevious(ctx));
    if(!aiPanelCurrent(ctx))return;
    if(['completed','approved'].includes(job?.status)&&!options.redo){await aiShowJob(ctx,job);return}
    if(options.redo&&job?.id!==options.previousJob){if(!await aiShowJob(ctx,job))await aiWatch(ctx,job);return}
    if(job?.status==='processing'||previous?.promise||((!options.retry)&&aiPending(key))){await aiWatch(ctx,job);return}
    if(['failed','cancelled'].includes(job?.status)&&!options.retry){await aiShowJob(ctx,job);return}
    if(options.readOnly){aiNotice(ctx,job?.status==='queued'?'A redação está na fila e ainda não iniciou. Clique em Correção Inteligente para iniciar.':'Não há execução em andamento. Clique em Correção Inteligente para iniciar.');return}
    if(job&&!['queued','failed','cancelled'].includes(job.status)&&!(options.redo&&['completed','approved'].includes(job.status)))throw Error('Estado da correção não reconhecido. Nenhuma execução foi iniciada.');
    if(!PAID_AI_ENABLED)throw Error('A geração paga de IA está bloqueada neste ambiente.');
    const status=await aiRead({action:'status'});
    if(!aiPanelCurrent(ctx))return;
    if(!status.enabled||!status.key_configured)throw Error('A IA está desativada ou não possui chave configurada no servidor.');
    if(S.profile.role!=='super_admin'&&!status.account_enabled)throw Error('A correção por IA não está habilitada para esta conta.');

    aiPending(key,true);
    reservation.starting=false;
    reservation.promise=edge(API.ai,{action:'correct',submission_id:id,...(options.redo?{force:true,previous_job_id:options.previousJob,credit_confirmed:true}:{})}).then(result=>{
      reservation.job=result?.job||null;
      if(['completed','approved','failed','cancelled'].includes(reservation.job?.status))aiPending(key,false);
    }).catch(error=>{
      reservation.error=error.message||'Falha de conexão.';
      // Ambiguous transport errors must be reconciled with GET, never another POST correct.
      reservation.uncertain=true;
    }).finally(()=>{reservation.settled=true;if(aiInFlight.get(key)===reservation)aiInFlight.delete(key)});
    await aiWatch(ctx,options.redo?{id:job?.id,status:'processing'}:job);
  }catch(e){aiNotice(ctx,e.message||'Não foi possível consultar a IA.')}
  finally{unlock();if(!reservation.promise&&aiInFlight.get(key)===reservation)aiInFlight.delete(key)}
}


function reportPortuguese(value,field=''){
 const text=String(value??'').trim(),key=text.toLowerCase();
 const copy={none:'Nenhuma cópia identificada',partial:'Cópia parcial identificada',extensive:'Cópia extensa identificada',suspected:'Suspeita de cópia',confirmed:'Cópia confirmada'};
 const terms={none:'Nenhum registro',unknown:'Não identificado',not_applicable:'Não se aplica',good:'Boa',excellent:'Excelente',fair:'Regular',poor:'Ruim',high:'Alta',medium:'Média',low:'Baixa',adequate:'Adequada',inadequate:'Inadequada',legible:'Legível',illegible:'Ilegível',partial:'Parcial',full:'Integral',complete:'Completa',yes:'Sim',no:'Não',on_topic:'Dentro do tema',off_topic:'Fuga ao tema',tangential:'Tangenciamento do tema',grammar:'Gramática',spelling:'Ortografia',punctuation:'Pontuação',agreement:'Concordância',syntax:'Sintaxe',accentuation:'Acentuação'};
 return (field==='copy'?copy[key]:null)||terms[key]||text;
}


function aiReviewData(box,result){
 const scores={},competency_justifications={},competency_improvements={};
 for(const [code] of CC){
  scores[code]=Number(box.querySelector(`[data-ai-score="${code}"]`).value);
  competency_justifications[code]=box.querySelector(`[data-ai-just="${code}"]`).value.trim();
  competency_improvements[code]=box.querySelector(`[data-ai-next="${code}"]`)?.value.trim()||result.competencies?.[code]?.improvement||'';
  if(!CV.includes(scores[code])||!competency_justifications[code])throw Error('Revise a nota e a justificativa de '+code+'.');
 }
 const overall_feedback=box.querySelector('[data-ai-feedback]').value.trim();
 if(!overall_feedback)throw Error('Preencha a devolutiva ao aluno.');
 const detailed_analysis={...result.detailed_analysis,competency_improvements,deviations_rules:box.querySelector('[data-ai-deviations]').value.trim()};
 delete detailed_analysis.c1_deviations;delete detailed_analysis.deviations_structured;
 return {scores,competency_justifications,overall_feedback,detailed_analysis};
}
