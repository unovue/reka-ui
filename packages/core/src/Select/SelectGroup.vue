<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createRekaContext, useForwardElement, useId } from '@/shared'

export interface SelectGroupProps extends PrimitiveProps {}

interface SelectGroupContext {
  id: string
}

export const [injectSelectGroupContext, provideSelectGroupContext]
  = createRekaContext<SelectGroupContext>('SelectGroup')
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { injectSelectContentContext, SelectContentDefaultContextValue } from './SelectContentImpl.vue'

const props = defineProps<SelectGroupProps>()

// A closed content's lean items render no group semantics: they are only
// there for their labels (and, in a custom element, stay in the page).
const harvest = !!injectSelectContentContext(SelectContentDefaultContextValue).harvest
// The template reads the id through the context, which follows a consumer `id` on the label.
const context = provideSelectGroupContext({ id: harvest ? '' : useId(undefined, 'reka-select-group') })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    :role="harvest ? undefined : 'group'"
    :aria-labelledby="context.id || undefined"
  >
    <slot />
  </component>
</template>
