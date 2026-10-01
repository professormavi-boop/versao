'use strict';
window.renderStudentCredits=async function(navigation){
 if(S.profile.role!=='student')throw Error('Esta área é do aluno.');
 const data=await edge(API.credit,{action:'packages'});if(!navigationCurrent(navigation))return;
 $('view').innerHTML=header('Meus créditos','Uma nova oportunidade de melhorar sua redação.')+`<section class="teacher-live"><div class="tl-card"><h2>${Number(data.balance||0)} crédito(s)</h2><p>1 crédito por correção no Ao Vivo. Suas atividades da turma continuam no fluxo do professor.</p><p>A degustação é concedida uma única vez por conta. Consultar e compartilhar uma correção salva não consome crédito.</p>${data.packages?.length?data.packages.map(p=>`<article class="tl-card"><h3>${Number(p.credits)} correção</h3><p>${esc((Number(p.amount_cents)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}))}</p><button class="btn primary" data-student-buy="${esc(p.code)}">Comprar crédito</button></article>`).join(''):'<p>A compra de créditos ainda não está disponível.</p>'}<p id="studentCreditStatus" role="status"></p><button class="btn" id="studentCreditRefresh">Atualizar saldo</button><button class="btn" id="studentCreditLive">Ir para Ao Vivo</button></div></section>`;
 let buying=false;
 document.querySelectorAll('[data-student-buy]').forEach(button=>button.onclick=async()=>{
  if(buying)return;buying=true;button.disabled=true;$('studentCreditStatus').textContent='Abrindo pagamento…';
  try{
   const response=await edge(API.credit,{action:'checkout',package_code:button.dataset.studentBuy});if(!navigationCurrent(navigation))return;
   const url=new URL(response.checkout_url);
   if(url.protocol!=='https:'||!['www.mercadopago.com.br','www.mercadopago.com','sandbox.mercadopago.com.br','sandbox.mercadopago.com'].includes(url.hostname))throw Error('Endereço de pagamento inválido.');
   location.assign(url.href);
  }catch(error){if(navigationCurrent(navigation))$('studentCreditStatus').textContent=error.message||'Não foi possível iniciar o pagamento.';buying=false;button.disabled=false;}
 });
 $('studentCreditRefresh').onclick=()=>navigate('student-credits');$('studentCreditLive').onclick=()=>navigate('student-live');
};
