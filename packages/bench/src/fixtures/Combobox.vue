<script setup>
// Combobox: N instances of a typical composition (closed/default state)
import { ComboboxAnchor, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
const opts = ['Apple', 'Banana', 'Cherry', 'Grape', 'Melon']
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ComboboxRoot>
      <ComboboxAnchor>
        <ComboboxInput placeholder="Fruit" />
        <ComboboxTrigger class="trg">
          v
        </ComboboxTrigger>
      </ComboboxAnchor>
      <ComboboxPortal>
        <ComboboxContent>
          <ComboboxViewport>
            <ComboboxEmpty>None</ComboboxEmpty>
            <ComboboxItem
              v-for="o in opts"
              :key="o"
              :value="o"
            >
              {{ o }}<ComboboxItemIndicator>✓</ComboboxItemIndicator>
            </ComboboxItem>
          </ComboboxViewport>
        </ComboboxContent>
      </ComboboxPortal>
    </ComboboxRoot>
  </div>
</template>
