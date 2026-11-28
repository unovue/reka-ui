<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface CollapsibleContentProps extends PrimitiveProps {
  /**
   * Id of the element, which the trigger's `aria-controls` points at.
   * Auto-generated when not provided.
   */
  id?: string
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}

export type CollapsibleContentEmits = {
  contentFound: [event: Event]
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useCollapsibleContent } from './useCollapsibleContent'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<CollapsibleContentProps>()
const emits = defineEmits<CollapsibleContentEmits>()

const content = useCollapsibleContent(props, event => emits('contentFound', event))
defineExpose(content.expose)
</script>

<template>
  <component
    :is="renderAs(as, props.asChild)"
    v-bind="content.attrs($attrs)"
    :ref="content.forwardRef"
  >
    <slot v-if="content.showsSlot()" />
  </component>
</template>
