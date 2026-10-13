const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildCompetencySuggestionPrompt, normalizeCompetencySuggestions, validateCompetencyReview,
} = require('../services/competencySuggestionService');

const source = 'Learning objectives: Identify the parts of a cell. S7LT-IIa-1\nThe nucleus contains genetic information. The cell membrane controls transport.';
const extracted = { text: 'Identify the parts of a cell.', origin: 'extracted', sourceExcerpt: 'Learning objectives: Identify the parts of a cell. S7LT-IIa-1', sourceCode: 'S7LT-IIa-1' };
const inferred = { text: 'Explain the role of the nucleus.', origin: 'inferred', sourceExcerpt: 'The nucleus contains genetic information.', sourceCode: 'FAKE7-IIa-2' };
const suggestions = (rows, text = source) => normalizeCompetencySuggestions({ competencies: rows }, text);

test('extracted objectives and codes require verbatim lesson evidence and start unreviewed', () => {
  const [row] = suggestions([extracted]);
  assert.equal(row.origin, 'extracted');
  assert.equal(row.sourceCode, 'S7LT-IIa-1');
  assert.equal(row.reviewed, false);
});

test('a quoted code remains valid when followed by ordinary punctuation', () => {
  const punctuatedSource = 'Learning objectives: Identify the parts of a cell. S7LT-IIa-1,';
  const [row] = suggestions([{ ...extracted, sourceExcerpt: punctuatedSource }], punctuatedSource);
  assert.equal(row.sourceCode, 'S7LT-IIa-1');
});

test('paraphrases and ordinary factual statements cannot claim to be extracted objectives', () => {
  const rows = suggestions([
    { ...extracted, text: 'Name the structures of a cell.' },
    { ...inferred, origin: 'extracted', text: 'The nucleus contains genetic information.' },
  ]);
  assert.deepEqual(rows.map(row => row.origin), ['inferred', 'inferred']);
  assert.deepEqual(rows.map(row => row.sourceCode), ['', '']);
});

test('invented evidence is discarded, and inferred or invented codes are stripped', () => {
  const rows = suggestions([
    { ...extracted, sourceExcerpt: 'Learning objectives: Invented quote' },
    { ...extracted, sourceCode: 'FAKE7-IIa-2' },
    inferred,
  ]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.sourceCode), ['', '']);
  assert.deepEqual(suggestions([{ ...inferred, text: 'Apply FAKE7-IIa-2.' }]), []);
});

test('duplicate suggestions are removed and source beyond the prompt limit cannot prove provenance', () => {
  assert.equal(suggestions([extracted, extracted]).length, 1);
  assert.deepEqual(suggestions([extracted], 'x'.repeat(15000) + source), []);
  assert.ok(buildCompetencySuggestionPrompt('x'.repeat(15000) + 'TAIL').endsWith('x"'));
});

test('review is optional, but every selected suggestion must be confirmed for the selected lesson', () => {
  assert.deepEqual(validateCompetencyReview(null, '', ''), []);
  const row = suggestions([extracted])[0];
  assert.throws(() => validateCompetencyReview({ lessonId: 'lesson', rows: [row] }, 'lesson', source), /Review and confirm/);
  row.reviewed = true;
  assert.throws(() => validateCompetencyReview({ lessonId: 'old-lesson', rows: [row] }, 'lesson', source), /selected lesson/);
  assert.equal(validateCompetencyReview({ lessonId: 'lesson', rows: [row] }, 'lesson', source)[0].origin, 'extracted');
});

test('generation rechecks claimed extraction and codes against the current PDF', () => {
  for (const row of [{ ...extracted, text: 'An invented objective' }, { ...extracted, sourceCode: 'FAKE7-IIa-2' }]) {
    assert.throws(() => validateCompetencyReview({ lessonId: 'lesson', rows: [{ ...row, reviewed: true }] }, 'lesson', source), /does not match/);
  }
});

test('teacher edits retain their own provenance and cannot attach official codes', () => {
  const row = { ...inferred, origin: 'edited', sourceCode: '', reviewed: true };
  assert.equal(validateCompetencyReview({ lessonId: 'lesson', rows: [row] }, 'lesson', source)[0].origin, 'edited');
  row.sourceCode = 'S7LT-IIa-1';
  assert.throws(() => validateCompetencyReview({ lessonId: 'lesson', rows: [row] }, 'lesson', source), /does not match/);
});
