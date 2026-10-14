const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

// Execute the production migration/RPCs in disposable PostgreSQL, without
// contacting the school's database or substituting a JavaScript transaction.
let db;
const token = 'a'.repeat(64);
const passwordHash = '$2b$12$' + 'A'.repeat(53);
const expiresAt = () => new Date(Date.now() + 86400000).toISOString();
const record = (name = 'Maria Santos', id = 'roster-one') => ({
  id, full_name: name, normalized_name: name.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLowerCase(),
  section_id: 'charity',
});
async function importRoster(records = [record()], teacher = 'teacher', subject = 'class-one', id = 'invite-one', hash = token) {
  const result = await db.query('select public.import_class_invitation($1,$2,$3,$4,$5,$6::jsonb) as id',
    [teacher, subject, id, hash, expiresAt(), JSON.stringify(records)]);
  return result.rows[0].id;
}
async function register(overrides = {}) {
  const value = { token, name: 'maria santos', email: 'maria@gmail.com', username: 'Maria.Santos', passwordHash, ...overrides };
  const result = await db.query('select public.register_class_invitation_student($1,$2,$3,$4,$5) as id',
    [value.token, value.name, value.email, value.username, value.passwordHash]);
  return result.rows[0].id;
}
async function count(table) {
  return Number((await db.query(`select count(*) as count from public.${table}`)).rows[0].count);
}
test.before(async () => {
  db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role;');
  for (const migration of ['001_create_users.sql', '002_create_sections.sql', '003_create_learning_content.sql',
    '006_create_classroom_operations.sql', '014_create_class_invitations.sql', '015_name_based_class_registration.sql',
    '016_advisory_class_invitations.sql']) {
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', migration), 'utf8'));
  }
});
test.after(async () => { if (db) await db.close(); });
test.beforeEach(async () => {
  await db.exec(`truncate public.users, public.sections cascade;
    insert into public.sections(id,name) values ('charity','Charity');
    insert into public.users(id,name,email,username,role,status,advisory_section_id,department,subject)
      values ('teacher','Teacher One','teacher@gmail.com','teacher','teacher','active','charity','Science','Science'),
             ('other','Teacher Two','other@gmail.com','other','teacher','active',null,'Science','Science');
    insert into public.subjects(id,name,class_name,code,track,teacher_id,advisory_section_id)
      values ('class-one','Science','Science 10 - Charity','SCI-ONE','GENERAL','teacher','charity'),
             ('class-two','Science','Other Class','SCI-TWO','GENERAL','other',null);`);
});

test('name-only registration commits account, correct membership and registered roster entry together', async () => {
  await importRoster();
  const id = await register();
  const user = (await db.query('select * from public.users where id=$1', [id])).rows[0];
  assert.equal(user.name, 'Maria Santos');
  assert.equal(user.section_id, 'charity');
  assert.equal(user.managed_by, 'teacher');
  assert.equal(user.grade_level, 'Grade 10');
  assert.equal(user.strand, '');
  assert.equal(user.password_hash, passwordHash);
  const enrollment = (await db.query('select * from public.subject_enrollments where student_id=$1', [id])).rows[0];
  assert.equal(enrollment.subject_id, 'class-one');
  assert.equal(enrollment.teacher_id, 'teacher');
  assert.equal(enrollment.section_name, 'Charity');
  assert.equal(enrollment.status, 'approved');
  const imported = (await db.query('select * from public.class_registration_students')).rows[0];
  assert.equal(imported.student_id, id);
  assert.ok(imported.registered_at);
  await assert.rejects(register({ email: 'second@gmail.com', username: 'second.account' }), /STUDENT_REGISTERED/);
  assert.equal(await count('subject_enrollments'), 1);
  assert.equal(await count('users'), 3);
});

test('unlisted name, foreign class link and expiry cannot create an account or claim a roster entry', async () => {
  await importRoster();
  for (const overrides of [{ name: 'another student' }, { name: 'maria santo' }, { token: 'd'.repeat(64) }]) {
    await assert.rejects(register(overrides), /NAME_NOT_FOUND|INVITATION_INVALID/);
  }
  await db.exec("update public.class_invitations set expires_at=now()-interval '1 second'");
  await assert.rejects(register(), /INVITATION_EXPIRED/);
  assert.equal(await count('users'), 2);
  assert.equal(await count('subject_enrollments'), 0);
  assert.equal((await db.query('select registered_at from public.class_registration_students')).rows[0].registered_at, null);
});

test('case-insensitive username/email conflicts roll back and leave the name available for registration', async () => {
  await importRoster();
  await assert.rejects(register({ username: 'TEACHER' }), /USERNAME_TAKEN/);
  await assert.rejects(register({ email: 'teacher@gmail.com' }), /EMAIL_TAKEN/);
  assert.equal(await count('users'), 2);
  assert.equal(await count('subject_enrollments'), 0);
  assert.equal((await db.query('select registered_at from public.class_registration_students')).rows[0].registered_at, null);
  await register();
  assert.equal(await count('subject_enrollments'), 1);
});

test('imports reject foreign/inactive classes and inactive advisory sections without saving partial rosters', async () => {
  await assert.rejects(importRoster([record()], 'other'), /CLASS_UNAVAILABLE/);
  await assert.rejects(importRoster([record()], 'teacher', 'class-two'), /CLASS_UNAVAILABLE/);
  await db.exec("update public.sections set is_active=false");
  await assert.rejects(importRoster(), /ADVISORY_SECTION_REQUIRED/);
  assert.equal(await count('class_invitations'), 0);
  assert.equal(await count('class_registration_students'), 0);
});

test('duplicate names within and across imports roll back all records and preserve one class link', async () => {
  await assert.rejects(importRoster([record(), record('  MARIA   SANTOS ', 'second')]), /ROSTER_DUPLICATE/);
  assert.equal(await count('class_invitations'), 0);
  assert.equal(await count('class_registration_students'), 0);
  await importRoster();
  await assert.rejects(importRoster([record('Maria Santos', 'second')], 'teacher', 'class-one', 'invite-two', 'd'.repeat(64)), /ROSTER_DUPLICATE/);
  assert.equal(await count('class_invitations'), 1);
  const id = await importRoster([record('Juan Dela Cruz', 'second')], 'teacher', 'class-one', 'invite-two', 'd'.repeat(64));
  assert.equal(id, 'invite-one');
  assert.equal(await count('class_invitations'), 1);
  assert.equal(await count('class_registration_students'), 2);
  assert.equal((await db.query('select token_hash from public.class_invitations')).rows[0].token_hash, token);
});

test('teacher/class/section changes after import block registration at transaction commit', async () => {
  for (const update of ["update public.users set status='suspended' where id='teacher'",
    "update public.subjects set is_active=false where id='class-one'", "update public.sections set is_active=false"]) {
    await db.exec("update public.users set status='active'; update public.subjects set is_active=true; update public.sections set is_active=true;");
    if (!await count('class_invitations')) await importRoster();
    await db.exec(update);
    await assert.rejects(register(), /CLASS_UNAVAILABLE|ADVISORY_SECTION_REQUIRED/);
    assert.equal(await count('subject_enrollments'), 0);
  }
});

test('an enrollment write failure rolls back the account and leaves the imported name unregistered', async () => {
  await importRoster();
  await db.exec("alter table public.subject_enrollments add constraint test_reject_enrollment check (false) not valid;");
  try {
    await assert.rejects(register(), /test_reject_enrollment/);
    assert.equal(await count('users'), 2);
    assert.equal((await db.query('select registered_at from public.class_registration_students')).rows[0].registered_at, null);
  } finally {
    await db.exec('alter table public.subject_enrollments drop constraint test_reject_enrollment;');
  }
  await register();
});

test('browser database roles cannot read the roster or execute account-creation RPCs', async () => {
  const privileges = (await db.query(`select
    has_table_privilege('anon','public.class_registration_students','SELECT') as read_roster,
    has_function_privilege('authenticated','public.register_class_invitation_student(text,text,text,text,text)','EXECUTE') as register,
    has_function_privilege('service_role','public.register_class_invitation_student(text,text,text,text,text)','EXECUTE') as backend_register,
    to_regprocedure('public.register_class_invitation_student(text,text,text,text,text,text)') is null as legacy_removed`)).rows[0];
  assert.equal(privileges.read_roster, false);
  assert.equal(privileges.register, false);
  assert.equal(privileges.backend_register, true);
  assert.equal(privileges.legacy_removed, true);
});

test('renewal requires ownership and restores signup only for names that are still unregistered', async () => {
  await importRoster([record(), record('Juan Dela Cruz', 'second')]);
  await register();
  await db.exec("update public.class_invitations set expires_at=now()-interval '1 second'");
  await assert.rejects(db.query('select public.renew_class_invitation($1,$2,$3)', ['other', 'invite-one', expiresAt()]), /INVITATION_INVALID|CLASS_UNAVAILABLE/);
  await db.query('select public.renew_class_invitation($1,$2,$3)', ['teacher', 'invite-one', expiresAt()]);
  await assert.rejects(register(), /STUDENT_REGISTERED/);
  await register({ name: 'juan dela cruz', email: 'juan@gmail.com', username: 'JuanCruz' });
  assert.equal(await count('class_invitations'), 1);
  assert.equal(await count('subject_enrollments'), 2);
  assert.equal((await db.query('select token_hash from public.class_invitations')).rows[0].token_hash, token);
});

test('Unicode and whitespace normalization agrees with the backend identity key', async () => {
  const input = '\uFF2Daria\u00A0  Santos';
  const expected = record(input).normalized_name;
  assert.equal((await db.query('select public.normalize_registration_name($1) as name', [input])).rows[0].name, expected);
  await importRoster([record(input)]);
  const id = await register({ name: expected });
  assert.ok(id);
  await assert.rejects(db.query(`insert into public.users(name,email,username,role) values ($1,$2,$3,'student')`,
    [' MARIA    SANTOS ', 'duplicate@gmail.com', 'duplicate']), /users_student_normalized_name_unique/);
});

test('migration 015 preserves existing invitation links, names and registered accounts while removing private codes', async () => {
  const upgradeDb = new PGlite();
  try {
    await upgradeDb.exec('create role anon; create role authenticated; create role service_role;');
    for (const migration of ['001_create_users.sql', '002_create_sections.sql', '003_create_learning_content.sql',
      '006_create_classroom_operations.sql', '014_create_class_invitations.sql']) {
      await upgradeDb.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', migration), 'utf8'));
    }
    await upgradeDb.exec(`
      insert into public.sections(id,name) values ('charity','Charity');
      insert into public.users(id,name,email,username,role,status,advisory_section_id)
        values ('teacher','Teacher','teacher@gmail.com','teacher','teacher','active','charity');
      insert into public.subjects(id,name,class_name,code,track,teacher_id)
        values ('class-one','Science','Grade 10 Science','SCI-ONE','GENERAL','teacher');
    `);
    const legacyRecords = [
      { ...record('John Cruz', 'already-registered'), code_hash: 'b'.repeat(64) },
      { ...record(), code_hash: 'c'.repeat(64) },
    ];
    await upgradeDb.query('select public.import_class_invitation($1,$2,$3,$4,$5,$6::jsonb)',
      ['teacher', 'class-one', 'invite-one', token, expiresAt(), JSON.stringify(legacyRecords)]);
    const oldId = (await upgradeDb.query('select public.register_class_invitation_student($1,$2,$3,$4,$5,$6) as id',
      [token, 'b'.repeat(64), 'john cruz', 'john@gmail.com', 'JohnCruz', passwordHash])).rows[0].id;

    await upgradeDb.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/015_name_based_class_registration.sql'), 'utf8'));
    const columns = await upgradeDb.query(`select column_name from information_schema.columns
      where table_schema='public' and table_name='class_registration_students'`);
    assert.equal(columns.rows.some(row => row.column_name === 'code_hash'), false);
    assert.equal((await upgradeDb.query('select token_hash from public.class_invitations')).rows[0].token_hash, token);
    const existing = (await upgradeDb.query("select student_id,registered_at from public.class_registration_students where id='already-registered'")).rows[0];
    assert.equal(existing.student_id, oldId);
    assert.ok(existing.registered_at);
    await assert.rejects(upgradeDb.query('select public.register_class_invitation_student($1,$2,$3,$4,$5)',
      [token, 'john cruz', 'second@gmail.com', 'second.account', passwordHash]), /STUDENT_REGISTERED/);
    const newId = (await upgradeDb.query('select public.register_class_invitation_student($1,$2,$3,$4,$5) as id',
      [token, 'maria santos', 'maria@gmail.com', 'MariaSantos', passwordHash])).rows[0].id;
    assert.ok(newId);
    assert.equal(Number((await upgradeDb.query('select count(*) as count from public.subject_enrollments')).rows[0].count), 2);
    // Running the upgrade twice must not discard the existing roster/account state.
    await upgradeDb.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/015_name_based_class_registration.sql'), 'utf8'));
    assert.equal(Number((await upgradeDb.query('select count(*) as count from public.class_registration_students')).rows[0].count), 2);
  } finally {
    await upgradeDb.close();
  }
});
