const Notification = require('../models/Notification');
const { sendSuccess } = require('../utils/responseHelper');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function normalizeNotification(notification) {
  return {
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    subject: notification.subject,
    preview: notification.preview,
    senderName: notification.senderName,
    senderRole: notification.senderRole,
    urgent: notification.urgent === true,
    isViewed: notification.isViewed === true,
    viewedAt: notification.viewedAt || null,
    createdAt: notification.createdAt || null,
    messageId: notification.messageId || null,
  };
}

const getMyNotifications = asyncHandler(async (req, res) => {
  const requestedLimit = Number(req.query.limit || 10);
  const limit = Math.min(50, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 10));
  const recipientId = req.user._id;
  const recipientRole = String(req.user.role || '').trim().toLowerCase();

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({
      recipientId,
      recipientRole,
    })
      .sort({ urgent: -1, createdAt: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({
      recipientId,
      recipientRole,
      isViewed: false,
    }),
  ]);

  return sendSuccess(res, 200, 'Notifications fetched successfully', {
    notifications: notifications.map(normalizeNotification),
    unreadCount,
  });
});

const markAllNotificationsViewed = asyncHandler(async (req, res) => {
  const recipientId = req.user._id;
  const recipientRole = String(req.user.role || '').trim().toLowerCase();
  const now = new Date();

  await Notification.updateMany(
    {
      recipientId,
      recipientRole,
      isViewed: false,
    },
    {
      $set: {
        isViewed: true,
        viewedAt: now,
      },
    }
  );

  return sendSuccess(res, 200, 'Notifications marked as viewed', {
    unreadCount: 0,
  });
});

const markNotificationViewed = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipientId: req.user._id,
      recipientRole: String(req.user.role || '').trim().toLowerCase(),
    },
    {
      $set: {
        isViewed: true,
        viewedAt: new Date(),
      },
    },
    {
      new: true,
    }
  ).lean();

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  return sendSuccess(res, 200, 'Notification marked as viewed', {
    notification: normalizeNotification(notification),
  });
});

const clearAllNotifications = asyncHandler(async (req, res) => {
  const recipientId = req.user._id;
  const recipientRole = String(req.user.role || '').trim().toLowerCase();

  const result = await Notification.deleteMany({
    recipientId,
    recipientRole,
  });

  return sendSuccess(res, 200, 'Notifications cleared successfully', {
    deletedCount: Number(result?.deletedCount || 0),
    unreadCount: 0,
  });
});

module.exports = {
  getMyNotifications,
  markAllNotificationsViewed,
  markNotificationViewed,
  clearAllNotifications,
};
