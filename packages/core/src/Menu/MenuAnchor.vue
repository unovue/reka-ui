<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { usePopperAnchor } from '@/Popper/usePopperAnchor'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

interface MenuAnchorProps extends PopperAnchorProps {}

const props = defineProps<MenuAnchorProps>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
usePopperAnchor({ element: currentElement, reference: () => props.reference })
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
