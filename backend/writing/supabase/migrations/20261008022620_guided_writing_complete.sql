begin;
create table public.writing_activities(
 id uuid primary key, teacher_id uuid not null references public.profiles(id),
 class_id uuid references public.classes(id), name text not null check(length(name) between 2 and 160),
 theme text not null check(length(theme) between 10 and 1000),
 stages text[] not null default array['introduction','development1','development2','conclusion'],
 is_active boolean not null default true, version integer not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(cardinality(stages) between 1 and 4 and stages <@ array['introduction','development1','development2','conclusion'])
);
alter table public.live_writing_drafts add column activity_id uuid references public.writing_activities(id);
create unique index writing_draft_owner_activity on public.live_writing_drafts(owner_id,activity_id) where activity_id is not null;
create table public.writing_revisions(
 draft_id uuid references public.live_writing_drafts(id),version integer not null,
 theme text not null,content jsonb not null,created_at timestamptz not null default now(),primary key(draft_id,version)
);
create table public.writing_guidance(
 id uuid primary key,owner_id uuid not null references public.profiles(id),draft_id uuid not null references public.live_writing_drafts(id),
 draft_version integer not null,stage text not null check(stage in ('introduction','development1','development2','conclusion')),
 question text not null check(length(question) between 1 and 2000),status text not null check(status in ('processing','completed','failed')),
 result jsonb,error_message text,created_at timestamptz not null default now(),completed_at timestamptz
);
create index writing_guidance_draft_created on public.writing_guidance(draft_id,created_at desc);
create index writing_activities_teacher_created on public.writing_activities(teacher_id,created_at desc);
create table public.writing_comments(
 id uuid primary key, teacher_id uuid not null references public.profiles(id),draft_id uuid not null references public.live_writing_drafts(id),
 draft_version integer not null,stage text not null,comment text not null check(length(comment) between 1 and 4000),created_at timestamptz not null default now()
);
create table public.student_independent_accounts(
 profile_id uuid primary key references public.profiles(id),legal_version text not null,accepted_at timestamptz not null default now()
);
create index writing_comments_draft on public.writing_comments(draft_id,created_at desc);
do $$declare t text;begin foreach t in array array['writing_activities','writing_revisions','writing_guidance','writing_comments','student_independent_accounts'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
end loop;end $$;
create function private.writing_member(p_actor uuid,p_class uuid) returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from public.students s join public.enrollments e on e.student_id=s.id join public.classes c on c.id=e.class_id join public.academic_years y on y.id=c.academic_year_id join public.organizations o on o.id=y.organization_id where s.auth_user_id=p_actor and s.is_active and e.is_active and c.is_active and o.is_active and s.organization_id=y.organization_id and c.id=p_class)
$$;
create function private.writing_teacher(p_actor uuid,p_class uuid) returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from public.classes c join public.academic_years y on y.id=c.academic_year_id join public.teacher_organizations t on t.organization_id=y.organization_id join public.organizations o on o.id=y.organization_id where c.id=p_class and c.owner_teacher_id=p_actor and t.teacher_id=p_actor and c.is_active and o.is_active)
$$;
create function private.writing_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
declare a public.writing_activities%rowtype;k text;
begin
 if new.activity_id is not null then
  select * into a from public.writing_activities where id=new.activity_id;
  if not found or not a.is_active or not private.writing_member(new.owner_id,a.class_id) then raise exception 'Atividade indisponível para este aluno.';end if;
  if TG_OP='UPDATE' and new.activity_id is distinct from old.activity_id then raise exception 'O vínculo da atividade é imutável.';end if;
  new.theme:=a.theme;
  if TG_OP='UPDATE' then
   foreach k in array array['introduction','development1','development2','conclusion'] loop
    if not(k=any(a.stages)) and new.content->'stages'->k is distinct from old.content->'stages'->k then raise exception 'Esta etapa ainda não foi liberada pelo professor.';end if;
   end loop;
  end if;
 end if;
 return new;
end $$;
create trigger writing_draft_permissions before insert or update on public.live_writing_drafts for each row execute function private.writing_snapshot();
create function private.writing_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin insert into public.writing_revisions(draft_id,version,theme,content) values(new.id,new.version,new.theme,new.content) on conflict do nothing;return new;end $$;
create trigger writing_draft_revision after insert or update on public.live_writing_drafts for each row execute function private.writing_revision();
insert into public.writing_revisions(draft_id,version,theme,content) select id,version,theme,content from public.live_writing_drafts;
create function public.writing_access(p_actor uuid,p_draft uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.live_writing_drafts%rowtype;a public.writing_activities%rowtype;p public.profiles%rowtype;
begin
 select * into p from public.profiles where id=p_actor and approval_status='approved' and role in ('teacher','student') and not coalesce(admin_hidden,false);
 if not found then raise exception 'Sem acesso à construção.' using errcode='42501';end if;
 select * into d from public.live_writing_drafts where id=p_draft;
 if not found then raise exception 'Produção não encontrada.' using errcode='42501';end if;
 if d.activity_id is not null then select * into a from public.writing_activities where id=d.activity_id;end if;
 if d.owner_id<>p_actor and not(p.role='teacher' and a.teacher_id=p_actor and private.writing_teacher(p_actor,a.class_id) and private.writing_member(d.owner_id,a.class_id)) then raise exception 'Produção não encontrada.' using errcode='42501';end if;
 return jsonb_build_object('draft',to_jsonb(d),'activity',case when a.id is not null then to_jsonb(a) else null end,
 'guidance',coalesce((select jsonb_agg(to_jsonb(g) order by g.created_at desc) from (select * from public.writing_guidance where draft_id=d.id order by created_at desc limit 50) g),'[]'::jsonb),
 'comments',coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at desc) from (select * from public.writing_comments where draft_id=d.id order by created_at desc limit 50) c),'[]'::jsonb),
 'revisions',coalesce((select jsonb_agg(jsonb_build_object('version',r.version,'created_at',r.created_at) order by r.version desc) from (select * from public.writing_revisions where draft_id=d.id order by version desc limit 50) r),'[]'::jsonb));
end $$;
create function public.writing_dispatch(p_actor uuid,p_body jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.profiles%rowtype;act text:=p_body->>'action';a public.writing_activities%rowtype;d public.live_writing_drafts%rowtype;r public.writing_revisions%rowtype;st text[];pid uuid:=(p_body->>'id')::uuid;
begin
 select * into p from public.profiles where id=p_actor and approval_status='approved' and role in ('teacher','student') and not coalesce(admin_hidden,false);
 if not found then raise exception 'Sem acesso à construção.' using errcode='42501';end if;
 if act='writing_catalog' and p.role='teacher' then
  return jsonb_build_object('classes',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'organization',o.name) order by o.name,c.name) from public.classes c join public.academic_years y on y.id=c.academic_year_id join public.organizations o on o.id=y.organization_id where private.writing_teacher(p_actor,c.id)),'[]'::jsonb));
 elsif act='writing_activity_save' and p.role='teacher' then
  if not private.writing_teacher(p_actor,(p_body->>'class_id')::uuid) then raise exception 'Turma indisponível.' using errcode='42501';end if;
  select array_agg(distinct value) into st from jsonb_array_elements_text(p_body->'stages');
  perform pg_advisory_xact_lock(hashtextextended(pid::text,0));select * into a from public.writing_activities where id=pid for update;
  if found then
   if a.teacher_id<>p_actor or a.class_id<>(p_body->>'class_id')::uuid or a.version<>(p_body->>'version')::integer then raise exception 'Atividade alterada. Reabra antes de salvar.';end if;
   -- A theme used by students cannot silently change the assignment they answered.
   if a.theme<>p_body->>'theme' and exists(select 1 from public.live_writing_drafts where activity_id=a.id) then raise exception 'Crie outra atividade para mudar um tema já iniciado.';end if;
   update public.writing_activities set name=p_body->>'name',theme=p_body->>'theme',stages=st,is_active=(p_body->>'is_active')::boolean,version=version+1,updated_at=now() where id=pid returning * into a;
  else
   if (p_body->>'version')::integer<>0 then raise exception 'Versão inválida.';end if;
   insert into public.writing_activities(id,teacher_id,class_id,name,theme,stages) values(pid,p_actor,(p_body->>'class_id')::uuid,p_body->>'name',p_body->>'theme',st) returning * into a;
  end if;return jsonb_build_object('activity',to_jsonb(a));
 elsif act='writing_activities' then
  return jsonb_build_object('activities',coalesce((select jsonb_agg(to_jsonb(wa) order by wa.created_at desc) from public.writing_activities wa where (p.role='teacher' and wa.teacher_id=p_actor and private.writing_teacher(p_actor,wa.class_id)) or (p.role='student' and wa.is_active and private.writing_member(p_actor,wa.class_id))),'[]'::jsonb));
 elsif act in ('writing_activity_get','writing_join') then
  select * into a from public.writing_activities where id=pid;
  if not found or not((p.role='teacher' and a.teacher_id=p_actor and private.writing_teacher(p_actor,a.class_id)) or (p.role='student' and a.is_active and private.writing_member(p_actor,a.class_id))) then raise exception 'Atividade não encontrada.' using errcode='42501';end if;
  if act='writing_join' then
   if p.role<>'student' then raise exception 'Use a prévia ou acompanhe os alunos.';end if;
   perform pg_advisory_xact_lock(hashtextextended(p_actor::text||a.id::text,0));
   select * into d from public.live_writing_drafts where owner_id=p_actor and activity_id=a.id;
   if not found then insert into public.live_writing_drafts(id,owner_id,theme,content,activity_id) values(gen_random_uuid(),p_actor,a.theme,jsonb_build_object('mode','free','stages',jsonb_build_object('introduction',jsonb_build_object('text','','plan',''),'development1',jsonb_build_object('text','','plan',''),'development2',jsonb_build_object('text','','plan',''),'conclusion',jsonb_build_object('text','','plan',''))),a.id) returning * into d;end if;
   return public.writing_access(p_actor,d.id);
  end if;
  return jsonb_build_object('activity',to_jsonb(a),'students',coalesce((select jsonb_agg(jsonb_build_object('id',s.auth_user_id,'name',s.full_name,'draft_id',wd.id,'updated_at',wd.updated_at,'version',wd.version,'stage',case when nullif(wd.content->'stages'->'conclusion'->>'text','') is not null then 'conclusion' when nullif(wd.content->'stages'->'development2'->>'text','') is not null then 'development2' when nullif(wd.content->'stages'->'development1'->>'text','') is not null then 'development1' when wd.id is not null then 'introduction' else null end) order by s.full_name) from public.students s join public.enrollments e on e.student_id=s.id left join public.live_writing_drafts wd on wd.owner_id=s.auth_user_id and wd.activity_id=a.id where e.class_id=a.class_id and e.is_active and s.is_active),'[]'::jsonb));
 elsif act in ('writing_detail','writing_revision','writing_comment') then
  perform public.writing_access(p_actor,pid);select * into d from public.live_writing_drafts where id=pid;
  if act='writing_detail' then return public.writing_access(p_actor,pid);end if;
  if act='writing_revision' then
   select * into r from public.writing_revisions where draft_id=pid and version=(p_body->>'version')::integer;
   if not found then raise exception 'Versão não encontrada.';end if;return jsonb_build_object('revision',to_jsonb(r));
  end if;
  select * into a from public.writing_activities where id=d.activity_id;
  if p.role<>'teacher' or a.teacher_id is distinct from p_actor then raise exception 'Somente o professor responsável pode comentar.' using errcode='42501';end if;
  if p_body->>'stage' not in ('introduction','development1','development2','conclusion') or (p_body->>'version')::integer<>d.version then raise exception 'Reabra a versão atual antes de comentar.';end if;
  insert into public.writing_comments(id,teacher_id,draft_id,draft_version,stage,comment) values((p_body->>'request_id')::uuid,p_actor,pid,d.version,p_body->>'stage',p_body->>'comment') on conflict(id) do nothing;
  return public.writing_access(p_actor,pid);
 end if;
 raise exception 'Ação de construção desconhecida.';
end $$;
create function public.claim_writing_guidance(p_actor uuid,p_draft uuid,p_version integer,p_stage text,p_request uuid,p_question text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.live_writing_drafts%rowtype;g public.writing_guidance%rowtype;a public.writing_activities%rowtype;lim integer;cfg jsonb;
begin
 perform public.writing_access(p_actor,p_draft);
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||':writing-guide',0));
 select * into d from public.live_writing_drafts where id=p_draft and owner_id=p_actor;
 if not found then raise exception 'Somente o autor pode solicitar orientação.' using errcode='42501';end if;
 select * into g from public.writing_guidance where id=p_request;
 if found then
  if g.owner_id<>p_actor or g.draft_id<>p_draft or g.draft_version<>p_version or g.stage<>p_stage or g.question<>p_question then raise exception 'Solicitação repetida com dados diferentes.';end if;
  if g.status='processing' and g.created_at<now()-interval '3 minutes' then update public.writing_guidance set status='failed',error_message='A orientação foi interrompida. Seu texto está salvo.',completed_at=now() where id=g.id returning * into g;end if;
  return jsonb_build_object('claimed',false,'guidance',to_jsonb(g));
 end if;
 select config into cfg from public.system_feature_flags where feature_key='writing_guided' and is_enabled;
 if not found then raise exception 'A tutoria ainda não está liberada.';end if;
 if coalesce(cfg->>'billing_mode','')<>'test_free' then lim:=least(100,greatest(1,coalesce((cfg->>'tutor_limit')::integer,12)));end if;
 update public.writing_guidance set status='failed',error_message='A orientação foi interrompida. Seu texto está salvo.',completed_at=now() where owner_id=p_actor and status='processing' and created_at<now()-interval '3 minutes';
 if exists(select 1 from public.writing_guidance where owner_id=p_actor and status='processing') then raise exception 'Aguarde a orientação em andamento antes de pedir outra.';end if;
 if d.version<>p_version then raise exception 'Salve e reabra a versão atual antes de pedir orientação.';end if;
 if d.activity_id is not null then select * into a from public.writing_activities where id=d.activity_id;if not a.is_active or not(p_stage=any(a.stages)) then raise exception 'Etapa ainda não liberada.';end if;end if;
 if lim is not null and (select count(*) from public.writing_guidance where owner_id=p_actor and created_at>now()-interval '24 hours')>=lim then raise exception 'Limite de orientações atingido. Continue escrevendo e retome a IA amanhã.';end if;
 insert into public.writing_guidance(id,owner_id,draft_id,draft_version,stage,question,status) values(p_request,p_actor,p_draft,p_version,p_stage,p_question,'processing') returning * into g;
 return jsonb_build_object('claimed',true,'guidance',to_jsonb(g),'draft',to_jsonb(d));
end $$;
create function public.finish_writing_guidance(p_actor uuid,p_id uuid,p_result jsonb,p_error text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare g public.writing_guidance%rowtype;
begin
 select * into g from public.writing_guidance where id=p_id and owner_id=p_actor for update;
 if not found then raise exception 'Orientação não encontrada.';end if;
 if g.status='processing' then update public.writing_guidance set status=case when p_error is null then 'completed' else 'failed' end,result=case when p_error is null then p_result else null end,error_message=p_error,completed_at=now() where id=p_id returning * into g;end if;
 return to_jsonb(g);
end $$;
-- All entry points receive actor exclusively after auth.getUser in the Edge Function.
revoke all on function public.writing_access(uuid,uuid),public.writing_dispatch(uuid,jsonb),public.claim_writing_guidance(uuid,uuid,integer,text,uuid,text),public.finish_writing_guidance(uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.writing_access(uuid,uuid),public.writing_dispatch(uuid,jsonb),public.claim_writing_guidance(uuid,uuid,integer,text,uuid,text),public.finish_writing_guidance(uuid,uuid,jsonb,text) to service_role;
revoke all on function private.writing_member(uuid,uuid),private.writing_teacher(uuid,uuid),private.writing_snapshot(),private.writing_revision() from public,anon,authenticated;
grant execute on function private.writing_member(uuid,uuid),private.writing_teacher(uuid,uuid),private.writing_snapshot(),private.writing_revision() to service_role;
insert into public.system_feature_flags(feature_key,is_enabled,config) values('writing_guided',false,'{"tutor_limit":null,"billing_mode":"test_free","package_price":null}'::jsonb),('student_independent',false,'{}'::jsonb) on conflict(feature_key) do nothing;
create function public.complete_independent_student(p_actor uuid,p_name text,p_accept boolean,p_legal_version text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.profiles%rowtype;u auth.users%rowtype;
begin
 if not exists(select 1 from public.system_feature_flags where feature_key='student_independent' and is_enabled) then raise exception 'O cadastro independente ainda não está liberado.';end if;
 if p_accept is distinct from true or p_legal_version is distinct from '2026-09-28' or length(trim(p_name)) not between 2 and 160 then raise exception 'Confira seu nome e aceite os termos.';end if;
 select * into u from auth.users where id=p_actor and deleted_at is null and email_confirmed_at is not null and (banned_until is null or banned_until<=now()) for update;
 if not found then raise exception 'Confirme seu acesso antes de concluir.' using errcode='42501';end if;
 select * into p from public.profiles where id=p_actor for update;
 if not found or coalesce(p.admin_hidden,false) or p.organization_id is not null or p.role not in ('pending','student') or p.requested_role is distinct from 'student' then raise exception 'Esta conta não pode ser convertida em aluno independente.' using errcode='42501';end if;
 insert into public.student_independent_accounts(profile_id,legal_version) values(p_actor,p_legal_version) on conflict do nothing;
 update public.profiles set full_name=trim(p_name),email=u.email,requested_role='student',updated_at=now() where id=p_actor;
 return jsonb_build_object('ok',true,'pending',p.approval_status<>'approved');
end $$;
revoke all on function public.complete_independent_student(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.complete_independent_student(uuid,text,boolean,text) to service_role;
create or replace function private.ensure_student_trial(p_actor uuid) returns integer language plpgsql security definer set search_path='' as $$
declare v_balance integer;
begin
 perform 1 from public.profiles p join auth.users u on u.id=p.id where p.id=p_actor and p.role='student' and p.approval_status='approved' and not coalesce(p.admin_hidden,false)
 and (exists(select 1 from public.students s where s.auth_user_id=p.id and s.organization_id=p.organization_id)
 or (p.organization_id is null and exists(select 1 from public.student_independent_accounts a where a.profile_id=p.id) and exists(select 1 from public.system_feature_flags where feature_key='student_independent' and is_enabled)))
 and u.deleted_at is null and (u.banned_until is null or u.banned_until<=now()) for update of p;
 if not found then raise exception 'Entre na sua conta de aluno para continuar.' using errcode='42501';end if;
 if exists(select 1 from public.correction_credit_ledger where profile_id=p_actor and event_type='freemium') then select balance into v_balance from public.correction_credit_wallets where profile_id=p_actor;return coalesce(v_balance,0);end if;
 return private.credit_wallet_add(p_actor,1,'freemium','student-trial:'||p_actor::text,jsonb_build_object('campaign','student_trial_v1','credits',1,'milestone','first_student_access'));
end $$;
revoke all on function private.ensure_student_trial(uuid) from public,anon,authenticated;
alter table public.live_essays add column writing_context jsonb not null default '{}'::jsonb check(jsonb_typeof(writing_context)='object' and octet_length(writing_context::text)<=100000);
alter table public.live_jobs add column context_snapshot jsonb not null default '{}'::jsonb;
create function private.writing_context_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
declare k text;v jsonb;
begin
 if TG_TABLE_NAME='live_essays' then
  if TG_OP='UPDATE' and new.writing_context is distinct from old.writing_context then raise exception 'Comece outra correção para mudar o contexto.';end if;
  for k,v in select * from jsonb_each(new.writing_context) loop
   if k not in ('introduction','development1','development2','conclusion') or k=new.correction_scope or jsonb_typeof(v)<>'string' or length(v#>>'{}')>16000 then raise exception 'Contexto inválido.';end if;
  end loop;
 else
  if TG_OP='UPDATE' and new.context_snapshot is distinct from old.context_snapshot then raise exception 'O contexto da análise é imutável.';end if;
  if TG_OP='INSERT' then select writing_context into new.context_snapshot from public.live_essays where id=new.essay_id and owner_id=new.owner_id;end if;
 end if;
 return new;
end $$;
create trigger writing_context_essay before insert or update on public.live_essays for each row execute function private.writing_context_snapshot();
create trigger writing_context_job before insert or update on public.live_jobs for each row execute function private.writing_context_snapshot();
revoke all on function private.writing_context_snapshot() from public,anon,authenticated;
grant execute on function private.writing_context_snapshot() to service_role;
commit;
