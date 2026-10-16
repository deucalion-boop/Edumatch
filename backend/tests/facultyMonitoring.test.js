const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const { buildFacultyMonitoring } = require('../services/facultyMonitoringService');
const { getDirectory } = require('../controllers/secretaryController');
const accounts = [
  { id: 'head', role: 'headteacher', department: 'Science' },
  { id: 'teacher', role: 'teacher', name: 'Biology Teacher', subject: 'Biology', department: 'Science', advisorySectionId: 'section', managedBy: 'head' },
  { id: 'other', role: 'teacher', name: 'Other Teacher', department: 'Science', managedBy: 'other-head' },
  { id: 'student', role: 'student', status: 'active' },
  { id: 'pending', role: 'student', status: 'pending' },
  { id: 'archived', role: 'student', status: 'inactive', archive: { isArchived: true } },
];
function fixture() {
  client = createFakeSupabase({
    subjects: [
      { id: 'one', teacher_id: 'teacher', name: 'Biology', class_name: 'Biology 10 - Charity', is_active: true },
      { id: 'two', teacher_id: 'teacher', name: 'Biology', class_name: 'Biology 10 - Unity', is_active: true },
      { id: 'inactive', teacher_id: 'teacher', is_active: false },
      { id: 'foreign', teacher_id: 'other', is_active: true },
    ],
    sections: [{ id: 'section', name: 'Charity', is_active: true }],
    subject_enrollments: [
      { id: 'a', teacher_id: 'teacher', subject_id: 'one', student_id: 'student', status: 'approved' },
      { id: 'b', teacher_id: 'teacher', subject_id: 'two', student_id: 'student', status: 'approved' },
      { id: 'c', teacher_id: 'teacher', subject_id: 'one', student_id: 'pending', status: 'approved' },
      { id: 'd', teacher_id: 'teacher', subject_id: 'two', student_id: 'archived', status: 'approved' },
      { id: 'e', teacher_id: 'teacher', subject_id: 'inactive', student_id: 'student', status: 'approved' },
      { id: 'f', teacher_id: 'teacher', subject_id: 'foreign', student_id: 'student', status: 'approved' },
    ],
  });
}
test('monitoring counts distinct students and excludes pending accounts, archived students and inactive classes', async () => {
  fixture();
  const summary = (await buildFacultyMonitoring(accounts)).get('teacher');
  assert.equal(summary.assignedSubject, 'Biology');
  assert.equal(summary.advisorySection.name, 'Charity');
  assert.equal(summary.classCount, 2);
  assert.equal(summary.studentCount, 1);
  assert.deepEqual(summary.classes.map(row => row.studentCount), [1, 1]);
  assert.deepEqual(client.writes, []);
});
test('Head Teacher workload includes only managed teachers in their department', async () => {
  fixture();
  const result = await buildFacultyMonitoring(accounts);
  assert.equal(result.get('head').classCount, 2);
  assert.equal(result.get('head').studentCount, 1);
  assert.equal(result.get('head').workloadScope, 'managed_teachers');
  assert.equal(result.get('other').classCount, 1);
});
test('monitoring read failures do not silently report zero workload', async () => {
  fixture();
  client.failures.push({ table: 'subjects', operation: 'select', error: { message: 'offline' } });
  await assert.rejects(buildFacultyMonitoring(accounts), { statusCode: 503 });
});
test('directory denies other roles before reading monitoring records', async () => {
  fixture();
  await assert.rejects(getDirectory({ user: { role: 'teacher' } }, {}, error => { throw error; }), { statusCode: 403 });
});
test('monitoring paginates class reads past the database row limit', async () => {
  fixture();
  client.tables.subjects = Array.from({ length: 510 }, (_, index) => ({ id: `class-${index}`, teacher_id: 'teacher', name: 'Biology', is_active: true }));
  const result = await buildFacultyMonitoring(accounts);
  assert.equal(result.get('teacher').classCount, 510);
});
