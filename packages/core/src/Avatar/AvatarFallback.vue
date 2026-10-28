<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface AvatarFallbackProps extends PrimitiveProps {
  /** Useful for delaying rendering so it only appears for those with slower connections. Unset or `0` renders it immediately. */
  delayMs?: number
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
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
  <component
    :is="renderAs(as, asChild)"
    v-if="visible"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
