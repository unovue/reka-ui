<script lang="ts">
export interface VisuallyHiddenInputBubbleProps<T> {
  name: string
  value: T
  checked?: boolean
  required?: boolean
  disabled?: boolean
  feature?: VisuallyHiddenProps['feature']
}
</script>

<script setup lang="ts" generic="T">
import type { VisuallyHiddenProps } from './VisuallyHidden.vue'
import { computed, watch } from 'vue'
import { usePrimitiveElement } from '@/Primitive'
import VisuallyHidden from './VisuallyHidden.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<VisuallyHiddenInputBubbleProps<T>>(), {
  feature: 'fully-hidden',
  checked: undefined,
})

const { primitiveElement, currentElement } = usePrimitiveElement()
const valueState = computed(() => props.checked ?? props.value)

watch(valueState, (cur, prev) => {
  if (!currentElement.value)
    return

  const input = currentElement.value as HTMLInputElement
  const inputProto = window.HTMLInputElement.prototype
  // A checkable input changes its `checked` state; writing the state to `value`
  // would replace the value the form submits.
  const property = props.checked === undefined ? 'value' : 'checked'
  const descriptor = Object.getOwnPropertyDescriptor(inputProto, property) as PropertyDescriptor
  const setValue = descriptor.set
  if (setValue && cur !== prev) {
    const inputEvent = new Event('input', { bubbles: true })
    const changeEvent = new Event('change', { bubbles: true })
    setValue.call(input, cur)
    input.dispatchEvent(inputEvent)
    input.dispatchEvent(changeEvent)
  }
}, { flush: 'post' })
</script>

<template>
  <VisuallyHidden
    ref="primitiveElement"
    v-bind="{ ...props, ...$attrs }"
    as="input"
  />
</template>
