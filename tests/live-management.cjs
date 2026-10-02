const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
for(const enabled of [false,true]){
 const d=new JSDOM('<main id="view"></main>',{url:'https://test.example',runScripts:'outside-only'}),w=d.window,calls=[];
 let essays=[{id:'essay-1',student_label:'Neto',school_label:'Marista',theme:'Desigualdade no esporte',created_at:'2026-10-01'}],activities=[{id:'activity-1',name:'Aula de redação',theme:'Desigualdade no esporte',created_at:'2026-10-01'}];
 w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=t=>'<h1>'+t+'</h1>';w.fmtDate=s=>s;w.navigationCurrent=()=>true;w.S={profile:{role:'teacher'}};
 let fail=false;
 w.edge=async(_,b)=>{calls.push(b);switch(b.action){case'live_status':return{enabled:true,management:enabled};case'organizations':return{organizations:[]};case'live_history':return{essays};case'live_activities':return{activities};case'live_manage':if(fail)throw Error('Aguarde a análise terminar.');if(b.kind==='essay'){if(b.operation==='delete')essays=[];else essays[0]={...essays[0],student_label:b.name,school_label:b.school};}else{if(b.operation==='delete')activities=[];else activities[0]={...activities[0],name:b.name};}return{ok:true};default:throw Error(b.action);}};
 const click=async id=>w.$(id).onclick({target:w.$(id)}),hit=async selector=>{const b=w.document.querySelector(selector);return b.onclick({target:b});};
 w.eval(fs.readFileSync('teacher-live.e12.js','utf8'));await w.renderTeacherLive(1);await click('tlHistory');
 assert.equal(w.document.querySelector('[data-essay]').textContent,'Abrir redação');assert.equal(w.document.querySelector('.tl-item-name').textContent,'Neto');
 if(!enabled){assert.equal(w.document.querySelector('[data-edit-essay]'),null);d.window.close();continue;}
 await hit('[data-edit-essay]');w.$('tlEditName').value='<script>Nome</script>';w.$('tlEditSchool').value='Outra escola';await click('tlManageSave');assert.equal(w.document.querySelector('script'),null);assert.equal(w.document.querySelector('.tl-item-name').textContent,'<script>Nome</script>');
 await hit('[data-delete-essay]');await click('tlManageCancel');assert.equal(essays.length,1);assert.equal(calls.filter(c=>c.operation==='delete').length,0);
 await hit('[data-delete-essay]');fail=true;await click('tlManageSave');assert.match(w.$('tlStatus').textContent,/Aguarde/);assert.equal(essays.length,1);assert.equal(w.$('tlManageSave').disabled,false);fail=false;await click('tlManageSave');assert.equal(essays.length,0);assert.match(w.document.body.textContent,/Nenhuma redação/);
 await click('tlActivities');await hit('[data-edit-activity]');w.$('tlEditName').value='Nova aula';await click('tlManageSave');assert.equal(activities[0].name,'Nova aula');assert.equal(activities[0].theme,'Desigualdade no esporte');
 await hit('[data-delete-activity]');assert.match(w.document.body.textContent,/redações continuarão/);await click('tlManageSave');assert.equal(activities.length,0);
 d.window.close();
}
console.log('PASS management UI: separate fields/actions, capability fallback, edit/reload, XSS escaped, cancel, failed deletion retains data, confirmed deletion, activity rename/theme preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
