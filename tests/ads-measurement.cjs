'use strict';
// Isolated regression tests: no real Supabase, Google, Ads requests, signups, or paid events.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const USER_ID='11111111-1111-4111-8111-111111111111';
const session=()=>({access_token:'fake.user.token',refresh_token:'fake-refresh',user:{id:USER_ID,created_at:new Date().toISOString()}});
const ok=data=>({ok:true,status:200,json:async()=>data});
const json=value=>JSON.parse(JSON.stringify(value));
function storage(seed={}){const data=new Map(Object.entries(seed));return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
function browser(url='https://app.versaoprofessor.com/',opts={}){
  let current=new URL(url);const navigations=[],requests=[],listeners={},elements={};
  const location={get href(){return current.href;},get hostname(){return current.hostname;},get origin(){return current.origin;},get search(){return current.search;},get pathname(){return current.pathname;},get hash(){return current.hash;},assign:u=>{navigations.push(new URL(u,current).href);},replace:u=>{navigations.push(new URL(u,current).href);}};
  function element(id){
    if(!elements[id])elements[id]={id,value:'',checked:false,disabled:false,hidden:false,textContent:'',className:'',events:{},dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(n,fn){this.events[n]=fn;},reset(){},append(){}};
    return elements[id];
  }
  const context={URL,URLSearchParams,Date,Map,Set,JSON,Promise,Number,Object,String,Array,Uint8Array,TextEncoder,Blob,AbortController,AbortSignal,console,crypto:webcrypto,
    atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),
    setTimeout,clearTimeout,location,history:{replaceState:(_a,_b,u)=>{current=new URL(u,current);}},
    localStorage:opts.localStorage||storage(),sessionStorage:opts.sessionStorage||storage(),
    navigator:{sendBeacon:()=>true},
    document:{readyState:'loading',head:{appendChild(){}},querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({dataset:{}}),getElementById:element,addEventListener:(n,fn)=>{listeners[n]=fn;}},
    fetch:async(u,o={})=>{requests.push({url:String(u),options:o});if(opts.fetch)return opts.fetch(String(u),o);throw Error('Unmocked network blocked');}
  };
  context.window=context;vm.createContext(context);
  return {context,elements,element,requests,navigations,listeners,run(name){vm.runInContext(read(name),context,{filename:name});},setURL(u){current=new URL(u);}};
}
function funnel(url,opts){const b=browser(url,opts);b.run('funnel-analytics.js');return b;}
function server(options={}){
  const calls=[],logs=[],env={VERCEL_ENV:'production',OPENAI_ADS_PIXEL_ID:'test-pixel',OPENAI_ADS_CONVERSIONS_API_KEY:'test-capi-key',...options.env};
  const context={module:{exports:{}},require,Buffer,Date,Set,JSON,Object,Number,encodeURIComponent,AbortSignal,process:{env},console:{info:(...a)=>logs.push(a),error:(...a)=>logs.push(a)},fetch:async(u,o={})=>{
    calls.push({url:u,options:o});if(options.fetch)return options.fetch(u,o);
    if(u.endsWith('/auth/v1/user'))return ok(options.user||session().user);
    if(u.includes('/rest/v1/profiles'))return ok(options.profiles||[{id:USER_ID,role:'teacher',approval_status:'approved'}]);
    return options.upstream||ok({});
  }};
  vm.createContext(context);vm.runInContext(read('api/openai-conversion.js'),context);
  return {calls,logs,async send(overrides={}){
    const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(value){this.body=json(value);return this;}};
    const req={method:'POST',headers:{host:'app.versaoprofessor.com',origin:'https://app.versaoprofessor.com',authorization:'Bearer fake.user.token'},body:{profile_id:USER_ID,oppref:'synthetic-click',page:'signup'},...overrides};
    await context.module.exports(req,res);return res;
  }};
}

test('Attribution keeps the click reference through a same-campaign partial URL',()=>{
  const b=funnel('https://app.versaoprofessor.com/?utm_source=chatgpt&utm_campaign=one&oppref=click-a');
  b.setURL('https://app.versaoprofessor.com/?utm_source=chatgpt');
  assert.equal(b.context.VersaoFunnel.attribution().oppref,'click-a');
});
test('New campaign never inherits the old click identifier',()=>{
  const b=funnel('https://app.versaoprofessor.com/?utm_source=chatgpt&utm_campaign=one&oppref=click-a');
  b.setURL('https://app.versaoprofessor.com/?utm_source=other&utm_campaign=two');
  assert.equal(b.context.VersaoFunnel.attribution().oppref,undefined);
});
test('Attribution excludes token, email and other arbitrary parameters; external URL not decorated',()=>{
  const b=funnel('https://versaoprofessor.com/?oppref=abc&email=a%40test.invalid&access_token=secret&code=abc');
  const url=new URL(b.context.VersaoFunnel.withAttribution('https://app.versaoprofessor.com/?google=1'));
  assert.equal(url.searchParams.get('oppref'),'abc');assert.equal(url.searchParams.get('email'),null);assert.equal(url.searchParams.get('access_token'),null);assert.equal(url.searchParams.get('code'),null);
  assert.equal(b.context.VersaoFunnel.withAttribution('https://other.invalid/'),'https://other.invalid/');
});
test('Storage blocked does not prevent in-memory attribution or loading',()=>{
  const bad={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};
  const b=funnel('https://app.versaoprofessor.com/?oppref=abc',{localStorage:bad,sessionStorage:bad});
  b.setURL('https://app.versaoprofessor.com/');assert.equal(b.context.VersaoFunnel.attribution().oppref,'abc');
});
test('Expired and future stored attribution ignored',()=>{
  for(const saved_at of [Date.now()-31*86400000,Date.now()+86400000]){
    const b=funnel(undefined,{localStorage:storage({'versao-funnel-attribution-v1':JSON.stringify({oppref:'stale',saved_at})})});
    assert.equal(b.context.VersaoFunnel.attribution().oppref,undefined);
  }
});
test('Preview and explicit test mode never emit real registration or analytics requests',async()=>{
  for(const url of ['https://preview.vercel.app/?oppref=abc','https://app.versaoprofessor.com/?versao_test=1&oppref=abc']){
    const b=funnel(url);assert.equal((await b.context.VersaoFunnel.registration(session())).reason,'test_or_preview');assert.equal(b.context.VersaoFunnel.track('signup_complete'),false);assert.equal(b.requests.length,0);
  }
});
test('Signup registration is deduplicated in flight and after confirmed acceptance',async()=>{
  let settle;const b=funnel('https://app.versaoprofessor.com/?oppref=abc',{fetch:()=>new Promise(r=>settle=r)});const s=session();
  b.context.localStorage.setItem('versao-e12-session-v1',JSON.stringify(s));
  const a=b.context.VersaoFunnel.registration(s);b.context.VersaoFunnel.track('signup_complete',{page:'signup'});
  assert.equal(b.requests.length,1);settle(ok({status:'accepted'}));await a;
  assert.equal((await b.context.VersaoFunnel.registration(s)).status,'already_recorded');assert.equal(b.requests.length,1);
  assert.equal(b.requests[0].options.headers.Authorization,'Bearer fake.user.token');
  assert.deepEqual(Object.keys(JSON.parse(b.requests[0].options.body)).sort(),['oppref','page','profile_id']);
});
test('Non-accepted response is not recorded as success and explicit retry remains possible',async()=>{
  let n=0;const b=funnel('https://app.versaoprofessor.com/?oppref=abc',{fetch:async()=>++n===1?{ok:false,status:503,json:async()=>({reason:'conversion_not_configured'})}:ok({status:'accepted'})});
  assert.equal((await b.context.VersaoFunnel.registration(session())).status,'failed');
  assert.equal((await b.context.VersaoFunnel.registration(session())).status,'accepted');assert.equal(n,2);
});
test('Network failure in analytics resolves safely without rejecting access',async()=>{
  const b=funnel('https://app.versaoprofessor.com/?oppref=abc');
  assert.equal((await b.context.VersaoFunnel.registration(session())).reason,'network');
});
test('An organic signup is not assigned an invented ad click',async()=>{
  const b=funnel();assert.equal((await b.context.VersaoFunnel.registration(session())).reason,'no_ad_reference');assert.equal(b.requests.length,0);
});
test('Google apex-to-app transfer preserves attribution and retains fixed destination',async()=>{
  const b=funnel('https://versaoprofessor.com/cadastro-professor.html?utm_source=chatgpt&oppref=abc',{fetch:async()=>ok({external:{google:true}})});
  b.run('google-auth.e12.js');await b.context.VersaoGoogle.start();
  const target=new URL(b.navigations[0]);assert.equal(target.origin,'https://app.versaoprofessor.com');assert.equal(target.searchParams.get('google'),'1');assert.equal(target.searchParams.get('oppref'),'abc');
});
test('Google login still works if optional analytics module is missing',async()=>{
  const b=browser('https://app.versaoprofessor.com/',{fetch:async()=>ok({external:{google:true}})});b.run('google-auth.e12.js');await b.context.VersaoGoogle.start();
  const url=new URL(b.navigations[0]);assert.equal(url.searchParams.get('code_challenge_method'),'s256');assert.equal(url.searchParams.get('redirect_to'),'https://app.versaoprofessor.com/index.html?google_callback=1');assert.equal(url.searchParams.get('code_challenge').length,43);
});
test('Google callback restores the saved attribution, drops OAuth secrets, and measures a new account',async()=>{
  const ss=storage(),ls=storage();
  const a=funnel('https://app.versaoprofessor.com/?oppref=abc',{sessionStorage:ss,localStorage:ls,fetch:async()=>ok({external:{google:true}})});a.run('google-auth.e12.js');await a.context.VersaoGoogle.start();
  const pending=JSON.parse(ss.getItem('versao-google-pkce-v1'));assert.equal(pending.attribution.oppref,'abc');
  const s=session();const b=browser('https://app.versaoprofessor.com/index.html?google_callback=1&code=oauth-secret#access_token=private',{sessionStorage:ss,localStorage:storage(),fetch:async u=>u.includes('token?')?ok({...s,provider_token:'must-not-return'}):ok({status:'accepted'})});
  b.run('google-auth.e12.js');b.run('funnel-analytics.js');const result=await b.context.VersaoGoogle.receive();
  assert.equal(result.user.id,USER_ID);assert.equal(result.provider_token,undefined);assert.equal(b.context.location.search,'');assert.equal(b.context.location.hash,'');assert.equal(b.context.VersaoFunnel.attribution().oppref,'abc');assert.equal(ss.getItem('versao-google-pkce-v1'),null);
  assert.equal(b.requests.filter(x=>x.url==='/api/openai-conversion').length,1);
});
test('Returning Google users and student registrations are not dispatched as teacher registrations',async()=>{
  for(const audience of ['student','teacher']){
    const pending={verifier:'A'.repeat(43),createdAt:Date.now(),origin:'https://app.versaoprofessor.com',audience,attribution:{oppref:'abc'}};
    const s=session();if(audience==='teacher')s.user.created_at='2025-01-01T00:00:00Z';
    const b=funnel('https://app.versaoprofessor.com/index.html?google_callback=1&code=x',{sessionStorage:storage({'versao-google-pkce-v1':JSON.stringify(pending)}),fetch:async()=>ok(s)});b.run('google-auth.e12.js');await b.context.VersaoGoogle.receive();assert.equal(b.requests.length,1);
  }
});
test('Invalid PKCE remains rejected without a token exchange',async()=>{
  const b=browser('https://app.versaoprofessor.com/index.html?google_callback=1&code=x');b.run('google-auth.e12.js');await assert.rejects(b.context.VersaoGoogle.receive(),/expirou/);assert.equal(b.requests.length,0);
});
test('Server refuses real telemetry from previews and test requests',async()=>{
  for(const options of [{env:{VERCEL_ENV:'preview'}},{env:{VERCEL_ENV:undefined}}]){const s=server(options);assert.equal((await s.send()).body.reason,'test_or_preview');assert.equal(s.calls.length,0);}
  const s=server();assert.equal((await s.send({headers:{host:'preview.vercel.app'}})).body.reason,'test_or_preview');assert.equal((await s.send({body:{test:true}})).body.reason,'test_or_preview');assert.equal(s.calls.length,0);
});
test('Server distinguishes missing configuration from successful measurement',async()=>{
  const s=server({env:{OPENAI_ADS_CONVERSIONS_API_KEY:''}});const r=await s.send();assert.equal(r.code,503);assert.equal(r.body.reason,'conversion_not_configured');assert.equal(s.calls.length,0);
});
test('Server requires authenticated matching identity, not an arbitrary profile id',async()=>{
  const s=server();assert.equal((await s.send({headers:{host:'app.versaoprofessor.com'}})).code,401);assert.equal(s.calls.length,0);
  const m=server({user:{...session().user,id:'22222222-2222-4222-8222-222222222222'}});assert.equal((await m.send()).code,403);assert.equal(m.calls.length,1);
});
test('Server excludes students, pending profiles, and existing users',async()=>{
  for(const profile of [{role:'student',approval_status:'approved'},{role:'teacher',approval_status:'pending'},{role:'pending',approval_status:'pending'}]){
    const s=server({profiles:[{id:USER_ID,...profile}]});assert.equal((await s.send()).body.reason,'teacher_registration_incomplete');assert.equal(s.calls.length,2);
  }
  const s=server({user:{...session().user,created_at:'2025-01-01T00:00:00Z'}});assert.equal((await s.send()).body.reason,'not_new_registration');assert.equal(s.calls.length,1);
});
test('Server uses a stable id and sends no name, email, auth session, or arbitrary source URL to Ads',async()=>{
  const user={...session().user,email:'private@test.invalid',user_metadata:{full_name:'Private'}};const s=server({user});
  const r=await s.send();assert.equal(r.body.status,'accepted');assert.equal(s.calls.length,3);
  const outbound=s.calls[2],event=JSON.parse(outbound.options.body).events[0];
  assert.equal(event.type,'registration_completed');assert.equal(event.timestamp_ms,Date.parse(user.created_at));assert.equal(outbound.options.headers.Authorization,'Bearer test-capi-key');assert.equal(event.user,undefined);assert(!outbound.options.body.includes('private'));assert(!outbound.options.body.includes('fake.user.token'));
  assert.equal(s.calls[0].options.method,undefined);assert.equal(s.calls[1].options.method,undefined);
  const again=server({user});await again.send();assert.equal(JSON.parse(again.calls[2].options.body).events[0].id,event.id);assert(!JSON.stringify(s.logs).includes(USER_ID));
});
test('Server reports upstream rejection, timeout and read failure as failures',async()=>{
  const s=server({upstream:{ok:false,status:400}});assert.equal((await s.send()).body.reason,'upstream_rejected');
  const timeout=server({fetch:async()=>{throw Error('timeout');}});assert.equal((await timeout.send()).code,502);
  const badProfile=server({fetch:async u=>u.endsWith('/user')?ok(session().user):{ok:false,status:500}});assert.equal((await badProfile.send()).body.reason,'profile_verification');
});
test('Server rejects cross-origin calls and malformed/oversize payloads',async()=>{
  const s=server();assert.equal((await s.send({headers:{host:'app.versaoprofessor.com',origin:'https://other.invalid'}})).code,403);
  assert.equal((await s.send({body:'{'})).code,400);assert.equal((await s.send({body:'a'.repeat(5000)})).code,413);assert.equal((await s.send({method:'GET'})).code,405);assert.equal(s.calls.length,0);
});
test('Email signup finishes even when optional measurement fails',async()=>{
  const b=browser('https://app.versaoprofessor.com/cadastro-professor.html',{fetch:async()=>ok(session())});
  const jobs=[];b.context.setTimeout=fn=>{jobs.push(fn);return 0;};
  b.context.VersaoCaptcha={mount(){},token:()=> 'fake',reset(){}};b.context.VersaoGoogle={mount(){}};
  b.context.VersaoFunnel={markSignupStarted(){},registration(){return Promise.reject(Error('analytics-only'));},track(){throw Error('analytics-only');}};
  const script=[...read('cadastro-professor.html').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean).join('\n');vm.runInContext(script,b.context);
  b.element('fullName').value='Synthetic Teacher';b.element('email').value='test@example.invalid';b.element('password').value='test-password';b.element('passwordConfirm').value='test-password';b.element('terms').checked=true;
  await b.element('teacherSignup').events.submit({preventDefault(){}});await new Promise(r=>setImmediate(r));
  assert.equal(b.element('submitBtn').textContent,'Conta criada');assert(jobs.length);jobs.forEach(fn=>fn());assert.equal(b.navigations[0],'https://app.versaoprofessor.com/?onboarding=1');
  assert.equal(b.requests.length,1);assert(b.requests[0].url.endsWith('/auth/v1/signup'));assert.equal(JSON.parse(b.requests[0].options.body).data.requested_role,'teacher');
});
test('Modified scripts and all inline signup scripts have valid syntax and no new script references',()=>{
  for(const p of ['funnel-analytics.js','google-auth.e12.js','api/openai-conversion.js'])new vm.Script(read(p),{filename:p});
  const html=read('cadastro-professor.html');for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
  const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);assert.deepEqual(scripts,['/google-auth.e12.js','/funnel-analytics.js','/captcha.e12.js']);assert(!html.includes('oaiq('));
});
test('HTTP smoke serves the complete modified HTML/JS and dry-run API',async()=>{
  const handler=server({env:{VERCEL_ENV:'preview'}});
  const app=http.createServer(async(req,res)=>{
    if(req.url==='/api/openai-conversion'){const r=await handler.send();res.writeHead(r.code,{'content-type':'application/json'});res.end(JSON.stringify(r.body));return;}
    const file=req.url.slice(1);if(!['cadastro-professor.html','google-auth.e12.js','funnel-analytics.js'].includes(file)){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'content-type':file.endsWith('.html')?'text/html':'application/javascript'});res.end(read(file));
  });
  await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
  try{for(const file of ['cadastro-professor.html','google-auth.e12.js','funnel-analytics.js']){const response=await fetch(base+'/'+file);assert.equal(response.status,200);assert.equal(await response.text(),read(file));}const dry=await fetch(base+'/api/openai-conversion');assert.equal((await dry.json()).reason,'test_or_preview');assert.equal(handler.calls.length,0);}finally{await new Promise(r=>app.close(r));}
});
