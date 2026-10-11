const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
const uploadStorage = require('../services/storageService');
const aiRuntimeConfig = require('../utils/aiRuntimeConfig');
const fileStorage = require('../utils/fileStorage');
const pdfTextExtractor = require('../utils/pdfTextExtractor');

let client;
let uploads;
let pdfReads;
storage.getSupabaseStorageClient = () => client;
uploadStorage.uploadFiles = async (files, options) => {
  uploads.push({ files, options });
  return files.map((file) => ({
    originalName: file.originalname,
    storedPath: `/uploads/${file.originalname}`,
    mimeType: file.mimetype,
    extension: '.pdf',
    size: file.size,
    uploadedAt: new Date().toISOString(),
  }));
};
aiRuntimeConfig.getAiRuntimeConfigFromEnv = () => ({
  provider: 'openrouter',
  model: 'fixture-model',
  apiKey: 'fixture-api-key',
  isEnabled: true,
  maxTokens: 1024,
  temperature: 0.3,
});
fileStorage.readStoredFileBuffer = async (storedPath) => {
  pdfReads.push(storedPath);
  return Buffer.from('%PDF fixture');
};
pdfTextExtractor.extractTextFromPdf = async () => (
  'The nucleus contains genetic information. The cell membrane regulates what enters and leaves the cell.'
);

const {
  createManagedTeacherLesson,
  createManagedTeacherAssessment,
} = require('../controllers/headteacherController');
const { generateAssessmentWithAi } = require('../controllers/aiController');

const headteacherId = 'science-headteacher';
const teacherId = 'biology-teacher';
const lessonId = 'legacy-general-lesson';

function fixture({ teacher = {}, lesson = null } = {}) {
  uploads = [];
  pdfReads = [];
  client = createFakeSupabase({
    users: [{
      id: teacherId,
      name: 'Biology Teacher',
      email: 'biologyteacher@gmail.com',
      username: 'biologyteacher',
      role: 'teacher',
      status: 'active',
      subject: 'Biology',
      department: 'Science',
      strand: '',
      managed_by: headteacherId,
      ...teacher,
    }],
    lessons: lesson ? [{
      id: lessonId,
      title: 'Cells and their functions',
      description: 'Describe the main parts of a cell.',
      subject: 'Science',
      track: 'GENERAL',
      subject_id: null,
      subject_code: '',
      pdf_path: '/uploads/cells.pdf',
      pdf_original_name: 'cells.pdf',
      created_by: teacherId,
      published_by: headteacherId,
      ...lesson,
    }] : [],
    assessments: [],
  });
}

async function invoke(handler, req) {
  let statusCode;
  let response;
  await handler({
    user: { _id: headteacherId, role: 'headteacher', department: 'Science' },
    ...req,
  }, {
    status(value) { statusCode = value; return this; },
    json(value) { response = value; return this; },
  }, (error) => { throw error; });
  return { statusCode, response };
}

function createLesson(body = {}, req = {}) {
  return invoke(createManagedTeacherLesson, {
    body: {
      teacherId,
      title: 'Cells and their functions',
      description: 'Describe the main parts of a cell.',
      track: 'GENERAL',
      ...body,
    },
    files: { lessonPlanFile: [{ originalname: 'cells.pdf', mimetype: 'application/pdf', size: 123 }] },
    ...req,
  });
}

function createAssessment(body = {}) {
  return invoke(createManagedTeacherAssessment, {
    body: {
      teacherId,
      lessonId,
      title: 'Cell structure quiz',
      examType: 'multiple_choice',
      difficulty: 'medium',
      numberOfItems: 1,
      examDurationMinutes: 30,
      assessmentMode: 'quiz',
      subjectCategory: 'Science',
      questions: [{
        questionText: 'Which structure contains genetic information?',
        type: 'multiple-choice',
        options: ['Nucleus', 'Cell membrane'],
        correctAnswer: 'Nucleus',
        points: 1,
      }],
      ...body,
    },
  });
}

function generateAssessment(body = {}) {
  return invoke(generateAssessmentWithAi, {
    body: {
      teacherId,
      lessonId,
      subject: 'Biology',
      title: 'Cell structure quiz',
      examType: 'multiple_choice',
      difficulty: 'medium',
      numberOfItems: 1,
      examDurationMinutes: 30,
      assessmentMode: 'quiz',
      subjectCategory: 'Science',
      ...body,
    },
  });
}

test('headteacher can create a GENERAL lesson and assessment for a custom assigned subject', async () => {
  fixture();
  const lessonResult = await createLesson();
  assert.equal(lessonResult.statusCode, 201);
  assert.equal(lessonResult.response.lesson.subject, 'Biology');
  assert.equal(client.tables.lessons[0].subject, 'Biology');
  assert.equal(client.tables.lessons[0].track, 'GENERAL');
  assert.equal(client.tables.lessons[0].created_by, teacherId);
  assert.equal(client.tables.lessons[0].published_by, headteacherId);
  assert.equal(uploads.length, 1);

  const assessmentResult = await createAssessment({ lessonId: lessonResult.response.lesson.id });
  assert.equal(assessmentResult.statusCode, 201);
  assert.equal(assessmentResult.response.assessment.subject, 'Biology');
  assert.equal(client.tables.assessments[0].subject, 'Biology');
  assert.equal(client.tables.assessments[0].created_by, teacherId);
  assert.equal(client.tables.assessments[0].published_by, headteacherId);
  assert.deepEqual(client.writes.map(({ table, operation }) => ({ table, operation })), [
    { table: 'lessons', operation: 'insert' },
    { table: 'assessments', operation: 'insert' },
  ]);
});

test('headteacher assessment defaults to teacher assignment for a legacy department-labelled GENERAL lesson', async () => {
  fixture({ lesson: {} });
  const { statusCode, response } = await createAssessment();
  assert.equal(statusCode, 201);
  assert.equal(response.assessment.subject, 'Biology');
  assert.equal(client.tables.assessments[0].subject, 'Biology');
  assert.equal(client.tables.lessons[0].subject, 'Science');
});

test('headteacher can explicitly use the assigned subject with a legacy GENERAL lesson', async () => {
  fixture({ lesson: {} });
  const { statusCode, response } = await createAssessment({ subject: 'Biology' });
  assert.equal(statusCode, 201);
  assert.equal(response.assessment.subject, 'Biology');
});

test('GENERAL does not allow headteacher assessment to replace the assigned teacher subject', async () => {
  fixture({ lesson: {} });
  await assert.rejects(createAssessment({ subject: 'Science' }), {
    statusCode: 403,
    message: 'Assessments for this teacher must stay within the assigned subject: Biology',
  });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(uploads, []);
});

test('headteacher cannot upload a lesson for a teacher managed by another headteacher', async () => {
  fixture({ teacher: { managed_by: 'another-headteacher' } });
  await assert.rejects(createLesson(), { statusCode: 404, message: 'Teacher not found' });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(uploads, []);
});

test('headteacher cannot publish a custom GENERAL assessment for an unmanaged teacher', async () => {
  fixture({ teacher: { managed_by: 'another-headteacher' }, lesson: {} });
  await assert.rejects(createAssessment(), { statusCode: 404, message: 'Teacher not found' });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(uploads, []);
});

test('headteacher cannot upload lessons across departments', async () => {
  fixture({ teacher: { department: 'English' } });
  await assert.rejects(createLesson(), { statusCode: 404, message: 'Teacher not found' });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(uploads, []);
});

test('headteacher custom subject support preserves named-strand lesson restrictions', async () => {
  fixture();
  await assert.rejects(createLesson({ track: 'STEM' }), {
    statusCode: 400,
    message: 'subject is invalid for strand STEM',
  });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(uploads, []);
});

test('headteacher custom subject support preserves named-strand assessment restrictions', async () => {
  fixture({ lesson: { track: 'STEM' } });
  await assert.rejects(createAssessment(), (error) => {
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /^subject is invalid for strand STEM/);
    return true;
  });
  assert.deepEqual(client.writes, []);
});

test('headteacher lessons preserve department fallback for teachers without an explicit subject', async () => {
  fixture({ teacher: { subject: '' } });
  const { statusCode, response } = await createLesson();
  assert.equal(statusCode, 201);
  assert.equal(response.lesson.subject, 'Science');
});

for (const lessonSubject of ['Biology', 'Science']) {
  test(`headteacher AI generation accepts assigned Biology with a GENERAL ${lessonSubject} lesson`, async (t) => {
    fixture({ lesson: { subject: lessonSubject } });
    const provider = t.mock.method(global, 'fetch', async (url, options) => {
      assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
      const payload = JSON.parse(options.body);
      assert.match(payload.messages[0].content, /The nucleus contains genetic information/);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({
            title: 'Cell structure quiz',
            questions: [{
              questionText: 'Which structure contains genetic information?',
              type: 'multiple-choice',
              options: ['Nucleus', 'Cell membrane'],
              correctAnswer: 'Nucleus',
              points: 1,
            }],
          }) } }],
        }),
      };
    });

    const { statusCode, response } = await generateAssessment();
    assert.equal(statusCode, 200);
    assert.equal(response.draftAssessment.subject, 'Biology');
    assert.equal(response.draftAssessment.teacherId, teacherId);
    assert.equal(response.draftAssessment.lessonId, lessonId);
    assert.equal(response.draftAssessment.subjectCategory, 'Science');
    assert.equal(response.draftAssessment.questions.length, 1);
    assert.equal(provider.mock.callCount(), 1);
    assert.deepEqual(pdfReads, ['/uploads/cells.pdf']);
    assert.deepEqual(client.writes, []);
    assert.deepEqual(uploads, []);
  });
}

test('headteacher AI generation rejects unmanaged teachers before reading files or contacting the provider', async (t) => {
  fixture({ teacher: { managed_by: 'another-headteacher' }, lesson: { subject: 'Biology' } });
  const provider = t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider request'); });
  await assert.rejects(generateAssessment(), {
    statusCode: 404,
    message: 'The selected teacher is not managed by this Head Teacher',
  });
  assert.equal(provider.mock.callCount(), 0);
  assert.deepEqual(pdfReads, []);
  assert.deepEqual(client.writes, []);
});

test('headteacher AI generation preserves named-strand restrictions before contacting the provider', async (t) => {
  fixture({ lesson: { subject: 'Biology', track: 'STEM' } });
  const provider = t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider request'); });
  await assert.rejects(generateAssessment(), (error) => {
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /^subject is invalid for strand STEM\. Allowed subjects:/);
    return true;
  });
  assert.equal(provider.mock.callCount(), 0);
  assert.deepEqual(pdfReads, []);
  assert.deepEqual(client.writes, []);
});
