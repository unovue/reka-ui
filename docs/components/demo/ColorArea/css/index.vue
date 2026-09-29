<script setup lang="ts">
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
} from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const color = ref('#56d799')
</script>

<template>
  <div class="ColorAreaDemo">
    <div class="ColorAreaValue">
      Current: {{ color }}
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
