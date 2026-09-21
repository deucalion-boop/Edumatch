const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
require('../services/gmailService').sendEmailViaGmail = async () => ({ sent: true });
const controller = require('../controllers/adminController');
const id = 'b6d565d69a7f4db1bd6f1ebfcc1a6444';
const account = { id, name: 'Test user', email: 'user@gmail.com', username: 'user', role: 'secretary', status: 'active' };
async function invoke(action, req = {}) {
  let body;
  await controller[action]({
    params: { id },
    body: {},
    user: { _id: 'admin', role: 'admin' },
    protocol: 'http',
    get: () => '',
    ...req,
  }, {
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
  client.tables.users.push({ ...account, id: 'other', email: 'other@gmail.com', username: 'other' });
  await assert.rejects(invoke('updateUser', { body: { email: 'other@gmail.com' } }), { statusCode: 409 });
  await assert.rejects(invoke('updateUser', { body: { username: 'other' } }), { statusCode: 409 });
});
test('missing Supabase profile returns 404', async () => {
  client = createFakeSupabase({ users: [] });
  await assert.rejects(invoke('getUserById'), { statusCode: 404 });
});
test('delete verifies admin password and deletes only the requested Supabase account', async () => {
  client = createFakeSupabase({ users: [account, { ...account, id: 'admin', role: 'admin', password_hash: await bcrypt.hash('Password123!', 4) }] });
  await assert.rejects(invoke('deleteUser', { user: { _id: 'admin', role: 'admin' }, body: { currentPassword: 'wrong' } }), { statusCode: 401 });
  assert.equal(client.tables.users.length, 2);
  await invoke('deleteUser', { user: { _id: 'admin', role: 'admin' }, body: { currentPassword: 'Password123!' } });
  assert.deepEqual(client.tables.users.map((row) => row.id), ['admin']);
});

test('secretary can manage instructional roles but cannot manage secretary or admin accounts', async () => {
  client = createFakeSupabase({ users: [{ ...account, role: 'teacher', department: 'Science' }] });
  await invoke('updateUser', {
    user: { _id: 'secretary-id', role: 'secretary' },
    body: { name: 'Updated teacher' },
  });
  assert.equal(client.tables.users[0].name, 'Updated teacher');

  client = createFakeSupabase({ users: [{ ...account, role: 'secretary' }] });
  await assert.rejects(invoke('updateUser', {
    user: { _id: 'secretary-id', role: 'secretary' },
    body: { name: 'Not allowed' },
  }), { statusCode: 403 });
});

test('admin can update teacher and student accounts directly', async () => {
  for (const role of ['teacher', 'student']) {
    client = createFakeSupabase({ users: [{ ...account, role, department: role === 'teacher' ? 'Science' : '' }] });
    await invoke('updateUser', { body: { name: `Updated ${role}` } });
    assert.equal(client.tables.users[0].name, `Updated ${role}`);
  }
});

test('admin and secretary create directly managed roles with the selected role and scoped fields', async () => {
  client = createFakeSupabase({ users: [] });
  const studentResult = await invoke('createUser', {
    user: { _id: 'admin', role: 'admin' },
    body: {
      name: 'Student User', email: 'student.user@gmail.com', username: 'student.user',
      role: 'student', gradeLevel: 'Grade 10', strand: 'STEM',
    },
  });
  assert.equal(studentResult.user.role, 'student');
  assert.equal(studentResult.user.gradeLevel, 'Grade 10');
  assert.equal(client.tables.users[0].role, 'student');
  assert.equal(client.tables.users[0].force_password_change, true);
  assert.equal(
    await bcrypt.compare(studentResult.invite.generatedPassword, client.tables.users[0].password_hash),
    true,
  );

  const teacherResult = await invoke('createUser', {
    user: { _id: 'secretary-id', role: 'secretary' },
    body: {
      name: 'Teacher User', email: 'teacher.user@gmail.com', username: 'teacher.user',
      role: 'teacher', department: 'Science', subject: 'Biology',
    },
  });
  assert.equal(teacherResult.user.role, 'teacher');
  assert.equal(teacherResult.user.department, 'Science');
  assert.equal(teacherResult.user.subject, 'Biology');
  assert.equal(client.tables.users[1].role, 'teacher');
});


