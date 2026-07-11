<template>
  <div class="student-dashboard-page">
    <section class="section-card">
      <div class="section-head">
        <h3>My Classes</h3>
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
            <span class="subject-status approved">Approved</span>
          </div>
          <div class="subject-metrics">
            <span>{{ subject.lessonCount }} lessons</span>
            <span>{{ subject.assessmentCount }} assessments</span>
            <span>{{ Number(subject.performance?.averageScore || 0).toFixed(2) }}% avg</span>
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

    <section class="active-courses-section" data-tour="student-lessons-table">
      <div class="section-header">
        <div>
          <h2 class="section-title">
            <span class="highlight">Lessons</span>
          </h2>
          <p class="section-subtitle">{{ lessonsSectionSubtitle }}</p>
        </div>
        <button type="button" class="join-class-trigger" data-tour="student-join-class-button" @click="openJoinClassModal" aria-label="Join class">
          <i class="fas fa-plus" style="color: #ffffff !important;"></i>
        </button>
      </div>

      <div v-if="selectedSubject" class="active-subject-banner">
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

        <div v-else-if="visibleLessons.length === 0" class="feed-state">
          <i class="fas fa-book-open"></i>
          <span>{{ currentLessonsEmptyMessage }}</span>
        </div>

        <div v-else class="lessons-feed">
          <article
            v-for="lesson in visibleLessons"
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
              <span class="lesson-feed-status" :class="{ new: isRecentlyPublished(lesson.createdAt) }">
                {{ isRecentlyPublished(lesson.createdAt) ? 'New Lesson Available' : 'Published' }}
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

              <div v-if="Array.isArray(lesson.attachments) && lesson.attachments.length" class="lesson-detail-attachments">
                <h4>Attachments</h4>
                <div class="lesson-attachment-list">
                  <article
                    v-for="attachment in lesson.attachments"
                    :key="attachment.id"
                    class="lesson-attachment-card"
                  >
                    <button
                      type="button"
                      class="lesson-attachment-link"
                      @click="handleAttachmentAction(attachment)"
                    >
                      <i class="fas" :class="attachment.canPreviewInline ? 'fa-file-pdf' : 'fa-paperclip'"></i>
                      <span>{{ attachment.fileName || 'Attachment' }}</span>
                    </button>
                    <div class="lesson-attachment-actions">
                      <button
                        v-if="attachment.canPreviewInline && attachment.url"
                        type="button"
                        class="lesson-attachment-action secondary"
                        @click="openAttachmentPreview(attachment)"
                      >
                        Preview
                      </button>
                      <button
                        v-if="attachment.downloadUrl"
                        type="button"
                        class="lesson-attachment-action"
                        @click="downloadAttachment(attachment)"
                      >
                        Download
                      </button>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div
      v-if="previewAttachment"
      class="lesson-preview-modal"
      @click.self="closeAttachmentPreview"
    >
      <div class="lesson-preview-dialog">
        <div class="lesson-preview-head">
          <div class="lesson-preview-copy">
            <span class="lesson-preview-label">Attachment Preview</span>
            <h3>{{ previewAttachment.fileName || 'Attachment' }}</h3>
            <p>{{ previewAttachment.fileType || 'Preview available' }}</p>
          </div>
          <div class="lesson-preview-actions">
            <a
              v-if="previewAttachment.url"
              class="lesson-preview-action-link"
              :href="previewAttachment.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in new tab
            </a>
          </div>
        </div>

        <div class="lesson-preview-body">
          <iframe
            v-if="isPreviewPdf(previewAttachment)"
            :src="previewAttachment.url"
            :title="previewAttachment.fileName || 'Attachment preview'"
            class="lesson-preview-frame"
          ></iframe>
          <img
            v-else-if="isPreviewImage(previewAttachment)"
            :src="previewAttachment.url"
            :alt="previewAttachment.fileName || 'Attachment preview'"
            class="lesson-preview-image"
          >
          <div v-else class="lesson-preview-empty">
            <i class="fas fa-file-alt"></i>
            <span>Preview is not available for this file.</span>
          </div>
        </div>

        <div class="lesson-preview-footer">
          <button
            v-if="previewAttachment.downloadUrl"
            type="button"
            class="lesson-preview-download"
            @click="downloadAttachment(previewAttachment)"
          >
            <i class="fas fa-download"></i>
            Download file
          </button>
        </div>
      </div>
    </div>

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
import { useAuthStore } from '../../stores/auth.js'

const NEW_CONTENT_WINDOW_MS = 72 * 60 * 60 * 1000

export default {
  name: 'StudentLessons',
  data() {
    return {
      lessons: [],
      subjects: [],
      pendingSubjects: [],
      selectedSubjectId: '',
      selectedLessonId: null,
      previewAttachment: null,
      isLessonsLoading: false,
      lessonsEmptyMessage: 'No lessons available yet. Join a class and wait for teacher approval to access lesson materials.',
      hasLessonsLoadError: false,
      isJoinClassModalOpen: false,
      joinClassCode: '',
      isJoiningClass: false,
      joinClassMessage: '',
      joinClassMessageType: 'info',
      authStore: null,
      pendingTourAction: ''
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
  methods: {
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
      const token = this.authStore?.token || localStorage.getItem('edumatch_auth_token') || ''
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
    selectLesson(lesson) {
      if (!lesson?.id) return
      this.selectedLessonId = this.selectedLessonId === lesson.id ? null : lesson.id
    },
    handleAttachmentAction(attachment) {
      if (attachment?.canPreviewInline && attachment?.url) {
        this.openAttachmentPreview(attachment)
        return
      }
      this.downloadAttachment(attachment)
    },
    openAttachmentPreview(attachment) {
      if (!attachment?.url) return
      this.previewAttachment = attachment
    },
    closeAttachmentPreview() {
      this.previewAttachment = null
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
          attachments: Array.isArray(lesson.attachments) ? lesson.attachments : []
        }))
        this.hasLessonsLoadError = false
        this.lessonsEmptyMessage = 'No lessons available yet. Join a class and wait for teacher approval to access lesson materials.'
        this.syncSelectedSubject()
        this.syncSelectedLesson()
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
    },
    async downloadAttachment(attachment) {
      if (!attachment?.downloadUrl) return
      try {
        const response = await axios.get(attachment.downloadUrl, {
          ...this.getAuthConfig(),
          responseType: 'blob'
        })
        const fileName = attachment.fileName || 'attachment'
        const mimeType = attachment.fileType || 'application/octet-stream'
        const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }))
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(blobUrl)
      } catch (error) {
        console.error('[StudentLessons] Failed to download lesson attachment:', error)
      }
    }
  },
  mounted() {
    this.authStore = useAuthStore()
    window.addEventListener('edumatch-student-tour-focus', this.handleTourFocus)
    this.fetchLessons()
    this.fetchSubjects()
  },
  beforeUnmount() {
    window.removeEventListener('edumatch-student-tour-focus', this.handleTourFocus)
  }
}
</script>

<style scoped>
.section-card {
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 14px;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
  padding: 0.9rem;
}

.section-head h3 {
  margin: 0;
  color: #1e4307;
  font-size: 1rem;
}

.empty-copy {
  margin: 0.75rem 0 0;
  color: #64748b;
  font-size: 0.84rem;
}

.classes-empty-state {
  margin-top: 0.85rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  align-items: start;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid rgba(169, 213, 95, 0.42);
  background:
    radial-gradient(circle at top right, rgba(255, 213, 66, 0.12), transparent 32%),
    linear-gradient(180deg, #fffef8 0%, #f9fce8 100%);
}

.classes-empty-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f4f7d8 0%, #eef6c0 100%);
  color: #4f6314;
  box-shadow: inset 0 0 0 1px rgba(169, 213, 95, 0.55);
  font-size: 1.1rem;
}

.classes-empty-copy {
  display: grid;
  gap: 0.32rem;
}

.classes-empty-copy strong {
  color: #1e4307;
  font-size: 0.96rem;
  line-height: 1.3;
}

.classes-empty-copy p {
  margin: 0;
  color: #4d6120;
  font-size: 0.84rem;
  line-height: 1.55;
}

.subjects-grid {
  margin-top: 0.8rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.subject-card {
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 0.9rem;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.subject-card:hover {
  transform: translateY(-1px);
}

.subject-card:focus-visible {
  outline: 3px solid rgba(95, 116, 24, 0.2);
  outline-offset: 2px;
}

.subject-card.active {
  border-color: transparent;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
  box-shadow: 0 14px 30px rgba(30, 67, 7, 0.12);
}

.subject-card-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.subject-card-head strong {
  color: #1e4307;
}

.subject-card-head small,
.subject-teacher {
  display: block;
  margin-top: 0.2rem;
  color: #637227;
  font-size: 0.74rem;
}

.subject-status {
  align-self: flex-start;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.subject-status.approved {
  background: #e8f4c7;
  color: #1e4307;
}

.subject-card.active .subject-status.approved {
  background: #d8ec9f;
  color: #1e4307;
}

.subject-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.7rem;
  color: #4d6120;
  font-size: 0.82rem;
}

.subject-card-hint {
  margin: 0.65rem 0 0;
  color: #5f7418;
  font-size: 0.74rem;
  font-weight: 700;
}

.pending-subjects {
  margin-top: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  border: 1px solid #fde68a;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 34%),
    linear-gradient(180deg, #fffdf5 0%, #fffbeb 100%);
}

.pending-subjects-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.pending-subjects-label {
  display: inline-flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b45309;
}

.pending-count {
  min-width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #fcd34d;
  color: #92400e;
  font-size: 0.8rem;
  font-weight: 800;
}

.pending-subjects h4 {
  margin: 0.18rem 0 0;
  color: #0f172a;
}

.pending-subjects-copy {
  margin: 0.55rem 0 0;
  color: #92400e;
  font-size: 0.8rem;
  line-height: 1.5;
}

.pending-list {
  margin: 0.85rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.65rem;
}

.pending-list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 0.5rem;
  row-gap: 0.14rem;
  align-items: start;
  padding: 0.82rem 0.88rem;
  border-radius: 16px;
  border: 1px solid rgba(252, 211, 77, 0.55);
  background: rgba(255, 255, 255, 0.82);
}

.pending-list li::before {
  content: '\f252';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  color: #b45309;
  font-size: 0.88rem;
}

.pending-list strong {
  display: block;
  color: #0f172a;
  line-height: 1.3;
}

.pending-list small {
  display: block;
  grid-column: 2;
  margin-top: 0.18rem;
  color: #92400e;
  font-size: 0.76rem;
  line-height: 1.45;
}

.active-courses-section {
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 0.9rem;
  background:
    linear-gradient(180deg, #ffffff 0%, #ffffff 100%) padding-box,
    linear-gradient(135deg, #1e4307 0%, #ffd542 42%, #bbff59 100%) border-box;
}

.section-title,
.section-title .highlight {
  color: #1e4307;
}

.section-subtitle {
  margin: 0.35rem 0 0;
  color: #4d6120;
  font-size: 0.86rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.active-subject-banner {
  margin-top: 0.85rem;
  border: 1px solid rgba(169, 213, 95, 0.42);
  border-radius: 14px;
  background: #f8fafc;
  padding: 0.8rem 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.active-subject-copy {
  display: grid;
  gap: 0.18rem;
}

.active-subject-label {
  color: #5f7418;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.active-subject-copy strong {
  color: #1e4307;
}

.active-subject-copy small {
  color: #637227;
  font-size: 0.78rem;
}

.active-subject-count {
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgba(169, 213, 95, 0.52);
  background: rgba(255, 253, 241, 0.92);
  color: #1e4307;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.3rem 0.6rem;
}

.join-class-trigger {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(95, 116, 24, 0.32);
  border-radius: 999px;
  background: linear-gradient(135deg, #1e4307 0%, #5f7418 100%);
  color: #ffffff !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(30, 67, 7, 0.18);
}

.join-class-trigger i {
  color: #ffffff !important;
}

.auto-access-note {
  margin-top: 0.75rem;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1e3a8a;
  border-radius: 12px;
  padding: 0.7rem 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.courses-lessons-feed-wrap {
  margin-top: 0.85rem;
  border: 1px solid rgba(169, 213, 95, 0.42);
  border-radius: 14px;
  padding: 0.8rem;
  background: #fcfcfc;
}

.feed-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: #4d6120;
  font-weight: 600;
}

.lessons-feed {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.lesson-feed-card {
  width: 100%;
  border: 1px solid rgba(169, 213, 95, 0.38);
  background: linear-gradient(180deg, #fffef8 0%, #f8fbe8 100%);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.lesson-feed-card:hover,
.lesson-feed-card.active {
  border-color: #7ca51f;
  background: linear-gradient(180deg, #fbfde9 0%, #f1f6cf 100%);
  box-shadow: 0 10px 24px rgba(30, 67, 7, 0.1);
}

.lesson-feed-trigger {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 0.7rem;
  text-align: left;
  cursor: pointer;
}

.lesson-feed-icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #324409;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.lesson-feed-copy {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}

.lesson-feed-copy strong {
  font-size: 0.95rem;
  color: #1e4307;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-feed-copy small {
  font-size: 0.8rem;
  color: #637227;
}

.lesson-feed-status {
  border: 1px solid rgba(169, 213, 95, 0.42);
  background: rgba(255, 253, 241, 0.92);
  color: #4d6120;
  border-radius: 999px;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 0.18rem 0.45rem;
  white-space: nowrap;
}

.lesson-feed-status.new {
  border-color: rgba(95, 116, 24, 0.42);
  background: #e8f4c7;
  color: #1e4307;
}

.lesson-feed-more {
  color: #4d6120;
  font-size: 0.9rem;
}

.lesson-detail-panel {
  border-top: 1px solid rgba(169, 213, 95, 0.35);
  background: #fffefb;
  padding: 0.85rem 0.9rem 0.9rem;
}

.lesson-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
}

.lesson-detail-header h3 {
  margin: 0;
  color: #1e4307;
  font-size: 1rem;
}

.lesson-detail-header p {
  margin: 0.2rem 0 0;
  color: #637227;
  font-size: 0.8rem;
}

.lesson-detail-attachments {
  margin-top: 0.85rem;
}

.lesson-detail-attachments h4 {
  margin: 0 0 0.45rem;
  color: #4d6120;
  font-size: 0.82rem;
  font-weight: 700;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 0.68rem;
  padding: 0.2rem 0.5rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.status-badge.new {
  border: 1px solid rgba(95, 116, 24, 0.42);
  background: #e8f4c7;
  color: #1e4307;
}

.status-badge.published {
  border: 1px solid rgba(169, 213, 95, 0.42);
  background: rgba(255, 253, 241, 0.92);
  color: #4d6120;
}

.lesson-attachment-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.lesson-attachment-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.6rem;
  border-radius: 14px;
  border: 1px solid rgba(169, 213, 95, 0.42);
  background: #fffef8;
}

.lesson-attachment-link {
  border: none;
  background: transparent;
  color: #1e4307;
  text-align: left;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0;
  min-width: 0;
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.lesson-attachment-link:hover {
  color: #163304;
}

.lesson-attachment-link span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lesson-attachment-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.lesson-attachment-action {
  border: 1px solid rgba(169, 213, 95, 0.42);
  background: #f4f7d8;
  color: #1e4307;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.28rem 0.62rem;
}

.lesson-attachment-action.secondary {
  border-color: rgba(169, 213, 95, 0.38);
  background: #fffef8;
  color: #4d6120;
}

.lesson-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 1250;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.lesson-preview-dialog {
  width: min(100%, 980px);
  max-height: calc(100vh - 2rem);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.3);
  overflow: hidden;
}

.lesson-preview-head,
.lesson-preview-actions,
.lesson-preview-copy {
  display: grid;
}

.lesson-preview-head {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  padding: 1rem 1.1rem 0.9rem;
  border-bottom: 1px solid #e2e8f0;
}

.lesson-preview-copy {
  gap: 0.24rem;
}

.lesson-preview-label {
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.lesson-preview-copy h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
}

.lesson-preview-copy p {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
}

.lesson-preview-actions {
  grid-auto-flow: column;
  align-items: start;
  gap: 0.55rem;
}

.lesson-preview-action-link,
.lesson-preview-download {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  min-height: 38px;
  padding: 0.55rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.lesson-preview-body {
  min-height: 0;
  background: #f8fafc;
}

.lesson-preview-frame,
.lesson-preview-image {
  width: 100%;
  height: min(72vh, 760px);
  border: none;
  display: block;
  background: #ffffff;
}

.lesson-preview-image {
  object-fit: contain;
}

.lesson-preview-empty {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  color: #64748b;
  font-weight: 700;
}

.lesson-preview-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.85rem 1.1rem 1rem;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.join-class-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.58);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.join-class-dialog {
  width: min(100%, 480px);
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #dbe4ef;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.26);
  overflow: hidden;
}

.join-class-dialog-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.15rem 0.9rem;
  border-bottom: 1px solid #e2e8f0;
}

.join-class-dialog-head h3 {
  margin: 0;
  color: #0f172a;
}

.join-class-dialog-head p {
  margin: 0.3rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
}

.join-class-dialog-body {
  padding: 1rem 1.15rem 0;
}

.join-class-field {
  display: grid;
  gap: 0.4rem;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 600;
}

.join-class-field input {
  width: 100%;
  border: 1px solid #dbe4ef;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  color: #0f172a;
  font: inherit;
}

.join-class-feedback {
  margin: 0.85rem 0 0;
  font-size: 0.84rem;
  font-weight: 600;
}

.join-class-feedback.success {
  color: #15803d;
}

.join-class-feedback.error {
  color: #b91c1c;
}

.join-class-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 1rem 1.15rem 1.15rem;
}

@media (max-width: 900px) {
  .lesson-feed-trigger {
    grid-template-columns: auto 1fr auto;
  }

  .lesson-feed-status {
    grid-column: 2 / 3;
    justify-self: start;
  }

  .lesson-feed-more {
    grid-column: 3 / 4;
    grid-row: 1 / 3;
    align-self: center;
  }
}

@media (max-width: 768px) {
  .classes-empty-state {
    grid-template-columns: 1fr;
  }

  .pending-subjects-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-header {
    align-items: center;
  }

  .active-subject-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .lesson-attachment-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .lesson-attachment-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .lesson-preview-head {
    grid-template-columns: minmax(0, 1fr);
  }

  .lesson-preview-actions {
    grid-auto-flow: row;
    justify-items: start;
  }

  .courses-lessons-feed-wrap {
    padding: 0.68rem;
  }

  .lesson-feed-card {
    border-radius: 12px;
  }

  .lesson-feed-trigger {
    padding: 0.66rem;
    gap: 0.56rem;
    grid-template-columns: auto 1fr auto;
  }

  .lesson-feed-icon {
    width: 36px;
    height: 36px;
    font-size: 0.86rem;
  }

  .lesson-feed-copy strong {
    font-size: 0.88rem;
  }

  .lesson-feed-copy small {
    font-size: 0.74rem;
  }

  .lesson-feed-status {
    font-size: 0.58rem;
    padding: 0.16rem 0.42rem;
  }

  .lesson-detail-panel {
    padding: 0.75rem;
  }

  .lesson-detail-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .lesson-detail-header h3 {
    font-size: 0.92rem;
  }

  .lesson-detail-header p {
    font-size: 0.74rem;
  }

  .join-class-dialog-actions {
    flex-direction: column-reverse;
  }
}

@media (max-width: 560px) {
  .classes-empty-state,
  .pending-subjects {
    padding: 0.85rem;
  }

  .pending-list li {
    padding: 0.72rem 0.76rem;
  }

  .lesson-feed-trigger {
    grid-template-columns: auto 1fr auto;
    padding: 0.6rem;
  }

  .lesson-feed-icon {
    width: 32px;
    height: 32px;
    font-size: 0.78rem;
  }

  .lesson-feed-copy strong {
    font-size: 0.82rem;
  }

  .lesson-feed-copy small {
    font-size: 0.7rem;
  }

  .lesson-feed-status {
    display: none;
  }

  .lesson-detail-panel {
    padding: 0.68rem;
  }

  .lesson-attachment-link {
    font-size: 0.68rem;
  }
}
</style>
