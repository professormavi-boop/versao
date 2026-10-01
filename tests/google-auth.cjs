'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{webcrypto}=require('crypto');
const source=fs.readFileSync('google-auth.e12.js','utf8');
const key='versao-google-pkce-v1',origin='https://app.versaoprofessor.com';
function fixture({url=origin+'/',enabled=true,pending=null,storageFails=false,response=null}={}){
 const u=new URL(url),stored=new Map(pending?[[key,JSON.stringify(pending)]]:[]),requests=[],redirects=[],history=[];
 const context={URL,URLSearchParams,TextEncoder,Uint8Array,Date,JSON,Number,Promise,Error,AbortController,setTimeout,clearTimeout,crypto:webcrypto,btoa:s=>Buffer.from(s,'binary').toString('base64'),window:{},location:{origin:u.origin,hostname:u.hostname,pathname:u.pathname,search:u.search,hash:u.hash,assign:x=>redirects.push(x)},history:{replaceState:(_,__,x)=>history.push(x)},sessionStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>{if(storageFails)throw Error();stored.set(k,v)},removeItem:k=>stored.delete(k)},document:{getElementById:()=>null},fetch:async(url,options)=>{requests.push({url,options});return{ok:true,json:async()=>url.endsWith('settings')?{external:{google:enabled}}:response}}};
 vm.runInNewContext(source,context);return{api:context.window.VersaoGoogle,stored,requests,redirects,history};
}
(async()=>{
 let f=fixture();await f.api.start();let url=new URL(f.redirects[0]),pending=JSON.parse(f.stored.get(key));
 assert.equal(url.hostname,'huccxcpwoydwuisrmboc.supabase.co');assert.equal(url.searchParams.get('provider'),'google');assert.equal(url.searchParams.get('code_challenge_method'),'s256');assert.equal(url.searchParams.get('redirect_to'),origin+'/index.html?google_callback=1');assert.equal(url.searchParams.get('prompt'),'select_account');assert.equal(pending.verifier.length,43);assert.notEqual(url.searchParams.get('code_challenge'),pending.verifier);assert.equal(url.searchParams.get('code_challenge'),Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(pending.verifier))).toString('base64url'));
 await f.api.start();assert.equal(f.redirects.length,1);
 f=fixture({enabled:false});await assert.rejects(f.api.start(),/ainda não/);assert.equal(f.redirects.length,0);
 f=fixture({storageFails:true});await assert.rejects(f.api.start(),/armazenamento/);assert.equal(f.redirects.length,0);
 f=fixture({url:'https://versaoprofessor.com/cadastro-professor.html'});await f.api.start();assert.equal(f.redirects[0],origin+'/?google=1');assert.equal(f.stored.size,0);
 const response={access_token:'session',refresh_token:'refresh',expires_in:3600,user:{id:'id'},provider_token:'not-for-storage'};
 f=fixture({url:origin+'/index.html?google_callback=1&code=one-time',pending,response});assert.deepEqual(f.history,['/index.html']);assert.equal(f.requests.length,0);assert.equal(f.api.isCallback(),true);
 const [a,b]=await Promise.all([f.api.receive(),f.api.receive()]);assert.equal(a,b);assert.equal(a.user.id,'id');assert(!('provider_token' in a));assert.equal(f.requests.length,1);assert.equal(f.stored.size,0);assert.deepEqual(JSON.parse(f.requests[0].options.body),{auth_code:'one-time',code_verifier:pending.verifier});
 for(const p of [null,{...pending,createdAt:Date.now()-600001},{...pending,origin:'https://wrong.test'},{...pending,verifier:'bad'},{...pending,createdAt:Date.now()+5000}]){f=fixture({url:origin+'/index.html?google_callback=1&code=x',pending:p,response});await assert.rejects(f.api.receive(),/expirou/);assert.equal(f.requests.length,0);assert.equal(f.stored.size,0);}
 f=fixture({url:origin+'/index.html?google_callback=1#error=access_denied',pending,response});await assert.rejects(f.api.receive(),/cancelado/);assert.equal(f.requests.length,0);
 f=fixture({url:origin+'/index.html?google_callback=1&code=x',pending,response:{user:{id:'x'}}});await assert.rejects(f.api.receive(),/sessão válida/);
 f=fixture({url:origin+'/#access_token=recovery&type=recovery'});assert.equal(f.api.isCallback(),false);assert.equal(await f.api.receive(),null);assert.equal(f.history.length,0);
 console.log('PASS Google: PKCE S256, single exchange, expiration, origin, cancel, storage, provider disabled, landing→app and recovery isolation.');
})().catch(e=>{console.error(e);process.exitCode=1});
