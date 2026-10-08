CREATE OR REPLACE FUNCTION private.enforce_student_profile_link()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
declare
  matched_student uuid;
  linked_user uuid;
  canonical_name text;
  canonical_email text;
begin
  -- Managed PIN identities are bound by admin-owned metadata, never by a guessed email.
  if new.role='student' and new.approval_status='approved' and exists(select 1 from auth.users u where u.id=new.id and u.raw_app_meta_data ? 'managed_student_id') then
    select s.id,s.auth_user_id,s.full_name into matched_student,linked_user,canonical_name
    from public.students s join public.student_pin_identity i on i.student_id=s.id
    join auth.users u on u.id=new.id and u.raw_app_meta_data->>'managed_student_id'=s.id::text and u.email=i.email
    where s.organization_id=new.organization_id and s.is_active;
    if not found or (linked_user is not null and linked_user<>new.id) then raise exception 'Vínculo de acesso PIN inválido.'; end if;
    if exists(select 1 from public.students where auth_user_id=new.id and id<>matched_student) then raise exception 'Conta já vinculada a outro aluno.'; end if;
    update public.students set auth_user_id=new.id,updated_at=now() where id=matched_student;
    new.full_name:=canonical_name;
    return new;
  end if;
  if new.role = 'student' and new.approval_status = 'approved' then
    if new.organization_id is null then
      raise exception 'Aluno aprovado precisa estar vinculado a uma instituição.';
    end if;
    if new.email is null or btrim(new.email) = '' then
      raise exception 'Aluno aprovado precisa possuir e-mail.';
    end if;

    new.email := lower(btrim(new.email));

    select s.id, s.auth_user_id, s.full_name, s.email
      into matched_student, linked_user, canonical_name, canonical_email
      from public.students s
     where s.organization_id = new.organization_id
       and s.email is not null
       and lower(btrim(s.email)) = new.email;

    if not found then
      raise exception 'Não há aluno cadastrado nesta instituição com o mesmo e-mail da conta.';
    end if;
    if linked_user is not null and linked_user <> new.id then
      raise exception 'Este aluno já possui uma conta vinculada.';
    end if;

    -- O mesmo usuário jamais permanece ligado a outro registro escolar.
    update public.students
       set auth_user_id = null, updated_at = now()
     where auth_user_id = new.id
       and id <> matched_student;

    update public.students
       set auth_user_id = new.id,
           email = lower(btrim(canonical_email)),
           updated_at = now()
     where id = matched_student;

    -- Nome e e-mail exibidos no perfil passam a seguir o cadastro escolar validado.
    new.full_name := canonical_name;
    new.email := lower(btrim(canonical_email));
  elsif tg_op = 'UPDATE'
        and old.role = 'student'
        and old.approval_status = 'approved' then
    update public.students
       set auth_user_id = null, updated_at = now()
     where auth_user_id = old.id;
  end if;

  return new;
end;
$function$
