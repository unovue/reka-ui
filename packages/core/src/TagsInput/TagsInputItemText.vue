<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement, useId } from '@/shared'
import { injectTagsInputItemContext } from './TagsInputItem.vue'
import { getTagsInputItemTextSurface } from './useTagsInput'

export interface TagsInputItemTextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

withDefaults(defineProps<TagsInputItemTextProps>(), {
  as: 'span',
})

const itemContext = injectTagsInputItemContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

itemContext.textId ||= useId(undefined, 'reka-tags-input-item-text')
const text = getTagsInputItemTextSurface(itemContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="text.attrs.value"
  >
    <slot>{{ itemContext.displayValue.value }}</slot>
  </Primitive>
</template>
