const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const s=fs.readFileSync('core.e12.js','utf8');const fn=s.slice(s.indexOf('function betaRequestAllowed('),s.indexOf('async function request('));
const ctx={BASE:'https://example.supabase.co',FormData};vm.createContext(ctx);vm.runInContext(fn,ctx);
for(const operation of ['edit','delete'])assert.equal(ctx.betaRequestAllowed(ctx.BASE+'/functions/v1/teacher-organization-api',{method:'POST',body:JSON.stringify({action:'live_manage',kind:'essay',operation,id:'fixture'})}),true);
assert.equal(ctx.betaRequestAllowed(ctx.BASE+'/functions/v1/teacher-organization-api',{method:'POST',body:JSON.stringify({action:'unknown'})}),false);
assert.equal(ctx.betaRequestAllowed(ctx.BASE+'/rest/v1/live_essays',{method:'DELETE'}),false);
assert.equal(ctx.betaRequestAllowed(ctx.BASE+'/functions/v1/teacher-organization-api',{method:'DELETE',body:JSON.stringify({action:'live_manage'})}),false);
console.log('PASS transport: explicit live management allowed; unknown actions/direct database writes remain blocked');
