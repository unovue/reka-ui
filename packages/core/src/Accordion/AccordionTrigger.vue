<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface AccordionTriggerProps extends PrimitiveProps {
  /**
   * Id of the element, which the content's `aria-labelledby` points at.
   * Auto-generated when not provided.
   */
  id?: string
}
</script>

<script setup lang="ts">
import { CollapsibleTrigger } from '@/Collapsible'
import { useForwardElement, usePartId } from '@/shared'
import { injectAccordionItemContext } from './AccordionItem.vue'

import { injectAccordionRootContext } from './AccordionRoot.vue'
import { getAccordionTriggerSurface } from './useAccordion'

const props = defineProps<AccordionTriggerProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()
usePartId(() => props.id, itemContext.triggerId, (id) => { itemContext.triggerId = id })

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
