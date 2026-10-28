<script lang="ts">
export interface ComboboxAnchorProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { usePopperAnchor } from '@/Popper/usePopperAnchor'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'

const props = defineProps<ComboboxAnchorProps>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
usePopperAnchor({ element: currentElement, reference: () => props.reference })
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>
