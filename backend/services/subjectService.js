const crypto = require('crypto');
const Subject = require('../models/Subject');

function normalizeSubjectName(value) {
  return String(value || '').trim();
}

function normalizeTrack(value) {
  return String(value || '').trim();
}

function normalizeClassName(value) {
  return String(value || '').trim();
}

function buildCodePrefix(name) {
  const compact = normalizeSubjectName(name)
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 3).toUpperCase())
    .join('')
    .slice(0, 3);

  return compact || 'SUB';
}

function buildRandomSuffix(length = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += alphabet[bytes[index] % alphabet.length];
  }
  return result;
}

async function generateUniqueSubjectCode(name) {
  const prefix = buildCodePrefix(name);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `${prefix}-${buildRandomSuffix(5)}`;
    const existing = await Subject.exists({ code });
    if (!existing) return code;
  }

  const fallbackCode = `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  return fallbackCode;
}

async function ensureTeacherSubject({
  teacherId,
  name,
  track,
  subjectCategory = '',
  className = '',
  description = '',
  department = '',
}) {
  const normalizedName = normalizeSubjectName(name);
  const normalizedTrack = normalizeTrack(track);
  const normalizedClassName = normalizeClassName(className);

  if (!teacherId || !normalizedName || !normalizedTrack) {
    const error = new Error('teacherId, name, and track are required');
    error.statusCode = 400;
    throw error;
  }

  let subject = await Subject.findOne({
    teacherId,
    name: normalizedName,
    track: normalizedTrack,
    className: normalizedClassName,
  });

  if (!subject) {
    subject = await Subject.create({
      teacherId,
      name: normalizedName,
      className: normalizedClassName,
      track: normalizedTrack,
      subjectCategory: String(subjectCategory || '').trim(),
      department: String(department || '').trim(),
      description: String(description || '').trim(),
      code: await generateUniqueSubjectCode(normalizedName),
    });
    return subject;
  }

  let isDirty = false;
  if (!subject.code) {
    subject.code = await generateUniqueSubjectCode(normalizedName);
    isDirty = true;
  }
  if (String(subject.subjectCategory || '').trim() !== String(subjectCategory || '').trim() && String(subjectCategory || '').trim()) {
    subject.subjectCategory = String(subjectCategory || '').trim();
    isDirty = true;
  }
  if (department !== undefined && String(subject.department || '').trim() !== String(department || '').trim()) {
    subject.department = String(department || '').trim();
    isDirty = true;
  }
  if (className !== undefined && String(subject.className || '').trim() !== normalizedClassName) {
    subject.className = normalizedClassName;
    isDirty = true;
  }
  if (description !== undefined && String(subject.description || '').trim() !== String(description || '').trim()) {
    subject.description = String(description || '').trim();
    isDirty = true;
  }
  if (!subject.isActive) {
    subject.isActive = true;
    isDirty = true;
  }
  if (isDirty) {
    await subject.save();
  }

  return subject;
}

module.exports = {
  ensureTeacherSubject,
};
