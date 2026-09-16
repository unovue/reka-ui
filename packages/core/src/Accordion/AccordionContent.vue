<script lang="ts">
import type { CollapsibleContentProps } from '../Collapsible'
import { useForwardExpose } from '@/shared'

export interface AccordionContentProps extends CollapsibleContentProps {}
</script>

<script setup lang="ts">
import { CollapsibleContent } from '../Collapsible'
import { injectAccordionItemContext } from './AccordionItem.vue'
import { injectAccordionRootContext } from './AccordionRoot.vue'
import { getAccordionContentSurface } from './useAccordion'

const props = defineProps<AccordionContentProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()
const surface = getAccordionContentSurface(rootContext, itemContext)

useForwardExpose()
</script>

<template>
  <CollapsibleContent
    :as-child="props.asChild"
    :as="as"
    :force-mount="props.forceMount"
    v-bind="surface.attrs.value"
  >
    <slot />
  </CollapsibleContent>
</template>
