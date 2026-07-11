require('dotenv').config();

const { connectDatabase } = require('../config/database');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Lesson = require('../models/Lesson');
const Assessment = require('../models/Assessment');
const Submission = require('../models/Submission');
const SubjectEnrollment = require('../models/SubjectEnrollment');
const Recommendation = require('../models/Recommendation');
const Notification = require('../models/Notification');
const AdminMessage = require('../models/AdminMessage');
const Settings = require('../models/Settings');

async function upsertUser({ email, ...fields }) {
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    user = new User({ email });
  }

  Object.assign(user, fields, { email });
  await user.save();
  return user;
}

async function upsertSubject({ code, ...fields }) {
  const subject =
    (await Subject.findOne({ code })) ||
    new Subject({
      code,
    });

  Object.assign(subject, fields, { code });
  await subject.save();
  return subject;
}

async function upsertLesson({ subjectId, title, ...fields }) {
  const lesson =
    (await Lesson.findOne({ subjectId, title })) ||
    new Lesson({
      subjectId,
      title,
    });

  Object.assign(lesson, fields, { subjectId, title });
  await lesson.save();
  return lesson;
}

async function upsertAssessment({ lessonId, title, ...fields }) {
  const assessment =
    (await Assessment.findOne({ lessonId, title })) ||
    new Assessment({
      lessonId,
      title,
    });

  Object.assign(assessment, fields, { lessonId, title });
  await assessment.save();
  return assessment;
}

async function upsertSubmission({ studentId, assessmentId, ...fields }) {
  const submission =
    (await Submission.findOne({ studentId, assessmentId })) ||
    new Submission({
      studentId,
      assessmentId,
    });

  Object.assign(submission, fields, { studentId, assessmentId });
  await submission.save();
  return submission;
}

async function upsertEnrollment({ subjectId, studentId, ...fields }) {
  const enrollment =
    (await SubjectEnrollment.findOne({ subjectId, studentId })) ||
    new SubjectEnrollment({
      subjectId,
      studentId,
    });

  Object.assign(enrollment, fields, { subjectId, studentId });
  await enrollment.save();
  return enrollment;
}

async function upsertRecommendation({ studentId, ...fields }) {
  const recommendation =
    (await Recommendation.findOne({ studentId })) ||
    new Recommendation({
      studentId,
    });

  Object.assign(recommendation, fields, { studentId });
  await recommendation.save();
  return recommendation;
}

async function upsertSettings({ key, ...fields }) {
  const settings =
    (await Settings.findOne({ key })) ||
    new Settings({
      key,
    });

  Object.assign(settings, fields, { key });
  await settings.save();
  return settings;
}

async function upsertAdminMessage({ senderId, recipientId, subject, ...fields }) {
  const adminMessage =
    (await AdminMessage.findOne({ senderId, recipientId, subject })) ||
    new AdminMessage({
      senderId,
      recipientId,
      subject,
    });

  Object.assign(adminMessage, fields, { senderId, recipientId, subject });
  await adminMessage.save();
  return adminMessage;
}

async function upsertNotification({ recipientId, title, type, ...fields }) {
  const notification =
    (await Notification.findOne({ recipientId, title, type })) ||
    new Notification({
      recipientId,
      title,
      type,
    });

  Object.assign(notification, fields, { recipientId, title, type });
  await notification.save();
  return notification;
}

async function seed() {
  await connectDatabase();

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const admin = await upsertUser({
    name: 'System Admin Sample',
    email: 'sample.admin@edumatch.local',
    username: 'sampleadmin',
    password: 'Sample123',
    role: 'admin',
    status: 'active',
    contactNumber: '09170000001',
  });

  const secretary = await upsertUser({
    name: 'Registrar Secretary Sample',
    email: 'sample.secretary@edumatch.local',
    username: 'samplesecretary',
    password: 'Sample123',
    role: 'secretary',
    status: 'active',
    managedBy: admin._id,
    contactNumber: '09170000002',
  });

  const headTeacher = await upsertUser({
    name: 'Head Teacher Sample',
    email: 'sample.headteacher@edumatch.local',
    username: 'sampleheadteacher',
    password: 'Sample123',
    role: 'headteacher',
    status: 'active',
    department: 'Science',
    managedBy: admin._id,
    contactNumber: '09170000003',
  });

  const teacher = await upsertUser({
    name: 'Maria Santos Sample',
    email: 'sample.teacher@edumatch.local',
    username: 'sampleteacher',
    password: 'Sample123',
    role: 'teacher',
    status: 'active',
    strand: 'STEM',
    subject: 'Science',
    department: 'Science',
    managedBy: headTeacher._id,
    gradeLevel: 'Grade 11',
    contactNumber: '09170000004',
    hasCompletedTeacherTour: true,
  });

  const studentOne = await upsertUser({
    name: 'Juan Dela Cruz Sample',
    email: 'sample.student1@edumatch.local',
    username: 'samplestudent1',
    password: 'Sample123',
    role: 'student',
    status: 'active',
    strand: 'STEM',
    gradeLevel: 'Grade 11',
    managedBy: secretary._id,
    hasCompletedStudentTour: true,
    contactNumber: '09170000005',
    enrollment: {
      teacherId: teacher._id,
      status: 'approved',
      track: 'STEM',
      trackId: 'track-stem-sample',
      requestedAt: fiveDaysAgo,
      approvedAt: threeDaysAgo,
      progress: {
        masteryProgress: 84,
        averageScore: 88,
        completedAssessments: 2,
        lastCalculatedAt: now,
      },
    },
  });

  const studentTwo = await upsertUser({
    name: 'Ana Reyes Sample',
    email: 'sample.student2@edumatch.local',
    username: 'samplestudent2',
    password: 'Sample123',
    role: 'student',
    status: 'active',
    strand: 'STEM',
    gradeLevel: 'Grade 11',
    managedBy: secretary._id,
    contactNumber: '09170000006',
    enrollment: {
      teacherId: teacher._id,
      status: 'approved',
      track: 'STEM',
      trackId: 'track-stem-sample',
      requestedAt: fiveDaysAgo,
      approvedAt: threeDaysAgo,
      progress: {
        masteryProgress: 76,
        averageScore: 81,
        completedAssessments: 1,
        lastCalculatedAt: now,
      },
    },
  });

  const subject = await upsertSubject({
    code: 'STEM-SCI-SAMPLE-01',
    name: 'Science',
    className: 'STEM 11 - Newton',
    track: 'STEM',
    subjectCategory: 'Science',
    description: 'Sample science subject used for MongoDB model generation.',
    teacherId: teacher._id,
    isActive: true,
  });

  const lesson = await upsertLesson({
    title: 'Introduction to Scientific Investigation',
    description: 'A sample lesson covering variables, hypotheses, and scientific method basics.',
    track: 'STEM',
    subject: 'Science',
    subjectId: subject._id,
    subjectCode: subject.code,
    subjectCategory: 'Science',
    pdfPath: 'uploads/sample-scientific-investigation.pdf',
    pdfOriginalName: 'sample-scientific-investigation.pdf',
    attachments: [
      {
        originalName: 'sample-lab-guide.docx',
        storedPath: 'uploads/sample-lab-guide.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: '.docx',
        size: 24576,
        uploadedAt: threeDaysAgo,
      },
    ],
    createdBy: teacher._id,
  });

  const assessment = await upsertAssessment({
    lessonId: lesson._id,
    title: 'Scientific Method Quiz 1',
    examType: 'quiz',
    subject: 'Science',
    subjectId: subject._id,
    subjectCode: subject.code,
    subjectCategory: 'Science',
    difficulty: 'medium',
    numberOfItems: 3,
    examDurationMinutes: 25,
    maxViolations: 3,
    violationAction: 'auto-submit',
    submissionDeadline: nextWeek,
    questions: [
      {
        questionText: 'What is the first step in the scientific method?',
        type: 'multiple-choice',
        options: ['Observation', 'Conclusion', 'Experiment', 'Publication'],
        correctAnswer: 'Observation',
        points: 1,
        explanation: 'Scientific inquiry begins by observing a phenomenon or problem.',
      },
      {
        questionText: 'A hypothesis should be testable.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        points: 1,
        explanation: 'A good hypothesis can be supported or rejected through testing.',
      },
      {
        questionText: 'Give one example of a controlled variable in an experiment.',
        type: 'short-answer',
        options: [],
        correctAnswer: 'temperature',
        points: 2,
        explanation: 'Controlled variables stay constant so the test remains fair.',
      },
    ],
    createdBy: teacher._id,
  });

  await upsertEnrollment({
    subjectId: subject._id,
    teacherId: teacher._id,
    studentId: studentOne._id,
    status: 'approved',
    requestedAt: fiveDaysAgo,
    decidedAt: threeDaysAgo,
  });

  await upsertEnrollment({
    subjectId: subject._id,
    teacherId: teacher._id,
    studentId: studentTwo._id,
    status: 'approved',
    requestedAt: fiveDaysAgo,
    decidedAt: threeDaysAgo,
  });

  await upsertSubmission({
    studentId: studentOne._id,
    assessmentId: assessment._id,
    answers: [
      { questionIndex: 0, answer: 'Observation' },
      { questionIndex: 1, answer: 'True' },
      { questionIndex: 2, answer: 'temperature' },
    ],
    score: 4,
    totalPoints: 4,
    submittedAt: twoDaysAgo,
    startedAt: new Date(twoDaysAgo.getTime() - 18 * 60 * 1000),
    lastActivityAt: twoDaysAgo,
    examDurationMinutes: 25,
    violationCount: 0,
    activityLog: [
      {
        type: 'start',
        message: 'Student started the assessment.',
        metadata: { source: 'web' },
        occurredAt: new Date(twoDaysAgo.getTime() - 18 * 60 * 1000),
      },
      {
        type: 'submit',
        message: 'Student submitted the assessment.',
        metadata: { autoSubmitted: false },
        occurredAt: twoDaysAgo,
      },
    ],
    autoSubmitted: false,
    terminationReason: '',
    status: 'completed',
  });

  await upsertSubmission({
    studentId: studentTwo._id,
    assessmentId: assessment._id,
    answers: [
      { questionIndex: 0, answer: 'Experiment' },
      { questionIndex: 1, answer: 'True' },
      { questionIndex: 2, answer: 'time' },
    ],
    score: 1,
    totalPoints: 4,
    submittedAt: twoDaysAgo,
    startedAt: new Date(twoDaysAgo.getTime() - 25 * 60 * 1000),
    lastActivityAt: twoDaysAgo,
    examDurationMinutes: 25,
    violationCount: 1,
    activityLog: [
      {
        type: 'start',
        message: 'Student started the assessment.',
        metadata: { source: 'web' },
        occurredAt: new Date(twoDaysAgo.getTime() - 25 * 60 * 1000),
      },
      {
        type: 'warning',
        message: 'One focus violation detected.',
        metadata: { count: 1 },
        occurredAt: new Date(twoDaysAgo.getTime() - 7 * 60 * 1000),
      },
      {
        type: 'submit',
        message: 'Student submitted the assessment.',
        metadata: { autoSubmitted: false },
        occurredAt: twoDaysAgo,
      },
    ],
    autoSubmitted: false,
    terminationReason: '',
    status: 'completed',
  });

  await upsertRecommendation({
    studentId: studentOne._id,
    assessmentAttempts: [
      {
        assessmentId: assessment._id,
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectCategory: 'Science',
        score: 4,
        totalItems: 4,
        percentage: 100,
        completedAt: twoDaysAgo,
      },
    ],
    subjectPerformance: [
      {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectCategory: 'Science',
        completedAssessments: 1,
        averageScore: 100,
        progress: 100,
        latestCompletedAt: twoDaysAgo,
      },
    ],
    strandScores: {
      STEM: 92,
      HUMSS: 54,
      ABM: 48,
      TVL: 61,
    },
    recommendedStrand: {
      name: 'STEM',
      confidence: 'High',
      generatedAt: now,
      topTwoStrands: ['STEM', 'TVL'],
    },
    recommendationExplanation: 'High science performance and strong assessment consistency indicate STEM readiness.',
    lastReason: 'Latest science quiz improved STEM confidence.',
    records: [
      {
        event: 'Initial Recommendation Generated',
        reason: 'Seeded baseline recommendation for sample student.',
        timestamp: now,
      },
    ],
  });

  await upsertRecommendation({
    studentId: studentTwo._id,
    assessmentAttempts: [
      {
        assessmentId: assessment._id,
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectCategory: 'Science',
        score: 1,
        totalItems: 4,
        percentage: 25,
        completedAt: twoDaysAgo,
      },
    ],
    subjectPerformance: [
      {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectCategory: 'Science',
        completedAssessments: 1,
        averageScore: 25,
        progress: 25,
        latestCompletedAt: twoDaysAgo,
      },
    ],
    strandScores: {
      STEM: 41,
      HUMSS: 58,
      ABM: 52,
      TVL: 67,
    },
    recommendedStrand: {
      name: 'TVL',
      confidence: 'Medium',
      generatedAt: now,
      topTwoStrands: ['TVL', 'HUMSS'],
    },
    recommendationExplanation: 'Current results lean toward applied and technical learning tracks.',
    lastReason: 'Lower science score reduced STEM fit.',
    records: [
      {
        event: 'Initial Recommendation Generated',
        reason: 'Seeded baseline recommendation for second sample student.',
        timestamp: now,
      },
    ],
  });

  const adminMessage = await upsertAdminMessage({
    senderId: admin._id,
    senderRole: 'admin',
    senderName: admin.name,
    recipientId: teacher._id,
    recipientRole: 'teacher',
    subject: 'Welcome to the sample dataset',
    content: 'This is a seeded admin message so MongoDB tools can detect the messaging schema.',
    preview: 'This is a seeded admin message so MongoDB tools can detect the messaging schema.',
    urgent: false,
    readAt: null,
  });

  await upsertNotification({
    recipientId: teacher._id,
    recipientRole: 'teacher',
    senderId: admin._id,
    senderRole: 'admin',
    senderName: admin.name,
    type: 'admin_message',
    title: 'Sample data has been prepared',
    message: 'Your sample subject, lesson, assessment, and student records are now available.',
    subject: 'Sample data ready',
    preview: 'Your sample subject, lesson, assessment, and student records are now available.',
    urgent: false,
    isViewed: false,
    viewedAt: null,
    messageId: adminMessage._id,
    meta: {
      seeded: true,
      collectionSet: ['users', 'subjects', 'lessons', 'assessments', 'submissions'],
    },
  });

  await upsertSettings({
    key: 'sample-data',
    security: {
      sessionTimeoutMinutes: 120,
      maxLoginAttempts: 5,
      accountLockoutDurationMinutes: 30,
    },
    user: {
      emailVerificationRequired: true,
    },
    maintenance: {
      maintenanceModeEnabled: false,
      maintenanceMessage: 'The system is currently under maintenance. Please check back later.',
      systemVersion: 'v1.0.0-sample',
      lastBackupAt: threeDaysAgo,
      lastBackupFileName: 'sample-backup-001.gz',
      lastCacheClearedAt: twoDaysAgo,
    },
    updatedBy: admin._id,
  });

  console.log('Sample data seeded successfully.');
  console.log(
    JSON.stringify(
      {
        users: [admin.email, secretary.email, headTeacher.email, teacher.email, studentOne.email, studentTwo.email],
        subjectCode: subject.code,
        lessonTitle: lesson.title,
        assessmentTitle: assessment.title,
        database: 'edumatch',
      },
      null,
      2
    )
  );
}

seed()
  .then(async () => {
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Failed to seed sample data.');
    console.error(error);

    try {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect cleanly:', disconnectError);
    }

    process.exit(1);
  });
