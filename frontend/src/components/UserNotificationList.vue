<template>
  <div v-if="loading && notifications.length === 0" class="user-notification-state">
    <i class="fas fa-spinner fa-spin"></i>
    <p>Loading notifications...</p>
  </div>
  <div v-else-if="notifications.length === 0" class="user-notification-state">
    <i class="fas fa-bell-slash"></i>
    <p>{{ emptyText }}</p>
    <span class="empty-subtext">You're all caught up.</span>
  </div>
  <div v-else class="user-notification-list">
    <article
      v-for="notification in notifications"
      :key="notification.id"
      class="user-notification-item"
      :class="{ urgent: notification.urgent, unread: !notification.isViewed, clickable: isClickable(notification) }"
      :role="isClickable(notification) ? 'button' : undefined"
      :tabindex="isClickable(notification) ? 0 : undefined"
      @click="selectNotification(notification)"
      @keydown.enter.prevent="selectNotification(notification)"
      @keydown.space.prevent="selectNotification(notification)"
    >
      <div class="user-notification-layout">
        <span class="user-notification-icon" aria-hidden="true">
          <i :class="notificationIcon(notification.type)"></i>
        </span>
        <div class="user-notification-content">
          <div class="user-notification-topline">
            <span class="user-notification-title">{{ notification.title }}</span>
            <span v-if="notification.urgent" class="user-notification-badge">Urgent</span>
          </div>
          <p class="user-notification-subject">{{ notification.subject }}</p>
          <p class="user-notification-preview">{{ notification.preview }}</p>
          <div class="user-notification-meta">
            <span>{{ notification.senderName || 'EduMatch' }}</span>
            <span>{{ formatTimestamp(notification.createdAt) }}</span>
          </div>
        </div>
        <i v-if="isClickable(notification)" class="fas fa-chevron-right user-notification-chevron" aria-hidden="true"></i>
      </div>
    </article>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  notifications: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: 'No notifications',
  },
})

const emit = defineEmits(['select'])

const ICONS_BY_TYPE = {
  lesson_published: 'fas fa-book-open',
  activity_assigned: 'fas fa-tasks',
  assessment_assigned: 'fas fa-clipboard-list',
  deadline_upcoming: 'fas fa-clock',
  activity_submitted: 'fas fa-circle-check',
  assessment_submitted: 'fas fa-circle-check',
  grade_released: 'fas fa-chart-line',
  grade_updated: 'fas fa-chart-line',
  teacher_feedback: 'fas fa-comment-dots',
  recommendation_ready: 'fas fa-compass',
  recommendation_progress: 'fas fa-route',
  admin_message: 'fas fa-bullhorn',
  management_message: 'fas fa-bullhorn',
  enrollment_request: 'fas fa-user-plus',
  student_submission: 'fas fa-file-alt',
  grading_queue: 'fas fa-marker',
  deadline_missed: 'fas fa-calendar-times',
  deadline_upcoming_teacher: 'fas fa-calendar-day',
  exam_incident: 'fas fa-triangle-exclamation',
}

function notificationIcon(type) {
  return ICONS_BY_TYPE[String(type || '').toLowerCase()] || 'fas fa-bell'
}

function isClickable(notification) {
  const route = String(notification?.meta?.route || '')
  return route.startsWith('/student/') || route.startsWith('/teacher/')
}

function selectNotification(notification) {
  if (!isClickable(notification)) return
  emit('select', notification)
  router.push(String(notification.meta.route)).catch(() => {})
}

function formatTimestamp(value) {
  if (!value) return 'Just now'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Just now'

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.user-notification-state {
  padding: 1rem;
  text-align: center;
  color: #64748b;
}

.user-notification-state i {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.user-notification-state p {
  margin: 0;
  font-weight: 600;
}

.user-notification-list {
  display: grid;
  gap: 0.85rem;
}

.user-notification-item {
  border: 1px solid #d8e1ef;
  border-radius: 18px;
  padding: 1rem 1.05rem 0.95rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.user-notification-item.unread {
  border-color: #cfd9ea;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.user-notification-item.urgent {
  border-color: #f3c37a;
  background: linear-gradient(180deg, #fffaf0 0%, #fff6e8 100%);
}

.user-notification-item.clickable {
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.user-notification-item.clickable:hover,
.user-notification-item.clickable:focus-visible {
  border-color: #93c5fd;
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.11);
  outline: none;
  transform: translateY(-1px);
}

.user-notification-layout {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: flex-start;
}

.user-notification-content {
  min-width: 0;
}

.user-notification-icon {
  width: 2.15rem;
  height: 2.15rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eaf2ff;
  color: #2563eb;
}

.user-notification-item.urgent .user-notification-icon {
  background: #ffedd5;
  color: #b45309;
}

.user-notification-chevron {
  align-self: center;
  color: #94a3b8;
  font-size: 0.75rem;
}

.user-notification-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-notification-title,
.user-notification-subject {
  margin: 0;
  color: #0f172a;
  white-space: normal;
  word-break: break-word;
}

.user-notification-title {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.user-notification-subject {
  margin-top: 0.55rem;
  font-size: 0.96rem;
  font-weight: 700;
}

.user-notification-preview {
  margin: 0.45rem 0 0;
  color: #475569;
  line-height: 1.55;
  font-size: 0.92rem;
  white-space: normal;
  word-break: break-word;
}

.user-notification-meta {
  margin-top: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  color: #6b7a90;
  font-size: 0.82rem;
}

.user-notification-badge {
  background: #b45309;
  color: #fff;
  border-radius: 999px;
  padding: 0.22rem 0.62rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
