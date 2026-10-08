'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=file=>fs.readFileSync(file,'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const actor='00000000-0000-4000-8000-000000000013';
const baseProfile={id:actor,full_name:'Estudante Teste',email:'student@example.test',role:'pending',approval_status:'pending',organization_id:null};
const studentMetadata={full_name:'Estudante Teste',requested_role:'student',signup_source:'student_self_service'};

async function fixture({profilePatch={},metadata=studentMetadata,providers=['email'],passwordError=false,completion={status:200,body:{ok:true,pending:false}},holdCompletion=false,savedSession=false,googleCallback=false}={}){
 const dom=new JSDOM(source('index.html'),{url:'https://teste.versaoprofessor.com/?acesso=email',runScripts:'outside-only'}),w=dom.window;
 if(w.document.readyState==='loading')await new Promise(resolve=>w.document.addEventListener('DOMContentLoaded',resolve,{once:true}));
 const context=dom.getInternalVMContext(),calls=[],routes=[],errors=[];
 let profile={...baseProfile,...profilePatch},release;
 const session={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600,user:{id:actor,user_metadata:{...metadata},app_metadata:{providers}}};
 const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});
 w.fetch=async(url,options={})=>{
  const address=new URL(url),body=options.body?JSON.parse(options.body):undefined;
  assert.equal(address.origin,'https://huccxcpwoydwuisrmboc.supabase.co','The fixture must intercept every request; no external fetch is permitted');
  const call={path:address.pathname,query:address.search,method:options.method||'GET',body,headers:options.headers};calls.push(call);
  if(address.pathname==='/auth/v1/token'&&address.searchParams.get('grant_type')==='password'){
   assert.equal(call.method,'POST');
   return passwordError?response(400,{error_code:'invalid_credentials',msg:'Invalid login credentials'}):response(200,session);
  }
  if(address.pathname==='/rest/v1/profiles'){
   assert.equal(call.method,'GET');assert.equal(address.searchParams.get('id'),'eq.'+actor);
   assert.equal(options.headers.Authorization,'Bearer synthetic-access');
   return response(200,[{...profile}]);
  }
  if(address.pathname==='/functions/v1/teacher-organization-api'){
   assert.equal(call.method,'POST');assert.equal(options.headers.Authorization,'Bearer synthetic-access');
   assert(['student_complete','google_complete'].includes(body?.action),'Unexpected function action: '+body?.action);
   if(holdCompletion)await new Promise(resolve=>{release=resolve;});
   // Promote even for malformed successful responses, so tests prove the UI
   // validates the completion receipt before reading an approved profile.
   if(completion.status===200)profile={...profile,role:body.action==='student_complete'?'student':'teacher',approval_status:'approved'};
   return response(completion.status,completion.body);
  }
  throw Error('Unexpected API request: '+address.pathname+address.search);
 };
 w.VersaoCaptcha={mount(){},reset(){},token(){return 'synthetic-captcha'}};
 w.VersaoGoogle={mount(){},isCallback:()=>googleCallback,receive:async()=>({...session,expires_at:Math.floor(Date.now()/1000)+3600})};
 w.VersaoFunnel={track(){}};
 w.addEventListener('error',event=>errors.push(event.error||event.message));
 // Keep core profile(), password Auth, session storage, buildNav and navigate
 // real; only the unrelated destination page content is stubbed.
 w.renderIndependentHome=async navigation=>{routes.push(navigation.route);w.document.getElementById('view').textContent='Independent home';};
 w.renderTeacherHome=async navigation=>{routes.push(navigation.route);w.document.getElementById('view').textContent='Teacher home';};
 vm.runInContext(source('core.e12.js'),context);
 if(savedSession)w.localStorage.setItem('versao-e12-session-v1',JSON.stringify({...session,expires_at:Math.floor(Date.now()/1000)+3600}));
 vm.runInContext(source('boot.e12.js'),context);await tick();
 const q=id=>w.document.getElementById(id);
 const submit=id=>q(id).onsubmit({preventDefault(){}});
 return {w,dom,calls,routes,errors,q,submit,release:()=>release?.(),close:()=>w.close(),login:async()=>{q('email').value=baseProfile.email;q('password').value='synthetic-password';await submit('loginForm');await tick();}};
}

function completeCalls(f){return f.calls.filter(call=>call.path==='/functions/v1/teacher-organization-api');}
function profileCalls(f){return f.calls.filter(call=>call.path==='/rest/v1/profiles');}
function assertNoSignup(f){assert.equal(f.calls.filter(call=>call.path==='/auth/v1/signup').length,0);assert.deepEqual(f.errors,[]);}
function assertCompletion(f){
 assert.equal(f.q('authTitle').textContent,'Conclua seu cadastro');
 assert.match(f.q('completionIntro').textContent,/estudante/i);
 assert.doesNotMatch(f.q('completionIntro').textContent,/professor/i);
 assert(f.q('loginForm').classList.contains('hidden'));
 assert(!f.q('googleSignupForm').classList.contains('hidden'));
 assert(f.q('accountForm').classList.contains('hidden'));
 assert.equal(f.q('googleName').value,'Estudante Teste');
 assert.equal(f.q('googleTerms').checked,false);
 assert.deepEqual([...f.q('googleSignupForm').querySelectorAll('input')].map(input=>input.id),['googleName','googleTerms']);
 assert.deepEqual(f.routes,[]);
}

(async()=>{
 let f=await fixture();
 assert.equal(f.q('loginAccessType').value,'independent');
 assert(!f.q('emailField').classList.contains('hidden'));assert(!f.q('passwordField').classList.contains('hidden'));
 assert(f.q('classCodeField').classList.contains('hidden'));assert(f.q('studentPinField').classList.contains('hidden'));
 assert(!f.q('loginForm').classList.contains('hidden'));assert(f.q('googleSignupForm').classList.contains('hidden'));
 assert.deepEqual([...f.q('loginForm').querySelectorAll('input[required]')].map(input=>input.id),['email','password']);
 assert.equal(f.calls.length,0,'Opening email login must not start Auth or signup');
 await f.login();assertCompletion(f);
 assert.equal(f.calls[0].path,'/auth/v1/token');assert.equal(f.calls[0].query,'?grant_type=password');
 assert.deepEqual(f.calls[0].body,{email:baseProfile.email,password:'synthetic-password',gotrue_meta_security:{captcha_token:'synthetic-captcha'}});
 assert.equal(profileCalls(f).length,1);assert.equal(completeCalls(f).length,0);
 await f.submit('googleSignupForm');assert.match(f.q('googleStatus').textContent,/termos/);assert.equal(completeCalls(f).length,0);
 f.q('googleTerms').checked=true;
 await Promise.all([f.submit('googleSignupForm'),f.submit('googleSignupForm')]);await tick();
 assert.equal(completeCalls(f).length,1,'Double clicking completion must send only one request');
 assert.deepEqual(completeCalls(f)[0].body,{action:'student_complete',full_name:'Estudante Teste',accept_terms:true,legal_version:'2026-09-28'});
 assert.equal(profileCalls(f).length,2,'Read the current profile after valid completion');
 assert.deepEqual(f.routes,['student-home']);assert.equal(f.w.__VERSAO_E12__.state.profile.role,'student');
 assert.equal(f.w.__VERSAO_E12__.state.profile.organization_id,null);assert(!f.q('shell').classList.contains('hidden'));
 assertNoSignup(f);f.close();

 for(const {role,metadata} of [{role:'teacher',metadata:{full_name:'Professor Teste'}},{role:'student',metadata:studentMetadata}]){
  f=await fixture({profilePatch:{role,approval_status:'approved'},metadata});await f.login();
  assert.deepEqual(f.routes,[role==='student'?'student-home':'home']);assert(f.q('googleSignupForm').classList.contains('hidden'));
  assert.equal(completeCalls(f).length,0,'Approved accounts must enter without a completion request');assertNoSignup(f);f.close();
 }

 f=await fixture({savedSession:true});assertCompletion(f);assert.equal(f.calls.length,1);assert.equal(profileCalls(f).length,1);
 f.q('googleCancel').click();assert(f.q('googleSignupForm').classList.contains('hidden'));assert(!f.q('loginForm').classList.contains('hidden'));
 assert.equal(f.w.localStorage.getItem('versao-e12-session-v1'),null);assert.equal(f.w.__VERSAO_E12__.state.session,null);
 assert.deepEqual(f.routes,[]);assert.equal(completeCalls(f).length,0);assertNoSignup(f);f.close();

 f=await fixture({completion:{status:400,body:{error:'Esta conta não pode ser convertida em aluno independente.'}}});await f.login();assertCompletion(f);
 f.q('googleTerms').checked=true;await f.submit('googleSignupForm');
 assert.match(f.q('googleStatus').textContent,/não pode ser convertida/);assert.deepEqual(f.routes,[]);
 assert.equal(profileCalls(f).length,1);assert.equal(completeCalls(f).length,1);assert.equal(f.q('googleComplete').disabled,false);
 assert.equal(f.q('googleName').value,'Estudante Teste');assertNoSignup(f);f.close();

 for(const body of [{ok:true,pending:true},{ok:false,pending:false},{ok:true},{pending:false},{}]){
  f=await fixture({completion:{status:200,body}});await f.login();assertCompletion(f);
  f.q('googleTerms').checked=true;await f.submit('googleSignupForm');await tick();
  assert.deepEqual(f.routes,[],'A malformed completion response must never open home: '+JSON.stringify(body));
  assert.equal(profileCalls(f).length,1,'Do not reread the profile before accepting the completion response');
  assert(f.q('googleStatus').textContent.trim(),'Show an actionable completion failure');
  assert.equal(f.q('googleComplete').disabled,false);assertNoSignup(f);f.close();
 }

 f=await fixture({holdCompletion:true});await f.login();f.q('googleTerms').checked=true;
 const inFlight=f.submit('googleSignupForm');await tick();assert.equal(completeCalls(f).length,1);
 f.q('googleCancel').click();f.release();await inFlight;await tick();
 assert.deepEqual(f.routes,[],'A completion response arriving after cancel must not open home');
 assert.equal(profileCalls(f).length,1);assert.equal(f.w.localStorage.getItem('versao-e12-session-v1'),null);
 assert(!f.q('loginForm').classList.contains('hidden'));assertNoSignup(f);f.close();

 f=await fixture({profilePatch:{approval_status:'rejected'}});await f.login();
 assert(f.q('googleSignupForm').classList.contains('hidden'));assert.match(f.q('loginStatus').textContent,/sem acesso aprovado/);
 assert.deepEqual(f.routes,[]);assert.equal(completeCalls(f).length,0);assert.equal(f.w.localStorage.getItem('versao-e12-session-v1'),null);assertNoSignup(f);f.close();

 f=await fixture({passwordError:true});await f.login();
 assert(f.q('googleSignupForm').classList.contains('hidden'));assert(f.q('loginStatus').textContent.trim());
 assert.equal(profileCalls(f).length,0);assert.equal(completeCalls(f).length,0);assert.deepEqual(f.routes,[]);
 assert.equal(f.w.localStorage.getItem('versao-e12-session-v1'),null);assertNoSignup(f);f.close();

 f=await fixture({metadata:{full_name:'Professor Google',requested_role:'teacher'},providers:['google'],googleCallback:true});
 assert(!f.q('googleSignupForm').classList.contains('hidden'));assert.match(f.q('completionIntro').textContent,/professor/i);
 assert.equal(f.q('googleTerms').checked,false);assert.equal(f.q('googleName').value,'Professor Google');
 f.q('googleTerms').checked=true;await f.submit('googleSignupForm');await tick();
 assert.equal(completeCalls(f)[0].body.action,'google_complete');assert.deepEqual(f.routes,['home']);assertNoSignup(f);f.close();

 console.log('PASS student email login: real Auth/profile, pending completion consent, identity-bound RPC, strict result, approved direct access, duplicate protection, cancellation, rejected profile, wrong password and Google teacher compatibility.');
})().catch(error=>{console.error(error);process.exitCode=1;});
