import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { DateFieldRootContext } from './DateFieldRoot.vue'
import type { DateValue, Matcher } from '@/date'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DateStep, Granularity, HourCycle, SegmentContents, SegmentFieldRootState, SegmentFieldSegmentState, SegmentPart, SegmentValueObj } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { computed, ref, toValue, unref, watch } from 'vue'
import { hasTime, isBefore, isSameDateSelection } from '@/date'
import { assertTemporal } from '@/date/runtime'
import { useControllableState, useDateFormatter } from '@/shared'
import {
  createContent,
  createSegmentFieldRootSurface,
  createSegmentFieldSegmentSurface,
  editableSegments,
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
 * Why the DateField value changed; carried as `details.reason` (#2828).
 *
 * - `segment-input`: a digit (or `a` / `p` on the day period) completed or edited the date.
 * - `segment-increment` / `segment-decrement`: ArrowUp / ArrowDown on a segment.
 * - `segment-clear`: Backspace removed a digit, or cleared the date.
 * - `step-snap`: `stepSnapping` rounded a time segment when it lost focus.
 */
export type DateFieldChangeReason
  = | 'segment-input'
    | 'segment-increment'
    | 'segment-decrement'
    | 'segment-clear'
    | 'step-snap'

/** Semantic state of `DateFieldRoot` (`data-disabled`, `data-readonly`, `data-invalid`). */
export type DateFieldRootState = SegmentFieldRootState
/** Semantic state of `DateFieldInput` (`data-disabled`, `data-invalid`, `data-placeholder`, `data-segment`, `data-readonly`). */
export type DateFieldInputState = SegmentFieldSegmentState

export interface UseDateFieldProps {
  /**
   * Controlled value. A getter resolving to `undefined` is uncontrolled; `null`
   * is a controlled empty field.
   */
  modelValue?: MaybeRefOrGetter<DateValue | null | undefined>
  defaultValue?: DateValue
  /** Controlled placeholder: the date the empty segments are built from. */
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
  /** A plain function or a ref to one, never a getter (`toValue()` would call the matcher). */
  isDateUnavailable?: MaybeRef<Matcher | undefined>
  /** The root element, used to collect the segments for keyboard navigation. The SFC passes its `currentElement`. */
  parentElement?: Ref<HTMLElement | undefined>
  /** Component `emit`; receives `beforeUpdate:` / `update:` for `modelValue` and `placeholder`. */
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: DateValue | undefined, details: ChangeEventDetails<DateFieldChangeReason>) => void
  onUpdate?: (value: DateValue | undefined, details: ChangeEventDetails<DateFieldChangeReason>) => void
  onBeforeUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<DateFieldChangeReason>) => void
  onUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<DateFieldChangeReason>) => void
}

export interface UseDateFieldReturn {
  modelValue: ComputedRef<DateValue | undefined>
  placeholder: ComputedRef<DateValue>
  /** The granularity the segments render at (inferred from the placeholder when not set). */
  granularity: ComputedRef<Granularity>
  /** Every segment, literals included, as `{ part, value }`. */
  segments: ComputedRef<SegmentContents>
  /** The editable segments only. */
  editableSegments: ComputedRef<SegmentContents>
  segmentValues: Ref<SegmentValueObj>
  isInvalid: ComputedRef<boolean>
  /** Request a value change. Returns `false` when unchanged or cancelled. */
  setModelValue: (value: DateValue | undefined, reason?: DateFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setPlaceholder: (value: DateValue, reason?: DateFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setFocusedElement: (el: HTMLElement) => void
  focusFirstSegment: () => void
  /** Re-collect the segment elements after their order changed. */
  refreshSegmentElements: () => void
  segmentElements: Ref<Set<HTMLElement>>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<DateFieldChangeReason>>>
  isControlled: ComputedRef<boolean>
  root: PartSurface<DateFieldRootState>
  /** Builds the surface of one segment. Holds typing state: call it once per rendered segment. */
  createInputSurface: (part: MaybeRefOrGetter<SegmentPart>) => PartSurface<DateFieldInputState>
  context: DateFieldRootContext
}

/**
 * The `DateFieldInput` surface: spinbutton aria, the keyboard / IME handlers
 * and the segment state. A once-per-segment factory (typing state).
 *
 * @internal
 */
export function createDateFieldInputSurface(context: DateFieldRootContext, part: MaybeRefOrGetter<SegmentPart>): PartSurface<DateFieldInputState> {
  return createSegmentFieldSegmentSurface({
    context,
    segmentValues: context.segmentValues,
    modelValue: context.modelValue,
    setModelValue: context.setModelValue,
    part,
    selectors: () => ({ 'data-reka-date-field-segment': toValue(part) }),
  })
}

/**
 * Headless DateField logic: the value and placeholder models, the segment
 * values and contents, validation, and the root / segment surfaces. Typing
 * edits segment values in place; a complete set of segments commits the value
 * with a `DateFieldChangeReason`.
 *
 * `DateFieldRoot.vue` composes this and keeps the `Field` integration and the
 * hidden native input. A standalone consumer binds `root.attrs` on a container
 * (passing it as `parentElement`) and one `createInputSurface(part)` per segment.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — installs watchers and collects the segments on mount.
 */
export function useDateField(props: UseDateFieldProps = {}): UseDateFieldReturn {
  assertTemporal()
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

  const { state: rawModelValue, setState, lastChangeDetails, isControlled } = useControllableState<DateValue | null | undefined, DateFieldChangeReason>({
    prop: () => toValue(props.modelValue),
    defaultValue: () => props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as UseControllableHandler,
    onUpdate: props.onUpdate as UseControllableHandler,
    isEqual: isSameTemporalValue,
  })
  // `null` (a controlled empty field) reads as `undefined`.
  const modelValue = computed(() => rawModelValue.value ?? undefined)

  const defaultDate = getDefaultDate({
    defaultPlaceholder: toValue(props.placeholder),
    granularity: toValue(props.granularity),
    defaultValue: modelValue.value,
    locale: locale.value,
  })

  const { state: placeholder, setState: setPlaceholderState } = useControllableState<DateValue, DateFieldChangeReason>({
    prop: () => toValue(props.placeholder),
    defaultValue: () => props.defaultPlaceholder ?? defaultDate,
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

  const isInvalid = computed(() => {
    const value = modelValue.value
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
  })

  const initialSegments = initializeSegmentValues(granularity.value)
  const segmentValues = ref<SegmentValueObj>(modelValue.value ? { ...syncSegmentValues({ value: modelValue.value, formatter }) } : { ...initialSegments })

  const segments = computed(() => createContent({
    granularity: granularity.value,
    dateRef: placeholder.value,
    formatter,
    hideTimeZone: toValue(props.hideTimeZone) ?? false,
    hourCycle: props.hourCycle,
    segmentValues: segmentValues.value,
    locale,
  }).arr)
  const editable = editableSegments(segments)

  const navigation = useSegmentFieldNavigation({
    parentElement,
    dir,
    segmentAttribute: 'data-reka-date-field-segment',
    segmentAttributes: ['data-reka-date-field-segment'],
  })

  watchSegmentFieldLocale(locale, formatter, navigation.refreshSegmentElements)

  function setPlaceholder(value: DateValue, reason: DateFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholderState(value, reason, event)
  }

  // A cancelled commit rolls back only the model: the segments keep what the
  // user typed, so typing can continue to a value the guard accepts (a year
  // is typed one digit at a time and commits at every digit).
  function setModelValue(value: DateValue | undefined, reason: DateFieldChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }

  watch(modelValue, (value, previous) => {
    if (isSameDateSelection(previous, value, isSameTemporalValue))
      return
    if (value && !isSameTemporalValue(placeholder.value, value))
      setPlaceholder(value)
  })

  watch([modelValue, locale], ([value]) => {
    if (value) {
      segmentValues.value = { ...syncSegmentValues({ value, formatter }) }
    }
    // If segment has null value, means that user modified it, thus do not reset the segmentValues
    else if (Object.values(segmentValues.value).every(segment => segment !== null)) {
      segmentValues.value = { ...initialSegments }
    }
  })

  const context: DateFieldRootContext = {
    get isDateUnavailable() {
      return isDateUnavailable.value
    },
    locale,
    modelValue: computed({
      get: () => modelValue.value,
      set: value => setModelValue(value),
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
    setPlaceholder,
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
    createInputSurface: part => createDateFieldInputSurface(context, part),
    context,
  }
}

type UseControllableHandler = ((value: DateValue | null | undefined, details: ChangeEventDetails<DateFieldChangeReason>) => void) | undefined
