const {JSDOM}=require('jsdom'),fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const width of [320,390,768,1200]){
 const dom=new JSDOM('<div id="host"></div>',{runScripts:'outside-only'}),w=dom.window;w.innerWidth=width;w.esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;');w.S={session:{user:{id:'teacher'}}};
 vm.runInContext('const S=window.S; delete window.S;',dom.getInternalVMContext());
 vm.runInContext(fs.readFileSync('enem-review.e12.js','utf8'),dom.getInternalVMContext());
 const base={quality_version:'enem-evidence-2026-09-20',transcription:'Texto correto.',syntax_assessment:'Sintaxe original.',reading_quality:'good',essay_status:'regular',proposal_complete:true,c1_deviations:[],competencies:Object.fromEntries(['C1','C2','C3','C4','C5'].map(c=>[c,{score:160,diagnostic:'Diagnóstico original.'}]))};Object.assign(base,w.EnemReview.validateEvidence(base));
 const job={id:'synthetic',result:base,completed_at:'2026-10-07T01:00:00Z'},host=w.document.querySelector('#host');
 function render(live=false){host.innerHTML=`<select ${live?'id="tlC1"':'data-ai-score="C1"'}><option>160</option><option>120</option></select><input type="checkbox" ${live?'data-live-discard':'data-deviation-discard'}="0">`+w.enemReviewFields(base);w.enemReviewBind(host,job)}
 const q=s=>host.querySelector(s),event=el=>el.dispatchEvent(new w.Event('input',{bubbles:true}));
 for(const live of [false,true]){
  w.enemReviewClear(job);render(live);assert.equal(q('[data-enem-c1]').hidden,true);assert.equal(q('[data-enem-diagnostic]').value,'');
  q('input').checked=true;event(q('input'));assert.equal(q('[data-enem-c1]').hidden,false);assert.match(q('[data-enem-reason]').textContent,/descartou/);
  q('[data-enem-diagnostic]').value='Minha avaliação';event(q('[data-enem-diagnostic]'));q('details').open=true;q('details').open=false;
  q('input').checked=false;event(q('input'));assert.equal(q('[data-enem-c1]').hidden,true);q('select').value='120';event(q('select'));assert.equal(q('[data-enem-c1]').hidden,false);assert.equal(q('[data-enem-diagnostic]').value,'Minha avaliação');
  render(live);assert.equal(q('select').value,'120');assert.equal(q('[data-enem-diagnostic]').value,'Minha avaliação');assert.equal(q('[data-enem-c1]').hidden,false);assert.match(host.textContent,/Diagnóstico original/);
 }
 w.enemReviewClear(job);delete base.evidence_audit;render();assert.equal(q('[data-enem-c1]').hidden,false);assert.match(q('[data-enem-reason]').textContent,/anterior/i);
 Object.assign(base,w.EnemReview.validateEvidence(base));base.c1_reassessment_required=true;render();assert.equal(q('[data-enem-c1]').hidden,false);
 assert.doesNotThrow(()=>w.EnemReview.reviewedEvidence(base,{review_policy_version:w.EnemReview.REVIEW_POLICY_VERSION,review_confirmed:true,scores:Object.fromEntries(['C1','C2','C3','C4','C5'].map(c=>[c,160])),deviation_reviews:[],requirement_resolutions:[]}));
 base.reading_quality='partial';base.request_manifest={inputs:[{type:'input_file'}]};assert.match(w.enemAnalysisHeader(job),/não comprova/);assert.match(w.enemAnalysisHeader(job),/synthetic/);assert.match(w.enemAnalysisHeader(null),/Data não registrada/);render();q('[data-enem-resolution]').value='Conferi o original';event(q('[data-enem-resolution]'));render();assert.equal(q('[data-enem-resolution]').value,'Conferi o original');
 assert.equal(JSON.stringify(base).includes('Minha avaliação'),false);vm.runInContext("S.session.user.id='another'",dom.getInternalVMContext());render();assert.equal(q('[data-enem-diagnostic]').value,'');dom.window.close();
}
console.log('PASS: review visibility reasons, original reference, draft reopen/score/discard/toggle, legacy, manual gate, account isolation; DOM at 320/390/768/1200 (no layout engine)');
