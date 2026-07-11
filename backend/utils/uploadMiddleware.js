const multer = require('multer');
const path = require('path');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const LESSON_FILE_EXTENSIONS = ['.pdf'];
const SUBMISSION_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.webp', '.zip'];

const memoryStorage = multer.memoryStorage();

function buildSafeFileError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

const lessonUpload = multer({
  storage: memoryStorage,
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    const isPdfMime = mime === 'application/pdf'
      || mime === 'application/x-pdf'
      || mime === 'application/octet-stream';

    if (!LESSON_FILE_EXTENSIONS.includes(extension) || !isPdfMime) {
      return cb(buildSafeFileError('Only PDF lesson plan files are allowed'));
    }

    return cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});

const uploadProfileImage = multer({
  storage: memoryStorage,
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const isImageMime = String(file.mimetype || '').startsWith('image/');
    const isAllowedExtension = IMAGE_EXTENSIONS.includes(extension);

    if (!isImageMime || !isAllowedExtension) {
      return cb(buildSafeFileError('Only JPG, JPEG, PNG, or WEBP images are allowed'));
    }

    return cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

function isDocumentOrImageMime(mimeValue) {
  const mime = String(mimeValue || '').toLowerCase();
  return mime.startsWith('image/')
    || mime === 'application/pdf'
    || mime === 'application/msword'
    || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || mime === 'application/vnd.ms-powerpoint'
    || mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    || mime === 'application/vnd.ms-excel'
    || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || mime === 'text/plain'
    || mime === 'application/zip'
    || mime === 'application/x-zip-compressed'
    || mime === 'application/octet-stream';
}

function buildCommonAttachmentUpload(message) {
  return multer({
    storage: memoryStorage,
    fileFilter: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      if (!SUBMISSION_FILE_EXTENSIONS.includes(extension) || !isDocumentOrImageMime(file.mimetype)) {
        return cb(buildSafeFileError(message));
      }

      return cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 5,
    },
  });
}

const uploadStudentSubmissionFiles = buildCommonAttachmentUpload(
  'Only common document, image, and zip files are allowed for student submissions'
);

const uploadTeacherAssessmentFiles = buildCommonAttachmentUpload(
  'Only common document, image, and zip files are allowed for activity attachments'
);

module.exports = {
  lessonUpload,
  uploadProfileImage,
  uploadStudentSubmissionFiles,
  uploadTeacherAssessmentFiles,
};
