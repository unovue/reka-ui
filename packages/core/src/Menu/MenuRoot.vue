<script lang="ts">
import type { EventHookOn } from '@vueuse/core'
import type { Ref } from 'vue'
import type { Direction } from './utils'
import { createRekaContext, useDirection } from '@/shared'
import { useIsUsingKeyboard } from '@/shared/useIsUsingKeyboard'

export interface MenuContext {
  open: Ref<boolean>
  onOpenChange: (open: boolean) => void
  content: Ref<HTMLElement | undefined>
  onContentChange: (content: HTMLElement | undefined) => void
  /**
   * Internal: registers a handler for when a content kept mounted while closed
   * (`unmountOnHide: false`) is hidden, which no unmount reports.
   */
  onContentHide: EventHookOn<MenuContentHideEvent>
  /** Internal: called by the content when it is hidden while kept mounted. */
  contentHidden: (event: MenuContentHideEvent) => void
}

export interface MenuContentHideEvent {
  /** The focus scope of the content that was hidden. */
  container: HTMLElement | undefined
  /** The element that had focus before the content was shown, which an unmount would focus back. */
  focusedBeforeShow: HTMLElement | null
}

export interface MenuRootContext {
  onClose: () => void
  dir: Ref<Direction>
  isUsingKeyboardRef: Ref<boolean>
  modal: Ref<boolean>
  unmountOnHide: Ref<boolean>
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
  /**
   * When set to `false`, the menu content and its submenus will not be unmounted when closed, but instead hidden with CSS.
   *
   * Useful when you want to keep the state of the content, or to improve performance by not remounting it on every open.
   * @defaultValue true
   */
  unmountOnHide?: boolean
}

export type MenuEmits = {
  'update:open': [payload: boolean]
}

export const [injectMenuContext, provideMenuContext]
  = createRekaContext<MenuContext>(['MenuRoot', 'MenuSub'], 'MenuContext')

export const [injectMenuRootContext, provideMenuRootContext]
  = createRekaContext<MenuRootContext>('MenuRoot')
</script>

<script setup lang="ts">
import { createEventHook, useVModel } from '@vueuse/core'
import {
  onDeactivated,
  ref,
  toRefs,
} from 'vue'
import { PopperRoot } from '@/Popper'

const props = withDefaults(defineProps<MenuProps>(), {
  open: false,
  modal: true,
  unmountOnHide: true,
})
const emits = defineEmits<MenuEmits>()
const { modal, dir: propDir, unmountOnHide } = toRefs(props)
const dir = useDirection(propDir)

const open = useVModel(props, 'open', emits)

const content = ref<HTMLElement>()
const isUsingKeyboardRef = useIsUsingKeyboard()
const contentHide = createEventHook<MenuContentHideEvent>()

// A `KeepAlive` page keeps the content teleported and open, anchored to a trigger out of the document.
onDeactivated(() => {
  if (open.value)
    open.value = false
})

provideMenuContext({
  open,
  onOpenChange: (value) => {
    open.value = value
  },
  content,
  onContentChange: (element) => {
    content.value = element
  },
  onContentHide: contentHide.on,
  contentHidden: contentHide.trigger,
})

provideMenuRootContext({
  onClose: () => {
    open.value = false
  },
  isUsingKeyboardRef,
  dir,
  modal,
  unmountOnHide,
})
</script>

<template>
  <PopperRoot scope="menu">
    <slot />
  </PopperRoot>
</template>
