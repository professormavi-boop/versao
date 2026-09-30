'use strict';
(function(){
  const STORAGE_KEY='versao-funnel-attribution-v1';
  const ATTRIBUTION_TTL_MS=30*24*60*60*1000;
  const ATTRIBUTION_KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','oppref'];
  const ALLOWED_EVENTS=new Set(['landing_view','click_signup','signup_started','signup_complete']);

  function clean(value,max=120){
    if(value===undefined||value===null)return '';
    return String(value).trim().slice(0,max);
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

  function readStoredAttribution(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!parsed||typeof parsed!=='object'||!parsed.saved_at)return {};
      if(Date.now()-Number(parsed.saved_at)>ATTRIBUTION_TTL_MS){
        localStorage.removeItem(STORAGE_KEY);
        return {};
      }
      const data={};
      for(const key of ATTRIBUTION_KEYS){
        const value=clean(parsed[key],attributionMax(key));
        if(value)data[key]=value;
      }
      return data;
    }catch(_error){return {}}
  }

  function rememberAttribution(){
    const current=readCurrentAttribution();
    if(!Object.keys(current).length)return readStoredAttribution();
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({...current,saved_at:Date.now()}))}catch(_error){}
    return current;
  }

  function attribution(){
    const current=readCurrentAttribution();
    return Object.keys(current).length?current:readStoredAttribution();
  }

  function ensureVercelAnalytics(){
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
    if(!ALLOWED_EVENTS.has(name))return false;
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
      const data=attribution();
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
        for(const key of ATTRIBUTION_KEYS){if(data[key]&&!target.searchParams.has(key))target.searchParams.set(key,data[key])}
        link.href=target.toString();
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
  window.VersaoFunnel={track,attribution,withAttribution,decorateSignupLinks,markSignupStarted};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wireLanding,{once:true});
  else wireLanding();
})();
