<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarHeaderProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<RangeCalendarHeaderProps>(), { as: 'div' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="props"
  >
    <slot />
  </Primitive>
</template>
