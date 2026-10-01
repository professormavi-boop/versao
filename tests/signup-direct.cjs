'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('cadastro-professor.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).join('\n');
new vm.Script(script);
async function run({response,ok=true,mismatch=false,terms=true,storageFails=false,captcha=true}){
 const nodes={};let submit,stored,redirect,requests=0;
 for(const id of ['teacherSignup','submitBtn','status','fullName','email','password','passwordConfirm','terms'])nodes[id]={value:'',checked:terms,disabled:false,addEventListener:(_,fn)=>submit=fn,reset:()=>{}};
 Object.assign(nodes.fullName,{value:'Professora Teste'});nodes.email.value=' Teacher@Example.com ';nodes.password.value='password-123';nodes.passwordConfirm.value=mismatch?'other':nodes.password.value;
 const context={document:{getElementById:id=>nodes[id]},window:{VersaoCaptcha:{mount(){},reset(){},token(){if(!captcha)throw Error("Conclua a verificação");return "captcha-test";}}},localStorage:{setItem:(k,v)=>{if(storageFails)throw Error('disabled');stored={key:k,value:JSON.parse(v)};}},location:{replace:url=>redirect=url},setTimeout:fn=>fn(),fetch:async()=>{requests++;return{ok,json:async()=>response};},console};
 vm.runInNewContext(script,context);await submit({preventDefault(){}});
 return {nodes,stored,redirect,requests};
}
(async()=>{
 const response={access_token:'access',refresh_token:'refresh',expires_in:3600,user:{id:'test-id',email:'teacher@example.com'}};
 let r=await run({response});assert.equal(r.redirect,'/?onboarding=1');assert.equal(r.stored.key,'versao-e12-session-v1');assert.equal(r.stored.value.user.id,'test-id');
 r=await run({response,mismatch:true});assert.equal(r.requests,0);assert(!r.stored);
 r=await run({response,terms:false});assert.equal(r.requests,0);
 r=await run({response:{code:'user_already_exists'},ok:false});assert(!r.stored);assert.match(r.nodes.status.textContent,/Já existe/);assert.equal(r.nodes.submitBtn.disabled,false);
 r=await run({response:{id:'user-without-session'}});assert(!r.redirect);assert.match(r.nodes.status.textContent,/acesso imediato não está disponível/);
 r=await run({response,storageFails:true});assert(!r.redirect);assert.match(r.nodes.status.textContent,/página de entrada/);
 r=await run({response,captcha:false});assert.equal(r.requests,0);assert(!r.stored);
 console.log('7 cenários de cadastro direto aprovados (serviço simulado).');
})().catch(e=>{console.error(e);process.exit(1)});
