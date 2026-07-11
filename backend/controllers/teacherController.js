const path = require('path');
const Lesson = require('../models/Lesson');
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const Subject = require('../models/Subject');
const SubjectEnrollment = require('../models/SubjectEnrollment');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');
const { sendSuccess } = require('../utils/responseHelper');
const { computeMasteryFromSubmissions } = require('../utils/studentProgress');
const { inferSubjectCategory, normalizeSubjectCategory } = require('../services/recommendationService');
const {
  buildAssessmentPolicy,
  parseSubmissionDeadline,
  parseExamDurationMinutes,
  isPastDate,
  resolveAssignedStudentIds,
  assertUniqueGradingAssessment,
} = require('../services/assessmentPolicyService');
const { ensureTeacherSubject } = require('../services/subjectService');
const { uploadFile, uploadFiles } = require('../services/storageService');
const { ROLE_STUDENT } = require('../constants/userRoles');
const { normalizeContactNumber, issueInviteForUser, mapUserResponse } = require('../services/userManagementService');
const { getSectionOrThrow } = require('../services/sectionService');
const { resolveStoredFileUrl, downloadOrRedirectStoredFile } = require('../utils/fileStorage');
const { buildExcludeArchivedStudentsFilter, isArchivedStudent } = require('../utils/studentArchive');
const {
  STRANDS,
  normalizeStrand,
  getSubjectsByStrand,
  isSubjectAllowedForStrand,
  getSubjectCategory,
} = require('../constants/strandSubjects');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const CONTACT_NUMBER_REGEX = /^\+?[0-9()\-. ]{7,30}$/;
const ALLOWED_TEACHER_STRANDS = ['', 'STEM', 'HUMSS', 'ABM', 'TVL'];
const PASSING_PERCENTAGE = 50;
const SUBJECT_CATEGORIES = ['Math', 'Science', 'English', 'AP', 'Business', 'Technical'];
function resolveAssessmentSubjectCategory({ subjectCategory, examType, title, lessonTrack }) {
  const resolved = normalizeSubjectCategory(subjectCategory)
    || inferSubjectCategory({ subjectCategory, examType, title, lessonTrack })
    || 'Technical';
  return SUBJECT_CATEGORIES.includes(resolved) ? resolved : 'Technical';
}

function normalizeLessonStrand(input, fallback = '') {
  return normalizeStrand(input || fallback);
}

function normalizeLessonSubject(input) {
  return String(input || '').trim();
}

function buildActivityTitleFromDescription(input) {
  const normalized = String(input || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Classroom Activity';
  return normalized.length <= 60 ? normalized : `${normalized.slice(0, 57).trimEnd()}...`;
}

function parseActivityPoints(value, fallback = null) {
  const normalized = value === undefined || value === null || String(value).trim() === ''
    ? fallback
    : Number(value);

  if (normalized === null) return null;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 100) {
    const error = new Error('activityPoints must be a whole number from 1 to 100');
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function getAssignedTeacherSubject(user) {
  return String(user?.subject || '').trim();
}

function ensureTeacherSubjectAccess(user, requestedSubject) {
  const assignedSubject = getAssignedTeacherSubject(user);
  if (!assignedSubject) {
    const error = new Error('Your teacher profile is missing an assigned subject. Please contact the administrator.');
    error.statusCode = 400;
    throw error;
  }

  if (requestedSubject && requestedSubject !== assignedSubject) {
    const error = new Error(`You can only create lessons and assessments for your assigned subject: ${assignedSubject}`);
    error.statusCode = 403;
    throw error;
  }

  return assignedSubject;
}

function normalizeKeyPart(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildTeacherAssessmentAccessQuery({ teacherId, allowedSubjectIds = [], includeUnlinkedActivities = false }) {
  const normalizedTeacherId = String(teacherId || '').trim();
  const normalizedSubjectIds = (Array.isArray(allowedSubjectIds) ? allowedSubjectIds : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  const orClauses = [];

  if (normalizedSubjectIds.length > 0) {
    orClauses.push({ subjectId: { $in: normalizedSubjectIds } });
  }

  if (includeUnlinkedActivities) {
    orClauses.push({ assessmentMode: 'activity', lessonId: null });
  }

  if (orClauses.length === 0) {
    return { createdBy: normalizedTeacherId, _id: null };
  }

  if (orClauses.length === 1) {
    return {
      createdBy: normalizedTeacherId,
      ...orClauses[0],
    };
  }

  return {
    createdBy: normalizedTeacherId,
    $or: orClauses,
  };
}

function formatCountLabel(count, singular, plural = `${singular}s`) {
  const normalizedCount = Number(count || 0);
  return `${normalizedCount} ${normalizedCount === 1 ? singular : plural}`;
}

function joinWithAnd(items) {
  const normalizedItems = (Array.isArray(items) ? items : []).filter(Boolean);
  if (normalizedItems.length === 0) return '';
  if (normalizedItems.length === 1) return normalizedItems[0];
  if (normalizedItems.length === 2) return `${normalizedItems[0]} and ${normalizedItems[1]}`;
  return `${normalizedItems.slice(0, -1).join(', ')}, and ${normalizedItems[normalizedItems.length - 1]}`;
}

function teacherProfileResponse(user, req) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    strand: user.strand || '',
    subject: user.subject || '',
    department: user.department || '',
    advisorySectionId: String(user.advisorySectionId || '').trim(),
    profileImage: userProfileImageToUrl(user, req),
    contactNumber: user.contactNumber || '',
    hasCompletedTeacherTour: user.hasCompletedTeacherTour === true,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

const createStudentInvite = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    username,
    contactNumber,
  } = req.body || {};

  if (!name || !email) {
    const error = new Error('name and email are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedUsername = String(username || '').trim();
  if (!String(req.user?.advisorySectionId || '').trim()) {
    const error = new Error('You must be assigned to an advisory section before creating student accounts');
    error.statusCode = 409;
    throw error;
  }
  const advisorySection = await getSectionOrThrow(req.user?.advisorySectionId, {
    message: 'You must be assigned to an advisory section before creating student accounts',
  });
  const existing = await User.findOne({ email: normalizedEmail }).select('_id');
  if (existing) {
    const error = new Error('Email already exists');
    error.statusCode = 409;
    throw error;
  }

  if (!normalizedUsername) {
    const error = new Error('username is required');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedUsername.length > 50) {
    const error = new Error('username must be 50 characters or fewer');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  const created = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    username: normalizedUsername,
    role: ROLE_STUDENT,
    status: 'active',
    sectionId: advisorySection._id,
    department: String(req.user?.department || '').trim(),
    gradeLevel: 'Grade 10',
    contactNumber: normalizeContactNumber(contactNumber),
    managedBy: req.user._id,
    enrollment: {
      teacherId: req.user._id,
      status: 'approved',
      requestedAt: now,
      approvedAt: now,
    },
    invite: {
      tokenHash: '',
      expiresAt: null,
      sentAt: null,
      usedAt: null,
    },
  });

  const inviteResult = await issueInviteForUser({
    user: created,
    req,
  });

  return sendSuccess(res, 201, 'Student account created successfully', {
    user: mapUserResponse(created, req),
    invite: inviteResult,
  });
});

function getLessonTrack(lesson) {
  return String(lesson?.track || '').trim();
}

function getEnrollmentTrack(enrollment) {
  return String(enrollment?.track || '').trim();
}

function getEnrollmentTrackId(enrollment) {
  return String(enrollment?.trackId || '').trim();
}

function subjectToResponse(subject) {
  return {
    id: String(subject?._id || ''),
    name: String(subject?.name || '').trim(),
    className: String(subject?.className || '').trim(),
    code: String(subject?.code || '').trim(),
    track: String(subject?.track || '').trim(),
    subjectCategory: String(subject?.subjectCategory || '').trim(),
    department: String(subject?.department || '').trim(),
    description: String(subject?.description || '').trim(),
    teacherId: String(subject?.teacherId || ''),
    createdAt: subject?.createdAt || null,
    updatedAt: subject?.updatedAt || null,
  };
}

async function findTeacherSubjectRecord(teacherId, subjectId) {
  const normalizedTeacherId = String(teacherId || '').trim();
  const normalizedSubjectId = String(subjectId?._id || subjectId || '').trim();
  if (!normalizedTeacherId || !normalizedSubjectId) return null;

  return Subject.findOne({
    _id: normalizedSubjectId,
    teacherId: normalizedTeacherId,
    isActive: true,
  });
}

async function resolveTeacherSubjectRecord({
  teacherId,
  subjectId,
  subjectName,
  track,
  subjectCategory = '',
  className = '',
  department = '',
}) {
  const existing = await findTeacherSubjectRecord(teacherId, subjectId);
  if (existing) return existing;

  const normalizedSubjectName = String(subjectName || '').trim();
  const normalizedTrack = String(track || '').trim();
  if (!normalizedSubjectName || !normalizedTrack) return null;

  return ensureTeacherSubject({
    teacherId,
    name: normalizedSubjectName,
    track: normalizedTrack,
    subjectCategory,
    className,
    department,
  });
}

const createTeacherClass = asyncHandler(async (req, res) => {
  const className = String(req.body?.className || req.body?.name || '').trim();
  const requestedSubject = String(req.body?.subject || '').trim();
  const assignedSubject = ensureTeacherSubjectAccess(req.user, requestedSubject);
  const description = String(req.body?.description || '').trim();
  const track = normalizeLessonStrand(req.user?.strand || req.body?.track || 'GENERAL') || 'GENERAL';

  if (!className) {
    const error = new Error('className is required');
    error.statusCode = 400;
    throw error;
  }

  const subjectRecord = await ensureTeacherSubject({
    teacherId: req.user._id,
    name: assignedSubject,
    track,
    subjectCategory: getSubjectCategory(assignedSubject),
    className,
    description,
    department: String(req.user?.department || '').trim(),
  });

  return sendSuccess(res, 201, 'Class created successfully', {
    subject: subjectToResponse(subjectRecord),
  });
});

const updateTeacherClass = asyncHandler(async (req, res) => {
  const subjectId = String(req.params?.subjectId || '').trim();
  const className = String(req.body?.className || req.body?.name || '').trim();

  if (!subjectId) {
    const error = new Error('subjectId is required');
    error.statusCode = 400;
    throw error;
  }

  if (!className) {
    const error = new Error('className is required');
    error.statusCode = 400;
    throw error;
  }

  const subjectRecord = await Subject.findOne({
    _id: subjectId,
    teacherId: req.user._id,
    isActive: true,
  });

  if (!subjectRecord) {
    const error = new Error('Class not found');
    error.statusCode = 404;
    throw error;
  }

  const assignedSubject = ensureTeacherSubjectAccess(req.user, String(subjectRecord.name || '').trim());
  if (!className.toLowerCase().startsWith(assignedSubject.toLowerCase())) {
    const error = new Error(`Class name must start with the assigned subject: ${assignedSubject}.`);
    error.statusCode = 400;
    throw error;
  }

  const duplicateClass = await Subject.findOne({
    _id: { $ne: subjectRecord._id },
    teacherId: req.user._id,
    name: subjectRecord.name,
    track: subjectRecord.track,
    className,
    isActive: true,
  }).select('_id');

  if (duplicateClass) {
    const error = new Error('A class with that name already exists');
    error.statusCode = 409;
    throw error;
  }

  subjectRecord.className = className;
  try {
    await subjectRecord.save();
  } catch (saveError) {
    if (saveError?.code === 11000) {
      const error = new Error('A class with that name already exists');
      error.statusCode = 409;
      throw error;
    }
    throw saveError;
  }

  await Attendance.updateMany(
    {
      teacherId: req.user._id,
      attendanceScope: 'handled_class',
      subjectId: subjectRecord._id,
    },
    {
      $set: {
        className,
      },
    }
  );

  return sendSuccess(res, 200, 'Class updated successfully', {
    subject: subjectToResponse(subjectRecord),
  });
});

const deleteTeacherClass = asyncHandler(async (req, res) => {
  const subjectId = String(req.params?.subjectId || '').trim();
  if (!subjectId) {
    const error = new Error('subjectId is required');
    error.statusCode = 400;
    throw error;
  }

  const subject = await Subject.findOne({
    _id: subjectId,
    teacherId: req.user._id,
    isActive: true,
  }).lean();

  if (!subject) {
    const error = new Error('Class not found');
    error.statusCode = 404;
    throw error;
  }

  const [
    lessonCount,
    assessmentCount,
    approvedStudentsCount,
    pendingRequestsCount,
    attendanceRecordCount,
  ] = await Promise.all([
    Lesson.countDocuments({ createdBy: req.user._id, subjectId: subject._id }),
    Assessment.countDocuments({ createdBy: req.user._id, subjectId: subject._id }),
    SubjectEnrollment.countDocuments({ teacherId: req.user._id, subjectId: subject._id, status: 'approved' }),
    SubjectEnrollment.countDocuments({ teacherId: req.user._id, subjectId: subject._id, status: 'pending' }),
    Attendance.countDocuments({
      teacherId: req.user._id,
      attendanceScope: 'handled_class',
      subjectId: subject._id,
    }),
  ]);

  const deletionBlockers = [];
  if (lessonCount > 0) deletionBlockers.push(formatCountLabel(lessonCount, 'lesson'));
  if (assessmentCount > 0) deletionBlockers.push(formatCountLabel(assessmentCount, 'assessment'));
  if (approvedStudentsCount > 0) deletionBlockers.push(formatCountLabel(approvedStudentsCount, 'approved student'));
  if (pendingRequestsCount > 0) deletionBlockers.push(formatCountLabel(pendingRequestsCount, 'pending request'));
  if (attendanceRecordCount > 0) deletionBlockers.push(formatCountLabel(attendanceRecordCount, 'attendance record'));

  if (deletionBlockers.length > 0) {
    const error = new Error(`This class cannot be deleted because it still has ${joinWithAnd(deletionBlockers)}. Remove those items first.`);
    error.statusCode = 409;
    throw error;
  }

  await SubjectEnrollment.deleteMany({ teacherId: req.user._id, subjectId: subject._id });
  await Subject.deleteOne({ _id: subject._id, teacherId: req.user._id });

  return sendSuccess(res, 200, 'Class deleted successfully', {
    subject: subjectToResponse(subject),
  });
});

async function syncTeacherSubjects(teacherId) {
  const teacher = await User.findById(teacherId).select('department').lean();
  const teacherDepartment = String(teacher?.department || '').trim();
  const lessons = await Lesson.find({ createdBy: teacherId })
    .select('_id track subject subjectCategory subjectId subjectCode')
    .lean();

  const syncedSubjects = [];
  const lessonUpdates = [];

  for (const lesson of lessons) {
    const normalizedSubject = String(lesson?.subject || '').trim();
    const normalizedTrack = String(lesson?.track || '').trim();
    if (!normalizedSubject || !normalizedTrack) continue;

    const subjectRecord = await resolveTeacherSubjectRecord({
      teacherId,
      subjectId: lesson?.subjectId,
      subjectName: normalizedSubject,
      track: normalizedTrack,
      subjectCategory: lesson?.subjectCategory || getSubjectCategory(normalizedSubject),
      department: teacherDepartment,
    });
    if (!subjectRecord) continue;
    syncedSubjects.push(subjectRecord);

    if (String(lesson?.subjectId || '') !== String(subjectRecord._id) || String(lesson?.subjectCode || '') !== String(subjectRecord.code)) {
      lessonUpdates.push({
        updateOne: {
          filter: { _id: lesson._id },
          update: {
            $set: {
              subjectId: subjectRecord._id,
              subjectCode: subjectRecord.code,
            },
          },
        },
      });
    }
  }

  if (lessonUpdates.length > 0) {
    await Lesson.bulkWrite(lessonUpdates, { ordered: false });
  }

  const assessments = await Assessment.find({ createdBy: teacherId })
    .select('_id lessonId subject subjectId subjectCode subjectCategory')
    .populate('lessonId', 'track subject subjectId subjectCode subjectCategory')
    .lean();

  const assessmentUpdates = [];
  for (const assessment of assessments) {
    const lesson = assessment?.lessonId;
    const normalizedSubject = String(assessment?.subject || lesson?.subject || '').trim();
    const normalizedTrack = String(lesson?.track || '').trim();
    if (!normalizedSubject || !normalizedTrack) continue;

    const subjectRecord = await resolveTeacherSubjectRecord({
      teacherId,
      subjectId: lesson?.subjectId?._id || lesson?.subjectId || assessment?.subjectId,
      subjectName: normalizedSubject,
      track: normalizedTrack,
      subjectCategory: assessment?.subjectCategory || lesson?.subjectCategory || getSubjectCategory(normalizedSubject),
      department: teacherDepartment,
    });
    if (!subjectRecord) continue;

    if (String(assessment?.subjectId || '') !== String(subjectRecord._id) || String(assessment?.subjectCode || '') !== String(subjectRecord.code)) {
      assessmentUpdates.push({
        updateOne: {
          filter: { _id: assessment._id },
          update: {
            $set: {
              subjectId: subjectRecord._id,
              subjectCode: subjectRecord.code,
            },
          },
        },
      });
    }
  }

  if (assessmentUpdates.length > 0) {
    await Assessment.bulkWrite(assessmentUpdates, { ordered: false });
  }

  const subjects = await Subject.find({ teacherId, isActive: true }).sort({ name: 1, createdAt: 1 }).lean();
  return uniqueBy(subjects, (subject) => String(subject?._id || ''));
}

function isPdfLikeAttachment(attachment) {
  const mimeType = String(attachment?.mimeType || attachment?.mimetype || '').toLowerCase();
  const extension = String(attachment?.extension || path.extname(attachment?.originalName || attachment?.originalname || '') || '').toLowerCase();
  return mimeType === 'application/pdf' || extension === '.pdf';
}

function normalizeLessonAttachments(lesson) {
  const attachments = Array.isArray(lesson?.attachments) ? lesson.attachments : [];
  if (attachments.length > 0) return attachments;

  const legacyPath = String(lesson?.pdfPath || '').trim();
  const legacyName = String(lesson?.pdfOriginalName || '').trim();
  if (!legacyPath || !legacyName) return [];

  return [{
    _id: `legacy-${String(lesson?._id || '')}`,
    originalName: legacyName,
    storedPath: legacyPath,
    mimeType: 'application/pdf',
    extension: '.pdf',
    size: 0,
    uploadedAt: lesson?.createdAt || new Date(),
  }];
}

function resolvePrimaryLessonAttachment(lesson) {
  const attachments = normalizeLessonAttachments(lesson);
  if (attachments.length === 0) return null;
  return attachments.find((attachment) => isPdfLikeAttachment(attachment)) || attachments[0];
}

function normalizeAssessmentAttachments(assessment) {
  return Array.isArray(assessment?.attachments) ? assessment.attachments : [];
}

function toAssessmentAttachmentResponse(attachment, req) {
  return {
    id: String(attachment?._id || ''),
    fileName: String(attachment?.originalName || '').trim(),
    fileType: String(attachment?.mimeType || 'application/octet-stream').trim(),
    extension: String(attachment?.extension || '').trim().toLowerCase(),
    size: Number(attachment?.size || 0),
    uploadedAt: attachment?.uploadedAt || null,
    url: resolveStoredFileUrl(req, attachment?.storedPath, {
      fileName: attachment?.originalName || '',
    }),
    downloadUrl: resolveStoredFileUrl(req, attachment?.storedPath, {
      download: true,
      fileName: attachment?.originalName || '',
    }),
    canPreviewInline: String(attachment?.mimeType || '').toLowerCase().startsWith('image/')
      || isPdfLikeAttachment(attachment),
  };
}

function isPreviewableSubmissionAttachment(attachment) {
  const mimeType = String(attachment?.mimeType || '').toLowerCase();
  return mimeType.startsWith('image/') || isPdfLikeAttachment(attachment);
}

function toSubmissionAttachmentResponse(attachment, req) {
  return {
    id: String(attachment?._id || ''),
    fileName: String(attachment?.originalName || '').trim(),
    fileType: String(attachment?.mimeType || 'application/octet-stream').trim(),
    extension: String(attachment?.extension || '').trim().toLowerCase(),
    size: Number(attachment?.size || 0),
    uploadedAt: attachment?.uploadedAt || null,
    url: resolveStoredFileUrl(req, attachment?.storedPath, {
      fileName: attachment?.originalName || '',
    }),
    downloadUrl: resolveStoredFileUrl(req, attachment?.storedPath, {
      download: true,
      fileName: attachment?.originalName || '',
    }),
    canPreviewInline: isPreviewableSubmissionAttachment(attachment),
  };
}

function toAttachmentResponse(attachment, lessonId, req) {
  const host = `${req.protocol}://${req.get('host')}`;
  const attachmentId = String(attachment?._id || '');
  return {
    id: attachmentId,
    fileName: String(attachment?.originalName || '').trim(),
    fileType: String(attachment?.mimeType || 'application/octet-stream').trim(),
    extension: String(attachment?.extension || '').trim().toLowerCase(),
    size: Number(attachment?.size || 0),
    uploadedAt: attachment?.uploadedAt || null,
    url: resolveStoredFileUrl(req, attachment?.storedPath, {
      fileName: attachment?.originalName || '',
    }),
    downloadUrl: `${host}/api/teacher/lessons/${lessonId}/attachments/${attachmentId}/download`,
    canPreviewInline: String(attachment?.mimeType || '').toLowerCase().startsWith('image/')
      || isPdfLikeAttachment(attachment),
  };
}

function lessonToResponse(lesson, req) {
  const host = `${req.protocol}://${req.get('host')}`;
  const attachments = normalizeLessonAttachments(lesson);
  const primaryAttachment = resolvePrimaryLessonAttachment(lesson);

  return {
    id: lesson._id,
    title: lesson.title,
    description: lesson.description,
    track: getLessonTrack(lesson),
    strand: getLessonTrack(lesson),
    subject: String(lesson?.subject || '').trim(),
    subjectId: String(lesson?.subjectId?._id || lesson?.subjectId || '').trim(),
    subjectCode: String(lesson?.subjectCode || lesson?.subjectId?.code || '').trim(),
    subjectCategory: String(lesson?.subjectCategory || '').trim(),
    className: String(lesson?.subjectId?.className || '').trim(),
    pdfOriginalName: primaryAttachment?.originalName || lesson.pdfOriginalName,
    pdfPath: resolveStoredFileUrl(req, primaryAttachment?.storedPath || lesson.pdfPath, {
      fileName: primaryAttachment?.originalName || lesson.pdfOriginalName || '',
    }),
    attachments: attachments.map((attachment) => toAttachmentResponse(attachment, lesson._id, req)),
    downloadUrl: `${host}/api/teacher/lessons/${lesson._id}/download`,
    createdBy: lesson.createdBy,
    createdAt: lesson.createdAt,
  };
}

function userProfileImageToUrl(user, req) {
  const raw = String(user?.profileImage || '').trim();
  if (!raw) return '';
  return resolveStoredFileUrl(req, raw);
}

const createLesson = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    track,
    strand,
    subject,
    subjectCategory,
    trackId,
    lessonTitle,
    lessonContent,
    lessonModule,
    lessonObjectives,
    subjectId,
  } = req.body;

  const normalizedTitle = String(title || lessonTitle || '').trim();
  const requestedStrand = normalizeLessonStrand(strand || track || trackId || lessonModule);
  const normalizedTrack = requestedStrand || 'GENERAL';
  const requestedSubject = normalizeLessonSubject(subject || subjectCategory);
  const normalizedSubject = ensureTeacherSubjectAccess(req.user, requestedSubject);
  const normalizedSubjectCategory = getSubjectCategory(normalizedSubject);
  const normalizedDescription = String(
    description
      || lessonContent
      || lessonObjectives
      || ''
  ).trim();
  const uploadedFiles = Array.isArray(req.files?.lessonPlanFile) ? req.files.lessonPlanFile : [];

  console.log('[createLesson] request body keys:', Object.keys(req.body || {}));
  console.log('[createLesson] request files keys:', Object.keys(req.files || {}));

  if (!normalizedTitle || !normalizedSubject || !normalizedDescription) {
    console.warn('[createLesson] validation failed:', {
      hasTitle: Boolean(normalizedTitle),
      hasSubject: Boolean(normalizedSubject),
      hasDescription: Boolean(normalizedDescription),
    });
    const error = new Error('title, subject, and description are required');
    error.statusCode = 400;
    throw error;
  }

  if (!STRANDS.includes(normalizedTrack)) {
    const error = new Error(`strand must be one of: ${STRANDS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (uploadedFiles.length !== 1) {
    console.warn('[createLesson] validation failed: missing lesson PDF file');
    const error = new Error('Exactly one lesson plan PDF is required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedUploads = uniqueBy(uploadedFiles, (file) => {
    const originalName = String(file.originalname || '').trim().toLowerCase();
    const mimeType = String(file.mimetype || '').trim().toLowerCase();
    const size = Number(file.size || 0);
    return `${originalName}:${mimeType}:${size}`;
  });
  const uploadedAttachments = await uploadFiles(normalizedUploads, {
    folder: `teacher-lessons/${String(req.user?._id || 'unknown')}`,
  });
  const attachmentsPayload = uploadedAttachments.map((file) => ({
    originalName: file.originalName,
    storedPath: file.storedPath,
    mimeType: file.mimeType,
    extension: file.extension,
    size: file.size,
    uploadedAt: file.uploadedAt,
  }));
  const primaryAttachment = attachmentsPayload.find((file) => isPdfLikeAttachment(file)) || attachmentsPayload[0];

  let lesson;
  try {
    const normalizedSubjectId = String(subjectId || '').trim();
    let subjectRecord = null;

    if (normalizedSubjectId) {
      subjectRecord = await findTeacherSubjectRecord(req.user._id, normalizedSubjectId);
      if (!subjectRecord) {
        const error = new Error('Selected class was not found');
        error.statusCode = 404;
        throw error;
      }
    }

    if (!subjectRecord) {
      const matchingSubjects = await Subject.find({
        teacherId: req.user._id,
        isActive: true,
        name: normalizedSubject,
        ...(requestedStrand ? { track: requestedStrand } : {}),
      })
        .sort({ createdAt: 1 })
        .select('_id name className track code subjectCategory');

      if (matchingSubjects.length === 0) {
        const error = new Error('Create a class first in Student Management before posting lessons.');
        error.statusCode = 400;
        throw error;
      }

      if (matchingSubjects.length > 1) {
        const error = new Error('Select the class where this lesson should be posted.');
        error.statusCode = 400;
        throw error;
      }

      subjectRecord = matchingSubjects[0];
    }

    const lessonTrack = normalizeLessonStrand(subjectRecord?.track || normalizedTrack) || normalizedTrack;
    if (!isSubjectAllowedForStrand({ strand: lessonTrack, subject: normalizedSubject })) {
      const allowedSubjects = getSubjectsByStrand(lessonTrack);
      const error = new Error(`subject is invalid for strand ${lessonTrack}. Allowed subjects: ${allowedSubjects.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const duplicateLesson = await Lesson.findOne({
      createdBy: req.user._id,
      subjectId: subjectRecord._id,
      title: new RegExp(`^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }).select('_id');

    if (duplicateLesson) {
      const error = new Error('A lesson with the same title already exists for this class');
      error.statusCode = 409;
      throw error;
    }

    lesson = await Lesson.create({
      title: normalizedTitle,
      description: normalizedDescription,
      track: lessonTrack,
      subject: normalizedSubject,
      subjectId: subjectRecord._id,
      subjectCode: subjectRecord.code,
      subjectCategory: subjectRecord.subjectCategory || normalizedSubjectCategory,
      pdfPath: primaryAttachment.storedPath,
      pdfOriginalName: primaryAttachment.originalName,
      attachments: attachmentsPayload,
      createdBy: req.user._id,
    });
    console.log('[createLesson] saved document:', {
      id: lesson._id,
      title: lesson.title,
      primaryFile: lesson.pdfOriginalName,
      attachmentCount: attachmentsPayload.length,
    });
  } catch (saveError) {
    console.error('[createLesson] save failed:', {
      message: saveError.message,
      name: saveError.name,
      code: saveError.code,
      errors: saveError.errors,
      stack: saveError.stack,
    });
    throw saveError;
  }

  return sendSuccess(res, 201, 'Lesson created successfully', {
    lesson: lessonToResponse(lesson, req),
  });
});

const getTeacherLessons = asyncHandler(async (req, res) => {
  const lessons = await Lesson.find({ createdBy: req.user._id })
    .populate('subjectId', 'className code track')
    .sort({ createdAt: -1 });
  const dedupedLessons = uniqueBy(lessons, (lesson) => {
    if (lesson?._id) return String(lesson._id);
    return `${normalizeKeyPart(lesson?.title)}:${normalizeKeyPart(getLessonTrack(lesson))}:${String(lesson?.createdBy || '')}`;
  });
  return sendSuccess(res, 200, 'Lessons fetched successfully', {
    lessons: dedupedLessons.map((lesson) => lessonToResponse(lesson, req)),
  });
});

const getTeacherSubjects = asyncHandler(async (req, res) => {
  const subjects = await syncTeacherSubjects(req.user._id);

  const [lessonCounts, assessmentCounts, approvedCounts, pendingCounts, attendanceCounts] = await Promise.all([
    Lesson.aggregate([
      { $match: { createdBy: req.user._id, subjectId: { $ne: null } } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } },
    ]),
    Assessment.aggregate([
      { $match: { createdBy: req.user._id, subjectId: { $ne: null } } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } },
    ]),
    SubjectEnrollment.aggregate([
      { $match: { teacherId: req.user._id, status: 'approved' } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } },
    ]),
    SubjectEnrollment.aggregate([
      { $match: { teacherId: req.user._id, status: 'pending' } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } },
    ]),
    Attendance.aggregate([
      { $match: { teacherId: req.user._id, attendanceScope: 'handled_class', subjectId: { $ne: null } } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } },
    ]),
  ]);

  const lessonCountsBySubject = new Map(lessonCounts.map((row) => [String(row._id), Number(row.count || 0)]));
  const assessmentCountsBySubject = new Map(assessmentCounts.map((row) => [String(row._id), Number(row.count || 0)]));
  const approvedCountsBySubject = new Map(approvedCounts.map((row) => [String(row._id), Number(row.count || 0)]));
  const pendingCountsBySubject = new Map(pendingCounts.map((row) => [String(row._id), Number(row.count || 0)]));
  const attendanceCountsBySubject = new Map(attendanceCounts.map((row) => [String(row._id), Number(row.count || 0)]));

  return sendSuccess(res, 200, 'Teacher subjects fetched successfully', {
    subjects: subjects.map((subject) => {
      const lessonCount = lessonCountsBySubject.get(String(subject._id)) || 0;
      const assessmentCount = assessmentCountsBySubject.get(String(subject._id)) || 0;
      const approvedStudentsCount = approvedCountsBySubject.get(String(subject._id)) || 0;
      const pendingRequestsCount = pendingCountsBySubject.get(String(subject._id)) || 0;
      const attendanceRecordCount = attendanceCountsBySubject.get(String(subject._id)) || 0;
      const deletionBlockers = [];

      if (lessonCount > 0) deletionBlockers.push(formatCountLabel(lessonCount, 'lesson'));
      if (assessmentCount > 0) deletionBlockers.push(formatCountLabel(assessmentCount, 'assessment'));
      if (approvedStudentsCount > 0) deletionBlockers.push(formatCountLabel(approvedStudentsCount, 'approved student'));
      if (pendingRequestsCount > 0) deletionBlockers.push(formatCountLabel(pendingRequestsCount, 'pending request'));
      if (attendanceRecordCount > 0) deletionBlockers.push(formatCountLabel(attendanceRecordCount, 'attendance record'));

      return {
        ...subjectToResponse(subject),
        lessonCount,
        assessmentCount,
        approvedStudentsCount,
        pendingRequestsCount,
        attendanceRecordCount,
        canDelete: deletionBlockers.length === 0,
        deleteBlockedReason: deletionBlockers.length === 0
          ? ''
          : `This class cannot be deleted because it still has ${joinWithAnd(deletionBlockers)}.`,
      };
    }),
  });
});

const getTeacherAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({ createdBy: req.user._id })
    .populate('lessonId', 'title track subject subjectId subjectCode')
    .populate('publishedBy', 'name role')
    .populate('lastModifiedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean();
  const dedupedAssessments = uniqueBy(assessments, (assessment) => {
    if (assessment?._id) return String(assessment._id);
    return [
      String(assessment?.createdBy || ''),
      String(assessment?.lessonId?._id || assessment?.lessonId || ''),
      normalizeKeyPart(assessment?.title),
      normalizeKeyPart(assessment?.examType),
    ].join(':');
  });

  const assessmentIds = dedupedAssessments.map((assessment) => assessment._id);
  let submissionCountsByAssessment = new Map();

  if (assessmentIds.length > 0) {
    const submissionCounts = await Submission.aggregate([
      {
        $match: {
          assessmentId: { $in: assessmentIds },
          status: { $in: ['completed', 'auto_submitted', 'terminated'] },
        },
      },
      { $group: { _id: '$assessmentId', count: { $sum: 1 } } },
    ]);

    submissionCountsByAssessment = new Map(
      submissionCounts.map((item) => [String(item._id), item.count])
    );
  }

  const mappedAssessments = dedupedAssessments.map((assessment) => ({
    id: assessment._id,
    title: assessment.title,
    examType: String(assessment.assessmentMode || 'activity') === 'activity'
      ? 'File Upload'
      : assessment.examType,
    subject: String(assessment.subject || assessment.lessonId?.subject || '').trim(),
    subjectId: String(assessment.subjectId || assessment.lessonId?.subjectId || ''),
    subjectCode: String(assessment.subjectCode || assessment.lessonId?.subjectCode || ''),
    subjectCategory: assessment.subjectCategory || 'Technical',
    difficulty: assessment.difficulty,
    numberOfItems: assessment.numberOfItems,
    activityPoints: Number.isInteger(Number(assessment.activityPoints)) && Number(assessment.activityPoints) >= 1
      ? Number(assessment.activityPoints)
      : null,
    assessmentMode: String(assessment.assessmentMode || 'activity'),
    gradingPeriod: String(assessment.gradingPeriod || ''),
    countsTowardRecommendation: Boolean(assessment.countsTowardRecommendation),
    assignmentScope: String(assessment.assignmentScope || 'handled_class'),
    assignedStudentsCount: Array.isArray(assessment.assignedStudentIds) ? assessment.assignedStudentIds.length : 0,
    examDurationMinutes: Number(assessment.examDurationMinutes || 30),
    maxViolations: Number(assessment.maxViolations || 3),
    violationAction: String(assessment.violationAction || 'auto-submit'),
    submissionDeadline: assessment.submissionDeadline || null,
    isDeadlinePassed: assessment.submissionDeadline ? isPastDate(assessment.submissionDeadline) : false,
    attachments: normalizeAssessmentAttachments(assessment).map((attachment) => toAssessmentAttachmentResponse(attachment, req)),
    attachmentCount: normalizeAssessmentAttachments(assessment).length,
    questionsCount: Array.isArray(assessment.questions) ? assessment.questions.length : 0,
    answerKey: (Array.isArray(assessment.questions) ? assessment.questions : []).map((question, index) => ({
      questionNumber: index + 1,
      questionText: String(question?.questionText || '').trim(),
      type: String(question?.type || '').trim(),
      options: Array.isArray(question?.options) ? question.options : [],
      correctAnswer: String(question?.correctAnswer || '').trim(),
      points: Number(question?.points || 1),
    })),
    lessonTitle: assessment.lessonId?.title || '',
    lessonTrack: getLessonTrack(assessment.lessonId),
    lessonSubject: String(assessment?.lessonId?.subject || '').trim(),
    submissionsCount: submissionCountsByAssessment.get(String(assessment._id)) || 0,
    publishedBy: assessment?.publishedBy
      ? {
        id: String(assessment.publishedBy._id || ''),
        name: String(assessment.publishedBy.name || '').trim(),
        role: String(assessment.publishedBy.role || '').trim(),
      }
      : null,
    lastModifiedBy: assessment?.lastModifiedBy
      ? {
        id: String(assessment.lastModifiedBy._id || ''),
        name: String(assessment.lastModifiedBy.name || '').trim(),
        role: String(assessment.lastModifiedBy.role || '').trim(),
      }
      : null,
    createdAt: assessment.createdAt,
    updatedAt: assessment.updatedAt,
  }));

  return sendSuccess(res, 200, 'Assessments fetched successfully', {
    assessments: mappedAssessments,
  });
});

const downloadTeacherLessonPdf = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lesson = await Lesson.findOne({ _id: id, createdBy: req.user._id });

  if (!lesson) {
    const error = new Error('Lesson not found');
    error.statusCode = 404;
    throw error;
  }

  const primaryAttachment = resolvePrimaryLessonAttachment(lesson);
  if (!primaryAttachment) {
    const error = new Error('Lesson has no downloadable files');
    error.statusCode = 404;
    throw error;
  }
  return downloadOrRedirectStoredFile(
    req,
    res,
    primaryAttachment.storedPath || lesson.pdfPath,
    primaryAttachment.originalName || lesson.pdfOriginalName
  );
});

const downloadTeacherLessonAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;
  const lesson = await Lesson.findOne({ _id: id, createdBy: req.user._id });

  if (!lesson) {
    const error = new Error('Lesson not found');
    error.statusCode = 404;
    throw error;
  }

  const attachments = normalizeLessonAttachments(lesson);
  const attachment = attachments.find((item) => String(item?._id || '') === String(attachmentId || ''));
  if (!attachment) {
    const error = new Error('Attachment not found');
    error.statusCode = 404;
    throw error;
  }

  return downloadOrRedirectStoredFile(req, res, attachment.storedPath, attachment.originalName);
});

const createAssessment = asyncHandler(async (req, res) => {
  const {
    lessonId,
    subjectId: subjectIdRaw,
    title,
    examType,
    subject,
    subjectCategory,
    difficulty,
    numberOfItems,
    examDurationMinutes: examDurationMinutesRaw,
    challengeDescription: challengeDescriptionRaw,
    questions,
    assessmentMode,
    gradingPeriod,
    assignmentScope,
    submissionDeadline: submissionDeadlineRaw,
    deadline: deadlineRaw,
    deadlineAt: deadlineAtRaw,
    activityPoints: activityPointsRaw,
  } = req.body;
  console.log('[createAssessment] request body:', req.body);

  const normalizedAssessmentMode = String(assessmentMode || 'activity').trim().toLowerCase() || 'activity';
  const isActivityAssessment = normalizedAssessmentMode === 'activity';
  const normalizedChallengeDescription = String(challengeDescriptionRaw || '').trim();
  const normalizedExamType = isActivityAssessment
    ? 'activity_upload'
    : String(examType || '').trim();
  const normalizedActivityPoints = isActivityAssessment
    ? parseActivityPoints(activityPointsRaw, 100)
    : null;
  const normalizedDifficulty = isActivityAssessment
    ? 'medium'
    : String(difficulty || '').trim();
  const normalizedNumberOfItems = isActivityAssessment
    ? 1
    : Number(numberOfItems || 0);
  const normalizedLessonId = String(lessonId || '').trim();
  const normalizedSubjectId = String(subjectIdRaw || '').trim();
  const hasLinkedLesson = Boolean(normalizedLessonId);
  let selectedClass = null;

  if (!isActivityAssessment && (!normalizedExamType || !normalizedDifficulty || !normalizedNumberOfItems)) {
    const error = new Error('examType, difficulty, and numberOfItems are required for quizzes and exams');
    error.statusCode = 400;
    throw error;
  }

  const examDurationMinutes = isActivityAssessment
    ? parseExamDurationMinutes(examDurationMinutesRaw ?? 30, { required: true })
    : parseExamDurationMinutes(examDurationMinutesRaw, { required: true });

  const lesson = hasLinkedLesson
    ? await Lesson.findOne({ _id: normalizedLessonId, createdBy: req.user._id })
    : null;
  if (hasLinkedLesson && !lesson) {
    const error = new Error('Lesson not found for this teacher');
    error.statusCode = 404;
    throw error;
  }
  if (!hasLinkedLesson && normalizedSubjectId) {
    selectedClass = await Subject.findOne({
      _id: normalizedSubjectId,
      teacherId: req.user._id,
      isActive: true,
    });

    if (!selectedClass) {
      const error = new Error('Selected class was not found');
      error.statusCode = 404;
      throw error;
    }
  }
  if (!hasLinkedLesson && !selectedClass) {
    const error = new Error('Select a linked lesson or class before creating this assessment');
    error.statusCode = 400;
    throw error;
  }
  const normalizedTitle = isActivityAssessment
    ? String(title || '').trim() || buildActivityTitleFromDescription(normalizedChallengeDescription)
    : String(title || '').trim();
  const normalizedRequestedSubject = String(subject || lesson?.subject || selectedClass?.name || req.user?.subject || '').trim();
  if (!normalizedTitle || !normalizedRequestedSubject) {
    const error = new Error('title and subject are required');
    error.statusCode = 400;
    throw error;
  }
  if (isActivityAssessment && !normalizedChallengeDescription) {
    const error = new Error('challengeDescription is required for activities');
    error.statusCode = 400;
    throw error;
  }

  const normalizedSubject = ensureTeacherSubjectAccess(req.user, normalizedRequestedSubject);
  const lessonStrand = normalizeLessonStrand(lesson?.track || selectedClass?.track);
  if ((lesson || selectedClass) && !isSubjectAllowedForStrand({ strand: lessonStrand, subject: normalizedSubject })) {
    const allowedSubjects = getSubjectsByStrand(lessonStrand);
    const error = new Error(`subject is invalid for strand ${lessonStrand}. Allowed subjects: ${allowedSubjects.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  const duplicateAssessmentQuery = {
    createdBy: req.user._id,
    title: new RegExp(`^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    examType: normalizedExamType,
    lessonId: hasLinkedLesson ? normalizedLessonId : null,
  };
  if (!hasLinkedLesson && selectedClass?._id) {
    duplicateAssessmentQuery.subjectId = selectedClass._id;
  }
  const duplicateAssessment = await Assessment.findOne(duplicateAssessmentQuery).select('_id');

  if (duplicateAssessment) {
    const error = new Error(hasLinkedLesson
      ? 'An assessment with the same title already exists for this lesson'
      : 'An activity with the same title already exists for this class');
    error.statusCode = 409;
    throw error;
  }

  const submissionDeadline = parseSubmissionDeadline(
    submissionDeadlineRaw ?? deadlineRaw ?? deadlineAtRaw
  );
  const challengeDescription = normalizedChallengeDescription;
  if (submissionDeadline && isPastDate(submissionDeadline)) {
    const error = new Error('submissionDeadline must be a future date and time');
    error.statusCode = 400;
    throw error;
  }

  const uploadedAssessmentFiles = Array.isArray(req.files?.attachments) ? req.files.attachments : [];
  let assessmentAttachmentsPayload = [];
  if (isActivityAssessment && uploadedAssessmentFiles.length > 0) {
    const normalizedUploads = uniqueBy(uploadedAssessmentFiles, (file) => {
      const originalName = String(file.originalname || '').trim().toLowerCase();
      const mimeType = String(file.mimetype || '').trim().toLowerCase();
      const size = Number(file.size || 0);
      return `${originalName}:${mimeType}:${size}`;
    });

    const uploadedAttachments = await uploadFiles(normalizedUploads, {
      folder: `teacher-assessments/${String(req.user?._id || 'unknown')}`,
    });
    assessmentAttachmentsPayload = uploadedAttachments.map((file) => ({
      originalName: file.originalName,
      storedPath: file.storedPath,
      mimeType: file.mimeType,
      extension: file.extension,
      size: file.size,
      uploadedAt: file.uploadedAt,
    }));
  }

  let assessment;
  try {
    const assessmentPolicy = buildAssessmentPolicy({
      assessmentMode: normalizedAssessmentMode,
      gradingPeriod,
      assignmentScope,
    });
    const subjectRecord = lesson
      ? await resolveTeacherSubjectRecord({
        teacherId: req.user._id,
        subjectId: lesson.subjectId,
        subjectName: lesson.subject || normalizedSubject,
        track: lesson.track,
        subjectCategory: lesson.subjectCategory || getSubjectCategory(normalizedSubject),
      })
      : selectedClass;
    if (lesson && !subjectRecord) {
      const error = new Error('Linked lesson is not attached to a class. Recreate the lesson with a class selected.');
      error.statusCode = 400;
      throw error;
    }
    if (
      lesson
      && (
        !lesson.subjectId
        || String(lesson.subjectId) !== String(subjectRecord._id)
        || String(lesson.subjectCode || '') !== String(subjectRecord.code)
      )
    ) {
      lesson.subjectId = subjectRecord._id;
      lesson.subjectCode = subjectRecord.code;
      await lesson.save();
    }

    if (assessmentPolicy.countsTowardRecommendation) {
      await assertUniqueGradingAssessment({
        teacherId: req.user._id,
        subjectId: subjectRecord?._id,
        gradingPeriod: assessmentPolicy.gradingPeriod,
      });
    }

    const assignedStudentIds = await resolveAssignedStudentIds({
      assignmentScope: assessmentPolicy.assignmentScope,
      teacherId: req.user._id,
      subjectId: subjectRecord?._id || null,
      fallbackToAllHandledStudents: isActivityAssessment && !lesson && !subjectRecord,
    });

    assessment = await Assessment.create({
      lessonId: lesson?._id || undefined,
      title: normalizedTitle,
      examType: normalizedExamType,
      subject: String(subjectRecord?.name || normalizedSubject).trim(),
      subjectId: subjectRecord?._id || null,
      subjectCode: subjectRecord?.code || '',
      subjectCategory: resolveAssessmentSubjectCategory({
        subjectCategory: subjectCategory || subjectRecord?.subjectCategory || getSubjectCategory(normalizedSubject),
        examType: normalizedExamType,
        title: normalizedTitle,
        lessonTrack: lesson?.track || subjectRecord?.track || req.user?.strand || '',
      }),
      difficulty: normalizedDifficulty,
      numberOfItems: normalizedNumberOfItems,
      activityPoints: normalizedActivityPoints,
      examDurationMinutes,
      submissionDeadline: submissionDeadline || null,
      challengeDescription,
      attachments: assessmentAttachmentsPayload,
      assessmentMode: assessmentPolicy.assessmentMode,
      gradingPeriod: assessmentPolicy.gradingPeriod,
      countsTowardRecommendation: assessmentPolicy.countsTowardRecommendation,
      assignmentScope: assessmentPolicy.assignmentScope,
      assignedStudentIds,
      questions: Array.isArray(questions) ? questions : [],
      createdBy: req.user._id,
      publishedBy: req.user._id,
      lastModifiedBy: req.user._id,
    });
    console.log('[createAssessment] saved document:', {
      id: assessment._id,
      title: assessment.title,
      numberOfItems: assessment.numberOfItems,
    });
  } catch (saveError) {
    console.error('[createAssessment] save failed:', {
      message: saveError.message,
      name: saveError.name,
      code: saveError.code,
      errors: saveError.errors,
      stack: saveError.stack,
    });
    throw saveError;
  }

  return sendSuccess(res, 201, 'Assessment created successfully', { assessment });
});

const updateAssessmentQuestions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    questions,
    title,
    examType,
    subject,
    subjectCategory,
    difficulty,
    numberOfItems,
    assessmentMode,
    gradingPeriod,
    assignmentScope,
    examDurationMinutes: examDurationMinutesRaw,
    submissionDeadline: submissionDeadlineRaw,
    deadline: deadlineRaw,
    deadlineAt: deadlineAtRaw,
    activityPoints: activityPointsRaw,
  } = req.body;

  const assessment = await Assessment.findOne({ _id: id, createdBy: req.user._id });
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  if (questions !== undefined) {
    if (!Array.isArray(questions)) {
      const error = new Error('questions must be an array');
      error.statusCode = 400;
      throw error;
    }
    assessment.questions = questions;
  }

  const lesson = assessment.lessonId
    ? await Lesson.findById(assessment.lessonId).select('track subject subjectId subjectCode subjectCategory').lean()
    : null;
  const selectedClass = !lesson && assessment.subjectId
    ? await Subject.findOne({
      _id: assessment.subjectId,
      teacherId: req.user._id,
      isActive: true,
    }).lean()
    : null;
  const nextPolicy = buildAssessmentPolicy({
    assessmentMode: assessmentMode !== undefined ? assessmentMode : assessment.assessmentMode,
    gradingPeriod: gradingPeriod !== undefined ? gradingPeriod : assessment.gradingPeriod,
    assignmentScope: assignmentScope !== undefined ? assignmentScope : assessment.assignmentScope,
  });

  if (!lesson && !selectedClass) {
    const error = new Error('A linked lesson or class is required for this assessment');
    error.statusCode = 400;
    throw error;
  }

  if (title !== undefined) assessment.title = title;
  if (examType !== undefined) assessment.examType = examType;
  if (subject !== undefined) {
    const nextSubject = ensureTeacherSubjectAccess(req.user, String(subject || '').trim());
    const lessonStrand = normalizeLessonStrand(lesson?.track || selectedClass?.track);
    if ((lesson || selectedClass) && !isSubjectAllowedForStrand({ strand: lessonStrand, subject: nextSubject })) {
      const allowedSubjects = getSubjectsByStrand(lessonStrand);
      const error = new Error(`subject is invalid for strand ${lessonStrand}. Allowed subjects: ${allowedSubjects.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    assessment.subject = nextSubject;
  }

  const subjectRecord = lesson
    ? await resolveTeacherSubjectRecord({
      teacherId: req.user._id,
      subjectId: lesson?.subjectId || assessment.subjectId,
      subjectName: String(assessment.subject || lesson?.subject || '').trim(),
      track: lesson?.track || '',
      subjectCategory: lesson?.subjectCategory || getSubjectCategory(assessment.subject || lesson?.subject),
    })
    : selectedClass;
  if (subjectRecord) {
    assessment.subjectId = subjectRecord._id;
    assessment.subjectCode = subjectRecord.code;
  } else if (!lesson && !selectedClass) {
    assessment.subjectId = null;
    assessment.subjectCode = '';
  }
  if (subjectCategory !== undefined || examType !== undefined || title !== undefined || subject !== undefined) {
    assessment.subjectCategory = resolveAssessmentSubjectCategory({
      subjectCategory: subjectCategory || getSubjectCategory(assessment.subject),
      examType: examType !== undefined ? examType : assessment.examType,
      title: title !== undefined ? title : assessment.title,
      lessonTrack: lesson?.track || selectedClass?.track || req.user?.strand || '',
    });
  }
  if (difficulty !== undefined) assessment.difficulty = difficulty;
  if (numberOfItems !== undefined) assessment.numberOfItems = numberOfItems;
  assessment.assessmentMode = nextPolicy.assessmentMode;
  if (nextPolicy.assessmentMode === 'activity') {
    const currentActivityPoints = Number(assessment.activityPoints);
    const fallbackActivityPoints = Number.isInteger(currentActivityPoints) && currentActivityPoints >= 1
      ? currentActivityPoints
      : 100;
    assessment.activityPoints = parseActivityPoints(activityPointsRaw, fallbackActivityPoints);
  } else {
    assessment.activityPoints = null;
  }
  assessment.gradingPeriod = nextPolicy.gradingPeriod;
  assessment.countsTowardRecommendation = nextPolicy.countsTowardRecommendation;
  assessment.assignmentScope = nextPolicy.assignmentScope;
  if (examDurationMinutesRaw !== undefined) {
    assessment.examDurationMinutes = parseExamDurationMinutes(examDurationMinutesRaw, { required: true });
  }
  if (submissionDeadlineRaw !== undefined || deadlineRaw !== undefined || deadlineAtRaw !== undefined) {
    const parsedDeadline = parseSubmissionDeadline(
      submissionDeadlineRaw ?? deadlineRaw ?? deadlineAtRaw
    );
    if (parsedDeadline && isPastDate(parsedDeadline)) {
      const error = new Error('submissionDeadline must be a future date and time');
      error.statusCode = 400;
      throw error;
    }
    assessment.submissionDeadline = parsedDeadline || null;
  }

  if (nextPolicy.countsTowardRecommendation) {
    await assertUniqueGradingAssessment({
      teacherId: req.user._id,
      subjectId: assessment.subjectId,
      gradingPeriod: nextPolicy.gradingPeriod,
      excludeAssessmentId: assessment._id,
    });
  }

  assessment.assignedStudentIds = await resolveAssignedStudentIds({
    assignmentScope: nextPolicy.assignmentScope,
    teacherId: req.user._id,
    subjectId: assessment.subjectId,
    fallbackToAllHandledStudents: nextPolicy.assessmentMode === 'activity' && !lesson && !selectedClass,
  });
  assessment.lastModifiedBy = req.user._id;
  if (!assessment.publishedBy) assessment.publishedBy = req.user._id;

  await assessment.save();

  return sendSuccess(res, 200, 'Assessment updated successfully', { assessment });
});

const getAssessmentResultsSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assessment = await Assessment.findOne({ _id: id, createdBy: req.user._id })
    .populate('lessonId', 'title')
    .lean();

  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  const submissions = await Submission.find({ assessmentId: id })
    .populate('studentId', 'name email profileImage')
    .sort({ submittedAt: -1 })
    .lean();
  const dedupedSubmissions = uniqueBy(submissions, (submission) => String(submission?.studentId?._id || submission?.studentId || ''));

  const totalSubmissions = dedupedSubmissions.length;
  const averageScore = totalSubmissions
    ? dedupedSubmissions.reduce((sum, row) => sum + row.score, 0) / totalSubmissions
    : 0;

  return sendSuccess(res, 200, 'Assessment summary fetched successfully', {
    summary: {
      assessmentId: assessment._id,
      assessmentTitle: assessment.title,
      lessonTitle: assessment.lessonId?.title || '',
      totalSubmissions,
      averageScore: Number(averageScore.toFixed(2)),
      submissions: dedupedSubmissions,
    },
  });
});

const getTeacherStudents = asyncHandler(async (req, res) => {
  const subjectFilter = String(req.query.subjectId || '').trim();
  const subjects = await syncTeacherSubjects(req.user._id);
  const allowedSubjectIds = subjects
    .filter((subject) => !subjectFilter || String(subject._id) === subjectFilter)
    .map((subject) => subject._id);

  if (allowedSubjectIds.length === 0 && subjectFilter) {
    return sendSuccess(res, 200, 'Students fetched successfully', { students: [] });
  }

  const [approvedEnrollments, teacherAssessments] = await Promise.all([
    allowedSubjectIds.length > 0
      ? SubjectEnrollment.find({
        teacherId: req.user._id,
        subjectId: { $in: allowedSubjectIds },
        status: 'approved',
      })
        .populate('studentId', '_id name email status profileImage gradeLevel department sectionId archive')
        .populate('sectionId', 'name')
        .populate('subjectId', 'name className code track')
        .sort({ createdAt: -1 })
        .lean()
      : Promise.resolve([]),
    Assessment.find(buildTeacherAssessmentAccessQuery({
      teacherId: req.user._id,
      allowedSubjectIds,
      includeUnlinkedActivities: !subjectFilter,
    })).select('_id subjectId').lean(),
  ]);

  const students = uniqueBy(
    approvedEnrollments
    .map((row) => ({
      ...(row.studentId || {}),
      enrollmentSubject: row.subjectId || null,
    }))
    .filter((student) => student?._id && !isArchivedStudent(student)),
    (student) => String(student?._id || '')
  );

  const assessmentIds = teacherAssessments.map((assessment) => assessment._id);
  const totalChallenges = assessmentIds.length;
  const recommendationRows = students.length > 0
    ? await Recommendation.find({ studentId: { $in: students.map((student) => student._id) } })
      .select('studentId subjectPerformance strandScores recommendedStrand recommendationExplanation updatedAt')
      .lean()
    : [];
  const recommendationsByStudentId = new Map(
    recommendationRows.map((row) => [String(row.studentId), row])
  );

  const subjectsByStudentId = new Map();
  const sectionByStudentId = new Map();
  approvedEnrollments.forEach((row) => {
    const studentId = String(row?.studentId?._id || row?.studentId || '');
    if (!studentId) return;
    const items = subjectsByStudentId.get(studentId) || [];
    items.push({
      id: String(row?.subjectId?._id || ''),
      name: String(row?.subjectId?.name || '').trim(),
      className: String(row?.subjectId?.className || '').trim(),
      code: String(row?.subjectId?.code || '').trim(),
      track: String(row?.subjectId?.track || '').trim(),
      requestedAt: row?.requestedAt || null,
      approvedAt: row?.decidedAt || null,
    });
    subjectsByStudentId.set(studentId, items);

    if (!sectionByStudentId.has(studentId)) {
      sectionByStudentId.set(studentId, {
        id: String(row?.sectionId?._id || row?.sectionId || row?.studentId?.sectionId?._id || row?.studentId?.sectionId || '').trim(),
        name: String(row?.sectionId?.name || row?.studentId?.sectionId?.name || row?.sectionName || '').trim(),
      });
    }
  });

  const submissionStatsByStudent = new Map();
  if (assessmentIds.length > 0) {
    const submissions = await Submission.find({ assessmentId: { $in: assessmentIds } })
      .select('studentId assessmentId score totalPoints submittedAt')
      .sort({ submittedAt: -1 })
      .lean();

    const latestByStudentAndAssessment = new Map();
    for (const submission of submissions) {
      const studentId = String(submission.studentId);
      const assessmentId = String(submission.assessmentId);
      const key = `${studentId}:${assessmentId}`;
      if (!latestByStudentAndAssessment.has(key)) {
        latestByStudentAndAssessment.set(key, submission);
      }
    }

    for (const submission of latestByStudentAndAssessment.values()) {
      const studentId = String(submission.studentId);
      const current = submissionStatsByStudent.get(studentId) || [];
      current.push(submission);
      submissionStatsByStudent.set(studentId, current);
    }
  }

  const bulkProgressUpdates = [];
  const mappedStudents = uniqueBy(students, (student) => String(student?._id || '')).map((student) => {
    const id = String(student._id);
    const subjectsForStudent = subjectsByStudentId.get(id) || [];
    const sectionForStudent = sectionByStudentId.get(id) || null;
    const submissionsForStudent = submissionStatsByStudent.get(id) || [];
    const mastery = computeMasteryFromSubmissions(submissionsForStudent);
    const completedChallenges = mastery.completedAssessments;
    const progress = mastery.masteryProgress;
    const averageScore = mastery.averageScore;
    const recommendation = recommendationsByStudentId.get(id) || null;

    bulkProgressUpdates.push({
      updateOne: {
        filter: { _id: student._id },
        update: {
          $set: {
            'enrollment.progress.masteryProgress': mastery.masteryProgress,
            'enrollment.progress.averageScore': mastery.averageScore,
            'enrollment.progress.completedAssessments': mastery.completedAssessments,
            'enrollment.progress.lastCalculatedAt': mastery.lastCalculatedAt,
          },
        },
      },
    });

    return {
      id,
      name: student.name,
      email: student.email,
      status: student.status,
      enrollmentStatus: subjectsForStudent.length > 0
        ? 'approved'
        : String(student?.enrollment?.status || '').trim() || 'invited',
      requestedAt: subjectsForStudent[0]?.requestedAt || student?.createdAt || null,
      approvedAt: subjectsForStudent[0]?.approvedAt || student?.enrollment?.approvedAt || null,
      enrollmentTrack: subjectsForStudent[0]?.track || String(student?.enrollment?.track || '').trim(),
      subjects: subjectsForStudent,
      totalChallenges,
      completedChallenges,
      progress,
      averageScore,
      recommendation: recommendation
        ? {
          subjectPerformance: Array.isArray(recommendation.subjectPerformance) ? recommendation.subjectPerformance : [],
          strandScores: recommendation.strandScores || { STEM: 0, HUMSS: 0, ABM: 0, TVL: 0 },
          recommendedStrand: recommendation.recommendedStrand || { name: 'TVL', confidence: 'Low', generatedAt: null, topTwoStrands: [] },
          recommendationExplanation: recommendation.recommendationExplanation || '',
          updatedAt: recommendation.updatedAt || null,
        }
        : null,
      avatar: userProfileImageToUrl(student, req) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=334155&color=fff`,
      profileImage: userProfileImageToUrl(student, req),
      gradeLevel: String(student?.gradeLevel || '').trim(),
      sectionId: String(sectionForStudent?.id || student?.sectionId?._id || student?.sectionId || '').trim(),
      sectionName: String(sectionForStudent?.name || student?.sectionId?.name || '').trim(),
    };
  });

  if (bulkProgressUpdates.length > 0) {
    await User.bulkWrite(bulkProgressUpdates, { ordered: false });
  }

  return sendSuccess(res, 200, 'Students fetched successfully', {
    students: mappedStudents,
  });
});

const getTeacherStudentAssessmentResults = asyncHandler(async (req, res) => {
  const sortBy = String(req.query.sort || 'highest').trim().toLowerCase();
  const studentFilter = String(req.query.studentId || '').trim();
  const subjectFilter = String(req.query.subjectId || '').trim();
  const passFailFilter = String(req.query.passFail || '').trim().toLowerCase();

  const subjects = await syncTeacherSubjects(req.user._id);
  const allowedSubjectIds = subjects
    .filter((subject) => !subjectFilter || String(subject._id) === subjectFilter)
    .map((subject) => subject._id);
  if (allowedSubjectIds.length === 0) {
    return sendSuccess(res, 200, 'Student assessment results fetched successfully', { results: [] });
  }

  const approvedEnrollments = await SubjectEnrollment.find({
    teacherId: req.user._id,
    subjectId: { $in: allowedSubjectIds },
    status: 'approved',
  })
    .select('studentId subjectId')
    .lean();

  let classStudentIds = uniqueBy(
    approvedEnrollments.map((row) => row.studentId).filter(Boolean),
    (id) => String(id || '')
  );
  if (studentFilter) {
    classStudentIds = classStudentIds.filter((id) => String(id) === studentFilter);
  }
  if (classStudentIds.length > 0) {
    const eligibleStudents = await User.find({
      _id: { $in: classStudentIds },
      ...buildExcludeArchivedStudentsFilter(),
    })
      .select('_id')
      .lean();
    const eligibleStudentIds = new Set(eligibleStudents.map((student) => String(student?._id || '')));
    classStudentIds = classStudentIds.filter((id) => eligibleStudentIds.has(String(id)));
  }
  if (classStudentIds.length === 0) {
    return sendSuccess(res, 200, 'Student assessment results fetched successfully', { results: [] });
  }

  const teacherAssessments = await Assessment.find(buildTeacherAssessmentAccessQuery({
    teacherId: req.user._id,
    allowedSubjectIds,
    includeUnlinkedActivities: !subjectFilter,
  }))
    .select('_id title numberOfItems lessonId subjectId subjectCode subject assessmentMode gradingPeriod countsTowardRecommendation assignmentScope')
    .populate('lessonId', 'title track subject')
    .lean();

  const assessmentIds = teacherAssessments.map((assessment) => assessment._id);
  if (assessmentIds.length === 0) {
    return sendSuccess(res, 200, 'Student assessment results fetched successfully', { results: [] });
  }

  const assessmentsById = new Map(
    teacherAssessments.map((assessment) => [String(assessment._id), assessment])
  );

  const submissions = await Submission.find({
    studentId: { $in: classStudentIds },
    assessmentId: { $in: assessmentIds },
    status: { $in: ['completed', 'auto_submitted', 'terminated'] },
  })
    .populate('studentId', 'name email profileImage status enrollment')
    .sort({ submittedAt: -1 })
    .lean();

  let results = submissions.map((submission) => {
    const score = Number(submission?.score || 0);
    const totalPoints = Number(submission?.totalPoints || 0);
    const percentage = totalPoints > 0 ? Number(((score / totalPoints) * 100).toFixed(2)) : 0;
    const passFailStatus = percentage >= PASSING_PERCENTAGE ? 'pass' : 'fail';
    const assessment = assessmentsById.get(String(submission.assessmentId || '')) || {};
    const student = submission.studentId || {};
    const responseText = String(submission?.responseText || '').trim();
    const links = (Array.isArray(submission?.linkAttachments) ? submission.linkAttachments : [])
      .map((link, index) => ({
        id: String(link?._id || `link-${index + 1}`),
        url: String(link?.url || '').trim(),
        addedAt: link?.addedAt || null,
      }))
      .filter((link) => Boolean(link.url));
    const attachments = (Array.isArray(submission?.attachments) ? submission.attachments : [])
      .map((attachment) => toSubmissionAttachmentResponse(attachment, req))
      .filter((attachment) => Boolean(attachment.fileName));
    const teacherFeedback = String(submission?.teacherFeedback || '').trim();
    const isTeacherGraded = Boolean(submission?.gradedAt || submission?.gradeValue !== null || teacherFeedback);

    return {
      id: String(submission._id),
      studentId: String(student._id || ''),
      studentName: String(student.name || 'Student'),
      studentEmail: String(student.email || ''),
      studentAvatar: userProfileImageToUrl(student, req) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=334155&color=fff`,
      assessmentId: String(assessment._id || submission.assessmentId || ''),
      assessmentTitle: String(assessment.title || 'Assessment'),
      subjectId: String(assessment.subjectId || ''),
      subjectName: String(assessment.subject || assessment?.lessonId?.subject || ''),
      subjectCode: String(assessment.subjectCode || ''),
      lessonTitle: String(assessment?.lessonId?.title || ''),
      lessonTrack: getLessonTrack(assessment?.lessonId),
      assessmentMode: String(assessment.assessmentMode || 'activity'),
      activityPoints: Number.isInteger(Number(assessment.activityPoints)) && Number(assessment.activityPoints) >= 1
        ? Number(assessment.activityPoints)
        : null,
      gradingPeriod: String(assessment.gradingPeriod || ''),
      countsTowardRecommendation: Boolean(assessment.countsTowardRecommendation),
      assignmentScope: String(assessment.assignmentScope || 'handled_class'),
      score,
      totalItems: Number(assessment?.numberOfItems || 0),
      totalPoints,
      percentage,
      passFailStatus,
      status: String(submission.status || 'completed'),
      submittedAt: submission.submittedAt || submission.createdAt || null,
      responseText,
      links,
      attachments,
      gradedAt: submission?.gradedAt || null,
      gradeValue: submission?.gradeValue ?? null,
      teacherFeedback,
      isTeacherGraded,
    };
  });

  if (passFailFilter === 'pass' || passFailFilter === 'fail') {
    results = results.filter((result) => result.passFailStatus === passFailFilter);
  }

  if (sortBy === 'lowest') {
    results.sort((a, b) => a.score - b.score);
  } else if (sortBy === 'recent') {
    results.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  } else {
    results.sort((a, b) => b.score - a.score);
  }

  return sendSuccess(res, 200, 'Student assessment results fetched successfully', { results });
});

const getEnrollmentRequests = asyncHandler(async (req, res) => {
  const subjectFilter = String(req.query.subjectId || '').trim();
  const subjects = await syncTeacherSubjects(req.user._id);
  const allowedSubjectIds = subjects
    .filter((subject) => !subjectFilter || String(subject._id) === subjectFilter)
    .map((subject) => subject._id);

  const pendingRequests = await SubjectEnrollment.find({
    teacherId: req.user._id,
    subjectId: { $in: allowedSubjectIds },
    status: 'pending',
  })
    .populate('studentId', '_id name email status profileImage sectionId gradeLevel department')
    .populate('sectionId', 'name')
    .populate('subjectId', '_id name className code track')
    .sort({ requestedAt: -1 })
    .lean();

  const requests = uniqueBy(pendingRequests, (row) => String(row?._id || '')).map((row) => {
    const student = row.studentId || {};
    const subject = row.subjectId || {};
    return {
      id: String(row._id),
      studentId: String(student._id || ''),
      name: student.name,
      email: student.email,
      status: student.status,
      enrollmentStatus: row.status || 'pending',
      enrollmentTrack: String(subject.track || '').trim(),
      enrollmentTrackId: String(subject.track || '').trim(),
      requestedAt: row.requestedAt || null,
      sectionId: String(row?.sectionId?._id || row?.sectionId || student?.sectionId?._id || student?.sectionId || ''),
      sectionName: String(row?.sectionId?.name || student?.sectionId?.name || row?.sectionName || '').trim(),
      subjectId: String(subject._id || ''),
      subjectName: String(subject.name || '').trim(),
      className: String(subject.className || '').trim(),
      subjectCode: String(subject.code || '').trim(),
      avatar: userProfileImageToUrl(student, req) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=334155&color=fff`,
      profileImage: userProfileImageToUrl(student, req),
    };
  });

  return sendSuccess(res, 200, 'Enrollment requests fetched successfully', {
    requests,
  });
});

const getTeacherSubjectStudents = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const subject = await Subject.findOne({ _id: subjectId, teacherId: req.user._id }).lean();
  if (!subject) {
    const error = new Error('Subject not found');
    error.statusCode = 404;
    throw error;
  }

  const enrollments = await SubjectEnrollment.find({
    teacherId: req.user._id,
    subjectId,
    status: 'approved',
  })
    .populate('studentId', '_id name email status profileImage sectionId gradeLevel department archive')
    .populate('sectionId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const students = uniqueBy(enrollments, (row) => String(row?.studentId?._id || ''))
    .filter((row) => !isArchivedStudent(row?.studentId))
    .map((row) => {
      const student = row.studentId || {};
      return {
        id: String(student._id || ''),
        name: student.name || 'Student',
        email: student.email || '',
        status: student.status || 'active',
        avatar: userProfileImageToUrl(student, req) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=334155&color=fff`,
        sectionId: String(row?.sectionId?._id || row?.sectionId || student?.sectionId?._id || student?.sectionId || ''),
        sectionName: String(row?.sectionId?.name || student?.sectionId?.name || row?.sectionName || '').trim(),
        gradeLevel: String(student?.gradeLevel || '').trim(),
        subjectId: String(subject._id || ''),
        subjectName: String(subject.name || ''),
        subjectCode: String(subject.code || ''),
        track: String(subject.track || ''),
      };
    });

  return sendSuccess(res, 200, 'Subject students fetched successfully', {
    subject: subjectToResponse(subject),
    students,
  });
});

const removeTeacherSubjectStudent = asyncHandler(async (req, res) => {
  const { subjectId, studentId } = req.params;
  const subject = await Subject.findOne({ _id: subjectId, teacherId: req.user._id }).lean();
  if (!subject) {
    const error = new Error('Subject not found');
    error.statusCode = 404;
    throw error;
  }

  const enrollment = await SubjectEnrollment.findOne({
    teacherId: req.user._id,
    subjectId,
    studentId,
    status: 'approved',
  })
    .populate('studentId', '_id name email profileImage sectionId')
    .populate('sectionId', 'name');

  if (!enrollment) {
    const error = new Error('Approved student enrollment not found for this class');
    error.statusCode = 404;
    throw error;
  }

  const student = enrollment.studentId || {};

  await SubjectEnrollment.deleteOne({ _id: enrollment._id });
  await Assessment.updateMany(
    {
      createdBy: req.user._id,
      subjectId,
      assignmentScope: 'handled_class',
    },
    {
      $pull: { assignedStudentIds: student._id || studentId },
    }
  );

  return sendSuccess(res, 200, 'Student removed from class successfully', {
    subject: subjectToResponse(subject),
    student: {
      id: String(student._id || studentId || ''),
      name: String(student.name || '').trim(),
      email: String(student.email || '').trim(),
      sectionId: String(enrollment?.sectionId?._id || enrollment?.sectionId || student?.sectionId?._id || student?.sectionId || ''),
      sectionName: String(enrollment?.sectionId?.name || enrollment?.sectionName || '').trim(),
      profileImage: userProfileImageToUrl(student, req),
    },
  });
});

const approveEnrollmentRequest = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const requestRow = await SubjectEnrollment.findOne({
    _id: studentId,
    teacherId: req.user._id,
  })
    .populate('studentId', '_id name email profileImage sectionId')
    .populate('sectionId', 'name')
    .populate('subjectId', '_id name className code track');

  if (!requestRow) {
    const error = new Error('Enrollment request not found');
    error.statusCode = 404;
    throw error;
  }

  if (requestRow.status !== 'pending') {
    const error = new Error('Enrollment request is not pending');
    error.statusCode = 409;
    throw error;
  }

  requestRow.status = 'approved';
  requestRow.sectionId = requestRow.sectionId || requestRow?.studentId?.sectionId || undefined;
  requestRow.sectionName = String(requestRow?.sectionId?.name || requestRow.sectionName || '').trim();
  requestRow.decidedAt = new Date();
  await requestRow.save();

  const student = requestRow.studentId || {};
  const subject = requestRow.subjectId || {};

  return sendSuccess(res, 200, 'Enrollment request approved successfully', {
    student: {
      id: String(student._id || ''),
      name: student.name,
      email: student.email,
      sectionId: String(requestRow?.sectionId?._id || requestRow?.sectionId || student?.sectionId?._id || student?.sectionId || ''),
      sectionName: String(requestRow?.sectionId?.name || requestRow?.sectionName || '').trim(),
      enrollmentStatus: requestRow.status,
      enrollmentTrack: String(subject.track || '').trim(),
      enrollmentTrackId: String(subject.track || '').trim(),
      approvedAt: requestRow.decidedAt,
      subjectId: String(subject._id || ''),
      subjectName: String(subject.name || '').trim(),
      className: String(subject.className || '').trim(),
      subjectCode: String(subject.code || '').trim(),
      profileImage: userProfileImageToUrl(student, req),
    },
  });
});

const rejectEnrollmentRequest = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const requestRow = await SubjectEnrollment.findOne({
    _id: studentId,
    teacherId: req.user._id,
  })
    .populate('studentId', '_id name email profileImage sectionId')
    .populate('sectionId', 'name')
    .populate('subjectId', '_id name className code track');

  if (!requestRow) {
    const error = new Error('Enrollment request not found');
    error.statusCode = 404;
    throw error;
  }

  if (requestRow.status !== 'pending') {
    const error = new Error('Enrollment request is not pending');
    error.statusCode = 409;
    throw error;
  }

  requestRow.status = 'rejected';
  requestRow.decidedAt = new Date();
  await requestRow.save();

  const student = requestRow.studentId || {};
  const subject = requestRow.subjectId || {};

  return sendSuccess(res, 200, 'Enrollment request rejected successfully', {
    student: {
      id: String(student._id || ''),
      name: student.name,
      email: student.email,
      sectionId: String(requestRow?.sectionId?._id || requestRow?.sectionId || student?.sectionId?._id || student?.sectionId || ''),
      sectionName: String(requestRow?.sectionId?.name || requestRow?.sectionName || '').trim(),
      enrollmentStatus: requestRow.status,
      enrollmentTrack: String(subject.track || '').trim(),
      enrollmentTrackId: String(subject.track || '').trim(),
      subjectId: String(subject._id || ''),
      subjectName: String(subject.name || '').trim(),
      subjectCode: String(subject.code || '').trim(),
      profileImage: userProfileImageToUrl(student, req),
    },
  });
});

const getTeacherProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Profile fetched successfully', {
    user: teacherProfileResponse(req.user, req),
  });
});

const updateTeacherProfile = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || req.body?.fullName || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const contactNumberRaw = String(req.body?.contactNumber || req.body?.phone || '').trim();
  const strandRaw = String(req.body?.strand || '').trim().toUpperCase();
  const uploadedImage = req.file || null;

  console.log('[TEMP][updateTeacherProfile] incoming payload:', {
    userId: String(req.user?._id || ''),
    role: req.user?.role || '',
    name,
    email,
    contactNumberRaw,
    strandRaw,
    hasProfileImage: Boolean(uploadedImage),
    profileImageMeta: uploadedImage
      ? { originalname: uploadedImage.originalname, mimetype: uploadedImage.mimetype, size: uploadedImage.size, filename: uploadedImage.filename }
      : null,
  });

  if (!name) {
    const error = new Error('Name is required');
    error.statusCode = 400;
    throw error;
  }

  if (!email) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Please provide a valid email');
    error.statusCode = 400;
    throw error;
  }

  if (email !== String(req.user.email || '').toLowerCase()) {
    const existing = await User.findOne({ email, _id: { $ne: req.user._id } }).select('_id');
    if (existing) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  req.user.name = name;
  req.user.email = email;

  if (contactNumberRaw) {
    const normalizedContact = contactNumberRaw.replace(/\s+/g, ' ');
    if (normalizedContact.length > 30) {
      const error = new Error('Contact number must be 30 characters or fewer');
      error.statusCode = 400;
      throw error;
    }
    if (!CONTACT_NUMBER_REGEX.test(normalizedContact)) {
      const error = new Error('Contact number format is invalid');
      error.statusCode = 400;
      throw error;
    }
    req.user.contactNumber = normalizedContact;
  } else {
    req.user.contactNumber = '';
  }

  if (!ALLOWED_TEACHER_STRANDS.includes(strandRaw)) {
    const error = new Error(`Strand must be one of: ${ALLOWED_TEACHER_STRANDS.filter(Boolean).join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  req.user.strand = strandRaw;

  if (uploadedImage) {
    const uploadedProfile = await uploadFile({
      file: uploadedImage,
      folder: `profile-images/teachers/${String(req.user?._id || 'unknown')}`,
    });
    req.user.profileImage = uploadedProfile.storedPath;
  }

  await req.user.save();
  console.log('[TEMP][updateTeacherProfile] saved user snapshot:', {
    userId: String(req.user?._id || ''),
    name: req.user.name,
    email: req.user.email,
    strand: req.user.strand || '',
    subject: req.user.subject || '',
    contactNumber: req.user.contactNumber || '',
    profileImage: req.user.profileImage || '',
  });

  return sendSuccess(res, 200, 'Profile updated successfully', {
    user: teacherProfileResponse(req.user, req),
  });
});

const updateTeacherTourPreference = asyncHandler(async (req, res) => {
  req.user.hasCompletedTeacherTour = req.body?.hasCompletedTeacherTour === true;
  await req.user.save();

  return sendSuccess(res, 200, 'Dashboard tour preference updated successfully', {
    user: teacherProfileResponse(req.user, req),
  });
});

module.exports = {
  createTeacherClass,
  updateTeacherClass,
  deleteTeacherClass,
  createLesson,
  getTeacherLessons,
  getTeacherSubjects,
  getTeacherAssessments,
  downloadTeacherLessonPdf,
  downloadTeacherLessonAttachment,
  createAssessment,
  updateAssessmentQuestions,
  getAssessmentResultsSummary,
  getTeacherStudents,
  createStudentInvite,
  getTeacherSubjectStudents,
  removeTeacherSubjectStudent,
  getTeacherStudentAssessmentResults,
  getEnrollmentRequests,
  approveEnrollmentRequest,
  rejectEnrollmentRequest,
  getTeacherProfile,
  updateTeacherProfile,
  updateTeacherTourPreference,
};
