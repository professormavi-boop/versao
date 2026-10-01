const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const dom=new JSDOM('<div id="view"></div>',{url:'https://example.org',runScripts:'outside-only'}),w=dom.window;
 try{
  w.eval(fs.readFileSync('core.e12.js','utf8')+'\nsetActive=()=>{};S.profile={role:"teacher"};window.go=navigate;');
  w.renderTeacherHome=async()=>{w.document.getElementById('view').textContent='Início disponível'};
  await w.go('home');assert.equal(w.document.getElementById('view').textContent,'Início disponível');
  await w.go('correction');assert.match(w.document.getElementById('view').textContent,/não terminaram de carregar/);assert.equal(w.document.getElementById('retryRoute').textContent,'Recarregar página');assert.doesNotMatch(w.document.getElementById('view').textContent,/ReferenceError|renderCorrection/);
  await w.go('home');assert.equal(w.document.getElementById('view').textContent,'Início disponível');
  w.renderCorrection=async()=>{w.document.getElementById('view').textContent='Correções disponíveis'};
  await w.go('correction');assert.equal(w.document.getElementById('view').textContent,'Correções disponíveis');
  w.renderCorrection=async()=>{throw Error('Falha de conexão')};await w.go('correction');assert.equal(w.document.getElementById('retryRoute').textContent,'Tentar novamente');
  await w.go('constructor');assert.match(w.document.getElementById('view').textContent,/Área não disponível/);
  console.log('PASS: missing correction module does not block home; friendly recovery, late module and normal retry');
 }finally{dom.window.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
