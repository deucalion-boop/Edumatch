const express = require('express');
const controller = require('../controllers/classInvitationController');
const { buildLimiter, uploadLimiter } = require('../middlewares/rateLimiters');
const teacher = express.Router();
const publicRoutes = express.Router();
const writeLimiter = buildLimiter({ prefix: 'class-invitation-write', windowMs: 15 * 60 * 1000, limit: 20,
  message: 'Too many roster imports. Please try again later.' });
const readLimiter = buildLimiter({ prefix: 'class-invitation-read', windowMs: 15 * 60 * 1000, limit: 120,
  message: 'Too many invitation checks. Please try again shortly.' });
const usernameLimiter = buildLimiter({ prefix: 'class-invitation-username', windowMs: 15 * 60 * 1000, limit: 120,
  message: 'Too many username checks. Please wait a few minutes and try again.' });
const registrationLimiter = buildLimiter({ prefix: 'class-invitation-register', windowMs: 15 * 60 * 1000, limit: 60,
  message: 'Too many registration attempts. Please wait a few minutes and try again.' });
teacher.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
teacher.get('/', controller.list);
teacher.post('/preview', uploadLimiter, controller.rosterUpload, controller.preview);
teacher.post('/', writeLimiter, controller.create);
teacher.post('/:id/renew', writeLimiter, controller.renew);
publicRoutes.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
publicRoutes.get('/:token', readLimiter, controller.details);
publicRoutes.post('/:token/verify', registrationLimiter, controller.verify);
publicRoutes.get('/:token/username', usernameLimiter, controller.username);
publicRoutes.post('/:token/register', registrationLimiter, controller.register);
module.exports = { teacher, publicRoutes };
