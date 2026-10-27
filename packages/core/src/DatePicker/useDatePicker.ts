import type { DateValue } from '@internationalized/date'
import type { ComputedRef, MaybeRef, MaybeRefOrGetter, Ref } from 'vue'
import type { DatePickerOpenChangeReason, DatePickerRootContext } from './DatePickerRoot.vue'
import type { CalendarChangeReason, CalendarModelValue, UseCalendarProps } from '@/Calendar/useCalendar'
import type { CalendarUnit, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { DateFieldChangeReason, UseDateFieldProps } from '@/DateField/useDateField'
import type { PopoverOpenChangeReason, UsePopoverReturn } from '@/Popover'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { DateStep, Granularity, HourCycle } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { isEqualDay } from '@internationalized/date'
import { computed, ref, toValue, unref, watch } from 'vue'
import { getWeekStartsOn, isSameDateSelection } from '@/date'
import { usePopover } from '@/Popover/usePopover'
import { useControllableState } from '@/shared'
import { bridgeChange, getDefaultDate, isSameTemporalValue } from '@/shared/date'

/**
 * Why the DatePicker value or placeholder changed (#2828): the field's reasons
 * (`segment-*`, `step-snap`) when it was typed, the calendar's (`cell-press`,
 * `cell-keydown`, …) when it was picked.
 */
export type DatePickerChangeReason = DateFieldChangeReason | CalendarChangeReason

export interface UseDatePickerProps {
  /** Controlled value. A getter resolving to `undefined` is uncontrolled; `null` is a controlled empty picker. */
  modelValue?: MaybeRefOrGetter<DateValue | null | undefined>
  defaultValue?: DateValue
  placeholder?: MaybeRefOrGetter<DateValue | undefined>
  defaultPlaceholder?: DateValue
  open?: MaybeRefOrGetter<boolean | undefined>
  defaultOpen?: boolean
  modal?: MaybeRefOrGetter<boolean | undefined>
  view?: MaybeRefOrGetter<CalendarUnit | undefined>
  /** The view each time the picker opens. @default 'day' */
  defaultView?: CalendarUnit
  /** @default 'year' */
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
  weekStartsOn?: MaybeRefOrGetter<WeekStartsOn | undefined>
  weekdayFormat?: MaybeRefOrGetter<WeekDayFormat | undefined>
  fixedWeeks?: MaybeRefOrGetter<boolean | undefined>
  numberOfMonths?: MaybeRefOrGetter<number | undefined>
  pagedNavigation?: MaybeRefOrGetter<boolean | undefined>
  preventDeselect?: MaybeRefOrGetter<boolean | undefined>
  yearsPerPage?: MaybeRefOrGetter<number | undefined>
  columns?: MaybeRefOrGetter<number | undefined>
  /** Base id of the popover's trigger / content ids. The SFC passes `useId()`; standalone calls default to a counter (not SSR-stable). */
  baseId?: string
  /** Component `emit`; receives `beforeUpdate:` / `update:` for `modelValue`, `placeholder`, `open` and `view`. */
  emit?: (event: any, ...args: any[]) => void
  onBeforeUpdate?: (value: DateValue | undefined, details: ChangeEventDetails<DatePickerChangeReason>) => void
  onUpdate?: (value: DateValue | undefined, details: ChangeEventDetails<DatePickerChangeReason>) => void
  onBeforeUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<DatePickerChangeReason>) => void
  onUpdatePlaceholder?: (value: DateValue, details: ChangeEventDetails<DatePickerChangeReason>) => void
  onUpdateOpen?: (value: boolean, details: ChangeEventDetails<DatePickerOpenChangeReason>) => void
  /** Called once the popover content's open/close animations have finished (`update:openComplete`). */
  onOpenComplete?: (value: boolean) => void
  onUpdateView?: (value: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason>) => void
}

export interface UseDatePickerReturn {
  modelValue: ComputedRef<DateValue | undefined>
  placeholder: ComputedRef<DateValue>
  open: ComputedRef<boolean>
  view: ComputedRef<CalendarUnit>
  setModelValue: (value: DateValue | undefined, reason?: DatePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  setPlaceholder: (value: DateValue, reason?: DatePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  setOpen: (value: boolean, reason?: DatePickerOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  setView: (value: CalendarUnit, reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<DatePickerChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** The composed `usePopover()`: the open model, ids and the trigger / content surfaces. */
  popover: UsePopoverReturn
  /**
   * Options for `useDateField()` that make it the picker's field: controlled by
   * the picker's value and placeholder, with typed changes (and their cancel)
   * routed through the picker.
   */
  getFieldProps: () => UseDateFieldProps
  /** Options for `useCalendar()` that make it the picker's calendar (always `granularity: 'day'`). */
  getCalendarProps: () => UseCalendarProps
  context: DatePickerRootContext
}

/**
 * Reset time fields on DateValue instances that support time granularity.
 */
function resetTime(date: DateValue) {
  if (!('hour' in date))
    return date
  return date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
}

/**
 * Headless DatePicker logic. Composes `usePopover()` for the open state (one
 * model: `beforeUpdate:open` / `update:open` fire once, from the picker) and
 * owns the value, placeholder and view the picker's field (`useDateField`) and
 * calendar (`useCalendar`) are controlled by. `getFieldProps()` /
 * `getCalendarProps()` wire those composables to the picker; the
 * `DatePickerField` / `DatePickerCalendar` parts use the same bridges.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — installs watchers (value → placeholder sync, close on select, view reset on open).
 */
export function useDatePicker(props: UseDatePickerProps = {}): UseDatePickerReturn {
  const locale = computed(() => toValue(props.locale) ?? 'en')
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const closeOnSelect = computed(() => toValue(props.closeOnSelect) ?? false)
  const preventDeselect = computed(() => toValue(props.preventDeselect) ?? false)
  const weekStartsOn = computed(() => toValue(props.weekStartsOn) ?? getWeekStartsOn(locale.value))

  const { state: rawModelValue, setState: setModelState, lastChangeDetails, isControlled } = useControllableState<DateValue | null | undefined, DatePickerChangeReason>({
    prop: () => toValue(props.modelValue),
    defaultValue: () => props.defaultValue,
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate as ModelHandler,
    onUpdate: props.onUpdate as ModelHandler,
    isEqual: isSameTemporalValue,
  })
  const modelValue = computed(() => rawModelValue.value ?? undefined)

  const { state: placeholder, setState: setPlaceholderState } = useControllableState<DateValue, DatePickerChangeReason>({
    prop: () => toValue(props.placeholder),
    defaultValue: () => props.defaultPlaceholder ?? getDefaultDate({
      defaultPlaceholder: toValue(props.placeholder),
      granularity: toValue(props.granularity),
      defaultValue: modelValue.value,
      locale: locale.value,
    }).copy(),
    name: 'placeholder',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdatePlaceholder,
    onUpdate: props.onUpdatePlaceholder,
    isEqual: isSameTemporalValue,
  })

  const popover = usePopover({
    open: () => toValue(props.open),
    defaultOpen: props.defaultOpen,
    modal: () => toValue(props.modal),
    baseId: props.baseId,
    emit: props.emit,
    onUpdate: props.onUpdateOpen as ((value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason>) => void) | undefined,
    onOpenComplete: props.onOpenComplete,
  })

  const { state: view, setState: setViewState, isControlled: isViewControlled } = useControllableState<CalendarUnit, CalendarChangeReason>({
    prop: () => toValue(props.view),
    defaultValue: props.defaultView ?? 'day',
    name: 'view',
    emit: props.emit,
    onUpdate: props.onUpdateView,
  })

  function setModelValue(value: DateValue | undefined, reason: DatePickerChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setModelState(value?.copy(), reason, event)
  }
  function setPlaceholder(value: DateValue, reason: DatePickerChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlaceholderState(value.copy(), reason, event)
  }
  function setOpen(value: boolean, reason: DatePickerOpenChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    // `date-select` is the picker's own addition to the popover's reasons.
    return popover.onOpenChange(value, reason as PopoverOpenChangeReason, event)
  }
  function setView(value: CalendarUnit, reason: CalendarChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setViewState(value, reason, event)
  }

  // `defaultView` is the view each time the picker opens: an uncontrolled view
  // left on month / year when the popover closed goes back to it on reopen.
  watch(popover.open, (isOpen) => {
    if (isOpen && !isViewControlled.value)
      setView(props.defaultView ?? 'day')
  })

  watch(modelValue, (value, previous) => {
    // A new object for the same value is not a new selection. Skip placeholder
    // reset and closeOnSelect, or paging the calendar is undone. Compare the
    // exact value, not the day, so a same-day time or zone change still syncs.
    if (isSameDateSelection(previous, value, isSameTemporalValue))
      return

    if (value && !isSameTemporalValue(value, placeholder.value))
      setPlaceholder(value)
    else if (!value && 'hour' in placeholder.value)
      setPlaceholder(resetTime(placeholder.value))

    // Only a new day is a pick. A same-day time or zone change leaves the popover open.
    if (closeOnSelect.value && !isSameDateSelection(previous, value, isEqualDay))
      setOpen(false, 'date-select')
  })

  /** The field's `beforeUpdate:modelValue`: the picker's change runs (and may cancel) inside it. */
  const onFieldBeforeUpdate = bridgeChange<DateValue | undefined, DatePickerChangeReason>(setModelValue, lastChangeDetails)

  /** The calendar's `beforeUpdate:modelValue`. A pick of the current day keeps the time the value carries. */
  function onCalendarBeforeUpdate(value: CalendarModelValue, details: ChangeEventDetails<CalendarChangeReason>) {
    // `multiple` is pinned to false, so the model is never an array.
    const date = Array.isArray(value) ? value.at(-1) : value
    if (date && modelValue.value && isEqualDay(date, modelValue.value))
      return
    bridgeChange<DateValue | undefined, DatePickerChangeReason>(setModelValue, lastChangeDetails)(date, details)
  }

  function onCalendarPlaceholderChange(value: DateValue, details: ChangeEventDetails<CalendarChangeReason>) {
    if (isEqualDay(value, placeholder.value))
      return
    setPlaceholder(value, details.reason, details.event)
  }

  const context: DatePickerRootContext = {
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
    preventDeselect,
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
    defaultOpen: computed(() => props.defaultOpen ?? false),
    open: popover.open,
    modal: computed(() => toValue(props.modal) ?? false),
    onDateChange(date: DateValue | undefined, reason?: DatePickerChangeReason | BaseChangeReason, event?: Event) {
      if (date && modelValue.value && !preventDeselect.value && modelValue.value.compare(date) === 0)
        return setModelValue(undefined, reason, event)
      return setModelValue(date, reason, event)
    },
    onPlaceholderChange: setPlaceholder,
    dir,
    step: computed(() => toValue(props.step)),
    stepSnapping: computed(() => toValue(props.stepSnapping) ?? false),
    closeOnSelect,
    view,
    maxView: computed(() => toValue(props.maxView) ?? 'year'),
    yearsPerPage: computed(() => toValue(props.yearsPerPage) ?? 12),
    columns: computed(() => toValue(props.columns) ?? 4),
    onViewChange(next: CalendarUnit, details?: ChangeEventDetails<CalendarChangeReason>) {
      setView(next, details?.reason, details?.event)
    },
    setModelValue,
    setPlaceholder,
    onFieldBeforeUpdate,
    onCalendarBeforeUpdate,
    onCalendarPlaceholderChange,
  }

  function getFieldProps(): UseDateFieldProps {
    return {
      modelValue: () => modelValue.value ?? null,
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

  function getCalendarProps(): UseCalendarProps {
    return {
      modelValue: () => modelValue.value ?? null,
      placeholder: () => placeholder.value,
      view: () => view.value,
      maxView: () => context.maxView.value,
      multiple: false,
      preventDeselect,
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
      onBeforeUpdate: onCalendarBeforeUpdate,
      onUpdatePlaceholder: onCalendarPlaceholderChange,
      onUpdateView: (value: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason>) => setView(value, details.reason, details.event),
    }
  }

  return {
    modelValue,
    placeholder,
    open: popover.open,
    view,
    setModelValue,
    setPlaceholder,
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

type ModelHandler = ((value: DateValue | null | undefined, details: ChangeEventDetails<DatePickerChangeReason>) => void) | undefined
