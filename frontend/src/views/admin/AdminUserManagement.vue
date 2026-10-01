<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-content">
          <button
            type="button"
            class="mobile-menu-toggle"
            @click="toggleSidebar"
            :aria-label="isSidebarOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="isSidebarOpen ? 'true' : 'false'"
            aria-controls="admin-sidebar-drawer"
            title="Menu"
          >
            <i class="fas fa-bars"></i>
          </button>
          <div class="admin-logo">
            <div class="admin-logo-icon">
              <img src="/logo.png" alt="EduMatch" class="admin-logo-img" />
            </div>
            <div class="admin-logo-text">
              <h1>EduMatch Admin</h1>
              <span class="page-title">User Management</span>
            </div>
          </div>
          <div class="admin-actions">
            <div ref="accountMenuRef" class="account-menu">
              <button
                type="button"
                class="header-account-trigger"
                aria-label="Account menu"
                title="Settings"
                :aria-expanded="isAccountMenuOpen ? 'true' : 'false'"
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

    <div class="admin-layout">
      <!-- Sidebar -->
      <aside id="admin-sidebar-drawer" class="admin-sidebar" :class="{ active: isSidebarOpen }">
        <div class="sidebar-header">
          <div class="admin-sidebar-brand">
            <div class="admin-sidebar-brand-icon">
              <img src="/logo.png" alt="EduMatch" class="admin-sidebar-logo-img" />
            </div>
            <div class="admin-sidebar-brand-copy">
              <h3>EduMatch</h3>
              <p>Admin Portal</p>
            </div>
          </div>
          <button type="button" class="sidebar-close" @click="closeSidebar" aria-label="Close sidebar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <nav class="sidebar-menu sidebar-nav">
          <div class="nav-section">
            <h4 class="nav-section-title">Navigation</h4>
            <router-link to="/admin/dashboard" class="nav-link sidebar-item sidebar-item--dashboard" :class="{ active: isActive('/admin/dashboard') }" @click="closeSidebar">
              <i class="fas fa-tachometer-alt"></i>
              <span>Overview</span>
            </router-link>
            <router-link to="/admin/users" class="nav-link sidebar-item sidebar-item--users" :class="{ active: isActive('/admin/users') }" @click="closeSidebar">
              <i class="fas fa-user-cog"></i>
              <span>User Management</span>
            </router-link>
            <router-link to="/admin/requests" class="nav-link sidebar-item sidebar-item--requests" :class="{ active: isActive('/admin/requests') }" @click="closeSidebar">
              <i class="fas fa-inbox"></i>
              <span>Request</span>
            </router-link>
            <router-link to="/admin/login-attempts" class="nav-link sidebar-item sidebar-item--login-attempts" :class="{ active: isActive('/admin/login-attempts') }" @click="closeSidebar">
              <i class="fas fa-right-to-bracket"></i>
              <span>Login Attempts</span>
            </router-link>
            <router-link to="/admin/audit-logs" class="nav-link sidebar-item sidebar-item--audit-logs" :class="{ active: isActive('/admin/audit-logs') }" @click="closeSidebar">
              <i class="fas fa-clipboard-list"></i>
              <span>Audit Logs</span>
            </router-link>
          </div>
        </nav>
      </aside>
      <button
        v-if="isSidebarOpen"
        type="button"
        class="sidebar-backdrop"
        aria-label="Close sidebar"
        @click="closeSidebar"
      ></button>

      <!-- Main Content -->
      <main class="admin-main">
        <!-- Page Header -->
        <div class="page-header fade-in">
          <div class="header-left">
            <h2>User Management</h2>
            <p>Manage students and teachers across the platform</p>
          </div>
        </div>

        <!-- User Filters -->
        <section class="user-filters section-card fade-in tw:inline:[animation-delay:0.2s] tw:inline:[border-color:#69aa47]!" >
          <div class="filter-row">
            <div class="filter-group">
              <label for="roleFilter"><i class="fas fa-user-tag"></i> Role</label>
              <select id="roleFilter" v-model="filters.role" class="filter-select">
                <option value="all">All Roles</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
                <option value="headteacher">Head Teachers Only</option>
                <option value="secretary">Secretaries Only</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="statusFilter"><i class="fas fa-circle"></i> Status</label>
              <select id="statusFilter" v-model="filters.status" class="filter-select">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="dateFilter"><i class="fas fa-calendar"></i> Join Date</label>
              <select id="dateFilter" v-model="filters.dateRange" class="filter-select">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            <div class="filter-group">
              <label for="sortBy"><i class="fas fa-sort"></i> Sort By</label>
              <select id="sortBy" v-model="sortBy" class="filter-select">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="active">Most Active</option>
              </select>
            </div>

            <button class="btn btn-outline" @click="clearFilters">
              <i class="fas fa-times"></i>
              Reset
            </button>
          </div>
        </section>

        <!-- Users Table -->
        <section class="users-table-section section-card fade-in tw:inline:[animation-delay:0.3s] tw:inline:[border-color:#69aa47]!" >
          <div class="table-header">
            <div class="table-info">
              <span class="table-eyebrow">User directory</span>
              <h3>Manage users</h3>
              <p class="table-count">
                {{ filteredUsers.length }} {{ filteredUsers.length === 1 ? 'user matches' : 'users match' }} the current view
              </p>
            </div>
            <div class="table-actions">
              <div class="table-search">
                <label for="tableUserSearch" class="sr-only">Search users</label>
                <i class="fas fa-search" aria-hidden="true"></i>
                <input
                  id="tableUserSearch"
                  v-model="searchQuery"
                  type="search"
                  class="table-search-input"
                  placeholder="Search users by name, email, or username"
                  autocomplete="off"
                >
                <button
                  v-if="searchQuery"
                  type="button"
                  class="table-search-clear"
                  aria-label="Clear user search"
                  @click="searchQuery = ''"
                >
                  <i class="fas fa-times" aria-hidden="true"></i>
                </button>
              </div>
              <button
                type="button"
                class="btn new-user-trigger user-list-add-btn"
                :class="{ active: modals.addUser }"
                @click="openAddUserModal"
                :aria-pressed="modals.addUser ? 'true' : 'false'"
              >
                <i class="fas fa-user-plus" aria-hidden="true"></i>
                <span>Add user</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="users-table" id="usersTable">
              <caption class="sr-only">Users, access details, learning activity, and account actions</caption>
              <thead>
                <tr>
                  <th class="select-col">
                    <div class="checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        id="selectAll" 
                        v-model="selectAll"
                        @change="toggleSelectAll"
                        aria-label="Select all users on this page"
                      >
                    </div>
                  </th>
                  <th class="user-col">User</th>
                  <th class="access-col">Access</th>
                  <th class="learning-col">Learning</th>
                  <th class="activity-col">Activity</th>
                  <th class="actions-col"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody id="usersTableBody">
                <template v-if="filteredUsers.length > 0">
                  <tr 
                    v-for="user in paginatedUsers" 
                    :key="user.id"
                    class="user-row"
                    :class="user.role"
                    :data-user-id="user.id"
                    :data-role="user.role"
                    :data-status="user.status"
                  >
                    <td class="select-col" data-label="Select">
                      <div class="checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          class="user-checkbox"
                          :id="'user-' + user.id"
                          v-model="selectedUsers"
                          :value="user.id"
                          :aria-label="'Select ' + user.name"
                        >
                      </div>
                    </td>
                    <td class="user-col" data-label="User">
                      <div class="user-info">
                        <div class="user-avatar">
                          <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="avatar-img">
                          <div v-else class="avatar-placeholder" :class="user.role">
                            {{ getInitials(user.name) }}
                          </div>
                        </div>
                        <div class="user-details">
                          <div class="user-name-row">
                            <h4 class="user-name">{{ user.name }}</h4>
                            <span class="online-status" :class="user.isOnline ? 'online' : 'offline'"></span>
                          </div>
                          <p class="user-email">{{ user.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="access-col" data-label="Access">
                      <div class="access-stack">
                        <span class="role-badge" :class="user.role">
                          <i :class="getRoleIcon(user.role)"></i>
                          {{ capitalize(user.role) }}
                        </span>
                        <span class="status-badge" :class="user.status">
                          <i class="fas fa-circle"></i>
                          {{ capitalize(user.status) }}
                        </span>
                      </div>
                    </td>
                    <td class="learning-col" data-label="Learning">
                      <template v-if="user.role === 'student'">
                        <div class="learning-summary">
                          <div class="learning-summary-head">
                            <span>{{ user.lessonsCompleted ?? user.coursesCompleted ?? 0 }} lessons</span>
                            <strong>{{ user.completionRate || 0 }}%</strong>
                          </div>
                          <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: (user.completionRate || 0) + '%' }"></div>
                          </div>
                        </div>
                      </template>
                      <template v-else-if="user.role === 'teacher'">
                        <div class="learning-stat">
                          <strong>{{ user.lessonsCreated ?? user.coursesCreated ?? 0 }}</strong>
                          <span>lessons created</span>
                        </div>
                      </template>
                      <span v-else class="learning-empty">No learning data</span>
                    </td>
                    <td class="activity-col" data-label="Activity">
                      <div class="activity-detail">
                        <span class="activity-label">Last active</span>
                        <strong class="time-text">{{ getLastActive(user.lastActive) }}</strong>
                      </div>
                      <div class="activity-detail activity-joined">
                        <span class="activity-label">Joined</span>
                        <span class="date-text">{{ formatDate(user.createdAt) }}</span>
                      </div>
                    </td>
                    <td class="actions-col" data-label="Actions">
                      <div class="action-buttons">
                        <button 
                          type="button" 
                          class="action-btn more-btn"
                          @click="openUserActions(user)"
                          :title="'More options for ' + user.name"
                          aria-label="Open user actions"
                        >
                          <i class="fas fa-ellipsis-h"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-else class="no-data-row">
                  <td colspan="6">
                    <div class="no-data">
                      <div class="no-data-icon">
                        <i class="fas fa-user-slash"></i>
                      </div>
                      <h4>No users found</h4>
                      <p>Try a different search or reset the current filters.</p>
                      <button
                        type="button"
                        class="btn btn-outline"
                        @click="clearFilters"
                      >
                        <i class="fas fa-undo"></i>
                        Reset view
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="filteredUsers.length > 0" class="pagination">
            <div class="pagination-info">
              Showing
              <strong>{{ ((currentPage - 1) * pageSize) + 1 }}–{{ ((currentPage - 1) * pageSize) + paginatedUsers.length }}</strong>
              of {{ filteredUsers.length }}
            </div>
            <div class="pagination-controls">
              <button 
                class="pagination-btn prev" 
                @click="prevPage"
                :disabled="currentPage <= 1"
              >
                <i class="fas fa-chevron-left"></i>
                Previous
              </button>
              
              <div class="pagination-numbers">
                <button 
                  v-for="page in visiblePages" 
                  :key="page"
                  class="pagination-number"
                  :class="{ active: page === currentPage }"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
                
                <span v-if="totalPages > 5" class="pagination-ellipsis">...</span>
                <button 
                  v-if="totalPages > 5" 
                  class="pagination-number"
                  @click="goToPage(totalPages)"
                >
                  {{ totalPages }}
                </button>
              </div>
              
              <button 
                class="pagination-btn next" 
                @click="nextPage"
                :disabled="currentPage >= totalPages"
              >
                Next
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </section>
        <footer>© 2026 EduMatch</footer>
      </main>
    </div>

    <!-- Add User Modal -->
    <div class="modal new-user-modal" :class="{ active: modals.addUser }">
      <div class="modal-overlay" @click="closeAddUserModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>New User</h3>
          <button class="modal-close" @click="closeAddUserModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="addUserForm" class="user-form" @submit.prevent="createUser">
            <div class="form-tabs">
              <button 
                type="button" 
                class="form-tab" 
                :class="{ active: addUserTab === 'basic' }"
                @click="addUserTab = 'basic'"
              >
                Basic Info
              </button>
              <button 
                type="button" 
                class="form-tab" 
                :class="{ active: addUserTab === 'role' }"
                @click="goToAddUserTab('role')"
              >
                Role & Permissions
              </button>
              <button 
                type="button" 
                class="form-tab" 
                :class="{ active: addUserTab === 'additional' }"
                @click="goToAddUserTab('additional')"
              >
                Additional Info
              </button>
            </div>

            <div class="tab-content" :class="{ active: addUserTab === 'basic' }" id="basicTab">
              <div class="form-group">
                <label for="fullName">Full Name *</label>
                <input 
                  type="text" 
                  id="fullName" 
                  v-model="newUser.fullName"
                  required
                  placeholder="Enter full name"
                >
              </div>
              <div class="form-group">
                <label for="username">Username *</label>
                <input 
                  type="text" 
                  id="username" 
                  v-model="newUser.username"
                  required
                  placeholder="Enter username"
                >
              </div>
              <div class="form-group">
                <label for="email">Email Address *</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="newUser.email"
                  :class="{ 'email-invalid': addUserEmailError }"
                  :aria-invalid="addUserEmailError ? 'true' : undefined"
                  required
                  placeholder="user@gmail.com"
                >
              </div>
              <div class="form-group">
                <label>Account Access</label>
                <p class="hint-text">
                  EduMatch will generate a secure temporary password automatically and email it to this user. They will be required to change it on first login.
                </p>
              </div>
            </div>

            <div class="tab-content" :class="{ active: addUserTab === 'role' }" id="roleTab">
              <div class="form-group">
                <label for="userRole">User Role *</label>
                <div class="role-options">
                  <div
                    class="role-option" 
                    :class="{ selected: newUser.role === 'secretary' }"
                    @click="newUser.role = 'secretary'"
                  >
                    <div class="role-icon">
                      <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="role-info">
                      <h4>Secretary</h4>
                      <p>Can manage Head Teacher, Teacher, and Student accounts</p>
                    </div>
                    <div class="role-check">
                      <i class="fas fa-check"></i>
                    </div>
                  </div>
                  <div class="role-option" :class="{ selected: newUser.role === 'teacher' }" @click="newUser.role = 'teacher'">
                    <div class="role-icon"><i class="fas fa-chalkboard-teacher"></i></div>
                    <div class="role-info"><h4>Teacher</h4><p>Can manage classes, lessons, assessments, and students</p></div>
                    <div class="role-check"><i class="fas fa-check"></i></div>
                  </div>
                  <div class="role-option" :class="{ selected: newUser.role === 'student' }" @click="newUser.role = 'student'">
                    <div class="role-icon"><i class="fas fa-user-graduate"></i></div>
                    <div class="role-info"><h4>Student</h4><p>Can access assigned learning activities and records</p></div>
                    <div class="role-check"><i class="fas fa-check"></i></div>
                  </div>
                  <div 
                    class="role-option" 
                    :class="{ selected: newUser.role === 'headteacher' }"
                    @click="newUser.role = 'headteacher'"
                  >
                    <div class="role-icon">
                      <i class="fas fa-user-shield"></i>
                    </div>
                    <div class="role-info">
                      <h4>HeadTeacher</h4>
                      <p>Can create Teacher accounts and manage one academic department</p>
                    </div>
                    <div class="role-check">
                      <i class="fas fa-check"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Account Status</label>
                <div class="readonly-field">
                  <input value="Active - password change required on first login" readonly class="tw:inline:[background:#f8fafc] tw:inline:[border:1px_solid_#e2e8f0] tw:inline:[color:#64748b]">
                </div>
              </div>

              <div v-if="['headteacher', 'teacher'].includes(newUser.role)" class="form-group">
                <label for="managedDepartment">Department *</label>
                <select id="managedDepartment" v-model="newUser.department" required>
                  <option value="" disabled>Select department</option>
                  <option v-for="department in departmentOptions" :key="department" :value="department">
                    {{ department }}
                  </option>
                </select>
              </div>
              <div v-if="newUser.role === 'teacher'" class="form-group">
                <label for="teacherSubject">Subject</label>
                <input id="teacherSubject" v-model.trim="newUser.subject" type="text" placeholder="Defaults to department">
              </div>
              <div v-if="newUser.role === 'student'" class="form-group">
                <label for="studentGradeLevel">Grade Level *</label>
                <select id="studentGradeLevel" v-model="newUser.gradeLevel" required>
                  <option v-for="grade in studentGradeLevels" :key="grade" :value="grade">{{ grade }}</option>
                </select>
              </div>
            </div>

            <div class="tab-content" :class="{ active: addUserTab === 'additional' }" id="additionalTab">
              <div class="form-group">
                <label for="contactNumber">Contact Number</label>
                <input 
                  type="tel" 
                  id="contactNumber" 
                  v-model.trim="newUser.contactNumber"
                  inputmode="tel"
                  placeholder="+63 912 345 6789"
                >
              </div>
              <div class="form-group">
                <label>Security</label>
                <p class="hint-text">
                  Temporary passwords are automatically generated, hashed before storage, and marked for mandatory password change after the first successful sign-in.
                </p>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="button" 
                class="btn btn-outline prev-tab" 
                v-if="addUserTab !== 'basic'"
                @click="prevTab"
              >
                <i class="fas fa-arrow-left"></i>
                Previous
              </button>
              <div class="action-right">
                <button 
                  type="button" 
                  class="btn btn-primary next-tab" 
                  v-if="addUserTab !== 'additional'"
                  @click="nextTab"
                >
                  Next
                </button>
                <button 
                  type="submit" 
                  class="btn btn-success submit-form"
                  v-if="addUserTab === 'additional'"
                  :disabled="isCreateInviteLoading"
                >
                  <i class="fas fa-user-plus"></i>
                  {{ isCreateInviteLoading ? 'Processing...' : 'Create User & Email Credentials' }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- User Actions Modal -->
    <div class="modal" :class="{ active: modals.userActions }">
      <div class="modal-overlay" @click="closeUserActionsModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-list-check"></i> More Options</h3>
          <button class="modal-close" @click="closeUserActionsModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="actions-grid" id="userActionsGrid">
            <button class="action-card"
              @click="viewUserProfile"
            >
              <i class="fas fa-user-circle"></i>
              View Profile
            </button>
            <button
              v-if="canManageUser(selectedUser)"
              class="action-card"
              @click="editUser"
            >
              <i class="fas fa-user-edit"></i>
              Edit User
            </button>
            <button 
              v-if="selectedUser?.role === 'student'"
              class="action-card"
              @click="viewUserProgress"
            >
              <i class="fas fa-chart-line"></i>
              View Progress
            </button>
            <button 
              v-if="selectedUser?.role === 'student'"
              class="action-card"
              @click="viewUserCourses"
            >
              <i class="fas fa-book-open"></i>
              View Subject
            </button>
            <button
              v-if="canManageUser(selectedUser) && ['student', 'teacher'].includes(selectedUser?.role)"
              class="action-card"
              @click="sendMessage"
            >
              <i class="fas fa-envelope"></i>
              Send Message
            </button>
            <button
              v-if="canManageUser(selectedUser) && selectedUser?.status === 'pending'"
              class="action-card"
              @click="sendInviteToUser"
            >
              <i class="fas fa-paper-plane"></i>
              Send Invite
            </button>
            <button
              v-if="canManageUser(selectedUser)"
              class="action-card"
              :class="{ active: selectedUser?.status === 'active' }"
              @click="toggleUserStatus"
            >
              <i :class="selectedUser?.status === 'active' ? 'fas fa-pause-circle' : 'fas fa-play-circle'"></i>
              {{ selectedUser?.status === 'active' ? 'Deactivate' : 'Activate' }}
            </button>
            <button
              v-if="canManageUser(selectedUser)"
              class="action-card danger"
              @click="confirmDeleteUser"
            >
              <i class="fas fa-trash-alt"></i>
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div class="modal edit-user-modal" :class="{ active: modals.editUser }">
      <div class="modal-overlay" @click="closeEditUserModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-user-edit"></i> Edit User</h3>
          <button class="modal-close" @click="closeEditUserModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="editUserForm" class="edit-form" @submit.prevent="saveUserEdit">
            <input type="hidden" id="editUserId" v-model="editUserData.id">

            <div class="form-section form-section--identity">
              <div class="form-section-heading">
                <span class="form-section-icon"><i class="fas fa-id-card" aria-hidden="true"></i></span>
                <div>
                  <div class="form-section-title">Basic information</div>
                  <p>Update the user’s identity and contact details.</p>
                </div>
              </div>
              <div class="form-group form-group--avatar">
                <label for="editProfileImage">Profile Picture</label>
                <div class="edit-avatar-field">
                  <div class="edit-avatar-preview">
                    <img
                      v-if="editUserData.avatarPreview || editUserData.avatar"
                      :src="editUserData.avatarPreview || editUserData.avatar"
                      :alt="editUserData.fullName || editUserData.email || 'User avatar'"
                    >
                    <div v-else class="avatar-placeholder" :class="editUserData.role || 'student'">
                      {{ getInitials(editUserData.fullName || editUserData.email || 'User') }}
                    </div>
                  </div>
                  <div class="edit-avatar-controls">
                    <input
                      id="editProfileImage"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      @change="handleEditAvatarChange"
                    >
                    <small>Allowed: JPG, JPEG, PNG, WEBP. Max 5MB.</small>
                  </div>
                </div>
              </div>
              <div class="form-fields-grid">
                <div class="form-group">
                  <label for="editFullName">Full Name</label>
                  <input type="text" id="editFullName" v-model="editUserData.fullName" required>
                </div>
                <div class="form-group">
                  <label for="editEmail">Email Address</label>
                  <input type="email" id="editEmail" v-model="editUserData.email" required>
                </div>
                <div class="form-group">
                  <label for="editUsername">Username</label>
                  <input type="text" id="editUsername" v-model="editUserData.username">
                </div>
                <div class="form-group">
                  <label for="editContactNumber">Contact Number</label>
                  <input
                    type="tel"
                    id="editContactNumber"
                    v-model.trim="editUserData.contactNumber"
                    inputmode="tel"
                    placeholder="+63 912 345 6789"
                  >
                </div>
              </div>
            </div>

            <div class="form-section form-section--account">
              <div class="form-section-heading">
                <span class="form-section-icon"><i class="fas fa-shield-alt" aria-hidden="true"></i></span>
                <div>
                  <div class="form-section-title">Account settings</div>
                  <p>Control access, assignment, and account availability.</p>
                </div>
              </div>
              <div class="form-fields-grid">
                <div class="form-group">
                  <label for="editRole">User Role</label>
                  <select id="editRole" v-model="editUserData.role" @change="onEditRoleChange">
                    <option v-for="role in allowedManagedRoles" :key="role" :value="role">{{ roleLabel(role) }}</option>
                  </select>
                </div>
                <div v-if="['headteacher', 'teacher'].includes(editUserData.role)" class="form-group">
                  <label for="editDepartment">Department</label>
                  <select id="editDepartment" v-model="editUserData.department">
                    <option value="" disabled>Select Department</option>
                    <option v-for="department in departmentOptions" :key="department" :value="department">
                      {{ department }}
                    </option>
                  </select>
                </div>
                <div v-if="editUserData.role === 'teacher'" class="form-group">
                  <label for="editSubject">Subject</label>
                  <input id="editSubject" v-model.trim="editUserData.subject" type="text" placeholder="Defaults to department">
                </div>
                <div v-if="editUserData.role === 'student'" class="form-group">
                  <label for="editGradeLevel">Grade Level</label>
                  <select id="editGradeLevel" v-model="editUserData.gradeLevel">
                    <option v-for="grade in studentGradeLevels" :key="grade" :value="grade">{{ grade }}</option>
                  </select>
                </div>
                <div v-if="editUserData.role === 'student'" class="form-group">
                  <label for="editStrand">Strand</label>
                  <select id="editStrand" v-model="editUserData.strand">
                    <option value="">Not assigned</option>
                    <option v-for="strand in studentStrands" :key="strand" :value="strand">{{ strand }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="editStatus">Account Status</label>
                  <select id="editStatus" v-model="editUserData.status">
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-actions">
          <button class="btn btn-success" @click="saveUserEdit" :disabled="isSavingEdit">
            <i class="fas fa-save"></i> {{ isSavingEdit ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- View Profile Modal -->
    <div class="modal profile-modal" :class="{ active: modals.viewProfile }">
      <div class="modal-overlay" @click="closeViewProfileModal"></div>
      <div class="modal-content large">
        <div class="modal-header">
          <h3><i class="fas fa-user-circle"></i> User Profile</h3>
          <button class="modal-close" @click="closeViewProfileModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div id="profileContent">
            <div v-if="isProfileLoading" class="empty-state small">
              <p>Loading user profile...</p>
            </div>
            <div v-else-if="selectedUser" class="profile-details profile-details--refined">
              <div class="profile-header">
                <div class="profile-avatar large">
                  <img v-if="selectedUser.avatar" :src="selectedUser.avatar" :alt="selectedUser.name">
                  <div v-else class="avatar-placeholder large" :class="selectedUser.role">
                    {{ getInitials(selectedUser.name) }}
                  </div>
                </div>
                <div class="profile-title">
                  <h2 class="profile-name">{{ selectedUser.name }}</h2>
                  <p class="profile-email">
                    <i class="fas fa-envelope" aria-hidden="true"></i>
                    <span>{{ selectedUser.email || 'No email provided' }}</span>
                  </p>
                  <div class="profile-meta-line">
                    <span class="profile-meta-strand">
                      {{ selectedUser.role === 'teacher' ? (selectedUser.subject || selectedUser.strand || 'TEACHER') : capitalize(selectedUser.role) }}
                    </span>
                    <span class="profile-meta-status" :class="(selectedUser.status || 'active').toLowerCase()">
                      <span class="status-dot" aria-hidden="true"></span>
                      {{ (selectedUser.status || 'active').toLowerCase() }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="profile-info-grid">
                <div class="info-section">
                  <h4>
                    <span class="info-section-icon"><i class="fas fa-address-card" aria-hidden="true"></i></span>
                    Contact information
                  </h4>
                  <div class="info-item info-item--wide">
                    <span class="info-label">Email address</span>
                    <span class="info-value">{{ selectedUser.email || 'N/A' }}</span>
                  </div>
                  <div v-if="['teacher', 'headteacher', 'secretary'].includes(selectedUser.role)" class="info-item">
                    <span class="info-label">Username</span>
                    <span class="info-value">{{ selectedUser.username || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Contact number</span>
                    <span class="info-value">{{ selectedUser.contactNumber || 'N/A' }}</span>
                  </div>
                </div>
                
                <div class="info-section">
                  <h4>
                    <span class="info-section-icon"><i class="fas fa-user-clock" aria-hidden="true"></i></span>
                    Account activity
                  </h4>
                  <div v-if="selectedUser.role === 'headteacher'" class="info-item info-item--wide">
                    <span class="info-label">Department</span>
                    <span class="info-value">{{ selectedUser.department || 'N/A' }}</span>
                  </div>
                  <div v-if="selectedUser.role === 'teacher'" class="info-item info-item--wide">
                    <span class="info-label">Subject</span>
                    <span class="info-value">{{ selectedUser.subject || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Joined</span>
                    <span class="info-value">{{ formatDate(selectedUser.createdAt) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last active</span>
                    <span class="info-value">{{ getLastActive(selectedUser.lastActive) }}</span>
                  </div>
                </div>
                
                <div v-if="selectedUser.role === 'student'" class="info-section">
                  <h4>
                    <span class="info-section-icon"><i class="fas fa-graduation-cap" aria-hidden="true"></i></span>
                    Learning summary
                  </h4>
                  <div class="info-item info-item--wide">
                    <span class="info-label">Enrolled track</span>
                    <span class="info-value">{{ selectedUser.enrolledTrack || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Completed</span>
                    <span class="info-value">{{ selectedUser.coursesCompleted || 0 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Completion rate</span>
                    <span class="info-value">{{ selectedUser.completionRate || 0 }}%</span>
                  </div>
                </div>
                
                <div v-if="selectedUser.role === 'teacher'" class="info-section">
                  <h4>
                    <span class="info-section-icon"><i class="fas fa-chalkboard-teacher" aria-hidden="true"></i></span>
                    Teaching summary
                  </h4>
                  <div class="info-item">
                    <span class="info-label">Lessons created</span>
                    <span class="info-value">{{ selectedUser.lessonsCreated || 0 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Students</span>
                    <span class="info-value">{{ selectedUser.students || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              <p>No user selected.</p>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button v-if="canManageUser(selectedUser)" class="btn btn-primary edit-user-btn" @click="editFromProfile">
            <i class="fas fa-user-edit"></i> Edit User
          </button>
        </div>
      </div>
    </div>

    <!-- View Progress Modal -->
    <div class="modal progress-modal" :class="{ active: modals.viewProgress }">
      <div class="modal-overlay" @click="closeViewProgressModal"></div>
      <div class="modal-content large">
        <div class="modal-header">
          <h3><i class="fas fa-chart-line"></i> Learning Progress</h3>
          <button class="modal-close" @click="closeViewProgressModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div id="progressContent">
            <div v-if="isProgressLoading" class="empty-state small">
              <p>Loading learning progress...</p>
            </div>
            <div v-else-if="selectedUser" class="progress-details">
              <section class="progress-hero" :class="selectedProgressCompletion > 0 ? 'is-active' : 'is-idle'">
                <div class="progress-hero-copy">
                  <div class="progress-hero-chips">
                    <span class="progress-track-chip">
                      {{ selectedUser.enrolledTrack || 'No track assigned yet' }}
                    </span>
                    <span class="progress-status-chip" :class="`tone-${selectedProgressState.tone}`">
                      {{ selectedProgressState.label }}
                    </span>
                  </div>
                  <div>
                    <h4>{{ selectedUser.name }}'s Progress</h4>
                    <p class="progress-subtitle">
                      A quick snapshot of subject activity, score trends, and assessment completion.
                    </p>
                  </div>
                  <div class="progress-hero-meta">
                    <span>
                      <i class="fas fa-book-open"></i>
                      {{ selectedUser.progressSummary?.enrolledSubjects || 0 }} enrolled subject{{ (selectedUser.progressSummary?.enrolledSubjects || 0) === 1 ? '' : 's' }}
                    </span>
                    <span>
                      <i class="fas fa-clock-rotate-left"></i>
                      Last submission {{ getLastActive(selectedUser.progressSummary?.lastSubmittedAt) }}
                    </span>
                  </div>
                </div>
                <div class="progress-hero-metric">
                  <div class="progress-pill">
                    {{ formatMetricNumber(selectedUser.progressSummary?.completionRate) }}%
                  </div>
                  <small>overall completion</small>
                </div>
                <div class="progress-hero-track" aria-hidden="true">
                  <div class="progress-hero-bar">
                    <span :style="{ width: `${selectedProgressCompletion}%` }"></span>
                  </div>
                  <div class="progress-hero-track-meta">
                    <span>{{ selectedUser.progressSummary?.completedAssessments || 0 }} assessments completed</span>
                    <span>{{ formatMetricNumber(selectedUser.progressSummary?.averageScore) }}% average score</span>
                  </div>
                </div>
              </section>
              <div class="progress-stats">
                <article class="stat-card">
                  <div class="stat-icon tone-blue">
                    <i class="fas fa-list-check"></i>
                  </div>
                  <div class="stat-copy">
                    <div class="stat-label">Assessment Completion</div>
                    <div class="stat-value">{{ formatMetricNumber(selectedUser.progressSummary?.completionRate) }}%</div>
                    <div class="stat-note">Progress across all assigned assessments</div>
                  </div>
                </article>
                <article class="stat-card">
                  <div class="stat-icon tone-amber">
                    <i class="fas fa-chart-column"></i>
                  </div>
                  <div class="stat-copy">
                    <div class="stat-label">Average Score</div>
                    <div class="stat-value">{{ formatMetricNumber(selectedUser.progressSummary?.averageScore) }}%</div>
                    <div class="stat-note">Performance trend from completed submissions</div>
                  </div>
                </article>
                <article class="stat-card">
                  <div class="stat-icon tone-teal">
                    <i class="fas fa-check-double"></i>
                  </div>
                  <div class="stat-copy">
                    <div class="stat-label">Completed Assessments</div>
                    <div class="stat-value">{{ selectedUser.progressSummary?.completedAssessments || 0 }}</div>
                    <div class="stat-note">Finished activities and exams</div>
                  </div>
                </article>
                <article class="stat-card">
                  <div class="stat-icon tone-slate">
                    <i class="fas fa-book-open-reader"></i>
                  </div>
                  <div class="stat-copy">
                    <div class="stat-label">Enrolled Subjects</div>
                    <div class="stat-value">{{ selectedUser.progressSummary?.enrolledSubjects || 0 }}</div>
                    <div class="stat-note">Current subjects included in this snapshot</div>
                  </div>
                </article>
              </div>

              <div class="progress-breakdown">
                <section class="progress-panel">
                  <div class="progress-panel-head">
                    <div>
                      <span class="progress-panel-kicker">Overview</span>
                      <h5>Progress Summary</h5>
                    </div>
                    <span class="panel-emphasis">
                      {{ selectedUser.learningSnapshot?.totalQuizzes || 0 }} quizzes / {{ selectedUser.learningSnapshot?.totalActivities || 0 }} activities
                    </span>
                  </div>
                  <div class="progress-summary-list">
                    <div class="progress-summary-row">
                      <span>Total Quiz</span>
                      <strong>{{ selectedUser.learningSnapshot?.totalQuizzes || 0 }}</strong>
                    </div>
                    <div class="progress-summary-row">
                      <span>Total Activity</span>
                      <strong>{{ selectedUser.learningSnapshot?.totalActivities || 0 }}</strong>
                    </div>
                    <div class="progress-summary-row progress-summary-row--stacked">
                      <span>Latest Exam Result</span>
                      <div class="progress-summary-value">
                        <strong>{{ getLearningSnapshotExamLabel(selectedUser.learningSnapshot) }}</strong>
                        <small>{{ getLearningSnapshotExamMeta(selectedUser.learningSnapshot) }}</small>
                      </div>
                    </div>
                    <div class="progress-summary-row progress-summary-row--stacked">
                      <span>AI Recommendation</span>
                      <div class="progress-summary-value">
                        <strong>{{ getLearningSnapshotRecommendationLabel(selectedUser.learningSnapshot) }}</strong>
                        <small>{{ getLearningSnapshotRecommendationMeta(selectedUser.learningSnapshot) }}</small>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="progress-panel">
                  <div class="progress-panel-head">
                    <div>
                      <span class="progress-panel-kicker">Activity</span>
                      <h5>Recent Submissions</h5>
                    </div>
                    <span class="panel-emphasis">{{ selectedUser.recentSubmissions?.length || 0 }} latest</span>
                  </div>
                  <div v-if="selectedUser.recentSubmissions?.length" class="recent-submissions-list">
                    <div
                      v-for="submission in selectedUser.recentSubmissions"
                      :key="submission.id"
                      class="recent-submission-item"
                    >
                      <div class="recent-submission-copy">
                        <div class="recent-submission-top">
                          <strong>{{ submission.title }}</strong>
                          <span class="recent-submission-score">{{ formatMetricNumber(submission.percentage) }}%</span>
                        </div>
                        <span>{{ submission.subjectTitle }}</span>
                        <small>{{ submission.examType || 'Assessment' }}</small>
                      </div>
                      <div class="recent-submission-metrics">
                        <span>{{ submission.score || 0 }} / {{ submission.totalPoints || 0 }} points</span>
                        <span>{{ getLastActive(submission.submittedAt) }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="progress-empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <strong>No completed assessments yet</strong>
                    <p>New submissions will appear here once the student starts completing activities.</p>
                  </div>
                </section>
              </div>

              <section class="progress-panel progress-subjects-panel">
                <div class="progress-panel-head">
                  <div>
                    <span class="progress-panel-kicker">Subjects</span>
                    <h5>Subject Progress</h5>
                  </div>
                  <span class="panel-emphasis">{{ selectedUser.courses?.length || 0 }} subject{{ (selectedUser.courses?.length || 0) === 1 ? '' : 's' }}</span>
                </div>
                <div v-if="selectedUser.courses?.length" class="courses-list progress-courses-list">
                  <article v-for="course in selectedUser.courses" :key="course.id" class="course-item">
                    <div class="course-info">
                      <div class="course-title-row">
                        <div class="course-title-copy">
                          <h4>{{ course.title }}</h4>
                          <p class="course-summary-text">{{ getCourseSummaryText(course) }}</p>
                        </div>
                      </div>
                      <p class="course-meta">
                        {{ course.code || 'No code' }} • {{ course.track || 'No track' }}
                      </p>
                      <p class="course-meta">
                        {{ course.completedAssessments || 0 }} / {{ course.assessmentCount || 0 }} assessments completed
                      </p>
                    </div>
                    <div class="course-progress">
                      <div class="course-progress-head">
                        <div class="course-progress-copy">
                          <span class="course-progress-label">Course progress</span>
                          <small>{{ getCourseCompletionCopy(course) }}</small>
                        </div>
                        <strong class="course-progress-value">{{ formatMetricNumber(course.progress) }}%</strong>
                      </div>
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: (course.progress || 0) + '%' }"></div>
                      </div>
                      <div class="course-progress-meta">
                        <span>{{ getCourseAssessmentCountCopy(course) }}</span>
                        <span v-if="hasCourseAverageScore(course)">{{ getCourseAverageScoreCopy(course) }}</span>
                      </div>
                    </div>
                  </article>
                </div>
                <div v-else class="progress-empty-state">
                  <i class="fas fa-book-open"></i>
                  <strong>No enrolled subjects yet</strong>
                  <p>Subject cards will appear here once the student has active enrollments.</p>
                </div>
              </section>
            </div>
            <div v-else class="empty-state small">
              <p>No student selected.</p>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button
            class="btn btn-primary export-report-btn"
            @click="exportProgress"
            :disabled="isProgressLoading || !selectedUser"
          >
            <i class="fas fa-download"></i> Export Report
          </button>
        </div>
      </div>
    </div>

    <!-- View Courses Modal -->
    <div class="modal" :class="{ active: modals.viewCourses }">
      <div class="modal-overlay" @click="closeViewCoursesModal"></div>
      <div class="modal-content large">
        <div class="modal-header">
          <h3><i class="fas fa-book-open"></i> View Subject</h3>
          <button class="modal-close" @click="closeViewCoursesModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div id="coursesContent">
            <div v-if="isProgressLoading" class="empty-state small">
              <p>Loading enrolled subjects...</p>
            </div>
            <div v-else-if="selectedUser" class="courses-list">
              <div v-for="course in selectedUser.courses" :key="course.id" class="course-item">
                <div class="course-info">
                  <div class="course-title-row">
                    <div class="course-title-copy">
                      <h4>{{ course.title }}</h4>
                      <p class="course-summary-text">{{ getCourseSummaryText(course) }}</p>
                    </div>
                  </div>
                  <p class="course-meta">{{ course.code || 'No code' }} • {{ course.track || 'No track' }}</p>
                  <p class="course-meta">
                    {{ course.completedAssessments || 0 }} / {{ course.assessmentCount || 0 }} assessments completed
                  </p>
                </div>
                <div class="course-progress">
                  <div class="course-progress-head">
                    <div class="course-progress-copy">
                      <span class="course-progress-label">Course progress</span>
                      <small>{{ getCourseCompletionCopy(course) }}</small>
                    </div>
                    <strong class="course-progress-value">{{ formatMetricNumber(course.progress) }}%</strong>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: course.progress + '%' }"></div>
                  </div>
                  <div class="course-progress-meta">
                    <span>{{ getCourseAssessmentCountCopy(course) }}</span>
                    <span v-if="hasCourseAverageScore(course)">{{ getCourseAverageScoreCopy(course) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="!selectedUser.courses?.length" class="empty-state small">
                <p>No enrolled subjects yet.</p>
              </div>
            </div>
            <div v-else class="empty-state small">
              <p>No student selected.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Send Message Modal -->
    <div class="modal message-modal" :class="{ active: modals.sendMessage }">
      <div class="modal-overlay" @click="closeSendMessageModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-envelope"></i> Send Message</h3>
          <button class="modal-close" @click="closeSendMessageModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form id="messageForm" class="message-form" @submit.prevent="sendMessageToUser">
            <input type="hidden" id="messageUserId" v-model="messageData.userId">
            <div class="message-recipient">
              <div class="message-recipient-avatar">
                <img
                  v-if="selectedUser?.avatar"
                  :src="selectedUser.avatar"
                  :alt="selectedUser.name"
                >
                <div v-else class="avatar-placeholder" :class="selectedUser?.role || 'student'">
                  {{ getInitials(selectedUser?.name || 'User') }}
                </div>
              </div>
              <div class="message-recipient-copy">
                <span class="message-recipient-label">Sending to</span>
                <strong id="recipientName">{{ selectedUser ? selectedUser.name : '' }}</strong>
                <span>{{ selectedUser?.email || 'In-app user' }}</span>
              </div>
              <span class="message-recipient-check" aria-label="Recipient selected">
                <i class="fas fa-check" aria-hidden="true"></i>
              </span>
            </div>
            <div class="message-compose-card">
              <div class="form-group">
                <label for="messageSubject">Subject</label>
                <input 
                  type="text" 
                  id="messageSubject" 
                  v-model="messageData.subject"
                  placeholder="Enter message subject" 
                  required
                >
              </div>
              <div class="form-group">
                <label for="messageContent">Message</label>
                <textarea 
                  id="messageContent" 
                  v-model="messageData.content"
                  placeholder="Write a clear message..."
                  required
                ></textarea>
              </div>
            </div>
            <div class="message-options">
              <span class="message-options-title">Delivery options</span>
              <label class="checkbox-label message-option-card">
                <input type="checkbox" v-model="messageData.sendEmail">
                <span class="checkmark"></span>
                <span class="message-option-copy">
                  <strong>Send as email too</strong>
                  <small>Deliver a copy to the user’s email address.</small>
                </span>
              </label>
              <label class="checkbox-label message-option-card">
                <input type="checkbox" v-model="messageData.urgent">
                <span class="checkmark"></span>
                <span class="message-option-copy">
                  <strong>Mark as urgent</strong>
                  <small>Highlight this message for faster attention.</small>
                </span>
              </label>
            </div>
          </form>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary send-message-btn" :disabled="isSendingMessage" @click="sendMessageToUser">
            <i :class="['fas', isSendingMessage ? 'fa-spinner fa-spin' : 'fa-paper-plane']"></i>
            {{ isSendingMessage ? ' Sending...' : ' Send Message' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div class="modal" :class="{ active: modals.confirmation }">
      <div class="modal-overlay" @click="closeConfirmationModal"></div>
      <div class="modal-content small">
        <div class="modal-header">
          <h3 id="confirmTitle">{{ confirmTitle }}</h3>
          <button class="modal-close" @click="closeConfirmationModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="confirm-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p id="confirmationMessage">{{ confirmMessage }}</p>
          <div v-if="confirmRequiresPassword" class="confirm-password-group">
            <label for="confirmDeletePassword" class="confirm-password-label">Enter your admin password to continue</label>
            <input
              id="confirmDeletePassword"
              v-model="confirmPassword"
              type="password"
              class="confirm-password-input"
              placeholder="Current admin password"
              autocomplete="current-password"
              @keydown.enter.prevent="executeConfirmAction"
            >
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="closeConfirmationModal">
            Cancel
          </button>
          <button class="btn btn-danger" :disabled="confirmRequiresPassword && !confirmPassword.trim()" @click="executeConfirmAction">
            {{ confirmRequiresPassword ? 'Delete User' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast show">
      <div class="toast-content">
        <div class="toast-icon" :class="toastType">
          <i :class="toastIconClass"></i>
        </div>
        <div class="toast-message">
          <h4>{{ toastTitle }}</h4>
          <p id="toastMessage">{{ toastMessage }}</p>
        </div>
        <button class="toast-close" @click="showToast = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { debounce } from 'lodash'
import { useAuthStore } from '../../stores/auth.js'
import { isValidPhilippinePhone, normalizePhilippinePhone } from '../../utils/phone.js'

export default {
  name: 'AdminUserManagement',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const resolveApiBaseUrl = () => {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    }
    const apiBaseUrl = resolveApiBaseUrl()
    const managementApiPath = computed(() => `${apiBaseUrl}/admin`)
    const allowedManagedRoles = computed(() => ['secretary', 'headteacher', 'teacher', 'student'])
    const roleLabel = (role) => ({
      secretary: 'Secretary',
      headteacher: 'Head Teacher',
      teacher: 'Teacher',
      student: 'Student',
    }[role] || String(role || 'User'))
    const canManageUser = (user) => allowedManagedRoles.value.includes(String(user?.role || '').trim().toLowerCase())

    const getAuthConfig = (headers = {}) => ({
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
        ...headers,
      },
    })
    
    // State
    const users = ref([])
    const searchQuery = ref('')
    const filters = reactive({
      role: 'all',
      status: 'all',
      dateRange: 'all'
    })
    const sortBy = ref('newest')
    const currentPage = ref(1)
    const pageSize = ref(5)
    const selectedUsers = ref([])
    const selectAll = ref(false)
    
    // Modal states
    const modals = reactive({
      addUser: false,
      userActions: false,
      editUser: false,
      viewProfile: false,
      viewProgress: false,
      viewCourses: false,
      sendMessage: false,
      confirmation: false
    })
    
    // Form data
    const addUserTab = ref('basic')
    const addUserEmailError = ref(false)
    const newUser = reactive({
      fullName: '',
      username: '',
      email: '',
      role: 'secretary',
      status: 'active',
      department: '',
      subject: '',
      gradeLevel: 'Grade 10',
      strand: '',
      contactNumber: '',
    })
    const departmentOptions = [
      'Mathematics',
      'English',
      'Science',
      'TLE',
      'Filipino',
      'Araling Panlipunan',
      'Edukasyon sa Pagpapakatao (ESP)',
      'MAPEH',
    ]
    const studentGradeLevels = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
    const studentStrands = ['STEM', 'HUMSS', 'ABM', 'TVL']
    
    const selectedUser = ref(null)
    const editUserData = ref({
      id: '',
      fullName: '',
      email: '',
      username: '',
      role: '',
      status: '',
      department: '',
      subject: '',
      gradeLevel: 'Grade 10',
      strand: '',
      contactNumber: '',
      avatar: '',
      avatarPreview: ''
    })
    const selectedEditAvatarFile = ref(null)
    const editAvatarPreviewUrl = ref('')
    
    const messageData = reactive({
      userId: '',
      subject: '',
      content: '',
      sendEmail: true,
      urgent: false
    })
    
    const confirmAction = ref(null)
    const confirmTitle = ref('Confirm Action')
    const confirmMessage = ref('Are you sure you want to perform this action?')
    const confirmPassword = ref('')
    const confirmRequiresPassword = ref(false)
    const isCreateInviteLoading = ref(false)
    const isSavingEdit = ref(false)
    const isProfileLoading = ref(false)
    const isProgressLoading = ref(false)
    const isSendingMessage = ref(false)
    const archivedPdfExportRequests = ref([])
    const isExportRequestsLoading = ref(false)
    const activeExportRequestActionId = ref('')
    const exportRequestsSummary = reactive({
      pendingCount: 0,
      totalShown: 0,
      approvalExpiresInMinutes: 30,
    })
    
    const showToast = ref(false)
    const toastMessage = ref('')
    const toastType = ref('success')
    const previousBodyOverflow = ref('')
    const SIDEBAR_BREAKPOINT = 1024
    const USER_PRESENCE_REFRESH_MS = 5000
    const isSidebarOpen = ref(false)
    const accountMenuRef = ref(null)
    const isAccountMenuOpen = ref(false)
    const STUDENT_FIXED_GRADE_LEVEL = 'Grade 10'
    const isFetchingUsers = ref(false)
    let userPresenceRefreshTimerId = null

    const toastTitle = computed(() => {
      if (toastType.value === 'error') return 'Error'
      if (toastType.value === 'warning') return 'Warning'
      return 'Success'
    })

    const toastIconClass = computed(() => {
      if (toastType.value === 'error') return 'fas fa-exclamation-circle'
      if (toastType.value === 'warning') return 'fas fa-exclamation-triangle'
      return 'fas fa-check-circle'
    })
    
    // Stats
    const stats = reactive({
      totalStudents: 0,
      totalTeachers: 0,
      activeUsers: 0,
      studentGrowth: 0,
      teacherGrowth: 0
    })
    
    // Computed
    const filteredUsers = computed(() => {
      let filtered = [...users.value]
      
      // Apply role filter
      if (filters.role !== 'all') {
        filtered = filtered.filter(u => u.role === filters.role)
      }
      
      // Apply status filter
      if (filters.status !== 'all') {
        filtered = filtered.filter(u => u.status === filters.status)
      }
      
      // Apply date filter
      if (filters.dateRange !== 'all') {
        const now = new Date()
        filtered = filtered.filter(u => {
          const joinDate = new Date(u.createdAt)
          switch (filters.dateRange) {
            case 'today':
              return joinDate.toDateString() === now.toDateString()
            case 'week':
              const weekAgo = new Date(now.setDate(now.getDate() - 7))
              return joinDate >= weekAgo
            case 'month':
              const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
              return joinDate >= monthAgo
            case 'year':
              const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1))
              return joinDate >= yearAgo
            default:
              return true
          }
        })
      }
      
      // Apply search
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(u => 
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.username?.toLowerCase().includes(query)
        )
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy.value) {
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt)
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt)
          case 'name_asc':
            return (a.name || '').localeCompare(b.name || '')
          case 'name_desc':
            return (b.name || '').localeCompare(a.name || '')
          case 'active':
            return (b.lastActive || 0) - (a.lastActive || 0)
          default:
            return 0
        }
      })
      
      return filtered
    })
    
    const totalPages = computed(() => {
      return Math.ceil(filteredUsers.value.length / pageSize.value)
    })
    
    const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredUsers.value.slice(start, end)
    })
    
    const visiblePages = computed(() => {
      const pages = []
      const maxVisible = 5
      
      if (totalPages.value <= maxVisible) {
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage.value <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i)
        } else if (currentPage.value >= totalPages.value - 2) {
          for (let i = totalPages.value - 3; i <= totalPages.value; i++) pages.push(i)
        } else {
          for (let i = currentPage.value - 1; i <= currentPage.value + 1; i++) pages.push(i)
        }
      }
      
      return pages
    })
    
    // Methods
    const isActive = (path) => {
      return route.path === path
    }

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

    const goToProfile = () => {
      closeAccountMenu()
      router.push('/admin/profile')
    }

    const goToSettings = () => {
      closeAccountMenu()
      router.push('/admin/settings')
    }

    const syncMobileMenuBodyState = () => {
      if (typeof window === 'undefined') return
      const shouldLockBody = window.innerWidth <= SIDEBAR_BREAKPOINT && isSidebarOpen.value
      document.body.classList.toggle('admin-mobile-menu-open', shouldLockBody)
    }
    
    const handleLogout = async () => {
      try {
        closeAccountMenu()
        authStore.logout()
        router.push('/auth/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    const handleDocumentClick = (event) => {
      if (!isAccountMenuOpen.value) return
      if (accountMenuRef.value?.contains(event.target)) return
      closeAccountMenu()
    }

    const handleDocumentKeydown = (event) => {
      if (event.key === 'Escape') {
        closeAccountMenu()
      }
    }
    
    const formatNumber = (num) => {
      return new Intl.NumberFormat().format(num || 0)
    }
    
    const getInitials = (name) => {
      if (!name) return 'U'
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    
    const capitalize = (str) => {
      if (!str) return ''
      return str.charAt(0).toUpperCase() + str.slice(1)
    }

    const resolveUserAvatarUrl = (user) => {
      const profileImage = String(user?.profileImage || '').trim()
      const raw = profileImage || String(user?.avatar || '').trim()
      if (!raw) return ''

      // The backend may return an absolute localhost URL for private storage.
      // Rebuild it from the active API base so admin avatars work through the
      // Vite/deployment proxy rather than the viewer's localhost.
      try {
        const parsed = new URL(raw, window.location.origin)
        if (parsed.pathname.startsWith('/api/storage/')) {
          return `${apiBaseUrl}${parsed.pathname.slice('/api'.length)}${parsed.search}${parsed.hash}`
        }
      } catch (_error) {
        // Preserve a non-URL value below; it may be a local preview URL.
      }

      return raw
    }

    const cleanupEditAvatarPreview = () => {
      if (editAvatarPreviewUrl.value) {
        URL.revokeObjectURL(editAvatarPreviewUrl.value)
        editAvatarPreviewUrl.value = ''
      }
      selectedEditAvatarFile.value = null
      if (editUserData.value) {
        editUserData.value.avatarPreview = ''
      }
    }

    const handleEditAvatarChange = (event) => {
      const file = event?.target?.files?.[0] || null
      if (!file) {
        cleanupEditAvatarPreview()
        return
      }

      const isImage = String(file.type || '').startsWith('image/')
      if (!isImage) {
        showToastMessage('Please select a valid image file', 'error')
        event.target.value = ''
        cleanupEditAvatarPreview()
        return
      }

      const maxFileSize = 5 * 1024 * 1024
      if (Number(file.size || 0) > maxFileSize) {
        showToastMessage('Image must be 5MB or smaller', 'error')
        event.target.value = ''
        cleanupEditAvatarPreview()
        return
      }

      cleanupEditAvatarPreview()
      selectedEditAvatarFile.value = file
      editAvatarPreviewUrl.value = URL.createObjectURL(file)
      editUserData.value.avatarPreview = editAvatarPreviewUrl.value
    }

    const resolveEnrolledTrack = (user) => {
      const enrollmentTrack = String(user?.enrollment?.track || '').trim()
      if (enrollmentTrack) return enrollmentTrack

      const enrollmentTrackId = String(user?.enrollment?.trackId || '').trim()
      if (!enrollmentTrackId) return ''

      return enrollmentTrackId.replace(/[-_]+/g, ' ').trim().toUpperCase()
    }
    
    const getRoleIcon = (role) => {
      switch (role) {
        case 'student': return 'fas fa-graduation-cap'
        case 'teacher': return 'fas fa-chalkboard-teacher'
        case 'headteacher': return 'fas fa-user-shield'
        case 'secretary': return 'fas fa-user-tie'
        case 'admin': return 'fas fa-shield-alt'
        default: return 'fas fa-user'
      }
    }

    const uniqueBy = (items, keyResolver) => {
      const seen = new Set()
      return (Array.isArray(items) ? items : []).filter((item, index) => {
        const key = String(keyResolver(item, index) || '').trim()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    }

    const firstDefined = (...values) => {
      for (const value of values) {
        if (value !== undefined) return value
      }
      return undefined
    }

    const toMetricNumber = (value, fallback = 0) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : fallback
    }

    const formatMetricNumber = (value, digits = 1) => {
      const normalized = toMetricNumber(value, 0)
      return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(digits)
    }

    const clampProgress = (value) => Math.max(0, Math.min(100, toMetricNumber(value, 0)))

    const getProgressState = (value) => {
      const normalized = clampProgress(value)
      if (normalized >= 80) return { label: 'On Track', tone: 'strong' }
      if (normalized >= 45) return { label: 'Building Momentum', tone: 'steady' }
      if (normalized > 0) return { label: 'Getting Started', tone: 'starting' }
      return { label: 'Not Started', tone: 'idle' }
    }

    const selectedProgressCompletion = computed(() => clampProgress(selectedUser.value?.progressSummary?.completionRate))
    const selectedProgressState = computed(() => getProgressState(selectedProgressCompletion.value))

    const normalizeProgressSummary = (user = {}) => {
      const summary = user?.progressSummary || {}
      const progress = user?.progress || user?.enrollment?.progress || {}

      return {
        masteryProgress: toMetricNumber(firstDefined(summary.masteryProgress, progress.masteryProgress, user?.completionRate), 0),
        averageScore: toMetricNumber(firstDefined(summary.averageScore, progress.averageScore), 0),
        completedAssessments: toMetricNumber(
          firstDefined(summary.completedAssessments, progress.completedAssessments, user?.lessonsCompleted, user?.coursesCompleted),
          0
        ),
        completedSubjects: toMetricNumber(firstDefined(summary.completedSubjects, user?.coursesCompleted), 0),
        completionRate: toMetricNumber(firstDefined(summary.completionRate, user?.completionRate, progress.masteryProgress), 0),
        enrolledSubjects: toMetricNumber(firstDefined(summary.enrolledSubjects, user?.enrolledCourses), 0),
        pendingSubjects: toMetricNumber(summary.pendingSubjects, 0),
        totalLessons: toMetricNumber(summary.totalLessons, 0),
        totalAssessments: toMetricNumber(summary.totalAssessments, 0),
        lastCalculatedAt: firstDefined(summary.lastCalculatedAt, progress.lastCalculatedAt, null),
        lastSubmittedAt: firstDefined(summary.lastSubmittedAt, null),
      }
    }

    const normalizeCourseRows = (user = {}) => {
      const rows = Array.isArray(user?.courses) ? user.courses : []
      return rows
        .map((course, index) => ({
          id: course?.id || course?._id || `course-${index + 1}`,
          title: course?.title || course?.name || 'Subject',
          code: course?.code || '',
          track: course?.track || '',
          teacherName: course?.teacherName || '',
          lessonCount: toMetricNumber(course?.lessonCount, 0),
          assessmentCount: toMetricNumber(course?.assessmentCount, 0),
          completedAssessments: toMetricNumber(course?.completedAssessments, 0),
          averageScore: toMetricNumber(course?.averageScore, 0),
          progress: toMetricNumber(course?.progress, 0),
          lastSubmittedAt: course?.lastSubmittedAt || null,
        }))
        .sort((left, right) => String(left?.title || '').localeCompare(String(right?.title || '')))
    }

    const normalizeRecentSubmissions = (user = {}) => {
      const rows = Array.isArray(user?.recentSubmissions) ? user.recentSubmissions : []
      return rows.map((submission, index) => ({
        id: submission?.id || submission?._id || `submission-${index + 1}`,
        title: submission?.title || 'Assessment',
        subjectTitle: submission?.subjectTitle || 'Subject',
        examType: submission?.examType || '',
        score: toMetricNumber(submission?.score, 0),
        totalPoints: toMetricNumber(submission?.totalPoints, 0),
        percentage: toMetricNumber(submission?.percentage, 0),
        status: submission?.status || 'completed',
        submittedAt: submission?.submittedAt || null,
      }))
    }

    const normalizeLearningSnapshot = (user = {}, fallbackUser = null) => {
      const fallback = fallbackUser || {}
      const snapshot = user?.learningSnapshot || fallback?.learningSnapshot || {}
      const examResult = snapshot?.latestExamResult || {}
      const aiRecommendation = snapshot?.aiRecommendation || {}

      return {
        totalQuizzes: toMetricNumber(snapshot?.totalQuizzes, 0),
        totalActivities: toMetricNumber(snapshot?.totalActivities, 0),
        latestExamResult: {
          title: String(examResult?.title || '').trim(),
          gradingPeriod: String(examResult?.gradingPeriod || '').trim(),
          score: toMetricNumber(examResult?.score, 0),
          totalPoints: toMetricNumber(examResult?.totalPoints, 0),
          percentage: toMetricNumber(examResult?.percentage, 0),
          submittedAt: examResult?.submittedAt || null,
        },
        aiRecommendation: {
          strand: String(aiRecommendation?.strand || '').trim(),
          confidence: String(aiRecommendation?.confidence || '').trim(),
          explanation: String(aiRecommendation?.explanation || '').trim(),
          status: String(aiRecommendation?.status || 'not_started').trim(),
          updatedAt: aiRecommendation?.updatedAt || null,
        },
      }
    }

    const mapUserRecord = (user = {}, index = 0, fallbackUser = null) => {
      const fallback = fallbackUser || {}
      const progressSummary = normalizeProgressSummary({
        ...fallback,
        ...user,
      })
      const resolvedAvatar = resolveUserAvatarUrl(user) || resolveUserAvatarUrl(fallback)
      const courses = normalizeCourseRows(user)
      const recentSubmissions = normalizeRecentSubmissions(user)
      const learningSnapshot = normalizeLearningSnapshot(user, fallback)

      return {
        ...fallback,
        id: user?._id || user?.id || fallback?.id || `user-${index + 1}`,
        name: firstDefined(user?.name, fallback?.name, ''),
        email: firstDefined(user?.email, fallback?.email, ''),
        username: firstDefined(
          user?.username,
          fallback?.username,
          user?.email ? String(user.email).split('@')[0] : '',
        ),
        role: firstDefined(user?.role, fallback?.role, ''),
        status: firstDefined(user?.status, fallback?.status, 'active'),
        inviteExpiresAt: firstDefined(user?.inviteExpiresAt, fallback?.inviteExpiresAt, null),
        inviteSentAt: firstDefined(user?.inviteSentAt, fallback?.inviteSentAt, null),
        inviteUsedAt: firstDefined(user?.inviteUsedAt, fallback?.inviteUsedAt, null),
        department: firstDefined(user?.department, fallback?.department, ''),
        subject: firstDefined(user?.subject, fallback?.subject, ''),
        strand: firstDefined(user?.strand, fallback?.strand, ''),
        gradeLevel: firstDefined(user?.gradeLevel, fallback?.gradeLevel, 'Grade 10'),
        contactNumber: normalizePhilippinePhone(firstDefined(user?.contactNumber, fallback?.contactNumber, '')),
        profileImage: firstDefined(user?.profileImage, fallback?.profileImage, ''),
        avatar: resolvedAvatar,
        isOnline: firstDefined(user?.isOnline, fallback?.isOnline, false),
        enrollment: firstDefined(user?.enrollment, fallback?.enrollment, null),
        enrolledTrack: resolveEnrolledTrack(user) || fallback?.enrolledTrack || '',
        progress: {
          masteryProgress: progressSummary.masteryProgress,
          averageScore: progressSummary.averageScore,
          completedAssessments: progressSummary.completedAssessments,
          lastCalculatedAt: progressSummary.lastCalculatedAt,
        },
        progressSummary,
        enrolledCourses: toMetricNumber(firstDefined(user?.enrolledCourses, fallback?.enrolledCourses, progressSummary.enrolledSubjects), 0),
        coursesCompleted: toMetricNumber(firstDefined(user?.coursesCompleted, fallback?.coursesCompleted, progressSummary.completedSubjects), 0),
        lessonsCompleted: toMetricNumber(
          firstDefined(user?.lessonsCompleted, user?.coursesCompleted, fallback?.lessonsCompleted, progressSummary.completedAssessments),
          0
        ),
        completionRate: toMetricNumber(firstDefined(user?.completionRate, fallback?.completionRate, progressSummary.completionRate), 0),
        courses: courses.length ? courses : (fallback?.courses || []),
        recentSubmissions: recentSubmissions.length ? recentSubmissions : (fallback?.recentSubmissions || []),
        learningSnapshot,
        lessonsCreated: toMetricNumber(firstDefined(user?.lessonsCreated, user?.coursesCreated, fallback?.lessonsCreated), 0),
        students: toMetricNumber(firstDefined(user?.students, user?.studentsTaught, fallback?.students), 0),
        createdAt: firstDefined(user?.createdAt, fallback?.createdAt, null),
        lastActive: firstDefined(
          user?.lastActive,
          user?.lastActivityAt,
          user?.lastLoginAt,
          user?.updatedAt,
          user?.createdAt,
          fallback?.lastActive,
          fallback?.lastActivityAt,
          fallback?.lastLoginAt,
          fallback?.createdAt,
          null
        ),
      }
    }

    const normalizeHeadTeacherRole = (role) => {
      const normalized = String(role || '').trim().toLowerCase()
      return normalized === 'head_teacher' ? 'headteacher' : normalized
    }

    const hasDepartmentHeadTeacher = ({ department, excludeUserId = '' } = {}) => {
      const normalizedDepartment = String(department || '').trim().toLowerCase()
      if (!normalizedDepartment) return false
      const excludedId = String(excludeUserId || '').trim()
      return users.value.some((user) => {
        const userRole = normalizeHeadTeacherRole(user?.role)
        const userDepartment = String(user?.department || '').trim().toLowerCase()
        const userId = String(user?.id || user?._id || '').trim()
        if (excludedId && userId === excludedId) return false
        return userRole === 'headteacher' && userDepartment === normalizedDepartment
      })
    }
    
    const formatDate = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const formatDateTime = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    }

    const formatArchivedPdfRequestStatus = (status) => {
      const normalized = String(status || '').trim().toLowerCase()
      if (normalized === 'approved') return 'Approved'
      if (normalized === 'rejected') return 'Rejected'
      if (normalized === 'fulfilled') return 'Used'
      if (normalized === 'expired') return 'Expired'
      return 'Pending'
    }

    const getArchivedPdfRequestStatusClass = (status) => {
      const normalized = String(status || '').trim().toLowerCase()
      if (normalized === 'approved') return 'is-approved'
      if (normalized === 'pending') return 'is-pending'
      if (normalized === 'rejected') return 'is-rejected'
      if (normalized === 'fulfilled') return 'is-fulfilled'
      if (normalized === 'expired') return 'is-expired'
      return 'is-neutral'
    }

    const formatArchivedPdfFilterSummary = (request = {}) => {
      const filters = request?.filters || {}
      const parts = [
        filters.schoolYear && filters.schoolYear !== 'all' ? `SY ${filters.schoolYear}` : 'All school years',
        filters.department && filters.department !== 'all' ? filters.department : 'All departments',
        filters.gradeLevel && filters.gradeLevel !== 'all' ? filters.gradeLevel : 'All grades',
      ]

      if (String(filters.searchTerm || '').trim()) {
        parts.push(`Search: ${filters.searchTerm}`)
      }

      return parts.join(' | ')
    }
    
    const getLastActive = (lastActive) => {
      if (!lastActive) return 'Never'
      
      const now = new Date()
      const last = new Date(lastActive)
      const diffMs = now - last
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} minutes ago`
      if (diffHours < 24) return `${diffHours} hours ago`
      if (diffDays < 7) return `${diffDays} days ago`
      
      return formatDate(lastActive)
    }

    const fetchArchivedPdfExportRequests = async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          isExportRequestsLoading.value = true
        }

        const response = await axios.get(
          `${apiBaseUrl}/admin/export-requests/archived-pdf`,
          {
            ...getAuthConfig(),
            params: { limit: 8 },
          }
        )

        archivedPdfExportRequests.value = Array.isArray(response.data?.requests) ? response.data.requests : []
        exportRequestsSummary.pendingCount = Number(response.data?.summary?.pendingCount || 0)
        exportRequestsSummary.totalShown = Number(response.data?.summary?.totalShown || archivedPdfExportRequests.value.length)
        exportRequestsSummary.approvalExpiresInMinutes = Number(response.data?.summary?.approvalExpiresInMinutes || 30)
      } catch (error) {
        if (!silent) {
          showToastMessage(error.response?.data?.message || 'Failed to load secretary PDF export requests', 'error')
        }
      } finally {
        if (!silent) {
          isExportRequestsLoading.value = false
        }
      }
    }

    const reviewArchivedPdfExportRequest = async (request, decision) => {
      const requestId = String(request?.id || '').trim()
      if (!requestId || !['approved', 'rejected'].includes(decision)) {
        showToastMessage('Invalid export approval request action', 'error')
        return
      }

      if (decision === 'rejected') {
        const confirmed = window.confirm(`Reject the archived PDF export request from ${request?.requester?.name || 'this secretary'}?`)
        if (!confirmed) return
      }

      try {
        activeExportRequestActionId.value = requestId
        await axios.patch(
          `${apiBaseUrl}/admin/export-requests/${requestId}/review`,
          { decision },
          getAuthConfig()
        )
        showToastMessage(
          decision === 'approved'
            ? 'Archived PDF export request approved successfully'
            : 'Archived PDF export request rejected successfully'
        )
        await fetchArchivedPdfExportRequests({ silent: true })
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to review archived PDF export request', 'error')
      } finally {
        activeExportRequestActionId.value = ''
      }
    }

    const getCourseCompletionCopy = (course = {}) => {
      const total = toMetricNumber(course?.assessmentCount, 0)
      const completed = toMetricNumber(course?.completedAssessments, 0)

      if (total <= 0) return 'No assessments published yet'
      if (completed <= 0) return `No submissions yet out of ${total} assessments`
      return `${completed} of ${total} assessments completed`
    }

    const getCourseSummaryText = (course = {}) => {
      const lessons = toMetricNumber(course?.lessonCount, 0)
      const total = toMetricNumber(course?.assessmentCount, 0)

      if (lessons <= 0 && total <= 0) return 'No lessons or assessments published for this subject yet.'
      if (total <= 0) return `${lessons} lesson${lessons === 1 ? '' : 's'} available. Assessments will appear once they are published.`
      if (lessons <= 0) return `${total} assessment${total === 1 ? '' : 's'} currently available in this subject.`
      return `${lessons} lesson${lessons === 1 ? '' : 's'} and ${total} assessment${total === 1 ? '' : 's'} are currently available.`
    }

    const getCourseAssessmentCountCopy = (course = {}) => {
      const total = toMetricNumber(course?.assessmentCount, 0)
      if (total <= 0) return 'No assessments yet'
      return `${total} assessment${total === 1 ? '' : 's'} assigned`
    }

    const hasCourseAverageScore = (course = {}) => {
      const completed = toMetricNumber(course?.completedAssessments, 0)
      return completed > 0
    }

    const getCourseAverageScoreCopy = (course = {}) => {
      return `${formatMetricNumber(course?.averageScore)}% average score`
    }

    const getLearningSnapshotExamLabel = (snapshot) => {
      const examResult = snapshot?.latestExamResult || {}
      if (!examResult?.title) return 'No completed exam yet'
      return `${formatMetricNumber(examResult?.percentage)}%`
    }

    const getLearningSnapshotExamMeta = (snapshot) => {
      const examResult = snapshot?.latestExamResult || {}
      if (!examResult?.title) return 'Exam scores will appear here after the student finishes a grading assessment.'

      const details = [
        examResult?.title || '',
        examResult?.gradingPeriod ? `${examResult.gradingPeriod} grading` : '',
        examResult?.totalPoints > 0 ? `${examResult.score}/${examResult.totalPoints}` : '',
        examResult?.submittedAt ? getLastActive(examResult.submittedAt) : '',
      ].filter(Boolean)

      return details.join(' • ')
    }

    const getLearningSnapshotRecommendationLabel = (snapshot) => {
      const recommendation = snapshot?.aiRecommendation || {}
      if (recommendation?.strand) {
        return recommendation.confidence
          ? `${recommendation.strand} (${recommendation.confidence})`
          : recommendation.strand
      }

      if (recommendation?.status === 'in_progress') return 'Recommendation in progress'
      return 'Not generated yet'
    }

    const getLearningSnapshotRecommendationMeta = (snapshot) => {
      const recommendation = snapshot?.aiRecommendation || {}
      if (recommendation?.explanation) return recommendation.explanation
      if (recommendation?.status === 'in_progress') {
        return 'Complete the remaining grading assessments to unlock the AI recommendation.'
      }
      return 'The AI recommendation will appear once enough exam data is available.'
    }

    const escapeCsvCell = (value) => {
      const normalized = value === null || value === undefined ? '' : String(value)
      return `"${normalized.replace(/"/g, '""')}"`
    }

    const downloadCsv = (rows, fileName) => {
      const lines = rows.map((row) => row.map(escapeCsvCell).join(','))
      const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }

    const buildProgressReportFileName = (user) => {
      const safeName = String(user?.name || 'student')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'student'
      return `${safeName}-learning-progress-report.csv`
    }
    
    // Search with debounce
    const debouncedSearch = debounce(() => {
      currentPage.value = 1
    }, 300)

    // Clear filters
    const clearFilters = () => {
      filters.role = 'all'
      filters.status = 'all'
      filters.dateRange = 'all'
      sortBy.value = 'newest'
      searchQuery.value = ''
      currentPage.value = 1
    }
    
    // Selection
    const toggleSelectAll = () => {
      if (selectAll.value) {
        selectedUsers.value = paginatedUsers.value.map(u => u.id)
      } else {
        selectedUsers.value = []
      }
    }
    
    watch(selectedUsers, (newVal) => {
      selectAll.value = newVal.length === paginatedUsers.value.length && paginatedUsers.value.length > 0
    })

    watch(searchQuery, () => {
      debouncedSearch()
    })

    watch(
      () => [filters.role, filters.status, filters.dateRange, sortBy.value],
      () => {
        currentPage.value = 1
      }
    )

    watch(totalPages, (pages) => {
      if (pages === 0) {
        currentPage.value = 1
        return
      }

      if (currentPage.value > pages) {
        currentPage.value = pages
      }
    })

    watch(
      () => newUser.role,
      (role) => {
        if (!['headteacher', 'teacher'].includes(role)) newUser.department = ''
        if (role !== 'teacher') newUser.subject = ''
        if (role !== 'student') {
          newUser.gradeLevel = 'Grade 10'
          newUser.strand = ''
        }
      }
    )

    watch(
      () => (
        modals.viewProfile
        || modals.editUser
        || modals.addUser
        || modals.viewProgress
        || modals.viewCourses
        || modals.sendMessage
        || modals.confirmation
        || modals.userActions
      ),
      (isAnyModalOpen) => {
        if (typeof document === 'undefined') return
        if (isAnyModalOpen) {
          previousBodyOverflow.value = document.body.style.overflow || ''
          document.body.style.overflow = 'hidden'
        } else {
          document.body.style.overflow = previousBodyOverflow.value
        }
      }
    )

    watch(
      () => route.path,
      () => {
        closeSidebar()
        closeAccountMenu()
        showToast.value = false
        toastMessage.value = ''
      }
    )

    watch(
      () => isSidebarOpen.value,
      () => {
        syncMobileMenuBodyState()
      }
    )
    
    // Pagination
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
      }
    }
    
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
      }
    }
    
    const goToPage = (page) => {
      currentPage.value = page
    }
    
    // Export users
    const exportUsers = () => {
      // Implement CSV export
      console.log('Exporting users...')
    }
    
    // Modal controls
    const openAddUserModal = () => {
      addUserEmailError.value = false
      modals.addUser = true
      isCreateInviteLoading.value = false
      addUserTab.value = 'basic'
      Object.assign(newUser, {
        fullName: '',
        username: '',
        email: '',
        role: 'secretary',
        status: 'active',
        department: '',
        subject: '',
        gradeLevel: 'Grade 10',
        strand: '',
        contactNumber: '',
      })
    }
    
    const closeAddUserModal = () => {
      if (isCreateInviteLoading.value) return
      modals.addUser = false
    }
    
    const openUserActions = (user) => {
      selectedUser.value = user
      modals.userActions = true
    }
    
    const closeUserActionsModal = () => {
      modals.userActions = false
    }
    
    const openEditUserModal = (user) => {
      cleanupEditAvatarPreview()
      editUserData.value = {
        id: user.id,
        fullName: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        department: ['headteacher', 'teacher'].includes(user.role) ? (user.department || '') : '',
        subject: user.subject || '',
        gradeLevel: user.gradeLevel || 'Grade 10',
        strand: user.strand || '',
        contactNumber: normalizePhilippinePhone(user.contactNumber),
        avatar: resolveUserAvatarUrl(user),
        avatarPreview: ''
      }
      modals.editUser = true
      modals.userActions = false
    }
    
    const closeEditUserModal = () => {
      cleanupEditAvatarPreview()
      modals.editUser = false
    }

    const onEditRoleChange = () => {
      if (!['headteacher', 'teacher'].includes(editUserData.value.role)) {
        editUserData.value.department = ''
      }
      if (editUserData.value.role !== 'teacher') editUserData.value.subject = ''
      if (editUserData.value.role !== 'student') {
        editUserData.value.gradeLevel = 'Grade 10'
        editUserData.value.strand = ''
      }
    }
    
    // Tab navigation
    const isValidAddUserEmail = (email) => /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i.test(String(email || '').trim())

    watch(() => newUser.email, (email) => {
      if (isValidAddUserEmail(email)) addUserEmailError.value = false
    })

    const validateAddUserEmail = () => {
      addUserEmailError.value = !isValidAddUserEmail(newUser.email)
      if (!addUserEmailError.value) return true
      addUserTab.value = 'basic'
      window.alert('Please enter a valid Gmail address (e.g., user@gmail.com).')
      return false
    }

    const goToAddUserTab = (tab) => {
      if (!validateAddUserEmail()) return
      addUserTab.value = tab
    }

    const nextTab = () => {
      if (addUserTab.value === 'basic') goToAddUserTab('role')
      else if (addUserTab.value === 'role') goToAddUserTab('additional')
    }
    
    const prevTab = () => {
      if (addUserTab.value === 'role') addUserTab.value = 'basic'
      else if (addUserTab.value === 'additional') addUserTab.value = 'role'
    }
    
    // Create user
    const createUser = async () => {
      if (isCreateInviteLoading.value) return
      if (!validateAddUserEmail()) return

      if (!newUser.fullName || !newUser.email || !String(newUser.username || '').trim()) {
        showToastMessage('Name, email, and username are required', 'error')
        return
      }

      if (!allowedManagedRoles.value.includes(newUser.role)) {
        showToastMessage('You do not have permission to create that role', 'error')
        return
      }
      const contactNumber = normalizePhilippinePhone(newUser.contactNumber)
      if (!isValidPhilippinePhone(contactNumber)) {
        showToastMessage('Please enter a valid Philippine contact number beginning with +63', 'error')
        return
      }
      if (['headteacher', 'teacher'].includes(newUser.role) && !String(newUser.department || '').trim()) {
        showToastMessage('Department is required for Head Teacher and Teacher accounts', 'error')
        return
      }
      if (newUser.role === 'headteacher' && hasDepartmentHeadTeacher({ department: newUser.department })) {
        showToastMessage('This department already has a Head Teacher assigned', 'error')
        return
      }

      isCreateInviteLoading.value = true

      try {
        const createPayload = {
          name: newUser.fullName.trim(),
          email: newUser.email.trim(),
          username: String(newUser.username || '').trim(),
          role: newUser.role,
          status: 'active',
          department: ['headteacher', 'teacher'].includes(newUser.role) ? newUser.department : '',
          subject: newUser.role === 'teacher' ? newUser.subject : '',
          gradeLevel: newUser.role === 'student' ? newUser.gradeLevel : '',
          strand: newUser.role === 'student' ? newUser.strand : '',
          contactNumber,
        }
        const response = await axios.post(`${managementApiPath.value}/users`, createPayload, getAuthConfig())
        const generatedPassword = String(response.data?.invite?.generatedPassword || '').trim()
        const emailSent = response.data?.invite?.emailSent !== false
        const baseMessage = emailSent
          ? 'User created and credentials emailed successfully.'
          : 'User created, but the onboarding email failed to send.'
        showToastMessage(
          generatedPassword ? `${baseMessage} Temporary password: ${generatedPassword}` : baseMessage,
          emailSent ? 'success' : 'warning'
        )
        modals.addUser = false
        isCreateInviteLoading.value = false
        await fetchUsers()
      } catch (error) {
        isCreateInviteLoading.value = false
        const message =
          error.response?.data?.message ||
          (error.request ? 'Unable to reach server. Check backend connection.' : 'Failed to create user')
        showToastMessage(message, 'error')
      }
    }
    
    // Edit user
    const editUser = () => {
      openEditUserModal(selectedUser.value)
    }
    
    const saveUserEdit = async () => {
      const allowedRoles = allowedManagedRoles.value
      const allowedStatuses = ['pending', 'active', 'inactive', 'suspended']
      const emailRegex = /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:\+[a-z0-9]+(?:[._-][a-z0-9]+)*)?@gmail\.com$/i

      const fullName = String(editUserData.value.fullName || '').trim()
      const email = String(editUserData.value.email || '').trim()
      const role = String(editUserData.value.role || '').trim()
      const status = String(editUserData.value.status || '').trim()
      const department = String(editUserData.value.department || '').trim()
      const subject = String(editUserData.value.subject || '').trim()
      const gradeLevel = String(editUserData.value.gradeLevel || 'Grade 10').trim()
      const strand = String(editUserData.value.strand || '').trim()
      const contactNumber = normalizePhilippinePhone(editUserData.value.contactNumber)

      if (!editUserData.value.id) {
        showToastMessage('Invalid user record. Please reopen Edit User.', 'error')
        return
      }
      if (!fullName) {
        showToastMessage('Full Name is required', 'error')
        return
      }
      if (!email || !emailRegex.test(email)) {
        showToastMessage('Please enter a valid Gmail address (e.g., user@gmail.com)', 'error')
        return
      }
      if (!allowedRoles.includes(role)) {
        showToastMessage('You do not have permission to assign that role', 'error')
        return
      }
      if (!allowedStatuses.includes(status)) {
        showToastMessage('Status must be pending, active, inactive, or suspended', 'error')
        return
      }
      if (['headteacher', 'teacher'].includes(role) && !department) {
        showToastMessage('Department is required for Head Teacher and Teacher accounts', 'error')
        return
      }
      if (role === 'headteacher' && hasDepartmentHeadTeacher({
        department,
        excludeUserId: editUserData.value.id,
      })) {
        showToastMessage('This department already has a Head Teacher assigned', 'error')
        return
      }
      if (!isValidPhilippinePhone(contactNumber)) {
        showToastMessage('Please enter a valid Philippine contact number beginning with +63', 'error')
        return
      }

      const payload = new FormData()
      payload.append('name', fullName)
      payload.append('email', email)
      payload.append('role', role)
      payload.append('status', status)
      payload.append('department', ['headteacher', 'teacher'].includes(role) ? department : '')
      payload.append('subject', role === 'teacher' ? subject : '')
      payload.append('gradeLevel', role === 'student' ? gradeLevel : '')
      payload.append('strand', role === 'student' ? strand : '')
      payload.append('contactNumber', contactNumber)
      if (selectedEditAvatarFile.value) {
        payload.append('profileImage', selectedEditAvatarFile.value)
      }

      try {
        isSavingEdit.value = true
        const response = await axios.put(
          `${managementApiPath.value}/users/${editUserData.value.id}`,
          payload,
          getAuthConfig()
        )
        const updatedUser = response.data?.user || null
        if (updatedUser && String(authStore.user?.id || authStore.user?._id || '') === String(editUserData.value.id)) {
          authStore.setUser({
            ...updatedUser,
            id: updatedUser.id || updatedUser._id || authStore.user?.id,
            profileImage: updatedUser.profileImage || authStore.user?.profileImage || '',
          })
        }
        
        showToastMessage('User updated successfully')
        closeEditUserModal()
        await fetchUsers()
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to update user', 'error')
      } finally {
        isSavingEdit.value = false
      }
    }

    const fetchSelectedUserDetails = async (userId) => {
      const response = await axios.get(`${managementApiPath.value}/users/${userId}`, getAuthConfig())
      const user = response.data?.user
      if (!user) {
        throw new Error('User details are missing in response')
      }

      const mappedUser = mapUserRecord(
        user,
        0,
        selectedUser.value && String(selectedUser.value.id || '') === String(userId) ? selectedUser.value : null
      )
      selectedUser.value = mappedUser
      return mappedUser
    }
    
    // View actions
    const viewUserProfile = async () => {
      const userId = selectedUser.value?.id
      if (!userId) {
        showToastMessage('Unable to load user profile', 'error')
        return
      }

      modals.viewProfile = true
      isProfileLoading.value = true

      try {
        await fetchSelectedUserDetails(userId)
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to load user profile', 'error')
        modals.viewProfile = false
      } finally {
        isProfileLoading.value = false
      }

      modals.userActions = false
    }
    
    const closeViewProfileModal = () => {
      modals.viewProfile = false
    }
    
    const viewUserProgress = async () => {
      const userId = selectedUser.value?.id
      if (!userId) {
        showToastMessage('Unable to load student progress', 'error')
        return
      }

      modals.viewProgress = true
      modals.userActions = false
      isProgressLoading.value = true

      try {
        await fetchSelectedUserDetails(userId)
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to load student progress', 'error')
        modals.viewProgress = false
      } finally {
        isProgressLoading.value = false
      }
    }
    
    const closeViewProgressModal = () => {
      modals.viewProgress = false
    }
    
    const viewUserCourses = async () => {
      const userId = selectedUser.value?.id
      if (!userId) {
        showToastMessage('Unable to load enrolled subjects', 'error')
        return
      }

      modals.viewCourses = true
      modals.userActions = false
      isProgressLoading.value = true

      try {
        await fetchSelectedUserDetails(userId)
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to load enrolled subjects', 'error')
        modals.viewCourses = false
      } finally {
        isProgressLoading.value = false
      }
    }
    
    const closeViewCoursesModal = () => {
      modals.viewCourses = false
    }
    
    const sendMessage = () => {
      if (!selectedUser.value?.id) {
        showToastMessage('Unable to open message composer', 'error')
        return
      }

      messageData.userId = selectedUser.value.id
      modals.sendMessage = true
      closeUserActionsModal()
    }
    
    const closeSendMessageModal = () => {
      modals.sendMessage = false
      messageData.subject = ''
      messageData.content = ''
      messageData.urgent = false
    }
    
    const sendMessageToUser = async () => {
      const userId = String(messageData.userId || '').trim()
      if (!userId) {
        showToastMessage('Unable to send message: recipient not found', 'error')
        return
      }

      if (!String(messageData.subject || '').trim()) {
        showToastMessage('Please enter a message subject', 'error')
        return
      }

      if (!String(messageData.content || '').trim()) {
        showToastMessage('Please enter a message', 'error')
        return
      }

      try {
        isSendingMessage.value = true
        await axios.post(
          `${managementApiPath.value}/users/${userId}/messages`,
          {
            subject: String(messageData.subject || '').trim(),
            content: String(messageData.content || '').trim(),
            urgent: messageData.urgent === true
          },
          getAuthConfig()
        )

        showToastMessage(messageData.urgent ? 'Urgent message sent successfully' : 'Message sent successfully')
        closeSendMessageModal()
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to send message', 'error')
      } finally {
        isSendingMessage.value = false
      }
    }

    const sendInviteToUser = async () => {
      const userId = selectedUser.value?.id
      if (!userId) {
        showToastMessage('Unable to resend onboarding email: user not found', 'error')
        return
      }

      try {
        const response = await axios.post(
          `${managementApiPath.value}/users/${userId}/send-invite`,
          { expiresInHours: 48 },
          getAuthConfig()
        )
        const inviteResult = response.data?.invite || null
        if (inviteResult?.emailSent === false) {
          const generatedPassword = String(inviteResult.generatedPassword || '').trim()
          showToastMessage(
            generatedPassword
              ? `${inviteResult.emailError || 'Onboarding email failed'} Temporary password: ${generatedPassword}`
              : (inviteResult.emailError || 'Onboarding email failed'),
            'warning'
          )
        } else {
          const generatedPassword = String(inviteResult?.generatedPassword || '').trim()
          showToastMessage(
            generatedPassword
              ? `Onboarding email sent successfully. Temporary password: ${generatedPassword}`
              : 'Onboarding email sent successfully'
          )
        }
        closeUserActionsModal()
        await fetchUsers()
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to resend onboarding email', 'error')
      }
    }
    
    // Toggle user status
    const toggleUserStatus = () => {
      const userId = selectedUser.value?.id
      if (!userId) {
        showToastMessage('Unable to update user status: user not found', 'error')
        return
      }
      const newStatus = selectedUser.value.status === 'active' ? 'inactive' : 'active'
      
      confirmTitle.value = `Confirm ${newStatus === 'active' ? 'Activation' : 'Deactivation'}`
      confirmMessage.value = `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${selectedUser.value.name}?`
      confirmRequiresPassword.value = false
      confirmPassword.value = ''
      
      confirmAction.value = async () => {
        try {
          const payload = new FormData()
          payload.append('status', newStatus)
          await axios.put(
            `${managementApiPath.value}/users/${userId}`,
            payload,
            getAuthConfig()
          )
          
          showToastMessage(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
          closeConfirmationModal()
          closeUserActionsModal()
          await fetchUsers()
        } catch (error) {
          showToastMessage('Failed to update user status', 'error')
        }
      }
      
      modals.confirmation = true
    }
    
    // Delete user
    const confirmDeleteUser = () => {
      const userId = selectedUser.value?.id
      if (!userId) {
        showToastMessage('Unable to delete user: user not found', 'error')
        return
      }

      confirmTitle.value = 'Confirm Deletion'
      confirmMessage.value = `Are you sure you want to delete ${selectedUser.value.name}? This action cannot be undone.`
      confirmRequiresPassword.value = true
      confirmPassword.value = ''
      
      confirmAction.value = async () => {
        try {
          const passwordValue = String(confirmPassword.value || '').trim()
          if (!passwordValue) {
            showToastMessage('Admin password is required to delete a user', 'error')
            return
          }

          await axios.delete(`${managementApiPath.value}/users/${userId}`, {
            ...getAuthConfig(),
            data: {
              currentPassword: passwordValue,
            },
          })
          
          showToastMessage('User deleted successfully')
          closeConfirmationModal()
          closeUserActionsModal()
          await fetchUsers()
        } catch (error) {
          showToastMessage(error.response?.data?.message || 'Failed to delete user', 'error')
        }
      }
      
      modals.confirmation = true
    }
    
    // Edit from profile
    const editFromProfile = () => {
      closeViewProfileModal()
      openEditUserModal(selectedUser.value)
    }
    
    // Export progress
    const exportProgress = async () => {
      const userId = selectedUser.value?.id
      if (!userId) {
        showToastMessage('Please select a student first', 'error')
        return
      }

      try {
        isProgressLoading.value = true
        if (!selectedUser.value?.courses?.length || !selectedUser.value?.progressSummary) {
          await fetchSelectedUserDetails(userId)
        }

        const user = selectedUser.value
        const summary = normalizeProgressSummary(user)
        const courseRows = Array.isArray(user?.courses) ? user.courses : []
        const recentSubmissions = Array.isArray(user?.recentSubmissions) ? user.recentSubmissions : []

        const rows = [
          ['Learning Progress Report'],
          ['Student Name', user?.name || ''],
          ['Email', user?.email || ''],
          ['Track', user?.enrolledTrack || ''],
          ['Generated At', new Date().toLocaleString('en-US')],
          [''],
          ['Summary'],
          ['Completion Rate', `${formatMetricNumber(summary.completionRate)}%`],
          ['Average Score', `${formatMetricNumber(summary.averageScore)}%`],
          ['Completed Assessments', String(summary.completedAssessments || 0)],
          ['Enrolled Subjects', String(summary.enrolledSubjects || 0)],
          ['Completed Subjects', String(summary.completedSubjects || 0)],
          ['Pending Subjects', String(summary.pendingSubjects || 0)],
          ['Total Lessons', String(summary.totalLessons || 0)],
          ['Total Assessments', String(summary.totalAssessments || 0)],
          ['Last Submission', summary.lastSubmittedAt ? new Date(summary.lastSubmittedAt).toLocaleString('en-US') : ''],
          [''],
          ['Subject Progress'],
          ['Subject', 'Code', 'Track', 'Teacher', 'Lessons', 'Completed Assessments', 'Total Assessments', 'Average Score', 'Progress', 'Last Submission'],
          ...(courseRows.length
            ? courseRows.map((course) => [
              course?.title || '',
              course?.code || '',
              course?.track || '',
              course?.teacherName || '',
              String(course?.lessonCount || 0),
              String(course?.completedAssessments || 0),
              String(course?.assessmentCount || 0),
              `${formatMetricNumber(course?.averageScore)}%`,
              `${formatMetricNumber(course?.progress)}%`,
              course?.lastSubmittedAt ? new Date(course.lastSubmittedAt).toLocaleString('en-US') : '',
            ])
            : [['No enrolled subjects', '', '', '', '', '', '', '', '', '']]),
          [''],
          ['Recent Submissions'],
          ['Assessment', 'Subject', 'Type', 'Score', 'Percentage', 'Status', 'Submitted At'],
          ...(recentSubmissions.length
            ? recentSubmissions.map((submission) => [
              submission?.title || '',
              submission?.subjectTitle || '',
              submission?.examType || '',
              `${submission?.score || 0}/${submission?.totalPoints || 0}`,
              `${formatMetricNumber(submission?.percentage)}%`,
              submission?.status || '',
              submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString('en-US') : '',
            ])
            : [['No completed assessments', '', '', '', '', '', '']]),
        ]

        downloadCsv(rows, buildProgressReportFileName(user))
        showToastMessage('Learning progress report exported successfully')
      } catch (error) {
        showToastMessage(error.response?.data?.message || 'Failed to export learning progress report', 'error')
      } finally {
        isProgressLoading.value = false
      }
    }
    
    // Confirmation modal
    const closeConfirmationModal = () => {
      modals.confirmation = false
      confirmAction.value = null
      confirmPassword.value = ''
      confirmRequiresPassword.value = false
    }
    
    const executeConfirmAction = async () => {
      if (confirmAction.value) {
        await confirmAction.value()
      }
    }
    
    // Toast
    const showToastMessage = (message, type = 'success') => {
      toastType.value = type
      toastMessage.value = message
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
    
    // Data fetching
    const fetchUsers = async ({ silent = false } = {}) => {
      if (isFetchingUsers.value) return
      isFetchingUsers.value = true
      try {
        const response = await axios.get(`${managementApiPath.value}/users`, getAuthConfig())
        const payload = uniqueBy(
          response.data?.users || [],
          (user, index) => user._id || user.id || `${String(user.email || '').toLowerCase()}-${index}`
        )
        users.value = payload.map((user, index) => mapUserRecord(user, index))
        
        stats.totalStudents = users.value.filter(u => u.role === 'student').length
        stats.totalTeachers = users.value.filter(u => u.role === 'teacher').length
        stats.activeUsers = users.value.filter(u => u.status === 'active').length
      } catch (error) {
        console.error('Failed to fetch users:', error)
        if (!silent) {
          showToastMessage(
            error.response?.data?.message ||
              (error.request ? 'Unable to load users. Backend may be offline.' : 'Failed to fetch users'),
            'error'
          )
        }
      } finally {
        isFetchingUsers.value = false
      }
    }

    const refreshUserPresenceIfVisible = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState !== 'visible') return
      fetchUsers({ silent: true })
    }
    
    // Lifecycle
    onMounted(() => {
      document.body.classList.add('admin-dashboard')
      window.addEventListener('resize', syncMobileMenuBodyState)
      syncMobileMenuBodyState()
      document.addEventListener('click', handleDocumentClick)
      document.addEventListener('keydown', handleDocumentKeydown)
      document.addEventListener('visibilitychange', refreshUserPresenceIfVisible)
      window.addEventListener('focus', refreshUserPresenceIfVisible)
      fetchUsers()
      userPresenceRefreshTimerId = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return
        fetchUsers({ silent: true })
      }, USER_PRESENCE_REFRESH_MS)
    })

    onBeforeUnmount(() => {
      document.body.classList.remove('admin-dashboard')
      document.body.classList.remove('admin-mobile-menu-open')
      window.removeEventListener('resize', syncMobileMenuBodyState)
      document.removeEventListener('click', handleDocumentClick)
      document.removeEventListener('keydown', handleDocumentKeydown)
      document.removeEventListener('visibilitychange', refreshUserPresenceIfVisible)
      window.removeEventListener('focus', refreshUserPresenceIfVisible)
      if (userPresenceRefreshTimerId !== null) {
        window.clearInterval(userPresenceRefreshTimerId)
        userPresenceRefreshTimerId = null
      }
      document.body.style.overflow = previousBodyOverflow.value || ''
      cleanupEditAvatarPreview()
    })
    
    return {
      users,
      searchQuery,
      filters,
      sortBy,
      currentPage,
      pageSize,
      selectedUsers,
      selectAll,
      modals,
      addUserTab,
      newUser,
      selectedUser,
      editUserData,
      messageData,
      isSendingMessage,
      confirmTitle,
      confirmMessage,
      confirmPassword,
      confirmRequiresPassword,
      isCreateInviteLoading,
      isSavingEdit,
      isProfileLoading,
      isProgressLoading,
      showToast,
      toastMessage,
      toastType,
      toastTitle,
      toastIconClass,
      archivedPdfExportRequests,
      isExportRequestsLoading,
      activeExportRequestActionId,
      exportRequestsSummary,
      stats,
      filteredUsers,
      paginatedUsers,
      totalPages,
      visiblePages,
      isSidebarOpen,
      accountMenuRef,
      isAccountMenuOpen,
      allowedManagedRoles,
      roleLabel,
      canManageUser,
      studentGradeLevels,
      studentStrands,
      isActive,
      toggleSidebar,
      closeSidebar,
      toggleAccountMenu,
      goToProfile,
      goToSettings,
      handleLogout,
      formatNumber,
      formatMetricNumber,
      clampProgress,
      selectedProgressCompletion,
      selectedProgressState,
      getInitials,
      capitalize,
      getRoleIcon,
      formatDate,
      formatDateTime,
      formatArchivedPdfRequestStatus,
      getArchivedPdfRequestStatusClass,
      formatArchivedPdfFilterSummary,
      getLastActive,
      getCourseCompletionCopy,
      getCourseSummaryText,
      getCourseAssessmentCountCopy,
      hasCourseAverageScore,
      getCourseAverageScoreCopy,
      getLearningSnapshotExamLabel,
      getLearningSnapshotExamMeta,
      getLearningSnapshotRecommendationLabel,
      getLearningSnapshotRecommendationMeta,
      debouncedSearch,
      clearFilters,
      toggleSelectAll,
      prevPage,
      nextPage,
      goToPage,
      exportUsers,
      fetchArchivedPdfExportRequests,
      openAddUserModal,
      closeAddUserModal,
      openUserActions,
      closeUserActionsModal,
      openEditUserModal,
      closeEditUserModal,
      handleEditAvatarChange,
      onEditRoleChange,
      addUserEmailError,
      goToAddUserTab,
      nextTab,
      prevTab,
      createUser,
      departmentOptions,
      editUser,
      saveUserEdit,
      viewUserProfile,
      closeViewProfileModal,
      viewUserProgress,
      closeViewProgressModal,
      viewUserCourses,
      closeViewCoursesModal,
      sendMessage,
      closeSendMessageModal,
      sendMessageToUser,
      sendInviteToUser,
      toggleUserStatus,
      confirmDeleteUser,
      editFromProfile,
      exportProgress,
      reviewArchivedPdfExportRequest,
      closeConfirmationModal,
      executeConfirmAction,
      showToastMessage
    }
  }
}
</script>

<style>
@reference "../../styles/tailwind.css";

@import '../../styles/roles/admin.tailwind.css';

/* Local override: make user list table typography smaller for denser readability. */
.users-table thead th {
  @apply tw:[font-size:0.72rem];
}

.users-table tbody td {
  @apply tw:[font-size:0.8rem];
}

.users-table .user-name {
  @apply tw:[font-size:0.82rem];
}

.users-table .user-email,
.users-table .user-id,
.users-table .time-text,
.users-table .date-text,
.users-table .na-text,
.users-table .progress-text {
  @apply tw:[font-size:0.72rem];
}

.users-table .progress-container {
  @apply tw:grid;
  @apply tw:[grid-template-columns:1fr];
  @apply tw:justify-items-center;
  @apply tw:[row-gap:0.25rem];
}

.users-table .progress-bar {
  @apply tw:w-full;
}

.users-table .progress-text {
  @apply tw:[min-width:0];
  @apply tw:text-center;
}

.users-table .course-count .label {
  @apply tw:block;
  @apply tw:text-center;
}

body.admin-dashboard .btn.btn-primary.export-report-btn {
  @apply tw:[background:#4f8a35]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#4f8a35]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_16px_32px_rgba(79,_138,_53,_0.22)]!;
}

body.admin-dashboard .btn.btn-primary.export-report-btn i {
  @apply tw:[color:#ffffff]!;
}

body.admin-dashboard .btn.btn-primary.export-report-btn:hover,
body.admin-dashboard .btn.btn-primary.export-report-btn:focus {
  @apply tw:[background:#416f2c]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#3d6929]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_18px_36px_rgba(79,_138,_53,_0.28)]!;
}

body.admin-dashboard .btn.btn-primary.export-report-btn:hover i,
body.admin-dashboard .btn.btn-primary.export-report-btn:focus i {
  @apply tw:[color:#ffffff]!;
}

body.admin-dashboard .btn.btn-primary.export-report-btn:active {
  @apply tw:[background:#365d25]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#315522]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_10px_24px_rgba(79,_138,_53,_0.22)]!;
}

body.admin-dashboard .btn.btn-primary.export-report-btn:active i {
  @apply tw:[color:#ffffff]!;
}

.export-approval-section {
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.export-approval-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:flex-wrap;
}

.export-approval-header h3 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.1rem];
}

.export-approval-header p,
.export-approval-caption {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.88rem];
  @apply tw:[line-height:1.5];
}

.export-approval-summary {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-wrap;
}

.export-approval-count {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.55rem_0.9rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
}

.export-approval-count.has-pending {
  @apply tw:[border-color:#fdba74];
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#9a3412];
}

.export-approval-refresh {
  @apply tw:[min-height:40px];
}

.export-approval-empty {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
  @apply tw:[padding:1rem_1.1rem];
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[border-radius:16px];
  @apply tw:[color:#64748b];
  @apply tw:[background:#f8fafc];
  @apply tw:[font-size:0.9rem];
}

.export-request-list {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(280px,_1fr))];
  @apply tw:[gap:1rem];
}

.export-request-card {
  @apply tw:grid;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:#ffffff];
}

.export-request-card.is-pending {
  @apply tw:[border-color:#fdba74];
  @apply tw:[box-shadow:0_14px_28px_rgba(249,_115,_22,_0.08)];
}

.export-request-card.is-approved {
  @apply tw:[border-color:#86efac];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f0fdf4_100%)];
}

.export-request-card.is-rejected,
.export-request-card.is-expired {
  @apply tw:[border-color:#fca5a5];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#fef2f2_100%)];
}

.export-request-card.is-fulfilled {
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
}

.export-request-top {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

.export-request-top h4 {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.98rem];
}

.export-request-top p {
  @apply tw:[margin:0.25rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.82rem];
}

.export-request-status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[padding:0.45rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_#cbd5e1];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

.export-request-status.is-pending {
  @apply tw:[border-color:#fdba74];
  @apply tw:[background:#fff7ed];
  @apply tw:[color:#9a3412];
}

.export-request-status.is-approved {
  @apply tw:[border-color:#86efac];
  @apply tw:[background:#ecfdf5];
  @apply tw:[color:#166534];
}

.export-request-status.is-rejected,
.export-request-status.is-expired {
  @apply tw:[border-color:#fca5a5];
  @apply tw:[background:#fef2f2];
  @apply tw:[color:#b91c1c];
}

.export-request-status.is-fulfilled {
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#475569];
}

.export-request-meta {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.export-request-meta span,
.export-request-review,
.export-request-expiry,
.export-request-note {
  @apply tw:[margin:0];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.5];
}

.export-request-meta span {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.55rem];
}

.export-request-meta i {
  @apply tw:[margin-top:0.12rem];
  @apply tw:[color:#64748b];
}

.export-request-expiry {
  @apply tw:[color:#166534];
  @apply tw:[font-weight:600];
}

.export-request-note {
  @apply tw:[color:#334155];
}

.export-request-actions {
  @apply tw:flex;
  @apply tw:[gap:0.65rem];
  @apply tw:flex-wrap;
}

.export-request-action {
  @apply tw:[min-height:42px];
}

.export-request-action--reject {
  @apply tw:[border-color:#fca5a5]!;
  @apply tw:[color:#b91c1c]!;
}

#progressContent .progress-details {
  @apply tw:grid;
  @apply tw:[gap:1.35rem];
}

#progressContent .progress-subtitle {
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:rgba(226,_232,_240,_0.92)];
  @apply tw:[font-size:0.95rem];
  @apply tw:[line-height:1.6];
}

#progressContent .progress-hero {
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_auto];
  @apply tw:[gap:1rem_1.25rem];
  @apply tw:[padding:1.35rem];
  @apply tw:[border-radius:24px];
  @apply tw:[color:#ffffff];
}

#progressContent .progress-hero.is-idle {
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(253,_186,_116,_0.3),_transparent_28%),______linear-gradient(135deg,_#7c2d12_0%,_#ea580c_100%)];
  @apply tw:[box-shadow:0_22px_44px_rgba(124,_45,_18,_0.22)];
}

#progressContent .progress-hero.is-active {
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(110,_231,_183,_0.24),_transparent_28%),______linear-gradient(135deg,_#14532d_0%,_#16a34a_100%)];
  @apply tw:[box-shadow:0_22px_44px_rgba(20,_83,_45,_0.22)];
}

#progressContent .progress-hero::after {
  @apply tw:[content:''];
  @apply tw:absolute;
  @apply tw:[inset:auto_-10%_-30%_auto];
  @apply tw:[width:220px];
  @apply tw:[height:220px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:radial-gradient(circle,_rgba(255,_255,_255,_0.12),_transparent_68%)];
  @apply tw:pointer-events-none;
}

#progressContent .progress-hero-copy {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:grid;
  @apply tw:[gap:0.9rem];
  @apply tw:[min-width:0];
}

#progressContent .progress-hero-copy h4 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.55rem];
  @apply tw:[line-height:1.12];
  @apply tw:[color:#ffffff];
}

#progressContent .progress-hero-chips,
#progressContent .progress-hero-meta {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.65rem_0.85rem];
}

#progressContent .progress-track-chip,
#progressContent .progress-status-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.42rem_0.8rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.01em];
}

#progressContent .progress-track-chip {
  @apply tw:[background:rgba(255,_255,_255,_0.12)];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.12)];
  @apply tw:[color:#fff7ed];
}

#progressContent .progress-status-chip.tone-strong {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
}

#progressContent .progress-status-chip.tone-steady {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
}

#progressContent .progress-status-chip.tone-starting {
  @apply tw:[background:#dcfce7];
  @apply tw:[color:#166534];
}

#progressContent .progress-status-chip.tone-idle {
  @apply tw:[background:#ffedd5];
  @apply tw:[color:#9a3412];
}

#progressContent .progress-hero-meta {
  @apply tw:[color:rgba(255,_255,_255,_0.88)];
  @apply tw:[font-size:0.86rem];
}

#progressContent .progress-hero-meta span,
#progressContent .course-progress-meta span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.42rem];
}

#progressContent .progress-hero-meta .fa-book-open,
#progressContent .progress-hero-meta .fa-clock-rotate-left {
  @apply tw:[color:#ffffff]!;
}

#progressContent .progress-hero-metric {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
  @apply tw:[align-content:start];
  @apply tw:justify-items-end;
}

#progressContent .progress-hero-metric small {
  @apply tw:[color:rgba(255,_255,_255,_0.82)];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

#progressContent .progress-pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-height:72px];
  @apply tw:[min-width:120px];
  @apply tw:[padding:0.85rem_1.15rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.14)];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.16)];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:1.5rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
}

#progressContent .progress-hero-track {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:grid;
  @apply tw:[gap:0.6rem];
}

#progressContent .progress-hero-bar {
  @apply tw:w-full;
  @apply tw:[height:12px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.16)];
  @apply tw:overflow-hidden;
}

#progressContent .progress-hero-bar span {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:linear-gradient(90deg,_#86efac_0%,_#22c55e_55%,_#dcfce7_100%)];
}

#progressContent .progress-hero-track-meta {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-wrap;
  @apply tw:[color:rgba(255,_255,_255,_0.84)];
  @apply tw:[font-size:0.84rem];
}

#progressContent .progress-stats {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(220px,_1fr))];
  @apply tw:[gap:0.95rem];
}

#progressContent .stat-card {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.9rem];
  @apply tw:items-center;
  @apply tw:[padding:1rem_1.05rem];
  @apply tw:[border:1px_solid_#dbe4ec];
  @apply tw:[border-radius:20px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_12px_28px_rgba(15,_23,_42,_0.06)];
}

#progressContent .stat-icon {
  @apply tw:[width:48px];
  @apply tw:[height:48px];
  @apply tw:[border-radius:16px];
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[font-size:1rem];
}

#progressContent .stat-icon.tone-blue {
  @apply tw:[background:#dbeafe];
  @apply tw:[color:#1d4ed8];
}

#progressContent .stat-icon.tone-amber {
  @apply tw:[background:#fef3c7];
  @apply tw:[color:#b45309];
}

#progressContent .stat-icon.tone-teal {
  @apply tw:[background:#ccfbf1];
  @apply tw:[color:#0f766e];
}

#progressContent .stat-icon.tone-slate {
  @apply tw:[background:#e2e8f0];
  @apply tw:[color:#334155];
}

#progressContent .stat-copy {
  @apply tw:grid;
  @apply tw:[gap:0.15rem];
}

#progressContent .stat-label {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

#progressContent .stat-value {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.55rem];
  @apply tw:[font-weight:800];
}

#progressContent .stat-note {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.45];
}

#progressContent .progress-breakdown {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(280px,_1fr))];
  @apply tw:[gap:1rem];
}

#progressContent .progress-panel {
  @apply tw:[padding:1.1rem_1.15rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:20px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_14px_32px_rgba(15,_23,_42,_0.07)];
}

#progressContent .progress-panel-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1rem];
}

#progressContent .progress-panel-kicker {
  @apply tw:block;
  @apply tw:[margin-bottom:0.22rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

#progressContent .panel-emphasis {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.38rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eff6ff];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
  @apply tw:whitespace-nowrap;
}

#progressContent .progress-panel h5 {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.04rem];
  @apply tw:[font-weight:800];
  @apply tw:[color:#111827];
}

#progressContent .progress-summary-list {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

#progressContent .progress-summary-row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[padding:0.78rem_0.82rem];
  @apply tw:[border-radius:14px];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[background:rgba(255,_255,_255,_0.82)];
  @apply tw:[font-size:0.93rem];
  @apply tw:[color:#475569];
}

#progressContent .progress-summary-row--stacked {
  @apply tw:items-start;
}

#progressContent .progress-summary-row strong {
  @apply tw:[color:#111827];
}

#progressContent .progress-summary-value {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.24rem];
  @apply tw:justify-items-end;
  @apply tw:text-right;
}

#progressContent .progress-summary-value strong {
  @apply tw:[line-height:1.35];
}

#progressContent .progress-summary-value small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.45];
}

#progressContent .recent-submissions-list {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

#progressContent .recent-submission-item {
  @apply tw:grid;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:16px];
  @apply tw:[background:rgba(255,_255,_255,_0.88)];
}

#progressContent .recent-submission-copy {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

#progressContent .recent-submission-top {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
}

#progressContent .recent-submission-score {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[min-height:32px];
  @apply tw:[padding:0.3rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#ecfeff];
  @apply tw:[color:#155e75];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
}

#progressContent .recent-submission-copy span,
#progressContent .recent-submission-copy small,
#progressContent .recent-submission-metrics span,
#coursesContent .course-meta,
#coursesContent .course-progress-meta span,
#progressContent .course-meta,
#progressContent .course-progress-meta span {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.88rem];
}

#progressContent .recent-submission-metrics {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-wrap;
}

#progressContent .progress-empty-state {
  @apply tw:[min-height:180px];
  @apply tw:grid;
  @apply tw:place-items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[padding:1.4rem];
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)];
  @apply tw:text-center;
  @apply tw:[color:#64748b];
}

#progressContent .progress-empty-state i {
  @apply tw:[font-size:1.3rem];
  @apply tw:[color:#1d4ed8];
}

#progressContent .progress-empty-state strong {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1rem];
}

#progressContent .progress-courses-list,
#coursesContent .courses-list {
  @apply tw:grid;
  @apply tw:[gap:0.95rem];
}

#progressContent .course-item,
#coursesContent .course-item {
  @apply tw:relative;
  @apply tw:overflow-hidden;
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.2fr)_minmax(240px,_0.95fr)];
  @apply tw:items-center;
  @apply tw:[gap:1rem_1.2rem];
  @apply tw:[padding:1.05rem_1.15rem];
  @apply tw:[border:1px_solid_#dbe4ec];
  @apply tw:[border-radius:22px];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(59,_130,_246,_0.08),_transparent_28%),______linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)];
  @apply tw:[box-shadow:0_18px_34px_rgba(15,_23,_42,_0.06)];
  @apply tw:[transition:transform_0.18s_ease,_box-shadow_0.18s_ease,_border-color_0.18s_ease];
}

#progressContent .course-item:hover,
#coursesContent .course-item:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[border-color:#cbd5e1];
  @apply tw:[box-shadow:0_22px_40px_rgba(15,_23,_42,_0.09)];
}

#progressContent .course-info,
#coursesContent .course-info {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
  @apply tw:[min-width:0];
}

#progressContent .course-info h4,
#coursesContent .course-info h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:1.03rem];
  @apply tw:[font-weight:800];
  @apply tw:[line-height:1.35];
}

#progressContent .course-title-row,
#coursesContent .course-title-row {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.9rem];
}

#progressContent .course-title-copy,
#coursesContent .course-title-copy {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.32rem];
}

#progressContent .course-summary-text,
#coursesContent .course-summary-text {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.5];
}

#progressContent .course-meta,
#coursesContent .course-meta {
  @apply tw:[margin:0];
}

#progressContent .course-meta:first-of-type,
#coursesContent .course-meta:first-of-type {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:w-fit;
  @apply tw:max-w-full;
  @apply tw:[padding:0.38rem_0.78rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eff6ff];
  @apply tw:[border:1px_solid_#dbeafe];
  @apply tw:[color:#1d4ed8];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:800];
}

#progressContent .course-meta:last-of-type,
#coursesContent .course-meta:last-of-type {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:w-fit;
  @apply tw:max-w-full;
  @apply tw:[padding:0.55rem_0.82rem];
  @apply tw:[border-radius:14px];
  @apply tw:[background:rgba(248,_250,_252,_0.92)];
  @apply tw:[border:1px_dashed_#cbd5e1];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
  @apply tw:[line-height:1.45];
}

#progressContent .course-progress,
#coursesContent .course-progress {
  @apply tw:grid;
  @apply tw:[gap:0.7rem];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[background:linear-gradient(180deg,_rgba(248,_250,_252,_0.96)_0%,_#ffffff_100%)];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.7)];
}

#progressContent .course-progress-head,
#coursesContent .course-progress-head {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.85rem];
}

#progressContent .course-progress-copy,
#coursesContent .course-progress-copy {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
}

#progressContent .course-progress-label,
#coursesContent .course-progress-label {
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:800];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.04em];
}

#progressContent .course-progress-copy small,
#coursesContent .course-progress-copy small {
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.8rem];
  @apply tw:[line-height:1.45];
}

#progressContent .course-progress-value,
#coursesContent .course-progress-value {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-width:62px];
  @apply tw:[min-height:38px];
  @apply tw:[padding:0.35rem_0.7rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:linear-gradient(135deg,_#0f172a,_#1e293b)];
  @apply tw:[border:1px_solid_#0f172a];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:0.95rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
  @apply tw:[box-shadow:0_12px_24px_rgba(15,_23,_42,_0.16)];
}

#progressContent .progress-bar,
#progressContent .course-progress-bar,
#coursesContent .progress-bar,
#coursesContent .course-progress-bar {
  @apply tw:w-full;
  @apply tw:[height:12px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#dbe4ec];
  @apply tw:overflow-hidden;
  @apply tw:[box-shadow:inset_0_1px_2px_rgba(15,_23,_42,_0.08)];
}

#progressContent .progress-fill,
#coursesContent .progress-fill {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:linear-gradient(90deg,_#0f766e_0%,_#14b8a6_55%,_#22d3ee_100%)];
  @apply tw:[box-shadow:0_4px_12px_rgba(20,_184,_166,_0.28)];
}

#progressContent .course-progress-meta,
#coursesContent .course-progress-meta {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-wrap;
  @apply tw:[margin-top:0];
}

#progressContent .course-progress-meta span,
#coursesContent .course-progress-meta span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[min-height:34px];
  @apply tw:[padding:0.35rem_0.72rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#ffffff];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:800];
}

/* Professional green theme for the learning progress dashboard. */
#progressContent .progress-details {
  --progress-green: #4f8a35;
  --progress-green-dark: #3d6d29;
  --progress-green-soft: #edf5e9;
  --progress-border: #dce5d8;
  --progress-ink: #172014;
  --progress-muted: #667064;
  @apply tw:[gap:1.25rem];
}

#progressContent .progress-hero,
#progressContent .progress-hero.is-idle,
#progressContent .progress-hero.is-active {
  @apply tw:[gap:1.15rem_1.5rem];
  @apply tw:[padding:1.5rem];
  @apply tw:[border:1px_solid_var(--progress-green-dark)];
  @apply tw:[border-radius:8px];
  @apply tw:[background:var(--progress-green)];
  @apply tw:[box-shadow:0_12px_28px_rgba(50,_84,_38,_0.18)];
}

#progressContent .progress-hero::after {
  @apply tw:[content:none];
}

#progressContent .progress-track-chip,
#progressContent .progress-status-chip {
  @apply tw:[min-height:30px];
  @apply tw:[padding:0.35rem_0.65rem];
  @apply tw:[border-radius:6px];
}

#progressContent .progress-track-chip {
  @apply tw:[background:rgba(255,_255,_255,_0.13)];
  @apply tw:[border-color:rgba(255,_255,_255,_0.28)];
  @apply tw:[color:#ffffff];
}

#progressContent .progress-status-chip.tone-strong,
#progressContent .progress-status-chip.tone-steady,
#progressContent .progress-status-chip.tone-starting,
#progressContent .progress-status-chip.tone-idle {
  @apply tw:[background:#ffffff];
  @apply tw:[color:var(--progress-green-dark)];
}

#progressContent .progress-pill {
  @apply tw:[min-width:108px];
  @apply tw:[min-height:66px];
  @apply tw:[padding:0.75rem_1rem];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.3)];
  @apply tw:[border-radius:8px];
  @apply tw:[background:rgba(255,_255,_255,_0.12)];
}

#progressContent .progress-hero-bar {
  @apply tw:[height:8px];
  @apply tw:[border-radius:4px];
}

#progressContent .progress-hero-bar span {
  @apply tw:[background:#ffffff];
}

#progressContent .progress-stats {
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
}

#progressContent .stat-card {
  @apply tw:[padding:1rem];
  @apply tw:[border-color:var(--progress-border)];
  @apply tw:[border-radius:8px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_5px_14px_rgba(31,_51,_25,_0.06)];
}

#progressContent .stat-icon {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:6px];
}

#progressContent .stat-icon.tone-blue,
#progressContent .stat-icon.tone-amber,
#progressContent .stat-icon.tone-teal,
#progressContent .stat-icon.tone-slate {
  @apply tw:[background:var(--progress-green-soft)];
  @apply tw:[color:var(--progress-green)];
}

#progressContent .stat-label,
#progressContent .stat-note,
#progressContent .progress-summary-value small {
  @apply tw:[color:var(--progress-muted)];
}

#progressContent .stat-value,
#progressContent .progress-panel h5,
#progressContent .progress-summary-row strong,
#progressContent .progress-empty-state strong {
  @apply tw:[color:var(--progress-ink)];
}

#progressContent .progress-breakdown {
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
}

#progressContent .progress-panel {
  @apply tw:[padding:1.15rem];
  @apply tw:[border-color:var(--progress-border)];
  @apply tw:[border-radius:8px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_5px_14px_rgba(31,_51,_25,_0.06)];
}

#progressContent .progress-panel-kicker {
  @apply tw:[color:var(--progress-green)];
}

#progressContent .panel-emphasis {
  @apply tw:[min-height:30px];
  @apply tw:[padding:0.35rem_0.62rem];
  @apply tw:[border:1px_solid_#d5e6ce];
  @apply tw:[border-radius:6px];
  @apply tw:[background:var(--progress-green-soft)];
  @apply tw:[color:var(--progress-green-dark)];
}

#progressContent .progress-summary-row,
#progressContent .recent-submission-item {
  @apply tw:[border-color:#e3e9e0];
  @apply tw:[border-radius:6px];
  @apply tw:[background:#fafcf9];
}

#progressContent .progress-summary-row {
  @apply tw:[color:var(--progress-muted)];
}

#progressContent .recent-submission-score {
  @apply tw:[border-radius:6px];
  @apply tw:[background:var(--progress-green-soft)];
  @apply tw:[color:var(--progress-green-dark)];
}

#progressContent .progress-empty-state {
  @apply tw:[border-color:#bfcdb9];
  @apply tw:[border-radius:6px];
  @apply tw:[background:#fafcf9];
}

#progressContent .progress-empty-state i {
  @apply tw:[color:var(--progress-green)];
}

#progressContent .course-item {
  @apply tw:[grid-template-columns:minmax(0,_1.35fr)_minmax(280px,_0.9fr)];
  @apply tw:[padding:1.15rem];
  @apply tw:[border-color:var(--progress-border)];
  @apply tw:[border-left:4px_solid_var(--progress-green)];
  @apply tw:[border-radius:8px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_5px_14px_rgba(31,_51,_25,_0.06)];
}

#progressContent .course-item:hover {
  @apply tw:transform-none;
  @apply tw:[border-color:#c5d5bf];
  @apply tw:[border-left-color:var(--progress-green-dark)];
  @apply tw:[box-shadow:0_8px_20px_rgba(31,_51,_25,_0.09)];
}

#progressContent .course-info h4 {
  @apply tw:[color:var(--progress-ink)];
}

#progressContent .course-meta:first-of-type {
  @apply tw:[padding:0.32rem_0.6rem];
  @apply tw:[border-color:#d5e6ce];
  @apply tw:[border-radius:5px];
  @apply tw:[background:var(--progress-green-soft)];
  @apply tw:[color:var(--progress-green-dark)];
}

#progressContent .course-meta:last-of-type {
  @apply tw:[padding:0];
  @apply tw:[border:0];
  @apply tw:rounded-none;
  @apply tw:[background:transparent];
  @apply tw:[color:var(--progress-muted)];
}

#progressContent .course-progress {
  @apply tw:[border-color:var(--progress-border)];
  @apply tw:[border-radius:6px];
  @apply tw:[background:#f8faf7];
  @apply tw:[box-shadow:none];
}

#progressContent .course-progress-value {
  @apply tw:[min-width:58px];
  @apply tw:[min-height:36px];
  @apply tw:[border-color:var(--progress-green)];
  @apply tw:[border-radius:6px];
  @apply tw:[background:var(--progress-green)];
  @apply tw:[box-shadow:none];
}

#progressContent .progress-bar,
#progressContent .course-progress-bar {
  @apply tw:[height:8px];
  @apply tw:[border-radius:4px];
  @apply tw:[background:#dbe5d7];
  @apply tw:[box-shadow:none];
}

#progressContent .progress-fill {
  @apply tw:[background:var(--progress-green)];
  @apply tw:[box-shadow:none];
}

#progressContent .course-progress-meta span {
  @apply tw:[min-height:30px];
  @apply tw:[padding:0.3rem_0.55rem];
  @apply tw:[border-color:var(--progress-border)];
  @apply tw:[border-radius:5px];
  @apply tw:[color:#44503f];
}

#coursesContent {
  --course-green: #4f8a35;
  --course-green-dark: #3d6d29;
  --course-green-soft: #edf5e9;
  --course-border: #dce5d8;
  --course-ink: #172014;
  --course-muted: #667064;
}

#coursesContent .courses-list {
  @apply tw:[gap:0.8rem];
}

#coursesContent .course-item {
  @apply tw:[grid-template-columns:minmax(0,_1.35fr)_minmax(280px,_0.9fr)];
  @apply tw:[padding:1.15rem];
  @apply tw:[border-color:var(--course-border)];
  @apply tw:[border-left:4px_solid_var(--course-green)];
  @apply tw:[border-radius:8px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_5px_14px_rgba(31,_51,_25,_0.06)];
}

#coursesContent .course-item:hover {
  @apply tw:transform-none;
  @apply tw:[border-color:#c5d5bf];
  @apply tw:[border-left-color:var(--course-green-dark)];
  @apply tw:[box-shadow:0_8px_20px_rgba(31,_51,_25,_0.09)];
}

#coursesContent .course-info h4 {
  @apply tw:[color:var(--course-ink)];
}

#coursesContent .course-summary-text,
#coursesContent .course-progress-copy small {
  @apply tw:[color:var(--course-muted)];
}

#coursesContent .course-meta:first-of-type {
  @apply tw:[padding:0.32rem_0.6rem];
  @apply tw:[border-color:#d5e6ce];
  @apply tw:[border-radius:5px];
  @apply tw:[background:var(--course-green-soft)];
  @apply tw:[color:var(--course-green-dark)];
}

#coursesContent .course-meta:last-of-type {
  @apply tw:[padding:0];
  @apply tw:[border:0];
  @apply tw:rounded-none;
  @apply tw:[background:transparent];
  @apply tw:[color:var(--course-muted)];
}

#coursesContent .course-progress {
  @apply tw:[border-color:var(--course-border)];
  @apply tw:[border-radius:6px];
  @apply tw:[background:#f8faf7];
  @apply tw:[box-shadow:none];
}

#coursesContent .course-progress-label {
  @apply tw:[color:var(--course-ink)];
}

#coursesContent .course-progress-value {
  @apply tw:[min-width:58px];
  @apply tw:[min-height:36px];
  @apply tw:[border-color:var(--course-green)];
  @apply tw:[border-radius:6px];
  @apply tw:[background:var(--course-green)];
  @apply tw:[box-shadow:none];
}

#coursesContent .progress-bar,
#coursesContent .course-progress-bar {
  @apply tw:[height:8px];
  @apply tw:[border-radius:4px];
  @apply tw:[background:#dbe5d7];
  @apply tw:[box-shadow:none];
}

#coursesContent .progress-fill {
  @apply tw:[background:var(--course-green)];
  @apply tw:[box-shadow:none];
}

#coursesContent .course-progress-meta span {
  @apply tw:[min-height:30px];
  @apply tw:[padding:0.3rem_0.55rem];
  @apply tw:[border-color:var(--course-border)];
  @apply tw:[border-radius:5px];
  @apply tw:[color:#44503f];
}

@media (max-width: 1100px) {
  #progressContent .progress-stats {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }
}

@media (max-width: 768px) {
  #progressContent .progress-hero {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:[padding:1.15rem];
  }

  #progressContent .progress-hero-metric {
    @apply tw:justify-items-start;
  }

  #progressContent .progress-hero-track-meta,
  #progressContent .recent-submission-metrics,
  #progressContent .course-progress-meta,
  #coursesContent .course-progress-meta {
    @apply tw:justify-start;
  }

  #progressContent .progress-summary-row {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  #progressContent .progress-summary-value {
    @apply tw:justify-items-start;
    @apply tw:text-left;
  }

  #progressContent .progress-panel-head {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  #progressContent .course-item,
  #coursesContent .course-item {
    @apply tw:[grid-template-columns:1fr];
  }

  #progressContent .progress-stats,
  #progressContent .progress-breakdown {
    @apply tw:[grid-template-columns:1fr];
  }

  #progressContent .course-title-row,
  #coursesContent .course-title-row,
  #progressContent .course-progress-head,
  #coursesContent .course-progress-head {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

}

.users-table-section {
  @apply tw:overflow-hidden;
}

.users-table-section .table-responsive {
  @apply tw:overflow-x-auto!;
  @apply tw:overflow-y-visible!;
  @apply tw:max-h-none!;
  @apply tw:[border-radius:18px];
  @apply tw:[box-shadow:none];
  @apply tw:[scrollbar-width:thin];
  @apply tw:[scrollbar-color:rgba(15,_23,_42,_0.35)_transparent];
}

.users-table-section .table-responsive::-webkit-scrollbar {
  @apply tw:[height:6px];
  @apply tw:[width:6px];
}

.users-table-section .table-responsive::-webkit-scrollbar-track {
  @apply tw:[background:transparent];
}

.users-table-section .table-responsive::-webkit-scrollbar-thumb {
  @apply tw:[background:rgba(15,_23,_42,_0.35)];
  @apply tw:[border-radius:999px];
}

.users-table-section .table-responsive::-webkit-scrollbar-thumb:hover {
  @apply tw:[background:rgba(15,_23,_42,_0.5)];
}

.users-table-section .users-table {
  @apply tw:w-full!;
  @apply tw:[min-width:1120px];
  @apply tw:table-auto!;
  @apply tw:border-separate!;
  @apply tw:[border-spacing:0]!;
}

.users-table-section .users-table thead {
  @apply tw:table-header-group!;
}

.users-table-section .users-table tbody {
  @apply tw:table-row-group!;
  @apply tw:max-h-none!;
  @apply tw:overflow-visible!;
}

.users-table-section .users-table tbody tr {
  @apply tw:table-row!;
  @apply tw:w-auto!;
  @apply tw:table-auto!;
}

.users-table-section .users-table thead th {
  @apply tw:sticky!;
  @apply tw:[top:0]!;
  @apply tw:[z-index:2]!;
}

.users-table-section .table-actions {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-end;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-nowrap;
  @apply tw:ml-auto;
}

.users-table-section .user-list-add-btn {
  @apply tw:[min-height:42px];
  @apply tw:[padding:0.7rem_1.1rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.55rem];
  @apply tw:flex-none;
  @apply tw:[border:1px_solid_#3f7f2a];
  @apply tw:[border-radius:12px];
  @apply tw:[background:linear-gradient(135deg,_#5c9f3d_0%,_#3f7f2a_100%)];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:0.9rem];
  @apply tw:[font-weight:600];
  @apply tw:[line-height:1];
  @apply tw:whitespace-nowrap;
  @apply tw:[box-shadow:0_6px_14px_rgba(63,_127,_42,_0.2)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_background_0.2s_ease];
}

.users-table-section .user-list-add-btn:hover {
  @apply tw:[background:linear-gradient(135deg,_#559638_0%,_#356d24_100%)];
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[box-shadow:0_8px_18px_rgba(63,_127,_42,_0.26)];
}

.users-table-section .user-list-add-btn:focus-visible {
  @apply tw:[outline:3px_solid_rgba(105,_170,_71,_0.3)];
  @apply tw:[outline-offset:2px];
}

.users-table-section .user-list-add-btn:active,
.users-table-section .user-list-add-btn.active {
  @apply tw:[transform:translateY(0)];
  @apply tw:[box-shadow:0_3px_8px_rgba(63,_127,_42,_0.22)];
}

.users-table-section .user-list-add-btn i,
.users-table-section .user-list-add-btn.active i {
  @apply tw:[color:#ffffff];
  @apply tw:[fill:#ffffff];
}

.users-table-section .table-search {
  @apply tw:relative;
  @apply tw:[min-width:280px];
  @apply tw:[flex:0_1_420px];
  @apply tw:[max-width:420px];
}

.users-table-section .table-search i {
  @apply tw:absolute;
  @apply tw:[top:50%];
  @apply tw:[left:0.95rem];
  @apply tw:[transform:translateY(-50%)];
  @apply tw:[color:#6b7280];
  @apply tw:pointer-events-none;
}

.users-table-section .table-search-input {
  @apply tw:w-full;
  @apply tw:[min-height:42px];
  @apply tw:[padding:0.7rem_1rem_0.7rem_2.6rem];
  @apply tw:[border:1px_solid_#d1d5db];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#111827];
  @apply tw:[font-size:0.92rem];
  @apply tw:[font-weight:300];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.users-table-section .table-search-input:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#374151];
  @apply tw:[box-shadow:0_0_0_3px_rgba(55,_65,_81,_0.12)];
}

.users-table-section .table-search-input::placeholder {
  @apply tw:[color:#9ca3af];
}

.confirm-password-group {
  @apply tw:[margin-top:1rem];
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
  @apply tw:text-left;
}

.confirm-password-label {
  @apply tw:[font-size:0.88rem];
  @apply tw:[font-weight:600];
  @apply tw:[color:#374151];
}

.confirm-password-input {
  @apply tw:w-full;
  @apply tw:[min-height:44px];
  @apply tw:[padding:0.75rem_0.95rem];
  @apply tw:[border:1px_solid_#d1d5db];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#111827];
  @apply tw:[font-size:0.95rem];
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease];
}

.confirm-password-input:focus {
  @apply tw:[outline:none];
  @apply tw:[border-color:#111827];
  @apply tw:[box-shadow:0_0_0_3px_rgba(17,_24,_39,_0.08)];
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

@media (max-width: 1024px) {
  .users-table-section .table-header {
    @apply tw:[gap:0.9rem];
  }

  .users-table-section .table-actions {
    @apply tw:w-full;
    @apply tw:justify-stretch;
    @apply tw:flex-wrap;
    @apply tw:[margin-left:0];
  }

  .users-table-section .table-search {
    @apply tw:[flex-basis:100%];
    @apply tw:max-w-none;
  }

  .users-table-section .user-list-add-btn {
    @apply tw:ml-auto;
  }
}

@media (max-width: 560px) {
  .users-table-section .user-list-add-btn {
    @apply tw:w-full;
    @apply tw:[margin-left:0];
  }
}

@media (max-width: 768px) {
  body.admin-dashboard .pagination-controls {
    @apply tw:grid!;
    @apply tw:[grid-template-columns:minmax(88px,_1fr)_auto_minmax(88px,_1fr)]!;
    @apply tw:items-center!;
    @apply tw:[gap:0.5rem]!;
    @apply tw:w-full!;
    @apply tw:[flex-direction:unset]!;
  }

  body.admin-dashboard .pagination-btn.prev {
    @apply tw:[justify-self:start]!;
  }

  body.admin-dashboard .pagination-numbers {
    @apply tw:justify-self-center!;
    @apply tw:flex!;
    @apply tw:items-center!;
    @apply tw:justify-center!;
    @apply tw:flex-nowrap!;
    @apply tw:[min-width:0]!;
  }

  body.admin-dashboard .pagination-btn.next {
    @apply tw:[justify-self:end]!;
  }

  body.admin-dashboard .pagination-btn.prev,
  body.admin-dashboard .pagination-btn.next {
    @apply tw:w-auto!;
    @apply tw:[min-width:88px];
    @apply tw:flex-none!;
    @apply tw:whitespace-nowrap;
  }

  body.admin-dashboard .pagination-number {
    @apply tw:flex-none;
  }
}

/* User directory: grouped information on desktop, scan-friendly cards on smaller screens. */
body.admin-dashboard .users-table-section {
  @apply tw:[background:#ffffff]!;
}

body.admin-dashboard .users-table-section .table-header {
  @apply tw:items-center!;
  @apply tw:[margin-bottom:18px]!;
  @apply tw:[padding-bottom:18px]!;
}

.users-table-section .table-info {
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.users-table-section .table-eyebrow {
  @apply tw:[color:#4f8a35];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.12em];
  @apply tw:[line-height:1];
  @apply tw:uppercase;
}

.users-table-section .table-info h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#172033];
  @apply tw:[font-size:clamp(1.15rem,_2vw,_1.4rem)];
  @apply tw:[line-height:1.25];
}

.users-table-section .table-count {
  @apply tw:[margin:0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.82rem];
  @apply tw:[line-height:1.45];
}

.users-table-section .table-search {
  @apply tw:[flex:1_1_320px];
  @apply tw:[width:min(100%,_420px)];
}

.users-table-section .table-search-input {
  @apply tw:[min-height:44px];
  @apply tw:[padding-right:2.75rem];
  @apply tw:[border-color:#dbe3ec];
  @apply tw:[background:#f8fafc];
  @apply tw:[font-weight:500];
}

.users-table-section .table-search-input:focus {
  @apply tw:[border-color:#69aa47];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_0_0_3px_rgba(105,_170,_71,_0.14)];
}

.users-table-section .table-search-clear {
  @apply tw:absolute;
  @apply tw:[top:50%];
  @apply tw:[right:0.45rem];
  @apply tw:inline-grid;
  @apply tw:[width:32px];
  @apply tw:[height:32px];
  @apply tw:[padding:0];
  @apply tw:place-items-center;
  @apply tw:[transform:translateY(-50%)];
  @apply tw:[border:0];
  @apply tw:[border-radius:9px];
  @apply tw:[background:transparent];
  @apply tw:[color:#64748b];
  @apply tw:cursor-pointer;
}

.users-table-section .table-search-clear i {
  @apply tw:static;
  @apply tw:transform-none;
  @apply tw:text-current;
}

.users-table-section .table-search-clear:hover,
.users-table-section .table-search-clear:focus-visible {
  @apply tw:[outline:none];
  @apply tw:[background:#e8eef4];
  @apply tw:[color:#172033];
}

body.admin-dashboard .users-table-section .table-responsive {
  @apply tw:overflow-x-auto!;
  @apply tw:[border:1px_solid_#e4eaf0]!;
  @apply tw:[border-radius:16px]!;
  @apply tw:[background:#ffffff];
}

body.admin-dashboard .users-table-section .users-table {
  @apply tw:[min-width:860px]!;
  @apply tw:[border-spacing:0]!;
}

body.admin-dashboard .users-table-section .users-table thead th {
  @apply tw:static!;
  @apply tw:[padding:0.8rem_1rem]!;
  @apply tw:[border-bottom:1px_solid_#dfe7ee]!;
  @apply tw:[background:#f6f8fa]!;
  @apply tw:[color:#667085]!;
  @apply tw:[font-size:0.7rem]!;
  @apply tw:[font-weight:800]!;
  @apply tw:[letter-spacing:0.07em]!;
  @apply tw:uppercase!;
}

body.admin-dashboard .users-table-section .users-table tbody td {
  @apply tw:[padding:1rem]!;
  @apply tw:[border-bottom:1px_solid_#edf1f5]!;
  @apply tw:[color:#334155];
  @apply tw:align-middle!;
}

body.admin-dashboard .users-table-section .users-table tbody tr:last-child td {
  @apply tw:[border-bottom:0]!;
}

body.admin-dashboard .users-table-section .users-table tbody tr.user-row {
  @apply tw:[transition:background-color_0.18s_ease,_box-shadow_0.18s_ease];
}

body.admin-dashboard .users-table-section .users-table tbody tr.user-row:hover {
  @apply tw:[background:#f9fbf8]!;
}

.users-table-section .select-col {
  @apply tw:[width:48px];
  @apply tw:text-center;
}

.users-table-section .user-col {
  @apply tw:[width:30%];
}

.users-table-section .access-col {
  @apply tw:[width:18%];
}

.users-table-section .learning-col {
  @apply tw:[width:22%];
}

.users-table-section .activity-col {
  @apply tw:[width:22%];
}

.users-table-section .actions-col {
  @apply tw:[width:58px];
  @apply tw:text-right;
}

.users-table-section .user-info {
  @apply tw:[min-width:0];
}

.users-table-section .user-details {
  @apply tw:[min-width:0];
}

.users-table-section .user-name {
  @apply tw:[color:#172033];
  @apply tw:[font-size:0.9rem];
  @apply tw:[font-weight:750];
}

.users-table-section .user-email {
  @apply tw:overflow-hidden;
  @apply tw:[margin-top:0.2rem];
  @apply tw:[color:#718096];
  @apply tw:[font-size:0.76rem];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.users-table-section .access-stack {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.4rem];
  @apply tw:flex-col;
}

.users-table-section .role-badge,
.users-table-section .status-badge {
  @apply tw:w-fit;
}

.users-table-section .learning-summary {
  @apply tw:grid;
  @apply tw:[width:min(100%,_190px)];
  @apply tw:[gap:0.5rem];
}

.users-table-section .learning-summary-head {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.75rem];
}

.users-table-section .learning-summary-head strong {
  @apply tw:[color:#315f23];
  @apply tw:[font-size:0.78rem];
}

.users-table-section .learning-summary .progress-bar {
  @apply tw:w-full;
  @apply tw:[height:7px];
  @apply tw:overflow-hidden;
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e7ede4];
}

.users-table-section .learning-summary .progress-fill {
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:linear-gradient(90deg,_#69aa47,_#4f8a35)];
}

.users-table-section .learning-stat {
  @apply tw:flex;
  @apply tw:items-baseline;
  @apply tw:[gap:0.4rem];
}

.users-table-section .learning-stat strong {
  @apply tw:[color:#315f23];
  @apply tw:[font-size:1.05rem];
}

.users-table-section .learning-stat span,
.users-table-section .learning-empty {
  @apply tw:[color:#718096];
  @apply tw:[font-size:0.76rem];
}

.users-table-section .learning-empty {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[min-height:30px];
  @apply tw:[padding:0.35rem_0.65rem];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#f1f5f9];
}

.users-table-section .activity-col {
  @apply tw:[line-height:1.25];
}

.users-table-section .activity-detail {
  @apply tw:grid;
  @apply tw:[gap:0.15rem];
}

.users-table-section .activity-joined {
  @apply tw:[margin-top:0.55rem];
}

.users-table-section .activity-label {
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.66rem];
  @apply tw:[font-weight:700];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.users-table-section .activity-detail .time-text,
.users-table-section .activity-detail .date-text {
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.76rem];
}

.users-table-section .activity-detail .time-text {
  @apply tw:[font-weight:700];
}

body.admin-dashboard .users-table-section .action-btn {
  @apply tw:[width:38px]!;
  @apply tw:[height:38px]!;
  @apply tw:[border:1px_solid_#dbe3ec]!;
  @apply tw:[border-radius:11px]!;
  @apply tw:[background:#ffffff]!;
  @apply tw:[color:#475569]!;
}

body.admin-dashboard .users-table-section .action-btn:hover,
body.admin-dashboard .users-table-section .action-btn:focus-visible {
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[outline:none];
  @apply tw:[background:#f1f8ed]!;
  @apply tw:[color:#315f23]!;
}

body.admin-dashboard .users-table-section .pagination {
  @apply tw:[margin-top:16px]!;
  @apply tw:[padding-top:16px]!;
}

.users-table-section .pagination-info strong {
  @apply tw:[color:#172033];
}

@media (max-width: 900px) {
  body.admin-dashboard .users-table-section .table-header {
    @apply tw:items-stretch!;
  }

  .users-table-section .table-actions {
    @apply tw:w-full;
    @apply tw:[margin-left:0];
  }

  .users-table-section .table-search {
    @apply tw:max-w-none;
  }

  body.admin-dashboard .users-table-section .table-responsive {
    @apply tw:overflow-visible!;
    @apply tw:[border:0]!;
    @apply tw:rounded-none!;
    @apply tw:[background:transparent];
  }

  body.admin-dashboard .users-table-section .users-table {
    @apply tw:[min-width:0]!;
  }

  body.admin-dashboard .users-table-section .users-table thead {
    @apply tw:hidden!;
  }

  body.admin-dashboard .users-table-section .users-table tbody {
    @apply tw:grid!;
    @apply tw:[gap:0.8rem];
  }

  body.admin-dashboard .users-table-section .users-table tbody tr.user-row {
    @apply tw:grid!;
    @apply tw:[grid-template-columns:38px_minmax(0,_1fr)_44px];
    @apply tw:w-full!;
    @apply tw:overflow-hidden;
    @apply tw:[border:1px_solid_#e1e8ee];
    @apply tw:[border-radius:15px];
    @apply tw:[background:#ffffff];
    @apply tw:[box-shadow:0_6px_18px_rgba(15,_23,_42,_0.045)];
  }

  body.admin-dashboard .users-table-section .users-table tbody tr.user-row:hover {
    @apply tw:[border-color:#c9ddbd];
    @apply tw:[box-shadow:0_8px_22px_rgba(49,_95,_35,_0.08)];
  }

  body.admin-dashboard .users-table-section .users-table tbody tr.user-row td {
    @apply tw:block!;
    @apply tw:w-auto!;
    @apply tw:[padding:0.9rem]!;
    @apply tw:[border-bottom:0]!;
  }

  .users-table-section .user-row .select-col {
    @apply tw:[grid-column:1];
    @apply tw:[grid-row:1];
    @apply tw:self-center;
    @apply tw:[padding-right:0]!;
  }

  .users-table-section .user-row .user-col {
    @apply tw:[grid-column:2];
    @apply tw:[grid-row:1];
    @apply tw:[padding-left:0.35rem]!;
  }

  .users-table-section .user-row .actions-col {
    @apply tw:[grid-column:3];
    @apply tw:[grid-row:1];
    @apply tw:self-center;
    @apply tw:[padding-left:0]!;
  }

  .users-table-section .user-row .access-col,
  .users-table-section .user-row .learning-col,
  .users-table-section .user-row .activity-col {
    @apply tw:[grid-column:1_/_-1];
    @apply tw:grid!;
    @apply tw:[grid-template-columns:90px_minmax(0,_1fr)];
    @apply tw:items-center;
    @apply tw:[gap:0.75rem];
    @apply tw:[border-top:1px_solid_#edf1f5]!;
  }

  .users-table-section .user-row .access-col::before,
  .users-table-section .user-row .learning-col::before,
  .users-table-section .user-row .activity-col::before {
    @apply tw:[content:attr(data-label)];
    @apply tw:[align-self:start];
    @apply tw:[padding-top:0.2rem];
    @apply tw:[color:#94a3b8];
    @apply tw:[font-size:0.66rem];
    @apply tw:[font-weight:800];
    @apply tw:[letter-spacing:0.06em];
    @apply tw:uppercase;
  }

  .users-table-section .access-stack {
    @apply tw:items-center;
    @apply tw:flex-row;
    @apply tw:flex-wrap;
  }

  .users-table-section .learning-summary {
    @apply tw:w-full;
    @apply tw:[max-width:260px];
  }

  .users-table-section .activity-col {
    @apply tw:[grid-template-columns:90px_repeat(2,_minmax(0,_1fr))]!;
  }

  .users-table-section .activity-joined {
    @apply tw:[margin-top:0];
  }

  body.admin-dashboard .users-table-section .no-data-row,
  body.admin-dashboard .users-table-section .no-data-row td {
    @apply tw:block!;
    @apply tw:w-full!;
  }
}

@media (max-width: 560px) {
  .users-table-section .table-actions {
    @apply tw:grid;
    @apply tw:[grid-template-columns:1fr];
  }

  .users-table-section .table-search,
  .users-table-section .user-list-add-btn {
    @apply tw:w-full;
  }

  .users-table-section .user-row .activity-col {
    @apply tw:[grid-template-columns:90px_minmax(0,_1fr)]!;
  }

  .users-table-section .activity-col::before {
    @apply tw:[grid-row:1_/_span_2];
  }
}

.modal.profile-modal .modal-content.large {
  @apply tw:[width:min(1040px,_94vw)];
  @apply tw:[max-width:1040px];
  @apply tw:[height:min(92vh,_880px)];
  @apply tw:[max-height:min(92vh,_880px)];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:overflow-hidden;
}

.modal.profile-modal .modal-body {
  @apply tw:flex-auto;
  @apply tw:[min-height:0];
  @apply tw:overflow-hidden;
  @apply tw:[padding:1rem_1.25rem];
}

.modal.profile-modal #profileContent {
  @apply tw:h-full;
  @apply tw:[min-height:0];
  @apply tw:overflow-y-auto;
  @apply tw:overflow-x-hidden;
  @apply tw:[padding-right:0.2rem];
}

.modal.profile-modal .modal-actions {
  @apply tw:flex-none;
  @apply tw:mt-auto;
  @apply tw:sticky;
  @apply tw:[bottom:0];
  @apply tw:[z-index:6];
  @apply tw:[background:#ffffff];
  @apply tw:[border-top:1px_solid_#e5e7eb];
  @apply tw:[padding:0.75rem_1.1rem_0.95rem];
}

.modal.progress-modal .modal-content.large {
  @apply tw:[width:min(1100px,_95vw)];
  @apply tw:[max-width:1100px];
  @apply tw:[height:min(92vh,_920px)];
  @apply tw:[max-height:min(92vh,_920px)];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:overflow-hidden;
}

.modal.progress-modal .modal-body {
  @apply tw:flex-auto;
  @apply tw:[min-height:0];
  @apply tw:overflow-hidden;
  @apply tw:[padding:1rem_1.25rem];
}

.modal.progress-modal #progressContent {
  @apply tw:h-full;
  @apply tw:[min-height:0];
  @apply tw:overflow-y-auto;
  @apply tw:overflow-x-hidden;
  @apply tw:[padding-right:0.2rem];
}

.modal.progress-modal .modal-actions {
  @apply tw:flex-none;
  @apply tw:mt-auto;
  @apply tw:sticky;
  @apply tw:[bottom:0];
  @apply tw:[z-index:6];
  @apply tw:[background:#ffffff];
  @apply tw:[border-top:1px_solid_#e5e7eb];
  @apply tw:[padding:0.75rem_1.1rem_0.95rem];
}

body.admin-dashboard .btn.btn-primary.edit-user-btn {
  @apply tw:[background:#4f8a35]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#4f8a35]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_6px_14px_rgba(79,_138,_53,_0.2)]!;
}

body.admin-dashboard .btn.btn-primary.edit-user-btn:hover,
body.admin-dashboard .btn.btn-primary.edit-user-btn:focus {
  @apply tw:[background:#477d30]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#477d30]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_8px_18px_rgba(79,_138,_53,_0.26)]!;
}

body.admin-dashboard .btn.btn-primary.edit-user-btn:active {
  @apply tw:[background:#3f702a]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#3f702a]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_3px_8px_rgba(79,_138,_53,_0.22)]!;
}

body.admin-dashboard .btn.btn-primary.edit-user-btn i {
  @apply tw:[color:#ffffff]!;
}

.modal.message-modal .modal-content {
  @apply tw:[width:min(680px,_94vw)];
  @apply tw:[max-width:680px];
  @apply tw:[max-height:min(92vh,_820px)];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:overflow-hidden;
}

.modal.message-modal .modal-body {
  @apply tw:[min-height:0];
  @apply tw:overflow-y-auto;
  @apply tw:[padding:1rem_1.1rem];
}

.modal.message-modal .message-form {
  @apply tw:grid;
  @apply tw:[gap:1rem];
}

.modal.message-modal .message-recipient {
  @apply tw:grid;
  @apply tw:[grid-template-columns:52px_minmax(0,_1fr)_32px];
  @apply tw:items-center;
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.85rem];
  @apply tw:[border:1px_solid_#d8e7d1];
  @apply tw:[border-radius:15px];
  @apply tw:[background:radial-gradient(circle_at_92%_20%,_rgba(105,_170,_71,_0.14),_transparent_32%),______#f7faf5];
}

.modal.message-modal .message-recipient-avatar {
  @apply tw:[width:48px];
  @apply tw:[height:48px];
  @apply tw:overflow-hidden;
  @apply tw:[border:2px_solid_#ffffff];
  @apply tw:[border-radius:50%];
  @apply tw:[background:#e8f0e4];
  @apply tw:[box-shadow:0_5px_12px_rgba(49,_95,_35,_0.14)];
}

.modal.message-modal .message-recipient-avatar img,
.modal.message-modal .message-recipient-avatar .avatar-placeholder {
  @apply tw:w-full!;
  @apply tw:h-full!;
  @apply tw:min-w-full!;
  @apply tw:min-h-full!;
  @apply tw:max-w-full!;
  @apply tw:max-h-full!;
  @apply tw:[border-radius:50%]!;
  @apply tw:object-cover;
}

.modal.message-modal .message-recipient-copy {
  @apply tw:grid;
  @apply tw:[min-width:0];
  @apply tw:[gap:0.1rem];
}

.modal.message-modal .message-recipient-label {
  @apply tw:[color:#5d7960];
  @apply tw:[font-size:0.66rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.modal.message-modal .message-recipient-copy strong {
  @apply tw:overflow-hidden;
  @apply tw:[color:#172033];
  @apply tw:[font-size:0.92rem];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.modal.message-modal .message-recipient-copy > span:last-child {
  @apply tw:overflow-hidden;
  @apply tw:[color:#718096];
  @apply tw:[font-size:0.75rem];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.modal.message-modal .message-recipient-check {
  @apply tw:inline-grid;
  @apply tw:[width:28px];
  @apply tw:[height:28px];
  @apply tw:place-items-center;
  @apply tw:[border-radius:50%];
  @apply tw:[background:#4f8a35];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:0.7rem];
}

.modal.message-modal .message-compose-card {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#e1e8ee];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_5px_16px_rgba(15,_23,_42,_0.04)];
}

.modal.message-modal .form-group {
  @apply tw:[margin:0];
}

.modal.message-modal .form-group label {
  @apply tw:block;
  @apply tw:[margin-bottom:0.4rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.modal.message-modal .form-group input,
.modal.message-modal .form-group textarea {
  @apply tw:w-full;
  @apply tw:[border:1px_solid_#dce3ea];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#f9fafb];
  @apply tw:[color:#172033];
  @apply tw:[font-size:0.88rem];
  @apply tw:[transition:border-color_0.18s_ease,_box-shadow_0.18s_ease,_background_0.18s_ease];
}

.modal.message-modal .form-group input {
  @apply tw:[min-height:44px];
  @apply tw:[padding:0.7rem_0.85rem];
}

.modal.message-modal .form-group textarea {
  @apply tw:[min-height:170px];
  @apply tw:[max-height:320px];
  @apply tw:[padding:0.8rem_0.85rem];
  @apply tw:[line-height:1.55];
  @apply tw:resize-y;
}

.modal.message-modal .form-group input:focus,
.modal.message-modal .form-group textarea:focus {
  @apply tw:[border-color:#69aa47];
  @apply tw:[outline:none];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_0_0_3px_rgba(105,_170,_71,_0.14)];
}

.modal.message-modal .message-options {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.65rem];
  @apply tw:[margin:0];
  @apply tw:[padding:0];
  @apply tw:[background:transparent];
}

.modal.message-modal .message-options-title {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:750];
}

.modal.message-modal .message-option-card {
  @apply tw:grid;
  @apply tw:[grid-template-columns:20px_minmax(0,_1fr)];
  @apply tw:[align-items:start];
  @apply tw:[gap:0.65rem];
  @apply tw:[min-width:0];
  @apply tw:[margin:0];
  @apply tw:[padding:0.75rem];
  @apply tw:[border:1px_solid_#e1e8ee];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#f8fafc];
  @apply tw:[color:#334155];
  @apply tw:[transition:border-color_0.18s_ease,_background_0.18s_ease];
}

.modal.message-modal .message-option-card:hover {
  @apply tw:[border-color:#bdd6b1];
  @apply tw:[background:#f7faf5];
}

.modal.message-modal .message-option-card .checkmark {
  @apply tw:[margin-top:0.1rem];
  @apply tw:[border-color:#a8b5c3];
  @apply tw:[border-radius:6px];
}

.modal.message-modal .message-option-card input:checked + .checkmark {
  @apply tw:[border-color:#4f8a35];
  @apply tw:[background:#edf7e9];
}

.modal.message-modal .message-option-card .checkmark::after {
  @apply tw:[background:#4f8a35];
}

.modal.message-modal .message-option-copy {
  @apply tw:grid;
  @apply tw:[min-width:0];
  @apply tw:[gap:0.18rem];
}

.modal.message-modal .message-option-copy strong {
  @apply tw:[color:#334155];
  @apply tw:[font-size:0.78rem];
}

.modal.message-modal .message-option-copy small {
  @apply tw:[color:#7b8797];
  @apply tw:[font-size:0.68rem];
  @apply tw:[line-height:1.4];
}

.modal.message-modal .modal-actions {
  @apply tw:justify-end;
  @apply tw:[padding:0.8rem_1.1rem];
  @apply tw:[border-top:1px_solid_#e5e7eb];
  @apply tw:[background:#ffffff];
}

body.admin-dashboard .modal.message-modal .btn.btn-primary.send-message-btn {
  @apply tw:[min-width:150px];
  @apply tw:[background:#4f8a35]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#4f8a35]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_6px_14px_rgba(79,_138,_53,_0.22)]!;
}

body.admin-dashboard .modal.message-modal .btn.btn-primary.send-message-btn:hover,
body.admin-dashboard .modal.message-modal .btn.btn-primary.send-message-btn:focus {
  @apply tw:[background:#477d30]!;
  @apply tw:[border-color:#477d30]!;
  @apply tw:[color:#ffffff]!;
}

body.admin-dashboard .modal.message-modal .send-message-btn i {
  @apply tw:[color:#ffffff]!;
}

@media (max-width: 600px) {
  .modal.message-modal .modal-content {
    @apply tw:[width:96vw];
    @apply tw:[max-height:92vh];
  }

  .modal.message-modal .modal-body {
    @apply tw:[padding:0.85rem];
  }

  .modal.message-modal .message-options {
    @apply tw:[grid-template-columns:1fr];
  }

  .modal.message-modal .message-option-card {
    @apply tw:[grid-column:1];
  }

  .modal.message-modal .modal-actions {
    @apply tw:[padding:0.7rem_0.85rem];
  }
}

.modal.new-user-modal .modal-content {
  @apply tw:[width:min(960px,_94vw)];
  @apply tw:[max-width:960px];
  @apply tw:[height:min(92vh,_860px)];
  @apply tw:[max-height:min(92vh,_860px)];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:overflow-hidden;
}

.modal.new-user-modal .modal-body {
  @apply tw:flex-auto;
  @apply tw:overflow-hidden;
  @apply tw:[padding:1rem_1.25rem];
}

.modal.new-user-modal .user-form {
  @apply tw:h-full;
  @apply tw:[min-height:0];
  @apply tw:flex;
  @apply tw:flex-col;
}

.modal.new-user-modal .form-tabs {
  @apply tw:flex-none;
}

.modal.new-user-modal .form-tab.active {
  @apply tw:[color:#3f7f2a];
}

.modal.new-user-modal .form-tab.active::after {
  @apply tw:[background:#69aa47]!;
}

.modal.new-user-modal .tab-content {
  @apply tw:hidden;
}

.modal.new-user-modal .tab-content.active {
  @apply tw:block;
  @apply tw:flex-auto;
  @apply tw:[min-height:0];
  @apply tw:overflow-y-auto;
  @apply tw:overflow-x-hidden;
  @apply tw:[padding-right:0.2rem];
  @apply tw:[padding-bottom:0.75rem];
  @apply tw:[scrollbar-width:thin];
  @apply tw:[scrollbar-color:rgba(100,_116,_139,_0.55)_transparent];
}

.modal.new-user-modal .tab-content.active::-webkit-scrollbar {
  @apply tw:[width:5px];
}

.modal.new-user-modal .tab-content.active::-webkit-scrollbar-track {
  @apply tw:[background:transparent];
}

.modal.new-user-modal .tab-content.active::-webkit-scrollbar-thumb {
  @apply tw:[background:rgba(100,_116,_139,_0.55)];
  @apply tw:[border-radius:999px];
}

.modal.new-user-modal .tab-content.active::-webkit-scrollbar-thumb:hover {
  @apply tw:[background:#64748b];
}

.modal.new-user-modal .form-actions {
  @apply tw:flex-none;
  @apply tw:mt-auto;
  @apply tw:sticky;
  @apply tw:[bottom:0];
  @apply tw:[z-index:5];
  @apply tw:[background:#ffffff];
  @apply tw:[border-top:1px_solid_#e5e7eb];
  @apply tw:[padding-top:0.75rem];
}

.modal.new-user-modal .action-right .next-tab.btn-primary {
  @apply tw:[background:#69aa47]!;
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_4px_10px_rgba(105,_170,_71,_0.22)]!;
}

.modal.new-user-modal .action-right .next-tab.btn-primary:hover {
  @apply tw:[background:#558f38]!;
  @apply tw:[border-color:#558f38]!;
  @apply tw:[box-shadow:0_6px_14px_rgba(105,_170,_71,_0.3)]!;
}

.modal.new-user-modal .action-right .submit-form.btn-success {
  @apply tw:[background:#69aa47]!;
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_4px_10px_rgba(105,_170,_71,_0.22)]!;
}

.modal.new-user-modal .action-right .submit-form.btn-success:hover {
  @apply tw:[background:#558f38]!;
  @apply tw:[border-color:#558f38]!;
  @apply tw:[box-shadow:0_6px_14px_rgba(105,_170,_71,_0.3)]!;
}

.modal.new-user-modal .action-right .submit-form.btn-success i {
  @apply tw:[color:#ffffff]!;
}

.new-user-trigger i {
  @apply tw:[color:#374151];
  @apply tw:[fill:#374151];
  @apply tw:[transition:color_0.2s_ease,_fill_0.2s_ease];
}

.new-user-trigger.active i {
  @apply tw:[color:#ffffff];
  @apply tw:[fill:#ffffff];
}

.new-user-modal .role-option .role-icon,
.new-user-modal .role-option .role-icon i {
  @apply tw:[color:#69aa47];
  @apply tw:[fill:#69aa47];
  @apply tw:[transition:color_0.2s_ease,_fill_0.2s_ease,_background-color_0.2s_ease];
}

.new-user-modal .role-option:hover {
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[background:rgba(105,_170,_71,_0.08)]!;
}

.new-user-modal .role-option.selected {
  @apply tw:[border-color:#69aa47]!;
  @apply tw:[background:rgba(105,_170,_71,_0.12)]!;
  @apply tw:[box-shadow:0_0_0_2px_rgba(105,_170,_71,_0.12)];
}

.new-user-modal .role-option.selected .role-icon,
.new-user-modal .role-option.selected .role-check {
  @apply tw:[background:#69aa47]!;
  @apply tw:[border-color:#69aa47]!;
}

.new-user-modal .role-option.selected .role-info h4 {
  @apply tw:[color:#3f7f2a];
}

.new-user-modal .role-option.selected .role-icon,
.new-user-modal .role-option.selected .role-icon i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[fill:#ffffff]!;
}

.new-user-modal .role-option .role-check i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[fill:#ffffff]!;
}

.modal.edit-user-modal .modal-content {
  @apply tw:[width:min(980px,_94vw)];
  @apply tw:[max-width:980px];
  @apply tw:[height:min(94vh,_860px)];
  @apply tw:[max-height:min(94vh,_860px)];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:overflow-hidden;
}

.modal.edit-user-modal .modal-body {
  @apply tw:flex-auto;
  @apply tw:[min-height:0];
  @apply tw:overflow-y-auto;
  @apply tw:overflow-x-hidden;
  @apply tw:[padding:1rem_1.1rem];
}

.modal.edit-user-modal .edit-form {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.35fr)_minmax(280px,_0.75fr)];
  @apply tw:[gap:1rem];
  @apply tw:[align-content:start];
}

.modal.edit-user-modal .form-section {
  @apply tw:[min-width:0];
  @apply tw:[margin:0];
  @apply tw:[padding:1rem];
  @apply tw:[border:1px_solid_#e1e8ee];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_6px_18px_rgba(15,_23,_42,_0.045)];
}

.modal.edit-user-modal .form-section-heading {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.7rem];
  @apply tw:[margin-bottom:1rem];
  @apply tw:[padding-bottom:0.85rem];
  @apply tw:[border-bottom:1px_solid_#edf1f5];
}

.modal.edit-user-modal .form-section-icon {
  @apply tw:inline-grid;
  @apply tw:[width:34px];
  @apply tw:[height:34px];
  @apply tw:[flex:0_0_34px];
  @apply tw:place-items-center;
  @apply tw:[border-radius:10px];
  @apply tw:[background:#edf7e9];
  @apply tw:[color:#477d30];
  @apply tw:[font-size:0.82rem];
}

.modal.edit-user-modal .form-section-title {
  @apply tw:[margin:0];
  @apply tw:[color:#172033];
  @apply tw:[font-size:0.95rem];
  @apply tw:[font-weight:750]!;
  @apply tw:[line-height:1.3];
}

.modal.edit-user-modal .form-section-heading p {
  @apply tw:[margin:0.2rem_0_0];
  @apply tw:[color:#718096];
  @apply tw:[font-size:0.76rem];
  @apply tw:[line-height:1.45];
}

.modal.edit-user-modal .form-fields-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.8rem];
}

.modal.edit-user-modal .form-section--account .form-fields-grid {
  @apply tw:[grid-template-columns:1fr];
}

.modal.edit-user-modal .form-group {
  @apply tw:[min-width:0];
  @apply tw:[margin:0];
}

.modal.edit-user-modal .form-group label {
  @apply tw:[margin-bottom:0.4rem];
  @apply tw:[color:#475569];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.modal.edit-user-modal .form-group--avatar {
  @apply tw:[margin-bottom:1rem];
}

.modal.edit-user-modal .edit-avatar-field {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:1rem];
  @apply tw:[min-width:0];
  @apply tw:[padding:0.85rem];
  @apply tw:[border:1px_dashed_#cbd8c5];
  @apply tw:[border-radius:14px];
  @apply tw:[background:#f7faf5];
}

.modal.edit-user-modal .edit-avatar-preview {
  @apply tw:[width:68px];
  @apply tw:[height:68px];
  @apply tw:[border-radius:50%];
  @apply tw:overflow-hidden;
  @apply tw:[border:3px_solid_#ffffff];
  @apply tw:[background:#edf2ea];
  @apply tw:[box-shadow:0_6px_16px_rgba(49,_95,_35,_0.16)];
  @apply tw:[flex:0_0_68px];
}

.modal.edit-user-modal .edit-avatar-preview img,
.modal.edit-user-modal .edit-avatar-preview .avatar-placeholder {
  @apply tw:w-full!;
  @apply tw:h-full!;
  @apply tw:min-w-full!;
  @apply tw:min-h-full!;
  @apply tw:max-w-full!;
  @apply tw:max-h-full!;
  @apply tw:[border-radius:50%]!;
}

.modal.edit-user-modal .edit-avatar-preview img {
  @apply tw:object-cover;
  @apply tw:[object-position:center];
  @apply tw:block;
}

.modal.edit-user-modal .edit-avatar-controls {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:[gap:0.45rem];
  @apply tw:flex-auto;
  @apply tw:[min-width:0];
}

.modal.edit-user-modal .edit-avatar-controls input[type="file"] {
  @apply tw:w-full;
  @apply tw:[min-height:auto];
  @apply tw:[padding:0.3rem];
  @apply tw:[border:1px_solid_#dce5d7];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#ffffff];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.76rem];
}

.modal.edit-user-modal .edit-avatar-controls input[type="file"]::file-selector-button {
  @apply tw:[margin-right:0.65rem];
  @apply tw:[padding:0.45rem_0.65rem];
  @apply tw:[border:0];
  @apply tw:[border-radius:8px];
  @apply tw:[background:#4f8a35];
  @apply tw:[color:#ffffff];
  @apply tw:[font:inherit];
  @apply tw:[font-weight:700];
  @apply tw:cursor-pointer;
}

.modal.edit-user-modal .edit-avatar-controls small {
  @apply tw:[font-size:0.68rem];
  @apply tw:[color:#64748b];
  @apply tw:[line-height:1.4];
}

.modal.edit-user-modal .form-group input,
.modal.edit-user-modal .form-group select {
  @apply tw:[min-height:44px];
  @apply tw:[border:1px_solid_#dce3ea];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#f9fafb];
  @apply tw:[color:#172033];
  @apply tw:[font-size:0.86rem];
  @apply tw:[transition:border-color_0.18s_ease,_box-shadow_0.18s_ease,_background_0.18s_ease];
}

.modal.edit-user-modal .form-group input:focus,
.modal.edit-user-modal .form-group select:focus {
  @apply tw:[border-color:#69aa47];
  @apply tw:[outline:none];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_0_0_3px_rgba(105,_170,_71,_0.14)];
}

.modal.edit-user-modal .modal-actions {
  @apply tw:mt-auto;
  @apply tw:justify-end;
  @apply tw:[padding:0.8rem_1.1rem];
  @apply tw:[border-top:1px_solid_#e5e7eb];
  @apply tw:[background:#ffffff];
}

body.admin-dashboard .modal.edit-user-modal .modal-actions .btn-success {
  @apply tw:[min-width:150px];
  @apply tw:[background:#4f8a35]!;
  @apply tw:bg-none!;
  @apply tw:[border-color:#4f8a35]!;
  @apply tw:[color:#ffffff]!;
  @apply tw:[box-shadow:0_6px_14px_rgba(79,_138,_53,_0.22)]!;
}

body.admin-dashboard .modal.edit-user-modal .modal-actions .btn-success:hover,
body.admin-dashboard .modal.edit-user-modal .modal-actions .btn-success:focus {
  @apply tw:[background:#477d30]!;
  @apply tw:[border-color:#477d30]!;
}

#profileContent .profile-details--refined {
  @apply tw:grid;
  @apply tw:[gap:1.1rem];
}

#profileContent .profile-details--refined .profile-header {
  @apply tw:grid;
  @apply tw:[grid-template-columns:76px_minmax(0,_1fr)];
  @apply tw:items-center;
  @apply tw:[gap:1rem];
  @apply tw:[padding:1.25rem_1.35rem];
  @apply tw:[border:1px_solid_#dce9d6];
  @apply tw:[border-radius:18px];
  @apply tw:[background:radial-gradient(circle_at_92%_15%,_rgba(105,_170,_71,_0.16),_transparent_34%),______linear-gradient(145deg,_#ffffff_0%,_#f6faf3_100%)];
  @apply tw:[box-shadow:0_10px_28px_rgba(49,_95,_35,_0.08)];
  @apply tw:w-full;
  @apply tw:max-w-full;
}

#profileContent .profile-details--refined .profile-header .profile-avatar.large {
  @apply tw:[width:68px];
  @apply tw:[height:68px];
  @apply tw:[min-width:68px];
  @apply tw:[min-height:68px];
  @apply tw:[border-radius:50%];
  @apply tw:[border:3px_solid_#ffffff];
  @apply tw:[box-shadow:0_8px_18px_rgba(49,_95,_35,_0.18)];
  @apply tw:overflow-hidden;
}

#profileContent .profile-details--refined .profile-header .profile-avatar.large img,
#profileContent .profile-details--refined .profile-header .profile-avatar.large .avatar-placeholder.large {
  @apply tw:w-full;
  @apply tw:h-full;
  @apply tw:min-w-full;
  @apply tw:min-h-full;
  @apply tw:max-w-full;
  @apply tw:max-h-full;
  @apply tw:[border-radius:inherit];
}

#profileContent .profile-details--refined .profile-header .profile-avatar.large .avatar-placeholder.large {
  @apply tw:w-full!;
  @apply tw:h-full!;
  @apply tw:min-w-full!;
  @apply tw:min-h-full!;
  @apply tw:max-w-full!;
  @apply tw:max-h-full!;
  @apply tw:[aspect-ratio:1_/_1];
  @apply tw:[border-radius:50%]!;
  @apply tw:[background:linear-gradient(145deg,_#5b9840,_#3f742c)];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:1.15rem];
  @apply tw:[font-weight:750];
  @apply tw:grid;
  @apply tw:place-items-center;
}

#profileContent .profile-details--refined .profile-header .profile-title {
  @apply tw:[min-width:0];
  @apply tw:text-left;
  @apply tw:[justify-self:start];
}

#profileContent .profile-details--refined .profile-name {
  @apply tw:[margin:0];
  @apply tw:[font-size:1.45rem];
  @apply tw:[font-weight:750];
  @apply tw:[line-height:1.2];
  @apply tw:[color:#0f172a];
  @apply tw:[letter-spacing:-0.025em];
  @apply tw:text-left;
}

#profileContent .profile-details--refined .profile-email {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[min-width:0];
  @apply tw:[margin:0.35rem_0_0];
  @apply tw:[color:#64748b];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.4];
}

#profileContent .profile-details--refined .profile-email i {
  @apply tw:flex-none;
  @apply tw:[color:#5b9840];
  @apply tw:[font-size:0.75rem];
}

#profileContent .profile-details--refined .profile-email span {
  @apply tw:[overflow-wrap:anywhere];
}

#profileContent .profile-details--refined .profile-meta-line {
  @apply tw:[margin-top:0.65rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.75rem];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1];
  @apply tw:justify-start;
  @apply tw:flex-wrap;
}

#profileContent .profile-details--refined .profile-meta-strand {
  @apply tw:[color:#315f23];
  @apply tw:[font-weight:750];
  @apply tw:[letter-spacing:0.03em];
  @apply tw:uppercase;
  @apply tw:[background:#edf7e9];
  @apply tw:[border:1px_solid_#cce2c2];
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.3rem_0.6rem];
}

#profileContent .profile-details--refined .profile-meta-status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[color:#334155];
  @apply tw:[font-weight:500];
  @apply tw:lowercase;
  @apply tw:[background:#f8fafc];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.28rem_0.55rem];
}

#profileContent .profile-details--refined .profile-meta-status .status-dot {
  @apply tw:[width:9px];
  @apply tw:[height:9px];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#22c55e];
  @apply tw:[box-shadow:0_0_0_3px_rgba(34,_197,_94,_0.16)];
}

.status-badge.active {
  @apply tw:[background:#ecfdf3]!;
  @apply tw:[color:#166534]!;
  @apply tw:[border-color:#86efac]!;
}

.status-badge.pending {
  @apply tw:[background:#fffbeb]!;
  @apply tw:[color:#a16207]!;
  @apply tw:[border-color:#fde68a]!;
}

.status-badge.inactive {
  @apply tw:[background:#fef2f2]!;
  @apply tw:[color:#991b1b]!;
  @apply tw:[border-color:#fca5a5]!;
}

#profileContent .profile-details--refined .profile-meta-status.active {
  @apply tw:[background:#ecfdf3];
  @apply tw:[border-color:#86efac];
  @apply tw:[color:#166534];
}

#profileContent .profile-details--refined .profile-meta-status.active .status-dot {
  @apply tw:[background:#22c55e];
  @apply tw:[box-shadow:0_0_0_3px_rgba(34,_197,_94,_0.2)];
}

#profileContent .profile-details--refined .profile-meta-status.pending {
  @apply tw:[background:#fffbeb];
  @apply tw:[border-color:#fde68a];
  @apply tw:[color:#a16207];
}

#profileContent .profile-details--refined .profile-meta-status.pending .status-dot {
  @apply tw:[background:#eab308];
  @apply tw:[box-shadow:0_0_0_3px_rgba(234,_179,_8,_0.2)];
}

#profileContent .profile-details--refined .profile-meta-status.inactive {
  @apply tw:[background:#fef2f2];
  @apply tw:[border-color:#fca5a5];
  @apply tw:[color:#991b1b];
}

#profileContent .profile-details--refined .profile-meta-status.inactive .status-dot {
  @apply tw:[background:#ef4444];
  @apply tw:[box-shadow:0_0_0_3px_rgba(239,_68,_68,_0.2)];
}

#profileContent .profile-details--refined .profile-info-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[align-items:start];
  @apply tw:[gap:1rem];
}

#profileContent .profile-details--refined .info-section {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.65rem];
  @apply tw:[border:1px_solid_#e2e8f0];
  @apply tw:[border-radius:16px];
  @apply tw:[background:#ffffff];
  @apply tw:[padding:1rem];
  @apply tw:[box-shadow:0_6px_18px_rgba(15,_23,_42,_0.045)];
}

#profileContent .profile-details--refined .info-section h4 {
  @apply tw:[grid-column:1_/_-1];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.6rem];
  @apply tw:[margin:0_0_0.2rem];
  @apply tw:[color:#0f172a];
  @apply tw:[font-size:0.95rem];
  @apply tw:[font-weight:750];
  @apply tw:[letter-spacing:0.01em];
  @apply tw:[padding-bottom:0.75rem];
  @apply tw:[border-bottom:1px_solid_#edf1f5];
}

#profileContent .profile-details--refined .info-section-icon {
  @apply tw:inline-grid;
  @apply tw:[width:30px];
  @apply tw:[height:30px];
  @apply tw:[flex:0_0_30px];
  @apply tw:place-items-center;
  @apply tw:[border-radius:9px];
  @apply tw:[background:#edf7e9];
  @apply tw:[color:#477d30];
  @apply tw:[font-size:0.78rem];
}

#profileContent .profile-details--refined .info-item {
  @apply tw:grid;
  @apply tw:[align-content:start];
  @apply tw:[gap:0.3rem];
  @apply tw:[min-width:0];
  @apply tw:[min-height:72px];
  @apply tw:[padding:0.75rem_0.8rem];
  @apply tw:[border:1px_solid_#e7ecf1];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#f8fafc];
}

#profileContent .profile-details--refined .info-item--wide {
  @apply tw:[grid-column:1_/_-1];
}

#profileContent .profile-details--refined .info-label {
  @apply tw:[color:#8491a3];
  @apply tw:[font-weight:750];
  @apply tw:[font-size:0.68rem];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.07em];
}

#profileContent .profile-details--refined .info-value {
  @apply tw:[color:#0f172a];
  @apply tw:[min-width:0];
  @apply tw:[font-weight:650];
  @apply tw:[font-size:0.9rem];
  @apply tw:[line-height:1.4];
  @apply tw:text-left;
  @apply tw:[overflow-wrap:anywhere];
}

.modal.profile-modal .modal-header h3 {
  @apply tw:[font-weight:500];
  @apply tw:[letter-spacing:0.01em];
}

#profileContent .profile-details--refined .status-badge {
  @apply tw:[font-weight:500];
}

#profileContent .profile-details--refined .profile-star {
  @apply tw:[color:#f59e0b];
  @apply tw:[margin-left:0.25rem];
}

@media (max-width: 900px) {
  .modal.profile-modal .modal-content.large {
    @apply tw:[width:min(96vw,_960px)];
    @apply tw:[height:min(92vh,_860px)];
    @apply tw:[max-height:min(92vh,_860px)];
  }

  .modal.progress-modal .modal-content.large {
    @apply tw:[width:min(96vw,_1000px)];
    @apply tw:[height:min(92vh,_860px)];
    @apply tw:[max-height:min(92vh,_860px)];
  }

  .modal.new-user-modal .modal-content {
    @apply tw:[width:96vw];
    @apply tw:[height:min(92vh,_860px)];
    @apply tw:[max-height:min(92vh,_860px)];
  }

  .modal.edit-user-modal .modal-content {
    @apply tw:[width:96vw];
    @apply tw:[height:min(94vh,_860px)];
    @apply tw:[max-height:min(94vh,_860px)];
  }

  .modal.edit-user-modal .edit-form {
    @apply tw:[grid-template-columns:1fr];
  }

  #profileContent .profile-details--refined .profile-info-grid {
    @apply tw:[grid-template-columns:1fr];
  }
}

@media (max-width: 640px) {
  .modal.profile-modal .modal-content.large {
    @apply tw:[width:96vw];
    @apply tw:[height:92vh];
    @apply tw:[max-height:92vh];
  }

  .modal.progress-modal .modal-content.large {
    @apply tw:[width:96vw];
    @apply tw:[height:92vh];
    @apply tw:[max-height:92vh];
  }

  .modal.profile-modal .modal-body {
    @apply tw:[padding:0.85rem_0.9rem];
  }

  .modal.progress-modal .modal-body {
    @apply tw:[padding:0.85rem_0.9rem];
  }

  .modal.profile-modal .modal-actions {
    @apply tw:[padding:0.65rem_0.85rem_0.8rem];
  }

  .modal.progress-modal .modal-actions {
    @apply tw:[padding:0.65rem_0.85rem_0.8rem];
  }

  .modal.new-user-modal .modal-content {
    @apply tw:[width:96vw];
    @apply tw:[height:92vh];
    @apply tw:[max-height:92vh];
  }

  .modal.new-user-modal .modal-body {
    @apply tw:[padding:0.85rem_0.9rem];
  }

  .modal.new-user-modal .tab-content.active {
    @apply tw:[padding-bottom:0.6rem];
  }

  .modal.new-user-modal .form-actions {
    @apply tw:[padding-top:0.65rem];
    @apply tw:[padding-bottom:0.15rem];
  }

  .modal.edit-user-modal .modal-content {
    @apply tw:[width:96vw];
    @apply tw:[height:92vh];
    @apply tw:[max-height:92vh];
  }

  .modal.edit-user-modal .modal-body {
    @apply tw:[padding:0.7rem_0.85rem_0.5rem];
  }

  .modal.edit-user-modal .form-section {
    @apply tw:[padding:0.75rem_0.8rem];
  }

  .modal.edit-user-modal .form-fields-grid {
    @apply tw:[grid-template-columns:1fr];
  }

  .modal.edit-user-modal .edit-avatar-field {
    @apply tw:items-start;
    @apply tw:[padding:0.75rem];
  }

  .modal.edit-user-modal .modal-actions {
    @apply tw:[padding:0.65rem_0.85rem_0.8rem];
  }

  #profileContent .profile-details--refined .profile-header {
    @apply tw:[grid-template-columns:56px_minmax(0,_1fr)];
    @apply tw:items-center;
    @apply tw:max-w-full;
    @apply tw:w-full;
    @apply tw:[padding:0.95rem];
    @apply tw:[gap:0.8rem];
  }

  #profileContent .profile-details--refined .profile-header .profile-avatar.large {
    @apply tw:[width:54px];
    @apply tw:[height:54px];
    @apply tw:[min-width:54px];
    @apply tw:[min-height:54px];
    @apply tw:[border-radius:50%];
  }

  #profileContent .profile-details--refined .profile-name {
    @apply tw:[font-size:1.18rem];
  }

  #profileContent .profile-details--refined .profile-email {
    @apply tw:[font-size:0.78rem];
  }

  #profileContent .profile-details--refined .profile-meta-line {
    @apply tw:[gap:0.5rem];
    @apply tw:[font-size:0.8rem];
  }

  #profileContent .profile-details--refined .info-section {
    @apply tw:[grid-template-columns:1fr];
    @apply tw:[padding:0.85rem];
  }

  #profileContent .profile-details--refined .info-item,
  #profileContent .profile-details--refined .info-item--wide {
    @apply tw:[grid-column:1];
    @apply tw:[min-height:66px];
  }
}


</style>

<style scoped>
@reference "../../styles/tailwind.css";
#addUserForm #email.email-invalid {
  @apply tw:[border-color:#dc2626];
}

</style>
