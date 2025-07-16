<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { ref } from 'vue'

const sliderValue = ref([50])
</script>

<template>
  <SliderRoot
    v-model="sliderValue"
    class="relative flex items-center select-none touch-none w-[200px] h-5"
    :max="100"
    :step="1"
  >
    <SliderTrack class="bg-stone-500/30 relative grow rounded-full h-2">
      <SliderRange class="absolute bg-grass8 rounded-full h-full" />
    </SliderTrack>
    <SliderThumb
      class="block w-6 h-6 bg-white rounded-full hover:bg-stone-50 shadow-sm focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-grass9"
      aria-label="Volume"
    />
  </SliderRoot>
</template>
