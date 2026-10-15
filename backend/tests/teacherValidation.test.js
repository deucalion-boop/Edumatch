const test = require('node:test');
const assert = require('node:assert/strict');
const { nameError, passwordLengthError } = require('../utils/teacherValidation');
const { assertPasswordMeetsPolicy } = require('../utils/passwordPolicy');
test('teacher names allow international letters and name punctuation, rejecting numbers and excessive length', () => {
  for (const value of ['Maria Clara', 'Anne-Marie', "O'Connor", 'Dela Cruz', 'Mu\u00f1oz', 'Jose\u0301']) assert.equal(nameError(value), '', value);
  for (const value of ['', 'Maria123', '123', '---', 'Anna@', 'A'.repeat(51)]) assert.ok(nameError(value), value);
  assert.equal(nameError('A'.repeat(50)), '');
});
test('teacher passwords accept 8 and 17 characters and reject 7 and 18', () => {
  for (const length of [8, 17]) {
    const password = 'Ab1!' + 'x'.repeat(length - 4);
    assert.equal(passwordLengthError(password), '');
    assert.doesNotThrow(() => assertPasswordMeetsPolicy(password, 17));
  }
  for (const length of [7, 18]) {
    const password = 'Ab1!' + 'x'.repeat(length - 4);
    assert.ok(passwordLengthError(password));
    assert.throws(() => assertPasswordMeetsPolicy(password, 17), { statusCode: 400 });
  }
});
