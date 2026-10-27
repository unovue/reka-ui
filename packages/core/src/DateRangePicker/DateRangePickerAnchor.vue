<script lang="ts">
import type { PopoverAnchorProps } from '..'
import { PopoverAnchor } from '..'

export interface DateRangePickerAnchorProps extends PopoverAnchorProps {}
</script>

<script setup lang="ts">
import { useForwardElement } from '@/shared'

const props = defineProps<DateRangePickerAnchorProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <PopoverAnchor
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </PopoverAnchor>
</template>
