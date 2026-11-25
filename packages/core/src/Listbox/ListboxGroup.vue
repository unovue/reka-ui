<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createRekaContext, useId } from '@/shared'

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

// The template reads the id through the context, which follows a consumer `id` on the label.
const context = provideListboxGroupContext({ id: useId(undefined, 'reka-listbox-group') })
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
