<script lang="ts">
import type { CollapsibleContentProps } from '../Collapsible'

export interface AccordionContentProps extends CollapsibleContentProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'
import { CollapsibleContent } from '../Collapsible'
import { injectAccordionItemContext } from './AccordionItem.vue'
import { injectAccordionRootContext } from './AccordionRoot.vue'
import { getAccordionContentSurface } from './useAccordion'

const props = defineProps<AccordionContentProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()
const surface = getAccordionContentSurface(rootContext, itemContext)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <CollapsibleContent
    :ref="forwardRef"
    :as-child="props.asChild"
    :as="as"
    :force-mount="props.forceMount"
    v-bind="surface.attrs.value"
  >
    <slot />
  </CollapsibleContent>
</template>
