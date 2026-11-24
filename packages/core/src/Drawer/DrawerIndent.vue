<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface DrawerIndentProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDrawerProviderContext } from './DrawerProvider.vue'
import { DRAWER_CSS_VARS } from './utils'

const props = withDefaults(defineProps<DrawerIndentProps>(), { as: 'div' })
const { forwardRef, currentElement } = useForwardExpose()
const providerContext = injectDrawerProviderContext(null)

let unsubscribe: (() => void) | undefined

onMounted(() => {
  const store = providerContext?.visualStateStore
  if (!store)
    return
  const el = currentElement.value
  if (!el)
    return

  const sync = () => {
    const { swipeProgress, frontmostHeight } = store.getSnapshot()
    el.style.setProperty(DRAWER_CSS_VARS.swipeProgress, swipeProgress > 0 ? `${swipeProgress}` : '0')
    if (frontmostHeight > 0)
      el.style.setProperty(DRAWER_CSS_VARS.height, `${frontmostHeight}px`)
    else
      el.style.removeProperty(DRAWER_CSS_VARS.height)
  }

  sync()
  unsubscribe = store.subscribe(sync)
})

onUnmounted(() => {
  unsubscribe?.()
  const el = currentElement.value
  if (el) {
    el.style.setProperty(DRAWER_CSS_VARS.swipeProgress, '0')
    el.style.removeProperty(DRAWER_CSS_VARS.height)
  }
})
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    :data-active="providerContext?.active.value ? '' : undefined"
    :data-inactive="providerContext?.active.value === false ? '' : undefined"
    :style="{ [DRAWER_CSS_VARS.swipeProgress]: '0' }"
  >
    <slot />
  </Primitive>
</template>
