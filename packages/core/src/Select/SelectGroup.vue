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

const props = defineProps<SelectGroupProps>()

const id = useId(undefined, 'reka-select-group')
provideSelectGroupContext({ id })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :ref="forwardRef"
    role="group"
    :aria-labelledby="id"
  >
    <slot />
  </component>
</template>
