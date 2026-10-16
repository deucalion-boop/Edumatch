-- Activate teacher invitations using the same details/password form as private
-- account invitations. Possession of the invitation replaces the email-code step.
BEGIN;

CREATE OR REPLACE FUNCTION public.activate_teacher_link(
  p_token_hash text, p_name text, p_email text, p_username text, p_password_hash text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  invitation public.teacher_invitations%ROWTYPE;
  new_id text := replace(gen_random_uuid()::text, '-', '');
  normalized_email text := lower(btrim(p_email));
BEGIN
  SELECT * INTO invitation FROM public.teacher_invitations WHERE token_hash = p_token_hash FOR UPDATE;
  IF invitation.id IS NULL THEN RAISE EXCEPTION 'INVITATION_INVALID'; END IF;
  IF invitation.status = 'accepted' THEN RAISE EXCEPTION 'INVITATION_ACCEPTED'; END IF;
  IF invitation.status = 'revoked' THEN RAISE EXCEPTION 'INVITATION_REVOKED'; END IF;
  IF invitation.status <> 'pending' THEN RAISE EXCEPTION 'INVITATION_INVALID'; END IF;
  IF invitation.expires_at <= now() THEN RAISE EXCEPTION 'INVITATION_EXPIRED'; END IF;
  PERFORM public.teacher_invitation_assert_issuer(invitation.headteacher_id, invitation.department);
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 100 OR p_name ~ '[[:cntrl:]]'
    OR NOT public.teacher_invitation_valid_email(normalized_email)
    OR p_username IS NULL OR p_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$'
    OR p_password_hash IS NULL OR p_password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$'
  THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  IF invitation.email <> '' AND invitation.email <> normalized_email THEN RAISE EXCEPTION 'EMAIL_MISMATCH'; END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE lower(username) = lower(p_username)) THEN RAISE EXCEPTION 'USERNAME_TAKEN'; END IF;
  IF EXISTS (SELECT 1 FROM public.users WHERE lower(email) = normalized_email) THEN RAISE EXCEPTION 'EMAIL_TAKEN'; END IF;

  INSERT INTO public.users(id, name, email, username, password_hash, role, status, managed_by, department, subject, force_password_change)
  VALUES (new_id, btrim(p_name), normalized_email, p_username, p_password_hash, 'teacher', 'active',
    invitation.headteacher_id, invitation.department, invitation.department, false);

  IF invitation.is_group THEN
    INSERT INTO public.teacher_invitation_registrations(invitation_id, email, token_hash, status, accepted_user_id, accepted_at)
    VALUES (invitation.id, normalized_email, p_token_hash, 'accepted', new_id, now())
    ON CONFLICT (invitation_id, email) DO UPDATE SET status = 'accepted', accepted_user_id = new_id, accepted_at = now(),
      verification_token_hash = NULL, email_verified_at = NULL, email_verified_expires_at = NULL, updated_at = now();
    UPDATE public.teacher_invitations SET registration_count = registration_count + 1, updated_at = now() WHERE id = invitation.id;
  ELSE
    UPDATE public.teacher_invitations SET status = 'accepted', accepted_at = now(), accepted_user_id = new_id,
      verification_token_hash = NULL, email_verified_at = NULL, email_verified_expires_at = NULL, updated_at = now()
    WHERE id = invitation.id;
  END IF;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_teacher_link(text,text,text,text,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_teacher_link(text,text,text,text,text) TO service_role;

COMMIT;
