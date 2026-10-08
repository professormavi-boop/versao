const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
async function run({confirmed=true,failComplete=false,google=false}={}){
 const dom=new JSDOM(fs.readFileSync('cadastro-aluno.html','utf8'),{url:'https://example.test/cadastro-aluno.html',runScripts:'outside-only'}),w=dom.window,calls=[];
 w.AbortController=AbortController;w.VersaoCaptcha={mount(){},reset(){},token(){return 'captcha';}};
 const session={access_token:'access',refresh_token:'refresh',expires_in:3600,user:{id:'student-id',user_metadata:{full_name:'Aluno Google'}}};
 w.VersaoGoogle={mount(...args){calls.push({googleMount:args})},isCallback:()=>google,receive:async()=>session};
 w.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:!url.includes('/functions/')||!failComplete,json:async()=>url.includes('/functions/')?{ok:true,error:'Conta indisponível'}:confirmed?session:{user:{id:'new'}}};};
 // Exercise completion up to session storage without navigating the simulated browser.
 w.localStorage.setItem=()=>{};
 w.document.getElementById('studentSignup').dataset.registrationEnabled='true';
 w.eval(fs.readFileSync('student-signup.e12.js','utf8'));await new Promise(r=>setImmediate(r));
 const q=id=>w.document.getElementById(id);q('fullName').value='Aluno Teste';q('email').value='aluno@example.test';q('password').value='abcdefgh1';q('passwordConfirm').value='abcdefgh1';q('terms').checked=true;
 return {w,q,calls,submit:()=>q('studentSignup').onsubmit({preventDefault(){}})};
}
(async()=>{
 const blocked=new JSDOM(fs.readFileSync('cadastro-aluno.html','utf8'),{url:'https://example.test/',runScripts:'outside-only'});let attempted=false;blocked.window.fetch=async()=>{attempted=true;throw Error('unexpected')};blocked.window.eval(fs.readFileSync('student-signup.e12.js','utf8'));assert(blocked.window.document.getElementById('submitBtn').disabled);assert.equal(blocked.window.document.getElementById('studentSignup').onsubmit,null);assert.equal(attempted,false);blocked.window.close();
 let x=await run({confirmed:false});await x.submit();assert.match(x.q('status').textContent,/sessão automaticamente/);assert.equal(x.calls.filter(c=>c.url).length,1);assert.equal(x.calls.find(c=>c.url).body.data.requested_role,'student');x.w.close();
 x=await run({failComplete:true});await x.submit();assert.match(x.q('status').textContent,/indisponível/);assert.equal(x.w.localStorage.getItem('versao-e12-session-v1'),null);assert.equal(x.calls.filter(c=>c.url).at(-1).body.action,'student_complete');x.w.close();
 x=await run({google:true,failComplete:true});await x.submit();assert.equal(x.calls.filter(c=>c.url).length,1);assert.equal(x.calls[0].googleMount[2],'student');x.w.close();
 x=await run();x.q('terms').checked=false;await x.submit();assert.equal(x.calls.filter(c=>c.url).length,0);x.w.close();
 console.log('PASS student signup: direct access fallback, role request, no session on blocked completion, Google audience, required consent');
})().catch(e=>{console.error(e);process.exitCode=1});
