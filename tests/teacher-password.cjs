const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {JSDOM}=require('jsdom');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync('teacher-main.e12.js'));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const dom=new JSDOM('<div id="view"></div>',{runScripts:'outside-only'}),w=dom.window;
 try{
  w.$=id=>w.document.getElementById(id);w.header=()=>'';w.S={profile:{role:'teacher',id:'teacher-1'}};
  w.navigationCurrent=()=>true;w.ensure=async()=>({access_token:'test-session',user:{id:'teacher-1'}});
  let calls=0,release;
  w.accountRequest=async(path,body,token)=>{calls++;assert.equal(path,'user');assert.equal(token,'test-session');assert.deepEqual(Object.keys(body),['password']);await new Promise(r=>release=r);return {id:'teacher-1'};};
  w.eval((await (await fetch('http://127.0.0.1:'+server.address().port)).text())+'\nwindow.renderTeacherPassword=renderTeacherPassword;');
  await w.renderTeacherPassword({});
  const form=w.$('teacherPasswordForm'),status=w.$('teacherPasswordStatus'),p=form.elements.password,c=form.elements.confirmation;
  const submit=()=>form.onsubmit({preventDefault(){}});
  p.value='short';c.value='short';await submit();assert.equal(calls,0);
  p.value='LongPassword123';c.value='DifferentPassword';await submit();assert.equal(calls,0);assert.match(status.textContent,/coincidem/);
  c.value=p.value;const first=submit();await new Promise(r=>setImmediate(r));await submit();assert.equal(calls,1);release();await first;assert.match(status.textContent,/sucesso/);assert.equal(p.value,'');assert.equal(c.value,'');
  w.accountRequest=async()=>{throw Error('Sua sessão expirou. Entre novamente.');};p.value=c.value='LongPassword123';await submit();assert.match(status.textContent,/sessão expirou/);assert.equal(p.value,'');assert.equal(form.querySelector('button').disabled,false);
  w.S.profile.role='student';await assert.rejects(w.renderTeacherPassword({}),/professor/);
  console.log('PASS: teacher password over HTTP, validation, duplicate submission, success, failure, role guard');
 }finally{dom.window.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
