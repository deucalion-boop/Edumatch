const EMAIL_LOCAL_PART_REGEX = /^[a-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-/=?^_`{|}~]+)*$/i
const EMAIL_DOMAIN_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i

export function isValidTeacherEmail(value) {
  const raw = String(value || '')
  if (/[^\x20-\x7e]/.test(raw)) return false
  const email = raw.trim()
  if (email.length > 254) return false
  const parts = email.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (!local || local.length > 64 || !EMAIL_LOCAL_PART_REGEX.test(local)) return false
  const labels = domain.split('.')
  return labels.length >= 2
    && /^[a-z]{2,63}$/i.test(labels.at(-1))
    && labels.every((label) => EMAIL_DOMAIN_LABEL_REGEX.test(label))
}
