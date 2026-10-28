<script lang="ts">
import type { Ref } from 'vue'
import type { ImageLoadingStatus } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardElement } from '@/shared'

export interface AvatarRootProps extends PrimitiveProps {}

export type AvatarRootContext = {
  imageLoadingStatus: Ref<ImageLoadingStatus>
}

export const [injectAvatarRootContext, provideAvatarRootContext]
  = createContext<AvatarRootContext>('AvatarRoot')
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useAvatar } from './useAvatar'

withDefaults(defineProps<AvatarRootProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

provideAvatarRootContext(useAvatar().context)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
