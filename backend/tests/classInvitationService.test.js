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
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

function fixture(extra = {}) {
  client = createFakeSupabase({
    users: [{ id: teacherId, name: 'Teacher One', role: 'teacher', status: 'active', archive: {}, advisory_section_id: 'charity', subject: 'Science', department: 'Science' }],
    subjects: [{ id: subjectId, teacher_id: teacherId, name: 'Science', class_name: 'Science A', track: 'GENERAL', is_active: true, advisory_section_id: 'charity' }],
    sections: [{ id: 'charity', name: 'Charity', is_active: true }, { id: 'hope', name: 'Hope', is_active: true }, { id: 'inactive-section', name: 'Inactive', is_active: false }],
    class_invitations: [{ id: invitationId, teacher_id: teacherId, subject_id: subjectId, status: 'active',
      token_hash: digest(token), expires_at: new Date(Date.now() + 86400000).toISOString() }],
    class_registration_students: [{ id: studentId, invitation_id: invitationId, teacher_id: teacherId,
      full_name: 'Juan dela Cruz', normalized_name: 'juan dela cruz', section_id: 'charity', section_name: 'Charity',
      registered_at: null, student_id: null }],
    ...extra,
  });
  client.rpc = async () => { assert.fail('An invalid request must not call a mutation RPC'); };
  return client;
}
async function workbook(rows, headers = ['First Name', 'Last Name']) {
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

test('real two-column XLSX preview preserves name parts and composes names with the trusted advisory section', async () => {
  fixture({ class_registration_students: [] });
  const preview = await service.previewRoster(teacherId,
    await workbook([['  Maria   Clara ', ' Santos '], ['Jose', 'Reyes']]));
  assert.equal(preview.validCount, 2);
  assert.equal(preview.invalidCount, 0);
  assert.equal(preview.advisorySection.id, 'charity');
  assert.equal(preview.advisoryClass.id, subjectId);
  assert.deepEqual(preview.records.map(row => [row.firstName, row.lastName, row.fullName, row.section, row.sectionId, row.status]),
    [['Maria Clara', 'Santos', 'Maria Clara Santos', 'Charity', 'charity', 'valid'], ['Jose', 'Reyes', 'Jose Reyes', 'Charity', 'charity', 'valid']]);
  assert.equal(client.writes.length, 0);
});

test('preview detects duplicate composed names after case, whitespace and Unicode normalization', async () => {
  fixture();
  client.tables.users.push({ id: 'existing', name: 'ANNA   CRUZ', role: 'student', status: 'active' });
  const preview = await service.previewRoster(teacherId, await workbook([
    ['Maria', 'Santos'], ['  ＭＡＲＩＡ ', '  ＳＡＮＴＯＳ '], ['JUAN', 'DELA CRUZ'], ['Anna', 'Cruz'],
  ]));
  assert.equal(preview.validCount, 0);
  assert.equal(preview.invalidCount, 4);
  assert.match(preview.records[0].errors.join(' '), /Duplicate full name/);
  assert.match(preview.records[1].errors.join(' '), /Duplicate full name/);
  assert.match(preview.records[2].errors.join(' '), /already has an account/);
  assert.match(preview.records[3].errors.join(' '), /already has an account/);
  assert.equal(client.writes.length, 0);
});

test('the designated advisory section applies to the whole roster and cannot be overridden by the request', async () => {
  fixture({ class_registration_students: [] });
  const input = await workbook([["Anne-Marie", "O'Connor"], ['José Luis', 'de la Peña'], ['李', '明']]);
  const preview = await service.previewRoster(teacherId, input);
  assert.equal(preview.validCount, 3);
  assert.ok(preview.records.every(row => row.sectionId === 'charity' && row.section === 'Charity'));
  assert.deepEqual(preview.records.map(row => row.fullName), ["Anne-Marie O'Connor", 'José Luis de la Peña', '李 明']);
  const reversed = await service.previewRoster(teacherId, await workbook([['Santos', 'Maria']], ['Last Name', 'First Name']));
  assert.equal(reversed.records[0].fullName, 'Maria Santos');
  assert.equal(reversed.records[0].sectionId, 'charity');
  // Legacy subject/section selections in the create payload are rejected outright.
  await rejects(service.createInvitation(teacherId, { subjectId, records: [{ firstName: 'Maria', lastName: 'Santos' }] }),
    400, /assigned automatically/);
  await rejects(service.createInvitation(teacherId, { sectionId: 'hope', records: [{ firstName: 'Maria', lastName: 'Santos' }] }),
    400, /assigned automatically/);
  assert.equal(client.writes.length, 0);
});

test('inactive, unknown or missing advisory sections fail actionably before any roster work', async () => {
  fixture({ class_registration_students: [] });
  const input = await workbook([['Maria', 'Santos']]);
  client.tables.users[0].advisory_section_id = null;
  await rejects(service.previewRoster(teacherId, input), 409, /advisory section is not assigned or active/i);
  client.tables.users[0].advisory_section_id = 'unknown-section';
  await rejects(service.previewRoster(teacherId, input), 409, /advisory section is not assigned or active/i);
  await rejects(service.createInvitation(teacherId, { records: [{ firstName: 'Maria', lastName: 'Santos' }] }),
    409, /advisory section is not assigned or active/i);
  client.tables.users[0].advisory_section_id = 'inactive-section';
  await rejects(service.previewRoster(teacherId, input), 409, /advisory section is not assigned or active/i);
  client.tables.users[0].advisory_section_id = 'charity';
  assert.equal((await service.previewRoster(teacherId, input)).validCount, 1);
  assert.equal(client.writes.length, 0);
});

test('only First Name and Last Name Excel headers are accepted; formulas, numbers, missing parts and file limits are validated', async () => {
  fixture({ class_registration_students: [] });
  await rejects(service.parseWorkbook(await workbook([['Maria', 'Santos']], ['Name', 'Class'])), 400, /First Name and Last Name/);
  await rejects(service.parseWorkbook(await workbook([['Maria', 'Santos']], ['Full Name', 'Section'])), 400, /First Name and Last Name/);
  await rejects(service.parseWorkbook(await workbook([['Maria', 'Santos', 'Charity']], ['First Name', 'Last Name', 'Section'])), 400, /Only First Name and Last Name/);
  await rejects(service.parseWorkbook(await workbook([['Maria', 'Santos']], ['First Name', 'Last Name', 'Last Name'])), 400, /Duplicate column headers/);
  await rejects(service.parseWorkbook(await workbook([['Maria', 'Santos', 'hidden extra data']])), 400, /extra columns/);
  const preview = await service.previewRoster(teacherId, await workbook([
    [{ formula: '"Maria"', result: 'Maria' }, 'Santos'], [12345, 'Cruz'], ['Jose', { formula: '"Reyes"', result: 'Reyes' }],
    ['Maria', 12345], ['', 'Reyes'], ['Pedro', ''], ['12345', 'Cruz'], ['Jose', '12345'],
  ]));
  assert.equal(preview.invalidCount, 8);
  assert.ok(preview.records.slice(0, 4).every(row => row.errors.some(error => error.includes('plain text'))));
  assert.ok(preview.records.slice(4).every(row => row.errors.some(error => error.includes('required'))));
  await rejects(service.parseWorkbook(Buffer.alloc(service.MAX_FILE_BYTES + 1)), 400, /2 MB/);
  await rejects(service.parseWorkbook(Buffer.from('invalid excel file')), 400, /valid Excel/);
  await rejects(service.parseWorkbook(Buffer.alloc(100)), 400, /damaged|unsupported/);
  await rejects(service.parseWorkbook(await workbook(Array.from({ length: 1001 }, (_, index) => [`Student ${index}`, 'Name']))), 400, /1000/);
  const multipleSheets = new ExcelJS.Workbook();
  multipleSheets.addWorksheet('First').addRow(['First Name', 'Last Name']);
  multipleSheets.addWorksheet('Second').addRow(['First Name', 'Last Name']);
  await rejects(service.parseWorkbook(Buffer.from(await multipleSheets.xlsx.writeBuffer())), 400, /More than one worksheet/);
});

test('a real Student Import Excel table is selected with Instructions before or after it and blank/formatted tabs ignored', async () => {
  fixture({ class_registration_students: [] });
  for (const position of ['before', 'after']) {
    const file = new ExcelJS.Workbook();
    const addInstructions = () => {
      const sheet = file.addWorksheet('Instructions');
      sheet.addRow(['EduMatch Student Import Instructions']);
      sheet.addRow(['Enter each student in the Student Import tab.']);
      sheet.addRow(['Use only First Name and Last Name. Your advisory section is applied automatically.']);
    };
    if (position === 'before') addInstructions();
    const students = file.addWorksheet('Student Import');
    students.addTable({ name: 'StudentImport', ref: 'A1', headerRow: true, totalsRow: false,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [{ name: 'First Name' }, { name: 'Last Name' }],
      rows: [['Juan Carlos', 'Santos'], ['Maria', 'Dela Cruz']],
    });
    if (position === 'after') addInstructions();
    file.addWorksheet('Blank');
    file.addWorksheet('Formatted Blank').getCell('J50').font = { bold: true };
    const unrelated = file.addWorksheet('School Notes');
    unrelated.addRow(['Notes', 'Teacher']);
    unrelated.addRow(['Share the class invitation link with your students.', 'Teacher One']);
    const parsed = await service.parseWorkbook(Buffer.from(await file.xlsx.writeBuffer()));
    assert.deepEqual(parsed.map(row => [row.rowNumber, row.firstName, row.lastName]),
      [[2, 'Juan Carlos', 'Santos'], [3, 'Maria', 'Dela Cruz']]);
    const preview = await service.previewRoster(teacherId, Buffer.from(await file.xlsx.writeBuffer()));
    assert.equal(preview.validCount, 2);
    assert.ok(preview.records.every(row => row.sectionId === 'charity'));
  }
  assert.equal(client.writes.length, 0);
});

test('multiple student worksheets are rejected explicitly rather than importing an arbitrary list', async () => {
  const file = new ExcelJS.Workbook();
  file.addWorksheet('Instructions').addRow(['Use one student list per import.']);
  for (const name of ['Student Import', 'Second Class']) {
    const sheet = file.addWorksheet(name);
    sheet.addRow(['First Name', 'Last Name']);
    sheet.addRow(['Maria', 'Santos']);
  }
  await rejects(service.parseWorkbook(Buffer.from(await file.xlsx.writeBuffer())), 400,
    /More than one worksheet contains First Name and Last Name/);
});

test('an identified student worksheet still rejects extra or duplicate columns even with separate instruction tabs', async () => {
  for (const headers of [['First Name', 'Last Name', 'Section'], ['First Name', 'Last Name', 'Last Name']]) {
    const file = new ExcelJS.Workbook();
    file.addWorksheet('Instructions').addRow(['Enter your student list in the Student Import tab.']);
    const students = file.addWorksheet('Student Import');
    students.addRow(headers);
    students.addRow(['Maria', 'Santos', 'Charity']);
    await rejects(service.parseWorkbook(Buffer.from(await file.xlsx.writeBuffer())), 400,
      headers[2] === 'Section' ? /Only First Name and Last Name|extra columns/ : /Duplicate column headers/);
  }
});

test('workbooks without any student header row produce an actionable header error', async () => {
  const file = new ExcelJS.Workbook();
  file.addWorksheet('Instructions').addRow(['EduMatch Student Import Instructions']);
  const notes = file.addWorksheet('Notes');
  notes.addRow(['Name', 'Class']);
  notes.addRow(['Maria Santos', 'Charity']);
  file.addWorksheet('Blank');
  await rejects(service.parseWorkbook(Buffer.from(await file.xlsx.writeBuffer())), 400, /First Name and Last Name/);
});

test('archive validation rejects forged central-directory sizes before ExcelJS decompresses', async () => {
  const valid = await workbook([['Maria', 'Santos']]);
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

test('student verification matches only the imported full name, hides the public roster and never writes', async () => {
  fixture();
  const verified = await service.verifyStudent(token, { fullName: ' ＪＵＡＮ   ＤＥＬＡ ＣＲＵＺ ' });
  assert.equal(verified.id, studentId);
  const invitation = await service.publicInvitation(token);
  assert.deepEqual(Object.keys(invitation).sort(), ['className', 'expiresAt', 'status']);
  await rejects(service.verifyStudent(token, { fullName: 'Wrong Student' }), 400, /not found on this class invitation/);
  await rejects(service.verifyStudent(token, { fullName: 'Juan dela Crux' }), 400, /not found/);
  await rejects(service.verifyStudent(token, { fullName: 'Juan' }), 400, /not found/);
  for (const invalid of ['', 'ab', '12345', { name: 'Juan dela Cruz' }]) {
    await rejects(service.verifyStudent(token, { fullName: invalid }), 400, /Enter your full name/);
  }
  await rejects(service.verifyStudent('f'.repeat(64), { fullName: 'Juan dela Cruz' }), 404, /invalid|unavailable/);
  assert.equal(client.writes.length, 0);
});

test('registered students, expired invitations, unavailable teachers/classes and inactive sections fail before writes', async () => {
  const request = { fullName: 'Juan dela Cruz' };
  fixture();
  client.tables.class_registration_students[0].registered_at = new Date().toISOString();
  await rejects(service.verifyStudent(token, request), 409, /already registered/);
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
  await rejects(service.verifyStudent(token, request), 404, /advisory class/);
  assert.equal(client.writes.length, 0);
});

test('removing a class invitation revokes only its link and preserves registered students', async () => {
  fixture();
  client.tables.class_registration_students[0].registered_at = new Date().toISOString();
  client.tables.class_registration_students[0].student_id = 'registered-student-id';
  const result = await service.revokeInvitation(teacherId, invitationId);
  assert.deepEqual(result, { id: invitationId, status: 'revoked' });
  assert.equal(client.tables.class_invitations[0].status, 'revoked');
  assert.ok(client.tables.class_invitations[0].updated_at);
  assert.equal(client.tables.class_registration_students.length, 1);
  assert.equal(client.tables.class_registration_students[0].student_id, 'registered-student-id');
  await service.revokeInvitation(teacherId, invitationId);
  assert.equal(client.writes.filter(write => write.table === 'class_invitations').length, 1);
  await rejects(service.revokeInvitation('another-teacher', invitationId), 403, /unavailable for this teacher account/i);
});

test('create payloads cannot bypass required name parts, duplicates, ownership or expiry', async () => {
  fixture();
  await rejects(service.createInvitation(teacherId, { records: [{ firstName: 'Juan', lastName: 'dela Cruz', fullName: 'Other Student', status: 'valid', errors: [] }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation(teacherId, { records: [{ fullName: 'Maria Santos', section: 'Charity', sectionId: 'charity', status: 'valid' }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation(teacherId, { records: [{ firstName: { value: 'Maria' }, lastName: 'Santos', status: 'valid' }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation(teacherId, { records: [{ firstName: 'Maria', lastName: 'Santos' }, { firstName: ' MARIA ', lastName: ' SANTOS ' }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation(teacherId, { records: [{ firstName: 'Maria', lastName: '' }] }), 400, /invalid or duplicate/);
  await rejects(service.createInvitation(teacherId, { records: [{ firstName: '123', lastName: 'Santos' }] }), 400, /invalid or duplicate/);
  client.tables.users.push({ id: 'foreign-teacher', role: 'teacher', status: 'active', advisory_section_id: 'charity' });
  await rejects(service.createInvitation('foreign-teacher', { records: [{ firstName: 'Maria', lastName: 'Santos' }] }), 409, /default advisory class is unavailable/);
  await rejects(service.createInvitation(teacherId, { expiresInDays: 91, records: [{ firstName: 'Maria', lastName: 'Santos' }] }), 400, /1 and 90/);
  assert.equal(client.writes.length, 0);
});

test('registration revalidates email, password and username rather than trusting successful verification', async () => {
  fixture();
  const base = { fullName: 'Juan dela Cruz', email: 'juan@gmail.com', username: 'juan.cruz', password: 'StrongPass1', confirmPassword: 'StrongPass1' };
  await rejects(service.registerStudent(token, { ...base, email: 'juan@example.com' }), 400, /Gmail/);
  await rejects(service.registerStudent(token, { ...base, username: 'bad*name' }), 400, /Username/);
  await rejects(service.registerStudent(token, { ...base, confirmPassword: 'Different1' }), 400, /do not match/);
  await rejects(service.registerStudent(token, { ...base, password: 'weak', confirmPassword: 'weak' }), 400, /at least 8/);
  assert.equal(client.writes.length, 0);
});

test('valid creation sends only canonical names and server-mapped sections, then returns the teacher invitation', async () => {
  fixture({ class_invitations: [], class_registration_students: [] });
  let rpcInput;
  client.rpc = async (name, input) => {
    assert.equal(name, 'import_class_invitation');
    rpcInput = input;
    client.tables.class_invitations.push({ id: input.p_invitation_id, subject_id: input.p_subject_id, teacher_id: input.p_teacher_id,
      token_hash: input.p_token_hash, expires_at: input.p_expires_at, status: 'active' });
    input.p_records.forEach((row, index) => client.tables.class_registration_students.push({ ...row, id: `generated-row-${index}`, teacher_id: teacherId,
      invitation_id: input.p_invitation_id, section_name: 'Charity', registered_at: null, student_id: null }));
    return { data: input.p_invitation_id, error: null };
  };
  const invitation = await service.createInvitation(teacherId, { records: [{ firstName: ' Maria ', lastName: ' Santos ', fullName: 'Different Student', section: 'HOPE',
    sectionId: 'tampered', normalizedName: 'tampered', cellErrors: 'tampered', status: 'registered' }], expiresInDays: 7 });
  assert.equal(invitation.totalCount, 1);
  assert.equal(invitation.registeredCount, 0);
  assert.equal(invitation.unregisteredCount, 1);
  assert.equal(rpcInput.p_subject_id, subjectId);
  assert.equal(rpcInput.p_records[0].section_id, 'charity');
  assert.equal(rpcInput.p_records[0].normalized_name, 'maria santos');
  assert.equal(rpcInput.p_records[0].full_name, 'Maria Santos');
  assert.equal(invitation.students[0].fullName, 'Maria Santos');
  assert.deepEqual(Object.keys(rpcInput.p_records[0]).sort(), ['full_name', 'normalized_name', 'section_id']);
  assert.equal(rpcInput.p_records[0].code_hash, undefined);
  assert.equal(invitation.students[0].registrationCode, undefined);
  assert.equal(rpcInput.p_records[0].registrationCode, undefined);
  assert.equal(rpcInput.p_token_hash, digest(invitation.invitationUrl.split('/').at(-1)));
});

test('teacher can manually add a validated student to an active invitation', async () => {
  fixture();
  const invitation = await service.addInvitationStudent(teacherId, invitationId, { firstName: ' Maria ', lastName: ' Santos ' });
  assert.equal(invitation.totalCount, 2);
  assert.equal(invitation.unregisteredCount, 2);
  assert.ok(invitation.students.some(student => student.fullName === 'Maria Santos'));
  const added = client.tables.class_registration_students.find(row => row.normalized_name === 'maria santos');
  assert.equal(added.invitation_id, invitationId);
  assert.equal(added.teacher_id, teacherId);
  assert.equal(added.section_id, 'charity');
  assert.equal(added.section_name, 'Charity');
});

test('manual invitation entry rejects duplicate names and expired invitations', async () => {
  fixture();
  await rejects(service.addInvitationStudent(teacherId, invitationId, { firstName: 'Juan', lastName: 'dela Cruz' }), 400, /already has an account|imported student list/);
  client.tables.class_invitations[0].expires_at = new Date(Date.now() - 1000).toISOString();
  await rejects(service.addInvitationStudent(teacherId, invitationId, { firstName: 'Maria', lastName: 'Santos' }), 409, /Renew this invitation/);
});

test('registration ignores client enrollment fields and hashes the password before the atomic RPC', async () => {
  fixture();
  let rpcInput;
  client.rpc = async (name, input) => {
    assert.equal(name, 'register_class_invitation_student');
    rpcInput = input;
    return { data: 'new-student-id', error: null };
  };
  const result = await service.registerStudent(token, { fullName: 'JUAN DELA CRUZ', email: 'JUAN@gmail.com',
    username: 'Juan.Cruz', password: 'StrongPass1', confirmPassword: 'StrongPass1', subjectId: 'foreign-class', sectionId: 'foreign-section', role: 'admin' });
  assert.equal(result.studentId, 'new-student-id');
  assert.equal(rpcInput.p_email, 'juan@gmail.com');
  assert.equal(rpcInput.p_username, 'Juan.Cruz');
  assert.equal(rpcInput.p_code_hash, undefined);
  assert.equal(rpcInput.p_normalized_name, 'juan dela cruz');
  assert.equal(rpcInput.subjectId, undefined);
  assert.equal(rpcInput.role, undefined);
  assert.ok(await bcrypt.compare('StrongPass1', rpcInput.p_password_hash));
});

test('name verification is scoped to this class invitation and registered names cannot proceed to a registration write', async () => {
  fixture();
  client.tables.class_registration_students.push({ id: 'other-roster-entry', invitation_id: 'other-class-invitation',
    full_name: 'Maria Santos', normalized_name: 'maria santos', section_id: 'hope', section_name: 'Hope', registered_at: null, student_id: null });
  await rejects(service.verifyStudent(token, { fullName: 'Maria Santos' }), 400, /not found on this class invitation/);
  client.tables.class_registration_students[0].registered_at = new Date().toISOString();
  client.tables.class_registration_students[0].student_id = 'registered-student-id';
  await rejects(service.registerStudent(token, { fullName: 'Juan dela Cruz', email: 'different@gmail.com', username: 'new.username',
    password: 'StrongPass1', confirmPassword: 'StrongPass1' }), 409, /already registered/);
  assert.equal(client.writes.length, 0);
});

test('missing invitation schema returns an actionable error without exposing database details', async () => {
  for (const code of ['42P01', '42703', '42883', 'PGRST202', 'PGRST204', 'PGRST205']) {
    const failure = service.databaseError({ code, message: 'Missing public.subjects.advisory_section_id or import_class_invitation' });
    assert.equal(failure.statusCode, 503);
    assert.equal(failure.code, 'INVITATION_SCHEMA_REQUIRED');
    assert.match(failure.message, /database update/);
    assert.doesNotMatch(failure.message, /public|subjects|advisory_section_id|import_class_invitation/);
  }

  // Without migration 016 the advisory class can be read, but its trusted
  // section marker cannot be saved. Exercise that real provisioning path.
  fixture();
  delete client.tables.subjects[0].advisory_section_id;
  client.tables.subjects[0].class_name = 'Science 10 - Charity';
  client.failures.push({ table: 'subjects', operation: 'update',
    error: { code: 'PGRST204', message: 'Could not find advisory_section_id in subjects in the schema cache' } });
  await assert.rejects(service.getAdvisoryContext(teacherId), error => {
    assert.equal(error.statusCode, 503);
    assert.equal(error.code, 'INVITATION_SCHEMA_REQUIRED');
    assert.match(error.message, /database update/);
    return true;
  });
  assert.equal(client.writes.length, 0);
});

test('unknown persistence errors are sanitized and conflict errors have clear messages', () => {
  const failure = service.databaseError({ message: 'database password secret / sql internal' });
  assert.equal(failure.statusCode, 503);
  assert.doesNotMatch(failure.message, /password|secret|sql/);
  assert.equal(service.databaseError({ code: '23505', message: 'users_username_lower_unique' }).statusCode, 409);
  assert.match(service.databaseError({ message: 'INVITATION_EXPIRED' }).message, /expired/);
});
