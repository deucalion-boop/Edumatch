const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSettings } = require('../services/studentSettingsService');

test('student settings default safely and accept supported values', () => {
  assert.deepEqual(normalizeSettings(), {
    notifications: {
      announcements: true,
      lessons: true,
      deadlines: true,
      results: true,
      enrollment: true,
      inApp: true,
    },
    learning: { deadlineReminder: 'one-day' },
    appearance: { theme: 'system', textSize: 'normal', highContrast: false, reduceMotion: false },
  });

  assert.deepEqual(normalizeSettings({
    notifications: { announcements: false, inApp: false },
    learning: { deadlineReminder: 'three-days' },
    appearance: { theme: 'dark', textSize: 'larger', highContrast: true, reduceMotion: true },
  }), {
    notifications: {
      announcements: false,
      lessons: true,
      deadlines: true,
      results: true,
      enrollment: true,
      inApp: false,
    },
    learning: { deadlineReminder: 'three-days' },
    appearance: { theme: 'dark', textSize: 'larger', highContrast: true, reduceMotion: true },
  });
});

test('student settings reject unsupported enum values and non-boolean toggles', () => {
  const settings = normalizeSettings({
    notifications: { lessons: 'false' },
    learning: { deadlineReminder: 'weekly' },
    appearance: { theme: 'neon', textSize: 'huge', highContrast: 'yes', reduceMotion: 1 },
  });
  assert.equal(settings.notifications.lessons, true);
  assert.equal(settings.learning.deadlineReminder, 'one-day');
  assert.equal(settings.appearance.theme, 'system');
  assert.equal(settings.appearance.textSize, 'normal');
  assert.equal(settings.appearance.highContrast, false);
  assert.equal(settings.appearance.reduceMotion, false);
});
