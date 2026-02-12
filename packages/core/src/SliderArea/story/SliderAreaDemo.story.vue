<script setup lang="ts">
import { ref } from 'vue'
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaTrack } from '..'

const sliderValue = ref([{ x: 50, y: 50 }])
</script>

<template>
  <Story
    title="SliderArea/Demo"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="default">
      <div>
        <SliderAreaRoot
          v-model="sliderValue"
          name="slider-area"
          class="relative block select-none touch-none w-[200px] h-[200px]"
        >
          <SliderAreaTrack class="bg-blackA10 block relative w-full h-full rounded-md">
            <SliderAreaRegion class="bg-white/25 rounded-sm" />
          </SliderAreaTrack>
          <SliderAreaThumb
            class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA8"
          />
        </SliderAreaRoot>
        <p class="mt-2 text-sm text-white">
          X: {{ sliderValue[0]?.x }}, Y: {{ sliderValue[0]?.y }}
        </p>
      </div>
    </Variant>
  </Story>
</template>
