import type { DateValue } from '@internationalized/date'
import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { TimeFieldRootContext } from './TimeFieldRoot.vue'
import type { Matcher } from '@/date'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DateStep, HourCycle, SegmentContents, SegmentFieldRootState, SegmentFieldSegmentState, SegmentPart, SegmentValueObj, TimeGranularity, TimeValue } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { getLocalTimeZone, isEqualDay, Time, toCalendarDateTime, today } from '@internationalized/date'
import { computed, ref, toValue, unref, watch } from 'vue'
import { isBefore } from '@/date'
import { useControllableState, useDateFormatter } from '@/shared'
import {
  createContent,
  createSegmentFieldRootSurface,
  createSegmentFieldSegmentSurface,
  editableSegments,
  getDefaultTime,
  initializeTimeSegmentValues,
  isSameTemporalValue,
  normalizeDateStep,
  normalizeHourCycle,
  syncTimeSegmentValues,
  useSegmentFieldNavigation,
  watchSegmentFieldLocale,
} from '@/shared/date'

/**
 * Why the TimeField value changed; carried as `details.reason` (#2828).
 *
 * - `segment-input`: a digit (or `a` / `p` on the day period) completed or edited the time.
 * - `segment-increment` / `segment-decrement`: ArrowUp / ArrowDown on a segment.
 * - `segment-clear`: Backspace removed a digit, or cleared the time.
 * - `step-snap`: `stepSnapping` rounded a segment when it lost focus.
 */
export type TimeFieldChangeReason
  = | 'segment-input'
    | 'segment-increment'
    | 'segment-decrement'
    | 'segment-clear'
    | 'step-snap'

/** Semantic state of `TimeFieldRoot` (`data-disabled`, `data-readonly`, `data-invalid`). */
export type TimeFieldRootState = SegmentFieldRootState
/** Semantic state of `TimeFieldInput` (`data-disabled`, `data-invalid`, `data-placeholder`, `data-segment`, `data-readonly`). */
export type TimeFieldInputState = SegmentFieldSegmentState

/**
 * A `Time` has no date; the segments and the comparisons run on a date-time.
 * A value that already carries a date is used as is.
 *
 * @internal
 */
export function timeValueToDateTime(value: TimeValue, date: DateValue = today(getLocalTimeZone())): DateValue {
  if (value && 'day' in value)
    return value
  return toCalendarDateTime(date, value)
}

/** The inverse of `timeValueToDateTime`: keep the shape (`Time` or date-time) of `like`. @internal */
export function dateTimeToTimeValue(value: DateValue, like: TimeValue | undefined): TimeValue {
  if (like && 'day' in like)
    return value as TimeValue
  return new Time(
    'hour' in value ? value.hour : 0,
    'minute' in value ? value.minute : 0,
    'second' in value ? value.second : 0,
    like?.millisecond,
  )
}

export interface UseTimeFieldProps {
  /**
   * Controlled value. A getter resolving to `undefined` is uncontrolled; `null`
   * is a controlled empty field.
   */
  modelValue?: MaybeRefOrGetter<TimeValue | null | undefined>
  defaultValue?: TimeValue
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
  /**
   * Marks the field invalid when it returns `true`. It receives the time as a
   * date-time (a `Time` is placed on today's date). A plain function or a ref to one.
   */
  isTimeUnavailable?: MaybeRef<Matcher | undefined>
  parentElement?: Ref<HTMLElement | undefined>
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: TimeValue | undefined, details: ChangeEventDetails<TimeFieldChangeReason>) => void
  onUpdate?: (value: TimeValue | undefined, details: ChangeEventDetails<TimeFieldChangeReason>) => void
  onBeforeUpdatePlaceholder?: (value: TimeValue, details: ChangeEventDetails<TimeFieldChangeReason>) => void
  onUpdatePlaceholder?: (value: TimeValue, details: ChangeEventDetails<TimeFieldChangeReason>) => void
}

export interface UseTimeFieldReturn {
  modelValue: ComputedRef<TimeValue | undefined>
  placeholder: ComputedRef<TimeValue>
  granularity: ComputedRef<TimeGranularity>
  segments: ComputedRef<SegmentContents>
  editableSegments: ComputedRef<SegmentContents>
  segmentValues: Ref<SegmentValueObj>
  isInvalid: ComputedRef<boolean>
  setModelValue: (value: TimeValue | undefined, reason?: TimeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setPlaceholder: (value: TimeValue, reason?: TimeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setFocusedElement: (el: HTMLElement) => void
  focusFirstSegment: () => void
  refreshSegmentElements: () => void
  segmentElements: Ref<Set<HTMLElement>>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<TimeFieldChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<TimeFieldRootState>
  /** Builds the surface of one segment. Holds typing state: call it once per rendered segment. */
  createInputSurface: (part: MaybeRefOrGetter<SegmentPart>) => PartSurface<TimeFieldInputState>
  context: TimeFieldRootContext
}

/** The `TimeFieldInput` surface. A once-per-segment factory. @internal */
export function createTimeFieldInputSurface(context: TimeFieldRootContext, part: MaybeRefOrGetter<SegmentPart>): PartSurface<TimeFieldInputState> {
  return createSegmentFieldSegmentSurface({
    context,
    segmentValues: context.segmentValues,
    modelValue: context.modelValue,
    setModelValue: context.setModelValue,
    part,
    selectors: () => ({ 'data-reka-time-field-segment': toValue(part) }),
  })
}

/**
 * Headless TimeField logic: the value and placeholder models (a `Time`, or a
 * date-time whose time is edited), the segments, validation and the root /
 * segment surfaces. Typing commits the value with a `TimeFieldChangeReason`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — installs watchers and collects the segments on mount.
 */
export function useTimeField(props: UseTimeFieldProps = {}): UseTimeFieldReturn {
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

  const { state: rawModelValue, setState, lastChangeDetails, isControlled } = useControllableState<TimeValue | null | undefined, TimeFieldChangeReason>({
    prop: () => toValue(props.modelValue),
    defaultValue: () => props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as UseControllableHandler,
    onUpdate: props.onUpdate as UseControllableHandler,
    isEqual: isSameTemporalValue,
  })
  const modelValue = computed(() => rawModelValue.value ?? undefined)
  const convertedModelValue = computed(() => modelValue.value ? timeValueToDateTime(modelValue.value) : undefined)

  const defaultTime = getDefaultTime({
    defaultPlaceholder: toValue(props.placeholder),
    defaultValue: modelValue.value,
  })

  const { state: placeholder, setState: setPlaceholderState } = useControllableState<TimeValue, TimeFieldChangeReason>({
    prop: () => toValue(props.placeholder),
    defaultValue: () => props.defaultPlaceholder ?? defaultTime.copy(),
    name: 'placeholder',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdatePlaceholder,
    onUpdate: props.onUpdatePlaceholder,
    isEqual: isSameTemporalValue,
  })
  const convertedPlaceholder = computed(() => timeValueToDateTime(placeholder.value))

  const granularity = computed<TimeGranularity>(() => toValue(props.granularity) ?? 'minute')

  const isInvalid = computed(() => {
    const value = convertedModelValue.value
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
  })

  const initialSegments = initializeTimeSegmentValues(granularity.value)
  const segmentValues = ref<SegmentValueObj>(convertedModelValue.value ? { ...syncTimeSegmentValues({ value: convertedModelValue.value, formatter }) } : { ...initialSegments })

  const allSegments = computed(() => createContent({
    granularity: granularity.value,
    dateRef: convertedPlaceholder.value,
    formatter,
    hideTimeZone: toValue(props.hideTimeZone) ?? false,
    hourCycle: props.hourCycle,
    segmentValues: segmentValues.value,
    locale,
    isTimeValue: true,
  }).arr)

  const segments = computed(() => {
    const contents = allSegments.value
    // Convert hour values for 12-hour display
    if (props.hourCycle !== 12)
      return contents
    return contents.map((segment) => {
      if (segment.part === 'hour' && 'hour' in segmentValues.value) {
        const hour = segmentValues.value.hour
        if (hour !== null) {
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          return { ...segment, value: displayHour.toString() }
        }
      }
      return segment
    })
  })
  const editable = editableSegments(segments)

  const navigation = useSegmentFieldNavigation({
    parentElement,
    dir,
    segmentAttribute: 'data-reka-time-field-segment',
    segmentAttributes: ['data-reka-time-field-segment'],
  })

  watchSegmentFieldLocale(locale, formatter, navigation.refreshSegmentElements)

  function setPlaceholder(value: TimeValue, reason: TimeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholderState(value.copy(), reason, event)
  }

  // A cancelled commit rolls back only the model: the segments keep what the
  // user typed (both ends stay untouched), so typing can continue.
  function setModelValue(value: TimeValue | undefined, reason: TimeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  /** The segments edit a date-time; write it back in the value's own shape. */
  function setConvertedModelValue(value: DateValue | undefined, reason: TimeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setModelValue(value ? dateTimeToTimeValue(value, modelValue.value) : undefined, reason, event)
  }

  function setConvertedPlaceholder(value: DateValue, reason: TimeFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholder(dateTimeToTimeValue(value, placeholder.value), reason, event)
  }

  watch(convertedModelValue, (value) => {
    const current = convertedPlaceholder.value
    if (value && (!isEqualDay(current, value) || current.compare(value) !== 0))
      setConvertedPlaceholder(value.copy())
  })

  watch([convertedModelValue, locale], ([value]) => {
    if (value) {
      segmentValues.value = { ...syncTimeSegmentValues({ value, formatter }) }
    }
    // If segment has null value, means that user modified it, thus do not reset the segmentValues
    else if (Object.values(segmentValues.value).every(segment => segment !== null)) {
      segmentValues.value = { ...initialSegments }
    }
  })

  const context: TimeFieldRootContext = {
    locale,
    modelValue: computed({
      get: () => convertedModelValue.value,
      set: value => setConvertedModelValue(value),
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
    segmentValues,
    isInvalid,
    segmentContents: editable,
    elements: navigation.segmentElements,
    setFocusedElement: navigation.setFocusedElement,
    focusNext: navigation.focusNext,
    setModelValue: setConvertedModelValue,
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
    createInputSurface: part => createTimeFieldInputSurface(context, part),
    context,
  }
}

type UseControllableHandler = ((value: TimeValue | null | undefined, details: ChangeEventDetails<TimeFieldChangeReason>) => void) | undefined
