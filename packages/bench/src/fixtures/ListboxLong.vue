<script setup>
// ListboxLong: N instances of a 1,000-item listbox (a `v-for` over data, as an
// app writes it). Its update is a selection plus the pointer leaving the
// list: each must re-render only the items it flips, not the whole list.
import { ListboxContent, ListboxItem, ListboxItemIndicator, ListboxRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 2 } })
const opts = Array.from({ length: 1000 }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }))
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ListboxRoot highlight-on-hover>
      <ListboxContent>
        <ListboxItem
          v-for="o in opts"
          :key="o.value"
          :value="o.value"
        >
          <span>{{ o.label }}</span><ListboxItemIndicator>✓</ListboxItemIndicator>
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </div>
</template>
