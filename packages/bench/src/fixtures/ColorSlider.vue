<script setup>
// ColorSlider: N instances of a typical composition (closed/default state)
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ColorSliderRoot
      default-value="#ff0000"
      channel="hue"
      color-space="hsl"
      class="cslider"
    >
      <ColorSliderTrack /><ColorSliderThumb />
    </ColorSliderRoot>
  </div>
</template>
