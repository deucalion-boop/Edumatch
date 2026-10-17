const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { getSupabaseStorageClient: client } = require('../services/supabaseStorageService');
const { getSectionOrThrow, ensureTeacherAdvisoryClass } = require('../services/sectionService');
const { assertPasswordMeetsPolicy } = require('../utils/passwordPolicy');
const { assertAccountEmail } = require('../utils/emailPolicy');
const { findSupabaseAccount, deleteSupabaseAccount } = require('../services/supabaseAccountService');
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
const tokenFor = nonce => `pupil_${nonce}.${crypto.createHmac('sha256',process.env.JWT_SECRET).update(`student-registration:${nonce}`).digest('hex')}`;
const checked = result => {
  if (result.error) throw Object.assign(new Error(result.error.code === '23505' ? 'Email or username already exists.' : result.error.message), { statusCode: result.error.code === '23505' ? 409 : 400 });
  return result.data;
};
const wrap = fn => async (req,res,next) => { try { await fn(req,res); } catch(error) { next(error); } };
const base = req => String(process.env.APP_BASE_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`).replace(/\/+$/,'');
exports.createForTeacher = async (teacher,req) => {
  if (teacher.role !== 'teacher' || teacher.status !== 'active' || teacher.archive?.isArchived === true) throw Object.assign(new Error('An active advisory teacher is required.'),{statusCode:409});
  const section = await getSectionOrThrow(teacher.advisorySectionId);
  const advisoryClass = await ensureTeacherAdvisoryClass(teacher);
  const nonce = crypto.randomBytes(24).toString('hex');
  const row = checked(await client().from('student_registration_links').insert({teacher_id:teacher._id,section_id:section.id,subject_id:advisoryClass.id,nonce,token_hash:hash(tokenFor(nonce))}).select('*').single());
  return { invite:{id:row.id,inviteLink:`${base(req)}/auth/invite/${tokenFor(nonce)}`,inviteExpiresAt:row.expires_at,multipleAccounts:true},advisoryClass:{id:advisoryClass.id,className:advisoryClass.className},section:{id:section.id,name:section.name} };
};
exports.listForTeacher = async (teacher,req) => {
  const rows = checked(await client().from('student_registration_links').select('*').eq('teacher_id',teacher._id).eq('section_id',teacher.advisorySectionId || '').order('created_at',{ascending:false}));
  return rows.map(row=>({id:row.id,subjectId:row.subject_id,inviteLink:`${base(req)}/auth/invite/${tokenFor(row.nonce)}`,expiresAt:row.expires_at,revokedAt:row.revoked_at,registrationCount:row.registration_count,multipleAccounts:true}));
};
async function resolve(token) {
  const link = checked(await client().from('student_registration_links').select('*').eq('token_hash',hash(token)).maybeSingle());
  if (!link || link.revoked_at || Date.parse(link.expires_at)<=Date.now()) throw Object.assign(new Error('Student registration link expired, revoked, or invalid.'),{statusCode:410});
  const teacher = await findSupabaseAccount('id',link.teacher_id);
  if (!teacher || teacher.role!=='teacher' || teacher.status!=='active' || teacher.archive?.isArchived || teacher.advisorySectionId!==link.section_id) throw Object.assign(new Error('The advisory assignment is no longer available.'),{statusCode:409});
  await getSectionOrThrow(link.section_id);
  return link;
}
exports.validate = wrap(async(req,res)=> {
  const link = await resolve(req.params.token);
  res.json({invite:{role:'student',selfRegistration:true,expiresAt:link.expires_at,multipleAccounts:true}});
});
exports.complete = wrap(async(req,res)=> {
  await resolve(req.params.token);
  if (!req.body.password || req.body.password!==req.body.confirmPassword) return res.status(400).json({message:'Passwords must match.'});
  assertPasswordMeetsPolicy(req.body.password);
  const email = assertAccountEmail(req.body.email,'student');
  const id = checked(await client().rpc('register_student_link',{p_hash:hash(req.params.token),p_name:req.body.fullName,p_email:email,p_username:req.body.username,p_password_hash:await bcrypt.hash(req.body.password,12)}));
  res.status(201).json({user:{id},message:'Student account created.'});
});
async function manage(req,remove) {
  const row = checked(await client().from('student_registration_links').select('id,teacher_id').eq('id',req.params.id).maybeSingle());
  if (row) {
    await requireManagedTeacher(req.user,row.teacher_id);
    if(remove) checked(await client().from('student_registration_links').delete().eq('id',row.id).eq('teacher_id',row.teacher_id));
    else checked(await client().from('student_registration_links').update({revoked_at:new Date().toISOString()}).eq('id',row.id).eq('teacher_id',row.teacher_id));
    return;
  }
  // Existing single-student links can also be invalidated without touching registered students.
  const pending = await findSupabaseAccount('id',req.params.id);
  if (!pending || pending.role!=='student' || pending.status!=='pending' || pending.invite?.usedAt || !pending.invite?.studentRegistration || String(pending.managedBy)!==String(req.user._id)) throw Object.assign(new Error('Registration link not found.'),{statusCode:404});
  if(remove) await deleteSupabaseAccount(pending._id);
  else { pending.invite.tokenHash=''; pending.invite.revokedAt=new Date().toISOString(); await pending.save(); }
}
exports.revoke = wrap(async(req,res)=>{ await manage(req,false); res.json({message:'Link revoked. Existing registered students are unchanged.'}); });
exports.remove = wrap(async(req,res)=>{ await manage(req,true); res.json({message:'Link removed. Existing registered students are unchanged.'}); });
async function requireManagedTeacher(user,teacherId) {
  if(user.role==='teacher' && String(user._id)===String(teacherId)) return user;
  if(user.role==='headteacher') {
    const teacher=await findSupabaseAccount('id',teacherId);
    if(teacher && teacher.role==='teacher' && teacher.department===user.department && String(teacher.managedBy)===String(user._id)) return teacher;
  }
  throw Object.assign(new Error('Registration link not found.'),{statusCode:404});
}
exports.headTeacherList=wrap(async(req,res)=> {
  const teacher=await requireManagedTeacher(req.user,String(req.query.teacherId || ''));
  res.json({links:await exports.listForTeacher(teacher,req)});
});
