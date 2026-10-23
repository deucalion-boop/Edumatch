const { getSupabaseStorageClient } = require('./supabaseStorageService');
const { findSupabaseAccount, listSupabaseAccounts } = require('./supabaseAccountService');
const { DEFAULT_SECTION_NAMES, normalizeSectionName } = require('../constants/sections');
const { ROLE_TEACHER, ROLE_STUDENT } = require('../constants/userRoles');
const { normalizeStrand, getSubjectCategory } = require('../constants/strandSubjects');
const { ensureTeacherSubject, listTeacherSubjects, mapSubject } = require('./subjectService');

function normalizeSectionId(value) {
  return String(value?._id || value?.id || value || '').trim();
}

function sectionError(error, fallbackMessage) {
  const normalized = new Error(String(error?.message || fallbackMessage));
  normalized.name = 'SupabaseSectionError';
  normalized.code = error?.code;
  normalized.details = error?.details;
  normalized.hint = error?.hint;
  normalized.statusCode = error?.code === '23505' ? 409 : 500;
  return normalized;
}

function mapSectionRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: normalizeSectionName(row.name),
    isActive: row.is_active === true,
    description: String(row.description || '').trim(),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function ensureDefaultSections() {
  const names = DEFAULT_SECTION_NAMES
    .map(normalizeSectionName)
    .filter(Boolean);
  if (names.length === 0) return;

  const client = getSupabaseStorageClient();
  const { data: existing, error: readError } = await client.from('sections').select('name');
  if (readError) throw sectionError(readError, 'Failed to read default sections from Supabase');
  const savedNames = new Set((existing || []).map((row) => normalizeSectionName(row.name).toLowerCase()));
  const rows = names.filter((name) => !savedNames.has(name.toLowerCase()))
    .map((name) => ({ name, is_active: true, description: '' }));
  if (!rows.length) return;
  const { error } = await client.from('sections').insert(rows);
  if (error) throw sectionError(error, 'Failed to create default sections in Supabase');
}

async function findSectionById(sectionId, { includeInactive = false } = {}) {
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) return null;

  const client = getSupabaseStorageClient();
  let query = client.from('sections').select('*').eq('id', normalizedSectionId);
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw sectionError(error, 'Failed to read section from Supabase');
  return mapSectionRow(data);
}

async function getSectionOrThrow(sectionId, options = {}) {
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) {
    const error = new Error('sectionId is required');
    error.statusCode = 400;
    throw error;
  }

  const section = await findSectionById(normalizedSectionId, options);
  if (!section) {
    const error = new Error(options.message || 'Section not found');
    error.statusCode = 404;
    throw error;
  }
  return section;
}

async function getAssignableSectionOrThrow(sectionId, { teacherId = '' } = {}) {
  const section = await getSectionOrThrow(sectionId);
  const normalizedTeacherId = normalizeSectionId(teacherId);
  const client = getSupabaseStorageClient();
  let query = client.from('users').select('id,name,subject,department')
    .eq('role', ROLE_TEACHER).eq('advisory_section_id', section.id);
  if (normalizedTeacherId) query = query.neq('id', normalizedTeacherId);
  const { data: adviser, error } = await query.limit(1).maybeSingle();
  if (error) throw sectionError(error, 'Failed to check section assignment');
  if (adviser) {
    const subject = String(adviser.subject || adviser.department || 'another teacher').trim();
    const name = String(adviser.name || '').trim();
    const conflict = new Error(`Section "${section.name}" is already assigned to ${subject}${name ? ` (${name})` : ''}. Choose a different section.`);
    conflict.statusCode = 409;
    throw conflict;
  }
  return section;
}

async function findTeacherByAdvisorySection(sectionId) {
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) return null;

  const accounts = await listSupabaseAccounts();
  return accounts.find((account) => (
    String(account?.role || '').trim() === ROLE_TEACHER
    && normalizeSectionId(account?.advisorySectionId) === normalizedSectionId
  )) || null;
}

async function syncStudentsForSection(sectionId) {
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) return;

  const accounts = await listSupabaseAccounts();
  const teacher = accounts.find((account) => (
    String(account?.role || '').trim() === ROLE_TEACHER
    && normalizeSectionId(account?.advisorySectionId) === normalizedSectionId
  )) || null;
  const students = accounts.filter((account) => (
    String(account?.role || '').trim() === ROLE_STUDENT
    && normalizeSectionId(account?.sectionId) === normalizedSectionId
  ));

  await Promise.all(students.map(async (student) => {
    const enrollment = { ...(student.enrollment || {}) };
    if (teacher) {
      student.managedBy = teacher._id || teacher.id;
      student.department = String(teacher.department || '').trim();
      enrollment.teacherId = teacher._id || teacher.id;
      enrollment.status = 'approved';
      enrollment.approvedAt = new Date().toISOString();
    } else {
      student.managedBy = null;
      student.department = '';
      enrollment.teacherId = null;
      enrollment.status = '';
      enrollment.approvedAt = null;
    }
    student.enrollment = enrollment;
    await student.save();
  }));
}

async function syncStudentSectionAdviser(studentId) {
  const normalizedStudentId = String(studentId?._id || studentId?.id || studentId || '').trim();
  if (!normalizedStudentId) return null;

  const student = await findSupabaseAccount('id', normalizedStudentId);
  if (!student || String(student.role || '').trim() !== ROLE_STUDENT) return null;

  const sectionId = normalizeSectionId(student.sectionId);
  if (!sectionId) {
    student.managedBy = null;
    student.department = '';
    student.enrollment = {
      ...(student.enrollment || {}),
      teacherId: null,
      status: '',
      approvedAt: null,
    };
    await student.save();
    return null;
  }

  await syncStudentsForSection(sectionId);
  return sectionId;
}

async function syncTeacherAdvisoryAssignments({ previousSectionId = '', nextSectionId = '' } = {}) {
  const uniqueSectionIds = [...new Set(
    [previousSectionId, nextSectionId].map(normalizeSectionId).filter(Boolean)
  )];
  await Promise.all(uniqueSectionIds.map(syncStudentsForSection));
}

async function ensureTeacherAdvisoryClass(teacher, { allowDefault = false, onlyIfEmpty = false } = {}) {
  const teacherId = normalizeSectionId(teacher?._id || teacher?.id);
  const sectionId = normalizeSectionId(teacher?.advisorySectionId);
  if (!teacherId || (!sectionId && !allowDefault)) return null;
  const classes = await listTeacherSubjects(teacherId, { includeInactive: true });
  if (onlyIfEmpty && classes.some(entry => entry.isActive)) return null;
  const section = sectionId ? await getSectionOrThrow(sectionId) : null;
  // The trusted marker, rather than a display name, identifies the default
  // advisory class after a teacher renames it. General class APIs cannot set it.
  const marked = sectionId ? classes.find(entry => entry.advisorySectionId === sectionId) : null;
  if (marked) {
    if (marked.isActive) return marked;
    const { data, error } = await getSupabaseStorageClient().from('subjects')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', marked.id).eq('teacher_id', teacherId).eq('advisory_section_id', sectionId).select('*').single();
    if (error) throw sectionError(error, 'Failed to restore the advisory class');
    return mapSubject(data);
  }

  const subject = String(teacher.subject || teacher.department || '').trim();
  if (!subject) {
    const error = new Error('The selected teacher has no assigned subject');
    error.statusCode = 400;
    throw error;
  }

  const track = normalizeStrand(teacher.strand) || 'GENERAL';
  const className = `${subject} 10 - ${section?.name || 'Advisory'}`;
  const findExistingClass = async () => {
    const saved = await listTeacherSubjects(teacherId, { includeInactive: true });
    return saved.find(entry => sectionId && entry.advisorySectionId === sectionId) || saved.find((entry) => (
      entry.name.toLowerCase() === subject.toLowerCase()
      && entry.track.toLowerCase() === track.toLowerCase()
      && entry.className.toLowerCase() === className.toLowerCase()
      && (!entry.advisorySectionId || entry.advisorySectionId === sectionId)
    ));
  };
  const markClass = async (entry) => {
    if (!sectionId || entry.advisorySectionId === sectionId) return entry;
    if (entry.advisorySectionId) throw Object.assign(new Error('The default advisory class belongs to a different section. Contact your administrator.'), { statusCode: 409 });
    const { data, error } = await getSupabaseStorageClient().from('subjects')
      .update({ advisory_section_id: sectionId, assignment_source: 'advisory', updated_at: new Date().toISOString() })
      .eq('id', entry.id).eq('teacher_id', teacherId).select('*').single();
    if (error) throw sectionError(error, 'Failed to identify the default advisory class');
    return mapSubject(data);
  };
  const existing = await findExistingClass();
  if (existing?.isActive) return markClass(existing);

  try {
    const created = await ensureTeacherSubject({
      teacherId,
      name: subject,
      track,
      className,
      subjectCategory: existing?.subjectCategory || getSubjectCategory(subject),
      department: existing?.department || String(teacher.department || '').trim(),
      description: existing?.description || '',
    });
    return await markClass(created);
  } catch (error) {
    if (error.code === '23505') {
      const concurrentClass = await findExistingClass();
      if (concurrentClass?.isActive) return markClass(concurrentClass);
    }
    throw error;
  }
}

async function listAssignedSectionAdvisers() {
  const client = getSupabaseStorageClient();
  const pageSize = 500;
  const advisers = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from('users')
      .select('id,name,email,department,subject,status,profile_image,advisory_section_id')
      .eq('role', ROLE_TEACHER)
      .not('advisory_section_id', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw sectionError(error, 'Failed to list section advisers');
    advisers.push(...(data || []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      department: row.department,
      subject: row.subject,
      status: row.status,
      profileImage: row.profile_image,
      advisorySectionId: row.advisory_section_id,
    })));
    if ((data || []).length < pageSize) return advisers;
  }
}

async function listSectionsWithAdvisers() {
  await ensureDefaultSections();

  const client = getSupabaseStorageClient();
  const [{ data: rows, error }, accounts, advisers] = await Promise.all([
    client.from('sections').select('*').order('name', { ascending: true }),
    listSupabaseAccounts(),
    listAssignedSectionAdvisers(),
  ]);
  if (error) throw sectionError(error, 'Failed to list sections from Supabase');

  const students = accounts.filter((account) => String(account?.role || '').trim() === ROLE_STUDENT);
  const adviserBySectionId = new Map(
    advisers
      .map((teacher) => [normalizeSectionId(teacher.advisorySectionId), teacher])
      .filter(([sectionId]) => Boolean(sectionId))
  );
  const advisersBySectionId = new Map();
  advisers.forEach((teacher) => {
    const sectionId = normalizeSectionId(teacher.advisorySectionId);
    if (!sectionId) return;
    if (!advisersBySectionId.has(sectionId)) advisersBySectionId.set(sectionId, []);
    advisersBySectionId.get(sectionId).push(teacher);
  });
  const studentCountBySectionId = new Map();
  students.forEach((student) => {
    const sectionId = normalizeSectionId(student.sectionId);
    if (!sectionId) return;
    studentCountBySectionId.set(sectionId, (studentCountBySectionId.get(sectionId) || 0) + 1);
  });

  const mapAdviser = (adviser) => ({
    id: String(adviser._id || adviser.id || '').trim(),
    name: String(adviser.name || '').trim(),
    email: String(adviser.email || '').trim(),
    department: String(adviser.department || '').trim(),
    subject: String(adviser.subject || adviser.department || '').trim(),
    status: String(adviser.status || '').trim().toLowerCase(),
    profileImage: String(adviser.profileImage || '').trim(),
  });

  return (rows || []).map((row) => {
    const section = mapSectionRow(row);
    const adviser = adviserBySectionId.get(section.id) || null;
    return {
      ...section,
      studentCount: Number(studentCountBySectionId.get(section.id) || 0),
      adviser: adviser ? mapAdviser(adviser) : null,
      advisers: (advisersBySectionId.get(section.id) || []).map(mapAdviser),
    };
  });
}

module.exports = {
  ensureDefaultSections,
  findSectionById,
  getSectionOrThrow,
  getAssignableSectionOrThrow,
  findTeacherByAdvisorySection,
  syncStudentsForSection,
  syncStudentSectionAdviser,
  syncTeacherAdvisoryAssignments,
  ensureTeacherAdvisoryClass,
  listSectionsWithAdvisers,
  normalizeSectionId,
};
