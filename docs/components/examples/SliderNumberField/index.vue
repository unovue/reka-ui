<script setup lang="ts">
import { NumberFieldInput, NumberFieldRoot, SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { ref } from 'vue'

const sliderValue = ref([20, 50])
</script>

<template>
  <div class="w-[200px] flex flex-col">
    <SliderRoot
      v-model="sliderValue"
      class="relative flex items-center select-none touch-none h-5"
      :max="100"
      :step="1"
    >
      <SliderTrack class="bg-blackA10 relative grow rounded-full h-[3px]">
        <SliderRange class="absolute bg-white rounded-full h-full" />
      </SliderTrack>
      <SliderThumb
        v-for="thumb in sliderValue.length"
        :key="thumb"
        class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
        aria-label="Volume"
      />
    </SliderRoot>

    <div class="mt-2 flex items-center justify-between">
      <NumberFieldRoot
        v-model="sliderValue[0]"
        :max="sliderValue[1]"
      >
        <NumberFieldInput class="bg-card border border-muted rounded text-foreground text-xs py-1.5 font-semibold w-12 text-center" />
      </NumberFieldRoot>
      <NumberFieldRoot
        v-model="sliderValue[1]"
        :min="sliderValue[0]"
      >
        <NumberFieldInput class="bg-card border border-muted rounded text-foreground text-xs py-1.5 font-semibold w-12 text-center" />
      </NumberFieldRoot>
    </div>
  </div>
</template>
