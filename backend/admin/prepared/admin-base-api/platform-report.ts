import {costExchangeRate} from './cost-fx.ts';
// Invoked only behind the approved superadmin guard. No writes or paid calls.
const knownNumber=(v:any)=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0;
export function estimate(item:any,cfg:any){
 if(item.metered)return {cost:knownNumber(item.estimated_cost_usd)?Number(item.estimated_cost_usd):null,partial:item.cost_status==='partial'};
 if(knownNumber(item.estimated_cost_usd))return {cost:Number(item.estimated_cost_usd),partial:false};
 const u=item.usage||(knownNumber(item.input_tokens)&&knownNumber(item.output_tokens)?{input_tokens:item.input_tokens,output_tokens:item.output_tokens}:null);if(!u||!knownNumber(u.input_tokens)||!knownNumber(u.output_tokens))return {cost:null,partial:false};
 const input=Number(u.input_tokens),output=Number(u.output_tokens),cached=Math.min(input,Math.max(0,Number(u.input_tokens_details?.cached_tokens||0))),write=Math.min(input-cached,Math.max(0,Number(u.input_tokens_details?.cache_write_tokens||0)));
 let rates:any;
 if(/^gpt-4\.1-mini(?:-2025-04-14)?$/.test(item.model||''))rates={input:.4,cached:.1,write:.4,output:1.6};
 else if(item.model==='gpt-5.5')rates={input:5,cached:.5,write:5,output:30};
 else if(item.model===cfg.model){const tier=input>Number(cfg.long_context_threshold_tokens)?'long':'short';rates={input:cfg[tier+'_context_input_per_million'],cached:cfg[tier+'_context_cached_input_per_million'],write:cfg[tier+'_context_cache_write_per_million'],output:cfg[tier+'_context_output_per_million']};}
 if(!rates||!Object.values(rates).every(knownNumber))return {cost:null,partial:false};
 const tokenCost=((input-cached-write)*rates.input+cached*rates.cached+write*rates.write+output*rates.output)/1e6;
 // Historical live corrections did not preserve tool-call counts. Never call this complete.
 const searchUnknown=item.search_possible&&!knownNumber(u.web_search_calls);
 const toolCost=item.search_possible&&!searchUnknown&&knownNumber(cfg.web_search_per_call_usd)?Number(u.web_search_calls)*Number(cfg.web_search_per_call_usd):0;
 return {cost:tokenCost+toolCost,partial:!!searchUnknown||(!item.usage&&item.model==='gpt-5.5')};
}
export function summarize(name:string,items:any[],cfg:any){
 const values=items.map(x=>({...x,...estimate(x,cfg)}));const known=values.filter(x=>x.cost!==null);
 const completed=values.filter(x=>['completed','approved','valid'].includes(x.status)).length;
 const failed=values.filter(x=>['failed','invalid','technical','cancelled','expired'].includes(x.status)).length;
 const missing=values.length-known.length,partial=values.filter(x=>x.partial).length,cost=known.reduce((n,x)=>n+x.cost,0);
 return {name,requests:values.length,completed,failed,pending:values.length-completed-failed,known_cost_count:known.length,missing_cost_count:missing,partial_cost_count:partial,failed_missing_cost_count:values.filter(x=>['failed','invalid','technical','cancelled','expired'].includes(x.status)&&(x.cost===null||x.partial)).length,cost_usd:cost,failed_cost_usd:known.filter(x=>['failed','invalid','technical','cancelled','expired'].includes(x.status)).reduce((n,x)=>n+x.cost,0),average_attempt_usd:values.length&&missing===0&&partial===0?cost/values.length:null,average_completed_usd:completed&&missing===0&&partial===0?cost/completed:null,input_tokens:values.reduce((n,x)=>n+Number(x.input_tokens??x.usage?.input_tokens??0),0),output_tokens:values.reduce((n,x)=>n+Number(x.output_tokens??x.usage?.output_tokens??0),0)};
}
export async function exchangeRate(fetcher:any=fetch,now=new Date()){
 try{const date=(d:Date)=>`${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}-${d.getUTCFullYear()}`;
 const query=new URLSearchParams({'@dataInicial':`'${date(new Date(+now-10*86400000))}'`,'@dataFinalCotacao':`'${date(now)}'`,'$top':'1','$orderby':'dataHoraCotacao desc','$format':'json','$select':'cotacaoVenda,dataHoraCotacao'});
 const url='https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?'+query.toString().replaceAll('+','%20');
 const r=await fetcher(url,{signal:AbortSignal.timeout(6000)});if(!r.ok)throw Error();const v=(await r.json()).value?.[0];if(!knownNumber(v?.cotacaoVenda)||Number(v.cotacaoVenda)<=0)throw Error();
 return {rate:Number(v.cotacaoVenda),date:String(v.dataHoraCotacao),source:'Banco Central · PTAX venda (última cotação disponível)',available:true};
 }catch{return {rate:null,date:null,source:'Banco Central indisponível',available:false};}
}
export async function accountLogins(admin:any){
 const result=new Map();for(let page=1;page<=100;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:500});if(error)throw Error('Não foi possível consultar os últimos logins.');for(const u of data.users||[])result.set(u.id,u.last_sign_in_at||null);if((data.users||[]).length<500)return result;}throw Error('Consulta de acessos excedeu o limite.');
}
export async function platformReport(admin:any,days:number,fetcher:any=fetch){
 const until=new Date().toISOString(),since=new Date(Date.parse(until)-days*86400000).toISOString();
 async function rows(table:string,columns:string,dated=true,dateColumn='created_at',key='id'){
  const out:any[]=[];for(let start=0;start<50000;start+=500){let q=admin.from(table).select(columns).order(key).range(start,start+499);if(dated)q=q.gte(dateColumn,since).lt(dateColumn,until);const {data,error}=await q;if(error)throw Error('Não foi possível consultar os indicadores. Tente novamente.');out.push(...(data||[]));if((data||[]).length<500)return out;}throw Error('Selecione um período menor.');
 }
 const [usage,proposals,jobs,wallets,profiles,payments,live,checks,imports,flags,fx,logins,accesses,attempts,guidance]=await Promise.all([
 rows('ai_correction_usage','id,correction_job_id,teacher_id,estimated_cost_usd,input_tokens,output_tokens,model,status,created_at'),rows('proposal_ai_usage','id,actor,estimated_cost_usd,input_tokens,output_tokens,model,status,created_at'),rows('ai_correction_jobs','id,requested_by,status,model,error_message,created_at'),rows('correction_credit_wallets','profile_id,balance,updated_at',false,'created_at','profile_id'),rows('profiles','id,full_name,email,role,approval_status,admin_hidden',false),rows('correction_payment_orders','id,profile_id,package_code,credits,amount_cents,currency,status,approved_at,mp_payment_id,created_at',false,'approved_at'),rows('live_jobs','id,owner_id,purpose,status,model,usage,error_message,created_at'),rows('live_input_checks','id,owner_id,status,usage,created_at'),rows('student_import_ai_jobs','id,actor,status,model,usage,created_at'),rows('system_feature_flags','feature_key,config',false,'created_at','feature_key'),costExchangeRate(admin,fetcher),accountLogins(admin),rows('platform_access_events','session_id,profile_id,created_at',true,'created_at','session_id'),rows('ai_usage_attempts','*'),rows('writing_guidance','id,owner_id,status,error_message,created_at')]);
 const cfg=flags.find(x=>x.feature_key==='ai_correction')?.config||{};
 // One usage row = one recorded attempt. Add jobs with no usage, including failures.
 const sourceMap=new Map([...jobs.map(x=>['ai_correction_jobs|'+x.id,x]),...proposals.map(x=>['proposal_ai_usage|'+x.id,x]),...live.map(x=>['live_jobs|'+x.id,x]),...checks.map(x=>['live_input_checks|'+x.id,x]),...imports.map(x=>['student_import_ai_jobs|'+x.id,x]),...guidance.map(x=>['writing_guidance|'+x.id,x])]);
 for(const table of ['ai_correction_jobs','proposal_ai_usage','live_jobs','live_input_checks','student_import_ai_jobs','writing_guidance']){
  const ids=[...new Set(attempts.filter(a=>a.source_table===table&&!sourceMap.has(table+'|'+a.source_id)).map(a=>a.source_id))];
  for(let i=0;i<ids.length;i+=200){const {data,error}=await admin.from(table).select('id,status').in('id',ids.slice(i,i+200));if(error)throw Error('Não foi possível consultar o estado das tentativas.');for(const item of data||[])sourceMap.set(table+'|'+item.id,item);}
 }
 const firstAttempt=new Map();for(const a of attempts){const k=a.source_table+'|'+a.source_id;if(!firstAttempt.has(k)||a.created_at<firstAttempt.get(k))firstAttempt.set(k,a.created_at);}
 const covered=(table:string,id:string)=>firstAttempt.has(table+'|'+id);
 const recordedJobs=new Set(usage.map(x=>x.correction_job_id).filter(Boolean));
 const legacyCorrections=[...usage.filter(x=>!covered('ai_correction_jobs',x.correction_job_id)||x.created_at<firstAttempt.get('ai_correction_jobs|'+x.correction_job_id)).map(x=>({...x,operation_id:'ai_correction_jobs|'+x.correction_job_id,actor:x.teacher_id,error_message:jobs.find(j=>j.id===x.correction_job_id)?.error_message,status:jobs.find(j=>j.id===x.correction_job_id)?.status||x.status})),...jobs.filter(x=>!recordedJobs.has(x.id)&&!covered('ai_correction_jobs',x.id)).map(x=>({...x,actor:x.requested_by,estimated_cost_usd:null}))];
 const measured=attempts.map(a=>{
  const source=sourceMap.get(a.source_table+'|'+a.source_id),sourceFailed=['failed','invalid','technical','cancelled','expired'].includes(source?.status);
  const providerFailed=['failed','cancelled','incomplete','transport_error','invalid_response','interrupted','unavailable'].includes(a.status);
  const status=sourceFailed?source.status:providerFailed?'failed':a.status==='completed'?'completed':['queued','processing','pending','running'].includes(a.status)?'processing':'unknown';
  return {...a,metered:true,operation_id:a.source_table+'|'+a.source_id,actor:a.actor_id,estimated_cost_usd:a.cost_usd,status,error_message:a.error_code||source?.error_message||'',purpose:a.stage==='input_check'?null:a.stage};
 });
 const all=[...legacyCorrections.map(x=>({...x,service:'Correção'})),...proposals.filter(x=>!covered('proposal_ai_usage',x.id)).map(x=>({...x,service:'Proposta'})),...live.filter(x=>!covered('live_jobs',x.id)).map(x=>({...x,actor:x.owner_id,search_possible:x.purpose==='correction',service:'Ao Vivo'})),...checks.filter(x=>!covered('live_input_checks',x.id)).map(x=>({...x,actor:x.owner_id,model:x.usage?.model||'Não registrado',service:'Ao Vivo'})),...imports.filter(x=>!covered('student_import_ai_jobs',x.id)).map(x=>({...x,service:'Importação'})),...guidance.filter(x=>!covered('writing_guidance',x.id)).map(x=>({...x,operation_id:'writing_guidance|'+x.id,actor:x.owner_id,estimated_cost_usd:null,service:'Construção guiada'})),...measured];
 const services=[['Propostas','Proposta'],['Correções','Correção'],['Ao Vivo','Ao Vivo'],['Importação de alunos','Importação'],['Construção guiada','Construção guiada']].map(([name,type])=>{
  const items=all.filter(x=>x.service===type),summary=summarize(name,items,cfg);
  const completed=items.filter(x=>['completed','approved','valid'].includes(x.status)&&(type!=='Ao Vivo'||x.purpose==='correction')&&(!x.operation_id||!sourceMap.has(x.operation_id)||['completed','approved','valid'].includes(sourceMap.get(x.operation_id)?.status)));
  const deliveries=new Set(completed.map(x=>x.operation_id||x.correction_job_id||x.id)).size;
  return {...summary,deliveries,average_completed_usd:deliveries&&!summary.missing_cost_count&&!summary.partial_cost_count?summary.cost_usd/deliveries:null,known_average_completed_usd:deliveries?summary.cost_usd/deliveries:null};
 });
 const breakdown=[['Ao Vivo · verificação de conteúdo',null],['Ao Vivo · tema','theme'],['Ao Vivo · correção','correction']].map(([name,purpose])=>summarize(name,all.filter(x=>x.service==='Ao Vivo'&&(x.purpose||null)===purpose),cfg));
 const models=[...new Set(all.map(x=>x.model||'Não informado'))].map(model=>summarize(String(model),all.filter(x=>(x.model||'Não informado')===model),cfg));
 const failures=all.filter(x=>['failed','invalid','technical','cancelled','expired'].includes(x.status)).sort((a,b)=>b.created_at.localeCompare(a.created_at));
 const failureGroups=new Map();
 for(const failure of failures){
 const stage=failure.service==='Construção guiada'?({guidance:'Orientação do tutor',authorship_check:'Verificação de autoria',repertoire_search:'Pesquisa de repertório'}[failure.stage]||'Orientação do tutor'):failure.stage==='recalibration'?'Recalibração C2/C3':failure.stage==='research'?'Pesquisa de fontes':failure.stage==='format'?'Estruturação da proposta':failure.service==='Ao Vivo'?(failure.purpose==='theme'?'Verificação de tema':failure.purpose==='correction'?'Correção':'Verificação de conteúdo'):failure.service==='Importação'?'Organização da lista':'Geração';
 const code=String(failure.error_message||'');
 const type=failure.status==='invalid'?'Conteúdo inválido':failure.status==='technical'?'Falha técnica na verificação':/credit_balance_exhausted|insufficient_quota/.test(code)?'Saldo ou cota do provedor':/rate_limit_exceeded/.test(code)?'Limite de requisições':/timeout|timed out/i.test(code)?'Tempo excedido':'Falha de processamento (causa não registrada)';
 const key=[failure.service,stage,type].join('|');if(!failureGroups.has(key))failureGroups.set(key,{service:failure.service,stage,type,items:[]});failureGroups.get(key).items.push(failure);
 }
 const failureSummary=[...failureGroups.values()].map(group=>({service:group.service,stage:group.stage,type:group.type,...summarize(group.type,group.items,cfg)}));
 const people=new Map(profiles.map(p=>[p.id,p])),visible=profiles.filter(p=>!p.admin_hidden),paidAll=payments.filter(x=>x.status==='approved'&&x.currency==='BRL'),paid=paidAll.filter(x=>x.approved_at&&x.approved_at>=since&&x.approved_at<until);
 const accessPeople=visible.filter(p=>p.approval_status==='approved'&&['student','teacher'].includes(p.role));
 const accessIds=new Set(accessPeople.map(p=>p.id));
 const accessRows=accessPeople.map(p=>{const events=accesses.filter(a=>a.profile_id===p.id);return {role:p.role,name:p.full_name,email:p.email,last_sign_in_at:events.map(a=>a.created_at).sort().at(-1)||null,access_count:events.length};}).filter(p=>p.access_count>0).sort((a,b)=>String(b.last_sign_in_at).localeCompare(String(a.last_sign_in_at)));
 const pendingOperations=[...sourceMap.values()].filter(x=>['queued','processing','pending','running'].includes(x.status)).length;
 return {ok:true,days,since,until,failure_summary:failureSummary,billing:{available:false,balance_usd:null,reason:'Saldo do provedor não conectado. Consulte o billing da OpenAI.'},access_tracking_since:flags.find(x=>x.feature_key==='platform_access_tracking')?.config?.started_at||null,access_count:accesses.filter(a=>accessIds.has(a.profile_id)).length,access_scope:'Alunos e professores aprovados e visíveis. Histórico compartilhado entre produção e testes, sem identificação do ambiente.',last_logins:accessRows,services,live_breakdown:breakdown,models,fx,pricing_note:'Novas chamadas: tokens, cache e pesquisas registrados por tentativa, com tarifa preservada. Histórico incompleto permanece parcial. Conversão em reais pela cotação PTAX indicada; não inclui impostos e taxas cambiais nem equivale à fatura. Contas ocultas continuam incluídas nos custos.',failures_count:failures.length,metering_started_at:attempts.length?attempts.map(x=>x.created_at).sort()[0]:null,pending_jobs:pendingOperations,failures:failures.slice(0,20).map(x=>({id:x.id,service:x.service,created_at:x.created_at,account:people.get(x.actor)?.full_name||'Conta não disponível'})),payments:paid.map(x=>({id:x.id,name:people.get(x.profile_id)?.full_name||'Conta não disponível',email:people.get(x.profile_id)?.email||'',role:people.get(x.profile_id)?.role||'',hidden:!!people.get(x.profile_id)?.admin_hidden,package_code:x.package_code,credits:x.credits,amount_brl:Number(x.amount_cents)/100,approved_at:x.approved_at,status:x.status,provider:x.mp_payment_id?'Mercado Pago':'Não registrado',payment_id:x.mp_payment_id||null,origin:'Compra de créditos · '+(String(x.package_code).startsWith('student_')?'Aluno':'Professor')})).sort((a,b)=>String(b.approved_at).localeCompare(String(a.approved_at))),revenue_total_brl:paidAll.reduce((n,x)=>n+Number(x.amount_cents||0),0)/100,paid_orders_total:paidAll.length,revenue_brl:paid.reduce((n,x)=>n+Number(x.amount_cents||0),0)/100,paid_orders:paid.length,wallets:wallets.filter(x=>people.has(x.profile_id)&&!people.get(x.profile_id).admin_hidden).map(x=>({profile_id:x.profile_id,name:people.get(x.profile_id).full_name,email:people.get(x.profile_id).email||'',balance:x.balance,updated_at:x.updated_at})).sort((a,b)=>a.name.localeCompare(b.name)),accounts:{total:visible.length,active:visible.filter(x=>x.approval_status==='approved').length,pending:visible.filter(x=>x.approval_status==='pending').length,hidden:profiles.length-visible.length}};
}
