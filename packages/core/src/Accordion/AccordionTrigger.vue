<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useId } from '@/shared'

export interface AccordionTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { CollapsibleTrigger } from '@/Collapsible'
import { injectAccordionItemContext } from './AccordionItem.vue'

import { injectAccordionRootContext } from './AccordionRoot.vue'
import { getAccordionTriggerSurface } from './useAccordion'

const props = defineProps<AccordionTriggerProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()

itemContext.triggerId ||= useId(undefined, 'reka-accordion-trigger')
const surface = getAccordionTriggerSurface(rootContext, itemContext)
</script>

<template>
  <CollapsibleTrigger
    :ref="itemContext.currentRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="surface.attrs.value"
  >
    <slot />
  </CollapsibleTrigger>
</template>
