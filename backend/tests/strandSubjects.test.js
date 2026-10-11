const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');

let client;
storage.getSupabaseStorageClient = () => client;

const { isSubjectAllowedForStrand, getSubjectsByStrand } = require('../constants/strandSubjects');
const { createAssessment } = require('../controllers/teacherController');

const teacherId = 'biology-teacher';
const subjectId = 'biology-class';

function fixture(track = 'GENERAL', classTeacherId = teacherId) {
  client = createFakeSupabase({
    subjects: [{
      id: subjectId,
      teacher_id: classTeacherId,
      name: 'Biology',
      class_name: 'Biology A',
      code: 'BIO-A',
      track,
      subject_category: 'Science',
      is_active: true,
    }],
    assessments: [],
    lessons: [],
    subject_enrollments: [],
    users: [],
  });
}

async function createActivity(body = {}) {
  let response;
  let statusCode;
  await createAssessment({
    user: { _id: teacherId, name: 'Biology Teacher', role: 'teacher', subject: 'Biology' },
    body: {
      subjectId,
      title: 'Cell structure activity',
      assessmentMode: 'activity',
      challengeDescription: 'Describe the function of each cell structure.',
      ...body,
    },
  }, {
    status(value) { statusCode = value; return this; },
    json(value) { response = value; return this; },
  }, (error) => { throw error; });
  return { statusCode, response };
}

test('GENERAL accepts custom subjects administrators can assign to teachers', () => {
  for (const subject of ['Biology', 'Filipino', 'MAPEH', 'Araling Panlipunan', 'Physical Education', 'Media and Information Literacy']) {
    assert.equal(isSubjectAllowedForStrand({ strand: 'GENERAL', subject }), true, subject);
  }
  assert.equal(isSubjectAllowedForStrand({ strand: ' general ', subject: ' Biology ' }), true);
  for (const subject of getSubjectsByStrand('GENERAL')) {
    assert.equal(isSubjectAllowedForStrand({ strand: 'GENERAL', subject }), true, subject);
  }
});

test('subject validation rejects empty subjects and unknown strands', () => {
  for (const subject of ['', '   ', null, undefined]) {
    assert.equal(isSubjectAllowedForStrand({ strand: 'GENERAL', subject }), false);
  }
  for (const strand of ['', '   ', 'UNKNOWN', null, undefined]) {
    assert.equal(isSubjectAllowedForStrand({ strand, subject: 'Biology' }), false);
  }
});

test('named strands retain their subject restrictions', () => {
  for (const strand of ['STEM', 'HUMSS', 'ABM', 'TVL']) {
    for (const subject of getSubjectsByStrand(strand)) {
      assert.equal(isSubjectAllowedForStrand({ strand, subject }), true, `${strand}: ${subject}`);
    }
    assert.equal(isSubjectAllowedForStrand({ strand, subject: 'Biology' }), false, strand);
    assert.equal(isSubjectAllowedForStrand({ strand, subject: '' }), false, strand);
  }
  assert.equal(isSubjectAllowedForStrand({ strand: 'STEM', subject: 'English' }), false);
  assert.equal(isSubjectAllowedForStrand({ strand: 'HUMSS', subject: 'Mathematics' }), false);
});

test('teacher can publish an activity for an admin-assigned custom GENERAL subject', async () => {
  fixture();
  const { statusCode, response } = await createActivity();
  assert.equal(statusCode, 201);
  assert.equal(response.assessment.subject, 'Biology');
  assert.equal(response.assessment.subjectId, subjectId);
  assert.equal(response.assessment.subjectCategory, 'Science');
  assert.equal(client.tables.assessments.length, 1);
  assert.equal(client.tables.assessments[0].subject, 'Biology');
  assert.equal(client.tables.assessments[0].subject_id, subjectId);
  assert.deepEqual(client.writes.map(({ table, operation }) => ({ table, operation })), [
    { table: 'assessments', operation: 'insert' },
  ]);
});

test('custom GENERAL subjects do not permit a teacher to use a different assigned subject', async () => {
  fixture();
  await assert.rejects(createActivity({ subject: 'Filipino' }), {
    statusCode: 403,
    message: 'You can only create lessons and assessments for your assigned subject: Biology',
  });
  assert.deepEqual(client.writes, []);
});

test('custom GENERAL subjects do not permit publishing to another teacher class', async () => {
  fixture('GENERAL', 'another-teacher');
  await assert.rejects(createActivity(), {
    statusCode: 403,
    message: 'Selected class is not assigned to this teacher',
  });
  assert.deepEqual(client.writes, []);
});

test('custom subject acceptance does not remove named-strand assessment validation', async () => {
  fixture('STEM');
  await assert.rejects(createActivity(), (error) => {
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /^subject is invalid for strand STEM\./);
    return true;
  });
  assert.deepEqual(client.writes, []);
});
