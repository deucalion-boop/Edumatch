create table if not exists public.users (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  name text not null,
  email text not null,
  username text not null,
  password_hash text,
  role text not null check (role in ('admin', 'secretary', 'headteacher', 'teacher', 'student')),
  status text not null default 'active' check (status in ('pending', 'active', 'inactive', 'suspended')),
  strand text not null default '',
  subject text not null default '',
  department text not null default '',
  grade_level text not null default '',
  contact_number text not null default '',
  profile_image text not null default '',
  section_id text,
  advisory_section_id text,
  managed_by text references public.users(id) on delete set null,
  force_password_change boolean not null default false,
  temporary_password_issued_at timestamptz,
  has_completed_teacher_tour boolean not null default false,
  has_completed_student_tour boolean not null default false,
  failed_login_attempts integer not null default 0,
  lock_until timestamptz,
  last_login_at timestamptz,
  last_activity_at timestamptz,
  token_version integer not null default 0,
  invite jsonb not null default '{}'::jsonb,
  reset_password jsonb not null default '{}'::jsonb,
  enrollment jsonb not null default '{}'::jsonb,
  archive jsonb not null default '{"isArchived":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_unique on public.users (lower(email));
create unique index if not exists users_username_lower_unique on public.users (lower(username));
create index if not exists users_role_status_idx on public.users (role, status);
create index if not exists users_department_idx on public.users (department);
create unique index if not exists users_headteacher_department_unique
  on public.users (department)
  where role = 'headteacher' and department <> '';

alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;

create table if not exists public.sessions (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  user_id text not null references public.users(id) on delete cascade,
  token_id text not null unique,
  ip_address text not null default '',
  user_agent text not null default '',
  remember boolean not null default false,
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.otp_challenges (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  user_id text not null references public.users(id) on delete cascade,
  challenge_token_hash text not null unique,
  otp_hash text not null,
  remember boolean not null default false,
  ip_address text not null default '',
  user_agent text not null default '',
  failed_attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  user_id text references public.users(id) on delete set null,
  username text not null default '',
  name text not null default '',
  email text not null default '',
  role text not null default '',
  outcome text not null check (outcome in ('success', 'failed')),
  reason text not null default '',
  ip_address text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_token_idx on public.sessions (user_id, token_id);
create index if not exists otp_challenges_token_idx on public.otp_challenges (challenge_token_hash);
alter table public.sessions enable row level security;
alter table public.otp_challenges enable row level security;
alter table public.login_attempts enable row level security;
revoke all on table public.sessions, public.otp_challenges, public.login_attempts from anon, authenticated;
