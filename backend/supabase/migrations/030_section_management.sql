alter table public.sections add column if not exists grade_level text not null default '10';
alter table public.sections add column if not exists strand text not null default '';
alter table public.sections add column if not exists school_year text not null default '2026-2027';
alter table public.sections add column if not exists capacity integer not null default 40;
alter table public.sections add constraint sections_capacity_valid check (capacity between 1 and 200);

alter table public.sections drop constraint if exists sections_name_key;
create unique index if not exists sections_year_grade_name_unique
  on public.sections (school_year, grade_level, lower(name));
create index if not exists sections_school_year_status_idx
  on public.sections (school_year, is_active, grade_level);

create or replace function public.enforce_section_capacity() returns trigger language plpgsql as $$
declare selected public.sections%rowtype; enrolled integer;
begin
  if new.role <> 'student' or new.section_id is null or new.section_id = ''
     or (tg_op = 'UPDATE' and new.section_id is not distinct from old.section_id and new.status is not distinct from old.status) then
    return new;
  end if;
  select * into selected from public.sections where id = new.section_id for update;
  if selected.id is null then raise exception 'SECTION_NOT_FOUND'; end if;
  if not selected.is_active then raise exception 'SECTION_ARCHIVED'; end if;
  if new.grade_level <> '' and selected.grade_level <> new.grade_level then raise exception 'SECTION_GRADE_MISMATCH'; end if;
  select count(*) into enrolled from public.users
    where role='student' and status='active' and section_id=new.section_id and id <> new.id;
  if new.status='active' and enrolled >= selected.capacity then raise exception 'SECTION_CAPACITY_EXCEEDED'; end if;
  return new;
end $$;
drop trigger if exists users_enforce_section_capacity on public.users;
create trigger users_enforce_section_capacity before insert or update of section_id,status,grade_level
  on public.users for each row execute function public.enforce_section_capacity();
