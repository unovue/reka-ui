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
import { mergeProps, onMounted, onUpdated, shallowRef } from 'vue'
import { injectCollapsibleRootContext } from '@/Collapsible/CollapsibleRoot.vue'
import { getCollapsibleTriggerSurface } from '@/Collapsible/useCollapsible'
import { renderAsControl } from '@/Primitive/renderAs'
import { useForwardElement, usePartId } from '@/shared'
import { injectAccordionItemContext } from './AccordionItem.vue'

import { injectAccordionRootContext } from './AccordionRoot.vue'
import { getAccordionTriggerSurface } from './useAccordion'

const props = defineProps<AccordionTriggerProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()
// With `asChild`, an `id` on the child element overrides the one passed down: once rendered, the
// element's id is the one the content's `aria-labelledby` follows.
const renderedId = shallowRef<string>()
// Rendered on the element; mirrored into the item context for the content's `aria-labelledby`.
const triggerId = usePartId(() => props.id || renderedId.value, itemContext, 'triggerId')
function syncRenderedId() {
  const id = itemContext.currentRef.value?.id
  if (id && id !== triggerId.value)
    renderedId.value = id
}

const surface = getAccordionTriggerSurface(rootContext, itemContext)
// Provided by `AccordionItem`. The trigger renders what a `CollapsibleTrigger` rendered around it, with
// the same attributes in the same order, without that component in between.
const collapsibleSurface = getCollapsibleTriggerSurface(injectCollapsibleRootContext())

const { forwardRef, expose } = useForwardElement(itemContext.currentRef)
defineExpose(expose)
onMounted(syncRenderedId)
onUpdated(syncRenderedId)
</script>

<template>
  <component
    :is="renderAsControl(props.as ?? 'button', props.asChild)"
    :id="triggerId"
    :ref="forwardRef"
    :type="(props.as ?? 'button') === 'button' ? 'button' : undefined"
    v-bind="mergeProps(collapsibleSurface.attrs.value, surface.attrs.value)"
  >
    <slot />
  </component>
</template>
