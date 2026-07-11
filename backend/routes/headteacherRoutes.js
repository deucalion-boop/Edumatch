const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { lessonUpload } = require('../utils/uploadMiddleware');
const {
  getManagedTeachers,
  createTeacherAccount,
  updateManagedTeacher,
  getManagedTeacherStudents,
  getManagedTeacherLessons,
  createManagedTeacherLesson,
  getManagedTeacherAssessments,
  createManagedTeacherAssessment,
  updateManagedTeacherAssessment,
} = require('../controllers/headteacherController');
const { getAiStatus, generateAssessmentWithAi } = require('../controllers/aiController');
const { getHeadTeacherAttendanceOverview } = require('../controllers/attendanceController');
const { getSectionDirectory } = require('../controllers/sectionController');

const router = express.Router();

router.use(authMiddleware, roleMiddleware('headteacher'));

router.get('/teachers', getManagedTeachers);
router.get('/sections', getSectionDirectory);
router.get('/teachers/:id/students', getManagedTeacherStudents);
router.get('/attendance', getHeadTeacherAttendanceOverview);
router.get('/lessons', getManagedTeacherLessons);
router.post('/lessons', lessonUpload.fields([{ name: 'lessonPlanFile', maxCount: 1 }]), createManagedTeacherLesson);
router.get('/assessments', getManagedTeacherAssessments);
router.post('/assessments', createManagedTeacherAssessment);
router.put('/assessments/:id', updateManagedTeacherAssessment);
router.get('/ai/status', getAiStatus);
router.post('/assessments/ai-generate', generateAssessmentWithAi);
router.post('/teachers', createTeacherAccount);
router.put('/teachers/:id', updateManagedTeacher);

module.exports = router;
