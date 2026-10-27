<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerHandleProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { disclosureState, useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'

const props = withDefaults(defineProps<DrawerHandleProps>(), { as: 'div' })
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectDrawerRootContext()
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="props"
    aria-hidden="true"
    :data-state="disclosureState(rootContext.open.value)"
  >
    <slot />
  </Primitive>
</template>
