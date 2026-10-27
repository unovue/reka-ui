<script setup lang="ts">
import type { Color } from 'reka-ui'
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
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
  <div class="ColorAreaDemo">
    <div class="ColorAreaValue">
      Current: {{ hex }}
    </div>

    <ColorAreaRoot
      v-slot="{ style }"
      v-model="color"
      class="ColorAreaRoot"
    >
      <ColorAreaArea
        class="ColorAreaArea"
        :style="style"
      >
        <ColorAreaThumb class="ColorAreaThumb" />
      </ColorAreaArea>
    </ColorAreaRoot>
  </div>
</template>
