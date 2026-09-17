'use strict';
const BASE='https://huccxcpwoydwuisrmboc.supabase.co',KEY='sb_publishable_KzojVBVP3GvVbSgO_w0mUA_-s8r7VdR',SK='versao-e12-session-v1';
const MUTATIONS_ENABLED=false,PAID_AI_ENABLED=false;
const API={live:'live-correction-api',proposal:'proposal-api',official:'official-correction-api',ai:'ai-correction-api',studentDash:'student-dashboard-api',studentProp:'student-proposals-api',studentSub:'student-submission-api',admin:'admin-base-api'};
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=v=>{if(!v)return'—';try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v))}catch{return'—'}};
const one=x=>Array.isArray(x)?x[0]:x;
const S={session:null,profile:null,route:null,cache:{},student:null};
const PERF={requests:0,boot_started:performance.now()}; window.__VERSAO_E12__={state:S,perf:PERF,mutations:MUTATIONS_ENABLED,paid_ai:PAID_AI_ENABLED};
let sessionMemory, sessionVersion=0;
function validSession(s){return !!s&&typeof s==='object'&&typeof s.access_token==='string'&&!!s.access_token&&typeof s.refresh_token==='string'&&!!s.refresh_token&&typeof s.user?.id==='string'&&!!s.user.id&&(s.expires_at==null||Number.isFinite(s.expires_at))}
function saveSession(s){if(!validSession(s))throw Error('Sessão inválida. Entre novamente.');sessionMemory=s;try{localStorage.setItem(SK,JSON.stringify(s))}catch{}}
function readSession(){if(sessionMemory!==undefined)return sessionMemory;try{const s=JSON.parse(localStorage.getItem(SK)||'null');if(validSession(s)){sessionMemory=s;return s}}catch{}clearSession();return null}
function clearSession(){sessionVersion++;sessionMemory=null;try{localStorage.removeItem(SK)}catch{}}
function authHeaders(token,json=true){const h={apikey:KEY,Authorization:'Bearer '+token};if(json)h['Content-Type']='application/json';return h}
function authMessage(data,fallback='Não foi possível concluir. Tente novamente.'){
  const raw=String(data?.error_description||data?.msg||data?.message||data?.error||'').trim();
  const code=String(data?.error_code||data?.code||'').trim().toLowerCase();
  const key=(code+' '+raw).toLowerCase();
  const rules=[
    [/invalid login credentials|invalid_credentials/, 'E-mail ou senha inválidos.'],
    [/email not confirmed|email_not_confirmed/, 'Confirme seu e-mail antes de entrar.'],
    [/error sending recovery email|recovery.*email|unexpected_failure.*recover/, 'Não foi possível enviar o e-mail de recuperação. Tente novamente em alguns minutos.'],
    [/email rate limit exceeded|over_email_send_rate_limit|rate limit.*email/, 'Muitas tentativas de envio. Aguarde alguns minutos e tente novamente.'],
    [/user already registered|user_already_exists|email.*already.*registered/, 'Este e-mail já está cadastrado.'],
    [/email address not authorized|email.*not authorized|not authorized.*email/, 'Não foi possível enviar o e-mail para este endereço.'],
    [/unable to validate email address|invalid.*email|email.*invalid/, 'Informe um endereço de e-mail válido.'],
    [/password.*at least|password.*short|weak_password/, 'A senha precisa ter pelo menos 8 caracteres.'],
    [/new password should be different|same_password/, 'A nova senha precisa ser diferente da senha atual.'],
    [/signup.*valid password/, 'Informe uma senha válida.'],
    [/otp_expired|token.*expired|invalid.*token|link.*expired/, 'Este link expirou ou é inválido. Solicite um novo.'],
    [/user not found/, 'Não foi possível localizar essa conta.'],
    [/signup is disabled|signups not allowed/, 'Novos cadastros estão temporariamente indisponíveis.']
  ];
  console.warn('[VERSÃO Auth]',{code:code||null,status:data?.status||null});
  for(const [pattern,message] of rules)if(pattern.test(key))return message;
  return raw&&/^[\x20-\x7E]+$/.test(raw)?fallback:(raw||fallback);
}
function betaRequestAllowed(url,options={}){
 const method=(options.method||'GET').toUpperCase();
 if(url.startsWith(BASE+'/rest/v1/'))return method==='GET';
 if(url.startsWith(BASE+'/auth/v1/token?'))return method==='POST';
 if(url.startsWith(BASE+'/functions/v1/')){
  let body;try{body=JSON.parse(options.body)}catch{return false}
  const readActions={'live-correction-api':['queue','list'],'proposal-api':['bootstrap','get'],'official-correction-api':['get'],'ai-correction-api':['get','status'],'student-dashboard-api':['get','dashboard'],'student-proposals-api':['list','get'],'student-submission-api':['state','states'],'admin-base-api':['bootstrap']};
  return (readActions[url.split('/').pop()]||[]).includes(body.action);
 }
 return false;
}
async function request(url,options={}){if(!MUTATIONS_ENABLED&&!betaRequestAllowed(url,options))throw Error('Ambiente beta em preparação: esta ação será liberada após conectar a base de teste.');const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),url.includes('/functions/v1/')?180000:20000);try{return await fetch(url,{...options,signal:controller.signal})}catch(e){if(e.name==='AbortError')throw Error('A conexão demorou a responder. Tente novamente.');throw e}finally{clearTimeout(timeout)}}
async function signIn(email,password,save=true){const version=sessionVersion;PERF.requests++;const r=await request(BASE+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(authMessage({...d,status:r.status},'Não foi possível entrar. Tente novamente.'));const s={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600),user:d.user};if(version!==sessionVersion)throw Error('Tentativa de acesso encerrada. Entre novamente.');if(save)saveSession(s);return s}
async function refreshSession(s){const version=sessionVersion;if(!s?.refresh_token)return null;PERF.requests++;const r=await request(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!r.ok)return null;const d=await r.json();const n={access_token:d.access_token,refresh_token:d.refresh_token||s.refresh_token,expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600),user:d.user||s.user};if(version!==sessionVersion)return null;saveSession(n);return n}
async function ensure(){let s=S.session;if(!s)throw Error('Sessão ausente.');if(!s.expires_at||s.expires_at<Math.floor(Date.now()/1000)+60)s=await refreshSession(s);if(!s){clearSession();throw Error('Sessão expirada.');}S.session=s;return s}
async function rest(path){const s=await ensure();PERF.requests++;const r=await request(BASE+'/rest/v1/'+path,{headers:authHeaders(s.access_token,false)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||d.hint||'Falha ao consultar dados.');return d}
async function edge(slug,body={},retried=false){const s=await ensure();PERF.requests++;const r=await request(`${BASE}/functions/v1/${slug}`,{method:'POST',headers:authHeaders(s.access_token),body:JSON.stringify(body)});if(r.status===401&&!retried){S.session=await refreshSession(S.session);if(S.session)return edge(slug,body,true)}const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw Error(typeof d.error==='string'?d.error:'Falha na operação.');return d}
async function profile(){const version=sessionVersion,id=S.session?.user?.id;if(!id)throw Error('Usuário não identificado.');const p=(await rest(`profiles?id=eq.${encodeURIComponent(id)}&select=id,full_name,email,role,approval_status,organization_id,teacher_scope`))[0];if(!p||p.approval_status!=='approved')throw Error('Conta sem acesso aprovado.');if(!['super_admin','teacher','student'].includes(p.role))throw Error('Perfil sem acesso ao VERSÃO.');if(version!==sessionVersion||S.session?.user?.id!==id)throw Error('Sessão alterada. Entre novamente.');S.profile=p;return p}
function showOnly(id){['boot','auth','shell'].forEach(x=>$(x).classList.toggle('hidden',x!==id))}
function toast(msg){document.querySelector('.toast')?.remove();const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),3600)}
function safeMessage(action){toast(`${action} validado no ambiente isolado. Nenhum dado foi gravado na produção.`)}
const NAV_TEACHER=[['home','Início'],['proposals','Propostas'],['live','Ao vivo'],['correction','Correção'],['ranking','Ranking']];
const NAV_STUDENT=[['student-home','Início'],['student-proposals','Propostas'],['student-essays','Minhas redações'],['student-evolution','Evolução'],['student-account','Conta']];
function buildNav(){let nav=S.profile.role==='student'?[...NAV_STUDENT]:[...NAV_TEACHER];if(S.profile.role==='super_admin')nav.push(['management','Gestão']);$('nav').innerHTML=nav.map(([r,l])=>`<button data-route="${r}"><span class="dot"></span>${l}</button>`).join('');$('nav').onclick=e=>{const b=e.target.closest('[data-route]');if(b){navigate(b.dataset.route);closeDrawer()}};$('identity').innerHTML=`<b>${esc(S.profile.full_name||S.profile.email||'Usuário')}</b>${esc(S.profile.role==='super_admin'?'Super Admin':S.profile.role==='teacher'?'Professor':'Aluno')}`}
function openDrawer(){$('sidebar').classList.add('open');$('drawerShade').classList.remove('hidden')}function closeDrawer(){$('sidebar').classList.remove('open');$('drawerShade').classList.add('hidden')}
function header(title,sub,action=''){return `<div class="page-head"><div><span class="page-kicker">VERSÃO · ETAPA 12</span><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${action}</div>`}
function setActive(route){document.querySelectorAll('#nav [data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===route))}
let navigationVersion=0,activeNavigation=null;
function navigationCurrent(navigation){return !!navigation&&activeNavigation===navigation&&navigation.version===navigationVersion&&S.route===navigation.route}
function invalidateNavigation(){navigationVersion++;if(activeNavigation)clearTimeout(activeNavigation.timer);activeNavigation=null}
function navigationError(navigation,error){if(!navigationCurrent(navigation))return;invalidateNavigation();$('view').innerHTML=header('Não foi possível carregar','Tente abrir esta área novamente.')+`<div class="card"><p>${esc(error.message||error)}</p><button class="btn primary" id="retryRoute">Tentar novamente</button></div>`;$('retryRoute').onclick=()=>navigate(navigation.route)}
async function navigate(route){invalidateNavigation();S.route=route;const navigation={route,version:navigationVersion,timer:null};activeNavigation=navigation;setActive(route);$('view').innerHTML='<div class="empty">Carregando...</div>';navigation.timer=setTimeout(()=>navigationError(navigation,Error('O carregamento demorou a responder.')),30000);try{const map={home:renderHome,proposals:renderProposals,live:renderLive,correction:renderCorrection,ranking:renderRanking,management:renderManagement,'student-home':renderStudentHome,'student-proposals':renderStudentProposals,'student-essays':renderStudentEssays,'student-evolution':renderStudentEvolution,'student-account':renderStudentAccount};if(!Object.hasOwn(map,route))throw Error('Área não disponível.');await map[route](navigation)}catch(error){navigationError(navigation,error)}finally{clearTimeout(navigation.timer)}}
async function teacherQueue(force=false){if(!force&&S.cache.queue)return S.cache.queue;const d=await edge(API.live,{action:'queue'});S.cache.queue=d.items||[];return S.cache.queue}
async function teacherProposals(force=false){if(!force&&S.cache.teacherProps)return S.cache.teacherProps;const d=await edge(API.proposal,{action:'bootstrap'});S.cache.teacherProps=d;return d}
async function orgNames(){if(S.cache.orgNames)return S.cache.orgNames;const a=await rest('organizations?select=id,name&order=name');S.cache.orgNames=new Map(a.map(x=>[x.id,x.name]));return S.cache.orgNames}
function statusLabel(row){if(row.score?.is_approved)return['Aprovada','ok'];if(row.job_status==='processing')return['Em correção','warn'];return['Aguardando oficial','crimson']}
async function accountRequest(path,body,token){const response=await request(BASE+'/auth/v1/'+path,{method:token?'PUT':'POST',headers:{apikey:KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok){const fallback=path.startsWith('recover')?'Não foi possível enviar o e-mail de recuperação. Tente novamente.':path.startsWith('signup')?'Não foi possível concluir o cadastro. Tente novamente.':'Não foi possível concluir. Tente novamente.';throw Error(authMessage({...data,status:response.status},fallback))}return data}
async function uploadEssay(slug,fields,file){const session=await ensure(),form=new FormData();for(const [key,value]of Object.entries(fields))form.append(key,String(value));form.append('file',file);const r=await request(BASE+'/functions/v1/'+slug,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token},body:form});const data=await r.json().catch(()=>({}));if(!r.ok||data.error)throw Error(data.error||'Não foi possível enviar o arquivo.');return data}
let activeConfirmation=null;
function appConfirm(message){if(activeConfirmation)return Promise.resolve(false);return new Promise(resolve=>{const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='app-confirm';dialog.innerHTML='<h2 id="confirmationTitle">Confirmar ação</h2><p></p><div class="item-actions"><button class="btn soft-btn" data-cancel>Cancelar</button><button class="btn primary" data-confirm>Confirmar</button></div>';dialog.setAttribute('aria-labelledby','confirmationTitle');dialog.querySelector('p').textContent=message;let finished=false;const finish=value=>{if(finished)return;finished=true;dialog.close();dialog.remove();activeConfirmation=null;if(previous?.isConnected)previous.focus();resolve(value)};activeConfirmation=dialog;dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-confirm]').onclick=()=>finish(true);dialog.oncancel=e=>{e.preventDefault();finish(false)};document.body.appendChild(dialog);dialog.showModal();dialog.querySelector('[data-cancel]').focus()})}
