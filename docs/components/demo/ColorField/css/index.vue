<script setup lang="ts">
import type { Color } from 'reka-ui'
import {
  ColorFieldInput,
  ColorFieldRoot,
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
  <div class="ColorFieldDemo">
    <ColorFieldRoot
      v-model="color"
      class="ColorFieldRoot"
    >
      <label class="ColorFieldLabel">
        Color
      </label>
      <div class="ColorFieldControl">
        <div
          class="ColorFieldSwatch"
          :style="{ background: hex }"
        />
        <ColorFieldInput class="ColorFieldInput" />
      </div>
    </ColorFieldRoot>
  </div>
</template>
