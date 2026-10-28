<script lang="ts">
import type { ReferenceElement } from '@floating-ui/vue'
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface PopperAnchorProps extends PrimitiveProps {
  /**
   *  The reference (or anchor) element that is being referred to for positioning.
   *
   *  If not provided will use the current component as anchor.
   */
  reference?: ReferenceElement
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { usePopperAnchor } from './usePopperAnchor'

const props = defineProps<PopperAnchorProps>()

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
