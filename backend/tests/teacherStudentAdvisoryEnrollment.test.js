const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');

let client;
let emails;
let responses;
let emailResult;
storage.getSupabaseStorageClient = () => client;
require('../services/gmailService').sendEmailViaGmail = async (payload) => {
  emails.push({ payload, enrollments: structuredClone(client.tables.subject_enrollments) });
  return emailResult;
};

const { createStudentInvite, getTeacherStudents } = require('../controllers/teacherController');
const { findSupabaseAccount } = require('../services/supabaseAccountService');
const { subjectStudents } = require('../services/supabaseTeacherStudentsService');
const { saveApprovedEnrollment, listHydratedStudentEnrollments } = require('../services/supabaseEnrollmentService');

const teacherId = 'mapeh-adviser';
const sectionId = 'sincerity-section';

function advisoryClass(changes = {}) {
  return {
    id: 'sincerity-class',
    teacher_id: teacherId,
    name: 'MAPEH',
    class_name: 'MAPEH 10 - Sincerity',
    code: 'MAP-STABLE',
    track: 'GENERAL',
    subject_category: 'Technical',
    department: 'MAPEH',
    description: 'Keep the adviser description',
    is_active: true,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    advisory_section_id: sectionId,
    ...changes,
  };
}

function fixture({ teacher = {}, classes = [advisoryClass()], users = [], enrollments = [] } = {}) {
  emails = [];
  responses = [];
  emailResult = { sent: true };
  client = createFakeSupabase({
    users: [{
      id: teacherId,
      name: 'Maria Clara',
      email: 'maria.clara@gmail.com',
      username: 'maria.clara',
      role: 'teacher',
      status: 'active',
      subject: 'MAPEH',
      department: 'MAPEH',
      strand: '',
      advisory_section_id: sectionId,
      enrollment: {},
      archive: { isArchived: false },
      ...teacher,
    }, ...users],
    sections: [
      { id: sectionId, name: 'Sincerity', is_active: true },
      { id: 'inactive-section', name: 'Inactive', is_active: false },
    ],
    subjects: classes,
    subject_enrollments: enrollments,
    lessons: [],
    assessments: [],
    submissions: [],
    recommendations: [],
    attendance_records: [],
  });
}

async function invoke(handler, request = {}) {
  let statusCode;
  let response;
  const user = await findSupabaseAccount('id', teacherId);
  await handler({
    user,
    query: {},
    protocol: 'http',
    get: () => 'localhost:5173',
    ...request,
  }, {
    status(value) { statusCode = value; return this; },
    json(value) { response = value; responses.push(value); return this; },
  }, (error) => { throw error; });
  return { statusCode, response };
}

function createStudent(body = {}) {
  return invoke(createStudentInvite, {
    body: {
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@gmail.com',
      username: 'juan.delacruz',
      ...body,
    },
  });
}

test('a teacher-created account immediately joins the advisory class and both actual student rosters', async () => {
  fixture();
  const { statusCode, response } = await createStudent();
  assert.equal(statusCode, 201);
  const student = client.tables.users.find((row) => row.role === 'student');
  assert.equal(student.section_id, sectionId);
  assert.equal(student.managed_by, teacherId);
  assert.equal(student.grade_level, 'Grade 10');
  assert.equal(student.department, 'MAPEH');
  assert.equal(student.enrollment.teacherId, teacherId);
  assert.equal(student.enrollment.status, 'approved');
  assert.equal(client.tables.subject_enrollments.length, 1);
  const enrollment = client.tables.subject_enrollments[0];
  assert.equal(enrollment.student_id, student.id);
  assert.equal(enrollment.subject_id, 'sincerity-class');
  assert.equal(enrollment.teacher_id, teacherId);
  assert.equal(enrollment.section_id, sectionId);
  assert.equal(enrollment.section_name, 'Sincerity');
  assert.equal(enrollment.status, 'approved');
  assert.ok(Number.isFinite(Date.parse(enrollment.requested_at)));
  assert.ok(Number.isFinite(Date.parse(enrollment.decided_at)));
  assert.equal(response.advisoryClass.id, 'sincerity-class');
  assert.equal(response.enrollment.id, enrollment.id);
  assert.equal(response.enrollment.status, 'approved');
  assert.equal(emails.length, 1);
  assert.equal(emails[0].enrollments[0].id, enrollment.id);
  assert.equal(emails[0].enrollments[0].status, 'approved');

  const roster = await invoke(getTeacherStudents);
  assert.equal(roster.statusCode, 200);
  assert.equal(roster.response.students.length, 1);
  assert.equal(roster.response.students[0].id, student.id);
  assert.equal(roster.response.students[0].enrollmentStatus, 'approved');
  assert.equal(roster.response.students[0].sectionName, 'Sincerity');
  assert.equal(roster.response.students[0].subjects[0].id, 'sincerity-class');

  const filteredRoster = await invoke(getTeacherStudents, { query: { subjectId: 'sincerity-class' } });
  assert.deepEqual(filteredRoster.response.students.map((row) => row.id), [student.id]);
  const classRoster = await subjectStudents(teacherId, 'sincerity-class');
  assert.equal(classRoster.enrollments.length, 1);
  assert.equal(classRoster.enrollments[0].studentId._id, student.id);
  assert.equal(classRoster.enrollments[0].subjectId.className, 'MAPEH 10 - Sincerity');

  const studentClasses = await listHydratedStudentEnrollments(student.id, 'approved');
  assert.equal(studentClasses.length, 1);
  assert.equal(studentClasses[0].subjectId.id, 'sincerity-class');
  assert.equal(studentClasses[0].teacherId._id, teacherId);
});

test('student creation reuses the advisory class code and leaves other handled classes and memberships untouched', async () => {
  const advisory = advisoryClass();
  const handled = advisoryClass({ id: 'handled-class', class_name: 'MAPEH 10 - Unity', code: 'MAP-OTHER', advisory_section_id: null });
  const otherTeacherClass = advisoryClass({ id: 'other-teacher-class', teacher_id: 'other-teacher', code: 'MAP-OTHERT', advisory_section_id: null });
  const unrelatedEnrollment = {
    id: 'prior-enrollment', student_id: 'existing-student', subject_id: handled.id,
    teacher_id: teacherId, section_id: 'unity-section', section_name: 'Unity', status: 'approved',
  };
  fixture({ classes: [advisory, handled, otherTeacherClass], enrollments: [unrelatedEnrollment] });
  const { response } = await createStudent();
  assert.deepEqual(client.tables.subjects, [advisory, handled, otherTeacherClass]);
  assert.equal(response.advisoryClass.code, advisory.code);
  assert.deepEqual(client.tables.subject_enrollments.find((row) => row.id === unrelatedEnrollment.id), unrelatedEnrollment);
  const student = client.tables.users.find((row) => row.role === 'student');
  assert.deepEqual(client.tables.subject_enrollments.filter((row) => row.student_id === student.id)
    .map((row) => row.subject_id), [advisory.id]);
  assert.equal(client.writes.some((write) => write.table === 'subjects'), false);
});

test('student creation ensures a missing named advisory class before enrolling the new account', async () => {
  fixture({ classes: [] });
  const { response } = await createStudent();
  assert.equal(client.tables.subjects.length, 1);
  const subject = client.tables.subjects[0];
  assert.equal(subject.teacher_id, teacherId);
  assert.equal(subject.class_name, 'MAPEH 10 - Sincerity');
  assert.match(subject.code, /^MAP-[A-Z2-9]{5}$/);
  assert.equal(response.advisoryClass.id, subject.id);
  assert.equal(client.tables.subject_enrollments[0].subject_id, subject.id);
});

test('student creation ignores client-supplied teacher, section, and class assignments', async () => {
  fixture();
  await createStudent({ teacherId: 'another-teacher', sectionId: 'inactive-section', subjectId: 'another-class', advisorySectionId: 'inactive-section' });
  const student = client.tables.users.find((row) => row.role === 'student');
  const enrollment = client.tables.subject_enrollments[0];
  assert.equal(student.section_id, sectionId);
  assert.equal(student.managed_by, teacherId);
  assert.equal(enrollment.teacher_id, teacherId);
  assert.equal(enrollment.section_id, sectionId);
  assert.equal(enrollment.subject_id, 'sincerity-class');
});

test('an invalid or inactive assigned section rejects student creation before account, class, enrollment, or email writes', async () => {
  for (const advisorySectionId of ['missing-section', 'inactive-section']) {
    fixture({ teacher: { advisory_section_id: advisorySectionId }, classes: [] });
    await assert.rejects(createStudent(), { statusCode: 404, message: 'Section not found' });
    assert.deepEqual(client.writes, []);
    assert.deepEqual(emails, []);
    assert.deepEqual(responses, []);
  }
});

test('a teacher without an assigned school section cannot place a new account in an invented section', async () => {
  fixture({ teacher: { advisory_section_id: null }, classes: [] });
  await assert.rejects(createStudent(), {
    statusCode: 409,
    message: 'You must be assigned to an advisory section before creating student accounts',
  });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);
});

test('duplicate student email and case-insensitive username reject without altering existing users or classes', async () => {
  const priorStudent = {
    id: 'prior-student', name: 'Prior Student', email: 'juan.delacruz@gmail.com',
    username: 'prior.student', role: 'student', status: 'active', section_id: 'other-section',
  };
  fixture({ classes: [], users: [priorStudent] });
  await assert.rejects(createStudent(), { statusCode: 409, message: 'Email already exists' });
  assert.deepEqual(client.tables.users.find((row) => row.id === priorStudent.id), priorStudent);
  assert.deepEqual(client.writes, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);

  fixture({ classes: [], users: [{ ...priorStudent, email: 'prior.student@gmail.com', username: 'JUAN.DELACRUZ' }] });
  await assert.rejects(createStudent(), { statusCode: 409, message: 'Username already exists' });
  assert.equal(client.tables.users.length, 2);
  assert.deepEqual(client.writes, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);
});

test('an advisory class storage failure prevents student account creation and credential email delivery', async () => {
  fixture({ classes: [] });
  client.failures.push({ table: 'subjects', operation: 'insert', error: { message: 'Advisory class storage unavailable' } });
  await assert.rejects(createStudent(), { statusCode: 500, message: 'Advisory class storage unavailable' });
  assert.equal(client.tables.users.length, 1);
  assert.deepEqual(client.tables.subject_enrollments, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);
});

test('an invalid student email rejects before creating the advisory class or account', async () => {
  fixture({ classes: [] });
  await assert.rejects(createStudent({ email: 'juan.delacruz@example.com' }), { statusCode: 400 });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);
});

test('an enrollment storage failure rolls back only the new student and never sends its credentials', async () => {
  const priorStudent = {
    id: 'prior-student', name: 'Prior Student', email: 'prior.student@gmail.com',
    username: 'prior.student', role: 'student', status: 'active', section_id: sectionId,
  };
  fixture({ users: [priorStudent] });
  const originalUsers = structuredClone(client.tables.users);
  const originalClasses = structuredClone(client.tables.subjects);
  client.failures.push({ table: 'subject_enrollments', operation: 'upsert', error: { message: 'Enrollment storage unavailable' } });
  await assert.rejects(createStudent(), { statusCode: 500, message: 'Enrollment storage unavailable' });
  assert.deepEqual(client.tables.users, originalUsers);
  assert.deepEqual(client.tables.subjects, originalClasses);
  assert.deepEqual(client.tables.subject_enrollments, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);
  const accountInsertion = client.writes.find((write) => write.table === 'users' && write.operation === 'insert');
  const rollback = client.writes.find((write) => write.table === 'users' && write.operation === 'delete');
  assert.ok(accountInsertion);
  assert.deepEqual(rollback.ids, accountInsertion.ids);
});

test('a rollback failure reports the saved account explicitly and never sends its credentials', async () => {
  fixture();
  client.failures.push(
    { table: 'subject_enrollments', operation: 'upsert', error: { message: 'Enrollment storage unavailable' } },
    { table: 'users', operation: 'delete', error: { message: 'Account deletion unavailable' } },
  );
  await assert.rejects(createStudent(), {
    statusCode: 500,
    message: 'The student account was created, but advisory enrollment failed. Contact your administrator before trying again.',
  });
  assert.equal(client.tables.users.filter((row) => row.role === 'student').length, 1);
  assert.deepEqual(client.tables.subject_enrollments, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);
});

test('a failed email delivery leaves the successful student account enrolled in its advisory class', async () => {
  fixture();
  emailResult = { sent: false, reason: 'Mail provider unavailable' };
  const { statusCode, response } = await createStudent();
  assert.equal(statusCode, 201);
  assert.equal(response.invite.emailSent, false);
  assert.equal(response.invite.emailError, 'Mail provider unavailable');
  assert.equal(client.tables.users.filter((row) => row.role === 'student').length, 1);
  assert.equal(client.tables.subject_enrollments.length, 1);
  assert.equal(client.tables.subject_enrollments[0].status, 'approved');
  const classRoster = await subjectStudents(teacherId, 'sincerity-class');
  assert.equal(classRoster.enrollments.length, 1);
});

test('saving approved membership repeatedly updates one student/class pair instead of duplicating it', async () => {
  fixture();
  const request = { studentId: 'existing-student', subjectId: 'sincerity-class', teacherId, sectionId, sectionName: 'Sincerity' };
  const first = await saveApprovedEnrollment(request);
  const second = await saveApprovedEnrollment(request);
  assert.equal(second.id, first.id);
  assert.equal(client.tables.subject_enrollments.length, 1);
  assert.equal(second.status, 'approved');
  assert.equal(second.sectionId, sectionId);
  assert.equal(second.sectionName, 'Sincerity');
  assert.ok(Number.isFinite(Date.parse(second.decidedAt)));
  assert.deepEqual(emails, []);
});
