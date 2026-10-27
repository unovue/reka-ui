import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { TimeRangeFieldRootContext } from './TimeRangeFieldRoot.vue'
import type { DateValue, Matcher } from '@/date'
import type { DateRangeType } from '@/DateRangeField/DateRangeFieldRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DateStep, HourCycle, SegmentContents, SegmentFieldRootState, SegmentFieldSegmentState, SegmentPart, SegmentValueObj, TimeGranularity, TimeRange, TimeValue } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { computed, ref, toValue, unref, watch } from 'vue'
import { areAllDaysBetweenValid, compareDateValues, isBefore, isBeforeOrSame } from '@/date'
import { assertTemporal } from '@/date/runtime'
import { isSameRange } from '@/DateRangeField/useDateRangeField'
import { useControllableState, useDateFormatter } from '@/shared'
import {
  createContent,
  createSegmentFieldRootSurface,
  createSegmentFieldSegmentSurface,
  getDefaultTime,
  initializeTimeSegmentValues,
  isSameTemporalValue,
  normalizeDateStep,
  normalizeHourCycle,
  syncSegmentValues,
  syncTimeSegmentValues,
  useSegmentFieldNavigation,
  watchSegmentFieldLocale,
} from '@/shared/date'
import { dateTimeToTimeValue, timeValueToDateTime } from '@/TimeField/useTimeField'

/**
 * Why the TimeRangeField value changed; carried as `details.reason` (#2828).
 * The same reasons as `TimeFieldChangeReason`, from a start or end segment.
 */
export type TimeRangeFieldChangeReason
  = | 'segment-input'
    | 'segment-increment'
    | 'segment-decrement'
    | 'segment-clear'
    | 'step-snap'

/** Semantic state of `TimeRangeFieldRoot` (`data-disabled`, `data-readonly`, `data-invalid`). */
export type TimeRangeFieldRootState = SegmentFieldRootState
/** Semantic state of `TimeRangeFieldInput`. */
export type TimeRangeFieldInputState = SegmentFieldSegmentState

const EMPTY_RANGE: TimeRange = { start: undefined, end: undefined }

export interface UseTimeRangeFieldProps {
  /**
   * Controlled range. A getter resolving to `undefined` is uncontrolled; `null`
   * is a controlled empty range.
   */
  modelValue?: MaybeRefOrGetter<TimeRange | null | undefined>
  defaultValue?: TimeRange
  placeholder?: MaybeRefOrGetter<TimeValue | undefined>
  defaultPlaceholder?: TimeValue
  locale?: MaybeRefOrGetter<string | undefined>
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Read once, when the field is created. */
  hourCycle?: HourCycle
  step?: MaybeRefOrGetter<DateStep | undefined>
  stepSnapping?: MaybeRefOrGetter<boolean | undefined>
  /** @default 'minute' */
  granularity?: MaybeRefOrGetter<TimeGranularity | undefined>
  hideTimeZone?: MaybeRefOrGetter<boolean | undefined>
  minValue?: MaybeRefOrGetter<TimeValue | undefined>
  maxValue?: MaybeRefOrGetter<TimeValue | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  readonly?: MaybeRefOrGetter<boolean | undefined>
  /** Receives each end as a date-time (a `PlainTime` is placed on today's date). A plain function or a ref to one. */
  isTimeUnavailable?: MaybeRef<Matcher | undefined>
  parentElement?: Ref<HTMLElement | undefined>
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: TimeRange, details: ChangeEventDetails<TimeRangeFieldChangeReason>) => void
  onUpdate?: (value: TimeRange, details: ChangeEventDetails<TimeRangeFieldChangeReason>) => void
  onBeforeUpdatePlaceholder?: (value: TimeValue, details: ChangeEventDetails<TimeRangeFieldChangeReason>) => void
  onUpdatePlaceholder?: (value: TimeValue, details: ChangeEventDetails<TimeRangeFieldChangeReason>) => void
}

export interface UseTimeRangeFieldReturn {
  modelValue: ComputedRef<TimeRange>
  placeholder: ComputedRef<TimeValue>
  granularity: ComputedRef<TimeGranularity>
  segments: ComputedRef<Record<DateRangeType, SegmentContents>>
  editableSegments: ComputedRef<Record<DateRangeType, SegmentContents>>
  segmentValues: Record<DateRangeType, Ref<SegmentValueObj>>
  isInvalid: ComputedRef<boolean>
  setModelValue: (value: TimeRange, reason?: TimeRangeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setPlaceholder: (value: TimeValue, reason?: TimeRangeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setFocusedElement: (el: HTMLElement) => void
  focusFirstSegment: () => void
  refreshSegmentElements: () => void
  segmentElements: Ref<Set<HTMLElement>>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<TimeRangeFieldChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<TimeRangeFieldRootState>
  /** Builds the surface of one segment of the start or end time. Call it once per rendered segment. */
  createInputSurface: (part: MaybeRefOrGetter<SegmentPart>, type: MaybeRefOrGetter<DateRangeType>) => PartSurface<TimeRangeFieldInputState>
  context: TimeRangeFieldRootContext
}

/** The `TimeRangeFieldInput` surface. A once-per-segment factory. @internal */
export function createTimeRangeFieldInputSurface(
  context: TimeRangeFieldRootContext,
  part: MaybeRefOrGetter<SegmentPart>,
  type: MaybeRefOrGetter<DateRangeType>,
): PartSurface<TimeRangeFieldInputState> {
  const end = toValue(type)
  return createSegmentFieldSegmentSurface({
    context,
    segmentValues: context.segmentValues[end],
    modelValue: end === 'start' ? context.startValue : context.endValue,
    setModelValue: (value, reason, event) => context.setRangeValue(end, value, reason, event),
    part,
    selectors: () => ({
      'data-reka-time-field-segment': toValue(part),
      'data-reka-time-range-field-segment-type': toValue(type),
    }),
  })
}

/**
 * Headless TimeRangeField logic: the range and placeholder models, the start
 * and end segments, validation and the root / segment surfaces.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — installs watchers and collects the segments on mount.
 */
export function useTimeRangeField(props: UseTimeRangeFieldProps = {}): UseTimeRangeFieldReturn {
  assertTemporal()
  const locale = computed(() => toValue(props.locale) ?? 'en')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const disabled = computed(() => toValue(props.disabled) ?? false)
  const readonly = computed(() => toValue(props.readonly) ?? false)
  const stepSnapping = computed(() => toValue(props.stepSnapping) ?? false)
  const step = computed(() => normalizeDateStep({ step: toValue(props.step) }))
  const isTimeUnavailable = computed(() => unref(props.isTimeUnavailable))
  const parentElement = props.parentElement ?? ref<HTMLElement>()

  const formatter = useDateFormatter(locale.value, {
    hourCycle: normalizeHourCycle(props.hourCycle),
  })

  const { state: rawModelValue, setState, lastChangeDetails, isControlled } = useControllableState<TimeRange | null | undefined, TimeRangeFieldChangeReason>({
    prop: () => toValue(props.modelValue),
    defaultValue: () => props.defaultValue ?? { ...EMPTY_RANGE },
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as UseControllableHandler,
    onUpdate: props.onUpdate as UseControllableHandler,
    isEqual: isSameRange,
  })
  const modelValue = computed<TimeRange>(() => rawModelValue.value ?? EMPTY_RANGE)
  const convertedStart = computed(() => modelValue.value.start ? timeValueToDateTime(modelValue.value.start) : undefined)
  const convertedEnd = computed(() => modelValue.value.end ? timeValueToDateTime(modelValue.value.end) : undefined)

  const defaultTime = getDefaultTime({
    defaultPlaceholder: toValue(props.placeholder),
    defaultValue: modelValue.value.start,
  })

  const { state: placeholder, setState: setPlaceholderState } = useControllableState<TimeValue, TimeRangeFieldChangeReason>({
    prop: () => toValue(props.placeholder),
    defaultValue: () => props.defaultPlaceholder ?? defaultTime,
    name: 'placeholder',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdatePlaceholder,
    onUpdate: props.onUpdatePlaceholder,
    isEqual: isSameTemporalValue,
  })
  const convertedPlaceholder = computed(() => timeValueToDateTime(placeholder.value))

  const granularity = computed<TimeGranularity>(() => toValue(props.granularity) ?? 'minute')

  function isEndInvalid(value: DateValue | undefined) {
    if (!value)
      return false
    if (isTimeUnavailable.value?.(value))
      return true
    const min = toValue(props.minValue)
    if (min && isBefore(value, timeValueToDateTime(min)))
      return true
    const max = toValue(props.maxValue)
    if (max && isBefore(timeValueToDateTime(max), value))
      return true
    return false
  }

  const isInvalid = computed(() => {
    const start = convertedStart.value
    const end = convertedEnd.value
    if (isEndInvalid(start) || isEndInvalid(end))
      return true
    if (!start || !end)
      return false
    if (!isBeforeOrSame(start, end))
      return true
    if (isTimeUnavailable.value !== undefined && !areAllDaysBetweenValid(start, end, isTimeUnavailable.value, undefined))
      return true
    return false
  })

  const initialSegments = initializeTimeSegmentValues(granularity.value)
  const segmentValues: Record<DateRangeType, Ref<SegmentValueObj>> = {
    start: ref<SegmentValueObj>(convertedStart.value ? { ...syncTimeSegmentValues({ value: convertedStart.value, formatter }) } : { ...initialSegments }),
    end: ref<SegmentValueObj>(convertedEnd.value ? { ...syncTimeSegmentValues({ value: convertedEnd.value, formatter }) } : { ...initialSegments }),
  }

  function contentFor(type: DateRangeType) {
    return createContent({
      granularity: granularity.value,
      dateRef: convertedPlaceholder.value,
      formatter,
      hideTimeZone: toValue(props.hideTimeZone) ?? false,
      hourCycle: props.hourCycle,
      segmentValues: segmentValues[type].value,
      locale,
      isTimeValue: true,
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
    segmentAttribute: 'data-reka-time-field-segment',
    segmentAttributes: ['data-reka-time-field-segment', 'data-reka-time-range-field-segment-type'],
  })

  watchSegmentFieldLocale(locale, formatter, navigation.refreshSegmentElements)

  function setPlaceholder(value: TimeValue, reason: TimeRangeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholderState(value, reason, event)
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
  function setModelValue(value: TimeRange, reason: TimeRangeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState({ start: value.start, end: value.end }, reason, event)
  }

  /** The segments edit a date-time; each end is written back in its own shape. */
  function setRangeValue(type: DateRangeType, value: DateValue | undefined, reason: TimeRangeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const current = modelValue.value
    const next = value ? dateTimeToTimeValue(value, current[type]) : undefined
    return setModelValue(type === 'start' ? { start: next, end: current.end } : { start: current.start, end: next }, reason, event)
  }

  function setConvertedPlaceholder(value: DateValue, reason: TimeRangeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholder(dateTimeToTimeValue(value, placeholder.value), reason, event)
  }

  watch(convertedStart, (start) => {
    if (start && compareDateValues(convertedPlaceholder.value, start) !== 0)
      setConvertedPlaceholder(start)
  })

  // Each end resyncs only when its own value (or the locale) changes: a new
  // range object for an unchanged start must not reset a half-typed start.
  for (const type of ['start', 'end'] as const) {
    const value = type === 'start' ? convertedStart : convertedEnd
    watch([value, locale], ([next, nextLocale], [previous, previousLocale]) => {
      if (nextLocale === previousLocale && isSameTemporalValue(next, previous))
        return
      syncSegments(type, next)
    })
  }

  const context: TimeRangeFieldRootContext = {
    locale,
    startValue: computed({
      get: () => convertedStart.value,
      set: value => setRangeValue('start', value),
    }),
    endValue: computed({
      get: () => convertedEnd.value,
      set: value => setRangeValue('end', value),
    }),
    placeholder: computed({
      get: () => convertedPlaceholder.value,
      set: value => setConvertedPlaceholder(value),
    }),
    disabled,
    formatter,
    hourCycle: props.hourCycle,
    step,
    stepSnapping,
    readonly,
    isInvalid,
    segmentValues,
    segmentContents: editable,
    elements: navigation.segmentElements,
    setFocusedElement: navigation.setFocusedElement,
    focusNext: navigation.focusNext,
    setModelValue,
    setRangeValue,
    setPlaceholder: setConvertedPlaceholder,
  }

  const root = createSegmentFieldRootSurface({ disabled, readonly, isInvalid, dir, onKeydown: navigation.onKeydown })

  return {
    modelValue,
    placeholder,
    granularity,
    segments,
    editableSegments: editable,
    segmentValues,
    isInvalid,
    setModelValue,
    setPlaceholder,
    setFocusedElement: navigation.setFocusedElement,
    focusFirstSegment: navigation.focusFirstSegment,
    refreshSegmentElements: navigation.refreshSegmentElements,
    segmentElements: navigation.segmentElements,
    lastChangeDetails,
    isControlled,
    root,
    createInputSurface: (part, type) => createTimeRangeFieldInputSurface(context, part, type),
    context,
  }
}

type UseControllableHandler = ((value: TimeRange | null | undefined, details: ChangeEventDetails<TimeRangeFieldChangeReason>) => void) | undefined
