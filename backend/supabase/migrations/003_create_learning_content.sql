create table if not exists public.lessons (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  title text not null,
  description text not null,
  track text not null,
  subject text not null,
  subject_id text,
  subject_code text not null default '',
  subject_category text not null default '',
  pdf_path text not null,
  pdf_original_name text not null,
  attachments jsonb not null default '[]'::jsonb,
  created_by text not null references public.users(id) on delete cascade,
  published_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  lesson_id text references public.lessons(id) on delete set null,
  title text not null,
  exam_type text not null,
  subject text not null,
  subject_id text,
  subject_code text not null default '',
  subject_category text not null default 'Technical',
  difficulty text not null default 'medium',
  number_of_items integer not null check (number_of_items > 0),
  activity_points integer,
  exam_duration_minutes integer not null default 30,
  max_violations integer not null default 3,
  violation_action text not null default 'auto-submit',
  submission_deadline timestamptz,
  challenge_description text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  assessment_mode text not null default 'activity',
  grading_period text not null default '',
  counts_toward_recommendation boolean not null default false,
  assignment_scope text not null default 'handled_class',
  assigned_student_ids jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  created_by text not null references public.users(id) on delete cascade,
  published_by text references public.users(id) on delete set null,
  last_modified_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_created_by_created_at_idx on public.lessons (created_by, created_at desc);
create index if not exists lessons_subject_id_idx on public.lessons (subject_id);
create unique index if not exists lessons_owner_subject_title_unique
  on public.lessons (created_by, coalesce(subject_id, ''), lower(title));

create index if not exists assessments_created_by_created_at_idx on public.assessments (created_by, created_at desc);
create index if not exists assessments_lesson_id_idx on public.assessments (lesson_id);
create index if not exists assessments_subject_id_idx on public.assessments (subject_id);
create unique index if not exists assessments_owner_context_title_type_unique
  on public.assessments (created_by, coalesce(lesson_id, ''), coalesce(subject_id, ''), lower(title), exam_type);

alter table public.lessons enable row level security;
alter table public.assessments enable row level security;
revoke all on table public.lessons, public.assessments from anon, authenticated;
