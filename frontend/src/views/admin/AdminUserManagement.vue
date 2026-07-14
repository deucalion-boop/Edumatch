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
          <div class="header-actions">
            <button
              class="btn new-user-trigger"
              :class="{ 'btn-primary active': modals.addUser, 'btn-outline': !modals.addUser }"
              style="background: #000000 !important; background-image: none !important; border-color: #000000 !important; color: #ffffff !important; box-shadow: none !important;"
              @click="openAddUserModal"
              :aria-pressed="modals.addUser ? 'true' : 'false'"
            >
              <i class="fas fa-user-plus"></i>
              Add New User
            </button>
            <button class="btn btn-outline" @click="exportUsers">
              <i class="fas fa-download"></i>
              Export CSV
            </button>
          </div>
        </div>

        <!-- User Filters -->
        <section class="user-filters section-card fade-in" style="animation-delay: 0.2s; border-color: #69aa47 !important;">
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
        <section class="users-table-section section-card fade-in" style="animation-delay: 0.3s; border-color: #69aa47 !important;">
          <div class="table-header">
            <div class="table-info">
              <h3>Users List</h3>
              <span class="table-count">
                Showing {{ paginatedUsers.length }} of 
                {{ filteredUsers.length }} users
              </span>
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
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="users-table" id="usersTable">
              <thead>
                <tr>
                  <th class="select-col">
                    <div class="checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        id="selectAll" 
                        v-model="selectAll"
                        @change="toggleSelectAll"
                      >
                    </div>
                  </th>
                  <th class="user-col">User</th>
                  <th class="role-col">Role</th>
                  <th class="status-col">Status</th>
                  <th class="progress-col">Progress</th>
                  <th class="courses-col">Lessons</th>
                  <th class="joined-col">Joined</th>
                  <th class="last-active-col">Last Active</th>
                  <th class="actions-col">Actions</th>
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
                    <td class="select-col">
                      <div class="checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          class="user-checkbox"
                          :id="'user-' + user.id"
                          v-model="selectedUsers"
                          :value="user.id"
                        >
                      </div>
                    </td>
                    <td class="user-col">
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
                    <td class="role-col">
                      <span class="role-badge" :class="user.role">
                        <i :class="getRoleIcon(user.role)"></i>
                        {{ capitalize(user.role) }}
                      </span>
                    </td>
                    <td class="status-col">
                      <span class="status-badge" :class="user.status">
                        <i class="fas fa-circle"></i>
                        {{ capitalize(user.status) }}
                      </span>
                    </td>
                    <td class="progress-col">
                      <template v-if="user.role === 'student'">
                        <div class="progress-container">
                          <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: (user.completionRate || 0) + '%' }"></div>
                          </div>
                        </div>
                      </template>
                      <template v-else-if="user.role === 'teacher'">
                        <span class="na-text">N/A</span>
                      </template>
                      <span v-else class="na-text">N/A</span>
                    </td>
                    <td class="courses-col">
                      <template v-if="user.role === 'student'">
                        <div class="course-count">
                          <span class="count">{{ user.lessonsCompleted ?? user.coursesCompleted ?? 0 }}</span>
                          <span class="label">lessons completed</span>
                        </div>
                      </template>
                      <template v-else-if="user.role === 'teacher'">
                        <div class="course-count">
                          <span class="count">{{ user.lessonsCreated ?? user.coursesCreated ?? 0 }}</span>
                          <span class="label">lessons created</span>
                        </div>
                      </template>
                      <span v-else class="na-text">N/A</span>
                    </td>
                    <td class="joined-col">
                      <span class="date-text">{{ formatDate(user.createdAt) }}</span>
                    </td>
                    <td class="last-active-col">
                      <span class="time-text">{{ getLastActive(user.lastActive) }}</span>
                    </td>
                    <td class="actions-col">
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
                  <td colspan="9">
                    <div class="no-data">
                      <div class="no-data-icon">
                        <i class="fas fa-user-slash"></i>
                      </div>
                      <h4>No Users Found</h4>
                      <p>Try adjusting your filters or add new users</p>
                      <button
                        class="btn btn-primary"
                        style="background: #000000 !important; background-image: none !important; border-color: #000000 !important; color: #ffffff !important; box-shadow: none !important;"
                        @click="openAddUserModal"
                      >
                        <i class="fas fa-user-plus"></i>
                        Add First User
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
              Showing {{ paginatedUsers.length }} of {{ filteredUsers.length }} users
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
                @click="addUserTab = 'role'"
              >
                Role & Permissions
              </button>
              <button 
                type="button" 
                class="form-tab" 
                :class="{ active: addUserTab === 'additional' }"
                @click="addUserTab = 'additional'"
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
                  required
                  placeholder="user@example.com"
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
                      <p>Can view HeadTeacher and Teacher lists with read-only access</p>
                    </div>
                    <div class="role-check">
                      <i class="fas fa-check"></i>
                    </div>
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
                  <input value="Active - password change required on first login" readonly style="background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;">
                </div>
              </div>

              <div v-if="newUser.role === 'headteacher'" class="form-group">
                <label for="headteacherDepartment">Department *</label>
                <select id="headteacherDepartment" v-model="newUser.department" required>
                  <option value="" disabled>Select department</option>
                  <option v-for="department in departmentOptions" :key="department" :value="department">
                    {{ department }}
                  </option>
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
            <button 
              class="action-card"
              @click="viewUserProfile"
            >
              <i class="fas fa-user-circle"></i>
              View Profile
            </button>
            <button 
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
              class="action-card"
              @click="sendMessage"
            >
              <i class="fas fa-envelope"></i>
              Send Message
            </button>
            <button
              v-if="selectedUser?.status === 'pending'"
              class="action-card"
              @click="sendInviteToUser"
            >
              <i class="fas fa-paper-plane"></i>
              Send Invite
            </button>
            <button 
              class="action-card"
              :class="{ active: selectedUser?.status === 'active' }"
              @click="toggleUserStatus"
            >
              <i :class="selectedUser?.status === 'active' ? 'fas fa-pause-circle' : 'fas fa-play-circle'"></i>
              {{ selectedUser?.status === 'active' ? 'Deactivate' : 'Activate' }}
            </button>
            <button 
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

            <div class="form-section">
              <div class="form-section-title">
                <i class="fas fa-info-circle"></i>
                Basic Information
              </div>
              <div class="form-group">
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
                  placeholder="+63 912 345 6789"
                >
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">
                <i class="fas fa-shield-alt"></i>
                Account Settings
              </div>
              <div class="form-group">
                <label for="editRole">User Role</label>
                <select id="editRole" v-model="editUserData.role" @change="onEditRoleChange">
                  <option value="secretary">Secretary</option>
                  <option value="headteacher">HeadTeacher</option>
                </select>
              </div>
              <div v-if="editUserData.role === 'headteacher'" class="form-group">
                <label for="editDepartment">Department</label>
                <select id="editDepartment" v-model="editUserData.department">
                  <option value="" disabled>Select Department</option>
                  <option v-for="department in departmentOptions" :key="department" :value="department">
                    {{ department }}
                  </option>
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
                  <h4>User Information</h4>
                  <div class="info-item">
                    <span class="info-label">Full Name:</span>
                    <span class="info-value">{{ selectedUser.name || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{{ selectedUser.email || 'N/A' }}</span>
                  </div>
                  <div v-if="['teacher', 'headteacher', 'secretary'].includes(selectedUser.role)" class="info-item">
                    <span class="info-label">Username:</span>
                    <span class="info-value">{{ selectedUser.username || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Role:</span>
                    <span class="info-value">{{ capitalize(selectedUser.role) || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Contact Number:</span>
                    <span class="info-value">{{ selectedUser.contactNumber || 'N/A' }}</span>
                  </div>
                </div>
                
                <div class="info-section">
                  <h4>Account Details</h4>
                  <div v-if="selectedUser.role === 'headteacher'" class="info-item">
                    <span class="info-label">Department:</span>
                    <span class="info-value">{{ selectedUser.department || 'N/A' }}</span>
                  </div>
                  <div v-if="selectedUser.role === 'teacher'" class="info-item">
                    <span class="info-label">Subject:</span>
                    <span class="info-value">{{ selectedUser.subject || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="status-badge" :class="selectedUser.status">{{ capitalize(selectedUser.status) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Joined:</span>
                    <span class="info-value">{{ formatDate(selectedUser.createdAt) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last Active:</span>
                    <span class="info-value">{{ getLastActive(selectedUser.lastActive) }}</span>
                  </div>
                </div>
                
                <div v-if="selectedUser.role === 'student'" class="info-section">
                  <h4>Learning Stats</h4>
                  <div class="info-item">
                    <span class="info-label">Enrolled Track:</span>
                    <span class="info-value">{{ selectedUser.enrolledTrack || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Completed:</span>
                    <span class="info-value">{{ selectedUser.coursesCompleted || 0 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Completion Rate:</span>
                    <span class="info-value">{{ selectedUser.completionRate || 0 }}%</span>
                  </div>
                </div>
                
                <div v-if="selectedUser.role === 'teacher'" class="info-section">
                  <h4>Teaching Stats</h4>
                  <div class="info-item">
                    <span class="info-label">Lessons Created:</span>
                    <span class="info-value">{{ selectedUser.lessonsCreated || 0 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Students:</span>
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
          <button class="btn btn-primary edit-user-btn" @click="editFromProfile">
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
    <div class="modal" :class="{ active: modals.sendMessage }">
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
              <span style="font-weight: 600; color: #1e293b;">To:</span>
              <span id="recipientName">{{ selectedUser ? selectedUser.name : '' }}</span>
            </div>
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
                placeholder="Type your message here..." 
                required
              ></textarea>
            </div>
            <div class="message-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="messageData.sendEmail">
                <span class="checkmark"></span>
                Send as email too
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="messageData.urgent">
                <span class="checkmark"></span>
                Mark as urgent
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
    const newUser = reactive({
      fullName: '',
      username: '',
      email: '',
      role: 'secretary',
      status: 'active',
      department: '',
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
    const contactNumberPattern = /^\+?[0-9()\-. ]{7,30}$/
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
      if (profileImage) return profileImage
      const avatar = String(user?.avatar || '').trim()
      if (avatar) return avatar
      return ''
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
        contactNumber: firstDefined(user?.contactNumber, fallback?.contactNumber, ''),
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
        if (role !== 'headteacher') {
          newUser.department = ''
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
        department: user.role === 'headteacher' ? (user.department || '') : '',
        subject: user.subject || '',
        contactNumber: user.contactNumber || '',
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
      if (editUserData.value.role !== 'headteacher') {
        editUserData.value.department = ''
      }
    }
    
    // Tab navigation
    const nextTab = () => {
      if (addUserTab.value === 'basic') addUserTab.value = 'role'
      else if (addUserTab.value === 'role') addUserTab.value = 'additional'
    }
    
    const prevTab = () => {
      if (addUserTab.value === 'role') addUserTab.value = 'basic'
      else if (addUserTab.value === 'additional') addUserTab.value = 'role'
    }
    
    // Create user
    const createUser = async () => {
      if (isCreateInviteLoading.value) return

      if (!newUser.fullName || !newUser.email || !String(newUser.username || '').trim()) {
        showToastMessage('Name, email, and username are required', 'error')
        return
      }

      if (!['secretary', 'headteacher'].includes(newUser.role)) {
        showToastMessage('Role must be secretary or headteacher', 'error')
        return
      }
      const contactNumber = String(newUser.contactNumber || '').trim().replace(/\s+/g, ' ')
      if (contactNumber && !contactNumberPattern.test(contactNumber)) {
        showToastMessage('Please enter a valid contact number', 'error')
        return
      }
      if (newUser.role === 'headteacher' && !String(newUser.department || '').trim()) {
        showToastMessage('Department is required for HeadTeacher role', 'error')
        return
      }
      if (newUser.role === 'headteacher' && hasDepartmentHeadTeacher({ department: newUser.department })) {
        showToastMessage('This department already has a Head Teacher assigned', 'error')
        return
      }

      // TEMP DEBUG: trace contact number from UI -> create request payload
      console.log('[TEMP][AdminUserManagement][createUser] normalized contactNumber:', contactNumber)

      isCreateInviteLoading.value = true

      try {
        const createPayload = {
          name: newUser.fullName.trim(),
          email: newUser.email.trim(),
          username: String(newUser.username || '').trim(),
          role: newUser.role,
          status: 'active',
          department: newUser.role === 'headteacher' ? newUser.department : '',
          contactNumber,
        }
        console.log('[TEMP][AdminUserManagement][createUser] payload:', createPayload)
        const response = await axios.post(`${apiBaseUrl}/admin/users`, createPayload, getAuthConfig())
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
      const allowedRoles = ['secretary', 'headteacher']
      const allowedStatuses = ['pending', 'active', 'inactive', 'suspended']
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      const fullName = String(editUserData.value.fullName || '').trim()
      const email = String(editUserData.value.email || '').trim()
      const role = String(editUserData.value.role || '').trim()
      const status = String(editUserData.value.status || '').trim()
      const department = String(editUserData.value.department || '').trim()
      const contactNumber = String(editUserData.value.contactNumber || '').trim().replace(/\s+/g, ' ')

      if (!editUserData.value.id) {
        showToastMessage('Invalid user record. Please reopen Edit User.', 'error')
        return
      }
      if (!fullName) {
        showToastMessage('Full Name is required', 'error')
        return
      }
      if (!email || !emailRegex.test(email)) {
        showToastMessage('Please enter a valid email address', 'error')
        return
      }
      if (!allowedRoles.includes(role)) {
        showToastMessage('Role must be secretary or headteacher', 'error')
        return
      }
      if (!allowedStatuses.includes(status)) {
        showToastMessage('Status must be pending, active, inactive, or suspended', 'error')
        return
      }
      if (role === 'headteacher' && !department) {
        showToastMessage('Department is required for HeadTeacher role', 'error')
        return
      }
      if (role === 'headteacher' && hasDepartmentHeadTeacher({
        department,
        excludeUserId: editUserData.value.id,
      })) {
        showToastMessage('This department already has a Head Teacher assigned', 'error')
        return
      }
      if (contactNumber && !contactNumberPattern.test(contactNumber)) {
        showToastMessage('Please enter a valid contact number', 'error')
        return
      }

      const payload = new FormData()
      payload.append('name', fullName)
      payload.append('email', email)
      payload.append('role', role)
      payload.append('status', status)
      payload.append('department', role === 'headteacher' ? department : '')
      payload.append('contactNumber', contactNumber)
      if (selectedEditAvatarFile.value) {
        payload.append('profileImage', selectedEditAvatarFile.value)
      }

      try {
        isSavingEdit.value = true
        const response = await axios.put(
          `${apiBaseUrl}/admin/users/${editUserData.value.id}`,
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
      const response = await axios.get(`${apiBaseUrl}/admin/users/${userId}`, getAuthConfig())
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
          `${apiBaseUrl}/admin/users/${userId}/messages`,
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
          `${apiBaseUrl}/admin/users/${userId}/send-invite`,
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
            `${apiBaseUrl}/admin/users/${userId}`,
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

          await axios.delete(`${apiBaseUrl}/admin/users/${userId}`, {
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
        const response = await axios.get(`${apiBaseUrl}/admin/users`, getAuthConfig())
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
@import url('/css/admin.css');

/* Local override: make user list table typography smaller for denser readability. */
.users-table thead th {
  font-size: 0.72rem;
}

.users-table tbody td {
  font-size: 0.8rem;
}

.users-table .user-name {
  font-size: 0.82rem;
}

.users-table .user-email,
.users-table .user-id,
.users-table .time-text,
.users-table .date-text,
.users-table .na-text,
.users-table .progress-text {
  font-size: 0.72rem;
}

.users-table .progress-container {
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  row-gap: 0.25rem;
}

.users-table .progress-bar {
  width: 100%;
}

.users-table .progress-text {
  min-width: 0;
  text-align: center;
}

.users-table .course-count .label {
  display: block;
  text-align: center;
}

body.admin-dashboard .btn.btn-primary.export-report-btn {
  background: #000000 !important;
  background-image: none !important;
  border-color: #000000 !important;
  color: #ffffff !important;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18) !important;
}

body.admin-dashboard .btn.btn-primary.export-report-btn i {
  color: #ffffff !important;
}

body.admin-dashboard .btn.btn-primary.export-report-btn:hover,
body.admin-dashboard .btn.btn-primary.export-report-btn:focus {
  background: #111111 !important;
  background-image: none !important;
  border-color: #111111 !important;
  color: #ffffff !important;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22) !important;
}

body.admin-dashboard .btn.btn-primary.export-report-btn:hover i,
body.admin-dashboard .btn.btn-primary.export-report-btn:focus i {
  color: #ffffff !important;
}

body.admin-dashboard .btn.btn-primary.export-report-btn:active {
  background: #000000 !important;
  background-image: none !important;
  border-color: #000000 !important;
  color: #ffffff !important;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18) !important;
}

body.admin-dashboard .btn.btn-primary.export-report-btn:active i {
  color: #ffffff !important;
}

.export-approval-section {
  display: grid;
  gap: 1rem;
}

.export-approval-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.export-approval-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.export-approval-header p,
.export-approval-caption {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
}

.export-approval-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.export-approval-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
}

.export-approval-count.has-pending {
  border-color: #fdba74;
  background: #fff7ed;
  color: #9a3412;
}

.export-approval-refresh {
  min-height: 40px;
}

.export-approval-empty {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem 1.1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  color: #64748b;
  background: #f8fafc;
  font-size: 0.9rem;
}

.export-request-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.export-request-card {
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.export-request-card.is-pending {
  border-color: #fdba74;
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.08);
}

.export-request-card.is-approved {
  border-color: #86efac;
  background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
}

.export-request-card.is-rejected,
.export-request-card.is-expired {
  border-color: #fca5a5;
  background: linear-gradient(180deg, #ffffff 0%, #fef2f2 100%);
}

.export-request-card.is-fulfilled {
  border-color: #cbd5e1;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.export-request-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.export-request-top h4 {
  margin: 0;
  font-size: 0.98rem;
}

.export-request-top p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.82rem;
}

.export-request-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.export-request-status.is-pending {
  border-color: #fdba74;
  background: #fff7ed;
  color: #9a3412;
}

.export-request-status.is-approved {
  border-color: #86efac;
  background: #ecfdf5;
  color: #166534;
}

.export-request-status.is-rejected,
.export-request-status.is-expired {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}

.export-request-status.is-fulfilled {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #475569;
}

.export-request-meta {
  display: grid;
  gap: 0.45rem;
}

.export-request-meta span,
.export-request-review,
.export-request-expiry,
.export-request-note {
  margin: 0;
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.5;
}

.export-request-meta span {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}

.export-request-meta i {
  margin-top: 0.12rem;
  color: #64748b;
}

.export-request-expiry {
  color: #166534;
  font-weight: 600;
}

.export-request-note {
  color: #334155;
}

.export-request-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.export-request-action {
  min-height: 42px;
}

.export-request-action--reject {
  border-color: #fca5a5 !important;
  color: #b91c1c !important;
}

#progressContent .progress-details {
  display: grid;
  gap: 1.35rem;
}

#progressContent .progress-subtitle {
  margin: 0.35rem 0 0;
  color: rgba(226, 232, 240, 0.92);
  font-size: 0.95rem;
  line-height: 1.6;
}

#progressContent .progress-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem 1.25rem;
  padding: 1.35rem;
  border-radius: 24px;
  color: #ffffff;
}

#progressContent .progress-hero.is-idle {
  background:
    radial-gradient(circle at top right, rgba(253, 186, 116, 0.3), transparent 28%),
    linear-gradient(135deg, #7c2d12 0%, #ea580c 100%);
  box-shadow: 0 22px 44px rgba(124, 45, 18, 0.22);
}

#progressContent .progress-hero.is-active {
  background:
    radial-gradient(circle at top right, rgba(110, 231, 183, 0.24), transparent 28%),
    linear-gradient(135deg, #14532d 0%, #16a34a 100%);
  box-shadow: 0 22px 44px rgba(20, 83, 45, 0.22);
}

#progressContent .progress-hero::after {
  content: '';
  position: absolute;
  inset: auto -10% -30% auto;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12), transparent 68%);
  pointer-events: none;
}

#progressContent .progress-hero-copy {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.9rem;
  min-width: 0;
}

#progressContent .progress-hero-copy h4 {
  margin: 0;
  font-size: 1.55rem;
  line-height: 1.12;
  color: #ffffff;
}

#progressContent .progress-hero-chips,
#progressContent .progress-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 0.85rem;
}

#progressContent .progress-track-chip,
#progressContent .progress-status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.42rem 0.8rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

#progressContent .progress-track-chip {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff7ed;
}

#progressContent .progress-status-chip.tone-strong {
  background: #dcfce7;
  color: #166534;
}

#progressContent .progress-status-chip.tone-steady {
  background: #dcfce7;
  color: #166534;
}

#progressContent .progress-status-chip.tone-starting {
  background: #dcfce7;
  color: #166534;
}

#progressContent .progress-status-chip.tone-idle {
  background: #ffedd5;
  color: #9a3412;
}

#progressContent .progress-hero-meta {
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.86rem;
}

#progressContent .progress-hero-meta span,
#progressContent .course-progress-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
}

#progressContent .progress-hero-meta .fa-book-open,
#progressContent .progress-hero-meta .fa-clock-rotate-left {
  color: #ffffff !important;
}

#progressContent .progress-hero-metric {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.45rem;
  align-content: start;
  justify-items: end;
}

#progressContent .progress-hero-metric small {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

#progressContent .progress-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 72px;
  min-width: 120px;
  padding: 0.85rem 1.15rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 800;
  white-space: nowrap;
}

#progressContent .progress-hero-track {
  grid-column: 1 / -1;
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.6rem;
}

#progressContent .progress-hero-bar {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  overflow: hidden;
}

#progressContent .progress-hero-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #86efac 0%, #22c55e 55%, #dcfce7 100%);
}

#progressContent .progress-hero-track-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.84rem;
}

#progressContent .progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.95rem;
}

#progressContent .stat-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  align-items: center;
  padding: 1rem 1.05rem;
  border: 1px solid #dbe4ec;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

#progressContent .stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1rem;
}

#progressContent .stat-icon.tone-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

#progressContent .stat-icon.tone-amber {
  background: #fef3c7;
  color: #b45309;
}

#progressContent .stat-icon.tone-teal {
  background: #ccfbf1;
  color: #0f766e;
}

#progressContent .stat-icon.tone-slate {
  background: #e2e8f0;
  color: #334155;
}

#progressContent .stat-copy {
  display: grid;
  gap: 0.15rem;
}

#progressContent .stat-label {
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

#progressContent .stat-value {
  color: #0f172a;
  font-size: 1.55rem;
  font-weight: 800;
}

#progressContent .stat-note {
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.45;
}

#progressContent .progress-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

#progressContent .progress-panel {
  padding: 1.1rem 1.15rem;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.07);
}

#progressContent .progress-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

#progressContent .progress-panel-kicker {
  display: block;
  margin-bottom: 0.22rem;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

#progressContent .panel-emphasis {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.38rem 0.72rem;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

#progressContent .progress-panel h5 {
  margin: 0;
  font-size: 1.04rem;
  font-weight: 800;
  color: #111827;
}

#progressContent .progress-summary-list {
  display: grid;
  gap: 0.75rem;
}

#progressContent .progress-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.78rem 0.82rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.82);
  font-size: 0.93rem;
  color: #475569;
}

#progressContent .progress-summary-row--stacked {
  align-items: flex-start;
}

#progressContent .progress-summary-row strong {
  color: #111827;
}

#progressContent .progress-summary-value {
  min-width: 0;
  display: grid;
  gap: 0.24rem;
  justify-items: end;
  text-align: right;
}

#progressContent .progress-summary-value strong {
  line-height: 1.35;
}

#progressContent .progress-summary-value small {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
}

#progressContent .recent-submissions-list {
  display: grid;
  gap: 0.75rem;
}

#progressContent .recent-submission-item {
  display: grid;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
}

#progressContent .recent-submission-copy {
  display: grid;
  gap: 0.2rem;
}

#progressContent .recent-submission-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

#progressContent .recent-submission-score {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: #ecfeff;
  color: #155e75;
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;
}

#progressContent .recent-submission-copy span,
#progressContent .recent-submission-copy small,
#progressContent .recent-submission-metrics span,
#coursesContent .course-meta,
#coursesContent .course-progress-meta span,
#progressContent .course-meta,
#progressContent .course-progress-meta span {
  color: #64748b;
  font-size: 0.88rem;
}

#progressContent .recent-submission-metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

#progressContent .progress-empty-state {
  min-height: 180px;
  display: grid;
  place-items: center;
  gap: 0.4rem;
  padding: 1.4rem;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  text-align: center;
  color: #64748b;
}

#progressContent .progress-empty-state i {
  font-size: 1.3rem;
  color: #1d4ed8;
}

#progressContent .progress-empty-state strong {
  color: #0f172a;
  font-size: 1rem;
}

#progressContent .progress-courses-list,
#coursesContent .courses-list {
  display: grid;
  gap: 0.95rem;
}

#progressContent .course-item,
#coursesContent .course-item {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(240px, 0.95fr);
  align-items: center;
  gap: 1rem 1.2rem;
  padding: 1.05rem 1.15rem;
  border: 1px solid #dbe4ec;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

#progressContent .course-item:hover,
#coursesContent .course-item:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.09);
}

#progressContent .course-info,
#coursesContent .course-info {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

#progressContent .course-info h4,
#coursesContent .course-info h4 {
  margin: 0;
  color: #0f172a;
  font-size: 1.03rem;
  font-weight: 800;
  line-height: 1.35;
}

#progressContent .course-title-row,
#coursesContent .course-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
}

#progressContent .course-title-copy,
#coursesContent .course-title-copy {
  min-width: 0;
  display: grid;
  gap: 0.32rem;
}

#progressContent .course-summary-text,
#coursesContent .course-summary-text {
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.5;
}

#progressContent .course-meta,
#coursesContent .course-meta {
  margin: 0;
}

#progressContent .course-meta:first-of-type,
#coursesContent .course-meta:first-of-type {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 0.38rem 0.78rem;
  border-radius: 999px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 800;
}

#progressContent .course-meta:last-of-type,
#coursesContent .course-meta:last-of-type {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 0.55rem 0.82rem;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px dashed #cbd5e1;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.45;
}

#progressContent .course-progress,
#coursesContent .course-progress {
  display: grid;
  gap: 0.7rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

#progressContent .course-progress-head,
#coursesContent .course-progress-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.85rem;
}

#progressContent .course-progress-copy,
#coursesContent .course-progress-copy {
  min-width: 0;
  display: grid;
  gap: 0.18rem;
}

#progressContent .course-progress-label,
#coursesContent .course-progress-label {
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

#progressContent .course-progress-copy small,
#coursesContent .course-progress-copy small {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
}

#progressContent .course-progress-value,
#coursesContent .course-progress-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 62px;
  min-height: 38px;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  border: 1px solid #0f172a;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.16);
}

#progressContent .progress-bar,
#progressContent .course-progress-bar,
#coursesContent .progress-bar,
#coursesContent .course-progress-bar {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #dbe4ec;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
}

#progressContent .progress-fill,
#coursesContent .progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f766e 0%, #14b8a6 55%, #22d3ee 100%);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.28);
}

#progressContent .course-progress-meta,
#coursesContent .course-progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0;
}

#progressContent .course-progress-meta span,
#coursesContent .course-progress-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.35rem 0.72rem;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 800;
}

@media (max-width: 768px) {
  #progressContent .progress-hero {
    grid-template-columns: 1fr;
    padding: 1.15rem;
  }

  #progressContent .progress-hero-metric {
    justify-items: start;
  }

  #progressContent .progress-hero-track-meta,
  #progressContent .recent-submission-metrics,
  #progressContent .course-progress-meta,
  #coursesContent .course-progress-meta {
    justify-content: flex-start;
  }

  #progressContent .progress-summary-row {
    flex-direction: column;
    align-items: flex-start;
  }

  #progressContent .progress-summary-value {
    justify-items: start;
    text-align: left;
  }

  #progressContent .progress-panel-head {
    flex-direction: column;
    align-items: flex-start;
  }

  #progressContent .course-item,
  #coursesContent .course-item {
    grid-template-columns: 1fr;
  }

  #progressContent .course-title-row,
  #coursesContent .course-title-row,
  #progressContent .course-progress-head,
  #coursesContent .course-progress-head {
    flex-direction: column;
    align-items: flex-start;
  }

}

.users-table-section {
  overflow: hidden;
}

.users-table-section .table-responsive {
  overflow-x: auto !important;
  overflow-y: visible !important;
  max-height: none !important;
  border-radius: 18px;
  box-shadow: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 23, 42, 0.35) transparent;
}

.users-table-section .table-responsive::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.users-table-section .table-responsive::-webkit-scrollbar-track {
  background: transparent;
}

.users-table-section .table-responsive::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.35);
  border-radius: 999px;
}

.users-table-section .table-responsive::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.5);
}

.users-table-section .users-table {
  width: 100% !important;
  min-width: 1120px;
  table-layout: auto !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
}

.users-table-section .users-table thead {
  display: table-header-group !important;
}

.users-table-section .users-table tbody {
  display: table-row-group !important;
  max-height: none !important;
  overflow: visible !important;
}

.users-table-section .users-table tbody tr {
  display: table-row !important;
  width: auto !important;
  table-layout: auto !important;
}

.users-table-section .users-table thead th {
  position: sticky !important;
  top: 0 !important;
  z-index: 2 !important;
}

.users-table-section .table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: nowrap;
  margin-left: auto;
}

.users-table-section .table-search {
  position: relative;
  min-width: 280px;
  flex: 0 1 420px;
  max-width: 420px;
}

.users-table-section .table-search i {
  position: absolute;
  top: 50%;
  left: 0.95rem;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}

.users-table-section .table-search-input {
  width: 100%;
  min-height: 42px;
  padding: 0.7rem 1rem 0.7rem 2.6rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #ffffff;
  color: #111827;
  font-size: 0.92rem;
  font-weight: 300;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.users-table-section .table-search-input:focus {
  outline: none;
  border-color: #374151;
  box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.12);
}

.users-table-section .table-search-input::placeholder {
  color: #9ca3af;
}

.confirm-password-group {
  margin-top: 1rem;
  display: grid;
  gap: 0.45rem;
  text-align: left;
}

.confirm-password-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #374151;
}

.confirm-password-input {
  width: 100%;
  min-height: 44px;
  padding: 0.75rem 0.95rem;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #ffffff;
  color: #111827;
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.confirm-password-input:focus {
  outline: none;
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
}

.sr-only {
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

@media (max-width: 1024px) {
  .users-table-section .table-header {
    gap: 0.9rem;
  }

  .users-table-section .table-actions {
    width: 100%;
    justify-content: stretch;
    flex-wrap: wrap;
    margin-left: 0;
  }

  .users-table-section .table-search {
    flex-basis: 100%;
    max-width: none;
  }
}

@media (max-width: 768px) {
  body.admin-dashboard .pagination-controls {
    display: grid !important;
    grid-template-columns: minmax(88px, 1fr) auto minmax(88px, 1fr) !important;
    align-items: center !important;
    gap: 0.5rem !important;
    width: 100% !important;
    flex-direction: unset !important;
  }

  body.admin-dashboard .pagination-btn.prev {
    justify-self: start !important;
  }

  body.admin-dashboard .pagination-numbers {
    justify-self: center !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-wrap: nowrap !important;
    min-width: 0 !important;
  }

  body.admin-dashboard .pagination-btn.next {
    justify-self: end !important;
  }

  body.admin-dashboard .pagination-btn.prev,
  body.admin-dashboard .pagination-btn.next {
    width: auto !important;
    min-width: 88px;
    flex: 0 0 auto !important;
    white-space: nowrap;
  }

  body.admin-dashboard .pagination-number {
    flex: 0 0 auto;
  }
}

.modal.profile-modal .modal-content.large {
  width: min(1040px, 94vw);
  max-width: 1040px;
  height: min(92vh, 880px);
  max-height: min(92vh, 880px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal.profile-modal .modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 1rem 1.25rem;
}

.modal.profile-modal #profileContent {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.2rem;
}

.modal.profile-modal .modal-actions {
  flex: 0 0 auto;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  z-index: 6;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1.1rem 0.95rem;
}

.modal.progress-modal .modal-content.large {
  width: min(1100px, 95vw);
  max-width: 1100px;
  height: min(92vh, 920px);
  max-height: min(92vh, 920px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal.progress-modal .modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 1rem 1.25rem;
}

.modal.progress-modal #progressContent {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.2rem;
}

.modal.progress-modal .modal-actions {
  flex: 0 0 auto;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  z-index: 6;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 0.75rem 1.1rem 0.95rem;
}

.edit-user-btn,
.edit-user-btn:hover,
.edit-user-btn:focus,
.edit-user-btn:active {
  background: #000000 !important;
  background-image: none !important;
  border-color: #000000 !important;
  color: #ffffff !important;
  box-shadow: none !important;
}

.edit-user-btn i {
  color: #ffffff !important;
}

.send-message-btn,
.send-message-btn i {
  color: #000000 !important;
}

.modal.new-user-modal .modal-content {
  width: min(960px, 94vw);
  max-width: 960px;
  height: min(92vh, 860px);
  max-height: min(92vh, 860px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal.new-user-modal .modal-body {
  flex: 1 1 auto;
  overflow: hidden;
  padding: 1rem 1.25rem;
}

.modal.new-user-modal .user-form {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.modal.new-user-modal .form-tabs {
  flex: 0 0 auto;
}

.modal.new-user-modal .tab-content {
  display: none;
}

.modal.new-user-modal .tab-content.active {
  display: block;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0.2rem;
  padding-bottom: 0.75rem;
}

.modal.new-user-modal .form-actions {
  flex: 0 0 auto;
  margin-top: auto;
  position: sticky;
  bottom: 0;
  z-index: 5;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
}

.new-user-trigger i {
  color: #374151;
  fill: #374151;
  transition: color 0.2s ease, fill 0.2s ease;
}

.new-user-trigger.active i {
  color: #ffffff;
  fill: #ffffff;
}

.new-user-modal .role-option .role-icon,
.new-user-modal .role-option .role-icon i {
  color: #374151;
  fill: #374151;
  transition: color 0.2s ease, fill 0.2s ease, background-color 0.2s ease;
}

.new-user-modal .role-option.selected .role-icon,
.new-user-modal .role-option.selected .role-icon i {
  color: #ffffff !important;
  fill: #ffffff !important;
}

.new-user-modal .role-option .role-check i {
  color: #ffffff !important;
  fill: #ffffff !important;
}

.modal.edit-user-modal .modal-content {
  width: min(900px, 94vw);
  max-width: 900px;
  height: min(94vh, 860px);
  max-height: min(94vh, 860px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal.edit-user-modal .modal-body {
  flex: 1 1 auto;
  overflow: hidden;
  padding: 0.9rem 1.1rem 0.6rem;
}

.modal.edit-user-modal .edit-form {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem 0.95rem;
  align-content: start;
}

.modal.edit-user-modal .form-section {
  margin: 0;
  padding: 0.8rem 0.85rem;
}

.modal.edit-user-modal .form-section-title {
  margin-bottom: 0.55rem;
}

.modal.edit-user-modal .form-group {
  margin-bottom: 0.55rem;
}

.modal.edit-user-modal .form-group:last-child {
  margin-bottom: 0;
}

.modal.edit-user-modal .edit-avatar-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal.edit-user-modal .edit-avatar-preview {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  flex: 0 0 40px;
}

.modal.edit-user-modal .edit-avatar-preview img,
.modal.edit-user-modal .edit-avatar-preview .avatar-placeholder {
  width: 100%;
  height: 100%;
  min-width: 100%;
  min-height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.modal.edit-user-modal .edit-avatar-preview img {
  object-fit: cover;
  object-position: center;
  display: block;
}

.modal.edit-user-modal .edit-avatar-controls {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.modal.edit-user-modal .edit-avatar-controls input[type="file"] {
  font-size: 0.78rem;
}

.modal.edit-user-modal .edit-avatar-controls small {
  font-size: 0.72rem;
  color: #64748b;
}

.modal.edit-user-modal .form-group input,
.modal.edit-user-modal .form-group select {
  min-height: 40px;
}

.modal.edit-user-modal .modal-actions {
  margin-top: auto;
  padding: 0.75rem 1.1rem 0.95rem;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

#profileContent .profile-details--refined {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

#profileContent .profile-details--refined .profile-header {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.05rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 65%, #f1f5f9 100%);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  width: 100%;
  max-width: 100%;
}

#profileContent .profile-details--refined .profile-header .profile-avatar.large {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 999px;
  border: 1px solid #ffffff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}

#profileContent .profile-details--refined .profile-header .profile-avatar.large img,
#profileContent .profile-details--refined .profile-header .profile-avatar.large .avatar-placeholder.large {
  width: 100%;
  height: 100%;
  min-width: 100%;
  min-height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: inherit;
}

#profileContent .profile-details--refined .profile-header .profile-avatar.large .avatar-placeholder.large {
  background: linear-gradient(145deg, #334155, #1e293b);
  color: #f8fafc;
  font-size: 1rem;
  font-weight: 500;
  display: grid;
  place-items: center;
}

#profileContent .profile-details--refined .profile-header .profile-title {
  min-width: 0;
  text-align: left;
  justify-self: start;
}

#profileContent .profile-details--refined .profile-name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 500;
  line-height: 1.2;
  color: #0f172a;
  letter-spacing: -0.01em;
  text-align: left;
}

#profileContent .profile-details--refined .profile-meta-line {
  margin-top: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.84rem;
  line-height: 1;
  justify-content: flex-start;
  flex-wrap: wrap;
}

#profileContent .profile-details--refined .profile-meta-strand {
  color: #1e293b;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  background: #eef2ff;
  border: 1px solid #dbe4ff;
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
}

#profileContent .profile-details--refined .profile-meta-status {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  color: #334155;
  font-weight: 500;
  text-transform: lowercase;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
}

#profileContent .profile-details--refined .profile-meta-status .status-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.16);
}

.status-badge.active {
  background: #ecfdf3 !important;
  color: #166534 !important;
  border-color: #86efac !important;
}

.status-badge.pending {
  background: #fffbeb !important;
  color: #a16207 !important;
  border-color: #fde68a !important;
}

.status-badge.inactive {
  background: #fef2f2 !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
}

#profileContent .profile-details--refined .profile-meta-status.active {
  background: #ecfdf3;
  border-color: #86efac;
  color: #166534;
}

#profileContent .profile-details--refined .profile-meta-status.active .status-dot {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

#profileContent .profile-details--refined .profile-meta-status.pending {
  background: #fffbeb;
  border-color: #fde68a;
  color: #a16207;
}

#profileContent .profile-details--refined .profile-meta-status.pending .status-dot {
  background: #eab308;
  box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.2);
}

#profileContent .profile-details--refined .profile-meta-status.inactive {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

#profileContent .profile-details--refined .profile-meta-status.inactive .status-dot {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

#profileContent .profile-details--refined .profile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.95rem;
}

#profileContent .profile-details--refined .info-section {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

#profileContent .profile-details--refined .info-section h4 {
  margin: 0 0 0.8rem;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid #edf2f7;
}

#profileContent .profile-details--refined .info-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #e2e8f0;
}

#profileContent .profile-details--refined .info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

#profileContent .profile-details--refined .info-label {
  color: #64748b;
  font-weight: 500;
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

#profileContent .profile-details--refined .info-value {
  color: #0f172a;
  font-weight: 500;
  font-size: 0.95rem;
  text-align: right;
}

.modal.profile-modal .modal-header h3 {
  font-weight: 500;
  letter-spacing: 0.01em;
}

#profileContent .profile-details--refined .status-badge {
  font-weight: 500;
}

#profileContent .profile-details--refined .profile-star {
  color: #f59e0b;
  margin-left: 0.25rem;
}

@media (max-width: 900px) {
  .modal.profile-modal .modal-content.large {
    width: min(96vw, 960px);
    height: min(92vh, 860px);
    max-height: min(92vh, 860px);
  }

  .modal.progress-modal .modal-content.large {
    width: min(96vw, 1000px);
    height: min(92vh, 860px);
    max-height: min(92vh, 860px);
  }

  .modal.new-user-modal .modal-content {
    width: 96vw;
    height: min(92vh, 860px);
    max-height: min(92vh, 860px);
  }

  .modal.edit-user-modal .modal-content {
    width: 96vw;
    height: min(94vh, 860px);
    max-height: min(94vh, 860px);
  }

  .modal.edit-user-modal .edit-form {
    grid-template-columns: 1fr;
  }

  #profileContent .profile-details--refined .profile-info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .modal.profile-modal .modal-content.large {
    width: 96vw;
    height: 92vh;
    max-height: 92vh;
  }

  .modal.progress-modal .modal-content.large {
    width: 96vw;
    height: 92vh;
    max-height: 92vh;
  }

  .modal.profile-modal .modal-body {
    padding: 0.85rem 0.9rem;
  }

  .modal.progress-modal .modal-body {
    padding: 0.85rem 0.9rem;
  }

  .modal.profile-modal .modal-actions {
    padding: 0.65rem 0.85rem 0.8rem;
  }

  .modal.progress-modal .modal-actions {
    padding: 0.65rem 0.85rem 0.8rem;
  }

  .modal.new-user-modal .modal-content {
    width: 96vw;
    height: 92vh;
    max-height: 92vh;
  }

  .modal.new-user-modal .modal-body {
    padding: 0.85rem 0.9rem;
  }

  .modal.new-user-modal .tab-content.active {
    padding-bottom: 0.6rem;
  }

  .modal.new-user-modal .form-actions {
    padding-top: 0.65rem;
    padding-bottom: 0.15rem;
  }

  .modal.edit-user-modal .modal-content {
    width: 96vw;
    height: 92vh;
    max-height: 92vh;
  }

  .modal.edit-user-modal .modal-body {
    padding: 0.7rem 0.85rem 0.5rem;
  }

  .modal.edit-user-modal .form-section {
    padding: 0.75rem 0.8rem;
  }

  .modal.edit-user-modal .modal-actions {
    padding: 0.65rem 0.85rem 0.8rem;
  }

  #profileContent .profile-details--refined .profile-header {
    grid-template-columns: 44px minmax(0, 1fr);
    align-items: center;
    max-width: 100%;
    width: 100%;
    padding: 0.8rem 0.85rem;
    gap: 0.75rem;
  }

  #profileContent .profile-details--refined .profile-header .profile-avatar.large {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
  }

  #profileContent .profile-details--refined .profile-name {
    font-size: 1.1rem;
  }

  #profileContent .profile-details--refined .profile-meta-line {
    gap: 0.5rem;
    font-size: 0.8rem;
  }

  #profileContent .profile-details--refined .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  #profileContent .profile-details--refined .info-value {
    text-align: left;
  }
}

</style>
