<script setup>
// ComboboxLong: N open 1,000-item comboboxes with an input. The input keeps the
// listbox's tabindex constant, so a selection plus the pointer leaving the list
// must not re-render the content. The items sit directly in the content, not a
// viewport, so that a re-render of the content reaches all of them.
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxItemIndicator, ComboboxRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 2 } })
const opts = Array.from({ length: 1000 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }))
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ComboboxRoot :open="true">
      <ComboboxAnchor>
        <ComboboxInput placeholder="Option" />
      </ComboboxAnchor>
      <ComboboxContent>
        <ComboboxItem
          v-for="o in opts"
          :key="o.value"
          :value="o.value"
          :text-value="o.label"
        >
          <span>{{ o.label }}</span><ComboboxItemIndicator>✓</ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxContent>
    </ComboboxRoot>
  </div>
</template>
