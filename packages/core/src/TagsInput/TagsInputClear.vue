<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectTagsInputRootContext } from './TagsInputRoot.vue'
import { getTagsInputClearSurface } from './useTagsInput'

export interface TagsInputClearProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

withDefaults(defineProps<TagsInputClearProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const context = injectTagsInputRootContext()
const clear = getTagsInputClearSurface(context)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="clear.attrs.value"
  >
    <slot />
  </Primitive>
</template>
