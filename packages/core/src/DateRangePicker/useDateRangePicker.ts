import type { DateValue } from '@internationalized/date'
import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { DateRangePickerOpenChangeReason, DateRangePickerRootContext } from './DateRangePickerRoot.vue'
import type { CalendarUnit, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { DateRangeFieldChangeReason, UseDateRangeFieldProps } from '@/DateRangeField/useDateRangeField'
import type { PopoverOpenChangeReason, UsePopoverReturn } from '@/Popover'
import type { RangeCalendarChangeReason, UseRangeCalendarProps } from '@/RangeCalendar/useRangeCalendar'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { DateRange, DateStep, Granularity, HourCycle } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { isEqualDay } from '@internationalized/date'
import { computed, ref, toValue, unref, watch } from 'vue'
import { getWeekStartsOn } from '@/date'
import { isSameRange } from '@/DateRangeField/useDateRangeField'
import { usePopover } from '@/Popover/usePopover'
import { useControllableState } from '@/shared'
import { bridgeChange, getDefaultDate, isSameTemporalValue } from '@/shared/date'

/**
 * Why the DateRangePicker range, placeholder or start value changed (#2828):
 * the field's reasons (`segment-*`, `step-snap`) when it was typed, the range
 * calendar's (`cell-press`, `cell-keydown`, `escape-key`, …) when it was picked.
 */
export type DateRangePickerChangeReason = DateRangeFieldChangeReason | RangeCalendarChangeReason

const EMPTY_RANGE: DateRange = { start: undefined, end: undefined }

export interface UseDateRangePickerProps {
  /** Controlled range. A getter resolving to `undefined` is uncontrolled; `null` is a controlled empty range. */
  modelValue?: MaybeRefOrGetter<DateRange | null | undefined>
  defaultValue?: DateRange
  placeholder?: MaybeRefOrGetter<DateValue | undefined>
  defaultPlaceholder?: DateValue
  open?: MaybeRefOrGetter<boolean | undefined>
  defaultOpen?: boolean
  modal?: MaybeRefOrGetter<boolean | undefined>
  view?: MaybeRefOrGetter<CalendarUnit | undefined>
  /** @default 'day' */
  defaultView?: CalendarUnit
  maxView?: MaybeRefOrGetter<CalendarUnit | undefined>
  closeOnSelect?: MaybeRefOrGetter<boolean | undefined>
  locale?: MaybeRefOrGetter<string | undefined>
  dir?: MaybeRefOrGetter<Direction | undefined>
  id?: MaybeRefOrGetter<string | undefined>
  name?: MaybeRefOrGetter<string | undefined>
  required?: MaybeRefOrGetter<boolean | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  readonly?: MaybeRefOrGetter<boolean | undefined>
  minValue?: MaybeRefOrGetter<DateValue | undefined>
  maxValue?: MaybeRefOrGetter<DateValue | undefined>
  granularity?: MaybeRefOrGetter<Granularity | undefined>
  hourCycle?: MaybeRefOrGetter<HourCycle | undefined>
  hideTimeZone?: MaybeRefOrGetter<boolean | undefined>
  step?: MaybeRefOrGetter<DateStep | undefined>
  stepSnapping?: MaybeRefOrGetter<boolean | undefined>
  /** Function-valued props are a plain function or a ref to one, never a getter. */
  isDateDisabled?: MaybeRef<Matcher | undefined>
  isDateUnavailable?: MaybeRef<Matcher | undefined>
  isDateHighlightable?: MaybeRef<Matcher | undefined>
  weekStartsOn?: MaybeRefOrGetter<WeekStartsOn | undefined>
  weekdayFormat?: MaybeRefOrGetter<WeekDayFormat | undefined>
  fixedWeeks?: MaybeRefOrGetter<boolean | undefined>
  numberOfMonths?: MaybeRefOrGetter<number | undefined>
  pagedNavigation?: MaybeRefOrGetter<boolean | undefined>
  preventDeselect?: MaybeRefOrGetter<boolean | undefined>
  allowNonContiguousRanges?: MaybeRefOrGetter<boolean | undefined>
  fixedDate?: MaybeRefOrGetter<'start' | 'end' | undefined>
  maximumDays?: MaybeRefOrGetter<number | undefined>
  maximumLength?: MaybeRefOrGetter<number | undefined>
  yearsPerPage?: MaybeRefOrGetter<number | undefined>
  columns?: MaybeRefOrGetter<number | undefined>
  baseId?: string
  /** Component `emit`; receives `beforeUpdate:` / `update:` for `modelValue`, `placeholder`, `startValue`, `open` and `view`. */
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: DateRange, details: ChangeEventDetails<DateRangePickerChangeReason>) => void
  onUpdate?: (value: DateRange, details: ChangeEventDetails<DateRangePickerChangeReason>) => void
  onUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<DateRangePickerChangeReason>) => void
  onUpdateStartValue?: (value: DateValue | undefined, details: ChangeEventDetails<DateRangePickerChangeReason>) => void
  onUpdateOpen?: (value: boolean, details: ChangeEventDetails<DateRangePickerOpenChangeReason>) => void
  onUpdateView?: (value: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
}

export interface UseDateRangePickerReturn {
  modelValue: ComputedRef<DateRange>
  placeholder: ComputedRef<DateValue>
  /** The start the calendar's next press extends from (set before the range is complete). */
  startValue: ComputedRef<DateValue | undefined>
  open: ComputedRef<boolean>
  view: ComputedRef<CalendarUnit>
  setModelValue: (value: DateRange, reason?: DateRangePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  setPlaceholder: (value: DateValue, reason?: DateRangePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  setStartValue: (value: DateValue | undefined, reason?: DateRangePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  setOpen: (value: boolean, reason?: DateRangePickerOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  setView: (value: CalendarUnit, reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<DateRangePickerChangeReason>>>
  isControlled: ComputedRef<boolean>
  popover: UsePopoverReturn
  /** Options for `useDateRangeField()` that make it the picker's field. */
  getFieldProps: () => UseDateRangeFieldProps
  /** Options for `useRangeCalendar()` that make it the picker's calendar (always `granularity: 'day'`). */
  getCalendarProps: () => UseRangeCalendarProps
  context: DateRangePickerRootContext
}

/**
 * Headless DateRangePicker logic. Composes `usePopover()` for the open state
 * and owns the range, placeholder, start value and view the picker's field
 * (`useDateRangeField`) and range calendar (`useRangeCalendar`) are controlled by.
 *
 * `startValue` is not a prop: it mirrors the calendar's anchor. Cancelling
 * `beforeUpdate:startValue` suppresses `update:startValue`, it does not move
 * the anchor back.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — installs watchers (range → placeholder sync, close on select, view reset on open).
 */
export function useDateRangePicker(props: UseDateRangePickerProps = {}): UseDateRangePickerReturn {
  const locale = computed(() => toValue(props.locale) ?? 'en')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const closeOnSelect = computed(() => toValue(props.closeOnSelect) ?? false)
  const weekStartsOn = computed(() => toValue(props.weekStartsOn) ?? getWeekStartsOn(locale.value))

  const { state: rawModelValue, setState: setModelState, lastChangeDetails, isControlled } = useControllableState<DateRange | null | undefined, DateRangePickerChangeReason>({
    prop: () => toValue(props.modelValue),
    defaultValue: () => props.defaultValue ?? { ...EMPTY_RANGE },
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as ModelHandler,
    onUpdate: props.onUpdate as ModelHandler,
    isEqual: isSameRange,
  })
  const modelValue = computed<DateRange>(() => rawModelValue.value ?? EMPTY_RANGE)

  const { state: placeholder, setState: setPlaceholderState } = useControllableState<DateValue, DateRangePickerChangeReason>({
    prop: () => toValue(props.placeholder),
    defaultValue: () => props.defaultPlaceholder ?? getDefaultDate({
      defaultPlaceholder: toValue(props.placeholder),
      granularity: toValue(props.granularity),
      defaultValue: modelValue.value.start,
      locale: locale.value,
    }).copy(),
    name: 'placeholder',
    emit: props.emit,
    onUpdate: props.onUpdatePlaceholder,
    isEqual: isSameTemporalValue,
  })

  const { state: startValue, setState: setStartState } = useControllableState<DateValue | undefined, DateRangePickerChangeReason>({
    defaultValue: () => modelValue.value.start,
    name: 'startValue',
    emit: props.emit,
    onUpdate: props.onUpdateStartValue,
    isEqual: isSameTemporalValue,
  })

  const popover = usePopover({
    open: () => toValue(props.open),
    defaultOpen: props.defaultOpen,
    modal: () => toValue(props.modal),
    baseId: props.baseId,
    emit: props.emit,
    onUpdate: props.onUpdateOpen as ((value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason>) => void) | undefined,
  })

  const { state: view, setState: setViewState, isControlled: isViewControlled } = useControllableState<CalendarUnit, RangeCalendarChangeReason>({
    prop: () => toValue(props.view),
    defaultValue: props.defaultView ?? 'day',
    name: 'view',
    emit: props.emit,
    onUpdate: props.onUpdateView,
  })

  function setModelValue(value: DateRange, reason: DateRangePickerChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setModelState({ start: value.start?.copy(), end: value.end?.copy() }, reason, event)
  }
  function setPlaceholder(value: DateValue, reason: DateRangePickerChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholderState(value.copy(), reason, event)
  }
  function setStartValue(value: DateValue | undefined, reason: DateRangePickerChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setStartState(value?.copy(), reason, event)
  }
  function setOpen(value: boolean, reason: DateRangePickerOpenChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return popover.onOpenChange(value, reason as PopoverOpenChangeReason, event)
  }
  function setView(value: CalendarUnit, reason: RangeCalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setViewState(value, reason, event)
  }

  watch(popover.open, (isOpen) => {
    if (isOpen && !isViewControlled.value)
      setView(props.defaultView ?? 'day')
  })

  watch(modelValue, (value) => {
    if (value.start && value.start.compare(placeholder.value) !== 0)
      setPlaceholder(value.start)
    if (value.start && value.end && closeOnSelect.value)
      setOpen(false, 'date-select')
  })

  const onFieldBeforeUpdate = bridgeChange<DateRange, DateRangePickerChangeReason>(setModelValue, lastChangeDetails)

  /** The range calendar's `beforeUpdate:modelValue`. The same days are not a change (the field may carry times). */
  function onCalendarBeforeUpdate(value: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason>) {
    const current = modelValue.value
    if (value.start && current.start && value.end && current.end && isEqualDay(value.start, current.start) && isEqualDay(value.end, current.end))
      return
    onFieldBeforeUpdate(value, details)
  }

  function onCalendarPlaceholderChange(value: DateValue, details: ChangeEventDetails<RangeCalendarChangeReason>) {
    if (isEqualDay(value, placeholder.value))
      return
    setPlaceholder(value, details.reason, details.event)
  }

  const context: DateRangePickerRootContext = {
    id: computed(() => toValue(props.id)),
    name: computed(() => toValue(props.name)),
    minValue: computed(() => toValue(props.minValue)),
    maxValue: computed(() => toValue(props.maxValue)),
    hourCycle: computed(() => toValue(props.hourCycle)),
    granularity: computed(() => toValue(props.granularity)),
    hideTimeZone: computed(() => toValue(props.hideTimeZone) ?? false),
    required: computed(() => toValue(props.required) ?? false),
    locale,
    dateFieldRef: ref(),
    modelValue: computed({
      get: () => modelValue.value,
      set: value => setModelValue(value),
    }),
    placeholder: computed({
      get: () => placeholder.value,
      set: value => setPlaceholder(value),
    }),
    pagedNavigation: computed(() => toValue(props.pagedNavigation) ?? false),
    preventDeselect: computed(() => toValue(props.preventDeselect) ?? false),
    weekStartsOn,
    weekdayFormat: computed(() => toValue(props.weekdayFormat) ?? 'narrow'),
    fixedWeeks: computed(() => toValue(props.fixedWeeks) ?? false),
    numberOfMonths: computed(() => toValue(props.numberOfMonths) ?? 1),
    disabled: computed(() => toValue(props.disabled) ?? false),
    readonly: computed(() => toValue(props.readonly) ?? false),
    get isDateDisabled() {
      return unref(props.isDateDisabled)
    },
    get isDateUnavailable() {
      return unref(props.isDateUnavailable)
    },
    get isDateHighlightable() {
      return unref(props.isDateHighlightable)
    },
    defaultOpen: computed(() => props.defaultOpen ?? false),
    open: popover.open,
    modal: computed(() => toValue(props.modal) ?? false),
    onDateChange: (value, reason, event) => setModelValue(value, reason, event),
    onPlaceholderChange: setPlaceholder,
    onStartValueChange: (value, details) => setStartValue(value, details?.reason, details?.event),
    dir,
    allowNonContiguousRanges: computed(() => toValue(props.allowNonContiguousRanges) ?? false),
    fixedDate: computed(() => toValue(props.fixedDate)),
    maximumDays: computed(() => toValue(props.maximumDays)),
    maximumLength: computed(() => toValue(props.maximumLength)),
    step: computed(() => toValue(props.step)),
    stepSnapping: computed(() => toValue(props.stepSnapping) ?? false),
    closeOnSelect,
    view,
    maxView: computed(() => toValue(props.maxView) ?? 'year'),
    yearsPerPage: computed(() => toValue(props.yearsPerPage) ?? 12),
    columns: computed(() => toValue(props.columns) ?? 4),
    onViewChange(next: CalendarUnit, details?: ChangeEventDetails<RangeCalendarChangeReason>) {
      setView(next, details?.reason, details?.event)
    },
    setModelValue,
    setPlaceholder,
    onFieldBeforeUpdate,
    onCalendarBeforeUpdate,
    onCalendarPlaceholderChange,
  }

  function getFieldProps(): UseDateRangeFieldProps {
    return {
      modelValue: () => modelValue.value,
      placeholder: () => placeholder.value,
      locale,
      dir,
      hourCycle: context.hourCycle.value,
      step: () => context.step.value,
      stepSnapping: () => context.stepSnapping.value,
      granularity: () => context.granularity.value,
      hideTimeZone: () => context.hideTimeZone.value,
      minValue: () => context.minValue.value,
      maxValue: () => context.maxValue.value,
      disabled: () => context.disabled.value,
      readonly: () => context.readonly.value,
      isDateUnavailable: computed(() => context.isDateUnavailable),
      onBeforeUpdate: onFieldBeforeUpdate,
      onUpdatePlaceholder: (value, details) => setPlaceholder(value, details.reason, details.event),
    }
  }

  function getCalendarProps(): UseRangeCalendarProps {
    return {
      modelValue: () => modelValue.value,
      placeholder: () => placeholder.value,
      view: () => view.value,
      maxView: () => context.maxView.value,
      allowNonContiguousRanges: () => context.allowNonContiguousRanges.value,
      preventDeselect: () => context.preventDeselect.value,
      fixedDate: () => context.fixedDate.value,
      maximumLength: () => context.maximumLength?.value,
      disabled: () => context.disabled.value,
      readonly: () => context.readonly.value,
      locale,
      dir,
      weekStartsOn,
      weekdayFormat: () => context.weekdayFormat.value,
      fixedWeeks: () => context.fixedWeeks.value,
      numberOfMonths: () => context.numberOfMonths.value,
      pagedNavigation: () => context.pagedNavigation.value,
      yearsPerPage: () => context.yearsPerPage.value,
      columns: () => context.columns.value,
      minValue: () => context.minValue.value,
      maxValue: () => context.maxValue.value,
      isDateDisabled: computed(() => context.isDateDisabled),
      isDateUnavailable: computed(() => context.isDateUnavailable),
      isDateHighlightable: computed(() => context.isDateHighlightable),
      onBeforeUpdate: onCalendarBeforeUpdate,
      onUpdatePlaceholder: onCalendarPlaceholderChange,
      onUpdateView: (value, details) => setView(value, details.reason, details.event),
      onUpdateStartValue: (value, details) => setStartValue(value, details.reason, details.event),
    }
  }

  return {
    modelValue,
    placeholder,
    startValue,
    open: popover.open,
    view,
    setModelValue,
    setPlaceholder,
    setStartValue,
    setOpen,
    setView,
    lastChangeDetails,
    isControlled,
    popover,
    getFieldProps,
    getCalendarProps,
    context,
  }
}

type ModelHandler = ((value: DateRange | null | undefined, details: ChangeEventDetails<DateRangePickerChangeReason>) => void) | undefined
