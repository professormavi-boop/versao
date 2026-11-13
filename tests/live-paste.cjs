const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{for(const role of ['teacher','student']){
const d=new JSDOM('<main id="view"></main>',{url:'https://test.example',runScripts:'outside-only'}),w=d.window,calls=[];let essay;
w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=()=>'';w.fmtDate=()=>'';w.navigationCurrent=()=>true;w.S={profile:{role},session:{access_token:'test'}};w.BASE='https://local';w.authHeaders=()=>({});
w.edge=async(_,b)=>{calls.push(b);if(b.action==='live_status')return{enabled:true};if(b.action==='organizations')return{organizations:[]};if(b.action==='live_history')return{essays:[]};if(b.action==='live_create'){essay={...b,id:b.essay_id};return{essay};}if(b.action==='live_theme')return{essay:{...essay,...b}};if(b.action==='live_start')return{job:{id:'failed',status:'failed',error_message:'Falha técnica'}};throw Error(b.action);};
w.request=async(_,r)=>{essay={id:r.body.get('essay_id')};calls.push({action:'upload',essay_id:essay.id});return{ok:true,json:async()=>({essay})};};
const click=async id=>w.$(id).onclick({target:w.$(id)});
w.eval(fs.readFileSync('teacher-live.e12.js','utf8'));await w.renderTeacherLive(1);

w.$('tlText').value='Texto anterior';w.$('tlName').value='Nome preservado';
Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{readText:async()=> 'Redação copiada '.repeat(12)}});
await click('tlPaste');
assert.equal(w.$('tlText').value,'Redação copiada '.repeat(12));
assert.equal(w.document.activeElement,w.$('tlText'));assert.equal(w.$('tlName').value,'Nome preservado');
const kept=w.$('tlText').value;
w.navigator.clipboard.readText=async()=>{throw Error('denied');};
await click('tlPaste');assert.equal(w.$('tlText').value,kept);assert(w.document.body.textContent.includes('toque e segure'));
w.navigator.clipboard.readText=async()=> '  ';
await click('tlPaste');assert.equal(w.$('tlText').value,kept);assert(w.document.body.textContent.includes('Nenhum texto'));
let resolve;w.navigator.clipboard.readText=()=>new Promise(r=>resolve=r);
const pending=click('tlPaste');w.$('tlText').value='Nova digitação';resolve('Texto atrasado');await pending;
assert.equal(w.$('tlText').value,'Nova digitação');assert.equal(w.$('tlPaste').disabled,false);
d.window.close();
}console.log('PASS clipboard teacher/student: success, denied, empty, focus and late response preservation');})().catch(e=>{console.error(e);process.exitCode=1});
