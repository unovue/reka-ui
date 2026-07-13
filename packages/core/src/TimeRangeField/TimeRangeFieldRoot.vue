<script lang="ts">
import type { Ref } from 'vue'
import type { Matcher } from '@/date'
import type { DateRangeType } from '@/DateRangeField/DateRangeFieldRoot.vue'
import type { PrimitiveProps } from '@/Primitive'
import type { Formatter } from '@/shared'
import type { DateStep, HourCycle, SegmentPart, SegmentValueObj, TimeValue } from '@/shared/date'
import type { TimeRange } from '@/shared/date/types'
import type { Direction, FormFieldProps } from '@/shared/types'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { createContext, useDirection, useLocale } from '@/shared'
import { getDefaultDate, getDefaultTime, toPublicTimeValue, toShellDateTime, useDisplaySegmentContents, useRangeFieldFocus, useRangeFieldInvalidity, useRangeFieldModel, useSegmentFieldShell } from '@/shared/date'

type TimeRangeFieldRootContext = {
  locale: Ref<string>
  startValue: Ref<Temporal.PlainDateTime | undefined>
  endValue: Ref<Temporal.PlainDateTime | undefined>
  placeholder: Ref<Temporal.PlainDateTime>
  isInvalid: Ref<boolean>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  formatter: Formatter
  hourCycle: HourCycle
  step: Ref<DateStep>
  stepSnapping: Ref<boolean>
  segmentValues: Record<DateRangeType, Ref<SegmentValueObj>>
  segmentContents: Ref<{ start: { part: SegmentPart, value: string }[], end: { part: SegmentPart, value: string }[] }>
  elements: Ref<Set<HTMLElement>>
  focusNext: () => void
  setFocusedElement: (el: HTMLElement) => void
}

export interface TimeRangeFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The default value for the field */
  defaultValue?: TimeRange
  /** The default placeholder time */
  defaultPlaceholder?: TimeValue
  /** The placeholder time, which is used to determine what time to display when no time is selected. This updates as the user navigates the field */
  placeholder?: TimeValue
  /** The controlled checked state of the field. Can be bound as `v-model`. */
  modelValue?: TimeRange | null
  /** The hour cycle used for formatting times. Defaults to the local preference */
  hourCycle?: HourCycle
  /** The stepping interval for the time fields. Defaults to `1`. */
  step?: DateStep
  /** Whether to enforce snapping the value to the nearest step increment after input. Defaults to `false`. */
  stepSnapping?: boolean
  /** The granularity to use for formatting times. Defaults to minute. The field will render segments for each part of the time up to and including the specified granularity */
  granularity?: 'hour' | 'minute' | 'second'
  /** Whether or not to hide the time zone segment of the field */
  hideTimeZone?: boolean
  /** The maximum time that can be selected */
  maxValue?: TimeValue
  /** The minimum time that can be selected */
  minValue?: TimeValue
  /** The locale to use for formatting times */
  locale?: string
  /** Whether or not the time field is disabled */
  disabled?: boolean
  /** Whether or not the time field is readonly */
  readonly?: boolean
  /** Id of the element */
  id?: string
  /** The reading direction of the time field when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** A function that returns whether or not a time is unavailable */
  isTimeUnavailable?: Matcher
}

export type TimeRangeFieldRootEmits = {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: TimeRange]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TimeValue]
}

export const [injectTimeRangeFieldRootContext, provideTimeRangeFieldRootContext]
  = createContext<TimeRangeFieldRootContext>('TimeRangeFieldRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, ref, toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { VisuallyHidden } from '@/VisuallyHidden'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TimeRangeFieldRootProps>(), {
  defaultValue: undefined,
  disabled: false,
  readonly: false,
  placeholder: undefined,
  isTimeUnavailable: undefined,
  stepSnapping: false,
})
const emits = defineEmits<TimeRangeFieldRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current time of the field */
    modelValue: TimeRange | undefined
    /** The time field segment contents */
    segments: { start: { part: SegmentPart, value: string }[], end: { part: SegmentPart, value: string }[] }
    /** Value if the input is invalid */
    isInvalid: boolean
  }) => any
}>()

const { disabled, readonly, granularity, defaultValue, minValue, maxValue, stepSnapping, isTimeUnavailable: propsIsTimeUnavailable, dir: propDir, locale: propLocale } = toRefs(props)
const locale = useLocale(propLocale)
const dir = useDirection(propDir)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: defaultValue.value ?? { start: undefined, end: undefined },
  passive: (props.modelValue === undefined) as false,
}) as Ref<TimeRange>

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? getDefaultTime({
    defaultPlaceholder: props.placeholder,
    defaultValue: modelValue.value?.start,
  }),
  passive: (props.placeholder === undefined) as false,
}) as Ref<TimeValue>

const startValue = ref(modelValue.value?.start) as Ref<TimeValue | undefined>
const endValue = ref(modelValue.value?.end) as Ref<TimeValue | undefined>

// Time ranges compare at time-of-day via PlainDateTime.
useRangeFieldModel({
  modelValue,
  startValue,
  endValue,
  areEqual: (a, b) =>
    Temporal.PlainDateTime.compare(toShellDateTime(a)!, toShellDateTime(b)!) === 0,
})

const convertedStartValue = computed<Temporal.PlainDateTime | undefined>({
  get() {
    return toShellDateTime(startValue.value)
  },
  set(newValue) {
    startValue.value = newValue ? toPublicTimeValue(newValue, startValue.value ?? placeholder.value) : undefined
  },
})

const convertedEndValue = computed<Temporal.PlainDateTime | undefined>({
  get() {
    return toShellDateTime(endValue.value)
  },
  set(newValue) {
    endValue.value = newValue ? toPublicTimeValue(newValue, endValue.value ?? placeholder.value) : undefined
  },
})

const convertedPlaceholder = computed<Temporal.PlainDateTime>({
  get() {
    return toShellDateTime(placeholder.value) ?? getDefaultDate({ granularity: 'hour' }) as Temporal.PlainDateTime
  },
  set(newValue) {
    placeholder.value = toPublicTimeValue(newValue, placeholder.value)
  },
})

const convertedMinValue = computed(() =>
  minValue.value ? toShellDateTime(minValue.value) : undefined)
const convertedMaxValue = computed(() =>
  maxValue.value ? toShellDateTime(maxValue.value) : undefined)

// ZonedDateTime needs a ZonedDateTime dateRef so the formatter renders the right zone.
const shellDateRef = computed<TemporalDate>(() => {
  const original = modelValue.value?.start ?? placeholder.value
  if (original && 'timeZoneId' in original)
    return convertedPlaceholder.value.toZonedDateTime(original.timeZoneId)
  return convertedPlaceholder.value
})

// End shell skips placeholder-update: public placeholder tracks the start.
const startShell = useSegmentFieldShell({
  segmentAttribute: 'data-reka-time-field-segment',
  parentElement,
  locale,
  dir,
  modelValue: convertedStartValue,
  placeholder: convertedPlaceholder,
  granularity,
  hourCycle: props.hourCycle,
  hideTimeZone: props.hideTimeZone,
  step: props.step,
  stepSnapping,
  isTimeValue: true,
  dateRef: shellDateRef,
  minValue: convertedMinValue.value,
  maxValue: convertedMaxValue.value,
  isDateUnavailable: propsIsTimeUnavailable.value,
  disabled,
  readonly,
})

const endShell = useSegmentFieldShell({
  segmentAttribute: 'data-reka-time-field-segment',
  parentElement,
  locale,
  dir,
  modelValue: convertedEndValue,
  placeholder: convertedPlaceholder,
  granularity,
  hourCycle: props.hourCycle,
  hideTimeZone: props.hideTimeZone,
  step: props.step,
  stepSnapping,
  isTimeValue: true,
  dateRef: shellDateRef,
  minValue: convertedMinValue.value,
  maxValue: convertedMaxValue.value,
  isDateUnavailable: propsIsTimeUnavailable.value,
  disabled,
  readonly,
  disablePlaceholderUpdate: true,
})

const segmentElements = startShell.segmentElements

const renderedStartContents = useDisplaySegmentContents({
  segmentContents: startShell.segmentContents,
  segmentValues: startShell.segmentValues,
  hourCycle: props.hourCycle,
})
const renderedEndContents = useDisplaySegmentContents({
  segmentContents: endShell.segmentContents,
  segmentValues: endShell.segmentValues,
  hourCycle: props.hourCycle,
})

const isInvalid = useRangeFieldInvalidity({
  startInvalidity: startShell.isInvalid,
  endInvalidity: endShell.isInvalid,
  modelValue,
  isOrderValid: (a, b) => Temporal.PlainDateTime.compare(toShellDateTime(a)!, toShellDateTime(b)!) <= 0,
  normalize: v => toShellDateTime(v)!,
  isUnavailable: propsIsTimeUnavailable.value,
})

const { setFocusedElement, focusNext, handleKeydown } = useRangeFieldFocus({
  segmentElements,
  segmentAttribute: 'data-reka-time-field-segment',
  rangeSegmentTypeAttribute: 'data-reka-time-range-field-segment-type',
  dir,
})

const editableSegmentContents = computed(() => ({
  start: renderedStartContents.value.filter(({ part }) => part !== 'literal'),
  end: renderedEndContents.value.filter(({ part }) => part !== 'literal'),
}))

const slotSegments = computed(() => ({
  start: renderedStartContents.value,
  end: renderedEndContents.value,
}))

provideTimeRangeFieldRootContext({
  locale,
  startValue: convertedStartValue,
  endValue: convertedEndValue,
  placeholder: convertedPlaceholder,
  disabled,
  formatter: startShell.formatter,
  hourCycle: startShell.hourCycle,
  step: startShell.step,
  stepSnapping: startShell.stepSnapping,
  readonly,
  segmentValues: { start: startShell.segmentValues, end: endShell.segmentValues },
  isInvalid,
  segmentContents: editableSegmentContents,
  elements: segmentElements,
  setFocusedElement,
  focusNext,
})

defineExpose({
  /** Helper to set the focused element inside the TimeRangeField */
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
