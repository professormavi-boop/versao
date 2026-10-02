const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{for(const role of ['teacher','student']){
const d=new JSDOM('<main id="view"></main>',{url:'https://test.example',runScripts:'outside-only'}),w=d.window,calls=[];let essay;
w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=()=>'';w.fmtDate=()=>'';w.navigationCurrent=()=>true;w.S={profile:{role},session:{access_token:'test'}};w.BASE='https://local';w.authHeaders=()=>({});
w.edge=async(_,b)=>{calls.push(b);if(b.action==='live_status')return{enabled:true};if(b.action==='organizations')return{organizations:[]};if(b.action==='live_history')return{essays:[]};if(b.action==='live_create'){essay={...b,id:b.essay_id};return{essay};}if(b.action==='live_theme')return{essay:{...essay,...b}};if(b.action==='live_start')return{job:{id:'failed',status:'failed',error_message:'Falha técnica'}};throw Error(b.action);};
w.request=async(_,r)=>{essay={id:r.body.get('essay_id')};calls.push({action:'upload',essay_id:essay.id});return{ok:true,json:async()=>({essay})};};
const click=async id=>w.$(id).onclick({target:w.$(id)});
w.eval(fs.readFileSync('teacher-live.e12.js','utf8'));await w.renderTeacherLive(1);
w.$('tlName').value='Nome mantido';w.$('tlSchool').value='Escola mantida';
w.$('tlPhoto').onchange({target:{files:[new w.File(['photo'],'foto.jpg',{type:'image/jpeg'})]}});await click('tlNext');
assert(w.$('tlReplace'));w.$('tlTheme').value='Tema informado de teste';w.$('tlConfirmed').checked=true;w.$('tlConfirmed').onchange({target:w.$('tlConfirmed')});await click('tlNext');w.$('tlCredit').checked=true;await click('tlStart');
assert(w.$('tlReplace'));await click('tlReplace');assert.equal(w.$('tlName').value,'Nome mantido');assert.equal(w.$('tlSchool').value,'Escola mantida');assert.equal(w.$('tlFile').files.length,0);
w.$('tlText').value='Nova redação de teste. '.repeat(10);await click('tlNext');assert.notEqual(calls.find(c=>c.action==='live_create').essay_id,calls.find(c=>c.action==='upload').essay_id);assert.equal(w.$('tlTheme').value,'Tema informado de teste');assert.equal(w.$('tlConfirmed').checked,false);
await click('tlReplace');assert.equal(w.$('tlText').value,'Nova redação de teste. '.repeat(10));d.window.close();
}console.log('PASS replacement teacher/student: failed photo to text, new immutable draft, retained labels/theme, confirmation reset, editable text');})().catch(e=>{console.error(e);process.exitCode=1});
