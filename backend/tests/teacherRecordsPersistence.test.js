const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const { teacherRequests, decideTeacherRequest, teacherResultData } = require('../services/supabaseTeacherRecordsService');
function fixture() {
  client = createFakeSupabase({
    users: [{ id: 'student-long-supabase-id', name: 'Student', archive: {} }],
    subjects: [{ id: 'class', teacher_id: 'teacher' }, { id: 'foreign', teacher_id: 'other' }],
    subject_enrollments: [{ id: 'request-long-supabase-id', student_id: 'student-long-supabase-id', teacher_id: 'teacher', subject_id: 'class', status: 'pending' }],
    lessons: [{ id: 'lesson', created_by: 'teacher', title: 'Lesson' }],
    assessments: [{ id: 'assessment', created_by: 'teacher', subject_id: 'class', lesson_id: 'lesson' }, { id: 'foreign-assessment', created_by: 'other', subject_id: 'foreign' }],
    submissions: [{ id: 'submission', student_id: 'student-long-supabase-id', assessment_id: 'assessment', status: 'completed', score: 8, total_points: 10 }, { id: 'foreign-submission', student_id: 'student-long-supabase-id', assessment_id: 'foreign-assessment', status: 'completed' }],
  });
}
test('requests list and approval share Supabase rows and approval makes results available', async () => {
  fixture();
  assert.equal((await teacherRequests('teacher'))[0].studentId.name, 'Student');
  assert.equal((await teacherRequests('other')).length, 0);
  assert.equal((await teacherResultData('teacher')).submissions.length, 0);
  await decideTeacherRequest('teacher', 'request-long-supabase-id', 'approved');
  assert.equal(client.tables.subject_enrollments[0].status, 'approved');
  assert.ok(client.tables.subject_enrollments[0].decided_at);
  assert.equal((await teacherRequests('teacher')).length, 0);
  const result = await teacherResultData('teacher');
  assert.equal(result.submissions.length, 1);
  assert.equal(result.submissions[0].totalPoints, 10);
  assert.equal(result.assessmentsById.get('assessment').lessonId.title, 'Lesson');
  assert.equal((await teacherResultData('teacher', 'foreign')).submissions.length, 0);
  assert.equal((await teacherResultData('teacher', '', 'other-student')).submissions.length, 0);
  client.tables.users[0].archive.isArchived = true;
  assert.equal((await teacherResultData('teacher')).submissions.length, 0);
});
test('decisions enforce ownership, pending state, and persist rejection', async () => {
  fixture();
  await assert.rejects(decideTeacherRequest('other', 'request-long-supabase-id', 'approved'), { statusCode: 404 });
  await decideTeacherRequest('teacher', 'request-long-supabase-id', 'rejected');
  assert.equal(client.tables.subject_enrollments[0].status, 'rejected');
  await assert.rejects(decideTeacherRequest('teacher', 'request-long-supabase-id', 'approved'), { statusCode: 409 });
  assert.equal(client.tables.subject_enrollments[0].status, 'rejected');
});
test('Supabase failures propagate instead of returning empty successful lists', async () => {
  fixture();
  client.failures.push({ table: 'subject_enrollments', operation: 'select', error: { message: 'Unavailable' } });
  await assert.rejects(teacherRequests('teacher'), /Unavailable/);
});
