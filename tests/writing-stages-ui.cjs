'use strict';
const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const vm=require('node:vm');
const source=p=>fs.readFileSync(p,'utf8');
function env(role='student',partialEnabled=false){
 const dom=new JSDOM('<main id="view"></main>',{url:'https://test.invalid',runScripts:'outside-only'}),w=dom.window,calls=[];
 w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=t=>'<h1>'+t+'</h1>';w.fmtDate=s=>s;w.navigationCurrent=()=>true;w.S={profile:{role},cache:{},session:{user:{id:'owner'}}};w.navigate=()=>{};
 w.edge=async(_,b)=>{calls.push(b);switch(b.action){case'live_status':return{enabled:true,partial_correction:partialEnabled,partial_input:'text-or-file'};case'live_history':return{essays:[]};case'organizations':return{organizations:[]};case'live_create':return{essay:{id:'essay',...b}};case'live_theme':return{essay:{id:'essay',...b}};case'live_start':return{job:{id:'job',status:'completed',result:sample(w)}};case'live_review':return{job:{id:'job',status:'completed',result:sample(w),review:b.partial_review}};case'live_share':return{token:'a'.repeat(64),expires_at:'synthetic'};case'live_revoke':return{ok:true};case'live_transcribe':return{text:'Trecho transcrito sintético. '.repeat(8),note:'Confira a leitura.'};case'live_confirm_text':return{essay:{id:'essay',input_text:b.input_text,correction_scope:'introduction'}};default:throw Error(b.action);}};
 w.eval(source('custom-selects.e12.js'));w.eval(source('writing-stages.e12.js'));w.eval(source('writing-stages-ui.e12.js'));
 return {dom,w,calls};
}
function select(w,value){
 const select=w.document.querySelector('[id^="writing-scope-"]');
 select.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));
 const label=select.querySelector('option[value="'+value+'"]').textContent;
 const option=[...w.document.querySelectorAll('.versao-select-option')].find(o=>o.textContent===label);assert(option);option.click();
}
function sample(w){return {mode:'partial',report_format:'partial-v1',stage:'introduction',criteria:w.WritingStages.stages.introduction.criteria.map(name=>({name,status:'partial',feedback:'Explique a relação com o tema.',evidence:'<img src=x onerror=alert(1)>'})),strength:'Tema apresentado',improvement:'Explicitar a tese',next_step:'Qual posição você defenderá?',context_limitations:'Somente a introdução foi analisada.',deviations:[],total_score:1000,competencies:{C1:{score:200}}};}
(async()=>{
 for(const enabled of [false,true]){
  const {dom,w,calls}=env('student',enabled);w.eval(source('teacher-live.e12.js'));await w.renderTeacherLive(1,{stage:'introduction',text:'Redação autoral completa. '.repeat(12),theme:'Tema',context:{development1:'Contexto'}});
  assert.equal(w.document.querySelector('[id^="writing-scope-"]'),null);assert.equal(w.$('tlTextLabel').textContent,'Redação completa');await w.$('tlNext').onclick({target:w.$('tlNext')});assert.equal(calls.find(c=>c.action==='live_create').correction_scope,'complete');dom.window.close();
 }
 for(const completed of [false,true]){
  const {dom,w,calls}=env('student',true);const original=w.edge;
  w.edge=async(name,b)=>{if(b.action==='live_history')return{essays:[{id:'old',correction_scope:'introduction',student_label:'Aluno',theme:'Tema'}]};if(b.action==='live_get')return{essay:{id:'old',correction_scope:'introduction',input_text:'Trecho anterior',student_label:'Aluno',theme:'Tema'},jobs:completed?[{id:'job',purpose:'correction',status:'completed',result:sample(w)}]:[]};return original(name,b)};
  w.eval(source('teacher-live.e12.js'));await w.renderTeacherLive({route:'student-live-history'});await w.document.querySelector('[data-essay]').onclick({target:w.document.querySelector('[data-essay]')});
  assert.equal(w.$('tlPartialRedo'),null);assert.equal(calls.filter(c=>['live_start','live_transcribe'].includes(c.action)).length,0);if(completed){assert.match(w.$('view').textContent,/Somente a introdução/);assert(w.$('tlShare'));}else{assert(w.$('tlCompleteNew'));assert.match(w.$('view').textContent,/apenas para o professor/);}dom.window.close();
 }
 for(const role of ['teacher']){
  const {dom,w,calls}=env(role);w.eval(source('teacher-live.e12.js'));await w.renderTeacherLive(1);
  assert.equal(w.document.querySelector('[id^="writing-scope-"]').value,'complete');
  assert.equal(w.$('tlTextLabel').textContent,'Redação completa');
  const draft='Texto do aluno. '.repeat(12);w.$('tlText').value=draft;
  for(const stage of Object.keys(w.WritingStages.stages)){
   select(w,stage);assert.equal(w.$('tlTextLabel').textContent,w.WritingStages.stages[stage].label);assert.match(w.$('tlInputHint').textContent,/apenas o trecho/);assert.equal(w.$('tlText').value,draft);assert.match(w.document.querySelector('[data-stage-description]').textContent,/1 crédito/);
   const before=calls.length;await w.$('tlNext').onclick({target:w.$('tlNext')});assert.equal(calls.length,before);assert.match(w.$('tlStatus').textContent,/nenhum crédito/);
  }
  select(w,'complete');assert.equal(w.$('tlTextLabel').textContent,'Redação completa');assert.match(w.$('tlInputHint').textContent,/redação completa/);await w.$('tlNext').onclick({target:w.$('tlNext')});assert.equal(calls.filter(c=>c.action==='live_create').length,1);assert(w.$('tlTheme'));
  dom.window.close();
 }
 for(const role of ['teacher']){
  const {dom,w,calls}=env(role,true);w.eval(source('teacher-live.e12.js'));await w.renderTeacherLive(1);
  select(w,'introduction');w.$('tlText').value='Texto para análise parcial. '.repeat(5);
  assert(!w.$('tlCamera').disabled);await w.$('tlNext').onclick({target:w.$('tlNext')});
  assert.equal(calls.find(c=>c.action==='live_create').correction_scope,'introduction');assert(!w.$('tlInfer').hidden);
  w.$('tlTheme').value='Tema sintético para avaliação';w.$('tlConfirmed').checked=true;w.$('tlConfirmed').onchange({target:w.$('tlConfirmed')});await w.$('tlNext').onclick({target:w.$('tlNext')});
  await w.$('tlStart').onclick({target:w.$('tlStart')});assert(!calls.some(c=>c.action==='live_start'));
  w.$('tlCredit').checked=true;await w.$('tlStart').onclick({target:w.$('tlStart')});
  assert(!w.document.querySelector('.tl-total-score'));assert(!w.$('view').textContent.includes('/ 1000'));
  if(role==='teacher'){
   assert(!w.$('tlShare'));await w.$('tlPartialSave').onclick({target:w.$('tlPartialSave')});assert(!calls.some(c=>c.action==='live_review'));
   w.document.querySelector('[data-partial-field="next_step"]').value='Revise sua tese.';w.$('tlPartialConfirmed').checked=true;
   await w.$('tlPartialSave').onclick({target:w.$('tlPartialSave')});assert.equal(calls.find(c=>c.action==='live_review').partial_review.next_step,'Revise sua tese.');
   assert(!('total_score' in calls.find(c=>c.action==='live_review').partial_review));
  }else assert(!w.$('tlPartialSave'));
  await w.$('tlShare').onclick({target:w.$('tlShare')});assert(w.$('tlLink').value.endsWith('a'.repeat(64)));
  await w.$('tlRevoke').onclick({target:w.$('tlRevoke')});assert.match(w.$('tlSharePanel').textContent,/revogado/);
  dom.window.close();
 }
 {
  const {dom,w,calls}=env('teacher',true);w.BASE='https://test.invalid';w.authHeaders=()=>({});w.request=async(url,options)=>{calls.push({action:'upload',scope:options.body.get('correction_scope')});return{ok:true,json:async()=>({essay:{id:'essay',correction_scope:'introduction',input_text:null}})}};
  w.eval(source('teacher-live.e12.js'));await w.renderTeacherLive(1);select(w,'introduction');
  w.$('tlPhoto').onchange({target:{files:[new w.File(['image'],'photo.png',{type:'image/png'})]}});
  await w.$('tlNext').onclick({target:w.$('tlNext')});assert(w.$('tlTranscribedText'));assert.equal(calls.find(c=>c.action==='upload').scope,'introduction');
  await w.$('tlConfirmText').onclick({target:w.$('tlConfirmText')});assert(!calls.some(c=>c.action==='live_confirm_text'));
  w.$('tlTranscriptionConfirmed').checked=true;await w.$('tlConfirmText').onclick({target:w.$('tlConfirmText')});assert(w.$('tlTheme'));assert(!calls.some(c=>c.action==='live_start'));dom.window.close();
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
  assert.equal(w.document.querySelector('select').value,'conclusion');assert.equal(w.__VERSAO_UI_RULES__.nativeSelectPicker,false);dom.window.close();
 }
 console.log('PASS etapas UI: dois perfis, texto preservado, zero chamadas parciais, fluxo completo, fila, XSS, resultado sem nota e contrato incompleto.');
})().catch(e=>{console.error(e);process.exitCode=1});
