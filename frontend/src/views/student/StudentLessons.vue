<template>
  <div class="student-dashboard-page lessons-page" :class="{ 'is-standalone-reader': isStandaloneLessonReader }">
    <header class="lessons-page-hero">
      <div class="lessons-page-hero__copy">
        <span class="lessons-page-eyebrow"><i class="fas fa-book-open" aria-hidden="true"></i> Learning hub</span>
        <h1>Lessons &amp; classes</h1>
        <p>Select a class to view its learning materials, or join a new class using the code from your teacher.</p>
        <div class="lessons-page-summary" aria-label="Learning summary">
          <span><strong>{{ subjects.length }}</strong> approved class{{ subjects.length === 1 ? '' : 'es' }}</span>
          <span><strong>{{ visibleLessons.length }}</strong> available lesson{{ visibleLessons.length === 1 ? '' : 's' }}</span>
        </div>
      </div>
      <button type="button" class="join-class-trigger" data-tour="student-join-class-button" @click="openJoinClassModal">
        <i class="fas fa-plus" aria-hidden="true"></i>
        <span>Join a class</span>
      </button>
    </header>

    <div class="lessons-workspace">
    <section class="section-card classes-panel">
      <div class="section-head">
        <div>
          <span class="section-kicker">Class selector</span>
          <h2>My classes</h2>
          <p>Choose a class to filter the lesson feed.</p>
        </div>
        <span class="section-count">{{ subjects.length }}</span>
      </div>
      <div v-if="subjects.length" class="subjects-grid">
        <article
          v-for="subject in subjects"
          :key="subject.id"
          class="subject-card"
          :class="{ active: isSubjectSelected(subject) }"
          role="button"
          tabindex="0"
          :aria-pressed="isSubjectSelected(subject) ? 'true' : 'false'"
          @click="selectSubject(subject)"
          @keydown.enter.prevent="selectSubject(subject)"
          @keydown.space.prevent="selectSubject(subject)"
        >
          <div class="subject-card-head">
            <div>
              <strong>{{ subject.className || subject.name }}</strong>
              <small>{{ subject.code }} · {{ subject.track || 'General' }}</small>
            </div>
            <span class="subject-status approved">
              <i
                v-if="isSubjectSelected(subject)"
                class="fas fa-check subject-selected-check tw:inline:[color:#ffffff]! tw:inline:[-webkit-text-fill-color:#ffffff]!"
                aria-hidden="true"
              ></i>
              {{ isSubjectSelected(subject) ? 'Selected' : 'Approved' }}
            </span>
          </div>
          <div class="subject-metrics">
            <span><i class="fas fa-book-open" aria-hidden="true"></i>{{ subject.lessonCount }} lessons</span>
            <span><i class="fas fa-clipboard-check" aria-hidden="true"></i>{{ subject.assessmentCount }} assessments</span>
            <span><i class="fas fa-chart-line" aria-hidden="true"></i>{{ Number(subject.performance?.averageScore || 0).toFixed(2) }}% avg</span>
          </div>
          <p v-if="subject.description" class="subject-teacher">{{ subject.description }}</p>
          <p class="subject-teacher">Teacher: {{ subject.teacher?.name || 'Teacher' }}</p>
          <p class="subject-card-hint">{{ getSubjectCardHint(subject) }}</p>
        </article>
      </div>
      <div v-else class="classes-empty-state">
        <span class="classes-empty-icon" aria-hidden="true">
          <i class="fas fa-users-viewfinder"></i>
        </span>
        <div class="classes-empty-copy">
          <strong>No approved classes yet</strong>
          <p>You have not joined an approved class yet. Enter a class code to send a request, and your lessons will appear here once a teacher approves it.</p>
        </div>
      </div>

      <div v-if="pendingSubjects.length" class="pending-subjects">
        <div class="pending-subjects-head">
          <div>
            <span class="pending-subjects-label">In progress</span>
            <h4>Pending Requests</h4>
          </div>
          <span class="pending-count">{{ pendingSubjects.length }}</span>
        </div>
        <p class="pending-subjects-copy">These requests were sent successfully and are still waiting for teacher approval.</p>
        <ul class="pending-list">
          <li v-for="subject in pendingSubjects" :key="`pending-${subject.id}`">
            <strong>{{ subject.className || subject.name }}</strong>
            <small>{{ subject.code }} · Awaiting teacher approval</small>
          </li>
        </ul>
      </div>
    </section>

    <section class="active-courses-section lessons-panel" data-tour="student-lessons-table">
      <div class="section-header">
        <div>
          <span class="section-kicker">Lesson library</span>
          <h2 class="section-title">
            <span class="highlight">Lessons</span>
          </h2>
          <p class="section-subtitle">{{ lessonsSectionSubtitle }}</p>
        </div>
      </div>

      <div v-if="selectedSubject" class="active-subject-banner">
        <span class="active-subject-icon" aria-hidden="true"><i class="fas fa-chalkboard-user"></i></span>
        <div class="active-subject-copy">
          <span class="active-subject-label">Selected class</span>
          <strong>{{ getSubjectDisplayName(selectedSubject) }}</strong>
          <small>{{ selectedSubject.code }} &middot; {{ selectedSubject.track || 'General' }}</small>
        </div>
        <span class="active-subject-count">{{ visibleLessons.length }} lesson{{ visibleLessons.length === 1 ? '' : 's' }} available</span>
      </div>

      <div class="courses-lessons-feed-wrap">
        <div v-if="isLessonsLoading" class="feed-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading lessons...</span>
        </div>

        <div v-else-if="visibleLessons.length === 0" class="feed-state feed-state--empty">
          <span class="feed-state-icon" aria-hidden="true"><i class="fas fa-book-open"></i></span>
          <div>
            <strong>No lessons posted yet</strong>
            <span>{{ currentLessonsEmptyMessage }}</span>
          </div>
        </div>

        <div v-else class="lessons-feed">
          <article
            v-for="lesson in paginatedLessons"
            :key="lesson.id"
            class="lesson-feed-card"
            :class="{ active: selectedLessonId === lesson.id }"
          >
            <button type="button" class="lesson-feed-trigger" @click="selectLesson(lesson)">
              <span class="lesson-feed-icon" aria-hidden="true">
                <i class="fas fa-clipboard-list"></i>
              </span>
              <div class="lesson-feed-copy">
                <strong>{{ lesson.title || 'Untitled Lesson' }}</strong>
                <small>{{ lesson.teacherName || 'Teacher' }} &middot; {{ formatRelativeDate(lesson.createdAt) }}</small>
              </div>
              <span class="lesson-feed-status" :class="lessonProgressTone(lesson)">
                {{ lessonProgressLabel(lesson) }}
              </span>
              <span class="lesson-feed-more" aria-hidden="true">
                <i class="fas" :class="selectedLessonId === lesson.id ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              </span>
            </button>

            <div v-if="selectedLessonId === lesson.id" class="lesson-detail-panel" data-tour="student-lesson-detail">
              <header class="lesson-detail-header">
                <div>
                  <h3>{{ lesson.title || 'Untitled Lesson' }}</h3>
                  <p>
                    {{ lesson.subject || lesson.track || 'General' }} &middot;
                    {{ lesson.teacherName || 'Teacher' }} &middot;
                    {{ formatDate(lesson.createdAt) }}
                  </p>
                </div>
                <span v-if="isRecentlyPublished(lesson.createdAt)" class="status-badge new">New Lesson Available</span>
                <span v-else class="status-badge published">Published</span>
              </header>

              <section class="lesson-progress-card" :class="lessonProgressTone(lesson)">
                <div class="lesson-progress-copy">
                  <span class="lesson-progress-icon"><i class="fas" :class="lesson.progress?.status === 'completed' ? 'fa-circle-check' : 'fa-book-reader'"></i></span>
                  <div>
                    <strong>{{ lessonProgressLabel(lesson) }}</strong>
                    <small>{{ lesson.progress?.status === 'completed' ? `Completed ${formatDate(lesson.progress.completedAt)}` : 'Study the material, then confirm when you reach the end.' }}</small>
                  </div>
                </div>
                <div class="lesson-progress-meter" role="progressbar" :aria-valuenow="Number(lesson.progress?.progressPercent || 0)" aria-valuemin="0" aria-valuemax="100">
                  <span :style="{ width: `${Number(lesson.progress?.progressPercent || 0)}%` }"></span>
                </div>
                <span v-if="lesson.progress?.status !== 'completed'" class="lesson-reader-hint">
                  <i class="fas fa-arrow-right" aria-hidden="true"></i>
                  Open the lesson reader in a new tab to begin
                </span>
                <p v-if="lessonProgressMessage && selectedLessonId === lesson.id" class="lesson-progress-message">{{ lessonProgressMessage }}</p>
              </section>

              <div v-if="Array.isArray(lesson.attachments) && lesson.attachments.length" class="lesson-detail-attachments">
                <h4>Lesson material</h4>
                <div class="lesson-attachment-list">
                  <article
                    v-for="attachment in lesson.attachments"
                    :key="attachment.id"
                    class="lesson-attachment-card"
                  >
                    <div class="lesson-attachment-link">
                      <i class="fas" :class="attachment.canPreviewInline ? 'fa-file-pdf' : 'fa-paperclip'"></i>
                      <span><strong>{{ attachment.fileName || 'Lesson material' }}</strong><small>Lesson material</small></span>
                    </div>
                    <button type="button" class="lesson-read-action" :disabled="!attachment.url" @click="openLessonReader(lesson, attachment)">
                      <i class="fas fa-book-open" aria-hidden="true"></i>
                      Read the Lesson
                    </button>
                  </article>
                </div>
              </div>
            </div>
          </article>
        </div>
        <nav v-if="!isLessonsLoading && visibleLessons.length > 10" class="lesson-pagination" aria-label="Lesson pages">
          <span aria-live="polite">Showing {{ (lessonPage - 1) * 10 + 1 }}&ndash;{{ Math.min(lessonPage * 10, visibleLessons.length) }} of {{ visibleLessons.length }} lessons</span>
          <div class="lesson-pagination-controls">
            <button type="button" :disabled="lessonPage === 1" @click="changeLessonPage(lessonPage - 1)">Previous</button>
            <span aria-live="polite">Page {{ lessonPage }} of {{ lessonPageCount }}</span>
            <button type="button" :disabled="lessonPage === lessonPageCount" @click="changeLessonPage(lessonPage + 1)">Next</button>
          </div>
        </nav>
      </div>
    </section>
    </div>

    <Teleport to="body">
      <div
        v-if="previewAttachment"
        class="lesson-preview-modal"
        :class="{ 'is-standalone-reader': isStandaloneLessonReader }"
        role="dialog"
        aria-modal="true"
        aria-label="Lesson reader"
        @click.self="requestCloseLessonReader"
      >
      <div class="lesson-preview-dialog">
        <div class="lesson-preview-head">
          <div class="lesson-preview-copy">
            <span class="lesson-preview-label">Lesson Reader</span>
            <h3>{{ previewAttachment.fileName || 'Attachment' }}</h3>
            <p>{{ readingLesson?.title || 'Learning material' }}</p>
          </div>
          <button v-if="canExitLessonReader" type="button" class="lesson-reader-close" aria-label="Close lesson reader" @click="requestCloseLessonReader">
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div class="lesson-preview-body">
          <div v-if="isLessonReaderLoading" class="lesson-preview-empty">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Opening lesson material...</span>
          </div>
          <div v-else-if="lessonReaderError" class="lesson-preview-empty lesson-preview-error">
            <i class="fas fa-triangle-exclamation"></i>
            <span>{{ lessonReaderError }}</span>
          </div>
          <LessonPdfReader
            v-else-if="isPreviewPdf(previewAttachment) && lessonReaderPdfData"
            :data="lessonReaderPdfData"
            class="lesson-preview-pdf"
            @error="handleLessonPdfError"
          />
          <img
            v-else-if="isPreviewImage(previewAttachment) && lessonReaderBlobUrl"
            :src="lessonReaderBlobUrl"
            :alt="previewAttachment.fileName || 'Attachment preview'"
            class="lesson-preview-image"
          >
          <div v-else class="lesson-preview-empty">
            <i class="fas fa-file-alt"></i>
            <span>This lesson material cannot be displayed in the reader.</span>
          </div>
        </div>

        <div class="lesson-preview-footer">
          <div v-if="readingLesson" class="lesson-reader-progress">
            <div class="lesson-reader-progress__topline">
              <strong>{{ lessonProgressLabel(readingLesson) }}</strong>
              <b>{{ lessonProgressPercent(readingLesson) }}%</b>
            </div>
            <div
              class="lesson-reader-progress__track"
              role="progressbar"
              :aria-valuenow="lessonProgressPercent(readingLesson)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span :style="{ width: `${lessonProgressPercent(readingLesson)}%` }"></span>
            </div>
            <span>{{ lessonEngagementSeconds(readingLesson) < 20 ? `Continue reading for ${20 - lessonEngagementSeconds(readingLesson)} more seconds.` : 'When you reach the end, mark this lesson complete.' }}</span>
            <small v-if="lessonProgressMessage">{{ lessonProgressMessage }}</small>
          </div>
          <button
            v-if="readingLesson?.progress?.status !== 'completed'"
            type="button"
            class="lesson-complete-button"
            :disabled="isSavingLessonProgress || !readingLesson || lessonEngagementSeconds(readingLesson) < 20"
            @click="completeLesson(readingLesson)"
          >
            <i class="fas" :class="isSavingLessonProgress ? 'fa-spinner fa-spin' : 'fa-circle-check'"></i>
            {{ lessonEngagementSeconds(readingLesson) < 20 ? 'Keep Reading' : 'Complete Lesson' }}
          </button>
          <button
            v-else-if="isStandaloneLessonReader"
            type="button"
            class="lesson-complete-button"
            @click="requestCloseLessonReader"
          >
            <i class="fas fa-circle-check" aria-hidden="true"></i>
            Lesson Complete — Close Tab
          </button>
        </div>
        </div>
      </div>
    </Teleport>

    <div v-if="isJoinClassModalOpen" class="join-class-modal" @click.self="closeJoinClassModal">
      <div class="join-class-dialog">
        <div class="join-class-dialog-head">
          <div>
            <h3>Join Class</h3>
          <p>Enter the class code your teacher shared. Your teacher will review the request before lessons unlock.</p>
          </div>
        </div>
        <div class="join-class-dialog-body">
          <label class="join-class-field">
            <span>Class Code</span>
            <input
              v-model.trim="joinClassCode"
              type="text"
              placeholder="Enter class code (e.g. ENG-7X4P2)"
              @keyup.enter="submitJoinClass"
            >
          </label>
          <p v-if="joinClassMessage" class="join-class-feedback" :class="joinClassMessageType">{{ joinClassMessage }}</p>
        </div>
        <div class="join-class-dialog-actions">
          <button type="button" class="btn btn-outline btn-sm" @click="closeJoinClassModal">Cancel</button>
          <button type="button" class="btn btn-primary btn-sm" :disabled="isJoiningClass" @click="submitJoinClass">
            <i class="fas" :class="isJoiningClass ? 'fa-spinner fa-spin' : 'fa-plus-circle'"></i>
            {{ isJoiningClass ? 'Joining...' : 'Join Class' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { defineAsyncComponent } from 'vue'
import { useAuthStore } from '../../stores/auth.js'

const NEW_CONTENT_WINDOW_MS = 72 * 60 * 60 * 1000
const LessonPdfReader = defineAsyncComponent(() => import('../../components/LessonPdfReader.vue'))

export default {
  name: 'StudentLessons',
  components: { LessonPdfReader },
  data() {
    return {
      lessons: [],
      subjects: [],
      pendingSubjects: [],
      selectedSubjectId: '',
      selectedLessonId: null,
      lessonPage: 1,
      previewAttachment: null,
      activeReadingLessonId: null,
      lessonReaderBlobUrl: '',
      lessonReaderPdfData: null,
      lessonReaderError: '',
      isLessonReaderLoading: false,
      lessonReaderRequestId: 0,
      hasOpenedRequestedReader: false,
      isLessonsLoading: false,
      lessonsEmptyMessage: 'No lessons available yet. Join a class and wait for teacher approval to access lesson materials.',
      hasLessonsLoadError: false,
      isJoinClassModalOpen: false,
      joinClassCode: '',
      isJoiningClass: false,
      joinClassMessage: '',
      joinClassMessageType: 'info',
      authStore: null,
      pendingTourAction: '',
      lessonEngagementTimer: null,
      activeLessonSeconds: 0,
      isSavingLessonProgress: false,
      lessonProgressMessage: ''
    }
  },
  computed: {
    selectedSubject() {
      const selectedId = this.normalizeId(this.selectedSubjectId)
      return this.subjects.find((subject) => this.normalizeId(subject?.id) === selectedId) || null
    },
    visibleLessons() {
      const selectedId = this.normalizeId(this.selectedSubjectId)
      if (!selectedId) return this.lessons
      return this.lessons.filter((lesson) => this.normalizeId(lesson?.subjectId) === selectedId)
    },
    lessonPageCount() {
      return Math.max(1, Math.ceil(this.visibleLessons.length / 10))
    },
    paginatedLessons() {
      return this.visibleLessons.slice((this.lessonPage - 1) * 10, this.lessonPage * 10)
    },
    readingLesson() {
      return this.lessons.find((lesson) => lesson.id === this.activeReadingLessonId) || null
    },
    isStandaloneLessonReader() {
      return this.$route.query.reader === '1'
    },
    canExitLessonReader() {
      if (!this.isStandaloneLessonReader) return true
      return Boolean(this.lessonReaderError) || this.readingLesson?.progress?.status === 'completed'
    },
    currentLessonsEmptyMessage() {
      if (this.hasLessonsLoadError) return this.lessonsEmptyMessage
      if (this.selectedSubject) {
        return `No lessons posted yet for ${this.getSubjectDisplayName(this.selectedSubject)}.`
      }
      return this.lessonsEmptyMessage
    },
    lessonsSectionSubtitle() {
      if (this.selectedSubject) {
        return `Showing the lessons posted for ${this.getSubjectDisplayName(this.selectedSubject)}. Click another class above to switch.`
      }
      return 'Lessons appear here after you join a class with a valid code.'
    }
  },
  watch: {
    '$route.query.lessonId'() { this.fetchLessons() },
    selectedSubjectId: {
      flush: 'sync',
      handler() { this.lessonPage = 1 }
    },
    lessonPageCount(count) { this.lessonPage = Math.min(this.lessonPage, count) },
    selectedLessonId(nextId) {
      this.revealSelectedLesson()
      if (!nextId || (this.activeReadingLessonId && this.activeReadingLessonId !== nextId)) {
        void this.closeAttachmentPreview()
      }
    }
  },
  methods: {
    changeLessonPage(page) {
      this.lessonPage = Math.max(1, Math.min(page, this.lessonPageCount))
      this.selectedLessonId = null
    },
    revealSelectedLesson() {
      const index = this.visibleLessons.findIndex(lesson => lesson.id === this.selectedLessonId)
      if (index >= 0) this.lessonPage = Math.floor(index / 10) + 1
    },
    openNotificationLesson() {
      const lesson = this.lessons.find(row => String(row.id) === String(this.$route.query.lessonId || ''))
      if (lesson) { this.selectedSubjectId = this.normalizeId(lesson.subjectId); this.selectedLessonId = lesson.id; this.revealSelectedLesson() }
    },
    handleTourFocus(event) {
      this.pendingTourAction = String(event?.detail?.action || '').trim()
      this.applyPendingTourAction()
    },
    applyPendingTourAction() {
      if (this.pendingTourAction !== 'open-first-lesson') return
      const firstLesson = this.visibleLessons[0] || this.lessons[0]
      if (!firstLesson) return
      if (this.normalizeId(firstLesson.subjectId)) this.selectedSubjectId = this.normalizeId(firstLesson.subjectId)
      if (firstLesson?.id) this.selectedLessonId = firstLesson.id
      this.pendingTourAction = ''
    },
    normalizeId(value) {
      return String(value || '').trim()
    },
    getSubjectDisplayName(subject) {
      return String(subject?.className || subject?.name || 'Class').trim()
    },
    uniqueBy(items, keyResolver) {
      const seen = new Set()
      return (Array.isArray(items) ? items : []).filter((item, index) => {
        const key = String(keyResolver(item, index) || '').trim()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
    getSubjectLessonCount(subjectId) {
      const normalizedSubjectId = this.normalizeId(subjectId)
      if (!normalizedSubjectId) return 0
      return this.lessons.filter((lesson) => this.normalizeId(lesson?.subjectId) === normalizedSubjectId).length
    },
    getSubjectCardHint(subject) {
      const lessonCount = this.getSubjectLessonCount(subject?.id)
      if (this.isSubjectSelected(subject)) {
        return `${lessonCount} posted lesson${lessonCount === 1 ? '' : 's'} shown below`
      }
      return lessonCount > 0
        ? `Click to view ${lessonCount} posted lesson${lessonCount === 1 ? '' : 's'}`
        : 'Click to check this class for new lessons'
    },
    isSubjectSelected(subject) {
      return this.normalizeId(subject?.id) === this.normalizeId(this.selectedSubjectId)
    },
    getDefaultSelectedSubjectId() {
      const availableSubjects = Array.isArray(this.subjects) ? this.subjects : []
      if (availableSubjects.length === 0) return ''
      const lessonSubjectIds = new Set(
        this.lessons
          .map((lesson) => this.normalizeId(lesson?.subjectId))
          .filter(Boolean)
      )
      const firstSubjectWithLessons = availableSubjects.find((subject) => lessonSubjectIds.has(this.normalizeId(subject?.id)))
      return this.normalizeId(firstSubjectWithLessons?.id || availableSubjects[0]?.id)
    },
    syncSelectedSubject() {
      const currentSelectedId = this.normalizeId(this.selectedSubjectId)
      if (currentSelectedId && this.subjects.some((subject) => this.normalizeId(subject?.id) === currentSelectedId)) return
      this.selectedSubjectId = this.getDefaultSelectedSubjectId()
    },
    syncSelectedLesson() {
      if (!this.selectedLessonId) return
      if (!this.visibleLessons.some((lesson) => lesson.id === this.selectedLessonId)) {
        this.selectedLessonId = null
      }
    },
    selectSubject(subject) {
      const nextSubjectId = this.normalizeId(subject?.id)
      if (!nextSubjectId) return
      this.selectedSubjectId = nextSubjectId
      this.syncSelectedLesson()
    },
    resolveApiBaseUrl() {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    },
    getAuthConfig() {
      const token = this.authStore?.token
        || localStorage.getItem('edumatch_auth_token')
        || sessionStorage.getItem('edumatch_auth_token')
        || ''
      return {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    },
    setPageLoading(isLoading) {
      this.isLessonsLoading = isLoading
    },
    isRecentlyPublished(createdAt) {
      if (!createdAt) return false
      const publishedAt = new Date(createdAt)
      if (Number.isNaN(publishedAt.getTime())) return false
      return (Date.now() - publishedAt.getTime()) <= NEW_CONTENT_WINDOW_MS
    },
    formatDate(value) {
      if (!value) return 'N/A'
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return 'N/A'
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }).format(parsed)
    },
    formatRelativeDate(value) {
      if (!value) return 'N/A'
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return 'N/A'
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      const startOfDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime()
      const diffDays = Math.round((startOfToday - startOfDate) / (24 * 60 * 60 * 1000))
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      return this.formatDate(value)
    },
    isPreviewPdf(attachment) {
      const fileType = String(attachment?.fileType || '').trim().toLowerCase()
      const extension = String(attachment?.extension || '').trim().toLowerCase()
      const fileName = String(attachment?.fileName || '').trim().toLowerCase()
      return fileType.includes('pdf') || extension === '.pdf' || fileName.endsWith('.pdf')
    },
    isPreviewImage(attachment) {
      return String(attachment?.fileType || '').trim().toLowerCase().startsWith('image/')
    },
    resolveLessonReaderUrl(value) {
      const raw = String(value || '').trim()
      if (!raw) return ''
      try {
        const parsed = new URL(raw, window.location.origin)
        const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
        if (localHosts.has(parsed.hostname) && localHosts.has(window.location.hostname) && parsed.pathname.startsWith('/api/')) {
          return `${parsed.pathname}${parsed.search}${parsed.hash}`
        }
      } catch (_error) {
        return raw
      }
      return raw
    },
    selectLesson(lesson) {
      if (!lesson?.id) return
      this.selectedLessonId = this.selectedLessonId === lesson.id ? null : lesson.id
    },
    lessonProgressLabel(lesson) {
      const status = String(lesson?.progress?.status || 'not_started')
      if (status === 'completed') return 'Completed'
      if (status === 'in_progress') return 'In Progress'
      return 'Not Started'
    },
    lessonProgressTone(lesson) {
      return `is-${String(lesson?.progress?.status || 'not_started').replace(/_/g, '-')}`
    },
    lessonProgressPercent(lesson) {
      if (lesson?.progress?.status === 'completed') return 100
      const storedPercent = Number(lesson?.progress?.progressPercent || 0)
      const readingPercent = Math.round(this.lessonEngagementSeconds(lesson) / 60 * 90)
      return Math.min(90, Math.max(storedPercent, readingPercent))
    },
    lessonEngagementSeconds(lesson) {
      return Number(lesson?.progress?.engagementSeconds || 0) + (this.activeReadingLessonId === lesson?.id ? this.activeLessonSeconds : 0)
    },
    stopLessonEngagement() {
      if (this.lessonEngagementTimer) window.clearInterval(this.lessonEngagementTimer)
      this.lessonEngagementTimer = null
      this.activeLessonSeconds = 0
    },
    startLessonEngagement(lesson) {
      this.stopLessonEngagement()
      this.lessonProgressMessage = ''
      if (!lesson?.id || lesson.progress?.status === 'completed') return
      void this.saveLessonProgress(lesson, false, 0).catch(() => null)
      this.lessonEngagementTimer = window.setInterval(() => {
        this.activeLessonSeconds += 10
        const percent = Math.min(90, Math.max(Number(lesson.progress?.progressPercent || 0), Math.round(this.lessonEngagementSeconds(lesson) / 60 * 90)))
        void this.saveLessonProgress(lesson, false, 10, percent).catch(() => null)
      }, 10000)
    },
    async saveLessonProgress(lesson, reachedEnd = false, engagementSeconds = 0, progressPercent = null) {
      if (!lesson?.id) return null
      const response = await axios.patch(
        `${this.resolveApiBaseUrl()}/student/lessons/${lesson.id}/progress`,
        {
          progressPercent: progressPercent ?? (reachedEnd ? 100 : Math.max(5, Number(lesson.progress?.progressPercent || 0))),
          engagementSeconds,
          reachedEnd
        },
        this.getAuthConfig()
      )
      const progress = response.data?.progress || response.data?.data?.progress
      if (progress) {
        lesson.progress = progress
        if (engagementSeconds > 0) this.activeLessonSeconds = Math.max(0, this.activeLessonSeconds - engagementSeconds)
      }
      return progress
    },
    async completeLesson(lesson) {
      if (!lesson?.id || this.lessonEngagementSeconds(lesson) < 20) return
      this.isSavingLessonProgress = true
      this.lessonProgressMessage = ''
      try {
        const progress = await this.saveLessonProgress(lesson, true, 0, 100)
        if (progress?.status === 'completed') {
          this.lessonProgressMessage = 'Lesson completed. Linked assessments are now unlocked.'
          this.stopLessonEngagement()
        } else {
          this.lessonProgressMessage = 'Keep studying a little longer before completing this lesson.'
        }
      } catch (error) {
        this.lessonProgressMessage = error.response?.data?.message || 'Failed to complete the lesson.'
      } finally {
        this.isSavingLessonProgress = false
      }
    },
    openLessonReader(lesson, attachment) {
      if (!lesson?.id || !attachment?.url) return
      const attachmentIndex = Array.isArray(lesson.attachments) ? lesson.attachments.indexOf(attachment) : -1
      const readerRoute = this.$router.resolve({
        path: this.$route.path,
        query: {
          lessonId: lesson.id,
          reader: '1',
          attachmentId: attachment.id || '',
          attachmentIndex: attachmentIndex >= 0 ? String(attachmentIndex) : '0'
        }
      })
      const readerWindow = window.open(readerRoute.href, '_blank')
      if (!readerWindow) {
        this.lessonProgressMessage = 'Allow pop-ups for EduMatch to open the lesson reader in a new tab.'
        return
      }
      readerWindow.opener = null
    },
    async openRequestedLessonReader() {
      if (this.$route.query.reader !== '1' || this.hasOpenedRequestedReader) return
      const lesson = this.lessons.find((row) => String(row.id) === String(this.$route.query.lessonId || ''))
      if (!lesson) return
      const requestedAttachmentId = String(this.$route.query.attachmentId || '')
      const requestedAttachmentIndex = Number.parseInt(String(this.$route.query.attachmentIndex || '0'), 10)
      const attachments = Array.isArray(lesson.attachments) ? lesson.attachments : []
      const attachment = attachments.find((item) => String(item.id || '') === requestedAttachmentId)
        || attachments[Number.isInteger(requestedAttachmentIndex) ? requestedAttachmentIndex : 0]
      if (!attachment?.url) return
      this.hasOpenedRequestedReader = true
      this.selectedSubjectId = this.normalizeId(lesson.subjectId)
      this.selectedLessonId = lesson.id
      this.revealSelectedLesson()
      window.history.replaceState({ lessonReader: true }, '', window.location.href)
      window.history.pushState({ lessonReaderGuard: true }, '', window.location.href)
      await this.loadLessonReader(lesson, attachment)
    },
    async loadLessonReader(lesson, attachment) {
      if (!lesson?.id || !attachment?.url) return
      await this.closeAttachmentPreview()
      const requestId = ++this.lessonReaderRequestId
      this.activeReadingLessonId = lesson.id
      this.previewAttachment = attachment
      this.lessonReaderError = ''
      this.isLessonReaderLoading = true
      try {
        const response = await axios.get(this.resolveLessonReaderUrl(attachment.url), {
          ...this.getAuthConfig(),
          responseType: 'arraybuffer'
        })
        const contentType = String(response.headers?.['content-type'] || attachment.fileType || 'application/pdf')
        if (requestId !== this.lessonReaderRequestId || !this.previewAttachment) {
          return
        }
        if (this.isPreviewPdf(attachment)) {
          this.lessonReaderPdfData = response.data
        } else {
          this.lessonReaderBlobUrl = window.URL.createObjectURL(new Blob([response.data], { type: contentType }))
        }
        this.startLessonEngagement(lesson)
      } catch (error) {
        if (requestId === this.lessonReaderRequestId) {
          this.lessonReaderError = error.response?.data?.message || 'The lesson material could not be opened. Please try again.'
        }
      } finally {
        if (requestId === this.lessonReaderRequestId) this.isLessonReaderLoading = false
      }
    },
    async closeAttachmentPreview() {
      this.lessonReaderRequestId += 1
      const lesson = this.readingLesson
      const pendingSeconds = this.activeLessonSeconds
      this.stopLessonEngagement()
      if (this.lessonReaderBlobUrl) window.URL.revokeObjectURL(this.lessonReaderBlobUrl)
      this.lessonReaderBlobUrl = ''
      this.lessonReaderPdfData = null
      this.lessonReaderError = ''
      this.isLessonReaderLoading = false
      this.previewAttachment = null
      this.activeReadingLessonId = null
      if (lesson?.id && lesson.progress?.status !== 'completed' && pendingSeconds > 0) {
        const percent = Math.min(90, Math.max(Number(lesson.progress?.progressPercent || 0), Math.round((Number(lesson.progress?.engagementSeconds || 0) + pendingSeconds) / 60 * 90)))
        try {
          await this.saveLessonProgress(lesson, false, pendingSeconds, percent)
        } catch (error) {
          this.lessonProgressMessage = error.response?.data?.message || 'Your latest reading progress could not be saved.'
        }
      }
    },
    async requestCloseLessonReader() {
      if (!this.canExitLessonReader) return
      if (this.isStandaloneLessonReader) {
        window.close()
        return
      }
      await this.closeAttachmentPreview()
    },
    handleLessonPdfError() {
      this.stopLessonEngagement()
      this.lessonReaderError = 'This PDF could not be rendered. Ask your teacher to upload the lesson file again.'
    },
    handleLessonReaderBeforeUnload(event) {
      if (!this.isStandaloneLessonReader || this.canExitLessonReader) return
      event.preventDefault()
      event.returnValue = ''
    },
    handleLessonReaderPopState() {
      if (!this.isStandaloneLessonReader || this.canExitLessonReader) return
      window.history.pushState({ lessonReaderGuard: true }, '', window.location.href)
    },
    handleReaderKeydown(event) {
      if (event.key === 'Escape' && this.previewAttachment && this.canExitLessonReader) void this.requestCloseLessonReader()
    },
    openJoinClassModal() {
      this.isJoinClassModalOpen = true
      this.joinClassCode = ''
      this.joinClassMessage = ''
      this.joinClassMessageType = 'info'
    },
    closeJoinClassModal() {
      if (this.isJoiningClass) return
      this.isJoinClassModalOpen = false
      this.joinClassMessage = ''
    },
    async fetchSubjects() {
      try {
        const response = await axios.get(`${this.resolveApiBaseUrl()}/student/subjects`, this.getAuthConfig())
        this.subjects = Array.isArray(response.data?.subjects) ? response.data.subjects : []
        this.pendingSubjects = Array.isArray(response.data?.pendingSubjects) ? response.data.pendingSubjects : []
        this.syncSelectedSubject()
        this.syncSelectedLesson()
        this.openNotificationLesson()
      } catch (error) {
        console.error('[StudentLessons] Failed to fetch classes:', error)
        this.subjects = []
        this.pendingSubjects = []
        this.selectedSubjectId = ''
        this.selectedLessonId = null
      }
    },
    async submitJoinClass() {
      if (!this.joinClassCode) {
        this.joinClassMessage = 'Enter a class code first.'
        this.joinClassMessageType = 'error'
        return
      }

      this.isJoiningClass = true
      this.joinClassMessage = ''
      try {
        await axios.post(
          `${this.resolveApiBaseUrl()}/student/subjects/join`,
          { code: this.joinClassCode },
          this.getAuthConfig()
        )
        this.joinClassMessage = 'Enrollment request sent. Wait for your teacher to approve it.'
        this.joinClassMessageType = 'success'
        this.joinClassCode = ''
        await Promise.allSettled([this.fetchLessons(), this.fetchSubjects()])
        window.setTimeout(() => {
          this.isJoinClassModalOpen = false
        }, 500)
      } catch (error) {
        this.joinClassMessage = error.response?.data?.message || 'Failed to send enrollment request.'
        this.joinClassMessageType = 'error'
      } finally {
        this.isJoiningClass = false
      }
    },
    async fetchLessons() {
      this.setPageLoading(true)
      try {
        const apiBaseUrl = this.resolveApiBaseUrl()
        const lessonsResponse = await axios.get(`${apiBaseUrl}/student/lessons`, this.getAuthConfig())
        const lessons = this.uniqueBy(
          Array.isArray(lessonsResponse.data?.lessons) ? lessonsResponse.data.lessons : [],
          (lesson, index) => lesson.id || lesson._id || `${lesson.title || ''}-${lesson.createdAt || ''}-${index}`
        )

        this.lessons = lessons.map((lesson, index) => ({
          id: lesson.id || lesson._id || `lesson-${index + 1}`,
          title: lesson.title || 'Untitled Lesson',
          description: lesson.description || '',
          track: lesson.track || '',
          subject: lesson.subject || lesson.subjectCategory || '',
          subjectId: lesson.subjectId || '',
          className: lesson.className || '',
          teacherName: lesson.teacher?.name || '',
          createdAt: lesson.createdAt,
          attachments: Array.isArray(lesson.attachments) ? lesson.attachments : [],
          progress: lesson.progress || { status: 'not_started', progressPercent: 0, engagementSeconds: 0, reachedEnd: false, completedAt: null }
        }))
        this.hasLessonsLoadError = false
        this.lessonsEmptyMessage = 'No lessons available yet. Join a class and wait for teacher approval to access lesson materials.'
        this.syncSelectedSubject()
        this.syncSelectedLesson()
        this.openNotificationLesson()
        await this.openRequestedLessonReader()
        this.applyPendingTourAction()
      } catch (error) {
        console.error('[StudentLessons] Failed to fetch lessons:', error)
        this.lessons = []
        this.selectedLessonId = null
        this.hasLessonsLoadError = true
        this.lessonsEmptyMessage = 'Failed to load lessons. Please try again.'
      } finally {
        this.setPageLoading(false)
      }
    }
  },
  mounted() {
    this.authStore = useAuthStore()
    window.addEventListener('edumatch-student-tour-focus', this.handleTourFocus)
    window.addEventListener('keydown', this.handleReaderKeydown)
    window.addEventListener('beforeunload', this.handleLessonReaderBeforeUnload)
    window.addEventListener('popstate', this.handleLessonReaderPopState)
    this.fetchLessons()
    this.fetchSubjects()
  },
  beforeUnmount() {
    window.removeEventListener('edumatch-student-tour-focus', this.handleTourFocus)
    window.removeEventListener('keydown', this.handleReaderKeydown)
    window.removeEventListener('beforeunload', this.handleLessonReaderBeforeUnload)
    window.removeEventListener('popstate', this.handleLessonReaderPopState)
    void this.closeAttachmentPreview()
  }
}
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.lesson-progress-card {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(220px,_1fr)_minmax(160px,_0.7fr)_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.9rem];
  @apply tw:[margin:0.85rem_0];
  @apply tw:[padding:0.85rem];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f8fafc];
}
.lesson-progress-card.is-completed { @apply tw:[border-color:#b9dca7]; @apply tw:[background:#f4faef]; }
.lesson-progress-copy { @apply tw:flex; @apply tw:items-center; @apply tw:[gap:0.7rem]; @apply tw:[min-width:0]; }
.lesson-progress-copy > div { @apply tw:grid; @apply tw:[gap:0.15rem]; }
.lesson-progress-copy strong { @apply tw:[color:#1e4307]; @apply tw:[font-size:0.86rem]; }
.lesson-progress-copy small { @apply tw:[color:#64748b]; @apply tw:[font-size:0.72rem]; @apply tw:[line-height:1.35]; }
.lesson-progress-icon { @apply tw:[width:34px]; @apply tw:[height:34px]; @apply tw:[border-radius:10px]; @apply tw:inline-flex; @apply tw:items-center; @apply tw:justify-center; @apply tw:[flex:0_0_34px]; @apply tw:[background:#eaf3e4]; @apply tw:[color:#4f8a35]; }
.lessons-page .lesson-progress-icon i { @apply tw:[color:#4f8a35]!; @apply tw:[-webkit-text-fill-color:#4f8a35]!; }
.lesson-progress-meter { @apply tw:[height:8px]; @apply tw:overflow-hidden; @apply tw:[border-radius:999px]; @apply tw:[background:#e2e8f0]; }
.lesson-progress-meter span { @apply tw:block; @apply tw:h-full; @apply tw:[border-radius:inherit]; @apply tw:[background:linear-gradient(90deg,_#4f8a35,_#8fc867)]; @apply tw:[transition:width_300ms_ease]; }
.lesson-complete-button { @apply tw:[min-height:38px]; @apply tw:[padding:0.55rem_0.8rem]; @apply tw:[border:1px_solid_#5f9a45]; @apply tw:[border-radius:10px]; @apply tw:[background:#4f8a35]; @apply tw:[color:#fff]; @apply tw:[font:inherit]; @apply tw:[font-size:0.75rem]; @apply tw:[font-weight:700]; @apply tw:cursor-pointer; }
.lesson-complete-button:disabled { @apply tw:[border-color:#cbd5e1]; @apply tw:[background:#e2e8f0]; @apply tw:[color:#64748b]; @apply tw:cursor-not-allowed; }
.lesson-progress-message { @apply tw:[grid-column:1_/_-1]; @apply tw:[margin:0]; @apply tw:[color:#4f6f38]; @apply tw:[font-size:0.76rem]; @apply tw:[font-weight:600]; }
.lesson-reader-hint { @apply tw:inline-flex; @apply tw:items-center; @apply tw:justify-end; @apply tw:[gap:0.45rem]; @apply tw:[color:#4f6f38]; @apply tw:[font-size:0.74rem]; @apply tw:[font-weight:750]; }
.lesson-feed-status.is-completed { @apply tw:[background:#dcfce7]; @apply tw:[color:#166534]; }
.lesson-feed-status.is-in-progress { @apply tw:[background:#fef3c7]; @apply tw:[color:#92400e]; }

@media (max-width: 760px) {
  .lesson-progress-card { @apply tw:[grid-template-columns:1fr]; }
}

.lesson-pagination, .lesson-pagination-controls {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:flex-wrap;
  @apply tw:[gap:.75rem];
}
.lesson-pagination { @apply tw:[margin-top:1rem]; @apply tw:[color:#64748b]; @apply tw:[font-size:.875rem]; }
.lesson-pagination-controls button {
  @apply tw:[padding:.5rem_.85rem];
  @apply tw:[border:1px_solid_#d8e1ef];
  @apply tw:[border-radius:8px];
  @apply tw:[background:#fff];
  @apply tw:[color:#2563eb];
  @apply tw:[font:inherit];
  @apply tw:[font-weight:600];
  @apply tw:cursor-pointer;
}
.lesson-pagination-controls button:disabled { @apply tw:[opacity:.45]; @apply tw:cursor-default; }
.lesson-pagination-controls button:focus-visible { @apply tw:[outline:2px_solid_#2563eb]; @apply tw:[outline-offset:2px]; }

.section-card {
  @apply tw:[margin-bottom:1rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[border-radius:14px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
  @apply tw:[padding:0.9rem];
}

.section-head h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:1rem];
}

.empty-copy {
  @apply tw:[margin:0.75rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.84rem];
}

.classes-empty-state {
  @apply tw:[margin-top:0.85rem];
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.9rem];
  @apply tw:[align-items:start];
  @apply tw:[padding:1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(255,_213,_66,_0.12),_transparent_32%),______linear-gradient(180deg,_#fffef8_0%,_#f9fce8_100%)];
}

.classes-empty-icon {
  @apply tw:[width:52px];
  @apply tw:[height:52px];
  @apply tw:[border-radius:16px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:linear-gradient(135deg,_#f4f7d8_0%,_#eef6c0_100%)];
  @apply tw:[color:#4f6314];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(169,_213,_95,_0.55)];
  @apply tw:[font-size:1.1rem];
}

.classes-empty-copy {
  @apply tw:grid;
  @apply tw:[gap:0.32rem];
}

.classes-empty-copy strong {
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:0.96rem];
  @apply tw:[line-height:1.3];
}

.classes-empty-copy p {
  @apply tw:[margin:0];
  @apply tw:[color:#4d6120];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.55];
}

.subjects-grid {
  @apply tw:[margin-top:0.8rem];
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(220px,_1fr))];
  @apply tw:[gap:0.85rem];
}

.subject-card {
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:0.9rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
  @apply tw:cursor-pointer;
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease,_background-color_0.2s_ease,_transform_0.2s_ease];
}

.subject-card:hover {
  @apply tw:[transform:translateY(-1px)];
}

.subject-card:focus-visible {
  @apply tw:[outline:3px_solid_rgba(95,_116,_24,_0.2)];
  @apply tw:[outline-offset:2px];
}

.subject-card.active {
  @apply tw:[border-color:transparent];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
  @apply tw:[box-shadow:0_14px_30px_rgba(30,_67,_7,_0.12)];
}

.subject-card-head {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.subject-card-head strong {
  @apply tw:[color:#1e4307];
}

.subject-card-head small,
.subject-teacher {
  @apply tw:block;
  @apply tw:[margin-top:0.2rem];
  @apply tw:[color:#637227];
  @apply tw:[font-size:0.74rem];
}

.subject-status {
  @apply tw:self-start;
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.2rem_0.6rem];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
}

.subject-status.approved {
  @apply tw:[background:#e8f4c7];
  @apply tw:[color:#1e4307];
}

.subject-card.active .subject-status.approved {
  @apply tw:[background:#d8ec9f];
  @apply tw:[color:#1e4307];
}

.subject-metrics {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.55rem];
  @apply tw:[margin-top:0.7rem];
  @apply tw:[color:#4d6120];
  @apply tw:[font-size:0.82rem];
}

.subject-card-hint {
  @apply tw:[margin:0.65rem_0_0];
  @apply tw:[color:#5f7418];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
}

.pending-subjects {
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_#fde68a];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(245,_158,_11,_0.08),_transparent_34%),______linear-gradient(180deg,_#fffdf5_0%,_#fffbeb_100%)];
}

.pending-subjects-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.pending-subjects-label {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
  @apply tw:[color:#b45309];
}

.pending-count {
  @apply tw:[min-width:34px];
  @apply tw:[height:34px];
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#fcd34d];
  @apply tw:[color:#92400e];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:800];
}

.pending-subjects h4 {
  @apply tw:[margin:0.18rem_0_0];
  @apply tw:[color:#0f172a];
}

.pending-subjects-copy {
  @apply tw:[margin:0.55rem_0_0];
  @apply tw:[color:#92400e];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.5];
}

.pending-list {
  @apply tw:[margin:0.85rem_0_0];
  @apply tw:[padding:0];
  @apply tw:[list-style:none];
  @apply tw:grid;
  @apply tw:[gap:0.65rem];
}

.pending-list li {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[column-gap:0.5rem];
  @apply tw:[row-gap:0.14rem];
  @apply tw:[align-items:start];
  @apply tw:[padding:0.82rem_0.88rem];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_rgba(252,_211,_77,_0.55)];
  @apply tw:[background:rgba(255,_255,_255,_0.82)];
}

.pending-list li::before {
  @apply tw:[content:'\f252'];
  @apply tw:[font-family:'Font_Awesome_5_Free'];
  @apply tw:[font-weight:900];
  @apply tw:[width:38px];
  @apply tw:[height:38px];
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#fef3c7];
  @apply tw:[color:#b45309];
  @apply tw:[font-size:0.88rem];
}

.pending-list strong {
  @apply tw:block;
  @apply tw:[color:#0f172a];
  @apply tw:[line-height:1.3];
}

.pending-list small {
  @apply tw:block;
  @apply tw:[grid-column:2];
  @apply tw:[margin-top:0.18rem];
  @apply tw:[color:#92400e];
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.45];
}

.active-courses-section {
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:0.9rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
}

.section-title,
.section-title .highlight {
  @apply tw:[color:#1e4307];
}

.section-subtitle {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#4d6120];
  @apply tw:[font-size:0.86rem];
}

.section-header {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:items-start;
  @apply tw:[gap:1rem];
}

.active-subject-banner {
  @apply tw:[margin-top:0.85rem];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f8fafc];
  @apply tw:[padding:0.8rem_0.9rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.85rem];
}

.active-subject-copy {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.active-subject-label {
  @apply tw:[color:#5f7418];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.active-subject-copy strong {
  @apply tw:[color:#1e4307];
}

.active-subject-copy small {
  @apply tw:[color:#637227];
  @apply tw:[font-size:0.78rem];
}

.active-subject-count {
  @apply tw:shrink-0;
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.52)];
  @apply tw:[background:rgba(255,_253,_241,_0.92)];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[padding:0.3rem_0.6rem];
}

.join-class-trigger {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border:1px_solid_rgba(95,_116,_24,_0.32)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:linear-gradient(135deg,_#4f8a35,_#4f7d3a)];
  @apply tw:[color:#ffffff]!;
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:cursor-pointer;
  @apply tw:[box-shadow:0_10px_24px_rgba(30,_67,_7,_0.18)];
}

.join-class-trigger i {
  @apply tw:[color:#ffffff]!;
}

.auto-access-note {
  @apply tw:[margin-top:0.75rem];
  @apply tw:[border:1px_solid_#bfdbfe];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1e3a8a];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.7rem_0.85rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
}

.courses-lessons-feed-wrap {
  @apply tw:[margin-top:0.85rem];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:0.8rem];
  @apply tw:[background:#fcfcfc];
}

.feed-state {
  @apply tw:[min-height:180px];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.6rem];
  @apply tw:[color:#4d6120];
  @apply tw:[font-weight:600];
}

.lessons-feed {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.55rem];
}

.lesson-feed-card {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.38)];
  @apply tw:[background:linear-gradient(180deg,_#fffef8_0%,_#f8fbe8_100%)];
  @apply tw:[border-radius:14px];
  @apply tw:overflow-hidden;
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease,_background-color_0.2s_ease];
}

.lesson-feed-card:hover,
.lesson-feed-card.active {
  @apply tw:[border-color:#7ca51f];
  @apply tw:[background:linear-gradient(180deg,_#fbfde9_0%,_#f1f6cf_100%)];
  @apply tw:[box-shadow:0_10px_24px_rgba(30,_67,_7,_0.1)];
}

.lesson-feed-trigger {
  @apply tw:w-full;
  @apply tw:[border:none];
  @apply tw:[background:transparent];
  @apply tw:[padding:0.75rem];
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_1fr_auto_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
}

.lesson-feed-icon {
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#324409];
  @apply tw:[color:#fff];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[font-size:0.95rem];
  @apply tw:shrink-0;
}

.lesson-feed-copy {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.lesson-feed-copy strong {
  @apply tw:[font-size:0.95rem];
  @apply tw:[color:#1e4307];
  @apply tw:[line-height:1.25];
  @apply tw:whitespace-nowrap;
  @apply tw:overflow-hidden;
  @apply tw:text-ellipsis;
}

.lesson-feed-copy small {
  @apply tw:[font-size:0.8rem];
  @apply tw:[color:#637227];
}

.lesson-feed-status {
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:rgba(255,_253,_241,_0.92)];
  @apply tw:[color:#4d6120];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.64rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.03em];
  @apply tw:uppercase;
  @apply tw:[padding:0.18rem_0.45rem];
  @apply tw:whitespace-nowrap;
}

.lesson-feed-status.new {
  @apply tw:[border-color:rgba(95,_116,_24,_0.42)];
  @apply tw:[background:#e8f4c7];
  @apply tw:[color:#1e4307];
}

.lesson-feed-more {
  @apply tw:[color:#4d6120];
  @apply tw:[font-size:0.9rem];
}

.lesson-detail-panel {
  @apply tw:[border-top:1px_solid_rgba(169,_213,_95,_0.35)];
  @apply tw:[background:#fffefb];
  @apply tw:[padding:0.85rem_0.9rem_0.9rem];
}

.lesson-detail-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.65rem];
}

.lesson-detail-header h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:1rem];
}

.lesson-detail-header p {
  @apply tw:[margin:0.2rem_0_0];
  @apply tw:[color:#637227];
  @apply tw:[font-size:0.8rem];
}

.lesson-detail-attachments {
  @apply tw:[margin-top:0.85rem];
}

.lesson-detail-attachments h4 {
  @apply tw:[margin:0_0_0.45rem];
  @apply tw:[color:#4d6120];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
}

.status-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.68rem];
  @apply tw:[padding:0.2rem_0.5rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.03em];
  @apply tw:uppercase;
}

.status-badge.new {
  @apply tw:[border:1px_solid_rgba(95,_116,_24,_0.42)];
  @apply tw:[background:#e8f4c7];
  @apply tw:[color:#1e4307];
}

.status-badge.published {
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:rgba(255,_253,_241,_0.92)];
  @apply tw:[color:#4d6120]!;
  @apply tw:[-webkit-text-fill-color:#4d6120]!;
}

.lesson-attachment-list {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.55rem];
}

.lesson-attachment-card {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[padding:0.55rem_0.6rem];
  @apply tw:[border-radius:14px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:#fffef8];
}

.lesson-attachment-link {
  @apply tw:[color:#1e4307];
  @apply tw:text-left;
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:[min-width:0];
  @apply tw:[flex:1];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
}

.lesson-attachment-link span {
  @apply tw:grid;
  @apply tw:[gap:0.12rem];
  @apply tw:[min-width:0];
}

.lesson-attachment-link strong {
  @apply tw:overflow-hidden;
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.lesson-attachment-link small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.67rem];
  @apply tw:[font-weight:600];
}

.lesson-read-action {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.48rem];
  @apply tw:shrink-0;
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.55rem_0.9rem];
  @apply tw:[border:1px_solid_#4f8a35];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#4f8a35];
  @apply tw:[color:#fff];
  @apply tw:cursor-pointer;
  @apply tw:[font:inherit];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[transition:transform_160ms_ease,_background_160ms_ease,_box-shadow_160ms_ease];
}

.lesson-read-action:hover:not(:disabled) { @apply tw:[transform:translateY(-1px)]; @apply tw:[background:#3f762b]; @apply tw:[box-shadow:0_8px_18px_rgba(79,_138,_53,_0.22)]; }
.lesson-read-action:disabled { @apply tw:[border-color:#cbd5e1]; @apply tw:[background:#e2e8f0]; @apply tw:[color:#64748b]; @apply tw:cursor-not-allowed; }

.lessons-page.is-standalone-reader {
  @apply tw:[min-height:100dvh];
  @apply tw:overflow-hidden;
}

.lessons-page.is-standalone-reader > .lessons-page-hero,
.lessons-page.is-standalone-reader > .lessons-workspace {
  @apply tw:hidden;
}

.lesson-preview-modal {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:2147483000];
  @apply tw:[background:rgba(15,_23,_42,_0.7)];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:1rem];
}

.lesson-preview-modal.is-standalone-reader {
  @apply tw:items-stretch;
  @apply tw:w-screen;
  @apply tw:[height:100dvh];
  @apply tw:[padding:0];
  @apply tw:[background:#0f172a];
}

.lesson-preview-dialog {
  @apply tw:[width:min(100%,_980px)];
  @apply tw:[max-height:calc(100vh_-_2rem)];
  @apply tw:grid;
  @apply tw:[grid-template-rows:auto_minmax(0,_1fr)_auto];
  @apply tw:[border-radius:20px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_30px_70px_rgba(15,_23,_42,_0.3)];
  @apply tw:overflow-hidden;
}

.lesson-preview-modal.is-standalone-reader .lesson-preview-dialog {
  @apply tw:w-full;
  @apply tw:[height:100dvh];
  @apply tw:max-h-none;
  @apply tw:[min-height:100dvh];
  @apply tw:[border:0];
  @apply tw:rounded-none;
  @apply tw:[box-shadow:none];
}

.lesson-preview-head,
.lesson-preview-copy {
  @apply tw:grid;
}

.lesson-preview-head {
  @apply tw:[grid-template-columns:minmax(0,_1fr)_auto];
  @apply tw:[gap:1rem];
  @apply tw:[padding:1rem_1.1rem_0.9rem];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
}

.lesson-preview-copy {
  @apply tw:[gap:0.24rem];
}

.lesson-preview-label {
  @apply tw:[color:#2563eb];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.lesson-preview-copy h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1rem];
}

.lesson-preview-copy p {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
}

.lesson-reader-close {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:38px];
  @apply tw:[height:38px];
  @apply tw:[border-radius:50%];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.9rem];
  @apply tw:cursor-pointer;
}

.lesson-reader-close:hover { @apply tw:[background:#eef2f7]; @apply tw:[color:#0f172a]; }

.lesson-preview-body {
  @apply tw:[min-height:0];
  @apply tw:[background:#f8fafc];
}

.lesson-preview-pdf,
.lesson-preview-image {
  @apply tw:w-full;
  @apply tw:[height:min(72vh,_760px)];
  @apply tw:[border:none];
  @apply tw:block;
  @apply tw:[background:#ffffff];
}

.lesson-preview-image {
  @apply tw:object-contain;
}

.lesson-preview-empty {
  @apply tw:[min-height:320px];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-weight:700];
}

.lesson-preview-error { @apply tw:[color:#b42318]; @apply tw:text-center; }

.lesson-preview-footer {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding:0.85rem_1.1rem_1rem];
  @apply tw:[border-top:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
}

.lesson-preview-modal.is-standalone-reader .lesson-preview-pdf,
.lesson-preview-modal.is-standalone-reader .lesson-preview-image {
  @apply tw:h-full;
  @apply tw:[min-height:0];
}

.lesson-reader-progress { @apply tw:grid; @apply tw:[gap:0.16rem]; @apply tw:[min-width:0]; }
.lesson-reader-progress__topline { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:1rem]; }
.lesson-reader-progress__topline b { @apply tw:[color:#1e4307]; @apply tw:[font-size:0.84rem]; }
.lesson-reader-progress__track { @apply tw:[width:min(30rem,_46vw)]; @apply tw:[height:8px]; @apply tw:overflow-hidden; @apply tw:[border-radius:999px]; @apply tw:[background:#dce5d8]; }
.lesson-reader-progress__track span { @apply tw:block; @apply tw:h-full; @apply tw:[border-radius:inherit]; @apply tw:[background:linear-gradient(90deg,_#4f8a35,_#8fc867)]; @apply tw:[transition:width_300ms_ease]; }
.lesson-reader-progress strong { @apply tw:[color:#1e4307]; @apply tw:[font-size:0.8rem]; }
.lesson-reader-progress span { @apply tw:[color:#64748b]; @apply tw:[font-size:0.72rem]; }
.lesson-reader-progress small { @apply tw:[color:#b45309]; @apply tw:[font-size:0.7rem]; @apply tw:[font-weight:650]; }

.join-class-modal {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:1200];
  @apply tw:[background:rgba(15,_23,_42,_0.58)];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:1rem];
}

.join-class-dialog {
  @apply tw:[width:min(100%,_480px)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[box-shadow:0_24px_70px_rgba(15,_23,_42,_0.26)];
  @apply tw:overflow-hidden;
}

.join-class-dialog-head {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1.1rem_1.15rem_0.9rem];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
}

.join-class-dialog-head h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
}

.join-class-dialog-head p {
  @apply tw:[margin:0.3rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.88rem];
}

.join-class-dialog-body {
  @apply tw:[padding:1rem_1.15rem_0];
}

.join-class-field {
  @apply tw:grid;
  @apply tw:[gap:0.4rem];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:600];
}

.join-class-field input {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.8rem_0.9rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font:inherit];
}

.join-class-feedback {
  @apply tw:[margin:0.85rem_0_0];
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-weight:600];
}

.join-class-feedback.success {
  @apply tw:[color:#15803d];
}

.join-class-feedback.error {
  @apply tw:[color:#b91c1c];
}

.join-class-dialog-actions {
  @apply tw:flex;
  @apply tw:justify-end;
  @apply tw:[gap:0.65rem];
  @apply tw:[padding:1rem_1.15rem_1.15rem];
}

.join-class-dialog-actions .btn-primary,
.join-class-dialog-actions .btn-primary:hover:not(:disabled),
.join-class-dialog-actions .btn-outline,
.join-class-dialog-actions .btn-outline:hover:not(:disabled) {
  @apply tw:[background:linear-gradient(135deg,_#4f8a35,_#4f7d3a)]!;
  @apply tw:[border-color:#4f8a35]!;
  @apply tw:[color:#ffffff]!;
}

@media (max-width: 900px) {
  .lesson-feed-trigger {
    @apply tw:[grid-template-columns:auto_1fr_auto];
  }

  .lesson-feed-status {
    @apply tw:[grid-column:2_/_3];
    @apply tw:[justify-self:start];
  }

  .lesson-feed-more {
    @apply tw:[grid-column:3_/_4];
    @apply tw:[grid-row:1_/_3];
    @apply tw:self-center;
  }
}

@media (max-width: 768px) {
  .classes-empty-state {
    @apply tw:[grid-template-columns:1fr];
  }

  .pending-subjects-head {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .section-header {
    @apply tw:items-center;
  }

  .active-subject-banner {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .lesson-attachment-card {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .lesson-read-action { @apply tw:w-full; }

  .lesson-preview-footer {
    @apply tw:items-stretch;
    @apply tw:flex-col;
  }

  .lesson-preview-footer .lesson-complete-button { @apply tw:w-full; }

  .courses-lessons-feed-wrap {
    @apply tw:[padding:0.68rem];
  }

  .lesson-feed-card {
    @apply tw:[border-radius:12px];
  }

  .lesson-feed-trigger {
    @apply tw:[padding:0.66rem];
    @apply tw:[gap:0.56rem];
    @apply tw:[grid-template-columns:auto_1fr_auto];
  }

  .lesson-feed-icon {
    @apply tw:[width:36px];
    @apply tw:[height:36px];
    @apply tw:[font-size:0.86rem];
  }

  .lesson-feed-copy strong {
    @apply tw:[font-size:0.88rem];
  }

  .lesson-feed-copy small {
    @apply tw:[font-size:0.74rem];
  }

  .lesson-feed-status {
    @apply tw:[font-size:0.58rem];
    @apply tw:[padding:0.16rem_0.42rem];
  }

  .lesson-detail-panel {
    @apply tw:[padding:0.75rem];
  }

  .lesson-detail-header {
    @apply tw:flex-col;
    @apply tw:[gap:0.5rem];
  }

  .lesson-detail-header h3 {
    @apply tw:[font-size:0.92rem];
  }

  .lesson-detail-header p {
    @apply tw:[font-size:0.74rem];
  }

  .join-class-dialog-actions {
    @apply tw:flex-col-reverse;
  }
}

@media (max-width: 560px) {
  .classes-empty-state,
  .pending-subjects {
    @apply tw:[padding:0.85rem];
  }

  .pending-list li {
    @apply tw:[padding:0.72rem_0.76rem];
  }

  .lesson-feed-trigger {
    @apply tw:[grid-template-columns:auto_1fr_auto];
    @apply tw:[padding:0.6rem];
  }

  .lesson-feed-icon {
    @apply tw:[width:32px];
    @apply tw:[height:32px];
    @apply tw:[font-size:0.78rem];
  }

  .lesson-feed-copy strong {
    @apply tw:[font-size:0.82rem];
  }

  .lesson-feed-copy small {
    @apply tw:[font-size:0.7rem];
  }

  .lesson-feed-status {
    @apply tw:hidden;
  }

  .lesson-detail-panel {
    @apply tw:[padding:0.68rem];
  }

  .lesson-attachment-link {
    @apply tw:[font-size:0.68rem];
  }
}
/* Lessons workspace redesign */
.lessons-page {
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.lessons-page-hero {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:2rem];
  @apply tw:[min-height:12rem];
  @apply tw:[padding:clamp(1.4rem,_3vw,_2.25rem)];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.14)];
  @apply tw:[border-radius:20px];
  @apply tw:[background:radial-gradient(circle_at_78%_15%,_rgba(180,_216,_158,_0.23),_transparent_18rem),______linear-gradient(128deg,_#4f8a35_0%,_#245f00_52%,_#144300_100%)];
  @apply tw:[box-shadow:0_18px_42px_rgba(30,_67,_7,_0.18)];
}

.lessons-page-hero::after {
  @apply tw:absolute;
  @apply tw:[right:-4rem];
  @apply tw:[bottom:-7rem];
  @apply tw:[width:18rem];
  @apply tw:[height:18rem];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.1)];
  @apply tw:[border-radius:50%];
  @apply tw:[content:""];
  @apply tw:pointer-events-none;
}

.lessons-page-hero__copy {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:[max-width:48rem];
}

.lessons-page-eyebrow,
.section-kicker {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[color:#6a8428]!;
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.09em];
  @apply tw:uppercase;
}

.lessons-page-eyebrow,
.lessons-page-eyebrow i {
  @apply tw:[color:#dcefd2]!;
  @apply tw:[-webkit-text-fill-color:#dcefd2]!;
}

.lessons-page-hero h1 {
  @apply tw:[margin:0.4rem_0_0];
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:[font-size:clamp(1.9rem,_3.4vw,_2.75rem)];
  @apply tw:[letter-spacing:-0.045em];
  @apply tw:[line-height:1.08];
}

.lessons-page-hero__copy > p {
  @apply tw:[max-width:42rem];
  @apply tw:[margin:0.55rem_0_0];
  @apply tw:[color:#e4efde]!;
  @apply tw:[-webkit-text-fill-color:#e4efde]!;
  @apply tw:[font-size:0.9rem];
  @apply tw:[line-height:1.55];
}

.lessons-page-summary {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.55rem];
  @apply tw:[margin-top:0.9rem];
}

.lessons-page-summary span {
  @apply tw:[padding:0.42rem_0.7rem];
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.16)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.1)];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:650];
}

.lessons-page-summary strong {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.lessons-page-hero .join-class-trigger {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:w-auto;
  @apply tw:h-auto;
  @apply tw:[min-height:3rem];
  @apply tw:flex-none;
  @apply tw:[gap:0.55rem];
  @apply tw:[padding:0.75rem_1rem];
  @apply tw:[border-radius:12px];
  @apply tw:whitespace-nowrap;
}

.lessons-page-hero .join-class-trigger span,
.lessons-page-hero .join-class-trigger i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.lessons-workspace {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(17.5rem,_0.72fr)_minmax(0,_1.7fr)];
  @apply tw:[gap:1rem];
  @apply tw:[align-items:start];
}

.lessons-page .section-card,
.lessons-page .active-courses-section {
  @apply tw:[margin:0];
  @apply tw:[padding:1.15rem];
  @apply tw:[border:1px_solid_#dfe8da]!;
  @apply tw:[border-radius:18px];
  @apply tw:[background:#ffffff]!;
  @apply tw:[box-shadow:0_10px_28px_rgba(30,_67,_7,_0.06)];
}

.lessons-page .section-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding-bottom:0.9rem];
  @apply tw:[border-bottom:1px_solid_#e6ede2];
}

.lessons-page .section-head h2,
.lessons-page .section-title {
  @apply tw:[margin:0.25rem_0_0];
  @apply tw:[color:#18320d]!;
  @apply tw:[font-size:1.25rem];
  @apply tw:[letter-spacing:-0.025em];
}

.lessons-page .section-head p {
  @apply tw:[margin:0.25rem_0_0];
  @apply tw:[color:#6d7969]!;
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.4];
}

.section-count {
  @apply tw:inline-grid;
  @apply tw:[width:2rem];
  @apply tw:[height:2rem];
  @apply tw:flex-none;
  @apply tw:place-items-center;
  @apply tw:[color:#1e4307]!;
  @apply tw:[border-radius:10px];
  @apply tw:[background:#e7f1e1];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:800];
}

.lessons-page .subjects-grid {
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:0.65rem];
  @apply tw:[margin-top:0.8rem];
}

.lessons-page .subject-card {
  @apply tw:relative;
  @apply tw:[padding:0.9rem];
  @apply tw:[border:1px_solid_#e2e9de];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#fbfdf9];
  @apply tw:[box-shadow:none];
}

.lessons-page .subject-card:hover {
  @apply tw:[border-color:#adc69f];
  @apply tw:[background:#f7fbf4];
  @apply tw:[box-shadow:0_8px_20px_rgba(30,_67,_7,_0.08)];
}

.lessons-page .subject-card.active {
  @apply tw:[padding-left:1rem];
  @apply tw:[border-color:#6f9d58];
  @apply tw:[background:linear-gradient(135deg,_#f1f7ed_0%,_#ffffff_100%)];
  @apply tw:[box-shadow:0_10px_24px_rgba(30,_67,_7,_0.1)];
}

.lessons-page .subject-card-head strong {
  @apply tw:[color:#18320d]!;
  @apply tw:[font-size:0.9rem];
  @apply tw:[line-height:1.3];
}

.lessons-page .subject-status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.3rem];
  @apply tw:[color:#1e4307]!;
  @apply tw:[background:#e7f1e1];
  @apply tw:[font-size:0.64rem];
}

.lessons-page .subject-status i {
  @apply tw:[color:#1e4307]!;
  @apply tw:[-webkit-text-fill-color:#1e4307]!;
}

.lessons-page .subject-card.active .subject-status {
  @apply tw:[color:#ffffff]!;
  @apply tw:[background:#1e4307];
}

.lessons-page .subject-card.active .subject-status .subject-selected-check,
.lessons-page .subject-card.active .subject-status .subject-selected-check::before,
:global(body.student-dashboard .subject-selected-check),
:global(body.student-dashboard .subject-selected-check::before) {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.lessons-page .subject-metrics {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.4rem];
  @apply tw:[margin-top:0.75rem];
}

.lessons-page .subject-metrics span {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
  @apply tw:[min-width:0];
  @apply tw:[padding:0.45rem_0.35rem];
  @apply tw:[color:#556451]!;
  @apply tw:[border-radius:9px];
  @apply tw:[background:#f0f5ed];
  @apply tw:[font-size:0.62rem];
  @apply tw:[line-height:1.25];
  @apply tw:text-center;
}

.lessons-page .subject-metrics i {
  @apply tw:[color:#4f7d3a]!;
  @apply tw:[-webkit-text-fill-color:#4f7d3a]!;
  @apply tw:[font-size:0.72rem];
}

.lessons-page .subject-teacher {
  @apply tw:[color:#64705f]!;
}

.lessons-page .subject-card-hint {
  @apply tw:[margin-top:0.7rem];
  @apply tw:[padding-top:0.65rem];
  @apply tw:[color:#365f25]!;
  @apply tw:[border-top:1px_solid_#e3eae0];
  @apply tw:[font-size:0.68rem];
}

.lessons-page .section-header {
  @apply tw:[padding-bottom:0.9rem];
  @apply tw:[border-bottom:1px_solid_#e6ede2];
}

.lessons-page .section-subtitle {
  @apply tw:[max-width:48rem];
  @apply tw:[margin-top:0.3rem];
  @apply tw:[color:#6d7969]!;
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.45];
}

.lessons-page .active-subject-banner {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto];
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-top:0.8rem];
  @apply tw:[padding:0.8rem];
  @apply tw:[border-color:#d9e6d3];
  @apply tw:[background:#f7fbf4];
}

.active-subject-icon,
.feed-state-icon {
  @apply tw:inline-grid;
  @apply tw:[width:2.65rem];
  @apply tw:[height:2.65rem];
  @apply tw:flex-none;
  @apply tw:place-items-center;
  @apply tw:[color:#ffffff];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#1e4307];
}

.feed-state-icon {
  @apply tw:[background:#4f8a35];
}

.active-subject-icon i,
.feed-state-icon i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.lessons-page .active-subject-count {
  @apply tw:[border-color:#cbdcc3];
  @apply tw:[background:#ffffff];
}

.lessons-page .courses-lessons-feed-wrap {
  @apply tw:[min-height:18rem];
  @apply tw:[margin-top:0.8rem];
  @apply tw:[padding:0.7rem];
  @apply tw:[border-color:#e0e8dc];
  @apply tw:[background:#fafcf9];
}

.feed-state--empty {
  @apply tw:[min-height:16.5rem];
  @apply tw:flex-col;
  @apply tw:[gap:0.85rem];
  @apply tw:[padding:2rem];
  @apply tw:text-center;
}

.feed-state--empty .feed-state-icon {
  @apply tw:[width:3.5rem];
  @apply tw:[height:3.5rem];
  @apply tw:[border-radius:16px];
  @apply tw:[box-shadow:0_10px_24px_rgba(30,_67,_7,_0.16)];
}

.feed-state--empty > div {
  @apply tw:grid;
  @apply tw:[gap:0.35rem];
  @apply tw:[max-width:30rem];
}

.feed-state--empty strong {
  @apply tw:[color:#18320d]!;
  @apply tw:[font-size:1rem];
}

.feed-state--empty > div > span {
  @apply tw:[color:#6d7969]!;
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:500];
  @apply tw:[line-height:1.5];
}

@media (max-width: 1080px) {
  .lessons-workspace {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .lessons-page .subjects-grid {
    @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(15rem,_1fr))];
  }
}

@media (max-width: 680px) {
  .lessons-page-hero {
    @apply tw:flex-col;
    @apply tw:items-stretch;
    @apply tw:[gap:1.1rem];
    @apply tw:[min-height:auto];
    @apply tw:[padding:1.25rem];
  }

  .lessons-page-hero .join-class-trigger {
    @apply tw:w-full;
  }

  .lessons-page .section-card,
  .lessons-page .active-courses-section {
    @apply tw:[padding:0.9rem];
    @apply tw:[border-radius:15px];
  }

  .lessons-page .subjects-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .lessons-page .active-subject-banner {
    @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  }

  .lessons-page .active-subject-count {
    @apply tw:[grid-column:2];
    @apply tw:w-fit;
  }

  .feed-state--empty {
    @apply tw:[min-height:13rem];
    @apply tw:[padding:1.25rem];
  }
}

/* Keep nested lesson surfaces dark even though this component's light styles are scoped. */
:global(.student-dashboard.student-theme-dark .lessons-page :is(
  .section-card,
  .active-courses-section
)) {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:0_12px_30px_rgba(0,_0,_0,_0.22)]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page :is(
  .section-head,
  .section-header
)) {
  @apply tw:[border-color:#34483b]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page :is(
  .classes-empty-state,
  .pending-subjects,
  .pending-list > li,
  .subject-card,
  .active-subject-banner,
  .courses-lessons-feed-wrap,
  .lesson-feed-card,
  .lesson-detail-panel,
  .lesson-progress-card,
  .lesson-attachment-card,
  .subject-metrics > span
)) {
  @apply tw:[background:#101913]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:none]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page :is(
  .classes-empty-icon,
  .section-count,
  .active-subject-count,
  .lesson-feed-status,
  .pending-count
)) {
  @apply tw:[background:#203127]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#e7efe9]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page .status-badge.published) {
  @apply tw:[background:#203127]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#e7efe9]!;
  @apply tw:[-webkit-text-fill-color:#e7efe9]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page .lesson-progress-icon) {
  @apply tw:[background:#26362b]!;
  @apply tw:[border:1px_solid_#496050];
  @apply tw:[color:#b9dfa5]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page .lesson-progress-icon i),
:global(.student-dashboard.student-theme-dark .lessons-page .lesson-progress-icon i::before) {
  @apply tw:[color:#b9dfa5]!;
  @apply tw:[-webkit-text-fill-color:#b9dfa5]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page :is(
  .section-head,
  .section-header,
  .subject-card-hint,
  .lesson-detail-panel
)) {
  @apply tw:[border-color:#34483b]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page :is(
  .classes-empty-copy strong,
  .subject-card-head strong,
  .lesson-feed-copy strong,
  .lesson-detail-header h3,
  .lesson-progress-copy strong
)) {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

:global(.student-dashboard.student-theme-dark .lessons-page :is(
  .classes-empty-copy p,
  .subject-card-head small,
  .subject-teacher,
  .lesson-feed-copy small,
  .lesson-detail-header p,
  .lesson-progress-copy small,
  .feed-state
)) {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

</style>
