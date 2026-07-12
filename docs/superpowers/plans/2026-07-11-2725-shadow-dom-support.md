# Full Shadow DOM Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Tracks GitHub issue **#2725** (Phase 2 — Built on the foundation), part of the reka-ui v3 roadmap **#2721**. **Sequenced AFTER #2724** (overlay perf): #2724 rewrites `DismissableLayer/utils.ts` into `layerStack.ts` and bakes the shadow-safe composed-target reads + `handleAndDispatchCustomEvent` target threading in from day one — so **this plan does NOT touch `DismissableLayer/utils.ts`** (that retargeting work is done). If #2724 has not merged, do that first.

**Goal:** Every DOM lookup, active-element read, focus/dismiss listener, per-root style injection, and scroll/focus-guard mutation respects the element's `getRootNode()` / `ownerDocument`, so components work correctly inside shadow roots (web components / micro-frontends / embedded design systems).

**Architecture:** Introduce a small set of shared root-resolution helpers (`getRootNode`, `getOwnerDocument`, `getOwnerWindow`, `getElementByIdFrom`, `getEventTarget`) plus a feature-detected `injectStyle` (adopted stylesheets with a `<style>` fallback). `getElementByIdFrom` is **dual-root by contract** (anchor's root, then owner document) so it keeps finding content that Teleports out of the shadow root. Every affected site already holds an element ref (`useForwardExpose().currentElement`, `triggerElement`, `contentElement`, `layerElement`, `scrollbar`), so the migration is mechanical: swap `document.*` for the anchored helper. Per-root state (focus-guards, scroll-lock, Splitter cursor) is keyed by `Document`/`ShadowRoot` instead of a bare module global. The scope is **shadow-DOM correctness only** — the ~35 benign `window.setTimeout`-class references are explicitly out of scope. Some sites remain browser-only or genuinely unfixable in a shadow root (Task 9 documents them honestly, not silently).

**Tech Stack:** Vue 3, TypeScript, `getRootNode()`/`composedPath()`, `adoptedStyleSheets`/`CSSStyleSheet`, vitest + jsdom 26 (shadow DOM + retargeting supported; `adoptedStyleSheets` NOT — needs a polyfill for the adopted path).

## Global Constraints

- Node ≥ 22, pnpm 10. All commands from repo root.
- Test (one-shot): `pnpm --filter reka-ui exec vitest run <path>` — never `pnpm test` (watch).
- Type-check: `pnpm --filter reka-ui type-check`. Build: `pnpm --filter reka-ui build`. Lint fix: `pnpm lint:fix`.
- **Non-shadow behavior is frozen.** All existing suites must pass unchanged. Public API changes are limited to **additive optional params** (`useFocusGuards(element?)`, `useBodyScrollLock(state, element?)`, `getActiveElement(anchor?)`) — no signature breaks.
- **SSR = client-only helpers, not guarded.** The helpers are NOT internally SSR-guarded (`getRootNode(null)` returns `globalThis.document`, which is `undefined` in Node, so `getElementByIdFrom(null, id)` would throw). The contract is: **callers gate with `isClient`/`watchEffect`** (the existing convention), exactly as the current `document.*` call sites already do. Do not add per-helper `typeof document` guards that mask a mis-timed call — keep the constraint on the caller.
- **`getElementByIdFrom` is dual-root** — anchor's root, then owner document (`getRootNode(anchor).getElementById(id) ?? getOwnerDocument(anchor).getElementById(id)`). Light-DOM behavior is unchanged (anchor's root IS the document); shadow behavior finds both in-root and Teleported-out content. This is the fix for the Combobox/NavigationMenu portal case, not a parenthetical fallback.
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
- **retargeting-sensitive document listeners (excl. DismissableLayer — that's #2724):** `FocusScope/FocusScope.vue:156-164` (+`:227` body fallback; also `handleFocusOut` `relatedTarget` at `:107`), `ScrollArea/ScrollAreaScrollbarImpl.vue:86,89` (wheel), and `contains`-based checks in `Select/SelectContentImpl.vue:163` (`pointerup`), `HoverCard/HoverCardContentImpl.vue`, `Tooltip/TooltipTrigger.vue`. **`DismissableLayer/utils.ts` (`:62,72,168,172` target reads, `isLayerExist`) and `shared/handleAndDispatchCustomEvent.ts` are handled by #2724** — do not touch them here.
- **known browser-only / unfixable-in-shadow (Task 9 documents, does not "fix"):** `HoverCard/HoverCardContentImpl.vue:60` `document.getSelection()` (shadow selections are host-collapsed; `shadowRoot.getSelection` is Chrome-only, absent in jsdom) and `:73-77` `window` `scroll` capture (scroll is `composed:false` — shadow-internal scrollers never reach window); `useHideOthers` (walks `document.body`, and is `import.meta.env.MODE==='test'`-disabled); body-portalled content's cross-boundary aria idrefs; closed shadow roots.
- **anchors already present:** every site holds an element ref (`useForwardExpose().currentElement`, `triggerElement`, `contentElement`, `rootContext.parentElement`, `layerElement`, `scrollbar`). No new plumbing needed.
- **test env:** `packages/core/vitest.setup.ts` (30 lines; no shadow helpers). jsdom 26 supports `attachShadow`, `shadowRoot.getElementById`, `getRootNode`, retargeting, `composedPath`; does NOT implement `adoptedStyleSheets` or `CSSStyleSheet.replaceSync`.

Files this plan creates/modifies (grouped by phase — see tasks):
- **Create** `shared/getRootNode.ts` (+ test), `shared/injectStyle.ts` (+ test, incl. the per-suite polyfill), a shadow test util, `shared/useFocusGuards.test.ts`.
- **Modify** `shared/index.ts`, `shared/getActiveElement.ts`, `shared/useBodyScrollLock.ts`, `shared/useFocusGuards.ts`, the 11 id/label sites, `FocusScope.vue`, `ScrollAreaScrollbarImpl.vue`, the `contains`-based sites (Select/HoverCard/Tooltip), Splitter registry/style, and the focus-guard/scroll-lock callers. **NOT** `DismissableLayer/utils.ts`, `handleAndDispatchCustomEvent.ts`, or `vitest.setup.ts` (DismissableLayer retargeting → #2724; polyfill → `injectStyle.test.ts`).

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
  // Dual-root: the anchor's root first (in-shadow content), then the owner
  // document (content Teleported out to body). Light-DOM: both are the document.
  const inRoot = getRootNode(anchor).getElementById(id) as HTMLElement | null
  if (inRoot)
    return inRoot
  return getOwnerDocument(anchor).getElementById(id) as HTMLElement | null
}

export function getEventTarget<T extends EventTarget = EventTarget>(event: Event): T | null {
  return (event.composedPath?.()[0] ?? event.target) as T | null
}
```

Add exports to `shared/index.ts`. Add a test proving the dual-root fallback: an id that lives in `document.body` (Teleported) is found via a shadow anchor whose own root does NOT contain it.

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
- Modify: `packages/core/src/shared/index.ts`

**Interfaces:**
- Produces:
  ```ts
  import type { RootNode } from './getRootNode'

  export function supportsAdoptedStyleSheets(): boolean // lazy, not a module const
  export function _setAdoptedSupportForTests(value: boolean | undefined): void // test override
  export function injectStyle(root: RootNode, css: string, options?: { nonce?: string }): { update: (css: string) => void, dispose: () => void }
  ```
- Consumes: `RootNode` from Task 1.

> **Do NOT add a global polyfill to `vitest.setup.ts`.** A global adoptedStyleSheets polyfill makes `supportsAdopted` true everywhere, so Task 8's Splitter test (which asserts the **`<style>` fallback** in the shadow root) would fail, and the "permanently kept" Safari fallback would ship untested. Instead: (a) detection is a **lazy function** with a test override, so each test can drive either branch; (b) the polyfill lives **only in `injectStyle.test.ts`** (per-suite), exercising the adopted path there; (c) component tests (Splitter Task 8) run against raw jsdom, which naturally exercises the `<style>` fallback — the branch jsdom can actually assert.

- [ ] **Step 1: Write detection as a lazy function with a test override**

`supportsAdoptedStyleSheets()` evaluates `typeof CSSStyleSheet !== 'undefined' && typeof CSSStyleSheet.prototype.replaceSync === 'function' && typeof document !== 'undefined' && 'adoptedStyleSheets' in document` on each call (memoize behind the test-override so `_setAdoptedSupportForTests(true|false|undefined)` forces/relaxes it). The polyfill in `injectStyle.test.ts` must use an **accessor + per-instance `WeakMap`** for `adoptedStyleSheets` (a plain array on the prototype is shared across all instances until first assignment) and a `replaceSync` that stores raw text.

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

let testOverride: boolean | undefined
export function _setAdoptedSupportForTests(v: boolean | undefined) { testOverride = v }
export function supportsAdoptedStyleSheets(): boolean {
  if (testOverride !== undefined)
    return testOverride
  return typeof CSSStyleSheet !== 'undefined'
    && typeof CSSStyleSheet.prototype.replaceSync === 'function'
    && typeof document !== 'undefined'
    && 'adoptedStyleSheets' in document
}

export function injectStyle(root: RootNode, css: string, options: { nonce?: string } = {}) {
  if (supportsAdoptedStyleSheets()) {
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
  if (options.nonce)
    el.nonce = options.nonce
  el.textContent = css
  const mount = isDoc ? (root as Document).head : root as ShadowRoot
  mount.appendChild(el)
  return { update: (next: string) => { el.textContent = next }, dispose: () => el.remove() }
}
```

The `injectStyle.test.ts` suite drives BOTH branches: install the accessor+WeakMap polyfill and `_setAdoptedSupportForTests(true)` for the adopted-path bookkeeping test; `_setAdoptedSupportForTests(false)` for the `<style>`-fallback test (assert nonce + `<style>` in the shadow root + dispose). Run again → PASS. Add to `shared/index.ts`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/shared/injectStyle.ts packages/core/src/shared/injectStyle.test.ts packages/core/src/shared/index.ts
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

- [ ] **Step 2: Combobox focus containment — TDD (portal matrix)**

`ComboboxRoot` context exposes only `parentElement` (no `contentElement` ref), and `ComboboxPortal` Teleports content to `body` by default — so today shadow-trigger + body-portalled content **works** precisely because `document.getElementById` finds the portalled listbox. A naive shadow-root-only lookup would **regress** this. The dual-root `getElementByIdFrom` (Global Constraints) handles it: `ComboboxInput.vue:90,101` → `getElementByIdFrom(rootContext.parentElement.value, rootContext.contentId)` (finds in-root OR body-portalled), and `:99` `document.activeElement` → `getActiveElement(rootContext.parentElement.value)`. Test **matrix** {trigger in shadow} × {content in-root, content body-portalled} — both must keep the combobox open on inner focus. (Optional cleaner long-term fix: add a `contentElement` ref to Combobox root context; out of scope here.)

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

## Task 5: activeElement + focus retargeting (DismissableLayer excluded — see #2724)

**Files:**
- Modify: `shared/getActiveElement.ts`, `FocusScope/FocusScope.vue`, `ScrollArea/ScrollAreaScrollbarImpl.vue`, and `contains`-based sites in `Select/SelectContentImpl.vue`, `HoverCard/HoverCardContentImpl.vue`, `Tooltip/TooltipTrigger.vue`

> `DismissableLayer/utils.ts` target reads (`:62,72,168,172`) + `handleAndDispatchCustomEvent` are done in **#2724** (`layerStack.ts` uses `getEventTarget` + threads the captured target). Do not touch them here.

**Interfaces:**
- Consumes: `getEventTarget`, `getRootNode`, `getOwnerDocument`, `getActiveElement(anchor?)`.

- [ ] **Step 1: `getActiveElement(anchor?)` — additive optional param**

Add an optional `anchor?: Node | null` param; start from `getOwnerDocument(anchor).activeElement` instead of the bare `document.activeElement`, keeping the existing shadow-descent loop. Existing `getActiveElement.test.ts` (no arg) must pass unchanged. Add a test with a shadow anchor.

- [ ] **Step 2: FocusScope → root node — TDD (document the trade-off; test the Tab/relatedTarget case)**

**Design note (must be in a code comment):** attach `focusin`/`focusout` to `getRootNode(container)` (the ShadowRoot), NOT keep them on `document`. Reason — `handleFocusOut` reads `event.relatedTarget` (`FocusScope.vue:107`), and **`relatedTarget` has no `composedPath()` equivalent**: with a document listener, an intra-scope Tab inside a shadow root sees `relatedTarget` retargeted to the host → `container.contains(relatedTarget)` fails → focus is yanked backward on every Tab. Root-attachment un-retargets it (verified in jsdom). The accepted cost: focusin from light-DOM elements *outside* the host won't reach the listener; that escape-hole is mitigated by the per-root focus guards (Task 7) — **this is why the guards must live in the same root the listeners attach to.**

Then: `FocusScope.vue:156-164` attach to `getRootNode(container)` (fallback `getOwnerDocument`); `:227` `document.body` → `getOwnerDocument(container).body`. Tests (shadow-mounted trap): (a) Tab between two elements *within* the scope does NOT yank focus (the relatedTarget case — the one that actually regresses today); (b) `lastFocusedElementRef` is the inner element, not the host; (c) existing FocusScope suite green.

```bash
git add packages/core/src/shared/getActiveElement.ts packages/core/src/FocusScope/FocusScope.vue
git commit -m "fix(FocusScope): scope focus listeners to the root node for shadow DOM"
```

- [ ] **Step 3: ScrollArea wheel + body mutation — TDD**

Failing shadow test: wheel over a shadow-mounted scrollbar triggers scroll. Then in `ScrollAreaScrollbarImpl.vue:76` use `getEventTarget(event)` for the `scrollbar.value?.contains(...)` check; `:86,89` attach `wheel` to `getOwnerDocument(scrollbar.value)`; `:50-51,68` body mutation → `getOwnerDocument(scrollbar.value).body`. Run → PASS.

```bash
git add packages/core/src/ScrollArea/ScrollAreaScrollbarImpl.vue
git commit -m "fix(ScrollArea): scope wheel listener and body mutation to owner document"
```

- [ ] **Step 4: `contains`-based document-listener sites**

`Select/SelectContentImpl.vue:163` (`content.value?.contains(event.target)` in a document-capture `pointerup`), `HoverCard/HoverCardContentImpl.vue`, `Tooltip/TooltipTrigger.vue`: where a `document` listener's callback does `el.contains(event.target)`, read `getEventTarget(event)` (capture synchronously if any `await` precedes the read); where it attaches to `document`, prefer `getOwnerDocument(<el>.value)`. Run each suite.

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

The current code is NOT a bare module Map — it's a single `createSharedComposable` holding one `ref(Map)`, one `initialOverflow`, one `flush:'sync'` watch, **and `injectConfigProviderContext()` called inside the factory** (`useBodyScrollLock.ts:23`, captured from the first caller's component scope). Target shape: per-Document state `WeakMap<Document, { map: Map<string, boolean>, initialOverflow?: string, stopTouchMove?: () => void }>` keyed by `getOwnerDocument(element)`; route body/head/documentElement and the iOS `touchmove` `useEventListener(document, …)` through that Document; preserve `flush:'sync'`. **Caveat:** `createSharedComposable` disposes its scope when the last subscriber unmounts — verify per-Document teardown doesn't strand another document's lock, and that the `ConfigProvider` inject still resolves (it's read once at factory init). All six callers pass their `currentElement`. Existing `useBodyScrollLock.test.ts` passes unchanged; add two-locks-one-document + restore-order tests.

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
- Produces: `useFocusGuards(element?: MaybeRefOrGetter<HTMLElement | undefined>)` — additive optional param; guards inserted at the edges of `root === document ? document.body : shadowRoot`; refcount per root via `WeakMap<RootNode, number>` instead of module-global `count`; reuse via `root.querySelectorAll('[data-reka-focus-guard]')`; `getOwnerDocument(el).createElement('span')`. **`FocusGuards.vue` mechanism:** it renders only `<slot/>` (no element/Primitive to ref), so it CANNOT gain a template ref cleanly. Keep its no-arg call as **document-body behavior unchanged** (light-DOM default); shadow users get per-root guards by calling the composable directly with an element (Combobox/Popover/Menu/Select already have `currentElement`). Document that the public `FocusGuards` component is light-DOM-scoped.

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

> **Calibration:** `cursor` is an *inherited* property, so a document-level `*{cursor:X!important}` already reaches shadow content that has no explicit cursor rule — piercing only matters for elements with their own author/UA cursor (buttons, links, resizers). And injecting "into every registered root" still won't cover roots the pointer merely travels *over* mid-drag. So the right fix is **belt-and-braces: host document AND every registered shadow root**, and the residual gap (unregistered roots under the pointer) goes in the browser-story note — don't claim full coverage.

- [ ] **Step 1: TDD**

Failing test: start a drag on a shadow-mounted Splitter → assert the cursor CSS is present in the panel's root (in jsdom, the `<style>` fallback appended to the shadow root — this suite runs against raw jsdom, so `supportsAdoptedStyleSheets()` is false and the fallback is exercised); reset removes it; the host document AND two registered roots each get their own sheet. `registry.ts` records `getRootNode(element)` alongside its existing `ownerDocument` map (L42) and passes the root set (incl. the host document) to the style fns (call sites L80,253-259). Then implement.

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

- [ ] **Step 2: Docs note + story + a "known limitations in shadow roots" list**

Document that embedding in a shadow root requires `ConfigProvider`'s `teleportTo` to point **inside** the shadow root (otherwise Dialog/Popover teleport to `body` and escape the root, breaking cross-boundary aria id refs at the AT level — not fixable by root-scoping). Add a Histoire `*.story.vue` with a custom-element wrapper for manual **browser** verification of the jsdom-untestable paths: adopted-stylesheet cursor cascade, `:focus-visible` in shadow trees, native `delegatesFocus` (probe confirmed jsdom ignores it), `shadowRoot.getSelection`. Publish an explicit **"known limitations in shadow roots"** list: closed shadow roots (composedPath returns the host); body-portalled content's cross-boundary aria idrefs; `useHideOthers` (`aria-hidden` from body, test-disabled); `HoverCard` selection containment (`document.getSelection`) and dismiss-on-scroll (scroll is `composed:false`); anything a user Teleports out of the root. If any public props changed, `pnpm --filter reka-ui build` then family-scoped `pnpm docs:gen`.

- [ ] **Step 3: Full suite + type-check + commit**

Run: `pnpm --filter reka-ui exec vitest run` then `pnpm --filter reka-ui type-check`

```bash
git add packages/core/src docs
git commit -m "test(shadow-dom): integration coverage + embedding docs"
```

---

## Self-Review

- **Spec coverage:** "every DOM lookup respects getRootNode/ownerDocument" → Tasks 4–5; "route aria/id queries through the root node" → Task 4 (dual-root); "scope focus-guards & scroll-lock per root" → Tasks 6–7; "adopted stylesheets for injected CSS" → Tasks 2 + 8; "shadow-DOM test harness" → Task 3 + Task 9. Every key file from the issue is addressed EXCEPT `DismissableLayer/utils.ts` (its retargeting is done in #2724 by design — see Sequencing): `useBodyScrollLock`, `useFocusGuards`, `getActiveElement`, `FocusScope.vue`, `Splitter/utils/style.ts`, `ScrollAreaScrollbarImpl.vue`, the getElementById/label sites. Covered.
- **Additive-only API changes:** `getActiveElement(anchor?)`, `useBodyScrollLock(state, element?)`, `useFocusGuards(element?)` — all optional; existing callers/tests unaffected.
- **Type consistency:** `RootNode` (Task 1) is the single type used by `injectStyle` (Task 2), Splitter map (Task 8), and focus-guard `WeakMap` (Task 7). `getEventTarget`/`getElementByIdFrom`/`getOwnerDocument` signatures stable across Tasks 4–8.

## Risks / Gotchas

1. **Sequencing: land AFTER #2724.** #2724 rewrites `DismissableLayer/utils.ts` → `layerStack.ts` with `getEventTarget` + captured-target threading baked in. This plan does NOT touch `utils.ts`/`handleAndDispatchCustomEvent.ts`. Landing #2725 first guarantees a merge conflict in the exact lines #2724 deletes.
2. **jsdom masks the retargeting crash — do NOT trust jsdom green.** After dispatch, `composedPath()` is `[]`; post-`await` `event.target` degrades to the retargeted **host** in jsdom but to **null** in real browsers (spec *clearTargets* for shadow-origin events). Any code reading a retargeted/null target after an `await` (the FocusScope/contains sites here; DismissableLayer in #2724) must capture the composed target **synchronously** and assert on the captured value.
3. **Teleport is the residual limitation, not fully fixable.** Dialog/Popover/Combobox Teleport to `body` by default → content escapes the shadow root; cross-boundary aria idrefs break at the AT level even after root-scoping. Mitigations: dual-root `getElementByIdFrom` (finds portalled content for JS logic), `ConfigProvider teleportTo` inside the root (docs), and the Task 9 limitations list for what stays broken.
4. **adoptedStyleSheets absent in jsdom** — lazy detection + test override (Task 2); polyfill lives in `injectStyle.test.ts` only (a global polyfill would break Task 8's fallback assertion); keep the `<style>` fallback permanently (older Safari). Real cascade = browser story.
5. **SSR = caller-gated, not helper-guarded** — helpers return `globalThis.document` for null anchors; callers gate with `isClient`/`watchEffect` (the existing convention). Do not add per-helper guards that mask mis-timed calls.
6. **`createSharedComposable` scope** — scroll-lock per-`Document` `WeakMap` must keep `flush:'sync'`, survive last-subscriber disposal without stranding other docs' locks, and keep the factory-time `ConfigProvider` inject resolving.
7. **Cross-realm `instanceof`** fails for iframe nodes — use `nodeType`/`host` duck-typing (Task 1).
8. **testing-library queries don't pierce shadow roots** — query via `shadowRoot.querySelector` in shadow tests.
9. **FocusScope root-attachment trade-off** — chosen because `relatedTarget` has no `composedPath` (document listeners break intra-shadow Tab); the escape-hole is covered by per-root guards (Task 7). Test the Tab case, not just focusin.
10. **Out of scope / known-broken** — the ~35 benign `window.setTimeout`-class refs, `getComputedStyle`, `innerWidth`, cross-realm constructors (churn for zero benefit); and the honestly-unfixable set (closed roots, body-portalled idrefs, `useHideOthers`, HoverCard selection/scroll) → Task 9 limitations list, not silent gaps.

## Execution Handoff

Recommended: **Subagent-Driven** (superpowers:subagent-driven-development), **after #2724 merges**. Tasks 1–3 build the shared foundation (helpers + `injectStyle` + harness) and must land first; Tasks 4–8 are independent per-area migrations that can be parallelized (each has its own suite as the gate); Task 9 integrates and documents (incl. the limitations list). Highest-scrutiny: Task 4 (dual-root portal matrix), Task 5 (FocusScope relatedTarget/Tab case), Tasks 6–7 (per-root state keying + createSharedComposable disposal).
