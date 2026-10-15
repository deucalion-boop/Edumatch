-- Limit Head Teacher class assignment changes to teachers in the same department.
-- Assignments made by other departments remain untouched.
begin;

create or replace function public.student_registry_assert_department_classes(
  p_subject_ids text[], p_department text
) returns void language plpgsql security definer set search_path = public, pg_temp
as $$ begin
  if p_department is null or btrim(p_department) = '' then raise exception 'ISSUER_UNAVAILABLE'; end if;
  if exists(
    select 1 from unnest(p_subject_ids) requested(id)
    left join public.subjects s on s.id = requested.id
    left join public.users u on u.id = s.teacher_id
    where s.id is null or not s.is_active or u.role <> 'teacher' or u.status <> 'active'
      or coalesce(u.archive->>'isArchived', 'false') = 'true'
      or u.department is distinct from p_department
  ) then raise exception 'CLASS_UNAVAILABLE'; end if;
end; $$;

create or replace function public.student_registry_assign(
  p_headteacher_id text, p_registry_ids text[], p_subject_ids text[]
) returns integer language plpgsql security definer set search_path = public, pg_temp
as $$ declare
  v_student public.student_registry%rowtype;
  v_department text;
begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  perform public.student_registry_assert_headteacher(p_headteacher_id);
  select department into v_department from public.users where id = p_headteacher_id;
  if p_registry_ids is null or cardinality(p_registry_ids) not between 1 and 1000
    or p_subject_ids is null or cardinality(p_subject_ids) > 500
    or exists(select 1 from unnest(p_registry_ids) x(id) where id is null)
    or exists(select 1 from unnest(p_subject_ids) x(id) where id is null)
    or (select count(distinct id) from unnest(p_registry_ids) x(id)) <> cardinality(p_registry_ids)
    or (select count(distinct id) from unnest(p_subject_ids) x(id)) <> cardinality(p_subject_ids) then raise exception 'INPUT_INVALID'; end if;
  if (select count(*) from public.student_registry where id = any(p_registry_ids)) <> cardinality(p_registry_ids) then raise exception 'REGISTRY_NOT_FOUND'; end if;
  perform public.student_registry_assert_department_classes(p_subject_ids, v_department);

  for v_student in select * from public.student_registry where id = any(p_registry_ids) order by id for update loop
    if v_student.student_id is not null then
      delete from public.subject_enrollments e
      using public.student_registry_assignments a, public.subjects s, public.users t
      where a.registry_id = v_student.id and a.subject_id = s.id and s.teacher_id = t.id
        and t.department = v_department and a.subject_id <> all(p_subject_ids)
        and e.subject_id = a.subject_id and e.student_id = v_student.student_id;
    end if;

    delete from public.student_registry_assignments a
    using public.subjects s, public.users t
    where a.registry_id = v_student.id and a.subject_id = s.id and s.teacher_id = t.id
      and t.department = v_department and a.subject_id <> all(p_subject_ids);

    insert into public.student_registry_assignments(registry_id, subject_id, assigned_by)
      select v_student.id, id, p_headteacher_id from unnest(p_subject_ids) selected(id) on conflict do nothing;
    if v_student.student_id is not null then
      insert into public.subject_enrollments(subject_id, teacher_id, student_id, section_id, section_name, status, decided_at)
        select s.id, s.teacher_id, v_student.student_id, sec.id, coalesce(sec.name, ''), 'approved', now()
        from public.subjects s join public.users t on t.id = s.teacher_id
        left join public.sections sec on sec.id = coalesce(s.advisory_section_id, t.advisory_section_id)
        where s.id = any(p_subject_ids)
        on conflict(subject_id, student_id) do update set status = 'approved', teacher_id = excluded.teacher_id,
          section_id = excluded.section_id, section_name = excluded.section_name, decided_at = now(), updated_at = now();
    end if;
  end loop;
  return cardinality(p_registry_ids);
end; $$;

revoke all on function public.student_registry_assert_department_classes(text[], text) from public, anon, authenticated;
revoke all on function public.student_registry_assign(text, text[], text[]) from public, anon, authenticated;
grant execute on function public.student_registry_assert_department_classes(text[], text) to service_role;
grant execute on function public.student_registry_assign(text, text[], text[]) to service_role;

commit;
