<script lang="ts">
import type { Ref } from 'vue'
import type { DateFieldChangeReason } from './useDateField'
import type { DateValue, Matcher } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails, DateStep, Formatter } from '@/shared'
import type { Granularity, HourCycle, SegmentPart, SegmentValueObj } from '@/shared/date'
import type { Direction, FormFieldProps } from '@/shared/types'
import { createContext, mergeExpose, useDirection, useLocale } from '@/shared'
import { getInputType, normalizeInputValue } from '@/shared/date'

export type DateFieldRootContext = {
  locale: Ref<string>
  /** Assigning it requests a change with reason `imperative-action`; prefer `setModelValue`. */
  modelValue: Ref<DateValue | undefined>
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
  segmentValues: Ref<SegmentValueObj>
  segmentContents: Ref<{ part: SegmentPart, value: string }[]>
  elements: Ref<Set<HTMLElement>>
  focusNext: () => void
  setFocusedElement: (el: HTMLElement) => void
  /** Request a value change. Returns `false` when unchanged or cancelled. */
  setModelValue: (value: DateValue | undefined, reason?: DateFieldChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Request a placeholder change. Returns `false` when unchanged or cancelled. */
  setPlaceholder: (value: DateValue, reason?: DateFieldChangeReason | BaseChangeReason, event?: Event) => boolean
}

export interface DateFieldRootProps extends PrimitiveProps, FormFieldProps {
  /** The default value for the calendar */
  defaultValue?: DateValue
  /** The default placeholder date */
  defaultPlaceholder?: DateValue
  /** The placeholder date, which is used to determine what month to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view */
  placeholder?: DateValue
  /** The controlled value of the field. Can be bound as `v-model`. `null` is a controlled empty field. */
  modelValue?: DateValue | null
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

export type DateFieldRootEmits = {
  /** Called before the value changes; `details.cancel()` keeps the current value. */
  'beforeUpdate:modelValue': [date: DateValue | undefined, details: ChangeEventDetails<DateFieldChangeReason>]
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateValue | undefined, details: ChangeEventDetails<DateFieldChangeReason>]
  /** Called before the placeholder changes; `details.cancel()` keeps the current placeholder. */
  'beforeUpdate:placeholder': [date: DateValue, details: ChangeEventDetails<DateFieldChangeReason>]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: DateValue, details: ChangeEventDetails<DateFieldChangeReason>]
}

export const [injectDateFieldRootContext, provideDateFieldRootContext]
  = createContext<DateFieldRootContext>('DateFieldRoot')
</script>

<script setup lang="ts">
import { computed, mergeProps, ref, toRefs, useAttrs, watch } from 'vue'
import { isZonedDateTime, toIsoString } from '@/date/temporal'
import { createPendingFieldInput } from '@/Field/pendingFieldInput'
import { useFieldControl } from '@/Field/useFieldControl'
import { useFieldFocusWithin } from '@/Field/useFieldFocusWithin'
import { usePrimitiveElement } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { isEqual } from '@/shared/compare'
import { VisuallyHidden } from '@/VisuallyHidden'
import { useDateField } from './useDateField'

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
    modelValue: DateValue | undefined
    /** The date field segment contents */
    segments: { part: SegmentPart, value: string }[]
    /** Value if the input is invalid */
    isInvalid: boolean
  }) => any
}>()

const { dir: propDir, locale: propLocale } = toRefs(props)
const locale = useLocale(propLocale)
const dir = useDirection(propDir)

// Optional Field participation: `null` outside a `FieldRoot` (and inside
// another control of the field, which owns it), so every Field binding is
// inert — and byte-for-byte identical to before — when there is no Field.
// Field's `name` takes precedence over the local prop; `required`/`disabled`
// apply when set on either.
const field = useFieldControl({
  id: () => props.id,
  // The first segment (not the group container, which isn't itself
  // focusable), so `FormRoot` can move focus into the field on an invalid submit.
  element: () => Array.from(segmentElements.value)[0],
  getValue: () => modelValue.value,
  validityElement: () => nativeInput.value?.$el as HTMLInputElement | undefined,
})
const disabled = computed(() => field ? field.disabled(props.disabled) : Boolean(props.disabled))
const resolvedName = computed(() => field ? field.name(props.name) : props.name)
const resolvedRequired = computed(() => field ? field.required(props.required) : props.required)

const { primitiveElement, currentElement: parentElement, expose } = usePrimitiveElement()

// Controlled/uncontrolled + the `beforeUpdate:` / `update:` emits for the value
// and the placeholder live in the composable's `useControllableState`.
// The user's segment edits, decided by reason when they commit: a parent's
// change (e.g. a reset) or a programmatic `setModelValue` isn't recorded, and
// a user edit stays one wherever focus goes next. Only in a Field.
const pendingInput = field ? createPendingFieldInput<unknown>() : undefined

const {
  root,
  context,
  modelValue,
  segments,
  isInvalid,
  granularity,
  segmentElements,
  setFocusedElement,
  focusFirstSegment,
} = useDateField({
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

const inputType = computed(() => getInputType(granularity.value))
const inputValue = computed(() => normalizeInputValue(modelValue.value, granularity.value))
const inputMaxValue = computed(() => props.maxValue ? normalizeInputValue(props.maxValue, granularity.value) : undefined)
const inputMinValue = computed(() => props.minValue ? normalizeInputValue(props.minValue, granularity.value) : undefined)

// The root is a segmented `role="group"` of several focusable spans/inputs,
// not a single form control: a native `<label for>` association (the
// mechanism the other pilots use) doesn't apply to a group the same way, so
// this wires `aria-labelledby`/`aria-describedby` on the group instead —
// both merged with (never overwriting) whatever the consumer already passed,
// same as the other pilots' `aria-describedby` merge.
const attrs = useAttrs()

// `attrs` isn't reactive, so this runs during render rather than in a
// `computed`. A consumer-provided `aria-invalid` always wins — read it
// explicitly rather than relying on the `$attrs` spread order. The root
// surface comes after the consumer's attrs (its role / aria-disabled / data-*
// win, as before) and its keydown handler chains with theirs.
function getRootAttrs() {
  if (!field)
    return mergeProps(attrs, root.attrs.value)
  return mergeProps(
    field.dataAttributes(),
    attrs,
    { ...field.ariaAttrs(attrs, disabled.value) },
    root.attrs.value,
    // The Field's own invalid state also marks the group.
    { 'data-invalid': isInvalid.value || field.context.invalid.value ? '' : undefined },
  )
}

// The hidden input takes the field's id, so `FieldLabel`'s `for` lands on it
// and its focus handler moves focus into the first segment.
const nativeInputId = computed(() => field ? field.id() : props.id)

// The hidden native input mirrors the value along with `required`/`min`/`max`,
// so its `ValidityState` drives the field's constraint validation. A native
// `date` / `datetime-local` input holds a wall-clock value only, so for a
// zoned value it keeps validating but gives its `name` to a second,
// `type="hidden"` input that submits the full ISO string with the offset and
// the time zone, as each end of `DateRangeFieldRoot` does. Only one of the two
// is ever named.
const nativeInput = ref<InstanceType<typeof VisuallyHidden>>()

// Touched once focus leaves the whole group (and a composing picker's
// trigger and calendar), not when it moves between segments.
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

provideDateFieldRootContext(context)

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
    @focusin="focusWithin?.onFocusin"
    @focusout="focusWithin?.onFocusout"
  >
    <slot
      :model-value="modelValue"
      :segments="segments"
      :is-invalid="isInvalid"
    />

    <VisuallyHidden
      :id="nativeInputId"
      ref="nativeInput"
      as="input"
      :type="inputType"
      feature="focusable"
      aria-hidden="true"
      tabindex="-1"
      :value="inputValue"
      :name="isZonedDateTime(modelValue) ? undefined : resolvedName"
      :disabled="disabled"
      :required="resolvedRequired"
      :max="inputMaxValue"
      :min="inputMinValue"
      :step="granularity === 'second' ? 1 : undefined"
      @focus="focusFirstSegment"
    />
    <input
      v-if="resolvedName && isZonedDateTime(modelValue)"
      type="hidden"
      :value="toIsoString(modelValue)"
      :name="resolvedName"
      :disabled="disabled"
    >
  </component>
</template>
