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
@reference "../styles/tailwind.css";

.storage-demo-page {
  @apply tw:min-h-screen;
  @apply tw:[padding:2rem_1rem_3rem];
  @apply tw:[background:radial-gradient(circle_at_top_left,_rgba(15,_98,_254,_0.08),_transparent_26rem),_____linear-gradient(180deg,_#f7fbff_0%,_#eef4fb_100%)];
}

.storage-demo-shell {
  @apply tw:[max-width:1100px];
  @apply tw:[margin:0_auto];
  @apply tw:grid;
  @apply tw:[gap:1.5rem];
}

.storage-demo-header {
  @apply tw:[padding:1.5rem];
  @apply tw:[border-radius:22px];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
  @apply tw:[border:1px_solid_rgba(15,_33,_58,_0.08)];
  @apply tw:[box-shadow:0_18px_40px_rgba(15,_23,_42,_0.08)];
}

.storage-demo-eyebrow {
  @apply tw:[margin:0_0_0.5rem];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.16em];
  @apply tw:uppercase;
  @apply tw:[color:#0f62fe];
}

.storage-demo-header h1 {
  @apply tw:[margin:0_0_0.75rem];
  @apply tw:[color:#10213a];
  @apply tw:[line-height:1.15];
}

.storage-demo-header p {
  @apply tw:[margin:0];
  @apply tw:[color:#51627a];
  @apply tw:[line-height:1.6];
}

.storage-demo-header code {
  @apply tw:[padding:0.1rem_0.35rem];
  @apply tw:[border-radius:6px];
  @apply tw:[background:#e8eef8];
  @apply tw:[color:#10213a];
}

</style>
