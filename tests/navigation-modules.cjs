const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const dom=new JSDOM('<div id="view"></div><nav id="nav"></nav><div id="identity"></div>',{url:'https://example.org',runScripts:'outside-only'}),w=dom.window;
 try{
  w.eval(fs.readFileSync('core.e12.js','utf8')+'\nsetActive=()=>{};S.profile={role:"teacher"};window.go=navigate;window.makeNav=buildNav;window.studentNav=()=>{S.profile={role:"student"};buildNav()};');
  w.renderTeacherHome=async()=>{w.document.getElementById('view').textContent='Início disponível'};
  await w.go('home');assert.equal(w.document.getElementById('view').textContent,'Início disponível');
  await w.go('correction');assert.match(w.document.getElementById('view').textContent,/não terminaram de carregar/);assert.equal(w.document.getElementById('retryRoute').textContent,'Recarregar página');assert.doesNotMatch(w.document.getElementById('view').textContent,/ReferenceError|renderCorrection/);
  await w.go('home');assert.equal(w.document.getElementById('view').textContent,'Início disponível');
  w.renderCorrection=async()=>{w.document.getElementById('view').textContent='Correções disponíveis'};
  await w.go('correction');assert.equal(w.document.getElementById('view').textContent,'Correções disponíveis');
  w.renderCorrection=async()=>{throw Error('Falha de conexão')};await w.go('correction');assert.equal(w.document.getElementById('retryRoute').textContent,'Tentar novamente');
  await w.go('constructor');assert.match(w.document.getElementById('view').textContent,/Área não disponível/);
  w.makeNav();assert.equal(w.document.querySelectorAll('.teacher-nav-group').length,3);assert.equal(w.document.querySelector('[data-route="teacher-profile"]').closest('details').querySelector('summary').textContent,'Conta');assert.equal(w.document.querySelector('[data-route="teacher-students"]').closest('details').querySelector('summary').textContent,'Escola');assert.equal(w.document.querySelector('.teacher-credit-button').textContent,'Créditos e consumo');assert.equal(w.document.querySelectorAll('[data-route="teacher-account"]').length,1);assert(w.document.querySelector('.teacher-nav-icon'));assert.equal(w.document.querySelector('.live-nav-group summary').textContent,'Ao Vivo');assert.equal(w.document.querySelector('[data-route="teacher-live-activities"]').textContent,'Atividades');
  w.renderTeacherLive=async n=>{w.document.getElementById('view').textContent=n.route};
  for(const route of ['teacher-live','teacher-live-history','teacher-live-activities']){await w.go(route);assert.equal(w.document.getElementById('view').textContent,route);assert(w.document.querySelector('.live-nav-group').open);}
  w.studentNav();assert.equal(w.document.querySelector('.teacher-credit-button').dataset.route,'student-credits');assert.equal(w.document.querySelector('[data-route="student-account"]').closest('details').querySelector('summary').textContent,'Conta');assert.equal(w.document.querySelector('[data-route="teacher-organization"]'),null);assert.equal(w.document.querySelectorAll('.teacher-nav-icon').length,8);assert.equal(w.document.querySelector('[data-route="teacher-live-activities"]'),null);assert.equal(w.document.querySelector('.live-nav-group'),null);assert.equal(w.document.querySelector('[data-route="student-live"]').textContent,'Corrigir');assert.equal(w.document.querySelector('[data-route="student-writing"]').textContent,'Escrita guiada');assert.equal(w.document.querySelector('[data-route="student-proposals"]').textContent,'Temas');w.renderWritingEditor=async n=>{w.document.getElementById('view').textContent=n.route};await w.go('student-writing');assert.equal(w.document.getElementById('view').textContent,'student-writing');
  console.log('PASS: missing correction module does not block home; friendly recovery, late module and normal retry');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
