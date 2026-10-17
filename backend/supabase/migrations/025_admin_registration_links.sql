BEGIN;
CREATE TABLE public.admin_registration_links (
  id text PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
  issuer_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher', 'headteacher')),
  nonce text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  revoked_at timestamptz,
  registration_count integer NOT NULL DEFAULT 0
);
ALTER TABLE public.admin_registration_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_registration_links FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_registration_links TO service_role;

CREATE FUNCTION public.register_admin_link(p_hash text, p_name text, p_email text,
  p_username text, p_department text, p_password_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE link public.admin_registration_links%ROWTYPE;
  new_id text := replace(gen_random_uuid()::text, '-', '');
BEGIN
  SELECT * INTO link FROM public.admin_registration_links WHERE token_hash = p_hash FOR UPDATE;
  IF link.id IS NULL OR link.revoked_at IS NOT NULL OR link.expires_at <= now() THEN
    RAISE EXCEPTION 'Registration link expired, revoked, or invalid';
  END IF;
  PERFORM 1 FROM public.users WHERE id = link.issuer_id AND role = 'admin' AND status = 'active' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inviting administrator is unavailable'; END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 100 OR p_name ~ '[[:cntrl:]]'
    OR NOT public.teacher_invitation_valid_email(p_email)
    OR p_username IS NULL OR p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$'
    OR p_department IS NULL OR p_department NOT IN ('Mathematics','English','Science','TLE','Filipino','Araling Panlipunan','Edukasyon sa Pagpapakatao (ESP)','MAPEH')
    OR p_password_hash IS NULL OR p_password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$'
  THEN RAISE EXCEPTION 'Invalid registration details'; END IF;
  IF link.role = 'headteacher' THEN
    PERFORM pg_advisory_xact_lock(hashtext('headteacher:' || p_department));
    IF EXISTS (SELECT 1 FROM public.users WHERE role = 'headteacher' AND department = p_department) THEN
      RAISE EXCEPTION 'This department already has a Head Teacher';
    END IF;
  END IF;
  INSERT INTO public.users(id,name,email,username,password_hash,role,status,department,subject,managed_by)
  VALUES(new_id,btrim(p_name),lower(btrim(p_email)),p_username,p_password_hash,link.role,'active',p_department,
    CASE WHEN link.role = 'teacher' THEN p_department ELSE '' END,link.issuer_id);
  UPDATE public.admin_registration_links SET registration_count = registration_count + 1 WHERE id = link.id;
  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.register_admin_link(text,text,text,text,text,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_admin_link(text,text,text,text,text,text) TO service_role;
COMMIT;
