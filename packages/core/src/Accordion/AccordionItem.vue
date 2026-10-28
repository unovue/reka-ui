<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { CollapsibleRootProps } from '../Collapsible'
import type { DisclosureState } from '@/shared'
import { createContext, mergeExpose, setGeneratedIds, useForwardElement, useId } from '@/shared'
import { injectAccordionRootContext } from './AccordionRoot.vue'

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

export type AccordionItemEmits = {
  /** Event handler called after the open or close animations of the content have finished. */
  'update:openComplete': [value: boolean]
}

interface AccordionItemContext {
  open: ComputedRef<boolean>
  dataState: ComputedRef<DisclosureState>
  disabled: ComputedRef<boolean>
  dataDisabled: ComputedRef<'' | undefined>
  triggerId: string
  currentRef: Ref<HTMLElement | null | undefined>
  currentElement: ComputedRef<HTMLElement | undefined>
  value: ComputedRef<string>
}

export const [injectAccordionItemContext, provideAccordionItemContext]
  = createContext<AccordionItemContext>('AccordionItem')
</script>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { CollapsibleRoot } from '@/Collapsible'
import { getAccordionItemState } from './useAccordion'

const props = withDefaults(
  defineProps<AccordionItemProps>(),
  {
    unmountOnHide: undefined,
  },
)

const emits = defineEmits<AccordionItemEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

const rootContext = injectAccordionRootContext()

const surface = getAccordionItemState(rootContext, () => props.value, {
  disabled: () => props.disabled,
  unmountOnHide: () => props.unmountOnHide,
})
const { open, disabled, unmountOnHide } = surface

// The derived context refs are created on first read (perf): the item's own
// parts read none of them, so an item rendered with the default parts never
// pays for them.
let dataDisabled: ComputedRef<'' | undefined> | undefined
let dataState: ComputedRef<DisclosureState> | undefined
let currentElement: ComputedRef<HTMLElement | undefined> | undefined
let value: ComputedRef<string> | undefined
const getDataDisabled = () => (dataDisabled ??= computed(() => (disabled.value ? '' : undefined)))

const { forwardRef, expose } = useForwardElement()
defineExpose(mergeExpose(expose, {
  open,
  get dataDisabled() { return getDataDisabled() },
}))

// `AccordionTrigger` feeds its element here; it drives keyboard navigation.
const currentRef = shallowRef<HTMLElement | null>()

// Allocated here rather than in AccordionTrigger: content may render before its
// trigger, and SSR serializes `aria-labelledby` once, without a second pass.
// Writable so an `AccordionTrigger` `id` replaces it (and the content's `aria-labelledby` follows).
const triggerId = ref(useId(undefined, 'reka-accordion-trigger'))
const itemContext: AccordionItemContext = {
  open,
  get dataState() { return dataState ??= computed(() => surface.state.value.state) },
  disabled,
  get dataDisabled() { return getDataDisabled() },
  get triggerId() { return triggerId.value },
  set triggerId(value) { triggerId.value = value },
  currentRef,
  get currentElement() { return currentElement ??= computed(() => currentRef.value ?? undefined) },
  get value() { return value ??= computed(() => props.value) },
}
setGeneratedIds(itemContext, { triggerId: triggerId.value })
provideAccordionItemContext(itemContext)
</script>

<template>
  <CollapsibleRoot
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    :open="open"
    :disabled="disabled"
    :unmount-on-hide="unmountOnHide"
    v-bind="surface.item.attrs.value"
    @update:open-complete="emits('update:openComplete', $event)"
  >
    <slot :open="open" />
  </CollapsibleRoot>
</template>
