<script lang="ts">
import type { Ref } from 'vue'
import { createContext, useId } from '@/shared'

export interface MenubarMenuProps {
  /**
   * A unique value that associates the item with an active value when the navigation menu is controlled.
   *
   * This prop is managed automatically when uncontrolled.
   */
  value?: string
}

export type MenubarMenuContext = {
  value: string
  triggerId: string
  triggerElement: Ref<HTMLElement | undefined>
  contentId: string
  wasKeyboardTriggerOpenRef: Ref<boolean>
}

export const [injectMenubarMenuContext, provideMenubarMenuContext]
  = createContext<MenubarMenuContext>('MenubarMenu')
</script>

<script setup lang="ts">
import { provideMenuContext, provideMenuRootContext } from '@/Menu/MenuRoot.vue'
import { PopperRoot } from '@/Popper'
import { injectMenubarRootContext } from './MenubarRoot.vue'
import { useMenubarMenu } from './useMenubar'

const props = defineProps<MenubarMenuProps>()

const value = useId(props.value)
const rootContext = injectMenubarRootContext()

// `useMenubarMenu` composes `useMenuRoot` with `open` derived from the menubar
// model; the Menu's close requests go back to the menubar with their reason.
// The SSR-stable ids stay in the shell.
const { context, menuContext, menuRootContext } = useMenubarMenu(rootContext, {
  value,
  contentId: useId(undefined, 'reka-menubar-content'),
})

provideMenuContext(menuContext)
provideMenuRootContext(menuRootContext)
provideMenubarMenuContext(context)
</script>

<template>
  <PopperRoot>
    <slot />
  </PopperRoot>
</template>
