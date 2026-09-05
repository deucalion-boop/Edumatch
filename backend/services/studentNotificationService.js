const crypto = require('crypto');
const Assessment = require('../models/Assessment');
const { upsertNotifications } = require('./supabaseNotificationService');
const Recommendation = require('../models/Recommendation');
const Submission = require('../models/Submission');
const SubjectEnrollment = require('../models/SubjectEnrollment');

const STUDENT_ROLE = 'student';
const UPCOMING_DEADLINE_WINDOW_MS = 24 * 60 * 60 * 1000;

function clean(value, fallback = '') {
  return String(value || '').trim() || fallback;
}

function truncate(value, maxLength) {
  const normalized = clean(value).replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function senderDetails(sender, fallbackName = 'EduMatch') {
  return {
    senderId: sender?._id || null,
    senderRole: clean(sender?.role, 'system').toLowerCase(),
    senderName: truncate(sender?.name || sender?.username || fallbackName, 120),
  };
}

function hashValue(value) {
  return crypto.createHash('sha256').update(clean(value)).digest('hex').slice(0, 16);
}

async function createStudentNotifications({
  recipientIds,
  sender = null,
  type,
  title,
  subject,
  preview,
  message = '',
  urgent = false,
  eventKey,
  meta = {},
}) {
  const uniqueRecipientIds = [...new Set((recipientIds || []).map((id) => clean(id)).filter(Boolean))];
  if (uniqueRecipientIds.length === 0) return 0;

  const senderPayload = senderDetails(sender);
  const normalizedEventKey = clean(eventKey);
  return upsertNotifications(uniqueRecipientIds.map((recipientId) => ({
    recipientId,
    recipientRole: STUDENT_ROLE,
    ...senderPayload,
    type: clean(type, 'student_update').toLowerCase(),
    title: truncate(title, 220),
    message: truncate(message || subject || title, 400),
    subject: truncate(subject || title, 200),
    preview: truncate(preview || message || subject || title, 220),
    urgent: urgent === true,
    eventKey: normalizedEventKey,
    meta,
  })));
}

async function approvedStudentsForSubject(subjectId) {
  if (!subjectId) return [];
  const rows = await SubjectEnrollment.find({ subjectId, status: 'approved' })
    .select('studentId')
    .lean();
  return rows.map((row) => row.studentId).filter(Boolean);
}

async function resolveAssessmentRecipients(assessment) {
  const explicitlyAssigned = Array.isArray(assessment?.assignedStudentIds)
    ? assessment.assignedStudentIds.filter(Boolean)
    : [];
  if (explicitlyAssigned.length > 0) return explicitlyAssigned;
  return approvedStudentsForSubject(assessment?.subjectId || assessment?.lessonId?.subjectId);
}

async function notifyLessonPublished({ lesson, publisher }) {
  const recipientIds = await approvedStudentsForSubject(lesson?.subjectId);
  return createStudentNotifications({
    recipientIds,
    sender: publisher,
    type: 'lesson_published',
    title: 'New lesson published',
    subject: clean(lesson?.title, 'New lesson'),
    preview: `${clean(publisher?.name, 'Your teacher')} published a new ${clean(lesson?.subject, 'class')} lesson.`,
    eventKey: `lesson:${clean(lesson?._id)}`,
    meta: { route: '/student/lessons', entityType: 'lesson', entityId: clean(lesson?._id) },
  });
}

async function notifyAssessmentAssigned({ assessment, publisher }) {
  const recipientIds = await resolveAssessmentRecipients(assessment);
  const isActivity = clean(assessment?.assessmentMode).toLowerCase() === 'activity';
  const deadline = assessment?.submissionDeadline ? new Date(assessment.submissionDeadline) : null;
  const deadlineText = deadline && !Number.isNaN(deadline.getTime())
    ? ` Due ${deadline.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}.`
    : '';
  return createStudentNotifications({
    recipientIds,
    sender: publisher,
    type: isActivity ? 'activity_assigned' : 'assessment_assigned',
    title: isActivity ? 'New activity assigned' : 'New assessment assigned',
    subject: clean(assessment?.title, isActivity ? 'New activity' : 'New assessment'),
    preview: `${clean(publisher?.name, 'Your teacher')} assigned new work in ${clean(assessment?.subject, 'your class')}.${deadlineText}`,
    eventKey: `assessment:${clean(assessment?._id)}`,
    meta: { route: '/student/activities', entityType: 'assessment', entityId: clean(assessment?._id) },
  });
}

async function notifySubmissionCompleted({ submission, assessment }) {
  const isActivity = clean(assessment?.assessmentMode).toLowerCase() === 'activity';
  return createStudentNotifications({
    recipientIds: [submission?.studentId],
    type: isActivity ? 'activity_submitted' : 'assessment_submitted',
    title: isActivity ? 'Activity submitted successfully' : 'Assessment submitted successfully',
    subject: clean(assessment?.title, isActivity ? 'Activity' : 'Assessment'),
    preview: isActivity
      ? 'Your work was received. You will be notified when your teacher posts a grade or feedback.'
      : 'Your answers were received and your result is now available.',
    eventKey: `submission:${clean(submission?._id)}:${clean(submission?.submittedAt)}`,
    meta: { route: '/student/activities', entityType: 'submission', entityId: clean(submission?._id) },
  });
}

async function notifyAutomatedGrade({ submission, assessment }) {
  const total = Number(submission?.totalPoints || 0);
  if (total <= 0) return 0;
  const score = Number(submission?.score || 0);
  return createStudentNotifications({
    recipientIds: [submission?.studentId],
    type: 'grade_released',
    title: 'Grade released',
    subject: clean(assessment?.title, 'Assessment result'),
    preview: `Your score is ${score} out of ${total}.`,
    eventKey: `auto-grade:${clean(submission?._id)}:${score}:${total}`,
    meta: { route: '/student/dashboard?section=grades', entityType: 'submission', entityId: clean(submission?._id) },
  });
}

async function syncUpcomingDeadlines(studentId) {
  const now = new Date();
  const deadlineLimit = new Date(now.getTime() + UPCOMING_DEADLINE_WINDOW_MS);
  const approvedSubjectIds = (await SubjectEnrollment.find({ studentId, status: 'approved' })
    .select('subjectId')
    .lean()).map((row) => row.subjectId).filter(Boolean);

  const assessments = await Assessment.find({
    submissionDeadline: { $gt: now, $lte: deadlineLimit },
    $or: [
      { assignedStudentIds: studentId },
      ...(approvedSubjectIds.length > 0 ? [{ assignedStudentIds: { $size: 0 }, subjectId: { $in: approvedSubjectIds } }] : []),
    ],
  }).select('_id title subject assessmentMode submissionDeadline').lean();
  if (assessments.length === 0) return;

  const submittedIds = new Set((await Submission.find({
    studentId,
    assessmentId: { $in: assessments.map((row) => row._id) },
    status: { $in: ['completed', 'auto_submitted', 'terminated'] },
  }).select('assessmentId').lean()).map((row) => clean(row.assessmentId)));

  await Promise.all(assessments
    .filter((assessment) => !submittedIds.has(clean(assessment._id)))
    .map((assessment) => createStudentNotifications({
      recipientIds: [studentId],
      type: 'deadline_upcoming',
      title: 'Upcoming submission deadline',
      subject: clean(assessment.title, 'Assigned work'),
      preview: `Due ${new Date(assessment.submissionDeadline).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}.`,
      urgent: true,
      eventKey: `deadline:${clean(assessment._id)}:${new Date(assessment.submissionDeadline).toISOString()}`,
      meta: { route: '/student/activities', entityType: 'assessment', entityId: clean(assessment._id) },
    })));
}

async function syncGradesAndFeedback(studentId) {
  const submissions = await Submission.find({
    studentId,
    $or: [
      { gradeValue: { $exists: true, $ne: null } },
      { teacherFeedback: { $exists: true, $nin: ['', null] } },
    ],
  }).populate('assessmentId', 'title assessmentMode').sort({ updatedAt: -1 }).limit(50).lean();

  const tasks = [];
  submissions.forEach((submission) => {
    const assessmentTitle = clean(submission?.assessmentId?.title, 'Activity');
    if (submission.gradeValue !== null && submission.gradeValue !== undefined) {
      tasks.push(createStudentNotifications({
        recipientIds: [studentId],
        type: 'grade_updated',
        title: 'Grade released or updated',
        subject: assessmentTitle,
        preview: `Your teacher posted a grade of ${submission.gradeValue}.`,
        eventKey: `teacher-grade:${clean(submission._id)}:${submission.gradeValue}:${clean(submission.gradedAt)}`,
        meta: { route: '/student/dashboard?section=grades', entityType: 'submission', entityId: clean(submission._id) },
      }));
    }
    const feedback = clean(submission.teacherFeedback);
    if (feedback) {
      tasks.push(createStudentNotifications({
        recipientIds: [studentId],
        type: 'teacher_feedback',
        title: 'Teacher feedback received',
        subject: assessmentTitle,
        preview: truncate(feedback, 220),
        eventKey: `feedback:${clean(submission._id)}:${hashValue(feedback)}`,
        meta: { route: '/student/activities', entityType: 'submission', entityId: clean(submission._id) },
      }));
    }
  });
  await Promise.all(tasks);
}

async function syncRecommendation(studentId) {
  const recommendation = await Recommendation.findOne({ studentId }).lean();
  const attempts = Array.isArray(recommendation?.assessmentAttempts) ? recommendation.assessmentAttempts : [];
  if (attempts.length === 0) return;
  const strand = clean(recommendation?.recommendedStrand?.name);
  const isReady = Boolean(strand);
  const progress = Math.min(100, Math.round((attempts.length / 4) * 100));
  await createStudentNotifications({
    recipientIds: [studentId],
    type: isReady ? 'recommendation_ready' : 'recommendation_progress',
    title: isReady ? 'New strand recommendation' : 'Recommendation progress updated',
    subject: isReady ? `${strand} is your recommended strand` : `${progress}% complete`,
    preview: isReady
      ? 'Your strand recommendation is ready. Open your dashboard to review the result.'
      : `You have completed ${attempts.length} of 4 grading assessments.`,
    eventKey: `recommendation:${isReady ? strand : 'progress'}:${attempts.length}`,
    meta: { route: '/student/dashboard?section=recommendations', entityType: 'recommendation', entityId: clean(recommendation?._id) },
  });
}

async function syncStudentNotifications(studentId) {
  await Promise.all([
    syncUpcomingDeadlines(studentId),
    syncGradesAndFeedback(studentId),
    syncRecommendation(studentId),
  ]);
}

async function safelyRunNotificationTask(label, task) {
  try {
    return await task();
  } catch (error) {
    console.error(`[NOTIFICATIONS] ${label} failed:`, error?.message || error);
    return null;
  }
}

module.exports = {
  notifyAssessmentAssigned,
  notifyAutomatedGrade,
  notifyLessonPublished,
  notifySubmissionCompleted,
  safelyRunNotificationTask,
  syncStudentNotifications,
};
