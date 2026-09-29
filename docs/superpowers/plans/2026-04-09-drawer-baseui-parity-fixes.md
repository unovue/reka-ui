# Drawer BaseUI Parity Fixes — Implementation Plan

> **Context:** Follow-up pass after code review against `github.com/mui/base-ui packages/react/src/drawer`. Addresses 6 Critical + 10 Important + misc Minor items. Reference: the code-review transcript in session + `/tmp/baseui-drawer/` (Base UI source snapshot).

**Goal:** Bring the Vue Drawer port into behavioral + API parity with Base UI's React Drawer where it matters for correctness, without a full viewport-extraction refactor.

**Approach:** Fix behavior gaps in place in existing components (C1 is addressed functionally, not structurally). Add API-parity aliases (`Backdrop`/`Popup`/`Viewport`) via re-exports. Port snap-release math line-for-line from Base UI `DrawerViewport.tsx`. Rewrite the CSS-var sign handling in `useSwipeDismiss.ts` to use damped deltas directly.

**Execution mode:** Inline phases with commits between each phase. Each phase is independently buildable so a failure leaves the tree clean.

---

## Phase 1 — Surface API fixes (low risk)

**Files:**
- `packages/core/src/Drawer/DrawerRoot.vue` — flip `snapToSequentialPoints` default from `true` → `false`; widen `modal` type to `boolean | 'trap-focus'`; change `update:open` signature to `[value, details?]` with `reason`
- `packages/core/src/Drawer/DrawerContent.vue` — add `initialFocus` / `finalFocus` props, wire to `FocusScope`; handle `modal: 'trap-focus'` branch (trap focus true + disable-outside-pointer-events false)
- `packages/core/src/Drawer/DrawerContentImpl.vue` — accept and pass through `initialFocus`/`finalFocus`
- `packages/core/src/Drawer/index.ts` — add `DrawerBackdrop` (alias of Overlay), `DrawerPopup` (alias of Content), `DrawerViewport` export (new file), `Drawer*` namespace
- `packages/core/src/Drawer/DrawerViewport.vue` — **new**, passthrough wrapper carrying `data-drawer-viewport` and forwarding slots. Thin for now; exists for API parity + future extraction point.
- `packages/core/src/Drawer/composables/useDrawerSnapPoints.ts` — `parseSnapPoint` returns `null` for unknown units (then filtered); cache resolved active snap point
- `packages/core/src/Drawer/Drawer.test.ts` — `SpyInstance` → `MockInstance`
- `packages/core/src/Drawer/DrawerContentImpl.vue` — remove `nestedDepth = ? 1 : 0` (replaced in Phase 3)

## Phase 2 — Gesture math fixes (high value, moderate risk)

**C2 — sign-convention rewrite** in `useSwipeDismiss.ts`:
- Drop `sign`/`offsetX`/`offsetY` reconstruction at lines 217-233
- Write `applyDirectionalDamping(rawDx, rawDy, allowedDirections)` that returns a `{x, y}` where the allowed-direction axes pass through linearly but overshoot on each axis sqrt-damps (Base UI `useSwipeDismiss.ts` lines ~140-180)
- Assign directly: `dragOffset.value = damped`; `setCssVars(el, damped.x, damped.y)`
- `finishSwipe` displacement computation now uses `getDisplacement(dir, damped.x, damped.y)` which produces the same magnitude the user physically moved

**C3 — snapToNearest takes raw deltas**:
- Expose `rawDelta` on `SwipeProgressDetails` (already has `deltaX`/`deltaY`)
- In `DrawerContentImpl.vue:onRelease`, capture latest `rawDelta` via `onProgress` closure and pass to `snapToNearest`
- Inside `useDrawerSnapPoints.ts:snapToNearest`, compute `dragDelta = direction === 'down' ? deltaY : direction === 'up' ? -deltaY : direction === 'right' ? deltaX : -deltaX`

**C4 — snap release math rewrite** (port from Base UI `DrawerViewport.tsx` lines ~577-714):
```ts
const SNAP_VELOCITY_THRESHOLD = 0.5
const SNAP_VELOCITY_MULTIPLIER = 300
const MAX_SNAP_VELOCITY = 4
const FAST_SWIPE_VELOCITY = 0.5

function snapToNearest(dragDelta, velocity, direction, sequential) {
  const points = resolvedSnapPoints.value
  if (points.length === 0)
    return
  const ph = popupHeight.value
  const vel = (direction === 'up' || direction === 'down') ? velocity.y : velocity.x
  // In Base UI terms: positive vel = collapsing (moving in dismiss direction)
  const velSigned = (direction === 'up' || direction === 'left') ? -vel : vel

  const activePoint = points.find(p => p.value === activeSnapPoint.value)
  const currentOffset = activePoint?.offset ?? 0
  const dragTargetOffset = Math.max(0, Math.min(ph, currentOffset + dragDelta))

  let targetOffset = dragTargetOffset
  if (Math.abs(velSigned) >= SNAP_VELOCITY_THRESHOLD) {
    const clampedVel = Math.max(-MAX_SNAP_VELOCITY, Math.min(MAX_SNAP_VELOCITY, velSigned))
    targetOffset = dragTargetOffset + clampedVel * SNAP_VELOCITY_MULTIPLIER
  }

  // Find closest snap point
  let closest = points[0]
  let closestDist = Math.abs(targetOffset - closest.offset)
  for (const p of points) {
    const d = Math.abs(targetOffset - p.offset)
    if (d < closestDist) {
      closest = p
      closestDist = d
    }
  }

  // Close vs snap decision: close only if closer to fully-closed than any snap
  const closeDistance = Math.abs(targetOffset - ph)
  if (closeDistance < closestDist) {
    onSnapPointChange(null)
    return
  }

  if (sequential) {
    // Sequential: only advance one step in the dragged direction, and only
    // if velocity direction matches drag direction AND |vel| >= FAST_SWIPE_VELOCITY,
    // OR the projected target has physically crossed the adjacent snap.
    const sorted = [...points].sort((a, b) => a.offset - b.offset)
    const currentIdx = sorted.findIndex(p => p.value === activeSnapPoint.value)
    if (currentIdx < 0) {
      onSnapPointChange(closest.value)
      return
    }
    const dragDir = Math.sign(dragDelta) // +1 = dismiss dir, -1 = open dir
    const velDir = Math.sign(velSigned)
    const shouldAdvance = velDir === dragDir && Math.abs(velSigned) >= FAST_SWIPE_VELOCITY
    const adjacentIdx = Math.max(0, Math.min(sorted.length - 1, currentIdx + dragDir))
    const adjacent = sorted[adjacentIdx]
    if (shouldAdvance) {
      onSnapPointChange(adjacent.value)
      return
    }
    // Check physical crossing
    const crossed = dragDir > 0
      ? targetOffset > adjacent.offset
      : targetOffset < adjacent.offset
    onSnapPointChange(crossed ? adjacent.value : (activeSnapPoint.value ?? closest.value))
    return
  }

  onSnapPointChange(closest.value)
}
```

## Phase 3 — Missing behaviors

**P3.1 — write `--drawer-swipe-strength` on release** (`DrawerContentImpl.vue`): in `onRelease`, compute a 0.1-1.0 scalar from remaining distance + velocity and set it on `contentElement`. Formula from Base UI `DrawerViewport.tsx` `computeReleaseDurationScalar`.

**P3.2 — scroll-edge swipe** (`useSwipeDismiss.ts`): replace the blanket cancel at line 355-390 with a scroll-edge check. When first move is on the dismiss axis, allow the swipe only if the scrollable ancestor is at the relevant edge (`scrollTop === 0` for a `down` drawer, `scrollTop + clientHeight >= scrollHeight` for an `up` drawer, etc.). Base UI `useSwipeDismiss.ts:canSwipeFromScrollEdgeOnPendingMove`.

**P3.3 — parent subscribes to nestedSwipeProgressStore** (`DrawerContentImpl.vue`): on mount, if parent context exists via `notifyParentSwipeProgressChange`, subscribe to `rootContext.nestedSwipeProgressStore` and write `DRAWER_CSS_VARS.swipeProgress` onto the popup element. Unsubscribe on unmount.

**P3.4 — keepHeightWhileNested** (`DrawerContentImpl.vue`): guard `useResizeObserver` callback: if `rootContext.hasNestedDrawer.value === true` AND `rootContext.popupHeight.value > 0`, skip the height write.

**P3.5 — data-swiping / data-swipe-direction on backdrop** (`DrawerOverlayImpl.vue` + `DrawerRoot.vue`): expose an `isSwiping` ref on root context; overlay reads it and renders the data-attrs.

**P3.6 — nestedOpenDrawerCount** (`DrawerRoot.vue`): add a `nestedOpenDrawerCount: Ref<number>` to context, incremented/decremented in `onNestedDrawerPresenceChange`. `DrawerContentImpl.vue:150` reads `rootContext.nestedOpenDrawerCount.value` for the CSS var.

## Phase 4 — Tests

Add `Drawer.swipe.test.ts` (separate file):
- Helper `simulateSwipe(el, { from, to, duration })` dispatching `pointerdown`/`pointermove`/`pointerup` events with `performance.now` stubbed
- Test `should dismiss on downward swipe past threshold (down drawer)` ×4 sides
- Test `should cancel on reversal within threshold`
- Test `should snap to nearest point on release (with snap points)`
- Test `should dismiss from lowest snap if targetOffset past close threshold`
- Test `should advance sequentially on fast swipe (sequential mode)`

Keep existing `Drawer.test.ts` for a11y/keyboard/click tests; fix `SpyInstance` import.

## Phase 5 — Verify & commit

- `pnpm --filter @reka-ui/core typecheck` (or the project's typecheck command)
- `pnpm --filter @reka-ui/core test Drawer`
- Commit per phase for easy review/bisect
