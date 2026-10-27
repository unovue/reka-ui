<script setup lang="ts">
import type { Color } from 'reka-ui'
import {
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
  colorToHex,
  normalizeColor,
} from 'reka-ui'
import { computed, ref } from 'vue'
import './styles.css'

// v-model accepts a string and emits a Color object.
const color = ref<string | Color>('#56d799')
const hex = computed(() => colorToHex(normalizeColor(color.value)))
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
        :style="{ background: hex }"
      />
      <span class="ColorSliderCode">{{ hex }}</span>
    </div>
  </div>
</template>
