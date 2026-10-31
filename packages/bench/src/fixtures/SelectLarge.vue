<script setup>
// SelectLarge: N closed Selects of 1,000 items each (popper position)
import { SelectContent, SelectIcon, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from 'reka-ui'

defineProps({ n: { type: Number, default: 10 } })
const opts = Array.from({ length: 1000 }, (_, i) => `Option ${i}`)
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
        <SelectContent position="popper">
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
