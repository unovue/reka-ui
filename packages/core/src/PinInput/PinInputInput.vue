<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { Primitive } from '@/Primitive'
import { useForwardElement } from '@/shared'
import { injectPinInputRootContext } from './PinInputRoot.vue'
import { createPinInputInputSurface } from './usePinInput'

export interface PinInputInputProps extends PrimitiveProps {
  /** Position of the value this input binds to. */
  index: number
  /** When `true`, prevents the user from interacting with the pin input */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(defineProps<PinInputInputProps>(), {
  as: 'input',
})

const context = injectPinInputRootContext()

const { forwardRef, currentElement, expose } = useForwardElement<HTMLInputElement>()
defineExpose(expose)

// Same factory as `usePinInput().createInputSurface` — one source for the
// attributes and every input / keyboard / paste / IME handler.
const input = createPinInputInputSurface(context, {
  index: () => props.index,
  disabled: () => props.disabled,
  element: () => currentElement.value,
})

watch(input.currentValue, input.updatePlaceholder)

// Registration lifecycle stays in the shell (it needs the mounted element).
onMounted(() => {
  context.onInputElementChange(currentElement.value)
})
onUnmounted(() => {
  context.inputElements?.value.delete(currentElement.value)
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
