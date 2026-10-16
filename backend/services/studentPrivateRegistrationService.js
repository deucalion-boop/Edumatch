const crypto = require('node:crypto');
const { createSupabaseAccount, deleteSupabaseAccount } = require('./supabaseAccountService');
const { getSectionOrThrow, ensureTeacherAdvisoryClass } = require('./sectionService');
const { saveApprovedEnrollment } = require('./supabaseEnrollmentService');
const { issueInviteForUser } = require('./userManagementService');
const { getSupabaseStorageClient } = require('./supabaseStorageService');

function linkKey() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) throw Object.assign(new Error('Private registration links require a configured server secret.'), { statusCode: 503 });
  return crypto.createHash('sha256').update(`student-private-link:v1:${secret}`).digest();
}
function sealLink(link, studentId) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', linkKey(), iv);
  cipher.setAAD(Buffer.from(String(studentId)));
  const encrypted = Buffer.concat([cipher.update(link, 'utf8'), cipher.final()]);
  return { iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), value: encrypted.toString('hex') };
}
function openLink(sealed, studentId) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', linkKey(), Buffer.from(sealed.iv, 'hex'));
  decipher.setAAD(Buffer.from(String(studentId)));
  decipher.setAuthTag(Buffer.from(sealed.tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(sealed.value, 'hex')), decipher.final()]).toString('utf8');
}

async function listStudentRegistrationLinks(teacher) {
  const teacherId = String(teacher._id || teacher.id);
  const sectionId = String(teacher.advisorySectionId || '');
  if (!sectionId) return [];
  const links = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await getSupabaseStorageClient().from('users')
      .select('id,invite').eq('role', 'student').eq('status', 'pending').eq('managed_by', teacherId)
      .order('created_at', { ascending: false }).range(offset, offset + 499);
    if (error) throw Object.assign(new Error('Unable to load student registration links.'), { statusCode: 503 });
    for (const student of data || []) {
      const invite = student.invite;
      const registration = invite?.studentRegistration;
      if (!registration?.sealedLink || registration.teacherId !== teacherId || registration.sectionId !== sectionId
        || !invite.tokenHash || invite.usedAt || Date.parse(invite.expiresAt) <= Date.now()) continue;
      try {
        links.push({ id: student.id, subjectId: registration.subjectId,
          inviteLink: openLink(registration.sealedLink, student.id), expiresAt: invite.expiresAt });
      } catch { /* Links encrypted with a retired secret cannot be recovered. */ }
    }
    if ((data || []).length < 500) return links;
  }
}

async function createStudentRegistrationLink({ teacher, req }) {
  linkKey();
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
    student.invite.studentRegistration = { teacherId, sectionId: section.id, subjectId: advisoryClass.id,
      sealedLink: sealLink(invite.inviteLink, student._id) };
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

module.exports = { createStudentRegistrationLink, listStudentRegistrationLinks };
