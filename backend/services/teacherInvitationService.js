const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { getSupabaseStorageClient } = require('./supabaseStorageService');
const { sendEmailViaGmail } = require('./gmailService');
const { assertTeacherEmail } = require('../utils/emailPolicy');
const { nameError } = require('../utils/teacherValidation');
const { assertPasswordMeetsPolicy } = require('../utils/passwordPolicy');

const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$/;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const INVITATION_ERRORS = {
  INVITATION_INVALID: ['This teacher invitation is invalid. Ask your Head Teacher for a new link.', 404],
  INVITATION_EXPIRED: ['This teacher invitation has expired. Ask your Head Teacher to resend it.', 410],
  INVITATION_ACCEPTED: ['This teacher invitation has already been accepted. Sign in to your account.', 409],
  INVITATION_REVOKED: ['This teacher invitation has been revoked. Ask your Head Teacher for a new link.', 410],
  ISSUER_UNAVAILABLE: ['The Head Teacher or department assignment is no longer available. Ask for a new invitation.', 403],
  EMAIL_MISMATCH: ['Use the email address specified in this invitation.', 400],
  EMAIL_VERIFICATION_REQUIRED: ['Verify your email address again before creating your account.', 400],
  EMAIL_CODE_INVALID: ['The verification code is incorrect. Check your email and try again.', 400],
  EMAIL_CODE_EXPIRED: ['The verification code has expired. Request a new code.', 400],
  EMAIL_CODE_LOCKED: ['Too many incorrect verification codes. Request a new code when the resend timer ends.', 429],
  INVITATION_COOLDOWN: ['Please wait 60 seconds before resending this invitation or verification code.', 429],
  USERNAME_TAKEN: ['This username is already taken. Choose another username.', 409],
  EMAIL_TAKEN: ['An account already uses this email address. Sign in or reset your password.', 409],
  INPUT_INVALID: ['Check the invitation details and try again.', 400],
};

function fail(message, statusCode = 400, code = 'TEACHER_INVITATION_INVALID') {
  return Object.assign(new Error(message), { statusCode, code, teacherInvitationError: true });
}
function knownError(code) { return fail(...INVITATION_ERRORS[code], code); }
function databaseError(error) {
  const code = Object.keys(INVITATION_ERRORS).find(key => String(error?.message || '').includes(key));
  if (code) return knownError(code);
  if (error?.code === '23505') {
    return knownError(String(error.message || '').includes('username') ? 'USERNAME_TAKEN' : 'EMAIL_TAKEN');
  }
  if (['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error?.code)) {
    return fail('Teacher invitations need a database update. Ask your administrator to complete the teacher invitation setup.',
      503, 'TEACHER_INVITATION_SCHEMA_REQUIRED');
  }
  return fail('Teacher invitations are temporarily unavailable. Please try again later.', 503, 'TEACHER_INVITATION_UNAVAILABLE');
}
async function result(query) {
  try {
    const { data, error } = await query;
    if (error) throw databaseError(error);
    return data;
  } catch (error) {
    throw error.teacherInvitationError ? error : databaseError(error);
  }
}
function client() {
  try { return getSupabaseStorageClient(); } catch (error) { throw databaseError(error); }
}
function secret() {
  const value = process.env.TEACHER_INVITATION_SECRET || process.env.CLASS_INVITATION_SECRET || process.env.JWT_SECRET || '';
  if (value.length < 32) throw fail('Teacher invitations are not configured. Contact your administrator.', 503);
  return value;
}
function digest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function invitationToken(id, nonce) {
  return crypto.createHmac('sha256', secret()).update(`teacher-invitation:v1:${id}:${nonce}`).digest('hex');
}
function codeHash(tokenHash, email, challengeId, code) {
  return crypto.createHmac('sha256', secret()).update(`teacher-invitation-email:v1:${tokenHash}:${email}:${challengeId}:${code}`).digest('hex');
}
function invitationUrl(row) {
  const configured = String(process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
  let url;
  try { url = new URL(configured); } catch { throw fail('Configure the frontend URL before using teacher invitations.', 503); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw fail('Configure a valid frontend URL before using teacher invitations.', 503);
  }
  return `${configured}/auth/teacher-register/${invitationToken(row.id, row.token_nonce)}`;
}
function cleanName(value, optional = false) {
  if (value !== undefined && typeof value !== 'string') throw fail('Enter a valid teacher name.');
  const name = String(value || '').normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (optional && !name) return '';
  const error = nameError(name, 'Full name', 100);
  if (error) throw fail(error);
  return name;
}
function expiresHours(value = 48) {
  const hours = Number(value);
  if (!Number.isInteger(hours) || hours < 1 || hours > 48) throw fail('Invitation expiry must be between 1 and 48 hours.');
  return hours;
}
function inputBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw fail('Enter valid invitation details.');
  return value;
}
function tokenDigest(token) {
  if (typeof token !== 'string' || !TOKEN_PATTERN.test(token)) throw knownError('INVITATION_INVALID');
  return digest(token);
}
function invitationId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw knownError('INVITATION_INVALID');
  return value;
}
async function requireHeadTeacher(id) {
  const row = await result(client().from('users').select('id,role,status,archive,department').eq('id', id).maybeSingle());
  if (!row || row.role !== 'headteacher' || row.status !== 'active' || row.archive?.isArchived === true || !String(row.department || '').trim()) {
    throw knownError('ISSUER_UNAVAILABLE');
  }
  return row;
}
async function requireInvitation(token) {
  const hash = tokenDigest(token);
  const row = await result(client().from('teacher_invitations').select('*').eq('token_hash', hash).maybeSingle());
  if (!row) throw knownError('INVITATION_INVALID');
  if (row.status === 'accepted') throw knownError('INVITATION_ACCEPTED');
  if (row.status === 'revoked') throw knownError('INVITATION_REVOKED');
  if (row.status !== 'pending') throw knownError('INVITATION_INVALID');
  if (Date.parse(row.expires_at) <= Date.now()) throw knownError('INVITATION_EXPIRED');
  const issuer = await requireHeadTeacher(row.headteacher_id);
  if (issuer.department !== row.department) throw knownError('ISSUER_UNAVAILABLE');
  return row;
}
function delivery(row) {
  const emailSent = row.delivery_status === 'sent' ? true : row.delivery_status === 'failed' ? false : null;
  return { emailSent, message: emailSent === false ? 'The invitation is ready, but the email could not be delivered. Copy the link or resend it later.' : '' };
}
function mapInvitation(row) {
  const status = row.status === 'accepted' ? 'Accepted' : row.status === 'revoked' ? 'Revoked'
    : Date.parse(row.expires_at) <= Date.now() ? 'Expired' : 'Pending';
  return { id: row.id, name: row.name || '', email: row.email || '', createdAt: row.created_at,
    expiresAt: row.expires_at, acceptedAt: row.accepted_at || null, status,
    invitationUrl: status === 'Pending' ? invitationUrl(row) : '', delivery: delivery(row) };
}
function html(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
async function deliverInvitation(row) {
  if (!row.email) return { invitation: mapInvitation(row), delivery: delivery(row) };
  const link = invitationUrl(row);
  let sent = false;
  try {
    const response = await sendEmailViaGmail({
      to: { email: row.email, name: row.name || 'Teacher' }, subject: 'You are invited to teach on EduMatch',
      text: `Hello ${row.name || 'Teacher'},\n\nYour Head Teacher invited you to the ${row.department} department on EduMatch.\nCreate your own teacher account: ${link}\nThis single-use invitation expires at ${row.expires_at}. You will verify your email before creating your account.`,
      html: `<p>Hello ${html(row.name || 'Teacher')},</p><p>Your Head Teacher invited you to the <strong>${html(row.department)}</strong> department on EduMatch.</p><p><a href="${html(link)}">Create your teacher account</a></p><p>This single-use invitation expires at ${html(row.expires_at)}. You will verify your email before creating your account.</p>`,
      signal: AbortSignal.timeout(15000),
    });
    sent = response?.sent === true;
  } catch { /* Keep the invitation available for copying when email delivery fails. */ }
  const tracking = { delivery_status: sent ? 'sent' : 'failed', email_sent_at: sent ? new Date().toISOString() : null };
  await result(client().from('teacher_invitations').update(tracking).eq('id', row.id).eq('token_nonce', row.token_nonce));
  const mapped = mapInvitation({ ...row, ...tracking });
  return { invitation: mapped, delivery: mapped.delivery };
}
async function listInvitations(headTeacherId) {
  const issuer = await requireHeadTeacher(headTeacherId);
  const invitations = [];
  for (let offset = 0; ; offset += 500) {
    const page = await result(client().from('teacher_invitations').select('*').eq('headteacher_id', headTeacherId).eq('department', issuer.department)
      .order('created_at', { ascending: false }).order('id', { ascending: true }).range(offset, offset + 499));
    invitations.push(...(page || []).map(mapInvitation));
    if ((page || []).length < 500) return invitations;
  }
}
async function createInvitation(headTeacherId, body = {}) {
  await requireHeadTeacher(headTeacherId);
  body = inputBody(body);
  const id = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const name = cleanName(body.name, true);
  const email = body.email === undefined || body.email === '' ? '' : assertTeacherEmail(body.email);
  const hours = expiresHours(body.expiresInHours);
  invitationUrl({ id, token_nonce: nonce }); // Validate URL/secret before creating anything.
  const row = await result(client().rpc('create_teacher_invitation', {
    p_headteacher_id: headTeacherId, p_id: id, p_nonce: nonce, p_token_hash: digest(invitationToken(id, nonce)),
    p_name: name, p_email: email, p_expires_hours: hours,
  }));
  return deliverInvitation(row);
}
async function resendInvitation(headTeacherId, id, body = {}) {
  await requireHeadTeacher(headTeacherId);
  body = inputBody(body);
  invitationId(id);
  const nonce = crypto.randomUUID();
  invitationUrl({ id, token_nonce: nonce });
  const row = await result(client().rpc('renew_teacher_invitation', {
    p_headteacher_id: headTeacherId, p_invitation_id: id, p_nonce: nonce,
    p_token_hash: digest(invitationToken(id, nonce)), p_expires_hours: expiresHours(body.expiresInHours),
  }));
  return deliverInvitation(row);
}
async function revokeInvitation(headTeacherId, id) {
  await requireHeadTeacher(headTeacherId);
  const row = await result(client().rpc('revoke_teacher_invitation', {
    p_headteacher_id: headTeacherId, p_invitation_id: invitationId(id),
  }));
  return mapInvitation(row);
}
async function publicInvitation(token) {
  const row = await requireInvitation(token);
  return { name: row.name || '', email: row.email || '', department: row.department,
    schoolName: String(process.env.SCHOOL_NAME || 'EduMatch'), expiresAt: row.expires_at, status: 'Pending' };
}
async function usernameExists(username) {
  const pattern = username.replace(/[\\%_]/g, '\\$&');
  return Boolean(await result(client().from('users').select('id').ilike('username', pattern).limit(1).maybeSingle()));
}
async function usernameAvailability(token, input) {
  await requireInvitation(token);
  const username = typeof input === 'string' ? input.trim() : '';
  if (!USERNAME_PATTERN.test(username)) return { available: false, valid: false,
    message: 'Use 3–30 characters: letters, numbers, dots, underscores or hyphens. Start with a letter or number.', suggestions: [] };
  if (!(await usernameExists(username))) return { available: true, valid: true, message: 'Username is available.', suggestions: [] };
  const candidates = [...new Set(Array.from({ length: 8 }, () => `${username.slice(0, 24)}${crypto.randomInt(10, 10000)}`))];
  const suggestions = (await Promise.all(candidates.map(async value => (await usernameExists(value)) ? null : value))).filter(Boolean).slice(0, 3);
  return { available: false, valid: true, message: 'This username is already taken. Choose another username.', suggestions };
}
async function sendEmailCode(token, body = {}) {
  const row = await requireInvitation(token);
  body = inputBody(body);
  const email = assertTeacherEmail(body.email);
  if (row.email && row.email !== email) throw knownError('EMAIL_MISMATCH');
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const challengeId = crypto.randomUUID();
  let prepared;
  try {
    prepared = await result(client().rpc('prepare_teacher_invitation_email', {
      p_token_hash: row.token_hash, p_email: email, p_code_hash: codeHash(row.token_hash, email, challengeId, code), p_challenge_id: challengeId,
    }));
  } catch (error) {
    if (error.code === 'INVITATION_COOLDOWN') {
      const sentAt = Date.parse(row.email_code_sent_at);
      const resendAt = Number.isFinite(sentAt) ? sentAt + 60000 : Date.now() + 60000;
      error.verification = { expiresAt: row.email_code_expires_at || null,
        resendAvailableAt: new Date(Math.max(Date.now() + 1000, resendAt)).toISOString() };
    }
    throw error;
  }
  let sent = false;
  try {
    const response = await sendEmailViaGmail({ to: { email, name: row.name || 'Teacher' },
      subject: 'Verify your email for your EduMatch teacher account',
      text: `Your EduMatch teacher registration code is ${code}. It expires in 10 minutes. Do not share this code.`,
      html: `<p>Your EduMatch teacher registration code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. Do not share this code.</p>`,
      signal: AbortSignal.timeout(15000),
    });
    sent = response?.sent === true;
  } catch { /* A failed delivery must not leave a usable verification code. */ }
  if (!sent) {
    await result(client().from('teacher_invitations').update({ email_code_hash: null, email_code_expires_at: null })
      .eq('id', row.id).eq('email_challenge_id', challengeId));
    const error = fail('Unable to send the verification code. Please try again when the resend timer ends.', 502, 'EMAIL_DELIVERY_FAILED');
    error.verification = { expiresAt: null,
      resendAvailableAt: new Date(Date.parse(prepared.email_code_sent_at) + 60000).toISOString() };
    throw error;
  }
  return { verification: { expiresAt: prepared.email_code_expires_at,
    resendAvailableAt: new Date(Date.parse(prepared.email_code_sent_at) + 60000).toISOString() } };
}
async function verifyEmail(token, body = {}) {
  const row = await requireInvitation(token);
  body = inputBody(body);
  const email = assertTeacherEmail(body.email);
  if (row.email && row.email !== email) throw knownError('EMAIL_MISMATCH');
  if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) throw fail('Enter the 6-digit code from your email.');
  if (!row.email_challenge_id) throw knownError('EMAIL_CODE_EXPIRED');
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verified = await result(client().rpc('verify_teacher_invitation_email', {
    p_token_hash: row.token_hash, p_email: email, p_challenge_id: row.email_challenge_id,
    p_code_hash: codeHash(row.token_hash, email, row.email_challenge_id, body.code), p_verification_hash: digest(verificationToken),
  }));
  if (verified?.verified !== true) throw knownError(INVITATION_ERRORS[verified?.code] ? verified.code : 'EMAIL_CODE_INVALID');
  return { verificationToken, verifiedEmail: email, expiresAt: verified.expiresAt };
}
async function registerTeacher(token, body = {}) {
  const row = await requireInvitation(token);
  body = inputBody(body);
  const fullName = cleanName(body.fullName);
  const email = assertTeacherEmail(body.email);
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!USERNAME_PATTERN.test(username)) throw fail('Username must be 3–30 characters, starting with a letter or number. Use letters, numbers, dots, underscores or hyphens.');
  if (row.email && row.email !== email) throw knownError('EMAIL_MISMATCH');
  if (typeof body.password !== 'string' || body.password !== body.confirmPassword) throw fail('Passwords do not match.');
  assertPasswordMeetsPolicy(body.password);
  if (typeof body.verificationToken !== 'string' || !TOKEN_PATTERN.test(body.verificationToken)) throw knownError('EMAIL_VERIFICATION_REQUIRED');
  const passwordHash = await bcrypt.hash(body.password, 12);
  const userId = await result(client().rpc('register_teacher_invitation', {
    p_token_hash: row.token_hash, p_name: fullName, p_email: email, p_username: username,
    p_password_hash: passwordHash, p_verification_hash: digest(body.verificationToken),
  }));
  return { registered: true, user: { id: userId, name: fullName, role: 'teacher', department: row.department } };
}

module.exports = { createInvitation, listInvitations, resendInvitation, revokeInvitation, publicInvitation,
  usernameAvailability, sendEmailCode, verifyEmail, registerTeacher, invitationToken, codeHash, digest, databaseError };
