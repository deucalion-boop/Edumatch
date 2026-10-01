<template>
  <div class="student-dashboard-page student-activity-response-page">
    <section class="activity-response-shell" data-tour="student-activities-table">
      <div class="section-header response-header">
        <div class="response-header-copy">
          <span class="page-kicker"><i class="fas fa-clipboard-check" aria-hidden="true"></i> Classwork</span>
          <h2 class="section-title"><span class="highlight">Activities &amp; Exams</span></h2>
          <p class="section-subtitle">
            Choose a task, review what you need, and complete it when you are ready.
          </p>
        </div>
        <div class="response-progress" aria-label="How to complete classwork">
          <span class="is-current"><b>1</b> Choose</span>
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
          <span><b>2</b> Review</span>
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
          <span><b>3</b> Complete</span>
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
                :class="{ active: selectedAssessmentId === assessment.id, locked: assessment.isLocked }"
                :aria-pressed="selectedAssessmentId === assessment.id"
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
                    <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                    {{ assessment.submissionDeadline ? formatDateTime(assessment.submissionDeadline) : 'No due date' }}
                  </span>
                </div>
                <span class="activity-card-arrow" aria-hidden="true"><i class="fas fa-chevron-right"></i></span>
              </button>
            </div>
          </aside>

          <section v-if="selectedAssessment" class="activity-workspace" data-tour="student-activity-detail">
            <article class="workspace-focus-card">
              <span class="workspace-focus-icon" :class="getAssessmentTypeClass(selectedAssessment)" aria-hidden="true">
                <i class="fas" :class="isClassroomTask(selectedAssessment) ? 'fa-pen-to-square' : 'fa-file-circle-check'"></i>
              </span>
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

            <div v-if="selectedAssessment.isLocked" class="assessment-lock-notice" role="status">
              <span><i class="fas fa-lock" aria-hidden="true"></i></span>
              <div><strong>This assessment is locked</strong><p>{{ selectedAssessment.lockReason || 'Complete the required learning steps first.' }}</p></div>
              <router-link v-if="selectedAssessment.lessonId" :to="{ path: '/student/lessons', query: { lessonId: selectedAssessment.lessonId } }">Open lesson</router-link>
            </div>

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
                      <span class="brief-section-icon"><i class="fas fa-book-open"></i></span>
                      <div><h5>Related Lesson</h5><span>Optional lesson material connected to this activity.</span></div>
                    </div>
                  </div>
                  <div class="brief-section-body">
                    <div v-if="getRelatedLessonMaterials(selectedAssessment).length" class="material-list">
                      <button v-for="material in getRelatedLessonMaterials(selectedAssessment)" :key="material.id || material.fileName" type="button" class="material-card" @click="openMaterial(material.url || material.downloadUrl)">
                        <span class="material-icon"><i class="fas fa-book-open"></i></span>
                        <span class="material-copy"><strong>{{ selectedAssessment.linkedLesson?.title || selectedAssessment.lessonTitle }}</strong><small>{{ material.fileName || 'Lesson material' }}</small></span>
                        <span class="material-open"><i class="fas fa-arrow-up-right-from-square"></i></span>
                      </button>
                    </div>
                    <p v-else class="empty-copy">No related lesson was linked to this activity.</p>
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
                    <div v-if="getActivityAttachments(selectedAssessment).length" class="material-list">
                      <button
                        v-for="material in getActivityAttachments(selectedAssessment)"
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

                  <section v-if="getActivitySubmission(selectedAssessment)?.gradedAt || getActivitySubmission(selectedAssessment)?.teacherFeedback" class="submission-result-card">
                    <div><span>Grading status</span><strong>{{ getAssessmentState(selectedAssessment).label }}</strong></div>
                    <div v-if="getActivitySubmission(selectedAssessment)?.gradeValue !== null"><span>Final score</span><strong>{{ getActivitySubmission(selectedAssessment).gradeValue }}/{{ selectedAssessment.activityPoints }}</strong></div>
                    <p v-if="getActivitySubmission(selectedAssessment)?.teacherFeedback"><strong>Teacher feedback</strong>{{ getActivitySubmission(selectedAssessment).teacherFeedback }}</p>
                  </section>

                  <label v-if="isSubmissionTypeAllowed(selectedAssessment, 'written')" class="answer-field">
                  <span>Written response</span>
                  <textarea
                    v-model="activityForm.responseText"
                    class="answer-textarea"
                    rows="10"
                    placeholder="Type your answer, reflection, summary, or explanation here..."
                    :disabled="!canEditSelectedActivity"
                  ></textarea>
                </label>

                <div v-if="isSubmissionTypeAllowed(selectedAssessment, 'link')" class="answer-field">
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

                <div v-if="isSubmissionTypeAllowed(selectedAssessment, 'file')" class="answer-field">
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
                  <button type="button" class="ghost-btn" :disabled="!canEditSelectedActivity || isSavingDraft" @click="saveActivityDraft">
                    <i class="fas" :class="isSavingDraft ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
                    {{ isSavingDraft ? 'Saving...' : 'Save Draft' }}
                  </button>
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
                  <h4>Get ready for your assessment</h4>
                  <p class="exam-card-subtitle">Read the instructions and make sure you have enough uninterrupted time before starting.</p>
                </div>
              </header>

              <div class="exam-review-layout">
                <div class="exam-review-content">
                  <section class="brief-section exam-brief-section is-instructions">
                    <div class="brief-section-title">
                      <span class="brief-section-icon"><i class="fas fa-list-check"></i></span>
                      <div>
                        <h5>Instructions</h5>
                        <span>Read these directions before you begin.</span>
                      </div>
                    </div>
                    <p v-if="selectedAssessment.challengeDescription" class="instruction-copy">{{ selectedAssessment.challengeDescription }}</p>
                    <p v-else class="empty-copy">No special instructions were provided. Answer every item carefully before submitting.</p>
                  </section>

                  <section class="brief-section exam-brief-section">
                    <div class="brief-section-title">
                      <span class="brief-section-icon is-resource"><i class="fas fa-book-open"></i></span>
                      <div>
                        <h5>Study resource</h5>
                        <span>Review the linked lesson before starting, if one is available.</span>
                      </div>
                    </div>

                    <div v-if="selectedAssessment.linkedLesson" class="material-list">
                      <button type="button" class="material-card" @click="openMaterial(selectedAssessment.linkedLesson.pdfPath)">
                        <span class="material-icon" aria-hidden="true"><i class="fas fa-file-pdf"></i></span>
                        <span class="material-copy">
                          <strong>{{ selectedAssessment.linkedLesson.title || selectedAssessment.lessonTitle || 'Lesson Material' }}</strong>
                          <small>{{ selectedAssessment.linkedLesson.pdfOriginalName || 'Teacher lesson file' }}</small>
                        </span>
                        <span class="material-open"><i class="fas fa-arrow-up-right-from-square"></i></span>
                      </button>
                    </div>
                    <div v-else class="resource-empty">
                      <i class="fas fa-circle-check" aria-hidden="true"></i>
                      <span>No lesson is linked. You can continue when ready.</span>
                    </div>
                  </section>

                  <section v-if="getActivityAttachments(selectedAssessment).length" class="brief-section exam-brief-section">
                    <div class="brief-section-title">
                      <span class="brief-section-icon is-resource"><i class="fas fa-paperclip"></i></span>
                      <div>
                        <h5>Assessment attachments</h5>
                        <span>Open each teacher file individually before starting.</span>
                      </div>
                    </div>
                    <div class="material-list">
                      <button
                        v-for="material in getActivityAttachments(selectedAssessment)"
                        :key="material.id || material.fileName"
                        type="button"
                        class="material-card"
                        @click="openMaterial(material.url || material.downloadUrl)"
                      >
                        <span class="material-icon" aria-hidden="true"><i class="fas" :class="material.canPreviewInline ? 'fa-file-pdf' : 'fa-file-alt'"></i></span>
                        <span class="material-copy">
                          <strong>{{ material.fileName || 'Assessment attachment' }}</strong>
                          <small>{{ material.extension ? material.extension.replace('.', '').toUpperCase() : material.fileType || 'File' }} · {{ formatBytes(material.size) }}</small>
                        </span>
                        <span class="material-open"><i class="fas fa-arrow-up-right-from-square"></i></span>
                      </button>
                    </div>
                  </section>
                </div>

                <aside class="exam-start-panel">
                  <div class="exam-start-panel-head">
                    <span class="card-eyebrow">At a glance</span>
                    <span class="answer-status-pill" :class="getAssessmentState(selectedAssessment).tone">
                      {{ getAssessmentState(selectedAssessment).label }}
                    </span>
                  </div>
                  <div class="exam-stat-list">
                    <div class="exam-stat"><i class="fas fa-clock" aria-hidden="true"></i><span>Time limit<small>Starts when you begin</small></span><strong>{{ selectedAssessment.examDurationMinutes || 30 }} min</strong></div>
                    <div class="exam-stat"><i class="fas fa-list-ol" aria-hidden="true"></i><span>Questions</span><strong>{{ selectedAssessment.numberOfItems || 0 }}</strong></div>
                    <div class="exam-stat"><i class="fas fa-signal" aria-hidden="true"></i><span>Difficulty</span><strong>{{ formatLabel(selectedAssessment.difficulty || 'N/A') }}</strong></div>
                    <div class="exam-stat"><i class="fas fa-calendar-day" aria-hidden="true"></i><span>Due<small>{{ selectedAssessment.submissionDeadline ? getRemainingLabel(selectedAssessment.submissionDeadline) : 'No deadline set' }}</small></span><strong>{{ selectedAssessment.submissionDeadline ? formatDateTime(selectedAssessment.submissionDeadline) : 'Open' }}</strong></div>
                  </div>
                  <div class="exam-ready-note"><i class="fas fa-shield-halved" aria-hidden="true"></i><span>Once started, your timer will continue running.</span></div>
                  <button
                    type="button"
                    class="primary-btn exam-start-btn"
                    data-tour="student-activity-start"
                    :disabled="isAssessmentStartDisabled(selectedAssessment)"
                    @click="openAssessmentExam(selectedAssessment)"
                  >
                    <span>{{ getAssessmentActionLabel(selectedAssessment) }}</span>
                    <i class="fas fa-arrow-right" aria-hidden="true"></i>
                  </button>
                </aside>
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
      isSavingDraft: false,
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
      return !['submitted', 'late', 'graded', 'missing', 'locked'].includes(state.key)
    },
    canTurnIn() {
      return this.canEditSelectedActivity && !this.isTurningIn && !this.isUnsubmitting
    },
    canUnsubmit() {
      const assessment = this.selectedAssessment
      if (!assessment || !this.isClassroomTask(assessment)) return false
      const state = this.getAssessmentState(assessment)
      return ['submitted', 'late'].includes(state.key)
        && assessment.allowResubmission !== false
        && (!this.isDeadlinePassed(assessment.submissionDeadline) || assessment.allowLateSubmissions === true)
        && !this.isUnsubmitting
    }
  },
  watch: {
    '$route.query.assessmentId'() { this.fetchChallenges() },
    selectedAssessmentId() {
      this.syncActivityFormFromSelection()
    }
  },
  methods: {
    openNotificationAssessment() {
      const assessment = this.assessments.find(row => String(row.id) === String(this.$route.query.assessmentId || ''))
      if (assessment) this.selectAssessment(assessment)
    },
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
      const count = this.getActivityAttachments(assessment).length
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
          allowedSubmissionTypes: Array.isArray(assessment.allowedSubmissionTypes) && assessment.allowedSubmissionTypes.length
            ? assessment.allowedSubmissionTypes
            : ['written', 'link', 'file'],
          allowResubmission: assessment.allowResubmission !== false,
          allowLateSubmissions: assessment.allowLateSubmissions === true,
          challengeDescription: String(assessment.challengeDescription || '').trim(),
          createdAt: assessment.createdAt,
          submissionDeadline: assessment.submissionDeadline || null,
          examDurationMinutes: Number(assessment.examDurationMinutes || 30),
          attachments: Array.isArray(assessment.attachments) ? assessment.attachments : [],
          isLocked: assessment.isLocked === true,
          lockReason: String(assessment.lockReason || ''),
          prerequisite: assessment.prerequisite || null,
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
      const labels = { written: 'written response', link: 'external link', file: 'file upload' }
      const methods = (assessment?.allowedSubmissionTypes || ['written', 'link', 'file']).map((type) => labels[type]).filter(Boolean).join(', ')
      const turnInCopy = `Submit at least one allowed item: ${methods}.`
      return points ? `This activity is worth ${points} points. ${turnInCopy}` : turnInCopy
    },
    isSubmissionTypeAllowed(assessment, type) {
      const allowed = Array.isArray(assessment?.allowedSubmissionTypes) && assessment.allowedSubmissionTypes.length
        ? assessment.allowedSubmissionTypes
        : ['written', 'link', 'file']
      return allowed.includes(type)
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
          if (String(submission.status || '').trim().toLowerCase() === 'returned_for_revision') {
            return {
              key: 'revision',
              label: 'Returned for Revision',
              tone: 'revision',
              support: submission.teacherFeedback || 'Your teacher requested changes. Update and resubmit your work.'
            }
          }
          const isGraded = Boolean(submission.gradedAt || submission.gradeValue !== null)
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
            if (submission.isLate) {
              return {
                key: 'late',
                label: 'Late',
                tone: 'late',
                support: submission.submittedAt ? `Submitted late on ${this.formatDateTime(submission.submittedAt)}.` : 'This work was submitted after the deadline.'
              }
            }
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
          if (assessment.allowLateSubmissions === true) {
            return {
              key: 'assigned',
              label: 'Not Submitted',
              tone: 'assigned',
              support: 'The deadline passed, but your teacher is accepting late submissions.'
            }
          }
          return {
            key: 'missing',
            label: 'Not Submitted',
            tone: 'missing',
            support: 'The due date has passed and no submission was turned in.'
          }
        }

        return {
          key: 'assigned',
          label: 'Not Submitted',
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
    getActivityAttachments(assessment) {
      return Array.isArray(assessment?.attachments) ? assessment.attachments : []
    },
    getRelatedLessonMaterials(assessment) {
      const lesson = assessment?.linkedLesson || null
      const lessonAttachments = Array.isArray(lesson?.attachments) ? lesson.attachments : []
      if (lessonAttachments.length) return lessonAttachments
      return lesson?.pdfPath ? [{
        id: `${lesson.id || assessment.id}-pdf`,
        fileName: lesson.pdfOriginalName || 'Lesson material',
        url: lesson.pdfPath,
        canPreviewInline: true
      }] : []
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
        late: 3,
        revision: 2,
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
      if (!window.confirm(`Turn in this activity${this.isDeadlinePassed(assessment.submissionDeadline) ? ' as a late submission' : ''}?`)) return

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
    async saveActivityDraft() {
      const assessment = this.selectedAssessment
      if (!assessment || !this.isClassroomTask(assessment) || !this.canEditSelectedActivity) return
      this.isSavingDraft = true
      this.clearNotice()
      try {
        const response = await axios.post(
          `${this.resolveApiBaseUrl()}/student/assessments/${assessment.id}/activity-response/draft`,
          this.buildActivityFormData(),
          this.getMultipartAuthConfig()
        )
        const submission = response.data?.submission || response.data?.data?.submission
        if (submission?.assessmentId) {
          this.activitySubmissionsByAssessmentId = { ...this.activitySubmissionsByAssessmentId, [submission.assessmentId]: submission }
          this.refreshAssessmentsFromState()
          this.syncActivityFormFromSelection()
        }
        this.setNotice('success', response.data?.message || 'Activity draft saved.')
      } catch (error) {
        this.setNotice('error', this.getAxiosErrorMessage(error, 'Failed to save activity draft.'))
      } finally {
        this.isSavingDraft = false
      }

      if (assessment.isLocked) {
        return {
          key: 'locked',
          label: 'Locked',
          tone: 'locked',
          support: assessment.lockReason || 'Complete the required learning steps first.'
        }
      }
    },
    async unsubmitSelectedActivity() {
      const assessment = this.selectedAssessment
      if (!assessment || !this.isClassroomTask(assessment)) return
      if (!window.confirm('Unsubmit this activity so you can edit and submit it again?')) return

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
      return ['completed', 'closed', 'locked'].includes(state.key)
    },
    getAssessmentActionLabel(assessment) {
      const state = this.getAssessmentState(assessment)
      if (state.key === 'completed') return 'Submitted / Completed'
      if (state.key === 'closed') return 'Deadline Closed'
      if (state.key === 'locked') return 'Locked'
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
        this.openNotificationAssessment()
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
@reference "../../styles/tailwind.css";
.assessment-lock-notice {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border:1px_solid_#f4d38a];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#fffbeb];
  @apply tw:[color:#78350f];
}
.assessment-lock-notice > span { @apply tw:[width:38px]; @apply tw:[height:38px]; @apply tw:inline-flex; @apply tw:items-center; @apply tw:justify-center; @apply tw:[border-radius:11px]; @apply tw:[background:#fef3c7]; }
.assessment-lock-notice strong { @apply tw:block; @apply tw:[font-size:0.88rem]; }
.assessment-lock-notice p { @apply tw:[margin:0.15rem_0_0]; @apply tw:[color:#92400e]; @apply tw:[font-size:0.76rem]; }
.assessment-lock-notice a { @apply tw:[padding:0.5rem_0.75rem]; @apply tw:[border-radius:9px]; @apply tw:[background:#92400e]; @apply tw:[color:#fff]; @apply tw:[font-size:0.75rem]; @apply tw:[font-weight:700]; @apply tw:[text-decoration:none]; }
.activity-list-card.locked { @apply tw:[border-style:dashed]; @apply tw:[background:#f8fafc]; }
.activity-list-card.locked .activity-card-arrow { @apply tw:[color:#94a3b8]; }
.activity-status-pill.locked,
.answer-status-pill.locked { @apply tw:[background:#e2e8f0]; @apply tw:[color:#475569]; }

@media (max-width: 640px) {
  .assessment-lock-notice { @apply tw:[grid-template-columns:auto_1fr]; }
  .assessment-lock-notice a { @apply tw:[grid-column:1_/_-1]; @apply tw:text-center; }
}

.submission-result-card {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.85rem];
  @apply tw:[padding:1rem];
  @apply tw:[margin-bottom:1rem];
  @apply tw:[border:1px_solid_#bfdbfe];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#eff6ff];
}
.submission-result-card div { @apply tw:grid; @apply tw:[gap:0.2rem]; }
.submission-result-card span { @apply tw:[color:#64748b]; @apply tw:[font-size:0.78rem]; @apply tw:uppercase; }
.submission-result-card p { @apply tw:[grid-column:1_/_-1]; @apply tw:grid; @apply tw:[gap:0.35rem]; @apply tw:[margin:0]; @apply tw:[color:#334155]; }
.activity-status-pill.late, .answer-status-pill.late { @apply tw:[background:#fff7ed]; @apply tw:[color:#c2410c]; }
.activity-status-pill.revision, .answer-status-pill.revision { @apply tw:[background:#fdf4ff]; @apply tw:[color:#a21caf]; }
@media (max-width: 620px) { .submission-result-card { @apply tw:[grid-template-columns:1fr]; } }
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
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.response-header {
  @apply tw:flex;
  @apply tw:items-end;
  @apply tw:justify-between;
  @apply tw:[gap:1.5rem];
  @apply tw:flex-wrap;
  @apply tw:[padding:0.25rem_0.15rem_0.4rem];
}

.response-header-copy {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.page-kicker {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[color:#2563eb];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.response-progress {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[padding:0.55rem_0.65rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.84)];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
}

.response-progress span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.38rem];
}

.response-progress b {
  @apply tw:[width:24px];
  @apply tw:[height:24px];
  @apply tw:[border-radius:50%];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.7rem];
}

.response-progress .is-current {
  @apply tw:[color:#1d4ed8];
}

.response-progress .is-current b {
  @apply tw:[background:#4f8a35];
  @apply tw:[color:#fff];
}

.response-progress > i {
  @apply tw:[color:#cbd5e1];
  @apply tw:[font-size:0.62rem];
}

.section-subtitle {
  @apply tw:[margin:0.45rem_0_0];
  @apply tw:[max-width:58rem];
  @apply tw:[color:var(--workspace-muted)];
  @apply tw:[font-size:0.92rem];
  @apply tw:[line-height:1.6];
}

.workspace-focus-card {
  @apply tw:[border:1px_solid_rgba(219,_234,_254,_0.92)];
  @apply tw:[border-radius:22px];
  @apply tw:[background:rgba(255,_255,_255,_0.82)];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:grid;
  @apply tw:[gap:0.4rem];
}

.workspace-focus-copy h3 {
  @apply tw:[margin:0];
  @apply tw:[color:var(--workspace-ink)];
  @apply tw:[font-size:1rem];
  @apply tw:[line-height:1.3];
}

.workspace-focus-copy p,
.answer-card-subtitle,
.exam-card-subtitle {
  @apply tw:[margin:0];
  @apply tw:[color:var(--workspace-muted)];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.55];
}

.response-flash {
  @apply tw:[border-radius:18px];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[font-weight:600];
}

.response-flash.success {
  @apply tw:[background:#ecfdf5];
  @apply tw:[color:#166534];
  @apply tw:[border-color:#bbf7d0];
}

.response-flash.error {
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
  @apply tw:[border-color:#fecaca];
}

.response-shell-body {
  @apply tw:[min-height:520px];
  @apply tw:[border:1px_solid_var(--workspace-border)];
  @apply tw:[border-radius:var(--workspace-radius)];
  @apply tw:[background:linear-gradient(145deg,_#f8fafc_0%,_#f5f8fc_100%)];
  @apply tw:[box-shadow:var(--workspace-shadow)];
  @apply tw:[padding:1rem];
  @apply tw:grid;
  @apply tw:[grid-template-columns:292px_minmax(0,_1fr)];
  @apply tw:[gap:1.15rem];
}

.workspace-state {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:justify-self-center;
  @apply tw:self-center;
  @apply tw:[width:min(100%,_560px)];
  @apply tw:[min-height:320px];
  @apply tw:[padding:1.75rem_1.4rem];
  @apply tw:grid;
  @apply tw:justify-items-center;
  @apply tw:content-center;
  @apply tw:[gap:0.8rem];
  @apply tw:text-center;
  @apply tw:[color:var(--workspace-muted)];
}

.workspace-state-icon {
  @apply tw:[width:72px];
  @apply tw:[height:72px];
  @apply tw:[border-radius:22px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#f4f7d8];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.55)];
  @apply tw:[color:#4f6314];
  @apply tw:[font-size:1.35rem];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.7)];
}

.workspace-state-icon.is-empty {
  @apply tw:[background:linear-gradient(135deg,_#f4f7d8_0%,_#eef6c0_100%)];
  @apply tw:[border-color:rgba(169,_213,_95,_0.6)];
  @apply tw:[color:#4f6314];
}

.workspace-state-title {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:1.1rem];
  @apply tw:[line-height:1.3];
}

.workspace-state-copy {
  @apply tw:block;
  @apply tw:[max-width:34rem];
  @apply tw:[margin:0];
  @apply tw:[color:#4d6120];
  @apply tw:[font-size:0.92rem];
  @apply tw:[line-height:1.65];
  @apply tw:text-center;
}

.workspace-state.is-loading {
  @apply tw:[width:min(100%,_460px)];
}

.activity-sidebar {
  @apply tw:[width:292px];
  @apply tw:[min-width:0];
  @apply tw:[border-radius:20px];
  @apply tw:[border:1px_solid_rgba(148,_163,_184,_0.22)];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
  @apply tw:[padding:1rem];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.95rem];
}

.activity-sidebar-copy {
  @apply tw:grid;
  @apply tw:[gap:0.25rem];
}

.sidebar-step {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.activity-sidebar-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.activity-sidebar-head h3 {
  @apply tw:[margin:0];
  @apply tw:[color:var(--workspace-ink)];
  @apply tw:[font-size:1.02rem];
}

.activity-sidebar-head p {
  @apply tw:[margin:0.3rem_0_0];
  @apply tw:[color:var(--workspace-muted)];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.5];
}

.activity-sidebar-count {
  @apply tw:[min-width:32px];
  @apply tw:[height:32px];
  @apply tw:[border-radius:11px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#e0f2fe];
  @apply tw:[color:#0f172a];
  @apply tw:[font-weight:700];
}

.activity-list {
  @apply tw:grid;
  @apply tw:[gap:0.7rem];
  @apply tw:[max-height:760px];
  @apply tw:overflow-y-auto;
  @apply tw:[padding-right:0.15rem];
}

.activity-list-card {
  @apply tw:relative;
  @apply tw:w-full;
  @apply tw:[border:1px_solid_rgba(191,_219,_254,_0.8)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f8fbff];
  @apply tw:[padding:0.9rem_2.15rem_0.9rem_0.9rem];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
  @apply tw:[transition:transform_0.18s_ease,_border-color_0.18s_ease,_box-shadow_0.18s_ease,_background-color_0.18s_ease];
}

.activity-list-card:hover,
.activity-list-card.active {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#60a5fa];
  @apply tw:[box-shadow:0_18px_38px_rgba(37,_99,_235,_0.12)];
  @apply tw:[background:#ffffff];
}

.activity-list-card.active {
  @apply tw:[border-color:#1e4307];
  @apply tw:[box-shadow:0_12px_28px_rgba(30,_67,_7,_0.13)];
}

.activity-list-card:focus-visible {
  @apply tw:[outline:3px_solid_rgba(37,_99,_235,_0.24)];
  @apply tw:[outline-offset:2px];
}

.activity-card-arrow {
  @apply tw:absolute;
  @apply tw:[right:0.85rem];
  @apply tw:[top:50%];
  @apply tw:[transform:translateY(-50%)];
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.7rem];
}

.activity-list-card.active .activity-card-arrow {
  @apply tw:[color:#1e4307];
}

.activity-list-top {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.6rem];
  @apply tw:flex-wrap;
}

.activity-type-pill,
.activity-status-pill,
.answer-status-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:w-fit;
  @apply tw:[padding:0.28rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.03em];
}

.activity-type-pill.is-activity {
  @apply tw:[background:var(--activity-accent-soft)];
  @apply tw:[color:var(--activity-accent)];
}

.activity-type-pill.is-quiz {
  @apply tw:[background:var(--quiz-accent-soft)];
  @apply tw:[color:var(--quiz-accent)];
}

.activity-type-pill.is-exam {
  @apply tw:[background:var(--exam-accent-soft)];
  @apply tw:[color:var(--exam-accent)];
}

.activity-type-pill.is-neutral {
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#475569];
}

.activity-status-pill.assigned,
.answer-status-pill.assigned {
  @apply tw:[background:var(--status-assigned-bg)];
  @apply tw:[color:var(--status-assigned)];
}

.activity-status-pill.draft,
.answer-status-pill.draft {
  @apply tw:[background:var(--status-draft-bg)];
  @apply tw:[color:var(--status-draft)];
}

.activity-status-pill.submitted,
.answer-status-pill.submitted,
.activity-status-pill.completed,
.answer-status-pill.completed {
  @apply tw:[background:var(--status-submitted-bg)];
  @apply tw:[color:var(--status-submitted)];
}

.activity-status-pill.graded,
.answer-status-pill.graded {
  @apply tw:[background:var(--status-graded-bg)];
  @apply tw:[color:var(--status-graded)];
}

.activity-status-pill.missing,
.answer-status-pill.missing {
  @apply tw:[background:var(--status-missing-bg)];
  @apply tw:[color:var(--status-missing)];
}

.activity-status-pill.closed,
.answer-status-pill.closed {
  @apply tw:[background:var(--status-closed-bg)];
  @apply tw:[color:var(--status-closed)];
}

.activity-list-card strong,
.workspace-card-head h4 {
  @apply tw:[color:var(--workspace-ink)];
}

.activity-list-card strong {
  @apply tw:[font-size:0.98rem];
}

.activity-list-copy {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.activity-list-card p,
.card-eyebrow,
.teacher-brief-subtitle,
.brief-section-head span,
.empty-copy,
.instruction-copy,
.answer-meta-banner small,
.submission-note {
  @apply tw:[color:var(--workspace-muted)];
}

.activity-list-card p {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.83rem];
  @apply tw:[line-height:1.45];
}

.activity-list-meta {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.3rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.76rem];
}

.activity-list-meta span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
}

.activity-list-meta i {
  @apply tw:[color:#64748b];
}

.activity-workspace {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.workspace-focus-card {
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto];
  @apply tw:items-center;
  @apply tw:[gap:1rem];
  @apply tw:[background:linear-gradient(135deg,_#ffffff_0%,_#f7faff_100%)];
  @apply tw:[box-shadow:0_10px_30px_rgba(15,_23,_42,_0.045)];
}

.workspace-focus-icon {
  @apply tw:[width:46px];
  @apply tw:[height:46px];
  @apply tw:[border-radius:15px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[color:#1d4ed8];
  @apply tw:[background:#dbeafe];
  @apply tw:[font-size:1rem];
}

.workspace-focus-icon.is-exam {
  @apply tw:[color:#b45309];
  @apply tw:[background:#fef3c7];
}

.workspace-focus-icon.is-activity {
  @apply tw:[color:#0f766e];
  @apply tw:[background:#ccfbf1];
}

.workspace-focus-copy {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.25rem];
}

.workspace-focus-meta {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-end;
  @apply tw:[gap:0.55rem];
  @apply tw:flex-wrap;
}

.workspace-focus-deadline {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0.3rem_0.75rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
}

.card-eyebrow {
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.workspace-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:1rem];
  @apply tw:[align-items:start];
}

.workspace-card {
  @apply tw:[border-radius:24px];
  @apply tw:[border:1px_solid_rgba(226,_232,_240,_0.95)];
  @apply tw:[background:rgba(255,_255,_255,_0.93)];
  @apply tw:[padding:1.25rem];
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[min-width:0];
}

.teacher-brief-card,
.student-answer-card {
  @apply tw:[align-content:start];
}

.workspace-card-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-wrap;
}

.workspace-card-head h4 {
  @apply tw:[margin:0.28rem_0_0];
  @apply tw:[font-size:1.18rem];
}

.teacher-brief-card {
  @apply tw:[background:linear-gradient(180deg,_rgba(255,_255,_255,_0.98),_rgba(248,_250,_252,_0.96)),______#ffffff];
  @apply tw:[border-color:rgba(191,_219,_254,_0.75)];
}

.teacher-brief-head {
  @apply tw:items-center;
  @apply tw:[gap:1rem];
}

.teacher-brief-copy {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.3rem];
}

.teacher-brief-subtitle {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.88rem];
  @apply tw:[line-height:1.6];
  @apply tw:[max-width:46rem];
}

.teacher-brief-actions {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.6rem];
  @apply tw:flex-wrap;
}

.teacher-brief-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.34rem_0.8rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.03em];
  @apply tw:uppercase;
}

.inline-action {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:0.55rem_0.85rem];
  @apply tw:[font-weight:700];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:cursor-pointer;
}

.teacher-brief-summary {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(180px,_1fr))];
  @apply tw:[gap:0.75rem];
}

.teacher-brief-stat {
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_rgba(219,_234,_254,_0.95)];
  @apply tw:[background:linear-gradient(180deg,_#f8fbff_0%,_#ffffff_100%)];
  @apply tw:[padding:0.9rem_0.95rem];
  @apply tw:grid;
  @apply tw:[gap:0.24rem];
}

.teacher-brief-stat span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.03em];
  @apply tw:uppercase;
}

.teacher-brief-stat i {
  @apply tw:[color:#2563eb];
}

.teacher-brief-stat strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.98rem];
}

.teacher-brief-stat small {
  @apply tw:[color:var(--workspace-muted)];
  @apply tw:[font-size:0.77rem];
  @apply tw:[line-height:1.5];
}

.brief-meta-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.85rem];
}

.brief-meta-item {
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f8fafc];
  @apply tw:[border:1px_solid_rgba(226,_232,_240,_0.9)];
  @apply tw:[padding:0.85rem_0.9rem];
  @apply tw:grid;
  @apply tw:[gap:0.25rem];
}

.brief-meta-item span,
.answer-field > span,
.answer-field-head span {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
}

.brief-meta-item strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.98rem];
}

.brief-meta-item small,
.answer-field-head small {
  @apply tw:[color:var(--workspace-muted)];
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.45];
}

.brief-section {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
}

.brief-section-card {
  @apply tw:[border-radius:20px];
  @apply tw:[border:1px_solid_rgba(226,_232,_240,_0.9)];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:1rem];
}

.brief-section-card.is-instructions {
  @apply tw:[border-color:rgba(191,_219,_254,_0.95)];
  @apply tw:[background:linear-gradient(180deg,_#f8fbff_0%,_#ffffff_100%)];
}

.brief-section-card.is-materials {
  @apply tw:[border-color:rgba(226,_232,_240,_0.95)];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
}

.brief-section-head {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.brief-section-title {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_1fr];
  @apply tw:[align-items:start];
  @apply tw:[gap:0.75rem];
}

.brief-section-icon {
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.95rem];
}

.brief-section-head h5 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.98rem];
}

.brief-section-body {
  @apply tw:grid;
  @apply tw:[gap:0.7rem];
}

.instruction-copy,
.empty-copy {
  @apply tw:[margin:0];
  @apply tw:[line-height:1.7];
  @apply tw:[font-size:0.9rem];
  @apply tw:[padding-left:3.15rem];
}

.material-list {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
  @apply tw:[padding-left:3.15rem];
}

.material-card {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_rgba(191,_219,_254,_0.85)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f8fbff];
  @apply tw:[padding:0.85rem_0.9rem];
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_1fr_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:cursor-pointer;
  @apply tw:text-left;
}

.material-icon,
.attachment-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:1rem];
}

.material-copy,
.attachment-copy {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
  @apply tw:[min-width:0];
}

.material-copy strong,
.attachment-copy strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.9rem];
}

.material-copy small,
.attachment-copy small {
  @apply tw:[color:var(--workspace-muted)];
  @apply tw:[font-size:0.78rem];
}

.material-open {
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.9rem];
}

.answer-meta-banner {
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_#dbeafe];
  @apply tw:[background:linear-gradient(135deg,_#eff6ff,_#f8fafc)];
  @apply tw:[padding:0.9rem_0.95rem];
}

.answer-meta-banner strong {
  @apply tw:[color:#0f172a];
  @apply tw:block;
  @apply tw:[font-size:0.9rem];
}

.answer-field {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
}

.answer-textarea,
.link-composer input {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:18px];
  @apply tw:[padding:0.85rem_0.95rem];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[font:inherit];
  @apply tw:resize-y;
}

.answer-textarea:focus,
.link-composer input:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#60a5fa];
  @apply tw:[box-shadow:0_0_0_4px_rgba(96,_165,_250,_0.18)];
}

.link-composer {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_auto];
  @apply tw:[gap:0.65rem];
}

.answer-chip-list {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.65rem];
}

.answer-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.3rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#f8fafc];
  @apply tw:[padding:0.28rem_0.4rem_0.28rem_0.65rem];
}

.chip-link {
  @apply tw:[border:none];
  @apply tw:[background:transparent];
  @apply tw:[color:#0f172a];
  @apply tw:[font-weight:600];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:cursor-pointer;
}

.chip-remove {
  @apply tw:[width:28px];
  @apply tw:[height:28px];
  @apply tw:[border:none];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e2e8f0];
  @apply tw:[color:#475569];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:cursor-pointer;
}

.hidden-input {
  @apply tw:hidden;
}

.upload-dropzone {
  @apply tw:[border:1px_dashed_#94a3b8];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f8fafc];
  @apply tw:[min-height:78px];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
  @apply tw:[padding:0.9rem];
}

.upload-dropzone:disabled {
  @apply tw:cursor-not-allowed;
  @apply tw:[opacity:0.7];
}

.attachment-list {
  @apply tw:grid;
  @apply tw:[gap:0.7rem];
}

.attachment-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.5rem];
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
}

.attachment-main {
  @apply tw:[border:none];
  @apply tw:[background:transparent];
  @apply tw:w-full;
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_1fr];
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
}

.attachment-remove {
  @apply tw:self-center;
}

.answer-actions,
.exam-actions {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:flex-wrap;
}

.primary-btn,
.secondary-btn,
.ghost-btn {
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.8rem_1rem];
  @apply tw:[font-weight:700];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.55rem];
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.18s_ease,_box-shadow_0.18s_ease,_opacity_0.18s_ease];
}

.primary-btn {
  @apply tw:[border:none];
  @apply tw:[background:linear-gradient(135deg,_#1d4ed8,_#2563eb)];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_16px_32px_rgba(37,_99,_235,_0.2)];
}

.secondary-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
}

.ghost-btn {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
}

.primary-btn:disabled,
.secondary-btn:disabled,
.ghost-btn:disabled {
  @apply tw:[opacity:0.65];
  @apply tw:cursor-not-allowed;
  @apply tw:[box-shadow:none];
}

.primary-btn:not(:disabled):hover,
.secondary-btn:not(:disabled):hover,
.ghost-btn:not(:disabled):hover,
.inline-action:hover,
.material-card:hover,
.chip-remove:hover,
.upload-dropzone:hover:not(:disabled) {
  @apply tw:[transform:translateY(-1px)];
}

.submission-note {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.55];
}

.submission-note.is-warning {
  @apply tw:[color:#b91c1c];
}

.exam-detail-card {
  @apply tw:[grid-template-columns:1fr];
  @apply tw:[gap:1.2rem];
  @apply tw:overflow-hidden;
}

.exam-review-layout {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(300px,_0.42fr)];
  @apply tw:[gap:1.25rem];
  @apply tw:[align-items:start];
}

.exam-review-content {
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.exam-brief-section {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:20px];
  @apply tw:[padding:1rem];
  @apply tw:[background:#fff];
}

.exam-brief-section.is-instructions {
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[background:linear-gradient(145deg,_#f8fbff_0%,_#fff_65%)];
}

.exam-brief-section .brief-section-title {
  @apply tw:[margin-bottom:0.15rem];
}

.exam-brief-section .brief-section-title h5 {
  @apply tw:[margin:0_0_0.18rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.98rem];
}

.exam-brief-section .brief-section-title span:not(.brief-section-icon) {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.45];
}

.brief-section-icon.is-resource {
  @apply tw:[color:#047857];
  @apply tw:[background:#d1fae5];
}

.exam-brief-section .instruction-copy,
.exam-brief-section .empty-copy,
.exam-brief-section .material-list {
  @apply tw:[padding-left:3.25rem];
}

.resource-empty {
  @apply tw:[margin-left:3.25rem];
  @apply tw:[min-height:64px];
  @apply tw:[padding:0.85rem_1rem];
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[border-radius:16px];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.84rem];
}

.resource-empty i {
  @apply tw:[color:#10b981];
}

.exam-start-panel {
  @apply tw:sticky;
  @apply tw:[top:1rem];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:20px];
  @apply tw:[padding:1rem];
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[box-shadow:0_16px_34px_rgba(15,_23,_42,_0.08)];
}

.exam-start-panel-head {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.exam-start-panel .card-eyebrow {
  @apply tw:[color:#64748b];
}

.exam-stat-list {
  @apply tw:grid;
}

.exam-stat {
  @apply tw:[min-height:58px];
  @apply tw:[padding:0.75rem_0];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
  @apply tw:grid;
  @apply tw:[grid-template-columns:34px_minmax(0,_1fr)_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
}

.exam-stat:first-child {
  @apply tw:[padding-top:0];
}

.exam-stat > i {
  @apply tw:[width:34px];
  @apply tw:[height:34px];
  @apply tw:[border-radius:11px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#2563eb];
}

.exam-stat span {
  @apply tw:grid;
  @apply tw:[gap:0.12rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.exam-stat small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:500];
}

.exam-stat strong {
  @apply tw:[max-width:126px];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.83rem];
  @apply tw:[line-height:1.35];
  @apply tw:text-right;
}

.exam-ready-note {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.55rem];
  @apply tw:[padding:0.75rem];
  @apply tw:[border-radius:14px];
  @apply tw:[border:1px_solid_#fde68a];
  @apply tw:[background:#fffbeb];
  @apply tw:[color:#92400e];
  @apply tw:[font-size:0.75rem];
  @apply tw:[line-height:1.45];
}

.exam-ready-note i {
  @apply tw:[margin-top:0.15rem];
}

.exam-start-btn {
  @apply tw:w-full;
  @apply tw:[min-height:48px];
  @apply tw:justify-between;
  @apply tw:[background:linear-gradient(135deg,_#2563eb,_#3b82f6)];
  @apply tw:[box-shadow:0_14px_28px_rgba(37,_99,_235,_0.3)];
}

@media (max-width: 1180px) {
  .response-shell-body {
    @apply tw:[grid-template-columns:1fr];
  }

  .activity-sidebar {
    @apply tw:w-full;
  }

  .activity-list {
    @apply tw:max-h-none;
    @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(245px,_1fr))];
  }

  .exam-review-layout {
    @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(280px,_0.55fr)];
  }
}

@media (max-width: 720px) {
  .workspace-state {
    @apply tw:[min-height:280px];
    @apply tw:[padding:1.25rem_1rem];
    @apply tw:[border-radius:22px];
  }

  .workspace-state-icon {
    @apply tw:[width:64px];
    @apply tw:[height:64px];
    @apply tw:[border-radius:18px];
    @apply tw:[font-size:1.2rem];
  }

  .workspace-state-title {
    @apply tw:[font-size:1rem];
  }

  .workspace-state-copy {
    @apply tw:[font-size:0.88rem];
  }

  .workspace-focus-card {
    @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  }

  .response-shell-body {
    @apply tw:[padding:0.8rem];
  }

  .workspace-card {
    @apply tw:[padding:0.95rem];
  }

  .teacher-brief-actions {
    @apply tw:w-full;
  }

  .workspace-focus-meta {
    @apply tw:[grid-column:1_/_-1];
    @apply tw:w-full;
    @apply tw:justify-start;
  }

  .response-progress {
    @apply tw:w-full;
    @apply tw:justify-between;
  }

  .exam-review-layout {
    @apply tw:[grid-template-columns:1fr];
  }

  .exam-start-panel {
    @apply tw:static;
  }

  .instruction-copy,
  .empty-copy,
  .material-list {
    @apply tw:[padding-left:0];
  }

  .exam-brief-section .instruction-copy,
  .exam-brief-section .empty-copy,
  .exam-brief-section .material-list {
    @apply tw:[padding-left:0];
  }

  .resource-empty {
    @apply tw:[margin-left:0];
  }

  .brief-meta-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .link-composer {
    @apply tw:[grid-template-columns:1fr];
  }

  .answer-actions,
  .exam-actions {
    @apply tw:flex-col;
    @apply tw:items-stretch;
  }

  .primary-btn,
  .secondary-btn,
  .ghost-btn,
  .inline-action {
    @apply tw:w-full;
  }
}

@media (min-width: 1360px) {
  .workspace-grid {
    @apply tw:[grid-template-columns:minmax(0,_1.05fr)_minmax(360px,_0.95fr)];
  }

  .activity-sidebar {
    @apply tw:sticky;
    @apply tw:[top:0.25rem];
    @apply tw:[align-self:start];
    @apply tw:[max-height:calc(100vh_-_150px)];
  }

  .activity-list {
    @apply tw:[max-height:calc(100vh_-_320px)];
  }
}

/* Dark-mode surfaces live here so scoped light styles cannot override them. */
:global(.student-dashboard.student-theme-dark .student-activity-response-page) {
  --workspace-border: #34483b;
  --workspace-ink: #f8fafc;
  --workspace-muted: #aebdb2;
  --workspace-soft: linear-gradient(180deg, #162019 0%, #101913 100%);
  --workspace-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
  --activity-accent: #8dd8cc;
  --activity-accent-soft: #1d3832;
  --quiz-accent: #a9c8ff;
  --quiz-accent-soft: #1b3047;
  --exam-accent: #f3c77a;
  --exam-accent-soft: #3b2d18;
  --status-assigned: #8dd8cc;
  --status-assigned-bg: #1d3832;
  --status-draft: #c4b5fd;
  --status-draft-bg: #30264a;
  --status-submitted: #a7d89a;
  --status-submitted-bg: #203724;
  --status-graded: #a9c8ff;
  --status-graded-bg: #1b3047;
  --status-missing: #f4aaaa;
  --status-missing-bg: #482526;
  --status-closed: #f3c49f;
  --status-closed-bg: #402c20;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page :is(
  .response-shell-body,
  .activity-sidebar,
  .activity-list-card,
  .workspace-focus-card,
  .workspace-card,
  .teacher-brief-card,
  .teacher-brief-stat,
  .brief-meta-item,
  .brief-section-card,
  .material-card,
  .answer-meta-banner,
  .answer-chip,
  .upload-dropzone,
  .attachment-card,
  .exam-brief-section,
  .resource-empty,
  .exam-start-panel,
  .submission-result-card
)) {
  @apply tw:[background:#101913]!;
  @apply tw:[border-color:#405348]!;
  @apply tw:[color:#f1f5f2]!;
  @apply tw:[box-shadow:none]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page :is(
  .activity-list-card:hover,
  .activity-list-card.active,
  .brief-section-card.is-instructions,
  .brief-section-card.is-materials,
  .exam-brief-section.is-instructions
)) {
  @apply tw:[background:#162019]!;
  @apply tw:[border-color:#526b59]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page :is(
  .activity-list-card,
  .activity-list-card:hover,
  .activity-list-card.active,
  .activity-list-card.locked
)) {
  @apply tw:[background:transparent]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page .activity-list-card.locked) {
  @apply tw:[border-style:solid]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page :is(
  .response-progress,
  .response-progress b,
  .workspace-state-icon,
  .activity-sidebar-count,
  .workspace-focus-deadline,
  .teacher-brief-badge,
  .brief-section-icon,
  .material-icon,
  .attachment-icon,
  .inline-action,
  .secondary-btn,
  .ghost-btn,
  .chip-remove
)) {
  @apply tw:[background:#203127]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#e7efe9]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page .workspace-state-icon) {
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(126,_159,_136,_0.18)]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page .assessment-lock-notice) {
  @apply tw:[background:#332914]!;
  @apply tw:[border-color:#80682e]!;
  @apply tw:[color:#f6dda2]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page .assessment-lock-notice > span) {
  @apply tw:[background:#493a19]!;
  @apply tw:[color:#f6dda2]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page .assessment-lock-notice p) {
  @apply tw:[color:#ddc88f]!;
  @apply tw:[-webkit-text-fill-color:#ddc88f]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page :is(
  .answer-textarea,
  .link-composer input
)) {
  @apply tw:[background:#0b120e]!;
  @apply tw:[border-color:#526b59]!;
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page :is(
  .activity-list-card strong,
  .workspace-card-head h4,
  .teacher-brief-stat strong,
  .brief-meta-item strong,
  .brief-section-head h5,
  .material-copy strong,
  .attachment-copy strong,
  .answer-meta-banner strong,
  .exam-start-panel strong
)) {
  @apply tw:[color:#f8fafc]!;
  @apply tw:[-webkit-text-fill-color:#f8fafc]!;
}

:global(.student-dashboard.student-theme-dark .student-activity-response-page :is(
  .activity-list-card p,
  .activity-list-meta,
  .activity-list-meta i,
  .card-eyebrow,
  .teacher-brief-subtitle,
  .teacher-brief-stat span,
  .teacher-brief-stat small,
  .brief-meta-item span,
  .brief-meta-item small,
  .brief-section-head span,
  .instruction-copy,
  .empty-copy,
  .material-copy small,
  .attachment-copy small,
  .answer-field > span,
  .answer-field-head span,
  .answer-field-head small,
  .submission-note
)) {
  @apply tw:[color:#aebdb2]!;
  @apply tw:[-webkit-text-fill-color:#aebdb2]!;
}

</style>
