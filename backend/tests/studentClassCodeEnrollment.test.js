const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');

let client;
storage.getSupabaseStorageClient = () => client;
const { joinSubjectByCode, getStudentProfile } = require('../controllers/studentController');
const { findSupabaseAccount } = require('../services/supabaseAccountService');
const { listHydratedStudentEnrollments } = require('../services/supabaseEnrollmentService');
const { teacherRequests, decideTeacherRequest } = require('../services/supabaseTeacherRecordsService');

const studentId = 'charity-student';
const adviserId = 'charity-adviser';
const handledTeacherId = 'science-teacher';
const homeSectionId = 'charity';
const targetClassId = 'science-hope';

function fixture() {
  client = createFakeSupabase({
    users: [
      {
        id: studentId, name: 'Sarah Reyes', username: 'sarah.reyes', email: 'sarah.reyes@gmail.com',
        role: 'student', status: 'active', grade_level: 'Grade 10', section_id: homeSectionId,
        managed_by: adviserId, department: 'Mathematics', archive: { isArchived: false },
        enrollment: { teacherId: adviserId, status: 'approved', approvedAt: '2026-10-01T00:00:00.000Z' },
      },
      { id: adviserId, name: 'Charity Adviser', role: 'teacher', status: 'active', subject: 'Mathematics', department: 'Mathematics', advisory_section_id: homeSectionId },
      { id: handledTeacherId, name: 'Science Teacher', role: 'teacher', status: 'active', subject: 'Science', department: 'Science', advisory_section_id: 'joy' },
    ],
    sections: [
      { id: homeSectionId, name: 'Charity', is_active: true },
      { id: 'hope', name: 'Hope', is_active: true },
      { id: 'joy', name: 'Joy', is_active: true },
    ],
    subjects: [
      { id: 'charity-advisory', teacher_id: adviserId, name: 'Mathematics', class_name: 'Mathematics 10 - Charity', advisory_section_id: homeSectionId, code: 'MAT-CHARITY', track: 'GENERAL', is_active: true },
      { id: targetClassId, teacher_id: handledTeacherId, name: 'Science', class_name: 'Science 10 - Hope', advisory_section_id: null, code: 'SCI-HOPE', track: 'GENERAL', is_active: true },
      { id: 'science-joy', teacher_id: handledTeacherId, name: 'Science', class_name: 'Science 10 - Joy', advisory_section_id: 'joy', code: 'SCI-JOY', track: 'GENERAL', is_active: true },
      { id: 'inactive-class', teacher_id: handledTeacherId, name: 'Science', class_name: 'Inactive class', code: 'SCI-INACTIVE', track: 'GENERAL', is_active: false },
    ],
    subject_enrollments: [{
      id: 'home-advisory-enrollment', student_id: studentId, subject_id: 'charity-advisory', teacher_id: adviserId,
      section_id: homeSectionId, section_name: 'Charity', status: 'approved',
      requested_at: '2026-10-01T00:00:00.000Z', decided_at: '2026-10-01T00:00:00.000Z',
    }],
    notifications: [],
  });
}

async function invoke(handler, body = {}) {
  const user = await findSupabaseAccount('id', studentId);
  let statusCode;
  let response;
  await handler({ user, body, query: {}, protocol: 'http', get: () => 'localhost:5173' }, {
    status(value) { statusCode = value; return this; },
    json(value) { response = value; return this; },
  }, error => { throw error; });
  return { statusCode, response };
}

test('a Charity student can join another teacher’s handled Hope class while retaining their home section and adviser', async () => {
  fixture();
  const accountsBefore = structuredClone(client.tables.users);
  const homeEnrollmentBefore = structuredClone(client.tables.subject_enrollments[0]);
  const { statusCode, response } = await invoke(joinSubjectByCode, {
    code: '  sci-hope  ', sectionId: 'hope', teacherId: adviserId, studentId: 'someone-else',
  });
  assert.equal(statusCode, 201);
  assert.equal(response.request.subject.id, targetClassId);
  assert.equal(response.request.subject.enrollmentStatus, 'pending');
  const pending = client.tables.subject_enrollments.find(row => row.subject_id === targetClassId);
  assert.equal(pending.student_id, studentId);
  assert.equal(pending.teacher_id, handledTeacherId);
  assert.equal(pending.section_id, homeSectionId);
  assert.equal(pending.section_name, 'Charity');
  assert.equal(pending.status, 'pending');
  assert.equal(pending.decided_at, null);
  assert.deepEqual(client.tables.users, accountsBefore);
  assert.deepEqual(client.tables.subject_enrollments.find(row => row.id === homeEnrollmentBefore.id), homeEnrollmentBefore);
  assert.equal((await teacherRequests(adviserId)).length, 0);
  const requests = await teacherRequests(handledTeacherId);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].sectionId.name, 'Charity');
  assert.equal(client.tables.notifications.length, 1);
  assert.equal(client.tables.notifications[0].recipient_id, handledTeacherId);
  const profileBeforeApproval = (await invoke(getStudentProfile)).response.user;
  assert.equal(profileBeforeApproval.section.id, homeSectionId);
  assert.equal(profileBeforeApproval.adviser.id, adviserId);

  await assert.rejects(decideTeacherRequest(adviserId, pending.id, 'approved'), { statusCode: 404 });
  assert.equal(pending.status, 'pending');
  const approved = await decideTeacherRequest(handledTeacherId, pending.id, 'approved');
  assert.equal(approved.status, 'approved');
  assert.equal(pending.status, 'approved');
  assert.equal(pending.section_id, homeSectionId);
  assert.equal(pending.section_name, 'Charity');
  assert.deepEqual(client.tables.users, accountsBefore);
  assert.deepEqual(client.tables.subject_enrollments.find(row => row.id === homeEnrollmentBefore.id), homeEnrollmentBefore);
  const profileAfterApproval = (await invoke(getStudentProfile)).response.user;
  assert.equal(profileAfterApproval.section.id, homeSectionId);
  assert.equal(profileAfterApproval.adviser.id, adviserId);
  const classes = await listHydratedStudentEnrollments(studentId, 'approved');
  assert.deepEqual(classes.map(row => row.subjectId.id).sort(), ['charity-advisory', targetClassId].sort());
  assert.equal(client.writes.some(write => write.table === 'users' || write.table === 'subjects' || write.table === 'sections'), false);
});

test('repeating a pending or approved class-code join keeps one membership and returns the existing duplicate message', async () => {
  fixture();
  await invoke(joinSubjectByCode, { code: 'SCI-HOPE' });
  let writesBefore = client.writes.length;
  await assert.rejects(invoke(joinSubjectByCode, { subjectCode: 'sci-hope' }), {
    statusCode: 409, message: 'Your enrollment request is already pending approval',
  });
  assert.equal(client.writes.length, writesBefore);
  assert.equal(client.tables.subject_enrollments.filter(row => row.subject_id === targetClassId && row.student_id === studentId).length, 1);
  const pending = client.tables.subject_enrollments.find(row => row.subject_id === targetClassId);
  await decideTeacherRequest(handledTeacherId, pending.id, 'approved');
  writesBefore = client.writes.length;
  await assert.rejects(invoke(joinSubjectByCode, { code: 'SCI-HOPE' }), {
    statusCode: 409, message: 'You are already enrolled in this class',
  });
  assert.equal(client.writes.length, writesBefore);
  assert.equal(client.tables.subject_enrollments.length, 2);
  assert.equal(client.tables.notifications.length, 1);
});

for (const code of ['UNKNOWN-CODE', 'SCI-INACTIVE', '']) {
  test(`${code || 'a missing code'} cannot create a membership or change the authenticated student’s account`, async () => {
    fixture();
    const accountsBefore = structuredClone(client.tables.users);
    const enrollmentsBefore = structuredClone(client.tables.subject_enrollments);
    await assert.rejects(invoke(joinSubjectByCode, { code }), {
      statusCode: code ? 404 : 400,
      message: code ? 'Subject code is invalid' : 'Subject code is required',
    });
    assert.deepEqual(client.tables.users, accountsBefore);
    assert.deepEqual(client.tables.subject_enrollments, enrollmentsBefore);
    assert.deepEqual(client.writes, []);
    assert.deepEqual(client.tables.notifications, []);
  });
}
