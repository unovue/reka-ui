<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { createRekaContext, defineReactiveIds, useId } from '@/shared'

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

// The label's id, which follows a consumer `id` on the label.
const context = provideMenuGroupContext(defineReactiveIds({ id: useId(undefined, 'reka-menu-group') }, ['id']))
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
