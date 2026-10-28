<script setup>
// ToggleGroup: N instances of a typical composition (closed/default state)
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ToggleGroupRoot
      type="single"
      default-value="l"
    >
      <ToggleGroupItem
        v-for="v in ['l', 'c', 'r']"
        :key="v"
        :value="v"
      >
        {{ v }}
      </ToggleGroupItem>
    </ToggleGroupRoot>
  </div>
</template>
