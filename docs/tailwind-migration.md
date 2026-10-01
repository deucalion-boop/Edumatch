# Tailwind styling in EduMatch

The entire frontend's application declaration rules now compile with Tailwind CSS 4.
The old eight `frontend/public/css/*.css` files have been removed. All five roles,
authentication routes, shared components, and the archive print document use the
Tailwind build pipeline.

## How styles are authored

- Template utilities use the `tw:` prefix, for example `class="tw:flex tw:gap-4"`.
  This prevents collisions with existing semantic names such as `container`.
- Existing component and theme selectors use `@apply tw:...` in Vue style blocks
  and `frontend/src/styles/*.tailwind.css`. Exact arbitrary values preserve the
  current design, including breakpoints, colors, shadows, and override priority.
- CSS variable definitions and keyframe bodies remain as Tailwind theme/animation
  primitives. Runtime `:style` bindings still supply live progress, chart, and tour
  geometry; they cannot be replaced with a fixed set of generated classes.
- Font Awesome remains a third-party stylesheet. Tailwind compiles to CSS too, so
  generated `.css` files under `dist/assets` are expected.

This is a complete migration to **Tailwind component styles plus template
utilities**. Most existing semantic template class names remain because scripts,
theme rules, notifications, and tours use them. It is not a rewrite that places
every responsive and descendant selector directly in the templates.

The source entry is `frontend/src/styles/tailwind.css`. It deliberately does not
enable Preflight: the existing reset has been converted to Tailwind to retain
the current rendering. Component rules and utility output share the unlayered
author cascade; only theme defaults are layered. Do not wrap existing component
rules in a new layer without checking `!important` priority and overrides.

In a Vue style block, reference the entry relative to the component:

```vue
<template>
  <div class="tw:flex tw:gap-4">...</div>
</template>
<style scoped>
@reference "../../styles/tailwind.css";
.existing-card {
  @apply tw:flex;
  @apply tw:[padding:1.25rem];
}
</style>
```

One `@apply` per existing declaration intentionally preserves shorthand/longhand
and browser-fallback order. Avoid regrouping these blindly: Tailwind sorts
utilities within a single `@apply`.

The `tw:inline:` variant is reserved for the former static inline overrides. It
preserves their priority over component selectors without making normal values
`!important`. New components should normally use ordinary `tw:` utilities.

## Stylesheet loading

| Previous public asset | Tailwind source under `frontend/src/styles` |
| --- | --- |
| `iabcc.css` | `foundation.tailwind.css` |
| `student.css` | `roles/student.tailwind.css` |
| `notifications.css` | `notifications.tailwind.css` |
| `auth.css` | `auth.tailwind.css` |
| `admin.css` | `roles/admin.tailwind.css` |
| `teacher.css` | `roles/teacher.tailwind.css` |
| `secretary.css` | `roles/secretary.tailwind.css` |
| `headteacher.css` | `roles/headteacher.tailwind.css` |

The first three load in the original order. Authentication/admin imports retain
their original Vue scopes. The router attaches/removes the teacher, secretary,
and head-teacher assets on role navigation. Secretary retains its dependency on
teacher styles. Use string-form local `@import` statements so Tailwind expands
them before Vue applies scoped selectors.

Vite emits hashed role assets and adds preload links after bundling. The service
worker discovers these links and caches them, without activating those role
styles on other pages. Never add the role styles as eager application imports.
The cache version was incremented so installed clients discard the old assets.

## Verification

From `frontend`:

```sh
npm run check:styles
npm run test:tailwind
npm run build
npm run check:styles:dist
```

The source audit fails on ordinary application declarations, static inline
styles, unprefixed applications, or references to the deleted public styles.
The output audit also rejects uncompiled Tailwind directives and old `dist/css`
assets. Both audits work on a fresh checkout.

For this migration, a local pre-conversion snapshot and generated evidence are
kept in the gitignored `frontend/.tailwind-migration` directory. The declaration
comparison checks all 44 Vue files, 43 style blocks, 9 stylesheet sources, 96
keyframes, 25 converted static inline attributes, and one finite conditional
style binding (52 inline declarations in total). It also checks script
content, unaffected template attributes, imports, and Vue scoped compilation.

```sh
node scripts/verify-tailwind-styles.mjs --final
node scripts/verify-tailwind-ui.mjs --production --full --wait-for-styles
```

These comparison commands require that local snapshot. The browser harness uses
synthetic local API fixtures, blocks outside traffic, and writes before/after
screenshots plus computed-style/geometry results to `.tailwind-migration/visual`.
It does not send requests to real accounts or modify backend data. Fixture-based
checks do not replace validation of populated workflows and real permissions.
`--wait-for-styles` holds synthetic API responses until role stylesheets load,
avoiding the existing Chart.js startup race in the original secretary dashboard.
The browser report keeps timing and fixture limitations explicit.

The role stylesheet/cache test can also run without the old snapshot after a
production build (requires an installed Chrome or Edge browser):

```sh
node scripts/verify-role-styles.mjs
```

The offline test uses a frozen copy of `dist` and a same-origin static-host
simulation (`preview.cors: false`). Vite's default preview CORS headers vary
cached responses by `Origin`, which can prevent its precached module assets
from matching offline requests. No application cache policy was changed for
this test; verify offline behavior separately on the actual deployment host.

### Completed migration checks

- Production build, compiler self-tests, source/output audit, and full declaration
  comparison passed.
- All 39 routes rendered in 106 desktop/mobile/theme comparisons, including 24
  additional inner-scroll screenshot pairs. No layout differences or new browser
  errors were found. The first run matched 105 screenshots; a two-pixel deviation
  on Admin Profile disappeared on an exact-comparison rerun.
- All 32 dashboard loading/error cases had matching layout and computed styles.
  The first run matched 31 screenshots; a seven-pixel deviation on the student
  mobile error state disappeared on an exact-comparison rerun.
- All 14 role loading/cache checks passed, including a fresh offline app and
  stylesheet responses served by the service worker. No pixel tolerance was
  relaxed, and original reports were retained alongside rerun reports.

The `migrate-styles.mjs` converter is a one-time migration tool, not a build step.
Do not rerun its `convert` command after making new component changes: it starts
from the preserved snapshot. Use the normal Vite build for day-to-day work.

Do not edit `frontend/dist`: rebuild it from the source files.
