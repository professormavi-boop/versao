'use strict';

(function(){
  const style=document.createElement('style');
  style.textContent=`
    .ai-focus-page{max-width:760px;margin:0 auto;padding-bottom:32px}
    .ai-focus-back{margin:4px 0 14px}
    .ai-focus-card{background:#fff;border:1px solid #e5dfdc;border-radius:18px;padding:20px;box-shadow:0 8px 28px rgba(57,31,28,.05)}
    .ai-focus-card .item-top{margin-bottom:8px}
    .ai-focus-card .item-actions{display:none!important}
    .ai-focus-card .split{display:block!important;margin-top:12px!important}
    .ai-focus-card .essay-pane{display:none!important}
    .ai-focus-card .box{width:100%;max-width:none;margin:0;border:0;box-shadow:none}
    .ai-focus-card .box-head{padding-left:0;padding-right:0}
    .ai-focus-card .box-body{padding-left:0;padding-right:0}
    .ai-focus-card .correction-progress{margin-top:4px}
    @media(max-width:720px){.ai-focus-card{padding:16px;border-radius:16px}.ai-focus-page{padding:0 2px 24px}}
  `;
  document.head.appendChild(style);

  function focusLabel(status){
    return status==='processing'||status==='queued'?'Em análise':status==='completed'?'Pronta para revisar':status==='approved'?'Concluída':status==='failed'?'Falha na correção':'Preparando';
  }

  function enterAiFocus(id,status='processing'){
    const row=(S.cache.correctionRows||[]).find(x=>x.submission_id===id)||{};
    $('view').innerHTML=`<section class="ai-focus-page">
      <button class="btn ghost ai-focus-back" id="aiFocusBack" type="button">← Voltar para correções</button>
      <article class="ai-focus-card" data-sub="${esc(id)}">
        <div class="item-top">
          <div>
            <div class="item-title">${esc(row.student_name||'Redação')}</div>
            <div class="item-meta">${esc(row.theme||'')}</div>
          </div>
          <span class="pill">${esc(focusLabel(status))}</span>
        </div>
        <div id="slot-${esc(id)}"></div>
      </article>
    </section>`;
    $('aiFocusBack').onclick=()=>navigate('correction');
  }

  const baseQueueStatus=aiQueueStatus;
  aiQueueStatus=function(id,status){
    baseQueueStatus(id,status);
    const focus=$('slot-'+id)?.closest?.('.ai-focus-card');
    if(focus){
      const pill=focus.querySelector('.pill');
      if(pill)pill.textContent=focusLabel(status);
    }
  };

  const baseCorrectionClick=correctionClick;
  correctionClick=async function(e){
    let b=e.target.closest('[data-menu]');
    if(b){
      const id=b.dataset.menu;
      const row=(S.cache.correctionRows||[]).find(x=>x.submission_id===id);
      const state=correctionState(row||{});
      if(state==='processing'){
        enterAiFocus(id,'processing');
        return aiCorrection(id,{readOnly:true});
      }
      if(state==='validation'){
        enterAiFocus(id,'completed');
        return aiCorrection(id,{readOnly:true});
      }
    }

    b=e.target.closest('[data-ai]');
    if(b){
      if(b.disabled)return;
      const id=b.dataset.ai;
      b.disabled=true;
      try{
        const current=await aiRead({action:'get',submission_id:id});
        const job=current?.job;
        enterAiFocus(id,job?.status||'processing');
        if(['completed','approved'].includes(job?.status))return aiCorrection(id,{redo:true,previousJob:job.id});
        return aiCorrection(id,['failed','cancelled'].includes(job?.status)?{retry:true}:{});
      }catch(error){
        toast(error.message||'Não foi possível iniciar a correção.');
        navigate('correction');
      }
      return;
    }

    return baseCorrectionClick(e);
  };
})();
