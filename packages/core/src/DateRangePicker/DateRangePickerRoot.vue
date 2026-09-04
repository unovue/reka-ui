<script lang="ts">
import type { Ref } from 'vue'
import type { DateRangeFieldRoot, DateRangeFieldRootProps, PopoverRootEmits, PopoverRootProps, RangeCalendarRootProps } from '..'
import type { Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { DateRange, DateStep, Granularity, HourCycle } from '@/shared/date'

import type { Direction } from '@/shared/types'
import type { TemporalDate } from '@/temporal/types'

import { getWeekStartsOn } from '@/date'
import { createContext, useDirection, useLocale } from '@/shared'
import { getDefaultDate } from '@/shared/date'
import { toPlainDate } from '@/temporal/comparators'
import { PopoverRoot } from '..'

type DateRangePickerRootContext = {
  id: Ref<string | undefined>
  name: Ref<string | undefined>
  minValue: Ref<TemporalDate | undefined>
  maxValue: Ref<TemporalDate | undefined>
  hourCycle: Ref<HourCycle | undefined>
  granularity: Ref<Granularity | undefined>
  hideTimeZone: Ref<boolean>
  required: Ref<boolean>
  locale: Ref<string>
  dateFieldRef: Ref<InstanceType<typeof DateRangeFieldRoot> | undefined>
  modelValue: Ref<{ start: TemporalDate | undefined, end: TemporalDate | undefined }>
  placeholder: Ref<TemporalDate>
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
  open: Ref<boolean>
  modal: Ref<boolean>
  onDateChange: (date: DateRange) => void
  onPlaceholderChange: (date: TemporalDate) => void
  onStartValueChange: (date: TemporalDate | undefined) => void
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

export type DateRangePickerRootEmits = PopoverRootEmits & {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateRange]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TemporalDate]
  /** Event handler called whenever the start value changes */
  'update:startValue': [date: TemporalDate | undefined]
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
  defaultValue: props.defaultPlaceholder ?? defaultDate,
  passive: (props.placeholder === undefined) as false,
}) as Ref<TemporalDate>

const open = useVModel(props, 'open', emits, {
  defaultValue: defaultOpen.value,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const dateFieldRef = ref<InstanceType<typeof DateRangeFieldRoot> | undefined>()

watch(modelValue, (value) => {
  if (value && value.start && !toPlainDate(value.start).equals(toPlainDate(placeholder.value))) {
    placeholder.value = value.start
  }

  if (value.start && value.end) {
    if (closeOnSelect.value) {
      open.value = false
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
  onStartValueChange(date: TemporalDate | undefined) {
    emits('update:startValue', date)
  },
  onDateChange(date: DateRange) {
    modelValue.value = { start: date.start, end: date.end }
  },
  onPlaceholderChange(date: TemporalDate) {
    placeholder.value = date
  },
  closeOnSelect,
})
</script>

<template>
  <PopoverRoot
    v-model:open="open"
    :default-open="defaultOpen"
    :modal="modal"
  >
    <slot
      :model-value="modelValue"
      :open="open"
    />
  </PopoverRoot>
</template>
