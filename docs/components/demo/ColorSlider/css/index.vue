<script setup lang="ts">
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const color = ref('#56d799')
</script>

<template>
  <div class="color-slider-demo">
    <ColorSliderRoot
      v-model="color"
      channel="hue"
      class="color-slider-demo__root"
    >
      <ColorSliderTrack class="color-slider-demo__track">
        <div class="color-slider-demo__track-fill" />
      </ColorSliderTrack>
      <ColorSliderThumb class="color-slider-demo__thumb" />
    </ColorSliderRoot>

    <div class="color-slider-demo__value">
      <div
        class="color-slider-demo__swatch"
        :style="{ background: color }"
      />
      <span class="color-slider-demo__code">{{ color }}</span>
    </div>
  </div>
</template>
