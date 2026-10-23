const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');

let client;
let emails;
let responses;
storage.getSupabaseStorageClient = () => client;
require('../services/gmailService').sendEmailViaGmail = async (payload) => {
  emails.push(payload);
  return { sent: true };
};

const {
  createTeacherAccount,
  updateManagedTeacher,
  assignManagedTeacherHandledClass,
  removeManagedTeacherHandledClass,
} = require('../controllers/headteacherController');
const { listTeacherSubjects } = require('../services/subjectService');
const { getAssignableSectionOrThrow, listSectionsWithAdvisers } = require('../services/sectionService');

const headteacherId = 'mapeh-headteacher';
const teacherId = 'mapeh-teacher';
const sincerityId = 'sincerity-section';
const unityId = 'unity-section';

function fixture({ teacher = {}, create = false, subjects = [], students = [], otherUsers = [] } = {}) {
  emails = [];
  responses = [];
  client = createFakeSupabase({
    users: [
      ...(!create ? [{
        id: teacherId,
        name: 'Maria Clara',
        email: 'maria.clara@gmail.com',
        username: 'maria.clara',
        role: 'teacher',
        status: 'active',
        department: 'MAPEH',
        subject: 'MAPEH',
        strand: '',
        grade_level: '',
        managed_by: headteacherId,
        advisory_section_id: null,
        ...teacher,
      }] : []),
      ...otherUsers,
      ...students,
    ],
    sections: [
      { id: sincerityId, name: 'Sincerity', is_active: true },
      { id: unityId, name: 'Unity', is_active: true },
      { id: 'inactive-section', name: 'Inactive', is_active: false },
    ],
    subjects,
    lessons: [],
    assessments: [],
    subject_enrollments: [],
    attendance_records: [],
  });
}

function existingClass(changes = {}) {
  return {
    id: 'existing-sincerity-class',
    teacher_id: teacherId,
    name: 'MAPEH',
    class_name: 'MAPEH 10 - Sincerity',
    track: 'GENERAL',
    department: 'MAPEH',
    subject_category: 'Technical',
    code: 'MAP-STABLE',
    description: 'Teacher-written class description',
    is_active: true,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    ...changes,
  };
}

function sectionOwner(changes = {}) {
  return {
    id: 'science-teacher',
    name: 'Jose Rizal',
    email: 'jose.rizal@gmail.com',
    username: 'jose.rizal',
    role: 'teacher',
    status: 'active',
    department: 'Science',
    subject: 'SCIENCE',
    managed_by: 'science-headteacher',
    advisory_section_id: sincerityId,
    ...changes,
  };
}

function advisoryStudent() {
  return {
    id: 'sincerity-student',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@gmail.com',
    username: 'juan.delacruz',
    role: 'student',
    status: 'active',
    section_id: sincerityId,
    managed_by: 'science-teacher',
    department: 'Science',
    enrollment: { teacherId: 'science-teacher', status: 'approved' },
  };
}

function assertRejectedAssignmentUnchanged(snapshot) {
  assert.deepEqual(client.tables, snapshot);
  assert.deepEqual(client.writes, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);
}

function capUserReadResults(maxRows, ranges = []) {
  const originalFrom = client.from;
  client.from = (table) => {
    const query = originalFrom(table);
    if (table !== 'users') return query;
    const originalRange = query.range;
    query.range = (first, last) => {
      ranges.push([first, last]);
      return originalRange(first, last);
    };
    const originalThen = query.then;
    query.then = (resolve, reject) => originalThen((result) => resolve({
      ...result,
      data: Array.isArray(result.data) ? result.data.slice(0, maxRows) : result.data,
    }), reject);
    return query;
  };
}

async function invoke(handler, req = {}) {
  let statusCode;
  let response;
  await handler({
    user: { _id: headteacherId, role: 'headteacher', department: 'MAPEH' },
    protocol: 'http',
    get: () => 'localhost:5173',
    ...req,
  }, {
    status(value) { statusCode = value; return this; },
    json(value) { response = value; responses.push(value); return this; },
  }, (error) => { throw error; });
  return { statusCode, response };
}

function assign(body = {}, id = teacherId) {
  return invoke(updateManagedTeacher, {
    params: { id },
    body: { advisorySectionId: sincerityId, ...body },
  });
}

function create(body = {}) {
  return invoke(createTeacherAccount, {
    body: {
      name: 'Maria Clara',
      email: 'maria.clara@gmail.com',
      username: 'maria.clara',
      subject: 'MAPEH',
      advisorySectionId: sincerityId,
      ...body,
    },
  });
}

test('handled class assignments are independent from the single advisory section', async () => {
  fixture({ teacher: { advisory_section_id: sincerityId } });
  const first = await invoke(assignManagedTeacherHandledClass, {
    params: { id: teacherId }, body: { sectionIds: [sincerityId, unityId], subject: 'MAPEH' },
  });
  const third = await invoke(assignManagedTeacherHandledClass, {
    params: { id: teacherId }, body: { sectionId: unityId, subject: 'Music' },
  });

  assert.equal(first.statusCode, 201);
  assert.equal(first.response.handledClasses.length, 2);
  assert.equal(third.statusCode, 201);
  assert.equal(client.tables.users[0].advisory_section_id, sincerityId);
  assert.equal(client.tables.subjects.length, 3);
  assert.deepEqual(client.tables.subjects.map((row) => row.handled_section_id).sort(), [sincerityId, unityId, unityId].sort());
  assert.deepEqual(client.tables.subjects.map((row) => row.name).sort(), ['MAPEH', 'MAPEH', 'Music'].sort());
  assert.ok(client.tables.subjects.every((row) => row.assignment_source === 'headteacher'));
});

test('removing a handled class preserves advisory ownership and its academic record', async () => {
  fixture({ teacher: { advisory_section_id: sincerityId } });
  const assigned = await invoke(assignManagedTeacherHandledClass, {
    params: { id: teacherId }, body: { sectionId: unityId, subject: 'MAPEH' },
  });
  const subjectId = assigned.response.handledClass.id;
  const removed = await invoke(removeManagedTeacherHandledClass, {
    params: { id: teacherId, subjectId },
  });

  assert.equal(removed.statusCode, 200);
  assert.equal(client.tables.users[0].advisory_section_id, sincerityId);
  assert.equal(client.tables.subjects[0].is_active, false);
  assert.equal(client.tables.subjects[0].handled_section_id, unityId);
});

test('assigning a managed teacher a section automatically creates the named Grade 10 class and code', async () => {
  fixture();
  const { statusCode, response } = await assign();
  assert.equal(statusCode, 200);
  assert.equal(client.tables.users[0].advisory_section_id, sincerityId);
  assert.equal(client.tables.subjects.length, 1);
  const subject = client.tables.subjects[0];
  assert.equal(subject.teacher_id, teacherId);
  assert.equal(subject.name, 'MAPEH');
  assert.equal(subject.class_name, 'MAPEH 10 - Sincerity');
  assert.equal(subject.track, 'GENERAL');
  assert.equal(subject.department, 'MAPEH');
  assert.match(subject.code, /^MAP-[A-Z2-9]{5}$/);
  assert.equal(response.advisoryClass.id, subject.id);
  assert.equal(response.advisoryClass.className, subject.class_name);
  assert.equal(response.advisoryClass.code, subject.code);
  const visibleClasses = await listTeacherSubjects(teacherId);
  assert.deepEqual(visibleClasses.map(({ id, className, code }) => ({ id, className, code })), [{
    id: subject.id, className: 'MAPEH 10 - Sincerity', code: subject.code,
  }]);
  const createdClass = structuredClone(subject);
  const repeatedAssignment = await assign();
  assert.deepEqual(client.tables.subjects, [createdClass]);
  assert.equal(repeatedAssignment.response.advisoryClass.id, createdClass.id);
  assert.equal(repeatedAssignment.response.advisoryClass.code, createdClass.code);
  assert.deepEqual(emails, []);
});

for (const [subject, similarSubject] of [
  ['M_PEH', 'MAPEH'],
  ['M%PEH', 'MAPEH'],
  ['M*PEH', 'MAPEH'],
  ['M\\PEH', 'MPEH'],
  ['M\\_%*PEH', 'M_PEH'],
]) {
  test(`automatic classes treat ${JSON.stringify(subject)} as a literal assigned subject and preserve similar classes`, async () => {
    const otherClass = existingClass({
      name: similarSubject,
      class_name: `${similarSubject} 10 - Sincerity`,
    });
    fixture({ teacher: { subject }, subjects: [otherClass] });
    const { response } = await assign();
    assert.equal(client.tables.subjects.length, 2);
    assert.deepEqual(client.tables.subjects.find((row) => row.id === otherClass.id), otherClass);
    const newClass = client.tables.subjects.find((row) => row.id !== otherClass.id);
    assert.equal(newClass.name, subject);
    assert.equal(newClass.class_name, `${subject} 10 - Sincerity`);
    assert.notEqual(newClass.code, otherClass.code);
    assert.equal(response.advisoryClass.id, newClass.id);
    assert.equal(response.advisoryClass.className, newClass.class_name);

    const newClassSnapshot = structuredClone(newClass);
    const repeatedAssignment = await assign();
    assert.equal(client.tables.subjects.length, 2);
    assert.deepEqual(client.tables.subjects.find((row) => row.id === newClass.id), newClassSnapshot);
    assert.deepEqual(client.tables.subjects.find((row) => row.id === otherClass.id), otherClass);
    assert.equal(repeatedAssignment.response.advisoryClass.id, newClass.id);
    assert.equal(repeatedAssignment.response.advisoryClass.code, newClass.code);
  });
}

test('creating a teacher with a section creates its class and synchronizes existing advisory students', async () => {
  fixture({ create: true, students: [{
    id: 'sincerity-student',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@gmail.com',
    username: 'juan.delacruz',
    role: 'student',
    status: 'active',
    grade_level: 'Grade 10',
    section_id: sincerityId,
    enrollment: {},
  }] });
  const { statusCode, response } = await create();
  assert.equal(statusCode, 201);
  const teacher = client.tables.users.find((row) => row.role === 'teacher');
  const student = client.tables.users.find((row) => row.role === 'student');
  assert.equal(teacher.advisory_section_id, sincerityId);
  assert.equal(student.managed_by, teacher.id);
  assert.equal(student.enrollment.teacherId, teacher.id);
  assert.equal(student.enrollment.status, 'approved');
  assert.equal(client.tables.subjects[0].teacher_id, teacher.id);
  assert.equal(client.tables.subjects[0].class_name, 'MAPEH 10 - Sincerity');
  assert.equal(response.advisoryClass.id, client.tables.subjects[0].id);
  assert.equal(emails.length, 1);
});

test('repeat section assignment reuses the class ID and code without changing manual class details', async () => {
  const subject = existingClass();
  fixture({ teacher: { advisory_section_id: sincerityId }, subjects: [subject] });
  const { response: firstAssignment } = await assign();
  // The first assignment stamps the advisory marker so the class stays stable.
  assert.equal(firstAssignment.advisoryClass.id, subject.id);
  assert.equal(client.tables.subjects[0].advisory_section_id, sincerityId);
  const stamped = structuredClone(client.tables.subjects);
  const writesAfterStamping = client.writes.length;
  const { response } = await assign();
  assert.deepEqual(client.tables.subjects, stamped);
  assert.equal(response.advisoryClass.id, subject.id);
  assert.equal(response.advisoryClass.code, subject.code);
  assert.equal(client.writes.slice(writesAfterStamping).some((write) => write.table === 'subjects'), false);
});

test('assigning a section reactivates its existing class while preserving its code and teacher description', async () => {
  const subject = existingClass({ is_active: false });
  fixture({ subjects: [subject] });
  const { response } = await assign();
  assert.equal(client.tables.subjects.length, 1);
  assert.equal(client.tables.subjects[0].is_active, true);
  assert.equal(client.tables.subjects[0].id, subject.id);
  assert.equal(client.tables.subjects[0].code, subject.code);
  assert.equal(client.tables.subjects[0].description, subject.description);
  assert.equal(client.tables.subjects[0].subject_category, subject.subject_category);
  assert.equal(client.tables.subjects[0].department, subject.department);
  assert.equal(client.tables.subjects[0].created_at, subject.created_at);
  assert.equal(response.advisoryClass.id, subject.id);
});

test('ordinary teacher updates create a missing class for an existing section assignment', async () => {
  fixture({ teacher: { advisory_section_id: sincerityId } });
  const { response } = await invoke(updateManagedTeacher, {
    params: { id: teacherId }, body: { name: 'Maria Santos' },
  });
  assert.equal(client.tables.subjects[0].class_name, 'MAPEH 10 - Sincerity');
  assert.equal(response.advisoryClass.id, client.tables.subjects[0].id);
});

test('clearing the advisory section retains the existing class and its linked records', async () => {
  const subject = existingClass();
  fixture({ teacher: { advisory_section_id: sincerityId }, subjects: [subject] });
  client.tables.lessons.push({ id: 'retained-lesson', subject_id: subject.id, created_by: teacherId });
  const { response } = await assign({ advisorySectionId: '' });
  assert.equal(client.tables.users[0].advisory_section_id, null);
  assert.equal(response.advisoryClass, null);
  assert.deepEqual(client.tables.subjects, [subject]);
  assert.equal(client.tables.lessons[0].subject_id, subject.id);
  assert.equal(client.writes.some((write) => write.table === 'subjects'), false);
});

test('reassigning a section creates the new class and preserves the prior class and academic records', async () => {
  const subject = existingClass();
  fixture({ teacher: { advisory_section_id: sincerityId }, subjects: [subject] });
  client.tables.lessons.push({ id: 'lesson', subject_id: subject.id, created_by: teacherId });
  client.tables.assessments.push({ id: 'assessment', subject_id: subject.id, created_by: teacherId });
  client.tables.subject_enrollments.push({ id: 'enrollment', subject_id: subject.id, teacher_id: teacherId, student_id: 'student', status: 'approved' });
  client.tables.attendance_records.push({ id: 'attendance', subject_id: subject.id, teacher_id: teacherId });
  const previousRecords = structuredClone({
    lessons: client.tables.lessons,
    assessments: client.tables.assessments,
    enrollments: client.tables.subject_enrollments,
    attendance: client.tables.attendance_records,
  });
  const { response } = await assign({ advisorySectionId: unityId });
  assert.equal(client.tables.subjects.length, 2);
  assert.deepEqual(client.tables.subjects.find((row) => row.id === subject.id), subject);
  assert.equal(response.advisoryClass.className, 'MAPEH 10 - Unity');
  assert.notEqual(response.advisoryClass.id, subject.id);
  assert.deepEqual({
    lessons: client.tables.lessons,
    assessments: client.tables.assessments,
    enrollments: client.tables.subject_enrollments,
    attendance: client.tables.attendance_records,
  }, previousRecords);
});

test('invalid and inactive sections reject teacher creation and assignment before any account or class write', async () => {
  for (const advisorySectionId of ['missing-section', 'inactive-section']) {
    fixture({ create: true });
    await assert.rejects(create({ advisorySectionId }), { statusCode: 404, message: 'Section not found' });
    assert.deepEqual(client.writes, []);
    assert.deepEqual(emails, []);
    assert.deepEqual(responses, []);

    fixture();
    await assert.rejects(assign({ advisorySectionId }), { statusCode: 404, message: 'Section not found' });
    assert.deepEqual(client.writes, []);
    assert.deepEqual(responses, []);
  }
});

test('headteachers cannot create automatic classes for unmanaged or other-department teachers', async () => {
  for (const teacher of [{ managed_by: 'another-headteacher' }, { department: 'Science' }]) {
    fixture({ teacher });
    await assert.rejects(assign(), { statusCode: 404, message: 'Teacher not found' });
    assert.deepEqual(client.writes, []);
    assert.deepEqual(responses, []);
  }
});

test('teachers without a separate subject use their department for the automatic class', async () => {
  fixture({ teacher: { subject: '' } });
  const { response } = await assign();
  assert.equal(response.advisoryClass.name, 'MAPEH');
  assert.equal(response.advisoryClass.className, 'MAPEH 10 - Sincerity');
});

test('teachers created without a section do not receive an automatic class', async () => {
  fixture({ create: true });
  const { statusCode, response } = await create({ advisorySectionId: '' });
  assert.equal(statusCode, 201);
  assert.equal(response.advisoryClass, null);
  assert.deepEqual(client.tables.subjects, []);
  assert.equal(emails.length, 1);
});

test('automatic class creation failures are surfaced before any successful assignment response', async () => {
  fixture();
  client.failures.push({ table: 'subjects', operation: 'insert', error: { message: 'Class storage unavailable' } });
  await assert.rejects(assign(), { statusCode: 500, message: 'Class storage unavailable' });
  assert.deepEqual(client.tables.subjects, []);
  assert.deepEqual(responses, []);
});

test('teacher creation does not send an invitation or report success when its automatic class cannot be saved', async () => {
  fixture({ create: true });
  client.failures.push({ table: 'subjects', operation: 'insert', error: { message: 'Class storage unavailable' } });
  await assert.rejects(create(), { statusCode: 500, message: 'Class storage unavailable' });
  assert.deepEqual(client.tables.subjects, []);
  assert.deepEqual(emails, []);
  assert.deepEqual(responses, []);
});

for (const status of ['active', 'pending', 'inactive', 'suspended']) {
  test(`a section owned by a ${status} teacher in another subject and department rejects creation and reassignment`, async () => {
    for (const creating of [true, false]) {
      fixture({
        create: creating,
        otherUsers: [sectionOwner({ status })],
        students: [advisoryStudent()],
        subjects: [existingClass({ teacher_id: 'science-teacher', name: 'SCIENCE', class_name: 'SCIENCE 10 - Sincerity' })],
      });
      const snapshot = structuredClone(client.tables);
      await assert.rejects(creating ? create() : assign({ name: 'Changed Name' }), (error) => {
        assert.equal(error.statusCode, 409);
        assert.match(error.message, /Sincerity.*already assigned.*SCIENCE.*Jose Rizal.*different section/i);
        return true;
      });
      assertRejectedAssignmentUnchanged(snapshot);
    }
  });
}

test('a section cannot be shared by two teachers within the same subject and department', async () => {
  fixture({ otherUsers: [sectionOwner({ department: 'MAPEH', subject: 'MAPEH', managed_by: headteacherId })] });
  const snapshot = structuredClone(client.tables);
  await assert.rejects(assign(), (error) => {
    assert.equal(error.statusCode, 409);
    assert.match(error.message, /Sincerity.*already assigned.*MAPEH.*Jose Rizal/i);
    return true;
  });
  assertRejectedAssignmentUnchanged(snapshot);
});

test('a section conflict names the department when its owner has no separate subject', async () => {
  fixture({ otherUsers: [sectionOwner({ subject: '', department: 'Science' })] });
  await assert.rejects(assign(), (error) => {
    assert.equal(error.statusCode, 409);
    assert.match(error.message, /Sincerity.*already assigned.*Science.*Jose Rizal/i);
    return true;
  });
});

test('repeat assignment also rejects a legacy duplicate even when the current teacher is the first owner', async () => {
  fixture({
    teacher: { advisory_section_id: sincerityId },
    otherUsers: [sectionOwner()],
    subjects: [existingClass()],
    students: [advisoryStudent()],
  });
  assert.equal(client.tables.users[0].id, teacherId);
  const snapshot = structuredClone(client.tables);
  await assert.rejects(assign(), (error) => {
    assert.equal(error.statusCode, 409);
    assert.match(error.message, /already assigned.*SCIENCE.*Jose Rizal/i);
    return true;
  });
  assertRejectedAssignmentUnchanged(snapshot);
});

for (const nextSectionId of ['', unityId]) {
  test(`${nextSectionId ? 'moving to another section' : 'clearing the assigned section'} releases the original section for another teacher`, async () => {
    fixture({ teacher: { advisory_section_id: sincerityId }, subjects: [existingClass()] });
    await assign({ advisorySectionId: nextSectionId });
    const { statusCode, response } = await create({
      name: 'Ana Santos', email: 'ana.santos@gmail.com', username: 'ana.santos',
    });
    assert.equal(statusCode, 201);
    const replacement = client.tables.users.find((row) => row.username === 'ana.santos');
    assert.equal(replacement.advisory_section_id, sincerityId);
    assert.equal(response.advisoryClass.className, 'MAPEH 10 - Sincerity');
    assert.equal(client.tables.users.filter((row) => row.role === 'teacher' && row.advisory_section_id === sincerityId).length, 1);
  });
}

test('a failed ownership query prevents section assignment', async () => {
  fixture({ otherUsers: [sectionOwner()] });
  const snapshot = structuredClone(client.tables);
  client.failures.push({ table: 'users', operation: 'select', error: { message: 'Ownership storage unavailable' } });
  await assert.rejects(getAssignableSectionOrThrow(sincerityId, { teacherId }), {
    statusCode: 500,
    message: 'Ownership storage unavailable',
  });
  assertRejectedAssignmentUnchanged(snapshot);
});

for (const operation of ['insert', 'upsert']) {
  test(`a database section conflict during ${operation} reports a friendly error without later side effects`, async () => {
    fixture({ create: operation === 'insert', students: [advisoryStudent()] });
    const snapshot = structuredClone(client.tables);
    client.failures.push({
      table: 'users',
      operation,
      error: {
        code: '23505',
        constraint: 'users_advisory_section_unique',
        message: 'duplicate key value violates unique constraint "users_advisory_section_unique"',
        details: `Key (advisory_section_id)=(${sincerityId}) already exists.`,
      },
    });
    await assert.rejects(operation === 'insert' ? create() : assign(), {
      statusCode: 409,
      message: 'This section is already assigned to another teacher. Choose a different section.',
    });
    assertRejectedAssignmentUnchanged(snapshot);
  });
}

test('section directory lists every adviser so legacy duplicates cannot hide an owner', async () => {
  fixture({
    teacher: { advisory_section_id: sincerityId },
    otherUsers: [
      sectionOwner({ status: 'inactive', profile_image: '/images/jose.jpg' }),
      { id: 'headteacher-with-section', role: 'headteacher', name: 'Head Teacher', advisory_section_id: sincerityId },
    ],
    students: [advisoryStudent()],
  });
  const sections = await listSectionsWithAdvisers();
  const sincerity = sections.find((section) => section.id === sincerityId);
  assert.deepEqual(sincerity.advisers.map((adviser) => adviser.id).sort(), [teacherId, 'science-teacher'].sort());
  assert.equal(sincerity.advisers.find((adviser) => adviser.id === 'science-teacher').subject, 'SCIENCE');
  assert.equal(sincerity.advisers.find((adviser) => adviser.id === 'science-teacher').status, 'inactive');
  assert.equal(sincerity.advisers.find((adviser) => adviser.id === 'science-teacher').profileImage, '/images/jose.jpg');
  assert.equal(sincerity.advisers.find((adviser) => adviser.id === 'science-teacher').email, 'jose.rizal@gmail.com');
  assert.ok(sincerity.advisers.some((adviser) => adviser.id === sincerity.adviser.id));
  assert.equal(sincerity.studentCount, 1);
  assert.deepEqual(sections.find((section) => section.id === unityId).advisers, []);
  assert.equal(sections.find((section) => section.id === unityId).adviser, null);
});

test('section directory finds an older owner behind a server limit of 1000 newer student accounts', async () => {
  fixture({
    create: true,
    otherUsers: [sectionOwner({ created_at: '2026-01-01T00:00:00.000Z' })],
    students: Array.from({ length: 1000 }, (_, index) => ({
      id: `newer-student-${index}`,
      name: `Student ${index}`,
      role: 'student',
      section_id: unityId,
      created_at: '2026-10-01T00:00:00.000Z',
    })),
  });
  capUserReadResults(1000);
  const sections = await listSectionsWithAdvisers();
  const sincerity = sections.find((section) => section.id === sincerityId);
  assert.equal(sincerity.adviser.id, 'science-teacher');
  assert.deepEqual(sincerity.advisers.map((adviser) => adviser.id), ['science-teacher']);
  assert.equal(sincerity.advisers[0].subject, 'SCIENCE');
  assert.equal(sections.find((section) => section.id === unityId).studentCount, 1000);
});

test('section directory pages assigned teachers and includes an owner beyond its first 500 rows', async () => {
  const owners = Array.from({ length: 501 }, (_, index) => sectionOwner({
    id: `teacher-${String(index).padStart(4, '0')}`,
    advisory_section_id: `assigned-section-${index}`,
  }));
  fixture({ create: true, otherUsers: owners });
  client.tables.sections.push(...owners.map((owner) => ({
    id: owner.advisory_section_id,
    name: `Assigned ${owner.id}`,
    is_active: true,
  })));
  const ranges = [];
  capUserReadResults(500, ranges);
  const sections = await listSectionsWithAdvisers();
  assert.deepEqual(ranges, [[0, 499], [500, 999]]);
  const lastSection = sections.find((section) => section.id === owners[500].advisory_section_id);
  assert.equal(lastSection.adviser.id, owners[500].id);
  assert.deepEqual(lastSection.advisers.map((adviser) => adviser.id), [owners[500].id]);
  assert.equal(sections.flatMap((section) => section.advisers).length, owners.length);
});

test('section directory rejects an assigned-teacher read failure rather than reporting sections as available', async () => {
  fixture({ otherUsers: [sectionOwner()] });
  const originalFrom = client.from;
  client.from = (table) => {
    const query = originalFrom(table);
    const originalNot = query.not;
    query.not = (field, operator, value) => {
      if (table === 'users' && field === 'advisory_section_id') {
        query.then = (resolve, reject) => Promise.resolve({
          data: null,
          error: { message: 'Section adviser storage unavailable' },
        }).then(resolve, reject);
      }
      return originalNot(field, operator, value);
    };
    return query;
  };
  await assert.rejects(listSectionsWithAdvisers(), {
    statusCode: 500,
    message: 'Section adviser storage unavailable',
  });
});
