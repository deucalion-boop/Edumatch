const { getSupabaseStorageClient } = require('./supabaseStorageService');

const clean = (value) => String(value || '').trim();
function fail(message, statusCode = 400) { return Object.assign(new Error(message), { statusCode }); }
function payload(input = {}) {
  const name = clean(input.name); const gradeLevel = 'Grade 10'; const schoolYear = clean(input.schoolYear);
  const strand = clean(input.strand); const capacity = Number(input.capacity);
  if (!name || name.length > 80) throw fail('Section name is required and must be 80 characters or fewer');
  if (!/^\d{4}-\d{4}$/.test(schoolYear)) throw fail('School year must use YYYY-YYYY format');
  const [start, end] = schoolYear.split('-').map(Number); if (end !== start + 1) throw fail('School year must cover consecutive years');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) throw fail('Capacity must be between 1 and 200');
  return { name, grade_level: gradeLevel, strand, school_year: schoolYear, capacity };
}
async function references(client, id) {
  const tables = [['users','section_id'],['users','advisory_section_id'],['subjects','advisory_section_id'],['subject_enrollments','section_id'],['attendance_records','section_id']];
  const counts = await Promise.all(tables.map(async ([table, field]) => { const r=await client.from(table).select('id',{count:'exact',head:true}).eq(field,id); if(r.error) throw r.error; return Number(r.count||0); }));
  return counts.reduce((a,b)=>a+b,0);
}
async function listManagedSections() {
  const c=getSupabaseStorageClient(); const [{data,error},{data:students,error:ue}]=await Promise.all([c.from('sections').select('*').order('school_year',{ascending:false}).order('grade_level').order('name'),c.from('users').select('id,section_id').eq('role','student').eq('status','active')]);
  if(error||ue) throw fail(error?.message||ue?.message||'Unable to load sections',500); const counts=new Map(); (students||[]).forEach(s=>counts.set(s.section_id,(counts.get(s.section_id)||0)+1));
  return (data||[]).map(s=>({id:s.id,name:s.name,gradeLevel:s.grade_level,strand:s.strand,schoolYear:s.school_year,capacity:s.capacity,enrolledCount:counts.get(s.id)||0,availableSlots:Math.max(s.capacity-(counts.get(s.id)||0),0),status:s.is_active?'active':'archived',isActive:s.is_active}));
}
async function createManagedSection(body){const c=getSupabaseStorageClient();const {data,error}=await c.from('sections').insert({...payload(body),is_active:true}).select('*').single();if(error)throw fail(error.code==='23505'?'A section with this name, grade level, and school year already exists':error.message,error.code==='23505'?409:500);return data;}
async function updateManagedSection(id,body){const c=getSupabaseStorageClient();const next=payload(body);const enrolled=(await listManagedSections()).find(s=>s.id===id)?.enrolledCount||0;if(next.capacity<enrolled)throw fail(`Capacity cannot be lower than the ${enrolled} currently enrolled students`,409);const {data,error}=await c.from('sections').update({...next,updated_at:new Date().toISOString()}).eq('id',id).select('*').maybeSingle();if(error)throw fail(error.message,error.code==='23505'?409:500);if(!data)throw fail('Section not found',404);return data;}
async function setSectionArchived(id,archived){const c=getSupabaseStorageClient();const {data,error}=await c.from('sections').update({is_active:!archived,updated_at:new Date().toISOString()}).eq('id',id).select('*').maybeSingle();if(error)throw fail(error.message,500);if(!data)throw fail('Section not found',404);return data;}
async function deleteManagedSection(id){const c=getSupabaseStorageClient();if(await references(c,id))throw fail('This section is referenced by students or school records. Archive it instead.',409);const {error}=await c.from('sections').delete().eq('id',id);if(error)throw fail(error.message,500);}
module.exports={listManagedSections,createManagedSection,updateManagedSection,setSectionArchived,deleteManagedSection};
