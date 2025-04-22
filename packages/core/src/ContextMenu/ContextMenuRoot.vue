<script lang="ts">
import type { MenuEmits, MenuProps } from '@/Menu'
import type { Direction } from '@/shared/types'
import type { Ref } from 'vue'
import { createContext, useDirection, useForwardExpose } from '@/shared'

type ContextMenuRootContext = {
  open: Ref<boolean>
  onOpenChange: (open: boolean) => void
  modal: Ref<boolean>
  dir: Ref<Direction>
  triggerElement: Ref<HTMLElement | undefined>
}

export interface ContextMenuRootProps extends Omit<MenuProps, 'open'> {}
export type ContextMenuRootEmits = MenuEmits

export const [injectContextMenuRootContext, provideContextMenuRootContext]
  = createContext<ContextMenuRootContext>('ContextMenuRoot')
</script>

<script setup lang="ts">
import { MenuRoot } from '@/Menu'
import { ref, toRefs, watch } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<ContextMenuRootProps>(), {
  modal: true,
})
const emits = defineEmits<ContextMenuRootEmits>()
const { dir: propDir, modal } = toRefs(props)
useForwardExpose()
const dir = useDirection(propDir)

const open = ref(false)
const triggerElement = ref<HTMLElement>()

provideContextMenuRootContext({
  open,
  onOpenChange: (value: boolean) => {
    open.value = value
  },
  dir,
  modal,
  triggerElement,
})

watch(open, (value) => {
  emits('update:open', value)
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
