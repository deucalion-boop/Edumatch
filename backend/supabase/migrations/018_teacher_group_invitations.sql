-- A department group link can be shared with several teachers. Each email has
-- its own verification attempt counter and single-use registration proof.
begin;

alter table public.teacher_invitations add column if not exists is_group boolean not null default false;
alter table public.teacher_invitations add column if not exists registration_count integer not null default 0
  check (registration_count >= 0);
create unique index if not exists teacher_invitations_one_pending_group
  on public.teacher_invitations(headteacher_id, department) where is_group and status = 'pending';

create table if not exists public.teacher_invitation_registrations (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  invitation_id text not null references public.teacher_invitations(id) on delete cascade,
  email text not null check (email = lower(btrim(email))),
  token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  accepted_user_id text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  email_challenge_id text,
  verification_email text,
  email_code_hash text,
  email_code_expires_at timestamptz,
  email_code_sent_at timestamptz,
  email_code_attempts integer not null default 0 check (email_code_attempts between 0 and 5),
  verification_token_hash text,
  email_verified_at timestamptz,
  email_verified_expires_at timestamptz,
  unique(invitation_id, email)
);
alter table public.teacher_invitation_registrations enable row level security;
revoke all on table public.teacher_invitation_registrations from public, anon, authenticated;
grant select, insert, update, delete on table public.teacher_invitation_registrations to service_role;

create or replace function public.teacher_group_invitation_parent(p_token_hash text)
returns public.teacher_invitations language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_parent public.teacher_invitations%rowtype;
begin
  select * into v_parent from public.teacher_invitations where token_hash = p_token_hash for update;
  if v_parent.id is null or not v_parent.is_group then raise exception 'INVITATION_INVALID'; end if;
  if v_parent.status = 'revoked' then raise exception 'INVITATION_REVOKED'; end if;
  if v_parent.status <> 'pending' then raise exception 'INVITATION_INVALID'; end if;
  if v_parent.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;
  perform public.teacher_invitation_assert_issuer(v_parent.headteacher_id, v_parent.department);
  return v_parent;
end;
$$;

create or replace function public.create_teacher_group_invitation(
  p_headteacher_id text, p_id text, p_nonce text, p_token_hash text, p_expires_hours integer default 48
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_department text; v_parent public.teacher_invitations%rowtype;
begin
  -- Serializing creation by issuer makes repeated clicks and concurrent requests
  -- return one reusable group link rather than creating competing live links.
  perform pg_advisory_xact_lock(hashtextextended('edumatch-teacher-group:' || coalesce(p_headteacher_id, ''), 0));
  v_department := public.teacher_invitation_assert_issuer(p_headteacher_id);
  if p_id is null or char_length(p_id) not between 1 and 128
    or p_nonce is null or char_length(p_nonce) not between 16 and 128 or p_nonce !~ '^[A-Za-z0-9_-]+$'
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_expires_hours is null or p_expires_hours not between 1 and 48 then raise exception 'INPUT_INVALID'; end if;
  select * into v_parent from public.teacher_invitations
    where headteacher_id = p_headteacher_id and department = v_department and is_group and status = 'pending' for update;
  if v_parent.id is not null then
    if v_parent.expires_at > now() then return to_jsonb(v_parent); end if;
    -- The API derives the HMAC from the stable invitation ID and fresh nonce.
    if p_id <> v_parent.id or p_token_hash = v_parent.token_hash then raise exception 'INPUT_INVALID'; end if;
    delete from public.teacher_invitation_registrations where invitation_id = v_parent.id and status = 'pending';
    update public.teacher_invitations set token_nonce = p_nonce, token_hash = p_token_hash,
      expires_at = now() + make_interval(hours => p_expires_hours), updated_at = now(), last_renewed_at = now()
      where id = v_parent.id returning * into v_parent;
    return to_jsonb(v_parent);
  end if;
  insert into public.teacher_invitations(id, headteacher_id, department, is_group, token_nonce, token_hash, expires_at)
    values(p_id, p_headteacher_id, v_department, true, p_nonce, p_token_hash,
      now() + make_interval(hours => p_expires_hours)) returning * into v_parent;
  return to_jsonb(v_parent);
end;
$$;

create or replace function public.renew_teacher_group_invitation(
  p_headteacher_id text, p_invitation_id text, p_nonce text, p_token_hash text, p_expires_hours integer default 48
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_parent public.teacher_invitations%rowtype;
begin
  select * into v_parent from public.teacher_invitations
    where id = p_invitation_id and headteacher_id = p_headteacher_id and is_group for update;
  if v_parent.id is null then raise exception 'INVITATION_INVALID'; end if;
  perform public.teacher_invitation_assert_issuer(p_headteacher_id, v_parent.department);
  if v_parent.status = 'revoked' then raise exception 'INVITATION_REVOKED'; end if;
  if v_parent.status <> 'pending' then raise exception 'INVITATION_INVALID'; end if;
  if p_nonce is null or char_length(p_nonce) not between 16 and 128 or p_nonce !~ '^[A-Za-z0-9_-]+$'
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' or p_token_hash = v_parent.token_hash
    or p_expires_hours is null or p_expires_hours not between 1 and 48 then raise exception 'INPUT_INVALID'; end if;
  if v_parent.last_renewed_at > now() - interval '60 seconds' then raise exception 'INVITATION_COOLDOWN'; end if;
  delete from public.teacher_invitation_registrations where invitation_id = v_parent.id and status = 'pending';
  update public.teacher_invitations set token_nonce = p_nonce, token_hash = p_token_hash,
    expires_at = now() + make_interval(hours => p_expires_hours), last_renewed_at = now(), updated_at = now()
    where id = v_parent.id returning * into v_parent;
  return to_jsonb(v_parent);
end;
$$;

create or replace function public.revoke_teacher_group_invitation(p_headteacher_id text, p_invitation_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_parent public.teacher_invitations%rowtype;
begin
  select * into v_parent from public.teacher_invitations
    where id = p_invitation_id and headteacher_id = p_headteacher_id and is_group for update;
  if v_parent.id is null then raise exception 'INVITATION_INVALID'; end if;
  perform public.teacher_invitation_assert_issuer(p_headteacher_id, v_parent.department);
  if v_parent.status <> 'pending' and v_parent.status <> 'revoked' then raise exception 'INVITATION_INVALID'; end if;
  delete from public.teacher_invitation_registrations where invitation_id = v_parent.id and status = 'pending';
  update public.teacher_invitations set status = 'revoked', revoked_at = coalesce(revoked_at, now()), updated_at = now()
    where id = v_parent.id returning * into v_parent;
  return to_jsonb(v_parent);
end;
$$;

create or replace function public.prepare_teacher_group_email(
  p_token_hash text, p_email text, p_code_hash text, p_challenge_id text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_parent public.teacher_invitations%rowtype; v_claim public.teacher_invitation_registrations%rowtype;
  v_email text := lower(btrim(p_email));
begin
  v_parent := public.teacher_group_invitation_parent(p_token_hash);
  if not public.teacher_invitation_valid_email(v_email)
    or p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$'
    or p_challenge_id is null or char_length(p_challenge_id) not between 16 and 128
    or p_challenge_id !~ '^[A-Za-z0-9_-]+$' then raise exception 'INPUT_INVALID'; end if;
  if exists(select 1 from public.users where lower(email) = v_email) then raise exception 'EMAIL_TAKEN'; end if;
  select * into v_claim from public.teacher_invitation_registrations
    where invitation_id = v_parent.id and email = v_email for update;
  if v_claim.status = 'accepted' then raise exception 'EMAIL_TAKEN'; end if;
  if v_claim.token_hash = p_token_hash and v_claim.email_code_sent_at > now() - interval '60 seconds' then
    raise exception 'INVITATION_COOLDOWN';
  end if;
  insert into public.teacher_invitation_registrations(invitation_id, email, token_hash,
    email_challenge_id, verification_email, email_code_hash, email_code_expires_at, email_code_sent_at)
    values(v_parent.id, v_email, p_token_hash, p_challenge_id, v_email, p_code_hash,
      least(now() + interval '10 minutes', v_parent.expires_at), now())
    on conflict(invitation_id, email) do update set token_hash = excluded.token_hash,
      email_challenge_id = excluded.email_challenge_id, verification_email = excluded.verification_email,
      email_code_hash = excluded.email_code_hash, email_code_expires_at = excluded.email_code_expires_at,
      email_code_sent_at = now(), email_code_attempts = 0, verification_token_hash = null,
      email_verified_at = null, email_verified_expires_at = null, updated_at = now()
    returning * into v_claim;
  return to_jsonb(v_claim);
end;
$$;

create or replace function public.verify_teacher_group_email(
  p_token_hash text, p_email text, p_challenge_id text, p_code_hash text, p_verification_hash text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_parent public.teacher_invitations%rowtype; v_claim public.teacher_invitation_registrations%rowtype;
  v_email text := lower(btrim(p_email)); v_expires_at timestamptz;
begin
  v_parent := public.teacher_group_invitation_parent(p_token_hash);
  if not public.teacher_invitation_valid_email(v_email)
    or p_verification_hash is null or p_verification_hash !~ '^[a-f0-9]{64}$' then raise exception 'INPUT_INVALID'; end if;
  select * into v_claim from public.teacher_invitation_registrations
    where invitation_id = v_parent.id and email = v_email for update;
  if v_claim.status = 'accepted' then raise exception 'EMAIL_TAKEN'; end if;
  if v_claim.id is null or v_claim.token_hash is distinct from p_token_hash then
    return jsonb_build_object('verified', false, 'code', 'EMAIL_CODE_EXPIRED');
  end if;
  if v_claim.email_code_attempts >= 5 then return jsonb_build_object('verified', false, 'code', 'EMAIL_CODE_LOCKED'); end if;
  if v_claim.email_code_expires_at is null or v_claim.email_code_expires_at <= now() then
    return jsonb_build_object('verified', false, 'code', 'EMAIL_CODE_EXPIRED');
  end if;
  if p_challenge_id is null or p_challenge_id is distinct from v_claim.email_challenge_id
    or p_code_hash is null or p_code_hash is distinct from v_claim.email_code_hash then
    update public.teacher_invitation_registrations set email_code_attempts = email_code_attempts + 1, updated_at = now()
      where id = v_claim.id;
    return jsonb_build_object('verified', false, 'code',
      case when v_claim.email_code_attempts + 1 >= 5 then 'EMAIL_CODE_LOCKED' else 'EMAIL_CODE_INVALID' end);
  end if;
  v_expires_at := least(now() + interval '15 minutes', v_parent.expires_at);
  update public.teacher_invitation_registrations set verification_token_hash = p_verification_hash,
    email_verified_at = now(), email_verified_expires_at = v_expires_at, email_code_hash = null,
    email_code_expires_at = null, updated_at = now() where id = v_claim.id;
  return jsonb_build_object('verified', true, 'email', v_email, 'expiresAt', v_expires_at);
end;
$$;

create or replace function public.register_teacher_group_invitation(
  p_token_hash text, p_name text, p_email text, p_username text, p_password_hash text, p_verification_hash text
) returns text language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_parent public.teacher_invitations%rowtype; v_claim public.teacher_invitation_registrations%rowtype;
  v_email text := lower(btrim(p_email)); v_user_id text := replace(gen_random_uuid()::text, '-', '');
begin
  v_parent := public.teacher_group_invitation_parent(p_token_hash);
  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 or p_name ~ '[[:cntrl:]]'
    or not public.teacher_invitation_valid_email(v_email)
    or p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$'
    or p_password_hash is null or p_password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$' then raise exception 'INPUT_INVALID'; end if;
  select * into v_claim from public.teacher_invitation_registrations
    where invitation_id = v_parent.id and email = v_email for update;
  if v_claim.status = 'accepted' then raise exception 'EMAIL_TAKEN'; end if;
  if v_claim.id is null or v_claim.token_hash is distinct from p_token_hash
    or p_verification_hash is null or p_verification_hash is distinct from v_claim.verification_token_hash
    or v_email is distinct from v_claim.verification_email or v_claim.email_verified_at is null
    or v_claim.email_verified_expires_at is null or v_claim.email_verified_expires_at <= now() then
    raise exception 'EMAIL_VERIFICATION_REQUIRED';
  end if;
  if exists(select 1 from public.users where lower(username) = lower(p_username)) then raise exception 'USERNAME_TAKEN'; end if;
  if exists(select 1 from public.users where lower(email) = v_email) then raise exception 'EMAIL_TAKEN'; end if;
  insert into public.users(id, name, email, username, password_hash, role, status, managed_by, department, subject,
    force_password_change) values(v_user_id, btrim(p_name), v_email, p_username, p_password_hash,
      'teacher', 'active', v_parent.headteacher_id, v_parent.department, v_parent.department, false);
  update public.teacher_invitation_registrations set status = 'accepted', accepted_at = now(), accepted_user_id = v_user_id,
    email_challenge_id = null, verification_email = null, email_code_hash = null, email_code_expires_at = null,
    email_code_sent_at = null, email_code_attempts = 0, verification_token_hash = null,
    email_verified_at = null, email_verified_expires_at = null, updated_at = now() where id = v_claim.id;
  update public.teacher_invitations set registration_count = registration_count + 1, updated_at = now() where id = v_parent.id;
  return v_user_id;
end;
$$;

-- Preserve the existing individual RPC names while preventing them from treating
-- a reusable group link as a single-use invitation. Internal implementations are
-- executable only by the security-definer wrappers' database owner.
do $$
begin
  if to_regprocedure('public.teacher_individual_renew(text,text,text,text,integer)') is null then
    alter function public.renew_teacher_invitation(text,text,text,text,integer) rename to teacher_individual_renew;
    alter function public.revoke_teacher_invitation(text,text) rename to teacher_individual_revoke;
    alter function public.prepare_teacher_invitation_email(text,text,text,text) rename to teacher_individual_prepare;
    alter function public.verify_teacher_invitation_email(text,text,text,text,text) rename to teacher_individual_verify;
    alter function public.register_teacher_invitation(text,text,text,text,text,text) rename to teacher_individual_register;
  end if;
end;
$$;
create or replace function public.teacher_invitation_assert_individual(p_invitation_id text, p_token_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_group boolean;
begin
  select is_group into v_group from public.teacher_invitations
    where (p_invitation_id is not null and id = p_invitation_id)
      or (p_token_hash is not null and token_hash = p_token_hash) for update;
  if v_group then raise exception 'INVITATION_INVALID'; end if;
end;
$$;
create or replace function public.renew_teacher_invitation(
  p_headteacher_id text, p_invitation_id text, p_nonce text, p_token_hash text, p_expires_hours integer default 48
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ begin
  perform public.teacher_invitation_assert_individual(p_invitation_id, null);
  return public.teacher_individual_renew(p_headteacher_id, p_invitation_id, p_nonce, p_token_hash, p_expires_hours);
end; $$;
create or replace function public.revoke_teacher_invitation(p_headteacher_id text, p_invitation_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ begin
  perform public.teacher_invitation_assert_individual(p_invitation_id, null);
  return public.teacher_individual_revoke(p_headteacher_id, p_invitation_id);
end; $$;
create or replace function public.prepare_teacher_invitation_email(p_token_hash text, p_email text, p_code_hash text, p_challenge_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ begin
  perform public.teacher_invitation_assert_individual(null, p_token_hash);
  return public.teacher_individual_prepare(p_token_hash, p_email, p_code_hash, p_challenge_id);
end; $$;
create or replace function public.verify_teacher_invitation_email(
  p_token_hash text, p_email text, p_challenge_id text, p_code_hash text, p_verification_hash text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$ begin
  perform public.teacher_invitation_assert_individual(null, p_token_hash);
  return public.teacher_individual_verify(p_token_hash, p_email, p_challenge_id, p_code_hash, p_verification_hash);
end; $$;
create or replace function public.register_teacher_invitation(
  p_token_hash text, p_name text, p_email text, p_username text, p_password_hash text, p_verification_hash text
) returns text language plpgsql security definer set search_path = public, pg_temp
as $$ begin
  perform public.teacher_invitation_assert_individual(null, p_token_hash);
  return public.teacher_individual_register(p_token_hash, p_name, p_email, p_username, p_password_hash, p_verification_hash);
end; $$;

revoke all on function public.teacher_individual_renew(text,text,text,text,integer) from public, anon, authenticated, service_role;
revoke all on function public.teacher_individual_revoke(text,text) from public, anon, authenticated, service_role;
revoke all on function public.teacher_individual_prepare(text,text,text,text) from public, anon, authenticated, service_role;
revoke all on function public.teacher_individual_verify(text,text,text,text,text) from public, anon, authenticated, service_role;
revoke all on function public.teacher_individual_register(text,text,text,text,text,text) from public, anon, authenticated, service_role;
revoke all on function public.teacher_invitation_assert_individual(text,text) from public, anon, authenticated, service_role;

do $$
declare v_signature text;
begin
  foreach v_signature in array array[
    'public.teacher_group_invitation_parent(text)',
    'public.create_teacher_group_invitation(text,text,text,text,integer)',
    'public.renew_teacher_group_invitation(text,text,text,text,integer)',
    'public.revoke_teacher_group_invitation(text,text)',
    'public.prepare_teacher_group_email(text,text,text,text)',
    'public.verify_teacher_group_email(text,text,text,text,text)',
    'public.register_teacher_group_invitation(text,text,text,text,text,text)',
    'public.renew_teacher_invitation(text,text,text,text,integer)',
    'public.revoke_teacher_invitation(text,text)',
    'public.prepare_teacher_invitation_email(text,text,text,text)',
    'public.verify_teacher_invitation_email(text,text,text,text,text)',
    'public.register_teacher_invitation(text,text,text,text,text,text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', v_signature);
    execute format('grant execute on function %s to service_role', v_signature);
  end loop;
end;
$$;

commit;
