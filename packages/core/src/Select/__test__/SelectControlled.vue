<script setup lang="ts">
import {
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from '..'

// Keyed by value on purpose: `_SelectTest.vue` keys its `v-for` by index, which
// keeps a `SelectItem` mounted while its value changes underneath it. Since
// `SelectItemText` only registers on mount, `optionsSet` then holds an entry
// that no longer matches any rendered item.
defineProps<{ modelValue?: string, options: string[] }>()
</script>

<template>
  <div>
    <SelectRoot :model-value="modelValue">
      <SelectTrigger aria-label="Customise options">
        <SelectValue placeholder="Please select a fruit" />
      </SelectTrigger>

      <SelectPortal to="#here">
        <SelectContent>
          <SelectViewport>
            <SelectItem
              v-for="option in options"
              :key="option"
              :value="option"
            >
              <SelectItemText>{{ option }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>

    <div id="here" />
  </div>
</template>
