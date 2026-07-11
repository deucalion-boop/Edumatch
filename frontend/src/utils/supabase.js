import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  || ''
).trim()
const safeSupabaseUrl = supabaseUrl || 'http://127.0.0.1:54321'
const safeSupabaseKey = supabaseKey || 'missing-supabase-key'

export const bucketName = String(import.meta.env.VITE_SUPABASE_BUCKET || 'files').trim() || 'files'
export const bucketIsPublic = String(import.meta.env.VITE_SUPABASE_BUCKET_PUBLIC || 'true').trim().toLowerCase() === 'true'
export const signedUrlTtlSeconds = Number.parseInt(import.meta.env.VITE_SUPABASE_SIGNED_URL_TTL_SECONDS || '3600', 10) || 3600

export const supabase = createClient(safeSupabaseUrl, safeSupabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export function assertSupabaseEnv() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase environment variables are missing. Set VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY.'
    )
  }
}

export function isAllowedStorageFile(file) {
  if (!file) return false
  const mimeType = String(file.type || '').toLowerCase()
  return mimeType.startsWith('image/') || mimeType === 'application/pdf'
}

export function sanitizeStorageFileName(name) {
  return String(name || 'file')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'file'
}

export function createUniqueStoragePath(file, folder = '') {
  const fileName = sanitizeStorageFileName(file?.name || 'file')
  const normalizedFolder = String(folder || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\\/g, '/')

  const randomPart = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const uniqueName = `${Date.now()}-${randomPart}-${fileName}`
  return normalizedFolder ? `${normalizedFolder}/${uniqueName}` : uniqueName
}

export function getStorageFileKind(fileName = '') {
  const lowerName = String(fileName || '').trim().toLowerCase()
  if (lowerName.endsWith('.pdf')) {
    return 'pdf'
  }
  if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(lowerName)) {
    return 'image'
  }
  return 'other'
}

export async function resolveStorageFileUrl(path, { expiresIn = signedUrlTtlSeconds } = {}) {
  assertSupabaseEnv()

  if (!path) return ''

  // Public buckets can use stable URLs directly, while private buckets need
  // a short-lived signed URL each time we render the file list.
  if (bucketIsPublic) {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
    return String(data?.publicUrl || '').trim()
  }

  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(path, expiresIn)
  if (error) throw error

  return String(data?.signedUrl || '').trim()
}

export async function listStorageFiles({
  folder = '',
  limit = 100,
  offset = 0,
  sortBy = { column: 'name', order: 'asc' },
} = {}) {
  assertSupabaseEnv()

  const normalizedFolder = String(folder || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')

  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(normalizedFolder, { limit, offset, sortBy })

  if (error) throw error

  return data || []
}
