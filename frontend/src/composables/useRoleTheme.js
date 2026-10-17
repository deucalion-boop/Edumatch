import { ref } from 'vue'

// Shared appearance (light / system / dark) support for the Admin, Secretary,
// and Head Teacher workspaces. Mirrors the existing Teacher theme mechanism:
// the chosen preference is persisted per role in localStorage and reflected on
// <html> as data-<role>-theme-preference (raw choice) and data-<role>-theme
// (resolved light|dark) that the role stylesheets key their dark rules from.

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', description: 'Bright and clear', icon: 'fas fa-sun' },
  { value: 'system', label: 'System', description: 'Match this device', icon: 'fas fa-desktop' },
  { value: 'dark', label: 'Dark', description: 'Comfortable in low light', icon: 'fas fa-moon' },
]

const isThemeOption = (value) => THEME_OPTIONS.some((option) => option.value === value)

export const resolveTheme = (preference) => {
  const normalized = isThemeOption(preference) ? preference : 'system'
  if (normalized !== 'system') return normalized
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const readStoredTheme = (storageKey) => {
  try {
    const stored = localStorage.getItem(storageKey) || 'system'
    return isThemeOption(stored) ? stored : 'system'
  } catch (_error) {
    return 'system'
  }
}

export const writeStoredTheme = (storageKey, theme) => {
  try {
    localStorage.setItem(storageKey, theme)
  } catch (_error) {
    /* storage unavailable — ignore */
  }
}

export const applyThemeToDocument = (roleKey, preference) => {
  if (typeof document === 'undefined') return
  const normalized = isThemeOption(preference) ? preference : 'system'
  const root = document.documentElement
  root.dataset[`${roleKey}ThemePreference`] = normalized
  root.dataset[`${roleKey}Theme`] = resolveTheme(normalized)
}

export const applyStoredTheme = (roleKey, storageKey) => {
  applyThemeToDocument(roleKey, readStoredTheme(storageKey))
}

// Apply every role's persisted theme on boot and keep "system" in sync with the
// operating system color-scheme preference.
export const bootstrapRoleThemes = (roles) => {
  if (typeof window === 'undefined') return
  const applyFor = ({ roleKey, storageKey }) => {
    const preference = readStoredTheme(storageKey)
    applyThemeToDocument(roleKey, preference)
  }
  roles.forEach(applyFor)
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    roles.forEach((role) => {
      if (readStoredTheme(role.storageKey) === 'system') applyThemeToDocument(role.roleKey, 'system')
    })
  })
}

// Vue composable used by each role's Settings page.
export function useRoleTheme(roleKey, storageKey) {
  const selectedTheme = ref(readStoredTheme(storageKey))

  const selectTheme = (theme) => {
    if (!isThemeOption(theme)) return
    selectedTheme.value = theme
    writeStoredTheme(storageKey, theme)
    applyThemeToDocument(roleKey, theme)
  }

  return { themeOptions: THEME_OPTIONS, selectedTheme, selectTheme }
}
