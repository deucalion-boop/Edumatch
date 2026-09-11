const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidGmailEmail, assertGmailEmail } = require('../utils/emailPolicy');
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
  await assert.rejects(createSupabaseAccount({ name: 'User', email: 'user@example.com', role: 'student' }), { statusCode: 400 });
  const user = await findSupabaseAccount('id', 'user');
  user.email = 'fakegmail.com';
  await assert.rejects(user.save(), { statusCode: 400 });
  assert.deepEqual(client.writes, []);
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
