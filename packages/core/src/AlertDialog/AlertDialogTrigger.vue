<script lang="ts">
import type { DialogTriggerProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogTriggerProps<Payload = unknown> extends DialogTriggerProps<Payload> {}
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
