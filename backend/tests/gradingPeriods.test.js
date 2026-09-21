const test = require('node:test');
const assert = require('node:assert/strict');

const {
  GRADING_PERIODS,
  normalizeGradingPeriod,
} = require('../constants/assessmentConfig');
const { buildAssessmentPolicy } = require('../services/assessmentPolicyService');
const { formatRecommendationPayload } = require('../services/recommendationService');

function attempt(gradingPeriod, percentage = 80) {
  return {
    assessmentId: `assessment-${gradingPeriod}`,
    subjectId: `subject-${gradingPeriod}`,
    subjectName: 'Mathematics',
    subjectCode: 'MATH',
    subjectCategory: 'Math',
    score: percentage,
    totalItems: 100,
    percentage,
    gradingPeriod,
    completedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

test('only the three current grading periods are accepted', () => {
  assert.deepEqual(GRADING_PERIODS, ['1st', '2nd', '3rd']);
  assert.equal(normalizeGradingPeriod(' 2nd '), '2nd');
  assert.equal(normalizeGradingPeriod('4th'), '');

  assert.throws(
    () => buildAssessmentPolicy({ assessmentMode: 'grading_assessment', gradingPeriod: '4th' }),
    /Allowed values: 1st, 2nd, 3rd/
  );
});

test('practical exams require a grading period', () => {
  assert.throws(
    () => buildAssessmentPolicy({ assessmentMode: 'quiz', examType: 'practical_exam' }),
    /must be published as an exam/
  );
  assert.equal(buildAssessmentPolicy({ assessmentMode: 'grading_assessment', examType: 'practical_exam', gradingPeriod: '2nd' }).gradingPeriod, '2nd');
});

test('legacy attempts do not affect recommendation progress or scores', () => {
  const payload = formatRecommendationPayload({
    studentId: 'student-1',
    assessmentAttempts: [attempt('1st', 90), attempt('2nd', 75), attempt('4th', 5)],
    recommendedStrand: { name: 'STEM', confidence: 'High' },
  });

  assert.deepEqual(payload.completedGradingPeriods, ['1st', '2nd']);
  assert.deepEqual(payload.missingGradingPeriods, ['3rd']);
  assert.equal(payload.assessmentAttempts.length, 2);
  assert.equal(payload.recommendationProgressPercent, 67);
  assert.equal(payload.isRecommendationReady, false);
  assert.equal(payload.strandScores.STEM, 37.17);
});

test('recommendations unlock after all three current grading periods', () => {
  const payload = formatRecommendationPayload({
    studentId: 'student-1',
    assessmentAttempts: [attempt('1st'), attempt('2nd'), attempt('3rd'), attempt('4th')],
    recommendedStrand: { generatedAt: new Date('2026-01-02T00:00:00.000Z') },
  });

  assert.equal(payload.assessmentAttempts.length, 3);
  assert.equal(payload.recommendationProgressPercent, 100);
  assert.equal(payload.isRecommendationReady, true);
  assert.equal(payload.recommendedStrand.name, 'STEM');
});
