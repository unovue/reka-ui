<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { Primitive } from '@/Primitive'

export interface EditableInputProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { mergeProps, nextTick, onMounted, watch } from 'vue'
import { useForwardElement } from '@/shared'
import { injectEditableFieldControl, injectEditableRootContext } from './EditableRoot.vue'
import { getEditableInputSurface } from './useEditable'

defineOptions({
  // Bound explicitly (same merge as fallthrough), so a Field's aria ids can be
  // merged with the consumer's instead of being replaced by them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<EditableInputProps>(), {
  as: 'input',
})

const context = injectEditableRootContext()
// Same derivation as `useEditable().input`.
const input = getEditableInputSurface(context)

const { forwardRef, currentElement: inputRef, expose } = useForwardElement()
defineExpose(expose)

// Focus management is DOM- and lifecycle-bound, so it stays in the shell.
onMounted(() => {
  context.inputRef.value = inputRef.value as HTMLInputElement
  if (context.startWithEditMode.value) {
    context.inputRef.value?.focus({ preventScroll: true })
    if (context.selectOnFocus.value)
      context.inputRef.value?.select()
  }
})

// The root's Field binding (`null` outside a `FieldRoot`): the input is
// labelled, described and marked invalid by the field. A consumer
// `aria-invalid` wins.
const field = injectEditableFieldControl(null)?.binding
function renderAttrs(attrs: Record<string, unknown>) {
  if (!field)
    return mergeProps(input.attrs.value, attrs)
  return mergeProps(field.dataAttributes(), input.attrs.value, attrs, { ...field.ariaAttrs(attrs, context.disabled.value) })
}

watch(context.isEditing, (value) => {
  if (value) {
    nextTick(() => {
      context.inputRef.value?.focus({ preventScroll: true })
      if (context.selectOnFocus.value)
        context.inputRef.value?.select()
    })
  }
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="renderAttrs($attrs)"
    :as="props.as"
    :as-child="props.asChild"
  >
    <slot />
  </Primitive>
</template>
