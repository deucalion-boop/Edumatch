const { getSupabaseStorageClient } = require('./supabaseStorageService');

function normalizeError(error, message) {
  const normalized = new Error(String(error?.message || message));
  normalized.code = error?.code;
  normalized.statusCode = 500;
  return normalized;
}

async function createSession(payload) {
  const client = getSupabaseStorageClient();
  const { data, error } = await client.from('sessions').insert({
    user_id: String(payload.userId), token_id: payload.tokenId,
    ip_address: payload.ipAddress || '', user_agent: payload.userAgent || '',
    remember: payload.remember === true, last_seen_at: new Date().toISOString(),
    expires_at: new Date(payload.expiresAt).toISOString(),
  }).select('*').single();
  if (error) throw normalizeError(error, 'Failed to create session');
  return { _id: data.id, userId: data.user_id, tokenId: data.token_id, ...data };
}

async function sessionExists(userId, userAgent) {
  const client = getSupabaseStorageClient();
  const { data, error } = await client.from('sessions').select('id')
    .eq('user_id', String(userId)).eq('user_agent', String(userAgent || '')).limit(1).maybeSingle();
  if (error) throw normalizeError(error, 'Failed to check session');
  return Boolean(data);
}

async function findActiveSession(userId, tokenId) {
  const client = getSupabaseStorageClient();
  const { data, error } = await client.from('sessions').select('*')
    .eq('user_id', String(userId)).eq('token_id', tokenId).is('revoked_at', null)
    .gt('expires_at', new Date().toISOString()).limit(1).maybeSingle();
  if (error) throw normalizeError(error, 'Failed to read session');
  return data ? { _id: data.id, ...data } : null;
}

async function touchSession(id, lastSeenAt = new Date()) {
  const client = getSupabaseStorageClient();
  const { error } = await client.from('sessions').update({ last_seen_at: new Date(lastSeenAt).toISOString() }).eq('id', String(id));
  if (error) throw normalizeError(error, 'Failed to update session');
}

async function revokeUserSessions(userId, reason) {
  const client = getSupabaseStorageClient();
  const { error } = await client.from('sessions').update({
    revoked_at: new Date().toISOString(), revoked_reason: String(reason || ''),
  }).eq('user_id', String(userId)).is('revoked_at', null);
  if (error) throw normalizeError(error, 'Failed to revoke sessions');
}

function hydrateChallenge(data) {
  if (!data) return null;
  const challenge = {
    _id: data.id, userId: data.user_id, challengeTokenHash: data.challenge_token_hash,
    otpHash: data.otp_hash, remember: data.remember === true,
    failedAttempts: Number(data.failed_attempts || 0), expiresAt: data.expires_at,
    consumedAt: data.consumed_at || null, ipAddress: data.ip_address, userAgent: data.user_agent,
  };
  Object.defineProperty(challenge, 'save', { enumerable: false, value: () => saveChallenge(challenge) });
  return challenge;
}

async function consumeOpenChallenges(userId) {
  const client = getSupabaseStorageClient();
  const { error } = await client.from('otp_challenges').update({ consumed_at: new Date().toISOString() })
    .eq('user_id', String(userId)).is('consumed_at', null);
  if (error) throw normalizeError(error, 'Failed to expire OTP challenges');
}

async function createChallenge(payload) {
  const client = getSupabaseStorageClient();
  const { data, error } = await client.from('otp_challenges').insert({
    user_id: String(payload.userId), challenge_token_hash: payload.challengeTokenHash,
    otp_hash: payload.otpHash, remember: payload.remember === true,
    ip_address: payload.ipAddress || '', user_agent: payload.userAgent || '',
    expires_at: new Date(payload.expiresAt).toISOString(),
  }).select('*').single();
  if (error) throw normalizeError(error, 'Failed to create OTP challenge');
  return hydrateChallenge(data);
}

async function findActiveChallenge(tokenHash) {
  const client = getSupabaseStorageClient();
  const { data, error } = await client.from('otp_challenges').select('*')
    .eq('challenge_token_hash', tokenHash).is('consumed_at', null)
    .gt('expires_at', new Date().toISOString()).limit(1).maybeSingle();
  if (error) throw normalizeError(error, 'Failed to read OTP challenge');
  return hydrateChallenge(data);
}

async function saveChallenge(challenge) {
  const client = getSupabaseStorageClient();
  const { data, error } = await client.from('otp_challenges').update({
    failed_attempts: Number(challenge.failedAttempts || 0),
    consumed_at: challenge.consumedAt ? new Date(challenge.consumedAt).toISOString() : null,
  }).eq('id', String(challenge._id)).select('*').single();
  if (error) throw normalizeError(error, 'Failed to update OTP challenge');
  Object.assign(challenge, hydrateChallenge(data));
  return challenge;
}

async function deleteChallenge(tokenHash) {
  const client = getSupabaseStorageClient();
  const { error } = await client.from('otp_challenges').delete().eq('challenge_token_hash', tokenHash);
  if (error) throw normalizeError(error, 'Failed to delete OTP challenge');
}

async function recordLoginAttempt(row) {
  const client = getSupabaseStorageClient();
  const { error } = await client.from('login_attempts').insert({
    user_id: row.userId ? String(row.userId) : null, username: row.username || '', name: row.name || '',
    email: row.email || '', role: row.role || '', outcome: row.outcome,
    reason: row.reason || '', ip_address: row.ipAddress || '', user_agent: row.userAgent || '',
  });
  if (error) throw normalizeError(error, 'Failed to record login attempt');
}

module.exports = {
  consumeOpenChallenges, createChallenge, createSession, deleteChallenge, findActiveChallenge,
  findActiveSession, recordLoginAttempt, revokeUserSessions, saveChallenge, sessionExists, touchSession,
};
