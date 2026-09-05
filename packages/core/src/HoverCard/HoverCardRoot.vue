<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useControllableState, useForwardExpose } from '@/shared'

/** Why the hover card's `open` state changed (#2828); the `reason` of `ChangeEventDetails`. */
export type HoverCardOpenChangeReason
  = | 'trigger-hover'
    | 'trigger-leave'
    | 'trigger-focus'
    | 'trigger-blur'
    | 'trigger-press'
    | 'content-hover'
    | 'content-leave'
    | 'escape-key'
    | 'outside-press'

export interface HoverCardRootProps {
  /** The open state of the hover card when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /** The controlled open state of the hover card. Can be binded as `v-model:open`. */
  open?: boolean
  /** The duration from when the mouse enters the trigger until the hover card opens. */
  openDelay?: number
  /** The duration from when the mouse leaves the trigger or content until the hover card closes. */
  closeDelay?: number
  /** When `true`, tapping the trigger on touch devices toggles the hover card open/closed. By default touch interactions are ignored to match pointer hover semantics. */
  enableTouch?: boolean
}
export type HoverCardRootEmits = {
  /** Event handler called before the open state of the hover card changes; `details.cancel()` keeps the current state. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<HoverCardOpenChangeReason>]
  /** Event handler called when the open state of the hover card changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<HoverCardOpenChangeReason>]
}

export interface HoverCardRootContext {
  open: ComputedRef<boolean>
  /** Sets `open` immediately. Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /**
   * Cancels a pending close and opens after `openDelay`. The change is deferred,
   * so its outcome is only known when the timer fires; `reason`/`event` travel
   * with it into `beforeUpdate:open` / `update:open`.
   */
  onOpen: (reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) => void
  /**
   * Cancels a pending open and closes after `closeDelay`, unless text is being
   * selected or the pointer is down on the content. Deferred like `onOpen`.
   */
  onClose: (reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) => void
  /** Cancels a pending open and closes immediately. Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onDismiss: (reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  hasSelectionRef: Ref<boolean>
  isPointerDownOnContentRef: Ref<boolean>
  isPointerInTransitRef: Ref<boolean>
  triggerElement: Ref<HTMLElement | undefined>
  enableTouch: Ref<boolean>
}

export const [injectHoverCardRootContext, provideHoverCardRootContext]
  = createContext<HoverCardRootContext>('HoverCardRoot')
</script>

<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { PopperRoot } from '@/Popper'

const props = withDefaults(defineProps<HoverCardRootProps>(), {
  defaultOpen: false,
  open: undefined,
  openDelay: 700,
  closeDelay: 300,
  enableTouch: false,
})
const emit = defineEmits<HoverCardRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

const { openDelay, closeDelay, enableTouch } = toRefs(props)

useForwardExpose()

// Every write to `open` — the delayed hover/focus timers, the touch toggle and
// dismiss — goes through one `setState`, so `beforeUpdate:open` can cancel any
// of them and `update:open` always carries the reason (#2828). The timers
// capture the reason and event of the interaction that started them.
const { state: open, setState } = useControllableState<boolean, HoverCardOpenChangeReason>({
  prop: () => props.open,
  defaultValue: props.defaultOpen,
  name: 'open',
  emit,
})

const openTimerRef = ref(0)
const closeTimerRef = ref(0)
const hasSelectionRef = ref(false)
const isPointerDownOnContentRef = ref(false)
const isPointerInTransitRef = ref(false)
const triggerElement = ref<HTMLElement>()

function handleOpen(reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) {
  clearTimeout(closeTimerRef.value)
  openTimerRef.value = window.setTimeout(setState, openDelay.value, true, reason, event)
}

function handleClose(reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) {
  clearTimeout(openTimerRef.value)
  if (!hasSelectionRef.value && !isPointerDownOnContentRef.value)
    closeTimerRef.value = window.setTimeout(setState, closeDelay.value, false, reason, event)
}

function handleDismiss(reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) {
  clearTimeout(openTimerRef.value)
  return setState(false, reason, event)
}

provideHoverCardRootContext({
  open,
  onOpenChange: (value, reason, event) => setState(value, reason, event),
  onOpen: handleOpen,
  onClose: handleClose,
  onDismiss: handleDismiss,
  hasSelectionRef,
  isPointerDownOnContentRef,
  isPointerInTransitRef,
  triggerElement,
  enableTouch,
})
</script>

<template>
  <PopperRoot>
    <slot :open="open" />
  </PopperRoot>
</template>
