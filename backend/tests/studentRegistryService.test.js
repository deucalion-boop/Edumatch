const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
const gmail = require('../services/gmailService');
let client, rpcCalls, mailCalls, behavior, delivery;
storage.getSupabaseStorageClient = () => client;
gmail.sendEmailViaGmail = async input => { mailCalls.push(input); return delivery; };
process.env.STUDENT_REGISTRY_SECRET = 'test-student-registry-secret-at-least-32-characters';
process.env.FRONTEND_URL = 'https://edumatch.example';
const service = require('../services/studentRegistryService');
const future = (ms = 86400000) => new Date(Date.now() + ms).toISOString();
const token = service.linkToken('school-nonce');
const ticket = 'b'.repeat(64);
const proof = 'c'.repeat(64);
const codeRow = { id: 'registry-one', code_nonce: 'secure-code-nonce' };
const student = { ...codeRow, first_name: 'Maria', last_name: 'Santos', full_name: 'Maria Santos', code_hash: service.digest(service.registrationCode(codeRow)), code_expires_at: future(), created_at: new Date().toISOString() };
function fixture(extra = {}) {
  client = createFakeSupabase({ users: [{ id: 'ht', role: 'headteacher', status: 'active', archive: {}, department: 'Mathematics' }], subjects: [], student_registry: [student],
    student_registry_assignments: [], student_registry_links: [{ id: 'school', token_nonce: 'school-nonce', token_hash: service.digest(token), expires_at: future() }],
    student_registry_sessions: [{ id: 'session-one', registry_id: student.id, link_hash: service.digest(token), ticket_hash: service.digest(ticket), expires_at: future(1800000) }], ...extra });
  rpcCalls = []; mailCalls = []; delivery = { sent: true };
  behavior = async (name, args) => name === 'student_registry_link' ? { data: client.tables.student_registry_links[0] } : assert.fail(`Unexpected ${name}`);
  client.rpc = async (name, args) => { rpcCalls.push({ name, args }); return behavior(name, args); };
  client.auth = { admin: { createUser: async () => assert.fail('Unexpected Auth creation'), updateUserById: async id => ({ data: { user: { id } } }) } };
}
const signup = (extra = {}) => ({ studentVerificationToken: ticket, verificationToken: proof, email: 'student@school.edu.ph', username: 'Maria_Santos', password: 'SafePassword1', confirmPassword: 'SafePassword1', ...extra });

test('school registry management rejects inactive and non Head Teacher accounts before mutation', async () => {
  for (const change of [{ role: 'teacher' }, { role: 'admin' }, { status: 'inactive' }, { archive: { isArchived: true } }]) {
    fixture(); Object.assign(client.tables.users[0], change);
    await assert.rejects(service.list('ht'), { statusCode: 403 });
    await assert.rejects(service.importStudents('ht', { records: [{ firstName: 'Maria', lastName: 'Santos' }] }), { statusCode: 403 });
    assert.equal(rpcCalls.length, 0);
  }
});
test('class choices are limited to active teachers in the Head Teacher department', async () => {
  fixture({
    users: [
      { id: 'ht', role: 'headteacher', status: 'active', archive: {}, department: 'Mathematics' },
      { id: 'math-teacher', name: 'Math Teacher', role: 'teacher', status: 'active', archive: {}, department: 'Mathematics' },
      { id: 'science-teacher', name: 'Science Teacher', role: 'teacher', status: 'active', archive: {}, department: 'Science' },
    ],
    subjects: [
      { id: 'math', name: 'Mathematics', class_name: 'Math Class', teacher_id: 'math-teacher', is_active: true },
      { id: 'science', name: 'Science', class_name: 'Science Class', teacher_id: 'science-teacher', is_active: true },
    ],
    student_registry_assignments: [{ registry_id: student.id, subject_id: 'science' }],
  });
  const response = await service.list('ht');
  assert.deepEqual(response.classes.map(row => row.id), ['math']);
  assert.deepEqual(response.students[0].assignments.map(row => row.subjectId), ['science']);
});
test('public shared link exposes no student names, codes, hashes or nonces', async () => {
  fixture(); const response = await service.details(token);
  assert.deepEqual(Object.keys(response), ['registration']);
  for (const value of ['Maria', 'Santos', codeRow.code_nonce, student.code_hash]) assert.equal(JSON.stringify(response).includes(value), false);
  await assert.rejects(service.details('bad'), { code: 'INVITATION_INVALID' });
  client.tables.student_registry_links[0].expires_at = future(-1);
  await assert.rejects(service.details(token), { code: 'INVITATION_EXPIRED' });
});
test('import enforces missing fields, Unicode/case duplicates and possible duplicates on the server', () => {
  const rows = service.validateRecords([{ firstName: '', lastName: 'Santos' }, { firstName: 'Ｍａｒｉａ', lastName: 'Santos' },
    { firstName: 'maria', lastName: 'santos' }, { firstName: 'Jose', lastName: 'Cruz' }], [{ full_name: 'José Cruz' }]);
  assert.equal(rows[0].status, 'invalid'); assert.match(rows[1].errors.join(' '), /Duplicate/); assert.match(rows[2].errors.join(' '), /Duplicate/);
  assert.equal(rows[3].status, 'valid'); assert.equal(rows[3].warnings.length, 1);
  assert.throws(() => service.validateRecords([], []));
});
test('import revalidates preview, requires duplicate acknowledgement and sends only secure code hashes', async () => {
  fixture({ student_registry: [{ ...student, full_name: 'José Cruz' }] });
  const body = { subjectId: 'math-class', records: [{ firstName: 'Jose', lastName: 'Cruz' }] };
  await assert.rejects(service.importStudents('ht', { records: [{ firstName: 'Ana', lastName: 'Reyes' }] }), /Select an active teacher class/);
  await assert.rejects(service.importStudents('ht', body), /possible duplicates/);
  behavior = async (name, args) => {
    assert.equal(name, 'student_registry_import_assigned');
    assert.equal(args.p_subject_id, 'math-class');
    const row = args.p_records[0];
    assert.equal(row.firstName, 'Jose'); assert.equal(row.lastName, 'Cruz');
    assert.equal(Object.hasOwn(row, 'registrationCode'), false); return { data: 1 };
  };
  assert.equal((await service.importStudents('ht', { ...body, allowPossibleDuplicates: true })).imported, 1);
  await assert.rejects(service.importStudents('ht', { subjectId: 'math-class', records: [{ firstName: 'José', lastName: 'Cruz' }] }), /invalid records/);
});
test('code verification normalizes formatting, stores only a ticket hash, and returns proof only after SQL validation', async () => {
  fixture(); behavior = async (name, args) => {
    assert.equal(name, 'student_registry_verify'); assert.equal(args.p_full_name, 'Maria Santos');
    assert.match(args.p_ticket_hash, /^[a-f0-9]{64}$/); return { data: { student: { id: student.id, fullName: student.full_name }, expiresAt: future() } };
  };
  const response = await service.verifyStudent(token, { fullName: ' Maria   Santos ' });
  assert.equal(service.digest(response.studentVerificationToken), rpcCalls[0].args.p_ticket_hash);
  assert.equal(response.student.fullName, 'Maria Santos');
});
test('username availability requires a valid ticket, ignores case and treats underscores literally', async () => {
  fixture(); client.tables.users.push({ id: 'existing', username: 'MARIA_SANTOS' });
  const taken = await service.usernameAvailability(token, { studentVerificationToken: ticket, username: 'maria_santos' });
  assert.equal(taken.available, false); assert.ok(taken.suggestions.length); assert.equal(new Set(taken.suggestions).size, taken.suggestions.length);
  assert.equal((await service.usernameAvailability(token, { studentVerificationToken: ticket, username: 'mariaXsantos' })).available, true);
  await assert.rejects(service.usernameAvailability(token, { studentVerificationToken: 'd'.repeat(64), username: 'test' }), { code: 'SESSION_INVALID' });
});
test('email challenge binds ticket, email and challenge and invalidates only an undelivered attempt', async () => {
  fixture(); delivery = { sent: false };
  behavior = async (name, args) => {
    assert.equal(name, 'student_registry_prepare_email'); assert.equal(args.p_ticket_hash, service.digest(ticket)); assert.equal(args.p_email, 'student@school.edu.ph');
    assert.match(args.p_code_hash, /^[a-f0-9]{64}$/);
    Object.assign(client.tables.student_registry_sessions[0], { email_challenge_id: args.p_challenge_id, email_code_hash: args.p_code_hash });
    return { data: client.tables.student_registry_sessions[0] };
  };
  await assert.rejects(service.sendEmailCode(token, signup()), { code: 'EMAIL_DELIVERY_FAILED' });
  assert.equal(client.tables.student_registry_sessions[0].email_code_hash, null); assert.equal(mailCalls.length, 1);
  assert.equal(mailCalls[0].signal instanceof AbortSignal, true);
});
test('incorrect email verification returns no proof; success returns a separately hashed proof', async () => {
  fixture(); behavior = async () => ({ data: { verified: false, code: 'EMAIL_CODE_LOCKED' } });
  const input = { ...signup(), challengeId: 'challenge-one', code: '123456' };
  await assert.rejects(service.verifyEmail(token, input), { code: 'EMAIL_CODE_LOCKED' });
  behavior = async (name, args) => { assert.equal(name, 'student_registry_verify_email'); assert.equal(args.p_ticket_hash, service.digest(ticket)); return { data: { verified: true, expiresAt: future() } }; };
  const response = await service.verifyEmail(token, input);
  assert.equal(service.digest(response.verificationToken), rpcCalls.at(-1).args.p_verification_hash);
});
test('registration creates Supabase Auth only after all SQL checks and derives role identity from trusted claim', async () => {
  fixture(); const events = [];
  behavior = async (name, args) => {
    events.push(name);
    if (name === 'student_registry_begin') { assert.equal(args.p_verification_hash, service.digest(proof)); return { data: { registryId: student.id } }; }
    assert.equal(name, 'student_registry_finish'); assert.equal(args.p_auth_user_id, 'auth-user-one'); return { data: 'public-user-one' };
  };
  client.auth.admin.createUser = async input => { events.push('auth'); assert.equal(input.email_confirm, true); assert.equal(input.app_metadata.student_registry_id, student.id); assert.ok(input.app_metadata.registry_claim_id); assert.equal(Object.hasOwn(input, 'role'), false); return { data: { user: { id: 'auth-user-one' } } }; };
  await service.registerStudent(token, signup({ role: 'admin', studentId: 'forged' }));
  assert.deepEqual(events, ['student_registry_begin', 'auth', 'student_registry_finish']);
  assert.equal(JSON.stringify(rpcCalls).includes('SafePassword1'), false);
});
test('invalid proof, password or conflicting username never creates an Auth account', async () => {
  fixture(); behavior = async () => ({ error: { message: 'USERNAME_TAKEN' } });
  await assert.rejects(service.registerStudent(token, signup()), { code: 'USERNAME_TAKEN' });
  await assert.rejects(service.registerStudent(token, signup({ verificationToken: 'bad' })), { code: 'EMAIL_VERIFICATION_REQUIRED' });
  await assert.rejects(service.registerStudent(token, signup({ password: 'weak', confirmPassword: 'weak' })), { statusCode: 400 });
});
test('lost Auth response and finalizer response recover the exact claim without duplicate accounts or deletion', async () => {
  fixture(); let authCreated = 0, completed = false, owner;
  behavior = async (name, args) => {
    if (name === 'student_registry_begin') {
      owner ||= args.p_claim_id; assert.equal(args.p_claim_id, owner);
      return { data: { registryId: student.id, ...(authCreated ? { authUserId: 'owned-auth-id' } : {}), ...(completed ? { userId: 'committed-user-id' } : {}) } };
    }
    completed = true; return { error: { message: 'connection lost after commit' } };
  };
  client.auth.admin.createUser = async () => { authCreated++; throw new Error('response lost after Auth committed'); };
  await assert.rejects(service.registerStudent(token, signup()), { code: 'REGISTRY_UNAVAILABLE' });
  assert.match((await service.registerStudent(token, signup())).message, /complete/);
  assert.equal(authCreated, 1);
});
test('exports current filters with codes as strings, and template has exactly the required headers', async () => {
  fixture();
  const exported = new ExcelJS.Workbook(); await exported.xlsx.load(await service.workbook('ht', { status: 'pending' }));
  assert.equal(exported.worksheets[0].rowCount, 2); assert.equal(typeof exported.worksheets[0].getCell('G2').value, 'string');
  const template = new ExcelJS.Workbook(); await template.xlsx.load(await service.workbook('ht', {}, true));
  assert.deepEqual(template.worksheets[0].getRow(1).values.slice(1), ['First Name', 'Last Name']);
  assert.equal(template.worksheets[0].columnCount, 2);
});
test('fresh verified session can resume only the unfinished Auth identity authorized by the database claim ledger', async () => {
  fixture(); let bound = false;
  behavior = async (name, args) => {
    if (name === 'student_registry_begin') return { data: { registryId: student.id, authUserId: 'owned-orphan', authNeedsRebind: true } };
    assert.equal(name, 'student_registry_finish'); assert.equal(bound, true); assert.equal(args.p_auth_user_id, 'owned-orphan'); return { data: 'student-one' };
  };
  client.auth.admin.updateUserById = async (id, input) => {
    assert.equal(id, 'owned-orphan'); assert.equal(input.app_metadata.student_registry_id, student.id);
    assert.equal(input.app_metadata.registry_claim_id, rpcCalls[0].args.p_claim_id); assert.equal(input.password, 'SafePassword1');
    bound = true; return { data: { user: { id } } };
  };
  await service.registerStudent(token, signup());
  assert.equal(bound, true);
});
test('missing migration and SQL errors are actionable without exposing secrets or SQL details', () => {
  assert.equal(service.databaseError({ code: '42703', message: 'private.column' }).code, 'REGISTRY_SCHEMA_REQUIRED');
  assert.equal(service.databaseError({ message: 'sensitive SQL token secret' }).message.includes('secret'), false);
});
