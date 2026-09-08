<script lang="ts">
import type { Ref } from 'vue'
import type { Grid, Matcher } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { Formatter } from '@/shared'
import type { Direction } from '@/shared/types'
import type { TemporalDate } from '@/temporal/types'
import { isSameYearMonth } from '@/date'
import { createContext, useDirection, useId, useLocale } from '@/shared'
import { getDefaultDate, handleCalendarInitialFocus } from '@/shared/date'
import { useMonthPicker, useMonthPickerState } from './useMonthPicker'

type MonthPickerRootContext = {
  locale: Ref<string>
  modelValue: Ref<TemporalDate | TemporalDate[] | undefined>
  placeholder: Ref<TemporalDate>
  multiple: Ref<boolean>
  preventDeselect: Ref<boolean>
  grid: Ref<Grid<TemporalDate>>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  initialFocus: Ref<boolean>
  onMonthChange: (date: TemporalDate) => void
  onPlaceholderChange: (date: TemporalDate) => void
  fullCalendarLabel: Ref<string>
  parentElement: Ref<HTMLElement | undefined>
  headingValue: Ref<string>
  headingId: string
  isInvalid: Ref<boolean>
  isMonthDisabled: Matcher
  isMonthSelected: Matcher
  isMonthUnavailable?: Matcher
  prevPage: (prevPageFunc?: (date: TemporalDate) => TemporalDate) => void
  nextPage: (nextPageFunc?: (date: TemporalDate) => TemporalDate) => void
  isNextButtonDisabled: (nextPageFunc?: (date: TemporalDate) => TemporalDate) => boolean
  isPrevButtonDisabled: (prevPageFunc?: (date: TemporalDate) => TemporalDate) => boolean
  formatter: Formatter
  dir: Ref<Direction>
  minValue: Ref<TemporalDate | undefined>
  maxValue: Ref<TemporalDate | undefined>
}

export interface MonthPickerRootProps extends PrimitiveProps {
  /** The default value for the month picker */
  defaultValue?: TemporalDate
  /** The default placeholder date */
  defaultPlaceholder?: TemporalDate
  /** The placeholder date, which is used to determine what year to display when no date is selected */
  placeholder?: TemporalDate
  /** Whether or not to prevent the user from deselecting a date without selecting another date first */
  preventDeselect?: boolean
  /** The accessible label for the month picker */
  calendarLabel?: string
  /** The maximum date that can be selected */
  maxValue?: TemporalDate
  /** The minimum date that can be selected */
  minValue?: TemporalDate
  /** The locale to use for formatting dates */
  locale?: string
  /** Whether the month picker is disabled */
  disabled?: boolean
  /** Whether the month picker is readonly */
  readonly?: boolean
  /** If true, the month picker will focus the selected month, today, or the first month of the year on mount */
  initialFocus?: boolean
  /** A function that returns whether or not a month is disabled */
  isMonthDisabled?: Matcher
  /** A function that returns whether or not a month is unavailable */
  isMonthUnavailable?: Matcher
  /** The reading direction of the calendar when applicable. If omitted, inherits globally from `ConfigProvider` or assumes LTR. */
  dir?: Direction
  /** A function that returns the next page of the month picker. Receives the current placeholder as an argument. */
  nextPage?: (placeholder: TemporalDate) => TemporalDate
  /** A function that returns the previous page of the month picker. Receives the current placeholder as an argument. */
  prevPage?: (placeholder: TemporalDate) => TemporalDate
  /** The controlled selected month value of the month picker. Can be bound as `v-model`. */
  modelValue?: TemporalDate | TemporalDate[] | undefined
  /** Whether multiple months can be selected */
  multiple?: boolean
}

export type MonthPickerRootEmits = {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: TemporalDate | TemporalDate[] | undefined]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TemporalDate]
}

export const [injectMonthPickerRootContext, provideMonthPickerRootContext]
  = createContext<MonthPickerRootContext>('MonthPickerRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { onMounted, toRefs, watch } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'

const props = withDefaults(defineProps<MonthPickerRootProps>(), {
  defaultValue: undefined,
  as: 'div',
  preventDeselect: false,
  multiple: false,
  disabled: false,
  readonly: false,
  initialFocus: false,
  placeholder: undefined,
  isMonthDisabled: undefined,
  isMonthUnavailable: undefined,
})
const emits = defineEmits<MonthPickerRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current date of the placeholder */
    date: TemporalDate
    /** The grid of months */
    grid: Grid<TemporalDate>
    /** The month picker locale */
    locale: string
    /** The current selected value */
    modelValue: TemporalDate | TemporalDate[] | undefined
  }) => any
}>()

const {
  disabled,
  readonly,
  initialFocus,
  multiple,
  minValue,
  maxValue,
  preventDeselect,
  isMonthDisabled: propsIsMonthDisabled,
  isMonthUnavailable: propsIsMonthUnavailable,
  calendarLabel,
  defaultValue,
  nextPage: propsNextPage,
  prevPage: propsPrevPage,
  dir: propDir,
  locale: propLocale,
} = toRefs(props)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()
const locale = useLocale(propLocale)
const dir = useDirection(propDir)
const headingId = useId(undefined, 'reka-month-picker-heading')

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: defaultValue.value,
  passive: (props.modelValue === undefined) as false,
}) as Ref<TemporalDate | TemporalDate[] | undefined>

const defaultDate = getDefaultDate({
  defaultPlaceholder: props.placeholder,
  defaultValue: modelValue.value,
  locale: props.locale,
})

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? defaultDate,
  passive: (props.placeholder === undefined) as false,
}) as Ref<TemporalDate>

function onPlaceholderChange(value: TemporalDate) {
  placeholder.value = value
}

const {
  fullCalendarLabel,
  headingValue,
  isMonthDisabled,
  isMonthUnavailable,
  isNextButtonDisabled,
  isPrevButtonDisabled,
  nextPage,
  prevPage,
  formatter,
  grid,
} = useMonthPicker({
  locale,
  placeholder,
  minValue,
  maxValue,
  disabled,
  isMonthDisabled: propsIsMonthDisabled,
  isMonthUnavailable: propsIsMonthUnavailable,
  calendarLabel,
  nextPage: propsNextPage,
  prevPage: propsPrevPage,
})

const { isInvalid, isMonthSelected } = useMonthPickerState({
  date: modelValue,
  isMonthDisabled,
  isMonthUnavailable,
})

watch(modelValue, (_modelValue) => {
  if (Array.isArray(_modelValue) && _modelValue.length) {
    const lastValue = _modelValue.at(-1)
    if (lastValue && !isSameYearMonth(placeholder.value, lastValue))
      onPlaceholderChange(lastValue)
  }
  else if (!Array.isArray(_modelValue) && _modelValue && !isSameYearMonth(placeholder.value, _modelValue)) {
    onPlaceholderChange(_modelValue)
  }
})

function onMonthChange(value: TemporalDate) {
  if (!multiple.value) {
    if (!modelValue.value) {
      modelValue.value = value
      return
    }

    if (!preventDeselect.value && isSameYearMonth(modelValue.value as TemporalDate, value)) {
      placeholder.value = value
      modelValue.value = undefined
    }
    else {
      modelValue.value = value
    }
  }
  else if (!modelValue.value) {
    modelValue.value = [value]
  }
  else {
    const modelValueArray = Array.isArray(modelValue.value)
      ? modelValue.value
      : [modelValue.value]

    const index = modelValueArray.findIndex(date => isSameYearMonth(date, value))
    if (index === -1) {
      modelValue.value = [...modelValueArray, value]
    }
    else if (!preventDeselect.value) {
      const next = modelValueArray.filter(date => !isSameYearMonth(date, value))
      if (!next.length) {
        placeholder.value = value
        modelValue.value = undefined
        return
      }
      modelValue.value = next
    }
  }
}

onMounted(() => {
  if (initialFocus.value)
    handleCalendarInitialFocus(parentElement.value)
})

provideMonthPickerRootContext({
  isMonthUnavailable,
  dir,
  isMonthDisabled,
  locale,
  formatter,
  modelValue,
  placeholder,
  disabled,
  initialFocus,
  grid,
  multiple,
  readonly,
  preventDeselect,
  fullCalendarLabel,
  headingValue,
  headingId,
  isInvalid,
  isMonthSelected,
  isNextButtonDisabled,
  isPrevButtonDisabled,
  nextPage,
  prevPage,
  parentElement,
  onPlaceholderChange,
  onMonthChange,
  minValue,
  maxValue,
})
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    :aria-label="fullCalendarLabel"
    :data-readonly="readonly ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-invalid="isInvalid ? '' : undefined"
    :dir="dir"
  >
    <slot
      :date="placeholder"
      :grid="grid"
      :locale="locale"
      :model-value="modelValue"
    />
    <div
      style="border: 0px; clip: rect(0px, 0px, 0px, 0px); clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; white-space: nowrap; width: 1px;"
    >
      <div
        role="heading"
        aria-level="2"
      >
        {{ fullCalendarLabel }}
      </div>
    </div>
  </Primitive>
</template>
