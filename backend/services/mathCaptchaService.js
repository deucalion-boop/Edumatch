const crypto = require('node:crypto');

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const CAPTCHA_MAX_ATTEMPTS = 3;
const OPAQUE_ID_PATTERN = /^[a-f0-9]{64}$/;

class MathCaptchaError extends Error {
  constructor(code, message, { statusCode = 400, refreshRequired = true, remainingAttempts } = {}) {
    super(message);
    this.name = 'MathCaptchaError';
    this.code = code;
    this.statusCode = statusCode;
    this.data = { refreshRequired };
    if (remainingAttempts !== undefined) this.data.remainingAttempts = remainingAttempts;
  }
}

function unavailable() {
  return new MathCaptchaError('CAPTCHA_UNAVAILABLE', 'CAPTCHA is unavailable. Please try again.', { statusCode: 503 });
}

function expiredOrUsed() {
  return new MathCaptchaError('CAPTCHA_EXPIRED_OR_USED', 'CAPTCHA has expired or already been used. Please refresh it.');
}

// Memory is deliberately limited to local development. Every mutation below is
// synchronous, so parallel requests cannot verify or consume the same record.
function createMemoryCaptchaStore({ maxChallenges = 10000 } = {}) {
  if (!Number.isInteger(maxChallenges) || maxChallenges < 1) throw new TypeError('Invalid CAPTCHA store capacity');
  const challenges = new Map();
  const proofs = new Map();

  function remove(id) {
    const record = challenges.get(id);
    if (record?.token) proofs.delete(record.token);
    challenges.delete(id);
  }

  function active(id, now) {
    const record = challenges.get(id);
    if (record && record.expiresAt <= now) {
      remove(id);
      return undefined;
    }
    return record;
  }

  return {
    async create(record, previousId, now) {
      for (const [id, stored] of challenges) {
        if (stored.expiresAt <= now) remove(id);
      }
      if (challenges.has(record.id)) return { status: 'collision' };
      const replaced = previousId && challenges.has(previousId);
      if (challenges.size - (replaced ? 1 : 0) >= maxChallenges) throw unavailable();
      if (previousId) remove(previousId);
      challenges.set(record.id, { ...record });
      return { status: 'ok' };
    },

    async verify(id, answer, token, now) {
      const record = active(id, now);
      if (!record) return { status: 'missing' };
      if (record.state !== 'pending') return { status: 'used' };
      if (String(record.answer) !== answer) {
        record.attempts += 1;
        if (record.attempts >= CAPTCHA_MAX_ATTEMPTS) {
          remove(id);
          return { status: 'exhausted' };
        }
        return { status: 'incorrect', remainingAttempts: CAPTCHA_MAX_ATTEMPTS - record.attempts };
      }
      if (proofs.has(token)) return { status: 'collision' };
      record.state = 'verified';
      record.token = token;
      // The answer phase is consumed; a login may consume this proof only once.
      delete record.answer;
      proofs.set(token, id);
      return { status: 'ok', expiresAt: record.expiresAt };
    },

    async consume(token, now) {
      const id = proofs.get(token);
      const record = id && active(id, now);
      if (!record || record.state !== 'verified' || record.token !== token) return { status: 'missing' };
      remove(id);
      return { status: 'ok' };
    },
  };
}

// All keys are explicitly supplied and share a Redis Cluster hash tag. Refresh
// deletes the prior challenge atomically. Its proof pointer may live until TTL,
// but consumption also requires the challenge, so it is immediately invalid.
const REDIS_SCRIPTS = {
  create: `
    if redis.call('EXISTS', KEYS[1]) == 1 then return {'collision'} end
    local ttl = tonumber(ARGV[2]) - tonumber(ARGV[3])
    if ttl <= 0 then return {'missing'} end
    redis.call('SET', KEYS[1], ARGV[1])
    redis.call('PEXPIREAT', KEYS[1], ARGV[2])
    if #KEYS == 2 then redis.call('DEL', KEYS[2]) end
    return {'ok'}
  `,
  verify: `
    local value = redis.call('GET', KEYS[1])
    if not value then return {'missing'} end
    local record = cjson.decode(value)
    local ttl = tonumber(record.expiresAt) - tonumber(ARGV[1])
    if ttl <= 0 then redis.call('DEL', KEYS[1]); return {'missing'} end
    if record.state ~= 'pending' then return {'used'} end
    if tostring(record.answer) ~= ARGV[2] then
      record.attempts = record.attempts + 1
      if record.attempts >= tonumber(ARGV[4]) then
        redis.call('DEL', KEYS[1])
        return {'exhausted'}
      end
      redis.call('SET', KEYS[1], cjson.encode(record))
      redis.call('PEXPIREAT', KEYS[1], record.expiresAt)
      return {'incorrect', tonumber(ARGV[4]) - record.attempts}
    end
    if redis.call('EXISTS', KEYS[2]) == 1 then return {'collision'} end
    record.state = 'verified'
    record.token = ARGV[3]
    record.answer = nil
    redis.call('SET', KEYS[1], cjson.encode(record))
    redis.call('PEXPIREAT', KEYS[1], record.expiresAt)
    redis.call('SET', KEYS[2], record.id)
    redis.call('PEXPIREAT', KEYS[2], record.expiresAt)
    return {'ok', record.expiresAt}
  `,
  consume: `
    if redis.call('GET', KEYS[1]) ~= ARGV[2] then return {'missing'} end
    local value = redis.call('GET', KEYS[2])
    if not value then redis.call('DEL', KEYS[1]); return {'missing'} end
    local record = cjson.decode(value)
    if tonumber(record.expiresAt) <= tonumber(ARGV[1]) then
      redis.call('DEL', KEYS[1], KEYS[2])
      return {'missing'}
    end
    if record.state ~= 'verified' or record.token ~= ARGV[3] then return {'missing'} end
    redis.call('DEL', KEYS[1], KEYS[2])
    return {'ok'}
  `,
};

async function evalScript(client, script, keys, args) {
  const hash = crypto.createHash('sha1').update(script).digest('hex');
  const inputs = [String(keys.length), ...keys, ...args.map(String)];
  try {
    return await client.sendCommand(['EVALSHA', hash, ...inputs]);
  } catch (error) {
    if (!/^NOSCRIPT\b/.test(String(error?.message || ''))) throw error;
    return client.sendCommand(['EVAL', script, ...inputs]);
  }
}

function createRedisCaptchaStore({ redisProvider, keyPrefix = 'edumatch:{math-captcha}:' } = {}) {
  const provider = redisProvider || (() => require('../middlewares/rateLimiters').getSharedRedisClient());
  const challengeKey = (id) => `${keyPrefix}challenge:${id}`;
  const proofKey = (token) => `${keyPrefix}proof:${token}`;

  async function getClient() {
    const client = await provider();
    if (!client || client.isReady === false) throw unavailable();
    return client;
  }

  return {
    async create(record, previousId, now) {
      const keys = [challengeKey(record.id)];
      if (previousId) keys.push(challengeKey(previousId));
      const result = await evalScript(await getClient(), REDIS_SCRIPTS.create, keys, [JSON.stringify(record), record.expiresAt, now]);
      return { status: result[0] };
    },

    async verify(id, answer, token, now) {
      const result = await evalScript(await getClient(), REDIS_SCRIPTS.verify,
        [challengeKey(id), proofKey(token)], [now, answer, token, CAPTCHA_MAX_ATTEMPTS]);
      return {
        status: result[0],
        ...(result[0] === 'ok' ? { expiresAt: Number(result[1]) } : {}),
        ...(result[0] === 'incorrect' ? { remainingAttempts: Number(result[1]) } : {}),
      };
    },

    async consume(token, now) {
      const client = await getClient();
      const id = await client.sendCommand(['GET', proofKey(token)]);
      if (typeof id !== 'string' || !OPAQUE_ID_PATTERN.test(id)) return { status: 'missing' };
      // The read only locates the challenge. The script rechecks both records and
      // deletes them atomically, including when refresh races with this request.
      const result = await evalScript(client, REDIS_SCRIPTS.consume,
        [proofKey(token), challengeKey(id)], [now, id, token]);
      return { status: result[0] };
    },
  };
}

function createMathCaptchaService(options = {}) {
  const now = options.now || Date.now;
  const randomInt = options.randomInt || crypto.randomInt;
  const randomBytes = options.randomBytes || crypto.randomBytes;
  const environment = options.environment === undefined ? process.env.NODE_ENV : options.environment;
  const shared = environment === 'production' || Boolean(String(process.env.REDIS_URL || '').trim()) || Boolean(options.redisProvider);
  const store = options.store || (shared
    ? createRedisCaptchaStore({ redisProvider: options.redisProvider })
    : createMemoryCaptchaStore());

  async function storeOperation(operation) {
    try {
      return await operation();
    } catch (error) {
      // Do not leak Redis addresses, credentials, scripts, answers, or records.
      if (error instanceof MathCaptchaError) throw error;
      throw unavailable();
    }
  }

  function assertId(value) {
    if (typeof value !== 'string' || !OPAQUE_ID_PATTERN.test(value)) {
      throw new MathCaptchaError('CAPTCHA_INVALID_CHALLENGE', 'CAPTCHA challenge is invalid. Please refresh it.');
    }
  }

  return {
    async createChallenge(input = {}) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new MathCaptchaError('CAPTCHA_INVALID_CHALLENGE', 'CAPTCHA request is invalid. Please refresh it.');
      }
      const { previousChallengeId } = input;
      if (previousChallengeId !== undefined) assertId(previousChallengeId);
      const subtraction = randomInt(0, 2) === 1;
      let left = randomInt(1, 11);
      let right = randomInt(1, 11);
      if (subtraction && left < right) [left, right] = [right, left];
      const timestamp = now();
      const expiresAt = timestamp + CAPTCHA_TTL_MS;
      const answer = subtraction ? left - right : left + right;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const id = randomBytes(32).toString('hex');
        const result = await storeOperation(() => store.create({ id, answer, expiresAt, attempts: 0, state: 'pending', token: '' }, previousChallengeId, timestamp));
        if (result.status === 'collision') continue;
        if (result.status !== 'ok') throw unavailable();
        return { challengeId: id, question: `${left} ${subtraction ? '\u2212' : '+'} ${right} = ?`, expiresAt: new Date(expiresAt).toISOString() };
      }
      throw unavailable();
    },

    async verifyChallenge(input = {}) {
      const { challengeId, answer } = input || {};
      assertId(challengeId);
      const answerText = typeof answer === 'number' && Number.isInteger(answer)
        ? String(answer) : typeof answer === 'string' ? answer.trim() : '';
      if (!/^\d{1,2}$/.test(answerText) || Number(answerText) > 20) {
        throw new MathCaptchaError('CAPTCHA_INVALID_ANSWER', 'Enter a whole-number CAPTCHA answer.', { refreshRequired: false });
      }
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const token = randomBytes(32).toString('hex');
        const result = await storeOperation(() => store.verify(challengeId, String(Number(answerText)), token, now()));
        if (result.status === 'collision') continue;
        if (result.status === 'ok') return { captchaToken: token, expiresAt: new Date(result.expiresAt).toISOString() };
        if (result.status === 'incorrect') {
          throw new MathCaptchaError('CAPTCHA_INCORRECT_ANSWER', 'Incorrect answer. Please try again.', {
            refreshRequired: false, remainingAttempts: result.remainingAttempts,
          });
        }
        if (result.status === 'exhausted') {
          throw new MathCaptchaError('CAPTCHA_ATTEMPTS_EXCEEDED', 'Too many incorrect answers. Please refresh the CAPTCHA.');
        }
        throw expiredOrUsed();
      }
      throw unavailable();
    },

    async consumeToken(token) {
      if (typeof token !== 'string' || !OPAQUE_ID_PATTERN.test(token)) {
        throw new MathCaptchaError('CAPTCHA_REQUIRED', 'Please verify that you are not a robot');
      }
      const result = await storeOperation(() => store.consume(token, now()));
      if (result.status !== 'ok') throw expiredOrUsed();
      return true;
    },
  };
}

const service = createMathCaptchaService();

module.exports = {
  ...service,
  CAPTCHA_TTL_MS,
  CAPTCHA_MAX_ATTEMPTS,
  REDIS_SCRIPTS,
  MathCaptchaError,
  createMathCaptchaService,
  createMemoryCaptchaStore,
  createRedisCaptchaStore,
};
