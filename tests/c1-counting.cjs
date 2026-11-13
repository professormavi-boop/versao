const assert=require('node:assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
(async()=>{
const q=await import('../backend/enem/prepared/ai-correction-beta-api/correction-quality.ts');
const {schema,normalizeResult}=await import('../backend/enem/prepared/teacher-organization-api/live-ai.ts');
const make=(original,correction,type,basis='unique',key='')=>({original,correction,category:type,rule:'Regra demonstrada no contexto.',location:'P1',evidence:original,counting:{type,basis,key,reason:'Mesmo desvio demonstrado; agrupamento explicitado.'}});
const base=ds=>({c1_counting_version:q.C1_COUNTING_VERSION,quality_version:q.QUALITY_VERSION,transcription:ds.map(d=>d.evidence).join(' '),c1_deviations:ds,syntax_assessment:'Sintaxe avaliada.',essay_status:'regular',proposal_complete:true,reading_quality:'good',competencies:Object.fromEntries(['C1','C2','C3','C4','C5'].map(c=>[c,{score:160,diagnostic:'Bom domínio.'}]))});
const normalCode=fs.readFileSync('backend/enem/prepared/ai-correction-beta-api/index.ts','utf8');
const schemaCode=normalCode.slice(normalCode.indexOf('    function schema(){'),normalCode.indexOf('    function normalizeResult('));
assert.equal(JSON.stringify(require('vm').runInNewContext(schemaCode+';schema()')),JSON.stringify(schema()));
assert(schema().required.includes('c1_counting_version'));
assert(schema().properties.c1_deviations.items.required.includes('counting'));
let raw=base([
make('excessão','exceção','orthography','same_word','exceção'),
make('excessão','exceção','orthography','same_word','exceção'),
make('os aluno','os alunos','agreement'),
make('as escola','as escolas','agreement'),
make('Embora seja.','Embora seja,','syntax')
]);
let c=q.countC1(raw);assert.equal(c.found,5);assert.equal(c.grouped,1);assert.equal(c.deviations,3);assert.equal(c.syntax,1);assert.equal(c.unclassified,0);
assert.equal(c.density_per_100_words,Math.round(3*10000/c.word_count)/100);
assert.equal(raw.competencies.C1.score,160);
assert.equal(c.items[1].grouped_with,0);
raw=base([make('infeliz','infeliz','vocabulary','same_root','feliz'),make('infelicidade','infelicidade','vocabulary','same_root','feliz')]);assert.equal(q.countC1(raw).grouped,1); // supplied linguistic classification, not stemming
raw=base([make('à pessoas','a pessoas','crasis','same_structure','x'),make('à pessoas','a pessoas','crasis','same_structure','x'),make('à cidadãos','a cidadãos','crasis','same_structure','x')]);
assert.equal(q.countC1(raw).grouped,1);assert.equal(q.countC1(raw).deviations,2);
raw=base([make('noticia','notícia','accentuation'),make('noticia','noticias','agreement')]);raw.transcription='As noticia chegaram.';
raw.c1_deviations.forEach(d=>d.evidence='As noticia chegaram.');
let result=normalizeResult(raw);assert.equal(result.c1_counting.deviations,2);assert.equal(result.c1_deviations.length,2);assert.equal(result.total_score,800);
const reviewBody={review_policy_version:q.REVIEW_POLICY_VERSION,review_confirmed:true,scores:{C1:160,C2:160,C3:160,C4:160,C5:160},deviation_reviews:result.c1_deviations.map((d,index)=>({index,decision:index===0?'discarded':'confirmed',correction:d.correction,rule:d.rule}))};
let reviewed=q.reviewedEvidence(result,reviewBody);assert.equal(reviewed.c1_counting.found,2);assert.equal(reviewed.c1_counting.discarded,1);assert.equal(reviewed.c1_counting.deviations,1);
reviewBody.deviation_reviews[1].rule='Regra editada pelo professor.';
reviewed=q.reviewedEvidence(result,reviewBody);assert.equal(reviewed.c1_counting.status,'partial');assert.equal(reviewed.c1_counting.unclassified,1);assert.equal(reviewed.c1_counting.density_per_100_words,null);
raw=base([make('ausente','presente','orthography')]);raw.transcription='Texto sem a ocorrência.';
result=normalizeResult({...raw,competencies:{...raw.competencies,C1:{score:200}}});assert.equal(result.c1_counting.invalid,1);assert.equal(result.c1_counting.found,1);assert.equal(result.c1_counting.deviations,0);
raw=base([]);delete raw.c1_counting_version;assert.equal(q.countC1(raw).status,'unavailable');
raw=base([]);assert.equal(q.countC1(raw).deviations,0);assert.equal(q.countC1(raw).density_per_100_words,null);
raw=base([make('erro','certo','syntax','same_root','err')]);assert.equal(q.countC1(raw).status,'partial');
const d=new JSDOM('<main id="host"></main>',{runScripts:'outside-only'}),w=d.window;
w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
w.eval(fs.readFileSync('enem-review.e12.js','utf8'));
raw=base([make('os aluno','os alunos','agreement')]);Object.assign(raw,q.validateEvidence(raw));raw.c1_deviations[0].counting.reason='<img src=x onerror=alert(1)>';
const host=w.document.getElementById('host');
host.innerHTML=w.c1CountingHtml(raw)+w.enemReviewFields(raw)+'<input data-deviation-discard="0" type="checkbox"><input data-deviation-correction="0" value="os alunos"><textarea data-deviation-rule="0">Regra demonstrada no contexto.</textarea>';
w.enemReviewBind(host,{id:'counting-test',result:raw});
assert.equal(host.querySelector('img'),null);
const toggle=host.querySelector('[data-c1-counting] details');toggle.open=true;toggle.dispatchEvent(new w.Event('toggle'));
assert(host.querySelector('[data-c1-counting] details').open);
const ignore=host.querySelector('[data-deviation-discard]');ignore.checked=true;ignore.dispatchEvent(new w.Event('change',{bubbles:true}));
assert(host.querySelector('[data-c1-counting]').textContent.includes('Ignoradas pelo professor1'));
assert(host.querySelector('[data-c1-counting]').textContent.includes('Desvios contabilizados0'));
assert.equal(raw.competencies.C1.score,160);
d.window.close();
const shared=new JSDOM('<main id="shared"></main>',{runScripts:'outside-only',url:'https://test.example/devolutiva.html#'+'a'.repeat(64)});
shared.window.fetch=async()=>({ok:true,json:async()=>({theme:'Tema fictício',reviewed_by_teacher:true,review:{...raw,total_score:800}})});
shared.window.eval(fs.readFileSync('enem-review.e12.js','utf8'));
shared.window.eval(fs.readFileSync('live-share.e12.js','utf8'));
await new Promise(r=>setTimeout(r,10));
assert(shared.window.document.querySelector('[data-c1-counting]'));
assert.equal(shared.window.document.querySelector('img'),null);
shared.window.close();
console.log('PASS C1 counting: repetition rules, distinct types, syntax separate, edits/discards, legacy, schema, totals, no grade mutation, DOM/XSS and expandable audit');
})().catch(e=>{console.error(e);process.exitCode=1});
