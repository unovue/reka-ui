<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { Formatter } from '@/shared'
import type { DateStep, Granularity, HourCycle, SegmentPart, SegmentValueObj } from '@/shared/date'
import type { Direction, FormFieldProps } from '@/shared/types'
import type { Matcher, TemporalDate } from '@/temporal/types'
import { createContext, useDirection, useLocale } from '@/shared'
import { getDefaultDate, useSegmentFieldShell } from '@/shared/date'

type DateFieldRootContext = {
  locale: Ref<string>
  modelValue: Ref<TemporalDate | undefined>
  placeholder: Ref<TemporalDate>
  isDateUnavailable?: Matcher
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

export interface DateFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The default value for the calendar */
  defaultValue?: TemporalDate
  /** The default placeholder date */
  defaultPlaceholder?: TemporalDate
  /** The placeholder date, which is used to determine what month to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view */
  placeholder?: TemporalDate
  /** The controlled value of the field. Can be bound as `v-model`. */
  modelValue?: TemporalDate | null
  /** The hour cycle used for formatting times. Defaults to the local preference */
  hourCycle?: HourCycle
  /** The stepping interval for the time fields. Defaults to `1`. */
  step?: DateStep
  /** Whether to enforce snapping the time value to the nearest step increment after input. Defaults to `false`. */
  stepSnapping?: boolean
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

export type DateFieldRootEmits = {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: TemporalDate | undefined]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TemporalDate]
}

export const [injectDateFieldRootContext, provideDateFieldRootContext]
  = createContext<DateFieldRootContext>('DateFieldRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { VisuallyHidden } from '@/VisuallyHidden'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DateFieldRootProps>(), {
  defaultValue: undefined,
  disabled: false,
  readonly: false,
  placeholder: undefined,
  isDateUnavailable: undefined,
  stepSnapping: false,
})
const emits = defineEmits<DateFieldRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current date of the field */
    modelValue: TemporalDate | undefined
    /** The date field segment contents */
    segments: { part: SegmentPart, value: string }[]
    /** Value if the input is invalid */
    isInvalid: boolean
  }) => any
}>()

const {
  disabled,
  readonly,
  isDateUnavailable: propsIsDateUnavailable,
  granularity,
  defaultValue,
  stepSnapping,
  dir: propDir,
  locale: propLocale,
} = toRefs(props)
const locale = useLocale(propLocale)
const dir = useDirection(propDir)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: defaultValue.value,
  passive: (props.modelValue === undefined) as false,
}) as Ref<TemporalDate>

const defaultDate = getDefaultDate({
  defaultPlaceholder: props.placeholder,
  granularity: granularity.value,
  defaultValue: modelValue.value,
  locale: props.locale,
})

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? defaultDate,
  passive: (props.placeholder === undefined) as false,
}) as Ref<TemporalDate>

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
  segmentAttribute: 'data-reka-date-field-segment',
  parentElement,
  locale,
  dir,
  modelValue,
  placeholder,
  granularity,
  hourCycle: props.hourCycle,
  hideTimeZone: props.hideTimeZone,
  step: props.step,
  stepSnapping,
  minValue: props.minValue,
  maxValue: props.maxValue,
  isDateUnavailable: propsIsDateUnavailable.value,
  disabled,
  readonly,
})

provideDateFieldRootContext({
  isDateUnavailable: propsIsDateUnavailable.value,
  locale,
  modelValue,
  placeholder,
  disabled,
  formatter: shell.formatter,
  hourCycle: shell.hourCycle,
  step: shell.step,
  stepSnapping: shell.stepSnapping,
  readonly,
  segmentValues: shell.segmentValues,
  isInvalid,
  segmentContents: shell.editableSegmentContents,
  elements: segmentElements,
  setFocusedElement: shell.setFocusedElement,
  focusNext: shell.focusNext,
})

defineExpose({
  /** Helper to set the focused element inside the DateField */
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
      :segments="segmentContents"
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
