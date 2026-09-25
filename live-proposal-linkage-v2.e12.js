'use strict';
(function(){
  const originalRenderLive=window.renderLive;

  function liveProposalTargets(round){
    return Array.isArray(round?.targets)?round.targets:[];
  }

  function fillCanonicalLiveDirectory(d,change){
    const orgSel=$('lvOrg'),clsSel=$('lvClass'),stSel=$('lvStudent'),rdSel=$('lvRound');
    if(!orgSel||!clsSel||!stSel||!rdSel||!d)return;

    const previousOrg=orgSel.value,previousClass=clsSel.value,previousStudent=stSel.value,previousRound=rdSel.value;

    if(!orgSel.options.length){
      orgSel.innerHTML='<option value="">Selecione</option>'+(d.orgs||[]).map(o=>`<option value="${esc(o.id)}">${esc(o.name)}</option>`).join('');
    }
    if(previousOrg&&[...orgSel.options].some(o=>o.value===previousOrg))orgSel.value=previousOrg;

    const oid=orgSel.value;
    const orgStudents=(d.students||[]).filter(s=>String(s.organization_id||'')===String(oid));
    const orgStudentIds=new Set(orgStudents.map(s=>String(s.id)));

    let orgClasses=(d.classes||[]).filter(c=>String(c.organization_id||'')===String(oid));
    if(!orgClasses.length&&oid){
      const ids=new Set((d.enr||[]).filter(e=>orgStudentIds.has(String(e.student_id))).map(e=>String(e.class_id)));
      orgClasses=(d.classes||[]).filter(c=>ids.has(String(c.id)));
    }
    const orgClassIds=new Set(orgClasses.map(c=>String(c.id)));

    if(change==='org'||![...clsSel.options].some(o=>o.value===previousClass)){
      clsSel.innerHTML='<option value="">Selecione</option>'+orgClasses.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
      if(change!=='org'&&previousClass&&[...clsSel.options].some(o=>o.value===previousClass))clsSel.value=previousClass;
    }else if(!clsSel.options.length){
      clsSel.innerHTML='<option value="">Selecione</option>'+orgClasses.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    }

    const cid=clsSel.value;
    const eligibleStudentIds=cid
      ?new Set((d.enr||[]).filter(e=>String(e.class_id)===String(cid)).map(e=>String(e.student_id)))
      :orgStudentIds;
    const eligibleStudents=orgStudents.filter(s=>eligibleStudentIds.has(String(s.id)));

    if(change!=='student'){
      stSel.innerHTML='<option value="">Selecione</option>'+eligibleStudents.map(s=>`<option value="${esc(s.id)}">${esc(s.full_name)}</option>`).join('');
      if(change!=='class'&&previousStudent&&[...stSel.options].some(o=>o.value===previousStudent))stSel.value=previousStudent;
    }

    const sid=stSel.value;
    const rounds=(d.rounds||[]).filter(r=>{
      const targets=liveProposalTargets(r);
      if(targets.length){
        if(sid&&targets.some(t=>String(t.student_id||'')===String(sid)))return true;
        if(cid&&targets.some(t=>String(t.class_id||'')===String(cid)))return true;
        if(!cid&&oid&&targets.some(t=>(t.class_id&&orgClassIds.has(String(t.class_id)))||(t.student_id&&orgStudentIds.has(String(t.student_id)))))return true;
        return false;
      }
      return !!oid&&String(one(r.projects)?.organization_id||'')===String(oid);
    });

    rdSel.innerHTML='<option value="">Selecione</option>'+rounds.map(r=>`<option value="${esc(r.id)}">R${esc(r.number??'—')} · ${esc(r.theme||'Proposta')}</option>`).join('');
    if(previousRound&&[...rdSel.options].some(o=>o.value===previousRound))rdSel.value=previousRound;
  }

  window.liveFill=fillCanonicalLiveDirectory;

  if(typeof originalRenderLive==='function'){
    window.renderLive=async function(navigation){
      await originalRenderLive(navigation);
      if(S.route!=='live')return;
      const d=S.cache.directory;
      if(!d)return;
      fillCanonicalLiveDirectory(d);
      const org=$('lvOrg'),cls=$('lvClass'),student=$('lvStudent');
      if(org)org.onchange=()=>fillCanonicalLiveDirectory(d,'org');
      if(cls)cls.onchange=()=>fillCanonicalLiveDirectory(d,'class');
      if(student)student.onchange=()=>fillCanonicalLiveDirectory(d,'student');
    };
  }
})();
