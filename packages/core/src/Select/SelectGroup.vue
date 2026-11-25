<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createRekaContext, defineReactiveIds, useId } from '@/shared'

export interface SelectGroupProps extends PrimitiveProps {}

interface SelectGroupContext {
  id: string
}

export const [injectSelectGroupContext, provideSelectGroupContext]
  = createRekaContext<SelectGroupContext>('SelectGroup')
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = defineProps<SelectGroupProps>()

// The label's id, which follows a consumer `id` on the label.
const context = provideSelectGroupContext(defineReactiveIds({ id: useId(undefined, 'reka-select-group') }, ['id']))
</script>

<template>
  <Primitive
    role="group"
    v-bind="props"
    :aria-labelledby="context.id"
  >
    <slot />
  </Primitive>
</template>
