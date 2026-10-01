'use strict';

// Direciona cada item do submenu Escolas para sua finalidade sem alterar
// o módulo homologado de gestão/importação. Apenas leituras são feitas aqui.
const baseRenderTeacherOrganization=renderTeacherOrganization;

renderTeacherOrganization=async function(navigation){
  const route=S.route;
  const section=route==='teacher-import'?'import':route==='teacher-classes'?'classes':route==='teacher-students'?'students':'schools';
  if(section==='schools'||S.catalogSelection?.organization_id||S.organizationIntent){
    return baseRenderTeacherOrganization(navigation);
  }

  const data=await catalogCall('organizations');
  if(!navigationCurrent(navigation))return;
  const allOrganizations=[...(data.organizations||[])];
  const organizations=allOrganizations.filter(o=>o.is_active!==false).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base',numeric:true}));
  const config={
    classes:{title:'Turmas',subtitle:'Escolha a escola para criar e gerenciar suas turmas.',card:'Gerenciar turmas',missing:'Para acessar Turmas, cadastre uma escola primeiro. Deseja ir para o cadastro de escola?'},
    students:{title:'Alunos',subtitle:'Escolha a escola e depois a turma para consultar alunos e gerenciar PINs.',card:'Escolher turma',missing:'Para acessar Alunos, cadastre uma escola primeiro. Deseja ir para o cadastro de escola?'},
    import:{title:'Importar alunos',subtitle:'Escolha a escola e a turma de destino para iniciar a importação.',card:'Escolher destino',missing:'Para importar alunos, cadastre uma escola primeiro. Deseja ir para o cadastro de escola?'}
  }[section];

  const goToSchoolRegistration=async()=>{
    const confirmed=await appConfirm(config.missing);
    if(!navigationCurrent(navigation)||!confirmed)return;
    S.organizationIntent='institution';
    navigate('teacher-organization');
  };

  if(!organizations.length){
    const hasHidden=allOrganizations.length>0;
    $('view').innerHTML=header(config.title,config.subtitle)+`<section class="teacher-org-page org-redesign"><div class="box box-body"><h2>${hasHidden?'Nenhuma escola ativa':'Nenhuma escola cadastrada'}</h2><p>${hasHidden?'Reative uma escola para continuar.':'Cadastre uma escola para continuar.'}</p><button type="button" class="btn primary" id="dependencySchool">${hasHidden?'Abrir Escolas':'Cadastrar escola'}</button></div></section>`;
    if(hasHidden){
      const openSchools=()=>navigate('teacher-organization');
      $('dependencySchool').onclick=openSchools;
      const confirmed=await appConfirm('Não há escola ativa. Deseja abrir Escolas para reativar uma escola?');
      if(navigationCurrent(navigation)&&confirmed)openSchools();
    }else{
      $('dependencySchool').onclick=goToSchoolRegistration;
      await goToSchoolRegistration();
    }
    return;
  }

  const openOrganization=async organizationId=>{
    if(!navigationCurrent(navigation))return;
    if(section==='students'||section==='import'){
      const base=await catalogCall('base',{organization_id:organizationId});
      if(!navigationCurrent(navigation))return;
      if(!(base.classes||[]).some(c=>c.is_active!==false)){
        const label=section==='students'?'Alunos':'Importar alunos';
        const goToClasses=()=>{S.catalogSelection={organization_id:organizationId};S.organizationIntent='class';navigate('teacher-classes');};
        $('view').innerHTML=header(config.title,config.subtitle)+`<section class="teacher-org-page org-redesign"><div class="box box-body"><h2>Nenhuma turma cadastrada</h2><p>Esta escola precisa ter pelo menos uma turma para continuar.</p><button type="button" class="btn primary" id="dependencyClass">Criar turma</button></div></section>`;
        $('dependencyClass').onclick=goToClasses;
        const confirmed=await appConfirm(`Para acessar ${label}, esta escola precisa ter pelo menos uma turma. Deseja ir para Turmas e criar uma agora?`);
        if(navigationCurrent(navigation)&&confirmed)goToClasses();
        return;
      }
    }
    S.catalogSelection={organization_id:organizationId};
    if(section==='import')S.organizationIntent='import';
    await baseRenderTeacherOrganization(navigation);
  };

  if(organizations.length===1){
    await openOrganization(organizations[0].id);
    return;
  }

  $('view').innerHTML=header(config.title,config.subtitle)+`<section class="teacher-org-page org-redesign"><section id="orgRouteDirectory"><div class="org-directory-toolbar"><label class="field"><small>Buscar escola</small><input id="orgRouteSearch" type="search" placeholder="Nome da escola ou curso"></label></div><div class="org-directory-meta"><span id="orgRouteCount"></span></div><div id="orgRouteCards" class="org-card-grid"></div><p id="orgRouteEmpty" class="safe-note" hidden>Nenhuma escola encontrada.</p></section></section>`;
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const render=()=>{
    const term=normalize($('orgRouteSearch').value.trim());
    const rows=organizations.filter(o=>normalize(o.name).includes(term));
    $('orgRouteCount').textContent=rows.length===1?'1 escola':`${rows.length} escolas`;
    $('orgRouteCards').innerHTML=rows.map(o=>`<button type="button" class="org-institution-card" data-route-org="${esc(o.id)}"><span class="org-card-top"><span class="org-monogram" aria-hidden="true">${esc(o.name.trim().slice(0,1).toUpperCase())}</span><span class="pill ok">Ativa</span></span><strong>${esc(o.name)}</strong><span class="org-card-link">${esc(config.card)} <span aria-hidden="true">→</span></span></button>`).join('');
    $('orgRouteEmpty').hidden=rows.length>0;
  };
  $('orgRouteSearch').oninput=render;
  $('orgRouteCards').onclick=e=>{
    const button=e.target.closest('[data-route-org]');
    if(button)openOrganization(button.dataset.routeOrg);
  };
  render();
};
