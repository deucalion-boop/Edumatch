const crypto = require('node:crypto');
const { createSupabaseAccount, deleteSupabaseAccount } = require('./supabaseAccountService');
const { getSectionOrThrow, ensureTeacherAdvisoryClass } = require('./sectionService');
const { saveApprovedEnrollment } = require('./supabaseEnrollmentService');
const { issueInviteForUser } = require('./userManagementService');

async function createStudentRegistrationLink({ teacher, req }) {
  if (teacher?.role !== 'teacher' || teacher.status !== 'active' || teacher.archive?.isArchived === true) {
    throw Object.assign(new Error('An active advisory teacher is required.'), { statusCode: 409 });
  }
  const section = await getSectionOrThrow(teacher.advisorySectionId);
  const advisoryClass = await ensureTeacherAdvisoryClass(teacher);
  const teacherId = String(teacher._id || teacher.id);
  const nonce = crypto.randomBytes(12).toString('hex');
  const now = new Date();
  const student = await createSupabaseAccount({
    name: 'Pending student registration',
    email: `edumatch.invite+${nonce}@gmail.com`,
    username: `invite_${nonce}`,
    role: 'student', status: 'pending', gradeLevel: 'Grade 10',
    sectionId: section.id, department: teacher.department || '', managedBy: teacherId,
    enrollment: { teacherId, status: 'approved', requestedAt: now, approvedAt: now },
  });
  try {
    const invite = await issueInviteForUser({ user: student, req, privateRegistration: true, shareOnly: true });
    student.invite.studentRegistration = { teacherId, sectionId: section.id };
    await student.save();
    await saveApprovedEnrollment({ studentId: student._id, subjectId: advisoryClass.id, teacherId,
      sectionId: section.id, sectionName: section.name });
    return { invite, advisoryClass: { id: advisoryClass.id, className: advisoryClass.className },
      section: { id: section.id, name: section.name } };
  } catch (error) {
    await deleteSupabaseAccount(student._id);
    throw error;
  }
}

module.exports = { createStudentRegistrationLink };
