<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createRekaContext, defineReactiveIds, useId } from '@/shared'

export interface ListboxGroupProps extends PrimitiveProps {}

interface ListboxGroupContext {
  id: string
}

export const [injectListboxGroupContext, provideListboxGroupContext]
  = createRekaContext<ListboxGroupContext>('ListboxGroup')
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = defineProps<ListboxGroupProps>()

// The label's id, which follows a consumer `id` on the label.
const context = provideListboxGroupContext(defineReactiveIds({ id: useId(undefined, 'reka-listbox-group') }, ['id']))
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
