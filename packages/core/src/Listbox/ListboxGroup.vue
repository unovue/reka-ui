<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useId } from '@/shared'

export interface ListboxGroupProps extends PrimitiveProps {}

interface ListboxGroupContext {
  id: string
}

export const [injectListboxGroupContext, provideListboxGroupContext]
  = createContext<ListboxGroupContext>('ListboxGroup')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectListboxRootContext } from './ListboxRoot.vue'

const props = defineProps<ListboxGroupProps>()

const id = useId(undefined, 'reka-listbox-group')
provideListboxGroupContext({ id })

const rootContext = injectListboxRootContext(null)
// Hidden (not unmounted, so its items stay registered) while a filter leaves none of its items.
const isFilteredOut = computed(() => rootContext?.isGroupFilteredOut(id) ?? false)
</script>

<template>
  <Primitive
    role="group"
    v-bind="props"
    :aria-labelledby="id"
    :hidden="isFilteredOut || undefined"
  >
    <slot />
  </Primitive>
</template>
