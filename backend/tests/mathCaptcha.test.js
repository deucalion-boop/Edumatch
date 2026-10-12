const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash, randomBytes } = require('node:crypto');
const express = require('express');
const {
  createMathCaptchaService,
  createMemoryCaptchaStore,
  createRedisCaptchaStore,
  CAPTCHA_TTL_MS,
  CAPTCHA_MAX_ATTEMPTS,
  REDIS_SCRIPTS,
} = require('../services/mathCaptchaService');
const { createCaptchaController } = require('../controllers/captchaController');

function fixture({ integers = [0, 4, 7], store = createMemoryCaptchaStore() } = {}) {
  let time = Date.UTC(2026, 9, 12, 0, 0, 0);
  let integerIndex = 0;
  let tokenIndex = 0;
  const service = createMathCaptchaService({
    store,
    environment: 'test',
    now: () => time,
    randomInt: (min, max) => {
      const value = integers[integerIndex++ % integers.length];
      assert.ok(value >= min && value < max, `Deterministic value ${value} outside [${min}, ${max})`);
      return value;
    },
    randomBytes: (length) => {
      const bytes = Buffer.alloc(length);
      bytes.writeUInt32BE(++tokenIndex, length - 4);
      return bytes;
    },
  });
  return { service, now: () => time, advance: (milliseconds) => { time += milliseconds; } };
}

function errorCode(code) {
  return (error) => {
    assert.equal(error.code, code);
    assert.equal(error.statusCode, 400);
    return true;
  };
}

function answerTo(question) {
  const match = /(\d+)\s*([+\-−])\s*(\d+)/.exec(question);
  assert.ok(match, `Expected simple arithmetic in ${question}`);
  const left = Number(match[1]);
  const right = Number(match[3]);
  assert.ok(left >= 1 && left <= 10);
  assert.ok(right >= 1 && right <= 10);
  const answer = match[2] === '+' ? left + right : left - right;
  assert.ok(answer >= 0 && answer <= 20);
  return answer;
}

test('server creates addition and nonnegative subtraction with operands from 1 through 10', async () => {
  for (const integers of [[0, 4, 7], [1, 4, 7], [0, 1, 10], [1, 1, 10], [1, 10, 10]]) {
    const { service, now } = fixture({ integers });
    const challenge = await service.createChallenge();
    assert.deepEqual(Object.keys(challenge).sort(), ['challengeId', 'expiresAt', 'question']);
    assert.match(challenge.challengeId, /^[a-f0-9]{64}$/);
    assert.equal(new Date(challenge.expiresAt).getTime(), now() + 5 * 60 * 1000);
    const answer = answerTo(challenge.question);
    assert.equal(answer, integers[0] === 0 ? integers[1] + integers[2] : Math.abs(integers[1] - integers[2]));
    const proof = await service.verifyChallenge({ challengeId: challenge.challengeId, answer: String(answer) });
    assert.deepEqual(Object.keys(proof).sort(), ['captchaToken', 'expiresAt']);
    assert.match(proof.captchaToken, /^[a-f0-9]{64}$/);
    assert.notEqual(proof.captchaToken, challenge.challengeId);
    assert.equal(proof.expiresAt, challenge.expiresAt);
    assert.equal(await service.consumeToken(proof.captchaToken), true);
  }
});

test('incorrect numeric answer is rejected and a subsequent correct answer succeeds', async () => {
  const { service } = fixture();
  const challenge = await service.createChallenge();
  await assert.rejects(service.verifyChallenge({ challengeId: challenge.challengeId, answer: 12 }), (error) => {
    errorCode('CAPTCHA_INCORRECT_ANSWER')(error);
    assert.equal(error.data.remainingAttempts, 2);
    assert.equal(error.data.refreshRequired, false);
    return true;
  });
  const proof = await service.verifyChallenge({ challengeId: challenge.challengeId, answer: 11 });
  assert.equal(await service.consumeToken(proof.captchaToken), true);
});

test('empty, noninteger, coercible and out-of-range answers never verify a challenge', async () => {
  const { service } = fixture();
  const challenge = await service.createChallenge();
  for (const answer of [undefined, null, '', ' ', 'eleven', '11x', '1e1', '11.0', 11.1, true, [], [11], {}, -1, 21]) {
    await assert.rejects(service.verifyChallenge({ challengeId: challenge.challengeId, answer }), errorCode('CAPTCHA_INVALID_ANSWER'));
  }
  assert.equal(await service.consumeToken((await service.verifyChallenge({ challengeId: challenge.challengeId, answer: '11' })).captchaToken), true);
});

test('three wrong answers exhaust the challenge and require a fresh challenge', async () => {
  const { service } = fixture();
  const challenge = await service.createChallenge();
  assert.equal(CAPTCHA_MAX_ATTEMPTS, 3);
  for (let attempt = 1; attempt <= CAPTCHA_MAX_ATTEMPTS; attempt += 1) {
    await assert.rejects(service.verifyChallenge({ challengeId: challenge.challengeId, answer: 12 }), (error) => {
      errorCode(attempt < CAPTCHA_MAX_ATTEMPTS ? 'CAPTCHA_INCORRECT_ANSWER' : 'CAPTCHA_ATTEMPTS_EXCEEDED')(error);
      assert.equal(error.data.refreshRequired, attempt === CAPTCHA_MAX_ATTEMPTS);
      return true;
    });
  }
  await assert.rejects(service.verifyChallenge({ challengeId: challenge.challengeId, answer: 11 }), (error) => {
    assert.equal(error.statusCode, 400);
    assert.equal(error.data.refreshRequired, true);
    return true;
  });
  const fresh = await service.createChallenge({ previousChallengeId: challenge.challengeId });
  assert.notEqual(fresh.challengeId, challenge.challengeId);
  assert.ok((await service.verifyChallenge({ challengeId: fresh.challengeId, answer: 11 })).captchaToken);
});

test('challenge and proof expire at five minutes and verification never renews expiry', async () => {
  const challengeFixture = fixture();
  const challenge = await challengeFixture.service.createChallenge();
  assert.equal(CAPTCHA_TTL_MS, 300000);
  challengeFixture.advance(CAPTCHA_TTL_MS);
  await assert.rejects(challengeFixture.service.verifyChallenge({ challengeId: challenge.challengeId, answer: 11 }), errorCode('CAPTCHA_EXPIRED_OR_USED'));

  const proofFixture = fixture();
  const pending = await proofFixture.service.createChallenge();
  proofFixture.advance(CAPTCHA_TTL_MS - 1);
  const proof = await proofFixture.service.verifyChallenge({ challengeId: pending.challengeId, answer: 11 });
  assert.equal(proof.expiresAt, pending.expiresAt);
  proofFixture.advance(1);
  await assert.rejects(proofFixture.service.consumeToken(proof.captchaToken), errorCode('CAPTCHA_EXPIRED_OR_USED'));
});

test('refresh invalidates the previous challenge and any proof it issued', async () => {
  const { service } = fixture();
  const first = await service.createChallenge();
  const second = await service.createChallenge({ previousChallengeId: first.challengeId });
  await assert.rejects(service.verifyChallenge({ challengeId: first.challengeId, answer: 11 }), errorCode('CAPTCHA_EXPIRED_OR_USED'));
  const proof = await service.verifyChallenge({ challengeId: second.challengeId, answer: 11 });
  const third = await service.createChallenge({ previousChallengeId: second.challengeId });
  await assert.rejects(service.consumeToken(proof.captchaToken), errorCode('CAPTCHA_EXPIRED_OR_USED'));
  assert.equal(await service.consumeToken((await service.verifyChallenge({ challengeId: third.challengeId, answer: 11 })).captchaToken), true);
});

test('verification and login-proof consumption each succeed once under concurrent requests', async () => {
  const { service } = fixture();
  const challenge = await service.createChallenge();
  const verifications = await Promise.allSettled(Array.from({ length: 20 }, () => service.verifyChallenge({ challengeId: challenge.challengeId, answer: 11 })));
  const successful = verifications.filter((result) => result.status === 'fulfilled');
  assert.equal(successful.length, 1);
  for (const rejected of verifications.filter((result) => result.status === 'rejected')) {
    assert.equal(rejected.reason.code, 'CAPTCHA_EXPIRED_OR_USED');
  }
  const consumptions = await Promise.allSettled(Array.from({ length: 20 }, () => service.consumeToken(successful[0].value.captchaToken)));
  assert.equal(consumptions.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(consumptions.filter((result) => result.status === 'rejected').length, 19);
});

test('missing, forged and malformed identifiers cannot become a proof', async () => {
  const { service } = fixture();
  for (const challengeId of [undefined, '', 'a', {}, ['a'.repeat(64)]]) {
    await assert.rejects(service.verifyChallenge({ challengeId, answer: 11 }), errorCode('CAPTCHA_INVALID_CHALLENGE'));
  }
  for (const token of [undefined, '', 'a', {}, ['a'.repeat(64)]]) {
    await assert.rejects(service.consumeToken(token), errorCode('CAPTCHA_REQUIRED'));
  }
  await assert.rejects(service.verifyChallenge({ challengeId: 'f'.repeat(64), answer: 11 }), errorCode('CAPTCHA_EXPIRED_OR_USED'));
  await assert.rejects(service.consumeToken('f'.repeat(64)), errorCode('CAPTCHA_EXPIRED_OR_USED'));
  for (const previousChallengeId of [null, '', 'a', {}, ['a'.repeat(64)]]) {
    await assert.rejects(service.createChallenge({ previousChallengeId }), errorCode('CAPTCHA_INVALID_CHALLENGE'));
  }
});

test('bounded development storage refuses excess challenges and permits refresh or expiry to free capacity', async () => {
  const { service, advance } = fixture({ store: createMemoryCaptchaStore({ maxChallenges: 1 }) });
  const first = await service.createChallenge();
  await assert.rejects(service.createChallenge(), { statusCode: 503, code: 'CAPTCHA_UNAVAILABLE' });
  // Refusing excess capacity preserves the current question until refresh.
  const proof = await service.verifyChallenge({ challengeId: first.challengeId, answer: 11 });
  const refreshed = await service.createChallenge({ previousChallengeId: first.challengeId });
  await assert.rejects(service.consumeToken(proof.captchaToken), errorCode('CAPTCHA_EXPIRED_OR_USED'));
  advance(CAPTCHA_TTL_MS);
  const next = await service.createChallenge();
  assert.notEqual(next.challengeId, refreshed.challengeId);
});

async function listen(t, app) {
  const server = await new Promise((resolve) => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('public challenge and verification endpoints expose only questions, opaque proof and expiry', async (t) => {
  const { service } = fixture();
  const controller = createCaptchaController(service);
  const app = express();
  app.use(express.json());
  app.post('/api/auth/captcha/challenge', controller.createCaptchaChallenge);
  app.post('/api/auth/captcha/verify', controller.verifyCaptchaChallenge);
  const base = await listen(t, app);
  const post = async (route, body) => {
    const response = await fetch(`${base}/api/auth/captcha/${route}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: response.status, cacheControl: response.headers.get('cache-control'), body: await response.json() };
  };
  const created = await post('challenge', {});
  assert.equal(created.status, 200);
  assert.equal(created.cacheControl, 'no-store');
  assert.equal(created.body.success, true);
  assert.deepEqual(Object.keys(created.body.data).sort(), ['challengeId', 'expiresAt', 'question']);
  assert.equal(created.body.data.answer, undefined);
  const invalid = await post('verify', { challengeId: created.body.data.challengeId, answer: '' });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.cacheControl, 'no-store');
  assert.equal(invalid.body.success, false);
  assert.equal(invalid.body.code, 'CAPTCHA_INVALID_ANSWER');
  const verified = await post('verify', { challengeId: created.body.data.challengeId, answer: answerTo(created.body.data.question) });
  assert.equal(verified.status, 200);
  assert.equal(verified.cacheControl, 'no-store');
  assert.equal(verified.body.success, true);
  assert.deepEqual(Object.keys(verified.body.data).sort(), ['captchaToken', 'expiresAt']);
  const refreshed = await post('challenge', { previousChallengeId: created.body.data.challengeId });
  assert.equal(refreshed.status, 200);
  await assert.rejects(service.consumeToken(verified.body.data.captchaToken), errorCode('CAPTCHA_EXPIRED_OR_USED'));
});

test('Redis unavailability fails closed without issuing a challenge or proof', async () => {
  const store = createRedisCaptchaStore({ redisProvider: async () => { throw new Error('Fixture Redis unavailable'); } });
  const { service } = fixture({ store });
  for (const operation of [
    () => service.createChallenge(),
    () => service.verifyChallenge({ challengeId: 'a'.repeat(64), answer: 11 }),
    () => service.consumeToken('b'.repeat(64)),
  ]) {
    await assert.rejects(operation(), (error) => {
      assert.equal(error.statusCode, 503);
      assert.equal(error.code, 'CAPTCHA_UNAVAILABLE');
      return true;
    });
  }
});

test('Redis adapter sends atomic scripts with explicit keys and reloads on NOSCRIPT', async () => {
  const commands = [];
  const challengeId = 'a'.repeat(64);
  const token = 'b'.repeat(64);
  const timestamp = Date.UTC(2026, 9, 12);
  const expiry = timestamp + CAPTCHA_TTL_MS;
  const client = {
    isReady: true,
    async sendCommand(command) {
      commands.push(command);
      if (command[0] === 'GET') return challengeId;
      if (command[0] === 'EVALSHA') throw new Error('NOSCRIPT No matching script. Please use EVAL.');
      assert.equal(command[0], 'EVAL');
      return command[1] === REDIS_SCRIPTS.verify ? ['ok', expiry] : ['ok'];
    },
  };
  const prefix = 'edumatch:{captcha-wiring-test}:';
  const store = createRedisCaptchaStore({ redisProvider: async () => client, keyPrefix: prefix });
  const record = { id: challengeId, answer: 11, expiresAt: expiry, attempts: 0, state: 'pending', token: '' };
  assert.deepEqual(await store.create(record, 'c'.repeat(64), timestamp), { status: 'ok' });
  assert.deepEqual(await store.verify(challengeId, '11', token, timestamp), { status: 'ok', expiresAt: expiry });
  assert.deepEqual(await store.consume(token, timestamp), { status: 'ok' });
  const evaluations = commands.filter((command) => command[0] === 'EVAL');
  assert.equal(evaluations.length, 3);
  const expected = [
    { script: REDIS_SCRIPTS.create, keys: [`${prefix}challenge:${challengeId}`, `${prefix}challenge:${'c'.repeat(64)}`], args: [JSON.stringify(record), String(expiry), String(timestamp)] },
    { script: REDIS_SCRIPTS.verify, keys: [`${prefix}challenge:${challengeId}`, `${prefix}proof:${token}`], args: [String(timestamp), '11', token, '3'] },
    { script: REDIS_SCRIPTS.consume, keys: [`${prefix}proof:${token}`, `${prefix}challenge:${challengeId}`], args: [String(timestamp), challengeId, token] },
  ];
  for (let index = 0; index < expected.length; index += 1) {
    const operation = expected[index];
    assert.deepEqual(evaluations[index], ['EVAL', operation.script, '2', ...operation.keys, ...operation.args]);
    const hash = createHash('sha1').update(operation.script).digest('hex');
    assert.ok(commands.some((command) => command[0] === 'EVALSHA' && command[1] === hash));
  }
});

test('Redis command failures return safe errors and never retry a failed command as NOSCRIPT', async () => {
  const commands = [];
  const store = createRedisCaptchaStore({
    redisProvider: async () => ({
      isReady: true,
      sendCommand: async (command) => {
        commands.push(command);
        throw new Error('Fixture network failure containing sensitive Redis credentials');
      },
    }),
  });
  const { service } = fixture({ store });
  await assert.rejects(service.createChallenge(), (error) => {
    assert.equal(error.code, 'CAPTCHA_UNAVAILABLE');
    assert.equal(error.statusCode, 503);
    assert.doesNotMatch(error.message, /sensitive|credentials|network failure/);
    return true;
  });
  assert.equal(commands.length, 1);
  assert.equal(commands[0][0], 'EVALSHA');
});

// This suite deliberately needs a dedicated test Redis; it never reads the app's
// REDIS_URL, emulates Lua, flushes databases or touches another namespace.
test('real Redis atomically enforces refresh and single use across service instances', {
  skip: !process.env.CAPTCHA_TEST_REDIS_URL && 'Set CAPTCHA_TEST_REDIS_URL to a dedicated test Redis to execute Lua integration.',
}, async (t) => {
  const { createClient } = require('redis');
  const client = createClient({ url: process.env.CAPTCHA_TEST_REDIS_URL, disableOfflineQueue: true });
  client.on('error', () => {});
  await client.connect();
  t.after(async () => { await client.quit(); });
  const keyPrefix = `edumatch:{captcha-test-${randomBytes(12).toString('hex')}}:`;
  const makeService = () => createMathCaptchaService({
    store: createRedisCaptchaStore({ redisProvider: async () => client, keyPrefix }),
    environment: 'test',
    randomInt: (min) => min === 0 ? 0 : 4,
  });
  const first = makeService();
  const second = makeService();
  const challenge = await first.createChallenge();
  const verified = await Promise.allSettled(Array.from({ length: 10 }, (_, index) => (index % 2 ? first : second).verifyChallenge({ challengeId: challenge.challengeId, answer: 8 })));
  const successful = verified.filter((result) => result.status === 'fulfilled');
  assert.equal(successful.length, 1);
  const proof = successful[0].value;
  await second.createChallenge({ previousChallengeId: challenge.challengeId });
  await assert.rejects(first.consumeToken(proof.captchaToken), errorCode('CAPTCHA_EXPIRED_OR_USED'));
  const next = await first.createChallenge();
  const nextProof = await second.verifyChallenge({ challengeId: next.challengeId, answer: 8 });
  const consumed = await Promise.allSettled(Array.from({ length: 10 }, (_, index) => (index % 2 ? first : second).consumeToken(nextProof.captchaToken)));
  assert.equal(consumed.filter((result) => result.status === 'fulfilled').length, 1);
});
