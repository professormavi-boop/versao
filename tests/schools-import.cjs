const assert=require('assert/strict'),fs=require('fs'),http=require('http'),path=require('path'),{JSDOM,VirtualConsole}=require('jsdom');
const server=http.createServer((req,res)=>{
 if(req.url==='/fixture'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<div id="view"></div><script src="/teacher-organization.e12.js"></script><script src="/teacher-import.e12.js"></script>');}
 const file=path.join(process.cwd(),req.url);res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(fs.readFileSync(file));
});
let base;
async function fixture({empty=false,candidates=[],failImport=false}={}){
 const calls=[],errors=[],nav=[];
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=await JSDOM.fromURL(base+'/fixture',{resources:'usable',runScripts:'dangerously',virtualConsole:vc});
 await new Promise(r=>dom.window.addEventListener('load',r));const w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.S={profile:{role:'teacher'},session:{user:{id:'teacher'}},route:'teacher-import',cache:{}};
 w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=(a,b)=>`<h1>${a}</h1><p>${b}</p>`;w.navigationCurrent=()=>true;w.navigate=route=>nav.push(route);
 w.edge=async(slug,b)=>{
  calls.push({slug,...JSON.parse(JSON.stringify(b))});
  if(slug==='student-pin-api')return{code:'CLASSCODE',students:[]};
  switch(b.action){
   case'organizations':return{organizations:empty?[]:[{id:'school',name:'Escola Teste',is_active:true},{id:'second',name:'Outra Escola',is_active:true}]};
   case'base':return{classes:empty?[]:[{id:'class',name:'3º A',year:2026,student_count:0,is_active:true}]};
   case'students':return{students:[]};
   case'create_organization':return{organization_id:'created-school'};
   case'create_class':return{class_id:'created-class'};
   case'review':return{candidates};
   case'import':if(failImport){failImport=false;throw Error('Falha temporária');}return{processed:b.rows.filter(x=>x.choice!=='skip').length};
   default:throw Error(b.action);
  }
 };
 return {w,calls,nav,errors,close(){assert.deepEqual(errors,[]);dom.window.close();}};
}
const tick=()=>new Promise(r=>setImmediate(r));
async function destination(f){await f.w.renderTeacherImport(1);await f.w.document.querySelector('[data-import-school="school"]').onclick();f.w.document.querySelector('[data-import-class]').click();f.w.$('importNext').click();}
function choose(w,i,value){const el=w.document.querySelector(`[data-import-choice="${i}"][value="${value}"]`);el.checked=true;el.onchange();}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 try{
  const f=await fixture();const {w,calls}=f;
  await w.renderTeacherImport(1);w.$('importNext').click();assert.match(w.$('importStatus').textContent,/Selecione/);assert.equal(w.document.querySelector('select'),null);
  await destination(f);w.$('importText').value='Nome\tEmail\nAna Costa\tana@example.com\nBruno Lima\t';w.$('importBack').click();w.$('importNext').click();assert.match(w.$('importText').value,/Ana Costa/);
  await w.$('importReview').onclick();assert.match(w.$('importStage').textContent,/2 alunos reconhecidos/);assert.equal(calls.filter(x=>x.action==='import').length,0);
  const commit=w.$('importCommit');await Promise.all([commit.onclick(),commit.onclick()]);assert.equal(calls.filter(x=>x.action==='import').length,1);await tick();assert.match(w.$('importClassCode').textContent,/CLASSCODE/);w.$('importStudents').click();assert.equal(f.nav.at(-1),'teacher-students');assert.equal(w.S.catalogSelection.class_id,'class');f.close();

  const fresh=await fixture({empty:true});await fresh.w.renderTeacherImport(1);assert.match(fresh.w.$('importStage').textContent,/ainda não tem escolas/);fresh.w.$('importSchoolName').value='Nova Escola';await fresh.w.$('importCreateSchool').onsubmit({preventDefault(){}});fresh.w.$('importClassName').value='2º B';await fresh.w.$('importCreateClass').onsubmit({preventDefault(){}});fresh.w.$('importNext').click();assert.match(fresh.w.$('importStage').textContent,/Nova Escola · 2º B/);assert.deepEqual(fresh.calls.filter(x=>x.action.startsWith('create')).map(x=>x.action),['create_organization','create_class']);fresh.close();

  const dup=await fixture({candidates:[{id:'existing',full_name:'Ana Costa',email:'ana@example.com',enrolled:true}],failImport:true});await destination(dup);
  dup.w.$('importText').value='Ana Costa\nAna Costa\nBruno Lima';await dup.w.$('importReview').onclick();await dup.w.$('importCommit').onclick();assert.match(dup.w.$('importStatus').textContent,/possível duplicidade/);assert.equal(dup.calls.filter(x=>x.action==='import').length,0);
  for(let i=0;i<3;i++)choose(dup.w,i,'skip');await dup.w.$('importCommit').onclick();assert.match(dup.w.$('importStatus').textContent,/ao menos um/);
  choose(dup.w,0,'existing');choose(dup.w,2,'new');await dup.w.$('importCommit').onclick();assert.match(dup.w.$('importStatus').textContent,/Falha temporária/);await dup.w.$('importCommit').onclick();const attempts=dup.calls.filter(x=>x.action==='import');assert.equal(attempts.length,2);assert.equal(attempts[0].request_id,attempts[1].request_id);assert.equal(attempts[1].rows[0].student_id,'existing');dup.close();

  const bad=await fixture();await destination(bad);bad.w.$('importText').value='Nome;Email\nAna;inválido';await bad.w.$('importReview').onclick();assert.equal(bad.calls.filter(x=>x.action==='review').length,0);assert.match(bad.w.$('importStatus').textContent,/Confira/);
  bad.w.$('importText').value=Array.from({length:501},(_,i)=>'Aluno '+i).join('\n');await bad.w.$('importReview').onclick();assert.match(bad.w.$('importStatus').textContent,/500/);
  Object.defineProperty(bad.w.$('importFile'),'files',{value:[{name:'turma.csv',size:40,text:async()=> 'nome;email\nAna Costa;ana@example.com'}]});await bad.w.$('importFile').onchange();await bad.w.$('importReview').onclick();assert.match(bad.w.$('importStage').textContent,/1 alunos reconhecidos/);bad.close();

  for(const [route,title] of [['teacher-organization','Escolas'],['teacher-classes','Turmas'],['teacher-students','Alunos']]){
   const f=await fixture();f.w.S.route=route;await f.w.renderTeacherOrganization(1);assert.equal(f.w.document.querySelector('h1').textContent,title);
   f.w.document.querySelector('[data-org-open="school"]').click();await tick();
   if(route==='teacher-organization')assert.equal(f.nav.at(-1),'teacher-classes');
   else if(route==='teacher-classes'){f.w.document.querySelector('[data-class-open]').click();assert.equal(f.nav.at(-1),'teacher-students');}
   else {assert(f.w.$('orgRosterCreatePanel').hidden);const b=[...f.w.document.querySelectorAll('button')].find(x=>x.textContent==='Importar nesta turma');b.click();assert.equal(f.nav.at(-1),'teacher-import');assert.equal(f.w.S.catalogSelection.class_id,'class');}
   f.close();
  }
  console.log('PASS: importação em três passos via HTTP, criação, destino, retorno, CSV/Excel, validação, duplicidades, clique duplo, retry idempotente, PINs e rotas (APIs simuladas).');
 }finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
