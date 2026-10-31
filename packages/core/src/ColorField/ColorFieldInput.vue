<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorFieldInputProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
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
  <component
    :is="renderAsEmpty(as, asChild)"
    :ref="forwardRef"
    v-bind="input.attrs.value"
  >
    <template
      v-if="rendersChildren(as, asChild)"
      #default
    >
      <slot />
    </template>
  </component>
</template>
