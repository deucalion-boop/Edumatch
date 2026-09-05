create table if not exists public.admin_messages (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  sender_id text references public.users(id) on delete set null,
  sender_role text not null default 'admin',
  sender_name text not null,
  recipient_id text not null references public.users(id) on delete cascade,
  recipient_role text not null,
  subject text not null check (char_length(subject) <= 200),
  content text not null check (char_length(content) <= 5000),
  preview text not null check (char_length(preview) <= 220),
  urgent boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  recipient_id text not null references public.users(id) on delete cascade,
  recipient_role text not null,
  sender_id text references public.users(id) on delete set null,
  sender_role text not null default 'system',
  sender_name text not null default 'EduMatch' check (char_length(sender_name) <= 120),
  type text not null default 'user_update',
  title text not null check (char_length(title) <= 220),
  message text not null check (char_length(message) <= 400),
  subject text not null check (char_length(subject) <= 200),
  preview text not null check (char_length(preview) <= 220),
  urgent boolean not null default false,
  is_viewed boolean not null default false,
  is_cleared boolean not null default false,
  viewed_at timestamptz,
  message_id text references public.admin_messages(id) on delete set null,
  event_key text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipient_id, recipient_role, type, event_key)
);

create index if not exists admin_messages_recipient_created_idx
  on public.admin_messages (recipient_id, recipient_role, created_at desc);
create index if not exists notifications_recipient_feed_idx
  on public.notifications (recipient_id, recipient_role, is_cleared, urgent desc, created_at desc);
create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, recipient_role, is_viewed)
  where is_cleared = false;

alter table public.admin_messages enable row level security;
alter table public.notifications enable row level security;
revoke all on table public.admin_messages, public.notifications from anon, authenticated;
