<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { MenuEmits, MenuOpenChangeReason, MenuProps } from '@/Menu'
import type { BaseChangeReason, Direction } from '@/shared/types'
import { createContext, useControllableState, useDirection, useForwardExpose } from '@/shared'

type ContextMenuRootContext = {
  open: ComputedRef<boolean>
  onOpenChange: (open: boolean, reason?: MenuOpenChangeReason | BaseChangeReason, event?: Event) => void
  modal: Ref<boolean>
  dir: Ref<Direction>
  triggerElement: Ref<HTMLElement | undefined>
  pressOpenDelay: Ref<number>
}

export interface ContextMenuRootProps extends Omit<MenuProps, 'open'> {
  /**
   * The duration from when the trigger is pressed until the menu opens.
   *
   * @defaultValue 700
   */
  pressOpenDelay?: number
}
export type ContextMenuRootEmits = MenuEmits

export const [injectContextMenuRootContext, provideContextMenuRootContext]
  = createContext<ContextMenuRootContext>('ContextMenuRoot')
</script>

<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { MenuRoot } from '@/Menu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ContextMenuRootProps>(), {
  modal: true,
  pressOpenDelay: 700,
})
const emits = defineEmits<ContextMenuRootEmits>()
const { dir: propDir, modal, pressOpenDelay } = toRefs(props)
useForwardExpose()
const dir = useDirection(propDir)

// ContextMenu owns the model (there is no `open` prop): the trigger opens it,
// the controlled `MenuRoot` below reports closes with their reason, and both
// paths go through one `setState` so `beforeUpdate:open` can cancel either.
const { state: open, setState } = useControllableState<boolean, MenuOpenChangeReason>({
  defaultValue: false,
  name: 'open',
  emit: emits,
})
const triggerElement = ref<HTMLElement>()

provideContextMenuRootContext({
  open,
  onOpenChange: (value, reason = 'trigger-press', event) => {
    setState(value, reason, event)
  },
  dir,
  modal,
  triggerElement,
  pressOpenDelay,
})
</script>

<template>
  <MenuRoot
    :open="open"
    :dir="dir"
    :modal="modal"
    @update:open="(value, details) => setState(value, details.reason, details.event)"
  >
    <slot />
  </MenuRoot>
</template>
