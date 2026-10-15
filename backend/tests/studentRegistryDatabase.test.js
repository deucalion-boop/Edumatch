const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

// Execute the actual registry transactions and RLS in disposable PostgreSQL.
let db;
let backfill;
const hash = letter => letter.repeat(64);
const link = hash('a'), code = hash('b'), ticket = hash('c'), otp = hash('d'), proof = hash('e'), claimId = hash('f');
const nonce = 'registry-nonce-1234567890';
const authId = '00000000-0000-4000-8000-000000000004';
const headAuth = '00000000-0000-4000-8000-000000000001';
const mathAuth = '00000000-0000-4000-8000-000000000002';
const scienceAuth = '00000000-0000-4000-8000-000000000003';
const email = 'maria@school.edu.ph';
const migration = file => fs.readFileSync(path.join(__dirname, '../supabase/migrations', file), 'utf8');
async function rpc(name, values) {
  return (await db.query(`select public.student_registry_${name}(${values.map((_value, index) => `$${index + 1}`).join(',')}) as value`, values)).rows[0].value;
}
const records = (overrides = {}) => [{ id: 'maria', firstName: 'Maria', lastName: 'Santos', nonce, codeHash: code, ...overrides }];
const importStudents = input => rpc('import', ['head', JSON.stringify(input || records())]);
const createLink = (rotate = false, value = link) => rpc('link', ['head', nonce, value, rotate, 30]);
const verifyStudent = (overrides = {}) => {
  const value = { link, name: 'Maria Santos', ticket, ...overrides };
  return rpc('verify', [value.link, value.name, value.ticket]);
};
const prepareEmail = (overrides = {}) => {
  const value = { link, ticket, email, otp, challenge: 'email-challenge-0001', ...overrides };
  return rpc('prepare_email', [value.link, value.ticket, value.email, value.otp, value.challenge]);
};
const verifyEmail = (overrides = {}) => {
  const value = { link, ticket, email, otp, challenge: 'email-challenge-0001', proof, ...overrides };
  return rpc('verify_email', [value.link, value.ticket, value.email, value.challenge, value.otp, value.proof]);
};
const begin = (overrides = {}) => {
  const value = { link, ticket, email, username: 'Maria.Santos', proof, claimId, ...overrides };
  return rpc('begin', [value.link, value.ticket, value.email, value.username, value.proof, value.claimId]);
};
const finish = (overrides = {}) => rpc('finish', [overrides.ticket || ticket, overrides.claimId || claimId, overrides.authId || authId]);
const assign = (ids = ['maria'], classes = ['math', 'science'], owner = 'head') => rpc('assign', [owner, ids, classes]);
const registry = async (id = 'maria') => (await db.query('select * from public.student_registry where id=$1', [id])).rows[0];
const session = async (value = ticket) => (await db.query('select * from public.student_registry_sessions where ticket_hash=$1', [value])).rows[0];
const count = async table => Number((await db.query(`select count(*) as count from public.${table}`)).rows[0].count);
async function authUser(overrides = {}) {
  const value = { id: authId, email, registryId: 'maria', claimId, confirmed: true, ...overrides };
  await db.query('insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data) values($1,$2,$3,$4::jsonb)',
    [value.id, value.email, value.confirmed ? new Date().toISOString() : null, JSON.stringify({ student_registry_id: value.registryId, registry_claim_id: value.claimId })]);
}
async function verified(overrides = {}) {
  await createLink(); await importStudents(overrides.records);
  await verifyStudent(overrides); await prepareEmail(overrides);
  assert.equal((await verifyEmail(overrides)).verified, true);
}
async function completed() { await verified(); await begin(); await authUser(); return finish(); }
async function asViewer(id, query, values = []) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec('set role authenticated');
  try { return await db.query(query, values); } finally { await db.exec('reset role'); }
}
async function seed() {
  await db.exec(`insert into auth.users(id,email) values('${headAuth}','head@gmail.com'),('${mathAuth}','math@gmail.com'),('${scienceAuth}','science@gmail.com');
    insert into public.sections(id,name) values('charity','Charity'),('sincerity','Sincerity');
    insert into public.users(id,name,email,username,role,department,auth_user_id,advisory_section_id) values
      ('head','Head Teacher','head@gmail.com','headteacher','headteacher','Mathematics','${headAuth}',null),
      ('math-teacher','Math Teacher','math@gmail.com','mathteacher','teacher','Mathematics','${mathAuth}','charity'),
      ('science-teacher','Science Teacher','science@gmail.com','scienceteacher','teacher','Science','${scienceAuth}','sincerity');
    insert into public.subjects(id,name,class_name,code,track,teacher_id,advisory_section_id) values
      ('math','Mathematics','Math Charity','MATH','STEM','math-teacher','charity'),
      ('science','Science','Science Sincerity','SCIENCE','STEM','science-teacher','sincerity'),
      ('other','Other','Other Class','OTHER','GENERAL','science-teacher',null);`);
}
test.before(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_app_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
  for (const file of ['001_create_users.sql', '002_create_sections.sql', '003_create_learning_content.sql', '006_create_classroom_operations.sql',
    '014_create_class_invitations.sql', '015_name_based_class_registration.sql', '016_advisory_class_invitations.sql',
    '017_teacher_invitations.sql', '018_teacher_group_invitations.sql']) await db.exec(migration(file));
  await db.exec(`insert into public.sections(id,name) values('old-section','Old Section');
    insert into public.users(id,name,email,username,role,password_hash) values
      ('old-teacher','Old Teacher','oldteacher@gmail.com','oldteacher','teacher','old-teacher-hash'),
      ('old-student','Legacy Dela Cruz','legacy@gmail.com','legacy','student','preserve-this-password-hash');
    insert into public.subjects(id,name,code,track,teacher_id) values('old-class','Legacy Class','LEGACY','GENERAL','old-teacher');
    insert into public.subject_enrollments(subject_id,teacher_id,student_id,status) values('old-class','old-teacher','old-student','approved');
    insert into public.class_invitations(id,subject_id,teacher_id,token_hash,expires_at) values('old-invite','old-class','old-teacher','${hash('0')}',now()+interval '1 day');
    insert into public.class_registration_students(id,invitation_id,teacher_id,full_name,normalized_name,section_id,section_name)
      values('old-roster','old-invite','old-teacher','Pending Dela Cruz','pending dela cruz','old-section','Old Section');`);
  await db.exec(migration('019_student_registry.sql'));
  await db.exec(migration('020_student_registry_department_assignments.sql'));
  backfill = {
    users: (await db.query('select * from public.users order by id')).rows,
    registry: (await db.query('select * from public.student_registry order by full_name')).rows,
    assignments: (await db.query('select * from public.student_registry_assignments')).rows,
  };
});
test.after(async () => { if (db) await db.close(); });
test.beforeEach(async () => {
  await db.exec('truncate auth.users,public.users,public.sections cascade;');
  await seed();
});

test('migration backfills existing accounts, pending names and class assignments without changing passwords', () => {
  assert.equal(backfill.users.find(user => user.id === 'old-student').password_hash, 'preserve-this-password-hash');
  assert.equal(backfill.users.find(user => user.id === 'old-student').auth_provider, 'local');
  const legacy = backfill.registry.find(row => row.student_id === 'old-student');
  assert.equal(legacy.first_name, 'Legacy Dela');
  assert.equal(legacy.last_name, 'Cruz');
  assert.ok(legacy.code_used_at);
  const pending = backfill.registry.find(row => row.normalized_name === 'pending dela cruz');
  assert.equal(pending.student_id, null);
  assert.equal(pending.code_hash, null);
  assert.equal(backfill.assignments.length, 2);
});

test('imports are atomic, canonical-name unique and issue hash-only expiring student codes', async () => {
  assert.equal(await importStudents(), 1);
  const row = await registry();
  assert.equal(row.full_name, 'Maria Santos');
  assert.equal(row.code_hash, code);
  assert.equal(row.code_nonce, nonce);
  assert.equal(new Date(row.code_expires_at) - new Date(row.created_at), 30 * 86400000);
  assert.equal(row.student_id, null);
  await assert.rejects(importStudents(records({ id: 'duplicate', firstName: 'ＭＡＲＩＡ', lastName: 'SANTOS', codeHash: hash('1') })), /REGISTRY_DUPLICATE/);
  await assert.rejects(importStudents([
    ...records({ id: 'juan', firstName: 'Juan', lastName: 'Cruz', codeHash: hash('2') }),
    ...records({ id: 'another', firstName: 'Juan', lastName: 'Cruz', codeHash: hash('3') }),
  ]), /REGISTRY_DUPLICATE/);
  assert.equal(await count('student_registry'), 1);
  assert.equal(await count('users'), 3);
});

test('management RPCs reject unauthorized roles and invalid names without mutations', async () => {
  await assert.rejects(rpc('import', ['math-teacher', JSON.stringify(records())]), /ISSUER_UNAVAILABLE/);
  for (const change of [{ firstName: '' }, { firstName: 'A'.repeat(101) }, { lastName: '123' }, { nonce: 'short' }, { codeHash: 'invalid' }]) {
    await assert.rejects(importStudents(records(change)), /INPUT_INVALID/);
  }
  await importStudents();
  await assert.rejects(assign(['maria'], ['math'], 'math-teacher'), /ISSUER_UNAVAILABLE/);
  await assert.rejects(rpc('code', ['math-teacher', 'maria', nonce, hash('1'), false]), /ISSUER_UNAVAILABLE/);
  await assert.rejects(assign(['missing']), /REGISTRY_NOT_FOUND/);
  await assert.rejects(assign(['maria'], ['missing']), /CLASS_UNAVAILABLE/);
  assert.equal(await count('student_registry_assignments'), 0);
});

test('Head Teachers can change only their department assignments and preserve other departments', async () => {
  await importStudents();
  await assert.rejects(assign(['maria'], ['science']), /CLASS_UNAVAILABLE/);
  await db.exec("update public.users set department='Science' where id='head'");
  await assign(['maria'], ['science']);
  await db.exec("update public.users set department='Mathematics' where id='head'");
  await assign(['maria'], ['math']);
  assert.deepEqual((await db.query('select subject_id from public.student_registry_assignments order by subject_id')).rows,
    [{ subject_id: 'math' }, { subject_id: 'science' }]);
  await assign(['maria'], []);
  assert.deepEqual((await db.query('select subject_id from public.student_registry_assignments order by subject_id')).rows,
    [{ subject_id: 'science' }]);
});

test('code and exact normalized full name verification are both required and do not create an account', async () => {
  await createLink(); await importStudents();
  for (const overrides of [{ name: 'Maria Santo' }, { name: 'Other Student' }, { code: hash('1') }, { link: hash('2') }]) {
    await assert.rejects(verifyStudent(overrides), /CODE_INVALID|INVITATION_INVALID/);
  }
  const value = await verifyStudent({ name: ' ＭＡＲＩＡ   SANTOS ' });
  assert.equal(value.student.fullName, 'Maria Santos');
  assert.equal(value.student.firstName, 'Maria');
  assert.ok(value.sessionId);
  assert.equal(new Date(value.expiresAt) - new Date((await session()).created_at), 30 * 60000);
  assert.equal(await count('users'), 3);
  await assert.rejects(begin(), /EMAIL_VERIFICATION_REQUIRED/);
});

test('verified students see only their assigned active classes and teacher names', async () => {
  await createLink(); await importStudents(); await assign(['maria'], ['math', 'science']);
  await importStudents(records({ id: 'juan', firstName: 'Juan', lastName: 'Cruz', codeHash: hash('1') }));
  await assign(['juan'], ['other']);
  const value = await verifyStudent();
  assert.deepEqual(value.student.assignments, [
    { subjectId: 'math', className: 'Math Charity', subjectName: 'Mathematics', teacherName: 'Math Teacher', sectionName: 'Charity' },
    { subjectId: 'science', className: 'Science Sincerity', subjectName: 'Science', teacherName: 'Science Teacher', sectionName: 'Sincerity' },
  ]);
  await db.exec("update public.subjects set is_active=false where id='science'");
  const refreshed = await verifyStudent({ ticket: hash('2') });
  assert.deepEqual(refreshed.student.assignments.map(row => row.subjectId), ['math']);
});

test('email verification persists five attempts, enforces cooldown and binds the proof to its email', async () => {
  await createLink(); await importStudents(); await verifyStudent();
  await prepareEmail();
  await assert.rejects(prepareEmail(), /INVITATION_COOLDOWN/);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const value = await verifyEmail({ otp: hash('0') });
    assert.equal(value.code, attempt === 5 ? 'EMAIL_CODE_LOCKED' : 'EMAIL_CODE_INVALID');
    assert.equal((await session()).email_code_attempts, attempt);
  }
  assert.equal((await verifyEmail()).code, 'EMAIL_CODE_LOCKED');
  await db.exec("update public.student_registry_sessions set email_code_sent_at=now()-interval '61 seconds'");
  await prepareEmail(); assert.equal((await verifyEmail()).verified, true);
  await assert.rejects(begin({ email: 'someone@school.edu.ph' }), /EMAIL_VERIFICATION_REQUIRED/);
  await assert.rejects(begin({ proof: hash('0') }), /EMAIL_VERIFICATION_REQUIRED/);
  await db.exec("update public.student_registry_sessions set email_verified_expires_at=now()-interval '1 second'");
  await assert.rejects(begin(), /EMAIL_VERIFICATION_REQUIRED/);
});

test('multiple teachers receive approved memberships when a verified Supabase Auth student finishes', async () => {
  await verified({ records: records({ lastName: 'Dela Cruz' }), name: 'Maria Dela Cruz' });
  assert.equal(await assign(), 1);
  const reserved = await begin();
  assert.deepEqual(reserved, { registryId: 'maria', claimId });
  await authUser();
  const id = await finish();
  const user = (await db.query('select * from public.users where id=$1', [id])).rows[0];
  assert.equal(user.name, 'Maria Dela Cruz');
  assert.equal(user.auth_provider, 'supabase');
  assert.equal(user.auth_user_id, authId);
  assert.equal(user.password_hash, null);
  assert.equal(user.role, 'student');
  assert.equal(user.status, 'active');
  assert.equal(user.managed_by, 'math-teacher');
  assert.equal(user.section_id, 'charity');
  const memberships = (await db.query('select * from public.subject_enrollments where student_id=$1 order by subject_id', [id])).rows;
  assert.deepEqual(memberships.map(row => [row.subject_id, row.teacher_id, row.status]), [['math', 'math-teacher', 'approved'], ['science', 'science-teacher', 'approved']]);
  assert.equal((await registry()).last_name, 'Dela Cruz');
  assert.ok((await registry()).code_used_at);
  assert.equal((await session()).completed_user_id, id);
  assert.equal((await session()).verification_token_hash, null);
});

test('a student may register before class assignment and receive classes afterwards', async () => {
  const id = await completed();
  const user = (await db.query('select managed_by,grade_level from public.users where id=$1', [id])).rows[0];
  assert.equal(user.managed_by, null);
  assert.equal(user.grade_level, '');
  assert.equal(await count('subject_enrollments'), 0);
  await assign();
  assert.equal(await count('subject_enrollments'), 2);
  await assign();
  assert.equal(await count('subject_enrollments'), 2);
  await db.query("insert into public.subject_enrollments(subject_id,teacher_id,student_id,status) values('other','science-teacher',$1,'pending')", [id]);
  await assign(['maria'], ['science']);
  assert.deepEqual((await db.query('select subject_id,status from public.subject_enrollments order by subject_id')).rows,
    [{ subject_id: 'other', status: 'pending' }, { subject_id: 'science', status: 'approved' }]);
  await assign(['maria'], []);
  assert.equal((await db.query('select count(*)::int as count from public.subject_enrollments where status=\'approved\'')).rows[0].count, 0);
});

test('unavailable assigned classes and teachers block a registration lease before Auth account creation', async () => {
  await verified(); await assign();
  await db.exec("update public.subjects set is_active=false where id='science'");
  await assert.rejects(begin(), /CLASS_UNAVAILABLE/);
  await db.exec("update public.subjects set is_active=true where id='science'; update public.users set status='suspended' where id='science-teacher'");
  await assert.rejects(begin(), /CLASS_UNAVAILABLE/);
  assert.equal((await session()).claim_id, null);
  assert.equal(await count('student_registry_claims'), 0);
  assert.equal((await db.query('select count(*)::int as count from auth.users')).rows[0].count, 3);
});

test('same claim can recover its owned Auth identity and renew after timeout while competing claims are blocked', async () => {
  await verified();
  await begin();
  await authUser();
  assert.equal((await begin()).authUserId, authId);
  await assert.rejects(createLink(true, hash('1')), /CLAIM_IN_PROGRESS/);
  await assert.rejects(rpc('code', ['head', 'maria', nonce, hash('2'), false]), /CLAIM_IN_PROGRESS/);
  await assert.rejects(rpc('code', ['head', 'maria', null, null, true]), /CLAIM_IN_PROGRESS/);
  assert.equal((await session()).claim_id, claimId);
  assert.equal((await registry()).code_hash, code);
  await assert.rejects(begin({ claimId: hash('1') }), /CLAIM_IN_PROGRESS/);
  await db.exec("update public.student_registry_sessions set claim_expires_at=now()-interval '1 second'");
  assert.equal((await begin()).authUserId, authId);
  assert.ok(new Date((await session()).claim_expires_at) > new Date());
  await finish();
});

test('parallel sessions cannot reserve competing identities for the same student', async () => {
  await verified();
  await verifyStudent({ ticket: hash('1') });
  await prepareEmail({ ticket: hash('1'), email: 'other@school.edu.ph' });
  await verifyEmail({ ticket: hash('1'), email: 'other@school.edu.ph' });
  const outcomes = await Promise.allSettled([begin(), begin({ ticket: hash('1'), email: 'other@school.edu.ph', claimId: hash('2') })]);
  assert.equal(outcomes.filter(value => value.status === 'fulfilled').length, 1);
  assert.match(outcomes.find(value => value.status === 'rejected').reason.message, /CLAIM_IN_PROGRESS/);
});

test('active username claims reserve case-insensitive names before any external Auth identity is created', async () => {
  await verified();
  await importStudents(records({ id: 'juan', firstName: 'Juan', lastName: 'Cruz', codeHash: hash('1') }));
  await verifyStudent({ name: 'Juan Cruz', code: hash('1'), ticket: hash('2') });
  await prepareEmail({ ticket: hash('2'), email: 'juan@school.edu.ph' });
  await verifyEmail({ ticket: hash('2'), email: 'juan@school.edu.ph' });
  await begin();
  await assert.rejects(begin({ ticket: hash('2'), email: 'juan@school.edu.ph', username: 'mARIA.sANTOS', claimId: hash('3') }), /USERNAME_TAKEN/);
  assert.equal(await count('users'), 3);
  assert.equal((await db.query('select count(*)::int as count from auth.users')).rows[0].count, 3);
});

test('a fresh code-verified session and email proof can recover an owned Auth orphan after reload and rotation', async () => {
  await verified(); await begin(); await authUser();
  await db.exec("update public.student_registry_sessions set claim_expires_at=now()-interval '1 second'");
  await rpc('code', ['head', 'maria', nonce, hash('1'), false]);
  await createLink(true, hash('2'));
  assert.equal((await session()).claim_id, claimId);
  const next = { link: hash('2'), code: hash('1'), ticket: hash('3'), claimId: hash('4') };
  await verifyStudent(next);
  await prepareEmail(next);
  await verifyEmail(next);
  const recovery = await begin(next);
  assert.equal(recovery.authUserId, authId);
  assert.equal(recovery.authNeedsRebind, true);
  assert.equal(recovery.claimId, next.claimId);
  // A failed Auth metadata update must not erase ownership of the old claim.
  const retried = await begin(next);
  assert.equal(retried.authUserId, authId);
  assert.equal(retried.authNeedsRebind, true);
  await assert.rejects(finish({ ticket: next.ticket, claimId: next.claimId }), /AUTH_IDENTITY_INVALID/);
  await db.query('update auth.users set raw_app_meta_data=$1::jsonb where id=$2', [JSON.stringify({ student_registry_id: 'maria', registry_claim_id: next.claimId }), authId]);
  const id = await finish({ ticket: next.ticket, claimId: next.claimId });
  assert.equal((await registry()).student_id, id);
  assert.equal(await count('users'), 4);
});

test('resending email verification in the same session never erases durable Auth ownership', async () => {
  await verified(); await begin(); await authUser();
  await db.exec("update public.student_registry_sessions set claim_expires_at=now()-interval '1 second', email_code_sent_at=now()-interval '61 seconds'");
  await prepareEmail();
  assert.equal((await session()).claim_id, null);
  assert.equal(await count('student_registry_claims'), 1);
  await verifyEmail();
  assert.equal((await begin()).authUserId, authId);
  await finish();
});

test('Auth metadata without its matching durable ownership ledger cannot claim an existing identity', async () => {
  await createLink(); await importStudents(); await verifyStudent();
  await authUser();
  await assert.rejects(prepareEmail(), /EMAIL_TAKEN/);
  await db.query('delete from auth.users where id=$1', [authId]);
  await prepareEmail(); await verifyEmail();
  await authUser();
  await assert.rejects(begin(), /EMAIL_TAKEN/);
  assert.equal((await session()).claim_id, null);
});

test('Auth ownership and confirmed email are checked independently of user-controlled metadata', async () => {
  await verified(); await begin();
  await authUser({ confirmed: false });
  await assert.rejects(finish(), /AUTH_EMAIL_UNVERIFIED/);
  await db.query("update auth.users set email_confirmed_at=now(),raw_app_meta_data='{}' where id=$1", [authId]);
  await assert.rejects(finish(), /AUTH_IDENTITY_INVALID/);
  await assert.rejects(begin(), /EMAIL_TAKEN/);
  assert.equal((await registry()).student_id, null);
  assert.equal(await count('users'), 3);
});

test('completion and same-claim retries are atomic and single-use', async () => {
  await verified(); await assign(); await begin(); await authUser();
  const outcomes = await Promise.all([finish(), finish(), finish()]);
  assert.equal(new Set(outcomes).size, 1);
  assert.equal(await count('users'), 4);
  assert.equal(await count('subject_enrollments'), 2);
  assert.equal((await begin()).userId, outcomes[0]);
  await assert.rejects(begin({ claimId: hash('1') }), /CLAIM_INVALID/);
  await assert.rejects(verifyStudent({ ticket: hash('1') }), /STUDENT_REGISTERED/);
  await assert.rejects(rpc('code', ['head', 'maria', nonce, hash('1'), false]), /STUDENT_REGISTERED/);
});

test('deleting a registered public account never makes its consumed registry code reusable', async () => {
  const id = await completed();
  await db.query('delete from public.users where id=$1', [id]);
  assert.equal((await registry()).student_id, null);
  assert.ok((await registry()).code_used_at);
  await assert.rejects(rpc('code', ['head', 'maria', nonce, hash('1'), false]), /STUDENT_REGISTERED/);
  await assert.rejects(verifyStudent({ ticket: hash('1') }), /STUDENT_REGISTERED/);
});

test('failed membership insertion rolls back public account, consumption and completion but preserves retryable Auth ownership', async () => {
  await verified(); await assign(); await begin(); await authUser();
  await db.exec('alter table public.subject_enrollments add constraint test_registry_membership_failure check(false) not valid');
  try {
    await assert.rejects(finish(), /test_registry_membership_failure/);
    assert.equal(await count('users'), 3);
    assert.equal((await registry()).student_id, null);
    assert.equal((await registry()).code_used_at, null);
    assert.equal((await session()).completed_user_id, null);
    assert.equal((await begin()).authUserId, authId);
  } finally {
    await db.exec('alter table public.subject_enrollments drop constraint test_registry_membership_failure');
  }
  await finish();
  assert.equal(await count('subject_enrollments'), 2);
});

test('global case-insensitive email and username conflicts preserve the unconsumed registration', async () => {
  await verified();
  await assert.rejects(begin({ username: 'HEADTEACHER' }), /USERNAME_TAKEN/);
  await authUser({ registryId: 'other-record' });
  await assert.rejects(begin(), /EMAIL_TAKEN/);
  await db.query('delete from auth.users where id=$1', [authId]);
  await begin(); await authUser();
  await db.exec("insert into public.users(id,name,email,username,role) values('conflict','Teacher Two','teacher2@gmail.com','mARIA.sANTOS','teacher')");
  await assert.rejects(finish(), /USERNAME_TAKEN/);
  assert.equal((await registry()).code_used_at, null);
});

test('code revocation, regeneration and shared-link rotation invalidate outstanding sessions', async () => {
  await verified();
  await rpc('code', ['head', 'maria', null, null, true]);
  await assert.rejects(verifyStudent({ ticket: hash('1') }), /CODE_REVOKED/);
  await assert.rejects(begin(), /SESSION_INVALID/);
  await rpc('code', ['head', 'maria', nonce, hash('1'), false]);
  await assert.rejects(verifyStudent(), /CODE_INVALID/);
  await verifyStudent({ code: hash('1') });
  await createLink(true, hash('2'));
  await assert.rejects(verifyStudent({ code: hash('1'), ticket: hash('3') }), /INVITATION_INVALID/);
  await assert.rejects(rpc('prepare_email', [hash('2'), ticket, email, otp, 'email-challenge-0001']), /SESSION_INVALID/);
  const same = await createLink(false, hash('4'));
  assert.equal(same.token_hash, hash('2'));
});

test('expired code, link, session, code challenge and claim each block their corresponding operation', async () => {
  await verified();
  await db.exec("update public.student_registry set code_expires_at=now()-interval '1 second'");
  await assert.rejects(begin(), /CODE_EXPIRED/);
  await db.exec("update public.student_registry set code_expires_at=now()+interval '1 day'; update public.student_registry_links set expires_at=now()-interval '1 second'");
  await assert.rejects(begin(), /INVITATION_EXPIRED/);
  await db.exec("update public.student_registry_links set expires_at=now()+interval '1 day'; update public.student_registry_sessions set expires_at=now()-interval '1 second'");
  await assert.rejects(begin(), /SESSION_EXPIRED/);
  await db.exec("update public.student_registry_sessions set expires_at=now()+interval '20 minutes'");
  await begin(); await authUser();
  await db.exec("update public.student_registry_sessions set claim_expires_at=now()-interval '1 second'");
  await assert.rejects(finish(), /CLAIM_INVALID/);
  await begin(); await finish();
});

test('RLS limits teacher directories to assigned classes, HT to school-wide metadata and students to themselves', async () => {
  const id = await completed();
  await importStudents(records({ id: 'juan', firstName: 'Juan', lastName: 'Cruz', codeHash: hash('1') }));
  await assign(['maria'], ['math']); await assign(['juan'], ['science']);
  assert.deepEqual((await asViewer(mathAuth, 'select id,full_name from public.student_registry order by id')).rows.map(row => row.id), ['maria']);
  assert.deepEqual((await asViewer(scienceAuth, 'select id from public.student_registry order by id')).rows.map(row => row.id), ['juan']);
  assert.equal((await asViewer(headAuth, 'select id from public.student_registry')).rows.length, 2);
  assert.deepEqual((await asViewer(authId, 'select student_id from public.student_registry')).rows, [{ student_id: id }]);
  await assert.rejects(asViewer(mathAuth, 'select code_hash from public.student_registry'), /permission denied/);
  await assert.rejects(asViewer(headAuth, 'select * from public.student_registry_sessions'), /permission denied/);
  await assert.rejects(asViewer(headAuth, 'select * from public.student_registry_claims'), /permission denied/);
  await assert.rejects(asViewer(headAuth, "update public.student_registry set full_name='Changed'"), /permission denied/);
  await db.exec("update public.users set status='suspended' where id='math-teacher'");
  assert.equal((await asViewer(mathAuth, 'select id from public.student_registry')).rows.length, 0);
});

test('legacy student identity changes synchronize without re-adding a removed class', async () => {
  await importStudents();
  await assign();
  await db.exec("insert into public.users(id,name,email,username,role,password_hash) values('legacy','Maria Santos','maria@gmail.com','legacy','student','keep-local-hash')");
  assert.equal((await registry()).student_id, 'legacy');
  assert.ok((await registry()).code_used_at);
  assert.equal(await count('student_registry_assignments'), 2);
  assert.equal(await count('subject_enrollments'), 2);
  await db.exec("delete from public.subject_enrollments where student_id='legacy'; update public.users set name='Maria Clara Santos' where id='legacy'");
  assert.equal((await registry()).full_name, 'Maria Clara Santos');
  assert.equal(await count('student_registry_assignments'), 0);
  assert.equal((await db.query("select password_hash,auth_provider from public.users where id='legacy'")).rows[0].password_hash, 'keep-local-hash');
});

test('a registered student cannot rename itself into another pending registry identity', async () => {
  const id = await completed();
  await importStudents(records({ id: 'juan', firstName: 'Juan', lastName: 'Cruz', codeHash: hash('1') }));
  await assert.rejects(db.query('update public.users set name=$1 where id=$2', ['Juan Cruz', id]), /student_registry_normalized_name_key/);
  assert.equal((await registry()).full_name, 'Maria Santos');
  assert.equal((await registry('juan')).student_id, null);
  assert.equal((await db.query('select name from public.users where id=$1', [id])).rows[0].name, 'Maria Santos');
});

test('legacy roster reservations and central imports cannot reserve the same name in either direction', async () => {
  await db.exec(`insert into public.class_invitations(id,subject_id,teacher_id,token_hash,expires_at)
    values('legacy-link','math','math-teacher','${hash('9')}',now()+interval '1 day');
    insert into public.class_registration_students(id,invitation_id,teacher_id,full_name,normalized_name,section_id,section_name)
      values('legacy-roster','legacy-link','math-teacher','Juan Cruz','juan cruz','charity','Charity');`);
  await assert.rejects(importStudents(records({ firstName: 'Juan', lastName: 'Cruz' })), /REGISTRY_DUPLICATE/);
  await importStudents();
  await assert.rejects(db.exec(`insert into public.class_registration_students(id,invitation_id,teacher_id,full_name,normalized_name,section_id,section_name)
    values('duplicate','legacy-link','math-teacher','Maria Santos','maria santos','charity','Charity')`), /REGISTRY_DUPLICATE/);
  assert.equal(await count('student_registry'), 2);
});

test('RPC privileges, provider constraints and safe reruns preserve existing registered accounts and assignments', async () => {
  const id = await completed(); await assign();
  await db.exec(migration('019_student_registry.sql'));
  assert.equal((await registry()).student_id, id);
  assert.equal(await count('subject_enrollments'), 2);
  assert.equal(await count('student_registry_assignments'), 2);
  const signatures = ['student_registry_link(text,text,text,boolean,integer)', 'student_registry_import(text,jsonb)',
    'student_registry_owned_auth(uuid,text,text)',
    'student_registry_code(text,text,text,text,boolean)', 'student_registry_assign(text,text[],text[])',
    'student_registry_verify(text,text,text)', 'student_registry_prepare_email(text,text,text,text,text)',
    'student_registry_verify_email(text,text,text,text,text,text)', 'student_registry_begin(text,text,text,text,text,text)',
    'student_registry_finish(text,text,uuid)'];
  for (const signature of signatures) {
    for (const role of ['anon', 'authenticated', 'service_role']) {
      const result = (await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, `public.${signature}`])).rows[0];
      assert.equal(result.allowed, role === 'service_role');
    }
  }
  const ledgerPrivileges = (await db.query(`select
    has_table_privilege('authenticated','public.student_registry_claims','SELECT') as browser_read,
    has_table_privilege('service_role','public.student_registry_claims','SELECT,INSERT') as backend_read_insert,
    has_table_privilege('service_role','public.student_registry_claims','UPDATE,DELETE') as backend_mutate,
    (select relrowsecurity from pg_class where oid='public.student_registry_claims'::regclass) as rls`)).rows[0];
  assert.deepEqual(ledgerPrivileges, { browser_read: false, backend_read_insert: true, backend_mutate: false, rls: true });
  await assert.rejects(db.exec("insert into public.users(name,email,username,role,auth_provider) values('Invalid','invalid@gmail.com','invalid','teacher','supabase')"), /users_auth_provider_check/);
  await assert.rejects(db.exec("update public.users set password_hash='local-password' where auth_provider='supabase'"), /users_auth_provider_check/);
  await db.exec('set role anon');
  try { await assert.rejects(db.query('select id from public.student_registry'), /permission denied/); }
  finally { await db.exec('reset role'); }
});
