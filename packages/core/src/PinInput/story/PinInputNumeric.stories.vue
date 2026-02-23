<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { ref } from 'vue'
import { PinInputInput, PinInputRoot } from '..'

const value = ref<number[]>([])

const { Story } = defineMeta({
  title: 'PinInput/Numeric',
})
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <PinInputRoot
      v-model="value"
      class="flex gap-2 items-center"
      type="number"
      :otp="true"
      @complete="e => console.log(e.join(''))"
    >
      <PinInputInput
        v-for="(id, index) in 5"
        :key="id"
        class="w-10 h-10 rounded text-center text-green10 placeholder:text-mauve5"
        :index="index"
      />
    </PinInputRoot>
  </Story>
</template>
