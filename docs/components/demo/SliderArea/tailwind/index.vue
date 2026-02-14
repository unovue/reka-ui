<script setup lang="ts">
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from 'reka-ui'
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
    <SliderAreaTrack class="bg-stone-500/30 block relative w-full h-full overflow-hidden rounded-md">
      <SliderAreaRegion class=" bg-grass8 rounded-sm" />
    </SliderAreaTrack>
    <SliderAreaThumb
      class="[&>*]:outline-none block w-6 h-6 bg-white rounded-full hover:bg-stone-50 shadow-sm focus-within:outline-none focus-within:shadow-[0_0_0_2px] focus-within:shadow-grass9"
      aria-label="Volume"
    >
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
