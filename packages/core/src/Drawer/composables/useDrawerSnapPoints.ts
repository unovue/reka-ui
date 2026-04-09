import type { Ref } from 'vue'
import type { DrawerSnapPoint, SwipeDirection } from '../utils'
import { useEventListener } from '@vueuse/core'
import { computed, ref } from 'vue'

// BaseUI snap-release constants (DrawerViewport.tsx)
const SNAP_VELOCITY_THRESHOLD = 0.5
const SNAP_VELOCITY_MULTIPLIER = 300
const MAX_SNAP_VELOCITY = 4
const FAST_SWIPE_VELOCITY = 0.5

export interface ResolvedSnapPoint {
  value: DrawerSnapPoint
  height: number
  offset: number
}

function parseSnapPoint(value: DrawerSnapPoint, viewportHeight: number, rootFontSize: number): number | null {
  if (typeof value === 'number') {
    if (value >= 0 && value <= 1)
      return Math.round(value * viewportHeight)
    return Math.round(value)
  }
  if (value.endsWith('rem'))
    return Math.round(Number.parseFloat(value) * rootFontSize)
  if (value.endsWith('px'))
    return Math.round(Number.parseFloat(value))
  // Unknown units (e.g. '%', 'vh') are unsupported — drop the snap point
  return null
}

export function useDrawerSnapPoints(options: {
  snapPoints: Ref<DrawerSnapPoint[] | undefined>
  activeSnapPoint: Ref<DrawerSnapPoint | null | undefined>
  popupHeight: Ref<number>
  viewportRef: Ref<HTMLElement | null | undefined>
  onSnapPointChange: (point: DrawerSnapPoint | null) => void
}) {
  const { snapPoints, activeSnapPoint, popupHeight, viewportRef, onSnapPointChange } = options

  const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 0)
  const rootFontSize = ref(
    typeof document !== 'undefined'
      ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16,
  )

  if (typeof window !== 'undefined') {
    useEventListener(window, 'resize', () => {
      viewportHeight.value = window.innerHeight
    })
  }

  const resolvedSnapPoints = computed<ResolvedSnapPoint[]>(() => {
    const points = snapPoints.value
    if (!points || points.length === 0)
      return []
    const vh = viewportHeight.value
    const fs = rootFontSize.value
    const ph = popupHeight.value

    const resolved: ResolvedSnapPoint[] = []
    for (const pt of points) {
      const height = parseSnapPoint(pt, vh, fs)
      if (height == null)
        continue
      if (resolved.some(r => Math.abs(r.height - height) <= 1))
        continue
      const clampedHeight = Math.min(height, Math.min(ph, vh))
      resolved.push({ value: pt, height: clampedHeight, offset: Math.max(0, ph - clampedHeight) })
    }
    return resolved.sort((a, b) => a.height - b.height)
  })

  const activeSnapPointOffset = computed<number | null>(() => {
    if (!activeSnapPoint.value || resolvedSnapPoints.value.length === 0)
      return null
    const activeHeight = parseSnapPoint(
      activeSnapPoint.value as DrawerSnapPoint,
      viewportHeight.value,
      rootFontSize.value,
    )
    const match = resolvedSnapPoints.value.find(
      r => r.value === activeSnapPoint.value
        || (activeHeight != null && Math.abs(r.height - activeHeight) <= 1),
    )
    return match?.offset ?? null
  })

  /**
   * BaseUI-parity snap release math (ported from `DrawerViewport.tsx` lines ~577-714).
   *
   * Takes a **dismiss-signed** drag delta (positive = dismiss direction, negative =
   * open direction) and the raw velocity vector. Computes a velocity-boosted target
   * offset, then either dismisses, snaps to the closest point, or (in sequential
   * mode) advances one step based on physical crossing + fast-swipe velocity.
   */
  function snapToNearest(
    dragDelta: number,
    velocity: { x: number, y: number },
    direction: SwipeDirection,
    sequential: boolean,
  ) {
    const points = resolvedSnapPoints.value
    if (points.length === 0)
      return

    const ph = popupHeight.value

    // Convert raw velocity into a dismiss-signed scalar:
    //   positive = moving in dismiss direction (collapsing)
    //   negative = moving in open direction (expanding)
    const axisVel = (direction === 'up' || direction === 'down') ? velocity.y : velocity.x
    const velSigned = (direction === 'up' || direction === 'left') ? -axisVel : axisVel

    // Current offset (from fully open): 0 = fully open, `ph` = fully closed
    const activePoint = points.find(p => p.value === activeSnapPoint.value)
    const currentOffset = activePoint?.offset ?? 0

    // Where the drag alone would leave us (clamped to the popup's range)
    const dragTargetOffset = Math.max(0, Math.min(ph, currentOffset + dragDelta))

    // Velocity offset (fast-swipe boost) — only when velocity exceeds threshold
    let targetOffset = dragTargetOffset
    if (Math.abs(velSigned) >= SNAP_VELOCITY_THRESHOLD) {
      const clampedVel = Math.max(-MAX_SNAP_VELOCITY, Math.min(MAX_SNAP_VELOCITY, velSigned))
      targetOffset = dragTargetOffset + clampedVel * SNAP_VELOCITY_MULTIPLIER
    }

    // Find the closest snap point to the projected target offset
    let closest = points[0]
    let closestDist = Math.abs(targetOffset - closest.offset)
    for (const p of points) {
      const d = Math.abs(targetOffset - p.offset)
      if (d < closestDist) {
        closest = p
        closestDist = d
      }
    }

    // Close-vs-snap decision: close only when strictly closer to fully-closed
    // (offset === ph) than to any snap point.
    const closeDistance = Math.abs(targetOffset - ph)
    if (closeDistance < closestDist) {
      onSnapPointChange(null)
      return
    }

    if (sequential) {
      // Sequential mode: only move one step toward the drag direction, and only
      // if (a) velocity direction matches drag direction and is fast enough, OR
      // (b) the projected target has physically crossed the adjacent snap.
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

      // Physical crossing: has the projected target moved past the adjacent point?
      const crossed = dragDir > 0
        ? targetOffset > adjacent.offset
        : targetOffset < adjacent.offset
      onSnapPointChange(crossed ? adjacent.value : (activeSnapPoint.value ?? closest.value))
      return
    }

    onSnapPointChange(closest.value)
  }

  return {
    resolvedSnapPoints,
    activeSnapPointOffset,
    viewportHeight,
    snapToNearest,
  }
}
