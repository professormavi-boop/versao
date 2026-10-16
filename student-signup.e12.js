'use strict';
(async function(){
 const BASE='https://huccxcpwoydwuisrmboc.supabase.co',KEY='sb_publishable_KzojVBVP3GvVbSgO_w0mUA_-s8r7VdR';
 const $=id=>document.getElementById(id),form=$('studentSignup'),button=$('submitBtn');
 let session=null;
 const registrationEnabled=form.dataset.registrationEnabled==='true';
 if(!registrationEnabled){
  for(const input of form.querySelectorAll('input,button'))input.disabled=true;
  return;
 }
 $('signupAvailability')?.setAttribute('hidden','');
 const show=(text,type='')=>{$('status').textContent=text;$('status').className='status '+type;};
 async function request(path,body,token){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(BASE+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:controller.signal});
   const raw=await response.json().catch(()=>null),data=raw&&typeof raw==='object'?raw:{};
   if(!response.ok){
    const code=typeof data.error_code==='string'?data.error_code:typeof data.code==='string'?data.code:'';
    const messages={email_not_confirmed:'Não foi possível liberar o acesso direto. Procure o suporte.',user_already_exists:'Este e-mail já está cadastrado. Clique em Já tenho conta para entrar.',email_exists:'Este e-mail já está cadastrado. Clique em Já tenho conta para entrar.',captcha_failed:'Refaça a verificação de segurança.',over_request_rate_limit:'Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.',over_email_send_rate_limit:'Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.',weak_password:'Escolha uma senha mais forte, com pelo menos 8 caracteres.',email_address_invalid:'Confira o endereço de e-mail.'};
    const message=messages[code]||(response.status===429?'Muitas tentativas em pouco tempo. Aguarde um momento e tente novamente.':null)||(path.startsWith('/functions/')&&typeof data.error==='string'?data.error:null)||(response.status>=500?'O serviço está indisponível no momento. Tente novamente.':'Não foi possível continuar. Confira os dados e tente novamente.');
    throw Object.assign(Error(message),{code,status:response.status,path});
   }
   return data;
  }finally{clearTimeout(timer);}
 }
 function sessionFields(){
  for(const id of ['email','password','passwordConfirm']){$(id).required=!session;$(id).closest('label').hidden=!!session;}
  $('googleSignup').closest('.google-access').hidden=!!session;
  $('signupCaptcha').hidden=!!session;
  button.textContent=session?'Concluir cadastro':'Criar minha conta';
 }
 const validSession=data=>typeof data?.access_token==='string'&&!!data.access_token&&typeof data.refresh_token==='string'&&!!data.refresh_token&&typeof data.user?.id==='string'&&!!data.user.id;
 window.VersaoCaptcha?.mount('signupCaptcha');
 window.VersaoGoogle?.mount('googleSignup','status','student');
 form.onsubmit=async event=>{
  event.preventDefault();if(button.disabled)return;
  const name=$('fullName').value.trim();
  if(name.length<2||name.length>160||!$('terms').checked){show('Informe seu nome e aceite os termos.','error');return;}
  if(!session&&($('password').value.length<8||$('password').value!==$('passwordConfirm').value)){show('Confira a senha e sua confirmação (mínimo de 8 caracteres).','error');return;}
  button.disabled=true;show('Preparando sua conta…');
  try{
   if(!session){
    const captcha=window.VersaoCaptcha.token('signupCaptcha'),now=new Date().toISOString();
    const data=await request('/auth/v1/signup',{
     email:$('email').value.trim().toLowerCase(),password:$('password').value,gotrue_meta_security:{captcha_token:captcha},
     data:{full_name:name,requested_role:'student',signup_source:'student_self_service',legal_version:'2026-09-28',terms_accepted_at:now,privacy_accepted_at:now}
    });
    if(!validSession(data)){show('Não foi possível abrir sua sessão automaticamente. Clique em Já tenho conta para entrar e concluir seu cadastro.','error');return;}
    session={access_token:data.access_token,refresh_token:data.refresh_token,user:data.user,expires_at:Math.floor(Date.now()/1000)+(Number(data.expires_in)||3600)};
    sessionFields();
   }
   const completed=await request('/functions/v1/teacher-organization-api',{action:'student_complete',full_name:name,legal_version:'2026-09-28',accept_terms:true},session.access_token);
   if(completed.ok!==true||completed.pending!==false)throw Object.assign(Error(typeof completed.error==='string'?completed.error:'Não foi possível confirmar a conclusão do cadastro. Clique em Concluir cadastro para tentar novamente.'),{path:'/functions/v1/teacher-organization-api',status:200,code:'incomplete_registration'});
   try{localStorage.setItem('versao-e12-session-v1',JSON.stringify(session));}
   catch{show('Conta pronta. Entre pela página inicial com seu e-mail e senha.','ok');return;}
   location.replace('/?student_onboarding=1');
  }catch(error){
   if(error.path?.startsWith('/functions/')&&error.status===401){session=null;sessionFields();show('Sua sessão expirou. Clique em Já tenho conta para entrar e concluir seu cadastro.','error');}
   else show(error.name==='AbortError'?'A conexão demorou. Tente novamente.':error.message||'Não foi possível continuar.','error');
  }
  finally{button.disabled=false;window.VersaoCaptcha?.reset('signupCaptcha');}
 };
 if(window.VersaoGoogle?.isCallback()){
  button.disabled=true;
  try{const received=await window.VersaoGoogle.receive();if(!validSession(received))throw Error('O Google não retornou uma sessão válida. Tente novamente.');session=received;$('fullName').value=session.user.user_metadata?.full_name||session.user.user_metadata?.name||'';sessionFields();show('Confira seu nome e aceite os termos para concluir sua conta de aluno.');}
  catch(error){show(error.message,'error');}
  finally{button.disabled=false;}
 }
})();
