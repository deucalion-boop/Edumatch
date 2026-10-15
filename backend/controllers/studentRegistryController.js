const multer = require('multer');
const service = require('../services/studentRegistryService');
const { sendSuccess } = require('../utils/responseHelper');
const handler = fn => (req, res, next) => Promise.resolve().then(() => fn(req, res, next)).catch(error => {
  if (error.registryError || (Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) {
    return res.status(error.statusCode).json({ success: false, message: error.message, code: error.code,
      ...(error.verification ? { verification: error.verification } : {}),
      ...(Number.isFinite(error.retryAfter) && error.retryAfter > 0 ? { retryAfter: error.retryAfter } : {}) });
  }
  return next(error);
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: service.MAX_FILE_BYTES, files: 1, fields: 0 },
  fileFilter(_req, file, done) { done(/\.xlsx$/i.test(file.originalname) ? null : Object.assign(new Error('Choose an Excel .xlsx file with First Name and Last Name columns.'), { statusCode: 400 }), true); },
}).single('file');
function rosterUpload(req, res, next) {
  upload(req, res, error => {
    if (error || !req.file) return next(Object.assign(new Error(error?.code === 'LIMIT_FILE_SIZE'
      ? 'The Excel file must be 2 MB or smaller.' : error?.statusCode ? error.message : 'Upload one Excel .xlsx file up to 2 MB.'), { statusCode: 400 }));
    next();
  });
}
const list = handler(async (req, res) => sendSuccess(res, 200, 'Student registry loaded.', await service.list(req.user._id, req.query)));
const preview = handler(async (req, res) => sendSuccess(res, 200, 'Import preview ready.', await service.preview(req.user._id, req.file.buffer)));
const importStudents = handler(async (req, res) => sendSuccess(res, 201, 'Student records imported.', await service.importStudents(req.user._id, req.body)));
const link = handler(async (req, res) => sendSuccess(res, 200, 'Registration link ready.', await service.manageLink(req.user._id, req.body)));
const assign = handler(async (req, res) => sendSuccess(res, 200, 'Student class assignments saved.', await service.assign(req.user._id, req.body)));
const revoke = handler(async (req, res) => sendSuccess(res, 200, 'Unused registration code revoked.', await service.changeCode(req.user._id, req.params.id, true)));
const code = handler(async (req, res) => sendSuccess(res, 200, 'New registration code generated.', await service.changeCode(req.user._id, req.params.id)));
const download = template => handler(async (req, res) => {
  const buffer = await service.workbook(req.user._id, req.query, template);
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', `attachment; filename="${template ? 'student-import-template' : 'student-registry'}.xlsx"`);
  res.send(buffer);
});
const details = handler(async (req, res) => sendSuccess(res, 200, 'Registration link available.', await service.details(req.params.token)));
const verify = handler(async (req, res) => sendSuccess(res, 200, 'Student identity verified.', await service.verifyStudent(req.params.token, req.body)));
const username = handler(async (req, res) => sendSuccess(res, 200, 'Username checked.', await service.usernameAvailability(req.params.token, req.query)));
const emailCode = handler(async (req, res) => sendSuccess(res, 200, 'Verification code sent.', await service.sendEmailCode(req.params.token, req.body)));
const verifyEmail = handler(async (req, res) => sendSuccess(res, 200, 'Email verified.', await service.verifyEmail(req.params.token, req.body)));
const register = handler(async (req, res) => sendSuccess(res, 201, 'Your student account is ready. You can now sign in.', await service.registerStudent(req.params.token, req.body)));
module.exports = { rosterUpload, list, preview, importStudents, link, assign, revoke, code, template: download(true), export: download(false), details, verify, username, emailCode, verifyEmail, register };
