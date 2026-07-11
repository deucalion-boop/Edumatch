const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const SubjectEnrollment = require('../models/SubjectEnrollment');
const { sendSuccess } = require('../utils/responseHelper');
const { ROLE_HEADTEACHER, ROLE_TEACHER, ROLE_STUDENT } = require('../constants/userRoles');
const { ensureTeacherSubject } = require('../services/subjectService');
const { inferSubjectCategory, normalizeSubjectCategory } = require('../services/recommendationService');
const {
  buildAssessmentPolicy,
  parseSubmissionDeadline,
  parseExamDurationMinutes,
  isPastDate,
  resolveAssignedStudentIds,
  assertUniqueGradingAssessment,
} = require('../services/assessmentPolicyService');
const {
  STRANDS,
  normalizeStrand,
  isSubjectAllowedForStrand,
  getSubjectCategory,
} = require('../constants/strandSubjects');
const {
  normalizeContactNumber,
  mapUserResponse,
  issueInviteForUser,
  applyRoleScopedFields,
} = require('../services/userManagementService');
const { uploadFiles } = require('../services/storageService');
const { getSectionOrThrow, syncTeacherAdvisoryAssignments } = require('../services/sectionService');
const { resolveStoredFileUrl } = require('../utils/fileStorage');
const { buildExcludeArchivedStudentsFilter, isArchivedStudent } = require('../utils/studentArchive');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const ALLOWED_ACCOUNT_STATUSES = ['pending', 'active', 'inactive', 'suspended'];
const DEFAULT_LESSON_ANALYTICS_MONTHS = 3;
const MIN_LESSON_ANALYTICS_MONTHS = 1;
const MAX_LESSON_ANALYTICS_MONTHS = 12;

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = String(keyFn(item) || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sanitizeAnalyticsMonthCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return DEFAULT_LESSON_ANALYTICS_MONTHS;
  return Math.min(MAX_LESSON_ANALYTICS_MONTHS, Math.max(MIN_LESSON_ANALYTICS_MONTHS, parsed));
}

function buildRecentMonthBuckets(monthCount = DEFAULT_LESSON_ANALYTICS_MONTHS) {
  const buckets = [];
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  start.setUTCMonth(start.getUTCMonth() - (monthCount - 1));

  for (let index = 0; index < monthCount; index += 1) {
    const bucketDate = new Date(start);
    bucketDate.setUTCMonth(start.getUTCMonth() + index);
    buckets.push({
      year: bucketDate.getUTCFullYear(),
      month: bucketDate.getUTCMonth() + 1,
      label: bucketDate.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      count: 0,
    });
  }

  return buckets;
}

async function buildMonthlyCreationAnalytics(Model, teacherIds, monthCount) {
  const analyticsBuckets = buildRecentMonthBuckets(monthCount);
  if (!teacherIds.length) {
    return analyticsBuckets;
  }

  const firstBucket = analyticsBuckets[0];
  const trend = await Model.aggregate([
    {
      $match: {
        createdBy: { $in: teacherIds },
      },
    },
    {
      $project: {
        activityDate: { $ifNull: ['$createdAt', '$updatedAt'] },
      },
    },
    {
      $match: {
        activityDate: {
          $gte: new Date(Date.UTC(firstBucket.year, firstBucket.month - 1, 1)),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$activityDate' },
          month: { $month: '$activityDate' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
      },
    },
  ]);

  const trendLookup = new Map(
    trend.map((entry) => [`${entry._id.year}-${entry._id.month}`, Number(entry.count || 0)])
  );

  analyticsBuckets.forEach((bucket) => {
    bucket.count = trendLookup.get(`${bucket.year}-${bucket.month}`) || 0;
  });

  return analyticsBuckets;
}

function ensureHeadTeacher(req) {
  if (String(req.user?.role || '') !== ROLE_HEADTEACHER) {
    const error = new Error('Only HeadTeachers can perform this action');
    error.statusCode = 403;
    throw error;
  }
  const department = String(req.user?.department || '').trim();
  if (!department) {
    const error = new Error('Your HeadTeacher account is missing a department assignment');
    error.statusCode = 400;
    throw error;
  }
  return department;
}

function normalizeLessonUploads(files) {
  const uploadedFiles = Array.isArray(files) ? files : [];
  const seen = new Set();
  return uploadedFiles.filter((file) => {
    const key = `${String(file?.originalname || '').trim().toLowerCase()}:${String(file?.mimetype || '').trim().toLowerCase()}:${Number(file?.size || 0)}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function buildLessonAttachmentPayload(files, { teacherId = '' } = {}) {
  const uploadedFiles = await uploadFiles(normalizeLessonUploads(files), {
    folder: `headteacher-lessons/${String(teacherId || 'unknown')}`,
  });

  return uploadedFiles.map((file) => ({
    originalName: file.originalName,
    storedPath: file.storedPath,
    mimeType: file.mimeType,
    extension: file.extension,
    size: file.size,
    uploadedAt: file.uploadedAt,
  }));
}

function headTeacherLessonToResponse(lesson, teacher) {
  return {
    id: String(lesson?._id || ''),
    title: String(lesson?.title || '').trim(),
    description: String(lesson?.description || '').trim(),
    track: String(lesson?.track || '').trim(),
    subject: String(lesson?.subject || '').trim(),
    subjectCode: String(lesson?.subjectCode || '').trim(),
    subjectCategory: String(lesson?.subjectCategory || '').trim(),
    pdfOriginalName: String(lesson?.pdfOriginalName || '').trim(),
    createdAt: lesson?.createdAt || null,
    teacher: {
      id: String(teacher?._id || ''),
      name: String(teacher?.name || 'Teacher').trim() || 'Teacher',
      subject: String(teacher?.subject || teacher?.department || '').trim(),
      department: String(teacher?.department || '').trim(),
    },
  };
}

function resolveAssessmentSubjectCategory({ subjectCategory, examType, title, lessonTrack }) {
  return normalizeSubjectCategory(subjectCategory)
    || inferSubjectCategory({ subjectCategory, examType, title, lessonTrack })
    || 'Technical';
}

async function findManagedTeacherForHeadTeacher(req, teacherId, options = {}) {
  const department = options.department || ensureHeadTeacher(req);
  const teacher = await User.findOne({
    _id: teacherId,
    role: ROLE_TEACHER,
    department,
    managedBy: req.user._id,
  }).select('_id name subject department strand');

  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  return teacher;
}

function ensureManagedTeacherSubject(teacher, requestedSubject) {
  const teacherSubject = String(teacher?.subject || teacher?.department || '').trim();
  if (!teacherSubject) {
    const error = new Error('The selected teacher has no assigned subject');
    error.statusCode = 400;
    throw error;
  }

  const normalizedRequested = String(requestedSubject || '').trim();
  if (normalizedRequested && normalizedRequested !== teacherSubject) {
    const error = new Error(`Assessments for this teacher must stay within the assigned subject: ${teacherSubject}`);
    error.statusCode = 403;
    throw error;
  }

  return teacherSubject;
}

function headTeacherAssessmentToResponse(assessment, teacher, submissionCountsByAssessment = new Map()) {
  return {
    id: String(assessment?._id || ''),
    teacherId: String(teacher?._id || assessment?.createdBy || ''),
    teacherName: String(teacher?.name || 'Teacher').trim() || 'Teacher',
    title: String(assessment?.title || '').trim(),
    examType: String(assessment?.examType || '').trim(),
    subject: String(assessment?.subject || assessment?.lessonId?.subject || '').trim(),
    subjectId: String(assessment?.subjectId || assessment?.lessonId?.subjectId || ''),
    subjectCode: String(assessment?.subjectCode || assessment?.lessonId?.subjectCode || ''),
    subjectCategory: String(assessment?.subjectCategory || 'Technical').trim() || 'Technical',
    difficulty: String(assessment?.difficulty || '').trim(),
    numberOfItems: Number(assessment?.numberOfItems || 0),
    assessmentMode: String(assessment?.assessmentMode || 'activity'),
    gradingPeriod: String(assessment?.gradingPeriod || ''),
    countsTowardRecommendation: Boolean(assessment?.countsTowardRecommendation),
    assignmentScope: String(assessment?.assignmentScope || 'handled_class'),
    assignedStudentsCount: Array.isArray(assessment?.assignedStudentIds) ? assessment.assignedStudentIds.length : 0,
    examDurationMinutes: Number(assessment?.examDurationMinutes || 30),
    submissionDeadline: assessment?.submissionDeadline || null,
    isDeadlinePassed: assessment?.submissionDeadline ? isPastDate(assessment.submissionDeadline) : false,
    challengeDescription: String(assessment?.challengeDescription || '').trim(),
    questionsCount: Array.isArray(assessment?.questions) ? assessment.questions.length : 0,
    questions: Array.isArray(assessment?.questions) ? assessment.questions : [],
    lessonTitle: String(assessment?.lessonId?.title || '').trim(),
    lessonTrack: String(assessment?.lessonId?.track || '').trim(),
    submissionsCount: submissionCountsByAssessment.get(String(assessment?._id || '')) || 0,
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
    createdAt: assessment?.createdAt || null,
    updatedAt: assessment?.updatedAt || null,
  };
}

const getManagedTeachers = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
  const analyticsMonthCount = sanitizeAnalyticsMonthCount(req.query?.months);
  const teachers = await User.find({
    role: ROLE_TEACHER,
    department,
    managedBy: req.user._id,
  })
    .select('-password')
    .populate('managedBy', 'name email')
    .populate('advisorySectionId', 'name')
    .sort({ createdAt: -1 });

  const teacherIds = teachers.map((teacher) => teacher._id);
  const [studentCount, lessonCount, assessmentCount] = teacherIds.length > 0
    ? await Promise.all([
      User.countDocuments({
        role: ROLE_STUDENT,
        managedBy: { $in: teacherIds },
        ...buildExcludeArchivedStudentsFilter(),
      }),
      Lesson.countDocuments({
        createdBy: { $in: teacherIds },
      }),
      Assessment.countDocuments({
        createdBy: { $in: teacherIds },
      }),
    ])
    : [0, 0, 0];

  const [lessonAnalyticsBuckets, assessmentAnalyticsBuckets] = await Promise.all([
    buildMonthlyCreationAnalytics(Lesson, teacherIds, analyticsMonthCount),
    buildMonthlyCreationAnalytics(Assessment, teacherIds, analyticsMonthCount),
  ]);

  const teachersPayload = teachers.map((teacher) => {
    const mappedTeacher = mapUserResponse(teacher, req);
    return mappedTeacher;
  });
  const activeTeachers = teachersPayload.filter((teacher) => String(teacher.status || '').trim().toLowerCase() === 'active').length;

  return sendSuccess(res, 200, 'Teachers fetched successfully', {
    department,
    teachers: teachersPayload,
    summary: {
      totalTeachers: teachersPayload.length,
      activeTeachers,
      totalStudents: studentCount,
      totalLessonsAndAssessments: Number(lessonCount || 0) + Number(assessmentCount || 0),
      totalLessons: lessonCount,
      totalAssessments: assessmentCount,
      lessonAnalytics: {
        months: analyticsMonthCount,
        labels: lessonAnalyticsBuckets.map((bucket) => bucket.label),
        values: lessonAnalyticsBuckets.map((bucket) => bucket.count),
      },
      assessmentAnalytics: {
        months: analyticsMonthCount,
        labels: assessmentAnalyticsBuckets.map((bucket) => bucket.label),
        values: assessmentAnalyticsBuckets.map((bucket) => bucket.count),
      },
    },
  });
});

const createTeacherAccount = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
  const {
    name,
    email,
    username,
    status,
    subject,
    contactNumber,
    advisorySectionId,
  } = req.body || {};

  if (!name || !email || !username) {
    const error = new Error('name, email, and username are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedUsername = String(username || '').trim();
  const existing = await User.findOne({ email: normalizedEmail }).select('_id');
  if (existing) {
    const error = new Error('Email already exists');
    error.statusCode = 409;
    throw error;
  }

  if (normalizedUsername.length > 50) {
    const error = new Error('username must be 50 characters or fewer');
    error.statusCode = 400;
    throw error;
  }

  const existingUsername = await User.findOne({ username: normalizedUsername }).select('_id');
  if (existingUsername) {
    const error = new Error('Username already exists');
    error.statusCode = 409;
    throw error;
  }

  const normalizedStatus = String(status || '').trim().toLowerCase();
  if (normalizedStatus && !ALLOWED_ACCOUNT_STATUSES.includes(normalizedStatus)) {
    const error = new Error(`status must be one of: ${ALLOWED_ACCOUNT_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const scopedFields = applyRoleScopedFields({
    role: ROLE_TEACHER,
    department,
    subject,
  });

  const created = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    username: normalizedUsername,
    role: ROLE_TEACHER,
    status: 'active',
    subject: scopedFields.subject,
    department: scopedFields.department,
    advisorySectionId: advisorySectionId ? (await getSectionOrThrow(advisorySectionId))._id : undefined,
    strand: '',
    gradeLevel: '',
    contactNumber: normalizeContactNumber(contactNumber),
    managedBy: req.user._id,
    invite: {
      tokenHash: '',
      expiresAt: null,
      sentAt: null,
      usedAt: null,
    },
  });
  await syncTeacherAdvisoryAssignments({
    nextSectionId: created.advisorySectionId,
  });

  const inviteResult = await issueInviteForUser({
    user: created,
    req,
  });

  return sendSuccess(res, 201, 'Teacher account created successfully', {
    user: mapUserResponse(created, req),
    invite: inviteResult,
  });
});

const updateManagedTeacher = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
  const { id } = req.params;
  const { name, email, status, subject, contactNumber, advisorySectionId } = req.body || {};

  const teacher = await User.findOne({
    _id: id,
    role: ROLE_TEACHER,
    managedBy: req.user._id,
    department,
  }).select('-password');

  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  if (email && String(email).toLowerCase().trim() !== teacher.email) {
    const existing = await User.findOne({
      email: String(email).toLowerCase().trim(),
      _id: { $ne: teacher._id },
    }).select('_id');
    if (existing) {
      const error = new Error('Email already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  if (name !== undefined) teacher.name = String(name).trim();
  if (email !== undefined) teacher.email = String(email).toLowerCase().trim();
  if (status !== undefined) {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (!ALLOWED_ACCOUNT_STATUSES.includes(normalizedStatus)) {
      const error = new Error(`status must be one of: ${ALLOWED_ACCOUNT_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    teacher.status = normalizedStatus;
  }
  if (contactNumber !== undefined) teacher.contactNumber = normalizeContactNumber(contactNumber);

  if (subject !== undefined) {
    const scopedFields = applyRoleScopedFields({
      role: ROLE_TEACHER,
      department,
      subject,
    });
    teacher.department = scopedFields.department;
    teacher.subject = scopedFields.subject;
  }

  const previousAdvisorySectionId = String(teacher.advisorySectionId || '').trim();
  if (advisorySectionId !== undefined) {
    teacher.advisorySectionId = advisorySectionId
      ? (await getSectionOrThrow(advisorySectionId))._id
      : undefined;
  }

  await teacher.save();
  await syncTeacherAdvisoryAssignments({
    previousSectionId: previousAdvisorySectionId,
    nextSectionId: teacher.advisorySectionId,
  });

  return sendSuccess(res, 200, 'Teacher updated successfully', {
    user: mapUserResponse(teacher, req),
  });
});

const getManagedTeacherStudents = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
  const { id } = req.params;

  const teacher = await User.findOne({
    _id: id,
    role: ROLE_TEACHER,
    managedBy: req.user._id,
    department,
  })
    .select('_id name email department subject status profileImage advisorySectionId')
    .populate('advisorySectionId', 'name')
    .lean();

  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  const [approvedEnrollments, managedStudents] = await Promise.all([
    SubjectEnrollment.find({
      teacherId: teacher._id,
      status: 'approved',
    })
      .populate('studentId', '_id name email status gradeLevel profileImage createdAt enrollment sectionId archive')
      .populate('sectionId', 'name')
      .populate('subjectId', '_id name className code track')
      .sort({ decidedAt: -1, createdAt: -1 })
      .lean(),
    User.find({
      role: ROLE_STUDENT,
      managedBy: teacher._id,
      ...buildExcludeArchivedStudentsFilter(),
    })
      .select('_id name email status gradeLevel profileImage createdAt enrollment sectionId')
      .populate('sectionId', 'name')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const enrolledStudents = approvedEnrollments
    .map((row) => {
      const student = row?.studentId || null;
      if (!student?._id || isArchivedStudent(student)) return null;
      const subject = row?.subjectId || null;
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        status: student.status,
        gradeLevel: student.gradeLevel,
        profileImage: resolveStoredFileUrl(req, student.profileImage),
        createdAt: student.createdAt || row?.requestedAt || row?.createdAt || null,
        enrollment: student.enrollment || {},
        enrollmentTrack: String(subject?.track || '').trim(),
        sectionId: row?.sectionId?._id || row?.sectionId || student?.sectionId?._id || student?.sectionId || '',
        sectionName: row?.sectionId?.name || student?.sectionId?.name || row?.sectionName || '',
      };
    })
    .filter(Boolean);

  const enrolledStudentIds = new Set(enrolledStudents.map((student) => String(student?._id || '')));
  const students = uniqueBy(
    [
      ...enrolledStudents,
      ...managedStudents.filter((student) => student?._id && !enrolledStudentIds.has(String(student._id))),
    ],
    (student) => String(student?._id || '')
  );

  const studentsPayload = students.map((student) => ({
    id: String(student._id),
    name: String(student.name || 'Student').trim() || 'Student',
    email: String(student.email || '').trim(),
    status: String(student.status || 'active').trim().toLowerCase(),
    gradeLevel: String(student.gradeLevel || '').trim(),
    sectionId: String(student.sectionId || '').trim(),
    sectionName: String(student.sectionName || '').trim(),
    track: String(student.enrollmentTrack || student.enrollment?.track || student.enrollment?.trackId || '').trim(),
    createdAt: student.createdAt || null,
    avatar: String(student.profileImage || '').trim()
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(String(student.name || 'Student').trim() || 'Student')}&background=334155&color=fff`,
  }));

  return sendSuccess(res, 200, 'Teacher students fetched successfully', {
    teacher: {
      id: String(teacher._id),
      name: String(teacher.name || 'Teacher').trim() || 'Teacher',
      email: String(teacher.email || '').trim(),
      department: String(teacher.department || department).trim() || department,
      subject: String(teacher.subject || teacher.department || department).trim() || department,
      advisorySectionId: String(teacher?.advisorySectionId?._id || teacher?.advisorySectionId || '').trim(),
      advisorySectionName: String(teacher?.advisorySectionId?.name || '').trim(),
      status: String(teacher.status || 'active').trim().toLowerCase(),
      avatar: String(teacher.profileImage || '').trim()
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(String(teacher.name || 'Teacher').trim() || 'Teacher')}&background=334155&color=fff`,
    },
    students: studentsPayload,
    summary: {
      totalStudents: studentsPayload.length,
      activeStudents: studentsPayload.filter((student) => student.status === 'active').length,
    },
  });
});

const getManagedTeacherLessons = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
  const teachers = await User.find({
    role: ROLE_TEACHER,
    department,
    managedBy: req.user._id,
  })
    .select('_id name subject department')
    .lean();

  if (teachers.length === 0) {
    return sendSuccess(res, 200, 'Managed lessons fetched successfully', {
      lessons: [],
      summary: {
        totalLessons: 0,
        totalTeachers: 0,
      },
    });
  }

  const teacherMap = new Map(teachers.map((teacher) => [String(teacher._id), teacher]));
  const lessons = await Lesson.find({
    createdBy: { $in: teachers.map((teacher) => teacher._id) },
  })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, 200, 'Managed lessons fetched successfully', {
    lessons: lessons.map((lesson) => headTeacherLessonToResponse(lesson, teacherMap.get(String(lesson.createdBy)))),
    summary: {
      totalLessons: lessons.length,
      totalTeachers: teachers.length,
    },
  });
});

const createManagedTeacherLesson = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
  const { teacherId, title, description, track, strand } = req.body || {};
  const normalizedTeacherId = String(teacherId || '').trim();
  const normalizedTitle = String(title || '').trim();
  const normalizedDescription = String(description || '').trim();

  if (!normalizedTeacherId || !normalizedTitle || !normalizedDescription) {
    const error = new Error('teacherId, title, and description are required');
    error.statusCode = 400;
    throw error;
  }

  const teacher = await User.findOne({
    _id: normalizedTeacherId,
    role: ROLE_TEACHER,
    department,
    managedBy: req.user._id,
  }).select('_id name subject department strand');

  if (!teacher) {
    const error = new Error('Teacher not found');
    error.statusCode = 404;
    throw error;
  }

  const normalizedTrack = normalizeStrand(strand || track || teacher.strand || 'GENERAL') || 'GENERAL';
  const normalizedSubject = String(teacher.department || department).trim();

  if (!normalizedSubject) {
    const error = new Error('The selected teacher has no assigned department');
    error.statusCode = 400;
    throw error;
  }

  if (!STRANDS.includes(normalizedTrack)) {
    const error = new Error(`strand must be one of: ${STRANDS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (!isSubjectAllowedForStrand({ strand: normalizedTrack, subject: normalizedSubject })) {
    const error = new Error(`subject is invalid for strand ${normalizedTrack}`);
    error.statusCode = 400;
    throw error;
  }

  const uploadedFiles = Array.isArray(req.files?.lessonPlanFile) ? req.files.lessonPlanFile : [];
  if (uploadedFiles.length !== 1) {
    const error = new Error('Exactly one lesson plan PDF is required');
    error.statusCode = 400;
    throw error;
  }

  const duplicateLesson = await Lesson.findOne({
    createdBy: teacher._id,
    title: new RegExp(`^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    track: new RegExp(`^${normalizedTrack.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  }).select('_id');

  if (duplicateLesson) {
    const error = new Error('A lesson with the same title and track already exists for this teacher');
    error.statusCode = 409;
    throw error;
  }

  const normalizedSubjectCategory = getSubjectCategory(normalizedSubject);
  const subjectRecord = await ensureTeacherSubject({
    teacherId: teacher._id,
    name: normalizedSubject,
    track: normalizedTrack,
    subjectCategory: normalizedSubjectCategory,
    department,
  });

  const attachmentsPayload = await buildLessonAttachmentPayload(uploadedFiles, {
    teacherId: teacher._id,
  });
  const primaryAttachment = attachmentsPayload[0];

  const lesson = await Lesson.create({
    title: normalizedTitle,
    description: normalizedDescription,
    track: normalizedTrack,
    subject: normalizedSubject,
    subjectId: subjectRecord._id,
    subjectCode: subjectRecord.code,
    subjectCategory: normalizedSubjectCategory,
    pdfPath: primaryAttachment.storedPath,
    pdfOriginalName: primaryAttachment.originalName,
    attachments: attachmentsPayload,
    createdBy: teacher._id,
  });

  return sendSuccess(res, 201, 'Lesson created and assigned successfully', {
    lesson: headTeacherLessonToResponse(lesson, teacher),
  });
});

const getManagedTeacherAssessments = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
  const teachers = await User.find({
    role: ROLE_TEACHER,
    department,
    managedBy: req.user._id,
  })
    .select('_id name subject department')
    .lean();

  if (teachers.length === 0) {
    return sendSuccess(res, 200, 'Managed assessments fetched successfully', {
      assessments: [],
      summary: {
        totalAssessments: 0,
        totalTeachers: 0,
      },
    });
  }

  const teacherMap = new Map(teachers.map((teacher) => [String(teacher._id), teacher]));
  const assessments = await Assessment.find({
    createdBy: { $in: teachers.map((teacher) => teacher._id) },
  })
    .populate('lessonId', 'title track subject subjectId subjectCode')
    .populate('publishedBy', 'name role')
    .populate('lastModifiedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  const assessmentIds = assessments.map((assessment) => assessment._id);
  let submissionCountsByAssessment = new Map();

  if (assessmentIds.length > 0) {
    const submissionCounts = await Submission.aggregate([
      { $match: { assessmentId: { $in: assessmentIds } } },
      { $group: { _id: '$assessmentId', count: { $sum: 1 } } },
    ]);
    submissionCountsByAssessment = new Map(
      submissionCounts.map((row) => [String(row._id), Number(row.count || 0)])
    );
  }

  return sendSuccess(res, 200, 'Managed assessments fetched successfully', {
    assessments: assessments.map((assessment) => headTeacherAssessmentToResponse(
      assessment,
      teacherMap.get(String(assessment.createdBy || '')),
      submissionCountsByAssessment
    )),
    summary: {
      totalAssessments: assessments.length,
      totalTeachers: teachers.length,
    },
  });
});

const createManagedTeacherAssessment = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
  const {
    teacherId,
    lessonId,
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
  } = req.body || {};

  if (!teacherId || !lessonId || !title || !examType || !difficulty || !numberOfItems) {
    const error = new Error('teacherId, lessonId, title, examType, difficulty, and numberOfItems are required');
    error.statusCode = 400;
    throw error;
  }

  const teacher = await findManagedTeacherForHeadTeacher(req, teacherId, { department });
  const lesson = await Lesson.findOne({ _id: lessonId, createdBy: teacher._id });
  if (!lesson) {
    const error = new Error('Lesson not found for the selected teacher');
    error.statusCode = 404;
    throw error;
  }

  const normalizedTitle = String(title || '').trim();
  const normalizedSubject = ensureManagedTeacherSubject(teacher, String(subject || lesson.subject || '').trim());
  const lessonStrand = normalizeStrand(lesson.track);
  if (!isSubjectAllowedForStrand({ strand: lessonStrand, subject: normalizedSubject })) {
    const allowedSubjects = STRANDS.includes(lessonStrand) ? [normalizedSubject] : [];
    const error = new Error(
      allowedSubjects.length > 0
        ? `subject is invalid for strand ${lessonStrand}.`
        : `subject is invalid for strand ${lessonStrand}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const duplicateAssessment = await Assessment.findOne({
    createdBy: teacher._id,
    lessonId,
    title: new RegExp(`^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    examType,
  }).select('_id');
  if (duplicateAssessment) {
    const error = new Error('An assessment with the same title already exists for this lesson');
    error.statusCode = 409;
    throw error;
  }

  const examDurationMinutes = parseExamDurationMinutes(examDurationMinutesRaw, { required: true });
  const submissionDeadline = parseSubmissionDeadline(
    submissionDeadlineRaw ?? deadlineRaw ?? deadlineAtRaw
  );
  if (submissionDeadline && isPastDate(submissionDeadline)) {
    const error = new Error('submissionDeadline must be a future date and time');
    error.statusCode = 400;
    throw error;
  }

  const challengeDescription = String(challengeDescriptionRaw || '').trim();
  const assessmentPolicy = buildAssessmentPolicy({
    assessmentMode,
    gradingPeriod,
    assignmentScope,
  });

  const subjectRecord = await ensureTeacherSubject({
    teacherId: teacher._id,
    name: lesson.subject || normalizedSubject,
    track: lesson.track,
    subjectCategory: lesson.subjectCategory || getSubjectCategory(normalizedSubject),
    department,
  });

  if (!lesson.subjectId || String(lesson.subjectId) !== String(subjectRecord._id) || String(lesson.subjectCode || '') !== String(subjectRecord.code)) {
    lesson.subjectId = subjectRecord._id;
    lesson.subjectCode = subjectRecord.code;
    await lesson.save();
  }

  if (assessmentPolicy.countsTowardRecommendation) {
    await assertUniqueGradingAssessment({
      teacherId: teacher._id,
      subjectId: subjectRecord._id,
      gradingPeriod: assessmentPolicy.gradingPeriod,
    });
  }

  const assignedStudentIds = await resolveAssignedStudentIds({
    assignmentScope: assessmentPolicy.assignmentScope,
    teacherId: teacher._id,
    subjectId: subjectRecord._id,
  });

  const assessment = await Assessment.create({
    lessonId,
    title: normalizedTitle,
    examType,
    subject: normalizedSubject,
    subjectId: subjectRecord._id,
    subjectCode: subjectRecord.code,
    subjectCategory: resolveAssessmentSubjectCategory({
      subjectCategory: subjectCategory || getSubjectCategory(normalizedSubject),
      examType,
      title: normalizedTitle,
      lessonTrack: lesson.track,
    }),
    difficulty,
    numberOfItems,
    examDurationMinutes,
    submissionDeadline: submissionDeadline || null,
    challengeDescription,
    assessmentMode: assessmentPolicy.assessmentMode,
    gradingPeriod: assessmentPolicy.gradingPeriod,
    countsTowardRecommendation: assessmentPolicy.countsTowardRecommendation,
    assignmentScope: assessmentPolicy.assignmentScope,
    assignedStudentIds,
    questions: Array.isArray(questions) ? questions : [],
    createdBy: teacher._id,
    publishedBy: req.user._id,
    lastModifiedBy: req.user._id,
  });

  const hydratedAssessment = await Assessment.findById(assessment._id)
    .populate('lessonId', 'title track subject subjectId subjectCode')
    .populate('publishedBy', 'name role')
    .populate('lastModifiedBy', 'name role')
    .lean();

  return sendSuccess(res, 201, 'Assessment created successfully', {
    assessment: headTeacherAssessmentToResponse(hydratedAssessment, teacher),
  });
});

const updateManagedTeacherAssessment = asyncHandler(async (req, res) => {
  const department = ensureHeadTeacher(req);
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
  } = req.body || {};

  const assessment = await Assessment.findById(id);
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  const teacher = await findManagedTeacherForHeadTeacher(req, assessment.createdBy, { department });
  const lesson = await Lesson.findById(assessment.lessonId).select('track').lean();

  if (questions !== undefined) {
    if (!Array.isArray(questions)) {
      const error = new Error('questions must be an array');
      error.statusCode = 400;
      throw error;
    }
    assessment.questions = questions;
  }

  const nextPolicy = buildAssessmentPolicy({
    assessmentMode: assessmentMode !== undefined ? assessmentMode : assessment.assessmentMode,
    gradingPeriod: gradingPeriod !== undefined ? gradingPeriod : assessment.gradingPeriod,
    assignmentScope: assignmentScope !== undefined ? assignmentScope : assessment.assignmentScope,
  });

  if (title !== undefined) assessment.title = String(title || '').trim();
  if (examType !== undefined) assessment.examType = String(examType || '').trim();

  if (subject !== undefined) {
    const nextSubject = ensureManagedTeacherSubject(teacher, String(subject || '').trim());
    const lessonStrand = normalizeStrand(lesson?.track);
    if (!isSubjectAllowedForStrand({ strand: lessonStrand, subject: nextSubject })) {
      const error = new Error(`subject is invalid for strand ${lessonStrand}`);
      error.statusCode = 400;
      throw error;
    }

    const subjectRecord = await ensureTeacherSubject({
      teacherId: teacher._id,
      name: nextSubject,
      track: lesson?.track || '',
      subjectCategory: getSubjectCategory(nextSubject),
      department,
    });
    assessment.subject = nextSubject;
    assessment.subjectId = subjectRecord._id;
    assessment.subjectCode = subjectRecord.code;
  }

  if ((!assessment.subjectId || !assessment.subjectCode) && String(assessment.subject || '').trim()) {
    const subjectRecord = await ensureTeacherSubject({
      teacherId: teacher._id,
      name: String(assessment.subject || '').trim(),
      track: lesson?.track || '',
      subjectCategory: getSubjectCategory(assessment.subject),
      department,
    });
    assessment.subjectId = subjectRecord._id;
    assessment.subjectCode = subjectRecord.code;
  }

  if (subjectCategory !== undefined || examType !== undefined || title !== undefined || subject !== undefined) {
    assessment.subjectCategory = resolveAssessmentSubjectCategory({
      subjectCategory: subjectCategory || getSubjectCategory(assessment.subject),
      examType: examType !== undefined ? examType : assessment.examType,
      title: title !== undefined ? title : assessment.title,
      lessonTrack: lesson?.track || '',
    });
  }
  if (difficulty !== undefined) assessment.difficulty = difficulty;
  if (numberOfItems !== undefined) assessment.numberOfItems = numberOfItems;
  assessment.assessmentMode = nextPolicy.assessmentMode;
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
      teacherId: teacher._id,
      subjectId: assessment.subjectId,
      gradingPeriod: nextPolicy.gradingPeriod,
      excludeAssessmentId: assessment._id,
    });
  }

  assessment.assignedStudentIds = await resolveAssignedStudentIds({
    assignmentScope: nextPolicy.assignmentScope,
    teacherId: teacher._id,
    subjectId: assessment.subjectId,
  });
  assessment.lastModifiedBy = req.user._id;
  if (!assessment.publishedBy) assessment.publishedBy = req.user._id;

  await assessment.save();

  const hydratedAssessment = await Assessment.findById(assessment._id)
    .populate('lessonId', 'title track subject subjectId subjectCode')
    .populate('publishedBy', 'name role')
    .populate('lastModifiedBy', 'name role')
    .lean();

  return sendSuccess(res, 200, 'Assessment updated successfully', {
    assessment: headTeacherAssessmentToResponse(hydratedAssessment, teacher),
  });
});

module.exports = {
  getManagedTeachers,
  createTeacherAccount,
  updateManagedTeacher,
  getManagedTeacherStudents,
  getManagedTeacherLessons,
  createManagedTeacherLesson,
  getManagedTeacherAssessments,
  createManagedTeacherAssessment,
  updateManagedTeacherAssessment,
};
