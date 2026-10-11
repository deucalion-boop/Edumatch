const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
const uploadStorage = require('../services/storageService');
const aiRuntimeConfig = require('../utils/aiRuntimeConfig');

let client;
let uploadCalls;
storage.getSupabaseStorageClient = () => client;
uploadStorage.uploadFiles = async (files, options) => {
  uploadCalls.push({ files, options });
  return files.map((file) => ({
    originalName: file.originalname,
    storedPath: `https://files.example.test/${file.originalname}`,
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

const { createLesson, createAssessment } = require('../controllers/teacherController');
const { generateAssessmentWithAi } = require('../controllers/aiController');
const teacherId = 'custom-subject-teacher';
const subjectId = 'custom-subject-class';

function fixture(subject, strand = '') {
  uploadCalls = [];
  client = createFakeSupabase({
    subjects: [{
      id: subjectId,
      teacher_id: teacherId,
      name: subject,
      class_name: `${subject} A`,
      track: strand || 'GENERAL',
      is_active: true,
    }],
    lessons: [],
    assessments: [],
    subject_enrollments: [],
    users: [],
  });
  return { _id: teacherId, name: 'Subject Teacher', role: 'teacher', subject, strand };
}

async function call(controller, request) {
  let statusCode;
  let response;
  await controller(request, {
    status(value) { statusCode = value; return this; },
    json(value) { response = value; return this; },
  }, (error) => { throw error; });
  return { statusCode, response };
}

function lessonRequest(user, body = {}) {
  return {
    user,
    protocol: 'http',
    get: () => 'localhost',
    body: {
      title: `${user.subject} lesson`,
      description: 'Read the lesson plan and complete its learning activities.',
      subjectId,
      subject: user.subject,
      ...body,
    },
    files: {
      lessonPlanFile: [{
        originalname: 'lesson.pdf',
        mimetype: 'application/pdf',
        size: 4,
        buffer: Buffer.from('%PDF'),
      }],
    },
  };
}

function aiRequest(user, body = {}) {
  return {
    user,
    body: {
      subjectId,
      subject: user.subject,
      topic: `${user.subject} introduction`,
      examType: 'multiple_choice',
      difficulty: 'medium',
      numberOfItems: 1,
      examDurationMinutes: 30,
      assessmentMode: 'quiz',
      ...body,
    },
  };
}

function legacyLessonFixture() {
  const user = fixture('Biology');
  client.tables.lessons.push({
    id: 'legacy-department-lesson',
    created_by: teacherId,
    title: 'Cells and their functions',
    description: 'A lesson published with the department name before assigned subjects were used.',
    track: 'GENERAL',
    subject: 'Science',
    subject_id: subjectId,
    subject_category: 'Science',
  });
  return user;
}

function linkedQuizRequest(user, body = {}) {
  return {
    user,
    body: {
      lessonId: 'legacy-department-lesson',
      subjectId,
      title: 'Cell structure quiz',
      examType: 'multiple_choice',
      difficulty: 'medium',
      numberOfItems: 1,
      examDurationMinutes: 30,
      assessmentMode: 'quiz',
      questions: [{
        questionText: 'Which structure contains genetic material?',
        type: 'multiple-choice',
        options: ['Nucleus', 'Cell membrane'],
        correctAnswer: 'Nucleus',
        points: 1,
      }],
      ...body,
    },
  };
}

for (const subject of ['Biology', 'Filipino']) {
  test(`teacher can publish an uploaded ${subject} lesson under GENERAL`, async () => {
    const user = fixture(subject);
    const request = lessonRequest(user, subject === 'Biology' ? { track: 'GENERAL' } : {});
    const { statusCode, response } = await call(createLesson, request);

    assert.equal(statusCode, 201);
    assert.equal(response.lesson.subject, subject);
    assert.equal(response.lesson.track, 'GENERAL');
    assert.equal(response.lesson.subjectId, subjectId);
    assert.equal(response.lesson.createdBy, teacherId);
    assert.equal(client.tables.lessons.length, 1);
    assert.equal(client.tables.lessons[0].subject, subject);
    assert.equal(client.tables.lessons[0].track, 'GENERAL');
    assert.equal(client.tables.lessons[0].subject_id, subjectId);
    assert.equal(client.tables.lessons[0].pdf_original_name, 'lesson.pdf');
    assert.equal(uploadCalls.length, 1);
    assert.equal(uploadCalls[0].options.folder, `teacher-lessons/${teacherId}`);
    assert.deepEqual(client.writes.map(({ table, operation }) => ({ table, operation })), [
      { table: 'lessons', operation: 'insert' },
    ]);
  });
}

test('teacher lesson publication rejects a different assigned subject before uploading or writing', async () => {
  const user = fixture('Biology');
  await assert.rejects(call(createLesson, lessonRequest(user, { subject: 'Filipino' })), {
    statusCode: 403,
    message: 'You can only create lessons and assessments for your assigned subject: Biology',
  });
  assert.deepEqual(uploadCalls, []);
  assert.deepEqual(client.writes, []);
});

test('linked quiz persists the assigned subject when a legacy GENERAL lesson uses the department name', async () => {
  const user = legacyLessonFixture();
  const { statusCode, response } = await call(createAssessment, linkedQuizRequest(user, { subject: 'Biology' }));

  assert.equal(statusCode, 201);
  assert.equal(response.assessment.subject, 'Biology');
  assert.equal(response.assessment.lessonId, 'legacy-department-lesson');
  assert.equal(response.assessment.subjectId, subjectId);
  assert.equal(response.assessment.createdBy, teacherId);
  assert.equal(client.tables.assessments.length, 1);
  assert.equal(client.tables.assessments[0].subject, 'Biology');
  assert.equal(client.tables.lessons[0].subject, 'Science');
  assert.deepEqual(client.writes.map(({ table, operation }) => ({ table, operation })), [
    { table: 'assessments', operation: 'insert' },
  ]);
});

test('linked quiz defaults to the teacher assigned subject instead of a legacy GENERAL lesson department', async () => {
  const user = legacyLessonFixture();
  const request = linkedQuizRequest(user);
  assert.equal(Object.hasOwn(request.body, 'subject'), false);
  const { statusCode, response } = await call(createAssessment, request);

  assert.equal(statusCode, 201);
  assert.equal(response.assessment.subject, 'Biology');
  assert.equal(response.assessment.lessonId, 'legacy-department-lesson');
  assert.equal(response.assessment.subjectId, subjectId);
  assert.equal(client.tables.assessments.length, 1);
  assert.equal(client.tables.assessments[0].subject, 'Biology');
  assert.equal(client.tables.lessons[0].subject, 'Science');
  assert.deepEqual(client.writes.map(({ table, operation }) => ({ table, operation })), [
    { table: 'assessments', operation: 'insert' },
  ]);
});

test('legacy GENERAL lesson does not permit explicitly publishing a quiz for a different assigned subject', async () => {
  const user = legacyLessonFixture();
  await assert.rejects(call(createAssessment, linkedQuizRequest(user, { subject: 'Science' })), {
    statusCode: 403,
    message: 'You can only create lessons and assessments for your assigned subject: Biology',
  });
  assert.deepEqual(uploadCalls, []);
  assert.deepEqual(client.writes, []);
});

for (const subject of ['Biology', 'Filipino']) {
  test(`teacher can generate an AI quiz draft for assigned GENERAL subject ${subject}`, async (t) => {
    const user = fixture(subject);
    const provider = t.mock.method(global, 'fetch', async (url, options) => {
      assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
      const payload = JSON.parse(options.body);
      assert.match(payload.messages[0].content, new RegExp(`Subject: ${subject}`));
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({
            title: `${subject} quiz`,
            questions: [{
              questionText: `Which term belongs to ${subject}?`,
              type: 'multiple-choice',
              options: ['Term A', 'Term B'],
              correctAnswer: 'Term A',
              points: 1,
            }],
          }) } }],
        }),
      };
    });

    const { statusCode, response } = await call(generateAssessmentWithAi, aiRequest(user));
    assert.equal(statusCode, 200);
    assert.equal(response.draftAssessment.subject, subject);
    assert.equal(response.draftAssessment.subjectId, subjectId);
    assert.equal(response.draftAssessment.teacherId, teacherId);
    assert.equal(response.draftAssessment.questions.length, 1);
    assert.equal(provider.mock.callCount(), 1);
    assert.deepEqual(client.writes, []);
  });
}

test('teacher AI generation rejects a different assigned subject before contacting the provider', async (t) => {
  const user = fixture('Biology');
  const provider = t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider request'); });
  await assert.rejects(call(generateAssessmentWithAi, aiRequest(user, { subject: 'Filipino' })), {
    statusCode: 403,
    message: 'You can only generate exams for your assigned subject: Biology',
  });
  assert.equal(provider.mock.callCount(), 0);
  assert.deepEqual(client.writes, []);
});

test('teacher AI generation keeps named-strand restrictions before contacting the provider', async (t) => {
  const user = fixture('Biology', 'STEM');
  const provider = t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected provider request'); });
  await assert.rejects(call(generateAssessmentWithAi, aiRequest(user)), (error) => {
    assert.equal(error.statusCode, 400);
    assert.match(error.message, /^subject is invalid for strand STEM\./);
    return true;
  });
  assert.equal(provider.mock.callCount(), 0);
  assert.deepEqual(client.writes, []);
});
