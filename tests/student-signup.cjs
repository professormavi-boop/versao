const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),vm=require('node:vm');
async function run({confirmed=true,failComplete=false,google=false,pending=false}={}){
 const dom=new JSDOM(fs.readFileSync('cadastro-aluno.html','utf8'),{url:'https://example.test/cadastro-aluno.html',runScripts:'outside-only'}),w=dom.window,calls=[],routes=[];
 w.AbortController=AbortController;w.VersaoCaptcha={mount(){},reset(){},token(){return 'captcha';}};
 const session={access_token:'access',refresh_token:'refresh',expires_in:3600,user:{id:'student-id',user_metadata:{full_name:'Aluno Google'}}};
 w.VersaoGoogle={mount(...args){calls.push({googleMount:args})},isCallback:()=>google,receive:async()=>session};
 w.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:!url.includes('/functions/')||!failComplete,json:async()=>url.includes('/functions/')?{ok:true,pending,error:'Conta indisponível'}:confirmed?session:{user:{id:'new'}}};};
 assert.equal(w.document.getElementById('studentSignup').dataset.registrationEnabled,'true');
 vm.runInNewContext(fs.readFileSync('student-signup.e12.js','utf8'),{window:w,document:w.document,localStorage:w.localStorage,location:{replace:url=>routes.push(url)},fetch:w.fetch,AbortController,setTimeout,clearTimeout});await new Promise(r=>setImmediate(r));
 const q=id=>w.document.getElementById(id);q('fullName').value='Aluno Teste';q('email').value='aluno@example.test';q('password').value='abcdefgh1';q('passwordConfirm').value='abcdefgh1';q('terms').checked=true;
 return {w,q,calls,routes,submit:()=>q('studentSignup').onsubmit({preventDefault(){}})};
}
(async()=>{
 const blocked=new JSDOM(fs.readFileSync('cadastro-aluno.html','utf8'),{url:'https://example.test/',runScripts:'outside-only'});blocked.window.document.getElementById('studentSignup').dataset.registrationEnabled='false';let attempted=false;blocked.window.fetch=async()=>{attempted=true;throw Error('unexpected')};blocked.window.eval(fs.readFileSync('student-signup.e12.js','utf8'));assert(blocked.window.document.getElementById('submitBtn').disabled);assert.equal(blocked.window.document.getElementById('studentSignup').onsubmit,null);assert.equal(attempted,false);blocked.window.close();
 let x=await run({confirmed:false});await x.submit();assert.match(x.q('status').textContent,/sessão automaticamente/);assert.equal(x.calls.filter(c=>c.url).length,1);assert.equal(x.calls.find(c=>c.url).body.data.requested_role,'student');x.w.close();
 x=await run({failComplete:true});await x.submit();assert.match(x.q('status').textContent,/indisponível/);assert.equal(x.w.localStorage.getItem('versao-e12-session-v1'),null);assert.equal(x.calls.filter(c=>c.url).at(-1).body.action,'student_complete');x.w.close();
 x=await run({google:true,failComplete:true});await x.submit();assert.equal(x.calls.filter(c=>c.url).length,1);assert.equal(x.calls[0].googleMount[2],'student');x.w.close();
 x=await run({pending:true});assert.equal(x.q('signupAvailability').hidden,true);await Promise.all([x.submit(),x.submit()]);assert.match(x.q('status').textContent,/Aguarde a aprovação/);assert.equal(x.calls.filter(c=>c.url).length,2);assert.equal(x.w.localStorage.getItem('versao-e12-session-v1'),null);assert.equal(x.w.location.pathname,'/cadastro-aluno.html');assert.equal(x.q('submitBtn').disabled,false);x.w.close();
 x=await run();await x.submit();assert.deepEqual(x.routes,['/?student_onboarding=1']);assert.equal(JSON.parse(x.w.localStorage.getItem('versao-e12-session-v1')).user.id,'student-id');x.w.close();
 x=await run();x.q('terms').checked=false;await x.submit();assert.equal(x.calls.filter(c=>c.url).length,0);x.w.close();
 console.log('PASS student signup: direct access fallback, role request, no session on blocked completion, Google audience, required consent, pending fallback, direct session/redirect and duplicate protection');
})().catch(e=>{console.error(e);process.exitCode=1});
