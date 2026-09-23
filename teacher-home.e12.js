'use strict';
async function renderTeacherHome(navigation){
 let d=null;try{d=await catalogCall('home');}catch{}
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
 const quick=[['proposal','Nova proposta','proposals','create'],['correction','Corrigir redações','correction',d?.pending?'uncorrected':d?.validation?'validation':''],['import','Importar alunos','teacher-organization','import'],['class','Nova turma','teacher-organization','class'],['student','Novo aluno','teacher-organization','student']];
 const shortcuts=quick.map(([key,label,route,intent])=>{const id=actions.length;actions.push({route,intent,organization_id:d?.default_organization,class_id:intent==='class'?null:d?.default_class});return `<button type="button" class="btn ${key===priority?'primary':'soft-btn'}" data-home-action="${id}">${label}</button>`;}).join('');
 const activities=(d?.activities||[]).map(x=>{const date=new Date(x.at),formatted=Number.isNaN(date.getTime())?'':date.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});return `<li>${add(x.label,x.route,'activity',{target:x.target})}<time datetime="${esc(x.at)}">${esc(formatted)}</time></li>`;}).join('');
 $('view').innerHTML=`<section class="teacher-home task-home"><header class="home-welcome"><div><p class="home-eyebrow">Seu espaço de trabalho</p><h1>Olá, ${esc(first)}.</h1><p>Veja o que precisa da sua atenção hoje.</p></div><button class="btn ghost" id="homeRefresh">Atualizar</button></header><section class="box" aria-labelledby="homePending"><div class="box-head"><h2 id="homePending">Pendências</h2></div><div class="box-body home-task-list">${d?(pending.join('')||'<p class="home-current">Você está em dia.</p>'):'<p class="home-notice" role="status">Não foi possível carregar suas tarefas. Clique em Atualizar para tentar novamente.</p>'}</div></section>${issues.length?`<section class="box" aria-labelledby="homeOrganization"><div class="box-head"><h2 id="homeOrganization">Organização necessária</h2></div><div class="box-body home-task-list">${issues.join('')}</div></section>`:''}<section aria-labelledby="homeActions"><h2 id="homeActions">Ações rápidas</h2><div class="home-quick-actions">${shortcuts}</div></section>${activities?`<section aria-labelledby="homeActivity"><h2 id="homeActivity">Últimas atividades</h2><ul class="home-activity-list">${activities}</ul></section>`:''}</section>`;
 $('view').onclick=e=>{const button=e.target.closest('[data-home-action]');if(!button)return;const a=actions[Number(button.dataset.homeAction)];if(!a)return;
 if(a.route==='teacher-organization'){S.organizationIntent=a.intent;S.catalogSelection={organization_id:a.organization_id,class_id:a.class_id};S.homeStudentName=a.student_name||null;}
 if(a.route==='correction')S.homeCorrection={filter:a.intent==='activity'?'':a.intent,target:a.target};
 if(a.route==='proposals')S.homeProposal={intent:a.intent,ids:a.ids,target:a.target};
 navigate(a.route);
 };
 $('homeRefresh').onclick=()=>navigate('home');
}
