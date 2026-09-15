const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');

let client;
storage.getSupabaseStorageClient = () => client;

const {
  findActivitySubmission,
  findActivitySubmissionById,
  saveActivitySubmission,
  updateActivityReview,
} = require('../services/supabaseActivityService');

function fixture() {
  client = createFakeSupabase({ submissions: [] });
}

test('activity drafts and final submissions persist content, timestamps, and late state', async () => {
  fixture();
  const draft = await saveActivitySubmission({
    studentId: 'student',
    assessmentId: 'activity',
    responseText: 'Draft answer',
    status: 'in_progress',
    submittedAt: null,
    draftSavedAt: '2026-09-15T01:00:00.000Z',
  });
  assert.equal(draft.status, 'in_progress');
  assert.equal(draft.submittedAt, null);

  const submitted = await saveActivitySubmission({
    ...draft,
    responseText: 'Final answer',
    status: 'completed',
    submittedAt: '2026-09-16T01:00:00.000Z',
    isLate: true,
  });
  assert.equal(submitted.id, draft.id);
  assert.equal(submitted.responseText, 'Final answer');
  assert.equal(submitted.isLate, true);
  assert.equal((await findActivitySubmission('student', 'activity')).submittedAt, '2026-09-16T01:00:00.000Z');
});

test('teacher review persists grade and can return the same submission for revision', async () => {
  fixture();
  const submission = await saveActivitySubmission({ studentId: 'student', assessmentId: 'activity', status: 'completed' });
  const graded = await updateActivityReview({
    submissionId: submission.id,
    assessmentId: 'activity',
    values: { score: 45, totalPoints: 50, gradeValue: 45, teacherFeedback: 'Good work', gradedAt: '2026-09-15T02:00:00.000Z', status: 'completed' },
  });
  assert.equal(graded.gradeValue, 45);
  assert.equal(graded.totalPoints, 50);
  assert.equal(graded.teacherFeedback, 'Good work');

  const returned = await updateActivityReview({
    submissionId: submission.id,
    assessmentId: 'activity',
    values: { score: 0, totalPoints: 0, gradeValue: null, teacherFeedback: 'Revise section two', gradedAt: null, returnedAt: '2026-09-15T03:00:00.000Z', status: 'returned_for_revision' },
  });
  assert.equal(returned.status, 'returned_for_revision');
  assert.equal(returned.gradeValue, null);
  assert.equal((await findActivitySubmissionById(submission.id, 'activity')).teacherFeedback, 'Revise section two');
});
