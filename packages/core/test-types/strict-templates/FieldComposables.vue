<script setup lang="ts" generic="T extends string | number">
// Fixture for `tsconfig.json` here: a consumer's own Field control and form
// parts, built on the public composables, must type-check with
// `strictTemplates` against the built package. Never rendered.
import { FieldLabel, FieldRoot, FormRoot, useField, useFieldControl, useForm } from 'reka-ui'
import { useTemplateRef } from 'vue'

const props = defineProps<{ id?: string, name?: string, disabled?: boolean, required?: boolean }>()
const model = defineModel<T>({ required: true })

const element = useTemplateRef('element')
const { control, name, disabled, required, input } = useFieldControl({
  value: model,
  element,
  validityElement: element,
  id: () => props.id,
  name: () => props.name,
  disabled: () => props.disabled,
  required: () => props.required,
  isFilled: value => value !== '',
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value as T
  model.value = value
  input(value)
}

const field = useField()
const form = useForm()
</script>

<template>
  <FormRoot>
    <FieldRoot>
      <FieldLabel>Label</FieldLabel>
      <input
        ref="element"
        v-bind="control.attrs.value"
        :name="name"
        :disabled="disabled"
        :required="required"
        :value="model"
        :data-own="control.state.value.invalid"
        @input="onInput"
      >
      <output :hidden="!field.invalid.value">{{ field.errors.value[0] }}</output>
      <button
        type="button"
        :disabled="form.submitCount.value > 0"
        @click="form.validate(name) && field.focus()"
      >
        Check
      </button>
    </FieldRoot>
  </FormRoot>
</template>
