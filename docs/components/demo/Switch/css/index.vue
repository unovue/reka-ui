<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const switchState = ref(false)
</script>

<template>
  <div :style="{ display: 'flex', alignItems: 'center' }">
    <label
      class="Label"
      for="airplane-mode"
    >
      Airplane mode
    </label>
    <SwitchRoot
      id="airplane-mode"
      v-model="switchState"
      class="SwitchRoot"
    >
      <SwitchThumb
        class="SwitchThumb"
      />
    </SwitchRoot>
  </div>
</template>
