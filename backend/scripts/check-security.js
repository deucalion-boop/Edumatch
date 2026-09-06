// Read-only: checks configuration and optional Supabase metadata/HEAD requests.
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { securityConfigurationErrors } = require('../utils/securityConfig');

dotenv.config({ path: [path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../.env.local')], quiet: true });

const tables = [
  'users', 'sessions', 'otp_challenges', 'login_attempts', 'sections', 'lessons',
  'assessments', 'admin_messages', 'notifications', 'audit_logs', 'subjects',
  'subject_enrollments', 'attendance_records', 'submissions', 'recommendations',
  'app_settings', 'export_approval_requests',
];

function inspectFrontendSecrets() {
  const frontendDir = path.resolve(__dirname, '../../frontend');
  const secretValues = ['SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET', 'STORAGE_URL_SIGNING_SECRET', 'ADMIN_PASSWORD', 'MAIL_API_KEY', 'AI_API_KEY']
    .map((key) => process.env[key]).filter((value) => value && value.length >= 8);
  const issues = [];
  for (const name of fs.readdirSync(frontendDir).filter((entry) => /^\.env(?:\.|$)/.test(entry))) {
    const file = path.join(frontendDir, name);
    if (!fs.statSync(file).isFile()) continue;
    const entries = dotenv.parse(fs.readFileSync(file));
    for (const [key, value] of Object.entries(entries)) {
      if (!key.startsWith('VITE_')) continue;
      let serviceRoleToken = false;
      try { serviceRoleToken = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch { /* Not a JWT. */ }
      if (value.startsWith('sb_secret_') || serviceRoleToken || secretValues.includes(value)) {
        issues.push(`frontend/${name}: ${key} exposes a backend credential; remove it and rotate the exposed credential`);
      }
    }
  }
  return issues;
}

async function checkLive() {
  const base = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  const publicKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || '');
  if (!base || !serviceKey || !publicKey) throw new Error('Live checks require SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_PUBLISHABLE_KEY');
  const headers = (key) => ({ apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) });
  const request = (url, key, options = {}) => fetch(url, {
    ...options, headers: headers(key), signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  const failures = [];
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || 'files').trim();
  const bucketResponse = await request(`${base}/storage/v1/bucket/${encodeURIComponent(bucket)}`, serviceKey);
  if (!bucketResponse.ok) failures.push(`Storage bucket metadata could not be checked (HTTP ${bucketResponse.status})`);
  else {
    const metadata = await bucketResponse.json();
    if (metadata.public !== false) failures.push('Application storage bucket is public');
    else console.log('PASS: application storage bucket is private');
  }
  // HEAD retrieves no student records, hashes, or tokens. A denied read alone
  // cannot prove RLS flags or every role/operation; run security_audit.sql too.
  for (const table of tables) {
    const column = table === 'app_settings' ? 'key' : 'id';
    const url = `${base}/rest/v1/${table}?select=${column}&limit=0`;
    const privileged = await request(url, serviceKey, { method: 'HEAD' });
    if (!privileged.ok) {
      failures.push(`${table}: backend table check failed (HTTP ${privileged.status}); check migrations and grants`);
      continue;
    }
    const publicResponse = await request(url, publicKey, { method: 'HEAD' });
    if (![401, 403].includes(publicResponse.status)) {
      failures.push(`${table}: browser role was not denied at the table-grant level (HTTP ${publicResponse.status})`);
    } else console.log(`PASS: ${table} exists and denies public-key table access`);
  }
  return failures;
}

async function main() {
  const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
  const errors = [
    ...securityConfigurationErrors(process.env, { production }),
    ...inspectFrontendSecrets(),
  ];
  if (!errors.length) console.log(`PASS: ${production ? 'production' : 'development'} security configuration checks`);
  for (const error of errors) console.log(`FAIL: ${error}`);
  const liveFailures = process.argv.includes('--live') ? await checkLive() : [];
  for (const error of liveFailures) console.log(`FAIL: ${error}`);
  if (process.argv.includes('--live')) console.log('Database RLS flags, authenticated-role grants, and storage policies still require the read-only security_audit.sql review.');
  process.exitCode = errors.length || liveFailures.length ? 1 : 0;
}

main().catch(() => {
  console.error('Security check could not complete. Check service connectivity and credentials; no credential values were logged.');
  process.exitCode = 1;
});
