const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');

let client;
storage.getSupabaseStorageClient = () => client;
const { getTeacherSubjects, getTeacherStudents } = require('../controllers/teacherController');

const teacherId = 'mapeh-teacher';
const sectionId = 'sincerity-section';

function fixture({ teacher = {}, subjects = [], lessons = [], assessments = [], enrollments = [], attendance = [] } = {}) {
  const account = {
    id: teacherId,
    name: 'Maria Clara',
    email: 'maria.clara@gmail.com',
    username: 'maria.clara',
    role: 'teacher',
    status: 'active',
    subject: 'MAPEH',
    department: 'MAPEH',
    strand: '',
    grade_level: '',
    advisory_section_id: null,
    ...teacher,
  };
  client = createFakeSupabase({
    users: [account],
    sections: [
      { id: sectionId, name: 'Sincerity', is_active: true },
      { id: 'inactive-section', name: 'Inactive', is_active: false },
    ],
    subjects,
    lessons,
    assessments,
    subject_enrollments: enrollments,
    attendance_records: attendance,
  });
  return {
    _id: account.id,
    id: account.id,
    name: account.name,
    role: account.role,
    status: account.status,
    subject: account.subject,
    department: account.department,
    strand: account.strand,
    gradeLevel: account.grade_level,
    advisorySectionId: account.advisory_section_id,
  };
}

function existingClass(changes = {}) {
  return {
    id: 'existing-advisory-class',
    teacher_id: teacherId,
    name: 'MAPEH',
    class_name: 'MAPEH 10 - Advisory',
    track: 'GENERAL',
    subject_category: 'Technical',
    department: 'MAPEH',
    code: 'MAP-STABLE',
    description: 'Teacher-written advisory description',
    is_active: true,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    ...changes,
  };
}

async function invoke(handler, user) {
  let statusCode;
  let response;
  await handler({ user, query: {}, params: {} }, {
    status(value) { statusCode = value; return this; },
    json(value) { response = value; return this; },
  }, (error) => { throw error; });
  return { statusCode, response };
}

function loadClasses(user) {
  return invoke(getTeacherSubjects, user);
}

test('opening Class Management creates a persisted default advisory class and enrollment code', async () => {
  const user = fixture();
  const { statusCode, response } = await loadClasses(user);
  assert.equal(statusCode, 200);
  assert.equal(client.tables.subjects.length, 1);
  const created = client.tables.subjects[0];
  assert.equal(created.teacher_id, teacherId);
  assert.equal(created.name, 'MAPEH');
  assert.equal(created.class_name, 'MAPEH 10 - Advisory');
  assert.equal(created.track, 'GENERAL');
  assert.equal(created.is_active, true);
  assert.match(created.code, /^MAP-[A-Z2-9]{5}$/);
  assert.equal(response.subjects.length, 1);
  assert.equal(response.subjects[0].id, created.id);
  assert.equal(response.subjects[0].className, created.class_name);
  assert.equal(response.subjects[0].code, created.code);
  assert.equal(response.subjects[0].lessonCount, 0);
  assert.equal(response.subjects[0].assessmentCount, 0);
  assert.equal(response.subjects[0].approvedStudentsCount, 0);
  assert.equal(response.subjects[0].canDelete, true);
  assert.equal(client.tables.users[0].advisory_section_id, null);
  assert.equal(client.writes.some((write) => write.table === 'users' || write.table === 'sections'), false);
});

test('existing teachers with a section receive its named class without requiring a reassignment', async () => {
  const user = fixture({ teacher: { advisory_section_id: sectionId } });
  const { response } = await loadClasses(user);
  assert.equal(response.subjects.length, 1);
  assert.equal(response.subjects[0].className, 'MAPEH 10 - Sincerity');
  assert.equal(client.tables.subjects[0].class_name, 'MAPEH 10 - Sincerity');
  assert.equal(client.tables.users[0].advisory_section_id, sectionId);
  assert.equal(client.writes.some((write) => write.table === 'users'), false);
});

test('repeat class loads retain the default advisory ID, code and teacher-written details', async () => {
  const saved = existingClass();
  const user = fixture({ subjects: [saved] });
  const first = await loadClasses(user);
  const second = await loadClasses(user);
  assert.equal(first.response.subjects[0].id, saved.id);
  assert.equal(second.response.subjects[0].code, saved.code);
  assert.equal(second.response.subjects[0].description, saved.description);
  assert.deepEqual(client.tables.subjects, [saved]);
  assert.deepEqual(client.writes, []);
});

test('an inactive default advisory class is restored with its existing ID, code and description', async () => {
  const saved = existingClass({ is_active: false });
  const user = fixture({ subjects: [saved] });
  const { response } = await loadClasses(user);
  assert.equal(client.tables.subjects.length, 1);
  assert.equal(client.tables.subjects[0].is_active, true);
  assert.equal(response.subjects[0].id, saved.id);
  assert.equal(response.subjects[0].code, saved.code);
  assert.equal(response.subjects[0].description, saved.description);
});

test('existing handled classes and their records remain intact without an extra default class', async () => {
  const handled = existingClass({ id: 'handled-class', class_name: 'MAPEH 10 - Unity', code: 'MAP-UNITY' });
  const user = fixture({
    subjects: [handled],
    lessons: [{ id: 'lesson', created_by: teacherId, subject_id: handled.id }],
    assessments: [{ id: 'assessment', created_by: teacherId, subject_id: handled.id }],
    enrollments: [{ id: 'enrollment', teacher_id: teacherId, subject_id: handled.id, student_id: 'student', status: 'approved' }],
    attendance: [{ id: 'attendance', teacher_id: teacherId, subject_id: handled.id, attendance_scope: 'handled_class' }],
  });
  const initialRecords = structuredClone({
    lessons: client.tables.lessons,
    assessments: client.tables.assessments,
    enrollments: client.tables.subject_enrollments,
    attendance: client.tables.attendance_records,
  });
  const { response } = await loadClasses(user);
  assert.equal(client.tables.subjects.length, 1);
  assert.deepEqual(client.tables.subjects.find((subject) => subject.id === handled.id), handled);
  assert.equal(response.subjects.some((subject) => subject.className === 'MAPEH 10 - Advisory'), false);
  const handledResponse = response.subjects.find((subject) => subject.id === handled.id);
  assert.equal(handledResponse.lessonCount, 1);
  assert.equal(handledResponse.assessmentCount, 1);
  assert.equal(handledResponse.approvedStudentsCount, 1);
  assert.equal(handledResponse.attendanceRecordCount, 1);
  assert.equal(handledResponse.canDelete, false);
  assert.deepEqual({
    lessons: client.tables.lessons,
    assessments: client.tables.assessments,
    enrollments: client.tables.subject_enrollments,
    attendance: client.tables.attendance_records,
  }, initialRecords);
  assert.deepEqual(client.writes, []);
});

for (const advisorySectionId of [null, sectionId]) {
  test(`a renamed advisory class is retained without creating another class (section: ${advisorySectionId})`, async () => {
    const saved = existingClass({ class_name: 'Maria Clara Advisory Class' });
    const user = fixture({ teacher: { advisory_section_id: advisorySectionId }, subjects: [saved] });
    const { response } = await loadClasses(user);
    assert.equal(response.subjects.length, 1);
    assert.equal(response.subjects[0].className, saved.class_name);
    assert.equal(response.subjects[0].code, saved.code);
    assert.deepEqual(client.tables.subjects, [saved]);
    assert.deepEqual(client.writes, []);
  });
}

test('the default class uses the teacher department when the legacy profile has no subject', async () => {
  const user = fixture({ teacher: { subject: '' } });
  const { response } = await loadClasses(user);
  assert.equal(response.subjects[0].name, 'MAPEH');
  assert.equal(response.subjects[0].className, 'MAPEH 10 - Advisory');
});

test('a teacher without an assigned subject or department receives an actionable error without writes', async () => {
  const user = fixture({ teacher: { subject: '', department: '' } });
  await assert.rejects(loadClasses(user), { statusCode: 400 });
  assert.deepEqual(client.tables.subjects, []);
  assert.deepEqual(client.writes, []);
  assert.equal(client.tables.users[0].advisory_section_id, null);
});

test('the default advisory class belongs only to the requesting teacher', async () => {
  const foreign = existingClass({ id: 'other-advisory', teacher_id: 'other-teacher', code: 'MAP-OTHER' });
  const user = fixture({ subjects: [foreign] });
  const { response } = await loadClasses(user);
  assert.equal(client.tables.subjects.length, 2);
  assert.deepEqual(client.tables.subjects.find((subject) => subject.id === foreign.id), foreign);
  assert.equal(response.subjects.length, 1);
  assert.equal(response.subjects[0].teacherId, teacherId);
  assert.notEqual(response.subjects[0].id, foreign.id);
});

test('a literal custom subject does not reuse a similar wildcard-matching advisory class', async () => {
  const similar = existingClass({ id: 'similar-subject', name: 'MAPEH', class_name: 'MAPEH 10 - Advisory', is_active: false });
  const user = fixture({ teacher: { subject: 'M%PEH' }, subjects: [similar] });
  const { response } = await loadClasses(user);
  assert.equal(client.tables.subjects.length, 2);
  assert.deepEqual(client.tables.subjects.find((subject) => subject.id === similar.id), similar);
  const created = response.subjects.find((subject) => subject.name === 'M%PEH');
  assert.equal(created.className, 'M%PEH 10 - Advisory');
  assert.notEqual(created.id, similar.id);
});

for (const invalidSectionId of ['missing-section', 'inactive-section']) {
  test(`invalid advisory assignment ${invalidSectionId} does not silently create a fallback class`, async () => {
    const user = fixture({ teacher: { advisory_section_id: invalidSectionId } });
    await assert.rejects(loadClasses(user), { statusCode: 404 });
    assert.deepEqual(client.tables.subjects, []);
    assert.deepEqual(client.writes, []);
    assert.equal(client.tables.users[0].advisory_section_id, invalidSectionId);
  });
}

test('class provisioning failures are surfaced instead of returning a successful empty class list', async () => {
  const user = fixture();
  client.failures.push({ table: 'subjects', operation: 'insert', error: { message: 'Class storage unavailable' } });
  await assert.rejects(loadClasses(user), { statusCode: 500, message: 'Class storage unavailable' });
  assert.deepEqual(client.tables.subjects, []);
  assert.equal(client.tables.users[0].advisory_section_id, null);
});

test('concurrent creation uses the class committed by the other request after a uniqueness conflict', async () => {
  const user = fixture();
  client.failures.push({ table: 'subjects', operation: 'insert', error: { code: '23505', message: 'duplicate class' } });
  const originalFrom = client.from;
  let committed = false;
  client.from = (table) => {
    const query = originalFrom(table);
    if (table === 'subjects') {
      const insert = query.insert;
      query.insert = (values) => {
        if (!committed) {
          committed = true;
          client.tables.subjects.push({
            ...structuredClone(values),
            id: 'concurrently-created-advisory',
            code: 'MAP-WINNER',
            created_at: '2026-10-11T00:00:00.000Z',
          });
        }
        return insert(values);
      };
    }
    return query;
  };
  const { statusCode, response } = await loadClasses(user);
  assert.equal(statusCode, 200);
  assert.equal(client.tables.subjects.length, 1);
  assert.equal(response.subjects[0].id, 'concurrently-created-advisory');
  assert.equal(response.subjects[0].code, 'MAP-WINNER');
});

test('loading the roster alone does not provision classes or change advisory assignments', async () => {
  const user = fixture();
  const { statusCode, response } = await invoke(getTeacherStudents, user);
  assert.equal(statusCode, 200);
  assert.deepEqual(response.students, []);
  assert.deepEqual(client.tables.subjects, []);
  assert.deepEqual(client.writes, []);
});
