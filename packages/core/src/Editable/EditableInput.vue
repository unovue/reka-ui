<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { Primitive } from '@/Primitive'

export interface EditableInputProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { mergeProps, nextTick, onMounted, ref, watch } from 'vue'
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

// The default name only fills in when the consumer gives none: an `aria-label` or `aria-labelledby`
// attribute, or a `<label>` for the input (wrapping it, or pointing at the root's `id`).
const hasLabelElement = ref(false)
// Checked on mount and each time editing starts, which is when the input is shown, so a label added later counts.
function updateHasLabelElement() {
  hasLabelElement.value = !!(inputRef.value as HTMLInputElement | undefined)?.labels?.length
}

// Focus management is DOM- and lifecycle-bound, so it stays in the shell.
onMounted(() => {
  context.inputRef.value = inputRef.value as HTMLInputElement
  updateHasLabelElement()
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
  const own: Record<string, unknown> = { ...input.attrs.value }
  if (attrs['aria-labelledby'] || hasLabelElement.value)
    own['aria-label'] = undefined
  if (!field) {
    // Outside a Field the root's `id` goes on the input, so a `<label for>` names it. In a Field the
    // id belongs to the hidden native input the label points at.
    own.id = context.id.value
    return mergeProps(own, attrs)
  }
  return mergeProps(field.dataAttributes(), own, attrs, { ...field.ariaAttrs(attrs, context.disabled.value) })
}

watch(context.isEditing, (value) => {
  if (value) {
    updateHasLabelElement()
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
