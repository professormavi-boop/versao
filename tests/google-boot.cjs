'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8'),boot=fs.readFileSync('boot.e12.js','utf8');
const tick=()=>new Promise(r=>setImmediate(r));
async function fixture({callback=false,pending=false,session=false,url='https://app.versaoprofessor.com/',edgeFail=false}={}){
 const dom=new JSDOM(html,{url,runScripts:'outside-only'}),w=dom.window;await new Promise(r=>w.document.addEventListener('DOMContentLoaded',r,{once:true}));
 const s={access_token:'a',refresh_token:'b',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'teacher',user_metadata:{full_name:'Nome Google'}}};
 let stored=session?s:null,calls=[],routes=[],clears=0,saves=0;
 w.S={session:null,profile:null,cache:{}};w.readSession=()=>stored;w.saveSession=x=>{stored=x;saves++};w.clearSession=()=>{stored=null;clears++};w.signIn=async(...args)=>{calls.push({password:args});return s};w.signInPin=async(...args)=>{calls.push({pin:args});return s};w.refreshSession=async()=>s;w.profile=async()=>{if(pending)throw Object.assign(Error('Incomplete'),{code:'GOOGLE_SIGNUP_REQUIRED'});w.S.profile={role:'teacher'};};w.buildNav=()=>{};w.navigate=x=>routes.push(x);w.invalidateNavigation=()=>{};
 w.VersaoCaptcha={mount(){},reset(){},token(){return 'captcha-ok'}};w.VersaoGoogle={mount(){},isCallback:()=>callback,receive:async()=>s};
 w.edge=async(slug,body)=>{calls.push({slug,body});if(edgeFail)throw Error('Falha de teste');pending=false;return{ok:true,created:true}};
 w.eval(boot);await tick();return{w,dom,calls,routes,get clears(){return clears},get saves(){return saves}};
}
(async()=>{
 let f=await fixture({callback:true});assert.deepEqual(f.routes,['home']);assert.equal(f.saves,1);f.dom.window.close();
 f=await fixture({callback:true,pending:true});assert.deepEqual(f.routes,['home']);assert.equal(f.calls.length,1);assert.deepEqual(JSON.parse(JSON.stringify(f.calls[0].body)),{action:'google_complete'});assert.equal(f.w.document.getElementById('googleSignupForm'),null);f.dom.window.close();
 f=await fixture({session:true,pending:true});assert.deepEqual(f.routes,['home']);assert.equal(f.calls.length,1);f.dom.window.close();
 f=await fixture({session:true,pending:true,edgeFail:true});assert.match(f.w.document.getElementById('loginStatus').textContent,/Falha/);assert.equal(f.routes.length,0);assert.equal(f.clears,1);f.dom.window.close();
 f=await fixture();f.w.document.getElementById('email').value='teacher@example.com';f.w.document.getElementById('password').value='untouched';await f.w.document.getElementById('loginForm').onsubmit({preventDefault(){}});assert.equal(f.calls[0].password[3],'captcha-ok');assert.deepEqual(f.routes,['home']);f.dom.window.close();
 f=await fixture({url:'https://app.versaoprofessor.com/?acesso=aluno'});assert(f.w.document.getElementById('googleAccess').classList.contains('hidden'));f.w.document.getElementById('classCode').value='abcdefabcdef';f.w.document.getElementById('studentPin').value='12345678';await f.w.document.getElementById('loginForm').onsubmit({preventDefault(){}});assert.equal(f.calls[0].pin[1],'12345678');f.dom.window.close();
 f=await fixture({url:'https://app.versaoprofessor.com/#type=recovery&access_token=secret'});assert.equal(f.w.document.getElementById('authTitle').textContent,'Definir nova senha');assert.equal(f.routes.length,0);assert.equal(f.w.location.hash,'');f.dom.window.close();
 const d=new JSDOM(html,{url:'https://app.versaoprofessor.com/',runScripts:'outside-only'}),w=d.window;
 let rows=[];w.fetch=async()=>({ok:true,json:async()=>rows});
 w.eval(fs.readFileSync('core.e12.js','utf8')+';window.testProfile=profile;window.testState=S;');
 w.testState.session={access_token:'fixture',refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'google-user',app_metadata:{providers:['google']}}};
 await assert.rejects(w.testProfile(),e=>e.code==='GOOGLE_SIGNUP_REQUIRED');
 rows=[{role:'pending',approval_status:'pending'}];await assert.rejects(w.testProfile(),e=>e.code==='GOOGLE_SIGNUP_REQUIRED');
 rows=[{role:'teacher',approval_status:'rejected'}];await assert.rejects(w.testProfile(),e=>!e.code&&/aprovado/.test(e.message));
 rows=[{role:'student',approval_status:'approved'}];assert.equal((await w.testProfile()).role,'student');
 w.testState.session.user.app_metadata={providers:['email']};rows=[];await assert.rejects(w.testProfile(),e=>!e.code);
 d.window.close();
 console.log('PASS boot: Google existing/new/reloaded accounts, automatic completion without fabricated consent, backend failure, password CAPTCHA, student PIN and password recovery.');
})().catch(e=>{console.error(e);process.exitCode=1});
