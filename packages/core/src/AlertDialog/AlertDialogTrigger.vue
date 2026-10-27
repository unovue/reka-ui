<script lang="ts">
import type { DialogTriggerProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogTriggerProps extends DialogTriggerProps {}
</script>

<script setup lang="ts">
import { DialogTrigger } from '@/Dialog'

const props = withDefaults(defineProps<AlertDialogTriggerProps>(), { as: 'button' })
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
