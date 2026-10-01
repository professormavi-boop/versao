'use strict';
(function(){
 const SITE_KEY='0x4AAAAAAFKteAsbYgnNTRj0';
 const widgets=new Map();let loading=false;
 function status(entry,text){entry.message.textContent=text;}
 function render(entry){
  if(!window.turnstile||entry.widget!==null)return;
  try{
   entry.widget=window.turnstile.render(entry.target,{sitekey:SITE_KEY,theme:'light',size:'flexible',language:'pt-br',
    callback:token=>{entry.token=token;status(entry,'');},
    'expired-callback':()=>{entry.token='';status(entry,'A verificação expirou. Confirme novamente.');},
    'error-callback':()=>{entry.token='';status(entry,'Não foi possível carregar a verificação. Confira sua conexão e tente novamente.');return true;},
    'timeout-callback':()=>{entry.token='';status(entry,'A verificação demorou mais que o esperado. Tente novamente.');}
   });
  }catch(error){status(entry,'Não foi possível carregar a verificação. Atualize a página.');}
 }
 window.versaoCaptchaReady=()=>widgets.forEach(render);
 function mount(id){
  const container=document.getElementById(id);if(!container)return;
  if(!widgets.has(id)){
   const target=document.createElement('div'),message=document.createElement('p');
   message.setAttribute('role','status');message.style.cssText='font-size:12px;line-height:1.4;margin:6px 0;';
   container.append(target,message);
   const entry={target,message,widget:null,token:''};widgets.set(id,entry);
   status(entry,'Preparando verificação de segurança...');render(entry);
  }
  if(!loading&&!window.turnstile){
   loading=true;const script=document.createElement('script');
   script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=versaoCaptchaReady&render=explicit';script.async=true;script.defer=true;
   script.onerror=()=>widgets.forEach(entry=>status(entry,'Não foi possível carregar a verificação. Atualize a página para tentar novamente.'));
   document.head.appendChild(script);
  }
 }
 function token(id){mount(id);const value=widgets.get(id)?.token;if(!value)throw Error('Conclua a verificação de segurança para continuar.');return value;}
 function reset(id){const entry=widgets.get(id);if(!entry)return;entry.token='';if(entry.widget!==null&&window.turnstile)window.turnstile.reset(entry.widget);}
 window.VersaoCaptcha={mount,token,reset};
})();
