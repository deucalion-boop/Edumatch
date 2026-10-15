const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

// Exercise the production atomic RPCs in disposable PostgreSQL, never the live DB.
let db;
const token = 'a'.repeat(64);
const nextToken = 'b'.repeat(64);
const code = 'c'.repeat(64);
const proof = 'd'.repeat(64);
const nonce = '3de5db14-c7a1-4163-a335-67230c5aa1a3';
const challenge = 'c8742afd-1560-49e5-8f8e-b90232e2f004';
const email = 'maria.santos@school.edu.ph';
const passwordHash = '$2b$12$' + 'A'.repeat(53);
const migrationPath = path.join(__dirname, '../supabase/migrations/017_teacher_invitations.sql');
async function rpc(name, values) {
  const placeholders = values.map((_value, index) => `$${index + 1}`).join(',');
  return (await db.query(`select public.${name}(${placeholders}) as value`, values)).rows[0].value;
}
const create = (overrides = {}) => {
  const value = { owner: 'head', id: 'invitation', nonce, token, name: 'Maria Santos', email: '', hours: 48, ...overrides };
  return rpc('create_teacher_invitation', [value.owner, value.id, value.nonce, value.token, value.name, value.email, value.hours]);
};
const prepare = (overrides = {}) => {
  const value = { token, email, code, challenge, ...overrides };
  return rpc('prepare_teacher_invitation_email', [value.token, value.email, value.code, value.challenge]);
};
const verify = (overrides = {}) => {
  const value = { token, email, challenge, code, proof, ...overrides };
  return rpc('verify_teacher_invitation_email', [value.token, value.email, value.challenge, value.code, value.proof]);
};
const register = (overrides = {}) => {
  const value = { token, name: 'Maria Santos', email, username: 'Maria.Santos', passwordHash, proof, ...overrides };
  return rpc('register_teacher_invitation', [value.token, value.name, value.email, value.username, value.passwordHash, value.proof]);
};
const renew = (owner = 'head', hours = 48) => rpc('renew_teacher_invitation', [owner, 'invitation', nonce, nextToken, hours]);
const revoke = (owner = 'head') => rpc('revoke_teacher_invitation', [owner, 'invitation']);
const row = async () => (await db.query("select * from public.teacher_invitations where id='invitation'")).rows[0];
const userCount = async () => Number((await db.query('select count(*) as count from public.users')).rows[0].count);
async function verifiedInvitation(overrides = {}) {
  await create(overrides);
  await prepare();
  assert.equal((await verify()).verified, true);
}
test.before(async () => {
  db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/001_create_users.sql'), 'utf8'));
  await db.exec(fs.readFileSync(migrationPath, 'utf8'));
});
test.after(async () => { if (db) await db.close(); });
test.beforeEach(async () => {
  await db.exec(`truncate public.users cascade;
    insert into public.users(id,name,email,username,role,status,department) values
      ('head','Head Teacher','head@gmail.com','headteacher','headteacher','active','Mathematics'),
      ('other','Other Head','other@gmail.com','otherhead','headteacher','active','Science');`);
});

test('creation snapshots the authorized department, expires in 48 hours and creates no account', async () => {
  const invitation = await create({ email: ' Maria.Santos@School.edu.ph ' });
  assert.equal(invitation.department, 'Mathematics');
  assert.equal(invitation.email, email);
  assert.equal(invitation.status, 'pending');
  assert.equal(invitation.delivery_status, 'not_sent');
  assert.equal(new Date(invitation.expires_at) - new Date(invitation.created_at), 48 * 3600000);
  assert.equal(await userCount(), 2);
});

test('creation rejects unauthorized issuers and invalid lifetimes, tokens and email without writes', async () => {
  for (const overrides of [{ owner: 'missing' }, { hours: 0 }, { hours: 49 }, { hours: null },
    { token: 'not-a-hash' }, { nonce: 'short' }, { email: 'maria@school..edu.ph' }, { email: 'maria@school.edu.ph\n' }]) {
    await assert.rejects(create(overrides), /ISSUER_UNAVAILABLE|INPUT_INVALID/);
  }
  await db.exec("update public.users set role='teacher' where id='head'");
  await assert.rejects(create(), /ISSUER_UNAVAILABLE/);
  assert.equal((await db.query('select count(*)::int as count from public.teacher_invitations')).rows[0].count, 0);
});

test('registration atomically creates the active teacher with its issuer and consumes the verified invitation', async () => {
  await verifiedInvitation();
  const id = await register();
  const user = (await db.query('select * from public.users where id=$1', [id])).rows[0];
  assert.equal(user.role, 'teacher');
  assert.equal(user.status, 'active');
  assert.equal(user.managed_by, 'head');
  assert.equal(user.department, 'Mathematics');
  assert.equal(user.subject, 'Mathematics');
  assert.equal(user.email, email);
  assert.equal(user.password_hash, passwordHash);
  assert.equal(user.force_password_change, false);
  const invitation = await row();
  assert.equal(invitation.status, 'accepted');
  assert.equal(invitation.accepted_user_id, id);
  assert.ok(invitation.accepted_at);
  assert.equal(invitation.verification_token_hash, null);
  await assert.rejects(register(), /INVITATION_ACCEPTED/);
  await assert.rejects(renew(), /INVITATION_ACCEPTED/);
  await assert.rejects(revoke(), /INVITATION_ACCEPTED/);
  assert.equal(await userCount(), 3);
});

test('overlapping requests can accept a token only once', async () => {
  await verifiedInvitation();
  const outcomes = await Promise.allSettled(Array.from({ length: 6 }, (_value, index) =>
    register({ username: `teacher${index}` })));
  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(outcomes.filter((result) => result.status === 'rejected' && /INVITATION_ACCEPTED/.test(result.reason.message)).length, 5);
  assert.equal(await userCount(), 3);
});

test('school email verification, matching proof and its lifetime are mandatory even for an unbound invitation', async () => {
  await create();
  await assert.rejects(register(), /EMAIL_VERIFICATION_REQUIRED/);
  await prepare();
  await assert.rejects(register(), /EMAIL_VERIFICATION_REQUIRED/);
  await verify();
  await assert.rejects(register({ proof: 'f'.repeat(64) }), /EMAIL_VERIFICATION_REQUIRED/);
  await assert.rejects(register({ email: 'other@school.edu.ph' }), /EMAIL_VERIFICATION_REQUIRED/);
  await db.exec("update public.teacher_invitations set email_verified_expires_at=now()-interval '1 second'");
  await assert.rejects(register(), /EMAIL_VERIFICATION_REQUIRED/);
  assert.equal(await userCount(), 2);
  assert.equal((await row()).status, 'pending');
});

test('bound school email cannot change at code request, verification or registration', async () => {
  await verifiedInvitation({ email });
  await assert.rejects(prepare({ email: 'someone@school.edu.ph' }), /EMAIL_MISMATCH/);
  await assert.rejects(verify({ email: 'someone@school.edu.ph' }), /EMAIL_MISMATCH/);
  await assert.rejects(register({ email: 'someone@school.edu.ph' }), /EMAIL_MISMATCH/);
  await register({ email: ' MARIA.SANTOS@SCHOOL.EDU.PH ' });
  assert.equal(await userCount(), 3);
});

test('bad codes persist a five-attempt lockout and email resends enforce a cooldown', async () => {
  await create();
  await prepare();
  await assert.rejects(prepare(), /INVITATION_COOLDOWN/);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = await verify({ code: 'f'.repeat(64) });
    assert.deepEqual(result, { verified: false, code: attempt === 5 ? 'EMAIL_CODE_LOCKED' : 'EMAIL_CODE_INVALID' });
    assert.equal((await row()).email_code_attempts, attempt);
  }
  assert.equal((await verify()).code, 'EMAIL_CODE_LOCKED');
  await db.exec("update public.teacher_invitations set email_code_sent_at=now()-interval '61 seconds'");
  await prepare({ challenge: 'different-challenge-0001' });
  assert.equal((await row()).email_code_attempts, 0);
  assert.equal((await verify({ challenge: 'different-challenge-0001' })).verified, true);
});

test('mismatched challenges and emails consume attempts; expired or consumed codes cannot issue new proofs', async () => {
  await create();
  await prepare();
  assert.equal((await verify({ challenge: 'different-challenge-0001' })).code, 'EMAIL_CODE_INVALID');
  assert.equal((await verify({ email: 'other@school.edu.ph' })).code, 'EMAIL_CODE_INVALID');
  assert.equal((await row()).email_code_attempts, 2);
  await db.exec("update public.teacher_invitations set email_code_expires_at=now()-interval '1 second'");
  assert.equal((await verify()).code, 'EMAIL_CODE_EXPIRED');
  await db.exec("update public.teacher_invitations set email_code_sent_at=now()-interval '61 seconds'");
  await prepare();
  assert.equal((await verify()).verified, true);
  assert.equal((await verify({ proof: 'e'.repeat(64) })).code, 'EMAIL_CODE_EXPIRED');
  assert.equal((await row()).verification_token_hash, proof);
});

test('only the owning Head Teacher can renew or revoke; renewal rotates the token and clears verification', async () => {
  await verifiedInvitation();
  await assert.rejects(renew('other'), /INVITATION_INVALID/);
  await assert.rejects(revoke('other'), /INVITATION_INVALID/);
  await assert.rejects(renew(), /INVITATION_COOLDOWN/);
  await db.exec("update public.teacher_invitations set last_renewed_at=now()-interval '61 seconds', expires_at=now()-interval '1 second'");
  const renewed = await renew('head', 24);
  assert.equal(renewed.token_hash, nextToken);
  assert.equal(renewed.name, 'Maria Santos');
  assert.equal(renewed.status, 'pending');
  assert.equal(renewed.verification_token_hash, null);
  assert.equal(new Date(renewed.expires_at) - new Date(renewed.last_renewed_at), 24 * 3600000);
  await assert.rejects(register(), /INVITATION_INVALID/);
  await assert.rejects(register({ token: nextToken }), /EMAIL_VERIFICATION_REQUIRED/);
  await assert.rejects(renew(), /INPUT_INVALID|INVITATION_COOLDOWN/);
});

test('revocation is idempotent, clears proofs and permanently prevents registration and renewal', async () => {
  await verifiedInvitation();
  const revoked = await revoke();
  assert.equal(revoked.status, 'revoked');
  assert.equal(revoked.verification_token_hash, null);
  assert.ok(revoked.revoked_at);
  assert.equal((await revoke()).revoked_at, revoked.revoked_at);
  await assert.rejects(register(), /INVITATION_REVOKED/);
  await assert.rejects(prepare(), /INVITATION_REVOKED/);
  await assert.rejects(verify(), /INVITATION_REVOKED/);
  await assert.rejects(renew(), /INVITATION_REVOKED/);
  assert.equal(await userCount(), 2);
});

test('an expired invitation cannot request or verify email or create an account', async () => {
  await verifiedInvitation();
  await db.exec("update public.teacher_invitations set expires_at=now()-interval '1 second'");
  for (const action of [prepare, verify, register]) await assert.rejects(action(), /INVITATION_EXPIRED/);
  assert.equal(await userCount(), 2);
});

test('issuer deactivation, archival, role changes or department changes invalidate every pending lifecycle operation', async () => {
  await verifiedInvitation();
  for (const patch of ["status='suspended'", "archive='{\"isArchived\":true}'", "role='teacher'", "department='English'", "department=''"]) {
    await db.exec(`update public.users set ${patch} where id='head'`);
    for (const action of [prepare, verify, register, renew, revoke]) await assert.rejects(action(), /ISSUER_UNAVAILABLE/);
    // An active Head Teacher may issue new invitations after changing department;
    // only invitations carrying the old department snapshot become invalid.
    if (patch === "department='English'") {
      assert.equal((await create({ id: 'second', token: nextToken })).department, 'English');
    } else {
      await assert.rejects(create({ id: 'second', token: nextToken }), /ISSUER_UNAVAILABLE/);
    }
    await db.exec("delete from public.teacher_invitations where id='second'; update public.users set status='active', archive='{}', role='headteacher', department='Mathematics' where id='head'");
  }
  assert.equal((await row()).status, 'pending');
  assert.equal(await userCount(), 2);
});

test('case-insensitive username and newly claimed email conflicts do not consume the verified invitation', async () => {
  await verifiedInvitation();
  await assert.rejects(register({ username: 'HEADTEACHER' }), /USERNAME_TAKEN/);
  await db.query("insert into public.users(id,name,email,username,role) values('claimed','Claimed',$1,'claimed','student')", [email.toUpperCase()]);
  await assert.rejects(register(), /EMAIL_TAKEN/);
  assert.equal((await row()).status, 'pending');
  assert.equal((await row()).verification_token_hash, proof);
  await db.exec("delete from public.users where id='claimed'");
  await register();
  await assert.rejects(db.query("insert into public.users(name,email,username,role) values('Duplicate','otherteacher@gmail.com','mARIA.sANTOS','teacher')"), /users_username_lower_unique/);
  await assert.rejects(db.query("insert into public.users(name,email,username,role) values('Duplicate',$1,'otherteacher','teacher')", [email.toUpperCase()]), /users_email_lower_unique/);
});

test('a failed account insert rolls back both the new account and acceptance while preserving its proof', async () => {
  await verifiedInvitation();
  await db.exec("alter table public.users add constraint test_teacher_insert_failure check (role <> 'teacher') not valid");
  try {
    await assert.rejects(register(), /test_teacher_insert_failure/);
    assert.equal(await userCount(), 2);
    const invitation = await row();
    assert.equal(invitation.status, 'pending');
    assert.equal(invitation.accepted_user_id, null);
    assert.equal(invitation.verification_token_hash, proof);
  } finally {
    await db.exec('alter table public.users drop constraint test_teacher_insert_failure');
  }
  await register();
});

test('browser roles have no table or RPC access, service role has access and the migration safely reruns', async () => {
  await verifiedInvitation();
  await db.exec(fs.readFileSync(migrationPath, 'utf8'));
  const signatures = [
    'teacher_invitation_valid_email(text)', 'teacher_invitation_assert_issuer(text,text)',
    'create_teacher_invitation(text,text,text,text,text,text,integer)',
    'renew_teacher_invitation(text,text,text,text,integer)', 'revoke_teacher_invitation(text,text)',
    'prepare_teacher_invitation_email(text,text,text,text)',
    'verify_teacher_invitation_email(text,text,text,text,text)',
    'register_teacher_invitation(text,text,text,text,text,text)',
  ];
  for (const role of ['anon', 'authenticated']) {
    const access = (await db.query("select has_table_privilege($1,'public.teacher_invitations','SELECT,INSERT,UPDATE,DELETE') as allowed", [role])).rows[0];
    assert.equal(access.allowed, false);
    for (const signature of signatures) {
      const result = (await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed", [role, `public.${signature}`])).rows[0];
      assert.equal(result.allowed, false, `${role} ${signature}`);
    }
  }
  for (const signature of signatures) {
    assert.equal((await db.query("select has_function_privilege('service_role',$1,'EXECUTE') as allowed", [`public.${signature}`])).rows[0].allowed, true);
  }
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.teacher_invitations'::regclass")).rows[0].relrowsecurity, true);
  assert.equal((await row()).verification_token_hash, proof);
});
