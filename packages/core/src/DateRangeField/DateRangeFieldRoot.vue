<script lang="ts">
import type { Ref } from 'vue'
import type { DateRangeFieldChangeReason } from './useDateRangeField'
import type { DateValue, Matcher } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails, Formatter } from '@/shared'
import type { DateRange, DateStep, Granularity, HourCycle, SegmentPart, SegmentValueObj } from '@/shared/date'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, mergeExpose, useDirection, useLocale } from '@/shared'

export type DateRangeType = 'start' | 'end'

export type DateRangeFieldRootContext = {
  locale: Ref<string>
  /** Assigning it requests a change with reason `imperative-action`; prefer `setRangeValue`. */
  startValue: Ref<DateValue | undefined>
  /** Assigning it requests a change with reason `imperative-action`; prefer `setRangeValue`. */
  endValue: Ref<DateValue | undefined>
  /** Assigning it requests a change with reason `imperative-action`; prefer `setPlaceholder`. */
  placeholder: Ref<DateValue>
  isDateUnavailable?: Matcher
  isInvalid: Ref<boolean>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  formatter: Formatter
  hourCycle: HourCycle
  step: Ref<DateStep>
  stepSnapping: Ref<boolean>
  segmentValues: Record<DateRangeType, Ref<SegmentValueObj>>
  segmentContents: Ref<Record<DateRangeType, { part: SegmentPart, value: string }[]>>
  elements: Ref<Set<HTMLElement>>
  focusNext: () => void
  setFocusedElement: (el: HTMLElement) => void
  /** Request a range change. Returns `false` when unchanged or cancelled. */
  setModelValue: (value: DateRange, reason?: DateRangeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Change one end of the range, keeping the other. */
  setRangeValue: (type: DateRangeType, value: DateValue | undefined, reason?: DateRangeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  setPlaceholder: (value: DateValue, reason?: DateRangeFieldChangeReason | BaseChangeReason, event?: Event) => boolean
}

export interface DateRangeFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The default value for the calendar */
  defaultValue?: DateRange
  /** The default placeholder date */
  defaultPlaceholder?: DateValue
  /** The placeholder date, which is used to determine what month to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view */
  placeholder?: DateValue
  /** The controlled value of the field. Can be bound as `v-model`. `null` is a controlled empty range. */
  modelValue?: DateRange | null
  /** The hour cycle used for formatting times. Defaults to the local preference */
  hourCycle?: HourCycle
  /** The stepping interval for the time fields. Defaults to `1`. */
  step?: DateStep
  /** Whether to enforce snapping the time value to the nearest step increment after input. Defaults to `false`. */
  stepSnapping?: boolean
  /** The granularity to use for formatting times. Defaults to day if a `Temporal.PlainDate` is provided, otherwise defaults to minute. The field will render segments for each part of the date up to and including the specified granularity */
  granularity?: Granularity
  /** Whether or not to hide the time zone segment of the field */
  hideTimeZone?: boolean
  /** The maximum date that can be selected */
  maxValue?: DateValue
  /** The minimum date that can be selected */
  minValue?: DateValue
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
  /** Called before the range changes; `details.cancel()` keeps the current range. */
  'beforeUpdate:modelValue': [date: DateRange, details: ChangeEventDetails<DateRangeFieldChangeReason>]
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateRange, details: ChangeEventDetails<DateRangeFieldChangeReason>]
  /** Called before the placeholder changes; `details.cancel()` keeps the current placeholder. */
  'beforeUpdate:placeholder': [date: DateValue, details: ChangeEventDetails<DateRangeFieldChangeReason>]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: DateValue, details: ChangeEventDetails<DateRangeFieldChangeReason>]
}

export const [injectDateRangeFieldRootContext, provideDateRangeFieldRootContext]
  = createContext<DateRangeFieldRootContext>('DateRangeFieldRoot')
</script>

<script setup lang="ts">
import { computed, mergeProps, toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { toRangeFormValue } from '@/shared/date'
import { VisuallyHidden } from '@/VisuallyHidden'
import { useDateRangeField } from './useDateRangeField'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DateRangeFieldRootProps>(), {
  defaultValue: undefined,
  disabled: false,
  readonly: false,
  placeholder: undefined,
  isDateUnavailable: undefined,
  stepSnapping: false,
})
const emits = defineEmits<DateRangeFieldRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current date range of the field */
    modelValue: DateRange
    /** The date field segment contents */
    segments: Record<DateRangeType, { part: SegmentPart, value: string }[]>
    /** Value if the input is invalid */
    isInvalid: boolean
  }) => any
}>()
const { dir: propDir, locale: propLocale } = toRefs(props)
const locale = useLocale(propLocale)
const dir = useDirection(propDir)

const { primitiveElement, currentElement: parentElement, expose } = usePrimitiveElement()

// Controlled/uncontrolled + the `beforeUpdate:` / `update:` emits for the range
// and the placeholder live in the composable's `useControllableState`.
const { root, context, modelValue, segments, isInvalid, setFocusedElement, focusFirstSegment } = useDateRangeField({
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
  isDateUnavailable: computed(() => props.isDateUnavailable),
  parentElement,
  emit: emits,
})

provideDateRangeFieldRootContext(context)

defineExpose(mergeExpose(expose, {
  /** Helper to set the focused element inside the DateRangeField */
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
      :value="toRangeFormValue(modelValue)"
      :name="name"
      :disabled="disabled"
      :required="required"
      @focus="focusFirstSegment"
    />
  </Primitive>
</template>
