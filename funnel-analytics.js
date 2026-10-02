'use strict';
(function(){
  const STORAGE_KEY='versao-funnel-attribution-v1';
  const ATTRIBUTION_TTL_MS=30*24*60*60*1000;
  const ATTRIBUTION_KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','oppref'];
  const PROD_HOSTS=new Set(['versaoprofessor.com','www.versaoprofessor.com','app.versaoprofessor.com']);
  const SESSION_KEY='versao-e12-session-v1',TEST_KEY='versao-measurement-test-v1';
  const registrationRequests=new Map(),recorded=new Set();
  let remembered={},lastRegistration={status:'idle'};
  const ALLOWED_EVENTS=new Set(['landing_view','click_signup','signup_started','signup_complete']);

  function clean(value,max=120){
    if(value===undefined||value===null)return '';
    return String(value).replace(/[\r\n\t]/g,'').trim().slice(0,max);
  }

  function attributionMax(key){return key==='oppref'?512:120}

  function readCurrentAttribution(){
    const params=new URLSearchParams(location.search);
    const data={};
    for(const key of ATTRIBUTION_KEYS){
      const value=clean(params.get(key),attributionMax(key));
      if(value)data[key]=value;
    }
    return data;
  }

  function storageRead(key){
    for(const kind of ['localStorage','sessionStorage']){
      try{const value=JSON.parse(window[kind].getItem(key)||'null');if(value)return value;}catch(_error){}
    }
    return null;
  }

  function storageWrite(key,value){
    for(const kind of ['localStorage','sessionStorage']){
      try{window[kind].setItem(key,JSON.stringify(value));}catch(_error){}
    }
  }

  function readStoredAttribution(){
    const parsed=storageRead(STORAGE_KEY),age=Date.now()-Number(parsed?.saved_at);
    if(!parsed||!Number.isFinite(age)||age<0||age>ATTRIBUTION_TTL_MS)return {};
    const data={};
    for(const key of ATTRIBUTION_KEYS){
      const value=clean(parsed[key],attributionMax(key));if(value)data[key]=value;
    }
    return data;
  }

  function captureAttribution(input={}){
    const current={};
    for(const key of ATTRIBUTION_KEYS){
      const value=clean(input[key],attributionMax(key));if(value)current[key]=value;
    }
    const stored=Object.keys(remembered).length?remembered:readStoredAttribution();
    if(!Object.keys(current).length){remembered=stored;return {...stored};}
    // New campaign/click must not inherit the previous campaign's click identifier.
    const changed=['utm_source','utm_medium','utm_campaign','utm_content','oppref']
      .some(key=>current[key]&&stored[key]&&current[key]!==stored[key]);
    remembered={...(changed?{}:stored),...current};
    storageWrite(STORAGE_KEY,{...remembered,saved_at:Date.now()});
    return {...remembered};
  }

  function rememberAttribution(){return captureAttribution(readCurrentAttribution());}
  function attribution(){return captureAttribution(readCurrentAttribution());}

  function measurementSuppressed(){
    if(!PROD_HOSTS.has(location.hostname.toLowerCase()))return true;
    if(new URLSearchParams(location.search).get('versao_test')==='1'){
      try{sessionStorage.setItem(TEST_KEY,String(Date.now()));}catch(_error){}
      return true;
    }
    try{const value=sessionStorage.getItem(TEST_KEY),age=Date.now()-Number(value);return !!value&&age>=0&&age<ATTRIBUTION_TTL_MS;}catch(_error){return false;}
  }

  function currentSession(){
    try{return window.__VERSAO_E12__?.state?.session||JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch(_error){return null;}
  }

  async function registration(session=currentSession(),page='signup'){
    try{
      if(measurementSuppressed())return lastRegistration={status:'skipped',reason:'test_or_preview'};
      const id=session?.user?.id,token=session?.access_token,ref=attribution().oppref;
      if(!id||!token)return lastRegistration={status:'skipped',reason:'no_session'};
      if(!ref)return lastRegistration={status:'skipped',reason:'no_ad_reference'};
      const sentKey='versao-registration-sent:'+id;
      if(recorded.has(id)||storageRead(sentKey)?.accepted)return lastRegistration={status:'already_recorded'};
      if(registrationRequests.has(id))return registrationRequests.get(id);
      const pending=(async()=>{
        try{
          const response=await fetch('/api/openai-conversion',{
            method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
            body:JSON.stringify({profile_id:id,oppref:ref,page:['signup','google','confirmation'].includes(page)?page:'signup'}),
            keepalive:true,credentials:'same-origin'
          });
          const result=await response.json().catch(()=>({}));
          if(response.ok&&result.status==='accepted'){
            recorded.add(id);storageWrite(sentKey,{accepted:true});
            return lastRegistration={status:'accepted'};
          }
          return lastRegistration={status:response.ok?'skipped':'failed',reason:clean(result.reason||'unconfirmed',64)};
        }catch(_error){return lastRegistration={status:'failed',reason:'network'};}
        finally{registrationRequests.delete(id);}
      })();
      registrationRequests.set(id,pending);return pending;
    }catch(_error){return lastRegistration={status:'failed',reason:'unavailable'};}
  }

  function ensureVercelAnalytics(){
    if(measurementSuppressed())return;
    window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
    if(document.querySelector('script[data-versao-vercel-analytics]'))return;
    const script=document.createElement('script');
    script.defer=true;
    script.src='/_vercel/insights/script.js';
    script.dataset.versaoVercelAnalytics='1';
    document.head.appendChild(script);
  }

  function eventData(extra){
    const out={...attribution()};
    const safeExtra=extra&&typeof extra==='object'?extra:{};
    for(const [key,value] of Object.entries(safeExtra)){
      if(!/^[a-z0-9_]{1,40}$/i.test(key))continue;
      const cleaned=clean(value,key==='oppref'?512:120);
      if(cleaned)out[key]=cleaned;
    }
    return out;
  }

  function track(name,extra){
    if(!ALLOWED_EVENTS.has(name)||measurementSuppressed())return false;
    if(name==='signup_complete')void registration(currentSession(),extra?.page);
    const data=eventData(extra);
    try{window.va?.('event',{name,data})}catch(_error){}
    const body=JSON.stringify({event:name,path:clean(location.pathname,160),...data});
    try{
      if(navigator.sendBeacon){
        const blob=new Blob([body],{type:'application/json'});
        navigator.sendBeacon('/api/funnel-event',blob);
      }else{
        fetch('/api/funnel-event',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,credentials:'same-origin'}).catch(()=>{});
      }
    }catch(_error){}
    return true;
  }

  function withAttribution(url){
    try{
      const target=new URL(url,location.href);
      if(target.origin!==location.origin&&!PROD_HOSTS.has(target.hostname))return url;
      if(!['http:','https:'].includes(target.protocol)||target.username||target.password)return url;
      const data=attribution();
      if(measurementSuppressed())target.searchParams.set('versao_test','1');
      for(const key of ATTRIBUTION_KEYS){if(data[key]&&!target.searchParams.has(key))target.searchParams.set(key,data[key])}
      return target.toString();
    }catch(_error){return url}
  }

  function decorateSignupLinks(){
    const data=attribution();
    if(!Object.keys(data).length)return;
    document.querySelectorAll('a[href]').forEach(link=>{
      try{
        const target=new URL(link.href,location.href);
        const isSignup=target.searchParams.get('cadastro')==='1'||target.pathname.endsWith('/cadastro-professor.html');
        if(!isSignup)return;
        link.href=withAttribution(target.toString());
      }catch(_error){}
    });
  }

  function wireLanding(){
    const isLanding=location.pathname.endsWith('/landing.html')||(!location.hostname.toLowerCase().startsWith('app.')&&location.pathname==='/');
    if(!isLanding)return;
    decorateSignupLinks();
    track('landing_view',{page:'landing'});
    document.addEventListener('click',event=>{
      const link=event.target.closest?.('a[href]');
      if(!link)return;
      try{
        const target=new URL(link.href,location.href);
        const isSignup=target.searchParams.get('cadastro')==='1'||target.pathname.endsWith('/cadastro-professor.html');
        if(isSignup)track('click_signup',{page:'landing',cta:clean(link.textContent,80)});
      }catch(_error){}
    },{capture:true});
  }

  function markSignupStarted(form){
    if(!form)return;
    let sent=false;
    const mark=()=>{
      if(sent)return;
      sent=true;
      track('signup_started',{page:'signup'});
    };
    form.addEventListener('input',mark,{passive:true});
    form.addEventListener('change',mark,{passive:true});
  }

  rememberAttribution();
  ensureVercelAnalytics();
  window.VersaoFunnel={track,attribution,captureAttribution,withAttribution,decorateSignupLinks,markSignupStarted,registration,registrationStatus:()=>({...lastRegistration})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wireLanding,{once:true});
  else wireLanding();
})();
