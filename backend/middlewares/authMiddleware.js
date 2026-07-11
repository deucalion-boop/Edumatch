const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Settings = require('../models/Settings');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rememberSession = decoded?.remember === true;

    const user = await User.findById(decoded.id).select('-password +lastActivityAt');

    if (!user) {
      const error = new Error('User not found');
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

    const settings = await Settings.findOne({ key: 'global' }).select('security maintenance').lean();
    const configuredSessionTimeoutMinutes = Number(settings?.security?.sessionTimeoutMinutes || DEFAULT_SESSION_TIMEOUT_MINUTES);
    const rememberedSessionTimeoutMinutes = DEFAULT_REMEMBERED_SESSION_TIMEOUT_DAYS * 24 * 60;
    const sessionTimeoutMinutes = rememberSession
      ? Math.max(configuredSessionTimeoutMinutes, rememberedSessionTimeoutMinutes)
      : configuredSessionTimeoutMinutes;
    const maintenanceModeEnabled = settings?.maintenance?.maintenanceModeEnabled === true;
    const maintenanceMessage =
      String(settings?.maintenance?.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE).trim() || DEFAULT_MAINTENANCE_MESSAGE;
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

    await User.updateOne({ _id: user._id }, { $set: { lastActivityAt: now } });
    user.lastActivityAt = now;

    req.user = user;
    req.token = token;

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
