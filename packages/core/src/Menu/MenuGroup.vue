<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createRekaContext, useForwardElement, useId } from '@/shared'

export interface MenuGroupProps extends PrimitiveProps {}

interface MenuGroupContext {
  id: string
}

export const [injectMenuGroupContext, provideMenuGroupContext]
  = createRekaContext<MenuGroupContext>('MenuGroup')
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'

defineProps<MenuGroupProps>()

// The template reads the id through the context, which follows a consumer `id` on the label.
const context = provideMenuGroupContext({ id: useId(undefined, 'reka-menu-group') })

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    role="group"
    :aria-labelledby="context.id"
  >
    <slot />
  </component>
</template>
