<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed } from 'vue'
import { useForwardElement } from '@/shared'
import { injectNumberFieldRootContext } from './NumberFieldRoot.vue'
import { getNumberFieldButtonSurface, isNumberFieldButtonDisabled } from './useNumberField'
import { usePressedHold } from './utils'

export interface NumberFieldIncrementProps extends PrimitiveProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<NumberFieldIncrementProps>(), {
  as: 'button',
})

const rootContext = injectNumberFieldRootContext()
const isDisabled = computed(() => isNumberFieldButtonDisabled(rootContext, 'increase', props.disabled))

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
// Press-and-hold repeat (window pointer listeners) stays in the shell.
const { isPressed, onTrigger } = usePressedHold({ target: currentElement, disabled: isDisabled })
const button = getNumberFieldButtonSurface(rootContext, 'increase', { disabled: () => props.disabled, pressed: isPressed })

onTrigger((event) => {
  rootContext.handleIncrease(1, 'increment-press', event)
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="button.attrs.value"
  >
    <slot />
  </Primitive>
</template>
