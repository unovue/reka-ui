<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { MenuOpenChangeReason } from './useMenu'
import type { Direction } from './utils'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useDirection } from '@/shared'

export interface MenuContext {
  open: ComputedRef<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (open: boolean, reason?: MenuOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  content: Ref<HTMLElement | undefined>
  onContentChange: (content: HTMLElement | undefined) => void
}

export interface MenuRootContext {
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onClose: (reason?: MenuOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  dir: Ref<Direction>
  isUsingKeyboardRef: Ref<boolean>
  modal: Ref<boolean>
}

export interface MenuProps {
  /** The controlled open state of the menu. Can be used as `v-model:open`. */
  open?: boolean
  /** The open state of the menu when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /**
   * The reading direction of the combobox when applicable.
   *
   * If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  /**
   * The modality of the dropdown menu.
   *
   * When set to `true`, interaction with outside elements will be disabled and only menu content will be visible to screen readers.
   */
  modal?: boolean
}

export type MenuEmits = {
  /** Called before the open state changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:open': [payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason>]
  /** Event handler called when the open state of the menu changes. */
  'update:open': [payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason>]
}

export const [injectMenuContext, provideMenuContext]
  = createContext<MenuContext>(['MenuRoot', 'MenuSub'], 'MenuContext')

export const [injectMenuRootContext, provideMenuRootContext]
  = createContext<MenuRootContext>('MenuRoot')
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { PopperRoot } from '@/Popper'
import { useMenuRoot } from './useMenu'

const props = withDefaults(defineProps<MenuProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
})
const emits = defineEmits<MenuEmits>()
// `useDirection` (ConfigProvider-aware) stays in the shell; the composable owns
// the controlled/uncontrolled `open` model and builds the two context objects.
const { modal, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)

const { menuContext, menuRootContext } = useMenuRoot({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  dir,
  modal,
  emit: emits,
})

provideMenuContext(menuContext)
provideMenuRootContext(menuRootContext)
</script>

<template>
  <PopperRoot>
    <slot />
  </PopperRoot>
</template>
