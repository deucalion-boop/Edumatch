<template>
  <div class="student-dashboard-page student-activity-response-page">
    <section class="activity-response-shell" data-tour="student-activities-table">
      <div class="section-header response-header">
        <div class="response-header-copy">
          <h2 class="section-title"><span class="highlight">Activities / Exams</span></h2>
          <p class="section-subtitle">
            Choose one task at a time, read the important details first, then submit your work or start the exam when you are ready.
          </p>
        </div>
      </div>

      <div v-if="notice.message" class="response-flash" :class="notice.type">
        <i class="fas" :class="notice.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
        <span>{{ notice.message }}</span>
      </div>

      <div class="response-shell-body">
        <div v-if="isLoading" class="workspace-state is-loading">
          <span class="workspace-state-icon" aria-hidden="true">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <strong class="workspace-state-title">Loading your classwork</strong>
          <span class="workspace-state-copy">Please wait while we prepare your activities and exams.</span>
        </div>

        <div v-else-if="assessments.length === 0" class="workspace-state is-empty">
          <span class="workspace-state-icon is-empty" aria-hidden="true">
            <i class="fas fa-clipboard-list"></i>
          </span>
          <strong class="workspace-state-title">No activities yet</strong>
          <span class="workspace-state-copy">{{ emptyStateMessage }}</span>
        </div>

        <template v-else>
          <aside class="activity-sidebar">
            <div class="activity-sidebar-head">
              <div class="activity-sidebar-copy">
                <span class="sidebar-step">Step 1</span>
                <h3>Choose your task</h3>
              </div>
              <span class="activity-sidebar-count">{{ assessments.length }}</span>
            </div>

            <div class="activity-list">
              <button
                v-for="assessment in assessments"
                :key="assessment.id"
                type="button"
                class="activity-list-card"
                :class="{ active: selectedAssessmentId === assessment.id }"
                @click="selectAssessment(assessment)"
              >
                <div class="activity-list-top">
                  <span class="activity-type-pill" :class="getAssessmentTypeClass(assessment)">
                    {{ getAssessmentTypeLabel(assessment) }}
                  </span>
                  <span class="activity-status-pill" :class="getAssessmentState(assessment).tone">
                    {{ getAssessmentState(assessment).label }}
                  </span>
                </div>

                <div class="activity-list-copy">
                  <strong>{{ assessment.title || 'Untitled Assessment' }}</strong>
                  <p>{{ getAssessmentContextTitle(assessment) }}</p>
                </div>

                <div class="activity-list-meta">
                  <span>
                    <i class="fas fa-user" aria-hidden="true"></i>
                    {{ getTeacherDisplayName(assessment) }}
                  </span>
                  <span>
                    <i class="fas fa-layer-group" aria-hidden="true"></i>
                    {{ getAssessmentSourceLabel(assessment) }}
                  </span>
                  <span>
                    <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                    {{ assessment.submissionDeadline ? formatDateTime(assessment.submissionDeadline) : 'No due date' }}
                  </span>
                </div>
              </button>
            </div>
          </aside>

          <section v-if="selectedAssessment" class="activity-workspace" data-tour="student-activity-detail">
            <article class="workspace-focus-card">
              <div class="workspace-focus-copy">
                <span class="card-eyebrow">Current Task</span>
                <h3>{{ selectedAssessment.title || 'Untitled Assessment' }}</h3>
                <p>{{ getSelectedAssessmentGuideCopy(selectedAssessment) }}</p>
              </div>
              <div class="workspace-focus-meta">
                <span class="activity-type-pill" :class="getAssessmentTypeClass(selectedAssessment)">
                  {{ getAssessmentTypeLabel(selectedAssessment) }}
                </span>
                <span class="answer-status-pill" :class="getAssessmentState(selectedAssessment).tone">
                  {{ getAssessmentState(selectedAssessment).label }}
                </span>
                <span class="workspace-focus-deadline" :class="getAssessmentState(selectedAssessment).tone">
                  <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                  {{ selectedAssessment.submissionDeadline ? getRemainingLabel(selectedAssessment.submissionDeadline) : 'No deadline set' }}
                </span>
              </div>
            </article>

            <div v-if="isClassroomTask(selectedAssessment)" class="workspace-grid">
              <article class="workspace-card teacher-brief-card">
                <header class="workspace-card-head teacher-brief-head">
                  <div class="teacher-brief-copy">
                    <span class="card-eyebrow">Step 2</span>
                    <h4>Read the task guide</h4>
                    <p class="teacher-brief-subtitle">{{ getTeacherGuideSubtitle(selectedAssessment) }}</p>
                  </div>
                  <div class="teacher-brief-actions">
                    <span class="teacher-brief-badge">{{ getAssessmentSourceLabel(selectedAssessment) }}</span>
                    <button
                      v-if="selectedAssessment.linkedLesson?.pdfPath"
                      type="button"
                      class="inline-action"
                      @click="openMaterial(selectedAssessment.linkedLesson.pdfPath)"
                    >
                      <i class="fas fa-external-link-alt"></i>
                      Open linked lesson
                    </button>
                  </div>
                </header>

                <div class="teacher-brief-summary">
                  <article class="teacher-brief-stat">
                    <span><i class="fas fa-user"></i> Teacher</span>
                    <strong>{{ getTeacherDisplayName(selectedAssessment) }}</strong>
                    <small>{{ getAssessmentContextTitle(selectedAssessment) }}</small>
                  </article>

                  <article class="teacher-brief-stat">
                    <span><i class="fas fa-calendar-alt"></i> Due</span>
                    <strong>{{ selectedAssessment.submissionDeadline ? formatDateTime(selectedAssessment.submissionDeadline) : 'No due date' }}</strong>
                    <small>{{ selectedAssessment.submissionDeadline ? getRemainingLabel(selectedAssessment.submissionDeadline) : 'You can complete this without a deadline.' }}</small>
                  </article>

                  <article class="teacher-brief-stat">
                    <span><i class="fas fa-paperclip"></i> Files</span>
                    <strong>{{ getTeacherMaterials(selectedAssessment).length }}</strong>
                    <small>{{ getTeacherMaterialCountLabel(selectedAssessment) }}</small>
                  </article>

                  <article class="teacher-brief-stat">
                    <span><i class="fas fa-star"></i> Points</span>
                    <strong>{{ getActivityPointsLabel(selectedAssessment) }}</strong>
                    <small>{{ getActivityPointsHelpCopy(selectedAssessment) }}</small>
                  </article>
                </div>

                <section class="brief-section brief-section-card is-instructions">
                  <div class="brief-section-head">
                    <div class="brief-section-title">
                      <span class="brief-section-icon">
                        <i class="fas fa-clipboard-list"></i>
                      </span>
                      <div>
                        <h5>Instructions</h5>
                        <span>{{ selectedAssessment.challengeDescription ? 'Start here before you write your answer.' : 'No written instructions were posted for this task.' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="brief-section-body">
                    <p v-if="selectedAssessment.challengeDescription" class="instruction-copy">
                      {{ selectedAssessment.challengeDescription }}
                    </p>
                    <p v-else class="empty-copy">
                      This activity does not include written directions yet. Check any teacher files below for context.
                    </p>
                  </div>
                </section>

                <section class="brief-section brief-section-card is-materials">
                  <div class="brief-section-head">
                    <div class="brief-section-title">
                      <span class="brief-section-icon">
                        <i class="fas fa-paperclip"></i>
                      </span>
                      <div>
                        <h5>Teacher Files</h5>
                        <span>Open these resources if your teacher shared files for this task.</span>
                      </div>
                    </div>
                  </div>

                  <div class="brief-section-body">
                    <div v-if="getTeacherMaterials(selectedAssessment).length" class="material-list">
                      <button
                        v-for="material in getTeacherMaterials(selectedAssessment)"
                        :key="material.id || material.fileName"
                        type="button"
                        class="material-card"
                        @click="openMaterial(material.url || material.downloadUrl || selectedAssessment.linkedLesson?.pdfPath)"
                      >
                        <span class="material-icon" aria-hidden="true">
                          <i class="fas" :class="material.canPreviewInline ? 'fa-file-pdf' : 'fa-file-alt'"></i>
                        </span>
                        <span class="material-copy">
                          <strong>{{ material.fileName || selectedAssessment.linkedLesson?.pdfOriginalName || 'Lesson Material' }}</strong>
                          <small>{{ material.fileType || 'Teacher attachment' }}</small>
                        </span>
                        <span class="material-open">
                          <i class="fas fa-arrow-up-right-from-square"></i>
                        </span>
                      </button>
                    </div>

                    <p v-else class="empty-copy">
                      {{ getActivityMaterialsEmptyCopy(selectedAssessment) }}
                    </p>
                  </div>
                </section>
              </article>

              <article class="workspace-card student-answer-card">
                <header class="workspace-card-head">
                  <div>
                    <span class="card-eyebrow">Step 3</span>
                    <h4>Turn in your work</h4>
                    <p class="answer-card-subtitle">Use one or more of the options below to submit your activity clearly.</p>
                  </div>
                  <span class="answer-status-pill" :class="getAssessmentState(selectedAssessment).tone">
                    {{ getAssessmentState(selectedAssessment).label }}
                  </span>
                </header>

                <div class="answer-meta-banner">
                  <div>
                    <strong>{{ getAssessmentState(selectedAssessment).support }}</strong>
                    <small>{{ getActivitySubmissionHelpCopy(selectedAssessment) }}</small>
                  </div>
                </div>

                <label class="answer-field">
                  <span>Written response</span>
                  <textarea
                    v-model="activityForm.responseText"
                    class="answer-textarea"
                    rows="10"
                    placeholder="Type your answer, reflection, summary, or explanation here..."
                    :disabled="!canEditSelectedActivity"
                  ></textarea>
                </label>

                <div class="answer-field">
                  <span>Add a link (optional)</span>
                  <div class="link-composer">
                    <input
                      v-model.trim="activityForm.linkInput"
                      type="url"
                      placeholder="https://example.com/your-work"
                      :disabled="!canEditSelectedActivity"
                      @keydown.enter.prevent="addLink"
                    />
                    <button type="button" class="secondary-btn" :disabled="!canEditSelectedActivity" @click="addLink">
                      Add Link
                    </button>
                  </div>

                  <div v-if="activityForm.links.length" class="answer-chip-list">
                    <div v-for="link in activityForm.links" :key="link.id" class="answer-chip">
                      <button type="button" class="chip-link" @click="openMaterial(link.url)">
                        <i class="fas fa-link"></i>
                        <span>{{ getLinkLabel(link.url) }}</span>
                      </button>
                      <button
                        v-if="canEditSelectedActivity"
                        type="button"
                        class="chip-remove"
                        aria-label="Remove link"
                        @click="removeLink(link.id)"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="answer-field">
                  <div class="answer-field-head">
                    <span>Upload files (optional)</span>
                    <small>Up to 5 files, 10MB each</small>
                  </div>

                  <input
                    ref="submissionFileInput"
                    type="file"
                    class="hidden-input"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.zip"
                    :disabled="!canEditSelectedActivity"
                    @change="handleSubmissionFiles"
                  />

                  <button type="button" class="upload-dropzone" :disabled="!canEditSelectedActivity" @click="openSubmissionFilePicker">
                    <i class="fas fa-paperclip"></i>
                    <span>{{ canEditSelectedActivity ? 'Choose files from your device' : 'This submission can no longer be edited' }}</span>
                  </button>

                  <div v-if="activityForm.attachments.length" class="attachment-list">
                    <article
                      v-for="attachment in activityForm.attachments"
                      :key="attachment.id"
                      class="attachment-card"
                    >
                      <button
                        type="button"
                        class="attachment-main"
                        @click="openExistingAttachment(attachment)"
                      >
                        <span class="attachment-icon" aria-hidden="true">
                          <i class="fas" :class="attachment.isNew ? 'fa-file-upload' : 'fa-file-alt'"></i>
                        </span>
                        <span class="attachment-copy">
                          <strong>{{ attachment.fileName }}</strong>
                          <small>{{ formatBytes(attachment.size) }}{{ attachment.isNew ? ' | ready to upload' : '' }}</small>
                        </span>
                      </button>
                      <button
                        v-if="canEditSelectedActivity"
                        type="button"
                        class="chip-remove attachment-remove"
                        aria-label="Remove attachment"
                        @click="removeAttachment(attachment.id)"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </article>
                  </div>
                </div>

                <div class="answer-actions">
                  <button
                    type="button"
                    class="primary-btn"
                    :disabled="!canTurnIn || isTurningIn"
                    @click="turnInSelectedActivity"
                  >
                    <i class="fas" :class="isTurningIn ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
                    {{ isTurningIn ? 'Turning In...' : 'Turn In' }}
                  </button>

                  <button
                    type="button"
                    class="ghost-btn"
                    :disabled="!canUnsubmit || isUnsubmitting"
                    @click="unsubmitSelectedActivity"
                  >
                    <i class="fas" :class="isUnsubmitting ? 'fa-spinner fa-spin' : 'fa-rotate-left'"></i>
                    {{ isUnsubmitting ? 'Updating...' : 'Unsubmit' }}
                  </button>
                </div>

                <p v-if="!canEditSelectedActivity && getAssessmentState(selectedAssessment).tone === 'missing'" class="submission-note is-warning">
                  This activity is marked missing because the due date already passed before anything was turned in.
                </p>
                <p v-else-if="!canEditSelectedActivity && canUnsubmit === false && getAssessmentState(selectedAssessment).tone === 'graded'" class="submission-note">
                  Your teacher has already graded this work, so it can no longer be changed.
                </p>
              </article>
            </div>

            <article v-else class="workspace-card exam-detail-card">
              <header class="workspace-card-head">
                <div>
                  <span class="card-eyebrow">Step 2</span>
                  <h4>Review the assessment details</h4>
                  <p class="exam-card-subtitle">Check the timer, instructions, and linked lesson before you start the exam.</p>
                </div>
                <span class="answer-status-pill" :class="getAssessmentState(selectedAssessment).tone">
                  {{ getAssessmentState(selectedAssessment).label }}
                </span>
              </header>

              <div class="brief-meta-grid">
                <div class="brief-meta-item">
                  <span>Difficulty</span>
                  <strong>{{ formatLabel(selectedAssessment.difficulty || 'N/A') }}</strong>
                </div>
                <div class="brief-meta-item">
                  <span>Items</span>
                  <strong>{{ selectedAssessment.numberOfItems || 0 }}</strong>
                </div>
                <div class="brief-meta-item">
                  <span>Deadline</span>
                  <strong>{{ selectedAssessment.submissionDeadline ? formatDateTime(selectedAssessment.submissionDeadline) : 'No deadline' }}</strong>
                  <small>{{ selectedAssessment.submissionDeadline ? getRemainingLabel(selectedAssessment.submissionDeadline) : 'Teacher did not set a deadline.' }}</small>
                </div>
                <div class="brief-meta-item">
                  <span>Exam Timer</span>
                  <strong>{{ selectedAssessment.examDurationMinutes || 30 }} minutes</strong>
                  <small>{{ getAssessmentState(selectedAssessment).support }}</small>
                </div>
              </div>

              <section v-if="selectedAssessment.challengeDescription" class="brief-section">
                <div class="brief-section-head">
                  <h5>Assessment Instructions</h5>
                  <span>Review the directions before you start.</span>
                </div>
                <p class="instruction-copy">{{ selectedAssessment.challengeDescription }}</p>
              </section>

              <section class="brief-section">
                <div class="brief-section-head">
                  <h5>Linked Lesson</h5>
                  <span>Open the lesson resource if you need to review first.</span>
                </div>

                <div v-if="selectedAssessment.linkedLesson" class="material-list">
                  <button
                    type="button"
                    class="material-card"
                    @click="openMaterial(selectedAssessment.linkedLesson.pdfPath)"
                  >
                    <span class="material-icon" aria-hidden="true">
                      <i class="fas fa-file-pdf"></i>
                    </span>
                    <span class="material-copy">
                      <strong>{{ selectedAssessment.linkedLesson.title || selectedAssessment.lessonTitle || 'Lesson Material' }}</strong>
                      <small>{{ selectedAssessment.linkedLesson.pdfOriginalName || 'Teacher lesson file' }}</small>
                    </span>
                    <span class="material-open">
                      <i class="fas fa-arrow-up-right-from-square"></i>
                    </span>
                  </button>
                </div>
                <p v-else class="empty-copy">No lesson resource is linked to this assessment.</p>
              </section>

              <div class="exam-actions">
                <button
                  type="button"
                  class="primary-btn"
                  data-tour="student-activity-start"
                  :disabled="isAssessmentStartDisabled(selectedAssessment)"
                  @click="openAssessmentExam(selectedAssessment)"
                >
                  {{ getAssessmentActionLabel(selectedAssessment) }}
                </button>
              </div>
            </article>
          </section>
        </template>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'

export default {
  name: 'StudentActivities',
  data() {
    return {
      assessmentCatalog: [],
      assessments: [],
      lessonsById: {},
      selectedAssessmentId: null,
      finalizedSubmissionsByAssessmentId: {},
      activitySubmissionsByAssessmentId: {},
      isLoading: false,
      emptyStateMessage: 'There are no activities or exams to show right now. New tasks will appear here automatically when your teacher posts them.',
      nowMs: Date.now(),
      countdownTimer: null,
      pendingTourAction: '',
      notice: {
        type: '',
        message: ''
      },
      activityForm: {
        responseText: '',
        linkInput: '',
        links: [],
        attachments: []
      },
      isTurningIn: false,
      isUnsubmitting: false
    }
  },
  computed: {
    selectedAssessment() {
      return this.assessments.find((assessment) => assessment.id === this.selectedAssessmentId) || null
    },
    canEditSelectedActivity() {
      const assessment = this.selectedAssessment
      if (!assessment || !this.isClassroomTask(assessment)) return false
      const state = this.getAssessmentState(assessment)
      return !['submitted', 'graded', 'missing'].includes(state.key)
    },
    canTurnIn() {
      return this.canEditSelectedActivity && !this.isTurningIn && !this.isUnsubmitting
    },
    canUnsubmit() {
      const assessment = this.selectedAssessment
      if (!assessment || !this.isClassroomTask(assessment)) return false
      const state = this.getAssessmentState(assessment)
      return state.key === 'submitted' && !this.isDeadlinePassed(assessment.submissionDeadline) && !this.isUnsubmitting
    }
  },
  watch: {
    selectedAssessmentId() {
      this.syncActivityFormFromSelection()
    }
  },
  methods: {
    handleTourFocus(event) {
      this.pendingTourAction = String(event?.detail?.action || '').trim()
      this.applyPendingTourAction()
    },
    applyPendingTourAction() {
      if (this.pendingTourAction !== 'open-first-assessment') return
      if (!Array.isArray(this.assessments) || this.assessments.length === 0) return
      const firstAssessment = this.assessments[0]
      if (firstAssessment?.id) this.selectedAssessmentId = firstAssessment.id
      this.pendingTourAction = ''
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
      this.isLoading = isLoading
    },
    setNotice(type, message) {
      this.notice = {
        type: type === 'error' ? 'error' : 'success',
        message: String(message || '').trim()
      }
    },
    clearNotice() {
      this.notice = { type: '', message: '' }
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
    formatDateTime(value) {
      if (!value) return 'N/A'
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return 'N/A'
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
    getTeacherDisplayName(assessment) {
      return String(assessment?.teacherName || 'Teacher').trim() || 'Teacher'
    },
    getAssessmentSourceLabel(assessment) {
      return assessment?.lessonTitle || assessment?.linkedLesson ? 'Linked lesson' : 'Direct class post'
    },
    getAssessmentContextTitle(assessment) {
      const lessonTitle = String(assessment?.lessonTitle || assessment?.linkedLesson?.title || '').trim()
      if (lessonTitle) return lessonTitle
      const audience = String(assessment?.lessonSubject || assessment?.strand || 'General').trim() || 'General'
      return audience && audience !== 'General' ? `${audience} class task` : 'Direct class task'
    },
    getTeacherGuideSubtitle(assessment) {
      if (!assessment) return 'Review the activity details below before you start.'
      if (assessment?.lessonTitle || assessment?.linkedLesson) {
        return 'Review the linked lesson details, teacher notes, and any attached materials before you begin.'
      }
      if (this.getTeacherMaterials(assessment).length > 0) {
        return 'This activity was posted directly to your class with teacher files for reference.'
      }
      return 'This activity was posted directly to your class. Review the notes below before you start working.'
    },
    getTeacherMaterialCountLabel(assessment) {
      const count = this.getTeacherMaterials(assessment).length
      if (count <= 0) return 'No teacher files attached yet.'
      if (count === 1) return '1 teacher file attached.'
      return `${count} teacher files attached.`
    },
    getActivityMaterialsEmptyCopy(assessment) {
      return assessment?.lessonTitle
        ? 'No teacher attachment was posted for this task yet.'
        : 'No extra teacher files were attached. You can still finish the task using the instructions above.'
    },
    formatLabel(value) {
      return String(value || '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase())
    },
    formatBytes(value) {
      const size = Number(value || 0)
      if (!Number.isFinite(size) || size <= 0) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB']
      const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
      const formatted = size / (1024 ** exponent)
      return `${formatted >= 10 || exponent === 0 ? formatted.toFixed(0) : formatted.toFixed(1)} ${units[exponent]}`
    },
    isDeadlinePassed(deadlineValue) {
      if (!deadlineValue) return false
      const parsed = new Date(deadlineValue)
      if (Number.isNaN(parsed.getTime())) return false
      return parsed.getTime() <= this.nowMs
    },
    formatDuration(ms) {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000))
      const days = Math.floor(totalSeconds / 86400)
      const hours = Math.floor((totalSeconds % 86400) / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      if (days > 0) return `${days}d ${hours}h ${minutes}m`
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    },
    getRemainingLabel(deadlineValue) {
      if (!deadlineValue) return 'No deadline'
      const parsed = new Date(deadlineValue)
      if (Number.isNaN(parsed.getTime())) return 'Invalid deadline'
      const diff = parsed.getTime() - this.nowMs
      if (diff <= 0) return 'Deadline has passed'
      return `Time left: ${this.formatDuration(diff)}`
    },
    getAssessmentIdFromSubmission(submission) {
      const assessmentId = submission?.assessmentId
      if (!assessmentId) return ''
      if (typeof assessmentId === 'string') return String(assessmentId)
      return String(assessmentId._id || '')
    },
    buildSubmissionMap(submissions, resolver = this.getAssessmentIdFromSubmission) {
      const byAssessment = {}
      ;(Array.isArray(submissions) ? submissions : []).forEach((submission) => {
        const assessmentId = String(resolver.call(this, submission) || '').trim()
        if (!assessmentId) return
        byAssessment[assessmentId] = submission
      })
      return byAssessment
    },
    normalizeLessons(lessons) {
      return this.uniqueBy(
        Array.isArray(lessons) ? lessons : [],
        (lesson, index) => lesson.id || lesson._id || `${lesson.title || ''}-${lesson.createdAt || ''}-${index}`
      ).map((lesson, index) => ({
        id: String(lesson.id || lesson._id || `lesson-${index + 1}`),
        title: lesson.title || 'Untitled Lesson',
        description: lesson.description || '',
        subject: lesson.subject || '',
        teacherName: lesson.teacher?.name || '',
        pdfPath: lesson.pdfPath || '',
        pdfOriginalName: lesson.pdfOriginalName || '',
        attachments: Array.isArray(lesson.attachments) ? lesson.attachments : [],
        createdAt: lesson.createdAt || lesson.postedAt || null
      }))
    },
    mapAssessmentsWithContext(assessments) {
      return (Array.isArray(assessments) ? assessments : []).map((assessment, index) => {
        const id = String(assessment.id || assessment._id || `assessment-${index + 1}`)
        const linkedLesson = this.lessonsById[String(assessment.lessonId || '')] || null
        return {
          id,
          lessonId: String(assessment.lessonId || linkedLesson?.id || ''),
          title: assessment.title || 'Untitled Assessment',
          lessonTitle: assessment.lessonTitle || linkedLesson?.title || '',
          strand: assessment.strand || assessment.track || '',
          lessonSubject: assessment.lessonSubject || assessment.subject || linkedLesson?.subject || '',
          assessmentMode: String(assessment.assessmentMode || 'activity').trim().toLowerCase() || 'activity',
          gradingPeriod: String(assessment.gradingPeriod || '').trim(),
          teacherName: assessment.teacherName || assessment.createdBy?.name || linkedLesson?.teacherName || '',
          difficulty: assessment.difficulty || '',
          examType: assessment.examType || '',
          numberOfItems: Number(assessment.numberOfItems || 0),
          activityPoints: Number.isInteger(Number(assessment.activityPoints)) && Number(assessment.activityPoints) >= 1
            ? Number(assessment.activityPoints)
            : null,
          challengeDescription: String(assessment.challengeDescription || '').trim(),
          createdAt: assessment.createdAt,
          submissionDeadline: assessment.submissionDeadline || null,
          examDurationMinutes: Number(assessment.examDurationMinutes || 30),
          attachments: Array.isArray(assessment.attachments) ? assessment.attachments : [],
          linkedLesson
        }
      })
    },
    refreshAssessmentsFromState() {
      this.assessments = this.sortAssessmentsForWorkspace(this.mapAssessmentsWithContext(this.assessmentCatalog))
      if (!this.assessments.some((assessment) => assessment.id === this.selectedAssessmentId)) {
        this.selectedAssessmentId = this.assessments[0]?.id || null
      }
    },
    getFinalizedSubmission(assessment) {
      return this.finalizedSubmissionsByAssessmentId[String(assessment?.id || '')] || null
    },
    getActivitySubmission(assessment) {
      return this.activitySubmissionsByAssessmentId[String(assessment?.id || '')] || null
    },
    isClassroomTask(assessment) {
      return String(assessment?.assessmentMode || '').trim().toLowerCase() === 'activity'
    },
    getActivityPointsValue(assessment) {
      const normalizedValue = Number(assessment?.activityPoints)
      return Number.isInteger(normalizedValue) && normalizedValue >= 1 ? normalizedValue : null
    },
    getActivityPointsLabel(assessment) {
      const points = this.getActivityPointsValue(assessment)
      return points ? `${points} points` : 'No points set'
    },
    getActivityPointsHelpCopy(assessment) {
      const points = this.getActivityPointsValue(assessment)
      return points
        ? 'Teacher-set score for this activity.'
        : 'This activity does not have a published point value yet.'
    },
    getActivitySubmissionHelpCopy(assessment) {
      const points = this.getActivityPointsValue(assessment)
      const turnInCopy = 'Turn in at least one: a written response, a link, or a file.'
      return points ? `This activity is worth ${points} points. ${turnInCopy}` : turnInCopy
    },
    getAssessmentState(assessment) {
      if (!assessment) {
        return {
          key: 'unknown',
          label: 'Unavailable',
          tone: 'assigned',
          support: 'Assessment details are not available.'
        }
      }

      if (this.isClassroomTask(assessment)) {
        const submission = this.getActivitySubmission(assessment)
        if (submission) {
          const isGraded = Boolean(submission.gradedAt || submission.gradeValue !== null || (Number(submission.totalPoints || 0) > 0 && submission.status === 'completed'))
          if (isGraded) {
            const activityPoints = this.getActivityPointsValue(assessment)
            const gradeSupport = submission.gradeValue !== null
              ? `Grade: ${submission.gradeValue}${activityPoints ? ` / ${activityPoints}` : ''}`
              : (submission.teacherFeedback ? 'Teacher feedback is available.' : 'This activity has already been reviewed.')
            return {
              key: 'graded',
              label: 'Graded',
              tone: 'graded',
              support: gradeSupport
            }
          }

          if (String(submission.status || '').trim().toLowerCase() === 'completed') {
            return {
              key: 'submitted',
              label: 'Submitted',
              tone: 'submitted',
              support: submission.submittedAt ? `Turned in ${this.formatDateTime(submission.submittedAt)}.` : 'Your response was submitted successfully.'
            }
          }

          if (submission.hasContent) {
            return {
              key: 'draft',
              label: 'Draft Saved',
              tone: 'draft',
              support: submission.draftSavedAt ? `Last saved ${this.formatDateTime(submission.draftSavedAt)}.` : 'You have work in progress.'
            }
          }
        }

        if (this.isDeadlinePassed(assessment.submissionDeadline)) {
          return {
            key: 'missing',
            label: 'Missing',
            tone: 'missing',
            support: 'The due date has passed and no submission was turned in.'
          }
        }

        return {
          key: 'assigned',
          label: 'Ready To Work',
          tone: 'assigned',
          support: assessment.submissionDeadline ? this.getRemainingLabel(assessment.submissionDeadline) : 'No due date was posted for this activity.'
        }
      }

      const submission = this.getFinalizedSubmission(assessment)
      if (submission) {
        return {
          key: 'completed',
          label: 'Completed',
          tone: 'completed',
          support: submission.submittedAt
            ? `Submitted ${this.formatDateTime(submission.submittedAt)}. Score: ${submission.score || 0}/${submission.totalPoints || 0}.`
            : 'This assessment has already been submitted.'
        }
      }

      if (this.isDeadlinePassed(assessment.submissionDeadline)) {
        return {
          key: 'closed',
          label: 'Closed',
          tone: 'closed',
          support: 'Deadline has passed. Submission is closed.'
        }
      }

      return {
        key: 'not_started',
        label: 'Not Started',
        tone: 'assigned',
        support: assessment.submissionDeadline ? this.getRemainingLabel(assessment.submissionDeadline) : 'Start whenever you are ready.'
      }
    },
    getAssessmentTypeLabel(assessment) {
      const mode = String(assessment?.assessmentMode || '').trim().toLowerCase()
      if (mode === 'grading_assessment') return 'Exam'
      if (mode === 'quiz') return 'Quiz'
      return 'Activity'
    },
    getAssessmentTypeClass(assessment) {
      const mode = String(assessment?.assessmentMode || '').trim().toLowerCase()
      if (mode === 'grading_assessment') return 'is-exam'
      if (mode === 'quiz') return 'is-quiz'
      return 'is-activity'
    },
    getExamTypeLabel(value) {
      return this.formatLabel(value || 'Assessment')
    },
    getTeacherMaterials(assessment) {
      const assessmentAttachments = Array.isArray(assessment?.attachments) ? assessment.attachments : []
      const lesson = assessment?.linkedLesson || null
      const lessonAttachments = Array.isArray(lesson?.attachments) ? lesson.attachments : []
      const combinedMaterials = this.uniqueBy(
        [...assessmentAttachments, ...lessonAttachments],
        (material, index) => material.id || material.url || material.downloadUrl || `${material.fileName || 'material'}-${index}`
      )

      if (combinedMaterials.length > 0) return combinedMaterials

      if (lesson?.pdfPath) {
        return [{
          id: `${lesson.id || assessment.id}-pdf`,
          fileName: lesson.pdfOriginalName || `${lesson.title || assessment.lessonTitle || 'lesson'}.pdf`,
          fileType: 'application/pdf',
          size: 0,
          url: lesson.pdfPath,
          canPreviewInline: true
        }]
      }

      return []
    },
    getSelectedAssessmentGuideCopy(assessment) {
      if (!assessment) return 'Select a task from the list to open the full details.'
      if (this.isClassroomTask(assessment)) {
        return 'Read the teacher guide first, then use the submission panel to turn in your response, links, or files.'
      }
      return 'Review the assessment details carefully, then start the exam when you are ready.'
    },
    sortAssessmentsForWorkspace(items) {
      const stateOrder = {
        draft: 0,
        assigned: 1,
        not_started: 1,
        missing: 2,
        submitted: 3,
        graded: 4,
        completed: 4,
        closed: 5,
        unknown: 6,
      }

      return [...(Array.isArray(items) ? items : [])].sort((left, right) => {
        const leftState = this.getAssessmentState(left)
        const rightState = this.getAssessmentState(right)
        const leftPriority = stateOrder[leftState.key] ?? 7
        const rightPriority = stateOrder[rightState.key] ?? 7
        if (leftPriority !== rightPriority) return leftPriority - rightPriority

        const leftDeadline = new Date(left?.submissionDeadline || left?.createdAt || 0).getTime() || Number.MAX_SAFE_INTEGER
        const rightDeadline = new Date(right?.submissionDeadline || right?.createdAt || 0).getTime() || Number.MAX_SAFE_INTEGER
        if (leftDeadline !== rightDeadline) return leftDeadline - rightDeadline

        const leftCreated = new Date(left?.createdAt || 0).getTime() || 0
        const rightCreated = new Date(right?.createdAt || 0).getTime() || 0
        return rightCreated - leftCreated
      })
    },
    selectAssessment(assessment) {
      if (!assessment?.id) return
      this.selectedAssessmentId = assessment.id
      this.clearNotice()
    },
    syncActivityFormFromSelection() {
      const assessment = this.selectedAssessment
      if (!assessment || !this.isClassroomTask(assessment)) {
        this.resetActivityForm()
        return
      }

      const submission = this.getActivitySubmission(assessment)
      const links = Array.isArray(submission?.links) ? submission.links : []
      const attachments = Array.isArray(submission?.attachments) ? submission.attachments : []

      this.activityForm = {
        responseText: submission?.responseText || '',
        linkInput: '',
        links: links.map((link, index) => ({
          id: String(link.id || `link-${index + 1}`),
          url: link.url,
          isNew: false
        })),
        attachments: attachments.map((attachment, index) => ({
          id: String(attachment.id || `attachment-${index + 1}`),
          fileName: attachment.fileName || 'Attachment',
          fileType: attachment.fileType || 'application/octet-stream',
          size: Number(attachment.size || 0),
          url: attachment.url || attachment.downloadUrl || '',
          isNew: false
        }))
      }

      const input = this.$refs.submissionFileInput
      if (input) input.value = ''
    },
    resetActivityForm() {
      this.activityForm = {
        responseText: '',
        linkInput: '',
        links: [],
        attachments: []
      }
      const input = this.$refs.submissionFileInput
      if (input) input.value = ''
    },
    normalizeLinkUrl(rawValue) {
      const value = String(rawValue || '').trim()
      if (!value) return ''
      try {
        return new URL(value).toString()
      } catch (_error) {
        return ''
      }
    },
    getLinkLabel(url) {
      try {
        const parsed = new URL(url)
        return parsed.hostname.replace(/^www\./i, '') || parsed.toString()
      } catch (_error) {
        return url
      }
    },
    addLink() {
      if (!this.canEditSelectedActivity) return
      const normalizedUrl = this.normalizeLinkUrl(this.activityForm.linkInput)
      if (!normalizedUrl) {
        this.setNotice('error', 'Enter a valid link that starts with http:// or https://.')
        return
      }

      const alreadyExists = this.activityForm.links.some((link) => String(link.url || '').toLowerCase() === normalizedUrl.toLowerCase())
      if (alreadyExists) {
        this.setNotice('error', 'That link is already attached to this response.')
        return
      }

      this.activityForm.links = [
        ...this.activityForm.links,
        {
          id: `link-${Date.now()}-${this.activityForm.links.length + 1}`,
          url: normalizedUrl,
          isNew: true
        }
      ]
      this.activityForm.linkInput = ''
      this.clearNotice()
    },
    removeLink(linkId) {
      this.activityForm.links = this.activityForm.links.filter((link) => link.id !== linkId)
    },
    openSubmissionFilePicker() {
      if (!this.canEditSelectedActivity) return
      this.$refs.submissionFileInput?.click()
    },
    handleSubmissionFiles(event) {
      if (!this.canEditSelectedActivity) return
      const selectedFiles = Array.from(event?.target?.files || [])
      if (selectedFiles.length === 0) return

      const availableSlots = Math.max(0, 5 - this.activityForm.attachments.length)
      if (availableSlots <= 0) {
        this.setNotice('error', 'You can attach up to 5 files per activity response.')
        event.target.value = ''
        return
      }

      const filesToAdd = selectedFiles.slice(0, availableSlots)
      if (filesToAdd.length < selectedFiles.length) {
        this.setNotice('error', 'Only the first 5 files were kept for this response.')
      } else {
        this.clearNotice()
      }

      const existingKeys = new Set(this.activityForm.attachments.map((attachment) => `${attachment.fileName}:${attachment.size}`))
      const nextAttachments = filesToAdd
        .filter((file) => !existingKeys.has(`${file.name}:${Number(file.size || 0)}`))
        .map((file, index) => ({
          id: `new-file-${Date.now()}-${index + 1}`,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          size: Number(file.size || 0),
          file,
          isNew: true
        }))

      this.activityForm.attachments = [...this.activityForm.attachments, ...nextAttachments]
      event.target.value = ''
    },
    removeAttachment(attachmentId) {
      this.activityForm.attachments = this.activityForm.attachments.filter((attachment) => attachment.id !== attachmentId)
    },
    openMaterial(url) {
      const resolvedUrl = String(url || '').trim()
      if (!resolvedUrl) return
      window.open(resolvedUrl, '_blank', 'noopener')
    },
    openExistingAttachment(attachment) {
      if (attachment?.isNew) return
      this.openMaterial(attachment?.url)
    },
    buildActivityFormData() {
      const formData = new FormData()
      formData.append('responseText', String(this.activityForm.responseText || '').trim())
      formData.append('links', JSON.stringify(this.activityForm.links.map((link) => ({ url: link.url }))))
      formData.append('retainedAttachmentIds', JSON.stringify(
        this.activityForm.attachments
          .filter((attachment) => !attachment.isNew)
          .map((attachment) => attachment.id)
      ))

      this.activityForm.attachments
        .filter((attachment) => attachment.isNew && attachment.file)
        .forEach((attachment) => {
          formData.append('attachments', attachment.file)
        })

      return formData
    },
    getMultipartAuthConfig() {
      const authConfig = this.getAuthConfig()
      return {
        headers: {
          ...authConfig.headers
        }
      }
    },
    getAxiosErrorMessage(error, fallbackMessage) {
      return error?.response?.data?.message || error?.message || fallbackMessage
    },
    async turnInSelectedActivity() {
      const assessment = this.selectedAssessment
      if (!assessment || !this.isClassroomTask(assessment)) return

      this.isTurningIn = true
      this.clearNotice()

      try {
        const response = await axios.post(
          `${this.resolveApiBaseUrl()}/student/assessments/${assessment.id}/activity-response/submit`,
          this.buildActivityFormData(),
          this.getMultipartAuthConfig()
        )
        const submission = response.data?.submission || response.data?.data?.submission
        if (submission?.assessmentId) {
          this.activitySubmissionsByAssessmentId = {
            ...this.activitySubmissionsByAssessmentId,
            [submission.assessmentId]: submission
          }
          this.refreshAssessmentsFromState()
          this.syncActivityFormFromSelection()
        }
        this.setNotice('success', response.data?.message || 'Activity submitted successfully.')
      } catch (error) {
        this.setNotice('error', this.getAxiosErrorMessage(error, 'Failed to submit activity response.'))
      } finally {
        this.isTurningIn = false
      }
    },
    async unsubmitSelectedActivity() {
      const assessment = this.selectedAssessment
      if (!assessment || !this.isClassroomTask(assessment)) return

      this.isUnsubmitting = true
      this.clearNotice()

      try {
        const response = await axios.post(
          `${this.resolveApiBaseUrl()}/student/assessments/${assessment.id}/activity-response/unsubmit`,
          {},
          this.getAuthConfig()
        )
        const submission = response.data?.submission || response.data?.data?.submission
        if (submission?.assessmentId) {
          this.activitySubmissionsByAssessmentId = {
            ...this.activitySubmissionsByAssessmentId,
            [submission.assessmentId]: submission
          }
          this.refreshAssessmentsFromState()
          this.syncActivityFormFromSelection()
        }
        this.setNotice('success', response.data?.message || 'Activity unsubmitted successfully.')
      } catch (error) {
        this.setNotice('error', this.getAxiosErrorMessage(error, 'Failed to unsubmit activity response.'))
      } finally {
        this.isUnsubmitting = false
      }
    },
    isAssessmentStartDisabled(assessment) {
      const state = this.getAssessmentState(assessment)
      return ['completed', 'closed'].includes(state.key)
    },
    getAssessmentActionLabel(assessment) {
      const state = this.getAssessmentState(assessment)
      if (state.key === 'completed') return 'Submitted / Completed'
      if (state.key === 'closed') return 'Deadline Closed'
      return 'Start Assessment'
    },
    async fetchChallenges() {
      this.setPageLoading(true)
      try {
        const apiBaseUrl = this.resolveApiBaseUrl()
        const authConfig = this.getAuthConfig()
        const [assessmentsResponse, submissionsResponse, activitySubmissionsResponse, lessonsResponse] = await Promise.all([
          axios.get(`${apiBaseUrl}/student/assessments`, authConfig),
          axios.get(`${apiBaseUrl}/student/submissions/me`, authConfig),
          axios.get(`${apiBaseUrl}/student/activity-submissions`, authConfig),
          axios.get(`${apiBaseUrl}/student/lessons`, authConfig)
        ])

        const assessments = this.uniqueBy(
          Array.isArray(assessmentsResponse.data?.assessments) ? assessmentsResponse.data.assessments : [],
          (assessment, index) => assessment.id || assessment._id || `${assessment.title || ''}-${assessment.createdAt || ''}-${index}`
        )
        const finalizedSubmissions = this.uniqueBy(
          Array.isArray(submissionsResponse.data?.submissions) ? submissionsResponse.data.submissions : [],
          (submission) => this.getAssessmentIdFromSubmission(submission)
        )
        const activitySubmissions = this.uniqueBy(
          Array.isArray(activitySubmissionsResponse.data?.submissions) ? activitySubmissionsResponse.data.submissions : [],
          (submission) => submission.assessmentId
        )
        const lessons = this.normalizeLessons(Array.isArray(lessonsResponse.data?.lessons) ? lessonsResponse.data.lessons : [])

        this.lessonsById = lessons.reduce((accumulator, lesson) => {
          accumulator[String(lesson.id || '')] = lesson
          return accumulator
        }, {})
        this.finalizedSubmissionsByAssessmentId = this.buildSubmissionMap(finalizedSubmissions)
        this.activitySubmissionsByAssessmentId = this.buildSubmissionMap(activitySubmissions, (submission) => submission.assessmentId)
        this.assessmentCatalog = assessments
        this.emptyStateMessage = 'There are no activities or exams to show right now. New tasks will appear here automatically when your teacher posts them.'
        this.refreshAssessmentsFromState()
        if (!this.selectedAssessmentId && this.assessments[0]?.id) {
          this.selectedAssessmentId = this.assessments[0].id
        }
        this.applyPendingTourAction()
        this.syncActivityFormFromSelection()
      } catch (error) {
        console.error('Error fetching student activities:', error)
        this.assessmentCatalog = []
        this.assessments = []
        this.selectedAssessmentId = null
        this.lessonsById = {}
        this.finalizedSubmissionsByAssessmentId = {}
        this.activitySubmissionsByAssessmentId = {}
        this.resetActivityForm()
        this.emptyStateMessage = 'Failed to load activities. Please try again.'
      } finally {
        this.setPageLoading(false)
      }
    },
    async openAssessmentExam(assessment) {
      const assessmentId = String(assessment?.id || '')
      if (!assessmentId) return
      if (this.isDeadlinePassed(assessment?.submissionDeadline)) {
        window.alert('Deadline has passed. Submission is closed.')
        return
      }
      if (this.getAssessmentState(assessment).key === 'completed') {
        window.alert('Assessment already submitted. Retake is not allowed.')
        return
      }
      this.$router.push(`/student/exam/${assessmentId}`)
    }
  },
  created() {
    this.countdownTimer = window.setInterval(() => {
      this.nowMs = Date.now()
    }, 1000)
  },
  mounted() {
    this.authStore = useAuthStore()
    window.addEventListener('edumatch-student-tour-focus', this.handleTourFocus)
    this.fetchChallenges()
  },
  beforeUnmount() {
    window.removeEventListener('edumatch-student-tour-focus', this.handleTourFocus)
    if (this.countdownTimer) {
      window.clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  }
}
</script>

<style scoped>
.student-activity-response-page {
  --workspace-border: #dbe4ef;
  --workspace-ink: #0f172a;
  --workspace-muted: #64748b;
  --workspace-soft: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
  --workspace-shadow: 0 22px 50px rgba(15, 23, 42, 0.08);
  --workspace-radius: 24px;
  --activity-accent: #0f766e;
  --activity-accent-soft: #ecfeff;
  --quiz-accent: #1d4ed8;
  --quiz-accent-soft: #eff6ff;
  --exam-accent: #b45309;
  --exam-accent-soft: #fffbeb;
  --status-assigned: #0f766e;
  --status-assigned-bg: #ecfeff;
  --status-draft: #7c3aed;
  --status-draft-bg: #f5f3ff;
  --status-submitted: #166534;
  --status-submitted-bg: #f0fdf4;
  --status-graded: #1d4ed8;
  --status-graded-bg: #eff6ff;
  --status-missing: #b91c1c;
  --status-missing-bg: #fef2f2;
  --status-closed: #7c2d12;
  --status-closed-bg: #fff7ed;
  display: grid;
  gap: 1rem;
}

.response-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.response-header-copy {
  display: grid;
  gap: 0.25rem;
}

.section-subtitle {
  margin: 0.45rem 0 0;
  max-width: 58rem;
  color: var(--workspace-muted);
  font-size: 0.92rem;
  line-height: 1.6;
}

.workspace-focus-card {
  border: 1px solid rgba(219, 234, 254, 0.92);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  padding: 0.95rem 1rem;
  display: grid;
  gap: 0.4rem;
}

.workspace-focus-copy h3 {
  margin: 0;
  color: var(--workspace-ink);
  font-size: 1rem;
  line-height: 1.3;
}

.workspace-focus-copy p,
.answer-card-subtitle,
.exam-card-subtitle {
  margin: 0;
  color: var(--workspace-muted);
  font-size: 0.84rem;
  line-height: 1.55;
}

.response-flash {
  border-radius: 18px;
  padding: 0.9rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid transparent;
  font-weight: 600;
}

.response-flash.success {
  background: #ecfdf5;
  color: #166534;
  border-color: #bbf7d0;
}

.response-flash.error {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.response-shell-body {
  min-height: 520px;
  border: 1px solid var(--workspace-border);
  border-radius: var(--workspace-radius);
  background:#f8fafc;
  box-shadow: var(--workspace-shadow);
  padding: 1rem;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 1rem;
}

.workspace-state {
  grid-column: 1 / -1;
  justify-self: center;
  align-self: center;
  width: min(100%, 560px);
  min-height: 320px;
  padding: 1.75rem 1.4rem;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0.8rem;
  text-align: center;
  color: var(--workspace-muted);
}

.workspace-state-icon {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f4f7d8;
  border: 1px solid rgba(169, 213, 95, 0.55);
  color: #4f6314;
  font-size: 1.35rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.workspace-state-icon.is-empty {
  background: linear-gradient(135deg, #f4f7d8 0%, #eef6c0 100%);
  border-color: rgba(169, 213, 95, 0.6);
  color: #4f6314;
}

.workspace-state-title {
  margin: 0;
  color: #1e4307;
  font-size: 1.1rem;
  line-height: 1.3;
}

.workspace-state-copy {
  display: block;
  max-width: 34rem;
  margin: 0;
  color: #4d6120;
  font-size: 0.92rem;
  line-height: 1.65;
  text-align: center;
}

.workspace-state.is-loading {
  width: min(100%, 460px);
}

.activity-sidebar {
  width: 320px;
  min-width: 0;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.78);
  padding: 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.activity-sidebar-copy {
  display: grid;
  gap: 0.25rem;
}

.sidebar-step {
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.activity-sidebar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.activity-sidebar-head h3 {
  margin: 0;
  color: var(--workspace-ink);
  font-size: 1.02rem;
}

.activity-sidebar-head p {
  margin: 0.3rem 0 0;
  color: var(--workspace-muted);
  font-size: 0.8rem;
  line-height: 1.5;
}

.activity-sidebar-count {
  min-width: 38px;
  height: 38px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e0f2fe;
  color: #0f172a;
  font-weight: 700;
}

.activity-list {
  display: grid;
  gap: 0.7rem;
  max-height: 760px;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.activity-list-card {
  width: 100%;
  border: 1px solid rgba(191, 219, 254, 0.8);
  border-radius: 18px;
  background: #f8fbff;
  padding: 0.85rem;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 0.55rem;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.activity-list-card:hover,
.activity-list-card.active {
  transform: translateY(-1px);
  border-color: #60a5fa;
  box-shadow: 0 18px 38px rgba(37, 99, 235, 0.12);
  background: #ffffff;
}

.activity-list-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.activity-type-pill,
.activity-status-pill,
.answer-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.activity-type-pill.is-activity {
  background: var(--activity-accent-soft);
  color: var(--activity-accent);
}

.activity-type-pill.is-quiz {
  background: var(--quiz-accent-soft);
  color: var(--quiz-accent);
}

.activity-type-pill.is-exam {
  background: var(--exam-accent-soft);
  color: var(--exam-accent);
}

.activity-type-pill.is-neutral {
  background: #f1f5f9;
  color: #475569;
}

.activity-status-pill.assigned,
.answer-status-pill.assigned {
  background: var(--status-assigned-bg);
  color: var(--status-assigned);
}

.activity-status-pill.draft,
.answer-status-pill.draft {
  background: var(--status-draft-bg);
  color: var(--status-draft);
}

.activity-status-pill.submitted,
.answer-status-pill.submitted,
.activity-status-pill.completed,
.answer-status-pill.completed {
  background: var(--status-submitted-bg);
  color: var(--status-submitted);
}

.activity-status-pill.graded,
.answer-status-pill.graded {
  background: var(--status-graded-bg);
  color: var(--status-graded);
}

.activity-status-pill.missing,
.answer-status-pill.missing {
  background: var(--status-missing-bg);
  color: var(--status-missing);
}

.activity-status-pill.closed,
.answer-status-pill.closed {
  background: var(--status-closed-bg);
  color: var(--status-closed);
}

.activity-list-card strong,
.workspace-card-head h4 {
  color: var(--workspace-ink);
}

.activity-list-card strong {
  font-size: 0.98rem;
}

.activity-list-copy {
  display: grid;
  gap: 0.18rem;
}

.activity-list-card p,
.card-eyebrow,
.teacher-brief-subtitle,
.brief-section-head span,
.empty-copy,
.instruction-copy,
.answer-meta-banner small,
.submission-note {
  color: var(--workspace-muted);
}

.activity-list-card p {
  margin: 0;
  font-size: 0.83rem;
  line-height: 1.45;
}

.activity-list-meta {
  display: grid;
  gap: 0.32rem;
  color: #475569;
  font-size: 0.76rem;
}

.activity-list-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.activity-list-meta i {
  color: #64748b;
}

.activity-workspace {
  min-width: 0;
  display: grid;
  gap: 1rem;
}

.workspace-focus-card {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
}

.workspace-focus-copy {
  min-width: 0;
  display: grid;
  gap: 0.25rem;
}

.workspace-focus-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.workspace-focus-deadline {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  background: #f8fafc;
  color: #475569;
}

.card-eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.workspace-card {
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.93);
  padding: 1.1rem;
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.teacher-brief-card,
.student-answer-card {
  align-content: start;
}

.workspace-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.workspace-card-head h4 {
  margin: 0.28rem 0 0;
  font-size: 1.18rem;
}

.teacher-brief-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    #ffffff;
  border-color: rgba(191, 219, 254, 0.75);
}

.teacher-brief-head {
  align-items: center;
  gap: 1rem;
}

.teacher-brief-copy {
  min-width: 0;
  display: grid;
  gap: 0.3rem;
}

.teacher-brief-subtitle {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.6;
  max-width: 46rem;
}

.teacher-brief-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.teacher-brief-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.34rem 0.8rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.inline-action {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  border-radius: 14px;
  padding: 0.55rem 0.85rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}

.teacher-brief-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.teacher-brief-stat {
  border-radius: 18px;
  border: 1px solid rgba(219, 234, 254, 0.95);
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 0.9rem 0.95rem;
  display: grid;
  gap: 0.24rem;
}

.teacher-brief-stat span {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #475569;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.teacher-brief-stat i {
  color: #2563eb;
}

.teacher-brief-stat strong {
  color: #0f172a;
  font-size: 0.98rem;
}

.teacher-brief-stat small {
  color: var(--workspace-muted);
  font-size: 0.77rem;
  line-height: 1.5;
}

.brief-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.brief-meta-item {
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 0.85rem 0.9rem;
  display: grid;
  gap: 0.25rem;
}

.brief-meta-item span,
.answer-field > span,
.answer-field-head span {
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
}

.brief-meta-item strong {
  color: #0f172a;
  font-size: 0.98rem;
}

.brief-meta-item small,
.answer-field-head small {
  color: var(--workspace-muted);
  font-size: 0.76rem;
  line-height: 1.45;
}

.brief-section {
  display: grid;
  gap: 0.55rem;
}

.brief-section-card {
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #ffffff;
  padding: 1rem;
}

.brief-section-card.is-instructions {
  border-color: rgba(191, 219, 254, 0.95);
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.brief-section-card.is-materials {
  border-color: rgba(226, 232, 240, 0.95);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.brief-section-head {
  display: grid;
  gap: 0.2rem;
}

.brief-section-title {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 0.75rem;
}

.brief-section-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.95rem;
}

.brief-section-head h5 {
  margin: 0;
  color: #0f172a;
  font-size: 0.98rem;
}

.brief-section-body {
  display: grid;
  gap: 0.7rem;
}

.instruction-copy,
.empty-copy {
  margin: 0;
  line-height: 1.7;
  font-size: 0.9rem;
  padding-left: 3.15rem;
}

.material-list {
  display: grid;
  gap: 0.75rem;
  padding-left: 3.15rem;
}

.material-card {
  width: 100%;
  border: 1px solid rgba(191, 219, 254, 0.85);
  border-radius: 18px;
  background: #f8fbff;
  padding: 0.85rem 0.9rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  text-align: left;
}

.material-icon,
.attachment-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 1rem;
}

.material-copy,
.attachment-copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.material-copy strong,
.attachment-copy strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.material-copy small,
.attachment-copy small {
  color: var(--workspace-muted);
  font-size: 0.78rem;
}

.material-open {
  color: #1d4ed8;
  font-size: 0.9rem;
}

.answer-meta-banner {
  border-radius: 18px;
  border: 1px solid #dbeafe;
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
  padding: 0.9rem 0.95rem;
}

.answer-meta-banner strong {
  color: #0f172a;
  display: block;
  font-size: 0.9rem;
}

.answer-field {
  display: grid;
  gap: 0.55rem;
}

.answer-textarea,
.link-composer input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 18px;
  padding: 0.85rem 0.95rem;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  resize: vertical;
}

.answer-textarea:focus,
.link-composer input:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.18);
}

.link-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
}

.answer-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.answer-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  padding: 0.28rem 0.4rem 0.28rem 0.65rem;
}

.chip-link {
  border: none;
  background: transparent;
  color: #0f172a;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}

.chip-remove {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.hidden-input {
  display: none;
}

.upload-dropzone {
  border: 1px dashed #94a3b8;
  border-radius: 18px;
  background: #f8fafc;
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  color: #0f172a;
  font-weight: 700;
  cursor: pointer;
  padding: 0.9rem;
}

.upload-dropzone:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.attachment-list {
  display: grid;
  gap: 0.7rem;
}

.attachment-card {
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: #ffffff;
  padding: 0.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
}

.attachment-main {
  border: none;
  background: transparent;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  cursor: pointer;
}

.attachment-remove {
  align-self: center;
}

.answer-actions,
.exam-actions {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn,
.ghost-btn {
  border-radius: 16px;
  padding: 0.8rem 1rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: #ffffff;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.2);
}

.secondary-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}

.ghost-btn {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  box-shadow: none;
}

.primary-btn:not(:disabled):hover,
.secondary-btn:not(:disabled):hover,
.ghost-btn:not(:disabled):hover,
.inline-action:hover,
.material-card:hover,
.chip-remove:hover,
.upload-dropzone:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submission-note {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.55;
}

.submission-note.is-warning {
  color: #b91c1c;
}

.exam-detail-card {
  grid-template-columns: 1fr;
}

@media (max-width: 1180px) {
  .response-shell-body {
    grid-template-columns: 1fr;
  }

  .activity-sidebar {
    width: 100%;
  }

  .activity-list {
    max-height: none;
  }
}

@media (max-width: 720px) {
  .workspace-state {
    min-height: 280px;
    padding: 1.25rem 1rem;
    border-radius: 22px;
  }

  .workspace-state-icon {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    font-size: 1.2rem;
  }

  .workspace-state-title {
    font-size: 1rem;
  }

  .workspace-state-copy {
    font-size: 0.88rem;
  }

  .workspace-focus-card {
    grid-template-columns: 1fr;
  }

  .response-shell-body {
    padding: 0.8rem;
  }

  .workspace-card {
    padding: 0.95rem;
  }

  .teacher-brief-actions {
    width: 100%;
  }

  .workspace-focus-meta {
    width: 100%;
    justify-content: flex-start;
  }

  .instruction-copy,
  .empty-copy,
  .material-list {
    padding-left: 0;
  }

  .brief-meta-grid {
    grid-template-columns: 1fr;
  }

  .link-composer {
    grid-template-columns: 1fr;
  }

  .answer-actions,
  .exam-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-btn,
  .secondary-btn,
  .ghost-btn,
  .inline-action {
    width: 100%;
  }
}

@media (min-width: 1360px) {
  .workspace-grid {
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  }

  .activity-sidebar {
    position: sticky;
    top: 0.25rem;
    align-self: start;
    max-height: calc(100vh - 150px);
  }

  .activity-list {
    max-height: calc(100vh - 320px);
  }
}
</style>
