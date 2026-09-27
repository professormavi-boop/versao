'use strict';
(function(){
  const previousRenderAiResult=renderAiResult;

  function enrichOfficial(job,official){
    if(!official)return official;
    const result=job?.result||{};
    const jobDetailed=result.detailed_analysis||{};
    const officialDetailed=official.detailed_analysis||{};
    const detailed={...jobDetailed,...officialDetailed};

    if(!Array.isArray(detailed.c1_deviations)){
      const deviations=Array.isArray(result.c1_deviations)?result.c1_deviations:Array.isArray(jobDetailed.c1_deviations)?jobDetailed.c1_deviations:null;
      if(deviations)detailed.c1_deviations=deviations;
    }
    if(!detailed.c5_check)detailed.c5_check=result.c5_check||jobDetailed.c5_check||null;
    if(!detailed.competency_improvements&&jobDetailed.competency_improvements)detailed.competency_improvements=jobDetailed.competency_improvements;
    if(!detailed.main_strength&&result.main_strength)detailed.main_strength=result.main_strength;
    if(!detailed.next_step&&result.next_step)detailed.next_step=result.next_step;

    return {...official,detailed_analysis:detailed};
  }

  renderAiResult=(id,job,official,usage,row)=>{
    const officialFixed=enrichOfficial(job,official);
    let jobFixed=job;

    if(officialFixed?.total_score!=null&&job?.result){
      jobFixed={...job,result:{...job.result,total_score:officialFixed.total_score}};
    }

    return previousRenderAiResult(id,jobFixed,officialFixed,usage,row);
  };

  const previousRenderTeacherAccount=renderTeacherAccount;
  const paymentLabels={
    created:'Iniciado',
    pending:'Pendente',
    approved:'Aprovado',
    rejected:'Recusado',
    cancelled:'Cancelado',
    refunded:'Reembolsado'
  };
  const paymentPills={
    approved:'ok',
    created:'warn',
    pending:'warn',
    rejected:'warn',
    cancelled:'warn',
    refunded:'warn'
  };

  function paymentDate(value){
    if(!value)return 'Data não informada';
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return 'Data não informada';
    return date.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  }

  function paymentMoney(cents){
    return (Number(cents||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  }

  function purchaseHistoryHtml(rows){
    if(!rows.length)return '<div class="empty">Nenhuma compra registrada.</div>';
    return rows.map(row=>{
      const status=String(row.status||'').toLowerCase();
      const label=paymentLabels[status]||'Em processamento';
      const credits=Number(row.credits||0);
      return `<article class="list-item"><div class="item-top"><div><div class="item-title">${esc(paymentDate(row.created_at))}</div><div class="item-meta">${credits} ${credits===1?'crédito':'créditos'} · ${esc(paymentMoney(row.amount_cents))}</div></div><span class="pill ${paymentPills[status]||'warn'}">${esc(label)}</span></div></article>`;
    }).join('');
  }

  renderTeacherAccount=async navigation=>{
    await previousRenderTeacherAccount(navigation);
    if(!navigationCurrent(navigation))return;
    const page=$('view')?.querySelector('.credit-page');
    if(!page)return;

    const history=document.createElement('section');
    history.className='box';
    history.setAttribute('aria-labelledby','purchaseHistoryTitle');
    history.innerHTML='<div class="box-head"><h2 id="purchaseHistoryTitle">Histórico de compras</h2><p>Consulte data, créditos, valor e status dos pagamentos.</p></div><div class="box-body list" id="purchaseHistoryList"><div class="empty">Carregando compras…</div></div>';
    page.appendChild(history);

    try{
      const rows=await rest('correction_payment_orders?select=id,credits,amount_cents,status,created_at,approved_at&order=created_at.desc&limit=20');
      if(!navigationCurrent(navigation)||!history.isConnected)return;
      $('purchaseHistoryList').innerHTML=purchaseHistoryHtml(Array.isArray(rows)?rows:[]);
    }catch(error){
      if(!navigationCurrent(navigation)||!history.isConnected)return;
      $('purchaseHistoryList').innerHTML='<div class="empty">Não foi possível carregar o histórico agora.</div>';
    }
  };
})();
