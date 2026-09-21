-- Persist the complete P1/P2/P3 history for every enrolled subject.
-- Final grade is the arithmetic mean of the three grading periods and remains
-- null until all three period grades are available.

create table if not exists public.student_subject_grades (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  student_id text not null references public.users(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete cascade,
  subject_name text not null default '',
  subject_code text not null default '',
  subject_category text not null default '',
  p1_grade numeric check (p1_grade is null or p1_grade between 0 and 100),
  p2_grade numeric check (p2_grade is null or p2_grade between 0 and 100),
  p3_grade numeric check (p3_grade is null or p3_grade between 0 and 100),
  final_grade numeric check (final_grade is null or final_grade between 0 and 100),
  p1_source jsonb,
  p2_source jsonb,
  p3_source jsonb,
  completed_periods integer not null default 0 check (completed_periods between 0 and 3),
  latest_graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id)
);

create index if not exists student_subject_grades_student_idx
  on public.student_subject_grades (student_id, latest_graded_at desc);
create index if not exists student_subject_grades_subject_idx
  on public.student_subject_grades (subject_id, student_id);

alter table public.student_subject_grades enable row level security;
revoke all on table public.student_subject_grades from anon, authenticated;
