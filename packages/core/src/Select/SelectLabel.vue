<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectLabelProps extends PrimitiveProps {
  for?: string
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { claimReferencedId } from '@/shared'
import { injectSelectGroupContext } from './SelectGroup.vue'

const props = withDefaults(defineProps<SelectLabelProps>(), {
  as: 'div',
})

const groupContext = injectSelectGroupContext({ id: '' })
claimReferencedId(groupContext, 'id')
</script>

<template>
  <Primitive
    v-bind="props"
    :id="groupContext.id"
  >
    <slot />
  </Primitive>
</template>
