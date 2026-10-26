<script lang="ts">
import type { MenuOpenChangeReason, MenuSubEmits, MenuSubProps } from '@/Menu'

export type DropdownMenuSubEmits = MenuSubEmits
export interface DropdownMenuSubProps extends MenuSubProps {
  /** The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
}
</script>

<script setup lang="ts">
import { MenuSub } from '@/Menu'
import { useControllableState, useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<DropdownMenuSubProps>(), {
  open: undefined,
})
const emit = defineEmits<DropdownMenuSubEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

// Owns the model so `beforeUpdate:open` can cancel: the inner `MenuSub` is
// controlled and reports each change with its reason.
const { state: open, setState } = useControllableState<boolean, MenuOpenChangeReason>({
  prop: () => props.open,
  defaultValue: props.defaultOpen ?? false,
  name: 'open',
  emit,
})

useForwardExpose()
</script>

<template>
  <MenuSub
    :open="open"
    @update:open="(value, details) => setState(value, details.reason, details.event)"
  >
    <slot :open="open" />
  </MenuSub>
</template>
