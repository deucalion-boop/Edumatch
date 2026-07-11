<script setup>
import FileStorage from '../components/storage/FileStorage.vue'
</script>

<template>
  <main class="storage-demo-page">
    <section class="storage-demo-shell">
      <header class="storage-demo-header">
        <p class="storage-demo-eyebrow">Supabase Storage Demo</p>
        <h1>Upload, preview, list, and delete files from the <code>demo/</code> folder.</h1>
        <p>
          This example uses the reusable <code>FileStorage</code> component and keeps uploads inside
          a dedicated demo path so you can test safely.
        </p>
      </header>

      <FileStorage title="Storage Demo" folder="demo" />
    </section>
  </main>
</template>

<style scoped>
.storage-demo-page {
  min-height: 100vh;
  padding: 2rem 1rem 3rem;
  background:
    radial-gradient(circle at top left, rgba(15, 98, 254, 0.08), transparent 26rem),
    linear-gradient(180deg, #f7fbff 0%, #eef4fb 100%);
}

.storage-demo-shell {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  gap: 1.5rem;
}

.storage-demo-header {
  padding: 1.5rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(15, 33, 58, 0.08);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.storage-demo-eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #0f62fe;
}

.storage-demo-header h1 {
  margin: 0 0 0.75rem;
  color: #10213a;
  line-height: 1.15;
}

.storage-demo-header p {
  margin: 0;
  color: #51627a;
  line-height: 1.6;
}

.storage-demo-header code {
  padding: 0.1rem 0.35rem;
  border-radius: 6px;
  background: #e8eef8;
  color: #10213a;
}
</style>
