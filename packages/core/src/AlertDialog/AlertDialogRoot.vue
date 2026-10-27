<script lang="ts">
import type {
  DialogRootEmits,
  DialogRootProps,
} from '@/Dialog'

export type AlertDialogEmits = DialogRootEmits
export interface AlertDialogProps<Payload = unknown> extends Omit<DialogRootProps<Payload>, 'modal'> {}
</script>

<script setup lang="ts" generic="Payload = unknown">
import { provideDialogRootContext } from '@/Dialog/DialogRoot.vue'
import { useId } from '@/shared'
import { usePopupHandleAttachment } from '@/shared/popupHandle'
import { useAlertDialog } from './useAlertDialog'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<AlertDialogProps<Payload>>(), {
  open: undefined,
  defaultOpen: false,
  unmountOnHide: true,
  triggerId: undefined,
  defaultTriggerId: undefined,
})
const emit = defineEmits<AlertDialogEmits>()

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

// `useAlertDialog` composes `useDialog` (modal forced on), so the Dialog parts
// the AlertDialog parts render inject the same `DialogRootContext`.
const { open, onOpenChange, context, payload, activeTriggerId, handleStore } = useAlertDialog<Payload>({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  unmountOnHide: () => props.unmountOnHide,
  baseId: useId(undefined, 'reka-alert-dialog'),
  emit,
  handle: () => props.handle,
  triggerId: () => props.triggerId,
  defaultTriggerId: props.defaultTriggerId,
})

provideDialogRootContext(context)
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
