<script setup lang="ts">
import type { FieldValidityState } from './useFieldValidation'
import { injectFieldRootContext } from './FieldRoot.vue'

defineSlots<{
  default?: (props: {
    /** The field's validity. `valid` is `null` until the field has a validity to report. */
    validity: FieldValidityState
    /** All current error messages. */
    errors: string[]
    /** The first error message, or an empty string. */
    error: string
    /** The value validity was last computed for. */
    value: unknown
    /** The control's initial value. */
    initialValue: unknown
  }) => any
}>()

const fieldContext = injectFieldRootContext()
</script>

<template>
  <slot
    :validity="fieldContext.validity.value"
    :errors="fieldContext.errors.value"
    :error="fieldContext.errors.value[0] ?? ''"
    :value="fieldContext.value.value"
    :initial-value="fieldContext.initialValue.value"
  />
</template>
