'use strict';
window.renderIndependentHome=async function(navigation){
 return window.renderStudentHome(navigation);
};
window.renderIndependentAccount=async function(navigation){
 if(!navigationCurrent(navigation))return;
 $('view').innerHTML=header('Conta','Seus dados de acesso.')+`<section class="teacher-live"><section class="tl-card"><h2>${esc(S.profile.full_name)}</h2><p>${esc(S.profile.email)}</p><p>Seus rascunhos são privados. Entre com seu e-mail e senha ou com a conta Google vinculada.</p><button class="btn" id="wiCredits">Créditos e consumo</button></section></section>`;$('wiCredits').onclick=()=>navigate('student-credits');
};
