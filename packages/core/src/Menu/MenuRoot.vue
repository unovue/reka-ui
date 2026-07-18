<script lang="ts">
import type { Ref } from 'vue'
import type { Direction } from './utils'
import { createContext, useDirection } from '@/shared'

export interface MenuContext {
  open: Ref<boolean>
  onOpenChange: (open: boolean) => void
  content: Ref<HTMLElement | undefined>
  onContentChange: (content: HTMLElement | undefined) => void
}

export interface MenuRootContext {
  onClose: () => void
  dir: Ref<Direction>
  isUsingKeyboardRef: Ref<boolean>
  modal: Ref<boolean>
}

export interface MenuProps {
  /** The controlled open state of the menu. Can be used as `v-model:open`. */
  open?: boolean
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
  'update:open': [payload: boolean]
}

export const [injectMenuContext, provideMenuContext]
  = createContext<MenuContext>(['MenuRoot', 'MenuSub'], 'MenuContext')

export const [injectMenuRootContext, provideMenuRootContext]
  = createContext<MenuRootContext>('MenuRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { toRefs } from 'vue'
import { PopperRoot } from '@/Popper'
import { useMenuRoot } from './useMenu'

const props = withDefaults(defineProps<MenuProps>(), {
  open: false,
  modal: true,
})
const emits = defineEmits<MenuEmits>()
// `useVModel` + `useDirection` (ConfigProvider-aware) stay in the shell; the
// composable receives the resolved refs and builds the two context objects.
const { modal, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const open = useVModel(props, 'open', emits)

const { menuContext, menuRootContext } = useMenuRoot({ open, dir, modal })

provideMenuContext(menuContext)
provideMenuRootContext(menuRootContext)
</script>

<template>
  <PopperRoot>
    <slot />
  </PopperRoot>
</template>
