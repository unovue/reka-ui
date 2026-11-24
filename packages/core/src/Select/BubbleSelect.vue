<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
const selectElement = ref<HTMLElement>()
const rootContext = injectSelectRootContext()

// A `multiple` selection lives on the `option`s (`selected`, bound by `SelectRoot`),
// so `value` is not bound: an array would be stringified into one value no option has.
const selectProps = computed(() => {
  if (!props.multiple)
    return props
  const { value: _value, ...rest } = props
  return rest
})

// This would bubble "change" event to form, with the target as Select element.
// A `multiple` select dispatches it once its options' `selected` is patched, so a
// `change` listener reads the new selection.
watch(() => props.value, (cur, prev) => {
  const selectProto = window.HTMLSelectElement.prototype
  const descriptor = Object.getOwnPropertyDescriptor(
    selectProto,
    'value',
  ) as PropertyDescriptor
  const setValue = descriptor.set
  if (cur !== prev && setValue && selectElement.value) {
    const event = new Event('change', { bubbles: true })
    if (!props.multiple)
      setValue.call(selectElement.value, cur)
    selectElement.value.dispatchEvent(event)
  }
}, { flush: props.multiple ? 'post' : 'pre' })

defineExpose({ selectElement })

/**
 * Form autofill will trigger an `input` event on the `select` element.
 * We listen to that event and update our internal state to support it.
 */
function handleInput(event: Event) {
  rootContext.onValueChange((event.target as HTMLSelectElement).value)
}

/**
 * We purposefully use a `select` here to support form autofill as much
 * as possible.
 *
 * We purposefully do not add the `value` attribute here to allow the value
 * to be set programmatically and bubble to any parent form `onChange` event.
 *
 * We use `VisuallyHidden` rather than `display: "none"` because Safari autofill
 * won't work otherwise.
 *
 * Use the form field name as a default label for checkers that also inspect
 * aria-hidden controls.
 */
</script>

<template>
  <VisuallyHidden
    as-child
    :aria-label="name || undefined"
  >
    <select
      ref="selectElement"
      v-bind="selectProps"
      @input="handleInput"
    >
      <slot />
    </select>
  </VisuallyHidden>
</template>
