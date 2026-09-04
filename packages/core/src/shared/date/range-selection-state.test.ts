/**
 * Tests for the shared Range Selection State seam.
 *
 * These tests exercise the contract through the public interface — no
 * implementation details, no component shells. They cover the same
 * behavior across day, month, and year adapters to validate the
 * granularity-agnostic design.
 */

import type { GranularityAdapter, RangeSelectionStateInput } from './range-selection-state'
import { Temporal } from 'temporal-polyfill'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { dayAdapter, monthAdapter, yearAdapter } from './range-selection-adapters'
import { useRangeSelectionState } from './range-selection-state'

/** Helper: create input refs from plain values */
function makeInput<T extends Temporal.DateLike>(
  adapter: GranularityAdapter,
  overrides: {
    start?: T | null
    end?: T | null
    isEndpointDisabled?: (unit: any) => boolean
    isInteriorBlocked?: (unit: any) => boolean
    focusedValue?: T | null
    allowNonContiguousRanges?: boolean
    fixedEndpoint?: 'start' | 'end' | null
    maximumSpan?: number | null
  } = {},
): RangeSelectionStateInput {
  const toTemporal = (v: T | null | undefined) => {
    if (v === null || v === undefined)
      return undefined
    if ('day' in v && 'month' in v && 'year' in v && !('hour' in v))
      return Temporal.PlainDate.from(v as any)
    return Temporal.PlainDate.from(v as any)
  }

  return {
    adapter,
    start: ref(toTemporal(overrides.start as any)) as any,
    end: ref(toTemporal(overrides.end as any)) as any,
    isEndpointDisabled: overrides.isEndpointDisabled ?? (() => false),
    isInteriorBlocked: overrides.isInteriorBlocked ?? (() => false),
    focusedValue: ref(toTemporal(overrides.focusedValue as any)) as any,
    allowNonContiguousRanges: ref(overrides.allowNonContiguousRanges ?? false) as any,
    fixedEndpoint: ref(overrides.fixedEndpoint ?? undefined) as any,
    maximumSpan: overrides.maximumSpan != null ? ref(overrides.maximumSpan) as any : undefined,
  }
}

function date(y: number, m: number, d: number) {
  return Temporal.PlainDate.from({ year: y, month: m, day: d })
}

// ─── 1. No implicit anchor after complete range ────────────────────

describe('no implicit anchor after complete range selection', () => {
  it('day: highlightedRange is null when both endpoints set and no fixed endpoint', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      focusedValue: { year: 2024, month: 1, day: 22 },
      fixedEndpoint: null,
    })
    const state = useRangeSelectionState(input)
    expect(state.highlightedRange.value).toBeNull()
  })

  it('month: highlightedRange is null when both endpoints set and no fixed endpoint', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      end: { year: 2024, month: 6, day: 1 },
      focusedValue: { year: 2024, month: 3, day: 1 },
      fixedEndpoint: null,
    })
    const state = useRangeSelectionState(input)
    expect(state.highlightedRange.value).toBeNull()
  })

  it('year: highlightedRange is null when both endpoints set and no fixed endpoint', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 1 },
      focusedValue: { year: 2022, month: 1, day: 1 },
      fixedEndpoint: null,
    })
    const state = useRangeSelectionState(input)
    expect(state.highlightedRange.value).toBeNull()
  })
})

// ─── 2. Inclusive maximum span ─────────────────────────────────────

describe('inclusive maximum span', () => {
  describe('day adapter', () => {
    it('allows exactly maximumSpan units (inclusive)', () => {
      // maximumSpan = 3 means Jan 20, 21, 22 are valid; Jan 23 is blocked
      const input = makeInput(dayAdapter, {
        start: { year: 2024, month: 1, day: 20 },
        maximumSpan: 3,
      })
      const state = useRangeSelectionState(input)

      expect(state.isUnitDisabled(date(2024, 1, 20))).toBe(false) // anchor
      expect(state.isUnitDisabled(date(2024, 1, 21))).toBe(false) // +1
      expect(state.isUnitDisabled(date(2024, 1, 22))).toBe(false) // +2, at max
      expect(state.isUnitDisabled(date(2024, 1, 23))).toBe(true) // +3, over max
      expect(state.isUnitDisabled(date(2024, 1, 19))).toBe(false) // -1, within max
      expect(state.isUnitDisabled(date(2024, 1, 18))).toBe(false) // -2, at max
      expect(state.isUnitDisabled(date(2024, 1, 17))).toBe(true) // -3, over max
    })

    it('blocks N+1 units', () => {
      const input = makeInput(dayAdapter, {
        start: { year: 2024, month: 1, day: 15 },
        maximumSpan: 3,
      })
      const state = useRangeSelectionState(input)
      // +3 from Jan 15 → Jan 17 (inclusive count = 3) → OK
      expect(state.isUnitDisabled(date(2024, 1, 17))).toBe(false)
      // +4 from Jan 15 → Jan 18 (inclusive count = 4) → blocked
      expect(state.isUnitDisabled(date(2024, 1, 18))).toBe(true)
    })
  })

  describe('month adapter', () => {
    it('allows exactly maximumSpan months (inclusive)', () => {
      const input = makeInput(monthAdapter, {
        start: { year: 2024, month: 1, day: 1 },
        maximumSpan: 3,
      })
      const state = useRangeSelectionState(input)

      expect(state.isUnitDisabled(date(2024, 1, 1))).toBe(false) // anchor
      expect(state.isUnitDisabled(date(2024, 2, 1))).toBe(false) // +1
      expect(state.isUnitDisabled(date(2024, 3, 1))).toBe(false) // +2, at max
      expect(state.isUnitDisabled(date(2024, 4, 1))).toBe(true) // +3, over max
      expect(state.isUnitDisabled(date(2023, 11, 1))).toBe(false) // backward exactly at max (inclusive span = 3)
      expect(state.isUnitDisabled(date(2023, 10, 1))).toBe(true) // backward over max (inclusive span = 4)
    })

    it('blocks N+1 months', () => {
      const input = makeInput(monthAdapter, {
        start: { year: 2024, month: 6, day: 1 },
        maximumSpan: 3,
      })
      const state = useRangeSelectionState(input)
      expect(state.isUnitDisabled(date(2024, 8, 1))).toBe(false) // at max
      expect(state.isUnitDisabled(date(2024, 9, 1))).toBe(true) // over max
    })
  })

  describe('year adapter', () => {
    it('allows exactly maximumSpan years (inclusive)', () => {
      const input = makeInput(yearAdapter, {
        start: { year: 2020, month: 1, day: 1 },
        maximumSpan: 3,
      })
      const state = useRangeSelectionState(input)

      expect(state.isUnitDisabled(date(2020, 1, 1))).toBe(false) // anchor
      expect(state.isUnitDisabled(date(2021, 1, 1))).toBe(false) // +1
      expect(state.isUnitDisabled(date(2022, 1, 1))).toBe(false) // +2, at max
      expect(state.isUnitDisabled(date(2023, 1, 1))).toBe(true) // +3, over max
      expect(state.isUnitDisabled(date(2017, 1, 1))).toBe(true) // backward over max
    })

    it('blocks N+1 years', () => {
      const input = makeInput(yearAdapter, {
        start: { year: 2010, month: 1, day: 1 },
        maximumSpan: 3,
      })
      const state = useRangeSelectionState(input)
      expect(state.isUnitDisabled(date(2012, 1, 1))).toBe(false) // at max
      expect(state.isUnitDisabled(date(2013, 1, 1))).toBe(true) // over max
    })
  })
})

// ─── 3. Highlighted preview with max span capping ─────────────────

describe('highlighted preview with max span capping', () => {
  it('day: caps forward highlight to max span', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      focusedValue: { year: 2024, month: 1, day: 30 }, // far ahead
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // Anchor = Jan 20, max = 3, so highlight end = Jan 22 (20 + 3 - 1)
    expect(state.highlightedRange.value).toEqual({
      start: date(2024, 1, 20),
      end: date(2024, 1, 22),
    })
  })

  it('day: caps backward highlight to max span', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      focusedValue: { year: 2024, month: 1, day: 10 }, // far behind
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // Anchor = Jan 20, max = 3, so highlight start = Jan 18 (20 - 3 + 1)
    expect(state.highlightedRange.value).toEqual({
      start: date(2024, 1, 18),
      end: date(2024, 1, 20),
    })
  })

  it('month: caps forward highlight to max span', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      focusedValue: { year: 2024, month: 12, day: 1 },
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // Anchor = Jan, max = 3, so highlight end = Mar (1 + 3 - 1)
    expect(state.highlightedRange.value).toEqual({
      start: date(2024, 1, 1),
      end: date(2024, 3, 1),
    })
  })

  it('year: caps backward highlight to max span', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      focusedValue: { year: 2010, month: 1, day: 1 },
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // Anchor = 2020, max = 3, so highlight start = 2018 (2020 - 3 + 1)
    expect(state.highlightedRange.value).toEqual({
      start: date(2018, 1, 1),
      end: date(2020, 1, 1),
    })
  })
})

// ─── 4. Fixed endpoint behavior ───────────────────────────────────

describe('fixed endpoint behavior', () => {
  it('highlightedRange is present when both endpoints set with fixed start', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      focusedValue: { year: 2024, month: 1, day: 22 },
      fixedEndpoint: 'start',
    })
    const state = useRangeSelectionState(input)
    // With fixed endpoint, highlight shows the pending move
    expect(state.highlightedRange.value).not.toBeNull()
  })

  it('fixed start: max span enforced from start endpoint', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      fixedEndpoint: 'start',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // With fixed start, max span from start = Jan 20..22
    expect(state.isUnitDisabled(date(2024, 1, 22))).toBe(false) // at max from start
    expect(state.isUnitDisabled(date(2024, 1, 23))).toBe(true) // over max from start
  })

  it('fixed end: max span enforced from end endpoint', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      fixedEndpoint: 'end',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // With fixed end, max span from end = Jan 23..25
    expect(state.isUnitDisabled(date(2024, 1, 23))).toBe(false) // at max from end
    expect(state.isUnitDisabled(date(2024, 1, 22))).toBe(true) // over max from end
  })

  it('month: fixed start max span enforcement', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      end: { year: 2024, month: 6, day: 1 },
      fixedEndpoint: 'start',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // With fixed start, max span from start = Jan..Mar
    expect(state.isUnitDisabled(date(2024, 3, 1))).toBe(false) // at max from start
    expect(state.isUnitDisabled(date(2024, 4, 1))).toBe(true) // over max from start
  })

  it('month: fixed end max span enforcement', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      end: { year: 2024, month: 6, day: 1 },
      fixedEndpoint: 'end',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // With fixed end, max span from end = Apr..Jun
    expect(state.isUnitDisabled(date(2024, 4, 1))).toBe(false) // at max from end
    expect(state.isUnitDisabled(date(2024, 3, 1))).toBe(true) // over max from end
  })

  it('year: fixed start max span enforcement', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 1 },
      fixedEndpoint: 'start',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // With fixed start, max span from start = 2020..2022
    expect(state.isUnitDisabled(date(2022, 1, 1))).toBe(false) // at max from start
    expect(state.isUnitDisabled(date(2023, 1, 1))).toBe(true) // over max from start
  })

  it('year: fixed end max span enforcement', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 1 },
      fixedEndpoint: 'end',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // With fixed end, max span from end = 2023..2025
    expect(state.isUnitDisabled(date(2023, 1, 1))).toBe(false) // at max from end
    expect(state.isUnitDisabled(date(2022, 1, 1))).toBe(true) // over max from end
  })
})

// ─── 4b. Over-maximum recovery with fixed endpoint ──────────────────

describe('over-maximum recovery with fixed endpoint', () => {
  it('day: fixed start restricts candidates to valid span when range exceeds max', () => {
    // Start=Jan 20, End=Jan 25 (inclusive span=6), max=3, fixed=start
    // Candidates should be restricted to Jan 20..22 from fixed start
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      fixedEndpoint: 'start',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)

    // Within valid span from fixed start
    expect(state.isUnitDisabled(date(2024, 1, 20))).toBe(false) // fixed start itself
    expect(state.isUnitDisabled(date(2024, 1, 21))).toBe(false) // inside span
    expect(state.isUnitDisabled(date(2024, 1, 22))).toBe(false) // at max (inclusive count=3)
    // Outside valid span from fixed start
    expect(state.isUnitDisabled(date(2024, 1, 23))).toBe(true) // was actual end, but blocked
    expect(state.isUnitDisabled(date(2024, 1, 24))).toBe(true)
    expect(state.isUnitDisabled(date(2024, 1, 19))).toBe(false) // backward still within max
  })

  it('day: fixed end restricts candidates to valid span when range exceeds max', () => {
    // Start=Jan 20, End=Jan 25 (inclusive span=6), max=3, fixed=end
    // Candidates should be restricted to Jan 23..25 from fixed end
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      fixedEndpoint: 'end',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)

    expect(state.isUnitDisabled(date(2024, 1, 25))).toBe(false) // fixed end itself
    expect(state.isUnitDisabled(date(2024, 1, 24))).toBe(false) // inside span
    expect(state.isUnitDisabled(date(2024, 1, 23))).toBe(false) // at max (inclusive count=3)
    expect(state.isUnitDisabled(date(2024, 1, 22))).toBe(true) // was actual start, but blocked
    expect(state.isUnitDisabled(date(2024, 1, 21))).toBe(true)
  })

  it('month: fixed start restricts candidates to valid span when range exceeds max', () => {
    // Start=Jan, End=Jun (inclusive span=6), max=3, fixed=start
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      end: { year: 2024, month: 6, day: 1 },
      fixedEndpoint: 'start',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)

    expect(state.isUnitDisabled(date(2024, 1, 1))).toBe(false) // fixed start
    expect(state.isUnitDisabled(date(2024, 2, 1))).toBe(false)
    expect(state.isUnitDisabled(date(2024, 3, 1))).toBe(false) // at max
    expect(state.isUnitDisabled(date(2024, 4, 1))).toBe(true) // over max (was actual end)
    expect(state.isUnitDisabled(date(2023, 12, 1))).toBe(false) // backward within max
  })

  it('month: fixed end restricts candidates to valid span when range exceeds max', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      end: { year: 2024, month: 6, day: 1 },
      fixedEndpoint: 'end',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)

    expect(state.isUnitDisabled(date(2024, 6, 1))).toBe(false) // fixed end
    expect(state.isUnitDisabled(date(2024, 5, 1))).toBe(false)
    expect(state.isUnitDisabled(date(2024, 4, 1))).toBe(false) // at max
    expect(state.isUnitDisabled(date(2024, 3, 1))).toBe(true) // over max (was actual start)
  })

  it('year: fixed start restricts candidates to valid span when range exceeds max', () => {
    // Start=2020, End=2025 (inclusive span=6), max=3, fixed=start
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 1 },
      fixedEndpoint: 'start',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)

    expect(state.isUnitDisabled(date(2020, 1, 1))).toBe(false) // fixed start
    expect(state.isUnitDisabled(date(2021, 1, 1))).toBe(false)
    expect(state.isUnitDisabled(date(2022, 1, 1))).toBe(false) // at max
    expect(state.isUnitDisabled(date(2023, 1, 1))).toBe(true) // over max (was actual end)
    expect(state.isUnitDisabled(date(2019, 1, 1))).toBe(false) // backward within max
  })

  it('year: fixed end restricts candidates to valid span when range exceeds max', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 1 },
      fixedEndpoint: 'end',
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)

    expect(state.isUnitDisabled(date(2025, 1, 1))).toBe(false) // fixed end
    expect(state.isUnitDisabled(date(2024, 1, 1))).toBe(false)
    expect(state.isUnitDisabled(date(2023, 1, 1))).toBe(false) // at max
    expect(state.isUnitDisabled(date(2022, 1, 1))).toBe(true) // over max (was actual start)
  })

  it('no fixed endpoint: complete range clears max span restriction', () => {
    // Complete range with no fixed endpoint → no max span enforcement
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      fixedEndpoint: null,
      maximumSpan: 3,
    })
    const state = useRangeSelectionState(input)
    // When both endpoints are set and no fixed endpoint, max span is not enforced
    expect(state.isUnitDisabled(date(2024, 1, 25))).toBe(false)
    expect(state.isUnitDisabled(date(2024, 1, 30))).toBe(false)
  })
})

// ─── 5. Endpoint selectability ────────────────────────────────────

describe('endpoint selectability', () => {
  it('marks disabled endpoints as invalid', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      isEndpointDisabled: (d: any) => d.day === 20,
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true) // start is disabled
  })

  it('marks reversed range as invalid', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 25 },
      end: { year: 2024, month: 1, day: 20 },
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true)
  })

  it('does not mark valid range as invalid', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(false)
  })

  it('month: marks disabled endpoints as invalid', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      end: { year: 2024, month: 6, day: 1 },
      isEndpointDisabled: (d: any) => d.month === 1,
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true) // start is disabled
  })

  it('month: reversed range is invalid', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 6, day: 1 },
      end: { year: 2024, month: 1, day: 1 },
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true)
  })

  it('year: marks disabled endpoints as invalid', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 1 },
      isEndpointDisabled: (d: any) => d.year === 2020,
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true) // start is disabled
  })

  it('year: reversed range is invalid', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2025, month: 1, day: 1 },
      end: { year: 2020, month: 1, day: 1 },
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true)
  })
})

// ─── 6. Interior blocking ─────────────────────────────────────────

describe('interior blocking', () => {
  it('day: highlightedRange is null when interior unit is blocked', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      focusedValue: { year: 2024, month: 1, day: 23 },
      isInteriorBlocked: (d: any) => d.day === 21,
    })
    const state = useRangeSelectionState(input)
    // Day 21 is blocked between 20 and 23 → no highlight
    expect(state.highlightedRange.value).toBeNull()
  })

  it('day: highlightedRange is present when interior is clear', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      focusedValue: { year: 2024, month: 1, day: 23 },
      isInteriorBlocked: () => false,
    })
    const state = useRangeSelectionState(input)
    expect(state.highlightedRange.value).toEqual({
      start: date(2024, 1, 20),
      end: date(2024, 1, 23),
    })
  })

  it('allowNonContiguousRanges bypasses interior blocking', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      focusedValue: { year: 2024, month: 1, day: 23 },
      isInteriorBlocked: (d: any) => d.day === 21,
      allowNonContiguousRanges: true,
    })
    const state = useRangeSelectionState(input)
    // Non-contiguous: blocked interior should be ignored
    expect(state.highlightedRange.value).toEqual({
      start: date(2024, 1, 20),
      end: date(2024, 1, 23),
    })
  })

  it('month: highlightedRange is null when interior unit is blocked', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      focusedValue: { year: 2024, month: 3, day: 1 },
      isInteriorBlocked: (d: any) => d.month === 2,
    })
    const state = useRangeSelectionState(input)
    // February is blocked between Jan and Mar → no highlight
    expect(state.highlightedRange.value).toBeNull()
  })

  it('month: highlightedRange is present when interior is clear', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      focusedValue: { year: 2024, month: 3, day: 1 },
      isInteriorBlocked: () => false,
    })
    const state = useRangeSelectionState(input)
    expect(state.highlightedRange.value).toEqual({
      start: date(2024, 1, 1),
      end: date(2024, 3, 1),
    })
  })

  it('month: allowNonContiguousRanges bypasses interior blocking', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      focusedValue: { year: 2024, month: 3, day: 1 },
      isInteriorBlocked: (d: any) => d.month === 2,
      allowNonContiguousRanges: true,
    })
    const state = useRangeSelectionState(input)
    expect(state.highlightedRange.value).toEqual({
      start: date(2024, 1, 1),
      end: date(2024, 3, 1),
    })
  })

  it('year: highlightedRange is null when interior unit is blocked', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      focusedValue: { year: 2023, month: 1, day: 1 },
      isInteriorBlocked: (d: any) => d.year === 2021,
    })
    const state = useRangeSelectionState(input)
    // 2021 is blocked between 2020 and 2023 → no highlight
    expect(state.highlightedRange.value).toBeNull()
  })

  it('year: highlightedRange is present when interior is clear', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      focusedValue: { year: 2022, month: 1, day: 1 },
      isInteriorBlocked: () => false,
    })
    const state = useRangeSelectionState(input)
    expect(state.highlightedRange.value).toEqual({
      start: date(2020, 1, 1),
      end: date(2022, 1, 1),
    })
  })

  it('year: allowNonContiguousRanges bypasses interior blocking', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      focusedValue: { year: 2023, month: 1, day: 1 },
      isInteriorBlocked: (d: any) => d.year === 2021,
      allowNonContiguousRanges: true,
    })
    const state = useRangeSelectionState(input)
    expect(state.highlightedRange.value).toEqual({
      start: date(2020, 1, 1),
      end: date(2023, 1, 1),
    })
  })
})

// ─── 7. Selected focusable unit metadata ──────────────────────────

describe('selected focusable unit', () => {
  it('has no selected unit when both endpoints undefined', () => {
    const input = makeInput(dayAdapter)
    const state = useRangeSelectionState(input)
    expect(state.selectedFocusableUnit.value.hasSelectedUnit).toBe(false)
    expect(state.selectedFocusableUnit.value.preferredFocusUnit).toBeUndefined()
  })

  it('prefers start when start is selectable', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      isEndpointDisabled: () => false,
    })
    const state = useRangeSelectionState(input)
    expect(state.selectedFocusableUnit.value.hasSelectedUnit).toBe(true)
    expect(state.selectedFocusableUnit.value.preferredFocusUnit).toEqual(date(2024, 1, 20))
  })

  it('falls back to end when start is disabled', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      isEndpointDisabled: (d: any) => d.day === 20,
    })
    const state = useRangeSelectionState(input)
    expect(state.selectedFocusableUnit.value.preferredFocusUnit).toEqual(date(2024, 1, 25))
  })

  it('returns undefined when all endpoints disabled', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      isEndpointDisabled: () => true,
    })
    const state = useRangeSelectionState(input)
    expect(state.selectedFocusableUnit.value.preferredFocusUnit).toBeUndefined()
    expect(state.selectedFocusableUnit.value.areEndpointsSelectable).toBe(false)
  })

  it('month: prefers start endpoint', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      end: { year: 2024, month: 6, day: 1 },
    })
    const state = useRangeSelectionState(input)
    expect(state.selectedFocusableUnit.value.preferredFocusUnit).toEqual(date(2024, 1, 1))
  })

  it('year: prefers start endpoint', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      end: { year: 2025, month: 1, day: 1 },
    })
    const state = useRangeSelectionState(input)
    expect(state.selectedFocusableUnit.value.preferredFocusUnit).toEqual(date(2020, 1, 1))
  })
})

// ─── 8. Range invalidity ──────────────────────────────────────────

describe('range invalidity', () => {
  it('valid range is not invalid', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(false)
  })

  it('reversed range is invalid', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 25 },
      end: { year: 2024, month: 1, day: 20 },
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true)
  })

  it('disabled start is invalid', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      isEndpointDisabled: (d: any) => d.day === 20,
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true)
  })

  it('disabled end is invalid', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
      isEndpointDisabled: (d: any) => d.day === 25,
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true)
  })

  it('month: reversed range is invalid', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 6, day: 1 },
      end: { year: 2024, month: 1, day: 1 },
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true)
  })

  it('year: reversed range is invalid', () => {
    const input = makeInput(yearAdapter, {
      start: { year: 2025, month: 1, day: 1 },
      end: { year: 2020, month: 1, day: 1 },
    })
    const state = useRangeSelectionState(input)
    expect(state.isInvalid.value).toBe(true)
  })
})

// ─── 9. Selection state helpers ───────────────────────────────────

describe('selection state helpers', () => {
  it('isSelected returns true for start, end, and interior units', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 23 },
    })
    const state = useRangeSelectionState(input)

    expect(state.isSelected(date(2024, 1, 20))).toBe(true) // start
    expect(state.isSelected(date(2024, 1, 21))).toBe(true) // interior
    expect(state.isSelected(date(2024, 1, 22))).toBe(true) // interior
    expect(state.isSelected(date(2024, 1, 23))).toBe(true) // end
    expect(state.isSelected(date(2024, 1, 19))).toBe(false) // before range
    expect(state.isSelected(date(2024, 1, 24))).toBe(false) // after range
  })

  it('isSelectionStart and isSelectionEnd match endpoints', () => {
    const input = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 20 },
      end: { year: 2024, month: 1, day: 25 },
    })
    const state = useRangeSelectionState(input)

    expect(state.isSelectionStart(date(2024, 1, 20))).toBe(true)
    expect(state.isSelectionStart(date(2024, 1, 25))).toBe(false)
    expect(state.isSelectionEnd(date(2024, 1, 25))).toBe(true)
    expect(state.isSelectionEnd(date(2024, 1, 20))).toBe(false)
  })

  it('month: isSelected covers the range', () => {
    const input = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
      end: { year: 2024, month: 3, day: 1 },
    })
    const state = useRangeSelectionState(input)

    expect(state.isSelected(date(2024, 1, 1))).toBe(true)
    expect(state.isSelected(date(2024, 2, 1))).toBe(true)
    expect(state.isSelected(date(2024, 3, 1))).toBe(true)
    expect(state.isSelected(date(2024, 4, 1))).toBe(false)
  })
})

// ─── 10. Cross-granularity consistency ────────────────────────────

describe('cross-granularity consistency', () => {
  it('maximumSpan = 1 allows exactly one unit for all adapters', () => {
    // Day
    const dayInput = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 15 },
      maximumSpan: 1,
    })
    const dayState = useRangeSelectionState(dayInput)
    expect(dayState.isUnitDisabled(date(2024, 1, 15))).toBe(false)
    expect(dayState.isUnitDisabled(date(2024, 1, 16))).toBe(true)

    // Month
    const monthInput = makeInput(monthAdapter, {
      start: { year: 2024, month: 6, day: 1 },
      maximumSpan: 1,
    })
    const monthState = useRangeSelectionState(monthInput)
    expect(monthState.isUnitDisabled(date(2024, 6, 1))).toBe(false)
    expect(monthState.isUnitDisabled(date(2024, 7, 1))).toBe(true)

    // Year
    const yearInput = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
      maximumSpan: 1,
    })
    const yearState = useRangeSelectionState(yearInput)
    expect(yearState.isUnitDisabled(date(2020, 1, 1))).toBe(false)
    expect(yearState.isUnitDisabled(date(2021, 1, 1))).toBe(true)
  })

  it('no maximumSpan allows unlimited range for all adapters', () => {
    const dayInput = makeInput(dayAdapter, {
      start: { year: 2024, month: 1, day: 1 },
    })
    const dayState = useRangeSelectionState(dayInput)
    expect(dayState.isUnitDisabled(date(2024, 12, 31))).toBe(false)

    const monthInput = makeInput(monthAdapter, {
      start: { year: 2024, month: 1, day: 1 },
    })
    const monthState = useRangeSelectionState(monthInput)
    expect(monthState.isUnitDisabled(date(2025, 12, 1))).toBe(false)

    const yearInput = makeInput(yearAdapter, {
      start: { year: 2020, month: 1, day: 1 },
    })
    const yearState = useRangeSelectionState(yearInput)
    expect(yearState.isUnitDisabled(date(2030, 1, 1))).toBe(false)
  })
})
