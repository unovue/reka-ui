<script setup lang="ts">
import { Label, PinInputInput, PinInputRoot } from 'reka-ui'
import { ref } from 'vue'

const value = ref<string[]>([])
function handleComplete(e: string[]) {
  // eslint-disable-next-line no-alert
  alert(e.join(''))
}
</script>

<template>
  <div>
    <Label
      for="otp"
      class="text-stone-700 dark:text-white"
    >
      Pin Input
    </Label>
    <PinInputRoot
      id="otp"
      v-model="value"
      placeholder="○"
      class="flex gap-2 items-center mt-1"
      @complete="handleComplete"
    >
      <PinInputInput
        v-for="(id, index) in 5"
        :key="id"
        :index="index"
        class="w-10 h-10 bg-white rounded-lg text-center shadow-sm border text-green10 placeholder:text-mauve8 focus:shadow-[0_0_0_2px] focus:shadow-stone-800 outline-none"
      />
    </PinInputRoot>
  </div>
</template>
