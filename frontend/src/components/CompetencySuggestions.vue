<template>
  <section class="competency-review" :class="{ 'has-rows': rows.length }" aria-label="Lesson competency suggestions">
    <div class="competency-review-glow" aria-hidden="true"></div>

    <header class="competency-header">
      <div class="competency-title-group">
        <span class="competency-title-icon" aria-hidden="true"><i class="fas fa-bullseye"></i></span>
        <div>
          <span class="competency-eyebrow">AI-assisted alignment</span>
          <h3>Learning competencies</h3>
          <p>Build a focused coverage guide from the selected lesson before generating questions.</p>
        </div>
      </div>
      <span v-if="rows.length" class="competency-progress-pill" :class="{ complete: reviewComplete }">
        <i class="fas" :class="reviewComplete ? 'fa-circle-check' : 'fa-clipboard-check'" aria-hidden="true"></i>
        {{ reviewedCount }}/{{ rows.length }} reviewed
      </span>
    </header>

    <div class="competency-provenance-note">
      <i class="fas fa-shield-halved" aria-hidden="true"></i>
      <div>
        <strong>Review before use</strong>
        <p><span class="inline-origin extracted">Extracted</span> entries quote explicit lesson objectives. <span class="inline-origin inferred">AI-inferred</span> entries are suggestions and are not verified official curriculum competencies.</p>
      </div>
    </div>

    <div class="competency-toolbar">
      <button class="competency-primary" type="button" :disabled="disabled || loading || !lessonId" @click="suggest">
        <i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'" aria-hidden="true"></i>
        {{ loading ? 'Reading lesson PDF…' : (rows.length ? 'Suggest again' : 'Suggest from lesson PDF') }}
      </button>
      <span class="competency-toolbar-hint"><i class="fas fa-file-pdf" aria-hidden="true"></i> Up to 8 editable suggestions</span>
    </div>

    <div v-if="!lessonId" class="competency-empty-state">
      <span><i class="fas fa-link" aria-hidden="true"></i></span>
      <div><strong>Link a lesson to get suggestions</strong><p>Topic-only generation is still available without this optional step.</p></div>
    </div>
    <p v-if="message" class="competency-alert success" role="status"><i class="fas fa-circle-info" aria-hidden="true"></i>{{ message }}</p>
    <p v-if="error" class="competency-alert error" role="alert"><i class="fas fa-circle-exclamation" aria-hidden="true"></i>{{ error }}</p>

    <div v-if="rows.length" class="competency-list">
      <article v-for="(row, index) in rows" :key="index" class="competency-row" :class="[`origin-${row.origin}`, { reviewed: row.reviewed }]">
        <div class="competency-row-header">
          <div class="competency-row-identity">
            <span class="competency-number">{{ index + 1 }}</span>
            <span class="competency-origin-badge"><i class="fas" :class="originIcon(row.origin)" aria-hidden="true"></i>{{ originLabel(row.origin) }}</span>
          </div>
          <button class="competency-remove" type="button" :disabled="disabled || loading" :aria-label="`Remove competency ${index + 1}`" @click="remove(index)">
            <i class="fas fa-trash-can" aria-hidden="true"></i><span>Remove</span>
          </button>
        </div>

        <label class="competency-field">
          <span><strong>Competency statement</strong><small>{{ row.text.length }}/300</small></span>
          <textarea :value="row.text" :disabled="disabled || loading" maxlength="300" rows="3" @input="edit(index, $event.target.value)" />
        </label>

        <details v-if="row.sourceExcerpt" class="competency-evidence">
          <summary><span><i class="fas fa-quote-left" aria-hidden="true"></i> Lesson evidence</span><i class="fas fa-chevron-down evidence-chevron" aria-hidden="true"></i></summary>
          <blockquote>{{ row.sourceExcerpt }}</blockquote>
        </details>

        <div v-if="row.sourceCode" class="competency-code-note">
          <i class="fas fa-tag" aria-hidden="true"></i>
          <span><strong>{{ row.sourceCode }}</strong> quoted from the lesson · official validity not verified</span>
        </div>

        <label class="competency-confirm" :class="{ checked: row.reviewed }">
          <input type="checkbox" :checked="row.reviewed" :disabled="disabled || loading || !row.text.trim()" @change="confirm(index, $event.target.checked)" />
          <span class="competency-checkmark" aria-hidden="true"><i class="fas fa-check"></i></span>
          <span><strong>{{ row.reviewed ? 'Reviewed and approved' : 'Confirm this competency' }}</strong><small>I checked the statement and its source for use in this exam.</small></span>
        </label>
      </article>
    </div>

    <footer v-if="rows.length" class="competency-footer">
      <div class="competency-progress-copy" role="status">
        <div><strong>{{ reviewComplete ? 'Competencies ready' : `${rows.length - reviewedCount} still need review` }}</strong><span>{{ reviewComplete ? 'You can generate the assessment draft.' : 'Confirm every retained competency to continue.' }}</span></div>
        <span>{{ reviewPercent }}%</span>
      </div>
      <div class="competency-progress-track" aria-hidden="true"><span :style="{ width: `${reviewPercent}%` }"></span></div>
      <button class="competency-clear" type="button" :disabled="disabled || loading" @click="clear"><i class="fas fa-arrow-rotate-left" aria-hidden="true"></i> Use lesson without suggestions</button>
    </footer>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: null },
  lessonId: { type: String, default: '' },
  teacherId: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  requestSuggestions: { type: Function, required: true },
})
const emit = defineEmits(['update:modelValue', 'busy'])
const rows = computed(() => props.modelValue?.rows || [])
const reviewedCount = computed(() => rows.value.filter(row => row.reviewed && row.text.trim()).length)
const reviewComplete = computed(() => rows.value.length > 0 && reviewedCount.value === rows.value.length)
const reviewPercent = computed(() => rows.value.length ? Math.round((reviewedCount.value / rows.value.length) * 100) : 0)
const loading = ref(false)
const error = ref('')
const message = ref('')
let requestVersion = 0

const originLabel = (origin) => ({ extracted: 'Extracted from lesson objectives', inferred: 'AI-inferred — review required', edited: 'Teacher-edited — review required' }[origin] || 'Review required')
const originIcon = (origin) => ({ extracted: 'fa-file-circle-check', inferred: 'fa-wand-magic-sparkles', edited: 'fa-pen' }[origin] || 'fa-circle-info')
function update(nextRows) {
  emit('update:modelValue', nextRows.length ? { lessonId: props.lessonId, rows: nextRows } : null)
}
function edit(index, text) {
  update(rows.value.map((row, i) => i === index ? { ...row, text, origin: 'edited', sourceCode: '', reviewed: false } : row))
}
function confirm(index, reviewed) {
  update(rows.value.map((row, i) => i === index ? { ...row, reviewed } : row))
}
function remove(index) { update(rows.value.filter((_row, i) => i !== index)) }
function clear() { update([]); error.value = ''; message.value = '' }
function invalidate() {
  requestVersion += 1
  loading.value = false
  emit('busy', false)
  error.value = ''
  message.value = ''
}
watch(() => [props.lessonId, props.teacherId], () => { invalidate(); update([]) })
onBeforeUnmount(invalidate)

async function suggest() {
  if (props.disabled || loading.value || !props.lessonId) return
  const version = ++requestVersion
  loading.value = true
  emit('busy', true)
  error.value = ''
  message.value = ''
  try {
    const suggestions = await props.requestSuggestions({ lessonId: props.lessonId, teacherId: props.teacherId || undefined })
    if (version !== requestVersion) return
    const next = Array.isArray(suggestions) ? suggestions.map(row => ({ ...row, reviewed: false })) : []
    update(next)
    if (!next.length) message.value = 'No supported competencies were found. You can generate from the lesson without suggestions.'
  } catch (err) {
    if (version === requestVersion) error.value = err.response?.data?.message || err.message || 'Could not suggest competencies. Please try again.'
  } finally {
    if (version === requestVersion) { loading.value = false; emit('busy', false) }
  }
}
</script>

<style scoped>
@reference "../styles/tailwind.css";
.competency-review {
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:[grid-column:1_/_-1];
  @apply tw:w-full;
  @apply tw:[max-width:none];
  @apply tw:min-w-0;
  @apply tw:self-stretch;
  @apply tw:box-border;
  @apply tw:[margin-block:1rem];
  @apply tw:[padding:1.25rem];
  @apply tw:[border:1px_solid_#d7e5d1];
  @apply tw:[border-radius:22px];
  @apply tw:[background:linear-gradient(145deg,_#fbfdf9_0%,_#f6faf3_52%,_#f8fbff_100%)];
  @apply tw:[box-shadow:0_18px_45px_rgba(39,_74,_19,_0.08)];
}
.competency-review-glow {
  @apply tw:absolute;
  @apply tw:[top:-110px];
  @apply tw:[right:-90px];
  @apply tw:[width:260px];
  @apply tw:[height:260px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:radial-gradient(circle,_rgba(149,_195,_92,_0.2),_rgba(149,_195,_92,_0)_70%)];
  @apply tw:pointer-events-none;
}
.competency-header {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}
.competency-title-group { @apply tw:flex; @apply tw:items-start; @apply tw:[gap:.9rem]; @apply tw:[min-width:0]; }
.competency-title-icon {
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:flex-none;
  @apply tw:[width:46px];
  @apply tw:[height:46px];
  @apply tw:[border:1px_solid_#c6dda9];
  @apply tw:[border-radius:15px];
  @apply tw:[background:linear-gradient(135deg,_#ecf7df,_#ffffff)];
  @apply tw:[color:#356f20];
  @apply tw:[box-shadow:0_8px_20px_rgba(53,_111,_32,_0.12)];
}
.competency-eyebrow {
  @apply tw:block;
  @apply tw:[margin-bottom:.2rem];
  @apply tw:[color:#568137];
  @apply tw:[font-size:.68rem];
  @apply tw:[font-weight:800];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:.12em];
}
.competency-header h3 { @apply tw:[margin:0]; @apply tw:[color:#18320d]; @apply tw:[font-size:1.12rem]; @apply tw:[font-weight:800]; }
.competency-header p { @apply tw:[margin:.28rem_0_0]; @apply tw:[max-width:650px]; @apply tw:[color:#607056]; @apply tw:[font-size:.86rem]; @apply tw:[line-height:1.55]; }
.competency-progress-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:flex-none;
  @apply tw:[gap:.38rem];
  @apply tw:[padding:.42rem_.72rem];
  @apply tw:[border:1px_solid_#f0dca6];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#fff9e8];
  @apply tw:[color:#8a641a];
  @apply tw:[font-size:.73rem];
  @apply tw:[font-weight:800];
}
.competency-progress-pill.complete { @apply tw:[border-color:#b9ddc4]; @apply tw:[background:#edf9f0]; @apply tw:[color:#24713c]; }
.competency-provenance-note {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:.7rem];
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:.78rem_.9rem];
  @apply tw:[border:1px_solid_#dce7f4];
  @apply tw:[border-radius:14px];
  @apply tw:[background:rgba(255,_255,_255,_.82)];
}
.competency-provenance-note > i { @apply tw:[margin-top:.12rem]; @apply tw:[color:#5277a3]; }
.competency-provenance-note strong { @apply tw:block; @apply tw:[color:#2d4057]; @apply tw:[font-size:.78rem]; }
.competency-provenance-note p { @apply tw:[margin:.2rem_0_0]; @apply tw:[color:#64748b]; @apply tw:[font-size:.76rem]; @apply tw:[line-height:1.55]; }
.inline-origin { @apply tw:inline-flex; @apply tw:[padding:.06rem_.35rem]; @apply tw:[border-radius:999px]; @apply tw:[font-size:.68rem]; @apply tw:[font-weight:800]; }
.inline-origin.extracted { @apply tw:[background:#e9f6e3]; @apply tw:[color:#387228]; }
.inline-origin.inferred { @apply tw:[background:#eaf2ff]; @apply tw:[color:#315f98]; }
.competency-toolbar {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:flex-wrap;
  @apply tw:[gap:.75rem];
  @apply tw:[margin-top:1rem];
}
.competency-primary {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:.5rem];
  @apply tw:[min-height:42px];
  @apply tw:[padding:.65rem_1rem];
  @apply tw:[border:1px_solid_#326819];
  @apply tw:[border-radius:12px];
  @apply tw:[background:linear-gradient(135deg,_#315f1c,_#4d812c)];
  @apply tw:[color:#fff];
  @apply tw:[font-size:.82rem];
  @apply tw:[font-weight:800];
  @apply tw:[box-shadow:0_10px_22px_rgba(49,_95,_28,_0.2)];
  @apply tw:[transition:transform_.2s_ease,_box-shadow_.2s_ease,_opacity_.2s_ease];
}
.competency-primary:hover:not(:disabled) { @apply tw:[transform:translateY(-1px)]; @apply tw:[box-shadow:0_14px_28px_rgba(49,_95,_28,_0.26)]; }
.competency-primary:disabled { @apply tw:opacity-50; @apply tw:cursor-not-allowed; @apply tw:[box-shadow:none]; }
.competency-toolbar-hint { @apply tw:inline-flex; @apply tw:items-center; @apply tw:[gap:.4rem]; @apply tw:[color:#73806c]; @apply tw:[font-size:.73rem]; @apply tw:[font-weight:700]; }
.competency-toolbar-hint i { @apply tw:[color:#b14343]; }
.competency-empty-state {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:.75rem];
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:.85rem];
  @apply tw:[border:1px_dashed_#c9d8c2];
  @apply tw:[border-radius:14px];
  @apply tw:[background:rgba(255,_255,_255,_.58)];
}
.competency-empty-state > span { @apply tw:grid; @apply tw:place-items-center; @apply tw:[width:36px]; @apply tw:[height:36px]; @apply tw:[border-radius:11px]; @apply tw:[background:#edf4e9]; @apply tw:[color:#618052]; }
.competency-empty-state strong { @apply tw:block; @apply tw:[color:#33452b]; @apply tw:[font-size:.8rem]; }
.competency-empty-state p { @apply tw:[margin:.16rem_0_0]; @apply tw:[color:#74806e]; @apply tw:[font-size:.73rem]; }
.competency-alert { @apply tw:flex; @apply tw:items-start; @apply tw:[gap:.5rem]; @apply tw:[margin:1rem_0_0]; @apply tw:[padding:.72rem_.85rem]; @apply tw:[border-radius:12px]; @apply tw:[font-size:.78rem]; }
.competency-alert.success { @apply tw:[border:1px_solid_#bfdbfe]; @apply tw:[background:#eff6ff]; @apply tw:[color:#285c91]; }
.competency-alert.error { @apply tw:[border:1px_solid_#fecaca]; @apply tw:[background:#fef2f2]; @apply tw:[color:#b42323]; }
.competency-list { @apply tw:grid; @apply tw:[gap:.85rem]; @apply tw:[margin-top:1.1rem]; }
.competency-row {
  @apply tw:relative;
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#dce5d7];
  @apply tw:[border-left:4px_solid_#6f9a58];
  @apply tw:[border-radius:16px];
  @apply tw:[background:rgba(255,_255,_255,_.94)];
  @apply tw:[box-shadow:0_8px_22px_rgba(35,_63,_24,_0.06)];
  @apply tw:[transition:border-color_.2s_ease,_box-shadow_.2s_ease,_transform_.2s_ease];
}
.competency-row:hover { @apply tw:[transform:translateY(-1px)]; @apply tw:[box-shadow:0_12px_28px_rgba(35,_63,_24,_0.09)]; }
.competency-row.origin-inferred { @apply tw:[border-left-color:#5f83b4]; }
.competency-row.origin-edited { @apply tw:[border-left-color:#a97832]; }
.competency-row.reviewed { @apply tw:[border-color:#afd1b7]; @apply tw:[background:linear-gradient(135deg,_#ffffff,_#f4fbf5)]; }
.competency-row-header { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:.7rem]; }
.competency-row-identity { @apply tw:flex; @apply tw:items-center; @apply tw:flex-wrap; @apply tw:[gap:.55rem]; }
.competency-number { @apply tw:grid; @apply tw:place-items-center; @apply tw:[width:29px]; @apply tw:[height:29px]; @apply tw:[border-radius:9px]; @apply tw:[background:#edf4e9]; @apply tw:[color:#406b2c]; @apply tw:[font-size:.76rem]; @apply tw:[font-weight:900]; }
.competency-origin-badge { @apply tw:inline-flex; @apply tw:items-center; @apply tw:[gap:.4rem]; @apply tw:[padding:.34rem_.58rem]; @apply tw:[border-radius:999px]; @apply tw:[background:#eaf5e5]; @apply tw:[color:#3b7028]; @apply tw:[font-size:.69rem]; @apply tw:[font-weight:800]; }
.origin-inferred .competency-origin-badge { @apply tw:[background:#edf4ff]; @apply tw:[color:#3f6798]; }
.origin-edited .competency-origin-badge { @apply tw:[background:#fff6e5]; @apply tw:[color:#8a6327]; }
.competency-remove { @apply tw:inline-flex; @apply tw:items-center; @apply tw:[gap:.35rem]; @apply tw:[padding:.38rem_.58rem]; @apply tw:[border:1px_solid_transparent]; @apply tw:[border-radius:9px]; @apply tw:[background:transparent]; @apply tw:[color:#9b4b4b]; @apply tw:[font-size:.7rem]; @apply tw:[font-weight:700]; }
.competency-remove:hover:not(:disabled) { @apply tw:[border-color:#fecaca]; @apply tw:[background:#fff1f1]; @apply tw:[color:#b42323]; }
.competency-remove:disabled { @apply tw:opacity-50; @apply tw:cursor-not-allowed; }
.competency-field { @apply tw:block; @apply tw:[margin-top:.85rem]; }
.competency-field > span { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:.5rem]; @apply tw:[margin-bottom:.42rem]; }
.competency-field strong { @apply tw:[color:#34462d]; @apply tw:[font-size:.75rem]; }
.competency-field small { @apply tw:[color:#8a9784]; @apply tw:[font-size:.66rem]; }
.competency-field textarea { @apply tw:block; @apply tw:w-full; @apply tw:[min-height:84px]; @apply tw:[padding:.72rem_.8rem]; @apply tw:[border:1px_solid_#cbd9c5]; @apply tw:[border-radius:12px]; @apply tw:[background:#fbfdfb]; @apply tw:[color:#263321]; @apply tw:[font-size:.84rem]; @apply tw:[line-height:1.55]; @apply tw:resize-y; @apply tw:[transition:border-color_.2s_ease,_box-shadow_.2s_ease,_background_.2s_ease]; }
.competency-field textarea:focus { @apply tw:[outline:none]; @apply tw:[border-color:#6e9c52]; @apply tw:[background:#fff]; @apply tw:[box-shadow:0_0_0_3px_rgba(110,_156,_82,_.14)]; }
.competency-field textarea:disabled { @apply tw:[background:#f1f5ef]; @apply tw:cursor-not-allowed; }
.competency-evidence { @apply tw:[margin-top:.75rem]; @apply tw:[border:1px_solid_#dce5ef]; @apply tw:[border-radius:12px]; @apply tw:[background:#f8fbff]; @apply tw:overflow-hidden; }
.competency-evidence summary { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:.5rem]; @apply tw:[padding:.65rem_.75rem]; @apply tw:cursor-pointer; @apply tw:[color:#496781]; @apply tw:[font-size:.73rem]; @apply tw:[font-weight:800]; @apply tw:list-none; }
.competency-evidence summary span { @apply tw:inline-flex; @apply tw:items-center; @apply tw:[gap:.42rem]; }
.competency-evidence summary::-webkit-details-marker { @apply tw:hidden; }
.evidence-chevron { @apply tw:[font-size:.64rem]; @apply tw:[transition:transform_.2s_ease]; }
.competency-evidence[open] .evidence-chevron { @apply tw:[transform:rotate(180deg)]; }
.competency-evidence blockquote { @apply tw:[margin:0]; @apply tw:[padding:.72rem_.8rem]; @apply tw:[border-top:1px_solid_#dce5ef]; @apply tw:[background:#fff]; @apply tw:[color:#5e6b78]; @apply tw:[font-size:.75rem]; @apply tw:[line-height:1.6]; @apply tw:whitespace-pre-wrap; }
.competency-code-note { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:.48rem]; @apply tw:[margin-top:.7rem]; @apply tw:[padding:.48rem_.62rem]; @apply tw:[border-radius:10px]; @apply tw:[background:#fff8e8]; @apply tw:[color:#806326]; @apply tw:[font-size:.69rem]; }
.competency-code-note strong { @apply tw:[font-family:ui-monospace,_SFMono-Regular,_Menlo,_monospace]; }
.competency-confirm { @apply tw:relative; @apply tw:flex; @apply tw:items-center; @apply tw:[gap:.68rem]; @apply tw:[margin-top:.8rem]; @apply tw:[padding:.72rem_.78rem]; @apply tw:[border:1px_solid_#dbe3d7]; @apply tw:[border-radius:12px]; @apply tw:[background:#f8faf7]; @apply tw:cursor-pointer; @apply tw:[transition:border-color_.2s_ease,_background_.2s_ease]; }
.competency-confirm.checked { @apply tw:[border-color:#a9d5b4]; @apply tw:[background:#edf9f0]; }
.competency-confirm input { @apply tw:absolute; @apply tw:[opacity:0]; @apply tw:pointer-events-none; }
.competency-checkmark { @apply tw:grid; @apply tw:place-items-center; @apply tw:flex-none; @apply tw:[width:25px]; @apply tw:[height:25px]; @apply tw:[border:2px_solid_#a8b6a1]; @apply tw:[border-radius:8px]; @apply tw:[background:#fff]; @apply tw:[color:transparent]; @apply tw:[font-size:.68rem]; @apply tw:[transition:all_.2s_ease]; }
.competency-confirm.checked .competency-checkmark { @apply tw:[border-color:#3f884f]; @apply tw:[background:#3f884f]; @apply tw:[color:#fff]; @apply tw:[box-shadow:0_5px_12px_rgba(63,_136,_79,_.22)]; }
.competency-confirm > span:last-child { @apply tw:grid; @apply tw:[gap:.12rem]; }
.competency-confirm strong { @apply tw:[color:#35432f]; @apply tw:[font-size:.75rem]; }
.competency-confirm small { @apply tw:[color:#76816f]; @apply tw:[font-size:.69rem]; @apply tw:[line-height:1.4]; }
.competency-footer { @apply tw:[margin-top:1rem]; @apply tw:[padding-top:1rem]; @apply tw:[border-top:1px_solid_#dce7d7]; }
.competency-progress-copy { @apply tw:flex; @apply tw:items-end; @apply tw:justify-between; @apply tw:[gap:1rem]; }
.competency-progress-copy > div { @apply tw:grid; @apply tw:[gap:.12rem]; }
.competency-progress-copy strong { @apply tw:[color:#30432a]; @apply tw:[font-size:.78rem]; }
.competency-progress-copy span { @apply tw:[color:#75816f]; @apply tw:[font-size:.69rem]; }
.competency-progress-copy > span { @apply tw:[color:#487332]; @apply tw:[font-size:.76rem]; @apply tw:[font-weight:900]; }
.competency-progress-track { @apply tw:overflow-hidden; @apply tw:[height:7px]; @apply tw:[margin-top:.55rem]; @apply tw:[border-radius:999px]; @apply tw:[background:#dfe8da]; }
.competency-progress-track span { @apply tw:block; @apply tw:[height:100%]; @apply tw:[border-radius:inherit]; @apply tw:[background:linear-gradient(90deg,_#6d9d4e,_#3f874f)]; @apply tw:[transition:width_.3s_ease]; }
.competency-clear { @apply tw:inline-flex; @apply tw:items-center; @apply tw:[gap:.4rem]; @apply tw:[margin-top:.8rem]; @apply tw:[padding:.45rem_.1rem]; @apply tw:[border:0]; @apply tw:[background:transparent]; @apply tw:[color:#687961]; @apply tw:[font-size:.72rem]; @apply tw:[font-weight:700]; }
.competency-clear:hover:not(:disabled) { @apply tw:[color:#365d24]; }
.competency-clear:disabled { @apply tw:opacity-50; @apply tw:cursor-not-allowed; }
@media (max-width: 640px) {
  .competency-review { @apply tw:[padding:1rem]; @apply tw:[border-radius:18px]; }
  .competency-header { @apply tw:flex-col; }
  .competency-progress-pill { @apply tw:self-start; }
  .competency-title-icon { @apply tw:[width:40px]; @apply tw:[height:40px]; }
  .competency-toolbar { @apply tw:items-stretch; }
  .competency-primary { @apply tw:w-full; }
  .competency-toolbar-hint { @apply tw:justify-center; @apply tw:w-full; }
  .competency-remove span { @apply tw:hidden; }
}
</style>
