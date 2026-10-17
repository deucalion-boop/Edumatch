const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');

test('reusable Admin links enforce department slots, expiry, revocation and input constraints', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE TABLE users(id text PRIMARY KEY, name text, email text UNIQUE, username text UNIQUE,
        password_hash text, role text, status text, department text DEFAULT '', subject text, managed_by text REFERENCES users(id));
      CREATE UNIQUE INDEX one_head_per_department ON users(department) WHERE role='headteacher' AND department <> '';
      CREATE FUNCTION teacher_invitation_valid_email(text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$ SELECT coalesce($1 ~ '^[^@ ]+@[^@ ]+[.][^@ ]+$',false) $$;
      INSERT INTO users(id,name,role,status) VALUES('admin','Admin','admin','active');`);
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/025_admin_registration_links.sql'), 'utf8'));
    await db.exec(`INSERT INTO admin_registration_links(id,issuer_id,role,nonce,token_hash) VALUES
      ('teachers','admin','teacher','a','teacher-hash'),('heads','admin','headteacher','b','head-hash');`);
    const passwordHash = '$2b$12$' + 'a'.repeat(53);
    const register = (hash, username, department = 'Science') => db.query('SELECT register_admin_link($1,$2,$3,$4,$5,$6)', [hash, 'New Staff', `${username}@gmail.com`, username, department, passwordHash]);
    await register('teacher-hash', 'teacher1');
    await register('teacher-hash', 'teacher2');
    assert.equal((await db.query(`SELECT registration_count FROM admin_registration_links WHERE id='teachers'`)).rows[0].registration_count, 2);
    await register('head-hash', 'head1');
    await assert.rejects(register('head-hash', 'head2'), /already has a Head Teacher/);
    await register('head-hash', 'head3', 'English');
    await assert.rejects(register('teacher-hash', 'teacher1'), /duplicate key/);
    await assert.rejects(register('teacher-hash', 'other', 'Invalid'), /Invalid registration/);
    await db.exec(`UPDATE admin_registration_links SET revoked_at=now() WHERE id='teachers'`);
    await assert.rejects(register('teacher-hash', 'teacher4'), /expired, revoked, or invalid/);
    await db.exec(`UPDATE admin_registration_links SET expires_at=now()-interval '1 second' WHERE id='heads'`);
    await assert.rejects(register('head-hash', 'head4', 'MAPEH'), /expired, revoked, or invalid/);
    await db.exec(`DELETE FROM admin_registration_links WHERE id='teachers'`);
    await assert.rejects(register('teacher-hash', 'teacher5'), /expired, revoked, or invalid/);
    assert.equal((await db.query(`SELECT count(*)::int AS total FROM users WHERE role='teacher'`)).rows[0].total, 2);
    const grants = await db.query(`SELECT has_table_privilege('anon','admin_registration_links','SELECT') AS anon, has_table_privilege('authenticated','admin_registration_links','SELECT') AS authenticated`);
    assert.equal(grants.rows[0].anon, false); assert.equal(grants.rows[0].authenticated, false);
    await db.exec(`INSERT INTO admin_registration_links(id,issuer_id,role,nonce,token_hash) VALUES('disabled','admin','teacher','c','disabled-hash'); UPDATE users SET status='inactive' WHERE id='admin';`);
    await assert.rejects(register('disabled-hash', 'teacher6'), /administrator is unavailable/);
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/028_secretary_registration_links.sql'), 'utf8'));
    await db.exec(`INSERT INTO users(id,name,role,status) VALUES('secretary','Secretary','secretary','active');
      INSERT INTO admin_registration_links(id,issuer_id,role,nonce,token_hash) VALUES('secretary-link','secretary','teacher','s','secretary-hash');`);
    await register('secretary-hash','secretary_teacher1');
    await register('secretary-hash','secretary_teacher2');
    assert.equal((await db.query(`SELECT registration_count FROM admin_registration_links WHERE id='secretary-link'`)).rows[0].registration_count,2);
    await db.exec(`UPDATE users SET status='inactive' WHERE id='secretary'`);
    await assert.rejects(register('secretary-hash','secretary_teacher3'), /staff account is unavailable/);
    await db.exec(`UPDATE users SET status='active',role='teacher' WHERE id='secretary'`);
    await assert.rejects(register('secretary-hash','secretary_teacher3'), /staff account is unavailable/);
    await db.exec(`DELETE FROM admin_registration_links WHERE id='secretary-link'`);
    await assert.rejects(register('secretary-hash','secretary_teacher3'), /expired, revoked, or invalid/);
    assert.equal((await db.query(`SELECT count(*)::int AS total FROM users WHERE username LIKE 'secretary_teacher%'`)).rows[0].total,2);
  } finally { await db.close(); }
});
