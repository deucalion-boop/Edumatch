# EduMatch Feature Proposal

## Scope

This proposal covers two related features for the current EduMatch stack:

1. Teacher-granted additional assessment attempt
2. Google Classroom-like activity and submission system

The proposal is tailored to the current codebase:

- Backend: Express + Mongoose
- Frontend: Vue + Vue Router
- Current role model: `admin`, `secretary`, `headteacher`, `teacher`, `student`
- Current core models already in use:
  - `User`
  - `Subject`
  - `SubjectEnrollment`
  - `Assessment`
  - `Submission`
  - `Notification`

## Design Goals

- Reuse the existing `Assessment` and `Submission` backbone instead of replacing it.
- Keep approval and attempt-grant actions fully auditable.
- Prevent silent data mutation.
- Make student-facing flows simple and familiar, similar to Google Classroom.
- Keep teacher and head teacher flows aligned with your existing route layout and dashboard pages.

---

## Current-System Fit

The existing models already support most of the base relationships we need:

- `SubjectEnrollment` already models student membership in a class with approval.
- `Assessment` already stores teacher-created classroom work.
- `Submission` already stores student work and exam activity.
- `Notification` can be reused for approvals, grants, deadlines, grading, and status changes.

Recommended direction:

- Keep `Assessment` as the main classroom work entity, but extend it so it can represent assignments, activities, quizzes, and exams.
- Evolve `Submission` from a single-attempt record into a submission container that supports multiple attempts, file/link artifacts, grading, and feedback.

---

## Feature 1: Additional Assessment Attempt

### Business Need

Teachers need a controlled way to grant exactly one additional attempt when a student experiences a legitimate technical problem.

### Recommended Design Direction

The current `Submission` model enforces one document per `studentId + assessmentId`. That works for single-attempt exams but is too limited for controlled retakes.

Recommended approach:

- Keep one `Submission` document per `student + activity`
- Add `attempts[]` inside that document
- Add a separate `AssessmentAttemptGrant` collection for auditable grant approvals

This preserves your current unique index while adding structured attempt history.

### Recommended Workflow

1. Teacher opens an assessment record or student record.
2. Teacher selects a student and sees:
   - attempts used
   - allowed attempts
   - latest submission status
   - latest score
   - prior grant history
3. Teacher enters a reason and clicks `Grant 1 More Attempt`.
4. System validates:
   - teacher owns the assessment or is allowed by head teacher scope
   - student is assigned to the assessment
   - no active `in_progress` session exists
   - deadline has not already passed, unless the deadline is also extended
   - no policy limit is violated
5. System creates an `AssessmentAttemptGrant` record.
6. Effective allowed attempts becomes `baseAttempts + activeGrants`.
7. Student receives a notification.
8. When the student opens the activity again, the system allows a new attempt if `finalizedAttempts < allowedAttempts`.
9. Once the new attempt starts, the grant is marked `used`.

### Recommended New Model: `AssessmentAttemptGrant`

Collection: `assessmentattemptgrants`

Important fields:

- `_id`
- `assessmentId`
- `studentId`
- `teacherId`
- `grantedById`
- `grantedByRole`
- `reason`
- `status`
- `grantType`
- `baseAllowedAttempts`
- `newAllowedAttempts`
- `grantedAt`
- `usedAt`
- `expiresAt`
- `revokedAt`
- `revokedById`
- `revocationReason`
- `metadata`
- `history[]`

Recommended enums:

- `status`: `active`, `used`, `expired`, `revoked`
- `grantType`: `technical_issue`, `network_issue`, `device_issue`, `browser_crash`, `manual_override`, `other`

### Recommended Changes to `Submission`

Instead of only storing one flat submission state, evolve it into:

- `studentId`
- `assessmentId`
- `baseAllowedAttempts`
- `currentAllowedAttempts`
- `currentAttemptNumber`
- `latestStatus`
- `latestScore`
- `latestSubmittedAt`
- `attempts[]`
- `feedback[]`
- `activitySummary`
- timestamps

Recommended `attempts[]` fields:

- `attemptNumber`
- `startedAt`
- `submittedAt`
- `lastActivityAt`
- `status`
- `score`
- `totalPoints`
- `answers[]`
- `artifacts[]`
- `examDurationMinutes`
- `violationCount`
- `autoSubmitted`
- `terminationReason`
- `attemptGrantId`
- `activityLog[]`

Recommended `artifacts[]` fields:

- `type`
- `fileName`
- `storedPath`
- `mimeType`
- `sizeBytes`
- `url`
- `textValue`
- `uploadedAt`

### Recommended Policy Rules

- Default allowed attempts: `1`
- Teacher can grant `+1` attempt
- Additional teacher grants beyond one per student per assessment should be blocked by default
- More than one extra attempt should require head teacher or admin override in a later phase
- Grant reason is mandatory
- Grant must be visible in audit history and teacher records

### Validations

- Assessment must exist and belong to the requesting teacher scope.
- Student must be assigned to the assessment or be part of the class.
- Reject grant if there is already an active attempt.
- Reject grant if the deadline is closed and no extension exists.
- Reject grant if the student has not been assigned to the activity.
- Reject grant if the student account is inactive or suspended.
- Reject duplicate active grants for the same assessment and student.

### Edge Cases

- Teacher grants an extra attempt, but the student never uses it
- Teacher grants the attempt after the deadline
- Student has an auto-submitted timed-out attempt
- Student starts the extra attempt from two devices
- Teacher deletes or edits the assessment after granting an attempt

Recommended handling:

- Mark unused grants as `expired` after deadline
- Lock one active attempt per student per activity
- Snapshot allowed-attempt count when an attempt starts

### Audit Trail Requirements

Track:

- grant created
- grant viewed
- grant used
- grant expired
- grant revoked
- attempt started
- attempt submitted
- attempt auto-submitted

### Acceptance Criteria

- A teacher can grant one additional attempt to a student for a specific assessment.
- The grant requires a reason and records who granted it and when.
- The student cannot open a second concurrent active session.
- The student can only use the extra attempt if allowed-attempt count permits it.
- The grant and resulting attempt are visible in teacher records and audit history.
- Duplicate or abusive grants are blocked by policy.

---

## Feature 2: Google Classroom-Like Activity And Submission System

### Business Need

Teachers need a unified classroom work area where they can create assignments, activities, quizzes, and exams. Students need a familiar place to view instructions, attach files, submit links, see deadlines, receive grades, and read feedback.

### Recommended Design Direction

Do not introduce a completely separate "assignment system" beside `Assessment`.

Instead:

- Keep `Assessment` as the core classroom work model
- Expand it into a unified activity model
- Use the UI label `Activities` or `Classwork`

This keeps the current teacher and student pages reusable and avoids parallel logic.

### Recommended `Assessment` Evolution

Add fields so one model can represent:

- assignment
- classroom activity
- quiz
- exam

Recommended new fields:

- `activityType`
- `publishStatus`
- `instructions`
- `pointsPossible`
- `submissionMode`
- `allowTextEntry`
- `allowFileUpload`
- `allowLinkSubmission`
- `allowVideoSubmission`
- `maxFiles`
- `maxFileSizeMb`
- `allowedMimeTypes`
- `allowLateSubmission`
- `lateUntil`
- `gradedAt`
- `publishedAt`
- `archivedAt`
- `materials[]`
- `rubric[]`

Recommended enums:

- `activityType`: `assignment`, `activity`, `quiz`, `exam`
- `publishStatus`: `draft`, `published`, `archived`
- `submissionMode`: `question_based`, `attachment_based`, `mixed`

How to map existing behavior:

- current activity-style exams become `activityType = quiz` or `exam`
- upload/link tasks become `activityType = assignment` or `activity`
- current `questions[]` remains for quiz and exam types

### Recommended `materials[]` Subdocument

- `type`
- `title`
- `storedPath`
- `originalName`
- `mimeType`
- `sizeBytes`
- `url`
- `uploadedById`
- `uploadedAt`

### Recommended `rubric[]` Subdocument

- `criterion`
- `description`
- `maxPoints`
- `sortOrder`

### Student Submission Capabilities

Students should be able to submit:

- uploaded files
- pasted links
- optional text notes
- optional video link or uploaded video only when allowed

Video should remain optional and disabled by default.

### Submission Status Model

Recommended student-facing status values:

- `not_started`
- `draft`
- `in_progress`
- `submitted`
- `late`
- `returned`
- `graded`
- `missing`
- `auto_submitted`
- `terminated`

### Teacher Workflow

1. Teacher opens `Activities`
2. Teacher sees tabs:
   - `Drafts`
   - `Published`
   - `Needs Grading`
   - `Past Due`
3. Teacher creates a new activity with a guided composer
4. Teacher chooses:
   - activity type
   - class
   - instructions
   - files/materials
   - question set or upload mode
   - due date
   - points
   - allowed submission types
5. Teacher publishes
6. Students receive notifications and see the item in their `Activities` page
7. Students submit files, links, or answers
8. Teacher reviews submissions in `Records`
9. Teacher grades and leaves feedback
10. Student sees returned grade and feedback

### Student Workflow

1. Student opens `Activities`
2. Student sees grouped work:
   - `To Do`
   - `Submitted`
   - `Returned`
   - `Missing`
3. Student opens an activity detail page
4. Student reviews:
   - title
   - instructions
   - teacher materials
   - due date
   - points
   - allowed submission types
5. Student attaches files and or links
6. Student saves draft or clicks `Turn In`
7. Student later sees grade, teacher comments, and attempt history if applicable

### Recommended New UI Behavior

For quiz or exam:

- show `Start Attempt`
- launch exam mode
- keep anti-cheating and timer behavior

For assignment or activity:

- show submission composer inline
- allow draft save before final `Turn In`
- allow resubmission if teacher policy permits

### Validations

- Activity title required
- Class required
- Activity type required
- At least one submission path must be enabled for assignment/activity types
- Question set required for quiz/exam types
- Deadline must be in the future when published
- File count and file size must obey policy
- Unsupported file types rejected
- URL submissions must be valid absolute URLs
- Student cannot submit after deadline unless late submission is enabled

### Edge Cases

- Student uploads file, then removes it before final submission
- Student submits link and file together
- Teacher edits instructions after some students submitted
- Teacher changes due date after publication
- Student submits late
- Student resubmits after feedback
- File storage failure during submission

Recommended handling:

- Preserve activity version history for important instructional changes
- Snapshot grading-relevant fields at submission time where needed
- Never delete previously submitted attempt data silently

### Acceptance Criteria

- Teacher can create assignments, activities, quizzes, and exams from one workflow.
- Teacher can attach materials and configure allowed submission types.
- Student can submit files and valid links.
- Video submission is optional and only available when enabled.
- Due date, status, grading, and feedback are visible to both teacher and student.
- Teachers can review and grade submissions from a records view.
- Students can clearly see whether work is missing, submitted, returned, late, or graded.

---

## User Stories

### Admin

- As an admin, I want to view audit logs for attempt grants and grading actions so I can investigate disputes.
- As an admin, I want to see reports on extra-attempt usage so I can monitor policy abuse.
- As an admin, I want to configure default attempt policy and file-upload limits so the platform remains controlled.

### Head Teacher

- As a head teacher, I want to review high-risk override cases like repeated extra-attempt grants so I can enforce fairness.

### Teacher

- As a teacher, I want to grant one additional attempt for a student who had a technical issue during an assessment.
- As a teacher, I want to create assignments, quizzes, exams, and activities from one page.
- As a teacher, I want to review submissions, grade them, and give written feedback.

### Student

- As a student, I want to know when an extra attempt has been granted and how many attempts remain.
- As a student, I want to submit files or links for classroom work without needing a special format.
- As a student, I want to see deadlines, grading status, and teacher feedback in one place.

---

## Recommended Database / Model Changes

### New Collections

1. `AssessmentAttemptGrant`
2. `AuditLog` for immutable platform-wide audit history

### Recommended `AuditLog`

Collection: `auditlogs`

Important fields:

- `_id`
- `entityType`
- `entityId`
- `eventType`
- `actorId`
- `actorRole`
- `actorName`
- `targetUserId`
- `before`
- `after`
- `metadata`
- `requestId`
- `occurredAt`

### Existing Collections To Extend

1. `SubjectEnrollment`
2. `Assessment`
3. `Submission`
4. `Notification`

### `Notification` Reuse

Recommended new `type` values:

- `extra_attempt_granted`
- `activity_published`
- `submission_received`
- `submission_returned`
- `submission_graded`
- `deadline_reminder`

---

## Proposed Backend API Endpoints

The endpoint layout below follows the current route style in the repo.

### Teacher Routes

#### Additional Attempt

- `POST /api/teacher/assessments/:assessmentId/attempt-grants`
- `GET /api/teacher/assessments/:assessmentId/attempt-grants`
- `GET /api/teacher/students/:studentId/attempt-grants`

#### Unified Activities

- `POST /api/teacher/activities`
- `GET /api/teacher/activities`
- `GET /api/teacher/activities/:id`
- `PATCH /api/teacher/activities/:id`
- `PATCH /api/teacher/activities/:id/publish`
- `PATCH /api/teacher/activities/:id/archive`
- `POST /api/teacher/activities/:id/materials`
- `GET /api/teacher/activities/:id/submissions`
- `GET /api/teacher/submissions/:submissionId`
- `PATCH /api/teacher/submissions/:submissionId/grade`
- `PATCH /api/teacher/submissions/:submissionId/return`

### Head Teacher Routes

- `GET /api/headteacher/attempt-grants`
- `GET /api/headteacher/activities/overview`

### Student Routes

- `GET /api/student/activities`
- `GET /api/student/activities/:id`
- `POST /api/student/activities/:id/attempts/start`
- `PATCH /api/student/activities/:id/attempts/:attemptNumber/progress`
- `POST /api/student/activities/:id/attempts/:attemptNumber/artifacts`
- `PATCH /api/student/activities/:id/attempts/:attemptNumber/draft`
- `POST /api/student/activities/:id/submissions/turn-in`
- `GET /api/student/submissions/me`

### Admin Routes

- `GET /api/admin/audit/attempt-grants`
- `GET /api/admin/audit/submissions`
- `GET /api/admin/activity-analytics`
- `GET /api/admin/policy/attempts`
- `PATCH /api/admin/policy/attempts`

### Compatibility Recommendation

For backward compatibility:

- keep current `/teacher/assessments` and `/student/assessments` routes working
- gradually add `/activities` endpoints
- internally map quiz and exam use cases to the expanded `Assessment` model

---

## Frontend Pages And Components

### Teacher

Use and extend existing pages:

- `frontend/src/views/teacher/TeacherActivities.vue`
- `frontend/src/views/teacher/TeacherRecords.vue`
- `frontend/src/views/teacher/TeacherStudent.vue`

Recommended additions:

- `AttemptGrantModal.vue`
- `ActivityComposer.vue`
- `ActivityTypeSelector.vue`
- `SubmissionReviewDrawer.vue`
- `FeedbackPanel.vue`
- `ActivityStatusBadge.vue`

### Head Teacher

Use and extend:

- `frontend/src/views/headteacher/HeadTeacherManagement.vue`

### Student

Use and extend:

- `frontend/src/views/student/StudentActivities.vue`
- `frontend/src/views/student/StudentExamMode.vue`

Recommended additions:

- `StudentSubmissionComposer.vue`
- `SubmissionArtifactList.vue`
- `AttemptHistoryCard.vue`
- `FeedbackThread.vue`

### Admin

Use and extend:

- `frontend/src/views/admin/AdminView.vue`
- `frontend/src/views/admin/AdminUserManagement.vue`

Recommended additions:

- `AuditLogTable.vue`
- `PolicySettingsCard.vue`
- `AttemptAnalyticsPanel.vue`

---

## Suggested UI / UX Flow

### Teacher UX

Adapt the existing `TeacherActivities` page into a Google Classroom-like `Classwork` workspace:

- top-level filters:
  - `All`
  - `Drafts`
  - `Published`
  - `Needs Grading`
  - `Archived`
- create button:
  - `Assignment`
  - `Activity`
  - `Quiz`
  - `Exam`
- right-side detail drawer:
  - instructions
  - materials
  - due date
  - submission stats
  - grading status

For `TeacherStudent`:

- add `Grant Extra Attempt` action from either student profile or records row

### Student UX

Adapt `StudentActivities` into a cleaner classroom feed:

- grouped lists:
  - `To Do`
  - `Submitted`
  - `Returned`
  - `Missing`
- card detail panel shows:
  - due date
  - instructions
  - attachments
  - submission requirements
  - attempt count
  - feedback

For assignment/activity types:

- inline submission area with:
  - `Add file`
  - `Add link`
  - `Add note`
  - `Save draft`
  - `Turn in`

For quiz/exam types:

- `Start Attempt`
- show attempts remaining
- show extra-attempt badge if granted

### Head Teacher UX

Add a visible oversight area inside `HeadTeacherManagement` for:

- extra-attempt usage summary
- flagged override cases
- classroom activity overview

### UX Notes

- Use status chips heavily
- Keep submission actions obvious and one-click
- Show "attempts remaining" near the primary action button
- Keep mobile layout card-based for student workflows

---

## Role Permissions Matrix

| Action | Admin | Head Teacher | Teacher | Student |
|---|---|---|---|---|
| Grant extra attempt | Optional override | Read / override later | Yes, own assessments only | No |
| Create classroom activity | Optional oversight | Yes for managed teachers | Yes | No |
| Submit work | No | No | No | Yes |
| Grade submissions | No | Managed-teacher oversight | Yes | No |
| View audit logs | Yes | Department-scoped | Limited | No |

---

## Approval, Security, And Data Integrity Rules

- All state-changing endpoints require auth and role validation.
- Approval endpoints must re-check entity ownership and department scope.
- Approval and grant actions should use optimistic checks on current status.
- File uploads must be validated by extension, MIME type, and size.
- Submission artifact paths should never be trusted from the client.
- Attempts should be device-safe by allowing only one active attempt at a time.

---

## Validation Summary

### Attempt Grant

- teacher must own assessment
- student must belong to class or assignment scope
- reason required
- no active attempt
- deadline must still allow use
- no duplicate active grant

### Activity Submission

- valid activity type
- required submission method enabled
- deadline enforcement
- file/link validation
- resubmission only if allowed

---

## Implementation Notes

### Recommended Delivery Order

1. Add audit log foundation
2. Extend submission model to support `attempts[]`
3. Add attempt-grant API and teacher UI
4. Extend activity model for file/link submissions
5. Update student and teacher workflows

### Migration Notes

Existing `Submission` rows can be migrated into:

- `attempts[0]`
- `baseAllowedAttempts = 1`
- `currentAllowedAttempts = 1`
- `currentAttemptNumber = 1`
- `latestStatus = existing status`

This lets you preserve historical exam data.

---

## Summary Recommendation

The cleanest architecture for EduMatch is:

- add `AssessmentAttemptGrant` for controlled extra attempts
- evolve `Assessment` into a unified activity model
- evolve `Submission` into a multi-attempt, artifact-aware submission container
- add `AuditLog` as the immutable compliance layer

This approach fits the current codebase, keeps role boundaries clear, and gives you a realistic path to a Classroom-style experience without rebuilding your platform from scratch.
