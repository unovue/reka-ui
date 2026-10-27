<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface SwitchThumbProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectSwitchRootContext } from './SwitchRoot.vue'
import { getSwitchThumbSurface } from './useSwitch'

withDefaults(defineProps<SwitchThumbProps>(), { as: 'span' })

const rootContext = injectSwitchRootContext()
// Same derivation as `useSwitch().thumb` — one source for `data-state` / `data-disabled`.
const thumb = getSwitchThumbSurface(rootContext)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    v-bind="thumb.attrs.value"
    :as-child="asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
