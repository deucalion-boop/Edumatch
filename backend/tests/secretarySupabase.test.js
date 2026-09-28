const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');

let client;
storage.getSupabaseStorageClient = () => client;

const controller = require('../controllers/secretaryController');

const SECRETARY_ID = 'secretary-1';
const TEACHER_ID = 'teacher-1';
const STUDENT_ID = 'student-1';
const ARCHIVED_STUDENT_ID = 'student-archived';
const SECTION_ID = 'section-1';

function account(overrides = {}) {
  return {
    id: overrides.id || 'account-1',
    name: 'Account',
    email: 'account@gmail.com',
    username: 'account',
    password_hash: 'private-hash',
    role: 'student',
    status: 'active',
    department: 'Science',
    grade_level: 'Grade 10',
    section_id: null,
    advisory_section_id: null,
    managed_by: null,
    enrollment: {},
    archive: { isArchived: false },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function fixtures() {
  return {
    users: [
      account({ id: SECRETARY_ID, name: 'Secretary', email: 'secretary@gmail.com', role: 'secretary' }),
      account({
        id: TEACHER_ID,
        name: 'Science Teacher',
        email: 'teacher@gmail.com',
        role: 'teacher',
        subject: 'Biology',
        advisory_section_id: SECTION_ID,
      }),
      account({
        id: STUDENT_ID,
        name: 'Current Student',
        email: 'student@gmail.com',
        section_id: SECTION_ID,
        managed_by: TEACHER_ID,
        enrollment: {
          teacherId: TEACHER_ID,
          progress: { masteryProgress: 82, averageScore: 88, completedAssessments: 4 },
        },
      }),
      account({
        id: ARCHIVED_STUDENT_ID,
        name: 'Archived Student',
        email: 'archived@gmail.com',
        status: 'inactive',
        archive: { isArchived: true, schoolYear: '2024-2025' },
      }),
    ],
    sections: [{ id: SECTION_ID, name: 'Emerald', is_active: true }],
    recommendations: [{
      id: 'recommendation-1',
      student_id: STUDENT_ID,
      assessment_attempts: [
        { subjectId: 'math', subjectName: 'Mathematics', subjectCategory: 'Math', percentage: 96, gradingPeriod: '1st' },
        { subjectId: 'math', subjectName: 'Mathematics', subjectCategory: 'Math', percentage: 94, gradingPeriod: '2nd' },
        { subjectId: 'math', subjectName: 'Mathematics', subjectCategory: 'Math', percentage: 95, gradingPeriod: '3rd' },
      ],
      strand_scores: { STEM: 90, HUMSS: 30, ABM: 20, TVL: 40 },
      recommended_strand: { name: 'STEM', confidence: 'High' },
      recommendation_explanation: 'Strong science performance.',
      updated_at: '2026-01-02T00:00:00.000Z',
    }],
  };
}

async function invoke(action, overrides = {}) {
  let responseBody;
  let forwardedError;
  await controller[action]({
    params: {},
    query: {},
    body: {},
    user: { _id: SECRETARY_ID, role: 'secretary', name: 'Secretary' },
    protocol: 'http',
    get: () => '',
    ...overrides,
  }, {
    status() { return this; },
    json(value) { responseBody = value; return this; },
  }, (error) => { forwardedError = error; });
  if (forwardedError) throw forwardedError;
  return responseBody;
}

test('secretary directory reads teacher records from Supabase without exposing password hashes', async () => {
  client = createFakeSupabase(fixtures());

  const result = await invoke('getDirectory');

  assert.deepEqual(result.users.map((user) => user.id), [TEACHER_ID]);
  assert.equal(result.users[0].name, 'Science Teacher');
  assert.equal(Object.hasOwn(result.users[0], 'password'), false);
});

test('secretary student records hydrate Supabase section, adviser, progress, and recommendation data', async () => {
  client = createFakeSupabase(fixtures());

  const result = await invoke('getStudentRecords');

  assert.equal(result.summary.totalStudents, 1);
  assert.equal(result.students[0].id, STUDENT_ID);
  assert.deepEqual(result.students[0].section, { id: SECTION_ID, name: 'Emerald' });
  assert.equal(result.students[0].adviser.id, TEACHER_ID);
  assert.equal(result.students[0].progress.masteryProgress, 82);
  assert.equal(result.students[0].recommendation.recommendedStrand.name, 'STEM');
  assert.equal(Object.hasOwn(result.students[0], 'password'), false);
});

test('ending the school year archives inactive Supabase students', async () => {
  const data = fixtures();
  data.users.push(account({
    id: 'inactive-current',
    name: 'Inactive Current Student',
    email: 'inactive@gmail.com',
    status: 'inactive',
  }));
  client = createFakeSupabase(data);

  const result = await invoke('endSchoolYearArchiveStudents', { body: { schoolYear: '2025-2026' } });

  assert.equal(result.archivedCount, 1);
  const saved = client.tables.users.find((user) => user.id === 'inactive-current');
  assert.equal(saved.archive.isArchived, true);
  assert.equal(saved.archive.schoolYear, '2025-2026');
  assert.equal(saved.archive.archivedBy, SECRETARY_ID);
});
