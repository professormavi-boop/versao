'use strict';
(function(){
  const MANUSCRIPT_MARKER='<strong></strong><em></em><b></b><i></i><strong></strong>';
  const MANUSCRIPT_RE=/^<strong>\s*<\/strong><em>\s*<\/em><b>\s*<\/b><i>\s*<\/i><strong>\s*<\/strong>/i;
  const STYLE_ID='submissionPolicyStyle';
  let syncQueued=false;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .submission-policy-choices{display:grid;grid-template-columns:1fr 1fr;gap:12px}.submission-policy-choice{position:relative;border:1px solid #e5dfdc;border-radius:14px;background:#fff;padding:15px 16px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:11px;align-items:start;cursor:pointer}.submission-policy-choice:has(input:checked){border-color:#b94b50;background:#fff8f7;box-shadow:0 0 0 1px rgba(169,8,19,.08)}.submission-policy-choice input{margin:3px 0 0;width:19px;height:19px;accent-color:#a90813}.submission-policy-copy{display:grid;gap:4px}.submission-policy-copy strong{color:#202936}.submission-policy-copy span{color:#667085;font-size:13px;line-height:1.45}.submission-policy-note{margin-top:12px}.spv-send-grid.submission-handwritten-only{grid-template-columns:repeat(2,minmax(0,1fr))}
      @media(max-width:620px){.submission-policy-choices{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function stripMarker(html){return String(html||'').replace(MANUSCRIPT_RE,'')}
  function isManuscriptHtml(html){return MANUSCRIPT_RE.test(String(html||''))}
  function manuscriptRound(round){return !!round&&isManuscriptHtml(round.proposal_html)}

  function cachedRound(roundId){
    const rounds=S?.student?.proposals?.proposals||[];
    return rounds.find(round=>String(round.id)===String(roundId))||null;
  }

  async function roundPolicy(roundId){
    let round=cachedRound(roundId);
    if(!round&&typeof studentProposals==='function'){
      try{
        const data=await studentProposals(false);
        round=(data?.proposals||[]).find(item=>String(item.id)===String(roundId))||null;
      }catch{}
    }
    return manuscriptRound(round)?'handwritten':'mixed';
  }

  function teacherPolicyValue(){
    return document.querySelector('[data-submission-policy] input[name="submissionPolicy"]:checked')?.value||'mixed';
  }

  function syncTeacherMarker(){
    const editor=document.getElementById('pvCommand');
    if(!editor||!document.querySelector('[data-submission-policy]'))return;
    const clean=stripMarker(editor.innerHTML);
    editor.innerHTML=teacherPolicyValue()==='handwritten'?MANUSCRIPT_MARKER+clean:clean;
  }

  function decorateTeacherEditor(){
    const form=document.getElementById('pvForm'),editor=document.getElementById('pvCommand');
    if(!form||!editor||form.querySelector('[data-submission-policy]'))return;
    ensureStyle();
    const handwritten=isManuscriptHtml(editor.innerHTML);
    const section=document.createElement('section');
    section.className='proposal-v3-section';
    section.dataset.submissionPolicy='1';
    section.innerHTML=`<header><h2>4. Forma de envio</h2><p>Defina se o aluno poderá enviar uma redação digitada nesta proposta.</p></header><div class="submission-policy-choices"><label class="submission-policy-choice"><input type="radio" name="submissionPolicy" value="mixed" ${handwritten?'':'checked'}><span class="submission-policy-copy"><strong>Manuscrita ou digitada</strong><span>Permite foto, arquivo ou colar o texto da redação.</span></span></label><label class="submission-policy-choice"><input type="radio" name="submissionPolicy" value="handwritten" ${handwritten?'checked':''}><span class="submission-policy-copy"><strong>Somente manuscrita</strong><span>Remove a opção de colar texto digitado da área do aluno.</span></span></label></div>`;
    const footer=form.querySelector('.proposal-v3-footer');
    if(footer)footer.before(section);else form.appendChild(section);
    section.onchange=()=>{syncTeacherMarker();syncTeacherPreview()};
  }

  function syncTeacherPreview(){
    const preview=document.getElementById('pvPreview');
    if(!preview||!preview.innerHTML)return;
    let note=preview.querySelector('[data-submission-policy-preview]');
    if(!note){
      note=document.createElement('div');
      note.className='proposal-v3-dest';
      note.dataset.submissionPolicyPreview='1';
      const card=preview.querySelector('.proposal-v3-preview-card');
      if(card)card.appendChild(note);else return;
    }
    note.innerHTML=teacherPolicyValue()==='handwritten'?'<b>Forma de envio:</b> somente redação manuscrita por foto ou arquivo.':'<b>Forma de envio:</b> manuscrita ou digitada.';
  }

  function syncStudentSummary(){
    document.querySelectorAll('[data-spv-send]').forEach(button=>{
      const round=cachedRound(button.dataset.spvSend);
      if(!manuscriptRound(round))return;
      const panel=button.closest('.spv-panel');
      if(!panel||panel.querySelector('[data-submission-policy-note]'))return;
      const note=document.createElement('div');
      note.className='safe-note submission-policy-note';
      note.dataset.submissionPolicyNote='1';
      note.innerHTML='<b>Envio somente manuscrito.</b> Nesta proposta, o professor não aceita redação digitada.';
      button.closest('.spv-actions')?.before(note);
    });
  }

  function syncStudentSend(){
    document.querySelectorAll('[data-v2-paste]').forEach(button=>{
      const roundId=button.getAttribute('data-v2-paste'),round=cachedRound(roundId);
      if(!manuscriptRound(round))return;
      button.remove();
      const camera=document.querySelector(`[data-v2-camera="${CSS.escape(String(roundId))}"]`);
      const grid=camera?.closest('.spv-send-grid');
      if(grid)grid.classList.add('submission-handwritten-only');
      const panel=grid?.closest('.spv-panel');
      const lock=panel?.querySelector('.spv-lock');
      if(lock)lock.innerHTML='<b>Envio desta proposta:</b> somente redação manuscrita por foto ou arquivo.<br><b>Arquivos:</b> JPG, PNG, WEBP ou PDF de uma página, até 15 MB.';
    });
  }

  function syncAll(){
    ensureStyle();
    decorateTeacherEditor();
    syncTeacherPreview();
    if(S?.profile?.role==='student'){
      syncStudentSummary();
      syncStudentSend();
    }
  }

  function scheduleSync(){
    if(syncQueued)return;
    syncQueued=true;
    queueMicrotask(()=>{syncQueued=false;syncAll()});
  }

  if(typeof renderProposals==='function'){
    const base=renderProposals;
    renderProposals=async function(navigation){const result=await base(navigation);scheduleSync();return result};
  }
  if(typeof renderStudentProposals==='function'){
    const base=renderStudentProposals;
    renderStudentProposals=async function(navigation){const result=await base(navigation);scheduleSync();return result};
  }

  if(typeof openStudentPasteV2==='function'){
    const base=openStudentPasteV2;
    openStudentPasteV2=async function(roundId){
      if(await roundPolicy(roundId)==='handwritten'){
        studentUploadError('Esta proposta aceita apenas redações manuscritas. Envie uma foto ou arquivo da redação escrita à mão.');
        return;
      }
      return base(roundId);
    };
  }

  if(typeof studentSubmitJson==='function'){
    const base=studentSubmitJson;
    studentSubmitJson=async function(body,retried=false){
      if(body?.action==='paste'&&await roundPolicy(body.round_id)==='handwritten'){
        throw Error('Esta proposta aceita apenas redações manuscritas. O envio de texto digitado está desativado.');
      }
      return base(body,retried);
    };
  }

  document.addEventListener('click',event=>{
    if(event.target?.closest?.('#pvDraft,#pvPreviewDraft,#pvPreviewPublish'))syncTeacherMarker();
    scheduleSync();
  },true);
  document.addEventListener('change',event=>{
    if(event.target?.matches?.('[data-submission-policy] input[name="submissionPolicy"]'))syncTeacherMarker();
    scheduleSync();
  },true);

  window.__VERSAO_SUBMISSION_POLICY__={marker:MANUSCRIPT_MARKER,isManuscriptHtml,stripMarker,roundPolicy};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});
  else scheduleSync();
})();
