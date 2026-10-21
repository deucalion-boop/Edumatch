const { sendSuccess } = require('../utils/responseHelper');
const { listSectionsWithAdvisers, normalizeSectionId } = require('../services/sectionService');
const management = require('../services/sectionManagementService');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getSectionDirectory = asyncHandler(async (req, res) => {
  const sections = await listSectionsWithAdvisers();
  const advisorySectionId = normalizeSectionId(req.user?.advisorySectionId);
  const advisorySection = sections.find((section) => section.id === advisorySectionId) || null;

  return sendSuccess(res, 200, 'Sections fetched successfully', {
    sections,
    advisorySection,
  });
});

module.exports = {
  getSectionDirectory,
  listManagedSections: asyncHandler(async (_req,res)=>sendSuccess(res,200,'Sections fetched successfully',{sections:await management.listManagedSections()})),
  createManagedSection: asyncHandler(async (req,res)=>sendSuccess(res,201,'Section created successfully',{section:await management.createManagedSection(req.body)})),
  updateManagedSection: asyncHandler(async (req,res)=>sendSuccess(res,200,'Section updated successfully',{section:await management.updateManagedSection(req.params.id,req.body)})),
  archiveManagedSection: asyncHandler(async (req,res)=>sendSuccess(res,200,req.body?.archived===false?'Section restored successfully':'Section archived successfully',{section:await management.setSectionArchived(req.params.id,req.body?.archived!==false)})),
  deleteManagedSection: asyncHandler(async (req,res)=>{await management.deleteManagedSection(req.params.id);return sendSuccess(res,200,'Section deleted successfully');}),
};
