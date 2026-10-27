<script lang="ts">
import type { AlertDialogHandle } from './handle'
import type { DialogTriggerProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogTriggerProps<Payload = unknown> extends Omit<DialogTriggerProps<Payload>, 'handle'> {
  /**
   * A handle from `createAlertDialogHandle()` that connects this trigger to an
   * `AlertDialogRoot` rendered elsewhere (outside this trigger's tree or portal).
   */
  handle?: AlertDialogHandle<Payload>
}
</script>

<script setup lang="ts" generic="Payload = unknown">
import { DialogTrigger } from '@/Dialog'

const props = withDefaults(defineProps<AlertDialogTriggerProps<Payload>>(), { as: 'button' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <DialogTrigger
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </DialogTrigger>
</template>
