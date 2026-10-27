<script lang="ts">
import type {
  DialogRootEmits,
  DialogRootProps,
} from '@/Dialog'

export type AlertDialogEmits = DialogRootEmits
export interface AlertDialogProps extends Omit<DialogRootProps, 'modal'> {}
</script>

<script setup lang="ts">
import { provideDialogRootContext } from '@/Dialog/DialogRoot.vue'
import { useId } from '@/shared'
import { useAlertDialog } from './useAlertDialog'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<AlertDialogProps>(), {
  open: undefined,
  defaultOpen: false,
  unmountOnHide: true,
})
const emit = defineEmits<AlertDialogEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: boolean
    /** Close the dialog */
    close: () => void
  }) => any
}>()

// `useAlertDialog` composes `useDialog` (modal forced on), so the Dialog parts
// the AlertDialog parts render inject the same `DialogRootContext`.
const { open, onOpenChange, context } = useAlertDialog({
  open: () => props.open,
  defaultOpen: props.defaultOpen,
  unmountOnHide: () => props.unmountOnHide,
  baseId: useId(undefined, 'reka-alert-dialog'),
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
