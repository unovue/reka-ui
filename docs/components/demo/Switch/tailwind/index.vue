<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'

const switchState = ref(false)
</script>

<template>
  <div class="flex gap-2 items-center">
    <label
      class="text-stone-700 dark:text-white text-sm leading-none pr-2 select-none"
      for="airplane-mode"
    >
      Airplane mode
    </label>

    <SwitchRoot
      id="airplane-mode"
      v-model="switchState"
      class="w-[32px] h-[20px] shadow-sm flex data-[state=unchecked]:bg-stone-300 data-[state=checked]:bg-stone-800 dark:data-[state=unchecked]:bg-stone-800 dark:data-[state=checked]:bg-stone-700 border border-stone-300 data-[state=checked]:border-stone-700  dark:border-stone-700 rounded-full relative transition-[background] focus-within:outline-none focus-within:shadow-[0_0_0_1px] focus-within:border-stone-800 focus-within:shadow-stone-800"
    >
      <SwitchThumb
        class="w-3.5 h-3.5 my-auto bg-white text-xs flex items-center justify-center shadow-xl rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-full"
      />
    </SwitchRoot>
  </div>
</template>
