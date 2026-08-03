const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getPasswordValidationErrors } = require('../utils/passwordPolicy');
const { isAllowedCommonAttachment, isAllowedLessonFile, isAllowedProfileImage, isDocumentOrImageMime } = require('../utils/uploadMiddleware');

test('password policy enforces 8 to 16 characters', () => {
  assert.deepEqual(getPasswordValidationErrors('SecurePass123'), []);
  assert.match(getPasswordValidationErrors('A1short')[0], /at least 8/i);
  assert.match(getPasswordValidationErrors(`A1${'x'.repeat(15)}`)[0], /no more than 16/i);
});

test('upload metadata rejects generic and mismatched content types', () => {
  assert.equal(isAllowedLessonFile({ originalname: 'lesson.pdf', mimetype: 'application/pdf' }), true);
  assert.equal(isAllowedLessonFile({ originalname: 'lesson.pdf', mimetype: 'application/octet-stream' }), false);
  assert.equal(isAllowedProfileImage({ originalname: 'photo.jpg', mimetype: 'image/svg+xml' }), false);
  assert.equal(isAllowedProfileImage({ originalname: 'photo.jpg', mimetype: 'image/jpeg' }), true);
  assert.equal(isAllowedCommonAttachment({ originalname: 'photo.jpg', mimetype: 'image/svg+xml' }), false);
  assert.equal(isDocumentOrImageMime('application/octet-stream'), false);
});

test('every privileged route group declares authentication and role authorization', () => {
  const routesDir = path.resolve(__dirname, '..', 'routes');
  for (const fileName of ['adminRoutes.js', 'teacherRoutes.js', 'studentRoutes.js', 'headteacherRoutes.js', 'secretaryRoutes.js']) {
    const source = fs.readFileSync(path.join(routesDir, fileName), 'utf8');
    assert.match(source, /router\.use\(authMiddleware, roleMiddleware\(/, fileName);
  }
});
