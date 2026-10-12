const { createHash } = require('node:crypto');
const { getSupabaseStorageClient } = require('../services/supabaseStorageService');
const { upsertNotifications } = require('../services/supabaseNotificationService');
const { sendSuccess } = require('../utils/responseHelper');

const ALLOWED_ROLES = ['student', 'teacher', 'headteacher'];
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const fail = (message, statusCode) => Object.assign(new Error(message), { statusCode });

function cleanRoles(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((role) => String(role || '').trim().toLowerCase()))]
    .filter((role) => ALLOWED_ROLES.includes(role));
}

function mapAnnouncement(row) {
  return {
    id: row.id,
    eventKey: row.event_key,
    title: row.title,
    content: row.content,
    audienceRoles: row.audience_roles || [],
    senderName: row.sender_name,
    urgent: row.urgent === true,
    recipientCount: Number(row.recipient_count || 0),
    createdAt: row.created_at,
  };
}

async function deliver(row, recipients, senderId) {
  await upsertNotifications(recipients.map((recipient) => ({
    recipientId: recipient.id, recipientRole: recipient.role, senderId,
    senderRole: 'admin', senderName: row.sender_name, type: 'announcement_published', title: row.title,
    message: row.content, subject: 'School announcement', preview: row.content, urgent: row.urgent === true,
    eventKey: row.event_key,
    meta: { contentType: 'School Announcement', content: row.content, audienceRoles: row.audience_roles,
      source: 'school', route: `/${recipient.role}/announcements?event=${encodeURIComponent(row.event_key)}` },
  })));
}

async function activeRecipients(roles) {
  const client = getSupabaseStorageClient();
  const recipients = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await client.from('users').select('id,role,status,archive')
      .in('role', roles).eq('status', 'active').range(start, start + 999);
    if (error) throw fail('Unable to load announcement recipients', 500);
    const page = (data || []).filter((row) => row.archive?.isArchived !== true);
    recipients.push(...page);
    if ((data || []).length < 1000) break;
  }
  return recipients;
}

exports.publishSchoolAnnouncement = wrap(async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  const audienceRoles = cleanRoles(req.body.audienceRoles);
  const requestId = typeof req.body.requestId === 'string' ? req.body.requestId.trim() : '';
  const urgent = req.body.urgent === true;
  if (!title || title.length > 200 || !content || content.length > 5000) {
    throw fail('A title (1-200 characters) and message (1-5000 characters) are required.', 400);
  }
  if (!audienceRoles.length || audienceRoles.length !== new Set(req.body.audienceRoles || []).size) {
    throw fail('Select at least one valid audience.', 400);
  }
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) throw fail('A valid request ID is required.', 400);

  const client = getSupabaseStorageClient();
  const eventKey = 'school-announcement:' + createHash('sha256')
    .update(JSON.stringify([String(req.user._id), requestId])).digest('hex');
  const { data: existing, error: lookupError } = await client.from('school_announcements').select('*')
    .eq('event_key', eventKey).maybeSingle();
  if (lookupError) throw fail('Unable to check announcement status', 500);
  if (existing) {
    const same = existing.title === title && existing.content === content && existing.urgent === urgent
      && JSON.stringify([...(existing.audience_roles || [])].sort()) === JSON.stringify([...audienceRoles].sort());
    if (!same) throw fail('This request ID was already used for a different announcement.', 409);
    const { data: snapshot, error: snapshotError } = await client.from('users').select('id,role')
      .in('id', existing.recipient_ids || []);
    if (snapshotError) throw fail('Unable to resume announcement delivery', 500);
    await deliver(existing, snapshot || [], req.user._id);
    return sendSuccess(res, 200, 'Announcement already posted', {
      announcement: mapAnnouncement(existing), recipientCount: Number(existing.recipient_count || 0),
    });
  }

  const recipients = await activeRecipients(audienceRoles);
  const senderName = String(req.user.name || req.user.username || 'EduMatch Administrator').trim().slice(0, 120);
  const row = {
    event_key: eventKey, request_id: requestId, sender_id: String(req.user._id), sender_name: senderName,
    title, content, audience_roles: audienceRoles, urgent, recipient_count: recipients.length,
    recipient_ids: recipients.map((recipient) => recipient.id),
  };
  const { data: saved, error: saveError } = await client.from('school_announcements').insert(row).select('*').single();
  if (saveError) throw fail('Unable to save announcement', 500);

  await deliver(saved, recipients, req.user._id);
  return sendSuccess(res, 201, 'Announcement posted', {
    announcement: mapAnnouncement(saved), recipientCount: recipients.length,
  });
});

exports.listSchoolAnnouncements = wrap(async (_req, res) => {
  const { data, error } = await getSupabaseStorageClient().from('school_announcements').select('*')
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw fail('Unable to load announcements', 500);
  return sendSuccess(res, 200, 'Announcements loaded', { announcements: (data || []).map(mapAnnouncement) });
});
