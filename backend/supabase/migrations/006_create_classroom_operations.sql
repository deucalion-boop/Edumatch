create table if not exists public.subjects (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  name text not null,
  class_name text not null default '',
  code text not null unique,
  track text not null,
  subject_category text not null default '',
  department text not null default '',
  description text not null default '',
  teacher_id text not null references public.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subjects_teacher_class_unique
  on public.subjects (teacher_id, lower(name), lower(track), lower(class_name));
create index if not exists subjects_teacher_active_idx
  on public.subjects (teacher_id, is_active, created_at);

create table if not exists public.subject_enrollments (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  subject_id text not null references public.subjects(id) on delete cascade,
  teacher_id text not null references public.users(id) on delete cascade,
  student_id text not null references public.users(id) on delete cascade,
  section_id text references public.sections(id) on delete set null,
  section_name text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, student_id)
);

create index if not exists subject_enrollments_teacher_status_idx
  on public.subject_enrollments (teacher_id, status, created_at desc);
create index if not exists subject_enrollments_student_status_idx
  on public.subject_enrollments (student_id, status, created_at desc);

create table if not exists public.attendance_records (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  attendance_scope text not null default 'handled_class'
    check (attendance_scope in ('handled_class', 'advisory_class')),
  subject_id text references public.subjects(id) on delete cascade,
  section_id text references public.sections(id) on delete set null,
  teacher_id text not null references public.users(id) on delete cascade,
  date_key text not null,
  attendance_date timestamptz not null,
  subject_name text not null default '',
  subject_code text not null default '',
  class_name text not null default '',
  section_name text not null default '',
  track text not null default '',
  teacher_name text not null default '',
  teacher_subject text not null default '',
  teacher_department text not null default '',
  entries jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  is_locked boolean not null default false,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists attendance_handled_class_unique
  on public.attendance_records (attendance_scope, subject_id, date_key)
  where subject_id is not null;
create unique index if not exists attendance_advisory_class_unique
  on public.attendance_records (attendance_scope, teacher_id, section_id, date_key)
  where attendance_scope = 'advisory_class' and section_id is not null;
create index if not exists attendance_teacher_date_idx
  on public.attendance_records (teacher_id, date_key desc);

create table if not exists public.submissions (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  student_id text not null references public.users(id) on delete cascade,
  assessment_id text not null references public.assessments(id) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  score numeric not null default 0,
  total_points numeric not null default 0,
  submitted_at timestamptz default now(),
  started_at timestamptz,
  last_activity_at timestamptz,
  exam_duration_minutes integer not null default 30,
  violation_count integer not null default 0,
  activity_log jsonb not null default '[]'::jsonb,
  response_text text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  link_attachments jsonb not null default '[]'::jsonb,
  draft_saved_at timestamptz,
  graded_at timestamptz,
  grade_value numeric,
  teacher_feedback text not null default '',
  ai_evaluations jsonb not null default '[]'::jsonb,
  ai_score numeric,
  teacher_adjusted_score numeric,
  scoring_status text not null default 'final'
    check (scoring_status in ('final', 'ai_assisted', 'pending_teacher_review', 'teacher_approved', 'teacher_overridden')),
  is_late boolean not null default false,
  returned_at timestamptz,
  auto_submitted boolean not null default false,
  termination_reason text not null default '',
  status text not null default 'completed'
    check (status in ('in_progress', 'completed', 'auto_submitted', 'terminated', 'returned_for_revision')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, assessment_id)
);

create index if not exists submissions_assessment_updated_idx
  on public.submissions (assessment_id, updated_at desc);
create index if not exists submissions_student_updated_idx
  on public.submissions (student_id, updated_at desc);

create table if not exists public.lesson_progress (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  student_id text not null references public.users(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
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

create table if not exists public.recommendations (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  student_id text not null unique references public.users(id) on delete cascade,
  assessment_attempts jsonb not null default '[]'::jsonb,
  subject_performance jsonb not null default '[]'::jsonb,
  strand_scores jsonb not null default '{}'::jsonb,
  recommended_strand jsonb not null default '{}'::jsonb,
  recommendation_explanation text not null default '',
  last_reason text not null default '',
  records jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key default 'global',
  value jsonb not null default '{}'::jsonb,
  updated_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.export_approval_requests (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  request_type text not null,
  request_signature text not null,
  requester_id text not null references public.users(id) on delete cascade,
  requester_role text not null,
  requester_name text not null,
  format text not null default 'pdf',
  status text not null default 'pending',
  filters jsonb not null default '{}'::jsonb,
  student_ids jsonb not null default '[]'::jsonb,
  student_count integer not null default 0,
  reviewer_id text references public.users(id) on delete set null,
  reviewer_name text not null default '',
  review_note text not null default '',
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  fulfilled_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists export_requests_requester_created_idx
  on public.export_approval_requests (requester_id, request_type, created_at desc);
create index if not exists export_requests_status_created_idx
  on public.export_approval_requests (request_type, status, created_at desc);

alter table public.subjects enable row level security;
alter table public.subject_enrollments enable row level security;
alter table public.attendance_records enable row level security;
alter table public.submissions enable row level security;
alter table public.recommendations enable row level security;
alter table public.app_settings enable row level security;
alter table public.export_approval_requests enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assessment_weights enable row level security;

revoke all on table public.subjects, public.subject_enrollments,
  public.attendance_records, public.submissions, public.recommendations,
  public.app_settings, public.export_approval_requests from anon, authenticated;
revoke all on table public.lesson_progress, public.assessment_weights from anon, authenticated;
