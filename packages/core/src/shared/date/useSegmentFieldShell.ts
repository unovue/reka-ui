/*
 * Shared segment field shell.
 *
 * Owns the duplicated shell state that used to live in each field root:
 * formatter, step, granularity, invalidity, segment values, segment contents,
 * focus helpers, locale reactivity, and the hidden input normalisation.
 *
 * Field roots (DateField, TimeField, DateRangeField, TimeRangeField) stay public
 * adapters. They handle their own prop/emit/slot translation and delegate the
 * rest of the shell to this module.
 */

import type { Ref } from 'vue'
import type { Granularity } from './comparators'
import type {
  DateInputType,
  DateStep,
  HourCycle,
  SegmentPart,
  SegmentValueObj,
} from './types'
import type { Formatter } from '@/shared'
import type { Direction } from '@/shared/types'
import type { Matcher, TemporalDate } from '@/temporal/types'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { isNullish, useDateFormatter, useKbd } from '@/shared'
import {
  createContent,
  initializeSegmentValues,
  isSegmentNavigationKey,
  normalizeDateStep,
  normalizeHourCycle,
  normalizeInputValue,
  syncSegmentValues,
} from '@/shared/date'
import { compareTemporalDate, hasTime } from '@/temporal/comparators'

export type UseSegmentFieldShellProps = {
  /** DOM attribute name that marks a segment inside the field root. */
  segmentAttribute: string
  /** Resolved parent element to query for segments. */
  parentElement: Ref<HTMLElement | null>
  /** Locale resolved at the root. */
  locale: Ref<string>
  /** Reading direction. */
  dir: Ref<Direction>
  /** Controlled or uncontrolled model value. */
  modelValue: Ref<TemporalDate | undefined>
  /** Placeholder used for invalidity tracking and segment rendering. */
  placeholder: Ref<TemporalDate>
  /**
   * Override for the date reference used in segment content formatting.
   * Defaults to `placeholder.value`. TimeField uses this to pass a
   * `ZonedDateTime` so the time zone segment renders with the right zone.
   */
  dateRef?: Ref<TemporalDate>
  /** Granularity requested by the consumer. */
  granularity?: Ref<Granularity | undefined>
  /** Hour cycle used for formatting. */
  hourCycle?: HourCycle
  /** Whether to hide the time zone segment. */
  hideTimeZone?: boolean
  /** Step interval for time fields. */
  step?: DateStep
  /** Whether to snap time values to the step on focus out. */
  stepSnapping?: Ref<boolean>
  /** Whether the model is a time-only value (skips year/month/day formatting). */
  isTimeValue?: boolean
  /** Minimum allowed value. */
  minValue?: TemporalDate
  /** Maximum allowed value. */
  maxValue?: TemporalDate
  /** Unavailability matcher. */
  isDateUnavailable?: Matcher
  /** Disabled state. */
  disabled: Ref<boolean>
  /** Read-only state. */
  readonly: Ref<boolean>
  /**
   * Skip syncing the placeholder from the model value. Range fields pass
   * `true` to the end-side shell so editing the end side does not overwrite
   * the public placeholder (which tracks the start value).
   */
  disablePlaceholderUpdate?: boolean
}

export type SegmentFieldShellReturn = {
  formatter: Formatter
  hourCycle: HourCycle
  step: Ref<DateStep>
  stepSnapping: Ref<boolean>
  inferredGranularity: Ref<Granularity>
  isInvalid: Ref<boolean>
  segmentValues: Ref<SegmentValueObj>
  segmentContents: Ref<{ part: SegmentPart, value: string }[]>
  editableSegmentContents: Ref<{ part: SegmentPart, value: string }[]>
  segmentElements: Ref<Set<HTMLElement>>
  focusNext: () => void
  setFocusedElement: (el: HTMLElement) => void
  inputType: Ref<DateInputType>
  inputValue: Ref<string>
  inputMinValue: Ref<string | undefined>
  inputMaxValue: Ref<string | undefined>
  handleKeydown: (e: KeyboardEvent) => void
}

/**
 * Build the shared shell state for a single segment field.
 *
 * The shell does not know the public prop name or the emit shape; the field
 * root resolves the model/placeholder refs (controlled vs. uncontrolled) and
 * delegates everything else. The shell treats the value as a normalized
 * `TemporalDate` (or undefined) — public-shape differences stay at the root.
 */
export function useSegmentFieldShell(props: UseSegmentFieldShellProps): SegmentFieldShellReturn {
  const locale = computed(() => props.locale.value)
  const formatter = useDateFormatter(locale.value, {
    hourCycle: normalizeHourCycle(props.hourCycle),
  })

  const step = computed(() => normalizeDateStep({ step: props.step }))

  const inferredGranularity = computed<Granularity>(() => {
    const requested = props.granularity?.value
    if (requested)
      return !hasTime(props.placeholder.value) ? 'day' : requested

    return hasTime(props.placeholder.value) ? 'minute' : 'day'
  })

  const isInvalid = computed(() => {
    if (!props.modelValue.value)
      return false

    if (props.isDateUnavailable?.(props.modelValue.value))
      return true

    if (props.minValue && compareTemporalDate(props.modelValue.value, props.minValue) < 0)
      return true

    if (props.maxValue && compareTemporalDate(props.modelValue.value, props.maxValue) > 0)
      return true

    return false
  })

  const initialSegments = initializeSegmentValues(inferredGranularity.value)

  const segmentValues = ref<SegmentValueObj>(
    props.modelValue.value
      ? { ...syncSegmentValues({ value: props.modelValue.value, formatter }) }
      : { ...initialSegments },
  )

  const allSegmentContent = computed(() => createContent({
    granularity: inferredGranularity.value,
    dateRef: (props.dateRef?.value ?? props.placeholder.value),
    formatter,
    hideTimeZone: !!props.hideTimeZone,
    hourCycle: props.hourCycle,
    segmentValues: segmentValues.value,
    locale,
    isTimeValue: !!props.isTimeValue,
  }))

  const segmentContents = computed(() => allSegmentContent.value.arr)
  const editableSegmentContents = computed(() => segmentContents.value.filter(({ part }) => part !== 'literal'))

  const segmentElements = ref<Set<HTMLElement>>(new Set())

  function collectSegmentElements() {
    if (!props.parentElement.value)
      return
    const next = new Set<HTMLElement>()
    const elements = props.parentElement.value.querySelectorAll<HTMLElement>(`[${props.segmentAttribute}]`)
    for (const el of elements) {
      if (el.getAttribute(props.segmentAttribute) === 'literal')
        continue
      next.add(el)
    }
    segmentElements.value = next
  }

  onMounted(() => {
    collectSegmentElements()
  })

  watch(locale, (value) => {
    if (formatter.getLocale() !== value) {
      formatter.setLocale(value)
      // Locale changed, so we need to clear the segment elements and re-get them (different order)
      nextTick(() => {
        collectSegmentElements()
      })
    }
  })

  watch(() => props.modelValue.value, (_modelValue) => {
    if (props.disablePlaceholderUpdate)
      return
    if (
      !isNullish(_modelValue)
      && compareTemporalDate(props.placeholder.value, _modelValue) !== 0
    ) {
      props.placeholder.value = _modelValue
    }
  })

  watch([() => props.modelValue.value, locale], ([_modelValue]) => {
    if (!isNullish(_modelValue)) {
      segmentValues.value = { ...syncSegmentValues({ value: _modelValue, formatter }) }
    }
    // If segment has null value, means that user modified it, thus do not reset the segmentValues
    else if (Object.values(segmentValues.value).every(value => value !== null) && isNullish(_modelValue)) {
      segmentValues.value = { ...initialSegments }
    }
  })

  const currentFocusedElement = ref<HTMLElement | null>(null)

  const currentSegmentIndex = computed(() =>
    Array.from(segmentElements.value).findIndex(el =>
      el.getAttribute(props.segmentAttribute)
      === currentFocusedElement.value?.getAttribute(props.segmentAttribute)))

  const nextFocusableSegment = computed(() => {
    const sign = props.dir.value === 'rtl' ? -1 : 1
    const nextCondition = sign < 0 ? currentSegmentIndex.value < 0 : currentSegmentIndex.value > segmentElements.value.size - 1
    if (nextCondition)
      return null
    return Array.from(segmentElements.value)[currentSegmentIndex.value + sign] ?? null
  })

  const prevFocusableSegment = computed(() => {
    const sign = props.dir.value === 'rtl' ? -1 : 1
    const prevCondition = sign > 0 ? currentSegmentIndex.value < 0 : currentSegmentIndex.value > segmentElements.value.size - 1
    if (prevCondition)
      return null
    return Array.from(segmentElements.value)[currentSegmentIndex.value - sign] ?? null
  })

  const kbd = useKbd()

  function handleKeydown(e: KeyboardEvent) {
    // Don't navigate between segments mid-composition, arrow keys are used for IME candidate navigation
    if (e.isComposing)
      return
    if (!isSegmentNavigationKey(e.key))
      return
    if (e.key === kbd.ARROW_LEFT)
      prevFocusableSegment.value?.focus()
    if (e.key === kbd.ARROW_RIGHT)
      nextFocusableSegment.value?.focus()
  }

  function setFocusedElement(el: HTMLElement) {
    currentFocusedElement.value = el
  }

  function focusNext() {
    // Auto-advance follows DOM (locale format) order; arrow navigation is directional.
    Array.from(segmentElements.value)[currentSegmentIndex.value + 1]?.focus()
  }

  const inputType = computed<DateInputType>(() => {
    const g = inferredGranularity.value
    return g === 'day' ? 'date' : 'datetime-local'
  })

  const inputValue = computed(() => normalizeInputValue(props.modelValue.value, inferredGranularity.value))
  const inputMaxValue = computed(() => props.maxValue ? normalizeInputValue(props.maxValue, inferredGranularity.value) : undefined)
  const inputMinValue = computed(() => props.minValue ? normalizeInputValue(props.minValue, inferredGranularity.value) : undefined)

  return {
    formatter,
    hourCycle: props.hourCycle,
    step,
    stepSnapping: computed(() => props.stepSnapping?.value ?? false),
    inferredGranularity,
    isInvalid,
    segmentValues,
    segmentContents,
    editableSegmentContents,
    segmentElements,
    focusNext,
    setFocusedElement,
    inputType,
    inputValue,
    inputMinValue,
    inputMaxValue,
    handleKeydown,
  }
}
