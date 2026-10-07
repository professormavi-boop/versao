const {JSDOM}=require('jsdom');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const tick=()=>new Promise(r=>setTimeout(r,0));
async function until(test){for(let i=0;i<120;i++){if(test())return;await tick()}throw Error('Expected UI state not reached')}
function setup(handler,{timeout=false,storage}={}){
 const dom=new JSDOM('<div id="view"><div id="slot-test"></div></div>',{url:'http://localhost',runScripts:'outside-only'}),w=dom.window,calls=[];
 let clock=Date.now();const RealDate=Date;w.Date=class extends RealDate{static now(){return clock}};
 const timer=w.setTimeout.bind(w);w.setTimeout=(fn,ms)=>timer(()=>{if(ms===2000)clock+=timeout?620001:2000;fn()},ms===15000?15:0);
 Object.assign(w,{$:id=>w.document.getElementById(id),esc:s=>String(s??''),S:{session:{user:{id:'teacher'}},profile:{role:'teacher'},cache:{correctionRows:[{submission_id:'test',job_status:'processing'}]}},navigationVersion:1,openEssay(){},PAID_AI_ENABLED:true,API:{ai:'ai',official:'official',credit:'credit'},renderCorrection(){},aiQueueStatus(){},aiNotice(){},navigationCurrent:()=>true,teacherQueue:async()=>w.S.cache.correctionRows,ensure:async()=>({access_token:'synthetic'}),authHeaders:()=>({}),BASE:'http://localhost',fetch:async()=>({ok:true,json:async()=>({channels:{test:{ai:{status:'failed'}}}})}),appConfirm:async()=>{throw Error('Recovery must not ask to pay')},navigate:async()=>{w.navigationVersion++;await w.renderCorrection({})},edge:async(api,body)=>{calls.push({api,...body});return handler(body,api)}});
 for(const f of ['correction.e12.js','correction-redesign.e12.js'])vm.runInContext(fs.readFileSync(f,'utf8'),dom.getInternalVMContext());
 w.openEssay=()=>{};
 if(storage)w.localStorage.setItem('e12-ai-pending-teacher-test','1');
 return {w,calls,close:()=>dom.window.close()};
}
const running={id:'existing',status:'processing',started_at:new Date().toISOString()},done={id:'existing',status:'completed',result:{total_score:800,competencies:{C1:{score:160}}}};
function readOnly(calls){assert.ok(calls.length);assert.ok(calls.every(c=>c.action==='get'),'Recovery only reads, no status/correct/force/reservation');assert.ok(calls.every(c=>!c.force))}
(async()=>{
 // Actual notice + button after three failed polls; double click issues one recovery GET.
 let n=0,recovered=false;let x=setup(async()=>{if(recovered)return {job:done};if(++n===1)return {job:running};throw Error('offline')});
 await x.w.aiCorrection('test',{readOnly:true});let b=x.w.document.querySelector('[data-ai-follow]');assert.ok(b);assert.match(x.w.document.body.textContent,/Não foi possível confirmar/);assert.equal(x.w.document.querySelector('[data-ai-retry]'),null);
 recovered=true;const before=x.calls.length;b.click();b.click();await until(()=>x.w.document.querySelector('[data-full]'));assert.equal(x.calls.length-before,1);readOnly(x.calls);x.close();
 // Initial GET hangs and times out; recovery remains visible and safe.
 recovered=false;x=setup(()=>recovered?Promise.resolve({job:done}):new Promise(()=>{}));await x.w.aiCorrection('test',{readOnly:true});assert.match(x.w.document.body.textContent,/consultar o andamento/);recovered=true;x.w.document.querySelector('[data-ai-follow]').click();await until(()=>x.w.document.querySelector('[data-full]'));readOnly(x.calls);x.close();
 // Watch deadline also retains a visible recovery action.
 x=setup(async()=>({job:running}),{timeout:true});await x.w.aiCorrection('test',{readOnly:true});assert.match(x.w.document.body.textContent,/demorou mais/);assert.ok(x.w.document.querySelector('[data-ai-follow]'));readOnly(x.calls);x.close();
 // Ambiguous paid POST is not repeated by recovery or stale queue state after navigation.
 let phase=0;x=setup(async body=>{if(body.action==='status')return {enabled:true,key_configured:true,account_enabled:true};if(body.action==='correct'){phase=1;throw Error('network')};if(phase===0)return {job:null};if(phase===1)throw Error('offline');return {job:done}});
 await x.w.aiCorrection('test');assert.equal(x.calls.filter(c=>c.action==='correct').length,1);assert.ok(x.w.document.querySelector('[data-ai-follow]'));
 await x.w.navigate('correction');assert.equal(x.w.document.querySelector('[data-cx-ai]').textContent,'Acompanhar IA');phase=2;x.w.document.querySelector('[data-cx-ai]').click();await until(()=>x.w.document.querySelector('[data-full]'));assert.equal(x.calls.filter(c=>c.action==='correct').length,1);assert.equal(x.w.localStorage.getItem('e12-ai-pending-teacher-test'),null);x.close();
 // Reload retains uncertainty; failed/cancelled are terminal, not transport ambiguity.
 for(const status of ['failed','cancelled']){x=setup(async()=>({job:{...running,status,error_message:'Provider failure'}}),{storage:true});await x.w.renderCorrection({});assert.equal(x.w.document.querySelector('[data-cx-ai]').textContent,'Acompanhar IA');x.w.document.querySelector('[data-cx-ai]').click();await until(()=>x.w.document.querySelector('[data-ai-retry]'));assert.equal(x.w.localStorage.getItem('e12-ai-pending-teacher-test'),null);readOnly(x.calls);x.close()}
 // Recovery cannot initiate a queued or absent job, even with persistent uncertainty.
 for(const job of [null,{...running,status:'queued'}]){x=setup(async()=>({job}),{storage:true});await x.w.aiCorrection('test',{readOnly:true});assert.ok(x.w.document.querySelector('[data-ai-follow]'));readOnly(x.calls);x.close()}
 // Recovery can keep watching a running job until completion.
 n=0;x=setup(async()=>({job:++n<3?running:done}));await x.w.aiCorrection('test',{readOnly:true});assert.ok(x.w.document.querySelector('[data-full]'));assert.equal(x.calls.length,3);readOnly(x.calls);x.close();
 // Standard new correction still starts exactly once and renders its result.
 n=0;x=setup(async body=>body.action==='status'?{enabled:true,key_configured:true,account_enabled:true}:body.action==='correct'?{job:done}:{job:++n===1?null:done});await x.w.aiCorrection('test');assert.ok(x.w.document.querySelector('[data-full]'));assert.equal(x.calls.filter(c=>c.action==='correct').length,1);x.close();
 console.log('PASS: real recovery notice/button, polling failure, read timeout, watch deadline, double click, ambiguous transport, navigation/reload, stale queue, failed/cancelled, queued/absent, normal start; no paid recovery');
})().catch(e=>{console.error(e);process.exitCode=1});
