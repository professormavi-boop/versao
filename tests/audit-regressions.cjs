const {JSDOM}=require('jsdom');
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const dom=new JSDOM('<div id="view"></div><div id="slot-test"><div class="box"></div></div>',{url:'http://localhost',runScripts:'outside-only'});
const w=dom.window;Object.assign(w,{$:id=>w.document.getElementById(id),esc:s=>String(s??''),reportPortuguese:s=>s,S:{cache:{correctionRows:[]},session:{user:{id:'tester'}}},renderCorrection(){},aiQueueStatus(){},aiNotice(){}});
for(const file of ['correction.e12.js','correction-redesign.e12.js','student.e12.js'])vm.runInContext(fs.readFileSync(file,'utf8'),dom.getInternalVMContext());
const job={id:'ai',status:'approved',result:{total_score:840,report_format:'essential-v1',main_strength:'OLD AI CONTENT',c1_deviations:[{original:'OLD DEVIATION'}]}};
const official={total_score:880,competencies:{C1:160,C2:200,C3:160,C4:160,C5:200},feedback:'Revisar',detailed_analysis:{report_format:'essential-v1',main_strength:'OFFICIAL CONTENT',c5_check:{action:'presente'},c1_deviations:[]}};
w.renderAiResult('test',job,official,null,{});
const box=w.document.querySelector('.box');assert.match(box.textContent,/880 \/ 1000/);assert.doesNotMatch(box.textContent,/840/);
box.querySelector('[data-full]').click();assert.match(box.textContent,/880 \/ 1000/);assert.match(box.textContent,/OFFICIAL CONTENT/);assert.doesNotMatch(box.textContent,/OLD AI CONTENT|OLD DEVIATION/);assert.match(box.textContent,/Ação: presente/);
delete official.detailed_analysis.c1_deviations;w.renderAiResult('test',job,official,null,{});assert.match(box.textContent,/Desvios não disponíveis/);assert.doesNotMatch(box.textContent,/Nenhum desvio confirmado/);
assert.match(w.studentEssentialReport(official),/Desvios não disponíveis/);official.detailed_analysis.c1_deviations=[];assert.match(w.studentEssentialReport(official),/Nenhum desvio confirmado/);
(async()=>{
 Object.assign(w,{navigationCurrent:()=>true,header:()=>'',actionAlert:()=>{},toast:()=>{},API:{proposal:'proposal'},edge:async(api,p)=>p.action==='bootstrap'?{organizations:[],classes_by_org:{},recent:[{id:'p',theme:'Test',status:'planned'}]}:Promise.reject(Error('offline'))});
 vm.runInContext(fs.readFileSync('teacher-proposals-v3.e12.js','utf8'),dom.getInternalVMContext());
 await w.renderDemoProposals({});assert.equal(w.document.querySelector('[data-edit]'),null);assert.ok(w.document.querySelector('[data-retry]'));assert.match(w.document.getElementById('view').textContent,/Não foi possível carregar os detalhes/);

 const calls=[];let failSave=true;
 Object.defineProperty(w.HTMLElement.prototype,'innerText',{configurable:true,get(){return this.textContent},set(v){this.textContent=v}});
 Object.assign(w,{CSS:{escape:x=>x},proposalHtml:x=>x,appConfirm:async()=>true});w.HTMLElement.prototype.scrollIntoView=function(){};
 w.edge=async(api,p)=>{
  if(p.action==='bootstrap')return {organizations:[{id:'o1',name:'A'},{id:'o2',name:'B'}],classes_by_org:{o1:[{id:'c1',name:'A'}],o2:[{id:'c2',name:'B'}]},recent:[{id:'p',theme:'Tema',status:'planned'}]};
  if(p.action==='get')return {proposal:{id:'p',theme:'Tema',thematic_axis:'Educação',proposal_command:'Comando',project:{organization_id:'o1'}},motivators:[{id:'m1',body:'Texto',source_label:'Fonte'}],targets:[{class_id:'c1'},{class_id:'c2'}]};
  if(p.action==='save'){calls.push(p);if(failSave)throw Error('network');return {ok:true};}
  return {balance:10};
 };
 await w.renderDemoProposals({});w.document.querySelector('[data-edit]').click();
 await w.document.getElementById('pvDraft').onclick();
 assert.equal(calls.length,1);assert.deepEqual(Array.from(calls[0].class_ids),['c1','c2']);assert.ok(calls[0].request_id);
 failSave=false;await w.document.getElementById('pvDraft').onclick();assert.equal(calls.length,2);assert.equal(calls[0].request_id,calls[1].request_id,'retry reuses transaction identifier');
 console.log('PASS: official grade summary/detail, no stale AI feedback, C5, absent vs empty deviations, failed proposal load blocks edit, all recipients in one save, retry idempotency');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close()});
