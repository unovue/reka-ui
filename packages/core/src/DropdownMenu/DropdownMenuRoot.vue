<script lang="ts">
import type { Ref } from 'vue'
import type { Direction } from '../shared/types'
import type { DropdownMenuHandle } from './handle'
import type { MenuEmits, MenuOpenChangeReason, MenuProps } from '@/Menu'
import type { BaseChangeReason } from '@/shared'
import { createContext, useDirection, useId } from '@/shared'

export interface DropdownMenuRootProps<Payload = unknown> extends MenuProps {
  /** The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /**
   * A handle from `createDropdownMenuHandle()` that connects detached
   * `DropdownMenuTrigger`s rendered anywhere in the app. The menu anchors to,
   * returns focus to and exposes the `payload` of the trigger that opened it.
   */
  handle?: DropdownMenuHandle<Payload>
  /**
   * The id of the trigger that owns the menu, for a controlled menu with
   * detached triggers. Use with `open`.
   */
  triggerId?: string | null
  /** The id of the trigger that owns a menu that starts open (with `defaultOpen` and a `handle`). */
  defaultTriggerId?: string | null
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

<script setup lang="ts" generic="Payload = unknown">
import { toRefs } from 'vue'
import { provideMenuContext, provideMenuRootContext } from '@/Menu/MenuRoot.vue'
import { PopperRoot } from '@/Popper'
import { usePopupHandleAttachment } from '@/shared/popupHandle'
import { useDropdownMenu } from './useDropdownMenu'

const props = withDefaults(defineProps<DropdownMenuRootProps<Payload>>(), {
  modal: true,
  open: undefined,
  triggerId: undefined,
  defaultTriggerId: undefined,
})
const emit = defineEmits<DropdownMenuRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
    /** The `payload` of the detached trigger that opened the menu */
    payload: Payload | undefined
    /** The id of the detached trigger that opened the menu */
    activeTriggerId: string | null
  }) => any
}>()

// `useDropdownMenu` composes `useMenuRoot`: one open model, so the trigger and
// every Menu part (items, Escape, outside press) go through the same `setState`
// and `beforeUpdate:open` can cancel any of them. `useDirection` (ConfigProvider)
// and `useId` (SSR-stable) stay in the shell.
const { modal, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)

const { open, context, menuContext, menuRootContext, payload, activeTriggerId, handleStore } = useDropdownMenu<Payload>({
  open: () => props.open,
  defaultOpen: props.defaultOpen ?? false,
  dir,
  modal,
  baseId: useId(undefined, 'reka-dropdown-menu'),
  emit,
  onOpenComplete: value => emit('update:openComplete', value),
  handle: () => props.handle,
  triggerId: () => props.triggerId,
  defaultTriggerId: props.defaultTriggerId,
})

provideMenuContext(menuContext)
provideMenuRootContext(menuRootContext)
provideDropdownMenuRootContext(context)
// Client-only: the Root's state reaches a (possibly module-scope) handle only once mounted.
usePopupHandleAttachment(handleStore)
</script>

<template>
  <PopperRoot :reference="handleStore.handle.value ? handleStore.anchor.value : undefined">
    <slot
      :open="open"
      :payload="payload"
      :active-trigger-id="activeTriggerId"
    />
  </PopperRoot>
</template>
