const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const redactRequestPath = require('../utils/redactRequestPath');
const auditService = require('../services/supabaseAuditLogService');
const recorded = [];
// Capture the persisted audit payload without initializing a database client.
const originalCreateAuditLog = auditService.createAuditLog;
auditService.createAuditLog = async payload => { recorded.push(payload); return payload; };
const auditLogMiddleware = require('../middlewares/auditLogMiddleware');
auditService.createAuditLog = originalCreateAuditLog;
const { notFoundMiddleware } = require('../middlewares/errorMiddleware');
const token = 'a'.repeat(64);
const proof = 'b'.repeat(64);
const code = '682941';

async function recordAudit(overrides = {}) {
  const req = {
    method: 'POST', originalUrl: `/api/auth/teacher-invitations/${token}/unexpected`,
    path: `/api/auth/teacher-invitations/${token}/unexpected`, baseUrl: '',
    params: { token }, query: { code, verificationToken: proof, harmless: 'visible' },
    body: { code, verificationToken: proof, password: 'SyntheticPassword1', email: 'teacher@school.edu.ph' },
    headers: { 'user-agent': 'audit-regression' }, ip: '127.0.0.1', ...overrides,
  };
  const res = new EventEmitter();
  res.statusCode = overrides.statusCode || 404;
  let nextCalled = false;
  const before = recorded.length;
  auditLogMiddleware(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  res.emit('finish');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(recorded.length, before + 1);
  const payload = recorded.at(-1);
  const serialized = JSON.stringify(payload);
  for (const secret of [token, proof, code, 'SyntheticPassword1']) assert.equal(serialized.includes(secret), false);
  assert.equal(payload.metadata.params.token, undefined);
  assert.equal(payload.metadata.query.code, undefined);
  assert.equal(payload.metadata.query.verificationToken, undefined);
  assert.equal(payload.metadata.query.harmless, 'visible');
  assert.equal(payload.metadata.bodyKeys.includes('code'), false);
  assert.equal(payload.metadata.bodyKeys.includes('verificationToken'), false);
  return payload;
}

test('unmatched teacher invitation paths redact credentials from complete persisted audit payloads', async () => {
  const payload = await recordAudit();
  assert.equal(payload.endpoint, '/api/auth/teacher-invitations/[REDACTED]/unexpected');
  assert.equal(payload.routePath, payload.endpoint);
});

test('unmatched nested router paths redact tokens while preserving relative route shape', async () => {
  const payload = await recordAudit({ baseUrl: '/api/auth/teacher-invitations', path: `/${token}/unexpected` });
  assert.equal(payload.endpoint, '/api/auth/teacher-invitations/[REDACTED]/unexpected');
  assert.equal(payload.routePath, '/[REDACTED]/unexpected');
  const parentPayload = await recordAudit({ baseUrl: '/api/auth', path: `/teacher-invitations/${token}/unexpected` });
  assert.equal(parentPayload.endpoint, payload.endpoint);
  assert.equal(parentPayload.routePath, '/teacher-invitations/[REDACTED]/unexpected');
});

test('tokens embedded in a nested router base URL cannot leak through audit endpoint reconstruction', async () => {
  const payload = await recordAudit({ baseUrl: `/api/auth/teacher-invitations/${token}`, path: '/unexpected' });
  assert.equal(payload.endpoint, '/api/auth/teacher-invitations/[REDACTED]/unexpected');
  assert.equal(payload.routePath, '/unexpected');
});

test('matched invitation route placeholders and action labels stay unchanged on rejection', async () => {
  const payload = await recordAudit({
    baseUrl: '/api/auth/teacher-invitations', path: `/${token}/register`,
    originalUrl: `/api/auth/teacher-invitations/${token}/register`, route: { path: '/:token/register' }, statusCode: 429,
  });
  assert.equal(payload.endpoint, '/api/auth/teacher-invitations/:token/register');
  assert.equal(payload.routePath, '/:token/register');
  assert.equal(payload.actionLabel, 'Teacher invitation accepted');
  assert.equal(payload.succeeded, false);
});

test('fallback original URLs and auth invitation/reset families redact token segments and omit query secrets', async () => {
  for (const family of ['teacher-invitations', 'class-invitations', 'invite', 'reset', 'teacher-register', 'class-register']) {
    const raw = `/api/auth/${family}/${token}/complete?code=${code}&verificationToken=${proof}`;
    assert.equal(redactRequestPath(raw), `/api/auth/${family}/[REDACTED]/complete`);
    assert.equal(redactRequestPath(`/api/auth/${family}/:token/complete`), `/api/auth/${family}/:token/complete`);
    const payload = await recordAudit({ originalUrl: raw, path: '', baseUrl: '/api/auth' });
    assert.equal(payload.endpoint, `/api/auth/${family}/[REDACTED]/complete`);
  }
  assert.equal(redactRequestPath('/api/headteacher/teacher-invitations/invitation-id/resend'), '/api/headteacher/teacher-invitations/invitation-id/resend');
  assert.equal(redactRequestPath(`/api/auth/teacher-invitations/:${token}/unexpected`), '/api/auth/teacher-invitations/[REDACTED]/unexpected');
});

test('not-found errors and their stack traces do not expose invitation tokens or query proofs', () => {
  let failure;
  notFoundMiddleware({ originalUrl: `/api/auth/teacher-invitations/${token}/unexpected?code=${code}&verificationToken=${proof}` }, {}, error => { failure = error; });
  assert.equal(failure.statusCode, 404);
  assert.equal(failure.message, 'Route not found: /api/auth/teacher-invitations/[REDACTED]/unexpected');
  for (const secret of [token, proof, code]) assert.equal(failure.stack.includes(secret), false);
});
