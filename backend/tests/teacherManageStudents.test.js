const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const controller = require('../controllers/teacherController');
const { decideTeacherRequest } = require('../services/supabaseTeacherRecordsService');
const subjectId = '97d1d3a160134761872a768c581f5df7';
function fixture() {
  client = createFakeSupabase({
    subjects: [{ id: subjectId, teacher_id: 'teacher', name: 'Math', code: 'MATH', is_active: true }],
    users: [{ id: 'student', name: 'Student', email: 'student@gmail.com', role: 'student', archive: {}, enrollment: {} }, { id: 'archived', name: 'Archived', archive: { isArchived: true } }],
    subject_enrollments: [{ id: 'enrollment', subject_id: subjectId, teacher_id: 'teacher', student_id: 'student', status: 'approved' }, { id: 'archived-enrollment', subject_id: subjectId, teacher_id: 'teacher', student_id: 'archived', status: 'approved' }],
    assessments: [{ id: 'assessment', created_by: 'teacher', subject_id: subjectId, assignment_scope: 'handled_class', assigned_student_ids: ['student', 'peer'] }, { id: 'foreign', created_by: 'other', subject_id: subjectId, assignment_scope: 'handled_class', assigned_student_ids: ['student'] }],
  });
}
async function call(name, params = { subjectId }, teacherId = 'teacher') {
  let response;
  await controller[name]({ params, query: {}, user: { _id: teacherId } }, {
    status() { return this; }, json(body) { response = body; },
  }, error => { throw error; });
  return response;
}
test('Manage Students accepts the exact Supabase ID and returns only non-archived enrolled students', async () => {
  fixture();
  const body = await call('getTeacherSubjectStudents');
  assert.equal(body.subject.id, subjectId);
  assert.deepEqual(body.students.map(row => row.id), ['student']);
  assert.equal(body.students[0].email, 'student@gmail.com');
  const roster = await call('getTeacherStudents');
  assert.deepEqual(roster.students.map(row => row.id), ['student']);
});
test('invalid, missing, unknown and foreign subject IDs return meaningful errors', async () => {
  fixture();
  for (const value of ['', 'bad id', undefined]) await assert.rejects(call('getTeacherSubjectStudents', { subjectId: value }), { statusCode: 400 });
  await assert.rejects(call('getTeacherSubjectStudents', { subjectId: 'missing' }), { statusCode: 404 });
  await assert.rejects(call('getTeacherSubjectStudents', { subjectId }, 'other'), { statusCode: 404 });
  await assert.rejects(call('removeTeacherSubjectStudent', { subjectId, studentId: 'student' }, 'other'), { statusCode: 404 });
  assert.deepEqual(client.writes, []);
});
test('removal updates Supabase enrollment and only the owning class assessment assignments', async () => {
  fixture();
  await call('removeTeacherSubjectStudent', { subjectId, studentId: 'student' });
  assert.equal(client.tables.subject_enrollments.some(row => row.id === 'enrollment'), false);
  assert.deepEqual(client.tables.assessments[0].assigned_student_ids, ['peer']);
  assert.deepEqual(client.tables.assessments[1].assigned_student_ids, ['student']);
  assert.equal((await call('getTeacherSubjectStudents')).students.length, 0);
  assert.equal(client.tables.users.length, 2);
  await assert.rejects(call('removeTeacherSubjectStudent', { subjectId, studentId: 'student' }), { statusCode: 404 });
});
test('approving a pending request adds the student to the same Manage Students roster', async () => {
  fixture(); client.tables.subject_enrollments[0].status = 'pending';
  assert.equal((await call('getTeacherSubjectStudents')).students.length, 0);
  await decideTeacherRequest('teacher', 'enrollment', 'approved');
  assert.equal((await call('getTeacherSubjectStudents')).students[0].id, 'student');
});
test('failed assignment cleanup leaves the enrollment available for retry', async () => {
  fixture(); client.failures.push({ table: 'assessments', operation: 'update', error: { message: 'Unavailable' } });
  await assert.rejects(call('removeTeacherSubjectStudent', { subjectId, studentId: 'student' }), /Unavailable/);
  assert.equal(client.tables.subject_enrollments[0].id, 'enrollment');
});
