-- Candidato: aplicar somente após autorização específica do banco compartilhado.
BEGIN;
create or replace function public.complete_independent_student(p_actor uuid,p_name text,p_accept boolean,p_legal_version text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.profiles%rowtype;u record;
begin
 if not exists(select 1 from public.system_feature_flags where feature_key='student_independent' and is_enabled) then raise exception 'O cadastro independente ainda não está liberado.';end if;
 if p_accept is distinct from true or p_legal_version is distinct from '2026-09-28' or length(trim(p_name)) not between 2 and 160 then raise exception 'Confira seu nome e aceite os termos.';end if;
 select email into u from auth.users where id=p_actor and deleted_at is null and (banned_until is null or banned_until<=now());
 if not found then raise exception 'Confirme seu acesso antes de concluir.' using errcode='42501';end if;
 select * into p from public.profiles where id=p_actor for update;
 if not found or coalesce(p.admin_hidden,false) or p.organization_id is not null or p.role not in ('pending','student') or p.requested_role is distinct from 'student' then raise exception 'Esta conta não pode ser convertida em aluno independente.' using errcode='42501';end if;
 insert into public.student_independent_accounts(profile_id,legal_version) values(p_actor,p_legal_version) on conflict do nothing;
 update public.profiles set full_name=trim(p_name),email=u.email,requested_role='student',updated_at=now() where id=p_actor;
 return jsonb_build_object('ok',true,'pending',p.approval_status<>'approved');
end $$;
revoke all on function public.complete_independent_student(uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.complete_independent_student(uuid,text,boolean,text) to service_role;
GRANT SELECT (id,email,deleted_at,banned_until) ON auth.users TO service_role;
COMMIT;
