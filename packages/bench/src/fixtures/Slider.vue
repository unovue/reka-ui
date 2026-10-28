<script setup>
// Slider: N instances of a typical composition (closed/default state)
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <SliderRoot
      :default-value="[50]"
      class="slider"
    >
      <SliderTrack><SliderRange /></SliderTrack><SliderThumb />
    </SliderRoot>
  </div>
</template>
