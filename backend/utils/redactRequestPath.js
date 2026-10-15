// Invitation/reset links are bearer credentials, including on unmatched routes.
// Keep route placeholders intact so audit action labels continue to match.
function redactRequestPath(value) {
  return String(value || '').split('?')[0].replace(
    /(\/auth\/(?:student-registry|student-register|teacher-invitations|class-invitations|teacher-register|class-register|invite|reset)\/)([^/]+)/gi,
    (_match, prefix, segment) => `${prefix}${segment === ':token' ? segment : '[REDACTED]'}`
  );
}

module.exports = redactRequestPath;
