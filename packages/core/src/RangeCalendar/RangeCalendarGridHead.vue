<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarGridHeadProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'

const props = withDefaults(defineProps<RangeCalendarGridHeadProps>(), { as: 'thead' })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="props"
    aria-hidden="true"
  >
    <slot />
  </Primitive>
</template>
