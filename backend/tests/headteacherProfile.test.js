const test = require('node:test');
const assert = require('node:assert/strict');
const accounts = require('../services/supabaseAccountService');
const storage = require('../services/storageService');
let duplicate = null;
accounts.findSupabaseAccountByUsername = async () => duplicate;
storage.uploadFile = async () => ({ storedPath: 'https://example.com/photo.png' });
const controller = require('../controllers/headteacherProfileController');
function fixture(body = {}) {
  let saves = 0;
  const req = { body, user: { _id: 'head', name: 'Old Name', username: 'headteacher', email: 'head@example.com', role: 'headteacher', department: 'Science', save: async () => { saves++; } } };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
  return { req, res, saves: () => saves };
}
test('saves own profile while ignoring privileged and email fields', async () => {
  duplicate = null;
  const f = fixture({ name: 'New Name', username: 'new.name', email: 'other@example.com', role: 'admin', department: 'English' });
  await controller.update(f.req, f.res, error => { throw error; });
  assert.equal(f.saves(), 1);
  assert.equal(f.res.data.user.name, 'New Name');
  assert.equal(f.res.data.user.username, 'new.name');
  assert.equal(f.res.data.user.role, 'headteacher');
  assert.equal(f.res.data.user.department, 'Science');
  assert.equal(f.res.data.user.email, 'head@example.com');
});
test('rejects invalid usernames without saving', async () => {
  const f = fixture({ name: 'New Name', username: 'bad username' });
  await controller.update(f.req, f.res, error => { throw error; });
  assert.equal(f.res.statusCode, 400); assert.equal(f.saves(), 0);
});
test('rejects duplicate usernames without saving', async () => {
  duplicate = { _id: 'other' };
  const f = fixture({ name: 'New Name', username: 'taken' });
  await controller.update(f.req, f.res, error => { throw error; });
  assert.equal(f.res.statusCode, 409); assert.equal(f.saves(), 0);
  duplicate = null;
});
test('uploads a profile image and returns the saved image', async () => {
  const f = fixture({ name: 'New Name', username: 'headteacher' });
  f.req.file = { originalname: 'photo.png' };
  await controller.update(f.req, f.res, error => { throw error; });
  assert.equal(f.saves(), 1);
  assert.equal(f.res.data.user.profileImage, 'https://example.com/photo.png');
});
