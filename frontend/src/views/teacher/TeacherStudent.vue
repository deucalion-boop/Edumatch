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
          <div class="teacher-avatar"><img :src="teacherAvatarUrl" :alt="teacherFullName" /></div>
          <div class="teacher-info">
            <h5>{{ teacherFullName }}</h5>
            <p class="teacher-role">{{ teacherRole }}</p>
            <p v-if="teacherSubject" class="teacher-strand">{{ teacherSubject }}</p>
            <p v-else-if="teacherStrand" class="teacher-strand">{{ teacherStrand }}</p>
            <div class="teacher-status"><span class="status-indicator active"></span><span>{{ teacherStatus }}</span></div>
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
      <header class="top-header" data-tour="students-header">
        <div class="header-content">
          <div class="header-left">
            <button type="button" class="mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar"><i class="fas fa-bars"></i></button>
            <div>
              <h1>Students</h1>
              <p class="header-subtitle">Manage enrollment, progress, and current activity for {{ teacherSubject || 'your assigned subject' }}.</p>
            </div>
          </div>
          <div class="header-actions">
            <div class="header-right-controls">
            <div class="tour-button-anchor" data-tour="students-invite-button">
              <button type="button" class="btn btn-primary btn-sm" :disabled="!hasAdvisorySection" @click="openStudentInviteModal" aria-label="Invite Student" :title="hasAdvisorySection ? 'Invite Student' : 'Assign an advisory section first'">
                <i class="fas fa-plus"></i>
              </button>
            </div>
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
      <section v-if="toast.show" class="students-toast" :class="`toast-${toast.type}`" aria-live="polite">
        <i class="fas" :class="toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'"></i>
        <span>{{ toast.message }}</span>
      </section>
      <section class="section-card animated-card teacher-advisory-card">
        <div class="section-header class-list-header">
          <div>
            <h3 class="section-title">Advisory Section</h3>
            <p class="class-list-subtitle">
              <template v-if="hasAdvisorySection">
                New student accounts created here will be placed in Section {{ teacherAdvisorySectionName }} only. Handled classes stay separate and are joined later with class codes.
              </template>
              <template v-else>
                No advisory section is assigned yet. Ask your Head Teacher to assign one before creating student accounts.
              </template>
            </p>
          </div>
          <div class="class-list-meta">
            <span class="meta-chip">
              <i class="fas fa-layer-group"></i>
              {{ teacherAdvisorySectionName || 'Unassigned' }}
            </span>
            <span class="meta-chip">
              <i class="fas fa-building"></i>
              {{ teacherSubject || 'Department subject' }}
            </span>
          </div>
        </div>
      </section>
      <section class="section-card animated-card class-list-section" data-tour="students-subjects-section">
        <div class="section-header class-list-header class-management-header">
          <div class="class-management-header-copy">
            <h3 class="section-title">Class Management</h3>
            <p class="class-list-subtitle">Create your class, share the class code, and review only the students who joined that handled class.</p>
          </div>
          <div class="results-controls class-management-controls">
            <button type="button" class="btn btn-primary btn-sm create-class-btn" @click="openCreateClassModal">
              <i class="fas fa-plus"></i>
              Create Class
            </button>
          </div>
        </div>

        <div v-if="subjects.length === 0" class="table-state">
          <i class="fas fa-chalkboard"></i>
          <span>Create your first class to generate a class code.</span>
        </div>

        <div v-else class="subject-management-grid">
          <article v-for="subject in subjects" :key="subject.id" class="subject-management-card">
            <div class="subject-management-head">
              <div class="subject-management-title-block">
                <span class="subject-management-label">{{ subject.name }}</span>
                <h4>{{ subject.className || subject.name }}</h4>
                <p>{{ subject.track || 'General' }} · {{ subject.code }}</p>
              </div>
              <span class="subject-management-code">{{ subject.code }}</span>
            </div>
            <div class="subject-management-actions">
              <button type="button" class="record-link record-link-button subject-copy-btn" @click="copySubjectCode(subject)">
                <i class="fas fa-copy"></i>
                Copy Code
              </button>
              <button type="button" class="record-link record-link-button subject-students-btn" @click="openSubjectStudentsModal(subject)">
                <i class="fas fa-user-minus"></i>
                Manage Students
              </button>
              <button type="button" class="record-link record-link-button subject-edit-btn" @click="openEditClassModal(subject)">
                <i class="fas fa-pen"></i>
                Edit Class
              </button>
              <button
                type="button"
                class="record-link record-link-button subject-delete-btn"
                :title="subject.canDelete ? 'Delete class' : resolveDeleteClassBlockedReason(subject)"
                @click="openDeleteClassModal(subject)"
              >
                <i class="fas fa-trash-alt"></i>
                Delete Class
              </button>
            </div>
            <p v-if="subject.description" class="subject-management-copy">{{ subject.description }}</p>
            <div class="subject-management-meta">
              <span class="subject-metric-chip">{{ subject.lessonCount }} lessons</span>
              <span class="subject-metric-chip">{{ subject.assessmentCount }} assessments</span>
              <span class="subject-metric-chip">{{ subject.approvedStudentsCount }} students</span>
              <span v-if="subject.pendingRequestsCount > 0" class="subject-metric-chip">{{ subject.pendingRequestsCount }} pending</span>
              <span v-if="subject.attendanceRecordCount > 0" class="subject-metric-chip">{{ subject.attendanceRecordCount }} attendance</span>
            </div>
            <p v-if="subject.approvedStudentsCount === 0" class="subject-management-waiting">Waiting for students to join with the class code</p>
          </article>
        </div>
      </section>

      <section class="section-card animated-card class-list-section enrollment-requests-section">
        <div class="section-header class-list-header">
          <div>
            <h3 class="section-title">Class Requests</h3>
            <p class="class-list-subtitle">Review class-code join requests before students unlock lessons and assessments.</p>
          </div>
          <div class="class-list-meta">
            <span class="meta-chip">
              <i class="fas fa-user-clock"></i>
              {{ enrollmentRequests.length }} Pending
            </span>
          </div>
        </div>

        <div class="class-list-table-wrap">
          <table class="class-list-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Class</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody v-if="isEnrollmentRequestsLoading">
              <tr>
                <td colspan="5">
                  <div class="table-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading enrollment requests...</span>
                  </div>
                </td>
              </tr>
            </tbody>

            <tbody v-else-if="enrollmentRequests.length === 0">
              <tr>
                <td colspan="5">
                  <div class="table-state">
                    <i class="fas fa-user-check"></i>
                    <span>No pending enrollment requests</span>
                  </div>
                </td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr v-for="request in paginatedEnrollmentRequests" :key="request.id">
                <td>
                  <div class="student-identity">
                    <img :src="request.avatar" :alt="request.name" class="student-avatar" />
                    <div class="student-details">
                      <strong>{{ request.name }}</strong>
                      <small>{{ request.sectionName || 'No section' }}</small>
                    </div>
                  </div>
                </td>
                <td class="student-email">{{ request.email }}</td>
                <td>
                  <div class="student-recommendation-cell">
                    <strong>{{ request.className || request.subjectName }}</strong>
                    <small>{{ request.subjectCode }}</small>
                  </div>
                </td>
                <td>{{ formatDateTime(request.requestedAt) }}</td>
                <td>
                  <div class="request-actions">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      :disabled="requestActionId === request.id"
                      @click="updateEnrollmentRequest(request, 'approve')"
                    >
                      <i class="fas" :class="requestActionId === request.id ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                      Approve
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline btn-sm"
                      :disabled="requestActionId === request.id"
                      @click="updateEnrollmentRequest(request, 'reject')"
                    >
                      <i class="fas fa-times"></i>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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

      <section class="section-card animated-card class-list-section" data-tour="students-classlist-section">
        <div class="section-header class-list-header">
          <div>
            <h3 class="section-title">Class List</h3>
            <p class="class-list-subtitle">Handled-class roster and learning progress overview</p>
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

            <tbody v-else-if="students.length === 0">
              <tr>
                <td colspan="7">
                  <div class="table-state">
                    <i class="fas fa-user-graduate"></i>
                    <span>No students have joined your handled classes yet</span>
                  </div>
                </td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr v-for="student in students" :key="student.id">
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
  if (profileImage) return profileImage
  const name = encodeURIComponent(displayName.value)
  return `https://ui-avatars.com/api/?name=${name}&background=334155&color=fff`
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

const averageProgress = computed(() => {
  if (students.value.length === 0) return 0
  const total = students.value.reduce((sum, student) => sum + Number(student.progress || 0), 0)
  return Math.round(total / students.value.length)
})

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

.subject-remove-student-btn {
  border-color: rgba(239, 68, 68, 0.28);
  color: #b91c1c;
  background: #fff1f2;
}

.subject-remove-student-btn:hover {
  border-color: rgba(220, 38, 38, 0.4);
  background: #ffe4e6;
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
</style>




