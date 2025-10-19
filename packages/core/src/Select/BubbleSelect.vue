<script setup lang="ts">
import { reactiveOmit } from '@vueuse/shared'
import { ref, watch } from 'vue'
import VisuallyHidden from '@/VisuallyHidden/VisuallyHidden.vue'

interface BubbleSelectProps {
  autocomplete?: string
  autofocus?: boolean
  disabled?: boolean
  form?: string
  multiple?: boolean
  name?: string
  required?: boolean
  size?: number
  value?: any
}

const props = defineProps<BubbleSelectProps>()

const delegated = reactiveOmit(props, 'value')

const selectElement = ref<HTMLElement>()

const customValue = ref<any>(props.value)

function haveSameElements<T extends unknown[]>(a: T, b: T): boolean {
  if (a.length !== b.length)
    return false

  const setA = new Set(a)
  const setB = new Set(b)
  if (setA.size !== setB.size)
    return false

  for (const value of setA) {
    if (!setB.has(value))
      return false
  }

  return true
}

watch(
  () => props.value,
  (cur, prev) => {
    const areArrays = Array.isArray(cur) && Array.isArray(prev)
    const changed = areArrays ? !haveSameElements(cur, prev) : cur !== prev

    if (changed) {
      const selectProto = window.HTMLSelectElement.prototype
      const descriptor = Object.getOwnPropertyDescriptor(
        selectProto,
        'value',
      ) as PropertyDescriptor

      const setValue = descriptor.set
      if (cur !== prev && setValue && selectElement.value) {
        const event = new Event('change', { bubbles: true })
        setValue.call(selectElement.value, cur)
        selectElement.value.dispatchEvent(event)
      }
    }
  },
)

/**
 * We purposefully use a `select` here to support form autofill as much
 * as possible.
 *
 * We purposefully do not add the `value` attribute here to allow the value
 * to be set programmatically and bubble to any parent form `onChange` event.
 *
 * We use `VisuallyHidden` rather than `display: "none"` because Safari autofill
 * won't work otherwise.
 */
</script>

<template>
  <VisuallyHidden as-child>
    <select
      ref="selectElement"
      v-bind="delegated"
      v-model="customValue"
    >
      <slot />
    </select>
  </VisuallyHidden>
</template>
