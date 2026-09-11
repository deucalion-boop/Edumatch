const test = require('node:test');
const assert = require('node:assert/strict');
const { nameError, phoneError, passwordLengthError } = require('../utils/teacherValidation');
const { assertPasswordMeetsPolicy } = require('../utils/passwordPolicy');
test('teacher names allow international letters and name punctuation, rejecting numbers and excessive length', () => {
  for (const value of ['Maria Clara', 'Anne-Marie', "O'Connor", 'Dela Cruz', 'Mu\u00f1oz', 'Jose\u0301']) assert.equal(nameError(value), '', value);
  for (const value of ['', 'Maria123', '123', '---', 'Anna@', 'A'.repeat(51)]) assert.ok(nameError(value), value);
  assert.equal(nameError('A'.repeat(50)), '');
});
test('teacher phone accepts local or international Philippine mobiles, rejecting malformed numbers', () => {
  for (const value of ['09123456789', '+639123456789', '']) assert.equal(phoneError(value), '');
  for (const value of ['0912345678', '091234567890', '+638123456789', '+63912345678', '9123456789', 'abc09123456789']) assert.ok(phoneError(value), value);
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
