# POC: headless composables for an OVERLAY family (Menu) — #2723

> **Status: proof-of-concept, throwaway branch `poc-2723-menu-composable`.** Not a
> parity-gated production PR. Purpose: test whether the `useX()` pattern (validated
> on Switch + Tabs) extends to an overlay family, and produce the findings that
> should shape the deferred overlay contract (**joint with #2724**).

## TL;DR

The pattern extends — but overlays **bend two axioms** from the Switch/Tabs recipe,
and the recipe's stated reason for deferring overlays ("overlay logic lives in
Content-part wrappers") turns out to be **only ~half true**. The wrappers are a thin
shell; the overlay *brain* (typeahead, arrow-nav, the pointer-grace machine,
highlight ownership) is plain state+handlers and **extracts cleanly**. That reframe
is the most useful input to #2724.

## What was built

All on branch `poc-2723-menu-composable` (off `v3`). `packages/core/src/Menu/useMenu.ts`:

1. **`useMenuRoot()`** — the state-only overlay root. Renders no attrs, so **no
   `PartSurface`**; returns `{ open, onOpenChange, onClose, menuContext, menuRootContext }`
   — the two context objects the SFC provides verbatim. `MenuRoot.vue` now composes it.
2. **`getMenuItemBaseSurface(contentContext, { disabled, currentElement })`** — the
   attr-bearing item render surface (role/tabindex/aria-disabled + the
   pointermove/leave/focus/blur hover-highlight). `MenuItemImpl.vue` composes it.
3. **`getMenuItemSelectSurface(rootContext, { disabled, currentElement, onSelect, searchRef })`**
   — the select protocol (click/pointerdown/pointerup/keydown + close-on-select).
   `MenuItem.vue` composes it.

**Verification:** `Menu` + `DropdownMenu` + `ContextMenu` suites (the compatibility
oracle for these SFCs) **37/37 green**; full suite **2028 green**; `type-check`
clean; **14** POC unit tests for the three shapes.

## Findings — the questions overlays force

### 1. Overlay-root contract: `{ state, context }`, no surface
`useMenuRoot()` returns state + the context objects, no `PartSurface`. **The family
is not surface-free — only the root is.** `DropdownMenuTrigger`/`Content` have real
surfaces; the surfaces just begin one level below the root. Recipe addition (one line):

> *Overlay roots are state-only (`{ state, context }`, no surface); positioning
> (`PopperRoot`) and portal stay wrappers, so a standalone overlay `useX()` yields
> the state machine and the trigger/item surfaces but not placement.*

The two-context shape (`MenuContext` keyed `['MenuRoot','MenuSub']` + `MenuRootContext`)
is reused by `MenuSub` — a future `useMenuSub()` returns a `MenuContext`-shaped
object, so the contract is symmetric.

### 2. HEADLINE: the item builder is a context-SCOPED FACTORY, not a pure builder
Tabs' per-item builders are **pure, idempotent derivations** of `(context, value)` —
safe to call many times. `getMenuItemBaseSurface` **cannot** be: it creates
per-instance state (`isFocused`) and closes over the item's own `currentElement`
(the highlight identity check + pointer handlers compare against it). So it must be
called **exactly once per item instance**, and callers pass an element ref they
populate after mount.

> **The "context-pure builder" axiom does not survive contact with overlays.**
> Overlay item builders are *context-scoped factories*: `state`/`props` computeds
> stay pure derivations, but the factory itself instantiates state. If both the
> standalone `useMenu().getItemSurface` path and the SFC inject-and-call path
> instantiated it, you'd get two divergent `isFocused` states — so memoize one
> factory call per instance.

### 3. The select protocol moves — as a callback channel
`MenuItem`'s close-on-select is **not** a DOM dispatch — it builds
`new CustomEvent(ITEM_SELECT, { cancelable: true })` as a cancelable **token**, emits
it, `await nextTick()`, and closes unless `defaultPrevented`. That whole flow lives
in the composable behind an **`onSelect: (event) => void`** option; the SFC passes
`e => emits('select', e)`. `onSelect` stays a callback — it is never a merged DOM
listener. The async `defaultPrevented`-after-`nextTick` veto survives `mergeProps`
binding as long as surface handlers come first in the merge.

### 4. base + variant layering (so SubTrigger can reuse)
The SFC split (`MenuItemImpl` = render/highlight; `MenuItem` = select) maps to two
builders. **Base** (`getMenuItemBaseSurface`) is what every item variant renders
through, so `MenuSubTrigger`/`MenuCheckboxItem`/`MenuRadioItem` can reuse it and add
their own layer. Not layering the base would strand SubTrigger.

### 5. What CANNOT move (stays wrapper/SFC)
- **`CollectionItem` registration** — vnode-bound provide/inject; the `<CollectionItem>`
  wrapper stays in the SFC. The composable documents it as a required host.
- **`RovingFocusGroup.getItems()`** — a template-instance-ref call (typeahead
  candidates); a standalone `useMenuContent()` must **accept an injected `getItems`**.
- **The pointer-grace machine** — CAN move, but only into a **content** composable,
  never the item's. Items already consume it purely via the `onItemEnter`/`onItemLeave`/
  `onTriggerLeave` closure trio on `MenuContentContext` — that trio IS the contract,
  keep it verbatim. It's pinned near the DOM only by lazy `getBoundingClientRect()`/
  `dataset.side` reads (SSR-safe as-is).
- **`highlightedElement` is an `HTMLElement`** — the stale-leave guard, `isHighlighted`,
  and arrow-nav all depend on **element identity**. Do NOT normalize it to an id/index
  in a refactor — that's a behavior rewrite.
- **Mount-lifecycle composables** (`useBodyScrollLock`, `useFocusGuards`,
  `useIsUsingKeyboard`) — must run inside the mounted content/root, so an overlay
  `useX()` is **not callable outside `setup()`** (unlike Switch/Tabs). Expected for
  overlays; test in a mount harness.

### 6. Two recipe amendments overlays require
- **Functional `data-*` selectors are exempt from the no-`data-*` rule.**
  `data-reka-menu-content` (submenu-scoping `closest()` check), `data-reka-collection-item`,
  and `[data-disabled]` (read by `useArrowNavigation`'s selector) are *functional
  selectors*, not semantic state — they belong in `props`, not routed through
  `stateToDataAttrs`. Silently dropping one degrades UX with no test failure.
- **Overlay item builders are context-scoped factories** (finding #2) — the recipe's
  "pure builder" wording needs the factory caveat for overlays.

## The reframe for #2724 (most valuable output)

The deferral said "overlay logic lives in Content-part component wrappers." Reality
for Menu: `MenuContentImpl` composes **4** wrappers (FocusScope/DismissableLayer/
RovingFocusGroup/PopperContent), but the **majority** of its 405 lines — typeahead,
`onKeydownNavigation`, `handleKeyDown`, `handleBlur`, the pointer-direction tracker,
and the grace machine (`isPointerMovingToSubmenu`, `pointerGraceIntentRef`,
`pointerDirRef`, `lastPointerXRef`) plus `highlightedElement` ownership — is
**wrapper-independent and extractable** into a `useMenuContent()` that returns the
`role=menu` surface and provides `MenuContentContext`, with the 4 wrappers left in
the SFC. **The wrappers are the shell; the overlay brain is the composable.** That's
the seam #2724 should target.

## Scope NOT covered (recommended next depth)
- **`useMenuContent()`** — extract the brain above. Highest information yield for #2724.
- Reuse `getMenuItemBaseSurface` in **`MenuSubTrigger`/`MenuCheckboxItem`/`MenuRadioItem`**
  (proves the base+variant layering end-to-end).
- **`useMenuSub()`** — the `MenuContext` symmetry.
- Move `PartSurface` to `@/shared` (this POC imports it from `@/Switch` on `v3`; the
  Tabs PR #2795 relocates it — rebase onto that).

## Bottom line
`useX()` works for overlays. It costs two axiom amendments (state-only root;
context-scoped factories) and one exemption (functional `data-*`). The real prize
isn't the item surface — it's that the overlay brain in the Content part extracts,
which is exactly what #2724 needs to know before it rewrites overlay internals.
