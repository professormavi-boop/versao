const {JSDOM}=require('jsdom'),fs=require('node:fs'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const server=http.createServer((req,res)=>res.end(fs.readFileSync('correction.e12.js')));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const dom=new JSDOM('<main></main>',{runScripts:'outside-only'}),w=dom.window,slot=w.document.querySelector('main');
 try{
  w.API={live:'live'};w.esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  w.eval(await(await fetch('http://127.0.0.1:'+server.address().port)).text()+'\nwindow.openEssay=openEssay;');
  const show=async files=>{w.edge=async(api,body)=>{assert.equal(body.submission_id,'submission');return {files}};await w.openEssay('submission',slot)};
  await show([{mime_type:'image/jpeg',signed_url:'https://example.org/photo.jpg'}]);assert.ok(slot.querySelector('img'));assert.equal(slot.querySelector('iframe'),null);
  await show([{mime_type:'application/pdf',signed_url:'https://example.org/essay.pdf?token=a&x=b'}]);assert.ok(slot.querySelector('iframe'));assert.match(slot.querySelector('a').textContent,/Abrir PDF/);assert.equal(slot.querySelector('a').href,'https://example.org/essay.pdf?token=a&x=b');assert.equal(slot.querySelector('dialog'),null);
  await show([{mime_type:'application/msword',signed_url:'https://example.org/essay.doc'}]);assert.ok(slot.querySelector('a'));assert.match(slot.textContent,/Abrir arquivo/);
  await show([{mime_type:'application/pdf',signed_url:'javascript:alert(1)'}]);assert.equal(slot.querySelector('iframe,a'),null);assert.match(slot.textContent,/Tente visualizar novamente/);
  await show([]);assert.match(slot.textContent,/Nenhuma redação/);
  w.edge=async()=>{throw Error('Falha de conexão')};await w.openEssay('submission',slot);assert.match(slot.textContent,/Falha de conexão/);
  console.log('essay viewer: image, PDF, legacy fallback, missing file, unsafe URL and error PASS');
 }finally{dom.window.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
