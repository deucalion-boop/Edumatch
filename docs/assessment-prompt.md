# Shared exam-generation prompt

Teacher and Head Teacher routes both call `buildAssessmentPrompt` in
`backend/services/assessmentPromptService.js` through `aiController.js`.
This adapts `edumatch_jhs_tos_prompt_guideline.md` to the existing system.

The prompt uses the submitted subject, topic (including when a PDF is linked),
assessment title, difficulty, question count, exam type, assessment mode,
grading period, and duration. PDF generation is grounded in the first 15,000
characters of extracted lesson text. Topic-only generation may use established
subject knowledge. Reference text is JSON-encoded and treated as data.

Both roles receive the same question-quality, Bloom cognitive-demand,
Philippine-context, and answer-key instructions. Multiple choice requires four
options and the full correct option text. True/false uses the system's English
True/False tokens. Identification uses short-answer. Mixed allows the three
supported generated question types. Practical exams retain the existing
multiple-choice mapping, using application scenarios rather than demonstrations.

The response schema remains compatible with both draft editors. Repair calls
retain the original constraints. Explicit empty question arrays return HTTP 422
so insufficient source material is not converted into local fallback questions.
The existing malformed-output fallback still applies to other unparseable
responses; this change does not guarantee semantic quality or exact item counts.
Teachers must review generated drafts before publication.

## Competency suggestions

Teacher and Head Teacher assessment forms can optionally request competency
suggestions from the selected lesson PDF. The API returns at most eight rows and
labels each row as one of the following:

- `extracted`: the competency text appears verbatim with an explicit objective or
  competency heading in the lesson evidence.
- `inferred`: AI proposed the competency from quoted lesson evidence; it is not
  represented as an official curriculum competency.
- `edited`: the teacher changed a suggestion, so the extracted claim and any
  quoted code are removed.

Every retained row requires an explicit review checkbox before exam generation.
Changing the teacher or lesson clears the review. The backend reads the owned PDF
again during generation, rechecks evidence and codes, and rejects stale,
unreviewed, or mismatched claims. A displayed code is only a quotation from the
lesson; the interface says its official validity is unverified. Inferred and
edited rows cannot carry codes. Users may clear all rows and generate from the
lesson without competency suggestions.

## Difference from the proposed JHS TOS workflow

The forms do not collect grade level, exam language, days taught, or a
cognitive-level distribution. Suggested and reviewed competency rows guide
coverage but do not allocate item counts. The system also supports strand-based
subjects, and grading periods are 1st/2nd/3rd, not four JHS quarters. The prompt
therefore does not assume Grades 7–10, invent official competency codes, impose
60/30/10 quotas, or claim formal TOS compliance. Language follows the supplied
material/subject, with English as the default.

The existing Teacher editor supports manual TOS tagging. Formal competency-based
TOS generation remains a separate implementation: add inputs to both role forms,
compute allocations server-side, validate generated counts and tags, persist and
review those tags in both editors, and derive the TOS from validated questions.
The suggestion workflow does not introduce days-taught fields, item allocation,
or per-competency exam-generation calls.

## Verification

Run from the repository root:

```sh
node --test backend/tests/assessmentPrompt.test.js backend/tests/competencySuggestion.test.js backend/tests/teacherSubjectWorkflow.test.js backend/tests/headteacherSubjectWorkflow.test.js
```

These checks use mocked provider responses; they do not measure live model output.
