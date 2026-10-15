const GMAIL_EMAIL_REGEX = /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i;
const GMAIL_EMAIL_MESSAGE = 'Please enter a valid Gmail address (e.g., user@gmail.com).';
function isValidGmailEmail(value) {
  const email = String(value || '').trim();
  return email.length <= 254 && email.split('@')[0].length <= 64 && GMAIL_EMAIL_REGEX.test(email);
}
function assertGmailEmail(value) {
  if (!isValidGmailEmail(value)) {
    throw Object.assign(new Error(GMAIL_EMAIL_MESSAGE), { statusCode: 400 });
  }
  return String(value).trim().toLowerCase();
}

const TEACHER_EMAIL_MESSAGE = 'Please enter a valid school or Gmail email address.';
const EMAIL_LOCAL_PART_REGEX = /^[a-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-/=?^_`{|}~]+)*$/i;
const EMAIL_DOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

function isValidTeacherEmail(value) {
  const raw = String(value || '');
  // Reject control characters before trimming so header injection cannot be hidden
  // in leading/trailing whitespace. Internationalized addresses are not supported.
  if (/[^\x20-\x7e]/.test(raw)) return false;
  const email = raw.trim();
  if (email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || !EMAIL_LOCAL_PART_REGEX.test(local)) return false;
  const labels = domain.split('.');
  return labels.length >= 2
    && /^[a-z]{2,63}$/i.test(labels.at(-1))
    && labels.every((label) => EMAIL_DOMAIN_LABEL_REGEX.test(label));
}

function assertTeacherEmail(value) {
  if (!isValidTeacherEmail(value)) {
    throw Object.assign(new Error(TEACHER_EMAIL_MESSAGE), { statusCode: 400 });
  }
  return String(value).trim().toLowerCase();
}

function assertAccountEmail(value, role) {
  return String(role || '').trim().toLowerCase() === 'teacher'
    ? assertTeacherEmail(value)
    : assertGmailEmail(value);
}

module.exports = { isValidGmailEmail, assertGmailEmail, isValidTeacherEmail, assertTeacherEmail, assertAccountEmail };
