import type { DateValue } from '@internationalized/date'
import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { DateRangeFieldRootContext, DateRangeType } from './DateRangeFieldRoot.vue'
import type { Matcher } from '@/date'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DateRange, DateStep, Granularity, HourCycle, SegmentContents, SegmentFieldRootState, SegmentFieldSegmentState, SegmentPart, SegmentValueObj } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { computed, ref, toValue, unref, watch } from 'vue'
import { areAllDaysBetweenValid, hasTime, isBefore, isBeforeOrSame } from '@/date'
import { useControllableState, useDateFormatter } from '@/shared'
import {
  createContent,
  createSegmentFieldRootSurface,
  createSegmentFieldSegmentSurface,
  getDefaultDate,
  initializeSegmentValues,
  isSameTemporalValue,
  normalizeDateStep,
  normalizeHourCycle,
  syncSegmentValues,
  useSegmentFieldNavigation,
  watchSegmentFieldLocale,
} from '@/shared/date'

/**
 * Why the DateRangeField value changed; carried as `details.reason` (#2828).
 * The same reasons as `DateFieldChangeReason`, from a start or end segment.
 */
export type DateRangeFieldChangeReason
  = | 'segment-input'
    | 'segment-increment'
    | 'segment-decrement'
    | 'segment-clear'
    | 'step-snap'

/** Semantic state of `DateRangeFieldRoot` (`data-disabled`, `data-readonly`, `data-invalid`). */
export type DateRangeFieldRootState = SegmentFieldRootState
/** Semantic state of `DateRangeFieldInput`. */
export type DateRangeFieldInputState = SegmentFieldSegmentState

const EMPTY_RANGE: DateRange = { start: undefined, end: undefined }

/** Two ranges are equal when both ends are the same value (or both empty). @internal */
export function isSameRange(a: { start?: unknown, end?: unknown } | null | undefined, b: { start?: unknown, end?: unknown } | null | undefined) {
  return isSameTemporalValue(a?.start as DateValue | undefined, b?.start as DateValue | undefined)
    && isSameTemporalValue(a?.end as DateValue | undefined, b?.end as DateValue | undefined)
}

export interface UseDateRangeFieldProps {
  /**
   * Controlled range. A getter resolving to `undefined` is uncontrolled; `null`
   * is a controlled empty range.
   */
  modelValue?: MaybeRefOrGetter<DateRange | null | undefined>
  defaultValue?: DateRange
  placeholder?: MaybeRefOrGetter<DateValue | undefined>
  defaultPlaceholder?: DateValue
  locale?: MaybeRefOrGetter<string | undefined>
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Read once, when the field is created. */
  hourCycle?: HourCycle
  step?: MaybeRefOrGetter<DateStep | undefined>
  stepSnapping?: MaybeRefOrGetter<boolean | undefined>
  granularity?: MaybeRefOrGetter<Granularity | undefined>
  hideTimeZone?: MaybeRefOrGetter<boolean | undefined>
  minValue?: MaybeRefOrGetter<DateValue | undefined>
  maxValue?: MaybeRefOrGetter<DateValue | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  readonly?: MaybeRefOrGetter<boolean | undefined>
  /** A plain function or a ref to one. */
  isDateUnavailable?: MaybeRef<Matcher | undefined>
  parentElement?: Ref<HTMLElement | undefined>
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: DateRange, details: ChangeEventDetails<DateRangeFieldChangeReason>) => void
  onUpdate?: (value: DateRange, details: ChangeEventDetails<DateRangeFieldChangeReason>) => void
  onBeforeUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<DateRangeFieldChangeReason>) => void
  onUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<DateRangeFieldChangeReason>) => void
}

export interface UseDateRangeFieldReturn {
  modelValue: ComputedRef<DateRange>
  startValue: ComputedRef<DateValue | undefined>
  endValue: ComputedRef<DateValue | undefined>
  placeholder: ComputedRef<DateValue>
  granularity: ComputedRef<Granularity>
  segments: ComputedRef<Record<DateRangeType, SegmentContents>>
  editableSegments: ComputedRef<Record<DateRangeType, SegmentContents>>
  segmentValues: Record<DateRangeType, Ref<SegmentValueObj>>
  isInvalid: ComputedRef<boolean>
  setModelValue: (value: DateRange, reason?: DateRangeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Change one end of the range, keeping the other. */
  setRangeValue: (type: DateRangeType, value: DateValue | undefined, reason?: DateRangeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setPlaceholder: (value: DateValue, reason?: DateRangeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setFocusedElement: (el: HTMLElement) => void
  focusFirstSegment: () => void
  refreshSegmentElements: () => void
  segmentElements: Ref<Set<HTMLElement>>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<DateRangeFieldChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<DateRangeFieldRootState>
  /** Builds the surface of one segment of the start or end date. Call it once per rendered segment. */
  createInputSurface: (part: MaybeRefOrGetter<SegmentPart>, type: MaybeRefOrGetter<DateRangeType>) => PartSurface<DateRangeFieldInputState>
  context: DateRangeFieldRootContext
}

/** The `DateRangeFieldInput` surface. A once-per-segment factory. @internal */
export function createDateRangeFieldInputSurface(
  context: DateRangeFieldRootContext,
  part: MaybeRefOrGetter<SegmentPart>,
  type: MaybeRefOrGetter<DateRangeType>,
): PartSurface<DateRangeFieldInputState> {
  // The segment's end of the range is fixed for its lifetime (v2 read `type` once too).
  const end = toValue(type)
  return createSegmentFieldSegmentSurface({
    context,
    segmentValues: context.segmentValues[end],
    modelValue: end === 'start' ? context.startValue : context.endValue,
    setModelValue: (value, reason, event) => context.setRangeValue(end, value, reason, event),
    part,
    selectors: () => ({
      'data-reka-date-field-segment': toValue(part),
      'data-reka-date-range-field-segment-type': toValue(type),
    }),
  })
}

/**
 * Headless DateRangeField logic: the range and placeholder models, the start
 * and end segments, validation and the root / segment surfaces. Typing in a
 * start or end segment commits the whole range with a `DateRangeFieldChangeReason`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — installs watchers and collects the segments on mount.
 */
export function useDateRangeField(props: UseDateRangeFieldProps = {}): UseDateRangeFieldReturn {
  const locale = computed(() => toValue(props.locale) ?? 'en')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const readonly = computed(() => toValue(props.readonly) ?? false)
  const stepSnapping = computed(() => toValue(props.stepSnapping) ?? false)
  const step = computed(() => normalizeDateStep({ step: toValue(props.step) }))
  const isDateUnavailable = computed(() => unref(props.isDateUnavailable))
  const parentElement = props.parentElement ?? ref<HTMLElement>()

  const formatter = useDateFormatter(locale.value, {
    hourCycle: normalizeHourCycle(props.hourCycle),
  })

  const { state: rawModelValue, setState, lastChangeDetails, isControlled } = useControllableState<DateRange | null | undefined, DateRangeFieldChangeReason>({
    prop: () => toValue(props.modelValue),
    defaultValue: () => props.defaultValue ?? { ...EMPTY_RANGE },
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as UseControllableHandler,
    onUpdate: props.onUpdate as UseControllableHandler,
    isEqual: isSameRange,
  })
  // `null` (a controlled empty range) and a cleared controlled model read as an empty range.
  const modelValue = computed<DateRange>(() => rawModelValue.value ?? EMPTY_RANGE)
  const startValue = computed(() => modelValue.value.start)
  const endValue = computed(() => modelValue.value.end)

  const defaultDate = getDefaultDate({
    defaultPlaceholder: toValue(props.placeholder),
    granularity: toValue(props.granularity),
    defaultValue: modelValue.value.start,
    locale: locale.value,
  })

  const { state: placeholder, setState: setPlaceholderState } = useControllableState<DateValue, DateRangeFieldChangeReason>({
    prop: () => toValue(props.placeholder),
    defaultValue: () => props.defaultPlaceholder ?? defaultDate.copy(),
    name: 'placeholder',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdatePlaceholder,
    onUpdate: props.onUpdatePlaceholder,
    isEqual: isSameTemporalValue,
  })

  const granularity = computed<Granularity>(() => {
    const requested = toValue(props.granularity)
    if (requested)
      return !hasTime(placeholder.value) ? 'day' : requested
    return hasTime(placeholder.value) ? 'minute' : 'day'
  })

  function isEndInvalid(value: DateValue | undefined) {
    if (!value)
      return false
    if (isDateUnavailable.value?.(value))
      return true
    const min = toValue(props.minValue)
    if (min && isBefore(value, min))
      return true
    const max = toValue(props.maxValue)
    if (max && isBefore(max, value))
      return true
    return false
  }

  const isInvalid = computed(() => {
    const { start, end } = modelValue.value
    if (isEndInvalid(start) || isEndInvalid(end))
      return true
    if (!start || !end)
      return false
    if (!isBeforeOrSame(start, end))
      return true
    if (isDateUnavailable.value !== undefined && !areAllDaysBetweenValid(start, end, isDateUnavailable.value, undefined))
      return true
    return false
  })

  const initialSegments = initializeSegmentValues(granularity.value)
  const segmentValues: Record<DateRangeType, Ref<SegmentValueObj>> = {
    start: ref<SegmentValueObj>(startValue.value ? { ...syncSegmentValues({ value: startValue.value, formatter }) } : { ...initialSegments }),
    end: ref<SegmentValueObj>(endValue.value ? { ...syncSegmentValues({ value: endValue.value, formatter }) } : { ...initialSegments }),
  }

  function contentFor(type: DateRangeType) {
    return createContent({
      granularity: granularity.value,
      dateRef: placeholder.value,
      formatter,
      hideTimeZone: toValue(props.hideTimeZone) ?? false,
      hourCycle: props.hourCycle,
      segmentValues: segmentValues[type].value,
      locale,
    }).arr
  }

  const segments = computed(() => ({ start: contentFor('start'), end: contentFor('end') }))
  const editable = computed(() => ({
    start: segments.value.start.filter(({ part }) => part !== 'literal'),
    end: segments.value.end.filter(({ part }) => part !== 'literal'),
  }))

  const navigation = useSegmentFieldNavigation({
    parentElement,
    dir,
    segmentAttribute: 'data-reka-date-field-segment',
    segmentAttributes: ['data-reka-date-field-segment', 'data-reka-date-range-field-segment-type'],
  })

  watchSegmentFieldLocale(locale, formatter, navigation.refreshSegmentElements)

  function setPlaceholder(value: DateValue, reason: DateRangeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholderState(value.copy(), reason, event)
  }

  function syncSegments(type: DateRangeType, value: DateValue | undefined) {
    if (value)
      segmentValues[type].value = { ...syncSegmentValues({ value, formatter }) }
    // If segment has null value, means that user modified it, thus do not reset the segmentValues
    else if (Object.values(segmentValues[type].value).every(segment => segment !== null))
      segmentValues[type].value = { ...initialSegments }
  }

  // A cancelled commit rolls back only the model: the segments keep what the
  // user typed (both ends stay untouched), so typing can continue.
  function setModelValue(value: DateRange, reason: DateRangeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState({ start: value.start?.copy(), end: value.end?.copy() }, reason, event)
  }

  function setRangeValue(type: DateRangeType, value: DateValue | undefined, reason: DateRangeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const current = modelValue.value
    return setModelValue(type === 'start' ? { start: value, end: current.end } : { start: current.start, end: value }, reason, event)
  }

  watch(modelValue, (value) => {
    if (value.start && placeholder.value.compare(value.start) !== 0)
      setPlaceholder(value.start)
  })

  // Each end resyncs only when its own value (or the locale) changes: a new
  // range object for an unchanged start must not reset a half-typed start.
  for (const type of ['start', 'end'] as const) {
    const value = type === 'start' ? startValue : endValue
    watch([value, locale], ([next, nextLocale], [previous, previousLocale]) => {
      if (nextLocale === previousLocale && isSameTemporalValue(next, previous))
        return
      syncSegments(type, next)
    })
  }

  const context: DateRangeFieldRootContext = {
    get isDateUnavailable() {
      return isDateUnavailable.value
    },
    locale,
    startValue: computed({
      get: () => startValue.value,
      set: value => setRangeValue('start', value),
    }),
    endValue: computed({
      get: () => endValue.value,
      set: value => setRangeValue('end', value),
    }),
    placeholder: computed({
      get: () => placeholder.value,
      set: value => setPlaceholder(value),
    }),
    disabled,
    formatter,
    hourCycle: props.hourCycle,
    step,
    stepSnapping,
    readonly,
    segmentValues,
    isInvalid,
    segmentContents: editable,
    elements: navigation.segmentElements,
    setFocusedElement: navigation.setFocusedElement,
    focusNext: navigation.focusNext,
    setModelValue,
    setRangeValue,
    setPlaceholder,
  }

  const root = createSegmentFieldRootSurface({ disabled, readonly, isInvalid, dir, onKeydown: navigation.onKeydown })

  return {
    modelValue,
    startValue,
    endValue,
    placeholder,
    granularity,
    segments,
    editableSegments: editable,
    segmentValues,
    isInvalid,
    setModelValue,
    setRangeValue,
    setPlaceholder,
    setFocusedElement: navigation.setFocusedElement,
    focusFirstSegment: navigation.focusFirstSegment,
    refreshSegmentElements: navigation.refreshSegmentElements,
    segmentElements: navigation.segmentElements,
    lastChangeDetails,
    isControlled,
    root,
    createInputSurface: (part, type) => createDateRangeFieldInputSurface(context, part, type),
    context,
  }
}

type UseControllableHandler = ((value: DateRange | null | undefined, details: ChangeEventDetails<DateRangeFieldChangeReason>) => void) | undefined
