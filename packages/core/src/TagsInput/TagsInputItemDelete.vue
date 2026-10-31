<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectTagsInputItemContext } from './TagsInputItem.vue'
import { injectTagsInputRootContext } from './TagsInputRoot.vue'
import { getTagsInputItemDeleteSurface } from './useTagsInput'

export interface TagsInputItemDeleteProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'

withDefaults(defineProps<TagsInputItemDeleteProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const context = injectTagsInputRootContext()
const itemContext = injectTagsInputItemContext()
const itemDelete = getTagsInputItemDeleteSurface(context, itemContext)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="itemDelete.attrs.value"
  >
    <slot />
  </component>
</template>
