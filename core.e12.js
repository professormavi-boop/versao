'use strict';
const BETA_DEMO=false;
const BETA_PROPOSALS=true;
const BASE='https://huccxcpwoydwuisrmboc.supabase.co',KEY='sb_publishable_KzojVBVP3GvVbSgO_w0mUA_-s8r7VdR',SK='versao-e12-session-v1';
const MUTATIONS_ENABLED=false,PAID_AI_ENABLED=true;
const API={live:'live-correction-beta-api',proposal:'proposal-beta-api',official:'official-correction-beta-api',ai:'ai-correction-beta-api',credit:'credit-checkout-api',studentDash:'student-dashboard-cycle-api',studentProp:'student-proposals-cycle-api',studentSub:'student-submission-cycle-api',admin:'admin-base-api'};
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v))}catch{return'—'}};
const one=x=>Array.isArray(x)?x[0]:x;
const S={session:null,profile:null,route:null,cache:{},student:null};
const PERF={requests:0,boot_started:performance.now()}; window.__VERSAO_E12__={state:S,perf:PERF,mutations:MUTATIONS_ENABLED,paid_ai:PAID_AI_ENABLED};
let sessionMemory, sessionVersion=0;
function validSession(s){return !!s&&typeof s==='object'&&typeof s.access_token==='string'&&!!s.access_token&&typeof s.refresh_token==='string'&&!!s.refresh_token&&typeof s.user?.id==='string'&&!!s.user.id&&(s.expires_at==null||Number.isFinite(s.expires_at))}
function saveSession(s){
  if(!validSession(s))throw Error('Sessão inválida. Entre novamente.');
  sessionMemory=s;
  try{localStorage.setItem(SK,JSON.stringify(s))}catch{/* A sessão permanece somente nesta aba. */}
}
function readSession(){
  if(sessionMemory!==undefined)return sessionMemory;
  try{const s=JSON.parse(localStorage.getItem(SK)||'null');if(validSession(s)){sessionMemory=s;return s}}catch{}
  clearSession();return null;
}
function clearSession(){sessionVersion++;sessionMemory=null;try{localStorage.removeItem(SK)}catch{}}
function authHeaders(token,json=true){const h={apikey:KEY,Authorization:'Bearer '+token};if(json)h['Content-Type']='application/json';return h}
function betaRequestAllowed(url,options={}){
 const method=(options.method||'GET').toUpperCase();
 if(url.startsWith(BASE+'/rest/v1/'))return method==='GET';
 if(url.startsWith(BASE+'/auth/v1/token?'))return method==='POST';
 if(url.startsWith(BASE+'/auth/v1/'))return ['signup','recover','user'].includes(url.slice((BASE+'/auth/v1/').length).split('?')[0])&&['POST','PUT'].includes(method);
 if(url.startsWith(BASE+'/functions/v1/')){
  const slug=url.split('/').pop();
  if(typeof FormData!=='undefined'&&options.body instanceof FormData)return method==='POST'&&['live-correction-beta-api','student-submission-cycle-api'].includes(slug)&&options.body.get('action')==='upload';
  let body;try{body=JSON.parse(options.body)}catch{return false}
  if(method!=='POST')return false;
  const readActions={
   'student-pin-api':['login','list','issue'],
   'admin-accounts-api':['directory','create'],
   'teacher-catalog-api':['home','organizations','base','students','update','visibility','delete'],
   'teacher-organization-api':['organizations','create_organization','base','create_class','students','review','import'],
   'live-correction-beta-api':['directory','start','upload','finalize','list','queue','delete_file','delete_submission'],
   'proposal-beta-api':['bootstrap','get','save','save_all','generate','credits','update_status','delete'],'live-correction-api':['queue','list'], 'proposal-api':['bootstrap','get'],
   'official-correction-beta-api':['get','approve'],'ai-correction-beta-api':['get','status','correct','approve'],
   'student-dashboard-cycle-api':['get','dashboard',undefined],'student-proposals-cycle-api':['list','get',undefined],'student-proposals-api':['list','get',undefined],
   'student-submission-cycle-api':['state','states','finalize','delete_file','view_file'],'admin-base-api':['organizations','create_organization','approve_account','hide_account','delete_account','change_password','bootstrap','create_class','update_class','toggle_class','delete_class','create_student','update_student','toggle_student','delete_student'],'credit-checkout-api':['packages','checkout']
  };
  return (readActions[url.split('/').pop()]||[]).includes(body.action);
 }
 return false;
}
async function request(url,options={}){if(BETA_DEMO)throw Error("Demonstração sem conexão ao banco.");if(!MUTATIONS_ENABLED&&!betaRequestAllowed(url,options))throw Error('Esta operação não está disponível nesta versão.');const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),url.includes('/functions/v1/')?180000:20000);try{return await fetch(url,{...options,signal:controller.signal})}catch(e){if(e.name==='AbortError')throw Error('A conexão demorou a responder. Tente novamente.');throw Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')}finally{clearTimeout(timeout)}}
async function signIn(email,password,save=true){const version=sessionVersion;PERF.requests++;const r=await request(BASE+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(authErrorMessage(d,r.status,'Não foi possível entrar. Tente novamente.'));const s={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600),user:d.user};if(version!==sessionVersion)throw Error('Tentativa de acesso encerrada. Entre novamente.');if(save)saveSession(s);return s}
async function refreshSession(s){const version=sessionVersion;if(!s?.refresh_token)return null;PERF.requests++;const r=await request(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!r.ok)return null;const d=await r.json();const n={access_token:d.access_token,refresh_token:d.refresh_token||s.refresh_token,expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600),user:d.user||s.user};if(version!==sessionVersion)return null;saveSession(n);return n}
async function ensure(){let s=S.session;if(!s)throw Error('Sessão ausente.');if(!s.expires_at||s.expires_at<Math.floor(Date.now()/1000)+60)s=await refreshSession(s);if(!s){clearSession();throw Error('Sessão expirada.');}S.session=s;return s}
async function rest(path){const s=await ensure();PERF.requests++;const r=await request(BASE+'/rest/v1/'+path,{headers:authHeaders(s.access_token,false)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||d.hint||'Falha ao consultar dados.');return d}
async function edge(slug,body={},retried=false){const s=await ensure();PERF.requests++;const r=await request(`${BASE}/functions/v1/${slug}`,{method:'POST',headers:authHeaders(s.access_token),body:JSON.stringify(body)});if(r.status===401&&!retried){S.session=await refreshSession(S.session);if(S.session)return edge(slug,body,true)}const d=await r.json().catch(()=>({}));if(!r.ok||d.error){const error=Error(typeof d.error==='string'?d.error:'Falha na operação.');error.refunded=d.refunded===true;error.code=d.code;throw error}return d}
async function profile(){const version=sessionVersion,id=S.session?.user?.id;if(!id)throw Error('Usuário não identificado.');const p=(await rest(`profiles?id=eq.${encodeURIComponent(id)}&select=id,full_name,email,role,approval_status,organization_id,teacher_scope`))[0];if(!p||p.approval_status!=='approved')throw Error('Conta sem acesso aprovado.');if(!['super_admin','teacher','student'].includes(p.role))throw Error('Perfil sem acesso ao VERSÃO.');if(version!==sessionVersion||S.session?.user?.id!==id)throw Error('Sessão alterada. Entre novamente.');S.profile=p;return p}
function showOnly(id){['boot','auth','shell'].forEach(x=>$(x).classList.toggle('hidden',x!==id))}
function toast(msg){document.querySelector('.toast')?.remove();const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),3600)}
function safeMessage(action){toast(`${action} validado no ambiente isolado. Nenhum dado foi gravado na produção.`)}
const NAV_TEACHER=[['home','Início'],['proposals','Propostas'],['live','Ao vivo'],['correction','Correção'],['ranking','Ranking'],['teacher-account','Conta e créditos']];
const NAV_STUDENT=[['student-home','Início'],['student-proposals','Propostas'],['student-essays','Minhas redações'],['student-evolution','Evolução'],['student-account','Conta']];
function buildNav(){let nav=S.profile.role==='student'?[...NAV_STUDENT]:[...NAV_TEACHER];if(S.profile.role==='super_admin')nav.push(['management','Gestão']);if(BETA_PROPOSALS&&S.profile.role==='teacher')nav=[['home','Início'],['teacher-organization','Minhas instituições'],['proposals','Propostas'],['live','Ao Vivo'],['correction','Correção'],['teacher-account','Conta e créditos']];$('nav').innerHTML=nav.map(([r,l])=>`<button data-route="${r}"><span class="dot"></span>${l}</button>`).join('');$('nav').onclick=e=>{const b=e.target.closest('[data-route]');if(b){navigate(b.dataset.route);closeDrawer()}};$('identity').innerHTML=`<b>${esc(S.profile.full_name||S.profile.email||'Usuário')}</b>${esc(S.profile.role==='super_admin'?'Super Admin':S.profile.role==='teacher'?'Professor':'Aluno')}`}
function openDrawer(){$('sidebar').classList.add('open');$('drawerShade').classList.remove('hidden')}function closeDrawer(){$('sidebar').classList.remove('open');$('drawerShade').classList.add('hidden')}
function header(title,sub,action=''){return `<div class="page-head"><div><span class="page-kicker">VERSÃO</span><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${action}</div>`}
function setActive(route){document.querySelectorAll('#nav [data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===route))}
let navigationVersion=0, activeNavigation=null;
function navigationCurrent(navigation){return !!navigation&&activeNavigation===navigation&&navigation.version===navigationVersion&&S.route===navigation.route}
function invalidateNavigation(){navigationVersion++;if(activeNavigation)clearTimeout(activeNavigation.timer);activeNavigation=null}
function navigationError(navigation,error){
  if(!navigationCurrent(navigation))return;
  invalidateNavigation();
  $('view').innerHTML=header('Não foi possível carregar','Tente abrir esta área novamente.')+`<div class="card"><p>${esc(error.message||error)}</p><button class="btn primary" id="retryRoute">Tentar novamente</button></div>`;
  $('retryRoute').onclick=()=>navigate(navigation.route);
}
async function navigate(route){
  invalidateNavigation();S.route=route;$('view').onclick=null;
  const navigation={route,version:navigationVersion,timer:null};activeNavigation=navigation;
  setActive(route);$('view').innerHTML='<div class="empty">Carregando...</div>';
  navigation.timer=setTimeout(()=>navigationError(navigation,Error('O carregamento demorou a responder.')),30000);
  try{
    const map={home:S.profile.role==='teacher'&&BETA_PROPOSALS?renderTeacherHome:renderHome,proposals:renderProposals,live:renderLive,correction:renderCorrection,ranking:renderRanking,management:renderManagement,'admin-accounts':renderAdminAccounts,'teacher-organization':renderTeacherOrganization,'teacher-account':renderTeacherAccount,'student-home':renderStudentHome,'student-proposals':renderStudentProposals,'student-essays':renderStudentEssays,'student-evolution':renderStudentEvolution,'student-account':renderStudentAccount};
    if(!Object.hasOwn(map,route))throw Error('Área não disponível.');
    await map[route](navigation);
  }catch(error){navigationError(navigation,error)}finally{clearTimeout(navigation.timer)}
}

async function teacherQueue(force=false){if(!force&&S.cache.queue)return S.cache.queue;const d=await edge(API.live,{action:'queue'});S.cache.queue=d.items||[];return S.cache.queue}
async function teacherProposals(force=false){if(!force&&S.cache.teacherProps)return S.cache.teacherProps;const d=await edge(API.proposal,{action:'bootstrap'});S.cache.teacherProps=d;return d}
async function orgNames(){if(S.cache.orgNames)return S.cache.orgNames;const a=await rest('organizations?select=id,name&order=name');S.cache.orgNames=new Map(a.map(x=>[x.id,x.name]));return S.cache.orgNames}
function statusLabel(row){if(row.score?.is_approved)return['Aprovada','ok'];if(row.job_status==='processing')return['Em correção','warn'];return['Aguardando oficial','crimson']}

function authErrorMessage(error,status=0,fallback='Não foi possível concluir. Tente novamente.'){
 const value=error&&typeof error==='object'?error:{message:error};
 const code=String(value.code||value.error_code||'');
 const message=String(value.error_description||value.msg||value.message||(typeof value.error==='string'?value.error:'')).trim();
 if(/error sending (recovery|confirmation|magic link|invite|email)|error sending email|smtp|failed to send.*email/i.test(message))return 'Não foi possível enviar o e-mail. Tente novamente mais tarde. Se o erro continuar, avise o responsável pelo Versão.';
 const translations={
  invalid_credentials:'E-mail ou senha incorretos.',
  email_not_confirmed:'Confirme seu e-mail antes de entrar. Confira também a pasta de spam.',
  email_exists:'Já existe uma conta com este e-mail. Entre ou recupere sua senha.',
  user_already_exists:'Já existe uma conta com este e-mail. Entre ou recupere sua senha.',
  email_address_invalid:'Informe um endereço de e-mail válido.',
  validation_failed:'Confira os dados informados e tente novamente.',
  email_address_not_authorized:'O envio de e-mails ainda não está disponível para este endereço. Avise o responsável pelo Versão.',
  over_email_send_rate_limit:'Muitos e-mails foram solicitados. Aguarde alguns minutos antes de tentar novamente.',
  over_request_rate_limit:'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
  weak_password:'A senha não atende aos requisitos de segurança. Use uma senha mais forte, com letras, números e símbolos.',
  same_password:'A nova senha deve ser diferente da senha atual.',
  otp_expired:'O link expirou ou já foi utilizado. Solicite um novo e-mail.',
  flow_state_expired:'O link expirou. Solicite um novo e-mail.',
  flow_state_not_found:'O link é inválido ou já foi utilizado. Solicite um novo e-mail.',
  bad_jwt:'Sua sessão expirou ou é inválida. Entre novamente.',
  session_expired:'Sua sessão expirou. Entre novamente.',
  session_not_found:'Sua sessão não foi encontrada. Entre novamente.',
  refresh_token_not_found:'Sua sessão expirou. Entre novamente.',
  refresh_token_already_used:'Sua sessão expirou. Entre novamente.',
  user_banned:'Esta conta está bloqueada. Entre em contato com o responsável pelo Versão.',
  signup_disabled:'Novos cadastros estão temporariamente indisponíveis.',
  email_provider_disabled:'O acesso por e-mail está temporariamente indisponível.',
  captcha_failed:'Não foi possível confirmar a verificação de segurança. Tente novamente.',
  request_timeout:'A conexão demorou a responder. Tente novamente.',
  reauthentication_needed:'Entre novamente antes de alterar sua senha.',
  reauthentication_not_valid:'O código de confirmação é inválido. Solicite um novo código.'
 };
 if(Object.hasOwn(translations,code))return translations[code];
 if(/invalid login credentials/i.test(message))return translations.invalid_credentials;
 if(/email not confirmed/i.test(message))return translations.email_not_confirmed;
 if(/user already registered|user already exists|email.*already.*registered/i.test(message))return translations.email_exists;
 if(/new password.*different|same password/i.test(message))return translations.same_password;
 if(/password should be at least|password.*too short/i.test(message)){const minimum=message.match(/at least (\d+)/i);return minimum?'A senha deve ter pelo menos '+minimum[1]+' caracteres.':translations.weak_password;}
 if(/email.*invalid|invalid.*email/i.test(message))return translations.email_address_invalid;
 if(/email.*rate limit/i.test(message))return translations.over_email_send_rate_limit;
 if(/expired|invalid.*token/i.test(message))return translations.otp_expired;
 if(/security purposes.*after.*seconds/i.test(message)){const seconds=message.match(/after (\d+) seconds/i);return seconds?'Por segurança, aguarde '+seconds[1]+' segundos antes de tentar novamente.':translations.over_request_rate_limit;}
 if(status===429)return translations.over_request_rate_limit;
 if(status===401)return translations.bad_jwt;
 if(status===403)return 'Você não tem permissão para realizar esta ação.';
 if(status>=500)return 'O serviço está temporariamente indisponível. Tente novamente mais tarde.';
 return fallback;
}

async function accountRequest(path,body,token){
  const response=await request(BASE+'/auth/v1/'+path,{method:token?'PUT':'POST',headers:{apikey:KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(authErrorMessage(data,response.status));
  return data;
}

async function uploadEssay(slug,fields,file){
  const session=await ensure(),form=new FormData();
  for(const [key,value]of Object.entries(fields))form.append(key,String(value));
  form.append('file',file);
  const r=await request(BASE+'/functions/v1/'+slug,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token},body:form});
  const data=await r.json().catch(()=>({}));
  if(!r.ok||data.error)throw Error(data.error||'Não foi possível enviar o arquivo.');
  return data;
}

let activeConfirmation=null;
function appConfirm(message){
 if(activeConfirmation)return Promise.resolve(false);
 return new Promise(resolve=>{
  const previous=document.activeElement,dialog=document.createElement('dialog');
  dialog.className='app-confirm';
  dialog.innerHTML='<h2 id="confirmationTitle">Confirmar ação</h2><p></p><div class="item-actions"><button class="btn soft-btn" data-cancel>Cancelar</button><button class="btn primary" data-confirm>Confirmar</button></div>';
  dialog.setAttribute('aria-labelledby','confirmationTitle');dialog.querySelector('p').textContent=message;
  let finished=false;const finish=value=>{if(finished)return;finished=true;dialog.close();dialog.remove();activeConfirmation=null;if(previous?.isConnected)previous.focus();resolve(value)};
  activeConfirmation=dialog;dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-confirm]').onclick=()=>finish(true);
  dialog.oncancel=e=>{e.preventDefault();finish(false)};
  document.body.appendChild(dialog);dialog.showModal();dialog.querySelector('[data-cancel]').focus();
 });
}

function proposalHtml(html){const template=document.createElement('template');template.innerHTML=html;const allowed=new Set(['B','STRONG','I','EM','UL','OL','LI','P','DIV','BR']);const visit=node=>{if(node.nodeType===3)return esc(node.textContent);if(node.nodeType!==1)return '';if(['SCRIPT','STYLE','IFRAME','OBJECT'].includes(node.tagName))return '';const children=[...node.childNodes].map(visit).join('');return allowed.has(node.tagName)?'<'+node.tagName.toLowerCase()+'>'+children+(node.tagName==='BR'?'':'</'+node.tagName.toLowerCase()+'>'):children};return [...template.content.childNodes].map(visit).join('');}

function generationScreen(message){
 const dialog=document.createElement('dialog'),previous=document.activeElement;
 dialog.className='app-confirm generation-screen';dialog.setAttribute('aria-label',message);dialog.setAttribute('aria-busy','true');
 dialog.innerHTML='<div class="spin" aria-hidden="true"></div><h2></h2><p role="status" aria-live="polite">Aguarde nesta tela. O conteúdo aparecerá quando o processamento terminar.</p>';
 dialog.querySelector('h2').textContent=message;dialog.oncancel=e=>e.preventDefault();document.body.appendChild(dialog);dialog.showModal();
 let closed=false;return()=>{if(closed)return;closed=true;dialog.close();dialog.remove();if(previous?.isConnected)previous.focus()};
}

async function signInPin(code,pin){
 const version=sessionVersion;
 const r=await request(BASE+'/functions/v1/student-pin-api',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'login',code:code.trim().toUpperCase(),pin})});
 const d=await r.json();if(!r.ok||!validSession(d.session))throw Error(d.error||'Não foi possível entrar.');
 if(version!==sessionVersion)throw Error('Tentativa encerrada. Entre novamente.');
 saveSession(d.session);return d.session;
}

