# Full Shadow DOM Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Tracks GitHub issue **#2725** (Phase 2 — Built on the foundation), part of the reka-ui v3 roadmap **#2721**. Independent of #2722/#2724 — can land any time.

**Goal:** Every DOM lookup, active-element read, focus/dismiss listener, per-root style injection, and scroll/focus-guard mutation respects the element's `getRootNode()` / `ownerDocument`, so components work correctly inside shadow roots (web components / micro-frontends / embedded design systems).

**Architecture:** Introduce a small set of shared root-resolution helpers (`getRootNode`, `getOwnerDocument`, `getOwnerWindow`, `getElementByIdFrom`, `getEventTarget`) plus a feature-detected `injectStyle` (adopted stylesheets with a `<style>` fallback). Every affected site already holds an element ref (`useForwardExpose().currentElement`, `triggerElement`, `contentElement`, `layerElement`, `scrollbar`), so the migration is mechanical: swap `document.*` for the anchored helper. Per-root state (focus-guards, scroll-lock, Splitter cursor) is keyed by `Document`/`ShadowRoot` instead of a bare module global. The scope is **shadow-DOM correctness only** — the ~35 benign `window.setTimeout`-class references are explicitly out of scope.

**Tech Stack:** Vue 3, TypeScript, `getRootNode()`/`composedPath()`, `adoptedStyleSheets`/`CSSStyleSheet`, vitest + jsdom 26 (shadow DOM + retargeting supported; `adoptedStyleSheets` NOT — needs a polyfill for the adopted path).

## Global Constraints

- Node ≥ 22, pnpm 10. All commands from repo root.
- Test (one-shot): `pnpm --filter reka-ui exec vitest run <path>` — never `pnpm test` (watch).
- Type-check: `pnpm --filter reka-ui type-check`. Build: `pnpm --filter reka-ui build`. Lint fix: `pnpm lint:fix`.
- **Non-shadow behavior is frozen.** All existing suites must pass unchanged. Public API changes are limited to **additive optional params** (`useFocusGuards(element?)`, `useBodyScrollLock(state, element?)`, `getActiveElement(anchor?)`) — no signature breaks.
- SSR-safe: every helper guards `typeof document === 'undefined'` (`isClient`/`isBrowser`); only call in client paths (existing `watchEffect`/`isClient` convention).
- Feature-detect `adoptedStyleSheets` + `CSSStyleSheet.prototype.replaceSync`; keep the `<style>` fallback **permanently** (older Safari), threading `useNonce`/ConfigProvider `nonce`.
- Cross-realm safe: resolve roots via `nodeType`/`host` duck-typing, NOT `instanceof ShadowRoot`.
- **Out of scope (do not churn):** the ~35 `window.setTimeout`/`setInterval`/`rAF` refs; `window.getComputedStyle`/`innerWidth` (work across roots); cross-realm constructors (`new window.Image()` etc.). `createTreeWalker`/`createElement` `ownerDocument` changes are optional (iframe-only benefit).
- Conventional Commits, scope by area (`feat(shared): …`, `fix(FocusScope): …`). commitlint enforces.

---

## File Structure

Scope (verified against `v2`, paths relative to `packages/core/src`):
- **id/label wiring (11 sites):** `Combobox/ComboboxInput.vue:90,101` + raw `document.activeElement:99`; `NavigationMenu/NavigationMenuItem.vue:62,72`; `NavigationMenu/NavigationMenuTrigger.vue:131`; `Dialog/utils.ts:33,40`; `Drawer/DrawerContentImpl.vue:350`; `RadioGroup/Radio.vue:58`, `Checkbox/CheckboxRoot.vue:136`, `Switch/SwitchRoot.vue:91` (`querySelector('[for=…]')`).
- **activeElement:** `shared/getActiveElement.ts` (already descends shadow roots; always starts at global `document`).
- **per-root mutation:** `shared/useBodyScrollLock.ts` (body/head), `shared/useFocusGuards.ts` (body guards, module-global `count`), `Splitter/utils/style.ts` (head `<style>` cursor), `ScrollArea/ScrollAreaScrollbarImpl.vue:50-51,68` (body).
- **retargeting-sensitive document listeners:** `FocusScope/FocusScope.vue:156-164` (+`:227` body fallback), `DismissableLayer/utils.ts:62,168` (target reads) + `isLayerExist:16-40`, `ScrollArea/ScrollAreaScrollbarImpl.vue:86,89` (wheel), and `contains`-based checks in `Select/SelectContentImpl.vue`, `HoverCard/HoverCardContentImpl.vue`, `Tooltip/TooltipTrigger.vue`.
- **anchors already present:** every site holds an element ref (`useForwardExpose().currentElement`, `triggerElement`, `contentElement`, `rootContext.parentElement`, `layerElement`, `scrollbar`). No new plumbing needed.
- **test env:** `packages/core/vitest.setup.ts` (30 lines; no shadow helpers). jsdom 26 supports `attachShadow`, `shadowRoot.getElementById`, `getRootNode`, retargeting, `composedPath`; does NOT implement `adoptedStyleSheets` or `CSSStyleSheet.replaceSync`.

Files this plan creates/modifies (grouped by phase — see tasks):
- **Create** `shared/getRootNode.ts` (+ test), `shared/injectStyle.ts` (+ test), a shadow test util, `shared/useFocusGuards.test.ts`.
- **Modify** `shared/index.ts`, `packages/core/vitest.setup.ts`, `shared/getActiveElement.ts`, `shared/useBodyScrollLock.ts`, `shared/useFocusGuards.ts`, the 11 id/label sites, the 4 named component files, Splitter registry/style, and the focus-guard/scroll-lock callers.

---

## Task 1: Root-resolution helpers `shared/getRootNode.ts` (TDD)

**Files:**
- Create: `packages/core/src/shared/getRootNode.ts`, `packages/core/src/shared/getRootNode.test.ts`
- Modify: `packages/core/src/shared/index.ts`

**Interfaces:**
- Produces:
  ```ts
  export type RootNode = Document | ShadowRoot
  export function getRootNode(node?: Node | null): RootNode
  export function getOwnerDocument(node?: Node | null): Document
  export function getOwnerWindow(node?: Node | null): Window & typeof globalThis
  export function getElementByIdFrom(anchor: Node | null | undefined, id: string): HTMLElement | null
  export function getEventTarget<T extends EventTarget = EventTarget>(event: Event): T | null
  ```
- Consumes: nothing.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/core/src/shared/getRootNode.test.ts
import { describe, expect, it } from 'vitest'
import { getElementByIdFrom, getEventTarget, getRootNode } from './getRootNode'

function makeShadow() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const shadowRoot = host.attachShadow({ mode: 'open' })
  const inner = document.createElement('div')
  shadowRoot.appendChild(inner)
  return { host, shadowRoot, inner }
}

describe('getRootNode', () => {
  it('returns the document for a regular child', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(getRootNode(el)).toBe(document)
  })
  it('returns the shadow root for a shadow child', () => {
    const { shadowRoot, inner } = makeShadow()
    expect(getRootNode(inner)).toBe(shadowRoot)
  })
  it('falls back to global document for null', () => {
    expect(getRootNode(null)).toBe(document)
  })
})

describe('getElementByIdFrom', () => {
  it('resolves an id inside the same shadow root that document.getElementById cannot see', () => {
    const { shadowRoot, inner } = makeShadow()
    const p = document.createElement('p')
    p.id = 'desc'
    inner.appendChild(p)
    expect(document.getElementById('desc')).toBeNull() // proves the old code broken
    expect(getElementByIdFrom(inner, 'desc')).toBe(shadowRoot.getElementById('desc'))
  })
})

describe('getEventTarget', () => {
  it('returns the deep target for an event crossing a shadow boundary', () => {
    const { host, inner } = makeShadow()
    let captured: EventTarget | null = null
    document.addEventListener('pointerdown', e => (captured = getEventTarget(e)), { once: true })
    inner.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
    expect(captured).toBe(inner)
    expect(captured).not.toBe(host)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter reka-ui exec vitest run src/shared/getRootNode.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helpers**

```ts
// packages/core/src/shared/getRootNode.ts
export type RootNode = Document | ShadowRoot

export function getRootNode(node?: Node | null): RootNode {
  if (!node)
    return globalThis.document
  const root = node.getRootNode()
  // Duck-type (cross-realm safe): Document has DOCUMENT_NODE; ShadowRoot has a host.
  if ((root as RootNode).nodeType === Node.DOCUMENT_NODE || (root as ShadowRoot).host !== undefined)
    return root as RootNode
  return node.ownerDocument ?? globalThis.document // detached node
}

export function getOwnerDocument(node?: Node | null): Document {
  return node?.ownerDocument ?? globalThis.document
}

export function getOwnerWindow(node?: Node | null): Window & typeof globalThis {
  return (getOwnerDocument(node).defaultView ?? globalThis.window) as Window & typeof globalThis
}

export function getElementByIdFrom(anchor: Node | null | undefined, id: string): HTMLElement | null {
  return (getRootNode(anchor).getElementById(id) as HTMLElement | null) ?? null
}

export function getEventTarget<T extends EventTarget = EventTarget>(event: Event): T | null {
  return (event.composedPath?.()[0] ?? event.target) as T | null
}
```

Add exports to `shared/index.ts`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter reka-ui exec vitest run src/shared/getRootNode.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/shared/getRootNode.ts packages/core/src/shared/getRootNode.test.ts packages/core/src/shared/index.ts
git commit -m "feat(shared): add root-node resolution helpers for shadow DOM"
```

---

## Task 2: `injectStyle` helper + jsdom polyfill (TDD)

**Files:**
- Create: `packages/core/src/shared/injectStyle.ts`, `packages/core/src/shared/injectStyle.test.ts`
- Modify: `packages/core/src/shared/index.ts`, `packages/core/vitest.setup.ts`

**Interfaces:**
- Produces:
  ```ts
  import type { RootNode } from './getRootNode'

  export function injectStyle(root: RootNode, css: string, nonce?: string): { update: (css: string) => void, dispose: () => void }
  ```
- Consumes: `RootNode` from Task 1.

- [ ] **Step 1: Add a minimal `adoptedStyleSheets` polyfill to `vitest.setup.ts`**

Define `adoptedStyleSheets` as a plain array property on `Document.prototype` and `ShadowRoot.prototype`, and `replaceSync`/`replace` on `CSSStyleSheet.prototype` storing raw text — so the adopted path is exercised and its bookkeeping (sheet added/removed) is assertable. Document that real cascade behavior needs a browser.

- [ ] **Step 2: Write the failing tests**

```ts
// packages/core/src/shared/injectStyle.test.ts
import { describe, expect, it } from 'vitest'
import { injectStyle } from './injectStyle'

describe('injectStyle', () => {
  it('injects and disposes a style into a document', () => {
    const handle = injectStyle(document, '*{cursor:grabbing!important}')
    // with the jsdom polyfill this uses adoptedStyleSheets; assert bookkeeping
    expect(document.adoptedStyleSheets.length).toBeGreaterThan(0)
    handle.dispose()
    expect(document.adoptedStyleSheets.length).toBe(0)
  })
  it('injects into a shadow root independently of the document', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const sr = host.attachShadow({ mode: 'open' })
    const handle = injectStyle(sr, '*{cursor:col-resize!important}')
    expect(sr.adoptedStyleSheets.length).toBe(1)
    expect(document.adoptedStyleSheets.length).toBe(0)
    handle.dispose()
  })
  it('update() replaces the css', () => {
    const handle = injectStyle(document, 'a{}')
    handle.update('b{}')
    handle.dispose()
  })
})
```

- [ ] **Step 3: Run to verify it fails, then implement**

Run: `pnpm --filter reka-ui exec vitest run src/shared/injectStyle.test.ts` → FAIL.

```ts
// packages/core/src/shared/injectStyle.ts
import type { RootNode } from './getRootNode'

const supportsAdopted = typeof CSSStyleSheet !== 'undefined'
  && typeof CSSStyleSheet.prototype.replaceSync === 'function'
  && typeof document !== 'undefined'
  && 'adoptedStyleSheets' in document

export function injectStyle(root: RootNode, css: string, nonce?: string) {
  if (supportsAdopted) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(css)
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
    return {
      update: (next: string) => sheet.replaceSync(next),
      dispose: () => { root.adoptedStyleSheets = root.adoptedStyleSheets.filter(s => s !== sheet) },
    }
  }
  const isDoc = root.nodeType === Node.DOCUMENT_NODE
  const doc = isDoc ? root as Document : (root as ShadowRoot).ownerDocument
  const el = doc.createElement('style')
  if (nonce)
    el.nonce = nonce
  el.textContent = css
  const mount = isDoc ? (root as Document).head : root as ShadowRoot
  mount.appendChild(el)
  return { update: (next: string) => { el.textContent = next }, dispose: () => el.remove() }
}
```

Run again → PASS. Add to `shared/index.ts`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/shared/injectStyle.ts packages/core/src/shared/injectStyle.test.ts packages/core/src/shared/index.ts packages/core/vitest.setup.ts
git commit -m "feat(shared): add root-scoped injectStyle with adoptedStyleSheets + fallback"
```

---

## Task 3: Shadow-DOM test harness

**Files:**
- Create: `packages/core/src/shared/test/shadowDom.ts` (or colocate near existing test utils)

**Interfaces:**
- Produces: `createShadowHost(): { host, shadowRoot, mountTarget, cleanup }`.

- [ ] **Step 1: Write the harness**

```ts
// packages/core/src/shared/test/shadowDom.ts
export function createShadowHost() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const shadowRoot = host.attachShadow({ mode: 'open' })
  const mountTarget = document.createElement('div')
  shadowRoot.appendChild(mountTarget)
  return { host, shadowRoot, mountTarget, cleanup: () => host.remove() }
}
```

> Usage: `@testing-library/vue`'s `render(Component, { container: mountTarget })` mounts inside the shadow root. Queries must go through `shadowRoot.querySelector` — testing-library queries do NOT pierce shadow roots.

- [ ] **Step 2: Smoke test + commit**

Add a trivial test that mounts a `<div>` into `mountTarget` and asserts `getRootNode(el) === shadowRoot`. Run it.

```bash
git add packages/core/src/shared/test/shadowDom.ts
git commit -m "test(shared): add shadow-DOM mount harness"
```

---

## Task 4: Route id + label lookups through the root node

**Files:**
- Modify: `Dialog/utils.ts`, `Drawer/DrawerContentImpl.vue`, `Combobox/ComboboxInput.vue`, `NavigationMenu/NavigationMenuItem.vue`, `NavigationMenu/NavigationMenuTrigger.vue`, `RadioGroup/Radio.vue`, `Checkbox/CheckboxRoot.vue`, `Switch/SwitchRoot.vue`

**Interfaces:**
- Consumes: `getElementByIdFrom`, `getRootNode`, `getActiveElement` (Task 5).

- [ ] **Step 1: Dev-warning sites first (Dialog + Drawer) — TDD**

Write a failing shadow test: mount `DialogContent` with a `DialogTitle` inside a shadow root; assert `console.warn` is NOT called with the missing-title message. Then in `Dialog/utils.ts:33,40` replace `document.getElementById(titleId/descriptionId)` with `getElementByIdFrom(contentElement.value, id)` (the `contentElement` ref is already a param). Same for `Drawer/DrawerContentImpl.vue:350`. Run → PASS. Also confirm the existing non-shadow warning tests still pass.

```bash
git add packages/core/src/Dialog/utils.ts packages/core/src/Drawer/DrawerContentImpl.vue
git commit -m "fix(Dialog): resolve title/description ids through the root node"
```

- [ ] **Step 2: Combobox focus containment — TDD**

Failing shadow test: open a Combobox in a shadow root, move focus into its content, assert it stays open. Then in `ComboboxInput.vue:90,101` swap `document.getElementById(rootContext.contentId)` → `getElementByIdFrom(rootContext.parentElement.value, rootContext.contentId)`, and `:99` `document.activeElement` → `getActiveElement(rootContext.parentElement.value)`. (Note the teleport caveat in Risks — content may live in `document`, so anchor resolution must also find teleported content; if content teleports to `body`, keep a document fallback.) Run → PASS.

```bash
git add packages/core/src/Combobox/ComboboxInput.vue
git commit -m "fix(Combobox): resolve content id and active element through the root node"
```

- [ ] **Step 3: NavigationMenu id lookups**

`NavigationMenuItem.vue:62,72` and `NavigationMenuTrigger.vue:131` → `getElementByIdFrom(<anchor>, contentId)` using the trigger element ref already in scope. Run `pnpm --filter reka-ui exec vitest run src/NavigationMenu`.

```bash
git add packages/core/src/NavigationMenu/NavigationMenuItem.vue packages/core/src/NavigationMenu/NavigationMenuTrigger.vue
git commit -m "fix(NavigationMenu): resolve content ids through the root node"
```

- [ ] **Step 4: Label `[for=…]` lookups**

`RadioGroup/Radio.vue:58`, `Checkbox/CheckboxRoot.vue:136`, `Switch/SwitchRoot.vue:91` → `getRootNode(<el>.value)?.querySelector('[for="' + props.id + '"]')` using the element ref already in the same expression. Run the three suites.

```bash
git add packages/core/src/RadioGroup/Radio.vue packages/core/src/Checkbox/CheckboxRoot.vue packages/core/src/Switch/SwitchRoot.vue
git commit -m "fix(RadioGroup,Checkbox,Switch): resolve label [for] through the root node"
```

---

## Task 5: activeElement + focus/dismiss retargeting

**Files:**
- Modify: `shared/getActiveElement.ts`, `FocusScope/FocusScope.vue`, `DismissableLayer/utils.ts`, `ScrollArea/ScrollAreaScrollbarImpl.vue`, and `contains`-based sites in `Select/SelectContentImpl.vue`, `HoverCard/HoverCardContentImpl.vue`, `Tooltip/TooltipTrigger.vue`

**Interfaces:**
- Consumes: `getEventTarget`, `getRootNode`, `getOwnerDocument`, `getActiveElement(anchor?)`.

- [ ] **Step 1: `getActiveElement(anchor?)` — additive optional param**

Add an optional `anchor?: Node | null` param; start from `getOwnerDocument(anchor).activeElement` instead of the bare `document.activeElement`, keeping the existing shadow-descent loop. Existing `getActiveElement.test.ts` (no arg) must pass unchanged. Add a test with a shadow anchor.

- [ ] **Step 2: FocusScope listeners → root node — TDD**

Failing shadow test: mount a trapping `FocusScope` (e.g. a Dialog) in a shadow root, tab within it, assert `lastFocusedElementRef` is the inner element (NOT the host) and focus stays trapped. Then in `FocusScope.vue:156-164` attach `focusin`/`focusout` to `getRootNode(container)` (ShadowRoot is an EventTarget; targets are un-retargeted there) — falling back to `getOwnerDocument`. Also read the effective target via `getEventTarget(event)` at the `container.contains(...)` checks (L99,124). `:227` `document.body` → `getOwnerDocument(container).body`. Run → PASS + existing FocusScope suite green.

```bash
git add packages/core/src/shared/getActiveElement.ts packages/core/src/FocusScope/FocusScope.vue
git commit -m "fix(FocusScope): scope focus listeners to the root node for shadow DOM"
```

- [ ] **Step 3: DismissableLayer target reads — TDD**

Failing shadow test: mount an open dismissable layer (Popover) in a shadow root; `pointerdown` on inner content; assert it does NOT dismiss; `pointerdown` outside → dismisses. Then in `DismissableLayer/utils.ts:62,168` read the target via `const target = getEventTarget(event)` (capture synchronously, BEFORE the `await nextTick()` at L166-167). Resolve `ownerDocument` lazily inside the handler/`watchEffect` (currently captured once at L52-53 before the ref populates). For `isLayerExist` ordering (L31 `querySelectorAll`), keep DOM-order semantics but note it can't see cross-root layers — acceptable for single-root parity; document the limitation. Run → PASS.

> If #2724 (overlay perf) has landed, apply these changes inside `layerStack.ts` instead — coordinate to avoid conflicts.

```bash
git add packages/core/src/DismissableLayer/utils.ts
git commit -m "fix(DismissableLayer): use composed event target for shadow DOM"
```

- [ ] **Step 4: ScrollArea wheel + body mutation — TDD**

Failing shadow test: wheel over a shadow-mounted scrollbar triggers scroll. Then in `ScrollAreaScrollbarImpl.vue:76` use `getEventTarget(event)` for the `scrollbar.value?.contains(...)` check; `:86,89` attach `wheel` to `getOwnerDocument(scrollbar.value)`; `:50-51,68` body mutation → `getOwnerDocument(scrollbar.value).body`. Run → PASS.

```bash
git add packages/core/src/ScrollArea/ScrollAreaScrollbarImpl.vue
git commit -m "fix(ScrollArea): scope wheel listener and body mutation to owner document"
```

- [ ] **Step 5: `contains`-based document-listener sites**

`Select/SelectContentImpl.vue`, `HoverCard/HoverCardContentImpl.vue`, `Tooltip/TooltipTrigger.vue`: where a `document` listener's callback does `el.contains(event.target)`, read `getEventTarget(event)`; where it attaches to `document`, prefer `getOwnerDocument(<el>.value)`. Run each suite.

```bash
git add packages/core/src/Select/SelectContentImpl.vue packages/core/src/HoverCard/HoverCardContentImpl.vue packages/core/src/Tooltip/TooltipTrigger.vue
git commit -m "fix(Select,HoverCard,Tooltip): use composed target for containment checks"
```

---

## Task 6: Per-root scroll-lock

**Files:**
- Modify: `shared/useBodyScrollLock.ts`; callers `Dialog/DialogOverlayImpl.vue`, `Drawer/DrawerOverlayImpl.vue`, `Combobox/ComboboxContentImpl.vue`, `Popover/PopoverContentModal.vue`, `Menu/MenuContentImpl.vue`, `Select/SelectContentImpl.vue`
- Modify: `shared/useBodyScrollLock.test.ts`

**Interfaces:**
- Produces: `useBodyScrollLock(initialState?, element?)` — additive optional `element` param; all `document.body`/`documentElement`/iOS `touchmove` operations resolve through `getOwnerDocument(element)`; shared state keyed `WeakMap<Document, LockState>` instead of a bare module `Map`.

- [ ] **Step 1: Migrate + keep tests green**

Key the `createSharedComposable` state by `getOwnerDocument(element)`; route body/head/documentElement and the iOS `touchmove` `useEventListener(document, …)` through that Document. Preserve `flush: 'sync'` semantics. All six callers pass their `currentElement`. Existing `useBodyScrollLock.test.ts` must pass unchanged; add a test asserting two locks in one document + correct restore order.

> Note: locking `document.body` is *correct* for a shadow child (a shadow root has no body; scrolling is owned by the host document). This task is really multi-document hardening + removing bare globals; the shadow benefit is derived-document correctness.

- [ ] **Step 2: Run + commit**

Run: `pnpm --filter reka-ui exec vitest run src/shared/useBodyScrollLock.test.ts src/Dialog src/Drawer src/Combobox src/Popover src/Menu src/Select`

```bash
git add packages/core/src/shared/useBodyScrollLock.ts packages/core/src/shared/useBodyScrollLock.test.ts packages/core/src/Dialog/DialogOverlayImpl.vue packages/core/src/Drawer/DrawerOverlayImpl.vue packages/core/src/Combobox/ComboboxContentImpl.vue packages/core/src/Popover/PopoverContentModal.vue packages/core/src/Menu/MenuContentImpl.vue packages/core/src/Select/SelectContentImpl.vue
git commit -m "fix(shared): key body scroll lock per owner document"
```

---

## Task 7: Per-root focus guards

**Files:**
- Modify: `shared/useFocusGuards.ts`; callers `FocusGuards/FocusGuards.vue`, `Combobox/ComboboxContentImpl.vue`, `Popover/PopoverContentImpl.vue`, `Menu/MenuContentImpl.vue`, `Select/SelectContentImpl.vue`
- Create: `shared/useFocusGuards.test.ts`

**Interfaces:**
- Produces: `useFocusGuards(element?: MaybeRefOrGetter<HTMLElement | undefined>)` — additive optional param; guards inserted at the edges of `root === document ? document.body : shadowRoot`; refcount per root via `WeakMap<RootNode, number>` instead of module-global `count`; reuse via `root.querySelectorAll('[data-reka-focus-guard]')`; `getOwnerDocument(el).createElement('span')`. `FocusGuards.vue` keeps its no-arg public API (gains an internal ref).

- [ ] **Step 1: TDD**

Failing test: mounting a guard-consumer inside a shadow root creates exactly 2 `[data-reka-focus-guard]` elements as the first/last children of the **shadow root** (not `document.body`), refcounted across two consumers, removed on last unmount; `document.body` guards untouched. Then implement the per-root refactor.

- [ ] **Step 2: Run + commit**

Run: `pnpm --filter reka-ui exec vitest run src/shared/useFocusGuards.test.ts src/FocusGuards src/Combobox src/Popover src/Menu src/Select`

```bash
git add packages/core/src/shared/useFocusGuards.ts packages/core/src/shared/useFocusGuards.test.ts packages/core/src/FocusGuards/FocusGuards.vue packages/core/src/Combobox/ComboboxContentImpl.vue packages/core/src/Popover/PopoverContentImpl.vue packages/core/src/Menu/MenuContentImpl.vue packages/core/src/Select/SelectContentImpl.vue
git commit -m "fix(shared): scope focus guards per root node for shadow DOM"
```

---

## Task 8: Splitter cursor via adopted stylesheets (per-root)

**Files:**
- Modify: `Splitter/utils/style.ts`, `Splitter/utils/registry.ts`

**Interfaces:**
- Consumes: `injectStyle`, `getRootNode`.
- Produces: `setGlobalCursorStyle`/`resetGlobalCursorStyle` inject into every registered root (`Map<RootNode, ReturnType<typeof injectStyle>>`) instead of a single module-global `document.head` `<style>`.

- [ ] **Step 1: TDD**

Failing test: start a drag on a shadow-mounted Splitter → assert the cursor CSS is present in the panel's root (in jsdom, the `<style>` fallback appended to the shadow root); reset removes it; two roots get independent sheets. `registry.ts` records `getRootNode(element)` alongside its existing `ownerDocument` map (L42) and passes the root set to the style fns (call sites L80,253-259). Then implement.

- [ ] **Step 2: Run + commit**

Run: `pnpm --filter reka-ui exec vitest run src/Splitter`

```bash
git add packages/core/src/Splitter/utils/style.ts packages/core/src/Splitter/utils/registry.ts
git commit -m "fix(Splitter): inject drag cursor per root via adopted stylesheets"
```

---

## Task 9: Integration tests + docs

**Files:**
- Create: shadow-root integration tests for Dialog (or Popover), NavigationMenu, Combobox, DismissableLayer
- Modify: docs (ConfigProvider `teleportTo` note); Histoire story for browser verification

- [ ] **Step 1: Integration tests inside a real shadow root**

Using `createShadowHost()`, mount each component into the shadow root and assert the previously-broken behavior now works (Dialog: no false title warning + inside pointerdown doesn't dismiss; NavigationMenu: content entry/exit focus; Combobox: stays open on inside focus; DismissableLayer: inside vs outside dismissal). Query via `shadowRoot.querySelector`.

- [ ] **Step 2: Docs note + story**

Document that embedding in a shadow root requires `ConfigProvider`'s `teleportTo` to point **inside** the shadow root (otherwise Dialog/Popover teleport to `body` and escape the root, breaking cross-boundary aria id refs). Add a Histoire `*.story.vue` with a custom-element wrapper for manual browser verification of: adopted-stylesheet cursor cascade, `:focus-visible` in shadow trees, native `delegatesFocus`. If any public props changed, run `pnpm --filter reka-ui build` then family-scoped `pnpm docs:gen` (avoid blanket regen — vue-component-meta v3 regresses generic SFC params).

- [ ] **Step 3: Full suite + type-check + commit**

Run: `pnpm --filter reka-ui exec vitest run` then `pnpm --filter reka-ui type-check`

```bash
git add packages/core/src docs
git commit -m "test(shadow-dom): integration coverage + embedding docs"
```

---

## Self-Review

- **Spec coverage:** "every DOM lookup respects getRootNode/ownerDocument" → Tasks 4–5; "route aria/id queries through the root node" → Task 4; "scope focus-guards & scroll-lock per root" → Tasks 6–7; "adopted stylesheets for injected CSS" → Tasks 2 + 8; "shadow-DOM test harness" → Task 3 + Task 9. Every key file from the issue (`useBodyScrollLock`, `useFocusGuards`, `getActiveElement`, `FocusScope.vue`, `DismissableLayer/utils.ts`, `Splitter/utils/style.ts`, `ScrollAreaScrollbarImpl.vue`, the getElementById sites) is addressed. Covered.
- **Additive-only API changes:** `getActiveElement(anchor?)`, `useBodyScrollLock(state, element?)`, `useFocusGuards(element?)` — all optional; existing callers/tests unaffected.
- **Type consistency:** `RootNode` (Task 1) is the single type used by `injectStyle` (Task 2), Splitter map (Task 8), and focus-guard `WeakMap` (Task 7). `getEventTarget`/`getElementByIdFrom`/`getOwnerDocument` signatures stable across Tasks 4–8.

## Risks / Gotchas

1. **jsdom has no `adoptedStyleSheets`/`replaceSync`** — feature-detect; unit tests cover the `<style>` fallback; the polyfill (Task 2 Step 1) only asserts bookkeeping. Real cascade = browser-only (Histoire story). Keep the fallback permanently (older Safari).
2. **Event retargeting is the subtle killer**, not `getElementById`: `composedPath()[0]` gives the deep target for **open** roots (closed roots stay broken — out of scope). Read `composedPath()` **synchronously** — `useFocusOutside` awaits `nextTick` before reading `event.target`, so capture the deep target first.
3. **`DismissableLayer/utils.ts:52-53` resolves `ownerDocument` once, non-reactively, before the ref populates** — resolve lazily inside handlers or it silently keeps `globalThis.document`.
4. **Teleport** — Dialog/Popover teleport to `body` by default, so portalled content escapes the shadow root and cross-boundary aria id refs genuinely break at the AT level. Fix + docs: `ConfigProvider teleportTo` inside the root; root-scoped `getElementByIdFrom` anchored on the *trigger* won't find content that teleported out — anchor such lookups on the *content* element or fall back to searching both the anchor's root and the document (Combobox, Task 4 Step 2).
5. **SSR** — every helper guards `typeof document === 'undefined'`; only call in client paths (`isClient`/`watchEffect`).
6. **`createSharedComposable` scope** — scroll-lock shared state → `WeakMap<Document, …>` must keep `flush: 'sync'` and existing tests green.
7. **Cross-realm `instanceof`** fails for iframe nodes — use `nodeType`/`host` duck-typing (Task 1).
8. **testing-library queries don't pierce shadow roots** — query via `shadowRoot.querySelector` in shadow tests.
9. **Out of scope** — do not touch the ~35 benign `window.setTimeout`-class refs, `getComputedStyle`, `innerWidth`, or cross-realm constructors; scoping them churns the diff for zero shadow-DOM benefit. `useHideOthers` (`aria-hidden` from `document.body`) is a flagged follow-up.
10. **Coordinate with #2724** — if the overlay perf overhaul lands first, apply Task 5 Step 3's DismissableLayer target changes inside `layerStack.ts` instead of `utils.ts`.

## Execution Handoff

Recommended: **Subagent-Driven** (superpowers:subagent-driven-development). Tasks 1–3 build the shared foundation (helpers + `injectStyle` + harness) and must land first; Tasks 4–8 are independent per-area migrations that can be parallelized across subagents (each has its own suite as the gate); Task 9 integrates and documents. The highest-scrutiny items are Task 5 (retargeting correctness) and Tasks 6–7 (per-root state keying).
