const test = require('node:test');
const assert = require('node:assert/strict');
const { createTeacherAccount } = require('../controllers/headteacherController');
for (const [field, value, message] of [
  ['name', 'Teacher123', /numbers are not allowed/],
  ['username', 'teacher123', /must not contain numbers/],
  ['contactNumber', '09abc123456', /Philippine mobile/],
  ['contactNumber', '0912345678', /Philippine mobile/],
]) {
  test('head teacher creation rejects invalid ' + field + ': ' + value, async () => {
    let failure;
    await createTeacherAccount({
      user: { role: 'headteacher', department: 'Mathematics' },
      body: { name: 'Maria Clara', username: 'maria.clara', email: 'mariaclara@gmail.com', contactNumber: '09123456789', [field]: value },
    }, { status() { throw new Error('Invalid input must not succeed'); } }, (error) => { failure = error; });
    assert.equal(failure?.statusCode, 400);
    assert.match(failure.message, message);
  });
}
