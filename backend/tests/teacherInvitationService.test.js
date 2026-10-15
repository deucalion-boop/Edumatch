const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
const gmail = require('../services/gmailService');
let client;
let rpcCalls;
let mailCalls;
let mailBehavior;
storage.getSupabaseStorageClient = () => client;
gmail.sendEmailViaGmail = async message => { mailCalls.push(message); return mailBehavior(message); };
process.env.TEACHER_INVITATION_SECRET = 'teacher-invitation-tests-secret-at-least-32-characters';
process.env.FRONTEND_URL = 'https://edumatch.example';
const service = require('../services/teacherInvitationService');
const controller = require('../controllers/teacherInvitationController');
const headTeacherId = 'headteacher-one';
const invitationId = 'invitation-one';
const nonce = 'nonce-one';
const token = service.invitationToken(invitationId, nonce);
const tokenHash = service.digest(token);
const future = (milliseconds = 86400000) => new Date(Date.now() + milliseconds).toISOString();

function fixture(extra = {}, rpcBehavior) {
  client = createFakeSupabase({
    users: [{ id: headTeacherId, name: 'Head Teacher', role: 'headteacher', status: 'active', archive: {}, department: 'Mathematics' }],
    teacher_invitations: [{ id: invitationId, headteacher_id: headTeacherId, token_nonce: nonce, token_hash: tokenHash,
      name: 'Maria Santos', email: 'maria@school.edu.ph', department: 'Mathematics', status: 'pending', is_group: false,
      created_at: new Date().toISOString(), expires_at: future(), email_challenge_id: 'challenge-one',
      email_code_hash: 'private-code-hash', verification_hash: 'private-proof-hash' }],
    ...extra,
  });
  rpcCalls = [];
  mailCalls = [];
  mailBehavior = async () => ({ sent: true });
  client.rpc = async (name, input) => {
    rpcCalls.push({ name, input });
    if (!rpcBehavior) assert.fail(`Unexpected mutation RPC: ${name}`);
    return rpcBehavior(name, input);
  };
  return client;
}

function createdRow(input) {
  return { ...client.tables.teacher_invitations[0], id: input.p_id || input.p_invitation_id,
    token_nonce: input.p_nonce, token_hash: input.p_token_hash, name: input.p_name || '', email: input.p_email || '',
    expires_at: future(input.p_expires_hours * 3600000) };
}

function groupFixture(rpcBehavior) {
  fixture({}, rpcBehavior);
  Object.assign(client.tables.teacher_invitations[0], { is_group: true, name: '', email: '', registration_count: 0 });
  client.tables.teacher_invitation_registrations = [];
  return client;
}

function claim(email, id, extra = {}) {
  return { id, invitation_id: invitationId, email, token_hash: tokenHash, status: 'pending',
    email_challenge_id: `${id}-challenge`, email_code_hash: `${id}-private-code`, email_code_sent_at: new Date().toISOString(),
    email_code_expires_at: future(600000), ...extra };
}

async function rejects(promise, status, code, pattern) {
  await assert.rejects(promise, error => {
    assert.equal(error.statusCode, status);
    if (code) assert.equal(error.code, code);
    if (pattern) assert.match(error.message, pattern);
    return true;
  });
}

test('invitation creation exposes a reproducible secure URL and sends only its hash to the database', async () => {
  fixture({}, async (name, input) => {
    assert.equal(name, 'create_teacher_invitation');
    const row = createdRow(input);
    client.tables.teacher_invitations.push(row);
    return { data: row };
  });
  const result = await service.createInvitation(headTeacherId, { name: '  José   Santos ', email: 'Maria@School.edu.ph' });
  const { input } = rpcCalls[0];
  const rawToken = result.invitation.invitationUrl.split('/').at(-1);
  assert.match(rawToken, /^[a-f0-9]{64}$/);
  assert.equal(rawToken, service.invitationToken(input.p_id, input.p_nonce));
  assert.equal(input.p_token_hash, service.digest(rawToken));
  assert.equal(input.p_name, 'José Santos');
  assert.equal(input.p_email, 'maria@school.edu.ph');
  assert.equal(input.p_expires_hours, 48);
  assert.equal(result.invitation.status, 'Pending');
  assert.equal(result.delivery.emailSent, true);
  assert.equal(Object.values(input).includes(rawToken), false);
  assert.equal(Object.hasOwn(result.invitation, 'token_hash'), false);
  assert.equal(Object.hasOwn(result.invitation, 'token_nonce'), false);
  assert.match(mailCalls[0].text, new RegExp(rawToken));
});

test('renewal rotates nonce and token; revocation returns no usable link', async () => {
  fixture({}, async (name, input) => {
    if (name === 'renew_teacher_invitation') return { data: { ...createdRow(input), email: '' } };
    assert.equal(name, 'revoke_teacher_invitation');
    return { data: { ...client.tables.teacher_invitations[0], status: 'revoked' } };
  });
  const renewed = await service.resendInvitation(headTeacherId, invitationId, { expiresInHours: 2 });
  const { input } = rpcCalls[0];
  assert.notEqual(input.p_nonce, nonce);
  assert.notEqual(input.p_token_hash, tokenHash);
  assert.equal(input.p_token_hash, service.digest(renewed.invitation.invitationUrl.split('/').at(-1)));
  assert.equal(input.p_expires_hours, 2);
  const revoked = await service.revokeInvitation(headTeacherId, invitationId);
  assert.equal(revoked.status, 'Revoked');
  assert.equal(revoked.invitationUrl, '');
  assert.equal(rpcCalls[1].input.p_headteacher_id, headTeacherId);
});

test('only active, unarchived Head Teachers with a department can manage invitations', async () => {
  for (const change of [{ role: 'teacher' }, { role: 'admin' }, { status: 'inactive' }, { archive: { isArchived: true } }, { department: '' }]) {
    fixture();
    Object.assign(client.tables.users[0], change);
    for (const action of [() => service.createInvitation(headTeacherId, {}), () => service.listInvitations(headTeacherId),
      () => service.resendInvitation(headTeacherId, invitationId), () => service.revokeInvitation(headTeacherId, invitationId)]) {
      await rejects(action(), 403, 'ISSUER_UNAVAILABLE');
    }
    assert.equal(rpcCalls.length, 0);
    assert.equal(mailCalls.length, 0);
  }
  fixture({ users: [] });
  await rejects(service.createInvitation(headTeacherId, {}), 403, 'ISSUER_UNAVAILABLE');
});

test('creation validates names, normal school email, and bounded expiration before mutation', async () => {
  fixture();
  for (const name of [42, 'Teacher123', 'A'.repeat(101), '<script>']) await rejects(service.createInvitation(headTeacherId, { name }), 400);
  for (const email of ['teacher@localhost', 'teacher@@school.edu', 'a..b@school.edu', 'a@school.edu\r\nBcc:x@school.edu']) {
    await rejects(service.createInvitation(headTeacherId, { email }), 400);
  }
  for (const expiresInHours of [0, 49, -1, 1.5, 'invalid']) await rejects(service.createInvitation(headTeacherId, { expiresInHours }), 400);
  assert.equal(rpcCalls.length, 0);
  assert.equal(mailCalls.length, 0);
});

test('misconfigured invitation secret or frontend URL fails before database mutation', async () => {
  fixture();
  const previousUrl = process.env.FRONTEND_URL;
  const previousSecret = process.env.TEACHER_INVITATION_SECRET;
  try {
    process.env.FRONTEND_URL = 'javascript:alert(1)';
    await rejects(service.createInvitation(headTeacherId, {}), 503, undefined, /frontend URL/i);
    process.env.FRONTEND_URL = previousUrl;
    process.env.TEACHER_INVITATION_SECRET = 'short';
    await rejects(service.createInvitation(headTeacherId, {}), 503, undefined, /not configured/i);
    assert.equal(rpcCalls.length, 0);
  } finally {
    process.env.FRONTEND_URL = previousUrl;
    process.env.TEACHER_INVITATION_SECRET = previousSecret;
  }
});

test('public metadata exposes only the addressed invitation and no token, challenge, or unrelated private data', async () => {
  fixture();
  client.tables.teacher_invitations.push({ ...client.tables.teacher_invitations[0], id: 'other', token_hash: service.digest('other'), email: 'private@other.edu', name: 'Other Teacher' });
  const metadata = await service.publicInvitation(token);
  assert.deepEqual(Object.keys(metadata).sort(), ['department', 'email', 'expiresAt', 'isGroup', 'name', 'schoolName', 'status']);
  assert.equal(metadata.isGroup, false);
  assert.equal(metadata.name, 'Maria Santos');
  assert.equal(metadata.email, 'maria@school.edu.ph');
  assert.equal(JSON.stringify(metadata).includes('private'), false);
  assert.equal(JSON.stringify(metadata).includes(tokenHash), false);
  assert.equal(client.writes.length, 0);
});

test('unknown, malformed, revoked, expired, and accepted invitations fail with explicit statuses', async () => {
  fixture();
  for (const badToken of ['', 'not-a-token', 'A'.repeat(64), 'f'.repeat(64)]) await rejects(service.publicInvitation(badToken), 404, 'INVITATION_INVALID');
  for (const [status, expectedStatus, code] of [['revoked', 410, 'INVITATION_REVOKED'], ['accepted', 409, 'INVITATION_ACCEPTED'], ['other', 404, 'INVITATION_INVALID']]) {
    fixture();
    client.tables.teacher_invitations[0].status = status;
    await rejects(service.publicInvitation(token), expectedStatus, code);
  }
  fixture();
  client.tables.teacher_invitations[0].expires_at = new Date(Date.now() - 1000).toISOString();
  await rejects(service.publicInvitation(token), 410, 'INVITATION_EXPIRED');
});

test('public invitation validation follows issuer deactivation, archiving, and department reassignment', async () => {
  for (const change of [{ status: 'inactive' }, { archive: { isArchived: true } }, { role: 'teacher' }, { department: 'Science' }]) {
    fixture();
    Object.assign(client.tables.users[0], change);
    await rejects(service.publicInvitation(token), 403, 'ISSUER_UNAVAILABLE');
    assert.equal(rpcCalls.length, 0);
  }
});

test('management lists only owned invitations and reports expiry without exposing internal fields', async () => {
  fixture();
  const row = client.tables.teacher_invitations[0];
  client.tables.teacher_invitations.push({ ...row, id: 'expired', expires_at: new Date(Date.now() - 1000).toISOString() },
    { ...row, id: 'other-owner', headteacher_id: 'other-headteacher', email: 'private@other.edu' });
  const rows = await service.listInvitations(headTeacherId);
  assert.equal(rows.length, 2);
  assert.equal(rows.find(value => value.id === 'expired').status, 'Expired');
  assert.equal(rows.find(value => value.id === 'expired').invitationUrl, '');
  assert.equal(JSON.stringify(rows).includes('token_hash'), false);
  assert.equal(JSON.stringify(rows).includes('private@other.edu'), false);
});

test('username checking treats case duplicates and underscores literally and checks suggested alternatives', async () => {
  fixture();
  client.tables.users.push({ id: 'existing', username: 'Maria.Santos' }, { id: 'wildcard', username: 'joseXreyes' });
  const taken = await service.usernameAvailability(token, 'mArIa.SaNtOs');
  assert.equal(taken.available, false);
  assert.ok(taken.suggestions.length > 0 && taken.suggestions.length <= 3);
  for (const suggestion of taken.suggestions) assert.equal((await service.usernameAvailability(token, suggestion)).available, true);
  assert.equal((await service.usernameAvailability(token, 'jose_reyes')).available, true);
  client.tables.users.push({ id: 'literal', username: 'Jose_Reyes' });
  assert.equal((await service.usernameAvailability(token, 'jose_reyes')).available, false);
  for (const invalid of ['ab', '_name', 'bad name', 'bad%name', 'name*', 'a'.repeat(31)]) {
    const checked = await service.usernameAvailability(token, invalid);
    assert.equal(checked.valid, false);
    assert.deepEqual(checked.suggestions, []);
  }
  assert.equal(client.writes.length, 0);
});

test('failed invitation delivery preserves a copyable link and records failure without leaking mail errors', async () => {
  fixture({}, async (_name, input) => {
    const row = createdRow(input);
    client.tables.teacher_invitations.push(row);
    return { data: row };
  });
  mailBehavior = async () => { throw new Error('private SMTP credential failure'); };
  const result = await service.createInvitation(headTeacherId, { email: 'maria@school.edu.ph' });
  assert.equal(result.delivery.emailSent, false);
  assert.match(result.delivery.message, /Copy the link/);
  assert.match(result.invitation.invitationUrl, /\/auth\/teacher-register\/[a-f0-9]{64}$/);
  assert.equal(client.writes.at(-1).payload.delivery_status, 'failed');
  assert.equal(JSON.stringify(result).includes('SMTP'), false);
});

test('an email-bound invitation rejects a different email for sending, verification, and registration', async () => {
  fixture();
  const body = { fullName: 'Maria Santos', email: 'other@school.edu.ph', username: 'maria.santos', password: 'Password123', confirmPassword: 'Password123', verificationToken: 'a'.repeat(64), code: '123456' };
  await rejects(service.sendEmailCode(token, body), 400, 'EMAIL_MISMATCH');
  await rejects(service.verifyEmail(token, body), 400, 'EMAIL_MISMATCH');
  await rejects(service.registerTeacher(token, body), 400, 'EMAIL_MISMATCH');
  assert.equal(rpcCalls.length, 0);
  assert.equal(mailCalls.length, 0);
});

test('email code preparation stores only a bound challenge hash and returns expiry and resend metadata', async () => {
  const sentAt = new Date().toISOString();
  const expiresAt = future(600000);
  fixture({}, async (name) => {
    assert.equal(name, 'prepare_teacher_invitation_email');
    return { data: { email_code_sent_at: sentAt, email_code_expires_at: expiresAt } };
  });
  const result = await service.sendEmailCode(token, { email: 'MARIA@school.edu.ph' });
  const { input } = rpcCalls[0];
  const code = mailCalls[0].text.match(/code is (\d{6})/)[1];
  assert.equal(input.p_email, 'maria@school.edu.ph');
  assert.equal(input.p_token_hash, tokenHash);
  assert.equal(input.p_code_hash, service.codeHash(tokenHash, input.p_email, input.p_challenge_id, code));
  assert.equal(Object.values(input).includes(code), false);
  assert.equal(result.verification.expiresAt, expiresAt);
  assert.equal(Date.parse(result.verification.resendAvailableAt), Date.parse(sentAt) + 60000);
  assert.equal(JSON.stringify(result).includes(code), false);
});

test('email code cooldown reports its existing resend deadline without attempting delivery', async () => {
  fixture({}, async () => ({ data: null, error: { message: 'INVITATION_COOLDOWN' } }));
  const sentAt = new Date(Date.now() - 30000).toISOString();
  const expiresAt = future(600000);
  Object.assign(client.tables.teacher_invitations[0], { email_code_sent_at: sentAt, email_code_expires_at: expiresAt });
  await assert.rejects(service.sendEmailCode(token, { email: 'maria@school.edu.ph' }), error => {
    assert.equal(error.statusCode, 429);
    assert.equal(error.code, 'INVITATION_COOLDOWN');
    assert.equal(error.verification.expiresAt, expiresAt);
    assert.equal(Date.parse(error.verification.resendAvailableAt), Date.parse(sentAt) + 60000);
    return true;
  });
  assert.equal(mailCalls.length, 0);
});

test('email delivery failure clears only the challenge it prepared, preserving a later concurrent challenge', async () => {
  fixture({}, async () => ({ data: { email_code_sent_at: new Date().toISOString(), email_code_expires_at: future() } }));
  mailBehavior = async () => {
    Object.assign(client.tables.teacher_invitations[0], { email_challenge_id: 'newer-challenge', email_code_hash: 'newer-code', email_code_expires_at: future() });
    return { sent: false };
  };
  await rejects(service.sendEmailCode(token, { email: 'maria@school.edu.ph' }), 502, 'EMAIL_DELIVERY_FAILED');
  assert.equal(client.tables.teacher_invitations[0].email_code_hash, 'newer-code');
  assert.deepEqual(client.writes.at(-1).ids, []);
  fixture({}, async (_name, input) => {
    client.tables.teacher_invitations[0].email_challenge_id = input.p_challenge_id;
    return { data: { email_code_sent_at: new Date().toISOString(), email_code_expires_at: future() } };
  });
  mailBehavior = async () => ({ sent: false });
  await assert.rejects(service.sendEmailCode(token, { email: 'maria@school.edu.ph' }), error => {
    assert.equal(error.statusCode, 502);
    assert.equal(error.code, 'EMAIL_DELIVERY_FAILED');
    assert.ok(Date.parse(error.verification?.resendAvailableAt) > Date.now());
    assert.equal(error.verification.expiresAt, null);
    return true;
  });
  assert.equal(client.tables.teacher_invitations[0].email_code_hash, null);
  assert.equal(client.tables.teacher_invitations[0].email_code_expires_at, null);
});

test('email verification returns a browser proof but supplies only its hash to the atomic RPC', async () => {
  const expiresAt = future();
  fixture({}, async name => {
    assert.equal(name, 'verify_teacher_invitation_email');
    return { data: { verified: true, expiresAt } };
  });
  const verified = await service.verifyEmail(token, { email: 'MARIA@school.edu.ph', code: '012345' });
  const { input } = rpcCalls[0];
  assert.match(verified.verificationToken, /^[a-f0-9]{64}$/);
  assert.equal(verified.verifiedEmail, 'maria@school.edu.ph');
  assert.equal(verified.expiresAt, expiresAt);
  assert.equal(input.p_verification_hash, service.digest(verified.verificationToken));
  assert.equal(input.p_code_hash, service.codeHash(tokenHash, input.p_email, 'challenge-one', '012345'));
  assert.equal(Object.values(input).includes('012345'), false);
  assert.equal(Object.values(input).includes(verified.verificationToken), false);
});

test('malformed codes and unsuccessful verification never return a proof', async () => {
  fixture();
  for (const code of ['12345', '1234567', 'abcdef', 123456]) await rejects(service.verifyEmail(token, { email: 'maria@school.edu.ph', code }), 400);
  assert.equal(rpcCalls.length, 0);
  fixture({}, async () => ({ data: { verified: false, code: 'EMAIL_CODE_LOCKED' } }));
  await rejects(service.verifyEmail(token, { email: 'maria@school.edu.ph', code: '123456' }), 429, 'EMAIL_CODE_LOCKED');
});

test('registration rejects invalid names, usernames, passwords, and missing email proof before mutation', async () => {
  fixture();
  const valid = { fullName: 'Maria Santos', email: 'maria@school.edu.ph', username: 'maria.santos', password: 'Password123', confirmPassword: 'Password123', verificationToken: 'a'.repeat(64) };
  for (const change of [{ fullName: '' }, { fullName: 'Teacher 123' }, { fullName: 'a'.repeat(101) }, { username: '_invalid' },
    { username: 'ab' }, { password: 'weak', confirmPassword: 'weak' }, { confirmPassword: 'Different123' },
    { verificationToken: '' }, { verificationToken: 'x'.repeat(64) }]) {
    await rejects(service.registerTeacher(token, { ...valid, ...change }), 400);
  }
  assert.equal(rpcCalls.length, 0);
});

test('registration RPC uses canonical email, a password hash, and proof hash without trusting client role or department', async () => {
  fixture({}, async name => {
    assert.equal(name, 'register_teacher_invitation');
    return { data: 'new-teacher-id' };
  });
  const proof = crypto.randomBytes(32).toString('hex');
  const registered = await service.registerTeacher(token, { fullName: '  José   Santos ', email: ' MARIA@school.edu.ph ', username: '  Maria.Santos ',
    password: 'Password123', confirmPassword: 'Password123', verificationToken: proof, role: 'admin', department: 'Science', headteacherId: 'other' });
  const { input } = rpcCalls[0];
  assert.equal(input.p_name, 'José Santos');
  assert.equal(input.p_email, 'maria@school.edu.ph');
  assert.equal(input.p_username, 'Maria.Santos');
  assert.equal(input.p_token_hash, tokenHash);
  assert.equal(input.p_verification_hash, service.digest(proof));
  assert.equal(await bcrypt.compare('Password123', input.p_password_hash), true);
  assert.deepEqual(Object.keys(input).sort(), ['p_email', 'p_name', 'p_password_hash', 'p_token_hash', 'p_username', 'p_verification_hash']);
  assert.deepEqual(registered.user, { id: 'new-teacher-id', name: 'José Santos', role: 'teacher', department: 'Mathematics' });
});

test('well-formed but unverified email proof is rejected by the atomic registration check', async () => {
  fixture({}, async () => ({ data: null, error: { message: 'EMAIL_VERIFICATION_REQUIRED' } }));
  await rejects(service.registerTeacher(token, { fullName: 'Maria Santos', email: 'maria@school.edu.ph', username: 'maria.santos',
    password: 'Password123', confirmPassword: 'Password123', verificationToken: 'a'.repeat(64) }), 400, 'EMAIL_VERIFICATION_REQUIRED');
  assert.equal(rpcCalls.length, 1);
  assert.equal(client.tables.users.length, 1);
});

test('RPC errors map to actionable duplicate, schema, cooldown, and availability responses', () => {
  for (const [input, status, code] of [[{ code: '23505', message: 'username duplicate' }, 409, 'USERNAME_TAKEN'],
    [{ code: '23505', message: 'email duplicate' }, 409, 'EMAIL_TAKEN'],
    [{ message: 'INVITATION_COOLDOWN' }, 429, 'INVITATION_COOLDOWN'],
    [{ code: 'PGRST202' }, 503, 'TEACHER_INVITATION_SCHEMA_REQUIRED'],
    [{ code: '42P01' }, 503, 'TEACHER_INVITATION_SCHEMA_REQUIRED'],
    [{ message: 'private connection failure' }, 503, 'TEACHER_INVITATION_UNAVAILABLE']]) {
    const error = service.databaseError(input);
    assert.equal(error.statusCode, status);
    assert.equal(error.code, code);
    assert.equal(error.message.includes('private connection'), false);
  }
});

function response() {
  return { statusCode: 200, headers: {}, set(key, value) { this.headers[key] = value; return this; },
    status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
}

test('controller public responses wrap metadata and expose recognized errors without leaking database details', async () => {
  fixture();
  const res = response();
  await controller.details({ params: { token } }, res, error => assert.fail(error));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.invitation.name, 'Maria Santos');
  assert.equal(res.body.success, true);
  assert.match(res.headers['Cache-Control'], /no-store/);
  const invalid = response();
  await controller.details({ params: { token: 'invalid' } }, invalid, error => assert.fail(error));
  assert.equal(invalid.statusCode, 404);
  assert.equal(invalid.body.code, 'INVITATION_INVALID');
  client.failures.push({ table: 'teacher_invitations', operation: 'select', error: { code: '42P01', message: 'private database detail' } });
  const unavailable = response();
  await controller.details({ params: { token } }, unavailable, error => assert.fail(error));
  assert.equal(unavailable.statusCode, 503);
  assert.equal(unavailable.body.code, 'TEACHER_INVITATION_SCHEMA_REQUIRED');
  assert.equal(JSON.stringify(unavailable.body).includes('private database detail'), false);
});

test('controller preserves resend metadata when code delivery fails', async () => {
  fixture({}, async () => ({ data: { email_code_sent_at: new Date().toISOString(), email_code_expires_at: future() } }));
  mailBehavior = async () => ({ sent: false });
  const res = response();
  await controller.sendCode({ params: { token }, body: { email: 'maria@school.edu.ph' } }, res, error => assert.fail(error));
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.code, 'EMAIL_DELIVERY_FAILED');
  assert.equal(res.body.verification.expiresAt, null);
  assert.ok(Date.parse(res.body.verification.resendAvailableAt) > Date.now());
});

test('shared department link creation requires no teacher details and reuses a returned active group link', async () => {
  groupFixture(async (name) => {
    assert.equal(name, 'create_teacher_group_invitation');
    return { data: client.tables.teacher_invitations[0] };
  });
  const first = await service.createGroupInvitation(headTeacherId, { expiresInHours: 48 });
  const again = await service.createGroupInvitation(headTeacherId, {});
  assert.equal(first.invitation.isGroup, true);
  assert.equal(first.invitation.invitationUrl, again.invitation.invitationUrl);
  assert.equal(first.invitation.name, '');
  assert.equal(first.invitation.email, '');
  assert.equal(first.invitation.registrationCount, 0);
  assert.equal(mailCalls.length, 0);
  for (const { input } of rpcCalls) {
    assert.equal(input.p_headteacher_id, headTeacherId);
    assert.equal(input.p_expires_hours, 48);
    assert.equal(Object.hasOwn(input, 'p_name'), false);
    assert.equal(Object.hasOwn(input, 'p_email'), false);
    assert.match(input.p_token_hash, /^[a-f0-9]{64}$/);
  }
  for (const body of [{ name: 'Teacher Name' }, { email: 'teacher@school.edu.ph' }]) {
    await rejects(service.createGroupInvitation(headTeacherId, body), 400);
  }
  assert.equal(rpcCalls.length, 2);
});

test('shared public metadata exposes department context without any registered teacher identity', async () => {
  groupFixture();
  client.tables.teacher_invitation_registrations.push(claim('private-one@school.edu.ph', 'claim-one'), claim('private-two@school.edu.ph', 'claim-two'));
  const publicData = await service.publicInvitation(token);
  assert.equal(publicData.isGroup, true);
  assert.equal(publicData.name, '');
  assert.equal(publicData.email, '');
  assert.equal(publicData.department, 'Mathematics');
  assert.equal(publicData.status, 'Pending');
  assert.equal(JSON.stringify(publicData).includes('private-'), false);
  assert.equal(Object.hasOwn(publicData, 'registrationCount'), false);
});

test('simultaneous shared-link email challenges use independent email-bound hashes and claim records', async () => {
  groupFixture(async (name, input) => {
    assert.equal(name, 'prepare_teacher_group_email');
    const record = claim(input.p_email, `claim-${client.tables.teacher_invitation_registrations.length + 1}`, {
      email_challenge_id: input.p_challenge_id, email_code_hash: input.p_code_hash,
    });
    client.tables.teacher_invitation_registrations.push(record);
    return { data: record };
  });
  const emails = ['maria@school.edu.ph', 'jose@school.edu.ph'];
  const results = await Promise.all(emails.map(email => service.sendEmailCode(token, { email })));
  assert.equal(results.length, 2);
  assert.equal(rpcCalls.length, 2);
  assert.equal(client.tables.teacher_invitation_registrations.length, 2);
  assert.notEqual(rpcCalls[0].input.p_challenge_id, rpcCalls[1].input.p_challenge_id);
  assert.notEqual(rpcCalls[0].input.p_code_hash, rpcCalls[1].input.p_code_hash);
  for (const { input } of rpcCalls) {
    const mail = mailCalls.find(message => message.to.email === input.p_email);
    const code = mail.text.match(/code is (\d{6})/)[1];
    assert.equal(input.p_code_hash, service.codeHash(tokenHash, input.p_email, input.p_challenge_id, code));
    assert.equal(input.p_token_hash, tokenHash);
    assert.equal(Object.values(input).includes(code), false);
  }
  assert.equal(client.tables.teacher_invitations[0].email_code_hash, 'private-code-hash');
  assert.equal(client.writes.length, 0);
});

test('shared-link delivery cleanup affects only the prepared claim and preserves another email and newer challenge', async () => {
  groupFixture(async (_name, input) => {
    const own = claim(input.p_email, 'claim-own', { email_challenge_id: input.p_challenge_id, email_code_hash: input.p_code_hash });
    client.tables.teacher_invitation_registrations.push(own, claim('other@school.edu.ph', 'claim-other'));
    return { data: own };
  });
  mailBehavior = async () => ({ sent: false });
  await rejects(service.sendEmailCode(token, { email: 'maria@school.edu.ph' }), 502, 'EMAIL_DELIVERY_FAILED');
  assert.equal(client.tables.teacher_invitation_registrations.find(row => row.id === 'claim-own').email_code_hash, null);
  assert.equal(client.tables.teacher_invitation_registrations.find(row => row.id === 'claim-other').email_code_hash, 'claim-other-private-code');
  assert.equal(client.writes.at(-1).table, 'teacher_invitation_registrations');
  assert.deepEqual(client.writes.at(-1).ids, ['claim-own']);
  assert.equal(client.tables.teacher_invitations[0].email_code_hash, 'private-code-hash');

  groupFixture(async (_name, input) => {
    const own = claim(input.p_email, 'claim-own', { email_challenge_id: input.p_challenge_id, email_code_hash: input.p_code_hash });
    client.tables.teacher_invitation_registrations.push(own);
    return { data: own };
  });
  mailBehavior = async () => {
    Object.assign(client.tables.teacher_invitation_registrations[0], { email_challenge_id: 'newer-challenge', email_code_hash: 'newer-private-code' });
    return { sent: false };
  };
  await rejects(service.sendEmailCode(token, { email: 'maria@school.edu.ph' }), 502, 'EMAIL_DELIVERY_FAILED');
  assert.equal(client.tables.teacher_invitation_registrations[0].email_code_hash, 'newer-private-code');
  assert.deepEqual(client.writes.at(-1).ids, []);
});

test('shared-link verification reads only its email and token-bound claim and hashes each independent proof', async () => {
  groupFixture(async (name) => {
    assert.equal(name, 'verify_teacher_group_email');
    return { data: { verified: true, expiresAt: future() } };
  });
  client.tables.teacher_invitation_registrations.push(claim('maria@school.edu.ph', 'claim-maria'), claim('jose@school.edu.ph', 'claim-jose'),
    claim('maria@school.edu.ph', 'claim-other-invitation', { invitation_id: 'another-invitation' }),
    claim('maria@school.edu.ph', 'claim-old-token', { token_hash: 'retired-token-hash' }));
  const results = await Promise.all(['maria@school.edu.ph', 'jose@school.edu.ph'].map(email => service.verifyEmail(token, { email, code: '123456' })));
  assert.notEqual(results[0].verificationToken, results[1].verificationToken);
  assert.equal(rpcCalls.length, 2);
  for (const { input } of rpcCalls) {
    const expectedChallenge = input.p_email.startsWith('maria') ? 'claim-maria-challenge' : 'claim-jose-challenge';
    const proof = results.find(result => result.verifiedEmail === input.p_email).verificationToken;
    assert.equal(input.p_challenge_id, expectedChallenge);
    assert.equal(input.p_verification_hash, service.digest(proof));
    assert.equal(input.p_code_hash, service.codeHash(tokenHash, input.p_email, expectedChallenge, '123456'));
    assert.equal(Object.values(input).includes(proof), false);
  }
  assert.equal(client.writes.length, 0);
});

test('shared-link registration dispatches per teacher and leaves the invitation usable for another visitor', async () => {
  groupFixture(async (name, input) => {
    assert.equal(name, 'register_teacher_group_invitation');
    const id = `teacher-${client.tables.users.length}`;
    client.tables.users.push({ id, name: input.p_name, email: input.p_email, username: input.p_username, role: 'teacher', department: 'Mathematics', status: 'active' });
    client.tables.teacher_invitations[0].registration_count += 1;
    return { data: id };
  });
  const body = { fullName: 'Maria Santos', email: 'maria@school.edu.ph', username: 'maria.santos', password: 'Password123', confirmPassword: 'Password123', verificationToken: 'a'.repeat(64), role: 'admin', department: 'Science' };
  const results = await Promise.all([service.registerTeacher(token, body), service.registerTeacher(token, {
    ...body, fullName: 'Jose Reyes', email: 'jose@school.edu.ph', username: 'jose.reyes', verificationToken: 'b'.repeat(64),
  })]);
  assert.ok(results.every(result => result.registered && result.user.role === 'teacher' && result.user.department === 'Mathematics'));
  assert.equal(client.tables.teacher_invitations[0].status, 'pending');
  assert.equal(client.tables.teacher_invitations[0].registration_count, 2);
  assert.equal((await service.publicInvitation(token)).status, 'Pending');
  assert.equal((await service.publicInvitation(token)).isGroup, true);
  for (const { input } of rpcCalls) {
    assert.equal(input.p_token_hash, tokenHash);
    assert.equal(Object.hasOwn(input, 'p_role'), false);
    assert.equal(Object.hasOwn(input, 'p_department'), false);
    assert.equal(Object.hasOwn(input, 'p_headteacher_id'), false);
    assert.match(input.p_password_hash, /^\$2[aby]\$/);
  }
  assert.notEqual(rpcCalls[0].input.p_verification_hash, rpcCalls[1].input.p_verification_hash);
});
