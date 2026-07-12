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
  <div class="color-area-demo">
    <div class="color-area-demo__value">
      Current: {{ color }}
    </div>

    <ColorAreaRoot
      v-slot="{ style }"
      v-model="color"
      class="color-area-demo__root"
    >
      <ColorAreaArea
        class="color-area-demo__area"
        :style="style"
      >
        <ColorAreaThumb class="color-area-demo__thumb" />
      </ColorAreaArea>
    </ColorAreaRoot>
  </div>
</template>
