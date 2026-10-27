<script lang="ts">
import type { DialogTitleProps } from '@/Dialog'
import { useForwardElement } from '@/shared'

export interface AlertDialogTitleProps extends DialogTitleProps {}
</script>

<script setup lang="ts">
import { DialogTitle } from '@/Dialog'

const props = withDefaults(defineProps<AlertDialogTitleProps>(), { as: 'h2' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <DialogTitle
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </DialogTitle>
</template>
