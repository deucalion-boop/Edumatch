-- Import students and assign their teacher class in one transaction.
begin;

create or replace function public.student_registry_import_assigned(
  p_headteacher_id text, p_records jsonb, p_subject_id text
) returns integer language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_department text;
  v_registry_ids text[];
  v_imported integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  perform public.student_registry_assert_headteacher(p_headteacher_id);
  select department into v_department from public.users where id = p_headteacher_id;

  if p_subject_id is null or p_subject_id !~ '^[A-Za-z0-9_-]{1,128}$'
    or p_records is null or jsonb_typeof(p_records) <> 'array'
    or jsonb_array_length(p_records) not between 1 and 1000 then
    raise exception 'INPUT_INVALID';
  end if;

  perform public.student_registry_assert_department_classes(array[p_subject_id], v_department);
  select array_agg(value->>'id' order by value->>'id')
    into v_registry_ids from jsonb_array_elements(p_records);

  v_imported := public.student_registry_import(p_headteacher_id, p_records);
  perform public.student_registry_assign(p_headteacher_id, v_registry_ids, array[p_subject_id]);
  return v_imported;
end;
$$;

revoke all on function public.student_registry_import_assigned(text, jsonb, text) from public, anon, authenticated;
grant execute on function public.student_registry_import_assigned(text, jsonb, text) to service_role;

commit;
