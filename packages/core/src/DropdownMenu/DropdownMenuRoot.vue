<script lang="ts">
import type { Ref } from 'vue'
import type { Direction } from '../shared/types'
import type { MenuEmits, MenuOpenChangeReason, MenuProps } from '@/Menu'
import type { BaseChangeReason } from '@/shared'
import { createContext, useControllableState, useDirection, useForwardExpose } from '@/shared'

export interface DropdownMenuRootProps extends MenuProps {
  /** The open state of the dropdown menu when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
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

<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { MenuRoot } from '@/Menu'

const props = withDefaults(defineProps<DropdownMenuRootProps>(), {
  modal: true,
  open: undefined,
})
const emit = defineEmits<DropdownMenuRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

useForwardExpose()
// Owns the model so `beforeUpdate:open` can cancel: the trigger opens it and
// the controlled `MenuRoot` below reports closes with their reason; both paths
// go through one `setState`.
const { state: open, setState } = useControllableState<boolean, MenuOpenChangeReason>({
  prop: () => props.open,
  defaultValue: props.defaultOpen ?? false,
  name: 'open',
  emit,
})

const triggerElement = ref<HTMLElement>()

const { modal, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
provideDropdownMenuRootContext({
  open,
  onOpenChange: (value, reason = 'trigger-press', event) => {
    setState(value, reason, event)
  },
  onOpenToggle: (reason = 'trigger-press', event) => {
    setState(!open.value, reason, event)
  },
  triggerId: '',
  triggerElement,
  contentId: '',
  modal,
  dir,
})
</script>

<template>
  <MenuRoot
    :open="open"
    :dir="dir"
    :modal="modal"
    @update:open="(value, details) => setState(value, details.reason, details.event)"
  >
    <slot :open="open" />
  </MenuRoot>
</template>
