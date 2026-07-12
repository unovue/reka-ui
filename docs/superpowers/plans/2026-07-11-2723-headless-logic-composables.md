# Headless Logic Composables (`useX()`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Tracks GitHub issue **#2723** (Phase 1 — Foundation), part of the reka-ui v3 roadmap **#2721**. Deliberately **decoupled** from #2722 (`useRender`) — the pilots ship against today's `Primitive`; the return contract is shaped so the later `useRender` swap is mechanical.

**Goal:** Every component family exposes a `useX()` composable that holds all logic/state; the `.vue` SFC becomes a thin shell composing `useX()` + (today) `Primitive` / (later) `useRender`. Components keep their exact public API — an internal re-architecture that additively exposes the logic layer as a new public API.

**Architecture:** Extract a family's logic into a pure `use<Family>.ts` taking a `MaybeRefOrGetter`/`Ref` props bag and returning, **per rendered part, a `PartSurface { props, state }`** — `props` holds aria/id/value/handlers, `state` holds the semantic state object (`{ state: 'checked' | 'unchecked', disabled }`). `data-*` attributes are derived from `state` by one shared `stateToDataAttrs` helper whose semantics are **identical to #2722's `getStateAttributes`** (so #2722 subsumes it 1:1 and the SFC later passes `state` straight into `useRender`). The Root SFC keeps `defineProps`/`withDefaults`/`defineEmits`/`useVModel`/`createContext`/`useForwardExpose` and DOM-bound bits, calls `provideX(context)`, and merges surfaces onto the element via **`mergeProps` (not object spread)** so consumer listeners chain. Multi-part families expose per-item **getters** (`getTriggerSurface(value)`), not one root attrs blob.

This plan establishes the pattern on **two structurally-different pilots — Switch (form-control archetype) then Tabs (collection / per-item / roving-focus archetype)** — and only freezes the ~57-family recipe after Tabs forces it to answer the hard questions Switch alone dodges.

**Tech Stack:** Vue 3 (`<script setup>`, generics, `mergeProps`), TypeScript, VueUse (`useVModel`), vitest + jsdom + `@testing-library/vue` + `@vue/test-utils` + `vitest-axe`, pnpm monorepo.

## Global Constraints

- Node ≥ 22, pnpm 10. All commands from repo root.
- Test (one-shot): `pnpm --filter reka-ui exec vitest run <path>` — never `pnpm test` (watch).
- Type-check: `pnpm --filter reka-ui type-check`. Lint fix: `pnpm lint:fix`. Build: `pnpm --filter reka-ui build`.
- **Public API of every component is frozen** — props, emits, slots, exposed refs, context shape, aria-/data- attributes, id/label wiring, listener-chaining, and DOM structure must be byte-for-byte unchanged.
- **The black-box oracle is NOT sufficient by itself.** Existing `*.test.ts` are thin (`Switch.test.ts` asserts nothing about `id`/`aria-label`/user-listener chaining; `Popover.test.ts` is 42 lines). Every family MUST get **characterization tests written against the UNMODIFIED component first** (Task 0 / recipe step 1) covering the surface the existing suite misses. Never weaken an existing assertion.
- **Merge, don't clobber.** Bind surfaces with `mergeProps(part.props.value, stateToDataAttrs(part.state.value), scopeIdAttrs, $attrs)` (import `mergeProps` from `vue`) — plain object spread makes a consumer's `onClick` in `$attrs` replace the part's handler. Handlers live in `part.props` (e.g. `onClick`) so `mergeProps` chains them.
- Composables must be SSR-safe: no `document`/`window` at call scope; DOM-bound logic (`useFormControl`, `document.querySelector` label lookup) stays in the SFC behind a `currentElement` ref.
- Reactivity rule (the #1 footgun): pass props into `useX()` as getters (`() => props.x`) or `Ref`s, read with `toValue()`. Never a raw `props.x` snapshot.
- **Naming is permanent AND ecosystem-scoped.** `export *` publishes `UseXProps`/`UseXReturn` instantly. Before naming any `useX`, audit for collisions against `vue` (e.g. `useId`), `@vueuse/core` (e.g. **`useToggle`**), and common Nuxt auto-imports; on a clash, rename (`useTogglePressed`) or home the composable at a `reka-ui/composables` subpath with a root re-export only when clean.
- Composable tests run in an `effectScope`/mount harness (watchers/lifecycle) — model on #2722's test harness. "Callable outside `setup()`" is NOT part of the contract in general (only computed-only families like Switch happen to allow it).
- `docs/content/meta/*.md` is AUTO-GENERATED — never hand-edit. Regenerate family-scoped only (build first). Generic SFCs (`SwitchRoot.vue`) may diff for tool reasons (vue-component-meta v3 regresses generic SFC params) — if a diff appears, regen on a clean checkout first to separate tool noise from real surface change.
- Conventional Commits, scope = family: `feat(Switch): …`. commitlint enforces.

---

## File Structure

**Pilot 1 = Switch** (form-control archetype): self-contained (nothing imports `@/Switch`), provided context, form integration (`useFormControl` + sibling `VisuallyHiddenInput`), aria, data-attrs, keyboard handler, generic `T`, single attr-bearing root, one context-consuming part. **Pilot 2 = Tabs** (collection archetype): multi-part, per-item ids from `(context, value)`, `<RovingFocusItem as-child>` wrapper behavior, registration methods in context — the archetype Switch cannot exercise.

Existing pilot files:
- `packages/core/src/Switch/SwitchRoot.vue` (provides `SwitchRootContext`; binds `:id` L102, `:type` L105, `:aria-label="$attrs['aria-label'] || ariaLabel"` L107 where `ariaLabel` is the `[for]` querySelector computed L91, `@click`/`@keydown.enter.prevent` L116-117, hidden input L125-134), `SwitchThumb.vue` (derives `data-state`/`data-disabled` from context), `Switch/index.ts`, `Switch.test.ts` / `Switch.story.vue` / `_Switch.vue`.
- `packages/core/src/Tabs/TabsRoot.vue`, `TabsTrigger.vue` (`triggerId = makeTriggerId(baseId, value)` L29, `contentId` L30, `<RovingFocusItem as-child>` L36-37), `TabsContent.vue`, `TabsList.vue`, `Tabs/utils.ts` (`makeTriggerId`/`makeContentId`), `Tabs.test.ts`.

Files this plan creates/modifies:
- **Create** `packages/core/src/shared/stateToDataAttrs.ts` (+ test) — the state→`data-*` helper (semantics identical to #2722 `getStateAttributes`; consolidated into one when #2722 lands).
- **Create** `packages/core/src/Switch/useSwitch.ts` (+ `useSwitch.test.ts`); **Modify** `SwitchRoot.vue`, `Switch/index.ts`, `Switch.test.ts` (add Task 0 characterization only); **Create** a `useSwitch` docs page + `Switch.story.vue` standalone variant.
- **Create** `packages/core/src/Tabs/useTabs.ts` (+ test); **Modify** `TabsRoot.vue`/`TabsTrigger.vue`/`TabsContent.vue`, `Tabs/index.ts`, `Tabs.test.ts` (characterization).
- **Create** `docs/superpowers/recipes/2723-headless-composable-recipe.md` — finalized after Task 7.
- **Regenerate** `docs/content/meta/Switch*.md`, `Tabs*.md` (family-scoped; must show no real diff).

---

## Task 0: Characterization tests for Switch (pre-refactor)

**Files:**
- Modify: `packages/core/src/Switch/Switch.test.ts` (ADD a `describe`; touch nothing existing)

**Interfaces:**
- Consumes: the **UNMODIFIED** `SwitchRoot`. This locks the real contract the thin oracle misses, BEFORE any refactor — so a regression in Task 3 fails here instead of shipping.

- [ ] **Step 1: Add characterization assertions and run them GREEN against current code**

```ts
// packages/core/src/Switch/Switch.test.ts — new describe
describe('SwitchRoot characterization (pre-refactor contract)', () => {
  it('renders the id attribute on the control', async () => {
    // render SwitchRoot { id: 'sw1' }; expect the button to have id="sw1"
  })
  it('resolves aria-label from an associated [for] label', async () => {
    // render <label for="sw1">Wifi</label> + SwitchRoot { id: 'sw1' }; expect aria-label="Wifi"
  })
  it('prefers an explicit aria-label over the [for] label', async () => {
    // SwitchRoot { id:'sw1', 'aria-label':'X' } with a [for] label present → aria-label="X"
  })
  it('chains a consumer @click with the internal toggle (both fire)', async () => {
    // render SwitchRoot with an @click spy; fireEvent.click; expect spy called AND checked toggled
  })
  it('does not toggle when disabled', async () => {})
  it('emits update:modelValue without mutating a controlled model', async () => {})
})
```

Fill bodies with real assertions (`render`/`fireEvent`/`screen` from `@testing-library/vue`, `mount` from `@vue/test-utils`). Run: `pnpm --filter reka-ui exec vitest run src/Switch` — **all GREEN against unmodified `SwitchRoot.vue`**. If `aria-label`/`[for]` behaves unexpectedly in jsdom, adapt the assertion to observed current behavior (characterization records *what is*, not what ought to be).

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/Switch/Switch.test.ts
git commit -m "test(Switch): characterize id/aria-label/listener-chaining before refactor"
```

---

## Task 1: Shared `stateToDataAttrs` helper (TDD)

**Files:**
- Create: `packages/core/src/shared/stateToDataAttrs.ts`, `packages/core/src/shared/stateToDataAttrs.test.ts`
- Modify: `packages/core/src/shared/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export type PartState = Record<string, string | number | boolean | null | undefined>
  export function stateToDataAttrs(state: PartState): Record<string, string>
  ```
  Rules (identical to #2722 `getStateAttributes`): `true` → `data-<kebab>=""`; `false`/`null`/`undefined` → omitted; string/number → `data-<kebab>="<value>"`. **When #2722 lands, consolidate to one implementation** (delete this or re-export from `Primitive/useRender`).

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/shared/stateToDataAttrs.test.ts
import { describe, expect, it } from 'vitest'
import { stateToDataAttrs } from './stateToDataAttrs'

describe('stateToDataAttrs', () => {
  it('maps boolean true to an empty-string data attribute', () => {
    expect(stateToDataAttrs({ disabled: true })).toEqual({ 'data-disabled': '' })
  })
  it('omits false/null/undefined', () => {
    expect(stateToDataAttrs({ disabled: false, open: undefined, x: null })).toEqual({})
  })
  it('maps string/number and kebab-cases the key', () => {
    expect(stateToDataAttrs({ state: 'checked', someFlag: 2 }))
      .toEqual({ 'data-state': 'checked', 'data-some-flag': '2' })
  })
})
```

- [ ] **Step 2: Run to verify it fails, then implement**

Run: `pnpm --filter reka-ui exec vitest run src/shared/stateToDataAttrs.test.ts` → FAIL.

```ts
// packages/core/src/shared/stateToDataAttrs.ts
export type PartState = Record<string, string | number | boolean | null | undefined>

function kebab(k: string): string {
  return k.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()
}

export function stateToDataAttrs(state: PartState): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key in state) {
    const value = state[key]
    if (value === false || value == null)
      continue
    out[`data-${kebab(key)}`] = value === true ? '' : String(value)
  }
  return out
}
```

Add to `shared/index.ts`. Run → PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/shared/stateToDataAttrs.ts packages/core/src/shared/stateToDataAttrs.test.ts packages/core/src/shared/index.ts
git commit -m "feat(shared): add stateToDataAttrs helper (state to data-* mapping)"
```

---

## Task 2: `useSwitch()` — state, `toggle`, and `PartSurface`s (TDD)

**Files:**
- Create: `packages/core/src/Switch/useSwitch.ts`, `packages/core/src/Switch/useSwitch.test.ts`

**Interfaces:**
- Produces:
  ```ts
  import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
  import type { SwitchRootContext } from './SwitchRoot.vue' // type-only import (no runtime cycle)

  export interface PartSurface<S extends Record<string, any> = Record<string, any>> {
    props: ComputedRef<Record<string, any>> // aria-*, role, value, handlers — NO data-*
    state: ComputedRef<S> // semantic state; data-* derived via stateToDataAttrs
  }
  type SwitchState = { state: 'checked' | 'unchecked', disabled: boolean }

  export interface UseSwitchProps<T = boolean> {
    modelValue?: Ref<T> // externally-owned (SFC hands its useVModel ref)
    defaultValue?: T
    disabled?: MaybeRefOrGetter<boolean | undefined>
    required?: MaybeRefOrGetter<boolean | undefined>
    value?: MaybeRefOrGetter<string> // form value, default 'on'
    trueValue?: MaybeRefOrGetter<T> // default true
    falseValue?: MaybeRefOrGetter<T> // default false
  }
  export interface UseSwitchReturn<T = boolean> {
    modelValue: Ref<T>
    checked: ComputedRef<boolean>
    disabled: ComputedRef<boolean>
    toggle: () => void
    root: PartSurface<SwitchState>
    thumb: PartSurface<SwitchState>
    context: SwitchRootContext
  }
  export function useSwitch<T = boolean>(props?: UseSwitchProps<T>): UseSwitchReturn<T>
  ```
  Notes: **no `check`/`uncheck`** (lean pilot API — add later only on demand). **No `hiddenInputProps`** (the hidden input needs `name`/`type`/`v-if` gate the composable can't own — stays in the SFC). **No `id`** in `root.props` (SFC owns `id`, `aria-label`, `type` — DOM/tag-dependent). `context` is typed as the existing `SwitchRootContext`, not a fresh inline shape.

- [ ] **Step 1: Write the failing tests** (state + surfaces)

```ts
// packages/core/src/Switch/useSwitch.test.ts
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useSwitch } from './useSwitch'

describe('useSwitch — state', () => {
  it('defaults to unchecked with falseValue', () => {
    const s = useSwitch()
    expect(s.modelValue.value).toBe(false)
    expect(s.checked.value).toBe(false)
  })
  it('toggle() flips between trueValue and falseValue', () => {
    const s = useSwitch({ trueValue: 'on', falseValue: 'off', defaultValue: 'off' })
    s.toggle()
    expect(s.modelValue.value).toBe('on')
    expect(s.checked.value).toBe(true)
  })
  it('does not toggle when disabled', () => {
    const s = useSwitch({ disabled: true })
    s.toggle()
    expect(s.checked.value).toBe(false)
  })
  it('writes through an externally-owned ref', () => {
    const model = ref(false)
    const s = useSwitch({ modelValue: model })
    s.toggle()
    expect(model.value).toBe(true)
  })
})

describe('useSwitch — part surfaces', () => {
  it('root.props exposes role/aria/value/handlers but NO data-*', () => {
    const s = useSwitch({ required: true })
    expect(s.root.props.value).toMatchObject({ 'role': 'switch', 'aria-checked': false, 'aria-required': true })
    expect(Object.keys(s.root.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(typeof s.root.props.value.onClick).toBe('function')
  })
  it('root.state carries the semantic state', () => {
    const s = useSwitch()
    expect(s.root.state.value).toEqual({ state: 'unchecked', disabled: false })
    s.toggle()
    expect(s.root.state.value.state).toBe('checked')
  })
  it('root.props.onKeydown toggles on Enter and ignores other keys', () => {
    const s = useSwitch()
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    s.root.props.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(s.checked.value).toBe(true)
    const other = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    s.root.props.value.onKeydown(other)
    expect(s.checked.value).toBe(true) // unchanged
  })
  it('thumb.state mirrors checked/disabled', () => {
    const s = useSwitch()
    expect(s.thumb.state.value.state).toBe('unchecked')
    s.toggle()
    expect(s.thumb.state.value.state).toBe('checked')
  })
})
```

- [ ] **Step 2: Run to verify it fails, then implement**

Run: `pnpm --filter reka-ui exec vitest run src/Switch/useSwitch.test.ts` → FAIL.

```ts
// packages/core/src/Switch/useSwitch.ts
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SwitchRootContext } from './SwitchRoot.vue'
import { computed, ref, toValue } from 'vue'

// types as in Interfaces above …

export function useSwitch<T = boolean>(props: UseSwitchProps<T> = {}): UseSwitchReturn<T> {
  const trueValue = () => (props.trueValue !== undefined ? toValue(props.trueValue) : (true as unknown as T))
  const falseValue = () => (props.falseValue !== undefined ? toValue(props.falseValue) : (false as unknown as T))

  const modelValue = (props.modelValue ?? ref<T>(props.defaultValue ?? falseValue())) as Ref<T>
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const checked = computed(() => modelValue.value === trueValue())

  function toggle() {
    if (disabled.value)
      return
    modelValue.value = checked.value ? falseValue() : trueValue()
  }
  function onKeydown(event: KeyboardEvent) {
    // Port SwitchRoot.vue:117 `@keydown.enter.prevent` EXACTLY. Switch has NO
    // modifier-key guard today — do NOT add one (commit 30bce209d touched
    // Calendar/Listbox, not Switch).
    if (event.key !== 'Enter')
      return
    event.preventDefault()
    toggle()
  }

  const semantic = computed<SwitchState>(() => ({
    state: checked.value ? 'checked' : 'unchecked',
    disabled: disabled.value,
  }))

  const root: PartSurface<SwitchState> = {
    props: computed(() => ({
      'role': 'switch',
      'aria-checked': checked.value,
      'aria-required': toValue(props.required) || undefined,
      'value': toValue(props.value) ?? 'on',
      'disabled': disabled.value || undefined,
      'onClick': () => toggle(),
      'onKeydown': onKeydown,
    })),
    state: semantic,
  }
  const thumb: PartSurface<SwitchState> = { props: computed(() => ({})), state: semantic }

  const context: SwitchRootContext = { checked, toggleCheck: toggle, disabled: disabled as Ref<boolean> }
  return { modelValue, checked, disabled, toggle, root, thumb, context }
}
```

Run → PASS.

- [ ] **Step 3: Type-check + commit**

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/Switch/useSwitch.ts packages/core/src/Switch/useSwitch.test.ts
git commit -m "feat(Switch): add useSwitch composable with part surfaces"
```

---

## Task 3: Refactor `SwitchRoot.vue` to compose `useSwitch()` (parity gate)

**Files:**
- Modify: `packages/core/src/Switch/SwitchRoot.vue`

**Interfaces:**
- Consumes: `useSwitch`, `useVModel`, `useForwardExpose`, `useForwardScopeId`, `useFormControl`, `mergeProps` (from `vue`).
- Produces: unchanged public surface. The first `<script lang="ts">` block (types + `createContext('SwitchRoot')`) **stays byte-for-byte** so `SwitchThumb.vue`'s `import { injectSwitchRootContext } from './SwitchRoot.vue'` keeps working. **`SwitchThumb.vue` is NOT modified** (keeps deriving `data-state` from context).

**Binding-parity checklist — every current binding must land, owned by exactly one layer:**

| Binding (current line) | Owner after refactor |
|---|---|
| `:ref="forwardRef"` | SFC |
| `:as` / `:as-child` | SFC |
| `:id="id"` (102) | **SFC** (explicit; DOM/id concern) |
| `:type` (105, `as==='button'`) | **SFC** (tag-dependent) |
| `:aria-label="$attrs['aria-label'] \|\| ariaLabel"` (107) + `ariaLabel` computed (91) | **SFC** (DOM `[for]` lookup, SSR-guarded by `currentElement`) |
| `role`, `aria-checked`, `aria-required`, `value`, `disabled` | composable `root.props` |
| `data-state`, `data-disabled` | `stateToDataAttrs(root.state.value)` |
| `@click`, `@keydown.enter.prevent` | composable `root.props.onClick`/`onKeydown` (merged, so they chain) |
| `scopeIdAttrs`, `$attrs` | SFC (via `mergeProps`) |
| `VisuallyHiddenInput` (`type="checkbox"`, `:name`, `:checked`, `:value`, `:required`, `:disabled`, `v-if="isFormControl && name"`) | **SFC** (unchanged) |

- [ ] **Step 1: Rewrite the `<script setup>` block**

Keep `withDefaults(defineProps<SwitchRootProps<T>>(), { as: 'button', modelValue: undefined, value: 'on', trueValue: (() => true) as unknown as undefined, falseValue: (() => false) as unknown as undefined })` **verbatim** (factory-default hack is load-bearing). Keep `defineEmits`, `useVModel` + `passive`, `useForwardExpose`, `useForwardScopeId`, `useFormControl`, and the `ariaLabel` computed (L91) **verbatim**. Then:

```ts
const modelValue = useVModel(props as any, 'modelValue', emit as any, {
  defaultValue: props.defaultValue ?? props.falseValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<T>

const { checked, root, context } = useSwitch<T>({
  modelValue,
  disabled: () => props.disabled,
  required: () => props.required,
  value: () => props.value,
  trueValue: () => props.trueValue as T,
  falseValue: () => props.falseValue as T,
})
provideSwitchRootContext(context)
```

- [ ] **Step 2: Update the template — merge, don't spread**

Preserve the two-sibling structure (`Primitive` + `VisuallyHiddenInput`, `inheritAttrs: false`, hidden input NOT nested). SFC keeps `:id`, `:type`, `:aria-label`, `:ref`, `:as`/`:as-child`. Merge the surface:

```vue
<Primitive
  :ref="forwardRef"
  :as="as"
  :as-child="asChild"
  :id="id"
  :type="as === 'button' ? 'button' : undefined"
  :aria-label="$attrs['aria-label'] || ariaLabel"
  v-bind="mergeProps(root.props.value, stateToDataAttrs(root.state.value), scopeIdAttrs, $attrs)"
>
  <slot :checked="checked" />
</Primitive>
```

`mergeProps` chains `root.props.onClick`/`onKeydown` with any consumer `$attrs` handlers (parity with today) and merges `class`/`style`. Keep the exact slot props the template exposes today.

- [ ] **Step 3: Run the FULL Switch suite (existing + Task 0 characterization)**

Run: `pnpm --filter reka-ui exec vitest run src/Switch`
Expected: PASS — existing cases AND the Task 0 characterization (`id`, `aria-label` from `[for]`, `@click` chaining, disabled, controlled emit) all green. A failure here means a parity gap — fix before proceeding.

- [ ] **Step 4: Type-check + commit**

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/Switch/SwitchRoot.vue
git commit -m "refactor(Switch): compose SwitchRoot from useSwitch (parity preserved)"
```

---

## Task 4: Export `useSwitch` + verify public surface

**Files:**
- Modify: `packages/core/src/Switch/index.ts`

- [ ] **Step 1: Add exports** (do NOT export `provideSwitchRootContext` in the pilot — `injectSwitchRootContext` is already public; exporting `provide` commits to userland-fabricated contexts, decide separately)

```ts
// packages/core/src/Switch/index.ts — add:
export { useSwitch } from './useSwitch'
export type { PartSurface, UseSwitchProps, UseSwitchReturn } from './useSwitch'
```

- [ ] **Step 2: Public-export smoke test**

```ts
// append to useSwitch.test.ts
import * as Reka from '../index'

describe('useSwitch — public export', () => {
  it('is exported from the package barrel path', () => {
    expect(typeof Reka.useSwitch).toBe('function')
  })
})
```

- [ ] **Step 3: Test + type-check + build + family docs diff**

Run: `pnpm --filter reka-ui exec vitest run src/Switch` → `pnpm --filter reka-ui type-check` → `pnpm --filter reka-ui build` → `pnpm docs:gen` then `git status docs/content/meta/Switch*.md`.
Expected: all PASS; no *real* prop/emit/slot change in `Switch*.md` (generic-SFC tool noise: re-diff on a clean checkout to confirm).

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/Switch/index.ts packages/core/src/Switch/useSwitch.test.ts docs/content/meta/Switch*.md
git commit -m "feat(Switch): export useSwitch as public API"
```

---

## Task 5: Public docs page + standalone story (the new API is the point)

**Files:**
- Create: a `useSwitch` docs page (follow the docs site's composable/util page convention), `Switch.story.vue` standalone variant

**Interfaces:**
- Consumes: `useSwitch` as an end user would.
- Produces: the only real test of standalone ergonomics + the user-facing home for the new API (issue #2723's whole point is a *new public API*).

- [ ] **Step 1: Add a Histoire story variant driving `useSwitch()` standalone**

A `Switch.story.vue` variant that calls `useSwitch()` in a plain component and renders a `<button v-bind="mergeProps(root.props.value, stateToDataAttrs(root.state.value))">` + thumb — no `SwitchRoot`. This exercises the composable outside its SFC and surfaces any ergonomic gap (e.g. having to hand-merge `data-*`).

- [ ] **Step 2: Add a docs page** for `useSwitch` (signature, `PartSurface`, a copy-paste standalone example, and the "handlers chain via mergeProps" note). Locate it where the docs site lists composables/utilities.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/Switch/Switch.story.vue docs
git commit -m "docs(Switch): document useSwitch + standalone story"
```

---

## Task 6: Draft the migration recipe (v1 — provisional)

**Files:**
- Create: `docs/superpowers/recipes/2723-headless-composable-recipe.md`

**Interfaces:**
- Consumes: the Switch pilot.
- Produces: a **provisional** recipe, explicitly marked "validated on Switch only — do not batch-apply until Task 7 hardens it."

- [ ] **Step 1: Write recipe v1** with these sections (real steps, no placeholders):

1. **Characterize first** — write characterization tests against the UNMODIFIED family for the surface the existing suite misses (ids, label wiring, listener chaining, disabled, controlled emit). Run green pre-refactor.
2. **Create `use<Family>.ts`** — pure; returns per-part `PartSurface { props, state }` (+ `context`, top-level state/methods). Props in as `MaybeRefOrGetter`/`Ref`, read via `toValue`. NO `defineProps`/`defineEmits`/`provide`/`document`. `data-*` derived from `state` via `stateToDataAttrs`.
3. **Keep in the Root SFC:** public prop/emit interfaces + `createContext` (plain `<script>` block), `withDefaults` verbatim, `useVModel` + `passive`, `useForwardExpose`/`useForwardScopeId`, `useFormControl` + DOM-bound computeds (`ariaLabel`), `id`/`type`/`aria-label`/tag-dependent bindings, `defineExpose` parity, hidden-input `v-if` gate, Presence/Teleport/Popper wrappers. SFC calls `provideX(context)`.
4. **Bind with `mergeProps`, never object spread** — `v-bind="mergeProps(part.props.value, stateToDataAttrs(part.state.value), scopeIdAttrs, $attrs)"`; handlers live in `part.props` so consumer listeners chain.
5. **Export** `useX` + `UseXProps`/`UseXReturn` after a **collision audit** (`vue`, `@vueuse/core`, Nuxt auto-imports).
6. **Verify:** characterization + existing `*.test.ts` untouched + new `useX.test.ts` (effectScope/mount harness) + axe + `type-check` + family-scoped `docs:gen` (real diff must be empty). Add a docs page + standalone story.
7. **Footguns:** getters not snapshots; no `document` at call scope; port handler bodies verbatim (do NOT add guards the SFC lacks); `defineExpose` re-exposes the same refs; group-optional families keep `injectX(null)` in the shell; `<part>Attrs`/`state` must not become a second source of truth that drifts from the part SFC (share the derivation).

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/recipes/2723-headless-composable-recipe.md
git commit -m "docs: draft headless composable recipe (v1, Switch-validated)"
```

---

## Task 7: Second pilot — Tabs (recipe-validation gate)

**Files:**
- Create: `packages/core/src/Tabs/useTabs.ts` (+ `useTabs.test.ts`)
- Modify: `TabsRoot.vue`, `TabsTrigger.vue`, `TabsContent.vue`, `Tabs/index.ts`, `Tabs.test.ts`, `docs/superpowers/recipes/2723-headless-composable-recipe.md`

**Interfaces:**
- Consumes: recipe v1.
- Produces: a converted Tabs family **and** the amendments recipe v1 needs to survive a collection family. Tabs must force answers to the questions Switch dodged:
  - **Per-item attr getters, not a root blob.** `TabsTrigger` computes `id`/`aria-controls`/`aria-selected`/`data-state`/`role` from `(context, props.value)` (`TabsTrigger.vue:29-30,42-49`). So `useTabs()` returns getters, not fixed part properties:
    ```ts
    export interface UseTabsReturn {
      // root & list surfaces (thin: dir, data-orientation, role="tablist")
      root: PartSurface
      list: PartSurface
      getTriggerSurface: (value: string) => PartSurface // id, aria-controls, aria-selected, role, handlers; state {state,disabled}
      getContentSurface: (value: string) => PartSurface
      // registration + control methods that live in context today
      registerContent: (value: string) => void
      selectTab: (value: string) => void
      context: TabsRootContext
    }
    ```
  - **Registration methods in context.** `contentIds` is a Set mutated by descendants — decide whether registration is a composable method or stays SFC-level; keep the context shape frozen either way.
  - **Component-wrapper behavior boundary.** `TabsTrigger` wraps `<RovingFocusItem as-child>` (`:36-37`) for arrow-key navigation. A pure `useTabs()` **cannot** absorb RovingFocus (it's a component family). Document the bound: a standalone `useTabs()` consumer rendering their own trigger gets ids/aria/selection but **not** roving-focus keyboard nav unless they also compose `RovingFocus`. Recipe v1 must state this "component-wrapper behaviors stay wrappers in v1" limit explicitly.
  - **`useId`-based ids** (`makeTriggerId(baseId, value)`) — the getter must reproduce them exactly.

- [ ] **Step 1: Characterization tests for Tabs** (pre-refactor) — selected/unselected `data-state`, `aria-controls`/`aria-selected` wiring, arrow-key navigation still works, `id` stability, `activationMode`. Run green against unmodified Tabs.

- [ ] **Step 2: Build `useTabs()`** with the getter contract above (TDD): `getTriggerSurface(value).props`/`.state`, `selectTab`, `registerContent`. Then refactor `TabsRoot`/`TabsTrigger`/`TabsContent` to consume it, keeping `<RovingFocusItem as-child>` in the trigger SFC and the context shape frozen. Full Tabs suite + characterization green; `type-check`.

- [ ] **Step 3: Amend the recipe** with everything Tabs broke: the getter pattern for per-item parts, the registration-method decision, the component-wrapper boundary note, and `useId` reproduction. Re-mark the recipe "validated on Switch (form-control) + Tabs (collection)".

- [ ] **Step 4: Export + docs + commit** (collision audit: `useTabs` vs ecosystem)

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/Tabs docs
git commit -m "feat(Tabs): headless useTabs composable + recipe validation"
```

---

## Task 8: Finalize recipe + dependency-ordered migration plan

**Files:**
- Modify: `docs/superpowers/recipes/2723-headless-composable-recipe.md`

- [ ] **Step 1: Replace the size-ordered tier list with a structure- and dependency-ordered plan**

- **Recipe v1 scope = attr-bearing, non-overlay families.** Overlays (Popover/Dialog/Tooltip/HoverCard/DropdownMenu/Select/Combobox content) render **no root attrs** — `PopoverRoot.vue:91` is `<PopperRoot><slot/></PopperRoot>`; their logic lives in Content-part component wrappers (DismissableLayer/FocusScope/Presence/Teleport/Popper). **Defer overlays**: define the overlay contract **jointly with #2724** (which is already rewriting overlay internals — converting them here first is double churn). Add an explicit follow-up issue.
- **Dependency graph before size.** Some families delegate methods to a child's `exposed` — `ComboboxRoot.vue:204-219` snapshots `ListboxRoot`'s exposed methods (`primitiveElement.value?.highlightItem`), so **Listbox must convert before Combobox** (Listbox is missing from the old tier list). Document: convert dependencies first.
- **Bounded "headless" definition.** `RovingFocus`, `Collection`, `Presence`, `Popper` stay component wrappers in v1 — a standalone `useX()` gets state + attrs but not those component behaviors. Say so in the docs so the public promise isn't oversold.
- **Ordered tiers:** (1) form/toggle: Checkbox, RadioGroup, ToggleGroup (audit `useToggle` collision), Toggle; (2) collection/disclosure: Accordion (consumes Collapsible ctx), Collapsible, Tabs ✓; (3) delegation chains: Listbox → Combobox, then Select; (4) overlays — deferred, joint with #2724; (5) date/calendar family last (heavy generics + `useDateField` already composable-shaped).

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/recipes/2723-headless-composable-recipe.md
git commit -m "docs: finalize headless composable recipe + dependency-ordered migration"
```

---

## Self-Review

- **Spec coverage:** "every family exposes `useX()`" → recipe (Tasks 6+8) + two pilots prove it generalizes; "SFC becomes thin shell" → Tasks 3, 7; "keep public API" → Task 0 characterization + parity gate (Task 3 Step 3) + docs diff (Task 4); "new additive public API" → Tasks 4, 5; "one family end-to-end first" → **two** structurally-distinct pilots (Switch + Tabs) before freezing the recipe. Covered.
- **Composition with #2722:** `PartSurface { props, state }` + `stateToDataAttrs` = #2722's `useRender({ props, state })` inputs; the later swap passes `root.state` straight in and deletes the local `stateToDataAttrs` (shared helper consolidated). `#render` slot's `state` is populated (not `undefined`) because we kept the semantic `state` object.
- **Type consistency:** `PartSurface`, `UseSwitchProps`/`UseSwitchReturn`, `context: SwitchRootContext` (type-only import, no inline dup) consistent across Tasks 2–4. Tabs uses the same `PartSurface` via getters.

## Risks / Gotchas

1. **Handler clobbering** — bind with `mergeProps`, never object spread; handlers in `part.props` chain with consumer `$attrs` (parity with today's compiler merge).
2. **Silent a11y/id loss** — the thin oracle won't catch a dropped `id`/`aria-label`; Task 0 characterization is the guard. `id`/`type`/`aria-label` are SFC-owned (DOM/tag-dependent), NOT in `root.props`.
3. **`<part>` state as a second source of truth** — `thumb.state` and `SwitchThumb.vue` both derive from the shared `checked`/`disabled` refs (no value drift); the *mapping* is single-sourced via `stateToDataAttrs`. For parts that would duplicate derivation, export one shared pure function.
4. **Wrong-commit hazard** — Switch has **no** modifier-key keydown guard today (commit `30bce209d` touched Calendar/Listbox); port `@keydown.enter.prevent` exactly, add nothing.
5. **Single-archetype over-fit** — mitigated by the Tabs gate (Task 7); overlays deferred to joint work with #2724 (they have no root attrs).
6. **Naming collisions** — `useToggle` clashes with `@vueuse/core`; audit every name against `vue`/`@vueuse/core`/Nuxt auto-imports before export.
7. **Context timing** — `provide` runs in Root setup; composable only builds the value. `context` typed as the existing family context (type-only import).
8. **`useVModel` `passive`** — evaluated once at setup; stays in the SFC.
9. **`defineExpose` parity** — component-bound; stays in the SFC; families with explicit `defineExpose` (e.g. `CollapsibleRoot.vue:74`) re-expose the same refs from composable state.
10. **Generic-SFC docs:gen false positives** — `SwitchRoot.vue` is generic; if a meta diff appears, re-diff on a clean checkout to separate tool noise from real change.
11. **SSR** — no `document` at call scope; the `[for]` label lookup (`ariaLabel`) stays in the SFC, guarded by `currentElement`.
12. **Delegation chains** — families whose methods snapshot a child's `exposed` (Combobox→Listbox) can't hold "methods in the composable"; convert the dependency first (Task 8).

## Execution Handoff

Recommended: **Subagent-Driven** (superpowers:subagent-driven-development) — fresh subagent per task, review between tasks. Task 0 (characterize) and Task 3 (parity gate) are the highest-scrutiny points for the Switch pilot; **Task 7 (Tabs) is the recipe-validation gate — do not batch-apply the recipe to other families until it passes.** After both pilots + the finalized recipe (Task 8) land, spin one subagent per family in dependency order, overlays excepted (joint with #2724).
