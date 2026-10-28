<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface TagGroupItemTextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watchEffect } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { injectTagGroupItemContext } from './TagGroupItem.vue'

const props = withDefaults(defineProps<TagGroupItemTextProps>(), {
  as: 'span',
})

const itemContext = injectTagGroupItemContext()
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

watchEffect(() => {
  itemContext.textElement.value = currentElement.value
})
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
