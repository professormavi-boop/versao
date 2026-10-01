const assert=require('assert'),fs=require('fs'),{JSDOM}=require('jsdom');
async function scenario(route){
 const dom=new JSDOM('<div id="view"></div>',{url:'https://app.versaoprofessor.com',runScripts:'outside-only'}),w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};
 w.S={profile:{role:'teacher'},session:{user:{id:'teacher'}},route,cache:{}};w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=(a,b)=>`<h1>${a}</h1><p>${b}</p>`;w.navigationCurrent=()=>true;w.navigate=()=>{};
 let imports=0;w.edge=async(slug,b)=>{
 if(slug==='student-pin-api')return{code:'CLASSCODE',students:[]};
 switch(b.action){case'organizations':return{organizations:[{id:'school',name:'Escola Teste',is_active:true}]};case'base':return{classes:[{id:'class',name:'3º A',year:2026,student_count:0,is_active:true}]};case'students':return{students:[]};case'review':return{candidates:[]};case'import':imports++;return{processed:b.rows.filter(x=>x.choice!=='skip').length};default:throw Error(b.action);}
 };
 w.eval(fs.readFileSync('teacher-organization.e12.js','utf8')+'\nwindow.renderOrgTest=renderTeacherOrganization;');
 await w.renderOrgTest(1);
 if(route==='teacher-import'){
  assert.equal(w.document.querySelector('h1').textContent,'Importar alunos');assert(w.$('orgRosterCreatePanel').open);assert(w.$('orgStudentsPanel').hidden);
  w.$('rosterText').value='Nome\tEmail\nAna Costa\tana@example.com\nBruno Lima\t';await w.$('rosterReview').onclick();assert.match(w.$('rosterReviewBody').textContent,/Ana Costa/);assert.equal(imports,0);
  await w.$('rosterCommit').onclick();assert.equal(imports,1);assert.match(w.$('orgRoster').textContent,/Importação concluída/);w.$('rosterViewStudents').click();assert(!w.$('orgStudentsPanel').hidden);assert.match(w.$('classAccess').textContent,/CLASSCODE/);
 }else assert.equal(w.document.querySelector('h1').textContent,route==='teacher-classes'?'Minhas turmas':route==='teacher-students'?'Meus alunos':'Minhas escolas');
 dom.window.close();
}
(async()=>{for(const route of ['teacher-organization','teacher-classes','teacher-students','teacher-import'])await scenario(route);console.log('PASS: quatro áreas, destino, colagem Excel, revisão sem gravação, importação única e acesso aos PINs (API simulada)');})().catch(e=>{console.error(e);process.exit(1)});
