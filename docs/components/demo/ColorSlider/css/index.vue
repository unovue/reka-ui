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
  <div class="ColorSliderDemo">
    <ColorSliderRoot
      v-model="color"
      channel="hue"
      class="ColorSliderRoot"
    >
      <ColorSliderTrack class="ColorSliderTrack">
        <div class="ColorSliderTrackFill" />
      </ColorSliderTrack>
      <ColorSliderThumb class="ColorSliderThumb" />
    </ColorSliderRoot>

    <div class="ColorSliderValue">
      <div
        class="ColorSliderSwatch"
        :style="{ background: color }"
      />
      <span class="ColorSliderCode">{{ color }}</span>
    </div>
  </div>
</template>
