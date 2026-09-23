'use strict';
function ensureTeacherHomeQuickStyle(){
 if(document.getElementById('teacherHomeQuickStyle'))return;
 const style=document.createElement('style');style.id='teacherHomeQuickStyle';style.textContent=`
 .teacher-home .home-quick-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:12px}
 .teacher-home .home-quick-card{aspect-ratio:1/1;min-width:0;border:1px solid var(--line);border-radius:20px;background:#fff;color:var(--crimson);padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;text-align:center;font-weight:900;cursor:pointer;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
 .teacher-home .home-quick-card:hover{transform:translateY(-2px);border-color:#D5B8B5;box-shadow:0 10px 28px rgba(91,29,29,.07)}
 .teacher-home .home-quick-card.is-primary{border-color:var(--crimson);background:linear-gradient(145deg,var(--crimson),var(--crimson2));color:#fff;box-shadow:0 10px 28px rgba(139,28,28,.13)}
 .teacher-home .home-quick-icon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;background:var(--soft);color:var(--crimson);flex:0 0 auto}
 .teacher-home .home-quick-card.is-primary .home-quick-icon{background:rgba(255,255,255,.12);color:#fff}
 .teacher-home .home-quick-icon svg{width:30px;height:30px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
 .teacher-home .home-quick-label{font-size:17px;line-height:1.22}
 .teacher-home .home-credit-card{margin-top:18px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(145deg,#FFFDFC 0%,var(--soft) 100%);padding:22px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:18px;align-items:start}
 .teacher-home .home-credit-symbol{width:60px;height:60px;border-radius:18px;background:#F3DCDC;color:var(--crimson);display:grid;place-items:center}
 .teacher-home .home-credit-symbol svg{width:32px;height:32px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
 .teacher-home .home-credit-main{min-width:0}.teacher-home .home-credit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.teacher-home .home-credit-head h2{margin:0;font-size:21px}.teacher-home .home-credit-head p{margin:4px 0 0;color:var(--muted);font-size:13px}
 .teacher-home .home-credit-balance{display:flex;align-items:baseline;gap:8px;margin-top:10px}.teacher-home .home-credit-balance strong{font-size:38px;line-height:1;color:var(--crimson)}.teacher-home .home-credit-balance span{color:var(--muted);font-weight:750}
 .teacher-home .home-credit-rule{height:8px;border-radius:999px;background:#E9D7D5;margin:16px 0 18px;overflow:hidden}.teacher-home .home-credit-rule>span{display:block;width:64%;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--crimson),var(--crimson2))}
 .teacher-home .home-credit-actions{display:grid;grid-template-columns:1.15fr 1fr;gap:10px}.teacher-home .home-credit-actions .btn{min-height:46px}
 @media(max-width:720px){.teacher-home .home-quick-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.teacher-home .home-quick-card{border-radius:17px;padding:14px;gap:11px}.teacher-home .home-quick-icon{width:48px;height:48px;border-radius:14px}.teacher-home .home-quick-label{font-size:15px}.teacher-home .home-credit-card{grid-template-columns:1fr;padding:18px;gap:12px}.teacher-home .home-credit-symbol{width:52px;height:52px}.teacher-home .home-credit-actions{grid-template-columns:1fr}.teacher-home .home-credit-balance strong{font-size:34px}}
 `;document.head.appendChild(style);
}
function teacherHomeQuickIcon(key){
 const icons={
  proposal:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14h6"/></svg>',
  correction:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h11a2 2 0 0 1 2 2v6"/><path d="M5 3v18h8"/><path d="M8 8h7M8 12h5"/><path d="m14 18 5-5 2 2-5 5-3 1z"/></svg>',
  import:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/></svg>',
  class:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M14 14h2a5 5 0 0 1 5 5v1"/></svg>',
  student:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="7" r="4"/><path d="M3 21v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 4 1.5"/><path d="M19 14v6M16 17h6"/></svg>',
  pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1"/><path d="M12 16v2"/></svg>'
 };
 return icons[key]||'';
}
async function renderTeacherHome(navigation){
 ensureTeacherHomeQuickStyle();
 let d=null,credit=null;
 const [homeResult,creditResult]=await Promise.allSettled([catalogCall('home'),edge(API.credit,{action:'packages'})]);
 if(homeResult.status==='fulfilled')d=homeResult.value;
 if(creditResult.status==='fulfilled')credit=creditResult.value;
 if(!navigationCurrent(navigation))return;
 const first=(S.profile.full_name||'Professor').trim().replace(/^professor\s+/i,'').split(/\s+/)[0];
 const actions=[],add=(label,route,intent='',extra={})=>{const id=actions.length;actions.push({route,intent,...extra});return `<button type="button" class="home-task" data-home-action="${id}"><span>${esc(label)}</span><span class="home-task-link">Abrir</span></button>`;};
 const pending=[];
 if(d?.pending)pending.push(add(`${d.pending} redaç${d.pending===1?'ão aguardando':'ões aguardando'} correção`,'correction','uncorrected'));
 if(d?.validation)pending.push(add(`${d.validation} correç${d.validation===1?'ão aguardando':'ões aguardando'} validação`,'correction','validation'));
 if(d?.drafts)pending.push(add(`${d.drafts} proposta${d.drafts===1?' em rascunho':'s em rascunho'}`,'proposals','drafts',{ids:d.proposal_tasks.filter(x=>!x.ready).map(x=>x.id)}));
 if(d?.ready)pending.push(add(`${d.ready} proposta${d.ready===1?' pronta':'s prontas'} para publicar`,'proposals','ready',{ids:d.proposal_tasks.filter(x=>x.ready).map(x=>x.id)}));
 const issues=(d?.issues||[]).map(x=>add(x.label,'teacher-organization',x.kind,{organization_id:x.organization_id,class_id:x.class_id,student_name:x.student_name}));
 if(d&&!d.has_organizations)issues.unshift(add('Cadastre sua primeira instituição e turma','teacher-organization','institution'));
 const priority=d?.pending||d?.validation?'correction':d&&!d.has_organizations?'class':d?.issues?.some(x=>x.kind==='import')?'import':d?.drafts||d?.ready?'proposals':'proposal';
 const quick=[['proposal','Nova proposta','proposals','create'],['correction','Corrigir redações','correction',d?.pending?'uncorrected':d?.validation?'validation':''],['import','Importar alunos','teacher-organization','import'],['class','Nova turma','teacher-organization','class'],['student','Novo aluno','teacher-organization','student'],['pin','Gerar / alterar PIN','teacher-organization','pin']];
 const shortcuts=quick.map(([key,label,route,intent])=>{const id=actions.length;actions.push({route,intent,organization_id:d?.default_organization,class_id:intent==='class'?null:d?.default_class});return `<button type="button" class="home-quick-card ${key===priority?'is-primary':''}" data-home-action="${id}"><span class="home-quick-icon">${teacherHomeQuickIcon(key)}</span><span class="home-quick-label">${esc(label)}</span></button>`;}).join('');
 const activities=(d?.activities||[]).map(x=>{const date=new Date(x.at),formatted=Number.isNaN(date.getTime())?'':date.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});return `<li>${add(x.label,x.route,'activity',{target:x.target})}<time datetime="${esc(x.at)}">${esc(formatted)}</time></li>`;}).join('');
 const balance=Number(credit?.balance),hasBalance=Number.isFinite(balance),creditWidth=hasBalance?Math.max(5,Math.min(100,Math.round(balance/200*100))):0;
 const creditBlock=`<section class="home-credit-card" aria-labelledby="homeCredits"><div class="home-credit-symbol"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg></div><div class="home-credit-main"><div class="home-credit-head"><div><h2 id="homeCredits">Créditos de IA</h2><p>1 crédito por correção ou proposta criada com IA.</p></div></div><div class="home-credit-balance"><strong>${hasBalance?balance:'—'}</strong><span>${hasBalance?'créditos disponíveis':'saldo indisponível'}</span></div><div class="home-credit-rule" aria-hidden="true"><span style="width:${creditWidth}%"></span></div><div class="home-credit-actions"><button type="button" class="btn primary" data-home-credit="buy">Comprar mais créditos</button><button type="button" class="btn ghost" data-home-credit="usage">Ver consumo</button></div></div></section>`;
 $('view').innerHTML=`<section class="teacher-home task-home"><header class="home-welcome"><div><p class="home-eyebrow">Seu espaço de trabalho</p><h1>Olá, ${esc(first)}.</h1><p>Veja o que precisa da sua atenção hoje.</p></div><button class="btn ghost" id="homeRefresh">Atualizar</button></header><section class="box" aria-labelledby="homePending"><div class="box-head"><h2 id="homePending">Pendências</h2></div><div class="box-body home-task-list">${d?(pending.join('')||'<p class="home-current">Você está em dia.</p>'):'<p class="home-notice" role="status">Não foi possível carregar suas tarefas. Clique em Atualizar para tentar novamente.</p>'}</div></section>${issues.length?`<section class="box" aria-labelledby="homeOrganization"><div class="box-head"><h2 id="homeOrganization">Organização necessária</h2></div><div class="box-body home-task-list">${issues.join('')}</div></section>`:''}<section aria-labelledby="homeActions"><h2 id="homeActions">Ações rápidas</h2><div class="home-quick-actions">${shortcuts}</div></section>${creditBlock}${activities?`<section aria-labelledby="homeActivity"><h2 id="homeActivity">Últimas atividades</h2><ul class="home-activity-list">${activities}</ul></section>`:''}</section>`;
 $('view').onclick=e=>{const creditButton=e.target.closest('[data-home-credit]');if(creditButton){navigate('teacher-account');return}const button=e.target.closest('[data-home-action]');if(!button)return;const a=actions[Number(button.dataset.homeAction)];if(!a)return;
 if(a.route==='teacher-organization'){S.organizationIntent=a.intent;S.catalogSelection={organization_id:a.organization_id,class_id:a.class_id};S.homeStudentName=a.student_name||null;}
 if(a.route==='correction')S.homeCorrection={filter:a.intent==='activity'?'':a.intent,target:a.target};
 if(a.route==='proposals')S.homeProposal={intent:a.intent,ids:a.ids,target:a.target};
 navigate(a.route);
 };
 $('homeRefresh').onclick=()=>navigate('home');
}
