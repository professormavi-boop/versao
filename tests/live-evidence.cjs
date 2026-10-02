const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const d=new JSDOM('',{runScripts:'outside-only'}),w=d.window;
w.esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
w.eval(fs.readFileSync('teacher-live.e12.js','utf8'));
w.document.body.innerHTML=w.liveEvidenceHtml({c1_deviations:[{original:'<script>teste</script>',correction:'Correção',rule:'Concordância',category:'syntax_code',location:'Parágrafo 1',evidence:'Trecho'}],c5_check:{agent:'Governo',action:'Investir'},repertoire_checks:[{reference:'Obra',classification:'confirmada',analysis:'Coerente'}],review_requirements:['Confira a leitura']});
const text=w.document.body.textContent;assert.match(text,/Trecho original/);assert.match(text,/Sugestão de escrita/);assert.match(text,/Agente/);assert.match(text,/Referência confirmada/);assert.doesNotMatch(text,/syntax_code|c1_deviations|c5_check|\[object Object\]/);assert.equal(w.document.querySelector('script'),null);
w.document.body.innerHTML=w.liveEvidenceHtml({});assert.match(w.document.body.textContent,/não estão disponíveis/);
w.document.body.innerHTML=w.liveEvidenceHtml({c1_deviations:[]});assert.match(w.document.body.textContent,/Nenhum desvio foi apontado/);
d.window.close();console.log('PASS live evidence: readable fields, C5 labels, references, missing vs empty and HTML escaped');
