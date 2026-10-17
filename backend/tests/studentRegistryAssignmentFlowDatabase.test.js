const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
test('registry ignores unused invitation placeholders and allows only initial class assignments',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_app_meta_data jsonb NOT NULL DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT null::uuid $$;`);
    for(const file of ['001_create_users.sql','002_create_sections.sql','003_create_learning_content.sql',
      '006_create_classroom_operations.sql','014_create_class_invitations.sql','015_name_based_class_registration.sql',
      '016_advisory_class_invitations.sql','017_teacher_invitations.sql','018_teacher_group_invitations.sql',
      '019_student_registry.sql','020_student_registry_department_assignments.sql','027_student_registry_assignment_flow.sql']) {
      await db.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations',file),'utf8'));
    }
    await db.exec(`INSERT INTO users(id,name,email,username,role,status,department,password_hash) VALUES
      ('head','Head','head@gmail.com','head','headteacher','active','Mathematics','hash'),
      ('teacher','Teacher','teacher@gmail.com','teacher','teacher','active','Mathematics','hash');
      INSERT INTO subjects(id,name,class_name,code,track,department,teacher_id,is_active) VALUES
      ('math','Mathematics','Math','MATH','GENERAL','Mathematics','teacher',true);
      INSERT INTO users(id,name,email,username,role,status,invite) VALUES
      ('placeholder','Pending student registration','placeholder@gmail.com','placeholder','student','pending','{"selfRegistration":true}');`);
    assert.equal((await db.query(`SELECT count(*)::int AS count FROM student_registry WHERE student_id='placeholder'`)).rows[0].count,0);
    await db.exec(`UPDATE users SET name='Real Student',status='active',invite='{"selfRegistration":true,"usedAt":"2026-10-17"}' WHERE id='placeholder';`);
    const id=(await db.query(`SELECT id FROM student_registry WHERE student_id='placeholder'`)).rows[0].id;
    const assign=()=>db.query('SELECT student_registry_assign_unassigned($1,$2::text[],$3::text[])',['head',[id],['math']]);
    await assign();
    await assert.rejects(assign(),/STUDENT_ALREADY_ASSIGNED/);
    await assert.rejects(db.query('SELECT student_registry_assign_unassigned($1,$2::text[],$3::text[])',['head',[id],[]]),/INPUT_INVALID/);
    assert.equal((await db.query(`SELECT count(*)::int AS count FROM subject_enrollments WHERE student_id='placeholder' AND status='approved'`)).rows[0].count,1);
    const rights=(await db.query(`SELECT has_function_privilege('anon','student_registry_assign_unassigned(text,text[],text[])','EXECUTE') AS allowed`)).rows[0];
    assert.equal(rights.allowed,false);
  } finally {await db.close();}
});
