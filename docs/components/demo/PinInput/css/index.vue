<script setup lang="ts">
import { Label, PinInputInput, PinInputRoot } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const value = ref<string[]>([])
function handleComplete(e: string[]) {
  // eslint-disable-next-line no-alert
  alert(e.join(''))
}
</script>

<template>
  <div>
    <Label
      for="pin-input"
      class="Text"
    >Pin Input</Label>
    <PinInputRoot
      id="pin-input"
      v-model="value"
      class="PinInputRoot"
      @complete="handleComplete"
    >
      <PinInputInput
        v-for="(id, index) in 5"
        :key="id"
        :index="index"
        placeholder="○"
        class="PinInputInput"
      />
    </PinInputRoot>
  </div>
</template>
