<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { MenuEmits, MenuOpenChangeReason, MenuProps } from '@/Menu'
import type { BaseChangeReason, Direction } from '@/shared/types'
import { createContext, useDirection } from '@/shared'

export type ContextMenuRootContext = {
  open: ComputedRef<boolean>
  onOpenChange: (open: boolean, reason?: MenuOpenChangeReason | BaseChangeReason, event?: Event) => void
  modal: Ref<boolean>
  dir: Ref<Direction>
  triggerElement: Ref<HTMLElement | undefined>
  pressOpenDelay: Ref<number>
}

export interface ContextMenuRootProps extends MenuProps {
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
import { toRefs } from 'vue'
import { provideMenuContext, provideMenuRootContext } from '@/Menu/MenuRoot.vue'
import { PopperRoot } from '@/Popper'
import { useContextMenu } from './useContextMenu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ContextMenuRootProps>(), {
  modal: true,
  pressOpenDelay: 700,
  open: undefined,
})
const emits = defineEmits<ContextMenuRootEmits>()
const { dir: propDir, modal, pressOpenDelay } = toRefs(props)
const dir = useDirection(propDir)

// `useContextMenu` composes `useMenuRoot`: the trigger's open and every Menu
// close (items, Escape, outside press) go through one `setState`, so
// `beforeUpdate:open` can cancel either. `open` is optional: without it
// ContextMenu owns the model.
const { context, menuContext, menuRootContext } = useContextMenu({
  open: () => props.open,
  defaultOpen: props.defaultOpen ?? false,
  dir,
  modal,
  pressOpenDelay,
  emit: emits,
})

provideMenuContext(menuContext)
provideMenuRootContext(menuRootContext)
provideContextMenuRootContext(context)
</script>

<template>
  <PopperRoot>
    <slot />
  </PopperRoot>
</template>
