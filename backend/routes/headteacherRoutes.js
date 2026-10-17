const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { lessonUpload, uploadProfileImage } = require('../utils/uploadMiddleware');
const {
  getManagedTeachers,
  createTeacherAccount,
  createStudentAccount,
  updateManagedTeacher,
  getManagedTeacherStudents,
  getManagedTeacherLessons,
  createManagedTeacherLesson,
  getManagedTeacherAssessments,
  createManagedTeacherAssessment,
  updateManagedTeacherAssessment,
  sendManagedTeacherAnnouncement,
} = require('../controllers/headteacherController');
const { getAiStatus, generateAssessmentWithAi } = require('../controllers/aiController');
const { getHeadTeacherAttendanceOverview } = require('../controllers/attendanceController');
const { getSectionDirectory } = require('../controllers/sectionController');
const { aiLimiter, inviteLimiter, uploadLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();
const teacherInvitation = require('../controllers/teacherInvitationController');

router.use(authMiddleware, roleMiddleware('headteacher'));
const profileController = require('../controllers/headteacherProfileController');
router.get('/profile', profileController.get);
router.put('/profile', uploadLimiter, uploadProfileImage.single('profileImage'), profileController.update);
router.use('/student-registry', require('./studentRegistryRoutes').management);
router.post('/students/registration-links', inviteLimiter, require('../controllers/studentPrivateRegistrationController').create);
router.post('/teachers/registration-links', inviteLimiter, require('../controllers/teacherPrivateRegistrationController').create);
router.get('/teachers/registration-links', require('../controllers/teacherPrivateRegistrationController').list);
router.post('/teachers/registration-links/:id/revoke', require('../controllers/teacherPrivateRegistrationController').revoke);
router.delete('/teachers/registration-links/:id', require('../controllers/teacherPrivateRegistrationController').remove);
router.get('/students/registration-links', require('../controllers/studentReusableRegistrationController').headTeacherList);
router.post('/students/registration-links/:id/revoke', require('../controllers/studentReusableRegistrationController').revoke);
router.delete('/students/registration-links/:id', require('../controllers/studentReusableRegistrationController').remove);

router.get('/teacher-invitations', teacherInvitation.list);
router.post('/teacher-invitations', inviteLimiter, teacherInvitation.create);
router.post('/teacher-invitations/:id/resend', inviteLimiter, teacherInvitation.resend);
router.post('/teacher-invitations/:id/revoke', inviteLimiter, teacherInvitation.revoke);

router.get('/teachers', getManagedTeachers);
router.get('/sections', getSectionDirectory);
router.get('/teachers/:id/students', getManagedTeacherStudents);
router.get('/attendance', getHeadTeacherAttendanceOverview);
router.get('/lessons', getManagedTeacherLessons);
router.post('/lessons', uploadLimiter, lessonUpload.fields([{ name: 'lessonPlanFile', maxCount: 1 }]), createManagedTeacherLesson);
router.get('/assessments', getManagedTeacherAssessments);
router.post('/assessments', createManagedTeacherAssessment);
router.put('/assessments/:id', updateManagedTeacherAssessment);
router.get('/ai/status', getAiStatus);
router.post('/assessments/ai-generate', aiLimiter, generateAssessmentWithAi);
router.post('/teachers', inviteLimiter, createTeacherAccount);
router.post('/students', inviteLimiter, createStudentAccount);
router.put('/teachers/:id', updateManagedTeacher);
router.post('/teachers/:id/announcements', sendManagedTeacherAnnouncement);

module.exports = router;
