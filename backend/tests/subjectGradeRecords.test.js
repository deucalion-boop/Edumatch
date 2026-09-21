const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSubjectGradeRecords, latestGradeResults } = require('../services/supabaseGradeRecordService');
const { buildRecommendationFromGradeRecords } = require('../services/recommendationService');

const subject = { id: 'math-1', name: 'Mathematics', code: 'MATH-10', subjectCategory: 'Math' };
const assessments = ['1st', '2nd', '3rd'].map((gradingPeriod, index) => ({
  id: `assessment-${index + 1}`,
  subjectId: subject.id,
  subject: subject.name,
  assessmentMode: 'grading_assessment',
  gradingPeriod,
  examType: index === 2 ? 'practical_exam' : 'multiple_choice',
  title: `${gradingPeriod} Grading Exam`,
}));

test('builds P1, P2, P3 and Final Grade from persisted grading submissions', () => {
  const submissions = assessments.map((assessment, index) => ({
    id: `submission-${index + 1}`,
    assessmentId: assessment.id,
    score: [90, 84, 87][index],
    totalPoints: 100,
    status: 'completed',
    submittedAt: new Date(`2026-0${index + 1}-01T00:00:00.000Z`).toISOString(),
  }));
  const [record] = buildSubjectGradeRecords({ studentId: 'student-1', subjects: [subject], assessments, submissions });

  assert.equal(record.p1, 90);
  assert.equal(record.p2, 84);
  assert.equal(record.p3, 87);
  assert.equal(record.finalGrade, 87);
  assert.equal(record.completedPeriods, 3);
  assert.equal(record.periods[2].source.examType, 'practical_exam');
  assert.equal(latestGradeResults([record])[0].gradingPeriod, '3rd');
});

test('keeps Final Grade empty until all periods exist', () => {
  const [record] = buildSubjectGradeRecords({
    studentId: 'student-1',
    subjects: [subject],
    assessments,
    submissions: [{ id: 'submission-1', assessmentId: 'assessment-1', score: 80, totalPoints: 100, status: 'completed' }],
  });
  assert.equal(record.p1, 80);
  assert.equal(record.p2, null);
  assert.equal(record.finalGrade, null);
});

test('recommendation ranking uses completed subject grade records', () => {
  const recommendation = buildRecommendationFromGradeRecords([{
    studentId: 'student-1', subjectId: subject.id, subjectName: subject.name, subjectCode: subject.code,
    subjectCategory: 'Math', p1: 90, p2: 84, p3: 87, finalGrade: 87, completedPeriods: 3,
  }]);
  assert.equal(recommendation.isRecommendationReady, true);
  assert.equal(recommendation.recommendationProgressPercent, 100);
  assert.equal(recommendation.recommendedStrand.name, 'STEM');
  assert.equal(recommendation.subjectPerformance[0].finalGrade, 87);
});
