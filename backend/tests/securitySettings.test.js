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

test('email OTP can be switched off and back on without losing security policies', async () => {
  const { state, service } = settingsFixture({ security: { maxLoginAttempts: 4 } });
  const disabled = await service.saveAppSettings({ user: { emailVerificationRequired: false } }, 'admin');
  assert.equal(disabled.user.emailVerificationRequired, false);
  assert.equal(state.row.value.user.emailVerificationRequired, false);
  const enabled = await service.saveAppSettings({ user: { emailVerificationRequired: true } }, 'admin');
  assert.equal(enabled.user.emailVerificationRequired, true);
  assert.equal(state.row.value.user.emailVerificationRequired, true);
  assert.equal(enabled.security.maxLoginAttempts, 4);
});

test('only an explicit saved false disables OTP; absent and malformed policies remain enabled', async () => {
  for (const value of [undefined, null, 0, '', 'false', {}, []]) {
    const { service } = settingsFixture({ user: { emailVerificationRequired: value } });
    assert.equal((await service.getAppSettings()).user.emailVerificationRequired, true);
    assert.equal((await service.saveAppSettings({ user: { emailVerificationRequired: value } }, 'admin')).user.emailVerificationRequired, true);
  }
});

test('a concurrent OTP policy change survives an unrelated settings save', async () => {
  const { state, service } = settingsFixture({ user: { emailVerificationRequired: true } });
  state.conflict = {
    key: 'global', updated_at: '2025-01-02T00:00:00.000Z',
    value: { user: { emailVerificationRequired: false }, maintenance: { maintenanceModeEnabled: true } },
  };
  const saved = await service.saveAppSettings({ security: { sessionTimeoutMinutes: 10 } }, 'admin');
  assert.equal(saved.user.emailVerificationRequired, false);
  assert.equal(saved.maintenance.maintenanceModeEnabled, true);
  assert.equal(saved.security.sessionTimeoutMinutes, 10);
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
    email: 'student@gmail.com', password: 'test-password-hash', failedLoginAttempts: 0,
    comparePassword: async (password) => password === 'correct-password',
    save: async () => { events.push(['save']); },
  };
  const challenge = {
    userId: user._id, otpHash: 'test-otp-hash', remember: false, failedAttempts: 0,
    createdAt: new Date(Date.now() - 60000).toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    save: async () => {},
  };
  const controller = loadModule('controllers/authController.js', {
    '../services/supabaseSettingsService': settings.service,
    '../services/supabaseAccountService': {
      findSupabaseAccountByUsername: async () => user,
      findSupabaseAccount: async () => user,
    },
    '../services/supabaseAuthPersistenceService': {
      sessionExists: async () => false,
      createSession: async (payload) => { events.push(['session', payload]); },
      consumeOpenChallenges: async (...args) => { events.push(['consume', ...args]); },
      createChallenge: async (payload) => { events.push(['otp', payload]); },
      recordLoginAttempt: async (payload) => { events.push(['attempt', payload]); },
      findActiveChallenge: async () => challenge,
      findOpenChallenge: async () => challenge,
    },
    '../services/gmailService': { sendEmailViaGmail: async () => { events.push(['email']); return { sent: true }; } },
    '../utils/fileStorage': { resolveStoredFileUrl: (_req, url) => url },
    bcryptjs: { hash: async () => 'test-otp-hash', compare: async (value) => value === '123456' },
  });
  const request = (password = 'correct-password') => ({
    body: { username: 'student', password, captchaToken: 'verified-test-captcha' },
    headers: {}, ip: '127.0.0.1',
  });
  return { ...settings, controller, events, user, challenge, request };
}

test('an expired login OTP can be resent after cooldown without creating a session', async (t) => {
  const fixture = loginFixture(t);
  fixture.challenge.expiresAt = new Date(Date.now() - 1000).toISOString();
  const result = await callController(fixture.controller.resendLoginOtp, {
    ...fixture.request(), body: { challengeToken: 'a'.repeat(64) },
  });
  assert.equal(result.failure, undefined);
  assert.equal(result.response.statusCode, 202);
  assert.equal(result.response.body.requiresOtp, true);
  assert.equal(result.response.body.challengeToken.length, 64);
  assert.equal(fixture.events.filter(([name]) => name === 'email').length, 1);
  assert.equal(fixture.events.some(([name]) => name === 'session'), false);
});

test('login OTP resend enforces cooldown and rejects exhausted challenges', async (t) => {
  const fixture = loginFixture(t);
  const request = { ...fixture.request(), body: { challengeToken: 'a'.repeat(64) } };
  fixture.challenge.createdAt = new Date().toISOString();
  assert.equal((await callController(fixture.controller.resendLoginOtp, request)).failure.statusCode, 429);
  fixture.challenge.createdAt = new Date(Date.now() - 60000).toISOString();
  fixture.challenge.failedAttempts = 5;
  assert.equal((await callController(fixture.controller.resendLoginOtp, request)).failure.statusCode, 400);
  assert.equal(fixture.events.some(([name]) => name === 'email'), false);
});

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

test('the saved OTP policy applies immediately to later logins when switched off and back on', async (t) => {
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
  assert.equal(direct.response.body.requiresOtp, false);
  assert.equal(typeof direct.response.body.token, 'string');
  assert.equal(fixture.events.filter(([name]) => name === 'session').length, 1);
  await fixture.service.saveAppSettings({ user: { emailVerificationRequired: true } }, 'admin');
  const restored = await callController(fixture.controller.login, fixture.request());
  assert.equal(restored.failure, undefined);
  assert.equal(restored.response.statusCode, 202);
  assert.equal(restored.response.body.requiresOtp, true);
  assert.equal(restored.response.body.token, undefined);
  assert.equal(fixture.events.filter(([name]) => name === 'session').length, 1);
});

test('OTP-off login creates an authenticated normal session, clears challenges and records successful activity', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: false } });
  fixture.user.failedLoginAttempts = 2;
  fixture.user.lockUntil = new Date(Date.now() - 60000);
  fixture.user.tokenVersion = 3;
  const req = fixture.request();
  req.headers['user-agent'] = 'test-browser';
  const startedAt = Date.now();
  const result = await callController(fixture.controller.login, req);
  assert.equal(result.failure, undefined);
  assert.equal(result.response.statusCode, 200);
  assert.equal(result.response.body.requiresOtp, false);
  assert.equal(result.response.body.challengeToken, undefined);
  assert.equal(result.response.body.deliveryHint, undefined);
  assert.equal(result.response.body.user.id, fixture.user._id);
  assert.equal(result.response.body.user.forcePasswordChange, false);
  assert.equal(result.response.body.user.password, undefined);
  assert.equal(fixture.user.failedLoginAttempts, 0);
  assert.equal(fixture.user.lockUntil, null);
  assert.ok(fixture.user.lastLoginAt instanceof Date);
  assert.equal(fixture.user.lastActivityAt.getTime(), fixture.user.lastLoginAt.getTime());
  assert.ok(fixture.user.lastLoginAt.getTime() >= startedAt);
  assert.deepEqual(fixture.events.find(([name]) => name === 'consume'), ['consume', 'student-1']);
  const sessions = fixture.events.filter(([name]) => name === 'session');
  assert.equal(sessions.length, 1);
  const session = sessions[0][1];
  assert.equal(session.userId, 'student-1');
  assert.equal(session.remember, false);
  assert.equal(session.userAgent, 'test-browser');
  assert.equal(session.ipAddress, '127.0.0.1');
  assert.ok(session.expiresAt.getTime() - startedAt >= 24 * 60 * 60 * 1000);
  const claims = jwt.verify(result.response.body.token, process.env.JWT_SECRET, {
    algorithms: ['HS256'], issuer: 'edumatch-api', audience: 'edumatch-web',
  });
  assert.equal(claims.id, 'student-1');
  assert.equal(claims.jti, session.tokenId);
  assert.equal(claims.tokenVersion, 3);
  assert.equal(claims.remember, false);
  assert.equal(claims.exp - claims.iat, 24 * 60 * 60);
  const attempts = fixture.events.filter(([name]) => name === 'attempt');
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0][1].outcome, 'success');
  assert.equal(attempts[0][1].userId, 'student-1');
  assert.equal(req.auditLogContext.actorUserId, 'student-1');
  assert.equal(fixture.events.some(([name]) => name === 'otp' || name === 'email'), false);
});

test('OTP-off login preserves remember-me lifetime and the mandatory password-change redirect', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: false } });
  fixture.user.forcePasswordChange = true;
  fixture.user.temporaryPasswordIssuedAt = '2025-01-01T00:00:00.000Z';
  const req = fixture.request();
  req.body.remember = 'true';
  const result = await callController(fixture.controller.login, req);
  assert.equal(result.failure, undefined);
  assert.equal(result.response.statusCode, 200);
  assert.equal(result.response.body.redirectPath, '/auth/change-password');
  assert.equal(result.response.body.user.forcePasswordChange, true);
  assert.equal(result.response.body.user.temporaryPasswordIssuedAt, fixture.user.temporaryPasswordIssuedAt);
  assert.equal(fixture.user.forcePasswordChange, true);
  const claims = jwt.verify(result.response.body.token, process.env.JWT_SECRET);
  assert.equal(claims.remember, true);
  assert.equal(claims.exp - claims.iat, 30 * 24 * 60 * 60);
  assert.equal(fixture.events.find(([name]) => name === 'session')[1].remember, true);
});

test('client-supplied OTP flags cannot bypass the enabled server policy', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: true } });
  const req = fixture.request();
  Object.assign(req.body, { emailVerificationRequired: false, requiresOtp: false, skipOtp: true });
  const result = await callController(fixture.controller.login, req);
  assert.equal(result.failure, undefined);
  assert.equal(result.response.statusCode, 202);
  assert.equal(result.response.body.requiresOtp, true);
  assert.equal(result.response.body.token, undefined);
  assert.equal(fixture.events.filter(([name]) => name === 'otp').length, 1);
  assert.equal(fixture.events.some(([name]) => name === 'session'), false);
});

test('OTP-off login still rejects incorrect passwords and enforces the configured lockout', async (t) => {
  const fixture = loginFixture(t, {
    user: { emailVerificationRequired: false },
    security: { maxLoginAttempts: 3, accountLockoutDurationMinutes: 2 },
  });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    assert.equal((await callController(fixture.controller.login, fixture.request('wrong'))).failure.statusCode, 401);
  }
  assert.equal((await callController(fixture.controller.login, fixture.request())).failure.statusCode, 423);
  assert.equal(fixture.events.some(([name]) => name === 'session' || name === 'otp'), false);
  assert.equal(fixture.user.lastLoginAt, undefined);
});

test('OTP-off login still requires a verified CAPTCHA', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: false } });
  const req = fixture.request();
  delete req.body.captchaToken;
  assert.equal((await callController(fixture.controller.login, req)).failure.statusCode, 400);
  assert.equal(fixture.events.some(([name]) => name === 'session' || name === 'otp'), false);
  assert.equal(fixture.user.lastLoginAt, undefined);
});

test('OTP-off login still rejects pending, inactive, suspended and incomplete accounts', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: false } });
  for (const status of ['pending', 'inactive', 'suspended']) {
    fixture.user.status = status;
    assert.equal((await callController(fixture.controller.login, fixture.request())).failure.statusCode, 403);
  }
  fixture.user.status = 'active';
  fixture.user.password = '';
  assert.equal((await callController(fixture.controller.login, fixture.request())).failure.statusCode, 403);
  assert.equal(fixture.events.some(([name]) => name === 'session' || name === 'otp'), false);
  assert.equal(fixture.user.lastLoginAt, undefined);
});

test('OTP-off login still blocks non-admin accounts during maintenance', async (t) => {
  const fixture = loginFixture(t, {
    user: { emailVerificationRequired: false },
    maintenance: { maintenanceModeEnabled: true, maintenanceMessage: 'Scheduled downtime' },
  });
  for (const role of ['student', 'teacher', 'headteacher']) {
    fixture.user.role = role;
    const result = await callController(fixture.controller.login, fixture.request());
    assert.equal(result.failure.statusCode, 503);
    assert.equal(result.failure.message, 'Scheduled downtime');
  }
  assert.equal(fixture.events.some(([name]) => name === 'session' || name === 'otp'), false);
  fixture.user.role = 'admin';
  const admin = await callController(fixture.controller.login, fixture.request());
  assert.equal(admin.failure, undefined);
  assert.equal(admin.response.statusCode, 200);
  assert.equal(admin.response.body.requiresOtp, false);
});

test('unavailable security settings cannot allow OTP-off sign-in', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: false } });
  fixture.state.unavailable = true;
  const result = await callController(fixture.controller.login, fixture.request());
  assert.equal(result.failure.statusCode, 503);
  assert.equal(fixture.events.some(([name]) => name === 'session' || name === 'otp'), false);
  assert.equal(fixture.user.lastLoginAt, undefined);
});

test('the OTP-off policy permits teacher and headteacher sign-in with the same session validation', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: false } });
  for (const role of ['teacher', 'headteacher']) {
    fixture.user.role = role;
    const result = await callController(fixture.controller.login, fixture.request());
    assert.equal(result.failure, undefined);
    assert.equal(result.response.statusCode, 200);
    assert.equal(result.response.body.user.role, role);
    const claims = jwt.verify(result.response.body.token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'edumatch-api', audience: 'edumatch-web',
    });
    assert.equal(claims.id, fixture.user._id);
  }
  assert.equal(fixture.events.filter(([name]) => name === 'session').length, 2);
  assert.equal(fixture.events.some(([name]) => name === 'otp'), false);
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

test('disabling OTP does not let a pending verification challenge bypass its actual code', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: false } });
  const request = (otpCode) => ({
    ...fixture.request(), body: { challengeToken: 'challenge', otpCode, captchaToken: 'verified-test-captcha' },
  });
  assert.equal((await callController(fixture.controller.verifyLoginOtp, request(''))).failure.statusCode, 400);
  assert.equal((await callController(fixture.controller.verifyLoginOtp, request('000000'))).failure.statusCode, 401);
  assert.equal(fixture.events.some(([name]) => name === 'session'), false);
  const correct = await callController(fixture.controller.verifyLoginOtp, request('123456'));
  assert.equal(correct.failure, undefined);
  assert.equal(correct.response.statusCode, 200);
  assert.equal(typeof correct.response.body.token, 'string');
});

test('sample admin email cannot bypass Gmail verification', async (t) => {
  const fixture = loginFixture(t, { user: { emailVerificationRequired: false } });
  fixture.user.role = 'admin';
  fixture.user.email = 'admin@example.com';
  const result = await callController(fixture.controller.login, fixture.request());
  assert.equal(result.failure.statusCode, 400);
  assert.equal(fixture.events.some(([name]) => name === 'session'), false);
});

test('only a correct email code completes login and creates a session', async (t) => {
  const fixture = loginFixture(t);
  const request = (otpCode) => ({ ...fixture.request(), body: { challengeToken: 'challenge', otpCode, captchaToken: 'verified-test-captcha' } });
  const wrong = await callController(fixture.controller.verifyLoginOtp, request('000000'));
  assert.equal(wrong.failure.statusCode, 401);
  assert.equal(fixture.events.some(([name]) => name === 'session'), false);
  const correct = await callController(fixture.controller.verifyLoginOtp, request('123456'));
  assert.equal(correct.failure, undefined);
  assert.equal(correct.response.statusCode, 200);
  assert.equal(typeof correct.response.body.token, 'string');
});
