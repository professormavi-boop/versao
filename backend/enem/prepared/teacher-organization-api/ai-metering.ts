import {costExchangeRate} from './cost-fx.ts';
const valid=(x:any)=>x!==null&&x!==undefined&&Number.isFinite(Number(x))&&Number(x)>=0;
export function priceSnapshot(model:string,cfg:any){
 if(/^gpt-4\.1-mini(?:-2025-04-14)?$/.test(model))return {model,version:'openai-4.1-mini-2026-10-02',short:{input:.4,cached:.1,write:.4,output:1.6},long:null,threshold:null,search:.01};
 if(model==='gpt-5.5')return {model,version:'openai-5.5-2026-10-02',short:{input:5,cached:.5,write:5,output:30},long:null,threshold:null,search:.01};
 if(model!==cfg.model)return {model,version:'unknown'};
 const tier=(p:string)=>({input:cfg[p+'_context_input_per_million'],cached:cfg[p+'_context_cached_input_per_million'],write:cfg[p+'_context_cache_write_per_million'],output:cfg[p+'_context_output_per_million']});
 return {model,version:cfg.pricing_version,short:tier('short'),long:tier('long'),threshold:cfg.long_context_threshold_tokens,search:cfg.web_search_per_call_usd};
}
export function providerAccounting(p:any,pricing:any,tools:any[]=[]){
 const raw=p?.usage;
 if(!raw||!valid(raw.input_tokens)||!valid(raw.output_tokens))return {usage:null,cost_usd:null,cost_status:'unknown'};
 const input=Number(raw.input_tokens),output=Number(raw.output_tokens),cached=Math.min(input,Number(raw.input_tokens_details?.cached_tokens||0)),write=Math.min(input-cached,Number(raw.input_tokens_details?.cache_write_tokens||0));
 const search=(p.output||[]).filter((x:any)=>x.type==='web_search_call').length;
 const unknownTools=tools.some((t:any)=>!['web_search','web_search_preview'].includes(t.type))||(p.output||[]).some((x:any)=>['file_search_call','code_interpreter_call','image_generation_call'].includes(x.type));
 const usage={input_tokens:input,output_tokens:output,input_tokens_details:{cached_tokens:cached,cache_write_tokens:write},output_tokens_details:{reasoning_tokens:raw.output_tokens_details?.reasoning_tokens??null},web_search_calls:search};
 const rate=pricing.long&&input>pricing.threshold?pricing.long:pricing.short;
 if(!rate||!Object.values(rate).every(valid)||(search&&!valid(pricing.search)))return {usage,cost_usd:null,cost_status:'unknown'};
 const cost=((input-cached-write)*rate.input+cached*rate.cached+write*rate.write+output*rate.output)/1e6+search*Number(pricing.search||0);
 return {usage,cost_usd:cost,cost_status:unknownTools?'partial':'known'};
}
async function save(admin:any,id:string,patch:any){
 for(let i=0;i<2;i++){let q=admin.from('ai_usage_attempts').update({...patch,updated_at:new Date().toISOString()}).eq('id',id);if(['started','queued','in_progress','transport_error','interrupted','unavailable'].includes(patch.status))q=q.in('status',['started','queued','in_progress','transport_error']);const r=await q;if(!r.error)return;}
 // The started row survives: an interrupted/unknown attempt is never a silent zero.
 console.error('AI_METERING_UPDATE_FAILED',id);
}
export async function meteredFetch(admin:any,context:any,url:string,init:any={},fetcher:any=fetch){
 const post=(init.method||'GET').toUpperCase()==='POST';
 let row:any;
 if(post){
  const payload=JSON.parse(init.body),cfg=await admin.from('system_feature_flags').select('config').eq('feature_key','ai_correction').maybeSingle();
  if(cfg.error)throw Error('Não foi possível registrar o custo. Nenhuma chamada de IA foi iniciada.');
  const fx=await costExchangeRate(admin,fetcher);
  row={id:crypto.randomUUID(),source_table:context.table,source_id:context.id,actor_id:context.actor,service:context.service,stage:context.stage,model:payload.model,status:'started',pricing:{...priceSnapshot(payload.model,cfg.data?.config||{}),tools:(payload.tools||[]).map((t:any)=>({type:t.type}))},fx_rate:fx.rate,fx_date:fx.date};
  context.attemptId=row.id;
  const recorded=await admin.from('ai_usage_attempts').insert(row);if(recorded.error)throw Error('Não foi possível registrar o custo. Nenhuma chamada de IA foi iniciada.');
 }else{
  const providerId=decodeURIComponent(new URL(url).pathname.split('/').pop()||'');
  const found=await admin.from('ai_usage_attempts').select('*').eq('provider_id',providerId).maybeSingle();row=found.data;
 }
 let response:any;
 try{response=await fetcher(url,init);}catch(error){if(row)await save(admin,row.id,{status:'transport_error',error_code:error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'network_error'});throw error;}
 if(row){
  const p=await response.clone().json().catch(()=>null);
  // Polling errors do not overwrite consumption already received from a terminal response.
  if(post||response.ok){
   const accounting=providerAccounting(p,row.pricing,row.pricing.tools||[]);
   const patch:any={provider_id:p?.id||row.provider_id||null,provider_request_id:response.headers.get('x-request-id')||row.provider_request_id||null,http_status:response.status,status:!response.ok?'failed':p?.status||'invalid_response',error_code:p?.error?.code||p?.incomplete_details?.reason||(!p?'invalid_json':null)};
   if(accounting.usage)Object.assign(patch,accounting,{cost_brl:accounting.cost_usd!==null&&row.fx_rate?accounting.cost_usd*row.fx_rate:null});
   await save(admin,row.id,patch);
  }
 }
 return response;
}
export async function reconcileMetering(admin:any,key:string,fetcher:any=fetch){
 const {data,error}=await admin.from('ai_usage_attempts').select('*').in('status',['started','queued','in_progress','transport_error']).lt('updated_at',new Date(Date.now()-15000).toISOString()).order('updated_at').limit(20);
 if(error)throw Error('AI_METERING_READ_FAILED');
 for(let i=0;i<(data||[]).length;i+=5)await Promise.all(data.slice(i,i+5).map(async(row:any)=>{
  const age=Date.now()-Date.parse(row.created_at);
  if(!row.provider_id){if(age>600000)await save(admin,row.id,{status:'interrupted',error_code:row.error_code||'provider_response_missing'});return;}
  if(!key)return;
  try{
   const response=await meteredFetch(admin,{},'https://api.openai.com/v1/responses/'+encodeURIComponent(row.provider_id),{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000)},fetcher);
   if(response.status===404||age>3600000)await save(admin,row.id,{status:'unavailable',error_code:'provider_usage_unavailable'});
  }catch{if(age>3600000)await save(admin,row.id,{status:'unavailable',error_code:'provider_usage_unavailable'});}
 }));
 return (data||[]).length;
}

export async function meteringOutcome(admin:any,context:any,success:boolean){if(context?.attemptId)await save(admin,context.attemptId,{status:success?'completed':'failed',error_code:success?null:'application_processing_failure'});}
