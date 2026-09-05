create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id text references public.users(id) on delete set null,
  actor_name text not null default '',
  actor_email text not null default '',
  actor_role text not null default '',
  actor_identifier text not null default '',
  category text not null default 'System',
  action_label text not null,
  method text not null,
  endpoint text not null,
  route_path text not null default '',
  target_id text not null default '',
  target_label text not null default '',
  succeeded boolean not null default false,
  status_code integer not null default 0,
  ip_address text not null default '',
  user_agent text not null default '',
  duration_ms integer not null default 0 check (duration_ms >= 0),
  metadata jsonb not null default '{"params":{},"query":{},"bodyKeys":[],"fileCount":0}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_category_created_idx on public.audit_logs (category, created_at desc);
create index if not exists audit_logs_succeeded_created_idx on public.audit_logs (succeeded, created_at desc);
create index if not exists audit_logs_method_created_idx on public.audit_logs (method, created_at desc);
create index if not exists audit_logs_actor_role_created_idx on public.audit_logs (actor_role, created_at desc);

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;
