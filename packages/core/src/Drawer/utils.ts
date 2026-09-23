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

// BaseUI swipe release scalar constants (DrawerViewport.tsx:41-46)
const MIN_SWIPE_RELEASE_VELOCITY = 0.2
const MAX_SWIPE_RELEASE_VELOCITY = 4
const MIN_SWIPE_RELEASE_DURATION_MS = 80
const MAX_SWIPE_RELEASE_DURATION_MS = 360
const MIN_SWIPE_RELEASE_SCALAR = 0.1
const MAX_SWIPE_RELEASE_SCALAR = 1

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Computes a 0.1 - 1.0 scalar for the `--drawer-swipe-strength` CSS var.
 * Ported from BaseUI `DrawerViewport.tsx:resolveSwipeRelease` (lines 243-337).
 *
 * The scalar is derived from how much further the drawer still has to travel
 * vs how fast the user flung it. A short remaining distance with high velocity
 * → near-zero scalar (fast release). A long distance / low velocity → near-1
 * (default release).
 *
 * Returns `null` when the formula is degenerate (no velocity, no distance, or
 * moving in the wrong direction).
 */
export function computeSwipeReleaseScalar(params: {
  direction: SwipeDirection
  size: number
  axisDelta: number
  snapPointOffset: number
  releaseVelocity: number
}): number | null {
  const { direction, size, axisDelta, snapPointOffset, releaseVelocity } = params
  if (!Number.isFinite(size) || size <= 0)
    return null

  // Seed the translation with the active snap offset along the dismiss axis so
  // horizontal drawers honor snap points too: down/right collapse toward
  // positive translation, up/left toward negative.
  let baseOffset = 0
  if (direction === 'down' || direction === 'right')
    baseOffset = snapPointOffset
  else if (direction === 'up' || direction === 'left')
    baseOffset = -snapPointOffset

  const translation = baseOffset + axisDelta
  const translationAlongDirection
    = (direction === 'left' || direction === 'up') ? -translation : translation
  const remainingDistance = Math.max(0, size - translationAlongDirection)
  if (!Number.isFinite(remainingDistance) || remainingDistance <= 0)
    return null

  const directionalVelocity
    = (direction === 'left' || direction === 'up') ? -releaseVelocity : releaseVelocity
  if (!Number.isFinite(directionalVelocity) || directionalVelocity <= MIN_SWIPE_RELEASE_VELOCITY)
    return null

  const clampedVelocity = clamp(
    directionalVelocity,
    MIN_SWIPE_RELEASE_VELOCITY,
    MAX_SWIPE_RELEASE_VELOCITY,
  )
  const durationMs = clamp(
    remainingDistance / clampedVelocity,
    MIN_SWIPE_RELEASE_DURATION_MS,
    MAX_SWIPE_RELEASE_DURATION_MS,
  )
  if (!Number.isFinite(durationMs))
    return null

  const normalized
    = (durationMs - MIN_SWIPE_RELEASE_DURATION_MS)
      / (MAX_SWIPE_RELEASE_DURATION_MS - MIN_SWIPE_RELEASE_DURATION_MS)
  const scalar = clamp(
    MIN_SWIPE_RELEASE_SCALAR + normalized * (MAX_SWIPE_RELEASE_SCALAR - MIN_SWIPE_RELEASE_SCALAR),
    MIN_SWIPE_RELEASE_SCALAR,
    MAX_SWIPE_RELEASE_SCALAR,
  )
  if (!Number.isFinite(scalar) || scalar <= 0)
    return null
  return scalar
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
