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
            <div class="headteacher-sidebar-chip">Management Access</div>
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
            <div class="headteacher-management-header-copy">
              <h1>Teacher Management</h1>
              <p class="header-subtitle">Manage teacher accounts, statuses, and access for the {{ departmentLabel }} department.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
            <button type="button" class="btn btn-primary" @click="isCreateModalOpen = true">
              <i class="fas fa-user-plus"></i>
              Create Teacher
            </button>
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

      <section class="section-card dashboard-panel content-card headteacher-directory-section">
        <div class="headteacher-section-head">
          <div>
            <h2 class="section-title">Teacher Directory</h2>
            <p class="toolbar-subtitle">All teachers created here are automatically assigned to {{ departmentLabel }}.</p>
          </div>
        </div>

        <div class="headteacher-filter-bar filter-bar">
          <label class="headteacher-search-group">
            <i class="fas fa-search"></i>
            <input
              v-model.trim="filters.search"
              type="text"
              placeholder="Search by name, email, or department"
            >
          </label>

          <label class="headteacher-filter-group">
            <span>Status</span>
            <select v-model="filters.status">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <label class="headteacher-filter-group">
            <span>Sort</span>
            <select v-model="filters.sort">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </label>

          <div class="headteacher-filter-meta">
            <span class="headteacher-filter-meta-label">Showing</span>
            <strong>{{ filteredTeachers.length }}</strong>
            <span class="headteacher-filter-meta-copy">teachers</span>
          </div>
        </div>

        <p
          v-if="assignmentMessage"
          class="headteacher-directory-feedback"
          :class="assignmentMessageType === 'error' ? 'error' : 'success'"
        >
          {{ assignmentMessage }}
        </p>

        <div class="headteacher-table-shell data-table">
          <div class="headteacher-table-wrap">
            <table class="headteacher-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Advisory Section</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody v-if="isLoading">
                <tr>
                  <td colspan="8">
                    <div class="table-state">
                      <i class="fas fa-spinner fa-spin"></i>
                      <span>Loading teachers...</span>
                    </div>
                  </td>
                </tr>
              </tbody>

              <tbody v-else-if="paginatedTeachers.length === 0">
                <tr>
                  <td colspan="8">
                    <div class="table-state">
                      <i class="fas fa-users-slash"></i>
                      <span>No matching teachers found.</span>
                    </div>
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr
                  v-for="teacher in paginatedTeachers"
                  :key="teacher.id"
                  class="headteacher-table-row headteacher-table-row-interactive"
                  @click="openTeacherStudents(teacher)"
                >
                  <td>
                    <div class="headteacher-avatar-cell">
                      <img :src="teacher.avatar" :alt="teacher.name" class="headteacher-avatar" />
                    </div>
                  </td>
                  <td>
                    <div class="headteacher-name-cell">
                      <strong>{{ teacher.name }}</strong>
                      <small>Teacher</small>
                    </div>
                  </td>
                  <td>
                    <a :href="`mailto:${teacher.email}`" class="headteacher-email-link" @click.stop>{{ teacher.email }}</a>
                  </td>
                  <td>
                    <span class="headteacher-badge department-badge">{{ teacher.department }}</span>
                  </td>
                  <td>
                    <div class="headteacher-assignment-cell" @click.stop>
                      <select
                        class="headteacher-inline-select"
                        :value="getTeacherAssignmentDraft(teacher.id)"
                        :disabled="isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id"
                        @click.stop
                        @change="setTeacherAssignmentDraft(teacher.id, $event.target.value)"
                      >
                        <option value="">No advisory section</option>
                        <option
                          v-for="section in getAssignableSections(teacher.id)"
                          :key="`table-teacher-section-${teacher.id}-${section.id}`"
                          :value="section.id"
                        >
                          {{ section.name }}
                        </option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <span class="headteacher-badge status-badge" :class="`status-${normalizeStatus(teacher.status)}`">
                      {{ formatStatus(teacher.status) }}
                    </span>
                  </td>
                  <td>
                    <span class="headteacher-date">{{ formatDate(teacher.createdAt) }}</span>
                  </td>
                  <td>
                    <div class="headteacher-row-actions">
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        :disabled="isUpdatingTeacherAssignment || !hasTeacherAssignmentChanged(teacher)"
                        @click.stop="saveTeacherAssignment(teacher)"
                      >
                        <i class="fas" :class="isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                        {{ isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id ? 'Saving...' : 'Save Section' }}
                      </button>
                      <button type="button" class="btn btn-outline btn-sm" @click.stop="updateStatus(teacher, teacher.status === 'active' ? 'inactive' : 'active')">
                        {{ teacher.status === 'active' ? 'Set Inactive' : 'Set Active' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="headteacher-mobile-list">
            <div v-if="isLoading" class="table-state">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading teachers...</span>
            </div>

            <div v-else-if="paginatedTeachers.length === 0" class="table-state">
              <i class="fas fa-users-slash"></i>
              <span>No matching teachers found.</span>
            </div>

            <article
              v-else
              v-for="teacher in paginatedTeachers"
              :key="`mobile-${teacher.id}`"
              class="headteacher-mobile-card headteacher-mobile-card-interactive"
              role="button"
              tabindex="0"
              @click="openTeacherStudents(teacher)"
              @keydown.enter.prevent="openTeacherStudents(teacher)"
              @keydown.space.prevent="openTeacherStudents(teacher)"
            >
              <div class="headteacher-mobile-top">
                <div class="headteacher-mobile-identity">
                  <img :src="teacher.avatar" :alt="teacher.name" class="headteacher-avatar" />
                  <div class="headteacher-mobile-copy">
                    <strong>{{ teacher.name }}</strong>
                    <a :href="`mailto:${teacher.email}`" class="headteacher-email-link" @click.stop>{{ teacher.email }}</a>
                  </div>
                </div>
                <div class="headteacher-mobile-date-chip">
                  <span>Created</span>
                  <strong>{{ formatDate(teacher.createdAt) }}</strong>
                </div>
              </div>

              <div class="headteacher-mobile-badges headteacher-mobile-badges-primary">
                <span class="headteacher-badge department-badge">{{ teacher.department }}</span>
                <span class="headteacher-badge status-badge" :class="`status-${normalizeStatus(teacher.status)}`">
                  {{ formatStatus(teacher.status) }}
                </span>
                <span class="headteacher-badge headteacher-subject-badge">{{ teacher.subject || teacher.department }}</span>
              </div>

              <div class="headteacher-mobile-assignment-card" @click.stop>
                <div class="headteacher-mobile-assignment-head">
                  <div>
                    <span class="headteacher-mobile-kicker">Advisory Assignment</span>
                    <h4>Section Ownership</h4>
                  </div>
                  <span
                    class="headteacher-assignment-state"
                    :class="teacher.advisorySectionName ? 'assigned' : 'unassigned'"
                  >
                    {{ teacher.advisorySectionName || 'Unassigned' }}
                  </span>
                </div>
                <p class="headteacher-mobile-assignment-copy">
                  Choose the section this teacher will advise for advisory attendance and student account creation.
                </p>
                <div class="headteacher-mobile-assignment">
                  <select
                    class="headteacher-inline-select"
                    :value="getTeacherAssignmentDraft(teacher.id)"
                    :disabled="isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id"
                    @click.stop
                    @change="setTeacherAssignmentDraft(teacher.id, $event.target.value)"
                  >
                    <option value="">No advisory section</option>
                    <option
                      v-for="section in getAssignableSections(teacher.id)"
                      :key="`mobile-teacher-section-${teacher.id}-${section.id}`"
                      :value="section.id"
                    >
                      {{ section.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="headteacher-row-actions headteacher-mobile-actions">
                <button
                  type="button"
                  class="btn btn-primary btn-sm headteacher-save-section-btn"
                  :disabled="isUpdatingTeacherAssignment || !hasTeacherAssignmentChanged(teacher)"
                  @click.stop="saveTeacherAssignment(teacher)"
                >
                  <i class="fas" :class="isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                  {{ isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id ? 'Saving...' : 'Save Section' }}
                </button>
                <button type="button" class="btn btn-outline btn-sm" @click.stop="updateStatus(teacher, teacher.status === 'active' ? 'inactive' : 'active')">
                  {{ teacher.status === 'active' ? 'Set Inactive' : 'Set Active' }}
                </button>
              </div>
              <p class="headteacher-mobile-hint">Tap the card to review this teacher’s student list.</p>
            </article>
          </div>

          <div class="headteacher-pagination" v-if="totalPages > 1">
            <div class="headteacher-pagination-info">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
            <div class="headteacher-pagination-controls">
              <button type="button" class="headteacher-page-btn" :disabled="currentPage === 1" @click="goToPreviousPage">Previous</button>
              <button
                v-for="page in visiblePages"
                :key="page"
                type="button"
                class="headteacher-page-btn"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button type="button" class="headteacher-page-btn" :disabled="currentPage === totalPages" @click="goToNextPage">Next</button>
            </div>
          </div>
        </div>
      </section>

      <section class="section-card dashboard-panel content-card headteacher-directory-section headteacher-attendance-section">
        <div class="headteacher-section-head">
          <div>
            <h2 class="section-title">Department Attendance Monitoring</h2>
            <p class="toolbar-subtitle">Recent attendance records for teachers managed inside {{ departmentLabel }}.</p>
          </div>
        </div>

        <div v-if="isLoading" class="table-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading attendance overview...</span>
        </div>

        <div v-else-if="recentAttendanceRecords.length === 0" class="table-state">
          <i class="fas fa-calendar-check"></i>
          <span>No attendance records available for managed teachers yet.</span>
        </div>

        <div v-else class="headteacher-attendance-list">
          <article
            v-for="record in recentAttendanceRecords"
            :key="record.id"
            class="headteacher-attendance-card headteacher-attendance-card-interactive"
            role="button"
            tabindex="0"
            @click="openAttendanceModal(record)"
            @keydown.enter.prevent="openAttendanceModal(record)"
            @keydown.space.prevent="openAttendanceModal(record)"
          >
            <div class="headteacher-attendance-card-top">
              <div>
                <strong>{{ attendanceRecordTitle(record) }}</strong>
                <small>{{ record.teacher.name || 'Teacher' }} · {{ formatDate(record.dateKey) }}</small>
              </div>
              <span class="headteacher-badge status-badge" :class="record.isLocked ? 'status-active' : 'status-inactive'">
                {{ record.isLocked ? 'Locked' : 'Open' }}
              </span>
            </div>
            <div class="headteacher-attendance-stat-row">
              <span>Present {{ record.summary.presentCount }}</span>
              <span>Late {{ record.summary.lateCount }}</span>
              <span>Absent {{ record.summary.absentCount }}</span>
              <span>Excused {{ record.summary.excusedCount }}</span>
            </div>
            <p class="headteacher-attendance-card-note">{{ attendanceScopeLabel(record.attendanceScope) }}<template v-if="record.section?.name"> / Section {{ record.section.name }}</template></p>
            <p class="headteacher-attendance-card-hint">Click to view student attendance details.</p>
          </article>
        </div>
      </section>

      <div v-if="isAttendanceModalOpen" class="modal-shell" @click.self="closeAttendanceModal">
        <div class="modal-panel headteacher-attendance-modal">
          <div class="modal-panel-head headteacher-attendance-modal-head">
            <div class="headteacher-attendance-title-block">
              <span class="headteacher-attendance-eyebrow">Attendance Details</span>
              <h3>{{ attendanceRecordTitle(selectedAttendanceRecord) }}</h3>
              <p>{{ selectedAttendanceRecord?.teacher?.name || 'Teacher' }} - {{ formatDate(selectedAttendanceRecord?.dateKey) }}</p>
              <p v-if="selectedAttendanceRecord?.section?.name" class="headteacher-attendance-section-copy">Section {{ selectedAttendanceRecord.section.name }}</p>
            </div>

            <div class="headteacher-attendance-summary-cards">
              <div class="headteacher-attendance-summary-card status-present">
                <span>Present</span>
                <strong>{{ attendanceEntryGroups.Present.length }}</strong>
              </div>
              <div class="headteacher-attendance-summary-card status-late">
                <span>Late</span>
                <strong>{{ attendanceEntryGroups.Late.length }}</strong>
              </div>
              <div class="headteacher-attendance-summary-card status-absent">
                <span>Absent</span>
                <strong>{{ attendanceEntryGroups.Absent.length }}</strong>
              </div>
              <div class="headteacher-attendance-summary-card status-excused">
                <span>Excused</span>
                <strong>{{ attendanceEntryGroups.Excused.length }}</strong>
              </div>
            </div>

            <button type="button" class="modal-close-btn headteacher-attendance-close-btn" @click="closeAttendanceModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div v-if="selectedAttendanceEntries.length === 0" class="table-state headteacher-attendance-modal-state">
            <i class="fas fa-user-check"></i>
            <span>No student attendance entries are available for this record.</span>
          </div>

          <div v-else class="headteacher-attendance-groups">
            <section
              v-for="status in attendanceStatuses"
              :key="status"
              class="headteacher-attendance-group"
            >
              <div class="headteacher-attendance-group-head">
                <span class="headteacher-attendance-status-pill" :class="`status-${status.toLowerCase()}`">{{ status }}</span>
                <strong>{{ attendanceEntryGroups[status].length }}</strong>
              </div>

              <div v-if="attendanceEntryGroups[status].length === 0" class="headteacher-attendance-group-empty">
                No students marked {{ status.toLowerCase() }}.
              </div>

              <div v-else class="headteacher-attendance-group-list">
                <article
                  v-for="entry in attendanceEntryGroups[status]"
                  :key="`${selectedAttendanceRecord?.id}-${status}-${entry.studentId}`"
                  class="headteacher-attendance-student-row"
                >
                  <div class="headteacher-attendance-student-copy">
                    <strong>{{ entry.studentName || 'Student' }}</strong>
                    <small>{{ entry.studentEmail || 'No email address' }}</small>
                  </div>
                  <div class="headteacher-attendance-student-meta">
                    <span v-if="entry.gradeLevel" class="headteacher-attendance-meta-pill">{{ entry.gradeLevel }}</span>
                    <span v-if="entry.sectionName" class="headteacher-attendance-meta-pill">{{ entry.sectionName }}</span>
                    <span v-if="entry.department" class="headteacher-attendance-meta-pill">{{ entry.department }}</span>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div v-if="isCreateModalOpen" class="modal-shell" @click.self="closeModal">
        <div class="modal-panel">
          <div class="modal-panel-head">
            <div>
              <h3>Create Teacher Account</h3>
              <p>Teachers created here are assigned to {{ departmentLabel }}.</p>
            </div>
            <button type="button" class="modal-close-btn" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form class="headteacher-form" @submit.prevent="createTeacher">
            <div class="headteacher-form-grid">
              <label class="headteacher-form-group">
                <span>Full Name</span>
                <input v-model.trim="form.name" type="text" required placeholder="Enter teacher name">
              </label>
              <label class="headteacher-form-group">
                <span>Email</span>
                <input v-model.trim="form.email" type="email" required placeholder="Enter teacher email">
              </label>
              <label class="headteacher-form-group">
                <span>Username</span>
                <input v-model.trim="form.username" type="text" required placeholder="Enter teacher username">
              </label>
              <label class="headteacher-form-group">
                <span>Department</span>
                <input :value="departmentLabel" type="text" readonly>
              </label>
              <label class="headteacher-form-group">
                <span>Contact Number</span>
                <input v-model.trim="form.contactNumber" type="text" placeholder="Optional contact number">
              </label>
              <label class="headteacher-form-group">
                <span>Access</span>
                <input value="Temporary password is auto-generated and emailed" type="text" readonly>
              </label>
              <label class="headteacher-form-group">
                <span>Advisory Section</span>
                <select v-model="form.advisorySectionId">
                  <option value="">No advisory section</option>
                  <option v-for="section in getAssignableSections('')" :key="`create-teacher-section-${section.id}`" :value="section.id">
                    {{ section.name }}
                  </option>
                </select>
              </label>
            </div>

            <p v-if="formMessage" class="headteacher-form-feedback" :class="formMessageType">{{ formMessage }}</p>

            <div class="modal-panel-actions">
              <button type="button" class="btn btn-outline" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <i class="fas" :class="isSubmitting ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                {{ isSubmitting ? 'Saving...' : 'Create Teacher & Email Credentials' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="isStudentsModalOpen" class="modal-shell" @click.self="closeStudentsModal">
        <div class="modal-panel headteacher-students-modal">
          <div class="modal-panel-head headteacher-students-modal-head">
            <div class="headteacher-students-title-block">
              <span class="headteacher-students-eyebrow">Student Directory</span>
              <h3>{{ selectedTeacher?.name || 'Teacher' }} Students</h3>
              <p>
                Review enrolled students under {{ selectedTeacher?.subject || selectedTeacher?.department || departmentLabel }}.
                <template v-if="selectedTeacher?.advisorySectionName"> Advisory section: {{ selectedTeacher.advisorySectionName }}.</template>
              </p>
            </div>
            <div class="headteacher-students-head-actions">
              <div class="headteacher-students-summary-cards">
                <div class="headteacher-students-summary-card">
                  <span>Total Students</span>
                  <strong>{{ selectedTeacherStudents.length }}</strong>
                </div>
                <div class="headteacher-students-summary-card">
                  <span>Active Students</span>
                  <strong>{{ activeSelectedTeacherStudents }}</strong>
                </div>
              </div>
            </div>
            <button type="button" class="modal-close-btn headteacher-students-close-btn" @click="closeStudentsModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div v-if="isStudentsLoading" class="table-state headteacher-students-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading students...</span>
          </div>

          <div v-else-if="studentsErrorMessage" class="table-state headteacher-students-state">
            <i class="fas fa-circle-exclamation"></i>
            <span>{{ studentsErrorMessage }}</span>
          </div>

          <div v-else-if="selectedTeacherStudents.length === 0" class="table-state headteacher-students-state">
            <i class="fas fa-user-graduate"></i>
            <span>No students found for this teacher yet.</span>
          </div>

          <div v-else class="headteacher-students-table-shell">
            <div class="headteacher-students-table-wrap">
              <table class="headteacher-students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Section</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in selectedTeacherStudents" :key="student.id">
                    <td>
                      <div class="headteacher-student-cell">
                        <img :src="student.avatar" :alt="student.name" class="headteacher-avatar" />
                        <div class="headteacher-student-copy">
                          <strong>{{ student.name }}</strong>
                          <small>Student</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a :href="`mailto:${student.email}`" class="headteacher-email-link">{{ student.email }}</a>
                    </td>
                    <td>
                      <span class="headteacher-badge department-badge">{{ student.sectionName || 'No section' }}</span>
                    </td>
                    <td>
                      <span class="headteacher-badge department-badge">{{ student.gradeLevel || 'Not set' }}</span>
                    </td>
                    <td>
                      <span class="headteacher-badge status-badge" :class="`status-${normalizeStatus(student.status)}`">
                        {{ formatStatus(student.status) }}
                      </span>
                    </td>
                    <td>
                      <span class="headteacher-date">{{ formatDate(student.createdAt) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="headteacher-students-mobile-list">
              <article v-for="student in selectedTeacherStudents" :key="`mobile-student-${student.id}`" class="headteacher-student-card">
                <div class="headteacher-student-top">
                  <img :src="student.avatar" :alt="student.name" class="headteacher-avatar" />
                  <div class="headteacher-student-copy">
                    <strong>{{ student.name }}</strong>
                    <a :href="`mailto:${student.email}`" class="headteacher-email-link">{{ student.email }}</a>
                  </div>
                </div>

                <div class="headteacher-mobile-badges">
                  <span class="headteacher-badge department-badge">{{ student.sectionName || 'No section' }}</span>
                  <span class="headteacher-badge department-badge">{{ student.gradeLevel || 'Not set' }}</span>
                  <span class="headteacher-badge status-badge" :class="`status-${normalizeStatus(student.status)}`">
                    {{ formatStatus(student.status) }}
                  </span>
                </div>

                <div class="headteacher-mobile-meta headteacher-student-meta">
                  <div class="headteacher-mobile-meta-item">
                    <span>Date Created</span>
                    <strong>{{ formatDate(student.createdAt) }}</strong>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
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
const isCreateModalOpen = ref(false)
const isStudentsModalOpen = ref(false)
const isAttendanceModalOpen = ref(false)
const isUpdatingTeacherAssignment = ref(false)
const updatingTeacherAssignmentId = ref('')
const formMessage = ref('')
const formMessageType = ref('success')
const assignmentMessage = ref('')
const assignmentMessageType = ref('success')
const teachers = ref([])
const sections = ref([])
const teacherAssignmentDrafts = reactive({})
const attendanceOverview = ref({
  summary: {
    totalRecords: 0,
    totalTeachers: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
    lockedCount: 0,
  },
  teacherSummaries: [],
  recentRecords: [],
})
const selectedTeacher = ref(null)
const selectedTeacherStudents = ref([])
const selectedAttendanceRecord = ref(null)
const isStudentsLoading = ref(false)
const studentsErrorMessage = ref('')
const currentPage = ref(1)
const pageSize = ref(6)
const accountMenuRef = ref(null)
const summary = reactive({
  totalTeachers: 0,
  activeTeachers: 0,
  totalStudents: 0,
  totalLessonsAndAssessments: 0,
  totalLessons: 0,
  totalAssessments: 0,
})
const filters = reactive({
  search: '',
  status: 'all',
  sort: 'newest',
})
const form = reactive({
  name: '',
  email: '',
  username: '',
  contactNumber: '',
  advisorySectionId: '',
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
const attendanceStatuses = ['Present', 'Late', 'Absent', 'Excused']
const activeSelectedTeacherStudents = computed(() => selectedTeacherStudents.value.filter((student) => normalizeStatus(student.status) === 'active').length)
const recentAttendanceRecords = computed(() => Array.isArray(attendanceOverview.value?.recentRecords) ? attendanceOverview.value.recentRecords.slice(0, 12) : [])
const selectedAttendanceEntries = computed(() => {
  const entries = Array.isArray(selectedAttendanceRecord.value?.entries) ? selectedAttendanceRecord.value.entries : []
  return [...entries].sort((left, right) => String(left?.studentName || '').localeCompare(String(right?.studentName || '')))
})
const attendanceEntryGroups = computed(() => attendanceStatuses.reduce((groups, status) => {
  groups[status] = selectedAttendanceEntries.value.filter((entry) => String(entry?.status || '') === status)
  return groups
}, {
  Present: [],
  Late: [],
  Absent: [],
  Excused: [],
}))

const normalizeStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase()
  if (['active', 'inactive', 'pending', 'suspended'].includes(normalized)) return normalized
  return 'inactive'
}

const formatStatus = (status) => {
  const normalized = normalizeStatus(status)
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed)
}

const attendanceScopeLabel = (scope) => String(scope || '').trim().toLowerCase() === 'advisory_class'
  ? 'Advisory'
  : 'Handled Class'

const attendanceRecordTitle = (record) => String(
  record?.title
  || record?.subject?.className
  || record?.subject?.name
  || 'Attendance'
).trim() || 'Attendance'

const filteredTeachers = computed(() => {
  const searchValue = String(filters.search || '').trim().toLowerCase()
  const filtered = teachers.value.filter((teacher) => {
    const matchesSearch = !searchValue || [
      teacher.name,
      teacher.email,
      teacher.department,
      teacher.subject,
      teacher.advisorySectionName,
    ].some((value) => String(value || '').toLowerCase().includes(searchValue))

    const matchesStatus = filters.status === 'all'
      ? true
      : normalizeStatus(teacher.status) === filters.status

    return matchesSearch && matchesStatus
  })

  return [...filtered].sort((left, right) => {
    if (filters.sort === 'oldest') return new Date(left.createdAt || 0) - new Date(right.createdAt || 0)
    if (filters.sort === 'name-asc') return String(left.name || '').localeCompare(String(right.name || ''))
    if (filters.sort === 'name-desc') return String(right.name || '').localeCompare(String(left.name || ''))
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTeachers.value.length / pageSize.value)))
const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTeachers.value.slice(start, start + pageSize.value)
})
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + maxVisible - 1)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

watch(totalPages, (value) => {
  if (currentPage.value > value) currentPage.value = value
})

const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value }
const closeSidebar = () => { isSidebarOpen.value = false }
const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.username = ''
  form.contactNumber = ''
  form.advisorySectionId = ''
  formMessage.value = ''
  formMessageType.value = 'success'
}

const closeModal = () => {
  if (isSubmitting.value) return
  isCreateModalOpen.value = false
  resetForm()
}

const closeStudentsModal = () => {
  if (isStudentsLoading.value) return
  isStudentsModalOpen.value = false
  selectedTeacher.value = null
  selectedTeacherStudents.value = []
  studentsErrorMessage.value = ''
}

const openAttendanceModal = (record) => {
  selectedAttendanceRecord.value = record || null
  isAttendanceModalOpen.value = Boolean(selectedAttendanceRecord.value)
}

const closeAttendanceModal = () => {
  isAttendanceModalOpen.value = false
  selectedAttendanceRecord.value = null
}

const handleLogout = () => {
  isAccountMenuOpen.value = false
  authStore.logout()
  router.push('/auth/login')
}

const goToProfile = () => {
  isAccountMenuOpen.value = false
  router.push('/headteacher/profile')
}

const goToSettings = () => {
  isAccountMenuOpen.value = false
  router.push('/headteacher/settings')
}

const handleAccountMenuClickOutside = (event) => {
  const target = event?.target
  if (accountMenuRef.value && target instanceof Node && accountMenuRef.value.contains(target)) return
  isAccountMenuOpen.value = false
}

const goToPage = (page) => {
  currentPage.value = page
}

const goToPreviousPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const normalizeTeacherId = (teacherOrId) => String(
  typeof teacherOrId === 'string'
    ? teacherOrId
    : teacherOrId?.id || teacherOrId?._id || ''
).trim()

const syncTeacherAssignmentDrafts = (teacherList) => {
  const nextTeacherIds = new Set()

  for (const teacher of Array.isArray(teacherList) ? teacherList : []) {
    const teacherId = normalizeTeacherId(teacher)
    if (!teacherId) continue

    nextTeacherIds.add(teacherId)
    teacherAssignmentDrafts[teacherId] = String(teacher.advisorySectionId || '').trim()
  }

  for (const teacherId of Object.keys(teacherAssignmentDrafts)) {
    if (!nextTeacherIds.has(teacherId)) {
      delete teacherAssignmentDrafts[teacherId]
    }
  }
}

const getTeacherAssignmentDraft = (teacherId) => String(
  teacherAssignmentDrafts[normalizeTeacherId(teacherId)] || ''
).trim()

const setTeacherAssignmentDraft = (teacherId, advisorySectionId) => {
  const normalizedTeacherId = normalizeTeacherId(teacherId)
  if (!normalizedTeacherId) return
  teacherAssignmentDrafts[normalizedTeacherId] = String(advisorySectionId || '').trim()
}

const getAssignableSections = (teacherId) => {
  const normalizedTeacherId = normalizeTeacherId(teacherId)
  return sections.value.filter((section) => {
    const adviserId = String(section?.adviser?.id || '').trim()
    return !adviserId || adviserId === normalizedTeacherId
  })
}

const hasTeacherAssignmentChanged = (teacher) => {
  const teacherId = normalizeTeacherId(teacher)
  return getTeacherAssignmentDraft(teacherId) !== String(teacher?.advisorySectionId || '').trim()
}

const fetchTeachers = async () => {
  isLoading.value = true
  try {
    const [teachersResponse, attendanceResponse, sectionsResponse] = await Promise.all([
      axios.get(`${resolveApiBaseUrl()}/headteacher/teachers`, getAuthConfig()),
      axios.get(`${resolveApiBaseUrl()}/headteacher/attendance`, getAuthConfig()),
      axios.get(`${resolveApiBaseUrl()}/headteacher/sections`, getAuthConfig()),
    ])
    const payload = Array.isArray(teachersResponse.data?.teachers) ? teachersResponse.data.teachers : []
    const responseSummary = teachersResponse.data?.summary || {}
    const attendanceSummaries = Array.isArray(attendanceResponse.data?.teacherSummaries) ? attendanceResponse.data.teacherSummaries : []
    const attendanceByTeacherId = new Map(attendanceSummaries.map((item) => [String(item.teacherId || ''), item]))
    sections.value = Array.isArray(sectionsResponse.data?.sections) ? sectionsResponse.data.sections : []

    teachers.value = payload.map((teacher) => ({
      id: teacher.id || teacher._id,
      name: teacher.name,
      email: teacher.email,
      department: teacher.department || departmentLabel.value,
      subject: teacher.subject || teacher.department || departmentLabel.value,
      advisorySectionId: teacher.advisorySection?.id || teacher.advisorySectionId || '',
      advisorySectionName: teacher.advisorySection?.name || teacher.advisorySectionName || '',
      status: normalizeStatus(teacher.status || 'active'),
      createdAt: teacher.createdAt || null,
      avatar: teacher.avatar || teacher.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name || 'Teacher')}&background=334155&color=fff`,
      attendance: {
        totalRecords: Number(attendanceByTeacherId.get(String(teacher.id || teacher._id || ''))?.totalRecords || 0),
        absentCount: Number(attendanceByTeacherId.get(String(teacher.id || teacher._id || ''))?.absentCount || 0),
        handledRecordCount: Number(attendanceByTeacherId.get(String(teacher.id || teacher._id || ''))?.handledRecordCount || 0),
        advisoryRecordCount: Number(attendanceByTeacherId.get(String(teacher.id || teacher._id || ''))?.advisoryRecordCount || 0),
        lockedCount: Number(attendanceByTeacherId.get(String(teacher.id || teacher._id || ''))?.lockedCount || 0),
        lastDate: attendanceByTeacherId.get(String(teacher.id || teacher._id || ''))?.lastDate || '',
      },
    }))
    syncTeacherAssignmentDrafts(teachers.value)

    summary.totalTeachers = Number(responseSummary.totalTeachers || teachers.value.length)
    summary.activeTeachers = Number(responseSummary.activeTeachers || teachers.value.filter((teacher) => teacher.status === 'active').length)
    summary.totalStudents = Number(responseSummary.totalStudents || 0)
    summary.totalLessonsAndAssessments = Number(responseSummary.totalLessonsAndAssessments || 0)
    summary.totalLessons = Number(responseSummary.totalLessons || 0)
    summary.totalAssessments = Number(responseSummary.totalAssessments || 0)
    attendanceOverview.value = {
      summary: attendanceResponse.data?.summary || attendanceOverview.value.summary,
      teacherSummaries: attendanceSummaries,
      recentRecords: Array.isArray(attendanceResponse.data?.recentRecords) ? attendanceResponse.data.recentRecords : [],
    }
  } finally {
    isLoading.value = false
  }
}

const openTeacherStudents = async (teacher) => {
  selectedTeacher.value = teacher
  selectedTeacherStudents.value = []
  studentsErrorMessage.value = ''
  isStudentsLoading.value = true
  isStudentsModalOpen.value = true

  try {
    const response = await axios.get(
      `${resolveApiBaseUrl()}/headteacher/teachers/${encodeURIComponent(teacher.id)}/students`,
      getAuthConfig(),
    )
    selectedTeacher.value = response.data?.teacher || teacher
    selectedTeacherStudents.value = Array.isArray(response.data?.students) ? response.data.students : []
  } catch (error) {
    studentsErrorMessage.value = error.response?.data?.message || 'Failed to load students for this teacher.'
  } finally {
    isStudentsLoading.value = false
  }
}

const createTeacher = async () => {
  isSubmitting.value = true
  formMessage.value = ''
  try {
    const response = await axios.post(`${resolveApiBaseUrl()}/headteacher/teachers`, {
      name: form.name,
      email: form.email,
      username: form.username,
      subject: departmentLabel.value,
      contactNumber: form.contactNumber,
      advisorySectionId: form.advisorySectionId || undefined,
    }, getAuthConfig())

    const generatedPassword = String(response.data?.invite?.generatedPassword || '').trim()
    const emailSent = response.data?.invite?.emailSent !== false
    formMessage.value = generatedPassword
      ? `${emailSent ? 'Teacher account created and emailed successfully.' : 'Teacher account created, but email sending failed.'} Temporary password: ${generatedPassword}`
      : 'Teacher account created successfully.'
    formMessageType.value = emailSent ? 'success' : 'error'
    await fetchTeachers()
    window.setTimeout(() => {
      closeModal()
    }, 400)
  } catch (error) {
    formMessage.value = error.response?.data?.message || 'Failed to create teacher account.'
    formMessageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

const updateStatus = async (teacher, status) => {
  await axios.put(`${resolveApiBaseUrl()}/headteacher/teachers/${encodeURIComponent(teacher.id)}`, {
    status,
    subject: teacher.subject || departmentLabel.value,
    advisorySectionId: teacher.advisorySectionId || '',
  }, getAuthConfig())
  await fetchTeachers()
}

const persistTeacherAssignment = async (teacher, advisorySectionId) => {
  const teacherId = normalizeTeacherId(teacher)
  if (!teacherId) return

  assignmentMessage.value = ''
  assignmentMessageType.value = 'success'
  isUpdatingTeacherAssignment.value = true
  updatingTeacherAssignmentId.value = teacherId
  try {
    await axios.put(`${resolveApiBaseUrl()}/headteacher/teachers/${encodeURIComponent(teacherId)}`, {
      status: teacher.status || 'active',
      subject: teacher.subject || departmentLabel.value,
      advisorySectionId: advisorySectionId || '',
    }, getAuthConfig())

    assignmentMessage.value = advisorySectionId
      ? 'Advisory section assigned successfully.'
      : 'Advisory section cleared successfully.'
    assignmentMessageType.value = 'success'

    await fetchTeachers()

    if (selectedTeacher.value?.id === teacherId && isStudentsModalOpen.value) {
      await openTeacherStudents({
        ...selectedTeacher.value,
        advisorySectionId: advisorySectionId || '',
      })
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to save advisory assignment.'
    assignmentMessage.value = message
    assignmentMessageType.value = 'error'
    setTeacherAssignmentDraft(teacherId, teacher.advisorySectionId || '')
    if (selectedTeacher.value?.id === teacherId) {
      studentsErrorMessage.value = message
    }
  } finally {
    isUpdatingTeacherAssignment.value = false
    updatingTeacherAssignmentId.value = ''
  }
}

const saveTeacherAssignment = async (teacher) => {
  const teacherId = normalizeTeacherId(teacher)
  if (!teacherId) return

  const advisorySectionId = getTeacherAssignmentDraft(teacherId)
  await persistTeacherAssignment(teacher, advisorySectionId)
}

onMounted(() => {
  document.addEventListener('click', handleAccountMenuClickOutside)
  fetchTeachers()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
})
</script>

<style scoped>
.headteacher-attendance-section {
  margin-top: 0.95rem;
}

.headteacher-attendance-section > .headteacher-section-head {
  margin-bottom: 1rem;
}

.headteacher-attendance-cell {
  display: grid;
  gap: 0.18rem;
}

.headteacher-attendance-cell strong {
  color: #0f172a;
}

.headteacher-attendance-cell small {
  color: #64748b;
}

.headteacher-attendance-list {
  display: grid;
  gap: 0.85rem;
}

.headteacher-attendance-card {
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 0.95rem 1rem;
  display: grid;
  gap: 0.65rem;
}

.headteacher-attendance-card-interactive {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.headteacher-attendance-card-interactive:hover {
  transform: translateY(-2px);
  border-color: #93c5fd;
  box-shadow: 0 18px 32px rgba(37, 99, 235, 0.12);
}

.headteacher-attendance-card-interactive:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.28);
  outline-offset: 2px;
}

.headteacher-attendance-card-top {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.8rem;
}

.headteacher-attendance-card-top strong {
  display: block;
  color: #0f172a;
}

.headteacher-attendance-card-top small {
  color: #64748b;
}

.headteacher-attendance-stat-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
}

.headteacher-attendance-card-hint {
  margin: 0;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 700;
}

.headteacher-attendance-card-note,
.headteacher-attendance-section-copy {
  margin: 0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
}

.headteacher-attendance-modal {
  width: min(1080px, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  overflow: auto;
}

.headteacher-attendance-modal-head {
  align-items: start;
  gap: 1rem;
}

.headteacher-attendance-title-block {
  display: grid;
  gap: 0.45rem;
}

.headteacher-attendance-title-block h3 {
  margin: 0;
  color: #0f172a;
}

.headteacher-attendance-title-block p {
  margin: 0;
  color: #64748b;
}

.headteacher-attendance-eyebrow {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  padding: 0.32rem 0.72rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.headteacher-attendance-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  flex: 1;
}

.headteacher-attendance-summary-card {
  border: 1px solid #dbe4ef;
  border-radius: 16px;
  padding: 0.85rem 0.95rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: grid;
  gap: 0.3rem;
}

.headteacher-attendance-summary-card span {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.headteacher-attendance-summary-card strong {
  color: #0f172a;
  font-size: 1.4rem;
  line-height: 1;
}

.headteacher-attendance-summary-card.status-present {
  background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
}

.headteacher-attendance-summary-card.status-late {
  background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%);
}

.headteacher-attendance-summary-card.status-absent {
  background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%);
}

.headteacher-attendance-summary-card.status-excused {
  background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
}

.headteacher-attendance-modal-state {
  margin-top: 0.5rem;
}

.headteacher-attendance-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.headteacher-attendance-group {
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  padding: 1rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: grid;
  gap: 0.9rem;
}

.headteacher-attendance-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.headteacher-attendance-group-head strong {
  color: #0f172a;
}

.headteacher-attendance-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.38rem 0.78rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.headteacher-attendance-status-pill.status-present {
  background: #dcfce7;
  color: #166534;
}

.headteacher-attendance-status-pill.status-late {
  background: #ffedd5;
  color: #9a3412;
}

.headteacher-attendance-status-pill.status-absent {
  background: #fee2e2;
  color: #991b1b;
}

.headteacher-attendance-status-pill.status-excused {
  background: #dbeafe;
  color: #1d4ed8;
}

.headteacher-attendance-group-empty {
  color: #64748b;
  font-size: 0.88rem;
}

.headteacher-attendance-group-list {
  display: grid;
  gap: 0.75rem;
}

.headteacher-attendance-student-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.8rem 0.85rem;
}

.headteacher-attendance-student-copy {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.headteacher-attendance-student-copy strong {
  color: #0f172a;
}

.headteacher-attendance-student-copy small {
  color: #64748b;
  word-break: break-word;
}

.headteacher-attendance-student-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
}

.headteacher-attendance-meta-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.32rem 0.65rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 700;
}

.headteacher-mobile-card {
  gap: 1rem;
  border-radius: 22px;
  border: 1px solid #dbe4ef;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.headteacher-mobile-identity {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.headteacher-mobile-top {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.9rem;
}

.headteacher-mobile-copy {
  min-width: 0;
  display: grid;
  gap: 0.18rem;
}

.headteacher-mobile-copy strong {
  color: #0f172a;
  font-size: 1rem;
}

.headteacher-mobile-copy .headteacher-email-link {
  word-break: break-word;
}

.headteacher-mobile-date-chip {
  display: grid;
  gap: 0.12rem;
  min-width: fit-content;
  padding: 0.5rem 0.72rem;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: rgba(239, 246, 255, 0.9);
  text-align: right;
}

.headteacher-mobile-date-chip span {
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.headteacher-mobile-date-chip strong {
  color: #0f172a;
  font-size: 0.8rem;
}

.headteacher-mobile-badges-primary {
  gap: 0.45rem;
}

.headteacher-subject-badge {
  background: #eef2ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

.headteacher-mobile-assignment-card {
  display: grid;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border: 1px solid #dbe4ef;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.headteacher-mobile-assignment-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.8rem;
}

.headteacher-mobile-kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.26rem 0.58rem;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.headteacher-mobile-assignment-head h4 {
  margin: 0.4rem 0 0;
  color: #0f172a;
  font-size: 0.96rem;
}

.headteacher-assignment-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0.35rem 0.72rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  white-space: nowrap;
}

.headteacher-assignment-state.assigned {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.headteacher-assignment-state.unassigned {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.headteacher-mobile-assignment-copy {
  margin: 0;
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.45;
}

.headteacher-mobile-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.headteacher-mobile-stat-card {
  display: grid;
  gap: 0.22rem;
  padding: 0.8rem 0.88rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.86);
}

.headteacher-mobile-stat-card span {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.headteacher-mobile-stat-card strong {
  color: #0f172a;
  font-size: 0.82rem;
  line-height: 1.4;
}

.headteacher-directory-feedback {
  margin: 0 0 1rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  border: 1px solid transparent;
  font-size: 0.88rem;
  font-weight: 700;
}

.headteacher-directory-feedback.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.headteacher-directory-feedback.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.headteacher-assignment-cell,
.headteacher-mobile-assignment {
  display: grid;
  gap: 0.45rem;
}

.headteacher-inline-select {
  width: 100%;
  min-height: 40px;
  padding: 0.62rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 600;
}

.headteacher-inline-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
}

.headteacher-inline-select:disabled {
  background: #f8fafc;
  color: #94a3b8;
}

.headteacher-row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.headteacher-mobile-actions {
  margin-top: 0.1rem;
}

.headteacher-save-section-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.headteacher-mobile-hint {
  margin: 0;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 600;
  text-align: center;
}

@media (max-width: 640px) {
  .headteacher-mobile-top,
  .headteacher-attendance-card-top {
    flex-direction: column;
  }

  .headteacher-attendance-summary-cards,
  .headteacher-mobile-stats,
  .headteacher-attendance-groups {
    grid-template-columns: 1fr;
  }

  .headteacher-attendance-student-row {
    flex-direction: column;
  }

  .headteacher-attendance-student-meta {
    justify-content: flex-start;
  }

  .headteacher-mobile-date-chip {
    width: 100%;
    text-align: left;
  }

  .headteacher-mobile-assignment-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .headteacher-row-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
