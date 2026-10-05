<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorFieldInputProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectColorFieldRootContext } from './ColorFieldRoot.vue'
import { createColorFieldInputSurface } from './useColorField'

const props = withDefaults(defineProps<ColorFieldInputProps>(), {
  as: 'input',
})

const input = createColorFieldInputSurface(injectColorFieldRootContext())
</script>

<template>
  <Primitive
    :as-child="asChild"
    :as="as"
    v-bind="input.attrs.value"
  >
    <slot />
  </Primitive>
</template>
