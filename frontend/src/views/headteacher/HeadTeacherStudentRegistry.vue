<template>
  <div class="headteacher-workspace headteacher-dashboard-page headteacher-content-page student-registry-page">
    <HeadTeacherSidebar v-model:is-open="isSidebarOpen" :display-name="displayName" />
    <main class="headteacher-main headteacher-page-container">
      <header class="headteacher-top-header headteacher-matched-page-header">
        <div class="headteacher-header-content">
          <div class="headteacher-header-copy">
            <button type="button" class="headteacher-mobile-menu-toggle" aria-label="Open sidebar" aria-controls="headteacher-sidebar-drawer" :aria-expanded="isSidebarOpen" @click="isSidebarOpen = !isSidebarOpen"><i class="fas fa-bars" aria-hidden="true"></i></button>
            <div class="headteacher-matched-header-copy"><h1>Student Management</h1><p class="headteacher-header-subtitle">One school student registry. Import names, share registration codes, and assign classes in your department.</p></div>
          </div>
          <div class="headteacher-header-tools"><HeadTeacherNotifications /><RouterLink to="/headteacher/settings" class="headteacher-header-settings-button" aria-label="Head Teacher settings"><i class="fas fa-cog" aria-hidden="true"></i></RouterLink></div>
        </div>
      </header>

      <p v-if="notice.message" class="registry-notice" :class="`is-${notice.type}`" :role="notice.type === 'error' ? 'alert' : 'status'">{{ notice.message }}</p>
      <p v-if="loadError" class="registry-notice is-error" role="alert">{{ loadError }} <button type="button" class="registry-text-button" @click="loadRegistry({ force: true })">Retry</button></p>

      <section class="registry-summary" aria-label="School student totals">
        <article v-for="item in summaryCards" :key="item.key" class="registry-summary-card"><span class="registry-summary-icon"><i class="fas" :class="item.icon" aria-hidden="true"></i></span><div><span>{{ item.label }}</span><strong>{{ summary[item.key] }}</strong></div></article>
      </section>
      <p class="registry-summary-note">Pending includes students whose registration code is expired or revoked.</p>

      <section class="registry-panel registry-link-panel" aria-labelledby="registry-link-title">
        <div class="registry-section-heading"><div><span class="registry-eyebrow">Student self-registration</span><h2 id="registry-link-title">Shared school registration link</h2><p>Share this link with students along with their individual registration codes. Each student completes their own account setup.</p></div><span class="registry-scope"><i class="fas fa-school" aria-hidden="true"></i> School-wide</span></div>
        <label class="registry-sr-only" for="registry-registration-link">School registration link</label>
        <div class="registry-link-actions"><input id="registry-registration-link" ref="linkInput" :value="registrationLink?.url || ''" type="text" readonly placeholder="Generate your school’s shared registration link" @focus="$event.target.select()"><button type="button" class="registry-button registry-primary" :disabled="Boolean(busy)" @click="copyRegistrationLink"><i class="fas fa-copy" aria-hidden="true"></i>{{ registrationLink?.url && !linkExpired ? 'Copy Registration Link' : 'Generate Registration Link' }}</button><button v-if="registrationLink?.url" type="button" class="registry-button registry-secondary" :disabled="Boolean(busy)" @click="openDialog('link')">Replace Link</button></div>
        <small v-if="registrationLink?.expiresAt" class="registry-help">{{ linkExpired ? 'This shared link expired' : 'Shared link expires' }} {{ formatDate(registrationLink.expiresAt) }}.</small>
      </section>

      <section class="registry-panel" aria-labelledby="registry-directory-title">
        <div class="registry-section-heading"><div><span class="registry-eyebrow">Central student registry</span><h2 id="registry-directory-title">Student directory</h2><p>Assign students only to teachers in your department. Pending students join those classes after registration.</p></div><div class="registry-button-row"><button type="button" class="registry-button registry-secondary" :disabled="Boolean(busy)" @click="downloadWorkbook('export')"><i class="fas fa-file-excel" aria-hidden="true"></i> Export Excel</button><button type="button" class="registry-button registry-primary" :disabled="Boolean(busy)" @click="openDialog('import')"><i class="fas fa-file-import" aria-hidden="true"></i> Import Students</button></div></div>
        <div class="registry-toolbar">
          <label class="registry-field registry-search" for="registry-search"><span>Search students</span><input id="registry-search" v-model="filters.search" type="search" placeholder="Search name, username or email"></label>
          <label class="registry-field" for="registry-status"><span>Registration status</span><select id="registry-status" v-model="filters.status"><option value="">All statuses</option><option value="pending">Pending</option><option value="registered">Registered</option><option value="expired">Expired code</option><option value="revoked">Revoked code</option></select></label>
          <label class="registry-field" for="registry-assignment"><span>Class assignment</span><select id="registry-assignment" v-model="filters.unassigned"><option :value="false">All students</option><option :value="true">Unassigned only</option></select></label>
          <button type="button" class="registry-button registry-secondary" :disabled="loading" @click="loadRegistry({ force: true })"><i class="fas" :class="loading ? 'fa-spinner fa-spin' : 'fa-rotate-right'" aria-hidden="true"></i>Refresh</button>
        </div>
        <div class="registry-selection-bar"><span>{{ selectedIds.length ? `${selectedIds.length} students selected` : `${students.length} students in this view` }}</span><div class="registry-button-row"><button v-if="selectedIds.length" type="button" class="registry-text-button" @click="selectedIds = []">Clear selection</button><button type="button" class="registry-button registry-secondary" :disabled="!selectedIds.length || Boolean(busy)" @click="openDialog('assign')"><i class="fas fa-chalkboard-user" aria-hidden="true"></i>Assign Classes</button></div></div>
        <p v-if="loading && !loaded" class="registry-empty" role="status">Loading the student registry…</p>
        <div v-else-if="!students.length && !loadError" class="registry-empty"><i class="fas fa-user-graduate" aria-hidden="true"></i><h3>{{ filters.search || filters.status || filters.unassigned ? 'No students match these filters' : 'Import your school’s student list' }}</h3><p>{{ filters.search || filters.status || filters.unassigned ? 'Change the search or filters to find other students.' : 'Upload an Excel file with First Name and Last Name columns. Each student receives a unique registration code.' }}</p></div>
        <div v-if="students.length" class="registry-table-wrap" tabindex="0" role="region" aria-label="Student registry; scroll horizontally to see all columns" :aria-busy="loading">
          <table class="registry-table"><caption class="registry-sr-only">Student registration codes, statuses, class assignments and available actions</caption><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all students on this page" :checked="allPageSelected" :indeterminate="somePageSelected && !allPageSelected" @change="togglePageSelection($event.target.checked)"></th><th scope="col">Student</th><th scope="col">Registration code</th><th scope="col">Status</th><th scope="col">Teacher classes</th><th scope="col">Actions</th></tr></thead><tbody>
            <tr v-for="student in pagedStudents" :key="student.id"><td><input v-model="selectedIds" type="checkbox" :value="student.id" :aria-label="`Select ${studentName(student)}`"></td><th scope="row"><strong>{{ studentName(student) }}</strong><small>{{ studentDetails(student) }}</small></th><td><template v-if="student.registrationCode"><label class="registry-sr-only" :for="`registry-code-${student.id}`">Registration code for {{ studentName(student) }}</label><div class="registry-code-row"><input :id="`registry-code-${student.id}`" :value="student.registrationCode" readonly type="text" @focus="$event.target.select()"><button type="button" class="registry-icon-button" :disabled="!canCopyCode(student)" :aria-label="`Copy code for ${studentName(student)}`" @click="copyCode(student)"><i class="fas fa-copy" aria-hidden="true"></i></button></div><small v-if="student.codeExpiresAt">Expires {{ formatDate(student.codeExpiresAt) }}</small></template><span v-else class="registry-muted">{{ student.status === 'registered' ? 'Code used' : 'No active code' }}</span></td><td><span class="registry-status" :class="`status-${student.status}`">{{ statusLabel(student.status) }}</span><small v-if="student.registeredAt">{{ formatDate(student.registeredAt) }}</small></td><td><ul v-if="student.assignments?.length" class="registry-class-list"><li v-for="assignment in student.assignments" :key="assignment.subjectId"><strong>{{ assignment.className || assignment.subjectName }}</strong><span>{{ assignment.teacherName }}</span></li></ul><span v-else class="registry-muted">Unassigned</span></td><td><div class="registry-row-actions"><button type="button" class="registry-action" :disabled="Boolean(busy)" @click="assignOne(student)">Assign Classes</button><template v-if="student.status !== 'registered'"><button type="button" class="registry-action" :disabled="Boolean(busy)" @click="openDialog('code', student)">{{ student.registrationCode ? 'Renew Code' : 'Issue Code' }}</button><button v-if="student.status !== 'revoked'" type="button" class="registry-action registry-danger-text" :disabled="Boolean(busy)" @click="openDialog('revoke', student)">Revoke Code</button></template></div></td></tr>
          </tbody></table>
        </div>
        <nav v-if="students.length > pageSize" class="registry-pagination" aria-label="Student registry pages"><span>Page {{ currentPage }} of {{ totalPages }}</span><div class="registry-button-row"><button type="button" class="registry-button registry-secondary" :disabled="currentPage === 1" @click="currentPage--">Previous</button><button type="button" class="registry-button registry-secondary" :disabled="currentPage >= totalPages" @click="currentPage++">Next</button></div></nav>
      </section>

      <Teleport to="body"><dialog ref="dialog" class="registry-dialog" :class="{ 'registry-dialog-wide': ['import', 'assign'].includes(dialogMode) }" aria-labelledby="registry-dialog-title" aria-describedby="registry-dialog-description" @cancel.prevent="closeDialog" @click="closeOnBackdrop">
        <div class="registry-dialog-content"><header class="registry-section-heading"><div><span class="registry-eyebrow">Student management</span><h2 id="registry-dialog-title">{{ dialogTitle }}</h2></div><button type="button" class="registry-icon-button" aria-label="Close student management dialog" :disabled="Boolean(busy)" @click="closeDialog"><i class="fas fa-xmark" aria-hidden="true"></i></button></header><p id="registry-dialog-description" class="registry-dialog-description">{{ dialogDescription }}</p>
          <p v-if="dialogError" class="registry-notice is-error" role="alert">{{ dialogError }}</p>
          <template v-if="dialogMode === 'import'">
            <p v-if="!classes.length" class="registry-notice is-error" role="alert">No active teacher class is available in your department. Create or assign an active teacher class before importing students.</p>
            <div class="registry-upload">
              <label class="registry-field" for="registry-import-class"><span>Assign teacher class</span><select id="registry-import-class" v-model="selectedImportSubjectId" :disabled="!classes.length || Boolean(busy)"><option value="" disabled>{{ classes.length ? 'Select a teacher class' : 'No active teacher class available' }}</option><option v-for="teacherClass in classes" :key="teacherClass.id" :value="teacherClass.id">{{ teacherClass.teacherName }} — {{ teacherClass.className || teacherClass.name }}</option></select><small>Every student in this Excel file will be assigned to the selected teacher class.</small></label>
              <label class="registry-field" for="registry-import-file"><span>Excel student list</span><input id="registry-import-file" ref="fileInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :disabled="!classes.length || Boolean(busy)" @change="selectFile"><small>Use only First Name and Last Name headers, with one student per row. Maximum 2 MB.</small></label>
              <div class="registry-button-row"><button type="button" class="registry-button registry-secondary" :disabled="Boolean(busy)" @click="downloadWorkbook('template')">Download Template</button><button type="button" class="registry-button registry-primary" :disabled="!importFile || !selectedImportSubjectId || Boolean(busy)" @click="previewImport">{{ busy === 'preview' ? 'Checking names…' : 'Preview Students' }}</button></div>
            </div>
            <div v-if="previewRecords.length" class="registry-preview">
              <div class="registry-preview-summary"><strong>{{ validPreviewRecords.length }} ready to import</strong><span>{{ previewRecords.length - validPreviewRecords.length }} invalid</span><span v-if="possibleDuplicates">{{ possibleDuplicates }} possible duplicates</span></div>
              <p class="registry-help">Only valid rows will be imported. Correct missing or duplicate names in the file and upload it again to include excluded rows.</p>
              <div class="registry-table-wrap registry-preview-table" tabindex="0" role="region" aria-label="Student import preview"><table class="registry-table"><thead><tr><th scope="col">Row</th><th scope="col">First Name</th><th scope="col">Last Name</th><th scope="col">Review</th></tr></thead><tbody><tr v-for="(record, index) in previewRecords" :key="`${record.rowNumber}-${index}`"><td>{{ record.rowNumber || index + 2 }}</td><td>{{ record.firstName || 'Missing first name' }}</td><td>{{ record.lastName || 'Missing last name' }}</td><td><span v-if="record.status === 'valid'" class="registry-status status-registered">Ready</span><ul v-if="record.errors?.length || record.warnings?.length" class="registry-preview-messages"><li v-for="message in record.errors || []" :key="`error-${message}`" class="registry-danger-text">{{ message }}</li><li v-for="message in record.warnings || []" :key="`warning-${message}`">{{ message }}</li></ul></td></tr></tbody></table></div>
              <label v-if="possibleDuplicates" class="registry-check-label"><input v-model="allowPossibleDuplicates" type="checkbox"><span>I reviewed the similar names and confirm these are different students.</span></label>
            </div>
          </template>
          <template v-else-if="dialogMode === 'assign'">
            <p class="registry-selection-summary">{{ selectedIds.length }} {{ selectedIds.length === 1 ? 'student' : 'students' }} selected. Choose every class they should belong to.</p>
            <label class="registry-field" for="registry-class-search"><span>Find teacher classes</span><input id="registry-class-search" v-model="classSearch" type="search" placeholder="Search teacher, class or subject"></label>
            <div class="registry-class-options"><label v-for="teacherClass in filteredClasses" :key="teacherClass.id" class="registry-class-option"><input v-model="assignmentClassIds" type="checkbox" :value="teacherClass.id"><span><strong>{{ teacherClass.className || teacherClass.name }}</strong><small>{{ teacherClass.teacherName }}<template v-if="teacherClass.className && teacherClass.name"> · {{ teacherClass.name }}</template></small></span></label><p v-if="!filteredClasses.length" class="registry-help">No active teacher classes match. Teachers need an active class before students can be assigned.</p></div>
            <p class="registry-help">{{ assignmentClassIds.length }} classes selected. Saving replaces the current class list for each selected student.</p>
            <label v-if="requiresAssignmentConfirmation" class="registry-check-label"><input v-model="assignmentConfirmed" type="checkbox"><span>{{ !assignmentClassIds.length ? 'Remove all class assignments from the selected students.' : 'Replace every selected student’s current classes with this class list.' }}</span></label>
          </template>
          <div v-else-if="selectedStudent" class="registry-student-context"><strong>{{ studentName(selectedStudent) }}</strong><span>{{ statusLabel(selectedStudent.status) }}</span></div>
          <footer class="registry-dialog-footer"><button type="button" class="registry-button registry-secondary" :disabled="Boolean(busy)" @click="closeDialog">Cancel</button><button v-if="dialogMode === 'import'" type="button" class="registry-button registry-primary" :disabled="!selectedImportSubjectId || !validPreviewRecords.length || Boolean(busy) || (possibleDuplicates > 0 && !allowPossibleDuplicates)" @click="commitImport">{{ busy === 'import' ? 'Importing…' : `Import ${validPreviewRecords.length} Valid Students` }}</button><button v-else-if="dialogMode === 'assign'" type="button" class="registry-button registry-primary" :disabled="Boolean(busy) || (requiresAssignmentConfirmation && !assignmentConfirmed)" @click="saveAssignments">{{ busy === 'assign' ? 'Saving…' : 'Save Class Assignments' }}</button><button v-else type="button" class="registry-button" :class="['revoke', 'link'].includes(dialogMode) ? 'registry-danger' : 'registry-primary'" :disabled="Boolean(busy)" @click="confirmAction">{{ busy ? 'Saving…' : dialogMode === 'revoke' ? 'Revoke Code' : dialogMode === 'code' ? 'Issue New Code' : 'Replace Shared Link' }}</button></footer>
        </div>
      </dialog></Teleport>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import HeadTeacherSidebar from '../../components/HeadTeacherSidebar.vue'
import HeadTeacherNotifications from '../../components/HeadTeacherNotifications.vue'
import { useAuthStore } from '../../stores/auth.js'

const authStore = useAuthStore()
const displayName = computed(() => authStore.user?.name || 'Head Teacher')
const configuredBase = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
const apiBase = !configuredBase ? '/api' : configuredBase.endsWith('/api') ? configuredBase : `${configuredBase}/api`
const endpoint = `${apiBase}/headteacher/student-registry`
const isSidebarOpen = ref(false)
const students = ref([])
const classes = ref([])
const registrationLink = ref(null)
const summary = reactive({ total: 0, registered: 0, pending: 0, unassigned: 0 })
const summaryCards = [{ key: 'total', label: 'Total students', icon: 'fa-users' }, { key: 'registered', label: 'Registered', icon: 'fa-user-check' }, { key: 'pending', label: 'Pending registration', icon: 'fa-clock' }, { key: 'unassigned', label: 'Unassigned', icon: 'fa-chalkboard-user' }]
const filters = reactive({ search: '', status: '', unassigned: false })
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = 20
const totalPages = computed(() => Math.max(1, Math.ceil(students.value.length / pageSize)))
const pagedStudents = computed(() => students.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
const allPageSelected = computed(() => pagedStudents.value.length > 0 && pagedStudents.value.every(student => selectedIds.value.includes(student.id)))
const somePageSelected = computed(() => pagedStudents.value.some(student => selectedIds.value.includes(student.id)))
const loading = ref(false)
const loaded = ref(false)
const loadError = ref('')
const busy = ref('')
const notice = reactive({ type: 'success', message: '' })
const dialog = ref(null)
const dialogMode = ref('import')
const dialogError = ref('')
const selectedStudent = ref(null)
const linkInput = ref(null)
const fileInput = ref(null)
const importFile = ref(null)
const selectedImportSubjectId = ref('')
const previewRecords = ref([])
const previewSummary = ref({})
const allowPossibleDuplicates = ref(false)
const validPreviewRecords = computed(() => previewRecords.value.filter(record => record.status === 'valid' && !record.errors?.length))
const possibleDuplicates = computed(() => Number(previewSummary.value.possibleDuplicates) || validPreviewRecords.value.filter(record => record.warnings?.length).length)
const classSearch = ref('')
const assignmentClassIds = ref([])
const assignmentConfirmed = ref(false)
const requiresAssignmentConfirmation = computed(() => selectedIds.value.length > 1 || assignmentClassIds.value.length === 0)
const filteredClasses = computed(() => {
  const search = classSearch.value.trim().toLocaleLowerCase()
  return classes.value.filter(item => `${item.teacherName || ''} ${item.className || ''} ${item.name || ''}`.toLocaleLowerCase().includes(search))
})
const now = ref(Date.now())
const linkExpired = computed(() => Date.parse(registrationLink.value?.expiresAt || '') <= now.value)
const dialogTitle = computed(() => ({ import: 'Import students from Excel', assign: 'Assign teacher classes', revoke: 'Revoke registration code?', code: 'Issue a new registration code?', link: 'Replace shared school link?' })[dialogMode.value])
const dialogDescription = computed(() => ({ import: 'Upload First Name and Last Name columns. Preview missing, duplicate and similar names before importing valid students.', assign: 'Choose classes handled by teachers in your department. Saving replaces only this department’s assignments; assignments from other departments stay unchanged.', revoke: 'This unused code will stop working. You can issue a new code later if the student still needs to register.', code: 'The student receives a fresh code that expires in 30 days. Their previous code will stop working.', link: 'All students will need the new shared school link. Existing unused student codes remain separate; share the replacement link with your school.' })[dialogMode.value])
let controller
let loadVersion = 0
let filterTimer
let refreshTimer
let disposed = false
const authConfig = () => ({ headers: { Authorization: `Bearer ${authStore.token || ''}` } })
const queryParams = () => ({ ...(filters.search.trim() ? { search: filters.search.trim() } : {}), ...(filters.status ? { status: filters.status } : {}), ...(filters.unassigned ? { unassigned: true } : {}) })
const studentName = student => student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student'
const studentDetails = student => [student.username, student.email].filter(Boolean).join(' · ') || `Imported ${formatDate(student.createdAt)}`
const statusLabel = status => ({ pending: 'Pending', registered: 'Registered', revoked: 'Code revoked', expired: 'Code expired' })[status] || 'Unavailable'
const canCopyCode = student => Boolean(student.registrationCode) && student.status === 'pending' && Date.parse(student.codeExpiresAt) > now.value
const formatDate = value => {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
async function errorMessage(error, fallback) {
  if (error.response?.data instanceof Blob) {
    try { return JSON.parse(await error.response.data.text()).message || fallback } catch { return fallback }
  }
  return error.response?.data?.message || fallback
}
async function loadRegistry(options = {}) {
  if (disposed || !authStore.token || (loading.value && !options.force)) return
  controller?.abort()
  controller = new AbortController()
  const version = ++loadVersion
  loading.value = true
  try {
    const response = await axios.get(endpoint, { ...authConfig(), params: queryParams(), signal: controller.signal })
    if (disposed || version !== loadVersion) return
    if (!Array.isArray(response.data?.students)) throw new Error('Invalid registry response')
    students.value = response.data.students
    classes.value = Array.isArray(response.data.classes) ? response.data.classes : []
    registrationLink.value = response.data.registrationLink || null
    Object.keys(summary).forEach(key => { summary[key] = Number(response.data.summary?.[key]) || 0 })
    selectedIds.value = selectedIds.value.filter(id => students.value.some(student => student.id === id))
    currentPage.value = Math.min(currentPage.value, totalPages.value)
    loadError.value = ''
    loaded.value = true
  } catch (error) {
    if (!disposed && version === loadVersion && error.code !== 'ERR_CANCELED') loadError.value = await errorMessage(error, 'The school student registry could not be loaded. Please retry.')
  } finally { if (!disposed && version === loadVersion) loading.value = false }
}
function togglePageSelection(checked) {
  const ids = new Set(selectedIds.value)
  for (const student of pagedStudents.value) checked ? ids.add(student.id) : ids.delete(student.id)
  selectedIds.value = [...ids]
}
async function openDialog(mode, student = null) {
  if (busy.value) return
  dialogMode.value = mode
  selectedStudent.value = student
  dialogError.value = ''
  if (mode === 'import') {
    importFile.value = null
    selectedImportSubjectId.value = ''
    previewRecords.value = []
    previewSummary.value = {}
    allowPossibleDuplicates.value = false
  }
  if (mode === 'assign') {
    if (!selectedIds.value.length) return
    classSearch.value = ''
    assignmentConfirmed.value = false
    const selected = students.value.filter(item => selectedIds.value.includes(item.id))
    assignmentClassIds.value = selected.length === 1 ? (selected[0].assignments || []).map(item => item.subjectId).filter(id => classes.value.some(item => item.id === id)) : []
  }
  await nextTick()
  if (mode === 'import' && fileInput.value) fileInput.value.value = ''
  dialog.value?.showModal()
}
function closeDialog() { if (!busy.value) dialog.value?.close() }
function closeOnBackdrop(event) {
  if (event.target !== dialog.value) return
  const bounds = dialog.value.getBoundingClientRect()
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog()
}
function assignOne(student) { selectedIds.value = [student.id]; openDialog('assign') }
function selectFile(event) {
  importFile.value = null
  previewRecords.value = []
  previewSummary.value = {}
  allowPossibleDuplicates.value = false
  dialogError.value = ''
  const file = event.target.files?.[0]
  if (!file) return
  if (!/\.xlsx$/i.test(file.name) || !file.size || file.size > 2 * 1024 * 1024) {
    dialogError.value = 'Choose a valid Excel .xlsx file up to 2 MB.'
    event.target.value = ''
    return
  }
  importFile.value = file
}
async function previewImport() {
  if (!importFile.value || !selectedImportSubjectId.value || busy.value) return
  busy.value = 'preview'
  dialogError.value = ''
  previewRecords.value = []
  allowPossibleDuplicates.value = false
  try {
    const data = new FormData()
    data.append('file', importFile.value)
    const response = await axios.post(`${endpoint}/preview`, data, authConfig())
    if (disposed) return
    if (!Array.isArray(response.data?.records)) throw new Error('Invalid preview response')
    previewRecords.value = response.data.records
    previewSummary.value = response.data.summary || {}
    if (!previewRecords.value.length) dialogError.value = 'No student rows were found. Check the two name columns and preview again.'
  } catch (error) { if (!disposed) dialogError.value = await errorMessage(error, 'Unable to preview this student list. Check the file and try again.') }
  finally { if (!disposed) busy.value = '' }
}
async function commitImport() {
  if (busy.value || !selectedImportSubjectId.value || !validPreviewRecords.value.length || (possibleDuplicates.value && !allowPossibleDuplicates.value)) return
  busy.value = 'import'
  dialogError.value = ''
  try {
    const response = await axios.post(`${endpoint}/import`, { records: validPreviewRecords.value.map(item => ({ firstName: item.firstName, lastName: item.lastName })), subjectId: selectedImportSubjectId.value, allowPossibleDuplicates: allowPossibleDuplicates.value }, authConfig())
    if (disposed) return
    notice.type = 'success'
    notice.message = response.data?.message || 'Students imported. Export the registry to distribute their registration codes.'
    dialog.value?.close()
    await loadRegistry({ force: true })
  } catch (error) { if (!disposed) dialogError.value = await errorMessage(error, 'Unable to import these students. Preview the list again and retry.') }
  finally { if (!disposed) busy.value = '' }
}
async function saveAssignments() {
  if (busy.value || !selectedIds.value.length || (requiresAssignmentConfirmation.value && !assignmentConfirmed.value)) return
  busy.value = 'assign'
  dialogError.value = ''
  try {
    await axios.post(`${endpoint}/assign`, { registryIds: [...selectedIds.value], subjectIds: [...assignmentClassIds.value] }, authConfig())
    if (disposed) return
    notice.type = 'success'
    notice.message = 'Department class assignments saved. Pending students join these classes when they register.'
    dialog.value?.close()
    selectedIds.value = []
    await loadRegistry({ force: true })
  } catch (error) { if (!disposed) dialogError.value = await errorMessage(error, 'Unable to save these class assignments. Refresh the registry and retry.') }
  finally { if (!disposed) busy.value = '' }
}
async function requestLink(rotate) {
  const response = await axios.post(`${endpoint}/link`, { rotate }, authConfig())
  if (!response.data?.registrationLink?.url) throw new Error('Missing registration link')
  if (!disposed) registrationLink.value = response.data.registrationLink
  return response.data.registrationLink
}
async function copyText(text, fallbackInput) {
  try { await navigator.clipboard.writeText(text); return true }
  catch { await nextTick(); fallbackInput?.focus(); fallbackInput?.select(); return false }
}
async function copyRegistrationLink() {
  if (busy.value) return
  busy.value = 'link'
  try {
    now.value = Date.now()
    if (!registrationLink.value?.url || linkExpired.value) await requestLink(false)
    if (disposed) return
    const copied = await copyText(registrationLink.value.url, linkInput.value)
    notice.type = copied ? 'success' : 'warning'
    notice.message = copied ? 'School registration link copied. Share each student’s registration code with it.' : 'Select and copy the school registration link above.'
  } catch (error) { if (!disposed) { notice.type = 'error'; notice.message = await errorMessage(error, 'Unable to load the school registration link. Please try again.') } }
  finally { if (!disposed) busy.value = '' }
}
async function copyCode(student) {
  now.value = Date.now()
  if (!canCopyCode(student)) return
  const copied = await copyText(student.registrationCode, document.getElementById(`registry-code-${student.id}`))
  notice.type = copied ? 'success' : 'warning'
  notice.message = copied ? `Registration code copied for ${studentName(student)}.` : 'Select and copy the student’s registration code in the table.'
}
async function confirmAction() {
  if (busy.value) return
  const mode = dialogMode.value
  if (mode !== 'link' && (!selectedStudent.value || selectedStudent.value.status === 'registered')) return
  busy.value = mode
  dialogError.value = ''
  try {
    if (mode === 'link') await requestLink(true)
    else await axios.post(`${endpoint}/${encodeURIComponent(selectedStudent.value.id)}/${mode}`, {}, authConfig())
    if (disposed) return
    notice.type = 'success'
    notice.message = mode === 'link' ? 'Shared school link replaced. Copy and distribute the new link.' : mode === 'code' ? 'A new registration code is ready. The previous code no longer works.' : 'Unused registration code revoked.'
    dialog.value?.close()
    await loadRegistry({ force: true })
  } catch (error) { if (!disposed) dialogError.value = await errorMessage(error, 'Unable to update the registration link or code. Refresh and try again.') }
  finally { if (!disposed) busy.value = '' }
}
async function downloadWorkbook(kind) {
  if (busy.value) return
  busy.value = `download-${kind}`
  try {
    const response = await axios.get(`${endpoint}/${kind}`, { ...authConfig(), params: kind === 'export' ? queryParams() : {}, responseType: 'blob' })
    if (disposed) return
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = kind === 'template' ? 'student-import-template.xlsx' : 'edumatch-student-registry.xlsx'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    if (!disposed) {
      const message = await errorMessage(error, 'The Excel download could not be prepared. Please try again.')
      if (dialog.value?.open) dialogError.value = message
      else { notice.type = 'error'; notice.message = message }
    }
  } finally { if (!disposed) busy.value = '' }
}
function refreshVisible() {
  now.value = Date.now()
  if (document.visibilityState === 'visible' && !busy.value && !dialog.value?.open) loadRegistry()
}
watch(() => [filters.search, filters.status, filters.unassigned], () => {
  selectedIds.value = []
  currentPage.value = 1
  window.clearTimeout(filterTimer)
  filterTimer = window.setTimeout(() => loadRegistry({ force: true }), 250)
})
onMounted(() => {
  loadRegistry()
  window.addEventListener('focus', refreshVisible)
  document.addEventListener('visibilitychange', refreshVisible)
  refreshTimer = window.setInterval(refreshVisible, 30000)
})
onBeforeUnmount(() => {
  disposed = true
  controller?.abort()
  window.clearTimeout(filterTimer)
  window.clearInterval(refreshTimer)
  window.removeEventListener('focus', refreshVisible)
  document.removeEventListener('visibilitychange', refreshVisible)
  dialog.value?.close()
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.student-registry-page { @apply tw:[background:#f4f8f0]; }
.registry-panel { @apply tw:[margin-bottom:1.25rem] tw:[padding:clamp(1rem,_2vw,_1.5rem)] tw:bg-white tw:[border:1px_solid_#dce7d5] tw:[border-radius:18px] tw:[box-shadow:0_10px_28px_rgba(30,_67,_7,_.04)] tw:min-w-0; }
.registry-section-heading { @apply tw:flex tw:items-start tw:justify-between tw:flex-wrap tw:[gap:1rem] tw:[margin-bottom:1rem]; }
.registry-section-heading > div:first-child { @apply tw:[flex:1_1_240px] tw:min-w-0; }
.registry-eyebrow { @apply tw:[font-size:.66rem] tw:font-bold tw:uppercase tw:[letter-spacing:.09em] tw:[color:#5d7c4d]; }
.registry-section-heading h2 { @apply tw:[margin:.3rem_0_.4rem] tw:[font-size:1.15rem] tw:font-bold tw:[color:#21450f] tw:[line-height:1.35]; }
.registry-section-heading p, .registry-dialog-description { @apply tw:m-0 tw:[font-size:.8rem] tw:[color:#6b7b61] tw:[line-height:1.65]; }
.registry-scope { @apply tw:inline-flex tw:items-center tw:[gap:.4rem] tw:[padding:.4rem_.65rem] tw:[border-radius:99px] tw:[background:#edf5e6] tw:[color:#3b6427] tw:[font-size:.72rem] tw:font-semibold; }
.registry-summary { @apply tw:grid tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))] tw:[gap:1rem]; }
.registry-summary-card { @apply tw:flex tw:items-center tw:[gap:.85rem] tw:[padding:1.2rem] tw:bg-white tw:[border:1px_solid_#dce7d5] tw:[border-radius:16px] tw:min-w-0; }
.registry-summary-icon { @apply tw:inline-flex tw:items-center tw:justify-center tw:[width:44px] tw:[height:44px] tw:shrink-0 tw:[border-radius:12px] tw:[background:#edf5e6] tw:[color:#46742d]; }
.registry-summary-card > div { @apply tw:grid tw:[gap:.25rem] tw:min-w-0; }
.registry-summary-card div > span { @apply tw:[font-size:.74rem] tw:[color:#708263]; }
.registry-summary-card strong { @apply tw:[font-size:1.8rem] tw:[line-height:1.1] tw:[color:#2b511b] tw:font-bold; }
.registry-summary-note { @apply tw:[margin:.6rem_0_1.25rem] tw:[font-size:.72rem] tw:[color:#718367]; }
.registry-button-row, .registry-link-actions { @apply tw:flex tw:items-center tw:flex-wrap tw:[gap:.55rem]; }
.registry-button { @apply tw:inline-flex tw:items-center tw:justify-center tw:[gap:.45rem] tw:[padding:.65rem_.9rem] tw:[min-height:44px] tw:[border:1px_solid_transparent] tw:[border-radius:9px] tw:[font-size:.78rem] tw:font-bold tw:cursor-pointer; }
.registry-primary { @apply tw:[background:#32631d] tw:text-white; }
.registry-primary:hover { @apply tw:[background:#254d13]; }
.registry-primary > i { @apply tw:text-white; }
.registry-secondary { @apply tw:bg-white tw:[border-color:#cbdcc1] tw:[color:#3d622b]; }
.registry-secondary:hover { @apply tw:[background:#f1f7ec]; }
.registry-danger { @apply tw:[background:#b91c1c] tw:text-white; }
.registry-button:disabled, .registry-action:disabled, .registry-icon-button:disabled { @apply tw:opacity-50 tw:cursor-not-allowed; }
.registry-button:focus-visible, .registry-action:focus-visible, .registry-text-button:focus-visible, .registry-icon-button:focus-visible, .registry-table-wrap:focus-visible { @apply tw:[outline:3px_solid_#84b869] tw:[outline-offset:3px]; }
.registry-notice { @apply tw:[margin:0_0_1rem] tw:[padding:.85rem_1rem] tw:[border:1px_solid_#cfdfc6] tw:[border-radius:10px] tw:[background:#edf8e5] tw:[color:#31551e] tw:[font-size:.82rem] tw:[line-height:1.6]; }
.registry-notice.is-error { @apply tw:[background:#fff1f2] tw:[border-color:#fecdd3] tw:[color:#9f1239]; }
.registry-notice.is-warning { @apply tw:[background:#fffbeb] tw:[border-color:#fde68a] tw:[color:#92400e]; }
.registry-text-button { @apply tw:[padding:.25rem] tw:bg-transparent tw:border-0 tw:underline tw:cursor-pointer tw:font-semibold tw:[color:inherit] tw:[font-size:.78rem]; }
.registry-link-actions > input { @apply tw:[flex:1_1_260px] tw:min-w-0; }
.registry-link-actions > input, .registry-field input, .registry-field select { @apply tw:w-full tw:[min-height:44px] tw:[padding:.65rem_.75rem] tw:[border:1px_solid_#ccdac4] tw:[border-radius:8px] tw:bg-white tw:[font-size:.82rem] tw:[color:#2d4521] tw:box-border; }
.registry-field input:focus, .registry-field select:focus, .registry-link-actions > input:focus { @apply tw:[outline:2px_solid_#84b869] tw:[outline-offset:2px]; }
.registry-help { @apply tw:block tw:[margin:.65rem_0_0] tw:[font-size:.74rem] tw:[color:#6d7e62] tw:[line-height:1.6]; }
.registry-toolbar { @apply tw:grid tw:[grid-template-columns:minmax(180px,_1fr)_180px_170px_auto] tw:items-end tw:[gap:.8rem]; }
.registry-field { @apply tw:grid tw:[gap:.4rem] tw:[font-size:.76rem] tw:font-semibold tw:[color:#466238]; }
.registry-field small { @apply tw:font-normal tw:[font-size:.72rem] tw:[line-height:1.5] tw:[color:#6d7e62]; }
.registry-selection-bar, .registry-pagination { @apply tw:flex tw:items-center tw:justify-between tw:flex-wrap tw:[gap:.75rem] tw:[margin:1rem_0] tw:[font-size:.76rem] tw:[color:#657b58]; }
.registry-empty { @apply tw:[padding:2.5rem_1rem] tw:text-center tw:[color:#718166] tw:[font-size:.82rem] tw:[line-height:1.6]; }
.registry-empty > i { @apply tw:[font-size:1.7rem] tw:[color:#608c46]; }
.registry-empty h3 { @apply tw:[font-size:1rem] tw:[color:#3d602b] tw:[margin:.8rem_0_.4rem]; }
.registry-empty p { @apply tw:[max-width:500px] tw:mx-auto; }
.registry-table-wrap { @apply tw:w-full tw:min-w-0 tw:overflow-x-auto tw:[border:1px_solid_#e0e8d9] tw:[border-radius:11px]; }
.registry-table { @apply tw:w-full tw:[min-width:940px] tw:border-collapse tw:text-left tw:[font-size:.77rem]; }
.registry-table th, .registry-table td { @apply tw:[padding:.9rem_.75rem] tw:[border-bottom:1px_solid_#e5ecdf] tw:align-top tw:[color:#4c6040] tw:[line-height:1.5]; }
.registry-table thead th { @apply tw:[background:#f3f8ee] tw:[font-size:.68rem] tw:uppercase tw:[letter-spacing:.04em] tw:[color:#4b6c39]; }
.registry-table tbody th { @apply tw:[max-width:220px] tw:[min-width:170px] tw:[overflow-wrap:anywhere]; }
.registry-table tbody th strong { @apply tw:[color:#2e4a1e]; }
.registry-table tbody tr:last-child > * { @apply tw:border-b-0; }
.registry-table small { @apply tw:block tw:[font-size:.68rem] tw:font-normal tw:[color:#809172] tw:[margin-top:.3rem]; }
.registry-table input[type="checkbox"], .registry-check-label input, .registry-class-option input { @apply tw:[width:17px] tw:[height:17px] tw:shrink-0 tw:[accent-color:#3d6c25] tw:cursor-pointer; }
.registry-code-row { @apply tw:flex tw:items-center tw:[gap:.3rem]; }
.registry-code-row > input { @apply tw:[width:245px] tw:[padding:.35rem_.4rem] tw:[border:1px_solid_#dce6d4] tw:[border-radius:5px] tw:[background:#f8fbf5] tw:[color:#36572a] tw:font-mono tw:[font-size:.68rem]; }
.registry-icon-button { @apply tw:inline-flex tw:items-center tw:justify-center tw:[width:36px] tw:[height:36px] tw:[border:1px_solid_#d6e2cc] tw:[border-radius:7px] tw:bg-white tw:[color:#52743d] tw:cursor-pointer tw:shrink-0; }
.registry-status { @apply tw:inline-flex tw:whitespace-nowrap tw:[padding:.25rem_.55rem] tw:rounded-full tw:[font-size:.67rem] tw:font-bold tw:[background:#f1f5f9] tw:[color:#475569]; }
.status-pending { @apply tw:[background:#fef3c7] tw:[color:#92400e]; }
.status-registered { @apply tw:[background:#dcfce7] tw:[color:#166534]; }
.status-expired { @apply tw:[background:#ffedd5] tw:[color:#9a3412]; }
.registry-muted { @apply tw:[color:#87947c] tw:[font-size:.73rem]; }
.registry-class-list { @apply tw:grid tw:[gap:.35rem] tw:list-none tw:p-0 tw:m-0 tw:[min-width:170px]; }
.registry-class-list li { @apply tw:grid tw:[gap:.1rem] tw:[padding:.35rem_.5rem] tw:[border-radius:6px] tw:[background:#f2f7ed] tw:[font-size:.69rem]; }
.registry-class-list span { @apply tw:[color:#76896a]; }
.registry-row-actions { @apply tw:flex tw:flex-wrap tw:[gap:.3rem] tw:[min-width:165px]; }
.registry-action { @apply tw:[min-height:36px] tw:[padding:.35rem_.5rem] tw:[border:1px_solid_#d5e0cb] tw:[border-radius:6px] tw:bg-white tw:[color:#456b30] tw:[font-size:.69rem] tw:font-semibold tw:cursor-pointer; }
.registry-danger-text { @apply tw:[color:#b91c1c]; }
.registry-dialog { @apply tw:fixed tw:[inset:0] tw:m-auto tw:[width:min(540px,_calc(100vw_-_24px))] tw:[max-width:calc(100vw_-_24px)] tw:[max-height:calc(100dvh_-_32px)] tw:[padding:0] tw:[border:1px_solid_#d9e6d0] tw:[border-radius:16px] tw:bg-white tw:[box-shadow:0_24px_80px_rgba(18,_43,_5,_.25)] tw:overflow-y-auto tw:box-border; }
.registry-dialog-wide { @apply tw:[width:min(960px,_calc(100vw_-_24px))]; }
.registry-dialog::backdrop { @apply tw:[background:rgba(12,_30,_5,_.5)]; }
.registry-dialog-content { @apply tw:[padding:1.4rem]; }
.registry-dialog-description { @apply tw:[margin-bottom:1rem]; }
.registry-dialog-footer { @apply tw:flex tw:justify-end tw:flex-wrap tw:[gap:.65rem] tw:[margin-top:1.5rem] tw:[padding-top:1rem] tw:[border-top:1px_solid_#e1e9d9]; }
.registry-upload { @apply tw:grid tw:[gap:1rem] tw:[padding:1rem] tw:[border:1px_dashed_#a8c797] tw:[border-radius:11px] tw:[background:#f7fbf3]; }
.registry-preview { @apply tw:[margin-top:1.25rem]; }
.registry-preview-summary { @apply tw:flex tw:flex-wrap tw:[gap:.8rem] tw:[font-size:.8rem] tw:[color:#708261]; }
.registry-preview-summary strong { @apply tw:[color:#3d6d25]; }
.registry-preview-table { @apply tw:[margin-top:.8rem] tw:[max-height:320px] tw:overflow-y-auto; }
.registry-preview-table .registry-table { @apply tw:[min-width:600px]; }
.registry-preview-messages { @apply tw:[margin:.4rem_0_0] tw:[padding-left:1rem] tw:[font-size:.72rem] tw:[color:#92400e]; }
.registry-check-label { @apply tw:flex tw:items-start tw:[gap:.6rem] tw:[margin-top:1rem] tw:[padding:.8rem] tw:[border:1px_solid_#e7d59a] tw:[border-radius:8px] tw:[background:#fffbed] tw:[font-size:.78rem] tw:[line-height:1.6] tw:[color:#7b5a15]; }
.registry-check-label input { @apply tw:[margin-top:.2rem]; }
.registry-selection-summary { @apply tw:[padding:.75rem] tw:[border-radius:8px] tw:[background:#eff7e8] tw:[font-size:.8rem] tw:[color:#42642e]; }
.registry-class-options { @apply tw:grid tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))] tw:[gap:.6rem] tw:[margin-top:.8rem] tw:[max-height:340px] tw:overflow-y-auto; }
.registry-class-option { @apply tw:flex tw:items-start tw:[gap:.6rem] tw:[padding:.85rem] tw:[border:1px_solid_#dce7d2] tw:[border-radius:9px] tw:cursor-pointer; }
.registry-class-option > span { @apply tw:grid tw:[gap:.2rem] tw:[font-size:.8rem] tw:[color:#3a5a28]; }
.registry-class-option small { @apply tw:[font-size:.71rem] tw:[color:#789069]; }
.registry-student-context { @apply tw:grid tw:[gap:.3rem] tw:[padding:1rem] tw:[background:#f0f7e9] tw:[border-radius:10px] tw:[color:#45652f] tw:[font-size:.85rem]; }
.registry-sr-only { @apply tw:sr-only; }
@media (max-width: 1050px) { .registry-summary { @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))]; } .registry-toolbar { @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))]; } }
@media (max-width: 600px) { .registry-summary { @apply tw:[gap:.6rem]; } .registry-summary-card { @apply tw:[padding:.85rem] tw:[gap:.5rem]; } .registry-summary-icon { @apply tw:hidden; } .registry-summary-card strong { @apply tw:[font-size:1.5rem]; } .registry-toolbar, .registry-class-options { @apply tw:[grid-template-columns:minmax(0,_1fr)]; } .registry-link-actions .registry-button { @apply tw:w-full; } .registry-section-heading > .registry-button-row { @apply tw:w-full; } .registry-section-heading > .registry-button-row .registry-button { @apply tw:flex-1; } .registry-dialog-content { @apply tw:[padding:1rem]; } .registry-dialog-footer .registry-button { @apply tw:flex-1; } }
</style>
