<script setup lang="ts">
import { VisuallyHidden } from '@/VisuallyHidden'

interface BubbleSelectProps {
  autocomplete?: string
  autofocus?: boolean
  disabled?: boolean
  form?: string
  multiple?: boolean
  name?: string
  required?: boolean
  size?: number
}

const props = defineProps<BubbleSelectProps>()

const value = defineModel<any>('value')

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
      v-bind="props"
      v-model="value"
    >
      <slot />
    </select>
  </VisuallyHidden>
</template>
