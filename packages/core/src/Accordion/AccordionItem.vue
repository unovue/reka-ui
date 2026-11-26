<script lang="ts">
import type { ComputedRef, VNodeRef } from 'vue'
import type { CollapsibleRootProps } from '../Collapsible'
import { createRekaContext, defineReactiveIds, useArrowNavigation, useForwardExpose } from '@/shared'
import { injectAccordionRootContext } from './AccordionRoot.vue'

enum AccordionItemState {
  Open = 'open',
  Closed = 'closed',
}

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
  dataState: ComputedRef<AccordionItemState>
  disabled: ComputedRef<boolean>
  dataDisabled: ComputedRef<'' | undefined>
  triggerId: string
  currentRef: VNodeRef
  currentElement: ComputedRef<HTMLElement | undefined>
  value: ComputedRef<string>
}

export const [injectAccordionItemContext, provideAccordionItemContext]
  = createRekaContext<AccordionItemContext>('AccordionItem')
</script>

<script setup lang="ts">
import { computed, mergeProps, useAttrs, withKeys } from 'vue'
import { provideCollapsibleRootContext } from '@/Collapsible/CollapsibleRoot.vue'
import { Primitive } from '@/Primitive'
import { useAgentItem } from '@/shared/useAgentRegistration'

defineOptions({
  // Bound by hand, so that an `@update:open` listener is called instead of added to the element.
  inheritAttrs: false,
})

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

const open = computed(() =>
  rootContext.isSingle.value
    ? props.value === rootContext.modelValue.value
    : Array.isArray(rootContext.modelValue.value)
      && rootContext.modelValue.value.includes(props.value),
)

const disabled = computed(() => {
  return (rootContext.disabled.value || props.disabled)
})

const dataDisabled = computed(() => (disabled.value ? '' : undefined))

const dataState = computed(() =>
  open.value ? AccordionItemState.Open : AccordionItemState.Closed,
)

defineExpose({ open, dataDisabled })
const { currentRef, currentElement } = useForwardExpose()
useAgentItem(rootContext, props, currentElement)

provideAccordionItemContext(defineReactiveIds({
  open,
  dataState,
  disabled,
  dataDisabled,
  triggerId: '',
  currentRef,
  currentElement,
  value: computed(() => props.value),
}, ['triggerId']))

// The item is its own collapsible root: `AccordionTrigger` and `AccordionContent` read this context
// as they would under a `CollapsibleRoot`, without the component and its `v-model` state in
// between. The open state belongs to the accordion, so a toggle only reports the state it asks
// for to an `@update:open` listener on the item, which is what reached `CollapsibleRoot` before.
const attrs = useAttrs()
provideCollapsibleRootContext(defineReactiveIds({
  contentId: '',
  disabled,
  open,
  unmountOnHide: computed(() => props.unmountOnHide ?? rootContext.unmountOnHide.value),
  onOpenToggle: () => {
    if (disabled.value)
      return
    const listener = attrs['onUpdate:open'] as ((value: boolean) => void) | ((value: boolean) => void)[] | undefined
    const value = !open.value
    if (Array.isArray(listener))
      listener.forEach(fn => fn(value))
    else
      listener?.(value)
  },
}, ['contentId']))

function handleArrowKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  const allCollectionItems: HTMLElement[] = Array.from(rootContext.parentElement.value?.querySelectorAll('[data-reka-collection-item]') ?? [])

  const collectionItemIndex = allCollectionItems.findIndex(item => item === target)
  if (collectionItemIndex === -1)
    return null

  useArrowNavigation(
    e,
    target,
    rootContext.parentElement.value!,
    {
      arrowKeyOptions: rootContext.orientation,
      dir: rootContext.direction.value,
      focus: true,
    },
  )
}

const onKeydown = withKeys(handleArrowKey, ['up', 'down', 'left', 'right', 'home', 'end'])

// The item's own bindings, then everything the consumer passed but the `update:open` listener, which
// wins over them as it did when it fell through.
function itemAttrs() {
  let consumer = attrs
  if ('onUpdate:open' in consumer) {
    const { 'onUpdate:open': _, ...rest } = consumer
    consumer = rest
  }
  return mergeProps({
    'data-state': dataState.value,
    'data-disabled': dataDisabled.value,
    'data-orientation': rootContext.orientation,
    onKeydown,
  }, consumer)
}
</script>

<template>
  <Primitive
    v-bind="itemAttrs()"
    :as="props.as"
    :as-child="props.asChild"
  >
    <slot :open="open" />
  </Primitive>
</template>
