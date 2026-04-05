// packages/core/src/Drawer/utils.ts

export type SwipeDirection = 'up' | 'down' | 'left' | 'right'
export type DrawerSnapPoint = number | string

export const DRAWER_CSS_VARS = {
  swipeMovementX: '--drawer-swipe-movement-x',
  swipeMovementY: '--drawer-swipe-movement-y',
  snapPointOffset: '--drawer-snap-point-offset',
  height: '--drawer-height',
  frontmostHeight: '--drawer-frontmost-height',
  swipeProgress: '--drawer-swipe-progress',
  swipeStrength: '--drawer-swipe-strength',
  nestedDrawers: '--nested-drawers',
} as const

export interface NestedSwipeProgressStore {
  getSnapshot: () => number
  subscribe: (listener: () => void) => () => void
}

export function createNestedSwipeProgressStore(): NestedSwipeProgressStore & {
  set: (progress: number) => void
} {
  let progress = 0
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => progress,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set(next: number) {
      if (next !== progress) {
        progress = next
        listeners.forEach(l => l())
      }
    },
  }
}

export function getDisplacement(
  direction: SwipeDirection,
  deltaX: number,
  deltaY: number,
): number {
  switch (direction) {
    case 'up': return -deltaY
    case 'down': return deltaY
    case 'left': return -deltaX
    case 'right': return deltaX
    default: return 0
  }
}

const MATRIX_RE = /matrix(?:3d)?\(([^)]+)\)/

export function getElementTransform(element: HTMLElement): {
  x: number
  y: number
  scale: number
} {
  const style = window.getComputedStyle(element)
  const transform = style.transform
  let x = 0
  let y = 0
  let scale = 1
  if (transform && transform !== 'none') {
    const matrix = transform.match(MATRIX_RE)
    if (matrix) {
      const v = matrix[1].split(', ').map(Number)
      if (v.length === 6) {
        x = v[4]
        y = v[5]
        scale = Math.sqrt(v[0] * v[0] + v[1] * v[1])
      }
      else if (v.length === 16) {
        x = v[12]
        y = v[13]
        scale = v[0]
      }
    }
  }
  return { x, y, scale }
}

let drawerCssVarsRegistered = false

/**
 * Removes CSS variable inheritance for high-frequency drawer swipe vars.
 * Uses proper syntax types matching BaseUI:
 * - Length vars (<length>) with initialValue '0px' for use in calc()/translateY()
 * - Number vars (<number>) for opacity/strength scalars
 */
export function registerDrawerCssProperties() {
  if (drawerCssVarsRegistered || typeof CSS === 'undefined' || !CSS.registerProperty)
    return

  const lengthVars = [
    DRAWER_CSS_VARS.swipeMovementX,
    DRAWER_CSS_VARS.swipeMovementY,
    DRAWER_CSS_VARS.snapPointOffset,
  ]
  for (const name of lengthVars) {
    try {
      CSS.registerProperty({ name, syntax: '<length>', inherits: false, initialValue: '0px' })
    }
    catch {}
  }

  const numberVars = [
    { name: DRAWER_CSS_VARS.swipeProgress, initialValue: '0' },
    { name: DRAWER_CSS_VARS.swipeStrength, initialValue: '1' },
  ]
  for (const { name, initialValue } of numberVars) {
    try {
      CSS.registerProperty({ name, syntax: '<number>', inherits: false, initialValue })
    }
    catch {}
  }

  drawerCssVarsRegistered = true
}
