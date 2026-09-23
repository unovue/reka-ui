<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const sliderValue = ref([50])
</script>

<template>
  <SliderRoot
    v-model="sliderValue"
    class="SliderRoot"
    :max="100"
    :step="1"
  >
    <SliderTrack class="SliderTrack">
      <SliderRange class="SliderRange" />
    </SliderTrack>
    <SliderThumb
      class="SliderThumb"
      aria-label="Volume"
    />
  </SliderRoot>
</template>
