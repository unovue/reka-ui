<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerTitleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { getDrawerTitleSurface } from './useDrawer'

const props = withDefaults(defineProps<DrawerTitleProps>(), { as: 'h2' })
const rootContext = injectDrawerRootContext()
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const title = getDrawerTitleSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="title.attrs.value"
  >
    <slot />
  </Primitive>
</template>
