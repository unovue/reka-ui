# Overlay & Render Performance Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Tracks GitHub issue **#2724** (Phase 2), part of the reka-ui v3 roadmap **#2721**. Tasks 1–7 are independent of #2722; the wrapper-removal (Task 8) depends on `useRender`. **This plan lands before #2725 (Shadow DOM) and builds the shadow-safe composed-target reads into `layerStack.ts` from day one** (so #2725 does not re-patch `DismissableLayer/utils.ts`).

**Goal:** Replace `DismissableLayer`'s per-layer global listeners (3 `document`/`window` listeners **per open layer**) and per-read O(n) `Array.from(...).indexOf()` scans with a **single centralized stack manager** exposing exactly one shared listener of each kind regardless of layer count, one `querySelectorAll` snapshot per event, plus benchmarks that quantify the wins. Then remove the wrapper render instance via `useRender`.

**Architecture:** A plain-module singleton `layerStack.ts` acting as **transport only** — it owns the shared listeners, the per-event `querySelectorAll` snapshot, subscriber iteration, arming, and the touch-click deferral map. It does **not** re-implement dismissal logic: each `DismissableLayer/utils.ts` composable ports its current `handlePointerDown`/`handleFocus` body **verbatim** into a subscriber closure that the manager invokes with the hoisted snapshot; the component-level branch/present checks stay in the component callbacks. Two **separate** registries model the two populations with different lifetimes: an ordered presence-driven **stack** (Escape routing, indexing, pointer-events accounting) and a setup/enabled-driven **outside-subscriber** list (pointer/focus dispatch). Target reads go through `event.composedPath()[0] ?? event.target` so overlays work inside shadow roots, and the captured target is threaded into `handleAndDispatchCustomEvent`.

**Tech Stack:** Vue 3 (`shallowReactive`, `watch`, `watchEffect`), TypeScript, vitest 4 (`bench`/tinybench), jsdom, `@vue/test-utils`.

## Global Constraints

- Node ≥ 22, pnpm 10. All commands from repo root.
- Test (one-shot): `pnpm --filter reka-ui exec vitest run <path>` — never `pnpm test` (watch).
- Type-check: `pnpm --filter reka-ui type-check`. Build: `pnpm --filter reka-ui build`. Lint fix: `pnpm lint:fix`.
- **Behavior is frozen.** Every existing `DismissableLayer.test.ts` case (incl. the #2674 `disableOutsidePointerEvents` suite, the `present:false` tests, and the **`isLayerExist` unit tests at `:9,15-21` — the export must stay**) and every consumer suite must pass **unchanged**. `usePointerDownOutside`/`useFocusOutside` **signatures** `(handler?, element?, enabled?)` must not change (`Editable/EditableRoot.vue:183-184` calls them).
- **Manager = transport, not logic.** Move only listener ownership, the snapshot, arming, and the touch map into `layerStack.ts`. Port `utils.ts:61-112` (`handlePointerDown`) and `utils.ts:162-180` (`handleFocus`) **branch-for-branch** into subscriber closures — do NOT paraphrase the branch order or the flag-clear points. Keep the component-level branch/present filtering in the `DismissableLayer.vue` callbacks.
- **Dispatch is synchronous.** Non-touch pointer dispatch runs **inside the bubble**, exactly as `utils.ts:103` does today. Do NOT introduce a `nextTick` before dispatch (the `nextTick`s in the repo are the component's `DismissableLayer.vue:126` after emit, and the focus path's double `nextTick` at `utils.ts:166-167` — both stay, neither is a pre-dispatch defer).
- **Shadow-safe targets.** Read the event target via `event.composedPath?.()[0] ?? event.target` and **capture it synchronously** before any `await`. Thread it into `handleAndDispatchCustomEvent(name, handler, detail, target?)` (additive param). This makes #2725's `utils.ts` retargeting patches unnecessary.
- Preserve the #2674 body-pointer-events ordering comments (`DismissableLayer.vue:159-164,176-183`) verbatim.
- Module singleton SSR-safe (no `document` at import; install lazily, `isClient`-gated) and test-isolated: `resetLayerStack()` clears **all** state (both registries, disabled list, branches, touch map + its click listener, arming timers, `originalBodyPointerEvents`, and restores `document.body.style.pointerEvents`).
- Conventional Commits, scope `DismissableLayer`. commitlint enforces.

---

## File Structure

Current relevant files (verified against `v2`, HEAD `47c433a84`):
- `DismissableLayer/DismissableLayer.vue` — `context = reactive({ layersRoot, layersWithOutsidePointerEventsDisabled, originalBodyPointerEvents, branches })` (L57-62); `index` via `Array.from(...).indexOf()` (L99-103); `isPointerEventsEnabled` (L109-115); body-lock `watch` (L165-196, #2674 comments 159-164/176-183); membership `watch` (L203-214); unmount safety-net `watchEffect` (L216-223, runs cleanup on **unmount only** — no reactive deps); Escape via `onKeyStroke('Escape', …)` on **window** (L144-157); branch/present checks in the outside callbacks (L117-142); renders `Primitive` (L226-245).
- `DismissableLayer/utils.ts` — `usePointerDownOutside`: `handlePointerDown` body L61-112 (isLayerExist first → dispatch-vs-cancel fork on `isPointerInside` → flag cleared every path L111; touch `click {once}` re-arm L95-100, cancel L106-110), listener attached deferred via `setTimeout(0)` L126-128; per-instance `handleClickRef` L56; `useFocusOutside`: `handleFocus` body L162-180 (double `nextTick` 166-167; `event.target` reads at :62,:72,:168,:172; focus flag cleared only by `onBlurCapture` L194-199, NOT in `handleFocus`); `isLayerExist` L16-40 (exported + unit-tested); `ownerDocument` captured at setup L52-53 (element still undefined → effectively `globalThis.document`); dead `CONTEXT_UPDATE`/`dispatchUpdate` L12,203-206.
- `DismissableLayerBranch.vue` — imports `context` (L11), `context.branches.add/delete` (L16-21).
- `Editable/EditableRoot.vue` — **has `data-dismissable-layer` (L227)**; calls `usePointerDownOutside`/`useFocusOutside` with the `enabled: isEditing` arg (L183-184); **never** uses Escape/keydown; the `querySelector` fallback in `isLayerExist` (`utils.ts:26-28`) is for a ref pointing above the attributed element, not for Editable.
- `shared/handleAndDispatchCustomEvent.ts` — L11 reads `detail.originalEvent.target` at dispatch time (the stale/null-in-browsers read #2725 flagged; fixed here via the threaded target).
- `packages/core/vite.config.ts` (test block L14-34, jsdom, default `isolate: true` → fresh module registry **per test file**, singleton persists within a file), `packages/core/package.json` (vitest 4.1.8).

Files this plan creates/modifies:
- **Create** `DismissableLayer/layerStack.ts` (+ `layerStack.test.ts`).
- **Modify** `DismissableLayer/utils.ts` (composables become subscribers; `isLayerExist` gains an optional pre-computed-snapshot param, export kept; delete dead code), `DismissableLayer.vue` (registries + drop `onKeyStroke`/`context`), `DismissableLayerBranch.vue` (registerBranch), `shared/handleAndDispatchCustomEvent.ts` (additive `target?` param).
- **Create** `DismissableLayer.listeners.test.ts` (count regressions), `DismissableLayer.bench.ts`; **Modify** `vite.config.ts` (`benchmark.include`), `package.json` (`"bench"`).

---

## Task 1: The stack manager `layerStack.ts` — two registries (TDD, pure DOM)

**Files:**
- Create: `packages/core/src/DismissableLayer/layerStack.ts`, `packages/core/src/DismissableLayer/layerStack.test.ts`

**Interfaces:**
- Produces two **separate** registries (the load-bearing fix — one array cannot represent both lifetimes/populations):
  ```ts
  // Ordered participation stack — PRESENCE-driven (component membership watch).
  // Sole source for Escape routing, indexOfLayer, isTopLayer, pointer-events accounting.
  // Editable never enters this array (it never entered context.layersRoot today).
  export interface StackLayer {
    element: () => HTMLElement | undefined
    isPresent: () => boolean
    disableOutsidePointerEvents: () => boolean
    onEscapeKeyDown?: (event: KeyboardEvent) => void
  }
  export const layers: StackLayer[] // shallowReactive; [0]=bottom, last=top
  export function registerStackLayer(layer: StackLayer): () => void
  export function indexOfLayer(layer: StackLayer): number
  export function isTopLayer(layer: StackLayer): boolean
  export function highestDisabledIndex(): number // for isPointerEventsEnabled

  // Outside-event subscribers — SETUP/enabled-driven (composable watchEffect(enabled)).
  // DismissableLayer: setup lifetime; Editable: isEditing lifetime. Dispatch only.
  // NEVER affects Escape/index/pointer-events accounting.
  export interface OutsideSubscriber {
    armed: boolean
    isPointerInside: boolean
    isFocusInside: boolean
    // Ported verbatim from utils.ts handlePointerDown/handleFocus bodies:
    handlePointerDown?: (event: PointerEvent, ctx: DispatchContext) => void
    handleFocus?: (event: FocusEvent, ctx: DispatchContext) => void
  }
  export interface DispatchContext {
    target: EventTarget | null // getEventTarget(event), captured synchronously
    nodeList: Element[] // one hoisted querySelectorAll('[data-dismissable-layer]')
    layerIndex: (el: Element) => number // built from a Map over nodeList — O(1), not indexOf
    branches: HTMLElement[]
    deferTouch: (sub: OutsideSubscriber, dispatch: () => void) => void
    cancelTouch: (sub: OutsideSubscriber) => void
  }
  export const outsideSubscribers: OutsideSubscriber[]
  export function registerOutsideSubscriber(sub: OutsideSubscriber): () => void

  export const branches: HTMLElement[]
  export function registerBranch(el: HTMLElement): () => void
  export function resetLayerStack(): void // clears ALL state (see Global Constraints)
  ```
- Listener install/teardown: **`pointerdown` + `focusin` on `document`** (bubble phase), **`keydown` on `window`** (matching today's `onKeyStroke` default target — zero observability change vs a document keydown). Install `pointerdown`/`focusin` while `outsideSubscribers` is non-empty; install `keydown` while `layers` is non-empty (so Editable, which adds only outside subscribers, never triggers a keydown listener — exact footprint parity). Teardown each when its driving registry empties.

- [ ] **Step 1: Write the failing manager tests**

```ts
// packages/core/src/DismissableLayer/layerStack.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isTopLayer, layers, outsideSubscribers, registerOutsideSubscriber, registerStackLayer, resetLayerStack } from './layerStack'

afterEach(() => resetLayerStack())

function stackLayer(over = {}) {
  return { element: () => document.body, isPresent: () => true, disableOutsidePointerEvents: () => false, ...over }
}
function subscriber(over = {}) {
  return { armed: true, isPointerInside: false, isFocusInside: false, ...over }
}

describe('layerStack', () => {
  it('installs one pointerdown/focusin while subscribers exist and one keydown while stack layers exist', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const winAdd = vi.spyOn(window, 'addEventListener')
    registerStackLayer(stackLayer())
    registerOutsideSubscriber(subscriber())
    registerOutsideSubscriber(subscriber())
    expect(add.mock.calls.filter(c => c[0] === 'pointerdown')).toHaveLength(1)
    expect(add.mock.calls.filter(c => c[0] === 'focusin')).toHaveLength(1)
    expect(winAdd.mock.calls.filter(c => c[0] === 'keydown')).toHaveLength(1)
    add.mockRestore()
    winAdd.mockRestore()
  })

  it('an Editable-like subscriber (no stack layer) installs NO keydown listener', () => {
    const winAdd = vi.spyOn(window, 'addEventListener')
    registerOutsideSubscriber(subscriber())
    expect(winAdd.mock.calls.filter(c => c[0] === 'keydown')).toHaveLength(0)
    winAdd.mockRestore()
  })

  it('removes the pointerdown/focusin listeners when the last subscriber unregisters', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const off1 = registerOutsideSubscriber(subscriber())
    const off2 = registerOutsideSubscriber(subscriber())
    off1()
    expect(remove.mock.calls.filter(c => c[0] === 'pointerdown')).toHaveLength(0) // one left
    off2()
    expect(remove.mock.calls.filter(c => c[0] === 'pointerdown')).toHaveLength(1)
    remove.mockRestore()
  })

  it('maintains stack order and isTopLayer', () => {
    const a = stackLayer()
    const b = stackLayer()
    registerStackLayer(a)
    registerStackLayer(b)
    expect(layers[0]).toBe(a)
    expect(isTopLayer(b)).toBe(true)
    expect(isTopLayer(a)).toBe(false)
  })

  it('routes Escape only to the top present stack layer', () => {
    const bottom = stackLayer({ onEscapeKeyDown: vi.fn() })
    const top = stackLayer({ onEscapeKeyDown: vi.fn() })
    registerStackLayer(bottom)
    registerStackLayer(top)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(top.onEscapeKeyDown).toHaveBeenCalledOnce()
    expect(bottom.onEscapeKeyDown).not.toHaveBeenCalled()
  })

  it('arms a freshly-registered subscriber a macrotask later', async () => {
    const sub = subscriber({ armed: false })
    registerOutsideSubscriber(sub)
    expect(sub.armed).toBe(false)
    await new Promise(r => setTimeout(r, 0))
    expect(sub.armed).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer/layerStack.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement the manager (transport only)**

Implement per the Interfaces: `shallowReactive` arrays; lazy install (`isClient`-gated) keyed per registry as specified; `handleKeyDown` finds `[...layers].reverse().find(l => l.isPresent())` and calls its `onEscapeKeyDown` (only `event.key === 'Escape'`); `handlePointerDown`/`handleFocusIn` build **one** `DispatchContext` (`target = event.composedPath?.()[0] ?? event.target`, `nodeList = Array.from(doc.querySelectorAll('[data-dismissable-layer]'))`, `layerIndex` from a `Map<Element, number>` over `nodeList`, `branches`), then iterate `[...outsideSubscribers]` (snapshot — dispatch mutates the array) invoking each `sub.handlePointerDown?.(event, ctx)` / `sub.handleFocus?.(event, ctx)` **synchronously**; the touch map is `Map<OutsideSubscriber, () => void>` with one persistent `document` `click` listener active while the map is non-empty (`deferTouch` = `map.set` (replace = re-arm), `cancelTouch` = `map.delete`, on click run all + clear); `registerOutsideSubscriber` sets `armed = false` then `setTimeout(() => sub.armed = true, 0)` and returns an unregister that clears the timer, splices, `cancelTouch`, and tears down listeners if empty; `resetLayerStack()` clears everything incl. the touch map + click listener + `document.body.style.pointerEvents` restore.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer/layerStack.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/DismissableLayer/layerStack.ts packages/core/src/DismissableLayer/layerStack.test.ts
git commit -m "perf(DismissableLayer): add centralized layer stack manager (two registries)"
```

---

## Task 2: Migrate Escape to the stack registry (smallest surface first)

**Files:**
- Modify: `packages/core/src/DismissableLayer/DismissableLayer.vue`

**Interfaces:**
- Consumes: `registerStackLayer`, `isTopLayer`, `indexOfLayer`.
- Produces: Escape dismissal identical to today (top present layer only; respects `defaultPrevented`).

- [ ] **Step 1: Register a `StackLayer` ALONGSIDE the existing Set, route Escape through it**

In `DismissableLayer.vue` setup, build a `StackLayer` whose `onEscapeKeyDown` runs the **current** `onKeyStroke('Escape', …)` body (L144-157) — emit `escapeKeyDown`, and if not `defaultPrevented`, `dismiss`. In the membership `watch` (L203-214), call `registerStackLayer(layer)` **in addition to** `context.layersRoot.add/delete` (do NOT remove the Set yet — `index`/`isPointerEventsEnabled` still read it until Task 5; removing it now makes `-1 >= -1` enable pointer events on every layer). **Delete** the `onKeyStroke('Escape', …)` call (removes one window listener per layer; the shared keydown is on window too, so no observability change).

> Transitional note: during Tasks 2–4 the component briefly holds both the old `context` reactive and the new registries. Intentional — each task migrates one concern with the suite green. The `context` Set is removed in Task 5.

- [ ] **Step 2: Run the DismissableLayer suite + add a stacking test**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer`
Add: two stacked layers → only the top emits `escapeKeyDown`; after dismissing the top, Escape falls through. Existing Escape tests pass unchanged.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/DismissableLayer/DismissableLayer.vue
git commit -m "perf(DismissableLayer): route Escape through the shared stack registry"
```

---

## Task 3: Migrate `useFocusOutside` to a manager subscriber

**Files:**
- Modify: `packages/core/src/DismissableLayer/utils.ts`, `packages/core/src/DismissableLayer/layerStack.ts` (only if the `DispatchContext` needs a field)

**Interfaces:**
- Consumes: `registerOutsideSubscriber`.
- Produces: `useFocusOutside(onFocusOutside?, element?, enabled?)` — **unchanged signature**, still returns `{ onFocusCapture, onBlurCapture }`.

- [ ] **Step 1: Port `handleFocus` into a subscriber closure**

Reimplement `useFocusOutside` to register an `OutsideSubscriber` (in the existing `watchEffect(enabled)`) whose `handleFocus(event, ctx)` is **`utils.ts:162-180` ported verbatim**: keep the double `nextTick` (166-167); read the target from **`ctx.target`** (already the composed, synchronously-captured target — do NOT re-read `event.target` after the awaits); the `event.target && !isFocusInsideDOMTree` gate that today reads `event.target` at both **:168 and :172** now reads `ctx.target`; the `isLayerExist`-equivalent uses `ctx.nodeList`/`ctx.layerIndex`; then `handleAndDispatchCustomEvent(FOCUS_OUTSIDE, onFocusOutside, { originalEvent: event }, ctx.target)`. **Do NOT clear `isFocusInside` in `handleFocus`** — today only `onBlurCapture` clears it (`utils.ts:194-199`); `onFocusCapture` sets it. The returned `onFocusCapture`/`onBlurCapture` write `sub.isFocusInside`.

- [ ] **Step 2: Run focus tests + Editable**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer src/Editable`
Expected: existing focus-outside tests (`DismissableLayer.test.ts:178-193`) and Editable focus tests pass unchanged.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/DismissableLayer/utils.ts packages/core/src/DismissableLayer/layerStack.ts
git commit -m "perf(DismissableLayer): route focusOutside through the shared manager"
```

---

## Task 4: Migrate `usePointerDownOutside` (touch deferral + arming + shadow target)

**Files:**
- Modify: `packages/core/src/DismissableLayer/utils.ts`, `packages/core/src/DismissableLayer/layerStack.ts`, `packages/core/src/shared/handleAndDispatchCustomEvent.ts`

**Interfaces:**
- Consumes: `registerOutsideSubscriber`, `ctx.deferTouch`/`ctx.cancelTouch`.
- Produces: `usePointerDownOutside(onPointerDownOutside?, element?, enabled?)` — unchanged signature, returns `{ onPointerDownCapture }`.

- [ ] **Step 1: Add the threaded target param to `handleAndDispatchCustomEvent`**

`handleAndDispatchCustomEvent(name, handler, detail, target?: EventTarget)` — additive; default `target = detail.originalEvent.target`. Use `target` (not `detail.originalEvent.target`) for the `addEventListener`/`dispatchEvent`. **Why:** for shadow-origin events the original target is nulled post-dispatch in real browsers (spec *clearTargets*) → `null.addEventListener` crash; jsdom masks it by retaining the host. Both dismiss paths pass the synchronously-captured `ctx.target`.

- [ ] **Step 2: Port `handlePointerDown` into a subscriber closure (branch-for-branch)**

Reimplement `usePointerDownOutside` to register an `OutsideSubscriber` whose `handlePointerDown(event, ctx)` is **`utils.ts:61-112` ported verbatim, in the same branch order**: `if (!sub.armed) return`; then the `isLayerExist`-equivalent using `ctx.nodeList`/`ctx.layerIndex` (target = `ctx.target`, reads at both **:62 and :72**) with **early return + flag clear** as today; then the dispatch-vs-cancel fork on `sub.isPointerInside`; for touch (`event.pointerType === 'touch'`) call `ctx.deferTouch(sub, dispatch)` (the manager's shared click listener replaces the per-instance `handleClickRef`), and the cancel branch (today `utils.ts:106-110`) calls `ctx.cancelTouch(sub)`; non-touch dispatches **synchronously** (no `nextTick`): `handleAndDispatchCustomEvent(POINTER_DOWN_OUTSIDE, onPointerDownOutside, { originalEvent: event }, ctx.target)`; clear `sub.isPointerInside` at the end of every path (today `:111`). Delete the per-layer `document.addEventListener('pointerdown', …)` + `setTimeout(0)` wiring (arming now lives in the manager) and the dead `CONTEXT_UPDATE`/`dispatchUpdate` (zero consumers).

- [ ] **Step 3: Keep `isLayerExist` exported; add optional snapshot param**

`isLayerExist(el, target, nodeList?)` — when `nodeList` is passed, skip the internal `querySelectorAll` and use it (the manager hoists one snapshot); default preserves the old signature so `DismissableLayer.test.ts:9,15-21` passes unchanged. Build the `layerIndex` `Map` from `nodeList` so per-subscriber lookups are O(1), not O(n²).

- [ ] **Step 4: Run the full DismissableLayer suite (incl. #2674) + add Editable/touch tests**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer src/Editable`
Add: (a) **Editable-vs-Dialog DOM-order** — Editable in edit mode (it HAS `data-dismissable-layer`, so it appears in the snapshot) + open Dialog: a pointerdown on the Editable dismisses the Dialog iff DOM order says so (today's behavior). (b) touch pointerdown defers to click; a second inside pointerdown before the click cancels only that subscriber's pending dispatch. (c) persistent menu (`unmountOnHide:false`) reopened → immediate outside pointerdown still dismisses (arming-window parity).

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/DismissableLayer/utils.ts packages/core/src/DismissableLayer/layerStack.ts packages/core/src/shared/handleAndDispatchCustomEvent.ts
git commit -m "perf(DismissableLayer): route pointerDownOutside through the shared manager (shadow-safe)"
```

---

## Task 5: Remove the reactive `context`; move branches + body-lock to the manager

**Files:**
- Modify: `packages/core/src/DismissableLayer/DismissableLayer.vue`, `packages/core/src/DismissableLayer/DismissableLayerBranch.vue`, `packages/core/src/DismissableLayer/layerStack.ts`

**Interfaces:**
- Consumes: `layers`, `indexOfLayer`, `highestDisabledIndex`, `branches`, and a shared `originalBodyPointerEvents` field on the manager.
- Produces: `index`/`isPointerEventsEnabled`/`isBodyPointerEventsDisabled` read the manager (array `indexOf`, no `Array.from`); body-lock keeps the exact #2674 formulas + comments; `DismissableLayerBranch` registers via `registerBranch`.

- [ ] **Step 1: Replace `context` reads**

Delete `context = reactive({...})`. `index` → `indexOfLayer(layer)`; `isPointerEventsEnabled` → compares `indexOfLayer(layer) >= highestDisabledIndex()`. Track disabling layers in the manager (a `disableOutsidePointerEvents()` getter on `StackLayer` + a derived highest-index). **Port the body-lock `watch` (L165-196) as a `watch` with explicit sources** (never `watchEffect`, so it does not track membership churn — this is why Risk "reactive granularity" is satisfied), keeping comments 159-164/176-183 and the size-0-after-delete restore. **`originalBodyPointerEvents` MUST be a shared manager field** (strike "keep local": layer A saves the original, A unmounts while disabling layer B is open, B's cleanup restores A's saved value — a component-local copy dies with A). Keep using the layer's `ownerDocument` computed (`DismissableLayer.vue:93-95`) for `body.style`. Port the L216-223 safety-net as an **unmount-only** cleanup (it has no reactive deps; element swaps are handled by the membership watch's `[layerElement]` source).

- [ ] **Step 2: Migrate the Branch**

`DismissableLayerBranch.vue`: replace `import { context }` + `context.branches.add/delete` with `registerBranch(currentElement.value)` on mount / unregister on unmount.

- [ ] **Step 3: Run DismissableLayer + Toast + broad overlay sweep**

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

- [ ] **Step 1: Write count-regression tests (diff before/after mount to be robust)**

```ts
// packages/core/src/DismissableLayer/DismissableLayer.listeners.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetLayerStack } from './layerStack'

beforeEach(() => resetLayerStack())
afterEach(() => resetLayerStack())

describe('DismissableLayer listener consolidation', () => {
  it('adds one document pointerdown/focusin regardless of layer count', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const before = { pd: count(add, 'pointerdown'), fi: count(add, 'focusin') }
    // mount 10 open DismissableLayers via a wrapper fixture
    expect(count(add, 'pointerdown') - before.pd).toBe(1)
    expect(count(add, 'focusin') - before.fi).toBe(1)
    add.mockRestore()
  })
  it('runs querySelectorAll once per outside pointerdown regardless of layer count', () => {
    const qsa = vi.spyOn(document, 'querySelectorAll')
    // mount 5 open layers; clear; dispatch ONE outside pointerdown
    // assert exactly one call for '[data-dismissable-layer]'
    qsa.mockRestore()
  })
  it('removes all shared listeners after every layer unmounts', () => {})
})
// helper: count(spy, kind) = spy.mock.calls.filter(c => c[0] === kind).length
```

Fill fixtures with `@vue/test-utils` `mount` of a wrapper rendering N `DismissableLayer`s. (Note: vitest default `isolate:true` gives a fresh module registry per **file**; the singleton persists **within** a file, so the `beforeEach` reset is required.)

- [ ] **Step 2: Run + commit**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer/DismissableLayer.listeners.test.ts`

```bash
git add packages/core/src/DismissableLayer/DismissableLayer.listeners.test.ts
git commit -m "test(DismissableLayer): assert single shared listener + one query per event"
```

---

## Task 7: Benchmarks (honest measurement)

**Files:**
- Create: `packages/core/src/DismissableLayer/DismissableLayer.bench.ts`
- Modify: `packages/core/vite.config.ts`, `packages/core/package.json`

- [ ] **Step 1: Add bench config + script (self-contained commit)**

`vite.config.ts` test block: `benchmark: { include: ['./**/*.bench.{ts,js}'] }`. `package.json`: `"bench": "vitest bench --run"`. Keep this a self-contained commit so the baseline can be captured on `v2`.

- [ ] **Step 2: Write benchmarks (flush arming timers)**

```ts
// packages/core/src/DismissableLayer/DismissableLayer.bench.ts
import { bench, describe } from 'vitest'
// Each bench mounts real DismissableLayers, then FLUSHES arming (await a macrotask
// or vi.runAllTimers) before dispatching — otherwise pointerdown benches measure
// unarmed no-ops. jsdom benches measure JS-only cost (no layout/paint); the Task 6
// structural counts are the proof, benches are directional.
describe('DismissableLayer', () => {
  bench('mount + unmount 50 stacked layers', () => {})
  bench('100 outside pointerdowns against 20 open (armed) layers', () => {})
  bench('Escape dispatch against 20 open layers', () => {})
})
```

- [ ] **Step 3: Capture before/after (worktree baseline)**

The bench files don't exist on `v2`, so: `git worktree add ../reka-v2-bench v2`, copy the three bench/config files into it (or `git -C ../reka-v2-bench cherry-pick <bench-commit-sha>`), run `pnpm --filter reka-ui bench` in both trees, record numbers in the PR. Remove the worktree after.

- [ ] **Step 4: Parity check — do NOT claim a render-count reduction without proving it on v2 first**

Run the "sibling churn does not re-render an open layer" probe (an `onUpdated` counter **on the layer component itself**, not a slotted child — slot content is parent-owned and won't fire) on **`v2` first**. Under Vue ≥ 3.4 (dev 3.5.17) unchanged computeds don't trigger effects, so this very likely **already passes on v2** — if so, frame it as "render count unchanged (parity)", NOT a reduction, and drop "render count" from the PR narrative. The provable wins are: listener count (Task 6), one `querySelectorAll` per event (Task 6), and O(1) pointer-events accounting replacing the O(n) `Array.from().indexOf()` scans.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/DismissableLayer/DismissableLayer.bench.ts packages/core/vite.config.ts packages/core/package.json
git commit -m "perf(DismissableLayer): add overlay interaction benchmarks"
```

---

## Task 8: (Depends on #2722) Remove the wrapper render instance via `useRender`

**Files:**
- Modify: `packages/core/src/DismissableLayer/DismissableLayer.vue`, `packages/core/src/DismissableLayer/DismissableLayerBranch.vue`

> **Blocked on #2722.** Do not start until `useRender` is merged. Tasks 1–7 land independently.

- [ ] **Step 1: Swap `Primitive` for `useRender`**

Replace `<Primitive :ref="forwardRef" v-bind="...">` with `<component :is="tag" v-bind="renderProps" :ref="elementRef">`, moving the bound attributes (incl. `style.pointerEvents` from `isBodyPointerEventsDisabled`/`isPointerEventsEnabled`) into `useRender`'s `props`/`state`. Removes one component instance per overlay part (measured ~1.6× faster mount on the common path in the #2722 plan).

- [ ] **Step 2: Full suite + consumer sweep**

Run: `pnpm --filter reka-ui exec vitest run src/DismissableLayer` + the Task 5 consumer sweep. Verify `style.pointerEvents` still binds correctly through `renderProps`.

- [ ] **Step 3: Type-check + commit**

```bash
pnpm --filter reka-ui type-check
git add packages/core/src/DismissableLayer/DismissableLayer.vue packages/core/src/DismissableLayer/DismissableLayerBranch.vue
git commit -m "perf(DismissableLayer): render via useRender, dropping the Primitive wrapper"
```

---

## Self-Review

- **Spec coverage:** "single shared listener + one centralized stack manager" → Tasks 1–5; "remove wrapper render overhead via useRender" → Task 8; "measurable reductions" → Task 6 (counts, the real proof) + Task 7 (directional benches). Covered.
- **Semantics preserved:** top-only Escape on window (Task 2); all-qualifying-layers pointer/focus outside via ported closures (Tasks 3–4); synchronous non-touch dispatch (Task 4); per-subscriber touch deferral + arming (Tasks 1, 4); #2674 body-lock as a `watch` with shared `originalBodyPointerEvents` (Task 5); dual ordering (presence for Escape/index, DOM for `isLayerExist`) kept independent; `isLayerExist` export + unit tests intact (Task 4).
- **Shadow-readiness:** composed-target reads + `handleAndDispatchCustomEvent` target threading (Task 4) mean #2725 does not re-patch `utils.ts`.
- **Type consistency:** `StackLayer` vs `OutsideSubscriber` are distinct types with distinct registries; `DispatchContext` is the single object passed to every ported closure.

## Risks / Gotchas

1. **Two populations, two registries** — `layers` (presence-driven; Escape/index/pointer-events) and `outsideSubscribers` (setup-driven; dispatch/arming/touch). Never merge them; Editable joins only `outsideSubscribers`, so it never affects Escape/index (and never installs a keydown listener).
2. **Manager = transport** — port `utils.ts:61-112`/`162-180` branch-for-branch into subscriber closures; keep component-level branch/present filtering in `DismissableLayer.vue`'s callbacks; the manager only owns listeners + snapshot + arming + touch map.
3. **Synchronous dispatch** — non-touch pointer dispatch runs in the bubble; do NOT add a pre-dispatch `nextTick`. The focus path keeps its double `nextTick` (`utils.ts:166-167`) and the component keeps its post-emit `nextTick` (`DismissableLayer.vue:126`).
4. **Editable HAS `data-dismissable-layer`** (`EditableRoot.vue:227`) — it participates in the snapshot and affects other layers' DOM-order checks; the `querySelector` fallback in `isLayerExist` is for the ref-above-element edge, not Editable.
5. **Touch deferral is per-subscriber** — `Map<OutsideSubscriber, dispatch>` + one shared click listener; "layer A cancels, B stays armed" must hold (multi-touch); per-subscriber cleanup on unregister.
6. **`isLayerExist` stays exported** — add an optional `nodeList` param; the test imports it (`:9`). Build an index `Map` to avoid O(n²).
7. **Body-lock is a `watch` with explicit sources** — never `watchEffect`; `originalBodyPointerEvents` is a shared manager field; body mutations use the layer's `ownerDocument`; the L216-223 safety-net ports as unmount-only cleanup. `shallowReactive` array `indexOf`/`.length` reads inside the `index`/`isPointerEventsEnabled` computeds DO track mutations, so the style binding updates when other layers register.
8. **Escape stays on window** — the shared keydown installs on `window` (matching today's `onKeyStroke` default), so nothing that stops propagation at document level is affected.
9. **Render-count is parity, not reduction** — verify on v2 first (Vue ≥ 3.4 skips unchanged-computed effects); do not claim a reduction. `onUpdated` probe goes on the layer, not a slotted child.
10. **SSR + isolation** — lazy `isClient`-gated install; `resetLayerStack()` clears every field incl. the touch click listener + body-style restore; vitest isolates per file (singleton persists within a file → `beforeEach` reset).
11. **Shadow targets** — capture `composedPath()[0]` synchronously (it's `[]` after dispatch); thread into `handleAndDispatchCustomEvent` to avoid the null-target browser crash.
12. **#2722 dependency** — only Task 8 needs `useRender`; land Tasks 1–7 first.

## Execution Handoff

Recommended: **Subagent-Driven** (superpowers:subagent-driven-development). Task 1 (pure manager, two registries) is the foundation; Tasks 2–5 migrate one concern each with the full suite as the gate (highest scrutiny on Task 4's ported branch structure + Task 5's #2674 body-lock/shared-`originalBodyPointerEvents`); Task 6 is the real proof; Task 7 measures honestly; Task 8 waits on #2722. Run the consumer sweep after Tasks 5 and 8. Because the composed-target work lands here, #2725 can drop its `DismissableLayer/utils.ts` patches entirely.
