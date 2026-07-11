# Sections, Advisory, and Attendance Architecture

## 1. Recommended System Design

- `Section` is a school-wide homeroom entity.
- `Subject` remains the handled class entity.
- A `student` belongs to exactly one `Section`.
- A `teacher` belongs to exactly one `department`.
- A `teacher` may advise one `Section` through `advisorySectionId`.
- A `teacher` may handle many `Subject` classes in the same department.
- Students from many sections may join the same handled class through `SubjectEnrollment`.
- Attendance is split into:
  - `advisory_class`: section roster for the adviser only
  - `handled_class`: enrolled roster for a handled subject class
- Head Teacher visibility is department-scoped for teachers, handled classes, and attendance records, but never for section ownership itself.

## 2. Database and Model Changes

### Section

- New `Section` model
  - `name`
  - `isActive`
  - `description`
- Default school sections are seeded at startup.

### User

- Added `sectionId` for students.
- Added `advisorySectionId` for teachers.
- Added a unique partial index on `advisorySectionId` so one section has at most one adviser.

### Subject

- Added `department`.
- This keeps handled classes owned by the teacher's department without limiting the section itself.

### SubjectEnrollment

- Added `sectionId` and `sectionName`.
- This keeps a section snapshot on handled-class enrollment so class rosters and attendance can show where each learner belongs.

### Attendance

- Added `attendanceScope` with:
  - `handled_class`
  - `advisory_class`
- Added `sectionId` and `sectionName`.
- Entry rows also store student section data.
- Unique indexes now separate:
  - handled attendance by `subjectId + dateKey`
  - advisory attendance by `teacherId + sectionId + dateKey`

## 3. Backend Flow

### Advisory Attendance

1. Teacher selects `advisory_class`.
2. System resolves the teacher's `advisorySectionId`.
3. Roster comes from active students whose `sectionId` matches that section.
4. Attendance record is stored with `attendanceScope = advisory_class`.
5. Head Teacher can see the record only if the teacher belongs to the Head Teacher's department.

### Handled-Class Attendance

1. Teacher selects `handled_class` and one handled `Subject`.
2. Roster comes from approved `SubjectEnrollment` rows.
3. Students can come from many sections.
4. Attendance record is stored with `attendanceScope = handled_class`.
5. Each entry keeps the student's section snapshot for reporting.

### Department Scoping

- Teacher ownership is based on `teacher.department`.
- Subject ownership is based on `subject.department`.
- Head Teacher queries stay filtered to teachers in the same department.
- Sections are never filtered by department.

## 4. Frontend Flow

### Head Teacher

- Manage teachers in the department.
- Assign or change a teacher's advisory section.
- View teacher student rosters with each student's section.
- Monitor attendance with advisory vs handled context.

### Teacher

- `Students` page:
  - shows the assigned advisory section
  - creates student accounts into that advisory section
  - still enrolls students into handled classes separately
- `Records` page:
  - switches between handled-class attendance and advisory attendance
  - shows section labels inside rosters and history

### Secretary / Admin

- Student records show section membership, adviser, and attendance scope context.
- Monitoring remains cross-department, but sections stay school-wide.

### Student

- Dashboard shows section and adviser context.
- Attendance history shows whether a record came from advisory attendance or handled-class attendance.

## 5. Business Rules and Edge Cases

- A student appears in advisory attendance only when the student's `sectionId` matches the teacher's `advisorySectionId`.
- A student may appear in many handled classes through enrollment, even if those classes belong to different teachers in different departments.
- Two teachers from different departments may teach the same section through different handled classes. This is valid.
- A section may contain handled classes from Mathematics, English, Science, TLE, Filipino, AP, ESP, and MAPEH at the same time.
- If a teacher has no advisory section, advisory attendance and teacher-created student invites must be blocked.
- Changing a teacher's advisory section must resync legacy adviser-linked student references so old features keep working during transition.

## 6. Implementation Plan

### Completed in this rollout

1. Add `Section` model and seed default sections.
2. Add advisory and section references to `User`, `SubjectEnrollment`, and `Attendance`.
3. Add attendance scope support for advisory and handled attendance.
4. Add teacher/headteacher/secretary section directory endpoints.
5. Update teacher, headteacher, secretary, and student views to surface section-aware behavior.

### Safe follow-up tasks

1. Backfill any old student records that still have no `sectionId`.
2. Add admin-only maintenance tools for section reassignment if needed.
3. Add reporting dashboards grouped by section plus department.
4. Add tests for:
   - advisory roster isolation
   - cross-section handled-class enrollment
   - headteacher department scoping
   - attendance uniqueness by scope
