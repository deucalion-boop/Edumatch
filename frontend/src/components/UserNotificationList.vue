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
          <span v-if="showReadActions" class="user-notification-meta">{{ notification.meta?.contentType || notification.type.replaceAll('_', ' ') }} &middot; {{ notification.isViewed ? 'Read' : 'Unread' }}</span>
          <p class="user-notification-subject">{{ notification.subject }}</p>
          <p class="user-notification-preview">{{ notification.preview }}</p>
          <button v-if="showReadActions && !notification.isViewed" type="button" class="notification-read-action" @click.stop="emit('mark-read', notification)" @keydown.stop>Mark as Read</button>
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
  manualNavigation: Boolean,
  showReadActions: Boolean,
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

const emit = defineEmits(['select', 'mark-read'])

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
  const route = resolveNotificationRoute(notification)
  return route.startsWith('/student/') || route.startsWith('/teacher/')
}

function resolveNotificationRoute(notification) {
  const route = String(notification?.meta?.route || '')
  const entityId = String(notification?.meta?.entityId || '').trim()
  if (notification?.type === 'enrollment_request' && route === '/teacher/students' && entityId) {
    return `/teacher/students?request=${encodeURIComponent(entityId)}`
  }
  return route
}

function selectNotification(notification) {
  if (!isClickable(notification)) return
  emit('select', notification)
  if (!props.manualNavigation) router.push(resolveNotificationRoute(notification)).catch(() => {})
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
@reference "../styles/tailwind.css";
.notification-read-action { @apply tw:[margin-top:.6rem]; @apply tw:[border:1px_solid_#cbd5e1]; @apply tw:[border-radius:6px]; @apply tw:[padding:.3rem_.6rem]; @apply tw:[background:white]; @apply tw:[color:#2563eb]; @apply tw:cursor-pointer; }
.user-notification-state {
  @apply tw:[padding:1rem];
  @apply tw:text-center;
  @apply tw:[color:#64748b];
}

.user-notification-state i {
  @apply tw:[font-size:1.1rem];
  @apply tw:[margin-bottom:0.5rem];
}

.user-notification-state p {
  @apply tw:[margin:0];
  @apply tw:[font-weight:600];
}

.user-notification-list {
  @apply tw:grid;
  @apply tw:[gap:0.85rem];
}

.user-notification-item {
  @apply tw:[border:1px_solid_#d8e1ef];
  @apply tw:[border-radius:18px];
  @apply tw:[padding:1rem_1.05rem_0.95rem];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.9)];
}

.user-notification-item.unread {
  @apply tw:[box-shadow:0_10px_24px_rgba(15,_23,_42,_0.06)];
}

.user-notification-item.urgent {
  @apply tw:[border-color:#f3c37a];
  @apply tw:[background:linear-gradient(180deg,_#fffaf0_0%,_#fff6e8_100%)];
}

.user-notification-item.clickable {
  @apply tw:cursor-pointer;
  @apply tw:[transition:border-color_0.2s_ease,_box-shadow_0.2s_ease,_transform_0.2s_ease];
}

.user-notification-item.clickable:hover,
.user-notification-item.clickable:focus-visible {
  @apply tw:[border-color:#93c5fd];
  @apply tw:[box-shadow:0_12px_28px_rgba(37,_99,_235,_0.11)];
  @apply tw:[outline:none];
  @apply tw:[transform:translateY(-1px)];
}

.user-notification-layout {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto];
  @apply tw:[gap:0.75rem];
  @apply tw:items-start;
}

.user-notification-content {
  @apply tw:[min-width:0];
}

.user-notification-icon {
  @apply tw:[width:2.15rem];
  @apply tw:[height:2.15rem];
  @apply tw:[border-radius:0.75rem];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:#eaf2ff];
  @apply tw:[color:#2563eb];
}

.user-notification-item.urgent .user-notification-icon {
  @apply tw:[background:#ffedd5];
  @apply tw:[color:#b45309];
}

.user-notification-icon .fa-book-open,
.user-notification-icon .fa-book-open::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.user-notification-chevron {
  @apply tw:self-center;
  @apply tw:[color:#94a3b8];
  @apply tw:[font-size:0.75rem];
}

.user-notification-topline {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-wrap;
}

.user-notification-title,
.user-notification-subject {
  @apply tw:[margin:0];
  @apply tw:[color:#0f172a];
  @apply tw:whitespace-normal;
  @apply tw:[word-break:break-word];
}

.user-notification-title {
  @apply tw:[font-size:0.92rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:-0.01em];
}

.user-notification-subject {
  @apply tw:[margin-top:0.55rem];
  @apply tw:[font-size:0.96rem];
  @apply tw:[font-weight:700];
}

.user-notification-preview {
  @apply tw:[margin:0.45rem_0_0];
  @apply tw:[color:#475569];
  @apply tw:[line-height:1.55];
  @apply tw:[font-size:0.92rem];
  @apply tw:whitespace-normal;
  @apply tw:[word-break:break-word];
}

.user-notification-meta {
  @apply tw:[margin-top:0.9rem];
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:0.75rem];
  @apply tw:flex-wrap;
  @apply tw:[color:#6b7a90];
  @apply tw:[font-size:0.82rem];
}

.user-notification-badge {
  @apply tw:[background:#b45309];
  @apply tw:[color:#fff];
  @apply tw:[border-radius:999px];
  @apply tw:[padding:0.22rem_0.62rem];
  @apply tw:[font-size:0.68rem];
  @apply tw:[font-weight:700];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.04em];
}

</style>
