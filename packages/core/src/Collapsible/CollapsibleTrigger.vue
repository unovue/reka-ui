<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface CollapsibleTriggerProps extends PrimitiveProps {
  /** Id of the element. */
  id?: string
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'
import { getCollapsibleTriggerSurface } from './useCollapsible'

const props = withDefaults(defineProps<CollapsibleTriggerProps>(), {
  as: 'button',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectCollapsibleRootContext()
const surface = getCollapsibleTriggerSurface(rootContext)
</script>

<template>
  <component
    :is="renderAs(as, props.asChild)"
    :id="props.id"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot />
  </component>
</template>
