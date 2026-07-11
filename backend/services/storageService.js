const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { isSupabaseStorageConfigured, uploadSupabaseFile } = require('./supabaseStorageService');

const DEFAULT_STORAGE_ROOT = 'uploads';
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '..', DEFAULT_STORAGE_ROOT);

function sanitizeFileName(input) {
  const extension = path.extname(String(input || '')).toLowerCase();
  const baseName = path.basename(String(input || ''), extension)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return {
    baseName: baseName || 'file',
    extension,
  };
}

function buildStoragePath({ folder = 'misc', originalName = 'file' } = {}) {
  const normalizedFolder = String(folder || 'misc')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    || 'misc';
  const { baseName, extension } = sanitizeFileName(originalName);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const uniqueSuffix = crypto.randomUUID();
  return `${normalizedFolder}/${datePrefix}/${uniqueSuffix}-${baseName}${extension}`;
}

async function uploadFile({
  file,
  folder = 'misc',
} = {}) {
  if (!file || !file.buffer) {
    const error = new Error('Upload file buffer is required');
    error.statusCode = 400;
    throw error;
  }

  const storagePath = buildStoragePath({
    folder,
    originalName: file.originalname || file.originalName || 'file',
  });

  const contentType = String(file.mimetype || file.mimeType || 'application/octet-stream').toLowerCase();
  const basePayload = {
    path: storagePath,
    originalName: String(file.originalname || file.originalName || '').trim(),
    mimeType: contentType,
    extension: path.extname(String(file.originalname || file.originalName || '')).toLowerCase(),
    size: Number(file.size || 0),
    uploadedAt: new Date(),
  };

  if (isSupabaseStorageConfigured()) {
    // Keep a stable object path in MongoDB so URLs can stay public or be
    // signed later depending on bucket visibility.
    const upload = await uploadSupabaseFile({
      file,
      objectPath: storagePath,
    });

    return {
      ...basePayload,
      fullPath: upload.storedPath,
      storedPath: upload.storedPath,
      publicUrl: upload.publicUrl || upload.storedPath,
      storageProvider: 'supabase',
      bucket: upload.bucket,
    };
  }

  const absoluteStoragePath = path.resolve(LOCAL_UPLOADS_DIR, ...storagePath.split('/'));
  await fs.mkdir(path.dirname(absoluteStoragePath), { recursive: true });
  await fs.writeFile(absoluteStoragePath, file.buffer);

  const publicPath = path.posix.join(DEFAULT_STORAGE_ROOT, storagePath);

  return {
    ...basePayload,
    fullPath: publicPath,
    storedPath: publicPath,
    publicUrl: publicPath,
    storageProvider: 'local',
  };
}

async function uploadFiles(files = [], options = {}) {
  const uploads = Array.isArray(files) ? files : [];
  return Promise.all(uploads.map((file) => uploadFile({ ...options, file })));
}

module.exports = {
  DEFAULT_STORAGE_ROOT,
  LOCAL_UPLOADS_DIR,
  buildStoragePath,
  uploadFile,
  uploadFiles,
};
