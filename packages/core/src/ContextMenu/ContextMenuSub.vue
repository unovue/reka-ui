<script lang="ts">
import type { MenuOpenChangeReason, MenuSubEmits, MenuSubProps } from '@/Menu'

export type ContextMenuSubEmits = MenuSubEmits
export interface ContextMenuSubProps extends MenuSubProps {
  /** The open state of the submenu when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
}
</script>

<script setup lang="ts">
import { MenuSub } from '@/Menu'
import { useControllableState, useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<ContextMenuSubProps>(), {
  open: undefined,
})
const emit = defineEmits<ContextMenuSubEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

useForwardExpose()

// Owns the model so `beforeUpdate:open` can cancel: the inner `MenuSub` is
// controlled and reports each change with its reason.
const { state: open, setState } = useControllableState<boolean, MenuOpenChangeReason>({
  prop: () => props.open,
  defaultValue: props.defaultOpen ?? false,
  name: 'open',
  emit,
})
</script>

<template>
  <MenuSub
    :open="open"
    @update:open="(value, details) => setState(value, details.reason, details.event)"
  >
    <slot :open="open" />
  </MenuSub>
</template>
