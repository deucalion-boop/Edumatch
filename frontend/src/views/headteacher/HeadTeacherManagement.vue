<template>
  <div class="headteacher-workspace headteacher-dashboard-page headteacher-content-page">
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
            <div class="headteacher-management-header-copy headteacher-matched-header-copy">
              <h1>Teacher Management</h1>
              <p class="headteacher-header-subtitle">Manage teacher accounts, statuses, and access for the {{ departmentLabel }} department.</p>
            </div>
          </div>

          <div class="headteacher-header-tools">
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

      <section
        ref="directorySectionRef"
        class="headteacher-section-card headteacher-panel headteacher-content-card headteacher-directory-section headteacher-directory-enterprise"
        :class="{
          'is-loading-directory': isLoading,
          'is-empty-directory': !isLoading && teachers.length === 0,
        }"
      >
        <div class="headteacher-section-head headteacher-directory-head">
          <div class="headteacher-directory-heading">
            <h2 class="headteacher-section-title">Teacher Directory</h2>
            <p class="headteacher-section-subtitle">Manage faculty accounts, access, and advisory assignments for {{ departmentLabel }}.</p>
          </div>
          <button
            v-if="!isLoading && teachers.length > 0"
            type="button"
            class="headteacher-button headteacher-button-primary headteacher-directory-create-btn headteacher-directory-cta"
            @click="isCreateModalOpen = true"
          >
            <span class="headteacher-directory-create-icon">
              <i class="fas fa-user-plus"></i>
            </span>
            <span class="headteacher-directory-create-copy">
              <strong>Create Teacher</strong>
            </span>
          </button>
        </div>

        <div v-if="!isLoading && teachers.length > 0" class="headteacher-directory-summary" aria-label="Teacher account summary">
          <article
            v-for="stat in directoryStats"
            :key="stat.key"
            class="headteacher-directory-summary-card"
            :class="`is-${stat.key}`"
          >
            <span class="headteacher-directory-summary-icon">
              <i class="fas" :class="stat.icon"></i>
            </span>
            <div>
              <span>{{ stat.label }}</span>
              <strong>{{ stat.value }}</strong>
            </div>
          </article>
        </div>

        <div v-if="!isLoading && teachers.length > 0" class="headteacher-directory-toolbar">
          <div class="headteacher-directory-toolbar-main">
            <label class="headteacher-directory-search">
              <span class="headteacher-sr-only">Search teachers</span>
              <i class="fas fa-search"></i>
              <input
                v-model.trim="filters.search"
                type="search"
                placeholder="Search teachers by name, email, department, or section"
              >
              <button
                v-if="filters.search"
                type="button"
                class="headteacher-directory-clear-search"
                aria-label="Clear teacher search"
                title="Clear search"
                @click="filters.search = ''"
              >
                <i class="fas fa-times"></i>
              </button>
            </label>

            <label class="headteacher-directory-sort">
              <span>Sort by</span>
              <select v-model="filters.sort">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
              </select>
            </label>
          </div>

          <div class="headteacher-directory-toolbar-secondary">
            <div class="headteacher-directory-filter-chips" aria-label="Filter teachers by status">
              <button
                v-for="statusOption in directoryStatusFilters"
                :key="statusOption.value"
                type="button"
                class="headteacher-directory-filter-chip"
                :class="{ active: filters.status === statusOption.value }"
                :aria-pressed="filters.status === statusOption.value"
                @click="filters.status = statusOption.value"
              >
                <span class="headteacher-directory-filter-dot" :class="`is-${statusOption.value}`"></span>
                {{ statusOption.label }}
                <strong>{{ statusOption.count }}</strong>
              </button>
            </div>

            <div class="headteacher-directory-toolbar-meta">
              <span><strong>{{ filteredTeachers.length }}</strong> of {{ teachers.length }} teachers</span>
              <button
                v-if="hasActiveDirectoryFilters"
                type="button"
                class="headteacher-directory-reset"
                @click="resetDirectoryFilters"
              >
                <i class="fas fa-rotate-left"></i>
                Reset filters
              </button>
            </div>
          </div>
        </div>

        <p
          v-if="assignmentMessage"
          class="headteacher-directory-feedback"
          :class="assignmentMessageType === 'error' ? 'error' : 'success'"
        >
          {{ assignmentMessage }}
        </p>

        <div v-if="isLoading" class="headteacher-directory-loading" role="status" aria-live="polite">
          <span class="headteacher-directory-loading-icon" aria-hidden="true">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <div>
            <strong>Loading teacher directory</strong>
            <p>Preparing faculty accounts and advisory assignments.</p>
          </div>
        </div>

        <div v-else class="headteacher-table-shell headteacher-data-table">
          <div
            class="headteacher-table-wrap"
            :class="{
              'is-empty': !isLoading && paginatedTeachers.length === 0,
              'is-zero-state': !isLoading && teachers.length === 0,
            }"
          >
            <table class="headteacher-table">
              <thead v-if="teachers.length > 0">
                <tr>
                  <th>Profile</th>
                  <th :aria-sort="getDirectoryAriaSort('name')">
                    <button type="button" class="headteacher-directory-sort-button" @click="toggleDirectorySort('name')">
                      Name
                      <i class="fas" :class="getDirectorySortIcon('name')"></i>
                    </button>
                  </th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Advisory Section</th>
                  <th>Status</th>
                  <th :aria-sort="getDirectoryAriaSort('date')">
                    <button type="button" class="headteacher-directory-sort-button" @click="toggleDirectorySort('date')">
                      Date Created
                      <i class="fas" :class="getDirectorySortIcon('date')"></i>
                    </button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody v-if="paginatedTeachers.length === 0">
                <tr>
                  <td class="headteacher-directory-empty-cell" colspan="8">
                    <div class="headteacher-directory-empty">
                      <div class="headteacher-directory-empty-illustration" aria-hidden="true">
                        <span class="headteacher-empty-orbit headteacher-empty-orbit-one"></span>
                        <span class="headteacher-empty-orbit headteacher-empty-orbit-two"></span>
                        <i class="fas fa-users"></i>
                      </div>
                      <h3>{{ teachers.length === 0 ? 'Create your first teacher account' : 'No teachers match these filters' }}</h3>
                      <p>
                        {{ teachers.length === 0
                          ? `Add a teacher to ${departmentLabel} and start assigning advisory sections.`
                          : 'Try a different search term or clear the active filters to see more teachers.' }}
                      </p>
                      <button
                        type="button"
                        class="headteacher-button headteacher-button-primary headteacher-directory-empty-action"
                        @click="teachers.length === 0 ? (isCreateModalOpen = true) : resetDirectoryFilters()"
                      >
                        <i class="fas" :class="teachers.length === 0 ? 'fa-user-plus' : 'fa-rotate-left'"></i>
                        {{ teachers.length === 0 ? 'Create Your First Teacher' : 'Reset Filters' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>

              <tbody v-else>
                <tr
                  v-for="teacher in paginatedTeachers"
                  :key="teacher.id"
                  class="headteacher-table-row headteacher-table-row-interactive headteacher-directory-result-item"
                  role="button"
                  tabindex="0"
                  @click="openTeacherStudents(teacher)"
                  @keydown.enter.self.prevent="openTeacherStudents(teacher)"
                  @keydown.space.self.prevent="openTeacherStudents(teacher)"
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
                    <span class="headteacher-badge headteacher-department-badge">{{ teacher.department }}</span>
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
                    <span class="headteacher-badge headteacher-status-badge" :class="`status-${normalizeStatus(teacher.status)}`">
                      <i class="fas" :class="getStatusIcon(teacher.status)"></i>
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
                        class="headteacher-directory-action-btn is-save"
                        :disabled="isUpdatingTeacherAssignment || !hasTeacherAssignmentChanged(teacher)"
                        :aria-label="`Save advisory section for ${teacher.name}`"
                        title="Save advisory section"
                        @click.stop="saveTeacherAssignment(teacher)"
                      >
                        <i class="fas" :class="isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                      </button>
                      <button
                        type="button"
                        class="headteacher-directory-action-btn"
                        :class="teacher.status === 'active' ? 'is-deactivate' : 'is-activate'"
                        :aria-label="`${teacher.status === 'active' ? 'Set inactive' : 'Set active'}: ${teacher.name}`"
                        :title="teacher.status === 'active' ? 'Set teacher inactive' : 'Set teacher active'"
                        @click.stop="updateStatus(teacher, teacher.status === 'active' ? 'inactive' : 'active')"
                      >
                        <i class="fas" :class="teacher.status === 'active' ? 'fa-user-slash' : 'fa-user-check'"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="headteacher-mobile-list">
            <div v-if="isLoading" class="headteacher-directory-mobile-skeletons" aria-label="Loading teachers">
              <article v-for="index in 3" :key="`mobile-teacher-skeleton-${index}`" class="headteacher-directory-mobile-skeleton">
                <div class="headteacher-directory-mobile-skeleton-head">
                  <span class="headteacher-directory-skeleton headteacher-skeleton-avatar"></span>
                  <div>
                    <span class="headteacher-directory-skeleton headteacher-skeleton-name"></span>
                    <span class="headteacher-directory-skeleton headteacher-skeleton-email"></span>
                  </div>
                </div>
                <span class="headteacher-directory-skeleton headteacher-skeleton-mobile-block"></span>
                <span class="headteacher-directory-skeleton headteacher-skeleton-mobile-action"></span>
              </article>
            </div>

            <div v-else-if="paginatedTeachers.length === 0" class="headteacher-directory-empty is-mobile">
              <div class="headteacher-directory-empty-illustration" aria-hidden="true">
                <span class="headteacher-empty-orbit headteacher-empty-orbit-one"></span>
                <span class="headteacher-empty-orbit headteacher-empty-orbit-two"></span>
                <i class="fas fa-users"></i>
              </div>
              <h3>{{ teachers.length === 0 ? 'Create your first teacher account' : 'No teachers match these filters' }}</h3>
              <p>{{ teachers.length === 0 ? `Start building the ${departmentLabel} faculty directory.` : 'Clear the active filters and try again.' }}</p>
              <button
                type="button"
                class="headteacher-button headteacher-button-primary headteacher-directory-empty-action"
                @click="teachers.length === 0 ? (isCreateModalOpen = true) : resetDirectoryFilters()"
              >
                <i class="fas" :class="teachers.length === 0 ? 'fa-user-plus' : 'fa-rotate-left'"></i>
                {{ teachers.length === 0 ? 'Create Your First Teacher' : 'Reset Filters' }}
              </button>
            </div>

            <article
              v-else
              v-for="teacher in paginatedTeachers"
              :key="`mobile-${teacher.id}`"
              class="headteacher-mobile-card headteacher-mobile-card-interactive headteacher-directory-result-item"
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
                <span class="headteacher-badge headteacher-department-badge">{{ teacher.department }}</span>
                <span class="headteacher-badge headteacher-status-badge" :class="`status-${normalizeStatus(teacher.status)}`">
                  <i class="fas" :class="getStatusIcon(teacher.status)"></i>
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
                  class="headteacher-button headteacher-button-primary headteacher-button-sm headteacher-save-section-btn"
                  :disabled="isUpdatingTeacherAssignment || !hasTeacherAssignmentChanged(teacher)"
                  @click.stop="saveTeacherAssignment(teacher)"
                >
                  <i class="fas" :class="isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                  {{ isUpdatingTeacherAssignment && updatingTeacherAssignmentId === teacher.id ? 'Saving...' : 'Save Section' }}
                </button>
                <button type="button" class="headteacher-button headteacher-button-outline headteacher-button-sm" @click.stop="updateStatus(teacher, teacher.status === 'active' ? 'inactive' : 'active')">
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

      <section class="headteacher-section-card headteacher-panel headteacher-content-card headteacher-directory-section headteacher-attendance-section">
        <div class="headteacher-section-head">
          <div>
            <h2 class="headteacher-section-title">Department Attendance Monitoring</h2>
            <p class="headteacher-section-subtitle">Recent attendance records for teachers managed inside {{ departmentLabel }}.</p>
          </div>
        </div>

        <div v-if="isLoading" class="headteacher-table-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading attendance overview...</span>
        </div>

        <div v-else-if="recentAttendanceRecords.length === 0" class="headteacher-table-state">
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
              <span class="headteacher-badge headteacher-status-badge" :class="record.isLocked ? 'status-active' : 'status-inactive'">
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

      <div v-if="isAttendanceModalOpen" class="headteacher-modal-shell" @click.self="closeAttendanceModal">
        <div class="headteacher-modal-panel headteacher-attendance-modal">
          <div class="headteacher-modal-head headteacher-attendance-modal-head">
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

            <button type="button" class="headteacher-modal-close headteacher-attendance-close-btn" @click="closeAttendanceModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div v-if="selectedAttendanceEntries.length === 0" class="headteacher-table-state headteacher-attendance-modal-state">
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

      <div v-if="isCreateModalOpen" class="headteacher-modal-shell" @click.self="closeModal">
        <div class="headteacher-modal-panel">
          <div class="headteacher-modal-head">
            <div>
              <h3>Create Teacher Account</h3>
              <p>Teachers created here are assigned to {{ departmentLabel }}.</p>
            </div>
            <button type="button" class="headteacher-modal-close" @click="closeModal">
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

            <div class="headteacher-modal-actions">
              <button type="button" class="headteacher-button headteacher-button-outline" @click="closeModal">Cancel</button>
              <button type="submit" class="headteacher-button headteacher-button-primary" :disabled="isSubmitting">
                <i class="fas" :class="isSubmitting ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                {{ isSubmitting ? 'Saving...' : 'Create Teacher & Email Credentials' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="isStudentsModalOpen" class="headteacher-modal-shell" @click.self="closeStudentsModal">
        <div class="headteacher-modal-panel headteacher-students-modal">
          <div class="headteacher-modal-head headteacher-students-modal-head">
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
            <button type="button" class="headteacher-modal-close headteacher-students-close-btn" @click="closeStudentsModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div v-if="isStudentsLoading" class="headteacher-table-state headteacher-students-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading students...</span>
          </div>

          <div v-else-if="studentsErrorMessage" class="headteacher-table-state headteacher-students-state">
            <i class="fas fa-circle-exclamation"></i>
            <span>{{ studentsErrorMessage }}</span>
          </div>

          <div v-else-if="selectedTeacherStudents.length === 0" class="headteacher-table-state headteacher-students-state">
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
                      <span class="headteacher-badge headteacher-department-badge">{{ student.sectionName || 'No section' }}</span>
                    </td>
                    <td>
                      <span class="headteacher-badge headteacher-department-badge">{{ student.gradeLevel || 'Not set' }}</span>
                    </td>
                    <td>
                      <span class="headteacher-badge headteacher-status-badge" :class="`status-${normalizeStatus(student.status)}`">
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
                  <span class="headteacher-badge headteacher-department-badge">{{ student.sectionName || 'No section' }}</span>
                  <span class="headteacher-badge headteacher-department-badge">{{ student.gradeLevel || 'Not set' }}</span>
                  <span class="headteacher-badge headteacher-status-badge" :class="`status-${normalizeStatus(student.status)}`">
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
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import gsap from 'gsap'
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
const directorySectionRef = ref(null)
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

const getStatusIcon = (status) => ({
  active: 'fa-circle-check',
  pending: 'fa-clock',
  suspended: 'fa-shield-halved',
  inactive: 'fa-circle-minus',
}[normalizeStatus(status)] || 'fa-circle-minus')

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

const countTeachersByStatus = (status) => teachers.value.filter(
  (teacher) => normalizeStatus(teacher.status) === status
).length

const directoryStats = computed(() => [
  {
    key: 'total',
    label: 'Total Teachers',
    value: teachers.value.length,
    icon: 'fa-users',
  },
  {
    key: 'active',
    label: 'Active',
    value: countTeachersByStatus('active'),
    icon: 'fa-user-check',
  },
  {
    key: 'pending',
    label: 'Pending',
    value: countTeachersByStatus('pending'),
    icon: 'fa-user-clock',
  },
  {
    key: 'inactive',
    label: 'Inactive',
    value: countTeachersByStatus('inactive'),
    icon: 'fa-user-slash',
  },
])

const directoryStatusFilters = computed(() => [
  { value: 'all', label: 'All', count: teachers.value.length },
  { value: 'active', label: 'Active', count: countTeachersByStatus('active') },
  { value: 'pending', label: 'Pending', count: countTeachersByStatus('pending') },
  { value: 'inactive', label: 'Inactive', count: countTeachersByStatus('inactive') },
  { value: 'suspended', label: 'Suspended', count: countTeachersByStatus('suspended') },
])

const hasActiveDirectoryFilters = computed(() => (
  Boolean(String(filters.search || '').trim())
  || filters.status !== 'all'
  || filters.sort !== 'newest'
))

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

const resetDirectoryFilters = () => {
  filters.search = ''
  filters.status = 'all'
  filters.sort = 'newest'
}

const toggleDirectorySort = (column) => {
  if (column === 'name') {
    filters.sort = filters.sort === 'name-asc' ? 'name-desc' : 'name-asc'
    return
  }

  filters.sort = filters.sort === 'newest' ? 'oldest' : 'newest'
}

const getDirectorySortIcon = (column) => {
  if (column === 'name') {
    if (filters.sort === 'name-asc') return 'fa-arrow-up-a-z'
    if (filters.sort === 'name-desc') return 'fa-arrow-down-z-a'
    return 'fa-sort'
  }

  if (filters.sort === 'newest') return 'fa-arrow-down-wide-short'
  if (filters.sort === 'oldest') return 'fa-arrow-up-wide-short'
  return 'fa-sort'
}

const getDirectoryAriaSort = (column) => {
  if (column === 'name') {
    if (filters.sort === 'name-asc') return 'ascending'
    if (filters.sort === 'name-desc') return 'descending'
    return 'none'
  }

  if (filters.sort === 'oldest') return 'ascending'
  if (filters.sort === 'newest') return 'descending'
  return 'none'
}

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
)

const animateDirectoryResults = async () => {
  await nextTick()
  const root = directorySectionRef.value
  if (!root || prefersReducedMotion()) return

  const targets = root.querySelectorAll('.headteacher-directory-result-item')
  if (!targets.length) return

  gsap.killTweensOf(targets)
  gsap.fromTo(
    targets,
    { autoAlpha: 0, y: 10 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.32,
      stagger: 0.035,
      ease: 'power2.out',
      clearProps: 'transform,opacity,visibility',
    },
  )
}

const animateDirectoryEntrance = async () => {
  await nextTick()
  const root = directorySectionRef.value
  if (!root || prefersReducedMotion()) return

  const targets = root.querySelectorAll(
    '.headteacher-directory-head, .headteacher-directory-summary-card, .headteacher-directory-toolbar, .headteacher-table-shell'
  )
  gsap.fromTo(
    targets,
    { autoAlpha: 0, y: 14 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.45,
      stagger: 0.055,
      ease: 'power2.out',
      clearProps: 'transform,opacity,visibility',
    },
  )
}

watch(filters, () => {
  currentPage.value = 1
  animateDirectoryResults()
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
    animateDirectoryResults()
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
  animateDirectoryEntrance()
  fetchTeachers()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleAccountMenuClickOutside)
  if (directorySectionRef.value) {
    gsap.killTweensOf(directorySectionRef.value.querySelectorAll('*'))
  }
})
</script>

<style scoped>
.headteacher-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.headteacher-directory-enterprise {
  --directory-navy: #0f172a;
  --directory-copy: #475569;
  --directory-muted: #64748b;
  --directory-line: #e2e8f0;
  --directory-blue: #2563eb;
  position: relative;
  overflow: hidden;
  padding: clamp(1rem, 2vw, 1.6rem);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
    radial-gradient(circle at 96% 0%, rgba(59, 130, 246, 0.09), transparent 25%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 22px 52px rgba(15, 23, 42, 0.09);
}

.headteacher-directory-enterprise .headteacher-directory-head {
  align-items: center;
  margin-bottom: 1.25rem;
}

.headteacher-directory-enterprise.is-empty-directory .headteacher-directory-head {
  margin-bottom: 0.85rem;
}

.headteacher-directory-enterprise .headteacher-section-title {
  margin: 0;
  color: var(--directory-navy);
  font-size: clamp(1.35rem, 2.4vw, 1.9rem);
  font-weight: 750;
  letter-spacing: -0.035em;
}

.headteacher-directory-enterprise .headteacher-section-subtitle {
  max-width: 650px;
  margin-top: 0.45rem;
  color: var(--directory-muted);
  font-size: 0.9rem;
  line-height: 1.55;
}

.headteacher-directory-enterprise .headteacher-directory-cta {
  min-width: 158px;
  min-height: 44px;
  padding: 0.4rem 0.7rem;
  border: 0;
  border-radius: 14px;
  background: #245b13;
  box-shadow: 0 10px 22px rgba(36, 91, 19, 0.22);
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.headteacher-directory-enterprise .headteacher-directory-cta:hover {
  background: #1e4307;
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(36, 91, 19, 0.28);
}

.headteacher-directory-enterprise .headteacher-directory-cta:focus-visible {
  outline: 3px solid rgba(36, 91, 19, 0.24);
  outline-offset: 3px;
}

.headteacher-directory-enterprise .headteacher-directory-create-icon {
  width: 32px;
  height: 32px;
  flex-basis: 32px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.85rem;
}

.headteacher-directory-enterprise .headteacher-directory-create-copy strong {
  font-size: 0.84rem;
}

.headteacher-directory-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.headteacher-directory-summary-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.9rem;
  border: 1px solid var(--directory-line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.headteacher-directory-summary-card:hover {
  transform: translateY(-2px);
  border-color: #bfdbfe;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.headteacher-directory-summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
}

.headteacher-directory-summary-card > div {
  display: grid;
  gap: 0.18rem;
  min-width: 0;
}

.headteacher-directory-summary-card > div > span {
  overflow: hidden;
  color: var(--directory-muted);
  font-size: 0.69rem;
  font-weight: 750;
  letter-spacing: 0.055em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.headteacher-directory-summary-card strong {
  color: var(--directory-navy);
  font-size: 1.35rem;
  line-height: 1;
}

.headteacher-directory-summary-card.is-active .headteacher-directory-summary-icon {
  background: #ecfdf3;
  color: #15803d;
}

.headteacher-directory-summary-card.is-pending .headteacher-directory-summary-icon {
  background: #fff7ed;
  color: #c2410c;
}

.headteacher-directory-summary-card.is-inactive .headteacher-directory-summary-icon {
  background: #f1f5f9;
  color: #64748b;
}

.headteacher-directory-toolbar {
  display: grid;
  gap: 0.85rem;
  margin-bottom: 1rem;
  padding: 0.9rem;
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.88);
}

.headteacher-directory-toolbar-main {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(180px, 220px);
  gap: 0.75rem;
}

.headteacher-directory-search {
  position: relative;
  display: flex;
  align-items: center;
}

.headteacher-directory-search > i {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  pointer-events: none;
}

.headteacher-directory-search input {
  width: 100%;
  min-height: 48px;
  padding: 0.72rem 2.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 15px;
  background: #ffffff;
  color: var(--directory-navy);
  font-size: 0.88rem;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.headteacher-directory-search input:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.headteacher-directory-clear-search {
  position: absolute;
  right: 0.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
}

.headteacher-directory-sort {
  display: grid;
  gap: 0.32rem;
}

.headteacher-directory-sort > span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.headteacher-directory-sort select {
  width: 100%;
  min-height: 48px;
  padding: 0.72rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 15px;
  background: #ffffff;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 650;
}

.headteacher-directory-sort select:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.headteacher-directory-toolbar-secondary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
}

.headteacher-directory-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.headteacher-directory-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.38rem;
  min-height: 34px;
  padding: 0.4rem 0.68rem;
  border: 1px solid #dbe3ec;
  border-radius: 999px;
  background: #ffffff;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 650;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
}

.headteacher-directory-filter-chip:hover {
  transform: translateY(-1px);
  border-color: #93c5fd;
}

.headteacher-directory-filter-chip.active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.headteacher-directory-filter-chip:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.18);
  outline-offset: 2px;
}

.headteacher-directory-filter-chip strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.66rem;
}

.headteacher-directory-filter-chip.active strong {
  background: #dbeafe;
  color: #1d4ed8;
}

.headteacher-directory-filter-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}

.headteacher-directory-filter-dot.is-active {
  background: #22c55e;
}

.headteacher-directory-filter-dot.is-pending {
  background: #f59e0b;
}

.headteacher-directory-filter-dot.is-inactive {
  background: #94a3b8;
}

.headteacher-directory-filter-dot.is-suspended {
  background: #ef4444;
}

.headteacher-directory-toolbar-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  color: var(--directory-muted);
  font-size: 0.76rem;
  white-space: nowrap;
}

.headteacher-directory-toolbar-meta strong {
  color: var(--directory-navy);
}

.headteacher-directory-reset {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 34px;
  padding: 0.4rem 0.65rem;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.headteacher-directory-reset:hover {
  background: #eff6ff;
}

.headteacher-directory-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  min-height: 240px;
  padding: 1.5rem;
  border: 1px solid #dbe3ec;
  border-radius: 20px;
  background: #ffffff;
  color: var(--directory-navy);
  text-align: left;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
}

.headteacher-directory-loading-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 16px;
  background: linear-gradient(145deg, #f0fdf4, #dcfce7);
  color: #15803d;
  font-size: 1.15rem;
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.18);
}

.headteacher-directory-loading strong {
  display: block;
  font-size: 0.95rem;
}

.headteacher-directory-loading p {
  margin: 0.3rem 0 0;
  color: var(--directory-muted);
  font-size: 0.8rem;
}

.headteacher-directory-enterprise .headteacher-table-shell {
  overflow: hidden;
  border: 1px solid #dbe3ec;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}

.headteacher-directory-enterprise .headteacher-table-wrap {
  max-height: min(620px, calc(100vh - 190px));
  overflow: auto;
}

.headteacher-directory-enterprise .headteacher-table-wrap.is-empty {
  max-height: none;
  overflow-x: auto;
  overflow-y: visible;
}

.headteacher-directory-enterprise .headteacher-table-wrap.is-zero-state {
  overflow: hidden;
}

.headteacher-directory-enterprise .headteacher-table-wrap.is-zero-state .headteacher-table {
  min-width: 0;
  table-layout: fixed;
}

.headteacher-directory-enterprise .headteacher-table {
  min-width: 1120px;
}

.headteacher-directory-enterprise .headteacher-table thead th {
  top: 0;
  z-index: 4;
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid #dbe3ec;
  background: rgba(248, 250, 252, 0.98);
  color: #526170;
  font-size: 0.66rem;
  letter-spacing: 0.075em;
  backdrop-filter: blur(10px);
}

.headteacher-directory-sort-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  cursor: pointer;
}

.headteacher-directory-sort-button i {
  color: #94a3b8;
  font-size: 0.65rem;
}

.headteacher-directory-enterprise .headteacher-table tbody td {
  padding: 0.85rem 0.9rem;
  background: #ffffff;
  transition: background-color 0.18s ease;
}

.headteacher-directory-enterprise .headteacher-table tbody tr:nth-child(even) td {
  background: #fbfdff;
}

.headteacher-directory-enterprise .headteacher-table-row-interactive {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.headteacher-directory-enterprise .headteacher-table-row-interactive:hover {
  position: relative;
  z-index: 2;
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(37, 99, 235, 0.08);
}

.headteacher-directory-enterprise .headteacher-table-row-interactive:hover td {
  background: #f0f7ff;
}

.headteacher-directory-enterprise .headteacher-avatar {
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;
  border: 2px solid #ffffff;
  outline: 2px solid #dbeafe;
  box-shadow: 0 7px 16px rgba(15, 23, 42, 0.1);
}

.headteacher-directory-enterprise .headteacher-name-cell strong {
  font-size: 0.88rem;
  font-weight: 700;
}

.headteacher-directory-enterprise .headteacher-email-link {
  color: #334155;
  font-size: 0.82rem;
}

.headteacher-directory-enterprise .headteacher-badge {
  gap: 0.35rem;
  min-height: 30px;
  padding: 0.35rem 0.62rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 750;
}

.headteacher-directory-enterprise .headteacher-status-badge.status-active {
  border-color: #bbf7d0;
  background: #ecfdf3;
  color: #166534;
}

.headteacher-directory-enterprise .headteacher-status-badge.status-pending {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #9a3412;
}

.headteacher-directory-enterprise .headteacher-status-badge.status-inactive {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #475569;
}

.headteacher-directory-enterprise .headteacher-status-badge.status-suspended {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.headteacher-directory-enterprise .headteacher-inline-select {
  min-height: 38px;
  border-radius: 11px;
  font-size: 0.76rem;
}

.headteacher-directory-enterprise .headteacher-row-actions {
  flex-wrap: nowrap;
}

.headteacher-directory-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #dbe3ec;
  border-radius: 11px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease, color 0.16s ease;
}

.headteacher-directory-action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.headteacher-directory-action-btn.is-save {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.headteacher-directory-action-btn.is-activate {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.headteacher-directory-action-btn.is-deactivate {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}

.headteacher-directory-action-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.headteacher-directory-skeleton {
  display: block;
  position: relative;
  overflow: hidden;
  height: 12px;
  border-radius: 999px;
  background: #e8edf3;
}

.headteacher-directory-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.82), transparent);
  animation: directory-shimmer 1.35s infinite;
}

.headteacher-directory-skeleton.headteacher-skeleton-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
}

.headteacher-directory-skeleton.headteacher-skeleton-name {
  width: 100px;
}

.headteacher-directory-skeleton.headteacher-skeleton-email {
  width: 145px;
}

.headteacher-directory-skeleton.skeleton-pill {
  width: 78px;
  height: 28px;
}

.headteacher-directory-skeleton.skeleton-select {
  width: 140px;
  height: 36px;
  border-radius: 10px;
}

.headteacher-directory-skeleton.skeleton-date {
  width: 76px;
}

.headteacher-directory-skeleton.skeleton-action {
  width: 78px;
  height: 34px;
  border-radius: 10px;
}

@keyframes directory-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.headteacher-directory-empty {
  display: grid;
  align-content: center;
  justify-items: center;
  max-width: 520px;
  min-height: clamp(240px, calc(100vh - 300px), 320px);
  margin: 0 auto;
  padding: 1rem 1.25rem 1.25rem;
  box-sizing: border-box;
  text-align: center;
}

.headteacher-directory-enterprise .headteacher-directory-empty-cell {
  padding: 0 !important;
}

.headteacher-directory-empty-illustration {
  position: relative;
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  margin-bottom: 0.65rem;
  border-radius: 24px;
  background: linear-gradient(145deg, #f0fdf4, #dcfce7);
  color: #245b13;
  font-size: 1.65rem;
  box-shadow: inset 0 0 0 1px rgba(36, 91, 19, 0.2), 0 18px 36px rgba(36, 91, 19, 0.12);
}

.headteacher-directory-empty-illustration i {
  position: relative;
  z-index: 2;
}

.headteacher-directory-empty-illustration .headteacher-empty-orbit {
  position: absolute;
  border: 1px solid rgba(36, 91, 19, 0.22);
  border-radius: 50%;
}

.headteacher-directory-empty-illustration .headteacher-empty-orbit-one {
  width: 52px;
  height: 52px;
}

.headteacher-directory-empty-illustration .headteacher-empty-orbit-two {
  width: 68px;
  height: 68px;
  border-style: dashed;
}

.headteacher-directory-empty h3 {
  margin: 0.32rem 0 0;
  color: var(--directory-navy);
  font-size: 1.1rem;
}

.headteacher-directory-empty p {
  margin: 0.4rem 0 0.75rem;
  color: var(--directory-muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

.headteacher-directory-empty-action {
  min-height: 42px;
  padding: 0.6rem 0.9rem;
  border-color: #245b13;
  border-radius: 13px;
  background: #245b13;
  color: #ffffff;
  font-size: 0.82rem;
  box-shadow: 0 12px 24px rgba(36, 91, 19, 0.22);
}

.headteacher-directory-empty-action:hover {
  border-color: #1b470e;
  background: #1b470e;
}

.headteacher-directory-mobile-skeletons {
  display: grid;
  gap: 0.85rem;
}

.headteacher-directory-mobile-skeleton {
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid #dbe3ec;
  border-radius: 20px;
  background: #ffffff;
}

.headteacher-directory-mobile-skeleton-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.headteacher-directory-mobile-skeleton-head > div {
  display: grid;
  gap: 0.5rem;
}

.headteacher-directory-skeleton.headteacher-skeleton-mobile-block,
.headteacher-directory-skeleton.headteacher-skeleton-mobile-action {
  width: 100%;
  height: 70px;
  border-radius: 14px;
}

.headteacher-directory-skeleton.headteacher-skeleton-mobile-action {
  height: 40px;
}

@media (max-width: 1100px) {
  .headteacher-directory-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .headteacher-directory-toolbar-secondary {
    align-items: flex-start;
    flex-direction: column;
  }

  .headteacher-directory-toolbar-meta {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .headteacher-directory-enterprise {
    padding: 1rem;
    border-radius: 22px;
  }

  .headteacher-directory-enterprise .headteacher-directory-head {
    align-items: stretch;
  }

  .headteacher-directory-enterprise .headteacher-directory-cta {
    width: 100%;
    min-width: 0;
  }

  .headteacher-directory-toolbar-main {
    grid-template-columns: 1fr;
  }

  .headteacher-directory-toolbar-meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .headteacher-directory-enterprise .headteacher-mobile-list {
    padding: 0.8rem;
  }

  .headteacher-directory-enterprise .headteacher-mobile-card {
    border-radius: 20px;
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.07);
  }

  .headteacher-directory-empty.is-mobile {
    padding: 1.5rem 1rem;
  }
}

@media (max-width: 480px) {
  .headteacher-directory-summary {
    gap: 0.55rem;
  }

  .headteacher-directory-summary-card {
    gap: 0.55rem;
    padding: 0.72rem;
    border-radius: 15px;
  }

  .headteacher-directory-summary-icon {
    width: 36px;
    height: 36px;
    flex-basis: 36px;
    border-radius: 12px;
  }

  .headteacher-directory-summary-card > div > span {
    font-size: 0.58rem;
  }

  .headteacher-directory-summary-card strong {
    font-size: 1.1rem;
  }

  .headteacher-directory-filter-chip {
    padding-inline: 0.55rem;
  }

  .headteacher-directory-empty-illustration {
    width: 76px;
    height: 76px;
    border-radius: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .headteacher-directory-enterprise *,
  .headteacher-directory-enterprise *::before,
  .headteacher-directory-enterprise *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

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
