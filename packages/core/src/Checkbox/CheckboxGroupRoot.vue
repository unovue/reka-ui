<script lang="ts">
import type { Ref } from 'vue'
import type { CheckboxGroupChangeReason } from './useCheckboxGroup'
import type { FieldRootContext } from '@/Field/FieldRoot.vue'
import type { RovingFocusGroupProps } from '@/RovingFocus'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { computed, mergeProps, toRef, useAttrs, watch } from 'vue'
import { usePrimitiveElement } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { createContext, useDirection, useFormControl } from '@/shared'

export interface CheckboxGroupRootProps<T = AcceptableValue> extends Pick<RovingFocusGroupProps, 'as' | 'asChild' | 'dir' | 'orientation' | 'loop'>, FormFieldProps {
  /** The value of the checkbox when it is initially rendered. Use when you do not need to control its value. */
  defaultValue?: T[]
  /** The controlled value of the checkbox. Can be binded with v-model. */
  modelValue?: T[]
  /** When `false`, navigating through the items using arrow keys will be disabled. */
  rovingFocus?: boolean
  /** When `true`, prevents the user from interacting with the checkboxes */
  disabled?: boolean
  /**
   * The maximum number of values that can be selected. Once reached, the unchecked
   * checkboxes get `aria-disabled` but stay focusable, so consider telling users
   * about the limit. Style them with `[aria-disabled="true"]`.
   */
  max?: number | null
}

export type CheckboxGroupRootEmits<T = AcceptableValue> = {
  /** Event handler called before the value of the checkbox group changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: T[], details: ChangeEventDetails<CheckboxGroupChangeReason>]
  /** Event handler called when the value of the checkbox changes. */
  'update:modelValue': [value: T[], details: ChangeEventDetails<CheckboxGroupChangeReason>]
}

export interface CheckboxGroupRootContext {
  modelValue: Ref<AcceptableValue[]>
  rovingFocus: Ref<boolean>
  disabled: Ref<boolean>
  max: Ref<number | null | undefined>
  /**
   * Route every write through the group's model (`beforeUpdate` + `update`);
   * returns `false` when unchanged or cancelled. Descendants never assign
   * `modelValue.value` directly.
   */
  changeModelValue: (value: AcceptableValue[], reason?: CheckboxGroupChangeReason | BaseChangeReason, event?: Event) => boolean
  /**
   * The Field the group is the control of, if any. Its checkboxes leave
   * focus reporting to the group, which reports touched once focus leaves it.
   * @internal
   */
  field?: FieldRootContext
}

export const [injectCheckboxGroupRootContext, provideCheckboxGroupRootContext]
  = createContext<CheckboxGroupRootContext>('CheckboxGroupRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { useFieldControl } from '@/Field/useFieldControl'
import { RovingFocusGroup } from '@/RovingFocus'
import { VisuallyHiddenInput } from '@/VisuallyHidden'
import { useCheckboxGroup } from './useCheckboxGroup'

defineOptions({
  // `$attrs` are bound explicitly (after the roving props, as they fell
  // through before), so the Field's aria ids can be merged with them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<CheckboxGroupRootProps<T>>(), {
  rovingFocus: true,
})
const emits = defineEmits<CheckboxGroupRootEmits<T>>()

const max = toRef(props, 'max')

const rovingFocus = toRef(props, 'rovingFocus')

const dir = useDirection(() => props.dir)

const { primitiveElement, currentElement, expose } = usePrimitiveElement()
defineExpose(expose)
const isFormControl = useFormControl(currentElement)
const attrs = useAttrs()

// The checkbox a Field focuses (an invalid submit, a non-native label's
// click): the first checked one, else the first enabled one.
function getFocusTarget() {
  const checkboxes = Array.from(currentElement.value?.querySelectorAll<HTMLElement>('[role="checkbox"]') ?? [])
    .filter(checkbox => !checkbox.hasAttribute('disabled') && !checkbox.hasAttribute('data-disabled'))
  return checkboxes.find(checkbox => checkbox.getAttribute('aria-checked') === 'true') ?? checkboxes[0]
}

// Optional Field participation: `null` outside a `FieldRoot`, so every
// binding below is inert without a Field. The group is the field's control:
// it takes the field's id and label, and its checkboxes don't register.
const field = useFieldControl({
  id: () => attrs.id as string | undefined,
  element: getFocusTarget,
  getValue: () => modelValue.value,
  required: () => props.required,
})
// Getters rather than computeds: cheap, and free for a standalone group.
const resolvedName = () => field ? field.name(props.name) : props.name
const resolvedRequired = () => field ? field.required(props.required) : props.required
const disabled = field ? computed(() => field.disabled(props.disabled)) : toRef(props, 'disabled')

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits live in the
// composable's `useControllableState` (`modelValue === undefined` → uncontrolled).
const { modelValue, context } = useCheckboxGroup<T>({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  emit: emits,
  // A checkbox press is user input for the Field; a programmatic or
  // parent-driven change is reported through the `modelValue` watcher below.
  onUpdate: value => field?.input(value),
  disabled,
  rovingFocus,
  max,
})

if (field)
  watch(modelValue, value => field.sync(value))

// Touched once focus leaves the whole group, not on every checkbox-to-checkbox move.
function onFocusout(event: FocusEvent) {
  if (!currentElement.value?.contains(event.relatedTarget as Node | null))
    field?.onBlur()
}

// Without roving focus the group renders its own element (no wrapper), so
// `as` / `asChild` are only props of `RovingFocusGroup`.
const rovingFocusProps = computed(() => {
  return rovingFocus.value ? { as: props.as, asChild: props.asChild, loop: props.loop, dir: dir.value, orientation: props.orientation } : {}
})

provideCheckboxGroupRootContext(field ? { ...context, field: field.context } : context)

// `$attrs` isn't reactive, so the Field's wiring is read during render. Its
// state attributes go first; its aria ids are merged with the consumer's.
function renderAttrs(attrs: Record<string, unknown>) {
  if (!field)
    return mergeProps(rovingFocusProps.value, attrs)
  return mergeProps(
    field.dataAttributes(),
    rovingFocusProps.value,
    attrs,
    {
      // Named by the field's label, so it needs a role that can be named.
      role: attrs.role ?? 'group',
      id: field.id(),
      ...field.ariaAttrs(attrs, disabled.value),
      onFocusin: field.onFocus,
      onFocusout,
    },
  )
}
</script>

<template>
  <component
    :is="rovingFocus ? RovingFocusGroup : renderAs(as, asChild)"
    ref="primitiveElement"
    v-bind="renderAttrs($attrs)"
  >
    <slot />

    <VisuallyHiddenInput
      v-if="isFormControl && resolvedName()"
      :name="resolvedName()!"
      :value="modelValue"
      :required="resolvedRequired()"
    />
  </component>
</template>
