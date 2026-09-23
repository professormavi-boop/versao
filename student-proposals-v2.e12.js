'use strict';
(function(){
  function ensureStudentProposalV2Style(){
    if(document.getElementById('studentProposalV2Style'))return;
    const style=document.createElement('style');
    style.id='studentProposalV2Style';
    style.textContent=`
      .spv{max-width:860px;margin:0 auto}.spv-list{display:grid;gap:12px}.spv-card{width:100%;border:1px solid var(--line);border-radius:20px;background:#fff;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;text-align:left;cursor:pointer;box-shadow:0 7px 24px rgba(57,31,28,.04)}.spv-card:hover{border-color:#d9c6c2}.spv-card-main{min-width:0}.spv-card-top{display:flex;align-items:center;gap:10px;margin-bottom:8px}.spv-round{display:inline-flex;padding:6px 9px;border-radius:10px;background:var(--soft);color:var(--crimson);font-weight:900}.spv-status{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:12px;font-weight:800}.spv-status.available{background:#e9f6ed;color:#257247}.spv-status.sent{background:#fff4df;color:#936424}.spv-status.approved{background:#e9f6ed;color:#257247}.spv-card h2{font-size:18px;line-height:1.32;margin:0}.spv-card p{margin:7px 0 0;color:var(--muted);font-size:14px}.spv-arrow{font-size:27px;color:var(--crimson);line-height:1}
      .spv-back{border:0;background:transparent;color:var(--crimson);font-weight:800;padding:4px 0 12px;cursor:pointer}.spv-panel{border:1px solid var(--line);border-radius:22px;background:#fff;padding:20px;box-shadow:0 7px 24px rgba(57,31,28,.04)}.spv-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.spv-title-row h2{margin:6px 0 0;font-size:23px;line-height:1.28}.spv-lead{color:var(--muted);line-height:1.5;margin:14px 0 18px}.spv-info-grid{display:grid;gap:10px}.spv-info{border:1px solid #eee7e4;border-radius:16px;background:#fcfaf9;padding:14px;display:grid;grid-template-columns:42px minmax(0,1fr);gap:12px;align-items:start}.spv-info-icon{width:42px;height:42px;border-radius:12px;background:var(--soft);color:var(--crimson);display:grid;place-items:center}.spv-info-icon svg{width:23px;height:23px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.spv-info b{display:block;margin-bottom:3px}.spv-info span{color:var(--muted);line-height:1.4}.spv-actions{display:grid;gap:9px;margin-top:16px}.spv-actions .btn{width:100%;justify-content:center;min-height:48px}.spv-primary{background:linear-gradient(145deg,var(--crimson),var(--crimson2))!important;color:#fff!important;border-color:var(--crimson)!important}
      .spv-full-note{border:1px solid #dfe6ef;border-radius:14px;background:#f6f8fb;padding:12px 14px;margin-bottom:14px;color:#4f5c70}.spv-full-section{border:1px solid var(--line);border-radius:18px;background:#fff;padding:17px;margin-top:12px}.spv-full-section h3{margin:0 0 10px;font-size:17px}.spv-full-section p{line-height:1.55;color:#575d68}.spv-full-section img{display:block;max-width:100%;height:auto;border-radius:12px;margin-top:10px}.spv-full-section a{color:var(--crimson);font-weight:800}
      .spv-send-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:16px}.spv-send-option{aspect-ratio:1/1;border:1px solid var(--line);border-radius:20px;background:#fff;color:var(--crimson);padding:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;font-weight:850;cursor:pointer}.spv-send-option.primary{background:linear-gradient(145deg,var(--crimson),var(--crimson2));color:#fff;border-color:var(--crimson)}.spv-send-option:disabled{opacity:.48;cursor:not-allowed}.spv-send-option svg{width:32px;height:32px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.spv-lock{margin-top:14px}.spv-send-back{margin-top:12px}
      [data-send-round] .item-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}[data-send-round] .item-actions .btn{aspect-ratio:1/1;min-height:0!important;width:100%!important;white-space:normal;line-height:1.2;justify-content:center;text-align:center;padding:12px;border-radius:18px}
      @media(max-width:620px){.spv-card{padding:15px;border-radius:18px}.spv-title-row h2{font-size:20px}.spv-panel{padding:16px;border-radius:18px}.spv-send-grid{gap:8px}.spv-send-option{border-radius:17px;padding:10px;font-size:14px}.spv-send-option svg{width:28px;height:28px}[data-send-round] .item-actions{gap:8px!important}[data-send-round] .item-actions .btn{padding:9px;font-size:13px;border-radius:16px}}
    `;
    document.head.appendChild(style);
  }

  const icons={
    prompt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 11h6M9 15h6"/></svg>',
    texts:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22zM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22z"/></svg>',
    status:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    camera:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h4l1.5-2h5L16 7h4v12H4z"/><circle cx="12" cy="13" r="4"/></svg>',
    file:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4"/></svg>',
    paste:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5V3h6v2M9 10h6M9 14h6M9 18h4"/></svg>'
  };

  let spvData=null;

  function stateInfo(state){
    const sub=state?.submission,file=state?.file;
    if(sub?.status==='approved')return {label:'Aprovada',cls:'approved',detail:'Sua redação já foi corrigida e aprovada.',editable:false};
    if(sub&&file&&state?.editable===true)return {label:'Enviada',cls:'sent',detail:'Sua redação foi enviada. Você ainda pode substituí-la enquanto a correção não começou.',editable:true};
    if(sub&&file)return {label:'Enviada',cls:'sent',detail:'Sua redação já foi enviada e a correção começou.',editable:false};
    if(sub)return {label:'Envio incompleto',cls:'sent',detail:'Há um envio iniciado para esta proposta.',editable:state?.editable===true};
    return {label:'Disponível',cls:'available',detail:'Esta proposta está disponível para envio.',editable:state?.editable===true};
  }

  function trimText(value,max=300){
    const text=String(value||'').replace(/\s+/g,' ').trim();
    if(text.length<=max)return text;
    return text.slice(0,max).replace(/\s+\S*$/,'')+'…';
  }

  function safeUrl(value){return /^https?:\/\//i.test(String(value||''))?String(value):''}

  async function loadProposalData(){
    const p=await studentProposals(true),rounds=p.proposals||[],ids=rounds.map(r=>r.id);
    let states=[];
    try{states=ids.length?(await studentSubmitJson({action:'states',round_ids:ids})).states||[]:[]}catch{states=[]}
    spvData={rounds,stateMap:new Map(states.map(s=>[s.round_id,s]))};
    return spvData;
  }

  function renderList(){
    if(S.route!=='student-proposals'||!spvData)return;
    const cards=spvData.rounds.map(round=>{
      const info=stateInfo(spvData.stateMap.get(round.id));
      return `<button type="button" class="spv-card" data-spv-open="${esc(round.id)}"><div class="spv-card-main"><div class="spv-card-top"><span class="spv-round">R${esc(round.number??'—')}</span><span class="spv-status ${info.cls}">${esc(info.label)}</span></div><h2>${esc(round.theme||'Proposta de redação')}</h2><p>Toque para ver o resumo da proposta.</p></div><span class="spv-arrow">›</span></button>`;
    }).join('');
    $('view').innerHTML=header('Propostas','Escolha um tema para ver o resumo antes da leitura completa.')+`<section class="spv"><div class="spv-list">${cards||'<div class="empty">Nenhuma proposta disponível.</div>'}</div></section>`;
    bindClicks();
  }

  function renderSummary(round){
    if(S.route!=='student-proposals')return;
    const state=spvData?.stateMap.get(round.id),info=stateInfo(state),motivators=Array.isArray(round.motivators)?round.motivators:[];
    const summary=trimText(round.understand_prompt||round.proposal_command||'',330)||'Leia a proposta completa para conferir todos os detalhes do tema.';
    const sendLabel=info.editable?(state?.submission?'Substituir redação':'Enviar redação'):'Ver minhas redações';
    $('view').innerHTML=header('Resumo da proposta','Veja o essencial antes de decidir se quer ler todo o material.')+`<section class="spv"><button type="button" class="spv-back" data-spv-list>← Voltar às propostas</button><article class="spv-panel"><div class="spv-title-row"><div><span class="spv-round">R${esc(round.number??'—')}</span><h2>${esc(round.theme||'Proposta de redação')}</h2></div><span class="spv-status ${info.cls}">${esc(info.label)}</span></div><p class="spv-lead">${esc(summary)}</p><div class="spv-info-grid"><div class="spv-info"><span class="spv-info-icon">${icons.prompt}</span><div><b>O que o tema pede</b><span>${esc(trimText(round.proposal_command||round.understand_prompt||'',190)||'Produzir uma redação dissertativo-argumentativa sobre o tema apresentado.')}</span></div></div><div class="spv-info"><span class="spv-info-icon">${icons.texts}</span><div><b>Textos motivadores</b><span>${motivators.length} texto${motivators.length===1?'':'s'} para leitura e análise.</span></div></div><div class="spv-info"><span class="spv-info-icon">${icons.status}</span><div><b>Situação da redação</b><span>${esc(info.detail)}</span></div></div></div><div class="spv-actions"><button type="button" class="btn primary spv-primary" data-spv-send="${esc(round.id)}">${esc(sendLabel)}</button><button type="button" class="btn soft-btn" data-spv-full="${esc(round.id)}">Ler proposta completa</button><button type="button" class="btn ghost" data-spv-list>Voltar às propostas</button></div></article></section>`;
    bindClicks();
  }

  function renderFull(round){
    if(S.route!=='student-proposals')return;
    const state=spvData?.stateMap.get(round.id),info=stateInfo(state),motivators=Array.isArray(round.motivators)?round.motivators:[];
    const motivatorHtml=motivators.map((m,i)=>{const asset=safeUrl(m.asset_url),source=safeUrl(m.source_url);return `<section class="spv-full-section"><h3>Texto motivador ${i+1}${m.title?' — '+esc(m.title):''}</h3><p>${esc(m.body||'')}</p>${asset?`<img src="${esc(asset)}" alt="${esc(m.caption||m.title||'Imagem do texto motivador')}" loading="lazy">`:''}${source?`<p><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(m.source_label||'Consultar fonte')}</a></p>`:m.source_label?`<p>${esc(m.source_label)}</p>`:''}</section>`}).join('');
    $('view').innerHTML=header('Proposta completa','Leia o comando e os textos motivadores.')+`<section class="spv"><button type="button" class="spv-back" data-spv-summary="${esc(round.id)}">← Voltar ao resumo</button><div class="spv-full-note">Você está visualizando a proposta completa. Volte ao resumo a qualquer momento.</div><article class="spv-panel"><div class="spv-title-row"><div><span class="spv-round">R${esc(round.number??'—')}</span><h2>${esc(round.theme||'Proposta de redação')}</h2></div><span class="spv-status ${info.cls}">${esc(info.label)}</span></div>${round.proposal_command?`<section class="spv-full-section"><h3>Comando da proposta</h3><p>${esc(round.proposal_command)}</p></section>`:''}${round.understand_prompt?`<section class="spv-full-section"><h3>Entenda o que o tema está pedindo</h3><p>${esc(round.understand_prompt)}</p></section>`:''}${motivatorHtml}<div class="spv-actions"><button type="button" class="btn primary spv-primary" data-spv-send="${esc(round.id)}">${info.editable?(state?.submission?'Substituir redação':'Enviar redação'):'Ver minhas redações'}</button><button type="button" class="btn ghost" data-spv-summary="${esc(round.id)}">Voltar ao resumo</button></div></article></section>`;
    bindClicks();
  }

  function renderSend(round){
    if(S.route!=='student-proposals')return;
    const state=spvData?.stateMap.get(round.id),info=stateInfo(state),sub=state?.submission;
    if(!info.editable){navigate('student-essays');return}
    $('view').innerHTML=header('Enviar redação','Escolha uma das formas de envio.')+`<section class="spv"><button type="button" class="spv-back" data-spv-summary="${esc(round.id)}">← Voltar ao resumo</button><article class="spv-panel"><div class="spv-title-row"><div><span class="spv-round">R${esc(round.number??'—')}</span><h2>${esc(round.theme||'Proposta de redação')}</h2></div><span class="spv-status ${info.cls}">${esc(info.label)}</span></div><div class="spv-send-grid"><button type="button" class="spv-send-option primary" data-v2-camera="${esc(round.id)}">${icons.camera}<span>${sub?'Substituir por foto':'Tirar foto'}</span></button><button type="button" class="spv-send-option" data-v2-file="${esc(round.id)}">${icons.file}<span>${sub?'Substituir arquivo':'Selecionar arquivo'}</span></button><button type="button" class="spv-send-option" data-v2-paste="${esc(round.id)}">${icons.paste}<span>Colar redação</span></button></div><div class="safe-note spv-lock"><b>Arquivos:</b> JPG, PNG, WEBP ou PDF de uma página, até 15 MB.<br><b>Texto:</b> copie do Word ou Google Docs e escolha “Colar redação”.</div><button type="button" class="btn ghost full spv-send-back" data-spv-summary="${esc(round.id)}">Voltar ao resumo</button></article></section>`;
    bindClicks();
  }

  function roundById(id){return spvData?.rounds.find(r=>String(r.id)===String(id))}

  function bindClicks(){
    $('view').onclick=e=>{
      let target=e.target.closest('[data-spv-open]');if(target){const round=roundById(target.dataset.spvOpen);if(round)renderSummary(round);return}
      target=e.target.closest('[data-spv-list]');if(target){renderList();return}
      target=e.target.closest('[data-spv-summary]');if(target){const round=roundById(target.dataset.spvSummary);if(round)renderSummary(round);return}
      target=e.target.closest('[data-spv-full]');if(target){const round=roundById(target.dataset.spvFull);if(round)renderFull(round);return}
      target=e.target.closest('[data-spv-send]');if(target){const round=roundById(target.dataset.spvSend);if(!round)return;const info=stateInfo(spvData?.stateMap.get(round.id));if(info.editable)renderSend(round);else navigate('student-essays')}
    };
  }

  async function renderStudentProposalsV2(navigation){
    ensureStudentProposalV2Style();
    try{await loadProposalData();if(!navigationCurrent(navigation))return;renderList()}
    catch(error){if(!navigationCurrent(navigation))return;$('view').innerHTML=header('Propostas','Não foi possível carregar as propostas.')+`<div class="card"><p>${esc(error.message||error)}</p><button class="btn primary" id="spvRetry">Tentar novamente</button></div>`;$('spvRetry').onclick=()=>navigate('student-proposals')}
  }

  ensureStudentProposalV2Style();
  window.renderStudentProposals=renderStudentProposalsV2;
})();
