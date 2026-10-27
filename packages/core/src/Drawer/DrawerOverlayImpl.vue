<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerOverlayImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Primitive } from '@/Primitive'
import { disclosureState, useForwardElement } from '@/shared'
import { injectDrawerRootContext } from './DrawerRoot.vue'
import { DRAWER_CSS_VARS } from './utils'

defineProps<DrawerOverlayImplProps>()
const rootContext = injectDrawerRootContext()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

// BaseUI parity: a press on the backdrop dismisses a modal drawer, a press on
// anything stacked above it does not (#2822). The page scroll lock follows
// `modal` and lives in `DrawerContent`.
watch([currentElement, () => rootContext.open.value], ([element, open], _, onCleanup) => {
  if (!element || !open)
    return
  rootContext.overlayElement.value = element
  onCleanup(() => {
    if (rootContext.overlayElement.value === element)
      rootContext.overlayElement.value = undefined
  })
}, { immediate: true })

// BaseUI parity: the backdrop carries data-swiping / data-swipe-direction so
// downstream CSS can target `[data-swiping] [data-slot="drawer-backdrop"]`.
const dataAttributes = computed(() => {
  const attrs: Record<string, string | undefined> = {
    'data-state': disclosureState(rootContext.open.value),
    'data-swipe-direction': rootContext.swipeDirection.value,
  }
  if (rootContext.isSwiping.value)
    attrs['data-swiping'] = ''
  return attrs
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="dataAttributes"
    :style="{
      userSelect: 'none',
      [DRAWER_CSS_VARS.swipeProgress]: '0',
      [DRAWER_CSS_VARS.swipeStrength]: '1',
    }"
  >
    <slot />
  </Primitive>
</template>
