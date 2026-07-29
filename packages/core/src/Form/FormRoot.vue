<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardExpose } from '@/shared'

export interface FormRootProps extends PrimitiveProps {
  /**
   * A map of field `name` to server-side error message(s). Displayed by the
   * matching `FieldRoot`'s `FieldError` until the user edits that field, or a
   * new value for that key is provided.
   */
  errors?: Record<string, string | string[]>
}

export type FormRootEmits = {
  /**
   * Emitted with the native submit event once every field has validated
   * successfully. Not emitted when any field is invalid — the native
   * submission is always prevented in that case.
   */
  submit: [event: Event]
}

export interface FormRegisteredField {
  name: Ref<string | undefined>
  validateNow: () => Promise<boolean>
  focusControl: () => void
  resetField: () => void
}

export interface FormRootContext {
  serverErrors: ComputedRef<Record<string, string | string[]>>
  registerField: (field: FormRegisteredField) => () => void
}

export const [injectFormRootContext, provideFormRootContext]
  = createContext<FormRootContext>('FormRoot')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<FormRootProps>(), {
  as: 'form',
})
const emit = defineEmits<FormRootEmits>()

useForwardExpose()

const serverErrors = computed(() => props.errors ?? {})

const fields = new Set<FormRegisteredField>()

function registerField(field: FormRegisteredField) {
  fields.add(field)
  return () => {
    fields.delete(field)
  }
}

async function handleSubmit(event: Event) {
  // Always intercept: this lets us block submission for invalid fields (even
  // when validation is async) and only forward the event to the consumer
  // once every field has been confirmed valid.
  event.preventDefault()

  const results = await Promise.all(
    Array.from(fields).map(async field => ({ field, valid: await field.validateNow() })),
  )
  const firstInvalid = results.find(result => !result.valid)

  if (firstInvalid) {
    firstInvalid.field.focusControl()
    return
  }

  emit('submit', event)
}

function handleReset() {
  fields.forEach(field => field.resetField())
}

provideFormRootContext({
  serverErrors,
  registerField,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    @submit="handleSubmit"
    @reset="handleReset"
  >
    <slot />
  </Primitive>
</template>
