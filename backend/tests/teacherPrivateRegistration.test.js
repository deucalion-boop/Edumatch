const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
let client;
let emails;
require('../services/supabaseStorageService').getSupabaseStorageClient = () => client;
require('../services/gmailService').sendEmailViaGmail = async () => { emails++; return { sent: true }; };
const { create } = require('../controllers/teacherPrivateRegistrationController');
const { completeInvite, validateInvite } = require('../controllers/authController');
const head = { _id: 'head', role: 'headteacher', status: 'active', department: 'MAPEH' };
function fixture() {
  emails = 0;
  client = createFakeSupabase({ users: [{ id: 'head', role: 'headteacher', status: 'active', department: 'MAPEH' }] });
}
async function invoke(action, request = {}) {
  let response;
  await action({ user: head, body: {}, protocol: 'https', get: () => 'school.example.test', ...request }, {
    status() { return this; }, json(value) { response = value; return this; },
  }, error => { throw error; });
  return response;
}
const details = { fullName: 'Maria Santos', email: 'maria@school.edu.ph', username: 'maria.santos', password: 'Password123!', department: 'MAPEH' };
// Old single-use links must remain valid after changing the creation endpoint.
async function createLegacy(req,res,next) {
  try {
    const {createSupabaseAccount}=require('../services/supabaseAccountService');
    const {issueInviteForUser}=require('../services/userManagementService');
    const user=await createSupabaseAccount({name:'Pending teacher registration',email:'edumatch.invite+legacy@gmail.com',username:'invite_legacy',role:'teacher',status:'pending',department:'MAPEH',subject:'MAPEH',managedBy:'head'});
    const invite=await issueInviteForUser({user,req,privateRegistration:true,shareOnly:true});
    user.invite.teacherRegistration={headTeacherId:'head',department:'MAPEH'};
    await user.save();
    res.json({invite});
  } catch(error) { next(error); }
}

test('legacy one-teacher links preserve their pending account metadata', async () => {
  fixture();
  const result = await invoke(createLegacy);
  assert.match(result.invite.inviteLink, /\/auth\/invite\/[a-f0-9]{64}$/);
  const teacher = client.tables.users.find(user => user.role === 'teacher');
  assert.equal(teacher.status, 'pending');
  assert.equal(teacher.managed_by, 'head');
  assert.equal(teacher.department, 'MAPEH');
  assert.equal(teacher.invite.selfRegistration, true);
  assert.equal(emails, 0);
});

test('teacher registration locks the department and preserves the Head Teacher assignment', async () => {
  fixture();
  const result = await invoke(createLegacy);
  const params = { token: result.invite.inviteLink.split('/').at(-1) };
  assert.equal((await invoke(validateInvite, { params })).invite.departmentLocked, true);
  await assert.rejects(invoke(completeInvite, { params, body: { ...details, department: 'Science' } }), { statusCode: 400 });
  await invoke(completeInvite, { params, body: details });
  const teacher = client.tables.users.find(user => user.role === 'teacher');
  assert.equal(teacher.name, details.fullName);
  assert.equal(teacher.email, details.email);
  assert.equal(teacher.status, 'active');
  assert.equal(teacher.department, 'MAPEH');
  assert.equal(teacher.managed_by, 'head');
  await assert.rejects(invoke(completeInvite, { params, body: details }), { statusCode: 400 });
});

test('registration rejects an unavailable inviting Head Teacher', async () => {
  fixture();
  const result = await invoke(createLegacy);
  client.tables.users[0].status = 'inactive';
  await assert.rejects(invoke(completeInvite, { params: { token: result.invite.inviteLink.split('/').at(-1) }, body: details }), { statusCode: 409 });
  assert.equal(client.tables.users.find(user => user.role === 'teacher').status, 'pending');
});

test('a teacher cannot issue teacher registration links', async () => {
  fixture();
  await assert.rejects(invoke(create, { user: { ...head, role: 'teacher' } }), { statusCode: 403 });
  assert.equal(client.tables.users.length, 1);
});
test('Head Teacher creation returns a reusable managed department group link', async () => {
  fixture();
  const service=require('../services/teacherInvitationService');
  const original=service.createGroupInvitation;
  let owner;
  service.createGroupInvitation=async id=> { owner=id; return {invitation:{id:'group',invitationUrl:'https://school.example.test/auth/teacher-register/token',expiresAt:'2030-01-01T00:00:00Z'}}; };
  try {
    const result=await invoke(create);
    assert.equal(owner,'head');
    assert.equal(result.invite.multipleAccounts,true);
    assert.equal(result.invite.id,'group');
    assert.equal(result.department,'MAPEH');
    assert.equal(client.tables.users.length,1);
    assert.equal(emails,0);
  } finally { service.createGroupInvitation=original; }
});
