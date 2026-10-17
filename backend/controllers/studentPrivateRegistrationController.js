const { findSupabaseAccount } = require('../services/supabaseAccountService');
const { createStudentRegistrationLink, listStudentRegistrationLinks } = require('../services/studentPrivateRegistrationService');
const { sendSuccess } = require('../utils/responseHelper');

async function create(req, res, next) {
  try {
    let teacher = req.user;
    if (req.user.role === 'headteacher') {
      teacher = await findSupabaseAccount('id', String(req.body?.teacherId || '').trim());
      if (!teacher || teacher.role !== 'teacher' || teacher.department !== req.user.department
        || String(teacher.managedBy || '') !== String(req.user._id)) {
        throw Object.assign(new Error('Select an advisory teacher managed by your department.'), { statusCode: 404 });
      }
    } else if (req.user.role !== 'teacher') {
      throw Object.assign(new Error('Only teachers and Head Teachers can create student registration links.'), { statusCode: 403 });
    }
    const data = req.user.role === 'teacher'
      ? await require('./studentReusableRegistrationController').createForTeacher(teacher, req)
      : await createStudentRegistrationLink({ teacher, req });
    return sendSuccess(res, 201, data.invite.multipleAccounts ? 'Reusable student registration link created.' : 'Private student registration link created. Share it with one student.', data);
  } catch (error) { return next(error); }
}

async function list(req, res, next) {
  try {
    const links = [
      ...await require('./studentReusableRegistrationController').listForTeacher(req.user, req),
      ...await listStudentRegistrationLinks(req.user),
    ];
    return sendSuccess(res, 200, 'Student registration links fetched.', { links });
  } catch (error) { return next(error); }
}

module.exports = { create, list };
