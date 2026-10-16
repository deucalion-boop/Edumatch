const express = require('express');
const crypto = require('node:crypto');
const controller = require('../controllers/teacherInvitationController');
const { buildLimiter, apiRateLimitKey } = require('../middlewares/rateLimiters');
const keyGenerator = req => crypto.createHash('sha256').update(`${apiRateLimitKey(req)}:${String(req.params.token || '')}`).digest('hex');
const limiter = (prefix, limit, windowMs = 15 * 60 * 1000) => buildLimiter({
  prefix: `teacher-invitation-${prefix}`, windowMs, limit, keyGenerator,
  message: 'Too many teacher invitation requests. Please try again later.',
});
const publicRoutes = express.Router();
publicRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Referrer-Policy', 'no-referrer');
  next();
});
publicRoutes.get('/:token', limiter('read', 60), controller.details);
publicRoutes.get('/:token/username', limiter('username', 90), controller.username);
publicRoutes.post('/:token/email-code', limiter('email', 5), controller.sendCode);
publicRoutes.post('/:token/verify-email', limiter('verify', 15), controller.verifyEmail);
publicRoutes.post('/:token/register', limiter('register', 10), controller.register);
publicRoutes.post('/:token/activate', limiter('register', 10), controller.activate);
module.exports = { publicRoutes };
