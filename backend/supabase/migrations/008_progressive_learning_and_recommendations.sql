-- Progressive learning, essay audit data, and configurable subject grading.
-- Apply after 007_improve_activity_workflow.sql.

alter table public.assessments
  add column if not exists requires_lesson_completion boolean not null default true;

alter table public.submissions
  add column if not exists ai_evaluations jsonb not null default '[]'::jsonb,
  add column if not exists ai_score numeric,
  add column if not exists teacher_adjusted_score numeric,
  add column if not exists scoring_status text not null default 'final';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'submissions_scoring_status_check'
  ) then
    alter table public.submissions add constraint submissions_scoring_status_check
      check (scoring_status in ('final', 'ai_assisted', 'pending_teacher_review', 'teacher_approved', 'teacher_overridden'));
  end if;
end $$;

create table if not exists public.lesson_progress (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  student_id text not null references public.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent numeric not null default 0 check (progress_percent between 0 and 100),
  engagement_seconds integer not null default 0 check (engagement_seconds >= 0),
  reached_end boolean not null default false,
  started_at timestamptz,
  last_viewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create index if not exists lesson_progress_student_status_idx
  on public.lesson_progress (student_id, status, updated_at desc);
create index if not exists lesson_progress_lesson_idx
  on public.lesson_progress (lesson_id, status);

create table if not exists public.assessment_weights (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  subject_id text not null references public.subjects(id) on delete cascade,
  activity_weight numeric not null default 30 check (activity_weight between 0 and 100),
  quiz_weight numeric not null default 30 check (quiz_weight between 0 and 100),
  exam_weight numeric not null default 40 check (exam_weight between 0 and 100),
  minimum_evidence_count integer not null default 2 check (minimum_evidence_count >= 1),
  updated_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id),
  check (activity_weight + quiz_weight + exam_weight > 0)
);

alter table public.lesson_progress enable row level security;
alter table public.assessment_weights enable row level security;
revoke all on table public.lesson_progress, public.assessment_weights from anon, authenticated;

