// Internal backdrop for modal layers (#2822), ported from Base UI's
// `InternalBackdrop` (mui/base-ui `packages/react/src/utils/popups/InternalBackdrop.tsx`).
//
// A layer with `disableOutsidePointerEvents` used to set `pointer-events: none`
// on `<body>`. It now mounts a transparent, fixed, full-viewport element right
// below itself instead: the page underneath gets no hover, press or click, a
// press on the backdrop is an ordinary outside press (so it dismisses the
// layer), and nothing global is mutated. Content that sits above it in the
// stacking order (e.g. a third-party launcher with a high `z-index`) stays
// interactive, which `pointer-events: none` on `<body>` made impossible.

export const INTERNAL_BACKDROP_ATTRIBUTE = 'data-reka-internal-backdrop'

// Floating content is positioned by a wrapper (with a `transform`). A `fixed`
// child of a transformed element is positioned against it, not the viewport,
// so the backdrop goes next to the wrapper rather than next to the layer.
const POSITIONING_WRAPPER_SELECTOR = '[data-reka-popper-content-wrapper]'

const backdrops = new WeakMap<Element, HTMLElement>()

/** The internal backdrop currently mounted for `layer`, if any. */
export function getInternalBackdrop(layer: Element | null | undefined): HTMLElement | undefined {
  return layer ? backdrops.get(layer) : undefined
}

/**
 * A layer below a modal one gets `pointer-events: none` on its content. When
 * it renders inside a positioning wrapper, the wrapper box would still be hit
 * over the modal layer's backdrop; block it too and return the restore.
 */
export function blockPositioningWrapper(layer: HTMLElement): () => void {
  const wrapper = layer.closest<HTMLElement>(POSITIONING_WRAPPER_SELECTOR)
  if (!wrapper)
    return () => {}
  const original = wrapper.style.pointerEvents
  wrapper.style.pointerEvents = 'none'
  return () => {
    wrapper.style.pointerEvents = original
  }
}

/** A clip-path that cuts `cutout`'s box out of a full-viewport element. */
function cutoutClipPath(cutout: Element) {
  const rect = cutout.getBoundingClientRect()
  return `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${rect.left}px ${rect.top}px,${rect.left}px ${rect.bottom}px,${rect.right}px ${rect.bottom}px,${rect.right}px ${rect.top}px,${rect.left}px ${rect.top}px)`
}

/**
 * The element the backdrop goes right before: the layer, its positioning
 * wrapper, or the outermost `position: fixed` container around them (a
 * `DialogOverlay` that wraps a scrollable `DialogContent`, a `DrawerViewport`).
 * Base UI renders its backdrop before the positioner / viewport for the same
 * reason: the container stays above the backdrop, so it keeps scrolling and a
 * press on it is still the layer's own outside press.
 */
function resolveBackdropAnchor(layer: HTMLElement): Element {
  let anchor: Element = layer.closest(POSITIONING_WRAPPER_SELECTOR) ?? layer
  const body = layer.ownerDocument.body
  const view = layer.ownerDocument.defaultView
  if (!view)
    return anchor
  for (let el = anchor.parentElement; el && el !== body; el = el.parentElement) {
    if (view.getComputedStyle(el).position === 'fixed')
      anchor = el
  }
  return anchor
}

/**
 * Mounts the internal backdrop right before `layer` (see
 * `resolveBackdropAnchor`) and returns the unmount. `cutout` stays interactive
 * through a hole in the backdrop (e.g. a Combobox input or a ContextMenu
 * trigger area).
 */
export function mountInternalBackdrop(layer: HTMLElement, cutout?: Element | null): () => void {
  const anchor = resolveBackdropAnchor(layer)
  const parent = anchor.parentNode
  if (!parent)
    return () => {}

  const backdrop = layer.ownerDocument.createElement('div')
  backdrop.setAttribute(INTERNAL_BACKDROP_ATTRIBUTE, '')
  backdrop.setAttribute('role', 'presentation')
  backdrop.setAttribute('aria-hidden', 'true')
  Object.assign(backdrop.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    bottom: '0',
    left: '0',
    userSelect: 'none',
    webkitUserSelect: 'none',
  })
  if (cutout)
    backdrop.style.clipPath = cutoutClipPath(cutout)

  parent.insertBefore(backdrop, anchor)
  backdrops.set(layer, backdrop)

  return () => {
    if (backdrops.get(layer) === backdrop)
      backdrops.delete(layer)
    backdrop.remove()
  }
}

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && typeof (value as Node).nodeType === 'number'
}

/**
 * Whether an outside press on `target` belongs to `layer`'s own backdrop: its
 * internal backdrop or one of `backdrops` (e.g. a `DialogOverlay`). Base UI's
 * modal Dialog only closes on its owning backdrop, so a press on an element
 * stacked above the backdrop (a third-party widget, another library's dialog)
 * leaves it open. Without any backdrop every outside press counts.
 */
export function isOwnBackdropPress(
  target: EventTarget | null,
  layer: Element | null | undefined,
  ...backdrops: (Element | null | undefined)[]
): boolean {
  const owned = [getInternalBackdrop(layer), ...backdrops].filter((el): el is Element => !!el)
  if (owned.length === 0 || !isNode(target))
    return true
  if (owned.some(el => el === target || el.contains(target)))
    return true
  // A press on an ancestor of the layer (a viewport-style wrapper, `<body>`
  // when nothing covers the point) is no element stacked above the backdrop.
  return !!layer && target.contains(layer)
}
