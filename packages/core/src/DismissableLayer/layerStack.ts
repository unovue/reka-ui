import { isClient } from '@vueuse/shared'
import { shallowReactive } from 'vue'

/**
 * Centralized DismissableLayer stack manager (transport only).
 *
 * Two separate registries model two populations with different lifetimes:
 * - `layers` — the ordered participation stack, driven by each layer's
 *   presence-based membership watch. Sole source for Escape routing, indexing,
 *   and pointer-events accounting.
 * - `outsideSubscribers` — pointer/focus dispatch targets, driven by each
 *   composable's `watchEffect(enabled)` (setup lifetime for DismissableLayer,
 *   `isEditing` lifetime for Editable). Never affect Escape/index accounting.
 *
 * The manager owns exactly one shared listener of each kind (installed lazily,
 * torn down when its driving registry empties), the per-event layer snapshot,
 * arming, and the touch-click deferral. It does NOT re-implement dismissal
 * logic — each composable ports its `handlePointerDown`/`handleFocus` body into
 * a subscriber closure invoked here with a `DispatchContext`.
 */

export interface StackLayer {
  element: () => HTMLElement | undefined
  isPresent: () => boolean
  disableOutsidePointerEvents: () => boolean
  onEscapeKeyDown?: (event: KeyboardEvent) => void
}

export interface DispatchContext {
  /** Composed (shadow-safe) event target, captured synchronously before any await. */
  target: EventTarget | null
  /** One hoisted `layerElements()` snapshot per event ([0] = bottom, last = top). */
  nodeList: Element[]
  /** O(1) stack index of a layer element within `nodeList` (-1 if absent). */
  layerIndex: (el: Element) => number
  branches: HTMLElement[]
  /** Touch: defer this subscriber's dispatch to the next `click` (replaces = re-arm). */
  deferTouch: (sub: OutsideSubscriber, dispatch: () => void) => void
  /** Touch: cancel a pending deferred dispatch for this subscriber. */
  cancelTouch: (sub: OutsideSubscriber) => void
}

export interface OutsideSubscriber {
  /**
   * false until a macrotask after registration (mount-via-pointerdown guard).
   * POINTER PATH ONLY — the focus path has no arming today (`utils.ts` attaches
   * `focusin` synchronously at L182), so `handleFocus` must NOT check `armed`.
   */
  armed: boolean
  isPointerInside: boolean
  isFocusInside: boolean
  handlePointerDown?: (event: PointerEvent, ctx: DispatchContext) => void
  handleFocus?: (event: FocusEvent, ctx: DispatchContext) => void
}

/** Ordered: [0] = bottom, last = top. `shallowReactive` so consumer computeds track membership. */
export const layers = shallowReactive<StackLayer[]>([])
export const outsideSubscribers = shallowReactive<OutsideSubscriber[]>([])
export const branches = shallowReactive<HTMLElement[]>([])

/**
 * Saved `document.body.style.pointerEvents` from before the first disabling
 * layer. Shared (not component-local) so layer B's cleanup can restore the
 * value layer A saved after A unmounts (#2674).
 */
export const bodyPointerEvents = { original: undefined as string | undefined }

// --- shared listener bookkeeping ---
let outsideListenersInstalled = false
let keydownListenerInstalled = false
let touchClickInstalled = false
const pendingTouch = new Map<OutsideSubscriber, () => void>()
const armingTimers = new Set<number>()

function installOutsideListeners() {
  if (outsideListenersInstalled || !isClient)
    return
  outsideListenersInstalled = true
  document.addEventListener('pointerdown', handlePointerDown)
  document.addEventListener('focusin', handleFocusIn)
}
function teardownOutsideListeners() {
  if (!outsideListenersInstalled)
    return
  outsideListenersInstalled = false
  document.removeEventListener('pointerdown', handlePointerDown)
  document.removeEventListener('focusin', handleFocusIn)
  removeTouchClick()
}
function installKeydownListener() {
  if (keydownListenerInstalled || !isClient)
    return
  keydownListenerInstalled = true
  window.addEventListener('keydown', handleKeyDown)
}
function teardownKeydownListener() {
  if (!keydownListenerInstalled)
    return
  keydownListenerInstalled = false
  window.removeEventListener('keydown', handleKeyDown)
}

// --- touch-click deferral (one shared listener while the map is non-empty) ---
function ensureTouchClick() {
  if (touchClickInstalled || !isClient)
    return
  touchClickInstalled = true
  document.addEventListener('click', handleTouchClick)
}
function removeTouchClick() {
  if (!touchClickInstalled)
    return
  touchClickInstalled = false
  document.removeEventListener('click', handleTouchClick)
}
function handleTouchClick() {
  const entries = [...pendingTouch.entries()]
  pendingTouch.clear()
  removeTouchClick()
  for (const [sub, dispatch] of entries) {
    if (!outsideSubscribers.includes(sub))
      continue
    dispatch()
  }
}
function deferTouch(sub: OutsideSubscriber, dispatch: () => void) {
  pendingTouch.set(sub, dispatch) // replace = re-arm
  ensureTouchClick()
}
function cancelTouch(sub: OutsideSubscriber) {
  pendingTouch.delete(sub)
  if (pendingTouch.size === 0)
    removeTouchClick()
}

// --- dispatch ---
function buildContext(event: Event): DispatchContext {
  const target = (event.composedPath?.()[0] ?? event.target) as EventTarget | null
  const nodeList = layerElements()
  const indexMap = new Map<Element, number>()
  nodeList.forEach((el, i) => indexMap.set(el, i))
  return {
    target,
    nodeList,
    layerIndex: el => indexMap.get(el) ?? -1,
    branches,
    deferTouch,
    cancelTouch,
  }
}

function handlePointerDown(event: PointerEvent) {
  const ctx = buildContext(event)
  // Snapshot: a dispatch may unregister subscribers mid-iteration. The liveness
  // guard skips a subscriber synchronously unregistered by an earlier dispatch
  // (matches the DOM `removed` semantics).
  for (const sub of [...outsideSubscribers]) {
    if (!outsideSubscribers.includes(sub))
      continue
    sub.handlePointerDown?.(event, ctx)
  }
}

function handleFocusIn(event: FocusEvent) {
  const ctx = buildContext(event)
  for (const sub of [...outsideSubscribers]) {
    if (!outsideSubscribers.includes(sub))
      continue
    sub.handleFocus?.(event, ctx)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape')
    return
  // Top present layer only (presence order — matches today's index === size - 1).
  const top = [...layers].reverse().find(layer => layer.isPresent())
  top?.onEscapeKeyDown?.(event)
}

// --- registration ---
export function registerStackLayer(layer: StackLayer): () => void {
  layers.push(layer)
  installKeydownListener()
  return () => {
    const i = layers.indexOf(layer)
    if (i !== -1)
      layers.splice(i, 1)
    if (layers.length === 0)
      teardownKeydownListener()
  }
}

export function registerOutsideSubscriber(sub: OutsideSubscriber): () => void {
  outsideSubscribers.push(sub)
  // Arm a macrotask later: the shared listener is already live, so if this layer
  // mounted *via* a pointerdown, an unarmed handle ignores that same event.
  sub.armed = false
  let timer: number | undefined
  if (isClient) {
    timer = window.setTimeout(() => {
      sub.armed = true
      if (timer !== undefined)
        armingTimers.delete(timer)
    }, 0)
    armingTimers.add(timer)
  }
  installOutsideListeners()
  return () => {
    if (timer !== undefined) {
      window.clearTimeout(timer)
      armingTimers.delete(timer)
    }
    const i = outsideSubscribers.indexOf(sub)
    if (i !== -1)
      outsideSubscribers.splice(i, 1)
    cancelTouch(sub)
    if (outsideSubscribers.length === 0)
      teardownOutsideListeners()
  }
}

export function registerBranch(el: HTMLElement): () => void {
  branches.push(el)
  return () => {
    const i = branches.indexOf(el)
    if (i !== -1)
      branches.splice(i, 1)
  }
}

// --- body pointer-events lock (#2674) ---
// Reference-counted: the first disabling layer saves the original body
// `pointer-events` and sets `none`; the last one to leave restores it. Counting
// (rather than a per-component copy) is what lets layer B restore the value
// layer A saved after A unmounts.
let bodyLockCount = 0
export function acquireBodyPointerEventsLock(doc: Document): void {
  if (bodyLockCount === 0) {
    bodyPointerEvents.original = doc.body.style.pointerEvents
    doc.body.style.pointerEvents = 'none'
  }
  bodyLockCount++
}
export function releaseBodyPointerEventsLock(doc: Document): void {
  bodyLockCount = Math.max(0, bodyLockCount - 1)
  // Restore only once the last disabling layer is gone. `!== undefined` mirrors
  // the previous `!isNullish` check ('' is a valid saved value → still restored).
  if (bodyLockCount === 0 && bodyPointerEvents.original !== undefined)
    doc.body.style.pointerEvents = bodyPointerEvents.original
}
/**
 * Whether the manager currently owns body `pointer-events` (at least one present
 * `disableOutsidePointerEvents` layer holds the lock). Consulted by
 * `useBodyScrollLock` before it clears the style both share (#2784).
 */
export function hasBodyPointerEventsLock(): boolean {
  return bodyLockCount > 0
}

// --- queries ---
export function indexOfLayer(layer: StackLayer): number {
  return layers.indexOf(layer)
}
/**
 * Elements of the present layers in stack order ([0] = bottom, last = top).
 * Read from the registry rather than a document-wide
 * `querySelectorAll('[data-dismissable-layer]')`, which cannot see layers
 * rendered inside shadow roots (they would all index `-1`). Registration order
 * is stack order — the same order Escape routing and pointer-events use.
 */
export function layerElements(): HTMLElement[] {
  const elements: HTMLElement[] = []
  for (const layer of layers) {
    const element = layer.element()
    if (element)
      elements.push(element)
  }
  return elements
}
export function isTopLayer(layer: StackLayer): boolean {
  return layers.length > 0 && layers.at(-1) === layer
}
/** Highest document-position index among layers that disable outside pointer events (-1 if none). */
export function highestDisabledIndex(): number {
  let index = -1
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].disableOutsidePointerEvents())
      index = i
  }
  return index
}

/** Test-only: clear ALL manager state and shared listeners. */
export function resetLayerStack(): void {
  for (const timer of armingTimers)
    window.clearTimeout(timer)
  armingTimers.clear()
  bodyLockCount = 0
  layers.splice(0)
  outsideSubscribers.splice(0)
  branches.splice(0)
  pendingTouch.clear()
  teardownOutsideListeners() // also removes the touch-click listener
  teardownKeydownListener()
  if (isClient && bodyPointerEvents.original !== undefined)
    document.body.style.pointerEvents = bodyPointerEvents.original
  bodyPointerEvents.original = undefined
}
