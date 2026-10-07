'use strict';
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
(async()=>{
 const dom=new JSDOM('<main id="view"></main>',{runScripts:'outside-only',url:'https://test.invalid'}),w=dom.window;let calls=[],saved=null,handoff=null,fail=false;
 w.$=id=>w.document.getElementById(id);w.esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');w.header=t=>'<h1>'+t+'</h1>';w.fmtDate=s=>s;w.navigationCurrent=()=>true;
 w.edge=async(_,b)=>{calls.push(b);if(b.action==='live_writing_list')return{drafts:saved?[saved]:[]};if(b.action==='live_writing_get')return{draft:structuredClone(saved)};
  if(b.action==='live_writing_save'){if(fail)throw Error('Rascunho alterado em outra aba.');saved={id:b.id,theme:b.theme,content:structuredClone(b.content),version:b.version+1};return{draft:structuredClone(saved)}}throw Error(b.action);};
 w.renderTeacherLive=async(nav,preset)=>{handoff=preset};w.eval(fs.readFileSync('writing-stages.e12.js','utf8'));w.eval(fs.readFileSync('writing-editor.e12.js','utf8'));
 await w.renderWritingEditor(1);w.$('weNew').click();await new Promise(r=>setImmediate(r));
 w.$('weTheme').value='Tema sintético';w.$('weTheme').dispatchEvent(new w.Event('input'));w.$('weText').value='Parágrafo autoral. '.repeat(10);w.$('weText').dispatchEvent(new w.Event('input'));
 w.$('weSave').click();await new Promise(r=>setImmediate(r));assert(saved);assert.equal(saved.content.stages.introduction.text,'Parágrafo autoral. '.repeat(10));assert.match(w.$('weStatus').textContent,/Salvo/);
 w.document.querySelector('[data-writing-stage="development1"]').click();w.$('wePlan').value='Minha causa planejada';w.$('wePlan').dispatchEvent(new w.Event('input'));w.$('weText').value='Meu segundo parágrafo. '.repeat(5);w.$('weText').dispatchEvent(new w.Event('input'));
 w.$('wePreview').click();assert(!w.$('view').textContent.includes('Minha causa planejada'));assert(w.$('view').textContent.includes('Meu segundo parágrafo'));
 w.$('weEdit').click();assert.equal(w.$('wePlan').value,'Minha causa planejada');w.$('weCorrectStage').click();await new Promise(r=>setImmediate(r));assert.equal(handoff.stage,'development1');assert.equal(handoff.theme,'Tema sintético');assert(calls.every(c=>c.action.startsWith('live_writing_')));
 await w.renderWritingEditor(2);w.document.querySelector('[data-writing-draft]').click();await new Promise(r=>setImmediate(r));assert.equal(w.$('weTheme').value,'Tema sintético');
 fail=true;w.$('weText').value='Minha revisão não salva';w.$('weText').dispatchEvent(new w.Event('input'));w.$('weSave').click();await new Promise(r=>setImmediate(r));assert.match(w.$('weStatus').textContent,/outra aba/);assert.equal(w.$('weText').value,'Minha revisão não salva');
 dom.window.close();console.log('PASS editor: escrita própria, planejamento fora da prévia, salvamento/retomada, handoff sem IA/débito e conflito sem perda local.');
})().catch(e=>{console.error(e);process.exitCode=1;});
