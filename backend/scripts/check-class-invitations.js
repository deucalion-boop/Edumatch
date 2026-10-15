// Read-only schema checks: GET requests with limit=0 never return roster data.
const path = require('node:path');
require('dotenv').config({ path: [path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../.env.local')], quiet: true });
const { getSupabaseStorageClient } = require('../services/supabaseStorageService');

async function main() {
  const client = getSupabaseStorageClient();
  const checks = [
    ['subjects', 'id,advisory_section_id', '016_advisory_class_invitations.sql'],
    ['class_invitations', 'id,subject_id,teacher_id,token_hash,expires_at,status', '014_create_class_invitations.sql'],
    ['class_registration_students', 'id,invitation_id,teacher_id,full_name,normalized_name,section_id,section_name,registered_at,student_id',
      '014_create_class_invitations.sql and 015_name_based_class_registration.sql'],
  ];
  const results = await Promise.all(checks.map(async ([table, columns, migration]) => {
    const { error, status } = await client.from(table).select(columns).limit(0).abortSignal(AbortSignal.timeout(15000));
    return { table, migration, error, status };
  }));
  for (const { table, migration, error, status } of results) {
    if (!error) {
      console.log(`OK: ${table} required columns are available.`);
      continue;
    }
    process.exitCode = 1;
    const code = error.code || `HTTP ${status}`;
    if (['42P01', '42703', 'PGRST204', 'PGRST205'].includes(error.code)) {
      console.error(`FAIL: ${table} required schema is missing (${code}). Check ${migration}; apply missing migrations in order.`);
    } else {
      console.error(`FAIL: ${table} could not be checked (${code}). Check database connectivity and backend service credentials.`);
    }
  }
  const secretConfigured = (process.env.CLASS_INVITATION_SECRET || process.env.JWT_SECRET || '').length >= 32;
  console.log(`${secretConfigured ? 'OK' : 'FAIL'}: invitation signing secret ${secretConfigured ? 'is configured' : 'requires at least 32 characters'}.`);
  if (!secretConfigured) process.exitCode = 1;
  console.log('These checks do not verify RPC definitions. Complete migrations 014, 015 and 016 are required.');
}

main().catch(() => {
  console.error('Unable to check invitation setup. Check backend Supabase configuration and connectivity.');
  process.exitCode = 1;
});
