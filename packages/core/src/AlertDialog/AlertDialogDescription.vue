<script lang="ts">
import type { DialogDescriptionProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogDescriptionProps extends DialogDescriptionProps {}
</script>

<script setup lang="ts">
import { DialogDescription } from '@/Dialog'

const props = withDefaults(defineProps<AlertDialogDescriptionProps>(), { as: 'p' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <DialogDescription
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </DialogDescription>
</template>
