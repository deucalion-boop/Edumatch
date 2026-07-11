require('dotenv').config({ path: ['.env.local', '.env'] });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { connectDatabase } = require('./config/database');
const User = require('./models/User');
const Lesson = require('./models/Lesson');
const Assessment = require('./models/Assessment');
const Submission = require('./models/Submission');
const Settings = require('./models/Settings');
const Subject = require('./models/Subject');
const UserModel = require('./models/User');
const SubjectEnrollment = require('./models/SubjectEnrollment');
const Attendance = require('./models/Attendance');
const Section = require('./models/Section');
const Notification = require('./models/Notification');
const Recommendation = require('./models/Recommendation');
const AdminMessage = require('./models/AdminMessage');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const headteacherRoutes = require('./routes/headteacherRoutes');
const secretaryRoutes = require('./routes/secretaryRoutes');
const storageRoutes = require('./routes/storageRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogMiddleware = require('./middlewares/auditLogMiddleware');
const { notFoundMiddleware, errorMiddleware } = require('./middlewares/errorMiddleware');
const { validateMailApiEnvironment } = require('./services/gmailService');
const { ensureDefaultSections } = require('./services/sectionService');
const { isSupabaseStorageConfigured, getSupabaseStorageConfig } = require('./services/supabaseStorageService');

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_ADMIN_NAME = String(process.env.ADMIN_NAME || 'EduMatch Administrator').trim() || 'EduMatch Administrator';
const DEFAULT_ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || 'admin@edumatch.local').trim().toLowerCase() || 'admin@edumatch.local';
const DEFAULT_ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || 'admin').trim() || 'admin';
const DEFAULT_ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || 'Admin123!').trim() || 'Admin123!';
const uploadsDir = path.resolve(__dirname, 'uploads');
const supabaseOrigin = (() => {
  try {
    const configuredUrl = String(process.env.SUPABASE_URL || '').trim();
    return configuredUrl ? new URL(configuredUrl).origin : '';
  } catch (_error) {
    return '';
  }
})();
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      imgSrc: ["'self'", 'data:', 'blob:', ...(supabaseOrigin ? [supabaseOrigin] : [])],
      mediaSrc: ["'self'", 'data:', 'blob:', ...(supabaseOrigin ? [supabaseOrigin] : [])],
      connectSrc: ["'self'", ...(supabaseOrigin ? [supabaseOrigin] : [])],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api', apiLimiter);
app.use('/api', auditLogMiddleware);
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'EduMatch backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/headteacher', headteacherRoutes);
app.use('/api/secretary', secretaryRoutes);
app.use('/api/recommendation', recommendationRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

function dedupeIdsByCreatedAt(entries) {
  const sorted = [...entries].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  const keeper = sorted[0];
  const duplicates = sorted.slice(1);
  return { keeper, duplicates };
}

async function cleanupDuplicateData() {
  console.log('[CLEANUP] Checking for duplicate records...');

  const duplicateUsersByEmail = await User.aggregate([
    {
      $project: {
        emailKey: { $toLower: { $trim: { input: '$email' } } },
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: '$emailKey',
        count: { $sum: 1 },
        docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
      },
    },
    { $match: { _id: { $ne: '' }, count: { $gt: 1 } } },
  ]);

  for (const group of duplicateUsersByEmail) {
    const { keeper, duplicates } = dedupeIdsByCreatedAt(group.docs);
    const duplicateIds = duplicates.map((doc) => doc._id);
    if (duplicateIds.length === 0) continue;

    await Promise.all([
      Lesson.updateMany({ createdBy: { $in: duplicateIds } }, { $set: { createdBy: keeper._id } }),
      Assessment.updateMany({ createdBy: { $in: duplicateIds } }, { $set: { createdBy: keeper._id } }),
      Submission.updateMany({ studentId: { $in: duplicateIds } }, { $set: { studentId: keeper._id } }),
      User.updateMany({ 'enrollment.teacherId': { $in: duplicateIds } }, { $set: { 'enrollment.teacherId': keeper._id } }),
      User.deleteMany({ _id: { $in: duplicateIds } }),
    ]);
  }

  const duplicateLessons = await Lesson.aggregate([
    {
      $project: {
        createdBy: 1,
        createdAt: 1,
        titleKey: { $toLower: { $trim: { input: '$title' } } },
        trackKey: { $toLower: { $trim: { input: '$track' } } },
      },
    },
    {
      $group: {
        _id: {
          createdBy: '$createdBy',
          titleKey: '$titleKey',
          trackKey: '$trackKey',
        },
        count: { $sum: 1 },
        docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  for (const group of duplicateLessons) {
    const { keeper, duplicates } = dedupeIdsByCreatedAt(group.docs);
    const duplicateIds = duplicates.map((doc) => doc._id);
    if (duplicateIds.length === 0) continue;
    await Assessment.updateMany({ lessonId: { $in: duplicateIds } }, { $set: { lessonId: keeper._id } });
    await Lesson.deleteMany({ _id: { $in: duplicateIds } });
  }

  const duplicateAssessments = await Assessment.aggregate([
    {
      $project: {
        createdAt: 1,
        createdBy: 1,
        lessonId: 1,
        examTypeKey: { $toLower: { $trim: { input: '$examType' } } },
        titleKey: { $toLower: { $trim: { input: '$title' } } },
      },
    },
    {
      $group: {
        _id: {
          createdBy: '$createdBy',
          lessonId: '$lessonId',
          examTypeKey: '$examTypeKey',
          titleKey: '$titleKey',
        },
        count: { $sum: 1 },
        docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  for (const group of duplicateAssessments) {
    const { keeper, duplicates } = dedupeIdsByCreatedAt(group.docs);
    const duplicateIds = duplicates.map((doc) => doc._id);
    if (duplicateIds.length === 0) continue;
    await Submission.deleteMany({ assessmentId: { $in: duplicateIds } });
    await Assessment.deleteMany({ _id: { $in: duplicateIds } });
  }

  const duplicateSubmissions = await Submission.aggregate([
    {
      $group: {
        _id: {
          studentId: '$studentId',
          assessmentId: '$assessmentId',
        },
        count: { $sum: 1 },
        docs: { $push: { _id: '$_id', createdAt: '$createdAt', submittedAt: '$submittedAt' } },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  for (const group of duplicateSubmissions) {
    const sorted = [...group.docs].sort(
      (a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime()
    );
    const duplicateIds = sorted.slice(1).map((doc) => doc._id);
    if (duplicateIds.length > 0) {
      await Submission.deleteMany({ _id: { $in: duplicateIds } });
    }
  }

  console.log('[CLEANUP] Duplicate cleanup completed.');
}

async function ensureDefaultAdminAccount() {
  const adminByEmail = await User.findOne({ email: DEFAULT_ADMIN_EMAIL }).select('+password');
  if (adminByEmail) {
    adminByEmail.role = 'admin';
    adminByEmail.status = 'active';
    adminByEmail.username = DEFAULT_ADMIN_USERNAME;
    adminByEmail.password = DEFAULT_ADMIN_PASSWORD;
    if (!String(adminByEmail.name || '').trim()) {
      adminByEmail.name = DEFAULT_ADMIN_NAME;
    }
    await adminByEmail.save();

    console.log(`[BOOTSTRAP] Default admin normalized: ${DEFAULT_ADMIN_EMAIL}`);
    return;
  }

  const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).select('+password');

  if (adminUser) {
    adminUser.email = DEFAULT_ADMIN_EMAIL;
    adminUser.username = DEFAULT_ADMIN_USERNAME;
    adminUser.password = DEFAULT_ADMIN_PASSWORD;
    adminUser.status = 'active';
    if (!String(adminUser.name || '').trim()) {
      adminUser.name = DEFAULT_ADMIN_NAME;
    }
    await adminUser.save();

    console.log(`[BOOTSTRAP] Default admin updated: ${DEFAULT_ADMIN_EMAIL}`);
    return;
  }

  await User.create({
    name: DEFAULT_ADMIN_NAME,
    email: DEFAULT_ADMIN_EMAIL,
    username: DEFAULT_ADMIN_USERNAME,
    password: DEFAULT_ADMIN_PASSWORD,
    role: 'admin',
    status: 'active',
  });

  console.log(`[BOOTSTRAP] Default admin created: ${DEFAULT_ADMIN_EMAIL}`);
}

async function cleanupLegacyAiSettingsFields() {
  const result = await Settings.updateMany(
    {
      $or: [
        { aiGeneratorEnabled: { $exists: true } },
        { aiConfig: { $exists: true } },
        { openaiApiKey: { $exists: true } },
        { openaiModel: { $exists: true } },
        { 'aiConfig.provider': { $exists: true } },
        { 'aiConfig.model': { $exists: true } },
        { 'aiConfig.baseUrl': { $exists: true } },
        { 'aiConfig.apiKeyEncrypted': { $exists: true } },
      ],
    },
    {
      $unset: {
        aiGeneratorEnabled: '',
        aiConfig: '',
        openaiApiKey: '',
        openaiModel: '',
        'aiConfig.provider': '',
        'aiConfig.model': '',
        'aiConfig.baseUrl': '',
        'aiConfig.apiKeyEncrypted': '',
      },
    }
  );

  const modifiedCount = Number(result?.modifiedCount || 0);
  if (modifiedCount > 0) {
    console.log(`[CLEANUP] Removed legacy AI fields from ${modifiedCount} settings document(s).`);
  } else {
    console.log('[CLEANUP] No legacy AI fields found in settings.');
  }
}

async function normalizeLegacyAttendanceScopes() {
  const result = await Attendance.updateMany(
    {
      attendanceScope: { $exists: false },
    },
    {
      $set: {
        attendanceScope: 'handled_class',
      },
    }
  );

  const modifiedCount = Number(result?.modifiedCount || 0);
  if (modifiedCount > 0) {
    console.log(`[CLEANUP] Normalized attendance scope for ${modifiedCount} legacy attendance record(s).`);
  }
}

async function listCollectionIndexes(model) {
  try {
    return await model.collection.indexes();
  } catch (error) {
    if (error?.code === 26 || /ns not found/i.test(String(error?.message || ''))) {
      return [];
    }
    throw error;
  }
}

async function dropIndexIfConflicting(model, indexName, isExpectedDefinition) {
  const indexes = await listCollectionIndexes(model);
  const existingIndex = indexes.find((index) => index?.name === indexName);
  if (!existingIndex) return;
  if (isExpectedDefinition(existingIndex)) return;

  await model.collection.dropIndex(indexName);
  console.log(`[BOOTSTRAP] Dropped stale ${model.modelName}.${indexName} index so the updated definition can be applied.`);
}

async function reconcileCriticalIndexes() {
  await dropIndexIfConflicting(
    UserModel,
    'advisorySectionId_1',
    (index) => index?.key?.advisorySectionId === 1
      && index?.unique === true
      && index?.partialFilterExpression?.advisorySectionId?.$exists === true
  );

  await dropIndexIfConflicting(
    Section,
    'name_1',
    (index) => index?.key?.name === 1 && index?.unique === true
  );
}

async function syncApplicationIndexes() {
  const indexedModels = [
    Settings,
    UserModel,
    Lesson,
    Assessment,
    Submission,
    Subject,
    SubjectEnrollment,
    Attendance,
    Section,
    Notification,
    Recommendation,
    AdminMessage,
  ];

  for (const model of indexedModels) {
    await model.syncIndexes();
  }

  console.log('[BOOTSTRAP] Application indexes synced.');
}

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in .env');
  }

  console.log(`[ENV] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log(`[ENV] PORT=${PORT}`);
  console.log(`[ENV] MONGODB_URI_SET=${Boolean(process.env.MONGODB_URI)}`);
  const mailValidation = validateMailApiEnvironment();
  if (!mailValidation.ok) {
    console.warn(`[MAIL] ${mailValidation.reason}`);
  } else {
    console.log(`[MAIL] API endpoint configured: ${mailValidation.mailApiUrl}`);
  }
  if (isSupabaseStorageConfigured()) {
    const storageConfig = getSupabaseStorageConfig();
    console.log(`[STORAGE] Using Supabase Storage bucket "${storageConfig.bucket}" (${storageConfig.bucketPublic ? 'public' : 'private'}).`);
  } else {
    console.log('[STORAGE] Using local uploads in backend/uploads.');
  }

  await connectDatabase();
  await reconcileCriticalIndexes();
  await cleanupDuplicateData();
  await cleanupLegacyAiSettingsFields();
  await normalizeLegacyAttendanceScopes();
  await syncApplicationIndexes();
  await ensureDefaultAdminAccount();
  await ensureDefaultSections();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
