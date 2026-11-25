<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createRekaContext, useId } from '@/shared'

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

// The template reads the id through the context, which follows a consumer `id` on the label.
const context = provideSelectGroupContext({ id: useId(undefined, 'reka-select-group') })
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
