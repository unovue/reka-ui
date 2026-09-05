<script lang="ts">
import type { DateValue } from '@internationalized/date'

import type { ComputedRef, Ref } from 'vue'
import type { DateRangeFieldRoot, DateRangeFieldRootProps, PopoverOpenChangeReason, PopoverRootProps, RangeCalendarRootProps } from '..'
import type { Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { ChangeEventDetails } from '@/shared'
import type { DateRange, DateStep, Granularity, HourCycle } from '@/shared/date'

import type { Direction } from '@/shared/types'
import { getWeekStartsOn } from '@/date'
import { createContext, useControllableState, useDirection, useLocale } from '@/shared'
import { getDefaultDate } from '@/shared/date'
import { PopoverRoot } from '..'

type DateRangePickerRootContext = {
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
  modelValue: Ref<{ start: DateValue | undefined, end: DateValue | undefined }>
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
  onDateChange: (date: DateRange) => void
  onPlaceholderChange: (date: DateValue) => void
  onStartValueChange: (date: DateValue | undefined) => void
  dir: Ref<Direction>
  allowNonContiguousRanges: Ref<boolean>
  fixedDate: Ref<'start' | 'end' | undefined>
  maximumDays?: Ref<number | undefined>
  step: Ref<DateStep | undefined>
  closeOnSelect?: Ref<boolean>
}

export type DateRangePickerRootProps = Omit<DateRangeFieldRootProps, 'as' | 'asChild'> & PopoverRootProps & Pick<RangeCalendarRootProps, 'isDateDisabled' | 'pagedNavigation' | 'weekStartsOn' | 'weekdayFormat' | 'fixedWeeks' | 'numberOfMonths' | 'preventDeselect' | 'isDateUnavailable' | 'isDateHighlightable' | 'allowNonContiguousRanges' | 'fixedDate' | 'maximumDays'> & {
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
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateRange]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: DateValue]
  /** Event handler called whenever the start value changes */
  'update:startValue': [date: DateValue | undefined]
}

export const [injectDateRangePickerRootContext, provideDateRangePickerRootContext]
  = createContext<DateRangePickerRootContext>('DateRangePickerRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, ref, toRefs, watch } from 'vue'

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
  closeOnSelect: false,
})
const emits = defineEmits<DateRangePickerRootEmits>()
const {
  locale: propLocale,
  disabled,
  readonly,
  pagedNavigation,
  weekdayFormat,
  fixedWeeks,
  numberOfMonths,
  preventDeselect,
  isDateDisabled: propsIsDateDisabled,
  isDateUnavailable: propsIsDateUnavailable,
  isDateHighlightable: propsIsDateHighlightable,
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
  dir: propsDir,
  allowNonContiguousRanges,
  fixedDate,
  maximumDays,
  step,
  closeOnSelect,
} = toRefs(props)

const dir = useDirection(propsDir)
const locale = useLocale(propLocale)
const weekStartsOn = computed(() => props.weekStartsOn ?? getWeekStartsOn(locale.value))

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? { start: undefined, end: undefined },
  passive: (props.modelValue === undefined) as false,
}) as Ref<DateRange>

const defaultDate = getDefaultDate({
  defaultPlaceholder: props.placeholder,
  granularity: props.granularity,
  defaultValue: modelValue.value?.start,
  locale: locale.value,
})

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? defaultDate.copy(),
  passive: (props.placeholder === undefined) as false,
}) as Ref<DateValue>

// The inner `PopoverRoot` is controlled by this model, so a `beforeUpdate:open`
// cancel here keeps both in sync; the popover's reason and event are forwarded.
const { state: open, setState: setOpen } = useControllableState<boolean, DateRangePickerOpenChangeReason>({
  prop: () => props.open,
  defaultValue: defaultOpen.value,
  name: 'open',
  emit: emits,
})

const dateFieldRef = ref<InstanceType<typeof DateRangeFieldRoot> | undefined>()

watch(modelValue, (value) => {
  if (value && value.start && value.start.compare(placeholder.value) !== 0) {
    placeholder.value = value.start.copy()
  }

  if (value.start && value.end) {
    if (closeOnSelect.value) {
      setOpen(false, 'date-select')
    }
  }
})

provideDateRangePickerRootContext({
  allowNonContiguousRanges,
  isDateUnavailable: propsIsDateUnavailable.value,
  isDateDisabled: propsIsDateDisabled.value,
  isDateHighlightable: propsIsDateHighlightable.value,
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
  fixedDate,
  maximumDays,
  step,
  onStartValueChange(date: DateValue | undefined) {
    emits('update:startValue', date)
  },
  onDateChange(date: DateRange) {
    modelValue.value = { start: date.start?.copy(), end: date.end?.copy() }
  },
  onPlaceholderChange(date: DateValue) {
    placeholder.value = date.copy()
  },
  closeOnSelect,
})
</script>

<template>
  <PopoverRoot
    :open="open"
    :modal="modal"
    @update:open="(value, details) => setOpen(value, details.reason, details.event)"
  >
    <slot
      :model-value="modelValue"
      :open="open"
    />
  </PopoverRoot>
</template>
