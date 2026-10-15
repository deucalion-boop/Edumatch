-- School-wide student identities and class assignments. Supabase Auth is used
-- only for newly registered students; existing accounts and passwords remain.
begin;

alter table public.users add column if not exists auth_provider text not null default 'local';
alter table public.users add column if not exists auth_user_id uuid references auth.users(id) on delete restrict;
create unique index if not exists users_auth_user_id_unique on public.users(auth_user_id) where auth_user_id is not null;
do $$ begin
  if not exists(select 1 from pg_constraint where conname = 'users_auth_provider_check' and conrelid = 'public.users'::regclass) then
    alter table public.users add constraint users_auth_provider_check check (
      auth_provider = 'local' or
      (auth_provider = 'supabase' and role = 'student' and auth_user_id is not null and password_hash is null));
  end if;
end; $$;

create table if not exists public.student_registry (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  first_name text not null,
  last_name text not null default '',
  full_name text not null,
  normalized_name text not null unique check (normalized_name = public.normalize_registration_name(full_name)),
  created_by text references public.users(id) on delete set null,
  student_id text unique references public.users(id) on delete set null,
  code_nonce text,
  code_hash text unique check (code_hash is null or code_hash ~ '^[a-f0-9]{64}$'),
  code_expires_at timestamptz,
  code_revoked_at timestamptz,
  code_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.student_registry_assignments (
  registry_id text not null references public.student_registry(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete cascade,
  assigned_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key(registry_id, subject_id)
);
create index if not exists student_registry_assignments_subject_idx on public.student_registry_assignments(subject_id, registry_id);
create table if not exists public.student_registry_links (
  id text primary key default 'school' check (id = 'school'),
  token_nonce text not null,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  created_by text references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table if not exists public.student_registry_sessions (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  registry_id text not null references public.student_registry(id) on delete cascade,
  link_hash text not null,
  code_hash text not null,
  ticket_hash text not null unique check (ticket_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null default now() + interval '30 minutes',
  email text,
  email_challenge_id text,
  email_code_hash text,
  email_code_expires_at timestamptz,
  email_code_sent_at timestamptz,
  email_code_attempts integer not null default 0 check (email_code_attempts between 0 and 5),
  verification_token_hash text,
  email_verified_at timestamptz,
  email_verified_expires_at timestamptz,
  claim_id text,
  claim_username text,
  claim_email text,
  claim_expires_at timestamptz,
  completed_user_id text references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists student_registry_sessions_registry_idx on public.student_registry_sessions(registry_id);
create table if not exists public.student_registry_claims (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{16,128}$'),
  registry_id text not null references public.student_registry(id) on delete cascade,
  email text not null check (email = lower(btrim(email))),
  created_at timestamptz not null default now()
);
-- Preserve ownership if this migration is rerun after an interrupted signup.
insert into public.student_registry_claims(id, registry_id, email)
  select claim_id, registry_id, claim_email from public.student_registry_sessions
  where claim_id is not null and claim_email is not null on conflict(id) do nothing;

-- Seed central identities without renaming, merging or changing credentials.
insert into public.student_registry(first_name, last_name, full_name, normalized_name, student_id, code_used_at, created_at)
  select case when position(' ' in public.normalize_registration_name(u.name)) = 0 then btrim(u.name)
    else regexp_replace(btrim(regexp_replace(u.name, '[[:space:]]+', ' ', 'g')), ' [^ ]+$', '') end,
    case when position(' ' in public.normalize_registration_name(u.name)) = 0 then ''
    else regexp_replace(btrim(regexp_replace(u.name, '[[:space:]]+', ' ', 'g')), '^.* ', '') end,
    u.name, public.normalize_registration_name(u.name), u.id, coalesce(u.created_at, now()), coalesce(u.created_at, now())
  from public.users u where u.role = 'student'
  on conflict(normalized_name) do update set student_id = excluded.student_id,
    code_used_at = coalesce(student_registry.code_used_at, excluded.code_used_at)
    where student_registry.student_id is null or student_registry.student_id = excluded.student_id;
with added as (
  insert into public.student_registry(first_name, last_name, full_name, normalized_name, created_by, created_at)
  select case when position(' ' in r.normalized_name) = 0 then r.full_name
    else regexp_replace(r.full_name, ' [^ ]+$', '') end,
    case when position(' ' in r.normalized_name) = 0 then '' else regexp_replace(r.full_name, '^.* ', '') end,
    r.full_name, r.normalized_name, r.teacher_id, r.created_at
  from public.class_registration_students r where r.student_id is null
  on conflict(normalized_name) do nothing returning id, normalized_name
)
insert into public.student_registry_assignments(registry_id, subject_id, assigned_by)
  select added.id, i.subject_id, c.teacher_id from added
  join public.class_registration_students c on c.normalized_name = added.normalized_name
  join public.class_invitations i on i.id = c.invitation_id on conflict do nothing;
insert into public.student_registry_assignments(registry_id, subject_id)
  select r.id, e.subject_id from public.student_registry r
  join public.subject_enrollments e on e.student_id = r.student_id and e.status = 'approved'
  on conflict do nothing;

create or replace function public.student_registry_assert_headteacher(p_id text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_user public.users%rowtype; begin
  select * into v_user from public.users where id = p_id for share;
  if v_user.id is null or v_user.role <> 'headteacher' or v_user.status <> 'active'
    or coalesce(v_user.archive->>'isArchived', 'false') = 'true' then raise exception 'ISSUER_UNAVAILABLE'; end if;
end; $$;
create or replace function public.student_registry_check_link(p_hash text)
returns public.student_registry_links language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_link public.student_registry_links%rowtype; begin
  select * into v_link from public.student_registry_links where id = 'school' and token_hash = p_hash for share;
  if v_link.id is null then raise exception 'INVITATION_INVALID'; end if;
  if v_link.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;
  return v_link;
end; $$;
create or replace function public.student_registry_check_session(p_link_hash text, p_ticket_hash text)
returns public.student_registry_sessions language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_session public.student_registry_sessions%rowtype; v_student public.student_registry%rowtype; begin
  perform public.student_registry_check_link(p_link_hash);
  select * into v_session from public.student_registry_sessions where ticket_hash = p_ticket_hash for update;
  if v_session.id is null or v_session.link_hash is distinct from p_link_hash then raise exception 'SESSION_INVALID'; end if;
  if v_session.expires_at <= now() then raise exception 'SESSION_EXPIRED'; end if;
  select * into v_student from public.student_registry where id = v_session.registry_id for update;
  if v_student.id is null then raise exception 'REGISTRY_NOT_FOUND'; end if;
  if v_student.student_id is not null or v_student.code_used_at is not null then raise exception 'STUDENT_REGISTERED'; end if;
  if v_student.code_revoked_at is not null then raise exception 'CODE_REVOKED'; end if;
  if v_student.code_hash is null or v_student.code_hash is distinct from v_session.code_hash then raise exception 'CODE_INVALID'; end if;
  if v_student.code_expires_at is null or v_student.code_expires_at <= now() then raise exception 'CODE_EXPIRED'; end if;
  return v_session;
end; $$;

create or replace function public.student_registry_link(
  p_headteacher_id text, p_nonce text, p_token_hash text, p_rotate boolean default false, p_days integer default 30
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_link public.student_registry_links%rowtype; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  perform public.student_registry_assert_headteacher(p_headteacher_id);
  if p_nonce is null or p_nonce !~ '^[A-Za-z0-9_-]{16,128}$'
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_days is null or p_days not between 1 and 90 then raise exception 'INPUT_INVALID'; end if;
  select * into v_link from public.student_registry_links where id = 'school' for update;
  if v_link.id is not null and v_link.expires_at > now() and not coalesce(p_rotate, false) then return to_jsonb(v_link); end if;
  if exists(select 1 from public.student_registry_sessions where completed_user_id is null and claim_expires_at > now()) then
    raise exception 'CLAIM_IN_PROGRESS'; end if;
  if v_link.id is not null and v_link.token_hash = p_token_hash then raise exception 'INPUT_INVALID'; end if;
  insert into public.student_registry_links(id, token_nonce, token_hash, expires_at, created_by)
    values('school', p_nonce, p_token_hash, now() + make_interval(days => p_days), p_headteacher_id)
    on conflict(id) do update set token_nonce = excluded.token_nonce, token_hash = excluded.token_hash,
      expires_at = excluded.expires_at, created_by = excluded.created_by, updated_at = now() returning * into v_link;
  -- A claimed session is the durable ownership ledger for an Auth identity
  -- created before a lost/failed public-side completion response.
  delete from public.student_registry_sessions where completed_user_id is null and claim_id is null;
  return to_jsonb(v_link);
end; $$;

create or replace function public.student_registry_import(p_headteacher_id text, p_records jsonb)
returns integer language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_record jsonb; v_first text; v_last text; v_name text; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  perform public.student_registry_assert_headteacher(p_headteacher_id);
  if p_records is null or jsonb_typeof(p_records) <> 'array' then raise exception 'INPUT_INVALID'; end if;
  if jsonb_array_length(p_records) not between 1 and 1000 then raise exception 'INPUT_INVALID'; end if;
  for v_record in select value from jsonb_array_elements(p_records) loop
    v_first := btrim(v_record->>'firstName'); v_last := btrim(v_record->>'lastName');
    v_name := v_first || ' ' || v_last;
    if coalesce(jsonb_typeof(v_record->'firstName'), '') <> 'string'
      or coalesce(jsonb_typeof(v_record->'lastName'), '') <> 'string'
      or char_length(v_first) not between 1 and 100 or char_length(v_last) not between 1 and 100
      or char_length(v_name) not between 3 and 150
      or v_first !~ '[[:alpha:]]' or v_last !~ '[[:alpha:]]' or v_name ~ '[[:cntrl:]]'
      or coalesce(v_record->>'id', '') !~ '^[A-Za-z0-9_-]{1,128}$'
      or coalesce(v_record->>'nonce', '') !~ '^[A-Za-z0-9_-]{16,128}$'
      or coalesce(v_record->>'codeHash', '') !~ '^[a-f0-9]{64}$' then raise exception 'INPUT_INVALID'; end if;
    if exists(select 1 from public.student_registry where normalized_name = public.normalize_registration_name(v_name))
      or exists(select 1 from public.users where role = 'student' and public.normalize_registration_name(name) = public.normalize_registration_name(v_name)) then
      raise exception 'REGISTRY_DUPLICATE';
    end if;
    insert into public.student_registry(id, first_name, last_name, full_name, normalized_name, created_by,
      code_nonce, code_hash, code_expires_at)
      values(v_record->>'id', v_first, v_last, v_name, public.normalize_registration_name(v_name), p_headteacher_id,
        v_record->>'nonce', v_record->>'codeHash', now() + interval '30 days');
  end loop;
  return jsonb_array_length(p_records);
end; $$;

create or replace function public.student_registry_verify(
  p_link_hash text, p_code_hash text, p_full_name text, p_ticket_hash text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_link public.student_registry_links%rowtype; v_student public.student_registry%rowtype;
  v_session public.student_registry_sessions%rowtype; v_assignments jsonb; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  v_link := public.student_registry_check_link(p_link_hash);
  if p_ticket_hash is null or p_ticket_hash !~ '^[a-f0-9]{64}$' then raise exception 'INPUT_INVALID'; end if;
  select * into v_student from public.student_registry where code_hash = p_code_hash
    and normalized_name = public.normalize_registration_name(p_full_name) for update;
  if v_student.id is null then raise exception 'CODE_INVALID'; end if;
  if v_student.student_id is not null or v_student.code_used_at is not null then raise exception 'STUDENT_REGISTERED'; end if;
  if v_student.code_revoked_at is not null then raise exception 'CODE_REVOKED'; end if;
  if v_student.code_expires_at is null or v_student.code_expires_at <= now() then raise exception 'CODE_EXPIRED'; end if;
  insert into public.student_registry_sessions(registry_id, link_hash, code_hash, ticket_hash, expires_at)
    values(v_student.id, p_link_hash, p_code_hash, p_ticket_hash,
      least(now() + interval '30 minutes', v_student.code_expires_at, v_link.expires_at)) returning * into v_session;
  select coalesce(jsonb_agg(jsonb_build_object('subjectId', s.id, 'className', coalesce(nullif(s.class_name, ''), s.name),
    'subjectName', s.name, 'teacherName', t.name, 'sectionName', coalesce(sec.name, '')) order by s.class_name, s.id), '[]'::jsonb)
    into v_assignments from public.student_registry_assignments a
    join public.subjects s on s.id = a.subject_id join public.users t on t.id = s.teacher_id
    left join public.sections sec on sec.id = coalesce(s.advisory_section_id, t.advisory_section_id)
    where a.registry_id = v_student.id and s.is_active and t.role = 'teacher' and t.status = 'active'
      and coalesce(t.archive->>'isArchived', 'false') <> 'true';
  return jsonb_build_object('sessionId', v_session.id, 'student', jsonb_build_object(
    'id', v_student.id, 'firstName', v_student.first_name, 'lastName', v_student.last_name,
    'fullName', v_student.full_name, 'assignments', v_assignments),
    'expiresAt', v_session.expires_at);
end; $$;

create or replace function public.student_registry_owned_auth(p_auth_id uuid, p_registry_id text, p_email text)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists(select 1 from auth.users a where a.id = p_auth_id and lower(a.email) = p_email
    and a.raw_app_meta_data->>'student_registry_id' = p_registry_id
    and exists(select 1 from public.student_registry_claims ledger where ledger.registry_id = p_registry_id
      and ledger.id = a.raw_app_meta_data->>'registry_claim_id' and ledger.email = p_email)
    and not exists(select 1 from public.users u where u.auth_user_id = a.id or lower(u.email) = p_email));
$$;
create or replace function public.student_registry_prepare_email(
  p_link_hash text, p_ticket_hash text, p_email text, p_code_hash text, p_challenge_id text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_session public.student_registry_sessions%rowtype; v_email text := lower(btrim(p_email)); v_auth auth.users%rowtype; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  v_session := public.student_registry_check_session(p_link_hash, p_ticket_hash);
  if not public.teacher_invitation_valid_email(v_email)
    or p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$'
    or p_challenge_id is null or p_challenge_id !~ '^[A-Za-z0-9_-]{16,128}$' then raise exception 'INPUT_INVALID'; end if;
  if exists(select 1 from public.users where lower(email) = v_email) then raise exception 'EMAIL_TAKEN'; end if;
  select * into v_auth from auth.users where lower(email) = v_email for share;
  if v_auth.id is not null then
    if not public.student_registry_owned_auth(v_auth.id, v_session.registry_id, v_email) then raise exception 'EMAIL_TAKEN'; end if;
    if exists(select 1 from public.student_registry_sessions where registry_id = v_session.registry_id
      and completed_user_id is null and claim_expires_at > now()) then raise exception 'CLAIM_IN_PROGRESS'; end if;
  end if;
  if v_session.claim_expires_at > now() then raise exception 'CLAIM_IN_PROGRESS'; end if;
  if v_session.email_code_sent_at > now() - interval '60 seconds' then raise exception 'INVITATION_COOLDOWN'; end if;
  update public.student_registry_sessions set email = v_email, email_challenge_id = p_challenge_id,
    email_code_hash = p_code_hash, email_code_expires_at = least(now() + interval '10 minutes', expires_at),
    email_code_sent_at = now(), email_code_attempts = 0, verification_token_hash = null,
    email_verified_at = null, email_verified_expires_at = null, claim_id = null, claim_username = null,
    claim_email = null, claim_expires_at = null where id = v_session.id returning * into v_session;
  return to_jsonb(v_session);
end; $$;

create or replace function public.student_registry_verify_email(
  p_link_hash text, p_ticket_hash text, p_email text, p_challenge_id text, p_code_hash text, p_verification_hash text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_session public.student_registry_sessions%rowtype; v_email text := lower(btrim(p_email)); v_expires timestamptz; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  v_session := public.student_registry_check_session(p_link_hash, p_ticket_hash);
  if not public.teacher_invitation_valid_email(v_email)
    or p_verification_hash is null or p_verification_hash !~ '^[a-f0-9]{64}$' then raise exception 'INPUT_INVALID'; end if;
  if v_session.email_code_attempts >= 5 then return jsonb_build_object('verified', false, 'code', 'EMAIL_CODE_LOCKED'); end if;
  if v_session.email_code_expires_at is null or v_session.email_code_expires_at <= now() then
    return jsonb_build_object('verified', false, 'code', 'EMAIL_CODE_EXPIRED'); end if;
  if v_email is distinct from v_session.email or p_challenge_id is null or p_challenge_id is distinct from v_session.email_challenge_id
    or p_code_hash is null or p_code_hash is distinct from v_session.email_code_hash then
    update public.student_registry_sessions set email_code_attempts = email_code_attempts + 1 where id = v_session.id;
    return jsonb_build_object('verified', false, 'code',
      case when v_session.email_code_attempts + 1 >= 5 then 'EMAIL_CODE_LOCKED' else 'EMAIL_CODE_INVALID' end);
  end if;
  v_expires := least(now() + interval '15 minutes', v_session.expires_at);
  update public.student_registry_sessions set verification_token_hash = p_verification_hash, email_verified_at = now(),
    email_verified_expires_at = v_expires, email_code_hash = null, email_code_expires_at = null where id = v_session.id;
  return jsonb_build_object('verified', true, 'email', v_email, 'expiresAt', v_expires);
end; $$;

create or replace function public.student_registry_begin(
  p_link_hash text, p_ticket_hash text, p_email text, p_username text, p_verification_hash text, p_claim_id text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_session public.student_registry_sessions%rowtype; v_email text := lower(btrim(p_email));
  v_auth auth.users%rowtype; v_public public.users%rowtype; v_rebind boolean := false; v_subjects text[]; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  select * into v_session from public.student_registry_sessions where ticket_hash = p_ticket_hash for update;
  if v_session.id is null then raise exception 'SESSION_INVALID'; end if;
  if p_claim_id is null or p_claim_id !~ '^[A-Za-z0-9_-]{16,128}$'
    or p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$'
    or not public.teacher_invitation_valid_email(v_email) then raise exception 'INPUT_INVALID'; end if;
  if v_session.completed_user_id is not null then
    if p_claim_id is distinct from v_session.claim_id or v_email is distinct from v_session.claim_email
      or lower(p_username) is distinct from lower(v_session.claim_username) then raise exception 'CLAIM_INVALID'; end if;
    select * into v_public from public.users where id = v_session.completed_user_id;
    return jsonb_build_object('registryId', v_session.registry_id, 'claimId', p_claim_id,
      'userId', v_public.id, 'authUserId', v_public.auth_user_id);
  end if;
  v_session := public.student_registry_check_session(p_link_hash, p_ticket_hash);
  if p_verification_hash is null or p_verification_hash is distinct from v_session.verification_token_hash
    or v_email is distinct from v_session.email or v_session.email_verified_at is null
    or v_session.email_verified_expires_at is null or v_session.email_verified_expires_at <= now() then
    raise exception 'EMAIL_VERIFICATION_REQUIRED'; end if;
  if v_session.claim_id is not null and v_session.claim_id <> p_claim_id and v_session.claim_expires_at > now() then
    raise exception 'CLAIM_IN_PROGRESS'; end if;
  if v_session.claim_id = p_claim_id and (v_session.claim_email is distinct from v_email
    or lower(v_session.claim_username) is distinct from lower(p_username)) then raise exception 'CLAIM_INVALID'; end if;
  if exists(select 1 from public.student_registry_sessions where registry_id = v_session.registry_id
    and id <> v_session.id and completed_user_id is null and claim_expires_at > now()) then raise exception 'CLAIM_IN_PROGRESS'; end if;
  if exists(select 1 from public.student_registry_sessions where id <> v_session.id
    and lower(claim_username) = lower(p_username) and completed_user_id is null and claim_expires_at > now()) then
    raise exception 'USERNAME_TAKEN'; end if;
  select * into v_auth from auth.users where lower(email) = v_email for share;
  if v_auth.id is not null then
    if not public.student_registry_owned_auth(v_auth.id, v_session.registry_id, v_email) then raise exception 'EMAIL_TAKEN'; end if;
    v_rebind := v_auth.raw_app_meta_data->>'registry_claim_id' is distinct from p_claim_id;
  end if;
  if exists(select 1 from public.users where lower(username) = lower(p_username)) then raise exception 'USERNAME_TAKEN'; end if;
  if exists(select 1 from public.users where lower(email) = v_email) then raise exception 'EMAIL_TAKEN'; end if;
  select coalesce(array_agg(subject_id), '{}'::text[]) into v_subjects from public.student_registry_assignments where registry_id = v_session.registry_id;
  perform public.student_registry_assert_classes(v_subjects);
  insert into public.student_registry_claims(id, registry_id, email) values(p_claim_id, v_session.registry_id, v_email)
    on conflict(id) do nothing;
  if not exists(select 1 from public.student_registry_claims where id = p_claim_id and registry_id = v_session.registry_id and email = v_email) then
    raise exception 'CLAIM_INVALID'; end if;
  update public.student_registry_sessions set claim_id = p_claim_id, claim_username = p_username,
    claim_email = v_email, claim_expires_at = least(now() + interval '5 minutes', expires_at)
    where id = v_session.id;
  return jsonb_strip_nulls(jsonb_build_object('registryId', v_session.registry_id, 'claimId', p_claim_id,
    'authUserId', v_auth.id, 'authNeedsRebind', case when v_rebind then true else null end));
end; $$;

create or replace function public.student_registry_finish(p_ticket_hash text, p_claim_id text, p_auth_user_id uuid)
returns text language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_session public.student_registry_sessions%rowtype; v_student public.student_registry%rowtype;
  v_auth auth.users%rowtype; v_first record; v_id text := replace(gen_random_uuid()::text, '-', ''); v_subjects text[];
begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  select * into v_session from public.student_registry_sessions where ticket_hash = p_ticket_hash for update;
  if v_session.id is null then raise exception 'SESSION_INVALID'; end if;
  if p_claim_id is null or p_claim_id is distinct from v_session.claim_id then raise exception 'CLAIM_INVALID'; end if;
  if v_session.completed_user_id is not null then
    if not exists(select 1 from public.users where id = v_session.completed_user_id and auth_user_id = p_auth_user_id) then
      raise exception 'AUTH_IDENTITY_INVALID'; end if;
    return v_session.completed_user_id;
  end if;
  v_session := public.student_registry_check_session(v_session.link_hash, p_ticket_hash);
  if v_session.claim_expires_at is null or v_session.claim_expires_at <= now() then raise exception 'CLAIM_INVALID'; end if;
  select * into v_student from public.student_registry where id = v_session.registry_id for update;
  select * into v_auth from auth.users where id = p_auth_user_id for share;
  if v_auth.id is null or lower(v_auth.email) is distinct from v_session.claim_email
    or v_auth.raw_app_meta_data->>'student_registry_id' is distinct from v_student.id
    or v_auth.raw_app_meta_data->>'registry_claim_id' is distinct from p_claim_id then raise exception 'AUTH_IDENTITY_INVALID'; end if;
  if v_auth.email_confirmed_at is null then raise exception 'AUTH_EMAIL_UNVERIFIED'; end if;
  if exists(select 1 from public.users where lower(username) = lower(v_session.claim_username)) then raise exception 'USERNAME_TAKEN'; end if;
  if exists(select 1 from public.users where lower(email) = v_session.claim_email) then raise exception 'EMAIL_TAKEN'; end if;
  select coalesce(array_agg(subject_id), '{}'::text[]) into v_subjects from public.student_registry_assignments where registry_id = v_student.id;
  perform public.student_registry_assert_classes(v_subjects);
  select s.teacher_id, coalesce(s.advisory_section_id, t.advisory_section_id) as section_id,
    t.department, s.track into v_first from public.student_registry_assignments a
    join public.subjects s on s.id = a.subject_id join public.users t on t.id = s.teacher_id
    where a.registry_id = v_student.id order by a.created_at, s.id limit 1;
  insert into public.users(id, name, email, username, password_hash, role, status, auth_provider, auth_user_id,
    managed_by, section_id, department, strand, grade_level)
    values(v_id, v_student.full_name, v_session.claim_email, v_session.claim_username, null, 'student', 'active', 'supabase', p_auth_user_id,
      v_first.teacher_id, v_first.section_id, coalesce(v_first.department, ''),
      case when v_first.track in ('STEM','HUMSS','ABM','TVL') then v_first.track else '' end, '');
  insert into public.subject_enrollments(subject_id, teacher_id, student_id, section_id, section_name, status, decided_at)
    select s.id, s.teacher_id, v_id, sec.id, coalesce(sec.name, ''), 'approved', now()
    from public.student_registry_assignments a join public.subjects s on s.id = a.subject_id
    join public.users t on t.id = s.teacher_id
    left join public.sections sec on sec.id = coalesce(s.advisory_section_id, t.advisory_section_id)
    where a.registry_id = v_student.id;
  update public.student_registry set student_id = v_id, code_used_at = now(), updated_at = now() where id = v_student.id;
  update public.student_registry_sessions set completed_user_id = v_id, email_code_hash = null,
    email_code_expires_at = null, verification_token_hash = null, email_verified_expires_at = null where id = v_session.id;
  return v_id;
end; $$;

create or replace function public.student_registry_code(
  p_headteacher_id text, p_registry_id text, p_nonce text, p_code_hash text, p_revoke boolean default false
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_student public.student_registry%rowtype; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  perform public.student_registry_assert_headteacher(p_headteacher_id);
  select * into v_student from public.student_registry where id = p_registry_id for update;
  if v_student.id is null then raise exception 'REGISTRY_NOT_FOUND'; end if;
  if v_student.student_id is not null or v_student.code_used_at is not null then raise exception 'STUDENT_REGISTERED'; end if;
  if exists(select 1 from public.student_registry_sessions where registry_id = p_registry_id
    and completed_user_id is null and claim_expires_at > now()) then raise exception 'CLAIM_IN_PROGRESS'; end if;
  if coalesce(p_revoke, false) then
    update public.student_registry set code_revoked_at = now(), updated_at = now() where id = p_registry_id returning * into v_student;
  else
    if p_nonce is null or p_nonce !~ '^[A-Za-z0-9_-]{16,128}$'
      or p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$' or p_code_hash = v_student.code_hash then raise exception 'INPUT_INVALID'; end if;
    update public.student_registry set code_nonce = p_nonce, code_hash = p_code_hash,
      code_expires_at = now() + interval '30 days', code_revoked_at = null, code_used_at = null, updated_at = now()
      where id = p_registry_id returning * into v_student;
  end if;
  delete from public.student_registry_sessions where registry_id = p_registry_id and completed_user_id is null and claim_id is null;
  return to_jsonb(v_student);
end; $$;

create or replace function public.student_registry_assert_classes(p_subject_ids text[])
returns void language plpgsql security definer set search_path = public, pg_temp
as $$ begin
  if exists(select 1 from unnest(p_subject_ids) requested(id)
    left join public.subjects s on s.id = requested.id left join public.users u on u.id = s.teacher_id
    where s.id is null or not s.is_active or u.role <> 'teacher' or u.status <> 'active'
      or coalesce(u.archive->>'isArchived', 'false') = 'true') then raise exception 'CLASS_UNAVAILABLE'; end if;
end; $$;
create or replace function public.student_registry_assign(
  p_headteacher_id text, p_registry_ids text[], p_subject_ids text[]
) returns integer language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_student public.student_registry%rowtype; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  perform public.student_registry_assert_headteacher(p_headteacher_id);
  if p_registry_ids is null or cardinality(p_registry_ids) not between 1 and 1000
    or p_subject_ids is null or cardinality(p_subject_ids) > 500
    or exists(select 1 from unnest(p_registry_ids) x(id) where id is null)
    or exists(select 1 from unnest(p_subject_ids) x(id) where id is null)
    or (select count(distinct id) from unnest(p_registry_ids) x(id)) <> cardinality(p_registry_ids)
    or (select count(distinct id) from unnest(p_subject_ids) x(id)) <> cardinality(p_subject_ids) then raise exception 'INPUT_INVALID'; end if;
  if (select count(*) from public.student_registry where id = any(p_registry_ids)) <> cardinality(p_registry_ids) then raise exception 'REGISTRY_NOT_FOUND'; end if;
  perform public.student_registry_assert_classes(p_subject_ids);
  for v_student in select * from public.student_registry where id = any(p_registry_ids) order by id for update loop
    if v_student.student_id is not null then
      delete from public.subject_enrollments e using public.student_registry_assignments a
        where a.registry_id = v_student.id and a.subject_id <> all(p_subject_ids)
          and e.subject_id = a.subject_id and e.student_id = v_student.student_id;
    end if;
    delete from public.student_registry_assignments where registry_id = v_student.id and subject_id <> all(p_subject_ids);
    insert into public.student_registry_assignments(registry_id, subject_id, assigned_by)
      select v_student.id, id, p_headteacher_id from unnest(p_subject_ids) s(id) on conflict do nothing;
    if v_student.student_id is not null then
      insert into public.subject_enrollments(subject_id, teacher_id, student_id, section_id, section_name, status, decided_at)
        select s.id, s.teacher_id, v_student.student_id, sec.id, coalesce(sec.name, ''), 'approved', now()
        from public.subjects s join public.users t on t.id = s.teacher_id
        left join public.sections sec on sec.id = coalesce(s.advisory_section_id, t.advisory_section_id)
        where s.id = any(p_subject_ids)
        on conflict(subject_id, student_id) do update set status = 'approved', teacher_id = excluded.teacher_id,
          section_id = excluded.section_id, section_name = excluded.section_name, decided_at = now(), updated_at = now();
    end if;
  end loop;
  return cardinality(p_registry_ids);
end; $$;

create or replace function public.student_registry_sync_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_user public.users%rowtype; v_registry public.student_registry%rowtype; v_normalized text; v_first text; v_last text; begin
  if new.role <> 'student' then return null; end if;
  if tg_op = 'UPDATE' and old.role = new.role and old.name is not distinct from new.name then return null; end if;
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  select * into v_user from public.users where id = new.id and role = 'student';
  if v_user.id is null then return null; end if;
  v_normalized := public.normalize_registration_name(v_user.name);
  v_first := case when position(' ' in v_normalized) = 0 then btrim(v_user.name)
    else regexp_replace(btrim(regexp_replace(v_user.name, '[[:space:]]+', ' ', 'g')), ' [^ ]+$', '') end;
  v_last := case when position(' ' in v_normalized) = 0 then ''
    else regexp_replace(btrim(regexp_replace(v_user.name, '[[:space:]]+', ' ', 'g')), '^.* ', '') end;
  select * into v_registry from public.student_registry where student_id = v_user.id for update;
  if v_registry.id is not null then
    if v_registry.full_name is distinct from v_user.name then
      update public.student_registry set first_name = v_first, last_name = v_last, full_name = v_user.name,
        normalized_name = v_normalized, code_used_at = coalesce(code_used_at, now()), updated_at = now()
        where id = v_registry.id;
    else
      update public.student_registry set code_used_at = coalesce(code_used_at, now()), updated_at = now() where id = v_registry.id;
    end if;
  else
    select * into v_registry from public.student_registry where normalized_name = v_normalized for update;
    if v_registry.student_id is not null and v_registry.student_id <> v_user.id then raise exception 'REGISTRY_DUPLICATE'; end if;
    if v_registry.id is null then
      insert into public.student_registry(first_name, last_name, full_name, normalized_name, student_id, code_used_at)
        values(v_first, v_last, v_user.name, v_normalized, v_user.id, now()) returning * into v_registry;
    else
      update public.student_registry set student_id = v_user.id, code_used_at = now(), updated_at = now() where id = v_registry.id;
    end if;
  end if;
  insert into public.student_registry_assignments(registry_id, subject_id)
    select v_registry.id, subject_id from public.subject_enrollments where student_id = v_user.id and status = 'approved'
    on conflict do nothing;
  -- Legacy signup/manual creation may link a preassigned central identity. Join
  -- all its active classes as well as preserving the legacy advisory membership.
  insert into public.subject_enrollments(subject_id, teacher_id, student_id, section_id, section_name, status, decided_at)
    select s.id, s.teacher_id, v_user.id, sec.id, coalesce(sec.name, ''), 'approved', now()
    from public.student_registry_assignments a join public.subjects s on s.id = a.subject_id
    join public.users t on t.id = s.teacher_id
    left join public.sections sec on sec.id = coalesce(s.advisory_section_id, t.advisory_section_id)
    where a.registry_id = v_registry.id and s.is_active and t.role = 'teacher' and t.status = 'active'
      and coalesce(t.archive->>'isArchived', 'false') <> 'true'
    on conflict(subject_id, student_id) do update set status = 'approved', teacher_id = excluded.teacher_id,
      section_id = excluded.section_id, section_name = excluded.section_name, decided_at = now(), updated_at = now();
  delete from public.student_registry_sessions where registry_id = v_registry.id and completed_user_id is null;
  return null;
end; $$;
drop trigger if exists student_registry_user_sync on public.users;
create constraint trigger student_registry_user_sync after insert or update on public.users
  deferrable initially deferred for each row execute function public.student_registry_sync_user();

create or replace function public.student_registry_sync_legacy_roster()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_registry_id text; v_subject_id text; begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  if exists(select 1 from public.student_registry where normalized_name = new.normalized_name) then raise exception 'REGISTRY_DUPLICATE'; end if;
  insert into public.student_registry(first_name, last_name, full_name, normalized_name, created_by)
    values(case when position(' ' in new.normalized_name) = 0 then new.full_name else regexp_replace(new.full_name, ' [^ ]+$', '') end,
      case when position(' ' in new.normalized_name) = 0 then '' else regexp_replace(new.full_name, '^.* ', '') end,
      new.full_name, new.normalized_name, new.teacher_id) returning id into v_registry_id;
  select subject_id into v_subject_id from public.class_invitations where id = new.invitation_id;
  if v_subject_id is not null then
    insert into public.student_registry_assignments(registry_id, subject_id, assigned_by) values(v_registry_id, v_subject_id, new.teacher_id);
  end if;
  return new;
end; $$;
drop trigger if exists student_registry_legacy_roster_sync on public.class_registration_students;
create trigger student_registry_legacy_roster_sync before insert on public.class_registration_students
  for each row execute function public.student_registry_sync_legacy_roster();

create or replace function public.student_registry_sync_enrollment()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_registry_id text; begin
  if tg_op = 'DELETE' then
    select id into v_registry_id from public.student_registry where student_id = old.student_id;
    delete from public.student_registry_assignments where registry_id = v_registry_id and subject_id = old.subject_id;
    return old;
  end if;
  if tg_op = 'UPDATE' and (old.subject_id is distinct from new.subject_id or old.student_id is distinct from new.student_id) then
    select id into v_registry_id from public.student_registry where student_id = old.student_id;
    delete from public.student_registry_assignments where registry_id = v_registry_id and subject_id = old.subject_id;
  end if;
  select id into v_registry_id from public.student_registry where student_id = new.student_id;
  if v_registry_id is not null then
    if new.status = 'approved' then
      insert into public.student_registry_assignments(registry_id, subject_id, assigned_by)
        values(v_registry_id, new.subject_id, new.teacher_id) on conflict do nothing;
    else
      delete from public.student_registry_assignments where registry_id = v_registry_id and subject_id = new.subject_id;
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists student_registry_enrollment_sync on public.subject_enrollments;
create trigger student_registry_enrollment_sync after insert or update or delete on public.subject_enrollments
  for each row execute function public.student_registry_sync_enrollment();

-- Directory access exposes names and membership only. Registration credentials
-- and claims are never readable through a browser's anon/authenticated role.
create or replace function public.student_registry_can_read(p_registry_id text, p_subject_id text default null)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists(select 1 from public.users viewer where viewer.auth_user_id = auth.uid()
    and viewer.status = 'active' and coalesce(viewer.archive->>'isArchived', 'false') <> 'true'
    and (viewer.role = 'headteacher'
      or (viewer.role = 'student' and exists(select 1 from public.student_registry r where r.id = p_registry_id and r.student_id = viewer.id))
      or (viewer.role = 'teacher' and exists(select 1 from public.student_registry_assignments a
        join public.subjects s on s.id = a.subject_id where a.registry_id = p_registry_id
          and s.teacher_id = viewer.id and s.is_active and (p_subject_id is null or s.id = p_subject_id)))));
$$;
alter table public.student_registry enable row level security;
alter table public.student_registry_assignments enable row level security;
alter table public.student_registry_links enable row level security;
alter table public.student_registry_sessions enable row level security;
alter table public.student_registry_claims enable row level security;
revoke all on table public.student_registry, public.student_registry_assignments,
  public.student_registry_links, public.student_registry_sessions, public.student_registry_claims from public, anon, authenticated;
grant select, insert, update, delete on table public.student_registry, public.student_registry_assignments,
  public.student_registry_links, public.student_registry_sessions to service_role;
revoke update, delete on table public.student_registry_claims from service_role;
grant select, insert on table public.student_registry_claims to service_role;
grant select(id, first_name, last_name, full_name, normalized_name, student_id, created_at, updated_at)
  on table public.student_registry to authenticated;
grant select on table public.student_registry_assignments to authenticated;
drop policy if exists student_registry_directory_read on public.student_registry;
create policy student_registry_directory_read on public.student_registry for select to authenticated
  using(public.student_registry_can_read(id));
drop policy if exists student_registry_assignment_read on public.student_registry_assignments;
create policy student_registry_assignment_read on public.student_registry_assignments for select to authenticated
  using(public.student_registry_can_read(registry_id, subject_id));

do $$ declare v_signature text; begin
  foreach v_signature in array array[
    'public.student_registry_assert_headteacher(text)', 'public.student_registry_check_link(text)',
    'public.student_registry_check_session(text,text)', 'public.student_registry_assert_classes(text[])',
    'public.student_registry_owned_auth(uuid,text,text)',
    'public.student_registry_link(text,text,text,boolean,integer)', 'public.student_registry_import(text,jsonb)',
    'public.student_registry_code(text,text,text,text,boolean)', 'public.student_registry_assign(text,text[],text[])',
    'public.student_registry_verify(text,text,text,text)', 'public.student_registry_prepare_email(text,text,text,text,text)',
    'public.student_registry_verify_email(text,text,text,text,text,text)', 'public.student_registry_begin(text,text,text,text,text,text)',
    'public.student_registry_finish(text,text,uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', v_signature);
    execute format('grant execute on function %s to service_role', v_signature);
  end loop;
end; $$;
revoke all on function public.student_registry_sync_user(), public.student_registry_sync_legacy_roster(),
  public.student_registry_sync_enrollment() from public, anon, authenticated, service_role;
revoke all on function public.student_registry_can_read(text,text) from public, anon;
grant execute on function public.student_registry_can_read(text,text) to authenticated, service_role;

commit;
