<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectLabelProps extends PrimitiveProps {
  for?: string
}

export default {
  compatConfig: {
    MODE: 3,
  },
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectSelectGroupContext } from './SelectGroup.vue'

const props = withDefaults(defineProps<SelectLabelProps>(), {
  as: 'div',
})

const groupContext = injectSelectGroupContext({ id: '' })
</script>

<template>
  <Primitive
    v-bind="props"
    :id="groupContext.id"
  >
    <slot />
  </Primitive>
</template>
