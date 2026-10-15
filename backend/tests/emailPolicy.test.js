const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidGmailEmail, assertGmailEmail, isValidTeacherEmail, assertTeacherEmail, assertAccountEmail } = require('../utils/emailPolicy');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const { createSupabaseAccount, findSupabaseAccount } = require('../services/supabaseAccountService');

test('Gmail policy rejects missing, malformed and other-provider addresses', () => {
  for (const value of ['', 'user', 'usergmail.com', 'user@yahoo.com', 'user@gmail.com.fake', 'user@@gmail.com', '.user@gmail.com', 'user..name@gmail.com', 'user name@gmail.com', 'user_123@gmail.com']) {
    assert.equal(isValidGmailEmail(value), false, value);
    assert.throws(() => assertGmailEmail(value), { statusCode: 400 });
  }
  for (const value of ['user@gmail.com', 'user.name@gmail.com', 'user.name+school@gmail.com', ' USER123@GMAIL.COM ']) {
    assert.equal(isValidGmailEmail(value), true, value);
  }
});

test('account creation and edits enforce Gmail on the server without writing invalid addresses', async () => {
  client = createFakeSupabase({ users: [{ id: 'user', email: 'user@gmail.com', role: 'student', status: 'active' }] });
  await assert.rejects(createSupabaseAccount({ name: 'User', username: 'student', email: 'user@example.com', role: 'student' }), { statusCode: 400 });
  const user = await findSupabaseAccount('id', 'user');
  user.email = 'fakegmail.com';
  await assert.rejects(user.save(), { statusCode: 400 });
  assert.deepEqual(client.writes, []);
});

test('teacher email policy accepts and normalizes ASCII school and Gmail addresses', () => {
  for (const value of ['maria.santos@school.edu.ph', ' STAFF_123+math@Senior-High.School.edu.ph ', 'teacher@gmail.com']) {
    assert.equal(isValidTeacherEmail(value), true, value);
    assert.equal(assertTeacherEmail(value), value.trim().toLowerCase());
    assert.equal(assertAccountEmail(value, 'teacher'), value.trim().toLowerCase());
  }
});

test('teacher email policy rejects malformed, overlong and injected addresses', () => {
  for (const value of [
    '', 'teacher', 'teacher@@school.edu.ph', 'teacher@localhost', 'teacher@school..edu.ph',
    '.teacher@school.edu.ph', 'teacher.@school.edu.ph', 'teacher..name@school.edu.ph',
    'teacher name@school.edu.ph', 'teacher@-school.edu.ph', 'teacher@school-.edu.ph',
    'teacher@school_name.edu.ph', 'teacher@school.123', 'tëacher@school.edu.ph',
    'teacher@school.edu.ph\r\nBcc: victim@example.com', '\nname@school.edu.ph', 'name@school.edu.ph\t',
    `name\0@school.edu.ph`, `${'a'.repeat(65)}@school.edu.ph`, `name@${'a'.repeat(64)}.edu.ph`,
    `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(60)}.com`,
  ]) {
    assert.equal(isValidTeacherEmail(value), false, value);
    assert.throws(() => assertTeacherEmail(value), { statusCode: 400 });
  }
});

test('school email support is limited to teacher accounts', async () => {
  client = createFakeSupabase({ users: [] });
  for (const role of ['student', 'admin', 'headteacher']) {
    assert.throws(() => assertAccountEmail('staff@school.edu.ph', role), { statusCode: 400 });
    await assert.rejects(createSupabaseAccount({ name: 'Staff', username: `staff-${role}`, email: 'staff@school.edu.ph', role }), { statusCode: 400 });
    assert.equal(assertAccountEmail(' STAFF@GMAIL.COM ', role), 'staff@gmail.com');
  }
  assert.deepEqual(client.writes, []);
});

test('a teacher with school email can be created and subsequently saved', async () => {
  client = createFakeSupabase({ users: [] });
  const teacher = await createSupabaseAccount({
    name: 'Maria Santos', username: 'maria.santos', email: ' Maria.Santos@School.edu.ph ', role: 'teacher', status: 'active',
  });
  assert.equal(teacher.email, 'maria.santos@school.edu.ph');
  teacher.lastLoginAt = new Date();
  await teacher.save();
  assert.equal(client.tables.users[0].email, 'maria.santos@school.edu.ph');
  assert.equal(client.writes.length, 2);
  teacher.email = 'maria@school..edu.ph';
  await assert.rejects(teacher.save(), { statusCode: 400 });
  assert.equal(client.writes.length, 2);
});

test('changing Gmail address revokes sessions and open email codes and increments token version', async () => {
  client = createFakeSupabase({
    users: [{ id: 'user', email: 'old@gmail.com', role: 'student', status: 'active', token_version: 2 }],
    sessions: [{ id: 'session', user_id: 'user', revoked_at: null }, { id: 'other-session', user_id: 'other', revoked_at: null }],
    otp_challenges: [{ id: 'code', user_id: 'user', consumed_at: null }, { id: 'other-code', user_id: 'other', consumed_at: null }],
  });
  const user = await findSupabaseAccount('id', 'user');
  user.email = 'new@gmail.com';
  await user.save();
  assert.equal(client.tables.users[0].email, 'new@gmail.com');
  assert.equal(client.tables.users[0].token_version, 3);
  assert.ok(client.tables.sessions[0].revoked_at);
  assert.ok(client.tables.otp_challenges[0].consumed_at);
  assert.equal(client.tables.sessions[1].revoked_at, null);
  assert.equal(client.tables.otp_challenges[1].consumed_at, null);
});
