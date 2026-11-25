<script setup vapor lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '#reka'
import { ref } from 'vue'

const value = ref([20])
const range = ref([20, 60])
defineExpose({ value, range })
</script>

<template>
  <form
    id="form"
    @submit.prevent
  >
    <SliderRoot
      id="slider"
      v-model="value"
      name="volume"
      :max="100"
      :step="10"
      style="position: relative; display: flex; align-items: center; width: 200px; height: 20px"
    >
      <SliderTrack
        id="track"
        style="position: relative; flex-grow: 1; height: 4px; background: #ccc"
      >
        <SliderRange
          id="range"
          style="position: absolute; height: 100%; background: #333"
        />
      </SliderTrack>
      <SliderThumb
        id="thumb"
        aria-label="Volume"
        style="display: block; width: 16px; height: 16px; background: #000"
      />
    </SliderRoot>
  </form>
  <span id="value">{{ value.join() }}</span>

  <SliderRoot
    v-model="range"
    :min-steps-between-thumbs="1"
    style="position: relative; display: flex; width: 200px; height: 20px"
  >
    <SliderTrack style="position: relative; flex-grow: 1; height: 4px">
      <SliderRange />
    </SliderTrack>
    <!-- asChild, both forms -->
    <SliderThumb as-child>
      <span
        id="thumb-adopted"
        aria-label="Minimum"
        data-state="mine"
        style="display: block; width: 16px; height: 16px"
      />
    </SliderThumb>
    <SliderThumb
      v-slot="{ props }"
      as-child
    >
      <span
        v-bind="props"
        id="thumb-slotted"
        aria-label="Maximum"
        style="display: block; width: 16px; height: 16px"
      />
    </SliderThumb>
  </SliderRoot>
  <span id="range-value">{{ range.join() }}</span>
</template>
