const crypto = require('node:crypto');
const { createSupabaseAccount, deleteSupabaseAccount } = require('../services/supabaseAccountService');
const { issueInviteForUser } = require('../services/userManagementService');
const { sendSuccess } = require('../utils/responseHelper');

async function create(req, res, next) {
  try {
    const headTeacher = req.user;
    if (headTeacher.role !== 'headteacher' || headTeacher.status !== 'active' || !headTeacher.department) {
      throw Object.assign(new Error('An active Head Teacher with an assigned department is required.'), { statusCode: 403 });
    }
    const nonce = crypto.randomBytes(12).toString('hex');
    const teacher = await createSupabaseAccount({
      name: 'Pending teacher registration', email: `edumatch.invite+${nonce}@gmail.com`, username: `invite_${nonce}`,
      role: 'teacher', status: 'pending', department: headTeacher.department, subject: headTeacher.department,
      managedBy: headTeacher._id,
    });
    try {
      const invite = await issueInviteForUser({ user: teacher, req, privateRegistration: true, shareOnly: true });
      teacher.invite.teacherRegistration = { headTeacherId: String(headTeacher._id), department: headTeacher.department };
      await teacher.save();
      return sendSuccess(res, 201, 'Private teacher registration link created. Share it with one teacher.', { invite, department: headTeacher.department });
    } catch (error) { await deleteSupabaseAccount(teacher._id); throw error; }
  } catch (error) { return next(error); }
}

module.exports = { create };
