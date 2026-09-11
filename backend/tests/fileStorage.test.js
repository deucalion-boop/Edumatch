const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const storageRoutes = require('../routes/storageRoutes');
const {
  buildStorageAccessToken,
  downloadOrRedirectStoredFile,
  readStoredFileBuffer,
  resolveStoredFileUrl,
  verifyStorageAccessToken,
} = require('../utils/fileStorage');
const { buildStoragePath } = require('../services/storageService');
const { LOCAL_UPLOADS_DIR, writeLocalFileBuffer } = require('../utils/localFileStorage');

const testSecret = 'storage-test-secret-for-isolated-local-tests';
const originalSecret = process.env.STORAGE_URL_SIGNING_SECRET;
const originalJwtSecret = process.env.JWT_SECRET;
const fileContents = '%PDF-1.7\nprivate lesson fixture';
const request = { protocol: 'https', get: () => 'api.example.test' };
let fixtureDirectory;
let storedPath;
let server;
let origin;

function signedPayload(payload) {
  const encoded = Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', testSecret).update(encoded).digest('hex');
  return `${encoded}.${signature}`;
}

function tokenPayload(overrides = {}) {
  return { storedPath, download: false, fileName: 'lesson.pdf', expiresAt: Date.now() + 60000, ...overrides };
}

async function getFile(token) {
  return fetch(`${origin}/api/storage/file${token === undefined ? '' : `?token=${encodeURIComponent(token)}`}`);
}

test.before(async () => {
  process.env.STORAGE_URL_SIGNING_SECRET = testSecret;
  await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
  fixtureDirectory = await fs.mkdtemp(path.join(LOCAL_UPLOADS_DIR, 'security-file-test-'));
  storedPath = `uploads/${path.basename(fixtureDirectory)}/lesson.pdf`;
  await writeLocalFileBuffer(storedPath, Buffer.from(fileContents));
  const app = express();
  app.use(helmet());
  app.use('/api/storage', storageRoutes);
  app.get('/authorized-download', async (_req, res, next) => {
    try {
      await downloadOrRedirectStoredFile(request, res, storedPath, 'My lesson.pdf');
    } catch (error) {
      next(error);
    }
  });
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ message: error.message }));
  server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
  if (fixtureDirectory) {
    assert.equal(path.dirname(fixtureDirectory), LOCAL_UPLOADS_DIR);
    assert.match(path.basename(fixtureDirectory), /^security-file-test-/);
    await fs.rm(fixtureDirectory, { recursive: true, force: true });
  }
  if (originalSecret === undefined) delete process.env.STORAGE_URL_SIGNING_SECRET;
  else process.env.STORAGE_URL_SIGNING_SECRET = originalSecret;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

test('local paths and legacy upload URLs resolve to expiring signed URLs', () => {
  for (const value of [storedPath, `/${storedPath}`, `https://old-api.example.test/${storedPath}`]) {
    const result = new URL(resolveStoredFileUrl(request, value));
    assert.equal(result.origin, 'https://api.example.test');
    assert.equal(result.pathname, '/api/storage/file');
    const payload = verifyStorageAccessToken(result.searchParams.get('token'));
    assert.equal(payload.storedPath, storedPath);
    assert.ok(payload.expiresAt > Date.now());
  }
  assert.equal(resolveStoredFileUrl(request, 'https://example.test/material.pdf'), 'https://example.test/material.pdf');
  const supabaseUrl = new URL(resolveStoredFileUrl(request, 'supabase://files/lessons/private.pdf'));
  assert.equal(supabaseUrl.pathname, '/api/storage/file');
});

test('file route serves signed content and download names with private response headers', async () => {
  const response = await getFile(buildStorageAccessToken({ storedPath, download: true, fileName: 'My lesson.pdf' }));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), fileContents);
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.match(response.headers.get('content-disposition'), /^attachment; filename="My lesson.pdf"/);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.equal(response.headers.get('x-frame-options'), null);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'self'/);
  const inline = await getFile(buildStorageAccessToken({ storedPath }));
  assert.equal(inline.status, 200);
  assert.match(inline.headers.get('content-disposition'), /^inline;/);
  const directDownload = await fetch(`${origin}/authorized-download`);
  assert.equal(directDownload.status, 200);
  assert.equal(await directDownload.text(), fileContents);
});

test('file route rejects missing, forged, malformed and expired access tokens', async () => {
  assert.equal((await getFile()).status, 400);
  const valid = buildStorageAccessToken({ storedPath });
  const [encoded, signature] = valid.split('.');
  const changed = Buffer.from(JSON.stringify(tokenPayload({ storedPath: 'uploads/other-student/lesson.pdf' }))).toString('base64url');
  assert.equal((await getFile(`${changed}.${signature}`)).status, 403);
  assert.equal((await getFile(`${encoded}.${'0'.repeat(64)}`)).status, 403);
  assert.equal((await getFile(`${valid}.extra`)).status, 400);
  assert.equal((await getFile(signedPayload(tokenPayload({ expiresAt: Date.now() - 1 })))).status, 410);
  assert.equal((await getFile(signedPayload(tokenPayload({ expiresAt: 'Infinity' })))).status, 400);
  assert.equal((await getFile(signedPayload(`{"storedPath":"${storedPath}","download":false,"fileName":"x","expiresAt":1e999}`))).status, 400);
  assert.equal((await getFile(signedPayload('not json'))).status, 400);
});

test('token verification and direct reads reject traversal and absolute disk paths', async () => {
  for (const value of [
    '../.env', 'uploads/../.env', '/uploads/../../.env', 'uploads/%2e%2e/.env',
    'uploads/..\\.env', 'C:\\Windows\\win.ini', '/etc/passwd', '//server/share/file',
    'uploads/lesson.pdf:secret', 'uploads/subdir./lesson.pdf',
  ]) {
    assert.throws(() => buildStorageAccessToken({ storedPath: value }), { statusCode: 400 });
    await assert.rejects(readStoredFileBuffer(value), { statusCode: 400 });
    assert.equal((await getFile(signedPayload(tokenPayload({ storedPath: value })))).status, 400, value);
  }
  assert.equal((await getFile(buildStorageAccessToken({ storedPath: `${storedPath}.missing` }))).status, 404);
});

test('legacy upload URLs read locally without relying on public HTTP access', async () => {
  assert.equal((await readStoredFileBuffer(`https://old-host.invalid/${storedPath}`)).toString(), fileContents);
});

test('local reads and uploads reject a junction or symlink out of the uploads tree', async (context) => {
  const link = path.join(fixtureDirectory, 'outside-link');
  try {
    await fs.symlink(path.resolve(__dirname, '..'), link, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      context.skip('This environment cannot create test symlinks');
      return;
    }
    throw error;
  }
  try {
    const linkedPath = `uploads/${path.basename(fixtureDirectory)}/outside-link/package.json`;
    await assert.rejects(readStoredFileBuffer(linkedPath), { statusCode: 400 });
    assert.equal((await getFile(buildStorageAccessToken({ storedPath: linkedPath }))).status, 400);
    await assert.rejects(writeLocalFileBuffer(`${linkedPath}.test`, Buffer.from('blocked')), { statusCode: 400 });
  } finally {
    await fs.unlink(link);
  }
});

test('upload paths cannot escape their root and existing files are never overwritten', async () => {
  for (const folder of ['../private', 'lessons/../../private', 'lessons\\..\\private']) {
    assert.throws(() => buildStoragePath({ folder, originalName: 'lesson.pdf' }), { statusCode: 400 });
  }
  await assert.rejects(writeLocalFileBuffer(storedPath, Buffer.from('overwrite')), { code: 'EEXIST' });
  assert.equal((await readStoredFileBuffer(storedPath)).toString(), fileContents);
});

test('signed file URLs require a configured secret and support the configured JWT fallback', () => {
  delete process.env.STORAGE_URL_SIGNING_SECRET;
  delete process.env.JWT_SECRET;
  try {
    assert.throws(() => buildStorageAccessToken({ storedPath }), { statusCode: 503 });
    process.env.JWT_SECRET = 'configured-jwt-test-secret';
    assert.equal(verifyStorageAccessToken(buildStorageAccessToken({ storedPath })).storedPath, storedPath);
  } finally {
    process.env.STORAGE_URL_SIGNING_SECRET = testSecret;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
  }
});
