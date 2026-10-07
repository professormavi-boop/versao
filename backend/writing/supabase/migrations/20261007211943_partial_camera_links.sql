begin;
-- New links only; existing links retain their published expiration.
alter table public.live_shares alter column expires_at set default (now()+interval '20 days');
create table public.live_transcriptions(
 essay_id uuid primary key references public.live_essays(id) on delete cascade,
 owner_id uuid not null references public.profiles(id),
 status text not null check(status in ('processing','completed','failed')),
 attempt_id uuid not null,
 attempts integer not null default 1 check(attempts between 1 and 3),
 text text not null default '' check(length(text)<=16000),
 note text not null default '' check(length(note)<=4000),
 error_message text,
 updated_at timestamptz not null default now()
);
alter table public.live_transcriptions enable row level security;
revoke all on public.live_transcriptions from public,anon,authenticated;
grant all on public.live_transcriptions to service_role;
create function public.claim_live_transcription(p_actor uuid,p_essay uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare e public.live_essays%rowtype;t public.live_transcriptions%rowtype;
begin
 select * into e from public.live_essays where id=p_essay and owner_id=p_actor for update;
 if not found or e.deleted_at is not null or e.correction_scope='complete' then raise exception 'Etapa não encontrada.';end if;
 if e.input_text is not null then raise exception 'O texto já foi confirmado.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_actor::text||':live-transcription',0));
 select * into t from public.live_transcriptions where essay_id=p_essay for update;
 if found then
  if t.status='completed' then return jsonb_build_object('claimed',false,'transcription',to_jsonb(t));end if;
  if t.status='processing' and t.updated_at>now()-interval '90 seconds' then raise exception 'Leitura em andamento. Aguarde e tente continuar novamente.';end if;
  if t.updated_at>now()-interval '60 seconds' then raise exception 'Aguarde um minuto antes de repetir a leitura.';end if;
  if t.attempts>=3 then raise exception 'Limite de leitura atingido. Cole o trecho em texto.';end if;
  if (select coalesce(sum(attempts),0) from public.live_transcriptions where owner_id=p_actor and updated_at>now()-interval '24 hours')>=30 then raise exception 'Limite diário de leitura atingido. Cole o trecho em texto.';end if;
  update public.live_transcriptions set status='processing',attempt_id=gen_random_uuid(),attempts=attempts+1,updated_at=now(),error_message=null where essay_id=p_essay returning * into t;
 else
  if (select coalesce(sum(attempts),0) from public.live_transcriptions where owner_id=p_actor and updated_at>now()-interval '24 hours')>=30 then raise exception 'Limite diário de leitura atingido. Cole o trecho em texto.';end if;
  insert into public.live_transcriptions(essay_id,owner_id,status,attempt_id) values(p_essay,p_actor,'processing',gen_random_uuid()) returning * into t;
 end if;
 return jsonb_build_object('claimed',true,'transcription',to_jsonb(t));
end $$;
create function public.finish_live_transcription(p_actor uuid,p_essay uuid,p_attempt uuid,p_text text,p_note text,p_error text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare t public.live_transcriptions%rowtype;
begin
 select * into t from public.live_transcriptions where essay_id=p_essay and owner_id=p_actor for update;
 if not found then raise exception 'Leitura não encontrada.';end if;
 if t.attempt_id<>p_attempt then raise exception 'Tentativa de leitura substituída.';end if;
 if t.status<>'processing' then return to_jsonb(t);end if;
 update public.live_transcriptions set text=case when p_error is null then p_text else '' end,note=case when p_error is null then p_note else '' end,status=case when p_error is null then 'completed' else 'failed' end,error_message=left(p_error,500),updated_at=now() where essay_id=p_essay returning * into t;
 return to_jsonb(t);
end $$;
create function public.confirm_live_transcription(p_actor uuid,p_essay uuid,p_text text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare e public.live_essays%rowtype;
begin
 select * into e from public.live_essays where id=p_essay and owner_id=p_actor for update;
 if not found or e.deleted_at is not null or e.correction_scope='complete' then raise exception 'Etapa não encontrada.';end if;
 if e.input_text is not null then
  if e.input_text is distinct from p_text then raise exception 'Texto já confirmado. Comece uma nova redação para trocar o trecho.';end if;
  return to_jsonb(e);
 end if;
 if not exists(select 1 from public.live_transcriptions where essay_id=p_essay and owner_id=p_actor and status='completed') then raise exception 'Conclua a leitura antes de confirmar.';end if;
 if p_text is null or length(trim(p_text))<80 or length(p_text)>16000 then raise exception 'Use entre 80 e 16.000 caracteres.';end if;
 update public.live_essays set input_text=p_text,updated_at=now() where id=p_essay returning * into e;
 return to_jsonb(e);
end $$;
revoke all on function public.claim_live_transcription(uuid,uuid),public.finish_live_transcription(uuid,uuid,uuid,text,text,text),public.confirm_live_transcription(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_live_transcription(uuid,uuid),public.finish_live_transcription(uuid,uuid,uuid,text,text,text),public.confirm_live_transcription(uuid,uuid,text) to service_role;
create or replace function private.live_partial_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
declare e public.live_essays%rowtype;
begin
 if TG_TABLE_NAME='live_essays' then
  if TG_OP='UPDATE' then
   if new.correction_scope is distinct from old.correction_scope or
      (old.correction_scope<>'complete' and new.input_text is distinct from old.input_text and old.input_text is not null) then
    raise exception 'Comece uma nova redação para trocar a etapa ou o trecho.';
   end if;
  end if;
  if new.correction_scope<>'complete' and new.input_text is not null and (length(trim(new.input_text))<80 or length(new.input_text)>16000) then
   raise exception 'Use entre 80 e 16.000 caracteres no trecho.';
  end if;
 else
  if TG_OP='UPDATE' then
   if new.correction_scope is distinct from old.correction_scope or new.input_snapshot is distinct from old.input_snapshot then raise exception 'O escopo e o trecho da análise são imutáveis.';end if;
  else
   select * into e from public.live_essays where id=new.essay_id and owner_id=new.owner_id;
   if not found or e.deleted_at is not null then raise exception 'Redação não encontrada.';end if;
   if e.correction_scope<>'complete' and e.input_text is null then raise exception 'Confira a transcrição antes de continuar.';end if;
   new.correction_scope:=e.correction_scope;
   new.input_snapshot:=case when e.correction_scope<>'complete' then e.input_text else null end;
  end if;
 end if;
 return new;
end $$;

create table public.live_writing_drafts(
 id uuid primary key,owner_id uuid not null references public.profiles(id),
 theme text not null default '' check(length(theme)<=1000),
 content jsonb not null default '{}'::jsonb check(jsonb_typeof(content)='object' and octet_length(content::text)<=100000),
 version integer not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index live_writing_drafts_owner_updated on public.live_writing_drafts(owner_id,updated_at desc);
alter table public.live_writing_drafts enable row level security;
revoke all on public.live_writing_drafts from public,anon,authenticated;
grant all on public.live_writing_drafts to service_role;
create function public.save_live_writing_draft(p_actor uuid,p_id uuid,p_version integer,p_theme text,p_content jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.live_writing_drafts%rowtype;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role in ('teacher','student') and approval_status='approved') then raise exception 'Sem acesso ao editor.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into d from public.live_writing_drafts where id=p_id for update;
 if found then
  if d.owner_id<>p_actor then raise exception 'Rascunho não encontrado.';end if;
  if d.version<>p_version then raise exception 'Rascunho alterado em outra aba. Copie seu texto antes de recarregar.';end if;
  update public.live_writing_drafts set theme=p_theme,content=p_content,version=version+1,updated_at=now() where id=p_id returning * into d;
 else
  if p_version<>0 then raise exception 'Versão de rascunho inválida.';end if;
  insert into public.live_writing_drafts(id,owner_id,theme,content) values(p_id,p_actor,p_theme,p_content) returning * into d;
 end if;
 return to_jsonb(d);
end $$;
revoke all on function public.save_live_writing_draft(uuid,uuid,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_live_writing_draft(uuid,uuid,integer,text,jsonb) to service_role;
commit;
