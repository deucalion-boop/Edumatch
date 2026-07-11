<template>
  <div class="teacher-dashboard headteacher-dashboard-page">
    <aside id="headteacher-sidebar-drawer" class="teacher-sidebar" :class="{ active: isSidebarOpen }">
      <div class="sidebar-header">
        <div class="teacher-logo">
          <div class="teacher-logo-icon">
            <img src="/logo.png" alt="EduMatch" class="teacher-logo-img" />
          </div>
          <div class="teacher-logo-text">
            <h2>EduMatch</h2>
            <p>Head Teacher Portal</p>
          </div>
        </div>
        <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h4 class="nav-section-title">Workspace</h4>
          <router-link to="/headteacher/dashboard" class="nav-link" :class="{ active: route.path === '/headteacher/dashboard' }" @click="closeSidebar">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/headteacher/management" class="nav-link" :class="{ active: route.path === '/headteacher/management' }" @click="closeSidebar">
            <i class="fas fa-users-cog"></i>
            <span>Teacher Management</span>
          </router-link>
          <router-link to="/headteacher/lessons" class="nav-link" :class="{ active: route.path === '/headteacher/lessons' }" @click="closeSidebar">
            <i class="fas fa-book-open"></i>
            <span>Lessons & Exams</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="teacher-profile">
          <div class="teacher-avatar">
            <img :src="avatarUrl" :alt="displayName" />
          </div>
          <div class="teacher-info">
            <h5>{{ displayName }}</h5>
            <p class="teacher-role">HeadTeacher</p>
            <p class="teacher-strand">{{ departmentLabel }}</p>
            <div class="teacher-status">
              <span class="status-indicator active"></span>
              <span>Department lead</span>
            </div>
            <div class="headteacher-sidebar-chip">Lesson Access</div>
          </div>
        </div>
      </div>
    </aside>

    <button v-if="isSidebarOpen" type="button" class="sidebar-backdrop" @click="closeSidebar" aria-label="Close sidebar"></button>

    <main class="teacher-main headteacher-main dashboard-container">
      <header class="top-header headteacher-top-header dashboard-header">
        <div class="header-content headteacher-header-content dashboard-header-content">
          <div class="header-left headteacher-header-copy dashboard-header-copy">
            <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar">
              <i class="fas fa-bars"></i>
            </button>
            <div>
              <h1>Lessons & Exams</h1>
              <p class="header-subtitle">Create lesson materials, generate AI exams for managed teachers, and keep takeover-ready assessments organized in {{ departmentLabel }}.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-tour-btn account-menu-trigger"
                aria-label="Settings menu"
                title="Settings"
                @click="toggleAccountMenu"
              >
                <i class="fas fa-cog"></i>
              </button>
              <div v-if="isAccountMenuOpen" class="account-menu-dropdown">
                <button type="button" class="account-menu-item" @click="goToProfile">
                  <i class="fas fa-user"></i>
                  <span>Profile</span>
                </button>
                <button type="button" class="account-menu-item" @click="goToSettings">
                  <i class="fas fa-cog"></i>
                  <span>Settings</span>
                </button>
                <button type="button" class="account-menu-item danger" @click="handleLogout">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section v-if="banner.message" class="headteacher-banner" :class="banner.type">
        <i class="fas" :class="banner.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>
        <span>{{ banner.message }}</span>
      </section>

      <section class="headteacher-workspace-tabs" role="tablist" aria-label="Head teacher workspaces">
        <button
          type="button"
          class="headteacher-workspace-tab"
          :class="{ active: activeWorkspaceTab === 'lessons' }"
          role="tab"
          :aria-selected="activeWorkspaceTab === 'lessons' ? 'true' : 'false'"
          @click="activeWorkspaceTab = 'lessons'"
        >
          <span class="headteacher-workspace-tab-copy">
            <strong>Lessons</strong>
            <small>Create and assign lesson PDFs to managed teachers.</small>
          </span>
          <span class="headteacher-workspace-tab-count">{{ lessons.length }}</span>
        </button>
        <button
          type="button"
          class="headteacher-workspace-tab"
          :class="{ active: activeWorkspaceTab === 'exams' }"
          role="tab"
          :aria-selected="activeWorkspaceTab === 'exams' ? 'true' : 'false'"
          @click="activeWorkspaceTab = 'exams'"
        >
          <span class="headteacher-workspace-tab-copy">
            <strong>Exams</strong>
            <small>Generate drafts, manage takeover coverage, and update published exams.</small>
          </span>
          <span class="headteacher-workspace-tab-count">{{ managedAssessments.length }}</span>
        </button>
      </section>

      <div v-show="activeWorkspaceTab === 'lessons'" class="headteacher-workspace-panel">
      <section class="section-card dashboard-panel headteacher-lessons-grid">
        <article class="headteacher-lessons-form-card">
          <div class="headteacher-section-head headteacher-lessons-hero-head">
            <div>
              <span class="headteacher-eyebrow">Lesson Assignment</span>
              <h2 class="section-title">Create Lesson</h2>
              <p class="toolbar-subtitle">Upload a lesson once and place it directly into the selected teacher's workspace.</p>
            </div>
            <div class="headteacher-mini-badge">
              <i class="fas fa-diagram-project"></i>
              <span>{{ departmentLabel }}</span>
            </div>
          </div>

          <form class="headteacher-form" @submit.prevent="submitLesson">
            <div class="headteacher-form-section">
              <div class="headteacher-step-break">
                <div>
                  <span class="headteacher-step-label">Step 1</span>
                  <h3>Select the Teacher</h3>
                  <p>Choose which managed teacher should receive this lesson in their workspace.</p>
                </div>
              </div>

              <label class="headteacher-form-group">
                <span>Assign Teacher</span>
                <select v-model="form.teacherId" required>
                  <option value="">Select teacher</option>
                  <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                    {{ teacher.name }} - {{ teacher.department }}
                  </option>
                </select>
              </label>

              <div class="headteacher-selected-teacher-card" :class="{ empty: !selectedTeacher }">
                <template v-if="selectedTeacher">
                  <div class="headteacher-selected-teacher-avatar">
                    {{ selectedTeacherInitials }}
                  </div>
                  <div class="headteacher-selected-teacher-copy">
                    <strong>{{ selectedTeacher.name }}</strong>
                    <span>{{ selectedTeacher.department || departmentLabel }}</span>
                  </div>
                  <div class="headteacher-selected-teacher-status">
                    <span class="headteacher-status-dot"></span>
                    Ready for assignment
                  </div>
                </template>
                <template v-else>
                  <div class="headteacher-selected-teacher-empty">
                    <i class="fas fa-user-plus"></i>
                    <span>Select a teacher to continue</span>
                  </div>
                </template>
              </div>
            </div>

            <div class="headteacher-form-section">
              <div class="headteacher-step-break">
                <div>
                  <span class="headteacher-step-label">Step 2</span>
                  <h3>Add Lesson Details</h3>
                  <p>Set the lesson title and upload one PDF that will be assigned directly to the selected teacher.</p>
                </div>
              </div>

              <label class="headteacher-form-group">
                <span>Lesson Title</span>
                <input v-model.trim="form.title" type="text" required placeholder="Enter lesson title" />
              </label>

              <label class="headteacher-form-group">
                <span>Lesson PDF</span>
                <input ref="lessonFileInput" class="headteacher-file-input" type="file" accept=".pdf,application/pdf" required @change="onFileChange" />
                <button type="button" class="headteacher-upload-dropzone" @click="lessonFileInput?.click()">
                  <span class="headteacher-upload-icon">
                    <i class="fas fa-file-pdf"></i>
                  </span>
                  <span class="headteacher-upload-copy">
                    <strong>{{ form.lessonPlanFile ? 'PDF selected' : 'Choose lesson PDF' }}</strong>
                    <small>{{ form.lessonPlanFile ? form.lessonPlanFile.name : 'Upload one PDF file up to 10MB' }}</small>
                  </span>
                  <span class="headteacher-upload-action">{{ form.lessonPlanFile ? 'Replace' : 'Browse' }}</span>
                </button>
              </label>
            </div>

            <div class="modal-panel-actions headteacher-lessons-actions">
              <button type="button" class="btn btn-outline" :disabled="isSubmitting" @click="resetForm">Clear</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting || teachers.length === 0">
                <i class="fas" :class="isSubmitting ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
                {{ isSubmitting ? 'Uploading...' : 'Create & Assign Lesson' }}
              </button>
            </div>
          </form>
        </article>

        <article class="headteacher-lessons-summary-card">
          <div class="headteacher-section-head">
            <div>
              <span class="headteacher-eyebrow">Snapshot</span>
              <h2 class="section-title">Overview</h2>
              <p class="toolbar-subtitle">A quick look at lesson distribution across your faculty.</p>
            </div>
          </div>

          <div class="headteacher-summary-stack">
            <div class="headteacher-summary-item teachers">
              <span>Managed Teachers</span>
              <strong>{{ teachers.length }}</strong>
              <small>Available for new lesson assignment</small>
            </div>
            <div class="headteacher-summary-item lessons">
              <span>Total Lessons</span>
              <strong>{{ lessons.length }}</strong>
              <small>Published across your department</small>
            </div>
            <div class="headteacher-summary-item latest">
              <span>Latest Upload</span>
              <strong>{{ latestLessonLabel }}</strong>
              <small>{{ latestLessonTeacherLabel }}</small>
            </div>
          </div>
        </article>
      </section>

      <section class="section-card dashboard-panel">
        <div class="headteacher-section-head">
          <div>
            <h2 class="section-title">Recent Lesson Assignments</h2>
            <p class="toolbar-subtitle">Recently created lessons assigned to teachers in your department.</p>
          </div>
        </div>

        <div v-if="isLoading" class="table-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading lessons...</span>
        </div>

        <div v-else-if="lessons.length === 0" class="table-state">
          <i class="fas fa-book-open"></i>
          <span>No lessons assigned yet.</span>
        </div>

        <div v-else class="headteacher-lesson-list">
          <article v-for="lesson in lessons" :key="lesson.id" class="headteacher-lesson-card">
            <div class="headteacher-lesson-card-top">
              <div class="headteacher-lesson-card-copy">
                <div class="headteacher-lesson-card-badges">
                  <span class="headteacher-lesson-pill subtle">{{ lesson.subject || 'General' }}</span>
                </div>
                <h3>{{ lesson.title }}</h3>
                <p>{{ lesson.description }}</p>
              </div>
              <div class="headteacher-lesson-file-chip">
                <i class="fas fa-file-pdf"></i>
                <span>{{ lesson.pdfOriginalName || 'Lesson PDF' }}</span>
              </div>
            </div>

            <div class="headteacher-lesson-meta">
              <span><i class="fas fa-user"></i> Assigned to {{ lesson.teacher?.name || 'Teacher' }}</span>
              <span><i class="fas fa-calendar-alt"></i> {{ formatDate(lesson.createdAt) }}</span>
              <span><i class="fas fa-book-open"></i> {{ lesson.track || 'GENERAL' }}</span>
            </div>
          </article>
        </div>
      </section>
      </div>

      <div v-show="activeWorkspaceTab === 'exams'" class="headteacher-workspace-panel">
      <section class="section-card dashboard-panel headteacher-assessment-shell">
        <div class="headteacher-section-head">
          <div>
            <span class="headteacher-eyebrow">AI Takeover</span>
            <h2 class="section-title">{{ isEditingAssessment ? 'Update Assessment' : 'Generate Assessment' }}</h2>
            <p class="toolbar-subtitle">Create AI exams for an affected teacher, assign them to the handled class or advisory class, and edit the draft before publishing.</p>
          </div>
        </div>

        <form class="headteacher-form" @submit.prevent>
          <div class="headteacher-step-break">
            <div>
              <span class="headteacher-step-label">Step 1</span>
              <h3>Choose Teacher and Lesson</h3>
              <p>Start with the teacher who needs takeover support, then link the lesson the exam should follow.</p>
            </div>
          </div>

          <div class="headteacher-form-grid headteacher-assessment-form-grid">
            <label class="headteacher-form-group">
              <span>Teacher</span>
              <select v-model="assessmentForm.teacherId" required>
                <option value="">Select teacher</option>
                <option v-for="teacher in teachers" :key="`assessment-teacher-${teacher.id}`" :value="teacher.id">
                  {{ teacher.name }} - {{ teacher.department }}
                </option>
              </select>
            </label>

            <label class="headteacher-form-group">
              <span>Linked Lesson</span>
              <select v-model="assessmentForm.lessonId" required :disabled="filteredAssessmentLessons.length === 0">
                <option value="">{{ filteredAssessmentLessons.length === 0 ? 'Select teacher first' : 'Select lesson' }}</option>
                <option v-for="lesson in filteredAssessmentLessons" :key="`assessment-lesson-${lesson.id}`" :value="lesson.id">
                  {{ lesson.title }}
                </option>
              </select>
            </label>
          </div>

          <div class="headteacher-step-break">
            <div>
              <span class="headteacher-step-label">Step 2</span>
              <h3>Set Type and Coverage</h3>
              <p>Choose whether this is an activity, quiz, or exam, add the grading period when needed, and select the target class.</p>
            </div>
          </div>

          <div class="headteacher-form-grid headteacher-assessment-form-grid">
            <label class="headteacher-form-group">
              <span>Type</span>
              <select v-model="assessmentForm.assessmentMode">
                <option value="activity">Activity</option>
                <option value="quiz">Quiz</option>
                <option value="grading_assessment">Exam</option>
              </select>
            </label>

            <label v-if="isGradingAssessment" class="headteacher-form-group">
              <span>Grading Period</span>
              <select v-model="assessmentForm.gradingPeriod" required>
                <option value="">Select grading period</option>
                <option value="1st">1st Grading</option>
                <option value="2nd">2nd Grading</option>
                <option value="3rd">3rd Grading</option>
                <option value="4th">4th Grading</option>
              </select>
            </label>

            <label class="headteacher-form-group">
              <span>Assign To</span>
              <select v-model="assessmentForm.assignmentScope">
                <option value="handled_class">Handled Class</option>
                <option value="advisory_class">Advisory Class</option>
              </select>
            </label>
          </div>

          <div class="headteacher-context-grid">
            <div class="headteacher-context-card">
              <span>Teacher</span>
              <strong>{{ selectedAssessmentTeacher?.name || 'Select teacher' }}</strong>
            </div>
            <div class="headteacher-context-card">
              <span>Lesson</span>
              <strong>{{ selectedAssessmentLesson?.title || 'Select lesson' }}</strong>
            </div>
            <div class="headteacher-context-card">
              <span>Type</span>
              <strong>{{ assessmentModeSummaryLabel }}</strong>
            </div>
            <div class="headteacher-context-card">
              <span>Assign To</span>
              <strong>{{ assessmentAssignmentSummary }}</strong>
            </div>
          </div>

          <div class="headteacher-step-break">
            <div>
              <span class="headteacher-step-label">Step 3</span>
              <h3>Complete Assessment Settings</h3>
              <p>Fill in the title, subject, question format, timer, scoring, and deadline before generating the AI draft.</p>
            </div>
          </div>

          <div class="headteacher-form-grid headteacher-assessment-form-grid">
            <label class="headteacher-form-group">
              <span>Assessment Title</span>
              <input v-model.trim="assessmentForm.title" type="text" required placeholder="Enter assessment title" />
            </label>

            <label class="headteacher-form-group">
              <span>Subject</span>
              <input :value="assessmentResolvedSubject" type="text" readonly />
            </label>

            <label class="headteacher-form-group">
              <span>Exam Type</span>
              <select v-model="assessmentForm.examType" required>
                <option value="">Select exam type</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="identification">Identification</option>
                <option value="true_false">True or False</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>

            <label class="headteacher-form-group">
              <span>Difficulty</span>
              <select v-model="assessmentForm.difficulty" required>
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label class="headteacher-form-group">
              <span>Questions</span>
              <input v-model.number="assessmentForm.numberOfItems" type="number" min="1" max="100" required />
            </label>

            <label class="headteacher-form-group">
              <span>Timer (Minutes)</span>
              <input v-model.number="assessmentForm.examDurationMinutes" type="number" min="1" max="300" required />
            </label>

            <label class="headteacher-form-group">
              <span>Deadline Date</span>
              <input v-model="assessmentForm.deadlineDate" type="date" required />
            </label>

            <label class="headteacher-form-group">
              <span>Deadline Time</span>
              <input v-model="assessmentForm.deadlineTime" type="time" required />
            </label>
          </div>

          <div class="headteacher-step-break">
            <div>
              <span class="headteacher-step-label">Step 4</span>
              <h3>Instructions and Draft Review</h3>
              <p>Add the student directions, generate the AI questions, then review and adjust the draft before publishing.</p>
            </div>
          </div>

          <div class="headteacher-form-grid headteacher-assessment-form-grid">
            <label class="headteacher-form-group headteacher-form-group-full">
              <span>Instructions</span>
              <textarea v-model.trim="assessmentForm.challengeDescription" rows="4" placeholder="Write the student directions or special takeover note..." required />
            </label>
          </div>

          <div class="headteacher-policy-note">
            <strong>Recommendation rule:</strong>
            Only exams tagged as 1st, 2nd, 3rd, or 4th grading affect strand recommendations. Activities stay visible to students but do not affect the AI recommendation.
          </div>

          <div class="headteacher-draft-box">
            <div class="headteacher-draft-head">
              <div>
                <h3>Draft Questions</h3>
                <p>{{ generatedQuestions.length > 0 ? 'Review and adjust the draft before publishing.' : 'Generate with AI or load a saved assessment to edit.' }}</p>
              </div>
              <button v-if="generatedQuestions.length > 0" type="button" class="btn btn-outline" @click="toggleViewCorrectAnswers">
                {{ showCorrectAnswers ? 'Hide Correct Answers' : 'View Correct Answers' }}
              </button>
            </div>

            <div v-if="generatedQuestions.length === 0" class="table-state">
              <i class="fas fa-file-circle-plus"></i>
              <span>No draft questions yet.</span>
            </div>

            <div v-else class="headteacher-draft-list">
              <article v-for="(question, index) in generatedQuestions" :key="`draft-question-${index}`" class="headteacher-draft-item">
                <h4>Question {{ index + 1 }}</h4>
                <label class="headteacher-form-group headteacher-form-group-full">
                  <span>Prompt</span>
                  <textarea v-model.trim="question.prompt" rows="3" required />
                </label>
                <label v-if="question.options && question.options.length" class="headteacher-form-group headteacher-form-group-full">
                  <span>Options (one per line)</span>
                  <textarea :value="question.options.join('\n')" rows="4" @input="onOptionsInput(index, $event.target.value)" />
                </label>
                <label v-if="showCorrectAnswers" class="headteacher-form-group headteacher-form-group-full">
                  <span>Correct Answer</span>
                  <input v-model.trim="question.answer" type="text" required />
                </label>
              </article>
            </div>
          </div>

          <div class="modal-panel-actions headteacher-assessment-actions">
            <button type="button" class="btn btn-outline" :disabled="isAssessmentGenerating || isAssessmentSaving" @click="resetAssessmentDraft">Clear Draft</button>
            <button type="button" class="btn btn-outline" :disabled="!canGenerateAssessment || isAssessmentGenerating" :title="assessmentGenerateButtonTitle" @click="generateAssessmentWithAi">
              <i class="fas" :class="isAssessmentGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'"></i>
              {{ isAssessmentGenerating ? 'Generating...' : (isEditingAssessment ? 'Regenerate Draft' : 'Generate with AI') }}
            </button>
            <button type="button" class="btn btn-primary" :disabled="generatedQuestions.length === 0 || isAssessmentSaving" @click="saveManagedAssessment">
              <i class="fas" :class="isAssessmentSaving ? 'fa-spinner fa-spin' : 'fa-check-circle'"></i>
              {{ isAssessmentSaving ? 'Saving...' : (isEditingAssessment ? 'Update Assessment' : 'Publish Assessment') }}
            </button>
          </div>
          <p v-if="!canGenerateAssessment && assessmentGenerationWarning" class="ai-config-warning">{{ assessmentGenerationWarning }}</p>
        </form>
      </section>

      <section class="section-card dashboard-panel">
        <div class="headteacher-section-head">
          <div>
            <h2 class="section-title">Managed Assessments</h2>
            <p class="toolbar-subtitle">Open any existing assessment when you need to substitute, adjust, or republish it for a managed teacher.</p>
          </div>
        </div>

        <div v-if="isAssessmentsLoading" class="table-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading managed assessments...</span>
        </div>

        <div v-else-if="filteredManagedAssessments.length === 0" class="table-state">
          <i class="fas fa-file-pen"></i>
          <span>No managed assessments found for the selected teacher.</span>
        </div>

        <div v-else class="headteacher-assessment-list">
          <article v-for="assessment in filteredManagedAssessments" :key="assessment.id" class="headteacher-assessment-card">
            <div class="headteacher-assessment-card-top">
              <div>
                <div class="headteacher-assessment-badges">
                  <span class="headteacher-lesson-pill subtle">{{ assessment.teacherName }}</span>
                  <span class="headteacher-lesson-pill">{{ getAssessmentModeLabel(assessment.assessmentMode) }}</span>
                  <span v-if="assessment.gradingPeriod" class="headteacher-lesson-pill period">{{ assessment.gradingPeriod }} Grading</span>
                </div>
                <h3>{{ assessment.title }}</h3>
                <p>{{ assessment.lessonTitle || 'Unlinked lesson' }} · {{ assessment.subject || 'No subject' }}</p>
              </div>
              <button type="button" class="btn btn-outline" @click="startEditingAssessment(assessment)">
                <i class="fas fa-pen-to-square"></i>
                Edit Exam
              </button>
            </div>

            <div class="headteacher-assessment-meta">
              <span><i class="fas fa-users"></i> {{ assessment.assignmentScope === 'advisory_class' ? 'Advisory class' : 'Handled class' }}</span>
              <span><i class="fas fa-list-ol"></i> {{ assessment.numberOfItems }} items</span>
              <span><i class="fas fa-user-check"></i> {{ assessment.assignedStudentsCount }} students</span>
              <span><i class="fas fa-calendar-alt"></i> {{ formatDate(assessment.submissionDeadline) }}</span>
            </div>
          </article>
        </div>
      </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isAssessmentsLoading = ref(false)
const isAssessmentGenerating = ref(false)
const isAssessmentSaving = ref(false)
const canGenerateAssessment = ref(false)
const assessmentGenerationWarning = ref('')
const AI_CONFIG_WARNING_MESSAGE = 'AI Generator is not configured. Please contact the administrator to set up the API Key and Model.'
const teachers = ref([])
const lessons = ref([])
const managedAssessments = ref([])
const activeWorkspaceTab = ref('lessons')
const accountMenuRef = ref(null)
const lessonFileInput = ref(null)
const generatedQuestions = ref([])
const generatedDraftMeta = ref(null)
const showCorrectAnswers = ref(false)
const editingAssessmentId = ref('')
const banner = reactive({
  type: 'success',
  message: '',
})
const form = reactive({
  teacherId: '',
  title: '',
  lessonPlanFile: null,
})
const assessmentForm = reactive({
  teacherId: '',
  lessonId: '',
  title: '',
  assessmentMode: 'activity',
  gradingPeriod: '',
  assignmentScope: 'handled_class',
  examType: '',
  difficulty: '',
  numberOfItems: 10,
  examDurationMinutes: 30,
  deadlineDate: '',
  deadlineTime: '',
  challengeDescription: '',
})

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${authStore.token}`,
  },
})

const displayName = computed(() => authStore.user?.name || 'HeadTeacher')
const departmentLabel = computed(() => authStore.user?.department || 'Department')
const avatarUrl = computed(() => {
  const profileImage = String(authStore.user?.profileImage || '').trim()
  if (profileImage) return profileImage
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=334155&color=fff`
})
const selectedTeacher = computed(() => teachers.value.find((teacher) => teacher.id === form.teacherId) || null)
const selectedAssessmentTeacher = computed(() => teachers.value.find((teacher) => teacher.id === assessmentForm.teacherId) || null)
const selectedTeacherInitials = computed(() => {
  const name = String(selectedTeacher.value?.name || '').trim()
  if (!name) return 'HT'
  return name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
})
const latestLessonLabel = computed(() => {
  if (lessons.value.length === 0) return 'No uploads'
  return formatDate(lessons.value[0]?.createdAt)
})
const latestLessonTeacherLabel = computed(() => {
  if (lessons.value.length === 0) return 'No teacher assignment yet'
  return lessons.value[0]?.teacher?.name || 'Teacher'
})
const filteredAssessmentLessons = computed(() => lessons.value.filter((lesson) => lesson.teacher?.id === assessmentForm.teacherId))
const selectedAssessmentLesson = computed(() => filteredAssessmentLessons.value.find((lesson) => lesson.id === assessmentForm.lessonId) || null)
const filteredManagedAssessments = computed(() => {
  if (!assessmentForm.teacherId) return managedAssessments.value
  return managedAssessments.value.filter((assessment) => assessment.teacherId === assessmentForm.teacherId)
})
const assessmentResolvedSubject = computed(() => selectedAssessmentLesson.value?.subject || selectedAssessmentTeacher.value?.subject || selectedAssessmentTeacher.value?.department || '')
const isGradingAssessment = computed(() => assessmentForm.assessmentMode === 'grading_assessment')
const isQuizAssessment = computed(() => assessmentForm.assessmentMode === 'quiz')
const isEditingAssessment = computed(() => Boolean(editingAssessmentId.value))
const getAssessmentModeLabel = (mode) => {
  const normalizedMode = String(mode || 'activity').trim().toLowerCase()
  if (normalizedMode === 'grading_assessment') return 'Exam'
  if (normalizedMode === 'quiz') return 'Quiz'
  return 'Activity'
}
const assessmentModeSummaryLabel = computed(() => {
  if (isQuizAssessment.value) return 'Quiz'
  if (!isGradingAssessment.value) return 'Activity'
  return assessmentForm.gradingPeriod
    ? `Exam · ${assessmentForm.gradingPeriod} Grading`
    : 'Exam'
})
const assessmentAssignmentSummary = computed(() => (
  assessmentForm.assignmentScope === 'advisory_class' ? 'Advisory Class' : 'Handled Class'
))
const assessmentGenerateButtonTitle = computed(() => {
  if (canGenerateAssessment.value) return ''
  return assessmentGenerationWarning.value || AI_CONFIG_WARNING_MESSAGE
})

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const toggleAccountMenu = () => {
  isAccountMenuOpen.value = !isAccountMenuOpen.value
}

const closeAccountMenu = () => {
  isAccountMenuOpen.value = false
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

const setBanner = (type, message) => {
  banner.type = type
  banner.message = message
}

const resetForm = () => {
  form.teacherId = ''
  form.title = ''
  form.lessonPlanFile = null
  if (lessonFileInput.value) lessonFileInput.value.value = ''
}

const onFileChange = (event) => {
  const files = Array.from(event.target?.files || [])
  form.lessonPlanFile = files.length > 0 ? files[0] : null
}

const fetchTeachers = async () => {
  const response = await axios.get(`${resolveApiBaseUrl()}/headteacher/teachers`, getAuthConfig())
  teachers.value = (Array.isArray(response.data?.teachers) ? response.data.teachers : []).map((teacher) => ({
    ...teacher,
    id: String(teacher?.id || teacher?._id || '').trim(),
  }))
}

const fetchLessons = async () => {
  const response = await axios.get(`${resolveApiBaseUrl()}/headteacher/lessons`, getAuthConfig())
  lessons.value = Array.isArray(response.data?.lessons) ? response.data.lessons : []
}

const fetchManagedAssessments = async () => {
  const response = await axios.get(`${resolveApiBaseUrl()}/headteacher/assessments`, getAuthConfig())
  managedAssessments.value = Array.isArray(response.data?.assessments) ? response.data.assessments : []
}

const refreshAssessmentAiStatus = async () => {
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/headteacher/ai/status`, getAuthConfig())
    const data = response.data || {}
    canGenerateAssessment.value = Boolean(data?.success && data?.canGenerate)
    assessmentGenerationWarning.value = canGenerateAssessment.value
      ? ''
      : String(data?.configurationMessage || AI_CONFIG_WARNING_MESSAGE).trim() || AI_CONFIG_WARNING_MESSAGE
  } catch {
    canGenerateAssessment.value = false
    assessmentGenerationWarning.value = AI_CONFIG_WARNING_MESSAGE
  }
}

const loadPage = async () => {
  try {
    isLoading.value = true
    isAssessmentsLoading.value = true
    await Promise.all([fetchTeachers(), fetchLessons(), fetchManagedAssessments(), refreshAssessmentAiStatus()])
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to load lesson data.'
    setBanner('error', message)
  } finally {
    isLoading.value = false
    isAssessmentsLoading.value = false
  }
}

const buildSubmissionDeadlineIso = (date, time) => {
  const datePart = String(date || '').trim()
  const timePart = String(time || '').trim()
  if (!datePart || !timePart) return ''
  const parsed = new Date(`${datePart}T${timePart}:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString()
}

const syncAssessmentDeadlineInputs = (value) => {
  if (!value) {
    assessmentForm.deadlineDate = ''
    assessmentForm.deadlineTime = ''
    return
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    assessmentForm.deadlineDate = ''
    assessmentForm.deadlineTime = ''
    return
  }
  assessmentForm.deadlineDate = parsed.toISOString().slice(0, 10)
  assessmentForm.deadlineTime = parsed.toISOString().slice(11, 16)
}

const submitLesson = async () => {
  if (!form.teacherId || !form.title || !form.lessonPlanFile) {
    setBanner('error', 'Please complete all required fields and upload a PDF.')
    return
  }

  const fileName = String(form.lessonPlanFile.name || '').toLowerCase()
  if (!fileName.endsWith('.pdf')) {
    setBanner('error', 'Only PDF files are allowed.')
    return
  }

  try {
    activeWorkspaceTab.value = 'lessons'
    isSubmitting.value = true
    const generatedDescription = `Lesson material for ${form.title}`
    const payload = new FormData()
    payload.append('teacherId', form.teacherId)
    payload.append('title', form.title)
    payload.append('description', generatedDescription)
    payload.append('track', 'GENERAL')
    payload.append('lessonPlanFile', form.lessonPlanFile)

    await axios.post(`${resolveApiBaseUrl()}/headteacher/lessons`, payload, getAuthConfig())
    setBanner('success', 'Lesson created and assigned successfully.')
    resetForm()
    await fetchLessons()
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to create lesson.'
    setBanner('error', message)
  } finally {
    isSubmitting.value = false
  }
}

const resetAssessmentDraft = () => {
  activeWorkspaceTab.value = 'exams'
  editingAssessmentId.value = ''
  generatedQuestions.value = []
  generatedDraftMeta.value = null
  showCorrectAnswers.value = false
  assessmentForm.lessonId = ''
  assessmentForm.title = ''
  assessmentForm.assessmentMode = 'activity'
  assessmentForm.gradingPeriod = ''
  assessmentForm.assignmentScope = 'handled_class'
  assessmentForm.examType = ''
  assessmentForm.difficulty = ''
  assessmentForm.numberOfItems = 10
  assessmentForm.examDurationMinutes = 30
  assessmentForm.deadlineDate = ''
  assessmentForm.deadlineTime = ''
  assessmentForm.challengeDescription = ''
}

const toggleViewCorrectAnswers = () => {
  showCorrectAnswers.value = !showCorrectAnswers.value
}

const onOptionsInput = (index, value) => {
  const lines = String(value || '')
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (generatedQuestions.value[index]) generatedQuestions.value[index].options = lines
}

const validateAssessmentForm = () => {
  const submissionDeadline = buildSubmissionDeadlineIso(assessmentForm.deadlineDate, assessmentForm.deadlineTime)
  if (!assessmentForm.teacherId || !assessmentForm.lessonId || !assessmentForm.title || !assessmentResolvedSubject.value || !assessmentForm.examType || !assessmentForm.difficulty) {
    throw new Error('Complete the teacher, lesson, title, subject, exam type, and difficulty before continuing.')
  }
  if (!Number.isInteger(Number(assessmentForm.numberOfItems)) || Number(assessmentForm.numberOfItems) <= 0) {
    throw new Error('Number of items must be greater than zero.')
  }
  if (!Number.isInteger(Number(assessmentForm.examDurationMinutes)) || Number(assessmentForm.examDurationMinutes) < 1 || Number(assessmentForm.examDurationMinutes) > 300) {
    throw new Error('Exam timer must be between 1 and 300 minutes.')
  }
  if (!submissionDeadline) {
    throw new Error('Set a valid deadline date and time.')
  }
  if (new Date(submissionDeadline).getTime() <= Date.now()) {
    throw new Error('Deadline must be set to a future date and time.')
  }
  if (assessmentForm.assessmentMode === 'grading_assessment' && !assessmentForm.gradingPeriod) {
    throw new Error('Select a grading period for the grading assessment.')
  }
  return submissionDeadline
}

const generateAssessmentWithAi = async () => {
  try {
    await refreshAssessmentAiStatus()
    if (!canGenerateAssessment.value) {
      throw new Error(assessmentGenerationWarning.value || AI_CONFIG_WARNING_MESSAGE)
    }

    const submissionDeadline = validateAssessmentForm()
    isAssessmentGenerating.value = true

    const payload = {
      teacherId: assessmentForm.teacherId,
      lessonId: assessmentForm.lessonId,
      title: String(assessmentForm.title || '').trim(),
      examType: assessmentForm.examType,
      subject: assessmentResolvedSubject.value,
      difficulty: assessmentForm.difficulty,
      numberOfItems: Number(assessmentForm.numberOfItems),
      assessmentMode: assessmentForm.assessmentMode,
      gradingPeriod: assessmentForm.gradingPeriod,
      assignmentScope: assessmentForm.assignmentScope,
      examDurationMinutes: Number(assessmentForm.examDurationMinutes),
      submissionDeadline,
    }

    const response = await axios.post(`${resolveApiBaseUrl()}/headteacher/assessments/ai-generate`, payload, getAuthConfig())
    const draftAssessment = response.data?.draftAssessment || {}
    generatedQuestions.value = (Array.isArray(draftAssessment.questions) ? draftAssessment.questions : []).map((question) => ({
      prompt: question.questionText || '',
      type: question.type || 'multiple-choice',
      options: Array.isArray(question.options) ? question.options : [],
      answer: question.correctAnswer || '',
      points: Number(question.points || 1),
      explanation: question.explanation || '',
    }))
    generatedDraftMeta.value = {
      title: String(draftAssessment.title || assessmentForm.title || '').trim(),
      subject: String(draftAssessment.subject || assessmentResolvedSubject.value || '').trim(),
      subjectCategory: String(draftAssessment.subjectCategory || ''),
      examType: String(draftAssessment.examType || assessmentForm.examType || '').trim(),
      difficulty: String(draftAssessment.difficulty || assessmentForm.difficulty || '').trim(),
      numberOfItems: Number(draftAssessment.numberOfItems || assessmentForm.numberOfItems),
      examDurationMinutes: Number(draftAssessment.examDurationMinutes || assessmentForm.examDurationMinutes),
      submissionDeadline: draftAssessment.submissionDeadline || submissionDeadline,
      assessmentMode: String(draftAssessment.assessmentMode || assessmentForm.assessmentMode || 'activity'),
      gradingPeriod: String(draftAssessment.gradingPeriod || assessmentForm.gradingPeriod || ''),
      assignmentScope: String(draftAssessment.assignmentScope || assessmentForm.assignmentScope || 'handled_class'),
    }
    showCorrectAnswers.value = false
    setBanner('success', isEditingAssessment.value ? 'New AI draft ready. Review it, then update the assessment.' : 'Assessment draft generated successfully.')
  } catch (error) {
    setBanner('error', error.response?.data?.message || error.message || 'Failed to generate assessment.')
  } finally {
    isAssessmentGenerating.value = false
  }
}

const saveManagedAssessment = async () => {
  try {
    const submissionDeadline = validateAssessmentForm()
    if (generatedQuestions.value.length === 0) {
      throw new Error('Generate or load a draft before saving the assessment.')
    }

    isAssessmentSaving.value = true
    const payload = {
      teacherId: assessmentForm.teacherId,
      lessonId: assessmentForm.lessonId,
      title: String((generatedDraftMeta.value?.title || assessmentForm.title) || '').trim(),
      examType: generatedDraftMeta.value?.examType || assessmentForm.examType,
      subject: generatedDraftMeta.value?.subject || assessmentResolvedSubject.value,
      subjectCategory: generatedDraftMeta.value?.subjectCategory || '',
      difficulty: generatedDraftMeta.value?.difficulty || assessmentForm.difficulty,
      numberOfItems: Number(generatedDraftMeta.value?.numberOfItems || assessmentForm.numberOfItems),
      examDurationMinutes: Number(generatedDraftMeta.value?.examDurationMinutes || assessmentForm.examDurationMinutes),
      submissionDeadline: generatedDraftMeta.value?.submissionDeadline || submissionDeadline,
      assessmentMode: String(assessmentForm.assessmentMode || generatedDraftMeta.value?.assessmentMode || 'activity').trim(),
      gradingPeriod: String(assessmentForm.gradingPeriod || generatedDraftMeta.value?.gradingPeriod || '').trim(),
      assignmentScope: String(assessmentForm.assignmentScope || generatedDraftMeta.value?.assignmentScope || 'handled_class').trim(),
      challengeDescription: String(assessmentForm.challengeDescription || '').trim(),
      questions: generatedQuestions.value.map((question, index) => ({
        questionText: String(question.prompt || '').trim() || `Question ${index + 1}`,
        type: String(question.type || 'multiple-choice').trim() || 'multiple-choice',
        options: Array.isArray(question.options) ? question.options.map((option) => String(option || '').trim()).filter(Boolean) : [],
        correctAnswer: String(question.answer || '').trim(),
        points: Number(question.points || 1),
        explanation: String(question.explanation || '').trim(),
      })),
    }

    if (isEditingAssessment.value) {
      await axios.put(`${resolveApiBaseUrl()}/headteacher/assessments/${encodeURIComponent(editingAssessmentId.value)}`, payload, getAuthConfig())
      setBanner('success', 'Assessment updated successfully.')
    } else {
      await axios.post(`${resolveApiBaseUrl()}/headteacher/assessments`, payload, getAuthConfig())
      setBanner('success', 'Assessment created successfully.')
    }

    isAssessmentsLoading.value = true
    await fetchManagedAssessments()
    resetAssessmentDraft()
  } catch (error) {
    setBanner('error', error.response?.data?.message || error.message || 'Failed to save assessment.')
  } finally {
    isAssessmentSaving.value = false
    isAssessmentsLoading.value = false
  }
}

const startEditingAssessment = (assessment) => {
  activeWorkspaceTab.value = 'exams'
  editingAssessmentId.value = String(assessment?.id || '')
  assessmentForm.teacherId = String(assessment?.teacherId || '')
  assessmentForm.lessonId = String(assessment?.lessonId || '')
  assessmentForm.title = String(assessment?.title || '')
  assessmentForm.assessmentMode = String(assessment?.assessmentMode || 'activity')
  assessmentForm.gradingPeriod = String(assessment?.gradingPeriod || '')
  assessmentForm.assignmentScope = String(assessment?.assignmentScope || 'handled_class')
  assessmentForm.examType = String(assessment?.examType || '')
  assessmentForm.difficulty = String(assessment?.difficulty || '')
  assessmentForm.numberOfItems = Number(assessment?.numberOfItems || 10)
  assessmentForm.examDurationMinutes = Number(assessment?.examDurationMinutes || 30)
  assessmentForm.challengeDescription = String(assessment?.challengeDescription || '')
  syncAssessmentDeadlineInputs(assessment?.submissionDeadline || null)
  generatedDraftMeta.value = {
    title: String(assessment?.title || ''),
    subject: String(assessment?.subject || ''),
    subjectCategory: String(assessment?.subjectCategory || ''),
    examType: String(assessment?.examType || ''),
    difficulty: String(assessment?.difficulty || ''),
    numberOfItems: Number(assessment?.numberOfItems || 0),
    examDurationMinutes: Number(assessment?.examDurationMinutes || 30),
    submissionDeadline: assessment?.submissionDeadline || null,
    assessmentMode: String(assessment?.assessmentMode || 'activity'),
    gradingPeriod: String(assessment?.gradingPeriod || ''),
    assignmentScope: String(assessment?.assignmentScope || 'handled_class'),
  }
  generatedQuestions.value = (Array.isArray(assessment?.questions) ? assessment.questions : []).map((question) => ({
    prompt: question.questionText || '',
    type: question.type || 'multiple-choice',
    options: Array.isArray(question.options) ? question.options : [],
    answer: question.correctAnswer || '',
    points: Number(question.points || 1),
    explanation: question.explanation || '',
  }))
  showCorrectAnswers.value = false
  setBanner('success', 'Assessment loaded for editing. You can adjust the draft or regenerate it with AI.')
}

const goToProfile = () => {
  closeAccountMenu()
  router.push('/headteacher/profile')
}

const goToSettings = () => {
  closeAccountMenu()
  router.push('/headteacher/settings')
}

const handleLogout = async () => {
  closeAccountMenu()
  await authStore.logout()
  router.push('/auth/login')
}

const handleDocumentClick = (event) => {
  if (accountMenuRef.value && !accountMenuRef.value.contains(event.target)) {
    closeAccountMenu()
  }
}

watch(
  () => assessmentForm.teacherId,
  () => {
    if (!filteredAssessmentLessons.value.some((lesson) => lesson.id === assessmentForm.lessonId)) {
      assessmentForm.lessonId = ''
    }
  }
)

watch(
  () => assessmentForm.assessmentMode,
  (value) => {
    if (value !== 'grading_assessment') {
      assessmentForm.gradingPeriod = ''
    }
  }
)

onMounted(() => {
  loadPage()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.headteacher-lessons-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.8fr);
  gap: 1.25rem;
  margin-bottom: 0;
}

.headteacher-workspace-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.headteacher-workspace-tab {
  border: 1px solid #dbe2ea;
  border-radius: 20px;
  background: #ffffff;
  padding: 0.95rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.headteacher-workspace-tab:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.headteacher-workspace-tab.active {
  border-color: #bfdbfe;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.12);
}

.headteacher-workspace-tab-copy {
  display: grid;
  gap: 0.18rem;
}

.headteacher-workspace-tab-copy strong {
  color: #0f172a;
  font-size: 0.92rem;
}

.headteacher-workspace-tab-copy small {
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.45;
}

.headteacher-workspace-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.2rem;
  min-height: 2.2rem;
  padding: 0 0.75rem;
  border-radius: 999px;
  background: #f8fafc;
  color: #1e293b;
  font-size: 0.82rem;
  font-weight: 800;
}

.headteacher-workspace-tab.active .headteacher-workspace-tab-count {
  background: #dbeafe;
  color: #1d4ed8;
}

.headteacher-workspace-panel {
  display: grid;
  gap: 1.5rem;
}

.headteacher-lessons-form-card,
.headteacher-lessons-summary-card,
.headteacher-lesson-card {
  border: 1px solid #d9e2ee;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.headteacher-lessons-form-card,
.headteacher-lessons-summary-card {
  padding: 1.35rem;
}

.headteacher-lessons-form-card {
  position: relative;
  overflow: hidden;
}

.headteacher-lessons-form-card::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(14, 116, 144, 0.12), transparent 68%);
  pointer-events: none;
}

.headteacher-lessons-hero-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.headteacher-eyebrow {
  display: inline-block;
  margin-bottom: 0.45rem;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.headteacher-mini-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  border-radius: 14px;
  border: 1px solid #d7e3f1;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  font-weight: 700;
}

.headteacher-form {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 1rem;
}

.headteacher-form-group-full {
  grid-column: 1 / -1;
}

.headteacher-form-section {
  display: grid;
  gap: 0.95rem;
}

.headteacher-step-break {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 1rem 1rem 0.95rem;
  border: 1px solid #dbe2ea;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.headteacher-step-label {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.headteacher-step-break h3 {
  margin: 0.18rem 0 0.25rem;
  color: #0f172a;
  font-size: 1rem;
}

.headteacher-step-break p {
  margin: 0;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.5;
}

.headteacher-selected-teacher-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.95rem 1rem;
  margin-bottom: 1rem;
  border-radius: 18px;
  border: 1px solid #d8e4ef;
  background: linear-gradient(135deg, #ffffff, #eff6ff);
}

.headteacher-selected-teacher-card.empty {
  justify-content: center;
  background: linear-gradient(135deg, #fff, #f8fafc);
}

.headteacher-selected-teacher-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0f766e, #155e75);
  color: #fff;
  font-weight: 800;
}

.headteacher-selected-teacher-copy {
  display: grid;
  gap: 0.2rem;
}

.headteacher-selected-teacher-copy strong {
  color: #0f172a;
}

.headteacher-selected-teacher-copy span {
  color: #64748b;
  font-size: 0.88rem;
}

.headteacher-selected-teacher-status {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #0f766e;
  font-size: 0.82rem;
  font-weight: 700;
}

.headteacher-status-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
}

.headteacher-selected-teacher-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: #64748b;
  font-weight: 600;
}

.headteacher-helper-copy {
  display: block;
  margin-top: 0.45rem;
  color: #64748b;
}

.headteacher-file-input {
  display: none;
}

.headteacher-upload-dropzone {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px dashed #94a3b8;
  border-radius: 18px;
  background: linear-gradient(135deg, #fff, #f8fafc);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.headteacher-upload-dropzone:hover {
  transform: translateY(-1px);
  border-color: #0f766e;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.headteacher-upload-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: #fee2e2;
  color: #b91c1c;
  flex-shrink: 0;
}

.headteacher-upload-copy {
  display: grid;
  text-align: left;
}

.headteacher-upload-copy strong {
  color: #0f172a;
}

.headteacher-upload-copy small {
  margin-top: 0.2rem;
  color: #64748b;
}

.headteacher-upload-action {
  margin-left: auto;
  color: #0f766e;
  font-size: 0.84rem;
  font-weight: 800;
}

.headteacher-lessons-actions {
  margin-top: 1.1rem;
}

.headteacher-summary-stack {
  display: grid;
  gap: 0.9rem;
}

.headteacher-summary-item {
  padding: 1rem;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.headteacher-summary-item span {
  display: block;
  color: #64748b;
  font-size: 0.86rem;
}

.headteacher-summary-item strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 1.35rem;
  color: #0f172a;
}

.headteacher-summary-item small {
  display: block;
  margin-top: 0.35rem;
  color: #64748b;
}

.headteacher-lesson-list {
  display: grid;
  gap: 1rem;
  margin-top: 1.25rem;
}

.headteacher-lesson-card {
  padding: 1.2rem 1.25rem;
}

.headteacher-lesson-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.9rem;
  margin-bottom: 0.95rem;
  border-bottom: 1px solid #edf2f7;
}

.headteacher-lesson-card-copy {
  flex: 1;
}

.headteacher-lesson-card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.65rem;
}

.headteacher-lesson-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.34rem 0.65rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.headteacher-lesson-pill.subtle {
  background: #eef2ff;
  color: #3730a3;
}

.headteacher-lesson-card-top h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.08rem;
}

.headteacher-lesson-card-top p {
  margin: 0.45rem 0 0;
  color: #475569;
  line-height: 1.55;
}

.headteacher-lesson-file-chip {
  min-width: 160px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-radius: 16px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  font-size: 0.84rem;
  font-weight: 700;
}

.headteacher-lesson-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 0.25rem;
  color: #475569;
  font-size: 0.9rem;
}

.headteacher-lesson-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.headteacher-lesson-meta span i.fa-book-open,
.headteacher-lesson-meta span i.fa-book-open::before {
  color: #f97316 !important;
}

textarea {
  resize: vertical;
  min-height: 120px;
}

small {
  margin-top: 0.35rem;
  color: #64748b;
}

.headteacher-assessment-shell {
  margin-top: 0;
}

.headteacher-assessment-form-grid {
  margin-top: 1rem;
}

.headteacher-context-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.headteacher-context-card {
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  padding: 0.85rem 0.9rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: grid;
  gap: 0.22rem;
}

.headteacher-context-card span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.headteacher-context-card strong {
  color: #0f172a;
  font-size: 0.9rem;
  line-height: 1.4;
}

.headteacher-policy-note {
  margin-top: 1rem;
  padding: 1rem 1.05rem;
  border-radius: 16px;
  border: 1px solid #c7d2fe;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  color: #334155;
  line-height: 1.55;
}

.headteacher-policy-note strong {
  color: #312e81;
}

.headteacher-draft-box {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: #fff;
}

.headteacher-draft-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.headteacher-draft-head h3,
.headteacher-draft-item h4,
.headteacher-assessment-card h3 {
  margin: 0;
  color: #0f172a;
}

.headteacher-draft-head p,
.headteacher-assessment-card p {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.headteacher-draft-list,
.headteacher-assessment-list {
  display: grid;
  gap: 1rem;
}

.headteacher-draft-item,
.headteacher-assessment-card {
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #fff, #f8fafc);
}

.headteacher-assessment-actions {
  margin-top: 1rem;
}

.ai-config-warning {
  margin-top: 0.85rem;
  color: #b91c1c;
  font-weight: 700;
}

.headteacher-assessment-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.headteacher-assessment-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.55rem;
}

.headteacher-lesson-pill.period {
  background: #fff7ed;
  color: #9a3412;
}

.headteacher-assessment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  color: #475569;
  font-size: 0.9rem;
}

.headteacher-assessment-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

@media (max-width: 980px) {
  .headteacher-workspace-tabs {
    grid-template-columns: 1fr;
  }

  .headteacher-lessons-grid {
    grid-template-columns: 1fr;
  }

  .headteacher-lessons-hero-head,
  .headteacher-draft-head,
  .headteacher-assessment-card-top {
    flex-direction: column;
  }

  .headteacher-context-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .headteacher-workspace-tab {
    padding: 0.85rem 0.9rem;
    border-radius: 16px;
  }

  .headteacher-lesson-card-top {
    flex-direction: column;
  }

  .headteacher-upload-dropzone,
  .headteacher-selected-teacher-card {
    align-items: flex-start;
  }

  .headteacher-upload-action,
  .headteacher-selected-teacher-status {
    margin-left: 0;
  }

  .headteacher-step-break {
    padding: 0.85rem 0.9rem;
  }

  .headteacher-context-grid {
    grid-template-columns: 1fr;
  }
}
</style>
