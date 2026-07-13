<!-- src/views/teacher/TeacherActivities.vue -->
<template>
  <div class="teacher-dashboard">
    <!-- Sidebar -->
    <aside id="teacher-sidebar-drawer" class="teacher-sidebar" :class="{ active: isSidebarOpen }">
      <div class="sidebar-header">
        <div class="teacher-logo">
          <div class="teacher-logo-icon">
            <i class="fas fa-graduation-cap" aria-hidden="true"></i>
          </div>
          <div class="teacher-logo-text">
            <h2>EduMatch</h2>
            <p>Teacher Portal</p>
          </div>
        </div>

        <button class="sidebar-close" type="button" @click="closeSidebar" aria-label="Close sidebar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <h4 class="nav-section-title">Navigation</h4>

          <router-link to="/teacher/dashboard" class="nav-link" :class="{ active: isActiveRoute('/teacher/dashboard') }" @click="closeSidebar">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </router-link>

          <div class="nav-dropdown nav-dropdown-activities">
            <button
              type="button"
              class="nav-link nav-link-dropdown"
              data-nav-group="activities"
              :class="{ active: isActivitiesRouteActive || isActivitiesMenuOpen, 'is-expanded': isActivitiesMenuOpen }"
              :aria-expanded="isActivitiesMenuOpen ? 'true' : 'false'"
              aria-controls="teacher-activities-sublinks"
              @click="toggleActivitiesMenu"
            >
              <span class="nav-link-main">
                <i class="fas fa-tasks"></i>
                <span class="nav-link-copy">
                  <span class="nav-link-title">Activities</span>
                </span>
              </span>
              <i class="fas fa-chevron-down nav-link-caret" aria-hidden="true"></i>
            </button>
            <div v-if="isActivitiesMenuOpen" id="teacher-activities-sublinks" class="nav-sublinks">
              <router-link :to="buildActivitiesTabRoute('lesson')" class="nav-sublink" :class="{ active: isActivitiesSubRouteActive('lesson') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Lesson Upload</span>
                  <span class="nav-sublink-caption">Upload lesson PDFs and materials</span>
                </span>
              </router-link>
              <router-link :to="buildActivitiesTabRoute('challenge')" class="nav-sublink" :class="{ active: isActivitiesSubRouteActive('challenge') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Assessment Creation</span>
                  <span class="nav-sublink-caption">Create quizzes, activities, and exams</span>
                </span>
              </router-link>
            </div>
          </div>

          <router-link to="/teacher/students" class="nav-link" :class="{ active: isActiveRoute('/teacher/students') }" @click="closeSidebar">
            <i class="fas fa-user-graduate"></i>
            <span>Students</span>
          </router-link>

          <div class="nav-dropdown">
            <button
              type="button"
              class="nav-link nav-link-dropdown"
              data-nav-group="records"
              :class="{ active: isRecordsRouteActive || isRecordsMenuOpen, 'is-expanded': isRecordsMenuOpen }"
              :aria-expanded="isRecordsMenuOpen ? 'true' : 'false'"
              aria-controls="teacher-records-sublinks"
              @click="toggleRecordsMenu"
            >
              <span class="nav-link-main">
                <i class="fas fa-clipboard-list"></i>
                <span class="nav-link-copy">
                  <span class="nav-link-title">Records</span>
                </span>
              </span>
              <i class="fas fa-chevron-down nav-link-caret" aria-hidden="true"></i>
            </button>
            <div v-if="isRecordsMenuOpen" id="teacher-records-sublinks" class="nav-sublinks">
              <router-link :to="buildRecordsTabRoute('lessons')" class="nav-sublink" :class="{ active: isRecordsSubRouteActive('lessons') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Lessons</span>
                  <span class="nav-sublink-caption">Uploaded lesson materials</span>
                </span>
              </router-link>
              <router-link :to="buildRecordsTabRoute('assessments')" class="nav-sublink" :class="{ active: isRecordsSubRouteActive('assessments') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Activities / Exams</span>
                  <span class="nav-sublink-caption">Scores and assessment records</span>
                </span>
              </router-link>
              <router-link :to="buildRecordsTabRoute('attendance')" class="nav-sublink" :class="{ active: isRecordsSubRouteActive('attendance') }" @click="closeSidebar">
                <span class="nav-sublink-copy">
                  <span class="nav-sublink-title">Attendance</span>
                  <span class="nav-sublink-caption">Daily class attendance logs</span>
                </span>
              </router-link>
            </div>
          </div>

        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="teacher-profile">
          <div class="teacher-avatar">
            <i class="fas fa-user" aria-hidden="true"></i>
          </div>
          <div class="teacher-info">
            <h5>{{ teacherFullName }}</h5>
            <p class="teacher-role">{{ teacherRole }}</p>
            <div class="teacher-status">
              <span class="status-indicator active"></span>
              <span>{{ teacherStatus }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <button
      v-if="isSidebarOpen"
      type="button"
      class="sidebar-backdrop"
      aria-label="Close sidebar"
      @click="closeSidebar"
    ></button>

    <!-- Main -->
    <main class="teacher-main">
      <!-- Top Header -->
      <header class="top-header" data-tour="challenges-header">
        <div class="header-content">
          <div class="header-left">
            <button class="mobile-menu-toggle" type="button" @click="toggleSidebar" aria-label="Open sidebar">
              <i class="fas fa-bars"></i>
            </button>

            <div>
              <h1>Activities</h1>
              <p class="header-subtitle">
                Your unified content management area for lessons, challenges, assessments, uploads, and AI-generated activities.
              </p>
            </div>
          </div>

          <div class="header-actions">
            <div class="header-right-controls">
            <button
              type="button"
              class="header-tour-btn"
              @click="launchManualTour"
              aria-label="Help and tour"
              title="Help / Tour"
            >
              <i class="fas fa-question-circle"></i>
            </button>
            <div ref="notificationMenuRef" class="notification-menu">
              <button type="button" class="notification-bell" @click="toggleNotificationsPanel" aria-label="Notifications" :aria-expanded="showNotificationsPanel ? 'true' : 'false'">
                <i class="fas fa-bell"></i>
                <span v-if="unreadNotificationCount > 0" class="notification-count">{{ unreadNotificationCount }}</span>
              </button>
              <div v-if="showNotificationsPanel" class="notification-dropdown">
                <div class="notification-dropdown-header">
                  <h3>Notifications</h3>
                  <div class="notification-dropdown-actions">
                    <button type="button" class="notification-dropdown-clear" :disabled="notifications.length === 0" @click="clearAllNotifications">
                      Clear all
                    </button>
                    <button type="button" class="notification-dropdown-close" @click="closeNotificationsPanel" aria-label="Close notifications">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <UserNotificationList :notifications="notifications" :loading="isNotificationsLoading" />
              </div>
            </div>
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-tour-btn account-menu-trigger"
                aria-label="Account menu"
                title="Account"
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
        </div>

      </header>
      <!-- Workspace -->
      <section class="builder-workspace" data-tour="challenges-workspace">
        <!-- Left: Panels -->
        <div class="builder-main">
          <!-- Lesson Panel -->
          <section class="builder-panel" id="lessonPanel" v-show="selectedTab === 'lesson'" data-tour="challenges-lesson-panel" aria-label="Lesson upload panel">
            <div class="panel-header panel-header-modern">
              <div>
                <span class="panel-eyebrow">Teacher Builder</span>
                <h2>Lesson upload</h2>
                <p>Post a lesson title, connect the correct subject, then upload one clean PDF for students to review.</p>
              </div>
              <span class="panel-badge">PDF Only</span>
            </div>

            <div v-if="flash && flash.tab === 'lesson'" class="flash-banner" :class="flash.type === 'success' ? 'success' : 'error'">
              {{ flash.message }}
            </div>

            <form class="builder-form lesson-form-modern wizard-form" novalidate @submit.prevent="lessonCurrentStep < 3 ? goToNextLessonStep() : submitLesson()">
              <nav class="wizard-progress" aria-label="Lesson creation progress">
                <div class="wizard-progress-track" aria-hidden="true"><span :style="{ width: `${lessonProgress}%` }"></span></div>
                <ol>
                  <li v-for="step in lessonWizardSteps" :key="step.number" :class="{ active: step.number === lessonCurrentStep, completed: step.number < lessonCurrentStep }">
                    <button type="button" class="wizard-step-button" :disabled="step.number > lessonCurrentStep" :aria-current="step.number === lessonCurrentStep ? 'step' : undefined" @click="selectLessonWizardStep(step.number)">
                      <span class="wizard-step-marker"><i v-if="step.number < lessonCurrentStep" class="fas fa-check" aria-hidden="true"></i><span v-else>{{ step.number }}</span></span>
                      <span class="wizard-step-copy"><strong>{{ step.label }}</strong><small>{{ step.number < lessonCurrentStep ? 'Completed' : (step.number === lessonCurrentStep ? 'Current step' : 'Remaining') }}</small></span>
                    </button>
                  </li>
                </ol>
              </nav>

              <transition name="wizard-slide" mode="out-in">
                <div :key="lessonCurrentStep" class="wizard-step-panel">
                  <template v-if="lessonCurrentStep === 1">
                    <div class="form-section-break"><div><span class="builder-section-step">Step 1 of 3</span><h3>Lesson Details</h3><p>Start with the lesson title and subject so the file is attached to the right class content.</p></div></div>
                    <section class="lesson-form-section">
                      <div class="lesson-form-section-head"><h3>Lesson Information</h3><p>All fields in this step are required.</p></div>
                      <div class="form-grid">
                        <div class="form-group" :class="{ 'has-error': lessonStepAttempted[1] && lessonStepErrors.lessonTitle }">
                          <label for="lessonTitle">Lesson Title <span class="required-indicator">*</span></label>
                          <input id="lessonTitle" v-model.trim="lessonForm.lessonTitle" type="text" placeholder="Example: Introduction to Quadratic Functions" required :aria-invalid="Boolean(lessonStepAttempted[1] && lessonStepErrors.lessonTitle)" aria-describedby="lessonTitle-error" @blur="lessonStepAttempted[1] = true" />
                          <p v-if="lessonStepAttempted[1] && lessonStepErrors.lessonTitle" id="lessonTitle-error" class="field-error" role="alert">{{ lessonStepErrors.lessonTitle }}</p>
                        </div>
                        <div class="form-group" :class="{ 'has-error': lessonStepAttempted[1] && lessonStepErrors.subjectId }">
                          <label for="lessonClass">Class <span class="required-indicator">*</span></label>
                          <select id="lessonClass" v-model="lessonForm.subjectId" required :disabled="teacherClasses.length === 0" :aria-invalid="Boolean(lessonStepAttempted[1] && lessonStepErrors.subjectId)" aria-describedby="lessonClass-error" @blur="lessonStepAttempted[1] = true">
                            <option value="">{{ teacherClasses.length === 0 ? 'Create a class first in Students' : 'Select class' }}</option><option v-for="classItem in teacherClasses" :key="classItem.id" :value="classItem.id">{{ classItem.label }}</option>
                          </select>
                          <p v-if="lessonStepAttempted[1] && lessonStepErrors.subjectId" id="lessonClass-error" class="field-error" role="alert">{{ lessonStepErrors.subjectId }}</p>
                        </div>
                        <div class="form-group" :class="{ 'has-error': lessonStepAttempted[1] && lessonStepErrors.subject }">
                          <label for="lessonSubject">Subject <span class="required-indicator">*</span></label>
                          <select id="lessonSubject" v-model="lessonForm.subject" required :disabled="Boolean(teacherSubject)" :aria-invalid="Boolean(lessonStepAttempted[1] && lessonStepErrors.subject)" aria-describedby="lessonSubject-error" @blur="lessonStepAttempted[1] = true">
                            <option value="">{{ teacherSubject ? 'Assigned subject' : 'Select subject' }}</option><option v-for="subject in lessonSubjectOptions" :key="subject" :value="subject">{{ subject }}</option>
                          </select>
                          <p v-if="lessonStepAttempted[1] && lessonStepErrors.subject" id="lessonSubject-error" class="field-error" role="alert">{{ lessonStepErrors.subject }}</p>
                        </div>
                      </div>
                    </section>
                  </template>

                  <template v-else-if="lessonCurrentStep === 2">
                    <div class="form-section-break"><div><span class="builder-section-step">Step 2 of 3</span><h3>Upload Lesson File</h3><p>Upload one PDF lesson plan for students to review.</p></div></div>
                    <section class="lesson-form-section">
                      <div class="lesson-form-section-head"><h3>Attachment</h3><p>PDF format only, up to 10MB.</p></div>
                      <div class="lesson-upload-box" :class="{ 'is-dragging': isLessonDropActive, 'has-error': lessonStepAttempted[2] && lessonStepErrors.lessonPlanFile }" @dragenter.prevent="onLessonDragEnter" @dragover.prevent="onLessonDragOver" @dragleave.prevent="onLessonDragLeave" @drop.prevent="onLessonDrop">
                        <input id="lessonPlanFile" ref="lessonPlanFileInput" type="file" accept=".pdf,application/pdf" class="lesson-upload-input" :aria-invalid="Boolean(lessonStepAttempted[2] && lessonStepErrors.lessonPlanFile)" aria-describedby="lessonPlanFile-error" @change="onLessonFileChange($event); lessonStepAttempted[2] = true" />
                        <div class="lesson-upload-content"><i class="fas fa-file-pdf"></i><h4>Drag and drop your lesson plan PDF here</h4><p>or choose a file from your device</p><button type="button" class="btn btn-outline btn-sm" @click="triggerLessonFileBrowse">Browse PDF</button></div>
                      </div>
                      <p v-if="lessonStepAttempted[2] && lessonStepErrors.lessonPlanFile" id="lessonPlanFile-error" class="field-error" role="alert">{{ lessonStepErrors.lessonPlanFile }}</p>
                      <div v-if="lessonForm.lessonPlanFile" class="attachment-list"><div class="attachment-item"><span class="attachment-name">{{ lessonForm.lessonPlanFile.name }}</span><span class="attachment-meta">{{ formatBytes(lessonForm.lessonPlanFile.size) }}</span></div></div>
                    </section>
                  </template>

                  <template v-else>
                    <div class="form-section-break"><div><span class="builder-section-step">Step 3 of 3</span><h3>Review and Publish</h3><p>Confirm the lesson information before making it available to students.</p></div><span class="wizard-ready-pill"><i class="fas fa-circle-check"></i> Ready</span></div>
                    <section class="wizard-review-card"><dl><div><dt>Lesson title</dt><dd>{{ lessonForm.lessonTitle }}</dd></div><div><dt>Class</dt><dd>{{ teacherClasses.find(item => item.id === lessonForm.subjectId)?.label }}</dd></div><div><dt>Subject</dt><dd>{{ lessonForm.subject }}</dd></div><div><dt>PDF</dt><dd>{{ lessonForm.lessonPlanFile?.name }} · {{ formatBytes(lessonForm.lessonPlanFile?.size) }}</dd></div></dl></section>
                  </template>
                </div>
              </transition>

              <div class="form-actions wizard-actions lesson-actions">
                <button v-if="lessonCurrentStep === 1" class="btn btn-outline" type="button" :disabled="isPostingLesson" @click="resetLessonForm()">Cancel</button>
                <button v-else class="btn btn-outline" type="button" :disabled="isPostingLesson" @click="goToPreviousLessonStep"><i class="fas fa-arrow-left"></i> Back</button>
                <button v-if="lessonCurrentStep < 3" class="btn btn-primary" type="button" :disabled="!lessonCanContinue" :aria-disabled="!lessonCanContinue" @click="goToNextLessonStep">Next <i class="fas fa-arrow-right"></i></button>
                <button v-else class="btn btn-primary" type="submit" :disabled="isPostingLesson || teacherClasses.length === 0" data-tour="challenges-post-lesson-action"><i class="fas" :class="isPostingLesson ? 'fa-spinner fa-spin' : 'fa-upload'"></i>{{ isPostingLesson ? "Publishing..." : "Publish Lesson" }}</button>
              </div>
            </form>
          </section>

          <!-- Challenge Panel -->
          <section class="builder-panel" id="challengePanel" v-show="selectedTab === 'challenge'" data-tour="challenges-assessment-panel" aria-label="Assessment creation panel">
            <div class="panel-header panel-header-modern">
              <div>
                <span class="panel-eyebrow">Teacher Builder</span>
                <h2>{{ isActivityAssessment ? "Activity Creation" : "Assessment Creation" }}</h2>
                <p>
                  {{ isActivityAssessment
                    ? "Build a classroom-style activity with instructions, a due date, and teacher attachments students can review before they turn in their work."
                    : "Fill out the essentials, choose whether this is a quiz or exam, then generate and review the draft before publishing." }}
                </p>
              </div>
              <span class="panel-badge">{{ isActivityAssessment ? "Classroom Task" : "Editable AI Draft" }}</span>
            </div>

            <div v-if="flash && flash.tab === 'challenge'" class="flash-banner" :class="flash.type === 'success' ? 'success' : 'error'">
              {{ flash.message }}
            </div>

            <form class="builder-form builder-form-assessment wizard-form" novalidate @submit.prevent="challengeCurrentStep < 4 ? goToNextChallengeStep() : undefined">
              <nav class="wizard-progress" aria-label="Activity and assessment creation progress">
                <div class="wizard-progress-track" aria-hidden="true"><span :style="{ width: `${challengeProgress}%` }"></span></div>
                <ol>
                  <li v-for="step in challengeWizardSteps" :key="step.number" :class="{ active: step.number === challengeCurrentStep, completed: step.number < challengeCurrentStep }">
                    <button type="button" class="wizard-step-button" :disabled="step.number > challengeCurrentStep" :aria-current="step.number === challengeCurrentStep ? 'step' : undefined" @click="selectChallengeWizardStep(step.number)">
                      <span class="wizard-step-marker"><i v-if="step.number < challengeCurrentStep" class="fas fa-check" aria-hidden="true"></i><span v-else>{{ step.number }}</span></span>
                      <span class="wizard-step-copy"><strong>{{ step.label }}</strong><small>{{ step.number < challengeCurrentStep ? 'Completed' : (step.number === challengeCurrentStep ? 'Current step' : 'Remaining') }}</small></span>
                    </button>
                  </li>
                </ol>
              </nav>

              <transition name="wizard-slide" mode="out-in">
              <div :key="challengeCurrentStep" class="form-grid wizard-step-grid" @focusout="challengeStepAttempted[challengeCurrentStep] = true">
                <template v-if="challengeCurrentStep === 1">
                <div class="form-section-break full">
                  <div>
                    <span class="builder-section-step">Step 1</span>
                    <h3>{{ isActivityAssessment ? "Lesson and Basic Details" : "Lesson and Topic" }}</h3>
                    <p>
                      {{ isActivityAssessment
                        ? "Choose the linked lesson or class context, then add an optional title for the task. The activity instruction can be the main prompt students follow."
                        : "Start with the lesson or class, title, and main topic so the assessment stays aligned with the right class context." }}
                    </p>
                  </div>
                </div>
                <div class="form-group">
                  <label for="challengeTitle">{{ isActivityAssessment ? "Activity Title (Optional)" : "Assessment Title" }}</label>
                  <input
                    id="challengeTitle"
                    v-model.trim="challengeForm.challengeTitle"
                    type="text"
                    :placeholder="isActivityAssessment ? 'e.g., Reflection Activity 1' : 'e.g., Module 1 Quiz'"
                    :required="!isActivityAssessment"
                    :aria-invalid="Boolean(challengeStepAttempted[1] && challengeStepErrors.challengeTitle)"
                    aria-describedby="challengeTitle-error"
                  />
                  <p v-if="challengeStepAttempted[1] && challengeStepErrors.challengeTitle" id="challengeTitle-error" class="field-error" role="alert">{{ challengeStepErrors.challengeTitle }}</p>
                </div>

                <div class="form-group">
                  <label for="linkedLesson">Linked Lesson</label>
                  <select id="linkedLesson" v-model="challengeForm.linkedLesson" :required="!challengeForm.subjectId" :aria-invalid="Boolean(challengeStepAttempted[1] && challengeStepErrors.linkedLesson)" aria-describedby="challengeContext-error">
                    <option value="">Select lesson</option>
                    <option v-for="lesson in lessonOptions" :key="lesson.id" :value="lesson.id">
                      {{ lesson.title }}{{ lesson.classLabel ? ` · ${lesson.classLabel}` : '' }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="challengeClass">Class to Publish</label>
                  <select id="challengeClass" v-model="challengeForm.subjectId" :required="!challengeForm.linkedLesson" :disabled="teacherClasses.length === 0" :aria-invalid="Boolean(challengeStepAttempted[1] && challengeStepErrors.linkedLesson)" aria-describedby="challengeContext-error">
                    <option value="">
                      {{ teacherClasses.length === 0
                        ? 'No class available'
                        : (challengeForm.linkedLesson ? 'Optional when lesson is linked' : 'Select class') }}
                    </option>
                    <option v-for="classItem in teacherClasses" :key="classItem.id" :value="classItem.id">
                      {{ classItem.label }}
                    </option>
                  </select>
                  <p class="helper-copy">Choose the class that should receive this assessment when you are not linking a lesson.</p>
                </div>

                <p v-if="challengeStepAttempted[1] && challengeStepErrors.linkedLesson" id="challengeContext-error" class="field-error full" role="alert">{{ challengeStepErrors.linkedLesson }}</p>
                </template>

                <template v-else-if="challengeCurrentStep === 2">
                <div class="form-section-break full">
                  <div>
                    <span class="builder-section-step">Step 2</span>
                    <h3>Activity, Quiz, or Exam Setup</h3>
                    <p>Choose whether this should stay as an activity, become a quiz, or be published as an exam with a 1st, 2nd, 3rd, or 4th grading tag.</p>
                  </div>
                  <span class="section-state-pill" :class="challengeAssessmentModeClass">
                    {{ challengeAssessmentModePill }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="challengeAssessmentMode">Type</label>
                  <select id="challengeAssessmentMode" v-model="challengeForm.assessmentMode" required>
                    <option value="activity">Activity</option>
                    <option value="quiz">Quiz</option>
                    <option value="grading_assessment">Exam</option>
                  </select>
                </div>

                <div class="form-group" v-if="isGradingAssessment">
                  <label for="challengeGradingPeriod">Grading Period</label>
                  <select id="challengeGradingPeriod" v-model="challengeForm.gradingPeriod" required :aria-invalid="Boolean(challengeStepAttempted[2] && challengeStepErrors.challengeGradingPeriod)" aria-describedby="challengeGradingPeriod-error">
                    <option value="">Select grading period</option>
                    <option value="1st">1st Grading</option>
                    <option value="2nd">2nd Grading</option>
                    <option value="3rd">3rd Grading</option>
                    <option value="4th">4th Grading</option>
                  </select>
                </div>

                <div v-if="!isActivityAssessment" class="form-group">
                  <label for="challengeTopic">Topic</label>
                  <input id="challengeTopic" v-model.trim="challengeForm.challengeTopic" type="text" placeholder="e.g., Photosynthesis Process" required :aria-invalid="Boolean(challengeStepAttempted[2] && challengeStepErrors.challengeTopic)" aria-describedby="challengeTopic-error" />
                </div>

                <p v-if="challengeStepAttempted[2] && challengeStepErrors.challengeGradingPeriod" id="challengeGradingPeriod-error" class="field-error full" role="alert">{{ challengeStepErrors.challengeGradingPeriod }}</p>
                <p v-if="challengeStepAttempted[2] && challengeStepErrors.challengeTopic" id="challengeTopic-error" class="field-error full" role="alert">{{ challengeStepErrors.challengeTopic }}</p>
                </template>

                <template v-else-if="challengeCurrentStep === 3">
                <div class="form-section-break full">
                  <div>
                    <span class="builder-section-step">Step 3</span>
                    <h3>{{ isActivityAssessment ? "Activity Details" : "Exam Settings" }}</h3>
                    <p>
                      {{ isActivityAssessment
                        ? "Set the subject, activity points, and due date for this task. Activities do not use exam timers or AI-generated questions."
                        : "Set the question count, timer, difficulty, deadline, and scoring before you generate the draft." }}
                    </p>
                  </div>
                </div>

                <div v-if="!isActivityAssessment" class="form-group">
                  <label for="challengeQuestionCount">Number of Questions</label>
                  <input
                    id="challengeQuestionCount"
                    v-model.number="challengeForm.challengeQuestionCount"
                    type="number"
                    min="1"
                    max="100"
                    required
                    :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengeQuestionCount)"
                    aria-describedby="challengeQuestionCount-error"
                  />
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengeQuestionCount" id="challengeQuestionCount-error" class="field-error" role="alert">{{ challengeStepErrors.challengeQuestionCount }}</p>
                </div>

                <div v-if="!isActivityAssessment" class="form-group">
                  <label for="challengeExamDurationMinutes">Exam Timer (Minutes)</label>
                  <input
                    id="challengeExamDurationMinutes"
                    v-model.number="challengeForm.examDurationMinutes"
                    type="number"
                    min="1"
                    max="300"
                    required
                    :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengeExamDurationMinutes)"
                    aria-describedby="challengeExamDurationMinutes-error"
                  />
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengeExamDurationMinutes" id="challengeExamDurationMinutes-error" class="field-error" role="alert">{{ challengeStepErrors.challengeExamDurationMinutes }}</p>
                </div>

                <div v-if="!isActivityAssessment" class="form-group">
                  <label for="challengeExamType">Exam Type</label>
                  <select id="challengeExamType" v-model="challengeForm.challengeExamType" required :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengeExamType)" aria-describedby="challengeExamType-error">
                    <option value="">Select exam type</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="identification">Identification</option>
                    <option value="true_false">True or False</option>
                    <option value="mixed">Mixed</option>
                  </select>
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengeExamType" id="challengeExamType-error" class="field-error" role="alert">{{ challengeStepErrors.challengeExamType }}</p>
                </div>

                <div class="form-group">
                  <label for="challengeSubject">Subject</label>
                  <select id="challengeSubject" v-model="challengeForm.subject" required :disabled="Boolean(teacherSubject) || !selectedAssessmentStrand" :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengeSubject)" aria-describedby="challengeSubject-error">
                    <option value="">{{ !selectedAssessmentStrand ? 'Select lesson or class first' : (teacherSubject ? 'Assigned subject' : 'Select subject') }}</option>
                    <option v-for="subject in assessmentSubjectOptions" :key="subject" :value="subject">{{ subject }}</option>
                  </select>
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengeSubject" id="challengeSubject-error" class="field-error" role="alert">{{ challengeStepErrors.challengeSubject }}</p>
                </div>

                <div v-if="isActivityAssessment" class="form-group">
                  <label for="challengeActivityPoints">Activity Points</label>
                  <input
                    id="challengeActivityPoints"
                    v-model.number="challengeForm.activityPoints"
                    type="number"
                    min="1"
                    max="100"
                    required
                    :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengeActivityPoints)"
                    aria-describedby="challengeActivityPoints-error"
                  />
                  <p class="helper-copy">Set the score students will see for this activity, from 1 to 100.</p>
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengeActivityPoints" id="challengeActivityPoints-error" class="field-error" role="alert">{{ challengeStepErrors.challengeActivityPoints }}</p>
                </div>

                <div v-if="!isActivityAssessment" class="form-group">
                  <label for="challengeDifficulty">Difficulty</label>
                  <select id="challengeDifficulty" v-model="challengeForm.challengeDifficulty" required :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengeDifficulty)" aria-describedby="challengeDifficulty-error">
                    <option value="">Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengeDifficulty" id="challengeDifficulty-error" class="field-error" role="alert">{{ challengeStepErrors.challengeDifficulty }}</p>
                </div>

                <div v-if="!isActivityAssessment" class="form-group">
                  <label for="challengePoints">Total Points</label>
                  <input id="challengePoints" v-model.number="challengeForm.challengePoints" type="number" min="10" max="500" required :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengePoints)" aria-describedby="challengePoints-error" />
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengePoints" id="challengePoints-error" class="field-error" role="alert">{{ challengeStepErrors.challengePoints }}</p>
                </div>

                <div class="form-group">
                  <label for="challengeDeadlineDate">Deadline Date</label>
                  <input id="challengeDeadlineDate" v-model="challengeForm.deadlineDate" type="date" required :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengeDeadlineDate)" aria-describedby="challengeDeadlineDate-error" />
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengeDeadlineDate" id="challengeDeadlineDate-error" class="field-error" role="alert">{{ challengeStepErrors.challengeDeadlineDate }}</p>
                </div>

                <div class="form-group">
                  <label for="challengeDeadlineTime">Deadline Time</label>
                  <input id="challengeDeadlineTime" v-model="challengeForm.deadlineTime" type="time" required :aria-invalid="Boolean(challengeStepAttempted[3] && challengeStepErrors.challengeDeadlineTime)" aria-describedby="challengeDeadlineTime-error" />
                  <p v-if="challengeStepAttempted[3] && challengeStepErrors.challengeDeadlineTime" id="challengeDeadlineTime-error" class="field-error" role="alert">{{ challengeStepErrors.challengeDeadlineTime }}</p>
                </div>

                <div class="form-group full">
                  <div class="assessment-mode-hint">
                    <strong>Recommendation rule:</strong>
                    Strand recommendations only use exams tagged as 1st, 2nd, 3rd, or 4th grading. Activities still appear for students, but they do not affect the AI recommendation.
                  </div>
                </div>

                </template>

                <template v-else>
                <div class="form-section-break full">
                  <div>
                    <span class="builder-section-step">Step 4</span>
                    <h3>{{ isActivityAssessment ? "Instructions and Files" : "Instructions and AI Draft" }}</h3>
                    <p>
                      {{ isActivityAssessment
                        ? "Add the task directions and upload any files, PDFs, or images students should open before they submit."
                        : "Add the student instructions, generate the draft, then review and adjust the questions before publishing." }}
                    </p>
                  </div>
                </div>

                <div class="form-group full">
                  <label for="challengeDescription">{{ isActivityAssessment ? "Activity Instructions" : "Assessment Instructions" }}</label>
                  <textarea
                    id="challengeDescription"
                    v-model.trim="challengeForm.challengeDescription"
                    :placeholder="isActivityAssessment ? 'Write the activity directions, expected output, and turn-in reminders for students...' : 'Write the assessment prompt and directions for students...'"
                    required
                    :aria-invalid="Boolean(challengeStepAttempted[4] && challengeStepErrors.challengeDescription)"
                    aria-describedby="challengeDescription-error"
                  />
                </div>

                <div v-if="isActivityAssessment" class="form-group full">
                  <label>Teacher Attachments</label>
                  <p class="helper-copy">Optional. Upload up to 5 files for students to open from the activity page.</p>

                  <div
                    class="lesson-upload-box"
                    :class="{ 'is-dragging': isActivityDropActive }"
                    @dragenter.prevent="onActivityDragEnter"
                    @dragover.prevent="onActivityDragOver"
                    @dragleave.prevent="onActivityDragLeave"
                    @drop.prevent="onActivityDrop"
                  >
                    <input
                      ref="activityAttachmentInput"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp,.zip"
                      class="lesson-upload-input"
                      @change="onActivityAttachmentChange"
                    />
                    <div class="lesson-upload-content">
                      <i class="fas fa-paperclip"></i>
                      <h4>Drag and drop activity files here</h4>
                      <p>PDF, document, image, or zip files, up to 5 files and 10MB each.</p>
                      <button type="button" class="btn btn-outline btn-sm" @click="triggerActivityAttachmentBrowse">
                        Browse Files
                      </button>
                    </div>
                  </div>

                  <div v-if="challengeForm.activityAttachments.length" class="attachment-list">
                    <div v-for="file in challengeForm.activityAttachments" :key="`${file.name}:${file.size}:${file.lastModified}`" class="attachment-item attachment-item-removable">
                      <div class="attachment-copy">
                        <span class="attachment-name">{{ file.name }}</span>
                        <span class="attachment-meta">{{ formatBytes(file.size) }}</span>
                      </div>
                      <button type="button" class="attachment-remove-btn" @click="removeActivityAttachment(file)">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="!isActivityAssessment" class="form-group full">
                  <label>Generated Questions</label>

                  <div v-if="generatedQuestions.length === 0 || !isGeneratedPreviewVisible" class="draft-empty-state">
                    <div class="draft-empty-icon">
                      <i class="fas fa-wand-magic-sparkles"></i>
                    </div>
                    <article class="draft-item draft-item-empty">
                      <h4>No generated questions yet</h4>
                      <p class="draft-empty-message">Complete the setup above, then click Generate with AI. You can still edit every question before publishing.</p>
                      <span>Click “Generate with AI” to create draft questions.</span>
                    </article>
                  </div>

                  <transition name="preview-fade">
                    <div v-if="generatedQuestions.length > 0 && isGeneratedPreviewVisible" id="generatedQuestionsContainer" class="draft-list">
                      <div class="preview-toolbar">
                        <span class="draft-count-pill">{{ generatedQuestions.length }} question{{ generatedQuestions.length === 1 ? '' : 's' }} ready</span>
                        <button
                          type="button"
                          class="btn btn-outline btn-sm"
                          @click="toggleViewCorrectAnswers"
                        >
                          {{ showCorrectAnswers ? 'Hide Correct Answers' : 'View Correct Answers' }}
                        </button>
                      </div>

                      <article v-for="(q, idx) in generatedQuestions" :key="idx" class="draft-item">
                        <h4>Question {{ idx + 1 }}</h4>

                        <div class="form-group full">
                          <label>Prompt</label>
                          <textarea v-model.trim="q.prompt" rows="3" required />
                        </div>

                        <div v-if="q.options && q.options.length" class="form-group full">
                          <label>Options (one per line)</label>
                          <textarea
                            :value="q.options.join('\n')"
                            rows="4"
                            @input="onOptionsInput(idx, $event.target.value)"
                          />
                        </div>

                        <div v-if="showCorrectAnswers" class="form-group full answer-highlight">
                          <label>Correct Answer</label>
                          <input v-model.trim="q.answer" type="text" required />
                        </div>
                      </article>

                      <section v-if="showCorrectAnswers" class="answer-key-panel">
                        <h4>Answer Key</h4>
                        <ol>
                          <li v-for="(q, idx) in generatedQuestions" :key="`answer-key-${idx}`">
                            <strong>Q{{ idx + 1 }}:</strong> {{ q.answer || 'No answer provided' }}
                          </li>
                        </ol>
                      </section>
                    </div>
                  </transition>
                </div>
                <p v-if="challengeStepAttempted[4] && challengeStepErrors.challengeDescription" id="challengeDescription-error" class="field-error full" role="alert">{{ challengeStepErrors.challengeDescription }}</p>
                </template>
              </div>
              </transition>

              <div class="form-actions wizard-actions">
                <button v-if="challengeCurrentStep > 1" class="btn btn-outline" type="button" :disabled="isGenerating || isPublishingActivity || isSavingGeneratedAssessment" @click="goToPreviousChallengeStep"><i class="fas fa-arrow-left"></i> Back</button>
                <span v-else class="wizard-action-spacer" aria-hidden="true"></span>
                <button v-if="challengeCurrentStep < 4" class="btn btn-primary" type="button" :disabled="!challengeCanContinue" :aria-disabled="!challengeCanContinue" @click="goToNextChallengeStep">Next <i class="fas fa-arrow-right"></i></button>
                <button
                  v-if="challengeCurrentStep === 4 && !isActivityAssessment"
                  class="btn btn-outline"
                  type="button"
                  id="generateAssessmentBtn"
                  data-tour="challenges-generate-action"
                  :disabled="!canGenerate || isGenerating || !challengeCanContinue"
                  :title="generateButtonTitle"
                  @click="generateWithAi"
                >
                  <i class="fas" :class="isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'"></i>
                  {{ isGenerating ? "Generating..." : "Generate with AI" }}
                </button>
                <button
                  v-if="challengeCurrentStep === 4 && isActivityAssessment"
                  class="btn btn-primary"
                  type="button"
                  :disabled="!canPublishActivity || isPublishingActivity || !challengeCanContinue"
                  @click="publishActivity"
                >
                  <i class="fas" :class="isPublishingActivity ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
                  {{ isPublishingActivity ? "Publishing..." : "Publish Activity" }}
                </button>
                <button
                  v-if="challengeCurrentStep === 4 && !isActivityAssessment && generatedQuestions.length > 0 && isGeneratedPreviewVisible"
                  class="btn btn-primary"
                  type="button"
                  :disabled="isSavingGeneratedAssessment || !generatedQuestionsAreValid || !challengeCanContinue"
                  @click="finalizeGeneratedAssessment"
                >
                  <i class="fas" :class="isSavingGeneratedAssessment ? 'fa-spinner fa-spin' : 'fa-check-circle'"></i>
                  {{ isSavingGeneratedAssessment ? "Saving..." : "Publish Assessment" }}
                </button>
              </div>
              <p v-if="!isActivityAssessment && !canGenerate && aiGenerationWarning" class="ai-config-warning" role="alert">
                {{ aiGenerationWarning }}
              </p>
            </form>
          </section>
        </div>

      </section>

      <div v-if="isTourActive" class="teacher-page-tour-layer" aria-live="polite">
        <div class="teacher-page-tour-backdrop"></div>
        <div v-if="tourSpotlightStyle" class="teacher-page-tour-spotlight" :style="tourSpotlightStyle"></div>
        <section
          class="teacher-page-tour-tooltip"
          :style="tourTooltipStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="`Activities tour step ${tourStepIndex + 1} of ${tourSteps.length}`"
        >
          <p class="teacher-page-tour-step">Step {{ tourStepIndex + 1 }} of {{ tourSteps.length }}</p>
          <h3>{{ activeTourStep?.title }}</h3>
          <p>{{ activeTourStep?.description }}</p>
          <div class="teacher-page-tour-actions">
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-ghost" @click="skipTour">Skip</button>
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-ghost" :disabled="tourStepIndex === 0" @click="goToPreviousTourStep">Back</button>
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-primary" @click="goToNextTourStep">
              {{ isLastTourStep ? 'Finish' : 'Next' }}
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "../../stores/auth.js";
import UserNotificationList from "../../components/UserNotificationList.vue";
import { useUserNotifications } from "../../composables/useUserNotifications.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

/**
 * ✅ Replace this with your real auth/user source (Pinia/API/props).
 */
const user = ref({
  displayName: "",
  name: "",
  subject: "",
  strand: "",
  status: "Online",
  email: "",
});

const {
  notifications,
  unreadCount: unreadNotificationCount,
  isLoading: isNotificationsLoading,
  showNotificationsPanel,
  toggleNotificationsPanel,
  closeNotificationsPanel,
  clearAllNotifications,
} = useUserNotifications({ limit: 8, pollIntervalMs: 15000 });
const isAccountMenuOpen = ref(false);
const accountMenuRef = ref(null);
const notificationMenuRef = ref(null);

const teacherName = computed(() => user.value.displayName || user.value.name || "Teacher");
const teacherFullName = computed(() => teacherName.value);
const teacherRole = computed(() => {
  const role = String(authStore.user?.role || "teacher").trim().toLowerCase();
  if (!role) return "Teacher";
  return role.charAt(0).toUpperCase() + role.slice(1);
});
const teacherSubject = computed(() => String(user.value.subject || authStore.user?.subject || "").trim());
const teacherStrand = computed(() => String(user.value.strand || "").trim());
const teacherStatus = computed(() => String(user.value.status || "Online").trim() || "Online");
const teacherAvatarUrl = computed(() => {
  const profileImage = String(authStore.user?.profileImage || "").trim();
  if (profileImage && !profileImage.toLowerCase().includes("ui-avatars.com")) return profileImage;
  return "";
});

/** Sidebar (mobile) */
const isSidebarOpen = ref(false);
const isTourActive = ref(false);
const tourStepIndex = ref(0);
const tourTargetRect = ref(null);
const tourTooltipStyle = ref({});
const hasAttemptedAutoTour = ref(false);
const CURRENT_PAGE_ROUTE = "/teacher/activities";
const TOUR_ROUTE_ORDER = ["/teacher/dashboard", "/teacher/activities", "/teacher/students", "/teacher/records"];
const TOUR_PROGRESS_PREFIX = "edumatch_teacher_tour_progress_";
const SIDEBAR_BREAKPOINT = 1024;
const SIDEBAR_WIDTH = 280;
const ACTIVITY_TAB_KEYS = ["lesson", "challenge"];
const RECORDS_TAB_KEYS = ["lessons", "assessments", "attendance"];
const toggleSidebar = () => (isSidebarOpen.value = !isSidebarOpen.value);
const closeSidebar = () => (isSidebarOpen.value = false);
const isActiveRoute = (path) => route.path === path || route.path.startsWith(`${path}/`);
const activitiesMenuOpen = ref(route.path === "/teacher/activities" || route.path.startsWith("/teacher/activities/"));
const normalizeActivitiesTab = (tab) => {
  const normalizedTab = String(tab || "").trim().toLowerCase();
  if (normalizedTab === "assessment" || normalizedTab === "assessments") return "challenge";
  return ACTIVITY_TAB_KEYS.includes(normalizedTab) ? normalizedTab : "lesson";
};
const buildActivitiesTabRoute = (tab) => {
  const normalizedTab = normalizeActivitiesTab(tab);
  return normalizedTab === "lesson"
    ? { path: "/teacher/activities" }
    : { path: "/teacher/activities", query: { tab: normalizedTab } };
};
const isActivitiesRouteActive = computed(() => route.path === "/teacher/activities" || route.path.startsWith("/teacher/activities/"));
const isActivitiesMenuOpen = computed(() => activitiesMenuOpen.value);
const isActivitiesSubRouteActive = (tab) => (
  isActivitiesRouteActive.value && normalizeActivitiesTab(route.query.tab) === normalizeActivitiesTab(tab)
);
const toggleActivitiesMenu = () => {
  activitiesMenuOpen.value = !activitiesMenuOpen.value;
};
const recordsMenuOpen = ref(route.path === "/teacher/records" || route.path.startsWith("/teacher/records/"));
const normalizeRecordsTab = (tab) => {
  const normalizedTab = String(tab || "").trim().toLowerCase();
  return RECORDS_TAB_KEYS.includes(normalizedTab) ? normalizedTab : "lessons";
};
const buildRecordsTabRoute = (tab) => {
  const normalizedTab = normalizeRecordsTab(tab);
  return normalizedTab === "lessons"
    ? { path: "/teacher/records" }
    : { path: "/teacher/records", query: { tab: normalizedTab } };
};
const isRecordsRouteActive = computed(() => route.path === "/teacher/records" || route.path.startsWith("/teacher/records/"));
const isRecordsMenuOpen = computed(() => recordsMenuOpen.value);
const isRecordsSubRouteActive = (tab) => (
  isRecordsRouteActive.value && normalizeRecordsTab(route.query.tab) === normalizeRecordsTab(tab)
);
const toggleRecordsMenu = () => {
  recordsMenuOpen.value = !recordsMenuOpen.value;
};
const syncMobileMenuBodyState = () => {
  if (typeof window === "undefined") return;
  const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value;
  document.body.classList.toggle("teacher-mobile-menu-open", shouldLockBody);
};

function handleLogout() {
  authStore.logout();
  router.push("/auth/login");
}

function toggleAccountMenu() {
  isAccountMenuOpen.value = !isAccountMenuOpen.value;
}

function goToProfile() {
  isAccountMenuOpen.value = false;
  router.push("/teacher/profile");
}

function goToSettings() {
  isAccountMenuOpen.value = false;
  router.push("/teacher/settings");
}

function handleAccountMenuClickOutside(event) {
  const target = event?.target;
  if (notificationMenuRef.value && target instanceof Node && notificationMenuRef.value.contains(target)) return;
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return;
  closeNotificationsPanel();
  isAccountMenuOpen.value = false;
}

function onKeydown(e) {
  if (e.key !== "Escape") return;
  if (isTourActive.value) {
    skipTour();
    return;
  }
  closeSidebar();
  showNotificationsPanel.value = false;
}

/** Tabs */
const selectedTab = ref("lesson"); // 'lesson' | 'challenge'
const tourSteps = [
  {
    key: "lesson-panel",
    title: "Lesson Materials",
    description: "Upload lesson materials here, attach the lesson plan file, and prepare the content students will use for learning.",
    selector: '[data-tour="challenges-lesson-panel"]',
    tab: "lesson"
  },
  {
    key: "post-lesson-action",
    title: "Publish Activity",
    description: "After reviewing the lesson details, publish the activity so it becomes available inside the teacher workflow.",
    selector: '[data-tour="challenges-post-lesson-action"]',
    tab: "lesson"
  },
  {
    key: "assessment-panel",
    title: "Assessment Creation Panel",
    description: "Create assessments manually by setting the lesson, exam type, difficulty level, item count, and schedule.",
    selector: '[data-tour="challenges-assessment-panel"]',
    tab: "challenge"
  },
  {
    key: "generate-action",
    title: "AI Assessment Generator",
    description: "Use AI to generate questions from lesson content, then review, edit, publish, or remove activities as needed.",
    selector: '[data-tour="challenges-generate-action"]',
    tab: "challenge"
  }
];
/** Flash banner (optional) */
const flash = ref(null); // { tab:'lesson'|'challenge', type:'success'|'error', message:'...' }

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!configured) return "/api";
  if (configured.endsWith("/api")) return configured;
  return `${configured}/api`;
};

const getAuthConfig = (headers = {}) => ({
  headers: {
    Authorization: `Bearer ${authStore.token}`,
    ...headers,
  },
});

const uniqueBy = (items, keyResolver) => {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item, index) => {
    const key = String(keyResolver(item, index) || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const STRAND_SUBJECT_MAP = {
  STEM: ["Mathematics", "Science", "Physics", "Chemistry", "Technology"],
  HUMSS: ["English", "Communication", "Literature", "Social Sciences"],
  ABM: ["Business Mathematics", "Accounting", "Entrepreneurship", "Finance"],
  TVL: ["Technical Skills", "ICT", "Vocational Skills"],
  GENERAL: [],
};
STRAND_SUBJECT_MAP.GENERAL = Array.from(new Set(Object.values(STRAND_SUBJECT_MAP).flat().filter(Boolean)));

const normalizeStrand = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(STRAND_SUBJECT_MAP, normalized) ? normalized : "";
};

const getSubjectsForStrand = (strand) => {
  const normalized = normalizeStrand(strand);
  return normalized ? [...STRAND_SUBJECT_MAP[normalized]] : [];
};

/** Lesson form */
const MAX_LESSON_PDF_BYTES = 10 * 1024 * 1024;
const MAX_ACTIVITY_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ACTIVITY_ATTACHMENT_COUNT = 5;
const ACTIVITY_ATTACHMENT_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".jpg", ".jpeg", ".png", ".webp", ".zip"]);
const teacherClasses = ref([]);
const lessonForm = reactive({
  lessonTitle: "",
  subjectId: "",
  subject: "",
  lessonPlanFile: null,
});
const isPostingLesson = ref(false);
const isLessonDropActive = ref(false);
const lessonPlanFileInput = ref(null);
const activityAttachmentInput = ref(null);
const isActivityDropActive = ref(false);
const lessonCurrentStep = ref(1);
const lessonStepAttempted = reactive({ 1: false, 2: false, 3: false });
const lessonWizardSteps = [
  { number: 1, label: "Details" },
  { number: 2, label: "PDF upload" },
  { number: 3, label: "Review" },
];

const getLessonStepErrors = (step) => {
  const errors = {};
  if (step === 1) {
    if (!String(lessonForm.lessonTitle || "").trim()) errors.lessonTitle = "Enter a lesson title.";
    if (!String(lessonForm.subjectId || "").trim()) errors.subjectId = "Select the class that will receive this lesson.";
    if (!String(lessonForm.subject || "").trim()) errors.subject = "Select a subject.";
  }
  if (step === 2) {
    const file = lessonForm.lessonPlanFile;
    if (!file) {
      errors.lessonPlanFile = "Upload a PDF lesson plan to continue.";
    } else if (getFileExtension(file.name) !== ".pdf") {
      errors.lessonPlanFile = "The lesson plan must be a PDF file.";
    } else if (Number(file.size || 0) > MAX_LESSON_PDF_BYTES) {
      errors.lessonPlanFile = "The PDF must be 10MB or smaller.";
    }
  }
  return errors;
};

const lessonStepErrors = computed(() => getLessonStepErrors(lessonCurrentStep.value));
const lessonCanContinue = computed(() => Object.keys(lessonStepErrors.value).length === 0);
const lessonProgress = computed(() => ((lessonCurrentStep.value - 1) / (lessonWizardSteps.length - 1)) * 100);

async function focusFirstInvalidField(errorKeys) {
  await nextTick();
  const firstKey = Object.keys(errorKeys || {})[0];
  if (!firstKey) return;
  const target = document.getElementById(firstKey);
  target?.focus();
}

async function goToNextLessonStep() {
  lessonStepAttempted[lessonCurrentStep.value] = true;
  const errors = getLessonStepErrors(lessonCurrentStep.value);
  if (Object.keys(errors).length > 0) {
    await focusFirstInvalidField(errors);
    return;
  }
  lessonCurrentStep.value = Math.min(lessonWizardSteps.length, lessonCurrentStep.value + 1);
}

function goToPreviousLessonStep() {
  lessonCurrentStep.value = Math.max(1, lessonCurrentStep.value - 1);
}

function selectLessonWizardStep(step) {
  if (step >= lessonCurrentStep.value) return;
  lessonCurrentStep.value = step;
}

function formatClassLabel(classItem) {
  const className = String(classItem?.className || "").trim();
  const code = String(classItem?.code || "").trim();
  const baseLabel = className || String(classItem?.name || "").trim() || "Class";
  const parts = [baseLabel];
  if (code) parts.push(code);
  return parts.join(" · ");
}

async function loadClassOptions() {
  try {
    if (!authStore.token) {
      teacherClasses.value = [];
      lessonForm.subjectId = "";
      return;
    }

    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/subjects`, getAuthConfig());
    const classes = uniqueBy(
      Array.isArray(response.data?.subjects) ? response.data.subjects : [],
      (subject, index) => subject.id || subject._id || `${subject.name || ""}-${index}`
    );

    teacherClasses.value = classes.map((subject, index) => ({
      id: subject.id || subject._id || `subject-${index + 1}`,
      name: subject.name || "",
      className: subject.className || "",
      track: subject.track || "",
      code: subject.code || "",
      label: formatClassLabel(subject),
    }));

    if (!teacherClasses.value.some((item) => item.id === lessonForm.subjectId)) {
      lessonForm.subjectId = teacherClasses.value[0]?.id || "";
    }
  } catch (error) {
    console.error("[loadClassOptions] failed:", error);
    teacherClasses.value = [];
    lessonForm.subjectId = "";
  }
}

function onLessonFileChange(e) {
  const files = Array.from(e.target.files || []);
  lessonForm.lessonPlanFile = files.length > 0 ? files[0] : null;
  lessonStepAttempted[2] = true;
}

function onLessonDragEnter() {
  isLessonDropActive.value = true;
}

function onLessonDragOver() {
  isLessonDropActive.value = true;
}

function onLessonDragLeave(event) {
  const target = event.currentTarget;
  const related = event.relatedTarget;
  if (!target || !related || !target.contains(related)) {
    isLessonDropActive.value = false;
  }
}

function onLessonDrop(event) {
  isLessonDropActive.value = false;
  const droppedFiles = Array.from(event.dataTransfer?.files || []);
  lessonForm.lessonPlanFile = droppedFiles.length > 0 ? droppedFiles[0] : null;
  lessonStepAttempted[2] = true;
  if (lessonPlanFileInput.value) {
    const dataTransfer = new DataTransfer();
    if (lessonForm.lessonPlanFile) dataTransfer.items.add(lessonForm.lessonPlanFile);
    lessonPlanFileInput.value.files = dataTransfer.files;
  }
}

function triggerLessonFileBrowse() {
  lessonPlanFileInput.value?.click();
}

function formatBytes(value) {
  const size = Number(value || 0);
  if (size <= 0) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function resetLessonForm({ preserveFlash = false } = {}) {
  lessonForm.lessonTitle = "";
  if (!teacherClasses.value.some((item) => item.id === lessonForm.subjectId)) {
    lessonForm.subjectId = teacherClasses.value[0]?.id || "";
  }
  lessonForm.subject = teacherSubject.value || "";
  lessonForm.lessonPlanFile = null;
  lessonCurrentStep.value = 1;
  Object.keys(lessonStepAttempted).forEach((step) => { lessonStepAttempted[step] = false; });
  if (!preserveFlash && flash.value?.tab === "lesson") flash.value = null;
  if (lessonPlanFileInput.value) lessonPlanFileInput.value.value = "";
}

/**
 * Submit lesson to your backend
 * Original: POST /teacher/challenges/lessons (multipart/form-data)
 */
async function submitLesson() {
  if (!authStore.token) {
    console.warn("[submitLesson] blocked: missing auth token");
    flash.value = { tab: "lesson", type: "error", message: "You are not logged in. Please sign in again." };
    return;
  }

  const title = String(lessonForm.lessonTitle || "").trim();
  const selectedClassId = String(lessonForm.subjectId || "").trim();
  const selectedClass = teacherClasses.value.find((item) => item.id === selectedClassId) || null;
  const track = String(selectedClass?.track || "GENERAL").trim() || "GENERAL";
  const subject = String(selectedClass?.name || lessonForm.subject || "").trim();
  const selectedFile = lessonForm.lessonPlanFile;

  if (!title || !subject || !selectedFile || !selectedClassId || !selectedClass) {
    console.warn("[submitLesson] validation failed:", {
      hasTitle: Boolean(title),
      hasSubject: Boolean(subject),
      hasPdf: Boolean(selectedFile),
      hasClass: Boolean(selectedClassId && selectedClass),
    });
    flash.value = { tab: "lesson", type: "error", message: "Select a class, complete the lesson details, and upload the lesson plan PDF." };
    return;
  }

  const fileName = String(selectedFile.name || "").toLowerCase();
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()}` : "";
  if (extension !== ".pdf") {
    flash.value = { tab: "lesson", type: "error", message: "Only PDF files are allowed for Lesson Plan Upload." };
    return;
  }

  if (Number(selectedFile.size || 0) > MAX_LESSON_PDF_BYTES) {
    flash.value = { tab: "lesson", type: "error", message: "Lesson Plan PDF exceeds 10MB. Please upload a smaller file." };
    return;
  }

  const lessonDescription = `Lesson: ${title}\nSubject: ${subject}`;

  try {
    isPostingLesson.value = true;
    flash.value = null;

    const fd = new FormData();
    fd.append("title", title);
    fd.append("track", track);
    fd.append("subject", subject);
    fd.append("subjectId", selectedClassId);
    fd.append("description", lessonDescription);
    fd.append("lessonPlanFile", selectedFile);

    console.log("[submitLesson] posting lesson:", {
      endpoint: `${resolveApiBaseUrl()}/teacher/lessons`,
      title,
      track,
      subject,
      subjectId: selectedClassId,
      descriptionLength: lessonDescription.length,
      file: { name: selectedFile.name, type: selectedFile.type, size: selectedFile.size },
    });

    const response = await axios.post(`${resolveApiBaseUrl()}/teacher/lessons`, fd, getAuthConfig());
    const data = response.data || {};
    if (!data.success) {
      throw new Error(data.message || "Failed to post lesson.");
    }

    console.log("[submitLesson] lesson posted successfully:", data?.lesson);
    flash.value = { tab: "lesson", type: "success", message: data.message || "Lesson posted successfully." };

    const refreshResults = await Promise.allSettled([loadClassOptions(), loadLessonOptions()]);
    refreshResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`[submitLesson] post-success refresh ${index} failed:`, result.reason);
      }
    });
    // Reset form
    resetLessonForm({ preserveFlash: true });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (!err.response) {
        console.error("[submitLesson] network error:", err.message);
        flash.value = { tab: "lesson", type: "error", message: "Network error while posting lesson. Check your connection." };
      } else {
        console.error("[submitLesson] server error:", {
          status: err.response.status,
          data: err.response.data,
        });
        flash.value = { tab: "lesson", type: "error", message: err.response.data?.message || "Server failed to save lesson." };
      }
    } else {
      console.error("[submitLesson] unexpected error:", err);
      flash.value = { tab: "lesson", type: "error", message: err?.message || "Failed to post lesson." };
    }
  } finally {
    isPostingLesson.value = false;
  }
}

/** Challenge form */
const challengeForm = reactive({
  challengeTitle: "",
  linkedLesson: "",
  subjectId: "",
  assessmentMode: "activity",
  gradingPeriod: "",
  challengeTopic: "",
  challengeQuestionCount: 5,
  examDurationMinutes: 30,
  challengeExamType: "",
  subject: "",
  challengeDifficulty: "",
  challengePoints: 100,
  activityPoints: 100,
  deadlineDate: "",
  deadlineTime: "",
  challengeDescription: "",
  activityAttachments: [],
});

function getSelectedChallengeClass() {
  const selectedClassId = String(challengeForm.subjectId || "").trim();
  return teacherClasses.value.find((item) => item.id === selectedClassId) || null;
}

function buildSubmissionDeadlineIso(deadlineDate, deadlineTime) {
  const datePart = String(deadlineDate || "").trim();
  const timePart = String(deadlineTime || "").trim();
  if (!datePart || !timePart) return "";
  const composed = new Date(`${datePart}T${timePart}:00`);
  if (Number.isNaN(composed.getTime())) return "";
  return composed.toISOString();
}

function buildActivityTitleFromInstructions(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Classroom Activity";
  return normalized.length <= 60 ? normalized : `${normalized.slice(0, 57).trimEnd()}...`;
}

function getFileExtension(fileName) {
  const normalized = String(fileName || "").toLowerCase();
  return normalized.includes(".") ? `.${normalized.split(".").pop()}` : "";
}

function validateActivityAttachment(file) {
  const extension = getFileExtension(file?.name);
  if (!ACTIVITY_ATTACHMENT_EXTENSIONS.has(extension)) {
    return "Only PDF, common document, image, and zip files are allowed for activity attachments.";
  }
  if (Number(file?.size || 0) > MAX_ACTIVITY_ATTACHMENT_BYTES) {
    return "Each activity attachment must be 10MB or smaller.";
  }
  return "";
}

function ensureActivityAttachmentAccess() {
  if (canManageActivityAttachments.value) return true;
  flash.value = {
    tab: "challenge",
    type: "error",
    message: "Switch to Activity mode before adding activity attachments.",
  };
  return false;
}

function mergeActivityAttachments(files) {
  const incomingFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  if (incomingFiles.length === 0) return;
  if (!ensureActivityAttachmentAccess()) return;

  const existingAttachments = Array.isArray(challengeForm.activityAttachments) ? challengeForm.activityAttachments : [];
  const nextAttachments = [...existingAttachments];
  const existingKeys = new Set(existingAttachments.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
  let warningMessage = "";

  for (const file of incomingFiles) {
    const key = `${file?.name}:${file?.size}:${file?.lastModified}`;
    if (!file || existingKeys.has(key)) continue;
    if (nextAttachments.length >= MAX_ACTIVITY_ATTACHMENT_COUNT) {
      warningMessage = `You can upload up to ${MAX_ACTIVITY_ATTACHMENT_COUNT} activity attachments only.`;
      break;
    }

    const validationMessage = validateActivityAttachment(file);
    if (validationMessage) {
      warningMessage = validationMessage;
      continue;
    }

    existingKeys.add(key);
    nextAttachments.push(file);
  }

  challengeForm.activityAttachments = nextAttachments;
  if (warningMessage) {
    flash.value = { tab: "challenge", type: "error", message: warningMessage };
  }
}

function onActivityAttachmentChange(event) {
  const files = Array.from(event?.target?.files || []);
  mergeActivityAttachments(files);
  if (event?.target) event.target.value = "";
}

function onActivityDragEnter() {
  if (!canManageActivityAttachments.value) return;
  isActivityDropActive.value = true;
}

function onActivityDragOver() {
  if (!canManageActivityAttachments.value) return;
  isActivityDropActive.value = true;
}

function onActivityDragLeave(event) {
  const target = event.currentTarget;
  const related = event.relatedTarget;
  if (!target || !related || !target.contains(related)) {
    isActivityDropActive.value = false;
  }
}

function onActivityDrop(event) {
  isActivityDropActive.value = false;
  if (!ensureActivityAttachmentAccess()) return;
  const droppedFiles = Array.from(event.dataTransfer?.files || []);
  mergeActivityAttachments(droppedFiles);
}

function triggerActivityAttachmentBrowse() {
  if (!ensureActivityAttachmentAccess()) return;
  activityAttachmentInput.value?.click();
}

function removeActivityAttachment(fileToRemove) {
  const removeKey = `${fileToRemove?.name}:${fileToRemove?.size}:${fileToRemove?.lastModified}`;
  challengeForm.activityAttachments = challengeForm.activityAttachments.filter((file) => (
    `${file?.name}:${file?.size}:${file?.lastModified}` !== removeKey
  ));
}

const generatedQuestions = ref([]); // [{prompt, answer, options?:[]}]
const generatedDraftMeta = ref(null);
const isGeneratedPreviewVisible = ref(false);
const showCorrectAnswers = ref(false);
const isGenerating = ref(false);
const isSavingGeneratedAssessment = ref(false);
const isPublishingActivity = ref(false);
const canGenerate = ref(false);
const AI_CONFIG_WARNING_MESSAGE = "AI Generator is not configured. Please contact the administrator to set up the API Key and Model.";
const aiGenerationWarning = ref("");
const generateButtonTitle = computed(() => {
  if (canGenerate.value) return "";
  return aiGenerationWarning.value || AI_CONFIG_WARNING_MESSAGE;
});
const isGradingAssessment = computed(() => challengeForm.assessmentMode === "grading_assessment");
const isQuizAssessment = computed(() => challengeForm.assessmentMode === "quiz");
const isActivityAssessment = computed(() => challengeForm.assessmentMode === "activity");
const challengeCurrentStep = ref(1);
const challengeStepAttempted = reactive({ 1: false, 2: false, 3: false, 4: false });
const challengeWizardSteps = computed(() => [
  { number: 1, label: "Context" },
  { number: 2, label: "Type" },
  { number: 3, label: isActivityAssessment.value ? "Details" : "Settings" },
  { number: 4, label: isActivityAssessment.value ? "Publish" : "Generate" },
]);

const getChallengeStepErrors = (step) => {
  const errors = {};
  const hasContext = Boolean(String(challengeForm.linkedLesson || "").trim() || String(challengeForm.subjectId || "").trim());
  if (step === 1) {
    if (!isActivityAssessment.value && !String(challengeForm.challengeTitle || "").trim()) {
      errors.challengeTitle = "Enter an assessment title.";
    }
    if (!hasContext) errors.linkedLesson = "Select a linked lesson or a class to publish to.";
  }
  if (step === 2) {
    if (!String(challengeForm.assessmentMode || "").trim()) errors.challengeAssessmentMode = "Select a type.";
    if (isGradingAssessment.value && !String(challengeForm.gradingPeriod || "").trim()) {
      errors.challengeGradingPeriod = "Select the grading period for this exam.";
    }
    if (!isActivityAssessment.value && !String(challengeForm.challengeTopic || "").trim()) {
      errors.challengeTopic = "Enter the assessment topic.";
    }
  }
  if (step === 3) {
    if (!String(challengeForm.subject || "").trim()) errors.challengeSubject = "Select a subject.";
    if (isActivityAssessment.value) {
      const points = Number(challengeForm.activityPoints);
      if (!Number.isInteger(points) || points < 1 || points > 100) errors.challengeActivityPoints = "Enter a whole number from 1 to 100.";
    } else {
      const questionCount = Number(challengeForm.challengeQuestionCount);
      const duration = Number(challengeForm.examDurationMinutes);
      const totalPoints = Number(challengeForm.challengePoints);
      if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 100) errors.challengeQuestionCount = "Enter 1 to 100 questions.";
      if (!Number.isInteger(duration) || duration < 1 || duration > 300) errors.challengeExamDurationMinutes = "Enter a timer from 1 to 300 minutes.";
      if (!String(challengeForm.challengeExamType || "").trim()) errors.challengeExamType = "Select an exam type.";
      if (!String(challengeForm.challengeDifficulty || "").trim()) errors.challengeDifficulty = "Select a difficulty.";
      if (!Number.isFinite(totalPoints) || totalPoints < 10 || totalPoints > 500) errors.challengePoints = "Enter total points from 10 to 500.";
    }
    if (!String(challengeForm.deadlineDate || "").trim()) errors.challengeDeadlineDate = "Select a deadline date.";
    if (!String(challengeForm.deadlineTime || "").trim()) errors.challengeDeadlineTime = "Select a deadline time.";
    const deadline = buildSubmissionDeadlineIso(challengeForm.deadlineDate, challengeForm.deadlineTime);
    if (deadline && new Date(deadline).getTime() <= Date.now()) errors.challengeDeadlineDate = "Set a deadline in the future.";
  }
  if (step === 4 && !String(challengeForm.challengeDescription || "").trim()) {
    errors.challengeDescription = isActivityAssessment.value ? "Enter clear activity instructions." : "Enter assessment instructions.";
  }
  return errors;
};

const challengeStepErrors = computed(() => getChallengeStepErrors(challengeCurrentStep.value));
const challengeCanContinue = computed(() => Object.keys(challengeStepErrors.value).length === 0);
const challengeProgress = computed(() => ((challengeCurrentStep.value - 1) / (challengeWizardSteps.value.length - 1)) * 100);
const generatedQuestionsAreValid = computed(() => generatedQuestions.value.length > 0 && generatedQuestions.value.every((question) => (
  String(question.prompt || "").trim() && String(question.answer || "").trim()
)));

async function goToNextChallengeStep() {
  challengeStepAttempted[challengeCurrentStep.value] = true;
  const errors = getChallengeStepErrors(challengeCurrentStep.value);
  if (Object.keys(errors).length > 0) {
    await focusFirstInvalidField(errors);
    return;
  }
  challengeCurrentStep.value = Math.min(challengeWizardSteps.value.length, challengeCurrentStep.value + 1);
}

function goToPreviousChallengeStep() {
  challengeCurrentStep.value = Math.max(1, challengeCurrentStep.value - 1);
}

function selectChallengeWizardStep(step) {
  if (step >= challengeCurrentStep.value) return;
  challengeCurrentStep.value = step;
}

const canManageActivityAttachments = computed(() => (
  isActivityAssessment.value
));
const canPublishActivity = computed(() => {
  if (!isActivityAssessment.value) return false;
  const selectedClass = getSelectedChallengeClass();
  const submissionDeadline = buildSubmissionDeadlineIso(challengeForm.deadlineDate, challengeForm.deadlineTime);
  const activityPoints = Number(challengeForm.activityPoints);
  const resolvedSubject = String(
    selectedLinkedLesson.value?.subject
    || selectedClass?.name
    || challengeForm.subject
    || teacherSubject.value
    || ""
  ).trim();
  return Boolean(
    (String(challengeForm.linkedLesson || "").trim() || selectedClass?.id)
    && resolvedSubject
    && Number.isInteger(activityPoints)
    && activityPoints >= 1
    && activityPoints <= 100
    && String(challengeForm.challengeDescription || "").trim()
    && submissionDeadline
  );
});
const challengeAssessmentModePill = computed(() => {
  if (isGradingAssessment.value) return "Exam with grading period";
  if (isQuizAssessment.value) return "Quiz";
  return "Activity";
});
const challengeAssessmentModeClass = computed(() => (
  challengeForm.assessmentMode === "activity" ? "inactive" : "active"
));

function emitTeacherAssessmentCreated(savedAssessment) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("teacher-assessment-created", { detail: { assessment: savedAssessment } }));
    localStorage.setItem("edumatch_teacher_records_refresh", String(Date.now()));
  }
}

function resetAssessmentBuilder() {
  challengeForm.challengeTitle = "";
  challengeForm.linkedLesson = "";
  challengeForm.subjectId = "";
  challengeForm.assessmentMode = "activity";
  challengeForm.gradingPeriod = "";
  challengeForm.challengeTopic = "";
  challengeForm.challengeQuestionCount = 5;
  challengeForm.examDurationMinutes = 30;
  challengeForm.challengeExamType = "";
  challengeForm.subject = teacherSubject.value || "";
  challengeForm.challengeDifficulty = "";
  challengeForm.challengePoints = 100;
  challengeForm.activityPoints = 100;
  challengeForm.deadlineDate = "";
  challengeForm.deadlineTime = "";
  challengeForm.challengeDescription = "";
  challengeForm.activityAttachments = [];
  generatedQuestions.value = [];
  generatedDraftMeta.value = null;
  isGeneratedPreviewVisible.value = false;
  showCorrectAnswers.value = false;
  challengeCurrentStep.value = 1;
  Object.keys(challengeStepAttempted).forEach((step) => { challengeStepAttempted[step] = false; });
  if (activityAttachmentInput.value) activityAttachmentInput.value.value = "";
}

/**
 * Original: GET /teacher/challenges/ai-status -> {success, canGenerate}
 */
async function refreshAiStatus() {
  try {
    if (!authStore.token) {
      canGenerate.value = false;
      aiGenerationWarning.value = AI_CONFIG_WARNING_MESSAGE;
      return;
    }
    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/ai/status`, getAuthConfig());
    const data = response.data || {};
    canGenerate.value = Boolean(data?.success && data?.canGenerate);
    aiGenerationWarning.value = canGenerate.value
      ? ""
      : String(data?.configurationMessage || AI_CONFIG_WARNING_MESSAGE).trim() || AI_CONFIG_WARNING_MESSAGE;
  } catch {
    canGenerate.value = false;
    aiGenerationWarning.value = AI_CONFIG_WARNING_MESSAGE;
  }
}

/**
 * Original: POST /teacher/challenges/generate-assessment
 * Body: JSON payload (challengeTitle, linkedLesson, examType, topic, etc.)
 * Returns: {success, questions:[...], draftId}
 */
async function generateWithAi() {
  try {
    await refreshAiStatus();
    if (!canGenerate.value) {
      throw new Error(aiGenerationWarning.value || AI_CONFIG_WARNING_MESSAGE);
    }

    flash.value = null;
    isGenerating.value = true;

    const lessonId = String(challengeForm.linkedLesson || "").trim();
    const selectedClass = getSelectedChallengeClass();
    const subjectId = String(selectedClass?.id || "").trim();
    const title = String(challengeForm.challengeTitle || "").trim();
    const topic = String(challengeForm.challengeTopic || "").trim();
    const examType = String(challengeForm.challengeExamType || "").trim();
    const subject = String(
      selectedLinkedLesson.value?.subject
      || selectedClass?.name
      || challengeForm.subject
      || teacherSubject.value
      || ""
    ).trim();
    const difficulty = String(challengeForm.challengeDifficulty || "").trim();
    const assessmentMode = String(challengeForm.assessmentMode || "activity").trim();
    const gradingPeriod = String(challengeForm.gradingPeriod || "").trim();
    const numberOfItems = Number(challengeForm.challengeQuestionCount || 0);
    const examDurationMinutes = Number(challengeForm.examDurationMinutes || 0);
    const submissionDeadline = buildSubmissionDeadlineIso(challengeForm.deadlineDate, challengeForm.deadlineTime);

    if (
      (!lessonId && !subjectId)
      || !title
      || !topic
      || !examType
      || !difficulty
      || !subject
      || !Number.isInteger(numberOfItems)
      || numberOfItems <= 0
      || !Number.isInteger(examDurationMinutes)
      || examDurationMinutes < 1
      || examDurationMinutes > 300
      || !submissionDeadline
    ) {
      throw new Error("Please complete the lesson or class, title, topic, exam type, difficulty, number of questions, exam timer, and deadline before generating.");
    }

    if (new Date(submissionDeadline).getTime() <= Date.now()) {
      throw new Error("Deadline must be set to a future date and time.");
    }

    if (assessmentMode === "grading_assessment" && !gradingPeriod) {
      throw new Error("Select a grading period for the grading assessment.");
    }

    const payload = {
      lessonId: lessonId || undefined,
      subjectId: subjectId || undefined,
      title,
      topic,
      examType,
      subject,
      difficulty,
      assessmentMode,
      gradingPeriod,
      assignmentScope: "handled_class",
      numberOfItems,
      examDurationMinutes,
      submissionDeadline,
    };

    const response = await axios.post(`${resolveApiBaseUrl()}/teacher/assessments/ai-generate`, payload, getAuthConfig());
    const data = response.data || {};
    if (!data?.success) throw new Error(data?.message || "Failed to generate assessment.");
    const draftAssessment = data?.draftAssessment || data?.assessment || {};
    const assessmentQuestions = Array.isArray(draftAssessment?.questions) ? draftAssessment.questions : [];
    generatedQuestions.value = assessmentQuestions.map((question) => ({
      prompt: question.questionText || "",
      type: question.type || "multiple-choice",
      options: Array.isArray(question.options) ? question.options : [],
      answer: question.correctAnswer || "",
      points: Number(question.points || 1),
      explanation: question.explanation || "",
    }));
    generatedDraftMeta.value = {
      title: String(draftAssessment.title || title),
      lessonId: lessonId,
      subjectId: String(draftAssessment.subjectId || subjectId),
      examType: String(draftAssessment.examType || examType),
      subject: String(draftAssessment.subject || subject),
      subjectCategory: String(draftAssessment.subjectCategory || ""),
      difficulty: String(draftAssessment.difficulty || difficulty),
      assessmentMode: String(draftAssessment.assessmentMode || assessmentMode),
      gradingPeriod: String(draftAssessment.gradingPeriod || gradingPeriod),
      assignmentScope: String(draftAssessment.assignmentScope || "handled_class"),
      numberOfItems: Number(draftAssessment.numberOfItems || numberOfItems),
      examDurationMinutes: Number(draftAssessment.examDurationMinutes || examDurationMinutes),
      submissionDeadline: draftAssessment.submissionDeadline || submissionDeadline,
    };
    isGeneratedPreviewVisible.value = true;
    showCorrectAnswers.value = false;

    flash.value = {
      tab: "challenge",
      type: "success",
      message: data?.message || "Assessment draft generated. Review it, then click Done.",
    };

  } catch (err) {
    if (axios.isAxiosError(err)) {
      flash.value = { tab: "challenge", type: "error", message: err.response?.data?.message || err.message || "Failed to generate assessment." };
    } else {
      flash.value = { tab: "challenge", type: "error", message: err?.message || "Failed to generate assessment." };
    }
  } finally {
    isGenerating.value = false;
    await refreshAiStatus();
  }
}

const toggleViewCorrectAnswers = () => {
  showCorrectAnswers.value = !showCorrectAnswers.value;
};

async function finalizeGeneratedAssessment() {
  try {
    if (!generatedDraftMeta.value || generatedQuestions.value.length === 0) {
      throw new Error("No generated assessment draft to save.");
    }

    isSavingGeneratedAssessment.value = true;
    flash.value = null;

    const createPayload = {
      title: generatedDraftMeta.value.title,
      examType: generatedDraftMeta.value.examType,
      subject: generatedDraftMeta.value.subject || challengeForm.subject,
      subjectCategory: generatedDraftMeta.value.subjectCategory || '',
      difficulty: generatedDraftMeta.value.difficulty,
      assessmentMode: String(challengeForm.assessmentMode || generatedDraftMeta.value.assessmentMode || "activity").trim(),
      gradingPeriod: String(challengeForm.gradingPeriod || generatedDraftMeta.value.gradingPeriod || "").trim(),
      assignmentScope: String(generatedDraftMeta.value.assignmentScope || "handled_class").trim(),
      numberOfItems: generatedDraftMeta.value.numberOfItems,
      examDurationMinutes: generatedDraftMeta.value.examDurationMinutes,
      submissionDeadline: generatedDraftMeta.value.submissionDeadline,
      challengeDescription: String(challengeForm.challengeDescription || "").trim(),
      questions: generatedQuestions.value.map((question, index) => ({
        questionText: String(question.prompt || "").trim() || `Question ${index + 1}`,
        type: String(question.type || "multiple-choice").trim() || "multiple-choice",
        options: Array.isArray(question.options) ? question.options.map((opt) => String(opt || "").trim()).filter(Boolean) : [],
        correctAnswer: String(question.answer || "").trim(),
        points: Number(question.points || 1),
        explanation: String(question.explanation || "").trim(),
      })),
    };
    if (generatedDraftMeta.value.lessonId) {
      createPayload.lessonId = generatedDraftMeta.value.lessonId;
    }
    if (generatedDraftMeta.value.subjectId) {
      createPayload.subjectId = generatedDraftMeta.value.subjectId;
    }

    const response = await axios.post(`${resolveApiBaseUrl()}/teacher/assessments`, createPayload, getAuthConfig());
    const savedAssessment = response.data?.assessment || null;

    isGeneratedPreviewVisible.value = false;
    window.setTimeout(() => {
      generatedQuestions.value = [];
      generatedDraftMeta.value = null;
      showCorrectAnswers.value = false;
    }, 280);

    flash.value = {
      tab: "challenge",
      type: "success",
      message: "Assessment successfully created. It is now available in Records.",
    };

    emitTeacherAssessmentCreated(savedAssessment);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      flash.value = { tab: "challenge", type: "error", message: err.response?.data?.message || "Failed to save generated assessment." };
    } else {
      flash.value = { tab: "challenge", type: "error", message: err?.message || "Failed to save generated assessment." };
    }
  } finally {
    isSavingGeneratedAssessment.value = false;
  }
}

async function publishActivity() {
  try {
    if (!authStore.token) {
      throw new Error("You are not logged in. Please sign in again.");
    }

    const lessonId = String(challengeForm.linkedLesson || "").trim();
    const selectedClass = getSelectedChallengeClass();
    const subjectId = String(selectedClass?.id || "").trim();
    const challengeDescription = String(challengeForm.challengeDescription || "").trim();
    const title = String(challengeForm.challengeTitle || "").trim() || buildActivityTitleFromInstructions(challengeDescription);
    const subject = String(
      selectedLinkedLesson.value?.subject
      || selectedClass?.name
      || challengeForm.subject
      || teacherSubject.value
      || ""
    ).trim();
    const gradingPeriod = String(challengeForm.gradingPeriod || "").trim();
    const submissionDeadline = buildSubmissionDeadlineIso(challengeForm.deadlineDate, challengeForm.deadlineTime);
    const activityPoints = Number(challengeForm.activityPoints);
    const attachments = Array.isArray(challengeForm.activityAttachments) ? challengeForm.activityAttachments : [];

    if ((!lessonId && !subjectId) || !subject || !challengeDescription || !submissionDeadline) {
      throw new Error("Select a linked lesson or class, then complete the activity instructions and deadline before publishing.");
    }

    if (!Number.isInteger(activityPoints) || activityPoints < 1 || activityPoints > 100) {
      throw new Error("Set the activity points to a whole number from 1 to 100.");
    }

    if (new Date(submissionDeadline).getTime() <= Date.now()) {
      throw new Error("Deadline must be set to a future date and time.");
    }

    if (attachments.length > MAX_ACTIVITY_ATTACHMENT_COUNT) {
      throw new Error(`You can upload up to ${MAX_ACTIVITY_ATTACHMENT_COUNT} activity attachments only.`);
    }

    for (const attachment of attachments) {
      const validationMessage = validateActivityAttachment(attachment);
      if (validationMessage) throw new Error(validationMessage);
    }

    isPublishingActivity.value = true;
    flash.value = null;

    const formData = new FormData();
    if (lessonId) {
      formData.append("lessonId", lessonId);
    }
    if (!lessonId && subjectId) {
      formData.append("subjectId", subjectId);
    }
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("assessmentMode", "activity");
    formData.append("gradingPeriod", gradingPeriod);
    formData.append("assignmentScope", "handled_class");
    formData.append("activityPoints", String(activityPoints));
    formData.append("submissionDeadline", submissionDeadline);
    formData.append("challengeDescription", challengeDescription);
    attachments.forEach((file) => formData.append("attachments", file));

    const response = await axios.post(`${resolveApiBaseUrl()}/teacher/assessments`, formData, getAuthConfig());
    const savedAssessment = response.data?.assessment || null;

    flash.value = {
      tab: "challenge",
      type: "success",
      message: response.data?.message || "Activity successfully created. It is now available for students.",
    };

    resetAssessmentBuilder();
    emitTeacherAssessmentCreated(savedAssessment);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      flash.value = { tab: "challenge", type: "error", message: err.response?.data?.message || err.message || "Failed to publish activity." };
    } else {
      flash.value = { tab: "challenge", type: "error", message: err?.message || "Failed to publish activity." };
    }
  } finally {
    isPublishingActivity.value = false;
  }
}

function onOptionsInput(index, textValue) {
  const lines = String(textValue || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!generatedQuestions.value[index]) return;
  generatedQuestions.value[index].options = lines;
}

/** Lesson options for select */
const lessonOptions = ref([]); // [{id,title,track,strand,subject}]
async function loadLessonOptions() {
  try {
    if (!authStore.token) {
      lessonOptions.value = [];
      return;
    }
    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/lessons`, getAuthConfig());
    const lessons = uniqueBy(
      Array.isArray(response.data?.lessons) ? response.data.lessons : [],
      (lesson, index) => lesson.id || lesson._id || `${lesson.title || ""}-${lesson.createdAt || ""}-${index}`
    );
    lessonOptions.value = lessons.map((lesson, index) => ({
      id: lesson.id || lesson._id || `lesson-${index + 1}`,
      title: lesson.title,
      track: lesson.track || "",
      strand: lesson.strand || lesson.track || "",
      subject: lesson.subject || "",
      className: lesson.className || "",
      classLabel: formatClassLabel({
        name: lesson.subject || "",
        className: lesson.className || "",
        code: lesson.subjectCode || "",
      }),
    }));
  } catch (error) {
    console.error("[loadLessonOptions] failed:", error);
    lessonOptions.value = [];
  }
}

const lessonSubjectOptions = computed(() => {
  if (teacherSubject.value) return [teacherSubject.value];
  return getSubjectsForStrand("GENERAL");
});
const selectedLinkedLesson = computed(() => lessonOptions.value.find((lesson) => lesson.id === challengeForm.linkedLesson) || null);
const selectedChallengeClass = computed(() => getSelectedChallengeClass());
const selectedAssessmentStrand = computed(() => normalizeStrand(
  selectedLinkedLesson.value?.strand
  || selectedLinkedLesson.value?.track
  || selectedChallengeClass.value?.track
  || ""
));
const assessmentSubjectOptions = computed(() => {
  if (teacherSubject.value) return [teacherSubject.value];
  return getSubjectsForStrand(selectedAssessmentStrand.value);
});
const selectedAssessmentLessonSummary = computed(() => {
  if (!selectedLinkedLesson.value) {
    return "Pick a lesson first so the subject and class context stay aligned.";
  }
  const details = [
    String(selectedLinkedLesson.value?.classLabel || selectedLinkedLesson.value?.subject || "").trim(),
    String(selectedLinkedLesson.value?.track || selectedLinkedLesson.value?.strand || "").trim(),
  ].filter(Boolean);
  return details.length > 0 ? details.join(" · ") : "Lesson linked and ready for assessment setup.";
});
const assessmentModeSummaryTitle = computed(() => {
  if (isQuizAssessment.value) return "Quiz";
  if (!isGradingAssessment.value) return "Activity";
  return challengeForm.gradingPeriod
    ? `${challengeForm.gradingPeriod} Grading Exam`
    : "Exam";
});
const assessmentModeSummaryCopy = computed(() => {
  if (isQuizAssessment.value) {
    return "Visible to students as a quiz and excluded from strand recommendation scoring.";
  }
  if (!isGradingAssessment.value) {
    return "Visible to students as an activity, but excluded from strand recommendation scoring.";
  }
  return challengeForm.gradingPeriod
    ? `Published as an exam and counts toward the ${challengeForm.gradingPeriod} grading recommendation basis.`
    : "Select the grading period this exam should count toward.";
});
const assessmentScheduleSummaryTitle = computed(() => {
  if (!challengeForm.deadlineDate || !challengeForm.deadlineTime) return "Set the deadline";
  return challengeForm.deadlineDate;
});
const assessmentScheduleSummaryCopy = computed(() => {
  if (!challengeForm.deadlineDate || !challengeForm.deadlineTime) {
    return "Add a deadline date, time, and exam timer before generating.";
  }
  return `Deadline at ${challengeForm.deadlineTime} • ${Number(challengeForm.examDurationMinutes || 0)} minute timer.`;
});
const generatedDraftSummaryTitle = computed(() => {
  if (generatedQuestions.value.length > 0 && isGeneratedPreviewVisible.value) {
    return `${generatedQuestions.value.length} Draft Question${generatedQuestions.value.length === 1 ? "" : "s"}`;
  }
  return "No Draft Yet";
});
const generatedDraftSummaryCopy = computed(() => {
  if (generatedQuestions.value.length > 0 && isGeneratedPreviewVisible.value) {
    return "Review the prompts, answer choices, and answer key before publishing.";
  }
  return "Complete the form, then generate a draft you can edit before saving.";
});

/** Utilities */

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const getScrollableAncestors = (element) => {
  const containers = [];
  let parent = element?.parentElement || null;
  while (parent && parent !== document.body) {
    const styles = window.getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(styles.overflowY) && parent.scrollHeight > parent.clientHeight) containers.push(parent);
    parent = parent.parentElement;
  }
  const root = document.scrollingElement || document.documentElement;
  if (root) containers.push(root);
  return containers;
};
const smoothScrollIntoView = async (element) => {
  if (!element) return;
  const containers = getScrollableAncestors(element);
  containers.forEach((container) => {
    const targetRect = element.getBoundingClientRect();
    const containerRect = container === document.scrollingElement || container === document.documentElement
      ? { top: 0, height: window.innerHeight, bottom: window.innerHeight }
      : container.getBoundingClientRect();
    const above = targetRect.top < containerRect.top + 16;
    const below = targetRect.bottom > containerRect.bottom - 16;
    if (!above && !below) return;
    const currentTop = container === document.scrollingElement || container === document.documentElement ? window.scrollY : container.scrollTop;
    const desiredTop = currentTop + (targetRect.top - containerRect.top) - ((containerRect.height - targetRect.height) / 2);
    const safeTop = Math.max(0, desiredTop);
    if (container === document.scrollingElement || container === document.documentElement) window.scrollTo({ top: safeTop, behavior: "smooth" });
    else container.scrollTo({ top: safeTop, behavior: "smooth" });
  });
  element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  await wait(320);
};
const getProgressStorageKey = () => {
  const authUser = authStore.user || {};
  const identifier = String(authUser._id || authUser.id || authUser.email || authUser.username || "teacher").trim().toLowerCase();
  return `${TOUR_PROGRESS_PREFIX}${identifier || "teacher"}`;
};
const readTourProgress = () => {
  try {
    const raw = localStorage.getItem(getProgressStorageKey());
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
};
const writeTourProgress = (progress) => {
  try { localStorage.setItem(getProgressStorageKey(), JSON.stringify(progress)); } catch (_error) {}
};
const clearTourProgress = () => {
  try { localStorage.removeItem(getProgressStorageKey()); } catch (_error) {}
};
const hasSeenTour = () => authStore.user?.hasCompletedTeacherTour === true;
const persistTeacherTourPreference = async (hasCompletedTeacherTour = true) => {
  if (!authStore.token) return;
  try {
    await axios.patch(`${resolveApiBaseUrl()}/teacher/tour-preference`, { hasCompletedTeacherTour }, getAuthConfig());
  } catch (error) {
    console.error("[persistTeacherTourPreference] failed:", error);
  }
};
const ensureStepContext = async (step) => {
  if (!step) return;
  if (step.tab) selectedTab.value = step.tab;
  await nextTick();
  await wait(60);
};
const activeTourStep = computed(() => tourSteps[tourStepIndex.value] || null);
const isLastTourStep = computed(() => tourStepIndex.value >= tourSteps.length - 1);
const updateTourPlacement = () => {
  if (!isTourActive.value) return;
  const target = activeTourStep.value?.selector ? document.querySelector(activeTourStep.value.selector) : null;
  const desktopSidebarVisible = window.innerWidth > SIDEBAR_BREAKPOINT;
  const safeViewportLeft = desktopSidebarVisible ? SIDEBAR_WIDTH + 20 : 12;
  const viewportRightPadding = 12;
  const viewportBottomPadding = 12;
  const viewportTopPadding = (() => {
    const header = document.querySelector(".top-header");
    if (!header) return 12;
    return Math.max(12, Math.round(header.getBoundingClientRect().bottom + 8));
  })();
  const minTooltipWidth = 280;
  const maxTooltipWidth = 400;
  const availableWidth = Math.max(minTooltipWidth, window.innerWidth - safeViewportLeft - viewportRightPadding);
  if (!target) {
    tourTargetRect.value = null;
    tourTooltipStyle.value = { width: `${Math.min(maxTooltipWidth, availableWidth)}px`, left: `${safeViewportLeft}px`, top: "50%", transform: "translateY(-50%)" };
    return;
  }
  const rect = target.getBoundingClientRect();
  const padding = 10;
  const minTargetLeft = target.closest(".teacher-sidebar") ? 8 : safeViewportLeft;
  const paddedRect = {
    top: clamp(rect.top - padding, viewportTopPadding, window.innerHeight - viewportBottomPadding),
    left: clamp(rect.left - padding, minTargetLeft, window.innerWidth - viewportRightPadding),
    width: clamp(rect.width + padding * 2, 0, window.innerWidth - minTargetLeft - viewportRightPadding),
    height: clamp(rect.height + padding * 2, 0, window.innerHeight - viewportTopPadding - viewportBottomPadding)
  };
  tourTargetRect.value = paddedRect;
  const tooltipElement = document.querySelector(".teacher-page-tour-tooltip");
  const tooltipWidth = Math.min(maxTooltipWidth, availableWidth);
  const estimatedTooltipHeight = Math.max(220, Number(tooltipElement?.offsetHeight || 0) || 260);
  let tooltipTop = paddedRect.top + paddedRect.height + 16;
  if (tooltipTop + estimatedTooltipHeight > window.innerHeight - viewportBottomPadding) tooltipTop = paddedRect.top - estimatedTooltipHeight - 16;
  tooltipTop = clamp(tooltipTop, viewportTopPadding, Math.max(viewportTopPadding, window.innerHeight - estimatedTooltipHeight - viewportBottomPadding));
  let tooltipLeft = paddedRect.left + (paddedRect.width / 2) - (tooltipWidth / 2);
  tooltipLeft = clamp(tooltipLeft, safeViewportLeft, Math.max(safeViewportLeft, window.innerWidth - tooltipWidth - viewportRightPadding));
  tourTooltipStyle.value = { width: `${tooltipWidth}px`, left: `${tooltipLeft}px`, top: `${tooltipTop}px`, transform: "none" };
};
const tourSpotlightStyle = computed(() => {
  if (!tourTargetRect.value) return null;
  return { top: `${tourTargetRect.value.top}px`, left: `${tourTargetRect.value.left}px`, width: `${tourTargetRect.value.width}px`, height: `${tourTargetRect.value.height}px` };
});
const renderCurrentTourStep = async () => {
  await ensureStepContext(activeTourStep.value);
  const target = activeTourStep.value?.selector ? document.querySelector(activeTourStep.value.selector) : null;
  if (target) await smoothScrollIntoView(target);
  updateTourPlacement();
};
const closeTour = ({ markSeen = true } = {}) => {
  isTourActive.value = false;
  tourTargetRect.value = null;
  tourTooltipStyle.value = {};
  if (markSeen) {
    authStore.setUser({ hasCompletedTeacherTour: true });
    clearTourProgress();
    persistTeacherTourPreference(true);
  }
};
const startTour = async ({ force = false } = {}) => {
  if (!force && hasSeenTour()) return;
  isTourActive.value = true;
  tourStepIndex.value = 0;
  await nextTick();
  await renderCurrentTourStep();
};
const launchManualTour = async () => {
  clearTourProgress();
  if (CURRENT_PAGE_ROUTE !== TOUR_ROUTE_ORDER[0]) {
    writeTourProgress({ active: true, step: 0, updatedAt: Date.now() });
    await router.push(TOUR_ROUTE_ORDER[0]);
    return;
  }
  await startTour({ force: true });
};
const goToNextTourStep = async () => {
  if (isLastTourStep.value) {
    const routeIndex = TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE);
    const nextRoute = routeIndex >= 0 ? TOUR_ROUTE_ORDER[routeIndex + 1] : null;
    if (nextRoute) {
      writeTourProgress({ active: true, step: 0, updatedAt: Date.now() });
      closeTour({ markSeen: false });
      await router.push(nextRoute);
      return;
    }
    return closeTour({ markSeen: true });
  }
  tourStepIndex.value += 1;
  writeTourProgress({ active: true, step: tourStepIndex.value, updatedAt: Date.now() });
  await renderCurrentTourStep();
};
const goToPreviousTourStep = async () => {
  if (tourStepIndex.value === 0) {
    const routeIndex = TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE);
    const previousRoute = routeIndex > 0 ? TOUR_ROUTE_ORDER[routeIndex - 1] : null;
    if (previousRoute) {
      writeTourProgress({ active: true, step: "last", updatedAt: Date.now() });
      closeTour({ markSeen: false });
      await router.push(previousRoute);
    }
    return;
  }
  tourStepIndex.value -= 1;
  writeTourProgress({ active: true, step: tourStepIndex.value, updatedAt: Date.now() });
  await renderCurrentTourStep();
};
const skipTour = () => { closeTour({ markSeen: true }); };
const maybeAutoStartTour = async () => {
  if (hasAttemptedAutoTour.value) return;
  hasAttemptedAutoTour.value = true;
  const progress = readTourProgress();
  if (progress?.active) {
    const resolvedStep = progress.step === "last" ? tourSteps.length - 1 : Number(progress.step || 0);
    isTourActive.value = true;
    tourStepIndex.value = clamp(resolvedStep, 0, Math.max(0, tourSteps.length - 1));
    await nextTick();
    await renderCurrentTourStep();
    return;
  }
  if (hasSeenTour()) return;
  if (CURRENT_PAGE_ROUTE !== TOUR_ROUTE_ORDER[0]) return;
  await wait(420);
  await startTour();
};
const handleTourViewportChange = () => {
  if (!isTourActive.value) return;
  updateTourPlacement();
};

watch(
  () => route.query.tab,
  (tab) => {
    const normalizedTab = normalizeActivitiesTab(tab);
    if (selectedTab.value !== normalizedTab) {
      selectedTab.value = normalizedTab;
    }
  },
  { immediate: true }
);

watch(
  () => selectedTab.value,
  (tab) => {
    if (!isActivitiesRouteActive.value) return;
    const normalizedTab = normalizeActivitiesTab(tab);
    const currentTab = normalizeActivitiesTab(route.query.tab);
    const hasExplicitTab = Object.prototype.hasOwnProperty.call(route.query, "tab");
    if (normalizedTab === currentTab && !(normalizedTab === "lesson" && hasExplicitTab)) return;

    const nextQuery = { ...route.query };
    if (normalizedTab === "lesson") {
      delete nextQuery.tab;
    } else {
      nextQuery.tab = normalizedTab;
    }

    router.replace({ path: "/teacher/activities", query: nextQuery }).catch(() => {});
  }
);

watch(
  () => isSidebarOpen.value,
  () => {
    syncMobileMenuBodyState();
  }
);

watch(
  () => lessonForm.subjectId,
  () => {
    const selectedClass = teacherClasses.value.find((item) => item.id === lessonForm.subjectId) || null;
    if (!teacherSubject.value && selectedClass?.name) {
      lessonForm.subject = selectedClass.name;
    }
  }
);

watch(
  () => challengeForm.linkedLesson,
  () => {
    const allowedSubjects = assessmentSubjectOptions.value;
    if (!allowedSubjects.includes(challengeForm.subject)) {
      challengeForm.subject = selectedLinkedLesson.value?.subject && allowedSubjects.includes(selectedLinkedLesson.value.subject)
        ? selectedLinkedLesson.value.subject
        : selectedChallengeClass.value?.name && allowedSubjects.includes(selectedChallengeClass.value.name)
          ? selectedChallengeClass.value.name
          : teacherSubject.value || "";
    }
    if (!String(challengeForm.linkedLesson || "").trim()) {
      isActivityDropActive.value = false;
    }
  }
);

watch(
  () => challengeForm.subjectId,
  () => {
    if (String(challengeForm.linkedLesson || "").trim()) return;
    const selectedClass = selectedChallengeClass.value;
    if (selectedClass?.name) {
      challengeForm.subject = selectedClass.name;
      return;
    }
    challengeForm.subject = teacherSubject.value || "";
  }
);

watch(
  () => challengeForm.assessmentMode,
  (value) => {
    if (value !== "grading_assessment") {
      challengeForm.gradingPeriod = "";
    }
    if (value !== "activity" && challengeCurrentStep.value > 1 && !String(challengeForm.challengeTitle || "").trim()) {
      challengeStepAttempted[1] = true;
      challengeCurrentStep.value = 1;
      focusFirstInvalidField({ challengeTitle: "Enter an assessment title." });
    }
  }
);

/** Init */
onMounted(async () => {
  document.addEventListener("click", handleAccountMenuClickOutside);
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("resize", handleTourViewportChange);
  window.addEventListener("scroll", handleTourViewportChange, true);
  window.addEventListener("resize", syncMobileMenuBodyState);

  const authUser = authStore.user || {};
  user.value.name = authUser.name || authUser.username || "Teacher";
  user.value.displayName = authUser.name || authUser.displayName || authUser.username || "Teacher";
  user.value.subject = authUser.subject || authUser.profile?.subject || "";
  user.value.strand = authUser.strand || authUser.profile?.strand || "";
  user.value.status = authUser.status || "Online";
  user.value.email = authUser.email || "";
  lessonForm.subject = teacherSubject.value || "";
  challengeForm.subject = teacherSubject.value || "";

  await refreshAiStatus();
  await loadClassOptions();
  await loadLessonOptions();
  await maybeAutoStartTour();
  syncMobileMenuBodyState();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleAccountMenuClickOutside);
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("resize", handleTourViewportChange);
  window.removeEventListener("scroll", handleTourViewportChange, true);
  window.removeEventListener("resize", syncMobileMenuBodyState);
  closeTour({ markSeen: false });
  document.body.classList.remove("teacher-mobile-menu-open");
});
</script>

<style scoped>
.teacher-page-tour-layer {
  position: fixed;
  inset: 0;
  z-index: 12000;
  pointer-events: none;
}

.teacher-page-tour-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.58);
}

.teacher-page-tour-spotlight {
  position: fixed;
  z-index: 12001;
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.58);
  border: 2px solid rgba(255, 255, 255, 0.95);
}

.teacher-page-tour-tooltip {
  position: fixed;
  z-index: 12002;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.22);
  padding: 1rem 1.1rem;
  pointer-events: auto;
}

.teacher-page-tour-step {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.teacher-page-tour-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.55rem;
  justify-content: flex-end;
}

.teacher-page-tour-btn {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  min-height: 36px;
  padding: 0.45rem 0.92rem;
  cursor: pointer;
}

.teacher-page-tour-btn-ghost { background: #ffffff; color: #334155; }
.teacher-page-tour-btn-primary { border-color: #0f172a; background: #0f172a; color: #ffffff; }

.header-tour-btn {
  cursor: pointer;
  background: #ffffff;
  color: #334155;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbe2ea;
}

.ai-config-warning {
  margin: 0;
  color: #b91c1c;
  font-size: 0.92rem;
  font-weight: 600;
}
/* ✅ These styles are your <style> block converted to SFC.
   If teacher.css already holds variables and base styles, keep it global. */

.assessment-mode-hint {
  padding: 0.95rem 1rem;
  border: 1px solid #c7d2fe;
  border-radius: 14px;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  color: #334155;
  line-height: 1.5;
}

.assessment-mode-hint strong {
  color: #312e81;
}

.builder-workspace {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.builder-main,
.builder-card,
.builder-panel {
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.builder-main {
  border: 1px solid var(--border-color);
  padding: 0.75rem;
}

.builder-main {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  overflow: visible;
}

.builder-panel {
  box-shadow: none;
  border: 1px solid var(--border-color);
  padding: 0.85rem;
}

.panel-header {
  margin-bottom: 0.65rem;
}

.panel-header h2 {
  margin: 0 0 0.2rem;
  font-size: 1.15rem;
}

.panel-header p {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.4;
}

.panel-header-modern {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.panel-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5b9b3c;
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  border: 1px solid #b9dca7;
  background: #eef8e9;
  color: #4f8f2f;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.builder-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.builder-form-assessment {
  gap: 0.65rem;
}

.lesson-form-modern {
  gap: 0.65rem;
}

.lesson-form-section {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: #ffffff;
  padding: 0.7rem;
}

.lesson-form-section-head {
  margin-bottom: 0.55rem;
}

.lesson-form-section-head h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.lesson-form-section-head p {
  margin: 0.22rem 0 0;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.lesson-form-modern .lesson-form-section .form-grid,
.builder-form-assessment .wizard-step-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-section-break {
  grid-column: 1 / -1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #d3e7c8;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf4 100%);
}

.form-section-break h3 {
  margin: 0.1rem 0 0.18rem;
  color: #0f172a;
  font-size: 1rem;
}

.form-section-break p {
  margin: 0;
  color: #475569;
  font-size: 0.77rem;
  line-height: 1.35;
}

.builder-section-step {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #4f8f2f;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.section-state-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.section-state-pill.active {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.section-state-pill.inactive {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #dbe2ea;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.required-indicator {
  color: #dc2626;
}

.form-group input,
.form-group select,
.form-group textarea {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-color);
  color: var(--text-primary);
  padding: 0.62rem 0.72rem;
  font: inherit;
  transition: border-color var(--transition-speed) var(--transition-easing),
    box-shadow var(--transition-speed) var(--transition-easing);
}

.form-group textarea {
  resize: vertical;
  min-height: 90px;
}

.lesson-upload-box {
  border: 1px dashed #9bc783;
  background: #f7fbf4;
  border-radius: var(--radius-md);
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.lesson-upload-box.is-dragging {
  border-color: #69aa47;
  background: #eef8e9;
  box-shadow: 0 0 0 3px rgba(105, 170, 71, 0.15);
}

.lesson-upload-input {
  display: none;
}

.lesson-upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.lesson-upload-content i {
  color: #69aa47;
  font-size: 1.6rem;
}

.lesson-upload-content h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.94rem;
}

.lesson-upload-content p {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.8rem;
}

.helper-copy {
  margin: 0 0 0.65rem;
  color: var(--text-tertiary);
  font-size: 0.82rem;
}

.attachment-list {
  display: grid;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--background-color);
}

.attachment-item-removable {
  gap: 0.85rem;
}

.attachment-copy {
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.attachment-name {
  color: var(--text-primary);
  font-size: 0.83rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-meta {
  color: var(--text-tertiary);
  font-size: 0.72rem;
  white-space: nowrap;
}

.attachment-remove-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  border-radius: 999px;
  min-height: 32px;
  padding: 0.35rem 0.75rem;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.attachment-remove-btn:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  padding-top: 0.6rem;
}

.builder-form-assessment .form-actions {
  justify-content: space-between;
  flex-wrap: wrap;
}

.lesson-actions {
  justify-content: space-between;
  flex-wrap: wrap;
}

.builder-card {
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.builder-card h3 {
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.builder-card p {
  margin-bottom: var(--spacing-sm);
  font-size: 0.9rem;
}

.btn-sm {
  padding: 0.42rem 0.72rem;
  font-size: 0.76rem;
}

.lessons-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--background-color);
}

.lessons-table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.lessons-table th,
.lessons-table td {
  padding: 0.7rem;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
  vertical-align: top;
}

.lessons-table th {
  background: var(--primary-lighter);
  color: var(--primary-color);
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.lessons-table tbody tr:last-child td {
  border-bottom: 0;
}

.row-type-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #1f2937;
  margin-bottom: 0.35rem;
}

.row-subtext {
  display: block;
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.lessons-empty {
  margin: 0;
  padding: 0.7rem 0.25rem 0.1rem;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.pdf-modal {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(17, 17, 17, 0.6);
  z-index: 1200;
  padding: 1rem;
}

.pdf-modal.open {
  display: flex;
}

.pdf-modal-dialog {
  width: min(980px, 100%);
  height: min(88vh, 860px);
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pdf-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.pdf-modal-header h4 {
  margin: 0;
  font-size: 0.92rem;
}

.pdf-viewer {
  border: 0;
  width: 100%;
  flex: 1;
  background: #f9fafb;
}

.draft-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.draft-empty-state {
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  padding: 1.25rem 1rem;
  display: grid;
  gap: 0.55rem;
  justify-items: flex-start;
}

.draft-empty-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
}

.draft-empty-state h4 {
  margin: 0;
  color: #0f172a;
  font-size: 0.96rem;
}

.draft-empty-state p {
  margin: 0;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.5;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.draft-count-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0c4a6e;
  font-size: 0.76rem;
  font-weight: 700;
}

.draft-item {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.8rem;
  background: var(--background-color);
}

.draft-item-empty {
  width: 100%;
  background: transparent;
  border: 0;
  padding: 0;
}

.draft-item h4 {
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.draft-empty-message {
  margin: 0;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.5;
}

.draft-item span {
  color: var(--text-tertiary);
  font-size: 0.78rem;
}

.draft-item-empty span {
  display: none;
}

.answer-highlight input {
  border-color: #16a34a;
  background: #f0fdf4;
}

.answer-key-panel {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  border-radius: var(--radius-md);
  padding: 0.75rem 0.85rem;
}

.answer-key-panel h4 {
  margin: 0 0 0.4rem;
  color: #166534;
}

.answer-key-panel ol {
  margin: 0;
  padding-left: 1.1rem;
  color: #14532d;
  font-size: 0.84rem;
  display: grid;
  gap: 0.2rem;
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.builder-footer-note {
  background: var(--surface-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  padding: var(--spacing-md);
  font-size: 0.9rem;
}

.flash-banner {
  border: 1px solid var(--border-color);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  padding: 0.75rem 0.9rem;
  font-size: 0.9rem;
  margin-bottom: var(--spacing-sm);
}

.flash-banner.success {
  background: #f3f4f6;
  border-left-color: var(--success-color);
  color: #1f2937;
}

.flash-banner.error {
  background: #f3f4f6;
  border-left-color: var(--danger-color);
  color: #4b5563;
}

/* Accessible multi-step builders */
.wizard-form {
  overflow: hidden;
}

.wizard-progress {
  position: relative;
  padding: 0.25rem 0.35rem 0.55rem;
}

.wizard-progress ol {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(var(--wizard-columns, 4), minmax(0, 1fr));
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lesson-form-modern .wizard-progress ol {
  --wizard-columns: 3;
}

.wizard-progress-track {
  position: absolute;
  top: 1.2rem;
  left: calc(12.5% + 0.35rem);
  right: calc(12.5% + 0.35rem);
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.lesson-form-modern .wizard-progress-track {
  left: calc(16.666% + 0.35rem);
  right: calc(16.666% + 0.35rem);
}

.wizard-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #69aa47, #9acb63);
  transition: width 0.35s ease;
}

.wizard-step-button {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #64748b;
  font: inherit;
  text-align: center;
  cursor: pointer;
}

.wizard-step-button:disabled {
  cursor: not-allowed;
  opacity: 1;
}

.wizard-step-marker {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  background: #ffffff;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: 0 0 0 4px #ffffff;
  transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, color 0.22s ease;
}

.wizard-progress li.active .wizard-step-marker,
.wizard-progress li.completed .wizard-step-marker {
  border-color: #69aa47;
  background: #69aa47;
  color: #ffffff;
}

.wizard-progress li.active .wizard-step-marker {
  transform: scale(1.08);
  box-shadow: 0 0 0 4px #dcfce7;
}

.wizard-step-copy {
  display: grid;
  gap: 0.05rem;
}

.wizard-step-copy strong {
  color: #334155;
  font-size: 0.73rem;
}

.wizard-progress li.active .wizard-step-copy strong,
.wizard-progress li.completed .wizard-step-copy strong {
  color: #4f8f2f;
}

.builder-main .btn-primary {
  border-color: #69aa47 !important;
  background: #69aa47 !important;
  background-image: none !important;
  color: #ffffff !important;
}

.builder-main .btn-primary:hover:not(:disabled) {
  border-color: #5b9b3c !important;
  background: #5b9b3c !important;
  transform: translateY(-1px);
}

.builder-main .btn-primary:disabled {
  border-color: #b7d3a8 !important;
  background: #b7d3a8 !important;
  color: #ffffff !important;
}

.wizard-step-copy small {
  color: #94a3b8;
  font-size: 0.62rem;
}

.wizard-step-panel,
.wizard-step-grid {
  min-width: 0;
}

.wizard-step-panel {
  display: grid;
  gap: 0.65rem;
}

.wizard-step-grid {
  align-items: start;
}

.wizard-slide-enter-active,
.wizard-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.wizard-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.wizard-slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

.field-error {
  margin: 0.1rem 0 0;
  color: #b91c1c;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.4;
}

.form-group.has-error input,
.form-group.has-error select,
.form-group.has-error textarea,
.form-group input[aria-invalid="true"],
.form-group select[aria-invalid="true"],
.form-group textarea[aria-invalid="true"],
.lesson-upload-box.has-error {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.wizard-error-summary {
  padding: 0.8rem 0.9rem;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8rem;
}

.wizard-error-summary ul {
  margin: 0.35rem 0 0;
  padding-left: 1.15rem;
}

.wizard-review-card {
  padding: 0.75rem;
  border: 1px solid #bbf7d0;
  border-radius: 14px;
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
}

.wizard-review-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  margin: 0;
}

.wizard-review-card dl > div {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
  padding: 0.55rem;
  border: 1px solid #dcfce7;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.85);
}

.wizard-review-card dt {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.wizard-review-card dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #14532d;
  font-size: 0.88rem;
  font-weight: 700;
}

.wizard-ready-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
}

.wizard-actions {
  min-height: 44px;
}

.wizard-actions .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 120px;
}

.wizard-actions .btn:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  box-shadow: none;
}

.wizard-action-spacer {
  flex: 1;
}

@media (prefers-reduced-motion: reduce) {
  .wizard-progress-track span,
  .wizard-step-marker,
  .wizard-slide-enter-active,
  .wizard-slide-leave-active {
    transition: none;
  }
}

/* Mobile layout */
@media (max-width: 768px) {
  .builder-main {
    padding: 0.45rem;
  }

  .builder-panel {
    padding: 0.7rem;
  }

  .lessons-table {
    min-width: 620px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .lesson-form-modern .lesson-form-section .form-grid,
  .builder-form-assessment .wizard-step-grid {
    grid-template-columns: 1fr;
  }

  .lesson-form-section {
    padding: 0.8rem;
  }

  .form-section-break,
  .preview-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-badge,
  .section-state-pill {
    white-space: normal;
  }

  .form-actions {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }

  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .wizard-progress {
    overflow: visible;
    padding-inline: 0;
  }

  .wizard-progress ol {
    min-width: 0;
    gap: 0.2rem;
  }

  .lesson-form-modern .wizard-progress ol {
    min-width: 0;
  }

  .wizard-progress-track {
    left: calc(12.5% + 0.2rem);
    right: calc(12.5% + 0.2rem);
  }

  .lesson-form-modern .wizard-progress-track {
    left: calc(16.666% + 0.2rem);
    right: calc(16.666% + 0.2rem);
  }

  .wizard-step-marker {
    width: 28px;
    height: 28px;
  }

  .wizard-step-copy strong {
    font-size: 0.68rem;
  }

  .wizard-step-copy small {
    display: none;
  }

  .wizard-actions {
    flex-flow: row wrap;
  }

  .wizard-actions .btn {
    width: auto;
    flex: 1 1 120px;
  }

  .wizard-review-card dl {
    grid-template-columns: 1fr;
  }

  .wizard-action-spacer {
    display: none;
  }
}

</style>




