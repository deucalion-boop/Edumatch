const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
const originalGetClient = storage.getSupabaseStorageClient;
storage.getSupabaseStorageClient = () => client;
const { ensureDefaultSupabaseAdmin, touchSupabaseAccountActivity } = require('../services/supabaseAccountService');
test.after(() => { storage.getSupabaseStorageClient = originalGetClient; });

const bootstrap = {
  name: 'Initial administrator', email: 'bootstrap@example.test', username: 'bootstrap-admin', password: 'SetupPass123!',
};

test('startup preserves an existing suspended administrator and credentials without requiring a bootstrap password', async () => {
  const existing = {
    id: 'existing-admin', role: 'admin', status: 'suspended', name: 'Existing admin',
    email: 'existing@example.test', username: 'existing', password_hash: 'existing-hash',
    token_version: 8, force_password_change: false,
  };
  client = createFakeSupabase({ users: [existing] });
  const admin = await ensureDefaultSupabaseAdmin({ ...bootstrap, password: undefined });
  assert.equal(admin._id, existing.id);
  assert.equal(admin.status, 'suspended');
  assert.equal(admin.password, existing.password_hash);
  assert.deepEqual(client.tables.users, [existing]);
  assert.deepEqual(client.writes, []);
});

test('bootstrap cannot promote an existing account with the configured email or username', async () => {
  for (const collisionField of ['email', 'username']) {
    const student = {
      id: 'student', role: 'student', status: 'inactive', password_hash: 'student-hash',
      email: 'student@example.test', username: 'student', [collisionField]: bootstrap[collisionField],
    };
    client = createFakeSupabase({ users: [student] });
    await assert.rejects(ensureDefaultSupabaseAdmin(bootstrap), { statusCode: 409 });
    assert.deepEqual(client.tables.users, [student]);
    assert.deepEqual(client.writes, []);
  }
});

test('first administrator creation rejects missing or policy-invalid passwords without database writes', async () => {
  for (const password of [undefined, '', '   ', 'short', 'NoNumbersHere', 'a'.repeat(17)]) {
    client = createFakeSupabase({ users: [] });
    await assert.rejects(ensureDefaultSupabaseAdmin({ ...bootstrap, password }));
    assert.deepEqual(client.tables.users, []);
    assert.deepEqual(client.writes, []);
  }
});

test('first administrator is created with a hashed password and must change it; later starts never overwrite it', async () => {
  client = createFakeSupabase({ users: [] });
  const admin = await ensureDefaultSupabaseAdmin(bootstrap);
  assert.equal(admin.role, 'admin');
  assert.equal(admin.status, 'active');
  assert.equal(admin.forcePasswordChange, true);
  assert.notEqual(admin.password, bootstrap.password);
  assert.equal(await bcrypt.compare(bootstrap.password, admin.password), true);
  const saved = structuredClone(client.tables.users);
  const sameAdmin = await ensureDefaultSupabaseAdmin({ ...bootstrap, password: 'ChangedPass123!' });
  assert.equal(sameAdmin._id, admin._id);
  assert.deepEqual(client.tables.users, saved);
  assert.equal(client.writes.length, 1);
});

test('activity updates preserve password, role, account status, and token revocation version', async () => {
  const account = {
    id: 'account', role: 'teacher', status: 'suspended', password_hash: 'current-password-hash', token_version: 12,
  };
  client = createFakeSupabase({ users: [account, { id: 'other', last_activity_at: null }] });
  const now = new Date();
  await touchSupabaseAccountActivity(account.id, now);
  assert.deepEqual(client.tables.users[0], { ...account, last_activity_at: now.toISOString() });
  assert.equal(client.tables.users[1].last_activity_at, null);
  assert.deepEqual(client.writes[0].payload, { last_activity_at: now.toISOString() });
});
