CREATE OR REPLACE FUNCTION public.finish_live_job(p_actor uuid, p_job uuid, p_result jsonb, p_usage jsonb, p_error text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare j public.live_jobs%rowtype;
begin
 select * into j from public.live_jobs where id=p_job and owner_id=p_actor for update;
 if not found then raise exception 'Análise não encontrada.';end if;
 if j.status<>'processing' then return to_jsonb(j);end if;
 if p_error is null and p_result is null then raise exception 'Resultado ausente.';end if;
 if p_error is not null and j.credit_status='reserved' then
  perform private.credit_wallet_add(p_actor,1,'refund','live-refund:'||j.id::text,jsonb_build_object('live_essay_id',j.essay_id));
 end if;
 update public.live_jobs set status=case when p_error is null then 'completed' else 'failed' end,
 result=p_result,usage=p_usage,error_message=left(p_error,500),completed_at=now(),
 credit_status=case when credit_status='reserved' then case when p_error is null then 'consumed' else 'refunded' end else credit_status end
 where id=j.id returning * into j;
 return to_jsonb(j);
end $function$;

CREATE OR REPLACE FUNCTION public.start_live_job(p_actor uuid, p_essay uuid, p_request uuid, p_purpose text, p_model text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if not exists(select 1 from public.live_input_checks where owner_id=p_actor and essay_id=p_essay and status='valid') then raise exception 'Confira a foto, o arquivo ou o texto antes de continuar.';end if;
 return public.start_live_job_before_input_check(p_actor,p_essay,p_request,p_purpose,p_model);
end $function$;

CREATE OR REPLACE FUNCTION public.start_live_job_before_input_check(p_actor uuid, p_essay uuid, p_request uuid, p_purpose text, p_model text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare e public.live_essays%rowtype; j public.live_jobs%rowtype; balance integer;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role in ('teacher','student') and approval_status='approved') then raise exception 'Usuário não autorizado.';end if;
 select * into e from public.live_essays where id=p_essay and owner_id=p_actor for update;
 if not found then raise exception 'Redação não encontrada.';end if;
 select * into j from public.live_jobs where id=p_request;
 if found then
  if j.owner_id<>p_actor or j.essay_id<>p_essay or j.purpose<>p_purpose then raise exception 'Identificador já utilizado.';end if;
  return jsonb_build_object('claimed',false,'job',to_jsonb(j));
 end if;
 select * into j from public.live_jobs where essay_id=p_essay and status='processing';
 if found then return jsonb_build_object('claimed',false,'job',to_jsonb(j));end if;
 if p_purpose not in ('theme','correction') then raise exception 'Operação inválida.';end if;
 if coalesce(length(trim(e.input_text)),0)<80 and not exists(select 1 from public.live_files where essay_id=e.id) then raise exception 'Envie uma redação.';end if;
 if p_purpose='correction' and (e.theme_confirmed_at is null or length(trim(e.theme))<10) then raise exception 'Confirme o tema antes de corrigir.';end if;
 if exists(select 1 from public.profiles where id=p_actor and role='student') then perform private.ensure_student_trial(p_actor);else perform private.ensure_teacher_freemium(p_actor);end if;
 if p_purpose='theme' then
  perform pg_advisory_xact_lock(hashtextextended(p_actor::text||':live-theme',0));
  select * into j from public.live_jobs where owner_id=p_actor and essay_id=p_essay and purpose='theme' and status='completed' order by completed_at desc limit 1;
  if found then return jsonb_build_object('claimed',false,'job',to_jsonb(j));end if;
  if not exists(select 1 from public.correction_credit_wallets w where w.profile_id=p_actor and w.balance>0) then raise exception 'Saldo insuficiente.';end if;
 else
  balance:=private.credit_wallet_add(p_actor,-1,'reservation','live-reserve:'||p_request::text,jsonb_build_object('live_essay_id',p_essay));
 end if;
 insert into public.live_jobs(id,essay_id,owner_id,purpose,theme_snapshot,theme_origin,model,credit_status)
 values(p_request,p_essay,p_actor,p_purpose,e.theme,e.theme_origin,p_model,case when p_purpose='correction' then 'reserved' else 'none' end) returning * into j;
 return jsonb_build_object('claimed',true,'job',to_jsonb(j),'balance',balance);
end $function$;

