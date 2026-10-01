/**
 * Move static Vue template style attributes to exact Tailwind utilities.
 * Live geometry bindings and all non-template source remain untouched. The known
 * finite confirmation-button choice is migrated separately to conditional classes.
 *
 * The shared Tailwind entry must declare the inline variant and emit utilities
 * unlayered, preserving the priority of these former inline declarations.
 *
 * node scripts/migrate-inline-styles.mjs --self-test
 * node scripts/migrate-inline-styles.mjs --check
 * node scripts/migrate-inline-styles.mjs --write
 */
import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseSfc } from '@vue/compiler-sfc';
import { parse as parseTemplate, NodeTypes } from '@vue/compiler-dom';
import postcss from 'postcss';
import { compile } from 'tailwindcss';
import { canonicalCss, encodeArbitraryValue } from './tailwind-migration.mjs';

const INLINE_VARIANT = '@custom-variant inline (&:is(#tw-inline-1#tw-inline-2#tw-inline-3, *));';
const CONFIRM_BUTTON_CONDITION = "['Reset Settings', 'Create Backup', 'Creating...'].includes(confirmButtonLabel)";

function singleQuotedStrings(value) {
  let output = '';
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '\\') {
      const next = value[index + 1];
      if (next === '"' || next === "'") {
        output += next === '"' ? '\\000022' : '\\000027';
        index += 1;
      } else {
        output += character;
        if (next) { output += next; index += 1; }
      }
    } else if (quote && character === quote) {
      output += "'";
      quote = null;
    } else if (!quote && (character === '"' || character === "'")) {
      output += "'";
      quote = character;
    } else if (quote && character === "'") {
      output += '\\000027';
    } else if (character === '"') {
      output += '\\000022';
    } else {
      output += character;
    }
  }
  return output;
}

function mayOverlap(first, second) {
  if (first === second || first === 'all' || second === 'all') return true;
  const pair = [first, second];
  // border does not reset corner radii or border-image.
  if (pair.includes('border') && pair.some((property) => /^border-(?:radius|image|.*radius)/.test(property))) return false;
  if (first.startsWith(`${second}-`) || second.startsWith(`${first}-`)) return true;
  if (pair.includes('gap') && pair.some((property) => /^(?:row|column)-gap$/.test(property))) return true;
  if (pair.includes('font') && pair.includes('line-height')) return true;
  if (pair.includes('columns') && pair.some((property) => /^column-(?:count|width)$/.test(property))) return true;
  return false;
}

function parseDeclarations(value, filename) {
  const root = postcss.parse(`.inline-migration { ${value} }`, { from: filename });
  const rule = root.first;
  assert.equal(root.nodes.length, 1, `${filename}: unexpected extra rule in static style`);
  assert.equal(rule.type, 'rule', `${filename}: invalid static style`);
  const declarations = rule.nodes.filter((node) => node.type !== 'comment');
  assert.ok(declarations.every((node) => node.type === 'decl'), `${filename}: static style contains a non-declaration`);
  // Tailwind orders utility rules independently of class attribute order.
  // Reject order-dependent overlapping declarations instead of silently
  // changing a shorthand, fallback, or browser-specific declaration.
  for (let left = 0; left < declarations.length; left += 1) {
    for (let right = left + 1; right < declarations.length; right += 1) {
      const first = declarations[left];
      const second = declarations[right];
      if (!mayOverlap(first.prop, second.prop)) continue;
      const forward = canonicalCss(`.inline-migration{${first};${second}}`);
      const backward = canonicalCss(`.inline-migration{${second};${first}}`);
      assert.equal(forward, backward, `${filename}: order-dependent inline ${first.prop}/${second.prop}; convert this element explicitly`);
    }
  }
  return declarations;
}

export function inlineStyleUtilities(value, filename = 'inline-style.vue') {
  return parseDeclarations(value, filename).map((declaration) => {
    const encoded = encodeArbitraryValue(singleQuotedStrings(declaration.value));
    const utility = `tw:inline:[${declaration.prop}:${encoded}]${declaration.important ? '!' : ''}`;
    assert.ok(!/["\s]/.test(utility), `${filename}: unsafe quote or whitespace in utility ${utility}`);
    return utility;
  });
}

function escapeAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Pure synchronous migration; count is the number of static style attributes. */
export function migrateInlineStyles(source, filename = 'inline-style.vue') {
  const parsed = parseSfc(source, { filename });
  assert.equal(parsed.errors.length, 0, `${filename}: invalid Vue source: ${parsed.errors.join(', ')}`);
  const template = parsed.descriptor.template;
  if (!template) return { source, count: 0 };
  const ast = parseTemplate(template.content);
  const base = template.loc.start.offset;
  const edits = [];
  let count = 0;
  function visit(node) {
    if (node.type === NodeTypes.ELEMENT) {
      const style = node.props.find((property) => property.type === NodeTypes.ATTRIBUTE && property.name.toLowerCase() === 'style');
      if (style) {
        const utilities = inlineStyleUtilities(style.value?.content || '', filename);
        const classAttribute = node.props.find((property) => property.type === NodeTypes.ATTRIBUTE && property.name.toLowerCase() === 'class');
        const start = base + style.loc.start.offset;
        const end = base + style.loc.end.offset;
        if (classAttribute) {
          edits.push({ start, end, text: '' });
          const existing = classAttribute.value?.content || '';
          const classes = [existing, ...utilities].filter(Boolean).join(' ');
          edits.push({
            start: base + classAttribute.loc.start.offset,
            end: base + classAttribute.loc.end.offset,
            text: `class="${escapeAttribute(classes)}"`,
          });
        } else {
          // Reusing the style attribute's location avoids editing tag layout,
          // self-closing syntax, or an adjacent dynamic :class binding.
          edits.push({ start, end, text: utilities.length ? `class="${escapeAttribute(utilities.join(' '))}"` : '' });
        }
        count += 1;
      }
    }
    for (const child of node.children || []) visit(child);
  }
  visit(ast);
  let output = source;
  for (const edit of edits.sort((first, second) => second.start - first.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  assert.equal(parseSfc(output, { filename }).errors.length, 0, `${filename}: generated invalid Vue source`);
  return { source: output, count };
}

/**
 * Migrate the known finite AdminSettings confirmation-button style choice.
 * The condition remains byte-for-byte identical. Live geometry bindings and
 * every other expression are deliberately outside this helper's scope.
 */
export function migrateFiniteStyleBindings(source, filename = 'inline-style.vue') {
  const parsed = parseSfc(source, { filename });
  assert.equal(parsed.errors.length, 0, `${filename}: invalid Vue source`);
  const template = parsed.descriptor.template;
  if (!template) return { source, count: 0, declarations: 0 };
  const ast = parseTemplate(template.content);
  const edits = [];
  const base = template.loc.start.offset;
  let count = 0;
  let declarations = 0;
  function visit(node) {
    if (node.type === NodeTypes.ELEMENT) {
      for (const property of node.props) {
        if (property.type !== NodeTypes.DIRECTIVE || property.name !== 'bind' || property.arg?.content !== 'style') continue;
        const expression = property.exp?.content || '';
        const leading = /^\s*/.exec(expression)[0];
        if (!expression.slice(leading.length).startsWith(CONFIRM_BUTTON_CONDITION)) continue;
        const tail = expression.slice(leading.length + CONFIRM_BUTTON_CONDITION.length);
        const choice = /^(\s*\?\s*)'([^'\\]*)'(\s*:\s*)''(\s*)$/.exec(tail);
        assert.ok(choice, `${filename}: unsupported confirmation-button style choice`);
        assert.ok(!node.props.some((other) => other.type === NodeTypes.DIRECTIVE && other.name === 'bind' && other.arg?.content === 'class'), `${filename}: confirmation button already has a class binding`);
        const candidates = inlineStyleUtilities(choice[2], filename);
        const utilities = candidates.join(' ');
        assert.ok(!/["'\\]/.test(utilities), `${filename}: confirmation utility requires explicit JavaScript string escaping`);
        const migrated = leading + CONFIRM_BUTTON_CONDITION + choice[1] + `'${utilities}'` + choice[3] + "''" + choice[4];
        edits.push({ start: base + property.arg.loc.start.offset, end: base + property.arg.loc.end.offset, text: 'class' });
        edits.push({ start: base + property.exp.loc.start.offset, end: base + property.exp.loc.end.offset, text: migrated });
        count += 1;
        declarations += candidates.length;
      }
    }
    for (const child of node.children || []) visit(child);
  }
  visit(ast);
  let output = source;
  for (const edit of edits.sort((first, second) => second.start - first.start)) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  assert.equal(parseSfc(output, { filename }).errors.length, 0, `${filename}: generated invalid Vue source`);
  return { source: output, count, declarations };
}

/** Compile each emitted utility and prove its one declaration is equivalent. */
export async function verifyInlineStyleUtilities(value, filename = 'inline-style.vue') {
  const declarations = parseDeclarations(value, filename);
  const candidates = inlineStyleUtilities(value, filename);
  for (let index = 0; index < candidates.length; index += 1) {
    const compiled = await compile(`@theme prefix(tw) {} ${INLINE_VARIANT} @tailwind utilities;`, { polyfills: 0 });
    const actual = [];
    postcss.parse(compiled.build([candidates[index]])).walkDecls((declaration) => actual.push(declaration));
    assert.equal(actual.length, 1, `${filename}: utility must emit exactly one declaration: ${candidates[index]}`);
    assert.equal(actual[0].prop, declarations[index].prop);
    assert.equal(
      canonicalCss(`.inline-migration{${actual[0]}}`),
      canonicalCss(`.inline-migration{${declarations[index]}}`),
      `${filename}: changed inline declaration ${declarations[index]}`,
    );
  }
  return candidates.length;
}

export async function selfTest() {
  const source = `<template>\n<div class="card" style="display:flex; width:100%" :style="dynamic"><span style='content:&quot;a b&quot;; color:red!important'/><i :class="state" style="opacity:.5"/></div>\n</template>\n<script>const example = 'style="not a template"';</script>\n<style scoped>.card { display: block; }</style>`;
  const result = migrateInlineStyles(source, 'test.vue');
  assert.equal(result.count, 3);
  assert.match(result.source, /class="card tw:inline:\[display:flex\] tw:inline:\[width:100%\]"/);
  assert.match(result.source, /tw:inline:\[content:'a_b'\]/);
  assert.match(result.source, /tw:inline:\[color:red\]!/);
  assert.match(result.source, /:style="dynamic"/);
  assert.equal(parseSfc(result.source).descriptor.script.content, parseSfc(source).descriptor.script.content);
  assert.equal(parseSfc(result.source).descriptor.styles[0].content, parseSfc(source).descriptor.styles[0].content);
  assert.equal(migrateInlineStyles(result.source).count, 0);
  assert.throws(() => inlineStyleUtilities('margin:1px;margin-left:2px'), /order-dependent/);
  await verifyInlineStyleUtilities('display:flex; width:100%');
  await verifyInlineStyleUtilities('content:"a b"; color:red!important');
  await verifyInlineStyleUtilities('background:#fff!important;background-image:none!important');
  await verifyInlineStyleUtilities(String.raw`content:"a'\"b";background-image:url("data:image/svg+xml,%3Csvg width='16'%3E")`);
  const confirmationStyle = 'background: #4f8a35 !important; background-image: none !important; border-color: #4f8a35 !important; color: #ffffff !important; box-shadow: none !important;';
  const finiteSource = `<template><button class="btn" :style="${CONFIRM_BUTTON_CONDITION} ? '${confirmationStyle}' : ''"/><span :style="{ width: progress + '%' }"/></template><script>const unchanged = true</script>`;
  const finite = migrateFiniteStyleBindings(finiteSource, 'AdminSettings.vue');
  assert.equal(finite.count, 1);
  assert.equal(finite.declarations, 5);
  assert.ok(finite.source.includes(`:class="${CONFIRM_BUTTON_CONDITION} ? '`));
  assert.ok(finite.source.includes(':style="{ width: progress + \'%\' }"'));
  assert.equal(parseSfc(finite.source).descriptor.script.content, parseSfc(finiteSource).descriptor.script.content);
  assert.equal(migrateFiniteStyleBindings(finite.source).count, 0);
  await verifyInlineStyleUtilities(confirmationStyle);
  return { attributes: result.count, finiteBindings: finite.count };
}

async function vueFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await vueFiles(path));
    else if (entry.name.endsWith('.vue')) result.push(path);
  }
  return result;
}

async function runCli() {
  if (process.argv.includes('--self-test')) {
    console.log('Static inline migration self-test passed:', await selfTest());
    return;
  }
  const write = process.argv.includes('--write');
  assert.ok(write || process.argv.includes('--check'), 'Use --check, --write, or --self-test');
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  let attributes = 0;
  let files = 0;
  for (const file of await vueFiles(src)) {
    const source = await readFile(file, 'utf8');
    const result = migrateInlineStyles(source, file);
    if (!result.count) continue;
    const template = parseSfc(source).descriptor.template;
    const ast = parseTemplate(template.content);
    const values = [];
    function collect(node) {
      if (node.type === NodeTypes.ELEMENT) {
        for (const property of node.props) {
          if (property.type === NodeTypes.ATTRIBUTE && property.name.toLowerCase() === 'style') values.push(property.value?.content || '');
        }
      }
      for (const child of node.children || []) collect(child);
    }
    collect(ast);
    for (const value of values) await verifyInlineStyleUtilities(value, file);
    if (write) await writeFile(file, result.source, 'utf8');
    attributes += result.count;
    files += 1;
  }
  console.log(JSON.stringify({ mode: write ? 'write' : 'check', attributes, files }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await runCli();
