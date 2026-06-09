<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import type { AcceptableValue, FormFieldProps } from '@/shared/types'
import { useVModel } from '@vueuse/core'
import { createContext, isValueEqualOrExist, useFormControl, useForwardExpose } from '@/shared'

export interface TagGroupRootProps<T = AcceptableValue> extends PrimitiveProps, FormFieldProps {
  /** The controlled value of the tags. Can be binded with `v-model`. */
  modelValue?: T[]
  /** The value of the tags that should be rendered when initially rendered. Use when you do not need to control the state of the tags. */
  defaultValue?: T[]
  /** When `true`, prevents the user from interacting with the tag group and all its items. */
  disabled?: boolean
}

export type TagGroupRootEmits<T = AcceptableValue> = {
  /** Event handler called when the value changes. */
  'update:modelValue': [value: T[]]
  /** Event handler called when a tag is removed. */
  'removeTag': [value: T]
}

interface TagGroupRootContext<T = AcceptableValue> {
  modelValue: Ref<T[]>
  disabled: Ref<boolean>
  removeTag: (value: T) => void
  containsTag: (value: T) => boolean
}

export const [injectTagGroupRootContext, provideTagGroupRootContext]
  = createContext<TagGroupRootContext>('TagGroupRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { toRefs } from 'vue'
import { Primitive } from '@/Primitive'
import { VisuallyHiddenInput } from '@/VisuallyHidden'

const props = withDefaults(defineProps<TagGroupRootProps<T>>(), {
  defaultValue: () => [],
  disabled: false,
  as: 'div',
})
const emits = defineEmits<TagGroupRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current tag values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { disabled } = toRefs(props)
const { forwardRef, currentElement } = useForwardExpose()
const isFormControl = useFormControl(currentElement)

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
}) as Ref<T[]>

function removeTag(value: AcceptableValue) {
  modelValue.value = modelValue.value.filter(item => !isValueEqualOrExist(item, value as T))
  emits('removeTag', value as T)
}

provideTagGroupRootContext({
  modelValue,
  disabled,
  removeTag,
  containsTag: value => isValueEqualOrExist(modelValue.value, value),
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    role="list"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot :model-value="modelValue" />

    <VisuallyHiddenInput
      v-if="isFormControl && name"
      :name="name"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
    />
  </Primitive>
</template>
