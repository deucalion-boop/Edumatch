const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

const migration = file => fs.readFileSync(path.join(__dirname, '../supabase/migrations', file), 'utf8');
const records = JSON.stringify([{
  id: 'student-one', firstName: 'Maria', lastName: 'Santos',
  nonce: 'a'.repeat(48), codeHash: 'b'.repeat(64),
}]);

test('Excel import requires an available teacher class and saves the assignment atomically', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_app_meta_data jsonb not null default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;`);
    for (const file of [
      '001_create_users.sql', '002_create_sections.sql', '003_create_learning_content.sql',
      '006_create_classroom_operations.sql', '014_create_class_invitations.sql',
      '015_name_based_class_registration.sql', '016_advisory_class_invitations.sql',
      '017_teacher_invitations.sql', '018_teacher_group_invitations.sql',
      '019_student_registry.sql', '020_student_registry_department_assignments.sql',
      '022_require_teacher_assignment_on_student_import.sql',
    ]) await db.exec(migration(file));

    await db.exec(`insert into public.users(id,name,email,username,role,status,department,password_hash) values
      ('head','Head Teacher','head@gmail.com','head','headteacher','active','Mathematics','hash'),
      ('teacher','Math Teacher','teacher@gmail.com','teacher','teacher','active','Mathematics','hash');
      insert into public.subjects(id,name,class_name,code,track,department,teacher_id,is_active)
        values('math-class','Mathematics','Math Class','MATH-1','GENERAL','Mathematics','teacher',true);`);

    const result = await db.query(
      'select public.student_registry_import_assigned($1,$2::jsonb,$3) as imported',
      ['head', records, 'math-class'],
    );
    assert.equal(result.rows[0].imported, 1);
    assert.equal(Number((await db.query('select count(*) as count from public.student_registry_assignments where registry_id=$1 and subject_id=$2', ['student-one', 'math-class'])).rows[0].count), 1);

    await assert.rejects(
      db.query('select public.student_registry_import_assigned($1,$2::jsonb,$3)', [
        'head', JSON.stringify([{ id: 'student-two', firstName: 'Juan', lastName: 'Cruz', nonce: 'c'.repeat(48), codeHash: 'd'.repeat(64) }]), 'missing-class',
      ]),
      /CLASS_UNAVAILABLE/,
    );
    assert.equal(Number((await db.query("select count(*) as count from public.student_registry where id='student-two'")).rows[0].count), 0);
  } finally {
    await db.close();
  }
});
