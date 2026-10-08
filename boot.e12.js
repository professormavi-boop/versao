'use strict';
(function(){
  const element=id=>document.getElementById(id);
  let attempt=0,timer=null,ready=false,pinMode=false;

  function coreAvailable(){
    return typeof S!=='undefined'
      &&typeof readSession==='function'
      &&typeof clearSession==='function'
      &&typeof signIn==='function'
      &&typeof refreshSession==='function'
      &&typeof profile==='function'
      &&typeof buildNav==='function'
      &&typeof navigate==='function'
      &&typeof invalidateNavigation==='function';
  }

  function loginScreen(message='',enabled=true){
    element('boot')?.classList.add('hidden');
    element('shell')?.classList.add('hidden');
    element('auth')?.classList.remove('hidden');
    const status=element('loginStatus'),button=element('loginBtn');
    if(!pinMode)window.VersaoCaptcha?.mount('loginCaptcha');
    if(status)status.textContent=message;
    if(button){button.disabled=!enabled;button.textContent='Entrar';}
  }

  function resetAppState(){
    if(typeof clearSession==='function')clearSession();
    if(typeof invalidateNavigation==='function')invalidateNavigation();
    if(typeof S!=='undefined'){
      S.session=null;S.profile=null;S.cache={};S.student=null;S.route=null;
    }
  }

  function fail(message){
    attempt++;clearTimeout(timer);resetAppState();accountView('login');loginScreen(message,coreAvailable());
  }

  function begin(){
    const token=++attempt;clearTimeout(timer);
    timer=setTimeout(()=>{if(token===attempt)fail('O acesso demorou a responder. Tente entrar novamente.');},25000);
    return token;
  }

  function start(token){
    if(token!==attempt)return;
    buildNav();
    element('auth')?.classList.add('hidden');
    element('boot')?.classList.add('hidden');
    element('shell')?.classList.remove('hidden');
    clearTimeout(timer);ready=true;
    navigate(S.profile.role==='student'?'student-home':'home');
  }

  async function loadProfile(token){
    try{await profile();return token===attempt;}
    catch(error){
      if(token===attempt&&error.code==='GOOGLE_SIGNUP_REQUIRED'&&window.VersaoGoogle){showGoogleSignup();return false;}
      throw error;
    }
  }

  function showGoogleSignup(){
    clearTimeout(timer);loginScreen('',true);accountView('google');
    element('authTitle').textContent='Comece no VERSÃO';
    element('accountForm').classList.add('hidden');
    element('googleSignupForm').classList.remove('hidden');
    element('googleName').value=S.session?.user?.user_metadata?.full_name||S.session?.user?.user_metadata?.name||'';
    element('googleTerms').checked=false;element('googleStatus').textContent='';
  }

  function wireGoogle(){
    window.VersaoGoogle?.mount('googleLogin','loginStatus');
    const form=element('googleSignupForm');if(!form)return;
    element('googleCancel').onclick=()=>{attempt++;resetAppState();accountView('login');loginScreen('',true);};
    form.onsubmit=async event=>{
      event.preventDefault();const button=element('googleComplete');if(button.disabled)return;
      const name=element('googleName').value.trim();
      if(name.length<2||name.length>160||!element('googleTerms').checked){element('googleStatus').textContent='Confira seu nome e aceite os termos para continuar.';return;}
      const token=begin();button.disabled=true;element('googleStatus').textContent='Preparando sua conta…';
      try{
        const result=await edge('teacher-organization-api',{action:'google_complete',full_name:name,accept_terms:true,legal_version:'2026-09-28'});
        if(token!==attempt)return;
        await profile();if(token!==attempt)return;
        if(result.created)window.VersaoFunnel?.track('signup_complete',{page:'google'});
        start(token);
      }catch(error){if(token===attempt)element('googleStatus').textContent=error.message||'Não foi possível concluir seu cadastro. Tente novamente.';}
      finally{if(token===attempt)clearTimeout(timer);button.disabled=false;}
    };
  }

  async function enter(event){
    event.preventDefault();
    const button=element('loginBtn');
    if(!button||button.disabled)return;
    ready=false;const token=begin();
    button.disabled=true;button.textContent='Entrando...';
    element('loginStatus').textContent='';
    try{
      if(!coreAvailable())throw Error('A aplicação ainda não terminou de carregar. Atualize a página e tente novamente.');
      let session;
      if(pinMode){
        if(typeof signInPin!=='function')throw Error('O acesso do aluno não terminou de carregar. Atualize a página.');
        session=await signInPin(element('classCode').value,element('studentPin').value);
      }else{
        const captchaToken=window.VersaoCaptcha.token('loginCaptcha');
        session=await signIn(element('email').value.trim(),element('password').value,true,captchaToken);
      }
      if(token!==attempt)return;
      S.session=session;
      if(!await loadProfile(token))return;
      if(token!==attempt)return;
      start(token);
    }catch(error){
      if(token===attempt)fail(error.message||'Não foi possível entrar.');
    }finally{
      if(!pinMode)window.VersaoCaptcha?.reset('loginCaptcha');
      if(token===attempt){clearTimeout(timer);button.disabled=false;button.textContent='Entrar';}
    }
  }

  let accountMode='login',accountVersion=0,recoveryToken=null;
  const emailSendAfter=new Map();
  function accountView(mode,message=''){
    if(mode==='register'){location.assign('/cadastro-professor.html');return;}
    accountMode=mode;accountVersion++;
    element('googleSignupForm')?.classList.add('hidden');
    element('googleAccess')?.classList.toggle('hidden',mode!=='login'||pinMode);
    element('loginChoice')?.classList.toggle('hidden',mode!=='login');
    element('accountCaptcha')?.classList.toggle('hidden',mode!=='forgot');
    if(mode==='forgot')window.VersaoCaptcha?.mount('accountCaptcha');
    if(mode!=='reset')recoveryToken=null;
    const form=element('accountForm');if(!form)return;
    element('loginForm').classList.toggle('hidden',mode!=='login');
    element('authLinks').classList.toggle('hidden',mode!=='login'||pinMode);
    form.classList.toggle('hidden',mode==='login');
    element('authTitle').textContent={login:'Entrar',register:'Quero me cadastrar',forgot:'Recuperar senha',reset:'Definir nova senha',google:'Comece no VERSÃO'}[mode];
    element('nameField').classList.toggle('hidden',mode!=='register');
    element('registerName').required=mode==='register';
    element('accountEmailField').classList.toggle('hidden',mode==='reset');
    element('accountEmail').required=mode!=='reset';
    for(const id of ['newPassword','confirmPassword']){
      element(id).value='';
      element(id).required=mode==='register'||mode==='reset';
      element(id+'Field').classList.toggle('hidden',!element(id).required);
    }
    element('accountSubmit').disabled=false;
    element('accountSubmit').textContent={register:'Solicitar cadastro',forgot:'Enviar recuperação',reset:'Salvar nova senha'}[mode]||'Continuar';
    element('accountStatus').textContent=message;
  }

  function wireAccount(){
    if(!element('registerLink'))return;
    element('registerLink').onclick=()=>location.assign(element('loginAccessType').value==='independent'?'/cadastro-aluno.html':'/cadastro-professor.html');
    element('forgotLink').onclick=()=>{accountView('forgot');element('accountEmail').value=element('email').value;};
    element('backToLogin').onclick=()=>accountView('login');
    element('accountForm').onsubmit=async event=>{
      event.preventDefault();
      const button=element('accountSubmit');if(button.disabled)return;
      const mode=accountMode,version=accountVersion,email=element('accountEmail').value.trim(),password=element('newPassword').value;
      if(mode==='register'||mode==='reset'){
        if(password.length<8||password!==element('confirmPassword').value){
          element('accountStatus').textContent='Use pelo menos 8 caracteres e confirme a mesma senha.';return;
        }
      }
      if(typeof accountRequest!=='function'){
        element('accountStatus').textContent='A área de conta ainda não terminou de carregar. Atualize a página.';return;
      }
      const sendKey=mode+':'+email.toLowerCase();
      const remaining=Math.ceil(((emailSendAfter.get(sendKey)||0)-Date.now())/1000);
      if(remaining>0){element('accountStatus').textContent='Aguarde '+remaining+' segundos para reenviar.';return;}
      button.disabled=true;element('accountStatus').textContent='Enviando...';
      try{
        const callback=encodeURIComponent('https://app.versaoprofessor.com/');
        if(mode==='forgot'){
          const captchaToken=window.VersaoCaptcha.token('accountCaptcha');
          await accountRequest('recover?redirect_to='+callback,{email,gotrue_meta_security:{captcha_token:captchaToken}});
          if(version!==accountVersion)return;
          emailSendAfter.set(sendKey,Date.now()+60000);
          button.textContent='Reenviar e-mail de recuperação';
          element('accountStatus').textContent='Se houver uma conta para esse e-mail, você receberá as instruções de recuperação. Confira também o spam. Você pode reenviar após 60 segundos.';
        }else if(mode==='reset'){
          if(!recoveryToken)throw Error('Link inválido. Solicite outra recuperação.');
          await accountRequest('user',{password},recoveryToken);
          if(version!==accountVersion)return;
          clearSession();S.session=null;accountView('login');
          element('loginStatus').textContent='Senha atualizada. Entre com a nova senha.';
        }
        element('newPassword').value='';element('confirmPassword').value='';
      }catch(error){
        if(version===accountVersion)element('accountStatus').textContent=error.message||'Não foi possível concluir.';
      }finally{
        if(mode==='forgot')window.VersaoCaptcha?.reset('accountCaptcha');
        if(version===accountVersion)button.disabled=false;
      }
    };
  }

  function receiveAccountLink(){
    if(typeof location==='undefined'||!location.hash)return false;
    const params=new URLSearchParams(location.hash.slice(1));
    if(!params.has('access_token')&&!params.has('error_description'))return false;
    history.replaceState(null,'',location.pathname+location.search);
    resetAppState();loginScreen('',true);
    if(params.has('error_description')){
      accountView('forgot','O link expirou ou é inválido. Solicite uma nova recuperação.');return true;
    }
    if(params.get('type')==='recovery'){
      accountView('reset');recoveryToken=params.get('access_token');
    }else{
      accountView('login');element('loginStatus').textContent='E-mail confirmado. Entre com seu e-mail e senha.';
    }
    return true;
  }

  function chooseLogin(student,independent=false){
    pinMode=student;accountView('login');
    element('loginCaptcha')?.classList.toggle('hidden',student);
    if(!student)window.VersaoCaptcha?.mount('loginCaptcha');
    for(const id of ['emailField','passwordField'])element(id).classList.toggle('hidden',student);
    for(const id of ['classCodeField','studentPinField','pinHelp'])element(id).classList.toggle('hidden',!student);
    element('email').required=!student;element('password').required=!student;
    element('classCode').required=student;element('studentPin').required=student;
    element('authLinks').classList.toggle('hidden',student);
    element('loginAccessType').value=student?'student':independent?'independent':'teacher';
    element('registerLink').textContent=independent?'Quero criar minha conta':'Criar conta de professor';
    element('password').value='';element('studentPin').value='';element('loginStatus').textContent='';
  }

  async function initialize(){
    if(!coreAvailable()){
      loginScreen('Não foi possível carregar os arquivos essenciais do acesso. Atualize a página para tentar novamente.',false);
      return;
    }

    wireAccount();wireGoogle();
    element('loginAccessType').onchange=()=>chooseLogin(element('loginAccessType').value==='student',element('loginAccessType').value==='independent');
    const query=new URLSearchParams(location.search);
    if(query.get('acesso')==='aluno')chooseLogin(true);
    else if(query.get('acesso')==='email')chooseLogin(false,true);
    const wantsRegister=query.get('cadastro')==='1';
    element('loginForm').onsubmit=enter;
    element('logoutBtn').onclick=()=>{ready=false;resetAppState();loginScreen('',true);element('password').value='';element('studentPin').value='';};
    element('menuBtn').onclick=()=>typeof openDrawer==='function'&&openDrawer();
    element('drawerShade').onclick=()=>typeof closeDrawer==='function'&&closeDrawer();

    if(receiveAccountLink())return;
    const token=begin();
    try{
      if(query.get('google')==='1'&&window.VersaoGoogle){
        history.replaceState(null,'',location.pathname);loginScreen('Conectando com Google…',true);
        await window.VersaoGoogle.start();clearTimeout(timer);return;
      }
      let session;
      if(window.VersaoGoogle?.isCallback()){
        session=await window.VersaoGoogle.receive();if(token!==attempt)return;saveSession(session);
      }else session=readSession();
      if(wantsRegister&&!session){clearTimeout(timer);location.replace('/cadastro-professor.html');return;}
      if(session&&(!session.expires_at||session.expires_at<Math.floor(Date.now()/1000)+60))session=await refreshSession(session);
      if(token!==attempt)return;
      if(!session){clearTimeout(timer);loginScreen('',true);return;}
      S.session=session;if(!await loadProfile(token))return;if(token!==attempt)return;start(token);
    }catch(error){
      if(token===attempt)fail(error.message||'Não foi possível recuperar a sessão. Entre novamente.');
    }
  }

  window.addEventListener('error',event=>{
    if(ready)return;
    if(event.target?.tagName==='SCRIPT'){
      const src=String(event.target.src||'');
      if(src.includes('/core.e12.js')||src.includes('/boot.e12.js')){
        loginScreen('Não foi possível carregar os arquivos essenciais do acesso. Atualize a página para tentar novamente.',false);
      }
    }
  },true);

  if(document.readyState!=='loading')initialize();
  else document.addEventListener('DOMContentLoaded',initialize,{once:true});
})();
// deploy: loginfix2-20260930
