<script setup>
import { onMounted, ref } from 'vue'
import {
  bucketIsPublic,
  bucketName,
  createUniqueStoragePath,
  getStorageFileKind,
  isAllowedStorageFile,
  listStorageFiles,
  resolveStorageFileUrl,
  signedUrlTtlSeconds,
  supabase,
} from '../../utils/supabase'

const props = defineProps({
  folder: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'Supabase Storage',
  },
})

const files = ref([])
const loading = ref(false)
const uploading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function buildStoragePath(itemName) {
  const normalizedFolder = String(props.folder || '').trim().replace(/^\/+|\/+$/g, '')
  return normalizedFolder ? `${normalizedFolder}/${itemName}` : itemName
}

async function mapStorageItem(item) {
  const path = buildStoragePath(item.name)
  const kind = getStorageFileKind(item.name)
  // Resolve the right preview URL for the current bucket mode.
  const url = await resolveStorageFileUrl(path, { expiresIn: signedUrlTtlSeconds })

  return {
    id: item.id || path,
    name: item.name,
    path,
    url,
    kind,
    size: Number(item.metadata?.size || 0),
    updatedAt: item.updated_at || item.created_at || null,
  }
}

async function loadFiles() {
  resetMessages()
  loading.value = true

  try {
    const data = await listStorageFiles({ folder: props.folder })
    const fileItems = (data || []).filter((item) => item?.name && item?.metadata)
    files.value = await Promise.all(fileItems.map((item) => mapStorageItem(item)))
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load files.'
  } finally {
    loading.value = false
  }
}

async function handleUpload(event) {
  resetMessages()

  const selectedFiles = Array.from(event?.target?.files || [])
  if (!selectedFiles.length) return

  for (const file of selectedFiles) {
    if (!isAllowedStorageFile(file)) {
      errorMessage.value = 'Only image files and PDF files are allowed.'
      event.target.value = ''
      return
    }
  }

  uploading.value = true

  try {
    for (const file of selectedFiles) {
      const storagePath = createUniqueStoragePath(file, props.folder)

      const { error } = await supabase.storage.from(bucketName).upload(storagePath, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
        upsert: false,
      })

      if (error) throw error
    }

    successMessage.value = selectedFiles.length === 1
      ? 'File uploaded successfully.'
      : 'Files uploaded successfully.'

    await loadFiles()
  } catch (error) {
    errorMessage.value = error.message || 'Upload failed.'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

async function deleteFile(file) {
  resetMessages()

  try {
    const { error } = await supabase.storage.from(bucketName).remove([file.path])
    if (error) throw error

    successMessage.value = `Deleted ${file.name}.`
    await loadFiles()
  } catch (error) {
    errorMessage.value = error.message || 'Delete failed.'
  }
}

onMounted(() => {
  loadFiles()
})
</script>

<template>
  <section class="file-storage-card">
    <div class="file-storage-header">
      <div>
        <h2>{{ title }}</h2>
        <p>
          Bucket: <strong>{{ bucketName }}</strong>
          <span class="file-storage-dot">•</span>
          {{ bucketIsPublic ? 'Public URLs' : 'Signed URLs' }}
        </p>
      </div>

      <label class="upload-button" :class="{ disabled: uploading }">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          :disabled="uploading"
          @change="handleUpload"
        />
        {{ uploading ? 'Uploading...' : 'Upload Files' }}
      </label>
    </div>

    <p v-if="loading" class="status-copy">Loading files...</p>
    <p v-if="errorMessage" class="status-copy status-copy--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="status-copy status-copy--success">{{ successMessage }}</p>

    <div v-if="!loading && files.length" class="file-grid">
      <article v-for="file in files" :key="file.id" class="file-card">
        <div class="file-card-header">
          <div>
            <h3>{{ file.name }}</h3>
            <p>{{ file.kind === 'pdf' ? 'PDF document' : file.kind === 'image' ? 'Image file' : 'Stored file' }}</p>
          </div>

          <button type="button" class="delete-button" @click="deleteFile(file)">
            Delete
          </button>
        </div>

        <div v-if="file.kind === 'image'" class="preview-shell">
          <img :src="file.url" :alt="file.name" class="image-preview" />
        </div>

        <div v-else-if="file.kind === 'pdf'" class="preview-shell">
          <iframe :src="file.url" :title="file.name" class="pdf-preview"></iframe>
        </div>

        <div v-else class="preview-shell preview-shell--link">
          <a :href="file.url" target="_blank" rel="noopener noreferrer">Open file</a>
        </div>

        <div class="file-card-actions">
          <a :href="file.url" target="_blank" rel="noopener noreferrer">Preview</a>
          <span>{{ file.updatedAt ? new Date(file.updatedAt).toLocaleString() : 'Recently uploaded' }}</span>
        </div>
      </article>
    </div>

    <p v-else-if="!loading" class="status-copy">No files found.</p>
  </section>
</template>

<style scoped>
.file-storage-card {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #dbe4f0;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.file-storage-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.file-storage-header h2 {
  margin: 0 0 0.25rem;
  font-size: 1.35rem;
  color: #10213a;
}

.file-storage-header p {
  margin: 0;
  color: #51627a;
}

.file-storage-dot {
  margin: 0 0.45rem;
}

.upload-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.1rem;
  border-radius: 999px;
  background: #10213a;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
}

.upload-button.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.upload-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.status-copy {
  margin: 0;
  color: #4b5563;
}

.status-copy--error {
  color: #b42318;
}

.status-copy--success {
  color: #067647;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.file-card {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid #d8e2ee;
  border-radius: 16px;
  background: #ffffff;
}

.file-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.file-card-header h3 {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  word-break: break-word;
  color: #10213a;
}

.file-card-header p {
  margin: 0;
  font-size: 0.92rem;
  color: #64748b;
}

.delete-button {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  background: #fee4e2;
  color: #b42318;
  font-weight: 600;
  cursor: pointer;
}

.preview-shell {
  min-height: 220px;
  border-radius: 14px;
  overflow: hidden;
  background: #eef4fb;
}

.preview-shell--link {
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview,
.pdf-preview {
  width: 100%;
  height: 220px;
  border: 0;
  display: block;
  object-fit: cover;
}

.file-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.92rem;
  color: #64748b;
}

.file-card-actions a {
  color: #0f62fe;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 720px) {
  .file-storage-header {
    flex-direction: column;
  }

  .upload-button {
    width: 100%;
  }

  .file-card-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
