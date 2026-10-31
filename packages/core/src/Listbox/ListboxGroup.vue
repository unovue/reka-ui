<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardElement, useId } from '@/shared'

export interface ListboxGroupProps extends PrimitiveProps {}

interface ListboxGroupContext {
  id: string
}

export const [injectListboxGroupContext, provideListboxGroupContext]
  = createContext<ListboxGroupContext>('ListboxGroup')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { injectListboxRootContext } from './ListboxRoot.vue'

defineProps<ListboxGroupProps>()

const id = useId(undefined, 'reka-listbox-group')
provideListboxGroupContext({ id })

const rootContext = injectListboxRootContext(null)
// Hidden (not unmounted, so its items stay registered) while a filter leaves none of its items.
const isFilteredOut = computed(() => rootContext?.isGroupFilteredOut(id) ?? false)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    role="group"
    :aria-labelledby="id"
    :hidden="isFilteredOut || undefined"
  >
    <slot />
  </component>
</template>
