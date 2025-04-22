<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface AvatarFallbackProps extends PrimitiveProps {
  /** Useful for delaying rendering so it only appears for those with slower connections. */
  delayMs?: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { ref, watch } from 'vue'
import { injectAvatarRootContext } from './AvatarRoot.vue'

const props = withDefaults(defineProps<AvatarFallbackProps>(), {
  delayMs: 0,
  as: 'span',
})

const rootContext = injectAvatarRootContext()
useForwardExpose()

const canRender = ref(false)
let timeout: ReturnType<typeof setTimeout> | undefined

watch(rootContext.imageLoadingStatus, (value) => {
  if (value === 'loading') {
    canRender.value = false
    if (props.delayMs) {
      timeout = setTimeout(() => {
        canRender.value = true
        clearTimeout(timeout)
      }, props.delayMs)
    }
    else {
      canRender.value = true
    }
  }
}, { immediate: true })
</script>

<template>
  <Primitive
    v-if="canRender && rootContext.imageLoadingStatus.value !== 'loaded'"
    :as-child="asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
