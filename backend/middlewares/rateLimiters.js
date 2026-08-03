const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { createClient } = require('redis');

let redisClient = null;
let redisReady = Promise.resolve();

function createSharedStore(prefix) {
  const redisUrl = String(process.env.REDIS_URL || '').trim();
  if (!redisUrl) return undefined;

  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (error) => {
      console.error('[RATE_LIMIT] Redis error:', error.message);
    });
    redisReady = redisClient.connect().then(() => {
      console.log('[RATE_LIMIT] Redis-backed rate limiting enabled.');
    });
  }

  return new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: `edumatch:${prefix}:`,
  });
}

function buildLimiter({ prefix, windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store: createSharedStore(prefix),
    message: { success: false, message },
  });
}

const apiLimiter = buildLimiter({
  prefix: 'api',
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Too many requests. Please try again later.',
});

const loginLimiter = buildLimiter({
  prefix: 'login',
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many sign-in attempts. Please try again later.',
});

const passwordResetLimiter = buildLimiter({
  prefix: 'password-reset',
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Too many password-reset requests. Please try again later.',
});

const inviteLimiter = buildLimiter({
  prefix: 'invite',
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many invite requests. Please try again later.',
});

const uploadLimiter = buildLimiter({
  prefix: 'upload',
  windowMs: 60 * 60 * 1000,
  limit: 30,
  message: 'Too many file uploads. Please try again later.',
});

const aiLimiter = buildLimiter({
  prefix: 'ai',
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many AI-generation requests. Please try again later.',
});

module.exports = {
  aiLimiter,
  apiLimiter,
  inviteLimiter,
  loginLimiter,
  passwordResetLimiter,
  redisReady,
  uploadLimiter,
};
