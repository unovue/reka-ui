<script lang="ts">
import type { Ref } from 'vue'
import type { MenuEmits, MenuProps } from '@/Menu'
import type { Direction } from '@/shared/types'
import { createContext, useDirection, useForwardExpose } from '@/shared'

type ContextMenuRootContext = {
  open: Ref<boolean>
  onOpenChange: (open: boolean) => void
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
import { useVModel } from '@vueuse/core'
import { ref, toRefs } from 'vue'
import { MenuRoot } from '@/Menu'

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
useForwardExpose()
const dir = useDirection(propDir)

const open = useVModel(props, 'open', emits, {
  defaultValue: false,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>
const triggerElement = ref<HTMLElement>()

provideContextMenuRootContext({
  open,
  onOpenChange: (value: boolean) => {
    open.value = value
  },
  dir,
  modal,
  triggerElement,
  pressOpenDelay,
})
</script>

<template>
  <MenuRoot
    v-model:open="open"
    :dir="dir"
    :modal="modal"
  >
    <slot />
  </MenuRoot>
</template>
