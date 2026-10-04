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
            <img v-if="teacherAvatarUrl" :src="teacherAvatarUrl" alt="" @error="$event.currentTarget.remove()">
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
                  <UserNotificationList :notifications="notifications" :loading="isNotificationsLoading" @select="closeNotificationsPanel" />
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
          <div class="lessons-hero">
            <div class="lessons-hero-copy">
              <span class="lessons-kicker">Teaching library</span>
              <h3 class="section-title">Teacher Lessons</h3>
              <p class="section-subtitle">Find, preview, and manage your uploaded learning materials in one organized workspace.</p>
            </div>
            <div class="lessons-upload-summary" aria-label="Lesson upload summary">
              <span class="lessons-summary-icon" aria-hidden="true">
                <i class="fas fa-cloud-upload-alt"></i>
              </span>
              <span class="lessons-summary-copy">
                <strong>{{ normalizedLessons.length }}</strong>
                <span>lesson{{ normalizedLessons.length === 1 ? '' : 's' }}</span>
              </span>
              <span class="lessons-summary-divider" aria-hidden="true"></span>
              <span class="lessons-summary-copy">
                <strong>{{ lessonAttachmentTotal }}</strong>
                <span>file{{ lessonAttachmentTotal === 1 ? '' : 's' }} uploaded</span>
              </span>
            </div>
          </div>

          <div class="lessons-toolbar" aria-label="Lesson filters">
            <label class="lessons-search">
              <span class="sr-only">Search lessons</span>
              <i class="fas fa-search" aria-hidden="true"></i>
              <input
                v-model.trim="lessonSearchQuery"
                type="search"
                placeholder="Search lessons, classes, or files"
                aria-label="Search lessons, classes, or files"
              />
              <button
                v-if="lessonSearchQuery"
                type="button"
                class="lessons-search-clear"
                aria-label="Clear lesson search"
                title="Clear search"
                @click="lessonSearchQuery = ''"
              >
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </label>

            <label class="lessons-select-field">
              <i class="fas fa-book" aria-hidden="true"></i>
              <span class="sr-only">Filter lessons by subject</span>
              <select v-model="lessonSubjectFilter" aria-label="Filter lessons by subject">
                <option value="all">All subjects</option>
                <option v-for="subject in lessonSubjectOptions" :key="`lesson-filter-${subject}`" :value="subject">
                  {{ subject }}
                </option>
              </select>
              <i class="fas fa-chevron-down lessons-select-chevron" aria-hidden="true"></i>
            </label>

            <label class="lessons-select-field">
              <i class="fas fa-sort-amount-down" aria-hidden="true"></i>
              <span class="sr-only">Sort lessons</span>
              <select v-model="lessonSortOrder" aria-label="Sort lessons">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </select>
              <i class="fas fa-chevron-down lessons-select-chevron" aria-hidden="true"></i>
            </label>
          </div>

          <div v-if="lessonActionMessage" class="lesson-action-banner" :class="lessonActionMessageType" role="status">
            <i class="fas" :class="lessonActionMessageType === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'" aria-hidden="true"></i>
            <span>{{ lessonActionMessage }}</span>
            <button type="button" aria-label="Dismiss message" @click="lessonActionMessage = ''">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>

          <div v-if="lessonsHaveFilters" class="lessons-results-bar" aria-live="polite">
            <span>Showing {{ filteredLessons.length }} of {{ normalizedLessons.length }} lessons</span>
            <button type="button" @click="clearLessonFilters">
              Clear filters
            </button>
          </div>

          <div class="records-feed-wrap">
            <div v-if="isLoading" class="table-state">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading lesson records...</span>
            </div>

            <div v-else-if="filteredLessons.length === 0" class="table-state">
              <span class="lessons-empty-icon"><i class="fas fa-folder-open"></i></span>
              <span>{{ normalizedLessons.length ? 'No lessons match your current filters.' : 'No lessons uploaded yet.' }}</span>
              <button v-if="lessonsHaveFilters" type="button" class="lessons-empty-action" @click="clearLessonFilters">
                Reset filters
              </button>
            </div>

            <div v-else class="records-feed records-feed-lessons">
              <article
                v-for="(lesson, lessonIndex) in paginatedLessons"
                :key="lesson.id"
                class="record-card lesson-document-card"
                :style="{ '--lesson-index': lessonIndex }"
              >
                <header class="record-card-header">
                  <div class="record-card-title">
                    <span class="record-type-label">
                      <i class="fas fa-file-alt" aria-hidden="true"></i>
                      Lesson material
                    </span>
                    <h4>{{ lesson.title }}</h4>
                  </div>
                  <div class="lesson-card-header-actions">
                    <div class="record-card-date-group">
                      <i class="far fa-calendar-alt" aria-hidden="true"></i>
                      <span>
                        <span class="record-date-label">Published</span>
                        <span class="record-card-date">{{ formatDate(lesson.createdAt) }}</span>
                      </span>
                    </div>
                    <div class="lesson-manage-actions" aria-label="Manage lesson">
                      <button type="button" title="Edit lesson" @click="openLessonEditModal(lesson)">
                        <i class="fas fa-pen" aria-hidden="true"></i>
                        <span>Edit</span>
                      </button>
                      <button type="button" title="Add lesson to other classes" @click="openLessonCopyModal(lesson)">
                        <i class="fas fa-plus" aria-hidden="true"></i>
                        <span>Add to classes</span>
                      </button>
                    </div>
                  </div>
                </header>

                <div class="record-chip-row">
                  <span class="record-chip chip-class">
                    <i class="fas fa-users" aria-hidden="true"></i>
                    <span class="record-chip-label">Class:</span>
                    <span class="record-chip-value">{{ lesson.className || 'Not assigned' }}</span>
                  </span>
                  <span class="record-chip chip-subject">
                    <i class="fas fa-book-open" aria-hidden="true"></i>
                    <span class="record-chip-value">{{ lesson.subject || 'N/A' }}</span>
                  </span>
                  <span class="record-chip chip-neutral">
                    <i class="fas fa-paperclip" aria-hidden="true"></i>
                    {{ Array.isArray(lesson.attachments) && lesson.attachments.length > 0 ? `${lesson.attachments.length} attachment${lesson.attachments.length > 1 ? 's' : ''}` : '1 file' }}
                  </span>
                </div>

                <div class="record-card-body">
                  <template v-if="Array.isArray(lesson.attachments) && lesson.attachments.length > 0">
                    <div v-for="attachment in lesson.attachments" :key="attachment.id" class="attachment-row">
                      <div class="attachment-icon" :class="getLessonFileTypeClass(attachment.fileType, attachment.fileName)" aria-hidden="true">
                        <i :class="getLessonFileIcon(attachment.fileType, attachment.fileName)"></i>
                      </div>
                      <div class="attachment-info">
                        <span class="file-name">{{ attachment.fileName || 'Attachment' }}</span>
                        <span class="file-type" :class="getLessonFileTypeClass(attachment.fileType, attachment.fileName)">
                          {{ getLessonFileTypeLabel(attachment.fileType, attachment.fileName) }}
                        </span>
                      </div>
                      <div class="attachment-actions">
                        <button
                          v-if="attachment.downloadUrl"
                          type="button"
                          class="record-link record-link-button"
                          data-tour="records-download-action"
                          aria-label="Download attachment"
                          title="Download"
                          @click="downloadAttachment(attachment)"
                        >
                          <i class="fas fa-download" aria-hidden="true"></i>
                          <span class="sr-only">Download</span>
                        </button>
                        <a
                          v-if="attachment.canPreviewInline && attachment.url"
                          class="record-link record-link-preview"
                          :href="attachment.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Preview attachment in a new tab"
                          title="Preview"
                        >
                          <i class="far fa-eye" aria-hidden="true"></i>
                          <span class="sr-only">Preview</span>
                        </a>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="attachment-row">
                      <div class="attachment-icon file-pdf" aria-hidden="true">
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
                          aria-label="Download lesson file"
                          title="Download"
                          @click="downloadLesson(lesson)"
                        >
                          <i class="fas fa-download" aria-hidden="true"></i>
                          <span class="sr-only">Download</span>
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
                  aria-label="Go to previous lesson page"
                  :disabled="lessonPage === 1"
                  @click="changeLessonPage(-1)"
                >
                  <i class="fas fa-chevron-left" aria-hidden="true"></i>
                  <span>Previous</span>
                </button>
                <div class="lessons-page-numbers" aria-label="Lesson pages">
                  <button
                    v-for="pageNumber in lessonPageNumbers"
                    :key="`lesson-page-${pageNumber}`"
                    type="button"
                    class="lessons-page-btn"
                    :class="{ active: lessonPage === pageNumber }"
                    :aria-label="`Go to lesson page ${pageNumber}`"
                    :aria-current="lessonPage === pageNumber ? 'page' : undefined"
                    @click="lessonPage = pageNumber"
                  >
                    {{ pageNumber }}
                  </button>
                </div>
                <button
                  type="button"
                  class="pagination-btn"
                  aria-label="Go to next lesson page"
                  :disabled="lessonPage >= lessonTotalPages"
                  @click="changeLessonPage(1)"
                >
                  <span>Next</span>
                  <i class="fas fa-chevron-right" aria-hidden="true"></i>
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
          <div class="assessments-hero">
            <div class="assessments-hero-copy">
              <span class="assessments-kicker">Assessment center</span>
              <h3 class="section-title">Activities &amp; Exams</h3>
              <p class="section-subtitle">Review assessment details, deadlines, submissions, and performance from one focused workspace.</p>
              <button type="button" class="btn btn-outline btn-sm assessment-weights-button" :disabled="teacherSubjects.length === 0" @click="openAssessmentWeights">
                <i class="fas fa-scale-balanced"></i> Configure grading weights
              </button>
            </div>
            <div class="assessments-summary" aria-label="Assessment summary">
              <div class="assessments-summary-item">
                <span class="assessments-summary-icon"><i class="fas fa-clipboard-check" aria-hidden="true"></i></span>
                <span>
                  <strong>{{ normalizedAssessments.length }}</strong>
                  <small>assessment{{ normalizedAssessments.length === 1 ? '' : 's' }}</small>
                </span>
              </div>
              <span class="assessments-summary-divider" aria-hidden="true"></span>
              <div class="assessments-summary-item">
                <span class="assessments-summary-icon submissions"><i class="fas fa-user-check" aria-hidden="true"></i></span>
                <span>
                  <strong>{{ assessmentSubmissionTotal }}</strong>
                  <small>submission{{ assessmentSubmissionTotal === 1 ? '' : 's' }}</small>
                </span>
              </div>
            </div>
          </div>

          <div class="assessments-toolbar" aria-label="Assessment filters">
            <label class="assessments-search">
              <span class="sr-only">Search assessments</span>
              <i class="fas fa-search" aria-hidden="true"></i>
              <input
                v-model.trim="assessmentSearchQuery"
                type="search"
                placeholder="Search assessments, classes, or lessons"
                aria-label="Search assessments, classes, or lessons"
              />
              <button
                v-if="assessmentSearchQuery"
                type="button"
                class="assessments-search-clear"
                aria-label="Clear assessment search"
                title="Clear search"
                @click="assessmentSearchQuery = ''"
              >
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </label>

            <label class="assessments-select-field">
              <i class="fas fa-book" aria-hidden="true"></i>
              <span class="sr-only">Filter assessments by subject</span>
              <select v-model="assessmentSubjectFilter" aria-label="Filter assessments by subject">
                <option value="all">All subjects</option>
                <option v-for="subject in assessmentSubjectOptions" :key="`assessment-subject-${subject}`" :value="subject">
                  {{ subject }}
                </option>
              </select>
              <i class="fas fa-chevron-down assessments-select-chevron" aria-hidden="true"></i>
            </label>

            <label class="assessments-select-field">
              <i class="fas fa-layer-group" aria-hidden="true"></i>
              <span class="sr-only">Filter assessments by type</span>
              <select v-model="assessmentTypeFilter" aria-label="Filter assessments by type">
                <option value="all">All types</option>
                <option value="exam">Exams</option>
                <option value="quiz">Quizzes</option>
                <option value="activity">Activities</option>
              </select>
              <i class="fas fa-chevron-down assessments-select-chevron" aria-hidden="true"></i>
            </label>

            <label class="assessments-select-field">
              <i class="fas fa-sort-amount-down" aria-hidden="true"></i>
              <span class="sr-only">Sort assessments</span>
              <select v-model="assessmentSortOrder" aria-label="Sort assessments">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
                <option value="deadline">Deadline</option>
              </select>
              <i class="fas fa-chevron-down assessments-select-chevron" aria-hidden="true"></i>
            </label>
          </div>

          <div v-if="assessmentActionMessage" class="assessment-action-banner" role="status">
            <i class="fas fa-circle-check" aria-hidden="true"></i>
            <span>{{ assessmentActionMessage }}</span>
            <button type="button" aria-label="Dismiss message" @click="assessmentActionMessage = ''">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>

          <div v-if="assessmentsHaveFilters" class="assessments-results-bar" aria-live="polite">
            <span>Showing {{ filteredAssessments.length }} of {{ normalizedAssessments.length }} assessments</span>
            <button type="button" @click="clearAssessmentFilters">Clear filters</button>
          </div>

          <div class="records-feed-wrap">
            <div v-if="isLoading" class="table-state">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading assessment records...</span>
            </div>

            <div v-else-if="filteredAssessments.length === 0" class="table-state">
              <span class="assessments-empty-icon"><i class="fas fa-clipboard-list"></i></span>
              <span>{{ normalizedAssessments.length ? 'No assessments match your current filters.' : 'No assessments created yet.' }}</span>
              <button v-if="assessmentsHaveFilters" type="button" class="assessments-empty-action" @click="clearAssessmentFilters">
                Reset filters
              </button>
            </div>

            <div v-else class="records-feed records-feed-assessments">
              <article
                v-for="(assessment, assessmentIndex) in paginatedAssessments"
                :key="assessment.id"
                class="record-card assessment-record-card"
                :class="`assessment-kind-${getAssessmentTypeKey(assessment)}`"
                :style="{ '--assessment-index': assessmentIndex }"
              >
                <header class="record-card-header">
                  <span class="assessment-kind-icon" aria-hidden="true">
                    <i :class="getAssessmentTypeIcon(assessment)"></i>
                  </span>
                  <div class="record-card-title">
                    <span class="record-type-label">{{ getAssessmentTypeLabel(assessment) }}</span>
                    <h4>{{ assessment.title }}</h4>
                    <p><i class="fas fa-link" aria-hidden="true"></i>{{ assessment.lessonTitle || 'Unlinked lesson' }}</p>
                  </div>
                  <div class="record-card-date-group">
                    <i class="far fa-calendar-alt" aria-hidden="true"></i>
                    <span>
                      <span class="record-date-label">Created</span>
                      <span class="record-card-date">{{ formatDate(assessment.createdAt) }}</span>
                    </span>
                  </div>
                </header>

                <div class="record-chip-row">
                  <span class="record-chip chip-class">
                    <i class="fas fa-users" aria-hidden="true"></i>
                    <span class="record-chip-label">Class:</span>
                    {{ assessment.className || 'Not assigned' }}
                  </span>
                  <span class="record-chip chip-subject"><i class="fas fa-book-open" aria-hidden="true"></i>{{ assessment.subject || 'N/A' }}</span>
                  <span v-if="assessment.gradingPeriod" class="record-chip chip-neutral"><i class="far fa-calendar" aria-hidden="true"></i>{{ assessment.gradingPeriod }} Grading</span>
                  <span v-if="assessment.countsTowardRecommendation" class="record-chip chip-success"><i class="fas fa-star" aria-hidden="true"></i>Recommendation Basis</span>
                  <span class="record-chip chip-type">{{ formatLabel(assessment.examType || 'Assessment') }}</span>
                  <span class="difficulty-pill" :class="`difficulty-${String(assessment.difficulty || '').toLowerCase()}`">
                    {{ formatLabel(assessment.difficulty || 'Medium') }}
                  </span>
                </div>

                <div class="assessment-meta-grid">
                  <div class="meta-item">
                    <div class="meta-item-icon">
                      <i class="fas fa-list-ol"></i>
                    </div>
                    <div class="meta-item-copy">
                      <span>Items</span>
                      <strong>{{ assessment.numberOfItems }}</strong>
                    </div>
                  </div>
                  <div class="meta-item">
                    <div class="meta-item-icon">
                      <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="meta-item-copy">
                      <span>Deadline</span>
                      <strong>{{ assessment.submissionDeadline ? formatDateTime(assessment.submissionDeadline) : 'No deadline' }}</strong>
                    </div>
                  </div>
                  <div class="meta-item">
                    <div class="meta-item-icon">
                      <i class="fas fa-user-check"></i>
                    </div>
                    <div class="meta-item-copy">
                      <span>Submissions</span>
                      <strong>{{ assessment.submissionsCount }}</strong>
                    </div>
                  </div>
                </div>

                <div class="assessment-results-block">
                  <div class="assessment-results-header">
                    <div class="assessment-results-title">
                      <span class="assessment-results-heading-icon" aria-hidden="true"><i class="fas fa-chart-line"></i></span>
                      <div>
                      <span>{{ getAssessmentResultsSectionTitle(assessment) }}</span>
                      <p>{{ getAssessmentResultsSectionCopy(assessment) }}</p>
                      </div>
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
                  <button type="button" class="record-link record-link-button assessment-action-secondary" @click="openAssessmentEditModal(assessment)">
                    <i class="fas fa-pen"></i>
                    Edit
                  </button>
                  <button type="button" class="record-link record-link-button assessment-action-secondary" @click="openAssessmentCopyModal(assessment)">
                    <i class="fas fa-plus"></i>
                    Add to Classes
                  </button>
                  <button type="button" class="record-link record-link-button assessment-action-secondary" @click="openDeadlineEditor(assessment)">
                    <i class="fas fa-calendar-pen"></i>
                    Edit Deadline
                  </button>
                  <button v-if="!isActivityAssessment(assessment)" type="button" class="record-link record-link-button assessment-action-primary" @click="openAnswerKey(assessment)">
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
                  aria-label="Go to previous assessment page"
                  :disabled="assessmentPage === 1"
                  @click="changeAssessmentPage(-1)"
                >
                  <i class="fas fa-chevron-left" aria-hidden="true"></i>
                  <span>Previous</span>
                </button>
                <div class="assessments-page-numbers" aria-label="Assessment pages">
                  <button
                    v-for="pageNumber in assessmentPageNumbers"
                    :key="`assessment-page-${pageNumber}`"
                    type="button"
                    class="assessments-page-btn"
                    :class="{ active: assessmentPage === pageNumber }"
                    :aria-label="`Go to assessment page ${pageNumber}`"
                    :aria-current="assessmentPage === pageNumber ? 'page' : undefined"
                    @click="assessmentPage = pageNumber"
                  >
                    {{ pageNumber }}
                  </button>
                </div>
                <button
                  type="button"
                  class="pagination-btn"
                  aria-label="Go to next assessment page"
                  :disabled="assessmentPage >= assessmentTotalPages"
                  @click="changeAssessmentPage(1)"
                >
                  <span>Next</span>
                  <i class="fas fa-chevron-right" aria-hidden="true"></i>
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
          <div class="attendance-workspace-hero">
            <div class="attendance-workspace-heading">
              <span class="attendance-workspace-icon" aria-hidden="true"><i class="fas fa-user-check"></i></span>
              <div>
                <span class="attendance-workspace-kicker">Classroom workspace</span>
                <h3 class="section-title">Attendance</h3>
                <p class="section-subtitle">Take daily attendance, manage student statuses, and review saved class records.</p>
              </div>
            </div>
            <div class="attendance-workspace-context">
              <span><i class="far fa-calendar-alt" aria-hidden="true"></i>{{ attendanceSelectedDateLabel }}</span>
              <span><i class="fas fa-layer-group" aria-hidden="true"></i>{{ isAdvisoryAttendance ? 'Advisory section' : 'Handled class' }}</span>
            </div>

            <div class="attendance-summary-grid" aria-label="Attendance snapshot">
              <article class="attendance-summary-card status-total">
                <div class="attendance-summary-card-head">
                  <i class="fas fa-users attendance-summary-icon" aria-hidden="true"></i>
                  <span>Total Students</span>
                </div>
                <strong>{{ attendanceSnapshot.totalStudents }}</strong>
                <small>Enrolled roster</small>
              </article>
              <article class="attendance-summary-card status-present">
                <div class="attendance-summary-card-head">
                  <i class="fas fa-user-check attendance-summary-icon" aria-hidden="true"></i>
                  <span>Present</span>
                </div>
                <strong>{{ attendanceSnapshot.presentCount }}</strong>
                <small>In class today</small>
              </article>
              <article class="attendance-summary-card status-late">
                <div class="attendance-summary-card-head">
                  <i class="fas fa-clock attendance-summary-icon" aria-hidden="true"></i>
                  <span>Late</span>
                </div>
                <strong>{{ attendanceSnapshot.lateCount }}</strong>
                <small>Arrived late</small>
              </article>
              <article class="attendance-summary-card status-absent">
                <div class="attendance-summary-card-head">
                  <i class="fas fa-user-times attendance-summary-icon" aria-hidden="true"></i>
                  <span>Absent</span>
                </div>
                <strong>{{ attendanceSnapshot.absentCount }}</strong>
                <small>Not in class</small>
              </article>
              <article class="attendance-summary-card status-excused">
                <div class="attendance-summary-card-head">
                  <i class="fas fa-file-alt attendance-summary-icon" aria-hidden="true"></i>
                  <span>Excused</span>
                </div>
                <strong>{{ attendanceSnapshot.excusedCount }}</strong>
                <small>With permission</small>
              </article>
            </div>
          </div>

          <div class="attendance-shell">
            <section class="attendance-toolbar-card">
              <div class="attendance-toolbar-title-row">
                <div>
                  <span class="attendance-toolbar-kicker"><i class="fas fa-sliders-h" aria-hidden="true"></i>Attendance controls</span>
                  <h5>Choose a class and date to manage attendance</h5>
                </div>
                <span class="attendance-toolbar-note">{{ attendanceToolbarHint }}</span>
              </div>

              <div class="attendance-primary-toolbar">
                <div class="attendance-toolbar-control attendance-toolbar-scope-control">
                  <span class="attendance-control-label">Scope</span>
                  <div class="attendance-scope-switch" role="tablist" aria-label="Attendance scope">
                    <button
                      type="button"
                      class="attendance-scope-btn"
                      :class="{ active: attendanceScope === 'handled_class' }"
                      @click="attendanceScope = 'handled_class'"
                    >
                      <i class="fas fa-chalkboard" aria-hidden="true"></i>
                      <span>Classes</span>
                    </button>
                    <button
                      type="button"
                      class="attendance-scope-btn"
                      :class="{ active: attendanceScope === 'advisory_class' }"
                      :disabled="!teacherAdvisorySection"
                      @click="attendanceScope = 'advisory_class'"
                    >
                      <i class="fas fa-users" aria-hidden="true"></i>
                      <span>Advisory</span>
                    </button>
                  </div>
                </div>

                <div class="attendance-toolbar-control attendance-toolbar-class-control">
                  <label v-if="!isAdvisoryAttendance" class="attendance-control-field">
                    <span class="attendance-control-label">Class</span>
                    <span class="attendance-control-input">
                      <i class="fas fa-book-open" aria-hidden="true"></i>
                      <select v-model="attendanceSubjectId" aria-label="Select handled class">
                        <option value="" disabled>Select class</option>
                        <option v-for="subject in attendanceSubjectOptions" :key="`attendance-subject-${subject.id}`" :value="subject.id">
                          {{ subject.label }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down attendance-control-chevron" aria-hidden="true"></i>
                    </span>
                  </label>
                  <div v-else class="attendance-control-field">
                    <span class="attendance-control-label">Advisory section</span>
                    <span class="attendance-control-input attendance-control-readonly">
                      <i class="fas fa-users" aria-hidden="true"></i>
                      <strong>{{ teacherAdvisorySection?.name || 'No advisory section assigned' }}</strong>
                    </span>
                  </div>
                </div>

                <div class="attendance-toolbar-control attendance-toolbar-date-control">
                  <label class="attendance-control-field">
                    <span class="attendance-control-label">Date</span>
                    <span class="attendance-control-input">
                      <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                      <input v-model="attendanceDateKey" type="date" aria-label="Attendance date" />
                    </span>
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
                </div>

                <div class="attendance-toolbar-control attendance-toolbar-search-control">
                  <label class="attendance-control-field">
                    <span class="attendance-control-label">Find student</span>
                    <span class="attendance-control-input">
                      <i class="fas fa-search" aria-hidden="true"></i>
                      <input
                        v-model="attendanceSearchQuery"
                        type="search"
                        placeholder="Name, email, grade, or section"
                        aria-label="Search students in attendance roster"
                      />
                    </span>
                  </label>
                </div>

                <div class="attendance-toolbar-control attendance-toolbar-status-control">
                  <label class="attendance-control-field">
                    <span class="attendance-control-label">Status</span>
                    <span class="attendance-control-input">
                      <i class="fas fa-filter" aria-hidden="true"></i>
                      <select v-model="attendanceStatusFilter" aria-label="Filter roster by attendance status">
                        <option value="all">All students</option>
                        <option
                          v-for="status in attendanceStatuses"
                          :key="`attendance-filter-${status}`"
                          :value="status.toLowerCase()"
                        >
                          {{ status }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down attendance-control-chevron" aria-hidden="true"></i>
                    </span>
                  </label>
                </div>

                <div class="attendance-toolbar-control attendance-toolbar-actions-control">
                  <span class="attendance-control-label">Actions</span>
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
                </div>
              </div>

              <div class="attendance-toolbar-footer">
                <span class="attendance-toolbar-helper">
                  <i class="fas fa-info-circle" aria-hidden="true"></i>
                  Select a class and date, load the roster, then save or lock when complete.
                </span>
                <div class="attendance-legend-block">
                  <span class="attendance-legend-title">Status guide</span>
                  <div class="attendance-legend-row">
                    <span class="attendance-legend-pill status-present">Present</span>
                    <span class="attendance-legend-pill status-late">Late</span>
                    <span class="attendance-legend-pill status-absent">Absent</span>
                    <span class="attendance-legend-pill status-excused">Excused</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <p
            v-if="attendanceMessage"
            class="attendance-feedback"
            :class="attendanceMessageType === 'error' ? 'attendance-feedback-error' : 'attendance-feedback-success'"
            role="alert"
            aria-live="polite"
          >
            {{ attendanceMessage }}
          </p>

          <div class="attendance-layout">
            <article class="attendance-panel">
              <div class="attendance-panel-head">
                <div class="attendance-panel-title">
                  <span class="attendance-panel-title-icon" aria-hidden="true"><i class="fas fa-users"></i></span>
                  <div>
                  <span class="attendance-panel-kicker">Attendance Roster</span>
                    <p>Search students and update their attendance status.</p>
                  </div>
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
                <div class="attendance-bulk-toolbar">
                  <div class="attendance-bulk-actions">
                    <span>Mark visible students</span>
                    <div class="attendance-bulk-action-row" role="group" aria-label="Bulk attendance status">
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
                    <i class="fas fa-times" aria-hidden="true"></i>
                    Clear filters
                  </button>
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
                            <div class="attendance-student-avatar" aria-hidden="true">
                              <i class="fas fa-user"></i>
                            </div>
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

            <details class="attendance-panel attendance-history-panel">
              <summary class="attendance-history-summary">
                <div class="attendance-panel-head">
                  <div class="attendance-panel-title">
                    <span class="attendance-panel-title-icon history" aria-hidden="true"><i class="fas fa-history"></i></span>
                    <div>
                    <span class="attendance-panel-kicker">Attendance History</span>
                      <p>Review recent saved and locked records.</p>
                    </div>
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

      <div v-if="showWeightsModal" class="records-modal-backdrop" @click.self="showWeightsModal = false">
        <div class="records-modal-dialog weights-dialog">
          <div class="records-modal-header"><div><h3>Subject Grading Weights</h3><p>Choose how Activities, Quizzes, and Exams contribute to subject performance.</p></div><button type="button" class="sidebar-close" @click="showWeightsModal = false"><i class="fas fa-times"></i></button></div>
          <div class="records-modal-body weights-form">
            <label><span>Class / Subject</span><select v-model="weightsSubjectId" @change="loadAssessmentWeights"><option v-for="subject in teacherSubjects" :key="subject.id" :value="subject.id">{{ subject.className || subject.name }} — {{ subject.name }}</option></select></label>
            <div class="weights-grid">
              <label><span>Activities (%)</span><input v-model.number="weightsForm.activity" type="number" min="0" max="100" /></label>
              <label><span>Quizzes (%)</span><input v-model.number="weightsForm.quiz" type="number" min="0" max="100" /></label>
              <label><span>Exams (%)</span><input v-model.number="weightsForm.exam" type="number" min="0" max="100" /></label>
            </div>
            <label><span>Minimum graded results before ranking</span><input v-model.number="weightsForm.minimumEvidenceCount" type="number" min="1" max="20" /></label>
            <p class="weights-total" :class="{ invalid: weightsTotal !== 100 }">Total: {{ weightsTotal }}% {{ weightsTotal === 100 ? '✓' : '— must equal 100%' }}</p>
            <p v-if="weightsError" class="field-error">{{ weightsError }}</p>
          </div>
          <div class="records-modal-footer"><button type="button" class="btn btn-outline" @click="showWeightsModal = false">Cancel</button><button type="button" class="btn btn-primary" :disabled="isSavingWeights || weightsTotal !== 100" @click="saveAssessmentWeights">{{ isSavingWeights ? 'Saving...' : 'Save Weights' }}</button></div>
        </div>
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

                  <section v-if="result.hasEssayEvaluation" class="activity-result-section activity-ai-review">
                    <span class="activity-result-section-label">AI-assisted essay evaluation</span>
                    <p class="activity-ai-review__status">
                      Suggested score: <strong>{{ result.aiScore }}/{{ result.totalPoints }}</strong>
                      <span>Teacher approval is required before this becomes the student's final grade.</span>
                    </p>
                    <article v-for="evaluation in result.aiEvaluations" :key="evaluation.questionIndex" class="activity-ai-review__item">
                      <strong>{{ evaluation.scoreEarned }}/{{ evaluation.maximumScore }} points</strong>
                      <p>{{ evaluation.explanation }}</p>
                      <small v-if="evaluation.strengths?.length">Strengths: {{ evaluation.strengths.join(', ') }}</small>
                      <small v-if="evaluation.areasForImprovement?.length">Improve: {{ evaluation.areasForImprovement.join(', ') }}</small>
                    </article>
                  </section>

                  <section v-if="result.teacherFeedback" class="activity-result-section activity-result-feedback">
                    <span class="activity-result-section-label">Teacher Feedback</span>
                    <p>{{ result.teacherFeedback }}</p>
                  </section>

                  <section class="activity-grading-panel">
                    <div class="activity-grading-fields">
                      <label>
                        <span>Grade (0–{{ selectedAssessmentForResults.activityPoints }})</span>
                        <input v-model.number="result.reviewGrade" type="number" min="0" :max="selectedAssessmentForResults.activityPoints" :disabled="result.isReviewing" />
                      </label>
                      <label class="feedback-field">
                        <span>Teacher feedback</span>
                        <textarea v-model.trim="result.reviewFeedback" rows="3" placeholder="Add constructive feedback for the student..." :disabled="result.isReviewing"></textarea>
                      </label>
                    </div>
                    <p v-if="result.reviewError" class="field-error" role="alert">{{ result.reviewError }}</p>
                    <div class="activity-grading-actions">
                      <button type="button" class="btn btn-outline" :disabled="result.isReviewing || selectedAssessmentForResults.allowResubmission === false" @click="reviewActivityResult(result, 'return_for_revision')">
                        <i class="fas fa-rotate-left"></i> Return for Revision
                      </button>
                      <button type="button" class="btn btn-primary" :disabled="result.isReviewing" @click="reviewActivityResult(result, 'grade')">
                        <i class="fas" :class="result.isReviewing ? 'fa-spinner fa-spin' : 'fa-check'"></i> {{ result.isReviewing ? 'Saving...' : 'Save & Publish Grade' }}
                      </button>
                    </div>
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
                    <th>AI / Teacher Review</th>
                    <th>Integrity</th>
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
                    <td>{{ result.score }} / {{ result.totalPoints }}</td>
                    <td>{{ result.percentage }}%</td>
                    <td>
                      <span
                        class="status-pill"
                        :class="result.passFailStatus === 'pass' ? 'status-active' : 'status-suspended'"
                      >
                        {{ result.passFailStatus === 'pass' ? 'Pass' : 'Fail' }}
                      </span>
                    </td>
                    <td>
                      <details v-if="result.hasEssayEvaluation" class="essay-review-details">
                        <summary>{{ result.scoringStatus === 'pending_teacher_review' ? 'Review required' : `AI: ${result.aiScore}/${result.totalPoints}` }}</summary>
                        <div class="essay-review-body">
                          <article v-for="evaluation in result.aiEvaluations" :key="evaluation.questionIndex">
                            <strong>Essay {{ Number(evaluation.questionIndex) + 1 }}: {{ evaluation.scoreEarned }}/{{ evaluation.maximumScore }}</strong>
                            <p>{{ evaluation.explanation }}</p>
                            <small v-if="evaluation.studentFeedback">{{ evaluation.studentFeedback }}</small>
                          </article>
                          <label><span>Final score (0–{{ result.totalPoints }})</span><input v-model.number="result.reviewGrade" type="number" min="0" :max="result.totalPoints" /></label>
                          <label><span>Teacher feedback</span><textarea v-model.trim="result.reviewFeedback" rows="2"></textarea></label>
                          <p v-if="result.reviewError" class="field-error">{{ result.reviewError }}</p>
                          <button type="button" class="btn btn-primary btn-sm" :disabled="result.isReviewing" @click="reviewActivityResult(result, 'grade')">{{ result.isReviewing ? 'Saving...' : 'Approve / Override' }}</button>
                        </div>
                      </details>
                      <span v-else>Objective grading</span>
                    </td>
                    <td>
                      <details v-if="result.violationCount > 0" class="integrity-log-details">
                        <summary>
                          <span class="integrity-count has-violations"><i class="fas fa-triangle-exclamation"></i>{{ result.violationCount }} violation{{ result.violationCount === 1 ? '' : 's' }}</span>
                        </summary>
                        <div class="integrity-log-popover">
                          <strong>Integrity activity</strong>
                          <span v-if="result.terminationReason" class="integrity-termination">Outcome: {{ formatLabel(result.terminationReason) }}</span>
                          <ol>
                            <li v-for="(event, eventIndex) in getViolationEvents(result)" :key="`${result.id}-violation-${eventIndex}`">
                              <span>{{ event.message || formatLabel(event.type) }}</span>
                              <small>{{ formatDateTime(event.occurredAt) }}</small>
                            </li>
                          </ol>
                        </div>
                      </details>
                      <span v-else class="integrity-count is-clear"><i class="fas fa-shield-halved"></i>Clear</span>
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

      <div v-if="showLessonEditModal && selectedLessonForEdit" class="records-modal-backdrop" @click.self="closeLessonEditModal">
        <div class="records-modal-dialog lesson-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-edit-title">
          <div class="records-modal-header">
            <div>
              <h3 id="lesson-edit-title">Edit lesson</h3>
              <p>Correct the lesson details or move it to the right class.</p>
            </div>
            <button type="button" class="lesson-modal-close" aria-label="Close edit lesson" @click="closeLessonEditModal">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <form @submit.prevent="saveLessonEdit">
            <div class="records-modal-body lesson-manage-form">
              <label>
                <span>Lesson title</span>
                <input v-model.trim="lessonEditForm.title" type="text" maxlength="160" required />
              </label>
              <label>
                <span>Class</span>
                <select v-model="lessonEditForm.subjectId" required>
                  <option value="" disabled>Select class</option>
                  <option v-for="classItem in teacherSubjects" :key="`lesson-edit-class-${classItem.id}`" :value="classItem.id">
                    {{ getTeacherClassLabel(classItem) }}
                  </option>
                </select>
              </label>
              <label>
                <span>Description</span>
                <textarea v-model.trim="lessonEditForm.description" rows="5" maxlength="3000" required></textarea>
              </label>
              <p v-if="lessonEditError" class="lesson-manage-error">{{ lessonEditError }}</p>
            </div>
            <div class="records-modal-footer">
              <button type="button" class="lesson-secondary-btn" :disabled="isSavingLessonEdit" @click="closeLessonEditModal">Cancel</button>
              <button type="submit" class="lesson-primary-btn" :disabled="isSavingLessonEdit">
                <i v-if="isSavingLessonEdit" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                {{ isSavingLessonEdit ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showLessonCopyModal && selectedLessonForCopy" class="records-modal-backdrop" @click.self="closeLessonCopyModal">
        <div class="records-modal-dialog lesson-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-copy-title">
          <div class="records-modal-header">
            <div>
              <h3 id="lesson-copy-title">Add lesson to other classes</h3>
              <p>Reuse “{{ selectedLessonForCopy.title }}” and its uploaded file without uploading again.</p>
            </div>
            <button type="button" class="lesson-modal-close" aria-label="Close add to classes" @click="closeLessonCopyModal">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <form @submit.prevent="copyLessonToClasses">
            <div class="records-modal-body lesson-manage-form">
              <div class="lesson-current-class">
                <span>Currently in</span>
                <strong>{{ selectedLessonForCopy.className || 'Unassigned class' }}</strong>
              </div>
              <fieldset class="lesson-class-picker">
                <legend>Select one or more additional classes</legend>
                <label v-for="classItem in availableLessonCopyClasses" :key="`lesson-copy-class-${classItem.id}`">
                  <input v-model="lessonCopySubjectIds" type="checkbox" :value="classItem.id" />
                  <span><strong>{{ classItem.className || classItem.name || 'Class' }}</strong><small>{{ classItem.code || classItem.name || '' }}</small></span>
                </label>
                <p v-if="availableLessonCopyClasses.length === 0" class="lesson-manage-empty">No other classes are available.</p>
              </fieldset>
              <p v-if="lessonCopyError" class="lesson-manage-error">{{ lessonCopyError }}</p>
            </div>
            <div class="records-modal-footer">
              <button type="button" class="lesson-secondary-btn" :disabled="isCopyingLesson" @click="closeLessonCopyModal">Cancel</button>
              <button type="submit" class="lesson-primary-btn" :disabled="isCopyingLesson || lessonCopySubjectIds.length === 0">
                <i v-if="isCopyingLesson" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                {{ isCopyingLesson ? 'Adding...' : `Add to ${lessonCopySubjectIds.length || ''} class${lessonCopySubjectIds.length === 1 ? '' : 'es'}` }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showAssessmentEditModal && selectedAssessmentForEdit" class="records-modal-backdrop" @click.self="closeAssessmentEditModal">
        <div class="records-modal-dialog lesson-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="assessment-edit-title">
          <div class="records-modal-header">
            <div>
              <h3 id="assessment-edit-title">Edit {{ getAssessmentTypeLabel(selectedAssessmentForEdit).toLowerCase() }}</h3>
              <p>Correct its details or move it to the right class.</p>
            </div>
            <button type="button" class="lesson-modal-close" aria-label="Close assessment editor" @click="closeAssessmentEditModal">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <form @submit.prevent="saveAssessmentEdit">
            <div class="records-modal-body lesson-manage-form">
              <label>
                <span>Title</span>
                <input v-model.trim="assessmentEditForm.title" type="text" maxlength="160" required />
              </label>
              <label>
                <span>Class</span>
                <select v-model="assessmentEditForm.subjectId" required>
                  <option value="" disabled>Select class</option>
                  <option v-for="classItem in teacherSubjects" :key="`assessment-edit-class-${classItem.id}`" :value="classItem.id">
                    {{ getTeacherClassLabel(classItem) }}
                  </option>
                </select>
              </label>
              <template v-if="isActivityAssessment(selectedAssessmentForEdit)">
                <label>
                  <span>Activity instructions</span>
                  <textarea v-model.trim="assessmentEditForm.challengeDescription" rows="5" maxlength="5000" required></textarea>
                </label>
                <label>
                  <span>Points</span>
                  <input v-model.number="assessmentEditForm.activityPoints" type="number" min="1" max="100" required />
                </label>
              </template>
              <label v-else>
                <span>Difficulty</span>
                <select v-model="assessmentEditForm.difficulty" required>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <div class="assessment-edit-attachments">
                <span>Attachments</span>
                <p>Drag and drop files or browse. PDF, Office documents, JPG/JPEG, and PNG are supported (10MB each).</p>
                <div
                  class="assessment-edit-dropzone"
                  :class="{ 'is-dragging': isAssessmentEditDropActive }"
                  @dragenter.prevent="isAssessmentEditDropActive = true"
                  @dragover.prevent="isAssessmentEditDropActive = true"
                  @dragleave.prevent="isAssessmentEditDropActive = false"
                  @drop.prevent="handleAssessmentEditDrop"
                  @click="assessmentEditFileInput?.click()"
                >
                  <input ref="assessmentEditFileInput" type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.webp,.zip" @change="handleAssessmentEditFileChange" />
                  <i class="fas fa-cloud-arrow-up" aria-hidden="true"></i>
                  <strong>Drop multiple files here or browse</strong>
                </div>
                <div v-if="assessmentEditForm.existingAttachments.length || assessmentEditForm.newAttachments.length" class="assessment-edit-file-list">
                  <div v-for="attachment in assessmentEditForm.existingAttachments" :key="`existing-${attachment.id}`" class="assessment-edit-file">
                    <span><strong>{{ attachment.fileName }}</strong><small>{{ getAttachmentTypeLabel(attachment) }} · {{ formatBytes(attachment.size) }} · uploaded</small></span>
                    <button type="button" aria-label="Remove attachment" @click="removeExistingAssessmentAttachment(attachment.id)"><i class="fas fa-times"></i></button>
                  </div>
                  <div v-for="file in assessmentEditForm.newAttachments" :key="`new-${file.name}-${file.size}-${file.lastModified}`" class="assessment-edit-file">
                    <span><strong>{{ file.name }}</strong><small>{{ getAttachmentTypeLabel(file) }} · {{ formatBytes(file.size) }} · ready to upload</small></span>
                    <button type="button" aria-label="Remove attachment" @click="removeNewAssessmentAttachment(file)"><i class="fas fa-times"></i></button>
                  </div>
                </div>
                <div v-if="assessmentEditUploadProgress > 0 && assessmentEditUploadProgress < 100" class="assessment-edit-progress"><span :style="{ width: `${assessmentEditUploadProgress}%` }"></span></div>
              </div>
              <p class="lesson-manage-empty">Use “Edit Deadline” on the record card to change its due date.</p>
              <p v-if="assessmentEditError" class="lesson-manage-error">{{ assessmentEditError }}</p>
            </div>
            <div class="records-modal-footer">
              <button type="button" class="lesson-secondary-btn" :disabled="isSavingAssessmentEdit" @click="closeAssessmentEditModal">Cancel</button>
              <button type="submit" class="lesson-primary-btn" :disabled="isSavingAssessmentEdit">
                <i v-if="isSavingAssessmentEdit" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                {{ isSavingAssessmentEdit ? 'Saving...' : 'Save changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showAssessmentCopyModal && selectedAssessmentForCopy" class="records-modal-backdrop" @click.self="closeAssessmentCopyModal">
        <div class="records-modal-dialog lesson-manage-dialog" role="dialog" aria-modal="true" aria-labelledby="assessment-copy-title">
          <div class="records-modal-header">
            <div>
              <h3 id="assessment-copy-title">Add to other classes</h3>
              <p>Copy “{{ selectedAssessmentForCopy.title }}” with its questions, files, settings, and deadline.</p>
            </div>
            <button type="button" class="lesson-modal-close" aria-label="Close add to classes" @click="closeAssessmentCopyModal">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <form @submit.prevent="copyAssessmentToClasses">
            <div class="records-modal-body lesson-manage-form">
              <div class="lesson-current-class">
                <span>Currently in</span>
                <strong>{{ selectedAssessmentForCopy.className || 'Unassigned class' }}</strong>
              </div>
              <fieldset class="lesson-class-picker">
                <legend>Select one or more additional classes</legend>
                <label v-for="classItem in availableAssessmentCopyClasses" :key="`assessment-copy-class-${classItem.id}`">
                  <input v-model="assessmentCopySubjectIds" type="checkbox" :value="classItem.id" />
                  <span><strong>{{ classItem.className || classItem.name || 'Class' }}</strong><small>{{ classItem.code || classItem.name || '' }}</small></span>
                </label>
                <p v-if="availableAssessmentCopyClasses.length === 0" class="lesson-manage-empty">No other classes are available.</p>
              </fieldset>
              <p v-if="assessmentCopyError" class="lesson-manage-error">{{ assessmentCopyError }}</p>
            </div>
            <div class="records-modal-footer">
              <button type="button" class="lesson-secondary-btn" :disabled="isCopyingAssessment" @click="closeAssessmentCopyModal">Cancel</button>
              <button type="submit" class="lesson-primary-btn" :disabled="isCopyingAssessment || assessmentCopySubjectIds.length === 0">
                <i v-if="isCopyingAssessment" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                {{ isCopyingAssessment ? 'Adding...' : `Add to ${assessmentCopySubjectIds.length || ''} class${assessmentCopySubjectIds.length === 1 ? '' : 'es'}` }}
              </button>
            </div>
          </form>
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
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-ghost" :disabled="isFirstTourStep" @click="goToPreviousTourStep">Back</button>
            <button type="button" class="teacher-page-tour-btn teacher-page-tour-btn-primary" @click="goToNextTourStep">
              {{ isFinalTourStep ? 'Finish' : 'Next' }}
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
const TOUR_PROGRESS_PREFIX = 'edumatch_teacher_tour_progress_v3_'
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
const lessonSearchQuery = ref('')
const lessonSubjectFilter = ref('all')
const lessonSortOrder = ref('newest')
const lessonActionMessage = ref('')
const lessonActionMessageType = ref('success')
const showLessonEditModal = ref(false)
const selectedLessonForEdit = ref(null)
const isSavingLessonEdit = ref(false)
const lessonEditError = ref('')
const lessonEditForm = reactive({ title: '', description: '', subjectId: '' })
const showLessonCopyModal = ref(false)
const selectedLessonForCopy = ref(null)
const lessonCopySubjectIds = ref([])
const isCopyingLesson = ref(false)
const lessonCopyError = ref('')
const assessmentPage = ref(1)
const assessmentSearchQuery = ref('')
const assessmentSubjectFilter = ref('all')
const assessmentTypeFilter = ref('all')
const assessmentSortOrder = ref('newest')
const assessmentActionMessage = ref('')
const showAssessmentEditModal = ref(false)
const selectedAssessmentForEdit = ref(null)
const isSavingAssessmentEdit = ref(false)
const assessmentEditError = ref('')
const assessmentEditForm = reactive({
  title: '',
  subjectId: '',
  challengeDescription: '',
  activityPoints: 100,
  difficulty: 'medium',
  existingAttachments: [],
  newAttachments: [],
})
const assessmentEditFileInput = ref(null)
const isAssessmentEditDropActive = ref(false)
const assessmentEditUploadProgress = ref(0)
const showAssessmentCopyModal = ref(false)
const selectedAssessmentForCopy = ref(null)
const assessmentCopySubjectIds = ref([])
const isCopyingAssessment = ref(false)
const assessmentCopyError = ref('')
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
const showWeightsModal = ref(false)
const weightsSubjectId = ref('')
const weightsForm = reactive({ activity: 30, quiz: 30, exam: 40, minimumEvidenceCount: 2 })
const weightsError = ref('')
const isSavingWeights = ref(false)
const weightsTotal = computed(() => Number(weightsForm.activity || 0) + Number(weightsForm.quiz || 0) + Number(weightsForm.exam || 0))
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

const violationEventTypes = new Set([
  'tab_hidden',
  'window_blur',
  'fullscreen_exit',
  'navigation_attempt',
  'inspection_shortcut',
  'copy_attempt',
  'paste_attempt',
  'contextmenu_attempt',
])

const getViolationEvents = (result) => (Array.isArray(result?.activityLog) ? result.activityLog : [])
  .filter((event) => violationEventTypes.has(String(event?.type || '').trim().toLowerCase()))
  .sort((left, right) => new Date(right?.occurredAt || 0).getTime() - new Date(left?.occurredAt || 0).getTime())

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

const normalizedLessons = computed(() => lessons.value.map((lesson) => {
  const subjectId = String(lesson?.subjectId || '').trim()
  const linkedClass = teacherSubjects.value.find((subject) => String(subject?.id || '').trim() === subjectId)

  return {
    ...lesson,
    subject: String(lesson?.subject || '').trim(),
    className: String(lesson?.className || linkedClass?.className || linkedClass?.name || '').trim(),
  }
}))

const normalizedAssessments = computed(() => assessments.value.map((assessment) => {
  const subjectId = String(assessment?.subjectId || '').trim()
  const linkedClass = teacherSubjects.value.find((subject) => String(subject?.id || '').trim() === subjectId)

  return {
    ...assessment,
    subject: String(assessment?.subject || assessment?.lessonSubject || '').trim(),
    className: String(assessment?.className || linkedClass?.className || linkedClass?.name || '').trim(),
  }
}))

const getAssessmentTypeKey = (assessment) => {
  const mode = normalizeSearchText(assessment?.assessmentMode)
  if (mode === 'grading_assessment') return 'exam'
  if (mode === 'quiz') return 'quiz'
  return 'activity'
}

const getAssessmentTypeLabel = (assessment) => ({
  exam: 'Exam',
  quiz: 'Quiz',
  activity: 'Activity',
}[getAssessmentTypeKey(assessment)])

const getAssessmentTypeIcon = (assessment) => ({
  exam: 'fas fa-file-signature',
  quiz: 'fas fa-circle-question',
  activity: 'fas fa-puzzle-piece',
}[getAssessmentTypeKey(assessment)])

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

const lessonSubjectOptions = computed(() => [...new Set(
  normalizedLessons.value
    .map((lesson) => lesson.subject)
    .filter(Boolean)
)].sort((left, right) => left.localeCompare(right)))

const availableLessonCopyClasses = computed(() => {
  const currentSubjectId = String(selectedLessonForCopy.value?.subjectId || '').trim()
  return teacherSubjects.value.filter((classItem) => String(classItem?.id || '').trim() !== currentSubjectId)
})

const lessonAttachmentTotal = computed(() => normalizedLessons.value.reduce((total, lesson) => {
  const attachmentCount = Array.isArray(lesson.attachments) ? lesson.attachments.length : 0
  return total + Math.max(1, attachmentCount)
}, 0))

const lessonsHaveFilters = computed(() => (
  Boolean(lessonSearchQuery.value)
  || lessonSubjectFilter.value !== 'all'
  || lessonSortOrder.value !== 'newest'
))

const filteredLessons = computed(() => {
  const query = normalizeSearchText(lessonSearchQuery.value)
  const selectedSubject = lessonSubjectFilter.value
  const matches = normalizedLessons.value.filter((lesson) => {
    if (selectedSubject !== 'all' && lesson.subject !== selectedSubject) return false
    if (!query) return true

    const attachmentNames = Array.isArray(lesson.attachments)
      ? lesson.attachments.map((attachment) => attachment?.fileName).join(' ')
      : lesson.pdfOriginalName
    return normalizeSearchText(`${lesson.title} ${lesson.className} ${lesson.subject} ${attachmentNames}`).includes(query)
  })

  return [...matches].sort((left, right) => {
    if (lessonSortOrder.value === 'name') {
      return String(left.title || '').localeCompare(String(right.title || ''), undefined, { sensitivity: 'base' })
    }
    const leftTime = new Date(left.createdAt || 0).getTime()
    const rightTime = new Date(right.createdAt || 0).getTime()
    return lessonSortOrder.value === 'oldest' ? leftTime - rightTime : rightTime - leftTime
  })
})

const assessmentSubjectOptions = computed(() => [...new Set(
  normalizedAssessments.value
    .map((assessment) => assessment.subject)
    .filter(Boolean)
)].sort((left, right) => left.localeCompare(right)))

const availableAssessmentCopyClasses = computed(() => {
  const currentSubjectId = String(selectedAssessmentForCopy.value?.subjectId || '').trim()
  return teacherSubjects.value.filter((classItem) => String(classItem?.id || '').trim() !== currentSubjectId)
})

const assessmentSubmissionTotal = computed(() => normalizedAssessments.value.reduce(
  (total, assessment) => total + Number(assessment?.submissionsCount || 0),
  0
))

const assessmentsHaveFilters = computed(() => (
  Boolean(assessmentSearchQuery.value)
  || assessmentSubjectFilter.value !== 'all'
  || assessmentTypeFilter.value !== 'all'
  || assessmentSortOrder.value !== 'newest'
))

const filteredAssessments = computed(() => {
  const query = normalizeSearchText(assessmentSearchQuery.value)
  const matches = normalizedAssessments.value.filter((assessment) => {
    if (assessmentSubjectFilter.value !== 'all' && assessment.subject !== assessmentSubjectFilter.value) return false
    if (assessmentTypeFilter.value !== 'all' && getAssessmentTypeKey(assessment) !== assessmentTypeFilter.value) return false
    if (!query) return true
    return normalizeSearchText(
      `${assessment.title} ${assessment.lessonTitle} ${assessment.className} ${assessment.subject} ${assessment.examType} ${assessment.difficulty}`
    ).includes(query)
  })

  return [...matches].sort((left, right) => {
    if (assessmentSortOrder.value === 'name') {
      return String(left.title || '').localeCompare(String(right.title || ''), undefined, { sensitivity: 'base' })
    }
    if (assessmentSortOrder.value === 'deadline') {
      const leftDeadline = left.submissionDeadline ? new Date(left.submissionDeadline).getTime() : Number.MAX_SAFE_INTEGER
      const rightDeadline = right.submissionDeadline ? new Date(right.submissionDeadline).getTime() : Number.MAX_SAFE_INTEGER
      return leftDeadline - rightDeadline
    }
    const leftTime = new Date(left.createdAt || 0).getTime()
    const rightTime = new Date(right.createdAt || 0).getTime()
    return assessmentSortOrder.value === 'oldest' ? leftTime - rightTime : rightTime - leftTime
  })
})

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

const lessonPageNumbers = computed(() => {
  const total = lessonTotalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  const start = Math.min(Math.max(lessonPage.value - 2, 1), total - 4)
  return Array.from({ length: 5 }, (_, index) => start + index)
})

const paginatedAssessments = computed(() => {
  const start = (assessmentPage.value - 1) * pageSize
  return filteredAssessments.value.slice(start, start + pageSize)
})

const assessmentPageNumbers = computed(() => {
  const total = assessmentTotalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  const start = Math.min(Math.max(assessmentPage.value - 2, 1), total - 4)
  return Array.from({ length: 5 }, (_, index) => start + index)
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

const getLessonFileExtension = (fileType, fileName) => {
  const normalizedType = normalizeSearchText(fileType)
  const extension = String(fileName || '').split('.').pop()?.toLowerCase()
  if (normalizedType.includes('pdf') || extension === 'pdf') return 'pdf'
  if (normalizedType.includes('word') || ['doc', 'docx'].includes(extension)) return 'word'
  if (normalizedType.includes('presentation') || normalizedType.includes('powerpoint') || ['ppt', 'pptx'].includes(extension)) return 'slides'
  if (normalizedType.includes('spreadsheet') || normalizedType.includes('excel') || ['xls', 'xlsx', 'csv'].includes(extension)) return 'sheet'
  if (normalizedType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image'
  if (normalizedType.includes('video') || ['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video'
  return 'file'
}

const getLessonFileTypeClass = (fileType, fileName) => `file-${getLessonFileExtension(fileType, fileName)}`

const getLessonFileTypeLabel = (fileType, fileName) => {
  const labels = {
    pdf: 'PDF',
    word: 'DOC',
    slides: 'SLIDES',
    sheet: 'SHEET',
    image: 'IMAGE',
    video: 'VIDEO',
    file: 'FILE',
  }
  return labels[getLessonFileExtension(fileType, fileName)]
}

const getLessonFileIcon = (fileType, fileName) => {
  const icons = {
    pdf: 'fas fa-file-pdf',
    word: 'fas fa-file-word',
    slides: 'fas fa-file-powerpoint',
    sheet: 'fas fa-file-excel',
    image: 'fas fa-file-image',
    video: 'fas fa-file-video',
    file: 'fas fa-file-alt',
  }
  return icons[getLessonFileExtension(fileType, fileName)]
}

const clearLessonFilters = () => {
  lessonSearchQuery.value = ''
  lessonSubjectFilter.value = 'all'
  lessonSortOrder.value = 'newest'
  lessonPage.value = 1
}

const clearAssessmentFilters = () => {
  assessmentSearchQuery.value = ''
  assessmentSubjectFilter.value = 'all'
  assessmentTypeFilter.value = 'all'
  assessmentSortOrder.value = 'newest'
  assessmentPage.value = 1
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
    const recordResponses = await Promise.allSettled([
      axios.get(`${apiBaseUrl}/teacher/lessons`, getAuthConfig()),
      axios.get(`${apiBaseUrl}/teacher/assessments`, getAuthConfig()),
      axios.get(`${apiBaseUrl}/teacher/students/assessment-results?sort=recent`, getAuthConfig()),
      axios.get(`${apiBaseUrl}/teacher/subjects`, getAuthConfig()),
      axios.get(`${apiBaseUrl}/teacher/sections`, getAuthConfig()),
    ])

    const [lessonsResponse, assessmentsResponse, resultsResponse, subjectsResponse, sectionsResponse] = recordResponses.map((result, index) => {
      if (result.status === 'fulfilled') return result.value
      console.error('Failed to load Records source ' + ['lessons', 'assessments', 'results', 'subjects', 'sections'][index], result.reason)
      return { data: {} }
    })
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
      isLate: result.isLate === true,
      returnedAt: result.returnedAt || null,
      aiEvaluations: Array.isArray(result.aiEvaluations) ? result.aiEvaluations : [],
      aiScore: result.aiScore ?? null,
      teacherAdjustedScore: result.teacherAdjustedScore ?? null,
      scoringStatus: String(result.scoringStatus || 'final'),
      hasEssayEvaluation: result.hasEssayEvaluation === true,
      reviewGrade: result.teacherAdjustedScore ?? result.gradeValue ?? result.aiScore ?? result.score ?? '',
      reviewFeedback: String(result.teacherFeedback || '').trim(),
      reviewError: '',
      isReviewing: false,
      violationCount: Number(result.violationCount || 0),
      terminationReason: String(result.terminationReason || '').trim(),
      activityLog: Array.isArray(result.activityLog) ? result.activityLog : [],
    }))
    await fetchAttendanceHistory()
    await fetchAttendanceRoster()
  } catch (error) {
    console.error('Failed to fetch teacher records:', error)
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
  || result?.gradeValue != null
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
  if (String(result?.status || '') === 'returned_for_revision') return 'Returned for Revision'
  if (result?.isLate && !isTeacherReviewedResult(result)) return 'Late'
  if (result?.gradeValue !== null && result?.gradeValue !== undefined) return `Teacher graded: ${result.gradeValue}`
  if (String(result?.teacherFeedback || '').trim()) return 'Teacher feedback added'
  if (result?.gradedAt) return 'Teacher graded'
  return 'Submitted'
}

const loadAssessmentWeights = async () => {
  if (!weightsSubjectId.value) return
  weightsError.value = ''
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/subjects/${encodeURIComponent(weightsSubjectId.value)}/assessment-weights`, getAuthConfig())
    const weights = response.data?.weights || {}
    weightsForm.activity = Number(weights.activity ?? 30)
    weightsForm.quiz = Number(weights.quiz ?? 30)
    weightsForm.exam = Number(weights.exam ?? 40)
    weightsForm.minimumEvidenceCount = Number(weights.minimumEvidenceCount ?? 2)
  } catch (error) {
    weightsError.value = error.response?.data?.message || 'Failed to load assessment weights.'
  }
}

const openAssessmentWeights = async () => {
  weightsSubjectId.value = String(teacherSubjects.value[0]?.id || '')
  showWeightsModal.value = true
  await loadAssessmentWeights()
}

const saveAssessmentWeights = async () => {
  if (!weightsSubjectId.value || weightsTotal.value !== 100) return
  isSavingWeights.value = true
  weightsError.value = ''
  try {
    const response = await axios.patch(`${resolveApiBaseUrl()}/teacher/subjects/${encodeURIComponent(weightsSubjectId.value)}/assessment-weights`, { ...weightsForm }, getAuthConfig())
    assessmentActionMessage.value = response.data?.message || 'Assessment weights updated.'
    showWeightsModal.value = false
  } catch (error) {
    weightsError.value = error.response?.data?.message || 'Failed to save assessment weights.'
  } finally {
    isSavingWeights.value = false
  }
}

const reviewActivityResult = async (result, action) => {
  const assessment = selectedAssessmentForResults.value
  if (!assessment?.id || !result?.id || result.isReviewing) return
  const isReturn = action === 'return_for_revision'
  const maxPoints = Number(isActivityAssessment(assessment) ? assessment.activityPoints : result.totalPoints || 0)
  const gradeValue = Number(result.reviewGrade)
  result.reviewError = ''

  if (isReturn && !String(result.reviewFeedback || '').trim()) {
    result.reviewError = 'Add feedback explaining what the student should revise.'
    return
  }
  if (!isReturn && (!Number.isFinite(gradeValue) || gradeValue < 0 || gradeValue > maxPoints)) {
    result.reviewError = `Enter a grade from 0 to ${maxPoints}.`
    return
  }
  const confirmation = isReturn
    ? 'Return this submission to the student for revision?'
    : `Publish a grade of ${gradeValue}/${maxPoints} to this student?`
  if (!window.confirm(confirmation)) return

  result.isReviewing = true
  try {
    const response = await axios.patch(
      `${resolveApiBaseUrl()}/teacher/${isActivityAssessment(assessment) ? 'activities' : 'assessments'}/${encodeURIComponent(assessment.id)}/submissions/${encodeURIComponent(result.id)}/review`,
      {
        action,
        gradeValue: isReturn ? undefined : gradeValue,
        teacherFeedback: String(result.reviewFeedback || '').trim(),
      },
      getAuthConfig()
    )
    assessmentActionMessage.value = response.data?.message || (isReturn ? 'Activity returned for revision.' : 'Activity grade published.')
    await fetchRecords()
  } catch (error) {
    result.reviewError = error.response?.data?.message || error.message || 'Failed to save this activity review.'
  } finally {
    result.isReviewing = false
  }
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

const getTeacherClassLabel = (classItem) => {
  const className = String(classItem?.className || classItem?.name || 'Class').trim()
  const code = String(classItem?.code || '').trim()
  return code ? `${className} (${code})` : className
}

const openLessonEditModal = (lesson) => {
  selectedLessonForEdit.value = lesson || null
  lessonEditForm.title = String(lesson?.title || '').trim()
  lessonEditForm.description = String(lesson?.description || '').trim()
  lessonEditForm.subjectId = String(lesson?.subjectId || '').trim()
  lessonEditError.value = ''
  showLessonEditModal.value = Boolean(lesson)
}

const closeLessonEditModal = () => {
  if (isSavingLessonEdit.value) return
  showLessonEditModal.value = false
  selectedLessonForEdit.value = null
  lessonEditError.value = ''
}

const saveLessonEdit = async () => {
  if (!selectedLessonForEdit.value?.id || isSavingLessonEdit.value) return
  if (!lessonEditForm.title || !lessonEditForm.description || !lessonEditForm.subjectId) {
    lessonEditError.value = 'Complete the lesson title, class, and description.'
    return
  }

  isSavingLessonEdit.value = true
  lessonEditError.value = ''
  try {
    const lessonId = encodeURIComponent(selectedLessonForEdit.value.id)
    const response = await axios.patch(
      `${resolveApiBaseUrl()}/teacher/lessons/${lessonId}`,
      {
        title: lessonEditForm.title,
        description: lessonEditForm.description,
        subjectId: lessonEditForm.subjectId,
      },
      getAuthConfig(),
    )
    const updatedLesson = response.data?.lesson
    if (updatedLesson?.id) {
      lessons.value = lessons.value.map((lesson) => String(lesson?.id) === String(updatedLesson.id) ? updatedLesson : lesson)
    } else {
      await fetchRecords()
    }
    showLessonEditModal.value = false
    selectedLessonForEdit.value = null
    lessonActionMessageType.value = 'success'
    lessonActionMessage.value = 'Lesson changes saved successfully.'
  } catch (error) {
    console.error('Failed to update lesson:', error)
    lessonEditError.value = error.response?.data?.message || 'Failed to update the lesson.'
  } finally {
    isSavingLessonEdit.value = false
  }
}

const openLessonCopyModal = (lesson) => {
  selectedLessonForCopy.value = lesson || null
  lessonCopySubjectIds.value = []
  lessonCopyError.value = ''
  showLessonCopyModal.value = Boolean(lesson)
}

const closeLessonCopyModal = () => {
  if (isCopyingLesson.value) return
  showLessonCopyModal.value = false
  selectedLessonForCopy.value = null
  lessonCopySubjectIds.value = []
  lessonCopyError.value = ''
}

const copyLessonToClasses = async () => {
  if (!selectedLessonForCopy.value?.id || isCopyingLesson.value) return
  if (lessonCopySubjectIds.value.length === 0) {
    lessonCopyError.value = 'Select at least one additional class.'
    return
  }

  isCopyingLesson.value = true
  lessonCopyError.value = ''
  try {
    const lessonId = encodeURIComponent(selectedLessonForCopy.value.id)
    const response = await axios.post(
      `${resolveApiBaseUrl()}/teacher/lessons/${lessonId}/classes`,
      { subjectIds: lessonCopySubjectIds.value },
      getAuthConfig(),
    )
    await fetchRecords()
    const addedCount = Array.isArray(response.data?.lessons) ? response.data.lessons.length : 0
    const skippedCount = Array.isArray(response.data?.skippedClasses) ? response.data.skippedClasses.length : 0
    showLessonCopyModal.value = false
    selectedLessonForCopy.value = null
    lessonCopySubjectIds.value = []
    lessonActionMessageType.value = 'success'
    lessonActionMessage.value = addedCount > 0
      ? `Lesson added to ${addedCount} class${addedCount === 1 ? '' : 'es'}${skippedCount ? `; ${skippedCount} already had it` : ''}.`
      : 'The selected classes already have this lesson.'
  } catch (error) {
    console.error('Failed to add lesson to classes:', error)
    lessonCopyError.value = error.response?.data?.message || 'Failed to add the lesson to the selected classes.'
  } finally {
    isCopyingLesson.value = false
  }
}

const ASSESSMENT_ATTACHMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt', '.webp', '.zip'])
const MAX_ASSESSMENT_ATTACHMENT_BYTES = 10 * 1024 * 1024
const MAX_ASSESSMENT_ATTACHMENTS = 10

const getAttachmentExtension = (name) => {
  const normalized = String(name || '').trim().toLowerCase()
  return normalized.includes('.') ? `.${normalized.split('.').pop()}` : ''
}

const getAttachmentTypeLabel = (file) => getAttachmentExtension(file?.name || file?.fileName).replace('.', '').toUpperCase()
  || String(file?.type || file?.fileType || 'File')

const formatBytes = (value) => {
  const bytes = Number(value || 0)
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const mergeAssessmentEditFiles = (files) => {
  const existingCount = assessmentEditForm.existingAttachments.length
  const next = [...assessmentEditForm.newAttachments]
  const keys = new Set([
    ...assessmentEditForm.existingAttachments.map((file) => `${String(file.fileName || '').toLowerCase()}:${Number(file.size || 0)}`),
    ...next.map((file) => `${String(file.name || '').toLowerCase()}:${Number(file.size || 0)}`),
  ])
  const warnings = []
  for (const file of Array.from(files || [])) {
    const extension = getAttachmentExtension(file?.name)
    const key = `${String(file?.name || '').toLowerCase()}:${Number(file?.size || 0)}`
    if (keys.has(key)) {
      warnings.push(`${file.name} is already attached.`)
      continue
    }
    if (!ASSESSMENT_ATTACHMENT_EXTENSIONS.has(extension)) {
      warnings.push(`${file.name} has an unsupported file type.`)
      continue
    }
    if (Number(file.size || 0) > MAX_ASSESSMENT_ATTACHMENT_BYTES) {
      warnings.push(`${file.name} exceeds 10MB.`)
      continue
    }
    if (existingCount + next.length >= MAX_ASSESSMENT_ATTACHMENTS) {
      warnings.push(`Only ${MAX_ASSESSMENT_ATTACHMENTS} attachments are allowed.`)
      break
    }
    keys.add(key)
    next.push(file)
  }
  assessmentEditForm.newAttachments = next
  assessmentEditError.value = warnings.join(' ')
}

const handleAssessmentEditFileChange = (event) => {
  mergeAssessmentEditFiles(event?.target?.files)
  if (event?.target) event.target.value = ''
}

const handleAssessmentEditDrop = (event) => {
  isAssessmentEditDropActive.value = false
  mergeAssessmentEditFiles(event?.dataTransfer?.files)
}

const removeExistingAssessmentAttachment = (id) => {
  assessmentEditForm.existingAttachments = assessmentEditForm.existingAttachments.filter((item) => String(item.id) !== String(id))
}

const removeNewAssessmentAttachment = (fileToRemove) => {
  assessmentEditForm.newAttachments = assessmentEditForm.newAttachments.filter((file) => file !== fileToRemove)
}

const openAssessmentEditModal = (assessment) => {
  selectedAssessmentForEdit.value = assessment || null
  assessmentEditForm.title = String(assessment?.title || '').trim()
  assessmentEditForm.subjectId = String(assessment?.subjectId || '').trim()
  assessmentEditForm.challengeDescription = String(assessment?.challengeDescription || '').trim()
  assessmentEditForm.activityPoints = Number(assessment?.activityPoints || 100)
  assessmentEditForm.difficulty = String(assessment?.difficulty || 'medium').trim().toLowerCase()
  assessmentEditForm.existingAttachments = Array.isArray(assessment?.attachments) ? [...assessment.attachments] : []
  assessmentEditForm.newAttachments = []
  assessmentEditError.value = ''
  showAssessmentEditModal.value = Boolean(assessment)
}

const closeAssessmentEditModal = () => {
  if (isSavingAssessmentEdit.value) return
  showAssessmentEditModal.value = false
  selectedAssessmentForEdit.value = null
  assessmentEditForm.existingAttachments = []
  assessmentEditForm.newAttachments = []
  assessmentEditUploadProgress.value = 0
  assessmentEditError.value = ''
}

const saveAssessmentEdit = async () => {
  const assessment = selectedAssessmentForEdit.value
  if (!assessment?.id || isSavingAssessmentEdit.value) return
  if (!assessmentEditForm.title || !assessmentEditForm.subjectId) {
    assessmentEditError.value = 'Complete the title and class.'
    return
  }
  if (isActivityAssessment(assessment) && !assessmentEditForm.challengeDescription) {
    assessmentEditError.value = 'Activity instructions are required.'
    return
  }

  isSavingAssessmentEdit.value = true
  assessmentEditError.value = ''
  try {
    const assessmentId = encodeURIComponent(assessment.id)
    const formData = new FormData()
    formData.append('title', assessmentEditForm.title)
    formData.append('subjectId', assessmentEditForm.subjectId)
    formData.append('challengeDescription', assessmentEditForm.challengeDescription)
    formData.append('activityPoints', String(assessmentEditForm.activityPoints))
    formData.append('difficulty', assessmentEditForm.difficulty)
    formData.append('retainedAttachmentIds', JSON.stringify(assessmentEditForm.existingAttachments.map((item) => item.id)))
    assessmentEditForm.newAttachments.forEach((file) => formData.append('attachments', file))
    assessmentEditUploadProgress.value = assessmentEditForm.newAttachments.length ? 1 : 0
    const response = await axios.patch(
      `${resolveApiBaseUrl()}/teacher/assessments/${assessmentId}`,
      formData,
      {
        ...getAuthConfig(),
        onUploadProgress: (event) => {
          if (event.total) assessmentEditUploadProgress.value = Math.min(99, Math.round((event.loaded / event.total) * 100))
        },
      },
    )
    assessmentEditUploadProgress.value = assessmentEditForm.newAttachments.length ? 100 : 0
    showAssessmentEditModal.value = false
    selectedAssessmentForEdit.value = null
    await fetchRecords()
    const rejected = Array.isArray(response.data?.attachmentUpload?.rejected) ? response.data.attachmentUpload.rejected : []
    const rejectedDetails = rejected.map((item) => `${item.fileName}: ${item.reason}`).join('; ')
    assessmentActionMessage.value = rejectedDetails
      ? `${response.data?.message || 'Assessment updated'}. Skipped: ${rejectedDetails}`
      : response.data?.message || `${getAssessmentTypeLabel(assessment)} changes saved successfully.`
  } catch (error) {
    console.error('Failed to update assessment:', error)
    assessmentEditError.value = error.response?.data?.message || 'Failed to update the assessment.'
  } finally {
    isSavingAssessmentEdit.value = false
    window.setTimeout(() => { assessmentEditUploadProgress.value = 0 }, 500)
  }
}

const openAssessmentCopyModal = (assessment) => {
  selectedAssessmentForCopy.value = assessment || null
  assessmentCopySubjectIds.value = []
  assessmentCopyError.value = ''
  showAssessmentCopyModal.value = Boolean(assessment)
}

const closeAssessmentCopyModal = () => {
  if (isCopyingAssessment.value) return
  showAssessmentCopyModal.value = false
  selectedAssessmentForCopy.value = null
  assessmentCopySubjectIds.value = []
  assessmentCopyError.value = ''
}

const copyAssessmentToClasses = async () => {
  const assessment = selectedAssessmentForCopy.value
  if (!assessment?.id || isCopyingAssessment.value) return
  if (assessmentCopySubjectIds.value.length === 0) {
    assessmentCopyError.value = 'Select at least one additional class.'
    return
  }

  isCopyingAssessment.value = true
  assessmentCopyError.value = ''
  try {
    const assessmentId = encodeURIComponent(assessment.id)
    const response = await axios.post(
      `${resolveApiBaseUrl()}/teacher/assessments/${assessmentId}/classes`,
      { subjectIds: assessmentCopySubjectIds.value },
      getAuthConfig(),
    )
    const addedCount = Array.isArray(response.data?.assessments) ? response.data.assessments.length : 0
    const skippedCount = Array.isArray(response.data?.skippedClasses) ? response.data.skippedClasses.length : 0
    showAssessmentCopyModal.value = false
    selectedAssessmentForCopy.value = null
    assessmentCopySubjectIds.value = []
    await fetchRecords()
    assessmentActionMessage.value = addedCount > 0
      ? `${getAssessmentTypeLabel(assessment)} added to ${addedCount} class${addedCount === 1 ? '' : 'es'}${skippedCount ? `; ${skippedCount} already had it or had a grading-period conflict` : ''}.`
      : 'The selected classes already have this assessment or a conflicting grading assessment.'
  } catch (error) {
    console.error('Failed to add assessment to classes:', error)
    assessmentCopyError.value = error.response?.data?.message || 'Failed to add the assessment to the selected classes.'
  } finally {
    isCopyingAssessment.value = false
  }
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
const isFirstTourStep = computed(() => tourStepIndex.value === 0 && TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE) === 0)
const isFinalTourStep = computed(() => isLastTourStep.value && TOUR_ROUTE_ORDER.indexOf(CURRENT_PAGE_ROUTE) === TOUR_ROUTE_ORDER.length - 1)
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
  () => [filteredLessons.value.length, lessonSearchQuery.value, lessonSubjectFilter.value, lessonSortOrder.value],
  ([length], previousValues) => {
    if (previousValues) lessonPage.value = 1
    if (length === 0) {
      lessonPage.value = 1
      return
    }
    lessonPage.value = clampPage(lessonPage.value, lessonTotalPages.value)
  }
)

watch(
  () => [
    filteredAssessments.value.length,
    assessmentSearchQuery.value,
    assessmentSubjectFilter.value,
    assessmentTypeFilter.value,
    assessmentSortOrder.value,
  ],
  ([length], previousValues) => {
    if (previousValues) assessmentPage.value = 1
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

onMounted(async () => {
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('click', handleAccountMenuClickOutside)
  document.addEventListener('visibilitychange', handleRecordsVisibilityChange)
  window.addEventListener('resize', handleTourViewportChange)
  window.addEventListener('scroll', handleTourViewportChange, true)
  window.addEventListener('resize', syncMobileMenuBodyState)
  window.addEventListener('focus', handleRecordsWindowFocus)
  window.addEventListener('teacher-assessment-created', handleAssessmentCreatedEvent)
  window.addEventListener('storage', handleRecordsStorageSignal)

  // Resume the tour immediately; record and profile requests can finish behind it.
  await maybeAutoStartTour()

  await authStore.refreshProfile().catch((error) => {
    console.error('Failed to refresh teacher profile:', error)
  })
  const authUser = authStore.user || {}
  teacher.name = authUser.name || authUser.username || 'Teacher'
  teacher.displayName = authUser.name || authUser.displayName || authUser.username || 'Teacher'
  teacher.subject = authUser.subject || ''
  teacher.department = authUser.department || ''
  teacher.status = authUser.status || 'Online'
  teacher.email = authUser.email || ''

  fetchRecords()
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
@reference "../../styles/tailwind.css";
.assessment-weights-button { @apply tw:[margin-top:0.7rem]; }
.weights-dialog { @apply tw:[max-width:620px]; }
.weights-form { @apply tw:grid; @apply tw:[gap:0.9rem]; }
.weights-form label { @apply tw:grid; @apply tw:[gap:0.3rem]; @apply tw:[color:#334155]; @apply tw:[font-size:0.76rem]; @apply tw:[font-weight:700]; }
.weights-form input,
.weights-form select { @apply tw:w-full; @apply tw:[padding:0.65rem_0.7rem]; @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:9px]; @apply tw:[background:#fff]; @apply tw:[font:inherit]; }
.weights-grid { @apply tw:grid; @apply tw:[grid-template-columns:repeat(3,_1fr)]; @apply tw:[gap:0.7rem]; }
.weights-total { @apply tw:[margin:0]; @apply tw:[padding:0.6rem]; @apply tw:[border-radius:9px]; @apply tw:[background:#f0fdf4]; @apply tw:[color:#166534]; @apply tw:[font-size:0.78rem]; @apply tw:[font-weight:800]; }
.weights-total.invalid { @apply tw:[background:#fff7ed]; @apply tw:[color:#9a3412]; }
@media (max-width: 600px) { .weights-grid { @apply tw:[grid-template-columns:1fr]; } }

.essay-review-details { @apply tw:[min-width:230px]; }
.essay-review-details summary { @apply tw:cursor-pointer; @apply tw:[color:#2563eb]; @apply tw:[font-size:0.76rem]; @apply tw:[font-weight:800]; }
.essay-review-body { @apply tw:grid; @apply tw:[gap:0.65rem]; @apply tw:[margin-top:0.6rem]; @apply tw:[padding:0.75rem]; @apply tw:[border:1px_solid_#dbe4ef]; @apply tw:[border-radius:12px]; @apply tw:[background:#f8fafc]; }
.essay-review-body article { @apply tw:[padding-bottom:0.55rem]; @apply tw:[border-bottom:1px_solid_#e2e8f0]; }
.essay-review-body article p { @apply tw:[margin:0.25rem_0]; @apply tw:[color:#475569]; @apply tw:[font-size:0.73rem]; @apply tw:[line-height:1.4]; }
.essay-review-body article small { @apply tw:[color:#64748b]; @apply tw:[font-size:0.68rem]; }
.essay-review-body label { @apply tw:grid; @apply tw:[gap:0.25rem]; @apply tw:[color:#334155]; @apply tw:[font-size:0.7rem]; @apply tw:[font-weight:700]; }
.essay-review-body input,
.essay-review-body textarea { @apply tw:w-full; @apply tw:[padding:0.5rem]; @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:8px]; @apply tw:[background:#fff]; @apply tw:[font:inherit]; }

.activity-grading-panel {
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f8fafc];
}
.activity-grading-fields { @apply tw:grid; @apply tw:[grid-template-columns:minmax(140px,_.35fr)_1fr]; @apply tw:[gap:1rem]; }
.activity-grading-fields label { @apply tw:grid; @apply tw:[gap:.4rem]; @apply tw:[color:#334155]; @apply tw:[font-weight:700]; }
.activity-grading-fields input, .activity-grading-fields textarea { @apply tw:w-full; @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:10px]; @apply tw:[padding:.75rem]; @apply tw:[background:#fff]; @apply tw:[color:#0f172a]; }
.activity-grading-actions { @apply tw:flex; @apply tw:justify-end; @apply tw:flex-wrap; @apply tw:[gap:.75rem]; @apply tw:[margin-top:1rem]; }
@media (max-width: 680px) { .activity-grading-fields { @apply tw:[grid-template-columns:1fr]; } .activity-grading-actions .btn { @apply tw:w-full; } }
.teacher-page-tour-layer {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[z-index:12000];
  @apply tw:pointer-events-none;
}

.teacher-page-tour-backdrop {
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[background:rgba(15,_23,_42,_0.58)];
}

.teacher-page-tour-spotlight {
  @apply tw:fixed;
  @apply tw:[z-index:12001];
  @apply tw:[border-radius:16px];
  @apply tw:[box-shadow:0_0_0_9999px_rgba(15,_23,_42,_0.58)];
  @apply tw:[border:2px_solid_rgba(255,_255,_255,_0.95)];
  @apply tw:[transition:top_0.24s_ease,_left_0.24s_ease,_width_0.24s_ease,_height_0.24s_ease];
  @apply tw:pointer-events-none;
}

.teacher-page-tour-tooltip {
  @apply tw:fixed;
  @apply tw:[z-index:12002];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[box-shadow:0_14px_32px_rgba(15,_23,_42,_0.22)];
  @apply tw:[padding:1rem_1.1rem];
  @apply tw:pointer-events-auto;
  @apply tw:[transition:left_0.24s_ease,_top_0.24s_ease,_width_0.24s_ease];
}

.teacher-page-tour-step {
  @apply tw:[margin:0_0_0.35rem];
  @apply tw:[font-size:0.72rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-weight:600];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.teacher-page-tour-tooltip h3 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.05rem];
  @apply tw:[line-height:1.25];
  @apply tw:[font-weight:700];
}

.teacher-page-tour-tooltip p {
  @apply tw:[margin:0.5rem_0_0];
  @apply tw:[font-size:0.9rem];
  @apply tw:[color:#475569];
  @apply tw:[line-height:1.45];
}

.teacher-page-tour-actions {
  @apply tw:[margin-top:1rem];
  @apply tw:flex;
  @apply tw:[gap:0.55rem];
  @apply tw:justify-end;
}

.teacher-page-tour-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
  @apply tw:[min-height:36px];
  @apply tw:[padding:0.45rem_0.92rem];
  @apply tw:cursor-pointer;
}

.teacher-page-tour-btn:disabled {
  @apply tw:[opacity:0.5];
  @apply tw:cursor-not-allowed;
}

.teacher-page-tour-btn-ghost {
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
}

.teacher-page-tour-btn-ghost:hover:not(:disabled) {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-color:#94a3b8];
}

.teacher-page-tour-btn-primary {
  @apply tw:[border-color:#0f172a];
  @apply tw:[background:#0f172a];
  @apply tw:[color:#ffffff];
}

.teacher-page-tour-btn-primary:hover {
  @apply tw:[background:#1e293b];
  @apply tw:[border-color:#1e293b];
}

.header-tour-btn {
  @apply tw:cursor-pointer;
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[border-radius:12px];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[transition:all_0.2s_ease];
}

.header-tour-btn:hover {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-color:#cbd5e1];
}

.sr-only {
  @apply tw:absolute;
  @apply tw:[width:1px];
  @apply tw:[height:1px];
  @apply tw:[padding:0];
  @apply tw:[margin:-1px];
  @apply tw:overflow-hidden;
  @apply tw:[clip:rect(0,_0,_0,_0)];
  @apply tw:whitespace-nowrap;
  @apply tw:[border:0];
}

.records-section {
  @apply tw:[padding:1.25rem];
  @apply tw:[border:1px_solid_#dbe4ee];
  @apply tw:[border-radius:22px];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(59,_130,_246,_0.05),_transparent_28%),______linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_18px_44px_rgba(15,_23,_42,_0.05)];
}

#teacherRecordsLessonsPanel {
  --lesson-brand: #1e4307;
  --lesson-green: #4f7d3a;
  --lesson-green-soft: #6f9d58;
  --lesson-mint: #dcead3;
  --lesson-surface: #f7fbf4;
  --lesson-hover-ring: rgba(79, 125, 58, 0.5);
  --lesson-hover-shadow: 0 12px 28px rgba(30, 67, 7, 0.12);
  --lesson-action-shadow: 0 3px 10px rgba(30, 67, 7, 0.14);
  @apply tw:[padding:0];
  @apply tw:overflow-hidden;
  @apply tw:[border-color:#d4e4ca];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_20px_50px_rgba(30,_67,_7,_0.08)];
}

#teacherRecordsLessonsPanel .lessons-hero {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1.5rem];
  @apply tw:[padding:1.55rem_1.65rem];
  @apply tw:[background:radial-gradient(circle_at_88%_15%,_rgba(111,_157,_88,_0.2),_transparent_30%),______linear-gradient(135deg,_#f7fbf4_0%,_#edf6e8_100%)];
  @apply tw:[border-bottom:1px_solid_#dcead3];
}

#teacherRecordsLessonsPanel .lessons-hero-copy {
  @apply tw:[min-width:0];
}

#teacherRecordsLessonsPanel .lessons-kicker {
  @apply tw:block;
  @apply tw:[margin-bottom:0.35rem];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.1em];
  @apply tw:uppercase;
}

#teacherRecordsLessonsPanel .section-title {
  @apply tw:[margin:0];
  @apply tw:[color:#173706];
  @apply tw:[font-size:clamp(1.35rem,_2vw,_1.75rem)];
  @apply tw:[letter-spacing:-0.025em];
}

#teacherRecordsLessonsPanel .section-subtitle {
  @apply tw:[max-width:590px];
  @apply tw:[margin-top:0.38rem];
  @apply tw:[color:#52634a];
  @apply tw:[font-size:0.88rem];
}

#teacherRecordsLessonsPanel .lessons-upload-summary {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:flex-none;
  @apply tw:[padding:0.8rem_1rem];
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.2)];
  @apply tw:[border-radius:16px];
  @apply tw:[background:rgba(255,_255,_255,_0.8)];
  @apply tw:[box-shadow:0_8px_24px_rgba(30,_67,_7,_0.07)];
  @apply tw:[backdrop-filter:blur(8px)];
}

#teacherRecordsLessonsPanel .lessons-summary-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:13px];
  @apply tw:[background:#dcead3];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:1rem];
}

#teacherRecordsLessonsPanel .lessons-summary-copy {
  @apply tw:grid;
  @apply tw:[gap:0.05rem];
}

#teacherRecordsLessonsPanel .lessons-summary-copy strong {
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:1.02rem];
  @apply tw:[line-height:1.1];
}

#teacherRecordsLessonsPanel .lessons-summary-copy span {
  @apply tw:[color:#66745f];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:650];
  @apply tw:whitespace-nowrap;
}

#teacherRecordsLessonsPanel .lessons-summary-divider {
  @apply tw:[width:1px];
  @apply tw:[height:32px];
  @apply tw:[background:#d4e4ca];
}

#teacherRecordsLessonsPanel .lessons-toolbar {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(240px,_1fr)_minmax(170px,_0.42fr)_minmax(150px,_0.34fr)];
  @apply tw:[gap:0.7rem];
  @apply tw:[margin:1.15rem_1.25rem_0];
  @apply tw:[padding:0.72rem];
  @apply tw:[border:1px_solid_#dce7d6];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsLessonsPanel .lessons-search,
#teacherRecordsLessonsPanel .lessons-select-field {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[min-width:0];
  @apply tw:[min-height:42px];
  @apply tw:[border:1px_solid_#cfddc7];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#6b7b63];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease,_transform_0.2s_ease];
}

#teacherRecordsLessonsPanel .lessons-search:focus-within,
#teacherRecordsLessonsPanel .lessons-select-field:focus-within {
  @apply tw:[border-color:#6f9d58];
  @apply tw:[box-shadow:0_0_0_3px_rgba(111,_157,_88,_0.16)];
}

#teacherRecordsLessonsPanel .lessons-search > i,
#teacherRecordsLessonsPanel .lessons-select-field > i:first-of-type {
  @apply tw:[margin-left:0.85rem];
  @apply tw:[color:#6f9d58];
  @apply tw:[font-size:0.8rem];
  @apply tw:pointer-events-none;
}

#teacherRecordsLessonsPanel .lessons-search input,
#teacherRecordsLessonsPanel .lessons-select-field select {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.6rem_2.25rem_0.6rem_0.65rem];
  @apply tw:[border:0];
  @apply tw:[outline:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#24331e];
  @apply tw:[font:inherit];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
}

#teacherRecordsLessonsPanel .lessons-search input::placeholder {
  @apply tw:[color:#8a9783];
  @apply tw:[font-weight:500];
}

#teacherRecordsLessonsPanel .lessons-select-field select {
  @apply tw:cursor-pointer;
  @apply tw:appearance-none;
}

#teacherRecordsLessonsPanel .lessons-select-chevron {
  @apply tw:absolute;
  @apply tw:[right:0.85rem];
  @apply tw:[color:#71816a];
  @apply tw:[font-size:0.68rem];
  @apply tw:pointer-events-none;
}

#teacherRecordsLessonsPanel .lessons-search-clear {
  @apply tw:absolute;
  @apply tw:[right:0.4rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[border:0];
  @apply tw:[border-radius:9px];
  @apply tw:[background:transparent];
  @apply tw:[color:#6b7b63];
  @apply tw:cursor-pointer;
}

#teacherRecordsLessonsPanel .lessons-search-clear:hover {
  @apply tw:[background:#edf5e8];
  @apply tw:[color:#1e4307];
}

#teacherRecordsLessonsPanel button:focus-visible,
#teacherRecordsLessonsPanel a:focus-visible,
#teacherRecordsLessonsPanel input:focus-visible,
#teacherRecordsLessonsPanel select:focus-visible {
  @apply tw:[outline:3px_solid_rgba(79,_125,_58,_0.35)];
  @apply tw:[outline-offset:2px];
}

#teacherRecordsLessonsPanel .lessons-results-bar {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin:0.65rem_1.4rem_0];
  @apply tw:[color:#687761];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:600];
}

#teacherRecordsLessonsPanel .lessons-results-bar button,
#teacherRecordsLessonsPanel .lessons-empty-action {
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#3f6f2a];
  @apply tw:[font:inherit];
  @apply tw:[font-weight:750];
  @apply tw:cursor-pointer;
  @apply tw:[text-decoration:underline];
  @apply tw:[text-underline-offset:3px];
}

#teacherRecordsLessonsPanel .records-feed-wrap {
  @apply tw:[margin:0];
  @apply tw:[padding:1rem_1.25rem_1.25rem];
}

#teacherRecordsLessonsPanel .records-feed {
  @apply tw:[gap:0.9rem];
}

#teacherRecordsLessonsPanel .lesson-document-card {
  @apply tw:relative;
  @apply tw:[gap:0.78rem];
  @apply tw:overflow-hidden;
  @apply tw:[padding:1.15rem_1.2rem];
  @apply tw:[border-color:#dce7d6];
  @apply tw:[border-radius:18px];
  @apply tw:[box-shadow:0_8px_22px_rgba(30,_67,_7,_0.055)];
  @apply tw:transform-none;
  @apply tw:[transition:box-shadow_180ms_ease];
  @apply tw:[animation:lesson-card-in_0.42s_both];
  @apply tw:[animation-delay:calc(var(--lesson-index)_*_55ms)];
}

#teacherRecordsLessonsPanel .lesson-document-card::before {
  @apply tw:[content:""];
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[border-radius:inherit];
  @apply tw:pointer-events-none;
  @apply tw:[box-shadow:inset_0_0_0_1px_var(--lesson-hover-ring)];
  @apply tw:opacity-0;
  @apply tw:[transition:opacity_180ms_ease];
}

#teacherRecordsLessonsPanel .lesson-document-card:has(:focus-visible) {
  @apply tw:[box-shadow:var(--lesson-hover-shadow)];
}

#teacherRecordsLessonsPanel .lesson-document-card:has(:focus-visible)::before {
  @apply tw:opacity-100;
}

#teacherRecordsLessonsPanel .record-card-header {
  @apply tw:items-center;
  @apply tw:[padding-bottom:0];
  @apply tw:[border-bottom:0];
}

#teacherRecordsLessonsPanel .record-card-title {
  @apply tw:[gap:0.35rem];
}

#teacherRecordsLessonsPanel .record-type-label {
  @apply tw:[gap:0.35rem];
  @apply tw:[padding:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#6f9d58];
  @apply tw:[font-size:0.65rem];
}

#teacherRecordsLessonsPanel .record-card-title h4 {
  @apply tw:[color:#1d2b17];
  @apply tw:[font-size:1.17rem];
  @apply tw:[line-height:1.35];
  @apply tw:[letter-spacing:-0.012em];
}

#teacherRecordsLessonsPanel .record-card-date-group {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[padding:0.48rem_0.68rem];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#f7fbf4];
  @apply tw:text-left;
}

#teacherRecordsLessonsPanel .lesson-card-header-actions {
  @apply tw:grid;
  @apply tw:justify-items-end;
  @apply tw:[gap:0.45rem];
}

#teacherRecordsLessonsPanel .lesson-manage-actions {
  @apply tw:flex;
  @apply tw:[gap:0.4rem];
}

#teacherRecordsLessonsPanel .lesson-manage-actions button {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
  @apply tw:[min-height:30px];
  @apply tw:[border:1px_solid_#cfddc7];
  @apply tw:[border-radius:9px];
  @apply tw:[padding:0.35rem_0.58rem];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#406331];
  @apply tw:[font:inherit];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:cursor-pointer;
  @apply tw:[transition:background_180ms_ease,_border-color_180ms_ease,_box-shadow_180ms_ease,_filter_180ms_ease];
}

#teacherRecordsLessonsPanel .record-card-date-group > i {
  @apply tw:[color:#6f9d58];
  @apply tw:[font-size:0.85rem];
}

#teacherRecordsLessonsPanel .record-card-date-group > span {
  @apply tw:grid;
  @apply tw:[gap:0.05rem];
}

#teacherRecordsLessonsPanel .record-date-label {
  @apply tw:[color:#82907b];
  @apply tw:[font-size:0.58rem];
}

#teacherRecordsLessonsPanel .record-card-date {
  @apply tw:[color:#43513d];
  @apply tw:[font-size:0.72rem];
}

#teacherRecordsLessonsPanel .record-chip {
  @apply tw:[gap:0.35rem];
  @apply tw:[padding:0.3rem_0.68rem];
}

#teacherRecordsLessonsPanel .chip-subject {
  @apply tw:[border-color:#c6dcb9];
  @apply tw:[background:#edf6e8];
  @apply tw:[color:#315f1e];
}

#teacherRecordsLessonsPanel .chip-class {
  @apply tw:[border-color:#cdd8eb];
  @apply tw:[background:#f1f5fb];
  @apply tw:[color:#35547f];
}

#teacherRecordsLessonsPanel .record-chip-label {
  @apply tw:[font-weight:700];
}

#teacherRecordsLessonsPanel .chip-neutral {
  @apply tw:[border-color:#dfe6dc];
  @apply tw:[background:#fafcf9];
  @apply tw:[color:#687761];
}

#teacherRecordsLessonsPanel .lesson-action-banner {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.6rem];
  @apply tw:[margin-top:0.85rem];
  @apply tw:[border:1px_solid_#bbd9ad];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.72rem_0.85rem];
  @apply tw:[background:#f1f8ed];
  @apply tw:[color:#315f1e];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
}

#teacherRecordsLessonsPanel .lesson-action-banner.error {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#991b1b];
}

#teacherRecordsLessonsPanel .lesson-action-banner button {
  @apply tw:ml-auto;
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:inherit];
  @apply tw:cursor-pointer;
}

#teacherRecordsLessonsPanel .record-card-body {
  @apply tw:[gap:0.55rem];
  @apply tw:[padding-top:0.12rem];
}

#teacherRecordsLessonsPanel .attachment-row {
  @apply tw:[gap:0.85rem];
  @apply tw:[padding:0.75rem_0.8rem];
  @apply tw:[border-color:#e0e9db];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f9fcf7];
  @apply tw:[box-shadow:none];
  @apply tw:[transition:background_0.2s_ease,_border-color_0.2s_ease];
}

#teacherRecordsLessonsPanel .attachment-row:last-child {
  @apply tw:[border-bottom-color:#e0e9db];
}

#teacherRecordsLessonsPanel .attachment-icon {
  @apply tw:[width:44px];
  @apply tw:[height:44px];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#eef3eb];
  @apply tw:[color:#4f7d3a];
}

#teacherRecordsLessonsPanel .attachment-icon.file-pdf {
  @apply tw:[background:#fff0ee];
  @apply tw:[color:#c24132];
}

#teacherRecordsLessonsPanel .attachment-icon.file-word {
  @apply tw:[background:#eaf2ff];
  @apply tw:[color:#2f68b2];
}

#teacherRecordsLessonsPanel .attachment-icon.file-slides {
  @apply tw:[background:#fff3e5];
  @apply tw:[color:#bb6020];
}

#teacherRecordsLessonsPanel .attachment-icon.file-sheet {
  @apply tw:[background:#e9f6ed];
  @apply tw:[color:#2f7b46];
}

#teacherRecordsLessonsPanel .attachment-icon.file-image,
#teacherRecordsLessonsPanel .attachment-icon.file-video {
  @apply tw:[background:#f2edff];
  @apply tw:[color:#7250a8];
}

#teacherRecordsLessonsPanel .file-name {
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.85rem];
  @apply tw:[font-weight:700];
}

#teacherRecordsLessonsPanel .file-type {
  @apply tw:w-fit;
  @apply tw:[padding:0.12rem_0.38rem];
  @apply tw:[border-radius:6px];
  @apply tw:[background:#e8efe4];
  @apply tw:[color:#55704a];
  @apply tw:[font-size:0.58rem];
  @apply tw:[letter-spacing:0.055em];
}

#teacherRecordsLessonsPanel .file-type.file-pdf {
  @apply tw:[background:#ffebe8];
  @apply tw:[color:#a83c30];
}

#teacherRecordsLessonsPanel .file-type.file-word {
  @apply tw:[background:#e4efff];
  @apply tw:[color:#285c9e];
}

#teacherRecordsLessonsPanel .file-type.file-slides {
  @apply tw:[background:#ffecd9];
  @apply tw:[color:#a85118];
}

#teacherRecordsLessonsPanel .file-type.file-sheet {
  @apply tw:[background:#e2f3e7];
  @apply tw:[color:#286c3c];
}

#teacherRecordsLessonsPanel .file-type.file-image,
#teacherRecordsLessonsPanel .file-type.file-video {
  @apply tw:[background:#eee7ff];
  @apply tw:[color:#654594];
}

#teacherRecordsLessonsPanel .attachment-actions {
  @apply tw:[gap:0.45rem];
}

#teacherRecordsLessonsPanel .record-link {
  @apply tw:relative;
  @apply tw:[width:38px];
  @apply tw:[height:38px];
  @apply tw:[padding:0];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#cdddc5];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#4f7d3a];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[box-shadow:none];
  @apply tw:transform-none;
  @apply tw:[text-decoration:none];
  @apply tw:[transition:background_180ms_ease,_color_180ms_ease,_border-color_180ms_ease,_box-shadow_180ms_ease,_filter_180ms_ease];
}

#teacherRecordsLessonsPanel .record-link-button {
  /* Match the global brand action, while avoiding its sticky touch hover. */
  @apply tw:[border-color:#4f8a35]!;
  @apply tw:[background:#4f8a35]!;
  @apply tw:[color:#ffffff]!;
}

#teacherRecordsLessonsPanel .lesson-manage-actions button:focus-visible,
#teacherRecordsLessonsPanel .record-link:focus-visible {
  @apply tw:[box-shadow:var(--lesson-action-shadow)];
}

/* Keep hover feedback on pointer devices, not after a phone tap. */
@media (hover: hover) and (pointer: fine) {
  #teacherRecordsLessonsPanel .lesson-document-card:hover {
    @apply tw:[box-shadow:var(--lesson-hover-shadow)];
  }

  #teacherRecordsLessonsPanel .lesson-document-card:hover::before {
    @apply tw:opacity-100;
  }

  #teacherRecordsLessonsPanel .attachment-row:hover {
    @apply tw:[border-color:#c9dcc0];
    @apply tw:[background:#f4f9f1];
  }

  #teacherRecordsLessonsPanel .lesson-manage-actions button:hover:not(:disabled),
  #teacherRecordsLessonsPanel .record-link:hover {
    @apply tw:[box-shadow:var(--lesson-action-shadow)];
  }

  #teacherRecordsLessonsPanel .lesson-manage-actions button:hover:not(:disabled) {
    @apply tw:[border-color:#9fbd90];
    @apply tw:[background:#f2f8ee];
  }

  #teacherRecordsLessonsPanel .record-link-preview:hover {
    @apply tw:[border-color:#6f9d58];
    @apply tw:[background:#edf6e8];
    @apply tw:[color:#1e4307];
  }

  #teacherRecordsLessonsPanel .record-link-button:hover:not(:disabled) {
    @apply tw:[border-color:#3f702b]!;
    @apply tw:[background:#3f702b]!;
  }
}

#teacherRecordsLessonsPanel .lesson-manage-actions button:active:not(:disabled),
#teacherRecordsLessonsPanel .record-link:active {
  @apply tw:[box-shadow:inset_0_2px_4px_rgba(0,_0,_0,_0.16)];
  @apply tw:[filter:brightness(0.96)];
}

#teacherRecordsLessonsPanel .record-link::after,
#teacherRecordsLessonsPanel .pagination-btn::after,
#teacherRecordsLessonsPanel .lessons-page-btn::after {
  @apply tw:[content:""];
  @apply tw:absolute;
  @apply tw:[inset:50%];
  @apply tw:[border-radius:50%];
  @apply tw:[background:rgba(111,_157,_88,_0.22)];
  @apply tw:[transform:translate(-50%,_-50%)_scale(0)];
  @apply tw:opacity-0;
}

#teacherRecordsLessonsPanel .record-link:active::after,
#teacherRecordsLessonsPanel .pagination-btn:active::after,
#teacherRecordsLessonsPanel .lessons-page-btn:active::after {
  @apply tw:[animation:lesson-ripple_0.42s_ease-out];
}

#teacherRecordsLessonsPanel .table-state {
  @apply tw:flex-col;
  @apply tw:[min-height:230px];
  @apply tw:[border-color:#cbdcc2];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f7fbf4];
  @apply tw:[color:#66745f];
  @apply tw:text-center;
}

#teacherRecordsLessonsPanel .lessons-empty-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:54px];
  @apply tw:[height:54px];
  @apply tw:[border-radius:17px];
  @apply tw:[background:#dcead3];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:1.15rem];
}

#teacherRecordsLessonsPanel .records-pagination {
  @apply tw:[margin-top:1.1rem];
  @apply tw:[padding:0.9rem];
  @apply tw:[border:1px_solid_#dce7d6];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsLessonsPanel .records-pagination-copy {
  @apply tw:[color:#66745f];
}

#teacherRecordsLessonsPanel .records-pagination-actions {
  @apply tw:[gap:0.38rem];
}

#teacherRecordsLessonsPanel .pagination-btn,
#teacherRecordsLessonsPanel .lessons-page-btn {
  @apply tw:relative;
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[min-height:38px];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#cbdcc2];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#35552a];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:750];
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.18s_ease,_border-color_0.18s_ease,_background_0.18s_ease,_color_0.18s_ease];
}

#teacherRecordsLessonsPanel .pagination-btn:hover:not(:disabled),
#teacherRecordsLessonsPanel .lessons-page-btn:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#6f9d58];
  @apply tw:[background:#edf6e8];
  @apply tw:[color:#1e4307];
}

#teacherRecordsLessonsPanel .pagination-btn:disabled {
  @apply tw:[background:#f2f5f0];
  @apply tw:[color:#9aa596];
  @apply tw:opacity-100;
}

#teacherRecordsLessonsPanel .lessons-page-numbers {
  @apply tw:inline-flex;
  @apply tw:[gap:0.3rem];
}

#teacherRecordsLessonsPanel .lessons-page-btn {
  @apply tw:[width:38px];
  @apply tw:[padding:0];
}

#teacherRecordsLessonsPanel .lessons-page-btn.active {
  @apply tw:[border-color:#1e4307];
  @apply tw:[background:#1e4307];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_6px_14px_rgba(30,_67,_7,_0.18)];
}

@keyframes lesson-card-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes lesson-ripple {
  0% {
    inset: 50%;
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(0);
  }
  100% {
    inset: -50%;
    opacity: 0;
    transform: translate(0, 0) scale(1);
  }
}

#teacherRecordsAssessmentsPanel {
  --assessment-brand: #1e4307;
  --assessment-green: #4f7d3a;
  --assessment-green-soft: #6f9d58;
  --assessment-mint: #dcead3;
  --assessment-surface: #f7fbf4;
  @apply tw:[padding:0];
  @apply tw:overflow-hidden;
  @apply tw:[border-color:#d4e4ca];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_20px_50px_rgba(30,_67,_7,_0.08)];
}

#teacherRecordsAssessmentsPanel .assessments-hero {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1.5rem];
  @apply tw:[padding:1.55rem_1.65rem];
  @apply tw:[border-bottom:1px_solid_#dcead3];
  @apply tw:[background:radial-gradient(circle_at_88%_12%,_rgba(111,_157,_88,_0.18),_transparent_31%),______linear-gradient(135deg,_#f7fbf4_0%,_#eef6e9_100%)];
}

#teacherRecordsAssessmentsPanel .assessments-hero-copy {
  @apply tw:[min-width:0];
}

#teacherRecordsAssessmentsPanel .assessments-kicker {
  @apply tw:block;
  @apply tw:[margin-bottom:0.35rem];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.1em];
  @apply tw:uppercase;
}

#teacherRecordsAssessmentsPanel .section-title {
  @apply tw:[margin:0];
  @apply tw:[color:#173706];
  @apply tw:[font-size:clamp(1.35rem,_2vw,_1.75rem)];
  @apply tw:[letter-spacing:-0.025em];
}

#teacherRecordsAssessmentsPanel .section-subtitle {
  @apply tw:[max-width:610px];
  @apply tw:[margin-top:0.38rem];
  @apply tw:[color:#52634a];
  @apply tw:[font-size:0.88rem];
}

#teacherRecordsAssessmentsPanel .assessments-summary {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.85rem];
  @apply tw:flex-none;
  @apply tw:[padding:0.78rem_0.95rem];
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.2)];
  @apply tw:[border-radius:16px];
  @apply tw:[background:rgba(255,_255,_255,_0.82)];
  @apply tw:[box-shadow:0_8px_24px_rgba(30,_67,_7,_0.07)];
  @apply tw:[backdrop-filter:blur(8px)];
}

#teacherRecordsAssessmentsPanel .assessments-summary-item {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.58rem];
}

#teacherRecordsAssessmentsPanel .assessments-summary-item > span:last-child {
  @apply tw:grid;
  @apply tw:[gap:0.04rem];
}

#teacherRecordsAssessmentsPanel .assessments-summary-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#dcead3];
  @apply tw:[color:#1e4307];
}

#teacherRecordsAssessmentsPanel .assessments-summary-icon.submissions {
  @apply tw:[background:#e7f1e1];
  @apply tw:[color:#4f7d3a];
}

#teacherRecordsAssessmentsPanel .assessments-summary-item strong {
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:1rem];
  @apply tw:[line-height:1.1];
}

#teacherRecordsAssessmentsPanel .assessments-summary-item small {
  @apply tw:[color:#687761];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:650];
  @apply tw:whitespace-nowrap;
}

#teacherRecordsAssessmentsPanel .assessments-summary-divider {
  @apply tw:[width:1px];
  @apply tw:[height:34px];
  @apply tw:[background:#d4e4ca];
}

#teacherRecordsAssessmentsPanel .assessments-toolbar {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(220px,_1fr)_repeat(3,_minmax(135px,_0.42fr))];
  @apply tw:[gap:0.65rem];
  @apply tw:[margin:1.15rem_1.25rem_0];
  @apply tw:[padding:0.72rem];
  @apply tw:[border:1px_solid_#dce7d6];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsAssessmentsPanel .assessments-search,
#teacherRecordsAssessmentsPanel .assessments-select-field {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[min-width:0];
  @apply tw:[min-height:42px];
  @apply tw:[border:1px_solid_#cfddc7];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#6b7b63];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

#teacherRecordsAssessmentsPanel .assessments-search:focus-within,
#teacherRecordsAssessmentsPanel .assessments-select-field:focus-within {
  @apply tw:[border-color:#6f9d58];
  @apply tw:[box-shadow:0_0_0_3px_rgba(111,_157,_88,_0.16)];
}

#teacherRecordsAssessmentsPanel .assessments-search > i,
#teacherRecordsAssessmentsPanel .assessments-select-field > i:first-of-type {
  @apply tw:[margin-left:0.8rem];
  @apply tw:[color:#6f9d58];
  @apply tw:[font-size:0.78rem];
  @apply tw:pointer-events-none;
}

#teacherRecordsAssessmentsPanel .assessments-search input,
#teacherRecordsAssessmentsPanel .assessments-select-field select {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.58rem_2rem_0.58rem_0.6rem];
  @apply tw:[border:0];
  @apply tw:[outline:0];
  @apply tw:appearance-none;
  @apply tw:[background:transparent];
  @apply tw:[color:#24331e];
  @apply tw:[font:inherit];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:600];
}

#teacherRecordsAssessmentsPanel .assessments-search input::placeholder {
  @apply tw:[color:#8a9783];
  @apply tw:[font-weight:500];
}

#teacherRecordsAssessmentsPanel .assessments-select-field select {
  @apply tw:cursor-pointer;
}

#teacherRecordsAssessmentsPanel .assessments-select-chevron {
  @apply tw:absolute;
  @apply tw:[right:0.75rem];
  @apply tw:[color:#71816a];
  @apply tw:[font-size:0.65rem];
  @apply tw:pointer-events-none;
}

#teacherRecordsAssessmentsPanel .assessments-search-clear {
  @apply tw:absolute;
  @apply tw:[right:0.35rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[border:0];
  @apply tw:[border-radius:9px];
  @apply tw:[background:transparent];
  @apply tw:[color:#687761];
  @apply tw:cursor-pointer;
}

#teacherRecordsAssessmentsPanel .assessments-search-clear:hover {
  @apply tw:[background:#edf5e8];
  @apply tw:[color:#1e4307];
}

#teacherRecordsAssessmentsPanel button:focus-visible,
#teacherRecordsAssessmentsPanel input:focus-visible,
#teacherRecordsAssessmentsPanel select:focus-visible {
  @apply tw:[outline:3px_solid_rgba(79,_125,_58,_0.35)];
  @apply tw:[outline-offset:2px];
}

#teacherRecordsAssessmentsPanel .assessments-results-bar {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin:0.65rem_1.4rem_0];
  @apply tw:[color:#687761];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:600];
}

#teacherRecordsAssessmentsPanel .assessments-results-bar button,
#teacherRecordsAssessmentsPanel .assessments-empty-action {
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#3f6f2a];
  @apply tw:[font:inherit];
  @apply tw:[font-weight:750];
  @apply tw:cursor-pointer;
  @apply tw:[text-decoration:underline];
  @apply tw:[text-underline-offset:3px];
}

#teacherRecordsAssessmentsPanel .records-feed-wrap {
  @apply tw:[margin:0];
  @apply tw:[padding:1rem_1.25rem_1.25rem];
}

#teacherRecordsAssessmentsPanel .records-feed {
  @apply tw:[gap:1rem];
}

#teacherRecordsAssessmentsPanel .assessment-record-card {
  @apply tw:relative;
  @apply tw:[gap:0.9rem];
  @apply tw:overflow-hidden;
  @apply tw:[padding:1.2rem];
  @apply tw:[border-color:#dce7d6];
  @apply tw:[border-radius:18px];
  @apply tw:[box-shadow:0_8px_22px_rgba(30,_67,_7,_0.055)];
  @apply tw:[animation:assessment-card-in_0.42s_both];
  @apply tw:[animation-delay:calc(var(--assessment-index)_*_55ms)];
}

#teacherRecordsAssessmentsPanel .assessment-record-card:hover {
  @apply tw:[transform:translateY(-3px)];
  @apply tw:[border-color:#bfd5b2];
  @apply tw:[box-shadow:0_16px_34px_rgba(30,_67,_7,_0.11)];
}

#teacherRecordsAssessmentsPanel .record-card-header {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto];
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding-bottom:0.85rem];
  @apply tw:[border-color:#e4ece0];
}

#teacherRecordsAssessmentsPanel .assessment-kind-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:48px];
  @apply tw:[height:48px];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#e8f2e2];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:1rem];
}

#teacherRecordsAssessmentsPanel .assessment-kind-quiz .assessment-kind-icon {
  @apply tw:[background:#eaf0f9];
  @apply tw:[color:#4e6c9b];
}

#teacherRecordsAssessmentsPanel .assessment-kind-activity .assessment-kind-icon {
  @apply tw:[background:#fff4e4];
  @apply tw:[color:#9a6a2f];
}

#teacherRecordsAssessmentsPanel .record-card-title {
  @apply tw:[min-width:0];
  @apply tw:[gap:0.24rem];
}

#teacherRecordsAssessmentsPanel .record-type-label {
  @apply tw:[padding:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#6f9d58];
  @apply tw:[font-size:0.64rem];
}

#teacherRecordsAssessmentsPanel .assessment-kind-quiz .record-type-label {
  @apply tw:[color:#5b79a8];
}

#teacherRecordsAssessmentsPanel .assessment-kind-activity .record-type-label {
  @apply tw:[color:#9a6a2f];
}

#teacherRecordsAssessmentsPanel .record-card-title h4 {
  @apply tw:[color:#1d2b17];
  @apply tw:[font-size:1.15rem];
  @apply tw:[line-height:1.32];
  @apply tw:[letter-spacing:-0.012em];
}

#teacherRecordsAssessmentsPanel .record-card-title p {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
  @apply tw:[color:#74806f];
  @apply tw:[font-size:0.72rem];
}

#teacherRecordsAssessmentsPanel .record-card-title p i {
  @apply tw:[color:#8da483];
  @apply tw:[font-size:0.62rem];
}

#teacherRecordsAssessmentsPanel .record-card-date-group {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[padding:0.5rem_0.68rem];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#f7fbf4];
  @apply tw:text-left;
}

#teacherRecordsAssessmentsPanel .record-card-date-group > i {
  @apply tw:[color:#6f9d58];
  @apply tw:[font-size:0.84rem];
}

#teacherRecordsAssessmentsPanel .record-card-date-group > span {
  @apply tw:grid;
  @apply tw:[gap:0.04rem];
}

#teacherRecordsAssessmentsPanel .record-date-label {
  @apply tw:[color:#82907b];
  @apply tw:[font-size:0.58rem];
}

#teacherRecordsAssessmentsPanel .record-card-date {
  @apply tw:[color:#43513d];
  @apply tw:[font-size:0.72rem];
}

#teacherRecordsAssessmentsPanel .record-chip {
  @apply tw:[gap:0.34rem];
  @apply tw:[padding:0.3rem_0.66rem];
}

#teacherRecordsAssessmentsPanel .chip-subject {
  @apply tw:[border-color:#c6dcb9];
  @apply tw:[background:#edf6e8];
  @apply tw:[color:#315f1e];
}

#teacherRecordsAssessmentsPanel .chip-class {
  @apply tw:[border-color:#cdd8eb];
  @apply tw:[background:#f1f5fb];
  @apply tw:[color:#35547f];
}

#teacherRecordsAssessmentsPanel .record-chip-label {
  @apply tw:[font-weight:800];
}

#teacherRecordsAssessmentsPanel .chip-neutral {
  @apply tw:[border-color:#dfe6dc];
  @apply tw:[background:#fafcf9];
  @apply tw:[color:#687761];
}

#teacherRecordsAssessmentsPanel .assessment-action-banner {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.6rem];
  @apply tw:[margin-top:0.85rem];
  @apply tw:[border:1px_solid_#bbd9ad];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.72rem_0.85rem];
  @apply tw:[background:#f1f8ed];
  @apply tw:[color:#315f1e];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
}

#teacherRecordsAssessmentsPanel .assessment-action-banner button {
  @apply tw:ml-auto;
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:inherit];
  @apply tw:cursor-pointer;
}

#teacherRecordsAssessmentsPanel .chip-type {
  @apply tw:[border-color:#d8ddeb];
  @apply tw:[background:#f3f5fa];
  @apply tw:[color:#52627e];
}

#teacherRecordsAssessmentsPanel .chip-success {
  @apply tw:[border-color:#bde0c6];
  @apply tw:[background:#edf8f0];
  @apply tw:[color:#28673b];
}

#teacherRecordsAssessmentsPanel .difficulty-pill {
  @apply tw:[padding:0.3rem_0.66rem];
  @apply tw:[font-size:0.68rem];
}

#teacherRecordsAssessmentsPanel .assessment-meta-grid {
  @apply tw:[gap:0.65rem];
}

#teacherRecordsAssessmentsPanel .meta-item {
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:[padding:0.78rem];
  @apply tw:[border-color:#e0e9db];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f9fcf7];
}

#teacherRecordsAssessmentsPanel .meta-item-icon {
  @apply tw:[width:38px];
  @apply tw:[height:38px];
  @apply tw:[margin:0];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#e4efe0];
  @apply tw:[color:#4f7d3a];
}

#teacherRecordsAssessmentsPanel .meta-item-copy {
  @apply tw:[min-width:0];
}

#teacherRecordsAssessmentsPanel .meta-item-copy span {
  @apply tw:block;
  @apply tw:[color:#7b8875];
  @apply tw:[font-size:0.62rem];
  @apply tw:[font-weight:750];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

#teacherRecordsAssessmentsPanel .meta-item-copy strong {
  @apply tw:block;
  @apply tw:[margin-top:0.15rem];
  @apply tw:[overflow-wrap:anywhere];
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.35];
}

#teacherRecordsAssessmentsPanel .assessment-results-block {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[padding:0.9rem];
  @apply tw:[border-color:#dce7d6];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#fbfdf9];
}

#teacherRecordsAssessmentsPanel .assessment-results-header {
  @apply tw:[margin-bottom:0.75rem];
}

#teacherRecordsAssessmentsPanel .assessment-results-title {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
}

#teacherRecordsAssessmentsPanel .assessment-results-heading-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:36px];
  @apply tw:[height:36px];
  @apply tw:flex-none;
  @apply tw:[border-radius:11px];
  @apply tw:[background:#e8f2e2];
  @apply tw:[color:#4f7d3a];
}

#teacherRecordsAssessmentsPanel .assessment-results-title > div {
  @apply tw:grid;
  @apply tw:[gap:0.12rem];
}

#teacherRecordsAssessmentsPanel .assessment-results-title > div > span {
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-weight:750];
}

#teacherRecordsAssessmentsPanel .assessment-results-title p {
  @apply tw:[color:#788473];
  @apply tw:[font-size:0.72rem];
}

#teacherRecordsAssessmentsPanel .assessment-results-count {
  @apply tw:[background:#e8f2e2];
  @apply tw:[color:#315f1e];
}

#teacherRecordsAssessmentsPanel .inline-empty-state {
  @apply tw:[border-color:#ceddc7];
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsAssessmentsPanel .inline-empty-icon {
  @apply tw:[background:#e1edda];
  @apply tw:[color:#4f7d3a];
}

#teacherRecordsAssessmentsPanel .results-summary-item {
  @apply tw:[border-color:#dde8d8];
  @apply tw:[background:#ffffff];
}

#teacherRecordsAssessmentsPanel .results-summary-item span {
  @apply tw:[color:#74806f];
}

#teacherRecordsAssessmentsPanel .results-summary-item strong {
  @apply tw:[color:#263321];
}

#teacherRecordsAssessmentsPanel .record-card-actions {
  @apply tw:[gap:0.55rem];
  @apply tw:[padding-top:0.1rem];
}

#teacherRecordsAssessmentsPanel .record-link-button {
  @apply tw:relative;
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.52rem_0.82rem];
  @apply tw:overflow-hidden;
  @apply tw:[border-color:#1e4307];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#1e4307];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_7px_16px_rgba(30,_67,_7,_0.14)];
  @apply tw:[transition:transform_0.18s_ease,_background_0.18s_ease,_border-color_0.18s_ease,_box-shadow_0.18s_ease];
}

#teacherRecordsAssessmentsPanel .record-link-button:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[border-color:#315f1e];
  @apply tw:[background:#315f1e];
  @apply tw:[color:#ffffff];
  @apply tw:[text-decoration:none];
  @apply tw:[box-shadow:0_10px_20px_rgba(30,_67,_7,_0.18)];
}

#teacherRecordsAssessmentsPanel .assessment-action-secondary {
  @apply tw:[border-color:#c7d8be];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#3f6f2a];
  @apply tw:[box-shadow:none];
}

#teacherRecordsAssessmentsPanel .assessment-action-secondary i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

#teacherRecordsAssessmentsPanel .assessment-action-primary i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

#teacherRecordsAssessmentsPanel .assessment-action-secondary:hover {
  @apply tw:[border-color:#6f9d58];
  @apply tw:[background:#edf6e8];
  @apply tw:[color:#1e4307];
  @apply tw:[box-shadow:0_7px_16px_rgba(30,_67,_7,_0.09)];
}

#teacherRecordsAssessmentsPanel .table-state {
  @apply tw:flex-col;
  @apply tw:[min-height:230px];
  @apply tw:[border-color:#cbdcc2];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f7fbf4];
  @apply tw:[color:#66745f];
  @apply tw:text-center;
}

#teacherRecordsAssessmentsPanel .assessments-empty-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:54px];
  @apply tw:[height:54px];
  @apply tw:[border-radius:17px];
  @apply tw:[background:#dcead3];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:1.15rem];
}

#teacherRecordsAssessmentsPanel .records-pagination {
  @apply tw:[margin-top:1.1rem];
  @apply tw:[padding:0.9rem];
  @apply tw:[border:1px_solid_#dce7d6];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsAssessmentsPanel .records-pagination-copy {
  @apply tw:[color:#66745f];
}

#teacherRecordsAssessmentsPanel .records-pagination-actions {
  @apply tw:[gap:0.38rem];
}

#teacherRecordsAssessmentsPanel .pagination-btn,
#teacherRecordsAssessmentsPanel .assessments-page-btn {
  @apply tw:relative;
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[min-height:38px];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#cbdcc2];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#35552a];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:750];
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.18s_ease,_border-color_0.18s_ease,_background_0.18s_ease,_color_0.18s_ease];
}

#teacherRecordsAssessmentsPanel .pagination-btn:hover:not(:disabled),
#teacherRecordsAssessmentsPanel .assessments-page-btn:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#6f9d58];
  @apply tw:[background:#edf6e8];
  @apply tw:[color:#1e4307];
}

#teacherRecordsAssessmentsPanel .pagination-btn:disabled {
  @apply tw:[background:#f2f5f0];
  @apply tw:[color:#9aa596];
  @apply tw:opacity-100;
}

#teacherRecordsAssessmentsPanel .assessments-page-numbers {
  @apply tw:inline-flex;
  @apply tw:[gap:0.3rem];
}

#teacherRecordsAssessmentsPanel .assessments-page-btn {
  @apply tw:[width:38px];
  @apply tw:[padding:0];
}

#teacherRecordsAssessmentsPanel .assessments-page-btn.active {
  @apply tw:[border-color:#1e4307];
  @apply tw:[background:#1e4307];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_6px_14px_rgba(30,_67,_7,_0.18)];
}

@keyframes assessment-card-in {
  from {
    opacity: 0;
    transform: translateY(9px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

#teacherRecordsAttendancePanel {
  @apply tw:[border-color:transparent]!;
  @apply tw:[background:linear-gradient(rgb(255,_255,_255)_0%,_rgb(255,_255,_255)_100%)_padding-box,______linear-gradient(135deg,_rgb(139,_198,_106)_0%,_rgb(216,_237,_204)_48%,_rgb(169,_213,_143)_100%)_border-box]!;
}

.records-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:1fr];
  @apply tw:[gap:1rem];
  @apply tw:[max-width:1080px];
  @apply tw:[margin:0_auto];
}

.section-subtitle {
  @apply tw:[margin:0.25rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.85rem];
  @apply tw:[line-height:1.55];
}

.records-section-heading {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.section-kicker {
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
  @apply tw:[color:#2563eb];
}

.records-filters {
  @apply tw:[margin-top:0.85rem];
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(180px,_1fr))];
  @apply tw:[gap:0.65rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.7rem];
}

.filter-field {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.28rem];
}

.filter-field span {
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
  @apply tw:[color:#475569];
  @apply tw:[letter-spacing:0.02em];
  @apply tw:uppercase;
}

.filter-field select {
  @apply tw:[min-height:38px];
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:10px];
  @apply tw:[padding:0.45rem_0.65rem];
  @apply tw:[font-size:0.85rem];
  @apply tw:[color:#0f172a];
  @apply tw:[background:#ffffff];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.filter-field select:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#3b82f6];
  @apply tw:[box-shadow:0_0_0_3px_rgba(59,_130,_246,_0.15)];
}

.records-feed-wrap {
  @apply tw:[margin-top:0.85rem];
}

.records-feed {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

.record-card {
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[padding:1rem];
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
  @apply tw:[box-shadow:0_14px_30px_rgba(15,_23,_42,_0.05)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease];
}

.record-card:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[box-shadow:0_14px_30px_rgba(15,_23,_42,_0.08)];
}

.record-card-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding-bottom:0.8rem];
  @apply tw:[border-bottom:1px_solid_#edf2f7];
}

.record-card-title {
  @apply tw:grid;
  @apply tw:[gap:0.22rem];
}

.record-type-label {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:w-fit;
  @apply tw:[padding:0.2rem_0.55rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.record-card-title h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.02rem];
  @apply tw:[line-height:1.35];
}

.record-card-title p {
  @apply tw:[margin:0.1rem_0_0];
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.74rem];
  @apply tw:[line-height:1.5];
}

.record-card-date-group {
  @apply tw:grid;
  @apply tw:justify-items-end;
  @apply tw:[gap:0.18rem];
  @apply tw:text-right;
}

.record-date-label {
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.record-card-date {
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

.record-chip-row {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.42rem];
}

.record-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.28rem_0.64rem];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[color:#334155];
  @apply tw:[background:#f8fafc];
}

.chip-subject {
  @apply tw:[background:#ecfeff];
  @apply tw:[border-color:#a5f3fc];
  @apply tw:[color:#155e75];
}

.chip-type {
  @apply tw:[background:#fff7ed];
  @apply tw:[border-color:#fed7aa];
  @apply tw:[color:#9a3412];
}

.chip-neutral {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[color:#475569];
}

.chip-success {
  @apply tw:[background:#ecfdf5];
  @apply tw:[border-color:#a7f3d0];
  @apply tw:[color:#166534];
}

.record-card-body {
  @apply tw:grid;
  @apply tw:[gap:0.65rem];
  @apply tw:[padding:0.2rem_0_0];
}

.assessment-meta-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.7rem];
}

.meta-item {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.85rem_0.9rem];
  @apply tw:[background:linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)];
  @apply tw:grid;
  @apply tw:[gap:0.28rem];
  @apply tw:relative;
}

.meta-item-icon {
  @apply tw:[width:34px];
  @apply tw:[height:34px];
  @apply tw:[border-radius:12px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#2563eb];
  @apply tw:[font-size:0.82rem];
  @apply tw:[margin-bottom:0.12rem];
}

.meta-item span {
  @apply tw:block;
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.71rem];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
  @apply tw:[font-weight:700];
}

.meta-item strong {
  @apply tw:block;
  @apply tw:[margin-top:0.28rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.88rem];
  @apply tw:[line-height:1.4];
}

.record-card-actions {
  @apply tw:flex;
  @apply tw:justify-end;
  @apply tw:[padding-top:0.35rem];
}

.assessment-results-block {
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[border-top:1px_solid_#edf2f7];
}

.assessment-results-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:0.65rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.86rem];
  @apply tw:[font-weight:700];
}

.assessment-results-title {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.assessment-results-title p {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:500];
}

.assessment-results-count {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.38rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
}

.inline-empty-state {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[border-radius:16px];
  @apply tw:[color:#64748b];
  @apply tw:[background:#f8fafc];
  @apply tw:[font-size:0.84rem];
}

.inline-empty-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#eef2ff];
  @apply tw:[color:#4338ca];
  @apply tw:[font-size:0.92rem];
  @apply tw:shrink-0;
}

.inline-empty-copy {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.inline-empty-copy strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.88rem];
}

.inline-empty-copy span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.45];
}

.assessment-results-table-wrap {
  @apply tw:[margin-top:0];
}

.assessment-results-summary {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.65rem];
}

.results-summary-item {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.8rem_0.9rem];
  @apply tw:grid;
  @apply tw:[gap:0.22rem];
}

.results-summary-item span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.71rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.results-summary-item strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.88rem];
  @apply tw:[line-height:1.4];
}

.assessment-results-actions {
  @apply tw:flex;
  @apply tw:justify-end;
  @apply tw:[margin-top:0.85rem];
}

.records-table-wrap {
  @apply tw:[margin-top:0.85rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:overflow-x-auto;
  @apply tw:[background:#fff];
  @apply tw:[scrollbar-width:thin];
  @apply tw:[scrollbar-color:#cbd5e1_#f8fafc];
}

.records-table-wrap::-webkit-scrollbar {
  @apply tw:[height:8px];
  @apply tw:[width:8px];
}

.records-table-wrap::-webkit-scrollbar-track {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-radius:999px];
}

.records-table-wrap::-webkit-scrollbar-thumb {
  @apply tw:[background:#cbd5e1];
  @apply tw:[border-radius:999px];
}

.records-table-wrap::-webkit-scrollbar-thumb:hover {
  @apply tw:[background:#94a3b8];
}

.records-table {
  @apply tw:w-full;
  @apply tw:[min-width:1040px];
  @apply tw:border-separate;
  @apply tw:[border-spacing:0];
}

.records-table thead th {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
  @apply tw:[color:#475569];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.03em];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
  @apply tw:text-left;
  @apply tw:[padding:0.85rem_0.95rem];
  @apply tw:whitespace-nowrap;
}

.records-table tbody td {
  @apply tw:[padding:0.85rem_0.95rem];
  @apply tw:[border-bottom:1px_solid_#eef2f7];
  @apply tw:align-middle;
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.88rem];
}

.records-table tbody tr:last-child td {
  @apply tw:[border-bottom:none];
}

.records-table tbody tr:hover td {
  @apply tw:[background:#f8fafc];
}

.records-pagination {
  @apply tw:[margin-top:1rem];
  @apply tw:[border-top:1px_solid_#e2e8f0];
  @apply tw:[padding-top:0.85rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.85rem];
  @apply tw:flex-wrap;
}

.records-pagination-copy {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:600];
}

.records-pagination-actions {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.6rem];
  @apply tw:flex-wrap;
}

.records-page-indicator {
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.pagination-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[border-radius:10px];
  @apply tw:[padding:0.5rem_0.85rem];
  @apply tw:[min-height:38px];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
  @apply tw:[transition:background_0.2s_ease,_border-color_0.2s_ease,_color_0.2s_ease];
}

.pagination-btn:hover:not(:disabled) {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-color:#94a3b8];
}

.pagination-btn:disabled {
  @apply tw:cursor-not-allowed;
  @apply tw:[opacity:0.5];
}

.records-modal-backdrop {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[background:rgba(15,_23,_42,_0.62)];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[z-index:1290];
  @apply tw:[padding:1rem];
}

.records-modal-dialog {
  @apply tw:[width:min(980px,_100%)];
  @apply tw:[max-height:90vh];
  @apply tw:[background:#ffffff];
  @apply tw:[border-radius:20px];
  @apply tw:overflow-hidden;
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[box-shadow:0_28px_60px_rgba(15,_23,_42,_0.26)];
}

.records-modal-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
}

.records-modal-header h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
}

.records-modal-header p {
  @apply tw:[margin:0.2rem_0_0];
  @apply tw:[font-size:0.8rem];
  @apply tw:[color:#64748b];
}

.records-modal-body {
  @apply tw:[padding:1rem];
  @apply tw:overflow-auto;
}

.results-modal-metrics {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.7rem];
}

.activity-results-list {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
  @apply tw:[margin-top:0.85rem];
}

.activity-result-card {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
}

.activity-result-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.85rem];
  @apply tw:flex-wrap;
}

.activity-result-head-meta {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:flex-wrap;
  @apply tw:justify-end;
}

.activity-result-date {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:600];
}

.activity-result-summary-row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:flex-wrap;
}

.activity-result-body {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

.activity-result-section {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.8rem_0.9rem];
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.activity-result-section p {
  @apply tw:[margin:0];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.6];
  @apply tw:whitespace-pre-wrap;
  @apply tw:[word-break:break-word];
}

.activity-result-section-label {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.activity-result-link-list,
.activity-result-file-list {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.55rem];
}

.activity-result-link-list .record-link {
  @apply tw:max-w-full;
  @apply tw:[overflow-wrap:anywhere];
}

.activity-result-file {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:[padding:0.48rem_0.7rem];
  @apply tw:[text-decoration:none];
}

.activity-result-file:hover {
  @apply tw:[background:#eff6ff];
}

.activity-result-feedback {
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[background:#f8fbff];
}

.activity-ai-review {
  @apply tw:[border-color:#c4b5fd];
  @apply tw:[background:#faf8ff];
}

.activity-ai-review__status {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.35rem_0.75rem];
  @apply tw:items-baseline;
}

.activity-ai-review__status span,
.activity-ai-review__item small {
  @apply tw:[color:#64748b];
}

.activity-ai-review__item {
  @apply tw:grid;
  @apply tw:[gap:0.3rem];
  @apply tw:[margin-top:0.75rem];
  @apply tw:[padding:0.75rem];
  @apply tw:[border:1px_solid_#ddd6fe];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#fff];
}

.activity-ai-review__item p {
  @apply tw:[margin:0];
}

.records-modal-footer {
  @apply tw:flex;
  @apply tw:justify-end;
  @apply tw:[gap:0.7rem];
  @apply tw:[padding:0.8rem_1rem_0.95rem];
  @apply tw:[border-top:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
}

.deadline-modal-dialog {
  @apply tw:[width:min(540px,_100%)];
}

.lesson-manage-dialog {
  @apply tw:[width:min(590px,_100%)];
}

.lesson-modal-close {
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[width:36px];
  @apply tw:[height:36px];
  @apply tw:flex-none;
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#64748b];
  @apply tw:cursor-pointer;
}

.lesson-manage-form {
  @apply tw:grid;
  @apply tw:[gap:0.95rem];
}

.lesson-manage-form > label {
  @apply tw:grid;
  @apply tw:[gap:0.42rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:800];
}

.lesson-manage-form input[type='text'],
.lesson-manage-form input[type='number'],
.lesson-manage-form select,
.lesson-manage-form textarea {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:11px];
  @apply tw:[padding:0.68rem_0.75rem];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[font:inherit];
}

.lesson-manage-form textarea {
  @apply tw:resize-y;
  @apply tw:[min-height:110px];
}

.lesson-manage-form input:focus,
.lesson-manage-form select:focus,
.lesson-manage-form textarea:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#7fa66c];
  @apply tw:[box-shadow:0_0_0_3px_rgba(111,_157,_88,_0.15)];
}

.lesson-current-class {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.7rem];
  @apply tw:[border:1px_solid_#dce9d5];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.7rem_0.8rem];
  @apply tw:[background:#f5faf2];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
}

.lesson-current-class strong {
  @apply tw:[color:#315f1e];
}

.lesson-class-picker {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
  @apply tw:[max-height:290px];
  @apply tw:overflow-auto;
  @apply tw:[margin:0];
  @apply tw:[border:0];
  @apply tw:[padding:0];
}

.lesson-class-picker legend {
  @apply tw:[margin-bottom:0.6rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:800];
}

.lesson-class-picker label {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.68rem_0.75rem];
  @apply tw:cursor-pointer;
}

.lesson-class-picker label:has(input:checked) {
  @apply tw:[border-color:#91b57f];
  @apply tw:[background:#f2f8ee];
}

.lesson-class-picker input {
  @apply tw:[width:17px];
  @apply tw:[height:17px];
  @apply tw:[accent-color:#5d8c46];
}

.lesson-class-picker label > span {
  @apply tw:grid;
  @apply tw:[gap:0.12rem];
}

.lesson-class-picker strong {
  @apply tw:[color:#1f2937];
  @apply tw:[font-size:0.84rem];
}

.lesson-class-picker small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.72rem];
}

.lesson-manage-error,
.lesson-manage-empty {
  @apply tw:[margin:0];
  @apply tw:[color:#b91c1c];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.lesson-manage-empty {
  @apply tw:[color:#64748b];
}

.lesson-secondary-btn,
.lesson-primary-btn {
  @apply tw:[border-radius:10px];
  @apply tw:[padding:0.62rem_0.85rem];
  @apply tw:[font:inherit];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:800];
  @apply tw:cursor-pointer;
}

.lesson-secondary-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
}

.lesson-primary-btn {
  @apply tw:[border:1px_solid_#5d8c46];
  @apply tw:[background:#5d8c46];
  @apply tw:[color:#ffffff];
}

.lesson-secondary-btn:disabled,
.lesson-primary-btn:disabled {
  @apply tw:cursor-not-allowed;
  @apply tw:[opacity:0.58];
}

.deadline-modal-body {
  @apply tw:grid;
  @apply tw:[gap:0.95rem];
}

.deadline-editor-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.85rem];
}

.deadline-editor-field {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.deadline-editor-field span {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
}

.deadline-editor-field input {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[padding:0.78rem_0.9rem];
  @apply tw:[font:inherit];
}

.deadline-editor-help {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.83rem];
  @apply tw:[line-height:1.5];
}

.deadline-editor-error {
  @apply tw:[margin:0];
  @apply tw:[color:#b91c1c];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
}

.deadline-modal-footer {
  @apply tw:justify-between;
}

.deadline-clear-btn {
  @apply tw:[border-color:#fecaca];
  @apply tw:[color:#b91c1c];
}

.deadline-clear-btn:hover {
  @apply tw:[background:#fff5f5];
}

.deadline-save-btn {
  @apply tw:[min-width:136px];
  @apply tw:justify-center;
}

.answer-key-modal {
  @apply tw:fixed;
  @apply tw:[inset:0];
  @apply tw:[background:rgba(15,_23,_42,_0.62)];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[z-index:1300];
  @apply tw:[padding:1rem];
}

.answer-key-dialog {
  @apply tw:[width:min(900px,_100%)];
  @apply tw:[max-height:90vh];
  @apply tw:[background:#ffffff];
  @apply tw:[border-radius:20px];
  @apply tw:overflow-hidden;
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[box-shadow:0_28px_60px_rgba(15,_23,_42,_0.26)];
}

.answer-key-header {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
}

.answer-key-header h3 {
  @apply tw:[margin:0];
}

.answer-key-header p {
  @apply tw:[margin:0.2rem_0_0];
  @apply tw:[font-size:0.8rem];
  @apply tw:[color:#64748b];
}

.answer-key-body {
  @apply tw:overflow-auto;
  @apply tw:[padding:1rem_1.1rem_1.1rem];
  @apply tw:grid;
  @apply tw:[gap:0.9rem];
  @apply tw:[scrollbar-width:thin];
  @apply tw:[scrollbar-color:#cbd5e1_#f8fafc];
}

.answer-key-body::-webkit-scrollbar {
  @apply tw:[width:8px];
  @apply tw:[height:8px];
}

.answer-key-body::-webkit-scrollbar-track {
  @apply tw:[background:#f8fafc];
  @apply tw:[border-radius:999px];
}

.answer-key-body::-webkit-scrollbar-thumb {
  @apply tw:[background:#cbd5e1];
  @apply tw:[border-radius:999px];
}

.answer-key-body::-webkit-scrollbar-thumb:hover {
  @apply tw:[background:#94a3b8];
}

.answer-key-footer {
  @apply tw:flex;
  @apply tw:justify-end;
  @apply tw:[padding:0.75rem_1rem_0.95rem];
  @apply tw:[border-top:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
}

.answer-key-close-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[border-radius:10px];
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-weight:700];
  @apply tw:[padding:0.48rem_0.85rem];
  @apply tw:cursor-pointer;
}

.answer-key-close-btn:hover {
  @apply tw:[background:#f8fafc];
}

.answer-key-item {
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_10px_24px_rgba(15,_23,_42,_0.05)];
  @apply tw:grid;
  @apply tw:[gap:0.6rem];
}

.answer-key-item-head {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.answer-key-item h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.96rem];
}

.answer-option-count {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.28rem_0.62rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eef2ff];
  @apply tw:[color:#4338ca];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
}

.answer-question {
  @apply tw:[margin:0];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.86rem];
  @apply tw:[line-height:1.55];
}

.answer-options-shell {
  @apply tw:[margin-top:0.45rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.7rem];
}

.answer-options {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
  @apply tw:[max-height:220px];
  @apply tw:overflow-y-auto;
  @apply tw:[padding-right:0.2rem];
}

.answer-options span {
  @apply tw:[border:1px_solid_#dbe2ea];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.6rem_0.75rem];
  @apply tw:[font-size:0.8rem];
  @apply tw:[color:#334155];
  @apply tw:[background:#ffffff];
  @apply tw:[line-height:1.45];
  @apply tw:[word-break:break-word];
}

.answer-options span.correct {
  @apply tw:[border-color:#22c55e];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
  @apply tw:[font-weight:700];
}

.answer-correct {
  @apply tw:[margin:0.1rem_0_0];
  @apply tw:[font-size:0.84rem];
  @apply tw:[color:#0f172a];
}

.answer-options::-webkit-scrollbar {
  @apply tw:[width:8px];
}

.answer-options::-webkit-scrollbar-thumb {
  @apply tw:[background:#cbd5e1];
  @apply tw:[border-radius:999px];
}

.answer-options::-webkit-scrollbar-track {
  @apply tw:[background:#f8fafc];
}

.primary-cell {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.1rem];
}

.primary-cell strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.9rem];
}

.primary-cell small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.72rem];
}

.secondary-cell {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.1rem];
}

.secondary-cell span {
  @apply tw:[color:#0f172a];
}

.secondary-cell small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
}

.student-identity {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:[min-width:0];
}

.student-identity.compact {
  @apply tw:[gap:0.6rem];
}

.student-avatar {
  @apply tw:[width:2.35rem];
  @apply tw:[height:2.35rem];
  @apply tw:[border-radius:999px];
  @apply tw:object-cover;
  @apply tw:shrink-0;
  @apply tw:[border:2px_solid_rgba(148,_163,_184,_0.22)];
}

.student-details {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.12rem];
  @apply tw:[min-width:0];
}

.student-details strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.88rem];
}

.student-details small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.74rem];
  @apply tw:whitespace-nowrap;
  @apply tw:overflow-hidden;
  @apply tw:text-ellipsis;
}

.file-cell {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.45rem];
}

.file-name {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.92rem];
  @apply tw:[font-weight:700];
  @apply tw:[line-height:1.45];
  @apply tw:[word-break:break-word];
}

.file-type {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.73rem];
  @apply tw:[font-weight:600];
  @apply tw:[letter-spacing:0.02em];
  @apply tw:uppercase;
}

.attachment-row {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto];
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.85rem];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.85)];
}

.attachment-row:last-child {
  @apply tw:[border-bottom:1px_solid_#e2e8f0];
}

.attachment-icon {
  @apply tw:[width:46px];
  @apply tw:[height:46px];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#2563eb];
  @apply tw:[font-size:1rem];
  @apply tw:shrink-0;
}

.attachment-info {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.22rem];
  @apply tw:[min-width:0];
}

.attachment-actions {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:shrink-0;
}

.record-link {
  @apply tw:[color:#111111];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:[text-decoration:none];
  @apply tw:[border:none];
  @apply tw:[background:transparent];
  @apply tw:[padding:0];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
}

.record-link:hover {
  @apply tw:[text-decoration:underline];
}

.record-link-button {
  @apply tw:w-fit;
  @apply tw:[border:1px_solid_#111111];
  @apply tw:[background:#111111];
  @apply tw:[color:#ffffff];
  @apply tw:[border-radius:10px];
  @apply tw:[padding:0.5rem_0.8rem];
  @apply tw:[min-height:38px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[box-shadow:0_10px_20px_rgba(37,_99,_235,_0.16)];
}

.record-link-button:hover {
  @apply tw:[background:#1f2937];
  @apply tw:[color:#ffffff];
  @apply tw:[text-decoration:none];
}

.record-link-button i,
.record-link-button .fas,
.record-link-button .fa-key {
  @apply tw:[color:#ffffff]!;
}

.difficulty-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.25rem_0.55rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.03em];
  @apply tw:[border:1px_solid_transparent];
}

.difficulty-easy {
  @apply tw:[background:#ecfdf3];
  @apply tw:[border-color:#a7f3d0];
  @apply tw:[color:#166534];
}

.difficulty-medium {
  @apply tw:[background:#fff7ed];
  @apply tw:[border-color:#fed7aa];
  @apply tw:[color:#9a3412];
}

.status-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-width:72px];
  @apply tw:[padding:0.36rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.04em];
}

.status-active {
  @apply tw:[background:rgba(34,_197,_94,_0.16)];
  @apply tw:[color:#166534];
}

.status-suspended {
  @apply tw:[background:rgba(239,_68,_68,_0.14)];
  @apply tw:[color:#991b1b];
}

.difficulty-hard {
  @apply tw:[background:#fef2f2];
  @apply tw:[border-color:#fecaca];
  @apply tw:[color:#991b1b];
}

.table-state {
  @apply tw:[min-height:150px];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.6rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-weight:600];
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
}

@media (max-width: 768px) {
  #teacherRecordsAssessmentsPanel .assessments-hero {
    @apply tw:items-start;
    @apply tw:[padding:1.2rem];
  }

  #teacherRecordsAssessmentsPanel .assessments-summary {
    @apply tw:[padding:0.65rem_0.75rem];
  }

  #teacherRecordsAssessmentsPanel .assessments-summary-icon,
  #teacherRecordsAssessmentsPanel .assessments-summary-divider {
    @apply tw:hidden;
  }

  #teacherRecordsAssessmentsPanel .assessments-toolbar {
    @apply tw:[grid-template-columns:1fr_1fr];
    @apply tw:[margin:0.9rem_0.9rem_0];
  }

  #teacherRecordsAssessmentsPanel .assessments-search {
    @apply tw:[grid-column:1_/_-1];
  }

  #teacherRecordsAssessmentsPanel .records-feed-wrap {
    @apply tw:[padding:0.85rem_0.9rem_1rem];
  }

  #teacherRecordsAssessmentsPanel .assessment-record-card {
    @apply tw:[padding:0.9rem];
    @apply tw:[border-radius:16px];
  }

  #teacherRecordsAssessmentsPanel .record-card-header {
    @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
    @apply tw:[gap:0.65rem];
  }

  #teacherRecordsAssessmentsPanel .record-card-date-group {
    @apply tw:[grid-column:2];
    @apply tw:w-fit;
  }

  #teacherRecordsAssessmentsPanel .assessment-meta-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  #teacherRecordsAssessmentsPanel .meta-item {
    @apply tw:[padding:0.68rem];
  }

  #teacherRecordsAssessmentsPanel .assessment-results-header {
    @apply tw:flex-row;
    @apply tw:items-center;
  }

  #teacherRecordsAssessmentsPanel .record-card-actions {
    @apply tw:justify-end;
  }

  #teacherRecordsAssessmentsPanel .records-pagination {
    @apply tw:items-center;
  }

  #teacherRecordsAssessmentsPanel .records-pagination-actions {
    @apply tw:w-auto;
  }

  #teacherRecordsLessonsPanel .lessons-hero {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:items-start;
    @apply tw:[gap:1rem];
    @apply tw:[padding:1.2rem];
  }

  #teacherRecordsLessonsPanel .lessons-upload-summary {
    @apply tw:w-full;
    @apply tw:min-w-0;
    @apply tw:box-border;
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_1fr)_auto_minmax(0,_1fr)];
    @apply tw:[padding:0.65rem_0.75rem];
  }

  #teacherRecordsLessonsPanel .lessons-summary-icon {
    @apply tw:hidden;
  }

  #teacherRecordsLessonsPanel .lessons-summary-copy {
    @apply tw:min-w-0;
    @apply tw:text-center;
  }

  #teacherRecordsLessonsPanel .lessons-summary-copy span {
    @apply tw:whitespace-normal;
  }

  #teacherRecordsLessonsPanel .lessons-summary-divider {
    @apply tw:block;
    @apply tw:[height:28px];
  }

  #teacherRecordsLessonsPanel .lessons-toolbar {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:[margin:0.9rem_0.9rem_0];
  }

  #teacherRecordsLessonsPanel .lessons-search {
    @apply tw:[grid-column:1_/_-1];
  }

  #teacherRecordsLessonsPanel .lessons-search input,
  #teacherRecordsLessonsPanel .lessons-select-field select {
    @apply tw:[min-height:44px];
    @apply tw:[font-size:16px];
  }

  #teacherRecordsLessonsPanel .lessons-search input {
    @apply tw:[padding-right:3rem];
  }

  #teacherRecordsLessonsPanel .lessons-search-clear {
    @apply tw:[right:0];
    @apply tw:[width:44px];
    @apply tw:[height:44px];
  }

  #teacherRecordsLessonsPanel .records-feed-wrap {
    @apply tw:[padding:0.85rem_0.9rem_1rem];
  }

  #teacherRecordsLessonsPanel .records-feed,
  #teacherRecordsLessonsPanel .lesson-document-card,
  #teacherRecordsLessonsPanel .record-card-body {
    @apply tw:min-w-0;
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  #teacherRecordsLessonsPanel .lesson-document-card {
    @apply tw:[gap:0.85rem];
    @apply tw:[padding:0.9rem];
    @apply tw:[border-radius:16px];
  }

  #teacherRecordsLessonsPanel .record-card-header {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:items-start;
    @apply tw:[gap:0.75rem];
    @apply tw:[padding-bottom:0];
  }

  #teacherRecordsLessonsPanel .record-card-title {
    @apply tw:min-w-0;
  }

  #teacherRecordsLessonsPanel .record-card-title h4 {
    @apply tw:[font-size:1rem];
    @apply tw:[overflow-wrap:anywhere];
  }

  #teacherRecordsLessonsPanel .lesson-card-header-actions {
    @apply tw:min-w-0;
    @apply tw:w-full;
    @apply tw:justify-items-stretch;
    @apply tw:[gap:0.65rem];
  }

  #teacherRecordsLessonsPanel .record-card-date-group {
    @apply tw:w-fit;
    @apply tw:[justify-items:initial];
    @apply tw:flex-none;
  }

  #teacherRecordsLessonsPanel .record-card-date-group > span {
    @apply tw:flex;
    @apply tw:flex-wrap;
    @apply tw:items-baseline;
    @apply tw:[gap:0.35rem];
  }

  #teacherRecordsLessonsPanel .record-date-label {
    @apply tw:[font-size:0.7rem];
  }

  #teacherRecordsLessonsPanel .lesson-manage-actions {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(0,_1.4fr)];
    @apply tw:[gap:0.5rem];
  }

  #teacherRecordsLessonsPanel .lesson-manage-actions button {
    @apply tw:min-w-0;
    @apply tw:[min-height:44px];
    @apply tw:justify-center;
    @apply tw:[font-size:0.75rem];
    @apply tw:whitespace-normal;
  }

  #teacherRecordsLessonsPanel .record-chip {
    @apply tw:min-w-0;
    @apply tw:max-w-full;
    @apply tw:items-start;
    @apply tw:whitespace-normal;
    @apply tw:[overflow-wrap:anywhere];
    @apply tw:[font-size:0.75rem];
    @apply tw:[line-height:1.45];
    @apply tw:[padding:0.4rem_0.55rem];
  }

  #teacherRecordsLessonsPanel .chip-class {
    @apply tw:[flex-basis:100%];
    @apply tw:[border-radius:12px];
  }

  #teacherRecordsLessonsPanel .record-chip-value {
    @apply tw:min-w-0;
  }

  #teacherRecordsLessonsPanel .record-chip > i,
  #teacherRecordsLessonsPanel .record-chip-label {
    @apply tw:shrink-0;
  }

  #teacherRecordsLessonsPanel .attachment-row {
    @apply tw:[grid-template-columns:40px_minmax(0,_1fr)];
    @apply tw:items-start;
    @apply tw:[gap:0.65rem];
    @apply tw:[padding:0.68rem];
  }

  #teacherRecordsLessonsPanel .attachment-icon {
    @apply tw:[width:40px];
    @apply tw:[height:40px];
  }

  #teacherRecordsLessonsPanel .file-name {
    @apply tw:whitespace-normal;
    @apply tw:[overflow-wrap:anywhere];
    @apply tw:[line-height:1.45];
  }

  #teacherRecordsLessonsPanel .attachment-actions {
    @apply tw:[grid-column:1_/_-1];
    @apply tw:w-full;
    @apply tw:flex-nowrap;
    @apply tw:[gap:0.5rem];
  }

  #teacherRecordsLessonsPanel .record-link {
    @apply tw:flex-1;
    @apply tw:min-w-0;
    @apply tw:w-auto;
    @apply tw:h-auto;
    @apply tw:[min-height:44px];
    @apply tw:[gap:0.4rem];
    @apply tw:[padding:0.5rem_0.35rem];
    @apply tw:[font-size:0.75rem];
  }

  #teacherRecordsLessonsPanel .record-link .sr-only {
    @apply tw:not-sr-only;
  }

  #teacherRecordsLessonsPanel .lessons-results-bar button,
  #teacherRecordsLessonsPanel .lessons-empty-action,
  #teacherRecordsLessonsPanel .pagination-btn,
  #teacherRecordsLessonsPanel .lessons-page-btn {
    @apply tw:[min-width:44px];
    @apply tw:[min-height:44px];
  }

  #teacherRecordsLessonsPanel .lessons-results-bar {
    @apply tw:flex-wrap;
  }

  #teacherRecordsLessonsPanel .records-pagination {
    @apply tw:items-center;
  }

  #teacherRecordsLessonsPanel .records-pagination-actions {
    @apply tw:w-auto;
  }

  .records-section {
    @apply tw:[padding:0.85rem];
    @apply tw:[border-radius:16px];
  }

  .records-filters {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:[gap:0.55rem];
    @apply tw:[padding:0.55rem];
  }

  .record-card {
    @apply tw:[padding:0.78rem];
    @apply tw:[border-radius:14px];
    @apply tw:[gap:0.56rem];
    @apply tw:[box-shadow:0_6px_14px_rgba(15,_23,_42,_0.05)];
  }

  .record-card-header {
    @apply tw:flex-col;
    @apply tw:items-start;
    @apply tw:[gap:0.45rem];
    @apply tw:[padding-bottom:0.5rem];
  }

  .record-card-title h4 {
    @apply tw:[font-size:0.88rem];
    @apply tw:[line-height:1.25];
  }

  .record-card-title p {
    @apply tw:[margin-top:0.15rem];
    @apply tw:[font-size:0.72rem];
  }

  .record-card-date-group {
    @apply tw:justify-items-start;
    @apply tw:text-left;
  }

  .record-card-date {
    @apply tw:whitespace-normal;
    @apply tw:[font-size:0.71rem];
  }

  .assessment-meta-grid {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:[gap:0.45rem];
  }

  .assessment-results-block {
    @apply tw:[padding:0.8rem];
    @apply tw:[border-radius:14px];
  }

  .assessment-results-header {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .assessment-results-summary,
  .results-modal-metrics {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .activity-result-head {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .activity-result-head-meta {
    @apply tw:justify-start;
  }

  .deadline-editor-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .records-pagination {
    @apply tw:items-start;
  }

  .records-pagination-actions {
    @apply tw:w-full;
    @apply tw:justify-between;
  }

  .records-page-indicator {
    @apply tw:w-full;
    @apply tw:[order:-1];
  }

  .records-modal-dialog {
    @apply tw:[border-radius:16px];
  }

  .records-modal-header {
    @apply tw:items-start;
  }

  .attachment-row {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:items-start;
    @apply tw:[gap:0.5rem];
    @apply tw:[padding:0.75rem_0.8rem];
    @apply tw:[border-radius:12px];
  }

  .attachment-actions {
    @apply tw:w-full;
    @apply tw:justify-start;
    @apply tw:flex-wrap;
    @apply tw:[gap:0.4rem];
  }

  .attachment-icon {
    @apply tw:[width:40px];
    @apply tw:[height:40px];
    @apply tw:[border-radius:12px];
  }

  .record-card-actions {
    @apply tw:justify-stretch;
  }

  .record-card-actions .record-link-button {
    @apply tw:w-full;
  }

  .record-chip {
    @apply tw:[font-size:0.64rem];
    @apply tw:[padding:0.16rem_0.42rem];
  }

  .file-name {
    @apply tw:[font-size:0.84rem];
    @apply tw:[line-height:1.2];
  }

  .file-type {
    @apply tw:[font-size:0.66rem];
  }

  .record-link {
    @apply tw:[font-size:0.74rem];
  }

  .record-link-button {
    @apply tw:[min-height:30px];
    @apply tw:[padding:0.26rem_0.52rem];
    @apply tw:[border-radius:8px];
  }

  .meta-item {
    @apply tw:[padding:0.48rem_0.52rem];
  }

  .meta-item-icon {
    @apply tw:[width:30px];
    @apply tw:[height:30px];
    @apply tw:[border-radius:10px];
  }

  .meta-item span {
    @apply tw:[font-size:0.66rem];
  }

  .meta-item strong {
    @apply tw:[font-size:0.78rem];
  }
}

@media (max-width: 420px) {
  #teacherRecordsAssessmentsPanel .assessments-hero {
    @apply tw:grid;
    @apply tw:[gap:0.85rem];
    @apply tw:[padding:1rem];
  }

  #teacherRecordsAssessmentsPanel .assessments-summary {
    @apply tw:w-full;
    @apply tw:justify-between;
    @apply tw:box-border;
  }

  #teacherRecordsAssessmentsPanel .assessments-summary-divider {
    @apply tw:block;
    @apply tw:[height:28px];
  }

  #teacherRecordsAssessmentsPanel .assessments-toolbar {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:[gap:0.55rem];
    @apply tw:[margin:0.75rem_0.65rem_0];
    @apply tw:[padding:0.55rem];
    @apply tw:[border-radius:15px];
  }

  #teacherRecordsAssessmentsPanel .assessments-search {
    @apply tw:[grid-column:auto];
  }

  #teacherRecordsAssessmentsPanel .assessments-results-bar {
    @apply tw:items-start;
    @apply tw:[margin-inline:0.85rem];
  }

  #teacherRecordsAssessmentsPanel .records-feed-wrap {
    @apply tw:[padding:0.72rem_0.65rem_0.8rem];
  }

  #teacherRecordsAssessmentsPanel .record-card-header {
    @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  }

  #teacherRecordsAssessmentsPanel .assessment-kind-icon {
    @apply tw:[width:42px];
    @apply tw:[height:42px];
  }

  #teacherRecordsAssessmentsPanel .record-card-title h4 {
    @apply tw:[font-size:0.98rem];
  }

  #teacherRecordsAssessmentsPanel .record-card-date-group {
    @apply tw:[grid-column:1_/_-1];
  }

  #teacherRecordsAssessmentsPanel .assessment-results-header {
    @apply tw:items-start;
  }

  #teacherRecordsAssessmentsPanel .assessment-results-heading-icon {
    @apply tw:hidden;
  }

  #teacherRecordsAssessmentsPanel .record-card-actions {
    @apply tw:grid;
    @apply tw:[grid-template-columns:1fr];
  }

  #teacherRecordsAssessmentsPanel .record-card-actions .record-link-button {
    @apply tw:w-full;
  }

  #teacherRecordsAssessmentsPanel .records-pagination {
    @apply tw:[padding:0.75rem];
  }

  #teacherRecordsAssessmentsPanel .records-pagination-actions {
    @apply tw:w-full;
    @apply tw:grid;
    @apply tw:[grid-template-columns:1fr_auto_1fr];
  }

  #teacherRecordsAssessmentsPanel .pagination-btn {
    @apply tw:[min-width:0];
    @apply tw:[padding-inline:0.55rem];
  }

  #teacherRecordsAssessmentsPanel .assessments-page-numbers {
    @apply tw:hidden;
  }

  #teacherRecordsLessonsPanel .lessons-hero {
    @apply tw:grid;
    @apply tw:[gap:0.85rem];
    @apply tw:[padding:1rem];
  }

  #teacherRecordsLessonsPanel .lessons-upload-summary {
    @apply tw:w-full;
    @apply tw:justify-between;
    @apply tw:box-border;
  }

  #teacherRecordsLessonsPanel .lessons-summary-divider {
    @apply tw:block;
    @apply tw:[height:28px];
  }

  #teacherRecordsLessonsPanel .lessons-toolbar {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:[gap:0.55rem];
    @apply tw:[margin:0.75rem_0.65rem_0];
    @apply tw:[padding:0.55rem];
    @apply tw:[border-radius:15px];
  }

  #teacherRecordsLessonsPanel .lessons-search {
    @apply tw:[grid-column:auto];
  }

  #teacherRecordsLessonsPanel .lessons-results-bar {
    @apply tw:items-start;
    @apply tw:[margin-inline:0.85rem];
  }

  #teacherRecordsLessonsPanel .records-feed-wrap {
    @apply tw:[padding:0.72rem_0.65rem_0.8rem];
  }

  #teacherRecordsLessonsPanel .record-card-header {
    @apply tw:flex-col;
  }

  #teacherRecordsLessonsPanel .record-card-date-group {
    @apply tw:w-fit;
  }

  #teacherRecordsLessonsPanel .attachment-row {
    @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  }

  #teacherRecordsLessonsPanel .records-pagination {
    @apply tw:[padding:0.75rem];
  }

  #teacherRecordsLessonsPanel .records-pagination-actions {
    @apply tw:w-full;
    @apply tw:grid;
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  #teacherRecordsLessonsPanel .pagination-btn {
    @apply tw:[min-width:0];
    @apply tw:[padding-inline:0.55rem];
  }

  #teacherRecordsLessonsPanel .lessons-page-numbers {
    @apply tw:hidden;
  }

  .records-section {
    @apply tw:[padding:0.62rem];
  }

  .section-subtitle {
    @apply tw:[font-size:0.76rem];
  }

  .record-card-title h4 {
    @apply tw:[font-size:0.84rem];
  }

  .record-card-title p {
    @apply tw:[font-size:0.69rem];
  }

  .meta-item {
    @apply tw:[padding:0.36rem_0.42rem];
  }

  .record-chip-row {
    @apply tw:[gap:0.3rem];
  }

  .record-card {
    @apply tw:[padding:0.6rem];
    @apply tw:[gap:0.46rem];
  }

  .assessment-results-summary,
  .results-modal-metrics {
    @apply tw:[grid-template-columns:1fr];
  }

  .pagination-btn {
    @apply tw:[flex:1_1_calc(50%_-_0.3rem)];
  }
}

/* Keep filter labels readable on phones; wider tablets retain two columns. */
@media (max-width: 560px) {
  #teacherRecordsLessonsPanel .lessons-toolbar {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }
}

@media (prefers-reduced-motion: reduce) {
  #teacherRecordsAssessmentsPanel .assessment-record-card {
    @apply tw:animate-none;
    @apply tw:[transition:none];
  }

  #teacherRecordsAssessmentsPanel .record-link-button,
  #teacherRecordsAssessmentsPanel .pagination-btn,
  #teacherRecordsAssessmentsPanel .assessments-page-btn {
    @apply tw:[transition:none];
  }

  #teacherRecordsLessonsPanel .lesson-document-card {
    @apply tw:animate-none;
    @apply tw:[transition:none];
  }

  #teacherRecordsLessonsPanel .record-link,
  #teacherRecordsLessonsPanel .lesson-manage-actions button,
  #teacherRecordsLessonsPanel .attachment-row,
  #teacherRecordsLessonsPanel .lesson-document-card::before,
  #teacherRecordsLessonsPanel .pagination-btn,
  #teacherRecordsLessonsPanel .lessons-page-btn {
    @apply tw:[transition:none];
  }

  #teacherRecordsLessonsPanel .record-link:active::after {
    @apply tw:animate-none;
  }
}

@media (min-width: 1280px) {
  .records-grid {
    @apply tw:[grid-template-columns:1fr];
  }
}

.attendance-section {
  @apply tw:[gap:1.55rem];
}

.attendance-shell {
  @apply tw:grid;
  @apply tw:[gap:1.25rem];
}

.attendance-hero-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:24px];
  @apply tw:[padding:1.35rem];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(37,_99,_235,_0.12),_transparent_32%),______radial-gradient(circle_at_bottom_left,_rgba(14,_165,_233,_0.09),_transparent_28%),______linear-gradient(135deg,_#ffffff_0%,_#eff6ff_54%,_#f8fafc_100%)];
  @apply tw:grid;
  @apply tw:[gap:1.15rem];
}

.attendance-hero-copy {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
}

.attendance-kicker,
.attendance-panel-kicker {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:w-fit;
  @apply tw:[padding:0.35rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(37,_99,_235,_0.1)];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.73rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.attendance-hero-copy h4 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.35rem];
  @apply tw:[line-height:1.15];
  @apply tw:[color:#0f172a];
}

.attendance-hero-copy p {
  @apply tw:[margin:0];
  @apply tw:[max-width:56rem];
  @apply tw:[color:#475569];
  @apply tw:[line-height:1.55];
}

.attendance-hero-chips {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.6rem];
}

.attendance-summary-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(5,_minmax(0,_1fr))];
  @apply tw:[gap:0.95rem];
}

.attendance-summary-card {
  @apply tw:[border:1px_solid_rgba(203,_213,_225,_0.8)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.85)];
  @apply tw:[backdrop-filter:blur(10px)];
  @apply tw:[padding:1rem];
  @apply tw:grid;
  @apply tw:[gap:0.38rem];
  @apply tw:[box-shadow:0_14px_28px_rgba(15,_23,_42,_0.05)];
}

.attendance-summary-card span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.77rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.04em];
}

.attendance-summary-card strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.45rem];
  @apply tw:[line-height:1];
}

.attendance-toolbar-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:22px];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(37,_99,_235,_0.08),_transparent_30%),______linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)];
  @apply tw:[padding:1.2rem];
  @apply tw:grid;
  @apply tw:[gap:1.05rem];
  @apply tw:[margin-bottom:0.35rem];
}

.attendance-toolbar-header {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:justify-between;
  @apply tw:items-start;
  @apply tw:[gap:0.9rem];
}

.attendance-toolbar-header-copy {
  @apply tw:grid;
  @apply tw:[gap:0.32rem];
  @apply tw:[max-width:620px];
}

.attendance-toolbar-kicker {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:w-fit;
  @apply tw:[padding:0.24rem_0.58rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(37,_99,_235,_0.08)];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.71rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.attendance-toolbar-header-copy h5 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1rem];
}

.attendance-toolbar-header-copy p {
  @apply tw:[margin:0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.5];
}

.attendance-toolbar-note {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:w-fit;
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#dbeafe];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[padding:0.5rem_0.8rem];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
}

.attendance-scope-panel {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.95rem];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.8)];
}

.attendance-scope-panel-copy {
  @apply tw:grid;
  @apply tw:[gap:0.24rem];
}

.attendance-scope-panel-copy strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.92rem];
}

.attendance-scope-panel-copy small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.4];
}

.attendance-step-badge {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:w-fit;
  @apply tw:[min-height:1.4rem];
  @apply tw:[padding:0.18rem_0.52rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.66rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.attendance-scope-switch {
  @apply tw:inline-flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.55rem];
}

.attendance-scope-btn {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[padding:0.62rem_1rem];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
  @apply tw:[transition:all_0.18s_ease];
}

.attendance-scope-btn.active {
  @apply tw:[background:#dbeafe];
  @apply tw:[border-color:#93c5fd];
  @apply tw:[color:#1d4ed8];
}

.attendance-scope-btn:disabled {
  @apply tw:cursor-not-allowed;
  @apply tw:[opacity:0.6];
}

.attendance-toolbar-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.9rem];
}

.attendance-toolbar-field-card {
  @apply tw:grid;
  @apply tw:[align-content:start];
  @apply tw:[gap:0.7rem];
  @apply tw:[min-width:0];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
}

.attendance-toolbar-field-card .filter-field {
  @apply tw:[margin:0];
}

.attendance-date-card {
  @apply tw:[align-content:start];
  @apply tw:[background:linear-gradient(180deg,_rgba(255,_255,_255,_0.96)_0%,_rgba(239,_246,_255,_0.9)_100%)];
}

.attendance-date-card-copy {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.75rem];
}

.attendance-date-card-icon {
  @apply tw:[width:2.2rem];
  @apply tw:[height:2.2rem];
  @apply tw:[border-radius:14px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:linear-gradient(135deg,_#dbeafe,_#bfdbfe)];
  @apply tw:[color:#1d4ed8];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(147,_197,_253,_0.85)];
  @apply tw:shrink-0;
}

.attendance-date-card-copy strong {
  @apply tw:block;
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.94rem];
}

.attendance-date-card-copy small {
  @apply tw:block;
  @apply tw:[margin-top:0.16rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.45];
}

.attendance-date-field {
  @apply tw:[gap:0.42rem];
}

.attendance-date-input-wrap {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[min-height:42px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.2rem_0.75rem];
  @apply tw:[background:#ffffff];
  @apply tw:[transition:border-color_0.18s_ease,_box-shadow_0.18s_ease];
}

.attendance-date-input-wrap:focus-within {
  @apply tw:[border-color:#60a5fa];
  @apply tw:[box-shadow:0_0_0_3px_rgba(59,_130,_246,_0.14)];
}

.attendance-date-input-wrap > i {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.9rem];
}

.attendance-date-input-wrap input {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#0f172a];
  @apply tw:[font:inherit];
  @apply tw:[font-weight:700];
  @apply tw:[outline:none];
}

.attendance-date-quick-actions {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.5rem];
}

.attendance-date-chip {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[padding:0.38rem_0.72rem];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
  @apply tw:[transition:all_0.18s_ease];
}

.attendance-date-chip:hover {
  @apply tw:[border-color:#93c5fd];
  @apply tw:[color:#1d4ed8];
}

.attendance-date-chip.active {
  @apply tw:[background:#dbeafe];
  @apply tw:[border-color:#93c5fd];
  @apply tw:[color:#1d4ed8];
}

.attendance-date-helper {
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.77rem];
  @apply tw:[line-height:1.4];
}

.attendance-context-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.85rem_0.95rem];
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.attendance-context-card span,
.attendance-context-card small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.attendance-context-card strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.96rem];
}

.attendance-toolbar-actions-card {
  @apply tw:[align-content:start];
}

.attendance-toolbar-actions {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
}

.attendance-actions-hint {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.77rem];
  @apply tw:[line-height:1.45];
}

.attendance-legend-block {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
}

.attendance-legend-title {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.attendance-load-btn {
  @apply tw:[background:#ffffff];
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[color:#1d4ed8];
}

.attendance-save-btn {
  @apply tw:[background:linear-gradient(135deg,_#2563eb,_#1d4ed8)];
  @apply tw:[color:#ffffff];
  @apply tw:[border-color:#1d4ed8];
  @apply tw:[box-shadow:0_14px_28px_rgba(37,_99,_235,_0.2)];
}

.attendance-lock-btn {
  @apply tw:[background:linear-gradient(135deg,_#0f766e,_#115e59)];
  @apply tw:[color:#ffffff];
  @apply tw:[border-color:#115e59];
  @apply tw:[box-shadow:0_14px_28px_rgba(15,_118,_110,_0.18)];
}

.attendance-legend-row {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.7rem];
}

.attendance-legend-pill,
.attendance-breakdown-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.4rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:800];
}

.attendance-feedback {
  @apply tw:fixed;
  @apply tw:[top:1.25rem];
  @apply tw:[left:50%];
  @apply tw:[z-index:1400];
  @apply tw:w-max;
  @apply tw:[max-width:calc(100vw_-_2rem)];
  @apply tw:[margin:0];
  @apply tw:[padding:0.85rem_1rem];
  @apply tw:[border-radius:14px];
  @apply tw:[font-size:0.88rem];
  @apply tw:[font-weight:600];
  @apply tw:[line-height:1.4];
  @apply tw:text-center;
  @apply tw:[box-shadow:0_14px_32px_rgba(15,_23,_42,_0.2)];
  @apply tw:[transform:translateX(-50%)];
}

.attendance-feedback-success {
  @apply tw:[background:#ecfdf5];
  @apply tw:[color:#065f46];
  @apply tw:[border:1px_solid_#a7f3d0];
}

.attendance-feedback-error {
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#991b1b];
  @apply tw:[border:1px_solid_#fecaca];
}

.attendance-layout {
  @apply tw:grid;
  @apply tw:[gap:1.25rem];
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
}

.attendance-panel {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:24px];
  @apply tw:[background:linear-gradient(180deg,_rgba(255,_255,_255,_0.98)_0%,_rgba(248,_251,_255,_0.98)_100%)];
  @apply tw:[padding:1rem];
  @apply tw:grid;
  @apply tw:[gap:0.95rem];
  @apply tw:[box-shadow:0_18px_32px_rgba(15,_23,_42,_0.05)];
}

.attendance-panel-head {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[gap:0.95rem];
  @apply tw:[align-items:start];
  @apply tw:flex-wrap;
}

.attendance-panel-head h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
}

.attendance-panel-head p {
  @apply tw:[margin:0.2rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.5];
}

.attendance-record-badges {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.6rem];
  @apply tw:justify-end;
}

.attendance-roster-body {
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.attendance-roster-toolbar {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
}

.attendance-roster-toolbar-fields {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(260px,_1.5fr)_minmax(180px,_0.9fr)];
  @apply tw:[gap:0.85rem];
  @apply tw:[flex:1_1_520px];
}

.attendance-roster-toolbar-actions {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
  @apply tw:[align-content:start];
  @apply tw:justify-items-end;
  @apply tw:[flex:1_1_320px];
}

.attendance-search-field,
.attendance-filter-field {
  @apply tw:grid;
  @apply tw:[gap:0.42rem];
  @apply tw:[margin:0];
}

.attendance-search-field > span,
.attendance-filter-field > span,
.attendance-bulk-actions > span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.attendance-search-input-wrap {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[min-height:44px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0_0.85rem];
  @apply tw:[background:#ffffff];
  @apply tw:[transition:border-color_0.18s_ease,_box-shadow_0.18s_ease];
}

.attendance-search-input-wrap:focus-within {
  @apply tw:[border-color:#60a5fa];
  @apply tw:[box-shadow:0_0_0_3px_rgba(59,_130,_246,_0.14)];
}

.attendance-search-input-wrap i {
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.88rem];
}

.attendance-search-input-wrap input {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#0f172a];
  @apply tw:[font:inherit];
  @apply tw:[outline:none];
}

.attendance-filter-field select {
  @apply tw:w-full;
  @apply tw:[min-height:44px];
  @apply tw:[border-radius:12px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[font:inherit];
  @apply tw:[font-weight:700];
  @apply tw:[padding:0.56rem_0.76rem];
  @apply tw:[box-shadow:inset_0_1px_2px_rgba(15,_23,_42,_0.04)];
}

.attendance-bulk-actions {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
}

.attendance-bulk-action-row {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.5rem];
  @apply tw:justify-end;
}

.attendance-bulk-btn,
.attendance-clear-filters-btn {
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[padding:0.45rem_0.78rem];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:800];
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.16s_ease,_box-shadow_0.16s_ease,_border-color_0.16s_ease];
}

.attendance-bulk-btn:hover:not(:disabled),
.attendance-clear-filters-btn:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#93c5fd];
  @apply tw:[box-shadow:0_10px_18px_rgba(37,_99,_235,_0.1)];
}

.attendance-bulk-btn:disabled {
  @apply tw:[opacity:0.55];
  @apply tw:cursor-not-allowed;
  @apply tw:transform-none;
  @apply tw:[box-shadow:none];
}

.attendance-roster-results {
  @apply tw:[margin:0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.55];
}

.attendance-filter-empty {
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#f8fbff_0%,_#ffffff_100%)];
  @apply tw:[padding:1.25rem];
}

.attendance-roster-table-wrap {
  @apply tw:overflow-x-auto;
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#ffffff];
}

.attendance-roster-table {
  @apply tw:w-full;
  @apply tw:[min-width:620px];
  @apply tw:border-separate;
  @apply tw:[border-spacing:0];
}

.attendance-roster-table thead th {
  @apply tw:[padding:0.8rem_1rem];
  @apply tw:[border-bottom:1px_solid_#dbe4ef];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
  @apply tw:text-left;
  @apply tw:whitespace-nowrap;
}

.attendance-roster-table thead th:first-child {
  @apply tw:[border-top-left-radius:18px];
}

.attendance-roster-table thead th:last-child {
  @apply tw:[border-top-right-radius:18px];
}

.attendance-roster-row {
  @apply tw:[transition:background-color_0.18s_ease];
}

.attendance-roster-row:hover {
  @apply tw:[background:#f8fbff];
}

.attendance-roster-cell {
  @apply tw:[padding:0.85rem_1rem];
  @apply tw:[border-top:1px_solid_#eef2f7];
  @apply tw:align-middle;
}

.attendance-roster-cell-center {
  @apply tw:whitespace-nowrap;
}

.attendance-roster-cell-action {
  @apply tw:[width:210px];
}

.attendance-roster-section {
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.83rem];
  @apply tw:[font-weight:600];
}

.attendance-student-main {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:[min-width:0];
}

.attendance-student-avatar {
  @apply tw:[width:40px];
  @apply tw:[height:40px];
  @apply tw:[flex:0_0_40px];
  @apply tw:[border:2px_solid_#e2e8f0];
  @apply tw:[border-radius:50%];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#1e4307];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[box-shadow:none];
}

.attendance-student-avatar > .fa-user {
  @apply tw:[color:#111111]!;
  @apply tw:[font-size:1rem];
  @apply tw:[line-height:1];
}

.attendance-student-copy {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
  @apply tw:[min-width:0];
}

.attendance-student-copy strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.95rem];
  @apply tw:[line-height:1.3];
}

.attendance-student-grade {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[padding:0.22rem_0.52rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[line-height:1];
}

.attendance-student-grade-table {
  @apply tw:[background:#eff6ff];
  @apply tw:whitespace-nowrap;
}

.attendance-student-copy small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.35];
  @apply tw:[overflow-wrap:anywhere];
}

.attendance-student-email {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.42rem];
  @apply tw:max-w-full;
}

.attendance-student-email i {
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.76rem];
  @apply tw:shrink-0;
}

.attendance-student-email span {
  @apply tw:[min-width:0];
  @apply tw:[overflow-wrap:anywhere];
}

.attendance-student-status-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-width:108px];
  @apply tw:[padding:0.42rem_0.82rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[background:#e2e8f0];
  @apply tw:[color:#334155];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(148,_163,_184,_0.14)];
}

.attendance-excuse-block,
.attendance-excuse-missing {
  @apply tw:[grid-column:1_/_-1];
}

.attendance-excuse-block {
  @apply tw:[border:1px_solid_#dbe4f1];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(180deg,_#f8fbff_0%,_#ffffff_100%)];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:grid;
  @apply tw:[gap:0.35rem];
}

.attendance-excuse-label {
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.attendance-excuse-block p {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[line-height:1.55];
}

.attendance-excuse-block small {
  @apply tw:[color:#64748b];
}

.attendance-excuse-missing {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[color:#92400e];
  @apply tw:[background:#fffbeb];
  @apply tw:[border:1px_dashed_#fcd34d];
  @apply tw:[border-radius:14px];
  @apply tw:[padding:0.72rem_0.85rem];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
}

.attendance-student-control {
  @apply tw:grid;
  @apply tw:[gap:0.35rem];
  @apply tw:justify-items-start;
  @apply tw:w-full;
}

.attendance-student-control > span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
}

.attendance-student-control-inline > span {
  @apply tw:hidden;
}

.attendance-status-select {
  @apply tw:w-full;
  @apply tw:[min-width:170px];
  @apply tw:[border-radius:12px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[padding:0.56rem_0.76rem];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[font:inherit];
  @apply tw:[font-weight:700];
  @apply tw:[font-size:0.84rem];
  @apply tw:[box-shadow:inset_0_1px_2px_rgba(15,_23,_42,_0.04)];
}

.attendance-history-panel {
  @apply tw:[align-content:start];
}

.attendance-history-summary-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.85rem];
}

.attendance-history-stat {
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.95rem];
  @apply tw:grid;
  @apply tw:[gap:0.32rem];
}

.attendance-history-stat span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
}

.attendance-history-stat strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.15rem];
}

.attendance-history-list {
  @apply tw:grid;
  @apply tw:[gap:0.95rem];
}

.attendance-history-item {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[background:#ffffff];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:1.1rem];
  @apply tw:flex;
  @apply tw:items-stretch;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:text-left;
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.16s_ease,_box-shadow_0.16s_ease,_border-color_0.16s_ease];
}

.attendance-history-item:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#93c5fd];
  @apply tw:[box-shadow:0_14px_26px_rgba(37,_99,_235,_0.08)];
}

.attendance-history-item.active {
  @apply tw:[border-color:#60a5fa];
  @apply tw:[box-shadow:0_0_0_3px_rgba(59,_130,_246,_0.12),_0_16px_30px_rgba(37,_99,_235,_0.08)];
}

.attendance-history-item.active .attendance-history-date-badge {
  @apply tw:[background:linear-gradient(135deg,_#1d4ed8,_#0ea5e9)];
}

.attendance-history-date-badge {
  @apply tw:[min-width:114px];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(135deg,_#1e293b,_#0f172a)];
  @apply tw:[color:#f8fafc];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:grid;
  @apply tw:[gap:0.24rem];
  @apply tw:content-center;
}

.attendance-history-date-badge span {
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
  @apply tw:[color:rgba(241,_245,_249,_0.72)];
}

.attendance-history-date-badge strong {
  @apply tw:[line-height:1.25];
}

.attendance-history-copy {
  @apply tw:grid;
  @apply tw:[gap:0.38rem];
  @apply tw:flex-auto;
  @apply tw:content-center;
}

.attendance-history-copy strong {
  @apply tw:[color:#0f172a];
}

.attendance-history-copy small {
  @apply tw:[color:#64748b];
}

.attendance-history-breakdown {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.55rem];
}

.attendance-history-meta {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
  @apply tw:justify-items-end;
  @apply tw:content-center;
}

.attendance-history-count {
  @apply tw:[font-size:0.76rem];
  @apply tw:[color:#475569];
  @apply tw:[font-weight:600];
}

.attendance-summary-card.status-neutral,
.attendance-legend-pill.status-neutral,
.attendance-student-status-pill.status-neutral {
  @apply tw:[background:#e2e8f0];
  @apply tw:[color:#334155];
}

.attendance-summary-card.status-present,
.attendance-legend-pill.status-present,
.attendance-breakdown-pill.status-present,
.attendance-bulk-btn.status-present,
.attendance-student-control.status-present .attendance-status-select,
.attendance-student-status-pill.status-present {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
}

.attendance-summary-card.status-late,
.attendance-legend-pill.status-late,
.attendance-breakdown-pill.status-late,
.attendance-bulk-btn.status-late,
.attendance-student-control.status-late .attendance-status-select,
.attendance-student-status-pill.status-late {
  @apply tw:[background:#fef3c7];
  @apply tw:[color:#92400e];
}

.attendance-summary-card.status-absent,
.attendance-legend-pill.status-absent,
.attendance-breakdown-pill.status-absent,
.attendance-bulk-btn.status-absent,
.attendance-student-control.status-absent .attendance-status-select,
.attendance-student-status-pill.status-absent {
  @apply tw:[background:#fee2e2];
  @apply tw:[color:#991b1b];
}

.attendance-summary-card.status-excused,
.attendance-legend-pill.status-excused,
.attendance-breakdown-pill.status-excused,
.attendance-bulk-btn.status-excused,
.attendance-student-control.status-excused .attendance-status-select,
.attendance-student-status-pill.status-excused {
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
}

.attendance-summary-card.status-present strong,
.attendance-summary-card.status-late strong,
.attendance-summary-card.status-absent strong,
.attendance-summary-card.status-excused strong {
  @apply tw:[color:inherit];
}

@media (max-width: 980px) {
  .attendance-summary-grid,
  .attendance-history-summary-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .attendance-roster-toolbar-fields {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-roster-toolbar-actions {
    @apply tw:justify-items-start;
  }

  .attendance-bulk-action-row {
    @apply tw:justify-start;
  }

  .attendance-student-control {
    @apply tw:justify-items-start;
  }

  .attendance-status-select {
    @apply tw:[min-width:0];
  }

  .attendance-roster-table {
    @apply tw:[min-width:560px];
  }
}

@media (max-width: 820px) {
  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    @apply tw:[padding:1rem];
  }

  .attendance-summary-grid,
  .attendance-history-summary-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-toolbar-header,
  .attendance-scope-panel {
    @apply tw:flex-col;
    @apply tw:items-stretch;
  }

  .attendance-scope-switch {
    @apply tw:w-full;
  }

  .attendance-scope-btn {
    @apply tw:[flex:1_1_0];
    @apply tw:justify-center;
  }

  .attendance-toolbar-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-context-card {
    @apply tw:[min-width:0];
  }

  .attendance-roster-toolbar,
  .attendance-roster-toolbar-actions {
    @apply tw:justify-items-stretch;
  }

  .attendance-roster-toolbar-fields {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-bulk-action-row {
    @apply tw:justify-start;
  }

  .attendance-clear-filters-btn {
    @apply tw:w-full;
  }

  .attendance-toolbar-actions {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-toolbar-note {
    @apply tw:w-full;
  }

  .attendance-history-item {
    @apply tw:flex-col;
    @apply tw:items-stretch;
  }

  .attendance-history-date-badge {
    @apply tw:[min-width:0];
  }

  .attendance-history-meta {
    @apply tw:justify-items-start;
  }
}

/* Streamlined classroom attendance workflow */
.attendance-section {
  @apply tw:[gap:0.9rem];
}

.attendance-section > .section-header {
  @apply tw:[margin-bottom:0];
}

.attendance-shell {
  @apply tw:[gap:0.75rem];
}

.attendance-hero-card {
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:items-center;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1rem];
  @apply tw:[border-radius:18px];
}

.attendance-hero-copy {
  @apply tw:[gap:0.35rem];
}

.attendance-hero-copy h4 {
  @apply tw:[font-size:1.05rem];
}

.attendance-hero-copy > p {
  @apply tw:hidden;
}

.attendance-hero-chips {
  @apply tw:[gap:0.35rem];
}

.attendance-summary-grid {
  @apply tw:[gap:0.6rem];
}

.attendance-summary-card {
  @apply tw:[min-height:76px];
  @apply tw:[padding:0.75rem_0.85rem];
  @apply tw:[border-radius:14px];
  @apply tw:[box-shadow:none];
}

.attendance-summary-card strong {
  @apply tw:[font-size:1.35rem];
}

.attendance-toolbar-card {
  @apply tw:[grid-template-columns:minmax(240px,_auto)_minmax(0,_1fr)_auto];
  @apply tw:[align-items:end];
  @apply tw:[gap:0.75rem];
  @apply tw:[padding:0.85rem];
  @apply tw:[border-radius:18px];
  @apply tw:[margin-bottom:0];
}

.attendance-toolbar-header {
  @apply tw:hidden;
}

.attendance-scope-panel {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
}

.attendance-scope-panel-copy small,
.attendance-scope-panel-copy .attendance-step-badge,
.attendance-toolbar-field-card > .attendance-step-badge,
.attendance-date-card-copy,
.attendance-date-quick-actions,
.attendance-date-helper,
.attendance-actions-hint {
  @apply tw:hidden;
}

.attendance-scope-switch {
  @apply tw:flex-nowrap;
  @apply tw:[gap:0.35rem];
}

.attendance-scope-btn {
  @apply tw:[min-height:42px];
  @apply tw:[padding:0.55rem_0.75rem];
  @apply tw:[border-radius:12px];
}

.attendance-toolbar-grid {
  @apply tw:[grid-template-columns:minmax(180px,_1fr)_minmax(170px,_0.7fr)_minmax(330px,_1.35fr)];
  @apply tw:[align-items:end];
  @apply tw:[gap:0.6rem];
}

.attendance-toolbar-field-card {
  @apply tw:[gap:0.35rem];
  @apply tw:[padding:0];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
}

.attendance-context-card {
  @apply tw:[min-height:42px];
  @apply tw:[padding:0.55rem_0.7rem];
  @apply tw:[border-radius:12px];
}

.attendance-toolbar-actions {
  @apply tw:[gap:0.45rem];
}

.attendance-toolbar-actions .pagination-btn {
  @apply tw:[min-height:42px];
  @apply tw:[padding-inline:0.65rem];
  @apply tw:[box-shadow:none];
  @apply tw:whitespace-nowrap;
}

.attendance-legend-block {
  @apply tw:[gap:0.35rem];
  @apply tw:self-center;
}

.attendance-legend-row {
  @apply tw:flex-nowrap;
  @apply tw:[gap:0.35rem];
}

.attendance-legend-pill {
  @apply tw:[padding:0.35rem_0.55rem];
}

.attendance-layout {
  @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(280px,_320px)];
  @apply tw:[align-items:start];
  @apply tw:[gap:0.85rem];
}

.attendance-panel {
  @apply tw:[min-width:0];
  @apply tw:[padding:0.9rem];
  @apply tw:[border-radius:18px];
  @apply tw:[box-shadow:none];
}

.attendance-panel-head p {
  @apply tw:[line-height:1.35];
}

.attendance-roster-toolbar {
  @apply tw:[padding:0.75rem];
  @apply tw:[border-radius:14px];
}

.attendance-roster-table-wrap {
  @apply tw:[max-height:65vh];
  @apply tw:overflow-auto;
  @apply tw:[border-radius:14px];
}

.attendance-roster-table {
  @apply tw:[min-width:720px];
}

.attendance-roster-table thead th {
  @apply tw:sticky;
  @apply tw:[top:0];
  @apply tw:[z-index:3];
}

.attendance-roster-table thead th:first-child {
  @apply tw:[left:0];
  @apply tw:[z-index:5];
}

.attendance-roster-cell-student {
  @apply tw:sticky;
  @apply tw:[left:0];
  @apply tw:[z-index:2];
  @apply tw:[min-width:260px];
  @apply tw:[background:#ffffff];
}

.attendance-roster-row:nth-child(even),
.attendance-roster-row:nth-child(even) .attendance-roster-cell-student {
  @apply tw:[background:#f8fbff];
}

.attendance-roster-row:hover,
.attendance-roster-row:hover .attendance-roster-cell-student {
  @apply tw:[background:#f8fafc];
}

.attendance-roster-cell {
  @apply tw:[padding-block:0.95rem];
}

.attendance-status-select {
  @apply tw:[min-height:46px];
  @apply tw:cursor-pointer;
}

.attendance-history-panel {
  @apply tw:sticky;
  @apply tw:[top:1rem];
  @apply tw:block;
  @apply tw:[max-height:calc(100vh_-_2rem)];
  @apply tw:overflow-auto;
}

.attendance-history-summary {
  @apply tw:cursor-pointer;
  @apply tw:[list-style:none];
}

.attendance-history-summary::-webkit-details-marker {
  @apply tw:hidden;
}

.attendance-history-summary .attendance-panel-head {
  @apply tw:items-center;
  @apply tw:flex-nowrap;
}

.attendance-history-chevron {
  @apply tw:[transition:transform_0.18s_ease];
}

.attendance-history-panel[open] .attendance-history-chevron {
  @apply tw:[transform:rotate(180deg)];
}

.attendance-history-content {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-top:0.85rem];
}

.attendance-history-summary-grid {
  @apply tw:[gap:0.4rem];
}

.attendance-history-stat {
  @apply tw:[padding:0.6rem];
  @apply tw:[border-radius:12px];
}

.attendance-history-stat span {
  @apply tw:[font-size:0.62rem];
}

.attendance-history-list {
  @apply tw:[gap:0.55rem];
}

.attendance-history-item {
  @apply tw:grid;
  @apply tw:[grid-template-columns:72px_minmax(0,_1fr)];
  @apply tw:[gap:0.65rem];
  @apply tw:[padding:0.65rem];
  @apply tw:[border-radius:12px];
}

.attendance-history-date-badge {
  @apply tw:[min-width:0];
  @apply tw:[padding:0.6rem];
  @apply tw:[border-radius:10px];
}

.attendance-history-meta {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:[grid-template-columns:1fr_auto];
  @apply tw:justify-items-start;
}

@media (max-width: 1180px) {
  .attendance-toolbar-card {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:items-stretch;
  }

  .attendance-scope-panel {
    @apply tw:[grid-template-columns:auto_1fr];
    @apply tw:items-center;
  }

  .attendance-scope-switch {
    @apply tw:justify-end;
  }

  .attendance-legend-block {
    @apply tw:[grid-template-columns:auto_1fr];
    @apply tw:items-center;
  }

  .attendance-layout {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-history-panel {
    @apply tw:static;
    @apply tw:max-h-none;
  }
}

@media (max-width: 820px) {
  .attendance-hero-card {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-summary-grid {
    @apply tw:[grid-template-columns:repeat(5,_minmax(110px,_1fr))];
    @apply tw:overflow-x-auto;
    @apply tw:[padding-bottom:0.25rem];
  }

  .attendance-toolbar-grid {
    @apply tw:[grid-template-columns:1fr_1fr];
  }

  .attendance-toolbar-actions-card {
    @apply tw:[grid-column:1_/_-1];
  }
}

@media (max-width: 640px) {
  .attendance-section {
    @apply tw:[gap:0.7rem];
  }

  .attendance-scope-panel {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-scope-switch {
    @apply tw:justify-stretch;
  }

  .attendance-toolbar-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-toolbar-actions-card {
    @apply tw:[grid-column:auto];
  }

  .attendance-toolbar-actions {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-legend-block {
    @apply tw:[grid-template-columns:1fr];
  }

  .attendance-legend-row {
    @apply tw:overflow-x-auto;
    @apply tw:[padding-bottom:0.2rem];
  }

  .attendance-panel-head {
    @apply tw:[gap:0.55rem];
  }

  .attendance-roster-table-wrap {
    @apply tw:[max-height:70vh];
  }
}

/* Education-first brand polish and interaction states */
.attendance-hero-card {
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(187,_255,_89,_0.16),_transparent_34%),______linear-gradient(135deg,_#ffffff_0%,_#f9fafb_100%)];
}

.attendance-toolbar-card,
.attendance-panel {
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f9fafb_100%)];
}

.attendance-kicker,
.attendance-panel-kicker,
.attendance-toolbar-kicker {
  @apply tw:[background:rgba(30,_67,_7,_0.09)];
  @apply tw:[color:#1e4307];
}

.attendance-summary-card {
  @apply tw:[grid-template-columns:30px_minmax(0,_1fr)];
  @apply tw:[grid-template-rows:auto_auto];
  @apply tw:items-center;
  @apply tw:[column-gap:0.55rem];
}

.attendance-summary-icon {
  @apply tw:[grid-row:1];
  @apply tw:[align-self:start];
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[border-radius:10px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:rgba(30,_67,_7,_0.09)];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:0.8rem];
}

.attendance-summary-card span,
.attendance-summary-card strong {
  @apply tw:[grid-column:2];
}

.attendance-summary-card span {
  @apply tw:[grid-row:1];
  @apply tw:self-center;
}

.attendance-summary-card strong {
  @apply tw:[grid-row:2];
}

.attendance-scope-btn,
.attendance-date-chip,
.attendance-bulk-btn,
.attendance-clear-filters-btn,
.attendance-history-item,
.attendance-toolbar-actions .pagination-btn {
  @apply tw:[transition:transform_0.18s_ease,_box-shadow_0.18s_ease,_border-color_0.18s_ease,_background-color_0.18s_ease];
}

.attendance-scope-btn.active {
  @apply tw:[background:#1e4307];
  @apply tw:[border-color:#1e4307];
  @apply tw:[color:#ffffff];
}

.attendance-scope-btn.active i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.attendance-date-chip.active {
  @apply tw:[background:rgba(187,_255,_89,_0.22)];
  @apply tw:[border-color:#bbff59];
  @apply tw:[color:#1e4307];
}

.attendance-scope-btn:hover:not(:disabled):not(.active),
.attendance-date-chip:hover,
.attendance-bulk-btn:hover:not(:disabled),
.attendance-clear-filters-btn:hover {
  @apply tw:[border-color:#1e4307];
  @apply tw:[color:#1e4307];
  @apply tw:[box-shadow:0_6px_14px_rgba(30,_67,_7,_0.1)];
}

.attendance-load-btn {
  @apply tw:[background:#ffffff];
  @apply tw:[border-color:#111111];
  @apply tw:[color:#111111];
}

.attendance-save-btn {
  @apply tw:[background:#1e4307];
  @apply tw:[border-color:#1e4307];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_10px_22px_rgba(30,_67,_7,_0.22)];
}

.attendance-lock-btn {
  @apply tw:[background:#ffffff];
  @apply tw:[border-color:#111111];
  @apply tw:[color:#111111];
}

.attendance-toolbar-actions .pagination-btn:not(:disabled):hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[box-shadow:0_8px_16px_rgba(17,_17,_17,_0.16)];
}

.attendance-toolbar-actions .attendance-load-btn:not(:disabled):hover,
.attendance-toolbar-actions .attendance-lock-btn:not(:disabled):hover {
  @apply tw:[background:#111111];
  @apply tw:[color:#ffffff];
}

.attendance-toolbar-actions .attendance-save-btn:not(:disabled):hover {
  @apply tw:[background:#173405];
  @apply tw:[border-color:#173405];
  @apply tw:[color:#ffffff];
}

.attendance-toolbar-actions .pagination-btn:focus-visible {
  @apply tw:[outline-color:#111111];
}

.attendance-toolbar-actions .pagination-btn i {
  @apply tw:[margin-right:0.35rem];
  @apply tw:text-current!;
}

.attendance-toolbar-actions .attendance-save-btn i,
.attendance-toolbar-actions .attendance-load-btn:not(:disabled):hover i,
.attendance-toolbar-actions .attendance-lock-btn:not(:disabled):hover i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.attendance-toolbar-actions .attendance-load-btn i,
.attendance-toolbar-actions .attendance-lock-btn i {
  @apply tw:[color:#111111]!;
}

.attendance-history-item.active .attendance-history-date-badge {
  @apply tw:[background:linear-gradient(135deg,_#1e4307_0%,_#ffd542_100%)];
  @apply tw:[box-shadow:0_8px_16px_rgba(30,_67,_7,_0.16)];
}

.attendance-history-item:hover,
.attendance-history-item.active {
  @apply tw:[border-color:#1e4307];
  @apply tw:[box-shadow:0_0_0_3px_rgba(187,_255,_89,_0.18)];
}

.attendance-search-input-wrap:focus-within,
.attendance-date-input-wrap:focus-within {
  @apply tw:[border-color:#1e4307];
  @apply tw:[box-shadow:0_0_0_3px_rgba(187,_255,_89,_0.24)];
}

.attendance-section button:focus-visible,
.attendance-section select:focus-visible,
.attendance-section input:focus-visible,
.attendance-history-summary:focus-visible {
  @apply tw:[outline:3px_solid_#bbff59];
  @apply tw:[outline-offset:2px];
}

.attendance-section button:disabled {
  @apply tw:transform-none;
  @apply tw:[box-shadow:none];
}

.attendance-section .fa-spinner {
  @apply tw:[color:#1e4307];
}

.attendance-section .fa-spinner + span {
  @apply tw:relative;
}

.attendance-section .fa-spinner + span::after {
  @apply tw:[content:''];
  @apply tw:block;
  @apply tw:[width:min(220px,_60vw)];
  @apply tw:[height:6px];
  @apply tw:[margin-top:0.55rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:linear-gradient(90deg,_#e5e7eb_25%,_#f9fafb_50%,_#e5e7eb_75%)];
  @apply tw:[background-size:200%_100%];
  @apply tw:[animation:attendance-skeleton_1.2s_ease-in-out_infinite];
}

@keyframes attendance-skeleton {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .attendance-section *,
  .attendance-section *::before,
  .attendance-section *::after {
    @apply tw:scroll-auto!;
    @apply tw:[transition-duration:0.01ms]!;
    @apply tw:[animation-duration:0.01ms]!;
    @apply tw:[animation-iteration-count:1]!;
  }
}

@media (max-width: 640px) {
  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    @apply tw:[border-radius:16px];
    @apply tw:[padding:0.75rem];
  }

  .attendance-summary-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:overflow-visible;
    @apply tw:[padding-bottom:0];
  }

  .attendance-scope-btn,
  .attendance-toolbar-actions .pagination-btn,
  .attendance-date-input-wrap,
  .attendance-search-input-wrap,
  .attendance-filter-field select,
  .attendance-status-select {
    @apply tw:[min-height:48px];
  }

  .attendance-roster-toolbar {
    @apply tw:[padding:0.65rem];
  }

  .attendance-roster-table-wrap {
    @apply tw:max-h-none;
    @apply tw:overflow-visible;
    @apply tw:[border:0];
    @apply tw:[background:transparent];
  }

  .attendance-roster-table,
  .attendance-roster-table tbody,
  .attendance-roster-row,
  .attendance-roster-cell {
    @apply tw:block;
    @apply tw:w-full;
    @apply tw:[min-width:0];
  }

  .attendance-roster-table thead {
    @apply tw:absolute;
    @apply tw:[width:1px];
    @apply tw:[height:1px];
    @apply tw:[padding:0];
    @apply tw:[margin:-1px];
    @apply tw:overflow-hidden;
    @apply tw:[clip:rect(0,_0,_0,_0)];
    @apply tw:whitespace-nowrap;
    @apply tw:[border:0];
  }

  .attendance-roster-table tbody {
    @apply tw:grid;
    @apply tw:[gap:0.75rem];
  }

  .attendance-roster-row,
  .attendance-roster-row:nth-child(even) {
    @apply tw:[border:1px_solid_#dbe4ef];
    @apply tw:[border-radius:14px];
    @apply tw:[background:#ffffff];
    @apply tw:overflow-hidden;
    @apply tw:[box-shadow:0_4px_12px_rgba(15,_23,_42,_0.05)];
  }

  .attendance-roster-cell {
    @apply tw:grid;
    @apply tw:[grid-template-columns:92px_minmax(0,_1fr)];
    @apply tw:items-center;
    @apply tw:[gap:0.65rem];
    @apply tw:[padding:0.65rem_0.75rem];
    @apply tw:[border-top:1px_solid_#eef2f7];
  }

  .attendance-roster-cell::before {
    @apply tw:[color:#64748b];
    @apply tw:[font-size:0.68rem];
    @apply tw:[font-weight:800];
    @apply tw:[letter-spacing:0.05em];
    @apply tw:uppercase;
  }

  .attendance-roster-cell-student,
  .attendance-roster-row:nth-child(even) .attendance-roster-cell-student,
  .attendance-roster-row:hover .attendance-roster-cell-student {
    @apply tw:static;
    @apply tw:block;
    @apply tw:[min-width:0];
    @apply tw:[padding:0.85rem_0.75rem];
    @apply tw:[border-top:0];
    @apply tw:[background:#f8fafc];
  }

  .attendance-roster-cell-student::before {
    @apply tw:hidden;
  }

  .attendance-roster-cell:nth-child(2)::before {
    @apply tw:[content:'Grade'];
  }

  .attendance-roster-cell:nth-child(3)::before {
    @apply tw:[content:'Section'];
  }

  .attendance-roster-cell-action::before {
    @apply tw:[content:'Status'];
  }

  .attendance-roster-cell-action {
    @apply tw:w-full;
  }

  .attendance-status-select {
    @apply tw:[min-width:0];
  }

  .attendance-history-item {
    @apply tw:[grid-template-columns:68px_minmax(0,_1fr)];
  }
}

/* Responsive hardening for the complete attendance workspace */
.attendance-section {
  @apply tw:[container-type:inline-size];
  @apply tw:w-full;
  @apply tw:max-w-full;
  @apply tw:[min-width:0];
  @apply tw:overflow-x-clip;
  @apply tw:[gap:clamp(0.75rem,_1.2vw,_1.25rem)];
}

:global(body.teacher-dashboard) .teacher-sidebar .sidebar-footer .teacher-avatar > i.fa-user {
  @apply tw:[color:#111111]!;
  @apply tw:[font-size:1rem];
  @apply tw:[line-height:1];
}

.attendance-section *,
.attendance-section *::before,
.attendance-section *::after {
  @apply tw:box-border;
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
  @apply tw:[min-width:0];
  @apply tw:max-w-full;
}

.attendance-section .section-title {
  @apply tw:[font-size:clamp(1.15rem,_1rem_+_0.6vw,_1.65rem)];
  @apply tw:[line-height:1.2];
}

.attendance-section .section-subtitle,
.attendance-panel-head p,
.attendance-roster-results {
  @apply tw:[font-size:clamp(0.78rem,_0.74rem_+_0.16vw,_0.9rem)];
  @apply tw:[overflow-wrap:anywhere];
}

.attendance-hero-copy h4,
.attendance-panel-head h4 {
  @apply tw:[font-size:clamp(1rem,_0.92rem_+_0.35vw,_1.3rem)];
  @apply tw:[line-height:1.25];
}

.attendance-summary-grid {
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(min(100%,_138px),_1fr))];
  @apply tw:[gap:clamp(0.5rem,_0.8vw,_0.75rem)];
  @apply tw:w-full;
  @apply tw:overflow-visible;
}

.attendance-summary-card {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:[min-height:clamp(72px,_7vw,_84px)];
  @apply tw:[padding:clamp(0.625rem,_0.8vw,_0.875rem)];
}

.attendance-summary-card span {
  @apply tw:[min-width:0];
  @apply tw:[font-size:clamp(0.64rem,_0.6rem_+_0.14vw,_0.76rem)];
  @apply tw:[overflow-wrap:anywhere];
}

.attendance-summary-card strong {
  @apply tw:[font-size:clamp(1.2rem,_1.05rem_+_0.5vw,_1.55rem)];
}

.attendance-toolbar-card {
  @apply tw:w-full;
  @apply tw:[padding:clamp(0.75rem,_1vw,_1rem)];
  @apply tw:[gap:clamp(0.625rem,_1vw,_1rem)];
}

.attendance-scope-switch,
.attendance-legend-row,
.attendance-toolbar-actions,
.attendance-bulk-action-row {
  @apply tw:[min-width:0];
  @apply tw:flex-wrap;
}

.attendance-scope-btn {
  @apply tw:[flex:1_1_150px];
  @apply tw:justify-center;
  @apply tw:[min-width:0];
  @apply tw:[min-height:44px];
  @apply tw:whitespace-normal;
  @apply tw:text-center;
}

.attendance-toolbar-grid {
  @apply tw:w-full;
  @apply tw:[grid-template-columns:minmax(180px,_1fr)_minmax(170px,_0.8fr)_minmax(280px,_1.35fr)];
  @apply tw:[gap:clamp(0.5rem,_0.8vw,_0.75rem)];
}

.attendance-section input,
.attendance-section select,
.attendance-section button {
  @apply tw:max-w-full;
  @apply tw:[min-width:0];
}

.attendance-toolbar-field-card .filter-field select,
.attendance-date-input-wrap,
.attendance-date-input-wrap input,
.attendance-search-input-wrap,
.attendance-search-input-wrap input,
.attendance-filter-field select,
.attendance-status-select {
  @apply tw:w-full;
  @apply tw:[min-height:44px];
}

.attendance-toolbar-actions {
  @apply tw:w-full;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
}

.attendance-toolbar-actions .pagination-btn {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:[min-height:44px];
  @apply tw:text-center;
  @apply tw:[overflow-wrap:anywhere];
}

.attendance-legend-pill {
  @apply tw:flex-initial;
  @apply tw:[min-height:32px];
  @apply tw:whitespace-normal;
  @apply tw:text-center;
}

.attendance-layout {
  @apply tw:w-full;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_clamp(280px,_24vw,_340px)];
  @apply tw:[gap:clamp(0.75rem,_1.2vw,_1.25rem)];
  @apply tw:[margin-top:clamp(1rem,_1.4vw,_1.5rem)];
}

.attendance-roster-toolbar-fields {
  @apply tw:[grid-template-columns:minmax(180px,_1.5fr)_minmax(150px,_0.75fr)];
  @apply tw:[min-width:min(100%,_400px)];
}

.attendance-roster-table-wrap {
  @apply tw:w-full;
  @apply tw:max-w-full;
  @apply tw:overflow-x-hidden;
}

.attendance-roster-table {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:table-fixed;
}

.attendance-roster-table th:first-child {
  @apply tw:[width:38%];
}

.attendance-roster-table th:nth-child(2) {
  @apply tw:[width:15%];
}

.attendance-roster-table th:nth-child(3) {
  @apply tw:[width:20%];
}

.attendance-roster-table th:last-child {
  @apply tw:[width:27%];
}

.attendance-roster-cell,
.attendance-roster-section,
.attendance-student-copy,
.attendance-student-copy strong,
.attendance-student-email,
.attendance-student-email span {
  @apply tw:[min-width:0];
  @apply tw:max-w-full;
  @apply tw:[overflow-wrap:anywhere];
}

.attendance-roster-cell-action {
  @apply tw:w-auto;
}

.attendance-status-select {
  @apply tw:[min-width:0];
}

.attendance-history-panel,
.attendance-history-item,
.attendance-history-copy,
.attendance-history-meta {
  @apply tw:[min-width:0];
  @apply tw:max-w-full;
}

.attendance-history-copy strong,
.attendance-history-copy small,
.attendance-history-count {
  @apply tw:[overflow-wrap:anywhere];
}

@media (max-width: 1180px) {
  .attendance-layout {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-history-panel {
    @apply tw:static;
    @apply tw:w-full;
  }
}

@media (max-width: 900px) {
  .attendance-toolbar-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .attendance-toolbar-actions-card {
    @apply tw:[grid-column:1_/_-1];
  }

  .attendance-roster-toolbar,
  .attendance-roster-toolbar-actions {
    @apply tw:w-full;
  }
}

@media (max-width: 640px) {
  .attendance-section {
    @apply tw:[gap:0.75rem];
  }

  .attendance-section > .section-header {
    @apply tw:[padding-inline:0.125rem];
  }

  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    @apply tw:[padding:0.75rem];
  }

  .attendance-summary-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .attendance-summary-card {
    @apply tw:[grid-template-columns:28px_minmax(0,_1fr)];
    @apply tw:[column-gap:0.45rem];
  }

  .attendance-summary-icon {
    @apply tw:[width:28px];
    @apply tw:[height:28px];
  }

  .attendance-toolbar-grid,
  .attendance-roster-toolbar-fields {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-toolbar-actions-card {
    @apply tw:[grid-column:auto];
  }

  .attendance-toolbar-actions {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-toolbar-actions .pagination-btn,
  .attendance-clear-filters-btn {
    @apply tw:w-full;
    @apply tw:[min-height:48px];
  }

  .attendance-legend-row {
    @apply tw:w-full;
    @apply tw:overflow-visible;
  }

  .attendance-legend-pill {
    @apply tw:[flex:1_1_calc(50%_-_0.35rem)];
  }

  .attendance-roster-toolbar-actions,
  .attendance-bulk-actions,
  .attendance-bulk-action-row {
    @apply tw:w-full;
    @apply tw:justify-items-stretch;
  }

  .attendance-bulk-btn {
    @apply tw:[flex:1_1_calc(50%_-_0.5rem)];
    @apply tw:[min-height:44px];
  }

  .attendance-roster-cell {
    @apply tw:[grid-template-columns:minmax(70px,_30%)_minmax(0,_1fr)];
  }

  .attendance-history-summary-grid {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }

  .attendance-history-item {
    @apply tw:[grid-template-columns:minmax(62px,_76px)_minmax(0,_1fr)];
  }
}

@media (max-width: 360px) {
  .attendance-history-summary-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-summary-card {
    @apply tw:[min-height:64px];
  }

  .attendance-scope-switch {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-history-item {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-history-date-badge,
  .attendance-history-meta {
    @apply tw:[grid-column:1];
  }
}

@media (min-width: 1600px) {
  .attendance-layout {
    @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(320px,_380px)];
  }

  .attendance-panel {
    @apply tw:[padding:clamp(1rem,_1vw,_1.25rem)];
  }
}

/* Final responsive layout corrections for the attendance workspace. */
.attendance-section,
.attendance-shell,
.attendance-hero-card,
.attendance-toolbar-card,
.attendance-layout,
.attendance-panel {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:max-w-full;
  @apply tw:box-border;
}

.attendance-toolbar-card {
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[align-items:end];
  @apply tw:[column-gap:clamp(0.75rem,_1.2vw,_1.25rem)];
  @apply tw:[row-gap:clamp(0.75rem,_1vw,_1rem)];
}

.attendance-scope-panel,
.attendance-toolbar-grid,
.attendance-legend-block {
  @apply tw:[min-width:0];
  @apply tw:max-w-full;
}

.attendance-toolbar-grid {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:[grid-row:2];
  @apply tw:[grid-template-columns:minmax(170px,_1fr)_minmax(190px,_0.9fr)_minmax(280px,_1.3fr)];
}

.attendance-scope-panel {
  @apply tw:[grid-column:1];
  @apply tw:[grid-row:1];
  @apply tw:[align-self:start];
}

.attendance-scope-switch {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:w-full;
}

.attendance-scope-btn {
  @apply tw:w-full;
  @apply tw:[min-width:0];
}

.attendance-legend-block {
  @apply tw:[grid-column:2];
  @apply tw:[grid-row:1];
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:items-center;
  @apply tw:[align-self:start];
  @apply tw:[justify-self:end];
  @apply tw:[gap:0.75rem];
}

.attendance-legend-row {
  @apply tw:flex-wrap;
  @apply tw:overflow-visible;
}

.attendance-toolbar-actions {
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
}

.attendance-toolbar-actions .pagination-btn {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:[min-height:44px];
}

@media (max-width: 1400px) {
  .attendance-hero-card {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-summary-grid {
    @apply tw:[grid-template-columns:repeat(5,_minmax(0,_1fr))];
  }

  .attendance-toolbar-card {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .attendance-legend-block {
    @apply tw:[justify-self:end];
  }
}

@media (max-width: 1200px) {
  .attendance-hero-card,
  .attendance-layout {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-history-panel {
    @apply tw:static;
    @apply tw:max-h-none;
  }
}

@media (max-width: 992px) {
  .attendance-summary-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:overflow-visible;
  }

  .attendance-summary-card:last-child {
    @apply tw:[grid-column:1_/_-1];
  }

  .attendance-toolbar-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .attendance-toolbar-actions-card {
    @apply tw:[grid-column:1_/_-1];
  }

  .attendance-scope-panel,
  .attendance-roster-toolbar {
    @apply tw:items-stretch;
  }
}

@media (max-width: 768px) {
  .attendance-section {
    @apply tw:[padding:clamp(0.65rem,_2.5vw,_1rem)]!;
    @apply tw:overflow-x-clip;
  }

  .attendance-toolbar-card {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-toolbar-grid,
  .attendance-legend-block,
  .attendance-roster-toolbar-fields {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-toolbar-actions-card,
  .attendance-legend-block {
    @apply tw:[grid-column:auto];
  }

  .attendance-scope-panel,
  .attendance-toolbar-grid,
  .attendance-legend-block {
    @apply tw:[grid-column:1];
    @apply tw:[grid-row:auto];
  }

  .attendance-legend-block {
    @apply tw:justify-self-stretch;
  }

  .attendance-scope-switch,
  .attendance-legend-row {
    @apply tw:w-full;
    @apply tw:flex-wrap;
  }

  .attendance-scope-btn {
    @apply tw:[flex:1_1_180px];
    @apply tw:[min-height:44px];
  }
}

@media (max-width: 576px) {
  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    @apply tw:[padding:0.75rem];
    @apply tw:[border-radius:16px];
  }

  .attendance-toolbar-actions {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-toolbar-actions .pagination-btn {
    @apply tw:[min-height:48px];
  }

  .attendance-scope-switch {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-legend-pill {
    @apply tw:[flex:1_1_calc(50%_-_0.35rem)];
    @apply tw:text-center;
  }
}

@media (max-width: 360px) {
  .attendance-summary-grid,
  .attendance-history-summary-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .attendance-summary-card:last-child {
    @apply tw:[grid-column:auto];
  }
}

/* Compact attendance workspace without nested scrolling. */
.attendance-section {
  @apply tw:[gap:0.55rem];
}

.attendance-section > .section-header {
  @apply tw:[margin-bottom:0];
}

.attendance-shell {
  @apply tw:[gap:0.45rem];
}

.attendance-hero-card,
.attendance-toolbar-card,
.attendance-panel {
  @apply tw:[padding:0.65rem];
  @apply tw:[border-radius:14px];
}

.attendance-summary-grid {
  @apply tw:[gap:0.4rem];
}

.attendance-summary-card {
  @apply tw:[min-height:58px];
  @apply tw:[padding:0.45rem_0.6rem];
  @apply tw:[column-gap:0.4rem];
}

.attendance-summary-icon {
  @apply tw:[width:26px];
  @apply tw:[height:26px];
  @apply tw:[font-size:0.78rem];
}

.attendance-summary-card strong {
  @apply tw:[font-size:1.15rem];
}

.attendance-toolbar-card {
  @apply tw:[column-gap:0.55rem];
  @apply tw:[row-gap:0.5rem];
}

.attendance-scope-panel,
.attendance-toolbar-field-card {
  @apply tw:[gap:0.3rem];
}

.attendance-scope-btn,
.attendance-toolbar-field-card .filter-field select,
.attendance-date-input-wrap,
.attendance-date-input-wrap input,
.attendance-toolbar-actions .pagination-btn {
  @apply tw:[min-height:38px];
}

.attendance-scope-btn {
  @apply tw:[padding:0.4rem_0.6rem];
}

.attendance-toolbar-actions .pagination-btn {
  @apply tw:[padding-block:0.4rem];
}

.attendance-legend-pill {
  @apply tw:[min-height:28px];
  @apply tw:[padding:0.25rem_0.5rem];
}

.attendance-layout {
  @apply tw:[gap:0.55rem];
  @apply tw:[margin-top:0.55rem];
}

.attendance-panel-head {
  @apply tw:[margin-bottom:0.45rem];
}

.attendance-roster-toolbar {
  @apply tw:[padding:0.5rem];
  @apply tw:[border-radius:12px];
}

.attendance-search-input-wrap,
.attendance-search-input-wrap input,
.attendance-filter-field select,
.attendance-status-select {
  @apply tw:[min-height:38px];
}

.attendance-roster-results {
  @apply tw:[margin-block:0.45rem];
}

.attendance-roster-table-wrap {
  @apply tw:max-h-none;
  @apply tw:overflow-visible;
}

.attendance-roster-table thead th {
  @apply tw:static;
}

.attendance-roster-cell-student {
  @apply tw:static;
}

.attendance-roster-cell {
  @apply tw:[padding-block:0.55rem];
}

.attendance-status-select {
  @apply tw:[min-height:38px];
}

.attendance-history-panel {
  @apply tw:static;
  @apply tw:max-h-none;
  @apply tw:overflow-visible;
}

.attendance-history-content {
  @apply tw:[gap:0.5rem];
  @apply tw:[margin-top:0.55rem];
}

@media (max-width: 576px) {
  .attendance-hero-card,
  .attendance-toolbar-card,
  .attendance-panel {
    @apply tw:[padding:0.6rem];
    @apply tw:[border-radius:13px];
  }

  .attendance-toolbar-actions {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }

  .attendance-toolbar-actions .pagination-btn {
    @apply tw:[min-height:40px];
    @apply tw:[padding-inline:0.35rem];
  }
}

/* Final scoped attendance workspace */
#teacherRecordsAttendancePanel {
  --attendance-brand: #1e4307;
  --attendance-green: #4f7d3a;
  --attendance-green-soft: #6f9d58;
  --attendance-mint: #dcead3;
  --attendance-surface: #f7fbf4;
  @apply tw:relative;
  @apply tw:[gap:0];
  @apply tw:[padding:0];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#d4e4ca]!;
  @apply tw:[border-radius:22px];
  @apply tw:[background:#ffffff]!;
  @apply tw:[box-shadow:0_20px_50px_rgba(30,_67,_7,_0.08)];
}

#teacherRecordsAttendancePanel .attendance-workspace-hero {
  @apply tw:grid;
  @apply tw:[gap:1.2rem];
  @apply tw:[padding:1.5rem_1.6rem];
  @apply tw:[border-bottom:1px_solid_#dcead3];
  @apply tw:[background:radial-gradient(circle_at_90%_8%,_rgba(111,_157,_88,_0.2),_transparent_30%),______linear-gradient(135deg,_#f7fbf4_0%,_#edf6e8_100%)];
}

#teacherRecordsAttendancePanel .attendance-workspace-heading {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.85rem];
  @apply tw:[min-width:0];
}

#teacherRecordsAttendancePanel .attendance-workspace-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:48px];
  @apply tw:[height:48px];
  @apply tw:[flex:0_0_48px];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#4f8a35];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_9px_20px_rgba(30,_67,_7,_0.18)];
}

#teacherRecordsAttendancePanel .attendance-workspace-icon i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

#teacherRecordsAttendancePanel .attendance-workspace-kicker {
  @apply tw:block;
  @apply tw:[margin-bottom:0.18rem];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.1em];
  @apply tw:uppercase;
}

#teacherRecordsAttendancePanel .section-title {
  @apply tw:[margin:0];
  @apply tw:[color:#173706];
  @apply tw:[font-size:clamp(1.35rem,_2vw,_1.75rem)];
  @apply tw:[letter-spacing:-0.025em];
}

#teacherRecordsAttendancePanel .section-subtitle {
  @apply tw:[margin-top:0.28rem];
  @apply tw:[color:#52634a];
  @apply tw:[font-size:0.86rem];
}

#teacherRecordsAttendancePanel .attendance-workspace-context {
  @apply tw:absolute;
  @apply tw:[top:1.55rem];
  @apply tw:[right:1.6rem];
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:justify-end;
  @apply tw:[gap:0.45rem];
  @apply tw:[max-width:47%];
}

#teacherRecordsAttendancePanel .attendance-workspace-context span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.42rem_0.68rem];
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.18)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.78)];
  @apply tw:[color:#48633d];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:700];
}

#teacherRecordsAttendancePanel .attendance-workspace-context i {
  @apply tw:[color:#6f9d58];
}

#teacherRecordsAttendancePanel .attendance-summary-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(5,_minmax(0,_1fr))];
  @apply tw:[gap:0.7rem];
}

#teacherRecordsAttendancePanel .attendance-summary-card {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[grid-template-columns:1fr];
  @apply tw:[grid-template-rows:auto_auto_auto];
  @apply tw:[gap:0.24rem];
  @apply tw:[min-width:0];
  @apply tw:[min-height:108px];
  @apply tw:[padding:0.85rem];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#dce7d6];
  @apply tw:[border-radius:16px];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
  @apply tw:[color:#263321];
  @apply tw:[box-shadow:0_7px_18px_rgba(30,_67,_7,_0.045)];
  @apply tw:[backdrop-filter:blur(8px)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_border-color_0.2s_ease];
}

#teacherRecordsAttendancePanel .attendance-summary-card::before {
  @apply tw:[content:""];
  @apply tw:absolute;
  @apply tw:[inset:auto_0_0];
  @apply tw:[height:3px];
  @apply tw:[background:#6f9d58];
}

#teacherRecordsAttendancePanel .attendance-summary-card:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[border-color:#bfd5b2];
  @apply tw:[box-shadow:0_11px_24px_rgba(30,_67,_7,_0.09)];
}

#teacherRecordsAttendancePanel .attendance-summary-card-head {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[min-width:0];
}

#teacherRecordsAttendancePanel .attendance-summary-card .attendance-summary-icon {
  @apply tw:inline-flex;
  @apply tw:[grid-row:auto];
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[flex:0_0_30px];
  @apply tw:[border-radius:9px];
  @apply tw:[background:#e5efe0];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:0.74rem];
}

#teacherRecordsAttendancePanel .attendance-summary-card span {
  @apply tw:[grid-column:auto];
  @apply tw:[grid-row:auto];
  @apply tw:[color:#687761];
  @apply tw:[font-size:0.66rem];
  @apply tw:[line-height:1.25];
  @apply tw:[letter-spacing:0.045em];
}

#teacherRecordsAttendancePanel .attendance-summary-card strong {
  @apply tw:[grid-column:auto];
  @apply tw:[grid-row:auto];
  @apply tw:[color:#203119];
  @apply tw:[font-size:1.45rem];
  @apply tw:[line-height:1.05];
}

#teacherRecordsAttendancePanel .attendance-summary-card small {
  @apply tw:[color:#899583];
  @apply tw:[font-size:0.65rem];
  @apply tw:[font-weight:600];
}

#teacherRecordsAttendancePanel .attendance-summary-card.status-total::before {
  @apply tw:[background:#4f7d3a];
}

#teacherRecordsAttendancePanel .attendance-summary-card.status-present::before {
  @apply tw:[background:#4d9b62];
}

#teacherRecordsAttendancePanel .attendance-summary-card.status-late::before {
  @apply tw:[background:#d4a62a];
}

#teacherRecordsAttendancePanel .attendance-summary-card.status-absent::before {
  @apply tw:[background:#cf5b58];
}

#teacherRecordsAttendancePanel .attendance-summary-card.status-excused::before {
  @apply tw:[background:#6787ad];
}

#teacherRecordsAttendancePanel .attendance-summary-card.status-present,
#teacherRecordsAttendancePanel .attendance-summary-card.status-late,
#teacherRecordsAttendancePanel .attendance-summary-card.status-absent,
#teacherRecordsAttendancePanel .attendance-summary-card.status-excused {
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
  @apply tw:[color:#263321];
}

#teacherRecordsAttendancePanel .attendance-summary-card.status-present strong,
#teacherRecordsAttendancePanel .attendance-summary-card.status-late strong,
#teacherRecordsAttendancePanel .attendance-summary-card.status-absent strong,
#teacherRecordsAttendancePanel .attendance-summary-card.status-excused strong {
  @apply tw:[color:#203119];
}

#teacherRecordsAttendancePanel .attendance-shell {
  @apply tw:[gap:0];
}

#teacherRecordsAttendancePanel .attendance-toolbar-card {
  @apply tw:grid;
  @apply tw:[grid-template-columns:1fr];
  @apply tw:items-stretch;
  @apply tw:[gap:0.9rem];
  @apply tw:[margin:1rem_1.2rem_0];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#dce7d6];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#f7fbf4];
  @apply tw:[box-shadow:none];
}

#teacherRecordsAttendancePanel .attendance-toolbar-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-header-copy {
  @apply tw:grid;
  @apply tw:[gap:0.24rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-kicker {
  @apply tw:[gap:0.35rem];
  @apply tw:[padding:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:0.66rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-header-copy h5 {
  @apply tw:[color:#23331d];
  @apply tw:[font-size:0.95rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-header-copy p {
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.76rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-note {
  @apply tw:[border-color:#cfddc7];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#4f6a43];
  @apply tw:[font-size:0.72rem];
}

#teacherRecordsAttendancePanel .attendance-scope-panel {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(180px,_0.6fr)_minmax(300px,_1fr)];
  @apply tw:items-center;
  @apply tw:[gap:0.9rem];
  @apply tw:[padding:0.75rem];
  @apply tw:[border:1px_solid_#dfe9da];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#ffffff];
}

#teacherRecordsAttendancePanel .attendance-scope-panel-copy {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

#teacherRecordsAttendancePanel .attendance-scope-panel-copy .attendance-step-badge,
#teacherRecordsAttendancePanel .attendance-toolbar-field-card > .attendance-step-badge {
  @apply tw:inline-flex;
}

#teacherRecordsAttendancePanel .attendance-step-badge {
  @apply tw:[padding:0.16rem_0.45rem];
  @apply tw:[background:#e8f2e2];
  @apply tw:[color:#4f7d3a];
  @apply tw:[font-size:0.6rem];
}

#teacherRecordsAttendancePanel .attendance-scope-panel-copy strong {
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.84rem];
}

#teacherRecordsAttendancePanel .attendance-scope-panel-copy small {
  @apply tw:block;
  @apply tw:[color:#7a8874];
  @apply tw:[font-size:0.7rem];
}

#teacherRecordsAttendancePanel .attendance-scope-switch {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.45rem];
}

#teacherRecordsAttendancePanel .attendance-scope-btn {
  @apply tw:[min-height:42px];
  @apply tw:[padding:0.55rem_0.75rem];
  @apply tw:[border-color:#cfddc7];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#52634a];
}

#teacherRecordsAttendancePanel .attendance-scope-btn.active {
  @apply tw:[border-color:#1e4307];
  @apply tw:[background:#1e4307];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_7px_16px_rgba(30,_67,_7,_0.16)];
}

#teacherRecordsAttendancePanel .attendance-toolbar-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(180px,_1fr)_minmax(190px,_1fr)_minmax(300px,_1.25fr)];
  @apply tw:items-stretch;
  @apply tw:[gap:0.65rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-field-card {
  @apply tw:grid;
  @apply tw:[align-content:start];
  @apply tw:[gap:0.58rem];
  @apply tw:[padding:0.75rem];
  @apply tw:[border:1px_solid_#dfe9da];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#ffffff];
}

#teacherRecordsAttendancePanel .attendance-date-card-copy,
#teacherRecordsAttendancePanel .attendance-date-quick-actions,
#teacherRecordsAttendancePanel .attendance-date-helper,
#teacherRecordsAttendancePanel .attendance-actions-hint {
  @apply tw:flex;
}

#teacherRecordsAttendancePanel .attendance-date-card-copy {
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
}

#teacherRecordsAttendancePanel .attendance-date-card-icon {
  @apply tw:[width:34px];
  @apply tw:[height:34px];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#e5efe0];
  @apply tw:[color:#4f7d3a];
  @apply tw:[box-shadow:none];
}

#teacherRecordsAttendancePanel .attendance-date-card-copy strong {
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.82rem];
}

#teacherRecordsAttendancePanel .attendance-date-card-copy small {
  @apply tw:[color:#82907b];
  @apply tw:[font-size:0.68rem];
}

#teacherRecordsAttendancePanel .filter-field span {
  @apply tw:[color:#687761];
  @apply tw:[font-size:0.65rem];
}

#teacherRecordsAttendancePanel .filter-field select,
#teacherRecordsAttendancePanel .attendance-date-input-wrap {
  @apply tw:[min-height:42px];
  @apply tw:[border-color:#cfddc7];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#263321];
}

#teacherRecordsAttendancePanel .attendance-date-input-wrap:focus-within,
#teacherRecordsAttendancePanel .attendance-search-input-wrap:focus-within {
  @apply tw:[border-color:#6f9d58];
  @apply tw:[box-shadow:0_0_0_3px_rgba(111,_157,_88,_0.16)];
}

#teacherRecordsAttendancePanel .attendance-date-chip {
  @apply tw:[padding:0.32rem_0.62rem];
  @apply tw:[border-color:#cfddc7];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#687761];
  @apply tw:[font-size:0.7rem];
}

#teacherRecordsAttendancePanel .attendance-date-chip.active {
  @apply tw:[border-color:#9fbe8f];
  @apply tw:[background:#e8f2e2];
  @apply tw:[color:#315f1e];
}

#teacherRecordsAttendancePanel .attendance-date-helper {
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.68rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-actions {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.45rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-actions .pagination-btn {
  @apply tw:[min-height:42px];
  @apply tw:[border-radius:11px];
  @apply tw:[box-shadow:none];
}

#teacherRecordsAttendancePanel .attendance-load-btn {
  @apply tw:[border-color:#9fbe8f];
  @apply tw:[background:#edf6e8];
  @apply tw:[color:#315f1e];
}

#teacherRecordsAttendancePanel .attendance-save-btn {
  @apply tw:[border-color:#1e4307];
  @apply tw:[background:#1e4307];
  @apply tw:[color:#ffffff];
  @apply tw:[box-shadow:0_7px_16px_rgba(30,_67,_7,_0.16)];
}

#teacherRecordsAttendancePanel .attendance-lock-btn {
  @apply tw:[border-color:#b8c9af];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#52634a];
}

#teacherRecordsAttendancePanel .attendance-toolbar-actions .attendance-load-btn:not(:disabled):hover,
#teacherRecordsAttendancePanel .attendance-toolbar-actions .attendance-lock-btn:not(:disabled):hover {
  @apply tw:[border-color:#4f7d3a];
  @apply tw:[background:#e5efe0];
  @apply tw:[color:#1e4307];
}

#teacherRecordsAttendancePanel .attendance-toolbar-actions .attendance-save-btn:not(:disabled):hover {
  @apply tw:[border-color:#315f1e];
  @apply tw:[background:#315f1e];
}

#teacherRecordsAttendancePanel .attendance-actions-hint {
  @apply tw:[color:#7d8b77];
  @apply tw:[font-size:0.68rem];
  @apply tw:[line-height:1.4];
}

#teacherRecordsAttendancePanel .attendance-legend-block {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
}

#teacherRecordsAttendancePanel .attendance-legend-title {
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.64rem];
  @apply tw:whitespace-nowrap;
}

#teacherRecordsAttendancePanel .attendance-legend-row {
  @apply tw:flex;
  @apply tw:[gap:0.4rem];
}

#teacherRecordsAttendancePanel .attendance-legend-pill,
#teacherRecordsAttendancePanel .attendance-breakdown-pill {
  @apply tw:relative;
  @apply tw:[gap:0.34rem];
  @apply tw:[min-height:28px];
  @apply tw:[padding:0.3rem_0.58rem];
  @apply tw:[font-size:0.68rem];
}

#teacherRecordsAttendancePanel .attendance-legend-pill::before {
  @apply tw:[content:""];
  @apply tw:[width:6px];
  @apply tw:[height:6px];
  @apply tw:[border-radius:50%];
  @apply tw:[background:currentColor];
}

#teacherRecordsAttendancePanel .attendance-layout {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_minmax(270px,_310px)];
  @apply tw:[align-items:start];
  @apply tw:[gap:0.9rem];
  @apply tw:[margin:1rem_1.2rem_1.2rem];
}

#teacherRecordsAttendancePanel .attendance-panel {
  @apply tw:[min-width:0];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#dce7d6];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_8px_22px_rgba(30,_67,_7,_0.05)];
}

#teacherRecordsAttendancePanel .attendance-panel-head {
  @apply tw:items-center;
  @apply tw:[margin:0];
}

#teacherRecordsAttendancePanel .attendance-panel-title {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
}

#teacherRecordsAttendancePanel .attendance-panel-title-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:38px];
  @apply tw:[height:38px];
  @apply tw:[flex:0_0_38px];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#e5efe0];
  @apply tw:[color:#4f7d3a];
}

#teacherRecordsAttendancePanel .attendance-panel-title-icon.history {
  @apply tw:[background:#edf2e9];
  @apply tw:[color:#526f46];
}

#teacherRecordsAttendancePanel .attendance-panel-kicker {
  @apply tw:block;
  @apply tw:[padding:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.76rem];
  @apply tw:[letter-spacing:0.04em];
}

#teacherRecordsAttendancePanel .attendance-panel-title p {
  @apply tw:[margin-top:0.12rem];
  @apply tw:[color:#7b8875];
  @apply tw:[font-size:0.7rem];
}

#teacherRecordsAttendancePanel .attendance-record-badges {
  @apply tw:[gap:0.35rem];
}

#teacherRecordsAttendancePanel .attendance-record-badges .record-chip {
  @apply tw:[padding:0.26rem_0.55rem];
  @apply tw:[font-size:0.65rem];
}

#teacherRecordsAttendancePanel .table-state {
  @apply tw:[min-height:180px];
  @apply tw:[border-color:#cfddc7];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#f7fbf4];
  @apply tw:[color:#687761];
}

#teacherRecordsAttendancePanel .attendance-roster-toolbar {
  @apply tw:[padding:0.75rem];
  @apply tw:[border-color:#dfe9da];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsAttendancePanel .attendance-search-field > span,
#teacherRecordsAttendancePanel .attendance-filter-field > span,
#teacherRecordsAttendancePanel .attendance-bulk-actions > span {
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.64rem];
}

#teacherRecordsAttendancePanel .attendance-search-input-wrap,
#teacherRecordsAttendancePanel .attendance-filter-field select {
  @apply tw:[min-height:42px];
  @apply tw:[border-color:#cfddc7];
  @apply tw:[border-radius:11px];
  @apply tw:[color:#263321];
}

#teacherRecordsAttendancePanel .attendance-bulk-btn,
#teacherRecordsAttendancePanel .attendance-clear-filters-btn {
  @apply tw:[min-height:32px];
  @apply tw:[padding:0.34rem_0.62rem];
  @apply tw:[font-size:0.68rem];
}

#teacherRecordsAttendancePanel .attendance-roster-results {
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.76rem];
}

#teacherRecordsAttendancePanel .attendance-roster-table-wrap {
  @apply tw:[max-height:62vh];
  @apply tw:overflow-auto;
  @apply tw:[border-color:#dce7d6];
  @apply tw:[border-radius:15px];
}

#teacherRecordsAttendancePanel .attendance-roster-table thead th {
  @apply tw:sticky;
  @apply tw:[top:0];
  @apply tw:[z-index:3];
  @apply tw:[border-color:#dce7d6];
  @apply tw:[background:#edf5e9];
  @apply tw:[color:#52634a];
  @apply tw:[font-size:0.66rem];
}

#teacherRecordsAttendancePanel .attendance-roster-row {
  @apply tw:[box-shadow:inset_3px_0_0_transparent];
}

#teacherRecordsAttendancePanel .attendance-roster-row.status-present {
  @apply tw:[box-shadow:inset_3px_0_0_#54a36a];
}

#teacherRecordsAttendancePanel .attendance-roster-row.status-late {
  @apply tw:[box-shadow:inset_3px_0_0_#d4a62a];
}

#teacherRecordsAttendancePanel .attendance-roster-row.status-absent {
  @apply tw:[box-shadow:inset_3px_0_0_#cf5b58];
}

#teacherRecordsAttendancePanel .attendance-roster-row.status-excused {
  @apply tw:[box-shadow:inset_3px_0_0_#6787ad];
}

#teacherRecordsAttendancePanel .attendance-roster-row:hover,
#teacherRecordsAttendancePanel .attendance-roster-row:hover .attendance-roster-cell-student {
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsAttendancePanel .attendance-student-avatar {
  @apply tw:[border-color:#d4e4ca];
  @apply tw:[background:#e8f2e2];
}

#teacherRecordsAttendancePanel .attendance-student-avatar > .fa-user {
  @apply tw:[color:#4f7d3a]!;
}

#teacherRecordsAttendancePanel .attendance-student-copy strong {
  @apply tw:[color:#263321];
}

#teacherRecordsAttendancePanel .attendance-student-email,
#teacherRecordsAttendancePanel .attendance-roster-section {
  @apply tw:[color:#71806a];
}

#teacherRecordsAttendancePanel .attendance-student-grade {
  @apply tw:[background:#e8f2e2];
  @apply tw:[color:#315f1e];
}

#teacherRecordsAttendancePanel .attendance-status-select {
  @apply tw:[min-height:40px];
  @apply tw:[border-radius:10px];
  @apply tw:[box-shadow:none];
}

#teacherRecordsAttendancePanel .attendance-history-panel {
  @apply tw:sticky;
  @apply tw:[top:1rem];
  @apply tw:[max-height:calc(100vh_-_2rem)];
  @apply tw:overflow-auto;
}

#teacherRecordsAttendancePanel .attendance-history-summary {
  @apply tw:cursor-pointer;
  @apply tw:[list-style:none];
}

#teacherRecordsAttendancePanel .attendance-history-summary::-webkit-details-marker {
  @apply tw:hidden;
}

#teacherRecordsAttendancePanel .attendance-history-chevron {
  @apply tw:[color:#6f9d58];
  @apply tw:[transition:transform_0.2s_ease];
}

#teacherRecordsAttendancePanel .attendance-history-panel[open] .attendance-history-chevron {
  @apply tw:[transform:rotate(180deg)];
}

#teacherRecordsAttendancePanel .attendance-history-content {
  @apply tw:[gap:0.7rem];
  @apply tw:[margin-top:0.85rem];
}

#teacherRecordsAttendancePanel .attendance-history-summary-grid {
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.4rem];
}

#teacherRecordsAttendancePanel .attendance-history-stat {
  @apply tw:[padding:0.65rem];
  @apply tw:[border-color:#dfe9da];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsAttendancePanel .attendance-history-stat span {
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.57rem];
}

#teacherRecordsAttendancePanel .attendance-history-stat strong {
  @apply tw:[color:#263321];
  @apply tw:[font-size:1rem];
}

#teacherRecordsAttendancePanel .attendance-history-list {
  @apply tw:[gap:0.55rem];
}

#teacherRecordsAttendancePanel .attendance-history-item {
  @apply tw:[grid-template-columns:68px_minmax(0,_1fr)];
  @apply tw:[gap:0.6rem];
  @apply tw:[padding:0.65rem];
  @apply tw:[border-color:#dfe9da];
  @apply tw:[border-radius:13px];
}

#teacherRecordsAttendancePanel .attendance-history-item:hover,
#teacherRecordsAttendancePanel .attendance-history-item.active {
  @apply tw:[border-color:#6f9d58];
  @apply tw:[box-shadow:0_0_0_3px_rgba(111,_157,_88,_0.12)];
}

#teacherRecordsAttendancePanel .attendance-history-date-badge,
#teacherRecordsAttendancePanel .attendance-history-item.active .attendance-history-date-badge {
  @apply tw:[min-width:0];
  @apply tw:[padding:0.58rem];
  @apply tw:[border-radius:10px];
  @apply tw:[background:linear-gradient(135deg,_#1e4307,_#4f7d3a)];
  @apply tw:[box-shadow:none];
}

#teacherRecordsAttendancePanel .attendance-history-copy strong {
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.76rem];
}

#teacherRecordsAttendancePanel .attendance-history-copy small,
#teacherRecordsAttendancePanel .attendance-history-count {
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.65rem];
}

#teacherRecordsAttendancePanel .attendance-history-meta {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:[grid-template-columns:1fr_auto];
  @apply tw:justify-items-start;
}

@media (max-width: 1180px) {
  #teacherRecordsAttendancePanel .attendance-workspace-context {
    @apply tw:static;
    @apply tw:max-w-none;
    @apply tw:justify-start;
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-actions-card {
    @apply tw:[grid-column:1_/_-1];
  }

  #teacherRecordsAttendancePanel .attendance-layout {
    @apply tw:[grid-template-columns:1fr];
  }

  #teacherRecordsAttendancePanel .attendance-history-panel {
    @apply tw:static;
    @apply tw:max-h-none;
  }
}

@media (max-width: 820px) {
  #teacherRecordsAttendancePanel .attendance-workspace-hero {
    @apply tw:[padding:1.15rem];
  }

  #teacherRecordsAttendancePanel .attendance-summary-grid {
    @apply tw:[grid-template-columns:repeat(5,_minmax(130px,_1fr))];
    @apply tw:overflow-x-auto;
    @apply tw:[padding-bottom:0.25rem];
    @apply tw:[scroll-snap-type:x_proximity];
  }

  #teacherRecordsAttendancePanel .attendance-summary-card {
    @apply tw:[scroll-snap-align:start];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-card,
  #teacherRecordsAttendancePanel .attendance-layout {
    @apply tw:[margin-inline:0.85rem];
  }

  #teacherRecordsAttendancePanel .attendance-scope-panel {
    @apply tw:[grid-template-columns:1fr];
  }
}

@media (max-width: 640px) {
  #teacherRecordsAttendancePanel {
    @apply tw:[border-radius:16px];
  }

  #teacherRecordsAttendancePanel .attendance-workspace-hero {
    @apply tw:[gap:0.9rem];
    @apply tw:[padding:1rem];
  }

  #teacherRecordsAttendancePanel .attendance-workspace-icon {
    @apply tw:[width:42px];
    @apply tw:[height:42px];
    @apply tw:[flex-basis:42px];
    @apply tw:[border-radius:13px];
  }

  #teacherRecordsAttendancePanel .attendance-workspace-context {
    @apply tw:grid;
    @apply tw:[grid-template-columns:1fr];
  }

  #teacherRecordsAttendancePanel .attendance-workspace-context span {
    @apply tw:[border-radius:11px];
  }

  #teacherRecordsAttendancePanel .attendance-summary-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:overflow-visible;
  }

  #teacherRecordsAttendancePanel .attendance-summary-card {
    @apply tw:[min-height:98px];
  }

  #teacherRecordsAttendancePanel .attendance-summary-card.status-total {
    @apply tw:[grid-column:1_/_-1];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-card,
  #teacherRecordsAttendancePanel .attendance-layout {
    @apply tw:[margin:0.75rem_0.65rem_0];
  }

  #teacherRecordsAttendancePanel .attendance-layout {
    @apply tw:[margin-bottom:0.75rem];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-header {
    @apply tw:grid;
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-note {
    @apply tw:w-full;
  }

  #teacherRecordsAttendancePanel .attendance-scope-switch,
  #teacherRecordsAttendancePanel .attendance-toolbar-grid,
  #teacherRecordsAttendancePanel .attendance-toolbar-actions {
    @apply tw:[grid-template-columns:1fr];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-actions-card {
    @apply tw:[grid-column:auto];
  }

  #teacherRecordsAttendancePanel .attendance-legend-block {
    @apply tw:grid;
  }

  #teacherRecordsAttendancePanel .attendance-legend-row {
    @apply tw:overflow-x-auto;
    @apply tw:[padding-bottom:0.2rem];
  }

  #teacherRecordsAttendancePanel .attendance-panel {
    @apply tw:[padding:0.75rem];
    @apply tw:[border-radius:15px];
  }

  #teacherRecordsAttendancePanel .attendance-panel-head {
    @apply tw:items-start;
  }

  #teacherRecordsAttendancePanel .attendance-roster-table-wrap {
    @apply tw:max-h-none;
    @apply tw:overflow-visible;
    @apply tw:[border:0];
  }

  #teacherRecordsAttendancePanel .attendance-roster-row,
  #teacherRecordsAttendancePanel .attendance-roster-row:nth-child(even) {
    @apply tw:[border-color:#dce7d6];
    @apply tw:[box-shadow:inset_3px_0_0_#6f9d58,_0_5px_14px_rgba(30,_67,_7,_0.06)];
  }

  #teacherRecordsAttendancePanel .attendance-roster-cell-student,
  #teacherRecordsAttendancePanel .attendance-roster-row:nth-child(even) .attendance-roster-cell-student {
    @apply tw:[background:#f7fbf4];
  }

  #teacherRecordsAttendancePanel .attendance-history-summary-grid {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }
}

@media (prefers-reduced-motion: reduce) {
  #teacherRecordsAttendancePanel .attendance-summary-card {
    @apply tw:[transition:none];
  }
}

/* Immediate-use attendance toolbar */
#teacherRecordsAttendancePanel .attendance-toolbar-title-row {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-title-row > div {
  @apply tw:grid;
  @apply tw:[gap:0.22rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-title-row h5 {
  @apply tw:[margin:0];
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.95rem];
}

#teacherRecordsAttendancePanel .attendance-primary-toolbar {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(12,_minmax(0,_1fr))];
  @apply tw:[gap:0.65rem];
  @apply tw:[align-items:end];
}

#teacherRecordsAttendancePanel .attendance-toolbar-control {
  @apply tw:grid;
  @apply tw:[align-content:end];
  @apply tw:[gap:0.38rem];
  @apply tw:[min-width:0];
}

#teacherRecordsAttendancePanel .attendance-toolbar-scope-control {
  @apply tw:[grid-column:span_3];
}

#teacherRecordsAttendancePanel .attendance-toolbar-class-control {
  @apply tw:[grid-column:span_3];
}

#teacherRecordsAttendancePanel .attendance-toolbar-date-control {
  @apply tw:[grid-column:span_3];
}

#teacherRecordsAttendancePanel .attendance-toolbar-actions-control {
  @apply tw:[grid-column:span_3];
}

#teacherRecordsAttendancePanel .attendance-toolbar-search-control {
  @apply tw:[grid-column:span_8];
}

#teacherRecordsAttendancePanel .attendance-toolbar-status-control {
  @apply tw:[grid-column:span_4];
}

#teacherRecordsAttendancePanel .attendance-control-field {
  @apply tw:grid;
  @apply tw:[gap:0.38rem];
  @apply tw:[min-width:0];
}

#teacherRecordsAttendancePanel .attendance-control-label {
  @apply tw:[color:#687761];
  @apply tw:[font-size:0.63rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.055em];
  @apply tw:uppercase;
}

#teacherRecordsAttendancePanel .attendance-control-input {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.48rem];
  @apply tw:[min-width:0];
  @apply tw:[min-height:42px];
  @apply tw:[padding:0_0.7rem];
  @apply tw:[border:1px_solid_#cfddc7];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#263321];
  @apply tw:[transition:border-color_0.18s_ease,_box-shadow_0.18s_ease,_background_0.18s_ease];
}

#teacherRecordsAttendancePanel .attendance-control-input:focus-within {
  @apply tw:[border-color:#6f9d58];
  @apply tw:[box-shadow:0_0_0_3px_rgba(111,_157,_88,_0.16)];
}

#teacherRecordsAttendancePanel .attendance-control-input > i:first-child {
  @apply tw:flex-none;
  @apply tw:[color:#6f9d58];
  @apply tw:[font-size:0.76rem];
}

#teacherRecordsAttendancePanel .attendance-control-input input,
#teacherRecordsAttendancePanel .attendance-control-input select {
  @apply tw:w-full;
  @apply tw:[min-width:0];
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.45rem_1.2rem_0.45rem_0];
  @apply tw:[border:0];
  @apply tw:[outline:0];
  @apply tw:appearance-none;
  @apply tw:[background:transparent];
  @apply tw:[color:#263321];
  @apply tw:[font:inherit];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:650];
}

#teacherRecordsAttendancePanel .attendance-control-input input::placeholder {
  @apply tw:[color:#939f8e];
  @apply tw:[font-weight:500];
}

#teacherRecordsAttendancePanel .attendance-control-input input[type="date"] {
  @apply tw:[padding-right:0];
}

#teacherRecordsAttendancePanel .attendance-control-chevron {
  @apply tw:absolute;
  @apply tw:[right:0.72rem];
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.62rem];
  @apply tw:pointer-events-none;
}

#teacherRecordsAttendancePanel .attendance-control-readonly {
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsAttendancePanel .attendance-control-readonly strong {
  @apply tw:[min-width:0];
  @apply tw:overflow-hidden;
  @apply tw:[color:#263321];
  @apply tw:[font-size:0.76rem];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

#teacherRecordsAttendancePanel .attendance-toolbar-date-control {
  @apply tw:[grid-template-columns:minmax(0,_1fr)_auto];
}

#teacherRecordsAttendancePanel .attendance-toolbar-date-control .attendance-control-field {
  @apply tw:[min-width:0];
}

#teacherRecordsAttendancePanel .attendance-toolbar-date-control .attendance-date-quick-actions {
  @apply tw:flex;
  @apply tw:items-end;
  @apply tw:[gap:0.25rem];
  @apply tw:[padding-bottom:0.1rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-date-control .attendance-date-chip {
  @apply tw:[min-height:26px];
  @apply tw:[padding:0.22rem_0.42rem];
  @apply tw:[font-size:0.6rem];
}

#teacherRecordsAttendancePanel .attendance-toolbar-actions-control .attendance-toolbar-actions {
  @apply tw:[height:42px];
}

#teacherRecordsAttendancePanel .attendance-toolbar-footer {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding-top:0.75rem];
  @apply tw:[border-top:1px_solid_#dfe9da];
}

#teacherRecordsAttendancePanel .attendance-toolbar-helper {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[color:#71806a];
  @apply tw:[font-size:0.68rem];
  @apply tw:[line-height:1.4];
}

#teacherRecordsAttendancePanel .attendance-toolbar-helper i {
  @apply tw:[color:#6f9d58];
}

#teacherRecordsAttendancePanel .attendance-bulk-toolbar {
  @apply tw:flex;
  @apply tw:items-end;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[padding:0.68rem_0.75rem];
  @apply tw:[border:1px_solid_#dfe9da];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f7fbf4];
}

#teacherRecordsAttendancePanel .attendance-bulk-actions {
  @apply tw:[gap:0.36rem];
}

#teacherRecordsAttendancePanel .attendance-bulk-action-row {
  @apply tw:inline-flex;
  @apply tw:flex-nowrap;
  @apply tw:[gap:0];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#cbd9c4];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#ffffff];
}

#teacherRecordsAttendancePanel .attendance-bulk-btn {
  @apply tw:[min-height:34px];
  @apply tw:[margin:0];
  @apply tw:[padding:0.35rem_0.68rem];
  @apply tw:[border:0];
  @apply tw:[border-right:1px_solid_#d8e3d3];
  @apply tw:rounded-none;
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:none];
  @apply tw:[color:#52634a];
}

#teacherRecordsAttendancePanel .attendance-bulk-btn:last-child {
  @apply tw:[border-right:0];
}

#teacherRecordsAttendancePanel .attendance-bulk-btn.status-present {
  @apply tw:[background:#edf8f0];
  @apply tw:[color:#26703c];
}

#teacherRecordsAttendancePanel .attendance-bulk-btn.status-late {
  @apply tw:[background:#fff8e6];
  @apply tw:[color:#8a6518];
}

#teacherRecordsAttendancePanel .attendance-bulk-btn.status-absent {
  @apply tw:[background:#fff0ef];
  @apply tw:[color:#a54643];
}

#teacherRecordsAttendancePanel .attendance-bulk-btn.status-excused {
  @apply tw:[background:#eef4fa];
  @apply tw:[color:#4e6f95];
}

#teacherRecordsAttendancePanel .attendance-bulk-btn:hover:not(:disabled) {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:transform-none;
  @apply tw:[box-shadow:inset_0_0_0_2px_currentColor];
}

#teacherRecordsAttendancePanel .attendance-clear-filters-btn {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
  @apply tw:flex-none;
  @apply tw:[min-height:34px];
  @apply tw:[border-color:#cbd9c4];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#52634a];
}

#teacherRecordsAttendancePanel .attendance-roster-row:nth-child(even),
#teacherRecordsAttendancePanel .attendance-roster-row:nth-child(even) .attendance-roster-cell-student {
  @apply tw:[background:#f9fcf7];
}

#teacherRecordsAttendancePanel .attendance-status-select {
  @apply tw:appearance-none;
  @apply tw:[border-color:currentColor];
  @apply tw:[border-radius:999px];
  @apply tw:[padding-inline:0.8rem_1.7rem];
  @apply tw:cursor-pointer;
}

#teacherRecordsAttendancePanel .attendance-student-control-inline {
  @apply tw:relative;
}

#teacherRecordsAttendancePanel .attendance-student-control-inline::after {
  @apply tw:[content:"\f078"];
  @apply tw:absolute;
  @apply tw:[top:50%];
  @apply tw:[right:0.72rem];
  @apply tw:text-current;
  @apply tw:[font-family:"Font_Awesome_5_Free"];
  @apply tw:[font-size:0.6rem];
  @apply tw:[font-weight:900];
  @apply tw:pointer-events-none;
  @apply tw:[transform:translateY(-50%)];
}

#teacherRecordsAttendancePanel .attendance-history-summary {
  @apply tw:[padding:0.1rem];
  @apply tw:[border-radius:12px];
  @apply tw:[transition:background_0.18s_ease];
}

#teacherRecordsAttendancePanel .attendance-history-summary:hover {
  @apply tw:[background:#f7fbf4];
}

@media (max-width: 1180px) {
  #teacherRecordsAttendancePanel .attendance-toolbar-scope-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-class-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-date-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-actions-control {
    @apply tw:[grid-column:span_6];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-search-control {
    @apply tw:[grid-column:span_8];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-status-control {
    @apply tw:[grid-column:span_4];
  }
}

@media (max-width: 820px) {
  #teacherRecordsAttendancePanel .attendance-toolbar-title-row,
  #teacherRecordsAttendancePanel .attendance-toolbar-footer {
    @apply tw:items-start;
    @apply tw:flex-col;
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-scope-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-class-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-date-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-actions-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-search-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-status-control {
    @apply tw:[grid-column:span_6];
  }

  #teacherRecordsAttendancePanel .attendance-legend-block {
    @apply tw:w-full;
  }
}

@media (max-width: 640px) {
  #teacherRecordsAttendancePanel .attendance-primary-toolbar {
    @apply tw:[grid-template-columns:1fr];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-scope-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-class-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-date-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-actions-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-search-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-status-control {
    @apply tw:[grid-column:auto];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-date-control {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-date-control .attendance-date-quick-actions {
    @apply tw:items-center;
    @apply tw:[padding:0];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-actions-control .attendance-toolbar-actions {
    @apply tw:h-auto;
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }

  #teacherRecordsAttendancePanel .attendance-bulk-toolbar {
    @apply tw:items-stretch;
    @apply tw:flex-col;
  }

  #teacherRecordsAttendancePanel .attendance-bulk-action-row {
    @apply tw:grid;
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  #teacherRecordsAttendancePanel .attendance-bulk-btn {
    @apply tw:[border-right:0];
    @apply tw:[border-bottom:1px_solid_#d8e3d3];
  }

  #teacherRecordsAttendancePanel .attendance-bulk-btn:nth-last-child(-n + 2) {
    @apply tw:[border-bottom:0];
  }

  #teacherRecordsAttendancePanel .attendance-clear-filters-btn {
    @apply tw:justify-center;
    @apply tw:w-full;
  }
}

/* Attendance layout stabilization */
#teacherRecordsAttendancePanel {
  @apply tw:box-border;
  @apply tw:w-full;
  @apply tw:max-w-full;
}

#teacherRecordsAttendancePanel > *,
#teacherRecordsAttendancePanel .attendance-shell,
#teacherRecordsAttendancePanel .attendance-primary-toolbar,
#teacherRecordsAttendancePanel .attendance-roster-body,
#teacherRecordsAttendancePanel .attendance-history-content {
  @apply tw:[min-width:0];
  @apply tw:max-w-full;
}

#teacherRecordsAttendancePanel .attendance-toolbar-card,
#teacherRecordsAttendancePanel .attendance-layout {
  @apply tw:w-auto;
  @apply tw:max-w-none;
}

#teacherRecordsAttendancePanel .attendance-primary-toolbar {
  @apply tw:w-full;
  @apply tw:[grid-template-columns:minmax(180px,_1.05fr)_minmax(220px,_1.35fr)_minmax(220px,_1.3fr)_minmax(230px,_1.2fr)];
  @apply tw:[grid-template-areas:"scope_class_date_actions"______"search_search_search_status"];
  @apply tw:[align-items:end];
}

#teacherRecordsAttendancePanel .attendance-toolbar-scope-control {
  @apply tw:[grid-area:scope];
}

#teacherRecordsAttendancePanel .attendance-toolbar-class-control {
  @apply tw:[grid-area:class];
}

#teacherRecordsAttendancePanel .attendance-toolbar-date-control {
  @apply tw:[grid-area:date];
}

#teacherRecordsAttendancePanel .attendance-toolbar-actions-control {
  @apply tw:[grid-area:actions];
}

#teacherRecordsAttendancePanel .attendance-toolbar-search-control {
  @apply tw:[grid-area:search];
}

#teacherRecordsAttendancePanel .attendance-toolbar-status-control {
  @apply tw:[grid-area:status];
}

#teacherRecordsAttendancePanel .attendance-toolbar-scope-control,
#teacherRecordsAttendancePanel .attendance-toolbar-class-control,
#teacherRecordsAttendancePanel .attendance-toolbar-date-control,
#teacherRecordsAttendancePanel .attendance-toolbar-actions-control,
#teacherRecordsAttendancePanel .attendance-toolbar-search-control,
#teacherRecordsAttendancePanel .attendance-toolbar-status-control {
  @apply tw:[grid-column:auto];
}

#teacherRecordsAttendancePanel .attendance-control-label {
  @apply tw:[font-size:0.68rem];
}

#teacherRecordsAttendancePanel .attendance-control-input input,
#teacherRecordsAttendancePanel .attendance-control-input select,
#teacherRecordsAttendancePanel .attendance-control-readonly strong {
  @apply tw:[font-size:0.82rem];
}

#teacherRecordsAttendancePanel .attendance-scope-btn {
  @apply tw:[font-size:0.78rem];
}

#teacherRecordsAttendancePanel .attendance-layout {
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
}

#teacherRecordsAttendancePanel .attendance-history-panel {
  @apply tw:static;
  @apply tw:w-full;
  @apply tw:max-h-none;
  @apply tw:overflow-visible;
}

#teacherRecordsAttendancePanel .attendance-history-summary .attendance-panel-head {
  @apply tw:w-full;
}

#teacherRecordsAttendancePanel .attendance-panel-kicker {
  @apply tw:[font-size:0.82rem];
}

#teacherRecordsAttendancePanel .attendance-panel-title p,
#teacherRecordsAttendancePanel .attendance-roster-results {
  @apply tw:[font-size:0.76rem];
}

#teacherRecordsAttendancePanel .attendance-roster-table thead th {
  @apply tw:[padding:0.78rem_0.9rem];
  @apply tw:[font-size:0.7rem];
}

#teacherRecordsAttendancePanel .attendance-roster-cell {
  @apply tw:[padding:0.82rem_0.9rem];
}

#teacherRecordsAttendancePanel .attendance-student-copy strong {
  @apply tw:[font-size:0.9rem];
}

#teacherRecordsAttendancePanel .attendance-student-copy small,
#teacherRecordsAttendancePanel .attendance-roster-section {
  @apply tw:[font-size:0.76rem];
}

#teacherRecordsAttendancePanel .attendance-status-select {
  @apply tw:[min-height:42px];
  @apply tw:[font-size:0.78rem];
}

#teacherRecordsAttendancePanel .attendance-history-content {
  @apply tw:w-full;
}

#teacherRecordsAttendancePanel .attendance-history-summary-grid {
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
}

#teacherRecordsAttendancePanel .attendance-history-item {
  @apply tw:[grid-template-columns:100px_minmax(0,_1fr)_auto];
  @apply tw:items-center;
}

#teacherRecordsAttendancePanel .attendance-history-meta {
  @apply tw:[grid-column:auto];
  @apply tw:justify-items-end;
}

@media (max-width: 1180px) {
  #teacherRecordsAttendancePanel .attendance-primary-toolbar {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
    @apply tw:[grid-template-areas:"scope_class"________"date_actions"________"search_status"];
  }

  #teacherRecordsAttendancePanel .attendance-toolbar-scope-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-class-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-date-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-actions-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-search-control,
  #teacherRecordsAttendancePanel .attendance-toolbar-status-control {
    @apply tw:[grid-column:auto];
  }
}

@media (max-width: 760px) {
  #teacherRecordsAttendancePanel .attendance-primary-toolbar {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:[grid-template-areas:"scope"________"class"________"date"________"search"________"status"________"actions"];
  }

  #teacherRecordsAttendancePanel .attendance-history-item {
    @apply tw:[grid-template-columns:76px_minmax(0,_1fr)];
  }

  #teacherRecordsAttendancePanel .attendance-history-meta {
    @apply tw:[grid-column:1_/_-1];
    @apply tw:justify-items-start;
  }
}

@media (max-width: 640px) {
  #teacherRecordsAttendancePanel .attendance-toolbar-actions-control .attendance-toolbar-actions {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }

  #teacherRecordsAttendancePanel .attendance-history-summary-grid {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }
}

.integrity-count {
  @apply tw:w-max;
  @apply tw:[padding:0.34rem_0.58rem];
  @apply tw:[border-radius:999px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
}

.integrity-count.is-clear {
  @apply tw:[border:1px_solid_#bbf7d0];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#166534];
}

.integrity-count.has-violations {
  @apply tw:[border:1px_solid_#fecaca];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}

.integrity-log-details summary {
  @apply tw:w-max;
  @apply tw:[list-style:none];
  @apply tw:cursor-pointer;
}

.integrity-log-details summary::-webkit-details-marker {
  @apply tw:hidden;
}

.integrity-log-popover {
  @apply tw:[width:min(310px,_72vw)];
  @apply tw:[margin-top:0.55rem];
  @apply tw:[padding:0.7rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:12px];
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
  @apply tw:[background:#fff];
  @apply tw:[color:#334155];
  @apply tw:[box-shadow:0_10px_24px_rgba(15,_23,_42,_0.08)];
}

.integrity-log-popover > strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.78rem];
}

.integrity-termination {
  @apply tw:[color:#b91c1c];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:700];
}

.integrity-log-popover ol {
  @apply tw:[max-height:180px];
  @apply tw:[margin:0];
  @apply tw:[padding-left:1.1rem];
  @apply tw:overflow-y-auto;
}

.integrity-log-popover li {
  @apply tw:[padding:0.3rem_0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.7rem];
  @apply tw:[line-height:1.4];
}

.integrity-log-popover li span,
.integrity-log-popover li small {
  @apply tw:block;
}

.integrity-log-popover li small {
  @apply tw:[margin-top:0.12rem];
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.62rem];
}
.assessment-edit-attachments {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
}

.assessment-edit-attachments > span {
  @apply tw:[font-weight:700];
  @apply tw:[color:#334155];
}

.assessment-edit-attachments > p {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.78rem];
}

.assessment-edit-dropzone {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[min-height:88px];
  @apply tw:[padding:0.9rem];
  @apply tw:[border:1.5px_dashed_#94a3b8];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
  @apply tw:cursor-pointer;
}

.assessment-edit-dropzone.is-dragging {
  @apply tw:[border-color:#69aa47];
  @apply tw:[background:#f0f9eb];
}

.assessment-edit-dropzone input {
  @apply tw:hidden;
}

.assessment-edit-file-list {
  @apply tw:grid;
  @apply tw:[gap:0.4rem];
}

.assessment-edit-file {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[padding:0.55rem_0.65rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:9px];
}

.assessment-edit-file > span {
  @apply tw:[min-width:0];
  @apply tw:grid;
}

.assessment-edit-file strong {
  @apply tw:overflow-hidden;
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.assessment-edit-file small {
  @apply tw:[color:#64748b];
}

.assessment-edit-file button {
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:#b91c1c];
  @apply tw:cursor-pointer;
}

.assessment-edit-progress {
  @apply tw:[height:0.4rem];
  @apply tw:overflow-hidden;
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e2e8f0];
}

.assessment-edit-progress span {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:#69aa47];
}

</style>
