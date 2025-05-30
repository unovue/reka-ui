<script lang="ts">
import type { Ref } from 'vue'
import type { MenuEmits, MenuProps } from '@/Menu'
import type { Point } from '@/Menu/utils'
import type { Direction } from '@/shared/types'
import { ref, toRefs, watch } from 'vue'
import { createContext, useDirection, useForwardExpose } from '@/shared'

type ContextMenuRootContext = {
  open: Ref<boolean>
  onOpenChange: (open: boolean) => void
  modal: Ref<boolean>
  dir: Ref<Direction>
  triggerPoint: Ref<Point>
  triggerElement: Ref<HTMLElement | undefined>
}

export interface ContextMenuRootProps extends Omit<MenuProps, 'open'> {}
export type ContextMenuRootEmits = MenuEmits

export const [injectContextMenuRootContext, provideContextMenuRootContext]
  = createContext<ContextMenuRootContext>('ContextMenuRoot')
</script>

<script setup lang="ts">
import { MenuRoot } from '@/Menu'

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
const triggerPoint = ref<Point>({ x: 0, y: 0 })

provideContextMenuRootContext({
  open,
  onOpenChange: (value: boolean) => {
    open.value = value
  },
  dir,
  modal,
  triggerPoint,
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
