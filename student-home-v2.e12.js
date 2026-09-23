'use strict';
(function(){
  function ensureStudentHomeV2Style(){
    if(document.getElementById('studentHomeV2Style'))return;
    const style=document.createElement('style');
    style.id='studentHomeV2Style';
    style.textContent=`
    .student-home-v2{max-width:1040px;margin:0 auto}
    .student-home-v2 .sh-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}
    .student-home-v2 .sh-metric{min-height:126px;border:1px solid var(--line);border-radius:22px;background:#fff;padding:18px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 7px 24px rgba(57,31,28,.04)}
    .student-home-v2 .sh-metric-top{display:flex;align-items:center;gap:10px;color:var(--muted);font-weight:700}
    .student-home-v2 .sh-icon{width:44px;height:44px;border-radius:14px;background:var(--soft);color:var(--crimson);display:grid;place-items:center;flex:0 0 auto}
    .student-home-v2 .sh-icon svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    .student-home-v2 .sh-metric strong{font-size:34px;line-height:1;color:#20242b}
    .student-home-v2 .sh-profile{border:1px solid var(--line);border-radius:22px;background:linear-gradient(145deg,#fff 0%,#fffafa 100%);padding:20px;display:flex;align-items:center;gap:16px;margin-bottom:16px}
    .student-home-v2 .sh-avatar{width:62px;height:62px;border-radius:50%;background:var(--soft);color:var(--crimson);display:grid;place-items:center;flex:0 0 auto}
    .student-home-v2 .sh-avatar svg{width:34px;height:34px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .student-home-v2 .sh-profile small{display:block;color:var(--muted);margin-bottom:3px}.student-home-v2 .sh-profile h2{margin:0;font-size:22px}.student-home-v2 .sh-chip{display:inline-flex;margin-top:8px;padding:7px 10px;border-radius:999px;background:var(--soft);color:var(--crimson);font-weight:800;font-size:13px}
    .student-home-v2 .sh-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 22px}
    .student-home-v2 .sh-action{min-height:156px;border:1px solid var(--line);border-radius:22px;background:#fff;color:#1f2329;padding:18px;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;text-align:left;cursor:pointer;box-shadow:0 7px 24px rgba(57,31,28,.04)}
    .student-home-v2 .sh-action.primary{background:linear-gradient(145deg,var(--crimson),var(--crimson2));color:#fff;border-color:var(--crimson)}
    .student-home-v2 .sh-action .sh-icon{width:48px;height:48px}.student-home-v2 .sh-action.primary .sh-icon{background:rgba(255,255,255,.13);color:#fff}.student-home-v2 .sh-action b{font-size:18px}.student-home-v2 .sh-action span{color:var(--muted);line-height:1.35}.student-home-v2 .sh-action.primary span{color:rgba(255,255,255,.88)}
    .student-home-v2 .sh-section{border:1px solid var(--line);border-radius:22px;background:#fff;padding:20px;margin-top:16px;box-shadow:0 7px 24px rgba(57,31,28,.04)}
    .student-home-v2 .sh-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.student-home-v2 .sh-section-head h2{margin:0;font-size:22px}.student-home-v2 .sh-link{border:0;background:transparent;color:var(--crimson);font-weight:800;cursor:pointer;padding:8px}
    .student-home-v2 .sh-corrections{display:grid;gap:10px}.student-home-v2 .sh-correction{width:100%;border:1px solid var(--line);border-radius:16px;background:#fff;padding:14px;display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center;text-align:left;cursor:pointer}.student-home-v2 .sh-correction-title{font-weight:800}.student-home-v2 .sh-correction-meta{font-size:13px;color:var(--muted);margin-top:4px}.student-home-v2 .sh-status{padding:6px 9px;border-radius:999px;background:#eaf7ee;color:#257247;font-weight:800;font-size:12px}.student-home-v2 .sh-score{font-size:22px;font-weight:900;color:var(--crimson);min-width:58px;text-align:right}
    .student-home-v2 .sh-empty{border:1px dashed #ded5d2;border-radius:16px;padding:22px;text-align:center;background:#fffdfc}.student-home-v2 .sh-empty h3{margin:0 0 7px}.student-home-v2 .sh-empty p{margin:0 0 14px;color:var(--muted)}
    .student-home-v2 .sh-comps{display:grid;gap:12px}.student-home-v2 .sh-comp{display:grid;grid-template-columns:40px minmax(0,1fr) 46px;gap:10px;align-items:center}.student-home-v2 .sh-comp b{color:var(--crimson)}.student-home-v2 .sh-track{height:10px;border-radius:999px;background:#ece9e8;overflow:hidden}.student-home-v2 .sh-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--crimson),var(--crimson2))}.student-home-v2 .sh-comp span{text-align:right;font-weight:800}.student-home-v2 .sh-comp-note{margin:14px 0 0;color:var(--muted);font-size:13px}
    .student-home-v2 .sh-message{margin-top:16px;border:1px solid #efd7d4;border-radius:20px;background:linear-gradient(145deg,#fffafa,#faeeee);padding:18px;display:flex;align-items:center;gap:14px;color:var(--crimson)}.student-home-v2 .sh-message b{display:block;margin-bottom:3px}.student-home-v2 .sh-message span{color:#6f6967}
    @media(max-width:780px){.student-home-v2 .sh-metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.student-home-v2 .sh-metric{min-height:112px;padding:15px;border-radius:18px}.student-home-v2 .sh-metric strong{font-size:30px}.student-home-v2 .sh-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.student-home-v2 .sh-action{min-height:142px;border-radius:18px;padding:15px}.student-home-v2 .sh-profile{border-radius:18px;padding:16px}.student-home-v2 .sh-section{border-radius:18px;padding:16px}.student-home-v2 .sh-correction{grid-template-columns:minmax(0,1fr) auto}.student-home-v2 .sh-status{display:none}.student-home-v2 .sh-score{font-size:20px}}
    @media(max-width:430px){.student-home-v2 .sh-metric-top{gap:7px}.student-home-v2 .sh-icon{width:40px;height:40px}.student-home-v2 .sh-metric{min-height:105px}.student-home-v2 .sh-action{min-height:132px}.student-home-v2 .sh-action b{font-size:16px}.student-home-v2 .sh-action span{font-size:13px}.student-home-v2 .sh-profile h2{font-size:20px}}
    `;
    document.head.appendChild(style);
  }

  function icon(key){
    const icons={
      score:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v18H7z"/><path d="M9.5 7h5M9.5 11h5M9.5 15h3"/></svg>',
      average:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20v-5M10 20V9M15 20V5M20 20V2"/></svg>',
      best:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v4a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M9 21h6M10 17h4"/></svg>',
      corrected:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
      user:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>',
      send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h5M12 11v6M9 14h6"/></svg>',
      essays:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
      evolution:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20v-5M9 20v-9M14 20v-13M19 20V4"/></svg>',
      performance:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 5-5 4 3 7-8"/><path d="M16 7h4v4"/></svg>',
      message:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20v-8a7 7 0 0 1 14 0v8"/><path d="M3 20h18"/></svg>'
    };
    return icons[key]||'';
  }

  function scoreLabel(value){return value==null?'—':String(value)}

  window.renderStudentHome=async function(navigation){
    ensureStudentHomeV2Style();
    const d=await studentDashboard(true);
    if(!navigationCurrent(navigation))return;

    const summary=d.summary||{};
    const student=d.student||{};
    const org=d.organization?.name||'';
    const classNames=(d.classes||[]).map(c=>c.name).filter(Boolean);
    const identity=[org,...classNames].filter(Boolean).join(' · ');
    const submissions=Array.isArray(d.submissions)?d.submissions:[];
    const approved=submissions.filter(s=>s?.approved_score);
    const latestCorrections=approved.slice(0,3);
    const evolution=Array.isArray(d.evolution)?d.evolution:[];
    const last=evolution.at(-1)||null;
    const comps=last?.competencies||approved[0]?.approved_score?.competencies||{};
    const hasCompetencies=['C1','C2','C3','C4','C5'].some(c=>Number.isFinite(Number(comps?.[c])));

    const metrics=[
      ['score','Nota atual',scoreLabel(summary.current_score)],
      ['average','Média',scoreLabel(summary.average_score)],
      ['best','Melhor nota',scoreLabel(summary.best_score)],
      ['corrected','Redações corrigidas',Number(summary.approved_count||0)]
    ].map(([key,label,value])=>`<article class="sh-metric"><div class="sh-metric-top"><span class="sh-icon">${icon(key)}</span><span>${esc(label)}</span></div><strong>${esc(value)}</strong></article>`).join('');

    const corrections=latestCorrections.length?latestCorrections.map(s=>{
      const a=s.approved_score||{};
      const title=s.round?.theme||'Redação corrigida';
      const date=fmtDate(a.approved_at||s.approved_at||s.received_at);
      return `<button type="button" class="sh-correction" data-sh-route="student-essays"><div><div class="sh-correction-title">${esc(title)}</div><div class="sh-correction-meta">Corrigida em ${esc(date)}</div></div><span class="sh-status">Corrigida</span><span class="sh-score">${esc(a.total_score??'—')}</span></button>`;
    }).join(''):`<div class="sh-empty"><h3>Você ainda não recebeu correções.</h3><p>Envie sua primeira redação para começar a acompanhar sua evolução.</p><button type="button" class="btn primary" data-sh-route="student-proposals">Enviar primeira redação</button></div>`;

    const competencies=['C1','C2','C3','C4','C5'].map(c=>{
      const value=Number(comps?.[c]),valid=Number.isFinite(value),width=valid?Math.max(0,Math.min(100,value/2)):0;
      return `<div class="sh-comp"><b>${c}</b><div class="sh-track"><i style="width:${width}%"></i></div><span>${valid?value:'—'}</span></div>`;
    }).join('');

    $('view').innerHTML=header('Início','Seu painel de redações e evolução.')+`<section class="student-home-v2">
      <div class="sh-metrics">${metrics}</div>
      <section class="sh-profile" aria-label="Dados do aluno"><div class="sh-avatar">${icon('user')}</div><div><small>Aluno</small><h2>${esc(student.preferred_name||student.full_name||'Aluno')}</h2>${identity?`<span class="sh-chip">${esc(identity)}</span>`:''}</div></section>
      <section class="sh-actions" aria-label="Ações rápidas">
        <button type="button" class="sh-action primary" data-sh-route="student-proposals"><span class="sh-icon">${icon('send')}</span><div><b>Enviar redação</b><span>Escolha uma proposta e envie seu texto.</span></div></button>
        <button type="button" class="sh-action" data-sh-route="student-essays"><span class="sh-icon">${icon('essays')}</span><div><b>Minhas correções</b><span>Veja suas redações e devolutivas.</span></div></button>
        <button type="button" class="sh-action" data-sh-route="student-evolution"><span class="sh-icon">${icon('evolution')}</span><div><b>Evolução</b><span>Acompanhe seu progresso ao longo do tempo.</span></div></button>
        <button type="button" class="sh-action" data-sh-route="student-evolution"><span class="sh-icon">${icon('performance')}</span><div><b>Meu desempenho</b><span>Veja seus resultados por competência.</span></div></button>
      </section>
      <section class="sh-section" aria-labelledby="shCorrections"><div class="sh-section-head"><h2 id="shCorrections">Minhas correções</h2><button type="button" class="sh-link" data-sh-route="student-essays">Ver todas →</button></div><div class="sh-corrections">${corrections}</div></section>
      <section class="sh-section" aria-labelledby="shCompetencies"><div class="sh-section-head"><h2 id="shCompetencies">Competências</h2>${hasCompetencies?'<button type="button" class="sh-link" data-sh-route="student-evolution">Ver detalhes →</button>':''}</div><div class="sh-comps">${competencies}</div>${hasCompetencies?'':'<p class="sh-comp-note">As competências aparecerão após sua primeira correção aprovada.</p>'}</section>
      <section class="sh-message"><span class="sh-icon">${icon('message')}</span><div><b>Cada texto pode ir mais longe.</b><span>Escreva, receba seu feedback e acompanhe sua evolução.</span></div></section>
    </section>`;

    $('view').onclick=e=>{
      const target=e.target.closest('[data-sh-route]');
      if(!target)return;
      navigate(target.dataset.shRoute);
    };
  };
})();
