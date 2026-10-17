const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
test('student links register multiple students atomically and enforce expiry, revocation and advisory ownership', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE TABLE users(id text PRIMARY KEY,name text,email text UNIQUE,username text UNIQUE,password_hash text,role text,status text,
        grade_level text,section_id text,department text,managed_by text,advisory_section_id text,archive jsonb DEFAULT '{}',enrollment jsonb);
      CREATE TABLE sections(id text PRIMARY KEY,name text,is_active boolean);
      CREATE TABLE subjects(id text PRIMARY KEY,teacher_id text REFERENCES users(id),is_active boolean);
      CREATE TABLE subject_enrollments(id text DEFAULT gen_random_uuid()::text,subject_id text REFERENCES subjects(id),teacher_id text REFERENCES users(id),student_id text REFERENCES users(id),section_id text REFERENCES sections(id),section_name text,status text,decided_at timestamptz, UNIQUE(subject_id,student_id));
      CREATE FUNCTION teacher_invitation_valid_email(text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$ SELECT coalesce($1 ~ '^[^@ ]+@[^@ ]+[.][^@ ]+$',false) $$;
      INSERT INTO users(id,role,status,advisory_section_id,department) VALUES('teacher','teacher','active','charity','MAPEH');
      INSERT INTO sections VALUES('charity','Charity',true);
      INSERT INTO subjects VALUES('class','teacher',true);`);
    await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/026_reusable_student_registration_links.sql'),'utf8'));
    await db.exec(`INSERT INTO student_registration_links(id,teacher_id,section_id,subject_id,nonce,token_hash) VALUES('link','teacher','charity','class','nonce','hash');`);
    const register = username => db.query('SELECT register_student_link($1,$2,$3,$4,$5)', ['hash','New Student',`${username}@gmail.com`,username,'$2b$12$'+'a'.repeat(53)]);
    await register('student1'); await register('student2');
    assert.equal((await db.query(`SELECT registration_count FROM student_registration_links`)).rows[0].registration_count,2);
    const students = (await db.query(`SELECT * FROM users WHERE role='student'`)).rows;
    assert.equal(students.length,2);
    for(const student of students) { assert.equal(student.managed_by,'teacher'); assert.equal(student.section_id,'charity'); assert.equal(student.status,'active'); }
    assert.equal((await db.query(`SELECT count(*)::int AS count FROM subject_enrollments WHERE status='approved' AND subject_id='class'`)).rows[0].count,2);
    await assert.rejects(register('student1'),/duplicate key/);
    assert.equal((await db.query(`SELECT registration_count FROM student_registration_links`)).rows[0].registration_count,2);
    await db.exec(`UPDATE student_registration_links SET revoked_at=now()`);
    await assert.rejects(register('student3'),/expired, revoked, or invalid/);
    await db.exec(`UPDATE student_registration_links SET revoked_at=null,expires_at=now()-interval '1 second'`);
    await assert.rejects(register('student3'),/expired, revoked, or invalid/);
    await db.exec(`UPDATE student_registration_links SET expires_at=now()+interval '1 day'; UPDATE users SET advisory_section_id=null WHERE id='teacher'`);
    await assert.rejects(register('student3'),/Advisory assignment is unavailable/);
    await db.exec(`UPDATE users SET advisory_section_id='charity' WHERE id='teacher'; UPDATE subjects SET is_active=false`);
    await assert.rejects(register('student3'),/Advisory class is unavailable/);
    await db.exec(`DELETE FROM student_registration_links`);
    await assert.rejects(register('student3'),/expired, revoked, or invalid/);
    assert.equal((await db.query(`SELECT count(*)::int AS count FROM users WHERE role='student'`)).rows[0].count,2);
    const privileges = (await db.query(`SELECT has_table_privilege('anon','student_registration_links','SELECT') AS anon,has_table_privilege('authenticated','student_registration_links','SELECT') AS authenticated`)).rows[0];
    assert.equal(privileges.anon,false); assert.equal(privileges.authenticated,false);
  } finally { await db.close(); }
});
