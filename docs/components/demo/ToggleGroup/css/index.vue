<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { ref } from 'vue'
import './styles.css'

const toggleStateSingle = ref('left')
const toggleStateMultiple = ref(['italic'])
</script>

<template>
  <div>
    <ToggleGroupRoot
      v-model="toggleStateSingle"
      type="single"
      class="ToggleGroup"
    >
      <ToggleGroupItem
        value="left"
        aria-label="Toggle italic"
        class="ToggleGroupItem"
      >
        <Icon icon="radix-icons:text-align-left" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="center"
        aria-label="Toggle italic"
        class="ToggleGroupItem"
      >
        <Icon icon="radix-icons:text-align-center" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="right"
        aria-label="Toggle italic"
        class="ToggleGroupItem"
      >
        <Icon icon="radix-icons:text-align-right" />
      </ToggleGroupItem>
    </ToggleGroupRoot>
    <br>
    <ToggleGroupRoot
      v-model="toggleStateMultiple"
      type="multiple"
      class="ToggleGroup"
    >
      <ToggleGroupItem
        value="bold"
        aria-label="Toggle italic"
        class="ToggleGroupItem"
      >
        <Icon icon="radix-icons:font-bold" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="italic"
        aria-label="Toggle italic"
        class="ToggleGroupItem"
      >
        <Icon icon="radix-icons:font-italic" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="strikethrough"
        aria-label="Toggle italic"
        class="ToggleGroupItem"
      >
        <Icon icon="radix-icons:strikethrough" />
      </ToggleGroupItem>
    </ToggleGroupRoot>
  </div>
</template>
