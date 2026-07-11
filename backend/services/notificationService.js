const AdminMessage = require('../models/AdminMessage');
const Notification = require('../models/Notification');

function buildMessagePreview(content, maxLength = 120) {
  const normalized = String(content || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

async function createAdminMessageNotification({
  sender,
  recipient,
  subject,
  content,
  urgent = false,
}) {
  const preview = buildMessagePreview(content);
  const senderName = String(sender?.name || sender?.username || 'Admin').trim() || 'Admin';

  const messageRecord = await AdminMessage.create({
    senderId: sender?._id,
    senderRole: String(sender?.role || 'admin').trim().toLowerCase(),
    senderName,
    recipientId: recipient?._id,
    recipientRole: String(recipient?.role || '').trim().toLowerCase(),
    subject: String(subject || '').trim(),
    content: String(content || '').trim(),
    preview,
    urgent: urgent === true,
  });

  const notificationRecord = await Notification.create({
    recipientId: recipient?._id,
    recipientRole: String(recipient?.role || '').trim().toLowerCase(),
    senderId: sender?._id || null,
    senderRole: String(sender?.role || 'admin').trim().toLowerCase(),
    senderName,
    type: 'admin_message',
    title: urgent ? 'Urgent message from Admin' : 'New message from Admin',
    message: `${senderName}: ${String(subject || '').trim()}`,
    subject: String(subject || '').trim(),
    preview,
    urgent: urgent === true,
    isViewed: false,
    viewedAt: null,
    messageId: messageRecord._id,
    meta: {
      source: 'admin_messaging_modal',
    },
  });

  return {
    messageRecord,
    notificationRecord,
  };
}

module.exports = {
  buildMessagePreview,
  createAdminMessageNotification,
};
