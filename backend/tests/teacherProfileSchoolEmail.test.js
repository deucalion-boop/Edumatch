const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const { updateTeacherProfile, updateTeacherTourPreference, createStudentInvite } = require('../controllers/teacherController');
const { findSupabaseAccount } = require('../services/supabaseAccountService');

function fixture() {
  client = createFakeSupabase({
    users: [{ id: 'teacher', name: 'Maria Santos', email: 'maria.santos@school.edu.ph',
      username: 'maria.santos', role: 'teacher', status: 'active', department: 'Mathematics', token_version: 2 }],
    sessions: [], otp_challenges: [],
  });
}
async function invoke(handler, body) {
  let response;
  await handler({
    user: await findSupabaseAccount('id', 'teacher'), body,
    protocol: 'http', get: () => 'localhost:5173',
  }, {
    status(statusCode) { this.statusCode = statusCode; return this; },
    json(value) { response = { statusCode: this.statusCode, ...value }; return this; },
  }, (error) => { throw error; });
  return response;
}

test('a school-email teacher can save profile and tour changes without changing or invalidating its email', async () => {
  fixture();
  const response = await invoke(updateTeacherProfile, {
    name: 'Maria Clara Santos', email: ' Maria.Santos@School.edu.ph ',
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.user.email, 'maria.santos@school.edu.ph');
  assert.equal(client.tables.users[0].name, 'Maria Clara Santos');
  assert.equal(client.tables.users[0].token_version, 2);
  await invoke(updateTeacherTourPreference, { hasCompletedTeacherTour: true });
  assert.equal(client.tables.users[0].has_completed_teacher_tour, true);
  assert.equal(client.tables.users[0].email, 'maria.santos@school.edu.ph');
});

test('teacher profile rejects invalid or injected school emails before any write', async () => {
  fixture();
  for (const email of ['maria@school..edu.ph', 'maria@-school.edu.ph', 'maria@school.edu.ph\r\n', 'maria name@school.edu.ph']) {
    await assert.rejects(invoke(updateTeacherProfile, { name: 'Maria Santos', email }), { statusCode: 400 });
  }
  assert.deepEqual(client.writes, []);
});

test('a teacher with a school email must still use Gmail for student account creation', async () => {
  fixture();
  await assert.rejects(invoke(createStudentInvite, {
    name: 'Juan Dela Cruz', email: 'juan@school.edu.ph', username: 'juan.delacruz',
  }), { statusCode: 400 });
  assert.deepEqual(client.writes, []);
});

test('teacher frontend and backend email validation agree on school, Gmail and malformed inputs', async () => {
  const frontend = await import('../../frontend/src/utils/emailPolicy.js');
  const backend = require('../utils/emailPolicy');
  for (const email of ['maria.santos@school.edu.ph', ' STAFF_123+math@Senior-High.School.edu.ph ', 'teacher@gmail.com',
    'teacher@localhost', 'teacher@school..edu.ph', 'teacher@school.edu.ph\n', 'teacher@school-.edu.ph',
    '.teacher@school.edu.ph', 'tëacher@school.edu.ph', `${'a'.repeat(65)}@school.edu.ph`]) {
    assert.equal(frontend.isValidTeacherEmail(email), backend.isValidTeacherEmail(email), email);
  }
});
