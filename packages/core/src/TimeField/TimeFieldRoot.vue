<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { Formatter } from '@/shared'
import type { DateStep, HourCycle, SegmentPart, SegmentValueObj, TimeValue } from '@/shared/date'
import type { Direction, FormFieldProps } from '@/shared/types'
import type { TemporalDate } from '@/temporal/types'
import { Temporal } from 'temporal-polyfill'
import { createContext, useDirection, useLocale } from '@/shared'
import { getDefaultTime, toPublicTimeValue, toShellDateTime, useDisplaySegmentContents, useSegmentFieldShell } from '@/shared/date'

type TimeFieldRootContext = {
  locale: Ref<string>
  modelValue: Ref<Temporal.PlainDateTime | undefined>
  placeholder: Ref<Temporal.PlainDateTime>
  isInvalid: Ref<boolean>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  formatter: Formatter
  hourCycle: HourCycle
  step: Ref<DateStep>
  stepSnapping: Ref<boolean>
  segmentValues: Ref<SegmentValueObj>
  segmentContents: Ref<{ part: SegmentPart, value: string }[]>
  elements: Ref<Set<HTMLElement>>
  focusNext: () => void
  setFocusedElement: (el: HTMLElement) => void
}

export interface TimeFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The default value for the calendar */
  defaultValue?: TimeValue
  /** The default placeholder date */
  defaultPlaceholder?: TimeValue
  /** The placeholder date, which is used to determine what time to display when no time is selected. This updates as the user navigates the field */
  placeholder?: TimeValue
  /** The controlled checked state of the field. Can be bound as `v-model`. */
  modelValue?: TimeValue | null
  /** The hour cycle used for formatting times. Defaults to the local preference */
  hourCycle?: HourCycle
  /** The stepping interval for the time fields. Defaults to `1`. */
  step?: DateStep
  /** Whether to enforce snapping the value to the nearest step increment after input. Defaults to `false`. */
  stepSnapping?: boolean
  /** The granularity to use for formatting times. Defaults to minute if a Time is provided, otherwise defaults to minute. The field will render segments for each part of the date up to and including the specified granularity */
  granularity?: 'hour' | 'minute' | 'second'
  /** Whether or not to hide the time zone segment of the field */
  hideTimeZone?: boolean
  /** The maximum date that can be selected */
  maxValue?: TimeValue
  /** The minimum date that can be selected */
  minValue?: TimeValue
  /** The locale to use for formatting dates */
  locale?: string
  /** Whether or not the time field is disabled */
  disabled?: boolean
  /** Whether or not the time field is readonly */
  readonly?: boolean
  /** Id of the element */
  id?: string
  /** The reading direction of the time field when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
}

export type TimeFieldRootEmits = {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: TimeValue | undefined]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TimeValue]
}

export const [injectTimeFieldRootContext, provideTimeFieldRootContext]
  = createContext<TimeFieldRootContext>('TimeFieldRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { VisuallyHidden } from '@/VisuallyHidden'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TimeFieldRootProps>(), {
  defaultValue: undefined,
  disabled: false,
  readonly: false,
  placeholder: undefined,
  stepSnapping: false,
})
const emits = defineEmits<TimeFieldRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current time of the field */
    modelValue: TimeValue | undefined
    /** The time field segment contents */
    segments: { part: SegmentPart, value: string }[]
    /** Value if the input is invalid */
    isInvalid: boolean
  }) => any
}>()

const { disabled, readonly, granularity, defaultValue, minValue, maxValue, stepSnapping, dir: propDir, locale: propLocale } = toRefs(props)
const locale = useLocale(propLocale)
const dir = useDirection(propDir)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: defaultValue.value,
  passive: (props.modelValue === undefined) as false,
}) as Ref<TimeValue | undefined>

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? getDefaultTime({
    defaultValue: modelValue.value,
    defaultPlaceholder: props.placeholder,
  }),
  passive: (props.placeholder === undefined) as false,
}) as Ref<TimeValue>

const convertedModelValue = computed<Temporal.PlainDateTime | undefined>({
  get() {
    return toShellDateTime(modelValue.value)
  },
  set(newValue) {
    modelValue.value = newValue ? toPublicTimeValue(newValue, modelValue.value ?? placeholder.value) : undefined
  },
})

const convertedPlaceholder = computed<Temporal.PlainDateTime>({
  get() {
    return toShellDateTime(placeholder.value) ?? Temporal.PlainDateTime.from({
      year: Temporal.Now.plainDateISO().year,
      month: Temporal.Now.plainDateISO().month,
      day: Temporal.Now.plainDateISO().day,
      hour: 0,
      minute: 0,
      second: 0,
    })
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
  const original = modelValue.value ?? placeholder.value
  if ('timeZoneId' in original)
    return convertedPlaceholder.value.toZonedDateTime(original.timeZoneId)
  return convertedPlaceholder.value
})

const {
  segmentContents,
  isInvalid,
  inputType,
  inputValue,
  inputMinValue,
  inputMaxValue,
  segmentElements,
  handleKeydown,
  ...shell
} = useSegmentFieldShell({
  segmentAttribute: 'data-reka-time-field-segment',
  parentElement,
  locale,
  dir,
  modelValue: convertedModelValue,
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
  disabled,
  readonly,
})

const renderedSegmentContents = useDisplaySegmentContents({
  segmentContents,
  segmentValues: shell.segmentValues,
  hourCycle: props.hourCycle,
})

const editableSegmentContents = computed(() =>
  renderedSegmentContents.value.filter(({ part }) => part !== 'literal'))

provideTimeFieldRootContext({
  locale,
  modelValue: convertedModelValue,
  placeholder: convertedPlaceholder,
  disabled,
  formatter: shell.formatter,
  hourCycle: shell.hourCycle,
  step: shell.step,
  stepSnapping: shell.stepSnapping,
  readonly,
  segmentValues: shell.segmentValues,
  isInvalid,
  segmentContents: editableSegmentContents,
  elements: segmentElements,
  setFocusedElement: shell.setFocusedElement,
  focusNext: shell.focusNext,
})

defineExpose({
  /** Helper to set the focused element inside the TimeField */
  setFocusedElement: shell.setFocusedElement,
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
      :segments="renderedSegmentContents"
      :is-invalid="isInvalid"
    />

    <VisuallyHidden
      :id="id"
      as="input"
      :type="inputType"
      feature="focusable"
      tabindex="-1"
      :value="inputValue"
      :name="name"
      :disabled="disabled"
      :required="required"
      :max="inputMaxValue"
      :min="inputMinValue"
      @focus="Array.from(segmentElements)?.[0]?.focus()"
    />
  </Primitive>
</template>
