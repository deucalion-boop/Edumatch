-- Multi-lesson assessment coverage. lesson_id remains the primary/legacy link
-- so existing progression rules and integrations continue to work.
alter table public.assessments
  add column if not exists lesson_ids text[] not null default '{}'::text[];

update public.assessments
set lesson_ids = array[lesson_id]
where lesson_id is not null
  and cardinality(lesson_ids) = 0;

create index if not exists assessments_lesson_ids_gin_idx
  on public.assessments using gin (lesson_ids);
