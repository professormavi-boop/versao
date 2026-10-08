const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),vm=require('node:vm');
const HTML=fs.readFileSync('cadastro-aluno.html','utf8'),SCRIPT=fs.readFileSync('student-signup.e12.js','utf8');
const SESSION={access_token:'access',refresh_token:'refresh',expires_in:3600,user:{id:'student-id',user_metadata:{full_name:'Aluno Google'}}};
const signup=body=>({path:'/auth/v1/signup',body}),login=body=>({path:'/auth/v1/token?grant_type=password',body}),complete=body=>({path:'/functions/v1/teacher-organization-api',body});
const success=()=>[signup(SESSION),complete({ok:true,pending:false})];

async function run({responses=success(),google=false}={}){
 const dom=new JSDOM(HTML,{url:'https://example.test/cadastro-aluno.html',runScripts:'outside-only'}),w=dom.window,calls=[],routes=[],errors=[],captcha={mounts:[],resets:[],tokens:[]},googleMounts=[];
 let cursor=0;
 function TrackingError(...args){const error=Error(...args);errors.push(error);return error;}
 TrackingError.prototype=Error.prototype;
 w.AbortController=AbortController;
 w.VersaoCaptcha={mount:id=>captcha.mounts.push(id),reset:id=>captcha.resets.push(id),token:id=>{const token='captcha-'+(captcha.tokens.length+1);captcha.tokens.push({id,token});return token;}};
 w.VersaoGoogle={mount:(...args)=>googleMounts.push(args),isCallback:()=>google,receive:async()=>({...SESSION,expires_at:Math.floor(Date.now()/1000)+3600})};
 w.fetch=async(url,options)=>{
  const path=url.slice('https://huccxcpwoydwuisrmboc.supabase.co'.length),call={url,path,body:JSON.parse(options.body),headers:options.headers};calls.push(call);
  const response=responses[cursor++];assert(response,'Unexpected request: '+path);assert.equal(path,response.path);
  const status=response.status||200;
  return {ok:status>=200&&status<300,status,json:async()=>{if(response.invalidJson)throw new SyntaxError('Invalid JSON');return response.body;}};
 };
 assert.equal(w.document.getElementById('studentSignup').dataset.registrationEnabled,'true');
 vm.runInNewContext(SCRIPT,{window:w,document:w.document,localStorage:w.localStorage,location:{replace:url=>routes.push(url)},fetch:w.fetch,AbortController,setTimeout,clearTimeout,Error:TrackingError});
 await new Promise(r=>setImmediate(r));
 const q=id=>w.document.getElementById(id);q('fullName').value='Aluno Teste';q('email').value='aluno@example.test';q('password').value='abcdefgh1';q('passwordConfirm').value='abcdefgh1';q('terms').checked=true;
 return {w,q,calls,routes,errors,captcha,googleMounts,submit:()=>q('studentSignup').onsubmit({preventDefault(){}}),close:()=>w.close()};
}
function noAccess(x){assert.equal(x.w.localStorage.getItem('versao-e12-session-v1'),null);assert.deepEqual(x.routes,[]);assert.equal(x.q('submitBtn').disabled,false);}
function failure(x){noAccess(x);assert.match(x.q('status').className,/\berror\b/);assert.doesNotMatch(x.q('status').textContent,/aguarde a aprovação/i);}
function loginMode(x){assert.equal(x.q('submitBtn').textContent,'Entrar e continuar');assert.equal(x.q('existingAccount').textContent,'Quero criar uma conta');assert.equal(x.q('existingAccount').hidden,false);assert.equal(x.q('email').closest('label').hidden,false);assert.equal(x.q('password').closest('label').hidden,false);assert.equal(x.q('passwordConfirm').closest('label').hidden,true);assert.equal(x.q('passwordConfirm').required,false);}
function preservedFields(x){assert.equal(x.q('fullName').value,'Aluno Teste');assert.equal(x.q('email').value,'aluno@example.test');assert.equal(x.q('password').value,'abcdefgh1');assert.equal(x.q('passwordConfirm').value,'abcdefgh1');assert.equal(x.q('terms').checked,true);}
function structuredError(x,{code,status,path}){assert(x.errors.some(error=>error.code===code&&error.status===status&&error.path===path),'Error must retain code, status and request path');}

(async()=>{
 const blocked=new JSDOM(HTML,{url:'https://example.test/',runScripts:'outside-only'});blocked.window.document.getElementById('studentSignup').dataset.registrationEnabled='false';let attempted=false;blocked.window.fetch=async()=>{attempted=true;throw Error('unexpected');};blocked.window.eval(SCRIPT);assert(blocked.window.document.getElementById('submitBtn').disabled);assert.equal(blocked.window.document.getElementById('studentSignup').onsubmit,null);assert.equal(attempted,false);blocked.window.close();

 for(const code of ['user_already_exists','email_exists']){
  const x=await run({responses:[{...signup({code:422,error_code:code,msg:'User already registered'}),status:422},login(SESSION),complete({ok:true,pending:false})]});
  await x.submit();failure(x);loginMode(x);preservedFields(x);assert.match(x.q('status').textContent,/conta|entrar/i);assert.equal(x.calls.length,1,'Duplicate signup must await an explicit login submission');assert.equal(x.captcha.tokens.length,1);assert.deepEqual(x.captcha.resets,['signupCaptcha']);
  structuredError(x,{code,status:422,path:'/auth/v1/signup'});
  await x.submit();assert.deepEqual(x.calls.map(c=>c.path),['/auth/v1/signup','/auth/v1/token?grant_type=password','/functions/v1/teacher-organization-api']);assert.equal(x.calls.filter(c=>c.path==='/auth/v1/signup').length,1);assert.equal(x.calls[0].body.gotrue_meta_security.captcha_token,'captcha-1');assert.equal(x.calls[1].body.gotrue_meta_security.captcha_token,'captcha-2');assert.equal(x.calls[1].body.email,'aluno@example.test');assert.equal(x.calls[1].body.password,'abcdefgh1');assert.equal(x.calls[1].body.data,undefined);assert.equal(x.calls[2].headers.Authorization,'Bearer access');assert.equal(x.calls[2].body.action,'student_complete');assert.deepEqual(x.routes,['/?student_onboarding=1']);assert.equal(JSON.parse(x.w.localStorage.getItem('versao-e12-session-v1')).user.id,'student-id');assert.deepEqual(x.captcha.resets,['signupCaptcha','signupCaptcha']);x.close();
 }

 let x=await run({responses:[{...login({code:400,error_code:'invalid_credentials',msg:'Invalid login credentials'}),status:400}]});x.q('existingAccount').onclick();loginMode(x);await x.submit();failure(x);loginMode(x);preservedFields(x);assert.match(x.q('status').textContent,/e-mail ou senha incorretos/i);structuredError(x,{code:'invalid_credentials',status:400,path:'/auth/v1/token?grant_type=password'});assert.equal(x.calls.length,1);assert.deepEqual(x.captcha.resets,['signupCaptcha']);x.close();

 x=await run({responses:[]});x.q('existingAccount').onclick();loginMode(x);x.q('existingAccount').onclick();assert.equal(x.q('submitBtn').textContent,'Criar minha conta');assert.equal(x.q('passwordConfirm').closest('label').hidden,false);assert.equal(x.q('passwordConfirm').required,true);preservedFields(x);assert.equal(x.calls.length,0);x.close();

 for(const response of [
  {...signup({code:400,error_code:'captcha_failed',msg:'Captcha verification failed'}),status:400},
  {...signup({code:429,error_code:'over_request_rate_limit',msg:'Rate limit exceeded'}),status:429}
 ]){
  x=await run({responses:[response]});await x.submit();failure(x);preservedFields(x);assert.equal(x.calls.length,1);assert.deepEqual(x.captcha.resets,['signupCaptcha']);structuredError(x,{code:response.body.error_code,status:response.status,path:'/auth/v1/signup'});
  if(response.status===429){assert.match(x.q('status').textContent,/aguarde|tentativas|instantes|tente novamente/i);assert.doesNotMatch(x.q('status').textContent,/rate limit|too many requests/i);}else assert.match(x.q('status').textContent,/verificação de segurança/i);
  x.close();
 }

 for(const body of [{},{user:{id:'new'}},{...SESSION,access_token:123},{...SESSION,refresh_token:''},{...SESSION,user:{}}]){
  x=await run({responses:[signup(body)]});await x.submit();failure(x);loginMode(x);preservedFields(x);assert.match(x.q('status').textContent,/sessão/i);assert.equal(x.calls.length,1);assert.deepEqual(x.captcha.resets,['signupCaptcha']);x.close();
 }

 for(const response of [complete({}),{...complete(null),invalidJson:true},complete({ok:false,error:'Conta indisponível'}),complete({ok:true,pending:true}),complete({ok:true}),complete({ok:true,pending:'false'})]){
  x=await run({responses:[signup(SESSION),response]});await x.submit();failure(x);assert.equal(x.calls.length,2);assert.equal(x.q('submitBtn').textContent,'Concluir cadastro');assert.equal(x.q('email').closest('label').hidden,true);x.close();
 }

 x=await run({responses:[signup(SESSION),{...complete({error:'Sessão inválida.'}),status:401},login(SESSION),complete({ok:true,pending:false})]});await x.submit();failure(x);loginMode(x);preservedFields(x);assert.equal(x.calls.length,2);await x.submit();assert.deepEqual(x.calls.map(c=>c.path),['/auth/v1/signup','/functions/v1/teacher-organization-api','/auth/v1/token?grant_type=password','/functions/v1/teacher-organization-api']);assert.deepEqual(x.routes,['/?student_onboarding=1']);assert.equal(x.calls[2].body.gotrue_meta_security.captcha_token,'captcha-2');x.close();

 x=await run({responses:[signup(SESSION),{...complete({error:'Conta indisponível'}),status:400},complete({ok:true,pending:false})]});await x.submit();failure(x);assert.match(x.q('status').textContent,/indisponível/i);assert.equal(x.q('submitBtn').textContent,'Concluir cadastro');assert.equal(x.q('existingAccount').hidden,true);await x.submit();assert.deepEqual(x.calls.map(c=>c.path),['/auth/v1/signup','/functions/v1/teacher-organization-api','/functions/v1/teacher-organization-api']);assert.equal(x.captcha.tokens.length,1,'Completion retry must reuse the session, not authenticate again');assert.deepEqual(x.routes,['/?student_onboarding=1']);x.close();

 x=await run({google:true,responses:[{...complete({error:'Conta indisponível'}),status:400},complete({ok:true,pending:false})]});await x.submit();failure(x);assert.equal(x.calls.length,1);assert.equal(x.googleMounts[0][2],'student');assert.equal(x.q('submitBtn').textContent,'Concluir cadastro');await x.submit();assert.equal(x.calls.length,2);assert(x.calls.every(c=>c.path==='/functions/v1/teacher-organization-api'));assert.equal(x.captcha.tokens.length,0);assert.deepEqual(x.routes,['/?student_onboarding=1']);x.close();

 x=await run();assert.equal(x.q('signupAvailability').hidden,true);await Promise.all([x.submit(),x.submit()]);assert.equal(x.calls.length,2,'Double submit must not duplicate Auth or completion calls');assert.equal(x.calls[0].body.data.requested_role,'student');assert.equal(x.calls[0].body.data.signup_source,'student_self_service');assert.equal(x.calls[0].body.data.legal_version,'2026-09-28');assert.equal(x.calls[1].body.accept_terms,true);assert.deepEqual(x.routes,['/?student_onboarding=1']);const stored=JSON.parse(x.w.localStorage.getItem('versao-e12-session-v1'));assert.equal(stored.user.id,'student-id');assert.equal(stored.access_token,'access');assert.equal(stored.refresh_token,'refresh');assert(Number.isFinite(stored.expires_at));x.close();

 x=await run({responses:[]});x.q('terms').checked=false;await x.submit();failure(x);assert.equal(x.calls.length,0);assert.equal(x.captcha.resets.length,0);x.close();
 x=await run({responses:[]});x.q('passwordConfirm').value='different';await x.submit();failure(x);assert.equal(x.calls.length,0);x.close();
 console.log('PASS student signup: structured Auth errors, duplicate recovery with fresh CAPTCHA, strict completion, invalid-session recovery, retry without duplicate signup, Google audience, consent and double-submit guard');
})().catch(e=>{console.error(e);process.exitCode=1});
