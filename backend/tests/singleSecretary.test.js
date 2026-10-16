const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const { createSupabaseAccount, findSupabaseAccount } = require('../services/supabaseAccountService');
const payload = { name: 'Secretary', email: 'secretary@gmail.com', username: 'secretary', role: 'secretary', status: 'pending' };

test('the first secretary can be created', async () => {
  client = createFakeSupabase({ users: [] });
  const secretary = await createSupabaseAccount(payload);
  assert.equal(secretary.role, 'secretary');
  assert.equal(client.tables.users.length, 1);
});

for (const status of ['pending', 'active', 'inactive', 'suspended']) {
  test(`an existing ${status} secretary blocks a second account`, async () => {
    client = createFakeSupabase({ users: [{ ...payload, id: 'existing', status }] });
    await assert.rejects(createSupabaseAccount({ ...payload, email: 'other@gmail.com', username: 'other' }), { statusCode: 409 });
    assert.deepEqual(client.writes, []);
  });
}

test('changing another account to secretary cannot bypass the limit', async () => {
  client = createFakeSupabase({ users: [{ ...payload, id: 'existing' }, { ...payload, id: 'teacher', role: 'teacher' }] });
  const account = await findSupabaseAccount('id', 'teacher');
  account.role = 'secretary';
  await assert.rejects(account.save(), { statusCode: 409 });
  assert.deepEqual(client.writes, []);
});

test('the existing secretary can still edit their profile', async () => {
  client = createFakeSupabase({ users: [{ ...payload, id: 'existing' }] });
  const account = await findSupabaseAccount('id', 'existing');
  account.name = 'Updated Secretary';
  await account.save();
  assert.equal(client.tables.users[0].name, 'Updated Secretary');
});

test('database uniqueness conflicts return an understandable error', async () => {
  client = createFakeSupabase({ users: [] });
  client.failures.push({ table: 'users', operation: 'insert', error: { code: '23505', constraint: 'users_single_secretary_unique' } });
  await assert.rejects(createSupabaseAccount(payload), { statusCode: 409, message: 'Only one secretary account is allowed. Manage the existing secretary account instead.' });
});

test('migration enforces the secretary limit in PostgreSQL for inserts and role changes', async () => {
  const { PGlite } = require('@electric-sql/pglite');
  const fs = require('node:fs');
  const path = require('node:path');
  const db = new PGlite();
  try {
    await db.exec("CREATE TABLE public.users (id text PRIMARY KEY, role text, status text);");
    const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/023_single_secretary_account.sql'), 'utf8');
    await db.exec(migration);
    await db.exec("INSERT INTO public.users VALUES ('one', 'secretary', 'inactive'), ('two', 'teacher', 'active');");
    await assert.rejects(db.exec("INSERT INTO public.users VALUES ('three', 'secretary', 'pending');"), { code: '23505' });
    await assert.rejects(db.exec("UPDATE public.users SET role = 'secretary' WHERE id = 'two';"), { code: '23505' });
    await db.exec(migration);
  } finally { await db.close(); }
});

test('migration refuses existing duplicates without deleting accounts', async () => {
  const { PGlite } = require('@electric-sql/pglite');
  const fs = require('node:fs');
  const path = require('node:path');
  const db = new PGlite();
  try {
    await db.exec("CREATE TABLE public.users (id text PRIMARY KEY, role text); INSERT INTO public.users VALUES ('one', 'secretary'), ('two', 'secretary');");
    const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/023_single_secretary_account.sql'), 'utf8');
    await assert.rejects(db.exec(migration), /Multiple secretary accounts exist/);
    await db.exec('ROLLBACK;');
    assert.equal((await db.query('SELECT count(*)::int AS count FROM public.users')).rows[0].count, 2);
  } finally { await db.close(); }
});
