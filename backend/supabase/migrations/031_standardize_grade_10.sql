begin;

alter table public.sections alter column grade_level set default 'Grade 10';

-- This school currently manages Grade 10 only. Normalize records created by
-- the earlier section-management migration, which stored the same grade as "10".
update public.sections
set grade_level = 'Grade 10', updated_at = now()
where lower(btrim(grade_level)) in ('10', 'grade 10');

-- Accept legacy student rows that may still contain "10", while keeping the
-- canonical stored value for both students and sections as "Grade 10".
create or replace function public.enforce_section_capacity() returns trigger language plpgsql as $$
declare selected public.sections%rowtype; enrolled integer;
begin
  if new.role <> 'student' or new.section_id is null or new.section_id = ''
     or (tg_op = 'UPDATE' and new.section_id is not distinct from old.section_id and new.status is not distinct from old.status
       and new.grade_level is not distinct from old.grade_level) then
    return new;
  end if;
  select * into selected from public.sections where id = new.section_id for update;
  if selected.id is null then raise exception 'SECTION_NOT_FOUND'; end if;
  if not selected.is_active then raise exception 'SECTION_ARCHIVED'; end if;
  if new.grade_level <> '' and
     regexp_replace(lower(btrim(selected.grade_level)), '^grade[[:space:]]*', '') <>
     regexp_replace(lower(btrim(new.grade_level)), '^grade[[:space:]]*', '') then
    raise exception 'SECTION_GRADE_MISMATCH';
  end if;
  select count(*) into enrolled from public.users
    where role = 'student' and status = 'active' and section_id = new.section_id and id <> new.id;
  if new.status = 'active' and enrolled >= selected.capacity then raise exception 'SECTION_CAPACITY_EXCEEDED'; end if;
  return new;
end $$;

commit;
