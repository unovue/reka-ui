<script setup lang="ts">
import { SliderAreaArea, SliderAreaRegion, SliderAreaRoot, SliderAreaThumb } from 'reka-ui'
import { ref } from 'vue'

const sliderValue = ref([[50, 50]])
</script>

<template>
  <SliderAreaRoot
    v-model="sliderValue"
    class="relative block select-none touch-none w-[200px] h-[200px]"
    :max-x="100"
    :max-y="100"
    :step-x="1"
    :step-y="1"
  >
    <SliderAreaArea class="bg-stone-500/30 block relative w-full h-full overflow-hidden rounded-md">
      <SliderAreaRegion class="bg-grass8 rounded-sm" />
    </SliderAreaArea>
    <SliderAreaThumb
      class="block w-6 h-6 bg-white rounded-full hover:bg-stone-50 shadow-sm focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-grass9"
      aria-label="Position"
    />
  </SliderAreaRoot>
</template>
