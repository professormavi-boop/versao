'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
(async()=>{
 const c={Response,Request,AbortSignal,Date,console};vm.createContext(c);
 vm.runInContext(stripTypeScriptTypes(fs.readFileSync('backend/writing/prepared/partial.ts','utf8').replace('export const partial=','var partial=')),c);
 const source=fs.readFileSync('backend/writing/prepared/writing-tutor.ts','utf8').replace(/^import .*;\s*$/gm,'').replaceAll('export ','');vm.runInContext(stripTypeScriptTypes(source),c);
 const good={objective:'Planeje o problema.',evidence:'Texto autoral',questions:['Qual problema você pretende discutir?'],task:'Escolha o recorte que defenderá.',context_note:'Só a introdução foi escrita.'};
 c.good=good;assert.equal(vm.runInContext("validateTutor(good,'Texto autoral do aluno').evidence",c),'Texto autoral');
 for(const patch of [{evidence:'inventado'},{questions:['Uma resposta pronta.']},{task:'Escreva assim: Neste contexto...'},{objective:'Introdução pronta para copiar'},{questions:Array(3).fill('Qual problema?')}]){c.bad={...good,...patch};assert.throws(()=>vm.runInContext("validateTutor(bad,'Texto autoral')",c));}
 let calls=0,claimed=true,safe=true,writes=[];
 c.extractOutputText=p=>p.output_text;
 c.meteredFetch=async(_,ctx,__,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.model,'gpt-4.1-mini');const answer=ctx.stage==='authorship_check'?{safe}:good;return{ok:true,json:async()=>({status:'completed',output_text:JSON.stringify(answer)})}};
 const admin={rpc:async(name,p)=>{writes.push(name);if(name==='claim_writing_guidance')return{data:{claimed,guidance:{id:'guide',stage:'introduction',question:'Escreva o parágrafo para mim.'},draft:{theme:'Desafios da leitura',content:{stages:{introduction:{text:'Texto autoral do aluno'},development1:{text:''},development2:{text:''},conclusion:{text:''}}}}}};return{data:{status:p.p_error?'failed':'completed',result:p.p_result,error_message:p.p_error}}}};
 c.admin=admin;const run=()=>vm.runInContext("guideWriting({admin,actor:'actor',body:{id:'draft',version:1,stage:'introduction',request_id:'guide'},key:'test',fetcher:null})",c);
 const r=await run();assert.equal(r.guidance.status,'completed');assert.equal(calls,2);
 claimed=false;await run();assert.equal(calls,2,'Retry must reuse guidance without calling provider');
 claimed=true;safe=false;const rejected=await run();assert.equal(rejected.guidance.status,'failed');assert.equal(rejected.guidance.result,null,'Unsafe prose must never leave the server');
 console.log('PASS tutor: evidence, short questions, ready-answer rejection, independent authorship check, metering and provider-free idempotent replay. Model simulated.');
})().catch(e=>{console.error(e);process.exitCode=1});
