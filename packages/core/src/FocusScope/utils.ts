import { getActiveElement } from '@/shared'

export const AUTOFOCUS_ON_MOUNT = 'focusScope.autoFocusOnMount'
export const AUTOFOCUS_ON_UNMOUNT = 'focusScope.autoFocusOnUnmount'
export const EVENT_OPTIONS = { bubbles: false, cancelable: true }

type FocusableTarget = HTMLElement | { focus: () => void }

/** Like `Node.contains`, but crosses shadow boundaries by walking up through host elements. */
export function containsComposed(container: Node, node: Node | null): boolean {
  let current: Node | null = node
  while (current) {
    if (container.contains(current))
      return true
    current = (current.getRootNode() as ShadowRoot).host ?? null
  }
  return false
}

/**
 * Attempts focusing the first element in a list of candidates.
 * Stops when focus has actually moved.
 */
export function focusFirst(candidates: HTMLElement[], { select = false } = {}) {
  const previouslyFocusedElement = getActiveElement()
  for (const candidate of candidates) {
    focus(candidate, { select })
    if (getActiveElement() !== previouslyFocusedElement)
      return true
  }
}

/**
 * Returns the first and last tabbable elements inside a container.
 */
export function getTabbableEdges(container: HTMLElement, candidates = getTabbableCandidates(container)) {
  const first = findVisible(candidates, container)
  const last = findVisible([...candidates].reverse(), container)
  return [first, last] as const
}

/**
 * Returns a list of potential tabbable candidates.
 *
 * NOTE: This is only a close approximation. For example it doesn't take into account cases like when
 * elements are not visible. This cannot be worked out easily by just reading a property, but rather
 * necessitate runtime knowledge (computed styles, etc). We deal with these cases separately.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
 * Credit: https://github.com/discord/focus-layers/blob/master/src/util/wrapFocus.tsx#L1
 */
export function getTabbableCandidates(container: HTMLElement) {
  const nodes: HTMLElement[] = []
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node: any) => {
      const isHiddenInput = node.tagName === 'INPUT' && node.type === 'hidden'
      if (node.disabled || node.hidden || isHiddenInput)
        return NodeFilter.FILTER_SKIP
      // `.tabIndex` is not the same as the `tabindex` attribute. It works on the
      // runtime's understanding of tabbability, so this automatically accounts
      // for any kind of element that could be tabbed to.
      return node.tabIndex >= 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP
    },
  })
  while (walker.nextNode()) nodes.push(walker.currentNode as HTMLElement)
  return keepRadioTabStops(nodes, container).sort((a, b) => {
    if (a.tabIndex === b.tabIndex)
      return 0
    if (a.tabIndex === 0)
      return 1
    if (b.tabIndex === 0)
      return -1
    return a.tabIndex - b.tabIndex
  })
}

function isRadioInput(node: Element | null): node is HTMLInputElement {
  return node?.tagName === 'INPUT' && (node as HTMLInputElement).type === 'radio'
}

/** Whether `a` and `b` are radios of the same named group: same `name`, form owner and root. */
function isSameRadioGroup(a: Element | null, b: Element | null) {
  return isRadioInput(a) && isRadioInput(b) && a.name !== '' && a.name === b.name
    && a.form === b.form && a.getRootNode() === b.getRootNode()
}

/**
 * A native radio group is a single tab stop: its checked radio, or any of its radios when
 * none is checked. The other radios still report `tabIndex` 0, so drop them from `candidates`.
 * Only a checked radio that is itself a visible candidate counts, so a group whose checked
 * radio can't be tabbed to (or sits outside the container) keeps its other radios.
 */
export function keepRadioTabStops(candidates: HTMLElement[], container: HTMLElement) {
  const checkedRadios = candidates.filter((candidate): candidate is HTMLInputElement =>
    isRadioInput(candidate) && candidate.checked && candidate.name !== '' && !isHidden(candidate, { upTo: container }),
  )
  if (!checkedRadios.length)
    return candidates
  return candidates.filter(candidate =>
    !isRadioInput(candidate) || checkedRadios.includes(candidate)
    || !checkedRadios.some(checked => isSameRadioGroup(checked, candidate)),
  )
}

/**
 * Returns the tab stops that follow `element` in `candidates`, which are given in tabbing order.
 * Tab never stays inside a native radio group, and enters a group with nothing checked at
 * its first radio in tabbing order, so the other radios of a group are not tab stops. A
 * radio that is not a candidate itself is placed at the radio of its group that is.
 */
export function getTabStopsAfter(candidates: HTMLElement[], element: Element | null) {
  let index = candidates.indexOf(element as HTMLElement)
  if (index === -1)
    index = candidates.findIndex(candidate => isSameRadioGroup(candidate, element))
  const groups: HTMLInputElement[] = []
  return candidates.filter((candidate, i) => {
    if (!isRadioInput(candidate) || candidate.name === '')
      return i > index
    if (groups.some(radio => isSameRadioGroup(radio, candidate)))
      return false
    groups.push(candidate)
    return i > index
  })
}

/**
 * Returns the first visible element in a list.
 * NOTE: Only checks visibility up to the `container`.
 */
export function findVisible(elements: HTMLElement[], container: HTMLElement) {
  for (const element of elements) {
    // we stop checking if it's hidden at the `container` level (excluding)
    if (!isHidden(element, { upTo: container }))
      return element
  }
}

export function isHidden(node: HTMLElement, { upTo }: { upTo?: HTMLElement }) {
  if (getComputedStyle(node).visibility === 'hidden')
    return true
  while (node) {
    // we stop at `upTo` (excluding it)
    if (upTo !== undefined && node === upTo)
      return false
    if (getComputedStyle(node).display === 'none')
      return true
    node = node.parentElement as HTMLElement
  }
  return false
}

export function isSelectableInput(
  element: any,
): element is FocusableTarget & { select: () => void } {
  return element instanceof HTMLInputElement && 'select' in element
}

export function focus(
  element?: FocusableTarget | null,
  { select = false } = {},
) {
  // only focus if that element is focusable
  if (element && element.focus) {
    const previouslyFocusedElement = getActiveElement()
    // NOTE: we prevent scrolling on focus, to minimize jarring transitions for users
    element.focus({ preventScroll: true })
    // only select if its not the same element, it supports selection and we need to select
    if (
      element !== previouslyFocusedElement
      && isSelectableInput(element)
      && select
    ) {
      element.select()
    }
  }
}
