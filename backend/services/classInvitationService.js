const crypto = require('node:crypto');
const zlib = require('node:zlib');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const { getSupabaseStorageClient } = require('./supabaseStorageService');
const { findTeacherSubject } = require('./subjectService');
const { assertGmailEmail } = require('../utils/emailPolicy');
const { assertPasswordMeetsPolicy } = require('../utils/passwordPolicy');

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROSTER_ROWS = 1000;
const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,29}$/;
const fail = (message, statusCode = 400, code) => Object.assign(new Error(message), { statusCode, code });
function cleanText(value) {
  return typeof value === 'string' ? value.normalize('NFKC').trim().replace(/\s+/gu, ' ') : '';
}
function normalizeName(value) { return cleanText(value).toLowerCase(); }
function secret() {
  const value = process.env.CLASS_INVITATION_SECRET || process.env.JWT_SECRET || '';
  if (value.length < 32) throw fail('Student invitations are not configured. Contact your administrator.', 503);
  return value;
}
function digest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function invitationToken(id) { return crypto.createHmac('sha256', secret()).update(`class-invitation:v1:${id}`).digest('hex'); }
function registrationCode(id) {
  const code = crypto.createHmac('sha256', secret()).update(`class-student:v1:${id}`).digest('hex').slice(0, 24).toUpperCase();
  return code.match(/.{4}/g).join('-');
}
function normalizeCode(value) {
  if (typeof value !== 'string' || value.length > 40) return '';
  const code = value.trim().toUpperCase().replace(/[ -]/g, '');
  return /^[A-F0-9]{24}$/.test(code) ? code.match(/.{4}/g).join('-') : '';
}
function databaseError(error) {
  const messages = {
    INVITATION_EXPIRED: ['This invitation has expired. Ask your teacher for a current invitation.', 410],
    INVITATION_INVALID: ['This invitation is invalid or unavailable. Ask your teacher for a current invitation.', 404],
    CODE_INVALID: ['The registration code and full name do not match. Check the details from your teacher.', 400],
    CODE_USED: ['This registration code has already been used. Sign in to your existing account.', 409],
    ROSTER_DUPLICATE: ['One or more student names already exist or were imported by another teacher. Review the roster and try again.', 409],
    ROSTER_INVALID: ['The roster contains invalid names or sections. Preview the file again.', 400],
    CLASS_UNAVAILABLE: ['The selected class is unavailable. Ask your teacher for help.', 404],
    SECTION_UNAVAILABLE: ['The student section is no longer available. Ask your teacher for help.', 409],
    USERNAME_TAKEN: ['This username is already taken. Choose another username.', 409],
    EMAIL_TAKEN: ['An account already uses this email address. Sign in or use password reset.', 409],
    STUDENT_EXISTS: ['An account already exists for this student. Ask your teacher for help.', 409],
  };
  const key = Object.keys(messages).find((value) => String(error?.message || '').includes(value));
  if (key) return fail(...messages[key], key);
  if (error?.code === '23505') {
    const message = String(error.message || '');
    if (message.includes('username')) return fail(...messages.USERNAME_TAKEN, 'USERNAME_TAKEN');
    if (message.includes('email')) return fail(...messages.EMAIL_TAKEN, 'EMAIL_TAKEN');
    return fail(...messages.ROSTER_DUPLICATE, 'ROSTER_DUPLICATE');
  }
  // Never expose table names, SQL statements, tokens or database details publicly.
  return fail('Student invitations are temporarily unavailable. Please try again later.', 503, 'INVITATION_UNAVAILABLE');
}
async function rows(table, columns, filter = (query) => query) {
  const result = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await filter(getSupabaseStorageClient().from(table).select(columns))
      .order('id', { ascending: true }).range(offset, offset + 499);
    if (error) throw databaseError(error);
    result.push(...(data || []));
    if ((data || []).length < 500) return result;
  }
}
async function requireClass(teacherId, subjectId) {
  if (typeof subjectId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(subjectId)) throw fail('Choose a valid class.');
  let subject;
  try { subject = await findTeacherSubject(teacherId, subjectId); } catch (error) { throw databaseError(error); }
  if (!subject) throw fail('The selected class is unavailable or does not belong to you.', 404);
  return subject;
}
async function validationContext(teacherId, subjectId) {
  const [subject, sections, accounts, imported] = await Promise.all([
    requireClass(teacherId, subjectId),
    rows('sections', 'id,name', query => query.eq('is_active', true)),
    rows('users', 'id,name', query => query.eq('role', 'student')),
    rows('class_registration_students', 'id,normalized_name'),
  ]);
  const sectionMap = new Map();
  sections.forEach(section => {
    const key = normalizeName(section.name);
    // Ambiguous directory labels must not silently select an arbitrary section.
    sectionMap.set(key, sectionMap.has(key) ? null : section);
  });
  return { subject, sectionMap, existingNames: new Set([...accounts.map(row => normalizeName(row.name)), ...imported.map(row => row.normalized_name)]) };
}
function validateRecords(records, context) {
  if (!Array.isArray(records) || records.length === 0 || records.length > MAX_ROSTER_ROWS) throw fail(`Import between 1 and ${MAX_ROSTER_ROWS} students.`);
  const counts = new Map();
  records.forEach(record => { const name = normalizeName(record?.fullName); counts.set(name, (counts.get(name) || 0) + 1); });
  return records.map((record, index) => {
    const fullName = cleanText(record?.fullName);
    const section = cleanText(record?.section);
    const normalizedName = normalizeName(fullName);
    const matchedSection = context.sectionMap.get(normalizeName(section));
    const errors = Array.isArray(record?.cellErrors) ? record.cellErrors.filter(error => typeof error === 'string').slice(0, 5) : [];
    if (fullName.length < 3 || fullName.length > 150 || !/\p{L}/u.test(fullName) || /[\x00-\x1f\x7f]/u.test(fullName)) errors.push('Full name must contain letters and be 3–150 characters.');
    if (!section || !matchedSection) errors.push('Section must match an active section in the school directory.');
    if (counts.get(normalizedName) > 1) errors.push('Duplicate full name in this file. Keep one entry; ask an administrator about students with identical names.');
    if (context.existingNames.has(normalizedName)) errors.push('This full name already has an account or an imported registration code.');
    return { rowNumber: record?.rowNumber || index + 2, fullName, section: matchedSection?.name || section,
      sectionId: matchedSection?.id || null, normalizedName, status: errors.length ? 'invalid' : 'valid', errors };
  });
}
// Bound the expanded ZIP before ExcelJS decompresses it (including ZIP bombs).
function validateWorkbookArchive(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > MAX_FILE_BYTES || buffer.length < 22) throw fail('Upload a valid Excel (.xlsx) file up to 2 MB.');
  let end = -1;
  for (let position = buffer.length - 22; position >= Math.max(0, buffer.length - 65557); position -= 1) {
    if (buffer.readUInt32LE(position) === 0x06054b50 && position + 22 + buffer.readUInt16LE(position + 20) === buffer.length) { end = position; break; }
  }
  if (end < 0 || buffer.readUInt16LE(end + 4) !== 0 || buffer.readUInt16LE(end + 6) !== 0) throw fail('The Excel file is damaged or uses an unsupported archive format.');
  const entries = buffer.readUInt16LE(end + 10);
  let position = buffer.readUInt32LE(end + 16);
  const directoryStart = position;
  let expanded = 0;
  if (entries > 200 || position > end || buffer.readUInt32LE(end + 12) > end - position) throw fail('This workbook is too complex. Upload a simple sheet with Full Name and Section.');
  for (let index = 0; index < entries; index += 1) {
    if (position + 46 > end || buffer.readUInt32LE(position) !== 0x02014b50) throw fail('The Excel archive is invalid.');
    const size = buffer.readUInt32LE(position + 24);
    expanded += size;
    if (buffer.readUInt16LE(position + 8) & 1 || size > 12 * 1024 * 1024 || expanded > 24 * 1024 * 1024) throw fail('The Excel file is encrypted or expands beyond the supported size.');
    const compressedSize = buffer.readUInt32LE(position + 20);
    const method = buffer.readUInt16LE(position + 10);
    const local = buffer.readUInt32LE(position + 42);
    if (![0, 8].includes(method) || local + 30 > directoryStart || buffer.readUInt32LE(local) !== 0x04034b50
      || buffer.readUInt16LE(local + 6) & 1 || buffer.readUInt16LE(local + 8) !== method) throw fail('The Excel archive uses an unsupported or invalid format.');
    const dataStart = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    if (dataStart + compressedSize > directoryStart) throw fail('The Excel archive is invalid.');
    // Attackers can forge the central directory's uncompressed size. Inflate
    // each member with a hard output cap before trusting it or invoking ExcelJS.
    let actualSize;
    try {
      actualSize = method === 0 ? compressedSize : zlib.inflateRawSync(buffer.subarray(dataStart, dataStart + compressedSize),
        { maxOutputLength: 12 * 1024 * 1024 }).length;
    } catch { throw fail('The Excel file is damaged or expands beyond the supported size.'); }
    if (actualSize !== size) throw fail('The Excel archive contains inconsistent size information.');
    position += 46 + buffer.readUInt16LE(position + 28) + buffer.readUInt16LE(position + 30) + buffer.readUInt16LE(position + 32);
    if (position > end) throw fail('The Excel archive is invalid.');
  }
}
function readCell(cell, label, errors) {
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'string') return cell.value;
  if (cell.value?.richText) return cell.value.richText.map(part => part.text).join('');
  errors.push(`${label} must be plain text; formulas, dates and numbers are not supported.`);
  return '';
}
async function parseWorkbook(buffer) {
  validateWorkbookArchive(buffer);
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(buffer); } catch { throw fail('Unable to read this Excel file. Save it as .xlsx and try again.'); }
  const sheets = workbook.worksheets.filter(sheet => sheet.actualRowCount > 0);
  if (sheets.length !== 1) throw fail('Upload a workbook with one non-empty worksheet containing Full Name and Section.');
  const sheet = sheets[0];
  if (sheet.rowCount > MAX_ROSTER_ROWS + 1 || sheet.columnCount > 50) throw fail(`Use no more than ${MAX_ROSTER_ROWS} student rows and remove unused rows or columns.`);
  const headers = new Map();
  sheet.getRow(1).eachCell((cell, index) => {
    const header = normalizeName(typeof cell.value === 'string' ? cell.value : '');
    if (headers.has(header)) throw fail('Duplicate column headers found. Use one Full Name and one Section column.');
    headers.set(header, index);
  });
  if (!headers.has('full name') || !headers.has('section')) throw fail('The first row must contain the column headers Full Name and Section.');
  const records = [];
  for (let index = 2; index <= sheet.rowCount; index += 1) {
    const row = sheet.getRow(index);
    if (row.actualCellCount === 0) continue;
    const cellErrors = [];
    const fullName = readCell(row.getCell(headers.get('full name')), 'Full Name', cellErrors);
    const section = readCell(row.getCell(headers.get('section')), 'Section', cellErrors);
    if (!cleanText(fullName) && !cleanText(section) && !cellErrors.length) continue;
    records.push({ rowNumber: index, fullName, section, cellErrors });
  }
  if (!records.length) throw fail('No students were found. Add Full Name and Section below the headers.');
  return records;
}
async function previewRoster(teacherId, subjectId, buffer) {
  const parsed = await parseWorkbook(buffer);
  const records = validateRecords(parsed, await validationContext(teacherId, subjectId));
  return { records, validCount: records.filter(row => row.status === 'valid').length, invalidCount: records.filter(row => row.status === 'invalid').length };
}
function mapInvitation(invitation, students, subject) {
  const expiresAt = invitation.expires_at;
  const status = invitation.status === 'revoked' ? 'revoked' : (!subject?.is_active || Date.parse(expiresAt) <= Date.now() ? 'expired' : 'active');
  const mapped = students.map(row => ({ id: row.id, fullName: row.full_name, section: row.section_name,
    registrationCode: registrationCode(row.id), status: row.registered_at ? 'registered' : 'unregistered',
    registeredAt: row.registered_at || null, studentId: row.student_id || null }));
  const registeredCount = mapped.filter(row => row.status === 'registered').length;
  const base = String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
  return { id: invitation.id, subjectId: invitation.subject_id, className: subject?.class_name || subject?.name || 'Class',
    invitationUrl: `${base}/auth/class-register/${invitationToken(invitation.id)}`, expiresAt, status,
    registeredCount, unregisteredCount: mapped.length - registeredCount, totalCount: mapped.length, students: mapped };
}
async function listInvitations(teacherId) {
  const [invitations, students, subjects] = await Promise.all([
    rows('class_invitations', '*', query => query.eq('teacher_id', teacherId)),
    rows('class_registration_students', '*', query => query.eq('teacher_id', teacherId)),
    rows('subjects', 'id,name,class_name,is_active', query => query.eq('teacher_id', teacherId)),
  ]);
  return invitations.map(invitation => mapInvitation(invitation, students.filter(row => row.invitation_id === invitation.id), subjects.find(row => row.id === invitation.subject_id)));
}
async function createInvitation(teacherId, { subjectId, records: input, expiresInDays = 30 } = {}) {
  secret();
  const days = Number(expiresInDays);
  if (!Number.isInteger(days) || days < 1 || days > 90) throw fail('Invitation expiry must be between 1 and 90 days.');
  // Client-supplied preview statuses/IDs are ignored; all names and sections are revalidated.
  const records = validateRecords(Array.isArray(input) ? input.map(row => ({ fullName: row?.fullName, section: row?.section })) : input,
    await validationContext(teacherId, subjectId));
  if (records.some(row => row.status !== 'valid')) throw fail('The roster has invalid or duplicate entries. Correct the file and preview it again.');
  const id = crypto.randomUUID();
  const prepared = records.map(row => {
    const studentId = crypto.randomUUID();
    return { id: studentId, full_name: row.fullName, normalized_name: row.normalizedName, section_id: row.sectionId, code_hash: digest(registrationCode(studentId)) };
  });
  const { data, error } = await getSupabaseStorageClient().rpc('import_class_invitation', {
    p_teacher_id: teacherId, p_subject_id: subjectId, p_invitation_id: id,
    p_token_hash: digest(invitationToken(id)), p_expires_at: new Date(Date.now() + days * 86400000).toISOString(), p_records: prepared,
  });
  if (error) throw databaseError(error);
  return (await listInvitations(teacherId)).find(invitation => invitation.id === data);
}
async function renewInvitation(teacherId, id, expiresInDays = 30) {
  secret();
  const days = Number(expiresInDays);
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw fail('Invitation not found.', 404);
  if (!Number.isInteger(days) || days < 1 || days > 90) throw fail('Invitation expiry must be between 1 and 90 days.');
  const { data, error } = await getSupabaseStorageClient().rpc('renew_class_invitation', {
    p_teacher_id: teacherId, p_invitation_id: id, p_expires_at: new Date(Date.now() + days * 86400000).toISOString(),
  });
  if (error) throw databaseError(error);
  return (await listInvitations(teacherId)).find(invitation => invitation.id === data);
}
async function requireInvitation(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw fail('This invitation is invalid or unavailable.', 404, 'INVITATION_INVALID');
  const { data, error } = await getSupabaseStorageClient().from('class_invitations').select('*').eq('token_hash', digest(token)).maybeSingle();
  if (error) throw databaseError(error);
  if (!data || data.status !== 'active') throw fail('This invitation is invalid or unavailable. Ask your teacher for a current invitation.', 404, 'INVITATION_INVALID');
  if (Date.parse(data.expires_at) <= Date.now()) throw fail('This invitation has expired. Ask your teacher for a current invitation.', 410, 'INVITATION_EXPIRED');
  const [{ data: subject, error: subjectError }, { data: teacher, error: teacherError }] = await Promise.all([
    getSupabaseStorageClient().from('subjects').select('id,name,class_name,is_active,teacher_id').eq('id', data.subject_id).maybeSingle(),
    getSupabaseStorageClient().from('users').select('id,role,status,archive').eq('id', data.teacher_id).maybeSingle(),
  ]);
  if (subjectError || teacherError) throw databaseError(subjectError || teacherError);
  if (!subject?.is_active || subject.teacher_id !== data.teacher_id || teacher?.role !== 'teacher' || teacher.status !== 'active' || teacher.archive?.isArchived === true) throw fail('This class is unavailable. Ask your teacher for help.', 404, 'CLASS_UNAVAILABLE');
  return { ...data, className: subject.class_name || subject.name };
}
async function publicInvitation(token) {
  const invitation = await requireInvitation(token);
  return { className: invitation.className, expiresAt: invitation.expires_at, status: 'active' };
}
async function verifyStudent(token, { registrationCode: code, fullName } = {}) {
  const invitation = await requireInvitation(token);
  const normalizedCode = normalizeCode(code);
  const normalizedName = normalizeName(fullName);
  if (!normalizedCode || !normalizedName || normalizedName.length > 150) throw fail('Enter your registration code and matching full name.', 400, 'CODE_INVALID');
  const { data, error } = await getSupabaseStorageClient().from('class_registration_students').select('*')
    .eq('invitation_id', invitation.id).eq('code_hash', digest(normalizedCode)).eq('normalized_name', normalizedName).maybeSingle();
  if (error) throw databaseError(error);
  if (!data) throw fail('The registration code and full name do not match. Check the details from your teacher.', 400, 'CODE_INVALID');
  if (data.registered_at) throw fail('This registration code has already been used. Sign in to your existing account.', 409, 'CODE_USED');
  const { data: section, error: sectionError } = await getSupabaseStorageClient().from('sections').select('id,is_active').eq('id', data.section_id).maybeSingle();
  if (sectionError) throw databaseError(sectionError);
  if (!section?.is_active) throw fail('Your section is no longer available. Ask your teacher for help.', 409, 'SECTION_UNAVAILABLE');
  return data;
}
async function usernameExists(username) {
  // Escaping prevents PostgREST's _, %, and * wildcard syntax from changing equality.
  const pattern = username.replace(/[\\%_]/g, '\\$&');
  const { data, error } = await getSupabaseStorageClient().from('users').select('id').ilike('username', pattern).limit(1).maybeSingle();
  if (error) throw databaseError(error);
  return Boolean(data);
}
async function usernameAvailability(token, input) {
  await requireInvitation(token);
  const username = typeof input === 'string' ? input.trim() : '';
  if (!USERNAME_PATTERN.test(username)) return { available: false, valid: false,
    message: 'Use 3–30 characters: letters, numbers, dots, underscores or hyphens. Start with a letter or number.', suggestions: [] };
  if (!(await usernameExists(username))) return { available: true, valid: true, message: 'Username is available.', suggestions: [] };
  const base = username.slice(0, 24).toLowerCase();
  const candidates = Array.from({ length: 6 }, () => `${base}${crypto.randomInt(10, 10000)}`);
  const checks = await Promise.all(candidates.map(async candidate => (await usernameExists(candidate)) ? null : candidate));
  return { available: false, valid: true, message: 'This username is already taken. Choose another username.', suggestions: [...new Set(checks.filter(Boolean))].slice(0, 3) };
}
async function registerStudent(token, body = {}) {
  const student = await verifyStudent(token, body);
  const email = assertGmailEmail(typeof body.email === 'string' ? body.email : '');
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!USERNAME_PATTERN.test(username)) throw fail('Username must be 3–30 characters and start with a letter or number. Use letters, numbers, dots, underscores or hyphens.');
  if (typeof body.password !== 'string' || typeof body.confirmPassword !== 'string' || body.password !== body.confirmPassword) throw fail('Passwords do not match.');
  assertPasswordMeetsPolicy(body.password);
  const hash = await bcrypt.hash(body.password, 12);
  const { data, error } = await getSupabaseStorageClient().rpc('register_class_invitation_student', {
    p_token_hash: digest(token), p_code_hash: digest(normalizeCode(body.registrationCode)),
    p_normalized_name: normalizeName(body.fullName), p_email: email, p_username: username, p_password_hash: hash,
  });
  if (error) throw databaseError(error);
  return { studentId: data, fullName: student.full_name, section: student.section_name };
}
async function exportCodes(teacherId, id) {
  const invitation = (await listInvitations(teacherId)).find(row => row.id === id);
  if (!invitation) throw fail('Invitation not found.', 404);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Registration Codes');
  sheet.columns = [{ header: 'Full Name', key: 'fullName', width: 35 }, { header: 'Section', key: 'section', width: 24 },
    { header: 'Registration Code', key: 'registrationCode', width: 34 }, { header: 'Status', key: 'status', width: 18 },
    { header: 'Invitation Link', key: 'invitationUrl', width: 75 }, { header: 'Expires At', key: 'expiresAt', width: 26 }];
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4D8839' } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  invitation.students.forEach(student => sheet.addRow({ ...student, invitationUrl: invitation.invitationUrl, expiresAt: invitation.expiresAt }));
  return workbook.xlsx.writeBuffer();
}
module.exports = { MAX_FILE_BYTES, MAX_ROSTER_ROWS, cleanText, normalizeName, normalizeCode, registrationCode, invitationToken,
  validateWorkbookArchive, parseWorkbook, validateRecords, previewRoster, createInvitation, renewInvitation, listInvitations, publicInvitation,
  verifyStudent, usernameAvailability, registerStudent, exportCodes, databaseError };
