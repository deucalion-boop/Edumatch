const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
process.env.STORAGE_URL_SIGNING_SECRET = 'user-management-test-signing-secret';
const { verifyStorageAccessToken } = require('../utils/fileStorage');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
require('../services/gmailService').sendEmailViaGmail = async () => ({ sent: true });
const profileUploads = [];
const uploadedProfilePath = 'uploads/profile-images/updated-profile.png';
require('../services/storageService').uploadFile = async (options) => {
  profileUploads.push(options);
  return { storedPath: uploadedProfilePath };
};
const controller = require('../controllers/adminController');
const { createSupabaseAccount, findSupabaseAccountByUsername } = require('../services/supabaseAccountService');
const id = 'b6d565d69a7f4db1bd6f1ebfcc1a6444';
const account = { id, name: 'Test user', email: 'user@gmail.com', username: 'user', role: 'secretary', status: 'active' };
const newTeacher = {
  name: 'New Teacher', email: 'new.teacher@gmail.com', username: 'new.teacher',
  role: 'teacher', department: 'Science',
};
async function invoke(action, req = {}) {
  let body;
  await controller[action]({
    params: { id },
    body: {},
    user: { _id: 'admin', role: 'admin' },
    protocol: 'http',
    get: () => 'localhost',
    ...req,
  }, {
    status() { return this; }, json(value) { body = value; return this; },
  }, (error) => { throw error; });
  return body;
}
test('admin reads Supabase profiles with non-ObjectId IDs for every role', async () => {
  for (const role of ['secretary', 'headteacher', 'admin', 'teacher', 'student']) {
    client = createFakeSupabase({ users: [{ ...account, role }] });
    const result = await invoke('getUserById');
    assert.equal(result.user.id, id);
    assert.equal(result.user.role, role);
    assert.equal(result.user.password, '');
  }
});
test('admin teacher profiles show the current assigned section, including inactive sections, without writing data', async () => {
  client = createFakeSupabase({
    users: [{ ...account, role: 'teacher', department: 'Science', advisory_section_id: 'sincerity' }],
    sections: [
      { id: 'sincerity', name: 'Sincerity', is_active: true },
      { id: 'unity', name: 'Unity', is_active: false },
    ],
  });
  const first = await invoke('getUserById');
  assert.equal(first.user.advisorySectionId, 'sincerity');
  assert.deepEqual(first.user.advisorySection, { id: 'sincerity', name: 'Sincerity' });
  client.tables.users[0].advisory_section_id = 'unity';
  const reassigned = await invoke('getUserById');
  assert.equal(reassigned.user.advisorySectionId, 'unity');
  assert.deepEqual(reassigned.user.advisorySection, { id: 'unity', name: 'Unity' });
  client.tables.users[0].advisory_section_id = null;
  const cleared = await invoke('getUserById');
  assert.equal(cleared.user.advisorySectionId, '');
  assert.equal(cleared.user.advisorySection, null);
  assert.deepEqual(client.writes, []);
});
test('admin teacher profiles tolerate missing section references and surface section lookup failures', async () => {
  client = createFakeSupabase({
    users: [{ ...account, role: 'teacher', advisory_section_id: 'missing-section' }], sections: [],
  });
  const missing = await invoke('getUserById');
  assert.equal(missing.user.advisorySectionId, 'missing-section');
  assert.equal(missing.user.advisorySection, null);
  client.failures.push({ table: 'sections', operation: 'select', error: { message: 'Section lookup unavailable' } });
  await assert.rejects(invoke('getUserById'), { statusCode: 500, message: 'Section lookup unavailable' });
  assert.deepEqual(client.writes, []);
});
test('admin updates Supabase account and permits its existing username', async () => {
  client = createFakeSupabase({ users: [account] });
  await invoke('updateUser', { body: { name: 'Updated', username: 'user' } });
  assert.equal(client.tables.users[0].name, 'Updated');
  client.tables.users.push({ ...account, id: 'other', email: 'other@gmail.com', username: 'other' });
  await assert.rejects(invoke('updateUser', { body: { email: 'other@gmail.com' } }), { statusCode: 409 });
  await assert.rejects(invoke('updateUser', { body: { username: 'other' } }), { statusCode: 409 });
});
test('missing Supabase profile returns 404', async () => {
  client = createFakeSupabase({ users: [] });
  await assert.rejects(invoke('getUserById'), { statusCode: 404 });
});
test('delete verifies admin password and deletes only the requested Supabase account', async () => {
  client = createFakeSupabase({ users: [account, { ...account, id: 'admin', role: 'admin', password_hash: await bcrypt.hash('Password123!', 4) }] });
  await assert.rejects(invoke('deleteUser', { user: { _id: 'admin', role: 'admin' }, body: { currentPassword: 'wrong' } }), { statusCode: 401 });
  assert.equal(client.tables.users.length, 2);
  await invoke('deleteUser', { user: { _id: 'admin', role: 'admin' }, body: { currentPassword: 'Password123!' } });
  assert.deepEqual(client.tables.users.map((row) => row.id), ['admin']);
});

test('secretary can manage instructional roles but cannot manage secretary or admin accounts', async () => {
  client = createFakeSupabase({ users: [{ ...account, role: 'teacher', department: 'Science' }] });
  await invoke('updateUser', {
    user: { _id: 'secretary-id', role: 'secretary' },
    body: { name: 'Updated teacher' },
  });
  assert.equal(client.tables.users[0].name, 'Updated teacher');

  client = createFakeSupabase({ users: [{ ...account, role: 'secretary' }] });
  await assert.rejects(invoke('updateUser', {
    user: { _id: 'secretary-id', role: 'secretary' },
    body: { name: 'Not allowed' },
  }), { statusCode: 403 });
});

test('admin can update teacher and student accounts directly', async () => {
  for (const role of ['teacher', 'student']) {
    client = createFakeSupabase({ users: [{ ...account, role, department: role === 'teacher' ? 'Science' : '' }] });
    await invoke('updateUser', { body: { name: `Updated ${role}` } });
    assert.equal(client.tables.users[0].name, `Updated ${role}`);
  }
});

test('admin cannot upload, replace, or clear another account profile picture for any role', async (t) => {
  const attempts = [
    { label: 'uploaded picture', file: { originalname: 'replacement.png', mimetype: 'image/png', buffer: Buffer.from('image') } },
    { label: 'replacement path', body: { profileImage: 'uploads/replacement.png' } },
    { label: 'empty clear', body: { profileImage: '' } },
    { label: 'null clear', body: { profileImage: null } },
    { label: 'explicit undefined', body: { profileImage: undefined } },
  ];
  for (const role of ['secretary', 'headteacher', 'admin', 'teacher', 'student']) {
    for (const attempt of attempts) {
      await t.test(`${role}: ${attempt.label}`, async () => {
        const original = { ...account, role, profile_image: 'uploads/original-profile.png' };
        client = createFakeSupabase({ users: [original] });
        profileUploads.length = 0;
        await assert.rejects(invoke('updateUser', {
          ...(attempt.file ? { file: attempt.file } : {}),
          body: {
            name: 'Changed name', email: 'changed.user@gmail.com', username: 'changed.user',
            status: 'inactive', ...attempt.body,
          },
        }), { statusCode: 403, message: 'Only users can change their own profile picture' });
        assert.deepEqual(profileUploads, [], 'rejected pictures must never reach storage');
        assert.deepEqual(client.writes, [], 'other submitted fields must not be saved');
        assert.deepEqual(client.tables.users, [original]);
      });
    }
  }
});

test('profile picture changes require an authenticated account ID', async (t) => {
  for (const attempt of [
    { label: 'upload', file: { originalname: 'replacement.png', buffer: Buffer.from('image') } },
    { label: 'direct field', body: { profileImage: '' } },
  ]) {
    await t.test(attempt.label, async () => {
      const original = { ...account, role: 'admin', profile_image: 'uploads/original-profile.png' };
      client = createFakeSupabase({ users: [original] });
      profileUploads.length = 0;
      await assert.rejects(invoke('updateUser', {
        user: { role: 'admin' },
        ...(attempt.file ? { file: attempt.file } : {}),
        body: { name: 'Changed name', ...attempt.body },
      }), { statusCode: 403, message: 'Only users can change their own profile picture' });
      assert.deepEqual(profileUploads, []);
      assert.deepEqual(client.writes, []);
      assert.deepEqual(client.tables.users, [original]);
    });
  }
});

test('managed account edits preserve existing profile pictures for every manageable role', async (t) => {
  for (const role of ['secretary', 'headteacher', 'teacher', 'student']) {
    await t.test(role, async () => {
      const profileImage = 'uploads/original-profile.png';
      client = createFakeSupabase({ users: [{ ...account, role, profile_image: profileImage }] });
      profileUploads.length = 0;
      const result = await invoke('updateUser', { body: { name: `Updated ${role}` } });
      assert.equal(client.tables.users[0].name, `Updated ${role}`);
      assert.equal(client.tables.users[0].profile_image, profileImage);
      const token = new URL(result.user.profileImage).searchParams.get('token');
      assert.equal(verifyStorageAccessToken(token).storedPath, profileImage);
      assert.deepEqual(profileUploads, []);
    });
  }
});

test('secretary cannot upload or clear instructional account profile pictures', async (t) => {
  for (const role of ['headteacher', 'teacher', 'student']) {
    for (const attempt of [
      { label: 'upload', file: { originalname: 'replacement.png', buffer: Buffer.from('image') } },
      { label: 'clear', body: { profileImage: '' } },
    ]) {
      await t.test(`${role}: ${attempt.label}`, async () => {
        const original = { ...account, role, profile_image: 'uploads/original-profile.png' };
        client = createFakeSupabase({ users: [original] });
        profileUploads.length = 0;
        await assert.rejects(invoke('updateUser', {
          user: { _id: 'secretary-id', role: 'secretary' },
          ...(attempt.file ? { file: attempt.file } : {}),
          body: { name: 'Changed name', ...attempt.body },
        }), { statusCode: 403, message: 'Only users can change their own profile picture' });
        assert.deepEqual(profileUploads, []);
        assert.deepEqual(client.writes, []);
        assert.deepEqual(client.tables.users, [original]);
      });
    }
  }
});

test('admin can still upload their own profile picture through account update', async () => {
  client = createFakeSupabase({ users: [{ ...account, role: 'admin', profile_image: 'uploads/original-profile.png' }] });
  profileUploads.length = 0;
  const file = { originalname: 'self.png', mimetype: 'image/png', buffer: Buffer.from('image') };
  const result = await invoke('updateUser', { user: { _id: id, role: 'admin' }, file });
  assert.equal(profileUploads.length, 1);
  assert.equal(profileUploads[0].file, file);
  assert.equal(profileUploads[0].folder, `profile-images/admin-managed/${id}`);
  assert.equal(client.tables.users[0].profile_image, uploadedProfilePath);
  const token = new URL(result.user.profileImage).searchParams.get('token');
  assert.equal(verifyStorageAccessToken(token).storedPath, uploadedProfilePath);
  assert.equal(client.writes.length, 1);
});

test('admin self profile edits preserve their picture and other admin accounts remain protected', async () => {
  const original = { ...account, role: 'admin', profile_image: 'uploads/original-profile.png' };
  client = createFakeSupabase({ users: [original] });
  profileUploads.length = 0;
  await assert.rejects(invoke('updateUser', { body: { name: 'Not allowed' } }), {
    statusCode: 403, message: 'Forbidden: you cannot manage accounts with this role',
  });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(client.tables.users, [original]);

  const result = await invoke('updateUser', {
    user: { _id: id, role: 'admin' },
    body: {
      name: 'Updated self', email: 'updated.self@gmail.com', username: 'updated.self',
    },
  });
  assert.equal(result.user.name, 'Updated self');
  assert.equal(result.user.email, 'updated.self@gmail.com');
  assert.equal(result.user.username, 'updated.self');
  assert.equal(client.tables.users[0].profile_image, original.profile_image);
  assert.deepEqual(profileUploads, []);
});

test('admin self picture uploads cannot bypass restrictions on managed account fields', async (t) => {
  for (const [field, value] of Object.entries({
    password: 'Password123!', role: 'teacher', status: 'suspended', subject: 'Biology',
    department: 'Science', strand: 'STEM', gradeLevel: 'Grade 10',
  })) {
    await t.test(field, async () => {
      const original = { ...account, role: 'admin', profile_image: 'uploads/original-profile.png' };
      client = createFakeSupabase({ users: [original] });
      profileUploads.length = 0;
      await assert.rejects(invoke('updateUser', {
        user: { _id: id, role: 'admin' },
        file: { originalname: 'self.png', mimetype: 'image/png', buffer: Buffer.from('image') },
        body: { name: 'Changed self', [field]: value },
      }), { statusCode: 403, message: 'Forbidden: you cannot manage accounts with this role' });
      assert.deepEqual(profileUploads, [], 'forbidden self edits must not upload a picture');
      assert.deepEqual(client.writes, [], 'forbidden self edits must not save any submitted fields');
      assert.deepEqual(client.tables.users, [original]);
    });
  }
});

test('admin and secretary create directly managed roles with the selected role and scoped fields', async () => {
  client = createFakeSupabase({ users: [] });
  const studentResult = await invoke('createUser', {
    user: { _id: 'admin', role: 'admin' },
    body: {
      name: 'Student User', email: 'student.user@gmail.com', username: 'student.user',
      role: 'student', gradeLevel: 'Grade 10', strand: 'STEM',
    },
  });
  assert.equal(studentResult.user.role, 'student');
  assert.equal(studentResult.user.gradeLevel, 'Grade 10');
  assert.equal(client.tables.users[0].role, 'student');
  assert.equal(client.tables.users[0].force_password_change, true);
  assert.equal(
    await bcrypt.compare(studentResult.invite.generatedPassword, client.tables.users[0].password_hash),
    true,
  );

  const teacherResult = await invoke('createUser', {
    user: { _id: 'secretary-id', role: 'secretary' },
    body: {
      name: 'Teacher User', email: 'teacher.user@gmail.com', username: 'teacher.user',
      role: 'teacher', department: 'Science', subject: 'Biology',
    },
  });
  assert.equal(teacherResult.user.role, 'teacher');
  assert.equal(teacherResult.user.department, 'Science');
  assert.equal(teacherResult.user.subject, 'Biology');
  assert.equal(client.tables.users[1].role, 'teacher');
});

test('secretary updates assign a student to the selected section adviser', async () => {
  client = createFakeSupabase({
    users: [
      {
        ...account, id: 'student-1', name: 'Student One', email: 'student.one@gmail.com',
        username: 'student.one', role: 'student', grade_level: 'Grade 10', section_id: 'sincerity', managed_by: 'teacher-1',
      },
      {
        ...account, id: 'teacher-1', name: 'Teacher One', email: 'teacher.one@gmail.com',
        username: 'teacher.one', role: 'teacher', department: 'Science', status: 'active', advisory_section_id: 'sincerity',
      },
      {
        ...account, id: 'teacher-2', name: 'Teacher Two', email: 'teacher.two@gmail.com',
        username: 'teacher.two', role: 'teacher', department: 'Science', status: 'active', advisory_section_id: 'unity',
      },
    ],
    sections: [
      { id: 'sincerity', name: 'Sincerity', is_active: true },
      { id: 'unity', name: 'Unity', is_active: true },
    ],
  });

  const result = await invoke('updateUser', {
    user: { _id: 'secretary-id', role: 'secretary' },
    params: { id: 'student-1' },
    body: { role: 'student', gradeLevel: 'Grade 10', sectionId: 'unity' },
  });
  assert.equal(result.user.role, 'student');
  assert.equal(result.user.gradeLevel, 'Grade 10');

  const updated = client.tables.users.find((row) => row.id === 'student-1');
  assert.equal(updated.section_id, 'unity');
  assert.equal(updated.managed_by, 'teacher-2');
  assert.equal(updated.enrollment.teacherId, 'teacher-2');
  assert.equal(updated.enrollment.status, 'approved');
});

test('account creation rejects existing usernames before writing for admin and secretary', async (t) => {
  for (const action of ['createUser', 'createAndInviteUser']) {
    for (const role of ['admin', 'secretary']) {
      for (const username of ['user', ' UsEr ']) {
        await t.test(`${action}: ${role}, ${JSON.stringify(username)}`, async () => {
          client = createFakeSupabase({ users: [account] });
          await assert.rejects(invoke(action, {
            user: { _id: `${role}-id`, role },
            body: { ...newTeacher, username },
          }), { statusCode: 409, message: 'Username already exists' });
          assert.deepEqual(client.writes, []);
          assert.deepEqual(client.tables.users, [account]);
        });
      }
    }
  }
});

test('updating a username rejects another account regardless of casing and permits its own casing change', async () => {
  const other = { ...account, id: 'other-id', email: 'other@gmail.com', username: 'OtherUser' };
  client = createFakeSupabase({ users: [account, other] });
  await assert.rejects(invoke('updateUser', {
    body: { username: ' oThErUsEr ' },
  }), { statusCode: 409, message: 'Username already exists' });
  assert.deepEqual(client.writes, []);
  assert.deepEqual(client.tables.users, [account, other]);

  const result = await invoke('updateUser', { body: { username: ' UsEr ' } });
  assert.equal(result.user.username, 'UsEr');
  assert.equal(client.tables.users[0].username, 'UsEr');
  assert.equal(client.tables.users[1].username, 'OtherUser');
});

test('username lookup is case insensitive and matches wildcard and regex characters literally', async (t) => {
  for (const username of [
    'alpha%beta', 'alpha_beta', 'alpha*beta', 'alpha\\beta', 'alpha.beta',
    'alpha[+]?beta(2){3}|^$',
  ]) {
    await t.test(JSON.stringify(username), async () => {
      client = createFakeSupabase({ users: [
        { ...account, id: 'decoy-id', username: 'alphaXbeta' },
        { ...account, id: 'prefix-id', username: `prefix${username}` },
        { ...account, id: 'suffix-id', username: `${username}suffix` },
        { ...account, username },
      ] });
      const match = await findSupabaseAccountByUsername(` ${username.toUpperCase()} `);
      assert.equal(match.id, id);
      assert.equal(match.username, username);
      client.tables.users = client.tables.users.filter((row) => row.id !== id);
      assert.equal(await findSupabaseAccountByUsername(username), null);
      assert.deepEqual(client.writes, []);
    });
  }
});

test('username lookup follows lowercase uniqueness for distinct Greek sigma forms', async () => {
  const finalSigma = { ...account, id: 'final-sigma-id', username: '\u03c2' };
  const capitalSigma = { ...account, id: 'capital-sigma-id', username: '\u03a3' };
  client = createFakeSupabase({ users: [finalSigma, capitalSigma] });
  for (const username of ['\u03c3', '\u03a3']) {
    const match = await findSupabaseAccountByUsername(username);
    assert.equal(match.id, capitalSigma.id);
    assert.equal(match.username, capitalSigma.username);
  }
  const match = await findSupabaseAccountByUsername('\u03c2');
  assert.equal(match.id, finalSigma.id);
  assert.equal(match.username, finalSigma.username);
  assert.deepEqual(client.writes, []);
});

test('username lookup requires the exact literal star count and positions with mixed wildcards', async (t) => {
  const cases = [
    { username: '%*_', decoys: ['%x_', '%%_', '%**', '*%_'] },
    { username: 'alpha**beta', decoys: ['alphaXXbeta', 'alpha*Xbeta', 'alpha***eta', 'alph*a*beta'] },
  ];
  for (const { username, decoys } of cases) {
    await t.test(JSON.stringify(username), async () => {
      client = createFakeSupabase({ users: [
        ...decoys.map((decoy, index) => ({ ...account, id: `decoy-${index}`, username: decoy })),
        { ...account, username },
      ] });
      const match = await findSupabaseAccountByUsername(username.toUpperCase());
      assert.equal(match.id, id);
      assert.equal(match.username, username);
      client.tables.users = client.tables.users.filter((row) => row.id !== id);
      assert.equal(await findSupabaseAccountByUsername(username), null);
      assert.deepEqual(client.writes, []);
    });
  }
});

test('create and update reject usernames consisting only of whitespace without writing', async (t) => {
  for (const action of ['createUser', 'createAndInviteUser', 'updateUser']) {
    await t.test(action, async () => {
      client = createFakeSupabase({ users: [account] });
      await assert.rejects(invoke(action, {
        body: { ...newTeacher, username: ' \t\n ' },
      }), { statusCode: 400, message: 'Username must be between 1 and 50 characters' });
      assert.deepEqual(client.writes, []);
      assert.deepEqual(client.tables.users, [account]);
    });
  }
});

test('account service rejects blank and overlong usernames before inserting', async (t) => {
  for (const username of [' \t\n ', 'u'.repeat(51)]) {
    await t.test(`length ${username.trim().length}`, async () => {
      client = createFakeSupabase({ users: [] });
      await assert.rejects(createSupabaseAccount({ ...newTeacher, username }), {
        statusCode: 400, message: 'Username must be between 1 and 50 characters',
      });
      assert.deepEqual(client.writes, []);
      assert.deepEqual(client.tables.users, []);
    });
  }
});

test('concurrent username and email conflicts return friendly 409 errors and retain PostgreSQL codes', async (t) => {
  const conflicts = [
    { constraint: 'users_username_lower_unique', field: 'username', message: 'Username already exists' },
    { constraint: 'users_email_lower_unique', field: 'email', message: 'Email already exists' },
    { constraint: 'users_other_unique', field: 'other', message: 'An account with these details already exists' },
  ];
  for (const action of ['createUser', 'createAndInviteUser', 'updateUser']) {
    for (const conflict of conflicts) {
      await t.test(`${action}: ${conflict.field}`, async () => {
        const initialUsers = action === 'updateUser' ? [account] : [];
        client = createFakeSupabase({ users: initialUsers });
        client.failures.push({
          table: 'users', operation: action === 'updateUser' ? 'upsert' : 'insert',
          error: {
            code: '23505',
            message: `duplicate key value violates unique constraint "${conflict.constraint}"`,
            details: `Key (lower(${conflict.field}))=(conflicting-value) already exists.`,
          },
        });
        await assert.rejects(invoke(action, {
          body: action === 'updateUser' ? { username: newTeacher.username } : { ...newTeacher },
        }), { statusCode: 409, code: '23505', message: conflict.message });
        assert.equal(client.failures.length, 0, 'the database write must reach the injected race conflict');
        assert.deepEqual(client.writes, []);
        assert.deepEqual(client.tables.users, initialUsers);
      });
    }
  }
});


