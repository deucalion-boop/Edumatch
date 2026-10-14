const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const ExcelJS = require('exceljs');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const controller = require('../controllers/classInvitationController');
let server;
let baseUrl;

test.before(async () => {
  const app = express();
  // Test the real upload/parser/controller boundary using a fixture identity.
  app.post('/preview', (req, _res, next) => { req.user = { _id: 'teacher' }; next(); },
    controller.rosterUpload, controller.preview);
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ message: error.message }));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
test.beforeEach(() => {
  client = createFakeSupabase({
    users: [{ id: 'teacher', name: 'Teacher', role: 'teacher', status: 'active', advisory_section_id: 'charity' }],
    subjects: [{ id: 'class-one', teacher_id: 'teacher', name: 'Science', is_active: true }],
    sections: [{ id: 'charity', name: 'Charity', is_active: true }, { id: 'hope', name: 'Hope', is_active: true }],
    class_registration_students: [],
  });
});
async function upload({ sectionId, headers = ['First Name', 'Last Name'], values = ['Maria', 'Santos'], instructions, excelTable = false } = {}) {
  const workbook = new ExcelJS.Workbook();
  const addInstructions = () => {
    const sheet = workbook.addWorksheet('Instructions');
    sheet.addRow(['EduMatch Student Import Instructions']);
    sheet.addRow(['Enter First Name and Last Name on the Student Import tab.']);
  };
  if (instructions === 'before') addInstructions();
  const worksheet = workbook.addWorksheet('Student Import');
  if (excelTable) worksheet.addTable({ name: 'StudentImport', ref: 'A1', headerRow: true,
    columns: headers.map(name => ({ name })), rows: [values],
  });
  else {
    worksheet.addRow(headers);
    worksheet.addRow(values);
  }
  if (instructions === 'after') addInstructions();
  const form = new FormData();
  form.append('file', new Blob([await workbook.xlsx.writeBuffer()], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }), 'students.xlsx');
  form.append('subjectId', 'class-one');
  if (sectionId !== undefined) form.append('sectionId', sectionId);
  const response = await fetch(`${baseUrl}/preview`, { method: 'POST', body: form });
  return { status: response.status, body: await response.json() };
}

test('multipart names-only preview accepts the selected section field outside the Excel file', async () => {
  const result = await upload({ sectionId: 'hope' });
  assert.equal(result.status, 200);
  assert.equal(result.body.validCount, 1);
  assert.deepEqual(result.body.records.map(row => [row.firstName, row.lastName, row.fullName, row.sectionId, row.section]),
    [['Maria', 'Santos', 'Maria Santos', 'hope', 'Hope']]);
  assert.equal(client.writes.length, 0);
});

test('multipart preview defaults to the server-read advisory section when no section is selected', async () => {
  const result = await upload();
  assert.equal(result.status, 200);
  assert.equal(result.body.records[0].sectionId, 'charity');
  assert.equal(client.writes.length, 0);
});

test('multipart upload accepts an Excel student table plus a separate Instructions tab in either order', async () => {
  for (const instructions of ['before', 'after']) {
    const result = await upload({ sectionId: 'hope', instructions, excelTable: true });
    assert.equal(result.status, 200);
    assert.equal(result.body.validCount, 1);
    assert.equal(result.body.invalidCount, 0);
    assert.deepEqual(result.body.records.map(row => [row.firstName, row.lastName, row.fullName, row.sectionId]),
      [['Maria', 'Santos', 'Maria Santos', 'hope']]);
  }
  assert.equal(client.writes.length, 0);
});

test('uploaded section columns and nonexistent separately selected sections produce clear HTTP errors', async () => {
  const extraColumn = await upload({ headers: ['First Name', 'Last Name', 'Section'], values: ['Maria', 'Santos', 'Hope'], instructions: 'before' });
  assert.equal(extraColumn.status, 400);
  assert.match(extraColumn.body.message, /First Name|Last Name|only|column/i);
  const badSection = await upload({ sectionId: 'unknown' });
  assert.equal(badSection.status, 400);
  assert.match(badSection.body.message, /section/i);
  assert.equal(client.writes.length, 0);
});
