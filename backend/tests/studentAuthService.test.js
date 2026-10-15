const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createFakeSupabase } = require('./helpers/fakeSupabase');

// Run the production account mapping and credential code with isolated provider
// clients. No real Supabase service-role client, session, or email is used.
function loadModule(relativePath, mocks) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = name => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name);
  loaded._compile(fs.readFileSync(filename, 'utf8'), filename);
  return loaded.exports;
}

const row = (changes = {}) => ({ id: 'registry-student', name: 'Juan Dela Cruz', email: 'juan@school.edu.ph', username: 'Juan.Cruz',
  auth_provider: 'supabase', auth_user_id: 'auth-juan', password_hash: null, role: 'student', status: 'active', archive: {}, ...changes });

function fixture(rows = [row()]) {
  const client = createFakeSupabase({ users: rows });
  const state = { clients: [], signIns: [], signOuts: [], updates: [], providerPassword: 'Password123', providerError: null,
    updateError: null, responseUser: null, providerThrows: false, signOutThrows: false, captchas: [], attempts: [], sessions: [], challenges: [],
    settings: { security: { maxLoginAttempts: 5, accountLockoutDurationMinutes: 15 }, maintenance: { maintenanceModeEnabled: false, maintenanceMessage: '' }, user: { emailVerificationRequired: false } } };
  client.auth = {
    signInWithPassword() { assert.fail('Credential sign-in must not use the shared admin client'); },
    admin: { async updateUserById(id, payload) {
      state.updates.push({ id, payload });
      if (state.updateError) return { error: state.updateError };
      state.providerPassword = payload.password;
      return { data: { user: { id } }, error: null };
    } },
  };
  const storage = { getSupabaseStorageClient: () => client,
    getSupabaseStorageConfig: () => ({ url: 'https://school.supabase.example', publishableKey: 'public-key', serviceRoleKey: 'private-service-key' }) };
  const bridge = loadModule('services/studentAuthService.js', {
    './supabaseStorageService': storage,
    '@supabase/supabase-js': { createClient(url, key, options) {
      const instance = { url, key, options, auth: {
        async signInWithPassword(credentials) {
          state.signIns.push({ instance, credentials });
          if (state.providerThrows) throw new Error('private network provider detail');
          if (state.providerError) return { error: state.providerError };
          if (credentials.password !== state.providerPassword) return { error: { status: 400, message: 'Invalid credentials' } };
          const matched = client.tables.users.find(user => user.email.toLowerCase() === credentials.email.toLowerCase());
          return { data: { user: state.responseUser || { id: matched?.auth_user_id, email: credentials.email, email_confirmed_at: new Date().toISOString() } }, error: null };
        },
        async signOut(options) { state.signOuts.push({ instance, options }); if (state.signOutThrows) throw new Error('local logout failed'); },
      } };
      state.clients.push(instance);
      return instance;
    } },
  });
  const persistence = {
    async revokeUserSessions() {}, async consumeOpenChallenges() {},
    async recordLoginAttempt(attempt) { state.attempts.push(attempt); },
    async createSession(session) { state.sessions.push(session); return session; }, async sessionExists() { return false; },
    async createChallenge(challenge) { state.challenges.push(challenge); return challenge; }, async deleteChallenge() {},
  };
  const accounts = loadModule('services/supabaseAccountService.js', { './supabaseStorageService': storage,
    './studentAuthService': bridge, './supabaseAuthPersistenceService': persistence });
  const controller = loadModule('controllers/authController.js', {
    '../services/supabaseAccountService': accounts,
    '../services/supabaseAuthPersistenceService': persistence,
    '../services/mathCaptchaService': { async consumeToken(token) { state.captchas.push(token); } },
    '../services/supabaseSettingsService': { async getAppSettings() { return state.settings; } },
    '../services/gmailService': { async sendEmailViaGmail() { return { sent: true }; } },
    '../utils/fileStorage': { resolveStoredFileUrl() { return ''; } },
  });
  return { client, state, bridge, accounts, controller };
}

const credentialAccount = (changes = {}) => ({ authProvider: 'supabase', authUserId: 'auth-juan', role: 'student', email: 'juan@school.edu.ph', ...changes });

test('Supabase student password checks use separate ephemeral clients and never mutate the shared admin client', async () => {
  const { state, bridge } = fixture([row(), row({ id: 'second', auth_user_id: 'auth-maria', email: 'maria@school.edu.ph' })]);
  assert.deepEqual(await Promise.all([
    bridge.verifyStudentPassword(credentialAccount(), 'Password123'),
    bridge.verifyStudentPassword(credentialAccount({ authUserId: 'auth-maria', email: 'maria@school.edu.ph' }), 'Password123'),
  ]), [true, true]);
  assert.equal(state.clients.length, 2);
  assert.notEqual(state.clients[0], state.clients[1]);
  for (const instance of state.clients) {
    assert.equal(instance.key, 'public-key');
    assert.deepEqual(instance.options.auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
  }
  assert.equal(state.signOuts.length, 2);
  assert.ok(state.signOuts.every(call => call.options.scope === 'local'));
});

test('provider identity id, email, confirmation, and account role must match before a password is accepted', async () => {
  const { state, bridge } = fixture();
  for (const user of [
    { id: 'another-auth-user', email: 'juan@school.edu.ph', email_confirmed_at: 'verified' },
    { id: 'auth-juan', email: 'someone@school.edu.ph', email_confirmed_at: 'verified' },
    { id: 'auth-juan', email: 'juan@school.edu.ph', email_confirmed_at: null },
  ]) {
    state.responseUser = user;
    assert.equal(await bridge.verifyStudentPassword(credentialAccount(), 'Password123'), false);
  }
  state.responseUser = { id: 'auth-juan', email: 'JUAN@SCHOOL.EDU.PH', email_confirmed_at: 'verified' };
  assert.equal(await bridge.verifyStudentPassword(credentialAccount(), 'Password123'), true);
  const count = state.clients.length;
  for (const change of [{ authProvider: 'local' }, { role: 'teacher' }, { authUserId: null }]) {
    assert.equal(await bridge.verifyStudentPassword(credentialAccount(change), 'Password123'), false);
  }
  assert.equal(state.clients.length, count);
});

test('invalid provider credentials return false while provider outages return a sanitized retryable error', async () => {
  const { state, bridge } = fixture();
  assert.equal(await bridge.verifyStudentPassword(credentialAccount(), 'wrong-password'), false);
  for (const error of [{ status: 500, message: 'private provider error' }, { status: 400, name: 'AuthRetryableFetchError' }]) {
    state.providerError = error;
    await assert.rejects(bridge.verifyStudentPassword(credentialAccount(), 'Password123'), { statusCode: 503, message: 'Authentication is temporarily unavailable. Please try again.' });
  }
  state.providerError = null; state.providerThrows = true;
  await assert.rejects(bridge.verifyStudentPassword(credentialAccount(), 'Password123'), { statusCode: 503 });
});

test('discarding an ephemeral session cannot turn a valid credential check into a failure', async () => {
  const { state, bridge } = fixture();
  state.signOutThrows = true;
  assert.equal(await bridge.verifyStudentPassword(credentialAccount(), 'Password123'), true);
});

test('provider password updates target the bound student identity and reject local or nonstudent accounts', async () => {
  const { state, bridge } = fixture();
  for (const change of [{ authProvider: 'local' }, { role: 'teacher' }, { authUserId: null }]) {
    await assert.rejects(bridge.updateStudentPassword(credentialAccount(change), 'NewPassword123'), { statusCode: 400 });
  }
  assert.equal(state.updates.length, 0);
  await bridge.updateStudentPassword(credentialAccount(), 'NewPassword123');
  assert.deepEqual(state.updates, [{ id: 'auth-juan', payload: { password: 'NewPassword123' } }]);
  assert.equal(state.clients.length, 0);
  state.updateError = { message: 'private provider update error' };
  await assert.rejects(bridge.updateStudentPassword(credentialAccount(), 'OtherPassword123'), { statusCode: 503, message: 'Unable to update your password. Please try again.' });
});

test('new provider student profiles map a NULL local hash and compare through the provider without altering credentials', async () => {
  const { state, accounts } = fixture();
  const account = await accounts.findSupabaseAccount('id', 'registry-student');
  assert.equal(account.password, '');
  assert.equal(account.authProvider, 'supabase');
  assert.equal(account.authUserId, 'auth-juan');
  assert.equal(await account.comparePassword('Password123'), true);
  assert.equal(await account.comparePassword('wrong-password'), false);
  assert.equal(state.updates.length, 0);
});

test('saving provider activity keeps its NULL password hash and does not write an Auth password', async () => {
  const { client, state, accounts } = fixture();
  const account = await accounts.findSupabaseAccount('id', 'registry-student');
  account.lastActivityAt = new Date();
  await account.save();
  assert.equal(client.tables.users[0].password_hash, null);
  assert.equal(client.tables.users[0].auth_provider, 'supabase');
  assert.equal(client.tables.users[0].auth_user_id, 'auth-juan');
  assert.equal(account.password, '');
  assert.equal(state.updates.length, 0);
});

test('changing a provider student password updates Auth and never stores plaintext or bcrypt locally', async () => {
  const { client, state, accounts } = fixture();
  const account = await accounts.findSupabaseAccount('id', 'registry-student');
  account.password = 'NewPassword123';
  await account.save();
  assert.deepEqual(state.updates, [{ id: 'auth-juan', payload: { password: 'NewPassword123' } }]);
  assert.equal(account.password, '');
  assert.equal(client.tables.users[0].password_hash, null);
  assert.equal(await account.comparePassword('Password123'), false);
  assert.equal(await account.comparePassword('NewPassword123'), true);
  assert.ok(client.writes.every(write => write.payload.password_hash === null));
});

test('invalid password or immutable identity edits fail before provider or database writes', async () => {
  for (const change of [{ email: 'other@school.edu.ph' }, { authUserId: 'other-auth-id' }, { authProvider: 'local' }]) {
    const { client, state, accounts } = fixture();
    const account = await accounts.findSupabaseAccount('id', 'registry-student');
    Object.assign(account, change, { password: 'NewPassword123' });
    await assert.rejects(account.save(), { statusCode: 400 });
    assert.equal(state.updates.length, 0);
    assert.equal(client.writes.length, 0);
  }
  const { client, state, accounts } = fixture();
  const account = await accounts.findSupabaseAccount('id', 'registry-student');
  account.password = 'weak';
  await assert.rejects(account.save(), { statusCode: 400 });
  assert.equal(state.updates.length, 0);
  assert.equal(client.writes.length, 0);
});

test('provider password update errors leave persisted account credentials unchanged', async () => {
  const { client, state, accounts } = fixture();
  const account = await accounts.findSupabaseAccount('id', 'registry-student');
  state.updateError = { message: 'provider unavailable' };
  account.password = 'NewPassword123';
  await assert.rejects(account.save(), { statusCode: 503 });
  assert.equal(client.tables.users[0].password_hash, null);
  assert.equal(client.writes.length, 0);
});

test('legacy bcrypt accounts retain their original login and save behavior with no provider requests', async () => {
  const hash = await bcrypt.hash('Password123', 4);
  for (const role of ['student', 'teacher', 'headteacher', 'secretary', 'admin']) {
    const { client, state, accounts } = fixture([row({ role, email: 'legacy@gmail.com', password_hash: hash, auth_provider: undefined, auth_user_id: undefined })]);
    const account = await accounts.findSupabaseAccountByUsername('juan.cruz');
    assert.equal(account.authProvider, 'local');
    assert.equal(await account.comparePassword('Password123'), true);
    assert.equal(await account.comparePassword('incorrect'), false);
    account.lastActivityAt = new Date();
    await account.save();
    assert.equal(client.tables.users[0].password_hash, hash);
    account.password = 'NewPassword123';
    await account.save();
    assert.equal(await bcrypt.compare('NewPassword123', client.tables.users[0].password_hash), true);
    assert.equal(state.clients.length, 0);
    assert.equal(state.updates.length, 0);
  }
});

async function login(controller, changes = {}) {
  let error;
  const response = { statusCode: 200, status(value) { this.statusCode = value; return this; }, json(body) { this.body = body; return this; } };
  await controller.login({ body: { username: 'juan.cruz', password: 'Password123', captchaToken: 'captcha-proof', ...changes }, headers: { 'user-agent': 'Test browser' }, ip: '127.0.0.1' }, response, value => { error = value; });
  return { response, error };
}

test('real login controller accepts a provider student with NULL local password and creates only an EduMatch session', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'student-auth-test-only-signing-secret-32-characters';
  try {
    const { client, state, controller } = fixture();
    const { response, error } = await login(controller);
    assert.equal(error, undefined);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.requiresOtp, false);
    assert.equal(response.body.user.authProvider, 'supabase');
    assert.equal(response.body.user.username, 'Juan.Cruz');
    assert.equal(jwt.verify(response.body.token, process.env.JWT_SECRET).id, 'registry-student');
    assert.deepEqual(state.captchas, ['captcha-proof']);
    assert.equal(state.sessions.length, 1);
    assert.equal(state.signIns.length, 1);
    assert.equal(state.updates.length, 0);
    assert.equal(client.tables.users[0].password_hash, null);
    assert.equal(Object.hasOwn(response.body.user, 'authUserId'), false);
    assert.equal(Object.hasOwn(response.body.user, 'password'), false);
  } finally { if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret; }
});

test('real login controller preserves OTP policy for provider students', async () => {
  const { state, controller } = fixture();
  state.settings.user.emailVerificationRequired = true;
  const { response, error } = await login(controller);
  assert.equal(error, undefined);
  assert.equal(response.statusCode, 202);
  assert.equal(response.body.requiresOtp, true);
  assert.equal(state.challenges.length, 1);
  assert.equal(state.sessions.length, 0);
  assert.equal(state.updates.length, 0);
});

test('real login controller records provider password failures and preserves lockout without updating Auth', async () => {
  const { client, state, controller } = fixture();
  state.settings.security.maxLoginAttempts = 1;
  const first = await login(controller, { password: 'wrong-password' });
  assert.equal(first.error.statusCode, 401);
  assert.ok(Date.parse(client.tables.users[0].lock_until) > Date.now());
  const second = await login(controller);
  assert.equal(second.error.statusCode, 423);
  assert.equal(state.signIns.length, 1);
  assert.equal(state.updates.length, 0);
  assert.equal(state.sessions.length, 0);
});

test('legacy incomplete activation and bcrypt credentials retain their controller behavior', async () => {
  const hash = await bcrypt.hash('Password123', 4);
  const valid = fixture([row({ email: 'legacy@gmail.com', password_hash: hash, auth_provider: undefined, auth_user_id: undefined })]);
  valid.state.settings.user.emailVerificationRequired = true;
  assert.equal((await login(valid.controller)).response.statusCode, 202);
  assert.equal(valid.state.clients.length, 0);
  const incomplete = fixture([row({ email: 'legacy@gmail.com', password_hash: null, auth_provider: undefined, auth_user_id: undefined })]);
  const result = await login(incomplete.controller);
  assert.equal(result.error.statusCode, 403);
  assert.match(result.error.message, /setup is incomplete/i);
  assert.equal(incomplete.state.clients.length, 0);
});
