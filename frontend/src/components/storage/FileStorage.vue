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
@reference "../../styles/tailwind.css";

.file-storage-card {
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1.5rem];
  @apply tw:[border:1px_solid_#dbe4f0];
  @apply tw:[border-radius:20px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)];
  @apply tw:[box-shadow:0_18px_40px_rgba(15,_23,_42,_0.08)];
}

.file-storage-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.file-storage-header h2 {
  @apply tw:[margin:0_0_0.25rem];
  @apply tw:[font-size:1.35rem];
  @apply tw:[color:#10213a];
}

.file-storage-header p {
  @apply tw:[margin:0];
  @apply tw:[color:#51627a];
}

.file-storage-dot {
  @apply tw:[margin:0_0.45rem];
}

.upload-button {
  @apply tw:relative;
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.8rem_1.1rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#10213a];
  @apply tw:[color:#ffffff];
  @apply tw:[font-weight:600];
  @apply tw:cursor-pointer;
  @apply tw:overflow-hidden;
}

.upload-button.disabled {
  @apply tw:[opacity:0.7];
  @apply tw:cursor-not-allowed;
}

.upload-button input {
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:opacity-0;
  @apply tw:cursor-pointer;
}

.status-copy {
  @apply tw:[margin:0];
  @apply tw:[color:#4b5563];
}

.status-copy--error {
  @apply tw:[color:#b42318];
}

.status-copy--success {
  @apply tw:[color:#067647];
}

.file-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(280px,_1fr))];
  @apply tw:[gap:1rem];
}

.file-card {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#d8e2ee];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#ffffff];
}

.file-card-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.file-card-header h3 {
  @apply tw:[margin:0_0_0.2rem];
  @apply tw:[font-size:1rem];
  @apply tw:[word-break:break-word];
  @apply tw:[color:#10213a];
}

.file-card-header p {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.92rem];
  @apply tw:[color:#64748b];
}

.delete-button {
  @apply tw:[border:none];
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.55rem_0.85rem];
  @apply tw:[background:#fee4e2];
  @apply tw:[color:#b42318];
  @apply tw:[font-weight:600];
  @apply tw:cursor-pointer;
}

.preview-shell {
  @apply tw:[min-height:220px];
  @apply tw:[border-radius:14px];
  @apply tw:overflow-hidden;
  @apply tw:[background:#eef4fb];
}

.preview-shell--link {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
}

.image-preview,
.pdf-preview {
  @apply tw:w-full;
  @apply tw:[height:220px];
  @apply tw:[border:0];
  @apply tw:block;
  @apply tw:object-cover;
}

.file-card-actions {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[font-size:0.92rem];
  @apply tw:[color:#64748b];
}

.file-card-actions a {
  @apply tw:[color:#0f62fe];
  @apply tw:[font-weight:600];
  @apply tw:[text-decoration:none];
}

@media (max-width: 720px) {
  .file-storage-header {
    @apply tw:flex-col;
  }

  .upload-button {
    @apply tw:w-full;
  }

  .file-card-actions {
    @apply tw:flex-col;
    @apply tw:items-start;
  }
}

</style>
