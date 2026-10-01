const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const fixture=`<div id="slot-a"><div class="box"></div></div><script>
window.$=id=>document.getElementById(id);window.esc=x=>String(x??'');window.reportPortuguese=x=>x;window.S={cache:{}};
</script><script src="/correction.e12.js"></script><script>
renderAiResult('a',{status:'approved',result:{total_score:840}}, {total_score:880,competencies:{C1:160,C2:200,C3:160,C4:160,C5:200},detailed_analysis:{report_format:'essential-v1',c1_deviations:[]}},null,{});
</script>`;
const bindingsFixture='<div id="view"></div>'+['student-home-v2.e12.js','teacher-main.e12.js','teacher-proposals-v3.e12.js','teacher-credits.e12.js','student.e12.js','student-proposals-v2.e12.js'].map(src=>`<script src="/${src}"></script>`).join('');
const server=http.createServer((req,res)=>{if(req.url==='/bindings'){res.setHeader('Content-Type','text/html');return res.end(bindingsFixture)}if(req.url==='/fixture'){res.setHeader('Content-Type','text/html');return res.end(fixture)}const file=path.join(root,new URL(req.url,'http://local').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
try{const html=await(await fetch(base+'/index.html')).text();const refs=[...html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)].map(m=>m[1]);for(const ref of refs)assert.equal((await fetch(base+ref)).status,200,ref);
const dom=await JSDOM.fromURL(base+'/fixture',{resources:'usable',runScripts:'dangerously'});await new Promise(r=>dom.window.addEventListener('load',r));assert.match(dom.window.document.querySelector('.box').textContent,/880 \/ 1000/);dom.window.close();const bindings=await JSDOM.fromURL(base+'/bindings',{resources:'usable',runScripts:'dangerously'});await new Promise(r=>bindings.window.addEventListener('load',r));assert.equal(bindings.window.renderStudentHome.name,'studentHomeV2');assert.equal(bindings.window.renderStudentProposals.name,'renderStudentProposalsV2');assert.equal(bindings.window.renderDemoProposals.name,'renderDemoProposalsV3');assert.equal(typeof bindings.window.renderTeacherAccount,'function');assert.equal(typeof bindings.window.renderLive,'function');bindings.window.close();console.log('PASS: '+refs.length+' assets over HTTP and correction report rendering over HTTP');}finally{server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
