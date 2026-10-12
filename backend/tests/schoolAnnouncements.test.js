const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');

let client;
require('../services/supabaseStorageService').getSupabaseStorageClient = () => client;
const controller = require('../controllers/schoolAnnouncementController');
const recipientController = require('../controllers/studentAnnouncementController');

function fixture() {
  client = createFakeSupabase({
    users: [
      { id: 'student-1', role: 'student', status: 'active' },
      { id: 'teacher-1', role: 'teacher', status: 'active' },
      { id: 'head-1', role: 'headteacher', status: 'active' },
      { id: 'student-archived', role: 'student', status: 'active', archive: { isArchived: true } },
      { id: 'teacher-inactive', role: 'teacher', status: 'inactive' },
    ],
    school_announcements: [], notifications: [],
  });
}

async function invoke(handler, req) {
  let result;
  await handler(req, { status() { return this; }, json(value) { result = value; } }, (error) => { throw error; });
  return result;
}

const request = () => ({
  user: { _id: 'admin-1', role: 'admin', name: 'System Admin' },
  body: {
    title: 'Campus update', content: 'Classes begin at 8:00 AM tomorrow.',
    audienceRoles: ['student', 'teacher', 'headteacher'], requestId: 'request-1234567890', urgent: true,
  },
});

test('school announcement reaches only active selected audiences and retry is idempotent', async () => {
  fixture();
  const first = await invoke(controller.publishSchoolAnnouncement, request());
  const second = await invoke(controller.publishSchoolAnnouncement, request());
  assert.equal(first.recipientCount, 3);
  assert.equal(second.recipientCount, 3);
  assert.equal(client.tables.school_announcements.length, 1);
  assert.equal(client.tables.notifications.length, 3);
  assert.deepEqual(client.tables.notifications.map((row) => row.recipient_role).sort(), ['headteacher', 'student', 'teacher']);
  assert.ok(client.tables.notifications.every((row) => row.urgent && row.meta.source === 'school'));
});

test('request ID cannot be reused for changed content and recipient feeds remain scoped', async () => {
  fixture();
  await invoke(controller.publishSchoolAnnouncement, request());
  const changed = request(); changed.body.content = 'Changed content';
  await assert.rejects(invoke(controller.publishSchoolAnnouncement, changed), { statusCode: 409 });

  const teacher = await invoke(recipientController.listAnnouncements, { user: { _id: 'teacher-1', role: 'teacher' }, query: {} });
  const student = await invoke(recipientController.listAnnouncements, { user: { _id: 'student-1', role: 'student' }, query: {} });
  assert.equal(teacher.announcements.length, 1);
  assert.equal(student.announcements.length, 1);
  assert.equal(teacher.announcements[0].source, 'school');
  assert.equal(teacher.announcements[0].content, 'Classes begin at 8:00 AM tomorrow.');
});

test('invalid or empty audiences are rejected before writing', async () => {
  fixture();
  const invalid = request(); invalid.body.audienceRoles = ['admin'];
  await assert.rejects(invoke(controller.publishSchoolAnnouncement, invalid), { statusCode: 400 });
  assert.equal(client.tables.school_announcements.length, 0);
  assert.equal(client.tables.notifications.length, 0);
});
