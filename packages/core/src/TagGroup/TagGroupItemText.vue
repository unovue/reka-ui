<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface TagGroupItemTextProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { watchEffect } from 'vue'
import { Primitive } from '@/Primitive'
import { injectTagGroupItemContext } from './TagGroupItem.vue'

const props = withDefaults(defineProps<TagGroupItemTextProps>(), {
  as: 'span',
})

const itemContext = injectTagGroupItemContext()
const { forwardRef, currentElement } = useForwardExpose()

watchEffect(() => {
  itemContext.textElement.value = currentElement.value
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
  >
    <slot />
  </Primitive>
</template>
