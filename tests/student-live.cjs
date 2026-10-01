const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const dom=new JSDOM('<main id="view"></main>',{url:'https://app.example.test',runScripts:'outside-only'}),w=dom.window,calls=[];
 const id='00000000-0000-4000-8000-000000000001',result={competencies:Object.fromEntries(['C1','C2','C3','C4','C5'].map(c=>[c,{score:160,diagnostic:'Diagnóstico'}])),transcription:'Texto',main_strength:'Argumentação',next_step:'Revisar',total_score:800};
 let job={id,status:'completed',purpose:'correction',result,theme:'Tema de teste',theme_origin:'provided'};
 w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=t=>'<h1>'+t+'</h1>';w.fmtDate=s=>s;w.navigationCurrent=()=>true;w.S={profile:{role:'student'}};
 w.edge=async(_,body)=>{calls.push(body);switch(body.action){case'live_status':return{enabled:true,balance:1};case'live_create':return{essay:{id,...body}};case'live_theme':return{essay:{id,...body}};case'live_start':return{job};case'live_review':job={...job,review:result};return{job};case'live_share':return{id,token:'ab'.repeat(32),expires_at:'2026-10-08'};case'live_revoke':return{ok:true};default:throw Error(body.action);}};
 w.eval(fs.readFileSync('teacher-live.e12.js','utf8'));await w.renderStudentLive(1);assert.equal(w.$('tlActivityEnabled'),null);assert.equal(w.$('tlActivities'),null);w.$('tlText').value='Uma redação suficientemente longa para testar o fluxo. '.repeat(3);await w.$('tlNext').onclick({target:w.$('tlNext')});
 w.$('tlTheme').value='Desafios da educação no Brasil';await w.$('tlNext').onclick({target:w.$('tlNext')});assert.match(w.$('tlStatus').textContent,/confirme/);assert.equal(calls.filter(c=>c.action==='live_theme').length,0);
 w.$('tlConfirmed').checked=true;w.$('tlConfirmed').onchange({target:w.$('tlConfirmed')});await w.$('tlNext').onclick({target:w.$('tlNext')});
 await w.$('tlStart').onclick({target:w.$('tlStart')});assert.equal(calls.filter(c=>c.action==='live_start').length,0);
 w.$('tlCredit').checked=true;await w.$('tlStart').onclick({target:w.$('tlStart')});assert.equal(w.$('tlSave'),null);assert.equal(w.$('tlC1'),null);assert.match(w.$('view').textContent,/sem revisão de professor/);assert(w.$('tlShare'));await w.$('tlShare').onclick({target:w.$('tlShare')});assert.match(w.$('tlLink').value,/devolutiva.html#ab/);await w.$('tlRevoke').onclick({target:w.$('tlRevoke')});assert.match(w.$('tlSharePanel').textContent,/revogado/);
 dom.window.close();console.log('PASS student live UI: explicit credit, no editable grades, IA attribution, immediate share and revoke');
})().catch(e=>{console.error(e);process.exitCode=1});
