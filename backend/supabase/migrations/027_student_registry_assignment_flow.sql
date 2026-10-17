-- Keep unused invitation placeholders out of the registry, and prevent replacing existing class assignments.
BEGIN;
create or replace function public.student_registry_sync_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$ declare v_user public.users%rowtype; v_registry public.student_registry%rowtype; v_normalized text; v_first text; v_last text; begin
  if new.role <> 'student' then return null; end if;
  if tg_op = 'UPDATE' and old.role = new.role and old.name is not distinct from new.name and old.status is not distinct from new.status and old.invite is not distinct from new.invite then return null; end if;
  perform pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity', 0));
  select * into v_user from public.users where id = new.id and role = 'student';
  if v_user.id is null then return null; end if;
  -- Unused private invitations are not registered students.
  if v_user.status = 'pending' and coalesce(v_user.invite->>'selfRegistration', 'false') = 'true'
    and coalesce(v_user.invite->>'usedAt', '') = '' then return null; end if;
  v_normalized := public.normalize_registration_name(v_user.name);
  v_first := case when position(' ' in v_normalized) = 0 then btrim(v_user.name)
    else regexp_replace(btrim(regexp_replace(v_user.name, '[[:space:]]+', ' ', 'g')), ' [^ ]+$', '') end;
  v_last := case when position(' ' in v_normalized) = 0 then ''
    else regexp_replace(btrim(regexp_replace(v_user.name, '[[:space:]]+', ' ', 'g')), '^.* ', '') end;
  select * into v_registry from public.student_registry where student_id = v_user.id for update;
  if v_registry.id is not null then
    if v_registry.full_name is distinct from v_user.name then
      update public.student_registry set first_name = v_first, last_name = v_last, full_name = v_user.name,
        normalized_name = v_normalized, code_used_at = coalesce(code_used_at, now()), updated_at = now()
        where id = v_registry.id;
    else
      update public.student_registry set code_used_at = coalesce(code_used_at, now()), updated_at = now() where id = v_registry.id;
    end if;
  else
    select * into v_registry from public.student_registry where normalized_name = v_normalized for update;
    if v_registry.student_id is not null and v_registry.student_id <> v_user.id then raise exception 'REGISTRY_DUPLICATE'; end if;
    if v_registry.id is null then
      insert into public.student_registry(first_name, last_name, full_name, normalized_name, student_id, code_used_at)
        values(v_first, v_last, v_user.name, v_normalized, v_user.id, now()) returning * into v_registry;
    else
      update public.student_registry set student_id = v_user.id, code_used_at = now(), updated_at = now() where id = v_registry.id;
    end if;
  end if;
  insert into public.student_registry_assignments(registry_id, subject_id)
    select v_registry.id, subject_id from public.subject_enrollments where student_id = v_user.id and status = 'approved'
    on conflict do nothing;
  -- Legacy signup/manual creation may link a preassigned central identity. Join
  -- all its active classes as well as preserving the legacy advisory membership.
  insert into public.subject_enrollments(subject_id, teacher_id, student_id, section_id, section_name, status, decided_at)
    select s.id, s.teacher_id, v_user.id, sec.id, coalesce(sec.name, ''), 'approved', now()
    from public.student_registry_assignments a join public.subjects s on s.id = a.subject_id
    join public.users t on t.id = s.teacher_id
    left join public.sections sec on sec.id = coalesce(s.advisory_section_id, t.advisory_section_id)
    where a.registry_id = v_registry.id and s.is_active and t.role = 'teacher' and t.status = 'active'
      and coalesce(t.archive->>'isArchived', 'false') <> 'true'
    on conflict(subject_id, student_id) do update set status = 'approved', teacher_id = excluded.teacher_id,
      section_id = excluded.section_id, section_name = excluded.section_name, decided_at = now(), updated_at = now();
  delete from public.student_registry_sessions where registry_id = v_registry.id and completed_user_id is null;
  return null;
end; $$;

CREATE OR REPLACE FUNCTION public.student_registry_assign_unassigned(
  p_headteacher_id text,p_registry_ids text[],p_subject_ids text[]
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('edumatch-class-roster-identity',0));
  PERFORM public.student_registry_assert_headteacher(p_headteacher_id);
  IF p_subject_ids IS NULL OR cardinality(p_subject_ids)=0 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  PERFORM 1 FROM public.student_registry WHERE id=ANY(p_registry_ids) ORDER BY id FOR UPDATE;
  IF EXISTS (
    SELECT 1 FROM public.student_registry r
    JOIN public.student_registry_assignments a ON a.registry_id=r.id
    JOIN public.subjects s ON s.id=a.subject_id AND s.is_active
    JOIN public.users t ON t.id=s.teacher_id AND t.role='teacher' AND t.status='active'
      AND coalesce(t.archive->>'isArchived','false')<>'true'
    WHERE r.id=ANY(p_registry_ids)
      AND (r.student_id IS NULL OR EXISTS (
        SELECT 1 FROM public.subject_enrollments e
        WHERE e.student_id=r.student_id AND e.subject_id=s.id AND e.status='approved'
      ))
  ) THEN RAISE EXCEPTION 'STUDENT_ALREADY_ASSIGNED'; END IF;
  RETURN public.student_registry_assign(p_headteacher_id,p_registry_ids,p_subject_ids);
END;
$$;
REVOKE ALL ON FUNCTION public.student_registry_assign_unassigned(text,text[],text[]) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.student_registry_assign_unassigned(text,text[],text[]) TO service_role;
COMMIT;
