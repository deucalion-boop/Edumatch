const Session = require('../models/Session');
const { sendSuccess } = require('../utils/responseHelper');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const listSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ userId: req.user._id, revokedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ lastSeenAt: -1 }).lean();
  return sendSuccess(res, 200, 'Active sessions fetched', {
    sessions: sessions.map((session) => ({
      id: session._id,
      current: String(session.tokenId) === String(req.session?.tokenId || ''),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      remember: session.remember,
      createdAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
    })),
  });
});

const revokeSession = asyncHandler(async (req, res) => {
  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'Revoked by user' } },
    { returnDocument: 'after' }
  );
  if (!session) {
    const error = new Error('Session not found');
    error.statusCode = 404;
    throw error;
  }
  return sendSuccess(res, 200, 'Session revoked');
});

const logout = asyncHandler(async (req, res) => {
  if (req.session?._id) {
    await Session.updateOne({ _id: req.session._id }, { $set: { revokedAt: new Date(), revokedReason: 'Logout' } });
  }
  return sendSuccess(res, 200, 'Logged out successfully');
});

module.exports = { listSessions, logout, revokeSession };
