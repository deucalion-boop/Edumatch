-- Teacher invitations stay separate from accounts until verified registration.
-- Only the API service role may access tokens, verification state or these RPCs.
begin;

create table if not exists public.teacher_invitations (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  headteacher_id text not null references public.users(id) on delete cascade,
  department text not null check (btrim(department) <> ''),
  name text not null default '',
  email text not null default '',
  token_nonce text not null,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  last_renewed_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz,
  accepted_user_id text references public.users(id) on delete set null,
  delivery_status text not null default 'not_sent' check (delivery_status in ('not_sent', 'sent', 'failed')),
  email_sent_at timestamptz,
  email_challenge_id text,
  verification_email text,
  email_code_hash text,
  email_code_expires_at timestamptz,
  email_code_sent_at timestamptz,
  email_code_attempts integer not null default 0 check (email_code_attempts between 0 and 5),
  verification_token_hash text,
  email_verified_at timestamptz,
  email_verified_expires_at timestamptz
);
create index if not exists teacher_invitations_owner_created_idx
  on public.teacher_invitations(headteacher_id, created_at desc);
alter table public.teacher_invitations enable row level security;
revoke all on table public.teacher_invitations from public, anon, authenticated;
grant select, insert, update, delete on table public.teacher_invitations to service_role;

create or replace function public.teacher_invitation_valid_email(p_email text)
returns boolean language sql immutable set search_path = public, pg_temp
as $$
  select coalesce(char_length(p_email) between 3 and 254
    and char_length(split_part(p_email, '@', 1)) between 1 and 64
    and p_email ~ '^[ -~]+$'
    and p_email ~ '^[a-z0-9!#$%&''*+/=?^_`{|}~-]+([.][a-z0-9!#$%&''*+/=?^_`{|}~-]+)*@([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?[.])+[a-z]{2,63}$', false);
$$;

create or replace function public.teacher_invitation_assert_issuer(p_headteacher_id text, p_department text default null)
returns text language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_issuer public.users%rowtype;
begin
  select * into v_issuer from public.users where id = p_headteacher_id for share;
  if v_issuer.id is null or v_issuer.role <> 'headteacher' or v_issuer.status <> 'active'
    or coalesce(v_issuer.archive->>'isArchived', 'false') = 'true'
    or btrim(v_issuer.department) = ''
    or (p_department is not null and v_issuer.department is distinct from p_department) then
    raise exception 'ISSUER_UNAVAILABLE';
  end if;
  return v_issuer.department;
end;
$$;

create or replace function public.create_teacher_invitation(
  p_headteacher_id text, p_id text, p_nonce text, p_token_hash text,
  p_name text, p_email text, p_expires_hours integer default 48
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_department text; v_invitation public.teacher_invitations%rowtype;
begin
  v_department := public.teacher_invitation_assert_issuer(p_headteacher_id);
  if p_id is null or char_length(p_id) not between 1 and 128
    or p_nonce is null or char_length(p_nonce) not between 16 and 128 or p_nonce !~ '^[A-Za-z0-9_-]+$'
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$'
    or p_name is null or char_length(btrim(p_name)) > 100 or p_name ~ '[[:cntrl:]]'
    or p_email is null or (p_email <> '' and not public.teacher_invitation_valid_email(lower(btrim(p_email))))
    or p_expires_hours is null or p_expires_hours not between 1 and 48 then raise exception 'INPUT_INVALID'; end if;
  if p_email <> '' and exists(select 1 from public.users where lower(email) = lower(btrim(p_email))) then
    raise exception 'EMAIL_TAKEN';
  end if;
  insert into public.teacher_invitations(id, headteacher_id, department, name, email, token_nonce, token_hash, expires_at)
    values(p_id, p_headteacher_id, v_department, btrim(p_name), lower(btrim(p_email)), p_nonce, p_token_hash,
      now() + make_interval(hours => p_expires_hours)) returning * into v_invitation;
  return to_jsonb(v_invitation);
end;
$$;

create or replace function public.renew_teacher_invitation(
  p_headteacher_id text, p_invitation_id text, p_nonce text, p_token_hash text, p_expires_hours integer default 48
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_invitation public.teacher_invitations%rowtype;
begin
  select * into v_invitation from public.teacher_invitations
    where id = p_invitation_id and headteacher_id = p_headteacher_id for update;
  if v_invitation.id is null then raise exception 'INVITATION_INVALID'; end if;
  perform public.teacher_invitation_assert_issuer(p_headteacher_id, v_invitation.department);
  if v_invitation.status = 'accepted' then raise exception 'INVITATION_ACCEPTED'; end if;
  if v_invitation.status = 'revoked' then raise exception 'INVITATION_REVOKED'; end if;
  if p_nonce is null or char_length(p_nonce) not between 16 and 128 or p_nonce !~ '^[A-Za-z0-9_-]+$'
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' or p_token_hash = v_invitation.token_hash
    or p_expires_hours is null or p_expires_hours not between 1 and 48 then raise exception 'INPUT_INVALID'; end if;
  if v_invitation.last_renewed_at > now() - interval '60 seconds' then raise exception 'INVITATION_COOLDOWN'; end if;
  update public.teacher_invitations set token_nonce = p_nonce, token_hash = p_token_hash,
    expires_at = now() + make_interval(hours => p_expires_hours), last_renewed_at = now(), updated_at = now(),
    delivery_status = 'not_sent', email_sent_at = null, email_challenge_id = null, verification_email = null,
    email_code_hash = null, email_code_expires_at = null, email_code_sent_at = null, email_code_attempts = 0,
    verification_token_hash = null, email_verified_at = null, email_verified_expires_at = null
    where id = v_invitation.id returning * into v_invitation;
  return to_jsonb(v_invitation);
end;
$$;

create or replace function public.revoke_teacher_invitation(p_headteacher_id text, p_invitation_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_invitation public.teacher_invitations%rowtype;
begin
  select * into v_invitation from public.teacher_invitations
    where id = p_invitation_id and headteacher_id = p_headteacher_id for update;
  if v_invitation.id is null then raise exception 'INVITATION_INVALID'; end if;
  perform public.teacher_invitation_assert_issuer(p_headteacher_id, v_invitation.department);
  if v_invitation.status = 'accepted' then raise exception 'INVITATION_ACCEPTED'; end if;
  update public.teacher_invitations set status = 'revoked', revoked_at = coalesce(revoked_at, now()), updated_at = now(),
    email_challenge_id = null, verification_email = null, email_code_hash = null, email_code_expires_at = null,
    email_code_sent_at = null, email_code_attempts = 0, verification_token_hash = null,
    email_verified_at = null, email_verified_expires_at = null
    where id = v_invitation.id returning * into v_invitation;
  return to_jsonb(v_invitation);
end;
$$;

create or replace function public.prepare_teacher_invitation_email(
  p_token_hash text, p_email text, p_code_hash text, p_challenge_id text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_invitation public.teacher_invitations%rowtype; v_email text := lower(btrim(p_email));
begin
  select * into v_invitation from public.teacher_invitations where token_hash = p_token_hash for update;
  if v_invitation.id is null then raise exception 'INVITATION_INVALID'; end if;
  if v_invitation.status = 'accepted' then raise exception 'INVITATION_ACCEPTED'; end if;
  if v_invitation.status = 'revoked' then raise exception 'INVITATION_REVOKED'; end if;
  if v_invitation.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;
  perform public.teacher_invitation_assert_issuer(v_invitation.headteacher_id, v_invitation.department);
  if not public.teacher_invitation_valid_email(v_email)
    or p_code_hash is null or p_code_hash !~ '^[a-f0-9]{64}$'
    or p_challenge_id is null or char_length(p_challenge_id) not between 16 and 128
    or p_challenge_id !~ '^[A-Za-z0-9_-]+$' then raise exception 'INPUT_INVALID'; end if;
  if v_invitation.email <> '' and v_invitation.email <> v_email then raise exception 'EMAIL_MISMATCH'; end if;
  if exists(select 1 from public.users where lower(email) = v_email) then raise exception 'EMAIL_TAKEN'; end if;
  if v_invitation.email_code_sent_at > now() - interval '60 seconds' then raise exception 'INVITATION_COOLDOWN'; end if;
  update public.teacher_invitations set email_challenge_id = p_challenge_id, verification_email = v_email,
    email_code_hash = p_code_hash, email_code_expires_at = least(now() + interval '10 minutes', expires_at),
    email_code_sent_at = now(), email_code_attempts = 0, verification_token_hash = null,
    email_verified_at = null, email_verified_expires_at = null, updated_at = now()
    where id = v_invitation.id returning * into v_invitation;
  return to_jsonb(v_invitation);
end;
$$;

create or replace function public.verify_teacher_invitation_email(
  p_token_hash text, p_email text, p_challenge_id text, p_code_hash text, p_verification_hash text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_invitation public.teacher_invitations%rowtype; v_email text := lower(btrim(p_email));
  v_expires_at timestamptz;
begin
  select * into v_invitation from public.teacher_invitations where token_hash = p_token_hash for update;
  if v_invitation.id is null then raise exception 'INVITATION_INVALID'; end if;
  if v_invitation.status = 'accepted' then raise exception 'INVITATION_ACCEPTED'; end if;
  if v_invitation.status = 'revoked' then raise exception 'INVITATION_REVOKED'; end if;
  if v_invitation.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;
  perform public.teacher_invitation_assert_issuer(v_invitation.headteacher_id, v_invitation.department);
  if not public.teacher_invitation_valid_email(v_email)
    or p_verification_hash is null or p_verification_hash !~ '^[a-f0-9]{64}$' then raise exception 'INPUT_INVALID'; end if;
  if v_invitation.email <> '' and v_invitation.email <> v_email then raise exception 'EMAIL_MISMATCH'; end if;
  if v_invitation.email_code_attempts >= 5 then return jsonb_build_object('verified', false, 'code', 'EMAIL_CODE_LOCKED'); end if;
  if v_invitation.email_code_expires_at is null or v_invitation.email_code_expires_at <= now() then
    return jsonb_build_object('verified', false, 'code', 'EMAIL_CODE_EXPIRED');
  end if;
  if p_challenge_id is null or p_challenge_id is distinct from v_invitation.email_challenge_id
    or v_email is distinct from v_invitation.verification_email
    or p_code_hash is null or p_code_hash is distinct from v_invitation.email_code_hash then
    update public.teacher_invitations set email_code_attempts = email_code_attempts + 1, updated_at = now()
      where id = v_invitation.id;
    return jsonb_build_object('verified', false, 'code',
      case when v_invitation.email_code_attempts + 1 >= 5 then 'EMAIL_CODE_LOCKED' else 'EMAIL_CODE_INVALID' end);
  end if;
  v_expires_at := least(now() + interval '15 minutes', v_invitation.expires_at);
  update public.teacher_invitations set verification_token_hash = p_verification_hash,
    email_verified_at = now(), email_verified_expires_at = v_expires_at, email_code_hash = null,
    email_code_expires_at = null, updated_at = now() where id = v_invitation.id;
  return jsonb_build_object('verified', true, 'email', v_email, 'expiresAt', v_expires_at);
end;
$$;

create or replace function public.register_teacher_invitation(
  p_token_hash text, p_name text, p_email text, p_username text, p_password_hash text, p_verification_hash text
) returns text language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_invitation public.teacher_invitations%rowtype; v_email text := lower(btrim(p_email));
  v_user_id text := replace(gen_random_uuid()::text, '-', '');
begin
  select * into v_invitation from public.teacher_invitations where token_hash = p_token_hash for update;
  if v_invitation.id is null then raise exception 'INVITATION_INVALID'; end if;
  if v_invitation.status = 'accepted' then raise exception 'INVITATION_ACCEPTED'; end if;
  if v_invitation.status = 'revoked' then raise exception 'INVITATION_REVOKED'; end if;
  if v_invitation.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;
  perform public.teacher_invitation_assert_issuer(v_invitation.headteacher_id, v_invitation.department);
  if p_name is null or char_length(btrim(p_name)) not between 1 and 100 or p_name ~ '[[:cntrl:]]'
    or not public.teacher_invitation_valid_email(v_email)
    or p_username is null or p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$'
    or p_password_hash is null or p_password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$' then raise exception 'INPUT_INVALID'; end if;
  if v_invitation.email <> '' and v_invitation.email <> v_email then raise exception 'EMAIL_MISMATCH'; end if;
  if p_verification_hash is null or p_verification_hash is distinct from v_invitation.verification_token_hash
    or v_email is distinct from v_invitation.verification_email or v_invitation.email_verified_at is null
    or v_invitation.email_verified_expires_at is null or v_invitation.email_verified_expires_at <= now() then
    raise exception 'EMAIL_VERIFICATION_REQUIRED';
  end if;
  if exists(select 1 from public.users where lower(username) = lower(p_username)) then raise exception 'USERNAME_TAKEN'; end if;
  if exists(select 1 from public.users where lower(email) = v_email) then raise exception 'EMAIL_TAKEN'; end if;
  insert into public.users(id, name, email, username, password_hash, role, status, managed_by, department, subject,
    force_password_change) values(v_user_id, btrim(p_name), v_email, p_username, p_password_hash,
      'teacher', 'active', v_invitation.headteacher_id, v_invitation.department, v_invitation.department, false);
  update public.teacher_invitations set status = 'accepted', accepted_at = now(), accepted_user_id = v_user_id,
    email_challenge_id = null, verification_email = null, email_code_hash = null, email_code_expires_at = null,
    email_code_sent_at = null, email_code_attempts = 0, verification_token_hash = null,
    email_verified_at = null, email_verified_expires_at = null, updated_at = now() where id = v_invitation.id;
  return v_user_id;
end;
$$;

revoke all on function public.teacher_invitation_valid_email(text) from public, anon, authenticated;
revoke all on function public.teacher_invitation_assert_issuer(text, text) from public, anon, authenticated;
revoke all on function public.create_teacher_invitation(text, text, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.renew_teacher_invitation(text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.revoke_teacher_invitation(text, text) from public, anon, authenticated;
revoke all on function public.prepare_teacher_invitation_email(text, text, text, text) from public, anon, authenticated;
revoke all on function public.verify_teacher_invitation_email(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.register_teacher_invitation(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.teacher_invitation_valid_email(text) to service_role;
grant execute on function public.teacher_invitation_assert_issuer(text, text) to service_role;
grant execute on function public.create_teacher_invitation(text, text, text, text, text, text, integer) to service_role;
grant execute on function public.renew_teacher_invitation(text, text, text, text, integer) to service_role;
grant execute on function public.revoke_teacher_invitation(text, text) to service_role;
grant execute on function public.prepare_teacher_invitation_email(text, text, text, text) to service_role;
grant execute on function public.verify_teacher_invitation_email(text, text, text, text, text) to service_role;
grant execute on function public.register_teacher_invitation(text, text, text, text, text, text) to service_role;

commit;
