<script lang="ts">
import type { DialogTitleProps } from '@/Dialog'
import { useForwardExpose } from '@/shared'

export interface AlertDialogTitleProps extends DialogTitleProps {}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { DialogTitle } from '@/Dialog'

const props = withDefaults(defineProps<AlertDialogTitleProps>(), { as: 'h2' })
useForwardExpose()
</script>

<template>
  <DialogTitle v-bind="props">
    <slot />
  </DialogTitle>
</template>
