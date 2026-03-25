<script lang="ts">
import type { Ref } from 'vue'
import { createContext, useForwardExpose } from '@/shared'

export interface HoverCardRootProps {
  /** The open state of the hover card when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /** The controlled open state of the hover card. Can be binded as `v-model:open`. */
  open?: boolean
  /** The duration from when the mouse enters the trigger until the hover card opens. */
  openDelay?: number
  /** The duration from when the mouse leaves the trigger or content until the hover card closes. */
  closeDelay?: number
  /**
   * Whether to close the hover card when a scrollable ancestor is scrolled.
   * @defaultValue true
   */
  closeOnAncestorScroll?: boolean
}
export type HoverCardRootEmits = {
  /** Event handler called when the open state of the hover card changes. */
  'update:open': [value: boolean]
}

export interface HoverCardRootContext {
  open: Ref<boolean>
  onOpenChange: (open: boolean) => void
  onOpen: () => void
  onClose: () => void
  onDismiss: () => void
  hasSelectionRef: Ref<boolean>
  isPointerDownOnContentRef: Ref<boolean>
  isPointerInTransitRef: Ref<boolean>
  triggerElement: Ref<HTMLElement | undefined>
}

export const [injectHoverCardRootContext, provideHoverCardRootContext]
  = createContext<HoverCardRootContext>('HoverCardRoot')
</script>

<script setup lang="ts">
import { getOverflowAncestors } from '@floating-ui/dom'
import { useVModel } from '@vueuse/core'
import { onUnmounted, ref, toRefs, watch } from 'vue'
import { PopperRoot } from '@/Popper'

const props = withDefaults(defineProps<HoverCardRootProps>(), {
  defaultOpen: false,
  open: undefined,
  openDelay: 700,
  closeDelay: 300,
  closeOnAncestorScroll: true,
})
const emit = defineEmits<HoverCardRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

const { openDelay, closeDelay } = toRefs(props)

useForwardExpose()
const open = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const openTimerRef = ref(0)
const closeTimerRef = ref(0)
const hasSelectionRef = ref(false)
const isPointerDownOnContentRef = ref(false)
const isPointerInTransitRef = ref(false)
const triggerElement = ref<HTMLElement>()

function handleOpen() {
  clearTimeout(closeTimerRef.value)
  openTimerRef.value = window.setTimeout(() => open.value = true, openDelay.value)
}

function handleClose() {
  clearTimeout(openTimerRef.value)
  if (!hasSelectionRef.value && !isPointerDownOnContentRef.value)
    closeTimerRef.value = window.setTimeout(() => open.value = false, closeDelay.value)
}

function handleDismiss() {
  open.value = false
}

let scrollAncestors: (Element | Window | VisualViewport)[] = []

function removeScrollListeners() {
  scrollAncestors.forEach(a => a.removeEventListener('scroll', handleAncestorScroll))
  scrollAncestors = []
}

function handleAncestorScroll() {
  clearTimeout(openTimerRef.value)
  clearTimeout(closeTimerRef.value)
  handleDismiss()
}

watch([triggerElement, () => props.closeOnAncestorScroll], ([el, closeOnScroll]) => {
  removeScrollListeners()
  if (!el || !closeOnScroll)
    return
  scrollAncestors = getOverflowAncestors(el as HTMLElement)
  scrollAncestors.forEach(a => a.addEventListener('scroll', handleAncestorScroll, { passive: true }))
})

onUnmounted(removeScrollListeners)

provideHoverCardRootContext({
  open,
  onOpenChange(value) {
    open.value = value
  },
  onOpen: handleOpen,
  onClose: handleClose,
  onDismiss: handleDismiss,
  hasSelectionRef,
  isPointerDownOnContentRef,
  isPointerInTransitRef,
  triggerElement,
})
</script>

<template>
  <PopperRoot>
    <slot :open="open" />
  </PopperRoot>
</template>
