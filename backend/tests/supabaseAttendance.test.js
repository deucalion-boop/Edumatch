const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');

let client;
require('../services/supabaseStorageService').getSupabaseStorageClient = () => client;
const controller = require('../controllers/attendanceController');

const teacherId = 'teacher0000000000000000000000001';
const studentId = 'student0000000000000000000000001';
const subjectId = '0e81858f7a5a491b83af71c2076fe2f3';

function fixture() {
  client = createFakeSupabase({
    users: [
      { id: teacherId, name: 'Teacher', email: 'teacher@gmail.com', role: 'teacher', status: 'active', archive: {} },
      { id: studentId, name: 'Student', email: 'student@gmail.com', role: 'student', status: 'active', grade_level: '10', archive: {} },
    ],
    subjects: [{ id: subjectId, teacher_id: teacherId, name: 'Mathematics', class_name: 'Grade 10', code: 'MTH-01', track: 'General', is_active: true }],
    subject_enrollments: [{ id: 'enrollment', teacher_id: teacherId, student_id: studentId, subject_id: subjectId, status: 'approved' }],
    sections: [],
    attendance_records: [],
  });
}

async function invoke(handler, req) {
  let response;
  let statusCode = 200;
  await handler(req, {
    status(value) { statusCode = value; return this; },
    json(value) { response = value; },
  }, (error) => { throw error; });
  return { statusCode, response };
}

test('teacher attendance accepts Supabase text IDs and persists only to attendance_records', async () => {
  fixture();
  const user = { _id: teacherId, name: 'Teacher', role: 'teacher', subject: 'Mathematics', department: 'Math' };

  const saved = await invoke(controller.saveTeacherAttendance, {
    user,
    body: {
      attendanceScope: 'handled_class',
      subjectId,
      dateKey: '2026-09-13',
      entries: [{ studentId, status: 'Present' }],
    },
  });

  assert.equal(saved.statusCode, 201);
  assert.equal(saved.response.record.subject.id, subjectId);
  assert.equal(client.tables.attendance_records.length, 1);
  assert.equal(client.tables.attendance_records[0].subject_id, subjectId);
  assert.equal(client.tables.attendance_records[0].entries[0].studentId, studentId);

  const roster = await invoke(controller.getTeacherAttendanceRoster, {
    user,
    query: { scope: 'handled_class', subjectId, dateKey: '2026-09-13' },
  });
  assert.equal(roster.response.students[0].attendanceStatus, 'Present');

  const locked = await invoke(controller.lockTeacherAttendance, {
    user,
    params: { id: client.tables.attendance_records[0].id },
  });
  assert.equal(locked.response.record.isLocked, true);
});
