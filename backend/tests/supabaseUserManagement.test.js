const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const controller = require('../controllers/adminController');
const id = 'b6d565d69a7f4db1bd6f1ebfcc1a6444';
const account = { id, name: 'Test user', email: 'user@example.test', username: 'user', role: 'secretary', status: 'active' };
async function invoke(action, req = {}) {
  let body;
  await controller[action]({ params: { id }, body: {}, ...req }, {
    status() { return this; }, json(value) { body = value; return this; },
  }, (error) => { throw error; });
  return body;
}
test('admin reads Supabase profiles with non-ObjectId IDs for every role', async () => {
  for (const role of ['secretary', 'headteacher', 'admin', 'teacher', 'student']) {
    client = createFakeSupabase({ users: [{ ...account, role }] });
    const result = await invoke('getUserById');
    assert.equal(result.user.id, id);
    assert.equal(result.user.role, role);
    assert.equal(result.user.password, '');
  }
});
test('admin updates Supabase account and permits its existing username', async () => {
  client = createFakeSupabase({ users: [account] });
  await invoke('updateUser', { body: { name: 'Updated', username: 'user' } });
  assert.equal(client.tables.users[0].name, 'Updated');
  client.tables.users.push({ ...account, id: 'other', email: 'other@example.test', username: 'other' });
  await assert.rejects(invoke('updateUser', { body: { email: 'other@example.test' } }), { statusCode: 409 });
  await assert.rejects(invoke('updateUser', { body: { username: 'other' } }), { statusCode: 409 });
});
test('missing Supabase profile returns 404', async () => {
  client = createFakeSupabase({ users: [] });
  await assert.rejects(invoke('getUserById'), { statusCode: 404 });
});
test('delete verifies admin password and deletes only the requested Supabase account', async () => {
  client = createFakeSupabase({ users: [account, { ...account, id: 'admin', role: 'admin', password_hash: await bcrypt.hash('Password123!', 4) }] });
  await assert.rejects(invoke('deleteUser', { user: { _id: 'admin' }, body: { currentPassword: 'wrong' } }), { statusCode: 401 });
  assert.equal(client.tables.users.length, 2);
  await invoke('deleteUser', { user: { _id: 'admin' }, body: { currentPassword: 'Password123!' } });
  assert.deepEqual(client.tables.users.map((row) => row.id), ['admin']);
});


