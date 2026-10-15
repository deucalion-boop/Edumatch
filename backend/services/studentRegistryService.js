const crypto = require('node:crypto');
const ExcelJS = require('exceljs');
const { getSupabaseStorageClient } = require('./supabaseStorageService');
const { parseWorkbook, MAX_FILE_BYTES, cleanText, normalizeName } = require('./classInvitationService');
const { assertTeacherEmail } = require('../utils/emailPolicy');
const { assertPasswordMeetsPolicy } = require('../utils/passwordPolicy');
const { sendEmailViaGmail } = require('./gmailService');

const HEX = /^[a-f0-9]{64}$/;
const USERNAME = /^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$/;
const messages = {
  INPUT_INVALID: ['Check the student details and try again.', 400],
  REGISTRY_DUPLICATE: ['A student with this full name already exists. Review the import preview.', 409],
  REGISTRY_NOT_FOUND: ['Student record not found.', 404],
  STUDENT_REGISTERED: ['This student has already registered. Sign in to the existing account.', 409],
  CODE_INVALID: ['The registration code and full name do not match. Check the details from your school.', 400],
  NAME_NOT_FOUND: ['Your full name was not found on this school registration. Check the spelling or ask your school for help.', 400],
  CODE_EXPIRED: ['This registration code has expired. Ask your Head Teacher for a new code.', 410],
  CODE_REVOKED: ['This registration code has been revoked. Ask your Head Teacher for help.', 410],
  SESSION_INVALID: ['Verify your registration code and full name again.', 400],
  SESSION_EXPIRED: ['Your registration session has expired. Verify your code again.', 410],
  CLAIM_IN_PROGRESS: ['Registration is already in progress for this student. Wait a moment and retry.', 409],
  CLAIM_INVALID: ['Registration could not be completed. Verify your code again.', 409],
  EMAIL_VERIFICATION_REQUIRED: ['Verify your email address before registering.', 400],
  EMAIL_CODE_INVALID: ['The email verification code is incorrect.', 400],
  EMAIL_CODE_EXPIRED: ['The email verification code has expired. Request another code.', 400],
  EMAIL_CODE_LOCKED: ['Too many incorrect codes. Request another code after the resend timer.', 429],
  USERNAME_TAKEN: ['This username is already taken. Choose another username.', 409],
  EMAIL_TAKEN: ['An account already uses this email address. Sign in or reset your password.', 409],
  AUTH_EMAIL_UNVERIFIED: ['Verify your email before registering.', 400],
  AUTH_IDENTITY_INVALID: ['The account identity could not be verified. Please try again.', 409],
  CLASS_UNAVAILABLE: ['A class or teacher assignment is unavailable. Contact your school to update the student’s class assignments.', 409],
  ISSUER_UNAVAILABLE: ['Only an active Head Teacher can manage the student registry.', 403],
  INVITATION_INVALID: ['This registration link is unavailable. Ask your school for the current link.', 404],
  INVITATION_EXPIRED: ['This registration link has expired. Ask your school for the current link.', 410],
  INVITATION_COOLDOWN: ['Wait 60 seconds before requesting another email code.', 429],
};
const fail = (message, statusCode = 400, code = 'REGISTRY_INPUT_INVALID') => Object.assign(new Error(message), { statusCode, code, registryError: true });
const known = code => fail(...messages[code], code);
function inputBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw known('INPUT_INVALID');
  return value;
}
function databaseError(error) {
  if (error?.registryError) return error;
  const code = Object.keys(messages).find(key => String(error?.message || '').includes(key));
  if (code) return known(code);
  if (error?.code === '23505') return known(String(error.message).includes('username') ? 'USERNAME_TAKEN'
    : String(error.message).includes('email') ? 'EMAIL_TAKEN' : 'REGISTRY_DUPLICATE');
  if (['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205'].includes(error?.code)) {
    return fail('Student registry setup is incomplete. Ask your administrator to apply database migration 019.', 503, 'REGISTRY_SCHEMA_REQUIRED');
  }
  return fail('The student registry is temporarily unavailable. Please try again later.', 503, 'REGISTRY_UNAVAILABLE');
}
function client() { try { return getSupabaseStorageClient(); } catch (e) { throw databaseError(e); } }
async function result(query) {
  try { const { data, error } = await query; if (error) throw error; return data; } catch (e) { throw databaseError(e); }
}
const rpc = (name, args) => result(client().rpc(`student_registry_${name}`, args));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function secret() {
  const value = process.env.STUDENT_REGISTRY_SECRET || process.env.JWT_SECRET || '';
  if (value.length < 32) throw fail('Student registration is not configured. Contact your administrator.', 503);
  return value;
}
const hmac = value => crypto.createHmac('sha256', secret()).update(value).digest('hex');
const linkToken = nonce => hmac(`student-registry-link:v1:school:${nonce}`);
const registrationCode = row => hmac(`student-registry-code:v1:${row.id}:${row.code_nonce}`).slice(0, 32).toUpperCase();
function formattedCode(row) { return registrationCode(row).match(/.{8}/g).join('-'); }
function hashToken(token, type = 'INVITATION_INVALID') {
  if (typeof token !== 'string' || !HEX.test(token)) throw known(type);
  return digest(token);
}
function url(row) {
  const base = String(process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
  let parsed; try { parsed = new URL(base); } catch { throw fail('Configure the frontend URL before using student registration.', 503); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw fail('Configure a valid frontend URL.', 503);
  return { url: `${base}/auth/student-register/${linkToken(row.token_nonce)}`, expiresAt: row.expires_at };
}
async function requireHeadTeacher(id) {
  const user = await result(client().from('users').select('id,role,status,archive,department').eq('id', String(id)).maybeSingle());
  if (!user || user.role !== 'headteacher' || user.status !== 'active' || user.archive?.isArchived === true) throw known('ISSUER_UNAVAILABLE');
  return user;
}
async function all(table, columns = '*', filter = q => q) {
  const records = [];
  for (let offset = 0; ; offset += 500) {
    const data = await result(filter(client().from(table).select(columns)).order('id').range(offset, offset + 499));
    records.push(...(data || []));
    if ((data || []).length < 500) return records;
  }
}
// Assignment table uses a composite key, so it is paginated separately.
async function assignments() {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const data = await result(client().from('student_registry_assignments').select('*').order('registry_id').order('subject_id').range(offset, offset + 499));
    rows.push(...(data || [])); if ((data || []).length < 500) return rows;
  }
}
async function manageLink(id, body = {}) {
  await requireHeadTeacher(id);
  body = inputBody(body);
  if (body.rotate !== undefined && typeof body.rotate !== 'boolean') throw known('INPUT_INVALID');
  const nonce = crypto.randomBytes(24).toString('hex');
  const row = await rpc('link', { p_headteacher_id: id, p_nonce: nonce, p_token_hash: digest(linkToken(nonce)), p_rotate: body.rotate === true, p_days: 30 });
  return { registrationLink: url(row) };
}
function status(row) {
  return row.student_id || row.code_used_at ? 'registered' : row.code_revoked_at ? 'revoked'
    : row.code_expires_at && Date.parse(row.code_expires_at) <= Date.now() ? 'expired' : 'pending';
}
function matches(row, filters) {
  const search = cleanText(filters.search).toLowerCase();
  return (!filters.status || row.status === filters.status)
    && (filters.unassigned !== 'true' || row.assignments.length === 0)
    && (!search || [row.fullName, row.email, row.username, ...row.assignments.flatMap(a => [a.teacherName, a.className, a.subjectName])].join(' ').toLowerCase().includes(search));
}
async function list(id, filters = {}) {
  const headTeacher = await requireHeadTeacher(id);
  if (filters.status && !['pending', 'registered', 'revoked', 'expired'].includes(filters.status)) throw known('INPUT_INVALID');
  const [registry, membership, subjects, users, link] = await Promise.all([
    all('student_registry'), assignments(), all('subjects'), all('users', 'id,name,role,status,archive,username,email,department'), manageLink(id),
  ]);
  const people = new Map(users.map(u => [u.id, u]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const classes = subjects.filter(s => s.is_active && people.get(s.teacher_id)?.role === 'teacher'
    && people.get(s.teacher_id)?.status === 'active' && people.get(s.teacher_id)?.archive?.isArchived !== true
    && people.get(s.teacher_id)?.department === headTeacher.department)
    .map(s => ({ id: s.id, teacherId: s.teacher_id, teacherName: people.get(s.teacher_id).name, className: s.class_name || s.name, name: s.name }));
  const byRegistry = new Map();
  for (const item of membership) {
    const subject = subjectMap.get(item.subject_id); if (!subject) continue;
    const items = byRegistry.get(item.registry_id) || [];
    items.push({ subjectId: subject.id, teacherId: subject.teacher_id, teacherName: people.get(subject.teacher_id)?.name || 'Teacher', className: subject.class_name || subject.name, subjectName: subject.name });
    byRegistry.set(item.registry_id, items);
  }
  const students = registry.map(row => ({ id: row.id, firstName: row.first_name, lastName: row.last_name, fullName: row.full_name,
    status: status(row), registeredAt: row.code_used_at || (row.student_id ? row.created_at : null), createdAt: row.created_at,
    codeExpiresAt: row.code_expires_at, registrationCode: !row.student_id && !row.code_used_at && !row.code_revoked_at && row.code_nonce ? formattedCode(row) : null,
    username: people.get(row.student_id)?.username || '', email: people.get(row.student_id)?.email || '', assignments: byRegistry.get(row.id) || [] }));
  return { students: students.filter(row => matches(row, filters)), summary: { total: students.length,
    registered: students.filter(s => s.status === 'registered').length, pending: students.filter(s => s.status !== 'registered').length,
    unassigned: students.filter(s => !s.assignments.length).length }, classes, ...link };
}
const similarName = name => normalizeName(name).normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '');
function validateRecords(records, existing) {
  if (!Array.isArray(records) || !records.length || records.length > 1000) throw fail('Import between 1 and 1,000 students.');
  const counts = new Map();
  const possible = new Map();
  const names = new Set(existing.map(row => normalizeName(row.full_name || row.name || row.normalized_name)));
  existing.forEach(row => possible.set(similarName(row.full_name || row.name || row.normalized_name), row.full_name || row.name || row.normalized_name));
  records.forEach(row => { const full = cleanText(`${cleanText(row?.firstName)} ${cleanText(row?.lastName)}`); counts.set(normalizeName(full), (counts.get(normalizeName(full)) || 0) + 1); });
  return records.map((row, index) => {
    const firstName = cleanText(row?.firstName), lastName = cleanText(row?.lastName), fullName = cleanText(`${firstName} ${lastName}`);
    const errors = Array.isArray(row?.cellErrors) ? row.cellErrors.filter(e => typeof e === 'string').slice(0, 5) : [];
    for (const [label, value] of [['First Name', firstName], ['Last Name', lastName]]) {
      if (!value || value.length > 100 || !/\p{L}/u.test(value) || /[\x00-\x1f\x7f]/.test(value)) errors.push(`${label} is required, must contain letters, and must be at most 100 characters.`);
    }
    if (fullName.length > 150 || fullName.length < 3) errors.push('Full name must be 3–150 characters.');
    const normalized = normalizeName(fullName), key = similarName(fullName);
    if (counts.get(normalized) > 1) errors.push('Duplicate full name in this file.');
    if (names.has(normalized)) errors.push('This student already exists in the school registry or an existing student list.');
    const warnings = [];
    if (!errors.length && possible.has(key) && normalizeName(possible.get(key)) !== normalized) warnings.push(`Possible duplicate of ${possible.get(key)}. Check the spelling before importing.`);
    possible.set(key, fullName);
    return { rowNumber: row?.rowNumber || index + 2, firstName, lastName, fullName, status: errors.length ? 'invalid' : 'valid', errors, warnings };
  });
}
async function importContext() {
  const [registry, users, legacy] = await Promise.all([all('student_registry', 'id,full_name'), all('users', 'id,name', q => q.eq('role', 'student')), all('class_registration_students', 'id,normalized_name')]);
  return [...registry, ...users, ...legacy];
}
async function preview(id, buffer) {
  await requireHeadTeacher(id);
  const [parsed, existing] = await Promise.all([parseWorkbook(buffer), importContext()]);
  const records = validateRecords(parsed, existing);
  return { records, summary: { total: records.length, valid: records.filter(r => !r.errors.length).length,
    invalid: records.filter(r => r.errors.length).length, possibleDuplicates: records.filter(r => r.warnings.length).length } };
}
async function importStudents(id, body = {}) {
  await requireHeadTeacher(id);
  body = inputBody(body);
  const records = validateRecords(body.records, await importContext());
  if (records.some(r => r.errors.length)) throw fail('Resolve all invalid records before importing.', 400, 'REGISTRY_IMPORT_INVALID');
  if (records.some(r => r.warnings.length) && body.allowPossibleDuplicates !== true) throw fail('Review and confirm the possible duplicates before importing.');
  const payload = records.map(row => {
    const item = { id: crypto.randomUUID().replace(/-/g, ''), code_nonce: crypto.randomBytes(24).toString('hex') };
    return { id: item.id, firstName: row.firstName, lastName: row.lastName, nonce: item.code_nonce, codeHash: digest(registrationCode(item)) };
  });
  const imported = await rpc('import', { p_headteacher_id: id, p_records: payload });
  return { imported, message: `${imported} students imported. Export their registration codes and share the registration link.` };
}
async function changeCode(id, registryId, revoke = false) {
  await requireHeadTeacher(id);
  if (typeof registryId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(registryId)) throw known('INPUT_INVALID');
  const item = { id: registryId, code_nonce: crypto.randomBytes(24).toString('hex') };
  await rpc('code', { p_headteacher_id: id, p_registry_id: registryId, p_nonce: item.code_nonce, p_code_hash: digest(registrationCode(item)), p_revoke: revoke });
  return { student: (await list(id)).students.find(s => s.id === registryId) };
}
async function assign(id, body = {}) {
  await requireHeadTeacher(id);
  body = inputBody(body);
  if (!Array.isArray(body.registryIds) || !body.registryIds.length || body.registryIds.length > 1000 || !Array.isArray(body.subjectIds) || body.subjectIds.length > 100
    || [...body.registryIds, ...body.subjectIds].some(v => typeof v !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(v))) throw known('INPUT_INVALID');
  return { assigned: await rpc('assign', { p_headteacher_id: id, p_registry_ids: [...new Set(body.registryIds)], p_subject_ids: [...new Set(body.subjectIds)] }) };
}
async function workbook(id, filters, template = false) {
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet(template ? 'Students' : 'Student Registry');
  if (template) { await requireHeadTeacher(id); sheet.columns = [{ header: 'First Name', key: 'firstName', width: 28 }, { header: 'Last Name', key: 'lastName', width: 28 }]; }
  else {
    const data = await list(id, filters);
    sheet.columns = ['First Name', 'Last Name', 'Status', 'Username', 'Email', 'Teachers / Classes', 'Registration Code', 'Code Expires At', 'Registration Link'].map(header => ({ header, width: header === 'Registration Link' ? 55 : 27 }));
    data.students.forEach(s => sheet.addRow([s.firstName, s.lastName, s.status, s.username, s.email,
      s.assignments.map(a => `${a.teacherName}: ${a.className} (${a.subjectName})`).join('; '), s.registrationCode || '', s.codeExpiresAt || '', data.registrationLink.url]));
  }
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return Buffer.from(await book.xlsx.writeBuffer());
}
async function requireLink(token) {
  const hash = hashToken(token);
  const row = await result(client().from('student_registry_links').select('*').eq('id', 'school').eq('token_hash', hash).maybeSingle());
  if (!row) throw known('INVITATION_INVALID');
  if (Date.parse(row.expires_at) <= Date.now()) throw known('INVITATION_EXPIRED');
  return row;
}
async function details(token) { const row = await requireLink(token); return { registration: { schoolName: 'EduMatch', status: 'Active', expiresAt: row.expires_at } }; }
async function verifyStudent(token, body = {}) {
  const link = await requireLink(token);
  body = inputBody(body);
  const fullName = typeof body.fullName === 'string' ? body.fullName : '';
  if (!fullName.trim() || fullName.length > 200) throw known('NAME_NOT_FOUND');
  const ticket = crypto.randomBytes(32).toString('hex');
  const verified = await rpc('verify', { p_link_hash: link.token_hash, p_full_name: cleanText(fullName), p_ticket_hash: digest(ticket) });
  return { student: verified.student, studentVerificationToken: ticket, expiresAt: verified.expiresAt };
}
async function session(token, ticket, allowComplete = false) {
  const link = await requireLink(token), ticketHash = hashToken(ticket, 'SESSION_INVALID');
  const row = await result(client().from('student_registry_sessions').select('*').eq('ticket_hash', ticketHash).eq('link_hash', link.token_hash).maybeSingle());
  if (!row || (!allowComplete && row.completed_user_id)) throw known('SESSION_INVALID');
  if (Date.parse(row.expires_at) <= Date.now()) throw known('SESSION_EXPIRED');
  return { row, link, ticketHash };
}
async function usernameExists(username) {
  // Usernames are constrained to this alphabet before reaching ILIKE.
  return !!(await result(client().from('users').select('id').ilike('username', username.replace(/_/g, '\\_')).limit(1).maybeSingle()));
}
async function usernameAvailability(token, query = {}) {
  await session(token, query.studentVerificationToken);
  const username = typeof query.username === 'string' ? query.username.trim() : '';
  if (!USERNAME.test(username)) return { username, available: false, valid: false, suggestions: [], message: 'Use 3–30 letters, numbers, dots, underscores or hyphens. Start with a letter or number.' };
  if (!(await usernameExists(username))) return { username, available: true, valid: true, suggestions: [], message: 'Username is available.' };
  const candidates = Array.from({ length: 8 }, () => `${username.slice(0, 24).toLowerCase()}${crypto.randomInt(10, 10000)}`);
  const checked = await Promise.all(candidates.map(async v => await usernameExists(v) ? null : v));
  return { username, available: false, valid: true, suggestions: [...new Set(checked.filter(Boolean))].slice(0, 3), message: 'This username is already taken. Choose an alternative.' };
}
const emailCodeHash = (ticket, email, challenge, code) => hmac(`student-registry-email:v1:${ticket}:${email}:${challenge}:${code}`);
async function sendEmailCode(token, body = {}) {
  body = inputBody(body);
  const { link, ticketHash } = await session(token, body.studentVerificationToken);
  const email = assertTeacherEmail(body.email), code = String(crypto.randomInt(0, 1000000)).padStart(6, '0'), challengeId = crypto.randomUUID();
  const prepared = await rpc('prepare_email', { p_link_hash: link.token_hash, p_ticket_hash: ticketHash, p_email: email,
    p_code_hash: emailCodeHash(ticketHash, email, challengeId, code), p_challenge_id: challengeId });
  let sent = false;
  try { sent = (await sendEmailViaGmail({ to: { email, name: 'Student' }, subject: 'Verify your EduMatch student email',
    text: `Your EduMatch registration verification code is ${code}. It expires in 10 minutes. Do not share this code.`,
    html: `<p>Your EduMatch student registration code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. Do not share this code.</p>`, signal: AbortSignal.timeout(15000) }))?.sent === true; } catch { /* Invalidate only this delivery attempt. */ }
  if (!sent) {
    await result(client().from('student_registry_sessions').update({ email_code_hash: null, email_code_expires_at: null }).eq('id', prepared.id).eq('email_challenge_id', challengeId));
    throw fail('Unable to send the verification email. Wait 60 seconds and try again.', 502, 'EMAIL_DELIVERY_FAILED');
  }
  return { challengeId, retryAfter: 60, expiresIn: 600 };
}
async function verifyEmail(token, body = {}) {
  body = inputBody(body);
  const { link, ticketHash } = await session(token, body.studentVerificationToken);
  const email = assertTeacherEmail(body.email);
  if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code) || typeof body.challengeId !== 'string' || body.challengeId.length > 128) throw known('EMAIL_CODE_INVALID');
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verified = await rpc('verify_email', { p_link_hash: link.token_hash, p_ticket_hash: ticketHash, p_email: email,
    p_challenge_id: body.challengeId, p_code_hash: emailCodeHash(ticketHash, email, body.challengeId, body.code), p_verification_hash: digest(verificationToken) });
  if (verified?.verified !== true) throw known(messages[verified?.code] ? verified.code : 'EMAIL_CODE_INVALID');
  return { verificationToken, verifiedEmail: email, expiresAt: verified.expiresAt };
}
async function registerStudent(token, body = {}) {
  body = inputBody(body);
  const { link, ticketHash } = await session(token, body.studentVerificationToken, true);
  const email = assertTeacherEmail(body.email), username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!USERNAME.test(username)) throw known('INPUT_INVALID');
  if (typeof body.password !== 'string' || body.password !== body.confirmPassword) throw fail('Passwords do not match.');
  assertPasswordMeetsPolicy(body.password);
  const verificationHash = hashToken(body.verificationToken, 'EMAIL_VERIFICATION_REQUIRED');
  const claimId = hmac(`student-registry-claim:v1:${ticketHash}:${email}:${username.toLowerCase()}`);
  const args = { p_link_hash: link.token_hash, p_ticket_hash: ticketHash, p_email: email, p_username: username, p_verification_hash: verificationHash, p_claim_id: claimId };
  let claim = await rpc('begin', args);
  if (claim.userId) return { username, message: 'Registration complete. Sign in with your username and password.' };
  let authId = claim.authUserId;
  let resumeOwnedAuth = !!authId;
  if (!authId) {
    let created;
    try { created = await client().auth.admin.createUser({ email, password: body.password, email_confirm: true,
      app_metadata: { student_registry_id: claim.registryId, registry_claim_id: claimId } }); } catch { created = { error: true }; }
    if (created.error || !created.data?.user?.id) {
      // The Auth request may have committed even if its response was lost. Only
      // recover the identity with this exact trusted claim metadata.
      claim = await rpc('begin', args);
      authId = claim.authUserId;
      resumeOwnedAuth = !!authId;
      if (!authId) throw fail('Account creation could not complete. Retry using the same registration details.', 503, 'REGISTRY_AUTH_UNAVAILABLE');
    } else authId = created.data.user.id;
  }
  if (resumeOwnedAuth) {
    // A fresh code/name + email verification may resume this registry's own
    // unfinished Auth account after a page reload. SQL verifies the retained
    // claim ledger and absence of a linked public account before authorizing it.
    // Apply the password from this verified attempt even for a same-claim retry.
    let rebound;
    try { rebound = await client().auth.admin.updateUserById(authId, { password: body.password,
      app_metadata: { student_registry_id: claim.registryId, registry_claim_id: claimId } }); } catch { rebound = { error: true }; }
    if (rebound.error || rebound.data?.user?.id !== authId) {
      throw fail('Account recovery could not complete. Retry using the same registration details.', 503, 'REGISTRY_AUTH_UNAVAILABLE');
    }
  }
  // No compensating deletion on a database/network error: a lost response may
  // already have committed enrollment. The same claim safely finishes on retry.
  await rpc('finish', { p_ticket_hash: ticketHash, p_claim_id: claimId, p_auth_user_id: authId });
  return { username, message: 'Registration complete. Sign in with your username and password.' };
}
module.exports = { MAX_FILE_BYTES, list, manageLink, preview, importStudents, changeCode, assign, workbook,
  details, verifyStudent, usernameAvailability, sendEmailCode, verifyEmail, registerStudent,
  digest, linkToken, registrationCode, validateRecords, databaseError };
