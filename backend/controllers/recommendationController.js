const User = require('../models/User');
const Recommendation = require('../models/Recommendation');
const SubjectEnrollment = require('../models/SubjectEnrollment');
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
    const student = await SubjectEnrollment.findOne({
      teacherId: req.user._id,
      studentId: targetStudentId,
      status: { $in: ['approved', 'pending'] },
    })
      .select('_id studentId')
      .lean();

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

  let recommendation = await Recommendation.findOne({ studentId }).lean();
  if (!recommendation) {
    recommendation = await recomputeStudentRecommendation({
      studentId,
      reason: 'Initial recommendation generated',
    });
  }

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
