<script lang="ts">
import type { MenuSubEmits, MenuSubProps } from '@/Menu'
import type { Ref } from 'vue'

export type ContextMenuSubEmits = MenuSubEmits
export interface ContextMenuSubProps extends MenuSubProps {
  /** The open state of the submenu when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
}
</script>

<script setup lang="ts">
import { MenuSub } from '@/Menu'
import { useForwardExpose } from '@/shared'
import { useVModel } from '@vueuse/core'

const props = withDefaults(defineProps<ContextMenuSubProps>(), {
  open: undefined,
})
const emit = defineEmits<ContextMenuSubEmits>()

defineSlots<{
  default: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

useForwardExpose()

const open = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>
</script>

<template>
  <MenuSub v-model:open="open">
    <slot :open="open" />
  </MenuSub>
</template>
