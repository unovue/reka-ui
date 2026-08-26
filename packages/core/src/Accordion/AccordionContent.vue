<script lang="ts">
import type { CollapsibleContentProps } from '../Collapsible'
import { stateToDataAttrs, useForwardExpose } from '@/shared'

export interface AccordionContentProps extends CollapsibleContentProps {}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
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
    v-bind="mergeProps(surface.props.value, stateToDataAttrs(surface.state.value))"
  >
    <slot />
  </CollapsibleContent>
</template>
