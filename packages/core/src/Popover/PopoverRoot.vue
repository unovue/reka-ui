<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PopoverHandle } from './handle'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useId } from '@/shared'

/** Why the popover's `open` state changed (#2828); the `reason` of `ChangeEventDetails`. */
export type PopoverOpenChangeReason
  = | 'trigger-press'
    | 'close-press'
    | 'escape-key'
    | 'outside-press'
    | 'focus-outside'

export interface PopoverRootProps<Payload = unknown> {
  /**
   * The open state of the popover when it is initially rendered. Use when you do not need to control its open state.
   */
  defaultOpen?: boolean
  /**
   * The controlled open state of the popover.
   */
  open?: boolean
  /**
   * The modality of the popover. When `true`, page scroll is locked, the rest of
   * the page (except the trigger) is covered by an internal backdrop that
   * closes the popover on press, and only the popover content is visible to
   * screen readers.
   *
   * @defaultValue false
   */
  modal?: boolean
  /**
   * A handle from `createPopoverHandle()` that connects detached
   * `PopoverTrigger`s rendered anywhere in the app. The popover anchors to,
   * returns focus to and exposes the `payload` of the trigger that opened it.
   */
  handle?: PopoverHandle<Payload>
  /**
   * The id of the trigger that owns the popover, for a controlled popover with
   * detached triggers. Use with `open`.
   */
  triggerId?: string | null
  /** The id of the trigger that owns a popover that starts open (with `defaultOpen` and a `handle`). */
  defaultTriggerId?: string | null
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
  /** Event handler called after the open or close animations of the content have finished. */
  'update:openComplete': [value: boolean]
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
  /** Called by the content once its open/close transitions finish; emits `update:openComplete`. */
  notifyOpenComplete?: (value: boolean) => void
}

export const [injectPopoverRootContext, providePopoverRootContext]
  = createContext<PopoverRootContext>('PopoverRoot')
</script>

<script setup lang="ts" generic="Payload = unknown">
import { PopperRoot } from '@/Popper'
import { usePopupHandleAttachment } from '@/shared/popupHandle'
import { usePopover } from './usePopover'

const props = withDefaults(defineProps<PopoverRootProps<Payload>>(), {
  defaultOpen: false,
  open: undefined,
  modal: false,
  triggerId: undefined,
  defaultTriggerId: undefined,
})
const emit = defineEmits<PopoverRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
    /** Close the popover */
    close: () => void
    /** The `payload` of the detached trigger that opened the popover */
    payload: Payload | undefined
    /** The id of the detached trigger that opened the popover */
    activeTriggerId: string | null
  }) => any
}>()

// Controlled/uncontrolled `open` + the `beforeUpdate:` / `update:` emits live in
// the composable's `useControllableState` (`open === undefined` → uncontrolled).
// `useId` (ConfigProvider/SSR-aware) stays in the shell: the trigger/content ids
// derive from this base inside the composable.
const { open, onOpenChange, context, payload, activeTriggerId, handleStore } = usePopover<Payload>({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  modal: () => props.modal,
  baseId: useId(undefined, 'reka-popover'),
  emit,
  onOpenComplete: value => emit('update:openComplete', value),
  handle: () => props.handle,
  triggerId: () => props.triggerId,
  defaultTriggerId: props.defaultTriggerId,
})

providePopoverRootContext(context)
// Client-only: the Root's state reaches a (possibly module-scope) handle only once mounted.
usePopupHandleAttachment(handleStore)
</script>

<template>
  <PopperRoot :reference="handleStore.handle.value ? handleStore.anchor.value : undefined">
    <slot
      :open="open"
      :close="() => onOpenChange(false)"
      :payload="payload"
      :active-trigger-id="activeTriggerId"
    />
  </PopperRoot>
</template>
