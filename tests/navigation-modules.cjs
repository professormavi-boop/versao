const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const dom=new JSDOM('<div id="view"></div><nav id="nav"></nav><div id="identity"></div>',{url:'https://example.org',runScripts:'outside-only'}),w=dom.window;
 try{
  w.eval(fs.readFileSync('core.e12.js','utf8')+'\nsetActive=()=>{};S.profile={role:"teacher"};window.S=S;window.setEdge=fn=>edge=fn;window.go=navigate;window.navigationCurrent=navigationCurrent;window.header=header;window.$=$;window.esc=esc;window.navigate=navigate;window.makeNav=buildNav;window.studentNav=()=>{S.profile={role:"student"};buildNav()};');
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
  // Exercise the actual email-student route, not only the shared renderer.
  w.S.profile={role:"student",organization_id:null,full_name:"Estudante",email:"student@example.test"};w.edge=async()=>({balance:1,independent:true});
  w.eval(fs.readFileSync('student-home-v2.e12.js','utf8'));
  w.eval(fs.readFileSync('writing-independent.e12.js','utf8'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  w.makeNav();
  assert.deepEqual(Array.from(w.document.querySelectorAll('#nav [data-route]'),b=>b.textContent),['Início','Escrita guiada','Corrigir','Redações','Dados','Créditos e consumo']);
  assert.equal(w.document.querySelectorAll('.teacher-nav-icon').length,6);
  await w.go('student-home');
  assert.equal(w.document.querySelector('.student-home-v2').firstElementChild.querySelector('h2').textContent,'Transforme suas ideias em argumentos.');
  assert.equal(w.document.querySelectorAll('.sh-method li').length,5);
  assert.doesNotMatch(w.document.getElementById('view').textContent,/por etapa/);
  w.document.querySelector('[data-sh-route="student-writing"]').click();
  assert.equal(w.document.getElementById('view').textContent,'student-writing');
  await w.go('student-account');
  assert.match(w.document.getElementById('view').textContent,/Seus dados de acesso/);
  assert.doesNotMatch(w.document.getElementById('view').textContent,/Aluno independente/);
  w.edge=async()=>{throw Error("offline")};w.studentDashboard=async()=>{throw Error("Institutional API must not run")};
  await w.go('student-home');
  assert(w.document.querySelector('.sh-guided'));
  assert.doesNotMatch(w.document.getElementById('view').textContent,/Saldo: 0|Institutional API/);
  console.log('PASS: missing correction module does not block home; friendly recovery, late module and normal retry');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
