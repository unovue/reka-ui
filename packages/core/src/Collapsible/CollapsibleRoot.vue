<script lang="ts">
import type { Ref } from 'vue'
import type { CollapsibleChangeReason } from './useCollapsible'
import type { PrimitiveProps } from '@/Primitive'
import type { ChangeEventDetails } from '@/shared'
import { toRefs } from 'vue'
import { createContext, useForwardExpose } from '@/shared'

export interface CollapsibleRootProps extends PrimitiveProps {
  /** The open state of the collapsible when it is initially rendered. <br> Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /** The controlled open state of the collapsible. Can be binded with `v-model`. */
  open?: boolean
  /** When `true`, prevents the user from interacting with the collapsible. */
  disabled?: boolean
  /** When `true`, the element will be unmounted on closed state. */
  unmountOnHide?: boolean
}

export type CollapsibleRootEmits = {
  /** Event handler called when the open state of the collapsible changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<CollapsibleChangeReason>]
  /** Called before a change; call details.cancel() to keep the current state. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<CollapsibleChangeReason>]
}

export interface CollapsibleRootContext {
  contentId: string
  disabled?: Ref<boolean>
  open: Ref<boolean>
  unmountOnHide: Ref<boolean>
  onOpenToggle: (event?: Event) => void
  onContentFound?: (event: Event) => void
}

export const [injectCollapsibleRootContext, provideCollapsibleRootContext]
  = createContext<CollapsibleRootContext>('CollapsibleRoot')
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useCollapsible } from './useCollapsible'

const props = withDefaults(defineProps<CollapsibleRootProps>(), {
  open: undefined,
  defaultOpen: false,
  unmountOnHide: true,
})

const emit = defineEmits<CollapsibleRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

const { disabled, unmountOnHide } = toRefs(props)
const { open, root, context } = useCollapsible({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  disabled,
  unmountOnHide,
  emit,
  baseId: '',
})

// Preserve the existing Content-shell id allocation order for SSR.
context.contentId = ''
provideCollapsibleRootContext(context)

defineExpose({ open })
useForwardExpose()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    v-bind="root.attrs.value"
  >
    <slot :open="open" />
  </Primitive>
</template>
