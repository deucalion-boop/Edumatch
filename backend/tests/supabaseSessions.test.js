const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
const originalGetClient = storage.getSupabaseStorageClient;
storage.getSupabaseStorageClient = () => client;
const persistence = require('../services/supabaseAuthPersistenceService');
const controllers = require('../controllers/securityController');
const authMiddleware = require('../middlewares/authMiddleware');
test.after(() => { storage.getSupabaseStorageClient = originalGetClient; });

function session(id, userId, changes = {}) {
  return {
    id, user_id: userId, token_id: `token-${id}`, revoked_at: null,
    ip_address: '127.0.0.1', user_agent: 'Test browser', remember: false,
    last_seen_at: new Date().toISOString(), created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(), ...changes,
  };
}

async function callController(handler, req) {
  let status;
  let body;
  let error;
  await handler(req, {
    status(value) { status = value; return this; },
    json(value) { body = value; return this; },
  }, (value) => { error = value; });
  return { status, body, error };
}

test('session creation and authentication lookup use consistent normalized fields', async () => {
  client = createFakeSupabase({ sessions: [] });
  const created = await persistence.createSession({
    userId: 'owner', tokenId: 'jwt-token-id', remember: true, userAgent: 'Browser',
    expiresAt: new Date(Date.now() + 3600000),
  });
  const active = await persistence.findActiveSession('owner', 'jwt-token-id');
  assert.deepEqual(active, created);
  assert.equal(active.tokenId, 'jwt-token-id');
  assert.equal(active.userId, 'owner');
  assert.equal(active.remember, true);
  assert.ok(active.lastSeenAt);
  assert.ok(active.expiresAt);
  assert.equal(await persistence.findActiveSession('other-owner', 'jwt-token-id'), null);
});

test('session list exposes only the owner active sessions and correctly marks the current browser', async () => {
  client = createFakeSupabase({ sessions: [
    session('current', 'owner'),
    session('older', 'owner', { last_seen_at: new Date(Date.now() - 60000).toISOString() }),
    session('other-user', 'other'),
    session('revoked', 'owner', { revoked_at: new Date().toISOString() }),
    session('expired', 'owner', { expires_at: new Date(Date.now() - 1000).toISOString() }),
  ] });
  const current = await persistence.findActiveSession('owner', 'token-current');
  const result = await callController(controllers.listSessions, { user: { _id: 'owner' }, session: current });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.sessions.map((entry) => [entry.id, entry.current]), [['current', true], ['older', false]]);
  assert.equal(result.body.sessions[0].ipAddress, '127.0.0.1');
  assert.equal(result.body.sessions[0].userAgent, 'Test browser');
  assert.equal('tokenId' in result.body.sessions[0], false);
});

test('revoking another user session returns 404 and leaves their authentication valid', async () => {
  client = createFakeSupabase({ sessions: [session('other-session', 'other')] });
  const result = await callController(controllers.revokeSession, { user: { _id: 'owner' }, params: { id: 'other-session' } });
  assert.equal(result.error.statusCode, 404);
  assert.ok(await persistence.findActiveSession('other', 'token-other-session'));
  assert.equal(client.tables.sessions[0].revoked_at, null);
});

test('session revocation invalidates the same persisted session used by authentication', async () => {
  client = createFakeSupabase({ sessions: [session('owned-session', 'owner'), session('other-browser', 'owner')] });
  const req = { user: { _id: 'owner' }, params: { id: 'owned-session' } };
  assert.ok(await persistence.findActiveSession('owner', 'token-owned-session'));
  assert.equal((await callController(controllers.revokeSession, req)).status, 200);
  assert.equal(await persistence.findActiveSession('owner', 'token-owned-session'), null);
  assert.ok(await persistence.findActiveSession('owner', 'token-other-browser'));
  assert.equal((await callController(controllers.revokeSession, req)).error.statusCode, 404);
});

test('logout invalidates only the current Supabase session', async () => {
  client = createFakeSupabase({ sessions: [session('current', 'owner'), session('second', 'owner')] });
  const current = await persistence.findActiveSession('owner', 'token-current');
  const result = await callController(controllers.logout, { user: { _id: 'owner' }, session: current });
  assert.equal(result.status, 200);
  assert.equal(await persistence.findActiveSession('owner', 'token-current'), null);
  assert.ok(await persistence.findActiveSession('owner', 'token-second'));
  assert.equal(client.tables.sessions[0].revoked_reason, 'Logout');
});

test('logout does not report success when persistence fails', async () => {
  client = createFakeSupabase({ sessions: [session('current', 'owner')] });
  client.failures.push({ table: 'sessions', operation: 'update', error: { message: 'Database unavailable' } });
  const result = await callController(controllers.logout, { user: { _id: 'owner' }, session: { _id: 'current' } });
  assert.equal(result.error.statusCode, 500);
  assert.equal(result.body, undefined);
  assert.ok(await persistence.findActiveSession('owner', 'token-current'));
});

test('non-administrator session revocation preserves admins and handles more than one page of accounts', async () => {
  const users = [{ id: 'admin', role: 'admin' }];
  const sessions = [session('admin-session', 'admin')];
  for (let index = 0; index < 505; index += 1) {
    const id = `student-${String(index).padStart(4, '0')}`;
    users.push({ id, role: 'student' });
    sessions.push(session(id, id));
  }
  client = createFakeSupabase({ users, sessions });
  assert.equal(await persistence.revokeNonAdminSessions('Maintenance enabled'), 505);
  assert.ok(await persistence.findActiveSession('admin', 'token-admin-session'));
  assert.ok(client.tables.sessions.filter((row) => row.user_id !== 'admin').every((row) => row.revoked_at));
  assert.equal(await persistence.revokeNonAdminSessions('Repeated maintenance'), 0);
});

test('HTTP session endpoints reject unauthenticated and foreign access and reject JWTs after logout or revocation', async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-test-signing-secret-never-used-outside-tests';
  t.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  client = createFakeSupabase({
    users: [
      { id: 'owner', role: 'student', status: 'active', force_password_change: true, token_version: 2 },
      { id: 'other', role: 'student', status: 'active', token_version: 0 },
    ],
    sessions: [session('current', 'owner'), session('second', 'owner'), session('foreign', 'other')],
  });
  const app = express();
  const router = express.Router();
  router.get('/sessions', authMiddleware, controllers.listSessions);
  router.delete('/sessions/:id', authMiddleware, controllers.revokeSession);
  router.post('/logout', authMiddleware, controllers.logout);
  router.get('/private', authMiddleware, (_req, res) => res.json({ success: true }));
  app.use('/api/auth', router);
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ message: error.message }));
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;
  const tokenFor = (id, tokenId, tokenVersion) => jwt.sign(
    { id, jti: tokenId, tokenVersion }, process.env.JWT_SECRET,
    { algorithm: 'HS256', issuer: 'edumatch-api', audience: 'edumatch-web', expiresIn: '1h' },
  );
  const currentToken = tokenFor('owner', 'token-current', 2);
  const secondToken = tokenFor('owner', 'token-second', 2);
  const foreignToken = tokenFor('other', 'token-foreign', 0);
  const request = (path, token, method = 'GET') => fetch(`${baseUrl}${path}`, {
    method, headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  assert.equal((await request('/sessions')).status, 401);
  assert.equal((await request('/sessions', 'invalid-token')).status, 401);
  // A newly bootstrapped account can manage sessions before changing its password.
  const listResponse = await request('/sessions', currentToken);
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).sessions.filter((entry) => entry.current).map((entry) => entry.id), ['current']);
  assert.equal((await request('/private', currentToken)).status, 403);
  assert.equal((await request('/sessions/foreign', currentToken, 'DELETE')).status, 404);
  assert.equal((await request('/sessions', foreignToken)).status, 200);

  assert.equal((await request('/logout', currentToken, 'POST')).status, 200);
  assert.equal((await request('/sessions', currentToken)).status, 401);
  assert.equal((await request('/sessions', secondToken)).status, 200);
  assert.equal((await request('/sessions/second', secondToken, 'DELETE')).status, 200);
  assert.equal((await request('/sessions', secondToken)).status, 401);
  assert.equal((await request('/sessions', foreignToken)).status, 200);
});
