<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface AccordionTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { injectCollapsibleRootContext } from '@/Collapsible/CollapsibleRoot.vue'
import { Primitive } from '@/Primitive'
import { disabledAttr, useId, useTriggerId } from '@/shared'
import { injectAccordionItemContext } from './AccordionItem.vue'

import { injectAccordionRootContext } from './AccordionRoot.vue'

const props = defineProps<AccordionTriggerProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()
// Provided by `AccordionItem`. The trigger renders what a `CollapsibleTrigger` renders, without
// that component in between.
const collapsibleContext = injectCollapsibleRootContext()

useTriggerId(itemContext, itemContext.currentElement, () => useId(undefined, 'reka-accordion-trigger'))
function changeItem() {
  const triggerDisabled = rootContext.isSingle.value && itemContext.open.value && !rootContext.collapsible
  if (itemContext.disabled.value || triggerDisabled)
    return

  rootContext.changeModelValue(itemContext.value.value)
}

// What `CollapsibleTrigger` did on a click comes first: the item reports the toggle it asks for.
function handleClick() {
  collapsibleContext.onOpenToggle()
  changeItem()
}

// In the order `CollapsibleTrigger` rendered them, so the element's attributes keep their order.
function triggerAttrs() {
  return {
    'type': (props.as ?? 'button') === 'button' ? 'button' : undefined,
    'aria-controls': collapsibleContext.contentId || undefined,
    'aria-expanded': itemContext.open.value || false,
    'data-state': itemContext.dataState.value,
    'data-disabled': itemContext.dataDisabled.value,
    'disabled': disabledAttr(itemContext.disabled.value, props.as, props.asChild),
    'id': itemContext.triggerId,
    'data-reka-collection-item': '',
    'aria-disabled': itemContext.disabled.value || undefined,
    'data-orientation': rootContext.orientation,
  }
}
</script>

<template>
  <Primitive
    v-bind="triggerAttrs()"
    :ref="itemContext.currentRef"
    :as="props.as ?? 'button'"
    :as-child="props.asChild"
    @click="handleClick"
  >
    <slot />
  </Primitive>
</template>
