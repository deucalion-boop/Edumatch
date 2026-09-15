alter table public.assessments
  add column if not exists allowed_submission_types jsonb not null default '["written","link","file"]'::jsonb,
  add column if not exists allow_resubmission boolean not null default true,
  add column if not exists allow_late_submissions boolean not null default false;

alter table public.submissions
  alter column submitted_at drop not null,
  add column if not exists is_late boolean not null default false,
  add column if not exists returned_at timestamptz;

alter table public.submissions drop constraint if exists submissions_status_check;
alter table public.submissions
  add constraint submissions_status_check check (
    status in (
      'in_progress', 'completed', 'auto_submitted', 'terminated',
      'returned_for_revision'
    )
  );

create index if not exists submissions_activity_review_idx
  on public.submissions (assessment_id, status, submitted_at desc);
