-- Durable student preferences and school-reviewed account actions.

create table if not exists public.student_settings (
  student_id text primary key references public.users(id) on delete cascade,
  notification_preferences jsonb not null default '{"announcements":true,"lessons":true,"deadlines":true,"results":true,"enrollment":true,"inApp":true}'::jsonb,
  learning_preferences jsonb not null default '{"deadlineReminder":"one-day"}'::jsonb,
  appearance jsonb not null default '{"theme":"system","textSize":"normal","highContrast":false,"reduceMotion":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_account_requests (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  student_id text references public.users(id) on delete set null,
  student_name text not null default '',
  student_email text not null default '',
  action text not null check (action in ('deactivate', 'delete')),
  reason text not null default '' check (char_length(reason) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  reviewer_id text references public.users(id) on delete set null,
  reviewer_note text not null default '' check (char_length(reviewer_note) <= 1000),
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists student_account_requests_one_pending_idx
  on public.student_account_requests (student_id)
  where status = 'pending';
create index if not exists student_account_requests_status_created_idx
  on public.student_account_requests (status, created_at desc);

alter table public.student_settings enable row level security;
alter table public.student_account_requests enable row level security;
revoke all on table public.student_settings, public.student_account_requests from anon, authenticated;
