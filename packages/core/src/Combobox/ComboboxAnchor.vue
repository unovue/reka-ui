<script lang="ts">
export interface ComboboxAnchorProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { PopperAnchor } from '@/Popper'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

defineProps<ComboboxAnchorProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopperAnchor
    as-child
    :reference="reference"
  >
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      v-bind="$attrs"
    >
      <slot />
    </component>
  </PopperAnchor>
</template>
