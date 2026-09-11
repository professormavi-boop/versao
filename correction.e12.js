'use strict';
async function openEssay(id,slot){slot.innerHTML='<div class="viewer"><div class="empty">Carregando redação...</div></div>';try{const d=await edge(API.live,{action:'list',submission_id:id}),f=(d.files||[]).sort((a,b)=>a.page_number-b.page_number)[0];slot.innerHTML=f?`<div class="viewer"><div class="viewer-head"><b>Redação · 1 página</b></div>${String(f.mime_type).startsWith('image')?`<img src="${esc(f.signed_url)}" alt="Redação">`:'<div class="empty">Arquivo legado não-imagem.</div>'}</div>`:'<div class="empty">Nenhuma captura encontrada.</div>'}catch(e){slot.innerHTML=`<div class="empty">${esc(e.message)}</div>`}}
const CV=[0,40,80,120,160,200],CC=[['C1','Norma padrão'],['C2','Compreensão do tema'],['C3','Argumentação'],['C4','Coesão'],['C5','Intervenção']];
function manualKey(id){return'e12-manual-'+S.session.user.id+'-'+id}function blankManual(){return{scores:Object.fromEntries(CC.map(([c])=>[c,160])),just:Object.fromEntries(CC.map(([c])=>[c,''])),dev:'',prio:'',feed:'',auth:'',obs:''}}
async function manualCorrection(id){const slot=$('slot-'+id),row=(S.cache.correctionRows||[]).find(x=>x.submission_id===id);let d;try{d=JSON.parse(localStorage.getItem(manualKey(id))||'null')}catch{}if(!d){d=blankManual();try{const o=(await edge(API.official,{action:'get',submission_id:id})).official;if(o){CC.forEach(([c])=>{if(CV.includes(Number(o.competencies?.[c])))d.scores[c]=Number(o.competencies[c]);d.just[c]=o.competency_justifications?.[c]||''});d.dev=o.detailed_analysis?.deviations_rules||'';d.prio=o.improvement_priority||'';d.feed=o.feedback||'';d.auth=o.authorship_validation||'';d.obs=o.observations||''}}catch{}}slot.innerHTML=`<div class="split" style="margin-top:12px"><div class="essay-pane" id="manualEssay-${id}"></div><div class="box"><div class="box-head"><h2>Correção manual</h2><p>${esc(row?.student_name||'Aluno')} · publicação real desativada</p></div><div class="box-body"><div class="score-total" id="total-${id}">0</div><div class="comp-grid">${CC.map(([c,l])=>`<div class="comp-card"><div class="comp-card-top"><div><b>${c}</b><div class="muted">${l}</div></div><select data-ms="${c}">${CV.map(v=>`<option value="${v}" ${Number(d.scores[c])===v?'selected':''}>${v}</option>`).join('')}</select></div><textarea data-mj="${c}" placeholder="Diagnóstico / justificativa">${esc(d.just[c]||'')}</textarea></div>`).join('')}</div><div class="form-section"><h4>Desvios encontrados</h4><textarea data-dev style="width:100%;min-height:100px">${esc(d.dev)}</textarea></div><div class="form-section"><h4>Prioridade de melhoria</h4><textarea data-prio style="width:100%;min-height:80px">${esc(d.prio)}</textarea></div><div class="form-section"><h4>Devolutiva ao aluno</h4><textarea data-feed style="width:100%;min-height:100px">${esc(d.feed)}</textarea></div><div class="form-section"><h4>Autoria e observações</h4><textarea data-auth placeholder="Validação de autoria" style="width:100%;min-height:70px">${esc(d.auth)}</textarea><textarea data-obs placeholder="Observações internas" style="width:100%;min-height:70px;margin-top:8px">${esc(d.obs)}</textarea></div><div class="item-actions"><button class="btn soft-btn" data-save-manual="${id}">Salvar rascunho</button><button class="btn primary" data-publish-manual="${id}">Aprovar e publicar</button></div><div class="safe-note">Aprovar valida o formulário, mas não publica na produção.</div></div></div></div>`;slot.querySelectorAll('[data-ms]').forEach(s=>s.onchange=()=>manualTotal(id));manualTotal(id);openEssay(id,$('manualEssay-'+id))}
function manualData(id){const slot=$('slot-'+id),d=blankManual();CC.forEach(([c])=>{d.scores[c]=Number(slot.querySelector(`[data-ms="${c}"]`)?.value||0);d.just[c]=slot.querySelector(`[data-mj="${c}"]`)?.value.trim()||''});d.dev=slot.querySelector('[data-dev]')?.value.trim()||'';d.prio=slot.querySelector('[data-prio]')?.value.trim()||'';d.feed=slot.querySelector('[data-feed]')?.value.trim()||'';d.auth=slot.querySelector('[data-auth]')?.value.trim()||'';d.obs=slot.querySelector('[data-obs]')?.value.trim()||'';return d}function manualTotal(id){const d=manualData(id),t=Object.values(d.scores).reduce((a,b)=>a+Number(b),0);$('total-'+id).textContent=t+' / 1000'}function saveManual(id,publish){const d=manualData(id);if(publish){for(const[c]of CC)if(!d.just[c])return toast('Preencha a justificativa de '+c+'.');if(!d.dev)return toast('Liste os desvios encontrados.');if(!d.prio)return toast('Defina a prioridade de melhoria.');if(!d.feed)return toast('Preencha a devolutiva ao aluno.')}d.saved_at=new Date().toISOString();localStorage.setItem(manualKey(id),JSON.stringify(d));safeMessage(publish?'Aprovação da correção manual':'Rascunho da correção manual')}
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
  const statusText={completed:'Preliminar concluída',approved:'Aprovada',processing:'Em processamento',queued:'Na fila',failed:'Falhou',official:'Oficial'}[jobStatus]||jobStatus;
  const cost=usage&&Number.isFinite(Number(usage.estimated_cost_usd))?Number(usage.estimated_cost_usd):null;
  box.innerHTML=`<div class="box-head editor-head"><div><h2>Correção com IA</h2><p>${esc(row?.student_name||'Aluno')} · módulo conectado ao ai-correction-api</p></div><span class="pill ${jobStatus==='approved'?'ok':jobStatus==='completed'?'warn':''}">${esc(statusText)}</span></div>
  <div class="box-body ai-report">
    <div class="grid cols4"><div class="card metric"><small>Nota total</small><b>${total??'—'}</b></div><div class="card metric"><small>Modelo</small><b class="metric-text">${esc(model)}</b></div><div class="card metric"><small>Tokens</small><b class="metric-text">${usage?`${Number(usage.input_tokens||0).toLocaleString('pt-BR')} + ${Number(usage.output_tokens||0).toLocaleString('pt-BR')}`:'—'}</b></div><div class="card metric"><small>Custo estimado</small><b class="metric-text">${cost==null?'—':`US$ ${cost.toFixed(4)}`}</b></div></div>
    <div class="grid cols2"><div class="card metric"><small>Qualidade da leitura</small><b class="metric-text">${esc(reading||'—')}</b></div><div class="card metric"><small>Aderência ao tema</small><b class="metric-text">${esc(theme||'—')}</b></div></div>
    <div class="ai-section"><h4>Competências</h4><div class="ai-competencies">${codes.map(c=>{const d=compData[c];return `<div class="ai-comp"><div class="ai-comp-head"><b>${c}</b><span>${d.score??'—'}</span></div>${d.diagnostic?`<p><strong>Diagnóstico:</strong> ${esc(d.diagnostic)}</p>`:''}${d.strength?`<p><strong>Ponto forte:</strong> ${esc(d.strength)}</p>`:''}${d.improvement?`<p><strong>Como melhorar:</strong> ${esc(d.improvement)}</p>`:''}</div>`}).join('')}</div></div>
    ${alerts.length?`<div class="ai-section"><h4>Alertas</h4><div class="ai-alert-list">${alerts.map(a=>`<div class="ai-alert">${esc(a)}</div>`).join('')}</div></div>`:''}
    <div class="grid cols2"><div class="ai-section"><h4>Estrutura da introdução</h4><p>${esc(r.introduction_structure||official?.detailed_analysis?.thesis_d1_d2||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Produtividade do repertório</h4><p>${esc(r.repertoire_productivity||official?.detailed_analysis?.repertoire||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Alinhamento da intervenção</h4><p>${esc(r.intervention_alignment||official?.detailed_analysis?.c5_link||'Sem registro específico.')}</p></div><div class="ai-section"><h4>Prioridade de melhoria</h4><p>${esc(official?.improvement_priority||r.improvement_priority||compData.C2.improvement||'Sem prioridade registrada.')}</p></div></div>
    <div class="ai-section"><h4>Devolutiva</h4><p>${esc(official?.feedback||r.overall_feedback||'Nenhuma devolutiva disponível.')}</p></div>
    <div class="ai-section"><h4>C1 · desvios</h4><p class="muted">Padrão definitivo: trecho original → correção → regra → categoria.</p><div class="c1-table">${c1.length?c1.map(x=>`<div class="c1-row"><div><b>Original</b><br>${esc(x.original||x.excerpt||x.trecho||'—')}</div><div><b>Correção</b><br>${esc(x.correction||x.corrected||x.correcao||'—')}</div><div><b>Regra</b><br>${esc(x.rule||x.regra||'—')}</div><div><b>Categoria</b><br>${esc(x.category||x.categoria||'—')}</div></div>`).join(''):(rawDev?`<div class="ai-raw-deviations">${esc(rawDev)}</div>`:'<div class="empty">Esta correção não possui desvios C1 estruturados.</div>')}</div></div>
    ${copy?`<div class="ai-section"><h4>Cópia dos textos motivadores</h4><p>${esc(copy)}</p></div>`:''}
    <div class="safe-note"><b>IA conectada.</b> Novas leituras só são iniciadas por clique explícito em “Corrigir com IA” e geram custo real. A nota continua preliminar até revisão/aprovação do professor.</div>
  </div>`;
}
const aiInFlight=new Set();
async function aiCorrection(id){
  if(aiInFlight.has(id))return;
  aiInFlight.add(id);
  const slot=$('slot-'+id),row=(S.cache.correctionRows||[]).find(x=>x.submission_id===id);
  slot.innerHTML=`<div class="split" style="margin-top:12px"><div class="essay-pane" id="aiEssay-${esc(id)}"></div><div class="box"><div class="box-head"><h2>Correção com IA</h2><p>${esc(row?.student_name||'Aluno')} · preparando conexão real...</p></div><div class="box-body"><div class="empty">Verificando a IA e a correção existente...</div></div></div></div>`;
  openEssay(id,$('aiEssay-'+id));
  const box=slot.querySelector('.box');
  try{
    const [statusRes,getRes,officialRes]=await Promise.all([edge(API.ai,{action:'status'}),edge(API.ai,{action:'get',submission_id:id}),edge(API.official,{action:'get',submission_id:id}).catch(()=>({official:null}))]);
    if(!statusRes.enabled)throw Error('A correção por IA está desativada no sistema.');
    if(!statusRes.key_configured)throw Error('A chave da IA não está configurada no servidor.');
    if(S.profile.role!=='super_admin'&&!statusRes.account_enabled)throw Error('A correção por IA não está habilitada para esta conta.');
    let job=getRes?.job||null;
    const official=officialRes?.official||null;
    if(['approved','completed','processing','queued'].includes(job?.status)){
      const usage=await aiUsage(id);renderAiResult(id,job,official,usage,row);return;
    }
    if(!PAID_AI_ENABLED)throw Error('A geração paga de IA está bloqueada neste ambiente.');
    box.querySelector('.box-body').innerHTML=`<div class="empty"><b>Lendo a redação com IA...</b><br><br>Modelo: ${esc(statusRes.model||'gpt-5.6-terra')} · reasoning ${esc(statusRes.reasoning||'low')}. Esta ação pode gerar custo real.</div>`;
    const corrected=await edge(API.ai,{action:'correct',submission_id:id});
    job=corrected?.job||job;
    const usage=await aiUsage(id);renderAiResult(id,job,official,usage,row);
    S.cache.queue=null;S.cache.correctionRows=(S.cache.correctionRows||[]).map(x=>x.submission_id===id?{...x,job_status:job?.status||x.job_status,status:job?.status==='completed'?'awaiting_approval':x.status}:x);
  }catch(e){
    box.innerHTML=`<div class="box-head"><h2>Correção com IA</h2><p>${esc(row?.student_name||'Aluno')}</p></div><div class="box-body"><div class="errorbox"><b>Não foi possível executar a correção com IA.</b><br><br>${esc(e.message||e)}</div><div class="safe-note">Nenhuma aprovação automática foi realizada.</div></div>`;
  }finally{aiInFlight.delete(id)}
}

async function pasteAi(id){
  try{
    const {job}=await edge(API.ai,{action:'get',submission_id:id});
    if(!job?.result||!['completed','approved'].includes(job.status))throw Error('Ainda não há uma correção de IA concluída para esta redação.');
    const r=job.result,d=blankManual();
    for(const [c] of CC){const item=r.competencies?.[c];if(item?.score==null||!CV.includes(Number(item.score)))throw Error('A nota de '+c+' não é válida para importar.');d.scores[c]=Number(item.score);d.just[c]=String(item.diagnostic||item.justification||'');}
    const deviations=r.c1_deviations||r.detailed_analysis?.c1_deviations||r.detailed_analysis?.deviations_structured||r.deviations;
    d.dev=Array.isArray(deviations)?deviations.map(x=>[x.original||x.excerpt||x.trecho||'',x.correction||x.corrected||x.correcao||'',x.rule||x.regra||'',x.category||x.categoria||''].join(' → ')).join('\n'):String(r.detailed_analysis?.deviations_rules||'');
    d.prio=String(r.improvement_priority||'');d.feed=String(r.overall_feedback||r.feedback||'');d.saved_at=new Date().toISOString();
    if(localStorage.getItem(manualKey(id))&&!confirm('Substituir o rascunho manual local pelos dados da IA?'))return;
    localStorage.setItem(manualKey(id),JSON.stringify(d));await manualCorrection(id);toast('Correção da IA copiada para o rascunho local. Revise antes de aprovar.');
  }catch(e){toast(e.message||'Não foi possível copiar a correção da IA.')}
}
