const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const controller = require('../controllers/studentController');
const { studentSubmissions, availableAssessments, studentAttendance } = require('../services/supabaseStudentDashboardService');
const sectionId = '97d1d3a160134761872a768c581f5df7';
function fixture() {
 client = createFakeSupabase({
  users: [{ id: 'student', name: 'Student', role: 'student', grade_level: 'Grade 10', section_id: sectionId }, { id: 'teacher', role: 'teacher', name: 'Adviser', advisory_section_id: sectionId }],
  sections: [{ id: sectionId, name: 'Section A', is_active: true }],
  subjects: [{ id: 'subject', name: 'Math', teacher_id: 'teacher' }],
  subject_enrollments: [{ id: 'enrollment', student_id: 'student', subject_id: 'subject', teacher_id: 'teacher', status: 'approved' }],
  lessons: [{ id: 'lesson', title: 'Lesson', subject_id: 'subject', created_by: 'teacher', attachments: [] }],
  assessments: [{ id: 'assessment', title: 'Assessment', subject_id: 'subject', created_by: 'teacher', lesson_id: 'lesson', assessment_mode: 'activity', assigned_student_ids: [], questions: [{ correctAnswer: 'secret' }] }, { id: 'other', subject_id: 'other-subject', assigned_student_ids: [] }],
  submissions: [{ id: 'submission', student_id: 'student', assessment_id: 'assessment', status: 'completed', score: 5, total_points: 10 }, { id: 'foreign', student_id: 'other-student', assessment_id: 'assessment', status: 'completed' }],
  attendance_records: [{ id: 'attendance', entries: [{ studentId: 'student', status: 'Present' }] }, { id: 'other-attendance', entries: [{ studentId: 'other-student' }] }],
 });
}
async function invoke(name) {
 let body;
 await controller[name]({ user: { _id: 'student', role: 'student', gradeLevel: 'Grade 10' }, protocol: 'http', get: () => 'localhost', query: {} }, { status() { return this; }, json(value) { body = value; } }, error => { throw error; });
 return body;
}
test('Supabase section and adviser IDs match and remain available when optional lesson counts fail', async () => {
 fixture();
 assert.equal((await invoke('getStudentProfile')).user.adviser.name, 'Adviser');
 client.failures.push({ table: 'lessons', operation: 'select', error: { message: 'Unavailable' } });
 const subjects = await invoke('getMySubjects');
 assert.equal(subjects.studentContext.section.id, sectionId);
 assert.equal(subjects.studentContext.adviser.id, 'teacher');
});
test('null adviser means no matching teacher; null section means no assignment', async () => {
 fixture(); client.tables.users[1].advisory_section_id = 'different';
 assert.equal((await invoke('getStudentProfile')).user.adviser, null);
 client.tables.users[0].section_id = null;
 assert.equal((await invoke('getStudentProfile')).user.section, null);
});
test('dashboard lesson, assessment and submission reads use Supabase and scope access', async () => {
 fixture();
 assert.equal((await invoke('getStudentLessons')).lessons[0].teacher.name, 'Adviser');
 assert.deepEqual((await availableAssessments('student', ['subject'])).map(row => row.id), ['assessment']);
 assert.equal((await invoke('getMySubmissions')).submissions[0].percentage, 50);
 assert.equal((await invoke('getMyActivitySubmissions')).submissions.length, 1);
 const submissions = await studentSubmissions('student', true);
 assert.equal(submissions.length, 1);
 assert.equal(submissions[0].assessmentId.questions, undefined);
 assert.deepEqual((await studentAttendance('student')).map(row => row.id), ['attendance']);
});
