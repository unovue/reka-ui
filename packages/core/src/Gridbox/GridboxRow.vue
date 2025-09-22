<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { Primitive } from '@/Primitive'

export interface GridboxRowProps extends PrimitiveProps { }
</script>

<script setup lang="ts">
defineProps<GridboxRowProps>()
</script>

<template>
  <Primitive
    role="row"
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
