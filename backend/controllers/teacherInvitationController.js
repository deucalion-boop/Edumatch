const service = require('../services/teacherInvitationService');
const { sendSuccess } = require('../utils/responseHelper');
const handler = fn => (req, res, next) => Promise.resolve().then(() => {
  res.set('Cache-Control', 'no-store');
  res.set('Referrer-Policy', 'no-referrer');
  return fn(req, res);
}).catch(error => {
  if (error.teacherInvitationError || (Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) {
    return res.status(error.statusCode).json({ success: false, message: error.message, code: error.code,
      ...(error.verification ? { verification: error.verification } : {}) });
  }
  return next(error);
});
const list = handler(async (req, res) => sendSuccess(res, 200, 'Teacher invitations loaded.', { invitations: await service.listInvitations(req.user._id) }));
const create = handler(async (req, res) => sendSuccess(res, 201, 'Your department registration link is ready to share in your group chat.', await service.createGroupInvitation(req.user._id, req.body)));
const resend = handler(async (req, res) => sendSuccess(res, 200, 'Teacher invitation renewed. Previous links are no longer valid.', await service.resendInvitation(req.user._id, req.params.id, req.body)));
const revoke = handler(async (req, res) => sendSuccess(res, 200, 'Teacher invitation revoked.', { invitation: await service.revokeInvitation(req.user._id, req.params.id) }));
const details = handler(async (req, res) => sendSuccess(res, 200, 'Teacher invitation verified.', { invitation: await service.publicInvitation(req.params.token) }));
const username = handler(async (req, res) => sendSuccess(res, 200, 'Username checked.', await service.usernameAvailability(req.params.token, req.query.username)));
const sendCode = handler(async (req, res) => sendSuccess(res, 200, 'Verification code sent. Check your email.', await service.sendEmailCode(req.params.token, req.body)));
const verifyEmail = handler(async (req, res) => sendSuccess(res, 200, 'Email verified.', await service.verifyEmail(req.params.token, req.body)));
const register = handler(async (req, res) => sendSuccess(res, 201, 'Your teacher account is ready. You can sign in.', await service.registerTeacher(req.params.token, req.body)));
const activate = handler(async (req, res) => sendSuccess(res, 201, 'Account activated. You can now sign in.', await service.activateTeacher(req.params.token, req.body)));
module.exports = { activate, list, create, resend, revoke, details, username, sendCode, verifyEmail, register };
