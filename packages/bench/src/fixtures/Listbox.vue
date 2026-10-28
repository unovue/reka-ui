<script setup>
// Listbox: N instances of a typical composition (closed/default state)
import { ListboxContent, ListboxItem, ListboxItemIndicator, ListboxRoot } from 'reka-ui'

defineProps({ n: { type: Number, default: 100 } })
const opts = ['Apple', 'Banana', 'Cherry', 'Grape', 'Melon']
</script>

<template>
  <div
    v-for="i in n"
    :key="i"
    class="ci"
  >
    <ListboxRoot>
      <ListboxContent>
        <ListboxItem
          v-for="o in opts"
          :key="o"
          :value="o"
        >
          {{ o }}<ListboxItemIndicator>✓</ListboxItemIndicator>
        </ListboxItem>
      </ListboxContent>
    </ListboxRoot>
  </div>
</template>
