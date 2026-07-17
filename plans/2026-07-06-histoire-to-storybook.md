# Histoire → Storybook Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Histoire with Storybook (latest v10) for the 176 component stories in `packages/core/src`, using `sb-addon-vue-csf` so stories stay as Vue SFCs with minimal rewriting.

**Architecture:** A new private workspace package at `.storybook/` (mirroring the existing `.histoire/` pattern) holds all Storybook deps and config; story files are renamed `*.story.vue` → `*.stories.vue` and mechanically transformed by a one-shot codemod (Histoire `<Story>`/`<Variant>` → `defineMeta()` + addon `<Story asChild>`). Histoire is removed at the end.

**Tech Stack:** Storybook ^10 + `@storybook/vue3-vite`, `sb-addon-vue-csf` (unovue's own addon — Storybook `^8.2 || ^9 || ^10`, Vue 3, Vite `^5 || ^6 || ^7`), Tailwind 3 (unchanged from Histoire setup), pnpm workspace.

## Global Constraints

- Node ≥ 22, pnpm 10 (`packageManager: pnpm@10.13.1`).
- Conventional Commits enforced by commitlint (`type(scope): subject`); lint-staged runs `eslint --fix` on every commit (including MD/JSON/YAML).
- Story **content** (markup, Tailwind classes, script logic) must not change — this is a mechanical re-wrap only. Diffs inside story bodies other than indentation are bugs.
- All 176 `packages/core/src/**/*.story.vue` files must end up as working `.stories.vue` files; zero `.story.vue` files may remain.
- `pnpm lint`, `pnpm --filter reka-ui type-check`, and `pnpm --filter reka-ui exec vitest run` must pass at the end (tests never imported stories, so they must stay green throughout).
- Do not add Storybook to CI in this plan (no Histoire CI job exists today); note it as a follow-up only.

## Research Findings (verified against the repo — trust these, don't re-derive)

- **176** story files match `packages/core/src/**/*.story.vue`. Some sit at family root (`Switch/Switch.story.vue`), most in `story/` subdirs. Helper components in those dirs (`_SelectItem.vue`, `StoryFrame`, `ScrollAreaStory`, …) are NOT story files and are untouched.
- Every file wraps everything in exactly **one** `<Story title="..." :layout="{...}">` (the open tag usually spans multiple lines) containing one or more `<Variant title="...">` blocks — 471 uniform `<Variant title="…">` plus **3 empty `<Variant />`** (ScrollArea chromatic stories, lines ~56 of `ScrollAreaChromaticHorizontal/Vertical/Both.story.vue`).
- Wrapper titles are **unique across all files** (verified with a per-file extraction + `uniq -d` → empty).
- **Zero** usage of Histoire controls components (`Hst*`), `initState`, `logEvent`, or `<docs>` blocks. **7 files** use a plain-HTML `<template #controls>` slot (listed in Task 4). 3 files have no `<script setup>` block. 32 files import via the `@` alias (→ `packages/core/src`).
- The `:layout` prop (grid/single/iframe) has no direct Storybook equivalent and is simply dropped; each Variant becomes its own Storybook story canvas.
- `sb-addon-vue-csf` API: `import { defineMeta } from 'sb-addon-vue-csf'` in `<script setup>`, `const { Story } = defineMeta({ title, component?, argTypes? })`, then `<Story name="..." :args="{...}">` in template. **`asChild` renders children as-is without args** — perfect here since no story uses args. Stories glob must include `.vue`: `*.stories.@(js|ts|vue)`.
- A previous Storybook attempt failed (see `debug-storybook.log` at repo root) because it mixed Storybook 10 with `@storybook/theming@9.0.0-alpha.1` and a custom `manager.tsx` importing `@storybook/manager-api`. In Storybook 9/10 those are consolidated subpath exports (`storybook/theming`, `storybook/manager-api`) — **do not install any `@storybook/*` addon/lib packages besides `@storybook/vue3-vite`**, and skip custom manager theming entirely.
- Current Histoire config to replicate: `@` alias → `../packages/core/src`, `setup.ts` importing `style.css` (Tailwind + accordion `@layer` helpers), `tailwind.config.js` (radix colors + keyframes, content `../packages/core/src/**/*.vue`), `postcss.config.js` (tailwindcss/nesting + tailwindcss + autoprefixer), `server.fs.allow: ['..']`.
- Repo-wide `.story.vue` / Histoire touchpoints that must be updated: `eslint.config.mjs:46`, `packages/core/tsconfig.check.json`, `packages/core/tsconfig.app.json:10-14`, `packages/core/env.d.ts`, `playground/vue3/.env.d.ts`, `playground/vue3/src/vite-env.d.ts`, root `package.json` (`story:dev`), `pnpm-workspace.yaml` (`.histoire` entry), `CONTRIBUTING.md:26,50,71`, `CLAUDE.md` ("Stories are Histoire…"), `packages/core/README.md:69`.
- No GitHub workflow references Histoire or Chromatic — CI needs no changes.

---

### Task 1: Scaffold the `.storybook` workspace package

**Files:**
- Create: `.storybook/package.json`
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`
- Create: `.storybook/style.css` (copied from `.histoire/style.css` minus Histoire-specific selectors)
- Create: `.storybook/tailwind.config.js` (verbatim copy of `.histoire/tailwind.config.js`)
- Create: `.storybook/postcss.config.js` (verbatim copy of `.histoire/postcss.config.js`)
- Modify: `pnpm-workspace.yaml` (add `.storybook` to packages)
- Modify: `.gitignore` (ignore Storybook build output + logs)
- Modify: root `package.json` (scripts)

**Interfaces:**
- Produces: workspace package named `@reka-ui/storybook` with scripts `dev` / `build`; stories glob `../packages/core/src/**/*.stories.vue`; `@` alias resolving to `packages/core/src`. Later tasks rely on the package name for `pnpm --filter @reka-ui/storybook …`.

- [ ] **Step 1: Create `.storybook/package.json`**

```json
{
  "name": "@reka-ui/storybook",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "storybook dev -p 6006 -c .",
    "build": "storybook build -c ."
  }
}
```

- [ ] **Step 2: Register the workspace package**

In `pnpm-workspace.yaml`, add `.storybook` under `packages:` (keep `.histoire` for now — it is removed in Task 6):

```yaml
packages:
  - 'packages/*'
  - docs
  - .histoire
  - .storybook
```

- [ ] **Step 3: Install dependencies**

Run from repo root:

```bash
pnpm --filter @reka-ui/storybook add -D storybook@latest @storybook/vue3-vite@latest sb-addon-vue-csf@latest vite@^7 @vitejs/plugin-vue@latest vue@^3.5 @iconify/vue@^4.3.0 @radix-ui/colors@^3.0.0 tailwindcss@^3.4.17 tailwindcss-animate@1.0.7 autoprefixer@^10.4.20 postcss@^8.5.10
```

Expected: installs Storybook 10.x and the addon with no peer-dependency warnings mentioning `@storybook/*@9.0.0-alpha` (that was the old broken attempt). If `storybook@latest` has moved past ^10 and `sb-addon-vue-csf` doesn't support it yet, pin `storybook@^10 @storybook/vue3-vite@^10` instead.

- [ ] **Step 4: Create `.storybook/main.ts`**

```ts
import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: ['../packages/core/src/**/*.stories.vue'],
  addons: ['sb-addon-vue-csf'],
  framework: '@storybook/vue3-vite',
  core: {
    disableTelemetry: true,
  },
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite')
    return mergeConfig(viteConfig, {
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('../packages/core/src', import.meta.url)),
        },
      },
      server: {
        fs: {
          allow: ['..'],
        },
      },
    })
  },
}

export default config
```

Troubleshooting note: story files live outside the Vite root (`.storybook/`), so if Vite fails to resolve `sb-addon-vue-csf` or `@iconify/vue` imported from `packages/core/src/**`, add explicit aliases next to `@`:

```ts
const fallbackAliases = {
  'sb-addon-vue-csf': fileURLToPath(new URL('./node_modules/sb-addon-vue-csf', import.meta.url)),
  '@iconify/vue': fileURLToPath(new URL('./node_modules/@iconify/vue', import.meta.url)),
}
```

(The `.histoire` package proved this deps-outside-root layout works, so only add these if the error actually appears.)

- [ ] **Step 5: Create `.storybook/preview.ts`**

Stories use `text-white` labels and assume a dark canvas, so default the background to dark:

```ts
import type { Preview } from '@storybook/vue3-vite'
import './style.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      options: {
        dark: { name: 'Dark', value: '#1c2333' },
        light: { name: 'Light', value: '#f8fafc' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'dark' },
  },
}

export default preview
```

(If the installed Storybook's backgrounds API differs, follow https://storybook.js.org/docs/essentials/backgrounds for the exact shape — the intent is: dark by default, light toggle available.)

- [ ] **Step 6: Copy the styling files**

`.storybook/postcss.config.js` and `.storybook/tailwind.config.js`: copy byte-for-byte from `.histoire/` (the tailwind `content: ['../packages/core/src/**/*.vue']` glob is the same relative depth, so it keeps working and also matches the new `.stories.vue` files).

`.storybook/style.css`: copy from `.histoire/style.css` but **delete the two `.histoire-generic-render-story` rules at the bottom** (Histoire-specific centering hacks; Storybook's `layout: 'centered'` parameter replaces them). Keep `@tailwind` directives and the whole `@layer components` block (accordion stories depend on those classes).

- [ ] **Step 7: Update root scripts and .gitignore**

Root `package.json` scripts — replace the Histoire line:

```json
{
  "story:dev": "pnpm --filter @reka-ui/storybook dev",
  "story:build": "pnpm --filter @reka-ui/storybook build"
}
```

`.gitignore` — add:

```gitignore
.storybook/storybook-static
*storybook.log
```

- [ ] **Step 8: Verify Storybook boots empty**

```bash
pnpm i
pnpm --filter @reka-ui/storybook dev
```

Expected: dev server starts on :6006 with a "No story files found for the specified pattern" warning (no `.stories.vue` files exist yet) and **no build errors**. Ctrl-C afterwards.

- [ ] **Step 9: Commit**

```bash
git add .storybook pnpm-workspace.yaml pnpm-lock.yaml package.json .gitignore
git commit -m "feat(storybook): scaffold Storybook workspace package"
```

---

### Task 2: Pilot — hand-migrate the Switch story

Validates the whole pipeline on one file before automating 175 more.

**Files:**
- Create: `packages/core/src/Switch/Switch.stories.vue`
- Delete: `packages/core/src/Switch/Switch.story.vue`

**Interfaces:**
- Consumes: `@reka-ui/storybook` package from Task 1.
- Produces: the canonical target shape the Task 3 codemod must reproduce: `defineMeta` import + `const { Story } = defineMeta({ title: '<old wrapper title>' })` in `<script setup>`, one `<Story name="<variant title>" asChild>` per old `<Variant>`.

- [ ] **Step 1: Write `Switch.stories.vue`**

The old file wraps 3 variants in `<Story title="Switch/Demo" :layout="{ type: 'single', iframe: true }">`. New file (script block gains 2 additions, wrapper dissolves, each `<Variant title>` → `<Story name … asChild>`, `:layout` dropped, body markup byte-identical):

```vue
<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'
import { ref } from 'vue'
import { SwitchRoot, SwitchThumb } from '.'

const switchState = ref(true)
const customStringState = ref<'on' | 'off'>('off')
const customNumberState = ref<1 | 0>(0)

const { Story } = defineMeta({
  title: 'Switch/Demo',
})
</script>

<template>
  <Story name="default" as-child>
    <div class="flex gap-2 items-center">
      <label
        class="text-white text-[15px] leading-none pr-[15px]"
        for="airplane-mode"
      >
        Airplane mode
      </label>
      <SwitchRoot
        id="airplane-mode"
        v-model="switchState"
        class="w-[42px] h-[25px] focus-within:outline focus-within:outline-black flex bg-black/50 shadow-sm rounded-full relative data-[state=checked]:bg-black cursor-default"
      >
        <SwitchThumb
          class="block w-[21px] h-[21px] my-auto bg-white shadow-sm rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
        />
      </SwitchRoot>
    </div>
  </Story>

  <Story name="Custom string values" as-child>
    <div class="flex flex-col gap-4">
      <div class="flex gap-2 items-center">
        <label
          class="text-white text-[15px] leading-none pr-[15px]"
          for="custom-string"
        >
          Status
        </label>
        <SwitchRoot
          id="custom-string"
          v-model="customStringState"
          true-value="on"
          false-value="off"
          class="w-[42px] h-[25px] focus-within:outline focus-within:outline-black flex bg-black/50 shadow-sm rounded-full relative data-[state=checked]:bg-black cursor-default"
        >
          <SwitchThumb
            class="block w-[21px] h-[21px] my-auto bg-white shadow-sm rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
          />
        </SwitchRoot>
      </div>
      <span class="text-white text-sm">v-model value: "{{ customStringState }}"</span>
    </div>
  </Story>

  <Story name="Custom number values" as-child>
    <div class="flex flex-col gap-4">
      <div class="flex gap-2 items-center">
        <label
          class="text-white text-[15px] leading-none pr-[15px]"
          for="custom-number"
        >
          Permission
        </label>
        <SwitchRoot
          id="custom-number"
          v-model="customNumberState"
          :true-value="1"
          :false-value="0"
          class="w-[42px] h-[25px] focus-within:outline focus-within:outline-black flex bg-black/50 shadow-sm rounded-full relative data-[state=checked]:bg-black cursor-default"
        >
          <SwitchThumb
            class="block w-[21px] h-[21px] my-auto bg-white shadow-sm rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
          />
        </SwitchRoot>
      </div>
      <span class="text-white text-sm">v-model value: {{ customNumberState }}</span>
    </div>
  </Story>
</template>
```

Then delete the old file:

```bash
git rm packages/core/src/Switch/Switch.story.vue
```

- [ ] **Step 2: Verify in dev**

```bash
pnpm --filter @reka-ui/storybook dev
```

Expected: sidebar shows **Switch → Demo** with stories *default*, *Custom string values*, *Custom number values*; each renders a styled toggle (Tailwind working), toggling works, both v-model value labels update. If styles are missing, check the tailwind `content` glob; if the `sb-addon-vue-csf` import fails to resolve, apply the alias fallback from Task 1 Step 4.

- [ ] **Step 3: Verify static build**

```bash
pnpm --filter @reka-ui/storybook build
```

Expected: build completes without errors, output in `.storybook/storybook-static/`.

- [ ] **Step 4: Commit**

```bash
git add -A packages/core/src/Switch
git commit -m "feat(storybook): migrate Switch story as pilot"
```

---

### Task 3: Codemod the remaining 175 story files

**Files:**
- Create: `scripts/migrate-histoire-stories.mts` (repo root `scripts/` — new dir; deleted again in Task 6)
- Modify/rename: every remaining `packages/core/src/**/*.story.vue` → `.stories.vue`

**Interfaces:**
- Consumes: the target shape defined in Task 2.
- Produces: all story files renamed and transformed; prints a "Needs manual attention" list consumed by Task 4.

- [ ] **Step 1: Write the codemod**

`scripts/migrate-histoire-stories.mts`:

```ts
/**
 * One-shot codemod: Histoire *.story.vue → Storybook (sb-addon-vue-csf) *.stories.vue
 * Run from repo root: pnpm tsx scripts/migrate-histoire-stories.mts
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const files = execSync('git ls-files "packages/core/src/**/*.story.vue"', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean)

const manual: string[] = []
let migrated = 0

for (const file of files) {
  const src = readFileSync(file, 'utf8')

  // The single wrapper <Story ...> open tag — usually spans multiple lines,
  // never contains ">" inside attribute values (verified repo-wide).
  const open = src.match(/[ \t]*<Story\b[^>]*>[ \t]*\r?\n/)
  const title = open?.[0].match(/title="([^"]+)"/)?.[1]
  if (!open || !title) {
    manual.push(`${file} — no <Story title="..."> wrapper found`)
    continue
  }

  let out = src.replace(open[0], '')
  // Remove the single wrapper close tag BEFORE Variants become <Story>.
  out = out.replace(/[ \t]*<\/Story>[ \t]*\r?\n/, '')

  out = out
    .replace(/<Variant\s+title="([^"]*)"\s*>/g, '<Story name="$1" asChild>')
    .replace(/<Variant\s*\/>/g, '<Story name="Empty" asChild />')
    .replace(/<\/Variant>/g, '</Story>')

  const importLine = 'import { defineMeta } from \'sb-addon-vue-csf\'\n'
  const metaBlock = `\nconst { Story } = defineMeta({\n  title: '${title}',\n})\n`
  if (/<script setup[^>]*>/.test(out)) {
    out = out.replace(/(<script setup[^>]*>\r?\n)/, `$1${importLine}`)
    out = out.replace(/\r?\n<\/script>/, `\n${metaBlock}</script>`)
  }
  else {
    out = `<script setup lang="ts">\n${importLine}${metaBlock}</script>\n\n${out}`
  }

  if (out.includes('Variant'))
    manual.push(`${file} — leftover <Variant> (unusual attributes?)`)
  if (out.includes('#controls'))
    manual.push(`${file} — has <template #controls> slot`)

  const dest = file.replace(/\.story\.vue$/, '.stories.vue')
  writeFileSync(dest, out)
  execSync(`git rm -q ${JSON.stringify(file)}`)
  execSync(`git add ${JSON.stringify(dest)}`)
  migrated++
}

console.log(`Migrated ${migrated}/${files.length} files.`)
if (manual.length) {
  console.log('\nNeeds manual attention:')
  for (const f of manual)
    console.log(`  - ${f}`)
}
```

Notes on intentional behavior: variant bodies keep their old (now too-deep) indentation — `eslint --fix` re-indents in Step 3; the 3 empty `<Variant />` become `<Story name="Empty" asChild />` and are deleted by hand in Task 4.

- [ ] **Step 2: Run it**

```bash
pnpm tsx scripts/migrate-histoire-stories.mts
```

Expected output: `Migrated 175/175 files.` and a "Needs manual attention" list containing exactly the 7 `#controls` files (see Task 4). If any file reports "no `<Story title>` wrapper" or "leftover `<Variant>`", inspect and fix that file by hand to match the Task 2 shape, then re-run (already-renamed files are no longer matched, so re-running is safe).

- [ ] **Step 3: Re-indent and lint**

```bash
pnpm eslint "packages/core/src/**/*.stories.vue" --fix
```

Expected: exits 0 (the `vue/html-indent` formatter fixes the dedent). Remaining errors, if any, point at files needing hand-fixes — fix and re-run.

- [ ] **Step 4: Sanity checks**

```bash
git ls-files "packages/core/src/**/*.story.vue" | wc -l   # → 0
git ls-files "packages/core/src/**/*.stories.vue" | wc -l # → 176
grep -rl "<Variant" packages/core/src --include="*.stories.vue" | wc -l  # → 0
```

Also verify story bodies didn't change beyond re-wrap — spot check one diff:

```bash
git diff HEAD --stat -- packages/core/src | tail -3
git diff HEAD -M -- "packages/core/src/Separator/*"
```

Expected in the Separator diff: rename detected, only the script-block additions, wrapper/Variant tag lines, and indentation changed.

- [ ] **Step 5: Commit**

```bash
git add -A packages/core/src scripts
git commit -m "feat(storybook): migrate all stories to sb-addon-vue-csf via codemod"
```

---

### Task 4: Hand-fix controls slots, empty variants, and verify runtime

**Files (the 7 `#controls` files, post-rename):**
- Modify: `packages/core/src/Accordion/story/AccordionSingle.stories.vue`
- Modify: `packages/core/src/Accordion/story/AccordionMultiple.stories.vue`
- Modify: `packages/core/src/Accordion/story/AccordionAnimated.stories.vue`
- Modify: `packages/core/src/Progress/story/Progress.stories.vue`
- Modify: `packages/core/src/NavigationMenu/story/NavigationMenuBasic.stories.vue`
- Modify: `packages/core/src/DismissableLayer/story/DismissableLayerBasic.stories.vue`
- Modify: `packages/core/src/ScrollArea/story/ScrollAreaBasic.stories.vue`
- Modify: `packages/core/src/ScrollArea/story/ScrollAreaChromaticHorizontal.stories.vue` (empty variant)
- Modify: `packages/core/src/ScrollArea/story/ScrollAreaChromaticVertical.stories.vue` (empty variant)
- Modify: `packages/core/src/ScrollArea/story/ScrollAreaChromaticBoth.stories.vue` (empty variant)

**Interfaces:**
- Consumes: codemod output + its "Needs manual attention" list.
- Produces: zero `#controls` templates and zero `name="Empty"` stories remain.

- [ ] **Step 1: Inline each `<template #controls>` into the story body**

Histoire rendered `#controls` in a sidebar; the inputs are plain HTML bound to local refs, so move them to the top of the story body. Pattern (AccordionSingle example) — before:

```vue
<Story name="closed by default" asChild>
  <template #controls>
    modelValue: <input
      v-model="selectedValue"
      type="text"
    >
  </template>

  <AccordionRoot ...>
```

after:

```vue
<Story name="closed by default" asChild>
  <div class="mb-4 text-sm text-white">
    modelValue: <input
      v-model="selectedValue"
      type="text"
      class="text-black"
    >
  </div>

  <AccordionRoot ...>
```

Apply the same mechanical move in all 7 files (keep bindings exactly as they are; only the wrapper `<template #controls>` becomes a plain `<div class="mb-4 text-sm text-white">`, and text inputs get `class="text-black"` so they stay readable on the dark canvas).

- [ ] **Step 2: Delete the 3 placeholder stories**

In the three `ScrollAreaChromatic*.stories.vue` files, delete the line `<Story name="Empty" asChild />` (it was an empty grid placeholder in Histoire; it renders a pointless blank story in Storybook).

- [ ] **Step 3: Runtime spot-check**

```bash
pnpm --filter @reka-ui/storybook dev
```

Walk this checklist in the browser (chosen to cover portals, floating positioning, virtualization, animation, and the hand-fixed files):

- Accordion → Single (moved controls input works and drives the accordion)
- Dialog and AlertDialog (portal + overlay render, open/close works)
- Select → Demo (popper positioning, scroll buttons)
- Tree → Virtual (virtualizer scrolls)
- NumberField (stepping works)
- Toast (timed toasts appear)
- ScrollArea → Basic + one Chromatic story
- ColorArea / ColorSlider (pointer interactions)

Fix anything broken before proceeding; typical culprits are the dropped `:layout` (cosmetic only — acceptable) and bare-import resolution (alias fallback in Task 1 Step 4).

- [ ] **Step 4: Full static build**

```bash
pnpm --filter @reka-ui/storybook build
```

Expected: completes with all 176 files' stories and no errors.

- [ ] **Step 5: Commit**

```bash
git add -A packages/core/src
git commit -m "feat(storybook): inline controls slots and drop empty placeholder variants"
```

---

### Task 5: Update repo configs for the `.stories.vue` rename

**Files:**
- Modify: `eslint.config.mjs:46`
- Modify: `packages/core/tsconfig.check.json`
- Modify: `packages/core/tsconfig.app.json:8-15`
- Modify: `packages/core/env.d.ts`
- Modify: `playground/vue3/.env.d.ts`
- Modify: `playground/vue3/src/vite-env.d.ts`

**Interfaces:**
- Consumes: renamed story files.
- Produces: green `pnpm lint`, `pnpm --filter reka-ui type-check`, `pnpm --filter reka-ui build`.

- [ ] **Step 1: eslint override**

In `eslint.config.mjs` line 46, change `files: ['*.story.vue'],` → `files: ['*.stories.vue'],` (keeps the `no-console`/`no-alert`/unused-vars relaxations applying to stories).

- [ ] **Step 2: tsconfig.check.json exclude**

Change `"src/**/*.story.vue"` → `"src/**/*.stories.vue"` (the `src/**/story/*` and `src/**/stories/*` entries stay).

- [ ] **Step 3: tsconfig.app.json paths**

Replace the Histoire-hosted paths/comment block:

```jsonc
{
  "paths": {
    "@/*": ["./src/*"],
    "@iconify/vue": ["../../.storybook/node_modules/@iconify/vue"],
    "sb-addon-vue-csf": ["../../.storybook/node_modules/sb-addon-vue-csf"]
  },
  // TODO: set skipLibCheck to false (#2043)
  "skipLibCheck": true
}
```

(The `sb-addon-vue-csf` mapping mirrors the existing `@iconify/vue` precedent so `defineMeta` imports type-check from inside `packages/core`.)

- [ ] **Step 4: Remove Histoire type references**

- `packages/core/env.d.ts`: delete the line `/// <reference types="../../.histoire/node_modules/@histoire/plugin-vue/components" />` (stories now import `Story` explicitly; no globals needed).
- `playground/vue3/.env.d.ts` and `playground/vue3/src/vite-env.d.ts`: delete the `/// <reference types="@histoire/plugin-vue/components" />` line from each.

- [ ] **Step 5: Verify**

```bash
pnpm lint
pnpm --filter reka-ui type-check
pnpm --filter reka-ui build
pnpm --filter reka-ui exec vitest run
```

Expected: all pass. If type-check trips on `.stories.vue` files anyway, confirm the exclude patterns in `tsconfig.check.json` cover the failing paths (root-level files like `Switch.stories.vue` rely on the `src/**/*.stories.vue` pattern).

- [ ] **Step 6: Commit**

```bash
git add eslint.config.mjs packages/core playground
git commit -m "chore: update lint/tsconfig references for .stories.vue rename"
```

---

### Task 6: Remove Histoire and update docs

**Files:**
- Delete: `.histoire/` (entire directory), `scripts/migrate-histoire-stories.mts`, `debug-storybook.log`
- Modify: `pnpm-workspace.yaml`, `CONTRIBUTING.md`, `CLAUDE.md`, `packages/core/README.md`

**Interfaces:**
- Consumes: everything green from Task 5.
- Produces: zero `histoire` references outside `pnpm-lock.yaml` history.

- [ ] **Step 1: Delete Histoire and the one-shot codemod**

```bash
git rm -r .histoire
git rm scripts/migrate-histoire-stories.mts
rm -f debug-storybook.log && git rm --ignore-unmatch debug-storybook.log
```

Remove the `- .histoire` line from `pnpm-workspace.yaml`, then:

```bash
pnpm i
```

Expected: lockfile drops all `histoire` packages; install succeeds.

- [ ] **Step 2: Update docs**

- `CONTRIBUTING.md` line 26: `| \`.histoire/\` | Histoire setup for the component stories. |` → `| \`.storybook/\` | Storybook setup for the component stories. |`
- `CONTRIBUTING.md` line ~50: change "opens Histoire with the" → "opens Storybook with the" (adjust the sentence to fit).
- `CONTRIBUTING.md` line ~71 (Stories row): command stays `pnpm story:dev` — verify wording still says nothing Histoire-specific.
- `CLAUDE.md`: change `Stories are Histoire (\`*.story.vue\`), not Storybook.` → `Stories are Storybook \`*.stories.vue\` files using sb-addon-vue-csf (Vue CSF: \`defineMeta\` + \`<Story>\`); config lives in \`.storybook/\`.`
- `packages/core/README.md` line 69: "run histoire (storybook)" → "run Storybook".

- [ ] **Step 3: Final sweep + full verification**

```bash
grep -ri "histoire" --exclude-dir=node_modules --exclude-dir=.git --exclude=pnpm-lock.yaml -l .   # → no output
pnpm lint
pnpm --filter reka-ui type-check
pnpm --filter reka-ui exec vitest run
pnpm --filter @reka-ui/storybook build
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove Histoire in favor of Storybook"
```

---

## Explicit non-goals / follow-ups (do NOT do in this plan)

- **CI**: add a `storybook build` (or publish to Chromatic/pkg.pr.new preview) job — separate PR.
- **Args/controls adoption**: stories keep local `ref`s instead of Storybook args; converting to `:args` + `argTypes` for interactive controls is per-story future work the addon supports.
- **Per-story layout tuning**: Histoire's grid layouts were dropped; if some stories look cramped centered, set `parameters: { layout: 'padded' }` per story later.
- **Interaction tests / play functions**: supported by the addon, out of scope.
- **skipLibCheck: false** (#2043): unchanged.
