<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardElement, useId } from '@/shared'

export interface SelectGroupProps extends PrimitiveProps {}

interface SelectGroupContext {
  id: string
}

export const [injectSelectGroupContext, provideSelectGroupContext]
  = createContext<SelectGroupContext>('SelectGroup')
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectSelectContentContext, SelectContentDefaultContextValue } from './SelectContentImpl.vue'

const props = defineProps<SelectGroupProps>()

// A closed content's lean items render no group semantics: they are only
// there for their labels (and, in a custom element, stay in the page).
const harvest = !!injectSelectContentContext(SelectContentDefaultContextValue).harvest
const id = harvest ? '' : useId(undefined, 'reka-select-group')
provideSelectGroupContext({ id })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    :role="harvest ? undefined : 'group'"
    :aria-labelledby="id || undefined"
  >
    <slot />
  </component>
</template>
