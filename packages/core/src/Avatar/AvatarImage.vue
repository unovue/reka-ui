<script lang="ts">
import type { ImageLoadingStatus } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export type AvatarImageEmits = {
  /**
   * A callback providing information about the loading status of the image. <br>
   * This is useful in case you want to control more precisely what to render as the image is loading.
   */
  loadingStatusChange: [value: ImageLoadingStatus]
}
export interface AvatarImageProps extends PrimitiveProps {
  src: string
  referrerPolicy?: ImgHTMLAttributes['referrerpolicy']
  crossOrigin?: ImgHTMLAttributes['crossorigin']
}
</script>

<script setup lang="ts">
import type { ImgHTMLAttributes } from 'vue'
import { Primitive } from '../Primitive'
import { injectAvatarRootContext } from './AvatarRoot.vue'
import { useAvatarImage } from './useAvatar'

const props = withDefaults(defineProps<AvatarImageProps>(), { as: 'img' })
const emits = defineEmits<AvatarImageEmits>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const { visible, root } = useAvatarImage(injectAvatarRootContext(), {
  src: () => props.src,
  referrerPolicy: () => props.referrerPolicy,
  crossOrigin: () => props.crossOrigin,
  onLoadingStatusChange: value => emits('loadingStatusChange', value),
})
</script>

<template>
  <Primitive
    v-show="visible"
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    v-bind="root.attrs.value"
  >
    <slot />
  </Primitive>
</template>
