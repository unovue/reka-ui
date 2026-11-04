<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { renderAsEmpty, rendersChildren } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectPinInputFieldSlots, injectPinInputRootContext } from './PinInputRoot.vue'
import { createPinInputInputSurface } from './usePinInput'

export interface PinInputInputProps extends PrimitiveProps {
  /** Position of the value this input binds to. */
  index: number
  /** When `true`, prevents the user from interacting with the pin input */
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'

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
// Inside a Field, the slot this input fills (read live: `index` can change).
const fieldSlots = injectPinInputFieldSlots(null)
onMounted(() => {
  fieldSlots?.set(currentElement.value, () => props.index)
  context.onInputElementChange(currentElement.value)
})
// Before unmount: the element ref is already cleared once unmounted.
onBeforeUnmount(() => {
  fieldSlots?.delete(currentElement.value)
  context.inputElements?.value.delete(currentElement.value)
})
if (fieldSlots) {
  // Followed, not read once: an as-child child replaced while this input
  // stays mounted takes over its slot and its place among the inputs, so the
  // field focuses the element that is in the document.
  watch(currentElement, (element, previous) => {
    if (previous)
      fieldSlots.delete(previous)
    if (element)
      fieldSlots.set(element, () => props.index)
    const inputs = context.inputElements?.value
    if (!inputs || !previous || !inputs.has(previous)) {
      if (element)
        context.onInputElementChange(element)
      return
    }
    const order = [...inputs]
    order.splice(order.indexOf(previous), 1, ...(element ? [element] : []))
    context.inputElements!.value = new Set(order)
  })
}
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
