<script setup>
// PinInput: N instances of a typical composition (closed/default state)
import { PinInputInput, PinInputRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <PinInputRoot>
      <PinInputInput
        v-for="(id, index) in 4"
        :key="id"
        :index="index"
      />
    </PinInputRoot>
  </div>
</template>
