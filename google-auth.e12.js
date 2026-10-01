'use strict';
(function(){
  const BASE='https://huccxcpwoydwuisrmboc.supabase.co';
  const KEY='sb_publishable_KzojVBVP3GvVbSgO_w0mUA_-s8r7VdR';
  const STORE='versao-google-pkce-v1',APP='https://app.versaoprofessor.com';
  const callbackParams=new URLSearchParams(location.search),callbackHash=new URLSearchParams(location.hash.slice(1));
  const callback=callbackParams.get('google_callback')==='1';
  if(callback)history.replaceState(null,'',location.pathname);
  let availability=null,starting=false,exchange=null;
  async function api(path,body){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(BASE+'/auth/v1/'+path,{method:body?'POST':'GET',headers:{apikey:KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',signal:controller.signal});
      const data=await response.json();
      if(!response.ok)throw Error('Não foi possível concluir o acesso com Google. Tente novamente.');
      return data;
    }finally{clearTimeout(timer);}
  }
  function enabled(){
    if(!availability)availability=api('settings').then(d=>d.external?.google===true).catch(()=>false);
    return availability;
  }
  const encode=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  function removeTransaction(){try{sessionStorage.removeItem(STORE);}catch{}}
  function appOrigin(){return ['versaoprofessor.com','www.versaoprofessor.com'].includes(location.hostname)?APP:location.origin;}
  async function start(audience='teacher'){
    if(starting)return;
    starting=true;
    try{
      if(!await enabled())throw Error('O acesso com Google ainda não está disponível. Você pode entrar com e-mail e senha.');
      // PKCE must start and finish on the same origin and tab.
      if(appOrigin()!==location.origin){location.assign(audience==='student'?APP+'/cadastro-aluno.html':APP+'/?google=1');return;}
      if(!crypto?.subtle)throw Error('Abra o VERSÃO em uma conexão segura para continuar com Google.');
      const verifier=encode(crypto.getRandomValues(new Uint8Array(32)));
      const challenge=encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
      const pending={verifier,createdAt:Date.now(),origin:location.origin};
      try{sessionStorage.setItem(STORE,JSON.stringify(pending));if(sessionStorage.getItem(STORE)!==JSON.stringify(pending))throw Error();}
      catch{throw Error('Permita o armazenamento deste site no navegador para continuar com Google.');}
      const url=new URL(BASE+'/auth/v1/authorize');
      const destination=audience==='student'?'/cadastro-aluno.html':'/index.html';
      url.search=new URLSearchParams({provider:'google',redirect_to:location.origin+destination+'?google_callback=1',code_challenge:challenge,code_challenge_method:'s256',scopes:'email profile',prompt:'select_account'}).toString();
      location.assign(url.href);
    }catch(error){starting=false;removeTransaction();throw error;}
  }
  function isCallback(){return callback;}
  function receive(){
    if(!isCallback())return Promise.resolve(null);
    if(exchange)return exchange;
    exchange=(async()=>{
      const params=callbackParams,hash=callbackHash;
      let pending;try{pending=JSON.parse(sessionStorage.getItem(STORE)||'null');}catch{}
      removeTransaction();
      if(params.has('error')||hash.has('error'))throw Error('O acesso com Google foi cancelado ou não foi autorizado. Tente novamente.');
      if(!pending||pending.origin!==location.origin||!Number.isFinite(pending.createdAt)||Date.now()-pending.createdAt>600000||Date.now()<pending.createdAt||!/^[A-Za-z0-9_-]{43}$/.test(pending.verifier||'')||!params.get('code'))throw Error('Este acesso com Google expirou. Toque em Continuar com Google para tentar novamente.');
      const d=await api('token?grant_type=pkce',{auth_code:params.get('code'),code_verifier:pending.verifier});
      if(typeof d.access_token!=='string'||!d.access_token||typeof d.refresh_token!=='string'||!d.refresh_token||!d.user?.id)throw Error('O Google não retornou uma sessão válida. Tente novamente.');
      // Never store Google's provider access/refresh tokens: this app only needs identity.
      return {access_token:d.access_token,refresh_token:d.refresh_token,user:d.user,expires_at:Math.floor(Date.now()/1000)+(Number(d.expires_in)||3600)};
    })();
    return exchange;
  }
  async function mount(buttonId,statusId,audience='teacher'){
    const button=document.getElementById(buttonId);if(!button)return;
    button.hidden=true;
    if(!await enabled())return;
    button.hidden=false;
    button.onclick=async()=>{
      if(button.disabled)return;
      button.disabled=true;
      const status=document.getElementById(statusId);if(status)status.textContent='Conectando com Google…';
      try{await start(audience);}catch(error){if(status)status.textContent=error.message||'Não foi possível conectar com Google.';button.disabled=false;}
    };
  }
  window.VersaoGoogle={enabled,start,isCallback,receive,mount};
})();
