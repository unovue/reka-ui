<script lang="ts">
import type { Ref } from 'vue'
import type { Grid, Matcher } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { Formatter } from '@/shared'
import type { Direction } from '@/shared/types'
import type { TemporalDate } from '@/temporal/types'
import { isSameYear } from '@/date'
import { createContext, useDirection, useId, useLocale } from '@/shared'
import { getDefaultDate, handleCalendarInitialFocus } from '@/shared/date'
import { useYearPicker, useYearPickerState } from './useYearPicker'

type YearPickerRootContext = {
  locale: Ref<string>
  modelValue: Ref<TemporalDate | TemporalDate[] | undefined>
  placeholder: Ref<TemporalDate>
  multiple: Ref<boolean>
  preventDeselect: Ref<boolean>
  grid: Ref<Grid<TemporalDate>>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  initialFocus: Ref<boolean>
  onYearChange: (date: TemporalDate) => void
  onPlaceholderChange: (date: TemporalDate) => void
  fullCalendarLabel: Ref<string>
  parentElement: Ref<HTMLElement | undefined>
  headingValue: Ref<string>
  headingId: string
  isInvalid: Ref<boolean>
  isYearDisabled: Matcher
  isYearSelected: Matcher
  isYearUnavailable?: Matcher
  prevPage: (prevPageFunc?: (date: TemporalDate) => TemporalDate) => void
  nextPage: (nextPageFunc?: (date: TemporalDate) => TemporalDate) => void
  isNextButtonDisabled: (nextPageFunc?: (date: TemporalDate) => TemporalDate) => boolean
  isPrevButtonDisabled: (prevPageFunc?: (date: TemporalDate) => TemporalDate) => boolean
  formatter: Formatter
  dir: Ref<Direction>
  minValue: Ref<TemporalDate | undefined>
  maxValue: Ref<TemporalDate | undefined>
  yearsPerPage: Ref<number>
}

export interface YearPickerRootProps extends PrimitiveProps {
  /** The default value for the year picker */
  defaultValue?: TemporalDate
  /** The default placeholder date */
  defaultPlaceholder?: TemporalDate
  /** The placeholder date, which is used to determine what year range to display when no date is selected */
  placeholder?: TemporalDate
  /** Whether or not to prevent the user from deselecting a date without selecting another date first */
  preventDeselect?: boolean
  /** The accessible label for the year picker */
  calendarLabel?: string
  /** The maximum date that can be selected */
  maxValue?: TemporalDate
  /** The minimum date that can be selected */
  minValue?: TemporalDate
  /** The locale to use for formatting dates */
  locale?: string
  /** Whether the year picker is disabled */
  disabled?: boolean
  /** Whether the year picker is readonly */
  readonly?: boolean
  /** If true, the year picker will focus the selected year, today, or the first year of the range on mount */
  initialFocus?: boolean
  /** A function that returns whether or not a year is disabled */
  isYearDisabled?: Matcher
  /** A function that returns whether or not a year is unavailable */
  isYearUnavailable?: Matcher
  /** The reading direction of the calendar when applicable. If omitted, inherits globally from `ConfigProvider` or assumes LTR. */
  dir?: Direction
  /** A function that returns the next page of the year picker. Receives the current placeholder as an argument. */
  nextPage?: (placeholder: TemporalDate) => TemporalDate
  /** A function that returns the previous page of the year picker. Receives the current placeholder as an argument. */
  prevPage?: (placeholder: TemporalDate) => TemporalDate
  /** The controlled selected year value of the year picker. Can be bound as `v-model`. */
  modelValue?: TemporalDate | TemporalDate[] | undefined
  /** Whether multiple years can be selected */
  multiple?: boolean
  /** Number of years to display per page */
  yearsPerPage?: number
}

export type YearPickerRootEmits = {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: TemporalDate | TemporalDate[] | undefined]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TemporalDate]
}

export const [injectYearPickerRootContext, provideYearPickerRootContext]
  = createContext<YearPickerRootContext>('YearPickerRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { onMounted, toRefs, watch } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'

const props = withDefaults(defineProps<YearPickerRootProps>(), {
  defaultValue: undefined,
  as: 'div',
  preventDeselect: false,
  multiple: false,
  disabled: false,
  readonly: false,
  initialFocus: false,
  placeholder: undefined,
  isYearDisabled: undefined,
  isYearUnavailable: undefined,
  yearsPerPage: 12,
})
const emits = defineEmits<YearPickerRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current date of the placeholder */
    date: TemporalDate
    /** The grid of years */
    grid: Grid<TemporalDate>
    /** The year picker locale */
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
  isYearDisabled: propsIsYearDisabled,
  isYearUnavailable: propsIsYearUnavailable,
  calendarLabel,
  defaultValue,
  nextPage: propsNextPage,
  prevPage: propsPrevPage,
  dir: propDir,
  locale: propLocale,
  yearsPerPage,
} = toRefs(props)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()
const locale = useLocale(propLocale)
const dir = useDirection(propDir)
const headingId = useId(undefined, 'reka-year-picker-heading')

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
  isYearDisabled,
  isYearUnavailable,
  isNextButtonDisabled,
  isPrevButtonDisabled,
  nextPage,
  prevPage,
  formatter,
  grid,
} = useYearPicker({
  locale,
  placeholder,
  minValue,
  maxValue,
  disabled,
  yearsPerPage,
  isYearDisabled: propsIsYearDisabled,
  isYearUnavailable: propsIsYearUnavailable,
  calendarLabel,
  nextPage: propsNextPage,
  prevPage: propsPrevPage,
})

const { isInvalid, isYearSelected } = useYearPickerState({
  date: modelValue,
  isYearDisabled,
  isYearUnavailable,
})

watch(modelValue, (_modelValue) => {
  if (Array.isArray(_modelValue) && _modelValue.length) {
    const lastValue = _modelValue.at(-1)
    if (lastValue && !isSameYear(placeholder.value, lastValue))
      onPlaceholderChange(lastValue)
  }
  else if (!Array.isArray(_modelValue) && _modelValue && !isSameYear(placeholder.value, _modelValue)) {
    onPlaceholderChange(_modelValue)
  }
})

function onYearChange(value: TemporalDate) {
  if (!multiple.value) {
    if (!modelValue.value) {
      modelValue.value = value
      return
    }

    if (!preventDeselect.value && isSameYear(modelValue.value as TemporalDate, value)) {
      placeholder.value = value
      modelValue.value = undefined
    }
    else {
      modelValue.value = value
    }
  }
  else {
    const current = Array.isArray(modelValue.value) ? modelValue.value : [modelValue.value]
    const index = current.findIndex(date => isSameYear(date, value))
    if (index === -1) {
      modelValue.value = [...current, value]
    }
    else if (!preventDeselect.value) {
      const next = current.filter(date => !isSameYear(date, value))
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

provideYearPickerRootContext({
  isYearUnavailable,
  dir,
  isYearDisabled,
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
  isYearSelected,
  isNextButtonDisabled,
  isPrevButtonDisabled,
  nextPage,
  prevPage,
  parentElement,
  onPlaceholderChange,
  onYearChange,
  minValue,
  maxValue,
  yearsPerPage,
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
