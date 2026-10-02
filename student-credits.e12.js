'use strict';
window.renderStudentCredits=async function(navigation){
 if(S.profile.role!=='student')throw Error('Esta área é do aluno.');
 const data=await edge(API.credit,{action:'packages'});if(!navigationCurrent(navigation))return;
 const money=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 $('view').innerHTML=header('Meus créditos','Mais prática. Mais clareza sobre o que melhorar.')+`<section class="teacher-live student-credit-page"><section class="tl-home student-live-offer"><span class="student-live-eyebrow">Continue evoluindo com o Ao Vivo</span><h2>Uma nova redação. Um próximo passo mais claro.</h2><p>Receba uma nota estimada nas 5 competências do ENEM e orientações para revisar seu texto. Pratique no seu ritmo, com suas devolutivas sempre à mão.</p><div class="student-credit-balance"><span>Seu saldo</span><strong>${Number(data.balance||0)} crédito(s)</strong><span>1 crédito por correção</span></div><div class="student-live-offer-actions"><button class="btn primary" id="studentCreditLive">Corrigir minha redação</button><button class="btn ghost" id="studentCreditRefresh">Atualizar saldo</button></div></section><section class="tl-card"><h2>Escolha seu próximo passo</h2><p>Use seus créditos para corrigir novas redações ou analisar uma nova versão depois de revisar.</p><div class="student-credit-packages">${data.packages?.length?data.packages.map(p=>`<article class="student-credit-package"><h3>${Number(p.credits)} correções no Ao Vivo</h3><strong>${esc(money(Number(p.amount_cents)/100))}</strong><p>${esc(money(Number(p.amount_cents)/100/Number(p.credits)))} por correção</p><ul><li>Nota estimada por competência</li><li>Orientações para sua próxima revisão</li><li>Histórico e compartilhamento da devolutiva</li></ul><button class="btn primary" data-student-buy="${esc(p.code)}">Comprar ${Number(p.credits)} créditos</button></article>`).join(''):'<p>A compra de créditos ainda não está disponível.</p>'}</div><p id="studentCreditStatus" role="status"></p><p class="tl-muted">Consultar e compartilhar correções salvas não consome créditos. Se uma análise falhar, o crédito é devolvido.</p><small>Análise por IA, sem revisão de professor. A nota é uma estimativa; as atividades da turma continuam no fluxo do professor.</small></section></section>`;
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
