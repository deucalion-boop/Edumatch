# Edumatch AI Exam Generator: JHS TOS and Learning Competency Guideline

This guideline upgrades the Edumatch AI exam generator (`backend/controllers/aiController.js:614`) so it builds Philippine Junior High School (Grades 7-10) exams from a Table of Specifications (TOS) and DepEd learning competencies (MELCs), instead of generating generic questions.

Both exam-generating roles share one backend prompt, so a single prompt change covers them:

| Role | Source material | Route |
|---|---|---|
| Teacher | Their lesson PDF, or a topic with class context (assigned subject only) | `routes/teacherRoutes.js:106` |
| Head Teacher | A managed teacher's lesson PDF (teacher must belong to their department) | `routes/headteacherRoutes.js:37` |

---

## 1. How a Philippine JHS TOS works

A school TOS usually has these parts:

- **Rows:** one per learning competency, each with the number of days it was taught.
- **Items per competency:** `(days taught / total days) x total items`.
- **Cognitive levels:** each row's items are spread across Bloom's levels. A common split is 60% easy (Remembering, Understanding), 30% average (Applying, Analyzing) and 10% difficult (Evaluating, Creating). Confirm against your school's TOS template, since some differ.

Design rule: the teacher enters competencies and days taught. The backend computes item counts per competency and per level. The teacher does not pick a level for each question.

---

## 2. Frontend form fields (Teacher and Head Teacher)

| Field | Type | Notes |
|---|---|---|
| Grade level | Dropdown (7-10) | Required |
| Quarter | Dropdown (1-4) | Required |
| Exam language | Dropdown (English / Filipino) | Required |
| Competency rows | Repeatable group | Competency text (free text, max about 200 chars), optional MELC code, days taught |
| Level distribution | Optional override | Default 30 / 30 / 20 / 10 / 10 (Remembering / Understanding / Applying / Analyzing / Evaluating) |

Keep competency as free text and the code optional. The MATATAG curriculum is being phased in, so competency wording and codes can differ by grade and subject.

---

## 3. The prompt (one call per competency)

Use one call per competency row, with that row's level counts passed in as a blueprint. This sends the source text once per row, not once per level, and keeps counts small enough for the model to follow.

```text
You are an experienced DepEd Junior High School (Grades 7-10) teacher and test constructor in the Philippines. Write exam questions for the class below.

Grade level: {{gradeLevel}}
Subject: {{subject}}
Quarter: {{quarter}}
Exam language: {{language}}
Learning Competency: {{learningCompetency}}
Difficulty: {{difficulty}}. Exam type: {{examType}}.

Generate exactly {{numberOfItems}} questions, distributed by cognitive level (Revised Bloom's Taxonomy) exactly as follows:
{{tosBlueprint}}

Cognitive level guide:
- Remembering: recall facts, terms, definitions.
- Understanding: explain, classify, compare, give examples.
- Applying: use a concept or procedure in a new situation or problem.
- Analyzing: differentiate, find relationships, causes, or patterns.
- Evaluating: judge or justify using criteria.
- Creating: design or formulate (use short-answer only).

Rules:
1. Every question must assess the Learning Competency above, at its assigned cognitive level. Do not test other topics.
2. Wording must suit a Grade {{gradeLevel}} Filipino learner: clear, simple sentences, no unexplained jargon.
3. For Applying and above, use scenarios from Philippine contexts (local names, places, pesos, community situations) where natural.
4. Multiple-choice: exactly 4 options, one correct answer, plausible distractors based on common student misconceptions, similar option lengths, no "all of the above" or "none of the above", no negatively worded stems.
5. True-false: unambiguous statements, no "always" or "never" cues.
6. Short-answer: one clearly correct short answer; for computations, state the final answer with units.
7. Options are required for multiple-choice only.
8. No duplicate or near-duplicate questions, and no question that reveals another's answer.
9. "explanation" is 1-2 sentences for the teacher on why the answer is correct.
10. Write all questions and options in {{language}}. For Filipino, use standard Filipino and keep established technical terms.

Return ONLY valid JSON, with no markdown fences or extra text:
{
  "title": "string",
  "questions": [
    {
      "questionText": "string",
      "type": "multiple-choice|true-false|short-answer",
      "options": ["string"],
      "correctAnswer": "string",
      "points": 1,
      "explanation": "string",
      "cognitiveLevel": "string"
    }
  ]
}
```

`tosBlueprint` is plain text built by the backend:

```text
- Remembering: 3 items
- Understanding: 3 items
- Applying: 2 items
- Analyzing: 1 item
- Evaluating: 1 item
```

### Source material and grounding

The backend already appends the source text, so append only a constraint sentence after it. Do not paste the text twice.

| Path | Appended by backend | Constraint to add after it |
|---|---|---|
| Lesson PDF | `Lesson text:` + extracted PDF text (first 15,000 chars) | `Constraint: All questions must assess the Learning Competency using ONLY the facts in the lesson text above.` |
| Topic input | `Topic and class context:` + topic, subject, class context, optional title | `Constraint: All questions must assess the Learning Competency and fit the subject and class level above.` |

Do not use the strict "ONLY the facts provided" wording on the topic path. There are no source facts to ground on, so the output would be thin or refused.

---

## 4. Backend implementation (`aiController.js`)

### 4.1 Compute the TOS

```javascript
// Default split (60-30-10): editable per school
const DEFAULT_DIST = {
  Remembering: 30, Understanding: 30, Applying: 20, Analyzing: 10, Evaluating: 10,
};

// Splits `total` by weights; the largest remainders get the leftover items so the sum is exact
function allocate(total, weights) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const rows = Object.entries(weights).map(([k, w]) => ({ k, exact: (total * w) / sum }));
  const out = Object.fromEntries(rows.map(r => [r.k, Math.floor(r.exact)]));
  let left = total - Object.values(out).reduce((a, b) => a + b, 0);
  rows.sort((a, b) => (b.exact % 1) - (a.exact % 1));
  for (let i = 0; left > 0; i++, left--) out[rows[i % rows.length].k]++;
  return out;
}

// rows: [{ competency, daysTaught }]
function buildTos(rows, totalItems, dist = DEFAULT_DIST) {
  const perComp = allocate(
    totalItems,
    Object.fromEntries(rows.map((r, i) => [i, r.daysTaught]))
  );
  return rows.map((r, i) => {
    const levels = allocate(perComp[i], dist);
    const tosBlueprint = Object.entries(levels)
      .filter(([, n]) => n > 0)
      .map(([lvl, n]) => `- ${lvl}: ${n} item${n > 1 ? 's' : ''}`)
      .join('\n');
    return {
      learningCompetency: r.competency,
      numberOfItems: perComp[i],
      levels,
      tosBlueprint,
    };
  });
}
```

### 4.2 Build and validate the prompt

```javascript
const LEVELS = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'];
const LANGUAGES = ['English', 'Filipino'];

function buildPrompt({ gradeLevel, subject, quarter, language, difficulty, examType,
                       block, sourceText, fromPdf }) {
  if (![7, 8, 9, 10].includes(Number(gradeLevel))) throw new Error('Invalid grade level');
  if (![1, 2, 3, 4].includes(Number(quarter))) throw new Error('Invalid quarter');
  if (!LANGUAGES.includes(language)) throw new Error('Invalid language');

  const competency = String(block.learningCompetency || '').trim().slice(0, 200);

  let prompt = TEMPLATE                       // the prompt in section 3, with {{...}} placeholders
    .replaceAll('{{gradeLevel}}', gradeLevel)
    .replaceAll('{{subject}}', subject)
    .replaceAll('{{quarter}}', quarter)
    .replaceAll('{{language}}', language)
    .replaceAll('{{learningCompetency}}', competency)
    .replaceAll('{{difficulty}}', difficulty)
    .replaceAll('{{examType}}', examType)
    .replaceAll('{{numberOfItems}}', block.numberOfItems)
    .replaceAll('{{tosBlueprint}}', block.tosBlueprint);

  prompt += `\n\n${sourceText}`;              // existing "Lesson text:" or "Topic and class context:" block
  prompt += fromPdf
    ? `\n\nConstraint: All questions must assess the Learning Competency using ONLY the facts in the lesson text above.`
    : `\n\nConstraint: All questions must assess the Learning Competency and fit the subject and class level above.`;
  return prompt;
}
```

Note: if `subject`, `difficulty` or `examType` come from user input, validate them too, since they are inserted into the prompt.

### 4.3 Run, validate and merge

For each TOS row:

1. Call the AI with the built prompt.
2. Parse the JSON and check that the question count equals `numberOfItems`.
3. Check that the number of questions per `cognitiveLevel` matches `levels`.
4. On a mismatch, retry once. If it still fails, return an error for that row rather than a wrong-shaped exam.
5. Merge all rows' questions, dedupe near-identical question text across rows, and tag each question with its competency.
6. Build the final TOS table (competency x level, with item numbers) from the validated results so the teacher can submit it with the exam.

Cost note: each call re-sends up to 15,000 characters of source text. Run rows concurrently if your API rate limits allow, otherwise sequentially.

---

## 5. Data model checks

- If the question schema is strict, add `cognitiveLevel` and `learningCompetency` fields, or the DB will drop or reject them.
- Make the new request fields optional so existing clients and saved flows keep working. When no TOS rows are sent, fall back to the original single-call prompt.

---

## 6. Review step before saving

Show each generated item with its explanation, answer key, competency and cognitive level in an edit screen. Let the teacher edit or delete items and regenerate single items before the exam is saved.

Math and science answer keys especially need a teacher check, because models make arithmetic slips.

---

## 7. Known limits

- **Creating is hard to assess in an objective test.** The prompt limits it to short-answer. If your school's TOS template has no Creating column, drop it from the default split and the level guide.
- **Level counts are not guaranteed.** The model can drift, which is why section 4.3 validates and retries.
- **Competency wording varies** between the MELC and MATATAG curricula. Free text plus an optional code avoids hard-coding either.

---

## 8. Implementation checklist

- [ ] Add grade level, quarter, language, competency rows and distribution override to both role forms
- [ ] Pass the new fields through `teacherRoutes.js:106` and `headteacherRoutes.js:37`
- [ ] Add `buildTos`, `allocate` and `buildPrompt` to `aiController.js`
- [ ] Replace the prompt at `aiController.js:614` with the section 3 template
- [ ] Validate grade, quarter, language and competency length server-side
- [ ] Add per-row count validation, one retry and cross-row dedupe
- [ ] Update the question schema for `cognitiveLevel` and `learningCompetency`
- [ ] Build the TOS table output
- [ ] Add the teacher review and edit screen
