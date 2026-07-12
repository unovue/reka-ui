<script setup lang="ts">
import {
  ColorFieldInput,
  ColorFieldRoot,
} from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const color = ref('#56d799')
</script>

<template>
  <div class="color-field-demo">
    <ColorFieldRoot
      v-model="color"
      class="color-field-demo__root"
    >
      <label class="color-field-demo__label">
        Color
      </label>
      <div class="color-field-demo__control">
        <div
          class="color-field-demo__swatch"
          :style="{ background: color }"
        />
        <ColorFieldInput class="color-field-demo__input" />
      </div>
    </ColorFieldRoot>
  </div>
</template>
