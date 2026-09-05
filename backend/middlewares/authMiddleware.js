const jwt = require('jsonwebtoken');
const { findSupabaseAccount } = require('../services/supabaseAccountService');
const { findActiveSession, touchSession } = require('../services/supabaseAuthPersistenceService');

const DEFAULT_SESSION_TIMEOUT_MINUTES = 120;
const DEFAULT_REMEMBERED_SESSION_TIMEOUT_DAYS = 30;
const DEFAULT_MAINTENANCE_MESSAGE = 'The system is currently under maintenance. Please check back later.';

async function authMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      const error = new Error('Authorization token is required');
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'edumatch-api',
      audience: 'edumatch-web',
    });
    const rememberSession = decoded?.remember === true;

    const user = await findSupabaseAccount('id', decoded.id);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    if (!decoded.jti || Number(decoded.tokenVersion || 0) !== Number(user.tokenVersion || 0)) {
      const error = new Error('Session has been revoked');
      error.statusCode = 401;
      throw error;
    }

    const session = await findActiveSession(user._id, decoded.jti);
    if (!session) {
      const error = new Error('Session has been revoked');
      error.statusCode = 401;
      throw error;
    }

    if (user.status === 'pending' || user.status === 'inactive' || user.status === 'suspended') {
      const error = new Error(
        user.status === 'pending'
          ? 'Your account is pending activation'
          :
        user.status === 'suspended' ? 'Your account is suspended' : 'Your account is inactive'
      );
      error.statusCode = 403;
      throw error;
    }

    if (user.forcePasswordChange === true && !String(req.path || '').startsWith('/change-password')) {
      const error = new Error('Password change required before continuing');
      error.statusCode = 403;
      throw error;
    }

    const configuredSessionTimeoutMinutes = DEFAULT_SESSION_TIMEOUT_MINUTES;
    const rememberedSessionTimeoutMinutes = DEFAULT_REMEMBERED_SESSION_TIMEOUT_DAYS * 24 * 60;
    const sessionTimeoutMinutes = rememberSession
      ? Math.max(configuredSessionTimeoutMinutes, rememberedSessionTimeoutMinutes)
      : configuredSessionTimeoutMinutes;
    const maintenanceModeEnabled = false;
    const maintenanceMessage = DEFAULT_MAINTENANCE_MESSAGE;
    const now = new Date();
    const lastActivityAt = user.lastActivityAt ? new Date(user.lastActivityAt) : null;

    if (maintenanceModeEnabled && String(user.role || '').toLowerCase() !== 'admin') {
      const error = new Error(maintenanceMessage);
      error.statusCode = 503;
      throw error;
    }

    if (lastActivityAt && now.getTime() - lastActivityAt.getTime() > sessionTimeoutMinutes * 60 * 1000) {
      const error = new Error('Session expired due to inactivity. Please sign in again.');
      error.statusCode = 401;
      throw error;
    }

    user.lastActivityAt = now;
    await Promise.all([user.save(), touchSession(session._id, now)]);

    req.user = user;
    req.token = token;
    req.session = session;

    return next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
      error.message = 'Invalid or expired token';
    }
    return next(error);
  }
}

module.exports = authMiddleware;
