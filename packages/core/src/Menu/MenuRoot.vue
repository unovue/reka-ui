<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { MenuOpenChangeReason } from './useMenu'
import type { Direction } from './utils'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createRekaContext, useDirection } from '@/shared'

export interface MenuContext {
  open: ComputedRef<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (open: boolean, reason?: MenuOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  content: Ref<HTMLElement | undefined>
  onContentChange: (content: HTMLElement | undefined) => void
  /** Called by the content once its open/close transitions finish; emits `update:openComplete`. */
  notifyOpenComplete?: (value: boolean) => void
  /**
   * Internal: registers a handler for when a content kept mounted while closed
   * (`unmountOnHide: false`) is hidden, which no unmount reports.
   */
  onContentHide: (handler: (event: MenuContentHideEvent) => void) => void
  /** Internal: called by the content when it is hidden while kept mounted. */
  contentHidden: (event: MenuContentHideEvent) => void
}

export interface MenuContentHideEvent {
  /** The content element that was hidden. */
  container: HTMLElement | undefined
  /**
   * Whether focus moved on to an element outside this menu and its submenus. Focus that was
   * merely dropped (on `body`) has not moved on.
   */
  focusLeft: boolean
  /** The element that had focus before the content was shown, which an unmount would focus back. */
  focusedBeforeShow: HTMLElement | null
}

export interface MenuRootContext {
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onClose: (reason?: MenuOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  dir: Ref<Direction>
  isUsingKeyboardRef: Ref<boolean>
  modal: Ref<boolean>
  /** When `false`, the content and its submenus stay mounted while closed, hidden with CSS. */
  unmountOnHide: Ref<boolean>
  /** Internal: the mounted content elements of this menu and its submenus. */
  contentElements?: Set<HTMLElement>
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
   * When `true`, page scroll is locked, the rest of the page (except the
   * trigger) is covered by an internal backdrop that closes the menu on press,
   * and only the menu content is visible to screen readers.
   * @defaultValue true
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
  /** Called before the open state changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:open': [payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason>]
  /** Event handler called when the open state of the menu changes. */
  'update:open': [payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason>]
  /** Event handler called after the open or close animations of the content have finished. */
  'update:openComplete': [value: boolean]
}

export const [injectMenuContext, provideMenuContext]
  = createRekaContext<MenuContext>(['MenuRoot', 'MenuSub'], 'MenuContext')

export const [injectMenuRootContext, provideMenuRootContext]
  = createRekaContext<MenuRootContext>('MenuRoot')
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { PopperRoot } from '@/Popper'
import { useMenuRoot } from './useMenu'

const props = withDefaults(defineProps<MenuProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
  unmountOnHide: true,
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
  unmountOnHide: () => props.unmountOnHide,
  emit: emits,
  onOpenComplete: value => emits('update:openComplete', value),
})

provideMenuContext(menuContext)
provideMenuRootContext(menuRootContext)
</script>

<template>
  <PopperRoot scope="menu">
    <slot />
  </PopperRoot>
</template>
