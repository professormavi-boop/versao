-- Prepared: allow theme inference for partial text, preserving snapshots and ACL.
begin;
create or replace function private.live_partial_snapshot() returns trigger language plpgsql
 security invoker set search_path='' as $$
declare e public.live_essays%rowtype;
begin
 if TG_TABLE_NAME='live_essays' then
  if TG_OP='UPDATE' then
   if new.correction_scope is distinct from old.correction_scope or
      (old.correction_scope<>'complete' and new.input_text is distinct from old.input_text) then
    raise exception 'Comece uma nova redação para trocar a etapa ou o trecho.';
   end if;
  end if;
  if new.correction_scope<>'complete' and (new.input_text is null or length(trim(new.input_text))<80 or length(new.input_text)>16000) then
   raise exception 'Use entre 80 e 16.000 caracteres no trecho.';
  end if;
 else
  if TG_OP='UPDATE' then
   if new.correction_scope is distinct from old.correction_scope or new.input_snapshot is distinct from old.input_snapshot then
    raise exception 'O escopo e o trecho da análise são imutáveis.';
   end if;
  else
   select * into e from public.live_essays where id=new.essay_id and owner_id=new.owner_id;
   if not found or e.deleted_at is not null then raise exception 'Redação não encontrada.';end if;
   new.correction_scope:=e.correction_scope;
   new.input_snapshot:=case when e.correction_scope<>'complete' then e.input_text else null end;
  end if;
 end if;
 return new;
end $$;
commit;
