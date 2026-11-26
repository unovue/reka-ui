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
import { computed, withKeys } from 'vue'
import { provideCollapsibleRootContext } from '@/Collapsible/CollapsibleRoot.vue'
import { Primitive } from '@/Primitive'
import { useAgentItem } from '@/shared/useAgentRegistration'

const props = withDefaults(
  defineProps<AccordionItemProps>(),
  {
    unmountOnHide: undefined,
  },
)

const emits = defineEmits<{
  /** Event handler called when a toggle asks for the item to open or close. The accordion's `modelValue` holds its open state. */
  'update:open': [value: boolean]
}>()

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
// for as `update:open`, which is what `CollapsibleRoot` emitted before.
provideCollapsibleRootContext(defineReactiveIds({
  contentId: '',
  disabled,
  open,
  unmountOnHide: computed(() => props.unmountOnHide ?? rootContext.unmountOnHide.value),
  onOpenToggle: () => {
    if (disabled.value)
      return
    emits('update:open', !open.value)
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
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    :data-state="dataState"
    :data-disabled="dataDisabled"
    :data-orientation="rootContext.orientation"
    @keydown="onKeydown"
  >
    <slot :open="open" />
  </Primitive>
</template>
