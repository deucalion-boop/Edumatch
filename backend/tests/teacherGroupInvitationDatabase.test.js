const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

// Real migration/RPC execution in a disposable PostgreSQL instance.
let db;
const token = 'a'.repeat(64);
const rotatedToken = 'b'.repeat(64);
const nonce = '3de5db14-c7a1-4163-a335-67230c5aa1a3';
const passwordHash = '$2b$12$' + 'A'.repeat(53);
const maria = { email: 'maria@school.edu.ph', challenge: 'maria-challenge-0001', code: 'c'.repeat(64), proof: 'd'.repeat(64), username: 'Maria.Santos' };
const juan = { email: 'juan@school.edu.ph', challenge: 'juan-challenge-00001', code: 'e'.repeat(64), proof: 'f'.repeat(64), username: 'Juan.Cruz' };
const migration = (file) => fs.readFileSync(path.join(__dirname, '../supabase/migrations', file), 'utf8');
async function rpc(name, values) {
  return (await db.query(`select public.${name}(${values.map((_value, index) => `$${index + 1}`).join(',')}) as value`, values)).rows[0].value;
}
function create(overrides = {}) {
  const value = { owner: 'head', id: 'group', nonce, token, hours: 48, ...overrides };
  return rpc('create_teacher_group_invitation', [value.owner, value.id, value.nonce, value.token, value.hours]);
}
const prepare = (person = maria, hash = token) => rpc('prepare_teacher_group_email', [hash, person.email, person.code, person.challenge]);
const verify = (person = maria, hash = token) => rpc('verify_teacher_group_email', [hash, person.email, person.challenge, person.code, person.proof]);
const register = (person = maria, hash = token) => rpc('register_teacher_group_invitation', [hash, 'Teacher Name', person.email, person.username, passwordHash, person.proof]);
const renew = (owner = 'head', hash = rotatedToken, hours = 48) => rpc('renew_teacher_group_invitation', [owner, 'group', nonce, hash, hours]);
const revoke = (owner = 'head') => rpc('revoke_teacher_group_invitation', [owner, 'group']);
const parent = async () => (await db.query("select * from public.teacher_invitations where id='group'")).rows[0];
const claim = async (person = maria) => (await db.query('select * from public.teacher_invitation_registrations where invitation_id=$1 and email=$2', ['group', person.email.toLowerCase()])).rows[0];
const count = async (table) => Number((await db.query(`select count(*) as count from public.${table}`)).rows[0].count);
async function verified(person = maria) { await prepare(person); assert.equal((await verify(person)).verified, true); }

test.before(async () => {
  db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  for (const file of ['001_create_users.sql', '017_teacher_invitations.sql', '018_teacher_group_invitations.sql', '024_teacher_link_activation.sql']) await db.exec(migration(file));
});
test.after(async () => { if (db) await db.close(); });
test.beforeEach(async () => {
  await db.exec(`truncate public.users cascade;
    insert into public.users(id,name,email,username,role,status,department) values
      ('head','Head Teacher','head@gmail.com','headteacher','headteacher','active','Mathematics'),
      ('other','Other Head','other@gmail.com','otherhead','headteacher','active','Science');`);
});

test('one reusable group link is returned for repeated and concurrent department requests', async () => {
  const results = await Promise.all(Array.from({ length: 4 }, (_value, index) => create({ id: `candidate${index}`, token: String(index).repeat(64) })));
  assert.equal(new Set(results.map((value) => value.id)).size, 1);
  assert.equal(new Set(results.map((value) => value.token_hash)).size, 1);
  assert.equal(results[0].is_group, true);
  assert.equal(results[0].department, 'Mathematics');
  assert.equal(results[0].registration_count, 0);
  assert.equal(new Date(results[0].expires_at) - new Date(results[0].created_at), 48 * 3600000);
  assert.equal(await count('teacher_invitations'), 1);
  assert.equal(await count('users'), 2);
});

test('shared activation form registers teachers without email codes and fixes their role, department and manager', async () => {
  await create();
  const id = await rpc('activate_teacher_link', [token, 'Maria Santos', maria.email, maria.username, passwordHash]);
  const user = (await db.query('select * from public.users where id=$1', [id])).rows[0];
  assert.equal(user.role, 'teacher');
  assert.equal(user.status, 'active');
  assert.equal(user.department, 'Mathematics');
  assert.equal(user.managed_by, 'head');
  assert.equal((await parent()).registration_count, 1);
  assert.equal((await claim(maria)).accepted_user_id, id);
  await assert.rejects(rpc('activate_teacher_link', [token, 'Maria Santos', maria.email, 'other.username', passwordHash]), /EMAIL_TAKEN/);
});

test('single-use activation validates the bound email and cannot be replayed', async () => {
  await rpc('create_teacher_invitation', ['head', 'individual', nonce, token, 'Maria Santos', maria.email, 48]);
  await assert.rejects(rpc('activate_teacher_link', [token, 'Juan Cruz', juan.email, juan.username, passwordHash]), /EMAIL_MISMATCH/);
  await rpc('activate_teacher_link', [token, 'Maria Santos', maria.email, maria.username, passwordHash]);
  await assert.rejects(rpc('activate_teacher_link', [token, 'Juan Cruz', maria.email, juan.username, passwordHash]), /INVITATION_ACCEPTED/);
});

test('code-free activation still rejects expired, revoked and unavailable-issuer links', async () => {
  await create();
  await db.exec("update public.teacher_invitations set expires_at=now()-interval '1 second'");
  await assert.rejects(rpc('activate_teacher_link', [token, 'Maria Santos', maria.email, maria.username, passwordHash]), /INVITATION_EXPIRED/);
  await db.exec("update public.teacher_invitations set expires_at=now()+interval '1 day', status='revoked'");
  await assert.rejects(rpc('activate_teacher_link', [token, 'Maria Santos', maria.email, maria.username, passwordHash]), /INVITATION_REVOKED/);
  await db.exec("update public.teacher_invitations set status='pending'; update public.users set status='inactive' where id='head'");
  await assert.rejects(rpc('activate_teacher_link', [token, 'Maria Santos', maria.email, maria.username, passwordHash]), /ISSUER_UNAVAILABLE/);
});

test('independent teachers verify their own emails and create accounts from the same live link', async () => {
  await create();
  const [first, second] = await Promise.all([prepare(maria), prepare(juan)]);
  assert.notEqual(first.id, second.id);
  assert.equal(first.email, maria.email);
  assert.equal(first.token_hash, token);
  assert.equal(first.email_challenge_id, maria.challenge);
  assert.ok(first.email_code_sent_at);
  assert.ok(first.email_code_expires_at);
  await assert.rejects(register(maria), /EMAIL_VERIFICATION_REQUIRED/);
  assert.equal((await verify(maria)).verified, true);
  await assert.rejects(register({ ...juan, proof: maria.proof }), /EMAIL_VERIFICATION_REQUIRED/);
  assert.equal((await verify(juan)).verified, true);
  const ids = await Promise.all([register(maria), register(juan)]);
  assert.notEqual(ids[0], ids[1]);
  const users = (await db.query("select * from public.users where role='teacher'")).rows;
  assert.equal(users.length, 2);
  for (const user of users) {
    assert.equal(user.role, 'teacher');
    assert.equal(user.status, 'active');
    assert.equal(user.managed_by, 'head');
    assert.equal(user.department, 'Mathematics');
    assert.equal(user.subject, 'Mathematics');
    assert.equal(user.force_password_change, false);
    assert.equal(user.password_hash, passwordHash);
  }
  const link = await parent();
  assert.equal(link.status, 'pending');
  assert.equal(link.accepted_at, null);
  assert.equal(link.accepted_user_id, null);
  assert.equal(link.registration_count, 2);
  assert.equal((await claim()).status, 'accepted');
  assert.equal((await claim()).verification_token_hash, null);
});

test('bad codes and cooldowns affect only that teacher, including overlapping attempts', async () => {
  await create();
  await prepare(maria);
  await prepare(juan);
  await assert.rejects(prepare(maria), /INVITATION_COOLDOWN/);
  const outcomes = await Promise.all([
    verify({ ...maria, code: '0'.repeat(64) }),
    verify(juan),
    verify({ ...maria, code: '0'.repeat(64) }),
  ]);
  assert.equal(outcomes[0].code, 'EMAIL_CODE_INVALID');
  assert.equal(outcomes[1].verified, true);
  assert.equal(outcomes[2].code, 'EMAIL_CODE_INVALID');
  assert.equal((await claim(maria)).email_code_attempts, 2);
  assert.equal((await claim(juan)).email_code_attempts, 0);
  for (let attempt = 3; attempt <= 5; attempt += 1) await verify({ ...maria, code: '0'.repeat(64) });
  assert.equal((await verify(maria)).code, 'EMAIL_CODE_LOCKED');
  await register(juan);
  assert.equal((await parent()).registration_count, 1);
  await db.query("update public.teacher_invitation_registrations set email_code_sent_at=now()-interval '61 seconds' where email=$1", [maria.email]);
  await verified(maria);
  await register(maria);
  assert.equal((await parent()).registration_count, 2);
});

test('claim lookup is case-insensitive and a teacher email cannot reuse a consumed proof or create another account', async () => {
  await create();
  await verified({ ...maria, email: maria.email.toUpperCase() });
  const outcomes = await Promise.allSettled([register(maria), register({ ...maria, username: 'Another.Name' })]);
  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.match(outcomes.find((result) => result.status === 'rejected').reason.message, /EMAIL_TAKEN/);
  for (const action of [prepare, verify, register]) await assert.rejects(action(maria), /EMAIL_TAKEN/);
  assert.equal(await count('teacher_invitation_registrations'), 1);
  assert.equal((await parent()).registration_count, 1);
  await db.query('delete from public.users where id=$1', [(await claim()).accepted_user_id]);
  assert.equal((await claim()).accepted_user_id, null);
  await assert.rejects(prepare(maria), /EMAIL_TAKEN/);
});

test('resend rotates the shared link and invalidates every outstanding proof while retaining accepted history', async () => {
  await create();
  await verified(maria);
  await register(maria);
  await verified(juan);
  await assert.rejects(renew(), /INVITATION_COOLDOWN/);
  await db.exec("update public.teacher_invitations set last_renewed_at=now()-interval '61 seconds'");
  const updated = await renew('head', rotatedToken, 24);
  assert.equal(updated.token_hash, rotatedToken);
  assert.equal(updated.registration_count, 1);
  assert.equal(new Date(updated.expires_at) - new Date(updated.last_renewed_at), 24 * 3600000);
  assert.equal((await claim(maria)).status, 'accepted');
  assert.equal(await claim(juan), undefined);
  await assert.rejects(register(juan), /INVITATION_INVALID/);
  await assert.rejects(register(juan, rotatedToken), /EMAIL_VERIFICATION_REQUIRED/);
  await prepare(juan, rotatedToken);
  await verify(juan, rotatedToken);
  await register(juan, rotatedToken);
  assert.equal((await parent()).registration_count, 2);
});

test('creating an expired group link renews its stable ID and clears pending claims', async () => {
  await create();
  await verified(maria);
  await db.exec("update public.teacher_invitations set expires_at=now()-interval '1 second'");
  await assert.rejects(create({ id: 'unrelated-new-id', token: rotatedToken }), /INPUT_INVALID/);
  const updated = await create({ token: rotatedToken, hours: 12 });
  assert.equal(updated.id, 'group');
  assert.equal(updated.token_hash, rotatedToken);
  assert.equal(new Date(updated.expires_at) - new Date(updated.last_renewed_at), 12 * 3600000);
  assert.equal(await count('teacher_invitations'), 1);
  assert.equal(await count('teacher_invitation_registrations'), 0);
  await assert.rejects(register(maria, rotatedToken), /EMAIL_VERIFICATION_REQUIRED/);
});

test('revocation removes outstanding claims, keeps accepted accounts and permits a fresh group invitation', async () => {
  await create();
  await verified(maria);
  await register(maria);
  await verified(juan);
  const revoked = await revoke();
  assert.equal(revoked.status, 'revoked');
  assert.equal((await revoke()).revoked_at, revoked.revoked_at);
  assert.equal(await claim(juan), undefined);
  assert.equal((await claim(maria)).status, 'accepted');
  for (const action of [prepare, verify, register]) await assert.rejects(action(juan), /INVITATION_REVOKED/);
  await assert.rejects(renew(), /INVITATION_REVOKED/);
  assert.equal(await count('users'), 3);
  const fresh = await create({ id: 'fresh-group', token: rotatedToken });
  assert.equal(fresh.id, 'fresh-group');
  assert.equal(fresh.registration_count, 0);
  assert.equal(await count('teacher_invitations'), 2);
});

test('expiry, issuer deactivation and department changes block all teachers without consuming their claims', async () => {
  await create();
  await verified(maria);
  await verified(juan);
  await db.exec("update public.teacher_invitations set expires_at=now()-interval '1 second'");
  for (const person of [maria, juan]) {
    for (const action of [prepare, verify, register]) await assert.rejects(action(person), /INVITATION_EXPIRED/);
  }
  await db.exec("update public.teacher_invitations set expires_at=now()+interval '1 day'");
  for (const patch of ["status='suspended'", "archive='{\"isArchived\":true}'", "role='teacher'", "department='English'"]) {
    await db.exec(`update public.users set ${patch} where id='head'`);
    for (const action of [prepare, verify, register, renew, revoke]) await assert.rejects(action(), /ISSUER_UNAVAILABLE/);
    await db.exec("update public.users set status='active',archive='{}',role='headteacher',department='Mathematics' where id='head'");
  }
  assert.equal((await claim(maria)).verification_token_hash, maria.proof);
  assert.equal((await claim(juan)).verification_token_hash, juan.proof);
  assert.equal(await count('users'), 2);
});

test('only the owning active Head Teacher can manage a group and role/expiry bounds apply to creation', async () => {
  await create();
  await assert.rejects(renew('other'), /INVITATION_INVALID/);
  await assert.rejects(revoke('other'), /INVITATION_INVALID/);
  for (const overrides of [{ owner: 'missing' }, { hours: 0 }, { hours: 49 }, { token: 'invalid' }]) {
    await assert.rejects(create(overrides), /ISSUER_UNAVAILABLE|INPUT_INVALID/);
  }
  await db.exec("update public.users set role='teacher' where id='other'");
  await assert.rejects(create({ owner: 'other', id: 'other-group', token: rotatedToken }), /ISSUER_UNAVAILABLE/);
  assert.equal(await count('teacher_invitations'), 1);
});

test('code expiry, proof expiry and copied proofs remain per email', async () => {
  await create();
  await prepare(maria);
  await verified(juan);
  await db.query("update public.teacher_invitation_registrations set email_code_expires_at=now()-interval '1 second' where email=$1", [maria.email]);
  assert.equal((await verify(maria)).code, 'EMAIL_CODE_EXPIRED');
  await assert.rejects(register({ ...maria, proof: juan.proof }), /EMAIL_VERIFICATION_REQUIRED/);
  await db.query("update public.teacher_invitation_registrations set email_verified_expires_at=now()-interval '1 second' where email=$1", [juan.email]);
  await assert.rejects(register(juan), /EMAIL_VERIFICATION_REQUIRED/);
  assert.equal((await parent()).registration_count, 0);
});

test('global case-insensitive duplicate conflicts and insert failures roll back only the registering claim', async () => {
  await create();
  await verified(maria);
  await verified(juan);
  await assert.rejects(register({ ...maria, username: 'HEADTEACHER' }), /USERNAME_TAKEN/);
  await db.query("insert into public.users(id,name,email,username,role) values('taken','Taken',$1,'taken','student')", [maria.email.toUpperCase()]);
  await assert.rejects(register(maria), /EMAIL_TAKEN/);
  await db.exec("delete from public.users where id='taken'; alter table public.users add constraint test_group_insert_failure check(role<>'teacher') not valid");
  try {
    await assert.rejects(register(maria), /test_group_insert_failure/);
    assert.equal((await claim(maria)).verification_token_hash, maria.proof);
    assert.equal((await claim(juan)).verification_token_hash, juan.proof);
    assert.equal((await parent()).registration_count, 0);
    assert.equal(await count('users'), 2);
  } finally {
    await db.exec('alter table public.users drop constraint test_group_insert_failure');
  }
  await register(maria);
  await register(juan);
  assert.equal((await parent()).registration_count, 2);
});

test('legacy individual RPCs reject group links and group RPCs reject individual links', async () => {
  await create();
  const oldCalls = [
    ['renew_teacher_invitation', ['head', 'group', nonce, rotatedToken, 48]],
    ['revoke_teacher_invitation', ['head', 'group']],
    ['prepare_teacher_invitation_email', [token, maria.email, maria.code, maria.challenge]],
    ['verify_teacher_invitation_email', [token, maria.email, maria.challenge, maria.code, maria.proof]],
    ['register_teacher_invitation', [token, 'Maria Santos', maria.email, maria.username, passwordHash, maria.proof]],
  ];
  for (const [name, values] of oldCalls) await assert.rejects(rpc(name, values), /INVITATION_INVALID/);
  await rpc('create_teacher_invitation', ['head', 'individual', nonce, rotatedToken, '', '', 48]);
  for (const action of [prepare, verify, register]) await assert.rejects(action(maria, rotatedToken), /INVITATION_INVALID/);
  await assert.rejects(rpc('renew_teacher_group_invitation', ['head', 'individual', nonce, '0'.repeat(64), 48]), /INVITATION_INVALID/);
  await assert.rejects(rpc('revoke_teacher_group_invitation', ['head', 'individual']), /INVITATION_INVALID/);
  assert.equal((await parent()).status, 'pending');
});

test('the original individual link still verifies and accepts exactly once through its protected wrappers', async () => {
  await rpc('create_teacher_invitation', ['head', 'individual', nonce, token, 'Maria Santos', maria.email, 48]);
  await rpc('prepare_teacher_invitation_email', [token, maria.email, maria.code, maria.challenge]);
  assert.equal((await rpc('verify_teacher_invitation_email', [token, maria.email, maria.challenge, maria.code, maria.proof])).verified, true);
  await db.exec('set role service_role');
  try {
    await rpc('register_teacher_invitation', [token, 'Maria Santos', maria.email, maria.username, passwordHash, maria.proof]);
  } finally {
    await db.exec('reset role');
  }
  await assert.rejects(rpc('register_teacher_invitation', [token, 'Maria Santos', maria.email, maria.username, passwordHash, maria.proof]), /INVITATION_ACCEPTED/);
  assert.equal((await db.query("select status,is_group from public.teacher_invitations where id='individual'")).rows[0].status, 'accepted');
  assert.equal(await count('users'), 3);
});

test('browser roles cannot access claims or group RPCs; migration can rerun without losing accepted history', async () => {
  await create();
  await verified(maria);
  await register(maria);
  await db.exec(migration('018_teacher_group_invitations.sql'));
  const signatures = ['teacher_group_invitation_parent(text)',
    'create_teacher_group_invitation(text,text,text,text,integer)', 'renew_teacher_group_invitation(text,text,text,text,integer)',
    'revoke_teacher_group_invitation(text,text)', 'prepare_teacher_group_email(text,text,text,text)',
    'verify_teacher_group_email(text,text,text,text,text)', 'register_teacher_group_invitation(text,text,text,text,text,text)'];
  for (const role of ['anon', 'authenticated']) {
    assert.equal((await db.query("select has_table_privilege($1,'public.teacher_invitation_registrations','SELECT,INSERT,UPDATE,DELETE') as allowed", [role])).rows[0].allowed, false);
    for (const signature of signatures) assert.equal((await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, `public.${signature}`])).rows[0].allowed, false);
  }
  for (const signature of signatures) assert.equal((await db.query("select has_function_privilege('service_role',$1,'EXECUTE') as allowed", [`public.${signature}`])).rows[0].allowed, true);
  for (const signature of ['teacher_individual_register(text,text,text,text,text,text)', 'teacher_invitation_assert_individual(text,text)']) {
    assert.equal((await db.query("select has_function_privilege('service_role',$1,'EXECUTE') as allowed", [`public.${signature}`])).rows[0].allowed, false);
  }
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.teacher_invitation_registrations'::regclass")).rows[0].relrowsecurity, true);
  assert.equal((await parent()).registration_count, 1);
  assert.equal((await claim()).status, 'accepted');
  await verified(juan);
  await register(juan);
  assert.equal((await parent()).registration_count, 2);
});
