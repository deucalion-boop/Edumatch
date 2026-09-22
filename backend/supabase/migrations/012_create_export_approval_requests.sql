-- Replace the legacy MongoDB export-approval queue with Supabase persistence.

create table if not exists public.export_approval_requests (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  request_type text not null,
  request_signature text not null check (char_length(request_signature) <= 128),
  requester_id text references public.users(id) on delete set null,
  requester_role text not null,
  requester_name text not null check (char_length(requester_name) <= 160),
  format text not null default 'pdf',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'fulfilled', 'expired')),
  filters jsonb not null default '{}'::jsonb,
  student_ids text[] not null default '{}',
  student_count integer not null default 0 check (student_count >= 0),
  reviewer_id text references public.users(id) on delete set null,
  reviewer_name text not null default '' check (char_length(reviewer_name) <= 160),
  review_note text not null default '' check (char_length(review_note) <= 500),
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  fulfilled_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists export_approval_requests_type_status_created_idx
  on public.export_approval_requests (request_type, status, created_at desc);
create index if not exists export_approval_requests_requester_signature_idx
  on public.export_approval_requests (requester_id, request_signature, created_at desc);

alter table public.export_approval_requests enable row level security;
revoke all on table public.export_approval_requests from anon, authenticated;
