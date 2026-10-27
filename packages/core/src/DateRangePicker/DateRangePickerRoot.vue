<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { DateRangeFieldRoot, DateRangeFieldRootProps, PopoverOpenChangeReason, PopoverRootProps, RangeCalendarChangeReason, RangeCalendarRootProps } from '..'
import type { DateRangePickerChangeReason } from './useDateRangePicker'
import type { CalendarUnit, DateValue, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { DateRange, DateStep, Granularity, HourCycle } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { createContext, useDirection, useId, useLocale } from '@/shared'

export type DateRangePickerRootContext = {
  id: Ref<string | undefined>
  name: Ref<string | undefined>
  minValue: Ref<DateValue | undefined>
  maxValue: Ref<DateValue | undefined>
  hourCycle: Ref<HourCycle | undefined>
  granularity: Ref<Granularity | undefined>
  hideTimeZone: Ref<boolean>
  required: Ref<boolean>
  locale: Ref<string>
  dateFieldRef: Ref<InstanceType<typeof DateRangeFieldRoot> | undefined>
  /** Assigning it requests a change with reason `imperative-action`; prefer `setModelValue`. */
  modelValue: Ref<DateRange>
  /** Assigning it requests a change with reason `imperative-action`; prefer `setPlaceholder`. */
  placeholder: Ref<DateValue>
  pagedNavigation: Ref<boolean>
  preventDeselect: Ref<boolean>
  weekStartsOn: Ref<WeekStartsOn>
  weekdayFormat: Ref<WeekDayFormat>
  fixedWeeks: Ref<boolean>
  numberOfMonths: Ref<number>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  isDateDisabled?: Matcher
  isDateUnavailable?: Matcher
  isDateHighlightable?: Matcher
  defaultOpen: Ref<boolean>
  open: ComputedRef<boolean>
  modal: Ref<boolean>
  onDateChange: (date: DateRange, reason?: DateRangePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  onPlaceholderChange: (date: DateValue, reason?: DateRangePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  onStartValueChange: (date: DateValue | undefined, details?: ChangeEventDetails<RangeCalendarChangeReason>) => boolean
  dir: Ref<Direction>
  allowNonContiguousRanges: Ref<boolean>
  fixedDate: Ref<'start' | 'end' | undefined>
  maximumDays?: Ref<number | undefined>
  maximumLength?: Ref<number | undefined>
  step: Ref<DateStep | undefined>
  stepSnapping: Ref<boolean>
  closeOnSelect?: Ref<boolean>
  /** The calendar view (`day` | `month` | `year`). */
  view: ComputedRef<CalendarUnit>
  maxView: Ref<CalendarUnit>
  yearsPerPage: Ref<number>
  columns: Ref<number>
  onViewChange: (view: CalendarUnit, details?: ChangeEventDetails<RangeCalendarChangeReason>) => void
  /** Request a range change. Returns `false` when unchanged or cancelled. */
  setModelValue: (value: DateRange, reason?: DateRangePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  setPlaceholder: (value: DateValue, reason?: DateRangePickerChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Bound to the field's `beforeUpdate:modelValue`: runs the picker's change inside it, and cancels the field's when the picker's is cancelled. */
  onFieldBeforeUpdate: (value: DateRange, details: ChangeEventDetails<any>) => void
  /** Bound to the range calendar's `beforeUpdate:modelValue`. */
  onCalendarBeforeUpdate: (value: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
  /** Bound to the range calendar's `update:placeholder`. */
  onCalendarPlaceholderChange: (value: DateValue, details: ChangeEventDetails<RangeCalendarChangeReason>) => void
}

/**
 * The calendar inside a DateRangePicker always commits days (the field edits
 * full dates), so the calendar's `granularity` is not exposed here; the
 * drill-down views are.
 */
export type DateRangePickerRootProps = Omit<DateRangeFieldRootProps, 'as' | 'asChild' | 'isDateUnavailable'> & Omit<PopoverRootProps, 'handle' | 'triggerId' | 'defaultTriggerId'> & Pick<RangeCalendarRootProps, 'weekStartsOn' | 'weekdayFormat' | 'fixedWeeks' | 'numberOfMonths' | 'preventDeselect' | 'isDateHighlightable' | 'allowNonContiguousRanges' | 'fixedDate' | 'maximumDays' | 'yearsPerPage' | 'columns'> & {
  /** A function that returns whether or not a date is disabled. The picker's calendar always commits days, so it is called only for day-view cells (with `'day'` as its second argument); the month and year views apply only `minValue`, `maxValue` and `disabled`. */
  isDateDisabled?: Matcher
  /** A function that returns whether or not a date is unavailable. The field marks the range invalid when either end, or any day between them, is unavailable. The picker's calendar always commits days, so it is called there only for day-view cells (with `'day'` as its second argument); the month and year views apply only `minValue`, `maxValue` and `disabled`. */
  isDateUnavailable?: Matcher
  /** In the day view, makes the previous and next buttons move by the number of months displayed at once (`numberOfMonths`) rather than one month. The month view always pages by one year and the year view by `yearsPerPage` years. */
  pagedNavigation?: boolean
  /** The maximum length of the range in days (inclusive). */
  maximumLength?: number
  /** The controlled view: the unit the calendar currently shows. Can be bound as `v-model:view`. */
  view?: CalendarUnit
  /** The calendar view shown when the picker opens. Defaults to `day`. */
  defaultView?: CalendarUnit
  /** The coarsest view `DateRangePickerViewTrigger` can switch to. */
  maxView?: CalendarUnit
  /** Whether or not to close the popover on range select */
  closeOnSelect?: boolean
}

/**
 * Why the picker's `open` state changed (#2828): the popover's reasons, plus
 * `date-select` when `closeOnSelect` closes it because the model value changed
 * (a calendar pick, or the parent writing the model while the picker is open).
 */
export type DateRangePickerOpenChangeReason = PopoverOpenChangeReason | 'date-select'

export type DateRangePickerRootEmits = {
  /** Called before the open state changes; `details.cancel()` keeps the current state. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<DateRangePickerOpenChangeReason>]
  /** Event handler called when the open state of the popover changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<DateRangePickerOpenChangeReason>]
  /** Event handler called after the open or close animations of the content have finished. */
  'update:openComplete': [value: boolean]
  /** Called before the range changes, from the field or the calendar; `details.cancel()` keeps the current range. */
  'beforeUpdate:modelValue': [date: DateRange, details: ChangeEventDetails<DateRangePickerChangeReason>]
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateRange, details: ChangeEventDetails<DateRangePickerChangeReason>]
  /** Called before the placeholder changes; `details.cancel()` keeps the current placeholder. */
  'beforeUpdate:placeholder': [date: DateValue, details: ChangeEventDetails<DateRangePickerChangeReason>]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: DateValue, details: ChangeEventDetails<DateRangePickerChangeReason>]
  /** Called before `update:startValue`; `details.cancel()` suppresses that event (the calendar's anchor still moves). */
  'beforeUpdate:startValue': [date: DateValue | undefined, details: ChangeEventDetails<RangeCalendarChangeReason>]
  /** Event handler called whenever the start value changes */
  'update:startValue': [date: DateValue | undefined, details: ChangeEventDetails<RangeCalendarChangeReason>]
  /** Called before the calendar view changes; `details.cancel()` keeps the current view. */
  'beforeUpdate:view': [view: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason>]
  /** Event handler called whenever the calendar view changes */
  'update:view': [view: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason>]
}

export const [injectDateRangePickerRootContext, provideDateRangePickerRootContext]
  = createContext<DateRangePickerRootContext>('DateRangePickerRoot')
</script>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { providePopoverRootContext } from '@/Popover/PopoverRoot.vue'
import { PopperRoot } from '@/Popper'
import { useDateRangePicker } from './useDateRangePicker'

defineOptions({
  inheritAttrs: false,
})
const props = withDefaults(defineProps<DateRangePickerRootProps>(), {
  defaultValue: () => ({ start: undefined, end: undefined }),
  defaultOpen: false,
  open: undefined,
  modal: false,
  pagedNavigation: false,
  preventDeselect: false,
  weekdayFormat: 'narrow',
  fixedWeeks: false,
  numberOfMonths: 1,
  disabled: false,
  readonly: false,
  placeholder: undefined,
  isDateDisabled: undefined,
  isDateUnavailable: undefined,
  isDateHighlightable: undefined,
  allowNonContiguousRanges: false,
  maximumDays: undefined,
  maximumLength: undefined,
  closeOnSelect: false,
  stepSnapping: false,
  view: undefined,
  defaultView: undefined,
  maxView: 'year',
  yearsPerPage: 12,
  columns: 4,
})
const emits = defineEmits<DateRangePickerRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current range */
    modelValue: DateRange
    /** Whether the popover is open */
    open: boolean
  }) => any
}>()
const { locale: propLocale, dir: propDir } = toRefs(props)

const dir = useDirection(propDir)
const locale = useLocale(propLocale)

// The range, placeholder, start value, open (through the composed
// `usePopover`) and view models with their `beforeUpdate:` / `update:` emits
// live in the composable. The root provides the Popover context itself.
const { context, popover, modelValue, open } = useDateRangePicker({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  placeholder: () => props.placeholder,
  defaultPlaceholder: props.defaultPlaceholder,
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  modal: () => props.modal,
  view: () => props.view,
  defaultView: props.defaultView,
  maxView: () => props.maxView,
  closeOnSelect: () => props.closeOnSelect,
  locale,
  dir,
  id: () => props.id,
  name: () => props.name,
  required: () => props.required,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  minValue: () => props.minValue,
  maxValue: () => props.maxValue,
  granularity: () => props.granularity,
  hourCycle: () => props.hourCycle,
  hideTimeZone: () => props.hideTimeZone,
  step: () => props.step,
  stepSnapping: () => props.stepSnapping,
  isDateDisabled: computed(() => props.isDateDisabled),
  isDateUnavailable: computed(() => props.isDateUnavailable),
  isDateHighlightable: computed(() => props.isDateHighlightable),
  weekStartsOn: () => props.weekStartsOn,
  weekdayFormat: () => props.weekdayFormat,
  fixedWeeks: () => props.fixedWeeks,
  numberOfMonths: () => props.numberOfMonths,
  pagedNavigation: () => props.pagedNavigation,
  preventDeselect: () => props.preventDeselect,
  allowNonContiguousRanges: () => props.allowNonContiguousRanges,
  fixedDate: () => props.fixedDate,
  maximumDays: () => props.maximumDays,
  maximumLength: () => props.maximumLength,
  yearsPerPage: () => props.yearsPerPage,
  columns: () => props.columns,
  baseId: useId(undefined, 'reka-popover'),
  emit: emits,
  onOpenComplete: value => emits('update:openComplete', value),
})

providePopoverRootContext(popover.context)
provideDateRangePickerRootContext(context)
</script>

<template>
  <PopperRoot>
    <slot
      :model-value="modelValue"
      :open="open"
    />
  </PopperRoot>
</template>
