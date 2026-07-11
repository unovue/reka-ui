# Headless Logic Composables (`useX()`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Tracks GitHub issue **#2723** (Phase 1 — Foundation), part of the reka-ui v3 roadmap **#2721**. Depends conceptually on **#2722** (`useRender`) but is deliberately **decoupled** from it — the pilot ships against today's `Primitive`, and the later swap to `useRender` is mechanical.

**Goal:** Every component family exposes a `useX()` composable that holds all logic/state; the `.vue` SFC becomes a thin shell composing `useX()` + (today) `Primitive` / (later) `useRender`. Components keep their exact public API — this is an internal re-architecture that additively exposes the logic layer as a new public API.

**Architecture:** Extract a family's state derivation, methods, and computed attribute objects into a pure `use<Family>.ts` file taking a `MaybeRefOrGetter`/`Ref` props bag and returning `{ state, methods, rootAttrs, <part>Attrs, context }`. The Root SFC keeps `defineProps`/`withDefaults`/`defineEmits`/`createContext`/`useForwardExpose` and simply wires its `useVModel` ref + prop getters into the composable, then `provide`s the returned context object. This plan establishes the pattern **end-to-end on one pilot family (Switch)**, then defines the repeatable recipe for the remaining ~57 families.

**Tech Stack:** Vue 3 (`<script setup>`, generics), TypeScript, VueUse (`useVModel`), vitest + jsdom + `@testing-library/vue` + `@vue/test-utils` + `vitest-axe`, pnpm monorepo.

## Global Constraints

- Node ≥ 22, pnpm 10. All commands run from repo root.
- Test (one-shot): `pnpm --filter reka-ui exec vitest run <path>` — never `pnpm test` (watch mode).
- Type-check: `pnpm --filter reka-ui type-check`. Lint fix: `pnpm lint:fix`. Build: `pnpm --filter reka-ui build`.
- **Public API of every component is frozen** — props, emits, slots, exposed refs, context shape, data-/aria- attributes, and DOM structure must be byte-for-byte unchanged. Existing `*.test.ts` files are the black-box compatibility oracle: **never weaken or edit an existing assertion**; they must pass untouched.
- Conventional Commits, scope = component family: `feat(Switch): …`. commitlint enforces.
- `docs/content/meta/*.md` is AUTO-GENERATED — never hand-edit. Regenerate family-scoped only (`pnpm --filter reka-ui build` first, then `pnpm docs:gen`), and diff the result — expect **no** prop/emit/slot changes. Avoid blanket regen (vue-component-meta v3 regresses generic SFC params).
- Composables must be SSR-safe: no `document`/`window` access at call scope; DOM-bound logic (`useFormControl`, `document.querySelector`) stays guarded behind a `currentElement` ref supplied by the SFC.
- Reactivity rule (the #1 conversion footgun): pass props into `useX()` as getters (`() => props.x`) or `Ref`s and read them with `toValue()`. Never pass a raw `props.x` snapshot.
- Naming is permanent: `export *` from a family index makes `UseXProps`/`UseXReturn` public API instantly — name them deliberately; renames are breaking.

---

## File Structure

**Pilot family = Switch.** Rationale: self-contained (grep confirms nothing in the repo imports `@/Switch`), has a provided context, form integration (`useFormControl` + a sibling `VisuallyHiddenInput`), aria (`role="switch"`, `aria-checked`), data-attrs, a keyboard handler, and a generic type param `T` — nontrivial but small. Bonus: `SwitchRoot.vue` is a generic SFC (`generic="T = boolean"`); moving logic into a plain `.ts` generic function sidesteps the vue-component-meta v3 generic-SFC regression for the logic layer.

Existing pilot files:
- `packages/core/src/Switch/SwitchRoot.vue` — Root; provides `SwitchRootContext`.
- `packages/core/src/Switch/SwitchThumb.vue` — injects context (28 lines).
- `packages/core/src/Switch/index.ts` — family barrel.
- `packages/core/src/Switch/Switch.test.ts`, `Switch.story.vue`, `_Switch.vue` — tests + harness.

Files this plan creates/modifies:
- **Create** `packages/core/src/Switch/useSwitch.ts` — the pure logic composable.
- **Create** `packages/core/src/Switch/useSwitch.test.ts` — unit tests for the composable.
- **Modify** `packages/core/src/Switch/SwitchRoot.vue` — setup block composes `useSwitch`; first (plain) `<script>` block with types + `createContext` stays verbatim.
- **Modify** `packages/core/src/Switch/index.ts` — export `useSwitch`, `UseSwitchProps`, `UseSwitchReturn` (flows to the root barrel via existing `export * from './Switch'`).
- **Modify** `packages/core/src/Switch/Switch.test.ts` — ADD API-compat cases only (never change existing ones).
- **Create** `docs/superpowers/recipes/2723-headless-composable-recipe.md` — the repeatable recipe for the remaining ~57 families.
- **Regenerate** `docs/content/meta/SwitchRoot.md`, `SwitchThumb.md` (family-scoped, must show no diff).

---

## Task 1: Extract `useSwitch()` state + methods (TDD)

**Files:**
- Create: `packages/core/src/Switch/useSwitch.ts`
- Test: `packages/core/src/Switch/useSwitch.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface UseSwitchProps<T = boolean> {
    modelValue?: Ref<T> // externally-owned state (SFC passes its useVModel ref)
    defaultValue?: T
    disabled?: MaybeRefOrGetter<boolean | undefined>
    required?: MaybeRefOrGetter<boolean | undefined>
    id?: MaybeRefOrGetter<string | undefined>
    value?: MaybeRefOrGetter<string> // form value, default 'on'
    trueValue?: MaybeRefOrGetter<T> // default true
    falseValue?: MaybeRefOrGetter<T> // default false
    currentElement?: Ref<HTMLElement | undefined>
  }
  export interface UseSwitchReturn<T = boolean> {
    modelValue: Ref<T>
    checked: ComputedRef<boolean>
    disabled: ComputedRef<boolean>
    toggle: () => void
    check: () => void
    uncheck: () => void
    rootAttrs: ComputedRef<Record<string, any>>
    thumbAttrs: ComputedRef<Record<string, any>>
    hiddenInputProps: ComputedRef<Record<string, any>>
    context: { checked: ComputedRef<boolean>, toggleCheck: () => void, disabled: Ref<boolean> }
  }
  export function useSwitch<T = boolean>(props?: UseSwitchProps<T>): UseSwitchReturn<T>
  ```
- Consumes: nothing (pure; Vue reactivity primitives only).

- [ ] **Step 1: Write the failing test for state + methods**

```ts
import { describe, expect, it } from 'vitest'
// packages/core/src/Switch/useSwitch.test.ts
import { ref } from 'vue'
import { useSwitch } from './useSwitch'

describe('useSwitch — state & methods', () => {
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
    s.toggle()
    expect(s.modelValue.value).toBe('off')
  })

  it('check()/uncheck() set explicit states', () => {
    const s = useSwitch()
    s.check()
    expect(s.checked.value).toBe(true)
    s.uncheck()
    expect(s.checked.value).toBe(false)
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter reka-ui exec vitest run src/Switch/useSwitch.test.ts`
Expected: FAIL — `useSwitch` cannot be imported (module not found).

- [ ] **Step 3: Implement the state + methods portion**

```ts
// packages/core/src/Switch/useSwitch.ts
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import { computed, ref, toValue } from 'vue'

export interface UseSwitchProps<T = boolean> {
  modelValue?: Ref<T>
  defaultValue?: T
  disabled?: MaybeRefOrGetter<boolean | undefined>
  required?: MaybeRefOrGetter<boolean | undefined>
  id?: MaybeRefOrGetter<string | undefined>
  value?: MaybeRefOrGetter<string>
  trueValue?: MaybeRefOrGetter<T>
  falseValue?: MaybeRefOrGetter<T>
  currentElement?: Ref<HTMLElement | undefined>
}

export interface UseSwitchReturn<T = boolean> {
  modelValue: Ref<T>
  checked: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  toggle: () => void
  check: () => void
  uncheck: () => void
  rootAttrs: ComputedRef<Record<string, any>>
  thumbAttrs: ComputedRef<Record<string, any>>
  hiddenInputProps: ComputedRef<Record<string, any>>
  context: { checked: ComputedRef<boolean>, toggleCheck: () => void, disabled: Ref<boolean> }
}

export function useSwitch<T = boolean>(props: UseSwitchProps<T> = {}): UseSwitchReturn<T> {
  const trueValue = () => (props.trueValue !== undefined ? toValue(props.trueValue) : (true as unknown as T))
  const falseValue = () => (props.falseValue !== undefined ? toValue(props.falseValue) : (false as unknown as T))

  const modelValue = props.modelValue ?? ref<T>(props.defaultValue ?? falseValue()) as Ref<T>
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const checked = computed(() => modelValue.value === trueValue())

  function toggle() {
    if (disabled.value)
      return
    modelValue.value = checked.value ? falseValue() : trueValue()
  }
  function check() {
    if (disabled.value)
      return
    modelValue.value = trueValue()
  }
  function uncheck() {
    if (disabled.value)
      return
    modelValue.value = falseValue()
  }

  // rootAttrs / thumbAttrs / hiddenInputProps implemented in Task 2
  const rootAttrs = computed<Record<string, any>>(() => ({}))
  const thumbAttrs = computed<Record<string, any>>(() => ({}))
  const hiddenInputProps = computed<Record<string, any>>(() => ({}))

  return {
    modelValue,
    checked,
    disabled,
    toggle,
    check,
    uncheck,
    rootAttrs,
    thumbAttrs,
    hiddenInputProps,
    context: { checked, toggleCheck: toggle, disabled },
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter reka-ui exec vitest run src/Switch/useSwitch.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/Switch/useSwitch.ts packages/core/src/Switch/useSwitch.test.ts
git commit -m "feat(Switch): extract useSwitch state and methods"
```

---

## Task 2: Add computed attribute objects to `useSwitch()` (TDD)

**Files:**
- Modify: `packages/core/src/Switch/useSwitch.ts`
- Test: `packages/core/src/Switch/useSwitch.test.ts`

**Interfaces:**
- Consumes: `useSwitch` state from Task 1.
- Produces: `rootAttrs` (`role`, `type` when button-like, `aria-checked`, `aria-required`, `data-state`, `data-disabled`, `value`, `disabled`, `onClick`, `onKeydown`), `thumbAttrs` (`data-state`, `data-disabled`), `hiddenInputProps` (`value`, `checked`, `required`, `disabled`). **Copy the current handler bodies from `SwitchRoot.vue` verbatim** — the template today binds `@click="toggleCheck"` and `@keydown.enter.prevent="toggleCheck"`. Note recent repo fix (commit 30bce209d) "only consume Enter/Space keydown when no modifier key is held" — preserve any equivalent guard the current SFC has; do not idealize.

- [ ] **Step 1: Write the failing test for attrs**

```ts
// append to packages/core/src/Switch/useSwitch.test.ts
describe('useSwitch — attributes', () => {
  it('rootAttrs expose correct aria/data state', () => {
    const s = useSwitch({ required: true })
    expect(s.rootAttrs.value).toMatchObject({
      'role': 'switch',
      'aria-checked': false,
      'aria-required': true,
      'data-state': 'unchecked',
    })
    s.check()
    expect(s.rootAttrs.value).toMatchObject({ 'aria-checked': true, 'data-state': 'checked' })
  })

  it('rootAttrs.onClick toggles', () => {
    const s = useSwitch()
    s.rootAttrs.value.onClick(new MouseEvent('click'))
    expect(s.checked.value).toBe(true)
  })

  it('rootAttrs.onKeydown handles Enter with preventDefault and ignores other keys', () => {
    const s = useSwitch()
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    s.rootAttrs.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(s.checked.value).toBe(true)

    const space = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
    s.rootAttrs.value.onKeydown(space)
    expect(s.checked.value).toBe(true) // unchanged by non-Enter
  })

  it('thumbAttrs reflect state', () => {
    const s = useSwitch()
    expect(s.thumbAttrs.value['data-state']).toBe('unchecked')
    s.check()
    expect(s.thumbAttrs.value['data-state']).toBe('checked')
  })

  it('hiddenInputProps carry value/checked/required/disabled', () => {
    const s = useSwitch({ value: 'on', required: true })
    s.check()
    expect(s.hiddenInputProps.value).toMatchObject({ value: 'on', checked: true, required: true })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter reka-ui exec vitest run src/Switch/useSwitch.test.ts`
Expected: FAIL — `rootAttrs` is `{}`.

- [ ] **Step 3: Implement the attribute computeds**

Replace the three placeholder computeds in `useSwitch.ts`:

```ts
const getState = () => (checked.value ? 'checked' : 'unchecked')

function onKeydown(event: KeyboardEvent) {
  // Port verbatim from SwitchRoot.vue's @keydown.enter.prevent (respect the
  // "no modifier key held" guard the current handler uses, if present).
  if (event.key !== 'Enter')
    return
  event.preventDefault()
  toggle()
}

const rootAttrs = computed<Record<string, any>>(() => ({
  'role': 'switch',
  'type': undefined as string | undefined, // SFC sets type="button" when as==='button'
  'aria-checked': checked.value,
  'aria-required': toValue(props.required) || undefined,
  'data-state': getState(),
  'data-disabled': disabled.value ? '' : undefined,
  'value': toValue(props.value) ?? 'on',
  'disabled': disabled.value || undefined,
  'onClick': () => toggle(),
  'onKeydown': onKeydown,
}))

const thumbAttrs = computed<Record<string, any>>(() => ({
  'data-state': getState(),
  'data-disabled': disabled.value ? '' : undefined,
}))

const hiddenInputProps = computed<Record<string, any>>(() => ({
  value: toValue(props.value) ?? 'on',
  checked: checked.value,
  required: toValue(props.required) || undefined,
  disabled: disabled.value || undefined,
}))
```

> Note: `type` is left for the SFC to set (it already computes `type` from `as === 'button'`); the composable exposes the slot but does not know the resolved tag. If preferred, thread `as` in as an option — but keep the DOM output identical to today.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter reka-ui exec vitest run src/Switch/useSwitch.test.ts`
Expected: PASS (all ~10 tests).

- [ ] **Step 5: Type-check + commit**

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/Switch/useSwitch.ts packages/core/src/Switch/useSwitch.test.ts
git commit -m "feat(Switch): add computed attribute objects to useSwitch"
```

---

## Task 3: Refactor `SwitchRoot.vue` to compose `useSwitch()` (compatibility gate)

**Files:**
- Modify: `packages/core/src/Switch/SwitchRoot.vue`

**Interfaces:**
- Consumes: `useSwitch` from Tasks 1–2, `useVModel` (VueUse), `useForwardExpose`, `useForwardScopeId`, `useFormControl`.
- Produces: unchanged public surface. The first `<script lang="ts">` (non-setup) block — `SwitchRootProps<T>`, `SwitchRootEmits<T>`, `SwitchRootContext`, and `createContext('SwitchRoot')` — **stays byte-for-byte**, so `import { injectSwitchRootContext } from './SwitchRoot.vue'` in `SwitchThumb.vue` keeps working.

- [ ] **Step 1: Rewrite the `<script setup>` block**

Keep `withDefaults(defineProps<SwitchRootProps<T>>(), { as: 'button', modelValue: undefined, value: 'on', trueValue: (() => true) as unknown as undefined, falseValue: (() => false) as unknown as undefined })` **verbatim** (the factory-default hack is load-bearing for custom true/false values). Keep `defineEmits`, `useVModel`, `useForwardExpose`, `useForwardScopeId`. Replace the inline `checked`/`toggleCheck`/`isFormControl`/`ariaLabel` logic with:

```ts
const { forwardRef, currentElement } = useForwardExpose()
const scopeIdAttrs = useForwardScopeId()

const modelValue = useVModel(props as any, 'modelValue', emit as any, {
  defaultValue: props.defaultValue ?? props.falseValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<T>

const { checked, rootAttrs, hiddenInputProps, context } = useSwitch<T>({
  modelValue,
  disabled: () => props.disabled,
  required: () => props.required,
  id: () => props.id,
  value: () => props.value,
  trueValue: () => props.trueValue as T,
  falseValue: () => props.falseValue as T,
  currentElement,
})

const isFormControl = useFormControl(currentElement)
provideSwitchRootContext(context)
```

> `useVModel` with `passive` stays in the SFC (moving it into the composable risks controlled/uncontrolled regressions and drags emit typing in — see Risks). `useFormControl` stays in the SFC because it needs `currentElement`.

- [ ] **Step 2: Update the template to `v-bind` the composable's `rootAttrs`**

Preserve the two-sibling structure (`Primitive` + `VisuallyHiddenInput`, `inheritAttrs: false`, hidden input NOT nested). Set `type` from `as === 'button'` exactly as today. Bind: `v-bind="{ ...rootAttrs, ...scopeIdAttrs, ...$attrs }"` on the `Primitive`, and feed `VisuallyHiddenInput` from `hiddenInputProps` (or keep its existing explicit props if they already match). Keep the slot props the template currently exposes.

- [ ] **Step 3: Run the FULL existing Switch suite (compatibility gate)**

Run: `pnpm --filter reka-ui exec vitest run src/Switch`
Expected: PASS — every existing `Switch.test.ts` case (functional: axe, thumb renders, click toggles, Enter toggles; form: hidden `[type="checkbox"]` present, NOT nested in button, submit payload `{ test: 'true' }` then `{}`) passes **untouched**.

- [ ] **Step 4: Type-check**

Run: `pnpm --filter reka-ui type-check`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/Switch/SwitchRoot.vue
git commit -m "refactor(Switch): compose SwitchRoot from useSwitch"
```

---

## Task 4: Export the composable + verify public surface

**Files:**
- Modify: `packages/core/src/Switch/index.ts`

**Interfaces:**
- Consumes: `useSwitch`, `UseSwitchProps`, `UseSwitchReturn`.
- Produces: `import { useSwitch } from 'reka-ui'` resolves (via existing `export * from './Switch'` in `packages/core/src/index.ts:113`).

- [ ] **Step 1: Add exports to the family barrel**

```ts
// packages/core/src/Switch/index.ts — add:
export { useSwitch } from './useSwitch'
export type { UseSwitchProps, UseSwitchReturn } from './useSwitch'
// Optional (advanced headless use): export { provideSwitchRootContext } from './SwitchRoot.vue'
```

- [ ] **Step 2: Write a type-level smoke test**

```ts
// append to packages/core/src/Switch/useSwitch.test.ts
import * as Reka from '../index'

describe('useSwitch — public export', () => {
  it('is exported from the package root barrel path', () => {
    expect(typeof Reka.useSwitch).toBe('function')
  })
})
```

- [ ] **Step 3: Run test + type-check + build**

Run: `pnpm --filter reka-ui exec vitest run src/Switch/useSwitch.test.ts`
Then: `pnpm --filter reka-ui type-check`
Then: `pnpm --filter reka-ui build`
Expected: all PASS (build required before docs:gen per repo memory).

- [ ] **Step 4: Family-scoped docs regen + diff**

Run: `pnpm docs:gen` then `git status docs/content/meta/Switch*.md`
Expected: `SwitchRoot.md` / `SwitchThumb.md` show **no** prop/emit/slot changes (the composable does not get a meta page — docs:gen targets components). If any component meta changed, the refactor altered the public surface — STOP and fix.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/Switch/index.ts packages/core/src/Switch/useSwitch.test.ts docs/content/meta/Switch*.md
git commit -m "feat(Switch): export useSwitch as public API"
```

---

## Task 5: Add API-compatibility assertions to `Switch.test.ts`

**Files:**
- Modify: `packages/core/src/Switch/Switch.test.ts` (ADD a new `describe` only)

**Interfaces:**
- Consumes: rendered `SwitchRoot` public API.
- Produces: regression guard proving the shell refactor preserved the surface.

- [ ] **Step 1: Add the compatibility describe block**

```ts
describe('SwitchRoot public API compatibility', () => {
  it('emits update:modelValue with trueValue payload on click', async () => {
    // render SwitchRoot with true-value/false-value, fireEvent.click, assert emitted()
  })
  it('exposes $el via useForwardExpose (wrapper.element instanceof HTMLButtonElement)', () => {})
  it('supports custom true-value/false-value via v-model ("on"/"off")', async () => {})
  it('keeps the hidden input a sibling (not descendant) of the button', () => {})
})
```

> Fill each body with real assertions using the existing test imports (`render`, `fireEvent`, `screen` from `@testing-library/vue`; `mount` from `@vue/test-utils`; `handleSubmit` from `@/test`). These MIRROR behavior the existing suite already covers — they document the frozen contract explicitly.

- [ ] **Step 2: Run the full suite**

Run: `pnpm --filter reka-ui exec vitest run src/Switch`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/Switch/Switch.test.ts
git commit -m "test(Switch): add explicit public-API compatibility assertions"
```

---

## Task 6: Write the repeatable migration recipe

**Files:**
- Create: `docs/superpowers/recipes/2723-headless-composable-recipe.md`

**Interfaces:**
- Consumes: everything learned from the Switch pilot.
- Produces: a step-by-step recipe any engineer (or subagent) follows to convert one family.

- [ ] **Step 1: Write the recipe** with these sections (no placeholders — real steps):

1. **Create `use<Family>.ts`** next to the SFCs. It owns state derivation, methods, and computed attr objects per part (`rootAttrs`, `<part>Attrs`) plus the `context` value object. Props come in as a `MaybeRefOrGetter`/`Ref` bag; read with `toValue`. NO `defineProps`/`defineEmits`/`provide`/`document` inside.
2. **Keep in the Root SFC:** public prop/emit interfaces + `createContext` (in the plain `<script>` block so descendant `import`s don't move), `withDefaults` defaults verbatim, `useVModel` + `passive` dance, `useForwardExpose`/`useForwardScopeId`, `useFormControl`/DOM-bound computeds (guarded by `currentElement`), `defineExpose` parity, `$attrs` merging, and Presence/Teleport/Popper wrappers.
3. **The SFC builds the context value via the composable, then calls `provideX(context)`** — never `provide` inside the composable (breaks standalone usage).
4. **Export** `export { useX, type UseXProps, type UseXReturn }` from the family `index.ts`.
5. **Verify:** existing `*.test.ts` passes untouched (black-box oracle) + new `useX.test.ts` + axe + `type-check` + family-scoped `docs:gen` diff (no meta changes).
6. **Conversion order (tiers):** simple (Toggle, Checkbox, Collapsible, Progress, Label, Separator, AspectRatio) → medium (Tabs, RadioGroup, ToggleGroup, Accordion) → complex (Select, Combobox, Menu family, Calendar/DateField family) last. Toggle is the recommended second family (cheapest validation the recipe generalizes).
7. **Footguns checklist:** getters not snapshots (reactivity); no `document` at call scope (SSR); port handler bodies verbatim (don't idealize — see commit 30bce209d); name `UseXProps`/`UseXReturn` deliberately (instant public API); families that dual-behave in a group must keep `injectX(null)` optional-fallback in the shell; `defineExpose` must re-expose the same refs from composable state.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/recipes/2723-headless-composable-recipe.md
git commit -m "docs(Switch): add headless composable migration recipe"
```

---

## Self-Review

- **Spec coverage:** "every family exposes `useX()`" → recipe (Task 6) + pilot proves the pattern; "SFC becomes thin shell" → Task 3; "keep public API" → compatibility gate (Task 3 Step 3) + Task 5 + docs diff (Task 4 Step 4); "new additive public API" → Task 4; "establish pattern on one family end-to-end first, then convert all ~60" → Tasks 1–5 (pilot) + Task 6 (recipe + tiered order). Covered.
- **Decoupling from #2722:** the pilot ships against today's `Primitive`; the later `useRender` swap only touches the SFC template's root element and does not change `useSwitch`. Flagged in Risks and the recipe.
- **Type consistency:** `UseSwitchProps` / `UseSwitchReturn` / `context: { checked, toggleCheck, disabled }` used identically across Tasks 1–4; `context` shape equals the existing `SwitchRootContext`.

## Risks / Gotchas

1. **`useRender` (#2722) does not exist yet** — do not couple; `rootAttrs` v-binds onto today's `Primitive`; the swap is mechanical.
2. **Two-root templates** (Switch/Toggle/Checkbox render `Primitive` + sibling `VisuallyHiddenInput`, `inheritAttrs: false`) — keep the hidden input a template concern; it's a constraint `useRender` must eventually support (fragments).
3. **Context timing** — `provide` must run in the Root's setup; composable only *builds* the context value.
4. **SSR** — no `document` at call scope; keep the `ariaLabel` `document.querySelector` computed guarded by `currentElement.value`.
5. **`defineExpose` parity** — `useForwardExpose` is component-bound; stays in the SFC; families with explicit `defineExpose` (e.g. `CollapsibleRoot.vue`) must re-expose the same refs from composable state.
6. **`useVModel` `passive`** — evaluates once at setup; keep in the SFC, hand the ref to `useSwitch`.
7. **Reactivity** — getters/`toValue`, never raw `props.x` snapshots.
8. **docs:gen** — build first, family-scoped only, diff must be empty; avoid blanket regen (v3 generic-SFC regression).
9. **Public-surface creep** — `export *` publishes `UseXProps`/`UseXReturn` immediately; name deliberately.
10. **Generic `T`** — keep the `(() => true) as unknown as undefined` factory-default hack in `withDefaults` verbatim.

## Execution Handoff

Recommended: **Subagent-Driven** (superpowers:subagent-driven-development) — fresh subagent per task, review between tasks. Tasks 1–2 build the composable, Task 3 is the compatibility gate (highest scrutiny), Tasks 4–6 finalize surface + recipe. After the Switch pilot merges, spin one subagent per family following Task 6's recipe, tier by tier.
