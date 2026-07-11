const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const Settings = require('../models/Settings');
const { sendSuccess } = require('../utils/responseHelper');
const { sendEmailViaGmail } = require('../services/gmailService');
const { assertPasswordMeetsPolicy, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } = require('../utils/passwordPolicy');
const { resolveStoredFileUrl } = require('../utils/fileStorage');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const DEFAULT_MAX_LOGIN_ATTEMPTS = 5;
const DEFAULT_ACCOUNT_LOCKOUT_DURATION_MINUTES = 30;
const RESET_TOKEN_TTL_MINUTES = 60;
const APP_NAME = 'EduMatch';
const DEFAULT_MAINTENANCE_MESSAGE = 'The system is currently under maintenance. Please check back later.';
const DEFAULT_ACCESS_TOKEN_TTL = '1d';
const DEFAULT_REMEMBER_ME_TOKEN_TTL = '30d';

function signToken(userId, remember = false) {
  const rememberSession = remember === true;
  return jwt.sign(
    { id: userId, remember: rememberSession },
    process.env.JWT_SECRET,
    { expiresIn: rememberSession ? DEFAULT_REMEMBER_ME_TOKEN_TTL : DEFAULT_ACCESS_TOKEN_TTL }
  );
}

function normalizeProfileImageUrl(user, req) {
  const raw = String(user?.profileImage || '').trim();
  if (!raw) return '';
  return resolveStoredFileUrl(req, raw);
}

function resolveFrontendUrl() {
  return String(process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '') || 'http://localhost:5173';
}

function buildResetPasswordLink(token) {
  const baseUrl = resolveFrontendUrl();
  return `${baseUrl}/auth/reset-password/${encodeURIComponent(token)}`;
}

function resolveClientIpAddress(req) {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)[0];
  const fallbackIp = String(req.ip || req.socket?.remoteAddress || '').trim();
  return String(forwardedFor || fallbackIp).replace(/^::ffff:/, '').trim();
}

function resolveClientUserAgent(req) {
  return String(req.headers['user-agent'] || '').trim().slice(0, 500);
}

async function recordLoginAttempt(req, { username = '', user = null, outcome = 'failed', reason = '' } = {}) {
  try {
    await LoginAttempt.create({
      userId: user?._id || null,
      username: String(username || user?.username || '').trim().slice(0, 120),
      name: String(user?.name || '').trim().slice(0, 200),
      email: String(user?.email || '').trim().toLowerCase().slice(0, 200),
      role: String(user?.role || '').trim().toLowerCase().slice(0, 50),
      outcome: outcome === 'success' ? 'success' : 'failed',
      reason: String(reason || '').trim().slice(0, 300),
      ipAddress: resolveClientIpAddress(req).slice(0, 120),
      userAgent: resolveClientUserAgent(req),
    });
  } catch (error) {
    console.error('[auth.login] Failed to record login attempt:', error);
  }
}

async function sendPasswordResetEmail({ email, name, resetLink }) {
  const safeName = String(name || '').trim() || 'there';
  const subject = `${APP_NAME} Password Reset`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111111; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Reset your password</h2>
      <p style="margin: 0 0 12px;">Hi ${safeName},</p>
      <p style="margin: 0 0 16px;">
        We received a request to reset your ${APP_NAME} password. Click the button below to set a new password.
      </p>
      <p style="margin: 0 0 20px;">
        <a href="${resetLink}" style="display: inline-block; padding: 10px 18px; background: #111111; color: #ffffff; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 14px; color: #4b5563;">
        This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.
      </p>
      <p style="margin: 0; font-size: 12px; color: #6b7280;">${APP_NAME} Security Team</p>
    </div>
  `;
  const text = `Hi ${safeName},\n\nWe received a request to reset your ${APP_NAME} password.\n\nReset link: ${resetLink}\n\nThis link expires in ${RESET_TOKEN_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.\n`;

  return sendEmailViaGmail({
    to: { email, name: safeName },
    subject,
    html,
    text,
  });
}

async function getSecurityPolicy() {
  const settings = await Settings.findOne({ key: 'global' }).select('security').lean();
  return {
    maxLoginAttempts: Number(settings?.security?.maxLoginAttempts || DEFAULT_MAX_LOGIN_ATTEMPTS),
    accountLockoutDurationMinutes: Number(
      settings?.security?.accountLockoutDurationMinutes || DEFAULT_ACCOUNT_LOCKOUT_DURATION_MINUTES
    ),
  };
}

async function getMaintenancePolicy() {
  const settings = await Settings.findOne({ key: 'global' }).select('maintenance').lean();
  return {
    maintenanceModeEnabled: settings?.maintenance?.maintenanceModeEnabled === true,
    maintenanceMessage:
      String(settings?.maintenance?.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE).trim() || DEFAULT_MAINTENANCE_MESSAGE,
  };
}

async function verifyRecaptchaToken({ token, remoteIp }) {
  const recaptchaSecret = String(process.env.RECAPTCHA_SECRET_KEY || '').trim();
  const captchaToken = String(token || '').trim();
  if (!recaptchaSecret || !captchaToken) return false;

  const payload = new URLSearchParams({
    secret: recaptchaSecret,
    response: captchaToken,
  });
  if (remoteIp) {
    payload.append('remoteip', String(remoteIp));
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return false;
    const body = await response.json();
    return body?.success === true;
  } catch (_error) {
    return false;
  }
}

const login = asyncHandler(async (req, res) => {
  const { username, password, captchaToken, remember } = req.body;
  const normalizedUsername = String(username || '').trim();
  const rememberSession = remember === true || String(remember || '').trim().toLowerCase() === 'true';

  if (!normalizedUsername || !password) {
    await recordLoginAttempt(req, {
      username: normalizedUsername,
      outcome: 'failed',
      reason: 'Username and password are required',
    });
    const error = new Error('Username and password are required');
    error.statusCode = 400;
    throw error;
  }

  const isCaptchaValid = await verifyRecaptchaToken({
    token: captchaToken,
    remoteIp: resolveClientIpAddress(req),
  });
  if (!isCaptchaValid) {
    await recordLoginAttempt(req, {
      username: normalizedUsername,
      outcome: 'failed',
      reason: 'Please verify that you are not a robot',
    });
    const error = new Error('Please verify that you are not a robot');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ username: normalizedUsername }).select(
    '+password +failedLoginAttempts +lockUntil +lastActivityAt +lastLoginAt'
  );

  if (!user) {
    await recordLoginAttempt(req, {
      username: normalizedUsername,
      outcome: 'failed',
      reason: 'Invalid username or password',
    });
    const error = new Error('Invalid username or password');
    error.statusCode = 401;
    throw error;
  }

  req.auditLogContext = {
    actorUserId: user._id,
    actorName: user.name,
    actorEmail: user.email,
    actorRole: user.role,
    actorIdentifier: user.username || normalizedUsername,
    targetId: user._id,
    targetLabel: user.name || user.username || user.email,
  };

  if (!user.password) {
    await recordLoginAttempt(req, {
      username: normalizedUsername,
      user,
      outcome: 'failed',
      reason: 'Account setup is incomplete. Please use your invite link to activate your account.',
    });
    const error = new Error('Account setup is incomplete. Please use your invite link to activate your account.');
    error.statusCode = 403;
    throw error;
  }

  const { maxLoginAttempts, accountLockoutDurationMinutes } = await getSecurityPolicy();
  const now = new Date();
  if (user.lockUntil && new Date(user.lockUntil).getTime() > now.getTime()) {
    await recordLoginAttempt(req, {
      username: normalizedUsername,
      user,
      outcome: 'failed',
      reason: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
    });
    const error = new Error('Account is temporarily locked due to too many failed login attempts. Please try again later.');
    error.statusCode = 423;
    throw error;
  }

  const passwordMatched = await user.comparePassword(password);

  if (!passwordMatched) {
    const currentAttempts = Number(user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = currentAttempts;
    if (currentAttempts >= maxLoginAttempts) {
      user.lockUntil = new Date(now.getTime() + accountLockoutDurationMinutes * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    await recordLoginAttempt(req, {
      username: normalizedUsername,
      user,
      outcome: 'failed',
      reason: 'Invalid username or password',
    });
    const error = new Error('Invalid username or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.status === 'pending' || user.status === 'inactive' || user.status === 'suspended') {
    const loginBlockedMessage =
      user.status === 'pending'
        ? 'Account is pending activation. Use your invite email to finish account setup.'
        :
      user.status === 'suspended'
        ? 'Account is suspended. Please contact admin.'
        : 'Account is inactive. Please contact admin.';
    await recordLoginAttempt(req, {
      username: normalizedUsername,
      user,
      outcome: 'failed',
      reason: loginBlockedMessage,
    });
    const error = new Error(
      loginBlockedMessage
    );
    error.statusCode = 403;
    throw error;
  }

  const { maintenanceModeEnabled, maintenanceMessage } = await getMaintenancePolicy();
  if (maintenanceModeEnabled && String(user.role || '').toLowerCase() !== 'admin') {
    await recordLoginAttempt(req, {
      username: normalizedUsername,
      user,
      outcome: 'failed',
      reason: maintenanceMessage,
    });
    const error = new Error(maintenanceMessage);
    error.statusCode = 503;
    throw error;
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = now;
  user.lastActivityAt = now;
  await user.save();
  req.auditLogContext = {
    ...req.auditLogContext,
    actionLabel: 'User login',
  };
  await recordLoginAttempt(req, {
    username: normalizedUsername,
    user,
    outcome: 'success',
    reason: 'Login successful',
  });

  const token = signToken(user._id, rememberSession);

  return sendSuccess(res, 200, 'Login successful', {
    token,
    redirectPath: user.forcePasswordChange ? '/auth/change-password' : undefined,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username || '',
      role: user.role,
      status: user.status,
      strand: user.strand || '',
      subject: user.subject || '',
      department: user.department || '',
      gradeLevel: user.gradeLevel || '',
      profileImage: normalizeProfileImageUrl(user, req),
      contactNumber: user.contactNumber || '',
      hasCompletedTeacherTour: user.hasCompletedTeacherTour === true,
      hasCompletedStudentTour: user.hasCompletedStudentTour === true,
      forcePasswordChange: user.forcePasswordChange === true,
      temporaryPasswordIssuedAt: user.temporaryPasswordIssuedAt || null,
      createdAt: user.createdAt || null,
    },
  });
});

const syncPresence = asyncHandler(async (req, res) => {
  req.auditLogSkip = true;

  return sendSuccess(res, 200, 'Presence synced', {
    lastActivityAt: req.user?.lastActivityAt || new Date(),
  });
});

function resolveInviteError(hashedToken, now) {
  return User.findOne({ 'invite.tokenHash': hashedToken })
    .select('invite')
    .then((candidate) => {
      if (!candidate) {
        const error = new Error('Invalid invite link');
        error.statusCode = 400;
        throw error;
      }

      if (candidate?.invite?.usedAt) {
        const error = new Error('This invite link was already used');
        error.statusCode = 400;
        throw error;
      }

      if (!candidate?.invite?.expiresAt || new Date(candidate.invite.expiresAt).getTime() <= now.getTime()) {
        const error = new Error('This invite link has expired');
        error.statusCode = 400;
        throw error;
      }

      const error = new Error('Invalid invite link');
      error.statusCode = 400;
      throw error;
    });
}

const validateInvite = asyncHandler(async (req, res) => {
  const rawToken = String(req.params.token || '').trim();
  if (!rawToken) {
    const error = new Error('Invite token is required');
    error.statusCode = 400;
    throw error;
  }

  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date();

  const user = await User.findOne({
    'invite.tokenHash': hashedToken,
    'invite.usedAt': null,
    'invite.expiresAt': { $gt: now },
  }).select('name email role status invite.expiresAt');

  if (!user) {
    await resolveInviteError(hashedToken, now);
  }

  return sendSuccess(res, 200, 'Invite link is valid', {
    invite: {
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      expiresAt: user?.invite?.expiresAt || null,
    },
  });
});

const completeInvite = asyncHandler(async (req, res) => {
  const rawToken = String(req.params.token || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!rawToken) {
    const error = new Error('Invite token is required');
    error.statusCode = 400;
    throw error;
  }

  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date();
  const user = await User.findOne({
    'invite.tokenHash': hashedToken,
    'invite.usedAt': null,
    'invite.expiresAt': { $gt: now },
  }).select('+password +invite.tokenHash');

  if (!user) {
    await resolveInviteError(hashedToken, now);
  }

  const hasExistingPassword = Boolean(String(user.password || '').trim());
  if (!hasExistingPassword && (!password || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH)) {
    const error = new Error(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`);
    error.statusCode = 400;
    throw error;
  }

  if (password) {
    assertPasswordMeetsPolicy(password);
    user.password = password;
  }

  user.status = 'active';
  user.forcePasswordChange = false;
  user.temporaryPasswordIssuedAt = null;
  if (!user.invite) {
    user.invite = {};
  }
  user.invite.tokenHash = '';
  user.invite.usedAt = now;

  await user.save();

  return sendSuccess(res, 200, 'Account setup complete. You can now sign in.', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      strand: user.strand || '',
      subject: user.subject || '',
      department: user.department || '',
      gradeLevel: user.gradeLevel || '',
      contactNumber: user.contactNumber || '',
    },
  });
});

const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  if (!email) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email }).select('name email status resetPassword');
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    user.resetPassword = {
      tokenHash,
      expiresAt,
      requestedAt: now,
      usedAt: null,
    };

    await user.save();

    const resetLink = buildResetPasswordLink(rawToken);
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetLink,
    });

    if (!emailResult?.sent) {
      const error = new Error(emailResult?.reason || 'Unable to send reset email');
      error.statusCode = 502;
      throw error;
    }
  }

  return sendSuccess(res, 200, 'If the email exists, a reset link has been sent.');
});

const validatePasswordReset = asyncHandler(async (req, res) => {
  const rawToken = String(req.params.token || '').trim();
  if (!rawToken) {
    const error = new Error('Reset token is required');
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date();
  const user = await User.findOne({
    'resetPassword.tokenHash': tokenHash,
    'resetPassword.usedAt': null,
    'resetPassword.expiresAt': { $gt: now },
  }).select('email resetPassword.expiresAt');

  if (!user) {
    const error = new Error('Reset link is invalid or expired');
    error.statusCode = 400;
    throw error;
  }

  return sendSuccess(res, 200, 'Reset link is valid', {
    reset: {
      email: user.email,
      expiresAt: user?.resetPassword?.expiresAt || null,
    },
  });
});

const completePasswordReset = asyncHandler(async (req, res) => {
  const rawToken = String(req.params.token || '').trim();
  const password = String(req.body?.password || '').trim();

  if (!rawToken) {
    const error = new Error('Reset token is required');
    error.statusCode = 400;
    throw error;
  }

  assertPasswordMeetsPolicy(password);

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const now = new Date();
  const user = await User.findOne({
    'resetPassword.tokenHash': tokenHash,
    'resetPassword.usedAt': null,
    'resetPassword.expiresAt': { $gt: now },
  }).select('+password +resetPassword.tokenHash');

  if (!user) {
    const error = new Error('Reset link is invalid or expired');
    error.statusCode = 400;
    throw error;
  }

  user.password = password;
  user.forcePasswordChange = false;
  user.temporaryPasswordIssuedAt = null;
  if (!user.resetPassword) {
    user.resetPassword = {};
  }
  user.resetPassword.tokenHash = '';
  user.resetPassword.usedAt = now;

  await user.save();

  return sendSuccess(res, 200, 'Password reset successful. You can now sign in.');
});

module.exports = {
  login,
  syncPresence,
  validateInvite,
  completeInvite,
  requestPasswordReset,
  validatePasswordReset,
  completePasswordReset,
};
