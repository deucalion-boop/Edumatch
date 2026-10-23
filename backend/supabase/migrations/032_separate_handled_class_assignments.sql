alter table public.subjects
  add column if not exists handled_section_id text references public.sections(id) on delete set null,
  add column if not exists assignment_source text not null default 'teacher'
    check (assignment_source in ('teacher', 'headteacher', 'advisory')),
  add column if not exists assigned_by text references public.users(id) on delete set null;

create index if not exists subjects_handled_section_idx
  on public.subjects (handled_section_id, is_active);

create unique index if not exists subjects_headteacher_handled_class_unique
  on public.subjects (teacher_id, handled_section_id, lower(name))
  where handled_section_id is not null and assignment_source = 'headteacher' and is_active = true;

update public.subjects
set assignment_source = 'advisory'
where advisory_section_id is not null and assignment_source = 'teacher';
