<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { getterRef, useForwardElement } from '@/shared'
import { injectNumberFieldRootContext } from './NumberFieldRoot.vue'
import { getNumberFieldButtonSurface, isNumberFieldButtonDisabled } from './useNumberField'
import { usePressedHold } from './utils'

export interface NumberFieldIncrementProps extends PrimitiveProps {
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'

const props = withDefaults(defineProps<NumberFieldIncrementProps>(), {
  as: 'button',
})

const rootContext = injectNumberFieldRootContext()
// A getter ref over the root's cached state (the same derivation the surface reads).
const isDisabled = getterRef(() => isNumberFieldButtonDisabled(rootContext, 'increase', props.disabled))

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
// Press-and-hold repeat (window pointer listeners) stays in the shell.
// A press commits once it is released, after any hold-repeat steps (Base UI parity).
const { isPressed, onTrigger } = usePressedHold({ target: currentElement, disabled: isDisabled, onRelease: rootContext.commitValue })
const button = getNumberFieldButtonSurface(rootContext, 'increase', { disabled: () => props.disabled, pressed: isPressed })

onTrigger((event) => {
  rootContext.handleIncrease(1, 'increment-press', event)
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    v-bind="button.attrs.value"
  >
    <slot />
  </component>
</template>
