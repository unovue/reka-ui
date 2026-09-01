<script setup lang="ts">
import { SliderAreaArea, SliderAreaRegion, SliderAreaRoot, SliderAreaThumb } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const sliderValue = ref([[50, 50]])
</script>

<template>
  <SliderAreaRoot
    v-model="sliderValue"
    class="SliderAreaRoot"
  >
    <SliderAreaArea class="SliderAreaArea">
      <SliderAreaRegion class="SliderAreaRegion" />
    </SliderAreaArea>
    <SliderAreaThumb
      class="SliderAreaThumb"
      aria-label="Position"
    />
  </SliderAreaRoot>
</template>
