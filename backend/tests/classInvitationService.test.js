const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
process.env.CLASS_INVITATION_SECRET = 'class-invitation-test-secret-32-characters-minimum';
const service = require('../services/classInvitationService');
const teacherId = 'teacher-one';
const subjectId = 'class-one';
const invitationId = 'invitation-one';
const studentId = 'roster-student-one';
const token = service.invitationToken(invitationId);
const code = service.registrationCode(studentId);
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

function fixture(extra = {}) {
  client = createFakeSupabase({
    users: [{ id: teacherId, name: 'Teacher One', role: 'teacher', status: 'active', archive: {} }],
    subjects: [{ id: subjectId, teacher_id: teacherId, name: 'Science', class_name: 'Science A', track: 'GENERAL', is_active: true }],
    sections: [{ id: 'charity', name: 'Charity', is_active: true }, { id: 'inactive-section', name: 'Inactive', is_active: false }],
    class_invitations: [{ id: invitationId, teacher_id: teacherId, subject_id: subjectId, status: 'active',
      token_hash: digest(token), expires_at: new Date(Date.now() + 86400000).toISOString() }],
    class_registration_students: [{ id: studentId, invitation_id: invitationId, teacher_id: teacherId,
      full_name: 'Juan dela Cruz', normalized_name: 'juan dela cruz', section_id: 'charity', section_name: 'Charity',
      code_hash: digest(code), registered_at: null, student_id: null }],
    ...extra,
  });
  client.rpc = async () => { assert.fail('An invalid request must not call a mutation RPC'); };
  return client;
}
async function workbook(rows, headers = ['Full Name', 'Section']) {
  const result = new ExcelJS.Workbook();
  const sheet = result.addWorksheet('Roster');
  sheet.addRow(headers);
  rows.forEach(row => sheet.addRow(row));
  return Buffer.from(await result.xlsx.writeBuffer());
}
async function rejects(operation, statusCode, pattern) {
  await assert.rejects(operation, error => {
    assert.equal(error.statusCode, statusCode);
    if (pattern) assert.match(error.message, pattern);
    return true;
  });
}

test('real XLSX preview normalizes names and matches active school sections without writes', async () => {
  fixture({ class_registration_students: [] });
  const preview = await service.previewRoster(teacherId, subjectId,
    await workbook([['  Maria   Santos ', ' cHaRiTy '], ['Jose Reyes', 'Charity']]));
  assert.equal(preview.validCount, 2);
  assert.equal(preview.invalidCount, 0);
  assert.deepEqual(preview.records.map(row => [row.fullName, row.section, row.sectionId, row.status]),
    [['Maria Santos', 'Charity', 'charity', 'valid'], ['Jose Reyes', 'Charity', 'charity', 'valid']]);
  assert.equal(client.writes.length, 0);
});

test('preview marks all duplicate normalized names, imported names, existing students and inactive/unknown sections invalid', async () => {
  fixture();
  client.tables.users.push({ id: 'existing', name: 'ANNA   CRUZ', role: 'student', status: 'active' });
  const preview = await service.previewRoster(teacherId, subjectId, await workbook([
    ['Maria Santos', 'Charity'], ['  ＭＡＲＩＡ   ＳＡＮＴＯＳ ', 'Charity'], ['JUAN DELA CRUZ', 'Charity'],
    ['Anna Cruz', 'Charity'], ['Jose Reyes', 'Inactive'], ['Pedro Reyes', 'Unknown'],
  ]));
  assert.equal(preview.validCount, 0);
  assert.equal(preview.invalidCount, 6);
  assert.match(preview.records[0].errors.join(' '), /Duplicate full name/);
  assert.match(preview.records[1].errors.join(' '), /Duplicate full name/);
  assert.match(preview.records[2].errors.join(' '), /already has an account/);
  assert.match(preview.records[3].errors.join(' '), /already has an account/);
  assert.match(preview.records[4].errors.join(' '), /active section/);
  assert.equal(client.writes.length, 0);
});

test('Excel headers, formulas, numeric names, invalid archives, file size and row limit are validated', async () => {
  fixture({ class_registration_students: [] });
  await rejects(service.parseWorkbook(await workbook([['Maria Santos', 'Charity']], ['Name', 'Class'])), 400, /Full Name and Section/);
  await rejects(service.parseWorkbook(await workbook([['Maria Santos', 'Charity']], ['Full Name', 'Section', 'Section'])), 400, /Duplicate column headers/);
  const preview = await service.previewRoster(teacherId, subjectId, await workbook([
    [{ formula: '"Maria Santos"', result: 'Maria Santos' }, 'Charity'], [12345, 'Charity'], ['Jose Reyes', { formula: '"Charity"', result: 'Charity' }],
  ]));
  assert.equal(preview.invalidCount, 3);
  assert.ok(preview.records.every(row => row.errors.some(error => error.includes('plain text'))));
  await rejects(service.parseWorkbook(Buffer.alloc(service.MAX_FILE_BYTES + 1)), 400, /2 MB/);
  await rejects(service.parseWorkbook(Buffer.from('invalid excel file')), 400, /valid Excel/);
  await rejects(service.parseWorkbook(Buffer.alloc(100)), 400, /damaged|unsupported/);
  await rejects(service.parseWorkbook(await workbook(Array.from({ length: 1001 }, (_, index) => [`Student Name ${index}`, 'Charity']))), 400, /1000/);
  const multipleSheets = new ExcelJS.Workbook();
  multipleSheets.addWorksheet('First').addRow(['Full Name', 'Section']);
  multipleSheets.addWorksheet('Second').addRow(['Full Name', 'Section']);
  await rejects(service.parseWorkbook(Buffer.from(await multipleSheets.xlsx.writeBuffer())), 400, /one non-empty worksheet/);
});

test('archive validation rejects forged central-directory sizes before ExcelJS decompresses', async () => {
  const valid = await workbook([['Maria Santos', 'Charity']]);
  const forged = Buffer.from(valid);
  const central = forged.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  assert.ok(central >= 0);
  forged.writeUInt32LE(13 * 1024 * 1024, central + 24);
  assert.throws(() => service.validateWorkbookArchive(forged), /supported size/);
  const inconsistent = Buffer.from(valid);
  inconsistent.writeUInt32LE(inconsistent.readUInt32LE(central + 24) + 1, central + 24);
  assert.throws(() => service.validateWorkbookArchive(inconsistent), /inconsistent size/);
});

test('username checks are case-insensitive, literal for underscores, and suggest only available alternatives', async () => {
  fixture();
  client.tables.users.push({ id: 'existing', role: 'student', username: 'Maria.Santos' }, { id: 'wildcard', username: 'joseXreyes' });
  const taken = await service.usernameAvailability(token, 'maria.santos');
  assert.equal(taken.valid, true);
  assert.equal(taken.available, false);
  assert.ok(taken.suggestions.length > 0 && taken.suggestions.length <= 3);
  for (const suggestion of taken.suggestions) {
    const check = await service.usernameAvailability(token, suggestion);
    assert.equal(check.available, true);
  }
  assert.equal((await service.usernameAvailability(token, 'jose_reyes')).available, true);
  client.tables.users.push({ id: 'literal', username: 'Jose_Reyes' });
  assert.equal((await service.usernameAvailability(token, 'jose_reyes')).available, false);
  for (const invalid of ['ab', 'bad%name', 'bad*name', 'bad name', '_name', 'a'.repeat(31)]) {
    const result = await service.usernameAvailability(token, invalid);
    assert.equal(result.valid, false);
    assert.deepEqual(result.suggestions, []);
  }
  assert.equal(client.writes.length, 0);
});

test('student verification requires code and matching name, hides the public roster and never writes', async () => {
  fixture();
  const verified = await service.verifyStudent(token, { registrationCode: code.toLowerCase().replaceAll('-', ' '), fullName: ' JUAN   DELA CRUZ ' });
  assert.equal(verified.id, studentId);
  const invitation = await service.publicInvitation(token);
  assert.deepEqual(Object.keys(invitation).sort(), ['className', 'expiresAt', 'status']);
  await rejects(service.verifyStudent(token, { registrationCode: code, fullName: 'Wrong Student' }), 400, /do not match/);
  await rejects(service.verifyStudent(token, { registrationCode: 'AAAA-BBBB-CCCC-DDDD-EEEE-FFFF', fullName: 'Juan dela Cruz' }), 400, /do not match/);
  await rejects(service.verifyStudent(token, { registrationCode: 'bad', fullName: 'Juan dela Cruz' }), 400, /matching full name/);
  await rejects(service.verifyStudent('f'.repeat(64), { registrationCode: code, fullName: 'Juan dela Cruz' }), 404, /invalid|unavailable/);
  assert.equal(client.writes.length, 0);
});

test('used codes, expired invitations, unavailable teachers/classes and inactive sections fail before writes', async () => {
  const request = { registrationCode: code, fullName: 'Juan dela Cruz' };
  fixture();
  client.tables.class_registration_students[0].registered_at = new Date().toISOString();
  await rejects(service.verifyStudent(token, request), 409, /already been used/);
  fixture();
  client.tables.class_invitations[0].expires_at = new Date(Date.now() - 1000).toISOString();
  await rejects(service.verifyStudent(token, request), 410, /expired/);
  fixture();
  client.tables.class_invitations[0].status = 'revoked';
  await rejects(service.verifyStudent(token, request), 404, /invalid|unavailable/);
  fixture();
  client.tables.subjects[0].teacher_id = 'another-teacher';
  await rejects(service.verifyStudent(token, request), 404, /class is unavailable/);
  fixture();
  client.tables.users[0].status = 'suspended';
  await rejects(service.verifyStudent(token, request), 404, /class is unavailable/);
  fixture();
  client.tables.sections[0].is_active = false;
  await rejects(service.verifyStudent(token, request), 409, /section is no longer available/);
  assert.equal(client.writes.length, 0);
});

test('tampered create payloads cannot bypass section, duplicate, ownership, expiry or name validation', async () => {
  fixture();
  await rejects(service.createInvitation(teacherId, { subjectId, records: [{ fullName: 'Juan dela Cruz', section: 'Charity', status: 'valid', errors: [] }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation(teacherId, { subjectId, records: [{ fullName: 'Maria Santos', section: 'Unknown', sectionId: 'charity', status: 'valid' }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation(teacherId, { subjectId, records: [{ fullName: { value: 'Maria Santos' }, section: 'Charity', status: 'valid' }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation(teacherId, { subjectId, records: [{ fullName: 'Maria Santos', section: 'Charity' }, { fullName: 'MARIA   SANTOS', section: 'Charity' }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation('foreign-teacher', { subjectId, records: [{ fullName: 'Maria Santos', section: 'Charity' }] }), 404, /does not belong/);
  await rejects(service.createInvitation(teacherId, { subjectId, expiresInDays: 91, records: [{ fullName: 'Maria Santos', section: 'Charity' }] }), 400, /1 and 90/);
  assert.equal(client.writes.length, 0);
});

test('registration revalidates email, password and username rather than trusting successful verification', async () => {
  fixture();
  const base = { registrationCode: code, fullName: 'Juan dela Cruz', email: 'juan@gmail.com', username: 'juan.cruz', password: 'StrongPass1', confirmPassword: 'StrongPass1' };
  await rejects(service.registerStudent(token, { ...base, email: 'juan@example.com' }), 400, /Gmail/);
  await rejects(service.registerStudent(token, { ...base, username: 'bad*name' }), 400, /Username/);
  await rejects(service.registerStudent(token, { ...base, confirmPassword: 'Different1' }), 400, /do not match/);
  await rejects(service.registerStudent(token, { ...base, password: 'weak', confirmPassword: 'weak' }), 400, /at least 8/);
  assert.equal(client.writes.length, 0);
});

test('valid creation sends only server-mapped sections and code hashes, then returns the teacher invitation', async () => {
  fixture({ class_invitations: [], class_registration_students: [] });
  let rpcInput;
  client.rpc = async (name, input) => {
    assert.equal(name, 'import_class_invitation');
    rpcInput = input;
    client.tables.class_invitations.push({ id: input.p_invitation_id, subject_id: input.p_subject_id, teacher_id: input.p_teacher_id,
      token_hash: input.p_token_hash, expires_at: input.p_expires_at, status: 'active' });
    input.p_records.forEach(row => client.tables.class_registration_students.push({ ...row, teacher_id: teacherId,
      invitation_id: input.p_invitation_id, section_name: 'Charity', registered_at: null, student_id: null }));
    return { data: input.p_invitation_id, error: null };
  };
  const invitation = await service.createInvitation(teacherId, { subjectId, records: [{ fullName: ' Maria   Santos ', section: 'CHARITY',
    sectionId: 'tampered', normalizedName: 'tampered', registrationCode: 'tampered', cellErrors: 'tampered', status: 'registered' }], expiresInDays: 7 });
  assert.equal(invitation.totalCount, 1);
  assert.equal(invitation.registeredCount, 0);
  assert.equal(invitation.unregisteredCount, 1);
  assert.equal(rpcInput.p_records[0].section_id, 'charity');
  assert.equal(rpcInput.p_records[0].normalized_name, 'maria santos');
  assert.equal(rpcInput.p_records[0].code_hash, digest(invitation.students[0].registrationCode));
  assert.equal(rpcInput.p_records[0].registrationCode, undefined);
  assert.equal(rpcInput.p_token_hash, digest(invitation.invitationUrl.split('/').at(-1)));
});

test('registration ignores client enrollment fields and hashes the password before the atomic RPC', async () => {
  fixture();
  let rpcInput;
  client.rpc = async (name, input) => {
    assert.equal(name, 'register_class_invitation_student');
    rpcInput = input;
    return { data: 'new-student-id', error: null };
  };
  const result = await service.registerStudent(token, { registrationCode: code, fullName: 'JUAN DELA CRUZ', email: 'JUAN@gmail.com',
    username: 'Juan.Cruz', password: 'StrongPass1', confirmPassword: 'StrongPass1', subjectId: 'foreign-class', sectionId: 'foreign-section', role: 'admin' });
  assert.equal(result.studentId, 'new-student-id');
  assert.equal(rpcInput.p_email, 'juan@gmail.com');
  assert.equal(rpcInput.p_username, 'Juan.Cruz');
  assert.equal(rpcInput.p_code_hash, digest(code));
  assert.equal(rpcInput.p_normalized_name, 'juan dela cruz');
  assert.equal(rpcInput.subjectId, undefined);
  assert.equal(rpcInput.role, undefined);
  assert.ok(await bcrypt.compare('StrongPass1', rpcInput.p_password_hash));
});

test('unknown persistence errors are sanitized and conflict errors have clear messages', () => {
  const failure = service.databaseError({ message: 'database password secret / sql internal' });
  assert.equal(failure.statusCode, 503);
  assert.doesNotMatch(failure.message, /password|secret|sql/);
  assert.equal(service.databaseError({ code: '23505', message: 'users_username_lower_unique' }).statusCode, 409);
  assert.match(service.databaseError({ message: 'INVITATION_EXPIRED' }).message, /expired/);
});
