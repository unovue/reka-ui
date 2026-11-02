// Forked from NPM stacking-order@2.0.0
// Background at https://github.com/Rich-Harris/stacking-order/issues/3

import { assert } from './assert'

/**
 * Determine which of two nodes appears in front of the other —
 * if `a` is in front, returns 1, otherwise returns -1
 * @param {Element} a
 * @param {Element} b
 */
export function compare(a: Element, b: Element): number {
  if (a === b)
    throw new Error('Cannot compare node with itself')

  const ancestors = {
    a: getAncestors(a),
    b: getAncestors(b),
  }

  let common_ancestor

  // remove shared ancestors
  while (ancestors.a.at(-1) === ancestors.b.at(-1)) {
    a = ancestors.a.pop() as Element
    b = ancestors.b.pop() as Element

    common_ancestor = a
  }

  assert(common_ancestor)

  const z_indexes = {
    a: getZIndex(findStackingContext(ancestors.a)),
    b: getZIndex(findStackingContext(ancestors.b)),
  }

  if (z_indexes.a === z_indexes.b) {
    const children = common_ancestor.childNodes

    const furthest_ancestors = {
      a: ancestors.a.at(-1),
      b: ancestors.b.at(-1),
    }

    let i = children.length
    while (i--) {
      const child = children[i]
      if (child === furthest_ancestors.a)
        return 1
      if (child === furthest_ancestors.b)
        return -1
    }
  }

  return Math.sign(z_indexes.a - z_indexes.b)
}

const props
  = /\b(?:position|zIndex|opacity|transform|webkitTransform|mixBlendMode|filter|webkitFilter|isolation)\b/

/** @param {Element} node */
function isFlexItem(node: Element) {
  const display = getComputedStyle(getParent(node)).display
  return display === 'flex' || display === 'inline-flex'
}

/** @param {Element} node */
function createsStackingContext(node: Element) {
  const style = getComputedStyle(node)

  // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context
  if (style.position === 'fixed')
    return true
  // Forked to fix upstream bug https://github.com/Rich-Harris/stacking-order/issues/3
  // if (
  //   (style.zIndex !== "auto" && style.position !== "static") ||
  //   isFlexItem(node)
  // )
  if (
    style.zIndex !== 'auto'
    && (style.position !== 'static' || isFlexItem(node))
  ) {
    return true
  }
  if (+style.opacity < 1)
    return true
  if ('transform' in style && style.transform !== 'none')
    return true
  if ('webkitTransform' in style && style.webkitTransform !== 'none')
    return true
  if ('mixBlendMode' in style && style.mixBlendMode !== 'normal')
    return true
  if ('filter' in style && style.filter !== 'none')
    return true
  if ('webkitFilter' in style && style.webkitFilter !== 'none')
    return true
  if ('isolation' in style && style.isolation === 'isolate')
    return true
  if (props.test(style.willChange))
    return true
  // @ts-expect-error non-standard styling https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-overflow-scrolling
  if (style.webkitOverflowScrolling === 'touch')
    return true

  return false
}

/** @param {Element[]} nodes */
function findStackingContext(nodes: Element[]) {
  let i = nodes.length

  while (i--) {
    const node = nodes[i]
    assert(node)
    if (createsStackingContext(node))
      return node
  }

  return null
}

/** @param {Element} node */
function getZIndex(node: Element | null) {
  return (node && Number(getComputedStyle(node).zIndex)) || 0
}

/** @param {Element} node */
function getAncestors(node: Element) {
  const ancestors = []

  while (node) {
    ancestors.push(node)
    node = getParent(node)
  }

  return ancestors // [ node, ... <body>, <html>, document ]
}

/** @param {Element} node */
function getParent(node: Element) {
  // @ts-expect-error host should exist
  return (node.parentNode instanceof DocumentFragment && node.parentNode?.host) || node.parentNode
}
