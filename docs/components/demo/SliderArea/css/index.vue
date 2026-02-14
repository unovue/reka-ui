<script setup lang="ts">
import { SliderAreaRegion, SliderAreaRoot, SliderAreaThumb, SliderAreaThumbX, SliderAreaThumbY, SliderAreaTrack } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const sliderValue = ref([[50, 50]])
</script>

<template>
  <SliderAreaRoot
    v-model="sliderValue"
    class="SliderAreaRoot"
  >
    <SliderAreaTrack class="SliderAreaTrack">
      <SliderAreaRegion class="SliderAreaRegion" />
    </SliderAreaTrack>
    <SliderAreaThumb
      class="SliderAreaThumb"
      aria-label="Volume"
    >
      <SliderAreaThumbX />
      <SliderAreaThumbY />
    </SliderAreaThumb>
  </SliderAreaRoot>
</template>
