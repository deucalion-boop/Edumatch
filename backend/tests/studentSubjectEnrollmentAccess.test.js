const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const controller = require('../controllers/studentController');
const { teacherRequests, decideTeacherRequest } = require('../services/supabaseTeacherRecordsService');
const sectionId = '97d1d3a160134761872a768c581f5df7';
const grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', ''];

function fixture(gradeLevel = 'Grade 7') {
  client = createFakeSupabase({
    users: [
      { id: 'student', name: 'Student', email: 'student@gmail.com', role: 'student', grade_level: gradeLevel, section_id: sectionId },
      { id: 'other-student', name: 'Other student', role: 'student', grade_level: 'Grade 7' },
      { id: 'teacher', name: 'Teacher', email: 'teacher@gmail.com', role: 'teacher', advisory_section_id: sectionId },
      { id: 'other-teacher', name: 'Other teacher', role: 'teacher' },
    ],
    sections: [{ id: sectionId, name: 'Section A', is_active: true }],
    subjects: [
      { id: 'math', name: 'Mathematics', class_name: 'Section A Mathematics', code: 'MTH-ABCDE', teacher_id: 'teacher', is_active: true },
      { id: 'english', name: 'English', class_name: 'Section A English', code: 'ENG-AAAAA', teacher_id: 'teacher', is_active: true },
      { id: 'science', name: 'Science', class_name: 'Section A Science', code: 'SCI-BBBBB', teacher_id: 'teacher', is_active: true },
      { id: 'history', name: 'History', code: 'HIS-CCCCC', teacher_id: 'teacher', is_active: false },
    ],
    subject_enrollments: [
      { id: 'approved', student_id: 'student', subject_id: 'english', teacher_id: 'teacher', status: 'approved' },
      { id: 'pending', student_id: 'student', subject_id: 'science', teacher_id: 'teacher', status: 'pending' },
      { id: 'foreign', student_id: 'other-student', subject_id: 'math', teacher_id: 'teacher', status: 'approved' },
    ],
    lessons: [{ id: 'lesson', title: 'Reading', subject_id: 'english', created_by: 'teacher', attachments: [] }],
    assessments: [{ id: 'assessment', title: 'Reading quiz', subject_id: 'english', created_by: 'teacher', assessment_mode: 'quiz', questions: [] }],
    submissions: [], lesson_progress: [], assessment_weights: [], recommendations: [], subject_grade_records: [], notifications: [],
  });
  return { _id: 'student', name: 'Student', email: 'student@gmail.com', role: 'student', gradeLevel, sectionId };
}

async function invoke(name, user, body = {}, params = {}) {
  let response;
  let status;
  const res = { status(value) { status = value; return this; }, json(value) { response = value; } };
  await controller[name]({ user, body, params, protocol: 'http', get: () => 'localhost', query: {} }, res, error => { throw error; });
  return { status, response };
}

test('all student grades and unset grade levels can request enrollment with a teacher class code', async () => {
  for (const grade of grades) {
    const user = fixture(grade);
    const { status, response } = await invoke('joinSubjectByCode', user, { code: '  mth-abcde  ' });
    assert.equal(status, 201, grade);
    assert.equal(response.request.subject.enrollmentStatus, 'pending');
    const row = client.tables.subject_enrollments.find(value => value.student_id === 'student' && value.subject_id === 'math');
    assert.equal(row.teacher_id, 'teacher');
    assert.equal(row.section_id, sectionId);
    assert.equal(row.status, 'pending');
    assert.equal(row.decided_at, null);
    assert.ok(row.requested_at);
    assert.ok(client.tables.notifications.some(value => value.recipient_id === 'teacher' && value.type === 'enrollment_request'));
  }
});

test('non-Grade-10 class lists include own approved and pending enrollments without academic reads or writes', async () => {
  for (const grade of grades.filter(value => value !== 'Grade 10')) {
    const user = fixture(grade);
    client.failures.push(...['lessons', 'assessments', 'submissions', 'lesson_progress', 'assessment_weights'].map(table => ({ table, operation: 'select', error: { message: 'Academic reads are forbidden for this test' } })));
    const { status, response } = await invoke('getMySubjects', user);
    assert.equal(status, 200);
    assert.deepEqual(response.subjects.map(row => row.id), ['english']);
    assert.deepEqual(response.pendingSubjects.map(row => row.id), ['science']);
    assert.equal(response.subjects[0].enrollmentStatus, 'approved');
    assert.equal(response.pendingSubjects[0].enrollmentStatus, 'pending');
    assert.equal(response.subjects[0].teacher.id, 'teacher');
    assert.equal(response.studentContext.section.id, sectionId);
    assert.equal(response.studentContext.adviser.id, 'teacher');
    assert.deepEqual(response.insights, {});
    assert.equal(Object.hasOwn(response.subjects[0], 'lessonCount'), false);
    assert.equal(Object.hasOwn(response.subjects[0], 'assessmentCount'), false);
    assert.equal(Object.hasOwn(response.subjects[0], 'performance'), false);
    assert.equal(client.failures.length, 5, 'academic data was not queried');
    assert.deepEqual(client.writes, [], 'membership GET must not write grades or recommendations');
  }
});

test('Grade 10 class lists retain existing academic counts and progress', async () => {
  const user = fixture('Grade 10');
  const { response } = await invoke('getMySubjects', user);
  assert.equal(response.subjects[0].lessonCount, 1);
  assert.equal(response.subjects[0].assessmentCount, 1);
  assert.ok(response.insights.overallLearningProgress);
  assert.ok(client.writes.some(value => value.table === 'recommendations'));
});

test('blank, unknown and inactive class codes fail without saving enrollment', async () => {
  const user = fixture();
  for (const [code, statusCode] of [['', 400], ['NO-SUCH-CODE', 404], ['HIS-CCCCC', 404]]) {
    await assert.rejects(invoke('joinSubjectByCode', user, { code }), { statusCode });
  }
  assert.equal(client.tables.subject_enrollments.length, 3);
  assert.deepEqual(client.writes, []);
});

test('duplicate pending and approved enrollment requests remain unchanged', async () => {
  const user = fixture();
  await assert.rejects(invoke('joinSubjectByCode', user, { code: 'SCI-BBBBB' }), { statusCode: 409, message: 'Your enrollment request is already pending approval' });
  await assert.rejects(invoke('joinSubjectByCode', user, { code: 'ENG-AAAAA' }), { statusCode: 409, message: 'You are already enrolled in this class' });
  assert.deepEqual(client.writes, []);
});

test('teacher approval moves a lower-grade request from pending to approved and enforces teacher ownership', async () => {
  const user = fixture();
  const joined = await invoke('joinSubjectByCode', user, { code: 'MTH-ABCDE' });
  const requestId = joined.response.request.id;
  const before = (await invoke('getMySubjects', user)).response;
  assert.equal(before.subjects.some(value => value.id === 'math'), false);
  assert.equal(before.pendingSubjects.some(value => value.id === 'math'), true);
  assert.ok((await teacherRequests('teacher')).some(value => value.id === requestId));
  await assert.rejects(decideTeacherRequest('other-teacher', requestId, 'approved'), { statusCode: 404 });
  await decideTeacherRequest('teacher', requestId, 'approved');
  const after = (await invoke('getMySubjects', user)).response;
  assert.equal(after.subjects.find(value => value.id === 'math').enrollmentStatus, 'approved');
  assert.equal(after.pendingSubjects.some(value => value.id === 'math'), false);
  assert.equal(after.subjects.some(value => value.id === 'math' && value.enrollmentStatus === 'pending'), false);
  assert.equal(client.tables.subject_enrollments.find(value => value.id === 'foreign').student_id, 'other-student');
  assert.equal(client.writes.some(value => ['recommendations', 'subject_grade_records'].includes(value.table)), false);
});

test('lower-grade coursework and academic records remain forbidden after joining a class', async () => {
  const user = fixture();
  await invoke('joinSubjectByCode', user, { code: 'MTH-ABCDE' });
  for (const handler of ['getStudentLessons', 'getAvailableAssessments', 'getAssessmentForExam', 'getMySubmissions', 'getMyActivitySubmissions', 'updateStudentLessonProgress', 'submitAssessment']) {
    await assert.rejects(invoke(handler, user, {}, { id: 'assessment' }), { statusCode: 403, message: 'This feature is available for Grade 10 students only' });
  }
});
