<script setup lang="ts">
import { ComboboxAnchor, ComboboxCancel, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '..'

defineProps<{ options: string[], position?: 'inline' | 'popper' }>()
</script>

<template>
  <ComboboxRoot>
    <ComboboxAnchor>
      <ComboboxInput />
      <ComboboxTrigger>Open</ComboboxTrigger>
      <ComboboxCancel>Clear</ComboboxCancel>
    </ComboboxAnchor>
    <ComboboxPortal>
      <ComboboxContent :position="position">
        <ComboboxViewport>
          <ComboboxEmpty>No results</ComboboxEmpty>
          <ComboboxItem
            v-for="option in options"
            :key="option"
            :value="option"
          >
            {{ option }}
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
