const test = require('node:test');
const assert = require('node:assert/strict');
const { createTeacherAccount, createStudentAccount } = require('../controllers/headteacherController');
for (const [field, value, message] of [
  ['name', 'Teacher123', /numbers are not allowed/],
  ['username', 'teacher123', /must not contain numbers/],
]) {
  test('head teacher creation rejects invalid ' + field + ': ' + value, async () => {
    let failure;
    await createTeacherAccount({
      user: { role: 'headteacher', department: 'Mathematics' },
      body: { name: 'Maria Clara', username: 'maria.clara', email: 'mariaclara@gmail.com', [field]: value },
    }, { status() { throw new Error('Invalid input must not succeed'); } }, (error) => { failure = error; });
    assert.equal(failure?.statusCode, 400);
    assert.match(failure.message, message);
  });
}

test('head teacher student creation validates input before account lookup', async () => {
  let failure;
  await createStudentAccount({
    user: { role: 'headteacher', department: 'Mathematics' },
    body: {
      teacherId: 'managed-teacher',
      name: 'Student123',
      username: 'student123',
      email: 'student@gmail.com',
    },
  }, { status() { throw new Error('Invalid input must not succeed'); } }, (error) => { failure = error; });
  assert.equal(failure?.statusCode, 400);
  assert.match(failure.message, /numbers are not allowed/);
});
