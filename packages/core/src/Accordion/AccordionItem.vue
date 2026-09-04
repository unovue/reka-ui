<script lang="ts">
import type { ComputedRef, VNodeRef } from 'vue'
import type { CollapsibleRootProps } from '../Collapsible'
import { createContext, stateToDataAttrs, useForwardExpose } from '@/shared'
import { injectAccordionRootContext } from './AccordionRoot.vue'

const AccordionItemState = {
  Open: 'open',
  Closed: 'closed',
} as const
type AccordionItemStateValue = typeof AccordionItemState[keyof typeof AccordionItemState]

export interface AccordionItemProps
  extends Omit<CollapsibleRootProps, 'open' | 'defaultOpen' | 'onOpenChange'> {
  /**
   * Whether or not an accordion item is disabled from user interaction.
   * When `true`, prevents the user from interacting with the item.
   *
   * @defaultValue false
   */
  disabled?: boolean
  /**
   * A string value for the accordion item. All items within an accordion should use a unique value.
   */
  value: string
}

interface AccordionItemContext {
  open: ComputedRef<boolean>
  dataState: ComputedRef<AccordionItemStateValue>
  disabled: ComputedRef<boolean>
  dataDisabled: ComputedRef<'' | undefined>
  triggerId: string
  currentRef: VNodeRef
  currentElement: ComputedRef<HTMLElement | undefined>
  value: ComputedRef<string>
}

export const [injectAccordionItemContext, provideAccordionItemContext]
  = createContext<AccordionItemContext>('AccordionItem')
</script>

<script setup lang="ts">
import { computed, mergeProps } from 'vue'
import { CollapsibleRoot } from '@/Collapsible'
import { getAccordionItemSurface } from './useAccordion'

const props = withDefaults(
  defineProps<AccordionItemProps>(),
  {
    unmountOnHide: undefined,
  },
)

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

const rootContext = injectAccordionRootContext()

const surface = getAccordionItemSurface(rootContext, () => props.value, {
  disabled: () => props.disabled,
  unmountOnHide: () => props.unmountOnHide,
})
const { open, disabled } = surface

const dataDisabled = computed(() => (disabled.value ? '' : undefined))
const dataState = computed<AccordionItemStateValue>(() => surface.item.state.value.state)

defineExpose({ open, dataDisabled })
const { currentRef, currentElement } = useForwardExpose()

provideAccordionItemContext({
  open,
  dataState,
  disabled,
  dataDisabled,
  triggerId: '',
  currentRef,
  currentElement,
  value: computed(() => props.value),
})
</script>

<template>
  <CollapsibleRoot
    :as="props.as"
    :as-child="props.asChild"
    v-bind="mergeProps(surface.item.props.value, stateToDataAttrs(surface.item.state.value))"
  >
    <slot :open="open" />
  </CollapsibleRoot>
</template>
