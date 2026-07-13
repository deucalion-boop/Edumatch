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
          <router-link to="/teacher/dashboard" class="nav-link" :class="{ active: isActiveRoute('/teacher/dashboard') }" @click="closeSidebar"><i class="fas fa-home"></i><span>Dashboard</span></router-link>
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
          <router-link to="/teacher/students" class="nav-link" :class="{ active: isActiveRoute('/teacher/students') }" @click="closeSidebar"><i class="fas fa-user-graduate"></i><span>Students</span></router-link>
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
      <header class="top-header student-dashboard-header" data-tour="students-header">
        <div class="header-content">
          <div class="header-left">
            <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar"><i class="fas fa-bars"></i></button>
            <div class="student-header-copy">
              <span class="student-page-eyebrow">Student Management</span>
              <h1>Students</h1>
            </div>
          </div>
          <div class="header-actions">
            <div class="header-right-controls">
              <button type="button" class="header-tour-btn" @click="launchManualTour" aria-label="Help and tour" title="Help / Tour">
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
                      <button type="button" class="notification-dropdown-clear" :disabled="notifications.length === 0" @click="clearAllNotifications">Clear all</button>
                      <button type="button" class="notification-dropdown-close" @click="closeNotificationsPanel" aria-label="Close notifications"><i class="fas fa-times"></i></button>
                    </div>
                  </div>
                  <UserNotificationList :notifications="notifications" :loading="isNotificationsLoading" />
                </div>
              </div>
              <div ref="accountMenuRef" class="account-menu">
                <button type="button" class="header-tour-btn account-menu-trigger" aria-label="Account menu" title="Account" @click="toggleAccountMenu"><i class="fas fa-cog"></i></button>
                <div v-if="isAccountMenuOpen" class="account-menu-dropdown">
                  <button type="button" class="account-menu-item" @click="goToProfile"><i class="fas fa-user"></i><span>Profile</span></button>
                  <button type="button" class="account-menu-item" @click="goToSettings"><i class="fas fa-cog"></i><span>Settings</span></button>
                  <button type="button" class="account-menu-item danger" @click="handleLogout"><i class="fas fa-sign-out-alt"></i><span>Logout</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="student-header-context" :class="{ 'is-unassigned': !hasAdvisorySection }">
          <div class="student-context-icon"><i class="fas fa-layer-group"></i></div>
          <div class="student-context-copy">
            <strong>{{ hasAdvisorySection ? `Advisory Section ${teacherAdvisorySectionName}` : 'Advisory section unassigned' }}</strong>
            <span>{{ hasAdvisorySection ? 'New student accounts are placed in this section; handled classes remain code-based.' : 'Ask your Head Teacher to assign an advisory section before inviting students.' }}</span>
          </div>
          <span class="student-context-subject"><i class="fas fa-book-open"></i>{{ teacherSubject || 'Department subject' }}</span>
        </div>
      </header>
      <section v-if="toast.show" class="students-toast" :class="`toast-${toast.type}`" aria-live="polite">
        <i class="fas" :class="toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'"></i>
        <span>{{ toast.message }}</span>
      </section>
      <section class="student-kpi-grid" aria-label="Student management overview">
        <article class="student-kpi-card kpi-classes">
          <span class="student-kpi-icon"><i class="fas fa-chalkboard"></i></span>
          <div><span>Total Classes</span><strong>{{ subjects.length }}</strong><small>Handled classes</small></div>
        </article>
        <article class="student-kpi-card kpi-students">
          <span class="student-kpi-icon"><i class="fas fa-user-graduate"></i></span>
          <div><span>Total Students</span><strong>{{ students.length }}</strong><small>Active roster</small></div>
        </article>
        <article class="student-kpi-card kpi-pending">
          <span class="student-kpi-icon"><i class="fas fa-user-clock"></i></span>
          <div><span>Pending Requests</span><strong>{{ enrollmentRequests.length }}</strong><small>Awaiting review</small></div>
        </article>
        <article class="student-kpi-card kpi-progress">
          <span class="student-kpi-icon"><i class="fas fa-chart-line"></i></span>
          <div><span>Average Progress</span><strong>{{ averageProgress }}%</strong><small>Across all students</small></div>
        </article>
      </section>

      <section class="student-management-grid">
      <section class="section-card animated-card dashboard-panel class-management-panel" :class="{ 'has-open-class-menu': subjectActionsMenuId }" data-tour="students-subjects-section">
        <div class="dashboard-panel-header class-management-header">
          <div class="class-management-header-copy">
            <span class="dashboard-panel-eyebrow">Teaching spaces</span>
            <h3 class="section-title">Class Management</h3>
            <p class="class-list-subtitle">Create classes, share codes, and manage enrolled students.</p>
          </div>
          <div class="results-controls class-management-controls">
            <div class="tour-button-anchor" data-tour="students-invite-button">
              <button
                type="button"
                class="btn btn-primary btn-sm create-class-btn student-invite-icon-btn"
                :disabled="!hasAdvisorySection"
                @click="openStudentInviteModal"
                aria-label="Invite Student"
                :title="hasAdvisorySection ? 'Invite Student' : 'Assign an advisory section first'"
              >
                <i class="fas fa-plus" aria-hidden="true"></i>
                <span>Invite Student</span>
              </button>
            </div>
            <button type="button" class="btn btn-primary btn-sm create-class-btn" @click="openCreateClassModal">
              <i class="fas fa-plus"></i>
              Create Class
            </button>
          </div>
        </div>

        <div v-if="subjects.length === 0" class="dashboard-empty-state">
          <span class="dashboard-empty-icon"><i class="fas fa-chalkboard"></i></span>
          <div><strong>No classes yet</strong><p>Create your first class to generate a secure enrollment code.</p></div>
        </div>

        <div v-else class="subject-management-grid">
          <article v-for="subject in subjects" :key="subject.id" class="subject-management-card" :class="{ 'menu-open': subjectActionsMenuId === subject.id }">
            <div class="subject-management-head">
              <div class="subject-management-title-block">
                <h4>{{ subject.className || subject.name }}</h4>
                <p>{{ subject.track || 'General' }} · {{ subject.code }}</p>
              </div>
              <div class="subject-management-menu-wrap" @click.stop>
                <span class="subject-management-code">{{ subject.code }}</span>
                <button
                  type="button"
                  class="subject-menu-trigger"
                  aria-label="Class actions"
                  :aria-expanded="subjectActionsMenuId === subject.id"
                  :aria-controls="`subject-actions-${subject.id}`"
                  @click="toggleSubjectActionsMenu(subject.id)"
                >
                  <i class="fas fa-ellipsis-h" aria-hidden="true"></i>
                </button>
                <div
                  v-if="subjectActionsMenuId === subject.id"
                  :id="`subject-actions-${subject.id}`"
                  class="subject-management-actions subject-actions-menu"
                  role="menu"
                >
                  <button type="button" role="menuitem" class="record-link record-link-button subject-students-btn" @click="subjectActionsMenuId = ''; openSubjectStudentsModal(subject)">
                    <i class="fas fa-users-gear"></i>
                    Manage Students
                  </button>
                  <button type="button" role="menuitem" class="record-link record-link-button subject-copy-btn" @click="subjectActionsMenuId = ''; copySubjectCode(subject)">
                    <i class="fas fa-copy"></i>
                    Copy Code
                  </button>
                  <button type="button" role="menuitem" class="record-link record-link-button subject-edit-btn" @click="subjectActionsMenuId = ''; openEditClassModal(subject)">
                    <i class="fas fa-pen"></i>
                    Edit
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    class="record-link record-link-button subject-delete-btn"
                    :title="subject.canDelete ? 'Delete class' : resolveDeleteClassBlockedReason(subject)"
                    @click="subjectActionsMenuId = ''; openDeleteClassModal(subject)"
                  >
                    <i class="fas fa-trash-alt"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
            <p v-if="subject.description" class="subject-management-copy">{{ subject.description }}</p>
            <div class="subject-management-meta">
              <span class="subject-metric-chip"><i class="fas fa-file-lines"></i><strong>{{ subject.lessonCount }}</strong> Lessons</span>
              <span class="subject-metric-chip"><i class="fas fa-clipboard-check"></i><strong>{{ subject.assessmentCount }}</strong> Assessments</span>
              <span class="subject-metric-chip"><i class="fas fa-user-graduate"></i><strong>{{ subject.approvedStudentsCount }}</strong> Students</span>
              <span v-if="subject.pendingRequestsCount > 0" class="subject-metric-chip is-pending"><i class="fas fa-clock"></i><strong>{{ subject.pendingRequestsCount }}</strong> Pending</span>
            </div>
            <p v-if="subject.approvedStudentsCount === 0" class="subject-management-waiting">Waiting for students to join with the class code</p>
          </article>
        </div>
      </section>

      <section class="section-card animated-card dashboard-panel enrollment-requests-section">
        <div class="dashboard-panel-header">
          <div>
            <span class="dashboard-panel-eyebrow">Enrollment queue</span>
            <h3 class="section-title">Pending Requests</h3>
            <p class="class-list-subtitle">Approve class-code requests before students receive access.</p>
          </div>
          <div class="class-list-meta">
            <span class="meta-chip">
              <i class="fas fa-user-clock"></i>
              {{ enrollmentRequests.length }} Pending
            </span>
          </div>
        </div>

        <div v-if="isEnrollmentRequestsLoading" class="dashboard-empty-state request-empty-state">
          <span class="dashboard-empty-icon"><i class="fas fa-spinner fa-spin"></i></span>
          <div><strong>Loading requests</strong><p>Checking the latest enrollment queue...</p></div>
        </div>
        <div v-else-if="enrollmentRequests.length === 0" class="dashboard-empty-state request-empty-state is-success">
          <span class="dashboard-empty-icon"><i class="fas fa-user-check"></i></span>
          <div><strong>You're all caught up</strong><p>New class enrollment requests will appear here.</p></div>
        </div>
        <div v-else class="enrollment-request-list">
          <article v-for="request in paginatedEnrollmentRequests" :key="request.id" class="enrollment-request-card">
            <div class="request-student-row">
              <div class="student-identity">
                <img :src="request.avatar" :alt="request.name" class="student-avatar" />
                <div class="student-details"><strong>{{ request.name }}</strong><small>{{ request.email }}</small></div>
              </div>
              <span class="request-time"><i class="fas fa-clock"></i>{{ formatDateTime(request.requestedAt) }}</span>
            </div>
            <div class="request-class-row">
              <span><i class="fas fa-chalkboard"></i>{{ request.className || request.subjectName }}</span>
              <strong>{{ request.subjectCode }}</strong>
            </div>
            <div class="request-actions">
              <button type="button" class="btn btn-primary btn-sm" :disabled="requestActionId === request.id" @click="updateEnrollmentRequest(request, 'approve')"><i class="fas" :class="requestActionId === request.id ? 'fa-spinner fa-spin' : 'fa-check'"></i>Approve</button>
              <button type="button" class="btn btn-outline btn-sm" :disabled="requestActionId === request.id" @click="updateEnrollmentRequest(request, 'reject')"><i class="fas fa-times"></i>Reject</button>
            </div>
          </article>
        </div>

        <div v-if="enrollmentRequests.length > ENROLLMENT_REQUESTS_PAGE_SIZE" class="class-requests-pagination">
          <p class="class-requests-pagination-copy">{{ enrollmentRequestsPageSummary }}</p>
          <div class="class-requests-pagination-actions">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              :disabled="enrollmentRequestsPage === 1"
              @click="changeEnrollmentRequestsPage(-1)"
            >
              Previous
            </button>
            <span class="class-requests-page-indicator">Page {{ enrollmentRequestsPage }} of {{ enrollmentRequestsTotalPages }}</span>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              :disabled="enrollmentRequestsPage >= enrollmentRequestsTotalPages"
              @click="changeEnrollmentRequestsPage(1)"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      </section>

      <section class="section-card animated-card class-list-section student-list-panel" data-tour="students-classlist-section">
        <div class="student-list-header">
          <div>
            <span class="dashboard-panel-eyebrow">Roster overview</span>
            <h3 class="section-title">Student List</h3>
            <p class="class-list-subtitle">Monitor participation, performance, and strand recommendations.</p>
          </div>
          <div class="class-list-meta">
            <span class="meta-chip">
              <i class="fas fa-users"></i>
              {{ students.length }} Students
            </span>
            <span class="meta-chip">
              <i class="fas fa-chart-line"></i>
              Avg Progress {{ averageProgress }}%
            </span>
          </div>
        </div>

        <div class="student-roster-tabs" role="tablist" aria-label="Student roster type">
          <button
            type="button"
            role="tab"
            class="student-roster-tab"
            :class="{ active: studentRosterView === 'advisory' }"
            :aria-selected="studentRosterView === 'advisory'"
            @click="studentRosterView = 'advisory'"
          >
            <i class="fas fa-layer-group" aria-hidden="true"></i>
            <span>Advisory Class</span>
            <strong>{{ advisoryStudents.length }}</strong>
          </button>
          <button
            type="button"
            role="tab"
            class="student-roster-tab"
            :class="{ active: studentRosterView === 'handled' }"
            :aria-selected="studentRosterView === 'handled'"
            @click="studentRosterView = 'handled'"
          >
            <i class="fas fa-chalkboard-teacher" aria-hidden="true"></i>
            <span>Handled Classes</span>
            <strong>{{ handledClassStudents.length }}</strong>
          </button>
          <p class="student-roster-context">
            <template v-if="studentRosterView === 'advisory'">
              Section {{ teacherAdvisorySectionName || 'Unassigned' }} students enrolled in your classes
            </template>
            <template v-else>Students from other sections enrolled through your class codes</template>
          </p>
        </div>

        <div class="student-list-toolbar" aria-label="Student list tools">
          <label class="student-search-field">
            <i class="fas fa-search"></i>
            <input type="search" placeholder="Search students..." aria-label="Search students" />
          </label>
          <label class="student-toolbar-select"><i class="fas fa-filter"></i><select aria-label="Filter by class"><option>All Classes</option><option v-for="subject in subjects" :key="subject.id">{{ subject.className || subject.name }}</option></select></label>
          <label class="student-toolbar-select"><i class="fas fa-arrow-down-wide-short"></i><select aria-label="Sort students"><option>Sort: Name</option><option>Sort: Progress</option><option>Sort: Average</option><option>Sort: Status</option></select></label>
          <div class="student-toolbar-actions">
            <button type="button" class="toolbar-icon-btn" title="Export roster" aria-label="Export roster" onclick="window.print()"><i class="fas fa-file-export"></i><span>Export</span></button>
            <button type="button" class="toolbar-icon-btn" title="Refresh student list" aria-label="Refresh student list" :disabled="isLoading" @click="fetchStudents"><i class="fas" :class="isLoading ? 'fa-spinner fa-spin' : 'fa-rotate'"></i><span>Refresh</span></button>
          </div>
        </div>

        <div class="class-list-table-wrap">
          <table class="class-list-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Lessons</th>
                <th>Average</th>
                <th>Progress</th>
                <th>strand Recommendation</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody v-if="isLoading">
              <tr>
                <td colspan="7">
                  <div class="table-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading class list...</span>
                  </div>
                </td>
              </tr>
            </tbody>

            <tbody v-else-if="visibleRosterStudents.length === 0">
              <tr>
                <td colspan="7">
                  <div class="table-state">
                    <i class="fas fa-user-graduate"></i>
                    <span>{{ studentRosterView === 'advisory' ? 'No advisory-section students have joined your classes yet' : 'No students from other sections have joined your handled classes yet' }}</span>
                  </div>
                </td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr v-for="student in visibleRosterStudents" :key="student.id">
                <td>
                  <div class="student-identity">
                    <img :src="student.avatar" :alt="student.name" class="student-avatar" />
                    <div class="student-details">
                      <strong>{{ student.name }}</strong>
                      <small>{{ student.sectionName || 'No section' }}</small>
                    </div>
                  </div>
                </td>
                <td class="student-email">{{ student.email }}</td>
                <td>
                  <span class="lessons-pill">{{ student.completedChallenges }}/{{ student.totalChallenges }}</span>
                </td>
                <td>
                  <span class="average-score">{{ student.averageScore }}%</span>
                </td>
                <td>
                  <div class="progress-cell">
                    <span class="progress-label">{{ student.progress }}%</span>
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: student.progress + '%' }"></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="student-recommendation-cell">
                    <strong>{{ student.recommendationName || 'Not generated' }}</strong>
                    <small>
                      {{ student.recommendationConfidence ? `${student.recommendationConfidence} confidence` : 'Awaiting enough attempts' }}
                    </small>
                    <small v-if="student.subjectNames">{{ student.subjectNames }}</small>
                  </div>
                </td>
                <td>
                  <span class="status-pill" :class="`status-${normalizeStatus(student.status)}`" data-tour="students-status-pill">
                    {{ statusLabel(student.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div v-if="isCreateClassModalOpen" class="modal-shell" @click.self="closeCreateClassModal">
        <div class="modal-panel">
          <div class="modal-panel-head">
            <div>
              <h3>Create Class</h3>
              <p>Set up multiple classes under your assigned subject and generate a code students can use to join.</p>
            </div>
            <button type="button" class="modal-close-btn" @click="closeCreateClassModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form class="class-form" @submit.prevent="submitCreateClass">
            <div class="class-form-grid">
              <label class="class-form-group">
                <span>Class Name</span>
                <input v-model.trim="createClassForm.className" type="text" :placeholder="classNamePlaceholder" required>
              </label>
              <label class="class-form-group">
                <span>Subject</span>
                <input :value="teacherSubject || createClassForm.subject" type="text" readonly placeholder="Assigned subject">
              </label>
              <label class="class-form-group class-form-group-full">
                <span>Description</span>
                <textarea v-model.trim="createClassForm.description" rows="4" placeholder="Add a short class description for students"></textarea>
              </label>
            </div>
            <p v-if="createClassMessage" class="class-form-feedback" :class="createClassMessageType">{{ createClassMessage }}</p>
            <div class="modal-panel-actions">
              <button type="button" class="btn btn-outline" @click="closeCreateClassModal">Cancel</button>
              <button
                v-if="hasCreateClassReference"
                type="button"
                class="btn btn-outline"
                @click="resetCreateClassWorkflow"
                :disabled="isCreatingClass"
              >
                Reset Pattern
              </button>
              <button
                v-if="canCreateAnotherClass"
                type="button"
                class="btn btn-outline"
                @click="prepareNextClassFromReference"
                :disabled="isCreatingClass"
              >
                Create Another Class
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isCreatingClass">
                <i class="fas" :class="isCreatingClass ? 'fa-spinner fa-spin' : 'fa-plus-circle'"></i>
                {{ isCreatingClass ? 'Creating...' : 'Create Class' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="isEditClassModalOpen && classPendingEdit" class="modal-shell" @click.self="closeEditClassModal">
        <div class="modal-panel">
          <div class="modal-panel-head">
            <div>
              <h3>Edit Class Name</h3>
              <p>Rename the class while keeping the same class code, joined students, and linked records.</p>
            </div>
            <button type="button" class="modal-close-btn" @click="closeEditClassModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form class="class-form" @submit.prevent="submitEditClass">
            <div class="class-form-grid">
              <label class="class-form-group">
                <span>Class Name</span>
                <input v-model.trim="editClassForm.className" type="text" :placeholder="classNamePlaceholder" required>
              </label>
              <label class="class-form-group">
                <span>Subject</span>
                <input :value="editClassForm.subject || teacherSubject" type="text" readonly placeholder="Assigned subject">
              </label>
            </div>
            <p class="edit-class-helper-copy">The class code stays the same after renaming.</p>
            <p v-if="editClassMessage" class="class-form-feedback" :class="editClassMessageType">{{ editClassMessage }}</p>
            <div class="modal-panel-actions">
              <button type="button" class="btn btn-outline" @click="closeEditClassModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isUpdatingClass">
                <i class="fas" :class="isUpdatingClass ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                {{ isUpdatingClass ? 'Saving...' : 'Save Class Name' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="isStudentInviteModalOpen" class="modal-shell" @click.self="closeStudentInviteModal">
        <div class="modal-panel">
          <div class="modal-panel-head">
            <div>
              <h3><i class="fas fa-user-plus"></i> Create Student Account</h3>
              <p>Create a student account, place the learner in your advisory section, and send a temporary password by email for first-login password reset.</p>
            </div>
            <button type="button" class="modal-close-btn" @click="closeStudentInviteModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form class="class-form" @submit.prevent="submitStudentInvite">
            <div class="class-form-grid">
              <label class="class-form-group">
                <span>Student Name</span>
                <input v-model.trim="studentInviteForm.name" type="text" required placeholder="Enter student name">
              </label>
              <label class="class-form-group">
                <span>Email</span>
                <input v-model.trim="studentInviteForm.email" type="email" required placeholder="Enter student email">
              </label>
              <label class="class-form-group">
                <span>Username</span>
                <input v-model.trim="studentInviteForm.username" type="text" required maxlength="50" placeholder="Enter username">
              </label>
              <label class="class-form-group">
                <span>Contact Number</span>
                <input v-model.trim="studentInviteForm.contactNumber" type="text" placeholder="Optional contact number">
              </label>
              <label class="class-form-group">
                <span>Advisory Section</span>
                <input :value="teacherAdvisorySectionName || 'Not assigned'" type="text" readonly>
                <small class="invite-helper-copy">This creates an advisory student only. The student can join any handled class later with a class code, including classes from another advisory section.</small>
              </label>
            </div>
            <p v-if="studentInviteMessage" class="class-form-feedback" :class="studentInviteMessageType">{{ studentInviteMessage }}</p>
            <div class="modal-panel-actions">
              <button type="button" class="btn btn-outline" @click="closeStudentInviteModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmittingStudentInvite">
                <i class="fas" :class="isSubmittingStudentInvite ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
                {{ isSubmittingStudentInvite ? 'Saving...' : 'Create Student & Email Credentials' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="isSubjectStudentsModalOpen && subjectPendingStudents" class="modal-shell" @click.self="closeSubjectStudentsModal">
        <div class="modal-panel subject-students-modal">
          <div class="modal-panel-head">
            <div>
              <h3>Manage Class Students</h3>
              <p>Review the students currently approved in {{ subjectPendingStudents.className || subjectPendingStudents.name }} and remove them from this class when needed.</p>
            </div>
            <button type="button" class="modal-close-btn" @click="closeSubjectStudentsModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="subject-students-modal-body">
            <div class="subject-students-summary">
              <span class="subject-metric-chip">{{ subjectPendingStudents.name }}</span>
              <span class="subject-metric-chip">{{ subjectPendingStudents.code }}</span>
              <span class="subject-metric-chip">{{ subjectStudents.length }} students</span>
            </div>

            <div v-if="isSubjectStudentsLoading" class="table-state">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading class students...</span>
            </div>

            <div v-else-if="subjectStudents.length === 0" class="table-state">
              <i class="fas fa-user-graduate"></i>
              <span>No approved students are currently in this class.</span>
            </div>

            <div v-else class="subject-students-list">
              <article v-for="student in subjectStudents" :key="student.id" class="subject-student-card">
                <div class="student-identity">
                  <img :src="student.avatar" :alt="student.name" class="student-avatar" />
                  <div class="student-details">
                    <strong>{{ student.name }}</strong>
                    <small>{{ student.sectionName || 'No section' }}</small>
                  </div>
                </div>

                <div class="subject-student-meta">
                  <span>{{ student.email || 'No email address' }}</span>
                  <span>{{ student.gradeLevel || 'Grade not set' }}</span>
                </div>

                <button
                  type="button"
                  class="btn btn-outline btn-sm subject-remove-student-btn"
                  :disabled="removingSubjectStudentId === student.id"
                  @click="removeStudentFromSubject(student)"
                >
                  <i class="fas" :class="removingSubjectStudentId === student.id ? 'fa-spinner fa-spin' : 'fa-user-minus'"></i>
                  {{ removingSubjectStudentId === student.id ? 'Removing...' : 'Remove from Class' }}
                </button>
              </article>
            </div>
          </div>

          <div class="modal-panel-actions">
            <button type="button" class="btn btn-outline" @click="closeSubjectStudentsModal">Close</button>
          </div>
        </div>
      </div>

      <div v-if="isDeleteClassModalOpen && classPendingDeletion" class="modal-shell" @click.self="closeDeleteClassModal">
        <div class="modal-panel delete-class-modal">
          <div class="modal-panel-head">
            <div>
              <h3>{{ canConfirmClassDeletion ? 'Delete Class' : 'Class Cannot Be Deleted Yet' }}</h3>
              <p>
                {{ canConfirmClassDeletion
                  ? 'This permanently removes the class from your handled-class list and disables its class code.'
                  : 'This class still has linked records that need to be cleared before deletion.' }}
              </p>
            </div>
            <button type="button" class="modal-close-btn" @click="closeDeleteClassModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="class-form delete-class-form">
            <div class="delete-class-summary">
              <span class="delete-class-label">Selected Class</span>
              <strong>{{ classPendingDeletion.className || classPendingDeletion.name }}</strong>
              <small>{{ classPendingDeletion.name }} · {{ classPendingDeletion.code }}</small>
            </div>

            <div class="delete-class-metrics">
              <span class="subject-metric-chip">{{ classPendingDeletion.lessonCount }} lessons</span>
              <span class="subject-metric-chip">{{ classPendingDeletion.assessmentCount }} assessments</span>
              <span class="subject-metric-chip">{{ classPendingDeletion.approvedStudentsCount }} students</span>
              <span v-if="classPendingDeletion.pendingRequestsCount > 0" class="subject-metric-chip">{{ classPendingDeletion.pendingRequestsCount }} pending</span>
              <span v-if="classPendingDeletion.attendanceRecordCount > 0" class="subject-metric-chip">{{ classPendingDeletion.attendanceRecordCount }} attendance</span>
            </div>

            <p v-if="canConfirmClassDeletion" class="delete-class-warning">
              Delete this class only when it is empty. Lessons, assessments, students, pending requests, and attendance records must already be cleared.
            </p>
            <p v-else class="class-form-feedback error">{{ deleteClassBlockedReason }}</p>
            <p v-if="deleteClassMessage" class="class-form-feedback" :class="deleteClassMessageType">{{ deleteClassMessage }}</p>

            <div class="modal-panel-actions">
              <button type="button" class="btn btn-outline" @click="closeDeleteClassModal">Close</button>
              <button
                v-if="canConfirmClassDeletion"
                type="button"
                class="btn btn-danger"
                :disabled="isDeletingClass"
                @click="submitDeleteClass"
              >
                <i class="fas" :class="isDeletingClass ? 'fa-spinner fa-spin' : 'fa-trash-alt'"></i>
                {{ isDeletingClass ? 'Deleting...' : 'Delete Class' }}
              </button>
            </div>
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
          :aria-label="`Students tour step ${tourStepIndex + 1} of ${tourSteps.length}`"
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
const isTourActive = ref(false)
const tourStepIndex = ref(0)
const tourTargetRect = ref(null)
const tourTooltipStyle = ref({})
const hasAttemptedAutoTour = ref(false)
const CURRENT_PAGE_ROUTE = '/teacher/students'
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
  strand: '',
  advisorySectionId: '',
  advisorySectionName: '',
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
const subjects = ref([])
const students = ref([])
const enrollmentRequests = ref([])
const subjectActionsMenuId = ref('')
const isCreateClassModalOpen = ref(false)
const isCreatingClass = ref(false)
const isEditClassModalOpen = ref(false)
const isUpdatingClass = ref(false)
const isDeleteClassModalOpen = ref(false)
const isDeletingClass = ref(false)
const isSubjectStudentsModalOpen = ref(false)
const isSubjectStudentsLoading = ref(false)
const isStudentInviteModalOpen = ref(false)
const isSubmittingStudentInvite = ref(false)
const isEnrollmentRequestsLoading = ref(false)
const requestActionId = ref('')
const removingSubjectStudentId = ref('')
const createClassMessage = ref('')
const createClassMessageType = ref('success')
const editClassMessage = ref('')
const editClassMessageType = ref('success')
const deleteClassMessage = ref('')
const deleteClassMessageType = ref('error')
const studentInviteMessage = ref('')
const studentInviteMessageType = ref('success')
const classPendingEdit = ref(null)
const classPendingDeletion = ref(null)
const subjectPendingStudents = ref(null)
const subjectStudents = ref([])
const toast = reactive({
  show: false,
  type: 'success',
  message: ''
})
let toastTimer = null
let teacherAssignmentRefreshTimer = null
let isTeacherAssignmentRefreshInFlight = false
const activitiesMenuOpen = ref(route.path === '/teacher/activities' || route.path.startsWith('/teacher/activities/'))
const recordsMenuOpen = ref(route.path === '/teacher/records' || route.path.startsWith('/teacher/records/'))
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
const createClassForm = reactive({
  className: '',
  subject: '',
  description: '',
})
const editClassForm = reactive({
  id: '',
  className: '',
  subject: '',
})
const createClassReference = reactive({
  subject: '',
  className: '',
  description: '',
  hasReference: false,
})
const studentInviteForm = reactive({
  name: '',
  email: '',
  username: '',
  contactNumber: '',
})
const isLoading = ref(false)
const studentRosterView = ref('advisory')
const tourSteps = [
  {
    key: 'invite-student',
    title: 'Invite Students',
    description: 'Use this action to invite or add new students so they can join your class and start participating in activities.',
    selector: '[data-tour="students-invite-button"]'
  },
  {
    key: 'class-list',
    title: 'Student List',
    description: 'This table shows each student\'s status, progress, performance, and participation across your class activities.',
    selector: '[data-tour="students-classlist-section"]'
  },
  {
    key: 'status-pill',
    title: 'Progress Monitoring',
    description: 'Status indicators help you quickly identify active students, review participation, and spot learners who may need support.',
    selector: '[data-tour="students-status-pill"]'
  }
]
const displayName = computed(() => teacher.displayName || teacher.name || 'Teacher')
const teacherFullName = computed(() => displayName.value)
const teacherRole = computed(() => {
  const role = String(authStore.user?.role || 'teacher').trim().toLowerCase()
  if (!role) return 'Teacher'
  return role.charAt(0).toUpperCase() + role.slice(1)
})
const teacherSubject = computed(() => String(teacher.subject || authStore.user?.subject || '').trim())
const teacherStrand = computed(() => String(teacher.strand || '').trim())
const teacherAdvisorySectionName = computed(() => String(teacher.advisorySectionName || '').trim())
const hasAdvisorySection = computed(() => Boolean(teacherAdvisorySectionName.value))
const teacherStatus = computed(() => String(teacher.status || 'Online').trim() || 'Online')
const teacherAvatarUrl = computed(() => {
  const profileImage = String(authStore.user?.profileImage || '').trim()
  if (profileImage && !profileImage.toLowerCase().includes('ui-avatars.com')) return profileImage
  return ''
})
const classNamePlaceholder = computed(() => `${teacherSubject.value || 'Subject'} 10`)
const hasCreateClassReference = computed(() => createClassReference.hasReference)
const canCreateAnotherClass = computed(() => createClassMessageType.value === 'success' && hasCreateClassReference.value)
const ENROLLMENT_REQUESTS_PAGE_SIZE = 5
const enrollmentRequestsPage = ref(1)
const enrollmentRequestsTotalPages = computed(() => Math.max(1, Math.ceil(enrollmentRequests.value.length / ENROLLMENT_REQUESTS_PAGE_SIZE)))
const paginatedEnrollmentRequests = computed(() => {
  const startIndex = (enrollmentRequestsPage.value - 1) * ENROLLMENT_REQUESTS_PAGE_SIZE
  return enrollmentRequests.value.slice(startIndex, startIndex + ENROLLMENT_REQUESTS_PAGE_SIZE)
})
const enrollmentRequestsPageSummary = computed(() => {
  const total = enrollmentRequests.value.length
  if (total === 0) return 'Showing 0 requests'
  const startIndex = (enrollmentRequestsPage.value - 1) * ENROLLMENT_REQUESTS_PAGE_SIZE
  const start = startIndex + 1
  const end = Math.min(startIndex + ENROLLMENT_REQUESTS_PAGE_SIZE, total)
  return `Showing ${start}-${end} of ${total} requests`
})
const changeEnrollmentRequestsPage = (delta) => {
  const nextPage = enrollmentRequestsPage.value + delta
  enrollmentRequestsPage.value = Math.min(enrollmentRequestsTotalPages.value, Math.max(1, nextPage))
}

const isActiveRoute = (path) => route.path === path || route.path.startsWith(`${path}/`)
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const syncMobileMenuBodyState = () => {
  if (typeof window === 'undefined') return
  const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
  document.body.classList.toggle('teacher-mobile-menu-open', shouldLockBody)
}

const handleEscape = (event) => {
  if (event.key !== 'Escape') return
  if (subjectActionsMenuId.value) {
    subjectActionsMenuId.value = ''
    return
  }
  if (isTourActive.value) {
    skipTour()
    return
  }
  if (isSubjectStudentsModalOpen.value) {
    closeSubjectStudentsModal()
    return
  }
  if (isEditClassModalOpen.value) {
    closeEditClassModal()
    return
  }
  if (isDeleteClassModalOpen.value) {
    closeDeleteClassModal()
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

const toggleSubjectActionsMenu = (subjectId) => {
  const normalizedSubjectId = String(subjectId || '').trim()
  subjectActionsMenuId.value = subjectActionsMenuId.value === normalizedSubjectId ? '' : normalizedSubjectId
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
  subjectActionsMenuId.value = ''
  if (notificationMenuRef.value && target instanceof Node && notificationMenuRef.value.contains(target)) return
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  closeNotificationsPanel()
  isAccountMenuOpen.value = false
}

const averageProgress = computed(() => {
  if (students.value.length === 0) return 0
  const total = students.value.reduce((sum, student) => sum + Number(student.progress || 0), 0)
  return Math.round(total / students.value.length)
})

const normalizeRosterSectionName = (value) => String(value || '').trim().toLowerCase()

const advisoryStudents = computed(() => {
  const advisoryName = normalizeRosterSectionName(teacherAdvisorySectionName.value)
  if (!advisoryName) return []
  return students.value.filter(
    (student) => normalizeRosterSectionName(student.sectionName) === advisoryName
  )
})

const handledClassStudents = computed(() => {
  const advisoryStudentIds = new Set(advisoryStudents.value.map((student) => student.id))
  return students.value.filter((student) => !advisoryStudentIds.has(student.id))
})

const visibleRosterStudents = computed(() => (
  studentRosterView.value === 'advisory'
    ? advisoryStudents.value
    : handledClassStudents.value
))

const normalizeStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (!normalized) return 'inactive'
  return normalized
}

const statusLabel = (status) => {
  const normalized = normalizeStatus(status)
  if (normalized === 'active') return 'Active'
  if (normalized === 'suspended') return 'Suspended'
  if (normalized === 'inactive') return 'Inactive'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

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

const formatCountLabel = (count, singular, plural = `${singular}s`) => {
  const normalizedCount = Number(count || 0)
  return `${normalizedCount} ${normalizedCount === 1 ? singular : plural}`
}

const joinWithAnd = (items) => {
  const normalizedItems = (Array.isArray(items) ? items : []).filter(Boolean)
  if (normalizedItems.length === 0) return ''
  if (normalizedItems.length === 1) return normalizedItems[0]
  if (normalizedItems.length === 2) return `${normalizedItems[0]} and ${normalizedItems[1]}`
  return `${normalizedItems.slice(0, -1).join(', ')}, and ${normalizedItems[normalizedItems.length - 1]}`
}

const getDeleteClassBlockers = (subject) => {
  const blockers = []
  if (Number(subject?.lessonCount || 0) > 0) blockers.push(formatCountLabel(subject?.lessonCount, 'lesson'))
  if (Number(subject?.assessmentCount || 0) > 0) blockers.push(formatCountLabel(subject?.assessmentCount, 'assessment'))
  if (Number(subject?.approvedStudentsCount || 0) > 0) blockers.push(formatCountLabel(subject?.approvedStudentsCount, 'approved student'))
  if (Number(subject?.pendingRequestsCount || 0) > 0) blockers.push(formatCountLabel(subject?.pendingRequestsCount, 'pending request'))
  if (Number(subject?.attendanceRecordCount || 0) > 0) blockers.push(formatCountLabel(subject?.attendanceRecordCount, 'attendance record'))
  return blockers
}

const resolveDeleteClassBlockedReason = (subject) => {
  const apiReason = String(subject?.deleteBlockedReason || '').trim()
  if (apiReason) return apiReason
  const blockers = getDeleteClassBlockers(subject)
  return blockers.length > 0
    ? `This class cannot be deleted because it still has ${joinWithAnd(blockers)}.`
    : ''
}

const deleteClassBlockers = computed(() => getDeleteClassBlockers(classPendingDeletion.value))
const deleteClassBlockedReason = computed(() => resolveDeleteClassBlockedReason(classPendingDeletion.value))
const canConfirmClassDeletion = computed(() => Boolean(classPendingDeletion.value?.id) && deleteClassBlockers.value.length === 0)

const formatDateTime = (value) => {
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
}

const fetchTeacherSections = async () => {
  const previousSectionId = String(teacher.advisorySectionId || '').trim()
  const previousSectionName = String(teacher.advisorySectionName || '').trim()
  try {
    if (!authStore.token) {
      teacher.advisorySectionId = ''
      teacher.advisorySectionName = ''
      return previousSectionId !== '' || previousSectionName !== ''
    }

    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/sections`, getAuthConfig())
    teacher.advisorySectionId = String(response.data?.advisorySection?.id || '').trim()
    teacher.advisorySectionName = String(response.data?.advisorySection?.name || '').trim()
    authStore.setUser({
      advisorySectionId: teacher.advisorySectionId,
      advisorySection: teacher.advisorySectionId
        ? {
          id: teacher.advisorySectionId,
          name: teacher.advisorySectionName,
        }
        : null,
    })
    return previousSectionId !== teacher.advisorySectionId
      || previousSectionName !== teacher.advisorySectionName
  } catch (error) {
    console.error('Failed to fetch teacher sections:', error)
    const authUser = authStore.user || {}
    teacher.advisorySectionId = String(authUser.advisorySectionId || teacher.advisorySectionId || '').trim()
    teacher.advisorySectionName = String(authUser.advisorySection?.name || teacher.advisorySectionName || '').trim()
    return false
  }
}

const fetchSubjects = async () => {
  try {
    if (!authStore.token) {
      subjects.value = []
      return
    }

    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/subjects`, getAuthConfig())
    const payload = uniqueBy(
      Array.isArray(response.data?.subjects) ? response.data.subjects : [],
      (subject, index) => subject.id || subject._id || `${subject.name || ''}-${index}`
    )

    subjects.value = payload.map((subject, index) => ({
      id: subject.id || subject._id || `subject-${index + 1}`,
      name: subject.name || 'Subject',
      className: subject.className || '',
      code: subject.code || '',
      track: subject.track || '',
      description: subject.description || '',
      lessonCount: Number(subject.lessonCount || 0),
      assessmentCount: Number(subject.assessmentCount || 0),
      approvedStudentsCount: Number(subject.approvedStudentsCount || 0),
      pendingRequestsCount: Number(subject.pendingRequestsCount || 0),
      attendanceRecordCount: Number(subject.attendanceRecordCount || 0),
      canDelete: subject.canDelete !== false,
      deleteBlockedReason: String(subject.deleteBlockedReason || '').trim(),
    }))
  } catch (error) {
    console.error('Failed to fetch subjects:', error)
    subjects.value = []
  }
}

const fetchStudents = async () => {
  isLoading.value = true
  try {
    if (!authStore.token) {
      students.value = []
      return
    }

    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/students`, getAuthConfig())

    const payload = uniqueBy(
      Array.isArray(response.data?.students) ? response.data.students : [],
      (student, index) => student.id || student._id || `${student.email || ''}-${index}`
    )

    students.value = payload
        .map((student, index) => ({
          id: student.id || student._id || `student-${index + 1}`,
          name: student.name || 'Unknown Student',
          email: student.email || 'N/A',
          gradeLevel: student.gradeLevel || '',
          sectionId: student.sectionId || '',
          sectionName: student.sectionName || '',
          completedChallenges: Number(student.completedChallenges || 0),
          totalChallenges: Number(student.totalChallenges || 0),
          progress: Number(student.progress || 0),
          averageScore: Number(student.averageScore || 0),
          status: student.status || 'active',
          enrollmentStatus: student.enrollmentStatus || 'approved',
          requestedAt: student.requestedAt || null,
          approvedAt: student.approvedAt || null,
          enrollmentTrack: student.enrollmentTrack || '',
          subjectNames: Array.isArray(student.subjects) ? student.subjects.map((subject) => subject.className || subject.name).filter(Boolean).join(', ') : '',
          recommendationName: String(student?.recommendation?.recommendedStrand?.name || '').trim(),
          recommendationConfidence: String(student?.recommendation?.recommendedStrand?.confidence || '').trim(),
          recommendationExplanation: String(student?.recommendation?.recommendationExplanation || '').trim(),
          recommendationUpdatedAt: student?.recommendation?.updatedAt || null,
          avatar: student.avatar || student.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=334155&color=fff`
        }))
  } catch (error) {
    console.error('Failed to fetch students:', error)
    students.value = []
  } finally {
    isLoading.value = false
  }
}

const fetchSubjectStudents = async (subjectId = '') => {
  const normalizedSubjectId = String(subjectId || subjectPendingStudents.value?.id || '').trim()
  if (!normalizedSubjectId) {
    subjectStudents.value = []
    return
  }

  isSubjectStudentsLoading.value = true
  try {
    const response = await axios.get(
      `${resolveApiBaseUrl()}/teacher/subjects/${encodeURIComponent(normalizedSubjectId)}/students`,
      getAuthConfig()
    )
    const payload = uniqueBy(
      Array.isArray(response.data?.students) ? response.data.students : [],
      (student, index) => student.id || student._id || `${student.email || ''}-${index}`
    )

    subjectStudents.value = payload.map((student, index) => ({
      id: student.id || student._id || `subject-student-${index + 1}`,
      name: student.name || 'Student',
      email: student.email || '',
      sectionName: student.sectionName || '',
      gradeLevel: student.gradeLevel || '',
      avatar: student.avatar || student.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=334155&color=fff`,
    }))
  } catch (error) {
    console.error('Failed to fetch subject students:', error)
    subjectStudents.value = []
    showToast('error', error.response?.data?.message || 'Failed to load class students.')
  } finally {
    isSubjectStudentsLoading.value = false
  }
}

const fetchEnrollmentRequests = async () => {
  isEnrollmentRequestsLoading.value = true
  try {
    if (!authStore.token) {
      enrollmentRequests.value = []
      return
    }

    const response = await axios.get(`${resolveApiBaseUrl()}/teacher/enrollment-requests`, getAuthConfig())

    const payload = uniqueBy(
      Array.isArray(response.data?.requests) ? response.data.requests : [],
      (request, index) => request.id || `${request.studentId || ''}-${index}`
    )

    enrollmentRequests.value = payload.map((request, index) => ({
      id: request.id || `request-${index + 1}`,
      studentId: request.studentId || '',
      name: request.name || 'Student',
      email: request.email || '',
      requestedAt: request.requestedAt || null,
      subjectId: request.subjectId || '',
      subjectName: request.subjectName || '',
      className: request.className || '',
      subjectCode: request.subjectCode || '',
      sectionId: request.sectionId || '',
      sectionName: request.sectionName || '',
      avatar: request.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name || 'Student')}&background=334155&color=fff`,
    }))
  } catch (error) {
    console.error('Failed to fetch enrollment requests:', error)
    enrollmentRequests.value = []
  } finally {
    isEnrollmentRequestsLoading.value = false
  }
}

const updateEnrollmentRequest = async (request, action) => {
  const requestId = String(request?.id || '').trim()
  if (!requestId) return

  requestActionId.value = requestId
  try {
    const actionPath = action === 'reject' ? 'reject' : 'accept'
    await axios.patch(`${resolveApiBaseUrl()}/teacher/enrollment-requests/${requestId}/${actionPath}`, {}, getAuthConfig())
    showToast('success', action === 'reject' ? 'Enrollment request rejected.' : 'Enrollment request approved.')
    await Promise.all([fetchEnrollmentRequests(), fetchSubjects(), fetchStudents()])
  } catch (error) {
    console.error(`Failed to ${action} enrollment request:`, error)
    showToast('error', error.response?.data?.message || 'Failed to update enrollment request.')
  } finally {
    requestActionId.value = ''
  }
}

const buildDefaultClassName = () => {
  const subject = String(teacherSubject.value || '').trim()
  if (!subject) return ''
  return `${subject} 10`
}

const applyCreateClassReference = () => {
  createClassForm.subject = teacherSubject.value || ''
  if (createClassReference.hasReference) {
    createClassForm.className = createClassReference.className || buildDefaultClassName()
    createClassForm.description = createClassReference.description || ''
    return
  }

  createClassForm.className = buildDefaultClassName()
  createClassForm.description = ''
}

const resetCreateClassForm = ({ preserveWorkflow = false } = {}) => {
  if (!preserveWorkflow) {
    createClassReference.subject = ''
    createClassReference.className = ''
    createClassReference.description = ''
    createClassReference.hasReference = false
  }

  applyCreateClassReference()
  createClassForm.subject = teacherSubject.value || ''
  createClassMessage.value = ''
  createClassMessageType.value = 'success'
}

const prepareNextClassFromReference = () => {
  resetCreateClassForm({ preserveWorkflow: true })
}

const resetCreateClassWorkflow = () => {
  resetCreateClassForm({ preserveWorkflow: false })
}

const openCreateClassModal = () => {
  resetCreateClassForm({ preserveWorkflow: hasCreateClassReference.value })
  isCreateClassModalOpen.value = true
}

const closeCreateClassModal = () => {
  if (isCreatingClass.value) return
  isCreateClassModalOpen.value = false
  resetCreateClassForm({ preserveWorkflow: false })
}

const resetEditClassForm = () => {
  editClassForm.id = ''
  editClassForm.className = ''
  editClassForm.subject = teacherSubject.value || ''
  editClassMessage.value = ''
  editClassMessageType.value = 'success'
}

const openEditClassModal = (subject) => {
  classPendingEdit.value = subject ? { ...subject } : null
  editClassForm.id = String(subject?.id || '').trim()
  editClassForm.className = String(subject?.className || subject?.name || '').trim()
  editClassForm.subject = String(subject?.name || teacherSubject.value || '').trim()
  editClassMessage.value = ''
  editClassMessageType.value = 'success'
  isEditClassModalOpen.value = Boolean(editClassForm.id)
}

const closeEditClassModal = ({ force = false } = {}) => {
  if (isUpdatingClass.value && !force) return
  isEditClassModalOpen.value = false
  classPendingEdit.value = null
  resetEditClassForm()
}

const openDeleteClassModal = (subject) => {
  classPendingDeletion.value = subject
    ? {
      ...subject,
      lessonCount: Number(subject.lessonCount || 0),
      assessmentCount: Number(subject.assessmentCount || 0),
      approvedStudentsCount: Number(subject.approvedStudentsCount || 0),
      pendingRequestsCount: Number(subject.pendingRequestsCount || 0),
      attendanceRecordCount: Number(subject.attendanceRecordCount || 0),
    }
    : null
  deleteClassMessage.value = ''
  deleteClassMessageType.value = 'error'
  isDeleteClassModalOpen.value = Boolean(classPendingDeletion.value)
}

const closeDeleteClassModal = ({ force = false } = {}) => {
  if (isDeletingClass.value && !force) return
  isDeleteClassModalOpen.value = false
  classPendingDeletion.value = null
  deleteClassMessage.value = ''
  deleteClassMessageType.value = 'error'
}

const openSubjectStudentsModal = async (subject) => {
  subjectPendingStudents.value = subject ? { ...subject } : null
  subjectStudents.value = []
  isSubjectStudentsModalOpen.value = Boolean(subjectPendingStudents.value?.id)
  if (!subjectPendingStudents.value?.id) return
  await fetchSubjectStudents(subjectPendingStudents.value.id)
}

const closeSubjectStudentsModal = () => {
  isSubjectStudentsModalOpen.value = false
  subjectPendingStudents.value = null
  subjectStudents.value = []
  isSubjectStudentsLoading.value = false
  removingSubjectStudentId.value = ''
}

const removeStudentFromSubject = async (student) => {
  const subjectId = String(subjectPendingStudents.value?.id || '').trim()
  const studentId = String(student?.id || '').trim()
  if (!subjectId || !studentId) return

  const classLabel = String(subjectPendingStudents.value?.className || subjectPendingStudents.value?.name || 'this class').trim()
  const studentLabel = String(student?.name || 'this student').trim()
  if (typeof window !== 'undefined') {
    const confirmed = window.confirm(`Remove ${studentLabel} from ${classLabel}?`)
    if (!confirmed) return
  }

  removingSubjectStudentId.value = studentId
  try {
    await axios.delete(
      `${resolveApiBaseUrl()}/teacher/subjects/${encodeURIComponent(subjectId)}/students/${encodeURIComponent(studentId)}`,
      getAuthConfig()
    )
    showToast('success', `${studentLabel} was removed from ${classLabel}.`)
    await Promise.all([fetchSubjects(), fetchStudents()])
    subjectPendingStudents.value = subjects.value.find((subject) => subject.id === subjectId) || subjectPendingStudents.value
    await fetchSubjectStudents(subjectId)
  } catch (error) {
    console.error('Failed to remove student from class:', error)
    showToast('error', error.response?.data?.message || 'Failed to remove the student from this class.')
  } finally {
    removingSubjectStudentId.value = ''
  }
}

const resetStudentInviteForm = () => {
  studentInviteForm.name = ''
  studentInviteForm.email = ''
  studentInviteForm.username = ''
  studentInviteForm.contactNumber = ''
  studentInviteMessage.value = ''
  studentInviteMessageType.value = 'success'
}

const openStudentInviteModal = () => {
  if (!hasAdvisorySection.value) {
    showToast('error', 'Assign an advisory section first. Student accounts created here belong to your advisory section.')
    return
  }
  resetStudentInviteForm()
  isStudentInviteModalOpen.value = true
}

const closeStudentInviteModal = () => {
  if (isSubmittingStudentInvite.value) return
  isStudentInviteModalOpen.value = false
}

const submitStudentInvite = async () => {
  isSubmittingStudentInvite.value = true
  studentInviteMessage.value = ''
  try {
    const normalizedUsername = String(studentInviteForm.username || '').trim()
    if (!hasAdvisorySection.value) {
      studentInviteMessage.value = 'Assign an advisory section before creating student accounts.'
      studentInviteMessageType.value = 'error'
      return
    }
    if (!normalizedUsername) {
      studentInviteMessage.value = 'Username is required.'
      studentInviteMessageType.value = 'error'
      return
    }

    const response = await axios.post(`${resolveApiBaseUrl()}/teacher/students`, {
      name: studentInviteForm.name,
      email: studentInviteForm.email,
      username: normalizedUsername,
      contactNumber: studentInviteForm.contactNumber,
    }, getAuthConfig())

    const generatedPassword = String(response.data?.invite?.generatedPassword || '').trim()
    const emailSent = response.data?.invite?.emailSent !== false
    studentInviteMessage.value = generatedPassword
      ? `${emailSent ? 'Student account created and credentials emailed successfully.' : 'Student account created, but email sending failed.'} Advisory section: ${teacherAdvisorySectionName.value || 'Assigned section'}. The student can join handled classes later with a class code. Temporary password: ${generatedPassword}`
      : 'Student account created successfully.'
    studentInviteMessageType.value = emailSent ? 'success' : 'error'
    await fetchStudents()
    window.setTimeout(() => {
      isStudentInviteModalOpen.value = false
    }, 400)
  } catch (error) {
    studentInviteMessage.value = error.response?.data?.message || 'Failed to create the student account.'
    studentInviteMessageType.value = 'error'
  } finally {
    isSubmittingStudentInvite.value = false
  }
}

const submitEditClass = async () => {
  const subjectId = String(editClassForm.id || '').trim()
  const className = String(editClassForm.className || '').trim()
  const subject = String(editClassForm.subject || teacherSubject.value || '').trim()

  if (!subjectId || !classPendingEdit.value) return

  if (!className || !subject) {
    editClassMessage.value = 'Class name and subject are required.'
    editClassMessageType.value = 'error'
    return
  }

  if (!className.toLowerCase().startsWith(subject.toLowerCase())) {
    editClassMessage.value = `Class name must start with the assigned subject: ${subject}.`
    editClassMessageType.value = 'error'
    return
  }

  isUpdatingClass.value = true
  editClassMessage.value = ''
  editClassMessageType.value = 'success'
  try {
    await axios.patch(`${resolveApiBaseUrl()}/teacher/subjects/${encodeURIComponent(subjectId)}`, {
      className,
    }, getAuthConfig())
    closeEditClassModal({ force: true })
    showToast('success', 'Class name updated successfully.')
    await Promise.all([fetchSubjects(), fetchStudents(), fetchEnrollmentRequests()])
  } catch (error) {
    editClassMessage.value = error.response?.data?.message || 'Failed to update class name.'
    editClassMessageType.value = 'error'
  } finally {
    isUpdatingClass.value = false
  }
}

const submitCreateClass = async () => {
  const className = String(createClassForm.className || '').trim()
  const subject = String(createClassForm.subject || teacherSubject.value || '').trim()
  const description = String(createClassForm.description || '').trim()

  if (!className || !subject) {
    createClassMessage.value = 'Class name and subject are required.'
    createClassMessageType.value = 'error'
    return
  }

  if (!className.toLowerCase().startsWith(subject.toLowerCase())) {
    createClassMessage.value = `Class name must start with the assigned subject: ${subject}.`
    createClassMessageType.value = 'error'
    return
  }

  isCreatingClass.value = true
  createClassMessage.value = ''
  try {
    await axios.post(`${resolveApiBaseUrl()}/teacher/subjects`, {
      className,
      subject,
      description,
    }, getAuthConfig())
    createClassReference.subject = subject
    createClassReference.className = className
    createClassReference.description = description
    createClassReference.hasReference = true
    createClassMessage.value = 'Class created successfully. You can create another class using the same pattern.'
    createClassMessageType.value = 'success'
    await Promise.all([fetchSubjects(), fetchStudents()])
  } catch (error) {
    createClassMessage.value = error.response?.data?.message || 'Failed to create class.'
    createClassMessageType.value = 'error'
  } finally {
    isCreatingClass.value = false
  }
}

const submitDeleteClass = async () => {
  const subjectId = String(classPendingDeletion.value?.id || '').trim()
  if (!subjectId) return
  if (!canConfirmClassDeletion.value) {
    deleteClassMessage.value = deleteClassBlockedReason.value || 'This class cannot be deleted yet.'
    deleteClassMessageType.value = 'error'
    return
  }

  isDeletingClass.value = true
  deleteClassMessage.value = ''
  deleteClassMessageType.value = 'error'
  try {
    await axios.delete(`${resolveApiBaseUrl()}/teacher/subjects/${encodeURIComponent(subjectId)}`, getAuthConfig())
    closeDeleteClassModal({ force: true })
    showToast('success', 'Class deleted successfully.')
    await Promise.all([fetchSubjects(), fetchStudents(), fetchEnrollmentRequests()])
  } catch (error) {
    deleteClassMessage.value = error.response?.data?.message || 'Failed to delete class.'
    deleteClassMessageType.value = 'error'
  } finally {
    isDeletingClass.value = false
  }
}

const copySubjectCode = async (subject) => {
  const code = String(subject?.code || '').trim()
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    showToast('success', 'Copied code successfully!')
  } catch (error) {
    console.error('Failed to copy subject code:', error)
    showToast('error', 'Failed to copy code.')
  }
}

const showToast = (type, message) => {
  if (toastTimer) window.clearTimeout(toastTimer)
  toast.type = String(type || 'success')
  toast.message = String(message || '').trim()
  toast.show = true
  toastTimer = window.setTimeout(() => {
    toast.show = false
  }, 2600)
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
  try { localStorage.setItem(getProgressStorageKey(), JSON.stringify(progress)) } catch (_error) {}
}
const clearTourProgress = () => {
  try { localStorage.removeItem(getProgressStorageKey()) } catch (_error) {}
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
    tourTooltipStyle.value = { width: `${Math.min(maxTooltipWidth, availableWidth)}px`, left: `${safeViewportLeft}px`, top: '50%', transform: 'translateY(-50%)' }
    return
  }
  const rect = target.getBoundingClientRect()
  const padding = 10
  const isHeaderTarget = Boolean(target.closest('.top-header'))
  const minTargetTop = isHeaderTarget ? 12 : viewportTopPadding
  const minTargetLeft = target.closest('.teacher-sidebar') ? 8 : safeViewportLeft
  const paddedRect = {
    top: clamp(rect.top - padding, minTargetTop, window.innerHeight - viewportBottomPadding),
    left: clamp(rect.left - padding, minTargetLeft, window.innerWidth - viewportRightPadding),
    width: clamp(rect.width + padding * 2, 0, window.innerWidth - minTargetLeft - viewportRightPadding),
    height: clamp(rect.height + padding * 2, 0, window.innerHeight - minTargetTop - viewportBottomPadding)
  }
  tourTargetRect.value = paddedRect
  const tooltipElement = document.querySelector('.teacher-page-tour-tooltip')
  const tooltipWidth = Math.min(maxTooltipWidth, availableWidth)
  const estimatedTooltipHeight = Math.max(220, Number(tooltipElement?.offsetHeight || 0) || 260)
  let tooltipTop = paddedRect.top + paddedRect.height + 16
  if (tooltipTop + estimatedTooltipHeight > window.innerHeight - viewportBottomPadding) tooltipTop = paddedRect.top - estimatedTooltipHeight - 16
  tooltipTop = clamp(tooltipTop, viewportTopPadding, Math.max(viewportTopPadding, window.innerHeight - estimatedTooltipHeight - viewportBottomPadding))
  let tooltipLeft = paddedRect.left + (paddedRect.width / 2) - (tooltipWidth / 2)
  tooltipLeft = clamp(tooltipLeft, safeViewportLeft, Math.max(safeViewportLeft, window.innerWidth - tooltipWidth - viewportRightPadding))
  tourTooltipStyle.value = { width: `${tooltipWidth}px`, left: `${tooltipLeft}px`, top: `${tooltipTop}px`, transform: 'none' }
}
const tourSpotlightStyle = computed(() => {
  if (!tourTargetRect.value) return null
  return { top: `${tourTargetRect.value.top}px`, left: `${tourTargetRect.value.left}px`, width: `${tourTargetRect.value.width}px`, height: `${tourTargetRect.value.height}px` }
})
const renderCurrentTourStep = async () => {
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
    return closeTour({ markSeen: true })
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
const skipTour = () => { closeTour({ markSeen: true }) }
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

const refreshTeacherAssignmentState = async () => {
  if (!authStore.token || isTeacherAssignmentRefreshInFlight) return

  isTeacherAssignmentRefreshInFlight = true
  try {
    const hasAssignmentChanged = await fetchTeacherSections()
    if (hasAssignmentChanged) {
      await fetchStudents()
    }
  } catch (error) {
    console.error('Failed to refresh teacher assignment state:', error)
  } finally {
    isTeacherAssignmentRefreshInFlight = false
  }
}

const handleWindowFocus = () => {
  refreshTeacherAssignmentState()
}

const handleVisibilityChange = () => {
  if (document.visibilityState !== 'visible') return
  refreshTeacherAssignmentState()
}

const startTeacherAssignmentRefreshLoop = () => {
  if (typeof window === 'undefined' || teacherAssignmentRefreshTimer) return
  teacherAssignmentRefreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'hidden') return
    refreshTeacherAssignmentState()
  }, ADVISORY_SECTION_REFRESH_MS)
}

const stopTeacherAssignmentRefreshLoop = () => {
  if (!teacherAssignmentRefreshTimer || typeof window === 'undefined') return
  window.clearInterval(teacherAssignmentRefreshTimer)
  teacherAssignmentRefreshTimer = null
}

watch(
  () => isSidebarOpen.value,
  () => {
    syncMobileMenuBodyState()
  }
)

watch(
  () => teacherSubject.value,
  (value) => {
    createClassForm.subject = value || ''
    if (!createClassReference.hasReference) {
      createClassForm.className = buildDefaultClassName()
    }
  },
  { immediate: true }
)

watch(
  () => enrollmentRequests.value.length,
  () => {
    if (enrollmentRequests.value.length === 0) {
      enrollmentRequestsPage.value = 1
      return
    }
    if (enrollmentRequestsPage.value > enrollmentRequestsTotalPages.value) {
      enrollmentRequestsPage.value = enrollmentRequestsTotalPages.value
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('click', handleAccountMenuClickOutside)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('resize', handleTourViewportChange)
  window.addEventListener('scroll', handleTourViewportChange, true)
  window.addEventListener('resize', syncMobileMenuBodyState)
  window.addEventListener('focus', handleWindowFocus)

  const authUser = authStore.user || {}
  teacher.name = authUser.name || authUser.username || 'Teacher'
  teacher.displayName = authUser.name || authUser.displayName || authUser.username || 'Teacher'
  teacher.subject = authUser.subject || authUser.profile?.subject || ''
  teacher.strand = authUser.strand || authUser.profile?.strand || ''
  teacher.advisorySectionId = authUser.advisorySectionId || ''
  teacher.advisorySectionName = authUser.advisorySection?.name || ''
  teacher.status = authUser.status || 'Online'
  teacher.email = authUser.email || ''

  fetchTeacherSections()
  fetchSubjects()
  fetchStudents()
  fetchEnrollmentRequests()
  maybeAutoStartTour()
  syncMobileMenuBodyState()
  startTeacherAssignmentRefreshLoop()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.removeEventListener('click', handleAccountMenuClickOutside)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('resize', handleTourViewportChange)
  window.removeEventListener('scroll', handleTourViewportChange, true)
  window.removeEventListener('resize', syncMobileMenuBodyState)
  window.removeEventListener('focus', handleWindowFocus)
  stopTeacherAssignmentRefreshLoop()
  if (toastTimer) {
    window.clearTimeout(toastTimer)
    toastTimer = null
  }
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
}

.students-toast {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 1rem 0 1.25rem;
  padding: 0.85rem 1rem;
  border-radius: 16px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.students-toast i {
  font-size: 1rem;
}

.students-toast span {
  font-size: 0.92rem;
  font-weight: 700;
}

.students-toast.toast-success {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.students-toast.toast-error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.teacher-advisory-card {
  margin-bottom: 1rem;
  border-color: #c7d2fe;
  background: linear-gradient(135deg, #ffffff 0%, #eef2ff 100%);
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

.teacher-main {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.teacher-main::-webkit-scrollbar {
  width: 6px;
}

.teacher-main::-webkit-scrollbar-track {
  background: transparent;
}

.teacher-main::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.teacher-main::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.class-list-section {
  padding: 1.25rem;
}

.class-list-section[data-tour="students-subjects-section"] {
  margin-bottom: 1.5rem;
}

.enrollment-requests-section {
  margin-bottom: 1rem;
}

.subject-management-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.subject-management-card {
  position: relative;
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  padding: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
}

.subject-management-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.subject-management-title-block {
  display: grid;
  gap: 0.22rem;
}

.subject-management-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
}

.subject-management-head h4 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
}

.subject-management-head p {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
}

.subject-management-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.42rem 0.72rem;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.subject-management-actions {
  margin-top: 0.85rem;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.subject-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0.5rem 0.78rem;
  border: 1px solid #dbe4ef;
  background: #ffffff;
  color: #0f172a;
  font-weight: 700;
}

.subject-students-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0.5rem 0.78rem;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
  font-weight: 700;
}

.subject-students-btn:hover {
  border-color: #86efac;
  background: #dcfce7;
}

.subject-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0.5rem 0.78rem;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
}

.subject-edit-btn:hover {
  border-color: #93c5fd;
  background: #dbeafe;
}

.subject-delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  padding: 0.5rem 0.78rem;
  border: 1px solid rgba(239, 68, 68, 0.28);
  background: #fff1f2;
  color: #b91c1c;
  font-weight: 700;
}

.subject-delete-btn:hover {
  border-color: rgba(220, 38, 38, 0.4);
  background: #ffe4e6;
}

.subject-management-copy {
  margin: 0.8rem 0 0;
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.45;
}

.subject-management-meta {
  margin-top: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  color: #334155;
  font-size: 0.82rem;
}

.subject-metric-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.34rem 0.6rem;
  border-radius: 999px;
  background: #eef4ff;
  color: #1e3a8a;
  font-weight: 700;
}

.subject-management-waiting {
  margin: 0.8rem 0 0;
  color: #0f766e;
  font-size: 0.82rem;
  font-weight: 600;
}

.class-management-header {
  padding: 0.2rem 0 0.15rem;
}

.class-management-header-copy {
  display: grid;
  gap: 0.2rem;
}

.class-management-controls {
  align-items: center;
}

.create-class-btn {
  padding-inline: 0.95rem;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.16);
}

.class-list-header {
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.class-list-subtitle {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.class-list-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.results-controls {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #334155;
  font-weight: 600;
  font-size: 0.78rem;
}

.class-list-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.class-list-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.class-list-table-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.class-list-table-wrap::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}

.class-list-table-wrap::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.class-list-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 940px;
}

.modal-shell {
  position: fixed;
  inset: 0;
  z-index: 11000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.56);
}

.modal-panel {
  width: min(100%, 640px);
  border-radius: 18px;
  border: 1px solid #dbe2ea;
  background: #ffffff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
  overflow: hidden;
}

.modal-panel-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-panel-head h3 {
  margin: 0;
  color: #0f172a;
}

.modal-panel-head p {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.92rem;
}

.subject-students-modal {
  width: min(100%, 760px);
}

.subject-students-modal-body {
  padding: 1.1rem 1.25rem 0;
}

.subject-students-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-bottom: 1rem;
}

.subject-students-list {
  display: grid;
  gap: 0.85rem;
}

.subject-student-card {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

.subject-student-meta {
  display: grid;
  gap: 0.2rem;
  color: #475569;
  font-size: 0.82rem;
}

button.subject-remove-student-btn.btn-outline {
  border-color: #dc2626 !important;
  color: #ffffff !important;
  background: #dc2626 !important;
  box-shadow: 0 8px 18px rgba(220, 38, 38, 0.2);
  transition: transform 0.16s ease, background-color 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

button.subject-remove-student-btn.btn-outline i[class*="fa-"] {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

button.subject-remove-student-btn.btn-outline:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #b91c1c !important;
  background: #b91c1c !important;
  color: #ffffff !important;
  box-shadow: 0 11px 22px rgba(185, 28, 28, 0.28);
}

.modal-close-btn {
  border: 0;
  background: transparent;
  color: #475569;
  font-size: 1rem;
  cursor: pointer;
}

.class-form {
  padding: 1.2rem 1.25rem 1.25rem;
}

.class-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.class-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.38rem;
  color: #334155;
  font-size: 0.86rem;
  font-weight: 600;
}

.class-form-group input,
.class-form-group select,
.class-form-group textarea {
  width: 100%;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  padding: 0.78rem 0.9rem;
  background: #ffffff;
  color: #0f172a;
  font: inherit;
}

.class-form-group input[readonly] {
  background: #f8fafc;
  color: #64748b;
}

.expiry-option-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
}

.invite-class-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.invite-class-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.invite-class-card:hover {
  transform: translateY(-1px);
  border-color: #94a3b8;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.invite-class-card.active {
  border-color: #2563eb;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%);
  box-shadow: 0 16px 28px rgba(37, 99, 235, 0.14);
}

.invite-class-title {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 700;
}

.invite-class-meta {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  font-size: 0.73rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.invite-class-copy {
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.35;
}

.invite-helper-copy {
  display: block;
  margin-top: 0.65rem;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
}

.edit-class-helper-copy {
  margin: 0.9rem 0 0;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
}

.expiry-option-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.22rem;
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.expiry-option-card:hover {
  transform: translateY(-1px);
  border-color: #94a3b8;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.expiry-option-card.active {
  border-color: #0f766e;
  background: linear-gradient(180deg, #ecfeff 0%, #f0fdfa 100%);
  box-shadow: 0 14px 26px rgba(15, 118, 110, 0.14);
}

.expiry-option-title {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 700;
}

.expiry-option-copy {
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.35;
}

.class-form-group-full {
  grid-column: 1 / -1;
}

.class-form-feedback {
  margin: 1rem 0 0;
  font-size: 0.84rem;
  font-weight: 600;
}

.class-form-feedback.success {
  color: #15803d;
}

.class-form-feedback.error {
  color: #b91c1c;
}

.modal-panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1rem;
}

.delete-class-modal {
  width: min(100%, 560px);
}

.delete-class-form {
  display: grid;
  gap: 1rem;
}

.delete-class-summary {
  display: grid;
  gap: 0.22rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.delete-class-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.delete-class-summary strong {
  color: #0f172a;
  font-size: 1rem;
}

.delete-class-summary small {
  color: #64748b;
  font-size: 0.82rem;
}

.delete-class-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.delete-class-warning {
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 14px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.84rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .class-form-grid {
    grid-template-columns: 1fr;
  }

  .expiry-option-grid {
    grid-template-columns: 1fr;
  }

  .invite-class-grid {
    grid-template-columns: 1fr;
  }

  .modal-panel {
    width: 100%;
  }

  .subject-student-card {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .modal-panel-actions {
    flex-direction: column-reverse;
  }
}

.class-list-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f8fafc;
  color: #475569;
  text-align: left;
  padding: 0.9rem 1rem;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.class-list-table tbody td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #eef2f7;
  vertical-align: middle;
}

.class-list-table tbody tr:last-child td {
  border-bottom: none;
}

.class-list-table tbody tr:hover td {
  background: #f8fafc;
}

.student-identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.student-details strong {
  color: #0f172a;
  font-size: 0.92rem;
}

.student-details small {
  color: #64748b;
  font-size: 0.75rem;
}

.student-avatar {
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  min-height: 30px !important;
  max-width: 30px !important;
  max-height: 30px !important;
  flex: 0 0 30px !important;
  display: block;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.student-email {
  color: #475569;
  font-size: 0.87rem;
}

.lessons-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 0.26rem 0.55rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #334155;
  font-weight: 600;
  font-size: 0.77rem;
}

.average-score {
  color: #0f172a;
  font-weight: 700;
  font-size: 0.86rem;
}

.progress-cell {
  width: 170px;
}

.progress-label {
  display: inline-block;
  color: #334155;
  font-weight: 700;
  font-size: 0.76rem;
  margin-bottom: 0.35rem;
}

.progress-bar {
  height: 8px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #3a8a0a, #7ecb20);
}

.student-recommendation-cell {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 160px;
}

.student-recommendation-cell strong {
  color: #0f172a;
  font-size: 0.8rem;
}

.student-recommendation-cell small {
  color: #64748b;
  font-size: 0.72rem;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.28rem 0.58rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.73rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.status-pill.status-active {
  background: #ecfdf3;
  color: #0f766e;
  border-color: #99f6e4;
}

.status-pill.status-inactive {
  background: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1;
}

.status-pill.status-suspended {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.table-state {
  min-height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  color: #64748b;
  font-weight: 600;
}

.btn-sm {
  padding: 0.45rem 0.75rem;
  font-size: 0.78rem;
  border-radius: 10px;
}

.request-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.class-requests-pagination {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.class-requests-pagination-copy {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
}

.class-requests-pagination-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.class-requests-page-indicator {
  color: #334155;
  font-size: 0.82rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .class-list-section {
    padding: 1rem;
  }

  .class-list-header {
    flex-direction: column;
    align-items: stretch;
  }

  .class-list-meta {
    justify-content: flex-start;
  }

  .class-list-table {
    min-width: 820px;
  }

  .class-requests-pagination {
    align-items: stretch;
  }

  .class-requests-pagination-actions {
    width: 100%;
    justify-content: space-between;
  }
}

/* Premium student management dashboard */
.student-dashboard-header {
  position: relative;
  overflow: visible;
  margin-bottom: 1rem;
  padding: clamp(1rem, 1.5vw, 1.35rem);
  border: 1px solid #dfe7dc;
  border-radius: 22px;
  background:
    radial-gradient(circle at 92% 12%, rgba(187, 255, 89, 0.2), transparent 28%),
    linear-gradient(135deg, #ffffff 0%, #f7fbf4 100%);
  box-shadow: 0 14px 36px rgba(30, 67, 7, 0.08);
}

.student-dashboard-header .header-content {
  min-height: auto;
  align-items: center;
  gap: 1rem;
}

.student-dashboard-header .header-left {
  min-width: 0;
  align-items: center;
}

.student-header-copy {
  min-width: 0;
}

.student-page-eyebrow,
.dashboard-panel-eyebrow {
  display: inline-flex;
  align-items: center;
  margin-bottom: 0.25rem;
  color: #4b741e;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.student-header-copy h1 {
  margin: 0;
  color: #132a08;
  font-size: clamp(1.55rem, 2.1vw, 2rem);
  letter-spacing: -0.035em;
}

.student-dashboard-header .header-subtitle {
  max-width: 680px;
  margin: 0.25rem 0 0;
  color: #607052;
  font-size: 0.86rem;
}

.student-dashboard-header .header-actions,
.student-primary-actions,
.student-dashboard-header .header-right-controls {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.student-primary-actions .btn {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding-inline: 0.9rem;
  border-radius: 12px;
  white-space: nowrap;
}

.student-primary-actions .btn-primary {
  border-color: #1e4307;
  background: #1e4307;
  box-shadow: 0 9px 20px rgba(30, 67, 7, 0.18);
}

.student-primary-actions .btn-primary:hover:not(:disabled) {
  background: #2d5d10;
  transform: translateY(-1px);
}

.student-header-context {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.9rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #dcebd3;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.student-header-context.is-unassigned {
  border-color: #fde68a;
  background: #fffbeb;
}

.student-context-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #e7f5dd;
  color: #1e4307;
}

.student-context-copy {
  min-width: 0;
  display: grid;
  gap: 0.08rem;
}

.student-context-copy strong {
  color: #24391a;
  font-size: 0.78rem;
}

.student-context-copy span {
  overflow: hidden;
  color: #718067;
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-context-subject {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.38rem 0.6rem;
  border-radius: 999px;
  background: #eef6e9;
  color: #345b18;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.student-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.student-kpi-card {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem;
  overflow: hidden;
  border: 1px solid #e2e8df;
  border-radius: 17px;
  background: #ffffff;
  box-shadow: 0 9px 24px rgba(15, 23, 42, 0.055);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.student-kpi-card:hover {
  transform: translateY(-2px);
  border-color: #c9dfbb;
  box-shadow: 0 15px 30px rgba(30, 67, 7, 0.1);
}

.student-kpi-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: #edf7e7;
  color: #2f6810;
  font-size: 1rem;
}

.kpi-pending .student-kpi-icon {
  background: #fff7d6;
  color: #8a6500;
}

.kpi-progress .student-kpi-icon {
  background: #eaf8e6;
  color: #31720d;
}

.student-kpi-card > div {
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 0.05rem 0.45rem;
}

.student-kpi-card span:not(.student-kpi-icon) {
  overflow: hidden;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-kpi-card strong {
  grid-column: 2;
  grid-row: 1 / span 2;
  color: #18330b;
  font-size: clamp(1.35rem, 2vw, 1.75rem);
  letter-spacing: -0.04em;
}

.student-kpi-card small {
  color: #94a3b8;
  font-size: 0.66rem;
}

.student-management-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
  gap: 1rem;
  align-items: start;
  margin-bottom: 1rem;
}

.dashboard-panel,
.student-list-panel {
  min-width: 0;
  margin: 0;
  padding: 1rem;
  border: 1px solid #e1e8de;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.dashboard-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dashboard-panel-header,
.student-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.dashboard-panel-header .section-title,
.student-list-header .section-title {
  margin: 0;
  color: #172b0e;
  font-size: 1.08rem;
  letter-spacing: -0.015em;
}

.dashboard-panel-header .class-list-subtitle,
.student-list-header .class-list-subtitle {
  margin-top: 0.2rem;
  font-size: 0.78rem;
}

.dashboard-panel .subject-management-grid,
.enrollment-request-list {
  min-height: 0;
  max-height: 470px;
  padding: 0.1rem 0.25rem 0.25rem 0.1rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd9c4 transparent;
}

.dashboard-panel .subject-management-grid {
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.dashboard-panel .subject-management-card {
  padding: 0.9rem;
  border-color: #e0e8dc;
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fbf6 100%);
  box-shadow: none;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-panel .subject-management-card:hover {
  transform: translateY(-2px);
  border-color: #bdd5ae;
  box-shadow: 0 13px 26px rgba(30, 67, 7, 0.09);
}

.dashboard-panel .subject-management-card.menu-open {
  z-index: 20;
}

.subject-management-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #4b741e;
}

.dashboard-panel .subject-management-head h4 {
  font-size: 1.05rem;
  letter-spacing: -0.015em;
}

.dashboard-panel .subject-management-code {
  border: 1px solid #cfe4c2;
  background: #eaf6e3;
  color: #1e4307;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.dashboard-panel .subject-management-copy {
  display: -webkit-box;
  margin-top: 0.6rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.dashboard-panel .subject-management-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.7rem;
}

.dashboard-panel .subject-metric-chip {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.45rem 0.35rem;
  border: 1px solid #e4eadf;
  border-radius: 10px;
  background: #f7faf5;
  color: #66745d;
  font-size: 0.68rem;
  font-weight: 600;
}

.dashboard-panel .subject-metric-chip i,
.dashboard-panel .subject-metric-chip strong {
  color: #315f15;
}

.dashboard-panel .subject-metric-chip.is-pending {
  grid-column: 1 / -1;
  background: #fffbeb;
  color: #8a6500;
}

.dashboard-panel .subject-management-actions {
  display: grid;
  grid-template-columns: minmax(145px, 1.4fr) repeat(3, minmax(80px, 1fr));
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.dashboard-panel .record-link-button {
  min-width: 0;
  justify-content: center;
  padding: 0.48rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  white-space: nowrap;
}

.subject-management-menu-wrap {
  position: relative;
  display: inline-grid;
  grid-template-columns: auto 34px;
  align-items: center;
  gap: 0.4rem;
}

.subject-menu-trigger {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #d9e3d4;
  border-radius: 10px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;
}

.subject-menu-trigger:hover,
.subject-menu-trigger[aria-expanded="true"] {
  transform: translateY(-1px);
  border-color: #aec99f;
  background: #eff7eb;
  color: #1e4307;
}

.subject-menu-trigger:focus {
  outline: none;
}

.subject-menu-trigger:focus-visible {
  border-color: #6f9f52;
  box-shadow: 0 0 0 3px rgba(111, 159, 82, 0.2);
}

.subject-menu-trigger i[class*="fa-"] {
  color: currentColor !important;
}

.dashboard-panel .subject-management-actions.subject-actions-menu {
  position: absolute;
  top: calc(100% + 0.45rem);
  right: 0;
  z-index: 30;
  width: 210px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.35rem;
  margin: 0;
  padding: 0.45rem;
  border: 1px solid #dfe7db;
  border-radius: 13px;
  background: #ffffff;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
  animation: subject-menu-in 0.16s ease-out;
}

.class-management-panel.has-open-class-menu,
.class-management-panel.has-open-class-menu .subject-management-grid {
  overflow: visible;
}

.dashboard-panel .subject-actions-menu .record-link-button {
  width: 100%;
  min-height: 38px;
  justify-content: flex-start;
  padding-inline: 0.7rem;
}

@keyframes subject-menu-in {
  from {
    opacity: 0;
    transform: translateY(-5px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dashboard-empty-state {
  min-height: 250px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 1.25rem;
  border: 1px dashed #cfdcc8;
  border-radius: 16px;
  background: #fafcf9;
  color: #65745d;
  text-align: center;
}

.dashboard-empty-state > div {
  display: grid;
  gap: 0.2rem;
}

.dashboard-empty-state strong {
  color: #29451a;
  font-size: 0.92rem;
}

.dashboard-empty-state p {
  max-width: 280px;
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
}

.dashboard-empty-icon {
  width: 54px;
  height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 17px;
  background: #edf6e7;
  color: #3c741b;
  font-size: 1.25rem;
}

.enrollment-request-list {
  display: grid;
  gap: 0.65rem;
}

.enrollment-request-card {
  display: grid;
  gap: 0.65rem;
  padding: 0.8rem;
  border: 1px solid #e2e8df;
  border-radius: 15px;
  background: linear-gradient(145deg, #ffffff, #fafcf9);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.enrollment-request-card:hover {
  transform: translateY(-1px);
  border-color: #c7d9bc;
  box-shadow: 0 10px 22px rgba(30, 67, 7, 0.08);
}

.request-student-row,
.request-class-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.request-time {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #94a3b8;
  font-size: 0.62rem;
  white-space: nowrap;
}

.request-class-row {
  padding: 0.45rem 0.55rem;
  border-radius: 10px;
  background: #f1f6ee;
  color: #55664b;
  font-size: 0.72rem;
}

.request-class-row span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.request-class-row strong {
  color: #1e4307;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.enrollment-request-card .request-actions {
  justify-content: flex-end;
}

.enrollment-request-card .request-actions .btn {
  min-width: 88px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.student-list-panel {
  margin-bottom: 1rem;
}

.student-invite-icon-btn {
  width: 100%;
}

.class-management-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
}

.class-management-controls .tour-button-anchor,
.class-management-controls .create-class-btn {
  width: 100%;
}

.class-management-controls .create-class-btn {
  min-height: 38px;
  border-color: #69aa47 !important;
  background: #69aa47 !important;
  background-image: none !important;
  color: #ffffff !important;
  box-shadow: 0 10px 22px rgba(105, 170, 71, 0.22);
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.class-management-controls .create-class-btn i[class*="fa-"] {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.class-management-controls .create-class-btn:hover:not(:disabled) {
  border-color: #5b9b3c !important;
  background: #5b9b3c !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(91, 155, 60, 0.27);
}

.class-management-controls .create-class-btn:disabled {
  border-color: #b7d3a8 !important;
  background: #b7d3a8 !important;
  box-shadow: none;
}

.student-invite-icon-btn i[class*="fa-"] {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

.student-invite-icon-btn:focus-visible {
  outline: 3px solid rgba(126, 203, 32, 0.35);
  outline-offset: 2px;
}

.student-invite-icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  box-shadow: none;
}

.student-roster-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.7rem;
  padding: 0.45rem;
  border: 1px solid #e2e8df;
  border-radius: 14px;
  background: #f8faf7;
}

.student-roster-tab {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.student-roster-tab:hover:not(.active) {
  border-color: #cbdac3;
  background: #ffffff;
  color: #365923;
  transform: translateY(-1px);
}

.student-roster-tab:focus-visible {
  outline: 3px solid rgba(126, 203, 32, 0.3);
  outline-offset: 2px;
}

.student-roster-tab i[class*="fa-"] {
  color: currentColor !important;
}

.student-roster-tab strong {
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.68rem;
}

.student-roster-tab.active {
  border-color: #1e4307;
  background: #1e4307;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(30, 67, 7, 0.18);
}

.student-roster-tab.active strong {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.student-roster-context {
  margin: 0 0 0 auto;
  color: #718067;
  font-size: 0.72rem;
  line-height: 1.4;
  text-align: right;
}

.student-list-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(155px, 0.35fr) minmax(155px, 0.35fr) auto;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.75rem;
  padding: 0.6rem;
  border: 1px solid #e5ebe2;
  border-radius: 14px;
  background: #f8faf7;
}

.student-search-field,
.student-toolbar-select {
  min-width: 0;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.7rem;
  border: 1px solid #dce5d8;
  border-radius: 10px;
  background: #ffffff;
  color: #78906a;
}

.student-search-field:focus-within,
.student-toolbar-select:focus-within {
  border-color: #76a958;
  box-shadow: 0 0 0 3px rgba(91, 145, 55, 0.12);
}

.student-search-field input,
.student-toolbar-select select {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #334155;
  font: inherit;
  font-size: 0.76rem;
}

.student-toolbar-actions {
  display: flex;
  gap: 0.4rem;
}

.toolbar-icon-btn {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.38rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid #dce5d8;
  border-radius: 10px;
  background: #ffffff;
  color: #365923;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.toolbar-icon-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #a8c598;
  background: #f0f7ec;
}

.toolbar-icon-btn:disabled {
  cursor: wait;
  opacity: 0.58;
}

.student-list-panel .class-list-table-wrap {
  max-height: min(55vh, 570px);
  overflow: auto;
  border-radius: 14px;
}

.student-list-panel .class-list-table tbody td {
  padding-block: 0.72rem;
}

@media (max-width: 1280px) {
  .student-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .student-management-grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(330px, 0.9fr);
  }

  .dashboard-panel .subject-management-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .student-list-toolbar {
    grid-template-columns: minmax(220px, 1fr) repeat(2, minmax(145px, 0.45fr));
  }

  .student-toolbar-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (max-width: 980px) {
  .student-dashboard-header .header-content,
  .student-dashboard-header .header-actions {
    align-items: flex-start;
  }

  .student-dashboard-header .header-content {
    flex-direction: column;
  }

  .student-dashboard-header .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .student-management-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-panel {
    min-height: 0;
  }

  .dashboard-panel .subject-management-grid,
  .enrollment-request-list {
    max-height: 440px;
  }
}

@media (max-width: 680px) {
  .student-dashboard-header {
    padding: 0.9rem;
    border-radius: 18px;
  }

  .student-dashboard-header .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .student-primary-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .student-primary-actions .tour-button-anchor,
  .student-primary-actions .btn {
    width: 100%;
  }

  .student-dashboard-header .header-right-controls {
    justify-content: flex-end;
  }

  .student-header-context {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .student-context-copy span {
    white-space: normal;
  }

  .student-context-subject {
    grid-column: 1 / -1;
    justify-self: flex-start;
  }

  .student-kpi-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.65rem;
  }

  .student-kpi-card {
    padding: 0.75rem;
  }

  .dashboard-panel,
  .student-list-panel {
    padding: 0.8rem;
    border-radius: 16px;
  }

  .dashboard-panel-header,
  .student-list-header {
    flex-direction: column;
  }

  .class-management-controls,
  .class-management-controls .btn {
    width: 100%;
  }

  .dashboard-panel .subject-management-head {
    flex-direction: column;
  }

  .dashboard-panel .subject-management-meta,
  .dashboard-panel .subject-management-actions {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-panel .subject-metric-chip.is-pending {
    grid-column: auto;
  }

  .student-roster-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .student-roster-tab {
    width: 100%;
    padding-inline: 0.5rem;
  }

  .student-roster-context {
    grid-column: 1 / -1;
    margin: 0;
    text-align: center;
  }

  .student-list-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .student-toolbar-actions {
    grid-column: auto;
  }

  .student-toolbar-actions .toolbar-icon-btn {
    flex: 1;
  }

  .request-student-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .enrollment-request-card .request-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .class-requests-pagination-actions {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .student-kpi-card,
  .dashboard-panel .subject-management-card,
  .enrollment-request-card,
  .toolbar-icon-btn {
    transition: none;
  }
}

@media print {
  .teacher-sidebar,
  .student-dashboard-header,
  .student-kpi-grid,
  .student-management-grid,
  .student-list-toolbar {
    display: none !important;
  }

  .teacher-main,
  .student-list-panel,
  .student-list-panel .class-list-table-wrap {
    max-height: none !important;
    overflow: visible !important;
    box-shadow: none !important;
  }
}
</style>




