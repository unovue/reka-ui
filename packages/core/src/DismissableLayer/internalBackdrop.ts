// Internal backdrop for modal layers (#2822), ported from Base UI's
// `InternalBackdrop` (mui/base-ui `packages/react/src/utils/popups/InternalBackdrop.tsx`).
//
// A layer with `disableOutsidePointerEvents` used to set `pointer-events: none`
// on `<body>`. It now mounts a transparent, fixed, full-viewport element right
// below itself instead: the page underneath gets no hover, press or click, a
// press on the backdrop is an ordinary outside press (so it dismisses the
// layer), and nothing global is mutated. The backdrop takes the layer's
// `z-index`, so page content with a lower one (a sticky header) is covered,
// while content with a higher one (e.g. a third-party launcher) stays
// interactive, which `pointer-events: none` on `<body>` made impossible.

import { containsComposed } from '@/shared/getRootNode'

export const INTERNAL_BACKDROP_ATTRIBUTE = 'data-reka-internal-backdrop'

// Floating content is positioned by a wrapper (with a `transform`). A `fixed`
// child of a transformed element is positioned against it, not the viewport,
// so the backdrop goes next to the wrapper rather than next to the layer.
const POSITIONING_WRAPPER_SELECTOR = '[data-reka-popper-content-wrapper]'

const CONTAIN_RE = /paint|layout|strict|content/
const WILL_CHANGE_RE = /transform|perspective|filter/

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

/** A clip-path that cuts the boxes of `cutouts` out of a full-viewport element. */
function cutoutClipPath(cutouts: Element[]) {
  const holes = cutouts.map((cutout) => {
    const rect = cutout.getBoundingClientRect()
    return `${rect.left}px ${rect.top}px,${rect.left}px ${rect.bottom}px,${rect.right}px ${rect.bottom}px,${rect.right}px ${rect.top}px,${rect.left}px ${rect.top}px,0% 0%`
  })
  return `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${holes.join(',')})`
}

/**
 * Whether an element with this computed style is the containing block of its
 * `position: fixed` descendants (instead of the viewport). A fixed backdrop
 * inside it would only be as large as the element.
 */
function isFixedContainingBlock(style: CSSStyleDeclaration) {
  return (!!style.transform && style.transform !== 'none')
    || (!!style.perspective && style.perspective !== 'none')
    || (!!style.filter && style.filter !== 'none')
    || (!!style.backdropFilter && style.backdropFilter !== 'none')
    || CONTAIN_RE.test(style.contain || '')
    || WILL_CHANGE_RE.test(style.willChange || '')
}

function getZIndex(style: CSSStyleDeclaration) {
  return style.position !== 'static' && style.zIndex && style.zIndex !== 'auto' ? style.zIndex : ''
}

interface BackdropPlacement {
  /**
   * The element the layer paints with: the layer, its positioning wrapper, or
   * the outermost `position: fixed` container around them (a `DialogOverlay`
   * that wraps a scrollable `DialogContent`, a `DrawerViewport`). Base UI
   * renders its backdrop before the positioner / viewport for the same reason:
   * the container stays above the backdrop, so it keeps scrolling and a press
   * on it is still the layer's own outside press.
   */
  anchor: Element
  /**
   * The layer sits inside an ancestor that is the containing block of fixed
   * elements (`transform`, `filter`, `contain: paint`, `will-change: transform`,
   * `backdrop-filter`, …), as a non-portaled layer can. A fixed backdrop
   * anywhere inside it would only be as large as that ancestor, so the
   * backdrop goes into `<body>` instead, with a hole over `anchor`: the
   * ancestor's stacking context can sit below the backdrop's `z-index`, and
   * the hole keeps the layer reachable all the same.
   */
  inBody: boolean
}

function composedParentElement(el: Element): Element | null {
  return el.parentElement ?? ((el.parentNode as ShadowRoot | null)?.host ?? null)
}

function resolveBackdropPlacement(layer: HTMLElement, view: Window): BackdropPlacement {
  let anchor: Element = layer.closest(POSITIONING_WRAPPER_SELECTOR) ?? layer
  const doc = layer.ownerDocument
  let inBody = false
  // Composed walk: a shadow host (or one of its ancestors) can be the
  // containing block too, for a layer rendered inside a shadow root.
  for (let el = composedParentElement(anchor); el && el !== doc.body && el !== doc.documentElement; el = composedParentElement(el)) {
    const style = view.getComputedStyle(el)
    if (isFixedContainingBlock(style))
      inBody = true
    else if (!inBody && style.position === 'fixed')
      anchor = el
  }
  return { anchor, inBody: inBody && !!doc.body }
}

/**
 * The `z-index` that puts the backdrop right below `anchor` in their shared
 * stacking context: the anchor's own when it applies (the anchor is
 * positioned). Page content with a lower `z-index` (a sticky header) is
 * covered, anything with a higher one (a third-party launcher) stays above.
 * The popper wrapper copies the content's `z-index` after mount, so until then
 * the content's own value is used. Anything else inside the anchor is
 * confined to the anchor's stacking context and must not raise the backdrop
 * above the anchor.
 */
function resolveBackdropZIndex(anchor: Element, layer: HTMLElement, view: Window): string {
  const zIndex = getZIndex(view.getComputedStyle(anchor))
  if (zIndex)
    return zIndex
  if (anchor !== layer && anchor.matches(POSITIONING_WRAPPER_SELECTOR)) {
    const zIndex = view.getComputedStyle(layer).zIndex
    if (zIndex && zIndex !== 'auto')
      return zIndex
  }
  return ''
}

/** Keeps the holes over `cutouts` in place when they or the viewport resize; returns the disconnect. */
function trackCutouts(backdrop: HTMLElement, cutouts: Element[], view: Window): () => void {
  const update = () => {
    backdrop.style.clipPath = cutoutClipPath(cutouts)
  }
  update()
  view.addEventListener('resize', update)
  const ResizeObserverCtor = (view as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
  const observer = ResizeObserverCtor ? new ResizeObserverCtor(update) : undefined
  for (const cutout of cutouts)
    observer?.observe(cutout)
  return () => {
    view.removeEventListener('resize', update)
    observer?.disconnect()
  }
}

/**
 * Mounts the internal backdrop right below `layer` (see
 * `BackdropPlacement`) and returns the unmount. `cutout` stays interactive
 * through a hole in the backdrop (e.g. a Combobox input or a ContextMenu
 * trigger area).
 */
export function mountInternalBackdrop(layer: HTMLElement, cutout?: Element | null): () => void {
  const view = layer.ownerDocument.defaultView
  if (!view)
    return () => {}
  const { anchor, inBody } = resolveBackdropPlacement(layer, view)
  const parent = anchor.parentNode
  if (!parent)
    return () => {}
  const cutouts = [...(inBody ? [anchor] : []), ...(cutout ? [cutout] : [])]

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
    zIndex: resolveBackdropZIndex(anchor, layer, view),
    userSelect: 'none',
    webkitUserSelect: 'none',
  })
  const stopTrackingCutout = cutouts.length ? trackCutouts(backdrop, cutouts, view) : undefined

  if (inBody)
    layer.ownerDocument.body.append(backdrop)
  else
    parent.insertBefore(backdrop, anchor)
  backdrops.set(layer, backdrop)

  return () => {
    stopTrackingCutout?.()
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
  return !!layer && containsComposed(target, layer)
}
