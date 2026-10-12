const test = require('node:test');
const assert = require('node:assert/strict');
const { createFakeSupabase } = require('./helpers/fakeSupabase');
const storage = require('../services/supabaseStorageService');
let client;
storage.getSupabaseStorageClient = () => client;
const { getSupabaseAnalytics } = require('../services/supabaseAnalyticsService');

const NOW = Date.parse('2026-10-12T04:00:00.000Z');
const TEACHER_ENDPOINT = '/api/teacher/assessments/ai-generate';
const HEADTEACHER_ENDPOINT = '/api/headteacher/assessments/ai-generate';

function event(id, overrides = {}) {
  return {
    id, method: 'POST', endpoint: TEACHER_ENDPOINT, succeeded: true,
    actor_user_id: 'teacher', created_at: '2026-10-12T03:00:00.000Z', ...overrides,
  };
}

function analyticsFixture(events, { pageLimit = 1000, failCounts = false, failHistory = false } = {}) {
  const base = createFakeSupabase({
    users: [{ id: 'teacher', role: 'teacher', status: 'active' }],
    lessons: [{ id: 'lesson', subject: 'Biology', track: 'STEM' }],
    assessments: [{ id: 'saved-exam', difficulty: 'easy' }, { id: 'manual-exam', difficulty: 'hard' }],
  });
  const historyRanges = [];
  return {
    historyRanges,
    from(table) {
      if (table !== 'audit_logs') return base.from(table);
      const filters = [];
      const sorting = [];
      let options = {};
      let start = 0;
      let end = Infinity;
      const query = {
        select(_columns, nextOptions = {}) { options = nextOptions; return query; },
        eq(field, value) { filters.push((row) => row[field] === value); return query; },
        in(field, values) { filters.push((row) => values.includes(row[field])); return query; },
        gte(field, value) { filters.push((row) => row[field] >= value); return query; },
        lte(field, value) { filters.push((row) => row[field] <= value); return query; },
        order(field, orderOptions = {}) { sorting.push({ field, ascending: orderOptions.ascending !== false }); return query; },
        range(first, last) { start = first; end = last; historyRanges.push([first, last]); return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            if (options.head ? failCounts : failHistory) {
              return { data: null, count: null, error: { message: 'Audit source unavailable' } };
            }
            const rows = events.filter((row) => filters.every((filter) => filter(row)));
            if (options.head) return { data: null, count: rows.length, error: null };
            rows.sort((left, right) => {
              for (const { field, ascending } of sorting) {
                if (left[field] !== right[field]) return (left[field] < right[field] ? -1 : 1) * (ascending ? 1 : -1);
              }
              return 0;
            });
            return { data: rows.slice(start, Math.min(end + 1, start + pageLimit)), error: null };
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

test('AI usage counts recorded generation requests including unsaved drafts and failures', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: NOW });
  client = analyticsFixture([
    event('unsaved-draft'),
    event('failed-generation', { endpoint: HEADTEACHER_ENDPOINT, succeeded: false }),
    event('old-generation', { created_at: '2026-08-01T00:00:00.000Z' }),
    event('saved-assessment', { endpoint: '/api/teacher/assessments' }),
    event('status-read', { method: 'GET' }),
    event('other-ai-feature', { endpoint: '/api/recommendation/recompute/student' }),
    event('different-route', { endpoint: `${TEACHER_ENDPOINT}/preview` }),
  ]);
  const { aiAnalytics, analytics } = await getSupabaseAnalytics();
  assert.equal(aiAnalytics.requestCountAvailable, true);
  assert.equal(aiAnalytics.totalGenerationRequests, 3);
  assert.equal(aiAnalytics.successfulGenerationRequests, 2);
  assert.equal(aiAnalytics.failedGenerationRequests, 1);
  assert.equal(aiAnalytics.recentGenerationRequests, 2);
  assert.equal(aiAnalytics.activeAiUserCount, 1);
  assert.equal(aiAnalytics.eligibleAiUserCount, 1);
  assert.equal(aiAnalytics.aiAdoptionRate, 100);
  assert.equal(aiAnalytics.dailyGenerationRequests.values.reduce((sum, value) => sum + value, 0), 2);
  assert.equal(analytics.totalAssessments, 2, 'saved assessment counts remain independent from request counts');
});

test('recent AI usage and daily chart share Manila calendar days and exclude future events', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: NOW });
  client = analyticsFixture([
    event('first-day', { created_at: '2026-09-12T16:00:00.000Z' }),
    event('too-old', { created_at: '2026-09-12T15:59:59.999Z' }),
    event('yesterday', { created_at: '2026-10-11T15:59:59.999Z' }),
    event('today-midnight', { created_at: '2026-10-11T16:00:00.000Z' }),
    event('today-now', { created_at: new Date(NOW).toISOString() }),
    event('future', { created_at: '2026-10-12T04:00:00.001Z' }),
  ]);
  const { aiAnalytics } = await getSupabaseAnalytics();
  const { labels, values } = aiAnalytics.dailyGenerationRequests;
  assert.equal(aiAnalytics.totalGenerationRequests, 5);
  assert.equal(aiAnalytics.successfulGenerationRequests, 5);
  assert.equal(aiAnalytics.failedGenerationRequests, 0);
  assert.equal(aiAnalytics.recentGenerationRequests, 4);
  assert.equal(labels.length, 30);
  assert.equal(labels[0], 'Sep 13');
  assert.equal(labels.at(-1), 'Oct 12');
  assert.equal(values[0], 1);
  assert.equal(values.at(-2), 1);
  assert.equal(values.at(-1), 2);
});

test('AI request totals and daily usage remain accurate beyond Supabase row limits', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: NOW });
  const events = Array.from({ length: 1203 }, (_, index) => event(String(index), { succeeded: index % 3 !== 0 }));
  client = analyticsFixture(events, { pageLimit: 100 });
  const { aiAnalytics } = await getSupabaseAnalytics();
  assert.equal(aiAnalytics.requestCountAvailable, true);
  assert.equal(aiAnalytics.totalGenerationRequests, 1203);
  assert.equal(aiAnalytics.successfulGenerationRequests, 802);
  assert.equal(aiAnalytics.failedGenerationRequests, 401);
  assert.equal(aiAnalytics.recentGenerationRequests, 1203);
  assert.equal(aiAnalytics.dailyGenerationRequests.values.at(-1), 1203);
  assert.equal(client.historyRanges.length, 13);
  assert.equal(client.historyRanges.at(-1)[0], 1200);
});

test('empty recorded AI history returns available zero counts', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: NOW });
  client = analyticsFixture([]);
  const { aiAnalytics } = await getSupabaseAnalytics();
  assert.equal(aiAnalytics.requestCountAvailable, true);
  for (const field of ['totalGenerationRequests', 'successfulGenerationRequests', 'failedGenerationRequests', 'recentGenerationRequests']) {
    assert.equal(aiAnalytics[field], 0);
  }
  assert.deepEqual(aiAnalytics.dailyGenerationRequests.values, Array(30).fill(0));
  assert.deepEqual(client.historyRanges, []);
});

for (const failure of ['failCounts', 'failHistory']) {
  test(`unavailable AI ${failure === 'failCounts' ? 'counts' : 'history'} preserves other analytics without inventing zeros`, async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: NOW });
    client = analyticsFixture([event('draft')], { [failure]: true });
    const { aiAnalytics, analytics } = await getSupabaseAnalytics();
    assert.equal(aiAnalytics.requestCountAvailable, false);
    for (const field of ['totalGenerationRequests', 'successfulGenerationRequests', 'failedGenerationRequests', 'recentGenerationRequests']) {
      assert.equal(aiAnalytics[field], null);
    }
    assert.deepEqual(aiAnalytics.dailyGenerationRequests.values, []);
    assert.equal(analytics.totalLessons, 1);
    assert.equal(analytics.totalAssessments, 2);
  });
}
