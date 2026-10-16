const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
process.env.JWT_SECRET = 'student-private-registration-test-secret-32';
let client;
let emails = 0;
storage.getSupabaseStorageClient = () => client;
require('../services/gmailService').sendEmailViaGmail = async () => { emails += 1; return { sent: true }; };
const { create, list } = require('../controllers/studentPrivateRegistrationController');
const { validateInvite, completeInvite } = require('../controllers/authController');
const teacher = { _id: 'teacher', role: 'teacher', status: 'active', name: 'Teacher', subject: 'MAPEH',
  department: 'MAPEH', advisorySectionId: 'charity', managedBy: 'headteacher' };
function fixture() {
  emails = 0;
  client = createFakeSupabase({
    users: [{ id: 'teacher', role: 'teacher', status: 'active', name: 'Teacher', subject: 'MAPEH',
      department: 'MAPEH', advisory_section_id: 'charity', managed_by: 'headteacher' }],
    sections: [{ id: 'charity', name: 'Charity', is_active: true }],
    subjects: [{ id: 'class', teacher_id: 'teacher', name: 'MAPEH', class_name: 'MAPEH 10 - Charity',
      track: 'GENERAL', is_active: true, advisory_section_id: 'charity' }],
    subject_enrollments: [],
  });
}
async function invoke(controller, overrides = {}) {
  let result;
  await controller({ user: teacher, body: {}, protocol: 'https', get: () => 'school.example.test', ...overrides }, {
    status() { return this; }, json(body) { result = body; return this; },
  }, error => { throw error; });
  return result;
}
const studentDetails = { fullName: 'Maria Santos', email: 'maria.santos@gmail.com', username: 'maria.santos', password: 'Password123!' };
const tokenOf = response => response.invite.inviteLink.split('/').at(-1);

test('teacher creates a private link without student details, spreadsheet, email or temporary password', async () => {
  fixture();
  const response = await invoke(create);
  assert.match(response.invite.inviteLink, /\/auth\/invite\/[a-f0-9]{64}$/);
  assert.equal(response.section.name, 'Charity');
  const student = client.tables.users.find(row => row.role === 'student');
  assert.equal(student.status, 'pending');
  assert.equal(student.invite.selfRegistration, true);
  assert.equal(student.section_id, 'charity');
  assert.equal(student.managed_by, 'teacher');
  assert.equal(emails, 0);
  assert.equal(response.invite.generatedPassword, undefined);
  assert.equal(client.tables.subject_enrollments[0].subject_id, 'class');
});

test('Head Teacher creates links only for their managed department teachers', async () => {
  fixture();
  const user = { _id: 'headteacher', role: 'headteacher', department: 'MAPEH' };
  const response = await invoke(create, { user, body: { teacherId: 'teacher' } });
  assert.equal(response.section.name, 'Charity');
  await assert.rejects(invoke(create, { user: { ...user, _id: 'other-headteacher' }, body: { teacherId: 'teacher' } }), { statusCode: 404 });
  await assert.rejects(invoke(create, { user: { ...user, department: 'Science' }, body: { teacherId: 'teacher' } }), { statusCode: 404 });
});

test('student completes private registration and preserves advisory ownership; used link cannot register again', async () => {
  fixture();
  const response = await invoke(create);
  const params = { token: tokenOf(response) };
  const valid = await invoke(validateInvite, { params });
  assert.equal(valid.invite.selfRegistration, true);
  assert.equal(valid.invite.email, '');
  await invoke(completeInvite, { params, body: studentDetails });
  const student = client.tables.users.find(row => row.role === 'student');
  assert.equal(student.name, 'Maria Santos');
  assert.equal(student.status, 'active');
  assert.equal(student.department, 'MAPEH');
  assert.equal(student.section_id, 'charity');
  assert.equal(student.managed_by, 'teacher');
  assert.equal(await bcrypt.compare(studentDetails.password, student.password_hash), true);
  await assert.rejects(invoke(completeInvite, { params, body: studentDetails }), { statusCode: 400 });
});

test('expired link and changed advisory assignment cannot activate an account', async () => {
  fixture();
  let response = await invoke(create);
  let student = client.tables.users.find(row => row.role === 'student');
  student.invite.expiresAt = new Date(Date.now() - 1000).toISOString();
  await assert.rejects(invoke(completeInvite, { params: { token: tokenOf(response) }, body: studentDetails }), { statusCode: 400 });
  fixture();
  response = await invoke(create);
  client.tables.users[0].advisory_section_id = 'unity';
  await assert.rejects(invoke(completeInvite, { params: { token: tokenOf(response) }, body: studentDetails }), { statusCode: 409 });
  student = client.tables.users.find(row => row.role === 'student');
  assert.equal(student.status, 'pending');
});

test('inactive teacher and missing section cannot issue student links', async () => {
  fixture();
  await assert.rejects(invoke(create, { user: { ...teacher, status: 'inactive' } }), { statusCode: 409 });
  await assert.rejects(invoke(create, { user: { ...teacher, advisorySectionId: '' } }), { statusCode: 400 });
  assert.equal(client.tables.users.length, 1);
});

test('teacher class list recovers only their active registration links without storing plaintext', async () => {
  fixture();
  const created = await invoke(create);
  const student = client.tables.users.find(row => row.role === 'student');
  assert.equal(JSON.stringify(student.invite).includes(tokenOf(created)), false);
  const response = await invoke(list);
  assert.equal(response.links.length, 1);
  assert.equal(response.links[0].subjectId, 'class');
  assert.equal(response.links[0].inviteLink, created.invite.inviteLink);
  assert.equal((await invoke(list, { user: { ...teacher, _id: 'other-teacher' } })).links.length, 0);
  assert.equal((await invoke(list, { user: { ...teacher, advisorySectionId: 'unity' } })).links.length, 0);
  student.invite.expiresAt = new Date(Date.now() - 1000).toISOString();
  assert.equal((await invoke(list)).links.length, 0);
  student.invite.expiresAt = new Date(Date.now() + 60000).toISOString();
  student.invite.usedAt = new Date().toISOString();
  assert.equal((await invoke(list)).links.length, 0);
});
