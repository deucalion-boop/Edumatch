-- Read-only. Run in the Supabase SQL Editor after applying migrations 001-006.
-- Each application table should exist, have rls_enabled=true, and no browser
-- grants. Backend service_role access is intentional; it bypasses RLS.
with expected(table_name) as (
  values ('users'), ('sessions'), ('otp_challenges'), ('login_attempts'),
    ('sections'), ('lessons'), ('assessments'), ('admin_messages'),
    ('notifications'), ('audit_logs'), ('subjects'), ('subject_enrollments'),
    ('attendance_records'), ('submissions'), ('recommendations'),
    ('app_settings'), ('export_approval_requests')
)
select e.table_name,
  c.oid is not null as table_exists,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  case when c.oid is not null then has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') end as anon_has_any_table_privilege,
  case when c.oid is not null then has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') end as authenticated_has_any_table_privilege
from expected e
left join pg_namespace n on n.nspname = 'public'
left join pg_class c on c.relnamespace = n.oid and c.relname = e.table_name and c.relkind in ('r', 'p')
order by e.table_name;

-- Sensitive buckets must be private. Check the configured application bucket.
select id, name, public from storage.buckets order by name;

-- Inspect custom storage policies: private buckets can still expose files if
-- permissive anon/authenticated policies grant access. No broad client grants
-- are needed for files accessed through this backend's signed proxy.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
