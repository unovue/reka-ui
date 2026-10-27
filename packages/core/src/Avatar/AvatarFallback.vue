<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface AvatarFallbackProps extends PrimitiveProps {
  /** Useful for delaying rendering so it only appears for those with slower connections. */
  delayMs?: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectAvatarRootContext } from './AvatarRoot.vue'
import { useAvatarFallback } from './useAvatar'

const props = withDefaults(defineProps<AvatarFallbackProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const { visible } = useAvatarFallback(injectAvatarRootContext(), { delayMs: () => props.delayMs })
</script>

<template>
  <Primitive
    v-if="visible"
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
  >
    <slot />
  </Primitive>
</template>
