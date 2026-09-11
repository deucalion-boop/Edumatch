const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const express = require('express');
const redis = require('redis');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

// Only the Redis transport is replaced. The installed stores and HTTP limiters
// execute their actual initialization, commands, error handling, and responses.
function fakeTransport({ connection = Promise.resolve(), holdScripts = false } = {}) {
  const fixture = {
    commands: [], scriptLoads: [], scripts: new Set(), counters: new Map(),
    commandFailure: null, scriptFailure: null,
    on() { return fixture; },
    connect() { return connection; },
    async sendCommand(command) {
      fixture.commands.push(command);
      if (fixture.commandFailure) throw fixture.commandFailure;
      if (command[0] === 'SCRIPT' && command[1] === 'LOAD') {
        if (fixture.scriptFailure) throw fixture.scriptFailure;
        const sha = createHash('sha1').update(command[2]).digest('hex');
        if (holdScripts) {
          const ready = deferred();
          fixture.scriptLoads.push(ready);
          await ready.promise;
        }
        fixture.scripts.add(sha);
        return sha;
      }
      if (command[0] === 'EVALSHA') {
        if (!fixture.scripts.has(command[1])) throw new Error('NOSCRIPT No matching script');
        const key = command[3];
        const now = Date.now();
        let counter = fixture.counters.get(key);
        if (command.length === 5) {
          if (!counter || counter.resetAt <= now) counter = { hits: 0, resetAt: now + Number(command[4]) };
          counter.hits += 1;
          fixture.counters.set(key, counter);
        }
        return counter ? [counter.hits, Math.max(0, counter.resetAt - now)] : [false, -2];
      }
      throw new Error(`Unexpected fixture Redis command: ${command[0]}`);
    },
  };
  return fixture;
}

function loadLimiters(t, transport) {
  const previousUrl = process.env.REDIS_URL;
  process.env.REDIS_URL = 'redis://isolated-test-transport.invalid:6379';
  const modulePath = require.resolve('../middlewares/rateLimiters');
  const createClient = t.mock.method(redis, 'createClient', () => transport);
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'error', () => {});
  t.after(() => {
    delete require.cache[modulePath];
    if (previousUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previousUrl;
  });
  delete require.cache[modulePath];
  return { ...require(modulePath), createClient };
}

async function listen(t, app) {
  const server = await new Promise((resolve) => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test('Redis readiness waits for the connection and every limiter script initialization', async (t) => {
  const connection = deferred();
  const transport = fakeTransport({ connection: connection.promise, holdScripts: true });
  const { redisReady, createClient } = loadLimiters(t, transport);
  let ready = false;
  const completion = redisReady.then(() => { ready = true; });
  await new Promise(setImmediate);
  assert.equal(ready, false);
  assert.deepEqual(transport.commands, []);
  assert.equal(createClient.mock.callCount(), 1);
  assert.equal(createClient.mock.calls[0].arguments[0].disableOfflineQueue, true);

  connection.resolve();
  await new Promise(setImmediate);
  assert.equal(transport.scriptLoads.length, 12);
  assert.equal(ready, false);
  transport.scriptLoads.slice(0, -1).forEach((load) => load.resolve());
  await new Promise(setImmediate);
  assert.equal(ready, false);
  transport.scriptLoads.at(-1).resolve();
  await completion;
  assert.equal(ready, true);
});

test('independent Redis-backed limiter instances share counters while limiter namespaces stay separate', async (t) => {
  const transport = fakeTransport();
  const first = loadLimiters(t, transport);
  await first.redisReady;
  delete require.cache[require.resolve('../middlewares/rateLimiters')];
  const second = require('../middlewares/rateLimiters');
  await second.redisReady;
  assert.equal(first.createClient.mock.callCount(), 2);
  const app = express();
  let successfulRequests = 0;
  const success = (_req, res) => { successfulRequests += 1; res.json({ success: true }); };
  app.get('/first', first.loginLimiter, success);
  app.get('/second', second.loginLimiter, success);
  app.get('/password-reset', first.passwordResetLimiter, success);
  const base = await listen(t, app);
  for (let index = 0; index < 10; index += 1) {
    assert.equal((await fetch(`${base}/${index % 2 ? 'second' : 'first'}`)).status, 200);
  }
  const rejected = await fetch(`${base}/second`);
  assert.equal(rejected.status, 429);
  assert.ok(Number(rejected.headers.get('retry-after')) > 0);
  assert.equal(successfulRequests, 10);
  assert.equal((await fetch(`${base}/password-reset`)).status, 200);
  assert.ok([...transport.counters.keys()].some((key) => key.startsWith('edumatch:login:')));
  assert.ok([...transport.counters.keys()].some((key) => key.startsWith('edumatch:password-reset:')));
});

test('Redis transport failures fail closed without invoking the endpoint or resetting its request budget', async (t) => {
  const transport = fakeTransport();
  const { loginLimiter, redisReady } = loadLimiters(t, transport);
  await redisReady;
  const app = express();
  let successfulRequests = 0;
  app.get('/', loginLimiter, (_req, res) => { successfulRequests += 1; res.json({ success: true }); });
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ success: false }));
  const base = await listen(t, app);
  assert.equal((await fetch(base)).status, 200);
  transport.commandFailure = new Error('Fixture Redis connection lost');
  assert.equal((await fetch(base)).status, 500);
  assert.equal(successfulRequests, 1);
  assert.equal([...transport.counters.values()][0].hits, 1);

  transport.commandFailure = null;
  transport.scripts.clear();
  // Real RedisStore must reload scripts after NOSCRIPT, retaining the counter.
  assert.equal((await fetch(base)).status, 200);
  assert.equal([...transport.counters.values()][0].hits, 2);
  assert.equal(successfulRequests, 2);
});

test('Redis readiness rejects connection failures and script initialization failures', async (t) => {
  await t.test('connection failure', async (subtest) => {
    const connection = deferred();
    const transport = fakeTransport({ connection: connection.promise });
    const { redisReady } = loadLimiters(subtest, transport);
    const rejected = assert.rejects(redisReady, /Fixture connection failure/);
    connection.reject(new Error('Fixture connection failure'));
    await rejected;
    assert.deepEqual(transport.commands, []);
  });
  await t.test('script initialization failure', async (subtest) => {
    const transport = fakeTransport();
    transport.scriptFailure = new Error('Fixture script permissions rejected');
    const { redisReady } = loadLimiters(subtest, transport);
    await assert.rejects(redisReady, /Fixture script permissions rejected/);
  });
});
