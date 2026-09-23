'use strict';

(function(){
  const baseRenderAiResult=renderAiResult;
  const baseManualCorrection=manualCorrection;
  let activeTab='all';
  let activeSearch='';

  const style=document.createElement('style');
  style.textContent=`
    .cf-wrap{max-width:820px;margin:0 auto;padding-bottom:36px}.cf-head h1{margin-bottom:4px}.cf-head p{margin-top:0;color:#6e6866}
    .cf-tabs{display:flex;gap:8px;overflow:auto;padding:4px 0 14px;scrollbar-width:none}.cf-tabs::-webkit-scrollbar{display:none}.cf-tab{white-space:nowrap;border:1px solid #ddd4d1;background:#fff;color:#5f5856;border-radius:11px;padding:9px 13px;font-weight:700}.cf-tab.active{background:#991d1f;color:#fff;border-color:#991d1f}
    .cf-search{width:100%;height:46px;border:1px solid #ddd4d1;border-radius:13px;padding:0 14px;font:inherit;background:#fff;margin-bottom:14px}
    .cf-list{display:grid;gap:14px}.cf-card{background:#fff;border:1px solid #e5dfdc;border-radius:18px;padding:18px;box-shadow:0 7px 24px rgba(57,31,28,.045)}
    .cf-card-top{display:flex;gap:12px;align-items:flex-start;justify-content:space-between}.cf-name{font-size:18px;font-weight:800;color:#272321}.cf-theme{margin-top:5px;color:#6f6967;line-height:1.35}.cf-meta{margin-top:7px;color:#8a8380;font-size:14px}
    .cf-pill{flex:0 0 auto;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800;background:#f1f1f2;color:#5f6167}.cf-pill.processing{background:#fff2cf;color:#9a6200}.cf-pill.validation{background:#e9f2ff;color:#285e9b}.cf-pill.approved{background:#e6f5eb;color:#247043}.cf-pill.failed{background:#fde9e7;color:#9d251e}
    .cf-file{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:16px 0;padding:12px 13px;border-radius:13px;background:#f7f7f8}.cf-file b{display:block}.cf-file small{color:#7b7674}.cf-icon{font-size:22px;margin-right:8px}.cf-file-main{display:flex;align-items:center;min-width:0}
    .cf-actions{display:grid;gap:9px}.cf-actions .btn{width:100%;justify-content:center;min-height:46px}.cf-manual{margin-top:5px;text-align:center}
    .cf-flow{max-width:720px;margin:0 auto;padding-bottom:36px}.cf-back{margin-bottom:14px}.cf-panel{background:#fff;border:1px solid #e5dfdc;border-radius:20px;padding:20px;box-shadow:0 8px 28px rgba(57,31,28,.05)}
    .cf-flow-title{font-size:24px;font-weight:850;margin:0 0 5px}.cf-flow-sub{color:#716b68;margin:0 0 18px;line-height:1.4}.cf-info{background:#f3f6fa;border-radius:14px;padding:14px;margin:14px 0;line-height:1.4;color:#4d555e}.cf-info.error{background:#fff0ee;color:#7d2924}.cf-info.success{background:#edf8f0;color:#28643c}
    .cf-footer-actions{display:grid;grid-template-columns:1fr 1.5fr;gap:10px;margin-top:18px}.cf-footer-actions .btn{min-height:46px;justify-content:center}
    .cf-process{text-align:center;padding:12px 0 4px}.cf-ring{width:118px;height:118px;border-radius:50%;margin:4px auto 18px;background:conic-gradient(#991d1f 0 38%,#f1dada 38% 100%);display:grid;place-items:center}.cf-ring:after{content:'✎';display:grid;place-items:center;width:88px;height:88px;border-radius:50%;background:#fff;font-size:34px;color:#991d1f}
    .cf-process h2,.cf-result h2{font-size:25px;margin:0 0 7px}.cf-process p,.cf-result p{color:#736d6a;line-height:1.45}.cf-steps{display:grid;grid-template-columns:1fr 1fr 1fr;align-items:start;margin:22px 0}.cf-step{position:relative;font-size:13px;color:#777}.cf-step:before{content:'';display:block;width:30px;height:30px;border-radius:50%;margin:0 auto 7px;background:#eee;border:2px solid #d8d8da}.cf-step.done:before{content:'✓';background:#258957;color:#fff;border-color:#258957;line-height:26px}.cf-step.current:before{content:'2';background:#991d1f;color:#fff;border-color:#991d1f;line-height:26px;font-weight:800}.cf-time{background:#f6f7f9;border-radius:14px;padding:14px;margin:12px 0;color:#4d535a}.cf-status-note{background:#f6f7f9;border-radius:14px;padding:14px;margin-top:14px;color:#686d73}
    .cf-result{text-align:center;padding:12px 0}.cf-result-icon{width:98px;height:98px;margin:5px auto 18px;border-radius:50%;display:grid;place-items:center;font-size:46px;font-weight:800}.cf-result-icon.ok{background:#e5f5ea;color:#258957}.cf-result-icon.fail{background:#fde9e7;color:#b12520}.cf-result .btn{width:100%;justify-content:center;margin-top:9px;min-height:46px}.cf-viewer{margin-top:14px;text-align:left}
    .cf-flow .split{display:block!important;margin-top:0!important}.cf-flow .essay-pane{display:none!important}.cf-flow .box{border:0!important;box-shadow:none!important;margin:0!important;max-width:none!important}.cf-flow .box-head,.cf-flow .box-body{padding-left:0!important;padding-right:0!important}
    @media(max-width:640px){.cf-wrap,.cf-flow{padding:0 2px 28px}.cf-card,.cf-panel{padding:16px;border-radius:16px}.cf-footer-actions{grid-template-columns:1fr}.cf-name{font-size:17px}.cf-theme{font-size:14px}.cf-ring{width:106px;height:106px}.cf-ring:after{width:78px;height:78px}}
  `;
  document.head.appendChild(style);

  const stateLabels={uncorrected:'Aguardando correção',processing:'Em análise',validation:'Pronta para revisar',approved:'Concluída',failed:'Falha na correção'};

  correctionState=function(row){
    if(row?.score?.is_approved||row?.job_status==='approved')return 'approved';
    if(['processing','queued'].includes(row?.job_status))return 'processing';
    if(row?.job_status==='completed')return 'validation';
    if(['failed','cancelled'].includes(row?.job_status))return 'failed';
    return 'uncorrected';
  };

  function rowById(id){return (S.cache.correctionRows||[]).find(x=>x.submission_id===id)||{};}
  function formatSubmitted(row){const value=row.submitted_at||row.created_at||row.updated_at;return value?fmtDate(value):'';}
  function fileBlock(row,visualize=true){return `<div class="cf-file"><div class="cf-file-main"><span class="cf-icon">▤</span><div><b>Redação enviada</b><small>1 página${formatSubmitted(row)?' · enviada em '+esc(formatSubmitted(row)):''}</small></div></div>${visualize?`<button class="btn soft-btn" type="button" data-cf-view="${esc(row.submission_id)}">Visualizar</button>`:''}</div>`;}
  function statusPill(state){return `<span class="cf-pill ${state}">${stateLabels[state]||'Aguardando correção'}</span>`;}

  function cardHtml(row){
    const state=correctionState(row),id=esc(row.submission_id),primary=state==='uncorrected'?'Correção inteligente':state==='processing'?'Acompanhar correção':state==='validation'?'Revisar correção':state==='approved'?'Ver correção':'Ver falha';
    return `<article class="cf-card"><div class="cf-card-top"><div><div class="cf-name">${esc(row.student_name||'Aluno')}</div><div class="cf-theme">${esc(row.theme||'')}</div><div class="cf-meta">${esc(row.class_name||'')} ${row.orgName||row.organization_name?'· '+esc(row.orgName||row.organization_name):''}</div></div>${statusPill(state)}</div>${fileBlock(row,false)}<div class="cf-actions"><button class="btn primary" data-cf-primary="${id}" type="button">${primary}</button><button class="btn soft-btn" data-cf-view="${id}" type="button">Ver redação</button></div></article>`;
  }

  function drawQueue(){
    const q=S.cache.correctionRows||[],needle=activeSearch.trim().toLocaleLowerCase('pt-BR');
    const filtered=q.filter(row=>(activeTab==='all'||correctionState(row)===activeTab)&&(!needle||String(row.student_name||'').toLocaleLowerCase('pt-BR').includes(needle)||String(row.theme||'').toLocaleLowerCase('pt-BR').includes(needle)));
    const list=$('cfList');if(list)list.innerHTML=filtered.length?filtered.map(cardHtml).join(''):'<div class="empty">Nenhuma redação encontrada.</div>';
    document.querySelectorAll('.cf-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
  }

  renderCorrection=async function(navigation){
    const q=await teacherQueue(true);
    q.forEach(x=>{x.orgName=x.organization_name||x.orgName||'Sem instituição';});
    if(!navigationCurrent(navigation))return;
    S.cache.correctionRows=q;
    const counts={all:q.length,processing:q.filter(x=>correctionState(x)==='processing').length,validation:q.filter(x=>correctionState(x)==='validation').length,failed:q.filter(x=>correctionState(x)==='failed').length};
    $('view').innerHTML=`<section class="cf-wrap"><div class="cf-head"><h1>Fila de correções</h1><p>Acompanhe e gerencie as redações enviadas pelos seus alunos.</p></div><div class="cf-tabs"><button class="cf-tab" data-tab="all">Todas (${counts.all})</button><button class="cf-tab" data-tab="processing">Em análise (${counts.processing})</button><button class="cf-tab" data-tab="validation">Prontas (${counts.validation})</button><button class="cf-tab" data-tab="failed">Falhas (${counts.failed})</button></div><input id="cfSearch" class="cf-search" placeholder="Buscar aluno ou tema..." value="${esc(activeSearch)}"><div id="cfList" class="cf-list"></div></section>`;
    drawQueue();
    $('view').onclick=async e=>{
      const tab=e.target.closest('[data-tab]');if(tab){activeTab=tab.dataset.tab;drawQueue();return;}
      const view=e.target.closest('[data-cf-view]');if(view){return showEssay(view.dataset.cfView);}
      const primary=e.target.closest('[data-cf-primary]');if(primary){const id=primary.dataset.cfPrimary,row=rowById(id),state=correctionState(row);if(state==='uncorrected')return showConfirm(id);if(state==='processing')return showProcessing(id,true);if(state==='validation'||state==='approved')return showProcessing(id,true);if(state==='failed')return showFailure(id,row);}
    };
    $('cfSearch').oninput=e=>{activeSearch=e.target.value;drawQueue();};
  };

  function flowShell(row,status,body){
    $('view').innerHTML=`<section class="cf-flow"><button class="btn ghost cf-back" id="cfBack" type="button">← Voltar para correções</button><div class="cf-panel"><div class="cf-card-top"><div><div class="cf-name">${esc(row.student_name||'Redação')}</div><div class="cf-theme">${esc(row.theme||'')}</div><div class="cf-meta">${esc(row.class_name||'')} ${row.orgName||row.organization_name?'· '+esc(row.orgName||row.organization_name):''}</div></div>${statusPill(status)}</div>${body}</div></section>`;
    $('cfBack').onclick=()=>navigate('correction');
  }

  function showConfirm(id){
    const row=rowById(id);
    flowShell(row,'uncorrected',`<h2 class="cf-flow-title" style="margin-top:20px">Iniciar correção inteligente</h2><p class="cf-flow-sub">Confirme os dados da redação antes de enviar para análise.</p>${fileBlock(row,true)}<div class="cf-info"><b>A correção usa 1 crédito.</b><br>A Inteligência VERSÃO analisará a redação e preparará uma correção para sua revisão.</div><div class="cf-footer-actions"><button class="btn soft-btn" id="cfCancel" type="button">Cancelar</button><button class="btn primary" id="cfSend" type="button">Enviar para correção</button></div><div class="cf-manual"><button class="btn ghost" id="cfManual" type="button">Corrigir manualmente</button></div><div id="cfPreview" class="cf-viewer"></div>`);
    $('cfCancel').onclick=()=>navigate('correction');
    $('cfManual').onclick=()=>{flowShell(row,'uncorrected','<div id="slot-'+esc(id)+'"></div>');baseManualCorrection(id);};
    $('cfSend').onclick=async()=>{const b=$('cfSend');b.disabled=true;showProcessing(id,false);await aiCorrection(id,{retry:true});};
    $('view').onclick=e=>{const v=e.target.closest('[data-cf-view]');if(v)openEssay(id,$('cfPreview'));};
  }

  function showEssay(id){
    const row=rowById(id);
    flowShell(row,correctionState(row),`<h2 class="cf-flow-title" style="margin-top:20px">Redação</h2><div id="cfEssay" class="cf-viewer"></div>`);
    openEssay(id,$('cfEssay'));
  }

  async function showProcessing(id,readOnly){
    const row=rowById(id);
    flowShell(row,'processing',`<div id="slot-${esc(id)}"></div>`);
    const slot=$('slot-'+id);slot.innerHTML=`<div class="split"><div class="essay-pane" id="aiEssay-${esc(id)}"></div><div class="box"><div class="box-body"><div class="cf-process"><div class="cf-ring"></div><h2>Analisando sua redação</h2><p>A Inteligência VERSÃO está analisando o texto e preparando a correção.</p><div class="cf-steps"><div class="cf-step done">Recebida</div><div class="cf-step current">Analisando</div><div class="cf-step">Finalizando</div></div><div class="cf-time">Iniciando análise...</div><div class="cf-status-note">Você pode sair desta tela. A correção continuará em segundo plano.</div></div></div></div></div>`;
    if(readOnly)return aiCorrection(id,{readOnly:true});
  }

  function showFailure(id,row){
    flowShell(row,'failed',`<div id="slot-${esc(id)}"><div class="box"><div class="box-body"><div class="cf-result"><div class="cf-result-icon fail">!</div><h2>Não foi possível concluir a correção</h2><p>Ocorreu um problema no processamento da redação. O arquivo permanece salvo.</p><div class="cf-info error"><b>Nenhum crédito foi consumido nesta tentativa.</b><br>Você pode tentar novamente.</div><button class="btn primary" id="cfRetry" type="button">Tentar novamente</button><button class="btn soft-btn" id="cfSeeEssay" type="button">Ver redação</button></div></div></div></div>`);
    $('cfRetry').onclick=async()=>{showProcessing(id,false);await aiCorrection(id,{retry:true});};
    $('cfSeeEssay').onclick=()=>showEssay(id);
  }

  aiQueueStatus=function(id,status){
    S.cache.queue=null;
    const row=rowById(id);if(row)row.job_status=status;
    const pill=document.querySelector('.cf-flow .cf-pill');if(pill){const state=status==='completed'?'validation':status==='approved'?'approved':['failed','cancelled'].includes(status)?'failed':['processing','queued'].includes(status)?'processing':'uncorrected';pill.className='cf-pill '+state;pill.textContent=stateLabels[state];}
  };

  function friendly(message){
    const text=String(message||'');
    if(/credit_balance_exhausted|saldo|insufficient.*credit/i.test(text))return 'O serviço de inteligência está temporariamente sem saldo de processamento. A redação permanece salva e nenhum crédito da Versão foi consumido.';
    if(/mutually exclusive|file_id|filename|input\[/i.test(text))return 'Houve uma falha técnica ao preparar o arquivo. A redação permanece salva e nenhum crédito foi consumido.';
    if(/provedor|provider|api|response/i.test(text))return 'Não foi possível concluir a análise neste momento. A redação permanece salva e nenhum crédito foi consumido.';
    return text||'Não foi possível concluir a correção.';
  }

  aiNotice=function(ctx,message,retry=false,waiting=false){
    if(!aiPanelCurrent(ctx))return;
    if(waiting){
      const seconds=Math.max(0,Math.floor((Date.now()-Date.parse(ctx.startedAt||new Date().toISOString()))/1000));
      ctx.box.innerHTML=`<div class="box-body"><div class="cf-process"><div class="cf-ring"></div><h2>Analisando sua redação</h2><p>A Inteligência VERSÃO está analisando o texto e preparando a correção.</p><div class="cf-steps"><div class="cf-step done">Recebida</div><div class="cf-step current">Analisando</div><div class="cf-step">Finalizando</div></div><div class="cf-time"><b>Tempo decorrido: ${seconds} s</b>${ctx.averageSeconds?`<br><small>Tempo médio: cerca de ${Math.round(ctx.averageSeconds)} s</small>`:''}</div><div class="cf-status-note">Você pode sair desta tela. A correção continuará em segundo plano.</div></div></div>`;
      return;
    }
    if(retry){
      ctx.box.innerHTML=`<div class="box-body"><div class="cf-result"><div class="cf-result-icon fail">!</div><h2>Não foi possível concluir a correção</h2><p>${esc(friendly(message))}</p><div class="cf-info error"><b>Nenhum crédito foi consumido nesta tentativa.</b><br>A redação permanece salva.</div><button class="btn primary" data-ai-retry type="button">Tentar novamente</button><button class="btn soft-btn" data-cf-inline-view type="button">Ver redação</button></div><div id="cfInlineViewer" class="cf-viewer"></div></div>`;
      const retryButton=ctx.box.querySelector('[data-ai-retry]');retryButton.onclick=async()=>{retryButton.disabled=true;try{await aiCorrection(ctx.id,{retry:true});}finally{retryButton.disabled=false;}};
      const viewButton=ctx.box.querySelector('[data-cf-inline-view]');viewButton.onclick=()=>openEssay(ctx.id,ctx.box.querySelector('#cfInlineViewer'));
      return;
    }
    ctx.box.innerHTML=`<div class="box-body"><div class="cf-status-note">${esc(friendly(message))}</div></div>`;
  };

  renderAiResult=function(id,job,official,usage,row){
    const slot=$('slot-'+id),box=slot?.querySelector('.box');if(!box)return;
    if(box.dataset.showCorrection==='1')return baseRenderAiResult(id,job,official,usage,row);
    const approved=job?.status==='approved',total=Number(job?.result?.total_score??official?.total_score),score=Number.isFinite(total)?`${total} / 1000`:'';
    aiQueueStatus(id,approved?'approved':'completed');
    box.innerHTML=`<div class="box-body"><div class="cf-result"><div class="cf-result-icon ok">✓</div><h2>${approved?'Correção concluída':'Correção concluída!'}</h2><p>A correção da redação de ${esc(row?.student_name||'aluno')} está pronta para ${approved?'consulta':'ser revisada'}.</p>${score?`<div class="cf-info success"><b>${score}</b>${approved?'<br>Nota oficial publicada.':'<br>Resultado preliminar — revise antes de publicar.'}</div>`:''}<button class="btn primary" data-show-correction type="button">Ver correção</button><button class="btn soft-btn" data-show-original type="button">Ver redação original</button></div><div id="cfOriginal" class="cf-viewer"></div></div>`;
    box.querySelector('[data-show-correction]').onclick=()=>{box.dataset.showCorrection='1';baseRenderAiResult(id,job,official,usage,row);};
    box.querySelector('[data-show-original]').onclick=()=>openEssay(id,box.querySelector('#cfOriginal'));
  };
})();
