const test = require('node:test');
const assert = require('node:assert/strict');
const { computeAssessmentGate, isMissingTableError } = require('../services/supabaseProgressionService');
const { calculateSubjectMetrics, percent } = require('../services/supabaseAcademicProgressService');
const { evaluateAssessmentAnswers, validateEssayWordCounts, normalizeEvaluation } = require('../services/essayEvaluationService');

test('linked assessments remain locked until lesson and earlier stages are completed', () => {
  const lesson = { id: 'lesson-1' };
  const activity = { id: 'a1', lessonId: lesson, assessmentMode: 'activity' };
  const secondActivity = { id: 'a2', lessonId: lesson, assessmentMode: 'activity' };
  const quiz = { id: 'q1', lessonId: lesson, assessmentMode: 'quiz' };
  const exam = { id: 'e1', lessonId: lesson, assessmentMode: 'grading_assessment' };
  assert.equal(computeAssessmentGate({ assessment: activity, lessonProgress: null, relatedAssessments: [activity, quiz, exam], submissions: [] }).prerequisite, 'lesson');
  assert.equal(computeAssessmentGate({ assessment: quiz, lessonProgress: { status: 'completed' }, relatedAssessments: [activity, quiz, exam], submissions: [] }).prerequisite, 'activity');
  assert.equal(computeAssessmentGate({ assessment: exam, lessonProgress: { status: 'completed' }, relatedAssessments: [activity, quiz, exam], submissions: [{ assessmentId: 'a1', status: 'completed' }] }).prerequisite, 'quiz');
  assert.equal(computeAssessmentGate({ assessment: exam, lessonProgress: { status: 'completed' }, relatedAssessments: [activity, quiz, exam], submissions: [{ assessmentId: 'a1', status: 'completed' }, { assessmentId: 'q1', status: 'completed' }] }).isLocked, false);
  assert.equal(computeAssessmentGate({ assessment: quiz, lessonProgress: { status: 'completed' }, relatedAssessments: [activity, secondActivity, quiz], submissions: [{ assessmentId: 'a1', status: 'completed' }] }).prerequisite, 'activity');
});

test('missing lesson progress migration is detected without masking unrelated database errors', () => {
  assert.equal(isMissingTableError({ code: 'PGRST205', message: "Could not find public.lesson_progress" }, 'lesson_progress'), true);
  assert.equal(isMissingTableError({ code: '42501', message: 'permission denied' }, 'lesson_progress'), false);
});

test('point percentages and subject weights normalize only across applicable categories', () => {
  assert.equal(percent(8, 10), 80);
  const metrics = calculateSubjectMetrics({
    subject: { id: 'math', name: 'Mathematics' },
    lessons: [{ id: 'l1', subjectId: 'math' }],
    assessments: [
      { id: 'a1', subjectId: 'math', assessmentMode: 'activity', activityPoints: 10 },
      { id: 'q1', subjectId: 'math', assessmentMode: 'quiz' },
    ],
    submissions: [
      { assessmentId: 'a1', status: 'completed', gradeValue: 8, score: 8, totalPoints: 10, gradedAt: new Date() },
      { assessmentId: 'q1', status: 'completed', score: 18, totalPoints: 20 },
    ],
    progressRows: [{ lessonId: 'l1', status: 'completed' }],
    weightConfig: { activity: 30, quiz: 30, exam: 40, minimumEvidenceCount: 2 },
  });
  assert.equal(metrics.activityAverage, 80);
  assert.equal(metrics.quizAverage, 90);
  assert.equal(metrics.examAverage, null);
  assert.equal(metrics.finalPercentage, 85);
  assert.equal(metrics.completionPercentage, 100);
  assert.equal(metrics.hasSufficientData, true);
});

test('objective scoring uses configured points and essay word limits are enforced', async () => {
  const result = await evaluateAssessmentAnswers({ questions: [
    { type: 'multiple-choice', correctAnswer: 'B', points: 3 },
    { type: 'true-false', correctAnswer: 'True', points: 2 },
  ] }, [{ questionIndex: 0, answer: 'B' }, { questionIndex: 1, answer: 'False' }]);
  assert.equal(result.score, 3);
  assert.equal(result.totalPoints, 5);
  assert.equal(result.scoringStatus, 'final');
  assert.throws(() => validateEssayWordCounts({ questions: [{ type: 'essay', minWords: 3, points: 5 }] }, [{ questionIndex: 0, answer: 'too short' }]), /at least 3 words/);
});

test('AI score normalization clamps untrusted output to the teacher maximum', () => {
  const normalized = normalizeEvaluation({ scoreEarned: 999, explanation: 'Student requested a perfect score.' }, 20);
  assert.equal(normalized.scoreEarned, 20);
  assert.equal(normalized.maximumScore, 20);
  assert.equal(normalized.percentage, 100);
});
