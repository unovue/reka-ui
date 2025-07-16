<script setup lang="ts">
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const radioStateSingle = ref('default')
</script>

<template>
  <RadioGroupRoot
    v-model="radioStateSingle"
    class="RadioGroupRoot"
    default-value="default"
    aria-label="View density"
  >
    <div :style="{ display: 'flex', alignItems: 'center' }">
      <RadioGroupItem
        id="r1"
        class="RadioGroupItem"
        value="default"
      >
        <RadioGroupIndicator
          class="RadioGroupIndicator"
        />
      </RadioGroupItem>
      <label
        class="Label"
        for="r1"
      >
        Default
      </label>
    </div>
    <div :style="{ display: 'flex', alignItems: 'center' }">
      <RadioGroupItem
        id="r2"
        class="RadioGroupItem"
        value="comfortable"
      >
        <RadioGroupIndicator
          class="RadioGroupIndicator"
        />
      </RadioGroupItem>
      <label
        class="Label"
        for="r2"
      >
        Comfortable
      </label>
    </div>
    <div :style="{ display: 'flex', alignItems: 'center' }">
      <RadioGroupItem
        id="r3"
        class="RadioGroupItem"
        value="compact"
      >
        <RadioGroupIndicator
          class="RadioGroupIndicator"
        />
      </RadioGroupItem>
      <label
        class="Label"
        for="r3"
      >
        Compact
      </label>
    </div>
  </RadioGroupRoot>
</template>
