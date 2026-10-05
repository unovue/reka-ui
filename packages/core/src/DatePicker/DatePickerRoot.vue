<script lang="ts">
import type { DateValue } from '@internationalized/date'

import type { ComputedRef, Ref } from 'vue'
import type { CalendarChangeReason, CalendarRootProps, DateFieldRoot, DateFieldRootProps, PopoverOpenChangeReason, PopoverRootProps } from '..'
import type { CalendarUnit, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { ChangeEventDetails } from '@/shared'
import type { DateStep, Granularity, HourCycle } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { isEqualDay } from '@internationalized/date'
import { computed, ref, toRefs, watch } from 'vue'
import { getWeekStartsOn, isSameDateSelection, isSameDateValue } from '@/date'
import { createContext, useControllableState, useDirection, useLocale } from '@/shared'
import { getDefaultDate } from '@/shared/date'
import { PopoverRoot } from '..'

type DatePickerRootContext = {
  id: Ref<string | undefined>
  name: Ref<string | undefined>
  minValue: Ref<DateValue | undefined>
  maxValue: Ref<DateValue | undefined>
  hourCycle: Ref<HourCycle | undefined>
  granularity: Ref<Granularity | undefined>
  hideTimeZone: Ref<boolean>
  required: Ref<boolean>
  locale: Ref<string>
  dateFieldRef: Ref<InstanceType<typeof DateFieldRoot> | undefined>
  modelValue: Ref<DateValue | undefined>
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
  defaultOpen: Ref<boolean>
  open: ComputedRef<boolean>
  modal: Ref<boolean>
  onDateChange: (date: DateValue | undefined) => void
  onPlaceholderChange: (date: DateValue) => void
  dir: Ref<Direction>
  step: Ref<DateStep | undefined>
  closeOnSelect: Ref<boolean>
  /** The calendar view (`day` | `month` | `year`). */
  view: ComputedRef<CalendarUnit>
  maxView: Ref<CalendarUnit>
  yearsPerPage: Ref<number>
  columns: Ref<number>
  onViewChange: (view: CalendarUnit, details?: ChangeEventDetails<CalendarChangeReason>) => void
}

/**
 * The calendar inside a DatePicker always commits days (the field edits full
 * dates), so the calendar's `granularity` is not exposed here; the drill-down
 * views are.
 */
export type DatePickerRootProps = Omit<DateFieldRootProps, 'as' | 'asChild'> & PopoverRootProps & Pick<CalendarRootProps, 'isDateDisabled' | 'pagedNavigation' | 'weekStartsOn' | 'weekdayFormat' | 'fixedWeeks' | 'numberOfMonths' | 'preventDeselect' | 'yearsPerPage' | 'columns'> & {
  /** The controlled view: the unit the calendar currently shows. Can be bound as `v-model:view`. */
  view?: CalendarUnit
  /** The calendar view shown when the picker opens. Defaults to `day`. */
  defaultView?: CalendarUnit
  /** The coarsest view `DatePickerViewTrigger` can switch to. */
  maxView?: CalendarUnit
  /** Whether or not to close the popover on date select */
  closeOnSelect?: boolean
}

/**
 * Why the picker's `open` state changed (#2828): the popover's reasons, plus
 * `date-select` when `closeOnSelect` closes it because the model value changed
 * (a calendar pick, or the parent writing the model while the picker is open).
 */
export type DatePickerOpenChangeReason = PopoverOpenChangeReason | 'date-select'

export type DatePickerRootEmits = {
  /** Called before the open state changes; `details.cancel()` keeps the current state. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<DatePickerOpenChangeReason>]
  /** Event handler called when the open state of the popover changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<DatePickerOpenChangeReason>]
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateValue | undefined]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: DateValue]
  /** Called before the calendar view changes; `details.cancel()` keeps the current view. */
  'beforeUpdate:view': [view: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason>]
  /** Event handler called whenever the calendar view changes */
  'update:view': [view: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason>]
}

export const [injectDatePickerRootContext, provideDatePickerRootContext]
  = createContext<DatePickerRootContext>('DatePickerRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'

defineOptions({
  inheritAttrs: false,
})
const props = withDefaults(defineProps<DatePickerRootProps>(), {
  defaultValue: undefined,
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
  closeOnSelect: false,
  view: undefined,
  defaultView: undefined,
  maxView: 'year',
  yearsPerPage: 12,
  columns: 4,
})
const emits = defineEmits<DatePickerRootEmits>()
const {
  locale: propLocale,
  maxView,
  yearsPerPage,
  columns,
  disabled,
  readonly,
  pagedNavigation,
  weekdayFormat,
  fixedWeeks,
  numberOfMonths,
  preventDeselect,
  isDateDisabled: propsIsDateDisabled,
  isDateUnavailable: propsIsDateUnavailable,
  defaultOpen,
  modal,
  id,
  name,
  required,
  minValue,
  maxValue,
  granularity,
  hideTimeZone,
  hourCycle,
  defaultValue,
  dir: propDir,
  step,
  closeOnSelect,
} = toRefs(props)

const dir = useDirection(propDir)
const locale = useLocale(propLocale)
const weekStartsOn = computed(() => props.weekStartsOn ?? getWeekStartsOn(locale.value))

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: defaultValue.value,
  passive: (props.modelValue === undefined) as false,
}) as Ref<DateValue | undefined>

const defaultDate = computed(() => getDefaultDate({
  defaultPlaceholder: props.placeholder,
  granularity: props.granularity,
  defaultValue: modelValue.value,
  locale: locale.value,
}))

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? defaultDate.value.copy(),
  passive: (props.placeholder === undefined) as false,
}) as Ref<DateValue>

// The inner `PopoverRoot` is controlled by this model, so a `beforeUpdate:open`
// cancel here keeps both in sync; the popover's reason and event are forwarded.
const { state: open, setState: setOpen } = useControllableState<boolean, DatePickerOpenChangeReason>({
  prop: () => props.open,
  defaultValue: defaultOpen.value,
  name: 'open',
  emit: emits,
})

// Same contract as `open`: the inner calendar is controlled by this model, so a
// `beforeUpdate:view` cancel here keeps both in sync; the calendar's reason and
// event are forwarded.
const { state: view, setState: setView, isControlled: isViewControlled } = useControllableState<CalendarUnit, CalendarChangeReason>({
  prop: () => props.view,
  defaultValue: props.defaultView ?? 'day',
  name: 'view',
  emit: emits,
})

// `defaultView` is the view each time the picker opens: an uncontrolled view
// left on month / year when the popover closed goes back to it on reopen.
watch(open, (isOpen) => {
  if (isOpen && !isViewControlled.value)
    setView(props.defaultView ?? 'day')
})

const dateFieldRef = ref<InstanceType<typeof DateFieldRoot> | undefined>()

/**
 * Reset time fields on DateValue instances that support time granularity.
 */
function resetTime(date: DateValue) {
  if (!('hour' in date))
    return date

  return date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
}

watch(modelValue, (value, previous) => {
  // A new object for the same value is not a new selection. Skip placeholder
  // reset and closeOnSelect, or paging the calendar is undone. Compare the
  // exact value, not the day, so a same-day time or zone change still syncs.
  if (isSameDateSelection(previous, value, isSameDateValue))
    return

  if (value && !isSameDateValue(value, placeholder.value)) {
    placeholder.value = value.copy()
  }
  else if (!value && 'hour' in placeholder.value) {
    placeholder.value = resetTime(placeholder.value)
  }
  // Only a new day is a pick. A same-day time or zone change leaves the popover open.
  if (closeOnSelect.value && !isSameDateSelection(previous, value, isEqualDay)) {
    setOpen(false, 'date-select')
  }
})

provideDatePickerRootContext({
  isDateUnavailable: propsIsDateUnavailable.value,
  isDateDisabled: propsIsDateDisabled.value,
  locale,
  disabled,
  pagedNavigation,
  weekStartsOn,
  weekdayFormat,
  fixedWeeks,
  numberOfMonths,
  readonly,
  preventDeselect,
  modelValue,
  placeholder,
  defaultOpen,
  modal,
  open,
  id,
  name,
  required,
  minValue,
  maxValue,
  granularity,
  hideTimeZone,
  hourCycle,
  dateFieldRef,
  dir,
  step,
  onDateChange(date: DateValue | undefined) {
    if (!date) {
      modelValue.value = undefined
    }
    else if (!modelValue.value) {
      modelValue.value = date.copy()
    }
    else if (!preventDeselect.value && date && modelValue.value.compare(date) === 0) {
      modelValue.value = undefined
    }
    else {
      modelValue.value = date.copy()
    }
  },
  onPlaceholderChange(date: DateValue) {
    placeholder.value = date.copy()
  },
  closeOnSelect,
  view,
  maxView,
  yearsPerPage,
  columns,
  onViewChange(next: CalendarUnit, details?: ChangeEventDetails<CalendarChangeReason>) {
    setView(next, details?.reason, details?.event)
  },
})
</script>

<template>
  <PopoverRoot
    :open="open"
    :modal="modal"
    @update:open="(value, details) => setOpen(value, details.reason, details.event)"
  >
    <slot />
  </PopoverRoot>
</template>
