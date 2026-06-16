# Drawer Component Design

**Date:** 2026-04-04
**Issue:** [unovue/reka-ui#2515](https://github.com/unovue/reka-ui/issues/2515)
**Branch:** `2515-feature-drawer`

## Summary

Port the [BaseUI Drawer](https://base-ui.com/react/components/drawer) component to Reka UI (Vue 3). Supersedes [Vaul Vue](https://github.com/unovue/vaul-vue) since the original Vaul repo is no longer maintained.

**Scope:** Full feature set — swipe gestures, snap points, SwipeArea, Provider/Indent effect, nested drawers.

**Architecture:** Standalone — built from Vue primitives (`FocusScope`, `DismissableLayer`, `Presence`, `Teleport`) without wrapping `Dialog`. Gesture layer uses `@vueuse/core` utilities (`useEventListener`, `useResizeObserver`) plus a custom `useSwipeDismiss` composable.

---

## Component Structure

```text
packages/core/src/Drawer/
├── DrawerRoot.vue              # Context provider + open/modal/swipeDirection state
├── DrawerTrigger.vue           # Primitive button that opens drawer
├── DrawerPortal.vue            # Teleports content to body
├── DrawerOverlay.vue           # Backdrop with swipe-progress CSS var
├── DrawerContent.vue           # Presence-wrapped content
├── DrawerContentImpl.vue       # FocusScope + DismissableLayer + gesture binding
├── DrawerHandle.vue            # Visible drag handle (also gesture target)
├── DrawerSwipeArea.vue         # Invisible swipe-to-open zone outside popup
├── DrawerTitle.vue             # h2 label
├── DrawerDescription.vue       # p description
├── DrawerClose.vue             # Close button
├── DrawerProvider.vue          # Global coordinator for indent effects
├── DrawerIndent.vue            # App UI wrapper (scales on drawer open)
├── DrawerIndentBackground.vue  # Background layer (data-active/inactive)
├── composables/
│   ├── useSwipeDismiss.ts      # Core gesture composable
│   └── useDrawerSnapPoints.ts  # Snap point resolver
├── utils.ts                    # CSS var names, helpers
├── index.ts                    # Exports
└── story/
    └── Drawer.story.vue
```

---

## Context Shape (`DrawerRootContext`)

Provided by `DrawerRoot`, injected by all child components:

```ts
interface DrawerRootContext {
  // State
  open: Readonly<Ref<boolean>>
  modal: Ref<boolean>
  swipeDirection: Ref<SwipeDirection> // 'up' | 'down' | 'left' | 'right'
  snapPoints: Ref<DrawerSnapPoint[] | undefined>
  activeSnapPoint: Ref<DrawerSnapPoint | null | undefined>
  snapToSequentialPoints: Ref<boolean>

  // Dimensions (set imperatively by DrawerContentImpl)
  popupHeight: Ref<number>
  frontmostHeight: Ref<number>

  // Nested drawer state
  hasNestedDrawer: Ref<boolean>
  nestedSwiping: Ref<boolean>
  nestedSwipeProgressStore: NestedSwipeProgressStore // pub/sub, no re-render

  // Actions
  onOpenChange: (value: boolean) => void
  setActiveSnapPoint: (point: DrawerSnapPoint | null) => void
  onPopupHeightChange: (height: number) => void
  onNestedFrontmostHeightChange: (height: number) => void
  onNestedDrawerPresenceChange: (present: boolean) => void
  onNestedSwipingChange: (swiping: boolean) => void
  onNestedSwipeProgressChange: (progress: number) => void

  // Optional — only set when nested inside another DrawerRoot
  notifyParentFrontmostHeight?: (height: number) => void
  notifyParentSwipingChange?: (swiping: boolean) => void
  notifyParentSwipeProgressChange?: (progress: number) => void
  notifyParentHasNestedDrawer?: (present: boolean) => void

  // DOM refs
  triggerElement: Ref<HTMLElement | undefined>
  contentElement: Ref<HTMLElement | undefined>
  contentId: string
  titleId: string
  descriptionId: string
}
```

---

## Props API

### `DrawerRoot`

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | — | Controlled open state (`v-model:open`) |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `modal` | `boolean` | `true` | Enable focus trap + scroll lock |
| `swipeDirection` | `SwipeDirection` | `'down'` | Direction to swipe to dismiss |
| `snapPoints` | `DrawerSnapPoint[]` | — | Preset heights (fractions, px, rem) |
| `snapPoint` | `DrawerSnapPoint \| null` | — | Controlled active snap point |
| `defaultSnapPoint` | `DrawerSnapPoint \| null` | — | Initial snap point |
| `snapToSequentialPoints` | `boolean` | `true` | Velocity-based vs distance-based snap selection |

**Emits:** `update:open`, `update:snapPoint`

### `DrawerContent`

| Prop | Type | Default | Description |
|---|---|---|---|
| `forceMount` | `boolean` | `false` | Keep mounted for animation control |

Inherits all `DismissableLayer` props (same as `DialogContent`).

**Emits:** `openAutoFocus`, `closeAutoFocus`, `escapeKeyDown`, `pointerDownOutside`, `focusOutside`, `interactOutside`

### `DrawerOverlay`

| Prop | Type | Default | Description |
|---|---|---|---|
| `forceMount` | `boolean` | `false` | Keep mounted |
| `forceRender` | `boolean` | `false` | Render even when nested |

### `DrawerHandle`

| Prop | Type | Default | Description |
|---|---|---|---|
| `as` | `string \| Component` | `'div'` | Element to render |
| `asChild` | `boolean` | `false` | Merge props onto child element |

Renders the visible drag grip. Binds swipe gesture events from `DrawerContentImpl` context. No additional props — styling is left entirely to the consumer via CSS.

### `DrawerSwipeArea`

| Prop | Type | Default | Description |
|---|---|---|---|
| `swipeDirection` | `SwipeDirection` | opposite of Root | Override swipe direction |
| `disabled` | `boolean` | `false` | Disable swipe-to-open |

### `DrawerProvider`

No props. No HTML element rendered.

### `DrawerIndent` / `DrawerIndentBackground`

Standard `as`/`asChild` props. No other props.

---

## Snap Points

**Type:** `type DrawerSnapPoint = number | string`

**Resolution rules:**
- `0 ≤ n ≤ 1` → fraction of viewport height (e.g. `0.5` = 50vh)
- `n > 1` → raw pixel value
- `'148px'` string → parsed pixels
- `'30rem'` string → `rem × document.documentElement.fontSize`

**`useDrawerSnapPoints` composable:**
- Takes `snapPoints`, `activeSnapPoint`, `popupHeight`, viewport element ref
- Uses `useResizeObserver` (VueUse) to recompute on resize
- Deduplicates within 1px tolerance
- Returns `resolvedSnapPoints[]` (each: `{ value, height, offset }`), `activeSnapPointOffset`
- Snap selection on release: if `snapToSequentialPoints=true`, use velocity to move one step; otherwise find nearest by height

---

## Gesture System (`useSwipeDismiss`)

### Inputs

```ts
interface UseSwipeDismissOptions {
  enabled: MaybeRef<boolean>
  elementRef: Ref<HTMLElement | null>
  directions: SwipeDirection[]
  movementCssVars: { x: string, y: string }
  swipeThreshold?: number | ((opts: { element: HTMLElement, direction: SwipeDirection }) => number)
  ignoreScrollableAncestors?: boolean
  canStart?: () => boolean
  onDismiss?: () => void
  onProgress?: (progress: number, details?: SwipeProgressDetails) => void
  onCancel?: () => void
  onSwipeStart?: () => void
  onRelease?: (velocity: { x: number, y: number }) => void
  onSwipingChange?: (swiping: boolean) => void
}
```

### Event strategy

- **Pointer events** (`pointerdown`/`pointermove`/`pointerup`) via `useEventListener` (VueUse) — handles mouse + pen, uses `setPointerCapture` so movement tracks outside element bounds
- **Touch events** (`touchstart`/`touchmove`/`touchend`) — mobile, uses `passive: false` to call `preventDefault()` and block native scroll once swipe is confirmed
- **Scroll conflict detection** — on `touchstart`, walks up DOM to find scrollable ancestor; if initial movement direction matches scroll axis and scrollable content exists, yields to native scroll

### Velocity tracking

Samples `{ x, y, timestamp }` on each move event. On release, computes px/ms velocity. Used to determine which snap point to land on (flick = move to adjacent snap regardless of position).

### Damping

When dragging past the fully-open position (overshoot in wrong direction), applies resistance: `dampedOffset = sqrt(overshoot)`. Matches BaseUI's feel exactly.

### Returns

```text
{
  swipePointerProps: { onPointerDown, onPointerMove, onPointerUp }
  swipeTouchProps: { onTouchStart, onTouchMove, onTouchEnd }
  isSwiping: Ref<boolean>
  swipeDirection: Ref<SwipeDirection | undefined>
  dragOffset: Ref<{ x: number; y: number }>
}
```

---

## CSS Variables

All set imperatively via `element.style.setProperty` (no Vue reactivity) for 60fps performance.

| CSS Var | Set by | Purpose |
|---|---|---|
| `--drawer-swipe-movement-x` | `DrawerContentImpl` | Live drag X offset |
| `--drawer-swipe-movement-y` | `DrawerContentImpl` | Live drag Y offset |
| `--drawer-snap-point-offset` | `DrawerContentImpl` | Snap position translation |
| `--drawer-height` | `DrawerContentImpl` | Popup height (ResizeObserver) |
| `--drawer-frontmost-height` | `DrawerContentImpl` | Topmost open drawer height |
| `--drawer-swipe-progress` | `DrawerOverlay` + `DrawerIndent` | Backdrop/indent swipe progress (0–1) |
| `--drawer-swipe-strength` | `DrawerOverlay` | Resistance factor |
| `--nested-drawers` | `DrawerContentImpl` | Nesting depth count |

`CSS.registerProperty` called once per var with `inherits: false` to avoid style recalc cascade.

---

## Data Attributes

Applied to `DrawerContent`:

| Attribute | Value | Meaning |
|---|---|---|
| `data-open` | `''` | Drawer is open |
| `data-closed` | `''` | Drawer is closed |
| `data-swiping` | `''` | Active swipe gesture |
| `data-swipe-direction` | `'up'\|'down'\|'left'\|'right'` | Current swipe direction |
| `data-starting-style` | `''` | During enter animation |
| `data-ending-style` | `''` | During exit animation |
| `data-expanded` | `''` | At full-height snap point |
| `data-nested-drawer-open` | `''` | A child drawer is open |

---

## Provider / Indent Effect

### `DrawerProvider`

- Tracks all drawer open states: `Map<string, boolean>` (ID → open)
- Owns `visualStateStore`: plain pub/sub object `{ swipeProgress, frontmostHeight }` — no Vue reactivity, zero re-render overhead during swipe
- Exposes via provide: `{ active, setDrawerOpen, removeDrawer, visualStateStore }`

### `DrawerIndentBackground`

- Reads `active` from provider context
- Renders `data-active` / `data-inactive` attribute
- No store subscription — pure CSS styling target

### `DrawerIndent`

- Subscribes to `visualStateStore` in `onMounted` (unsubscribes in `onUnmounted`)
- Imperatively sets `--drawer-swipe-progress` and `--drawer-height` CSS vars on its own DOM node
- Renders `data-active` / `data-inactive` attribute

---

## Nested Drawers

- `DrawerRoot` injects parent `DrawerRootContext` optionally (returns `undefined` if not nested)
- If nested: registers parent callbacks (`notifyParentFrontmostHeight`, etc.) so parent content receives `data-nested-drawer-open` and correct height CSS vars
- `--nested-drawers` CSS var counts nesting depth for scale/offset transforms in CSS
- `DrawerOverlay` skips rendering when `nested=true` (unless `forceRender` prop set)

---

## Accessibility

- `role="dialog"` on `DrawerContent`
- `aria-labelledby` → `DrawerTitle` id
- `aria-describedby` → `DrawerDescription` id
- Focus trapped inside when `modal=true`
- Returns focus to trigger on close
- Dev warnings (non-production) for missing `DrawerTitle`

---

## File Exports (`index.ts`)

```ts
export { DrawerRoot, type DrawerRootEmits, type DrawerRootProps, injectDrawerRootContext }
export { DrawerTrigger, type DrawerTriggerProps }
export { DrawerPortal, type DrawerPortalProps }
export { DrawerOverlay, type DrawerOverlayProps }
export { DrawerContent, type DrawerContentEmits, type DrawerContentProps }
export { DrawerHandle, type DrawerHandleProps }
export { DrawerSwipeArea, type DrawerSwipeAreaProps }
export { DrawerTitle, type DrawerTitleProps }
export { DrawerDescription, type DrawerDescriptionProps }
export { DrawerClose, type DrawerCloseProps }
export { DrawerProvider }
export { DrawerIndent, type DrawerIndentProps }
export { DrawerIndentBackground, type DrawerIndentBackgroundProps }
```
