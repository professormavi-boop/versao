'use strict';
window.renderIndependentHome=async function(navigation){
 const data=await edge('teacher-organization-api',{action:'live_status'});if(!navigationCurrent(navigation))return;
 $('view').innerHTML=header('Sua escrita pode ir mais longe','Comece, revise e continue no seu ritmo.')+`<section class="teacher-live"><section class="tl-card"><h2>${esc(S.profile.full_name)}</h2><p>${Number(data.balance||0)} crédito(s) · 1 crédito por correção completa ou por etapa</p><div class="tl-actions"><button class="btn primary" id="wiCorrect">Corrigir minha redação</button>${data.writing_editor?'<button class="btn" id="wiBuild">Construir minha redação</button>':''}<button class="btn" id="wiHistory">Minhas devolutivas</button></div><p>Você escreve. A orientação ajuda a planejar, desenvolver e revisar.</p></section></section>`;
 $('wiCorrect').onclick=()=>navigate('student-live');$('wiHistory').onclick=()=>navigate('student-live-history');if($('wiBuild'))$('wiBuild').onclick=()=>window.renderWritingEditor(navigation);
};
window.renderIndependentAccount=async function(navigation){
 if(!navigationCurrent(navigation))return;
 $('view').innerHTML=header('Minha conta','Aluno independente')+`<section class="tl-card"><h2>${esc(S.profile.full_name)}</h2><p>${esc(S.profile.email)}</p><p>Seus rascunhos são privados. Entre com seu e-mail e senha ou com a conta Google vinculada.</p><button class="btn" id="wiCredits">Créditos e consumo</button></section>`;$('wiCredits').onclick=()=>navigate('student-credits');
};
