<template>
  <div class="lesson-pdf-reader">
    <div v-if="isLoading && pages.length === 0" class="lesson-pdf-state" role="status">
      <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
      <span>Preparing lesson pages...</span>
    </div>
    <div v-else class="lesson-pdf-pages">
      <div v-for="pageNumber in pages" :key="pageNumber" class="lesson-pdf-page">
        <canvas :ref="(element) => bindCanvas(element, pageNumber)" :aria-label="`Page ${pageNumber}`"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const props = defineProps({
  data: {
    type: [ArrayBuffer, Uint8Array],
    required: true
  }
})

const emit = defineEmits(['error', 'ready'])
const pages = ref([])
const isLoading = ref(false)
const canvases = new Map()
let loadTask = null
let pdfDocument = null
let renderTasks = []
let renderVersion = 0

function bindCanvas(element, pageNumber) {
  if (element) canvases.set(pageNumber, element)
  else canvases.delete(pageNumber)
}

async function disposeDocument() {
  renderTasks.forEach((task) => task?.cancel?.())
  renderTasks = []
  if (loadTask) await loadTask.destroy().catch(() => null)
  else if (pdfDocument) await pdfDocument.destroy().catch(() => null)
  loadTask = null
  pdfDocument = null
  canvases.clear()
  pages.value = []
}

async function renderDocument(source) {
  const version = ++renderVersion
  await disposeDocument()
  if (!source?.byteLength) return
  isLoading.value = true

  try {
    const pdfBytes = source instanceof Uint8Array ? source : new Uint8Array(source)
    loadTask = getDocument({ data: pdfBytes })
    pdfDocument = await loadTask.promise
    if (version !== renderVersion) return

    pages.value = Array.from({ length: pdfDocument.numPages }, (_, index) => index + 1)
    await nextTick()

    for (const pageNumber of pages.value) {
      if (version !== renderVersion) return
      const page = await pdfDocument.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = canvases.get(pageNumber)
      if (!canvas) continue
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`
      const task = page.render({ canvas, viewport })
      renderTasks.push(task)
      await task.promise
    }

    if (version === renderVersion) emit('ready')
  } catch (error) {
    if (version === renderVersion && error?.name !== 'RenderingCancelledException') {
      emit('error', error)
    }
  } finally {
    if (version === renderVersion) isLoading.value = false
  }
}

watch(() => props.data, (source) => {
  void renderDocument(source)
}, { immediate: true })

onBeforeUnmount(() => {
  renderVersion += 1
  void disposeDocument()
})
</script>

<style scoped>
@reference "../styles/tailwind.css";

.lesson-pdf-reader {
  @apply tw:h-full;
  @apply tw:overflow-auto;
  @apply tw:[background:#d8dee7];
}

.lesson-pdf-pages {
  @apply tw:grid;
  @apply tw:justify-items-center;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1rem];
}

.lesson-pdf-page {
  @apply tw:[width:min(100%,_920px)];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_4px_18px_rgba(15,_23,_42,_0.2)];
}

.lesson-pdf-page canvas {
  @apply tw:block;
  @apply tw:w-full;
  @apply tw:h-auto;
}

.lesson-pdf-state {
  @apply tw:[min-height:20rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:700];
}

</style>
