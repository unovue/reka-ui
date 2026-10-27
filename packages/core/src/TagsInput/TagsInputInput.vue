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
import { onMounted } from 'vue'
import { Primitive } from '@/Primitive'
import { injectTagsInputRootContext } from './TagsInputRoot.vue'
import { createTagsInputInputSurface } from './useTagsInput'

const props = withDefaults(defineProps<TagsInputInputProps>(), {
  as: 'input',
})

const context = injectTagsInputRootContext()
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

  setTimeout(() => {
    // make sure all DOM was flush then only capture the focus
    if (props.autoFocus)
      inputEl?.focus()
  }, 1)
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="input.attrs.value"
  >
    <slot />
  </Primitive>
</template>
