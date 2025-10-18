<script setup lang="ts">
import { reactiveOmit } from '@vueuse/shared'
import { ref, watch } from 'vue'
import { VisuallyHidden } from '@/VisuallyHidden'
import { injectSelectRootContext } from './SelectRoot.vue'

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
const rootContext = injectSelectRootContext()

const customValue = ref<any>(props.value)

watch(
  customValue,
  (cur, prev) => {
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

      rootContext.onValueChange(cur)
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
