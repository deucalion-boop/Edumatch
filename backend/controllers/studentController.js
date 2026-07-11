const path = require('path');
const Lesson = require('../models/Lesson');
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const Subject = require('../models/Subject');
const SubjectEnrollment = require('../models/SubjectEnrollment');
const Section = require('../models/Section');
const User = require('../models/User');
const { sendSuccess } = require('../utils/responseHelper');
const { computeMasteryFromSubmissions, recalculateStudentMasteryProgress } = require('../utils/studentProgress');
const { formatRecommendationPayload, recomputeStudentRecommendation } = require('../services/recommendationService');
const { uploadFile } = require('../services/storageService');
const { resolveStoredFileUrl, downloadOrRedirectStoredFile } = require('../utils/fileStorage');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const CONTACT_NUMBER_REGEX = /^\+?[0-9()\-. ]{7,30}$/;
const ALLOWED_STUDENT_GRADE_LEVELS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const GRADE_TEN_LEVEL = 'Grade 10';
const PASSING_PERCENTAGE = 50;
const DEFAULT_MAX_VIOLATIONS = 3;
const DEFAULT_VIOLATION_ACTION = 'auto-submit';

function isAssessmentDeadlinePassed(assessment) {
  const deadline = assessment?.submissionDeadline ? new Date(assessment.submissionDeadline) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() <= Date.now();
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

function normalizeForCompare(value) {
  return String(value || '').trim().toLowerCase();
}

function parseExamDurationMinutes(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 300) return 30;
  return parsed;
}

function computeExamExpiry(submission) {
  const startedAt = submission?.startedAt ? new Date(submission.startedAt) : null;
  if (!startedAt || Number.isNaN(startedAt.getTime())) return null;
  const examDurationMinutes = parseExamDurationMinutes(submission?.examDurationMinutes);
  return new Date(startedAt.getTime() + (examDurationMinutes * 60 * 1000));
}

function isSubmissionExpired(submission) {
  const expiresAt = computeExamExpiry(submission);
  if (!expiresAt) return false;
  return expiresAt.getTime() <= Date.now();
}

function calculateAssessmentScore(assessment, answers) {
  const answerMap = new Map();
  (Array.isArray(answers) ? answers : []).forEach((item) => {
    if (item && Number.isInteger(item.questionIndex)) {
      answerMap.set(item.questionIndex, String(item.answer || ''));
    }
  });

  let score = 0;
  let totalPoints = 0;

  (Array.isArray(assessment?.questions) ? assessment.questions : []).forEach((question, index) => {
    const points = Number(question?.points || 1);
    totalPoints += points;

    const isObjectiveType = ['multiple-choice', 'true-false'].includes(question?.type);
    const hasAnswer = normalizeForCompare(question?.correctAnswer).length > 0;

    if (!isObjectiveType || !hasAnswer) return;

    const studentAnswer = normalizeForCompare(answerMap.get(index));
    const correctAnswer = normalizeForCompare(question.correctAnswer);
    if (studentAnswer && studentAnswer === correctAnswer) {
      score += points;
    }
  });

  return { score, totalPoints };
}

function publicAssessment(assessment) {
  const plain = assessment.toObject ? assessment.toObject() : assessment;
  return {
    ...plain,
    examDurationMinutes: parseExamDurationMinutes(plain.examDurationMinutes),
    maxViolations: Number(plain.maxViolations || DEFAULT_MAX_VIOLATIONS),
    violationAction: String(plain.violationAction || DEFAULT_VIOLATION_ACTION),
    assessmentMode: String(plain.assessmentMode || 'activity'),
    gradingPeriod: String(plain.gradingPeriod || ''),
    countsTowardRecommendation: Boolean(plain.countsTowardRecommendation),
    assignmentScope: String(plain.assignmentScope || 'handled_class'),
    questions: (plain.questions || []).map((q) => ({
      questionText: q.questionText,
      type: q.type,
      options: q.options,
      points: q.points,
      explanation: q.explanation,
    })),
  };
}

function userProfileImageToUrl(user, req) {
  const raw = String(user?.profileImage || '').trim();
  if (!raw) return '';
  return resolveStoredFileUrl(req, raw);
}

function studentProfileResponse(user, req) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    strand: user.strand || '',
    gradeLevel: user.gradeLevel || '',
    sectionId: String(user.sectionId || '').trim(),
    status: user.status || 'active',
    contactNumber: user.contactNumber || '',
    profileImage: userProfileImageToUrl(user, req),
    hasCompletedStudentTour: user.hasCompletedStudentTour === true,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function subjectResponse(subject, enrollment = null) {
  return {
    id: String(subject?._id || ''),
    name: String(subject?.name || '').trim(),
    className: String(subject?.className || '').trim(),
    code: String(subject?.code || '').trim(),
    track: String(subject?.track || '').trim(),
    subjectCategory: String(subject?.subjectCategory || '').trim(),
    department: String(subject?.department || '').trim(),
    description: String(subject?.description || '').trim(),
    teacherId: String(subject?.teacherId || '').trim(),
    enrollmentStatus: String(enrollment?.status || '').trim(),
    requestedAt: enrollment?.requestedAt || null,
    decidedAt: enrollment?.decidedAt || null,
    createdAt: subject?.createdAt || null,
  };
}

async function resolveStudentSectionContext(studentId, req) {
  const student = await User.findById(studentId)
    .select('sectionId')
    .populate('sectionId', 'name')
    .lean();

  const section = student?.sectionId
    ? {
      id: String(student.sectionId._id || ''),
      name: String(student.sectionId.name || '').trim(),
    }
    : null;

  if (!section?.id) {
    return {
      section: null,
      adviser: null,
    };
  }

  const adviser = await User.findOne({
    role: 'teacher',
    advisorySectionId: section.id,
  })
    .select('_id name email department subject profileImage')
    .lean();

  return {
    section,
    adviser: adviser
      ? {
        id: String(adviser._id || ''),
        name: String(adviser.name || '').trim(),
        email: String(adviser.email || '').trim(),
        department: String(adviser.department || '').trim(),
        subject: String(adviser.subject || adviser.department || '').trim(),
        profileImage: userProfileImageToUrl(adviser, req),
      }
      : null,
  };
}

function getLessonTrack(lesson) {
  return String(lesson?.track || '').trim();
}

function getAssessmentAssignedStudentIds(assessment) {
  return (Array.isArray(assessment?.assignedStudentIds) ? assessment.assignedStudentIds : [])
    .map((value) => String(value?._id || value || '').trim())
    .filter(Boolean);
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
    downloadUrl: `${host}/api/student/lessons/${lessonId}/attachments/${attachmentId}/download`,
    canPreviewInline: String(attachment?.mimeType || '').toLowerCase().startsWith('image/')
      || isPdfLikeAttachment(attachment),
  };
}

function isPreviewableSubmissionAttachment(attachment) {
  const mimeType = String(attachment?.mimeType || attachment?.mimetype || '').toLowerCase();
  return mimeType.startsWith('image/') || isPdfLikeAttachment(attachment);
}

function parseJsonArrayInput(value) {
  if (Array.isArray(value)) return value;
  const raw = String(value || '').trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function normalizeSubmissionLinks(value) {
  const seen = new Set();
  return parseJsonArrayInput(value).reduce((links, item) => {
    const rawUrl = typeof item === 'string'
      ? item
      : String(item?.url || '').trim();
    if (!rawUrl) return links;

    let normalizedUrl = '';
    try {
      normalizedUrl = new URL(rawUrl).toString();
    } catch (_error) {
      return links;
    }

    const key = normalizedUrl.toLowerCase();
    if (seen.has(key)) return links;
    seen.add(key);
    links.push({
      url: normalizedUrl,
      addedAt: new Date(),
    });
    return links;
  }, []);
}

function normalizeObjectIdArray(value) {
  return parseJsonArrayInput(value)
    .map((item) => String(item?._id || item || '').trim())
    .filter(Boolean);
}

function toStoredSubmissionAttachment(attachment) {
  return {
    _id: attachment?._id,
    originalName: String(attachment?.originalName || '').trim(),
    storedPath: String(attachment?.storedPath || '').trim(),
    mimeType: String(attachment?.mimeType || 'application/octet-stream').trim(),
    extension: String(attachment?.extension || '').trim().toLowerCase(),
    size: Number(attachment?.size || 0),
    uploadedAt: attachment?.uploadedAt || new Date(),
  };
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

function hasActivitySubmissionContent(submissionLike) {
  return Boolean(
    String(submissionLike?.responseText || '').trim()
    || (Array.isArray(submissionLike?.linkAttachments) && submissionLike.linkAttachments.length > 0)
    || (Array.isArray(submissionLike?.attachments) && submissionLike.attachments.length > 0)
  );
}

function toActivitySubmissionResponse(submission, req) {
  const assessment = submission?.assessmentId || {};
  const totalPoints = Number(submission?.totalPoints || 0);
  const score = Number(submission?.score || 0);
  const percentage = totalPoints > 0 ? Number(((score / totalPoints) * 100).toFixed(2)) : 0;

  return {
    id: String(submission?._id || ''),
    assessmentId: String(assessment?._id || submission?.assessmentId || '').trim(),
    assessmentTitle: String(assessment?.title || '').trim(),
    assessmentMode: String(assessment?.assessmentMode || 'activity').trim().toLowerCase(),
    lessonId: String(assessment?.lessonId || '').trim(),
    submissionDeadline: assessment?.submissionDeadline || null,
    status: String(submission?.status || 'in_progress').trim().toLowerCase(),
    responseText: String(submission?.responseText || '').trim(),
    links: (Array.isArray(submission?.linkAttachments) ? submission.linkAttachments : [])
      .map((link, index) => ({
        id: String(link?._id || `link-${index + 1}`),
        url: String(link?.url || '').trim(),
        addedAt: link?.addedAt || null,
      }))
      .filter((link) => Boolean(link.url)),
    attachments: (Array.isArray(submission?.attachments) ? submission.attachments : [])
      .map((attachment) => toSubmissionAttachmentResponse(attachment, req))
      .filter((attachment) => Boolean(attachment.fileName)),
    draftSavedAt: submission?.draftSavedAt || null,
    submittedAt: submission?.submittedAt || null,
    gradedAt: submission?.gradedAt || null,
    gradeValue: submission?.gradeValue ?? null,
    teacherFeedback: String(submission?.teacherFeedback || '').trim(),
    score,
    totalPoints,
    percentage,
    hasContent: hasActivitySubmissionContent(submission),
  };
}

async function findPublishedLessons() {
  return Lesson.find({})
    .populate('subjectId', 'name className code track')
    .populate('createdBy', 'name email role strand profileImage')
    .sort({ createdAt: -1 });
}

async function getStudentApprovedEnrollments(studentId) {
  return SubjectEnrollment.find({
    studentId,
    status: 'approved',
  })
    .populate('subjectId', 'name code track subjectCategory teacherId')
    .sort({ createdAt: -1 })
    .lean();
}

async function getStudentApprovedSubjectIds(studentId) {
  const rows = await getStudentApprovedEnrollments(studentId);
  return rows
    .map((row) => row?.subjectId?._id || null)
    .filter(Boolean);
}

async function assertStudentAssessmentAccess(studentId, assessmentId) {
  const assessment = await Assessment.findById(assessmentId).populate('lessonId', 'title track subject subjectId subjectCode');
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  const assignedStudentIds = getAssessmentAssignedStudentIds(assessment);
  if (assignedStudentIds.length > 0) {
    if (assignedStudentIds.includes(String(studentId || ''))) {
      return assessment;
    }
    const error = new Error('This assessment is not assigned to you');
    error.statusCode = 403;
    throw error;
  }

  const effectiveSubjectId = assessment.subjectId || assessment?.lessonId?.subjectId || null;
  if (!effectiveSubjectId) {
    const error = new Error('Assessment is not linked to an enrollable subject');
    error.statusCode = 403;
    throw error;
  }

  const enrollment = await SubjectEnrollment.findOne({
    studentId,
    subjectId: effectiveSubjectId,
    status: 'approved',
  }).select('_id status').lean();

  if (!enrollment) {
    const error = new Error('You must be enrolled in this subject before accessing its assessments');
    error.statusCode = 403;
    throw error;
  }

  return assessment;
}

async function assertStudentActivityAssessmentAccess(studentId, assessmentId) {
  const assessment = await assertStudentAssessmentAccess(studentId, assessmentId);
  if (String(assessment?.assessmentMode || 'activity').trim().toLowerCase() !== 'activity') {
    const error = new Error('This response workspace is only available for activity-type tasks');
    error.statusCode = 400;
    throw error;
  }
  return assessment;
}

async function uploadStudentSubmissionAttachments(files, studentId, assessmentId) {
  const normalizedFiles = uniqueBy(
    Array.isArray(files) ? files : [],
    (file) => `${String(file?.originalname || '').trim().toLowerCase()}:${String(file?.mimetype || '').trim().toLowerCase()}:${Number(file?.size || 0)}`
  );

  if (normalizedFiles.length === 0) return [];

  const uploads = await Promise.all(normalizedFiles.map((file) => uploadFile({
    file,
    folder: `student-submissions/${String(studentId || 'unknown')}/${String(assessmentId || 'unknown')}`,
  })));

  return uploads.map((file) => ({
    originalName: file.originalName,
    storedPath: file.storedPath,
    mimeType: file.mimeType,
    extension: file.extension,
    size: file.size,
    uploadedAt: file.uploadedAt,
  }));
}

async function saveActivitySubmissionState({ req, assessment, finalize = false }) {
  const now = new Date();
  const responseText = String(req.body?.responseText || req.body?.answerText || '').trim();
  const linkAttachments = normalizeSubmissionLinks(req.body?.links);
  const retainedAttachmentIds = normalizeObjectIdArray(req.body?.retainedAttachmentIds);
  const hasRetainedAttachmentIds = Object.prototype.hasOwnProperty.call(req.body || {}, 'retainedAttachmentIds');
  const uploadedFiles = Array.isArray(req.files?.attachments) ? req.files.attachments : [];

  let submission = await Submission.findOne({
    studentId: req.user._id,
    assessmentId: assessment._id,
  });

  const currentStatus = String(submission?.status || '').trim().toLowerCase();
  if (submission && ['auto_submitted', 'terminated'].includes(currentStatus)) {
    const error = new Error('This activity can no longer be edited.');
    error.statusCode = 403;
    throw error;
  }

  if (submission && currentStatus === 'completed') {
    const error = new Error(finalize
      ? 'Activity already submitted.'
      : 'Activity already submitted. Unsubmit it first before editing.');
    error.statusCode = 409;
    throw error;
  }

  if (isAssessmentDeadlinePassed(assessment)) {
    const error = new Error('Deadline has passed. Submission is closed.');
    error.statusCode = 403;
    error.details = {
      submissionDeadline: assessment.submissionDeadline || null,
    };
    throw error;
  }

  if (!submission) {
    submission = new Submission({
      studentId: req.user._id,
      assessmentId: assessment._id,
      status: 'in_progress',
      score: 0,
      totalPoints: 0,
      submittedAt: null,
      startedAt: null,
      lastActivityAt: now,
      examDurationMinutes: parseExamDurationMinutes(assessment.examDurationMinutes),
    });
  }

  const existingAttachments = Array.isArray(submission.attachments) ? submission.attachments : [];
  const keptAttachments = hasRetainedAttachmentIds
    ? existingAttachments.filter((attachment) => retainedAttachmentIds.includes(String(attachment?._id || '')))
    : existingAttachments;
  const uploadedAttachments = await uploadStudentSubmissionAttachments(uploadedFiles, req.user._id, assessment._id);
  const nextAttachments = [
    ...keptAttachments.map((attachment) => toStoredSubmissionAttachment(attachment)),
    ...uploadedAttachments,
  ];

  if (finalize && !hasActivitySubmissionContent({
    responseText,
    linkAttachments,
    attachments: nextAttachments,
  })) {
    const error = new Error('Add a response, link, or file before turning in this activity.');
    error.statusCode = 400;
    throw error;
  }

  submission.responseText = responseText;
  submission.linkAttachments = linkAttachments;
  submission.attachments = nextAttachments;
  submission.lastActivityAt = now;
  submission.draftSavedAt = now;
  submission.status = finalize ? 'completed' : 'in_progress';
  submission.submittedAt = finalize ? now : null;
  submission.autoSubmitted = false;
  submission.terminationReason = '';
  submission.activityLog = [
    ...(Array.isArray(submission.activityLog) ? submission.activityLog : []),
    {
      type: finalize ? 'manual_submit' : 'draft_saved',
      message: finalize ? 'Activity submitted by student.' : 'Activity draft saved by student.',
      metadata: {
        responseLength: responseText.length,
        linkCount: linkAttachments.length,
        attachmentCount: nextAttachments.length,
      },
      occurredAt: now,
    },
  ];

  await submission.save();
  await submission.populate('assessmentId', 'title assessmentMode lessonId submissionDeadline');
  return submission;
}

function assertGradeTenStudentAccess(req) {
  const role = String(req.user?.role || '').toLowerCase().trim();
  const gradeLevel = String(req.user?.gradeLevel || '').trim();
  if (role === 'student' && gradeLevel !== GRADE_TEN_LEVEL) {
    const error = new Error('This feature is available for Grade 10 students only');
    error.statusCode = 403;
    throw error;
  }
}

const getStudentLessons = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const approvedSubjectIds = await getStudentApprovedSubjectIds(req.user._id);
  if (approvedSubjectIds.length === 0) {
    return sendSuccess(res, 200, 'Lessons fetched successfully', { lessons: [] });
  }
  const lessons = await findPublishedLessons();
  const dedupedLessons = uniqueBy(
    lessons.filter((lesson) => {
      const lessonSubjectId = String(lesson?.subjectId?._id || lesson?.subjectId || '').trim();
      return approvedSubjectIds.some((subjectId) => String(subjectId) === lessonSubjectId);
    }),
    (lesson) => String(lesson?._id || '')
  );

  const host = `${req.protocol}://${req.get('host')}`;

  return sendSuccess(res, 200, 'Lessons fetched successfully', {
    lessons: dedupedLessons.map((lesson) => {
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
      teacher: lesson.createdBy
        ? {
          id: lesson.createdBy._id,
          name: lesson.createdBy.name,
          email: lesson.createdBy.email,
          role: lesson.createdBy.role,
          strand: lesson.createdBy.strand || '',
          profileImage: userProfileImageToUrl(lesson.createdBy, req),
        }
        : null,
      pdfOriginalName: primaryAttachment?.originalName || lesson.pdfOriginalName,
      pdfPath: resolveStoredFileUrl(req, primaryAttachment?.storedPath || lesson.pdfPath, {
        fileName: primaryAttachment?.originalName || lesson.pdfOriginalName || '',
      }),
      attachments: attachments.map((attachment) => toAttachmentResponse(attachment, lesson._id, req)),
      downloadUrl: `${host}/api/student/lessons/${lesson._id}/download`,
      postedAt: lesson.createdAt,
      createdAt: lesson.createdAt,
    };
    }),
  });
});

const getStudentTeachers = asyncHandler(async (_req, res) => {
  const teachers = await User.find({ role: 'teacher', status: 'active' })
    .select('_id name email role strand profileImage')
    .sort({ name: 1 })
    .lean();
  const dedupedTeachers = uniqueBy(teachers, (teacher) => String(teacher?._id || ''));

  return sendSuccess(res, 200, 'Teachers fetched successfully', {
    teachers: dedupedTeachers.map((teacher) => {
      const id = String(teacher._id);
      const fixedTrack = String(teacher.strand || '').trim();
      const tracks = fixedTrack ? [fixedTrack] : [];
      return {
        id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        strand: teacher.strand || '',
        profileImage: userProfileImageToUrl(teacher, _req),
        tracks,
        subjects: tracks,
      };
    }),
  });
});

const downloadStudentLessonPdf = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    const error = new Error('Lesson not found');
    error.statusCode = 404;
    throw error;
  }

  const enrollment = await SubjectEnrollment.findOne({
    studentId: req.user._id,
    subjectId: lesson.subjectId,
    status: 'approved',
  }).select('_id').lean();
  if (!enrollment) {
    const error = new Error('You must be enrolled in this subject before downloading lessons');
    error.statusCode = 403;
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

const downloadStudentLessonAttachment = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    const error = new Error('Lesson not found');
    error.statusCode = 404;
    throw error;
  }

  const enrollment = await SubjectEnrollment.findOne({
    studentId: req.user._id,
    subjectId: lesson.subjectId,
    status: 'approved',
  }).select('_id').lean();
  if (!enrollment) {
    const error = new Error('You must be enrolled in this subject before downloading attachments');
    error.statusCode = 403;
    throw error;
  }

  const attachments = normalizeLessonAttachments(lesson);
  const attachment = attachments.find((item) => String(item?._id || '') === String(req.params.attachmentId || ''));
  if (!attachment) {
    const error = new Error('Attachment not found');
    error.statusCode = 404;
    throw error;
  }

  return downloadOrRedirectStoredFile(req, res, attachment.storedPath, attachment.originalName);
});

const getAvailableAssessments = asyncHandler(async (_req, res) => {
  assertGradeTenStudentAccess(_req);
  const approvedSubjectIds = await getStudentApprovedSubjectIds(_req.user._id);
  const lessons = (await findPublishedLessons())
    .filter((lesson) => {
      const lessonSubjectId = String(lesson?.subjectId?._id || lesson?.subjectId || '').trim();
      return approvedSubjectIds.some((subjectId) => String(subjectId) === lessonSubjectId);
    })
    .map((lesson) => ({
      _id: lesson._id,
      track: lesson.track,
    }));

  const lessonIds = lessons.map((lesson) => lesson._id);
  const assessments = await Assessment.find({
    $or: [
      ...(lessonIds.length > 0 ? [{ lessonId: { $in: lessonIds } }] : []),
      { assignedStudentIds: _req.user._id },
    ],
  })
    .populate('lessonId', 'title track subject subjectId subjectCode')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  const dedupedAssessments = uniqueBy(assessments, (item) => String(item?._id || ''));
  const filteredAssessments = dedupedAssessments.filter((item) => {
    const assignedStudentIds = getAssessmentAssignedStudentIds(item);
    if (assignedStudentIds.length > 0) {
      return assignedStudentIds.includes(String(_req.user._id || ''));
    }
    const effectiveSubjectId = String(item?.subjectId || item?.lessonId?.subjectId || '').trim();
    return approvedSubjectIds.some((subjectId) => String(subjectId) === effectiveSubjectId);
  });

  return sendSuccess(res, 200, 'Assessments fetched successfully', {
    assessments: filteredAssessments.map((item) => ({
      id: item._id,
      lessonId: item.lessonId?._id,
      lessonTitle: item.lessonId?.title,
      track: getLessonTrack(item.lessonId),
      subject: String(item.subject || item.lessonId?.subject || '').trim(),
      subjectId: String(item.subjectId || item.lessonId?.subjectId || '').trim(),
      subjectCode: String(item.subjectCode || item.lessonId?.subjectCode || '').trim(),
      lessonSubject: String(item.lessonId?.subject || '').trim(),
      title: item.title,
      examType: item.examType,
      subjectCategory: item.subjectCategory || 'Technical',
      difficulty: item.difficulty,
      numberOfItems: item.numberOfItems,
      activityPoints: Number.isInteger(Number(item.activityPoints)) && Number(item.activityPoints) >= 1
        ? Number(item.activityPoints)
        : null,
      assessmentMode: String(item.assessmentMode || 'activity'),
      gradingPeriod: String(item.gradingPeriod || ''),
      countsTowardRecommendation: Boolean(item.countsTowardRecommendation),
      assignmentScope: String(item.assignmentScope || 'handled_class'),
      examDurationMinutes: parseExamDurationMinutes(item.examDurationMinutes),
      maxViolations: Number(item.maxViolations || DEFAULT_MAX_VIOLATIONS),
      violationAction: String(item.violationAction || DEFAULT_VIOLATION_ACTION),
      submissionDeadline: item.submissionDeadline || null,
      challengeDescription: String(item.challengeDescription || '').trim(),
      attachments: normalizeAssessmentAttachments(item).map((attachment) => toAssessmentAttachmentResponse(attachment, _req)),
      isDeadlinePassed: isAssessmentDeadlinePassed(item),
      createdBy: item.createdBy,
      createdAt: item.createdAt,
    })),
  });
});

const getAssessmentForExam = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const assessment = await assertStudentAssessmentAccess(req.user._id, req.params.id);
  const existingSubmission = await Submission.findOne({
    studentId: req.user._id,
    assessmentId: assessment._id,
  })
    .select('_id submittedAt score totalPoints status startedAt examDurationMinutes violationCount autoSubmitted terminationReason')
    .lean();

  const existingStatus = String(existingSubmission?.status || '').toLowerCase();
  const isFinalized = ['completed', 'auto_submitted', 'terminated'].includes(existingStatus);
  if (existingSubmission && isFinalized) {
    const percentage = Number(existingSubmission.totalPoints || 0) > 0
      ? Number(((Number(existingSubmission.score || 0) / Number(existingSubmission.totalPoints || 0)) * 100).toFixed(2))
      : 0;
    const error = new Error(`Assessment already submitted on ${new Date(existingSubmission.submittedAt).toISOString()}. Retake is not allowed.`);
    error.statusCode = 409;
    error.details = {
      submissionId: String(existingSubmission._id || ''),
      submittedAt: existingSubmission.submittedAt || null,
      score: Number(existingSubmission.score || 0),
      totalPoints: Number(existingSubmission.totalPoints || 0),
      percentage,
      status: existingSubmission.status || 'completed',
    };
    throw error;
  }
  if (isAssessmentDeadlinePassed(assessment)) {
    const error = new Error('Deadline has passed. Submission is closed.');
    error.statusCode = 403;
    error.details = {
      submissionDeadline: assessment.submissionDeadline || null,
    };
    throw error;
  }

  return sendSuccess(res, 200, 'Assessment fetched successfully', {
    assessment: publicAssessment(assessment),
    session: existingSubmission && existingStatus === 'in_progress'
      ? {
        status: 'in_progress',
        startedAt: existingSubmission.startedAt || null,
        examDurationMinutes: parseExamDurationMinutes(existingSubmission.examDurationMinutes || assessment.examDurationMinutes),
        violationCount: Number(existingSubmission.violationCount || 0),
      }
      : null,
    serverTime: new Date().toISOString(),
  });
});

async function finalizeSubmission({
  submission,
  assessment,
  answers,
  status,
  autoSubmitted = false,
  terminationReason = '',
  appendActivity = null,
}) {
  const normalizedAnswers = Array.isArray(answers) ? answers : [];
  const { score, totalPoints } = calculateAssessmentScore(assessment, normalizedAnswers);
  const now = new Date();

  submission.answers = normalizedAnswers;
  submission.score = score;
  submission.totalPoints = totalPoints;
  submission.submittedAt = now;
  submission.lastActivityAt = now;
  submission.status = status;
  submission.autoSubmitted = Boolean(autoSubmitted);
  submission.terminationReason = String(terminationReason || '').trim();
  submission.examDurationMinutes = parseExamDurationMinutes(
    submission.examDurationMinutes || assessment.examDurationMinutes
  );
  if (appendActivity && typeof appendActivity === 'object') {
    submission.activityLog = [
      ...(Array.isArray(submission.activityLog) ? submission.activityLog : []),
      {
        type: String(appendActivity.type || 'system_event'),
        message: String(appendActivity.message || 'Exam status updated by system'),
        metadata: appendActivity.metadata || {},
        occurredAt: now,
      },
    ];
  }
  await submission.save();

  const percentage = totalPoints > 0 ? Number(((score / totalPoints) * 100).toFixed(2)) : 0;
  const totalItems = Array.isArray(assessment.questions)
    ? assessment.questions.length
    : Number(assessment.numberOfItems || 0);
  const masteryProgress = await recalculateStudentMasteryProgress(submission.studentId);
  let recommendationSummary = null;
  try {
    const reasonByStatus = {
      completed: 'New assessment completed',
      auto_submitted: 'Assessment auto-submitted',
      terminated: 'Assessment terminated',
    };
    const recommendation = await recomputeStudentRecommendation({
      studentId: submission.studentId,
      reason: reasonByStatus[String(status || '').toLowerCase()] || 'Assessment result saved',
    });
    recommendationSummary = formatRecommendationPayload(recommendation);
  } catch (recommendationError) {
    console.error('[RECOMMENDATION] recompute failed:', {
      studentId: String(submission.studentId || ''),
      assessmentId: String(submission.assessmentId || ''),
      status: String(status || ''),
      message: recommendationError?.message || 'Unknown recommendation error',
    });
  }

  return {
    submission,
    summary: {
      id: submission._id,
      studentId: submission.studentId,
      assessmentId: submission.assessmentId,
      score,
      totalPoints,
      totalItems,
      percentage,
      status: submission.status || 'completed',
      passFailStatus: percentage >= PASSING_PERCENTAGE ? 'pass' : 'fail',
      submittedAt: submission.submittedAt,
      autoSubmitted: Boolean(submission.autoSubmitted),
      violationCount: Number(submission.violationCount || 0),
      terminationReason: submission.terminationReason || '',
    },
    masteryProgress,
    recommendation: recommendationSummary,
  };
}

const startAssessmentSession = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const { id } = req.params;
  const assessment = await assertStudentAssessmentAccess(req.user._id, id);
  if (isAssessmentDeadlinePassed(assessment)) {
    const error = new Error('Deadline has passed. Submission is closed.');
    error.statusCode = 403;
    throw error;
  }

  let submission = await Submission.findOne({
    studentId: req.user._id,
    assessmentId: assessment._id,
  });
  const currentStatus = String(submission?.status || '').toLowerCase();

  if (submission && ['completed', 'auto_submitted', 'terminated'].includes(currentStatus)) {
    const error = new Error('Assessment already submitted. Retake is not allowed.');
    error.statusCode = 409;
    throw error;
  }

  if (submission && currentStatus === 'in_progress' && isSubmissionExpired(submission)) {
    const finalized = await finalizeSubmission({
      submission,
      assessment,
      answers: submission.answers || [],
      status: 'auto_submitted',
      autoSubmitted: true,
      terminationReason: 'timer_expired',
      appendActivity: {
        type: 'timer_expired',
        message: 'Exam timer expired. Exam auto-submitted.',
      },
    });
    return sendSuccess(res, 200, 'Existing session expired and was auto-submitted', {
      assessment: publicAssessment(assessment),
      session: null,
      submission: finalized.summary,
      masteryProgress: finalized.masteryProgress,
      recommendation: finalized.recommendation,
      serverTime: new Date().toISOString(),
    });
  }

  if (!submission) {
    submission = await Submission.create({
      studentId: req.user._id,
      assessmentId: assessment._id,
      answers: [],
      score: 0,
      totalPoints: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      examDurationMinutes: parseExamDurationMinutes(assessment.examDurationMinutes),
      violationCount: 0,
      activityLog: [{
        type: 'session_started',
        message: 'Exam session started.',
        metadata: {},
        occurredAt: new Date(),
      }],
      status: 'in_progress',
      autoSubmitted: false,
      terminationReason: '',
    });
  } else {
    submission.lastActivityAt = new Date();
    await submission.save();
  }

  const expiresAt = computeExamExpiry(submission);
  const remainingMs = Math.max(0, Number(expiresAt ? expiresAt.getTime() - Date.now() : 0));

  return sendSuccess(res, 200, 'Exam session started', {
    assessment: publicAssessment(assessment),
    session: {
      id: String(submission._id || ''),
      status: submission.status,
      startedAt: submission.startedAt,
      expiresAt,
      remainingSeconds: Math.floor(remainingMs / 1000),
      examDurationMinutes: parseExamDurationMinutes(submission.examDurationMinutes),
      violationCount: Number(submission.violationCount || 0),
      maxViolations: Number(assessment.maxViolations || DEFAULT_MAX_VIOLATIONS),
      violationAction: String(assessment.violationAction || DEFAULT_VIOLATION_ACTION),
      answers: Array.isArray(submission.answers) ? submission.answers : [],
    },
    serverTime: new Date().toISOString(),
  });
});

const saveAssessmentProgress = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const { id } = req.params;
  const { answers } = req.body;
  if (!Array.isArray(answers)) {
    const error = new Error('answers must be an array');
    error.statusCode = 400;
    throw error;
  }

  const assessment = await assertStudentAssessmentAccess(req.user._id, id);

  const submission = await Submission.findOne({
    studentId: req.user._id,
    assessmentId: assessment._id,
  });
  if (!submission || String(submission.status || '').toLowerCase() !== 'in_progress') {
    const error = new Error('Exam session is not active');
    error.statusCode = 403;
    throw error;
  }

  if (isSubmissionExpired(submission)) {
    const finalized = await finalizeSubmission({
      submission,
      assessment,
      answers: submission.answers || [],
      status: 'auto_submitted',
      autoSubmitted: true,
      terminationReason: 'timer_expired',
      appendActivity: {
        type: 'timer_expired',
        message: 'Exam timer expired. Exam auto-submitted.',
      },
    });
    const error = new Error('Exam timer has expired. Submission was auto-submitted.');
    error.statusCode = 409;
    error.details = { submission: finalized.summary };
    throw error;
  }

  submission.answers = answers;
  submission.lastActivityAt = new Date();
  await submission.save();

  const expiresAt = computeExamExpiry(submission);
  const remainingMs = Math.max(0, Number(expiresAt ? expiresAt.getTime() - Date.now() : 0));

  return sendSuccess(res, 200, 'Exam progress saved', {
    session: {
      id: String(submission._id || ''),
      status: submission.status,
      startedAt: submission.startedAt,
      expiresAt,
      remainingSeconds: Math.floor(remainingMs / 1000),
      violationCount: Number(submission.violationCount || 0),
      answersSaved: Number(Array.isArray(submission.answers) ? submission.answers.length : 0),
      savedAt: submission.lastActivityAt,
    },
    serverTime: new Date().toISOString(),
  });
});

const logAssessmentActivity = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const { id } = req.params;
  const { type, message, metadata } = req.body || {};
  const normalizedType = String(type || '').trim().toLowerCase();
  if (!normalizedType) {
    const error = new Error('type is required');
    error.statusCode = 400;
    throw error;
  }

  const assessment = await assertStudentAssessmentAccess(req.user._id, id);

  const submission = await Submission.findOne({
    studentId: req.user._id,
    assessmentId: assessment._id,
  });
  if (!submission || String(submission.status || '').toLowerCase() !== 'in_progress') {
    const error = new Error('Exam session is not active');
    error.statusCode = 403;
    throw error;
  }

  const violationTypes = new Set([
    'tab_hidden',
    'window_blur',
    'fullscreen_exit',
    'navigation_attempt',
    'inspection_shortcut',
    'copy_attempt',
    'paste_attempt',
    'contextmenu_attempt',
  ]);
  const isViolation = violationTypes.has(normalizedType);
  const now = new Date();
  const normalizedMessage = String(message || '').trim()
    || `${normalizedType.replace(/_/g, ' ')} detected at ${now.toLocaleTimeString()}`;

  submission.activityLog = [
    ...(Array.isArray(submission.activityLog) ? submission.activityLog : []),
    {
      type: normalizedType,
      message: normalizedMessage,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      occurredAt: now,
    },
  ];
  if (isViolation) {
    submission.violationCount = Number(submission.violationCount || 0) + 1;
  }
  submission.lastActivityAt = now;

  const maxViolations = Number(assessment.maxViolations || DEFAULT_MAX_VIOLATIONS);
  const violationAction = String(assessment.violationAction || DEFAULT_VIOLATION_ACTION);
  const reachedLimit = isViolation && Number(submission.violationCount || 0) >= maxViolations;

  if (reachedLimit && violationAction === 'auto-submit') {
    const finalized = await finalizeSubmission({
      submission,
      assessment,
      answers: submission.answers || [],
      status: 'auto_submitted',
      autoSubmitted: true,
      terminationReason: 'max_violations',
      appendActivity: {
        type: 'max_violations_auto_submit',
        message: 'Maximum violations reached. Exam auto-submitted.',
      },
    });
    return sendSuccess(res, 200, 'Violation logged and exam auto-submitted', {
      ruleTriggered: true,
      violationCount: Number(finalized.submission.violationCount || 0),
      actionTaken: 'auto-submit',
      submission: finalized.summary,
      masteryProgress: finalized.masteryProgress,
      recommendation: finalized.recommendation,
      serverTime: new Date().toISOString(),
    });
  }

  if (reachedLimit && violationAction === 'terminate') {
    const finalized = await finalizeSubmission({
      submission,
      assessment,
      answers: submission.answers || [],
      status: 'terminated',
      autoSubmitted: false,
      terminationReason: 'max_violations',
      appendActivity: {
        type: 'max_violations_terminated',
        message: 'Maximum violations reached. Exam terminated.',
      },
    });
    return sendSuccess(res, 200, 'Violation logged and exam terminated', {
      ruleTriggered: true,
      violationCount: Number(finalized.submission.violationCount || 0),
      actionTaken: 'terminate',
      submission: finalized.summary,
      masteryProgress: finalized.masteryProgress,
      recommendation: finalized.recommendation,
      serverTime: new Date().toISOString(),
    });
  }

  if (reachedLimit && violationAction === 'pause') {
    await submission.save();
    return sendSuccess(res, 200, 'Violation logged and exam paused', {
      ruleTriggered: true,
      violationCount: Number(submission.violationCount || 0),
      actionTaken: 'pause',
      pauseSeconds: 15,
      maxViolations,
      violationAction,
      serverTime: new Date().toISOString(),
    });
  }

  await submission.save();

  return sendSuccess(res, 200, 'Exam activity logged', {
    ruleTriggered: false,
    violationCount: Number(submission.violationCount || 0),
    maxViolations,
    violationAction,
    serverTime: new Date().toISOString(),
  });
});

const submitAssessment = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const { id } = req.params;
  const { answers } = req.body;
  console.log('[submitAssessment] request body:', req.body);

  if (!Array.isArray(answers)) {
    const error = new Error('answers must be an array');
    error.statusCode = 400;
    throw error;
  }

  const assessment = await assertStudentAssessmentAccess(req.user._id, id);
  const existingSubmission = await Submission.findOne({
    studentId: req.user._id,
    assessmentId: assessment._id,
  });
  const existingStatus = String(existingSubmission?.status || '').toLowerCase();

  if (!existingSubmission || existingStatus !== 'in_progress') {
    if (['completed', 'auto_submitted', 'terminated'].includes(existingStatus)) {
      const error = new Error('Assessment already submitted. Retake is not allowed.');
      error.statusCode = 409;
      throw error;
    }
    const error = new Error('Exam session not started');
    error.statusCode = 403;
    throw error;
  }
  if (isAssessmentDeadlinePassed(assessment)) {
    const error = new Error('Deadline has passed. Submission is closed.');
    error.statusCode = 403;
    error.details = {
      submissionDeadline: assessment.submissionDeadline || null,
    };
    throw error;
  }

  if (isSubmissionExpired(existingSubmission)) {
    const finalized = await finalizeSubmission({
      submission: existingSubmission,
      assessment,
      answers: existingSubmission.answers || [],
      status: 'auto_submitted',
      autoSubmitted: true,
      terminationReason: 'timer_expired',
      appendActivity: {
        type: 'timer_expired',
        message: 'Exam timer expired. Exam auto-submitted.',
      },
    });
    return sendSuccess(res, 200, 'Exam timer expired. Auto-submitted.', {
      submission: finalized.summary,
      masteryProgress: finalized.masteryProgress,
      recommendation: finalized.recommendation,
    });
  }

  const finalized = await finalizeSubmission({
    submission: existingSubmission,
    assessment,
    answers,
    status: 'completed',
    autoSubmitted: false,
    terminationReason: '',
    appendActivity: {
      type: 'manual_submit',
      message: 'Exam submitted by student.',
    },
  });

  return sendSuccess(res, 201, 'Exam submitted successfully', {
    submission: finalized.summary,
    masteryProgress: finalized.masteryProgress,
    recommendation: finalized.recommendation,
  });
});

const getMySubmissions = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const submissions = await Submission.find({
    studentId: req.user._id,
    status: { $in: ['completed', 'auto_submitted', 'terminated'] },
  })
    .populate('assessmentId', 'title examType difficulty numberOfItems questions assessmentMode')
    .sort({ submittedAt: -1 });
  const dedupedSubmissions = uniqueBy(
    submissions,
    (submission) => `${String(submission?.studentId || '')}:${String(submission?.assessmentId?._id || submission?.assessmentId || '')}`
  );
  const scoredSubmissions = dedupedSubmissions.filter((submission) => {
    const assessmentMode = String(submission?.assessmentId?.assessmentMode || '').trim().toLowerCase();
    return assessmentMode !== 'activity' || Number(submission?.totalPoints || 0) > 0;
  });
  const masterySummary = computeMasteryFromSubmissions(scoredSubmissions);

  return sendSuccess(res, 200, 'Submissions fetched successfully', {
    submissions: scoredSubmissions.map((submission) => {
      const score = Number(submission?.score || 0);
      const totalPoints = Number(submission?.totalPoints || 0);
      const percentage = totalPoints > 0 ? Number(((score / totalPoints) * 100).toFixed(2)) : 0;
      const totalItems = Array.isArray(submission?.assessmentId?.questions)
        ? submission.assessmentId.questions.length
        : Number(submission?.assessmentId?.numberOfItems || 0);

      return {
        ...submission.toObject(),
        percentage,
        totalItems,
        status: submission?.status || 'completed',
        passFailStatus: percentage >= PASSING_PERCENTAGE ? 'pass' : 'fail',
      };
    }),
    summary: masterySummary,
  });
});

const getMyActivitySubmissions = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const submissions = await Submission.find({
    studentId: req.user._id,
  })
    .populate('assessmentId', 'title assessmentMode lessonId submissionDeadline')
    .sort({ updatedAt: -1 });

  const activitySubmissions = submissions.filter((submission) => (
    String(submission?.assessmentId?.assessmentMode || '').trim().toLowerCase() === 'activity'
  ));

  return sendSuccess(res, 200, 'Activity submissions fetched successfully', {
    submissions: activitySubmissions.map((submission) => toActivitySubmissionResponse(submission, req)),
  });
});

const saveActivityResponseDraft = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const assessment = await assertStudentActivityAssessmentAccess(req.user._id, req.params.id);
  const submission = await saveActivitySubmissionState({
    req,
    assessment,
    finalize: false,
  });

  return sendSuccess(res, 200, 'Activity draft saved successfully', {
    submission: toActivitySubmissionResponse(submission, req),
  });
});

const turnInActivityResponse = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const assessment = await assertStudentActivityAssessmentAccess(req.user._id, req.params.id);
  const submission = await saveActivitySubmissionState({
    req,
    assessment,
    finalize: true,
  });

  return sendSuccess(res, 201, 'Activity submitted successfully', {
    submission: toActivitySubmissionResponse(submission, req),
  });
});

const unsubmitActivityResponse = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const assessment = await assertStudentActivityAssessmentAccess(req.user._id, req.params.id);
  if (isAssessmentDeadlinePassed(assessment)) {
    const error = new Error('Deadline has passed. Unsubmit is no longer allowed.');
    error.statusCode = 403;
    throw error;
  }

  const submission = await Submission.findOne({
    studentId: req.user._id,
    assessmentId: assessment._id,
  })
    .populate('assessmentId', 'title assessmentMode lessonId submissionDeadline');

  if (!submission || String(submission.status || '').trim().toLowerCase() !== 'completed') {
    const error = new Error('Only submitted activity work can be unsubmitted.');
    error.statusCode = 409;
    throw error;
  }

  if (submission.gradedAt || submission.gradeValue !== null) {
    const error = new Error('This work has already been graded and can no longer be unsubmitted.');
    error.statusCode = 403;
    throw error;
  }

  const now = new Date();
  submission.status = 'in_progress';
  submission.submittedAt = null;
  submission.lastActivityAt = now;
  submission.draftSavedAt = now;
  submission.activityLog = [
    ...(Array.isArray(submission.activityLog) ? submission.activityLog : []),
    {
      type: 'unsubmitted',
      message: 'Student unsubmitted the activity response.',
      occurredAt: now,
    },
  ];
  await submission.save();

  return sendSuccess(res, 200, 'Activity unsubmitted successfully', {
    submission: toActivitySubmissionResponse(submission, req),
  });
});

const getMySubjects = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);

  const [approvedEnrollments, pendingEnrollments] = await Promise.all([
    SubjectEnrollment.find({ studentId: req.user._id, status: 'approved' })
      .populate('subjectId', 'name className code track subjectCategory description teacherId createdAt')
      .populate('teacherId', 'name email profileImage')
      .sort({ createdAt: -1 })
      .lean(),
    SubjectEnrollment.find({ studentId: req.user._id, status: 'pending' })
      .populate('subjectId', 'name className code track subjectCategory description teacherId createdAt')
      .populate('teacherId', 'name email profileImage')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const approvedSubjectIds = approvedEnrollments
    .map((row) => row?.subjectId?._id || null)
    .filter(Boolean);

  const [lessons, assessments, recommendation] = await Promise.all([
    approvedSubjectIds.length > 0
      ? Lesson.find({ subjectId: { $in: approvedSubjectIds } }).select('_id title subjectId createdAt').lean()
      : [],
    approvedSubjectIds.length > 0
      ? Assessment.find({ subjectId: { $in: approvedSubjectIds } }).select('_id title subjectId createdAt').lean()
      : [],
    recomputeStudentRecommendation({
      studentId: req.user._id,
      reason: 'Student insights refreshed',
    }).catch(() => null),
  ]);

  const lessonCounts = new Map();
  lessons.forEach((lesson) => {
    const key = String(lesson?.subjectId || '');
    lessonCounts.set(key, Number(lessonCounts.get(key) || 0) + 1);
  });

  const assessmentCounts = new Map();
  assessments.forEach((assessment) => {
    const key = String(assessment?.subjectId || '');
    assessmentCounts.set(key, Number(assessmentCounts.get(key) || 0) + 1);
  });

  const subjectPerformanceById = new Map(
    (Array.isArray(recommendation?.subjectPerformance) ? recommendation.subjectPerformance : [])
      .map((item) => [String(item?.subjectId || ''), item])
  );

  const mapEnrollmentRow = (row) => {
    const subject = row.subjectId || {};
    const teacher = row.teacherId || {};
    const performance = subjectPerformanceById.get(String(subject._id || '')) || null;

    return {
      ...subjectResponse(subject, row),
      teacher: {
        id: String(teacher._id || ''),
        name: teacher.name || 'Teacher',
        email: teacher.email || '',
        profileImage: userProfileImageToUrl(teacher, req),
      },
      lessonCount: lessonCounts.get(String(subject._id || '')) || 0,
      assessmentCount: assessmentCounts.get(String(subject._id || '')) || 0,
      performance: performance
        ? {
          completedAssessments: Number(performance.completedAssessments || 0),
          averageScore: Number(performance.averageScore || 0),
          progress: Number(performance.progress || 0),
          latestCompletedAt: performance.latestCompletedAt || null,
        }
        : {
          completedAssessments: 0,
          averageScore: 0,
          progress: 0,
          latestCompletedAt: null,
        },
    };
  };

  const studentContext = await resolveStudentSectionContext(req.user._id, req);

  return sendSuccess(res, 200, 'Subjects fetched successfully', {
    subjects: approvedEnrollments.map(mapEnrollmentRow),
    pendingSubjects: pendingEnrollments.map(mapEnrollmentRow),
    studentContext,
    insights: {
      ...formatRecommendationPayload(recommendation),
    },
  });
});

const joinSubjectByCode = asyncHandler(async (req, res) => {
  assertGradeTenStudentAccess(req);
  const code = String(req.body?.code || req.body?.subjectCode || '').trim().toUpperCase();
  if (!code) {
    const error = new Error('Subject code is required');
    error.statusCode = 400;
    throw error;
  }

  const subject = await Subject.findOne({ code, isActive: true }).lean();
  if (!subject) {
    const error = new Error('Subject code is invalid');
    error.statusCode = 404;
    throw error;
  }

  const existing = await SubjectEnrollment.findOne({
    studentId: req.user._id,
    subjectId: subject._id,
  });

  if (existing && existing.status === 'approved') {
    const error = new Error('You are already enrolled in this class');
    error.statusCode = 409;
    throw error;
  }

  if (existing && existing.status === 'pending') {
    const error = new Error('Your enrollment request is already pending approval');
    error.statusCode = 409;
    throw error;
  }

  const enrollment = existing || new SubjectEnrollment({
    studentId: req.user._id,
    subjectId: subject._id,
    teacherId: subject.teacherId,
  });
  const section = req.user?.sectionId
    ? await Section.findById(req.user.sectionId).select('name').lean()
    : null;
  enrollment.sectionId = req.user?.sectionId || undefined;
  enrollment.sectionName = String(section?.name || '').trim();
  enrollment.status = 'pending';
  enrollment.requestedAt = new Date();
  enrollment.decidedAt = null;
  await enrollment.save();

  return sendSuccess(res, 201, 'Enrollment request sent successfully', {
    request: {
      id: String(enrollment._id),
      subject: subjectResponse(subject, enrollment),
    },
  });
});

const getStudentProfile = asyncHandler(async (req, res) => {
  const studentContext = await resolveStudentSectionContext(req.user._id, req);
  return sendSuccess(res, 200, 'Profile fetched successfully', {
    user: {
      ...studentProfileResponse(req.user, req),
      section: studentContext.section,
      adviser: studentContext.adviser,
    },
  });
});

const updateStudentProfile = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || req.body?.fullName || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const contactNumberRaw = String(req.body?.contactNumber || req.body?.phone || '').trim();
  const gradeLevel = String(req.body?.gradeLevel || '').trim();
  const existingGradeLevel = String(req.user?.gradeLevel || '').trim();
  const resolvedGradeLevel = gradeLevel || existingGradeLevel;
  const uploadedImage = req.file || null;

  console.log('[TEMP][updateStudentProfile] incoming payload:', {
    userId: String(req.user?._id || ''),
    role: req.user?.role || '',
    name,
    email,
    contactNumberRaw,
    gradeLevel,
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

  req.user.name = name;
  req.user.email = email;
  if (req.user.role === 'student') {
    if (resolvedGradeLevel && !ALLOWED_STUDENT_GRADE_LEVELS.includes(resolvedGradeLevel)) {
      const error = new Error(`Grade level must be one of: ${ALLOWED_STUDENT_GRADE_LEVELS.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    req.user.gradeLevel = resolvedGradeLevel;
  } else {
    req.user.gradeLevel = '';
  }

  if (uploadedImage) {
    const uploadedProfile = await uploadFile({
      file: uploadedImage,
      folder: `profile-images/students/${String(req.user?._id || 'unknown')}`,
    });
    req.user.profileImage = uploadedProfile.storedPath;
  }

  await req.user.save();
  console.log('[TEMP][updateStudentProfile] saved user snapshot:', {
    userId: String(req.user?._id || ''),
    name: req.user.name,
    email: req.user.email,
    gradeLevel: req.user.gradeLevel,
    contactNumber: req.user.contactNumber || '',
    profileImage: req.user.profileImage || '',
  });

  return sendSuccess(res, 200, 'Profile updated successfully', {
    user: studentProfileResponse(req.user, req),
  });
});

const updateStudentTourPreference = asyncHandler(async (req, res) => {
  req.user.hasCompletedStudentTour = req.body?.hasCompletedStudentTour === true;
  await req.user.save();

  return sendSuccess(res, 200, 'Student tour preference updated successfully', {
    user: studentProfileResponse(req.user, req),
  });
});

module.exports = {
  getMySubjects,
  joinSubjectByCode,
  getStudentLessons,
  getStudentTeachers,
  downloadStudentLessonPdf,
  downloadStudentLessonAttachment,
  getAvailableAssessments,
  getAssessmentForExam,
  startAssessmentSession,
  saveAssessmentProgress,
  logAssessmentActivity,
  submitAssessment,
  getMySubmissions,
  getMyActivitySubmissions,
  saveActivityResponseDraft,
  turnInActivityResponse,
  unsubmitActivityResponse,
  getStudentProfile,
  updateStudentProfile,
  updateStudentTourPreference,
};
