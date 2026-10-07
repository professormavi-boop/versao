'use strict';
(function(root){
 const W=root.WritingStages;
 const unavailable='A correção por etapas está em preparação. O envio ainda não está habilitado; nenhum crédito foi utilizado.';
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let serial=0;
 function mount(host,{value='complete',onChange=()=>{}}={}){
  let selected=W.scope(value);const group='writing-scope-'+(++serial);
  host.innerHTML=`<fieldset class="form-section"><legend>O que deseja corrigir?</legend><div class="writing-stage-options">${[['complete','Redação completa'],...Object.entries(W.stages).map(([k,v])=>[k,v.label])].map(([key,label])=>`<label class="check-row"><input type="radio" name="${group}" value="${key}" ${key===selected?'checked':''}> ${label}</label>`).join('')}</div><p data-stage-description aria-live="polite"></p></fieldset>`;
  function explain(){host.querySelector('[data-stage-description]').textContent=selected==='complete'?'Análise do texto completo pelas cinco competências.':W.stages[selected].criteria.join(' · ')+'. Devolutiva formativa, sem nota ENEM. '+unavailable;}
  host.querySelectorAll('input').forEach(el=>el.onchange=()=>{if(!el.checked)return;selected=W.scope(el.value);explain();onChange(selected);});
  explain();return {value:()=>selected};
 }
 function assertReady(stage){if(W.scope(stage)!=='complete')throw Error(unavailable);}
 function isPartial(value){return value?.mode==='partial'||value?.report_format==='partial-v1';}
 function feedbackHtml(value){
  const fail=()=>'<section class="tl-card"><h2>Devolutiva por etapa indisponível</h2><p>O resultado recebido está incompleto ou incompatível. Nenhuma nota foi calculada.</p></section>';
  let contract;try{contract=W.feedbackContract({stage:value?.stage});}catch{return fail();}
  if(!isPartial(value)||contract.mode!=='partial'||!Array.isArray(value.criteria)||!Array.isArray(value.deviations))return fail();
  const allowed=new Set(contract.criteria),seen=new Set();
  for(const item of value.criteria){
   if(!item||!allowed.has(item.name)||seen.has(item.name)||!contract.statuses.includes(item.status)||typeof item.feedback!=='string')return fail();
   seen.add(item.name);
  }
  if(seen.size!==allowed.size||['strength','improvement','next_step','context_limitations'].some(k=>typeof value[k]!=='string'))return fail();
  if(value.deviations.some(d=>!d||['excerpt','explanation','suggestion'].some(k=>typeof d[k]!=='string')))return fail();
  const labels={achieved:'Atingiu',partial:'Atingiu parcialmente',needs_work:'Precisa desenvolver',insufficient_context:'Contexto insuficiente'};
  return `<section class="tl-card writing-partial-result"><h2>${escape(W.stages[value.stage].label)} · Devolutiva</h2><p>Esta análise considera apenas a etapa selecionada e não atribui nota ENEM.</p>${value.criteria.map(c=>`<article class="tl-competency-card"><h3>${escape(c.name)}</h3><p><b>${labels[c.status]}</b></p><p>${escape(c.feedback)}</p>${typeof c.evidence==='string'&&c.evidence?`<blockquote>${escape(c.evidence)}</blockquote>`:''}</article>`).join('')}<h3>Ponto forte</h3><p>${escape(value.strength)}</p><h3>Ponto a melhorar</h3><p>${escape(value.improvement)}</p><h3>Próximo passo</h3><p>${escape(value.next_step)}</p><h3>Desvios de linguagem</h3>${value.deviations.map(d=>`<article><p><b>Trecho:</b> ${escape(d.excerpt)}</p><p>${escape(d.explanation)}</p><p><b>Sugestão:</b> ${escape(d.suggestion)}</p></article>`).join('')||'<p>Nenhum desvio apontado nesta análise.</p>'}${value.context_limitations?`<p><b>Limites da análise:</b> ${escape(value.context_limitations)}</p>`:''}</section>`;
 }
 root.WritingStagesUI=Object.freeze({mount,assertReady,isPartial,feedbackHtml,unavailable});
})(globalThis);
