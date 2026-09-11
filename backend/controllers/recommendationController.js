const { readProfileRows } = require('../services/supabaseUserProfileService');
const { sendSuccess } = require('../utils/responseHelper');
const { formatRecommendationPayload, recomputeStudentRecommendation } = require('../services/recommendationService');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function assertRecommendationAccess(req, studentId) {
  const role = String(req.user?.role || '').toLowerCase();
  const requesterId = String(req.user?._id || '');
  const targetStudentId = String(studentId || '');

  if (role === 'admin') return;
  if (role === 'student') {
    if (requesterId !== targetStudentId) {
      const error = new Error('Forbidden: you can only access your own recommendation');
      error.statusCode = 403;
      throw error;
    }
    return;
  }
  if (role === 'teacher') {
    const student = (await readProfileRows('subject_enrollments', 'teacher_id', req.user._id))
      .find(row => String(row.studentId) === targetStudentId && ['approved', 'pending'].includes(row.status));

    if (!student) {
      const error = new Error('Forbidden: student is not under this teacher');
      error.statusCode = 403;
      throw error;
    }
    return;
  }

  const error = new Error('Forbidden');
  error.statusCode = 403;
  throw error;
}

const getRecommendation = asyncHandler(async (req, res) => {
  const studentId = String(req.params.studentId || '').trim();
  if (!studentId) {
    const error = new Error('studentId is required');
    error.statusCode = 400;
    throw error;
  }
  await assertRecommendationAccess(req, studentId);

  const recommendation = (await readProfileRows('recommendations', 'student_id', studentId))[0] || null;

  return sendSuccess(res, 200, 'Recommendation fetched successfully', {
    recommendation: formatRecommendationPayload(recommendation),
  });
});

const recomputeRecommendation = asyncHandler(async (req, res) => {
  const studentId = String(req.params.studentId || '').trim();
  if (!studentId) {
    const error = new Error('studentId is required');
    error.statusCode = 400;
    throw error;
  }
  await assertRecommendationAccess(req, studentId);

  const reason = String(req.body?.reason || 'Manual recompute request').trim();
  const recommendation = await recomputeStudentRecommendation({ studentId, reason });

  return sendSuccess(res, 200, 'Strand recommendation recomputed successfully', {
    recommendation: formatRecommendationPayload(recommendation),
  });
});

module.exports = {
  getRecommendation,
  recomputeRecommendation,
};
