<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { Primitive } from '@/Primitive'

export interface EditableInputProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { useForwardElement } from '@/shared'
import { injectEditableRootContext } from './EditableRoot.vue'
import { getEditableInputSurface } from './useEditable'

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
    v-bind="input.attrs.value"
    :as="props.as"
    :as-child="props.asChild"
  >
    <slot />
  </Primitive>
</template>
