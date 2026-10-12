create table if not exists public.school_announcements (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  event_key text not null unique,
  request_id text not null,
  sender_id text references public.users(id) on delete set null,
  sender_name text not null check (char_length(sender_name) <= 120),
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 5000),
  audience_roles text[] not null check (cardinality(audience_roles) > 0),
  urgent boolean not null default false,
  recipient_count integer not null default 0 check (recipient_count >= 0),
  recipient_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists school_announcements_created_idx
  on public.school_announcements (created_at desc);
alter table public.school_announcements enable row level security;
revoke all on table public.school_announcements from anon, authenticated;
