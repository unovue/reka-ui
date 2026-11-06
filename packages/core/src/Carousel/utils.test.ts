import type { CarouselItemRect } from './utils'
import { describe, expect, it } from 'vitest'
import {
  computeSnaps,
  getItemsInView,
  getItemSnapStyles,
  getLoopOrder,
  getNearestSnapIndex,
  getSnapsByPosition,
  getUnrotatedRects,
  groupItems,
  stepIndex,
} from './utils'

/** `count` items of `size` laid out back to back from 0. */
function track(count: number, size = 100, gap = 0): CarouselItemRect[] {
  return Array.from({ length: count }, (_, i) => ({ start: i * (size + gap), size }))
}

function positions(options: Parameters<typeof computeSnaps>[0]) {
  return computeSnaps(options).snaps.map(snap => snap.position)
}

describe('groupItems', () => {
  it('groups by a fixed number', () => {
    expect(groupItems(track(5), 300, 2)).toEqual([[0, 1], [2, 3], [4]])
  })

  it('groups as many items as fit with auto', () => {
    expect(groupItems(track(7), 300, 'auto')).toEqual([[0, 1, 2], [3, 4, 5], [6]])
  })

  it('keeps at least one item per group when an item is wider than the viewport', () => {
    expect(groupItems(track(2, 400), 300, 'auto')).toEqual([[0], [1]])
  })
})

describe('computeSnaps', () => {
  const base = { viewportSize: 300, align: 'start' as const, slidesToScroll: 1, containScroll: 'trimSnaps' as const }

  it('aligns one item per snap to the start', () => {
    expect(positions({ ...base, items: track(3, 300), maxScroll: 600 })).toEqual([0, 300, 600])
  })

  it('trims the snaps that would leave empty space at the end', () => {
    const { snaps } = computeSnaps({ ...base, items: track(5), maxScroll: 200 })
    expect(snaps.map(s => s.position)).toEqual([0, 100, 200])
    // The last snap brings every remaining item into place.
    expect(snaps[2].items).toEqual([2, 3, 4])
  })

  it('keeps a snap per group with keepSnaps', () => {
    expect(positions({ ...base, containScroll: 'keepSnaps', items: track(5), maxScroll: 200 })).toEqual([0, 100, 200, 200, 200])
  })

  it('centers items, clamped at the ends', () => {
    expect(positions({ ...base, align: 'center', items: track(5), maxScroll: 200 })).toEqual([0, 100, 200])
  })

  it('aligns items to the end', () => {
    expect(positions({ ...base, align: 'end', items: track(5), maxScroll: 200 })).toEqual([0, 100, 200])
  })

  it('adds space at the ends instead of clamping with containScroll false', () => {
    const result = computeSnaps({ ...base, align: 'center', containScroll: false, items: track(5), maxScroll: 200 })
    expect(result.spacing).toEqual({ start: 100, end: 100 })
    expect(result.snaps.map(s => s.position)).toEqual([0, 100, 200, 300, 400])
  })

  it('snaps by group with slidesToScroll', () => {
    expect(positions({ ...base, slidesToScroll: 2, items: track(6), maxScroll: 300 })).toEqual([0, 200, 300])
  })

  it('never trims in a loop', () => {
    const { snaps } = computeSnaps({ ...base, loop: true, items: track(5), maxScroll: 200 })
    expect(snaps).toHaveLength(5)
  })

  it('measures a group wrapped by a loop rotation by its unrotated length', () => {
    // Rotated so item 4 comes first: items 4, 0, 1, 2, 3.
    const rotated = [100, 200, 300, 400, 0].map(start => ({ start, size: 100 }))
    const { snaps } = computeSnaps({ ...base, loop: true, slidesToScroll: 2, items: rotated, baseItems: track(5), maxScroll: 200 })
    expect(snaps.map(s => s.items)).toEqual([[0, 1], [2, 3], [4]])
    expect(snaps.map(s => s.position)).toEqual([100, 200, 0])
  })
})

describe('getNearestSnapIndex', () => {
  const snaps = [0, 100, 200].map(position => ({ position, items: [] }))

  it('picks the closest snap', () => {
    expect(getNearestSnapIndex(140, snaps)).toBe(1)
    expect(getNearestSnapIndex(160, snaps)).toBe(2)
  })

  it('picks the first of two equally close snaps', () => {
    expect(getNearestSnapIndex(50, snaps)).toBe(0)
  })
})

describe('getSnapsByPosition', () => {
  it('orders the snap indices visually', () => {
    expect(getSnapsByPosition([300, 0, 100].map(position => ({ position, items: [] })))).toEqual([1, 2, 0])
  })
})

describe('getItemsInView', () => {
  it('counts any visible part with a zero threshold', () => {
    expect(getItemsInView(track(4), 50, 200, 0)).toEqual([true, true, true, false])
  })

  it('ignores items that only touch the viewport edge', () => {
    expect(getItemsInView(track(4), 100, 200, 0)).toEqual([false, true, true, false])
  })

  it('needs the threshold fraction visible', () => {
    expect(getItemsInView(track(4), 50, 200, 0.6)).toEqual([false, true, false, false])
  })
})

describe('getItemSnapStyles', () => {
  it('snaps the first item of each group to the start', () => {
    expect(getItemSnapStyles(4, [[0, 1], [2, 3]], 'start')).toEqual([{ align: 'start' }, {}, { align: 'start' }, {}])
  })

  it('snaps the last item of each group to the end', () => {
    expect(getItemSnapStyles(4, [[0, 1], [2, 3]], 'end')).toEqual([{}, { align: 'end' }, {}, { align: 'end' }])
  })

  it('snaps the middle item of an odd group to the center', () => {
    expect(getItemSnapStyles(3, [[0, 1, 2]], 'center')).toEqual([{}, { align: 'center' }, {}])
  })

  it('centers an even group with a scroll margin on its first item', () => {
    expect(getItemSnapStyles(2, [[0, 1]], 'center', track(2), 300)).toEqual([{ align: 'start', margin: 50 }, {}])
  })
})

describe('loop helpers', () => {
  it('rotates the anchor to the middle', () => {
    expect(getLoopOrder(5, 0, 1)).toEqual([2, 3, 4, 0, 1])
    expect(getLoopOrder(5, 4, 1)).toEqual([3, 4, 0, 1, 2])
  })

  it('rebuilds the unrotated layout from a rotated one', () => {
    const rotated = [220, 330, 440, 0, 110].map(start => ({ start, size: 100 }))
    expect(getUnrotatedRects(rotated)).toEqual(track(5, 100, 10))
  })

  it('steps with and without wrapping', () => {
    expect(stepIndex(4, 1, 5, true)).toBe(0)
    expect(stepIndex(0, -1, 5, true)).toBe(4)
    expect(stepIndex(4, 1, 5, false)).toBeUndefined()
  })
})
