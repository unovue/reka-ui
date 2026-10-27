<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import type { TimeFieldChangeReason } from './useTimeField'
import type { Matcher } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails, Formatter } from '@/shared'
import type { DateStep, HourCycle, SegmentPart, SegmentValueObj, TimeValue } from '@/shared/date'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, mergeExpose, useDirection, useLocale } from '@/shared'

export type TimeFieldRootContext = {
  locale: Ref<string>
  /**
   * The value as a date-time (a `Time` is placed on today's date). Assigning it
   * requests a change with reason `imperative-action`; prefer `setModelValue`.
   */
  modelValue: Ref<DateValue | undefined>
  /** The placeholder as a date-time. Assigning it requests a change; prefer `setPlaceholder`. */
  placeholder: Ref<DateValue>
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
  /** Request a value change from a date-time; it is written back as a `Time` when the value is one. */
  setModelValue: (value: DateValue | undefined, reason?: TimeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Request a placeholder change from a date-time. */
  setPlaceholder: (value: DateValue, reason?: TimeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
}

export interface TimeFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The default value for the calendar */
  defaultValue?: TimeValue
  /** The default placeholder date */
  defaultPlaceholder?: TimeValue
  /** The placeholder date, which is used to determine what time to display when no time is selected. This updates as the user navigates the field */
  placeholder?: TimeValue
  /** The controlled checked state of the field. Can be bound as `v-model`. `null` is a controlled empty field. */
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
  /** A function that returns whether or not a time is unavailable. It receives the time as a date-time (a `Time` is placed on today's date); an unavailable time marks the field invalid. */
  isTimeUnavailable?: Matcher
  /** Id of the element */
  id?: string
  /** The reading direction of the time field when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
}

export type TimeFieldRootEmits = {
  /** Called before the value changes; `details.cancel()` keeps the current value. */
  'beforeUpdate:modelValue': [date: TimeValue | undefined, details: ChangeEventDetails<TimeFieldChangeReason>]
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: TimeValue | undefined, details: ChangeEventDetails<TimeFieldChangeReason>]
  /** Called before the placeholder changes; `details.cancel()` keeps the current placeholder. */
  'beforeUpdate:placeholder': [date: TimeValue, details: ChangeEventDetails<TimeFieldChangeReason>]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TimeValue, details: ChangeEventDetails<TimeFieldChangeReason>]
}

export const [injectTimeFieldRootContext, provideTimeFieldRootContext]
  = createContext<TimeFieldRootContext>('TimeFieldRoot')
</script>

<script setup lang="ts">
import { computed, mergeProps, toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { VisuallyHidden } from '@/VisuallyHidden'
import { useTimeField } from './useTimeField'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TimeFieldRootProps>(), {
  defaultValue: undefined,
  disabled: false,
  readonly: false,
  placeholder: undefined,
  isTimeUnavailable: undefined,
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

const { dir: propDir, locale: propLocale } = toRefs(props)
const locale = useLocale(propLocale)
const dir = useDirection(propDir)

const { primitiveElement, currentElement: parentElement, expose } = usePrimitiveElement()

// Controlled/uncontrolled + the `beforeUpdate:` / `update:` emits for the value
// and the placeholder live in the composable's `useControllableState`.
const { root, context, modelValue, segments, isInvalid, setFocusedElement, focusFirstSegment } = useTimeField({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  placeholder: () => props.placeholder,
  defaultPlaceholder: props.defaultPlaceholder,
  locale,
  dir,
  hourCycle: props.hourCycle,
  step: () => props.step,
  stepSnapping: () => props.stepSnapping,
  granularity: () => props.granularity,
  hideTimeZone: () => props.hideTimeZone,
  minValue: () => props.minValue,
  maxValue: () => props.maxValue,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  isTimeUnavailable: computed(() => props.isTimeUnavailable),
  parentElement,
  emit: emits,
})

provideTimeFieldRootContext(context)

defineExpose(mergeExpose(expose, {
  /** Helper to set the focused element inside the TimeField */
  setFocusedElement,
}))
</script>

<template>
  <Primitive
    v-bind="mergeProps($attrs, root.attrs.value)"
    ref="primitiveElement"
  >
    <slot
      :model-value="modelValue"
      :segments="segments"
      :is-invalid="isInvalid"
    />

    <VisuallyHidden
      :id="id"
      as="input"
      feature="focusable"
      aria-hidden="true"
      tabindex="-1"
      :value="modelValue ? modelValue.toString() : ''"
      :name="name"
      :disabled="disabled"
      :required="required"
      @focus="focusFirstSegment"
    />
  </Primitive>
</template>
