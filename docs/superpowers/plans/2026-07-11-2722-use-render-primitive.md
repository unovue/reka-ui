# `useRender` Rendering Primitive — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Tracks GitHub issue **#2722** (Phase 1 — Foundation), part of the reka-ui v3 roadmap **#2721**. This is the render primitive that the headless logic composables (#2723) and the overlay perf overhaul (#2724) build on.

**Goal:** Provide a `useRender()` composable that resolves the render target (`tag`), merges internal props + state-as-`data-*` attributes (`renderProps`), forwards refs, and supports a renderless mode via the existing `Slot` sentinel — rendered by parts via `<component :is="tag" v-bind="renderProps" :ref="elementRef">`. This lets a component render without the extra `Primitive` wrapper instance.

**Architecture:** New `packages/core/src/Primitive/useRender.ts` composable modeled on Base UI's `use-render` but adapted to reka's existing `Slot` merge engine and `useForwardExpose` ref/`$el` semantics. `Primitive` is rewritten as a thin compat shim on top of `useRender` (keeping its exact public props/behavior), so the 271 existing parts keep working untouched. One pilot part (`Label`) migrates off the wrapper to prove parity end-to-end.

**Tech Stack:** Vue 3 (`h`, `cloneVNode`, `mergeProps`, `<component :is>`, `defineComponent`), TypeScript, vitest + jsdom + `@vue/test-utils` + `@testing-library/vue` + `vitest-axe`.

## Global Constraints

- Node ≥ 22, pnpm 10. All commands from repo root.
- Test (one-shot): `pnpm --filter reka-ui exec vitest run <path>` (path relative to `packages/core`) — never `pnpm test` (watch).
- Type-check: `pnpm --filter reka-ui type-check`. Build: `pnpm --filter reka-ui build`. Lint fix: `pnpm lint:fix`.
- **`Primitive`'s public surface is frozen.** `packages/core/src/Primitive/Primitive.test.ts` (269 lines, 15 tests) and `Label.test.ts` (exact-HTML + axe) are the regression gates and must pass **unchanged**.
- Dev-only warnings MUST use `process.env.NODE_ENV !== 'production'`, NOT `import.meta.env.DEV` — `tsdown.config.ts` defines `import.meta.env.DEV: 'undefined'`, so `import.meta.env.DEV` warnings never fire in built output.
- SSR-safe: no `document`/`window` access in `useRender`'s computed paths.
- Conventional Commits, scope `Primitive`: `feat(Primitive): …`. commitlint enforces.
- docs:gen: don't blanket-regen `docs/content/meta` (vue-component-meta v3 regresses generic SFC params); regen only touched non-generic parts, and new exports need `pnpm --filter reka-ui build` first.

---

## File Structure

Current relevant files (verified against `v2`):
- `packages/core/src/Primitive/Primitive.ts` (66 lines) — `AsTag`, `PrimitiveProps { asChild?, as? }`, `SELF_CLOSING_TAGS = ['area','img','input']`, `defineComponent` that renders `h(as)` / `h(as, attrs, {default})` / `h(Slot, …)`. `asChild`/`as:'template'`/`as:Slot` all route to `Slot`. `asTag` captured non-reactively in setup.
- `packages/core/src/Primitive/Slot.ts` (38 lines) — the renderless merge engine: flattens Fragments (`renderSlotFragments`), picks first non-`Comment` child, `delete child.props.ref`, `mergeProps(attrs, childProps)` (child wins), `cloneVNode({...child, props:{}}, merged)`; passes sibling children through untouched.
- `packages/core/src/Primitive/usePrimitiveElement.ts` (13 lines) — `$el`/`nextElementSibling` element resolver used by ~20 parts.
- `packages/core/src/shared/useForwardExpose.ts` (97 lines) — `{ forwardRef, currentRef, currentElement }`; `forwardRef` handles both `Element` and component-instance refs and chains child `exposed`; text/comment-root aware.
- `packages/core/src/Primitive/index.ts`, `packages/core/src/index.ts:40` — public exports.

Files this plan creates/modifies:
- **Create** `packages/core/src/Primitive/useRender.ts` — the composable + types + `getStateAttributes` helper.
- **Create** `packages/core/src/Primitive/useRender.test.ts`.
- **Modify** `packages/core/src/Primitive/Primitive.ts` — shim on `useRender` (keep `AsTag`, `PrimitiveProps`, `SELF_CLOSING_TAGS`).
- **Modify** `packages/core/src/Primitive/Slot.ts` — optional dev warning only (no behavior change).
- **Modify** `packages/core/src/Primitive/index.ts` + `packages/core/src/index.ts:40` — export `useRender` + types.
- **Modify** `packages/core/src/Label/Label.vue` — pilot migration off `Primitive`.

Not touched here: the other ~270 parts (follow-up migrations under #2723), `packages/plugins`.

---

## Task 1: Tag resolution (`tag` / `renderless` / `selfClosing`) — TDD

**Files:**
- Create: `packages/core/src/Primitive/useRender.ts`
- Test: `packages/core/src/Primitive/useRender.test.ts`

**Interfaces:**
- Produces:
  ```ts
  import type { Component, ComponentPublicInstance, ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
  import type { AsTag } from './Primitive'

  export type PrimitiveState = Record<string, string | boolean | number | null | undefined>
  export type StateAttributesMapping<S extends PrimitiveState>
    = { [K in keyof S]?: (v: S[K]) => Record<string, string | undefined> | undefined }

  export interface UseRenderOptions<S extends PrimitiveState = PrimitiveState> {
    defaultTagName?: AsTag // @default 'div'
    as?: MaybeRefOrGetter<AsTag | Component | undefined>
    asChild?: MaybeRefOrGetter<boolean | undefined>
    props?: MaybeRefOrGetter<Record<string, any> | undefined>
    state?: MaybeRefOrGetter<S | undefined>
    stateAttributesMapping?: StateAttributesMapping<S>
    ref?: Ref<HTMLElement | null | undefined> | ((el: Element | ComponentPublicInstance | null) => void)
  }

  export interface UseRenderReturn<S extends PrimitiveState = PrimitiveState> {
    tag: ComputedRef<AsTag | Component>
    renderProps: ComputedRef<Record<string, any>>
    renderless: ComputedRef<boolean>
    selfClosing: ComputedRef<boolean>
    elementRef: (el: Element | ComponentPublicInstance | null) => void
    currentElement: ComputedRef<HTMLElement | undefined>
    state: ComputedRef<S | undefined>
  }

  export function useRender<S extends PrimitiveState = PrimitiveState>(options?: UseRenderOptions<S>): UseRenderReturn<S>
  ```
- Consumes: the existing exported `Slot` (`./Slot`), `SELF_CLOSING_TAGS` (export it from `Primitive.ts`).

- [ ] **Step 1: Write the failing test for tag resolution**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
// packages/core/src/Primitive/useRender.test.ts
import { markRaw, nextTick, ref } from 'vue'
import { Slot } from './Slot'
import { useRender } from './useRender'

// Minimal harness: expose the composable return so we can assert computeds directly.
function setup(options: Parameters<typeof useRender>[0]) {
  let api!: ReturnType<typeof useRender>
  mount({
    setup() {
      api = useRender(options)
      return () => null
    },
  })
  return api
}

describe('useRender — tag resolution', () => {
  it('resolves to div when no as/defaultTagName given', () => {
    expect(setup({}).tag.value).toBe('div')
  })
  it('resolves to defaultTagName when as is undefined', () => {
    expect(setup({ defaultTagName: 'label' }).tag.value).toBe('label')
  })
  it('resolves a string as', () => {
    expect(setup({ as: 'span' }).tag.value).toBe('span')
  })
  it('returns Slot and renderless=true when asChild is true', () => {
    const api = setup({ asChild: true })
    expect(api.tag.value).toBe(Slot)
    expect(api.renderless.value).toBe(true)
  })
  it('returns Slot when as === Slot', () => {
    expect(setup({ as: markRaw(Slot) }).tag.value).toBe(Slot)
  })
  it('treats as="template" as renderless (v2 compat)', () => {
    expect(setup({ as: 'template' }).renderless.value).toBe(true)
  })
  it('marks self-closing tags', () => {
    expect(setup({ as: 'input' }).selfClosing.value).toBe(true)
    expect(setup({ as: 'div' }).selfClosing.value).toBe(false)
  })
  it('updates tag reactively when as changes', async () => {
    const as = ref<'div' | 'span'>('div')
    const api = setup({ as })
    expect(api.tag.value).toBe('div')
    as.value = 'span'
    await nextTick()
    expect(api.tag.value).toBe('span')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive/useRender.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement resolution (and stub the rest)**

```ts
// packages/core/src/Primitive/useRender.ts
import type { /* types as above */ } from 'vue'
import { computed, toValue } from 'vue'
import { SELF_CLOSING_TAGS } from './Primitive'
import { Slot } from './Slot'

export function useRender(options = {}) {
  const tag = computed(() => {
    const as = toValue(options.as)
    if (toValue(options.asChild) || as === Slot || as === 'template')
      return Slot
    return as ?? options.defaultTagName ?? 'div'
  })
  const renderless = computed(() => tag.value === Slot)
  const selfClosing = computed(() => {
    const t = tag.value
    return typeof t === 'string' && SELF_CLOSING_TAGS.includes(t)
  })

  // Task 2:
  const state = computed(() => toValue(options.state))
  const renderProps = computed<Record<string, any>>(() => ({}))
  // Task 3:
  const elementRef = (_el: any) => {}
  const currentElement = computed<HTMLElement | undefined>(() => undefined)

  return { tag, renderProps, renderless, selfClosing, elementRef, currentElement, state }
}
```

Add `export const SELF_CLOSING_TAGS = ['area', 'img', 'input']` to `Primitive.ts` (or move it here and re-export). Keep the exact array.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive/useRender.test.ts`
Expected: PASS (tag-resolution describe).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/Primitive/useRender.ts packages/core/src/Primitive/useRender.test.ts packages/core/src/Primitive/Primitive.ts
git commit -m "feat(Primitive): useRender tag/renderless/selfClosing resolution"
```

---

## Task 2: `renderProps` — state→`data-*` + prop merging (TDD)

**Files:**
- Modify: `packages/core/src/Primitive/useRender.ts`
- Test: `packages/core/src/Primitive/useRender.test.ts`

**Interfaces:**
- Consumes: `state`, `options.props`, `options.stateAttributesMapping`.
- Produces: `renderProps = mergeProps(stateAttrs, toValue(options.props) ?? {})`. State→attr rules: boolean `true` → `data-<key>=""`; `false`/`null`/`undefined` → omitted; string/number → `data-<key>="<value>"`; camelCase keys → kebab-case data attributes. `stateAttributesMapping[key]` overrides the default mapping for that key.

- [ ] **Step 1: Write the failing tests**

```ts
// append to useRender.test.ts
describe('useRender — renderProps', () => {
  it('passes through options.props', () => {
    expect(setup({ props: { id: 'x' } }).renderProps.value).toMatchObject({ id: 'x' })
  })
  it('boolean true state → empty-string data attribute', () => {
    expect(setup({ state: { disabled: true } }).renderProps.value).toMatchObject({ 'data-disabled': '' })
  })
  it('omits data attribute for false/undefined state', () => {
    const rp = setup({ state: { disabled: false, open: undefined } }).renderProps.value
    expect(rp).not.toHaveProperty('data-disabled')
    expect(rp).not.toHaveProperty('data-open')
  })
  it('string/number state → value data attribute (kebab-cased key)', () => {
    expect(setup({ state: { orientation: 'horizontal' } }).renderProps.value)
      .toMatchObject({ 'data-orientation': 'horizontal' })
  })
  it('applies stateAttributesMapping overrides', () => {
    const rp = setup({
      state: { checked: true },
      stateAttributesMapping: { checked: v => ({ 'aria-checked': String(v) }) },
    }).renderProps.value
    expect(rp).toMatchObject({ 'aria-checked': 'true' })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive/useRender.test.ts`
Expected: FAIL — `renderProps` is `{}`.

- [ ] **Step 3: Implement `getStateAttributes` + `renderProps`**

```ts
import { mergeProps } from 'vue'

function kebab(k: string) {
  return k.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase()
}

function getStateAttributes(state, mapping) {
  const out = {}
  if (!state)
    return out
  for (const key in state) {
    const value = state[key]
    if (mapping?.[key]) {
      Object.assign(out, mapping[key](value) ?? {})
      continue
    }
    if (value === false || value == null)
      continue
    out[`data-${kebab(key)}`] = value === true ? '' : String(value)
  }
  return out
}
```

Then: `const stateAttrs = computed(() => getStateAttributes(toValue(options.state), options.stateAttributesMapping))` and `const renderProps = computed(() => mergeProps(stateAttrs.value, toValue(options.props) ?? {}))`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive/useRender.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/Primitive/useRender.ts packages/core/src/Primitive/useRender.test.ts
git commit -m "feat(Primitive): useRender state→data-* and prop merging"
```

---

## Task 3: `elementRef` + `currentElement` (ref forwarding) — TDD

**Files:**
- Modify: `packages/core/src/Primitive/useRender.ts`
- Test: `packages/core/src/Primitive/useRender.test.ts`

**Interfaces:**
- Consumes: `useForwardExpose` from `../shared/useForwardExpose`.
- Produces: `elementRef` — a callback ref that (a) drives `useForwardExpose().forwardRef` and (b) writes `options.ref` (a `Ref` or a callback); `currentElement` = `useForwardExpose().currentElement` (text/comment-root aware, matches `usePrimitiveElement`). This is the `useMergedRefs` equivalent — folded into `useForwardExpose` reuse rather than a new primitive.

- [ ] **Step 1: Write the failing test (mount a real element)**

```ts
// append to useRender.test.ts
import { flushPromises } from '@vue/test-utils'

describe('useRender — element rendering & ref', () => {
  const Harness = {
    props: ['as', 'externalRef'],
    setup(props: any) {
      const { tag, renderProps, elementRef, currentElement } = useRender({
        as: () => props.as,
        props: { 'data-testid': 'el' },
        ref: props.externalRef,
      })
      return { tag, renderProps, elementRef, currentElement }
    },
    template: `<component :is="tag" v-bind="renderProps" :ref="elementRef"><span/></component>`,
  }

  it('renders the tag with props and populates currentElement + options.ref', async () => {
    const external = ref<HTMLElement | null>(null)
    const wrapper = mount(Harness, { props: { as: 'section', externalRef: external } })
    await flushPromises()
    expect(wrapper.find('section[data-testid="el"]').exists()).toBe(true)
    expect(external.value).toBeInstanceOf(HTMLElement)
    expect(wrapper.vm.currentElement).toBeInstanceOf(HTMLElement)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive/useRender.test.ts`
Expected: FAIL — `external.value` is null.

- [ ] **Step 3: Implement `elementRef` + `currentElement`**

```ts
import { useForwardExpose } from '../shared/useForwardExpose'

const { forwardRef, currentElement } = useForwardExpose()
function elementRef(el) {
  forwardRef(el)
  if (typeof options.ref === 'function')
    options.ref(el)
  else if (options.ref)
    options.ref.value = (el && '$el' in el ? el.$el : el)
}
```

Return `elementRef` and `currentElement`. Keep `useForwardExpose` wiring in `useRender` (not in the Primitive shim — see Task 4).

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive/useRender.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check + commit**

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/Primitive/useRender.ts packages/core/src/Primitive/useRender.test.ts
git commit -m "feat(Primitive): useRender element ref forwarding"
```

---

## Task 4: Renderless (Slot) parity — port `Primitive.test.ts` asChild scenarios (TDD)

**Files:**
- Test: `packages/core/src/Primitive/useRender.test.ts`
- (No `useRender.ts` change expected — reuses the existing `Slot`.)

**Interfaces:**
- Consumes: `Slot` merge behavior (child props win, class merge, comment bypass, sibling passthrough).

- [ ] **Step 1: Port the asChild scenarios against a useRender harness**

```ts
// append to useRender.test.ts
describe('useRender — renderless (Slot)', () => {
  const Slotted = {
    props: ['as', 'asChild'],
    setup(props: any) {
      const { tag, renderProps, elementRef } = useRender({
        as: () => props.as,
        asChild: () => props.asChild,
        props: { 'class': 'parent', 'data-parent': '' },
      })
      return { tag, renderProps, elementRef }
    },
    template: `<component :is="tag" v-bind="renderProps" :ref="elementRef"><slot/></component>`,
  }

  it('merges renderProps onto the first non-comment child', () => {
    const wrapper = mount(Slotted, { props: { asChild: true }, slots: { default: '<a class="child" href="#">x</a>' } })
    const a = wrapper.find('a')
    expect(a.exists()).toBe(true)
    expect(a.classes()).toContain('parent')
    expect(a.classes()).toContain('child')
    expect(a.attributes('data-parent')).toBe('')
  })
  it('gives child props priority over parent (child href wins)', () => {
    const wrapper = mount(Slotted, {
      props: { asChild: true },
      slots: { default: '<a data-parent="overridden">x</a>' },
    })
    expect(wrapper.find('a').attributes('data-parent')).toBe('overridden')
  })
  it('bypasses leading comment nodes', () => {
    const wrapper = mount(Slotted, { props: { asChild: true }, slots: { default: '<!-- c --><a>x</a>' } })
    expect(wrapper.find('a').classes()).toContain('parent')
  })
})
```

- [ ] **Step 2: Run to verify it passes (Slot already implements this)**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive/useRender.test.ts`
Expected: PASS. If any fail, the divergence from `Slot`'s existing behavior is a bug in the harness template — fix the harness, not `Slot`.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/Primitive/useRender.test.ts
git commit -m "test(Primitive): useRender renderless parity with Slot"
```

---

## Task 5: Rewrite `Primitive` as a compat shim on `useRender` (regression gate)

**Files:**
- Modify: `packages/core/src/Primitive/Primitive.ts`

**Interfaces:**
- Consumes: `useRender`.
- Produces: identical public `PrimitiveProps` + render behavior. Do **not** call `useForwardExpose`/`elementRef` inside the shim (parts put `:ref="forwardRef"` on `<Primitive>` and read `instance.vnode.el`; mutating the shim's own `instance.exposed` would change observable expose behavior).

- [ ] **Step 1: Rewrite the setup**

```ts
// inside defineComponent({ name: 'Primitive', inheritAttrs: false, props: {...}, setup })
function setup(props: any, { attrs, slots }: any) {
  const { tag, renderProps, selfClosing } = useRender({
    defaultTagName: 'div',
    as: () => props.as,
    asChild: () => props.asChild,
    props: attrs, // shim-only: attrs arrive on the shim, forward as props
  })
  return () => h(
    tag.value,
    renderProps.value,
    selfClosing.value ? undefined : { default: slots.default },
  )
}
```

Keep `name: 'Primitive'`, `inheritAttrs: false`, the `props` block, and the exported `AsTag` / `PrimitiveProps` / `SELF_CLOSING_TAGS` unchanged.

- [ ] **Step 2: Run the existing Primitive regression suite unchanged**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive`
Expected: PASS — all 15 tests in `Primitive.test.ts` pass **without edits** (default `div`, `as` string/component, `asChild` merge/priority/class/comment/siblings, `as="template"`, self-closing `input`).

- [ ] **Step 3: Type-check**

Run: `pnpm --filter reka-ui type-check`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/Primitive/Primitive.ts
git commit -m "refactor(Primitive): rebuild Primitive as a useRender compat shim"
```

---

## Task 6: Export `useRender` + optional Slot dev warning

**Files:**
- Modify: `packages/core/src/Primitive/index.ts`, `packages/core/src/index.ts`
- Modify (optional): `packages/core/src/Primitive/Slot.ts`

- [ ] **Step 1: Add exports**

```ts
// Primitive/index.ts — add:
export { type PrimitiveState, type StateAttributesMapping, useRender, type UseRenderOptions, type UseRenderReturn } from './useRender'
```
Update `packages/core/src/index.ts:40` to also export `useRender` + its public types from `./Primitive`.

- [ ] **Step 2: (Optional) Add a dev-only Slot warning using the correct env guard**

In `Slot.ts`, when `firstNonCommentChildrenIndex === -1` (no valid element child) under `process.env.NODE_ENV !== 'production'`, `console.warn` a helpful message (reuse `isValidVNodeElement` from `shared/isValidVNodeElement.ts`, currently unused). Do NOT use `import.meta.env.DEV` (neutered in dist).

- [ ] **Step 3: Public-export smoke test**

```ts
// append to useRender.test.ts
import * as Reka from '../index'

describe('useRender — public export', () => {
  it('is exported from the package barrel path', () => {
    expect(typeof Reka.useRender).toBe('function')
  })
})
```

- [ ] **Step 4: Test + type-check + build**

Run: `pnpm --filter reka-ui exec vitest run src/Primitive`
Then: `pnpm --filter reka-ui type-check`
Then: `pnpm --filter reka-ui build`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/Primitive/index.ts packages/core/src/index.ts packages/core/src/Primitive/Slot.ts packages/core/src/Primitive/useRender.test.ts
git commit -m "feat(Primitive): export useRender as public API"
```

---

## Task 7: Pilot part migration — `Label` off the wrapper (parity gate)

**Files:**
- Modify: `packages/core/src/Label/Label.vue`

**Interfaces:**
- Consumes: `useRender`.
- Produces: identical rendered HTML + a11y. `Label` is the simplest part (no context, single-root, exact-HTML assertions in `Label.test.ts`).

- [ ] **Step 1: Rewrite `Label.vue` to render via `useRender`**

Replace `<Primitive v-bind="props" @mousedown="...">` with:

```vue
<script setup lang="ts">
import { useRender } from '../Primitive/useRender'
// keep LabelProps { for?: string } extends PrimitiveProps; withDefaults(as: 'label')
const props = withDefaults(defineProps<LabelProps>(), { as: 'label' })
const { tag, renderProps, elementRef } = useRender({
  defaultTagName: 'label',
  as: () => props.as,
  asChild: () => props.asChild,
  props: {
    for: props.for,
    onMousedown: (event: MouseEvent) => {
      // preserve existing handler body verbatim (prevent text selection on double-click)
      if (!event.defaultPrevented && event.detail > 1)
        event.preventDefault()
    },
  },
})
</script>

<template>
  <component :is="tag" v-bind="renderProps" :ref="elementRef">
    <slot />
  </component>
</template>
```

Copy the current `@mousedown` handler body from `Label.vue` **verbatim** — do not idealize it.

- [ ] **Step 2: Run the existing Label suite unchanged**

Run: `pnpm --filter reka-ui exec vitest run src/Label`
Expected: PASS — exact-HTML assertions (`<label></label>`) and axe pass without edits.

- [ ] **Step 3: Broad sweep (Label is consumed elsewhere)**

Run: `pnpm --filter reka-ui exec vitest run`
Expected: PASS across the suite (Checkbox/Switch/RadioGroup label wiring, etc.).

- [ ] **Step 4: Docs regen for the pilot part (non-generic, safe)**

Run: `pnpm --filter reka-ui build` then `pnpm docs:gen` then `git status docs/content/meta/Label.md`
Expected: no prop/emit/slot changes.

- [ ] **Step 5: Type-check + commit**

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/Label/Label.vue docs/content/meta/Label.md
git commit -m "refactor(Label): render via useRender instead of Primitive wrapper"
```

---

## Self-Review

- **Spec coverage:** `useRender({defaultTagName, as, props, state, ref})` → Tasks 1–3; returns `{tag, renderProps, renderless, …}` → Task 1 + return type; renderless via `Slot` sentinel → Task 1 (mapping) + Task 4 (parity); integrated prop/ref/state merging → Tasks 2–3; no wrapper instance → Task 7 (`<component :is>` directly); `mergeProps`/`useMergedRefs` primitives → Vue's `mergeProps` (Task 2) + `elementRef` fold into `useForwardExpose` (Task 3, justified in Risks); keep `Primitive` as thin compat shim → Task 5. Covered.
- **Type consistency:** `UseRenderOptions`/`UseRenderReturn`/`PrimitiveState`/`StateAttributesMapping` used identically across Tasks 1–3 and exported unchanged in Task 6. `elementRef` signature `(el) => void` consistent Task 3 ↔ Task 7 template.
- **Attrs double-apply guard:** `renderProps` deliberately excludes `useAttrs()` — parts stay single-root and rely on Vue's native fallthrough; the shim (Task 5) forwards `attrs` as `props` because it is itself the wrapper.

## Risks / Gotchas

1. **Double-applied attrs** — never include `useAttrs()` in `renderProps` for a part root; rely on fallthrough. `inheritAttrs: false` parts bind `$attrs` explicitly. Vue's `mergeProps` dedupes identical fn refs but not re-created inline handlers.
2. **`import.meta.env.DEV` neutered in dist** — use `process.env.NODE_ENV !== 'production'` for dev warnings (Task 6).
3. **Self-closing hydration** — `area/img/input` must render with no children (`selfClosing`); ~10 parts default `as:'input'`.
4. **Ref/expose contract (484 imports)** — the shim must not mutate its own `instance.exposed`; `useForwardExpose.forwardRef` already handles Element vs component-instance refs.
5. **Text/comment first-root** — `currentElement` must resolve to `nextElementSibling` (reuse `useForwardExpose`).
6. **Scoped CSS** — single-root fallthrough carries `data-v-*`; multi-root migrated parts (later, #2723) keep `useForwardScopeId`; verify `<component :is="Slot">` still carries the part's scopeId onto the cloned child.
7. **`asChild` becomes reactive** — an improvement over today's setup-frozen value; `ComboboxItem.vue` `v-memo` already keys on `props.as, props.asChild`.
8. **`as="template"` compat** — keep accepting it (tested heavily in `Primitive.test.ts`).
9. **`Slot`'s `delete child.props.ref`** is load-bearing — do not remove when reusing `Slot`.
10. **SSR** — no `document` access in `useRender` computeds; `onUpdated`/callback refs are client-only (fine).

## Execution Handoff

Recommended: **Subagent-Driven** (superpowers:subagent-driven-development). Tasks 1–4 build + prove `useRender` in isolation; Task 5 is the highest-scrutiny gate (Primitive shim parity); Tasks 6–7 export + prove one real part. Only after this lands do #2723 (headless composables) and #2724 (overlay perf, template swap) build on it.
