<script setup lang="ts">
import { defineMeta } from 'addon-vue-csf'

import { ref } from 'vue'
import { Label } from '@/Label'
import { PinInputInput, PinInputRoot } from '..'

const value = ref<string[]>([])

const { Story } = defineMeta({
  title: 'PinInput/Default',
})
</script>

<template>
  <Story
    name="default"
    as-child
  >
    <div>
      <Label for="otp">Input label</Label>

      <PinInputRoot
        id="otp"
        v-model="value"
        class="flex gap-2 items-center"
        @complete="e => console.log(e.join(''))"
      >
        <PinInputInput
          v-for="(id, index) in 5"
          :key="id"
          class="w-10 h-10 rounded text-center text-green10 placeholder:text-mauve5"
          :index="index"
        />
      </PinInputRoot>
    </div>
  </Story>
</template>
