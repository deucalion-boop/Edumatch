BEGIN;
CREATE TABLE public.student_registration_links (
  id text PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
  teacher_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  section_id text NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id text NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  nonce text NOT NULL, token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  revoked_at timestamptz, registration_count integer NOT NULL DEFAULT 0
);
ALTER TABLE public.student_registration_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_registration_links FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_registration_links TO service_role;
CREATE FUNCTION public.register_student_link(p_hash text,p_name text,p_email text,p_username text,p_password_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE link public.student_registration_links%ROWTYPE;
  teacher public.users%ROWTYPE;
  section public.sections%ROWTYPE;
  new_id text := replace(gen_random_uuid()::text,'-','');
BEGIN
  SELECT * INTO link FROM public.student_registration_links WHERE token_hash=p_hash FOR UPDATE;
  IF link.id IS NULL OR link.revoked_at IS NOT NULL OR link.expires_at<=now() THEN
    RAISE EXCEPTION 'Student registration link expired, revoked, or invalid';
  END IF;
  SELECT * INTO teacher FROM public.users WHERE id=link.teacher_id FOR SHARE;
  SELECT * INTO section FROM public.sections WHERE id=link.section_id FOR SHARE;
  IF teacher.id IS NULL OR teacher.role<>'teacher' OR teacher.status<>'active'
    OR coalesce(teacher.archive->>'isArchived','false')='true'
    OR teacher.advisory_section_id IS DISTINCT FROM link.section_id
    OR section.id IS NULL OR NOT section.is_active THEN RAISE EXCEPTION 'Advisory assignment is unavailable'; END IF;
  PERFORM 1 FROM public.subjects WHERE id=link.subject_id AND teacher_id=teacher.id AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Advisory class is unavailable'; END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 100 OR p_name ~ '[[:cntrl:]]'
    OR NOT public.teacher_invitation_valid_email(p_email)
    OR p_username IS NULL OR p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$'
    OR p_password_hash IS NULL OR p_password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$'
  THEN RAISE EXCEPTION 'Invalid registration details'; END IF;
  INSERT INTO public.users(id,name,email,username,password_hash,role,status,grade_level,section_id,department,managed_by,enrollment)
  VALUES(new_id,btrim(p_name),lower(btrim(p_email)),p_username,p_password_hash,'student','active','Grade 10',
    link.section_id,teacher.department,teacher.id,
    jsonb_build_object('teacherId',teacher.id,'status','approved','requestedAt',now(),'approvedAt',now()));
  INSERT INTO public.subject_enrollments(subject_id,teacher_id,student_id,section_id,section_name,status,decided_at)
  VALUES(link.subject_id,teacher.id,new_id,link.section_id,section.name,'approved',now());
  UPDATE public.student_registration_links SET registration_count=registration_count+1 WHERE id=link.id;
  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.register_student_link(text,text,text,text,text) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.register_student_link(text,text,text,text,text) TO service_role;
COMMIT;
