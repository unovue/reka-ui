import { chunk } from '@/shared/arrays'

export type CarouselAlign = 'start' | 'center' | 'end'
export type CarouselSlidesToScroll = number | 'auto'
/**
 * What happens to the snaps at the ends of the track.
 * - `'trimSnaps'`: snaps that would leave empty space are clamped to the scroll range, and duplicates are merged.
 * - `'keepSnaps'`: snaps are clamped to the scroll range but every group keeps its own snap.
 * - `false`: no clamping; empty space is added at the ends so every snap can be aligned.
 */
export type CarouselContainScroll = 'trimSnaps' | 'keepSnaps' | false

/** An item's offset and size along the main axis, in logical scroll coordinates. */
export interface CarouselItemRect {
  start: number
  size: number
}

/** A position the carousel can rest at, and the items (DOM indices) it brings into place. */
export interface CarouselSnap {
  position: number
  items: number[]
}

/** The scroll-snap styles the native scroller needs on one item. */
export interface CarouselItemSnapStyle {
  align?: CarouselAlign
  /** `scroll-margin` on the start side, which offsets the snap to center an even group. */
  margin?: number
}

/** The size of a fixed `slidesToScroll`, `1` for `'auto'` (no measurements yet) or an invalid value. */
export function getFixedGroupSize(slidesToScroll: CarouselSlidesToScroll): number {
  return typeof slidesToScroll === 'number' && slidesToScroll >= 1 ? Math.floor(slidesToScroll) : 1
}

/** Splits the items into the groups one navigation step moves by. */
export function groupItems(
  items: CarouselItemRect[],
  viewportSize: number,
  slidesToScroll: CarouselSlidesToScroll,
): number[][] {
  const groups: number[][] = []
  if (slidesToScroll !== 'auto')
    return chunk(items.map((_, i) => i), getFixedGroupSize(slidesToScroll))
  // `'auto'`: as many items as fit in the viewport, at least one.
  let group: number[] = []
  let groupStart = 0
  items.forEach((item, index) => {
    if (group.length && item.start + item.size - groupStart > viewportSize + 1) {
      groups.push(group)
      group = []
    }
    if (!group.length)
      groupStart = item.start
    group.push(index)
  })
  if (group.length)
    groups.push(group)
  return groups
}

function getGroupExtent(items: CarouselItemRect[], group: number[]) {
  const first = items[group[0]]
  const last = items[group.at(-1)!]
  return { start: first.start, end: last.start + last.size }
}

/**
 * A group's extent: it starts at its first item's measured start and is as
 * long as the group is in `base`, the unrotated layout (a looping track can
 * wrap a group around its ends).
 */
function getAlignedExtent(items: CarouselItemRect[], base: CarouselItemRect[], group: number[]) {
  const start = items[group[0]].start
  const extent = getGroupExtent(base, group)
  return { start, end: start + extent.end - extent.start }
}

function alignGroup(items: CarouselItemRect[], base: CarouselItemRect[], group: number[], viewportSize: number, align: CarouselAlign) {
  const { start, end } = getAlignedExtent(items, base, group)
  if (align === 'start')
    return start
  if (align === 'end')
    return end - viewportSize
  return (start + end - viewportSize) / 2
}

export interface ComputeSnapsOptions {
  items: CarouselItemRect[]
  /** The items laid out in DOM order, when `items` is a rotated (looping) layout. Defaults to `items`. */
  baseItems?: CarouselItemRect[]
  viewportSize: number
  /** The largest scroll offset, `scrollSize - viewportSize`. */
  maxScroll: number
  align: CarouselAlign
  slidesToScroll: CarouselSlidesToScroll
  containScroll: CarouselContainScroll
  /** A looping track never trims: every group keeps a snap. */
  loop?: boolean
}

export interface ComputeSnapsResult {
  snaps: CarouselSnap[]
  /** The groups before any merging, one per item group. */
  groups: number[][]
  /** Empty space `containScroll: false` needs before the first and after the last item. */
  spacing: { start: number, end: number }
}

/** The snap positions of a measured track. Pure: no DOM access. */
export function computeSnaps(options: ComputeSnapsOptions): ComputeSnapsResult {
  const { items, viewportSize, align, slidesToScroll, containScroll, loop } = options
  const base = options.baseItems ?? items
  const groups = groupItems(base, viewportSize, slidesToScroll)
  const raw = groups.map(group => alignGroup(items, base, group, viewportSize, align))

  if (!loop && containScroll === false) {
    const start = Math.max(0, -Math.min(0, ...raw))
    const end = Math.max(0, Math.max(0, ...raw) - Math.max(0, options.maxScroll))
    return {
      groups,
      spacing: { start, end },
      snaps: groups.map((group, i) => ({ position: raw[i] + start, items: [...group] })),
    }
  }

  const maxScroll = Math.max(0, options.maxScroll)
  const clamped = raw.map(position => Math.min(Math.max(position, 0), maxScroll))
  const spacing = { start: 0, end: 0 }
  if (loop || containScroll === 'keepSnaps')
    return { groups, spacing, snaps: groups.map((group, i) => ({ position: clamped[i], items: [...group] })) }

  const snaps: CarouselSnap[] = []
  clamped.forEach((position, i) => {
    const previous = snaps.at(-1)
    if (previous && Math.abs(previous.position - position) < 1)
      previous.items.push(...groups[i])
    else
      snaps.push({ position, items: [...groups[i]] })
  })
  return { groups, spacing, snaps }
}

/** The snap closest to `position`; the first one wins a tie. */
export function getNearestSnapIndex(position: number, snaps: CarouselSnap[]): number {
  let nearest = 0
  let distance = Infinity
  snaps.forEach((snap, index) => {
    const d = Math.abs(snap.position - position)
    if (d < distance - 0.5) {
      distance = d
      nearest = index
    }
  })
  return nearest
}

/**
 * Snap indices ordered by position. In a looping track the visual order is a
 * rotation of the index order, so stepping "one snap forward" is a step in
 * this list rather than `index + 1`.
 */
export function getSnapsByPosition(snaps: CarouselSnap[]): number[] {
  return snaps.map((_, i) => i).sort((a, b) => snaps[a].position - snaps[b].position)
}

/** Whether each item shows at least `threshold` (0 to 1) of its size in the viewport. */
export function getItemsInView(
  items: CarouselItemRect[],
  position: number,
  viewportSize: number,
  threshold: number,
): boolean[] {
  const end = position + viewportSize
  return items.map((item) => {
    const visible = Math.min(item.start + item.size, end) - Math.max(item.start, position)
    if (visible <= 0.5)
      return false
    return threshold <= 0 || visible >= item.size * Math.min(threshold, 1) - 0.5
  })
}

/**
 * The native `scroll-snap-align` of each item: one snap per group, on the item
 * whose own alignment matches the group's. A centered even group has no
 * middle item, so its first item snaps to `start` with a `scroll-margin`
 * that shifts the snap by half the free space (`margin`, measured only).
 */
export function getItemSnapStyles(
  itemCount: number,
  groups: number[][],
  align: CarouselAlign,
  rects?: CarouselItemRect[],
  viewportSize?: number,
): CarouselItemSnapStyle[] {
  const styles: CarouselItemSnapStyle[] = Array.from({ length: itemCount }, () => ({}))
  for (const group of groups) {
    if (!group.length)
      continue
    if (align === 'start') {
      styles[group[0]] = { align: 'start' }
    }
    else if (align === 'end') {
      styles[group.at(-1)!] = { align: 'end' }
    }
    else if (group.length % 2 === 1) {
      styles[group[(group.length - 1) / 2]] = { align: 'center' }
    }
    else if (rects && viewportSize !== undefined) {
      const { start, end } = getGroupExtent(rects, group)
      // `rects` must be the unrotated layout: only the group's length matters.
      const margin = (viewportSize - (end - start)) / 2
      styles[group[0]] = margin >= 0 ? { align: 'start', margin } : { align: 'center' }
    }
    else {
      styles[group[0]] = { align: 'center' }
    }
  }
  return styles
}

/**
 * CSS `order` values that place `anchor` (with the `groupSize - 1` items after
 * it) in the middle of a looping track, so there is room to scroll both ways.
 */
export function getLoopOrder(itemCount: number, anchor: number, groupSize: number): number[] {
  const middle = Math.floor((itemCount - groupSize) / 2)
  return Array.from({ length: itemCount }, (_, i) => (i - anchor + middle + itemCount) % itemCount)
}

/** The index one step from `index`, wrapping when `loop`; `undefined` past an end. */
export function stepIndex(index: number, step: number, count: number, loop: boolean): number | undefined {
  if (count <= 0)
    return undefined
  const next = index + step
  if (loop)
    return ((next % count) + count) % count
  return next < 0 || next >= count ? undefined : next
}

/**
 * The layout a rotated (looping) track would have without the rotation: the
 * items in DOM order, each followed by the average gap between visual
 * neighbours, starting where the first visual item starts.
 */
export function getUnrotatedRects(items: CarouselItemRect[]): CarouselItemRect[] {
  if (items.length < 2)
    return items.map(item => ({ ...item }))
  const visual = items.map((_, i) => i).sort((a, b) => items[a].start - items[b].start)
  let gaps = 0
  for (let k = 1; k < visual.length; k++) {
    const previous = items[visual[k - 1]]
    gaps += items[visual[k]].start - (previous.start + previous.size)
  }
  const gap = gaps / (visual.length - 1)
  let cursor = items[visual[0]].start
  return items.map((item) => {
    const rect = { start: cursor, size: item.size }
    cursor += item.size + gap
    return rect
  })
}

/**
 * Drops the `undefined` entries of a style object: Vue's `mergeProps` lets a
 * later `undefined` override a consumer's value for the same property.
 */
export function compactStyle(style: Record<string, string | number | undefined>): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const key in style) {
    const value = style[key]
    if (value !== undefined)
      out[key] = value
  }
  return out
}
