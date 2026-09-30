'use strict';

(function(){
  if(typeof buildNav!=='function'||typeof setActive!=='function'||typeof renderTeacherOrganization!=='function')return;

  const originalBuildNav=buildNav;
  const originalSetActive=setActive;
  const originalRenderTeacherOrganization=renderTeacherOrganization;

  const schoolSections={
    overview:'Organize suas escolas, turmas e alunos em um só lugar.',
    classes:'Escolha uma escola para visualizar e organizar as turmas.',
    students:'Escolha uma escola e uma turma para visualizar os alunos.',
    import:'Escolha uma escola e uma turma para importar alunos.'
  };

  function currentSchoolSection(){
    if(S.organizationIntent==='import')return'import';
    return S.teacherSchoolSection||'overview';
  }

  function applySchoolLanguage(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const parent=node.parentElement;
      if(!parent||parent.closest('script,style'))return;
      node.nodeValue=node.nodeValue
        .replace(/Instituições/g,'Escolas')
        .replace(/instituições/g,'escolas')
        .replace(/Instituição/g,'Escola')
        .replace(/instituição/g,'escola');
    });
    root.querySelectorAll('input[placeholder]').forEach(input=>{
      input.placeholder=input.placeholder
        .replace(/instituições/g,'escolas')
        .replace(/instituição/g,'escola')
        .replace(/Instituições/g,'Escolas')
        .replace(/Instituição/g,'Escola');
    });
  }

  buildNav=function(){
    originalBuildNav();
    if(S.profile?.role!=='teacher'||!BETA_PROPOSALS)return;
    const nav=$('nav');
    const organizationButton=nav?.querySelector('button[data-route="teacher-organization"]');
    if(!nav||!organizationButton)return;

    const group=document.createElement('details');
    group.className='admin-nav-group teacher-school-nav';
    group.innerHTML=`<summary>Minhas escolas</summary>
      <button type="button" data-route="teacher-organization" data-school-section="overview">Visão geral</button>
      <button type="button" data-route="teacher-organization" data-school-section="classes">Turmas</button>
      <button type="button" data-route="teacher-organization" data-school-section="students">Alunos</button>
      <button type="button" data-route="teacher-organization" data-school-section="import">Importar alunos</button>`;
    organizationButton.replaceWith(group);

    const fallbackHandler=nav.onclick;
    nav.onclick=e=>{
      const button=e.target.closest('[data-route]');
      if(!button)return;
      if(button.closest('.teacher-school-nav')){
        const section=button.dataset.schoolSection||'overview';
        S.teacherSchoolSection=section;
        S.organizationIntent=section==='import'?'import':null;
        S.catalogSelection=null;
        navigate('teacher-organization');
        closeDrawer();
        return;
      }
      fallbackHandler?.call(nav,e);
    };
  };

  setActive=function(route){
    originalSetActive(route);
    const group=document.querySelector('#nav .teacher-school-nav');
    if(!group)return;
    const buttons=group.querySelectorAll('button[data-school-section]');
    if(route!=='teacher-organization'){
      buttons.forEach(button=>button.classList.remove('active'));
      return;
    }
    group.open=true;
    const section=currentSchoolSection();
    buttons.forEach(button=>button.classList.toggle('active',button.dataset.schoolSection===section));
  };

  renderTeacherOrganization=async function(navigation){
    await originalRenderTeacherOrganization(navigation);
    if(!navigationCurrent(navigation))return;
    const view=$('view');
    const section=currentSchoolSection();
    applySchoolLanguage(view);
    const title=view.querySelector('.page-head h1');
    const subtitle=view.querySelector('.page-head p');
    if(title)title.textContent='Minhas escolas';
    if(subtitle)subtitle.textContent=schoolSections[section]||schoolSections.overview;
  };
})();
