<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { DialogHandle } from './handle'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useId } from '@/shared'

/** Why the dialog's `open` state changed (#2828); the `reason` of `ChangeEventDetails`. */
export type DialogOpenChangeReason
  = | 'trigger-press'
    | 'close-press'
    | 'escape-key'
    | 'outside-press'
    | 'focus-outside'

export interface DialogRootProps<Payload = unknown> {
  /** The controlled open state of the dialog. Can be binded as `v-model:open`. */
  open?: boolean
  /** The open state of the dialog when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /**
   * The modality of the dialog. When `true`, page scroll is locked, the rest of
   * the page is covered by an internal backdrop (a press on it, or on
   * `DialogOverlay`, closes the dialog) and only the dialog content is visible
   * to screen readers.
   * @defaultValue true
   */
  modal?: boolean
  /**
   * When set to `false`, the dialog content will not be unmounted when closed, but instead hidden with CSS. <br>
   * Useful for SEO or when you want to improve performance by not remounting the component on every open.
   * @defaultValue true
   */
  unmountOnHide?: boolean
  /**
   * A handle from `createDialogHandle()` that connects detached
   * `DialogTrigger`s rendered anywhere in the app. Focus returns to, and the
   * default slot's `payload` comes from, the trigger that opened the dialog.
   */
  handle?: DialogHandle<Payload>
  /**
   * The id of the trigger that owns the dialog, for a controlled dialog with
   * detached triggers. Use with `open`.
   */
  triggerId?: string | null
  /** The id of the trigger that owns a dialog that starts open (with `defaultOpen` and a `handle`). */
  defaultTriggerId?: string | null
}

export type DialogRootEmits = {
  /** Called before the open state changes; `details.cancel()` keeps the current state. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>]
  /** Event handler called when the open state of the dialog changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>]
  /** Event handler called after the open or close animations of the content have finished. */
  'update:openComplete': [value: boolean]
}

export interface DialogRootContext {
  open: ComputedRef<boolean>
  modal: Ref<boolean>
  unmountOnHide: Ref<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  openModal: (reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenToggle: (reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  triggerElement: Ref<HTMLElement | undefined>
  contentElement: Ref<HTMLElement | undefined>
  contentId: string
  titleId: string
  descriptionId: string
  /** Called by the content once its open/close transitions finish; emits `update:openComplete`. */
  notifyOpenComplete: (value: boolean) => void
}

export const [injectDialogRootContext, provideDialogRootContext]
  = createContext<DialogRootContext>('DialogRoot')

/**
 * The mounted `DialogOverlay` element. A press on it (or on the content's
 * internal backdrop) dismisses a modal dialog; a press on anything stacked
 * above the backdrop does not (#2822). Internal, kept out of the frozen
 * `DialogRootContext` shape.
 */
export const [injectDialogOverlayElementContext, provideDialogOverlayElementContext]
  = createContext<Ref<HTMLElement | undefined>>('DialogRoot', 'DialogOverlayElementContext')
</script>

<script setup lang="ts" generic="Payload = unknown">
import { ref } from 'vue'
import { usePopupHandleAttachment } from '@/shared/popupHandle'
import { useDialog } from './useDialog'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DialogRootProps<Payload>>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
  unmountOnHide: true,
  triggerId: undefined,
  defaultTriggerId: undefined,
})
const emit = defineEmits<DialogRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: boolean
    /** Close the dialog */
    close: () => void
    /** The `payload` of the detached trigger that opened the dialog, or from `handle.openWithPayload()` */
    payload: Payload | undefined
    /** The id of the detached trigger that opened the dialog */
    activeTriggerId: string | null
  }) => any
}>()

// The composable owns the controlled/uncontrolled `open` model (every open/close
// path goes through its `setState` so `beforeUpdate:open` can cancel it) and
// builds the context; `useId` (SSR-stable) stays in the shell and seeds the
// content/title/description ids.
const { open, onOpenChange, context, payload, activeTriggerId, handleStore } = useDialog<Payload>({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  modal: () => props.modal,
  unmountOnHide: () => props.unmountOnHide,
  baseId: useId(undefined, 'reka-dialog'),
  emit,
  onOpenComplete: value => emit('update:openComplete', value),
  handle: () => props.handle,
  triggerId: () => props.triggerId,
  defaultTriggerId: props.defaultTriggerId,
})

provideDialogRootContext(context)
provideDialogOverlayElementContext(ref())
// Client-only: the Root's state reaches a (possibly module-scope) handle only once mounted.
usePopupHandleAttachment(handleStore)
</script>

<template>
  <slot
    :open="open"
    :close="() => onOpenChange(false)"
    :payload="payload"
    :active-trigger-id="activeTriggerId"
  />
</template>
