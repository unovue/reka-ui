<script lang="ts">
import type { Ref } from 'vue'
import type { MenuContext } from './MenuRoot.vue'
import type { MenuOpenChangeReason } from './useMenu'
import type { ChangeEventDetails } from '@/shared'
import { createContext } from '@/shared'

export interface MenuSubContext {
  contentId: string
  triggerId: string
  trigger: Ref<HTMLElement | undefined>
  onTriggerChange: (trigger: HTMLElement | undefined) => void
  parentMenuContext?: MenuContext
}

export const [injectMenuSubContext, provideMenuSubContext]
  = createContext<MenuSubContext>('MenuSub')

export interface MenuSubProps {
  /** The controlled open state of the menu. Can be used as `v-model:open`. */
  open?: boolean
}

export type MenuSubEmits = {
  /** Called before the open state of the submenu changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:open': [payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason>]
  /** Event handler called when the open state of the submenu changes. */
  'update:open': [payload: boolean, details: ChangeEventDetails<MenuOpenChangeReason>]
}
</script>

<script setup lang="ts">
import {
  ref,
  watch,
} from 'vue'
import { PopperRoot } from '@/Popper'
import { useControllableState } from '@/shared'
import { injectMenuContext, provideMenuContext } from './MenuRoot.vue'

const props = withDefaults(defineProps<MenuSubProps>(), {
  open: undefined,
})
const emits = defineEmits<MenuSubEmits>()

const { state: open, setState } = useControllableState<boolean, MenuOpenChangeReason>({
  prop: () => props.open,
  defaultValue: false,
  name: 'open',
  emit: emits,
})

const parentMenuContext = injectMenuContext()
const trigger = ref<HTMLElement>()
const content = ref<HTMLElement>()

// Prevent the parent menu from reopening with open submenus. A getter-source
// `watch` (not `watchEffect`): `setState` reads the sub's own `open` for its
// equality check, which must not become a dependency of this effect.
watch(() => parentMenuContext?.open.value, (parentOpen, _, onCleanup) => {
  if (parentOpen === false)
    setState(false)
  onCleanup(() => setState(false))
}, { immediate: true })

provideMenuContext({
  open,
  onOpenChange: (value, reason, event) => {
    setState(value, reason, event)
  },
  content,
  onContentChange: (element) => {
    content.value = element
  },
})

provideMenuSubContext({
  triggerId: '',
  contentId: '',
  trigger,
  onTriggerChange: (element) => {
    trigger.value = element
  },
})
</script>

<template>
  <PopperRoot>
    <slot />
  </PopperRoot>
</template>
