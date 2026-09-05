<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import { createContext, useId } from '@/shared'

/** Why the dialog's `open` state changed (#2828); the `reason` of `ChangeEventDetails`. */
export type DialogOpenChangeReason
  = | 'trigger-press'
    | 'close-press'
    | 'escape-key'
    | 'outside-press'
    | 'focus-outside'

export interface DialogRootProps {
  /** The controlled open state of the dialog. Can be binded as `v-model:open`. */
  open?: boolean
  /** The open state of the dialog when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /**
   * The modality of the dialog When set to `true`, <br>
   * interaction with outside elements will be disabled and only dialog content will be visible to screen readers.
   */
  modal?: boolean
  /**
   * When set to `false`, the dialog content will not be unmounted when closed, but instead hidden with CSS. <br>
   * Useful for SEO or when you want to improve performance by not remounting the component on every open.
   * @defaultValue true
   */
  unmountOnHide?: boolean
}

export type DialogRootEmits = {
  /** Called before the open state changes; `details.cancel()` keeps the current state. */
  'beforeUpdate:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>]
  /** Event handler called when the open state of the dialog changes. */
  'update:open': [value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>]
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
}

export const [injectDialogRootContext, provideDialogRootContext]
  = createContext<DialogRootContext>('DialogRoot')
</script>

<script setup lang="ts">
import { useDialog } from './useDialog'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DialogRootProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
  unmountOnHide: true,
})
const emit = defineEmits<DialogRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: boolean
    /** Close the dialog */
    close: () => void
  }) => any
}>()

// The composable owns the controlled/uncontrolled `open` model (every open/close
// path goes through its `setState` so `beforeUpdate:open` can cancel it) and
// builds the context; `useId` (SSR-stable) stays in the shell and seeds the
// content/title/description ids.
const { open, onOpenChange, context } = useDialog({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  modal: () => props.modal,
  unmountOnHide: () => props.unmountOnHide,
  baseId: useId(undefined, 'reka-dialog'),
  emit,
})

provideDialogRootContext(context)
</script>

<template>
  <slot
    :open="open"
    :close="() => onOpenChange(false)"
  />
</template>
