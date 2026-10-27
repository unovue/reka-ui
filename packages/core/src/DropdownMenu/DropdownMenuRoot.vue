<script lang="ts">
import type { Ref } from 'vue'
import type { Direction } from '../shared/types'
import type { MenuEmits, MenuOpenChangeReason, MenuProps } from '@/Menu'
import type { BaseChangeReason } from '@/shared'
import { createContext, useDirection, useId } from '@/shared'

export interface DropdownMenuRootProps extends MenuProps {
  /** The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
}
export type DropdownMenuRootEmits = MenuEmits

export interface DropdownMenuRootContext {
  open: Readonly<Ref<boolean>>
  onOpenChange: (open: boolean, reason?: MenuOpenChangeReason | BaseChangeReason, event?: Event) => void
  onOpenToggle: (reason?: MenuOpenChangeReason | BaseChangeReason, event?: Event) => void
  triggerId: string
  triggerElement: Ref<HTMLElement | undefined>
  contentId: string
  modal: Ref<boolean>
  dir: Ref<Direction>
}

export const [injectDropdownMenuRootContext, provideDropdownMenuRootContext]
  = createContext<DropdownMenuRootContext>('DropdownMenuRoot')
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { provideMenuContext, provideMenuRootContext } from '@/Menu/MenuRoot.vue'
import { PopperRoot } from '@/Popper'
import { useDropdownMenu } from './useDropdownMenu'

const props = withDefaults(defineProps<DropdownMenuRootProps>(), {
  modal: true,
  open: undefined,
})
const emit = defineEmits<DropdownMenuRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

// `useDropdownMenu` composes `useMenuRoot`: one open model, so the trigger and
// every Menu part (items, Escape, outside press) go through the same `setState`
// and `beforeUpdate:open` can cancel any of them. `useDirection` (ConfigProvider)
// and `useId` (SSR-stable) stay in the shell.
const { modal, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)

const { open, context, menuContext, menuRootContext } = useDropdownMenu({
  open: () => props.open,
  defaultOpen: props.defaultOpen ?? false,
  dir,
  modal,
  baseId: useId(undefined, 'reka-dropdown-menu'),
  emit,
  onOpenComplete: value => emit('update:openComplete', value),
})

provideMenuContext(menuContext)
provideMenuRootContext(menuRootContext)
provideDropdownMenuRootContext(context)
</script>

<template>
  <PopperRoot>
    <slot :open="open" />
  </PopperRoot>
</template>
