const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const express = require('express');
const { securityConfigurationErrors, resolveTrustProxy } = require('../utils/securityConfig');
const { createFakeSupabase } = require('./helpers/fakeSupabase');

// Never load .env or connect to live services from the regression suite.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'deployment-regression-test-secret-with-at-least-32-bytes';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'isolated-fixture-key';
process.env.SUPABASE_STORAGE_PUBLIC = 'false';
process.env.STORAGE_URL_SIGNING_SECRET = '';
delete process.env.REDIS_URL;
delete process.env.TRUST_PROXY;
require('dotenv').config = () => ({ parsed: {} });

const storage = require('../services/supabaseStorageService');
let client;
let bucketUnavailable = false;
let bucketChecks = 0;
storage.getSupabaseStorageClient = () => client;
storage.verifyPrivateStorageBucket = async () => {
  bucketChecks += 1;
  if (bucketUnavailable) throw new Error('Private storage verification failed');
  return { public: false };
};
require('../services/supabaseAccountService').ensureDefaultSupabaseAdmin = async () => ({ role: 'admin' });
const { app } = require('../server');
const { apiRateLimitKey, buildLimiter } = require('../middlewares/rateLimiters');
const { buildStorageAccessToken } = require('../utils/fileStorage');

async function listen(t, application) {
  const server = await new Promise((resolve) => {
    const running = application.listen(0, '127.0.0.1', () => resolve(running));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

function tokenFor(id, overrides = {}, secret = process.env.JWT_SECRET) {
  return jwt.sign({ id, jti: `${id}-session-token`, tokenVersion: 0, ...overrides }, secret, {
    algorithm: 'HS256', issuer: 'edumatch-api', audience: 'edumatch-web', expiresIn: '1h',
  });
}

test('production rejects missing distributed store, ambiguous proxy, weak secrets and public storage', () => {
  const env = {
    NODE_ENV: 'production', JWT_SECRET: 'random-test-secret-with-at-least-thirty-two-bytes',
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key', SUPABASE_URL: 'https://project.supabase.co',
    REDIS_URL: 'rediss://cache.example.com:6379', TRUST_PROXY: '1',
    CORS_ALLOWED_ORIGINS: 'https://school.example.com', SUPABASE_STORAGE_PUBLIC: 'false',
  };
  assert.deepEqual(securityConfigurationErrors(env), []);
  assert.match(securityConfigurationErrors({ ...env, REDIS_URL: '' }).join(), /REDIS_URL is required/);
  assert.match(securityConfigurationErrors({ ...env, TRUST_PROXY: '' }).join(), /Set TRUST_PROXY explicitly/);
  assert.match(securityConfigurationErrors({ ...env, JWT_SECRET: 'short' }).join(), /at least 32 bytes/);
  assert.match(securityConfigurationErrors({ ...env, SUPABASE_STORAGE_PUBLIC: 'true' }).join(), /must be false/);
  assert.match(securityConfigurationErrors({ ...env, CORS_ALLOWED_ORIGINS: 'https://school.example.com/path' }).join(), /exact HTTPS origins/);
  assert.match(securityConfigurationErrors({ ...env, REDIS_URL: 'https://redis.example.com' }).join(), /redis:\/\/ or rediss:\/\//);
  assert.throws(() => resolveTrustProxy('true'), /TRUST_PROXY/);
  assert.equal(resolveTrustProxy('0'), 0);
  assert.equal(resolveTrustProxy('1'), 1);
  assert.equal(resolveTrustProxy('loopback'), 'loopback');
  assert.deepEqual(securityConfigurationErrors({ ...env, NODE_ENV: 'development', REDIS_URL: '', TRUST_PROXY: '' }), []);
});

test('imported Express entrypoint refuses traffic when startup security checks fail and can recover', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'log', () => {});
  assert.equal(typeof require('../server'), 'function');
  client = createFakeSupabase();
  const base = await listen(t, app);
  bucketUnavailable = true;
  t.after(() => { bucketUnavailable = false; });
  assert.equal((await fetch(`${base}/api/health`)).status, 503);
  assert.equal(bucketChecks, 1);
  bucketUnavailable = false;
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  assert.equal(bucketChecks, 2);
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  assert.equal(bucketChecks, 2, 'successful initialization is reused');
});

test('actual privileged routes reject wrong roles, foreign student records and unsigned file access', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'log', () => {});
  const now = new Date().toISOString();
  client = createFakeSupabase({
    users: [{ id: 'student-one', name: 'Fixture', role: 'student', status: 'active', token_version: 0 }],
    sessions: [{ id: 'session-one', user_id: 'student-one', token_id: 'student-one-session-token',
      last_seen_at: now, expires_at: new Date(Date.now() + 3600000).toISOString(), revoked_at: null }],
  });
  const base = await listen(t, app);
  const headers = { Authorization: `Bearer ${tokenFor('student-one')}` };
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  for (const group of ['admin', 'teacher', 'student', 'headteacher', 'secretary']) {
    assert.equal((await fetch(`${base}/api/${group}/profile`)).status, 401);
  }
  assert.equal((await fetch(`${base}/api/admin/users`, { headers })).status, 403);
  const otherStudent = await fetch(`${base}/api/recommendation/student-two`, { headers });
  assert.equal(otherStudent.status, 403);
  assert.match((await otherStudent.json()).message, /own recommendation/);
  assert.equal((await fetch(`${base}/uploads/private-student-submission.pdf`)).status, 404);
  assert.equal((await fetch(`${base}/api/storage/file`)).status, 400);
  const expired = jwt.sign({ id: 'student-one', jti: 'student-one-session-token', exp: 1 }, process.env.JWT_SECRET, {
    algorithm: 'HS256', issuer: 'edumatch-api', audience: 'edumatch-web',
  });
  assert.equal((await fetch(`${base}/api/auth/sessions`, { headers: { Authorization: `Bearer ${expired}` } })).status, 401);
});

test('actual login route returns 429 after its request budget is exhausted', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'log', () => {});
  client = createFakeSupabase();
  const base = await listen(t, app);
  for (let index = 0; index < 10; index += 1) {
    const response = await fetch(`${base}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(response.status, 400);
  }
  const blocked = await fetch(`${base}/api/auth/login`, { method: 'POST' });
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
});

test('signed users sharing one school IP have separate budgets; forged identities do not bypass IP limits', async (t) => {
  const application = express();
  application.use(buildLimiter({
    prefix: 'test-school-ip', windowMs: 60000, limit: 2, message: 'Limited', keyGenerator: apiRateLimitKey,
  }));
  application.get('/', (_req, res) => res.sendStatus(200));
  const base = await listen(t, application);
  const request = (token) => fetch(base, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const first = tokenFor('student-one');
  const second = tokenFor('student-two');
  assert.equal((await request(first)).status, 200);
  assert.equal((await request(first)).status, 200);
  assert.equal((await request(first)).status, 429);
  assert.equal((await request(second)).status, 200);
  assert.equal((await request()).status, 200);
  assert.equal((await request(tokenFor('forged-one', {}, 'wrong-secret'))).status, 200);
  assert.equal((await request(tokenFor('forged-two', {}, 'wrong-secret'))).status, 429);
});

test('valid signed file requests have independent per-file budgets; unsigned links cannot create budgets', async (t) => {
  const application = express();
  application.use(buildLimiter({
    prefix: 'test-storage-budget', windowMs: 60000, limit: 1, message: 'Limited', keyGenerator: apiRateLimitKey,
  }));
  application.get('/api/storage/file', (_req, res) => res.sendStatus(200));
  const base = await listen(t, application);
  const request = (token = '') => fetch(`${base}/api/storage/file?token=${encodeURIComponent(token)}`);
  const first = buildStorageAccessToken({ storedPath: 'uploads/lesson-one.pdf' });
  const second = buildStorageAccessToken({ storedPath: 'uploads/lesson-two.pdf' });
  assert.equal((await request(first)).status, 200);
  assert.equal((await request(first)).status, 429);
  assert.equal((await request(second)).status, 200);
  assert.equal((await request('forged-one')).status, 200);
  assert.equal((await request('forged-two')).status, 429);
});
