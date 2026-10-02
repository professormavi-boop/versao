'use strict';
(async()=>{
 const host=document.getElementById('shared'),token=location.hash.slice(1);
 const text=(tag,value)=>{const node=document.createElement(tag);node.textContent=String(value??'');host.append(node);return node;};
 if(!/^[a-f0-9]{64}$/.test(token)){host.textContent='Este link é inválido.';return;}
 try{
  const response=await fetch('https://huccxcpwoydwuisrmboc.supabase.co/rest/v1/rpc/read_live_share',{method:'POST',headers:{apikey:'sb_publishable_KzojVBVP3GvVbSgO_w0mUA_-s8r7VdR','Content-Type':'application/json'},body:JSON.stringify({p_token:token}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error();const data=await response.json();
  if(!data){host.textContent='Este link expirou ou foi revogado. Peça um novo link a quem compartilhou.';return;}
  host.replaceChildren();if(data.student_label)text('h2',data.student_label);if(data.school_label)text('p',data.school_label);text('h2',data.theme);
  text('p',data.reviewed_by_teacher?'Devolutiva revisada pelo professor.':'Estimativa por IA · sem revisão de professor. Não é uma nota oficial do ENEM.');if(data.theme_origin==='inferred')text('p','C2 avaliada pelo recorte inferido e confirmado, sem aferição da proposta original.');
  const review=data.review;text('h2','Nota: '+review.total_score);
  for(const code of ['C1','C2','C3','C4','C5']){text('h3',code+' · '+review.competencies[code].score);text('p',review.competencies[code].diagnostic);}
  for(const [label,value] of [['Ponto forte',review.main_strength],['Prioridade de melhoria',review.improvement_priority],['Próximo passo',review.next_step||review.overall_feedback]]){text('h3',label);text('p',value);}
  if(review.c1_deviations?.length){text('h3','Desvios e sugestões');for(const item of review.c1_deviations)text('p',`${item.original} → ${item.correction}. ${item.rule}`);}
  if(review.c5_check){text('h3','Proposta de intervenção');for(const [key,label] of [['agent','Agente'],['action','Ação'],['means','Meio/modo'],['purpose','Finalidade'],['detail','Detalhamento']])text('p',label+': '+(review.c5_check[key]||'Não identificado'));}
 }catch{host.textContent='Não foi possível abrir a devolutiva. Tente novamente mais tarde.';}
})();
