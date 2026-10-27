<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { onMounted } from 'vue'
import { useForwardElement } from '@/shared'
import { injectNumberFieldRootContext } from './NumberFieldRoot.vue'

export interface NumberFieldInputProps extends PrimitiveProps {
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
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
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="input.attrs.value"
  >
    <slot />
  </Primitive>
</template>
