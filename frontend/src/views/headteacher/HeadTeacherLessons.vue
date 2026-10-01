<template>
  <div class="headteacher-workspace headteacher-dashboard-page headteacher-content-page headteacher-lessons-page">
    <aside id="headteacher-sidebar-drawer" class="headteacher-sidebar" :class="{ active: isSidebarOpen }">
      <div class="headteacher-sidebar-header">
        <div class="headteacher-brand">
          <div class="headteacher-brand-icon">
            <img src="/logo.png" alt="EduMatch" class="headteacher-brand-image" />
          </div>
          <div class="headteacher-brand-copy">
            <h2>EduMatch</h2>
            <p>Head Teacher Portal</p>
          </div>
        </div>
        <button type="button" class="headteacher-sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="headteacher-sidebar-nav">
        <div class="headteacher-nav-section">
          <h4 class="headteacher-nav-section-title">Workspace</h4>
          <router-link to="/headteacher/dashboard" class="headteacher-nav-link" :class="{ active: route.path === '/headteacher/dashboard' }" @click="closeSidebar">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/headteacher/management" class="headteacher-nav-link" :class="{ active: route.path === '/headteacher/management' }" @click="closeSidebar">
            <i class="fas fa-users-cog"></i>
            <span>Teacher Management</span>
          </router-link>
          <router-link to="/headteacher/lessons" class="headteacher-nav-link" :class="{ active: route.path === '/headteacher/lessons' }" @click="closeSidebar">
            <i class="fas fa-book-open"></i>
            <span>Lessons & Exams</span>
          </router-link>
        </div>
      </nav>

      <div class="headteacher-sidebar-footer">
        <div class="headteacher-sidebar-profile">
          <div class="headteacher-sidebar-avatar">
            <i class="fas fa-user" aria-hidden="true"></i>
          </div>
          <div class="headteacher-sidebar-info">
            <h5>{{ displayName }}</h5>
            <div class="headteacher-sidebar-meta">
              <p class="headteacher-sidebar-role">Head Teacher</p>
              <div class="headteacher-sidebar-status">
                <span class="headteacher-sidebar-status-indicator active"></span>
                <span>active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <button v-if="isSidebarOpen" type="button" class="headteacher-sidebar-backdrop" @click="closeSidebar" aria-label="Close sidebar"></button>

    <main class="headteacher-main headteacher-page-container">
      <header class="headteacher-top-header headteacher-matched-page-header">
        <div class="headteacher-header-content">
          <div class="headteacher-header-copy">
            <button type="button" class="headteacher-mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar">
              <i class="fas fa-bars"></i>
            </button>
            <div class="headteacher-matched-header-copy">
              <h1>Lessons & Exams</h1>
              <p class="headteacher-header-subtitle">Create lessons, generate exams, and organize assessments for the {{ departmentLabel }} department.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
            <HeadTeacherNotifications />
            <div ref="accountMenuRef" class="headteacher-account-menu">
              <button
                type="button"
                class="headteacher-header-settings-button headteacher-account-menu-trigger"
                aria-label="Settings menu"
                title="Settings"
                @click="toggleAccountMenu"
              >
                <i class="fas fa-cog"></i>
              </button>
              <div v-if="isAccountMenuOpen" class="headteacher-account-menu-dropdown">
                <button type="button" class="headteacher-account-menu-item" @click="goToProfile">
                  <i class="fas fa-user"></i>
                  <span>Profile</span>
                </button>
                <button type="button" class="headteacher-account-menu-item" @click="goToSettings">
                  <i class="fas fa-cog"></i>
                  <span>Settings</span>
                </button>
                <button type="button" class="headteacher-account-menu-item danger" @click="handleLogout">
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
      <section class="headteacher-section-card headteacher-panel headteacher-lessons-grid">
        <article class="headteacher-lessons-form-card">
          <div class="headteacher-section-head headteacher-lessons-hero-head">
            <div>
              <span class="headteacher-eyebrow">Lesson Assignment</span>
              <h2 class="headteacher-section-title">Create Lesson</h2>
              <p class="headteacher-section-subtitle">Upload a lesson once and place it directly into the selected teacher's workspace.</p>
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

            <div class="headteacher-modal-actions headteacher-lessons-actions">
              <button type="button" class="headteacher-button headteacher-button-outline" :disabled="isSubmitting" @click="resetForm">Clear</button>
              <button type="submit" class="headteacher-button headteacher-button-primary" :disabled="isSubmitting || teachers.length === 0">
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
              <h2 class="headteacher-section-title">Overview</h2>
              <p class="headteacher-section-subtitle">A quick look at lesson distribution across your faculty.</p>
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

      <section class="headteacher-section-card headteacher-panel">
        <div class="headteacher-section-head">
          <div>
            <h2 class="headteacher-section-title">Recent Lesson Assignments</h2>
            <p class="headteacher-section-subtitle">Recently created lessons assigned to teachers in your department.</p>
          </div>
        </div>

        <div v-if="isLoading" class="headteacher-table-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading lessons...</span>
        </div>

        <div v-else-if="lessons.length === 0" class="headteacher-table-state">
          <i class="fas fa-book-open"></i>
          <span>No lessons assigned yet.</span>
        </div>

        <div v-else class="headteacher-lesson-list">
          <article v-for="lesson in paginatedLessons" :key="lesson.id" class="headteacher-lesson-card">
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
              <span class="headteacher-lesson-creator">
                <i class="fas fa-user-pen"></i>
                Created by {{ lesson.creator?.name || lesson.teacher?.name || 'Teacher' }}
                <small>{{ formatCreatorRole(lesson.creator?.role) }}</small>
              </span>
              <span><i class="fas fa-user-check"></i> Assigned to {{ lesson.teacher?.name || 'Teacher' }}</span>
              <span><i class="fas fa-calendar-alt"></i> {{ formatDate(lesson.createdAt) }}</span>
              <span><i class="fas fa-book-open"></i> {{ lesson.track || 'GENERAL' }}</span>
            </div>
          </article>

          <nav v-if="lessonTotalPages > 1" class="headteacher-pagination headteacher-lesson-pagination" aria-label="Lesson assignment pages">
            <div class="headteacher-pagination-info">
              Showing {{ lessonPageStart }}–{{ lessonPageEnd }} of {{ lessons.length }} lessons
            </div>
            <div class="headteacher-pagination-controls">
              <button type="button" class="headteacher-page-btn" :disabled="lessonCurrentPage === 1" @click="goToPreviousLessonPage">
                Previous
              </button>
              <button
                v-for="page in visibleLessonPages"
                :key="`lesson-page-${page}`"
                type="button"
                class="headteacher-page-btn"
                :class="{ active: page === lessonCurrentPage }"
                :aria-current="page === lessonCurrentPage ? 'page' : undefined"
                @click="goToLessonPage(page)"
              >
                {{ page }}
              </button>
              <button type="button" class="headteacher-page-btn" :disabled="lessonCurrentPage === lessonTotalPages" @click="goToNextLessonPage">
                Next
              </button>
            </div>
          </nav>
        </div>
      </section>
      </div>

      <div v-show="activeWorkspaceTab === 'exams'" class="headteacher-workspace-panel">
      <section class="headteacher-section-card headteacher-panel headteacher-assessment-shell">
        <div class="headteacher-section-head">
          <div>
            <span class="headteacher-eyebrow">AI Takeover</span>
            <h2 class="headteacher-section-title">{{ isEditingAssessment ? 'Update Assessment' : 'Generate Assessment' }}</h2>
            <p class="headteacher-section-subtitle">Create AI exams for an affected teacher, assign them to the handled class or advisory class, and edit the draft before publishing.</p>
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
                <option value="practical_exam">Practical Exam</option>
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
            Only exams tagged as 1st, 2nd, or 3rd grading affect strand recommendations. Activities stay visible to students but do not affect the AI recommendation.
          </div>

          <div class="headteacher-draft-box">
            <div class="headteacher-draft-head">
              <div>
                <h3>Draft Questions</h3>
                <p>{{ generatedQuestions.length > 0 ? 'Review and adjust the draft before publishing.' : 'Generate with AI or load a saved assessment to edit.' }}</p>
              </div>
              <button v-if="generatedQuestions.length > 0" type="button" class="headteacher-button headteacher-button-outline" @click="toggleViewCorrectAnswers">
                {{ showCorrectAnswers ? 'Hide Correct Answers' : 'View Correct Answers' }}
              </button>
            </div>

            <div v-if="generatedQuestions.length === 0" class="headteacher-table-state">
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

          <div class="headteacher-modal-actions headteacher-assessment-actions">
            <button type="button" class="headteacher-button headteacher-button-outline" :disabled="isAssessmentGenerating || isAssessmentSaving" @click="resetAssessmentDraft">Clear Draft</button>
            <button type="button" class="headteacher-button headteacher-button-outline" :disabled="!canGenerateAssessment || isAssessmentGenerating" :title="assessmentGenerateButtonTitle" @click="generateAssessmentWithAi">
              <i class="fas" :class="isAssessmentGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'"></i>
              {{ isAssessmentGenerating ? 'Generating...' : (isEditingAssessment ? 'Regenerate Draft' : 'Generate with AI') }}
            </button>
            <button type="button" class="headteacher-button headteacher-button-primary" :disabled="generatedQuestions.length === 0 || isAssessmentSaving" @click="saveManagedAssessment">
              <i class="fas" :class="isAssessmentSaving ? 'fa-spinner fa-spin' : 'fa-check-circle'"></i>
              {{ isAssessmentSaving ? 'Saving...' : (isEditingAssessment ? 'Update Assessment' : 'Publish Assessment') }}
            </button>
          </div>
          <p v-if="!canGenerateAssessment && assessmentGenerationWarning" class="headteacher-ai-config-warning">{{ assessmentGenerationWarning }}</p>
        </form>
      </section>

      <section class="headteacher-section-card headteacher-panel">
        <div class="headteacher-section-head">
          <div>
            <h2 class="headteacher-section-title">Managed Assessments</h2>
            <p class="headteacher-section-subtitle">Open any existing assessment when you need to substitute, adjust, or republish it for a managed teacher.</p>
          </div>
        </div>

        <div v-if="isAssessmentsLoading" class="headteacher-table-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading managed assessments...</span>
        </div>

        <div v-else-if="filteredManagedAssessments.length === 0" class="headteacher-table-state">
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
              <button type="button" class="headteacher-button headteacher-button-outline" @click="startEditingAssessment(assessment)">
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
import HeadTeacherNotifications from '../../components/HeadTeacherNotifications.vue'
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
const lessonCurrentPage = ref(1)
const lessonPageSize = 5
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
const lessonTotalPages = computed(() => Math.max(1, Math.ceil(lessons.value.length / lessonPageSize)))
const paginatedLessons = computed(() => {
  const start = (lessonCurrentPage.value - 1) * lessonPageSize
  return lessons.value.slice(start, start + lessonPageSize)
})
const visibleLessonPages = computed(() => {
  const maxVisible = 5
  let start = Math.max(1, lessonCurrentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(lessonTotalPages.value, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})
const lessonPageStart = computed(() => lessons.value.length === 0 ? 0 : ((lessonCurrentPage.value - 1) * lessonPageSize) + 1)
const lessonPageEnd = computed(() => Math.min(lessonCurrentPage.value * lessonPageSize, lessons.value.length))
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

const goToLessonPage = (page) => {
  lessonCurrentPage.value = Math.min(lessonTotalPages.value, Math.max(1, Number(page) || 1))
}

const goToPreviousLessonPage = () => goToLessonPage(lessonCurrentPage.value - 1)
const goToNextLessonPage = () => goToLessonPage(lessonCurrentPage.value + 1)

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

const formatCreatorRole = (role) => {
  const normalized = String(role || 'teacher').trim().toLowerCase()
  if (normalized === 'headteacher' || normalized === 'head_teacher') return 'Head Teacher'
  return normalized === 'teacher' ? 'Teacher' : 'Staff'
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
    lessonCurrentPage.value = 1
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

watch(lessonTotalPages, (totalPages) => {
  if (lessonCurrentPage.value > totalPages) lessonCurrentPage.value = totalPages
})

onMounted(() => {
  loadPage()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
@reference "../../styles/tailwind.css";

.headteacher-lessons-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.6fr)_minmax(280px,_0.8fr)];
  @apply tw:[gap:1.25rem];
  @apply tw:[margin-bottom:0];
}

.headteacher-workspace-tabs {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.85rem];
  @apply tw:[margin-top:1.25rem];
  @apply tw:[margin-bottom:1rem];
}

.headteacher-workspace-tab {
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:20px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.9rem];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
  @apply tw:[box-shadow:0_10px_26px_rgba(15,_23,_42,_0.04)];
  @apply tw:[transition:border-color_0.2s_ease,_transform_0.2s_ease,_box-shadow_0.2s_ease,_background_0.2s_ease];
}

.headteacher-workspace-tab:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[box-shadow:0_14px_30px_rgba(15,_23,_42,_0.08)];
}

.headteacher-workspace-tab.active {
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[background:linear-gradient(180deg,_#eff6ff_0%,_#ffffff_100%)];
  @apply tw:[box-shadow:0_14px_30px_rgba(37,_99,_235,_0.12)];
}

.headteacher-workspace-tab-copy {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.headteacher-workspace-tab-copy strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.92rem];
}

.headteacher-workspace-tab-copy small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.45];
}

.headteacher-workspace-tab-count {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-width:2.2rem];
  @apply tw:[min-height:2.2rem];
  @apply tw:[padding:0_0.75rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#1e293b];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:800];
}

.headteacher-workspace-tab.active .headteacher-workspace-tab-count {
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
}

.headteacher-workspace-panel {
  @apply tw:grid;
  @apply tw:[gap:1.5rem];
}

.headteacher-lessons-form-card,
.headteacher-lessons-summary-card,
.headteacher-lesson-card {
  @apply tw:[border:1px_solid_#d9e2ee];
  @apply tw:[border-radius:22px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff,_#f8fbff)];
  @apply tw:[box-shadow:0_18px_40px_rgba(15,_23,_42,_0.06)];
}

.headteacher-lessons-form-card,
.headteacher-lessons-summary-card {
  @apply tw:[padding:1.35rem];
}

.headteacher-lessons-form-card {
  @apply tw:relative;
  @apply tw:overflow-hidden;
}

.headteacher-lessons-form-card::before {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:0_auto_auto_0];
  @apply tw:[width:220px];
  @apply tw:[height:220px];
  @apply tw:[background:radial-gradient(circle,_rgba(14,_116,_144,_0.12),_transparent_68%)];
  @apply tw:pointer-events-none;
}

.headteacher-lessons-hero-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

.headteacher-eyebrow {
  @apply tw:inline-block;
  @apply tw:[margin-bottom:0.45rem];
  @apply tw:[padding:0.28rem_0.65rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e0f2fe];
  @apply tw:[color:#0f766e];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.headteacher-mini-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[padding:0.65rem_0.85rem];
  @apply tw:[border-radius:14px];
  @apply tw:[border:1px_solid_#d7e3f1];
  @apply tw:[background:rgba(255,_255,_255,_0.9)];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:700];
}

.headteacher-form {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.headteacher-form-group-full {
  @apply tw:[grid-column:1_/_-1];
}

.headteacher-form-section {
  @apply tw:grid;
  @apply tw:[gap:0.95rem];
}

.headteacher-step-break {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.9rem];
  @apply tw:[padding:1rem_1rem_0.95rem];
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
}

.headteacher-step-label {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[min-height:26px];
  @apply tw:[padding:0.2rem_0.6rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.headteacher-step-break h3 {
  @apply tw:[margin:0.18rem_0_0.25rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1rem];
}

.headteacher-step-break p {
  @apply tw:[margin:0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.5];
}

.headteacher-selected-teacher-card {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.9rem];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[margin-bottom:1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_#d8e4ef];
  @apply tw:[background:linear-gradient(135deg,_#ffffff,_#eff6ff)];
}

.headteacher-selected-teacher-card.empty {
  @apply tw:justify-center;
  @apply tw:[background:linear-gradient(135deg,_#fff,_#f8fafc)];
}

.headteacher-selected-teacher-avatar {
  @apply tw:[width:48px];
  @apply tw:[height:48px];
  @apply tw:[border-radius:16px];
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[background:linear-gradient(135deg,_#0f766e,_#155e75)];
  @apply tw:[color:#fff];
  @apply tw:[font-weight:800];
}

.headteacher-selected-teacher-copy {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.headteacher-selected-teacher-copy strong {
  @apply tw:[color:#0f172a];
}

.headteacher-selected-teacher-copy span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.88rem];
}

.headteacher-selected-teacher-status {
  @apply tw:ml-auto;
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[color:#0f766e];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
}

.headteacher-status-dot {
  @apply tw:[width:9px];
  @apply tw:[height:9px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#10b981];
  @apply tw:[box-shadow:0_0_0_4px_rgba(16,_185,_129,_0.14)];
}

.headteacher-selected-teacher-empty {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-weight:600];
}

.headteacher-helper-copy {
  @apply tw:block;
  @apply tw:[margin-top:0.45rem];
  @apply tw:[color:#64748b];
}

.headteacher-file-input {
  @apply tw:hidden;
}

.headteacher-upload-dropzone {
  @apply tw:w-full;
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.9rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_dashed_#94a3b8];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(135deg,_#fff,_#f8fafc)];
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.2s_ease,_border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.headteacher-upload-dropzone:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#0f766e];
  @apply tw:[box-shadow:0_14px_28px_rgba(15,_23,_42,_0.08)];
}

.headteacher-upload-icon {
  @apply tw:[width:48px];
  @apply tw:[height:48px];
  @apply tw:[border-radius:16px];
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[background:#fee2e2];
  @apply tw:[color:#b91c1c];
  @apply tw:shrink-0;
}

.headteacher-upload-copy {
  @apply tw:grid;
  @apply tw:text-left;
}

.headteacher-upload-copy strong {
  @apply tw:[color:#0f172a];
}

.headteacher-upload-copy small {
  @apply tw:[margin-top:0.2rem];
  @apply tw:[color:#64748b];
}

.headteacher-upload-action {
  @apply tw:ml-auto;
  @apply tw:[color:#0f766e];
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-weight:800];
}

.headteacher-lessons-actions {
  @apply tw:[margin-top:1.1rem];
}

.headteacher-summary-stack {
  @apply tw:grid;
  @apply tw:[gap:0.9rem];
}

.headteacher-summary-item {
  @apply tw:[padding:1rem];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#fff];
  @apply tw:[border:1px_solid_#e2e8f0];
}

.headteacher-summary-item span {
  @apply tw:block;
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.86rem];
}

.headteacher-summary-item strong {
  @apply tw:block;
  @apply tw:[margin-top:0.35rem];
  @apply tw:[font-size:1.35rem];
  @apply tw:[color:#0f172a];
}

.headteacher-summary-item small {
  @apply tw:block;
  @apply tw:[margin-top:0.35rem];
  @apply tw:[color:#64748b];
}

.headteacher-lesson-list {
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[margin-top:1.25rem];
}

.headteacher-lesson-card {
  @apply tw:[padding:1.2rem_1.25rem];
}

.headteacher-lesson-card-top {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding-bottom:0.9rem];
  @apply tw:[margin-bottom:0.95rem];
  @apply tw:[border-bottom:1px_solid_#edf2f7];
}

.headteacher-lesson-card-copy {
  @apply tw:[flex:1];
}

.headteacher-lesson-card-badges {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.45rem];
  @apply tw:[margin-bottom:0.65rem];
}

.headteacher-lesson-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[padding:0.34rem_0.65rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.02em];
  @apply tw:uppercase;
}

.headteacher-lesson-pill.subtle {
  @apply tw:[background:#eef2ff];
  @apply tw:[color:#3730a3];
}

.headteacher-lesson-card-top h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.08rem];
}

.headteacher-lesson-card-top p {
  @apply tw:[margin:0.45rem_0_0];
  @apply tw:[color:#475569];
  @apply tw:[line-height:1.55];
}

.headteacher-lesson-file-chip {
  @apply tw:[min-width:160px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[padding:0.75rem_0.85rem];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#fff7ed];
  @apply tw:[border:1px_solid_#fed7aa];
  @apply tw:[color:#9a3412];
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-weight:700];
}

.headteacher-lesson-meta {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.85rem];
  @apply tw:[margin-top:0.25rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.9rem];
}

.headteacher-lesson-meta span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
}

.headteacher-lesson-creator small {
  @apply tw:[margin:0];
  @apply tw:[padding:0.18rem_0.42rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#dcebd0];
  @apply tw:[color:var(--lessons-forest)];
  @apply tw:[font-size:0.64rem];
  @apply tw:[font-weight:750];
  @apply tw:[line-height:1.2];
  @apply tw:whitespace-nowrap;
}

.headteacher-lesson-meta span i.fa-book-open,
.headteacher-lesson-meta span i.fa-book-open::before {
  @apply tw:[color:#f97316]!;
}

textarea {
  @apply tw:resize-y;
  @apply tw:[min-height:120px];
}

small {
  @apply tw:[margin-top:0.35rem];
  @apply tw:[color:#64748b];
}

.headteacher-assessment-shell {
  @apply tw:[margin-top:0];
}

.headteacher-assessment-form-grid {
  @apply tw:[margin-top:1rem];
}

.headteacher-context-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
}

.headteacher-context-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.85rem_0.9rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:grid;
  @apply tw:[gap:0.22rem];
}

.headteacher-context-card span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.headteacher-context-card strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.9rem];
  @apply tw:[line-height:1.4];
}

.headteacher-policy-note {
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:1rem_1.05rem];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#c7d2fe];
  @apply tw:[background:linear-gradient(135deg,_#eef2ff,_#f8fafc)];
  @apply tw:[color:#334155];
  @apply tw:[line-height:1.55];
}

.headteacher-policy-note strong {
  @apply tw:[color:#312e81];
}

.headteacher-draft-box {
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#fff];
}

.headteacher-draft-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1rem];
}

.headteacher-draft-head h3,
.headteacher-draft-item h4,
.headteacher-assessment-card h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
}

.headteacher-draft-head p,
.headteacher-assessment-card p {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
}

.headteacher-draft-list,
.headteacher-assessment-list {
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.headteacher-draft-item,
.headteacher-assessment-card {
  @apply tw:[padding:1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:linear-gradient(135deg,_#fff,_#f8fafc)];
}

.headteacher-assessment-actions {
  @apply tw:[margin-top:1rem];
}

.headteacher-ai-config-warning {
  @apply tw:[margin-top:0.85rem];
  @apply tw:[color:#b91c1c];
  @apply tw:[font-weight:700];
}

.headteacher-assessment-card-top {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:0.85rem];
}

.headteacher-assessment-badges {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.45rem];
  @apply tw:[margin-bottom:0.55rem];
}

.headteacher-lesson-pill.period {
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#9a3412];
}

.headteacher-assessment-meta {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.85rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.9rem];
}

.headteacher-assessment-meta span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
}

@media (max-width: 980px) {
  .headteacher-workspace-tabs {
    @apply tw:[grid-template-columns:1fr];
  }

  .headteacher-lessons-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .headteacher-lessons-hero-head,
  .headteacher-draft-head,
  .headteacher-assessment-card-top {
    @apply tw:flex-col;
  }

  .headteacher-context-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }
}

@media (max-width: 640px) {
  .headteacher-workspace-tab {
    @apply tw:[padding:0.85rem_0.9rem];
    @apply tw:[border-radius:16px];
  }

  .headteacher-lesson-card-top {
    @apply tw:flex-col;
  }

  .headteacher-upload-dropzone,
  .headteacher-selected-teacher-card {
    @apply tw:items-start;
  }

  .headteacher-upload-action,
  .headteacher-selected-teacher-status {
    @apply tw:[margin-left:0];
  }

  .headteacher-step-break {
    @apply tw:[padding:0.85rem_0.9rem];
  }

  .headteacher-context-grid {
    @apply tw:[grid-template-columns:1fr];
  }
}

/* Forest theme: mirrors the Head Teacher dashboard and management pages. */
.headteacher-lessons-page {
  --lessons-forest: #1e4307;
  --lessons-forest-deep: #122b03;
  --lessons-leaf: #5f8f32;
  --lessons-soft: #edf5e8;
  --lessons-lime: #b8d88a;
  --lessons-gold: #d4aa2f;
  --lessons-ink: #172014;
  --lessons-muted: #667260;
  --lessons-border: rgba(30, 67, 7, 0.14);
}

.headteacher-lessons-page .headteacher-main {
  @apply tw:[background:radial-gradient(circle_at_92%_3%,_rgba(95,_143,_50,_0.16),_transparent_26rem),______radial-gradient(circle_at_24%_100%,_rgba(184,_216,_138,_0.18),_transparent_30rem),______linear-gradient(145deg,_#f8fbf5_0%,_#f1f6ed_54%,_#edf3e8_100%)];
}

.headteacher-lessons-page .headteacher-panel {
  @apply tw:[border-color:var(--lessons-border)];
  @apply tw:[background:radial-gradient(circle_at_98%_0%,_rgba(184,_216,_138,_0.13),_transparent_28%),______linear-gradient(180deg,_rgba(255,_255,_255,_0.98),_rgba(246,_250,_243,_0.98))];
  @apply tw:[box-shadow:0_18px_40px_rgba(30,_67,_7,_0.075)];
}

.headteacher-lessons-page .headteacher-workspace-tab {
  @apply tw:[border-color:var(--lessons-border)];
  @apply tw:[background:rgba(255,_255,_255,_0.9)];
  @apply tw:[box-shadow:0_10px_26px_rgba(30,_67,_7,_0.045)];
}

.headteacher-lessons-page .headteacher-workspace-tab:hover {
  @apply tw:[border-color:rgba(30,_67,_7,_0.28)];
  @apply tw:[box-shadow:0_14px_30px_rgba(30,_67,_7,_0.09)];
}

.headteacher-lessons-page .headteacher-workspace-tab.active {
  @apply tw:[border-color:rgba(30,_67,_7,_0.3)];
  @apply tw:[background:linear-gradient(180deg,_var(--lessons-soft),_#fff)];
  @apply tw:[box-shadow:0_14px_30px_rgba(30,_67,_7,_0.12)];
}

.headteacher-lessons-page .headteacher-workspace-tab-copy strong,
.headteacher-lessons-page .headteacher-step-break h3,
.headteacher-lessons-page .headteacher-selected-teacher-copy strong,
.headteacher-lessons-page .headteacher-upload-copy strong,
.headteacher-lessons-page .headteacher-summary-item strong,
.headteacher-lessons-page .headteacher-lesson-card-top h3,
.headteacher-lessons-page .headteacher-context-card strong,
.headteacher-lessons-page .headteacher-draft-head h3,
.headteacher-lessons-page .headteacher-draft-item h4,
.headteacher-lessons-page .headteacher-assessment-card h3 {
  @apply tw:[color:var(--lessons-ink)];
}

.headteacher-lessons-page .headteacher-workspace-tab-copy small,
.headteacher-lessons-page .headteacher-step-break p,
.headteacher-lessons-page .headteacher-selected-teacher-copy span,
.headteacher-lessons-page .headteacher-selected-teacher-empty,
.headteacher-lessons-page .headteacher-helper-copy,
.headteacher-lessons-page .headteacher-upload-copy small,
.headteacher-lessons-page .headteacher-summary-item span,
.headteacher-lessons-page .headteacher-summary-item small,
.headteacher-lessons-page .headteacher-lesson-card-top p,
.headteacher-lessons-page .headteacher-lesson-meta,
.headteacher-lessons-page .headteacher-context-card span,
.headteacher-lessons-page .headteacher-draft-head p,
.headteacher-lessons-page .headteacher-assessment-card p,
.headteacher-lessons-page .headteacher-assessment-meta {
  @apply tw:[color:var(--lessons-muted)];
}

.headteacher-lessons-page .headteacher-workspace-tab-count {
  @apply tw:[background:#f1f6ed];
  @apply tw:[color:var(--lessons-forest-deep)];
}

.headteacher-lessons-page .headteacher-workspace-tab.active .headteacher-workspace-tab-count {
  @apply tw:[background:#dcebd0];
  @apply tw:[color:var(--lessons-forest)];
}

.headteacher-lessons-page .headteacher-lessons-form-card,
.headteacher-lessons-page .headteacher-lessons-summary-card,
.headteacher-lessons-page .headteacher-lesson-card {
  @apply tw:[border-color:var(--lessons-border)];
  @apply tw:[background:linear-gradient(180deg,_#fff,_#f6faf3)];
  @apply tw:[box-shadow:0_18px_40px_rgba(30,_67,_7,_0.065)];
}

.headteacher-lessons-page .headteacher-lessons-form-card::before {
  @apply tw:[background:radial-gradient(circle,_rgba(95,_143,_50,_0.16),_transparent_68%)];
}

.headteacher-lessons-page .headteacher-eyebrow,
.headteacher-lessons-page .headteacher-step-label {
  @apply tw:[background:#dcebd0];
  @apply tw:[color:var(--lessons-forest)];
}

.headteacher-lessons-page .headteacher-mini-badge {
  @apply tw:[border-color:var(--lessons-border)];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
  @apply tw:[color:#46543f];
}

.headteacher-lessons-page .headteacher-step-break,
.headteacher-lessons-page .headteacher-context-card {
  @apply tw:[border-color:var(--lessons-border)];
  @apply tw:[background:linear-gradient(180deg,_#fff,_#f4f8f1)];
}

.headteacher-lessons-page .headteacher-selected-teacher-card {
  @apply tw:[border-color:rgba(30,_67,_7,_0.16)];
  @apply tw:[background:linear-gradient(135deg,_#fff,_var(--lessons-soft))];
}

.headteacher-lessons-page .headteacher-selected-teacher-card.empty {
  @apply tw:[background:linear-gradient(135deg,_#fff,_#f5f8f3)];
}

.headteacher-lessons-page .headteacher-selected-teacher-avatar {
  @apply tw:[background:linear-gradient(135deg,_var(--lessons-forest),_#477b22)];
  @apply tw:[box-shadow:0_8px_17px_rgba(30,_67,_7,_0.18)];
}

.headteacher-lessons-page .headteacher-selected-teacher-status,
.headteacher-lessons-page .headteacher-upload-action {
  @apply tw:[color:var(--lessons-forest)];
}

.headteacher-lessons-page .headteacher-status-dot {
  @apply tw:[background:var(--lessons-leaf)];
  @apply tw:[box-shadow:0_0_0_4px_rgba(95,_143,_50,_0.15)];
}

.headteacher-lessons-page .headteacher-form-group input,
.headteacher-lessons-page .headteacher-form-group select,
.headteacher-lessons-page .headteacher-form-group textarea {
  @apply tw:[border-color:rgba(30,_67,_7,_0.18)];
  @apply tw:[background:#fff];
  @apply tw:[color:var(--lessons-ink)];
}

.headteacher-lessons-page .headteacher-form-group input:focus,
.headteacher-lessons-page .headteacher-form-group select:focus,
.headteacher-lessons-page .headteacher-form-group textarea:focus {
  @apply tw:[border-color:rgba(30,_67,_7,_0.55)];
  @apply tw:[outline:none];
  @apply tw:[box-shadow:0_0_0_4px_rgba(30,_67,_7,_0.11)];
}

.headteacher-lessons-page .headteacher-upload-dropzone {
  @apply tw:[border-color:rgba(30,_67,_7,_0.32)];
  @apply tw:[background:linear-gradient(135deg,_#fff,_#f4f8f1)];
}

.headteacher-lessons-page .headteacher-upload-dropzone:hover {
  @apply tw:[border-color:var(--lessons-forest)];
  @apply tw:[box-shadow:0_14px_28px_rgba(30,_67,_7,_0.1)];
}

.headteacher-lessons-page .headteacher-upload-icon {
  @apply tw:[background:#fbe9e6];
  @apply tw:[color:#a73825];
}

.headteacher-lessons-page .headteacher-summary-item {
  @apply tw:[border-color:var(--lessons-border)];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
}

.headteacher-lessons-page .headteacher-lesson-card-top {
  @apply tw:[border-bottom-color:rgba(30,_67,_7,_0.1)];
}

.headteacher-lessons-page .headteacher-lesson-pill {
  @apply tw:[background:#dcebd0];
  @apply tw:[color:var(--lessons-forest)];
}

.headteacher-lessons-page .headteacher-lesson-pill.subtle {
  @apply tw:[background:var(--lessons-soft)];
  @apply tw:[color:#315f13];
}

.headteacher-lessons-page .headteacher-lesson-pill.period,
.headteacher-lessons-page .headteacher-lesson-file-chip {
  @apply tw:[border-color:rgba(212,_170,_47,_0.3)];
  @apply tw:[background:#fff8df];
  @apply tw:[color:#765600];
}

.headteacher-lessons-page .headteacher-lesson-meta i,
.headteacher-lessons-page .headteacher-assessment-meta i {
  @apply tw:[color:var(--lessons-leaf)];
}

.headteacher-lessons-page .headteacher-lesson-meta span i.fa-book-open,
.headteacher-lessons-page .headteacher-lesson-meta span i.fa-book-open::before {
  @apply tw:[color:var(--lessons-gold)]!;
}

.headteacher-lessons-page .headteacher-policy-note {
  @apply tw:[border-color:rgba(30,_67,_7,_0.18)];
  @apply tw:[background:linear-gradient(135deg,_var(--lessons-soft),_#f9fbf7)];
  @apply tw:[color:#46543f];
}

.headteacher-lessons-page .headteacher-policy-note strong {
  @apply tw:[color:var(--lessons-forest-deep)];
}

.headteacher-lessons-page .headteacher-draft-box,
.headteacher-lessons-page .headteacher-draft-item,
.headteacher-lessons-page .headteacher-assessment-card {
  @apply tw:[border-color:var(--lessons-border)];
  @apply tw:[background:linear-gradient(135deg,_#fff,_#f5f9f1)];
}

.headteacher-lessons-page .headteacher-button-primary {
  @apply tw:[border-color:var(--lessons-forest)];
  @apply tw:[background:linear-gradient(135deg,_var(--lessons-forest),_#3f751d)];
  @apply tw:[color:#fff];
  @apply tw:[box-shadow:0_11px_24px_rgba(30,_67,_7,_0.22)];
}

.headteacher-lessons-page .headteacher-button-primary:hover:not(:disabled) {
  @apply tw:[border-color:#28580b];
  @apply tw:[background:linear-gradient(135deg,_#28580b,_#4d8427)];
  @apply tw:[box-shadow:0_14px_28px_rgba(30,_67,_7,_0.27)];
}

.headteacher-lessons-page .headteacher-button-outline:hover:not(:disabled) {
  @apply tw:[border-color:rgba(30,_67,_7,_0.28)];
  @apply tw:[background:var(--lessons-soft)];
  @apply tw:[color:var(--lessons-forest)];
}

.headteacher-lessons-page .headteacher-banner.success {
  @apply tw:[border-color:rgba(30,_67,_7,_0.15)];
  @apply tw:[background:linear-gradient(180deg,_#fff,_var(--lessons-soft))];
  @apply tw:[color:var(--lessons-forest)];
}

.headteacher-lessons-page .headteacher-table-state {
  @apply tw:[border-color:var(--lessons-border)];
  @apply tw:[background:rgba(255,_255,_255,_0.82)];
  @apply tw:[color:var(--lessons-muted)];
}

.headteacher-lessons-page .headteacher-lesson-pagination {
  @apply tw:[margin-top:0.25rem];
  @apply tw:[border:1px_solid_var(--lessons-border)];
  @apply tw:[border-radius:16px];
  @apply tw:[background:rgba(237,_245,_232,_0.78)];
}

.headteacher-lessons-page .headteacher-pagination-info {
  @apply tw:[color:var(--lessons-muted)];
}

.headteacher-lessons-page .headteacher-page-btn {
  @apply tw:[border-color:rgba(30,_67,_7,_0.16)];
  @apply tw:[color:#46543f];
}

.headteacher-lessons-page .headteacher-page-btn:hover:not(:disabled):not(.active) {
  @apply tw:[border-color:rgba(30,_67,_7,_0.3)];
  @apply tw:[background:var(--lessons-soft)];
  @apply tw:[color:var(--lessons-forest)];
}

.headteacher-lessons-page .headteacher-page-btn.active {
  @apply tw:[border-color:var(--lessons-forest)];
  @apply tw:[background:linear-gradient(135deg,_var(--lessons-forest),_#3f751d)];
  @apply tw:[color:#fff];
  @apply tw:[box-shadow:0_7px_16px_rgba(30,_67,_7,_0.18)];
}

.headteacher-lessons-page .headteacher-page-btn:focus-visible {
  @apply tw:[outline:3px_solid_rgba(30,_67,_7,_0.16)];
  @apply tw:[outline-offset:2px];
}

body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.active,
body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.router-link-active,
body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.router-link-exact-active {
  @apply tw:[border-color:var(--lessons-forest)]!;
  @apply tw:[background:linear-gradient(135deg,_var(--lessons-forest),_#3e711d)]!;
  @apply tw:[box-shadow:0_12px_22px_rgba(30,_67,_7,_0.18)]!;
}

body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.active > span,
body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.router-link-active > span,
body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.router-link-exact-active > span {
  @apply tw:[color:#fff]!;
}

body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.active i,
body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.router-link-active i,
body.headteacher-dashboard .headteacher-lessons-page .headteacher-sidebar .headteacher-nav-link.router-link-exact-active i {
  @apply tw:[border-color:rgba(255,_255,_255,_0.16)]!;
  @apply tw:[background:rgba(255,_255,_255,_0.14)]!;
  @apply tw:[color:#fff]!;
}

@media (prefers-reduced-motion: reduce) {
  .headteacher-lessons-page .headteacher-workspace-tab,
  .headteacher-lessons-page .headteacher-upload-dropzone,
  .headteacher-lessons-page .headteacher-button {
    @apply tw:[transition:none];
  }
}

</style>
