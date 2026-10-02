const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const d=new JSDOM('<main id="view"></main>',{url:'https://app.example.test',runScripts:'outside-only'}),w=d.window,calls=[],essays=new Map(),activities=new Map();
 const result={competencies:Object.fromEntries(['C1','C2','C3','C4','C5'].map(c=>[c,{score:160,diagnostic:'Diagnóstico'}])),transcription:'Texto',main_strength:'Argumentação',next_step:'Revisar',total_score:800};let job;
 w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=t=>'<h1>'+t+'</h1>';w.fmtDate=s=>s||'';w.navigationCurrent=()=>true;w.S={profile:{role:'teacher'}};
 w.edge=async(_,b)=>{calls.push(b);switch(b.action){
 case'live_status':return{enabled:true};case'organizations':return{organizations:[]};case'live_history':return{essays:[...essays.values()].filter(e=>!b.activity_id||e.activity_id===b.activity_id)};
 case'live_create':{const e={id:b.essay_id,...b};essays.set(e.id,e);return{essay:e};}
 case'live_activity':{let a=activities.get(b.activity_id);if(!a){a={id:b.activity_id,name:b.name,theme:b.theme,theme_origin:b.theme_origin};activities.set(a.id,a);}const e={...essays.get(b.essay_id),activity_id:a.id,theme:a.theme,theme_origin:a.theme_origin,theme_confirmed_at:'now'};essays.set(e.id,e);return{essay:e,activity:a};}
 case'live_activities':return{activities:[...activities.values()]};case'live_start':job={id:b.request_id,purpose:'correction',status:'completed',result,theme:'Tema de teste'};return{job};case'live_review':job={...job,review:result};return{job};default:throw Error(b.action);}};
 const click=async id=>w.$(id).onclick({target:w.$(id)});
 w.eval(fs.readFileSync('teacher-live.e12.js','utf8'));await w.renderTeacherLive(1);
 w.$('tlActivityEnabled').checked=true;w.$('tlActivityEnabled').onchange({target:w.$('tlActivityEnabled')});
 w.$('tlActivityName').value='Redação da aula';w.$('tlName').value='Aluno anterior';w.$('tlSchool').value='Escola anterior';w.$('tlText').value='Redação de teste para assegurar que o conteúdo anterior seja limpo. '.repeat(3);
 await click('tlNext');w.$('tlTheme').value='Desafios da educação brasileira';w.$('tlConfirmed').checked=true;w.$('tlConfirmed').onchange({target:w.$('tlConfirmed')});await click('tlNext');
 const firstId=calls.find(c=>c.action==='live_create').essay_id;assert.equal(activities.size,1);assert.equal(w.$('tlCredit').checked,false);w.$('tlCredit').checked=true;await click('tlStart');assert.equal(w.$('tlNextEssay'),null);
 w.$('tlReview').checked=true;await click('tlSave');
 assert.equal(w.$('tlSave'),null);assert.match(w.document.body.textContent,/Revisão salva/);
 const reviewCalls=calls.filter(c=>c.action==='live_review').length;
 await click('tlEditReview');assert.equal(w.$('tlSave').disabled,true);w.$('tlReview').checked=true;w.$('tlReview').onchange();assert.equal(w.$('tlSave').disabled,true);await click('tlSave');assert.equal(calls.filter(c=>c.action==='live_review').length,reviewCalls);
 w.$('tlFeedback').value='Alteração nova';w.$('tlFeedback').oninput();assert.equal(w.$('tlReview').checked,false);w.$('tlReview').checked=true;w.$('tlReview').onchange();assert.equal(w.$('tlSave').disabled,false);
 await click('tlCancelReview');assert.equal(w.$('tlSave'),null);await click('tlNextEssay');
 assert.equal(w.$('tlName').value,'');assert.equal(w.$('tlSchool').value,'');assert.equal(w.$('tlText').value,'');assert.equal(w.$('tlFile').files.length,0);assert.match(w.document.body.textContent,/Redação da aula/);
 w.$('tlText').value='Outra redação totalmente nova. '.repeat(5);await click('tlNext');assert.equal(w.$('tlTheme').value,'Desafios da educação brasileira');assert.equal(w.$('tlTheme').readOnly,true);assert.equal(w.$('tlConfirmed').checked,true);
 await click('tlNext');assert.equal(w.$('tlCredit').checked,false);assert.equal(activities.size,1);const creates=calls.filter(c=>c.action==='live_create');assert.notEqual(creates[1].essay_id,firstId);assert.equal(creates[1].student_label,'');assert.equal(calls.filter(c=>c.action==='live_start'&&c.purpose==='theme').length,0);
 await click('tlActivities');const group=w.document.querySelector('[data-activity]');await group.onclick();assert.equal(w.document.querySelectorAll('[data-essay]').length,2);assert(w.$('tlGroupNext'));assert(calls.some(c=>c.action==='live_history'&&c.activity_id));
 d.window.close();console.log('PASS activities UI: optional group, theme reuse, clean identity/content/file, unique draft, review before next, fresh credit confirmation, grouped history');
})().catch(e=>{console.error(e);process.exitCode=1});
