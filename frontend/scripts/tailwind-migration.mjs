/**
 * Lossless Tailwind migration helpers.
 *
 * A declaration becomes its own @apply so Tailwind cannot reorder shorthand /
 * longhand pairs or browser fallback declarations. Named utilities are accepted
 * only when Tailwind emits exactly one equivalent declaration for the same
 * property. Other values use Tailwind's arbitrary-property utilities.
 *
 * Usage: node scripts/tailwind-migration.mjs --self-test
 * The CLI never writes application files.
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';
import { compile } from 'tailwindcss';
import { transform } from 'lightningcss';

const NAMED_CANDIDATES = `
block inline-block inline flex inline-flex grid inline-grid hidden flow-root
contents table inline-table table-caption table-cell table-column table-column-group
table-footer-group table-header-group table-row-group table-row list-item
static fixed absolute relative sticky visible invisible collapse
box-border box-content float-left float-right float-none clear-left clear-right clear-both clear-none
isolate isolation-auto object-contain object-cover object-fill object-none object-scale-down
overflow-auto overflow-hidden overflow-clip overflow-visible overflow-scroll
overflow-x-auto overflow-x-hidden overflow-x-clip overflow-x-visible overflow-x-scroll
overflow-y-auto overflow-y-hidden overflow-y-clip overflow-y-visible overflow-y-scroll
overscroll-auto overscroll-contain overscroll-none
flex-row flex-row-reverse flex-col flex-col-reverse flex-wrap flex-wrap-reverse flex-nowrap
items-start items-end items-center items-baseline items-stretch
justify-normal justify-start justify-end justify-center justify-between justify-around justify-evenly justify-stretch
content-normal content-center content-start content-end content-between content-around content-evenly content-stretch content-baseline
self-auto self-start self-end self-center self-stretch self-baseline
justify-items-start justify-items-end justify-items-center justify-items-stretch
justify-self-auto justify-self-start justify-self-end justify-self-center justify-self-stretch
place-content-center place-content-start place-content-end place-content-between place-content-around place-content-evenly place-content-stretch place-content-baseline
place-items-start place-items-end place-items-center place-items-stretch
place-self-auto place-self-start place-self-end place-self-center place-self-stretch
flex-auto flex-initial flex-none grow grow-0 shrink shrink-0 order-none order-first order-last
w-auto h-auto min-w-0 min-h-0 max-w-none max-h-none w-full h-full min-w-full min-h-full max-w-full max-h-full
w-screen h-screen min-h-screen max-h-screen w-min w-max w-fit h-min h-max h-fit
m-auto mt-auto mr-auto mb-auto ml-auto m-0 p-0 gap-0
text-left text-center text-right text-justify text-start text-end
align-baseline align-top align-middle align-bottom align-text-top align-text-bottom align-sub align-super
uppercase lowercase capitalize normal-case italic not-italic antialiased subpixel-antialiased
underline overline line-through no-underline decoration-solid decoration-double decoration-dotted decoration-dashed decoration-wavy
whitespace-normal whitespace-nowrap whitespace-pre whitespace-pre-line whitespace-pre-wrap whitespace-break-spaces
break-normal break-all break-keep text-clip text-ellipsis truncate
list-none list-disc list-decimal list-inside list-outside
border-collapse border-separate table-auto table-fixed border-solid border-dashed border-dotted border-double border-hidden border-none
rounded-none rounded-full outline-none outline-hidden outline-solid outline-dashed outline-dotted outline-double
bg-transparent bg-current bg-none bg-auto bg-cover bg-contain bg-fixed bg-local bg-scroll
bg-repeat bg-no-repeat bg-repeat-x bg-repeat-y bg-repeat-round bg-repeat-space
bg-clip-border bg-clip-padding bg-clip-content bg-clip-text bg-origin-border bg-origin-padding bg-origin-content
text-transparent text-current fill-none fill-current stroke-none stroke-current
opacity-0 opacity-100 shadow-none transform-none transition-none animate-none
cursor-auto cursor-default cursor-pointer cursor-wait cursor-text cursor-move cursor-help cursor-not-allowed cursor-none cursor-grab cursor-grabbing
pointer-events-none pointer-events-auto select-none select-text select-all select-auto
resize-none resize-y resize-x resize appearance-none appearance-auto
scroll-auto scroll-smooth touch-auto touch-none touch-manipulation
`.trim().split(/\s+/);

const primitiveAtRules = /^(?:-\w+-)?keyframes$|^(?:font-face|property|counter-style|font-feature-values|font-palette-values)$/i;
const canonicalCache = new Map();
const utilityCache = new Map();
let namedUtilitiesPromise;

/** Normalize CSS with a standards-aware parser, without browser downleveling. */
export function canonicalCss(css) {
  if (!canonicalCache.has(css)) {
    const normalized = transform({
      filename: 'tailwind-migration.css',
      code: Buffer.from(css),
      minify: true,
      errorRecovery: false,
    }).code.toString();
    canonicalCache.set(css, normalized.replace(/\/\*![\s\S]*?\*\//g, '').trim());
  }
  return canonicalCache.get(css);
}

function declarationKey(property, value, important = false) {
  return canonicalCss(`.migration-check{${property}:${value}${important ? '!important' : ''}}`);
}

function isPrimitive(declaration) {
  if (declaration.prop.startsWith('--')) return true;
  for (let parent = declaration.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && primitiveAtRules.test(parent.name)) return true;
  }
  return false;
}

/**
 * Encode the whitespace syntax used in an arbitrary Tailwind value.
 * URL whitespace uses CSS escapes because Tailwind deliberately does not decode
 * underscores inside url(). Hex escapes have six digits, so no terminator is
 * needed. Literal underscores are escaped to survive Tailwind's decoder.
 */
export function encodeArbitraryValue(value) {
  let result = '';
  let quote = null;
  const functions = [];
  let identifier = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const inUrl = functions.includes('url');
    if (character === '\\') {
      const next = value[index + 1];
      // Preserve CSS escape sequences, including an escaped underscore. A
      // literal escaped space cannot be part of an @apply token.
      if (next && /\s/.test(next)) {
        result += `\\${next.codePointAt(0).toString(16).padStart(6, '0')}`;
        index += 1;
      } else if (next === '_') {
        result += inUrl ? '\\_' : '\\\\_';
        index += 1;
      } else {
        result += character;
        if (next) { result += next; index += 1; }
      }
      identifier = '';
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '(') {
      functions.push(identifier.toLowerCase());
      identifier = '';
    } else if (character === ')') {
      functions.pop();
      identifier = '';
    }
    if (/\s/.test(character)) {
      result += inUrl ? `\\${character.codePointAt(0).toString(16).padStart(6, '0')}` : '_';
      identifier = '';
    } else if (character === '_') {
      result += inUrl ? '_' : '\\_';
      identifier += character;
    } else if (character === ';' && inUrl && !quote) {
      // An unquoted data URL can contain a semicolon; escape it for @apply's
      // statement parser while preserving the URL CSS value.
      result += '\\;';
      identifier = '';
    } else {
      result += character;
      if (!quote && /[a-zA-Z0-9-]/.test(character)) identifier += character;
      else if (character !== '(') identifier = '';
    }
  }
  return result;
}

async function compileUtility(candidate) {
  if (!utilityCache.has(candidate)) {
    utilityCache.set(candidate, (async () => {
      const result = await compile(`.migration-check { @apply ${candidate}; }`, { polyfills: 0 });
      const css = result.build([]);
      const root = postcss.parse(css);
      const rules = root.nodes.filter((node) => node.type !== 'comment');
      if (rules.length !== 1 || rules[0].type !== 'rule' || rules[0].selector !== '.migration-check') return null;
      const declarations = rules[0].nodes.filter((node) => node.type !== 'comment');
      if (declarations.length !== 1 || declarations[0].type !== 'decl') return null;
      const declaration = declarations[0];
      return {
        property: declaration.prop,
        value: declaration.value,
        important: Boolean(declaration.important),
        canonical: declarationKey(declaration.prop, declaration.value, declaration.important),
      };
    })());
  }
  return utilityCache.get(candidate);
}

async function namedUtilities() {
  if (!namedUtilitiesPromise) {
    namedUtilitiesPromise = (async () => {
      const map = new Map();
      for (const candidate of NAMED_CANDIDATES) {
        try {
          const compiled = await compileUtility(candidate);
          if (!compiled || compiled.value.includes('var(') || compiled.property.startsWith('--')) continue;
          const key = `${compiled.property}\n${compiled.canonical}`;
          if (!map.has(key)) map.set(key, candidate);
        } catch {
          // Theme-dependent candidates are intentionally excluded: accepting
          // one could introduce a new dependency on theme CSS variables.
        }
      }
      return map;
    })();
  }
  return namedUtilitiesPromise;
}

async function candidateFor(declaration, named) {
  const canonical = declarationKey(declaration.prop, declaration.value);
  const namedCandidate = named.get(`${declaration.prop}\n${canonical}`);
  const candidate = (namedCandidate || `[${declaration.prop}:${encodeArbitraryValue(declaration.value)}]`)
    + (declaration.important ? '!' : '');
  let compiled;
  try {
    compiled = await compileUtility(candidate);
  } catch (error) {
    throw new Error(`Cannot convert ${declaration.toString()} to ${candidate}: ${error.message}`, { cause: error });
  }
  const expected = declarationKey(declaration.prop, declaration.value, declaration.important);
  if (!compiled || compiled.property !== declaration.prop || compiled.canonical !== expected) {
    throw new Error(`Non-equivalent Tailwind utility for ${declaration.toString()}: ${candidate}\nExpected: ${expected}\nReceived: ${compiled?.canonical || 'multiple or missing declarations'}`);
  }
  return { candidate, named: Boolean(namedCandidate) };
}

/**
 * Pure conversion: no file reads/writes. Returns { css, stats }.
 * reference is optional; for Vue style blocks pass a reference to the shared
 * Tailwind stylesheet. prefix must match that stylesheet's prefix(tw) setting.
 * Existing selectors, at-rules and ordering are preserved.
 */
export async function convertCss(css, { reference, prefix } = {}) {
  if (prefix !== undefined) assert.match(prefix, /^[a-z]+$/, 'Tailwind prefixes must contain lowercase ASCII letters only');
  const root = postcss.parse(css);
  const named = await namedUtilities();
  const stats = { converted: 0, named: 0, arbitrary: 0, primitives: 0 };
  const declarations = [];
  root.walkDecls((declaration) => declarations.push(declaration));
  for (const declaration of declarations) {
    if (isPrimitive(declaration)) { stats.primitives += 1; continue; }
    const converted = await candidateFor(declaration, named);
    const candidate = prefix ? `${prefix}:${converted.candidate}` : converted.candidate;
    const apply = postcss.atRule({ name: 'apply', params: candidate });
    apply.raws.before = declaration.raws.before;
    declaration.replaceWith(apply);
    stats.converted += 1;
    stats[converted.named ? 'named' : 'arbitrary'] += 1;
  }
  if (reference && stats.converted) {
    const directive = postcss.atRule({ name: 'reference', params: JSON.stringify(reference) });
    root.prepend(directive);
  }
  const output = root.toString();
  await verifyCss(css, output, { prefix });
  return { css: output, stats };
}

function declarationSequence(root) {
  const result = [];
  root.walkDecls((declaration) => {
    const context = [];
    for (let parent = declaration.parent; parent && parent.type !== 'root'; parent = parent.parent) {
      context.unshift(parent.type === 'rule'
        ? parent.selector.replace(/\s+/g, ' ').trim()
        : `@${parent.name} ${parent.params.replace(/\s+/g, ' ').trim()}`);
    }
    result.push({
      context,
      property: declaration.prop,
      value: declarationKey(declaration.prop, declaration.value, declaration.important),
    });
  });
  return result;
}

/** Check the complete ordered declaration stream, including scoped selectors. */
export async function verifyCss(original, migrated, { prefix } = {}) {
  if (prefix !== undefined) assert.match(prefix, /^[a-z]+$/, 'Tailwind prefixes must contain lowercase ASCII letters only');
  const source = postcss.parse(original);
  const input = postcss.parse(migrated);
  // Imports remain integration concerns; this verification checks only the
  // declarations in this exact source, with no filesystem or network access.
  input.walkAtRules((rule) => {
    if (['import', 'reference', 'source'].includes(rule.name)) rule.remove();
  });
  // An empty theme sets Tailwind's real prefix parser without adding theme
  // declarations or depending on the integration reference's filesystem path.
  const prefixTheme = prefix ? `@theme prefix(${prefix}) {}\n` : '';
  const compiled = await compile(prefixTheme + input.toString(), { polyfills: 0 });
  const actual = declarationSequence(postcss.parse(compiled.build([])));
  const expected = declarationSequence(source);
  assert.deepEqual(actual, expected, 'Migration changed a declaration, its selector/context, or source order');
  return { declarations: expected.length };
}

export async function selfTest() {
  const css = String.raw`
@import url('https://example.test/fonts.css');
:root { --brand_color: #123456; }
.card, :deep(.item) {
  display: flex;
  padding: 12px 20px;
  padding-left: 3px;
  margin-left: 1px;
  margin: 0;
  display: -webkit-box;
  display: flex !important;
  border: 1px solid #ddd;
  color: var(--brand_color);
  font-family: "Font Awesome 6 Free", sans-serif;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .15);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: calc(100% - 2rem);
}
.card::after { content: '\f078'; }
.spaces::after { content: 'two  spaces_and\_escapes'; }
.url { background-image: url("data:image/svg+xml,%3Csvg width='16' height='16'%3E%3C/svg%3E"); }
.unquoted-url { background-image: url(data:image/svg+xml;base64,abcd); }
@media (max-width: 768px) { :global(body.dark) .card { display: grid; gap: 1rem; } }
@supports (display: grid) { .card { display: grid; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@property --progress { syntax: '<number>'; inherits: false; initial-value: 0; }
@font-face { font-family: 'Demo'; src: url('/fonts/demo.woff2'); }
`;
  const result = await convertCss(css, { reference: '../styles/tailwind.css' });
  assert.match(result.css, /@apply flex;/);
  assert.match(result.css, /@apply flex!;/);
  assert.match(result.css, /@keyframes spin \{ from \{ transform:/);
  assert.match(result.css, /--brand_color: #123456/);
  assert.equal(result.stats.converted, 20);
  const prefixed = await convertCss(css, { reference: '../styles/tailwind.css', prefix: 'tw' });
  assert.match(prefixed.css, /@apply tw:flex;/);
  assert.match(prefixed.css, /@apply tw:flex!;/);
  assert.match(prefixed.css, /@apply tw:\[padding:12px_20px\];/);
  assert.deepEqual(prefixed.stats, result.stats);
  return result.stats;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) {
    console.log('Tailwind migration self-test passed:', await selfTest());
  } else {
    console.log('Usage: node scripts/tailwind-migration.mjs --self-test');
  }
}
