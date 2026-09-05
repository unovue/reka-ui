<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useId } from '@/shared'

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
import { PopperRoot } from '@/Popper'
import { usePopover } from './usePopover'

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

// Controlled/uncontrolled `open` + the `beforeUpdate:` / `update:` emits live in
// the composable's `useControllableState` (`open === undefined` → uncontrolled).
// `useId` (ConfigProvider/SSR-aware) stays in the shell: the trigger/content ids
// derive from this base inside the composable.
const { open, onOpenChange, context } = usePopover({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  modal: () => props.modal,
  baseId: useId(undefined, 'reka-popover'),
  emit,
})

providePopoverRootContext(context)
</script>

<template>
  <PopperRoot>
    <slot
      :open="open"
      :close="() => onOpenChange(false)"
    />
  </PopperRoot>
</template>
