-- All secretary accounts occupy the single slot, regardless of status.
-- Do not delete or modify existing accounts automatically.
BEGIN;

LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.users WHERE role = 'secretary') > 1 THEN
    RAISE EXCEPTION 'Multiple secretary accounts exist. Choose the account to retain and resolve the duplicates before applying migration 023.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS users_single_secretary_unique
  ON public.users (role)
  WHERE role = 'secretary';

COMMIT;
