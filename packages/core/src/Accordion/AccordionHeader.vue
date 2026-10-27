<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface AccordionHeaderProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectAccordionItemContext } from './AccordionItem.vue'
import { injectAccordionRootContext } from './AccordionRoot.vue'
import { getAccordionHeaderSurface } from './useAccordion'

const props = withDefaults(defineProps<AccordionHeaderProps>(), {
  as: 'h3',
})

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()
const surface = getAccordionHeaderSurface(rootContext, itemContext)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="surface.attrs.value"
  >
    <slot />
  </Primitive>
</template>
