create table if not exists public.sections (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  name text not null unique,
  is_active boolean not null default true,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sections_active_name_idx
  on public.sections (is_active, name);

create unique index if not exists users_advisory_section_unique
  on public.users (advisory_section_id)
  where advisory_section_id is not null and advisory_section_id <> '';

alter table public.sections enable row level security;
revoke all on table public.sections from anon, authenticated;
