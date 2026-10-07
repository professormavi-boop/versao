'use strict';
const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const vm=require('node:vm');
const source=p=>fs.readFileSync(p,'utf8');
function env(role='student'){
 const dom=new JSDOM('<main id="view"></main>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window,calls=[];
 w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=t=>'<h1>'+t+'</h1>';w.fmtDate=s=>s;w.navigationCurrent=()=>true;w.S={profile:{role},cache:{},session:{user:{id:'owner'}}};w.navigate=()=>{};
 w.edge=async(_,b)=>{calls.push(b);switch(b.action){case'live_status':return{enabled:true};case'live_history':return{essays:[]};case'organizations':return{organizations:[]};case'live_create':return{essay:{id:'essay',...b}};default:throw Error(b.action);}};
 w.eval(source('writing-stages.e12.js'));w.eval(source('writing-stages-ui.e12.js'));
 return {dom,w,calls};
}
function select(w,value){const radio=w.document.querySelector('input[value="'+value+'"]');radio.checked=true;radio.dispatchEvent(new w.Event('change',{bubbles:true}));}
function sample(w){return {mode:'partial',report_format:'partial-v1',stage:'introduction',criteria:w.WritingStages.stages.introduction.criteria.map(name=>({name,status:'partial',feedback:'Explique a relação com o tema.',evidence:'<img src=x onerror=alert(1)>'})),strength:'Tema apresentado',improvement:'Explicitar a tese',next_step:'Qual posição você defenderá?',context_limitations:'Somente a introdução foi analisada.',deviations:[],total_score:1000,competencies:{C1:{score:200}}};}
(async()=>{
 for(const role of ['teacher','student']){
  const {dom,w,calls}=env(role);w.eval(source('teacher-live.e12.js'));await w.renderTeacherLive(1);
  assert.equal(w.document.querySelector('input[type=radio]:checked').value,'complete');
  const draft='Texto do aluno. '.repeat(12);w.$('tlText').value=draft;
  for(const stage of Object.keys(w.WritingStages.stages)){
   select(w,stage);assert.equal(w.$('tlText').value,draft);
   const before=calls.length;await w.$('tlNext').onclick({target:w.$('tlNext')});assert.equal(calls.length,before);assert.match(w.$('tlStatus').textContent,/nenhum crédito/);
  }
  select(w,'complete');await w.$('tlNext').onclick({target:w.$('tlNext')});assert.equal(calls.filter(c=>c.action==='live_create').length,1);assert(w.$('tlTheme'));
  dom.window.close();
 }
 {
  const {dom,w,calls}=env('teacher');w.document.getElementById('view').innerHTML='<div id="slot-one"><div class="box"></div></div>';
  vm.runInContext(source('correction.e12.js'),dom.getInternalVMContext());vm.runInContext(source('correction-redesign.e12.js'),dom.getInternalVMContext());
  await w.aiCorrection('one',{stage:'introduction'});assert.equal(calls.length,0);assert.match(w.$('slot-one').textContent,/preparação/);
  w.$('slot-one').innerHTML='<div class="box"></div>';w.renderAiResult('one',{status:'completed',result:sample(w)},null,null,{});
  assert.match(w.$('slot-one').textContent,/Introdução/);assert(!w.$('slot-one').textContent.includes('/ 1000'));assert(!w.$('slot-one').querySelector('[data-approve-ai]'));assert.equal(w.$('slot-one').querySelector('img'),null);
  const html=w.WritingStagesUI.feedbackHtml({...sample(w),criteria:[]});assert.match(html,/incompleto/);
  assert.match(w.WritingStagesUI.feedbackHtml({...sample(w),stage:'unknown'}),/incompatível/);
  dom.window.close();
 }
 {
  const {dom,w,calls}=env('teacher');vm.runInContext(source('correction.e12.js'),dom.getInternalVMContext());
  w.teacherQueue=async()=>[{submission_id:'one',student_name:'Aluno',theme:'Tema'}];w.ensure=async()=>({access_token:'dummy'});w.authHeaders=()=>({});w.BASE='https://test.invalid';w.API={credit:'credit'};w.fetch=async()=>({ok:true,json:async()=>({channels:{}})});
  vm.runInContext(source('correction-redesign.e12.js'),dom.getInternalVMContext());await w.renderCorrection(1);
  w.document.querySelector('[data-cx-stage]').click();select(w,'conclusion');await w.$('cxStageContinue').onclick({target:w.$('cxStageContinue')});assert.equal(calls.length,0);assert.match(w.$('cxStageStatus').textContent,/nenhum crédito/);
  assert.equal(w.document.querySelector('select'),null);dom.window.close();
 }
 console.log('PASS etapas UI: dois perfis, texto preservado, zero chamadas parciais, fluxo completo, fila, XSS, resultado sem nota e contrato incompleto.');
})().catch(e=>{console.error(e);process.exitCode=1});
