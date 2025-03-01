<script lang="ts">
import type {
  DialogRootEmits,
  DialogRootProps,
} from '@/Dialog'

export type AlertDialogEmits = DialogRootEmits
export interface AlertDialogProps extends Omit<DialogRootProps, 'modal'> {}
</script>

<script setup lang="ts">
import { DialogRoot } from '@/Dialog'
import { useForwardExpose, useForwardPropsEmits } from '@/shared'

const props = defineProps<AlertDialogProps>()
const emits = defineEmits<AlertDialogEmits>()

defineSlots<{
  default: (props: {
    /** Current open state */
    open: typeof forwarded.value.open
  }) => any
}>()
const forwarded = useForwardPropsEmits(props, emits)
useForwardExpose()
</script>

<template>
  <DialogRoot
    v-bind="forwarded"
    :modal="true"
  >
    <slot :open="forwarded.open" />
  </DialogRoot>
</template>
