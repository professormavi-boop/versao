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
 @media(max-width:700px){.credit-package.credit-featured{padding:23px}}
 `;
 document.head.appendChild(style);

 window.renderTeacherAccount=async function(navigation){
  const data=await edge(API.credit,{action:'packages'});if(!navigationCurrent(navigation))return;
  const balance=Number(data.balance||0),lowCredit=balance<=200;
  const money=value=>Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('view').innerHTML=header('Conta e créditos','Seu saldo, seus dados e mais tempo para ensinar.')+`<div class="credit-page">
  <section class="credit-summary" aria-label="Resumo da conta">
  <div class="credit-balance"><span>Créditos disponíveis</span><strong>${balance}</strong><p>1 crédito por correção ou proposta com IA</p></div>
  <div class="credit-person"><strong>${esc(S.profile.full_name||'Professor')}</strong><p>${esc(S.profile.email||'')}</p><span class="credit-gift">Seu início na Versão inclui ${Number(data.freemium||20)} créditos gratuitos.</span></div>
  </section>
  ${lowCredit?`<p class="credit-notice" role="status">${balance===0?'Seu saldo acabou. Escolha um pacote para continuar corrigindo.':`Você tem ${balance} créditos disponíveis. Quando precisar, adicione mais créditos abaixo.`}</p>`:''}
  <section class="credit-shop" aria-labelledby="creditShopTitle"><div class="credit-shop-heading"><h2 id="creditShopTitle">Mais correções, no seu ritmo</h2><p>Escolha o pacote que acompanha sua rotina.</p></div>
  <div class="credit-packages">${(data.packages||[]).map(p=>{const unit=Number(p.unit_price_cents??(p.amount_cents/Math.max(1,p.credits)))/100;return `<article class="credit-package${p.featured?' credit-featured':''}">${p.badge?`<span class="credit-badge">${esc(p.badge)}</span>`:''}<p class="credit-plan-name">${esc(p.plan||'Pacote')}</p><h3>${Number(p.credits)} <span>correções</span></h3><p class="credit-price"><span>R$</span> ${money(p.amount_cents/100)}</p><p class="credit-unit">R$ ${money(unit)} por correção</p><button class="credit-buy" data-buy-credit="${esc(p.code)}">Comprar créditos<span class="sr-only"> · ${Number(p.credits)} correções · R$ ${money(unit)} por correção</span></button></article>`}).join('')}</div>
  <p class="credit-footnote">Pagamento pelo Mercado Pago · Pix ou cartão</p>
  <p class="credit-footnote">Se a correção ou a criação da proposta falhar, o crédito é devolvido.</p></section></div>`;
  $('view').onclick=async e=>{const button=e.target.closest('[data-buy-credit]');if(!button||button.disabled)return;button.disabled=true;const old=button.textContent;button.textContent='Abrindo pagamento…';try{const result=await edge(API.credit,{action:'checkout',package_code:button.dataset.buyCredit});if(!/^https:\/\//.test(result.checkout_url||''))throw Error('O servidor não retornou um checkout seguro.');location.assign(result.checkout_url)}catch(error){toast(error.message||'Não foi possível abrir o pagamento.');button.disabled=false;button.textContent=old}};
 };
})();
