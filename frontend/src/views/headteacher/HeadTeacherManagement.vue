<template>
  <div class="headteacher-workspace headteacher-dashboard-page headteacher-content-page headteacher-management-page">
    <HeadTeacherSidebar v-model:is-open="isSidebarOpen" :display-name="displayName" />

    <main class="headteacher-main headteacher-page-container">
      <header class="headteacher-top-header headteacher-matched-page-header">
        <div class="headteacher-header-content">
          <div class="headteacher-header-copy">
            <button type="button" class="headteacher-mobile-menu-toggle" @click="toggleSidebar" aria-label="Open sidebar" aria-controls="headteacher-sidebar-drawer" :aria-expanded="isSidebarOpen">
              <i class="fas fa-bars"></i>
            </button>
            <div class="headteacher-management-header-copy headteacher-matched-header-copy">
              <h1>Teacher Management</h1>
              <p class="headteacher-header-subtitle">Manage teacher accounts, statuses, and access for the {{ departmentLabel }} department.</p>
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

      <section class="headteacher-section-card headteacher-panel headteacher-content-card teacher-registration-panel">
        <StudentPrivateRegistration :api-base-url="resolveApiBaseUrl()" :auth-token="authStore.token || ''" teacher-registration @created="fetchTeachers" />
      </section>

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
            <p class="headteacher-section-subtitle">Manage faculty accounts, access, and advisory assignments for {{ departmentLabel }}. Sections already used by another subject or teacher are unavailable.</p>
          </div>
          <div v-if="!isLoading && teachers.length > 0" class="headteacher-directory-create-actions">
            <button
              type="button"
              class="headteacher-button headteacher-button-outline headteacher-directory-create-btn"
              @click="openStudentCreateModal()"
            >
              <i class="fas fa-user-graduate"></i>
              <span>Create Student</span>
            </button>
          </div>
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
                  <th>Handled Classes</th>
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
                  <td class="headteacher-directory-empty-cell" colspan="9">
                    <div class="headteacher-directory-empty">
                      <div class="headteacher-directory-empty-illustration" aria-hidden="true">
                        <span class="headteacher-empty-orbit headteacher-empty-orbit-one"></span>
                        <span class="headteacher-empty-orbit headteacher-empty-orbit-two"></span>
                        <i class="fas fa-users"></i>
                      </div>
                      <h3>{{ teachers.length === 0 ? 'Teachers appear here after registration' : 'No teachers match these filters' }}</h3>
                      <p>
                        {{ teachers.length === 0
                          ? `Share the department registration link above with your ${departmentLabel} teachers.`
                          : 'Try a different search term or clear the active filters to see more teachers.' }}
                      </p>
                      <button
                        v-if="teachers.length > 0"
                        type="button"
                        class="headteacher-button headteacher-button-primary headteacher-directory-empty-action"
                        @click="resetDirectoryFilters()"
                      >
                        <i class="fas fa-rotate-left"></i>
                        Reset Filters
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
                    <div class="headteacher-handled-classes" @click.stop>
                      <div v-if="getHandledClasses(teacher).length" class="headteacher-handled-chips">
                        <span v-for="handledClass in getHandledClasses(teacher)" :key="handledClass.id" class="headteacher-handled-chip">
                          {{ handledClass.name }} · {{ getSectionName(handledClass.handledSectionId) }}
                          <button type="button" :aria-label="`Remove ${handledClass.className}`" :disabled="isUpdatingHandledClass" @click="removeHandledClassAssignment(teacher, handledClass)">
                            <i class="fas fa-times"></i>
                          </button>
                        </span>
                      </div>
                      <small v-else class="headteacher-handled-empty">No handled classes</small>
                      <div class="headteacher-handled-add">
                        <div class="headteacher-multi-picker">
                          <button type="button" class="headteacher-multi-picker-trigger" :disabled="isUpdatingHandledClass" :aria-expanded="openHandledPickerId === teacher.id ? 'true' : 'false'" @click="toggleHandledPicker(teacher.id)">
                            <span>{{ handledSelectionLabel(teacher.id) }}</span><i class="fas fa-chevron-down"></i>
                          </button>
                        </div>
                      </div>
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
                        class="headteacher-directory-action-btn is-message"
                        :disabled="teacher.status !== 'active'"
                        :aria-label="`Send announcement to ${teacher.name}`"
                        title="Send announcement"
                        @click.stop="openAnnouncementModal(teacher)"
                      >
                        <i class="fas fa-bullhorn"></i>
                      </button>
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
              <h3>{{ teachers.length === 0 ? 'Teachers appear here after registration' : 'No teachers match these filters' }}</h3>
              <p>{{ teachers.length === 0 ? `Share the department registration link above with your ${departmentLabel} teachers.` : 'Clear the active filters and try again.' }}</p>
              <button
                v-if="teachers.length > 0"
                type="button"
                class="headteacher-button headteacher-button-primary headteacher-directory-empty-action"
                @click="resetDirectoryFilters()"
              >
                <i class="fas fa-rotate-left"></i>
                Reset Filters
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
                  Choose the section this teacher will advise for advisory attendance and student account creation. Each section can be assigned to only one teacher across all subjects.
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

              <div class="headteacher-mobile-assignment-card" @click.stop>
                <div class="headteacher-mobile-assignment-head">
                  <div><span class="headteacher-mobile-kicker">Teaching Assignments</span><h4>Handled Class Sections</h4></div>
                  <span class="headteacher-assignment-state assigned">{{ getHandledClasses(teacher).length }}</span>
                </div>
                <p class="headteacher-mobile-assignment-copy">Assign multiple sections this teacher handles. This does not change the advisory section.</p>
                <div v-if="getHandledClasses(teacher).length" class="headteacher-handled-chips">
                  <span v-for="handledClass in getHandledClasses(teacher)" :key="`mobile-${handledClass.id}`" class="headteacher-handled-chip">
                    {{ handledClass.name }} · {{ getSectionName(handledClass.handledSectionId) }}
                    <button type="button" :disabled="isUpdatingHandledClass" @click="removeHandledClassAssignment(teacher, handledClass)"><i class="fas fa-times"></i></button>
                  </span>
                </div>
                <div class="headteacher-handled-add">
                  <div class="headteacher-multi-picker">
                    <button type="button" class="headteacher-multi-picker-trigger" :disabled="isUpdatingHandledClass" :aria-expanded="openHandledPickerId === teacher.id ? 'true' : 'false'" @click="toggleHandledPicker(teacher.id)">
                      <span>{{ handledSelectionLabel(teacher.id) }}</span><i class="fas fa-chevron-down"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div class="headteacher-row-actions headteacher-mobile-actions">
                <button
                  type="button"
                  class="headteacher-button headteacher-button-outline headteacher-button-sm"
                  :disabled="teacher.status !== 'active'"
                  @click.stop="openAnnouncementModal(teacher)"
                >
                  <i class="fas fa-bullhorn"></i>
                  Announce
                </button>
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

      <div v-if="handledPickerTeacher" class="headteacher-modal-shell headteacher-handled-picker-shell" @click.self="closeHandledPicker">
        <section class="headteacher-modal-panel headteacher-handled-picker-modal" role="dialog" aria-modal="true" aria-labelledby="handled-picker-title">
          <div class="headteacher-modal-head">
            <div>
              <span class="headteacher-students-eyebrow">Handled Classes</span>
              <h3 id="handled-picker-title">Select sections for {{ handledPickerTeacher.name }}</h3>
              <p>{{ handledPickerTeacher.subject || handledPickerTeacher.department }} · Select one or more sections.</p>
            </div>
            <button type="button" class="headteacher-modal-close" aria-label="Close section picker" @click="closeHandledPicker"><i class="fas fa-times"></i></button>
          </div>
          <div class="headteacher-handled-picker-grid">
            <label v-for="section in getAvailableHandledSections(handledPickerTeacher)" :key="`picker-${handledPickerTeacher.id}-${section.id}`" :class="{ selected: isHandledSectionSelected(handledPickerTeacher.id, section.id) }">
              <input type="checkbox" :checked="isHandledSectionSelected(handledPickerTeacher.id, section.id)" @change="toggleHandledSectionDraft(handledPickerTeacher.id, section.id)">
              <span class="headteacher-picker-check"><i class="fas fa-check"></i></span>
              <span><strong>{{ section.name }}</strong><small>Handled class section</small></span>
            </label>
          </div>
          <div v-if="getAvailableHandledSections(handledPickerTeacher).length === 0" class="headteacher-table-state">
            <i class="fas fa-layer-group"></i><span>No additional sections are available for this subject.</span>
          </div>
          <div class="headteacher-modal-actions">
            <span class="headteacher-picker-selection-count">{{ getHandledSectionDrafts(handledPickerTeacher.id).length }} selected</span>
            <button type="button" class="headteacher-button headteacher-button-outline" @click="closeHandledPicker">Cancel</button>
            <button type="button" class="headteacher-button headteacher-button-primary" :disabled="isUpdatingHandledClass || !getHandledSectionDrafts(handledPickerTeacher.id).length" @click="assignHandledClassSection(handledPickerTeacher)">
              <i v-if="isUpdatingHandledClass" class="fas fa-spinner fa-spin"></i>
              Assign selected sections
            </button>
          </div>
        </section>
      </div>

      <section class="headteacher-section-card headteacher-panel headteacher-content-card headteacher-directory-section headteacher-attendance-section">
        <button
          type="button"
          class="headteacher-section-head headteacher-attendance-dropdown-trigger"
          :aria-expanded="isAttendanceDropdownOpen ? 'true' : 'false'"
          aria-controls="department-attendance-content"
          @click="isAttendanceDropdownOpen = !isAttendanceDropdownOpen"
        >
          <div>
            <h2 class="headteacher-section-title">Department Attendance Monitoring</h2>
            <p class="headteacher-section-subtitle">Recent attendance records for teachers managed inside {{ departmentLabel }}.</p>
          </div>
          <span class="headteacher-attendance-dropdown-summary">
            <strong>{{ filteredAttendanceRecords.length }}</strong>
            <span>{{ attendanceTeacherFilter ? 'filtered records' : 'recent records' }}</span>
            <i class="fas fa-chevron-down" :class="{ 'is-open': isAttendanceDropdownOpen }" aria-hidden="true"></i>
          </span>
        </button>

        <div v-if="isAttendanceDropdownOpen" id="department-attendance-content" class="headteacher-attendance-dropdown-content">
        <div v-if="!isLoading" class="headteacher-attendance-toolbar">
          <label>
            <span>Filter by teacher</span>
            <select v-model="attendanceTeacherFilter">
              <option value="">All teachers</option>
              <option v-for="teacherOption in attendanceTeacherOptions" :key="teacherOption.id" :value="teacherOption.id">
                {{ teacherOption.name }}
              </option>
            </select>
          </label>
          <button v-if="attendanceTeacherFilter" type="button" class="headteacher-attendance-clear-filter" @click="attendanceTeacherFilter = ''">
            <i class="fas fa-times" aria-hidden="true"></i> Clear filter
          </button>
        </div>

        <div v-if="isLoading" class="headteacher-table-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading attendance overview...</span>
        </div>

        <div v-else-if="filteredAttendanceRecords.length === 0" class="headteacher-table-state">
          <i class="fas fa-calendar-check"></i>
          <span>{{ attendanceTeacherFilter ? 'No attendance records found for the selected teacher.' : 'No attendance records available for managed teachers yet.' }}</span>
        </div>

        <div v-else class="headteacher-attendance-list">
          <article
            v-for="record in filteredAttendanceRecords"
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
        </div>
      </section>

      <div v-if="isAttendanceModalOpen" class="headteacher-modal-shell">
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

      <div v-if="isAnnouncementModalOpen" class="headteacher-modal-shell">
        <div class="headteacher-modal-panel headteacher-announcement-modal">
          <div class="headteacher-modal-head">
            <div>
              <h3>Send Teacher Announcement</h3>
              <p>This will appear in {{ announcementTarget?.name || 'the teacher' }}'s notification bell.</p>
            </div>
            <button type="button" class="headteacher-modal-close" @click="closeAnnouncementModal" aria-label="Close announcement form">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form class="headteacher-form" @submit.prevent="sendTeacherAnnouncement">
            <label class="headteacher-form-group">
              <span>Subject</span>
              <input v-model.trim="announcementForm.subject" type="text" maxlength="200" required placeholder="Announcement subject">
            </label>
            <label class="headteacher-form-group">
              <span>Message</span>
              <textarea v-model.trim="announcementForm.content" maxlength="5000" required rows="6" placeholder="Write your announcement"></textarea>
            </label>
            <label class="headteacher-announcement-urgent">
              <input v-model="announcementForm.urgent" type="checkbox">
              <span>Mark as urgent</span>
            </label>

            <p v-if="announcementMessage" class="headteacher-form-feedback" :class="announcementMessageType">{{ announcementMessage }}</p>

            <div class="headteacher-modal-actions">
              <button type="button" class="headteacher-button headteacher-button-outline" @click="closeAnnouncementModal">Cancel</button>
              <button type="submit" class="headteacher-button headteacher-button-primary" :disabled="isSendingAnnouncement">
                <i class="fas" :class="isSendingAnnouncement ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
                {{ isSendingAnnouncement ? 'Sending...' : 'Send Announcement' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="isStudentCreateModalOpen" class="headteacher-modal-shell">
        <div class="headteacher-modal-panel">
          <div class="headteacher-modal-head">
            <div>
              <h3>Invite Student</h3>
              <p>Share a private registration link for the selected advisory teacher's section.</p>
            </div>
            <button type="button" class="headteacher-modal-close" aria-label="Close student form" @click="closeStudentCreateModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="headteacher-student-import-choice">
            <div>
              <strong>Upload an Excel class list</strong>
              <p>Import First Name and Last Name columns, preview the students, and assign them to a teacher class.</p>
            </div>
            <button type="button" class="headteacher-button headteacher-button-primary" @click="openStudentExcelImport">
              <i class="fas fa-file-excel"></i>
              Import Excel
            </button>
          </div>

          <StudentPrivateRegistration :api-base-url="resolveApiBaseUrl()" :auth-token="authStore.token || ''" is-head-teacher :teacher-id="studentForm.teacherId" hide-heading />
        </div>
      </div>

      <div v-if="isStudentsModalOpen" class="headteacher-modal-shell">
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
              <button
                type="button"
                class="headteacher-button headteacher-button-primary headteacher-button-sm"
                :disabled="!selectedTeacher?.advisorySectionId"
                :title="selectedTeacher?.advisorySectionId ? 'Create a student in this advisory section' : 'Assign an advisory section first'"
                @click="openStudentCreateModal(selectedTeacher)"
              >
                <i class="fas fa-user-plus"></i>
                Create Student
              </button>
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

      <DashboardFooter />
    </main>
  </div>
</template>

<script setup>
import StudentPrivateRegistration from '../../components/StudentPrivateRegistration.vue'
import DashboardFooter from '../../components/DashboardFooter.vue'
import HeadTeacherNotifications from '../../components/HeadTeacherNotifications.vue'
import HeadTeacherSidebar from '../../components/HeadTeacherSidebar.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import gsap from 'gsap'
import { useAuthStore } from '../../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

const isSidebarOpen = ref(false)
const isAccountMenuOpen = ref(false)
const isLoading = ref(false)
const isStudentCreateModalOpen = ref(false)
const isStudentsModalOpen = ref(false)
const isAttendanceModalOpen = ref(false)
const isAnnouncementModalOpen = ref(false)
const isSendingAnnouncement = ref(false)
const isUpdatingTeacherAssignment = ref(false)
const updatingTeacherAssignmentId = ref('')
const assignmentMessage = ref('')
const assignmentMessageType = ref('success')
const teachers = ref([])
const sections = ref([])
const teacherAssignmentDrafts = reactive({})
const handledClassDrafts = reactive({})
const openHandledPickerId = ref('')
const isUpdatingHandledClass = ref(false)
const updatingHandledTeacherId = ref('')
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
const isAttendanceDropdownOpen = ref(true)
const attendanceTeacherFilter = ref('')
const handledPickerTeacher = computed(() => teachers.value.find((teacher) => teacher.id === openHandledPickerId.value) || null)
const selectedTeacher = ref(null)
const selectedTeacherStudents = ref([])
const selectedAttendanceRecord = ref(null)
const announcementTarget = ref(null)
const announcementMessage = ref('')
const announcementMessageType = ref('success')
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
const studentForm = reactive({ teacherId: '' })
const announcementForm = reactive({
  subject: '',
  content: '',
  urgent: false,
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
const studentEligibleTeachers = computed(() => teachers.value.filter((teacher) => (
  normalizeStatus(teacher.status) === 'active' && String(teacher.advisorySectionId || '').trim()
)))
const attendanceStatuses = ['Present', 'Late', 'Absent', 'Excused']
const activeSelectedTeacherStudents = computed(() => selectedTeacherStudents.value.filter((student) => normalizeStatus(student.status) === 'active').length)
const recentAttendanceRecords = computed(() => Array.isArray(attendanceOverview.value?.recentRecords) ? attendanceOverview.value.recentRecords.slice(0, 12) : [])
const attendanceTeacherOptions = computed(() => {
  const uniqueTeachers = new Map()
  recentAttendanceRecords.value.forEach((record) => {
    const id = String(record?.teacher?.id || record?.teacherId || '').trim()
    if (id && !uniqueTeachers.has(id)) uniqueTeachers.set(id, { id, name: record?.teacher?.name || 'Teacher' })
  })
  return [...uniqueTeachers.values()].sort((left, right) => left.name.localeCompare(right.name))
})
const filteredAttendanceRecords = computed(() => {
  const teacherId = String(attendanceTeacherFilter.value || '').trim()
  if (!teacherId) return recentAttendanceRecords.value
  return recentAttendanceRecords.value.filter((record) => String(record?.teacher?.id || record?.teacherId || '').trim() === teacherId)
})
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
const toggleAccountMenu = () => { isAccountMenuOpen.value = !isAccountMenuOpen.value }

const resetStudentForm = (teacherId = '') => { studentForm.teacherId = String(teacherId || '').trim() }

const openStudentCreateModal = (teacher = null) => {
  const requestedTeacherId = normalizeTeacherId(teacher)
  const eligibleTeacherId = studentEligibleTeachers.value.some(
    (candidate) => String(candidate.id) === requestedTeacherId
  ) ? requestedTeacherId : ''
  const defaultTeacherId = eligibleTeacherId || (studentEligibleTeachers.value.length === 1
    ? String(studentEligibleTeachers.value[0].id)
    : '')

  resetStudentForm(defaultTeacherId)
  if (isStudentsModalOpen.value) {
    isStudentsModalOpen.value = false
    selectedTeacher.value = null
    selectedTeacherStudents.value = []
    studentsErrorMessage.value = ''
  }
  isStudentCreateModalOpen.value = true
}

const openStudentExcelImport = () => {
  closeStudentCreateModal()
  router.push('/headteacher/students')
}

const closeStudentCreateModal = () => {
  isStudentCreateModalOpen.value = false
  resetStudentForm()
}

const closeStudentsModal = () => {
  if (isStudentsLoading.value) return
  isStudentsModalOpen.value = false
  selectedTeacher.value = null
  selectedTeacherStudents.value = []
  studentsErrorMessage.value = ''
}

const openAnnouncementModal = (teacher) => {
  announcementTarget.value = teacher
  announcementForm.subject = ''
  announcementForm.content = ''
  announcementForm.urgent = false
  announcementMessage.value = ''
  announcementMessageType.value = 'success'
  isAnnouncementModalOpen.value = true
}

const closeAnnouncementModal = () => {
  if (isSendingAnnouncement.value) return
  isAnnouncementModalOpen.value = false
  announcementTarget.value = null
  announcementMessage.value = ''
}

const sendTeacherAnnouncement = async () => {
  const teacherId = normalizeTeacherId(announcementTarget.value)
  if (!teacherId) return
  isSendingAnnouncement.value = true
  announcementMessage.value = ''
  try {
    await axios.post(
      `${resolveApiBaseUrl()}/headteacher/teachers/${encodeURIComponent(teacherId)}/announcements`,
      { ...announcementForm },
      getAuthConfig(),
    )
    announcementMessage.value = 'Announcement sent successfully.'
    announcementMessageType.value = 'success'
    window.setTimeout(() => closeAnnouncementModal(), 500)
  } catch (error) {
    announcementMessage.value = error.response?.data?.message || 'Failed to send announcement.'
    announcementMessageType.value = 'error'
  } finally {
    isSendingAnnouncement.value = false
  }
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
    if (section?.isActive !== true) return false
    const advisers = Array.isArray(section.advisers)
      ? section.advisers
      : section.adviser ? [section.adviser] : []
    return advisers.every((adviser) => {
      const adviserId = normalizeTeacherId(adviser)
      return adviserId && adviserId === normalizedTeacherId
    })
  })
}

const getHandledClasses = (teacher) => (Array.isArray(teacher?.classes) ? teacher.classes : [])
  .filter((entry) => entry.assignmentSource === 'headteacher' && entry.handledSectionId)

const getSectionName = (sectionId) => sections.value.find((section) => String(section.id) === String(sectionId))?.name || 'Unavailable section'

const getAvailableHandledSections = (teacher) => {
  const subject = String(teacher?.subject || teacher?.department || '').trim().toLowerCase()
  const advisorySectionId = String(teacher?.advisorySectionId || '').trim()
  const assignedIds = new Set(getHandledClasses(teacher)
    .filter((entry) => String(entry.name || '').trim().toLowerCase() === subject)
    .map((entry) => String(entry.handledSectionId)))
  return sections.value.filter((section) => (
    section.isActive === true
    && String(section.id) !== advisorySectionId
    && !assignedIds.has(String(section.id))
  ))
}

const getHandledSectionDrafts = (teacherId) => Array.isArray(handledClassDrafts[normalizeTeacherId(teacherId)])
  ? handledClassDrafts[normalizeTeacherId(teacherId)]
  : []

const isHandledSectionSelected = (teacherId, sectionId) => getHandledSectionDrafts(teacherId).includes(String(sectionId))

const toggleHandledSectionDraft = (teacherId, sectionId) => {
  const normalizedTeacherId = normalizeTeacherId(teacherId)
  const normalizedSectionId = String(sectionId || '').trim()
  const current = getHandledSectionDrafts(normalizedTeacherId)
  handledClassDrafts[normalizedTeacherId] = current.includes(normalizedSectionId)
    ? current.filter((id) => id !== normalizedSectionId)
    : [...current, normalizedSectionId]
}

const toggleHandledPicker = (teacherId) => {
  const normalizedTeacherId = normalizeTeacherId(teacherId)
  openHandledPickerId.value = openHandledPickerId.value === normalizedTeacherId ? '' : normalizedTeacherId
}

const closeHandledPicker = () => {
  openHandledPickerId.value = ''
}

const handledSelectionLabel = (teacherId) => {
  const selected = getHandledSectionDrafts(teacherId)
  if (selected.length === 0) return 'Select sections'
  if (selected.length === 1) return getSectionName(selected[0])
  return `${selected.length} sections selected`
}

const assignHandledClassSection = async (teacher) => {
  const teacherId = normalizeTeacherId(teacher)
  const sectionIds = getHandledSectionDrafts(teacherId)
  const subject = String(teacher?.subject || teacher?.department || '').trim()
  if (!teacherId || !sectionIds.length || !subject) return
  isUpdatingHandledClass.value = true
  updatingHandledTeacherId.value = teacherId
  assignmentMessage.value = ''
  try {
    await axios.post(`${resolveApiBaseUrl()}/headteacher/teachers/${encodeURIComponent(teacherId)}/handled-classes`, {
      sectionIds,
      subject,
    }, getAuthConfig())
    handledClassDrafts[teacherId] = []
    openHandledPickerId.value = ''
    assignmentMessage.value = `${sectionIds.length} handled class section${sectionIds.length === 1 ? '' : 's'} for ${subject} assigned to ${teacher.name}.`
    assignmentMessageType.value = 'success'
    await fetchTeachers()
  } catch (error) {
    assignmentMessage.value = error.response?.data?.message || 'Failed to assign the handled class section.'
    assignmentMessageType.value = 'error'
  } finally {
    isUpdatingHandledClass.value = false
    updatingHandledTeacherId.value = ''
  }
}

const removeHandledClassAssignment = async (teacher, handledClass) => {
  const teacherId = normalizeTeacherId(teacher)
  if (!teacherId || !handledClass?.id) return
  isUpdatingHandledClass.value = true
  updatingHandledTeacherId.value = teacherId
  assignmentMessage.value = ''
  try {
    await axios.delete(`${resolveApiBaseUrl()}/headteacher/teachers/${encodeURIComponent(teacherId)}/handled-classes/${encodeURIComponent(handledClass.id)}`, getAuthConfig())
    assignmentMessage.value = `Handled class Section ${getSectionName(handledClass.handledSectionId)} removed from ${teacher.name}.`
    assignmentMessageType.value = 'success'
    await fetchTeachers()
  } catch (error) {
    assignmentMessage.value = error.response?.data?.message || 'Failed to remove the handled class assignment.'
    assignmentMessageType.value = 'error'
  } finally {
    isUpdatingHandledClass.value = false
    updatingHandledTeacherId.value = ''
  }
}

const refreshSectionAvailability = async () => {
  try {
    const response = await axios.get(`${resolveApiBaseUrl()}/headteacher/sections`, getAuthConfig())
    if (Array.isArray(response.data?.sections)) sections.value = response.data.sections
  } catch {
    // Preserve the current options and the original conflict message if refreshing fails.
  }
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
      classes: Array.isArray(teacher.classes) ? teacher.classes : [],
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
  const requestedSectionId = String(advisorySectionId || '').trim()
  if (requestedSectionId && !getAssignableSections(teacherId).some((section) => section.id === requestedSectionId)) {
    assignmentMessage.value = 'This section is unavailable or already assigned to another subject or teacher. Choose another advisory section.'
    assignmentMessageType.value = 'error'
    setTeacherAssignmentDraft(teacherId, teacher.advisorySectionId || '')
    return
  }
  isUpdatingTeacherAssignment.value = true
  updatingTeacherAssignmentId.value = teacherId
  try {
    const response = await axios.put(`${resolveApiBaseUrl()}/headteacher/teachers/${encodeURIComponent(teacherId)}`, {
      status: teacher.status || 'active',
      subject: teacher.subject || departmentLabel.value,
      advisorySectionId: advisorySectionId || '',
    }, getAuthConfig())

    const className = String(response.data?.advisoryClass?.className || '').trim()
    assignmentMessage.value = advisorySectionId
      ? className ? `Advisory section assigned. Class "${className}" is ready.` : 'Advisory section assigned successfully.'
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
    if (error.response?.status === 409) await refreshSectionAvailability()
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
.headteacher-student-import-choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  border: 1px solid #cfe0c5;
  border-radius: 12px;
  background: #f4f9f0;
  color: #31551e;
}
.headteacher-student-import-choice > div { min-width: 0; }
.headteacher-student-import-choice strong { display: block; margin-bottom: .25rem; }
.headteacher-student-import-choice p { margin: 0; color: #64748b; font-size: .8rem; line-height: 1.5; }
.headteacher-student-import-choice .headteacher-button { flex: 0 0 auto; }
@media (max-width: 600px) {
  .headteacher-student-import-choice { align-items: stretch; flex-direction: column; }
  .headteacher-student-import-choice .headteacher-button { width: 100%; }
}
.headteacher-main > .headteacher-top-header { margin-bottom: 1.5rem !important; }
.teacher-registration-panel {
  margin-bottom: 1.5rem;
}

@reference "../../styles/tailwind.css";

.headteacher-management-page .headteacher-create-teacher-modal {
  @apply tw:box-border;
  @apply tw:[max-height:calc(100dvh_-_2rem)];
  @apply tw:overflow-y-auto;
  @apply tw:overscroll-contain;
}

.headteacher-announcement-modal {
  @apply tw:[max-width:620px];
}

.headteacher-announcement-modal textarea {
  @apply tw:w-full;
  @apply tw:resize-y;
  @apply tw:[min-height:130px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:12px];
  @apply tw:[padding:0.75rem_0.85rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font:inherit];
}

.headteacher-announcement-modal textarea:focus {
  @apply tw:[border-color:#2563eb];
  @apply tw:[outline:3px_solid_rgba(37,_99,_235,_0.12)];
}

.headteacher-announcement-urgent {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
}

.headteacher-directory-action-btn.is-message {
  @apply tw:[color:#1d4ed8];
}

.headteacher-sr-only {
  @apply tw:absolute;
  @apply tw:[width:1px];
  @apply tw:[height:1px];
  @apply tw:[padding:0];
  @apply tw:overflow-hidden;
  @apply tw:[clip:rect(0,_0,_0,_0)];
  @apply tw:whitespace-nowrap;
  @apply tw:[border:0];
}

.headteacher-directory-enterprise {
  --directory-navy: #0f172a;
  --directory-copy: #475569;
  --directory-muted: #64748b;
  --directory-line: #e2e8f0;
  --directory-blue: #2563eb;
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:[padding:clamp(1rem,_2vw,_1.6rem)];
  @apply tw:[border:1px_solid_rgba(148,_163,_184,_0.18)];
  @apply tw:[border-radius:28px];
  @apply tw:[background:radial-gradient(circle_at_96%_0%,_rgba(59,_130,_246,_0.09),_transparent_25%),______linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_22px_52px_rgba(15,_23,_42,_0.09)];
}

.headteacher-directory-enterprise .headteacher-directory-head {
  @apply tw:items-center;
  @apply tw:[margin-bottom:1.25rem];
}

.headteacher-directory-create-actions {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-end;
  @apply tw:[gap:0.65rem];
  @apply tw:flex-wrap;
}

.headteacher-directory-create-actions > .headteacher-button-outline {
  @apply tw:[min-height:44px];
  @apply tw:[border-radius:14px];
}

.headteacher-students-head-actions {
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-wrap;
}

.headteacher-directory-enterprise.is-empty-directory .headteacher-directory-head {
  @apply tw:[margin-bottom:0.85rem];
}

.headteacher-directory-enterprise .headteacher-section-title {
  @apply tw:[margin:0];
  @apply tw:[color:var(--directory-navy)];
  @apply tw:[font-size:clamp(1.35rem,_2.4vw,_1.9rem)];
  @apply tw:[font-weight:750];
  @apply tw:[letter-spacing:-0.035em];
}

.headteacher-directory-enterprise .headteacher-section-subtitle {
  @apply tw:[max-width:650px];
  @apply tw:[margin-top:0.45rem];
  @apply tw:[color:var(--directory-muted)];
  @apply tw:[font-size:0.9rem];
  @apply tw:[line-height:1.55];
}

.headteacher-directory-enterprise .headteacher-directory-cta {
  @apply tw:[min-width:158px];
  @apply tw:[min-height:44px];
  @apply tw:[padding:0.4rem_0.7rem];
  @apply tw:[border:0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#245b13];
  @apply tw:[box-shadow:0_10px_22px_rgba(36,_91,_19,_0.22)];
  @apply tw:[transition:transform_0.2s_ease,_background-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.headteacher-directory-enterprise .headteacher-directory-cta:hover {
  @apply tw:[background:#1e4307];
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[box-shadow:0_14px_26px_rgba(36,_91,_19,_0.28)];
}

.headteacher-directory-enterprise .headteacher-directory-cta:focus-visible {
  @apply tw:[outline:3px_solid_rgba(36,_91,_19,_0.24)];
  @apply tw:[outline-offset:3px];
}

.headteacher-directory-enterprise .headteacher-directory-create-icon {
  @apply tw:[width:32px];
  @apply tw:[height:32px];
  @apply tw:[flex-basis:32px];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.16)];
  @apply tw:[border-radius:10px];
  @apply tw:[background:rgba(255,_255,_255,_0.16)];
  @apply tw:[font-size:0.85rem];
}

.headteacher-directory-enterprise .headteacher-directory-create-copy strong {
  @apply tw:[font-size:0.84rem];
}

.headteacher-directory-summary {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-bottom:1rem];
}

.headteacher-directory-summary-card {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:[min-width:0];
  @apply tw:[padding:0.9rem];
  @apply tw:[border:1px_solid_var(--directory-line)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.9)];
  @apply tw:[box-shadow:0_8px_20px_rgba(15,_23,_42,_0.04)];
  @apply tw:[transition:transform_0.18s_ease,_border-color_0.18s_ease,_box-shadow_0.18s_ease];
}

.headteacher-directory-summary-card:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[box-shadow:0_14px_28px_rgba(15,_23,_42,_0.08)];
}

.headteacher-directory-summary-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[flex:0_0_42px];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#2563eb];
}

.headteacher-directory-summary-card > div {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
  @apply tw:[min-width:0];
}

.headteacher-directory-summary-card > div > span {
  @apply tw:overflow-hidden;
  @apply tw:[color:var(--directory-muted)];
  @apply tw:[font-size:0.69rem];
  @apply tw:[font-weight:750];
  @apply tw:[letter-spacing:0.055em];
  @apply tw:text-ellipsis;
  @apply tw:uppercase;
  @apply tw:whitespace-nowrap;
}

.headteacher-directory-summary-card strong {
  @apply tw:[color:var(--directory-navy)];
  @apply tw:[font-size:1.35rem];
  @apply tw:[line-height:1];
}

.headteacher-directory-summary-card.is-active .headteacher-directory-summary-icon {
  @apply tw:[background:#ecfdf3];
  @apply tw:[color:#15803d];
}

.headteacher-directory-summary-card.is-pending .headteacher-directory-summary-icon {
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#c2410c];
}

.headteacher-directory-summary-card.is-inactive .headteacher-directory-summary-icon {
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#64748b];
}

.headteacher-directory-toolbar {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
  @apply tw:[margin-bottom:1rem];
  @apply tw:[padding:0.9rem];
  @apply tw:[border:1px_solid_rgba(203,_213,_225,_0.8)];
  @apply tw:[border-radius:20px];
  @apply tw:[background:rgba(248,_250,_252,_0.88)];
}

.headteacher-directory-toolbar-main {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(280px,_1fr)_minmax(180px,_220px)];
  @apply tw:[gap:0.75rem];
}

.headteacher-directory-search {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:items-center;
}

.headteacher-directory-search > i {
  @apply tw:absolute;
  @apply tw:[left:1rem];
  @apply tw:[color:#94a3b8];
  @apply tw:pointer-events-none;
}

.headteacher-directory-search input {
  @apply tw:w-full;
  @apply tw:[min-height:48px];
  @apply tw:[padding:0.72rem_2.8rem];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:var(--directory-navy)];
  @apply tw:[font-size:0.88rem];
  @apply tw:[transition:border-color_0.18s_ease,_box-shadow_0.18s_ease];
}

.headteacher-directory-search input:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#60a5fa];
  @apply tw:[box-shadow:0_0_0_4px_rgba(59,_130,_246,_0.12)];
}

.headteacher-directory-clear-search {
  @apply tw:absolute;
  @apply tw:[right:0.6rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:32px];
  @apply tw:[height:32px];
  @apply tw:[border:0];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#64748b];
  @apply tw:cursor-pointer;
}

.headteacher-directory-sort {
  @apply tw:grid;
  @apply tw:[gap:0.32rem];
}

.headteacher-directory-sort > span {
  @apply tw:absolute;
  @apply tw:[width:1px];
  @apply tw:[height:1px];
  @apply tw:overflow-hidden;
  @apply tw:[clip:rect(0,_0,_0,_0)];
}

.headteacher-directory-sort select {
  @apply tw:w-full;
  @apply tw:[min-height:48px];
  @apply tw:[padding:0.72rem_0.85rem];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-weight:650];
}

.headteacher-directory-sort select:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#60a5fa];
  @apply tw:[box-shadow:0_0_0_4px_rgba(59,_130,_246,_0.12)];
}

.headteacher-directory-toolbar-secondary {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[min-width:0];
}

.headteacher-directory-filter-chips {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.42rem];
}

.headteacher-directory-filter-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.38rem];
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.4rem_0.68rem];
  @apply tw:[border:1px_solid_#dbe3ec];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:650];
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.16s_ease,_border-color_0.16s_ease,_background_0.16s_ease,_color_0.16s_ease];
}

.headteacher-directory-filter-chip:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#93c5fd];
}

.headteacher-directory-filter-chip.active {
  @apply tw:[border-color:#2563eb];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[box-shadow:0_4px_12px_rgba(37,_99,_235,_0.1)];
}

.headteacher-directory-filter-chip:focus-visible {
  @apply tw:[outline:3px_solid_rgba(37,_99,_235,_0.18)];
  @apply tw:[outline-offset:2px];
}

.headteacher-directory-filter-chip strong {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-width:20px];
  @apply tw:[height:20px];
  @apply tw:[padding:0_0.3rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#f1f5f9];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.66rem];
}

.headteacher-directory-filter-chip.active strong {
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
}

.headteacher-directory-filter-dot {
  @apply tw:[width:7px];
  @apply tw:[height:7px];
  @apply tw:[border-radius:50%];
  @apply tw:[background:#94a3b8];
}

.headteacher-directory-filter-dot.is-active {
  @apply tw:[background:#22c55e];
}

.headteacher-directory-filter-dot.is-pending {
  @apply tw:[background:#f59e0b];
}

.headteacher-directory-filter-dot.is-inactive {
  @apply tw:[background:#94a3b8];
}

.headteacher-directory-filter-dot.is-suspended {
  @apply tw:[background:#ef4444];
}

.headteacher-directory-toolbar-meta {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-end;
  @apply tw:[gap:0.75rem];
  @apply tw:[color:var(--directory-muted)];
  @apply tw:[font-size:0.76rem];
  @apply tw:whitespace-nowrap;
}

.headteacher-directory-toolbar-meta strong {
  @apply tw:[color:var(--directory-navy)];
}

.headteacher-directory-reset {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.4rem_0.65rem];
  @apply tw:[border:0];
  @apply tw:[border-radius:11px];
  @apply tw:[background:transparent];
  @apply tw:[color:#2563eb];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
}

.headteacher-directory-reset:hover {
  @apply tw:[background:#eff6ff];
}

.headteacher-directory-loading {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.9rem];
  @apply tw:[min-height:240px];
  @apply tw:[padding:1.5rem];
  @apply tw:[border:1px_solid_#dbe3ec];
  @apply tw:[border-radius:20px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:var(--directory-navy)];
  @apply tw:text-left;
  @apply tw:[box-shadow:0_14px_32px_rgba(15,_23,_42,_0.05)];
}

.headteacher-directory-loading-icon {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:52px];
  @apply tw:[height:52px];
  @apply tw:[flex:0_0_52px];
  @apply tw:[border-radius:16px];
  @apply tw:[background:linear-gradient(145deg,_#f0fdf4,_#dcfce7)];
  @apply tw:[color:#15803d];
  @apply tw:[font-size:1.15rem];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(34,_197,_94,_0.18)];
}

.headteacher-directory-loading strong {
  @apply tw:block;
  @apply tw:[font-size:0.95rem];
}

.headteacher-directory-loading p {
  @apply tw:[margin:0.3rem_0_0];
  @apply tw:[color:var(--directory-muted)];
  @apply tw:[font-size:0.8rem];
}

.headteacher-directory-enterprise .headteacher-table-shell {
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#dbe3ec];
  @apply tw:[border-radius:20px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_14px_32px_rgba(15,_23,_42,_0.06)];
}

.headteacher-directory-enterprise .headteacher-table-wrap {
  @apply tw:[max-height:min(620px,_calc(100vh_-_190px))];
  @apply tw:overflow-auto;
}

.headteacher-directory-enterprise .headteacher-table-wrap.is-empty {
  @apply tw:max-h-none;
  @apply tw:overflow-x-auto;
  @apply tw:overflow-y-visible;
}

.headteacher-directory-enterprise .headteacher-table-wrap.is-zero-state {
  @apply tw:overflow-hidden;
}

.headteacher-directory-enterprise .headteacher-table-wrap.is-zero-state .headteacher-table {
  @apply tw:[min-width:0];
  @apply tw:table-fixed;
}

.headteacher-directory-enterprise .headteacher-table {
  @apply tw:[min-width:1120px];
}

.headteacher-directory-enterprise .headteacher-table thead th {
  @apply tw:[top:0];
  @apply tw:[z-index:4];
  @apply tw:[padding:0.85rem_0.9rem];
  @apply tw:[border-bottom:1px_solid_#dbe3ec];
  @apply tw:[background:rgba(248,_250,_252,_0.98)];
  @apply tw:[color:#526170];
  @apply tw:[font-size:0.66rem];
  @apply tw:[letter-spacing:0.075em];
  @apply tw:[backdrop-filter:blur(10px)];
}

.headteacher-directory-sort-button {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[padding:0];
  @apply tw:[border:0];
  @apply tw:[background:transparent];
  @apply tw:[color:inherit];
  @apply tw:[font:inherit];
  @apply tw:[letter-spacing:inherit];
  @apply tw:[text-transform:inherit];
  @apply tw:cursor-pointer;
}

.headteacher-directory-sort-button i {
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.65rem];
}

.headteacher-directory-enterprise .headteacher-table tbody td {
  @apply tw:[padding:0.85rem_0.9rem];
  @apply tw:[background:#ffffff];
  @apply tw:[transition:background-color_0.18s_ease];
}

.headteacher-directory-enterprise .headteacher-table tbody tr:nth-child(even) td {
  @apply tw:[background:#fbfdff];
}

.headteacher-directory-enterprise .headteacher-table-row-interactive {
  @apply tw:[transition:transform_0.18s_ease,_box-shadow_0.18s_ease];
}

.headteacher-directory-enterprise .headteacher-table-row-interactive:hover {
  @apply tw:relative;
  @apply tw:[z-index:2];
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[box-shadow:0_10px_26px_rgba(37,_99,_235,_0.08)];
}

.headteacher-directory-enterprise .headteacher-table-row-interactive:hover td {
  @apply tw:[background:#f0f7ff];
}

.headteacher-directory-enterprise .headteacher-avatar {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[min-width:42px];
  @apply tw:[min-height:42px];
  @apply tw:[border:2px_solid_#ffffff];
  @apply tw:[outline:2px_solid_#dbeafe];
  @apply tw:[box-shadow:0_7px_16px_rgba(15,_23,_42,_0.1)];
}

.headteacher-directory-enterprise .headteacher-name-cell strong {
  @apply tw:[font-size:0.88rem];
  @apply tw:[font-weight:700];
}

.headteacher-directory-enterprise .headteacher-email-link {
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.82rem];
}

.headteacher-directory-enterprise .headteacher-badge {
  @apply tw:[gap:0.35rem];
  @apply tw:[min-height:30px];
  @apply tw:[padding:0.35rem_0.62rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:750];
}

.headteacher-directory-enterprise .headteacher-status-badge.status-active {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#ecfdf3];
  @apply tw:[color:#166534];
}

.headteacher-directory-enterprise .headteacher-status-badge.status-pending {
  @apply tw:[border-color:#fed7aa];
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#9a3412];
}

.headteacher-directory-enterprise .headteacher-status-badge.status-inactive {
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
}

.headteacher-directory-enterprise .headteacher-status-badge.status-suspended {
  @apply tw:[border-color:#fecaca];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}

.headteacher-directory-enterprise .headteacher-inline-select {
  @apply tw:[min-height:38px];
  @apply tw:[border-radius:11px];
  @apply tw:[font-size:0.76rem];
}

.headteacher-handled-classes {
  display: grid;
  gap: 0.55rem;
  min-width: 190px;
}

.headteacher-handled-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.headteacher-handled-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.5rem;
  border: 1px solid #c7e5a8;
  border-radius: 999px;
  background: #eff9e7;
  color: #315d17;
  font-size: 0.72rem;
  font-weight: 700;
}

.headteacher-handled-chip button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.headteacher-handled-empty {
  color: #94a3b8;
}

.headteacher-handled-add {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.headteacher-handled-add .headteacher-inline-select {
  min-width: 0;
  flex: 1;
}

.headteacher-multi-picker {
  position: relative;
  min-width: 150px;
  flex: 1;
}

.headteacher-multi-picker-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  width: 100%;
  min-height: 38px;
  padding: 0.5rem 0.65rem;
  border: 1px solid #d7dfec;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 0.76rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.headteacher-multi-picker-trigger[aria-expanded='true'] {
  border-color: #65a30d;
  box-shadow: 0 0 0 3px rgba(101, 163, 13, 0.13);
}

.headteacher-multi-picker-trigger i {
  color: #64748b;
  transition: transform 0.18s ease;
}

.headteacher-multi-picker-trigger[aria-expanded='true'] i {
  transform: rotate(180deg);
}

.headteacher-multi-picker-menu {
  position: static;
  display: grid;
  gap: 0.25rem;
  width: 100%;
  max-height: 240px;
  overflow-y: auto;
  margin-top: 0.4rem;
  padding: 0.55rem;
  border: 1px solid #dbe4ef;
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
  box-sizing: border-box;
}

.headteacher-multi-picker-menu p {
  margin: 0 0 0.25rem;
  padding: 0.25rem 0.35rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.headteacher-multi-picker-menu label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem;
  border-radius: 9px;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.headteacher-multi-picker-menu label:hover {
  background: #f1f8ea;
}

.headteacher-multi-picker-menu input {
  width: 16px;
  height: 16px;
  accent-color: #4d7c0f;
}

.headteacher-multi-picker-menu small {
  padding: 0.5rem;
  color: #94a3b8;
  font-size: 0.74rem;
}

.headteacher-handled-picker-shell {
  z-index: 1200;
}

.headteacher-handled-picker-modal {
  width: min(680px, calc(100vw - 2rem));
  max-height: min(760px, calc(100vh - 2rem));
  overflow-y: auto;
}

.headteacher-handled-picker-modal .headteacher-modal-head h3 {
  margin: 0.28rem 0 0;
  color: #0f172a;
}

.headteacher-handled-picker-modal .headteacher-modal-head p {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.headteacher-handled-picker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1rem;
}

.headteacher-handled-picker-grid > label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 66px;
  padding: 0.75rem;
  border: 1px solid #dbe4ef;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
}

.headteacher-handled-picker-grid > label:hover {
  border-color: #a3c978;
  transform: translateY(-1px);
}

.headteacher-handled-picker-grid > label.selected {
  border-color: #65a30d;
  background: #f1f8ea;
  box-shadow: 0 0 0 2px rgba(101, 163, 13, 0.1);
}

.headteacher-handled-picker-grid input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.headteacher-picker-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: transparent;
  background: #fff;
}

.headteacher-handled-picker-grid label.selected .headteacher-picker-check {
  border-color: #4d7c0f;
  background: #4d7c0f;
  color: #fff;
}

.headteacher-handled-picker-grid label > span:last-child {
  display: grid;
  gap: 0.18rem;
}

.headteacher-handled-picker-grid strong {
  color: #1e293b;
  font-size: 0.88rem;
}

.headteacher-handled-picker-grid small {
  color: #64748b;
  font-size: 0.72rem;
}

.headteacher-picker-selection-count {
  margin-right: auto;
  color: #4d7c0f;
  font-size: 0.8rem;
  font-weight: 800;
}

.headteacher-directory-enterprise .headteacher-table-wrap {
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 transparent;
}

.headteacher-directory-enterprise .headteacher-table-wrap::-webkit-scrollbar {
  height: 8px;
}

.headteacher-directory-enterprise .headteacher-table-wrap::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #94a3b8;
}

@media (max-width: 640px) {
  .headteacher-handled-picker-grid {
    grid-template-columns: 1fr;
  }

  .headteacher-handled-picker-modal .headteacher-modal-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .headteacher-picker-selection-count {
    margin-right: 0;
  }
}

.headteacher-directory-enterprise .headteacher-row-actions {
  @apply tw:flex-nowrap;
}

.headteacher-directory-action-btn {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[width:36px];
  @apply tw:[height:36px];
  @apply tw:[padding:0];
  @apply tw:[border:1px_solid_#dbe3ec];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.16s_ease,_border-color_0.16s_ease,_background_0.16s_ease,_color_0.16s_ease];
}

.headteacher-directory-action-btn:hover:not(:disabled) {
  @apply tw:[transform:translateY(-2px)];
}

.headteacher-directory-action-btn.is-save {
  @apply tw:[border-color:#bfdbfe];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
}

.headteacher-directory-action-btn.is-activate {
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[background:#f0fdf4];
  @apply tw:[color:#15803d];
}

.headteacher-directory-action-btn.is-deactivate {
  @apply tw:[border-color:#fed7aa];
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#c2410c];
}

.headteacher-directory-action-btn:disabled {
  @apply tw:[opacity:0.42];
  @apply tw:cursor-not-allowed;
}

.headteacher-directory-skeleton {
  @apply tw:block;
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:[height:12px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e8edf3];
}

.headteacher-directory-skeleton::after {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:0];
  @apply tw:[transform:translateX(-100%)];
  @apply tw:[background:linear-gradient(90deg,_transparent,_rgba(255,_255,_255,_0.82),_transparent)];
  @apply tw:[animation:directory-shimmer_1.35s_infinite];
}

.headteacher-directory-skeleton.headteacher-skeleton-avatar {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:50%];
}

.headteacher-directory-skeleton.headteacher-skeleton-name {
  @apply tw:[width:100px];
}

.headteacher-directory-skeleton.headteacher-skeleton-email {
  @apply tw:[width:145px];
}

.headteacher-directory-skeleton.skeleton-pill {
  @apply tw:[width:78px];
  @apply tw:[height:28px];
}

.headteacher-directory-skeleton.skeleton-select {
  @apply tw:[width:140px];
  @apply tw:[height:36px];
  @apply tw:[border-radius:10px];
}

.headteacher-directory-skeleton.skeleton-date {
  @apply tw:[width:76px];
}

.headteacher-directory-skeleton.skeleton-action {
  @apply tw:[width:78px];
  @apply tw:[height:34px];
  @apply tw:[border-radius:10px];
}

@keyframes directory-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.headteacher-directory-empty {
  @apply tw:grid;
  @apply tw:content-center;
  @apply tw:justify-items-center;
  @apply tw:[max-width:520px];
  @apply tw:[min-height:clamp(240px,_calc(100vh_-_300px),_320px)];
  @apply tw:[margin:0_auto];
  @apply tw:[padding:1rem_1.25rem_1.25rem];
  @apply tw:box-border;
  @apply tw:text-center;
}

.headteacher-directory-enterprise .headteacher-directory-empty-cell {
  @apply tw:[padding:0]!;
}

.headteacher-directory-empty-illustration {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[width:82px];
  @apply tw:[height:82px];
  @apply tw:[margin-bottom:0.65rem];
  @apply tw:[border-radius:24px];
  @apply tw:[background:linear-gradient(145deg,_#f0fdf4,_#dcfce7)];
  @apply tw:[color:#245b13];
  @apply tw:[font-size:1.65rem];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(36,_91,_19,_0.2),_0_18px_36px_rgba(36,_91,_19,_0.12)];
}

.headteacher-directory-empty-illustration i {
  @apply tw:relative;
  @apply tw:[z-index:2];
}

.headteacher-directory-empty-illustration .headteacher-empty-orbit {
  @apply tw:absolute;
  @apply tw:[border:1px_solid_rgba(36,_91,_19,_0.22)];
  @apply tw:[border-radius:50%];
}

.headteacher-directory-empty-illustration .headteacher-empty-orbit-one {
  @apply tw:[width:52px];
  @apply tw:[height:52px];
}

.headteacher-directory-empty-illustration .headteacher-empty-orbit-two {
  @apply tw:[width:68px];
  @apply tw:[height:68px];
  @apply tw:[border-style:dashed];
}

.headteacher-directory-empty h3 {
  @apply tw:[margin:0.32rem_0_0];
  @apply tw:[color:var(--directory-navy)];
  @apply tw:[font-size:1.1rem];
}

.headteacher-directory-empty p {
  @apply tw:[margin:0.4rem_0_0.75rem];
  @apply tw:[color:var(--directory-muted)];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.45];
}

.headteacher-directory-empty-action {
  @apply tw:[min-height:42px];
  @apply tw:[padding:0.6rem_0.9rem];
  @apply tw:[border-color:#245b13];
  @apply tw:[border-radius:13px];
  @apply tw:[background:#245b13];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:0.82rem];
  @apply tw:[box-shadow:0_12px_24px_rgba(36,_91,_19,_0.22)];
}

.headteacher-directory-empty-action:hover {
  @apply tw:[border-color:#1b470e];
  @apply tw:[background:#1b470e];
}

.headteacher-directory-mobile-skeletons {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
}

.headteacher-directory-mobile-skeleton {
  @apply tw:grid;
  @apply tw:[gap:0.9rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#dbe3ec];
  @apply tw:[border-radius:20px];
  @apply tw:[background:#ffffff];
}

.headteacher-directory-mobile-skeleton-head {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
}

.headteacher-directory-mobile-skeleton-head > div {
  @apply tw:grid;
  @apply tw:[gap:0.5rem];
}

.headteacher-directory-skeleton.headteacher-skeleton-mobile-block,
.headteacher-directory-skeleton.headteacher-skeleton-mobile-action {
  @apply tw:w-full;
  @apply tw:[height:70px];
  @apply tw:[border-radius:14px];
}

.headteacher-directory-skeleton.headteacher-skeleton-mobile-action {
  @apply tw:[height:40px];
}

@media (max-width: 1100px) {
  .headteacher-directory-summary {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .headteacher-directory-toolbar-secondary {
    @apply tw:items-start;
    @apply tw:flex-col;
  }

  .headteacher-directory-toolbar-meta {
    @apply tw:w-full;
    @apply tw:justify-between;
  }
}

@media (max-width: 768px) {
  .headteacher-directory-enterprise {
    @apply tw:[padding:1rem];
    @apply tw:[border-radius:22px];
  }

  .headteacher-directory-enterprise .headteacher-directory-head {
    @apply tw:items-stretch;
  }

  .headteacher-directory-enterprise .headteacher-directory-cta {
    @apply tw:w-full;
    @apply tw:[min-width:0];
  }

  .headteacher-directory-create-actions {
    @apply tw:grid;
    @apply tw:w-full;
    @apply tw:[grid-template-columns:1fr];
  }

  .headteacher-directory-create-actions > .headteacher-button {
    @apply tw:w-full;
  }

  .headteacher-directory-toolbar-main {
    @apply tw:[grid-template-columns:1fr];
  }

  .headteacher-directory-toolbar-meta {
    @apply tw:items-start;
    @apply tw:flex-col;
  }

  .headteacher-directory-enterprise .headteacher-mobile-list {
    @apply tw:[padding:0.8rem];
  }

  .headteacher-directory-enterprise .headteacher-mobile-card {
    @apply tw:[border-radius:20px];
    @apply tw:[box-shadow:0_12px_26px_rgba(15,_23,_42,_0.07)];
  }

  .headteacher-directory-empty.is-mobile {
    @apply tw:[padding:1.5rem_1rem];
  }
}

@media (max-width: 480px) {
  .headteacher-directory-summary {
    @apply tw:[gap:0.55rem];
  }

  .headteacher-directory-summary-card {
    @apply tw:[gap:0.55rem];
    @apply tw:[padding:0.72rem];
    @apply tw:[border-radius:15px];
  }

  .headteacher-directory-summary-icon {
    @apply tw:[width:36px];
    @apply tw:[height:36px];
    @apply tw:[flex-basis:36px];
    @apply tw:[border-radius:12px];
  }

  .headteacher-directory-summary-card > div > span {
    @apply tw:[font-size:0.58rem];
  }

  .headteacher-directory-summary-card strong {
    @apply tw:[font-size:1.1rem];
  }

  .headteacher-directory-filter-chip {
    @apply tw:[padding-inline:0.55rem];
  }

  .headteacher-directory-empty-illustration {
    @apply tw:[width:76px];
    @apply tw:[height:76px];
    @apply tw:[border-radius:22px];
  }
}

@media (prefers-reduced-motion: reduce) {
  .headteacher-directory-enterprise *,
  .headteacher-directory-enterprise *::before,
  .headteacher-directory-enterprise *::after {
    @apply tw:scroll-auto!;
    @apply tw:[animation-duration:0.01ms]!;
    @apply tw:[animation-iteration-count:1]!;
    @apply tw:[transition-duration:0.01ms]!;
  }
}

.headteacher-attendance-section {
  @apply tw:[margin-top:0.95rem];
}

.headteacher-attendance-section > .headteacher-section-head {
  @apply tw:[margin-bottom:1rem];
}

.headteacher-attendance-section > .headteacher-attendance-dropdown-trigger {
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.headteacher-attendance-dropdown-trigger:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.22);
  outline-offset: 6px;
  border-radius: 12px;
}

.headteacher-attendance-dropdown-summary {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #64748b;
  font-size: 0.78rem;
  white-space: nowrap;
}

.headteacher-attendance-dropdown-summary strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: #eaf5df;
  color: #315d17;
}

.headteacher-attendance-dropdown-summary i {
  margin-left: 0.25rem;
  transition: transform 0.2s ease;
}

.headteacher-attendance-dropdown-summary i.is-open {
  transform: rotate(180deg);
}

.headteacher-attendance-dropdown-content {
  display: grid;
  gap: 0.9rem;
}

.headteacher-attendance-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #dbe4ef;
  border-radius: 14px;
  background: #f8fafc;
}

.headteacher-attendance-toolbar label {
  display: grid;
  gap: 0.3rem;
  min-width: min(280px, 100%);
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
}

.headteacher-attendance-toolbar select {
  min-height: 40px;
  padding: 0.55rem 2rem 0.55rem 0.7rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  font: inherit;
}

.headteacher-attendance-clear-filter {
  border: 0;
  padding: 0.55rem 0.7rem;
  background: transparent;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 640px) {
  .headteacher-attendance-dropdown-trigger,
  .headteacher-attendance-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .headteacher-attendance-dropdown-summary {
    justify-content: space-between;
  }
}

.headteacher-attendance-cell {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.headteacher-attendance-cell strong {
  @apply tw:[color:#0f172a];
}

.headteacher-attendance-cell small {
  @apply tw:[color:#64748b];
}

.headteacher-attendance-list {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
}

.headteacher-attendance-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:grid;
  @apply tw:[gap:0.65rem];
}

.headteacher-attendance-card-interactive {
  @apply tw:cursor-pointer;
  @apply tw:[transition:transform_0.18s_ease,_box-shadow_0.18s_ease,_border-color_0.18s_ease];
}

.headteacher-attendance-card-interactive:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[border-color:#93c5fd];
  @apply tw:[box-shadow:0_18px_32px_rgba(37,_99,_235,_0.12)];
}

.headteacher-attendance-card-interactive:focus-visible {
  @apply tw:[outline:3px_solid_rgba(37,_99,_235,_0.28)];
  @apply tw:[outline-offset:2px];
}

.headteacher-attendance-card-top {
  @apply tw:flex;
  @apply tw:[align-items:start];
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
}

.headteacher-attendance-card-top strong {
  @apply tw:block;
  @apply tw:[color:#0f172a];
}

.headteacher-attendance-card-top small {
  @apply tw:[color:#64748b];
}

.headteacher-attendance-stat-row {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.7rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
}

.headteacher-attendance-card-hint {
  @apply tw:[margin:0];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:700];
}

.headteacher-attendance-card-note,
.headteacher-attendance-section-copy {
  @apply tw:[margin:0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:600];
}

.headteacher-attendance-modal {
  @apply tw:[width:min(1080px,_calc(100vw_-_2rem))];
  @apply tw:[max-height:calc(100vh_-_2rem)];
  @apply tw:overflow-auto;
}

.headteacher-attendance-modal-head {
  @apply tw:[align-items:start];
  @apply tw:[gap:1rem];
}

.headteacher-attendance-title-block {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.headteacher-attendance-title-block h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
}

.headteacher-attendance-title-block p {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
}

.headteacher-attendance-eyebrow {
  @apply tw:inline-flex;
  @apply tw:w-fit;
  @apply tw:items-center;
  @apply tw:[padding:0.32rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(37,_99,_235,_0.1)];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.headteacher-attendance-summary-cards {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
  @apply tw:[flex:1];
}

.headteacher-attendance-summary-card {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:16px];
  @apply tw:[padding:0.85rem_0.95rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:grid;
  @apply tw:[gap:0.3rem];
}

.headteacher-attendance-summary-card span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
}

.headteacher-attendance-summary-card strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.4rem];
  @apply tw:[line-height:1];
}

.headteacher-attendance-summary-card.status-present {
  @apply tw:[background:linear-gradient(180deg,_#f0fdf4_0%,_#dcfce7_100%)];
}

.headteacher-attendance-summary-card.status-late {
  @apply tw:[background:linear-gradient(180deg,_#fff7ed_0%,_#ffedd5_100%)];
}

.headteacher-attendance-summary-card.status-absent {
  @apply tw:[background:linear-gradient(180deg,_#fef2f2_0%,_#fee2e2_100%)];
}

.headteacher-attendance-summary-card.status-excused {
  @apply tw:[background:linear-gradient(180deg,_#eff6ff_0%,_#dbeafe_100%)];
}

.headteacher-attendance-modal-state {
  @apply tw:[margin-top:0.5rem];
}

.headteacher-attendance-groups {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.headteacher-attendance-group {
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[padding:1rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:grid;
  @apply tw:[gap:0.9rem];
}

.headteacher-attendance-group-head {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.headteacher-attendance-group-head strong {
  @apply tw:[color:#0f172a];
}

.headteacher-attendance-status-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.38rem_0.78rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:800];
}

.headteacher-attendance-status-pill.status-present {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
}

.headteacher-attendance-status-pill.status-late {
  @apply tw:[background:#ffedd5];
  @apply tw:[color:#9a3412];
}

.headteacher-attendance-status-pill.status-absent {
  @apply tw:[background:#fee2e2];
  @apply tw:[color:#991b1b];
}

.headteacher-attendance-status-pill.status-excused {
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
}

.headteacher-attendance-group-empty {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.88rem];
}

.headteacher-attendance-group-list {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

.headteacher-attendance-student-row {
  @apply tw:flex;
  @apply tw:[align-items:start];
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:0.8rem_0.85rem];
}

.headteacher-attendance-student-copy {
  @apply tw:grid;
  @apply tw:[gap:0.22rem];
  @apply tw:[min-width:0];
}

.headteacher-attendance-student-copy strong {
  @apply tw:[color:#0f172a];
}

.headteacher-attendance-student-copy small {
  @apply tw:[color:#64748b];
  @apply tw:[word-break:break-word];
}

.headteacher-attendance-student-meta {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:justify-end;
  @apply tw:[gap:0.45rem];
}

.headteacher-attendance-meta-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.32rem_0.65rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:700];
}

.headteacher-mobile-card {
  @apply tw:[gap:1rem];
  @apply tw:[border-radius:22px];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(59,_130,_246,_0.08),_transparent_34%),______linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)];
  @apply tw:[box-shadow:0_18px_36px_rgba(15,_23,_42,_0.08)];
}

.headteacher-mobile-identity {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:[min-width:0];
}

.headteacher-mobile-top {
  @apply tw:flex;
  @apply tw:[align-items:start];
  @apply tw:justify-between;
  @apply tw:[gap:0.9rem];
}

.headteacher-mobile-copy {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

.headteacher-mobile-copy strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1rem];
}

.headteacher-mobile-copy .headteacher-email-link {
  @apply tw:[word-break:break-word];
}

.headteacher-mobile-date-chip {
  @apply tw:grid;
  @apply tw:[gap:0.12rem];
  @apply tw:[min-width:fit-content];
  @apply tw:[padding:0.5rem_0.72rem];
  @apply tw:[border:1px_solid_#dbeafe];
  @apply tw:[border-radius:14px];
  @apply tw:[background:rgba(239,_246,_255,_0.9)];
  @apply tw:text-right;
}

.headteacher-mobile-date-chip span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.headteacher-mobile-date-chip strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.8rem];
}

.headteacher-mobile-badges-primary {
  @apply tw:[gap:0.45rem];
}

.headteacher-subject-badge {
  @apply tw:[background:#eef2ff];
  @apply tw:[color:#3730a3];
  @apply tw:[border:1px_solid_#c7d2fe];
}

.headteacher-mobile-assignment-card {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border:1px_solid_#dbe4ef];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
}

.headteacher-mobile-assignment-head {
  @apply tw:flex;
  @apply tw:[align-items:start];
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
}

.headteacher-mobile-kicker {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:w-fit;
  @apply tw:[padding:0.26rem_0.58rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(37,_99,_235,_0.08)];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.headteacher-mobile-assignment-head h4 {
  @apply tw:[margin:0.4rem_0_0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.96rem];
}

.headteacher-assignment-state {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-height:32px];
  @apply tw:[padding:0.35rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
}

.headteacher-assignment-state.assigned {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
  @apply tw:[border:1px_solid_#bbf7d0];
}

.headteacher-assignment-state.unassigned {
  @apply tw:[background:#fef3c7];
  @apply tw:[color:#92400e];
  @apply tw:[border:1px_solid_#fde68a];
}

.headteacher-mobile-assignment-copy {
  @apply tw:[margin:0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.45];
}

.headteacher-mobile-stats {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
}

.headteacher-mobile-stat-card {
  @apply tw:grid;
  @apply tw:[gap:0.22rem];
  @apply tw:[padding:0.8rem_0.88rem];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:rgba(255,_255,_255,_0.86)];
}

.headteacher-mobile-stat-card span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.headteacher-mobile-stat-card strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.4];
}

.headteacher-directory-feedback {
  @apply tw:[margin:0_0_1rem];
  @apply tw:[padding:0.85rem_1rem];
  @apply tw:[border-radius:14px];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[font-size:0.88rem];
  @apply tw:[font-weight:700];
}

.headteacher-directory-feedback.success {
  @apply tw:[background:#f0fdf4];
  @apply tw:[border-color:#bbf7d0];
  @apply tw:[color:#166534];
}

.headteacher-directory-feedback.error {
  @apply tw:[background:#fef2f2];
  @apply tw:[border-color:#fecaca];
  @apply tw:[color:#991b1b];
}

.headteacher-assignment-cell,
.headteacher-mobile-assignment {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.headteacher-inline-select {
  @apply tw:w-full;
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.62rem_0.8rem];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.84rem];
  @apply tw:[font-weight:600];
}

.headteacher-inline-select:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#2563eb];
  @apply tw:[box-shadow:0_0_0_3px_rgba(37,_99,_235,_0.14)];
}

.headteacher-inline-select:disabled {
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#94a3b8];
}

.headteacher-row-actions {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
}

.headteacher-mobile-actions {
  @apply tw:[margin-top:0.1rem];
}

.headteacher-save-section-btn:disabled {
  @apply tw:[opacity:0.6];
  @apply tw:cursor-not-allowed;
  @apply tw:[box-shadow:none];
  @apply tw:transform-none;
}

.headteacher-mobile-hint {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:600];
  @apply tw:text-center;
}

@media (max-width: 640px) {
  .headteacher-mobile-top,
  .headteacher-attendance-card-top {
    @apply tw:flex-col;
  }

  .headteacher-attendance-summary-cards,
  .headteacher-mobile-stats,
  .headteacher-attendance-groups {
    @apply tw:[grid-template-columns:1fr];
  }

  .headteacher-attendance-student-row {
    @apply tw:flex-col;
  }

  .headteacher-attendance-student-meta {
    @apply tw:justify-start;
  }

  .headteacher-mobile-date-chip {
    @apply tw:w-full;
    @apply tw:text-left;
  }

  .headteacher-mobile-assignment-head {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .headteacher-row-actions {
    @apply tw:flex-col;
    @apply tw:items-stretch;
  }
}

/* Forest theme: mirrors the Head Teacher dashboard palette. */
.headteacher-management-page {
  --management-forest: #1e4307;
  --management-forest-deep: #122b03;
  --management-leaf: #5f8f32;
  --management-soft: #edf5e8;
  --management-lime: #b8d88a;
  --management-gold: #d4aa2f;
  --management-ink: #172014;
  --management-muted: #667260;
  --management-border: rgba(30, 67, 7, 0.14);
}

.headteacher-management-page .headteacher-main {
  @apply tw:[background:radial-gradient(circle_at_92%_3%,_rgba(95,_143,_50,_0.16),_transparent_26rem),______radial-gradient(circle_at_24%_100%,_rgba(184,_216,_138,_0.18),_transparent_30rem),______linear-gradient(145deg,_#f8fbf5_0%,_#f1f6ed_54%,_#edf3e8_100%)];
}

.headteacher-management-page .headteacher-directory-enterprise {
  --directory-navy: var(--management-ink);
  --directory-copy: #52604d;
  --directory-muted: var(--management-muted);
  --directory-line: rgba(30, 67, 7, 0.13);
  --directory-blue: var(--management-forest);
  @apply tw:[border-color:var(--management-border)];
  @apply tw:[background:radial-gradient(circle_at_96%_0%,_rgba(184,_216,_138,_0.2),_transparent_27%),______linear-gradient(180deg,_rgba(255,_255,_255,_0.98),_rgba(246,_250,_243,_0.98))];
  @apply tw:[box-shadow:0_22px_52px_rgba(30,_67,_7,_0.09)];
}

.headteacher-management-page .headteacher-section-title,
.headteacher-management-page .headteacher-directory-summary-card strong,
.headteacher-management-page .headteacher-directory-toolbar-meta strong,
.headteacher-management-page .headteacher-name-cell strong,
.headteacher-management-page .headteacher-directory-empty h3 {
  @apply tw:[color:var(--management-ink)];
}

.headteacher-management-page .headteacher-section-subtitle,
.headteacher-management-page .headteacher-directory-summary-card > div > span,
.headteacher-management-page .headteacher-directory-toolbar-meta,
.headteacher-management-page .headteacher-directory-empty p,
.headteacher-management-page .headteacher-mobile-hint {
  @apply tw:[color:var(--management-muted)];
}

.headteacher-management-page .headteacher-directory-cta,
.headteacher-management-page .headteacher-directory-empty-action,
.headteacher-management-page .headteacher-button-primary {
  @apply tw:[border-color:var(--management-forest)];
  @apply tw:[background:linear-gradient(135deg,_var(--management-forest),_#3f751d)];
  @apply tw:[color:#fff];
  @apply tw:[box-shadow:0_11px_24px_rgba(30,_67,_7,_0.22)];
}

.headteacher-management-page .headteacher-directory-cta:hover,
.headteacher-management-page .headteacher-directory-empty-action:hover,
.headteacher-management-page .headteacher-button-primary:hover:not(:disabled) {
  @apply tw:[border-color:#28580b];
  @apply tw:[background:linear-gradient(135deg,_#28580b,_#4d8427)];
  @apply tw:[box-shadow:0_14px_28px_rgba(30,_67,_7,_0.27)];
}

.headteacher-management-page .headteacher-directory-summary-card {
  @apply tw:[border-color:var(--management-border)];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
  @apply tw:[box-shadow:0_8px_20px_rgba(30,_67,_7,_0.045)];
}

.headteacher-management-page .headteacher-directory-summary-card:hover {
  @apply tw:[border-color:rgba(30,_67,_7,_0.28)];
  @apply tw:[box-shadow:0_14px_28px_rgba(30,_67,_7,_0.09)];
}

.headteacher-management-page .headteacher-directory-summary-icon {
  @apply tw:[background:linear-gradient(145deg,_var(--management-forest),_#477b22)];
  @apply tw:[color:#fff];
  @apply tw:[box-shadow:0_8px_17px_rgba(30,_67,_7,_0.17)];
}

.headteacher-management-page .headteacher-directory-summary-card.is-active .headteacher-directory-summary-icon {
  @apply tw:[background:linear-gradient(145deg,_#477b22,_#71a948)];
  @apply tw:[color:#fff];
}

.headteacher-management-page .headteacher-directory-summary-card.is-pending .headteacher-directory-summary-icon {
  @apply tw:[background:linear-gradient(145deg,_#8a6605,_var(--management-gold))];
  @apply tw:[color:#fff];
}

.headteacher-management-page .headteacher-directory-summary-card.is-inactive .headteacher-directory-summary-icon {
  @apply tw:[background:linear-gradient(145deg,_#596454,_#7b8975)];
  @apply tw:[color:#fff];
}

.headteacher-management-page .headteacher-directory-toolbar {
  @apply tw:[border-color:var(--management-border)];
  @apply tw:[background:rgba(237,_245,_232,_0.72)];
}

.headteacher-management-page .headteacher-directory-search > i,
.headteacher-management-page .headteacher-directory-sort-button i {
  @apply tw:[color:#78906b];
}

.headteacher-management-page .headteacher-directory-search input,
.headteacher-management-page .headteacher-directory-sort select,
.headteacher-management-page .headteacher-inline-select,
.headteacher-management-page .headteacher-announcement-modal textarea,
.headteacher-management-page .headteacher-form-group input,
.headteacher-management-page .headteacher-form-group select {
  @apply tw:[border-color:rgba(30,_67,_7,_0.18)];
  @apply tw:[background:#fff];
  @apply tw:[color:var(--management-ink)];
}

.headteacher-management-page .headteacher-directory-search input:focus,
.headteacher-management-page .headteacher-directory-sort select:focus,
.headteacher-management-page .headteacher-inline-select:focus,
.headteacher-management-page .headteacher-announcement-modal textarea:focus,
.headteacher-management-page .headteacher-form-group input:focus,
.headteacher-management-page .headteacher-form-group select:focus {
  @apply tw:[border-color:rgba(30,_67,_7,_0.55)];
  @apply tw:[outline:none];
  @apply tw:[box-shadow:0_0_0_4px_rgba(30,_67,_7,_0.11)];
}

.headteacher-management-page .headteacher-directory-clear-search {
  @apply tw:[background:var(--management-soft)];
  @apply tw:[color:var(--management-forest)];
}

.headteacher-management-page .headteacher-directory-filter-chip {
  @apply tw:[border-color:rgba(30,_67,_7,_0.14)];
  @apply tw:[color:#52604d];
}

.headteacher-management-page .headteacher-directory-filter-chip:hover {
  @apply tw:[border-color:rgba(30,_67,_7,_0.35)];
}

.headteacher-management-page .headteacher-directory-filter-chip.active {
  @apply tw:[border-color:var(--management-forest)];
  @apply tw:[background:var(--management-soft)];
  @apply tw:[color:var(--management-forest)];
  @apply tw:[box-shadow:0_4px_12px_rgba(30,_67,_7,_0.1)];
}

.headteacher-management-page .headteacher-directory-filter-chip:focus-visible,
.headteacher-management-page .headteacher-directory-cta:focus-visible,
.headteacher-management-page .headteacher-directory-action-btn:focus-visible {
  @apply tw:[outline:3px_solid_rgba(30,_67,_7,_0.18)];
  @apply tw:[outline-offset:2px];
}

.headteacher-management-page .headteacher-directory-filter-chip.active strong {
  @apply tw:[background:#dcebd0];
  @apply tw:[color:var(--management-forest)];
}

.headteacher-management-page .headteacher-directory-reset,
.headteacher-management-page .headteacher-email-link,
.headteacher-management-page .headteacher-directory-action-btn.is-message {
  @apply tw:[color:#28580b];
}

.headteacher-management-page .headteacher-directory-reset:hover {
  @apply tw:[background:var(--management-soft)];
}

.headteacher-management-page .headteacher-directory-loading,
.headteacher-management-page .headteacher-directory-enterprise .headteacher-table-shell,
.headteacher-management-page .headteacher-directory-mobile-skeleton,
.headteacher-management-page .headteacher-mobile-card {
  @apply tw:[border-color:var(--management-border)];
  @apply tw:[background:rgba(255,_255,_255,_0.92)];
  @apply tw:[box-shadow:0_14px_32px_rgba(30,_67,_7,_0.06)];
}

.headteacher-management-page .headteacher-directory-enterprise .headteacher-table thead th {
  @apply tw:[border-bottom-color:rgba(30,_67,_7,_0.13)];
  @apply tw:[background:rgba(237,_245,_232,_0.96)];
  @apply tw:[color:#52604d];
}

.headteacher-management-page .headteacher-directory-enterprise .headteacher-table tbody td {
  @apply tw:[background:#fff];
}

.headteacher-management-page .headteacher-directory-enterprise .headteacher-table tbody tr:nth-child(even) td {
  @apply tw:[background:#fafcf8];
}

.headteacher-management-page .headteacher-directory-enterprise .headteacher-table-row-interactive:hover {
  @apply tw:[box-shadow:0_10px_26px_rgba(30,_67,_7,_0.09)];
}

.headteacher-management-page .headteacher-directory-enterprise .headteacher-table-row-interactive:hover td {
  @apply tw:[background:#f1f7ed];
}

.headteacher-management-page .headteacher-directory-enterprise .headteacher-avatar {
  @apply tw:[outline-color:#dcebd0];
  @apply tw:[box-shadow:0_7px_16px_rgba(30,_67,_7,_0.12)];
}

.headteacher-management-page .headteacher-directory-action-btn {
  @apply tw:[border-color:rgba(30,_67,_7,_0.15)];
  @apply tw:[color:#52604d];
}

.headteacher-management-page .headteacher-directory-action-btn.is-save {
  @apply tw:[border-color:#c8dcb8];
  @apply tw:[background:var(--management-soft)];
  @apply tw:[color:var(--management-forest)];
}

.headteacher-management-page .headteacher-directory-action-btn.is-activate {
  @apply tw:[border-color:#bad7a6];
  @apply tw:[background:#f0f8ea];
  @apply tw:[color:#28580b];
}

.headteacher-management-page .headteacher-directory-empty-illustration,
.headteacher-management-page .headteacher-directory-loading-icon {
  @apply tw:[background:linear-gradient(145deg,_#f2f8ee,_#dcebd0)];
  @apply tw:[color:var(--management-forest)];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(30,_67,_7,_0.18),_0_16px_32px_rgba(30,_67,_7,_0.1)];
}

.headteacher-management-page .headteacher-empty-orbit {
  @apply tw:[border-color:rgba(30,_67,_7,_0.24)];
}

.headteacher-management-page .headteacher-directory-skeleton {
  @apply tw:[background:#e3ecdd];
}

.headteacher-management-page .headteacher-page-btn.active {
  @apply tw:[border-color:var(--management-forest)];
  @apply tw:[background:linear-gradient(135deg,_var(--management-forest),_#3f751d)];
  @apply tw:[color:#fff];
}

.headteacher-management-page .headteacher-students-modal,
.headteacher-management-page .headteacher-attendance-modal {
  @apply tw:[border-color:var(--management-border)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(184,_216,_138,_0.18),_transparent_30%),______linear-gradient(180deg,_#fff,_#f5f9f1)];
  @apply tw:[box-shadow:0_32px_72px_rgba(30,_67,_7,_0.18)];
}

.headteacher-management-page .headteacher-students-eyebrow,
.headteacher-management-page .headteacher-attendance-eyebrow {
  @apply tw:[color:var(--management-forest)];
}

.headteacher-management-page .headteacher-students-summary-card,
.headteacher-management-page .headteacher-attendance-summary-card,
.headteacher-management-page .headteacher-student-card,
.headteacher-management-page .headteacher-attendance-card {
  @apply tw:[border-color:var(--management-border)];
  @apply tw:[box-shadow:0_14px_28px_rgba(30,_67,_7,_0.06)];
}

.headteacher-management-page .headteacher-mobile-card-interactive:hover,
.headteacher-management-page .headteacher-mobile-card-interactive:focus-visible,
.headteacher-management-page .headteacher-student-card:hover {
  @apply tw:[border-color:rgba(30,_67,_7,_0.28)];
  @apply tw:[box-shadow:0_18px_36px_rgba(30,_67,_7,_0.11)];
}

.headteacher-management-page .headteacher-inline-select:disabled {
  @apply tw:[background:#f3f6f1];
  @apply tw:[color:#7c8975];
}

.headteacher-management-page .headteacher-directory-feedback.success {
  @apply tw:[border-color:rgba(30,_67,_7,_0.16)];
  @apply tw:[background:var(--management-soft)];
  @apply tw:[color:var(--management-forest)];
}

body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.active,
body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.router-link-active,
body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.router-link-exact-active {
  @apply tw:[border-color:var(--management-forest)]!;
  @apply tw:[background:linear-gradient(135deg,_var(--management-forest),_#3e711d)]!;
  @apply tw:[box-shadow:0_12px_22px_rgba(30,_67,_7,_0.18)]!;
}

body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.active > span,
body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.router-link-active > span,
body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.router-link-exact-active > span {
  @apply tw:[color:#fff]!;
}

body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.active i,
body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.router-link-active i,
body.headteacher-dashboard .headteacher-management-page .headteacher-sidebar .headteacher-nav-link.router-link-exact-active i {
  @apply tw:[border-color:rgba(255,_255,_255,_0.16)]!;
  @apply tw:[background:rgba(255,_255,_255,_0.14)]!;
  @apply tw:[color:#fff]!;
}

.headteacher-management-page .headteacher-students-modal { @apply tw:[width:min(1100px,_calc(100vw_-_32px))]; @apply tw:[max-width:calc(100vw_-_32px)]; @apply tw:[min-width:0]; @apply tw:box-border; }
.headteacher-management-page .headteacher-students-table-shell,
.headteacher-management-page .headteacher-students-table-wrap { @apply tw:[min-width:0]; @apply tw:w-full; }
.headteacher-management-page .headteacher-students-table { @apply tw:table-fixed; @apply tw:w-full; @apply tw:[min-width:0]; }
.headteacher-management-page .headteacher-students-table th,
.headteacher-management-page .headteacher-students-table td { @apply tw:whitespace-normal; @apply tw:[overflow-wrap:anywhere]; @apply tw:[padding:0.75rem_0.5rem]; }
.headteacher-management-page .headteacher-students-table th:first-child { @apply tw:[width:24%]; }
.headteacher-management-page .headteacher-students-table th:nth-child(2) { @apply tw:[width:24%]; }
.headteacher-management-page .headteacher-student-copy { @apply tw:[min-width:0]; @apply tw:[overflow-wrap:anywhere]; }
.headteacher-management-page .headteacher-students-modal .headteacher-email-link { @apply tw:whitespace-normal; @apply tw:[overflow-wrap:anywhere]; }
.headteacher-management-page .headteacher-students-modal .headteacher-badge { @apply tw:whitespace-normal; @apply tw:max-w-full; }
@media (max-width: 900px) {
  .headteacher-management-page .headteacher-students-table-wrap { @apply tw:hidden; }
  .headteacher-management-page .headteacher-students-mobile-list { @apply tw:grid; @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))]; @apply tw:[gap:1rem]; }
}
@media (max-width: 600px) {
  .headteacher-management-page .headteacher-students-mobile-list { @apply tw:[grid-template-columns:minmax(0,_1fr)]; }
}

</style>
