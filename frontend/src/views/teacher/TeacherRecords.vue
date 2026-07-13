<template>
  <div class="teacher-dashboard">
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
        <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
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

    <main class="teacher-main">
      <header class="top-header" data-tour="records-header">
        <div class="header-content">
          <div class="header-left">
            <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar">
              <i class="fas fa-bars"></i>
            </button>
            <div>
              <h1>Records</h1>
              <p class="header-subtitle">Review assessment submissions, scores, completion rates, and performance trends in one records view.</p>
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
      <div class="records-grid">
        <section
          v-show="activeRecordsTab === 'lessons'"
          id="teacherRecordsLessonsPanel"
          class="section-card animated-card records-section"
          data-tour="records-lessons-table"
        >
          <div class="section-header">
            <div class="records-section-heading">
              <h3 class="section-title">Lessons</h3>
              <p class="section-subtitle">Your uploaded lesson materials in a cleaner, classwork-style archive.</p>
            </div>
          </div>

          <div class="records-feed-wrap">
            <div v-if="isLoading" class="table-state">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading lesson records...</span>
            </div>

            <div v-else-if="filteredLessons.length === 0" class="table-state">
              <i class="fas fa-book-open"></i>
              <span>No lessons yet.</span>
            </div>

            <div v-else class="records-feed records-feed-lessons">
              <article v-for="lesson in paginatedLessons" :key="lesson.id" class="record-card">
                <header class="record-card-header">
                  <div class="record-card-title">
                    <span class="record-type-label">Lesson Material</span>
                    <h4>{{ lesson.title }}</h4>
                  </div>
                  <div class="record-card-date-group">
                    <span class="record-date-label">Published</span>
                    <span class="record-card-date">{{ formatDate(lesson.createdAt) }}</span>
                  </div>
                </header>

                <div class="record-chip-row">
                  <span class="record-chip chip-subject">{{ lesson.subject || 'N/A' }}</span>
                  <span class="record-chip chip-neutral">
                    {{ Array.isArray(lesson.attachments) && lesson.attachments.length > 0 ? `${lesson.attachments.length} attachment${lesson.attachments.length > 1 ? 's' : ''}` : '1 file' }}
                  </span>
                </div>

                <div class="record-card-body">
                  <template v-if="Array.isArray(lesson.attachments) && lesson.attachments.length > 0">
                    <div v-for="attachment in lesson.attachments" :key="attachment.id" class="attachment-row">
                      <div class="attachment-icon" aria-hidden="true">
                        <i class="fas fa-file-alt"></i>
                      </div>
                      <div class="attachment-info">
                        <span class="file-name">{{ attachment.fileName || 'Attachment' }}</span>
                        <span class="file-type">{{ attachment.fileType || 'application/octet-stream' }}</span>
                      </div>
                      <div class="attachment-actions">
                        <button
                          v-if="attachment.downloadUrl"
                          type="button"
                          class="record-link record-link-button"
                          data-tour="records-download-action"
                          @click="downloadAttachment(attachment)"
                        >
                          Download
                        </button>
                        <a
                          v-if="attachment.canPreviewInline && attachment.url"
                          class="record-link"
                          :href="attachment.url"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Preview
                        </a>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="attachment-row">
                      <div class="attachment-icon" aria-hidden="true">
                        <i class="fas fa-file-pdf"></i>
                      </div>
                      <div class="attachment-info">
                        <span class="file-name">{{ lesson.pdfOriginalName || 'PDF File' }}</span>
                        <span class="file-type">Lesson attachment</span>
                      </div>
                      <div class="attachment-actions">
                        <button
                          v-if="lesson.id"
                          type="button"
                          class="record-link record-link-button"
                          data-tour="records-download-action"
                          @click="downloadLesson(lesson)"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </template>
                </div>
              </article>
            </div>

            <div v-if="filteredLessons.length > pageSize" class="records-pagination">
              <p class="records-pagination-copy">{{ getPaginationSummary(lessonPage, pageSize, filteredLessons.length) }}</p>
              <div class="records-pagination-actions">
                <button
                  type="button"
                  class="pagination-btn"
                  :disabled="lessonPage === 1"
                  @click="changeLessonPage(-1)"
                >
                  Previous
                </button>
                <span class="records-page-indicator">Page {{ lessonPage }} of {{ lessonTotalPages }}</span>
                <button
                  type="button"
                  class="pagination-btn"
                  :disabled="lessonPage >= lessonTotalPages"
                  @click="changeLessonPage(1)"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          v-show="activeRecordsTab === 'assessments'"
          id="teacherRecordsAssessmentsPanel"
          class="section-card animated-card records-section"
          data-tour="records-assessments-table"
        >
          <div class="section-header">
            <div class="records-section-heading">
              <h3 class="section-title">Activities / Exams</h3>
              <p class="section-subtitle">Assessment history with clearer scoring, deadlines, and submission details.</p>
            </div>
          </div>

          <div class="records-feed-wrap">
            <div v-if="isLoading" class="table-state">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading assessment records...</span>
            </div>

            <div v-else-if="filteredAssessments.length === 0" class="table-state">
              <i class="fas fa-tasks"></i>
              <span>No assessments yet.</span>
            </div>

            <div v-else class="records-feed records-feed-assessments">
              <article v-for="assessment in paginatedAssessments" :key="assessment.id" class="record-card">
                <header class="record-card-header">
                  <div class="record-card-title">
                    <span class="record-type-label">Assessment Record</span>
                    <h4>{{ assessment.title }}</h4>
                    <p>{{ assessment.lessonTitle || 'Unlinked lesson' }}</p>
                  </div>
                  <div class="record-card-date-group">
                    <span class="record-date-label">Created</span>
                    <span class="record-card-date">{{ formatDate(assessment.createdAt) }}</span>
                  </div>
                </header>

                <div class="record-chip-row">
                  <span class="record-chip chip-subject">{{ assessment.subject || 'N/A' }}</span>
                  <span class="record-chip chip-neutral">{{ assessment.assessmentMode === 'grading_assessment' ? 'Exam' : assessment.assessmentMode === 'quiz' ? 'Quiz' : 'Activity' }}</span>
                  <span v-if="assessment.gradingPeriod" class="record-chip chip-neutral">{{ assessment.gradingPeriod }} Grading</span>
                  <span v-if="assessment.countsTowardRecommendation" class="record-chip chip-success">Recommendation Basis</span>
                  <span class="record-chip chip-type">{{ assessment.examType || 'Assessment' }}</span>
                  <span class="difficulty-pill" :class="`difficulty-${String(assessment.difficulty || '').toLowerCase()}`">
                    {{ formatLabel(assessment.difficulty || 'Medium') }}
                  </span>
                </div>

                <div class="assessment-meta-grid">
                  <div class="meta-item">
                    <div class="meta-item-icon">
                      <i class="fas fa-list-ol"></i>
                    </div>
                    <span>Items</span>
                    <strong>{{ assessment.numberOfItems }}</strong>
                  </div>
                  <div class="meta-item">
                    <div class="meta-item-icon">
                      <i class="fas fa-calendar-alt"></i>
                    </div>
                    <span>Deadline</span>
                    <strong>{{ assessment.submissionDeadline ? formatDateTime(assessment.submissionDeadline) : 'No deadline' }}</strong>
                  </div>
                  <div class="meta-item">
                    <div class="meta-item-icon">
                      <i class="fas fa-user-check"></i>
                    </div>
                    <span>Submissions</span>
                    <strong>{{ assessment.submissionsCount }}</strong>
                  </div>
                </div>

                <div class="assessment-results-block">
                  <div class="assessment-results-header">
                    <div class="assessment-results-title">
                      <span>{{ getAssessmentResultsSectionTitle(assessment) }}</span>
                      <p>{{ getAssessmentResultsSectionCopy(assessment) }}</p>
                    </div>
                    <strong class="assessment-results-count">{{ getAssessmentResultsCountLabel(assessment) }}</strong>
                  </div>

                  <div v-if="getAssessmentResults(assessment.id).length === 0" class="inline-empty-state">
                    <div class="inline-empty-icon">
                      <i class="fas fa-clipboard-list"></i>
                    </div>
                    <div class="inline-empty-copy">
                      <strong>No submitted results yet.</strong>
                      <span>{{ isActivityAssessment(assessment) ? 'Completed activity work will appear here once students turn in their responses.' : 'Results will appear here once students complete this assessment.' }}</span>
                    </div>
                  </div>

                  <template v-else>
                    <div v-if="isActivityAssessment(assessment)" class="assessment-results-summary">
                      <div class="results-summary-item">
                        <span>With Response</span>
                        <strong>{{ getAssessmentResultSummary(assessment.id).withResponseCount }}</strong>
                      </div>
                      <div class="results-summary-item">
                        <span>Teacher Graded</span>
                        <strong>{{ getAssessmentResultSummary(assessment.id).gradedCount }}</strong>
                      </div>
                      <div class="results-summary-item">
                        <span>With Files</span>
                        <strong>{{ getAssessmentResultSummary(assessment.id).withFilesCount }}</strong>
                      </div>
                      <div class="results-summary-item">
                        <span>Latest Submission</span>
                        <strong>{{ formatDateTime(getAssessmentResultSummary(assessment.id).latestSubmissionAt) }}</strong>
                      </div>
                    </div>
                    <div v-else class="assessment-results-summary">
                      <div class="results-summary-item">
                        <span>Average</span>
                        <strong>{{ getAssessmentResultSummary(assessment.id).averagePercentage }}%</strong>
                      </div>
                      <div class="results-summary-item">
                        <span>Pass Rate</span>
                        <strong>{{ getAssessmentResultSummary(assessment.id).passRate }}%</strong>
                      </div>
                      <div class="results-summary-item">
                        <span>Top Score</span>
                        <strong>{{ getAssessmentResultSummary(assessment.id).topScoreLabel }}</strong>
                      </div>
                      <div class="results-summary-item">
                        <span>Latest Submission</span>
                        <strong>{{ formatDateTime(getAssessmentResultSummary(assessment.id).latestSubmissionAt) }}</strong>
                      </div>
                    </div>

                    <div class="assessment-results-actions">
                      <button type="button" class="record-link record-link-button" @click="openResultsModal(assessment)">
                        <i class="fas fa-eye"></i>
                        {{ getAssessmentResultsActionLabel(assessment) }}
                      </button>
                    </div>
                  </template>
                </div>

                <div class="record-card-actions">
                  <button type="button" class="record-link record-link-button" @click="openDeadlineEditor(assessment)">
                    <i class="fas fa-calendar-pen"></i>
                    Edit Deadline
                  </button>
                  <button v-if="!isActivityAssessment(assessment)" type="button" class="record-link record-link-button" @click="openAnswerKey(assessment)">
                    <i class="fas fa-key"></i>
                    View Correct Answers
                  </button>
                </div>
              </article>
            </div>

            <div v-if="filteredAssessments.length > pageSize" class="records-pagination">
              <p class="records-pagination-copy">{{ getPaginationSummary(assessmentPage, pageSize, filteredAssessments.length) }}</p>
              <div class="records-pagination-actions">
                <button
                  type="button"
                  class="pagination-btn"
                  :disabled="assessmentPage === 1"
                  @click="changeAssessmentPage(-1)"
                >
                  Previous
                </button>
                <span class="records-page-indicator">Page {{ assessmentPage }} of {{ assessmentTotalPages }}</span>
                <button
                  type="button"
                  class="pagination-btn"
                  :disabled="assessmentPage >= assessmentTotalPages"
                  @click="changeAssessmentPage(1)"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          v-show="activeRecordsTab === 'attendance'"
          id="teacherRecordsAttendancePanel"
          class="section-card animated-card records-section attendance-section"
        >
          <div class="section-header">
            <div class="records-section-heading">
              <h3 class="section-title">Attendance</h3>
            </div>
          </div>

          <div class="attendance-shell">
            <section class="attendance-hero-card">
              <div class="attendance-summary-grid">
                <article class="attendance-summary-card">
                  <i class="fas fa-users attendance-summary-icon" aria-hidden="true"></i>
                  <span>Total Students</span>
                  <strong>{{ attendanceSnapshot.totalStudents }}</strong>
                </article>
                <article class="attendance-summary-card status-present">
                  <i class="fas fa-user-check attendance-summary-icon" aria-hidden="true"></i>
                  <span>Present</span>
                  <strong>{{ attendanceSnapshot.presentCount }}</strong>
                </article>
                <article class="attendance-summary-card status-late">
                  <i class="fas fa-clock attendance-summary-icon" aria-hidden="true"></i>
                  <span>Late</span>
                  <strong>{{ attendanceSnapshot.lateCount }}</strong>
                </article>
                <article class="attendance-summary-card status-absent">
                  <i class="fas fa-user-times attendance-summary-icon" aria-hidden="true"></i>
                  <span>Absent</span>
                  <strong>{{ attendanceSnapshot.absentCount }}</strong>
                </article>
                <article class="attendance-summary-card status-excused">
                  <i class="fas fa-file-alt attendance-summary-icon" aria-hidden="true"></i>
                  <span>Excused</span>
                  <strong>{{ attendanceSnapshot.excusedCount }}</strong>
                </article>
              </div>

            </section>

            <section class="attendance-toolbar-card">
              <div class="attendance-toolbar-header">
                <div class="attendance-toolbar-header-copy">
                  <span class="attendance-toolbar-kicker">Quick Setup</span>
                  <h5>Choose the roster you want to take attendance for</h5>
                  <p>
                    {{ isAdvisoryAttendance
                      ? 'Use your assigned advisory section roster for homeroom or advisory attendance.'
                      : 'Use one of your handled subject classes for daily class attendance.' }}
                  </p>
                </div>
                <p class="attendance-toolbar-note">{{ attendanceToolbarHint }}</p>
              </div>

              <div class="attendance-scope-panel">
                <div class="attendance-scope-panel-copy">
                  <span class="attendance-step-badge">Step 1</span>
                  <strong>Attendance Scope</strong>
                  <small>Switch between handled-class attendance and your advisory section.</small>
                </div>

                <div class="attendance-scope-switch" role="tablist" aria-label="Attendance scope">
                  <button
                    type="button"
                    class="attendance-scope-btn"
                    :class="{ active: attendanceScope === 'handled_class' }"
                    @click="attendanceScope = 'handled_class'"
                  >
                    <i class="fas fa-chalkboard"></i>
                    <span>Handled Classes</span>
                  </button>
                  <button
                    type="button"
                    class="attendance-scope-btn"
                    :class="{ active: attendanceScope === 'advisory_class' }"
                    :disabled="!teacherAdvisorySection"
                    @click="attendanceScope = 'advisory_class'"
                  >
                    <i class="fas fa-users"></i>
                    <span>Advisory Section</span>
                  </button>
                </div>
              </div>

              <div class="attendance-toolbar-grid">
                <div class="attendance-toolbar-field-card">
                  <span class="attendance-step-badge">Step 2</span>
                  <label v-if="!isAdvisoryAttendance" class="filter-field">
                    <span>Handled Class</span>
                    <select v-model="attendanceSubjectId">
                      <option value="" disabled>Select class</option>
                      <option v-for="subject in attendanceSubjectOptions" :key="`attendance-subject-${subject.id}`" :value="subject.id">
                        {{ subject.label }}
                      </option>
                    </select>
                  </label>

                  <div v-else class="attendance-context-card">
                    <span>Advisory Section</span>
                    <strong>{{ teacherAdvisorySection?.name || 'No advisory section assigned' }}</strong>
                    <small>{{ teacher.subject || teacherRole }}</small>
                  </div>
                </div>

                <div class="attendance-toolbar-field-card attendance-date-card">
                  <span class="attendance-step-badge">Step 3</span>
                  <div class="attendance-date-card-copy">
                    <div class="attendance-date-card-icon" aria-hidden="true">
                      <i class="fas fa-calendar-day"></i>
                    </div>
                    <div>
                      <strong>Attendance Date</strong>
                      <small>Choose the class day you want to review or update.</small>
                    </div>
                  </div>
                  <label class="filter-field attendance-date-field">
                    <span>Date</span>
                    <div class="attendance-date-input-wrap">
                      <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                      <input v-model="attendanceDateKey" type="date" />
                    </div>
                  </label>
                  <div class="attendance-date-quick-actions">
                    <button
                      type="button"
                      class="attendance-date-chip"
                      :class="{ active: attendanceDateKey === getTodayDateKey() }"
                      @click="attendanceDateKey = getTodayDateKey()"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      class="attendance-date-chip"
                      :class="{ active: attendanceDateKey === getRelativeDateKey(-1) }"
                      @click="attendanceDateKey = getRelativeDateKey(-1)"
                    >
                      Yesterday
                    </button>
                  </div>
                  <small class="attendance-date-helper">{{ attendanceSelectedDateLabel }}</small>
                </div>

                <div class="attendance-toolbar-field-card attendance-toolbar-actions-card">
                  <span class="attendance-step-badge">Step 4</span>
                  <div class="attendance-toolbar-actions">
                    <button
                      type="button"
                      class="pagination-btn attendance-load-btn"
                      :disabled="!canLoadAttendance || isAttendanceLoading"
                      @click="fetchAttendanceRoster"
                    >
                      <i class="fas fa-sync-alt" aria-hidden="true"></i>
                      {{ isAttendanceLoading ? 'Loading...' : 'Load' }}
                    </button>
                    <button
                      type="button"
                      class="pagination-btn attendance-save-btn"
                      :disabled="!canSaveAttendance"
                      @click="saveAttendance"
                    >
                      <i class="fas fa-save" aria-hidden="true"></i>
                      {{ isAttendanceSaving ? 'Saving...' : 'Save' }}
                    </button>
                    <button
                      type="button"
                      class="pagination-btn attendance-lock-btn"
                      :disabled="!canLockAttendance"
                      @click="lockAttendance"
                    >
                      <i class="fas fa-lock" aria-hidden="true"></i>
                      {{ isAttendanceLocking ? 'Locking...' : 'Lock' }}
                    </button>
                  </div>
                  <small class="attendance-actions-hint">Load the roster first, then save changes and lock the record once it is complete.</small>
                </div>
              </div>

              <div class="attendance-legend-block">
                <span class="attendance-legend-title">Attendance Status Guide</span>
                <div class="attendance-legend-row">
                  <span class="attendance-legend-pill status-present">Present</span>
                  <span class="attendance-legend-pill status-late">Late</span>
                  <span class="attendance-legend-pill status-absent">Absent</span>
                  <span class="attendance-legend-pill status-excused">Excused</span>
                </div>
              </div>

            </section>
          </div>

          <p
            v-if="attendanceMessage"
            class="attendance-feedback"
            :class="attendanceMessageType === 'error' ? 'attendance-feedback-error' : 'attendance-feedback-success'"
          >
            {{ attendanceMessage }}
          </p>

          <div class="attendance-layout">
            <article class="attendance-panel">
              <div class="attendance-panel-head">
                <div>
                  <span class="attendance-panel-kicker">Attendance Roster</span>
                </div>
                <div v-if="attendanceCurrentRecord" class="attendance-record-badges">
                  <span class="record-chip" :class="attendanceCurrentRecord.isLocked ? 'chip-success' : 'chip-neutral'">
                    {{ attendanceCurrentRecord.isLocked ? 'Locked' : 'Unlocked' }}
                  </span>
                  <span class="record-chip chip-neutral">{{ attendanceScopeLabel(attendanceCurrentRecord.attendanceScope) }}</span>
                  <span class="record-chip chip-subject">
                    {{ attendanceCurrentRecord.summary.totalStudents }} students
                  </span>
                </div>
              </div>

              <div v-if="isAttendanceLoading" class="table-state">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading attendance roster...</span>
              </div>

              <div v-else-if="attendanceRoster.length === 0" class="table-state">
                <i class="fas fa-user-check"></i>
                <span>{{ isAdvisoryAttendance ? (teacherAdvisorySection ? 'No students are assigned to your advisory section yet.' : 'Assign an advisory section before loading advisory attendance.') : (attendanceSubjectId ? 'No approved students are available for this handled class yet.' : 'Select a handled class and date to load the attendance roster.') }}</span>
              </div>

              <div v-else class="attendance-roster-body">
                <div class="attendance-roster-toolbar">
                  <div class="attendance-roster-toolbar-fields">
                    <label class="attendance-search-field">
                      <span>Find Student</span>
                      <div class="attendance-search-input-wrap">
                        <i class="fas fa-search" aria-hidden="true"></i>
                        <input
                          v-model="attendanceSearchQuery"
                          type="search"
                          placeholder="Search by name, email, grade, or section"
                          aria-label="Search students in attendance roster"
                        />
                      </div>
                    </label>

                    <label class="attendance-filter-field">
                      <span>Status Filter</span>
                      <select v-model="attendanceStatusFilter">
                        <option value="all">All students</option>
                        <option
                          v-for="status in attendanceStatuses"
                          :key="`attendance-filter-${status}`"
                          :value="status.toLowerCase()"
                        >
                          {{ status }}
                        </option>
                      </select>
                    </label>
                  </div>

                  <div class="attendance-roster-toolbar-actions">
                    <div class="attendance-bulk-actions">
                      <span>Quick mark visible students</span>
                      <div class="attendance-bulk-action-row">
                        <button
                          v-for="status in attendanceStatuses"
                          :key="`attendance-bulk-${status}`"
                          type="button"
                          class="attendance-bulk-btn"
                          :class="attendanceStatusClass(status)"
                          :disabled="!canEditAttendanceRoster || filteredAttendanceRoster.length === 0"
                          @click="applyBulkAttendanceStatus(status)"
                        >
                          {{ status }}
                        </button>
                      </div>
                    </div>

                    <button
                      v-if="attendanceRosterHasFilters"
                      type="button"
                      class="attendance-clear-filters-btn"
                      @click="clearAttendanceRosterFilters"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>

                <p class="attendance-roster-results">{{ attendanceRosterResultsLabel }}</p>

                <div v-if="filteredAttendanceRoster.length === 0" class="table-state attendance-filter-empty">
                  <i class="fas fa-search"></i>
                  <span>No students match your current search or status filter.</span>
                </div>

                <div v-else class="attendance-roster-table-wrap">
                  <table class="attendance-roster-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Grade</th>
                        <th>Section</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="student in filteredAttendanceRoster"
                        :key="student.id"
                        class="attendance-roster-row"
                        :class="attendanceStatusClass(student.attendanceStatus)"
                      >
                        <td class="attendance-roster-cell attendance-roster-cell-student">
                          <div class="attendance-student-main">
                            <div class="attendance-student-avatar">{{ getNameInitials(student.name) }}</div>
                            <div class="attendance-student-copy">
                              <strong>{{ student.name }}</strong>
                              <small class="attendance-student-email">
                                <i class="fas fa-envelope" aria-hidden="true"></i>
                                <span>{{ student.email || 'No email address' }}</span>
                              </small>
                            </div>
                          </div>
                        </td>
                        <td class="attendance-roster-cell attendance-roster-cell-center">
                          <span class="attendance-student-grade attendance-student-grade-table">
                            {{ student.gradeLevel || 'Approved' }}
                          </span>
                        </td>
                        <td class="attendance-roster-cell attendance-roster-cell-center">
                          <span class="attendance-roster-section">
                            {{ student.sectionName ? `Section ${student.sectionName}` : 'No section' }}
                          </span>
                        </td>
                        <td class="attendance-roster-cell attendance-roster-cell-action">
                          <div class="attendance-student-control attendance-student-control-inline" :class="attendanceStatusClass(student.attendanceStatus)">
                            <select
                              v-model="student.attendanceStatus"
                              class="attendance-status-select"
                              :aria-label="`Attendance status for ${student.name}`"
                              :disabled="!canEditAttendanceRoster"
                            >
                              <option
                                v-for="status in attendanceStatuses"
                                :key="`${student.id}-${status}`"
                                :value="status"
                              >
                                {{ status }}
                              </option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            <details class="attendance-panel attendance-history-panel" open>
              <summary class="attendance-history-summary">
                <div class="attendance-panel-head">
                <div>
                    <span class="attendance-panel-kicker">Attendance History</span>
                  </div>
                  <i class="fas fa-chevron-down attendance-history-chevron" aria-hidden="true"></i>
                </div>
              </summary>

              <div class="attendance-history-content">

              <div class="attendance-history-summary-grid">
                <article class="attendance-history-stat">
                  <span>Saved Records</span>
                  <strong>{{ attendanceHistorySnapshot.totalRecords }}</strong>
                </article>
                <article class="attendance-history-stat">
                  <span>Locked</span>
                  <strong>{{ attendanceHistorySnapshot.lockedCount }}</strong>
                </article>
                <article class="attendance-history-stat">
                  <span>Total Absences</span>
                  <strong>{{ attendanceHistorySnapshot.absentCount }}</strong>
                </article>
              </div>

              <div v-if="isAttendanceHistoryLoading" class="table-state">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading attendance history...</span>
              </div>

              <div v-else-if="attendanceRecords.length === 0" class="table-state">
                <span>{{ isAdvisoryAttendance ? 'No advisory attendance records saved yet.' : 'No handled-class attendance records saved yet for this subject.' }}</span>
              </div>

              <div v-else class="attendance-history-list">
                <button
                  v-for="record in attendanceRecords.slice(0, 8)"
                  :key="record.id"
                  type="button"
                  class="attendance-history-item"
                  :class="{ active: isAttendanceRecordSelected(record) }"
                  @click="openAttendanceRecord(record)"
                >
                  <div class="attendance-history-date-badge">
                    <span>Date</span>
                    <strong>{{ formatDate(record.dateKey) }}</strong>
                  </div>

                  <div class="attendance-history-copy">
                    <strong>{{ attendanceRecordTitle(record) }}</strong>
                    <small>{{ attendanceScopeLabel(record.attendanceScope) }}<template v-if="record.section?.name"> / Section {{ record.section.name }}</template><template v-else-if="record.subject?.code"> / {{ record.subject.code }}</template></small>
                    <div class="attendance-history-breakdown">
                      <span class="attendance-breakdown-pill status-present">{{ record.summary.presentCount }} P</span>
                      <span class="attendance-breakdown-pill status-late">{{ record.summary.lateCount }} L</span>
                      <span class="attendance-breakdown-pill status-absent">{{ record.summary.absentCount }} A</span>
                      <span class="attendance-breakdown-pill status-excused">{{ record.summary.excusedCount }} E</span>
                    </div>
                  </div>

                  <div class="attendance-history-meta">
                    <span class="attendance-history-count">
                      {{ record.summary.presentCount + record.summary.lateCount }}/{{ record.summary.totalStudents }} present or late
                    </span>
                    <span class="status-pill" :class="record.isLocked ? 'status-active' : 'status-suspended'">
                      {{ record.isLocked ? 'Locked' : 'Open' }}
                    </span>
                  </div>
                </button>
              </div>
              </div>
            </details>
          </div>
        </section>
      </div>

      <div v-if="showResultsModal && selectedAssessmentForResults" class="records-modal-backdrop" @click.self="closeResultsModal">
        <div class="records-modal-dialog">
          <div class="records-modal-header">
            <div>
              <h3>{{ selectedAssessmentForResults.title }}</h3>
              <p>{{ getResultsModalSubtitle(selectedAssessmentForResults) }}</p>
            </div>
            <button type="button" class="sidebar-close" @click="closeResultsModal" aria-label="Close submission details">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="records-modal-body">
            <div v-if="selectedAssessmentIsActivity" class="results-modal-metrics">
              <div class="results-summary-item">
                <span>Completed</span>
                <strong>{{ selectedAssessmentResults.length }}</strong>
              </div>
              <div class="results-summary-item">
                <span>Teacher Graded</span>
                <strong>{{ selectedAssessmentResultSummary.gradedCount }}</strong>
              </div>
              <div class="results-summary-item">
                <span>With Response</span>
                <strong>{{ selectedAssessmentResultSummary.withResponseCount }}</strong>
              </div>
              <div class="results-summary-item">
                <span>With Files</span>
                <strong>{{ selectedAssessmentResultSummary.withFilesCount }}</strong>
              </div>
            </div>
            <div v-else class="results-modal-metrics">
              <div class="results-summary-item">
                <span>Submitted</span>
                <strong>{{ selectedAssessmentResults.length }}</strong>
              </div>
              <div class="results-summary-item">
                <span>Average</span>
                <strong>{{ selectedAssessmentResultSummary.averagePercentage }}%</strong>
              </div>
              <div class="results-summary-item">
                <span>Pass Rate</span>
                <strong>{{ selectedAssessmentResultSummary.passRate }}%</strong>
              </div>
              <div class="results-summary-item">
                <span>Top Score</span>
                <strong>{{ selectedAssessmentResultSummary.topScoreLabel }}</strong>
              </div>
            </div>

            <div v-if="selectedAssessmentResults.length === 0" class="table-state">
              <i class="fas fa-clipboard-list"></i>
              <span>{{ selectedAssessmentIsActivity ? 'No completed activity work is available yet.' : 'No submission details available.' }}</span>
            </div>

            <div v-else-if="selectedAssessmentIsActivity" class="activity-results-list">
              <article v-for="result in selectedAssessmentResults" :key="result.id" class="activity-result-card">
                <div class="activity-result-head">
                  <div class="student-identity compact">
                    <img :src="result.studentAvatar" :alt="result.studentName" class="student-avatar" />
                    <div class="student-details">
                      <strong>{{ result.studentName }}</strong>
                      <small>{{ result.studentEmail }}</small>
                    </div>
                  </div>

                  <div class="activity-result-head-meta">
                    <span class="record-chip" :class="isTeacherReviewedResult(result) ? 'chip-success' : 'chip-neutral'">
                      {{ getActivityReviewLabel(result) }}
                    </span>
                    <span class="activity-result-date">{{ formatDateTime(result.submittedAt) }}</span>
                  </div>
                </div>

                <div class="activity-result-summary-row">
                  <span v-if="result.responseText" class="record-chip chip-neutral">Written response</span>
                  <span v-if="result.links.length" class="record-chip chip-type">{{ result.links.length }} link{{ result.links.length > 1 ? 's' : '' }}</span>
                  <span v-if="result.attachments.length" class="record-chip chip-subject">{{ result.attachments.length }} file{{ result.attachments.length > 1 ? 's' : '' }}</span>
                </div>

                <div class="activity-result-body">
                  <section class="activity-result-section">
                    <span class="activity-result-section-label">Response</span>
                    <p>{{ getActivityResponsePreview(result) }}</p>
                  </section>

                  <section v-if="result.links.length" class="activity-result-section">
                    <span class="activity-result-section-label">Links</span>
                    <div class="activity-result-link-list">
                      <a
                        v-for="link in result.links"
                        :key="link.id"
                        class="record-link"
                        :href="link.url"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {{ link.url }}
                      </a>
                    </div>
                  </section>

                  <section v-if="result.attachments.length" class="activity-result-section">
                    <span class="activity-result-section-label">Files</span>
                    <div class="activity-result-file-list">
                      <a
                        v-for="attachment in result.attachments"
                        :key="attachment.id"
                        class="activity-result-file"
                        :href="attachment.downloadUrl || attachment.url"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i class="fas" :class="attachment.canPreviewInline ? 'fa-file-lines' : 'fa-file-arrow-down'"></i>
                        <span>{{ attachment.fileName }}</span>
                      </a>
                    </div>
                  </section>

                  <section v-if="result.teacherFeedback" class="activity-result-section activity-result-feedback">
                    <span class="activity-result-section-label">Teacher Feedback</span>
                    <p>{{ result.teacherFeedback }}</p>
                  </section>
                </div>
              </article>
            </div>

            <div v-else class="records-table-wrap assessment-results-table-wrap">
              <table class="records-table assessment-results-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Result</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in selectedAssessmentResults" :key="result.id">
                    <td>
                      <div class="student-identity compact">
                        <img :src="result.studentAvatar" :alt="result.studentName" class="student-avatar" />
                        <div class="student-details">
                          <strong>{{ result.studentName }}</strong>
                          <small>{{ result.studentEmail }}</small>
                        </div>
                      </div>
                    </td>
                    <td>{{ result.score }} / {{ result.totalItems }}</td>
                    <td>{{ result.percentage }}%</td>
                    <td>
                      <span
                        class="status-pill"
                        :class="result.passFailStatus === 'pass' ? 'status-active' : 'status-suspended'"
                      >
                        {{ result.passFailStatus === 'pass' ? 'Pass' : 'Fail' }}
                      </span>
                    </td>
                    <td>{{ formatDateTime(result.submittedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="records-modal-footer">
            <button type="button" class="answer-key-close-btn" @click="closeResultsModal">
              Close
            </button>
          </div>
        </div>
      </div>

      <div v-if="showAnswerKeyModal && selectedAssessmentForAnswers" class="answer-key-modal" @click.self="closeAnswerKey">
        <div class="answer-key-dialog">
          <div class="answer-key-header">
            <div>
              <h3>Answer Key: {{ selectedAssessmentForAnswers.title }}</h3>
              <p>Correct answers for teacher reference only</p>
            </div>
            <button type="button" class="sidebar-close" @click="closeAnswerKey" aria-label="Close answer key">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="answer-key-body">
            <div
              v-for="item in selectedAssessmentForAnswers.answerKey || []"
              :key="`${selectedAssessmentForAnswers.id}-${item.questionNumber}`"
              class="answer-key-item"
            >
              <div class="answer-key-item-head">
                <h4>Question {{ item.questionNumber }}</h4>
                <span v-if="Array.isArray(item.options) && item.options.length > 0" class="answer-option-count">
                  {{ item.options.length }} option{{ item.options.length > 1 ? 's' : '' }}
                </span>
              </div>
              <p class="answer-question">{{ item.questionText || 'Question text unavailable.' }}</p>
              <div v-if="Array.isArray(item.options) && item.options.length > 0" class="answer-options-shell">
                <div class="answer-options">
                  <span
                    v-for="(option, optionIndex) in item.options"
                    :key="`${item.questionNumber}-option-${optionIndex}`"
                    :class="{ correct: option === item.correctAnswer }"
                  >
                    {{ option }}
                  </span>
                </div>
              </div>
              <p class="answer-correct">Correct Answer: <strong>{{ item.correctAnswer || 'N/A' }}</strong></p>
            </div>
            <div v-if="!(selectedAssessmentForAnswers.answerKey || []).length" class="table-state">
              <i class="fas fa-info-circle"></i>
              <span>No answer key available.</span>
            </div>
          </div>
          <div class="answer-key-footer">
            <button type="button" class="answer-key-close-btn" @click="closeAnswerKey">
              Close
            </button>
          </div>
        </div>
      </div>

      <div v-if="showDeadlineModal && selectedAssessmentForDeadline" class="records-modal-backdrop" @click.self="closeDeadlineEditor">
        <div class="records-modal-dialog deadline-modal-dialog">
          <div class="records-modal-header">
            <div>
              <h3>Edit Deadline</h3>
              <p>{{ selectedAssessmentForDeadline.title }}</p>
            </div>
            <button type="button" class="sidebar-close" @click="closeDeadlineEditor" aria-label="Close deadline editor">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="records-modal-body deadline-modal-body">
            <div class="deadline-editor-grid">
              <label class="deadline-editor-field">
                <span>Deadline Date</span>
                <input v-model="deadlineEditor.date" type="date" />
              </label>
              <label class="deadline-editor-field">
                <span>Deadline Time</span>
                <input v-model="deadlineEditor.time" type="time" />
              </label>
            </div>

            <p class="deadline-editor-help">
              {{ selectedAssessmentForDeadline.submissionDeadline
                ? `Current deadline: ${formatDateTime(selectedAssessmentForDeadline.submissionDeadline)}`
                : 'No deadline is set yet for this assessment.' }}
            </p>
            <p v-if="deadlineEditorError" class="deadline-editor-error">{{ deadlineEditorError }}</p>
          </div>

          <div class="records-modal-footer deadline-modal-footer">
            <button
              type="button"
              class="answer-key-close-btn deadline-clear-btn"
              :disabled="isSavingDeadline || (!deadlineEditor.date && !deadlineEditor.time && !selectedAssessmentForDeadline.submissionDeadline)"
              @click="clearAssessmentDeadline"
            >
              Clear Deadline
            </button>
            <button
              type="button"
              class="answer-key-close-btn"
              :disabled="isSavingDeadline"
              @click="closeDeadlineEditor"
            >
              Cancel
            </button>
            <button
              type="button"
              class="pagination-btn attendance-save-btn deadline-save-btn"
              :disabled="isSavingDeadline"
              @click="saveAssessmentDeadline"
            >
              {{ isSavingDeadline ? 'Saving...' : 'Save Deadline' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="isTourActive" class="teacher-page-tour-layer" aria-live="polite">
        <div class="teacher-page-tour-backdrop"></div>
        <div v-if="tourSpotlightStyle" class="teacher-page-tour-spotlight" :style="tourSpotlightStyle"></div>
        <section
          class="teacher-page-tour-tooltip"
          :style="tourTooltipStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="`Records tour step ${tourStepIndex + 1} of ${tourSteps.length}`"
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'
import UserNotificationList from '../../components/UserNotificationList.vue'
import { useUserNotifications } from '../../composables/useUserNotifications.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const accountMenuRef = ref(null)
const notificationMenuRef = ref(null)
const isLoading = ref(false)
const isTourActive = ref(false)
const tourStepIndex = ref(0)
const tourTargetRect = ref(null)
const tourTooltipStyle = ref({})
const hasAttemptedAutoTour = ref(false)
const CURRENT_PAGE_ROUTE = '/teacher/records'
const TOUR_ROUTE_ORDER = ['/teacher/dashboard', '/teacher/activities', '/teacher/students', '/teacher/records']
const TOUR_PROGRESS_PREFIX = 'edumatch_teacher_tour_progress_'
const SIDEBAR_BREAKPOINT = 1024
const SIDEBAR_WIDTH = 280
const ADVISORY_SECTION_REFRESH_MS = 15000
const ACTIVITY_TAB_KEYS = ['lesson', 'challenge']
const RECORDS_TAB_KEYS = ['lessons', 'assessments', 'attendance']

const teacher = reactive({
  name: '',
  displayName: '',
  subject: '',
  department: '',
  status: 'Online',
  email: ''
})

const {
  notifications,
  unreadCount: unreadNotificationCount,
  isLoading: isNotificationsLoading,
  showNotificationsPanel,
  toggleNotificationsPanel,
  closeNotificationsPanel,
  clearAllNotifications,
} = useUserNotifications({ limit: 8, pollIntervalMs: 15000 })
const lessons = ref([])
const assessments = ref([])
const assessmentResults = ref([])
const activeRecordsTab = ref('lessons')
const lessonPage = ref(1)
const assessmentPage = ref(1)
const teacherSubjects = ref([])
const teacherAdvisorySection = ref(null)
const attendanceRecords = ref([])
const attendanceRoster = ref([])
const attendanceStatuses = ['Present', 'Late', 'Absent', 'Excused']
const attendanceScope = ref('handled_class')
const attendanceSubjectId = ref('')
const attendanceDateKey = ref('')
const attendanceCurrentRecord = ref(null)
const isAttendanceLoading = ref(false)
const isAttendanceHistoryLoading = ref(false)
const isAttendanceSaving = ref(false)
const isAttendanceLocking = ref(false)
const attendanceMessage = ref('')
const attendanceMessageType = ref('success')
const attendanceSearchQuery = ref('')
const attendanceStatusFilter = ref('all')
const pageSize = 5
const showResultsModal = ref(false)
const selectedAssessmentForResults = ref(null)
const showAnswerKeyModal = ref(false)
const selectedAssessmentForAnswers = ref(null)
const showDeadlineModal = ref(false)
const selectedAssessmentForDeadline = ref(null)
const isSavingDeadline = ref(false)
const deadlineEditorError = ref('')
const deadlineEditor = reactive({
  date: '',
  time: '',
})
let teacherSectionRefreshTimer = null
let isTeacherSectionRefreshInFlight = false
const tourSteps = [
  {
    key: 'lessons-table',
    title: 'Lesson Records',
    description: 'This section keeps your uploaded lesson materials organized so you can review past content and supporting files.',
    selector: '[data-tour="records-lessons-table"]'
  },
  {
    key: 'assessments-table',
    title: 'Assessment Results',
    description: 'Review completed assessments, compare student scores, and check submission details in this results section.',
    selector: '[data-tour="records-assessments-table"]'
  },
  {
    key: 'download-action',
    title: 'Submission Review',
    description: 'Use the records tools to inspect results, monitor completion, and analyze assessment performance trends.',
    selector: '[data-tour="records-download-action"]'
  }
]
const displayName = computed(() => teacher.displayName || teacher.name || 'Teacher')
const teacherFullName = computed(() => displayName.value)
const teacherRole = computed(() => {
  const role = String(authStore.user?.role || 'teacher').trim().toLowerCase()
  if (!role) return 'Teacher'
  return role.charAt(0).toUpperCase() + role.slice(1)
})
const teacherStatus = computed(() => String(teacher.status || 'Online').trim() || 'Online')
const teacherAvatarUrl = computed(() => {
  const profileImage = String(authStore.user?.profileImage || '').trim()
  if (profileImage && !profileImage.toLowerCase().includes('ui-avatars.com')) return profileImage
  return ''
})

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!configured) return '/api'
  if (configured.endsWith('/api')) return configured
  return `${configured}/api`
}

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${authStore.token}`
  }
})

const uniqueBy = (items, keyResolver) => {
  const seen = new Set()
  return (Array.isArray(items) ? items : []).filter((item, index) => {
    const key = String(keyResolver(item, index) || '').trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const isActiveRoute = (path) => route.path === path || route.path.startsWith(`${path}/`)
const activitiesMenuOpen = ref(route.path === '/teacher/activities' || route.path.startsWith('/teacher/activities/'))
const normalizeActivitiesTab = (tab) => {
  const normalizedTab = String(tab || '').trim().toLowerCase()
  if (normalizedTab === 'assessment' || normalizedTab === 'assessments') return 'challenge'
  return ACTIVITY_TAB_KEYS.includes(normalizedTab) ? normalizedTab : 'lesson'
}
const buildActivitiesTabRoute = (tab) => {
  const normalizedTab = normalizeActivitiesTab(tab)
  return normalizedTab === 'lesson'
    ? { path: '/teacher/activities' }
    : { path: '/teacher/activities', query: { tab: normalizedTab } }
}
const isActivitiesRouteActive = computed(() => route.path === '/teacher/activities' || route.path.startsWith('/teacher/activities/'))
const isActivitiesMenuOpen = computed(() => activitiesMenuOpen.value)
const isActivitiesSubRouteActive = (tab) => (
  isActivitiesRouteActive.value && normalizeActivitiesTab(route.query.tab) === normalizeActivitiesTab(tab)
)
const toggleActivitiesMenu = () => {
  activitiesMenuOpen.value = !activitiesMenuOpen.value
}
const recordsMenuOpen = ref(route.path === '/teacher/records' || route.path.startsWith('/teacher/records/'))
const normalizeRecordsTab = (tab) => {
  const normalizedTab = String(tab || '').trim().toLowerCase()
  return RECORDS_TAB_KEYS.includes(normalizedTab) ? normalizedTab : 'lessons'
}
const buildRecordsTabRoute = (tab) => {
  const normalizedTab = normalizeRecordsTab(tab)
  return normalizedTab === 'lessons'
    ? { path: '/teacher/records' }
    : { path: '/teacher/records', query: { tab: normalizedTab } }
}
const isRecordsRouteActive = computed(() => route.path === '/teacher/records' || route.path.startsWith('/teacher/records/'))
const isRecordsMenuOpen = computed(() => recordsMenuOpen.value)
const isRecordsSubRouteActive = (tab) => (
  isRecordsRouteActive.value && normalizeRecordsTab(route.query.tab) === normalizeRecordsTab(tab)
)
const toggleRecordsMenu = () => {
  recordsMenuOpen.value = !recordsMenuOpen.value
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const syncMobileMenuBodyState = () => {
  if (typeof window === 'undefined') return
  const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
  document.body.classList.toggle('teacher-mobile-menu-open', shouldLockBody)
}

const handleEscape = (event) => {
  if (event.key !== 'Escape') return
  if (isTourActive.value) {
    skipTour()
    return
  }
  if (showResultsModal.value) {
    closeResultsModal()
    return
  }
  if (showAnswerKeyModal.value) {
    closeAnswerKey()
    return
  }
  if (showDeadlineModal.value) {
    closeDeadlineEditor()
    return
  }
  closeSidebar()
  showNotificationsPanel.value = false
}

const handleLogout = () => {
  authStore.logout()
  router.push('/auth/login')
}

const toggleAccountMenu = () => {
  isAccountMenuOpen.value = !isAccountMenuOpen.value
}

const goToProfile = () => {
  isAccountMenuOpen.value = false
  router.push('/teacher/profile')
}

const goToSettings = () => {
  isAccountMenuOpen.value = false
  router.push('/teacher/settings')
}

const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (notificationMenuRef.value && target instanceof Node && notificationMenuRef.value.contains(target)) return
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  closeNotificationsPanel()
  isAccountMenuOpen.value = false
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date)
}

const formatDateTime = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const toDateInputValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toTimeInputValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const buildDeadlineIso = (dateValue, timeValue) => {
  const normalizedDate = String(dateValue || '').trim()
  const normalizedTime = String(timeValue || '').trim()
  if (!normalizedDate || !normalizedTime) return ''
  const composed = new Date(`${normalizedDate}T${normalizedTime}:00`)
  if (Number.isNaN(composed.getTime())) return ''
  return composed.toISOString()
}

const getTodayDateKey = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getRelativeDateKey = (offsetDays = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + Number(offsetDays || 0))
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatLabel = (value) => String(value || '').replace(/[-_]/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase())

const attendanceScopeLabel = (scope) => String(scope || '').trim().toLowerCase() === 'advisory_class'
  ? 'Advisory'
  : 'Handled Class'

const attendanceRecordTitle = (record) => String(
  record?.title
  || record?.subject?.className
  || record?.subject?.name
  || 'Attendance'
).trim() || 'Attendance'
const normalizeSearchText = (value) => String(value || '').trim().toLowerCase()

const attendanceSelectedDateLabel = computed(() => {
  if (!attendanceDateKey.value) return 'Pick a date to load the attendance sheet.'
  if (attendanceDateKey.value === getTodayDateKey()) return `Selected: ${formatDate(attendanceDateKey.value)} (Today)`
  if (attendanceDateKey.value === getRelativeDateKey(-1)) return `Selected: ${formatDate(attendanceDateKey.value)} (Yesterday)`
  return `Selected: ${formatDate(attendanceDateKey.value)}`
})

const normalizedLessons = computed(() => lessons.value.map((lesson) => ({
  ...lesson,
  subject: String(lesson?.subject || '').trim()
})))

const normalizedAssessments = computed(() => assessments.value.map((assessment) => ({
  ...assessment,
  subject: String(assessment?.subject || assessment?.lessonSubject || '').trim()
})))

const assessmentResultsByAssessmentId = computed(() => {
  const grouped = new Map()

  assessmentResults.value.forEach((result) => {
    const assessmentId = String(result?.assessmentId || '').trim()
    if (!assessmentId) return

    const items = grouped.get(assessmentId) || []
    items.push(result)
    grouped.set(assessmentId, items)
  })

  grouped.forEach((items, assessmentId) => {
    grouped.set(
      assessmentId,
      [...items].sort((left, right) => new Date(right.submittedAt || 0).getTime() - new Date(left.submittedAt || 0).getTime())
    )
  })

  return grouped
})

const filteredLessons = computed(() => normalizedLessons.value)

const filteredAssessments = computed(() => normalizedAssessments.value)

const attendanceSubjectOptions = computed(() => teacherSubjects.value.map((subject) => ({
  id: subject.id,
  label: `${subject.className || subject.name || 'Subject'}${subject.code ? ` (${subject.code})` : ''}`,
})))

const isAdvisoryAttendance = computed(() => attendanceScope.value === 'advisory_class')

const selectedAttendanceSubject = computed(() => (
  teacherSubjects.value.find((item) => item.id === attendanceSubjectId.value) || null
))

const selectedAttendanceSubjectLabel = computed(() => {
  if (isAdvisoryAttendance.value) {
    return teacherAdvisorySection.value?.name
      ? `Section ${teacherAdvisorySection.value.name}`
      : ''
  }
  const subject = selectedAttendanceSubject.value
  return subject ? (subject.className || subject.name || 'Subject') : ''
})

const attendanceHeroTitle = computed(() => {
  if (isAdvisoryAttendance.value) {
    return teacherAdvisorySection.value?.name
      ? `Advisory attendance for Section ${teacherAdvisorySection.value.name}`
      : 'Assign an advisory section to unlock advisory attendance'
  }
  return selectedAttendanceSubjectLabel.value || 'Take attendance for your handled classes'
})

const attendanceHeroDescription = computed(() => {
  if (isAdvisoryAttendance.value) {
    return 'Advisory attendance uses your assigned section only. Students from other sections do not appear here unless this is their advisory teacher.'
  }
  return 'Handled-class attendance follows subject enrollment. Students from different sections can appear here when they are approved in your class.'
})

const attendanceToolbarHint = computed(() => {
  if (isAdvisoryAttendance.value) {
    return teacherAdvisorySection.value?.name
      ? `Advisory section: ${teacherAdvisorySection.value.name}`
      : 'No advisory section is assigned to your account yet.'
  }
  return selectedAttendanceSubject.value?.department
    ? `Department: ${selectedAttendanceSubject.value.department}`
    : 'Select one of your handled classes.'
})

const attendanceRosterContextLabel = computed(() => {
  if (isAdvisoryAttendance.value) {
    return teacherAdvisorySection.value?.name
      ? `Section ${teacherAdvisorySection.value.name}`
      : 'Assigned advisory section'
  }
  return selectedAttendanceSubjectLabel.value || 'Select a handled class'
})

const canLoadAttendance = computed(() => Boolean(
  attendanceDateKey.value
  && (isAdvisoryAttendance.value ? teacherAdvisorySection.value?.id : attendanceSubjectId.value)
))

const attendanceSnapshot = computed(() => {
  const summary = {
    totalStudents: attendanceRoster.value.length || Number(attendanceCurrentRecord.value?.summary?.totalStudents || 0),
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
  }

  if (attendanceRoster.value.length > 0) {
    attendanceRoster.value.forEach((student) => {
      const normalized = String(student?.attendanceStatus || 'Present').trim().toLowerCase()
      if (normalized === 'present') summary.presentCount += 1
      if (normalized === 'late') summary.lateCount += 1
      if (normalized === 'absent') summary.absentCount += 1
      if (normalized === 'excused') summary.excusedCount += 1
    })
    return summary
  }

  const totalStudents = Number(attendanceCurrentRecord.value?.summary?.totalStudents || 0)
  const presentCount = Number(attendanceCurrentRecord.value?.summary?.presentCount || 0)
  const lateCount = Number(attendanceCurrentRecord.value?.summary?.lateCount || 0)
  const absentCount = Number(attendanceCurrentRecord.value?.summary?.absentCount || 0)
  const excusedCount = Number(attendanceCurrentRecord.value?.summary?.excusedCount || 0)

  return {
    totalStudents,
    presentCount,
    lateCount,
    absentCount,
    excusedCount,
  }
})

const attendanceRecordStateLabel = computed(() => {
  if (attendanceCurrentRecord.value?.isLocked) return 'Locked attendance record'
  if (attendanceCurrentRecord.value?.id) return 'Saved attendance record'
  if (attendanceRoster.value.length > 0) return 'Roster ready'
  return 'Ready for loading'
})

const attendanceHistorySnapshot = computed(() => {
  return attendanceRecords.value.reduce((accumulator, record) => {
    accumulator.totalRecords += 1
    accumulator.lockedCount += record?.isLocked ? 1 : 0
    accumulator.absentCount += Number(record?.summary?.absentCount || 0)
    return accumulator
  }, {
    totalRecords: 0,
    lockedCount: 0,
    absentCount: 0,
  })
})

const canEditAttendanceRoster = computed(() => Boolean(
  attendanceRoster.value.length > 0
  && !attendanceCurrentRecord.value?.isLocked
  && !isAttendanceLoading.value
  && !isAttendanceSaving.value
  && !isAttendanceLocking.value
))

const attendanceRosterHasFilters = computed(() => Boolean(
  attendanceSearchQuery.value.trim()
  || attendanceStatusFilter.value !== 'all'
))

const filteredAttendanceRoster = computed(() => {
  const query = normalizeSearchText(attendanceSearchQuery.value)
  const statusFilter = normalizeSearchText(attendanceStatusFilter.value)

  return attendanceRoster.value.filter((student) => {
    const currentStatus = normalizeSearchText(student?.attendanceStatus || 'Present')
    if (statusFilter && statusFilter !== 'all' && currentStatus !== statusFilter) return false
    if (!query) return true

    return [
      student?.name,
      student?.email,
      student?.gradeLevel,
      student?.sectionName,
    ].some((value) => normalizeSearchText(value).includes(query))
  })
})

const attendanceRosterResultsLabel = computed(() => {
  const totalStudents = attendanceRoster.value.length
  const visibleStudents = filteredAttendanceRoster.value.length
  if (!totalStudents) return 'Load a roster to start taking attendance.'

  const editHint = attendanceCurrentRecord.value?.isLocked
    ? 'This record is locked and can no longer be edited.'
    : 'Use search, filters, or quick mark tools to move through the roster faster.'

  if (!attendanceRosterHasFilters.value) {
    return `${totalStudents} student${totalStudents === 1 ? '' : 's'} in this roster. ${editHint}`
  }

  return `Showing ${visibleStudents} of ${totalStudents} student${totalStudents === 1 ? '' : 's'}. ${editHint}`
})

const canSaveAttendance = computed(() => {
  return Boolean(
    attendanceDateKey.value
      && (isAdvisoryAttendance.value ? teacherAdvisorySection.value?.id : attendanceSubjectId.value)
      && attendanceRoster.value.length > 0
      && !attendanceCurrentRecord.value?.isLocked
      && !isAttendanceLoading.value
      && !isAttendanceSaving.value
  )
})

const canLockAttendance = computed(() => {
  return Boolean(
    attendanceCurrentRecord.value?.id
      && !attendanceCurrentRecord.value?.isLocked
      && !isAttendanceLoading.value
      && !isAttendanceSaving.value
      && !isAttendanceLocking.value
  )
})

const lessonTotalPages = computed(() => Math.max(1, Math.ceil(filteredLessons.value.length / pageSize)))

const assessmentTotalPages = computed(() => Math.max(1, Math.ceil(filteredAssessments.value.length / pageSize)))

const paginatedLessons = computed(() => {
  const start = (lessonPage.value - 1) * pageSize
  return filteredLessons.value.slice(start, start + pageSize)
})

const paginatedAssessments = computed(() => {
  const start = (assessmentPage.value - 1) * pageSize
  return filteredAssessments.value.slice(start, start + pageSize)
})

const getNameInitials = (value) => {
  const name = String(value || '').trim()
  if (!name) return 'S'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

const attendanceStatusClass = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'present') return 'status-present'
  if (normalized === 'late') return 'status-late'
  if (normalized === 'excused') return 'status-excused'
  if (normalized === 'absent') return 'status-absent'
  return 'status-neutral'
}

const clearAttendanceRosterFilters = () => {
  attendanceSearchQuery.value = ''
  attendanceStatusFilter.value = 'all'
}

const applyBulkAttendanceStatus = (status) => {
  if (!canEditAttendanceRoster.value || !filteredAttendanceRoster.value.length) return
  filteredAttendanceRoster.value.forEach((student) => {
    student.attendanceStatus = status
  })
}

const isAttendanceRecordSelected = (record) => {
  if (!record) return false
  if (attendanceCurrentRecord.value?.id && record.id === attendanceCurrentRecord.value.id) return true

  const recordScope = String(record?.attendanceScope || '').trim()
  if (recordScope !== attendanceScope.value) return false
  if (String(record?.dateKey || '') !== String(attendanceDateKey.value || '')) return false
  if (recordScope === 'advisory_class') return true

  return String(record?.subject?.id || '').trim() === String(attendanceSubjectId.value || '').trim()
}

const clearAttendanceFeedback = () => {
  attendanceMessage.value = ''
  attendanceMessageType.value = 'success'
}

const applyAttendanceRosterResponse = (payload = {}) => {
  attendanceCurrentRecord.value = payload?.attendance || null
  attendanceRoster.value = (Array.isArray(payload?.students) ? payload.students : []).map((student) => ({
    ...student,
    attendanceStatus: String(student?.attendanceStatus || 'Present').trim() || 'Present',
  }))
}

const fetchAttendanceHistory = async () => {
  if (!authStore.token) {
    attendanceRecords.value = []
    return
  }

  if (isAdvisoryAttendance.value && !teacherAdvisorySection.value?.id) {
    attendanceRecords.value = []
    return
  }

  if (!isAdvisoryAttendance.value && !attendanceSubjectId.value) {
    attendanceRecords.value = []
    return
  }

  isAttendanceHistoryLoading.value = true
  try {
    const params = new URLSearchParams({
      scope: attendanceScope.value,
    })
    if (!isAdvisoryAttendance.value) {
      params.set('subjectId', attendanceSubjectId.value)
    }
    const response = await axios.get(
      `${resolveApiBaseUrl()}/teacher/attendance?${params.toString()}`,
      getAuthConfig(),
    )
    attendanceRecords.value = Array.isArray(response.data?.records) ? response.data.records : []
  } catch (error) {
    console.error('Failed to fetch attendance history:', error)
    attendanceRecords.value = []
  } finally {
    isAttendanceHistoryLoading.value = false
  }
}

const fetchAttendanceRoster = async () => {
  if (!authStore.token || !attendanceDateKey.value) {
    attendanceRoster.value = []
    attendanceCurrentRecord.value = null
    return
  }

  if (isAdvisoryAttendance.value && !teacherAdvisorySection.value?.id) {
    attendanceCurrentRecord.value = null
    attendanceRoster.value = []
    attendanceMessage.value = 'Assign an advisory section in Teacher Management before taking advisory attendance.'
    attendanceMessageType.value = 'error'
    return
  }

  if (!isAdvisoryAttendance.value && !attendanceSubjectId.value) {
    attendanceRoster.value = []
    attendanceCurrentRecord.value = null
    return
  }

  isAttendanceLoading.value = true
  clearAttendanceFeedback()
  try {
    const params = new URLSearchParams({
      scope: attendanceScope.value,
      date: attendanceDateKey.value,
    })
    if (!isAdvisoryAttendance.value) {
      params.set('subjectId', attendanceSubjectId.value)
    }
    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/attendance/roster?${params.toString()}`, getAuthConfig())
    applyAttendanceRosterResponse(response.data)
  } catch (error) {
    console.error('Failed to fetch attendance roster:', error)
    attendanceCurrentRecord.value = null
    attendanceRoster.value = []
    attendanceMessage.value = error.response?.data?.message || 'Failed to load attendance roster.'
    attendanceMessageType.value = 'error'
  } finally {
    isAttendanceLoading.value = false
  }
}

const saveAttendance = async () => {
  if (!canSaveAttendance.value) return

  isAttendanceSaving.value = true
  clearAttendanceFeedback()
  try {
    const payload = {
      scope: attendanceScope.value,
      date: attendanceDateKey.value,
      entries: attendanceRoster.value.map((student) => ({
        studentId: student.id,
        status: student.attendanceStatus || 'Present',
      })),
    }
    if (!isAdvisoryAttendance.value) {
      payload.subjectId = attendanceSubjectId.value
    }
    const response = await axios.post(`${resolveApiBaseUrl()}/teacher/attendance`, payload, getAuthConfig())
    applyAttendanceRosterResponse(response.data)
    await fetchAttendanceHistory()
    attendanceMessage.value = response.data?.message || 'Attendance saved successfully.'
    attendanceMessageType.value = 'success'
  } catch (error) {
    console.error('Failed to save attendance:', error)
    attendanceMessage.value = error.response?.data?.message || 'Failed to save attendance.'
    attendanceMessageType.value = 'error'
  } finally {
    isAttendanceSaving.value = false
  }
}

const lockAttendance = async () => {
  if (!canLockAttendance.value) return

  isAttendanceLocking.value = true
  clearAttendanceFeedback()
  try {
    const response = await axios.patch(
      `${resolveApiBaseUrl()}/teacher/attendance/${encodeURIComponent(attendanceCurrentRecord.value.id)}/lock`,
      {},
      getAuthConfig(),
    )
    attendanceCurrentRecord.value = response.data?.record || attendanceCurrentRecord.value
    await fetchAttendanceHistory()
    attendanceMessage.value = response.data?.message || 'Attendance locked successfully.'
    attendanceMessageType.value = 'success'
  } catch (error) {
    console.error('Failed to lock attendance:', error)
    attendanceMessage.value = error.response?.data?.message || 'Failed to lock attendance.'
    attendanceMessageType.value = 'error'
  } finally {
    isAttendanceLocking.value = false
  }
}

const openAttendanceRecord = (record) => {
  clearAttendanceRosterFilters()
  attendanceScope.value = record?.attendanceScope || 'handled_class'
  attendanceSubjectId.value = record?.attendanceScope === 'advisory_class'
    ? ''
    : String(record?.subject?.id || '').trim()
  attendanceDateKey.value = record?.dateKey || attendanceDateKey.value
}

const fetchRecords = async () => {
  if (!authStore.token) {
    lessons.value = []
    assessments.value = []
    assessmentResults.value = []
    teacherSubjects.value = []
    teacherAdvisorySection.value = null
    attendanceRecords.value = []
    attendanceRoster.value = []
    attendanceCurrentRecord.value = null
    return
  }

  isLoading.value = true
  try {
    const apiBaseUrl = resolveApiBaseUrl()
    const [lessonsResponse, assessmentsResponse, resultsResponse, subjectsResponse, sectionsResponse] = await Promise.all([
      axios.get(`${apiBaseUrl}/teacher/lessons`, getAuthConfig()),
      axios.get(`${apiBaseUrl}/teacher/assessments`, getAuthConfig()),
      axios.get(`${apiBaseUrl}/teacher/students/assessment-results?sort=recent`, getAuthConfig()),
      axios.get(`${apiBaseUrl}/teacher/subjects`, getAuthConfig()),
      axios.get(`${apiBaseUrl}/teacher/sections`, getAuthConfig()),
    ])

    lessons.value = Array.isArray(lessonsResponse.data?.lessons) ? lessonsResponse.data.lessons : []
    assessments.value = Array.isArray(assessmentsResponse.data?.assessments) ? assessmentsResponse.data.assessments : []
    teacherSubjects.value = (Array.isArray(subjectsResponse.data?.subjects) ? subjectsResponse.data.subjects : []).map((subject) => ({
      ...subject,
      department: subject?.department || '',
    }))
    teacherAdvisorySection.value = sectionsResponse.data?.advisorySection || null
    authStore.setUser({
      advisorySectionId: String(sectionsResponse.data?.advisorySection?.id || '').trim(),
      advisorySection: sectionsResponse.data?.advisorySection
        ? {
          id: String(sectionsResponse.data.advisorySection.id || '').trim(),
          name: String(sectionsResponse.data.advisorySection.name || '').trim(),
        }
        : null,
    })
    if (!attendanceDateKey.value) {
      attendanceDateKey.value = getTodayDateKey()
    }
    if (!attendanceSubjectId.value && teacherSubjects.value.length > 0) {
      attendanceSubjectId.value = teacherSubjects.value[0]?.id || ''
    }
    assessmentResults.value = uniqueBy(
      Array.isArray(resultsResponse.data?.results) ? resultsResponse.data.results : [],
      (result, index) => result.id || `${result.studentId || ''}-${result.assessmentId || ''}-${index}`
    ).map((result, index) => ({
      id: result.id || `result-${index + 1}`,
      assessmentId: result.assessmentId || '',
      assessmentMode: String(result.assessmentMode || 'activity').trim().toLowerCase(),
      studentName: result.studentName || 'Student',
      studentEmail: result.studentEmail || '',
      studentAvatar: result.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.studentName || 'Student')}&background=334155&color=fff`,
      score: Number(result.score || 0),
      totalItems: Number(result.totalItems || 0),
      percentage: Number(result.percentage || 0),
      passFailStatus: String(result.passFailStatus || 'fail').toLowerCase() === 'pass' ? 'pass' : 'fail',
      submittedAt: result.submittedAt || null,
      responseText: String(result.responseText || '').trim(),
      links: Array.isArray(result.links) ? result.links : [],
      attachments: Array.isArray(result.attachments) ? result.attachments : [],
      gradedAt: result.gradedAt || null,
      gradeValue: result.gradeValue ?? null,
      teacherFeedback: String(result.teacherFeedback || '').trim(),
      isTeacherGraded: Boolean(result.isTeacherGraded),
    }))
    await fetchAttendanceHistory()
    await fetchAttendanceRoster()
  } catch (error) {
    console.error('Failed to fetch teacher records:', error)
    lessons.value = []
    assessments.value = []
    assessmentResults.value = []
    teacherSubjects.value = []
    teacherAdvisorySection.value = null
    attendanceRecords.value = []
    attendanceRoster.value = []
    attendanceCurrentRecord.value = null
  } finally {
    isLoading.value = false
  }
}

const refreshTeacherSectionState = async () => {
  if (!authStore.token || isTeacherSectionRefreshInFlight) return

  isTeacherSectionRefreshInFlight = true
  const previousSectionId = String(teacherAdvisorySection.value?.id || '').trim()
  const previousSectionName = String(teacherAdvisorySection.value?.name || '').trim()

  try {
    const apiBaseUrl = resolveApiBaseUrl()
    const response = await axios.get(`${apiBaseUrl}/teacher/sections`, getAuthConfig())
    const nextSection = response.data?.advisorySection || null
    const nextSectionId = String(nextSection?.id || '').trim()
    const nextSectionName = String(nextSection?.name || '').trim()
    const hasChanged = previousSectionId !== nextSectionId || previousSectionName !== nextSectionName

    teacherAdvisorySection.value = nextSection
    authStore.setUser({
      advisorySectionId: nextSectionId,
      advisorySection: nextSectionId
        ? {
          id: nextSectionId,
          name: nextSectionName,
        }
        : null,
    })

    if (hasChanged) {
      clearAttendanceFeedback()
      if (isAdvisoryAttendance.value) {
        if (!nextSectionId) {
          attendanceRoster.value = []
          attendanceCurrentRecord.value = null
          attendanceRecords.value = attendanceRecords.value.filter((record) => record?.attendanceScope !== 'advisory_class')
        } else if (attendanceDateKey.value) {
          await Promise.all([
            fetchAttendanceHistory(),
            fetchAttendanceRoster(),
          ])
        }
      }
    }
  } catch (error) {
    console.error('Failed to refresh teacher advisory section:', error)
  } finally {
    isTeacherSectionRefreshInFlight = false
  }
}

const handleRecordsWindowFocus = () => {
  refreshTeacherSectionState()
}

const handleRecordsVisibilityChange = () => {
  if (document.visibilityState !== 'visible') return
  refreshTeacherSectionState()
}

const startTeacherSectionRefreshLoop = () => {
  if (typeof window === 'undefined' || teacherSectionRefreshTimer) return
  teacherSectionRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'hidden') return
    refreshTeacherSectionState()
  }, ADVISORY_SECTION_REFRESH_MS)
}

const stopTeacherSectionRefreshLoop = () => {
  if (!teacherSectionRefreshTimer || typeof window === 'undefined') return
  window.clearInterval(teacherSectionRefreshTimer)
  teacherSectionRefreshTimer = null
}

const isActivityAssessment = (assessment) => String(assessment?.assessmentMode || '').trim().toLowerCase() === 'activity'

const getAssessmentResults = (assessmentId) => assessmentResultsByAssessmentId.value.get(String(assessmentId || '').trim()) || []

const isTeacherReviewedResult = (result) => Boolean(
  result?.isTeacherGraded
  || result?.gradedAt
  || result?.gradeValue !== null
  || String(result?.teacherFeedback || '').trim()
)

const getAssessmentResultsSectionTitle = (assessment) => isActivityAssessment(assessment)
  ? 'Activity Results'
  : 'Assessment Results'

const getAssessmentResultsSectionCopy = (assessment) => isActivityAssessment(assessment)
  ? 'Only completed activity work appears here, including student responses, links, and uploaded files.'
  : 'Collapsed by default so the records page stays easier to scan.'

const getAssessmentResultsCountLabel = (assessment) => {
  const count = getAssessmentResults(assessment?.id).length
  if (isActivityAssessment(assessment)) {
    return `${count} completed submission${count === 1 ? '' : 's'}`
  }
  return `${count} submitted`
}

const getAssessmentResultsActionLabel = (assessment) => isActivityAssessment(assessment)
  ? 'View Done Activities'
  : 'View Details'

const getResultsModalSubtitle = (assessment) => isActivityAssessment(assessment)
  ? `Completed activity work for ${assessment?.lessonTitle || 'this activity'}`
  : `Student submission details for ${assessment?.lessonTitle || 'this assessment'}`

const getAssessmentResultSummary = (assessmentId) => {
  const results = getAssessmentResults(assessmentId)
  if (!results.length) {
    return {
      averagePercentage: 0,
      passRate: 0,
      topScoreLabel: '0 / 0',
      latestSubmissionAt: null,
      gradedCount: 0,
      withFilesCount: 0,
      withResponseCount: 0,
    }
  }

  const totalPercentage = results.reduce((sum, result) => sum + Number(result.percentage || 0), 0)
  const passCount = results.reduce((count, result) => count + (result.passFailStatus === 'pass' ? 1 : 0), 0)
  const gradedCount = results.reduce((count, result) => count + (isTeacherReviewedResult(result) ? 1 : 0), 0)
  const withFilesCount = results.reduce((count, result) => count + (Array.isArray(result.attachments) && result.attachments.length > 0 ? 1 : 0), 0)
  const withResponseCount = results.reduce((count, result) => count + (String(result.responseText || '').trim() ? 1 : 0), 0)
  const topScoreResult = [...results].sort((left, right) => {
    const leftScore = Number(left.score || 0)
    const rightScore = Number(right.score || 0)
    if (rightScore !== leftScore) return rightScore - leftScore
    return Number(right.percentage || 0) - Number(left.percentage || 0)
  })[0]

  return {
    averagePercentage: Math.round(totalPercentage / results.length),
    passRate: Math.round((passCount / results.length) * 100),
    topScoreLabel: `${Number(topScoreResult?.score || 0)} / ${Number(topScoreResult?.totalItems || 0)}`,
    latestSubmissionAt: results[0]?.submittedAt || null,
    gradedCount,
    withFilesCount,
    withResponseCount,
  }
}

const selectedAssessmentResults = computed(() => {
  if (!selectedAssessmentForResults.value?.id) return []
  return getAssessmentResults(selectedAssessmentForResults.value.id)
})

const selectedAssessmentIsActivity = computed(() => isActivityAssessment(selectedAssessmentForResults.value))

const selectedAssessmentResultSummary = computed(() => {
  if (!selectedAssessmentForResults.value?.id) {
    return {
      averagePercentage: 0,
      passRate: 0,
      topScoreLabel: '0 / 0',
      latestSubmissionAt: null,
      gradedCount: 0,
      withFilesCount: 0,
      withResponseCount: 0,
    }
  }
  return getAssessmentResultSummary(selectedAssessmentForResults.value.id)
})

const getActivityReviewLabel = (result) => {
  if (result?.gradeValue !== null && result?.gradeValue !== undefined) return `Teacher graded: ${result.gradeValue}`
  if (String(result?.teacherFeedback || '').trim()) return 'Teacher feedback added'
  if (result?.gradedAt) return 'Teacher graded'
  return 'Submitted'
}

const getActivityResponsePreview = (result) => {
  const response = String(result?.responseText || '').trim()
  return response || 'No written response. The student may have submitted links or uploaded files only.'
}

const getPaginationSummary = (currentPage, currentPageSize, totalItems) => {
  if (!totalItems) return 'No records to show.'
  const start = ((currentPage - 1) * currentPageSize) + 1
  const end = Math.min(totalItems, currentPage * currentPageSize)
  return `Showing ${start}-${end} of ${totalItems} record${totalItems === 1 ? '' : 's'}`
}

const setRecordsTab = (tab) => {
  const normalizedTab = normalizeRecordsTab(tab)
  activeRecordsTab.value = normalizedTab

  const currentQueryTab = String(route.query.tab || '').trim().toLowerCase()
  if ((normalizedTab === 'lessons' && !currentQueryTab) || currentQueryTab === normalizedTab) return

  router.replace(buildRecordsTabRoute(normalizedTab)).catch(() => {})
}

const clampPage = (page, totalPages) => Math.min(Math.max(page, 1), Math.max(totalPages, 1))

const changeLessonPage = (direction) => {
  lessonPage.value = clampPage(lessonPage.value + direction, lessonTotalPages.value)
}

const changeAssessmentPage = (direction) => {
  assessmentPage.value = clampPage(assessmentPage.value + direction, assessmentTotalPages.value)
}

const openResultsModal = (assessment) => {
  selectedAssessmentForResults.value = assessment || null
  showResultsModal.value = Boolean(assessment)
}

const closeResultsModal = () => {
  showResultsModal.value = false
  selectedAssessmentForResults.value = null
}

const openAnswerKey = (assessment) => {
  selectedAssessmentForAnswers.value = assessment || null
  showAnswerKeyModal.value = Boolean(assessment)
}

const closeAnswerKey = () => {
  showAnswerKeyModal.value = false
  selectedAssessmentForAnswers.value = null
}

const applyAssessmentUpdate = (assessmentId, updates = {}) => {
  const normalizedId = String(assessmentId || '').trim()
  if (!normalizedId) return
  assessments.value = assessments.value.map((assessment) => (
    String(assessment?.id || '').trim() === normalizedId
      ? { ...assessment, ...updates }
      : assessment
  ))
  if (selectedAssessmentForResults.value?.id === normalizedId) {
    selectedAssessmentForResults.value = { ...selectedAssessmentForResults.value, ...updates }
  }
  if (selectedAssessmentForAnswers.value?.id === normalizedId) {
    selectedAssessmentForAnswers.value = { ...selectedAssessmentForAnswers.value, ...updates }
  }
  if (selectedAssessmentForDeadline.value?.id === normalizedId) {
    selectedAssessmentForDeadline.value = { ...selectedAssessmentForDeadline.value, ...updates }
  }
}

const openDeadlineEditor = (assessment) => {
  selectedAssessmentForDeadline.value = assessment || null
  deadlineEditor.date = toDateInputValue(assessment?.submissionDeadline)
  deadlineEditor.time = toTimeInputValue(assessment?.submissionDeadline)
  deadlineEditorError.value = ''
  showDeadlineModal.value = Boolean(assessment)
}

const closeDeadlineEditor = () => {
  showDeadlineModal.value = false
  selectedAssessmentForDeadline.value = null
  deadlineEditor.date = ''
  deadlineEditor.time = ''
  deadlineEditorError.value = ''
}

const saveAssessmentDeadline = async () => {
  if (!selectedAssessmentForDeadline.value?.id || isSavingDeadline.value) return
  if (!deadlineEditor.date || !deadlineEditor.time) {
    deadlineEditorError.value = 'Choose both a deadline date and time.'
    return
  }

  const submissionDeadline = buildDeadlineIso(deadlineEditor.date, deadlineEditor.time)
  if (!submissionDeadline) {
    deadlineEditorError.value = 'Enter a valid deadline date and time.'
    return
  }

  isSavingDeadline.value = true
  deadlineEditorError.value = ''
  try {
    const assessmentId = encodeURIComponent(selectedAssessmentForDeadline.value.id)
    const response = await axios.put(
      `${resolveApiBaseUrl()}/teacher/assessments/${assessmentId}/questions`,
      { submissionDeadline },
      getAuthConfig(),
    )
    const updatedAssessment = response.data?.assessment || {}
    const nextDeadline = updatedAssessment.submissionDeadline || submissionDeadline
    applyAssessmentUpdate(selectedAssessmentForDeadline.value.id, {
      submissionDeadline: nextDeadline,
      isDeadlinePassed: false,
      updatedAt: updatedAssessment.updatedAt || new Date().toISOString(),
    })
    closeDeadlineEditor()
  } catch (error) {
    console.error('Failed to update assessment deadline:', error)
    deadlineEditorError.value = error.response?.data?.message || 'Failed to update the deadline.'
  } finally {
    isSavingDeadline.value = false
  }
}

const clearAssessmentDeadline = async () => {
  if (!selectedAssessmentForDeadline.value?.id || isSavingDeadline.value) return

  isSavingDeadline.value = true
  deadlineEditorError.value = ''
  try {
    const assessmentId = encodeURIComponent(selectedAssessmentForDeadline.value.id)
    const response = await axios.put(
      `${resolveApiBaseUrl()}/teacher/assessments/${assessmentId}/questions`,
      { submissionDeadline: '' },
      getAuthConfig(),
    )
    const updatedAssessment = response.data?.assessment || {}
    applyAssessmentUpdate(selectedAssessmentForDeadline.value.id, {
      submissionDeadline: updatedAssessment.submissionDeadline || null,
      isDeadlinePassed: false,
      updatedAt: updatedAssessment.updatedAt || new Date().toISOString(),
    })
    closeDeadlineEditor()
  } catch (error) {
    console.error('Failed to clear assessment deadline:', error)
    deadlineEditorError.value = error.response?.data?.message || 'Failed to clear the deadline.'
  } finally {
    isSavingDeadline.value = false
  }
}

const handleAssessmentCreatedEvent = () => {
  fetchRecords()
}

const handleRecordsStorageSignal = (event) => {
  if (event?.key !== 'edumatch_teacher_records_refresh') return
  fetchRecords()
}

const downloadLesson = async (lesson) => {
  try {
    const apiBaseUrl = resolveApiBaseUrl()
    const response = await axios.get(`${apiBaseUrl}/teacher/lessons/${lesson.id}/download`, {
      ...getAuthConfig(),
      responseType: 'blob'
    })

    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = lesson.pdfOriginalName || `${lesson.title || 'lesson'}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Failed to download lesson:', error)
  }
}

const downloadAttachment = async (attachment) => {
  if (!attachment?.downloadUrl) return
  try {
    const response = await axios.get(attachment.downloadUrl, {
      ...getAuthConfig(),
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
    console.error('Failed to download attachment:', error)
  }
}

const persistTeacherTourPreference = async (hasCompletedTeacherTour = true) => {
  if (!authStore.token) return
  try {
    await axios.patch(`${resolveApiBaseUrl()}/teacher/tour-preference`, { hasCompletedTeacherTour }, getAuthConfig())
  } catch (error) {
    console.error('Failed to persist teacher tour preference:', error)
  }
}
const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const getScrollableAncestors = (element) => {
  const containers = []
  let parent = element?.parentElement || null
  while (parent && parent !== document.body) {
    const styles = window.getComputedStyle(parent)
    if (/(auto|scroll|overlay)/.test(styles.overflowY) && parent.scrollHeight > parent.clientHeight) {
      containers.push(parent)
    }
    parent = parent.parentElement
  }
  const root = document.scrollingElement || document.documentElement
  if (root) containers.push(root)
  return containers
}
const smoothScrollIntoView = async (element) => {
  if (!element) return
  const containers = getScrollableAncestors(element)
  containers.forEach((container) => {
    const targetRect = element.getBoundingClientRect()
    const containerRect = container === document.scrollingElement || container === document.documentElement
      ? { top: 0, height: window.innerHeight, bottom: window.innerHeight }
      : container.getBoundingClientRect()
    const above = targetRect.top < containerRect.top + 16
    const below = targetRect.bottom > containerRect.bottom - 16
    if (!above && !below) return
    const currentTop = container === document.scrollingElement || container === document.documentElement ? window.scrollY : container.scrollTop
    const desiredTop = currentTop + (targetRect.top - containerRect.top) - ((containerRect.height - targetRect.height) / 2)
    const safeTop = Math.max(0, desiredTop)
    if (container === document.scrollingElement || container === document.documentElement) {
      window.scrollTo({ top: safeTop, behavior: 'smooth' })
    } else {
      container.scrollTo({ top: safeTop, behavior: 'smooth' })
    }
  })
  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  await wait(320)
}
const getProgressStorageKey = () => {
  const authUser = authStore.user || {}
  const identifier = String(authUser._id || authUser.id || authUser.email || authUser.username || 'teacher').trim().toLowerCase()
  return `${TOUR_PROGRESS_PREFIX}${identifier || 'teacher'}`
}
const readTourProgress = () => {
  try {
    const raw = localStorage.getItem(getProgressStorageKey())
    return raw ? JSON.parse(raw) : null
  } catch (_error) {
    return null
  }
}
const writeTourProgress = (progress) => {
  try {
    localStorage.setItem(getProgressStorageKey(), JSON.stringify(progress))
  } catch (_error) {
    // no-op
  }
}
const clearTourProgress = () => {
  try {
    localStorage.removeItem(getProgressStorageKey())
  } catch (_error) {
    // no-op
  }
}
const hasSeenTour = () => authStore.user?.hasCompletedTeacherTour === true
const activeTourStep = computed(() => tourSteps[tourStepIndex.value] || null)
const isLastTourStep = computed(() => tourStepIndex.value >= tourSteps.length - 1)
const updateTourPlacement = () => {
  if (!isTourActive.value) return
  const target = activeTourStep.value?.selector ? document.querySelector(activeTourStep.value.selector) : null
  const desktopSidebarVisible = window.innerWidth > SIDEBAR_BREAKPOINT
  const safeViewportLeft = desktopSidebarVisible ? SIDEBAR_WIDTH + 20 : 12
  const viewportRightPadding = 12
  const viewportBottomPadding = 12
  const viewportTopPadding = (() => {
    const header = document.querySelector('.top-header')
    if (!header) return 12
    return Math.max(12, Math.round(header.getBoundingClientRect().bottom + 8))
  })()
  const minTooltipWidth = 280
  const maxTooltipWidth = 400
  const availableWidth = Math.max(minTooltipWidth, window.innerWidth - safeViewportLeft - viewportRightPadding)
  if (!target) {
    tourTargetRect.value = null
    tourTooltipStyle.value = {
      width: `${Math.min(maxTooltipWidth, availableWidth)}px`,
      left: `${safeViewportLeft}px`,
      top: '50%',
      transform: 'translateY(-50%)'
    }
    return
  }
  const rect = target.getBoundingClientRect()
  const padding = 10
  const minTargetLeft = target.closest('.teacher-sidebar') ? 8 : safeViewportLeft
  const paddedRect = {
    top: clamp(rect.top - padding, viewportTopPadding, window.innerHeight - viewportBottomPadding),
    left: clamp(rect.left - padding, minTargetLeft, window.innerWidth - viewportRightPadding),
    width: clamp(rect.width + padding * 2, 0, window.innerWidth - minTargetLeft - viewportRightPadding),
    height: clamp(rect.height + padding * 2, 0, window.innerHeight - viewportTopPadding - viewportBottomPadding)
  }
  tourTargetRect.value = paddedRect
  const tooltipElement = document.querySelector('.teacher-page-tour-tooltip')
  const tooltipWidth = Math.min(maxTooltipWidth, availableWidth)
  const estimatedTooltipHeight = Math.max(220, Number(tooltipElement?.offsetHeight || 0) || 260)
  let tooltipTop = paddedRect.top + paddedRect.height + 16
  if (tooltipTop + estimatedTooltipHeight > window.innerHeight - viewportBottomPadding) {
    tooltipTop = paddedRect.top - estimatedTooltipHeight - 16
  }
  tooltipTop = clamp(tooltipTop, viewportTopPadding, Math.max(viewportTopPadding, window.innerHeight - estimatedTooltipHeight - viewportBottomPadding))
  let tooltipLeft = paddedRect.left + (paddedRect.width / 2) - (tooltipWidth / 2)
  tooltipLeft = clamp(tooltipLeft, safeViewportLeft, Math.max(safeViewportLeft, window.innerWidth - tooltipWidth - viewportRightPadding))
  tourTooltipStyle.value = {
    width: `${tooltipWidth}px`,
    left: `${tooltipLeft}px`,
    top: `${tooltipTop}px`,
    transform: 'none'
  }
}
const tourSpotlightStyle = computed(() => {
  if (!tourTargetRect.value) return null
  return {
    top: `${tourTargetRect.value.top}px`,
    left: `${tourTargetRect.value.left}px`,
    width: `${tourTargetRect.value.width}px`,
    height: `${tourTargetRect.value.height}px`
  }
})
const renderCurrentTourStep = async () => {
  if (activeTourStep.value?.key === 'lessons-table') {
    setRecordsTab('lessons')
  } else if (activeTourStep.value?.key === 'assessments-table') {
    setRecordsTab('assessments')
  } else if (activeTourStep.value?.key === 'download-action') {
    setRecordsTab('lessons')
  }
  await nextTick()
  const target = activeTourStep.value?.selector ? document.querySelector(activeTourStep.value.selector) : null
  if (target) await smoothScrollIntoView(target)
  updateTourPlacement()
}
const closeTour = ({ markSeen = true } = {}) => {
  isTourActive.value = false
  tourTargetRect.value = null
  tourTooltipStyle.value = {}
  if (markSeen) {
    authStore.setUser({ hasCompletedTeacherTour: true })
    clearTourProgress()
    persistTeacherTourPreference(true)
  }
}
const startTour = async ({ force = false } = {}) => {
  if (!force && hasSeenTour()) return
  isTourActive.value = true
  tourStepIndex.value = 0
  await nextTick()
  await renderCurrentTourStep()
}
const launchManualTour = async () => {
  clearTourProgress()
  if (CURRENT_PAGE_ROUTE !== TOUR_ROUTE_ORDER[0]) {
    writeTourProgress({ active: true, step: 0, updatedAt: Date.now() })
    await router.push(TOUR_ROUTE_ORDER[0])
    return
  }
  await startTour({ force: true })
}
const goToNextTourStep = async () => {
  if (isLastTourStep.value) {
    const routeIndex = TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE)
    const nextRoute = routeIndex >= 0 ? TOUR_ROUTE_ORDER[routeIndex + 1] : null
    if (nextRoute) {
      writeTourProgress({ active: true, step: 0, updatedAt: Date.now() })
      closeTour({ markSeen: false })
      await router.push(nextRoute)
      return
    }
    closeTour({ markSeen: true })
    return
  }
  tourStepIndex.value += 1
  writeTourProgress({ active: true, step: tourStepIndex.value, updatedAt: Date.now() })
  await renderCurrentTourStep()
}
const goToPreviousTourStep = async () => {
  if (tourStepIndex.value === 0) {
    const routeIndex = TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE)
    const previousRoute = routeIndex > 0 ? TOUR_ROUTE_ORDER[routeIndex - 1] : null
    if (previousRoute) {
      writeTourProgress({ active: true, step: 'last', updatedAt: Date.now() })
      closeTour({ markSeen: false })
      await router.push(previousRoute)
    }
    return
  }
  tourStepIndex.value -= 1
  writeTourProgress({ active: true, step: tourStepIndex.value, updatedAt: Date.now() })
  await renderCurrentTourStep()
}
const skipTour = () => {
  closeTour({ markSeen: true })
}
const maybeAutoStartTour = async () => {
  if (hasAttemptedAutoTour.value) return
  hasAttemptedAutoTour.value = true
  const progress = readTourProgress()
  if (progress?.active) {
    const resolvedStep = progress.step === 'last' ? tourSteps.length - 1 : Number(progress.step || 0)
    isTourActive.value = true
    tourStepIndex.value = clamp(resolvedStep, 0, Math.max(0, tourSteps.length - 1))
    await nextTick()
    await renderCurrentTourStep()
    return
  }
  if (hasSeenTour()) return
  if (CURRENT_PAGE_ROUTE !== TOUR_ROUTE_ORDER[0]) return
  await wait(420)
  await startTour()
}
const handleTourViewportChange = () => {
  if (!isTourActive.value) return
  updateTourPlacement()
}

watch(
  () => isSidebarOpen.value,
  () => {
    syncMobileMenuBodyState()
  }
)

watch(
  () => route.query.tab,
  (nextTab) => {
    activeRecordsTab.value = normalizeRecordsTab(nextTab)
  },
  { immediate: true }
)

watch(
  () => filteredLessons.value.length,
  (length) => {
    if (length === 0) {
      lessonPage.value = 1
      return
    }
    lessonPage.value = clampPage(lessonPage.value, lessonTotalPages.value)
  }
)

watch(
  () => filteredAssessments.value.length,
  (length) => {
    if (length === 0) {
      assessmentPage.value = 1
      return
    }
    assessmentPage.value = clampPage(assessmentPage.value, assessmentTotalPages.value)
  }
)

watch(
  () => [attendanceScope.value, attendanceSubjectId.value, teacherAdvisorySection.value?.id || ''],
  async ([nextScope, nextSubjectId, nextAdvisoryId], [previousScope, previousSubjectId, previousAdvisoryId]) => {
    if (
      nextScope === previousScope
      && nextSubjectId === previousSubjectId
      && nextAdvisoryId === previousAdvisoryId
    ) return

    attendanceCurrentRecord.value = null
    attendanceRoster.value = []
    clearAttendanceFeedback()
    clearAttendanceRosterFilters()

    if (nextScope === 'advisory_class' && !nextAdvisoryId) {
      attendanceRecords.value = []
      return
    }

    if (nextScope !== 'advisory_class' && !nextSubjectId) {
      attendanceRecords.value = []
      return
    }

    await fetchAttendanceHistory()
    if (attendanceDateKey.value) {
      await fetchAttendanceRoster()
    }
  }
)

watch(
  () => attendanceDateKey.value,
  async (nextDateKey, previousDateKey) => {
    if (!nextDateKey || nextDateKey === previousDateKey) return
    if (isAdvisoryAttendance.value && !teacherAdvisorySection.value?.id) return
    if (!isAdvisoryAttendance.value && !attendanceSubjectId.value) return
    clearAttendanceFeedback()
    clearAttendanceRosterFilters()
    await fetchAttendanceRoster()
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('click', handleAccountMenuClickOutside)
  document.addEventListener('visibilitychange', handleRecordsVisibilityChange)
  window.addEventListener('resize', handleTourViewportChange)
  window.addEventListener('scroll', handleTourViewportChange, true)
  window.addEventListener('resize', syncMobileMenuBodyState)
  window.addEventListener('focus', handleRecordsWindowFocus)
  window.addEventListener('teacher-assessment-created', handleAssessmentCreatedEvent)
  window.addEventListener('storage', handleRecordsStorageSignal)

  const authUser = authStore.user || {}
  teacher.name = authUser.name || authUser.username || 'Teacher'
  teacher.displayName = authUser.name || authUser.displayName || authUser.username || 'Teacher'
  teacher.subject = authUser.subject || ''
  teacher.department = authUser.department || ''
  teacher.status = authUser.status || 'Online'
  teacher.email = authUser.email || ''

  fetchRecords()
  maybeAutoStartTour()
  syncMobileMenuBodyState()
  startTeacherSectionRefreshLoop()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.removeEventListener('click', handleAccountMenuClickOutside)
  document.removeEventListener('visibilitychange', handleRecordsVisibilityChange)
  window.removeEventListener('resize', handleTourViewportChange)
  window.removeEventListener('scroll', handleTourViewportChange, true)
  window.removeEventListener('resize', syncMobileMenuBodyState)
  window.removeEventListener('focus', handleRecordsWindowFocus)
  window.removeEventListener('teacher-assessment-created', handleAssessmentCreatedEvent)
  window.removeEventListener('storage', handleRecordsStorageSignal)
  stopTeacherSectionRefreshLoop()
  closeTour({ markSeen: false })
  document.body.classList.remove('teacher-mobile-menu-open')
})
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
  transition: top 0.24s ease, left 0.24s ease, width 0.24s ease, height 0.24s ease;
  pointer-events: none;
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
  transition: left 0.24s ease, top 0.24s ease, width 0.24s ease;
}

.teacher-page-tour-step {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.teacher-page-tour-tooltip h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.25;
  font-weight: 700;
}

.teacher-page-tour-tooltip p {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.45;
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

.teacher-page-tour-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.teacher-page-tour-btn-ghost {
  background: #ffffff;
  color: #334155;
}

.teacher-page-tour-btn-ghost:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.teacher-page-tour-btn-primary {
  border-color: #0f172a;
  background: #0f172a;
  color: #ffffff;
}

.teacher-page-tour-btn-primary:hover {
  background: #1e293b;
  border-color: #1e293b;
}

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
  transition: all 0.2s ease;
}

.header-tour-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.records-section {
  padding: 1.25rem;
  border: 1px solid #dbe4ee;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.05);
}

.records-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  max-width: 1080px;
  margin: 0 auto;
}

.section-subtitle {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.85rem;
  line-height: 1.55;
}

.records-section-heading {
  display: grid;
  gap: 0.2rem;
}

.section-kicker {
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.records-filters {
  margin-top: 0.85rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 0.7rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.filter-field span {
  font-size: 0.74rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.filter-field select {
  min-height: 38px;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  padding: 0.45rem 0.65rem;
  font-size: 0.85rem;
  color: #0f172a;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-field select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.records-feed-wrap {
  margin-top: 0.85rem;
}

.records-feed {
  display: grid;
  gap: 0.75rem;
}

.record-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1rem;
  display: grid;
  gap: 0.85rem;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.record-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.record-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #edf2f7;
}

.record-card-title {
  display: grid;
  gap: 0.22rem;
}

.record-type-label {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.record-card-title h4 {
  margin: 0;
  color: #0f172a;
  font-size: 1.02rem;
  line-height: 1.35;
}

.record-card-title p {
  margin: 0.1rem 0 0;
  color: #94a3b8;
  font-size: 0.74rem;
  line-height: 1.5;
}

.record-card-date-group {
  display: grid;
  justify-items: end;
  gap: 0.18rem;
  text-align: right;
}

.record-date-label {
  color: #94a3b8;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.record-card-date {
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.record-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.record-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  padding: 0.28rem 0.64rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #334155;
  background: #f8fafc;
}

.chip-subject {
  background: #ecfeff;
  border-color: #a5f3fc;
  color: #155e75;
}

.chip-type {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}

.chip-neutral {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.chip-success {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #166534;
}

.record-card-body {
  display: grid;
  gap: 0.65rem;
  padding: 0.2rem 0 0;
}

.assessment-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}

.meta-item {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0.85rem 0.9rem;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  display: grid;
  gap: 0.28rem;
  position: relative;
}

.meta-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.82rem;
  margin-bottom: 0.12rem;
}

.meta-item span {
  display: block;
  color: #64748b;
  font-size: 0.71rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}

.meta-item strong {
  display: block;
  margin-top: 0.28rem;
  color: #0f172a;
  font-size: 0.88rem;
  line-height: 1.4;
}

.record-card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.35rem;
}

.assessment-results-block {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-top: 1px solid #edf2f7;
}

.assessment-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 700;
}

.assessment-results-title {
  display: grid;
  gap: 0.18rem;
}

.assessment-results-title p {
  margin: 0;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 500;
}

.assessment-results-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.38rem 0.72rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.inline-empty-state {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  color: #64748b;
  background: #f8fafc;
  font-size: 0.84rem;
}

.inline-empty-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.92rem;
  flex-shrink: 0;
}

.inline-empty-copy {
  display: grid;
  gap: 0.2rem;
}

.inline-empty-copy strong {
  color: #0f172a;
  font-size: 0.88rem;
}

.inline-empty-copy span {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
}

.assessment-results-table-wrap {
  margin-top: 0;
}

.assessment-results-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
}

.results-summary-item {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.8rem 0.9rem;
  display: grid;
  gap: 0.22rem;
}

.results-summary-item span {
  color: #64748b;
  font-size: 0.71rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.results-summary-item strong {
  color: #0f172a;
  font-size: 0.88rem;
  line-height: 1.4;
}

.assessment-results-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.85rem;
}

.records-table-wrap {
  margin-top: 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow-x: auto;
  background: #fff;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.records-table-wrap::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.records-table-wrap::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 999px;
}

.records-table-wrap::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.records-table-wrap::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.records-table {
  width: 100%;
  min-width: 1040px;
  border-collapse: separate;
  border-spacing: 0;
}

.records-table thead th {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-size: 0.74rem;
  font-weight: 700;
  text-align: left;
  padding: 0.85rem 0.95rem;
  white-space: nowrap;
}

.records-table tbody td {
  padding: 0.85rem 0.95rem;
  border-bottom: 1px solid #eef2f7;
  vertical-align: middle;
  color: #334155;
  font-size: 0.88rem;
}

.records-table tbody tr:last-child td {
  border-bottom: none;
}

.records-table tbody tr:hover td {
  background: #f8fafc;
}

.records-pagination {
  margin-top: 1rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.records-pagination-copy {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
}

.records-pagination-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.records-page-indicator {
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
}

.pagination-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  min-height: 38px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.records-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1290;
  padding: 1rem;
}

.records-modal-dialog {
  width: min(980px, 100%);
  max-height: 90vh;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.26);
}

.records-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.95rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.records-modal-header h3 {
  margin: 0;
  color: #0f172a;
}

.records-modal-header p {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.records-modal-body {
  padding: 1rem;
  overflow: auto;
}

.results-modal-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
}

.activity-results-list {
  display: grid;
  gap: 0.85rem;
  margin-top: 0.85rem;
}

.activity-result-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 0.95rem 1rem;
  display: grid;
  gap: 0.85rem;
}

.activity-result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.activity-result-head-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.activity-result-date {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.activity-result-summary-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.activity-result-body {
  display: grid;
  gap: 0.75rem;
}

.activity-result-section {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.8rem 0.9rem;
  display: grid;
  gap: 0.45rem;
}

.activity-result-section p {
  margin: 0;
  color: #334155;
  font-size: 0.84rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.activity-result-section-label {
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.activity-result-link-list,
.activity-result-file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.activity-result-link-list .record-link {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.activity-result-file {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #f8fafc;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.48rem 0.7rem;
  text-decoration: none;
}

.activity-result-file:hover {
  background: #eff6ff;
}

.activity-result-feedback {
  border-color: #bfdbfe;
  background: #f8fbff;
}

.records-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  padding: 0.8rem 1rem 0.95rem;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.deadline-modal-dialog {
  width: min(540px, 100%);
}

.deadline-modal-body {
  display: grid;
  gap: 0.95rem;
}

.deadline-editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.deadline-editor-field {
  display: grid;
  gap: 0.45rem;
}

.deadline-editor-field span {
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
}

.deadline-editor-field input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  color: #0f172a;
  padding: 0.78rem 0.9rem;
  font: inherit;
}

.deadline-editor-help {
  margin: 0;
  color: #64748b;
  font-size: 0.83rem;
  line-height: 1.5;
}

.deadline-editor-error {
  margin: 0;
  color: #b91c1c;
  font-size: 0.82rem;
  font-weight: 700;
}

.deadline-modal-footer {
  justify-content: space-between;
}

.deadline-clear-btn {
  border-color: #fecaca;
  color: #b91c1c;
}

.deadline-clear-btn:hover {
  background: #fff5f5;
}

.deadline-save-btn {
  min-width: 136px;
  justify-content: center;
}

.answer-key-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
  padding: 1rem;
}

.answer-key-dialog {
  width: min(900px, 100%);
  max-height: 90vh;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.26);
}

.answer-key-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.answer-key-header h3 {
  margin: 0;
}

.answer-key-header p {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.answer-key-body {
  overflow: auto;
  padding: 1rem 1.1rem 1.1rem;
  display: grid;
  gap: 0.9rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.answer-key-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.answer-key-body::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 999px;
}

.answer-key-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.answer-key-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.answer-key-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem 0.95rem;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.answer-key-close-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0.48rem 0.85rem;
  cursor: pointer;
}

.answer-key-close-btn:hover {
  background: #f8fafc;
}

.answer-key-item {
  border: 1px solid #dbe2ea;
  border-radius: 16px;
  padding: 0.95rem 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  display: grid;
  gap: 0.6rem;
}

.answer-key-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.answer-key-item h4 {
  margin: 0;
  color: #0f172a;
  font-size: 0.96rem;
}

.answer-option-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.28rem 0.62rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.answer-question {
  margin: 0;
  color: #334155;
  font-size: 0.86rem;
  line-height: 1.55;
}

.answer-options-shell {
  margin-top: 0.45rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.7rem;
}

.answer-options {
  display: grid;
  gap: 0.45rem;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 0.2rem;
}

.answer-options span {
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
  font-size: 0.8rem;
  color: #334155;
  background: #ffffff;
  line-height: 1.45;
  word-break: break-word;
}

.answer-options span.correct {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #166534;
  font-weight: 700;
}

.answer-correct {
  margin: 0.1rem 0 0;
  font-size: 0.84rem;
  color: #0f172a;
}

.answer-options::-webkit-scrollbar {
  width: 8px;
}

.answer-options::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.answer-options::-webkit-scrollbar-track {
  background: #f8fafc;
}

.primary-cell {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.primary-cell strong {
  color: #0f172a;
  font-size: 0.9rem;
}

.primary-cell small {
  color: #64748b;
  font-size: 0.72rem;
}

.secondary-cell {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.secondary-cell span {
  color: #0f172a;
}

.secondary-cell small {
  color: #64748b;
  font-size: 0.75rem;
}

.student-identity {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.student-identity.compact {
  gap: 0.6rem;
}

.student-avatar {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(148, 163, 184, 0.22);
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.student-details strong {
  color: #0f172a;
  font-size: 0.88rem;
}

.student-details small {
  color: #64748b;
  font-size: 0.74rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-cell {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.file-name {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-word;
}

.file-type {
  color: #64748b;
  font-size: 0.73rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.attachment-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.attachment-row:last-child {
  border-bottom: 1px solid #e2e8f0;
}

.attachment-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2563eb;
  font-size: 1rem;
  flex-shrink: 0;
}

.attachment-info {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  min-width: 0;
}

.attachment-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
}

.record-link {
  color: #111111;
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  cursor: pointer;
}

.record-link:hover {
  text-decoration: underline;
}

.record-link-button {
  width: fit-content;
  border: 1px solid #111111;
  background: #111111;
  color: #ffffff;
  border-radius: 10px;
  padding: 0.5rem 0.8rem;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.16);
}

.record-link-button:hover {
  background: #1f2937;
  color: #ffffff;
  text-decoration: none;
}

.record-link-button i,
.record-link-button .fas,
.record-link-button .fa-key {
  color: #ffffff !important;
}

.difficulty-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border: 1px solid transparent;
}

.difficulty-easy {
  background: #ecfdf3;
  border-color: #a7f3d0;
  color: #166534;
}

.difficulty-medium {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #9a3412;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 0.36rem 0.72rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-active {
  background: rgba(34, 197, 94, 0.16);
  color: #166534;
}

.status-suspended {
  background: rgba(239, 68, 68, 0.14);
  color: #991b1b;
}

.difficulty-hard {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.table-state {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: #64748b;
  font-weight: 600;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
}

@media (max-width: 768px) {
  .records-section {
    padding: 0.85rem;
    border-radius: 16px;
  }

  .records-filters {
    grid-template-columns: 1fr;
    gap: 0.55rem;
    padding: 0.55rem;
  }

  .record-card {
    padding: 0.78rem;
    border-radius: 14px;
    gap: 0.56rem;
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
  }

  .record-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
    padding-bottom: 0.5rem;
  }

  .record-card-title h4 {
    font-size: 0.88rem;
    line-height: 1.25;
  }

  .record-card-title p {
    margin-top: 0.15rem;
    font-size: 0.72rem;
  }

  .record-card-date-group {
    justify-items: start;
    text-align: left;
  }

  .record-card-date {
    white-space: normal;
    font-size: 0.71rem;
  }

  .assessment-meta-grid {
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }

  .assessment-results-block {
    padding: 0.8rem;
    border-radius: 14px;
  }

  .assessment-results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .assessment-results-summary,
  .results-modal-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .activity-result-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .activity-result-head-meta {
    justify-content: flex-start;
  }

  .deadline-editor-grid {
    grid-template-columns: 1fr;
  }

  .records-pagination {
    align-items: flex-start;
  }

  .records-pagination-actions {
    width: 100%;
    justify-content: space-between;
  }

  .records-page-indicator {
    width: 100%;
    order: -1;
  }

  .records-modal-dialog {
    border-radius: 16px;
  }

  .records-modal-header {
    align-items: flex-start;
  }

  .attachment-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 0.8rem;
    border-radius: 12px;
  }

  .attachment-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .attachment-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .record-card-actions {
    justify-content: stretch;
  }

  .record-card-actions .record-link-button {
    width: 100%;
  }

  .record-chip {
    font-size: 0.64rem;
    padding: 0.16rem 0.42rem;
  }

  .file-name {
    font-size: 0.84rem;
    line-height: 1.2;
  }

  .file-type {
    font-size: 0.66rem;
  }

  .record-link {
    font-size: 0.74rem;
  }

  .record-link-button {
    min-height: 30px;
    padding: 0.26rem 0.52rem;
    border-radius: 8px;
  }

  .meta-item {
    padding: 0.48rem 0.52rem;
  }

  .meta-item-icon {
    width: 30px;
    height: 30px;
    border-radius: 10px;
  }

  .meta-item span {
    font-size: 0.66rem;
  }

  .meta-item strong {
    font-size: 0.78rem;
  }
}

@media (max-width: 420px) {
  .records-section {
    padding: 0.62rem;
  }

  .section-subtitle {
    font-size: 0.76rem;
  }

  .record-card-title h4 {
    font-size: 0.84rem;
  }

  .record-card-title p {
    font-size: 0.69rem;
  }

  .meta-item {
    padding: 0.36rem 0.42rem;
  }

  .record-chip-row {
    gap: 0.3rem;
  }

  .record-card {
    padding: 0.6rem;
    gap: 0.46rem;
  }

  .assessment-results-summary,
  .results-modal-metrics {
    grid-template-columns: 1fr;
  }

  .pagination-btn {
    flex: 1 1 calc(50% - 0.3rem);
  }
}

@media (min-width: 1280px) {
  .records-grid {
    grid-template-columns: 1fr;
  }
}

.attendance-section {
  gap: 1.55rem;
}

.attendance-shell {
  display: grid;
  gap: 1.25rem;
}

.attendance-hero-card {
  border: 1px solid #dbe4ef;
  border-radius: 24px;
  padding: 1.35rem;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 32%),
    radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.09), transparent 28%),
    linear-gradient(135deg, #ffffff 0%, #eff6ff 54%, #f8fafc 100%);
  display: grid;
  gap: 1.15rem;
}

.attendance-hero-copy {
  display: grid;
  gap: 0.55rem;
}

.attendance-kicker,
.attendance-panel-kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.attendance-hero-copy h4 {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.15;
  color: #0f172a;
}

.attendance-hero-copy p {
  margin: 0;
  max-width: 56rem;
  color: #475569;
  line-height: 1.55;
}

.attendance-hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.attendance-summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.95rem;
}

.attendance-summary-card {
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  padding: 1rem;
  display: grid;
  gap: 0.38rem;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
}

.attendance-summary-card span {
  color: #64748b;
  font-size: 0.77rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.attendance-summary-card strong {
  color: #0f172a;
  font-size: 1.45rem;
  line-height: 1;
}

.attendance-toolbar-card {
  border: 1px solid #dbe4ef;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  padding: 1.2rem;
  display: grid;
  gap: 1.05rem;
  margin-bottom: 0.35rem;
}

.attendance-toolbar-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.9rem;
}

.attendance-toolbar-header-copy {
  display: grid;
  gap: 0.32rem;
  max-width: 620px;
}

.attendance-toolbar-kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.24rem 0.58rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 0.71rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.attendance-toolbar-header-copy h5 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
}

.attendance-toolbar-header-copy p {
  margin: 0;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.5;
}

.attendance-toolbar-note {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.5rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 700;
}

.attendance-scope-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.95rem;
  padding: 0.9rem 1rem;
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
}

.attendance-scope-panel-copy {
  display: grid;
  gap: 0.24rem;
}

.attendance-scope-panel-copy strong {
  color: #0f172a;
  font-size: 0.92rem;
}

.attendance-scope-panel-copy small {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.4;
}

.attendance-step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 1.4rem;
  padding: 0.18rem 0.52rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.attendance-scope-switch {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.attendance-scope-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  padding: 0.62rem 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.attendance-scope-btn.active {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.attendance-scope-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.attendance-toolbar-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.attendance-toolbar-field-card {
  display: grid;
  align-content: start;
  gap: 0.7rem;
  min-width: 0;
  padding: 0.95rem 1rem;
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
}

.attendance-toolbar-field-card .filter-field {
  margin: 0;
}

.attendance-date-card {
  align-content: start;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(239, 246, 255, 0.9) 100%);
}

.attendance-date-card-copy {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.attendance-date-card-icon {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
  box-shadow: inset 0 0 0 1px rgba(147, 197, 253, 0.85);
  flex-shrink: 0;
}

.attendance-date-card-copy strong {
  display: block;
  color: #0f172a;
  font-size: 0.94rem;
}

.attendance-date-card-copy small {
  display: block;
  margin-top: 0.16rem;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.45;
}

.attendance-date-field {
  gap: 0.42rem;
}

.attendance-date-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.2rem 0.75rem;
  background: #ffffff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.attendance-date-input-wrap:focus-within {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
}

.attendance-date-input-wrap > i {
  color: #64748b;
  font-size: 0.9rem;
}

.attendance-date-input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #0f172a;
  font: inherit;
  font-weight: 700;
  outline: none;
}

.attendance-date-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.attendance-date-chip {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  padding: 0.38rem 0.72rem;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.attendance-date-chip:hover {
  border-color: #93c5fd;
  color: #1d4ed8;
}

.attendance-date-chip.active {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #1d4ed8;
}

.attendance-date-helper {
  color: #475569;
  font-size: 0.77rem;
  line-height: 1.4;
}

.attendance-context-card {
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  background: #ffffff;
  padding: 0.85rem 0.95rem;
  display: grid;
  gap: 0.18rem;
}

.attendance-context-card span,
.attendance-context-card small {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.attendance-context-card strong {
  color: #0f172a;
  font-size: 0.96rem;
}

.attendance-toolbar-actions-card {
  align-content: start;
}

.attendance-toolbar-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.attendance-actions-hint {
  color: #64748b;
  font-size: 0.77rem;
  line-height: 1.45;
}

.attendance-legend-block {
  display: grid;
  gap: 0.55rem;
}

.attendance-legend-title {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.attendance-load-btn {
  background: #ffffff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.attendance-save-btn {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border-color: #1d4ed8;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.2);
}

.attendance-lock-btn {
  background: linear-gradient(135deg, #0f766e, #115e59);
  color: #ffffff;
  border-color: #115e59;
  box-shadow: 0 14px 28px rgba(15, 118, 110, 0.18);
}

.attendance-legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.attendance-legend-pill,
.attendance-breakdown-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem 0.72rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
}

.attendance-feedback {
  margin: 0 0 1.1rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  font-size: 0.88rem;
  font-weight: 600;
}

.attendance-feedback-success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.attendance-feedback-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.attendance-layout {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: minmax(0, 1fr);
}

.attendance-panel {
  border: 1px solid #dbe4ef;
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 255, 0.98) 100%);
  padding: 1rem;
  display: grid;
  gap: 0.95rem;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.05);
}

.attendance-panel-head {
  display: flex;
  justify-content: space-between;
  gap: 0.95rem;
  align-items: start;
  flex-wrap: wrap;
}

.attendance-panel-head h4 {
  margin: 0;
  color: #0f172a;
}

.attendance-panel-head p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.5;
}

.attendance-record-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: flex-end;
}

.attendance-roster-body {
  display: grid;
  gap: 1rem;
}

.attendance-roster-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
}

.attendance-roster-toolbar-fields {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) minmax(180px, 0.9fr);
  gap: 0.85rem;
  flex: 1 1 520px;
}

.attendance-roster-toolbar-actions {
  display: grid;
  gap: 0.75rem;
  align-content: start;
  justify-items: end;
  flex: 1 1 320px;
}

.attendance-search-field,
.attendance-filter-field {
  display: grid;
  gap: 0.42rem;
  margin: 0;
}

.attendance-search-field > span,
.attendance-filter-field > span,
.attendance-bulk-actions > span {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.attendance-search-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0 0.85rem;
  background: #ffffff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.attendance-search-input-wrap:focus-within {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
}

.attendance-search-input-wrap i {
  color: #94a3b8;
  font-size: 0.88rem;
}

.attendance-search-input-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #0f172a;
  font: inherit;
  outline: none;
}

.attendance-filter-field select {
  width: 100%;
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-weight: 700;
  padding: 0.56rem 0.76rem;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

.attendance-bulk-actions {
  display: grid;
  gap: 0.55rem;
}

.attendance-bulk-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.attendance-bulk-btn,
.attendance-clear-filters-btn {
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  padding: 0.45rem 0.78rem;
  font-size: 0.76rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.attendance-bulk-btn:hover:not(:disabled),
.attendance-clear-filters-btn:hover {
  transform: translateY(-1px);
  border-color: #93c5fd;
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.1);
}

.attendance-bulk-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.attendance-roster-results {
  margin: 0;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.55;
}

.attendance-filter-empty {
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 1.25rem;
}

.attendance-roster-table-wrap {
  overflow-x: auto;
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: #ffffff;
}

.attendance-roster-table {
  width: 100%;
  min-width: 620px;
  border-collapse: separate;
  border-spacing: 0;
}

.attendance-roster-table thead th {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #dbe4ef;
  background: #f8fafc;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
}

.attendance-roster-table thead th:first-child {
  border-top-left-radius: 18px;
}

.attendance-roster-table thead th:last-child {
  border-top-right-radius: 18px;
}

.attendance-roster-row {
  transition: background-color 0.18s ease;
}

.attendance-roster-row:hover {
  background: #f8fbff;
}

.attendance-roster-cell {
  padding: 0.85rem 1rem;
  border-top: 1px solid #eef2f7;
  vertical-align: middle;
}

.attendance-roster-cell-center {
  white-space: nowrap;
}

.attendance-roster-cell-action {
  width: 210px;
}

.attendance-roster-section {
  color: #334155;
  font-size: 0.83rem;
  font-weight: 600;
}

.attendance-student-main {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.attendance-student-avatar {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  box-shadow: 0 10px 18px rgba(37, 99, 235, 0.16);
}

.attendance-student-copy {
  display: grid;
  gap: 0.18rem;
  min-width: 0;
}

.attendance-student-copy strong {
  color: #0f172a;
  font-size: 0.95rem;
  line-height: 1.3;
}

.attendance-student-grade {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.52rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
}

.attendance-student-grade-table {
  background: #eff6ff;
  white-space: nowrap;
}

.attendance-student-copy small {
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.attendance-student-email {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  max-width: 100%;
}

.attendance-student-email i {
  color: #94a3b8;
  font-size: 0.76rem;
  flex-shrink: 0;
}

.attendance-student-email span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.attendance-student-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  padding: 0.42rem 0.82rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  background: #e2e8f0;
  color: #334155;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.14);
}

.attendance-excuse-block,
.attendance-excuse-missing {
  grid-column: 1 / -1;
}

.attendance-excuse-block {
  border: 1px solid #dbe4f1;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  padding: 0.9rem 1rem;
  display: grid;
  gap: 0.35rem;
}

.attendance-excuse-label {
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.attendance-excuse-block p {
  margin: 0;
  color: #0f172a;
  line-height: 1.55;
}

.attendance-excuse-block small {
  color: #64748b;
}

.attendance-excuse-missing {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: #92400e;
  background: #fffbeb;
  border: 1px dashed #fcd34d;
  border-radius: 14px;
  padding: 0.72rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
}

.attendance-student-control {
  display: grid;
  gap: 0.35rem;
  justify-items: start;
  width: 100%;
}

.attendance-student-control > span {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.attendance-student-control-inline > span {
  display: none;
}

.attendance-status-select {
  width: 100%;
  min-width: 170px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  padding: 0.56rem 0.76rem;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
  font-weight: 700;
  font-size: 0.84rem;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

.attendance-history-panel {
  align-content: start;
}

.attendance-history-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.attendance-history-stat {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #ffffff;
  padding: 0.95rem;
  display: grid;
  gap: 0.32rem;
}

.attendance-history-stat span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.attendance-history-stat strong {
  color: #0f172a;
  font-size: 1.15rem;
}

.attendance-history-list {
  display: grid;
  gap: 0.95rem;
}

.attendance-history-item {
  width: 100%;
  border: 1px solid #dbe4ef;
  background: #ffffff;
  border-radius: 16px;
  padding: 1.1rem;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 1rem;
  text-align: left;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.attendance-history-item:hover {
  transform: translateY(-1px);
  border-color: #93c5fd;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.08);
}

.attendance-history-item.active {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12), 0 16px 30px rgba(37, 99, 235, 0.08);
}

.attendance-history-item.active .attendance-history-date-badge {
  background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
}

.attendance-history-date-badge {
  min-width: 114px;
  border-radius: 18px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: #f8fafc;
  padding: 0.95rem 1rem;
  display: grid;
  gap: 0.24rem;
  align-content: center;
}

.attendance-history-date-badge span {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(241, 245, 249, 0.72);
}

.attendance-history-date-badge strong {
  line-height: 1.25;
}

.attendance-history-copy {
  display: grid;
  gap: 0.38rem;
  flex: 1 1 auto;
  align-content: center;
}

.attendance-history-copy strong {
  color: #0f172a;
}

.attendance-history-copy small {
  color: #64748b;
}

.attendance-history-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.attendance-history-meta {
  display: grid;
  gap: 0.45rem;
  justify-items: end;
  align-content: center;
}

.attendance-history-count {
  font-size: 0.76rem;
  color: #475569;
  font-weight: 600;
}

.attendance-summary-card.status-neutral,
.attendance-legend-pill.status-neutral,
.attendance-student-status-pill.status-neutral {
  background: #e2e8f0;
  color: #334155;
}

.attendance-summary-card.status-present,
.attendance-legend-pill.status-present,
.attendance-breakdown-pill.status-present,
.attendance-bulk-btn.status-present,
.attendance-student-control.status-present .attendance-status-select,
.attendance-student-status-pill.status-present {
  background: #dcfce7;
  color: #166534;
}

.attendance-summary-card.status-late,
.attendance-legend-pill.status-late,
.attendance-breakdown-pill.status-late,
.attendance-bulk-btn.status-late,
.attendance-student-control.status-late .attendance-status-select,
.attendance-student-status-pill.status-late {
  background: #fef3c7;
  color: #92400e;
}

.attendance-summary-card.status-absent,
.attendance-legend-pill.status-absent,
.attendance-breakdown-pill.status-absent,
.attendance-bulk-btn.status-absent,
.attendance-student-control.status-absent .attendance-status-select,
.attendance-student-status-pill.status-absent {
  background: #fee2e2;
  color: #991b1b;
}

.attendance-summary-card.status-excused,
.attendance-legend-pill.status-excused,
.attendance-breakdown-pill.status-excused,
.attendance-bulk-btn.status-excused,
.attendance-student-control.status-excused .attendance-status-select,
.attendance-student-status-pill.status-excused {
  background: #dbeafe;
  color: #1d4ed8;
}

.attendance-summary-card.status-present strong,
.attendance-summary-card.status-late strong,
.attendance-summary-card.status-absent strong,
.attendance-summary-card.status-excused strong {
  color: inherit;
}

@media (max-width: 980px) {
  .attendance-summary-grid,
  .attendance-history-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attendance-roster-toolbar-fields {
    grid-template-columns: 1fr;
  }

  .attendance-roster-toolbar-actions {
    justify-items: start;
  }

  .attendance-bulk-action-row {
    justify-content: flex-start;
  }

  .attendance-student-control {
    justify-items: start;
  }

  .attendance-status-select {
    min-width: 0;
  }

  .attendance-roster-table {
    min-width: 560px;
  }
}

@media (max-width: 820px) {
  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    padding: 1rem;
  }

  .attendance-summary-grid,
  .attendance-history-summary-grid {
    grid-template-columns: 1fr;
  }

  .attendance-toolbar-header,
  .attendance-scope-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .attendance-scope-switch {
    width: 100%;
  }

  .attendance-scope-btn {
    flex: 1 1 0;
    justify-content: center;
  }

  .attendance-toolbar-grid {
    grid-template-columns: 1fr;
  }

  .attendance-context-card {
    min-width: 0;
  }

  .attendance-roster-toolbar,
  .attendance-roster-toolbar-actions {
    justify-items: stretch;
  }

  .attendance-roster-toolbar-fields {
    grid-template-columns: 1fr;
  }

  .attendance-bulk-action-row {
    justify-content: flex-start;
  }

  .attendance-clear-filters-btn {
    width: 100%;
  }

  .attendance-toolbar-actions {
    grid-template-columns: 1fr;
  }

  .attendance-toolbar-note {
    width: 100%;
  }

  .attendance-history-item {
    flex-direction: column;
    align-items: stretch;
  }

  .attendance-history-date-badge {
    min-width: 0;
  }

  .attendance-history-meta {
    justify-items: start;
  }
}

/* Streamlined classroom attendance workflow */
.attendance-section {
  gap: 0.9rem;
}

.attendance-section > .section-header {
  margin-bottom: 0;
}

.attendance-shell {
  gap: 0.75rem;
}

.attendance-hero-card {
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 18px;
}

.attendance-hero-copy {
  gap: 0.35rem;
}

.attendance-hero-copy h4 {
  font-size: 1.05rem;
}

.attendance-hero-copy > p {
  display: none;
}

.attendance-hero-chips {
  gap: 0.35rem;
}

.attendance-summary-grid {
  gap: 0.6rem;
}

.attendance-summary-card {
  min-height: 76px;
  padding: 0.75rem 0.85rem;
  border-radius: 14px;
  box-shadow: none;
}

.attendance-summary-card strong {
  font-size: 1.35rem;
}

.attendance-toolbar-card {
  grid-template-columns: minmax(240px, auto) minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 18px;
  margin-bottom: 0;
}

.attendance-toolbar-header {
  display: none;
}

.attendance-scope-panel {
  display: grid;
  gap: 0.45rem;
  padding: 0;
  border: 0;
  background: transparent;
}

.attendance-scope-panel-copy small,
.attendance-scope-panel-copy .attendance-step-badge,
.attendance-toolbar-field-card > .attendance-step-badge,
.attendance-date-card-copy,
.attendance-date-quick-actions,
.attendance-date-helper,
.attendance-actions-hint {
  display: none;
}

.attendance-scope-switch {
  flex-wrap: nowrap;
  gap: 0.35rem;
}

.attendance-scope-btn {
  min-height: 42px;
  padding: 0.55rem 0.75rem;
  border-radius: 12px;
}

.attendance-toolbar-grid {
  grid-template-columns: minmax(180px, 1fr) minmax(170px, 0.7fr) minmax(330px, 1.35fr);
  align-items: end;
  gap: 0.6rem;
}

.attendance-toolbar-field-card {
  gap: 0.35rem;
  padding: 0;
  border: 0;
  background: transparent;
}

.attendance-context-card {
  min-height: 42px;
  padding: 0.55rem 0.7rem;
  border-radius: 12px;
}

.attendance-toolbar-actions {
  gap: 0.45rem;
}

.attendance-toolbar-actions .pagination-btn {
  min-height: 42px;
  padding-inline: 0.65rem;
  box-shadow: none;
  white-space: nowrap;
}

.attendance-legend-block {
  gap: 0.35rem;
  align-self: center;
}

.attendance-legend-row {
  flex-wrap: nowrap;
  gap: 0.35rem;
}

.attendance-legend-pill {
  padding: 0.35rem 0.55rem;
}

.attendance-layout {
  grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
  align-items: start;
  gap: 0.85rem;
}

.attendance-panel {
  min-width: 0;
  padding: 0.9rem;
  border-radius: 18px;
  box-shadow: none;
}

.attendance-panel-head p {
  line-height: 1.35;
}

.attendance-roster-toolbar {
  padding: 0.75rem;
  border-radius: 14px;
}

.attendance-roster-table-wrap {
  max-height: 65vh;
  overflow: auto;
  border-radius: 14px;
}

.attendance-roster-table {
  min-width: 720px;
}

.attendance-roster-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
}

.attendance-roster-table thead th:first-child {
  left: 0;
  z-index: 5;
}

.attendance-roster-cell-student {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 260px;
  background: #ffffff;
}

.attendance-roster-row:nth-child(even),
.attendance-roster-row:nth-child(even) .attendance-roster-cell-student {
  background: #f8fbff;
}

.attendance-roster-row:hover,
.attendance-roster-row:hover .attendance-roster-cell-student {
  background: #f8fafc;
}

.attendance-roster-cell {
  padding-block: 0.95rem;
}

.attendance-status-select {
  min-height: 46px;
  cursor: pointer;
}

.attendance-history-panel {
  position: sticky;
  top: 1rem;
  display: block;
  max-height: calc(100vh - 2rem);
  overflow: auto;
}

.attendance-history-summary {
  cursor: pointer;
  list-style: none;
}

.attendance-history-summary::-webkit-details-marker {
  display: none;
}

.attendance-history-summary .attendance-panel-head {
  align-items: center;
  flex-wrap: nowrap;
}

.attendance-history-chevron {
  transition: transform 0.18s ease;
}

.attendance-history-panel[open] .attendance-history-chevron {
  transform: rotate(180deg);
}

.attendance-history-content {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.attendance-history-summary-grid {
  gap: 0.4rem;
}

.attendance-history-stat {
  padding: 0.6rem;
  border-radius: 12px;
}

.attendance-history-stat span {
  font-size: 0.62rem;
}

.attendance-history-list {
  gap: 0.55rem;
}

.attendance-history-item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 0.65rem;
  padding: 0.65rem;
  border-radius: 12px;
}

.attendance-history-date-badge {
  min-width: 0;
  padding: 0.6rem;
  border-radius: 10px;
}

.attendance-history-meta {
  grid-column: 1 / -1;
  grid-template-columns: 1fr auto;
  justify-items: start;
}

@media (max-width: 1180px) {
  .attendance-toolbar-card {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .attendance-scope-panel {
    grid-template-columns: auto 1fr;
    align-items: center;
  }

  .attendance-scope-switch {
    justify-content: flex-end;
  }

  .attendance-legend-block {
    grid-template-columns: auto 1fr;
    align-items: center;
  }

  .attendance-layout {
    grid-template-columns: 1fr;
  }

  .attendance-history-panel {
    position: static;
    max-height: none;
  }
}

@media (max-width: 820px) {
  .attendance-hero-card {
    grid-template-columns: 1fr;
  }

  .attendance-summary-grid {
    grid-template-columns: repeat(5, minmax(110px, 1fr));
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  .attendance-toolbar-grid {
    grid-template-columns: 1fr 1fr;
  }

  .attendance-toolbar-actions-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .attendance-section {
    gap: 0.7rem;
  }

  .attendance-scope-panel {
    grid-template-columns: 1fr;
  }

  .attendance-scope-switch {
    justify-content: stretch;
  }

  .attendance-toolbar-grid {
    grid-template-columns: 1fr;
  }

  .attendance-toolbar-actions-card {
    grid-column: auto;
  }

  .attendance-toolbar-actions {
    grid-template-columns: 1fr;
  }

  .attendance-legend-block {
    grid-template-columns: 1fr;
  }

  .attendance-legend-row {
    overflow-x: auto;
    padding-bottom: 0.2rem;
  }

  .attendance-panel-head {
    gap: 0.55rem;
  }

  .attendance-roster-table-wrap {
    max-height: 70vh;
  }
}

/* Education-first brand polish and interaction states */
.attendance-hero-card {
  background:
    radial-gradient(circle at top right, rgba(187, 255, 89, 0.16), transparent 34%),
    linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
}

.attendance-toolbar-card,
.attendance-panel {
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
}

.attendance-kicker,
.attendance-panel-kicker,
.attendance-toolbar-kicker {
  background: rgba(30, 67, 7, 0.09);
  color: #1e4307;
}

.attendance-summary-card {
  grid-template-columns: 30px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 0.55rem;
}

.attendance-summary-icon {
  grid-row: 1;
  align-self: start;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 67, 7, 0.09);
  color: #1e4307;
  font-size: 0.8rem;
}

.attendance-summary-card span,
.attendance-summary-card strong {
  grid-column: 2;
}

.attendance-summary-card span {
  grid-row: 1;
  align-self: center;
}

.attendance-summary-card strong {
  grid-row: 2;
}

.attendance-scope-btn,
.attendance-date-chip,
.attendance-bulk-btn,
.attendance-clear-filters-btn,
.attendance-history-item,
.attendance-toolbar-actions .pagination-btn {
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.attendance-scope-btn.active,
.attendance-date-chip.active {
  background: rgba(187, 255, 89, 0.22);
  border-color: #bbff59;
  color: #1e4307;
}

.attendance-scope-btn:hover:not(:disabled),
.attendance-date-chip:hover,
.attendance-bulk-btn:hover:not(:disabled),
.attendance-clear-filters-btn:hover {
  border-color: #1e4307;
  color: #1e4307;
  box-shadow: 0 6px 14px rgba(30, 67, 7, 0.1);
}

.attendance-load-btn {
  background: #ffffff;
  border-color: #111111;
  color: #111111;
}

.attendance-save-btn {
  background: #111111;
  border-color: #111111;
  color: #ffffff;
}

.attendance-lock-btn {
  background: #ffffff;
  border-color: #111111;
  color: #111111;
}

.attendance-toolbar-actions .pagination-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(17, 17, 17, 0.16);
}

.attendance-toolbar-actions .attendance-load-btn:not(:disabled):hover,
.attendance-toolbar-actions .attendance-lock-btn:not(:disabled):hover {
  background: #111111;
  color: #ffffff;
}

.attendance-toolbar-actions .attendance-save-btn:not(:disabled):hover {
  background: #ffffff;
  color: #111111;
}

.attendance-toolbar-actions .pagination-btn:focus-visible {
  outline-color: #111111;
}

.attendance-toolbar-actions .pagination-btn i {
  margin-right: 0.35rem;
  color: currentColor !important;
}

.attendance-toolbar-actions .attendance-save-btn i,
.attendance-toolbar-actions .attendance-load-btn:not(:disabled):hover i,
.attendance-toolbar-actions .attendance-lock-btn:not(:disabled):hover i {
  color: #ffffff !important;
}

.attendance-toolbar-actions .attendance-load-btn i,
.attendance-toolbar-actions .attendance-lock-btn i,
.attendance-toolbar-actions .attendance-save-btn:not(:disabled):hover i {
  color: #111111 !important;
}

.attendance-student-avatar,
.attendance-history-item.active .attendance-history-date-badge {
  background: linear-gradient(135deg, #1e4307 0%, #ffd542 100%);
  box-shadow: 0 8px 16px rgba(30, 67, 7, 0.16);
}

.attendance-history-item:hover,
.attendance-history-item.active {
  border-color: #1e4307;
  box-shadow: 0 0 0 3px rgba(187, 255, 89, 0.18);
}

.attendance-search-input-wrap:focus-within,
.attendance-date-input-wrap:focus-within {
  border-color: #1e4307;
  box-shadow: 0 0 0 3px rgba(187, 255, 89, 0.24);
}

.attendance-section button:focus-visible,
.attendance-section select:focus-visible,
.attendance-section input:focus-visible,
.attendance-history-summary:focus-visible {
  outline: 3px solid #bbff59;
  outline-offset: 2px;
}

.attendance-section button:disabled {
  transform: none;
  box-shadow: none;
}

.attendance-section .fa-spinner {
  color: #1e4307;
}

.attendance-section .fa-spinner + span {
  position: relative;
}

.attendance-section .fa-spinner + span::after {
  content: '';
  display: block;
  width: min(220px, 60vw);
  height: 6px;
  margin-top: 0.55rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f9fafb 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: attendance-skeleton 1.2s ease-in-out infinite;
}

@keyframes attendance-skeleton {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .attendance-section *,
  .attendance-section *::before,
  .attendance-section *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

@media (max-width: 640px) {
  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    border-radius: 16px;
    padding: 0.75rem;
  }

  .attendance-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
    padding-bottom: 0;
  }

  .attendance-scope-btn,
  .attendance-toolbar-actions .pagination-btn,
  .attendance-date-input-wrap,
  .attendance-search-input-wrap,
  .attendance-filter-field select,
  .attendance-status-select {
    min-height: 48px;
  }

  .attendance-roster-toolbar {
    padding: 0.65rem;
  }

  .attendance-roster-table-wrap {
    max-height: none;
    overflow: visible;
    border: 0;
    background: transparent;
  }

  .attendance-roster-table,
  .attendance-roster-table tbody,
  .attendance-roster-row,
  .attendance-roster-cell {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .attendance-roster-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .attendance-roster-table tbody {
    display: grid;
    gap: 0.75rem;
  }

  .attendance-roster-row,
  .attendance-roster-row:nth-child(even) {
    border: 1px solid #dbe4ef;
    border-radius: 14px;
    background: #ffffff;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  }

  .attendance-roster-cell {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    align-items: center;
    gap: 0.65rem;
    padding: 0.65rem 0.75rem;
    border-top: 1px solid #eef2f7;
  }

  .attendance-roster-cell::before {
    color: #64748b;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .attendance-roster-cell-student,
  .attendance-roster-row:nth-child(even) .attendance-roster-cell-student,
  .attendance-roster-row:hover .attendance-roster-cell-student {
    position: static;
    display: block;
    min-width: 0;
    padding: 0.85rem 0.75rem;
    border-top: 0;
    background: #f8fafc;
  }

  .attendance-roster-cell-student::before {
    display: none;
  }

  .attendance-roster-cell:nth-child(2)::before {
    content: 'Grade';
  }

  .attendance-roster-cell:nth-child(3)::before {
    content: 'Section';
  }

  .attendance-roster-cell-action::before {
    content: 'Status';
  }

  .attendance-roster-cell-action {
    width: 100%;
  }

  .attendance-status-select {
    min-width: 0;
  }

  .attendance-history-item {
    grid-template-columns: 68px minmax(0, 1fr);
  }
}

/* Responsive hardening for the complete attendance workspace */
.attendance-section {
  container-type: inline-size;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
  gap: clamp(0.75rem, 1.2vw, 1.25rem);
}

.teacher-avatar > .fa-user {
  color: #1e4307 !important;
  font-size: 1rem;
  line-height: 1;
}

.attendance-section *,
.attendance-section *::before,
.attendance-section *::after {
  box-sizing: border-box;
}

.attendance-section > *,
.attendance-shell,
.attendance-layout,
.attendance-panel,
.attendance-roster-body,
.attendance-roster-toolbar,
.attendance-toolbar-grid,
.attendance-toolbar-field-card,
.attendance-history-content {
  min-width: 0;
  max-width: 100%;
}

.attendance-section .section-title {
  font-size: clamp(1.15rem, 1rem + 0.6vw, 1.65rem);
  line-height: 1.2;
}

.attendance-section .section-subtitle,
.attendance-panel-head p,
.attendance-roster-results {
  font-size: clamp(0.78rem, 0.74rem + 0.16vw, 0.9rem);
  overflow-wrap: anywhere;
}

.attendance-hero-copy h4,
.attendance-panel-head h4 {
  font-size: clamp(1rem, 0.92rem + 0.35vw, 1.3rem);
  line-height: 1.25;
}

.attendance-summary-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 138px), 1fr));
  gap: clamp(0.5rem, 0.8vw, 0.75rem);
  width: 100%;
  overflow: visible;
}

.attendance-summary-card {
  width: 100%;
  min-width: 0;
  min-height: clamp(72px, 7vw, 84px);
  padding: clamp(0.625rem, 0.8vw, 0.875rem);
}

.attendance-summary-card span {
  min-width: 0;
  font-size: clamp(0.64rem, 0.6rem + 0.14vw, 0.76rem);
  overflow-wrap: anywhere;
}

.attendance-summary-card strong {
  font-size: clamp(1.2rem, 1.05rem + 0.5vw, 1.55rem);
}

.attendance-toolbar-card {
  width: 100%;
  padding: clamp(0.75rem, 1vw, 1rem);
  gap: clamp(0.625rem, 1vw, 1rem);
}

.attendance-scope-switch,
.attendance-legend-row,
.attendance-toolbar-actions,
.attendance-bulk-action-row {
  min-width: 0;
  flex-wrap: wrap;
}

.attendance-scope-btn {
  flex: 1 1 150px;
  justify-content: center;
  min-width: 0;
  min-height: 44px;
  white-space: normal;
  text-align: center;
}

.attendance-toolbar-grid {
  width: 100%;
  grid-template-columns: minmax(180px, 1fr) minmax(170px, 0.8fr) minmax(280px, 1.35fr);
  gap: clamp(0.5rem, 0.8vw, 0.75rem);
}

.attendance-section input,
.attendance-section select,
.attendance-section button {
  max-width: 100%;
  min-width: 0;
}

.attendance-toolbar-field-card .filter-field select,
.attendance-date-input-wrap,
.attendance-date-input-wrap input,
.attendance-search-input-wrap,
.attendance-search-input-wrap input,
.attendance-filter-field select,
.attendance-status-select {
  width: 100%;
  min-height: 44px;
}

.attendance-toolbar-actions {
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.attendance-toolbar-actions .pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  text-align: center;
  overflow-wrap: anywhere;
}

.attendance-legend-pill {
  flex: 0 1 auto;
  min-height: 32px;
  white-space: normal;
  text-align: center;
}

.attendance-layout {
  width: 100%;
  grid-template-columns: minmax(0, 1fr) clamp(280px, 24vw, 340px);
  gap: clamp(0.75rem, 1.2vw, 1.25rem);
  margin-top: clamp(1rem, 1.4vw, 1.5rem);
}

.attendance-roster-toolbar-fields {
  grid-template-columns: minmax(180px, 1.5fr) minmax(150px, 0.75fr);
  min-width: min(100%, 400px);
}

.attendance-roster-table-wrap {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.attendance-roster-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

.attendance-roster-table th:first-child {
  width: 38%;
}

.attendance-roster-table th:nth-child(2) {
  width: 15%;
}

.attendance-roster-table th:nth-child(3) {
  width: 20%;
}

.attendance-roster-table th:last-child {
  width: 27%;
}

.attendance-roster-cell,
.attendance-roster-section,
.attendance-student-copy,
.attendance-student-copy strong,
.attendance-student-email,
.attendance-student-email span {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.attendance-roster-cell-action {
  width: auto;
}

.attendance-status-select {
  min-width: 0;
}

.attendance-history-panel,
.attendance-history-item,
.attendance-history-copy,
.attendance-history-meta {
  min-width: 0;
  max-width: 100%;
}

.attendance-history-copy strong,
.attendance-history-copy small,
.attendance-history-count {
  overflow-wrap: anywhere;
}

@media (max-width: 1180px) {
  .attendance-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-history-panel {
    position: static;
    width: 100%;
  }
}

@media (max-width: 900px) {
  .attendance-toolbar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attendance-toolbar-actions-card {
    grid-column: 1 / -1;
  }

  .attendance-roster-toolbar,
  .attendance-roster-toolbar-actions {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .attendance-section {
    gap: 0.75rem;
  }

  .attendance-section > .section-header {
    padding-inline: 0.125rem;
  }

  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    padding: 0.75rem;
  }

  .attendance-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attendance-summary-card {
    grid-template-columns: 28px minmax(0, 1fr);
    column-gap: 0.45rem;
  }

  .attendance-summary-icon {
    width: 28px;
    height: 28px;
  }

  .attendance-toolbar-grid,
  .attendance-roster-toolbar-fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-toolbar-actions-card {
    grid-column: auto;
  }

  .attendance-toolbar-actions {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-toolbar-actions .pagination-btn,
  .attendance-clear-filters-btn {
    width: 100%;
    min-height: 48px;
  }

  .attendance-legend-row {
    width: 100%;
    overflow: visible;
  }

  .attendance-legend-pill {
    flex: 1 1 calc(50% - 0.35rem);
  }

  .attendance-roster-toolbar-actions,
  .attendance-bulk-actions,
  .attendance-bulk-action-row {
    width: 100%;
    justify-items: stretch;
  }

  .attendance-bulk-btn {
    flex: 1 1 calc(50% - 0.5rem);
    min-height: 44px;
  }

  .attendance-roster-cell {
    grid-template-columns: minmax(70px, 30%) minmax(0, 1fr);
  }

  .attendance-history-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .attendance-history-item {
    grid-template-columns: minmax(62px, 76px) minmax(0, 1fr);
  }
}

@media (max-width: 360px) {
  .attendance-history-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-summary-card {
    min-height: 64px;
  }

  .attendance-scope-switch {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-history-item {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-history-date-badge,
  .attendance-history-meta {
    grid-column: 1;
  }
}

@media (min-width: 1600px) {
  .attendance-layout {
    grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  }

  .attendance-panel {
    padding: clamp(1rem, 1vw, 1.25rem);
  }
}

/* Final responsive layout corrections for the attendance workspace. */
.attendance-section,
.attendance-shell,
.attendance-hero-card,
.attendance-toolbar-card,
.attendance-layout,
.attendance-panel {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.attendance-toolbar-card {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  column-gap: clamp(0.75rem, 1.2vw, 1.25rem);
  row-gap: clamp(0.75rem, 1vw, 1rem);
}

.attendance-scope-panel,
.attendance-toolbar-grid,
.attendance-legend-block {
  min-width: 0;
  max-width: 100%;
}

.attendance-toolbar-grid {
  grid-column: 1 / -1;
  grid-row: 2;
  grid-template-columns: minmax(170px, 1fr) minmax(190px, 0.9fr) minmax(280px, 1.3fr);
}

.attendance-scope-panel {
  grid-column: 1;
  grid-row: 1;
  align-self: start;
}

.attendance-scope-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
}

.attendance-scope-btn {
  width: 100%;
  min-width: 0;
}

.attendance-legend-block {
  grid-column: 2;
  grid-row: 1;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  align-self: start;
  justify-self: end;
  gap: 0.75rem;
}

.attendance-legend-row {
  flex-wrap: wrap;
  overflow: visible;
}

.attendance-toolbar-actions {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.attendance-toolbar-actions .pagination-btn {
  width: 100%;
  min-width: 0;
  min-height: 44px;
}

@media (max-width: 1400px) {
  .attendance-hero-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-summary-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .attendance-toolbar-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attendance-legend-block {
    justify-self: end;
  }
}

@media (max-width: 1200px) {
  .attendance-hero-card,
  .attendance-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-history-panel {
    position: static;
    max-height: none;
  }
}

@media (max-width: 992px) {
  .attendance-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
  }

  .attendance-summary-card:last-child {
    grid-column: 1 / -1;
  }

  .attendance-toolbar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attendance-toolbar-actions-card {
    grid-column: 1 / -1;
  }

  .attendance-scope-panel,
  .attendance-roster-toolbar {
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .attendance-section {
    padding: clamp(0.65rem, 2.5vw, 1rem) !important;
    overflow-x: clip;
  }

  .attendance-toolbar-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-toolbar-grid,
  .attendance-legend-block,
  .attendance-roster-toolbar-fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-toolbar-actions-card,
  .attendance-legend-block {
    grid-column: auto;
  }

  .attendance-scope-panel,
  .attendance-toolbar-grid,
  .attendance-legend-block {
    grid-column: 1;
    grid-row: auto;
  }

  .attendance-legend-block {
    justify-self: stretch;
  }

  .attendance-scope-switch,
  .attendance-legend-row {
    width: 100%;
    flex-wrap: wrap;
  }

  .attendance-scope-btn {
    flex: 1 1 180px;
    min-height: 44px;
  }
}

@media (max-width: 576px) {
  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    padding: 0.75rem;
    border-radius: 16px;
  }

  .attendance-toolbar-actions {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-toolbar-actions .pagination-btn {
    min-height: 48px;
  }

  .attendance-scope-switch {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-legend-pill {
    flex: 1 1 calc(50% - 0.35rem);
    text-align: center;
  }
}

@media (max-width: 360px) {
  .attendance-summary-grid,
  .attendance-history-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .attendance-summary-card:last-child {
    grid-column: auto;
  }
}
</style>



