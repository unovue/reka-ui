<script lang="ts">
export interface ComboboxAnchorProps extends PopperAnchorProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'

defineProps<ComboboxAnchorProps>()

const { forwardRef } = useForwardExpose()
</script>

<template>
  <PopperAnchor
    as-child
    :reference="reference"
  >
    <Primitive
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      v-bind="$attrs"
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
