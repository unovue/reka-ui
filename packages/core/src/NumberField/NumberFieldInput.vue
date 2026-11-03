<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onMounted } from 'vue'
import { useForwardElement } from '@/shared'
import { injectNumberFieldRootContext } from './NumberFieldRoot.vue'

export interface NumberFieldInputProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
import { createNumberFieldInputSurface } from './useNumberField'

withDefaults(defineProps<NumberFieldInputProps>(), {
  as: 'input',
})

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectNumberFieldRootContext()
// Same factory as `useNumberField().createInputSurface()`: owns the displayed text and IME state.
const input = createNumberFieldInputSurface(rootContext)

onMounted(() => {
  rootContext.onInputElement(currentElement.value as HTMLInputElement)
})
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
