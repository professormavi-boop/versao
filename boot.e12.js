'use strict';
(function(){
  const element=id=>document.getElementById(id);
  let attempt=0, timer=null, ready=false, scriptsFailed=false, pinMode=false;
  function available(){
    return typeof S!=='undefined'&&typeof readSession==='function'&&typeof clearSession==='function'
      &&typeof signIn==='function'&&typeof refreshSession==='function'&&typeof profile==='function'
      &&typeof buildNav==='function'&&typeof navigate==='function'&&typeof invalidateNavigation==='function'
      &&typeof renderHome==='function'&&typeof renderProposals==='function'&&typeof renderLive==='function'
      &&typeof renderCorrection==='function'&&typeof openEssay==='function'&&typeof renderRanking==='function'
      &&typeof renderManagement==='function'&&typeof renderStudentHome==='function'
      &&typeof renderStudentProposals==='function'&&typeof renderStudentEssays==='function'
      &&typeof renderStudentEvolution==='function'&&typeof renderStudentAccount==='function';
  }
  function loginScreen(message,enabled){
    element('boot')?.classList.add('hidden');
    element('shell')?.classList.add('hidden');
    element('auth')?.classList.remove('hidden');
    const status=element('loginStatus'),button=element('loginBtn');
    if(status)status.textContent=message||'';
    if(button){button.disabled=!enabled;button.textContent='Entrar'}
  }
  function fail(message){
    attempt++;clearTimeout(timer);
    if(typeof clearSession==='function')clearSession();
    if(typeof invalidateNavigation==='function')invalidateNavigation();
    if(typeof S!=='undefined'){S.session=null;S.profile=null;S.cache={};S.student=null;S.route=null}
    loginScreen(message,available()&&!scriptsFailed);
  }
  function begin(){
    const token=++attempt;clearTimeout(timer);
    timer=setTimeout(()=>{if(token===attempt)fail('O acesso demorou a responder. Tente entrar novamente.')},25000);
    return token;
  }
  function start(token){
    if(token!==attempt)return;
    buildNav();
    element('auth').classList.add('hidden');
    element('boot').classList.add('hidden');
    element('shell').classList.remove('hidden');
    clearTimeout(timer);ready=true;
    navigate(S.profile.role==='student'?'student-home':'home');
  }
  async function enter(event){
    event.preventDefault();
    if(element('loginBtn').disabled)return;
    ready=false;const token=begin();
    element('loginBtn').disabled=true;element('loginBtn').textContent='Entrando...';
    element('loginStatus').textContent='';
    try{
      const session=pinMode?await signInPin(element('classCode').value,element('studentPin').value):await signIn(element('email').value.trim(),element('password').value,true);
      if(token!==attempt)return;S.session=session;
      await profile();if(token!==attempt)return;start(token);
    }catch(error){if(token===attempt)fail(error.message||'Não foi possível entrar.')}
    finally{if(token===attempt){clearTimeout(timer);element('loginBtn').disabled=false;element('loginBtn').textContent='Entrar'}}
  }
  let accountMode='login',accountVersion=0,recoveryToken=null;
  function accountView(mode,message=''){
    accountMode=mode;accountVersion++;
    if(mode!=='reset')recoveryToken=null;
    const form=element('accountForm');if(!form)return;
    element('loginForm').classList.toggle('hidden',mode!=='login');
    element('authLinks').classList.toggle('hidden',mode!=='login'||pinMode);
    form.classList.toggle('hidden',mode==='login');
    element('authTitle').textContent={login:'Entrar',register:'Quero me cadastrar',forgot:'Recuperar senha',reset:'Definir nova senha'}[mode];
    element('nameField').classList.toggle('hidden',mode!=='register');
    element('registerName').required=mode==='register';
    element('accountEmailField').classList.toggle('hidden',mode==='reset');
    element('accountEmail').required=mode!=='reset';
    for(const id of ['newPassword','confirmPassword']){element(id).value='';element(id).required=mode==='register'||mode==='reset';element(id+'Field').classList.toggle('hidden',!element(id).required)}
    element('accountSubmit').disabled=false;
    element('accountSubmit').textContent={register:'Solicitar cadastro',forgot:'Enviar recuperação',reset:'Salvar nova senha'}[mode]||'Continuar';
    element('accountStatus').textContent=message;
  }
  function wireAccount(){
    if(!element('registerLink'))return;
    element('registerLink').onclick=()=>accountView('register');
    element('forgotLink').onclick=()=>{accountView('forgot');element('accountEmail').value=element('email').value};
    element('backToLogin').onclick=()=>accountView('login');
    element('accountForm').onsubmit=async event=>{
      event.preventDefault();const button=element('accountSubmit');if(button.disabled)return;
      const mode=accountMode,version=accountVersion,email=element('accountEmail').value.trim(),password=element('newPassword').value;
      if(mode==='register'||mode==='reset'){
        if(password.length<8||password!==element('confirmPassword').value){element('accountStatus').textContent='Use pelo menos 8 caracteres e confirme a mesma senha.';return}
      }
      button.disabled=true;element('accountStatus').textContent='Enviando...';
      try{
        const callback=encodeURIComponent(location.origin+'/');
        if(mode==='register'){
          await accountRequest('signup?redirect_to='+callback,{email,password,data:{full_name:element('registerName').value.trim()}});
          if(version!==accountVersion)return;
          element('accountStatus').textContent='Solicitação enviada. Verifique seu e-mail para confirmar o cadastro, se solicitado. O acesso depende da aprovação do administrador.';
        }else if(mode==='forgot'){
          await accountRequest('recover?redirect_to='+callback,{email});
          if(version!==accountVersion)return;
          element('accountStatus').textContent='Se houver uma conta para esse e-mail, você receberá as instruções de recuperação. Confira também o spam.';
        }else if(mode==='reset'){
          if(!recoveryToken)throw Error('Link inválido. Solicite outra recuperação.');
          await accountRequest('user',{password},recoveryToken);
          if(version!==accountVersion)return;
          clearSession();S.session=null;accountView('login');element('loginStatus').textContent='Senha atualizada. Entre com a nova senha.';
        }
        element('newPassword').value='';element('confirmPassword').value='';
      }catch(error){if(version===accountVersion)element('accountStatus').textContent=error.message||'Não foi possível concluir.'}
      finally{if(version===accountVersion)button.disabled=false}
    };
  }
  function receiveAccountLink(){
    if(typeof location==='undefined'||!location.hash)return false;
    const params=new URLSearchParams(location.hash.slice(1));
    if(!params.has('access_token')&&!params.has('error_description'))return false;
    history.replaceState(null,'',location.pathname+location.search);
    clearSession();S.session=null;
    loginScreen('',true);
    if(params.has('error_description')){accountView('forgot','O link expirou ou é inválido. Solicite uma nova recuperação.');return true}
    if(params.get('type')==='recovery'){
      accountView('reset');recoveryToken=params.get('access_token');
    }else{accountView('login');element('loginStatus').textContent='E-mail confirmado. Entre quando seu cadastro estiver aprovado.'}
    return true;
  }
  async function initialize(){
    if(typeof BETA_DEMO!=='undefined'&&BETA_DEMO){
      S.profile={role:'super_admin',full_name:'Demonstração · dados fictícios'};
      element('auth').classList.add('hidden');element('boot').classList.add('hidden');element('shell').classList.remove('hidden');
      element('identity').textContent='Demonstração sem banco';
      element('nav').innerHTML='<button data-route="proposals">Propostas</button>';
      element('nav').onclick=()=>{navigate('proposals');closeDrawer()};
      element('menuBtn').onclick=openDrawer;element('drawerShade').onclick=closeDrawer;
      element('logoutBtn').textContent='Reiniciar demonstração';element('logoutBtn').onclick=()=>location.reload();
      ready=true;navigate('proposals');return;
    }

    if(!available()||scriptsFailed){fail('Não foi possível carregar todos os arquivos. Atualize a página para tentar novamente.');return}
    wireAccount();
    function chooseLogin(student){
      pinMode=student;accountView('login');
      for(const id of ['emailField','passwordField'])element(id).classList.toggle('hidden',student);
      for(const id of ['classCodeField','studentPinField','pinHelp'])element(id).classList.toggle('hidden',!student);
      element('email').required=!student;element('password').required=!student;
      element('classCode').required=student;element('studentPin').required=student;
      element('authLinks').classList.toggle('hidden',student);
      element('loginAccessType').value=student?'student':'teacher';
      element('password').value='';element('studentPin').value='';element('loginStatus').textContent='';
    }
    element('loginAccessType').onchange=()=>chooseLogin(element('loginAccessType').value==='student');
    if(new URLSearchParams(location.search).get('acesso')==='aluno')chooseLogin(true);
    element('loginForm').onsubmit=enter;
    element('logoutBtn').onclick=()=>{ready=false;fail('');element('password').value='';element('studentPin').value='';};
    element('menuBtn').onclick=openDrawer;element('drawerShade').onclick=closeDrawer;
    if(receiveAccountLink())return;
    const token=begin();
    try{
      let session=readSession();
      if(session&&(!session.expires_at||session.expires_at<Math.floor(Date.now()/1000)+60))session=await refreshSession(session);
      if(token!==attempt)return;
      if(!session){clearTimeout(timer);loginScreen('',true);return}
      S.session=session;await profile();if(token!==attempt)return;start(token);
    }catch(error){if(token===attempt)fail(error.message||'Não foi possível recuperar a sessão. Entre novamente.')}
  }
  window.addEventListener('error',event=>{
    if(ready)return;
    if(event.target?.tagName==='SCRIPT'||!available()){
      scriptsFailed=true;fail('Não foi possível carregar a aplicação. Atualize a página para tentar novamente.');
    }
  },true);
  if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();

