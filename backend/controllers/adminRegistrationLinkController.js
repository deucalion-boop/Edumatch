const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { getSupabaseStorageClient } = require('../services/supabaseStorageService');
const { DEPARTMENTS } = require('../constants/userRoles');
const { assertPasswordMeetsPolicy } = require('../utils/passwordPolicy');
const { assertAccountEmail } = require('../utils/emailPolicy');
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
const tokenFor = nonce => `staff_${nonce}.${crypto.createHmac('sha256', process.env.JWT_SECRET).update(`admin-registration:${nonce}`).digest('hex')}`;
const wrap = fn => async (req, res, next) => { try { await fn(req, res); } catch (error) { next(error); } };
function checked(result) {
  if (result.error) throw Object.assign(new Error(result.error.code === '23505' ? 'Email, username, or department is already occupied.' : result.error.message), { statusCode: result.error.code === '23505' ? 409 : 400 });
  return result.data;
}
async function available(role) {
  if (role === 'teacher') return DEPARTMENTS;
  const users = checked(await getSupabaseStorageClient().from('users').select('department').eq('role', 'headteacher'));
  return DEPARTMENTS.filter(department => !users.some(user => user.department === department));
}
async function resolve(token) {
  const db = getSupabaseStorageClient();
  const row = checked(await db.from('admin_registration_links').select('*').eq('token_hash', hash(token)).maybeSingle());
  if (!row || row.revoked_at || Date.parse(row.expires_at) <= Date.now()) throw Object.assign(new Error('Registration link expired, revoked, or invalid.'), { statusCode: 410 });
  const issuer = checked(await db.from('users').select('id').eq('id', row.issuer_id).eq('role', 'admin').eq('status', 'active').maybeSingle());
  if (!issuer) throw Object.assign(new Error('Inviting administrator is unavailable.'), { statusCode: 410 });
  return row;
}
exports.list = wrap(async (req, res) => {
  const rows = checked(await getSupabaseStorageClient().from('admin_registration_links').select('*').eq('issuer_id', req.user._id).order('created_at', { ascending: false }));
  const base = String(process.env.APP_BASE_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  res.json({ links: rows.map(row => ({ id: row.id, role: row.role, expiresAt: row.expires_at, revokedAt: row.revoked_at, registrationCount: row.registration_count, inviteLink: `${base}/auth/invite/${tokenFor(row.nonce)}` })) });
});
exports.create = wrap(async (req, res) => {
  if (!['teacher', 'headteacher'].includes(req.body.role)) return res.status(400).json({ message: 'Choose Teacher or Head Teacher.' });
  const nonce = crypto.randomBytes(24).toString('hex');
  const row = checked(await getSupabaseStorageClient().from('admin_registration_links').insert({ issuer_id: req.user._id, role: req.body.role, nonce, token_hash: hash(tokenFor(nonce)) }).select('*').single());
  const base = String(process.env.APP_BASE_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  res.status(201).json({ invite: { inviteLink: `${base}/auth/invite/${tokenFor(nonce)}`, inviteExpiresAt: row.expires_at } });
});
exports.revoke = wrap(async (req, res) => {
  checked(await getSupabaseStorageClient().from('admin_registration_links').update({ revoked_at: new Date().toISOString() }).eq('id', req.params.id).eq('issuer_id', req.user._id));
  res.json({ message: 'Link revoked. Registered accounts are unchanged.' });
});
exports.remove = wrap(async (req, res) => {
  checked(await getSupabaseStorageClient().from('admin_registration_links').delete().eq('id', req.params.id).eq('issuer_id', req.user._id));
  res.json({ message: 'Link removed. Registered accounts are unchanged.' });
});
exports.validate = wrap(async (req, res) => {
  const link = await resolve(req.params.token);
  res.json({ invite: { role: link.role, selfRegistration: true, expiresAt: link.expires_at, availableDepartments: await available(link.role), multipleAccounts: true } });
});
exports.complete = wrap(async (req, res) => {
  const link = await resolve(req.params.token);
  if (!req.body.password || req.body.password !== req.body.confirmPassword) return res.status(400).json({ message: 'Passwords must match.' });
  assertPasswordMeetsPolicy(req.body.password);
  const email = assertAccountEmail(req.body.email, link.role);
  const department = req.body.department;
  if (!(await available(link.role)).includes(department)) return res.status(409).json({ message: 'Department is unavailable. Refresh and choose another department.' });
  const id = checked(await getSupabaseStorageClient().rpc('register_admin_link', {
    p_hash: hash(req.params.token), p_name: req.body.fullName, p_email: email,
    p_username: req.body.username, p_department: department, p_password_hash: await bcrypt.hash(req.body.password, 12),
  }));
  res.status(201).json({ user: { id }, message: 'Account created. The link remains available until it expires or is revoked.' });
});
