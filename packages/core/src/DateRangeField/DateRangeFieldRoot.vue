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
import { computed, mergeProps, toRefs, useAttrs, watch } from 'vue'
import { createPendingFieldInput } from '@/Field/pendingFieldInput'
import { useFieldBinding } from '@/Field/useFieldBinding'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { usePrimitiveElement } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { isEqual } from '@/shared/compare'
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

// Optional Field participation, as in `DateFieldRoot`: `null` outside a
// `FieldRoot`, so every binding below is inert without a Field. The hidden
// input takes the field's id, so `FieldLabel`'s `for` lands on it and its
// focus handler moves focus into the first segment; the group carries the
// label/description wiring. The field's value is the range object, and a
// required range needs both ends: the hidden input can't express that, so
// `valueMissing` comes from `isFilled` instead of its `ValidityState`.
const field = useFieldBinding({
  id: () => props.id,
  // The first segment (the group isn't itself focusable), so `FormRoot` can
  // move focus into the field on an invalid submit.
  element: () => Array.from(segmentElements.value)[0],
  getValue: () => modelValue.value,
  required: () => props.required,
  isFilled: value => Boolean((value as { start?: unknown, end?: unknown } | undefined)?.start && (value as { end?: unknown }).end),
})
const disabled = () => field ? field.disabled(props.disabled) : props.disabled
const resolvedId = () => field ? field.id() : props.id
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required

// Controlled/uncontrolled + the `beforeUpdate:` / `update:` emits for the range
// and the placeholder live in the composable's `useControllableState`.
// The user's segment edits, decided by reason when they commit: a parent's
// change (e.g. a reset) or a programmatic `setModelValue` isn't recorded, and
// a user edit stays one wherever focus goes next. Only in a Field.
const pendingInput = field ? createPendingFieldInput<unknown>() : undefined

const { root, context, modelValue, segments, isInvalid, segmentElements, setFocusedElement, focusFirstSegment } = useDateRangeField({
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
  disabled,
  readonly: () => props.readonly,
  isDateUnavailable: computed(() => props.isDateUnavailable),
  parentElement,
  emit: emits,
  onUpdate: pendingInput?.record,
})

// Touched once focus leaves the whole group, not when it moves between the ends.
const focusWithin = useFieldFocusWithin(field, parentElement)

// The user's recorded edit, once it arrives, is input; anything else is
// programmatic, which updates `filled` but isn't dirtying. Flushed after
// render so the hidden input's validity reflects the new value.
if (field) {
  watch(modelValue, (value) => {
    const pending = pendingInput!.take()
    if (pending && isEqual(pending.value, value))
      field.input(value)
    else
      field.sync(value)
  }, { flush: 'post' })
}

// `$attrs` isn't reactive, so the Field's wiring is read during render. Its
// state attributes go first and the group's own (e.g. `data-invalid`) win; its
// aria ids are merged with the consumer's, and a consumer `aria-invalid` wins.
const attrs = useAttrs()
function getRootAttrs() {
  if (!field)
    return mergeProps(attrs, root.attrs.value)
  return mergeProps(
    field.dataAttributes(),
    attrs,
    { ...field.ariaAttrs(attrs, disabled()) },
    root.attrs.value,
    // The Field's own invalid state also marks the group.
    { 'data-invalid': isInvalid.value || field.context.invalid.value ? '' : undefined },
    { onFocusin: focusWithin!.onFocusin, onFocusout: focusWithin!.onFocusout },
  )
}

provideDateRangeFieldRootContext(context)

defineExpose(mergeExpose(expose, {
  /** Records `el` as the focused segment for keyboard navigation. It does not move focus; call `el.focus()` for that. */
  setFocusedElement,
}))
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="getRootAttrs()"
    ref="primitiveElement"
  >
    <slot
      :model-value="modelValue"
      :segments="segments"
      :is-invalid="isInvalid"
    />

    <VisuallyHidden
      :id="resolvedId()"
      as="input"
      feature="focusable"
      aria-hidden="true"
      tabindex="-1"
      :value="toRangeFormValue(modelValue)"
      :name="resolvedName()"
      :disabled="disabled()"
      :required="resolvedRequired()"
      @focus="focusFirstSegment"
    />
  </component>
</template>
