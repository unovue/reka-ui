<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useForwardExpose } from '@/shared'

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
import { PopperRoot } from '@/Popper'
import { useHoverCard } from './useHoverCard'

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

useForwardExpose()

// Controlled/uncontrolled `open`, the `beforeUpdate:` / `update:` emits and the
// `openDelay` / `closeDelay` timers all live in the composable (`open ===
// undefined` → uncontrolled). The delays and `enableTouch` are handed in as
// getters so a prop change is picked up by the next timer / tap.
const { open, context } = useHoverCard({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  openDelay: () => props.openDelay,
  closeDelay: () => props.closeDelay,
  enableTouch: () => props.enableTouch,
  emit,
})

provideHoverCardRootContext(context)
</script>

<template>
  <PopperRoot>
    <slot :open="open" />
  </PopperRoot>
</template>
