<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface AccordionTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { CollapsibleTrigger } from '@/Collapsible'
import { useForwardElement } from '@/shared'
import { injectAccordionItemContext } from './AccordionItem.vue'

import { injectAccordionRootContext } from './AccordionRoot.vue'
import { getAccordionTriggerSurface } from './useAccordion'

const props = defineProps<AccordionTriggerProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()

const surface = getAccordionTriggerSurface(rootContext, itemContext)

const { forwardRef, expose } = useForwardElement(itemContext.currentRef)
defineExpose(expose)
</script>

<template>
  <CollapsibleTrigger
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="surface.attrs.value"
  >
    <slot />
  </CollapsibleTrigger>
</template>
