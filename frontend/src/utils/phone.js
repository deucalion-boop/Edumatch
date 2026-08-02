export const normalizePhilippinePhone = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (!/^\+?[0-9()\-. ]+$/.test(raw)) return raw
  if (raw.startsWith('+') && !raw.startsWith('+63')) return raw

  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''

  const nationalNumber = digits.startsWith('63')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits

  return nationalNumber ? `+63${nationalNumber}` : ''
}

export const isValidPhilippinePhone = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return true
  if (!/^\+?[0-9()\-. ]+$/.test(raw)) return false
  if (raw.startsWith('+') && !raw.startsWith('+63')) return false
  return /^\+63\d{7,10}$/.test(normalizePhilippinePhone(raw))
}
