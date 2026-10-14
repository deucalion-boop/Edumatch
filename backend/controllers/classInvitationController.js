const multer = require('multer');
const service = require('../services/classInvitationService');
const { sendSuccess } = require('../utils/responseHelper');
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: service.MAX_FILE_BYTES, files: 1, fields: 1, fieldSize: 256 },
  fileFilter(_req, file, callback) {
    if (!/\.xlsx$/i.test(file.originalname || '')) return callback(Object.assign(new Error('Upload an Excel .xlsx file with Full Name and Section columns.'), { statusCode: 400 }));
    return callback(null, true);
  },
}).single('file');
function rosterUpload(req, res, next) {
  upload(req, res, error => {
    if (error) return next(Object.assign(new Error(error.code === 'LIMIT_FILE_SIZE'
      ? 'The Excel file must be 2 MB or smaller.' : error.statusCode ? error.message : 'Upload one Excel .xlsx file and choose a class.'), { statusCode: 400 }));
    if (!req.file) return next(Object.assign(new Error('Choose an Excel file to upload.'), { statusCode: 400 }));
    return next();
  });
}
const preview = asyncHandler(async (req, res) => sendSuccess(res, 200, 'Roster preview ready.', await service.previewRoster(req.user._id, req.body.subjectId, req.file.buffer)));
const create = asyncHandler(async (req, res) => sendSuccess(res, 201, 'Student invitations created.', { invitation: await service.createInvitation(req.user._id, req.body) }));
const renew = asyncHandler(async (req, res) => sendSuccess(res, 200, 'Invitation renewed. Existing unused codes remain valid.',
  { invitation: await service.renewInvitation(req.user._id, req.params.id, req.body.expiresInDays) }));
const list = asyncHandler(async (req, res) => sendSuccess(res, 200, 'Student invitations loaded.', { invitations: await service.listInvitations(req.user._id) }));
const codes = asyncHandler(async (req, res) => {
  const buffer = await service.exportCodes(req.user._id, req.params.id);
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', 'attachment; filename="edumatch-registration-codes.xlsx"');
  return res.send(Buffer.from(buffer));
});
const details = asyncHandler(async (req, res) => sendSuccess(res, 200, 'Invitation available.', { invitation: await service.publicInvitation(req.params.token) }));
const verify = asyncHandler(async (req, res) => {
  const student = await service.verifyStudent(req.params.token, req.body);
  return sendSuccess(res, 200, 'Student details verified.', { student: { fullName: student.full_name, section: student.section_name } });
});
const username = asyncHandler(async (req, res) => sendSuccess(res, 200, 'Username checked.', await service.usernameAvailability(req.params.token, req.query.username)));
const register = asyncHandler(async (req, res) => {
  await service.registerStudent(req.params.token, req.body);
  return sendSuccess(res, 201, 'Registration complete. You can now sign in to EduMatch.', { registered: true });
});
module.exports = { rosterUpload, preview, create, renew, list, codes, details, verify, username, register };
