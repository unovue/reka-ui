<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useControllableState } from '@/shared'

/** Why the popover's `open` state changed (#2828); the `reason` of `ChangeEventDetails`. */
export type PopoverOpenChangeReason
  = | 'trigger-press'
    | 'close-press'
    | 'escape-key'
    | 'outside-press'
    | 'focus-outside'

export interface PopoverRootProps {
  /**
   * The open state of the popover when it is initially rendered. Use when you do not need to control its open state.
   */
  defaultOpen?: boolean
  /**
   * The controlled open state of the popover.
   */
  open?: boolean
  /**
   * The modality of the popover. When set to true, interaction with outside elements will be disabled and only popover content will be visible to screen readers.
   *
   * @defaultValue false
   */
  modal?: boolean
}
export type PopoverRootEmits = {
  /**
   * Event handler called before the open state of the popover changes; `details.cancel()` keeps the current state.
   */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason>]
  /**
   * Event handler called when the open state of the popover changes.
   */
  'update:open': [value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason>]
}

export interface PopoverRootContext {
  triggerElement: Ref<HTMLElement | undefined>
  triggerId: string
  contentId: string
  open: ComputedRef<boolean>
  modal: Ref<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: PopoverOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenToggle: (reason?: PopoverOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  hasCustomAnchor: Ref<boolean>
}

export const [injectPopoverRootContext, providePopoverRootContext]
  = createContext<PopoverRootContext>('PopoverRoot')
</script>

<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { PopperRoot } from '@/Popper'

const props = withDefaults(defineProps<PopoverRootProps>(), {
  defaultOpen: false,
  open: undefined,
  modal: false,
})
const emit = defineEmits<PopoverRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
    /** Close the popover */
    close: () => void
  }) => any
}>()

const { modal } = toRefs(props)

// Every write to `open` — trigger, close button, dismiss, slot `close` — goes
// through one `setState`, so `beforeUpdate:open` can cancel any of them and
// `update:open` always carries the reason (#2828).
const { state: open, setState } = useControllableState<boolean, PopoverOpenChangeReason>({
  prop: () => props.open,
  defaultValue: props.defaultOpen,
  name: 'open',
  emit,
})

const triggerElement = ref<HTMLElement>()
const hasCustomAnchor = ref(false)

providePopoverRootContext({
  contentId: '',
  triggerId: '',
  modal,
  open,
  onOpenChange: (value, reason, event) => setState(value, reason, event),
  onOpenToggle: (reason, event) => setState(!open.value, reason, event),
  triggerElement,
  hasCustomAnchor,
})
</script>

<template>
  <PopperRoot>
    <slot
      :open="open"
      :close="() => setState(false)"
    />
  </PopperRoot>
</template>
