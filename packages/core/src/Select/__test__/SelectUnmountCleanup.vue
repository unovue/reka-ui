<script setup lang="ts">
import { ref } from 'vue'
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

const open = ref(true)
const mounted = ref(true)
</script>

<template>
  <button @click="open = false">
    Close
  </button>
  <button @click="mounted = false">
    Unmount
  </button>

  <SelectRoot
    v-if="mounted"
    v-model:open="open"
  >
    <SelectTrigger aria-label="Fruit">
      <SelectValue placeholder="Please select a fruit" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent position="popper">
        <SelectViewport>
          <SelectItem value="apple">
            <SelectItemText>Apple</SelectItemText>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
