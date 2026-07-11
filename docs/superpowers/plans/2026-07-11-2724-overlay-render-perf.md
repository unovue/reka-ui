# Overlay & Render Performance Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Tracks GitHub issue **#2724** (Phase 2 — Built on the foundation), part of the reka-ui v3 roadmap **#2721**. The stack-manager work is independent of #2722 (`useRender`); only the final wrapper-removal step (Task 8) depends on it.

**Goal:** Replace `DismissableLayer`'s per-layer global listeners (3+ `document`/`window` listeners **per open layer**) and per-read O(n) `Array.from(...).indexOf()` scans with a **single centralized stack manager** exposing exactly one shared set of `document` listeners regardless of layer count, plus benchmarks that quantify the wins. Then remove the wrapper render instance via `useRender`.

**Architecture:** A new plain-module singleton `layerStack.ts` holds an ordered array of layer handles, the branch set, and the "outside-pointer-events-disabled" set; it installs exactly one `pointerdown` + one `focusin` + one `keydown` `document` listener on first registration and tears them down when the last layer unregisters. Each listener does **one** `querySelectorAll` snapshot per event and dispatches to the relevant handle(s), preserving today's exact dismissal semantics (top-only Escape; all-qualifying-layers pointer/focus outside; `disableOutsidePointerEvents` body lock; branches; touch-click deferral; `setTimeout(0)` arming). `usePointerDownOutside`/`useFocusOutside` keep their exact signatures but become thin subscriptions to the manager.

**Tech Stack:** Vue 3 (`shallowReactive`, `watch`, `watchEffect`), TypeScript, vitest 4 (`bench`/tinybench built in), jsdom, `@vue/test-utils`.

## Global Constraints

- Node ≥ 22, pnpm 10. All commands from repo root.
- Test (one-shot): `pnpm --filter reka-ui exec vitest run <path>` — never `pnpm test` (watch).
- Type-check: `pnpm --filter reka-ui type-check`. Build: `pnpm --filter reka-ui build`. Lint fix: `pnpm lint:fix`.
- **Behavior is frozen.** Every existing test in `packages/core/src/DismissableLayer/DismissableLayer.test.ts` (incl. the #2674 `disableOutsidePointerEvents` suite and the `present:false` tests) and every consumer suite must pass **unchanged**. `usePointerDownOutside`/`useFocusOutside` **signatures** `(handler?, element?, enabled?)` must not change — `Editable/EditableRoot.vue` calls them directly.
- Consumers to regression-test (blast radius): Dialog, Drawer, Menu (→ DropdownMenu/ContextMenu/Menubar), Popover, Tooltip, HoverCard, Combobox, Select, NavigationMenu, Toast (Branch), Editable.
- Preserve the #2674 body-pointer-events ordering comments (`DismissableLayer.vue:159-164,176-183`) — they encode hard-won semantics; port them verbatim.
- Module singleton must be SSR-safe (no `document` at import; install lazily, `isClient`-gated) and test-isolated (export `resetLayerStack()` for `beforeEach`).
- Conventional Commits, scope `DismissableLayer`: `perf(DismissableLayer): …`. commitlint enforces.

---

## File Structure

Current relevant files (verified against `v2`, HEAD `47c433a84`):
- `packages/core/src/DismissableLayer/DismissableLayer.vue` — module-scoped `context = reactive({ layersRoot, layersWithOutsidePointerEventsDisabled, originalBodyPointerEvents, branches })` (L57-62); `index` computed via `Array.from(layers).indexOf()` (L99-103); `isPointerEventsEnabled` (L109-115, two more O(n) conversions); body-pointer-events lock `watch` (L165-196); stack membership `watch` on `[layerElement, present]` (L203-214) + safety-net cleanup (L216-223); Escape via `onKeyStroke('Escape', …)` (L144-157, one `window` listener per layer); renders `Primitive` (L226-245).
- `packages/core/src/DismissableLayer/utils.ts` — `usePointerDownOutside` (attaches `document` `pointerdown` deferred via `setTimeout(0)` at L126-128, plus a re-armed `click` `{once}` for touch at L98-100) and `useFocusOutside` (attaches `document` `focusin` at L182); `isLayerExist` (L16-40, `querySelectorAll('[data-dismissable-layer]')` per handler call); dead `CONTEXT_UPDATE`/`dispatchUpdate` (L12,203-206).
- `packages/core/src/DismissableLayer/DismissableLayerBranch.vue` — imports `context` from `DismissableLayer.vue` (L11), does `context.branches.add/delete` (L16-21).
- `packages/core/src/DismissableLayer/index.ts` — family exports (internal; root barrel only re-exports the two event *types*).
- `packages/core/src/shared/handleAndDispatchCustomEvent.ts` — dispatches the cancelable `dismissableLayer.pointerDownOutside`/`.focusOutside` CustomEvent on the target.
- `packages/core/vite.config.ts` (test block L14-34, jsdom), `packages/core/package.json` (scripts L76-86; vitest 4.1.8).

Files this plan creates/modifies:
- **Create** `packages/core/src/DismissableLayer/layerStack.ts` — the manager + `resetLayerStack()`.
- **Create** `packages/core/src/DismissableLayer/layerStack.test.ts` — manager unit tests.
- **Modify** `packages/core/src/DismissableLayer/utils.ts` — reimplement the two composables as manager subscriptions; fold `isLayerExist` into a hoisted snapshot; delete dead `CONTEXT_UPDATE`/`dispatchUpdate`.
- **Modify** `packages/core/src/DismissableLayer/DismissableLayer.vue` — remove `context` reactive + `onKeyStroke`; register a handle; keep both `watch`es' semantics; (Task 8, after #2722) swap `Primitive` → `useRender`.
- **Modify** `packages/core/src/DismissableLayer/DismissableLayerBranch.vue` — register via `layerStack.branches`.
- **Create** `packages/core/src/DismissableLayer/DismissableLayer.listeners.test.ts` — listener/`querySelectorAll` count regressions.
- **Create** `packages/core/src/DismissableLayer/DismissableLayer.bench.ts` — benchmarks.
- **Modify** `packages/core/vite.config.ts` (`benchmark.include`), `packages/core/package.json` (`"bench"` script).

---

## Task 1: The stack manager `layerStack.ts` (TDD, pure DOM)

**Files:**
- Create: `packages/core/src/DismissableLayer/layerStack.ts`
- Test: `packages/core/src/DismissableLayer/layerStack.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface LayerHandle {
    element: () => HTMLElement | undefined
    isPresent: () => boolean
    isPointerEventsEnabled: () => boolean
    isPointerInside: boolean
    isFocusInside: boolean
    armed: boolean
    participatesInStack: boolean // false for standalone Editable usage — excluded from Escape/top-layer accounting
    onPointerDownOutside?: (event: PointerEvent) => void
    onFocusOutside?: (event: FocusEvent) => void
    onEscapeKeyDown?: (event: KeyboardEvent) => void
  }
  export const layers: LayerHandle[] // ordered: [0]=bottom, last=top (shallowReactive)
  export const branches: HTMLElement[]
  export function registerLayer(handle: LayerHandle): () => void // returns unregister
  export function registerBranch(el: HTMLElement): () => void
  export function isTopLayer(handle: LayerHandle): boolean
  export function indexOfLayer(handle: LayerHandle): number
  export function resetLayerStack(): void // test-only reset
  ```
- Consumes: nothing (plain module; Vue `shallowReactive` for the arrays).

- [ ] **Step 1: Write the failing manager tests**

```ts
// packages/core/src/DismissableLayer/layerStack.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isTopLayer, layers, registerLayer, resetLayerStack } from './layerStack'

function makeHandle(overrides = {}) {
  return {
    element: () => document.body,
    isPresent: () => true,
    isPointerEventsEnabled: () => true,
    isPointerInside: false,
    isFocusInside: false,
    armed: true,
    participatesInStack: true,
    ...overrides,
  }
}

afterEach(() => resetLayerStack())

describe('layerStack', () => {
  it('installs exactly one document listener of each kind for N layers', () => {
    const add = vi.spyOn(document, 'addEventListener')
    registerLayer(makeHandle())
    registerLayer(makeHandle())
    registerLayer(makeHandle())
    const kinds = add.mock.calls.map(c => c[0])
    expect(kinds.filter(k => k === 'pointerdown')).toHaveLength(1)
    expect(kinds.filter(k => k === 'focusin')).toHaveLength(1)
    expect(kinds.filter(k => k === 'keydown')).toHaveLength(1)
    add.mockRestore()
  })

  it('removes all document listeners when the last layer unregisters', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const off1 = registerLayer(makeHandle())
    const off2 = registerLayer(makeHandle())
    off1()
    expect(remove).not.toHaveBeenCalled() // still one layer left
    off2()
    const kinds = remove.mock.calls.map(c => c[0])
    expect(kinds).toContain('pointerdown')
    expect(kinds).toContain('focusin')
    expect(kinds).toContain('keydown')
    remove.mockRestore()
  })

  it('maintains registration order and isTopLayer', () => {
    const a = makeHandle()
    const b = makeHandle()
    registerLayer(a)
    registerLayer(b)
    expect(layers[0]).toBe(a)
    expect(isTopLayer(b)).toBe(true)
    expect(isTopLayer(a)).toBe(false)
  })

  it('routes Escape only to the top present participating layer', () => {
    const bottom = makeHandle({ onEscapeKeyDown: vi.fn() })
    const top = makeHandle({ onEscapeKeyDown: vi.fn() })
    registerLayer(bottom)
    registerLayer(top)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(top.onEscapeKeyDown).toHaveBeenCalledOnce()
    expect(bottom.onEscapeKeyDown).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer/layerStack.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the manager**

Implement `layerStack.ts` with: `shallowReactive` `layers`/`branches` arrays; lazy `installListeners(doc)` on first `registerLayer` (guarded by `isClient`), `teardownListeners(doc)` when `layers.length === 0`; `handleKeyDown` finds `[...layers].reverse().find(h => h.participatesInStack && h.isPresent())` and calls its `onEscapeKeyDown` (only for `event.key === 'Escape'`); `handlePointerDown`/`handleFocusIn` fold the current `utils.ts` bodies (see Task 2) using **one** hoisted `querySelectorAll` snapshot per event and iterate `[...layers]` (snapshot — dismiss handlers mutate `layers`); `registerLayer` sets `armed=false` then `setTimeout(() => handle.armed = true, 0)` and returns an unregister that clears the timer, splices, and tears down if empty; `resetLayerStack()` clears arrays + force-removes listeners (for tests).

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer/layerStack.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/DismissableLayer/layerStack.ts packages/core/src/DismissableLayer/layerStack.test.ts
git commit -m "perf(DismissableLayer): add centralized layer stack manager"
```

---

## Task 2: Migrate Escape to the manager (smallest surface first)

**Files:**
- Modify: `packages/core/src/DismissableLayer/DismissableLayer.vue`

**Interfaces:**
- Consumes: `registerLayer`, `isTopLayer` from `layerStack.ts`.
- Produces: Escape dismissal identical to today (top present layer only; respects `defaultPrevented`).

- [ ] **Step 1: Register a handle and route Escape through it**

In `DismissableLayer.vue` setup: build a `LayerHandle` whose `onEscapeKeyDown` runs the **current** `onKeyStroke('Escape', …)` callback body (L144-157) — emit `escapeKeyDown`, and if not `defaultPrevented`, `dismiss`. Register in the existing membership `watch` (L203-214) replacing `layers.value.add/delete`. **Delete** the `onKeyStroke('Escape', …)` call (removes one `window` listener per layer). Keep `index`/`isPointerEventsEnabled`/body-lock as-is for now (still reading the old `context`) — this task only moves Escape.

> Transitional note: during Tasks 2–4 the component briefly holds both the old `context` reactive and a manager handle. That is intentional — each task migrates one concern and keeps the suite green. The old `context` is fully removed in Task 5.

- [ ] **Step 2: Run the DismissableLayer suite + add a stacking test**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer`
Add a test: two stacked layers → only the top emits `escapeKeyDown`; after dismissing the top, Escape falls through to the lower layer. Existing Escape tests must pass unchanged.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/DismissableLayer/DismissableLayer.vue
git commit -m "perf(DismissableLayer): route Escape through the shared stack manager"
```

---

## Task 3: Migrate `useFocusOutside` to a manager subscription

**Files:**
- Modify: `packages/core/src/DismissableLayer/utils.ts`

**Interfaces:**
- Consumes: `registerLayer`, `layers`, `branches`.
- Produces: `useFocusOutside(onFocusOutside?, element?, enabled?)` — **unchanged signature**, still returns `{ onFocusCapture, onBlurCapture }`. Internally builds a minimal handle (only `onFocusOutside` + the inside flags), registers/unregisters in the same `watchEffect(enabled)`. The shared `focusin` dispatch lives in `layerStack.ts` (folded from the current `handleFocus` body at `utils.ts:162-180`, preserving the double `nextTick`).

- [ ] **Step 1: Reimplement `useFocusOutside`**

Move the `handleFocus` logic into the manager's `handleFocusIn`: for each handle with an `onFocusOutside`, run the current checks (target in a branch → skip; `isLayerExist`-equivalent via the hoisted snapshot → skip; `isFocusInside` flag consume) then `handleAndDispatchCustomEvent(FOCUS_OUTSIDE, handle.onFocusOutside, { originalEvent })`. The composable's returned `onFocusCapture`/`onBlurCapture` now write `handle.isFocusInside` instead of a local ref.

- [ ] **Step 2: Run focus tests + Editable**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer src/Editable`
Expected: existing focus-outside tests (`DismissableLayer.test.ts:178-193`) and Editable focus tests pass unchanged.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/DismissableLayer/utils.ts packages/core/src/DismissableLayer/layerStack.ts
git commit -m "perf(DismissableLayer): route focusOutside through the shared manager"
```

---

## Task 4: Migrate `usePointerDownOutside` (incl. touch-click deferral + arming)

**Files:**
- Modify: `packages/core/src/DismissableLayer/utils.ts`, `packages/core/src/DismissableLayer/layerStack.ts`

**Interfaces:**
- Consumes: manager pointerdown dispatch.
- Produces: `usePointerDownOutside(onPointerDownOutside?, element?, enabled?)` — unchanged signature, returns `{ onPointerDownCapture }`. The `setTimeout(0)` self-dismiss guard becomes the per-handle `armed` flag; the touch `click` `{once:true}` deferral becomes **one shared** re-armed slot in the manager.

- [ ] **Step 1: Fold `handlePointerDown` into the manager**

In `layerStack.ts` `handlePointerDown`: hoist **one** `querySelectorAll('[data-dismissable-layer]')` snapshot + `target.closest(...)` + `branches.some(...)` per event. For each `[...layers]` handle with `onPointerDownOutside`: skip if `!handle.armed`; consume `handle.isPointerInside`; apply the `isLayerExist`-equivalent DOM-order check against the snapshot (preserving the `mainLayer` fallback for non-`data-dismissable-layer` elements like Editable); for touch (`pointerType === 'touch'`), defer to a single shared `click` `{once:true}` handler (re-armed/cleared with today's rules); else `nextTick()` then `handleAndDispatchCustomEvent(POINTER_DOWN_OUTSIDE, handle.onPointerDownOutside, …)`. Delete the per-layer `document.addEventListener('pointerdown', …)` and the dead `CONTEXT_UPDATE`/`dispatchUpdate`.

- [ ] **Step 2: Run the full DismissableLayer suite (incl. #2674)**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer`
Expected: all pass unchanged, including the touch-deferral and #2674 `disableOutsidePointerEvents` cases.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/DismissableLayer/utils.ts packages/core/src/DismissableLayer/layerStack.ts
git commit -m "perf(DismissableLayer): route pointerDownOutside through the shared manager"
```

---

## Task 5: Remove the reactive `context`; move branches + body-lock to the manager

**Files:**
- Modify: `packages/core/src/DismissableLayer/DismissableLayer.vue`, `packages/core/src/DismissableLayer/DismissableLayerBranch.vue`

**Interfaces:**
- Consumes: `layers`, `branches`, `layersWithOutsidePointerEventsDisabled` from the manager.
- Produces: `index`/`isPointerEventsEnabled`/`isBodyPointerEventsDisabled` read the manager arrays with array `indexOf` (no `Array.from`); body-pointer-events lock keeps the exact #2674 formulas + comments; `DismissableLayerBranch` registers via `registerBranch`.

- [ ] **Step 1: Replace `context` reads**

Delete the module `context = reactive({...})`. Rewrite `index` as `indexOfLayer(handle)`; `isPointerEventsEnabled` using `layersWithOutsidePointerEventsDisabled` (array). Port the body-lock `watch` (L165-196) verbatim except array-backed, keeping comments L159-164/176-183 and the size-0-after-delete restore (#2674). Make `originalBodyPointerEvents` a manager field (or keep local — but preserve single-restore semantics).

- [ ] **Step 2: Migrate the Branch**

`DismissableLayerBranch.vue`: replace `import { context } from './DismissableLayer.vue'` + `context.branches.add/delete` with `registerBranch(currentElement.value)` in `onMounted`/unregister in `onUnmounted`.

- [ ] **Step 3: Run DismissableLayer + Toast (branch consumer) + broad overlay sweep**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer src/Toast src/Dialog src/Menu src/Popover src/Select src/Combobox src/Tooltip src/HoverCard src/NavigationMenu src/Drawer src/Editable`
Expected: all pass unchanged.

- [ ] **Step 4: Type-check + commit**

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/DismissableLayer/DismissableLayer.vue packages/core/src/DismissableLayer/DismissableLayerBranch.vue packages/core/src/DismissableLayer/layerStack.ts
git commit -m "perf(DismissableLayer): remove reactive context in favor of the stack manager"
```

---

## Task 6: Listener/query-count regression tests

**Files:**
- Create: `packages/core/src/DismissableLayer/DismissableLayer.listeners.test.ts`

- [ ] **Step 1: Write the count-regression tests**

```ts
// packages/core/src/DismissableLayer/DismissableLayer.listeners.test.ts
import { describe, expect, it, vi } from 'vitest'
// mount N DismissableLayers (open) via a fixture, then assert:
describe('DismissableLayer listener consolidation', () => {
  it('registers exactly one document pointerdown/focusin/keydown for many layers', () => {
    const add = vi.spyOn(document, 'addEventListener')
    // mount 10 open layers
    const kinds = add.mock.calls.map(c => c[0])
    expect(kinds.filter(k => k === 'pointerdown')).toHaveLength(1)
    expect(kinds.filter(k => k === 'focusin')).toHaveLength(1)
    expect(kinds.filter(k => k === 'keydown')).toHaveLength(1)
    add.mockRestore()
  })
  it('runs querySelectorAll once per outside pointerdown regardless of layer count', () => {
    const qsa = vi.spyOn(document, 'querySelectorAll')
    // mount 5 open layers, dispatch one outside pointerdown
    // assert qsa called once for '[data-dismissable-layer]'
    qsa.mockRestore()
  })
  it('removes all document listeners after every layer unmounts', () => {})
})
```

Fill fixture bodies using `@vue/test-utils` `mount` of a small wrapper rendering N `DismissableLayer`s. Reset the manager in `beforeEach`.

- [ ] **Step 2: Run + commit**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer/DismissableLayer.listeners.test.ts`

```bash
git add packages/core/src/DismissableLayer/DismissableLayer.listeners.test.ts
git commit -m "test(DismissableLayer): assert single shared listener + one query per event"
```

---

## Task 7: Benchmarks

**Files:**
- Create: `packages/core/src/DismissableLayer/DismissableLayer.bench.ts`
- Modify: `packages/core/vite.config.ts`, `packages/core/package.json`

- [ ] **Step 1: Add the bench config + script**

In `packages/core/vite.config.ts` `test` block add `benchmark: { include: ['./**/*.bench.{ts,js}'] }`. In `packages/core/package.json` scripts add `"bench": "vitest bench --run"`.

- [ ] **Step 2: Write the benchmarks**

```ts
// packages/core/src/DismissableLayer/DismissableLayer.bench.ts
import { bench, describe } from 'vitest'

describe('DismissableLayer', () => {
  bench('mount + unmount 50 stacked layers', () => { /* mount 50, unmount */ })
  bench('100 outside pointerdowns against 20 open layers', () => { /* dispatch loop */ })
  bench('Escape dispatch against 20 open layers', () => { /* dispatch keydown */ })
})
```

- [ ] **Step 3: Run + record numbers in the PR body**

Run: `pnpm --filter reka-ui bench`
Capture the before/after (run once on `v2`, once on this branch) in the PR description.

- [ ] **Step 4: Add a render-count assertion (plain test)**

An `onUpdated`-counter child inside one layer while sibling layers mount/unmount — assert the counter does not increment (proves the reactive-Set churn is gone). Add to the listeners test file.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/DismissableLayer/DismissableLayer.bench.ts packages/core/vite.config.ts packages/core/package.json
git commit -m "perf(DismissableLayer): add overlay interaction + render benchmarks"
```

---

## Task 8: (Depends on #2722) Remove the wrapper render instance via `useRender`

**Files:**
- Modify: `packages/core/src/DismissableLayer/DismissableLayer.vue`, `packages/core/src/DismissableLayer/DismissableLayerBranch.vue`

> **Blocked on #2722.** Do not start until `useRender` is merged. Everything above lands independently.

- [ ] **Step 1: Swap `Primitive` for `useRender`**

Replace `<Primitive :ref="forwardRef" v-bind="...">` with `<component :is="tag" v-bind="renderProps" :ref="elementRef">`, moving the current bound attributes (incl. `style.pointerEvents` from `isBodyPointerEventsDisabled`/`isPointerEventsEnabled`) into the `props`/`state` passed to `useRender`. Removes one component instance per overlay part.

- [ ] **Step 2: Full suite + render-count assertion**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer` and the consumer sweep from Task 5.
Add a render-count assertion showing one fewer instance in the overlay chain.

- [ ] **Step 3: Type-check + commit**

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/DismissableLayer/DismissableLayer.vue packages/core/src/DismissableLayer/DismissableLayerBranch.vue
git commit -m "perf(DismissableLayer): render via useRender, dropping the Primitive wrapper"
```

---

## Self-Review

- **Spec coverage:** "single shared listener + one centralized stack manager" → Tasks 1–5; "remove wrapper render overhead via useRender" → Task 8; "measurable reductions" → Tasks 6 (counts) + 7 (benchmarks). Covered.
- **Semantics preserved:** top-only Escape (Task 2), all-qualifying-layers pointer/focus outside (Tasks 3–4), `disableOutsidePointerEvents` body lock + #2674 comments (Task 5), branches (Task 5), touch-click deferral + `setTimeout(0)` arming (Task 4), custom-event `preventDefault` path (unchanged — reuses `handleAndDispatchCustomEvent`).
- **Type consistency:** `LayerHandle` fields (`armed`, `isPointerInside`, `isFocusInside`, `participatesInStack`, `onPointerDownOutside`/`onFocusOutside`/`onEscapeKeyDown`) used identically across Tasks 1–5. `registerLayer`/`registerBranch`/`isTopLayer`/`resetLayerStack` names stable.
- **Signature freeze:** `usePointerDownOutside`/`useFocusOutside` `(handler?, element?, enabled?)` unchanged (Tasks 3–4) — Editable compiles untouched.

## Risks / Gotchas

1. **Capture vs bubble** — keep the shared `pointerdown`/`focusin` on **bubble** phase (element guards are capture); moving to capture breaks inside-detection for portal'd content that relies on the flags, not DOM containment.
2. **Handler order** — iterate a `[...layers]` snapshot in registration order (matches today); dismiss handlers unregister mid-dispatch.
3. **Stack order ≠ DOM order** — Escape uses presence/registration order; outside-detection uses DOM (`querySelectorAll`) order. Preserve both independently; don't unify.
4. **`setTimeout(0)` arming** — the per-handle `armed` flag is load-bearing (mount-via-pointerdown self-dismiss guard, `utils.ts:113-125`).
5. **`ownerDocument`** — today effectively always `globalThis.document` (captured before the element ref exists); match that as parity; a per-`Document` listener map is the correct generalization but out of scope here (overlaps #2725).
6. **SSR** — no `document` at import; install listeners lazily on first `registerLayer`, `isClient`-gated.
7. **Teardown** — last-layer teardown must also clear the shared touch-`click` deferred listener and any arming timers; keep an equivalent of the safety-net cleanup (`DismissableLayer.vue:216-223`) for `forwardRef` element swaps.
8. **Reactive granularity** — `shallowReactive` arrays: `isPointerEventsEnabled`'s style binding must still update on other layers registering, but the #2674 body-lock `watch` must NOT become reactive to membership churn (see comments L159-164).
9. **Test isolation** — the module singleton persists across vitest files in a worker; `resetLayerStack()` in `beforeEach` or listener-count assertions flake.
10. **#2722 dependency** — only Task 8 needs `useRender`; land Tasks 1–7 first.

## Execution Handoff

Recommended: **Subagent-Driven** (superpowers:subagent-driven-development). Task 1 (pure manager) is a clean isolated unit; Tasks 2–5 migrate one concern each with the full suite as the gate (highest scrutiny on Task 5's #2674 body-lock port); Tasks 6–7 quantify; Task 8 waits on #2722. Run the consumer sweep after Tasks 5 and 8.
