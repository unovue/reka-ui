/**
 * Range Selection State — shared seam for day, month, and year range pickers.
 *
 * This module defines a granularity-agnostic range selection state machine
 * parameterized by a GranularityAdapter. Picker shells adapt their raw props
 * and matchers into this contract; the shared state produces normalized outputs.
 *
 * @module range-selection-state
 */

import type { Ref } from 'vue'
import type { TemporalDate } from '@/temporal/types'
import { computed } from 'vue'

/**
 * Adapter that abstracts a specific temporal granularity (day, month, year).
 * Each picker shell supplies one of these to parameterize the shared state machine.
 */
export interface GranularityAdapter<T extends TemporalDate = TemporalDate> {
  /** Are two values at the same granularity unit? (e.g. same day, same month, same year) */
  areEqual: (a: T, b: T) => boolean

  /**
   * Compare two values: negative if a < b, 0 if equal, positive if a > b.
   * Used for ordering checks (is range reversed?).
   */
  compare: (a: T, b: T) => number

  /** Is `date` between `start` and `end` (inclusive at both ends)? */
  isBetweenInclusive: (date: T, start: T, end: T) => boolean

  /**
   * Inclusive count of units from `start` to `end` (both endpoints counted).
   * A span of 1 means start === end; a span of 3 means three consecutive units.
   */
  getSpanCount: (start: T, end: T) => number

  /** Add `amount` units to `date`. Negative amount subtracts. */
  addUnits: (date: T, amount: number) => T

  /**
   * Iterate units strictly between `start` and `end` (exclusive) and return
   * `false` if any unit satisfies `isBlocked`. Returns `true` if no interior
   * unit is blocked, or if start === end (no interior).
   */
  areAllInteriorUnitsValid: (
    start: T,
    end: T,
    isBlocked: (unit: T) => boolean,
  ) => boolean
}

/** Normalized predicate: determines whether a unit may be an endpoint. */
export type EndpointSelectability<T extends TemporalDate = TemporalDate>
  = (unit: T) => boolean

/** Normalized predicate: determines whether a unit blocks a contiguous span. */
export type InteriorBlocking<T extends TemporalDate = TemporalDate>
  = (unit: T) => boolean

/** Metadata about which selected endpoint should receive keyboard focus. */
export interface SelectedFocusableUnit<T extends TemporalDate = TemporalDate> {
  /** Whether any selected endpoint exists. */
  hasSelectedUnit: boolean
  /** Whether the selected endpoints themselves are selectable (not disabled). */
  areEndpointsSelectable: boolean
  /** The preferred unit for keyboard focus, if any. */
  preferredFocusUnit: T | undefined
}

/**
 * Input to the shared range selection state machine.
 * Picker shells construct this from their component props.
 */
export interface RangeSelectionStateInput<T extends TemporalDate = TemporalDate> {
  /** Granularity adapter for comparison, arithmetic, and iteration. */
  adapter: GranularityAdapter<T>
  /** Current selected start endpoint. */
  start: Ref<T | undefined>
  /** Current selected end endpoint. */
  end: Ref<T | undefined>
  /**
   * Predicate determining whether a unit is disabled as an endpoint.
   * The picker shell combines raw disabled/unavailable matchers into this.
   */
  isEndpointDisabled: EndpointSelectability<T>
  /**
   * Predicate determining whether a unit blocks a contiguous span interior.
   * When non-contiguous ranges are allowed, this is () => false.
   */
  isInteriorBlocked: InteriorBlocking<T>
  /** The currently focused/hovered unit (for preview highlighting). */
  focusedValue: Ref<T | undefined>
  /**
   * When true, interior blocking is bypassed — ranges can span over
   * unavailable units.
   */
  allowNonContiguousRanges: Ref<boolean>
  /**
   * When set, one endpoint is fixed and the other can move.
   * Controls preview rendering and maximum span enforcement origin.
   */
  fixedEndpoint: Ref<'start' | 'end' | undefined>
  /**
   * Maximum inclusive span count. When set, the range cannot exceed this many
   * consecutive units (including both endpoints). A maximum of 3 means at most
   * 3 selected days/months/years.
   */
  maximumSpan?: Ref<number | undefined>
}

/**
 * Return value of the shared range selection state machine.
 * Picker shells map these normalized outputs to their component context.
 */
export interface RangeSelectionState<T extends TemporalDate = TemporalDate> {
  /** Whether the current range is invalid (disabled endpoints or reversed). */
  isInvalid: Ref<boolean>
  /** Whether `unit` falls within the selected range (inclusive). */
  isSelected: (unit: T) => boolean
  /**
   * The pending highlight range (from anchor to focused value).
   * `null` when both endpoints are set with no fixed endpoint (complete range),
   * or when no anchor/focused value is available.
   */
  highlightedRange: Ref<{ start: T, end: T } | null>
  /** Whether `unit` matches the selected start endpoint. */
  isSelectionStart: (unit: T) => boolean
  /** Whether `unit` matches the selected end endpoint. */
  isSelectionEnd: (unit: T) => boolean
  /** Whether `unit` is the start of the highlighted preview range. */
  isHighlightedStart: (unit: T) => boolean
  /** Whether `unit` is the end of the highlighted preview range. */
  isHighlightedEnd: (unit: T) => boolean
  /**
   * Wrapped disabled check that includes base endpoint disablement
   * AND maximum span enforcement. Picker shells use this for their
   * isDateDisabled / isMonthDisabled / isYearDisabled context.
   */
  isUnitDisabled: (unit: T) => boolean
  /**
   * Normalized selected-focusable-unit metadata.
   * Picker shells decide whether/how to consume this for tabindex logic.
   */
  selectedFocusableUnit: Ref<SelectedFocusableUnit<T>>
}

/**
 * Whether a candidate unit falls within the inclusive maximum span
 * from an anchor unit. Used for both forward (candidate ≥ anchor) and
 * backward (candidate ≤ anchor) enforcement.
 */
function isWithinMaxSpan<T extends TemporalDate>(
  adapter: GranularityAdapter<T>,
  anchor: T,
  candidate: T,
  maximumSpan: number,
): boolean {
  const diff = adapter.getSpanCount(anchor, candidate)
  return diff <= maximumSpan
}

/**
 * Create a shared range selection state machine parameterized by a
 * granularity adapter. This is the core seam that unifies day, month,
 * and year range selection behavior.
 */
export function useRangeSelectionState<T extends TemporalDate>(
  input: RangeSelectionStateInput<T>,
): RangeSelectionState<T> {
  const {
    adapter,
    start,
    end,
    isEndpointDisabled,
    isInteriorBlocked,
    focusedValue,
    allowNonContiguousRanges,
    fixedEndpoint,
    maximumSpan,
  } = input

  const isStartInvalid = computed(() => {
    if (!start.value)
      return false
    return isEndpointDisabled(start.value)
  })

  const isEndInvalid = computed(() => {
    if (!end.value)
      return false
    return isEndpointDisabled(end.value)
  })

  const isInvalid = computed(() => {
    if (isStartInvalid.value || isEndInvalid.value)
      return true
    if (start.value && end.value && adapter.compare(end.value, start.value) < 0)
      return true
    return false
  })

  const isSelectionStart = (unit: T) => {
    if (!start.value)
      return false
    return adapter.areEqual(start.value, unit)
  }

  const isSelectionEnd = (unit: T) => {
    if (!end.value)
      return false
    return adapter.areEqual(end.value, unit)
  }

  const isSelected = (unit: T) => {
    if (start.value && adapter.areEqual(start.value, unit))
      return true
    if (end.value && adapter.areEqual(end.value, unit))
      return true
    if (end.value && start.value)
      return adapter.isBetweenInclusive(unit, start.value, end.value)
    return false
  }

  /**
   * Wrapped disabled check that includes base disablement AND maximum span
   * enforcement from the fixed endpoint (or from start when no fixed endpoint).
   */
  const isUnitDisabled = (unit: T) => {
    if (isEndpointDisabled(unit))
      return true

    if (!maximumSpan?.value)
      return false

    const max = maximumSpan.value

    if (start.value && end.value) {
      if (fixedEndpoint.value) {
        // Fixed endpoint: restrict to valid span from that endpoint,
        // regardless of whether the current range is over or under maximum.
        const fixed = fixedEndpoint.value === 'start' ? start.value : end.value
        return !isWithinMaxSpan(adapter, fixed, unit, max)
      }
      // Complete range, no fixed endpoint — no max span restriction
      return false
    }

    if (start.value) {
      // Only start set — restrict to valid span from start
      return !isWithinMaxSpan(adapter, start.value, unit, max)
    }

    return false
  }

  /**
   * Effective interior blocking predicate. When non-contiguous ranges are
   * allowed, interior blocking is bypassed (returns false for all units).
   */
  const effectiveInteriorBlocking = (unit: T) => {
    if (allowNonContiguousRanges.value)
      return false
    return isInteriorBlocked(unit)
  }

  const highlightedRange = computed(() => {
    // No implicit anchor: complete range without fixed endpoint → no preview
    if (start.value && end.value && !fixedEndpoint.value)
      return null
    // Need at least an anchor and a focused value
    if (!start.value || !focusedValue.value)
      return null

    const anchor = start.value
    const moving = focusedValue.value

    if (adapter.areEqual(anchor, moving))
      return { start: anchor, end: moving }

    // Maximum span capping for incomplete ranges
    if (maximumSpan?.value && !end.value) {
      const max = maximumSpan.value
      if (adapter.compare(moving, anchor) >= 0) {
        // Forward: cap end to anchor + (max - 1)
        const maxEnd = adapter.addUnits(anchor, max - 1)
        const cappedEnd = adapter.compare(moving, maxEnd) > 0 ? maxEnd : moving
        return { start: anchor, end: cappedEnd }
      }
      else {
        // Backward: cap start to anchor - (max - 1)
        const minStart = adapter.addUnits(anchor, -(max - 1))
        const cappedStart = adapter.compare(moving, minStart) < 0 ? minStart : moving
        return { start: cappedStart, end: anchor }
      }
    }

    // Validate interior units
    const isUnitBlocked = (unit: T) => {
      return effectiveInteriorBlocking(unit) || isUnitDisabled(unit)
    }
    const isValid = adapter.areAllInteriorUnitsValid(anchor, moving, isUnitBlocked)
    return isValid ? { start: anchor, end: moving } : null
  })

  const isHighlightedStart = (unit: T) => {
    if (!highlightedRange.value?.start)
      return false
    return adapter.areEqual(highlightedRange.value.start, unit)
  }

  const isHighlightedEnd = (unit: T) => {
    if (!highlightedRange.value?.end)
      return false
    return adapter.areEqual(highlightedRange.value.end, unit)
  }

  const selectedFocusableUnit = computed<SelectedFocusableUnit<T>>(() => {
    const hasSelected = !!(start.value || end.value)
    const startSelectable = !!(start.value && !isEndpointDisabled(start.value))
    const endSelectable = !!(end.value && !isEndpointDisabled(end.value))

    let preferred: T | undefined
    if (startSelectable)
      preferred = start.value
    else if (endSelectable)
      preferred = end.value

    return {
      hasSelectedUnit: hasSelected,
      areEndpointsSelectable: startSelectable || endSelectable,
      preferredFocusUnit: preferred,
    }
  })

  return {
    isInvalid,
    isSelected,
    highlightedRange,
    isSelectionStart,
    isSelectionEnd,
    isHighlightedStart,
    isHighlightedEnd,
    isUnitDisabled,
    selectedFocusableUnit,
  }
}
