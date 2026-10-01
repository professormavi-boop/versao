const {JSDOM}=require('jsdom'),fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync('.'+new URL(req.url,'http://test').pathname));});
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const dom=new JSDOM('<div id="view"></div>',{url:'http://localhost',runScripts:'outside-only'}),w=dom.window;
 const load=async file=>w.eval((await(await fetch('http://127.0.0.1:'+server.address().port+'/'+file)).text())+(file==='teacher-main.e12.js'?'\nwindow.renderTeacherProfile=renderTeacherProfile;':''));
 w.CSS={escape:x=>x};w.$=id=>w.document.getElementById(id);w.esc=x=>String(x??'').replace(/</g,'&lt;').replace(/"/g,'&quot;');w.header=()=>'';w.navigationCurrent=()=>true;w.toast=()=>{};w.actionAlert=()=>{};w.buildNav=()=>{};w.proposalHtml=x=>x;w.appConfirm=async()=>true;w.API={proposal:'proposal'};
 w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent},set(v){this.textContent=v}});
 try{
  w.S={route:'student-proposals',profile:{id:'student',role:'student'},cache:{}};
  let only=true;
  w.studentProposals=async()=>({proposals:[{id:'round',theme:'Tema',handwritten_only:only}]});
  w.studentSubmitJson=async()=>({states:[{round_id:'round',editable:true}]});
  await load('student-proposals-v2.e12.js');
  async function sendScreen(){await w.renderStudentProposals({});w.document.querySelector('[data-spv-open]').click();w.document.querySelector('[data-spv-send]').click();}
  await sendScreen();assert.equal(w.document.querySelector('[data-v2-paste]'),null);assert.ok(w.document.querySelector('[data-v2-camera]'));assert.match(w.document.querySelector('[data-v2-file]').textContent,/imagem/);assert.equal(w.document.querySelector('dialog'),null);
  only=false;await sendScreen();assert.ok(w.document.querySelector('[data-v2-paste]'));assert.match(w.$('view').textContent,/PDF/);
  w.S={profile:{id:'teacher',role:'teacher',full_name:'Nome antigo'},session:{user:{id:'teacher'}},cache:{}};
  await load('teacher-main.e12.js');
  let calls=0,release;
  w.edge=async(slug,body)=>{calls++;assert.equal(body.action,'update_name');assert.equal(body.full_name,'Nome Novo');await new Promise(r=>release=r);return {ok:true,profile:{id:'teacher',full_name:body.full_name}};};
  await w.renderTeacherProfile({});const form=w.$('teacherNameForm'),input=w.$('teacherDisplayName');
  input.value=' ';await form.onsubmit({preventDefault(){}});assert.equal(calls,0);
  input.value=' Nome   Novo ';const saving=form.onsubmit({preventDefault(){}});await tick();await form.onsubmit({preventDefault(){}});assert.equal(calls,1);release();await saving;assert.equal(w.S.profile.full_name,'Nome Novo');assert.match(w.$('teacherNameStatus').textContent,/sucesso/);
  w.edge=async()=>{throw Error('Falha de conexão')};input.value='Outro nome';await form.onsubmit({preventDefault(){}});assert.equal(w.S.profile.full_name,'Nome Novo');assert.match(w.$('teacherNameStatus').textContent,/Falha/);
  let record={id:'round',theme:'Tema válido',thematic_axis:'Educação',proposal_command:'Comando válido',handwritten_only:true},saved;
  w.edge=async(slug,b)=>{
   if(b.action==='bootstrap')return {organizations:[{id:'org',name:'Escola'}],classes_by_org:{org:[{id:'class',name:'Turma'}]},recent:[record]};
   if(b.action==='get')return {proposal:record,targets:[{class_id:'class'}],motivators:[{body:'Texto motivador',source_label:'Fonte'}]};
   if(b.action==='credits')return {balance:2};
   if(b.action==='save'){saved=b;record={...record,...b};return {ok:true}};
  };
  await load('teacher-proposals-v3.e12.js');await w.renderDemoProposals({});w.document.querySelector('[data-edit]').click();assert.equal(w.$('pvHandwritten').checked,true);
  w.$('pvHandwritten').checked=false;await w.$('pvDraft').onclick();assert.equal(saved.handwritten_only,false);
  w.document.querySelector('[data-edit]').click();assert.equal(w.$('pvHandwritten').checked,false);
  w.$('pvHandwritten').checked=true;await w.$('pvDraft').onclick();assert.equal(saved.handwritten_only,true);
  w.$('pvTabCreate').click();assert.equal(w.$('pvHandwritten').checked,false);
  console.log('PASS HTTP: manuscritas salvas/reabertas, padrão livre, aluno sem modal, nome normalizado, duplicidade e falha.');
 }finally{await tick();w.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
