-- Bind roster invitations to the teacher's designated section and stable default
-- advisory class. Existing registered accounts and memberships are unchanged.
begin;

alter table public.subjects add column if not exists advisory_section_id text
  references public.sections(id) on delete set null;
create unique index if not exists subjects_teacher_advisory_section_unique
  on public.subjects(teacher_id, advisory_section_id) where advisory_section_id is not null;

-- Recognize only the legacy helper's exact canonical class shape. Custom class
-- names are not guessed. Runtime provisioning marks a newly ensured default.
with candidates as (
  select s.id, u.id as teacher_id, u.advisory_section_id,
    count(*) over(partition by u.id, u.advisory_section_id) as matches
  from public.subjects s
  join public.users u on u.id = s.teacher_id and u.role = 'teacher'
  join public.sections sec on sec.id = u.advisory_section_id and sec.is_active
  where s.advisory_section_id is null
    and coalesce(nullif(btrim(u.subject), ''), btrim(u.department)) <> ''
    and lower(btrim(s.name)) = lower(coalesce(nullif(btrim(u.subject), ''), btrim(u.department)))
    and lower(btrim(s.class_name)) = lower(coalesce(nullif(btrim(u.subject), ''), btrim(u.department)) || ' 10 - ' || sec.name)
    and upper(btrim(s.track)) = case when upper(btrim(u.strand)) in ('STEM','HUMSS','ABM','TVL','GENERAL')
      then upper(btrim(u.strand)) else 'GENERAL' end
    and not exists(select 1 from public.subjects marked where marked.teacher_id = u.id
      and marked.advisory_section_id = u.advisory_section_id)
)
update public.subjects s set advisory_section_id = c.advisory_section_id
  from candidates c where c.id = s.id and c.matches = 1;

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
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  select * into v_teacher from public.users where id = p_teacher_id for share;
  select * into v_subject from public.subjects where id = p_subject_id for update;
  if v_teacher.id is null or v_teacher.role <> 'teacher' or v_teacher.status <> 'active'
    or coalesce(v_teacher.archive->>'isArchived', 'false') = 'true'
    or v_subject.id is null or v_subject.teacher_id <> p_teacher_id or not v_subject.is_active then
    raise exception 'CLASS_UNAVAILABLE';
  end if;
  if v_teacher.advisory_section_id is null or v_subject.advisory_section_id is distinct from v_teacher.advisory_section_id then
    raise exception 'ADVISORY_UNAVAILABLE';
  end if;
  select * into v_section from public.sections where id = v_teacher.advisory_section_id for share;
  if v_section.id is null or not v_section.is_active then raise exception 'ADVISORY_SECTION_REQUIRED'; end if;
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
      or coalesce(v_record->>'normalized_name', '') <> public.normalize_registration_name(v_record->>'full_name') then
      raise exception 'ROSTER_INVALID';
    end if;
    if v_record->>'section_id' is distinct from v_teacher.advisory_section_id then raise exception 'ADVISORY_UNAVAILABLE'; end if;
    if exists(select 1 from public.users where role = 'student'
      and public.normalize_registration_name(name) = v_record->>'normalized_name')
      or exists(select 1 from public.class_registration_students where normalized_name = v_record->>'normalized_name') then
      raise exception 'ROSTER_DUPLICATE';
    end if;
    insert into public.class_registration_students(invitation_id, teacher_id, full_name,
      normalized_name, section_id, section_name)
      values(v_invitation_id, p_teacher_id, v_record->>'full_name',
        v_record->>'normalized_name', v_section.id, v_section.name);
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
  v_section public.sections%rowtype;
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
  if v_teacher.advisory_section_id is null or v_subject.advisory_section_id is distinct from v_teacher.advisory_section_id then
    raise exception 'ADVISORY_UNAVAILABLE';
  end if;
  select * into v_section from public.sections where id = v_teacher.advisory_section_id for share;
  if v_section.id is null or not v_section.is_active then raise exception 'ADVISORY_SECTION_REQUIRED'; end if;
  if exists(select 1 from public.class_registration_students where invitation_id = v_invitation.id
    and section_id is distinct from v_teacher.advisory_section_id) then raise exception 'ADVISORY_UNAVAILABLE'; end if;
  if p_expires_at is null or p_expires_at <= now() or p_expires_at > now() + interval '91 days' then raise exception 'ROSTER_INVALID'; end if;
  update public.class_invitations set expires_at = greatest(expires_at, p_expires_at),
    status = 'active', updated_at = now() where id = v_invitation.id;
  return v_invitation.id;
end;
$$;

create or replace function public.register_class_invitation_student(
  p_token_hash text, p_normalized_name text, p_email text, p_username text, p_password_hash text
) returns text language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.class_invitations%rowtype;
  v_student public.class_registration_students%rowtype;
  v_subject public.subjects%rowtype;
  v_teacher public.users%rowtype;
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
  if v_teacher.advisory_section_id is null or v_subject.advisory_section_id is distinct from v_teacher.advisory_section_id then
    raise exception 'ADVISORY_UNAVAILABLE';
  end if;
  if p_normalized_name is null or char_length(p_normalized_name) not between 3 and 150
    or p_normalized_name <> public.normalize_registration_name(p_normalized_name) then raise exception 'NAME_INVALID'; end if;
  select * into v_student from public.class_registration_students
    where invitation_id = v_invitation.id and normalized_name = p_normalized_name for update;
  if v_student.id is null then raise exception 'NAME_NOT_FOUND'; end if;
  if v_student.section_id is distinct from v_teacher.advisory_section_id then raise exception 'ADVISORY_UNAVAILABLE'; end if;
  if v_student.registered_at is not null or v_student.student_id is not null then raise exception 'STUDENT_REGISTERED'; end if;
  select * into v_section from public.sections where id = v_teacher.advisory_section_id for share;
  if v_section.id is null or not v_section.is_active then raise exception 'ADVISORY_SECTION_REQUIRED'; end if;
  if p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$'
    or p_email is null or char_length(p_email) > 254 or char_length(split_part(p_email, '@', 1)) > 64
    or p_email !~ '^[a-z0-9]+([.][a-z0-9]+)*([+][a-z0-9]+([._-][a-z0-9]+)*)?@gmail[.]com$'
    or p_password_hash is null or p_password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$' then raise exception 'ROSTER_INVALID'; end if;
  if exists(select 1 from public.users where lower(username) = lower(p_username)) then raise exception 'USERNAME_TAKEN'; end if;
  if exists(select 1 from public.users where lower(email) = lower(p_email)) then raise exception 'EMAIL_TAKEN'; end if;
  if exists(select 1 from public.users where role = 'student'
    and public.normalize_registration_name(name) = v_student.normalized_name) then raise exception 'STUDENT_EXISTS'; end if;
  insert into public.users(id, name, email, username, password_hash, role, status, section_id,
    managed_by, department, strand, grade_level, enrollment)
    values(v_user_id, v_student.full_name, lower(p_email), p_username, p_password_hash, 'student', 'active',
      v_section.id, v_teacher.id, v_teacher.department,
      case when v_subject.track in ('STEM', 'HUMSS', 'ABM', 'TVL') then v_subject.track else '' end, 'Grade 10',
      jsonb_build_object('teacherId', v_teacher.id, 'status', 'approved', 'approvedAt', now()));
  insert into public.subject_enrollments(subject_id, teacher_id, student_id, section_id, section_name,
    status, requested_at, decided_at)
    values(v_subject.id, v_teacher.id, v_user_id, v_section.id, v_section.name, 'approved', now(), now());
  update public.class_registration_students set registered_at = now(), student_id = v_user_id where id = v_student.id;
  return v_user_id;
end;
$$;

revoke all on function public.import_class_invitation(text, text, text, text, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.renew_class_invitation(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.register_class_invitation_student(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.import_class_invitation(text, text, text, text, timestamptz, jsonb) to service_role;
grant execute on function public.renew_class_invitation(text, text, timestamptz) to service_role;
grant execute on function public.register_class_invitation_student(text, text, text, text, text) to service_role;

commit;
