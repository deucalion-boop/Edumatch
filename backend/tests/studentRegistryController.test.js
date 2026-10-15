const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

function controller(details) {
  const filename = path.resolve(__dirname, '../controllers/studentRegistryController.js');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = name => name === '../services/studentRegistryService'
    ? { MAX_FILE_BYTES: 2 * 1024 * 1024, details } : originalRequire(name);
  loaded._compile(fs.readFileSync(filename, 'utf8'), filename);
  return loaded.exports;
}

async function invoke(handler) {
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  let failure;
  await handler({ params: { token: 'private-bearer-token' } }, response, error => { failure = error; });
  return { response, failure };
}

test('registry controller keeps typed lifecycle errors available in production without exposing exception details', async () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    for (const [code, statusCode] of [['INVITATION_INVALID', 404], ['SESSION_EXPIRED', 410], ['CODE_REVOKED', 410], ['STUDENT_REGISTERED', 409]]) {
      const error = Object.assign(new Error('Actionable registration guidance.'), {
        registryError: true, code, statusCode, stack: 'private stack containing bearer token', details: 'private database data',
      });
      const { response, failure } = await invoke(controller(async () => { throw error; }).details);
      assert.equal(failure, undefined);
      assert.equal(response.statusCode, statusCode);
      assert.deepEqual(response.body, { success: false, message: 'Actionable registration guidance.', code });
      assert.equal(JSON.stringify(response.body).includes('private'), false);
    }
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  }
});

test('registry controller preserves safe retry metadata and ordinary input validation responses', async () => {
  const error = Object.assign(new Error('Please wait before requesting another code.'), {
    registryError: true, statusCode: 429, code: 'INVITATION_COOLDOWN', retryAfter: 30,
  });
  const throttled = await invoke(controller(async () => { throw error; }).details);
  assert.equal(throttled.response.statusCode, 429);
  assert.equal(throttled.response.body.retryAfter, 30);
  const invalid = await invoke(controller(async () => { throw Object.assign(new Error('Enter a valid email address.'), { statusCode: 400 }); }).details);
  assert.equal(invalid.failure, undefined);
  assert.equal(invalid.response.statusCode, 400);
  assert.equal(invalid.response.body.message, 'Enter a valid email address.');
});

test('registry controller preserves success envelopes and delegates unexpected internal failures', async () => {
  const registration = { schoolName: 'EduMatch', status: 'Active', expiresAt: '2030-01-01T00:00:00.000Z' };
  const success = await invoke(controller(async () => ({ registration })).details);
  assert.equal(success.response.statusCode, 200);
  assert.equal(success.response.body.success, true);
  assert.deepEqual(success.response.body.registration, registration);
  const internal = new Error('private connection exception');
  const failed = await invoke(controller(async () => { throw internal; }).details);
  assert.equal(failed.failure, internal);
  assert.equal(failed.response.body, undefined);
});
