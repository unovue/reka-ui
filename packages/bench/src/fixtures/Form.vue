<script setup>
// Form: N instances of a typical composition (closed/default state)
import { FieldControl, FieldError, FieldLabel, FieldRoot, FormRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <FormRoot>
      <FieldRoot
        v-for="f in ['name', 'email', 'city']"
        :key="f"
        :name="f"
      >
        <FieldLabel>{{ f }}</FieldLabel>
        <FieldControl />
        <FieldError>Invalid</FieldError>
      </FieldRoot>
    </FormRoot>
  </div>
</template>
