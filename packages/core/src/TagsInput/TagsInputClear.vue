<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectTagsInputRootContext } from './TagsInputRoot.vue'
import { getTagsInputClearSurface } from './useTagsInput'

export interface TagsInputClearProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'

withDefaults(defineProps<TagsInputClearProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const context = injectTagsInputRootContext()
const clear = getTagsInputClearSurface(context)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="clear.attrs.value"
  >
    <slot />
  </component>
</template>
