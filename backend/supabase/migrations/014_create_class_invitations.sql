-- Apply after 013. Only the trusted Express service-role client can access these
-- tables/functions. Browser clients never receive service-role credentials.
begin;

create or replace function public.normalize_registration_name(p_value text)
returns text language sql immutable strict parallel safe
set search_path = public, pg_temp
as $$ select lower(btrim(regexp_replace(normalize(p_value, NFKC), '[[:space:]]+', ' ', 'g'))) $$;

-- Existing same-name student accounts must be reviewed by an administrator
-- before this index can be installed; do not merge students automatically.
create unique index if not exists users_student_normalized_name_unique
  on public.users (public.normalize_registration_name(name)) where role = 'student';

create table if not exists public.class_invitations (
  id text primary key,
  subject_id text not null unique references public.subjects(id) on delete cascade,
  teacher_id text not null references public.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'active' check (status in ('active', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.class_registration_students (
  id text primary key,
  invitation_id text not null references public.class_invitations(id) on delete cascade,
  teacher_id text not null references public.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 150),
  normalized_name text not null unique,
  section_id text not null references public.sections(id),
  section_name text not null,
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  registered_at timestamptz,
  student_id text references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (normalized_name = public.normalize_registration_name(full_name)),
  check ((registered_at is null and student_id is null) or (registered_at is not null and student_id is not null))
);
create index if not exists class_invitations_teacher_idx on public.class_invitations(teacher_id);
create index if not exists class_registration_students_teacher_idx on public.class_registration_students(teacher_id, invitation_id);
alter table public.class_invitations enable row level security;
alter table public.class_registration_students enable row level security;
revoke all on public.class_invitations, public.class_registration_students from public, anon, authenticated;
grant select, insert, update, delete on public.class_invitations, public.class_registration_students to service_role;

create or replace function public.import_class_invitation(
  p_teacher_id text, p_subject_id text, p_invitation_id text,
  p_token_hash text, p_expires_at timestamptz, p_records jsonb
) returns text language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation_id text;
  v_record jsonb;
  v_section public.sections%rowtype;
  v_subject public.subjects%rowtype;
  v_teacher public.users%rowtype;
begin
  -- Imports and registrations share the identity lock. This also ensures two
  -- teachers cannot reserve the same student name in concurrent imports.
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  select * into v_teacher from public.users where id = p_teacher_id for share;
  select * into v_subject from public.subjects where id = p_subject_id for update;
  if v_teacher.id is null or v_teacher.role <> 'teacher' or v_teacher.status <> 'active'
    or coalesce(v_teacher.archive->>'isArchived', 'false') = 'true'
    or v_subject.id is null or v_subject.teacher_id <> p_teacher_id or not v_subject.is_active then
    raise exception 'CLASS_UNAVAILABLE';
  end if;
  if p_records is null or jsonb_typeof(p_records) <> 'array' then raise exception 'ROSTER_INVALID'; end if;
  if jsonb_array_length(p_records) not between 1 and 1000
    or p_expires_at is null or p_expires_at <= now() or p_expires_at > now() + interval '91 days'
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'ROSTER_INVALID'; end if;
  insert into public.class_invitations(id, subject_id, teacher_id, token_hash, expires_at)
    values(p_invitation_id, p_subject_id, p_teacher_id, p_token_hash, p_expires_at)
    on conflict(subject_id) do update set
      expires_at = greatest(class_invitations.expires_at, excluded.expires_at), status = 'active', updated_at = now()
      where class_invitations.teacher_id = excluded.teacher_id
    returning id into v_invitation_id;
  if v_invitation_id is null then raise exception 'CLASS_UNAVAILABLE'; end if;
  for v_record in select value from jsonb_array_elements(p_records) loop
    if coalesce(jsonb_typeof(v_record->'full_name'), '') <> 'string'
      or char_length(v_record->>'full_name') not between 3 and 150
      or coalesce(v_record->>'normalized_name', '') <> public.normalize_registration_name(v_record->>'full_name')
      or coalesce(v_record->>'code_hash', '') !~ '^[a-f0-9]{64}$'
      or coalesce(v_record->>'id', '') = '' then raise exception 'ROSTER_INVALID'; end if;
    select * into v_section from public.sections where id = v_record->>'section_id' for share;
    if v_section.id is null or not v_section.is_active then raise exception 'ROSTER_INVALID'; end if;
    if exists(select 1 from public.users where role = 'student'
      and public.normalize_registration_name(name) = v_record->>'normalized_name')
      or exists(select 1 from public.class_registration_students where normalized_name = v_record->>'normalized_name') then
      raise exception 'ROSTER_DUPLICATE';
    end if;
    insert into public.class_registration_students(id, invitation_id, teacher_id, full_name,
      normalized_name, section_id, section_name, code_hash)
      values(v_record->>'id', v_invitation_id, p_teacher_id, v_record->>'full_name',
        v_record->>'normalized_name', v_section.id, v_section.name, v_record->>'code_hash');
  end loop;
  return v_invitation_id;
end;
$$;

create or replace function public.renew_class_invitation(
  p_teacher_id text, p_invitation_id text, p_expires_at timestamptz
) returns text language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.class_invitations%rowtype;
  v_subject public.subjects%rowtype;
  v_teacher public.users%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  select * into v_invitation from public.class_invitations
    where id = p_invitation_id and teacher_id = p_teacher_id for update;
  if v_invitation.id is null then raise exception 'INVITATION_INVALID'; end if;
  select * into v_subject from public.subjects where id = v_invitation.subject_id for share;
  select * into v_teacher from public.users where id = p_teacher_id for share;
  if v_subject.id is null or not v_subject.is_active or v_subject.teacher_id <> p_teacher_id
    or v_teacher.id is null or v_teacher.role <> 'teacher' or v_teacher.status <> 'active'
    or coalesce(v_teacher.archive->>'isArchived', 'false') = 'true' then raise exception 'CLASS_UNAVAILABLE'; end if;
  if p_expires_at is null or p_expires_at <= now() or p_expires_at > now() + interval '91 days' then raise exception 'ROSTER_INVALID'; end if;
  update public.class_invitations set expires_at = greatest(expires_at, p_expires_at),
    status = 'active', updated_at = now() where id = v_invitation.id;
  return v_invitation.id;
end;
$$;

create or replace function public.register_class_invitation_student(
  p_token_hash text, p_code_hash text, p_normalized_name text,
  p_email text, p_username text, p_password_hash text
) returns text language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.class_invitations%rowtype;
  v_student public.class_registration_students%rowtype;
  v_subject public.subjects%rowtype;
  v_teacher public.users%rowtype;
  v_adviser public.users%rowtype;
  v_section public.sections%rowtype;
  v_user_id text := replace(gen_random_uuid()::text, '-', '');
begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  select * into v_invitation from public.class_invitations where token_hash = p_token_hash for update;
  if v_invitation.id is null or v_invitation.status <> 'active' then raise exception 'INVITATION_INVALID'; end if;
  if v_invitation.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;
  select * into v_subject from public.subjects where id = v_invitation.subject_id for share;
  select * into v_teacher from public.users where id = v_invitation.teacher_id for share;
  if v_subject.id is null or not v_subject.is_active or v_subject.teacher_id <> v_invitation.teacher_id
    or v_teacher.id is null or v_teacher.role <> 'teacher' or v_teacher.status <> 'active'
    or coalesce(v_teacher.archive->>'isArchived', 'false') = 'true' then raise exception 'CLASS_UNAVAILABLE'; end if;
  select * into v_student from public.class_registration_students
    where invitation_id = v_invitation.id and code_hash = p_code_hash and normalized_name = p_normalized_name for update;
  if v_student.id is null then raise exception 'CODE_INVALID'; end if;
  if v_student.registered_at is not null or v_student.student_id is not null then raise exception 'CODE_USED'; end if;
  select * into v_section from public.sections where id = v_student.section_id for share;
  if v_section.id is null or not v_section.is_active then raise exception 'SECTION_UNAVAILABLE'; end if;
  -- Defense in depth: Express validates email/password before hashing. This RPC
  -- receives only hashes and is callable exclusively by the service role.
  if p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$'
    or p_email is null or char_length(p_email) > 254 or char_length(split_part(p_email, '@', 1)) > 64
    or p_email !~ '^[a-z0-9]+([.][a-z0-9]+)*([+][a-z0-9]+([._-][a-z0-9]+)*)?@gmail[.]com$'
    or p_password_hash is null or p_password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$' then raise exception 'ROSTER_INVALID'; end if;
  if exists(select 1 from public.users where lower(username) = lower(p_username)) then raise exception 'USERNAME_TAKEN'; end if;
  if exists(select 1 from public.users where lower(email) = lower(p_email)) then raise exception 'EMAIL_TAKEN'; end if;
  if exists(select 1 from public.users where role = 'student'
    and public.normalize_registration_name(name) = v_student.normalized_name) then raise exception 'STUDENT_EXISTS'; end if;
  select * into v_adviser from public.users where role = 'teacher' and status = 'active'
    and advisory_section_id = v_section.id and coalesce(archive->>'isArchived', 'false') <> 'true' for share;
  insert into public.users(id, name, email, username, password_hash, role, status, section_id,
    managed_by, department, strand, grade_level, enrollment)
    values(v_user_id, v_student.full_name, lower(p_email), p_username, p_password_hash, 'student', 'active',
      v_section.id, v_adviser.id, coalesce(v_adviser.department, ''),
      case when v_subject.track in ('STEM', 'HUMSS', 'ABM', 'TVL') then v_subject.track else '' end, 'Grade 10',
      jsonb_build_object('teacherId', v_adviser.id, 'status', case when v_adviser.id is null then '' else 'approved' end,
        'approvedAt', case when v_adviser.id is null then null else now() end));
  insert into public.subject_enrollments(subject_id, teacher_id, student_id, section_id, section_name,
    status, requested_at, decided_at)
    values(v_subject.id, v_invitation.teacher_id, v_user_id, v_section.id, v_section.name, 'approved', now(), now());
  update public.class_registration_students set registered_at = now(), student_id = v_user_id where id = v_student.id;
  return v_user_id;
end;
$$;

revoke all on function public.normalize_registration_name(text) from public, anon, authenticated;
grant execute on function public.normalize_registration_name(text) to service_role;
revoke all on function public.import_class_invitation(text, text, text, text, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.renew_class_invitation(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.register_class_invitation_student(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.import_class_invitation(text, text, text, text, timestamptz, jsonb) to service_role;
grant execute on function public.renew_class_invitation(text, text, timestamptz) to service_role;
grant execute on function public.register_class_invitation_student(text, text, text, text, text, text) to service_role;

commit;
