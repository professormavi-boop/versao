'use strict';
(function(){
 const style=document.createElement('style');
 style.textContent=`
 .credit-package{position:relative}
 .credit-package.credit-featured{border:2px solid #8b1c1c;box-shadow:0 10px 28px rgba(139,28,28,.10);padding:25px}
 .credit-plan-name{margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.02em;color:#606775}
 .credit-badge{display:inline-flex;align-items:center;margin:0 0 12px;padding:6px 10px;border-radius:999px;background:#8b1c1c;color:#fff;font-size:12px;font-weight:800}
 .credit-package.credit-featured .credit-buy{background:#8b1c1c;color:#fff;border-color:#8b1c1c}
 .credit-package .credit-unit{font-weight:700;color:#424a56}
 .credit-tabs{display:flex;gap:8px;margin:20px 0 16px;padding:4px;border:1px solid var(--line);border-radius:14px;background:#fff;width:max-content;max-width:100%}
 .credit-tab{min-height:42px;border:0;border-radius:10px;background:transparent;color:var(--muted);padding:0 16px;font-weight:850;cursor:pointer;white-space:nowrap}
 .credit-tab[aria-selected="true"]{background:var(--soft);color:var(--crimson)}
 .credit-tab:focus-visible{outline:2px solid var(--crimson);outline-offset:2px}
 .credit-panel[hidden]{display:none!important}
 .credit-history{margin-top:0}
 .credit-delta{font-weight:850}.credit-delta.is-debit{color:var(--crimson)}.credit-delta.is-credit{color:#2f6f4e}
 .credit-more{display:flex;justify-content:center;padding:14px 0 2px}
 .credit-more [hidden]{display:none!important}
 @media(max-width:700px){.credit-package.credit-featured{padding:23px}.credit-tabs{width:100%;overflow-x:auto}.credit-tab{flex:1;padding:0 10px;white-space:normal;min-width:92px}}
 `;
 document.head.appendChild(style);

 const PAGE_SIZE=10;
 const MAX_RECORDS=50;
 const paymentLabels={created:'Iniciado',pending:'Pendente',approved:'Aprovado',rejected:'Recusado',cancelled:'Cancelado',refunded:'Reembolsado'};
 const paymentPills={approved:'ok',created:'warn',pending:'warn',rejected:'warn',cancelled:'warn',refunded:'warn'};
 const paymentMoney=cents=>(Number(cents||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const paymentDate=value=>{
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'Data não informada':date.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
 };
 const purchaseHistory=rows=>rows.map(row=>{const status=String(row.status||'').toLowerCase(),credits=Number(row.credits||0);return `<article class="list-item"><div class="item-top"><div><div class="item-title">${esc(paymentDate(row.created_at))}</div><div class="item-meta">${credits} ${credits===1?'crédito':'créditos'} · ${esc(paymentMoney(row.amount_cents))}</div></div><span class="pill ${paymentPills[status]||'warn'}">${esc(paymentLabels[status]||'Em processamento')}</span></div></article>`}).join('');
 const usageLabel=row=>{
  const ref=String(row.external_reference||'');
  const service=String(row.metadata?.service||'');
  if(row.event_type==='freemium')return 'Saldo inicial';
  if(row.event_type==='purchase')return 'Compra de créditos';
  if(row.event_type==='refund')return 'Crédito devolvido';
  if(service==='proposal'||ref.startsWith('proposal-reserve:'))return 'Proposta com IA';
  if(ref.startsWith('correction-reserve:')||row.metadata?.submission_id)return 'Correção';
  return 'Uso de crédito';
 };
 const usageHistory=rows=>rows.map(row=>{
  const delta=Number(row.delta||0),credit=delta>0;
  return `<article class="list-item"><div class="item-top"><div><div class="item-title">${esc(usageLabel(row))}</div><div class="item-meta">${esc(paymentDate(row.created_at))} · Saldo após o movimento: ${Number(row.balance_after||0)}</div></div><span class="credit-delta ${credit?'is-credit':'is-debit'}">${delta>0?'+':''}${delta}</span></div></article>`;
 }).join('');

 window.renderTeacherAccount=async function(navigation){
  const data=await edge(API.credit,{action:'packages'});if(!navigationCurrent(navigation))return;
  const balance=Number(data.balance||0),lowCredit=balance<=200;
  const money=value=>Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  let historyLoaded=false,usageLoaded=false,historyOffset=0,usageOffset=0;
  $('view').innerHTML=header('Conta e créditos','Seu saldo, seus dados e mais tempo para ensinar.')+`<div class="credit-page">
  <section class="credit-summary" aria-label="Resumo da conta">
  <div class="credit-balance"><span>Créditos disponíveis</span><strong>${balance}</strong><p>1 crédito por correção ou proposta com IA</p></div>
  <div class="credit-person"><strong>${esc(S.profile.full_name||'Professor')}</strong><p>${esc(S.profile.email||'')}</p></div>
  </section>
  ${lowCredit?`<p class="credit-notice" role="status">${balance===0?'Seu saldo acabou. Escolha um pacote para continuar corrigindo.':`Você tem ${balance} créditos disponíveis. Quando precisar, adicione mais créditos abaixo.`}</p>`:''}
  <div class="credit-tabs" role="tablist" aria-label="Conta e créditos">
   <button type="button" class="credit-tab" id="creditBuyTab" role="tab" aria-selected="true" aria-controls="creditBuyPanel" data-credit-tab="buy">Comprar créditos</button>
   <button type="button" class="credit-tab" id="creditHistoryTab" role="tab" aria-selected="false" aria-controls="creditHistoryPanel" data-credit-tab="history">Histórico de compras</button>
   <button type="button" class="credit-tab" id="creditUsageTab" role="tab" aria-selected="false" aria-controls="creditUsagePanel" data-credit-tab="usage">Consumo</button>
  </div>
  <div class="credit-panel" id="creditBuyPanel" role="tabpanel" aria-labelledby="creditBuyTab">
   <section class="credit-shop" aria-labelledby="creditShopTitle"><div class="credit-shop-heading"><h2 id="creditShopTitle">Mais correções, no seu ritmo</h2><p>Escolha o pacote que acompanha sua rotina.</p></div>
   <div class="credit-packages">${(data.packages||[]).filter(p=>p.code!=='teacher_test_1').map(p=>{const unit=Number(p.unit_price_cents??(p.amount_cents/Math.max(1,p.credits)))/100;return `<article class="credit-package${p.featured?' credit-featured':''}">${p.badge?`<span class="credit-badge">${esc(p.badge)}</span>`:''}<p class="credit-plan-name">${esc(p.plan||'Pacote')}</p><h3>${Number(p.credits)} <span>correções</span></h3><p class="credit-price"><span>R$</span> ${money(p.amount_cents/100)}</p><p class="credit-unit">R$ ${money(unit)} por correção</p><button class="credit-buy" data-buy-credit="${esc(p.code)}">Comprar créditos<span class="sr-only"> · ${Number(p.credits)} correções · R$ ${money(unit)} por correção</span></button></article>`}).join('')}</div>
   <p class="credit-footnote">Pagamento pelo Mercado Pago · Pix ou cartão</p>
   <p class="credit-footnote">Se a correção ou a criação da proposta falhar, o crédito é devolvido.</p></section>
  </div>
  <div class="credit-panel" id="creditHistoryPanel" role="tabpanel" aria-labelledby="creditHistoryTab" hidden>
   <section class="box credit-history" aria-labelledby="purchaseHistoryTitle"><div class="box-head"><h2 id="purchaseHistoryTitle">Histórico de compras</h2><p>Consulte data, créditos, valor e status dos pagamentos.</p></div><div class="box-body list" id="purchaseHistoryList"><div class="empty">Abra esta aba para carregar suas compras.</div></div><div class="credit-more"><button type="button" class="btn ghost" id="purchaseHistoryMore" data-credit-more="history" hidden>Ver mais</button></div></section>
  </div>
  <div class="credit-panel" id="creditUsagePanel" role="tabpanel" aria-labelledby="creditUsageTab" hidden>
   <section class="box credit-history" aria-labelledby="creditUsageTitle"><div class="box-head"><h2 id="creditUsageTitle">Consumo de créditos</h2><p>Veja o saldo inicial, compras, correções, propostas com IA e créditos devolvidos.</p></div><div class="box-body list" id="creditUsageList"><div class="empty">Abra esta aba para carregar seu consumo.</div></div><div class="credit-more"><button type="button" class="btn ghost" id="creditUsageMore" data-credit-more="usage" hidden>Ver mais</button></div></section>
  </div></div>`;

  const loadHistory=async()=>{
   const list=$('purchaseHistoryList'),more=$('purchaseHistoryMore');if(!list||!more)return;
   if(historyOffset>=MAX_RECORDS){more.hidden=true;return;}
   if(historyOffset===0)list.innerHTML='<div class="empty">Carregando compras…</div>';
   const remaining=MAX_RECORDS-historyOffset;
   const queryLimit=remaining>PAGE_SIZE?PAGE_SIZE+1:PAGE_SIZE;
   const rows=await rest(`correction_payment_orders?select=id,credits,amount_cents,status,created_at,approved_at&order=created_at.desc&limit=${queryLimit}&offset=${historyOffset}`);
   if(!navigationCurrent(navigation)||!$('purchaseHistoryList'))return;
   const page=(Array.isArray(rows)?rows:[]).slice(0,Math.min(PAGE_SIZE,remaining));
   const hasMore=historyOffset+page.length<MAX_RECORDS&&Array.isArray(rows)&&rows.length>PAGE_SIZE;
   if(historyOffset===0)list.innerHTML='';
   if(!page.length&&historyOffset===0)list.innerHTML='<div class="empty">Nenhuma compra registrada.</div>';
   else if(page.length)list.insertAdjacentHTML('beforeend',purchaseHistory(page));
   historyOffset+=page.length;
   more.hidden=!hasMore;
  };

  const loadUsage=async()=>{
   const list=$('creditUsageList'),more=$('creditUsageMore');if(!list||!more)return;
   if(usageOffset>=MAX_RECORDS){more.hidden=true;return;}
   if(usageOffset===0)list.innerHTML='<div class="empty">Carregando consumo…</div>';
   const remaining=MAX_RECORDS-usageOffset;
   const queryLimit=remaining>PAGE_SIZE?PAGE_SIZE+1:PAGE_SIZE;
   const rows=await rest(`correction_credit_ledger?select=id,event_type,delta,balance_after,external_reference,metadata,created_at&event_type=in.(freemium,purchase,reservation,refund)&order=created_at.desc&limit=${queryLimit}&offset=${usageOffset}`);
   if(!navigationCurrent(navigation)||!$('creditUsageList'))return;
   const page=(Array.isArray(rows)?rows:[]).slice(0,Math.min(PAGE_SIZE,remaining));
   const hasMore=usageOffset+page.length<MAX_RECORDS&&Array.isArray(rows)&&rows.length>PAGE_SIZE;
   if(usageOffset===0)list.innerHTML='';
   if(!page.length&&usageOffset===0)list.innerHTML='<div class="empty">Nenhum consumo registrado.</div>';
   else if(page.length)list.insertAdjacentHTML('beforeend',usageHistory(page));
   usageOffset+=page.length;
   more.hidden=!hasMore;
  };

  const showTab=async name=>{
   const tabs={buy:$('creditBuyTab'),history:$('creditHistoryTab'),usage:$('creditUsageTab')};
   const panels={buy:$('creditBuyPanel'),history:$('creditHistoryPanel'),usage:$('creditUsagePanel')};
   if(!tabs.buy||!tabs.history||!tabs.usage||!panels.buy||!panels.history||!panels.usage)return;
   Object.keys(tabs).forEach(key=>{tabs[key].setAttribute('aria-selected',String(key===name));panels[key].hidden=key!==name;});
   if(name==='history'&&!historyLoaded){
    historyLoaded=true;
    try{await loadHistory()}catch(error){historyLoaded=false;if(navigationCurrent(navigation)&&$('purchaseHistoryList'))$('purchaseHistoryList').innerHTML='<div class="empty">Não foi possível carregar o histórico agora.</div>';}
   }
   if(name==='usage'&&!usageLoaded){
    usageLoaded=true;
    try{await loadUsage()}catch(error){usageLoaded=false;if(navigationCurrent(navigation)&&$('creditUsageList'))$('creditUsageList').innerHTML='<div class="empty">Não foi possível carregar o consumo agora.</div>';}
   }
  };

  $('view').onclick=async e=>{
   const tab=e.target.closest('[data-credit-tab]');
   if(tab){await showTab(tab.dataset.creditTab);return;}
   const more=e.target.closest('[data-credit-more]');
   if(more&&!more.disabled){more.disabled=true;const old=more.textContent;more.textContent='Carregando…';try{if(more.dataset.creditMore==='history')await loadHistory();else await loadUsage();}catch(error){toast('Não foi possível carregar mais registros.')}finally{if(more.isConnected){more.disabled=false;more.textContent=old}}return;}
   const button=e.target.closest('[data-buy-credit]');if(!button||button.disabled)return;
   button.disabled=true;const old=button.textContent;button.textContent='Abrindo pagamento…';
   try{const result=await edge(API.credit,{action:'checkout',package_code:button.dataset.buyCredit});if(!/^https:\/\//.test(result.checkout_url||''))throw Error('O servidor não retornou um checkout seguro.');location.assign(result.checkout_url)}catch(error){toast(error.message||'Não foi possível abrir o pagamento.');button.disabled=false;button.textContent=old}
  };
 };
})();
