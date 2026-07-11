const crypto = require('crypto');
const path = require('path');
const {
  downloadSupabaseFile,
  getSignedUrlTtlSeconds,
  getSupabasePublicUrl,
  isBucketPublic,
  isSupabaseStoredPath,
  parseSupabaseStoredPath,
} = require('../services/supabaseStorageService');

const STORAGE_PROXY_ROUTE = '/api/storage/file';

function isRemoteFileUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function normalizeBoolean(value) {
  return value === true || String(value || '').trim().toLowerCase() === 'true';
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function getRequestOrigin(req) {
  if (!req) return '';
  return `${req.protocol}://${req.get('host')}`;
}

function normalizeLocalFileUrl(req, storedPath) {
  const raw = String(storedPath || '').trim();
  if (!raw) return '';
  const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;
  const origin = getRequestOrigin(req);
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}

function getStorageSigningSecret() {
  return String(process.env.STORAGE_URL_SIGNING_SECRET || process.env.JWT_SECRET || 'edumatch-storage-signing-secret').trim();
}

function encodeBase64Url(input) {
  return Buffer.from(String(input || ''), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function signStoragePayload(payload) {
  return crypto
    .createHmac('sha256', getStorageSigningSecret())
    .update(payload)
    .digest('hex');
}

function buildStorageAccessToken({
  storedPath,
  download = false,
  fileName = '',
  expiresIn = getSignedUrlTtlSeconds(),
} = {}) {
  const payload = {
    storedPath: String(storedPath || '').trim(),
    download: normalizeBoolean(download),
    fileName: String(fileName || '').trim(),
    expiresAt: Date.now() + (normalizePositiveInteger(expiresIn, getSignedUrlTtlSeconds()) * 1000),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signStoragePayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyStorageAccessToken(token) {
  const raw = String(token || '').trim();
  if (!raw || !raw.includes('.')) {
    const error = new Error('Storage access token is invalid');
    error.statusCode = 400;
    throw error;
  }

  const [encodedPayload, signature] = raw.split('.', 2);
  const expectedSignature = signStoragePayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const signatureBuffer = Buffer.from(String(signature || ''), 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    const error = new Error('Storage access token is invalid');
    error.statusCode = 403;
    throw error;
  }

  let payload;
  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload));
  } catch (_error) {
    const error = new Error('Storage access token is invalid');
    error.statusCode = 400;
    throw error;
  }

  if (!payload?.storedPath) {
    const error = new Error('Storage access token is invalid');
    error.statusCode = 400;
    throw error;
  }

  const expiresAt = Number(payload.expiresAt || 0);
  if (!expiresAt || expiresAt <= Date.now()) {
    const error = new Error('Storage access token has expired');
    error.statusCode = 410;
    throw error;
  }

  return {
    storedPath: String(payload.storedPath || '').trim(),
    download: payload.download === true,
    fileName: String(payload.fileName || '').trim(),
    expiresAt,
  };
}

function buildStorageProxyUrl(req, options = {}) {
  const origin = getRequestOrigin(req);
  if (!origin) return '';

  const token = buildStorageAccessToken(options);
  return `${origin}${STORAGE_PROXY_ROUTE}?token=${encodeURIComponent(token)}`;
}

function resolveStoredFileUrl(req, storedPath, options = {}) {
  const raw = String(storedPath || '').trim();
  if (!raw) return '';
  if (isRemoteFileUrl(raw)) return raw;

  if (isSupabaseStoredPath(raw)) {
    const { bucket } = parseSupabaseStoredPath(raw);
    if (isBucketPublic(bucket) && options.download !== true) {
      return getSupabasePublicUrl(raw);
    }
    return buildStorageProxyUrl(req, {
      storedPath: raw,
      download: options.download === true,
      fileName: options.fileName || '',
      expiresIn: options.expiresIn,
    });
  }

  return normalizeLocalFileUrl(req, raw);
}

async function downloadOrRedirectStoredFile(req, res, storedPath, downloadName = '') {
  const raw = String(storedPath || '').trim();
  if (!raw) {
    const error = new Error('Stored file path is missing');
    error.statusCode = 404;
    throw error;
  }

  if (isRemoteFileUrl(raw)) {
    return res.redirect(raw);
  }

  if (isSupabaseStoredPath(raw)) {
    return res.redirect(resolveStoredFileUrl(req, raw, {
      download: true,
      fileName: downloadName,
    }));
  }

  const absolutePath = path.resolve(__dirname, '..', raw);
  return res.download(absolutePath, downloadName || undefined);
}

function guessContentType(fileName = '') {
  const extension = path.extname(String(fileName || '')).toLowerCase();
  if (extension === '.pdf') return 'application/pdf';
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.gif') return 'image/gif';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.bmp') return 'image/bmp';
  if (extension === '.avif') return 'image/avif';
  return 'application/octet-stream';
}

function sanitizeDownloadName(value, fallback = 'file') {
  const baseName = path.basename(String(value || '').trim() || fallback);
  return baseName.replace(/["\r\n]+/g, '').trim() || fallback;
}

function buildContentDisposition(type, fileName) {
  const safeName = sanitizeDownloadName(fileName);
  const asciiName = safeName.replace(/[^\x20-\x7E]+/g, '_');
  return `${type}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

async function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (typeof data?.arrayBuffer === 'function') {
    return Buffer.from(await data.arrayBuffer());
  }

  const error = new Error('Unable to read stored file data');
  error.statusCode = 500;
  throw error;
}

async function streamSupabaseFile(res, storedPath, { download = false, fileName = '' } = {}) {
  const { objectPath, data } = await downloadSupabaseFile(storedPath);
  const resolvedFileName = sanitizeDownloadName(fileName || path.basename(objectPath) || 'file');
  const buffer = await toBuffer(data);
  const contentType = String(data?.type || '').trim() || guessContentType(resolvedFileName);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', String(buffer.length));
  res.setHeader('Content-Disposition', buildContentDisposition(download ? 'attachment' : 'inline', resolvedFileName));
  return res.status(200).send(buffer);
}

async function serveStoredFile(req, res) {
  const payload = verifyStorageAccessToken(req.query.token);
  const raw = String(payload.storedPath || '').trim();

  if (isRemoteFileUrl(raw)) {
    return res.redirect(raw);
  }

  if (isSupabaseStoredPath(raw)) {
    return streamSupabaseFile(res, raw, payload);
  }

  const absolutePath = path.resolve(__dirname, '..', raw);
  if (payload.download) {
    return res.download(absolutePath, payload.fileName || undefined);
  }

  return res.sendFile(absolutePath);
}

module.exports = {
  buildStorageAccessToken,
  downloadOrRedirectStoredFile,
  isRemoteFileUrl,
  resolveStoredFileUrl,
  serveStoredFile,
  verifyStorageAccessToken,
};
