import type { Ref } from 'vue'
import type { DrawerSnapPoint } from '../utils'
import { useResizeObserver } from '@vueuse/core'
import { computed, ref } from 'vue'

export interface ResolvedSnapPoint {
  value: DrawerSnapPoint
  height: number
  offset: number
}

function parseSnapPoint(value: DrawerSnapPoint, viewportHeight: number, rootFontSize: number): number {
  if (typeof value === 'number') {
    if (value >= 0 && value <= 1)
      return Math.round(value * viewportHeight)
    return Math.round(value)
  }
  if (value.endsWith('rem'))
    return Math.round(Number.parseFloat(value) * rootFontSize)
  if (value.endsWith('px'))
    return Math.round(Number.parseFloat(value))
  return 0
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

  useResizeObserver(viewportRef, ([entry]) => {
    viewportHeight.value = entry.contentRect.height
  })

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
      if (resolved.some(r => Math.abs(r.height - height) <= 1))
        continue
      resolved.push({ value: pt, height, offset: ph - height })
    }
    return resolved.sort((a, b) => a.height - b.height)
  })

  const activeSnapPointOffset = computed<number | null>(() => {
    if (!activeSnapPoint.value || resolvedSnapPoints.value.length === 0)
      return null
    const match = resolvedSnapPoints.value.find(
      r => r.value === activeSnapPoint.value
        || Math.abs(r.height - parseSnapPoint(
          activeSnapPoint.value as DrawerSnapPoint,
          viewportHeight.value,
          rootFontSize.value,
        )) <= 1,
    )
    return match?.offset ?? null
  })

  function snapToNearest(
    currentOffset: number,
    velocity: { x: number, y: number },
    _direction: 'up' | 'down' | 'left' | 'right',
    sequential: boolean,
  ) {
    const points = resolvedSnapPoints.value
    if (points.length === 0)
      return

    const currentHeight = popupHeight.value - currentOffset
    const velY = velocity.y

    if (sequential) {
      const sorted = [...points].sort((a, b) => a.height - b.height)
      const currentIdx = sorted.findIndex(p => Math.abs(p.height - currentHeight) < 20)
      if (velY < -0.1 || _direction === 'up') {
        const next = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : sorted.at(-1)
        onSnapPointChange(next.value)
      }
      else if (velY > 0.1 || _direction === 'down') {
        if (currentIdx <= 0) {
          onSnapPointChange(null)
        }
        else {
          onSnapPointChange(sorted[currentIdx - 1].value)
        }
      }
    }
    else {
      let nearest = points[0]
      for (const p of points) {
        if (Math.abs(p.height - currentHeight) < Math.abs(nearest.height - currentHeight))
          nearest = p
      }
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
