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

async function aiUsage(id){
  try{
    const rows=await rest(`ai_correction_usage?submission_id=eq.${encodeURIComponent(id)}&select=input_tokens,output_tokens,estimated_cost_usd,model,created_at&order=created_at.desc&limit=1`);
    return rows?.[0]||null;
  }catch{return null}
}
function renderAiResult(id,job,official,usage,row){
  const slot=$('slot-'+id),box=slot?.querySelector('.box');if(!box)return;
  const r=job?.result||{},codes=['C1','C2','C3','C4','C5'],compData={};
  for(const c of codes){
    const rc=r.competencies?.[c]||{},offScore=official?.competencies?.[c];
    compData[c]={score:Number.isFinite(Number(rc.score))?Number(rc.score):(Number.isFinite(Number(offScore))?Number(offScore):null),diagnostic:String(rc.diagnostic||official?.competency_justifications?.[c]||rc.justification||'').trim(),strength:String(rc.strength||'').trim(),improvement:String(rc.improvement||'').trim()};
  }
  const total=Number.isFinite(Number(r.total_score))?Number(r.total_score):(Number.isFinite(Number(official?.total_score))?Number(official.total_score):null);
  const c1=Array.isArray(r.c1_deviations)?r.c1_deviations:Array.isArray(r.detailed_analysis?.c1_deviations)?r.detailed_analysis.c1_deviations:Array.isArray(r.detailed_analysis?.deviations_structured)?r.detailed_analysis.deviations_structured:Array.isArray(r.deviations)?r.deviations:[];
  const rawDev=String(r.detailed_analysis?.deviations_rules||official?.detailed_analysis?.deviations_rules||'').trim(),alerts=Array.isArray(r.alerts)?r.alerts.filter(Boolean):[];
  const jobStatus=job?.status||'official',model=job?.model||official?.protocol||'VERSÃO',reading=r.reading_quality?String(r.reading_quality):'',theme=r.theme_adherence?String(r.theme_adherence):'',copy=r.motivating_text_copy?String(r.motivating_text_copy):'';
  const statusText={completed:'Preliminar concluída',approved:'Correção oficial',processing:'Em processamento',queued:'Na fila',failed:'Falhou',cancelled:'Cancelada',official:'Oficial'}[jobStatus]||'Estado não identificado';
  const cost=usage&&Number.isFinite(Number(usage.estimated_cost_usd))?Number(usage.estimated_cost_usd):null;
  box.innerHTML=`<div class="box-head editor-head"><div><h2>Correção Inteligente VERSÃO</h2><p>${esc(row?.student_name||'Aluno')} · análise da redação</p></div><span class="pill ${jobStatus==='approved'?'ok':jobStatus==='completed'?'warn':''}">${esc(statusText)}</span></div>
  <div class="box-body ai-report">
    <div class="grid cols4"><div class="card metric"><small>Nota total</small><b>${total??'—'}</b></div><div class="card metric"><small>Modelo</small><b class="metric-text">${esc(model)}</b></div><div class="card metric"><small>Unidades de texto (entrada + saída)</small><b class="metric-text">${usage?`${Number(usage.input_tokens||0).toLocaleString('pt-BR')} + ${Number(usage.output_tokens||0).toLocaleString('pt-BR')}`:'—'}</b></div><div class="card metric"><small>Custo estimado</small><b class="metric-text">${cost==null?'—':`US$ ${cost.toFixed(4)}`}</b></div></div>
    <div class="grid cols2"><div class="card metric"><small>Qualidade da leitura</small><b class="metric-text">${esc(reportPortuguese(reading)||'—')}</b></div><div class="card metric"><small>Aderência ao tema</small><b class="metric-text">${esc(reportPortuguese(theme)||'—')}</b></div></div>
    <div class="ai-section"><h4>Competências</h4><div class="ai-competencies">${codes.map(c=>{const d=compData[c];return `<div class="ai-comp"><div class="ai-comp-head"><b>${c}</b><span>${d.score??'—'}</span></div>${d.diagnostic?`<p><strong>Diagnóstico:</strong> ${esc(d.diagnostic)}</p>`:''}${d.strength?`<p><strong>Ponto forte:</strong> ${esc(d.strength)}</p>`:''}${d.improvement?`<p><strong>Como melhorar:</strong> ${esc(d.improvement)}</p>`:''}</div>`}).join('')}</div></div>
    ${alerts.length?`<div class="ai-section"><h4>Alertas</h4><div class="ai-alert-list">${alerts.map(a=>`<div class="ai-alert">${esc(a)}</div>`).join('')}</div></div>`:''}
    <div class="grid cols2"><div class="ai-section"><h4>Estrutura da introdução</h4><p>${esc(r.introduction_structure||official?.detailed_analysis?.thesis_d1_d2||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Produtividade do repertório</h4><p>${esc(r.repertoire_productivity||official?.detailed_analysis?.repertoire||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Alinhamento da intervenção</h4><p>${esc(r.intervention_alignment||official?.detailed_analysis?.c5_link||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Prioridade de melhoria</h4><p>${esc(official?.improvement_priority||r.improvement_priority||compData.C2.improvement||'Sem prioridade registrada.')}</p></div></div>
    <div class="ai-section"><h4>Devolutiva</h4><p>${esc(official?.feedback||r.overall_feedback||'Nenhuma devolutiva disponível.')}</p></div>
    <div class="ai-section"><h4>C1 · desvios</h4><p class="muted">Padrão definitivo: trecho original → correção → regra → categoria.</p><div class="c1-table">${c1.length?c1.map(x=>`<div class="c1-row"><div><b>Original</b><br>${esc(x.original||x.excerpt||x.trecho||'—')}</div><div><b>Correção</b><br>${esc(x.correction||x.corrected||x.correcao||'—')}</div><div><b>Regra</b><br>${esc(x.rule||x.regra||'—')}</div><div><b>Categoria</b><br>${esc(reportPortuguese(x.category||x.categoria||'—'))}</div></div>`).join(''):(rawDev?`<div class="ai-raw-deviations">${esc(rawDev)}</div>`:'<div class="empty">Esta correção não possui desvios C1 estruturados.</div>')}</div></div>
    ${copy?`<div class="ai-section"><h4>Cópia dos textos motivadores</h4><p>${esc(reportPortuguese(copy,'copy'))}</p></div>`:''}
    ${jobStatus==='completed'?`<div class="form-section"><label>Prioridade de melhoria<textarea data-ai-priority style="width:100%;min-height:80px">${esc(r.improvement_priority||'')}</textarea></label><p>Revise o resultado acima. Ao aprovar, a nota e a devolutiva serão disponibilizadas ao aluno.</p><button class="btn primary" data-approve-ai>Validar e publicar</button><p data-approve-status role="status"></p></div>`:''}
    <div class="safe-note"><b>Correção Inteligente com IA.</b> Novas leituras só são iniciadas por clique explícito em “Correção Inteligente” e geram custo real. A nota continua preliminar até revisão/aprovação do professor.</div>
  </div>`;
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
      const result=await edge(API.ai,{action:'approve',submission_id:id,improvement_priority:priority});
      if(!result.approved||!result.score?.id)throw Error('O servidor não confirmou a aprovação.');
      S.cache={};status.textContent='Correção aprovada e publicada para o aluno.';approve.textContent='Correção aprovada';approve.dataset.done='true';
    }catch(error){status.textContent=error.message||'Não foi possível aprovar. Tente novamente.'}
    finally{approve.disabled=approve.dataset.done==='true'}
  };
}
// A request can continue on the server after navigation or a transport timeout.
// Keep its lock separate from the panel that observes it; never retry correct automatically.
const aiInFlight=new Map(),aiUncertain=new Set();
const AI_POLL_MS=2000,AI_WATCH_MS=300000,AI_READ_MS=15000;
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
  return S.session?.user?.id===ctx.user&&navigationVersion===ctx.navigation&&
    $('slot-'+ctx.id)===ctx.slot&&ctx.slot.isConnected&&ctx.slot.querySelector('.box')===ctx.box;
}
function aiNotice(ctx,message,retry=false){
  if(!aiPanelCurrent(ctx))return;
  ctx.box.innerHTML=`<div class="box-head"><h2>Correção Inteligente VERSÃO</h2></div><div class="box-body"><div class="empty" role="status">${esc(message)}</div><div class="item-actions"><button class="btn soft-btn" data-ai-check>Consultar andamento</button>${retry?'<button class="btn primary" data-ai-retry>Tentar nova Correção Inteligente</button>':''}</div><div class="safe-note">Consultar andamento não inicia uma nova correção. Sair desta tela não cancela o trabalho no servidor. Nenhuma aprovação automática é realizada.</div></div>`;
  ctx.box.querySelector('[data-ai-check]').onclick=()=>aiCorrection(ctx.id,{readOnly:true});
  const retryButton=ctx.box.querySelector('[data-ai-retry]');
  if(retryButton)retryButton.onclick=async()=>{if(await appConfirm('Iniciar uma nova tentativa de correção? Esta ação pode gerar custo real.'))aiCorrection(ctx.id,{retry:true})};
}
async function aiShowJob(ctx,job){
  if(!aiPanelCurrent(ctx))return true;
  if(['completed','approved'].includes(job?.status)){
    aiPending(ctx.key,false);
    if(!job.result?.competencies){aiNotice(ctx,'A execução terminou, mas o resultado recebido está incompleto. Consulte novamente.');return true}
    const usage=await aiUsage(ctx.id);
    if(!aiPanelCurrent(ctx))return true;
    // Never mix an older official grade into the current preliminary result.
    renderAiResult(ctx.id,job,null,usage,ctx.row);
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
    if(running?.job)job=running.job;
    if(await aiShowJob(ctx,job))return;
    aiNotice(ctx,failures?'Conexão instável. Tentando consultar o andamento...':job?.status==='processing'?'Lendo a redação com IA. O resultado aparecerá aqui ao terminar.':'Aguardando confirmação do servidor. Nenhuma nova execução será iniciada.');
    await new Promise(resolve=>setTimeout(resolve,AI_POLL_MS));
    if(!aiPanelCurrent(ctx))return;
    try{
      job=(await aiRead({action:'get',submission_id:ctx.id}))?.job||null;
      failures=0;
    }catch{
      if(++failures>=3){aiNotice(ctx,'Não foi possível confirmar o resultado. O servidor pode continuar processando. Use Consultar andamento para recuperar a correção.');return}
    }
  }
  aiNotice(ctx,'O acompanhamento automático foi pausado após cinco minutos. Isso não cancela a correção. Use Consultar andamento para verificar o resultado.');
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
  const ctx={id,key,row,slot,box:slot.querySelector('.box'),user:S.session.user.id,navigation:navigationVersion,operation:reservation};
  openEssay(id,$('aiEssay-'+id));
  let unlock=()=>{};
  try{
    let job=(await aiRead({action:'get',submission_id:id}))?.job||null;
    if(!aiPanelCurrent(ctx))return;
    if(['completed','approved'].includes(job?.status)){await aiShowJob(ctx,job);return}
    if(job?.status==='processing'||previous?.promise||((!options.retry)&&aiPending(key))){unlock=generationScreen('Sua correção está sendo processada…');await aiWatch(ctx,job);return}
    if(['failed','cancelled'].includes(job?.status)&&!options.retry){await aiShowJob(ctx,job);return}
    if(options.readOnly){aiNotice(ctx,job?.status==='queued'?'A redação está na fila e ainda não iniciou. Clique em Correção Inteligente para iniciar.':'Não há execução em andamento. Clique em Correção Inteligente para iniciar.');return}
    if(job&&!['queued','failed','cancelled'].includes(job.status))throw Error('Estado da correção não reconhecido. Nenhuma execução foi iniciada.');
    if(!PAID_AI_ENABLED)throw Error('A geração paga de IA está bloqueada neste ambiente.');
    const status=await aiRead({action:'status'});
    if(!aiPanelCurrent(ctx))return;
    if(!status.enabled||!status.key_configured)throw Error('A IA está desativada ou não possui chave configurada no servidor.');
    if(S.profile.role!=='super_admin'&&!status.account_enabled)throw Error('A correção por IA não está habilitada para esta conta.');
    unlock=generationScreen('Sua correção está sendo gerada…');
    aiPending(key,true);
    reservation.starting=false;
    reservation.promise=edge(API.ai,{action:'correct',submission_id:id}).then(result=>{
      reservation.job=result?.job||null;
      if(['completed','approved','failed','cancelled'].includes(reservation.job?.status))aiPending(key,false);
    }).catch(()=>{
      // Ambiguous transport errors must be reconciled with GET, never another POST correct.
      reservation.uncertain=true;
    }).finally(()=>{reservation.settled=true;if(aiInFlight.get(key)===reservation)aiInFlight.delete(key)});
    await aiWatch(ctx,job);
  }catch(e){aiNotice(ctx,e.message||'Não foi possível consultar a IA.')}
  finally{unlock();if(!reservation.promise&&aiInFlight.get(key)===reservation)aiInFlight.delete(key)}
}


function reportPortuguese(value,field=''){
 const text=String(value??'').trim(),key=text.toLowerCase();
 const copy={none:'Nenhuma cópia identificada',partial:'Cópia parcial identificada',extensive:'Cópia extensa identificada',suspected:'Suspeita de cópia',confirmed:'Cópia confirmada'};
 const terms={none:'Nenhum registro',unknown:'Não identificado',not_applicable:'Não se aplica',good:'Boa',excellent:'Excelente',fair:'Regular',poor:'Ruim',high:'Alta',medium:'Média',low:'Baixa',adequate:'Adequada',inadequate:'Inadequada',legible:'Legível',illegible:'Ilegível',partial:'Parcial',full:'Integral',complete:'Completa',yes:'Sim',no:'Não',on_topic:'Dentro do tema',off_topic:'Fuga ao tema',tangential:'Tangenciamento do tema',grammar:'Gramática',spelling:'Ortografia',punctuation:'Pontuação',agreement:'Concordância',syntax:'Sintaxe',accentuation:'Acentuação'};
 return (field==='copy'?copy[key]:null)||terms[key]||text;
}

