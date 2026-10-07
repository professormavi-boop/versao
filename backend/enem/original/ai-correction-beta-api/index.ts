import {meteredFetch} from './ai-metering.ts';
import { QUALITY_INSTRUCTIONS, QUALITY_VERSION, consultedSources, validateEvidence, reviewedEvidence } from './correction-quality.ts'
import { ESSENTIAL_PROTOCOL } from './protocolo-essencial.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json; charset=utf-8'
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:cors})
const VALID_SCORES=new Set([0,40,80,120,160,200])
const SCORING_CALIBRATION='c2-c3-2026-09-22'
const OFFICIAL_MODEL='versao-enem-v2'

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors})
  try{
    const url=Deno.env.get('SUPABASE_URL')
    const anon=Deno.env.get('SUPABASE_ANON_KEY')
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiKey=Deno.env.get('OPENAI_API_KEY')||''
    const auth=req.headers.get('Authorization')||''
    if(!url||!anon||!service) return json({error:'Configuração do servidor incompleta.'},500)
    if(!auth.startsWith('Bearer ')) return json({error:'Não autenticado.'},401)
    const token=auth.slice(7)
    const body=await req.json().catch(()=>({}))
    const authClient=createClient(url,anon,{global:{headers:{Authorization:auth}}})
    const admin=createClient(url,service)
    const schedulerAction=token===service&&['reconcile','repair'].includes(String(body.action||''))?String(body.action):''
    const scheduler=!!schedulerAction
    let scheduledJob=null
    if(scheduler){
      const selected=await admin.from('ai_correction_jobs').select('id,requested_by,submission_id,status,model').eq('id',String(body.job_id||'')).maybeSingle()
      if(selected.error||!selected.data||selected.data.model===OFFICIAL_MODEL)return json({error:'Execução de IA não encontrada.'},404)
      scheduledJob=selected.data
      body.submission_id=scheduledJob.submission_id
      if(schedulerAction==='reconcile')body.action='get'
    }
    const identity=scheduler?{data:{user:{id:scheduledJob.requested_by}},error:null}:await authClient.auth.getUser(token)
    const {data:{user},error:userErr}=identity
    if(userErr||!user) return json({error:'Sessão inválida.'},401)
    const {data:profile,error:profileErr}=await admin.from('profiles').select('id,role,approval_status,organization_id,teacher_scope').eq('id',user.id).maybeSingle()
    if(profileErr||!profile||profile.approval_status!=='approved'||!['super_admin','teacher'].includes(profile.role)) return json({error:'Sem permissão para correção por IA.'},403)

    async function featureConfig(){
      const {data:flag}=await admin.from('system_feature_flags').select('is_enabled,config').eq('feature_key','ai_correction').maybeSingle()
      const cfg=flag?.config||{}
      return {
        enabled:!!flag?.is_enabled,
        model:String(cfg.model||'gpt-5.6-sol'),
        reasoning:String(cfg.reasoning||'low'),
        pricing_version:String(cfg.pricing_version||'openai_gpt_5_6_sol_2026_09_21'),
        long_context_threshold_tokens:Number(cfg.long_context_threshold_tokens||272000),
        short_context_input_per_million:Number(cfg.short_context_input_per_million||cfg.input_price_per_million||4),
        short_context_cached_input_per_million:Number(cfg.short_context_cached_input_per_million||0.4),
        short_context_cache_write_per_million:Number(cfg.short_context_cache_write_per_million||5),
        short_context_output_per_million:Number(cfg.short_context_output_per_million||cfg.output_price_per_million||20),
        long_context_input_per_million:Number(cfg.long_context_input_per_million||8),
        long_context_cached_input_per_million:Number(cfg.long_context_cached_input_per_million||0.8),
        long_context_cache_write_per_million:Number(cfg.long_context_cache_write_per_million||10),
        long_context_output_per_million:Number(cfg.long_context_output_per_million||30),
        web_search_per_call_usd:Number(cfg.web_search_per_call_usd||0.01)
      }
    }

    function usageAccounting(provider,cfg){
      const usage=provider?.usage||{}
      const inputTokens=Math.max(0,Number(usage.input_tokens||0))
      const outputTokens=Math.max(0,Number(usage.output_tokens||0))
      const cachedRaw=Math.max(0,Number(usage.input_tokens_details?.cached_tokens||0))
      const cacheWriteRaw=Math.max(0,Number(usage.input_tokens_details?.cache_write_tokens||0))
      const cachedTokens=Math.min(inputTokens,cachedRaw)
      const cacheWriteTokens=Math.min(Math.max(0,inputTokens-cachedTokens),cacheWriteRaw)
      const ordinaryInputTokens=Math.max(0,inputTokens-cachedTokens-cacheWriteTokens)
      const reasoningTokens=Math.max(0,Number(usage.output_tokens_details?.reasoning_tokens||0))
      const webSearchCalls=(provider?.output||[]).filter(item=>item?.type==='web_search_call'&&item?.status==='completed'&&item?.action?.type==='search').length
      const longContext=inputTokens>cfg.long_context_threshold_tokens
      const rates=longContext?{input:cfg.long_context_input_per_million,cached:cfg.long_context_cached_input_per_million,cacheWrite:cfg.long_context_cache_write_per_million,output:cfg.long_context_output_per_million}:{input:cfg.short_context_input_per_million,cached:cfg.short_context_cached_input_per_million,cacheWrite:cfg.short_context_cache_write_per_million,output:cfg.short_context_output_per_million}
      const inputCost=(ordinaryInputTokens*rates.input+cachedTokens*rates.cached+cacheWriteTokens*rates.cacheWrite)/1e6
      const outputCost=outputTokens*rates.output/1e6
      const webSearchCost=webSearchCalls*cfg.web_search_per_call_usd
      return {inputTokens,outputTokens,totalTokens:Number(usage.total_tokens||inputTokens+outputTokens),ordinaryInputTokens,cachedTokens,cacheWriteTokens,reasoningTokens,webSearchCalls,inputCost,outputCost,webSearchCost,totalCost:inputCost+outputCost+webSearchCost,contextTier:longContext?'long':'short',rates}
    }

    async function accountForUser(){
      if(profile.role==='teacher'&&['assigned','institution_edit'].includes(profile.teacher_scope)){const {data,error}=await admin.rpc('ensure_teacher_ai_account',{actor:profile.id});if(error)throw error;return data}
      const {data,error}=await admin.from('billing_accounts').select('id,account_type,status,ai_correction_enabled,billing_enabled').eq('profile_id',profile.id).limit(1).maybeSingle();if(error)throw error;return data||null
    }

    async function assertEditableSubmission(submissionId){
      if(!submissionId) throw new Error('Submissão não informada.')
      const {data:sub,error}=await admin.from('submissions').select('id,student_id,round_id,project_id,status,source').eq('id',submissionId).single()
      if(error||!sub||!sub.round_id) throw new Error('Submissão não encontrada.')
      const [{data:student,error:studErr},{data:round,error:roundErr},{data:project,error:projectErr}]=await Promise.all([
        admin.from('students').select('id,organization_id').eq('id',sub.student_id).single(),
        admin.from('rounds').select('id,project_id,number,theme,proposal_command,understand_prompt').eq('id',sub.round_id).single(),
        admin.from('projects').select('id,organization_id').eq('id',sub.project_id).single()
      ])
      if(studErr||roundErr||projectErr||!student||!round||!project) throw new Error('Aluno, proposta ou instituição não encontrados.')
      if(project.organization_id!==student.organization_id) throw new Error('Dados da submissão inconsistentes.')
      const {data:allowed,error:permissionError}=await admin.rpc('teacher_can_edit_student',{actor:user.id,sid:student.id})
      if(permissionError||!allowed)throw new Error('Você não tem permissão de edição para este aluno.')
      return {sub,student,round,project}
    }

    async function proposalContext(roundId){
      const {data:motivators,error}=await admin.from('proposal_motivators').select('display_order,body,source_label,source_url').eq('round_id',roundId).order('display_order')
      if(error) throw error
      return (motivators||[]).map((m,i)=>`TEXTO MOTIVADOR ${i+1}:\n${m.body}${m.source_label?`\nFONTE: ${m.source_label}`:''}${m.source_url?`\nLINK: ${m.source_url}`:''}`).join('\n\n')
    }

    async function signedInputs(submissionId){
      const {data:files,error}=await admin.from('submission_files').select('page_number,storage_path,mime_type').eq('submission_id',submissionId).order('page_number')
      if(error) throw error
      if((files||[]).length!==1) throw new Error('A redação precisa ter exatamente 1 arquivo válido antes da correção com IA.')
      const out=[]
      for(const f of files||[]){const {data:signed,error:sErr}=await admin.storage.from('essay-live').createSignedUrl(f.storage_path,900);if(sErr||!signed?.signedUrl) throw sErr||new Error('Não foi possível preparar a redação para leitura.');if(String(f.mime_type||'').includes('pdf')) out.push({type:'input_file',file_url:signed.signedUrl});else out.push({type:'input_image',image_url:signed.signedUrl,detail:'high'})}
      return out
    }

    function schema(){
      const competence=()=>({type:'object',additionalProperties:false,properties:{score:{type:'integer',enum:[0,40,80,120,160,200]},diagnostic:{type:'string',maxLength:220}},required:['score','diagnostic']})
      return {type:'object',additionalProperties:false,properties:{transcription:{type:'string'},syntax_assessment:{type:'string'},reading_notes:{type:'string'},proposal_complete:{type:'boolean'},essay_status:{type:'string',enum:['regular','zero_candidate','uncertain']},zero_reason:{type:'string'},c1_deviations:{type:'array',items:{type:'object',additionalProperties:false,properties:{original:{type:'string'},correction:{type:'string'},rule:{type:'string'},category:{type:'string'},location:{type:'string'},evidence:{type:'string'}},required:['original','correction','rule','category','location','evidence']}},repertoire_checks:{type:'array',items:{type:'object',additionalProperties:false,properties:{reference:{type:'string'},classification:{type:'string',enum:['confirmada','contradita','não confirmada']},analysis:{type:'string'},source_url:{type:'string'}},required:['reference','classification','analysis','source_url']}},c5_check:{type:'object',additionalProperties:false,properties:{agent:{type:'string'},action:{type:'string'},means:{type:'string'},purpose:{type:'string'},detail:{type:'string'},human_rights:{type:'string'},argument_alignment:{type:'string'}},required:['agent','action','means','purpose','detail','human_rights','argument_alignment']},main_strength:{type:'string',maxLength:280},next_step:{type:'string',maxLength:280},improvement_priority:{type:'string'},reading_quality:{type:'string',enum:['good','partial','poor']},needs_manual_review:{type:'boolean'},manual_review_reason:{type:'string'},theme_adherence:{type:'string',enum:['adequate','partial','off_topic']},motivating_text_copy:{type:'string',enum:['none','possible','relevant']},competencies:{type:'object',additionalProperties:false,properties:{C1:competence(),C2:competence(),C3:competence(),C4:competence(),C5:competence()},required:['C1','C2','C3','C4','C5']},alerts:{type:'array',items:{type:'string'},maxItems:6}},required:['main_strength','next_step','syntax_assessment','reading_notes','proposal_complete','essay_status','zero_reason','transcription','c1_deviations','repertoire_checks','c5_check','improvement_priority','reading_quality','needs_manual_review','manual_review_reason','theme_adherence','motivating_text_copy','competencies','alerts']}
    }

    function normalizeResult(raw,sources=[]){
      if(raw?.reading_quality==='poor')throw new Error('A imagem não permite uma correção segura. Refaça a foto com boa iluminação e foco, sem cortar linhas. Use flash se necessário, evitando reflexos.')
      if(!String(raw?.transcription||'').trim())throw new Error('Não foi possível confirmar a transcrição da redação. Refaça a foto.')
      const evidence=validateEvidence(raw,sources),comps={}
      for(const code of ['C1','C2','C3','C4','C5']){const c=raw?.competencies?.[code],score=Number(c?.score);if(!Number.isInteger(c?.score)||!VALID_SCORES.has(score)) throw new Error(`Pontuação inválida em ${code}.`);comps[code]={score,diagnostic:String(c?.diagnostic||''),strength:String(c?.strength||''),improvement:String(c?.improvement||'')}}
      const total=(Object.values(comps) as any[]).reduce((sum,c)=>sum+c.score,0)
      return {report_format:'essential-v1',main_strength:String(raw.main_strength||''),next_step:String(raw.next_step||''),protocol_version:QUALITY_VERSION,scoring_calibration:SCORING_CALIBRATION,syntax_assessment:raw.syntax_assessment,reading_notes:raw.reading_notes,proposal_complete:raw.proposal_complete,essay_status:raw.essay_status,zero_reason:raw.zero_reason,transcription:raw.transcription,c1_deviations:raw.c1_deviations||[],repertoire_checks:evidence.repertoire_checks,c5_check:raw.c5_check,paragraph_balance:raw.paragraph_balance,qa_summary:raw.qa_summary,improvement_priority:raw.improvement_priority,detailed_analysis:{report_format:'essential-v1',scoring_calibration:SCORING_CALIBRATION,main_strength:String(raw.main_strength||''),next_step:String(raw.next_step||''),c1_deviations:raw.c1_deviations||[],repertoire_checks:evidence.repertoire_checks,c5_check:raw.c5_check,paragraph_balance:raw.paragraph_balance,qa_summary:raw.qa_summary},preliminary:true,reading_quality:String(raw?.reading_quality||'partial'),needs_manual_review:raw?.reading_quality!=='good'||!!raw?.needs_manual_review,manual_review_reason:String(raw?.manual_review_reason||''),theme_adherence:String(raw?.theme_adherence||'partial'),motivating_text_copy:String(raw?.motivating_text_copy||'none'),competencies:comps,total_score:total,introduction_structure:String(raw?.introduction_structure||''),intervention_alignment:String(raw?.intervention_alignment||''),repertoire_productivity:String(raw?.repertoire_productivity||''),overall_feedback:String(raw?.next_step||raw?.overall_feedback||''),alerts:Array.isArray(raw?.alerts)?raw.alerts.map(x=>String(x)).slice(0,6):[],...evidence}
    }
    function extractOutputText(resp){for(const item of resp?.output||[]){for(const c of item?.content||[]){if(c?.type==='output_text'&&typeof c.text==='string') return c.text}}return ''}
    async function latestJob(submissionId){const {data,error}=await admin.from('ai_correction_jobs').select('*').eq('submission_id',submissionId).neq('model',OFFICIAL_MODEL).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error) throw error;return data||null}
    function publicJob(job){return job?{id:job.id,status:job.status,model:job.model,result:job.status==='processing'?{stage:job.result?.stage}:job.result,error_message:job.error_message,created_at:job.created_at,started_at:job.started_at,completed_at:job.completed_at}:null}

    async function completeBackground(job,provider,ctx,cfg){
      const text=extractOutputText(provider);if(!text)throw new Error('A IA não retornou conteúdo estruturado.')
      let parsed;try{parsed=JSON.parse(text)}catch{throw new Error('Não foi possível interpretar o retorno da IA.')}
      const accounting=usageAccounting(provider,cfg)
      const result={...normalizeResult(parsed,consultedSources(provider)),model:job.model,reasoning:provider.reasoning?.effort||job.result?.requested_reasoning||cfg.reasoning,image_detail:'high',generated_at:new Date().toISOString(),stage:'preliminary_completed',maintenance_repair:!!job.result?.maintenance_repair,timing:{provider_observed_ms:Math.max(0,Date.now()-Date.parse(job.result?.provider_started_at||job.started_at||job.created_at)),provider_reported_ms:provider.completed_at&&provider.created_at?(provider.completed_at-provider.created_at)*1000:null,reasoning_tokens:accounting.reasoningTokens,response_bytes:new TextEncoder().encode(text).length,input_tokens:accounting.inputTokens,cached_input_tokens:accounting.cachedTokens,cache_write_tokens:accounting.cacheWriteTokens,output_tokens:accounting.outputTokens,web_search_calls:accounting.webSearchCalls,estimated_cost_usd:accounting.totalCost}}
      const saved=await admin.rpc('finish_correction_evidence',{p_actor:job.requested_by,p_submission:job.submission_id,p_job:job.id,p_result:result});if(saved.error)throw saved.error
      if(saved.data?.saved){const recorded=await admin.from('ai_correction_usage').insert({correction_job_id:job.id,billing_account_id:job.billing_account_id||null,organization_id:ctx.project.organization_id,teacher_id:job.requested_by,student_id:ctx.student.id,submission_id:job.submission_id,model:job.model,input_tokens:accounting.inputTokens,output_tokens:accounting.outputTokens,total_tokens:accounting.totalTokens,cached_input_tokens:accounting.cachedTokens,cache_write_tokens:accounting.cacheWriteTokens,reasoning_tokens:accounting.reasoningTokens,web_search_calls:accounting.webSearchCalls,input_cost_usd:accounting.inputCost,output_cost_usd:accounting.outputCost,web_search_cost_usd:accounting.webSearchCost,estimated_cost_usd:accounting.totalCost,pricing_version:cfg.pricing_version,context_tier:accounting.contextTier,billable_units:job.result?.maintenance_repair?0:1,status:'completed',metadata:{preliminary:true,store:false,background:true,protocol:QUALITY_VERSION,scoring_calibration:SCORING_CALIBRATION,maintenance_repair:!!job.result?.maintenance_repair,openai_response_id:provider.id,ordinary_input_tokens:accounting.ordinaryInputTokens,pricing:{version:cfg.pricing_version,context_tier:accounting.contextTier,input_per_million:accounting.rates.input,cached_input_per_million:accounting.rates.cached,cache_write_per_million:accounting.rates.cacheWrite,output_per_million:accounting.rates.output,web_search_per_call_usd:cfg.web_search_per_call_usd}}});if(recorded.error)console.error('Usage recording:',recorded.error)}
      const fresh=await admin.from('ai_correction_jobs').select('*').eq('id',job.id).single();if(fresh.error)throw fresh.error
      if(!saved.data?.saved&&fresh.data?.status==='processing')throw new Error('A redação ou a nota foi alterada durante a análise. O resultado não foi aplicado e o crédito reservado foi devolvido.')
      return fresh.data
    }

    const action=String(body.action||''),cfg=await featureConfig(),account=await accountForUser()
    if(action==='status'){
      let creditBalance=null
      if(profile.role==='teacher'){const {data:wallet,error:walletErr}=await admin.from('correction_credit_wallets').select('balance').eq('profile_id',profile.id).maybeSingle();if(walletErr) throw walletErr;creditBalance=Number(wallet?.balance||0)}
      return json({ok:true,enabled:cfg.enabled,key_configured:!!openaiKey,model:cfg.model,reasoning:cfg.reasoning,account_enabled:profile.role==='super_admin'?true:!!account?.ai_correction_enabled&&['active','trial'].includes(account.status),billing_enabled:!!account?.billing_enabled,credit_balance:creditBalance,scoring_calibration:SCORING_CALIBRATION})
    }
    async function recentAverage(){const {data,error}=await admin.from('ai_correction_jobs').select('started_at,completed_at').eq('requested_by',user.id).neq('model',OFFICIAL_MODEL).in('status',['completed','approved']).eq('result->>report_format','essential-v1').eq('result->>reasoning',cfg.reasoning).order('completed_at',{ascending:false}).limit(20);if(error||!Array.isArray(data))return null;const times=data.map(j=>(Date.parse(j.completed_at)-Date.parse(j.started_at))/1000).filter(t=>Number.isFinite(t)&&t>0);return times.length?Math.round(times.reduce((a,b)=>a+b,0)/times.length):null}
    const submissionId=String(body.submission_id||''),ctx=await assertEditableSubmission(submissionId)

    if(action==='repair'){
      if(schedulerAction!=='repair'||!scheduledJob)return json({error:'Ação de manutenção não autorizada.'},403)
      if(!cfg.enabled||!openaiKey)return json({error:'Correção inteligente indisponível para manutenção.'},503)
      const selected=await admin.from('ai_correction_jobs').select('*').eq('id',scheduledJob.id).eq('submission_id',submissionId).neq('model',OFFICIAL_MODEL).maybeSingle();if(selected.error||!selected.data)return json({error:'Execução de IA não encontrada.'},404)
      const target=selected.data,latest=await latestJob(submissionId);if(latest?.id!==target.id)return json({error:'Somente a correção de IA mais recente pode ser reprocessada.'},409);if(!['failed','completed'].includes(target.status))return json({error:'Estado da correção incompatível com reprocessamento.'},409)
      const previous=target.result||{},resetResult={stage:'maintenance_repair_start',preliminary:true,maintenance_repair:true,repair_reason:'quality_rule_2026_09_22',requested_reasoning:cfg.reasoning,input_fingerprint:previous.input_fingerprint??null,previous_score_id:previous.previous_score_id??null,previous_provider_response_id:previous.provider_response_id||null}
      const reset=await admin.from('ai_correction_jobs').update({status:'processing',model:cfg.model,started_at:new Date().toISOString(),completed_at:null,error_message:null,result:resetResult}).eq('id',target.id).in('status',['failed','completed']).select('*').maybeSingle();if(reset.error||!reset.data)return json({error:'A correção mudou de estado antes do reprocessamento.'},409)
      const job=reset.data;let resultSaved=false
      try{
        const [motivation,media]=await Promise.all([proposalContext(ctx.round.id),signedInputs(submissionId)]),prompt=`TEMA: ${ctx.round.theme}\nCOMANDO: ${ctx.round.proposal_command||''}\nORIENTAÇÃO: ${ctx.round.understand_prompt||''}\n${motivation}\nPEI: não informado no cadastro disponível. Não inferir diagnóstico pela escrita.`
        const reqBody={model:cfg.model,store:false,background:true,instructions:ESSENTIAL_PROTOCOL+'\n\n'+QUALITY_INSTRUCTIONS,tools:[{type:'web_search'}],include:['web_search_call.action.sources'],max_output_tokens:10000,reasoning:{effort:cfg.reasoning},input:[{role:'user',content:[{type:'input_text',text:prompt},...media]}],text:{format:{type:'json_schema',name:'enem_preliminary_correction',strict:true,schema:schema()}}}
        const openaiStarted=Date.now(),openaiRes=await meteredFetch(admin,{table:'ai_correction_jobs',id:job.id,actor:job.requested_by,service:'Correção',stage:'correction'},'https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${openaiKey}`,'Content-Type':'application/json'},body:JSON.stringify(reqBody),signal:AbortSignal.timeout(30000)}),latencyMs=Date.now()-openaiStarted,openaiData=await openaiRes.json().catch(()=>({}))
        if(!openaiRes.ok)throw new Error(openaiData?.error?.message||`OpenAI respondeu ${openaiRes.status}.`);if(!openaiData.id)throw new Error('O provedor não confirmou o identificador da análise.')
        const saved=await admin.from('ai_correction_jobs').update({result:{...job.result,stage:'provider_processing',provider_started_at:new Date(openaiStarted).toISOString(),provider_ack_ms:latencyMs,requested_reasoning:cfg.reasoning,provider_response_id:openaiData.id}}).eq('id',job.id).eq('status','processing').select('*').maybeSingle();if(saved.error||!saved.data)throw saved.error||new Error('A análise foi cancelada antes da confirmação.')
        if(openaiData.status==='completed'){const completed=await completeBackground(saved.data,openaiData,ctx,cfg);resultSaved=completed?.status==='completed';return json({ok:true,maintenance:true,job:publicJob(completed)})}
        if(!['queued','in_progress'].includes(openaiData.status))throw new Error('A análise foi interrompida pelo provedor. Nenhum resultado foi publicado.')
        return json({ok:true,maintenance:true,job:{id:job.id,status:'processing',model:job.model,started_at:job.started_at,result:{stage:'provider_processing'}}})
      }catch(e){const message=e instanceof Error?e.message:String(e);if(!resultSaved){const failed=await admin.rpc('fail_correction_evidence',{p_actor:job.requested_by,p_submission:submissionId,p_job:job.id,p_message:message});if(failed.error)console.error('maintenance failure reconciliation:',failed.error)}throw e}
    }

    if(action==='invalidate'){
      if(ctx.sub.status==='approved')return json({error:'Correção aprovada não pode ser invalidada pela captura.'},409);
      const {data:jobs,error}=await admin.from('ai_correction_jobs').select('id,status').eq('submission_id',submissionId).neq('model',OFFICIAL_MODEL).in('status',['queued','processing','completed']);if(error)throw error;
      for(const job of jobs||[]){
        if(['queued','processing'].includes(job.status)){
          const failed=await admin.rpc('fail_correction_evidence',{p_actor:profile.id,p_submission:submissionId,p_job:job.id,p_message:'Análise cancelada: a captura foi alterada.'});if(failed.error)throw failed.error;
        }else{
          const cancelled=await admin.from('ai_correction_jobs').update({status:'cancelled',error_message:'Captura alterada.'}).eq('id',job.id).eq('status','completed');if(cancelled.error)throw cancelled.error;
        }
      }
      return json({ok:true,cancelled:jobs?.length||0});
    }

    if(action==='get'){
      let job=await latestJob(submissionId)
      if(job?.status==='processing'){
        const responseId=job.result?.provider_response_id,age=Date.now()-Date.parse(job.started_at||job.created_at)
        if(!responseId&&age>180000){const expired=await admin.rpc('expire_correction_evidence',{p_job:job.id});if(expired.error)throw expired.error;job=await latestJob(submissionId)}
        else if(responseId){
          const response=await meteredFetch(admin,{table:'ai_correction_jobs',id:job.id,actor:job.requested_by,service:'Correção',stage:'correction'},'https://api.openai.com/v1/responses/'+encodeURIComponent(responseId)+'?include[]=web_search_call.action.sources',{headers:{Authorization:`Bearer ${openaiKey}`},signal:AbortSignal.timeout(10000)}),provider=await response.json().catch(()=>({}))
          await admin.from('ai_correction_jobs').update({result:{...job.result,last_checked_at:new Date().toISOString(),provider_status:provider.status||'unknown',provider_http_status:response.status,provider_incomplete_reason:provider.incomplete_details?.reason||null,provider_error_code:provider.error?.code||null,provider_output_tokens:provider.usage?.output_tokens||null}}).eq('id',job.id).eq('status','processing')
          if(!response.ok&&response.status!==404&&age>600000){const expired=await admin.rpc('expire_correction_evidence',{p_job:job.id});if(expired.error)throw expired.error;return json({ok:true,job:publicJob(await latestJob(submissionId))})}
          if(!response.ok&&response.status!==404)throw new Error('Não foi possível consultar a análise agora. Consulte novamente.')
          if(provider.status==='completed'){try{job=await completeBackground(job,provider,ctx,cfg)}catch(e){const failed=await admin.rpc('fail_correction_evidence',{p_actor:job.requested_by,p_submission:submissionId,p_job:job.id,p_message:e instanceof Error?e.message:String(e)});if(failed.error)throw failed.error;job=await latestJob(submissionId)}}
          else if(response.status===404||['failed','cancelled','incomplete'].includes(provider.status)){const providerCode=String(provider?.error?.code||''),failMessage=providerCode==='credit_balance_exhausted'?'O serviço de IA está temporariamente sem saldo. A redação permanece salva e o crédito desta tentativa foi devolvido.':'A análise não pôde ser concluída. O crédito reservado foi devolvido. Uma nova tentativa exige confirmação.',failed=await admin.rpc('fail_correction_evidence',{p_actor:job.requested_by,p_submission:submissionId,p_job:job.id,p_message:failMessage});if(failed.error)throw failed.error;job=await latestJob(submissionId)}
          else if(age>600000){const expired=await admin.rpc('expire_correction_evidence',{p_job:job.id});if(expired.error)throw expired.error;job=await latestJob(submissionId)}
        }
      }
      const previous=await admin.from('ai_correction_jobs').select('*').eq('submission_id',submissionId).neq('model',OFFICIAL_MODEL).in('status',['completed','approved']).order('created_at',{ascending:false}).limit(1).maybeSingle();if(previous.error)throw previous.error
      if(scheduler)return json({ok:true,job_id:job?.id,status:job?.status})
      return json({ok:true,average_seconds:await recentAverage(),job:publicJob(job),previous_job:previous.data?.id!==job?.id?publicJob(previous.data):null})
    }

    if(action==='correct'){
      if(!cfg.enabled) return json({error:'A correção por IA ainda está desativada no sistema.'},409)
      if(!openaiKey) return json({error:'OPENAI_API_KEY não está configurada no servidor.'},503)
      if(profile.role!=='super_admin'&&(!account?.ai_correction_enabled||!['active','trial'].includes(account.status))) return json({error:'A correção por IA não está habilitada para esta conta.'},403)
      const {count:fileCount,error:fileCountErr}=await admin.from('submission_files').select('id',{count:'exact',head:true}).eq('submission_id',submissionId);if(fileCountErr) throw fileCountErr;if(Number(fileCount||0)!==1) return json({error:'A redação precisa ter exatamente 1 arquivo válido antes da correção com IA.'},409)
      if(body.force&&(!body.previous_job_id||body.credit_confirmed!==true))return json({error:'Confirme o consumo de mais 1 crédito para refazer a correção.'},400)
      const {data:claim,error:claimError}=body.force?await admin.rpc('restart_correction_evidence',{p_actor:profile.id,p_submission:submissionId,p_model:cfg.model,p_previous_job:body.previous_job_id}):await admin.rpc('start_correction_beta',{p_actor:profile.id,p_submission:submissionId,p_model:cfg.model,p_force:false})
      if(claimError)return json({error:claimError.message,code:/saldo insuficiente/i.test(claimError.message)?'INSUFFICIENT_CREDITS':'START_BLOCKED'},/saldo insuficiente/i.test(claimError.message)?402:409)
      const job=claim.job;if(!claim.claimed)return json({ok:true,reused:true,job:{id:job.id,status:job.status,model:job.model,result:job.result}})
      let resultSaved=false
      try{
        const [motivation,media]=await Promise.all([proposalContext(ctx.round.id),signedInputs(submissionId)]),prompt=`TEMA: ${ctx.round.theme}\nCOMANDO: ${ctx.round.proposal_command||''}\nORIENTAÇÃO: ${ctx.round.understand_prompt||''}\n${motivation}\nPEI: não informado no cadastro disponível. Não inferir diagnóstico pela escrita.`
        const reqBody={model:cfg.model,store:false,background:true,instructions:ESSENTIAL_PROTOCOL+'\n\n'+QUALITY_INSTRUCTIONS,tools:[{type:'web_search'}],include:['web_search_call.action.sources'],max_output_tokens:10000,reasoning:{effort:cfg.reasoning},input:[{role:'user',content:[{type:'input_text',text:prompt},...media]}],text:{format:{type:'json_schema',name:'enem_preliminary_correction',strict:true,schema:schema()}}}
        const openaiStarted=Date.now(),openaiRes=await meteredFetch(admin,{table:'ai_correction_jobs',id:job.id,actor:job.requested_by,service:'Correção',stage:'correction'},'https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${openaiKey}`,'Content-Type':'application/json'},body:JSON.stringify(reqBody),signal:AbortSignal.timeout(30000)}),latencyMs=Date.now()-openaiStarted,openaiData=await openaiRes.json().catch(()=>({}))
        if(!openaiRes.ok) throw new Error(openaiData?.error?.message||`OpenAI respondeu ${openaiRes.status}.`);if(!openaiData.id)throw new Error('O provedor não confirmou o identificador da análise.')
        const saved=await admin.from('ai_correction_jobs').update({result:{...job.result,stage:'provider_processing',provider_started_at:new Date(openaiStarted).toISOString(),provider_ack_ms:latencyMs,requested_reasoning:cfg.reasoning,provider_response_id:openaiData.id}}).eq('id',job.id).eq('status','processing').select('id').maybeSingle();if(saved.error||!saved.data)throw saved.error||new Error('A análise foi cancelada antes da confirmação.')
        if(openaiData.status==='completed'){const completed=await completeBackground(job,openaiData,ctx,cfg);resultSaved=completed?.status==='completed';return json({ok:true,job:publicJob(completed)})}
        if(!['queued','in_progress'].includes(openaiData.status))throw new Error('A análise foi interrompida pelo provedor. Nenhum resultado foi publicado.')
        return json({ok:true,job:{id:job.id,status:'processing',model:job.model,started_at:job.started_at,result:{stage:'provider_processing'}}})
      }catch(e){const message=e instanceof Error?e.message:String(e);if(!resultSaved){const failed=await admin.rpc('fail_correction_evidence',{p_actor:profile.id,p_submission:submissionId,p_job:job.id,p_message:message});if(failed.error)console.error('failure reconciliation:',failed.error)}throw e}
    }

    if(action==='approve'){
      if(!body.job_id)return json({error:'Reabra a análise para aprovar a versão revisada.'},409)
      const selected=await admin.from('ai_correction_jobs').select('*').eq('id',body.job_id).eq('submission_id',submissionId).neq('model',OFFICIAL_MODEL).in('status',['completed','approved']).order('created_at',{ascending:false}).limit(1).maybeSingle();if(selected.error)throw selected.error
      const job=selected.data;if(!job?.result)return json({error:'Não há correção preliminar concluída para aprovar.'},409)
      const base=job.result,scores={},justifications={}
      for(const code of ['C1','C2','C3','C4','C5']){scores[code]=Number(body.scores?.[code]??base.competencies?.[code]?.score);if(!VALID_SCORES.has(scores[code]))return json({error:'Pontuação inválida em '+code},400);justifications[code]=String(body.competency_justifications?.[code]||base.competencies?.[code]?.diagnostic||base.competencies?.[code]?.justification||'').trim();if(!justifications[code])return json({error:'A análise não trouxe diagnóstico suficiente em '+code+'. Refaça a correção ou use a correção manual.'},409)}
      const reviewed=reviewedEvidence(base,{...body,scores,review_confirmed:true}),payload={scores,competency_justifications:justifications,feedback:String(body.overall_feedback??base.overall_feedback??'').trim(),improvement_priority:String(body.improvement_priority??base.improvement_priority??'').trim(),authorship_validation:String(body.authorship_validation??''),observations:String(body.observations??''),detailed_analysis:reviewed,correction_origin:'ai'}
      const {data,error}=await admin.rpc('approve_essay_beta_atomic',{p_submission_id:submissionId,p_actor:user.id,p_payload:payload,p_ai_job_id:job.id});if(error)throw error;return json(data)
    }
    return json({error:'Ação inválida.'},400)
  }catch(e){console.error('ai-correction-api:',e);const message=e instanceof Error?e.message:String(e),status=/permissão|acesso|institui/i.test(message)?403:/não encontrada|não encontrado/i.test(message)?404:500;return json({error:message},status)}
})


