import type { DrawerSnapPoint } from '../utils'
import { describe, expect, it } from 'vitest'
import { ref, shallowRef } from 'vue'
import { useDrawerSnapPoints } from './useDrawerSnapPoints'

/**
 * Unit tests for the snap-point release math ported from BaseUI
 * `DrawerViewport.tsx` (lines 243-714). These tests pin down the behavior
 * that the Phase 2 gesture math fix introduced:
 *
 *  - Close-vs-snap distance comparison (dismiss only when strictly closer to
 *    fully-closed than to any snap point)
 *  - Velocity offset boost (clamped velocity × SNAP_VELOCITY_MULTIPLIER=300)
 *  - Sequential mode shouldAdvance rule (velDir === dragDir && |vel| >= 0.5)
 *  - Sequential mode physical crossing detection
 *
 * We call `useDrawerSnapPoints` directly with plumbed refs so the math is
 * exercised in isolation, without the DOM layer.
 */
function makeHook(options: {
  snapPoints?: DrawerSnapPoint[]
  activeSnapPoint?: DrawerSnapPoint | null
  popupHeight?: number
}) {
  const snapPoints = ref<DrawerSnapPoint[] | undefined>(options.snapPoints)
  const activeSnapPoint = ref<DrawerSnapPoint | null | undefined>(options.activeSnapPoint ?? null)
  const popupHeight = ref(options.popupHeight ?? 500)
  const viewportRef = shallowRef<HTMLElement | null | undefined>(null)
  const changes: Array<DrawerSnapPoint | null> = []
  const hook = useDrawerSnapPoints({
    snapPoints,
    activeSnapPoint,
    popupHeight,
    viewportRef,
    onSnapPointChange: v => changes.push(v),
  })
  return { ...hook, changes, activeSnapPoint, popupHeight, snapPoints }
}

describe('useDrawerSnapPoints — snap release math', () => {
  describe('non-sequential mode (snap to closest)', () => {
    it('resolves numeric pixel snap points and computes offsets', () => {
      const { resolvedSnapPoints } = makeHook({
        snapPoints: [200, 400, 500],
        popupHeight: 500,
      })
      const points = resolvedSnapPoints.value
      expect(points).toHaveLength(3)
      // offset = popupHeight - height, sorted by height ascending
      expect(points[0]).toMatchObject({ height: 200, offset: 300 })
      expect(points[1]).toMatchObject({ height: 400, offset: 100 })
      expect(points[2]).toMatchObject({ height: 500, offset: 0 })
    })

    it('drops unknown-unit snap points (parseSnapPoint returns null)', () => {
      const { resolvedSnapPoints } = makeHook({
        // '50%' is not supported and must be dropped (not silently become a
        // 0-height snap at the bottom).
        snapPoints: ['50%' as any, 300, 500],
        popupHeight: 500,
      })
      expect(resolvedSnapPoints.value).toHaveLength(2)
      expect(resolvedSnapPoints.value.map(p => p.height).sort((a, b) => a - b)).toEqual([300, 500])
    })

    it('drops non-finite and negative snap points (NaN / negatives)', () => {
      const { resolvedSnapPoints } = makeHook({
        // 'abcpx' parses to NaN, '-100px' and -50 are negative — all must be
        // dropped so they never flow into geometry as `NaNpx`/out-of-range.
        snapPoints: ['abcpx' as any, '-100px' as any, -50 as any, 300, 500],
        popupHeight: 500,
      })
      expect(resolvedSnapPoints.value.map(p => p.height).sort((a, b) => a - b)).toEqual([300, 500])
    })

    it('resolves the active snap by parsed-height equivalence, not just raw value', () => {
      // activeSnapPoint is '400px' but resolved points store the numeric 400.
      // A strict value match would miss it and start release math from offset 0
      // (treating the drawer as fully open) → a tiny drag would wrongly snap to
      // the fully-open 500 point. Equivalence matching keeps it at 400.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: '400px' as any,
        popupHeight: 500,
      })
      snapToNearest(20, { x: 0, y: 0 }, 'down', false)
      expect(changes).toEqual([400])
    })

    it('snaps to the closer snap point on small drag with zero velocity', () => {
      // Active = 400 (offset 100). Small drag down of 20px → targetOffset 120,
      // closest to 400 (distance 20). Not closer to fully-closed (ph=500, dist 380).
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 400,
        popupHeight: 500,
      })
      snapToNearest(20, { x: 0, y: 0.1 }, 'down', false)
      expect(changes).toEqual([400])
    })

    it('snaps to a lower snap point when dragged most of the way there', () => {
      // Active = 500 (offset 0). Drag down 250px → targetOffset 250, closest to 400 (offset 100) dist 150, or 200 (offset 300) dist 50 → 200 wins.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 500,
        popupHeight: 500,
      })
      snapToNearest(250, { x: 0, y: 0.1 }, 'down', false)
      expect(changes).toEqual([200])
    })

    it('dismisses when closer to fully-closed than to any snap', () => {
      // Active = 200 (offset 300). Drag down 180px → targetOffset 480, close
      // dist = 20, closest snap dist to 200 (offset 300) = 180. Close wins.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 200,
        popupHeight: 500,
      })
      snapToNearest(180, { x: 0, y: 0.1 }, 'down', false)
      expect(changes).toEqual([null])
    })

    it('fast flick adds velocity offset that pushes target past a snap', () => {
      // Active = 500 (offset 0). Drag down only 50px (targetOffset 50). Without
      // velocity boost, closest is 500 (dist 50). With velocity y=2 (≥0.5), add
      // 2*300=600 → targetOffset 650 (clamped to 500 in final, but the
      // distance comparison happens before clamping). targetOffset=650 is
      // closer to fully-closed (ph=500, dist 150) than to any snap? 400 dist
      // 550, 200 dist 950, 500 dist 650 — close dist 150 wins. So dismiss.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 500,
        popupHeight: 500,
      })
      snapToNearest(50, { x: 0, y: 2 }, 'down', false)
      expect(changes).toEqual([null])
    })

    it('honors up-drawer sign convention', () => {
      // For an 'up' drawer, the user drags UP to dismiss. snapToNearest receives
      // a dismiss-signed dragDelta (positive = dismiss). The internal math flips
      // velocity for 'up' so positive vel in the 'up' direction also counts.
      // Active = 400 (offset 100). Drag 300 (dismiss direction) with small vel →
      // targetOffset 400, closest to 500 (offset 0) dist 400 or 400 (offset 100)
      // dist 300 or 200 (offset 300) dist 100 → 200 wins.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 400,
        popupHeight: 500,
      })
      snapToNearest(300, { x: 0, y: -0.1 }, 'up', false)
      expect(changes).toEqual([200])
    })
  })

  describe('sequential mode', () => {
    it('fast swipe advances exactly one snap point in drag direction', () => {
      // Active = 500 (offset 0, idx 2 when sorted by offset ascending).
      // Drag down 30px, velocity 1.0 (fast). Sequential with velDir === dragDir
      // should advance exactly one step toward the NEXT (dismiss) snap — which
      // is offset 100 → snap 400.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 500,
        popupHeight: 500,
      })
      snapToNearest(30, { x: 0, y: 1.0 }, 'down', true)
      expect(changes).toEqual([400])
    })

    it('slow swipe without crossing keeps active snap', () => {
      // Active = 500 (offset 0). Drag 20px (small), velocity 0.1 (< 0.5, not
      // fast). Not crossing the adjacent snap (offset 100). Should keep 500.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 500,
        popupHeight: 500,
      })
      snapToNearest(20, { x: 0, y: 0.1 }, 'down', true)
      expect(changes).toEqual([500])
    })

    it('slow swipe that physically crosses the adjacent snap advances', () => {
      // Active = 500 (offset 0). Drag 150px (large). velocity 0.1 (not fast).
      // adjacentIdx for sorted-by-offset: currentIdx 0 + dragDir(+1) = 1 → 400 (offset 100).
      // targetOffset ~ 150 > 100 → crossed → advance to 400.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 500,
        popupHeight: 500,
      })
      snapToNearest(150, { x: 0, y: 0.1 }, 'down', true)
      expect(changes).toEqual([400])
    })

    it('dismisses from the lowest snap point when dragged most of the way closed', () => {
      // Active = 200 (offset 300). Drag 180 with small velocity → target 480.
      // Close dist = 20, closest snap is 200 (dist 180). Close wins regardless of sequential.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 400, 500],
        activeSnapPoint: 200,
        popupHeight: 500,
      })
      snapToNearest(180, { x: 0, y: 0.1 }, 'down', true)
      expect(changes).toEqual([null])
    })
  })

  describe('overshoot clamping (drag past fully-open)', () => {
    // Regression for the bug where dragging up from snap=0.5 past the top
    // snap (snap=1.0) would produce a large negative drag delta. Base UI's
    // snap release math uses `Math.max(0, Math.min(popupHeight, ...))` to
    // clamp `dragTargetOffset`, so the projected target never goes below 0
    // (past the fully-open position) regardless of drag magnitude.

    it('clamps a huge up-drag at fully-open snap=1.0 offset (0)', () => {
      // Active = 500 (offset 0, fully open). Drag -1000 (huge upward) with
      // small negative velocity. targetOffset = max(0, min(500, 0 + -1000))
      // = max(0, -1000) = 0. Closest snap is 500 (offset 0). No dismiss
      // because closeDistance (|0-500|=500) > closestDist (0).
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 500],
        activeSnapPoint: 500,
        popupHeight: 500,
      })
      snapToNearest(-1000, { x: 0, y: -2 }, 'down', false)
      expect(changes).toEqual([500])
    })

    it('clamps a huge up-drag when starting from a mid snap', () => {
      // Active = 200 (offset 300). Drag -1500 (huge upward). dragTargetOffset
      // = max(0, min(500, 300 + -1500)) = 0. Velocity is also upward (-3) so
      // velSigned = -3, |vel| >= 0.5 so velocityOffset = clamp(-3,-4,4) * 300
      // = -900. targetOffset = 0 + -900 = -900. closeDistance |-900 - 500|
      // = 1400; closest snap is 500 (offset 0) dist 900. closest snap wins.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 500],
        activeSnapPoint: 200,
        popupHeight: 500,
      })
      snapToNearest(-1500, { x: 0, y: -3 }, 'down', false)
      expect(changes).toEqual([500])
    })

    it('also works for `up` drawers (sign-flipped)', () => {
      // 'up' drawer, active=500. A user dragging UP is in the dismiss
      // direction for an up drawer, so dragDelta is positive. But an
      // aggressive DOWN drag (negative dragDelta, moving AGAINST dismiss)
      // should clamp similarly.
      const { snapToNearest, changes } = makeHook({
        snapPoints: [200, 500],
        activeSnapPoint: 500,
        popupHeight: 500,
      })
      snapToNearest(-1000, { x: 0, y: 2 }, 'up', false)
      expect(changes).toEqual([500])
    })
  })
})
