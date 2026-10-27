<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { PopperAnchor } from '@/Popper'
import { useForwardElement } from '@/shared'

interface MenuAnchorProps extends PopperAnchorProps {}

const props = defineProps<MenuAnchorProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopperAnchor
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </PopperAnchor>
</template>
