const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
let client;
require('../services/supabaseStorageService').getSupabaseStorageClient = () => client;
const service = require('../services/studentNotificationService');
const store = require('../services/supabaseNotificationService');
const announcements = require('../controllers/studentAnnouncementController');
function fixture() {
  client = createFakeSupabase({ users: [
    { id: 'teacher', role: 'teacher', advisory_section_id: 'section' },
    ...['approved', 'pending', 'other'].map(id => ({ id, role: 'student', status: 'active', section_id: id === 'other' ? 'elsewhere' : 'section' })),
    { id: 'inactive', role: 'student', status: 'inactive', section_id: 'section' }
  ], subjects: [{ id: 'subject', teacher_id: 'teacher', name: 'Math', is_active: true }],
  subject_enrollments: ['approved','pending','inactive'].map(id => ({ id, student_id: id, teacher_id: 'teacher', subject_id: 'subject', status: id === 'pending' ? 'pending' : 'approved' })) });
}
const publisher = { _id: 'teacher', role: 'teacher', name: 'Teacher' };
const lesson = { _id: 'lesson', createdBy: 'teacher', subjectId: 'subject', title: 'Fractions', subject: 'Math' };
test('lesson uses approved Supabase class members, deduplicates and preserves read status', async () => {
 fixture(); await service.notifyLessonPublished({ lesson, publisher });
 assert.deepEqual(client.tables.notifications.map(row => row.recipient_id), ['approved']);
 const row = client.tables.notifications[0];
 assert.equal(row.meta.route, '/student/lessons?lessonId=lesson');
 await store.markNotificationViewed({ id: row.id, recipientId: 'approved', recipientRole: 'student' });
 await service.notifyLessonPublished({ lesson, publisher });
 assert.equal(client.tables.notifications.length, 1);
 assert.equal(client.tables.notifications[0].is_viewed, true);
 assert.equal(await store.countUnreadNotifications({ recipientId: 'approved', recipientRole: 'student' }), 0);
});
test('activity, quiz and exam notifications respect assigned class and advisory audiences', async () => {
 fixture();
 for (const [mode, label] of [['activity','Activity'],['quiz','Quiz'],['grading_assessment','Exam']]) {
   await service.notifyAssessmentAssigned({ publisher, assessment: { _id: mode, subjectId: 'subject', assessmentMode: mode, assignedStudentIds: ['approved','other'], title: label, subject: 'Math' } });
 }
 assert.deepEqual(client.tables.notifications.map(row => [row.recipient_id, row.meta.contentType]), [['approved','Activity'],['approved','Quiz'],['approved','Exam']]);
 await service.notifyAssessmentAssigned({ publisher, assessment: { _id: 'advisory', assignmentScope: 'advisory_class', assessmentMode: 'quiz', assignedStudentIds: ['pending','other'] } });
 assert.equal(client.tables.notifications.at(-1).recipient_id, 'pending');
 assert.equal(client.tables.notifications.length, 4);
});
test('foreign teacher cannot target a subject; read and all-read stay recipient scoped', async () => {
 fixture(); await service.notifyAssessmentAssigned({ publisher: { _id: 'foreign' }, assessment: { _id: 'bad', subjectId: 'subject' } });
 assert.equal(client.tables.notifications?.length || 0, 0);
 await service.notifyLessonPublished({ lesson, publisher });
 const id = client.tables.notifications[0].id;
 assert.equal(await store.markNotificationViewed({ id, recipientId: 'other', recipientRole: 'student' }), null);
 await store.markAllNotificationsViewed({ recipientId: 'other', recipientRole: 'student' });
 assert.equal(await store.countUnreadNotifications({ recipientId: 'approved', recipientRole: 'student' }), 1);
 await store.markAllNotificationsViewed({ recipientId: 'approved', recipientRole: 'student' });
 assert.equal(await store.countUnreadNotifications({ recipientId: 'approved', recipientRole: 'student' }), 0);
});
async function invoke(handler, req) {
 let body; await handler(req, { status() { return this; }, json(value) { body = value; } }, error => { throw error; }); return body;
}
test('announcement retries deduplicate and full message is only retrievable by its recipient', async () => {
 fixture(); const req = { user: publisher, params: { subjectId: 'subject' }, body: { title: 'Reminder', content: 'Bring your workbook.', requestId: 'request-1234567890' } };
 await invoke(announcements.publishAnnouncement, req); await invoke(announcements.publishAnnouncement, req);
 assert.equal(client.tables.notifications.length, 1);
 const event = client.tables.notifications[0].event_key;
 const result = await invoke(announcements.getAnnouncement, { user: { _id: 'approved', role: 'student' }, query: { event } });
 assert.equal(result.announcement.content, 'Bring your workbook.');
 await assert.rejects(invoke(announcements.getAnnouncement, { user: { _id: 'other', role: 'student' }, query: { event } }), { statusCode: 404 });
 await assert.rejects(invoke(announcements.publishAnnouncement, { ...req, user: { _id: 'other' } }), { statusCode: 404 });
});
