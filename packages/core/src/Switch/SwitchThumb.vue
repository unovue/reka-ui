<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

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

useForwardExpose()
</script>

<template>
  <Primitive
    v-bind="thumb.attrs.value"
    :as-child="asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
