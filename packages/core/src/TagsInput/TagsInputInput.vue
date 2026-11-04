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
import { mergeProps, onBeforeUnmount, onMounted, onUpdated, watch } from 'vue'
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

  setTimeout(() => {
    // make sure all DOM was flush then only capture the focus
    if (props.autoFocus)
      inputEl?.focus()
  }, 1)
})

if (fieldContext) {
  // Followed, not read once: an as-child change swaps the element. The root
  // resolves the input inside it on each read, as slot content can replace it.
  watch(currentElement, (element) => {
    fieldContext.inputElement.value = (element ?? undefined) as HTMLElement | undefined
  }, { immediate: true })
  onBeforeUnmount(() => {
    fieldContext.inputElement.value = undefined
  })
  // A wrapper isn't labelable: the field's id goes on the input inside it
  // (unless that input has an id of its own), so the label's `for` focuses it.
  // Re-applied on update, as slot content can replace that input.
  let assignedId: string | undefined
  const labelWrappedInput = () => {
    const element = currentElement.value
    if (!element || element.nodeName === 'INPUT')
      return
    const inner = element.querySelector('input')
    const id = context.id?.value
    if (inner && id && (!inner.id || inner.id === assignedId)) {
      inner.id = id
      assignedId = id
    }
  }
  onMounted(labelWrappedInput)
  onUpdated(labelWrappedInput)
}

// The Field's state attributes fill in what the input leaves unset; its
// aria ids are merged with the consumer's.
function fieldAttrs(attrs: Record<string, unknown>) {
  const { field } = fieldContext!
  // A wrapper keeps only a consumer's id: the field's goes on the input inside.
  const element = currentElement.value
  const isWrapper = element ? element.nodeName !== 'INPUT' : (!props.asChild && props.as !== 'input')
  return field.fillDataAttributes(mergeProps(
    input.attrs.value,
    attrs,
    { ...field.ariaAttrs(attrs, context.disabled.value) },
    isWrapper ? { id: attrs.id as string | undefined } : {},
  ))
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
