const service = require('../services/teacherInvitationService');
const { getSupabaseStorageClient } = require('../services/supabaseStorageService');
const { sendSuccess } = require('../utils/responseHelper');
const wrap = fn => async (req,res,next) => { try { await fn(req,res); } catch(error) { next(error); } };
function mapLink(invitation) {
  return {id:invitation.id,inviteLink:invitation.invitationUrl,expiresAt:invitation.expiresAt,
    revokedAt:invitation.status==='Revoked' ? true : null,status:invitation.status,
    registrationCount:invitation.registrationCount,multipleAccounts:true};
}
exports.create=wrap(async(req,res)=> {
  if(req.user.role!=='headteacher' || req.user.status!=='active' || !req.user.department) throw Object.assign(new Error('An active Head Teacher with an assigned department is required.'),{statusCode:403});
  const {invitation}=await service.createGroupInvitation(String(req.user._id),{});
  sendSuccess(res,201,'Reusable teacher registration link created.',{
    invite:{id:invitation.id,inviteLink:invitation.invitationUrl,inviteExpiresAt:invitation.expiresAt,multipleAccounts:true},
    department:req.user.department,
  });
});
exports.list=wrap(async(req,res)=> {
  const invitations=await service.listInvitations(String(req.user._id));
  res.json({links:invitations.filter(row=>row.isGroup).map(mapLink)});
});
exports.revoke=wrap(async(req,res)=> {
  await service.revokeInvitation(String(req.user._id),req.params.id);
  res.json({message:'Link revoked. Registered teacher accounts are unchanged.'});
});
exports.remove=wrap(async(req,res)=> {
  // Lock/validate through the existing RPC before deletion so registrations
  // cannot race with removal. Deleting claims does not delete teacher accounts.
  await service.revokeInvitation(String(req.user._id),req.params.id);
  const {error}=await getSupabaseStorageClient().from('teacher_invitations').delete().eq('id',req.params.id).eq('headteacher_id',String(req.user._id));
  if(error) throw Object.assign(new Error('Unable to remove teacher registration link.'),{statusCode:400});
  res.json({message:'Link removed. Registered teacher accounts are unchanged.'});
});
