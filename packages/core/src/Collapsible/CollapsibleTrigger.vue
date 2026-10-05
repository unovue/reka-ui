<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface CollapsibleTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'
import { getCollapsibleTriggerSurface } from './useCollapsible'

const props = withDefaults(defineProps<CollapsibleTriggerProps>(), {
  as: 'button',
})

useForwardExpose()
const rootContext = injectCollapsibleRootContext()
const surface = getCollapsibleTriggerSurface(rootContext)
</script>

<template>
  <Primitive
    :type="as === 'button' ? 'button' : undefined"
    :as="as"
    :as-child="props.asChild"
    v-bind="surface.attrs.value"
  >
    <slot />
  </Primitive>
</template>
