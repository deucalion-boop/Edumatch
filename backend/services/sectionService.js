const Section = require('../models/Section');
const User = require('../models/User');
const { DEFAULT_SECTION_NAMES, normalizeSectionName } = require('../constants/sections');
const { ROLE_TEACHER, ROLE_STUDENT } = require('../constants/userRoles');

function normalizeSectionId(value) {
  return String(value?._id || value || '').trim();
}

async function ensureDefaultSections() {
  for (const sectionName of DEFAULT_SECTION_NAMES) {
    const normalizedName = normalizeSectionName(sectionName);
    if (!normalizedName) continue;

    await Section.updateOne(
      { name: normalizedName },
      {
        $setOnInsert: {
          name: normalizedName,
          isActive: true,
          description: '',
        },
      },
      { upsert: true }
    );
  }
}

async function getSectionOrThrow(sectionId, options = {}) {
  const { includeInactive = false, message = 'Section not found' } = options;
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) {
    const error = new Error('sectionId is required');
    error.statusCode = 400;
    throw error;
  }

  const query = { _id: normalizedSectionId };
  if (!includeInactive) {
    query.isActive = true;
  }

  const section = await Section.findOne(query);
  if (!section) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }

  return section;
}

async function findTeacherByAdvisorySection(sectionId) {
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) return null;

  return User.findOne({
    role: ROLE_TEACHER,
    advisorySectionId: normalizedSectionId,
  })
    .select('_id name email department subject advisorySectionId status profileImage')
    .lean();
}

async function syncStudentsForSection(sectionId) {
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) return;

  const teacher = await findTeacherByAdvisorySection(normalizedSectionId);
  const updatePayload = teacher
    ? {
      managedBy: teacher._id,
      department: String(teacher.department || '').trim(),
      'enrollment.teacherId': teacher._id,
      'enrollment.status': 'approved',
      'enrollment.approvedAt': new Date(),
    }
    : {
      managedBy: null,
      department: '',
      'enrollment.teacherId': null,
      'enrollment.status': '',
      'enrollment.approvedAt': null,
    };

  await User.updateMany(
    {
      role: ROLE_STUDENT,
      sectionId: normalizedSectionId,
    },
    {
      $set: updatePayload,
    }
  );
}

async function syncStudentSectionAdviser(studentId) {
  const normalizedStudentId = normalizeSectionId(studentId);
  if (!normalizedStudentId) return null;

  const student = await User.findOne({
    _id: normalizedStudentId,
    role: ROLE_STUDENT,
  }).select('_id sectionId');

  if (!student) return null;

  const sectionId = normalizeSectionId(student.sectionId);
  if (!sectionId) {
    await User.updateOne(
      { _id: student._id },
      {
        $set: {
          managedBy: null,
          department: '',
          'enrollment.teacherId': null,
          'enrollment.status': '',
          'enrollment.approvedAt': null,
        },
      }
    );
    return null;
  }

  await syncStudentsForSection(sectionId);
  return sectionId;
}

async function syncTeacherAdvisoryAssignments({ previousSectionId = '', nextSectionId = '' } = {}) {
  const uniqueSectionIds = [...new Set([previousSectionId, nextSectionId].map(normalizeSectionId).filter(Boolean))];
  for (const sectionId of uniqueSectionIds) {
    await syncStudentsForSection(sectionId);
  }
}

async function listSectionsWithAdvisers() {
  await ensureDefaultSections();

  const sections = await Section.find({})
    .sort({ name: 1 })
    .lean();

  const sectionIds = sections.map((section) => section._id);
  const [advisers, studentCounts] = await Promise.all([
    sectionIds.length > 0
      ? User.find({
        role: ROLE_TEACHER,
        advisorySectionId: { $in: sectionIds },
      })
        .select('_id name email department subject advisorySectionId status profileImage')
        .lean()
      : [],
    sectionIds.length > 0
      ? User.aggregate([
        {
          $match: {
            role: ROLE_STUDENT,
            sectionId: { $in: sectionIds },
          },
        },
        {
          $group: {
            _id: '$sectionId',
            count: { $sum: 1 },
          },
        },
      ])
      : [],
  ]);

  const adviserBySectionId = new Map(
    advisers.map((teacher) => [normalizeSectionId(teacher.advisorySectionId), teacher])
  );
  const studentCountBySectionId = new Map(
    studentCounts.map((row) => [normalizeSectionId(row._id), Number(row.count || 0)])
  );

  return sections.map((section) => {
    const adviser = adviserBySectionId.get(normalizeSectionId(section._id)) || null;
    return {
      id: normalizeSectionId(section._id),
      name: normalizeSectionName(section.name),
      isActive: section.isActive === true,
      description: String(section.description || '').trim(),
      studentCount: Number(studentCountBySectionId.get(normalizeSectionId(section._id)) || 0),
      adviser: adviser
        ? {
          id: normalizeSectionId(adviser._id),
          name: String(adviser.name || '').trim(),
          email: String(adviser.email || '').trim(),
          department: String(adviser.department || '').trim(),
          subject: String(adviser.subject || adviser.department || '').trim(),
          status: String(adviser.status || '').trim().toLowerCase(),
          profileImage: String(adviser.profileImage || '').trim(),
        }
        : null,
    };
  });
}

module.exports = {
  ensureDefaultSections,
  getSectionOrThrow,
  findTeacherByAdvisorySection,
  syncStudentsForSection,
  syncStudentSectionAdviser,
  syncTeacherAdvisoryAssignments,
  listSectionsWithAdvisers,
  normalizeSectionId,
};
