import type { Ref } from 'vue'
import type { DrawerSnapPoint } from '../utils'
import { useEventListener } from '@vueuse/core'
import { computed, ref } from 'vue'

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

  function snapToNearest(
    dragOffsetPx: number,
    velocity: { x: number, y: number },
    direction: 'up' | 'down' | 'left' | 'right',
    sequential: boolean,
  ) {
    const points = resolvedSnapPoints.value
    if (points.length === 0)
      return

    // Find the active snap point's height
    const activePoint = points.find(p => p.value === activeSnapPoint.value)
    const activeHeight = activePoint?.height ?? popupHeight.value

    // dragOffsetPx: positive = dragged down/right, negative = dragged up/left
    // For a bottom drawer: drag down = shrink visible area, drag up = expand
    const currentVisibleHeight = activeHeight - dragOffsetPx

    const isVertical = direction === 'up' || direction === 'down'
    const vel = isVertical ? velocity.y : velocity.x

    // Determine swipe intent from velocity (negative vel = swiping up/left = expanding)
    const expanding = vel < -0.1
    const collapsing = vel > 0.1

    if (sequential) {
      const sorted = [...points].sort((a, b) => a.height - b.height)
      const currentIdx = sorted.findIndex(p => p.value === activeSnapPoint.value)

      if (expanding) {
        // Move to next higher snap point
        const next = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : sorted.at(-1)
        if (next)
          onSnapPointChange(next.value)
      }
      else if (collapsing) {
        // Move to next lower snap point, or dismiss if at lowest
        if (currentIdx <= 0)
          onSnapPointChange(null) // dismiss
        else
          onSnapPointChange(sorted[currentIdx - 1].value)
      }
      else {
        // No strong velocity — snap to nearest by position
        let nearest = points[0]
        for (const p of points) {
          if (Math.abs(p.height - currentVisibleHeight) < Math.abs(nearest.height - currentVisibleHeight))
            nearest = p
        }
        // If dragged past halfway below lowest snap, dismiss
        if (currentVisibleHeight < (sorted[0]?.height ?? 0) / 2)
          onSnapPointChange(null)
        else
          onSnapPointChange(nearest.value)
      }
    }
    else {
      let nearest = points[0]
      for (const p of points) {
        if (Math.abs(p.height - currentVisibleHeight) < Math.abs(nearest.height - currentVisibleHeight))
          nearest = p
      }
      if (currentVisibleHeight < (points[0]?.height ?? 0) / 2)
        onSnapPointChange(null)
      else
        onSnapPointChange(nearest.value)
    }
  }

  return {
    resolvedSnapPoints,
    activeSnapPointOffset,
    viewportHeight,
    snapToNearest,
  }
}
