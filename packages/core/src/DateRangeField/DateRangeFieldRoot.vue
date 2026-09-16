<script lang="ts">
import type { Ref } from 'vue'
import type { Matcher } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { Formatter } from '@/shared'
import type { DateRange, DateStep, Granularity, HourCycle, SegmentPart, SegmentValueObj } from '@/shared/date'
import type { Direction, FormFieldProps } from '@/shared/types'
import type { TemporalDate } from '@/temporal/types'
import { createContext, useDirection, useLocale } from '@/shared'
import { getDefaultDate, useRangeFieldFocus, useRangeFieldInvalidity, useRangeFieldModel, useSegmentFieldShell } from '@/shared/date'
import { isBeforeOrSame, toPlainDate } from '@/temporal/comparators'

export type DateRangeType = 'start' | 'end'

type DateRangeFieldRootContext = {
  locale: Ref<string>
  startValue: Ref<TemporalDate | undefined>
  endValue: Ref<TemporalDate | undefined>
  placeholder: Ref<TemporalDate>
  isDateUnavailable?: Matcher
  isInvalid: Ref<boolean>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  formatter: Formatter
  hourCycle: HourCycle
  step: Ref<DateStep>
  segmentValues: Record<DateRangeType, Ref<SegmentValueObj>>
  segmentContents: Ref<{ start: { part: SegmentPart, value: string }[], end: { part: SegmentPart, value: string }[] }>
  elements: Ref<Set<HTMLElement>>
  focusNext: () => void
  setFocusedElement: (el: HTMLElement) => void
}

export interface DateRangeFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The default value for the calendar */
  defaultValue?: DateRange
  /** The default placeholder date */
  defaultPlaceholder?: TemporalDate
  /** The placeholder date, which is used to determine what month to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view */
  placeholder?: TemporalDate
  /** The controlled value of the field. Can be bound as `v-model`. */
  modelValue?: DateRange | null
  /** The hour cycle used for formatting times. Defaults to the local preference */
  hourCycle?: HourCycle
  /** The stepping interval for the time fields. Defaults to `1`. */
  step?: DateStep
  /** The granularity to use for formatting times. Defaults to day if a CalendarDate is provided, otherwise defaults to minute. The field will render segments for each part of the date up to and including the specified granularity */
  granularity?: Granularity
  /** Whether or not to hide the time zone segment of the field */
  hideTimeZone?: boolean
  /** The maximum date that can be selected */
  maxValue?: TemporalDate
  /** The minimum date that can be selected */
  minValue?: TemporalDate
  /** The locale to use for formatting dates */
  locale?: string
  /** Whether or not the date field is disabled */
  disabled?: boolean
  /** Whether or not the date field is readonly */
  readonly?: boolean
  /** A function that returns whether or not a date is unavailable */
  isDateUnavailable?: Matcher
  /** Id of the element */
  id?: string
  /** The reading direction of the date field when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
}

export type DateRangeFieldRootEmits = {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateRange]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TemporalDate]
}

export const [injectDateRangeFieldRootContext, provideDateRangeFieldRootContext]
  = createContext<DateRangeFieldRootContext>('DateRangeFieldRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, ref, toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { VisuallyHidden } from '@/VisuallyHidden'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DateRangeFieldRootProps>(), {
  defaultValue: undefined,
  disabled: false,
  readonly: false,
  placeholder: undefined,
  isDateUnavailable: undefined,
})
const emits = defineEmits<DateRangeFieldRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current date range of the field */
    modelValue: DateRange | null
    /** The date field segment contents */
    segments: { start: { part: SegmentPart, value: string }[], end: { part: SegmentPart, value: string }[] }
    /** Value if the input is invalid */
    isInvalid: boolean
  }) => any
}>()
const { disabled, readonly, isDateUnavailable: propsIsDateUnavailable, granularity, dir: propDir, locale: propLocale } = toRefs(props)
const locale = useLocale(propLocale)
const dir = useDirection(propDir)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? { start: undefined, end: undefined },
  passive: (props.modelValue === undefined) as false,
}) as Ref<DateRange | null>

const defaultDate = getDefaultDate({
  defaultPlaceholder: props.placeholder,
  granularity: granularity.value,
  defaultValue: modelValue.value?.start,
  locale: props.locale,
})

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? defaultDate,
  passive: (props.placeholder === undefined) as false,
}) as Ref<TemporalDate>

const startValue = ref(modelValue.value?.start) as Ref<TemporalDate | undefined>
const endValue = ref(modelValue.value?.end) as Ref<TemporalDate | undefined>

// Date fields compare at the day level via toPlainDate.
useRangeFieldModel({
  modelValue,
  startValue,
  endValue,
  areEqual: (a, b) => toPlainDate(a).equals(toPlainDate(b)),
})

// End shell skips placeholder-update: public placeholder tracks the start.
const startShell = useSegmentFieldShell({
  segmentAttribute: 'data-reka-date-field-segment',
  parentElement,
  locale,
  dir,
  modelValue: startValue,
  placeholder,
  granularity,
  hourCycle: props.hourCycle,
  hideTimeZone: props.hideTimeZone,
  step: props.step,
  minValue: props.minValue,
  maxValue: props.maxValue,
  isDateUnavailable: propsIsDateUnavailable.value,
  disabled,
  readonly,
})

const endShell = useSegmentFieldShell({
  segmentAttribute: 'data-reka-date-field-segment',
  parentElement,
  locale,
  dir,
  modelValue: endValue,
  placeholder,
  granularity,
  hourCycle: props.hourCycle,
  hideTimeZone: props.hideTimeZone,
  step: props.step,
  minValue: props.minValue,
  maxValue: props.maxValue,
  isDateUnavailable: propsIsDateUnavailable.value,
  disabled,
  readonly,
  disablePlaceholderUpdate: true,
})

// Start shell's set is the canonical union for cross-side focus.
const segmentElements = startShell.segmentElements

const isInvalid = useRangeFieldInvalidity({
  startInvalidity: startShell.isInvalid,
  endInvalidity: endShell.isInvalid,
  modelValue,
  isOrderValid: (a, b) => isBeforeOrSame(a, b),
  normalize: v => v,
  isUnavailable: propsIsDateUnavailable.value,
})

const { setFocusedElement, focusNext, handleKeydown } = useRangeFieldFocus({
  segmentElements,
  segmentAttribute: 'data-reka-date-field-segment',
  rangeSegmentTypeAttribute: 'data-reka-date-range-field-segment-type',
  dir,
})

const segmentContents = computed(() => ({
  start: startShell.editableSegmentContents.value,
  end: endShell.editableSegmentContents.value,
}))

const slotSegments = computed(() => ({
  start: startShell.segmentContents.value,
  end: endShell.segmentContents.value,
}))

provideDateRangeFieldRootContext({
  isDateUnavailable: propsIsDateUnavailable.value,
  locale,
  startValue,
  endValue,
  placeholder,
  disabled,
  formatter: startShell.formatter,
  hourCycle: startShell.hourCycle,
  step: startShell.step,
  readonly,
  segmentValues: { start: startShell.segmentValues, end: endShell.segmentValues },
  isInvalid,
  segmentContents,
  elements: segmentElements,
  setFocusedElement,
  focusNext,
})

defineExpose({
  setFocusedElement,
})
</script>

<template>
  <Primitive
    v-bind="$attrs"
    ref="primitiveElement"
    role="group"
    :aria-disabled="disabled ? true : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-readonly="readonly ? '' : undefined"
    :data-invalid="isInvalid ? '' : undefined"
    :dir="dir"
    @keydown.left.right="handleKeydown"
  >
    <slot
      :model-value="modelValue"
      :segments="slotSegments"
      :is-invalid="isInvalid"
    />

    <VisuallyHidden
      :id="id"
      as="input"
      feature="focusable"
      tabindex="-1"
      :value="`${modelValue?.start?.toString()} - ${modelValue?.end?.toString()}`"
      :name="name"
      :disabled="disabled"
      :required="required"
      @focus="Array.from(segmentElements)?.[0]?.focus()"
    />
  </Primitive>
</template>
