'use strict';

// Camada de apresentação dos estados da correção. Mantém o fluxo e os contratos existentes.
function correctionFriendlyMessage(message){
  const text=String(message||'').trim();
  if(!text)return 'Não foi possível concluir a correção automática. Tente novamente.';
  if(/mutually exclusive parameters|input\[\d+\]\.content|file_id|filename/i.test(text)){
    return 'Não foi possível concluir a correção automática por uma falha técnica no processamento do arquivo. A redação permanece salva e o crédito desta tentativa foi devolvido.';
  }
  if(/openai respondeu|provider|response_id|http status|api/i.test(text)){
    return 'Não foi possível concluir a correção automática neste momento. A redação permanece salva. Tente novamente em instantes.';
  }
  return text;
}

openEssay=async function(id,slot){
  slot.innerHTML='<div class="viewer"><div class="empty">Carregando redação...</div></div>';
  try{
    const d=await edge(API.live,{action:'list',submission_id:id});
    const f=(d.files||[]).sort((a,b)=>a.page_number-b.page_number)[0];
    if(!f){slot.innerHTML='<div class="empty">Nenhum arquivo encontrado.</div>';return;}
    const isImage=String(f.mime_type||'').startsWith('image');
    const isPdf=String(f.mime_type||'').includes('pdf');
    slot.innerHTML=`<div class="viewer"><div class="viewer-head"><b>Redação · 1 página</b>${!isImage&&f.signed_url?`<a class="btn soft-btn" href="${esc(f.signed_url)}" target="_blank" rel="noopener">Abrir arquivo</a>`:''}</div>${isImage?`<img src="${esc(f.signed_url)}" alt="Redação">`:isPdf?'<div class="empty">Arquivo enviado em PDF. Use “Abrir arquivo” para visualizar.</div>':'<div class="empty">Arquivo enviado. Use “Abrir arquivo” para visualizar.</div>'}</div>`;
  }catch(e){
    slot.innerHTML=`<div class="empty">${esc(correctionFriendlyMessage(e.message))}</div>`;
  }
};

aiQueueStatus=function(id,status){
  S.cache.queue=null;
  const row=(S.cache.correctionRows||[]).find(x=>x.submission_id===id);if(row)row.job_status=status;
  const card=$('slot-'+id)?.closest?.('article');if(!card)return;
  const pill=card.querySelector('.pill'),button=card.querySelector('[data-menu]');
  const labels={processing:'Em análise',queued:'Na fila',completed:'Pronta para revisar',approved:'Concluída',failed:'Falha na correção',cancelled:'Cancelada'};
  if(pill)pill.textContent=labels[status]||'Aguardando correção';
  if(button)button.textContent=status==='processing'||status==='queued'?'Acompanhar correção':status==='completed'?'Revisar correção':status==='failed'?'Tentar novamente':status==='approved'?'Ver correção':'Corrigir redação';
};

aiNotice=function(ctx,message,retry=false,waiting=false){
  if(!aiPanelCurrent(ctx))return;
  const friendly=correctionFriendlyMessage(message);
  ctx.unlock?.update?.(friendly);
  const action=waiting?'':retry?'<button class="btn primary" data-ai-retry>Tentar novamente</button>':'<button class="btn primary" data-ai-check>Acompanhar correção</button>';
  const history=ctx.history?'<button class="btn soft-btn" data-ai-history>Ver correção anterior</button>':'';
  const note=waiting
    ?'A Inteligência VERSÃO está analisando a redação. Você pode sair desta tela e voltar depois para acompanhar o andamento.'
    :retry
      ?'A tentativa anterior permanece registrada. Quando uma tentativa falha antes da correção ser concluída, o crédito reservado é devolvido; uma nova tentativa usa 1 crédito.'
      :'Esta ação apenas recupera a análise existente e não inicia uma nova cobrança.';
  const title=retry?'Correção não concluída':'Status da correção';
  ctx.box.innerHTML=`<div class="box-head"><h2>${title}</h2></div><div class="box-body">${waiting?'<ol class="correction-progress"><li>Recebida</li><li aria-current="step">Analisando</li><li>Pronta para revisar</li></ol>':''}<div class="empty" role="status">${esc(friendly)}</div>${action||history?`<div class="item-actions">${action}${history}</div>`:''}<p class="safe-note">${note}</p></div>`;
  const historyButton=ctx.box.querySelector('[data-ai-history]');if(historyButton)historyButton.onclick=()=>aiPrevious(ctx);
  const check=ctx.box.querySelector('[data-ai-check]');if(check)check.onclick=()=>aiCorrection(ctx.id,{readOnly:true});
  const retryButton=ctx.box.querySelector('[data-ai-retry]');
  if(retryButton)retryButton.onclick=async()=>{retryButton.disabled=true;try{await aiCorrection(ctx.id,{retry:true});}finally{retryButton.disabled=false}};
};
