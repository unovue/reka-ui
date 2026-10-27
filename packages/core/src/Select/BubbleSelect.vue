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
const selectElement = ref<HTMLSelectElement>()
const rootContext = injectSelectRootContext()

// The selection lives on the `option`s (`selected`), so `value` is only
// watched, never bound: binding it would stringify object and array values.
const selectProps = computed(() => {
  const { value: _value, ...rest } = props
  return rest
})

// This would bubble "change" event to form, with the target as Select element.
// `post`: the options' `selected` state is patched first, so a `change`
// listener reads the new selection.
watch(() => props.value, (cur, prev) => {
  if (cur !== prev && selectElement.value)
    selectElement.value.dispatchEvent(new Event('change', { bubbles: true }))
}, { flush: 'post' })

/**
 * Form autofill will trigger an `input` event on the `select` element.
 * We listen to that event and update our internal state to support it.
 */
function handleInput(event: Event) {
  const select = event.target as HTMLSelectElement
  const option = select.options[select.selectedIndex] as (HTMLOptionElement & { _value?: any }) | undefined
  if (option)
    rootContext.onValueChange('_value' in option ? option._value : option.value, 'autofill', event)
}

/**
 * We purposefully use a `select` here to support form autofill as much
 * as possible.
 *
 * We use `VisuallyHidden` rather than `display: "none"` because Safari autofill
 * won't work otherwise.
 */
</script>

<template>
  <VisuallyHidden as-child>
    <select
      ref="selectElement"
      v-bind="selectProps"
      @input="handleInput"
    >
      <slot />
    </select>
  </VisuallyHidden>
</template>
