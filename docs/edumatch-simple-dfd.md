# EduMatch Data Flow Diagram

This is a logical DFD for the current EduMatch codebase. It shows how data moves between users, core processes, data stores, and external services. It is not a deployment diagram.

One arrow may represent both the request and the returned result.

## 1. Context DFD

```mermaid
flowchart LR
  A[Admin]
  H[Head Teacher]
  T[Teacher]
  S[Secretary]
  ST[Student]

  SYS((EduMatch Platform<br/>Vue Frontend + Express API))
  DB[(MongoDB)]
  FS[[File Storage<br/>Local uploads or Supabase]]
  MAIL[[Mail API]]
  CAPTCHA[[Google reCAPTCHA]]
  AI[[AI Model API]]

  A -->|manage users, security, reports| SYS
  H -->|manage teachers, lessons, attendance| SYS
  T -->|manage classes, lessons, assessments| SYS
  S -->|student records, archive requests| SYS
  ST -->|join classes, study, submit work| SYS

  SYS -->|read and write records| DB
  SYS -->|upload and download files| FS
  SYS -->|send invites, reset emails, messages| MAIL
  SYS -->|verify login challenge| CAPTCHA
  SYS -->|generate assessments and AI text| AI
```

## 2. Level 1 DFD

```mermaid
flowchart LR
  A[Admin]
  H[Head Teacher]
  T[Teacher]
  S[Secretary]
  ST[Student]

  P1((1.0 Authentication<br/>and Security))
  P2((2.0 User, Section,<br/>and Subject Management))
  P3((3.0 Lessons and<br/>Classroom Content))
  P4((4.0 Assessments,<br/>Submissions, and Recommendations))
  P5((5.0 Attendance,<br/>Notifications, and Oversight))

  D1[(D1 Users<br/>and Settings)]
  D2[(D2 Sections, Subjects,<br/>Enrollments, and Lessons)]
  D3[(D3 Assessments, Submissions,<br/>Attendance, and Recommendations)]
  D4[(D4 Audit Logs, Login Attempts,<br/>Notifications, and Export Requests)]

  MAIL[[Mail API]]
  CAPTCHA[[Google reCAPTCHA]]
  FS[[File Storage]]
  AI[[AI Model API]]

  A --> P1
  A --> P2
  A --> P5

  H --> P1
  H --> P2
  H --> P3
  H --> P4
  H --> P5

  T --> P1
  T --> P2
  T --> P3
  T --> P4
  T --> P5

  S --> P1
  S --> P5

  ST --> P1
  ST --> P2
  ST --> P3
  ST --> P4

  P1 --> D1
  P1 --> D4
  P1 --> CAPTCHA
  P1 --> MAIL

  P2 --> D1
  P2 --> D2
  P2 --> MAIL

  P3 --> D2
  P3 --> FS
  P3 --> AI

  P4 --> D2
  P4 --> D3
  P4 --> FS
  P4 --> AI

  P5 --> D1
  P5 --> D3
  P5 --> D4
```

## 3. Process Summary

- `1.0 Authentication and Security`: login with reCAPTCHA, JWT access, invite activation, password reset, login-attempt logging, and maintenance enforcement.
- `2.0 User, Section, and Subject Management`: admin and academic staff manage users, advisory sections, handled classes, enrollments, and subject membership.
- `3.0 Lessons and Classroom Content`: teachers and head teachers create lessons, upload attachments, and let students view or download learning materials.
- `4.0 Assessments, Submissions, and Recommendations`: staff create assessments manually or with AI, students take exams or submit activity work, and the system computes scores, progress, and strand recommendations.
- `5.0 Attendance, Notifications, and Oversight`: the system records handled-class and advisory attendance, keeps notifications, logs audit activity, and manages archived-record export approvals.

## 4. Main Data Stores

- `D1 Users and Settings`: `User`, `Settings`, plus access-control state tied to accounts.
- `D2 Sections, Subjects, Enrollments, and Lessons`: `Section`, `Subject`, `SubjectEnrollment`, `Lesson`.
- `D3 Assessments, Submissions, Attendance, and Recommendations`: `Assessment`, `Submission`, `Attendance`, `Recommendation`.
- `D4 Audit Logs, Login Attempts, Notifications, and Export Requests`: `AuditLog`, `LoginAttempt`, `Notification`, `ExportApprovalRequest`, `AdminMessage`.

## 5. External Services

- `Google reCAPTCHA`: validates login requests before authentication succeeds.
- `Mail API`: sends invite emails, password reset emails, and admin-originated messages.
- `File Storage`: stores lesson files, assessment attachments, profile images, and student submission files using local uploads or Supabase Storage.
- `AI Model API`: supports AI-based assessment generation and recommendation-related text generation.

## 6. Codebase Basis

### Backend entry

- `backend/server.js`

### Main routes

- `backend/routes/authRoutes.js`
- `backend/routes/adminRoutes.js`
- `backend/routes/teacherRoutes.js`
- `backend/routes/studentRoutes.js`
- `backend/routes/headteacherRoutes.js`
- `backend/routes/secretaryRoutes.js`
- `backend/routes/notificationRoutes.js`
- `backend/routes/recommendationRoutes.js`
- `backend/routes/storageRoutes.js`

### Main models

- `backend/models/User.js`
- `backend/models/Section.js`
- `backend/models/Subject.js`
- `backend/models/SubjectEnrollment.js`
- `backend/models/Lesson.js`
- `backend/models/Assessment.js`
- `backend/models/Submission.js`
- `backend/models/Attendance.js`
- `backend/models/Recommendation.js`
- `backend/models/AuditLog.js`
- `backend/models/LoginAttempt.js`
- `backend/models/Notification.js`
- `backend/models/ExportApprovalRequest.js`
- `backend/models/AdminMessage.js`
- `backend/models/Settings.js`

### Main integrations

- `backend/services/gmailService.js`
- `backend/services/storageService.js`
- `backend/services/supabaseStorageService.js`
- `backend/controllers/aiController.js`
- `backend/controllers/authController.js`
