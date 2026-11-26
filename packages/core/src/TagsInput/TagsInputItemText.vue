<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { claimReferencedId, useForwardElement, useId } from '@/shared'
import { injectTagsInputItemContext } from './TagsInputItem.vue'
import { getTagsInputItemTextSurface } from './useTagsInput'

export interface TagsInputItemTextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'

withDefaults(defineProps<TagsInputItemTextProps>(), {
  as: 'span',
})

const itemContext = injectTagsInputItemContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

itemContext.textId ||= useId(undefined, 'reka-tags-input-item-text')
// A consumer `id` (or one on the asChild child) is the id the delete button's `aria-labelledby` references.
claimReferencedId(itemContext, 'textId')
const text = getTagsInputItemTextSurface(itemContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="text.attrs.value"
  >
    <slot>{{ itemContext.displayValue.value }}</slot>
  </component>
</template>
