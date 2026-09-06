const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const jwt = require('jsonwebtoken');

// Isolate only persistence and external providers; exercise the real settings,
// controller, JWT validation and middleware implementations without credentials.
function loadModule(relativePath, mocks) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (mocks.fallback) {
      const result = mocks.fallback(name);
      if (result !== undefined) return result;
    }
    return originalRequire(name);
  };
  loaded._compile(fs.readFileSync(filename, 'utf8'), filename);
  return loaded.exports;
}

function settingsFixture(initialValue = null) {
  const state = {
    row: initialValue ? { key: 'global', value: initialValue, updated_at: '2025-01-01T00:00:00.000Z' } : null,
    unavailable: false,
    conflict: null,
  };
  const client = {
    from(table) {
      assert.equal(table, 'app_settings');
      let operation = 'read';
      let payload;
      const filters = {};
      const query = {
        select() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        insert(value) { operation = 'insert'; payload = value; return query; },
        update(value) { operation = 'update'; payload = value; return query; },
        async maybeSingle() { return execute(); },
        async single() { return execute(); },
      };
      function execute() {
        if (state.unavailable) return { data: null, error: { message: 'Database unavailable' } };
        if (operation === 'read') return { data: structuredClone(state.row), error: null };
        if (state.conflict) {
          state.row = structuredClone(state.conflict);
          state.conflict = null;
        }
        if (operation === 'insert' && state.row) return { data: null, error: { code: '23505' } };
        if (operation === 'update' && state.row?.updated_at !== filters.updated_at) return { data: null, error: null };
        state.row = structuredClone(payload);
        return { data: structuredClone(state.row), error: null };
      }
      return query;
    },
  };
  return {
    state,
    service: loadModule('services/supabaseSettingsService.js', {
      './supabaseStorageService': { getSupabaseStorageClient: () => client },
    }),
  };
}

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function callController(controller, req = {}) {
  const response = responseRecorder();
  let failure;
  await controller(req, response, (error) => { failure = error; });
  return { response, failure };
}

test('settings default safely, persist all policies and preserve unrelated metadata on a partial save', async () => {
  const { service } = settingsFixture();
  const defaults = await service.getAppSettings();
  assert.equal(defaults.user.emailVerificationRequired, true);
  assert.equal(defaults.security.sessionTimeoutMinutes, 120);
  await service.saveAppSettings({
    user: { emailVerificationRequired: false },
    maintenance: { maintenanceModeEnabled: true, maintenanceMessage: 'Scheduled work', lastBackupFileName: 'backup.json' },
  }, 'admin');
  await service.saveAppSettings({ security: { sessionTimeoutMinutes: 10, maxLoginAttempts: 3 } }, 'admin');
  const saved = await service.getAppSettings();
  assert.equal(saved.user.emailVerificationRequired, false);
  assert.equal(saved.security.sessionTimeoutMinutes, 10);
  assert.equal(saved.security.maxLoginAttempts, 3);
  assert.equal(saved.security.accountLockoutDurationMinutes, 30);
  assert.equal(saved.maintenance.maintenanceModeEnabled, true);
  assert.equal(saved.maintenance.lastBackupFileName, 'backup.json');
  assert.equal(saved.updatedBy, 'admin');
});

test('partial settings save retries a concurrent maintenance change without overwriting it', async () => {
  const { state, service } = settingsFixture({ maintenance: { maintenanceModeEnabled: false } });
  state.conflict = {
    key: 'global', updated_at: '2025-01-02T00:00:00.000Z',
    value: { maintenance: { maintenanceModeEnabled: true } },
  };
  await service.saveAppSettings({ maintenance: { lastCacheClearedAt: '2025-01-03T00:00:00.000Z' } }, 'admin');
  assert.equal((await service.getAppSettings()).maintenance.maintenanceModeEnabled, true);
  assert.equal(state.row.value.maintenance.lastCacheClearedAt, '2025-01-03T00:00:00.000Z');
});

test('settings read failures fail closed instead of silently disabling maintenance or OTP', async () => {
  const { state, service } = settingsFixture();
  state.unavailable = true;
  await assert.rejects(service.getAppSettings(), { statusCode: 503 });
});

function middlewareFixture(settingsValue = {}, { role = 'student', remember = false, idleMinutes = 0, forcePasswordChange = false } = {}) {
  const settings = settingsFixture(settingsValue);
  const events = [];
  const user = {
    _id: 'user-1', role, status: 'active', tokenVersion: 0, forcePasswordChange,
    lastActivityAt: new Date(),
    save() { throw new Error('Middleware must never rewrite the full account'); },
  };
  const session = { _id: 'session-1', lastSeenAt: new Date(Date.now() - idleMinutes * 60000).toISOString() };
  const middleware = loadModule('middlewares/authMiddleware.js', {
    '../services/supabaseSettingsService': settings.service,
    '../services/supabaseAccountService': {
      findSupabaseAccount: async () => user,
      touchSupabaseAccountActivity: async (...args) => { events.push(['presence', ...args]); },
    },
    '../services/supabaseAuthPersistenceService': {
      findActiveSession: async () => session,
      touchSession: async (...args) => { events.push(['touch', ...args]); },
      revokeSession: async (...args) => { events.push(['revoke', ...args]); },
    },
  });
  const token = jwt.sign({ id: user._id, jti: 'token-1', tokenVersion: 0, remember }, process.env.JWT_SECRET, {
    algorithm: 'HS256', issuer: 'edumatch-api', audience: 'edumatch-web', expiresIn: '1h',
  });
  async function request(overrides = {}) {
    const req = { headers: { authorization: `Bearer ${token}` }, baseUrl: '/api/student', path: '/dashboard', method: 'GET', ...overrides };
    let failure;
    await middleware(req, {}, (error) => { failure = error; });
    return { req, failure };
  }
  return { ...settings, events, request, user, session };
}

process.env.JWT_SECRET = 'local-security-settings-test-secret';

test('configured per-session idle timeout rejects stale normal and remembered sessions despite activity elsewhere', async () => {
  for (const remember of [false, true]) {
    const fixture = middlewareFixture({ security: { sessionTimeoutMinutes: 5 } }, { remember, idleMinutes: 6 });
    const { failure } = await fixture.request();
    assert.equal(failure.statusCode, 401);
    assert.match(failure.message, /inactivity/);
    assert.deepEqual(fixture.events[0], ['revoke', 'user-1', 'session-1', 'Inactivity timeout']);
    assert.equal(fixture.events.length, 1);
  }
});

test('an active session is not expired by stale global user presence and uses only narrow writes', async () => {
  const fixture = middlewareFixture({ security: { sessionTimeoutMinutes: 5 } });
  fixture.user.lastActivityAt = '1970-01-01T00:00:00.000Z';
  const { failure, req } = await fixture.request();
  assert.equal(failure, undefined);
  assert.equal(req.user._id, 'user-1');
  assert.deepEqual(fixture.events.map(([name]) => name), ['presence', 'touch']);
});

test('background presence heartbeat does not extend session idle lifetime', async () => {
  const fixture = middlewareFixture({ security: { sessionTimeoutMinutes: 5 } });
  const { failure } = await fixture.request({ baseUrl: '/api/auth', path: '/presence', method: 'POST' });
  assert.equal(failure, undefined);
  assert.deepEqual(fixture.events.map(([name]) => name), ['presence']);
});

test('maintenance blocks existing student sessions immediately and permits administrators', async () => {
  const settings = { maintenance: { maintenanceModeEnabled: true, maintenanceMessage: 'Upgrading the system' } };
  const student = middlewareFixture(settings);
  assert.equal((await student.request()).failure.statusCode, 503);
  assert.equal((await student.request()).failure.message, 'Upgrading the system');
  assert.equal(student.events.length, 0);
  const admin = middlewareFixture(settings, { role: 'admin' });
  assert.equal((await admin.request()).failure, undefined);
});

test('forced password change allows account security actions but rejects unrelated or prefix-matching routes', async () => {
  const fixture = middlewareFixture({}, { forcePasswordChange: true });
  assert.equal((await fixture.request()).failure.statusCode, 403);
  for (const [method, route] of [['POST', '/change-password'], ['POST', '/logout'], ['GET', '/sessions'], ['DELETE', '/sessions/session-2']]) {
    assert.equal((await fixture.request({ baseUrl: '/api/auth', path: route, method })).failure, undefined);
  }
  assert.equal((await fixture.request({ baseUrl: '/api/auth', path: '/change-password-unrelated', method: 'POST' })).failure.statusCode, 403);
});

function loginFixture(t, settingsValue = {}) {
  process.env.RECAPTCHA_SECRET_KEY = 'test-recaptcha-key';
  process.env.RECAPTCHA_ALLOWED_HOSTNAMES = 'localhost';
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ success: true, hostname: 'localhost' }) }));
  const settings = settingsFixture(settingsValue);
  const events = [];
  const user = {
    _id: 'student-1', role: 'student', status: 'active', username: 'student', name: 'Student',
    email: 'student@example.com', password: 'test-password-hash', failedLoginAttempts: 0,
    comparePassword: async (password) => password === 'correct-password',
    save: async () => { events.push(['save']); },
  };
  const challenge = { userId: user._id, otpHash: 'test-otp-hash', remember: false, failedAttempts: 0, save: async () => {} };
  const controller = loadModule('controllers/authController.js', {
    '../services/supabaseSettingsService': settings.service,
    '../services/supabaseAccountService': {
      findSupabaseAccountByUsername: async () => user,
      findSupabaseAccount: async () => user,
    },
    '../services/supabaseAuthPersistenceService': {
      sessionExists: async () => false,
      createSession: async (payload) => { events.push(['session', payload]); },
      consumeOpenChallenges: async () => {},
      createChallenge: async (payload) => { events.push(['otp', payload]); },
      recordLoginAttempt: async (payload) => { events.push(['attempt', payload]); },
      findActiveChallenge: async () => challenge,
    },
    '../services/gmailService': { sendEmailViaGmail: async () => { events.push(['email']); return { sent: true }; } },
    '../utils/fileStorage': { resolveStoredFileUrl: (_req, url) => url },
    bcryptjs: { hash: async () => 'test-otp-hash', compare: async () => true },
  });
  const request = (password = 'correct-password') => ({
    body: { username: 'student', password, captchaToken: 'verified-test-captcha' },
    headers: {}, ip: '127.0.0.1',
  });
  return { ...settings, controller, events, user, request };
}

test('login honors saved lockout threshold and duration', async (t) => {
  const fixture = loginFixture(t, { security: { maxLoginAttempts: 3, accountLockoutDurationMinutes: 2 } });
  const startedAt = Date.now();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    assert.equal((await callController(fixture.controller.login, fixture.request('wrong'))).failure.statusCode, 401);
  }
  assert.ok(new Date(fixture.user.lockUntil).getTime() >= startedAt + 2 * 60000);
  assert.ok(new Date(fixture.user.lockUntil).getTime() <= Date.now() + 2 * 60000);
  assert.equal((await callController(fixture.controller.login, fixture.request())).failure.statusCode, 423);
  assert.equal(fixture.events.some(([name]) => name === 'session'), false);
});

test('login reads the saved OTP switch and creates a challenge or session accordingly', async (t) => {
  const fixture = loginFixture(t);
  const otp = await callController(fixture.controller.login, fixture.request());
  assert.equal(otp.failure, undefined);
  assert.equal(otp.response.statusCode, 202);
  assert.equal(otp.response.body.requiresOtp, true);
  assert.equal(fixture.events.filter(([name]) => name === 'session').length, 0);
  await fixture.service.saveAppSettings({ user: { emailVerificationRequired: false } }, 'admin');
  const direct = await callController(fixture.controller.login, fixture.request());
  assert.equal(direct.failure, undefined);
  assert.equal(direct.response.statusCode, 200);
  assert.equal(typeof direct.response.body.token, 'string');
  assert.equal(fixture.events.filter(([name]) => name === 'session').length, 1);
});

test('saved maintenance policy blocks both password and OTP login completion', async (t) => {
  const fixture = loginFixture(t, { maintenance: { maintenanceModeEnabled: true, maintenanceMessage: 'Scheduled downtime' } });
  const loginResult = await callController(fixture.controller.login, fixture.request());
  assert.equal(loginResult.failure.statusCode, 503);
  assert.equal(loginResult.failure.message, 'Scheduled downtime');
  const otpResult = await callController(fixture.controller.verifyLoginOtp, {
    ...fixture.request(), body: { challengeToken: 'challenge', otpCode: '123456', captchaToken: 'verified-test-captcha' },
  });
  assert.equal(otpResult.failure.statusCode, 503);
  assert.equal(fixture.events.some(([name]) => name === 'session'), false);
});

test('admin settings endpoints write Supabase settings and revoke non-admin sessions for maintenance/cache clears', async () => {
  const { service } = settingsFixture();
  const revocations = [];
  const admin = loadModule('controllers/adminController.js', {
    '../services/supabaseSettingsService': service,
    '../services/supabaseAuthPersistenceService': { revokeNonAdminSessions: async (reason) => { revocations.push(reason); return 2; } },
    'fs/promises': { readdir: async () => [] },
    mongoose: {},
    fallback: (name) => name.startsWith('../models/') || name.startsWith('../services/') ? {} : undefined,
  });
  const saved = await callController(admin.saveSystemSettings, {
    user: { _id: 'admin' },
    body: {
      user: { emailVerificationRequired: false },
      security: { sessionTimeoutMinutes: 10, maxLoginAttempts: 4, accountLockoutDurationMinutes: 5 },
      maintenance: { maintenanceModeEnabled: true, maintenanceMessage: 'Working', systemVersion: 'v1.1' },
    },
  });
  assert.equal(saved.failure, undefined);
  assert.equal(saved.response.body.maintenance.sessionsInvalidated, 2);
  assert.equal((await service.getAppSettings()).security.maxLoginAttempts, 4);
  const cached = await callController(admin.clearSystemCache, { user: { _id: 'admin' } });
  assert.equal(cached.failure, undefined);
  assert.equal(cached.response.body.cache.sessionsInvalidated, 2);
  assert.equal((await service.getAppSettings()).maintenance.maintenanceModeEnabled, true);
  assert.ok((await service.getAppSettings()).maintenance.lastCacheClearedAt);
  assert.deepEqual(revocations, ['System maintenance', 'System cache cleared']);
  const read = await callController(admin.getSystemSettings);
  assert.equal(read.response.body.settings.user.emailVerificationRequired, false);
  const invalid = await callController(admin.saveSecuritySettings, {
    user: { _id: 'admin' }, body: { sessionTimeoutMinutes: 0, maxLoginAttempts: 4, accountLockoutDurationMinutes: 5 },
  });
  assert.equal(invalid.failure.statusCode, 400);
});
