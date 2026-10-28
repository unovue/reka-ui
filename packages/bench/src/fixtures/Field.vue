<script setup>
// Field: N instances of a typical composition (closed/default state)
import { FieldControl, FieldDescription, FieldError, FieldLabel, FieldRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <FieldRoot :name="`f${i}`">
      <FieldLabel>Email</FieldLabel>
      <FieldControl type="email" />
      <FieldDescription>We never share it.</FieldDescription>
      <FieldError>Invalid</FieldError>
    </FieldRoot>
  </div>
</template>
