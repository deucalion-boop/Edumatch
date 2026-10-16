const { getSupabaseStorageClient } = require('./supabaseStorageService');
const { isArchivedStudent } = require('../utils/studentArchive');
const idOf = value => String(value?._id || value?.id || value || '').trim();

async function readAll(table, columns, field, ids) {
  const records = [];
  for (let first = 0; first < ids.length; first += 200) {
    const chunk = ids.slice(first, first + 200);
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await getSupabaseStorageClient().from(table).select(columns).in(field, chunk)
        .order('id', { ascending: true }).range(offset, offset + 499);
      if (error) throw Object.assign(new Error('Unable to load teacher monitoring records.'), { statusCode: 503 });
      records.push(...(data || []));
      if ((data || []).length < 500) break;
    }
  }
  return records;
}

async function buildFacultyMonitoring(accounts) {
  const teachers = accounts.filter(account => account.role === 'teacher');
  const teacherIds = teachers.map(idOf);
  const teacherMap = new Map(teachers.map(teacher => [idOf(teacher), teacher]));
  const students = new Set(accounts.filter(account => account.role === 'student' && account.status !== 'pending'
    && !isArchivedStudent(account)).map(idOf));
  const sectionIds = [...new Set(teachers.map(teacher => idOf(teacher.advisorySectionId)).filter(Boolean))];
  const [subjects, enrollments, sections] = await Promise.all([
    readAll('subjects', 'id,teacher_id,name,class_name,code,is_active,advisory_section_id', 'teacher_id', teacherIds),
    readAll('subject_enrollments', 'id,teacher_id,subject_id,student_id,status', 'teacher_id', teacherIds),
    readAll('sections', 'id,name,is_active', 'id', sectionIds),
  ]);
  const sectionMap = new Map(sections.map(section => [section.id, section]));
  const activeSubjects = subjects.filter(subject => subject.is_active === true);
  const classStudents = new Map(activeSubjects.map(subject => [subject.id, new Set()]));
  const subjectMap = new Map(activeSubjects.map(subject => [subject.id, subject]));
  for (const enrollment of enrollments) {
    if (enrollment.status !== 'approved' || !students.has(enrollment.student_id)
      || subjectMap.get(enrollment.subject_id)?.teacher_id !== enrollment.teacher_id) continue;
    classStudents.get(enrollment.subject_id).add(enrollment.student_id);
  }
  const monitoring = new Map();
  for (const faculty of accounts.filter(account => ['teacher', 'headteacher'].includes(account.role))) {
    const ownedTeachers = faculty.role === 'teacher' ? [idOf(faculty)] : teachers.filter(teacher => (
      idOf(teacher.managedBy) === idOf(faculty) && teacher.department === faculty.department
    )).map(idOf);
    const ownedIds = new Set(ownedTeachers);
    const classes = activeSubjects.filter(subject => ownedIds.has(subject.teacher_id)).map(subject => ({
      id: subject.id, className: subject.class_name || subject.name, subject: subject.name,
      code: subject.code || '', teacherName: teacherMap.get(subject.teacher_id)?.name || '',
      studentCount: classStudents.get(subject.id).size,
    }));
    const uniqueStudents = new Set(classes.flatMap(subject => [...classStudents.get(subject.id)]));
    const section = sectionMap.get(idOf(faculty.advisorySectionId));
    monitoring.set(idOf(faculty), {
      assignedSubject: faculty.role === 'teacher' ? faculty.subject || '' : '',
      advisorySection: section ? { id: section.id, name: section.name, isActive: section.is_active } : null,
      classCount: classes.length, studentCount: uniqueStudents.size, classes,
      workloadScope: faculty.role === 'headteacher' ? 'managed_teachers' : 'own_classes',
    });
  }
  return monitoring;
}

module.exports = { buildFacultyMonitoring };
