<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface TagsInputInputProps extends PrimitiveProps {
  /** The placeholder character to use for empty tags input. */
  placeholder?: string
  /** Focus on element when mounted. */
  autoFocus?: boolean
  /** Maximum number of character allowed. */
  maxLength?: number
}
</script>

<script setup lang="ts">
import { mergeProps, onBeforeUnmount, onMounted } from 'vue'
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
import { injectTagsInputFieldContext, injectTagsInputRootContext } from './TagsInputRoot.vue'
import { createTagsInputInputSurface } from './useTagsInput'

// `$attrs` are merged in the render (as the fall-through did) so the Field's
// aria ids can be merged with the consumer's.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<TagsInputInputProps>(), {
  as: 'input',
})

const context = injectTagsInputRootContext()
const fieldContext = injectTagsInputFieldContext(null)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// Add-on-enter/tab/blur/delimiter/paste handling and the IME composition state
// live in the surface; consumer listeners in `$attrs` fall through after them.
const input = createTagsInputInputSurface(context, {
  placeholder: () => props.placeholder,
  maxLength: () => props.maxLength,
})

onMounted(() => {
  const inputEl = currentElement.value.nodeName === 'INPUT'
    ? currentElement.value
    : currentElement.value.querySelector('input')

  if (!inputEl)
    return
  if (fieldContext)
    fieldContext.inputElement.value = inputEl as HTMLInputElement

  setTimeout(() => {
    // make sure all DOM was flush then only capture the focus
    if (props.autoFocus)
      inputEl?.focus()
  }, 1)
})

if (fieldContext) {
  onBeforeUnmount(() => {
    fieldContext.inputElement.value = undefined
  })
}

// The Field's state attributes fill in what the input leaves unset; its
// aria ids are merged with the consumer's.
function fieldAttrs(attrs: Record<string, unknown>) {
  const { field } = fieldContext!
  return field.fillDataAttributes(mergeProps(input.attrs.value, attrs, { ...field.ariaAttrs(attrs, context.disabled.value) }))
}
</script>

<template>
  <component
    :is="renderAsEmpty(as, asChild)"
    :ref="forwardRef"
    v-bind="fieldContext ? fieldAttrs($attrs) : mergeProps(input.attrs.value, $attrs)"
  >
    <template
      v-if="rendersChildren(as, asChild)"
      #default
    >
      <slot />
    </template>
  </component>
</template>
