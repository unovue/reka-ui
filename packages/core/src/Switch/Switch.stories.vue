<script setup lang="ts">
import { defineMeta } from 'sb-addon-vue-csf'

import { ref } from 'vue'
import { SwitchRoot, SwitchThumb } from '.'

const switchState = ref(true)

const { Story } = defineMeta({
  title: 'Switch/Demo',
})
</script>

<template>
  <Story
    name="Default"
    :as-child="true"
  >
    <div class="flex gap-2 items-center">
      <label
        class="text-white text-[15px] leading-none pr-[15px]"
        for="airplane-mode"
      >
        Airplane mode
      </label>
      <SwitchRoot
        id="airplane-mode"
        v-model="switchState"
        class="w-[42px] h-[25px] focus-within:outline focus-within:outline-black flex bg-black/50 shadow-sm rounded-full relative data-[state=checked]:bg-black cursor-default"
      >
        <SwitchThumb
          class="block w-[21px] h-[21px] my-auto bg-white shadow-sm rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[19px]"
        />
      </SwitchRoot>
    </div>
  </Story>
</template>
