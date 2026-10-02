const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const d=new JSDOM('',{runScripts:'outside-only'}),w=d.window;
w.esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.fmtDate=x=>x;
w.eval(fs.readFileSync('ranking-management.e12.js','utf8')+';window.platformPersonName=platformPersonName;window.platformAccessDate=platformAccessDate;window.platformReportHTML=platformReportHTML;');
assert.equal(w.platformPersonName('IRANI RIBEIRO SOUSA DE MENEZES &#x20;'),'Irani Ribeiro Sousa de Menezes');assert.equal(w.platformPersonName('João McDonald'),'João McDonald');assert.match(w.platformAccessDate('2026-10-02T15:00:00Z'),/12:00/);assert.match(w.platformAccessDate(null),/Nenhum login/);
const report={since:'a',until:'b',services:[{name:'Ao Vivo <script>',requests:3,completed:1,failed:2,cost_usd:1,known_cost_count:2,missing_cost_count:1,average_attempt_usd:null,average_completed_usd:null}],fx:{rate:5,available:true,date:'02/10/2026',source:'BCB'}};
w.document.body.innerHTML=w.platformReportHTML(report,'costs');assert.match(w.document.body.textContent,/R\$\s*5,0000/);assert.match(w.document.body.textContent,/Indisponível/);assert.equal(w.document.querySelector('script'),null);
report.fx.available=false;assert.match(w.platformReportHTML(report,'costs'),/Cotação indisponível/);
d.window.close();console.log('PASS admin costs: BRL, missing costs, escaping, name case and Brasilia login time');
