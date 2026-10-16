'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
(async()=>{
 let calls=0,claimed=true,providerStatus='completed',payload,finished;
 const admin={from(){return{select(){return this},eq(){return this},maybeSingle:async()=>({data:{storage_path:'owner/essay/image.png',mime_type:'image/png'}})}},storage:{from(){return{createSignedUrl:async()=>({data:{signedUrl:'https://synthetic.invalid/image.png'}})}}},rpc:async(name,p)=>{
  if(name==='claim_live_transcription')return{data:{claimed,transcription:{attempt_id:'attempt',text:'Texto já lido',note:'Leia antes de confirmar'}}};
  if(name==='finish_live_transcription'){finished=p;return{data:{status:p.p_error?'failed':'completed',text:p.p_text,note:p.p_note,error_message:p.p_error}}}
  throw Error(name);
 }};
 const ctx={AbortSignal,JSON,meteredFetch:async(_a,context,url,init)=>{calls++;payload=JSON.parse(init.body);assert.equal(context.stage,'partial_transcription');return{ok:true,json:async()=>({status:providerStatus,output_text:JSON.stringify({text:'Texto lido com [?].',note:'Confira o trecho.'})})}},extractOutputText:p=>p.output_text};vm.createContext(ctx);
 vm.runInContext(stripTypeScriptTypes(fs.readFileSync('backend/writing/prepared/live-transcription.ts','utf8').replace(/^import .*;\s*$/gm,'').replace('export async function','async function')),ctx);
 const input={admin,actor:'owner',essay:{id:'essay',correction_scope:'introduction'},key:'synthetic',fetcher:()=>{throw Error('No network')}};
 let r=await ctx.transcribeLive(input);assert.equal(r.text,'Texto lido com [?].');assert.equal(calls,1);assert.match(payload.instructions,/sem corrigir/);assert.match(payload.instructions,/somente a etapa/);assert.equal(payload.input[0].content[1].type,'input_image');assert.equal(finished.p_attempt,'attempt');
 claimed=false;r=await ctx.transcribeLive(input);assert.equal(r.text,'Texto já lido');assert.equal(calls,1);
 claimed=true;providerStatus='incomplete';await assert.rejects(ctx.transcribeLive(input));assert(finished.p_error);assert.equal(finished.p_text,'');
 const before=calls;r=await ctx.transcribeLive({...input,essay:{...input.essay,input_text:'Texto confirmado'}});assert.equal(r.confirmed,true);assert.equal(calls,before);
 console.log('PASS OCR preparado: imagem/etapa, texto fiel, cache sem IA repetida, falha sem texto inventado e confirmação persistente.');
})().catch(e=>{console.error(e);process.exitCode=1});
