const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { lessonUpload, uploadProfileImage, uploadTeacherAssessmentFiles } = require('../utils/uploadMiddleware');
const {
  createTeacherClass,
  updateTeacherClass,
  deleteTeacherClass,
  createLesson,
  getTeacherLessons,
  updateTeacherLesson,
  copyTeacherLessonToClasses,
  getTeacherSubjects,
  getTeacherAssessments,
  updateTeacherAssessment,
  copyTeacherAssessmentToClasses,
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
} = require('../controllers/teacherController');
const { getAiStatus, generateAssessmentWithAi } = require('../controllers/aiController');
const {
  getTeacherAttendanceRoster,
  listTeacherAttendanceRecords,
  saveTeacherAttendance,
  lockTeacherAttendance,
} = require('../controllers/attendanceController');
const { getSectionDirectory } = require('../controllers/sectionController');
const { aiLimiter, uploadLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('teacher'));

router.post(
  '/lessons',
  uploadLimiter,
  lessonUpload.fields([{ name: 'lessonPlanFile', maxCount: 1 }]),
  createLesson
);
router.post('/subjects', createTeacherClass);
router.get('/lessons', getTeacherLessons);
router.patch('/lessons/:id', updateTeacherLesson);
router.post('/lessons/:id/classes', copyTeacherLessonToClasses);
router.get('/subjects', getTeacherSubjects);
router.patch('/subjects/:subjectId', updateTeacherClass);
router.delete('/subjects/:subjectId', deleteTeacherClass);
router.get('/sections', getSectionDirectory);
router.get('/lessons/:id/download', downloadTeacherLessonPdf);
router.get('/lessons/:id/attachments/:attachmentId/download', downloadTeacherLessonAttachment);

router.post(
  '/assessments',
  uploadLimiter,
  uploadTeacherAssessmentFiles.fields([{ name: 'attachments', maxCount: 5 }]),
  createAssessment
);
router.get('/assessments', getTeacherAssessments);
router.patch('/assessments/:id', updateTeacherAssessment);
router.post('/assessments/:id/classes', copyTeacherAssessmentToClasses);
router.put('/assessments/:id/questions', updateAssessmentQuestions);
router.get('/assessments/:id/results', getAssessmentResultsSummary);
router.get('/students', getTeacherStudents);
router.post('/students', createStudentInvite);
router.get('/subjects/:subjectId/students', getTeacherSubjectStudents);
router.delete('/subjects/:subjectId/students/:studentId', removeTeacherSubjectStudent);
router.get('/students/assessment-results', getTeacherStudentAssessmentResults);
router.get('/enrollment-requests', getEnrollmentRequests);
router.patch('/enrollment-requests/:studentId/accept', approveEnrollmentRequest);
router.patch('/enrollment-requests/:studentId/reject', rejectEnrollmentRequest);
router.get('/attendance/roster', getTeacherAttendanceRoster);
router.get('/attendance', listTeacherAttendanceRecords);
router.post('/attendance', saveTeacherAttendance);
router.patch('/attendance/:id/lock', lockTeacherAttendance);
router.get('/profile', getTeacherProfile);
router.put('/profile', uploadLimiter, uploadProfileImage.single('profileImage'), updateTeacherProfile);
router.patch('/tour-preference', updateTeacherTourPreference);

router.get('/ai/status', getAiStatus);
router.post('/assessments/ai-generate', aiLimiter, generateAssessmentWithAi);

module.exports = router;
