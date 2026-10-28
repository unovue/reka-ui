<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardElement, useId } from '@/shared'

export interface MenuGroupProps extends PrimitiveProps {}

interface MenuGroupContext {
  id: string
}

export const [injectMenuGroupContext, provideMenuGroupContext]
  = createContext<MenuGroupContext>('MenuGroup')
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'

defineProps<MenuGroupProps>()

const id = useId(undefined, 'reka-menu-group')
provideMenuGroupContext({ id })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    role="group"
    :aria-labelledby="id"
  >
    <slot />
  </component>
</template>
