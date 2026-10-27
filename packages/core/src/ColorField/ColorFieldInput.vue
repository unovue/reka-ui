<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorFieldInputProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectColorFieldRootContext } from './ColorFieldRoot.vue'
import { createColorFieldInputSurface } from './useColorField'

const props = withDefaults(defineProps<ColorFieldInputProps>(), {
  as: 'input',
})

const input = createColorFieldInputSurface(injectColorFieldRootContext())

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    v-bind="input.attrs.value"
  >
    <slot />
  </Primitive>
</template>
