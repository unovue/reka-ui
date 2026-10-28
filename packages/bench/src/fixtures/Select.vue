<script setup>
// Select: N instances of a typical composition (closed/default state)
import { SelectContent, SelectIcon, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
const opts = ['Apple', 'Banana', 'Cherry', 'Grape', 'Melon']
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <SelectRoot>
      <SelectTrigger class="trg">
        <SelectValue placeholder="Pick" /><SelectIcon>v</SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <SelectViewport>
            <SelectItem
              v-for="o in opts"
              :key="o"
              :value="o"
            >
              <SelectItemText>{{ o }}</SelectItemText><SelectItemIndicator>✓</SelectItemIndicator>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>
