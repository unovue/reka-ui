<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface AspectRatioProps extends PrimitiveProps {
  /**
   * The desired ratio. Eg: 16/9
   * @defaultValue 1
   */
  ratio?: number
}
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useAspectRatio } from './useAspectRatio'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<AspectRatioProps>(), {
  ratio: 1,
})
defineSlots<{
  default?: (props: {
    /** Current aspect ratio (in %) */
    aspect: typeof aspect.value
  }) => any
}>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const { aspect, wrapper, root } = useAspectRatio({ ratio: () => props.ratio })
</script>

<template>
  <div v-bind="wrapper.attrs.value">
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      v-bind="mergeProps(root.attrs.value, $attrs)"
    >
      <slot :aspect="aspect" />
    </component>
  </div>
</template>
