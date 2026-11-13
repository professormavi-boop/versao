const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{for(const role of ['teacher','student']){
const d=new JSDOM('<main id="view"></main>',{url:'https://test.example',runScripts:'outside-only'}),w=d.window,calls=[];let essay;
w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=()=>'';w.fmtDate=()=>'';w.navigationCurrent=()=>true;w.S={profile:{role},session:{access_token:'test'}};w.BASE='https://local';w.authHeaders=()=>({});
w.edge=async(_,b)=>{calls.push(b);if(b.action==='live_status')return{enabled:true};if(b.action==='organizations')return{organizations:[]};if(b.action==='live_history')return{essays:[]};if(b.action==='live_create'){essay={...b,id:b.essay_id};return{essay};}if(b.action==='live_theme')return{essay:{...essay,...b}};if(b.action==='live_start')return{job:{id:'failed',status:'failed',error_message:'Falha técnica'}};throw Error(b.action);};
w.request=async(_,r)=>{essay={id:r.body.get('essay_id')};calls.push({action:'upload',essay_id:essay.id});return{ok:true,json:async()=>({essay})};};
const click=async id=>w.$(id).onclick({target:w.$(id)});
w.eval(fs.readFileSync('teacher-live.e12.js','utf8'));await w.renderTeacherLive(1);


assert.equal(w.$('tlPaste'),null);
const text='Redação inserida pelo campo nativo. '.repeat(8);
w.$('tlText').value=text;w.$('tlText').dispatchEvent(new w.Event('input',{bubbles:true}));
w.$('tlPhoto').onchange({target:{files:[new w.File(['photo'],'foto.jpg',{type:'image/jpeg'})]}});
assert.equal(w.$('tlText'),null);assert(w.$('tlRemoveFile'));
await click('tlRemoveFile');assert.equal(w.$('tlText').value,text);assert.equal(w.document.activeElement,w.$('tlText'));
assert.equal(w.$('tlPaste'),null);
await click('tlNext');assert.equal(calls.find(c=>c.action==='live_create').input_text,text);
d.window.close();
}console.log('PASS native text teacher/student: no clipboard button, file removal retains text, text submitted');})().catch(e=>{console.error(e);process.exitCode=1});
