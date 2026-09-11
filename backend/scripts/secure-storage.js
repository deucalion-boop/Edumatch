// Explicit administrative command: makes only the configured app bucket private.
// It preserves every file and all other bucket settings.
const path = require('node:path');
require('dotenv').config({
  path: [path.resolve(__dirname, '../.env'), path.resolve(__dirname, '../.env.local')], quiet: true,
});
const { getSupabaseStorageClient, getSupabaseStorageConfig, verifyPrivateStorageBucket } = require('../services/supabaseStorageService');

async function main() {
  const client = getSupabaseStorageClient();
  const { bucket } = getSupabaseStorageConfig();
  const { data, error } = await client.storage.getBucket(bucket);
  if (error || !data || (data.id !== bucket && data.name !== bucket)) throw new Error('Bucket identity could not be verified');
  if (data.public === true) {
    const result = await client.storage.updateBucket(bucket, {
      public: false,
      fileSizeLimit: data.file_size_limit,
      allowedMimeTypes: data.allowed_mime_types,
    });
    if (result.error) throw new Error('Bucket privacy update failed');
  }
  await verifyPrivateStorageBucket();
  console.log(`Configured application bucket is private (verified). Previous visibility: ${data.public ? 'public' : 'private'}. No files deleted.`);
}

main().catch(() => {
  console.error('Storage privacy operation could not complete. Check bucket access and configuration; no credential values logged.');
  process.exitCode = 1;
});
