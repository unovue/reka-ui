<script setup lang="ts">
import { ref } from 'vue'
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from '..'

const sliderValue = ref([[50, 50]])
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
          <SliderAreaTrack class="bg-blackA10 block relative w-full h-full rounded-sm">
            <SliderAreaRegion class="bg-white rounded-sm" />
          </SliderAreaTrack>
          <SliderAreaThumb
            class="block w-5 h-5 bg-white shadow-[0_2px_10px] shadow-blackA7 rounded-[10px] hover:bg-violet3 focus-within:outline-none focus-within:shadow-[0_0_0_5px] focus-within:shadow-blackA8 [&>*]:outline-none"
          >
            <SliderAreaThumbX />
            <SliderAreaThumbY />
          </SliderAreaThumb>
        </SliderAreaRoot>
        <p class="mt-2 text-sm text-white">
          X: {{ sliderValue[0]?.[0] }}, Y: {{ sliderValue[0]?.[1] }}
        </p>
      </div>
    </Variant>
  </Story>
</template>
