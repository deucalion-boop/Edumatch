-- DESTRUCTIVE: clear EduMatch application data, keeping all Admin accounts.
-- Back up first and stop the backend while running in Supabase SQL Editor.
-- Admin accounts/passwords and the database schema are preserved.
-- Supabase Storage files are not deleted. This does not apply migrations.

begin;
set local lock_timeout = '10s';
lock table public.users in access exclusive mode;

do $$
declare
  table_name text;
begin
  if not exists (select 1 from public.users where role = 'admin') then
    raise exception 'Reset cancelled: no Admin account exists to preserve.';
  end if;

  -- Child records come first, including the roster's RESTRICT references.
  -- Skip tables absent from installations with older migrations.
  foreach table_name in array array[
    'teacher_invitations',
    'class_registration_students',
    'class_invitations',
    'student_subject_grades',
    'submissions',
    'lesson_progress',
    'assessment_weights',
    'recommendations',
    'student_settings',
    'student_account_requests',
    'export_approval_requests',
    'attendance_records',
    'subject_enrollments',
    'assessments',
    'lessons',
    'subjects',
    'school_announcements',
    'admin_messages',
    'notifications',
    'audit_logs',
    'login_attempts',
    'otp_challenges',
    'sessions',
    'app_settings',
    'sections'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('delete from public.%I', table_name);
    end if;
  end loop;

  delete from public.users where role <> 'admin';
end;
$$;

commit;

-- Only Admin accounts should remain. No password hashes are returned.
select id, name, email, username, role, status
from public.users
order by username;
