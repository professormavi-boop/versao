const fs=require('fs');
const assert=require('assert');

const read=name=>fs.readFileSync(name,'utf8');
const funnel=read('funnel-analytics.js');
const api=read('api/funnel-event.js');
const landing=read('landing.html');
const index=read('index.html');
const signup=read('cadastro-professor.html');
const confirmation=read('confirmacao-professor.html');

for(const event of ['landing_view','click_signup','signup_started','signup_complete']){
  assert(funnel.includes(`'${event}'`),`evento ausente no cliente: ${event}`);
  assert(api.includes(`'${event}'`),`evento ausente na API: ${event}`);
}

assert(landing.includes('/funnel-analytics.js?v=20260930-ads-v1'),'landing sem analytics');
assert(index.includes('/funnel-analytics.js?v=20260930-ads-v1'),'app sem analytics antes do redirecionamento');
assert(signup.includes('markSignupStarted(form)'),'cadastro sem signup_started');
assert(signup.includes('withAttribution(rawCallback)'),'callback de confirmação não preserva UTM');
assert(confirmation.includes("track('signup_complete'"),'confirmação sem signup_complete');
assert(funnel.includes("target.searchParams.set(key,data[key])"),'links de cadastro não preservam UTM');
assert(funnel.includes("navigator.sendBeacon('/api/funnel-event'"),'eventos não usam beacon');
assert(api.includes("SAFE_KEYS=new Set(['utm_source'"),'API sem allowlist de campos');
assert(!api.includes('body.email'),'API não deve ler e-mail');
assert(!api.includes('body.password'),'API não deve ler senha');

new Function(funnel);
new Function(api.replace("module.exports=async function handler(req,res){","async function handler(req,res){"));

console.log('funnel-analytics: ok');
