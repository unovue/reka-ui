<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createRekaContext, useId } from '@/shared'

export interface MenuGroupProps extends PrimitiveProps {}

interface MenuGroupContext {
  id: string
}

export const [injectMenuGroupContext, provideMenuGroupContext]
  = createRekaContext<MenuGroupContext>('MenuGroup')
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = defineProps<MenuGroupProps>()

// The template reads the id through the context, which follows a consumer `id` on the label.
const context = provideMenuGroupContext({ id: useId(undefined, 'reka-menu-group') })
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
