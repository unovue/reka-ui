<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface SelectItemIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { injectSelectItemContext } from './SelectItem.vue'

withDefaults(defineProps<SelectItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef } = useForwardExpose()
const itemContext = injectSelectItemContext()

// An item that isn't selected has nothing to show or to animate out, so it mounts no
// `Presence`: a list has one per item otherwise. Once selected, the `Presence` stays until
// its exit animation is over.
const presenceRef = ref<InstanceType<typeof Presence>>()
</script>

<template>
  <Presence
    v-if="forceMount || itemContext.isSelected.value || presenceRef?.present"
    ref="presenceRef"
    :present="forceMount || itemContext.isSelected.value"
  >
    <Primitive
      :ref="forwardRef"
      aria-hidden="true"
      :data-state="itemContext.isSelected.value ? 'checked' : 'unchecked'"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
