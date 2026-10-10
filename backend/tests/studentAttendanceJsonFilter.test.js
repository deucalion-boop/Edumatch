const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const storage = require('../services/supabaseStorageService');

let client;
storage.getSupabaseStorageClient = () => client;
const { studentAttendance } = require('../services/supabaseStudentDashboardService');

function useOfflineClient(studentId, records, failure = null) {
  const requests = [];
  client = createClient('http://localhost:1', 'offline-test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (request) => {
        const url = new URL(request instanceof Request ? request.url : String(request));
        assert.equal(url.origin, 'http://localhost:1');
        assert.equal(url.pathname, '/rest/v1/attendance_records');
        assert.equal(url.searchParams.get('select'), '*');
        assert.equal(url.searchParams.get('order'), 'date_key.desc');
        const filter = url.searchParams.get('entries');
        assert.ok(filter.startsWith('cs.'), 'JSONB containment uses cs');
        // The real SDK used to encode the object array as cs.{[object Object]}.
        // Parsing the wire value catches that failure without a live database.
        const entries = JSON.parse(filter.slice(3));
        assert.deepEqual(entries, [{ studentId }]);
        requests.push(url);
        const matching = records.filter(record => record.entries.some(entry => entry.studentId === studentId))
          .sort((left, right) => right.date_key.localeCompare(left.date_key));
        return new Response(JSON.stringify(failure || matching), {
          status: failure ? 400 : 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    },
  });
  return requests;
}

test('student attendance sends valid JSONB through the real SDK and keeps the student filter', async () => {
  const requests = useOfflineClient('student', [
    { id: 'older', date_key: '2026-10-08', entries: [{ studentId: 'student', status: 'Present' }] },
    { id: 'foreign', date_key: '2026-10-10', entries: [{ studentId: 'another-student', status: 'Late' }] },
    { id: 'newer', date_key: '2026-10-09', entries: [{ studentId: 'another-student' }, { studentId: 'student', status: 'Late' }] },
  ]);
  const rows = await studentAttendance('student');
  assert.equal(requests.length, 1);
  assert.deepEqual(rows.map(row => row.id), ['newer', 'older']);
  assert.equal(rows[0]._id, 'newer');
  assert.equal(rows[0].dateKey, '2026-10-09');
});

test('JSON containment escapes student text IDs and returns empty history without matches', async () => {
  const studentId = 'student"\\with,characters';
  useOfflineClient(studentId, [
    { id: 'own', date_key: '2026-10-10', entries: [{ studentId }] },
    { id: 'foreign', date_key: '2026-10-10', entries: [{ studentId: 'another-student' }] },
  ]);
  assert.deepEqual((await studentAttendance(studentId)).map(row => row.id), ['own']);
  useOfflineClient('no-records', []);
  assert.deepEqual(await studentAttendance('no-records'), []);
});

test('student attendance preserves backend errors when the database rejects a request', async () => {
  useOfflineClient('student', [], { code: '22023', message: 'fixture database failure', details: null, hint: null });
  await assert.rejects(studentAttendance('student'), error => error.statusCode === 500 && error.message === 'fixture database failure');
});
