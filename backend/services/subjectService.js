const crypto = require('crypto');
const { getSupabaseStorageClient } = require('./supabaseStorageService');

function subjectError(error, fallbackMessage) {
  const normalized = new Error(String(error?.message || fallbackMessage));
  normalized.name = 'SupabaseSubjectError';
  normalized.code = error?.code;
  normalized.details = error?.details;
  normalized.hint = error?.hint;
  normalized.statusCode = error?.code === '23505' ? 409 : 500;
  return normalized;
}

function referenceId(value) {
  return String(value?._id || value?.id || value || '').trim();
}

function filterLiteralText(query, field, value) {
  const pattern = value.replace(/[\\%_]/g, '\\$&').replace(/\*/g, '_');
  query.ilike(field, pattern);
  const starCount = (value.match(/\*/g) || []).length;
  if (starCount) {
    // PostgREST treats '*' as a wildcard, so require literal stars in its slots.
    query.filter(field, 'match', `^([^*]*\\*){${starCount}}[^*]*$`);
  }
}

function mapSubject(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: String(row.name || '').trim(),
    className: String(row.class_name || '').trim(),
    code: String(row.code || '').trim(),
    track: String(row.track || '').trim(),
    subjectCategory: String(row.subject_category || '').trim(),
    department: String(row.department || '').trim(),
    description: String(row.description || '').trim(),
    teacherId: String(row.teacher_id || '').trim(),
    advisorySectionId: String(row.advisory_section_id || '').trim(),
    handledSectionId: String(row.handled_section_id || '').trim(),
    assignmentSource: String(row.assignment_source || (row.advisory_section_id ? 'advisory' : 'teacher')).trim(),
    assignedBy: String(row.assigned_by || '').trim(),
    isActive: row.is_active === true,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function buildCodePrefix(name) {
  const compact = String(name || '').trim()
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 3).toUpperCase())
    .join('')
    .slice(0, 3);
  return compact || 'SUB';
}

function buildRandomSuffix(length = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

async function generateUniqueSubjectCode(name) {
  const client = getSupabaseStorageClient();
  const prefix = buildCodePrefix(name);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `${prefix}-${buildRandomSuffix(5)}`;
    const { data, error } = await client.from('subjects').select('id').eq('code', code).limit(1).maybeSingle();
    if (error) throw subjectError(error, 'Failed to check class code in Supabase');
    if (!data) return code;
  }
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

async function findTeacherSubject(teacherId, subjectId, { includeInactive = false } = {}) {
  const normalizedTeacherId = referenceId(teacherId);
  const normalizedSubjectId = referenceId(subjectId);
  if (!normalizedTeacherId || !normalizedSubjectId) return null;
  let query = getSupabaseStorageClient().from('subjects').select('*')
    .eq('id', normalizedSubjectId).eq('teacher_id', normalizedTeacherId);
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw subjectError(error, 'Failed to read class from Supabase');
  return mapSubject(data);
}

async function findSubjectByCode(code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return null;
  const { data, error } = await getSupabaseStorageClient().from('subjects').select('*')
    .eq('code', normalizedCode).eq('is_active', true).limit(1).maybeSingle();
  if (error) throw subjectError(error, 'Failed to read class code from Supabase');
  return mapSubject(data);
}

async function listTeacherSubjects(teacherId, { includeInactive = false } = {}) {
  const normalizedTeacherId = referenceId(teacherId);
  if (!normalizedTeacherId) return [];
  let query = getSupabaseStorageClient().from('subjects').select('*')
    .eq('teacher_id', normalizedTeacherId);
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query.order('name', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw subjectError(error, 'Failed to list classes from Supabase');
  return (data || []).map(mapSubject);
}

async function ensureTeacherSubject({ teacherId, name, track, subjectCategory = '', className = '', description = '', department = '' }) {
  const normalizedTeacherId = referenceId(teacherId);
  const normalizedName = String(name || '').trim();
  const normalizedTrack = String(track || '').trim();
  const normalizedClassName = String(className || '').trim();
  if (!normalizedTeacherId || !normalizedName || !normalizedTrack) {
    const error = new Error('teacherId, name, and track are required');
    error.statusCode = 400;
    throw error;
  }

  const client = getSupabaseStorageClient();
  const query = client.from('subjects').select('*').eq('teacher_id', normalizedTeacherId);
  filterLiteralText(query, 'name', normalizedName);
  filterLiteralText(query, 'track', normalizedTrack);
  filterLiteralText(query, 'class_name', normalizedClassName);
  const { data: existing, error: findError } = await query.limit(1).maybeSingle();
  if (findError) throw subjectError(findError, 'Failed to check class in Supabase');

  const values = {
    teacher_id: normalizedTeacherId,
    name: normalizedName,
    class_name: normalizedClassName,
    track: normalizedTrack,
    subject_category: String(subjectCategory || '').trim(),
    department: String(department || '').trim(),
    description: String(description || '').trim(),
    is_active: true,
    updated_at: new Date().toISOString(),
  };
  const operation = existing
    ? client.from('subjects').update(values).eq('id', existing.id)
    : client.from('subjects').insert({ ...values, code: await generateUniqueSubjectCode(normalizedName) });
  const { data, error } = await operation.select('*').single();
  if (error) throw subjectError(error, existing ? 'Failed to update class in Supabase' : 'Failed to create class in Supabase');
  return mapSubject(data);
}

async function assignHandledClass({ teacherId, sectionId, assignedBy, name, track = 'GENERAL', subjectCategory = '', className, department = '' }) {
  const normalizedTeacherId = referenceId(teacherId);
  const normalizedSectionId = referenceId(sectionId);
  const normalizedAssignedBy = referenceId(assignedBy);
  const normalizedName = String(name || '').trim();
  const normalizedClassName = String(className || '').trim();
  if (!normalizedTeacherId || !normalizedSectionId || !normalizedAssignedBy || !normalizedName || !normalizedClassName) {
    throw Object.assign(new Error('teacherId, sectionId, assignedBy, name, and className are required'), { statusCode: 400 });
  }

  const client = getSupabaseStorageClient();
  const existingQuery = client.from('subjects').select('*')
    .eq('teacher_id', normalizedTeacherId)
    .eq('handled_section_id', normalizedSectionId)
    .eq('assignment_source', 'headteacher');
  filterLiteralText(existingQuery, 'name', normalizedName);
  const { data: existing, error: findError } = await existingQuery.limit(1).maybeSingle();
  if (findError) throw subjectError(findError, 'Failed to check handled class assignment');

  const values = {
    teacher_id: normalizedTeacherId,
    handled_section_id: normalizedSectionId,
    assignment_source: 'headteacher',
    assigned_by: normalizedAssignedBy,
    name: normalizedName,
    class_name: normalizedClassName,
    track: String(track || 'GENERAL').trim() || 'GENERAL',
    subject_category: String(subjectCategory || '').trim(),
    department: String(department || '').trim(),
    is_active: true,
    updated_at: new Date().toISOString(),
  };
  const operation = existing
    ? client.from('subjects').update(values).eq('id', existing.id)
    : client.from('subjects').insert({ ...values, description: '', code: await generateUniqueSubjectCode(normalizedName) });
  const { data, error } = await operation.select('*').single();
  if (error) throw subjectError(error, 'Failed to assign handled class');
  return mapSubject(data);
}

async function removeHandledClass({ teacherId, subjectId, assignedBy }) {
  const subject = await findTeacherSubject(teacherId, subjectId, { includeInactive: true });
  if (!subject || subject.assignmentSource !== 'headteacher' || subject.assignedBy !== referenceId(assignedBy)) return null;
  const { data, error } = await getSupabaseStorageClient().from('subjects')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', subject.id).eq('teacher_id', referenceId(teacherId))
    .eq('assignment_source', 'headteacher').eq('assigned_by', referenceId(assignedBy))
    .select('*').single();
  if (error) throw subjectError(error, 'Failed to remove handled class assignment');
  return mapSubject(data);
}

async function updateTeacherSubject(teacherId, subjectId, changes = {}) {
  const subject = await findTeacherSubject(teacherId, subjectId);
  if (!subject) return null;
  const values = { updated_at: new Date().toISOString() };
  if (changes.className !== undefined) values.class_name = String(changes.className || '').trim();
  if (changes.description !== undefined) values.description = String(changes.description || '').trim();
  if (changes.isActive !== undefined) values.is_active = changes.isActive === true;
  const { data, error } = await getSupabaseStorageClient().from('subjects').update(values)
    .eq('id', subject.id).eq('teacher_id', subject.teacherId).select('*').single();
  if (error) throw subjectError(error, 'Failed to update class in Supabase');
  return mapSubject(data);
}

async function deleteTeacherSubject(teacherId, subjectId) {
  const subject = await findTeacherSubject(teacherId, subjectId, { includeInactive: true });
  if (!subject) return null;
  const { error } = await getSupabaseStorageClient().from('subjects').delete()
    .eq('id', subject.id).eq('teacher_id', subject.teacherId);
  if (error) throw subjectError(error, 'Failed to delete class from Supabase');
  return subject;
}

async function updateAttendanceClassName(teacherId, subjectId, className) {
  const { error } = await getSupabaseStorageClient().from('attendance_records')
    .update({ class_name: String(className || '').trim(), updated_at: new Date().toISOString() })
    .eq('teacher_id', referenceId(teacherId)).eq('subject_id', referenceId(subjectId));
  if (error) throw subjectError(error, 'Failed to update attendance class name in Supabase');
}

async function getTeacherSubjectCounts(teacherId) {
  const normalizedTeacherId = referenceId(teacherId);
  const client = getSupabaseStorageClient();
  const results = await Promise.all([
    client.from('lessons').select('subject_id').eq('created_by', normalizedTeacherId).not('subject_id', 'is', null),
    client.from('assessments').select('subject_id').eq('created_by', normalizedTeacherId).not('subject_id', 'is', null),
    client.from('subject_enrollments').select('subject_id,student_id,status').eq('teacher_id', normalizedTeacherId),
    client.from('attendance_records').select('subject_id').eq('teacher_id', normalizedTeacherId)
      .eq('attendance_scope', 'handled_class').not('subject_id', 'is', null),
  ]);
  const failed = results.find((result) => result.error);
  if (failed) throw subjectError(failed.error, 'Failed to count class records in Supabase');

  const enrollmentRows = results[2].data || [];
  const approvedStudentIds = [...new Set(enrollmentRows
    .filter((row) => row.status === 'approved' && row.student_id)
    .map((row) => String(row.student_id)))];
  let activeStudentIds = new Set();
  if (approvedStudentIds.length > 0) {
    const { data: studentRows, error: studentError } = await client.from('users')
      .select('id,status')
      .in('id', approvedStudentIds)
      .eq('role', 'student');
    if (studentError) throw subjectError(studentError, 'Failed to count active class students in Supabase');
    activeStudentIds = new Set((studentRows || [])
      .filter((row) => String(row.status || '').toLowerCase() === 'active')
      .map((row) => String(row.id)));
  }

  const countBy = (rows, predicate = () => true) => (rows || []).reduce((map, row) => {
    if (predicate(row) && row.subject_id) map.set(String(row.subject_id), (map.get(String(row.subject_id)) || 0) + 1);
    return map;
  }, new Map());
  return {
    lessons: countBy(results[0].data),
    assessments: countBy(results[1].data),
    approvedEnrollments: countBy(enrollmentRows, (row) => row.status === 'approved'),
    activeApprovedEnrollments: countBy(enrollmentRows, (row) => (
      row.status === 'approved' && activeStudentIds.has(String(row.student_id || ''))
    )),
    pendingEnrollments: countBy(enrollmentRows, (row) => row.status === 'pending'),
    attendance: countBy(results[3].data),
  };
}

module.exports = {
  assignHandledClass,
  deleteTeacherSubject,
  ensureTeacherSubject,
  findSubjectByCode,
  findTeacherSubject,
  getTeacherSubjectCounts,
  listTeacherSubjects,
  mapSubject,
  removeHandledClass,
  updateAttendanceClassName,
  updateTeacherSubject,
};
