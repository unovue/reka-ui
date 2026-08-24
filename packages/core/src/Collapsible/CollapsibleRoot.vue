<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { toRefs } from 'vue'
import { createContext, useForwardExpose } from '@/shared'

export interface CollapsibleRootProps extends PrimitiveProps {
  /** The open state of the collapsible when it is initially rendered. <br> Use when you do not need to control its open state. */
  defaultOpen?: boolean | undefined
  /** The controlled open state of the collapsible. Can be binded with `v-model`. */
  open?: boolean | undefined
  /** When `true`, prevents the user from interacting with the collapsible. */
  disabled?: boolean | undefined
  /** When `true`, the element will be unmounted on closed state. */
  unmountOnHide?: boolean | undefined
}

export type CollapsibleRootEmits = {
  /** Event handler called when the open state of the collapsible changes. */
  'update:open': [value: boolean]
}

interface CollapsibleRootContext {
  contentId: string
  disabled?: Ref<boolean> | undefined
  open: Ref<boolean>
  unmountOnHide: Ref<boolean>
  onOpenToggle: () => void
}

export const [injectCollapsibleRootContext, provideCollapsibleRootContext]
  = createContext<CollapsibleRootContext>('CollapsibleRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { Primitive } from '@/Primitive'
import { UNDEFINED_DEFAULT } from '@/shared/propDefaults'

const props = withDefaults(defineProps<CollapsibleRootProps>(), {
  open: UNDEFINED_DEFAULT,
  defaultOpen: false,
  unmountOnHide: true,
})

const emit = defineEmits<CollapsibleRootEmits>()

defineSlots<{
  default?: ((props: {
    /** Current open state */
    open: typeof open.value
  }) => any) | undefined
}>()

const open = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const { disabled, unmountOnHide } = toRefs(props)

provideCollapsibleRootContext({
  contentId: '',
  disabled,
  open,
  unmountOnHide,
  onOpenToggle: () => {
    if (disabled.value)
      return

    open.value = !open.value
  },
})

defineExpose({ open })
useForwardExpose()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="props.asChild"
    :data-state="open ? 'open' : 'closed'"
    :data-disabled="disabled ? '' : undefined"
  >
    <slot :open="open" />
  </Primitive>
</template>
