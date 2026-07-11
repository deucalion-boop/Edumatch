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
      :class="{ urgent: notification.urgent, unread: !notification.isViewed }"
    >
      <div class="user-notification-topline">
        <span class="user-notification-title">{{ notification.title }}</span>
        <span v-if="notification.urgent" class="user-notification-badge">Urgent</span>
      </div>
      <p class="user-notification-subject">{{ notification.subject }}</p>
      <p class="user-notification-preview">{{ notification.preview }}</p>
      <div class="user-notification-meta">
        <span>{{ notification.senderName || 'Admin' }}</span>
        <span>{{ formatTimestamp(notification.createdAt) }}</span>
      </div>
    </article>
  </div>
</template>

<script setup>
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
